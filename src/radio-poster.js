// بوستر A4 للبرنامج الإذاعي «الصحبة الصالحة» بنفس ثيم البطاقات:
// فوق: شعار المدرسة (يمين) و«برنامج إذاعي» وشعار القسم (يسار)
// بالنص: العنوان، الحديث كاملاً، ومقارنة مرسومة بين حامل المسك ونافخ الكير
// تحت: الإهداء وأسماء المعلمات يميناً، والباركود يساراً
// التشغيل: node src/radio-poster.js  →  qr-card/بوستر-البرنامج-الإذاعي-A4.pdf و.png
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { font, OUT, BUILD } = require('./qr-card');
const { t, LOGOS, qr, logoImg, mic } = require('./radio-tags');

const FILE = 'بوستر-البرنامج-الإذاعي-A4';

const HADITH = 'إنما مَثَلُ الجليسِ الصالحِ والجليسِ السَّوْءِ كحاملِ المسكِ ونافخِ الكِيرِ؛ فحاملُ المسكِ إما أن يُحْذِيَكَ، وإما أن تبتاعَ منه، وإما أن تجدَ منه ريحًا طيبةً، ونافخُ الكِيرِ إما أن يُحرِقَ ثيابَكَ، وإما أن تجدَ ريحًا خبيثةً';

// حامل المسك: قارورة مسك وريحة طيبة تنتشر
const muskArt = `<svg viewBox="0 0 120 110" width="100%" height="100%">
  <defs><linearGradient id="mk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9eeea"/><stop offset="1" stop-color="#4fb8b0"/></linearGradient>
  <radialGradient id="halo"><stop offset="0" stop-color="#ffe7b8" stop-opacity=".9"/><stop offset="1" stop-color="#ffe7b8" stop-opacity="0"/></radialGradient></defs>
  <circle cx="60" cy="62" r="48" fill="url(#halo)"/>
  <path d="M44 8 c-8 8 8 13 0 21 M60 2 c-8 9 8 14 0 23 M76 8 c-8 8 8 13 0 21" fill="none" stroke="#e6a650" stroke-width="3" stroke-linecap="round"/>
  <path d="M26 22 l2.2 4.6 4.6 2.2 -4.6 2.2 -2.2 4.6 -2.2 -4.6 -4.6 -2.2 4.6 -2.2z M96 16 l1.8 3.8 3.8 1.8 -3.8 1.8 -1.8 3.8 -1.8 -3.8 -3.8 -1.8 3.8 -1.8z M100 46 l1.4 3 3 1.4 -3 1.4 -1.4 3 -1.4 -3 -3 -1.4 3 -1.4z M18 52 l1.4 3 3 1.4 -3 1.4 -1.4 3 -1.4 -3 -3 -1.4 3 -1.4z" fill="#e6a650"/>
  <rect x="49" y="34" width="22" height="10" rx="3" fill="#e6a650" stroke="#1d2a4a" stroke-width="2.2"/>
  <rect x="54" y="44" width="12" height="7" fill="#f4f1e8" stroke="#1d2a4a" stroke-width="2.2"/>
  <path d="M38 51 h44 a7 7 0 0 1 7 7 v32 a9 9 0 0 1 -9 9 h-40 a9 9 0 0 1 -9 -9 v-32 a7 7 0 0 1 7 -7z" fill="url(#mk)" stroke="#1d2a4a" stroke-width="2.4"/>
  <path d="M51 72 c-5-6 3-12 9-5 6-7 14-1 9 5 l-9 9z" fill="#fff"/>
  <path d="M40 58 v26" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>
</svg>`;

// نافخ الكير: منفاخ وجمر ودخان وشرر
const kirArt = `<svg viewBox="0 0 120 110" width="100%" height="100%">
  <defs><radialGradient id="em"><stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#e0652b"/></radialGradient></defs>
  <circle cx="42" cy="20" r="11" fill="#c7cbd3"/><circle cx="58" cy="14" r="13" fill="#b3b8c2"/><circle cx="74" cy="21" r="10" fill="#c7cbd3"/><circle cx="60" cy="29" r="9" fill="#d5d8de"/><circle cx="86" cy="32" r="7" fill="#d5d8de"/>
  <path d="M22 64 q-6-16 10-22 l32 16 -32 16 q-16-3-10-10z" fill="#8a6a52" stroke="#1d2a4a" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M30 50 q8 8 0 26" fill="none" stroke="#6b4f3b" stroke-width="2"/>
  <path d="M8 52 l16 6 M8 78 l16 -6" stroke="#1d2a4a" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M64 58 l18 5" stroke="#1d2a4a" stroke-width="4.5" stroke-linecap="round"/>
  <ellipse cx="96" cy="84" rx="20" ry="8" fill="#5a4636"/>
  <circle cx="90" cy="78" r="7" fill="url(#em)"/><circle cx="102" cy="79" r="5.5" fill="url(#em)"/><circle cx="96" cy="72" r="4.5" fill="url(#em)"/>
  <circle cx="88" cy="64" r="1.8" fill="#e0652b"/><circle cx="104" cy="60" r="1.4" fill="#e0652b"/><circle cx="98" cy="54" r="1.2" fill="#e0652b"/>
</svg>`;

