/* ============================================================
   สไตล์กล่องคำนวณปุ๋ย
   ============================================================

   ใช้ CSS variable ทั้งหมดเพื่อให้ปรับธีมได้จากที่เดียว
   ถ้าแอปมีตัวแปรสีของตัวเองอยู่แล้ว ให้ลบบล็อก :root นี้ออก
   แล้วแมป --fc-* ไปที่ตัวแปรเดิมแทน จะได้ไม่มีสองแหล่งความจริง
   ============================================================ */

:root {
  --fc-accent: #1f7a4d;
  --fc-accent-bg: #eaf5ee;
  --fc-text: #1a1a1a;
  --fc-text-muted: #6b6b6b;
  --fc-border: #e3e3e0;
  --fc-surface: #ffffff;
  --fc-surface-alt: #f7f7f5;
  --fc-warn-bg: #fdf6e7;
  --fc-warn-text: #7a5510;
  --fc-danger: #b3261e;
  --fc-radius: 8px;
}

.fc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.fc-field { display: flex; flex-direction: column; }

.fc-label {
  font-size: 13px;
  color: var(--fc-text-muted);
  margin-bottom: 6px;
}

.fc-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  font-size: 15px;
  font-family: inherit;
  color: var(--fc-text);
  background: var(--fc-surface);
  border: 1px solid var(--fc-border);
  border-radius: var(--fc-radius);
  box-sizing: border-box;
}

.fc-input:focus {
  outline: none;
  border-color: var(--fc-accent);
  box-shadow: 0 0 0 3px var(--fc-accent-bg);
}

.fc-card {
  background: var(--fc-surface-alt);
  border-radius: var(--fc-radius);
  padding: 16px;
  margin-bottom: 12px;
}

.fc-card--warn { background: var(--fc-warn-bg); }
.fc-card--warn .fc-card-note { color: var(--fc-warn-text); }

.fc-card-step {
  font-size: 13px;
  color: var(--fc-text-muted);
  margin-bottom: 4px;
}

.fc-card-title {
  font-size: 17px;
  font-weight: 500;
  color: var(--fc-text);
  margin-bottom: 4px;
}

.fc-card-note {
  font-size: 13px;
  line-height: 1.6;
  color: var(--fc-text-muted);
  margin-bottom: 10px;
}

.fc-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 15px;
  padding: 5px 0;
}

.fc-row-label { color: var(--fc-text-muted); }
.fc-row-value { font-weight: 500; color: var(--fc-text); text-align: right; }

.fc-divider {
  font-size: 13px;
  color: var(--fc-text-muted);
  border-top: 1px solid var(--fc-border);
  margin-top: 10px;
  padding-top: 10px;
}

.fc-hint {
  font-size: 13px;
  line-height: 1.6;
  color: var(--fc-text-muted);
  padding: 0 4px;
}

.fc-error {
  font-size: 13px;
  color: var(--fc-danger);
  margin-bottom: 12px;
}

.fc-empty {
  text-align: center;
  padding: 40px 24px;
}

.fc-empty-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--fc-text);
  margin-bottom: 8px;
}

.fc-empty-note {
  font-size: 14px;
  line-height: 1.7;
  color: var(--fc-text-muted);
  max-width: 520px;
  margin: 0 auto;
}
