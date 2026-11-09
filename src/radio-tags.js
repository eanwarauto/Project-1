// ورقة A4 فيها 9 بطاقات (3 أعمدة × 3 صفوف) للقص والتوزيع على المعلمات مع قطعة شوكولاتة:
// برنامج إذاعي عن قيمة «الصحبة الصالحة» برعاية قسم الفيزياء والكيمياء — باركود مجلد البرنامج على Google Drive.
// التشغيل: node src/radio-tags.js  →  qr-card/بطاقات-البرنامج-الإذاعي-A4.pdf و.png
// الشعاران: المدرسة يميناً، والقسم يساراً (assets/logo/).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { font, OUT, BUILD } = require('./qr-card');

const ROOT = path.join(__dirname, '..');
// ألوان شعار قسم الفيزياء والكيمياء (كحلي، تركواز، برتقالي ذهبي) بخلفية فاتحة جداً
const t = {
  bg: 'linear-gradient(170deg, #f1fbfa 0%, #f8fcfb 55%, #fdf8ef 100%)',
  ink: '#1d2a4a', soft: '#4d5b78', accent: '#2a9d95', accent2: '#d48a2c',
  tagBg: 'rgba(98,193,187,.12)', tagBorder: 'rgba(98,193,187,.55)',
  orbit: 'rgba(29,42,74,.30)', nucleus: '#f0bd72', electron: '#3fb0a8', shared: '#d9712a',
  qrInk: '#1d2a4a', qrFrame: '#62c1bb', deco: 'rgba(98,193,187,.12)', border: '#cdebe8', cut: '#9fb8c0',
};
const FILE = 'بطاقات-البرنامج-الإذاعي-A4';
// الشعاران بدون الكتابة اللي داخلهما، والاسم مكتوب تحتهما بخط عريض أسود ليكون واضحاً في الطباعة
const LOGOS = [['school-logo-icon.png', 'مدرسة الشرقية<br>الثانوية بنات'], ['dept-logo-hd-icon.png', 'قسم الفيزياء<br>والكيمياء']];
const QR_RAW = fs.readFileSync(path.join(ROOT, 'assets', 'qr', 'radio-program-qr.svg'), 'utf8');

const qr = QR_RAW.replace(/<\?xml[^>]*>\s*/, '')
  .replace(/width="(\d+)" height="(\d+)"/, (_, w, h) => `viewBox="0 0 ${w} ${h}" width="100%" height="100%"`)
  .replace(/stroke="#[0-9a-f]+"/i, `stroke="${t.qrInk}"`);
const logoImg = ([f, name]) => `<div class="lg"><img src="file://${path.join(ROOT, 'assets', 'logo', f)}"><b>${name}</b></div>`;
const mic = c => `<svg viewBox="0 0 24 24" width="3.4mm" height="3.4mm" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/></svg>`;