const check = c => `<svg viewBox="0 0 24 24" width="4.6mm" height="4.6mm"><circle cx="12" cy="12" r="11" fill="${c}"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const cross = c => `<svg viewBox="0 0 24 24" width="4.6mm" height="4.6mm"><circle cx="12" cy="12" r="11" fill="${c}"/><path d="M8 8l8 8M16 8l-8 8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>`;

const MUSK = ['تُعطيكِ من طِيبها وخيرها', 'تتعلّمين منها وتستفيدين', 'يبقى أثرها الطيب فيكِ'];
const KIR = ['تؤذيكِ بسلوكها وكلامها', 'تنقل لكِ عاداتها السيئة', 'يلحقكِ أثرها ولو ابتعدتِ'];

const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face{font-family:Cairo;font-weight:600;src:url(${font('cairo-arabic-600-normal.woff2')})}
@font-face{font-family:Cairo;font-weight:700;src:url(${font('cairo-arabic-700-normal.woff2')})}
@font-face{font-family:Cairo;font-weight:800;src:url(${font('cairo-arabic-800-normal.woff2')})}
@font-face{font-family:Cairo;font-weight:900;src:url(${font('cairo-arabic-900-normal.woff2')})}
@font-face{font-family:Lalezar;src:url(${font('lalezar-arabic-400-normal.woff2')})}
@font-face{font-family:Ruqaa;font-weight:700;src:url(${font('aref-ruqaa-arabic-700-normal.woff2')})}
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:210mm;height:297mm;background:#fff;font-family:Cairo,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{position:absolute;inset:7mm;border-radius:8mm;overflow:hidden;background:${t.bg};border:0.5mm solid ${t.border};color:${t.ink};
  display:flex;flex-direction:column;align-items:center;text-align:center;padding:7mm 10mm 7mm}
