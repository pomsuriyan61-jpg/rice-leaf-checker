// ============================================================
// ph-log.js — วัดค่า pH ดิน 5 จุด ในหน้าเตรียมดิน
// ============================================================
//
// วิธีใช้: อัปไฟล์นี้ขึ้น repo แล้วเพิ่มใน index.html หลัง soil-guide.js
//
//   <script src="ph-log.js?v=3"></script>
//
// ------------------------------------------------------------
// ทำไมต้อง 5 จุด ไม่ใช่จุดเดียว
// ------------------------------------------------------------
// ดินในแปลงเดียวกันค่า pH ไม่เท่ากันทุกจุด ตรงที่เคยเป็นคอกสัตว์ ตรงที่น้ำขังประจำ
// หรือตรงที่เคยใส่ปูนไปแล้ว จะต่างจากจุดอื่นได้เป็นหน่วยเต็มๆ
// การวัดจุดเดียวแล้วสรุปทั้งแปลงจึงให้ภาพที่ผิด และอาจนำไปสู่การใส่ปูนผิดอัตรา
//
// หน้าบันทึกสำรวจของระบบใช้ 5 จุดเฉลี่ยอยู่แล้ว ไฟล์นี้ทำให้หน้าเตรียมดินตรงกัน
// เพื่อให้ค่าที่บันทึกจากสองหน้าเทียบกันได้จริง ถ้าหน้าหนึ่งวัดจุดเดียวอีกหน้าวัด 5 จุด
// การเอามาเทียบแนวโน้มจะไม่มีความหมาย เพราะวิธีได้มาต่างกัน
//
// ------------------------------------------------------------
// สิ่งที่ไฟล์นี้จงใจไม่ทำ
// ------------------------------------------------------------
// ไม่คำนวณอัตราปูนขาวจากค่า pH ตามที่คอมเมนต์ใน soil-guide.js เขียนไว้
// และไม่แนะนำสูตรปุ๋ยจาก pH ตามที่คอมเมนต์ใน fertilizer-guide.js ห้ามไว้
// ข้อความแปลผลทั้งหมดดึงจาก SOIL_GUIDE.phBands โดยตรง ไม่มีการเขียนใหม่