// حديث الجليس الصالح: حامل المسك (أثر طيب) مقابل نافخ الكير (أثر سيئ)
const companions = `<svg viewBox="0 0 200 74" width="100%" height="100%" font-family="Cairo" font-weight="800">
  <defs>
    <linearGradient id="musk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe9e5"/><stop offset="1" stop-color="#62c1bb"/></linearGradient>
    <radialGradient id="ember"><stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#e0652b"/></radialGradient>
  </defs>
  <!-- حامل المسك (يمين) -->
  <g>
    <path d="M141 6 c-6 6 6 10 0 16 M152 2 c-6 7 6 11 0 18 M163 6 c-6 6 6 10 0 16" fill="none" stroke="#e6a650" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M131 14 l1.6 3.4 3.4 1.6 -3.4 1.6 -1.6 3.4 -1.6 -3.4 -3.4 -1.6 3.4 -1.6z M173 10 l1.2 2.6 2.6 1.2 -2.6 1.2 -1.2 2.6 -1.2 -2.6 -2.6 -1.2 2.6 -1.2z" fill="#e6a650"/>
    <rect x="144" y="24" width="16" height="7" rx="2" fill="#e6a650" stroke="#1d2a4a" stroke-width="1.6"/>
    <rect x="147.5" y="31" width="9" height="5" fill="#f4f1e8" stroke="#1d2a4a" stroke-width="1.6"/>
    <path d="M138 36 h28 a5 5 0 0 1 5 5 v14 a6 6 0 0 1 -6 6 h-26 a6 6 0 0 1 -6 -6 v-14 a5 5 0 0 1 5 -5z" fill="url(#musk)" stroke="#1d2a4a" stroke-width="1.8"/>
    <path d="M146.5 48.5 c-3-3.5 1.5-7 5.5-3 4-4 8.5-.5 5.5 3 l-5.5 5.5z" fill="#fff"/>
    <text x="152" y="72" text-anchor="middle" font-size="9.5" fill="#2a9d95">حامل المسك</text>
  </g>
  <line x1="100" y1="10" x2="100" y2="62" stroke="rgba(29,42,74,.25)" stroke-width="1.2" stroke-dasharray="3 3"/>
  <!-- نافخ الكير (يسار) -->
  <g>
    <circle cx="36" cy="14" r="7" fill="#c7cbd3"/><circle cx="46" cy="10" r="8.5" fill="#b3b8c2"/><circle cx="57" cy="15" r="6.5" fill="#c7cbd3"/><circle cx="47" cy="20" r="6" fill="#d5d8de"/>
    <path d="M22 42 q-4-10 6-14 l20 10 -20 10 q-10-2-6-6z" fill="#8a6a52" stroke="#1d2a4a" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M14 34 l10 4 M14 50 l10 -4" stroke="#1d2a4a" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M48 38 l12 3" stroke="#1d2a4a" stroke-width="3.2" stroke-linecap="round"/>
    <ellipse cx="72" cy="52" rx="13" ry="5" fill="#5a4636"/>
    <circle cx="68" cy="48" r="4.5" fill="url(#ember)"/><circle cx="76" cy="49" r="3.6" fill="url(#ember)"/><circle cx="71" cy="43" r="1.4" fill="#e0652b"/><circle cx="79" cy="41" r="1" fill="#e0652b"/>
    <text x="48" y="72" text-anchor="middle" font-size="9.5" fill="#7b8396">نافخ الكير</text>
  </g>
</svg>`;

const tag = `<div class="tag">
  <div class="deco"></div>
  <div class="logos">${logoImg(LOGOS[0])}<div class="mid"><div class="pill">${mic(t.accent2)}برنامج إذاعي</div><div class="spon">برعاية قسم<br>الفيزياء والكيمياء</div></div>${logoImg(LOGOS[1])}</div>
  <div class="hook">الصحبة <span>الصالحة</span></div>
  <div class="hadith">«مَثَلُ الجليسِ الصالحِ والسَّوْءِ<br>كحاملِ المسكِ ونافخِ الكِيرِ» <i>متفق عليه</i></div>
  <div class="mol">${companions}</div>
  <div class="line">كوني <b>حاملة المسك</b>… واتركي أثراً طيباً</div>
  <div class="qr">${qr}</div>
  <div class="cta">امسحي الكود</div>
  <div class="sweet">وهذي قطعة من حلاوة الصحبة…</div>
  <div class="gift">إهداء من قسم الكيمياء</div>
  <div class="by">إعداد المعلمات: أ. أنوار الفضلي • أ. فاطمة الموسوي</div>
</div>`;

const COLS = 3, ROWS = 3, CW = 210 / COLS, CH = 297 / ROWS;
const lines = [...Array(COLS - 1)].map((_, i) => `<div class="cut v" style="left:${(i + 1) * CW}mm"></div>`).join('')
  + [...Array(ROWS - 1)].map((_, i) => `<div class="cut h" style="top:${(i + 1) * CH}mm"></div>`).join('');

