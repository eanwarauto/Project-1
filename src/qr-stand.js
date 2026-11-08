// لوحة A4 كاملة لستاند الطاولة: باركود مجلد «الرابطة التساهمية» بالنسخة الوردية (للنساء)
// مع «إهداء من معلمات قسم الكيمياء» فوق، و«تحت إشراف رئيسة القسم» تحت، وشعار القسم.
// الشعار: ضعي الصورة في assets/logo/ (أول صورة PNG أو JPG أو SVG فيها تُستخدم).
// التشغيل: node src/qr-stand.js   →   qr-card/ستاند-باركود-الرابطة-التساهمية-A4-للنساء.pdf و.png
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { THEMES, molecule, phone, bookIcon, slidesIcon, QR_RAW, font, OUT, BUILD } = require('./qr-card');

const ROOT = path.join(__dirname, '..');
const t = THEMES.women;
const FILE = 'ستاند-باركود-الرابطة-التساهمية-A4-للنساء';
const SCHOOL = 'ثانوية الشرقية';
const GIFT = 'إهداء من معلمات قسم الكيمياء';
const GIFT_HTML = 'إهداء من معلمات<br>قسم الكيمياء';
const SUPERVISOR_TITLE = 'تحت إشراف رئيسة القسم';
const SUPERVISOR = 'أ. منيرة الهاجري';

const LOGO_DIR = path.join(ROOT, 'assets', 'logo');
const logoFile = fs.existsSync(LOGO_DIR) && fs.readdirSync(LOGO_DIR).find(f => /\.(png|jpe?g|svg|webp)$/i.test(f));
const logo = logoFile
  ? `<img class="logo" src="file://${path.join(LOGO_DIR, logoFile)}">`
  : `<div class="logo ph">شعار القسم</div>`;

const qr = QR_RAW.replace(/<\?xml[^>]*>\s*/, '')
  .replace(/width="(\d+)" height="(\d+)"/, (_, w, h) => `viewBox="0 0 ${w} ${h}" width="100%" height="100%"`)
  .replace(/stroke="#[0-9a-f]+"/i, `stroke="${t.qrInk}"`);
const big = svg => svg.replace(/width="[\d.]+mm" height="[\d.]+mm"/, 'width="7mm" height="7mm"');

const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face{font-family:Cairo;font-weight:600;src:url(${font('cairo-arabic-600-normal.woff2')})}
@font-face{font-family:Cairo;font-weight:800;src:url(${font('cairo-arabic-800-normal.woff2')})}
@font-face{font-family:Cairo;font-weight:900;src:url(${font('cairo-arabic-900-normal.woff2')})}
@font-face{font-family:Lalezar;src:url(${font('lalezar-arabic-400-normal.woff2')})}
@font-face{font-family:Ruqaa;font-weight:700;src:url(${font('aref-ruqaa-arabic-700-normal.woff2')})}
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:210mm;height:297mm;background:#fff;font-family:Cairo,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{position:absolute;inset:7mm;border-radius:8mm;overflow:hidden;background:${t.bg};border:0.5mm solid #ecd3e6;color:${t.ink};
  display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center;padding:8mm 12mm 7mm}
