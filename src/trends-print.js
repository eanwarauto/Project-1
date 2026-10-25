// يولّد أوراق A4 جاهزة للطباعة والقص واللصق للوحة «التدرّج في خواص العناصر»: عناوين، أسهم، شرائط المجموعات والدورات، بطاقات الخواص، وملصقات الكرات.
// التشغيل: node src/trends-print.js  → trends-print/التدرج-للطباعة-A4.pdf وصور معاينة لكل ورقة
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'trends-print');
const HTML_DIR = path.join(ROOT, 'build', 'trends-print');
const fontUrl = f => 'file://' + path.join(ROOT, 'assets', 'fonts', f);

// ---------- الألوان ----------
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const toHex = a => '#' + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));
const lum = c => { const [r, g, b] = hex(c).map(v => v / 255); return .299 * r + .587 * g + .114 * b; };
const INK = '#1d2b3a';
// لون البطاقة حسب موقعها في الشريط (t من 0 إلى 1): فاتح في البداية وغامق في النهاية، ليظهر التدرّج
const shade = (hue, t) => t < .5 ? mix('#ffffff', hue, .35 + t * 1.3) : mix(hue, INK, (t - .5) * .55);

// ---------- البيانات ----------
const GROUPS = [
  { n: 1, a: '1A', ord: 'الأولى', fam: 'الفلزات القلوية', hue: '#ff6b6b', els: [[1, 'H', 'هيدروجين'], [3, 'Li', 'ليثيوم'], [11, 'Na', 'صوديوم'], [19, 'K', 'بوتاسيوم'], [37, 'Rb', 'روبيديوم'], [55, 'Cs', 'سيزيوم']] },
  { n: 2, a: '2A', ord: 'الثانية', fam: 'الفلزات القلوية الترابية', hue: '#ff922b', els: [[4, 'Be', 'بيريليوم'], [12, 'Mg', 'مغنيسيوم'], [20, 'Ca', 'كالسيوم'], [38, 'Sr', 'سترانشيوم'], [56, 'Ba', 'باريوم']] },
  { n: 13, a: '3A', ord: 'الثالثة', fam: 'مجموعة البورون', hue: '#f2b600', els: [[5, 'B', 'بورون'], [13, 'Al', 'ألومنيوم'], [31, 'Ga', 'جاليوم'], [49, 'In', 'إنديوم'], [81, 'Tl', 'ثاليوم']] },
  { n: 14, a: '4A', ord: 'الرابعة', fam: 'مجموعة الكربون', hue: '#40c057', els: [[6, 'C', 'كربون'], [14, 'Si', 'سيليكون'], [32, 'Ge', 'جرمانيوم'], [50, 'Sn', 'قصدير'], [82, 'Pb', 'رصاص']] },
  { n: 15, a: '5A', ord: 'الخامسة', fam: 'مجموعة النيتروجين', hue: '#12b886', els: [[7, 'N', 'نيتروجين'], [15, 'P', 'فوسفور'], [33, 'As', 'زرنيخ'], [51, 'Sb', 'أنتيمون'], [83, 'Bi', 'بزموت']] },
  { n: 16, a: '6A', ord: 'السادسة', fam: 'مجموعة الأكسجين', hue: '#339af0', els: [[8, 'O', 'أكسجين'], [16, 'S', 'كبريت'], [34, 'Se', 'سيلينيوم'], [52, 'Te', 'تيلوريوم'], [84, 'Po', 'بولونيوم']] },
  { n: 17, a: '7A', ord: 'السابعة', fam: 'الهالوجينات', hue: '#845ef7', els: [[9, 'F', 'فلور'], [17, 'Cl', 'كلور'], [35, 'Br', 'بروم'], [53, 'I', 'يود'], [85, 'At', 'أستاتين']] },
  { n: 18, a: '8A', ord: 'الثامنة', fam: 'الغازات النبيلة', hue: '#e64980', els: [[2, 'He', 'هيليوم'], [10, 'Ne', 'نيون'], [18, 'Ar', 'أرجون'], [36, 'Kr', 'كريبتون'], [54, 'Xe', 'زينون'], [86, 'Rn', 'رادون']] },
];
const PERIOD_OF = z => z <= 2 ? 1 : z <= 10 ? 2 : z <= 18 ? 3 : z <= 36 ? 4 : z <= 54 ? 5 : 6;
const PERIODS = [[2, 'الثانية'], [3, 'الثالثة'], [4, 'الرابعة']].map(([p, ord]) => ({
  p, ord, els: GROUPS.map(g => ({ e: g.els.find(e => PERIOD_OF(e[0]) === p), g })),
}));