const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face{font-family:Cairo;font-weight:600;src:url(${font('cairo-arabic-600-normal.woff2')})}
@font-face{font-family:Cairo;font-weight:800;src:url(${font('cairo-arabic-800-normal.woff2')})}
@font-face{font-family:Cairo;font-weight:900;src:url(${font('cairo-arabic-900-normal.woff2')})}
@font-face{font-family:Lalezar;src:url(${font('lalezar-arabic-400-normal.woff2')})}
@font-face{font-family:Ruqaa;font-weight:700;src:url(${font('aref-ruqaa-arabic-700-normal.woff2')})}
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:210mm;height:297mm;background:#fff;font-family:Cairo,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.sheet{position:relative;width:210mm;height:297mm;display:grid;grid-template-columns:repeat(${COLS},${CW}mm);grid-template-rows:repeat(${ROWS},${CH}mm)}
.cell{display:flex;align-items:center;justify-content:center}
.cut{position:absolute;border:0 dashed ${t.cut}}
.cut.v{top:0;bottom:0;border-left-width:0.3mm}
.cut.h{left:0;right:0;border-top-width:0.3mm}
.tag{position:relative;overflow:hidden;width:${CW - 5}mm;height:${CH - 5}mm;border-radius:3.5mm;background:${t.bg};border:0.35mm solid ${t.border};color:${t.ink};
  display:flex;flex-direction:column;align-items:center;text-align:center;padding:2.4mm 2.5mm 2.4mm}
.deco{position:absolute;width:40mm;height:40mm;border-radius:50%;border:0.4mm solid ${t.deco};top:-18mm;left:-18mm}
.logos{display:flex;align-items:center;justify-content:space-between;width:100%;padding:0 0.5mm 1mm;border-bottom:0.25mm solid ${t.tagBorder}}
.lg{display:flex;flex-direction:column;align-items:center;width:17mm}
.lg img{height:8mm;max-width:14mm;object-fit:contain}
.lg b{font-weight:900;font-size:2.1mm;line-height:1.25;color:#111;margin-top:0.5mm}
.pill{display:flex;align-items:center;gap:0.8mm;font-weight:800;font-size:2.6mm;color:${t.accent2};background:${t.tagBg};border:0.25mm solid ${t.tagBorder};border-radius:5mm;padding:0 2.4mm}
.mid{display:flex;flex-direction:column;align-items:center}
.spon{font-weight:700;font-size:2.3mm;line-height:1.3;color:${t.soft};margin-top:0.6mm}
.hook{font-family:Lalezar,Cairo;font-size:6mm;line-height:1.1;margin-top:0.6mm}
.hadith{font-weight:700;font-size:2.3mm;line-height:1.3;color:${t.ink};margin-top:0.4mm;padding:0 1mm}
.hadith i{font-style:normal;font-weight:600;font-size:1.9mm;color:${t.soft}}
.mol{width:30mm;height:11mm;margin-top:0.4mm}
.line{font-weight:600;font-size:2.5mm;color:${t.soft};margin-top:0.2mm}
.line b{font-weight:900;color:${t.accent}}
.sweet{font-weight:700;font-size:2.4mm;color:${t.accent2};margin-top:0.6mm}
.hook span{color:${t.accent}}
.qr{margin-top:0.8mm;width:24mm;height:24mm;background:#fff;border-radius:1.8mm;border:0.5mm solid ${t.qrFrame};padding:0.3mm}
.qr svg{display:block}
.cta{margin-top:1mm;background:${t.accent};color:#fff;font-weight:900;font-size:2.8mm;border-radius:5mm;padding:0.1mm 3.5mm}
.gift{font-family:Ruqaa,Cairo;font-weight:700;font-size:3.8mm;color:${t.accent};margin-top:auto;padding-top:0.8mm;line-height:1.3}
.by{font-weight:700;font-size:2.3mm;color:${t.soft};line-height:1.35}
</style></head><body><div class="sheet">
${[...Array(COLS * ROWS)].map(() => `<div class="cell">${tag}</div>`).join('')}
${lines}
</div></body></html>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(BUILD, { recursive: true });
  const file = path.join(BUILD, 'radio-tags.html');
  fs.writeFileSync(file, html);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 3 });
  await page.goto('file://' + file);
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: path.join(OUT, `${FILE}.pdf`), format: 'A4', printBackground: true, preferCSSPageSize: true });
  await page.screenshot({ path: path.join(OUT, `${FILE}.png`), fullPage: true });
  await browser.close();
  console.log('✓', FILE);
})();
