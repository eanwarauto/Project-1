// يولّد ورقة A4 للطباعة والقص: 4 بطاقات فيها باركود مجلد «الرابطة التساهمية» على Google Drive.
// التشغيل: node src/qr-card.js   →   qr-card/بطاقات-باركود-الرابطة-التساهمية-A4.pdf (غامقة) و…-باستيل.pdf (فاتحة) وصورة PNG لكل نسخة
// الباركود نفسه من assets/qr/drive-folder-qr.svg
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'qr-card');
const BUILD = path.join(ROOT, 'build', 'qr-card');
const font = f => 'file://' + path.join(ROOT, 'assets', 'fonts', f);
const QR_RAW = fs.readFileSync(path.join(ROOT, 'assets', 'qr', 'drive-folder-qr.svg'), 'utf8');

const THEMES = {
  dark: {
    file: 'بطاقات-باركود-الرابطة-التساهمية-A4',
    bg: 'radial-gradient(120% 80% at 50% 0%, #24508f 0%, #13294f 45%, #0b1730 100%)',
    ink: '#ffffff', soft: '#b9cdf0', accent: '#ffd36b', accent2: '#5ee0d0',
    tagBg: 'rgba(94,224,208,.14)', tagBorder: 'rgba(94,224,208,.55)',
    orbit: 'rgba(185,205,240,.55)', nucleus: '#ffd36b', electron: '#5ee0d0', shared: '#ff8fb1',
    qrInk: '#0b1730', qrFrame: '#ffd36b', deco: 'rgba(255,255,255,.07)', border: 'none',
  },
  pastel: {
    file: 'بطاقات-باركود-الرابطة-التساهمية-A4-باستيل',
    bg: 'radial-gradient(120% 80% at 50% 0%, #e3f1ff 0%, #f4f8ff 50%, #fff6ef 100%)',
    ink: '#13294f', soft: '#4a5f86', accent: '#e0629a', accent2: '#1f9e8f',
    tagBg: 'rgba(31,158,143,.10)', tagBorder: 'rgba(31,158,143,.45)',
    orbit: 'rgba(19,41,79,.35)', nucleus: '#f2a93b', electron: '#1f9e8f', shared: '#e0629a',
    qrInk: '#13294f', qrFrame: '#e0629a', deco: 'rgba(19,41,79,.05)', border: '0.4mm solid #c9d8ef',
  },
  // نسخة للنساء: باستيل وردي وليلكي، والأمر بصيغة المؤنث
  women: {
    file: 'بطاقات-باركود-الرابطة-التساهمية-A4-للنساء',
    cta: 'امسحي الكود واكتشفي السرّ',
    bg: 'radial-gradient(120% 80% at 50% 0%, #fde6f0 0%, #f6efff 50%, #eef8f6 100%)',
    ink: '#4a2a5e', soft: '#7a5c8c', accent: '#d9578f', accent2: '#8a63c9',
    tagBg: 'rgba(138,99,201,.10)', tagBorder: 'rgba(138,99,201,.45)',
    orbit: 'rgba(74,42,94,.32)', nucleus: '#f4b860', electron: '#8a63c9', shared: '#e86fa3',
    qrInk: '#4a2a5e', qrFrame: '#d9578f', deco: 'rgba(217,87,143,.08)', border: '0.4mm solid #ecd3e6',
  },
};

