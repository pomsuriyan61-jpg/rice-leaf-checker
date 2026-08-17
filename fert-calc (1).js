// ============================================================
// fert-calc.js — เครื่องคำนวณปุ๋ยเคมี (ติดตั้งไฟล์เดียวจบ)
// ============================================================
//
// วิธีใช้: อัปไฟล์นี้ขึ้น repo แล้วเพิ่มบรรทัดเดียวใน index.html
// วางไว้ก่อนปิด </body> และต้องอยู่ "หลัง" fertilizer-guide.js
//
//   <script src="fert-calc.js"></script>
//
// ไม่ต้องแก้ไฟล์อื่นเลย ไฟล์นี้จัดการเองทั้งหมด คือ
//   1. ใส่ CSS ของตัวเอง
//   2. เติมข้อมูลอัตราปุ๋ยเคมีเข้า FERT_GUIDE ถ้ายังไม่มี
//   3. เฝ้าดูหน้าเว็บ พอเจอกล่อง "ยังไม่มีอัตราอ้างอิง" ของปุ๋ยเคมี
//      ก็แทนที่ด้วยเครื่องคำนวณให้อัตโนมัติ
//
// ------------------------------------------------------------
// ข้อจำกัดที่ต้องรู้
// ------------------------------------------------------------
// วิธีนี้ทำงานโดยเฝ้าดู DOM แล้วแทนที่ทีหลัง ซึ่งเป็นทางลัด
// ข้อดีคือไม่ต้องแตะโค้ดเดิม จึงไม่มีทางทำของเดิมพัง
// ข้อเสียคือถ้าวันหลังแก้ข้อความ "ยังไม่มีอัตราอ้างอิงสำหรับปุ๋ยชนิดนี้"
// หรือหัวข้อ "คำนวณปริมาณที่ต้องเตรียม" ในหน้าเว็บ ตัวนี้จะหาไม่เจอและเงียบไป
//
// ทางที่สะอาดกว่าคือเรียก FertCalc.render() ตรงๆ จากโค้ดที่วาดหน้า
// ซึ่งไฟล์นี้เปิดไว้ให้แล้ว ถ้าพร้อมเมื่อไหร่ค่อยย้ายไปใช้แบบนั้นได้
//
// ------------------------------------------------------------
// ที่มาของตัวเลข
// ------------------------------------------------------------
// ทุกตัวเลขยกมาจากช่อง rates ของ chem ใน fertilizer-guide.js โดยตรง
// ซึ่งอ้างอิง Rice Knowledge Bank กรมการข้าว
// ไม่มีตัวเลขใดที่ประมาณหรือคำนวณขึ้นใหม่
//
// จงใจไม่แตะปุ๋ยคอก เพราะ calc: null ในไฟล์เดิมเป็นการตั้งใจไม่ให้ตัวเลข
// ที่ไม่มีแหล่งอ้างอิงรองรับ การเดาอัตราให้เกษตรกรซื้อตามคือความเสียหาย
// ที่ป้องกันได้ด้วยการไม่เดา ส่วนปุ๋ยหมักกับปุ๋ยพืชสดมี calc อยู่แล้ว

