/**
 * pest-page.js — หน้า "แมลงศัตรูข้าว" สำหรับ SmartRice AI
 *
 * ทำไมแยกเป็นไฟล์: index.html ยาวหลายพันบรรทัดแล้ว การเพิ่มหน้าใหม่เข้าไปตรงๆ
 * ทำให้ไฟล์โตขึ้นอีกและแก้ยากขึ้นเรื่อยๆ ไฟล์นี้รับตัวช่วยสร้าง UI จาก index.html
 * เข้ามาใช้ จึงหน้าตาเหมือนหน้าอื่นทุกประการโดยไม่ต้องคัดลอกโค้ดซ้ำ
 *
 * ข้อมูลทั้งหมดมาจาก window.PEST_GUIDE (pest-guide.js) ไฟล์นี้ไม่เก็บข้อมูลแมลงเอง
 * เพื่อไม่ให้เกิดข้อมูล 2 ชุดที่แก้ที่เดียวแล้วอีกที่ไม่ตาม
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
//   1. ทำให้ข้าวตายทั้งกอหรือทั้งหย่อมได้ไหม (ไม่ใช่แค่ใบเสียหาย)
//   2. เป็นพาหะนำโรคไวรัสที่รักษาไม่ได้ไหม
//   3. ระบาดข้ามแปลงเร็วจนเพื่อนบ้านเสียหายตามไหม
//
// เขียนเหตุผลกำกับทุกตัวโดยตั้งใจ เพื่อให้ผู้ใช้และเจ้าหน้าที่เกษตร
// ตรวจสอบได้ว่าเห็นด้วยกับการจัดระดับหรือไม่ ระบบที่บอกว่า "อันตรายสูง"
// เฉยๆ โดยไม่บอกเหตุผล เชื่อถือไม่ได้และแก้ไม่ได้เมื่อมันผิด
// ══════════════════════════════════════════════════════════

const LEVELS = {
  high: {
    word: "อันตรายสูง",
    tone: "bad",
    act: "ต้องลงไปดูแปลงภายในวันนี้",
  },
  mid: {
    word: "อันตรายปานกลาง",
    tone: "warn",
    act: "เดินสำรวจแปลงสัปดาห์นี้ แล้วนับจำนวนก่อนตัดสินใจ",
  },
  low: {
    word: "อันตรายต่ำ",
    tone: "ok",
    act: "เฝ้าดูตามปกติ ยังไม่ต้องทำอะไรเป็นพิเศษ",
  },
};

// key ต้องตรงกับ key ใน PEST_GUIDE.pests
const RATING = {
  bph: {
    level: "high",
    why: "ดูดน้ำเลี้ยงจนข้าวแห้งตายเป็นหย่อมทั้งกอ เรียกว่าอาการไหม้เป็นหย่อม " +
         "และยังเป็นพาหะโรคใบหงิกด้วย ระบาดข้ามแปลงเร็วมาก เป็นแมลงที่สร้างความเสียหาย" +
         "ให้นาข้าวไทยมากที่สุดในรอบหลายสิบปี",
  },
  wbph: {
    level: "high",
    why: "ทำลายแบบเดียวกับเพลี้ยกระโดดสีน้ำตาลคือดูดน้ำเลี้ยงจนต้นแห้ง " +
         "และมักระบาดพร้อมกัน ต้องจัดการเหมือนกัน",
  },
  gsl: {
    level: "high",
    why: "ตัวมันเองกินไม่มาก แต่เป็นพาหะโรคใบสีส้มซึ่งเป็นไวรัส " +
         "ข้าวที่ติดแล้วรักษาไม่ได้เลย ต้องถอนทิ้งอย่างเดียว " +
         "จึงอันตรายกว่าที่เห็นจากความเสียหายโดยตรงมาก",
  },
  stemborer: {
    level: "high",
    why: "เจาะเข้าไปกินในลำต้น ทำให้ยอดเหี่ยวตายหรือรวงเป็นหัวหงอกไม่มีเมล็ด " +
         "และเมื่อเข้าไปอยู่ในลำต้นแล้ว การพ่นสารทางใบแทบไม่ได้ผก " +
         "จึงต้องจัดการให้ทันก่อนตัวหนอนเจาะเข้าไป",
  },
  gallmidge: {
    level: "high",
    why: "ทำให้ยอดข้าวกลายเป็นหลอดคล้ายใบหอม กอนั้นจะไม่ออกรวงเลย " +
         "ความเสียหายจึงเป็นการสูญเสียผลผลิตถาวรของกอนั้น ไม่ใช่แค่ใบเสียหาย",
  },
  applesnail: {
    level: "high",
    why: "กัดกินต้นกล้าที่เพิ่งปักดำหรือหว่านจนหมดแปลงได้ภายในไม่กี่วัน " +
         "ระยะกล้าเป็นช่วงที่ข้าวเปราะบางที่สุดและเสียหายแล้วต้องหว่านใหม่ทั้งแปลง",
  },
  armyworm: {
    level: "mid",
    why: "กัดกินใบและต้นกล้าเป็นหย่อม ระบาดเป็นกลุ่มใหญ่และกินเร็ว " +
         "แต่ถ้าข้าวโตพ้นระยะกล้าแล้วมักฟื้นตัวได้ ความเสียหายจึงขึ้นกับอายุข้าวเป็นหลัก",
  },
  leaffolder: {
    level: "mid",
    why: "ห่อใบแล้วแทะผิวใบจนเป็นแถบขาว ข้าวมักชดเชยได้ถ้าไม่ระบาดหนัก " +
         "แต่ถ้าโดนใบธงช่วงตั้งท้องจะกระทบผลผลิตชัดเจน เพราะใบธงคือใบที่สร้างอาหารให้รวง",
  },
  ricebug: {
    level: "mid",
    why: "ดูดน้ำนมในเมล็ดช่วงข้าวเป็นน้ำนม ทำให้เมล็ดลีบและมีกลิ่นเหม็นติดข้าว " +
         "กระทบราคาขายมากกว่าปริมาณผลผลิต และเสียหายเฉพาะช่วงสั้นๆ ก่อนเก็บเกี่ยว",
  },
};

// แมลงที่ยังไม่ได้จัดระดับ ต้องไม่เดาแทนผู้ใช้
// บอกตรงๆ ว่ายังไม่มีข้อมูล ดีกว่าใส่ระดับมั่วแล้วผู้ใช้เชื่อ
const UNRATED = {
  level: null,
  why: "ยังไม่ได้จัดระดับความอันตรายสำหรับชนิดนี้ในระบบ กรุณาอ่านลักษณะการทำลาย" +
       "ด้านล่างแล้วปรึกษาเกษตรอำเภอเพื่อประเมินความเร่งด่วน",
};

function rate(key) {
  return RATING[key] || UNRATED;
}

// ══════════════════════════════════════════════════════════
// ภาพลายเส้นประกอบ
//
// วาดเป็น SVG แทนภาพถ่าย ด้วยเหตุผล 2 ข้อ
//   1. ภาพถ่ายแมลงมีลิขสิทธิ์ การดึงจากเว็บอื่นมาแสดงเป็นการละเมิด
//   2. ไฟล์ SVG เล็กกว่าภาพถ่ายหลายร้อยเท่า ซึ่งสำคัญมากเมื่อเกษตรกร
//      เปิดเว็บกลางนาด้วยสัญญาณอ่อน
//
// แต่ต้องบอกผู้ใช้ให้ชัดว่าเป็นภาพวาด ใช้แยกกลุ่มได้คร่าวๆ เท่านั้น
// ใช้ระบุชนิดแทนภาพถ่ายจริงไม่ได้ ถ้าไม่บอก ผู้ใช้จะเทียบภาพวาดกับตัวจริง
// แล้วสรุปผิดชนิด ซึ่งนำไปสู่การซื้อสารเคมีผิดตัว
// ══════════════════════════════════════════════════════════

const ART = {
  // เพลี้ยกระโดด — ลำตัวรูปลิ่ม ปีกคลุมยาว ขาหลังใหญ่ไว้กระโดด
  hopper:
    '<ellipse cx="32" cy="34" rx="11" ry="17"/>' +
    '<path d="M32 18c-7 4-9 14-7 26M32 18c7 4 9 14 7 26"/>' +
    '<path d="M28 19l-3-6M36 19l3-6"/>' +
    '<path d="M21 33l-9 4M43 33l9 4M23 44l-8 11M41 44l8 11"/>',

  // หนอน — ลำตัวเป็นปล้องโค้ง มีขาเทียมด้านล่าง
  caterpillar:
    '<path d="M14 40c0-9 8-15 18-15s18 6 18 15-8 14-18 14-18-5-18-14z"/>' +
    '<path d="M22 27v26M30 25v29M38 25v29M46 29v21"/>' +
    '<circle cx="16" cy="34" r="1.6" fill="currentColor" stroke="none"/>',

  // ผีเสื้อกลางคืน — ปีกกางสองข้าง หนวดเป็นขนนก
  moth:
    '<ellipse cx="32" cy="36" rx="4" ry="14"/>' +
    '<path d="M28 26c-10-8-19-6-21 2s7 16 20 12M36 26c10-8 19-6 21 2s-7 16-20 12"/>' +
    '<path d="M30 23l-6-9M34 23l6-9"/>',

  // มวน — ลำตัวรูปโล่ห้าเหลี่ยม หนวดยาว
  bug:
    '<path d="M32 16l14 9v18l-14 11-14-11V25z"/>' +
    '<path d="M32 22v30M20 30h24"/>' +
    '<path d="M26 17l-7-8M38 17l7-8"/>',

  // หอย — เปลือกเกลียว มีตัวโผล่ออกมา
  snail:
    '<circle cx="36" cy="32" r="15"/>' +
    '<path d="M36 32a8 8 0 018-8 8 8 0 018 8 12 12 0 01-12 12"/>' +
    '<path d="M21 40c-6 0-9 4-9 8h20M14 40l-3-8M18 39l1-9"/>',

  // แมลงวันตัวเล็ก (บั่ว) — ลำตัวเรียว ปีกใส ขายาว
  fly:
    '<ellipse cx="32" cy="36" rx="5" ry="13"/>' +
    '<path d="M29 28c-9-6-16-3-17 3s6 11 16 7M35 28c9-6 16-3 17 3s-6 11-16 7"/>' +
    '<path d="M30 24l-4-8M34 24l4-8"/>' +
    '<path d="M28 46l-8 10M36 46l8 10"/>',
};

// เดาแบบภาพจากข้อมูลที่มีใน pest-guide
// ใช้ทั้ง key และ field type เพราะ key เชื่อถือได้กว่าแต่ไม่ครอบคลุมชนิดใหม่
function artFor(key, pest) {
  const byKey = {
    bph: "hopper", wbph: "hopper", gsl: "hopper",
    stemborer: "caterpillar", leaffolder: "caterpillar", armyworm: "caterpillar",
    gallmidge: "fly", ricebug: "bug", applesnail: "snail",
  };
  if (byKey[key]) return ART[byKey[key]];

  const t = (pest && pest.type) || "";
  if (/หอย/.test(t)) return ART.snail;
  if (/หนอน|ผีเสื้อ/.test(t)) return ART.caterpillar;
  if (/เพลี้ย|จักจั่น/.test(t)) return ART.hopper;
  if (/มวน|แมลงสิง/.test(t)) return ART.bug;
  if (/บั่ว|แมลงวัน/.test(t)) return ART.fly;
  return ART.bug;   // ตัวสำรอง ดีกว่าปล่อยช่องว่าง
}

// ══════════════════════════════════════════════════════════
// สไตล์ ใส่ครั้งเดียวตอนเปิดหน้าครั้งแรก
// ทำแบบเดียวกับ camStyles ใน index.html เพื่อให้ไฟล์นี้จบในตัวเอง
// ย้ายหรือลบทีหลังไม่ต้องตามไปแก้ CSS อีกที่
// ══════════════════════════════════════════════════════════
function installStyles() {
  if (document.getElementById("pestStyles")) return;
  const st = document.createElement("style");
  st.id = "pestStyles";
  st.textContent =
    ".pest-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:13px}" +
    ".pest-card{display:flex;flex-direction:column;gap:9px;padding:15px;text-align:left;" +
      "background:#FFFFFF;border:1px solid var(--rule);border-radius:var(--r);cursor:pointer;" +
      "font-family:var(--f-body);transition:border-color .16s ease,box-shadow .16s ease}" +
    ".pest-card:hover{border-color:var(--blade);box-shadow:0 2px 10px rgba(27,94,58,.09)}" +
    ".pest-card.on{border-color:var(--blade);background:var(--tint-ok)}" +
    ".pest-art{width:64px;height:64px;flex:none}" +
    ".pest-art svg{display:block;width:100%;height:100%}" +
    ".pest-name{font-weight:600;font-size:.95rem;line-height:1.35;color:var(--ink)}" +
    ".pest-sci{font-size:.74rem;color:var(--ink-faint);font-style:italic}" +
    /* แถบระดับอันตราย เป็นตัวบอกด้วยภาพว่าตัวไหนต้องรีบ */
    ".pest-level{display:inline-flex;align-items:center;gap:6px;font-size:.76rem;" +
      "font-weight:600;padding:3px 10px;border-radius:99px;align-self:flex-start}" +
    ".pest-level.bad{background:var(--tint-bad);color:var(--rust)}" +
    ".pest-level.warn{background:var(--tint-warn);color:#7A5A11}" +
    ".pest-level.ok{background:var(--tint-ok);color:#1B5E3A}" +
    ".pest-level.none{background:var(--canopy);color:var(--ink-faint)}" +
    ".pest-dots{display:inline-flex;gap:3px}" +
    ".pest-dot{width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.28}" +
    ".pest-dot.lit{opacity:1}" +
    ".pest-when{font-size:.78rem;color:var(--ink-soft);line-height:1.5}" +
    /* หัวการ์ดรายละเอียด ให้ภาพใหญ่ขึ้นเพื่อดูลักษณะได้ชัด */
    ".pest-head{display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap}" +
    ".pest-head .pest-art{width:96px;height:96px}" +
    ".pest-head-mid{flex:1;min-width:190px}";
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
      "ไฟล์ pest-guide.js ยังไม่ได้อัปโหลดขึ้นเซิร์ฟเวอร์ กรุณาวางไว้ในโฟลเดอร์เดียวกับ index.html"));
    return;
  }

  const keys = Object.keys(P.pests);

  // เรียงตามความอันตราย ตัวที่ต้องรีบจัดการอยู่บนสุด
  // ไม่เรียงตามตัวอักษรเพราะผู้ใช้ที่เปิดหน้านี้มักกำลังมีปัญหาอยู่
  // สิ่งที่เขาต้องเห็นก่อนคือตัวที่ทำให้เสียหายหนักที่สุด
  const order = { high: 0, mid: 1, low: 2 };
  keys.sort((a, b) => {
    const ra = rate(a).level, rb = rate(b).level;
    return (ra ? order[ra] : 9) - (rb ? order[rb] : 9);
  });

  // ── ภาพระดับอันตราย 3 ระดับ ──
  function levelBadge(key) {
    const r = rate(key);
    if (!r.level) {
      const b = el("span", "pest-level none", "ยังไม่ได้จัดระดับ");
      return b;
    }
    const L = LEVELS[r.level];
    const b = el("span", "pest-level " + L.tone);

    // จุดสามจุดบอกระดับด้วยสายตา อ่านได้เร็วกว่าตัวหนังสือเมื่อกวาดดูหลายตัว
    const dots = el("span", "pest-dots");
    const lit = r.level === "high" ? 3 : r.level === "mid" ? 2 : 1;
    for (let i = 0; i < 3; i++) {
      dots.appendChild(el("i", "pest-dot" + (i < lit ? " lit" : "")));
    }
    b.appendChild(dots);
    b.appendChild(document.createTextNode(L.word));
    return b;
  }

  function artNode(key, pest, cls) {
    const box = el("div", cls || "pest-art");
    const r = rate(key);
    const color = !r.level ? "var(--ink-faint)"
      : r.level === "high" ? "var(--rust)"
      : r.level === "mid" ? "var(--grain)" : "var(--blade)";
    box.innerHTML =
      '<svg viewBox="0 0 64 64" fill="none" stroke="' + color +
      '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
      'role="img" aria-label="ภาพวาดประกอบของ' + (pest.thai || "แมลง") + '">' +
      artFor(key, pest) + "</svg>";
    return box;
  }

  // ══ คำเตือนเรื่องภาพ วางบนสุด ══
  //
  // ต้องอยู่ก่อนภาพทั้งหมด ไม่ใช่ท้ายหน้า เพราะผู้ใช้จะเห็นภาพก่อนเลื่อนลงไปอ่านคำเตือน
  // การเตือนหลังจากที่เขาสรุปไปแล้วไม่ได้ช่วยอะไร
  root.appendChild(bund("แมลงและสัตว์ศัตรูข้าว"));

  const intro = plot(null);
  intro.appendChild(el("div", "flash flash-warn",
    "ภาพในหน้านี้เป็นภาพวาดประกอบ ใช้ดูว่าเป็นกลุ่มเพลี้ย หนอน หรือหอยได้คร่าวๆ เท่านั้น " +
    "ห้ามใช้เทียบระบุชนิดแทนตัวจริง เพราะแมลงหลายชนิดหน้าตาคล้ายกันมากแต่ใช้สารคนละตัว " +
    "ให้ยืนยันชนิดกับเกษตรอำเภอหรือศูนย์วิจัยข้าวก่อนซื้อสารเคมีทุกครั้ง"));
  intro.appendChild(el("div", "read-foot",
    "สีและจำนวนจุดบนป้ายบอกระดับความอันตราย · แดงสามจุดคือต้องรีบจัดการ " +
    "ทองสองจุดคือให้เดินสำรวจก่อน เขียวหนึ่งจุดคือเฝ้าดูตามปกติ"));
  root.appendChild(intro);

  // ══ ตัวแยกว่าเป็นโรคหรือแมลง ══
  //
  // วางไว้ก่อนรายชื่อแมลงโดยตั้งใจ เพราะเป็นคำถามที่ต้องตอบก่อนเสมอ
  // ถ้าอาการที่เห็นเกิดจากเชื้อรา การไล่ดูรายชื่อแมลงคือการเดินผิดทางตั้งแต่ต้น
  // และจะจบด้วยการซื้อยาฆ่าแมลงมาพ่นโรคพืช ซึ่งเสียเงินแล้วไม่ได้ผลเลย
  if (P.triage && P.triage.length) {
    root.appendChild(bund("ก่อนอื่น แยกให้ออกว่าเป็นแมลงหรือโรค"));
    const tri = plot(null, "โรคพืชไม่ทำให้เนื้อใบหายไป ถ้าเห็นรอยกัดหรือใบแหว่ง แปลว่าเป็นแมลงแน่นอน");
    const ul = el("ul");
    ul.style.cssText = "margin:0;padding-left:19px;font-size:.88rem";
    P.triage.forEach((line) => {
      const li = el("li", "", line);
      li.style.marginBottom = "6px";
      ul.appendChild(li);
    });
    tri.appendChild(ul);
    tri.appendChild(el("div", "flash flash-bad",
      "โมเดลตรวจภาพของระบบจำแนกได้เฉพาะโรค 6 ชนิด ไม่ได้เทรนให้รู้จักแมลง " +
      "ถ้าอาการเกิดจากแมลง ผลตรวจจากภาพจะไม่ถูกต้อง ห้ามเชื่อผลจากภาพในกรณีนี้"));
    root.appendChild(tri);
  }

  // ══ รายชื่อแมลง ══
  root.appendChild(bund("เลือกแมลงที่พบในแปลง"));

  const gridCard = plot(null, "เรียงจากที่อันตรายที่สุดลงมา กดที่การ์ดเพื่อดูวิธีจัดการ");
  const grid = el("div", "pest-grid");
  gridCard.appendChild(grid);
  root.appendChild(gridCard);

  const detail = el("div");
  root.appendChild(detail);

  let picked = null;

  keys.forEach((key) => {
    const pest = P.pests[key];
    const card = el("button", "pest-card");
    card.appendChild(artNode(key, pest));
    card.appendChild(levelBadge(key));
    card.appendChild(el("div", "pest-name", pest.thai));
    if (pest.sci) card.appendChild(el("div", "pest-sci", pest.sci));
    if (pest.stage) card.appendChild(el("div", "pest-when", "พบระยะ " + pest.stage));

    card.onclick = function () {
      picked = key;
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
    const r = rate(key);
    const L = r.level ? LEVELS[r.level] : null;
    detail.innerHTML = "";

    detail.appendChild(bund(pest.thai));

    // ── หัวการ์ด: ภาพ ระดับอันตราย และสิ่งที่ต้องทำก่อน ──
    const head = plot(null);
    const row = el("div", "pest-head");
    row.appendChild(artNode(key, pest));

    const mid = el("div", "pest-head-mid");
    mid.appendChild(levelBadge(key));
    const nm = el("div", "pest-name", pest.thai);
    nm.style.cssText = "font-size:1.25rem;margin-top:7px";
    mid.appendChild(nm);
    if (pest.sci) mid.appendChild(el("div", "pest-sci", pest.sci));
    if (L) {
      const act = el("div", "", "สิ่งที่ควรทำตอนนี้: " + L.act);
      act.style.cssText = "margin-top:9px;font-weight:600;font-size:.9rem;color:var(--deep)";
      mid.appendChild(act);
    }
    row.appendChild(mid);
    head.appendChild(row);

    // เหตุผลของการจัดระดับ ต้องแสดงเสมอ ไม่ซ่อนไว้ในปุ่มขยาย
    // ผู้ใช้ควรตัดสินใจจากเหตุผล ไม่ใช่จากสีของป้าย
    head.appendChild(el("div", "rx-sect", "ทำไมถึงจัดระดับนี้"));
    head.appendChild(el("p", "", r.why));
    head.querySelector("p").style.cssText = "margin:0;font-size:.88rem";
    detail.appendChild(head);

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

    // ── วิธีสังเกตและวิธีจัดการ ──
    detail.appendChild(bund("อาการและวิธีแก้ไข"));
    const box = plot(null);
    let n = 0;

    if (pest.damage) {
      box.appendChild(fold(++n, "ลักษณะการทำลายที่จะเห็น", null, (b) => {
        b.appendChild(el("p", "", pest.damage));
        if (pest.sign) b.appendChild(el("div", "fold-note", "สัญญาณสังเกต: " + pest.sign));
      }, true));   // เปิดอันแรกไว้ ให้เห็นทันทีว่าตรงกับที่เจอในแปลงไหม
    }

    if (pest.manage && pest.manage.length) {
      box.appendChild(fold(++n, "วิธีจัดการโดยไม่ใช้สารเคมี", "ทำได้ทันทีและไม่มีผลข้างเคียง", (b) => {
        const ul = el("ul");
        ul.style.cssText = "margin:0;padding-left:19px";
        pest.manage.forEach((x) => {
          const li = el("li", "", x);
          li.style.marginBottom = "6px";
          ul.appendChild(li);
        });
        b.appendChild(ul);
      }, true));   // เปิดไว้ด้วย เพราะนี่คือสิ่งที่ควรทำก่อนเสมอ
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
      box.appendChild(fold(++n, "สารที่ห้ามใช้เด็ดขาด", "ความผิดพลาดที่ทำให้เสียหายหนักที่สุด", (b) => {
        b.appendChild(el("div", "flash flash-bad", pest.avoid));
      }, r.level === "high"));   // ตัวอันตรายสูงเปิดไว้เลย เพราะพลาดแล้วเสียหายหนัก
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
    help.appendChild(el("p", "",
      "ไปที่หน้าคำแนะนำการดูแล แล้วพิมพ์บรรยายอาการที่เห็นในช่องถาม AI " +
      "เช่น ข้าวอายุกี่วัน อาการอยู่ที่ใบ ยอด หรือรวง และเห็นตัวแมลงหรือไม่ " +
      "ระบบจะช่วยเทียบกับแมลงทุกชนิดในฐานข้อมูลแล้วถามกลับเพื่อแยกให้ชัดขึ้น"));
    help.querySelector("p").style.cssText = "margin:0;font-size:.88rem";
    detail.appendChild(help);
  }

  // ══ หลักการทั่วไป วางท้ายหน้า ══
  if (P.principles && P.principles.length) {
    root.appendChild(bund("หลักการจัดการศัตรูข้าว"));
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
      "ข้อมูลอ้างอิงเอกสารความรู้ Rice Knowledge Bank กรมการข้าว " +
      "การจัดระดับความอันตรายเป็นการประเมินของระบบจากความเสียหายที่เกิดได้จริง " +
      "ไม่ใช่การจัดระดับอย่างเป็นทางการของหน่วยงานใด " +
      "ความรุนแรงจริงขึ้นกับอายุข้าว พันธุ์ที่ปลูก และสภาพแปลงของแต่ละพื้นที่ " +
      "ก่อนใช้สารเคมีทุกครั้งควรปรึกษาเกษตรอำเภอ หมอดินอาสา หรือศูนย์วิจัยข้าวในพื้นที่"));
    root.appendChild(pc);
  }
};

})();