// جزيء: ذرتان تتشاركان زوج إلكترونات في منطقة التداخل
function molecule(t) {
  const e = (x, y, c, r = 3.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
  return `<svg viewBox="0 0 200 90" width="100%" height="100%">
    <defs><radialGradient id="glow"><stop offset="0" stop-color="${t.shared}" stop-opacity=".75"/><stop offset="1" stop-color="${t.shared}" stop-opacity="0"/></radialGradient></defs>
    <circle cx="72" cy="45" r="38" fill="none" stroke="${t.orbit}" stroke-width="1.6" stroke-dasharray="4 4"/>
    <circle cx="128" cy="45" r="38" fill="none" stroke="${t.orbit}" stroke-width="1.6" stroke-dasharray="4 4"/>
    <circle cx="100" cy="45" r="20" fill="url(#glow)"/>
    <circle cx="72" cy="45" r="12" fill="${t.nucleus}"/><circle cx="68" cy="41" r="4" fill="#fff" opacity=".55"/>
    <circle cx="128" cy="45" r="12" fill="${t.nucleus}"/><circle cx="124" cy="41" r="4" fill="#fff" opacity=".55"/>
    ${e(100, 35, t.shared, 4.2)}${e(100, 55, t.shared, 4.2)}
    ${e(34, 45, t.electron)}${e(45, 18, t.electron)}${e(45, 72, t.electron)}
    ${e(166, 45, t.electron)}${e(155, 18, t.electron)}${e(155, 72, t.electron)}
  </svg>`;
}

const phone = c => `<svg viewBox="0 0 24 24" width="5.2mm" height="5.2mm" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/></svg>`;
const bookIcon = c => `<svg viewBox="0 0 24 24" width="3.6mm" height="3.6mm" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6C9.5 4 6 4 3 5v14c3-1 6.5-1 9 1 2.5-2 6-2 9-1V5c-3-1-6.5-1-9 1z"/><path d="M12 6v14"/></svg>`;
const slidesIcon = c => `<svg viewBox="0 0 24 24" width="3.6mm" height="3.6mm" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8M7 12l3-3 2 2 4-4"/></svg>`;
const scissors = `<svg viewBox="0 0 24 24" width="4.5mm" height="4.5mm" fill="none" stroke="#8a94a6" stroke-width="2" stroke-linecap="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/></svg>`;

function card(t) {
  const qr = QR_RAW.replace(/<\?xml[^>]*>\s*/, '')
    .replace(/width="(\d+)" height="(\d+)"/, (_, w, h) => `viewBox="0 0 ${w} ${h}" width="100%" height="100%"`)
    .replace(/stroke="#[0-9a-f]+"/i, `stroke="${t.qrInk}"`);
  return `<div class="card">
    <div class="deco d1"></div><div class="deco d2"></div>
    <div class="tag">الرابطة التساهمية</div>
    <h1>المعرفة مثل الإلكترونات…<br>أحلى لما <span>نتشاركها</span></h1>
    <div class="mol">${molecule(t)}</div>
    <div class="inside"><span class="lbl">داخل الكود:</span><span class="chip">${bookIcon(t.accent2)}الكتاب الحي</span><span class="chip">${slidesIcon(t.accent2)}عرض بوربوينت</span></div>
    <div class="qrwrap"><i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i><div class="qr">${qr}</div></div>
    <div class="cta">${phone(t.ink === '#ffffff' ? '#0b1730' : '#ffffff')}<span>${t.cta || 'امسح الكود واكتشف السرّ'}</span></div>
  </div>`;
}

function html(t) {
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face{font-family:Cairo;font-weight:600;src:url(${font('cairo-arabic-600-normal.woff2')})}
@font-face{font-family:Cairo;font-weight:800;src:url(${font('cairo-arabic-800-normal.woff2')})}
@font-face{font-family:Cairo;font-weight:900;src:url(${font('cairo-arabic-900-normal.woff2')})}
@font-face{font-family:Lalezar;src:url(${font('lalezar-arabic-400-normal.woff2')})}
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:210mm;height:297mm;background:#fff;font-family:Cairo,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.sheet{position:relative;width:210mm;height:297mm;display:grid;grid-template-columns:105mm 105mm;grid-template-rows:148.5mm 148.5mm}
.cell{display:flex;align-items:center;justify-content:center}
.cut{position:absolute;border:0 dashed #9aa3b2}
.cut.v{left:105mm;top:0;bottom:0;border-left-width:0.35mm}
.cut.h{top:148.5mm;left:0;right:0;border-top-width:0.35mm}
.sc{position:absolute;background:#fff;padding:0.6mm;line-height:0}
.card{position:relative;overflow:hidden;width:97mm;height:140.5mm;border-radius:5mm;background:${t.bg};border:${t.border};color:${t.ink};
  display:flex;flex-direction:column;align-items:center;text-align:center;padding:6mm 6mm 5mm}
.deco{position:absolute;border-radius:50%;border:0.5mm solid ${t.deco}}
.d1{width:70mm;height:70mm;top:-28mm;left:-30mm}.d2{width:55mm;height:55mm;bottom:-22mm;right:-24mm}
.tag{font-weight:800;font-size:3.4mm;color:${t.accent2};background:${t.tagBg};border:0.35mm solid ${t.tagBorder};border-radius:10mm;padding:0.6mm 4mm}
h1{font-family:Lalezar,Cairo;font-weight:400;font-size:8.6mm;line-height:1.2;margin-top:3.4mm}
h1 span{color:${t.accent}}
.mol{width:48mm;height:21mm;margin-top:2.6mm}
.sub{font-weight:600;font-size:3.6mm;line-height:1.45;color:${t.soft};margin-top:0.8mm}
.sub b{font-weight:900;color:${t.ink}}
.inside{display:flex;align-items:center;gap:1.4mm;margin-top:3.4mm;font-size:3.1mm;font-weight:800}
.inside .lbl{color:${t.soft};font-weight:600}
.chip{display:flex;align-items:center;gap:1mm;background:${t.tagBg};border:0.3mm solid ${t.tagBorder};color:${t.ink};border-radius:10mm;padding:0.4mm 2.4mm}
.qrwrap{position:relative;margin-top:3mm;padding:2.4mm}
.qr{width:44mm;height:44mm;background:#fff;border-radius:2.5mm;padding:0.5mm}
.qr svg{display:block}
.c{position:absolute;width:6mm;height:6mm;border:0 solid ${t.qrFrame}}
.tl{top:0;left:0;border-top-width:1mm;border-left-width:1mm;border-top-left-radius:2.5mm}
.tr{top:0;right:0;border-top-width:1mm;border-right-width:1mm;border-top-right-radius:2.5mm}
.bl{bottom:0;left:0;border-bottom-width:1mm;border-left-width:1mm;border-bottom-left-radius:2.5mm}
.br{bottom:0;right:0;border-bottom-width:1mm;border-right-width:1mm;border-bottom-right-radius:2.5mm}
.cta{display:flex;align-items:center;gap:1.6mm;margin-top:3.4mm;background:${t.accent};color:${t.ink === '#ffffff' ? '#0b1730' : '#ffffff'};
  font-weight:900;font-size:4mm;border-radius:10mm;padding:1.2mm 4.5mm}
.foot{margin-top:auto;font-weight:600;font-size:2.9mm;color:${t.soft}}
</style></head><body><div class="sheet">
${[0, 1, 2, 3].map(() => `<div class="cell">${card(t)}</div>`).join('')}
<div class="cut v"></div><div class="cut h"></div>
<div class="sc" style="left:103mm;top:4mm">${scissors}</div>
<div class="sc" style="left:4mm;top:146.4mm">${scissors}</div>
</div></body></html>`;
}

module.exports = { THEMES, molecule, phone, bookIcon, slidesIcon, QR_RAW, font, OUT, BUILD };
if (require.main === module) (async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(BUILD, { recursive: true });
  const browser = await chromium.launch();
  for (const [name, t] of Object.entries(THEMES)) {
    const file = path.join(BUILD, `${name}.html`);
    fs.writeFileSync(file, html(t));
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 3 });
    await page.goto('file://' + file);
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: path.join(OUT, `${t.file}.pdf`), format: 'A4', printBackground: true, preferCSSPageSize: true });
    await page.screenshot({ path: path.join(OUT, `${t.file}.png`), fullPage: true });
    console.log('✓', t.file);
    await page.close();
  }
  await browser.close();
})();
