// يولّد تصميم لوحة «التدرّج في خواص العناصر» بكرات الفلين، بمقياس حقيقي للوحة 50×70 سم (1 سم = 40 بكسل).
// التشغيل: node src/trends-board.js  → trends-board/01-تصميم-اللوحة.png و trends-board/02-دليل-التنفيذ.png
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'trends-board');
const FONTS = path.join(ROOT, 'assets', 'fonts');
const HTML_DIR = path.join(ROOT, 'build', 'trends-board');
const fontUrl = f => 'file://' + path.join(FONTS, f);
const CM = 40;
const W = 50 * CM, H = 70 * CM;

const KIND = {
  metal: { name: 'فلز', ring: '#f08a24', disc: '#ffe3c4' },
  metalloid: { name: 'شبه فلز', ring: '#8e5bd6', disc: '#eadcff' },
  nonmetal: { name: 'لا فلز', ring: '#1f9ad6', disc: '#d4eefc' },
};

// القطر بالسنتيمتر، وعدد مستويات الطاقة، وعدد إلكترونات التكافؤ، والموقع (مركز الكرة بالسنتيمتر)
const GROUP1 = [
  { sym: 'H', ar: 'هيدروجين', d: 2, shells: 1, val: 1, kind: 'nonmetal', x: 10.5, y: 16 },
  { sym: 'Li', ar: 'ليثيوم', d: 5, shells: 2, val: 1, kind: 'metal', x: 10.5, y: 22 },
  { sym: 'Na', ar: 'صوديوم', d: 7, shells: 3, val: 1, kind: 'metal', x: 10.5, y: 30 },
  { sym: 'K', ar: 'بوتاسيوم', d: 8, shells: 4, val: 1, kind: 'metal', x: 10.5, y: 40 },
  { sym: 'Rb', ar: 'روبيديوم', d: 10, shells: 5, val: 1, kind: 'metal', x: 10.5, y: 51.5 },
];
const PERIOD3 = [
  GROUP1[2],
  { sym: 'Mg', ar: 'مغنيسيوم', d: 6, shells: 3, val: 2, kind: 'metal', x: 18.75, y: 30 },
  { sym: 'Al', ar: 'ألومنيوم', d: 5, shells: 3, val: 3, kind: 'metal', x: 26, y: 30 },
  { sym: 'Si', ar: 'سيليكون', d: 4, shells: 3, val: 4, kind: 'metalloid', x: 32.25, y: 30 },
  { sym: 'P', ar: 'فوسفور', d: 3, shells: 3, val: 5, kind: 'nonmetal', x: 37.5, y: 30 },
  { sym: 'S', ar: 'كبريت', d: 2.5, shells: 3, val: 6, kind: 'nonmetal', x: 42, y: 30 },
  { sym: 'Cl', ar: 'كلور', d: 2, shells: 3, val: 7, kind: 'nonmetal', x: 46, y: 30 },
];
const ALL = [...GROUP1, ...PERIOD3.slice(1)];

const CSS = `
@font-face{font-family:Cairo;font-weight:600;src:url(${fontUrl('cairo-arabic-600-normal.woff2')})}
@font-face{font-family:Cairo;font-weight:800;src:url(${fontUrl('cairo-arabic-800-normal.woff2')})}
@font-face{font-family:Cairo;font-weight:900;src:url(${fontUrl('cairo-arabic-900-normal.woff2')})}
@font-face{font-family:Lalezar;src:url(${fontUrl('lalezar-arabic-400-normal.woff2')})}
@font-face{font-family:Pop;font-weight:700;src:url(${fontUrl('poppins-latin-700-normal.woff2')})}
*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;font-family:Pop,Cairo;color:#1d2b3a;background:#fff}
.abs{position:absolute}
.lbl{font-weight:800;white-space:nowrap}
`;
const html = (w, h, body) => `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>${CSS}</style></head>
<body style="height:${h}px"><div style="position:relative;width:${w}px;height:${h}px;overflow:hidden">${body}</div></body></html>`;