// ---------- القطع ----------
// بطاقة عنصر مربعة بمقاس s ملم
function tile([z, sym, ar], s, bg) {
  const fg = lum(bg) > .62 ? INK : '#fff';
  return `<div class="tile" style="width:${s}mm;height:${s}mm;color:${fg};background:linear-gradient(150deg,${mix(bg, '#ffffff', .28)},${bg} 60%,${mix(bg, INK, .12)});border-radius:${s * .14}mm">
    <span class="z" style="font-size:${s * .17}mm">${z}</span>
    <span class="sym" style="font-size:${s * .42}mm">${sym}</span>
    <span class="ar" style="font-size:${Math.max(2.6, s * .145)}mm">${ar}</span></div>`;
}

// شريط مجموعة: البطاقات تكبر من الأعلى للأسفل (نصف القطر يزيد خلال المجموعة)
const GSIZE = p => 23 + (p - 1) * 2.8;
function groupStrip(g) {
  const tiles = g.els.map(e => tile(e, GSIZE(PERIOD_OF(e[0])), shade(g.hue, (PERIOD_OF(e[0]) - 1) / 5))).join('');
  return `<div class="piece strip-v" style="background:${mix(g.hue, '#ffffff', .88)}">
    <div class="ghead" style="background:${g.hue}">
      <div class="gnum">${g.a}</div>
      <div class="gname">المجموعة ${g.ord}</div>
      <div class="gfam">${g.fam}</div></div>
    <div class="vtiles">${tiles}</div>
    <div class="vfoot" style="color:${mix(g.hue, INK, .35)}">▼ يزيد الحجم</div></div>`;
}

// شريط دورة: البطاقات تصغر من اليسار لليمين (نصف القطر يقل خلال الدورة)
function periodStrip(P) {
  const tiles = P.els.map(({ e, g }, i) => tile(e, 27 - i * 1.45, shade(g.hue, .45))).join('');
  return `<div class="piece strip-h">
    <div class="phead"><span class="pbadge">${P.p}</span> الدورة ${P.ord}<span class="pnote">يقل الحجم ▶ ▶ ▶</span></div>
    <div class="htiles">${tiles}</div></div>`;
}

function banner(text, sub, colors, h, arrow = '') {
  return `<div class="piece banner" style="height:${h}mm;background:linear-gradient(100deg,${colors.join(',')})">
    ${arrow ? `<span class="barrow">${arrow}</span>` : ''}<div><div class="btext" style="font-size:${h * .42}mm">${text}</div>${sub ? `<div class="bsub">${sub}</div>` : ''}</div>${arrow ? `<span class="barrow">${arrow}</span>` : ''}</div>`;
}

function arrowH(w, h, label) {
  return `<div class="piece" style="width:${w}mm;height:${h}mm;padding:0;background:none;box-shadow:none">
    <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="gh" x1="0" x2="1"><stop offset="0" stop-color="#ff6b6b"/><stop offset=".5" stop-color="#f2b600"/><stop offset="1" stop-color="#339af0"/></linearGradient></defs>
    <path d="M0 ${h * .1} L${w - 16} ${h * .3} L${w - 16} 0 L${w} ${h / 2} L${w - 16} ${h} L${w - 16} ${h * .7} L0 ${h * .9} Z" fill="url(#gh)"/></svg>
    <div class="alabel" style="left:8mm;right:24mm;top:0;bottom:0">${label}</div></div>`;
}
function arrowV(w, h, label) {
  return `<div class="piece" style="width:${w}mm;height:${h}mm;padding:0;background:none;box-shadow:none">
    <svg width="100%" height="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="gv" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#339af0"/><stop offset=".5" stop-color="#845ef7"/><stop offset="1" stop-color="#ff6b6b"/></linearGradient></defs>
    <path d="M${w * .3} 0 L${w * .7} 0 L${w * .9} ${h - 18} L${w} ${h - 18} L${w / 2} ${h} L0 ${h - 18} L${w * .1} ${h - 18} Z" fill="url(#gv)"/></svg>
    <div class="alabel v" style="left:50%;top:${(h - 18) / 2}mm">${label}</div></div>`;
}

const PROPS = [
  ['نصف القطر الذري', -1, +1, '#ff6b6b'],
  ['طاقة التأين', +1, -1, '#f2b600'],
  ['السالبية الكهربائية', +1, -1, '#12b886'],
  ['الميل الإلكتروني', +1, -1, '#845ef7'],
];
const trend = v => v > 0 ? `<span class="tr up">▲ تزداد</span>` : `<span class="tr down">▼ تقل</span>`;
function propCard([name, period, group, hue]) {
  return `<div class="piece prop" style="border-color:${hue}">
    <div class="prophead" style="background:${hue}">${name}</div>
    <div class="proprow"><span>خلال الدورة →</span>${trend(period)}</div>
    <div class="proprow"><span>خلال المجموعة ↓</span>${trend(group)}</div></div>`;
}

