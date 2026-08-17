// ============================================================
// ph-log.js — บันทึกค่า pH สองรอบและเปรียบเทียบแนวโน้ม
// ============================================================
//
// วิธีใช้: อัปไฟล์นี้ขึ้น repo แล้วเพิ่มใน index.html หลัง soil-guide.js
//
//   <script src="ph-log.js?v=1"></script>
//
// ------------------------------------------------------------
// แนวคิด
// ------------------------------------------------------------
// รอบที่ 1 วัดตอนเตรียมดิน ก่อนปลูก — เป็นค่าตั้งต้นของฤดู
// รอบที่ 2 วัดตอนบันทึกสำรวจ ระหว่างปลูก — เทียบกับรอบแรกเพื่อดูว่าเปลี่ยนไปไหม
//
// คุณค่าจริงของฟีเจอร์นี้อยู่ที่การเทียบสองรอบ ไม่ใช่การวัดครั้งเดียว
// ดินเปรี้ยวที่ใส่ปูนไปแล้ว pH ขยับขึ้นจริงหรือเปล่า
// ดินที่ใส่ยูเรียหนักติดต่อกันเป็นกรดลงหรือไม่
// การวัดครั้งเดียวตอบคำถามพวกนี้ไม่ได้เลย
//
// ------------------------------------------------------------
// สิ่งที่ไฟล์นี้จงใจไม่ทำ
// ------------------------------------------------------------
// 1. ไม่คำนวณอัตราปูนขาวจากค่า pH
//    ตามที่คอมเมนต์ใน soil-guide.js เขียนไว้ว่าอัตราที่ถูกต้องขึ้นกับ
//    ค่าความต้องการปูนซึ่งต้องส่งดินไปวิเคราะห์ การเดาจาก pH อย่างเดียว
//    อาจทำให้ใส่เกินจนดินกลายเป็นด่าง ซึ่งแก้ยากกว่าดินเปรี้ยวมาก
//
// 2. ไม่แนะนำสูตรปุ๋ยจากค่า pH
//    ตามที่คอมเมนต์ในบล็อก chem ของ fertilizer-guide.js ห้ามไว้
//    เพราะ pH บอกไม่ได้เลยว่าดินขาดธาตุอะไร ต้องมีผลวิเคราะห์ N-P-K จริง
//
// ทั้งสองข้อนี้ระบบเดิมตั้งใจไว้แล้ว ไฟล์นี้แค่ไม่ทำลายมัน
// ข้อความแปลผลทั้งหมดดึงมาจาก SOIL_GUIDE.phBands โดยตรง ไม่มีการเขียนใหม่
//
// ------------------------------------------------------------
// เรื่องที่เก็บข้อมูล อ่านก่อนใช้จริง
// ------------------------------------------------------------
// ค่าเริ่มต้นเก็บใน localStorage ของเครื่องผู้ใช้ ซึ่งหายเมื่อเปลี่ยนเครื่อง
// ล้างข้อมูลเบราว์เซอร์ หรือเปิดจากมือถืออีกเครื่อง
//
// ถ้าจะใช้จริงจัง ควรต่อกับที่เดียวกับบันทึกสำรวจ (Cloudflare Worker Field Log)
// โดยกำหนด window.PH_STORAGE ก่อนโหลดไฟล์นี้ ต้องมีสองเมธอด
//
//   window.PH_STORAGE = {
//     load: function (fieldId) { return Promise.resolve(objectหรือnull); },
//     save: function (fieldId, data) { return Promise.resolve(); }
//   };
//
// รูปแบบ data คือ { r1: {ph, date}, r2: {ph, date} }