// كرة فلين: قرص ورقي ملوّن خلفها، حلقات مستويات الطاقة، نقاط إلكترونات التكافؤ، والرمز في المنتصف
function ball(e, cx = e.x * CM, cy = e.y * CM, d = e.d * CM) {
  const r = d / 2, k = KIND[e.kind];
  const sw = Math.max(3, r * 0.045);
  let s = `<circle cx="${cx}" cy="${cy}" r="${r + Math.max(14, r * .18)}" fill="${k.disc}"/>`;
  s += `<ellipse cx="${cx + r * .08}" cy="${cy + r * .9}" rx="${r * .85}" ry="${r * .16}" fill="rgba(0,0,0,.12)" filter="url(#blur)"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#foam)" stroke="#d5dbe3" stroke-width="2"/>`;
  const rings = [];
  for (let i = 0; i < e.shells; i++) rings.push(e.shells === 1 ? r * .72 : r * (.5 + .4 * i / (e.shells - 1)));
  rings.forEach(rr => { s += `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="none" stroke="${k.ring}" stroke-width="${sw}"/>`; });
  const outer = rings[rings.length - 1], dr = Math.max(4.5, r * .065);
  for (let i = 0; i < e.val; i++) {
    const a = -Math.PI / 2 + i * 2 * Math.PI / e.val;
    s += `<circle cx="${cx + outer * Math.cos(a)}" cy="${cy + outer * Math.sin(a)}" r="${dr}" fill="#5a3b22"/>`;
  }
  const fs = Math.max(20, r * (e.shells === 1 ? .62 : .5));
  s += `<text x="${cx}" y="${cy}" dy=".36em" text-anchor="middle" font-family="Pop" font-weight="700" font-size="${fs}" fill="#1d2b3a">${e.sym}</text>`;
  return s;
}

// سهم مُستدِق: يبدأ عريضاً وينتهي رفيعاً (أو العكس) ليحاكي تغيّر الحجم
function taperArrow(x1, y1, x2, y2, w1, w2, color, id) {
  const len = Math.hypot(x2 - x1, y2 - y1), ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  const head = 58, hw = Math.max(w1, w2) * .5 + 34, L = len - head;
  return `<g transform="translate(${x1} ${y1}) rotate(${ang})">
    <defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${color[0]}"/><stop offset="1" stop-color="${color[1]}"/></linearGradient></defs>
    <path d="M0 ${-w1 / 2} L${L} ${-w2 / 2} L${L} ${-hw} L${len} 0 L${L} ${hw} L${L} ${w2 / 2} L0 ${w1 / 2} Z" fill="url(#${id})"/></g>`;
}

function miniTable(x, y, cw, ch) {
  const blocks = [[1], [1, 2, 13, 14, 15, 16, 17, 18], [1, 2, 13, 14, 15, 16, 17, 18]];
  const hl = (p, g) => (g === 1 && p <= 5) || p === 3 && g <= 17;
  let s = '';
  for (let p = 1; p <= 7; p++) {
    const cols = p === 1 ? [1, 18] : p <= 3 ? blocks[2] : Array.from({ length: 18 }, (_, i) => i + 1);
    for (const g of cols) {
      const on = hl(p, g), cx = x + (g - 1) * cw, cy = y + (p - 1) * ch;
      const fill = on ? (g === 1 && p !== 3 ? '#ffd9b0' : p === 3 && g !== 1 ? '#bfe3f7' : '#ffc06b') : '#f3f5f8';
      s += `<rect x="${cx + 2}" y="${cy + 2}" width="${cw - 4}" height="${ch - 4}" rx="6" fill="${fill}" stroke="${on ? '#9aa7b6' : '#e2e7ee'}" stroke-width="2"/>`;
    }
  }
  return s;
}