function reasonCard(title, text, hue) {
  return `<div class="piece reason" style="background:${mix(hue, '#ffffff', .86)};border-color:${hue}">
    <div class="rtitle" style="color:${mix(hue, INK, .3)}">${title}</div><div class="rtext">${text}</div></div>`;
}

// ملصق دائري لكرة الفلين
function ballTag(e, hue) {
  const bg = shade(hue, .5);
  return `<div class="piece tag" style="background:radial-gradient(circle at 35% 30%,${mix(bg, '#ffffff', .35)},${bg} 70%)">
    <span class="tsym">${e[1]}</span><span class="tar">${e[2]}</span></div>`;
}

// ---------- الصفحات ----------
const page = (body, cls = '') => `<section class="page ${cls}">${body}<div class="foot">✂ قصّ على الخط المتقطع</div></section>`;

function pages() {
  const P = [];
  // 1: العناوين والأسهم
  P.push(page(`
    ${banner('التدرّج في خواص العناصر', 'في الجدول الدوري', ['#ff6b6b', '#f2b600', '#40c057', '#339af0', '#845ef7'], 40)}
    <div class="row" style="margin-top:6mm;align-items:flex-start">
      ${arrowV(34, 214, 'نصف القطر الذري يزداد')}
      <div class="col" style="width:152mm">
        ${banner('التدرّج خلال المجموعة', '', ['#845ef7', '#339af0'], 28, '⬇')}
        ${banner('التدرّج خلال الدورة', '', ['#ff6b6b', '#ff922b'], 28, '➡')}
        ${arrowH(152, 30, 'نصف القطر الذري يقل')}
        ${reasonCard('لماذا يزداد خلال المجموعة؟', 'كل دورة تضيف مستوى طاقة جديداً، فتبتعد الإلكترونات الخارجية عن النواة ويكبر حجم الذرة.', '#339af0')}
        ${reasonCard('لماذا يقل خلال الدورة؟', 'عدد المستويات ثابت، وتزداد شحنة النواة، فتجذب الإلكترونات أكثر ويصغر حجم الذرة.', '#ff6b6b')}
      </div></div>`));
  // 2 و3: شرائط المجموعات
  P.push(page(`<div class="row strips">${GROUPS.slice(0, 4).map(groupStrip).join('')}</div>`));
  P.push(page(`<div class="row strips">${GROUPS.slice(4).map(groupStrip).join('')}</div>`));
  // 4: شرائط الدورات
  P.push(page(`<div class="col" style="gap:7mm">${PERIODS.map(periodStrip).join('')}</div>
    <div class="row" style="margin-top:8mm;justify-content:center">${banner('المجموعة', '', ['#845ef7', '#339af0'], 18)}${banner('الدورة', '', ['#ff6b6b', '#ff922b'], 18)}</div>`));
  // 5: بطاقات الخواص وملصقات الكرات
  const tags = [...GROUPS[0].els.slice(0, 5).map(e => [e, GROUPS[0].hue]),
    ...GROUPS.slice(1, 7).map(g => [g.els.find(e => PERIOD_OF(e[0]) === 3), g.hue])];
  P.push(page(`<div class="grid2">${PROPS.map(propCard).join('')}</div>
    <div class="sec">ملصقات كرات الفلين</div>
    <div class="tags">${tags.map(([e, h]) => ballTag(e, h)).join('')}</div>`));
  return P.join('');
}

