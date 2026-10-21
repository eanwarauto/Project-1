// يولّد بوستر «ترند الفصفصة» بمقاس A4: ثلاث ذرات بالطول (نواة + مستويين، ثلاثة، أربعة)
// مع كلمات مفتاحية متناثرة، ونسخة بالعرض لثلاث ذرات بمستويين خلال الدورة.
// التشغيل: node src/atoms.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'designs-atoms');
const FONTS = path.join(ROOT, 'assets', 'fonts');
const SCALE = 2; // 1240×1754 → 2480×3508 (A4 بدقة 300 نقطة/بوصة)
const W = 1240, H = 1754;

const PINK = '#c2477f', PINK_SOFT = '#f7d6e6', PINK_MID = '#e8a3c4';
const YELLOW = '#f6dc6b', YELLOW_SOFT = '#fbf0b8', LILAC = '#c9b3ec', INK = '#2b2b33';
const fontUrl = f => 'data:font/woff2;base64,' + fs.readFileSync(path.join(FONTS, f)).toString('base64');

// ---------- الذرة: نواة + مستويات طاقة ----------
const NUCLEUS_R = 46, GAP = 50;
function atom(levels, gap = GAP) {
  const r = NUCLEUS_R + levels * gap + 6, size = r * 2;
  const rings = Array.from({ length: levels }, (_, i) =>
    `<circle cx="${r}" cy="${r}" r="${NUCLEUS_R + (i + 1) * gap}" fill="none" stroke="${PINK}" stroke-width="3.2"/>`).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${rings}
    <circle cx="${r}" cy="${r}" r="${NUCLEUS_R}" fill="${PINK_SOFT}" stroke="${PINK}" stroke-width="3.2"/>
  </svg>`;
}

// ---------- رسومات زخرفية ----------
const heart = (x, y, s = 30, c = PINK_MID, rot = 0) => `<svg class="d" style="left:${x}px;top:${y}px;transform:rotate(${rot}deg)" width="${s}" height="${s}" viewBox="0 0 24 24">
  <path d="M12 21s-7.5-4.6-9.6-9.1C.9 8.6 3 5 6.4 5c2.1 0 3.6 1.2 4.4 2.6h2.4C14 6.2 15.5 5 17.6 5 21 5 23.1 8.6 21.6 11.9 19.5 16.4 12 21 12 21z" fill="none" stroke="${c}" stroke-width="2.2" stroke-linejoin="round"/></svg>`;
const star = (x, y, s = 34, rot = 0) => `<svg class="d" style="left:${x}px;top:${y}px;transform:rotate(${rot}deg)" width="${s}" height="${s}" viewBox="0 0 24 24">
  <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" fill="${YELLOW}" stroke="#e5c443" stroke-width="1" stroke-linejoin="round"/></svg>`;
const sparkle = (x, y, rot = 0) => `<svg class="d" style="left:${x}px;top:${y}px;transform:rotate(${rot}deg)" width="34" height="34" viewBox="0 0 34 34">
  <path d="M6 10l5 4M17 3v7M28 10l-5 4" stroke="${YELLOW}" stroke-width="3" stroke-linecap="round"/></svg>`;
const face = (cx, cy, s = 1) => `<g transform="translate(${cx} ${cy}) scale(${s})">
  <circle cx="-9" cy="0" r="3" fill="${INK}"/><circle cx="9" cy="0" r="3" fill="${INK}"/>
  <path d="M-4 5 q4 4 8 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
  <ellipse cx="-15" cy="6" rx="4" ry="2.4" fill="#f39abf"/><ellipse cx="15" cy="6" rx="4" ry="2.4" fill="#f39abf"/></g>`;

const atomIcon = (x, y, s = 150) => `<svg class="d" style="left:${x}px;top:${y}px" width="${s}" height="${s}" viewBox="0 0 120 120">
  <g fill="none" stroke="${INK}" stroke-width="3.5">
    <ellipse cx="60" cy="60" rx="54" ry="20"/>
    <ellipse cx="60" cy="60" rx="54" ry="20" transform="rotate(60 60 60)"/>
    <ellipse cx="60" cy="60" rx="54" ry="20" transform="rotate(-60 60 60)"/></g>
  <circle cx="60" cy="60" r="15" fill="${PINK_SOFT}" stroke="${INK}" stroke-width="3"/>${face(60, 59, .55)}
  <circle cx="114" cy="60" r="5" fill="${INK}"/><circle cx="33" cy="13" r="5" fill="${INK}"/><circle cx="33" cy="107" r="5" fill="${INK}"/></svg>`;

const flask = (x, y, s, fill, rot = 0) => `<svg class="d" style="left:${x}px;top:${y}px;transform:rotate(${rot}deg)" width="${s}" height="${s * 1.2}" viewBox="0 0 100 120">
  <path d="M38 8h24M42 8v30L12 98c-4 9 2 16 11 16h54c9 0 15-7 11-16L58 38V8" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M27 70h46l15 28c4 8-1 14-10 14H22c-9 0-14-6-10-14z" fill="${fill}"/>
  <path d="M42 8v30L12 98c-4 9 2 16 11 16h54c9 0 15-7 11-16L58 38V8" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  ${face(50, 88, 1)}<circle cx="44" cy="58" r="4" fill="none" stroke="${INK}" stroke-width="2"/><circle cx="55" cy="48" r="3" fill="none" stroke="${INK}" stroke-width="2"/></svg>`;

const tubes = (x, y, s = 190) => `<svg class="d" style="left:${x}px;top:${y}px" width="${s}" height="${s * .85}" viewBox="0 0 140 120">
  ${[[30, '#f2a7c9'], [70, YELLOW], [110, LILAC]].map(([cx, c]) => `
    <path d="M${cx - 13} 10v78a13 13 0 0 0 26 0V10" fill="#fff" stroke="${INK}" stroke-width="3.5"/>
    <path d="M${cx - 11} 46h22v42a11 11 0 0 1-22 0z" fill="${c}"/>
    <path d="M${cx - 13} 10v78a13 13 0 0 0 26 0V10" fill="none" stroke="${INK}" stroke-width="3.5"/>
    <path d="M${cx - 17} 10h34" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>${face(cx, 72, .55)}`).join('')}
  <rect x="6" y="34" width="128" height="10" rx="4" fill="#fff" stroke="${INK}" stroke-width="3.5"/>
  <path d="M10 44v68M130 44v68M4 112h132" stroke="${INK}" stroke-width="4" stroke-linecap="round"/></svg>`;

const molecule = (x, y, s = 130, rot = 0) => `<svg class="d" style="left:${x}px;top:${y}px;transform:rotate(${rot}deg)" width="${s}" height="${s}" viewBox="0 0 100 100">
  <path d="M50 50L20 25M50 50L82 30M50 50L45 85" stroke="${INK}" stroke-width="4"/>
  <circle cx="50" cy="50" r="15" fill="${YELLOW}" stroke="${INK}" stroke-width="3.5"/>
  <circle cx="20" cy="25" r="11" fill="${PINK_MID}" stroke="${INK}" stroke-width="3.5"/>
  <circle cx="82" cy="30" r="11" fill="${PINK_MID}" stroke="${INK}" stroke-width="3.5"/>
  <circle cx="45" cy="85" r="11" fill="${PINK_MID}" stroke="${INK}" stroke-width="3.5"/></svg>`;

const hexMol = (x, y, s = 150) => `<svg class="d" style="left:${x}px;top:${y}px" width="${s}" height="${s}" viewBox="0 0 120 120">
  <path d="M60 22L93 41V79L60 98L27 79V41Z" fill="none" stroke="${PINK}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M60 22V6M93 41l14-8M27 79l-14 8" stroke="${PINK}" stroke-width="5" stroke-linecap="round"/>
  ${[[60, 6], [107, 33], [13, 87], [60, 22], [93, 79], [27, 41]].map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="8" fill="#fff" stroke="${PINK}" stroke-width="4"/>`).join('')}</svg>`;

// ---------- الصفحة ----------
const magnifier = `<svg width="46" height="46" viewBox="0 0 24 24"><circle cx="10" cy="10" r="6.5" fill="#fff" stroke="${INK}" stroke-width="2.4"/>
  <path d="M15 15l6 6" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M7 8.5a3.5 3.5 0 0 1 3-2.5" stroke="${PINK_MID}" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`;