.deco{position:absolute;border-radius:50%;border:0.8mm solid ${t.deco}}
.d1{width:150mm;height:150mm;top:-70mm;left:-75mm}.d2{width:120mm;height:120mm;bottom:-60mm;right:-60mm}
/* الرأس */
.logos{position:relative;display:flex;align-items:center;justify-content:space-between;width:100%;padding-bottom:3mm;border-bottom:0.4mm solid ${t.tagBorder}}
.lg{display:flex;flex-direction:column;align-items:center;width:42mm}
.lg img{height:18mm;max-width:32mm;object-fit:contain}
.lg b{font-weight:900;font-size:4.2mm;line-height:1.3;color:#111;margin-top:1.2mm}
.pill{display:flex;align-items:center;gap:2mm;font-weight:900;font-size:6.4mm;color:${t.accent2};background:${t.tagBg};border:0.5mm solid ${t.tagBorder};border-radius:20mm;padding:1mm 7mm}
.pill svg{width:6.4mm;height:6.4mm}
/* النص */
h1{font-family:Lalezar,Cairo;font-weight:400;font-size:17mm;line-height:1.1;margin-top:3mm}
h1 span{color:${t.accent}}
.tagline{font-weight:800;font-size:5.4mm;color:${t.soft};margin-top:1mm}
.tagline b{color:${t.accent2};font-weight:900}
.hadith{position:relative;margin-top:5mm;background:rgba(255,255,255,.75);border:0.4mm solid ${t.tagBorder};border-radius:5mm;padding:3.5mm 6mm 2.5mm;font-weight:700;font-size:4.3mm;line-height:1.7}
.hadith .q{position:absolute;top:-4mm;right:8mm;background:${t.accent};color:#fff;font-weight:900;font-size:3.6mm;border-radius:10mm;padding:0.3mm 4mm}
.hadith i{font-style:normal;font-weight:700;font-size:3.6mm;color:${t.soft}}
.vs{display:flex;align-items:stretch;gap:5mm;width:100%;margin-top:4mm}
.panel{flex:1;border-radius:6mm;padding:3mm 4mm 4mm;display:flex;flex-direction:column;align-items:center}
.good{background:rgba(98,193,187,.14);border:0.5mm solid rgba(98,193,187,.6)}
.bad{background:rgba(140,146,160,.10);border:0.5mm solid rgba(140,146,160,.4)}
.art{width:34mm;height:30mm}
.panel h3{font-family:Lalezar,Cairo;font-weight:400;font-size:8mm;line-height:1.2}
.good h3{color:${t.accent}}.bad h3{color:#6c7486}
.panel .sub{font-weight:700;font-size:3.6mm;color:${t.soft};margin-bottom:1.5mm}
.panel ul{list-style:none;display:flex;flex-direction:column;gap:1.6mm;width:100%}
.panel li{display:flex;align-items:center;gap:2mm;font-weight:800;font-size:4.1mm;text-align:right;background:rgba(255,255,255,.7);border-radius:3mm;padding:0.6mm 2.5mm}
.mid{display:flex;align-items:center;font-family:Lalezar,Cairo;font-size:7mm;color:${t.accent2}}
.close{margin-top:4mm;font-family:Lalezar,Cairo;font-size:8.6mm;line-height:1.2}
.close span{color:${t.accent}}
/* التذييل */
.foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;width:100%;border-top:0.4mm solid ${t.tagBorder};padding-top:3mm}
.credits{display:flex;flex-direction:column;align-items:flex-start;text-align:right;gap:0.8mm}
.gift{font-family:Ruqaa,Cairo;font-weight:700;font-size:8.4mm;color:${t.accent};line-height:1.3}
.by{font-weight:700;font-size:4.2mm;color:${t.soft}}
.names{display:flex;flex-direction:column;gap:0;font-weight:900;font-size:5.2mm;color:${t.ink}}
.names span::before{content:'';display:inline-block;width:2mm;height:2mm;border-radius:50%;background:${t.accent2};margin-left:2.5mm;vertical-align:middle}
.qrbox{display:flex;flex-direction:column;align-items:center;gap:2mm}
.qr{width:38mm;height:38mm;background:#fff;border-radius:3mm;border:0.8mm solid ${t.qrFrame};padding:0.6mm}
.qr svg{display:block}
.cta{background:${t.accent};color:#fff;font-weight:900;font-size:4.6mm;border-radius:10mm;padding:0.6mm 6mm}
</style></head><body><div class="page">
  <div class="deco d1"></div><div class="deco d2"></div>
  <div class="logos">${logoImg(LOGOS[0])}<div class="pill">${mic(t.accent2)}برنامج إذاعي</div>${logoImg(LOGOS[1])}</div>

  <h1>الصحبة <span>الصالحة</span></h1>
  <div class="tagline">قُل لي مَن تُصاحب… <b>أقُل لك مَن أنت</b></div>

  <div class="hadith"><span class="q">قال رسول الله ﷺ</span>«${HADITH}» <i>متفق عليه</i></div>

  <div class="vs">
    <div class="panel good"><div class="art">${muskArt}</div><h3>حاملة المسك</h3><div class="sub">الصاحبة الصالحة</div>
      <ul>${MUSK.map(x => `<li>${check(t.accent)}${x}</li>`).join('')}</ul></div>
    <div class="mid">أم</div>
    <div class="panel bad"><div class="art">${kirArt}</div><h3>نافخة الكير</h3><div class="sub">صاحبة السوء</div>
      <ul>${KIR.map(x => `<li>${cross('#9aa1b0')}${x}</li>`).join('')}</ul></div>
  </div>

  <div class="close">كوني <span>حاملة المسك</span>… واتركي أثراً طيباً</div>

  <div class="foot">
    <div class="credits">
      <div class="gift">إهداء من قسم الكيمياء</div>
      <div class="by">إعداد المعلمات:</div>
      <div class="names"><span>أ. أنوار الفضلي</span><span>أ. فاطمة الموسوي</span></div>
    </div>
    <div class="qrbox"><div class="qr">${qr}</div><div class="cta">امسحي الكود</div></div>
  </div>
</div></body></html>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(BUILD, { recursive: true });
  const file = path.join(BUILD, 'radio-poster.html');
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