const CSS = `
@font-face{font-family:Cairo;font-weight:700;src:url(${fontUrl('cairo-arabic-700-normal.woff2')})}
@font-face{font-family:Cairo;font-weight:800;src:url(${fontUrl('cairo-arabic-800-normal.woff2')})}
@font-face{font-family:Cairo;font-weight:900;src:url(${fontUrl('cairo-arabic-900-normal.woff2')})}
@font-face{font-family:Lalezar;src:url(${fontUrl('lalezar-arabic-400-normal.woff2')})}
@font-face{font-family:Pop;font-weight:700;src:url(${fontUrl('poppins-latin-700-normal.woff2')})}
@font-face{font-family:Pop;font-weight:800;src:url(${fontUrl('poppins-latin-800-normal.woff2')})}
@page{size:A4;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Pop,Cairo;color:${INK};-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:210mm;height:297mm;padding:9mm 9mm 0;position:relative;overflow:hidden;page-break-after:always;background:#fff}
.foot{position:absolute;bottom:4mm;left:0;right:0;text-align:center;font:700 3mm Cairo;color:#9aa5b1}
.row{display:flex;gap:6mm;direction:ltr}
.col{display:flex;flex-direction:column;gap:6mm}
.piece{position:relative;outline:.35mm dashed #8a96a3;outline-offset:1.6mm;border-radius:3mm}
.tile{display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;flex:none;box-shadow:inset 0 -.6mm 0 rgba(0,0,0,.12)}
.tile .z{position:absolute;top:6%;left:9%;font-family:Pop;font-weight:700;opacity:.85}
.tile .sym{font-family:Pop;font-weight:800;line-height:1;margin-top:6%}
.tile .ar{font-family:Cairo;font-weight:800;line-height:1.3;margin-top:4%;white-space:nowrap}
.strips{justify-content:center;gap:7mm;align-items:flex-start}
.strip-v{display:flex;flex-direction:column;align-items:center;padding:2mm 2mm 2.5mm;width:43mm}
.ghead{width:100%;border-radius:2.4mm;color:#fff;text-align:center;padding:1.6mm 1mm 2mm;margin-bottom:2.5mm}
.gnum{font:800 7mm/1 Pop}
.gname{font:900 4mm/1.5 Cairo;white-space:nowrap}
.gfam{font:700 3mm/1.3 Cairo;opacity:.95}
.vtiles{display:flex;flex-direction:column;align-items:center;gap:1.6mm}
.vfoot{font:800 3.4mm Cairo;margin-top:2mm;direction:rtl}
.strip-h{padding:2mm;background:linear-gradient(90deg,#fff1f1,#f3efff)}
.phead{direction:rtl;font:900 5.2mm/1.5 Cairo;display:flex;align-items:center;gap:2.5mm;margin-bottom:2mm;padding:0 1mm}
.pbadge{display:inline-flex;width:8mm;height:8mm;border-radius:50%;background:${INK};color:#fff;font:800 4.4mm Pop;align-items:center;justify-content:center}
.pnote{margin-right:auto;font:800 3.6mm Cairo;color:#c2410c}
.htiles{display:flex;align-items:center;gap:1mm;direction:ltr}
.banner{display:flex;align-items:center;justify-content:center;gap:6mm;color:#fff;text-align:center;border-radius:4mm;box-shadow:inset 0 -1.2mm 0 rgba(0,0,0,.15);padding:0 6mm}
.btext{font-family:Lalezar;line-height:1.1;text-shadow:0 .5mm 0 rgba(0,0,0,.18);white-space:nowrap}
.bsub{font:800 4.6mm Cairo;opacity:.95;margin-top:-1mm}
.barrow{font-size:10mm;line-height:1}
.alabel{position:absolute;display:flex;align-items:center;justify-content:center;font:900 5.4mm Cairo;color:#fff;text-shadow:0 .4mm .8mm rgba(0,0,0,.35);direction:rtl;white-space:nowrap}
.alabel.v{transform:translate(-50%,-50%) rotate(90deg)}
.reason{border:.8mm solid;border-radius:4mm;padding:3mm 5mm;direction:rtl}
.rtitle{font:900 5.4mm/1.5 Cairo}
.rtext{font:700 4.4mm/1.6 Cairo}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:8mm;direction:rtl}
.prop{border:.8mm solid;border-radius:4mm;overflow:hidden;direction:rtl;background:#fff}
.prophead{color:#fff;font:900 6mm/1.6 Cairo;text-align:center}
.proprow{display:flex;justify-content:space-between;align-items:center;padding:2.4mm 4mm;font:800 4.4mm Cairo}
.proprow+.proprow{border-top:.3mm solid #e5e9ef}
.tr{border-radius:10mm;padding:.6mm 3.5mm;font:900 4.4mm Cairo}
.tr.up{background:#e3f6e8;color:#1f8a46}.tr.down{background:#fde6e4;color:#c8412f}
.sec{font:900 5.4mm Cairo;margin:10mm 0 5mm;text-align:center;direction:rtl}
.tags{display:flex;flex-wrap:wrap;gap:7mm 8mm;justify-content:center;direction:ltr}
.tag{width:34mm;height:34mm;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-shadow:0 .4mm .6mm rgba(0,0,0,.25)}
.tag.piece{outline-offset:1.2mm;border-radius:50%}
.tsym{font:800 13mm/1 Pop}
.tar{font:800 4mm/1.4 Cairo}
`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(HTML_DIR, { recursive: true });
  const f = path.join(HTML_DIR, 'trends-print.html');
  fs.writeFileSync(f, `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${pages()}</body></html>`);
  const browser = await chromium.launch();
  const pg = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 3 });
  await pg.goto('file://' + f, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.pdf({ path: path.join(OUT, 'التدرج-للطباعة-A4.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
  const secs = await pg.$$('section.page');
  for (let i = 0; i < secs.length; i++) await secs[i].screenshot({ path: path.join(OUT, `ورقة-${i + 1}.png`) });
  await browser.close();
})();