.deco{position:absolute;border-radius:50%;border:0.8mm solid ${t.deco}}
.d1{width:150mm;height:150mm;top:-60mm;left:-70mm}.d2{width:120mm;height:120mm;bottom:-50mm;right:-55mm}.d3{width:60mm;height:60mm;top:95mm;right:-30mm}
.head{display:flex;flex-direction:row;align-items:center;justify-content:space-between;width:100%;position:relative}
.htext{display:flex;flex-direction:column;align-items:flex-start;text-align:right;gap:1mm}
.hbar{width:16mm;height:0.8mm;border-radius:1mm;background:${t.accent2};margin:0.5mm 0}
.logo{width:36mm;height:36mm;object-fit:contain}
.logo.ph{border:0.5mm dashed ${t.accent2};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:3.6mm;font-weight:800;color:${t.accent2};background:rgba(255,255,255,.5)}
.school{font-weight:800;font-size:5.4mm;color:${t.soft}}
.gift{font-family:Ruqaa,Cairo;font-weight:700;font-size:8.6mm;color:${t.accent};line-height:1.35}
.tag{font-weight:800;font-size:5.4mm;color:${t.accent2};background:${t.tagBg};border:0.5mm solid ${t.tagBorder};border-radius:20mm;padding:0.8mm 8mm}
h1{font-family:Lalezar,Cairo;font-weight:400;font-size:13mm;line-height:1.15}
h1 span{color:${t.accent}}
.mol{width:64mm;height:24mm}
.inside{display:flex;align-items:center;gap:2.5mm;font-size:5mm;font-weight:800}
.inside .lbl{color:${t.soft};font-weight:600}
.chip{display:flex;align-items:center;gap:1.6mm;background:${t.tagBg};border:0.45mm solid ${t.tagBorder};border-radius:20mm;padding:0.6mm 4.5mm}
.qrwrap{position:relative;padding:4mm}
.qr{width:74mm;height:74mm;background:#fff;border-radius:4mm;padding:1mm;box-shadow:0 2mm 6mm rgba(74,42,94,.12)}
.qr svg{display:block}
.c{position:absolute;width:11mm;height:11mm;border:0 solid ${t.qrFrame}}
.tl{top:0;left:0;border-top-width:1.6mm;border-left-width:1.6mm;border-top-left-radius:4mm}
.tr{top:0;right:0;border-top-width:1.6mm;border-right-width:1.6mm;border-top-right-radius:4mm}
.bl{bottom:0;left:0;border-bottom-width:1.6mm;border-left-width:1.6mm;border-bottom-left-radius:4mm}
.br{bottom:0;right:0;border-bottom-width:1.6mm;border-right-width:1.6mm;border-bottom-right-radius:4mm}
.cta{display:flex;align-items:center;gap:2.5mm;background:${t.accent};color:#fff;font-weight:900;font-size:6.6mm;border-radius:20mm;padding:2mm 9mm}
.foot{display:flex;flex-direction:column;align-items:center;position:relative}
.foot .line{width:50mm;height:0.4mm;background:linear-gradient(90deg,transparent,${t.accent2},transparent);margin-bottom:2mm}
.foot .t{font-weight:600;font-size:4.2mm;color:${t.soft}}
.foot .n{font-weight:900;font-size:6mm;color:${t.ink}}
</style></head><body><div class="page">
  <div class="deco d1"></div><div class="deco d2"></div><div class="deco d3"></div>
  <div class="head"><div class="htext"><div class="gift">${GIFT_HTML}</div><div class="hbar"></div><div class="school">${SCHOOL}</div></div>${logo}</div>
  <div class="tag">الرابطة التساهمية</div>
  <h1>المعرفة مثل الإلكترونات…<br>أحلى لما <span>نتشاركها</span></h1>
  <div class="mol">${molecule(t)}</div>
  <div class="inside"><span class="lbl">داخل الكود:</span><span class="chip">${big(bookIcon(t.accent2))}الكتاب الحي</span><span class="chip">${big(slidesIcon(t.accent2))}عرض بوربوينت</span></div>
  <div class="qrwrap"><i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i><div class="qr">${qr}</div></div>
  <div class="cta">${phone('#ffffff').replace(/5\.2mm/g, '8mm')}<span>${t.cta}</span></div>
  <div class="foot"><div class="line"></div><div class="t">${SUPERVISOR_TITLE}</div><div class="n">${SUPERVISOR}</div></div>
</div></body></html>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(BUILD, { recursive: true });
  const file = path.join(BUILD, 'stand-women.html');
  fs.writeFileSync(file, html);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 3 });
  await page.goto('file://' + file);
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: path.join(OUT, `${FILE}.pdf`), format: 'A4', printBackground: true, preferCSSPageSize: true });
  await page.screenshot({ path: path.join(OUT, `${FILE}.png`), fullPage: true });
  await browser.close();
  console.log('✓', FILE, logoFile ? `(الشعار: ${logoFile})` : '(بدون شعار — مكانه محجوز)');
})();