const GOLD = '#b8962a', LILAC_DARK = '#8a6cc4', LILAC_SOFT = '#ece3fa';

const page = (w, h, css, body) => `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face{font-family:Lalezar;src:url(${fontUrl('lalezar-arabic-400-normal.woff2')})}
@font-face{font-family:Cairo;font-weight:800;src:url(${fontUrl('cairo-arabic-800-normal.woff2')})}
@font-face{font-family:Pop;font-weight:500;src:url(${fontUrl('poppins-latin-500-normal.woff2')})}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${w}px;height:${h}px;overflow:hidden;background:#fff}
.frame{position:absolute;inset:34px;border:5px solid ${PINK_MID};border-radius:30px}
.frame2{position:absolute;inset:48px;border:3px dashed ${YELLOW};border-radius:22px}
.credit{position:absolute;bottom:54px;left:0;right:0;text-align:center;direction:ltr;
  font-family:Pop;font-weight:500;font-size:17px;letter-spacing:1.5px;color:#000}
.band{position:absolute;left:34px;right:34px;height:16px;background:${PINK_SOFT}}
.d{position:absolute}
.title{position:absolute;top:84px;left:50%;transform:translateX(-50%);
  padding:0 60px 8px;border:5px solid ${PINK};border-radius:999px;background:${PINK_SOFT};
  font-family:Lalezar;font-size:100px;line-height:1.25;color:${PINK};white-space:nowrap;
  box-shadow:0 8px 0 ${PINK_MID}}
.sub{position:absolute;top:262px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:14px;
  padding:6px 34px 10px;border-radius:999px;background:${YELLOW_SOFT};border:3px solid ${YELLOW};
  font-family:Lalezar;font-size:46px;color:${INK};white-space:nowrap}
${css}
</style></head><body>
<div class="frame"></div><div class="frame2"></div>
<div class="band" style="top:34px;border-radius:30px 30px 0 0"></div>
<div class="band" style="bottom:34px;border-radius:0 0 30px 30px"></div>
${body}
<div class="credit">ENG.7IKAYA</div>
</body></html>`;