function board() {
  const C = v => v * CM;
  let svg = `<svg class="abs" style="left:0;top:0" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="foam" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#f4f6f9"/><stop offset="1" stop-color="#dfe4ea"/></radialGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>`;
  // إطار من شريط ملوّن (واشي تيب أو ورق ملوّن)
  const fr = [['#f08a24', 0], ['#8e5bd6', 1], ['#1f9ad6', 2]];
  fr.forEach(([c, i]) => { svg += `<rect x="${18 + i * 16}" y="${18 + i * 16}" width="${W - 36 - i * 32}" height="${H - 36 - i * 32}" rx="${36 - i * 8}" fill="none" stroke="${c}" stroke-width="10" opacity=".85"/>`; });

  // جدول دوري مصغّر يوضح مكان المجموعة والدورة
  const tx = C(17.2), ty = C(12.6), cw = C(29.6) / 18, ch = C(1.45);
  svg += miniTable(tx, ty, cw, ch);

  // الأسهم
  svg += taperArrow(C(16), C(36.4), C(48), C(36.4), 64, 14, ['#f08a24', '#1f9ad6'], 'ah');
  svg += taperArrow(C(2.2), C(14), C(2.2), C(57.5), 14, 64, ['#1f9ad6', '#f08a24'], 'av');

  ALL.forEach(e => { svg += ball(e); });

  // مفتاح الرسم
  const ky = C(63.2);
  const keyBall = { sym: '', d: 2.6, shells: 2, val: 3, kind: 'metal' };
  svg += ball(keyBall, C(44.5), ky, C(2.6));
  svg += `</svg>`;

  // جدول الخواص
  const props = [
    ['نصف القطر الذري', -1, +1],
    ['طاقة التأين', +1, -1],
    ['السالبية الكهربائية', +1, -1],
    ['الميل الإلكتروني', +1, -1],
  ];
  const tag = v => v > 0
    ? `<span style="display:inline-flex;align-items:center;gap:10px;background:#e3f6e8;color:#1f8a46;border-radius:40px;padding:2px 26px">▲ يزيد</span>`
    : `<span style="display:inline-flex;align-items:center;gap:10px;background:#fde6e4;color:#c8412f;border-radius:40px;padding:2px 26px">▼ يقل</span>`;
  const rows = props.map(([n, a, b], i) => `<tr style="background:${i % 2 ? '#fff' : '#f7f9fc'}"><td style="padding:14px 26px;font-weight:800">${n}</td><td style="text-align:center">${tag(a)}</td><td style="text-align:center">${tag(b)}</td></tr>`).join('');
  const table = `<div class="abs" style="left:${C(17.5)}px;top:${C(42.2)}px;width:${C(29.5)}px;border-radius:34px;overflow:hidden;border:4px solid #e2e7ee;font-size:44px;background:#fff">
    <table style="width:100%;border-collapse:collapse">
      <tr style="background:#1d2b3a;color:#fff;font-size:40px"><th style="padding:14px 26px;text-align:right">الخاصية</th><th>عبر الدورة →</th><th>عبر المجموعة ↓</th></tr>
      ${rows}
    </table></div>`;

  const chip = k => `<span style="display:inline-flex;align-items:center;gap:14px"><span style="width:44px;height:44px;border-radius:50%;background:${KIND[k].disc};border:7px solid ${KIND[k].ring}"></span>${KIND[k].name}</span>`;

  const body = svg + `
  <div class="abs" style="left:0;right:0;top:${C(2.6)}px;text-align:center">
    <div style="font-family:Lalezar;font-size:150px;line-height:1.1;color:#1d2b3a">التدرّج في خواص العناصر</div>
    <div style="font-weight:800;font-size:56px;color:#5d6b7b;margin-top:10px">
      <span style="color:#f08a24">عبر الدورة</span> &nbsp;•&nbsp; <span style="color:#1f9ad6">عبر المجموعة</span></div>
  </div>
  <div class="abs lbl" style="left:${C(17.2)}px;top:${C(23.3)}px;width:${C(29.6)}px;text-align:center;font-size:36px;color:#7b8794">موقعها في الجدول الدوري</div>
  <div class="abs lbl" style="left:${C(5.2)}px;top:${C(10.8)}px;width:${C(10.6)}px;text-align:center;font-size:52px;color:#f08a24">المجموعة 1</div>
  <div class="abs lbl" style="left:${C(16)}px;top:${C(37.6)}px;width:${C(32)}px;text-align:center;font-size:44px;color:#3b4a5a">
    <span style="color:#1f9ad6">الدورة 3:</span> نصف القطر يقل (نفس عدد المستويات + جذب النواة يزيد)</div>
  <div class="abs lbl" style="left:${C(4.3)}px;top:${C(36)}px;transform:translate(-50%,-50%) rotate(-90deg);font-size:44px;color:#3b4a5a">
    نصف القطر يزيد (مستوى طاقة جديد)</div>
  <div class="abs lbl" style="left:${C(5)}px;top:${C(61.7)}px;font-size:46px;display:flex;gap:56px">${chip('metal')}${chip('metalloid')}${chip('nonmetal')}</div>
  <div class="abs lbl" style="left:${C(27.5)}px;top:${C(61.2)}px;font-size:38px;line-height:1.5;color:#3b4a5a;text-align:left">
    الحلقة = مستوى طاقة<br>النقطة = إلكترون تكافؤ</div>
  ${table}`;
  return html(W, H, body);
}

