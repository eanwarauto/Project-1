// عرض تقديمي: الدرس [1-1] الترتيب الإلكتروني
const pptxgen = require('pptxgenjs');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const A = p => path.join(__dirname, 'assets', p);
const OUT = process.argv[2] || path.join(__dirname, 'deck.pptx');
const C = {
  navy: '16325C', blue: '1F6FB2', sky: '3FA7D6', teal: '0F9D8E', coral: 'E8335F', gold: 'E59A00',
  purple: '6C4FE0', green: '0B8A5A', head: 'D6ECFA', border: '8FB1DA', white: 'FFFFFF', soft: 'F3F9FF',
};
const FONT = 'Arial';
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5
pres.rtlMode = true;
pres.title = 'الترتيب الإلكتروني';
pres.theme = { headFontFace: FONT, bodyFontFace: FONT };
pres.defineSlideMaster({ title: 'TITLE', background: { path: A('bg_title.png') } });
pres.defineSlideMaster({ title: 'CONTENT', background: { path: A('bg_content.png') } });

const ANIM = []; // per slide: [{name, fx, trig, dur, delay}]
let cur, curAnim, n = 0, TITLE_X = 6;
function newSlide(master = 'CONTENT') {
  cur = pres.addSlide({ masterName: master }); curAnim = []; ANIM.push(curAnim); return cur;
}
function reg(opts, fx, trig = 'after', dur = 600, delay = 0) {
  if (!fx) return opts;
  const name = `anim_${ANIM.length}_${++n}`;
  curAnim.push({ name, fx, trig, dur, delay });
  return { ...opts, objectName: name };
}
const dims = {};
async function loadDims() {
  for (const f of fs.readdirSync(path.join(__dirname, 'assets'))) {
    const m = await sharp(A(f)).metadata(); dims[f] = m.width / m.height;
  }
}
const shadow = () => ({ type: 'outer', color: '1F4F8A', opacity: 0.18, blur: 12, offset: 4, angle: 90 });

// ---------- helpers ----------
function img(file, x, y, w, h, fx, trig, dur, delay) {
  if (h == null) h = w / dims[file];
  if (w == null) w = h * dims[file];
  cur.addImage(reg({ path: A(file), x, y, w, h, altText: file }, fx, trig, dur, delay));
  return { x, y, w, h };
}
// runs: string or [{text, options}]
function text(runs, x, y, w, h, o = {}, fx, trig, dur, delay) {
  const base = { fontFace: FONT, bold: true, color: C.navy, fontSize: 26, rtlMode: true, align: 'right', valign: 'top', margin: 4, lang: 'ar-KW', paraSpaceAfter: 6, lineSpacingMultiple: 1.05 };
  if (o.rtlMode === false && !o.lang) o = { ...o, lang: 'en-US' };
  cur.addText(runs, reg({ ...base, ...o, x, y, w, h, isTextBox: true }, fx, trig, dur, delay));
}
const r = (t, o = {}) => ({ text: t, options: o });
const br = (t, o = {}) => ({ text: t, options: { ...o, breakLine: true } });
function box(x, y, w, h, o = {}, fx, trig, dur, delay) {
  cur.addShape(pres.ShapeType.roundRect, reg({ x, y, w, h, rectRadius: o.rad ?? 0.25, fill: { color: o.fill || C.white, transparency: o.tr ?? 0 },
    line: o.line ? { color: o.line, width: o.lw || 3 } : { type: 'none' }, shadow: o.noShadow ? undefined : shadow() }, fx, trig, dur, delay));
}
// slide title pill (book-style banner) with a glossy sphere
function title(t, sp = 'sp_blue', color = C.blue, w = 6.6) {
  sp += '.png';
  w = Math.max(w, Math.min(8.6, 2.0 + t.length * 0.3));
  const x = 12.85 - w; TITLE_X = x;
  cur.addText(t, reg({ shape: pres.ShapeType.roundRect, rectRadius: 0.47, x, y: 0.55, w, h: 0.95, fill: { color }, shadow: shadow(),
    fontFace: FONT, bold: true, fontSize: 36, color: C.white, rtlMode: true, align: 'right', valign: 'middle', margin: [0.3 * 72, 1.15 * 72, 0, 0], lang: 'ar-KW' }, 'wipeR', 'after', 700));
  img(sp, 11.85, 0.42, 1.2, 1.2, 'zoom', 'with', 600, 200);
}
// numbered sphere bullet
function ball(file, num, x, y, s, fx = 'zoom', trig = 'after') {
  img(file, x, y, s, s, fx, trig, 500);
  text(String(num), x, y + s * 0.08, s, s * 0.8, { align: 'center', valign: 'middle', fontSize: s * 30, color: C.white, rtlMode: false, margin: 0 }, 'fade', 'with', 300);
}
function badge(file) { img(file, TITLE_X - 1.55, 0.32, 1.4, 1.4, 'zoom', 'after', 600); }

// tables -------------------------------------------------------------
const sub = (z, sym, o = {}) => [r(String(z), { subscript: true, ...o }), r(sym, o)];
function cell(t, o = {}) {
  return { text: t, options: { fontFace: FONT, bold: true, fontSize: o.fs || 24, color: o.color || C.navy, align: 'center', valign: 'middle',
    fill: { color: o.fill || C.white }, border: { type: 'solid', pt: 1.5, color: C.border }, rtlMode: !!o.rtl, margin: 3, ...o.extra } };
}
// draws the book's rounded frame + table; returns geometry for answer overlays
function table(rows, x, y, colW, rowH, frame = true, fx = 'fade') {
  const W = colW.reduce((a, b) => a + b), H = rowH.reduce((a, b) => a + b);
  if (frame) box(x - 0.28, y - 0.28, W + 0.56, H + 0.56, { line: C.border, lw: 5, rad: 0.35, fill: C.white, tr: 15 }, 'zoom', 'after', 600);
  cur.addTable(rows, reg({ x, y, w: W, colW, rowH }, fx, 'after', 700));
  const cx = colW.map((_, i) => x + colW.slice(0, i).reduce((a, b) => a + b, 0));
  const cy = rowH.map((_, i) => y + rowH.slice(0, i).reduce((a, b) => a + b, 0));
  return { cx, cy, colW, rowH };
}
// answer text inside cell (appears on click)
function ans(g, col, row, t, trig = 'with', fs = 24) {
  text(t, g.cx[col], g.cy[row], g.colW[col], g.rowH[row], { align: 'center', valign: 'middle', fontSize: fs, color: C.green, rtlMode: /[\u0600-\u06FF]/.test(t), margin: 0 }, 'zoom', trig, 450);
}
function ansImg(g, col, row, file, trig = 'with', hFrac = 0.82) {
  const h = g.rowH[row] * hFrac, w = Math.min(h * dims[file], g.colW[col] * 0.92), hh = w / dims[file];
  img(file, g.cx[col] + (g.colW[col] - w) / 2, g.cy[row] + (g.rowH[row] - hh) / 2, w, hh, 'zoom', trig, 450);
}
function clickHint() { return;
  text([r('الإجابة بالنقر ', { color: C.teal }), r('◀', { color: C.teal })], x, y, 3.2, 0.45, { fontSize: 16, align: 'left' }, 'fade', 'after', 400);
}