(function (global) {
  'use strict';

  var ROUND_LABELS = {
    r1: 'รอบที่ 1 · ก่อนปลูก',
    r2: 'รอบที่ 2 · ระหว่างปลูก'
  };

  // ค่า pH ที่เป็นไปได้จริงในดินนา นอกช่วงนี้คือกรอกผิดหรือเครื่องวัดเพี้ยน
  var PH_MIN = 3;
  var PH_MAX = 10;

  // ความต่างที่ถือว่าเปลี่ยนจริง ไม่ใช่ความคลาดเคลื่อนของเครื่องวัด
  // ชุดวัดแบบน้ำยาเทียบสีอ่านละเอียดได้ราว 0.5 หน่วย เครื่องวัดแบบเข็มดีกว่านั้น
  // ตั้งไว้ที่ 0.3 เพื่อไม่ให้รายงานว่า "ดีขึ้น" จากความคลาดเคลื่อนล้วนๆ
  var MEANINGFUL_DIFF = 0.3;

  function esc(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function thaiDate(iso) {
    if (!iso) return '';
    var parts = String(iso).split('-');
    if (parts.length !== 3) return iso;
    var months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    var m = parseInt(parts[1], 10);
    if (!(m >= 1 && m <= 12)) return iso;
    return parseInt(parts[2], 10) + ' ' + months[m - 1] + ' ' + (parseInt(parts[0], 10) + 543);
  }

  // ------------------------------------------------------------
  // ที่เก็บข้อมูล — ใช้ Store เดียวกับบันทึกสำรวจ
  // ------------------------------------------------------------
  //
  // ตอนแรกตั้งใจเขียนที่เก็บแยกด้วย localStorage แต่พอดูโค้ดเดิมแล้วไม่ควรทำ
  // เพราะ Store.add() มีของที่เขียนเองแล้วจะได้ไม่ครบอยู่หลายอย่าง
  //   - ยิงขึ้น Cloudflare Worker ให้ ข้อมูลจึงไม่หายเมื่อเปลี่ยนเครื่อง
  //   - ถ้าเน็ตล่ม เก็บลงเครื่องไว้ก่อนแล้วค่อยส่งทีหลังอัตโนมัติ
  //   - จัดการ session หมดอายุและเด้งไปหน้าล็อกอินให้
  //
  // ที่สำคัญคือ entry ของบันทึกสำรวจมีช่อง ph: null เผื่อไว้อยู่แล้ว
  // แปลว่า schema เดิมออกแบบรองรับไว้ตั้งแต่แรก ไฟล์นี้แค่เติมค่าลงช่องที่มีอยู่
  // ไม่ได้สร้างที่เก็บใหม่ซ้อนขึ้นมา ค่า pH จึงไปโผล่ในทะเบียนบันทึกเหมือนข้อมูลอื่น
  //
  // ถ้าวันหลังอยากเปลี่ยนที่เก็บ กำหนด window.PH_STORAGE ที่มี load/save
  // ก่อนโหลดไฟล์นี้ ระบบจะใช้ตัวนั้นแทน
  function storeApi() {
    return global.Store || null;
  }

  function readProfileName() {
    var store = storeApi();
    try {
      return (store && store.profile && store.profile().name) || '';
    } catch (err) {
      return '';
    }
  }

  // อ่านค่า pH ที่เคยบันทึกไว้ทั้งสองรอบจากรายการบันทึกเดิม
  // ดูเฉพาะรายการที่มี phRound กำกับ เพื่อไม่ให้ปนกับรายการวินิจฉัยโรค
  // ที่อาจมีค่า ph ติดมาด้วยแต่ไม่ได้ตั้งใจบันทึกเป็นรอบวัด
  function loadRecord() {
    var store = storeApi();
    if (!store || typeof store.list !== 'function') return Promise.resolve({ r1: null, r2: null });

    return Promise.resolve()
      .then(function () { return store.list(); })
      .then(function (entries) {
        var record = { r1: null, r2: null };
        if (!Array.isArray(entries)) return record;

        // ไล่จากใหม่ไปเก่า เก็บอันแรกที่เจอของแต่ละรอบ คือค่าล่าสุดของรอบนั้น
        for (var i = 0; i < entries.length; i++) {
          var e = entries[i];
          if (!e || typeof e.ph !== 'number') continue;
          if (e.phRound === 'r1' && !record.r1) record.r1 = { ph: e.ph, date: e.date };
          if (e.phRound === 'r2' && !record.r2) record.r2 = { ph: e.ph, date: e.date };
          if (record.r1 && record.r2) break;
        }
        return record;
      })['catch'](function (err) {
        console.warn('[ph-log] อ่านบันทึกเดิมไม่สำเร็จ', err);
        return { r1: null, r2: null };
      });
  }

  function saveReading(round, ph, date) {
    var store = storeApi();
    if (!store || typeof store.add !== 'function') {
      return Promise.reject(new Error('ยังไม่พร้อมบันทึก'));
    }

    // ใส่ฟิลด์ให้ตรงกับ entry ของบันทึกสำรวจ เพื่อให้แสดงในทะเบียนได้เหมือนกัน
    // disease กับ score เว้นว่างเพราะรายการนี้ไม่ใช่การวินิจฉัยโรค
    return Promise.resolve(store.add({
      date: date,
      owner: readProfileName(),
      gps: '',
      ph: ph,
      phRound: round,
      disease: 'วัดค่า pH ดิน — ' + ROUND_LABELS[round],
      score: null,
      image: null
    }));
  }

  // ถ้ามีที่เก็บของตัวเองกำหนดไว้ ให้ใช้ตัวนั้นแทนทั้งหมด
  function customStorage() {
    return global.PH_STORAGE || null;
  }

  // ------------------------------------------------------------
  // สไตล์
  // ------------------------------------------------------------
  var CSS = [
    '.ph-card{background:#fff;border:1px solid #e3e3e0;border-radius:12px;padding:20px;margin:16px 0}',
    '.ph-head{font-size:17px;font-weight:500;color:#1a1a1a;margin-bottom:4px}',
    '.ph-sub{font-size:13px;color:#6b6b6b;margin-bottom:16px}',
    '.ph-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;align-items:end;margin-bottom:14px}',
    '.ph-field{display:flex;flex-direction:column}',
    '.ph-label{font-size:13px;color:#6b6b6b;margin-bottom:6px}',
    '.ph-input{width:100%;height:40px;padding:0 12px;font-size:15px;font-family:inherit;color:#1a1a1a;background:#fff;border:1px solid #e3e3e0;border-radius:8px;box-sizing:border-box}',
    '.ph-input:focus{outline:none;border-color:#1f7a4d;box-shadow:0 0 0 3px #eaf5ee}',
    '.ph-btn{height:40px;padding:0 20px;font-size:15px;font-family:inherit;font-weight:500;color:#fff;background:#1f7a4d;border:none;border-radius:8px;cursor:pointer}',
    '.ph-btn:hover{background:#186139}',
    '.ph-btn:disabled{background:#c8c8c4;cursor:not-allowed}',
    '.ph-err{font-size:13px;color:#b3261e;margin-bottom:12px}',
    '.ph-msg{font-size:13px;color:#1f7a4d;margin-bottom:12px}',
    '.ph-result{border-radius:8px;padding:14px 16px;margin-top:12px}',
    '.ph-result--ok{background:#eaf5ee}',
    '.ph-result--warn{background:#fdf6e7}',
    '.ph-result--bad{background:#fdeceb}',
    '.ph-value{font-size:24px;font-weight:500;color:#1a1a1a;margin-bottom:2px}',
    '.ph-title{font-size:15px;font-weight:500;color:#1a1a1a;margin-bottom:8px}',
    '.ph-say{font-size:14px;line-height:1.7;color:#3d3d3a;margin-bottom:8px}',
    '.ph-todo{font-size:14px;line-height:1.7;color:#3d3d3a}',
    '.ph-trend{background:#f7f7f5;border-radius:8px;padding:14px 16px;margin-top:12px}',
    '.ph-trend-head{font-size:14px;font-weight:500;color:#1a1a1a;margin-bottom:6px}',
    '.ph-trend-body{font-size:14px;line-height:1.7;color:#3d3d3a}',
    '.ph-note{font-size:13px;line-height:1.7;color:#6b6b6b;margin-top:12px}'
  ].join('');

  function injectStyle() {
    if (document.getElementById('ph-style')) return;
    var tag = document.createElement('style');
    tag.id = 'ph-style';
    tag.textContent = CSS;
    document.head.appendChild(tag);
  }

  // ------------------------------------------------------------
  // แปลผลและแสดง
  // ------------------------------------------------------------
  function bandHtml(ph, band) {
    if (!band) return '';
    var tone = band.key === 'ok' ? 'ok' : (band.key === 'bad' ? 'bad' : 'warn');
    return '<div class="ph-result ph-result--' + tone + '">' +
      '<div class="ph-value">pH ' + ph.toFixed(1) + '</div>' +
      '<div class="ph-title">' + esc(band.title) + '</div>' +
      '<div class="ph-say">' + esc(band.say) + '</div>' +
      '<div class="ph-todo">' + esc(band.todo) + '</div>' +
    '</div>';
  }

  // เทียบสองรอบ — จุดที่ฟีเจอร์นี้มีค่าจริง
  //
  // ไม่สรุปว่า "ดีขึ้น" หรือ "แย่ลง" จากทิศทางของตัวเลขอย่างเดียว
  // เพราะ pH ขึ้นจาก 5.0 เป็น 6.0 คือดีขึ้น แต่ขึ้นจาก 7.0 เป็น 8.0 คือแย่ลง
  // จึงต้องดูว่าเข้าใกล้หรือออกห่างจากช่วงที่เหมาะสม 5.5-6.5
  function trendHtml(before, after) {
    var diff = after - before;
    if (Math.abs(diff) < MEANINGFUL_DIFF) {
      return '<div class="ph-trend">' +
        '<div class="ph-trend-head">เทียบกับรอบก่อน</div>' +
        '<div class="ph-trend-body">ค่าใกล้เคียงเดิม (' + before.toFixed(1) + ' → ' + after.toFixed(1) + ') ' +
        'ความต่างน้อยกว่า ' + MEANINGFUL_DIFF + ' หน่วย ซึ่งอยู่ในระดับความคลาดเคลื่อนของเครื่องวัด ยังสรุปว่าดินเปลี่ยนไปไม่ได้</div>' +
      '</div>';
    }

    // ระยะห่างจากช่วงเหมาะสม 5.5-6.5 ถ้าอยู่ในช่วงถือว่าระยะเป็นศูนย์
    function distanceFromIdeal(ph) {
      if (ph < 5.5) return 5.5 - ph;
      if (ph > 6.5) return ph - 6.5;
      return 0;
    }

    var wasOff = distanceFromIdeal(before);
    var nowOff = distanceFromIdeal(after);
    var direction = diff > 0 ? 'สูงขึ้น' : 'ต่ำลง';
    var verdict;

    if (nowOff < wasOff) {
      verdict = 'เข้าใกล้ช่วงที่เหมาะกับข้าวมากขึ้น เป็นแนวโน้มที่ดี ถ้าเพิ่งปรับปรุงดินไปแสดงว่าสิ่งที่ทำได้ผล';
    } else if (nowOff > wasOff) {
      verdict = 'ออกห่างจากช่วงที่เหมาะกับข้าวมากขึ้น ควรทบทวนว่าระหว่างฤดูทำอะไรที่อาจกระทบดิน เช่นใส่ปูนหรือปุ๋ยไนโตรเจนปริมาณมาก';
    } else {
      verdict = 'ยังอยู่ในช่วงที่เหมาะกับข้าวทั้งสองรอบ';
    }

    return '<div class="ph-trend">' +
      '<div class="ph-trend-head">เทียบกับรอบก่อน</div>' +
      '<div class="ph-trend-body">' + direction + ' ' + Math.abs(diff).toFixed(1) + ' หน่วย (' +
      before.toFixed(1) + ' → ' + after.toFixed(1) + ') — ' + verdict + '</div>' +
    '</div>';
  }

  // ------------------------------------------------------------
  // วาดฟอร์ม
  // ------------------------------------------------------------
  function render(container, options) {
    if (!container) return;
    options = options || {};
    var round = options.round === 'r2' ? 'r2' : 'r1';
    var fieldId = options.fieldId || 'default';
    var uid = 'ph' + Math.random().toString(36).slice(2, 8);

    injectStyle();

    container.innerHTML =
      '<div class="ph-card">' +
        '<div class="ph-head">วัดค่า pH ดิน — ' + esc(ROUND_LABELS[round]) + '</div>' +
        '<div class="ph-sub">' +
          (round === 'r1'
            ? 'วัดก่อนเริ่มเตรียมดิน เพื่อใช้เป็นค่าตั้งต้นของฤดูนี้'
            : 'วัดซ้ำระหว่างปลูก แล้วเทียบกับค่าที่บันทึกไว้ตอนเตรียมดิน') +
        '</div>' +
        '<div class="ph-grid">' +
          '<div class="ph-field">' +
            '<label class="ph-label">ค่า pH ที่วัดได้</label>' +
            '<input type="number" id="' + uid + '-ph" class="ph-input" min="' + PH_MIN + '" max="' + PH_MAX + '" step="0.1" placeholder="เช่น 5.8">' +
          '</div>' +
          '<div class="ph-field">' +
            '<label class="ph-label">วันที่วัด</label>' +
            '<input type="date" id="' + uid + '-date" class="ph-input" value="' + todayStr() + '">' +
          '</div>' +
          '<div class="ph-field">' +
            '<button type="button" id="' + uid + '-save" class="ph-btn">บันทึก</button>' +
          '</div>' +
        '</div>' +
        '<div class="ph-err" id="' + uid + '-err" hidden></div>' +
        '<div class="ph-msg" id="' + uid + '-msg" hidden></div>' +
        '<div id="' + uid + '-out"></div>' +
        '<div class="ph-note">ค่า pH บอกได้แค่ว่าดินเป็นกรดหรือด่างระดับไหน บอกไม่ได้ว่าดินขาดธาตุอาหารอะไร ' +
        'ถ้าต้องการอัตราปูนหรือสูตรปุ๋ยที่แม่นยำ ต้องส่งดินไปวิเคราะห์ที่สถานีพัฒนาที่ดินจังหวัด</div>' +
      '</div>';

    var phInput = container.querySelector('#' + uid + '-ph');
    var dateInput = container.querySelector('#' + uid + '-date');
    var saveBtn = container.querySelector('#' + uid + '-save');
    var errBox = container.querySelector('#' + uid + '-err');
    var msgBox = container.querySelector('#' + uid + '-msg');
    var outBox = container.querySelector('#' + uid + '-out');

    var record = { r1: null, r2: null };

    function showResult(ph) {
      var reader = global.readSoilPh;
      if (typeof reader !== 'function') {
        outBox.innerHTML = '<div class="ph-note">ยังโหลด soil-guide.js ไม่สำเร็จ จึงแปลผลค่า pH ไม่ได้</div>';
        return;
      }
      var band = reader(ph);
      var html = bandHtml(ph, band);

      // เทียบสองรอบเฉพาะเมื่อเป็นรอบสองและมีค่ารอบแรกอยู่แล้ว
      if (round === 'r2' && record.r1 && typeof record.r1.ph === 'number') {
        html += trendHtml(record.r1.ph, ph);
      } else if (round === 'r2') {
        html += '<div class="ph-note">ยังไม่มีค่ารอบที่ 1 จากหน้าเตรียมดิน จึงยังเทียบแนวโน้มไม่ได้</div>';
      }
      outBox.innerHTML = html;
    }

    // แสดงผลทันทีระหว่างพิมพ์ ไม่ต้องรอกดบันทึก
    // เพราะผู้ใช้ควรเห็นว่าค่าที่วัดได้แปลว่าอะไรก่อนตัดสินใจว่าจะเก็บไว้ไหม
    phInput.addEventListener('input', function () {
      msgBox.hidden = true;
      var ph = parseFloat(phInput.value);
      if (!isFinite(ph)) {
        errBox.hidden = true;
        outBox.innerHTML = '';
        return;
      }
      if (ph < PH_MIN || ph > PH_MAX) {
        errBox.textContent = 'ค่า pH ควรอยู่ระหว่าง ' + PH_MIN + ' ถึง ' + PH_MAX + ' ลองตรวจเครื่องวัดอีกครั้ง';
        errBox.hidden = false;
        outBox.innerHTML = '';
        return;
      }
      errBox.hidden = true;
      showResult(ph);
    });

    saveBtn.addEventListener('click', function () {
      var ph = parseFloat(phInput.value);
      if (!isFinite(ph) || ph < PH_MIN || ph > PH_MAX) {
        errBox.textContent = 'กรอกค่า pH ระหว่าง ' + PH_MIN + ' ถึง ' + PH_MAX + ' ก่อนบันทึก';
        errBox.hidden = false;
        return;
      }
      errBox.hidden = true;
      var date = dateInput.value || todayStr();
      record[round] = { ph: ph, date: date };

      saveBtn.disabled = true;
      saveBtn.textContent = 'กำลังบันทึก';

      var custom = customStorage();
      var job = custom
        ? Promise.resolve(custom.save(fieldId, record))
        : saveReading(round, ph, date);

      job.then(function () {
        // แจ้งให้ตรงกับความจริง ถ้าเน็ตล่ม Store จะเก็บลงเครื่องไว้ก่อน
        // การบอกว่า "บันทึกแล้ว" เฉยๆ ทั้งที่ยังไม่ขึ้นเซิร์ฟเวอร์ทำให้เข้าใจผิด
        var store = storeApi();
        var offline = store && typeof store.isOffline === 'function' && store.isOffline();
        msgBox.textContent = offline
          ? 'บันทึกลงเครื่องแล้ว จะซิงก์ขึ้นเซิร์ฟเวอร์เมื่อเชื่อมต่อได้'
          : 'บันทึกลงทะเบียนบันทึกแล้ว';
        msgBox.hidden = false;
        showResult(ph);
      })['catch'](function (err) {
        errBox.textContent = (err && err.message) || 'บันทึกไม่สำเร็จ ค่าที่กรอกยังดูผลได้แต่จะหายเมื่อปิดหน้า';
        errBox.hidden = false;
      }).then(function () {
        saveBtn.disabled = false;
        saveBtn.textContent = 'บันทึก';
      });
    });

    // โหลดค่าเดิมมาเติมให้ ผู้ใช้จะได้ไม่ต้องกรอกซ้ำและเห็นของเก่าที่เคยบันทึก
    var custom = customStorage();
    var loader = custom ? Promise.resolve(custom.load(fieldId)) : loadRecord();

    loader.then(function (data) {
      if (data && typeof data === 'object') {
        record.r1 = data.r1 || null;
        record.r2 = data.r2 || null;
      }
      var mine = record[round];
      if (mine && typeof mine.ph === 'number') {
        phInput.value = mine.ph;
        if (mine.date) dateInput.value = mine.date;
        showResult(mine.ph);
        msgBox.textContent = 'ค่าที่บันทึกไว้เมื่อ ' + thaiDate(mine.date);
        msgBox.hidden = false;
      }
    })['catch'](function (err) {
      console.warn('[ph-log] โหลดค่าเดิมไม่สำเร็จ', err);
    });
  }

  // ------------------------------------------------------------
  // ติดตั้งอัตโนมัติ
  // ------------------------------------------------------------
  //
  // วิธีที่แน่นอนที่สุดคือวาง div ไว้เองในหน้า แล้วไฟล์นี้จะเจอ
  //   <div id="ph-log-1"></div>   ในหน้าเตรียมดิน
  //   <div id="ph-log-2"></div>   ในหน้าบันทึกสำรวจ
  //
  // ถ้าไม่ได้วางไว้ จะใช้วิธีสำรองคือหาหัวข้อหน้าแล้วต่อท้ายเนื้อหา
  // ซึ่งพึ่งข้อความบนหน้าจอ จึงเปราะกว่าและอาจวางผิดที่ถ้าโครงสร้างหน้าเปลี่ยน
  function currentFieldId() {
    return global.CURRENT_FIELD_ID || 'default';
  }

  function findByHeading(titleText) {
    var nodes = document.querySelectorAll('h1,h2');
    for (var i = 0; i < nodes.length; i++) {
      if ((nodes[i].textContent || '').trim() === titleText) return nodes[i];
    }
    return null;
  }

  function mountRound(round, anchorTitle, slotId) {
    var slot = document.getElementById(slotId);
    if (slot) {
      if (slot.dataset.phMounted === '1') return;
      slot.dataset.phMounted = '1';
      render(slot, { round: round, fieldId: currentFieldId() });
      return;
    }

    var heading = findByHeading(anchorTitle);
    if (!heading) return;

    // หาคอนเทนเนอร์เนื้อหาของหน้า แล้วต่อท้าย
    var host = heading.closest('main, section, article') || heading.parentElement;
    if (!host || host.dataset.phMounted === '1') return;
    host.dataset.phMounted = '1';

    var box = document.createElement('div');
    host.appendChild(box);
    render(box, { round: round, fieldId: currentFieldId() });
  }

  function tryMount() {
    mountRound('r1', 'เตรียมดิน', 'ph-log-1');
    mountRound('r2', 'บันทึกสำรวจ', 'ph-log-2');
  }

  function start() {
    injectStyle();
    tryMount();

    if (typeof MutationObserver === 'function') {
      var pending = null;
      var observer = new MutationObserver(function () {
        if (pending) clearTimeout(pending);
        pending = setTimeout(tryMount, 150);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  global.PhLog = { render: render };
})(window);
