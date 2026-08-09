/**
 * โมเดลจำแนกโรคข้าว — MobileNetV2 224x224 (float16, ~4.4 MB)
 * เวอร์ชันสำหรับ GitHub Pages: โหลด tfjs จาก CDN ไม่ต้องใช้ npm
 *
 * วางไฟล์โมเดลไว้ที่โฟลเดอร์ tfjs-model/ ระดับเดียวกับ index.html
 *   tfjs-model/model.json
 *   tfjs-model/group1-shard1of2.bin
 *   tfjs-model/group1-shard2of2.bin
 *   tfjs-model/labels.json
 *
 * ใช้ใน index.html:
 *   <script type="module">
 *     import { loadRiceModel, classifyLeaf } from './riceModel.js';
 *   </script>
 *
 * สำคัญ: การ normalize ([0,255] -> [-1,1]) ฝังอยู่ในกราฟโมเดลแล้ว
 * ห้าม normalize ซ้ำในฝั่ง JS ไม่งั้นภาพจะถูกแปลงสองครั้งและโมเดลจะทายมั่ว
 */
import * as tf from 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/+esm';

// path สัมพัทธ์เท่านั้น — เว็บอยู่ใต้ /smart-Rice-ai/ ถ้าขึ้นต้นด้วย /
// เบราว์เซอร์จะไปหาที่รากโดเมนแล้วได้ 404
const MODEL_URL = new URL('./tfjs-model/model.json', import.meta.url).href;
const LABELS_URL = new URL('./tfjs-model/labels.json', import.meta.url).href;

const INPUT_SIZE = 224;

/** ต่ำกว่านี้ถือว่าไม่มั่นใจพอจะให้คำแนะนำการรักษา */
const CONFIDENCE_THRESHOLD = 0.6;

/** ชื่อโรคภาษาไทยสำหรับแสดงผล — key ต้องตรงกับ labels.json */
export const DISEASE_LABELS_TH = {
  bacterial_blight: 'โรคขอบใบแห้ง',
  blast: 'โรคไหม้',
  brown_spot: 'โรคใบจุดสีน้ำตาล',
  healthy: 'ใบปกติ',
  tungro: 'โรคใบสีส้ม (ทังโกร)',
};

let model = null;
let labels = null;
let loadingPromise = null;

/**
 * โหลดโมเดล เรียกซ้ำได้ปลอดภัย
 *
 * เก็บ promise ไว้แทนการเช็คแค่ตัวแปร model เพราะถ้าผู้ใช้กดปุ่มรัวๆ
 * ตอนยังโหลดไม่เสร็จ จะเกิดการดาวน์โหลด 4.4 MB ซ้อนกันหลายรอบ
 *
 * @param {(percent: number) => void} [onProgress] callback ความคืบหน้า 0-100
 */
export async function loadRiceModel(onProgress) {
  if (model) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const [loadedModel, labelsResponse] = await Promise.all([
        tf.loadGraphModel(MODEL_URL, {
          onProgress: (fraction) => onProgress?.(Math.round(fraction * 100)),
        }),
        fetch(LABELS_URL),
      ]);

      if (!labelsResponse.ok) {
        throw new Error(`โหลด labels.json ไม่สำเร็จ (${labelsResponse.status})`);
      }

      model = loadedModel;
      labels = await labelsResponse.json();

      // warm-up: predict ครั้งแรกต้องคอมไพล์ WebGL shader ซึ่งช้าเป็นวินาที
      // ทำตั้งแต่ตอนโหลด จะได้ไม่ไปหน่วงตอนผู้ใช้ถ่ายรูปจริง
      tf.tidy(() => model.predict(tf.zeros([1, INPUT_SIZE, INPUT_SIZE, 3])));
    } catch (error) {
      loadingPromise = null; // ปล่อยให้ลองใหม่ได้ถ้าเน็ตหลุดกลางคัน
      throw error;
    }
  })();

  return loadingPromise;
}

/**
 * จำแนกโรคจากภาพใบข้าว
 *
 * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} imageElement
 * @returns {Promise<{results: Array, top: object, isConfident: boolean}>}
 */
export async function classifyLeaf(imageElement) {
  if (!model) {
    throw new Error('ต้องเรียก loadRiceModel() ก่อนใช้งาน');
  }

  // tf.tidy ปล่อย tensor กลางทางอัตโนมัติ
  // ถ้าไม่ใช้ WebGL memory จะรั่วสะสมจนแท็บค้างหลังถ่ายหลายรูป
  const input = tf.tidy(() =>
    tf.browser
      .fromPixels(imageElement)
      .resizeBilinear([INPUT_SIZE, INPUT_SIZE])
      .toFloat() // ป้อน 0-255 ตรงๆ — normalize อยู่ในกราฟแล้ว
      .expandDims(0)
  );

  let probabilities;
  try {
    const output = model.predict(input);
    probabilities = await output.data();
    output.dispose();
  } finally {
    input.dispose(); // ต้องปล่อยเสมอแม้ predict จะ throw
  }

  const results = labels
    .map((label, index) => ({
      label,
      labelTh: DISEASE_LABELS_TH[label] ?? label,
      confidence: probabilities[index],
    }))
    .sort((a, b) => b.confidence - a.confidence);

  return {
    results,
    top: results[0],
    isConfident: results[0].confidence >= CONFIDENCE_THRESHOLD,
  };
}

/** คืนหน่วยความจำ GPU เมื่อออกจากหน้าวินิจฉัย */
export function disposeRiceModel() {
  model?.dispose();
  model = null;
  labels = null;
  loadingPromise = null;
}