async function build() {
  await loadDims();

  // 1 ── الغلاف ────────────────────────────────────────────
  newSlide('TITLE');
  img('hero_atom.png', 0.45, 1.15, 5.2, 5.2, 'zoom', 'after', 1000);
  text('الدرس [1-1]', 9.6, 1.35, 3.1, 0.75, { shape: pres.ShapeType.roundRect, rectRadius: 0.37, fill: { color: C.teal }, color: C.white, fontSize: 28, align: 'center', valign: 'middle', shadow: shadow(), margin: 0 }, 'flyR', 'after', 700);
  text([br('الترتيب'), r('الإلكتروني')], 5.6, 2.15, 7.2, 2.5, { fontSize: 72, color: C.navy, valign: 'middle', margin: 0, paraSpaceAfter: 0, lineSpacingMultiple: 0.95 }, 'wipeR', 'after', 1300);
  text('Electron\u00A0Configuration', 5.6, 4.6, 7.2, 0.8, { fontSize: 36, color: C.blue, rtlMode: false, valign: 'middle', margin: 0, lang: 'en-US' }, 'float', 'after', 900);
  ['lewis_C.png', 'lewis_N.png', 'lewis_F.png', 'lewis_Be.png'].forEach((f, i) => img(f, 11.65 - i * 1.55, 5.55, null, 1.15, 'zoom', i ? 'after' : 'after', 400));

  // 2 ── ماذا سأتعلم؟ ──────────────────────────────────────
  newSlide(); title('ماذا سأتعلم ؟', 'sp_teal', C.teal, 5.6);
  img('octet.png', 0.45, 1.85, 4.7, 4.7, 'zoom', 'after', 900);
  const learn = ['مفهوم التكافؤ وإلكترونات التكافؤ.', 'الترتيب الإلكتروني النقطي (تمثيل لويس).', 'قاعدة الثمانية.', 'الترتيب الإلكتروني للكاتيونات والأنيونات.'];
  const sp4 = ['sp_teal.png', 'sp_coral.png', 'sp_gold.png', 'sp_purple.png'];
  learn.forEach((t, i) => {
    const y = 1.95 + i * 1.18;
    box(5.6, y, 7.25, 0.98, { fill: C.white, tr: 5, rad: 0.49 }, 'flyR', 'after', 500);
    text(t, 5.75, y, 6.0, 0.98, { fontSize: 28, valign: 'middle', margin: 0 }, 'wipeR', 'with', 700, 150);
    ball(sp4[i], i + 1, 11.9, y + 0.04, 0.9, 'zoom', 'with');
  });

  // 3 ── كيف سأتعلم؟ ───────────────────────────────────────
  newSlide(); title('كيف سأتعلم ؟', 'sp_purple', C.purple, 5.6);
  img('be_atom.png', 0.5, 1.85, 4.6, 4.6, 'zoom', 'after', 900);
  const how = ['أتعرّف على مفهوم كلٍّ من التكافؤ وإلكترونات التكافؤ.', 'أكتب الترتيب الإلكتروني النقطي (تمثيل لويس).', 'أطبّق قاعدة الثمانية.'];
  how.forEach((t, i) => {
    const y = 2.0 + i * 1.5;
    box(5.6, y, 7.25, 1.22, { fill: C.white, tr: 5, rad: 0.5 }, 'flyR', 'after', 500);
    text(t, 5.75, y, 6.0, 1.22, { fontSize: 28, valign: 'middle', margin: 0 }, 'wipeR', 'with', 700, 150);
    ball(['sp_purple.png', 'sp_blue.png', 'sp_coral.png'][i], i + 1, 11.85, y + 0.11, 1.0, 'zoom', 'with');
  });

  // 4 ── الصورة الافتتاحية ──────────────────────────────────
  newSlide(); title('تأمّل الصورة الافتتاحية', 'sp_gold', C.gold, 6.4);
  box(0.4, 1.95, 7.4, 3.25, { fill: C.white, tr: 0, rad: 0.2 }, 'zoom', 'after', 700);
  img('ptable.png', 0.5, 2.05, 7.2, null, 'zoom', 'with', 800, 200);
  box(8.05, 1.8, 4.85, 5.15, { line: '7FB2D9', lw: 6, fill: C.white, rad: 0.15 }, 'fade', 'after', 500);
  text([br('تأمّل الصورة الافتتاحية للدرس، تظهر نقاط حول رموز العناصر في الجدول الدوري.', { color: C.navy })], 8.2, 1.9, 4.55, 1.65, { fontSize: 22 }, 'wipeR', 'after', 900);
  const qs = ['ماذا تمثّل هذه النقاط؟', 'وكيف نستطيع استنتاجها؟', 'ومن هو العالم الذي ابتكر هذه الطريقة؟', 'والسؤال الأهم كيف ستفيدنا في دراستنا للروابط الكيميائية؟'];
  const qy = [3.6, 4.15, 4.7, 5.6];
  qs.forEach((q, i) => text(q, 8.2, qy[i], 4.55, i === 3 ? 1.3 : 0.9, { fontSize: 22, color: [C.coral, C.blue, C.purple, C.teal][i] }, 'wipeR', 'click', 700));
  img('lewis_N.png', 0.9, 5.45, null, 1.2, 'float', 'after', 600);
  img('lewis_C.png', 3.2, 5.45, null, 1.2, 'float', 'with', 600, 150);
  img('lewis_F.png', 5.5, 5.45, null, 1.2, 'float', 'with', 600, 300);

  // 5 ── نشاط ───────────────────────────────────────────────
  newSlide(); title('نشاط...', 'sp_coral', C.coral, 4.2);
  img('bld_done.png', 3.35, 1.95, 2.85, null, 'flyL', 'after', 700);
  img('bld_wip.png', 0.4, 1.95, 2.85, null, 'flyL', 'after', 700);
  text('الصورة الأولى', 3.35, 4.95, 2.85, 0.5, { fontSize: 20, align: 'center', color: C.teal }, 'fade', 'after', 300);
  text('الصورة الثانية', 0.4, 4.95, 2.85, 0.5, { fontSize: 20, align: 'center', color: C.coral }, 'fade', 'with', 300);
  box(6.45, 1.8, 6.4, 5.05, { line: C.border, lw: 6, fill: C.white, rad: 0.4 }, 'zoom', 'after', 600);
  text('لديك صورتين:', 6.75, 1.95, 5.9, 0.6, { fontSize: 28, color: C.blue }, 'wipeR', 'after', 600);
  text('الصورة الأولى تمثل بناء مكتمل .', 6.75, 2.55, 5.9, 0.55, { fontSize: 24 }, 'wipeR', 'after', 700);
  text('الصورة الثانية تمثل بناء غير مكتمل.', 6.75, 3.1, 5.9, 0.55, { fontSize: 24 }, 'wipeR', 'after', 700);
  text('المطلوب:', 6.75, 3.7, 5.9, 0.55, { fontSize: 26, color: C.coral }, 'wipeR', 'after', 500);
  text('– أي البناءين يبدو أكثر استقرارًا؟ ...', 6.6, 4.25, 6.1, 0.55, { fontSize: 22 }, 'wipeR', 'click', 700);
  text('ما السبب؟ ...............', 6.6, 4.8, 6.1, 0.55, { fontSize: 22 }, 'wipeR', 'click', 700);
  text([br('ماذا يحتاج المبنى غير المكتمل ليصبح أكثر استقرارًا؟'), r('.............................................', { color: '7A8CA8' })], 6.75, 5.35, 5.9, 1.4, { fontSize: 24 }, 'wipeR', 'click', 900);
  img('sp_gold.png', 0.75, 5.6, 0.75, 0.75, 'zoom', 'after', 400);
  text('أي البناءين أكثر استقرارًا؟', 1.55, 5.6, 4.6, 0.75, { fontSize: 22, color: C.navy, valign: 'middle' }, 'fade', 'with', 500);

  // 6 ── الاستقرار وعناصر المجموعة 18 ───────────────────────
  newSlide(); title('الأشياء تميل إلى الاستقرار', 'sp_teal', C.teal, 7.2);
  box(0.45, 1.85, 12.4, 1.5, { fill: C.white, tr: 0, rad: 0.3 }, 'fade', 'after', 500);
  text([r('من خلال النشاط نجد أن الأشياء '), r('تميل إلى الاستقرار', { color: C.teal }), r(' حتى تكون مكتملة ومتوازنة. '), r('فهل ينطبق ذلك على ذرات العناصر أيضًا؟', { color: C.coral })],
    0.65, 1.92, 12.0, 1.38, { fontSize: 26, valign: 'middle' }, 'wipeR', 'after', 1100);
  text([r('وجد العلماء أن '), r('عناصر المجموعة (18)', { color: C.coral }), r(' تتمتع بتركيب إلكتروني يجعلها مستقرة، ولذلك لا تميل إلى التفاعل. أما معظم الذرات الأخرى فتسعى للوصول إلى هذا الاستقرار عن طريق '),
    r('فقد', { color: C.blue }), r(' أو '), r('اكتساب', { color: C.blue }), r(' أو '), r('مشاركة', { color: C.blue }), r(' الإلكترونات، '), r('ولكن هل جميع إلكترونات الذرة تشارك في هذا التغيير؟', { color: C.purple })],
    0.6, 3.5, 12.25, 1.95, { fontSize: 25 }, 'wipeR', 'click', 1500);
  img('noble.png', 2.2, 5.45, 9.0, null, 'flyB', 'after', 900);

  // 7 ── إلكترونات التكافؤ ──────────────────────────────────
  newSlide(); title('إلكترونات التكافؤ', 'sp_gold', C.gold, 6.0);
  img('carbon.png', 0.3, 1.9, 5.6, null, 'zoom', 'after', 900);
  text([r('في الحقيقة، لا .', { color: C.coral })], 6.2, 1.85, 6.65, 0.6, { fontSize: 28 }, 'wipeR', 'after', 600);
  text([r('إنّ '), br('إلكترونات التكافؤ', { color: C.gold }), br('Valence\u00A0Electrons', { color: C.gold }), r('والتي تعرّف بـ:')], 6.2, 2.45, 6.65, 1.35, { fontSize: 25, paraSpaceAfter: 0 }, 'wipeR', 'after', 900);
  box(6.2, 3.85, 6.65, 2.85, { fill: 'FFF7E0', line: 'F2C14E', lw: 3, rad: 0.3 }, 'zoom', 'after', 500);
  text('«الإلكترونات الموجودة في أعلى مستوى طاقة ممتلئ جزئيًا أو بشكل كامل بالإلكترونات في الذرة، وهي التي تستخدم في التفاعل والارتباط مع الذرات الأخرى».',
    6.4, 3.95, 6.3, 2.65, { fontSize: 26, valign: 'middle' }, 'wipeR', 'after', 1600);

  // 8 ── مستوى التكافؤ — شكل (24) ───────────────────────────
  newSlide(); title('مستوى التكافؤ', 'sp_blue', C.blue, 5.4);
  text([r('ويسمى «مستوى الطاقة الخارجي للذرة الذي تُفقد منه الإلكترونات أو تنتقل إليه في التفاعل الكيميائي» بـ '), r('مستوى التكافؤ Valence\u00A0Shell', { color: C.blue }), r(' ويوضح الشكل (24) كلًّا من إلكترونات التكافؤ ومستوى التكافؤ.')],
    6.55, 1.95, 6.3, 3.6, { fontSize: 26 }, 'wipeR', 'after', 1800);
  img('carbon.png', 2.3, 1.75, 4.6, null, 'zoom', 'after', 900);
  // labels like the book figure
  text([br('مستوى التكافؤ', { fontSize: 22 }), r('Valence\u00A0Shell', { fontSize: 16, color: C.blue })], 0.3, 1.9, 2.5, 1.05, { shape: pres.ShapeType.roundRect, rectRadius: 0.15, fill: { color: C.white }, line: { color: C.navy, width: 2 }, align: 'center', valign: 'middle', margin: 0, shadow: shadow() }, 'flyL', 'after', 600);
  cur.addShape(pres.ShapeType.line, reg({ x: 2.82, y: 2.2, w: 0.95, h: 0.18, line: { color: C.navy, width: 3, endArrowType: 'triangle' } }, 'fade', 'with', 400));
  text([br('إلكترونات التكافؤ', { fontSize: 22 }), r('Valence\u00A0Electrons', { fontSize: 16, color: C.gold })], 0.3, 4.5, 2.65, 1.05, { shape: pres.ShapeType.roundRect, rectRadius: 0.15, fill: { color: C.white }, line: { color: C.navy, width: 2 }, align: 'center', valign: 'middle', margin: 0, shadow: shadow() }, 'flyL', 'after', 600);
  cur.addShape(pres.ShapeType.line, reg({ x: 2.97, y: 5.02, w: 1.45, h: 0.14, line: { color: C.navy, width: 3, endArrowType: 'triangle' } }, 'fade', 'with', 400));
  text('شكل (24)', 3.2, 5.6, 2.8, 0.5, { fontSize: 20, align: 'center', color: C.blue }, 'fade', 'after', 400);
  box(6.55, 5.6, 6.3, 0.95, { fill: 'FFF7E0', rad: 0.47 }, 'flyB', 'after', 500);
  img('sp_gold.png', 12.0, 5.7, 0.75, 0.75, 'zoom', 'with', 400);
  text('النقاط الذهبية = إلكترونات التكافؤ', 6.7, 5.6, 5.2, 0.95, { fontSize: 22, valign: 'middle', color: C.navy }, 'wipeR', 'with', 600);

  // 9 ── التكافؤ ────────────────────────────────────────────
  newSlide(); title('التكافؤ Valency', 'sp_purple', C.purple, 5.4);
  text([r('ويُعرّف '), r('التكافؤ Valency', { color: C.purple }), r(' بأنه:')], 0.5, 1.9, 12.35, 0.7, { fontSize: 30 }, 'wipeR', 'after', 700);
  box(0.5, 2.65, 12.35, 1.65, { fill: 'F1EDFF', line: 'B9A8FF', lw: 3, rad: 0.3 }, 'zoom', 'after', 500);
  text('«عدد الإلكترونات التي تفقدها أو تكتسبها أو تشارك بها الذرّة للوصول إلى حالة الاستقرار الإلكتروني».', 0.75, 2.7, 11.9, 1.55, { fontSize: 30, valign: 'middle', align: 'center' }, 'wipeR', 'after', 1400);
  [['تفقد', 'sp_coral.png', C.coral], ['تكتسب', 'sp_blue.png', C.blue], ['تشارك', 'sp_teal.png', C.teal]].forEach(([t, f, c], i) => {
    const x = 9.0 - i * 3.9;
    img(f, x + 1.05, 4.55, 1.3, 1.3, 'zoom', 'after', 500);
    text(t, x, 5.9, 3.4, 0.6, { fontSize: 30, align: 'center', color: c }, 'fade', 'with', 400);
  });
  text('ولمعرفة الاختلاف بين التكافؤ وإلكترونات التكافؤ قم بحل التمرين التالي:', 1.8, 6.5, 11.05, 0.55, { fontSize: 22, color: C.teal }, 'fade', 'after', 600);

  // 10 ── تمرين (1) ─────────────────────────────────────────
  newSlide(); title('تمرين (1)', 'sp_coral', C.coral, 4.3);
  {
    const hd = t => cell(t, { fill: C.head, rtl: true, fs: 20 });
    const els = [[3, 'Li'], [4, 'Be'], [5, 'B'], [7, 'N'], [8, 'O'], [9, 'F']];
    const rows = [
      [...['1', '2', '13', '15', '16', '17'].map(t => cell(t, { fill: C.head })), hd('رقم المجموعة')],
      [...els.map(([z, s]) => cell(sub(z, s))), hd('العنصر')],
      [...els.map(() => cell('')), hd('الترتيب الإلكتروني حسب مستويات الطاقة الرئيسية')],
      [...els.map(() => cell('')), hd('إلكترونات التكافؤ')],
      [...els.map(() => cell('')), hd('التكافؤ')],
    ];
    const g = table(rows, 0.95, 2.0, [1.45, 1.45, 1.45, 1.45, 1.45, 1.45, 3.3], [0.82, 0.82, 1.0, 0.82, 0.82]);
    const conf = ['2,1', '2,2', '2,3', '2,5', '2,6', '2,7'], val = ['1', '2', '3', '5', '6', '7'], vy = ['1', '2', '3', '3', '2', '1'];
    conf.forEach((t, i) => ans(g, i, 2, t, i ? 'with' : 'click'));
    val.forEach((t, i) => ans(g, i, 3, t, i ? 'with' : 'click'));
    vy.forEach((t, i) => ans(g, i, 4, t, i ? 'with' : 'click'));
    clickHint(0.45, 6.65);
  }

  // 11 ── لاحظ أن ───────────────────────────────────────────
  newSlide(); title('لاحظ أن:', 'sp_coral', C.coral, 4.3);
  img('warn.png', 0.75, 1.95, 2.1, null, 'zoom', 'after', 700);
  box(3.3, 1.9, 9.55, 2.1, { fill: 'E3F2FC', rad: 0.25 }, 'flyR', 'after', 500);
  ball('sp_coral.png', 1, 11.95, 2.05, 0.75, 'zoom', 'with');
  text([r('عدم ذكر تكافؤ عناصر '), r('المجموعة (14)', { color: C.coral }), r(' والتي تشمل (الكربون، السيليكون، الجرمانيوم، القصدير، والرصاص) لأنه '), r('متغير وليس ثابت.', { color: C.blue })],
    3.45, 1.95, 8.4, 2.0, { fontSize: 25, valign: 'middle' }, 'wipeR', 'after', 1300);
  box(3.3, 4.25, 9.55, 2.5, { fill: 'E3F2FC', rad: 0.25 }, 'flyR', 'click', 500);
  ball('sp_blue.png', 2, 11.95, 4.4, 0.75, 'zoom', 'with');
  text([r('عدم ذكر تكافؤ عناصر '), r('المجموعة (18)', { color: C.coral }), r(' والتي تشمل (الهيليوم، النيون، الآرجون، والكريبتون) لأن مستوى الطاقة الرئيسي الخارجي لها '), r('مستقر وممتلئ بالإلكترونات', { color: C.blue }), r('، لذلك لا تميل إلى فقد أو اكتساب أو مشاركة الإلكترونات.')],
    3.45, 4.3, 8.4, 2.4, { fontSize: 25, valign: 'middle' }, 'wipeR', 'after', 1500);
  img('noble.png', 0.4, 5.0, 2.75, null, 'fade', 'with', 600);

  // 12 ── تمثيل لويس ────────────────────────────────────────
  newSlide(); title('تمثيل لويس', 'sp_teal', C.teal, 5.0);
  text([r('الترتيب الإلكتروني النقطي ', { color: C.teal }), br('Electron\u00A0Dot\u00A0Structure', { color: C.blue }), r('(تمثيل لويس) ', { color: C.teal }), r('Lewis\u00A0Structure', { color: C.blue })],
    0.5, 1.75, 12.35, 1.05, { fontSize: 26, paraSpaceAfter: 0 }, 'wipeR', 'after', 1000);
  text('يمكن تمثيل إلكترونات التكافؤ بنقاط حول ذرة العنصر، وهي طريقة ابتكرها العالم جلبرت لويس.', 0.5, 2.85, 12.35, 0.85, { fontSize: 26 }, 'wipeR', 'after', 1200);
  box(4.75, 3.95, 8.1, 2.7, { fill: 'E6F7F4', line: '7FD3C6', lw: 3, rad: 0.3 }, 'zoom', 'after', 500);
  text([r('وتعرّف '), r('الترتيبات الإلكترونية النقطية', { color: C.teal }), r(' بأنها « الأشكال التي توضّح إلكترونات التكافؤ في صورة نقاط على رمز ذرة العنصر».')],
    4.95, 4.0, 7.7, 2.6, { fontSize: 27, valign: 'middle' }, 'wipeR', 'after', 1500);
  img('lewis_N.png', 0.55, 3.95, null, 1.3, 'zoom', 'after', 500);
  img('lewis_C.png', 2.55, 3.95, null, 1.3, 'zoom', 'after', 500);
  img('lewis_F.png', 1.5, 5.35, null, 1.3, 'zoom', 'after', 500);

  // 13 ── مثال (1) ──────────────────────────────────────────
  newSlide(); title('مثال (1)', 'sp_blue', C.blue, 4.3);
  box(0.45, 1.8, 12.4, 4.95, { line: 'A9D6F2', lw: 6, fill: 'EEF8FF', rad: 0.4 }, 'zoom', 'after', 600);
  text('وضّح الترتيب الإلكتروني النقطي لذرة البريليوم', 4.75, 1.98, 7.9, 0.7, { fontSize: 24, color: C.blue }, 'wipeR', 'after', 900);
  text(sub(4, 'Be', { color: C.white }), 3.35, 2.0, 1.3, 0.65, { fontSize: 28, align: 'center', valign: 'middle', rtlMode: false, margin: 0, shape: pres.ShapeType.roundRect, rectRadius: 0.32, fill: { color: C.blue } }, 'zoom', 'after', 500);
  img('be_photo.png', 0.75, 2.0, 2.3, 2.3, 'flyL', 'with', 700);
  text('الحـل:', 4.0, 2.88, 8.65, 0.6, { fontSize: 28, color: C.coral }, 'fade', 'after', 400);
  text('1 – نكتب الترتيب الإلكتروني حسب مستويات الطاقة الرئيسية (2,2).', 4.0, 3.45, 8.65, 1.0, { fontSize: 26 }, 'wipeR', 'click', 1100);
  img('be_atom.png', 0.75, 4.35, 2.3, 2.3, 'zoom', 'with', 700);
  text('2 – نكتب رمز العنصر ونمثّل إلكترونات التكافؤ حوله بنقاط كالتالي:', 6.1, 4.55, 6.55, 1.1, { fontSize: 26 }, 'wipeR', 'click', 1100);
  box(3.5, 4.5, 2.4, 1.6, { fill: C.white, rad: 0.25 }, 'zoom', 'after', 400);
  img('lewis_Be.png', 3.65, 4.6, 2.1, null, 'zoom', 'with', 600, 200);

  // 14 ── تمرين (2) ─────────────────────────────────────────
  newSlide(); title('تمرين (2)', 'sp_coral', C.coral, 4.3);
  text('أكمل الجدول التالي:', 7.0, 1.75, 5.85, 0.6, { fontSize: 28, color: C.blue }, 'wipeR', 'after', 600);
  {
    const hd = t => cell(t, { fill: C.head, rtl: true, fs: 22 });
    const rows = [
      [cell(sub(19, 'K'), { fill: C.head, fs: 28 }), cell(sub(7, 'N'), { fill: C.head, fs: 28 }), cell(sub(6, 'C'), { fill: C.head, fs: 28 }), cell(sub(1, 'H'), { fill: C.head, fs: 28 }), hd('الذرة')],
      [cell(''), cell(''), cell('2 , 4', { fs: 28 }), cell(''), hd('الترتيب الإلكتروني حسب المستويات الرئيسية')],
      [cell(''), cell(''), cell(''), cell(''), hd('الترتيب النقطي')],
    ];
    const g = table(rows, 1.05, 2.75, [1.95, 1.95, 1.95, 1.95, 3.45], [0.95, 1.15, 1.85]);
    ansImg(g, 2, 2, 'lewis_C.png', 'with');
    ansImg(g, 3, 2, 'lewis_H.png', 'with', 0.55);
    ans(g, 3, 1, '1', 'click', 28); ans(g, 1, 1, '2 , 5', 'with', 28); ans(g, 0, 1, '2 , 8 , 8 , 1', 'with', 26);
    ansImg(g, 1, 2, 'lewisA_N.png', 'click'); ansImg(g, 0, 2, 'lewisA_K.png', 'with', 0.6);
    clickHint(0.45, 6.65);
  }

  // 15 ── قاعدة الثمانية: الغازات النبيلة ─────────────────────
  newSlide(); title('قاعدة الثمانية', 'sp_gold', C.gold, 5.4);
  text([r('كما تعلمت في دراستك للجدول الدوري، أنّ '), r('الغازات النبيلة مستقرة', { color: C.coral }), r(' وينتهي ترتيبها الإلكتروني حسب مستويات الطاقة الرئيسية '), r('بثمانية إلكترونات', { color: C.gold }),
    r(' ، ماعدا '), r('الهيليوم', { color: C.teal }), r(' ينتهي '), r('بإلكترونين فقط.', { color: C.teal })],
    0.5, 1.85, 12.35, 1.7, { fontSize: 27 }, 'wipeR', 'after', 1700);
  img('octet.png', 6.7, 3.4, 3.45, 3.45, 'zoom', 'click', 900);
  text([r('8e'), r('−', { superscript: true })], 10.2, 4.6, 1.8, 0.9, { fontSize: 44, color: C.gold, rtlMode: false, align: 'center' }, 'zoom', 'after', 500);
  img('helium.png', 1.85, 3.5, 3.1, 3.1, 'zoom', 'after', 900);
  text([r('2e'), r('−', { superscript: true })], 0.4, 4.6, 1.5, 0.9, { fontSize: 44, color: C.teal, rtlMode: false, align: 'center' }, 'zoom', 'after', 500);
  text('الهيليوم', 2.15, 6.45, 2.5, 0.5, { fontSize: 22, align: 'center', color: C.teal }, 'fade', 'with', 400);

  // 16 ── الكاتيون والأنيون ─────────────────────────────────
  newSlide(); title('الكاتيون والأنيون', 'sp_purple', C.purple, 6.0);
  text('تساعد هذه القاعدة في تحديد نوع الأيون الذي تنتجه ذرة العنصر.', 0.5, 1.8, 12.35, 0.65, { fontSize: 27 }, 'wipeR', 'after', 1000);
  [[6.75, 'FFE8EE', 'F7A1B7', 'sp_coral.png', '+', C.coral,
    [r('فذرات العناصر التي تميل إلى '), r('فقد', { color: C.coral }), r(' الإلكترونات تُنتج أيونات موجبة (كاتيونات)، ليصبح ترتيبها الإلكتروني مشابه للغاز النبيل.')],
    [r('الكاتيون', { color: C.coral }), r(': «ذرة العنصر عندما تفقد إلكترونًا أو أكثر».')], 'after'],
   [0.5, 'E5F0FF', '9DC2F5', 'sp_blue.png', '−', C.blue,
    [r('بينما ذرات العناصر التي تميل إلى '), r('اكتساب', { color: C.blue }), r(' الإلكترونات تُنتج أيونات سالبة (أنيونات)، ليصبح ترتيبها الإلكتروني مشابه للغاز النبيل.')],
    [r('الأنيون', { color: C.blue }), r(': «ذرة العنصر عندما تكتسب إلكترونًا أو أكثر».')], 'click']].forEach(([x, f, l, sp, sign, col, t1, t2, trig]) => {
    box(x, 2.65, 6.1, 4.15, { fill: f, line: l, lw: 3, rad: 0.3 }, 'flyB', trig, 600);
    img(sp, x + 2.55, 2.4, 1.0, 1.0, 'zoom', 'with', 500, 200);
    text(sign, x + 2.55, 2.42, 1.0, 0.92, { fontSize: 44, color: C.white, align: 'center', valign: 'middle', rtlMode: false, margin: 0 }, 'zoom', 'with', 500, 200);
    text(t1, x + 0.2, 3.45, 5.7, 1.85, { fontSize: 23 }, 'wipeR', 'after', 1200);
    text(t2, x + 0.2, 5.3, 5.7, 1.4, { fontSize: 24, shape: pres.ShapeType.roundRect, rectRadius: 0.2, fill: { color: C.white }, valign: 'middle', margin: 8 }, 'zoom', 'after', 600);
  });

  // 17 ── جدول (12) ─────────────────────────────────────────
  newSlide(); title('ذرة العنصر والأيون', 'sp_teal', C.teal, 6.0);
  [[6.85, 'ذرة الصوديوم', sub(11, 'Na : 2,8,1'), 'na_atom.png', 'كاتيون الصوديوم', [r('Na'), r('+', { superscript: true }), r(' : 2,8')], 'na_ion.png', 'تفقد إلكترونًا', C.coral, 'after'],
   [0.45, 'ذرة الكلور', sub(17, 'Cl : 2,8,7'), 'cl_atom.png', 'أنيون الكلوريد', [r('Cl'), r('−', { superscript: true }), r(' : 2,8,8')], 'cl_ion.png', 'تكتسب إلكترونًا', C.blue, 'click']]
    .forEach(([x, n1, c1, i1, n2, c2, i2, lab, col, trig]) => {
      box(x, 1.8, 6.0, 4.75, { fill: C.white, tr: 10, rad: 0.3 }, 'fade', trig, 500);
      img(i1, x + 0.1, 1.85, 2.2, 2.2, 'zoom', 'after', 700);
      text(n1, x + 2.4, 2.0, 3.45, 0.6, { fontSize: 26, color: C.navy, align: 'center' }, 'fade', 'with', 500);
      text(c1, x + 2.4, 2.65, 3.45, 0.7, { fontSize: 30, color: C.navy, align: 'center', rtlMode: false, shape: pres.ShapeType.roundRect, rectRadius: 0.15, fill: { color: C.head } }, 'zoom', 'with', 500);
      text([r(lab, { color: col }), r('  ▼', { color: col })], x + 2.4, 3.6, 3.45, 0.55, { fontSize: 22, align: 'center' }, 'flyB', 'after', 600);
      img(i2, x + 0.1, 4.25, 2.2, 2.2, 'zoom', 'after', 700);
      text(n2, x + 2.4, 4.4, 3.45, 0.6, { fontSize: 26, color: col, align: 'center' }, 'fade', 'with', 500);
      text(c2, x + 2.4, 5.05, 3.45, 0.7, { fontSize: 30, color: C.navy, align: 'center', rtlMode: false, shape: pres.ShapeType.roundRect, rectRadius: 0.15, fill: { color: C.head } }, 'zoom', 'with', 500);
    });
  text([r('جدول (12) ', { color: C.blue }), r('يوضح الفرق بين الترتيب الإلكتروني لذرة العنصر والأيون')], 1.6, 6.62, 10.1, 0.5, { fontSize: 18, align: 'center' }, 'fade', 'after', 500);

  // 18 ── نص قاعدة الثمانية ─────────────────────────────────
  newSlide(); title('قاعدة الثمانية', 'sp_gold', C.gold, 5.4);
  text([r('نلاحظ من خلال الجدول رقم (12) أن الترتيب الإلكتروني لـ'), r('كاتيون الصوديوم', { color: C.coral }), r(' مشابه للترتيب الإلكتروني لغاز '), r('النيون', { color: C.coral }), r(' (غاز نبيل) والترتيب الإلكتروني لـ'), r('أنيون الكلوريد', { color: C.blue }), r(' مشابه للترتيب الإلكتروني لغاز '), r('الأرجون', { color: C.blue }), r(' (غاز نبيل)، وتؤدّي هذه الملاحظة إلى أحد القواعد الكيميائية، وهي قاعدة الثمانية:')],
    4.0, 1.8, 8.85, 2.85, { fontSize: 23 }, 'wipeR', 'after', 1800);
  img('octet.png', 0.45, 1.75, 3.3, 3.3, 'zoom', 'after', 900);
  box(0.5, 4.8, 12.35, 1.95, { fill: 'FFF4D6', line: 'F2C14E', lw: 4, rad: 0.35 }, 'zoom', 'click', 600);
  img('sp_gold.png', 11.6, 4.55, 1.1, 1.1, 'zoom', 'with', 500, 200);
  text('8', 11.6, 4.58, 1.1, 1.0, { fontSize: 36, color: C.white, align: 'center', valign: 'middle', rtlMode: false, margin: 0 }, 'zoom', 'with', 500, 200);
  text([r('قاعدة الثمانية', { color: C.gold }), r(' تنص على: «ميل ذرة العنصر إلى فقد أو اكتساب أو مشاركة إلكترونات مستوى التكافؤ للوصول إلى ثماني إلكترونات لتحقيق حالة الاستقرار المشابهة للغاز النبيل».')],
    0.75, 4.85, 10.7, 1.85, { fontSize: 24, valign: 'middle' }, 'wipeR', 'after', 1800);

  // 19 ── تمرين (3) ─────────────────────────────────────────
  newSlide(); title('تمرين (3)', 'sp_coral', C.coral, 4.3);
  text('أكمل الجدول التالي:', 7.0, 1.75, 5.85, 0.6, { fontSize: 28, color: C.blue }, 'wipeR', 'after', 600);
  {
    const hd = t => cell(t, { fill: C.head, rtl: true, fs: 21 });
    const rows = [
      [hd('قاعدة الثمانية (يحقق / لا يحقق)'), hd('للوصول للاستقرار (يفقد/ يكتسب) إلكترونات'), hd('الترتيب الإلكتروني النقطي'), hd('العنصر')],
      [cell(''), cell(''), cell(''), cell(sub(3, 'Li'), { fill: C.head, fs: 28 })],
      [cell(''), cell(''), cell(''), cell(sub(9, 'F'), { fill: C.head, fs: 28 })],
      [cell(''), cell(''), cell(''), cell(sub(12, 'Mg'), { fill: C.head, fs: 28 })],
    ];
    const g = table(rows, 0.95, 2.7, [3.4, 3.6, 2.9, 1.5], [1.0, 1.05, 1.05, 1.05]);
    ansImg(g, 2, 1, 'lewisA_Li.png', 'click', 0.7); ans(g, 1, 1, 'يفقد 1', 'with'); ans(g, 0, 1, 'لا يحقق', 'with');
    ansImg(g, 2, 2, 'lewisA_F.png', 'click', 0.9); ans(g, 1, 2, 'يكتسب 1', 'with'); ans(g, 0, 2, 'يحقق', 'with');
    ansImg(g, 2, 3, 'lewisA_Mg.png', 'click', 0.7); ans(g, 1, 3, 'يفقد 2', 'with'); ans(g, 0, 3, 'يحقق', 'with');
    clickHint(0.45, 6.75);
  }

  // 20 ── استثناءات قاعدة الثمانية ──────────────────────────
  newSlide(); title('استثناءات قاعدة الثمانية', 'sp_purple', C.purple, 7.0);
  [['الهيدروجين', 1, 'H', '1', 'FFD9E2', C.coral], ['الليثيوم', 3, 'Li', '2,1', 'FFE6CC', 'D9730D'], ['البريليوم', 4, 'Be', '2,2', 'FFF1BF', C.gold], ['البورون', 5, 'B', '2,3', 'D8F3E6', C.green]].forEach(([nm, z, s, cf, f, col], i) => {
    const x = 9.85 - i * 3.1;
    box(x, 1.9, 2.85, 2.65, { fill: f, rad: 0.3 }, 'flyB', 'after', 500);
    text(sub(z, s, { color: col }), x, 1.95, 2.85, 1.2, { fontSize: 60, align: 'center', valign: 'middle', rtlMode: false, margin: 0 }, 'zoom', 'with', 500, 150);
    text(nm, x, 3.1, 2.85, 0.6, { fontSize: 26, align: 'center' }, 'fade', 'with', 400, 250);
    text(cf, x + 0.5, 3.7, 1.85, 0.6, { fontSize: 28, align: 'center', rtlMode: false, shape: pres.ShapeType.roundRect, rectRadius: 0.15, fill: { color: C.white } }, 'zoom', 'with', 400, 300);
  });
  box(3.2, 4.85, 9.65, 1.85, { fill: C.white, line: 'B9A8FF', lw: 3, rad: 0.3 }, 'fade', 'click', 500);
  text([r('العناصر السابقة '), r('لا تحقق قاعدة الثمانية', { color: C.purple }), r(' عندما تفقد إلكترونات التكافؤ، لأنها تستقر بإلكترونين فقط لتشابه أقرب غاز نبيل لها وهو الهيليوم .')],
    3.4, 4.9, 9.3, 1.75, { fontSize: 24, valign: 'middle' }, 'wipeR', 'after', 1600);
  img('helium.png', 0.45, 4.3, 2.6, 2.6, 'zoom', 'after', 800);
  text(sub(2, 'He', { color: C.white }), 1.1, 6.35, 1.3, 0.6, { fontSize: 26, align: 'center', valign: 'middle', rtlMode: false, margin: 0, shape: pres.ShapeType.roundRect, rectRadius: 0.3, fill: { color: C.teal } }, 'zoom', 'with', 500);

  // 21 ── تحقق مما تعلمت ────────────────────────────────────
  newSlide(); title('تحقق مما تعلمت', 'sp_green', C.green, 5.6);
  {
    const hd = t => cell(t, { fill: C.head, rtl: true, fs: 20 });
    const rows = [
      [hd('الترتيب الإلكتروني النقطي'), hd('التكافؤ'), hd('عدد إلكترونات التكافؤ'), hd('الترتيب الإلكتروني حسب مستويات الطاقة الرئيسية'), hd('العنصر')],
      [cell(''), cell(''), cell(''), cell(''), cell(sub(7, 'N'), { fill: C.head, fs: 28 })],
      [cell(''), cell(''), cell(''), cell(''), cell(sub(16, 'S'), { fill: C.head, fs: 28 })],
      [cell(''), cell(''), cell(''), cell(''), cell(sub(20, 'Ca'), { fill: C.head, fs: 28 })],
    ];
    text('أكمل الجدول التالي:', 4.0, 1.75, 5.85, 0.6, { fontSize: 26, color: C.blue }, 'wipeR', 'after', 600);
    const g = table(rows, 0.9, 2.6, [2.9, 1.5, 2.3, 3.55, 1.35], [1.05, 1.05, 1.05, 1.05]);
    const data = [['lewisA_N.png', '3', '5', '2 , 5'], ['lewisA_S.png', '2', '6', '2 , 8 , 6'], ['lewisA_Ca.png', '2', '2', '2 , 8 , 8 , 2']];
    data.forEach(([f, v, ve, cf], i) => { ans(g, 3, i + 1, cf, 'click'); ans(g, 2, i + 1, ve); ans(g, 1, i + 1, v); ansImg(g, 0, i + 1, f, 'with', i === 2 ? 0.6 : 0.9); });
    clickHint(0.45, 6.75);
  }
  badge('badge_check.png');

  // 22 ── إضاءات ────────────────────────────────────────────
  newSlide(); title('إضاءات', 'sp_blue', C.blue, 4.0);
  badge('badge_light.png');
  box(0.45, 1.8, 12.4, 5.0, { fill: 'DDF0FC', rad: 0.3, noShadow: false }, 'fade', 'after', 500);
  img('lewis_photo.png', 0.7, 2.1, 4.1, 4.1, 'flyL', 'after', 900);
  text([r('يعدّ العالم الأمريكي '), r('جلبرت نيوتن لويس (Gilbert\u00A0N.\u00A0Lewis)', { color: C.blue }), r(' من روّاد علم الكيمياء الحديثة. وُلِد عام 1875م، واشتهر بإسهاماته في دراسة الروابط الكيميائية وإلكترونات التكافؤ.')],
    5.0, 1.9, 7.7, 2.05, { fontSize: 22 }, 'wipeR', 'after', 1500);
  text([r('ومن أبرز إنجازاته '), r('ابتكار تمثيل لويس', { color: C.teal }), r(' الذي يستخدم النقاط حول رمز العنصر لتمثيل إلكترونات التكافؤ، مما سهّل فهم كيفية ارتباط الذرات وتكوين المركبات الكيميائية. وقد أسهمت أفكار لويس في تطوير مفاهيم مهمة ما زالت تُدرَّس في المناهج العلمية حتى اليوم، لذلك يُعد من أكثر العلماء تأثيرًا في تعليم الكيمياء وفهم سلوك العناصر.')],
    5.0, 3.95, 7.7, 2.8, { fontSize: 20 }, 'wipeR', 'click', 1800);

  // 23-25 ── أنت الكيميائي ──────────────────────────────────
  newSlide(); title('أنت الكيميائي', 'sp_teal', C.teal, 5.2);
  badge('badge_chem.png');
  text('السؤال الأول: اكتب المصطلح العلمي الذي تدل عليه كل عبارة من العبارات الآتية :', 0.5, 1.8, 12.35, 1.0, { fontSize: 24, color: C.blue }, 'wipeR', 'after', 1000);
  {
    const hd = t => cell(t, { fill: C.head, rtl: true, fs: 24 });
    const rows = [
      [hd('المصطلح'), hd('العبارة'), hd('م')],
      [cell(''), cell('عدد الإلكترونات التي تفقدها أو تكتسبها أو تشارك بها الذرّة للوصول إلى حالة الاستقرار الإلكتروني.', { rtl: true, fs: 23, extra: { align: 'right' } }), cell('1', { fs: 26 })],
      [cell(''), cell('الأشكال التي توضّح إلكترونات التكافؤ في صورة نقاط على رمز ذرة العنصر.', { rtl: true, fs: 23, extra: { align: 'right' } }), cell('2', { fs: 26 })],
    ];
    const g = table(rows, 0.85, 3.15, [3.4, 7.3, 0.9], [0.7, 1.45, 1.45]);
    ans(g, 0, 1, 'التكافؤ', 'click', 26); ans(g, 0, 2, 'الترتيب الإلكتروني النقطي (تمثيل لويس)', 'click', 21);
    clickHint(0.45, 6.75);
  }

  newSlide(); title('أنت الكيميائي', 'sp_teal', C.teal, 5.2);
  badge('badge_chem.png');
  text('السؤال الثاني: اختر الإجابة الصحيحة لكل عبارة من العبارات الآتية وذلك بوضع علامة (✓) في المربع المقابل لها:', 0.5, 1.8, 12.35, 1.0, { fontSize: 24, color: C.blue }, 'wipeR', 'after', 1200);
  const mcq = (y, q, opts, correct) => {
    box(0.5, y, 12.35, 1.95, { fill: C.white, tr: 5, rad: 0.3 }, 'fade', 'after', 400);
    text(q, 0.75, y + 0.1, 11.9, 0.65, { fontSize: 25 }, 'wipeR', 'after', 900);
    opts.forEach((o, i) => {
      const x = 10.3 - i * 3.1;
      text(o.concat([r(' ❏', { color: '7A8CA8' })]), x, y + 0.9, 2.5, 0.8, { fontSize: 30, align: 'center', valign: 'middle', rtlMode: false }, 'zoom', 'after', 350);
    });
    const x = 10.3 - correct * 3.1;
    text('✓', x, y + 0.82, 0.95, 0.9, { fontSize: 40, color: C.white, align: 'center', valign: 'middle', shape: pres.ShapeType.ellipse, fill: { color: C.green }, rtlMode: false, margin: 0 }, 'zoom', 'click', 500);
    box(x + 0.15, y + 0.85, 2.3, 0.86, { fill: C.green, tr: 85, line: C.green, lw: 3, rad: 0.43, noShadow: true }, 'fade', 'with', 500);
  };
  mcq(2.8, '1 – عدد إلكترونات التكافؤ لعنصر يقع في المجموعة (17):', [[r('0')], [r('1')], [r('3')], [r('7')]], 3);
  mcq(4.9, '2 – أحد الذرات التالية تصل للاستقرار عن طريق فقد إلكترونين:', [sub(16, 'S'), sub(19, 'K'), sub(12, 'Mg'), sub(9, 'F')], 2);

  newSlide(); title('أنت الكيميائي', 'sp_teal', C.teal, 5.2);
  badge('badge_chem.png');
  text('السؤال الثالث: أجب عما يلي:', 0.5, 1.8, 12.35, 0.7, { fontSize: 28, color: C.blue }, 'wipeR', 'after', 800);
  box(4.6, 2.55, 8.25, 2.1, { fill: C.white, rad: 0.3 }, 'fade', 'after', 400);
  text('إذا كان الترتيب الإلكتروني النقطي لأحد العناصر المُمَثِّلة يحتوي على ثلاثة نقاط فقط حول الرمز، فكيف يمكنك استخدام هذه المعلومة للتنبؤ بعدد الإلكترونات في مستوى التكافؤ – رقم المجموعة – عدد الإلكترونات المفقودة أو المكتسبة؟',
    4.8, 2.6, 7.9, 2.0, { fontSize: 23, valign: 'middle' }, 'wipeR', 'after', 1800);
  img('sp_purple.png', 1.0, 2.35, 2.6, 2.6, 'zoom', 'after', 700);
  text('X', 1.0, 2.35, 2.6, 2.6, { fontSize: 80, color: C.white, align: 'center', valign: 'middle', rtlMode: false, margin: 0 }, 'zoom', 'with', 700);
  [[1.0 + 1.3 - 0.15, 2.05], [3.75, 3.5], [0.6, 3.5]].forEach(([x, y]) => img('sp_coral.png', x, y, 0.32, 0.32, 'zoom', 'after', 300));
  [['عدد الإلكترونات في مستوى التكافؤ', '3'], ['رقم المجموعة', '13'], ['عدد الإلكترونات المفقودة', '3']].forEach(([k, v], i) => {
    const x = 8.85 - i * 4.15;
    box(x, 5.0, 4.0, 1.55, { fill: 'E7F7EF', line: '7CCFA6', lw: 3, rad: 0.3 }, 'flyB', 'click', 500);
    text(k, x + 0.1, 5.05, 3.8, 0.8, { fontSize: 20, align: 'center', valign: 'middle' }, 'fade', 'with', 400);
    text(v, x + 0.1, 5.75, 3.8, 0.75, { fontSize: 36, align: 'center', valign: 'middle', color: C.green, rtlMode: false }, 'zoom', 'with', 500, 200);
  });

  await pres.writeFile({ fileName: OUT });
  fs.writeFileSync(OUT.replace(/\.pptx$/, '.anim.json'), JSON.stringify(ANIM, null, 1));
  console.log('written', OUT, ANIM.length, 'slides');
}
build();