function guide() {
  const GW = 2000, GH = 2700;
  const rows = ALL.map((e, i) => {
    const k = KIND[e.kind];
    const mini = `<svg width="120" height="120" viewBox="0 0 120 120"><defs><radialGradient id="foam" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#f4f6f9"/><stop offset="1" stop-color="#dfe4ea"/></radialGradient><filter id="blur"><feGaussianBlur stdDeviation="2"/></filter></defs>${ball(e, 60, 60, 12 + e.d * 9.2)}</svg>`;
    return `<tr style="background:${i % 2 ? '#fff' : '#f7f9fc'}">
      <td style="padding:2px 18px">${mini}</td>
      <td><b style="font-family:Pop;font-size:46px">${e.sym}</b> &nbsp;${e.ar}</td>
      <td style="text-align:center;font-family:Pop;font-size:44px">${e.d}<span style="font-family:Cairo;font-size:30px"> سم</span></td>
      <td style="text-align:center;font-family:Pop;font-size:44px">${e.shells}</td>
      <td style="text-align:center;font-family:Pop;font-size:44px">${e.val}</td>
      <td style="text-align:center"><span style="display:inline-block;width:30px;height:30px;border-radius:50%;background:${k.ring};vertical-align:middle;margin-left:10px"></span>${k.name}</td></tr>`;
  }).join('');
  const steps = [
    'لوحة فوم بورد بيضاء 50×70 سم، مع خطين خفيفين بالرصاص (أفقي وعمودي) لترتيب الكرات.',
    'لكل كرة: الحلقات بقلم لون التصنيف، والنقاط بالقلم البني، والرمز في الوسط.',
    'دائرة ورق ملوّن أكبر من الكرة بـ 1 سم تُلصق مكان الكرة (هالة ملوّنة).',
    'أسياخ الشواء تُقص قطعاً بطول 3 سم: نصفها في الكرة ونصفها في اللوحة، مع نقطة غراء.',
    'السهمان عريضان من جهة وضيقان من الأخرى، بتدرّج من البرتقالي إلى الأزرق (ورق ملوّن أو أقلام).',
    'جدول الخواص والجدول المصغّر: طباعة ولصق، أو رسم بالمسطرة.',
  ].map((t, i) => `<div style="display:flex;gap:26px;align-items:flex-start;margin-bottom:18px"><span style="flex:none;width:64px;height:64px;border-radius:50%;background:#1d2b3a;color:#fff;font-family:Pop;font-size:36px;display:flex;align-items:center;justify-content:center">${i + 1}</span><span style="padding-top:4px">${t}</span></div>`).join('');
  const body = `
  <div style="padding:90px 110px">
    <div style="font-family:Lalezar;font-size:110px;line-height:1.1">دليل التنفيذ</div>
    <div style="font-weight:800;font-size:44px;color:#5d6b7b;margin:6px 0 40px">11 كرة فلين — الأحجام والرسم على كل كرة</div>
    <div style="border-radius:30px;overflow:hidden;border:4px solid #e2e7ee;font-size:40px;font-weight:800">
      <table style="width:100%;border-collapse:collapse">
        <tr style="background:#1d2b3a;color:#fff;font-size:34px"><th></th><th style="text-align:right;padding:16px 0">العنصر</th><th>قطر الكرة</th><th>الحلقات</th><th>النقاط</th><th>اللون</th></tr>
        ${rows}
      </table></div>
    <div style="margin-top:48px;font-size:38px;font-weight:600;line-height:1.55">${steps}</div>
  </div>`;
  return html(GW, GH, body).replace(`height:${GH}px"><div style="position:relative;width:${GW}px;height:${GH}px;overflow:hidden">`, `height:auto"><div style="position:relative;width:${GW}px">`);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(HTML_DIR, { recursive: true });
  const browser = await chromium.launch();
  const pg = await browser.newPage({ viewport: { width: W, height: 1000 } });
  for (const [file, src] of [['01-تصميم-اللوحة.png', board()], ['02-دليل-التنفيذ.png', guide()]]) {
    const f = path.join(HTML_DIR, file.replace('.png', '.html'));
    fs.writeFileSync(f, src);
    await pg.goto('file://' + f, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({ path: path.join(OUT, file), fullPage: true });
  }
  await browser.close();
})();