// كلمات مفتاحية متناثرة ومائلة مثل الملصقات: [x, y, النص, اللون, الميلان]
const STICKER_COLORS = {
  pink: [PINK, PINK_SOFT], gold: [GOLD, YELLOW_SOFT], lilac: [LILAC_DARK, LILAC_SOFT], mint: ['#3f9c84', '#d7f2e9'],
};
const sticker = ([x, y, text, color, rot]) => {
  const [c, s] = STICKER_COLORS[color];
  return `<div class="sticker" style="left:${x}px;top:${y}px;--c:${c};--s:${s};transform:rotate(${rot}deg)">${text}</div>`;
};
const STICKER_CSS = `
.sticker{position:absolute;max-width:270px;font-family:Cairo;font-weight:800;font-size:31px;line-height:1.35;
  text-align:center;color:${INK};background:var(--s);border:3px solid var(--c);border-radius:22px;
  padding:12px 22px;box-shadow:5px 6px 0 var(--c)}`;

// ---- بالطول: خلال المجموعة (مستويان، ثلاثة، أربعة) ----
const GROUP_WORDS = [
  [90, 400, 'عدد مستويات الطاقة', 'pink', -7],
  [905, 430, 'نصف القطر الذري', 'gold', 6],
  [70, 760, 'درجة الحجب', 'lilac', 5],
  [930, 820, 'جذب النواة', 'mint', -6],
  [85, 1120, 'طاقة التأين', 'gold', -4],
  [110, 1440, 'إلكترونات التكافؤ', 'mint', 6],
];
const groupPage = page(W, H, STICKER_CSS + `
.atoms{position:absolute;top:370px;bottom:86px;left:0;right:0;
  display:flex;flex-direction:column;align-items:center;justify-content:space-between}`, `
<div class="title">ترند الفصفصة</div>
<div class="sub">${magnifier}اكتشف التدرج خلال المجموعة</div>
<div class="atoms">${[2, 3, 4].map(n => atom(n)).join('')}</div>
${GROUP_WORDS.map(sticker).join('')}
${atomIcon(88, 80, 140)}${hexMol(1010, 84, 140)}
${heart(110, 250, 30)}${star(1090, 250, 32, 12)}
${flask(150, 560, 90, YELLOW_SOFT, -8)}${star(300, 650, 30, 10)}${heart(1050, 640, 30, PINK_MID, 12)}
${heart(260, 960, 30)}${molecule(1000, 990, 110, 15)}${star(240, 1310, 32, -10)}
${flask(1010, 1400, 100, '#f7c4dc', 6)}${tubes(950, 1560, 150)}${star(290, 1610, 30, 14)}${heart(160, 1630, 28, PINK_MID, -10)}`);

