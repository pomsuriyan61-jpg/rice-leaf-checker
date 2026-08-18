/**
 * pest-page.js — หน้า "แมลงศัตรูข้าว" สำหรับ SmartRice AI
 *
 * ทำไมไม่มีภาพ: ภาพวาดลายเส้นแยกชนิดที่หน้าตาคล้ายกันไม่ได้เลย
 * เพลี้ยกระโดดสีน้ำตาลกับหลังขาวรูปร่างเหมือนกันเป๊ะ ต่างที่แถบสีบนหลัง
 * ภาพวาดจึงทำให้ผู้ใช้สรุปผิดชนิดแล้วซื้อสารผิดตัว
 * คำบรรยายอย่าง "มีแถบขาวพาดกลางหลัง" แยกได้ตรงกว่าและไฟล์เบากว่ามาก
 * ซึ่งสำคัญเมื่อเกษตรกรเปิดเว็บกลางนาด้วยสัญญาณอ่อน
 *
 * ข้อมูลหลักมาจาก window.PEST_GUIDE (pest-guide.js)
 * ส่วนที่ไฟล์นี้เพิ่มเองมี 2 อย่างคือระดับความอันตรายและคำบรรยายลักษณะ
 * ทั้งสองอย่างติดป้ายกำกับไว้ในหน้าเว็บ เพื่อให้แยกออกว่าอันไหนมาจากเอกสารทางการ
 *
 * วิธีเชื่อมกับ index.html ดูท้ายไฟล์
 */