(function (global) {
  'use strict';

  var BAG_KG = 50;
  var EMPTY_MARKER = 'ยังไม่มีอัตราอ้างอิง';
  var HEADING_TEXT = 'คำนวณปริมาณที่ต้องเตรียม';
  var MOUNTED_FLAG = 'fcMounted';

  // ------------------------------------------------------------
  // 1. ข้อมูลอัตราปุ๋ยเคมี
  // ------------------------------------------------------------
  var CHEM_CALC = {
    mode: 'chem',
    unit: 'กก.',
    bagKg: BAG_KG,
    formulas: ['16-20-0', '16-16-8', '18-22-0', '20-20-0', '18-46-0'],
    first: {
      sensitive: { min: 20, max: 25 },
      nonsensitive: { min: 30, max: 35 },
      timing: 'อายุ 20-30 วันหลังข้าวงอก — นาดำใส่วันปักดำหรือก่อน 1 วันแล้วคราดกลบ หรือหลังปักดำไม่เกิน 15 วันเมื่อต้นตั้งตัวแล้ว'
    },
    potash: {
      formula: '0-0-60',
      min: 5,
      max: 10,
      soils: ['sand'],
      skipReasonHasK: 'สูตรที่เลือกมีโพแทสเซียมอยู่แล้ว ถ้าเสริม 0-0-60 ซ้ำจะได้เกินความต้องการเกินเท่าตัวโดยไม่ได้ผลผลิตเพิ่ม เป็นการจ่ายค่าปุ๋ยทิ้งเปล่า',
      skipReasonSoil: 'ดินเหนียวและดินร่วนมักมีโพแทสเซียมเพียงพออยู่แล้ว ไม่ต้องเสริมไม่ว่าจะใช้สูตรไหน'
    },
    second: {
      sensitive: {
        urea: 10,
        ammonium: 20,
        timing: 'นับถอยหลัง 30 วันจากวันออกดอกของพันธุ์ ไม่ใช่นับตามอายุ — ขาวดอกมะลิ 105 ใส่ประมาณ 26 ก.ย. | กข6 ใส่ประมาณ 22 ก.ย.'
      },
      nonsensitive: {
        urea: 20,
        ammonium: 20,
        timing: 'พันธุ์อายุประมาณ 100 วัน ตกที่อายุ 45-50 วันหลังหว่าน หรือนับหลังใส่ปุ๋ยครั้งแรก 30 วัน'
      },
      check: 'วิธีเช็กที่แม่นที่สุดคือผ่าลำต้นดู ถ้าเห็นช่อดอกอ่อนสีขาวขนาด 1-2 มิลลิเมตรในกาบใบ แปลว่าถึงจังหวะแล้วไม่ว่าปฏิทินจะบอกอะไร'
    },
    waterNote: 'ควรมีน้ำในนาตื้นๆ ประมาณ 5 ซม. ขณะใส่ปุ๋ย และห้ามระบายน้ำออกภายใน 7 วันหลังใส่ เพราะปุ๋ยจะไหลไปกับน้ำ'
  };

  var SOIL_OPTIONS = [
    { value: 'clay', label: 'ดินเหนียว' },
    { value: 'loam', label: 'ดินร่วน' },
    { value: 'sand', label: 'ดินทราย / ดินร่วนทราย' }
  ];

  var VARIETY_OPTIONS = [
    { value: 'sensitive', label: 'ไวต่อช่วงแสง (ขาวดอกมะลิ 105, กข6)' },
    { value: 'nonsensitive', label: 'ไม่ไวต่อช่วงแสง (พันธุ์นาปรัง)' }
  ];

  // ------------------------------------------------------------
  // 2. สไตล์
  // ------------------------------------------------------------
  var CSS = [
    '.fc-wrap{padding:4px 0}',
    '.fc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:16px}',
    '.fc-field{display:flex;flex-direction:column}',
    '.fc-label{font-size:13px;color:#6b6b6b;margin-bottom:6px}',
    '.fc-input{width:100%;height:40px;padding:0 12px;font-size:15px;font-family:inherit;color:#1a1a1a;background:#fff;border:1px solid #e3e3e0;border-radius:8px;box-sizing:border-box}',
    '.fc-input:focus{outline:none;border-color:#1f7a4d;box-shadow:0 0 0 3px #eaf5ee}',
    '.fc-card{background:#f7f7f5;border-radius:8px;padding:16px;margin-bottom:12px}',
    '.fc-card--warn{background:#fdf6e7}',
    '.fc-card--warn .fc-card-note{color:#7a5510}',
    '.fc-card-step{font-size:13px;color:#6b6b6b;margin-bottom:4px}',
    '.fc-card-title{font-size:17px;font-weight:500;color:#1a1a1a;margin-bottom:4px}',
    '.fc-card-note{font-size:13px;line-height:1.6;color:#6b6b6b;margin-bottom:10px}',
    '.fc-row{display:flex;justify-content:space-between;gap:12px;font-size:15px;padding:5px 0}',
    '.fc-row-label{color:#6b6b6b}',
    '.fc-row-value{font-weight:500;color:#1a1a1a;text-align:right}',
    '.fc-hint{font-size:13px;line-height:1.6;color:#6b6b6b;padding:0 4px 8px}',
    '.fc-error{font-size:13px;color:#b3261e;margin-bottom:12px}'
  ].join('');

  function injectStyle() {
    if (document.getElementById('fc-style')) return;
    var tag = document.createElement('style');
    tag.id = 'fc-style';
    tag.textContent = CSS;
    document.head.appendChild(tag);
  }

  // ------------------------------------------------------------
  // 3. ตัวช่วย
  // ------------------------------------------------------------

  // ข้อความในไฟล์ข้อมูลถูกแก้โดยคนที่ไม่ได้เขียนโปรแกรม
  // ถ้าเผลอพิมพ์เครื่องหมายพิเศษลงไปต้องไม่ทำให้หน้าพัง
  function esc(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmt(n) {
    return Math.round(n).toLocaleString('th-TH');
  }

  // ปัดขึ้นเป็นกระสอบเต็มเสมอ เพราะร้านไม่ขายเศษกระสอบ
  // ผู้ใช้ต้องซื้อเผื่อ ไม่ใช่ซื้อขาด
  function bags(kg) {
    return Math.ceil(kg / BAG_KG);
  }

  function selectHtml(id, options, selected) {
    var opts = options.map(function (o) {
      return '<option value="' + esc(o.value) + '"' +
        (o.value === selected ? ' selected' : '') + '>' + esc(o.label) + '</option>';
    }).join('');
    return '<select id="' + esc(id) + '" class="fc-input">' + opts + '</select>';
  }

  function fieldHtml(label, control) {
    return '<div class="fc-field"><label class="fc-label">' + esc(label) + '</label>' + control + '</div>';
  }

  function rowHtml(label, value) {
    return '<div class="fc-row"><span class="fc-row-label">' + esc(label) +
      '</span><span class="fc-row-value">' + esc(value) + '</span></div>';
  }

  function cardHtml(step, title, note, rows, tone) {
    return '<div class="fc-card' + (tone ? ' fc-card--' + tone : '') + '">' +
      '<div class="fc-card-step">' + esc(step) + '</div>' +
      '<div class="fc-card-title">' + esc(title) + '</div>' +
      (note ? '<div class="fc-card-note">' + esc(note) + '</div>' : '') +
      rows.join('') + '</div>';
  }

  // อ่านตัวเลขโพแทสเซียมจากชื่อสูตร เช่น 16-16-8 คืน 8
  // ถ้ารูปแบบผิดจากที่คาด ให้ถือว่ามีโพแทสเซียมไว้ก่อน คือไม่แนะนำให้เสริม
  // เพราะการไม่เสริมทั้งที่ควรเสริม เสียหายน้อยกว่าการเสริมซ้ำจนเกินเท่าตัว
  function potassiumIn(formula) {
    var parts = String(formula).split('-');
    if (parts.length !== 3) return 1;
    var k = parseFloat(parts[2]);
    return isFinite(k) ? k : 1;
  }

  // ------------------------------------------------------------
  // 4. วาดเครื่องคำนวณ
  // ------------------------------------------------------------
  function renderChem(container, defaults) {
    if (!container) return;
    defaults = defaults || {};
    var calc = CHEM_CALC;
    var uid = 'fc' + Math.random().toString(36).slice(2, 8);
    var formulaOptions = calc.formulas.map(function (f) {
      return { value: f, label: f };
    });

    container.innerHTML =
      '<div class="fc-wrap">' +
        '<div class="fc-grid">' +
          fieldHtml('พื้นที่ (ไร่)',
            '<input type="number" id="' + uid + '-rai" class="fc-input" min="0.5" step="0.5" value="' +
            esc(defaults.rai != null ? defaults.rai : 1) + '">') +
          fieldHtml('พันธุ์ข้าว', selectHtml(uid + '-variety', VARIETY_OPTIONS, defaults.variety || 'sensitive')) +
          fieldHtml('สูตรปุ๋ยครั้งที่ 1', selectHtml(uid + '-formula', formulaOptions, defaults.formula || calc.formulas[0])) +
          fieldHtml('ชนิดดิน', selectHtml(uid + '-soil', SOIL_OPTIONS, defaults.soil || 'clay')) +
        '</div>' +
        '<div class="fc-error" id="' + uid + '-err" hidden></div>' +
        '<div id="' + uid + '-out"></div>' +
      '</div>';

    var raiInput = container.querySelector('#' + uid + '-rai');
    var varietySel = container.querySelector('#' + uid + '-variety');
    var formulaSel = container.querySelector('#' + uid + '-formula');
    var soilSel = container.querySelector('#' + uid + '-soil');
    var errBox = container.querySelector('#' + uid + '-err');
    var outBox = container.querySelector('#' + uid + '-out');

    function update() {
      var rai = parseFloat(raiInput.value);
      if (!isFinite(rai) || rai <= 0) {
        errBox.textContent = 'กรอกพื้นที่เป็นตัวเลขมากกว่า 0';
        errBox.hidden = false;
        outBox.innerHTML = '';
        return;
      }
      errBox.hidden = true;

      var varietyKey = varietySel.value;
      var formula = formulaSel.value;
      var first = calc.first[varietyKey];
      var second = calc.second[varietyKey];
      var html = '';

      html += cardHtml('ครั้งที่ 1 — ระยะแตกกอ', formula, calc.first.timing, [
        rowHtml('อัตรา', first.min + '-' + first.max + ' กก./ไร่'),
        rowHtml('รวมทั้งแปลง', fmt(rai * first.min) + '-' + fmt(rai * first.max) + ' กก.'),
        rowHtml('กระสอบ ' + BAG_KG + ' กก.', bags(rai * first.min) + '-' + bags(rai * first.max) + ' กระสอบ')
      ]);

      // เสริมโพแทสเซียมต้องเข้าเงื่อนไขครบสองข้อ ไม่ใช่ดูชนิดดินอย่างเดียว
      var hasK = potassiumIn(formula) > 0;
      var sandySoil = calc.potash.soils.indexOf(soilSel.value) !== -1;
      if (hasK) {
        html += cardHtml('เสริมโพแทสเซียม', 'ไม่ต้องเสริม ' + calc.potash.formula,
          calc.potash.skipReasonHasK, [rowHtml('ปริมาณ', '0 กก.')], 'warn');
      } else if (!sandySoil) {
        html += cardHtml('เสริมโพแทสเซียม', 'ไม่ต้องเสริม ' + calc.potash.formula,
          calc.potash.skipReasonSoil, [rowHtml('ปริมาณ', '0 กก.')], 'warn');
      } else {
        html += cardHtml('เสริมโพแทสเซียม', calc.potash.formula,
          'ดินทรายอุ้มโพแทสเซียมไม่อยู่ ใส่พร้อมปุ๋ยครั้งที่ 1', [
            rowHtml('อัตรา', calc.potash.min + '-' + calc.potash.max + ' กก./ไร่'),
            rowHtml('รวมทั้งแปลง', fmt(rai * calc.potash.min) + '-' + fmt(rai * calc.potash.max) + ' กก.')
          ]);
      }

      html += cardHtml('ครั้งที่ 2 — ระยะกำเนิดช่อดอก', 'ยูเรีย 46-0-0', second.timing, [
        rowHtml('อัตรา', second.urea + ' กก./ไร่'),
        rowHtml('รวมทั้งแปลง', fmt(rai * second.urea) + ' กก.'),
        rowHtml('กระสอบ ' + BAG_KG + ' กก.', bags(rai * second.urea) + ' กระสอบ'),
        rowHtml('หรือใช้ 21-0-0 แทน', fmt(rai * second.ammonium) + ' กก.')
      ]);

      html += '<div class="fc-hint">' + esc(calc.second.check) + '</div>';
      html += '<div class="fc-hint">' + esc(calc.waterNote) + '</div>';
      outBox.innerHTML = html;
    }

    [raiInput, varietySel, formulaSel, soilSel].forEach(function (node) {
      node.addEventListener('input', update);
      node.addEventListener('change', update);
    });
    update();
  }

  // ------------------------------------------------------------
  // 5. ติดตั้งอัตโนมัติ
  // ------------------------------------------------------------

  // ต้องแน่ใจว่ากำลังดูหน้าปุ๋ยเคมีจริงๆ ไม่ใช่ปุ๋ยคอก
  // ทั้งสองชนิดแสดงกล่องว่างเหมือนกัน แต่ปุ๋ยคอกตั้งใจให้ว่าง จึงห้ามแตะ
  function isChemPage() {
    var text = document.body.textContent || '';
    if (text.indexOf('มูลสัตว์สด') !== -1) return false;
    return text.indexOf('ระยะกำเนิดช่อดอก') !== -1 || text.indexOf('16-20-0') !== -1;
  }

  // หากล่องคำนวณจากหัวข้อก่อน ถ้าไม่เจอค่อยไล่หาจากข้อความว่าง
  function findCalcBox() {
    var nodes = document.querySelectorAll('h1,h2,h3,h4,h5,div,p,span');
    for (var i = 0; i < nodes.length; i++) {
      if ((nodes[i].textContent || '').trim() === HEADING_TEXT) {
        var box = nodes[i].nextElementSibling;
        if (box) return box;
      }
    }
    // สำรอง: หา div ที่ลึกที่สุดที่ยังมีข้อความว่างอยู่ แล้วใช้ตัวแม่ของมัน
    var candidates = document.querySelectorAll('div');
    for (var j = 0; j < candidates.length; j++) {
      var node = candidates[j];
      if ((node.textContent || '').indexOf(EMPTY_MARKER) === -1) continue;
      var inner = node.querySelectorAll('div');
      var deepest = true;
      for (var k = 0; k < inner.length; k++) {
        if ((inner[k].textContent || '').indexOf(EMPTY_MARKER) !== -1) { deepest = false; break; }
      }
      if (deepest) return node.parentElement || node;
    }
    return null;
  }

  function tryMount() {
    var box = findCalcBox();
    if (!box || box.dataset[MOUNTED_FLAG] === '1') return;
    if ((box.textContent || '').indexOf(EMPTY_MARKER) === -1) return;
    if (!isChemPage()) return;

    box.dataset[MOUNTED_FLAG] = '1';
    try {
      renderChem(box, global.FC_DEFAULTS || {});
    } catch (err) {
      // ถ้าวาดไม่สำเร็จ ต้องไม่ทิ้งกล่องเปล่าไว้ให้ผู้ใช้งง ปลดธงเพื่อให้ลองใหม่ได้
      delete box.dataset[MOUNTED_FLAG];
      console.error('[fert-calc] วาดเครื่องคำนวณไม่สำเร็จ', err);
    }
  }

  function start() {
    injectStyle();

    // เติมข้อมูลเข้า FERT_GUIDE เผื่อโค้ดส่วนอื่นเรียกใช้ เช่นตอนส่งให้ AI ตอบ
    // ไม่ทับของเดิมถ้ามีอยู่แล้ว เพื่อให้แก้ในไฟล์ข้อมูลมีผลเหนือกว่าเสมอ
    var guide = global.FERT_GUIDE;
    if (guide && guide.types && guide.types.chem && !guide.types.chem.calc) {
      guide.types.chem.calc = CHEM_CALC;
    }

    tryMount();

    // หน้าเว็บวาดเนื้อหาใหม่เมื่อผู้ใช้สลับชนิดปุ๋ยหรือเปลี่ยนหน้า
    // จึงต้องเฝ้าดูตลอด ไม่ใช่เช็คแค่ตอนโหลดครั้งแรก
    if (typeof MutationObserver === 'function') {
      var pending = null;
      var observer = new MutationObserver(function () {
        // หน่วงสั้นๆ กัน tryMount ยิงรัวตอนหน้าวาดใหม่ทีละส่วน
        if (pending) clearTimeout(pending);
        pending = setTimeout(tryMount, 120);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // เปิดไว้ให้เรียกตรงๆ ได้ ถ้าวันหลังอยากเลิกพึ่งการเฝ้าดู DOM
  global.FertCalc = { render: renderChem, data: CHEM_CALC };
})(window);
