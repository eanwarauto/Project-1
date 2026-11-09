// ورقة A4 فيها 12 بطاقة صغيرة (3 أعمدة × 4 صفوف) للقص والتوزيع على المعلمات مع قطعة شوكولاتة:
// باركود مجلد «البرنامج الإذاعي» على Google Drive — إهداء من قسم الكيمياء.
// التشغيل: node src/radio-tags.js  →  qr-card/بطاقات-البرنامج-الإذاعي-A4.pdf و.png
// الشعارات: القائمة LOGOS أدناه (ملفات في assets/logo/)، من اليمين لليسار.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { THEMES, font, OUT, BUILD } = require('./qr-card');

const ROOT = path.join(__dirname, '..');
const t = THEMES.women;
const FILE = 'بطاقات-البرنامج-الإذاعي-A4';
const LOGOS = ['moe-logo.png', 'dept-logo-poster.png', 'science-guidance-logo.png'];
const QR_RAW = fs.readFileSync(path.join(ROOT, 'assets', 'qr', 'radio-program-qr.svg'), 'utf8');

const qr = QR_RAW.replace(/<\?xml[^>]*>\s*/, '')
  .replace(/width="(\d+)" height="(\d+)"/, (_, w, h) => `viewBox="0 0 ${w} ${h}" width="100%" height="100%"`);
const logos = LOGOS.map(f => `<img src="file://${path.join(ROOT, 'assets', 'logo', f)}">`).join('');
const mic = c => `<svg viewBox="0 0 24 24" width="3.4mm" height="3.4mm" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/></svg>`;

const tag = `<div class="tag">
  <div class="deco"></div>
  <div class="logos">${logos}</div>
  <div class="pill">${mic(t.accent2)}برنامج إذاعي</div>
  <div class="hook">شي حلو… <span>ومعاه شي أحلى!</span></div>
  <div class="mid">
    <div class="qr">${qr}</div>
  </div>
  <div class="cta">امسحي الكود</div>
  <div class="gift">إهداء من قسم الكيمياء</div>
  <div class="by">إعداد المعلمات: أ. أنوار الفضلي • أ. فاطمة الموسوي</div>
</div>`;

const COLS = 3, ROWS = 4, CW = 210 / COLS, CH = 297 / ROWS;
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
.cut{position:absolute;border:0 dashed #b3a6bd}
.cut.v{top:0;bottom:0;border-left-width:0.3mm}
.cut.h{left:0;right:0;border-top-width:0.3mm}
.tag{position:relative;overflow:hidden;width:${CW - 5}mm;height:${CH - 5}mm;border-radius:3.5mm;background:${t.bg};border:0.35mm solid #ecd3e6;color:${t.ink};
  display:flex;flex-direction:column;align-items:center;text-align:center;padding:2.2mm 2.5mm 2mm}
.deco{position:absolute;width:40mm;height:40mm;border-radius:50%;border:0.4mm solid ${t.deco};top:-18mm;left:-18mm}
.logos{display:flex;align-items:center;justify-content:center;gap:3mm;height:7.5mm;width:100%;padding-bottom:1mm;border-bottom:0.25mm solid ${t.tagBorder}}
.logos img{height:100%;max-width:17mm;object-fit:contain}
.pill{display:flex;align-items:center;gap:0.8mm;margin-top:1.4mm;font-weight:800;font-size:2.6mm;color:${t.accent2};background:${t.tagBg};border:0.25mm solid ${t.tagBorder};border-radius:5mm;padding:0 2.4mm}
.hook{font-family:Lalezar,Cairo;font-size:4.3mm;line-height:1.25;margin-top:1mm}
.hook span{color:${t.accent}}
.mid{margin-top:1.2mm}
.qr{width:27mm;height:27mm;background:#fff;border-radius:1.8mm;border:0.5mm solid ${t.qrFrame};padding:0.3mm}
.qr svg{display:block}
.cta{margin-top:1.2mm;background:${t.accent};color:#fff;font-weight:900;font-size:2.8mm;border-radius:5mm;padding:0.1mm 3.5mm}
.gift{font-family:Ruqaa,Cairo;font-weight:700;font-size:3.4mm;color:${t.accent};margin-top:auto;line-height:1.3}
.by{font-weight:700;font-size:2.15mm;color:${t.soft};line-height:1.35}
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