/* ══════════════════════════════════════════════════════════
   วิธีเชื่อมกับ index.html — แก้ 3 จุด

   จุดที่ 1  ใต้บรรทัด <script src="pest-guide.js?v=12"></script> เพิ่ม
       <script src="pest-page.js?v=1"></script>

   จุดที่ 2  ในตัวแปร PAGES เพิ่มรายการนี้ต่อจากบรรทัดของ diagnose
       { id: "pest", label: "แมลงศัตรูข้าว", kicker: "ระหว่างปลูก", group: "2 · ระหว่างปลูก",
         icon: "M12 4v5m0 0a4 4 0 00-4 4v3a4 4 0 008 0v-3a4 4 0 00-4-4zm-4 5L4 7m4 6H4m4 4l-4 2m12-12l4-2m-4 6h4m-4 4l4 2" },

   จุดที่ 3  ต่อท้ายบรรทัด views.diagnose = ... (ก่อน views.survey) เพิ่ม
       views.pest = function (root) {
         if (typeof window.buildPestPage !== "function") {
           root.appendChild(stateBlock("!", "ยังโหลดหน้าแมลงไม่ได้",
             "ไฟล์ pest-page.js ยังไม่ได้อัปโหลด หรือเบราว์เซอร์ยังใช้ไฟล์เก่าที่ค้างในแคช"));
           return;
         }
         window.buildPestPage(root, {
           el: el, plot: plot, bund: bund, fold: fold,
           more: more, stateBlock: stateBlock, readOut: readOut
         });
       };
   ══════════════════════════════════════════════════════════ */