(function () {
"use strict";

// ══════════════════════════════════════════════════════════
// ระดับอันตราย
//
// pest-guide.js ไม่มีฟิลด์นี้ จึงต้องจัดระดับที่นี่
// เกณฑ์ที่ใช้ ไม่ใช่ "น่ากลัวแค่ไหน" แต่เป็น 3 ข้อที่วัดได้จากผลเสียจริง
//   1. ทำให้ข้าวตายทั้งกอหรือทั้งหย่อมได้ไหม ไม่ใช่แค่ใบเสียหาย
//   2. เป็นตัวพาโรคมาไวรัสที่รักษาไม่ได้ไหม
//   3. ระบาดข้ามแปลงเร็วจนเพื่อนบ้านเสียหายตามไหม
//
// เขียนเหตุผลกำกับทุกตัวโดยตั้งใจ เพื่อให้ผู้ใช้และเจ้าหน้าที่เกษตรตรวจสอบได้
// ระบบที่บอกว่า "อันตรายสูง" เฉยๆ โดยไม่บอกเหตุผล เชื่อถือไม่ได้และแก้ไม่ได้เมื่อผิด
// ══════════════════════════════════════════════════════════

const LEVELS = {
  high: { word: "อันตรายสูง",      tone: "bad",  act: "ต้องลงไปดูแปลงภายในวันนี้" },
  mid:  { word: "อันตรายปานกลาง", tone: "warn", act: "เดินสำรวจแปลงสัปดาห์นี้ แล้วนับจำนวนก่อนตัดสินใจ" },
  low:  { word: "อันตรายต่ำ",      tone: "ok",   act: "เฝ้าดูตามปกติ ยังไม่ต้องทำอะไรเป็นพิเศษ" },
};

// key ต้องตรงกับ key ใน PEST_GUIDE.pests
//
// look  = ลักษณะตัวแมลงที่มองเห็นด้วยตาเปล่าในแปลง
//         เน้นจุดที่ใช้แยกจากชนิดที่คล้ายกันเป็นหลัก ไม่ใช่บรรยายให้ครบทุกส่วน
//         เพราะเกษตรกรที่ยืนอยู่ในนาต้องการคำที่ชี้เป้าได้ใน 5 วินาที
// where = ตำแหน่งที่มักเจอตัวมันบนต้นข้าว ซึ่งเป็นตัวแยกที่ดีพอๆ กับรูปร่าง
const INFO = {
  bph: {
    level: "high",
    why: "ดูดน้ำเลี้ยงจนข้าวแห้งตายเป็นหย่อมทั้งกอ เรียกว่าอาการไหม้เป็นหย่อม " +
         "และยังเป็นตัวพาโรคโรคใบหงิกด้วย ระบาดข้ามแปลงเร็วมาก " +
         "เป็นแมลงที่สร้างความเสียหายให้นาข้าวไทยมากที่สุดในรอบหลายสิบปี",
    look: "ตัวเล็กมาก ยาวราว 3-4 มิลลิเมตร สีน้ำตาลอ่อนถึงน้ำตาลเข้มทั้งตัว ไม่มีแถบสีอื่น " +
          "ปีกใสคลุมยาวเลยปลายท้อง กระโดดหนีทันทีเมื่อเอามือแหวกกอ",
    where: "อยู่ที่โคนต้นเหนือผิวน้ำเล็กน้อย ต้องแหวกกอก้มดูถึงจะเห็น ไม่ได้อยู่บนใบ",
  },
  wbph: {
    level: "high",
    why: "ทำลายแบบเดียวกับเพลี้ยกระโดดสีน้ำตาลคือดูดน้ำเลี้ยงจนต้นแห้ง " +
         "และมักระบาดพร้อมกัน ต้องจัดการเหมือนกัน",
    look: "ขนาดและรูปร่างเหมือนเพลี้ยกระโดดสีน้ำตาลแทบทุกอย่าง " +
          "จุดที่ต่างคือมีแถบสีขาวพาดกลางหลังชัดเจน และตัวออกสีเข้มกว่า " +
          "ถ้าเห็นแถบขาวเมื่อไหร่คือชนิดนี้ ไม่ใช่สีน้ำตาล",
    where: "โคนต้นเหนือผิวน้ำ ตำแหน่งเดียวกับเพลี้ยกระโดดสีน้ำตาล มักพบปนกันทั้งสองชนิด",
  },
  gsl: {
    level: "high",
    why: "ตัวมันเองกินไม่มาก แต่เป็นตัวพาโรคโรคใบสีส้มซึ่งเป็นไวรัส " +
         "ข้าวที่ติดแล้วรักษาไม่ได้เลย ต้องถอนทิ้งอย่างเดียว " +
         "จึงอันตรายกว่าที่เห็นจากความเสียหายโดยตรงมาก",
    look: "ลำตัวสีเขียวอ่อนสดทั้งตัว ยาวราว 3-5 มิลลิเมตร รูปร่างเรียวคล้ายลิ่ม " +
          "มักมีจุดสีดำเล็กๆ ที่ปลายปีก บินหนีเป็นระยะสั้นๆ เมื่อถูกรบกวน ไม่ใช่กระโดด",
    where: "อยู่บนใบและส่วนบนของต้น ต่างจากเพลี้ยกระโดดที่อยู่โคนต้น จึงเห็นได้ง่ายกว่า",
  },
  thrips: {
    level: "mid",
    why: "ทำให้ใบม้วนและปลายใบแห้ง กระทบหนักเฉพาะระยะกล้าซึ่งข้าวยังฟื้นตัวไม่ไหว " +
         "แต่จัดการได้ง่ายและถูกที่สุดในบรรดาแมลงทั้งหมด เพราะแค่ปล่อยน้ำเข้าแปลง " +
         "ประชากรก็ลดลงเองโดยไม่ต้องใช้สารเคมี จึงไม่จัดเป็นระดับสูงทั้งที่พบบ่อย",
    look: "ตัวเล็กมากจนเกือบมองไม่เห็นด้วยตาเปล่า ยาวเพียง 1-2 มิลลิเมตร " +
          "ตัวเต็มวัยสีดำหรือน้ำตาลเข้ม ตัวอ่อนสีเหลืองอ่อนใส ลำตัวเรียวยาวคล้ายเส้นด้ายสั้นๆ " +
          "วิธีดูที่ได้ผลคือเคาะใบลงบนกระดาษขาวแล้วสังเกตจุดเล็กๆ ที่ไหวตัว",
    where: "อยู่ในใบอ่อนที่ม้วนเป็นหลอดบริเวณยอด ต้องคลี่ใบที่ม้วนออกดูจึงจะเจอ " +
           "ไม่ได้อยู่ที่โคนต้นหรือรวง",
  },
  stemborer: {
    level: "high",
    why: "เจาะเข้าไปกินในลำต้น ทำให้ยอดเหี่ยวตายหรือรวงเป็นหัวหงอกไม่มีเมล็ด " +
         "และเมื่อเข้าไปอยู่ในลำต้นแล้ว การพ่นสารทางใบแทบไม่ได้ผล " +
         "จึงต้องจัดการให้ทันก่อนตัวหนอนเจาะเข้าไป",
    look: "ตัวหนอนสีขาวครีมหรือชมพูอ่อน ลำตัวเรียบเป็นปล้อง ไม่มีขน หัวสีน้ำตาล " +
          "ตัวเต็มวัยเป็นผีเสื้อกลางคืนสีขาวนวลหรือเหลืองอ่อน มักเห็นบินตอนพลบค่ำ",
    where: "ตัวหนอนอยู่ในลำต้น มองจากภายนอกไม่เห็น ต้องผ่าลำต้นที่ยอดเหี่ยวดูจึงจะเจอ",
  },
  gallmidge: {
    level: "high",
    why: "ทำให้ยอดข้าวกลายเป็นหลอดคล้ายใบหอม กอนั้นจะไม่ออกรวงเลย " +
         "ความเสียหายจึงเป็นการสูญเสียผลผลิตถาวรของกอนั้น ไม่ใช่แค่ใบเสียหาย",
    look: "ตัวเต็มวัยคล้ายยุงตัวเล็กมาก ลำตัวสีชมพูหรือส้มอ่อน ขายาวเรียว บินช้า " +
          "ตัวหนอนสีขาวใสขนาดเล็กมาก อยู่ในหลอดที่ยอดข้าว",
    where: "สังเกตจากยอดที่กลายเป็นหลอดกลมยาวคล้ายใบหอมได้ง่ายกว่าหาตัวแมลง",
  },
  applesnail: {
    level: "high",
    why: "กัดกินต้นกล้าที่เพิ่งปักดำหรือหว่านจนหมดแปลงได้ภายในไม่กี่วัน " +
         "ระยะกล้าเป็นช่วงที่ข้าวเปราะบางที่สุดและเสียหายแล้วต้องหว่านใหม่ทั้งแปลง",
    look: "หอยเปลือกกลมสีน้ำตาลเข้ม โตเต็มที่ใหญ่ราวลูกปิงปองถึงกำปั้น " +
          "จุดที่สังเกตง่ายที่สุดคือไข่สีชมพูสดเป็นกลุ่มก้อน เกาะอยู่เหนือผิวน้ำ " +
          "ตามต้นข้าว คันนา หรือเสา สีชมพูนั้นเด่นมากจนเห็นแต่ไกล",
    where: "ตัวหอยอยู่ในน้ำ ส่วนไข่สีชมพูอยู่เหนือน้ำ ให้ไล่เก็บไข่เป็นหลักเพราะเจอง่ายกว่า",
  },
  armyworm: {
    level: "mid",
    why: "กัดกินใบและต้นกล้าเป็นหย่อม ระบาดเป็นกลุ่มใหญ่และกินเร็ว " +
         "แต่ถ้าข้าวโตพ้นระยะกล้าแล้วมักฟื้นตัวได้ ความเสียหายจึงขึ้นกับอายุข้าวเป็นหลัก",
    look: "หนอนตัวอ้วน สีเทาเข้มถึงน้ำตาลดำ มีแถบสีอ่อนพาดตามยาวข้างลำตัว " +
          "ตัวใหญ่กว่าหนอนห่อใบมาก โตเต็มที่ยาวได้ถึง 3-4 เซนติเมตร",
    where: "ซ่อนอยู่ตามโคนกอหรือใต้ก้อนดินตอนกลางวัน ออกกินตอนกลางคืน " +
           "ถ้าสงสัยให้ออกไปส่องไฟดูตอนค่ำ กลางวันมักหาไม่เจอ",
  },
  leaffolder: {
    level: "mid",
    why: "ห่อใบแล้วแทะผิวใบจนเป็นแถบขาว ข้าวมักชดเชยได้ถ้าไม่ระบาดหนัก " +
         "แต่ถ้าโดนใบธงช่วงตั้งท้องจะกระทบผลผลิตชัดเจน เพราะใบธงคือใบที่สร้างอาหารให้รวง",
    look: "หนอนตัวเล็กเรียว สีเขียวใสหรือเขียวอมเหลือง ตัวนิ่ม มองทะลุเห็นเป็นเส้นในตัวได้ " +
          "ยาวไม่เกิน 2 เซนติเมตร ดิ้นถอยหลังเร็วมากเมื่อแกะใบออก",
    where: "อยู่ในใบที่ม้วนเป็นหลอดตามยาว ต้องแกะใบที่ม้วนออกดูจึงจะเจอตัว",
  },
  ricebug: {
    level: "mid",
    why: "ดูดน้ำนมในเมล็ดช่วงข้าวเป็นน้ำนม ทำให้เมล็ดลีบและมีกลิ่นเหม็นติดข้าว " +
         "กระทบราคาขายมากกว่าปริมาณผลผลิต และเสียหายเฉพาะช่วงสั้นๆ ก่อนเก็บเกี่ยว",
    look: "ลำตัวยาวเรียวคล้ายกิ่งไม้เล็กๆ สีเขียวอมน้ำตาลหรือน้ำตาลอ่อน " +
          "ขาและหนวดยาวเด่น ยาวราว 1.5-2 เซนติเมตร " +
          "จุดที่ยืนยันได้แน่นอนคือกลิ่นเหม็นฉุนเมื่อเข้าใกล้หรือจับตัว",
    where: "เกาะอยู่ที่รวงข้าวช่วงเป็นน้ำนม ไม่ค่อยลงมาที่ใบหรือโคนต้น",
  },
};

// แมลงที่ยังไม่ได้จัดระดับ ต้องไม่เดาแทนผู้ใช้
// บอกตรงๆ ว่ายังไม่มีข้อมูล ดีกว่าใส่ระดับมั่วแล้วผู้ใช้เชื่อ
const UNKNOWN = {
  level: null,
  why: "ยังไม่ได้จัดระดับความอันตรายสำหรับชนิดนี้ในระบบ " +
       "ลองอ่านร่องรอยที่มันกัดกินด้านล่างดูก่อน แล้วถามเกษตรอำเภอว่าต้องรีบแค่ไหน",
  look: null,
  where: null,
};

function info(key) {
  return INFO[key] || UNKNOWN;
}

// ══════════════════════════════════════════════════════════
// สไตล์ ใส่ครั้งเดียวตอนเปิดหน้าครั้งแรก
// ทำแบบเดียวกับ camStyles ใน index.html เพื่อให้ไฟล์นี้จบในตัวเอง
// ══════════════════════════════════════════════════════════
function installStyles() {
  if (document.getElementById("pestStyles")) return;
  const st = document.createElement("style");
  st.id = "pestStyles";
  st.textContent =
    ".tri{border:1px solid var(--rule);border-radius:var(--r-sm);overflow:hidden;background:#FFFFFF}" +
    ".tri-head,.tri-row{display:grid;grid-template-columns:1.35fr 1fr;gap:14px;padding:9px 14px}" +
    ".tri-head{background:var(--canopy);font-size:.68rem;letter-spacing:.1em;" +
      "text-transform:uppercase;color:var(--ink-faint)}" +
    ".tri-row{border-top:1px solid var(--rule-soft);font-size:.84rem;line-height:1.55}" +
    ".tri-sign{color:var(--ink-soft)}" +
    ".tri-cause{color:var(--deep);font-weight:600}" +
    ".tri-cause i{display:block;font-style:normal;font-weight:400;font-size:.79rem;" +
      "color:var(--ink-faint);margin-top:3px}" +
    "@media(max-width:680px){.tri-head{display:none}" +
      ".tri-row{grid-template-columns:1fr;gap:4px;padding:11px 14px}}" +
    ".pest-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:11px}" +
    ".pest-card{display:flex;flex-direction:column;gap:7px;padding:15px 16px;text-align:left;" +
      "background:#FFFFFF;border:1px solid var(--rule);border-radius:var(--r);cursor:pointer;" +
      "font-family:var(--f-body);transition:border-color .16s ease,box-shadow .16s ease}" +
    ".pest-card:hover{border-color:var(--blade);box-shadow:0 2px 10px rgba(27,94,58,.09)}" +
    ".pest-card.on{border-color:var(--blade);background:var(--tint-ok)}" +
    ".pest-name{font-weight:600;font-size:.97rem;line-height:1.35;color:var(--ink)}" +
    ".pest-sci{font-size:.74rem;color:var(--ink-faint);font-style:italic}" +
    /* ป้ายระดับอันตราย จุดสามจุดอ่านได้เร็วกว่าตัวหนังสือเมื่อกวาดดูหลายตัว */
    ".pest-level{display:inline-flex;align-items:center;gap:6px;font-size:.76rem;" +
      "font-weight:600;padding:3px 10px;border-radius:99px;align-self:flex-start}" +
    ".pest-level.bad{background:var(--tint-bad);color:var(--rust)}" +
    ".pest-level.warn{background:var(--tint-warn);color:#7A5A11}" +
    ".pest-level.ok{background:var(--tint-ok);color:#1B5E3A}" +
    ".pest-level.none{background:var(--canopy);color:var(--ink-faint)}" +
    ".pest-dots{display:inline-flex;gap:3px}" +
    ".pest-dot{width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.28}" +
    ".pest-dot.lit{opacity:1}" +
    ".pest-quick{font-size:.82rem;color:var(--ink-soft);line-height:1.6}" +
    ".pest-when{font-size:.78rem;color:var(--ink-faint)}" +
    /* บล็อกลักษณะเด่น ให้เด่นกว่าย่อหน้าธรรมดาเพราะเป็นสิ่งที่ผู้ใช้มาหา */
    ".pest-look{background:var(--canopy);border-radius:var(--r-sm);padding:14px 16px;margin-top:11px}" +
    ".pest-look p{margin:0 0 9px;font-size:.89rem;line-height:1.7}" +
    ".pest-look p:last-child{margin-bottom:0}" +
    ".pest-tagsrc{font-size:.7rem;padding:2px 8px;border-radius:99px;font-weight:500;" +
      "background:var(--canopy);color:var(--ink-faint);border:1px solid var(--rule);margin-left:7px}";
  document.head.appendChild(st);
}

// ══════════════════════════════════════════════════════════
// สร้างหน้า
// ui = ตัวช่วยจาก index.html { el, plot, bund, fold, more, stateBlock, readOut }
// ══════════════════════════════════════════════════════════
window.buildPestPage = function (root, ui) {
  installStyles();

  const el = ui.el, plot = ui.plot, bund = ui.bund;
  const fold = ui.fold, more = ui.more, stateBlock = ui.stateBlock;

  const P = window.PEST_GUIDE;
  if (!P || !P.pests) {
    root.appendChild(stateBlock("!", "ไม่พบไฟล์ฐานความรู้แมลง",
      "ยังโหลดข้อมูลเรื่องแมลงขึ้นมาไม่ได้ ลองรีเฟรชหน้าดูอีกที"));
    return;
  }

  const keys = Object.keys(P.pests);

  // เรียงตามความอันตราย ตัวที่ต้องรีบจัดการอยู่บนสุด
  // ไม่เรียงตามตัวอักษรเพราะผู้ใช้ที่เปิดหน้านี้มักกำลังมีปัญหาอยู่
  // สิ่งที่เขาต้องเห็นก่อนคือตัวที่ทำให้เสียหายหนักที่สุด
  const order = { high: 0, mid: 1, low: 2 };
  keys.sort((a, b) => {
    const ra = info(a).level, rb = info(b).level;
    return (ra ? order[ra] : 9) - (rb ? order[rb] : 9);
  });

  function levelBadge(key) {
    const r = info(key);
    if (!r.level) return el("span", "pest-level none", "ยังไม่ได้จัดระดับ");

    const L = LEVELS[r.level];
    const b = el("span", "pest-level " + L.tone);
    const dots = el("span", "pest-dots");
    const lit = r.level === "high" ? 3 : r.level === "mid" ? 2 : 1;
    for (let i = 0; i < 3; i++) {
      dots.appendChild(el("i", "pest-dot" + (i < lit ? " lit" : "")));
    }
    b.appendChild(dots);
    b.appendChild(document.createTextNode(L.word));
    return b;
  }

  // ══ ตัวแยกว่าเป็นโรคหรือแมลง ══
  //
  // อยู่บนสุดของทั้งหน้าเพราะเป็นคำถามที่ต้องตอบก่อนเสมอ
  // ถ้าอาการที่เห็นเกิดจากเชื้อรา การไล่ดูรายชื่อแมลงคือการเดินผิดทางตั้งแต่ต้น
  // และจะจบด้วยการซื้อยาฆ่าแมลงมาพ่นโรคพืช ซึ่งเสียเงินแล้วไม่ได้ผลเลย
  //
  // ข้อมูลเขียนในรูป "อาการ = ตัวการ" อยู่แล้ว จึงแสดงเป็นสองคอลัมน์
  // อาการที่เห็นอยู่ซ้าย ตัวการอยู่ขวา กวาดตาหาแถวที่ตรงกับที่เจอได้เร็วกว่ารายการหัวข้อย่อยยาวๆ
  if (P.triage && P.triage.length) {
    root.appendChild(bund("เห็นอาการแบบนี้ แมลงหรือโรค"));
    const tri = plot(null, "โรคพืชไม่ทำให้เนื้อใบหายไป ถ้าเห็นรอยกัดหรือใบแหว่ง แปลว่าเป็นแมลงแน่นอน");

    const table = el("div", "tri");
    const th = el("div", "tri-head");
    th.appendChild(el("div", "", "อาการที่เห็น"));
    th.appendChild(el("div", "", "น่าจะเป็น"));
    table.appendChild(th);

    P.triage.forEach((item) => {
      // รองรับทั้งรูปแบบใหม่ที่แยกช่อง และสตริงเก่ารูปแบบ "อาการ = ตัวการ"
      // ถ้าไฟล์ฐานความรู้ถูกย้อนกลับไปเวอร์ชันเก่า ตารางยังขึ้นครบไม่พัง
      let sign, cause, note;
      if (typeof item === "string") {
        const at = item.indexOf(" = ");
        if (at === -1) { sign = item; cause = ""; }
        else { sign = item.slice(0, at); cause = item.slice(at + 3); }
      } else {
        sign = item.sign; cause = item.cause; note = item.note;
      }

      const row = el("div", "tri-row");
      const signCell = el("div", "tri-sign", String(sign || "").replace(/^ถ้า/, ""));
      if (!cause) signCell.style.gridColumn = "1 / -1";
      row.appendChild(signCell);

      if (cause) {
        const causeCell = el("div", "tri-cause", cause);
        if (note) causeCell.appendChild(el("i", "", note));
        row.appendChild(causeCell);
      }
      table.appendChild(row);
    });
    tri.appendChild(table);

    tri.appendChild(el("div", "flash flash-bad",
      "ตัวตรวจรูปดูออกแค่โรค 6 ชนิด ไม่รู้จักแมลง ถ้าอาการเกิดจากแมลง ห้ามเชื่อผลตรวจจากภาพ"));
    root.appendChild(tri);
  }

  // ══ รายชื่อแมลง ══
  root.appendChild(bund("แมลงและสัตว์ที่กินข้าว"));

  const gridCard = plot(null, "เรียงจากที่อันตรายที่สุดลงมา · แดง 3 จุด = ต้องรีบจัดการ, ทอง 2 จุด = เดินสำรวจก่อน, เขียว 1 จุด = เฝ้าดูตามปกติ");
  const grid = el("div", "pest-grid");
  gridCard.appendChild(grid);
  root.appendChild(gridCard);

  const detail = el("div");
  root.appendChild(detail);

  keys.forEach((key) => {
    const pest = P.pests[key];
    const r = info(key);
    const card = el("button", "pest-card");

    card.appendChild(levelBadge(key));
    card.appendChild(el("div", "pest-name", pest.thai));
    if (pest.sci) card.appendChild(el("div", "pest-sci", pest.sci));

    // ใส่ลักษณะเด่นแบบสั้นในการ์ด ให้กวาดตาหาตัวที่ตรงกับที่เจอได้เลย
    // ไม่ต้องกดเข้าไปทีละตัวแล้วกดกลับ ซึ่งช้ามากเมื่อมี 9 ชนิด
    if (r.look) {
      const short = r.look.split(" ").slice(0, 14).join(" ");
      card.appendChild(el("div", "pest-quick", short + "…"));
    }
    if (pest.stage) card.appendChild(el("div", "pest-when", "พบระยะ " + pest.stage));

    card.onclick = function () {
      grid.querySelectorAll(".pest-card").forEach((c) => c.classList.remove("on"));
      card.classList.add("on");
      paintDetail(key);
      detail.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    grid.appendChild(card);
  });

  // ══ รายละเอียดของแมลงที่เลือก ══
  function paintDetail(key) {
    const pest = P.pests[key];
    const r = info(key);
    const L = r.level ? LEVELS[r.level] : null;
    detail.innerHTML = "";

    detail.appendChild(bund(pest.thai));

    // ── หัวการ์ด: ระดับอันตรายและสิ่งที่ต้องทำก่อน ──
    const head = plot(null);
    head.appendChild(levelBadge(key));
    const nm = el("div", "pest-name", pest.thai);
    nm.style.cssText = "font-size:1.3rem;margin-top:8px";
    head.appendChild(nm);
    if (pest.sci) head.appendChild(el("div", "pest-sci", pest.sci));

    if (L) {
      const act = el("div", "", "สิ่งที่ควรทำตอนนี้: " + L.act);
      act.style.cssText = "margin-top:11px;font-weight:600;font-size:.93rem;color:var(--deep)";
      head.appendChild(act);
    }

    // เหตุผลของการจัดระดับ ต้องแสดงเสมอ ไม่ซ่อนไว้ในปุ่มขยาย
    // ผู้ใช้ควรตัดสินใจจากเหตุผล ไม่ใช่จากสีของป้าย
    const whyHead = el("div", "rx-sect");
    whyHead.appendChild(document.createTextNode("ทำไมถึงจัดระดับนี้"));
    whyHead.appendChild(el("span", "pest-tagsrc", "เว็บนี้ดูให้ว่า"));
    head.appendChild(whyHead);
    const whyP = el("p", "", r.why);
    whyP.style.cssText = "margin:0;font-size:.88rem";
    head.appendChild(whyP);
    detail.appendChild(head);

    // ── ลักษณะที่ใช้ระบุตัว วางเป็นบล็อกแรก ──
    //
    // นี่คือสิ่งที่ผู้ใช้เปิดหน้ามาหาเป็นอันดับแรก คือ "ที่ฉันเห็นใช่ตัวนี้ไหม"
    // ถ้าตอบคำถามนี้ไม่ได้ ข้อมูลวิธีจัดการทั้งหมดด้านล่างก็ไร้ประโยชน์
    // เพราะเขาอาจกำลังอ่านวิธีจัดการของแมลงคนละตัวกับที่อยู่ในนา
    if (r.look || pest.sign) {
      detail.appendChild(bund("ลักษณะที่ใช้ระบุตัว"));
      const lk = plot(null);

      if (r.look) {
        const box = el("div", "pest-look");
        box.appendChild(el("p", "", r.look));
        if (r.where) box.appendChild(el("p", "", "ตำแหน่งที่มักเจอ: " + r.where));
        lk.appendChild(box);

        lk.appendChild(el("div", "read-foot",
          "คำบรรยายลักษณะส่วนนี้ระบบเขียนเสริมจากลักษณะทั่วไปของแมลงชนิดนี้ " +
          "ไม่ได้อยู่ในเอกสารอ้างอิงต้นทาง ถ้าไม่ตรงกับที่พบในพื้นที่ของคุณ " +
          "ให้ยึดคำยืนยันของเกษตรอำเภอเป็นหลัก"));
      }

      // sign มาจาก pest-guide.js จึงเป็นข้อมูลจากเอกสารอ้างอิงจริง
      // แยกออกมาจากบล็อกด้านบนเพื่อไม่ให้ปนกับส่วนที่ระบบเขียนเอง
      if (pest.sign) {
        const sh = el("div", "rx-sect");
        sh.appendChild(document.createTextNode("สัญญาณที่สังเกตได้ในแปลง"));
        sh.appendChild(el("span", "pest-tagsrc", "จากเอกสารกรมการข้าว"));
        lk.appendChild(sh);
        const sp = el("p", "", pest.sign);
        sp.style.cssText = "margin:0;font-size:.88rem";
        lk.appendChild(sp);
      }
      detail.appendChild(lk);
    }

    // ── ข้อมูลประกอบแบบย่อ ──
    const facts = [];
    if (pest.type)      facts.push(["ประเภท", pest.type]);
    if (pest.stage)     facts.push(["ระยะข้าวที่พบ", pest.stage]);
    if (pest.season)    facts.push(["ฤดูกาล", pest.season]);
    if (pest.region)    facts.push(["พื้นที่ที่พบบ่อย", pest.region]);
    if (pest.condition) facts.push(["สภาพที่เอื้อต่อการระบาด", pest.condition]);

    if (facts.length) {
      const fc = plot(null);
      fc.style.marginTop = "13px";
      facts.forEach((f) => {
        const line = el("div");
        line.style.cssText = "display:flex;gap:14px;padding:8px 0;font-size:.87rem;" +
          "border-bottom:1px solid var(--rule-soft)";
        const k = el("span", "", f[0]);
        k.style.cssText = "flex:none;width:150px;color:var(--ink-faint)";
        line.appendChild(k);
        line.appendChild(el("span", "", f[1]));
        fc.appendChild(line);
      });
      detail.appendChild(fc);
    }

    // ── อาการและวิธีแก้ไข ──
    detail.appendChild(bund("อาการและวิธีแก้ไข"));
    const box = plot(null);
    let n = 0;

    if (pest.damage) {
      // เปิดอันแรกไว้ ให้เห็นทันทีว่าตรงกับความเสียหายที่เจอในแปลงไหม
      box.appendChild(fold(++n, "ลักษณะการทำลายที่จะเห็น", null, (b) => {
        b.appendChild(el("p", "", pest.damage));
      }, true));
    }

    if (pest.manage && pest.manage.length) {
      // เปิดไว้ด้วย เพราะนี่คือสิ่งที่ควรทำก่อนเสมอก่อนคิดถึงสารเคมี
      box.appendChild(fold(++n, "วิธีจัดการโดยไม่ใช้สารเคมี", "ทำได้ทันทีและไม่มีผลข้างเคียง", (b) => {
        const ul = el("ul");
        ul.style.cssText = "margin:0;padding-left:19px";
        pest.manage.forEach((x) => {
          const li = el("li", "", x);
          li.style.marginBottom = "6px";
          ul.appendChild(li);
        });
        b.appendChild(ul);
      }, true));
    }

    if (pest.threshold) {
      box.appendChild(fold(++n, "เกณฑ์ตัดสินใจก่อนพ่นสาร", "นับให้ถึงเกณฑ์ก่อน อย่าพ่นทันทีที่เห็นแมลง", (b) => {
        b.appendChild(el("p", "", pest.threshold));
        b.appendChild(el("div", "fold-note",
          "การพ่นก่อนถึงเกณฑ์ทำให้แมลงตัวห้ำและแตนเบียนซึ่งเป็นศัตรูธรรมชาติตายไปด้วย " +
          "แล้วรอบหน้าจะระบาดหนักกว่าเดิม เพราะไม่มีอะไรคอยควบคุมตามธรรมชาติแล้ว"));
      }, false));
    }

    if (pest.chem) {
      box.appendChild(fold(++n, "สารเคมีที่กรมการข้าวแนะนำ", "ใช้เมื่อผ่านเกณฑ์ด้านบนแล้วเท่านั้น", (b) => {
        b.appendChild(el("p", "", pest.chem));
        if (pest.chemHow) {
          b.appendChild(el("div", "rx-sect", "วิธีใช้"));
          b.appendChild(el("p", "", pest.chemHow));
        }
        b.appendChild(el("div", "flash flash-bad",
          "ต้องยืนยันกับเกษตรอำเภอหรือศูนย์วิจัยข้าวก่อนใช้จริงทุกครั้ง " +
          "เพราะคำแนะนำเปลี่ยนตามการดื้อยาของแมลงในแต่ละพื้นที่และแต่ละปี"));
      }, false));
    }

    if (pest.avoid) {
      // ตัวอันตรายสูงเปิดไว้เลย เพราะพลาดแล้วเสียหายหนักและแก้ไม่ทัน
      box.appendChild(fold(++n, "สารที่ห้ามใช้เด็ดขาด", "ความผิดพลาดที่ทำให้เสียหายหนักที่สุด", (b) => {
        b.appendChild(el("div", "flash flash-bad", pest.avoid));
      }, r.level === "high"));
    }

    if (pest.bio) {
      box.appendChild(fold(++n, "ชีววิทยาและวงจรชีวิต", "ช่วยให้เลือกจังหวะจัดการได้ถูก", (b) => {
        b.appendChild(el("p", "", pest.bio));
        if (pest.note) b.appendChild(el("div", "fold-note", pest.note));
      }, false));
    }

    detail.appendChild(box);

    // ── ทางออกเมื่อยังไม่แน่ใจ ──
    // สำคัญกว่าที่คิด เพราะผู้ใช้ที่ระบุชนิดไม่ได้คือคนที่เสี่ยงซื้อยาผิดที่สุด
    const help = plot(null);
    help.style.marginTop = "13px";
    help.appendChild(el("div", "rx-sect", "ยังไม่แน่ใจว่าใช่ตัวนี้หรือไม่"));
    const hp = el("p", "",
      "ไปที่หน้าระยะการเจริญเติบโต แล้วพิมพ์บรรยายสิ่งที่เห็นในช่องถาม AI " +
      "เช่น ข้าวอายุกี่วัน อาการอยู่ที่ใบ ยอด หรือรวง เห็นตัวแมลงไหม สีอะไร ขนาดเท่าไหร่ " +
      "ระบบจะช่วยเทียบกับแมลงทุกชนิดในฐานข้อมูลแล้วถามกลับเพื่อแยกให้ชัดขึ้น");
    hp.style.cssText = "margin:0;font-size:.88rem";
    help.appendChild(hp);
    detail.appendChild(help);
  }

  // ══ หลักการทั่วไป วางท้ายหน้า ══
  if (P.principles && P.principles.length) {
    root.appendChild(bund("หลักการกำจัดแมลงที่ควรจำ"));
    const pc = plot(null);
    const ul = el("ul");
    ul.style.cssText = "margin:0;padding-left:19px;font-size:.88rem";
    P.principles.forEach((x) => {
      const li = el("li", "", x);
      li.style.marginBottom = "7px";
      ul.appendChild(li);
    });
    pc.appendChild(ul);
    pc.appendChild(more("ที่มาและข้อจำกัดของข้อมูลนี้",
      "ข้อมูลการทำลาย วิธีจัดการ เกณฑ์ตัดสินใจ และสารเคมี อ้างอิงเอกสารความรู้ " +
      "Rice Knowledge Bank กรมการข้าว ส่วนการจัดระดับความอันตรายและคำบรรยายลักษณะตัวแมลง " +
      "เป็นส่วนที่ระบบเขียนเสริมเพื่อให้ใช้งานง่ายขึ้น ไม่ใช่การจัดระดับอย่างเป็นทางการของหน่วยงานใด " +
      "ความรุนแรงจริงขึ้นกับอายุข้าว พันธุ์ที่ปลูก และสภาพแปลงของแต่ละพื้นที่ " +
      "ก่อนใช้สารเคมีทุกครั้งควรปรึกษาเกษตรอำเภอ หมอดินอาสา หรือศูนย์วิจัยข้าวในพื้นที่"));
    root.appendChild(pc);
  }
};

})();

/* ══════════════════════════════════════════════════════════
   วิธีเชื่อมกับ index.html — แก้ 3 จุด

   จุดที่ 1  ใต้บรรทัด <script src="pest-guide.js?v=12"></script> เพิ่ม
       <script src="pest-page.js?v=2"></script>

   จุดที่ 2  ในตัวแปร PAGES เพิ่มรายการนี้ต่อจากบล็อกของ diagnose
       { id: "pest", label: "แมลงศัตรูข้าว", kicker: "ระหว่างปลูก", group: "2 · ระหว่างปลูก",
         icon: "M12 4v5m0 0a4 4 0 00-4 4v3a4 4 0 008 0v-3a4 4 0 00-4-4zm-4 5L4 7m4 6H4m4 4l-4 2m12-12l4-2m-4 6h4m-4 4l4 2" },

   จุดที่ 3  ก่อนบรรทัด views.survey = async function (root) { เพิ่ม
       views.pest = function (root) {
         if (typeof window.buildPestPage !== "function") {
           root.appendChild(stateBlock("!", "ยังโหลดหน้าแมลงไม่ได้",
             "ยังโหลดข้อมูลเรื่องแมลงขึ้นมาไม่ได้ ลองรีเฟรชหน้าดูอีกที"));
           return;
         }
         window.buildPestPage(root, {
           el: el, plot: plot, bund: bund, fold: fold,
           more: more, stateBlock: stateBlock, readOut: readOut
         });
       };
   ══════════════════════════════════════════════════════════ */