(function (global) {
  'use strict';

  var POINT_COUNT = 5;
  var PAGE_TITLE = 'เตรียมดิน';
  var SLOT_ID = 'ph-log-1';

  // ค่า pH ที่เป็นไปได้จริงในดินนา นอกช่วงนี้คือกรอกผิดหรือเครื่องวัดเพี้ยน
  var PH_MIN = 3;
  var PH_MAX = 10;

  // ความต่างที่ถือว่าเปลี่ยนจริง ไม่ใช่ความคลาดเคลื่อนของเครื่องวัด
  // ชุดวัดแบบน้ำยาเทียบสีอ่านละเอียดได้ราว 0.5 หน่วย
  // ตั้งไว้ที่ 0.3 เพื่อไม่ให้รายงานว่าดีขึ้นจากความคลาดเคลื่อนล้วนๆ
  var MEANINGFUL_DIFF = 0.3;

  // ช่วงที่ข้าวดูดธาตุอาหารได้ดีที่สุด ใช้วัดว่าค่าใหม่เข้าใกล้หรือออกห่าง
  var IDEAL_LOW = 5.5;
  var IDEAL_HIGH = 6.5;

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
  // ไม่เขียนที่เก็บใหม่ เพราะ Store.add() มีของที่เขียนเองแล้วจะได้ไม่ครบ
  // คือยิงขึ้น Cloudflare Worker, เก็บลงเครื่องไว้ก่อนถ้าเน็ตล่ม
  // และจัดการ session หมดอายุให้ ค่า pH จึงไปอยู่ในทะเบียนบันทึกเหมือนข้อมูลอื่น
  function storeApi() {
    return global.Store || null;
  }

  function profileName() {
    var store = storeApi();
    try {
      return (store && store.profile && store.profile().name) || '';
    } catch (err) {
      return '';
    }
  }

  // หาค่า pH ที่บันทึกไว้ล่าสุดก่อนหน้านี้ เพื่อเอามาเทียบแนวโน้ม
  // ดูทุกรายการที่มีค่า pH ไม่ว่าจะบันทึกจากหน้าไหน เพราะทั้งสองหน้าใช้ 5 จุดเหมือนกัน
  // จึงเทียบกันได้ตรงๆ ไม่ต้องแยกว่ามาจากหน้าเตรียมดินหรือบันทึกสำรวจ
  function loadLatest() {
    var store = storeApi();
    if (!store) return Promise.resolve(null);

    var getList = store.list || store.all || store.entries;
    if (typeof getList !== 'function') return Promise.resolve(null);

    return Promise.resolve()
      .then(function () { return getList.call(store); })
      .then(function (entries) {
        if (!Array.isArray(entries)) return null;
        for (var i = 0; i < entries.length; i++) {
          var e = entries[i];
          if (e && typeof e.ph === 'number' && e.ph > 0) {
            return { ph: e.ph, date: e.date };
          }
        }
        return null;
      })['catch'](function (err) {
        console.warn('[ph-log] อ่านบันทึกเดิมไม่สำเร็จ', err);
        return null;
      });
  }

  function saveReading(avg, points, date) {
    var store = storeApi();
    if (!store || typeof store.add !== 'function') {
      return Promise.reject(new Error('ยังไม่พร้อมบันทึก ลองรีเฟรชหน้าอีกครั้ง'));
    }
    // ใส่ฟิลด์ให้ตรงกับ entry ของบันทึกสำรวจ เพื่อให้แสดงในทะเบียนได้เหมือนกัน
    return Promise.resolve(store.add({
      date: date,
      owner: profileName(),
      gps: '',
      ph: avg,
      phPoints: points,
      disease: 'วัดค่า pH ดิน — ก่อนปลูก',
      score: null,
      image: null
    }));
  }

  // ------------------------------------------------------------
  // สไตล์
  // ------------------------------------------------------------
  var CSS = [
    '.ph-card{background:#fff;border:1px solid #e3e3e0;border-radius:12px;padding:20px;margin-bottom:20px}',
    '.ph-head{font-size:17px;font-weight:500;color:#1a1a1a;margin-bottom:4px}',
    '.ph-sub{font-size:13px;color:#6b6b6b;margin-bottom:16px}',
    '.ph-points{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-bottom:14px}',
    '.ph-field{display:flex;flex-direction:column}',
    '.ph-label{font-size:13px;color:#6b6b6b;margin-bottom:6px}',
    '.ph-input{width:100%;height:40px;padding:0 12px;font-size:15px;font-family:inherit;color:#1a1a1a;background:#fff;border:1px solid #e3e3e0;border-radius:8px;box-sizing:border-box}',
    '.ph-input:focus{outline:none;border-color:#1f7a4d;box-shadow:0 0 0 3px #eaf5ee}',
    '.ph-input:disabled{background:#f2f2ef;color:#1a1a1a;font-weight:500}',
    '.ph-bottom{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;align-items:end;margin-bottom:14px}',
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
  // แปลผลและเทียบแนวโน้ม
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

  // ระยะห่างจากช่วงที่เหมาะสม ถ้าอยู่ในช่วงถือว่าเป็นศูนย์
  function distanceFromIdeal(ph) {
    if (ph < IDEAL_LOW) return IDEAL_LOW - ph;
    if (ph > IDEAL_HIGH) return ph - IDEAL_HIGH;
    return 0;
  }

  // ไม่สรุปว่าดีขึ้นหรือแย่ลงจากทิศทางตัวเลขอย่างเดียว
  // เพราะ pH ขึ้นจาก 5.0 เป็น 6.0 คือดีขึ้น แต่ขึ้นจาก 7.0 เป็น 8.0 คือแย่ลง
  function trendHtml(prev, now) {
    var diff = now.ph !== undefined ? now.ph - prev.ph : 0;
    var when = prev.date ? ' เมื่อ ' + thaiDate(prev.date) : '';

    if (Math.abs(diff) < MEANINGFUL_DIFF) {
      return '<div class="ph-trend">' +
        '<div class="ph-trend-head">เทียบกับครั้งก่อน</div>' +
        '<div class="ph-trend-body">ครั้งก่อนวัดได้ ' + prev.ph.toFixed(1) + when +
        ' — ค่าใกล้เคียงเดิม ความต่างน้อยกว่า ' + MEANINGFUL_DIFF +
        ' หน่วย ซึ่งอยู่ในระดับความคลาดเคลื่อนของเครื่องวัด ยังสรุปว่าดินเปลี่ยนไปไม่ได้</div>' +
      '</div>';
    }

    var wasOff = distanceFromIdeal(prev.ph);
    var nowOff = distanceFromIdeal(now.ph);
    var direction = diff > 0 ? 'สูงขึ้น' : 'ต่ำลง';
    var verdict;

    if (nowOff < wasOff) {
      verdict = 'เข้าใกล้ช่วงที่เหมาะกับข้าวมากขึ้น เป็นแนวโน้มที่ดี ถ้าเพิ่งปรับปรุงดินไปแสดงว่าสิ่งที่ทำได้ผล';
    } else if (nowOff > wasOff) {
      verdict = 'ออกห่างจากช่วงที่เหมาะกับข้าวมากขึ้น ควรทบทวนว่าช่วงที่ผ่านมาทำอะไรที่อาจกระทบดิน เช่นใส่ปูนหรือปุ๋ยไนโตรเจนปริมาณมาก';
    } else {
      verdict = 'ยังอยู่ในช่วงที่เหมาะกับข้าวทั้งสองครั้ง';
    }

    return '<div class="ph-trend">' +
      '<div class="ph-trend-head">เทียบกับครั้งก่อน</div>' +
      '<div class="ph-trend-body">ครั้งก่อนวัดได้ ' + prev.ph.toFixed(1) + when + ' — ' +
      direction + ' ' + Math.abs(diff).toFixed(1) + ' หน่วย (' +
      prev.ph.toFixed(1) + ' → ' + now.ph.toFixed(1) + ') ' + verdict + '</div>' +
    '</div>';
  }

  // ------------------------------------------------------------
  // วาดฟอร์ม
  // ------------------------------------------------------------
  function render(container) {
    if (!container) return;
    injectStyle();
    var uid = 'ph' + Math.random().toString(36).slice(2, 8);

    var pointFields = '';
    for (var i = 1; i <= POINT_COUNT; i++) {
      pointFields +=
        '<div class="ph-field">' +
          '<label class="ph-label">pH จุดที่ ' + i + '</label>' +
          '<input type="number" id="' + uid + '-p' + i + '" class="ph-input ' + uid + '-pt" ' +
          'min="' + PH_MIN + '" max="' + PH_MAX + '" step="0.1" placeholder="0.0">' +
        '</div>';
    }

    container.innerHTML =
      '<div class="ph-card">' +
        '<div class="ph-head">วัดค่า pH ดิน — ก่อนปลูก</div>' +
        '<div class="ph-sub">วัด 5 จุดกระจายทั่วแปลง ระบบเฉลี่ยให้เอง ' +
        'ดินในแปลงเดียวกันค่าไม่เท่ากันทุกจุด การวัดจุดเดียวจึงให้ภาพที่ผิด</div>' +
        '<div class="ph-points">' + pointFields + '</div>' +
        '<div class="ph-bottom">' +
          '<div class="ph-field">' +
            '<label class="ph-label">ค่าเฉลี่ย</label>' +
            '<input type="text" id="' + uid + '-avg" class="ph-input" disabled placeholder="คำนวณให้อัตโนมัติ">' +
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

    var pointInputs = container.querySelectorAll('.' + uid + '-pt');
    var avgInput = container.querySelector('#' + uid + '-avg');
    var dateInput = container.querySelector('#' + uid + '-date');
    var saveBtn = container.querySelector('#' + uid + '-save');
    var errBox = container.querySelector('#' + uid + '-err');
    var msgBox = container.querySelector('#' + uid + '-msg');
    var outBox = container.querySelector('#' + uid + '-out');

    var previous = null;

    // เฉลี่ยเฉพาะจุดที่กรอกแล้ว ไม่นับช่องว่างเป็นศูนย์
    // ถ้านับช่องว่างเป็นศูนย์ คนที่วัดได้แค่ 3 จุดจะได้ค่าเฉลี่ยต่ำผิดจนดูเหมือนดินเปรี้ยวจัด
    function currentValues() {
      var values = [];
      for (var i = 0; i < pointInputs.length; i++) {
        var v = parseFloat(pointInputs[i].value);
        if (isFinite(v) && v > 0) values.push(v);
      }
      return values;
    }

    function average(values) {
      var sum = 0;
      for (var i = 0; i < values.length; i++) sum += values[i];
      return sum / values.length;
    }

    function update() {
      msgBox.hidden = true;
      var values = currentValues();

      if (!values.length) {
        avgInput.value = '';
        errBox.hidden = true;
        outBox.innerHTML = '';
        return;
      }

      var outOfRange = values.some(function (v) { return v < PH_MIN || v > PH_MAX; });
      if (outOfRange) {
        avgInput.value = '';
        errBox.textContent = 'ค่า pH ควรอยู่ระหว่าง ' + PH_MIN + ' ถึง ' + PH_MAX + ' ลองตรวจเครื่องวัดอีกครั้ง';
        errBox.hidden = false;
        outBox.innerHTML = '';
        return;
      }

      errBox.hidden = true;
      var avg = average(values);
      avgInput.value = avg.toFixed(1) + (values.length < POINT_COUNT ? ' (จาก ' + values.length + ' จุด)' : '');

      var reader = global.readSoilPh;
      if (typeof reader !== 'function') {
        outBox.innerHTML = '<div class="ph-note">ยังโหลด soil-guide.js ไม่สำเร็จ จึงแปลผลค่า pH ไม่ได้</div>';
        return;
      }

      var html = bandHtml(avg, reader(avg));

      // เตือนเมื่อจุดต่างๆ กระจายกันมาก ซึ่งค่าเฉลี่ยเดียวอธิบายไม่ได้
      // ดินที่ต่างกันเกิน 1 หน่วยระหว่างจุด ควรแยกจัดการเป็นโซน ไม่ใช่ใส่ปูนเท่ากันทั้งแปลง
      if (values.length >= 2) {
        var spread = Math.max.apply(null, values) - Math.min.apply(null, values);
        if (spread >= 1.0) {
          html += '<div class="ph-trend">' +
            '<div class="ph-trend-head">จุดวัดต่างกันมาก</div>' +
            '<div class="ph-trend-body">ค่าต่ำสุดกับสูงสุดต่างกัน ' + spread.toFixed(1) + ' หน่วย ' +
            'แปลงนี้สภาพดินไม่สม่ำเสมอ การใช้ค่าเฉลี่ยเดียวตัดสินทั้งแปลงอาจทำให้บางโซนได้รับการแก้ไม่ตรงกับปัญหาจริง ' +
            'ควรจดไว้ว่าจุดไหนต่างจากจุดอื่น แล้วปรึกษาหมอดินอาสาเรื่องการจัดการแยกโซน</div>' +
          '</div>';
        }
      }

      if (previous && typeof previous.ph === 'number') {
        html += trendHtml(previous, { ph: avg });
      }

      outBox.innerHTML = html;
    }

    for (var j = 0; j < pointInputs.length; j++) {
      pointInputs[j].addEventListener('input', update);
    }

    saveBtn.addEventListener('click', function () {
      var values = currentValues();
      if (!values.length) {
        errBox.textContent = 'กรอกค่า pH อย่างน้อย 1 จุดก่อนบันทึก';
        errBox.hidden = false;
        return;
      }
      if (values.some(function (v) { return v < PH_MIN || v > PH_MAX; })) {
        errBox.textContent = 'มีค่าที่อยู่นอกช่วง ' + PH_MIN + ' ถึง ' + PH_MAX + ' แก้ก่อนบันทึก';
        errBox.hidden = false;
        return;
      }

      errBox.hidden = true;
      var avg = Math.round(average(values) * 10) / 10;
      var date = dateInput.value || todayStr();

      saveBtn.disabled = true;
      saveBtn.textContent = 'กำลังบันทึก';

      saveReading(avg, values, date).then(function () {
        var store = storeApi();
        var offline = store && typeof store.isOffline === 'function' && store.isOffline();
        // บอกให้ตรงความจริง ถ้ายังไม่ขึ้นเซิร์ฟเวอร์ต้องไม่บอกว่าบันทึกเสร็จแล้วเฉยๆ
        msgBox.textContent = offline
          ? 'บันทึกลงเครื่องแล้ว จะซิงก์ขึ้นเซิร์ฟเวอร์เมื่อเชื่อมต่อได้'
          : 'บันทึกลงทะเบียนบันทึกแล้ว';
        msgBox.hidden = false;
        previous = { ph: avg, date: date };
      })['catch'](function (err) {
        errBox.textContent = (err && err.message) || 'บันทึกไม่สำเร็จ ค่าที่กรอกยังดูผลได้แต่จะหายเมื่อปิดหน้า';
        errBox.hidden = false;
      }).then(function () {
        saveBtn.disabled = false;
        saveBtn.textContent = 'บันทึก';
      });
    });

    loadLatest().then(function (found) {
      previous = found;
      if (found) update();
    });
  }

  // ------------------------------------------------------------
  // ติดตั้ง — เฉพาะหน้าเตรียมดินเท่านั้น
  // ------------------------------------------------------------
  //
  // แอปเป็นหน้าเดียวที่วาดเนื้อหาใหม่ในคอนเทนเนอร์เดิมทุกครั้งที่เปลี่ยนเมนู
  // ถ้าแค่ต่อการ์ดเข้าไปแล้วไม่ลบออก การ์ดจะค้างอยู่ทุกหน้าที่กดต่อจากนั้น
  // จึงต้องเช็คหัวข้อหน้าทุกครั้ง และถอดการ์ดออกเมื่อออกจากหน้าเตรียมดิน
  var mountedCard = null;

  function pageTitleText() {
    var nodes = document.querySelectorAll('h1');
    for (var i = 0; i < nodes.length; i++) {
      var text = (nodes[i].textContent || '').trim();
      if (text) return text;
    }
    return '';
  }

  function findHeading() {
    var nodes = document.querySelectorAll('h1');
    for (var i = 0; i < nodes.length; i++) {
      if ((nodes[i].textContent || '').trim() === PAGE_TITLE) return nodes[i];
    }
    return null;
  }

  function removeCard() {
    if (mountedCard && mountedCard.parentElement) {
      mountedCard.parentElement.removeChild(mountedCard);
    }
    mountedCard = null;
  }

  function tryMount() {
    // ออกจากหน้าเตรียมดินแล้ว ต้องเก็บการ์ดออกก่อนอย่างอื่น
    if (pageTitleText() !== PAGE_TITLE) {
      removeCard();
      return;
    }

    // ถ้าการ์ดยังอยู่ในหน้าจริงๆ ไม่ต้องวาดซ้ำ
    if (mountedCard && document.body.contains(mountedCard)) return;
    mountedCard = null;

    // ถ้ามีช่องที่วางไว้เอง ใช้ช่องนั้นก่อนเสมอ แน่นอนกว่าการเดาตำแหน่ง
    var slot = document.getElementById(SLOT_ID);
    if (slot) {
      mountedCard = document.createElement('div');
      slot.innerHTML = '';
      slot.appendChild(mountedCard);
      render(mountedCard);
      return;
    }

    var heading = findHeading();
    if (!heading) return;

    // วางไว้ใต้หัวข้อหน้าโดยตรง ไม่ใช่ต่อท้ายเนื้อหาทั้งหมด
    // เพราะเนื้อหาด้านล่างมีบล็อกสภาพดินอยู่แล้ว การ์ดควรอยู่เหนือมัน
    var anchor = heading.parentElement;
    if (!anchor || !anchor.parentElement) return;

    mountedCard = document.createElement('div');
    anchor.parentElement.insertBefore(mountedCard, anchor.nextSibling);
    render(mountedCard);
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