// ---- بالعرض: خلال الدورة (ثلاث ذرات بمستويين، تقترب المستويات من النواة من اليسار لليمين) ----
const PERIOD_GAPS = [66, 52, 40];
const PERIOD_WORDS = [
  [180, 800, 'جذب النواة', 'mint', 5],
  [680, 770, 'نصف القطر الذري', 'gold', -4],
  [1300, 800, 'طاقة التأين', 'lilac', 6],
  [300, 1010, 'عدد مستويات الطاقة', 'gold', 4],
  [700, 1040, 'درجة الحجب', 'pink', -5],
  [1000, 1010, 'إلكترونات التكافؤ', 'mint', 5],
];
const PW = H, PH = W;
const periodPage = page(PW, PH, STICKER_CSS + `
.title{top:72px;font-size:92px}
.sub{top:236px;font-size:42px}
.atoms{position:absolute;top:320px;left:190px;right:190px;height:400px;direction:ltr;
  display:flex;align-items:center;justify-content:space-between}`, `
<div class="title">ترند الفصفصة</div>
<div class="sub">${magnifier}اكتشف التدرج خلال الدورة</div>
<div class="atoms">${PERIOD_GAPS.map(g => atom(2, g)).join('')}</div>
${PERIOD_WORDS.map(sticker).join('')}
${atomIcon(100, 76, 150)}${hexMol(1510, 80, 150)}
${heart(330, 120, 32)}${star(1400, 120, 34, 12)}
${star(600, 480, 30, -10)}${heart(1150, 500, 30, PINK_MID, 12)}
${tubes(90, 1000, 150)}${flask(1500, 990, 95, YELLOW_SOFT, 8)}${star(1340, 1100, 30, 10)}${heart(1000, 830, 28)}`);

const PAGES = [
  { name: 'ترند-الفصفصة-A4', w: W, h: H, html: groupPage },
  { name: 'ترند-الفصفصة-الدورة-A4-بالعرض', w: PW, h: PH, html: periodPage },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const p of PAGES) {
    const pg = await (await browser.newContext({ viewport: { width: p.w, height: p.h }, deviceScaleFactor: SCALE })).newPage();
    await pg.setContent(p.html, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({ path: path.join(OUT, p.name + '.png') });
    await pg.pdf({ path: path.join(OUT, p.name + '.pdf'), width: `${p.w}px`, height: `${p.h}px`, printBackground: true, pageRanges: '1' });
  }
  await browser.close();
  console.log('done →', OUT);
})();
