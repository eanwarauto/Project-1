// عرض تقديمي: الدرس [3-1] خواص المركبات الأيونية
const pptxgen = require('pptxgenjs');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const A = p => path.join(__dirname, 'assets', p);
const OUT = process.argv[2] || path.join(__dirname, 'deck3.pptx');
const C = {
  navy: '16325C', blue: '1F6FB2', sky: '3FA7D6', teal: '0F9D8E', coral: 'E8335F', gold: 'E59A00',
  purple: '6C4FE0', green: '0B8A5A', head: 'D6ECFA', border: '8FB1DA', white: 'FFFFFF', soft: 'F3F9FF',
};
const FONT = 'Arial';
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5
pres.rtlMode = true;
pres.title = 'خواص المركبات الأيونية';
pres.theme = { headFontFace: FONT, bodyFontFace: FONT };
pres.defineSlideMaster({ title: 'TITLE', background: { path: A('bg_title.png') } });
pres.defineSlideMaster({ title: 'CONTENT', background: { path: A('bg_content3.png') } });

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

function chip(runs, x, y, w, h, fill, fx = 'zoom', trig = 'after', fs = 28) {
  text(runs, x, y, w, h, { fontSize: fs, color: C.white, align: 'center', valign: 'middle', rtlMode: false, margin: 0,
    shape: pres.ShapeType.roundRect, rectRadius: h / 2, fill: { color: fill }, shadow: shadow() }, fx, trig, 500);
}
const sup = (s, t, o = {}) => [r(s, o), r(t, { superscript: true, ...o })];
// 'Mg3N2' -> runs with subscript digits
const fm = (f, o = {}) => f.match(/[A-Z][a-z]?|\d+/g).map(t => /\d/.test(t) ? r(t, { subscript: true, ...o }) : r(t, o));
const dots = n => r('.'.repeat(n), { color: '9AAAC0' });
const greenChip = (t, x, y, w, h = 0.6, trig = 'click', fs = 22) =>
  text(t, x, y, w, h, { fontSize: fs, color: C.white, align: 'center', valign: 'middle', margin: 0, rtlMode: /[؀-ۿ]/.test(typeof t === 'string' ? t : ''), shape: pres.ShapeType.roundRect, rectRadius: h / 2, fill: { color: C.green }, shadow: shadow() }, 'zoom', trig, 500);

async function build() {
  await loadDims();

  // 1 ── الغلاف ────────────────────────────────────────────
  newSlide('TITLE');
  img('lattice_big.png', 0.35, 1.05, 5.4, 5.4, 'zoom', 'after', 1100);
  text('الدرس [\u200E3-1]', 9.6, 1.1, 3.1, 0.75, { shape: pres.ShapeType.roundRect, rectRadius: 0.37, fill: { color: C.teal }, color: C.white, fontSize: 28, align: 'center', valign: 'middle', shadow: shadow(), margin: 0 }, 'flyR', 'after', 700);
  text([br('خواص المركبات'), r('الأيونية')], 5.6, 1.95, 7.2, 2.4, { fontSize: 64, color: C.navy, valign: 'middle', margin: 0, paraSpaceAfter: 0, lineSpacingMultiple: 0.95 }, 'wipeR', 'after', 1300);
  text('(الكشف عن المركبات الأيونية)', 5.6, 4.35, 7.2, 0.7, { fontSize: 30, color: C.blue, margin: 0 }, 'float', 'after', 800);
  text('النشاط العملي الأول', 8.3, 5.2, 4.5, 0.7, { fontSize: 26, color: C.white, align: 'center', valign: 'middle', margin: 0, shape: pres.ShapeType.roundRect, rectRadius: 0.35, fill: { color: C.coral }, shadow: shadow() }, 'zoom', 'after', 600);
  img('beaker.png', 6.6, 4.9, null, 2.2, 'flyB', 'after', 800);

  // 2 ── بطاقة النشاط ─────────────────────────────────────
  newSlide(); title('النشاط العملي الأول', 'sp_coral', C.coral, 6.2);
  {
    const hd = t => cell(t, { fill: C.head, rtl: true, fs: 24 });
    const bd = t => cell(t, { rtl: true, fs: 22, extra: { align: 'right' } });
    const rows = [
      [cell('الكشف عن المركبات الأيونية عن طريق التجربة العملية', { fill: C.head, rtl: true, fs: 24 }), hd('الهدف من النشاط')],
      [bd('الملاحظة – تسجيل البيانات – المقارنة – التمييز – الاستنتاج – العمل الجماعي والتعاوني'), hd('المهارات المكتسبة')],
      [bd('عينة (A,B) – كأس زجاجية 150 mL – ميزان إلكتروني – دائرة كهربائية باستخدام أقطاب الكربون – عبوة ماء مقطر – ساق زجاجية – ملعقة معدنية – ورق شفّاف'), hd('أدوات النشاط')],
      [bd('نظارات واقية – قفازات – معطف المختبر'), hd('الأمن والسلامة')],
    ];
    table(rows, 2.75, 2.0, [7.1, 3.0], [0.75, 1.05, 1.6, 0.75]);
    img('beaker.png', 0.35, 2.2, null, 3.9, 'flyL', 'after', 800);
  }

  // 3-4 ── خطوات العمل ─────────────────────────────────────
  newSlide(); title('خطوات العمل', 'sp_blue', C.blue, 5.0);
  text('أمامك عينتين لهما الرمز (A, B) والمطلوب:', 4.0, 1.85, 8.85, 0.65, { fontSize: 27, color: C.blue }, 'wipeR', 'after', 900);
  const steps1 = ['انظر إلى العينات التي أمامك وحدد الحالة الفيزيائية لكل منها.', 'خذ كأسين زجاجيتين وسجّل عليهما رموز العينات كالتالي: الكأس الأول: سجّل عليه الرمز (A)، الكأس الثاني: سجّل عليه الرمز (B)', 'زِن كتلة (.....g) من العينات باستخدام الميزان الإلكتروني وانقلها إلى الكأس الزجاجي الخاص به.'];
  [2.65, 3.75, 5.3].forEach((y, i) => {
    box(4.0, y, 8.85, i === 1 ? 1.4 : 1.0, { fill: C.white, tr: 5, rad: 0.3 }, 'flyR', 'click', 500);
    ball(['sp_blue.png', 'sp_teal.png', 'sp_purple.png'][i], i + 1, 12.05, y + (i === 1 ? 0.33 : 0.13), 0.72, 'zoom', 'with');
    text(steps1[i], 4.15, y, 7.8, i === 1 ? 1.4 : 1.0, { fontSize: 22, valign: 'middle', margin: 0 }, 'wipeR', 'with', 1000, 150);
  });
  img('beaker.png', 0.6, 2.4, null, 2.9, 'zoom', 'after', 700);
  img('beaker.png', 2.05, 3.1, null, 2.9, 'zoom', 'with', 700, 200);
  chip('A', 0.95, 5.95, 0.9, 0.6, C.purple, 'zoom', 'after');
  chip('B', 2.4, 6.15, 0.9, 0.6, C.teal, 'zoom', 'with');

  newSlide(); title('خطوات العمل', 'sp_blue', C.blue, 5.0);
  const steps2 = ['أذِب الكتلة الموزونة لكل عينة في الكأس المخصص لها باستخدام الماء المقطر. هل تذوب العينة في الماء المقطر وتكوّن محلولًا؟ سجّل مشاهدتك في الجدول.',
    'باستخدام الدائرة الكهربائية التي أمامك، ضع قطبيّ الكربون في الكأس (A). هل يوصّل المحلول التيار الكهربائي؟ سجّل مشاهدتك في الجدول.', 'كرّر الخطوة رقم 5 للكأس (B).'];
  [1.9, 3.55, 5.2].forEach((y, i) => {
    box(4.0, y, 8.85, i === 2 ? 0.95 : 1.45, { fill: C.white, tr: 5, rad: 0.3 }, 'flyR', i ? 'click' : 'after', 500);
    ball(['sp_coral.png', 'sp_gold.png', 'sp_green.png'][i], i + 4, 12.05, y + (i === 2 ? 0.12 : 0.36), 0.72, 'zoom', 'with');
    text(steps2[i], 4.15, y, 7.8, i === 2 ? 0.95 : 1.45, { fontSize: 22, valign: 'middle', margin: 0 }, 'wipeR', 'with', 1200, 150);
  });
  img('beaker.png', 0.9, 2.0, null, 4.1, 'zoom', 'after', 800);

  // 5 ── جدول النتائج والاستنتاج ───────────────────────────
  newSlide(); title('سجّل مشاهداتك', 'sp_teal', C.teal, 5.0);
  {
    const hd = t => cell(t, { fill: C.head, rtl: true, fs: 24 });
    const rows = [[hd('التوصيل الكهربائي'), hd('الذوبان في الماء'), hd('الحالة الفيزيائية'), hd('وجه المقارنة / رمز العينة')],
      [cell(''), cell(''), cell(''), cell('A', { fs: 28, fill: C.head })], [cell(''), cell(''), cell(''), cell('B', { fs: 28, fill: C.head })]];
    table(rows, 1.0, 1.95, [2.75, 2.75, 2.75, 3.1], [0.8, 0.75, 0.75]);
  }
  box(0.5, 4.6, 12.35, 2.2, { fill: 'DDF0FC', rad: 0.3 }, 'flyB', 'after', 500);
  text('الاستنتاج :', 10.0, 4.65, 2.65, 0.55, { fontSize: 26, color: C.blue }, 'fade', 'after', 400);
  text([r('– المركب الأيوني يوجد في الحالة '), dots(10), r('، ويكوّن محلولًا عند '), dots(10), r(' في الماء، ومحلوله '), dots(10), r(' التيار الكهربائي.')], 0.75, 5.15, 11.9, 0.95, { fontSize: 22 }, 'wipeR', 'after', 1400);
  text([r('– المركب الأيوني من العينتين السابقتين هو المركب الذي له الرمز '), dots(12)], 0.75, 6.1, 11.9, 0.6, { fontSize: 22 }, 'wipeR', 'after', 1000);
  greenChip('الصلبة', 7.8, 4.65, 1.9, 0.5, 'click', 20); greenChip('ذوبانه', 5.7, 4.65, 1.9, 0.5, 'with', 20); greenChip('يوصّل', 3.6, 4.65, 1.9, 0.5, 'with', 20);

  // 6-7 ── خواص المركبات الأيونية: الحالة الفيزيائية ───────
  newSlide(); title('خواص المركبات الأيونية', 'sp_purple', C.purple, 6.8);
  text('ترجع معظم الخواص المميّزة للمركبات الأيونية إلى الشكل البلوري الذي تصطف فيه الكاتيونات والأنيونات، وتنقسم هذه الخواص إلى:', 0.5, 1.8, 12.35, 1.1, { fontSize: 24 }, 'wipeR', 'after', 1400);
  text('1 – الحالة الفيزيائية:', 7.0, 3.0, 5.85, 0.65, { fontSize: 28, color: C.purple }, 'flyR', 'after', 600);
  box(5.6, 3.7, 7.25, 2.95, { fill: 'F1EDFF', line: 'B9A8FF', lw: 3, rad: 0.3 }, 'zoom', 'after', 500);
  text([r('تَصطَف الأيونات مختلفة الشّحنة على شكل «مصفوفات ثلاثيّة الأبعاد ممتدّة من الكاتيونات والأنيونات في المركبات الأيونية» تسمى بـ'), r('الشبكة البلّورية', { color: C.purple }), r(' كما في الشكل (25).')],
    5.8, 3.8, 6.85, 2.75, { fontSize: 24, valign: 'middle' }, 'wipeR', 'after', 1800);
  img('lattice_big.png', 0.9, 2.95, 3.5, 3.5, 'zoom', 'after', 900);
  text([br('شكل (25)', { color: C.blue }), r('يوضح الشبكة البلورية لكلوريد الصوديوم', { fontSize: 16 })], 0.4, 6.4, 4.5, 0.8, { fontSize: 18, align: 'center', paraSpaceAfter: 0 }, 'fade', 'after', 400);

  newSlide(); title('الحالة الفيزيائية', 'sp_purple', C.purple, 5.4);
  img('lattice_big.png', 0.4, 1.8, 4.9, 4.9, 'zoom', 'after', 900);
  box(5.6, 2.1, 7.25, 3.4, { fill: C.white, rad: 0.3 }, 'flyR', 'after', 500);
  text([r('يؤدي هذا الشكل أو الترتيب إلى '), r('زيادة قوّة التجاذب', { color: C.coral }), r(' بين الأيونات مختلفة الشّحنة، مما يجعل معظم المركبات الأيونية في '), r('الحالة الصّلبة', { color: C.purple }), r(' عند درجة حرارة الغرفة '), r('(علل)', { color: C.blue }), r('.')],
    5.85, 2.2, 6.8, 3.2, { fontSize: 28, valign: 'middle' }, 'wipeR', 'after', 1800);
  chip('NaCl', 1.95, 6.55, 1.8, 0.6, C.green, 'zoom', 'after', 24);

  // 8 ── درجة الانصهار والغليان ──────────────────────────
  newSlide(); title('درجة الانصهار والغليان', 'sp_coral', C.coral, 6.4);
  text([r('2 – ', { color: C.coral }), r('تعتمد درجة الانصهار والغليان على '), r('قوّة التجاذب', { color: C.coral }), r(' بين جسيمات المادة، فكلما ارتفعت هذه القوّة ارتفعت درجة الانصهار والغليان للمادة. وبالنظر للمركبات الأيونية وارتفاع قوّة التجاذب بين الأيونات مختلفة الشّحنة في مركباتها، فترتفع درجة الانصهار والغليان لها، ويوضح الجدول (14) درجات الانصهار والغليان لبعض المركبات الأيونية.')],
    2.0, 1.75, 10.85, 2.85, { fontSize: 23 }, 'wipeR', 'after', 2400);
  img('thermo.png', 0.55, 1.85, null, 4.7, 'flyB', 'after', 800);
  {
    const hd = t => cell(t, { fill: C.head, rtl: true, fs: 24 });
    const deg = t => [r(t + ' ('), r('o', { superscript: true }), r('C)')];
    const rows = [[cell(deg('درجة الغليان').map(x => ({ ...x, options: { ...x.options, rtlMode: false } })), { fill: C.head, fs: 24 }), cell(deg('درجة الانصهار'), { fill: C.head, fs: 24 }), hd('اسم المركب')],
      [cell('1413', { fs: 28 }), cell('801', { fs: 28 }), cell('NaCl', { fs: 28 })], [cell('3600', { fs: 28 }), cell('2852', { fs: 28 }), cell('MgO', { fs: 28 })]];
    table(rows, 2.6, 4.75, [3.3, 3.3, 2.9], [0.62, 0.6, 0.6]);
    text('جدول (14)', 5.5, 6.75, 2.6, 0.4, { fontSize: 16, align: 'center', color: C.blue }, 'fade', 'after', 300);
  }

  // 9-10 ── التوصيل الكهربائي ─────────────────────────────
  newSlide(); title('التوصيل الكهربائي', 'sp_gold', C.gold, 5.6);
  img('fig26.png', 0.45, 1.8, 6.0, null, 'zoom', 'after', 900);
  text('شكل (26)', 2.3, 6.95 - 0.1, 2.3, 0.4, { fontSize: 16, align: 'center', color: C.blue }, 'fade', 'with', 300);
  text([r('3 – التوصيل الكهربائي:', { color: C.gold }), br(''), r('تفحص التجربة في الشكل (26): الشكلان يمثلان دائرة كهربائية مغلقة كما يلي:')], 6.75, 1.75, 6.1, 1.45, { fontSize: 21 }, 'wipeR', 'after', 1200);
  text([r('في الشكل (A): ', { color: C.purple }), r('الكأس يحتوي على مركب أيوني صلب. '), r('وفي الشكل (B): ', { color: C.teal }), r('الكأس يحتوي على مصهور لمركب أيوني. '), r('ماذا تلاحظ؟ سجِّل مشاهدتك.', { color: C.coral })], 6.75, 3.25, 6.1, 1.95, { fontSize: 21 }, 'wipeR', 'after', 1500);
  box(6.75, 5.3, 6.1, 1.5, { fill: 'DDF0FC', rad: 0.3 }, 'flyB', 'after', 500);
  text('المشاهدة:', 10.6, 5.32, 2.1, 0.5, { fontSize: 22, color: C.blue }, 'fade', 'with', 300);
  text([r('(A): ', { color: C.purple }), r('لم يضيء المصباح.')], 6.95, 5.75, 5.7, 0.5, { fontSize: 22, color: C.green }, 'zoom', 'click', 500);
  text([r('(B): ', { color: C.teal }), r('أضاء المصباح.')], 6.95, 6.22, 5.7, 0.5, { fontSize: 22, color: C.green }, 'zoom', 'click', 500);

  newSlide(); title('لماذا أضاء المصباح؟', 'sp_gold', C.gold, 5.8);
  text([r('لكي يتم التوصيل الكهربائي في الدائرة لابد من '), r('وجود أيونات', { color: C.coral }), r(' (حاملات) '), r('حرّة الحركة', { color: C.coral }), r(' توّصل (تحمل) هذا التيار الكهربائي خلال الدائرة الكهربائية.')],
    0.5, 1.8, 12.35, 1.3, { fontSize: 25 }, 'wipeR', 'after', 1500);
  box(6.75, 3.2, 6.1, 3.55, { fill: 'F1EDFF', rad: 0.3 }, 'flyR', 'click', 500);
  text([r('ففي الشكل (A) ', { color: C.purple }), r('لم يضيء المصباح، فعلى الرغم من وجود الأيونات في المركب الأيوني الصلب إلاّ أن الروابط في الشبكة البلّورية تجعلها '), r('مقيّدة (غير حرّة) الحركة.', { color: C.coral })],
    6.95, 3.3, 5.7, 3.35, { fontSize: 23, valign: 'middle' }, 'wipeR', 'after', 1500);
  box(0.5, 3.2, 6.0, 3.55, { fill: 'E7F7EF', rad: 0.3 }, 'flyL', 'click', 500);
  text([r('بينما في الشكل (B)، ', { color: C.teal }), r('في حالة المصهور أو المحلول فإن الروابط بين الأيونات في الشبكة البلّورية تتفكّك وتصبح الأيونات '), r('حرّة الحركة', { color: C.green }), r(' توصل التيار الكهربائي وبالتالي يضيء المصباح.')],
    0.7, 3.3, 5.6, 3.35, { fontSize: 23, valign: 'middle' }, 'wipeR', 'after', 1500);

  // 11 ── إضاءات ────────────────────────────────────────────
  newSlide(); title('إضاءات', 'sp_blue', C.blue, 4.0);
  badge('badge_light.png');
  box(0.45, 1.8, 12.4, 5.0, { fill: 'DDF0FC', rad: 0.3 }, 'fade', 'after', 500);
  img('lattice_big.png', 0.6, 2.2, 3.9, 3.9, 'zoom', 'after', 800);
  chip('NaCl', 1.65, 6.05, 1.8, 0.6, C.green, 'zoom', 'with', 24);
  text([r('كلوريد الصوديوم', { color: C.blue }), r('، المعروف باسم ملح الطعام، مركب أيوني يتميز ببنية بلورية مكعبة. تترابط هذه الشبكة البلورية بقوى كهروستاتيكية قوية، وهو ما يفسر ارتفاع درجة انصهار المركب التي تبلغ حوالي '), r('801', { color: C.coral }), r(' درجة سيليزية. وباعتباره إلكتروليتًا قويًا، يتفكك كلوريد الصوديوم كليًا إلى أيوناته المكونة له عند ذوبانه في مذيبات قطبية كالماء، مما يزيد بشكل ملحوظ من القوّة الأيونية للمحلول وتوصيله الكهربائي.')],
    4.7, 1.9, 8.0, 3.0, { fontSize: 20 }, 'wipeR', 'after', 2400);
  text('إلى جانب استخداماته في الطهي، يُعدّ كلوريد الصوديوم عنصرًا فسيولوجيًا أساسيًا، إذ يُسهم في الحفاظ على الضغط الأسموزي، وتوازن السوائل، وانتقال الإشارات عبر أغشية الخلايا العصبيّة بواسطة مضخّة الصوديوم والبوتاسيوم.',
    4.7, 4.95, 8.0, 1.8, { fontSize: 20 }, 'wipeR', 'click', 2000);

  // 12-13 ── تحقق مما تعلمت ───────────────────────────────
  newSlide(); title('تحقق مما تعلمت', 'sp_green', C.green, 5.6);
  badge('badge_check.png');
  box(0.5, 1.8, 12.35, 5.0, { line: '8FA9D6', lw: 6, fill: C.white, rad: 0.4 }, 'zoom', 'after', 600);
  text('لديك العناصر الكيميائية التالية:', 6.0, 1.95, 6.65, 0.6, { fontSize: 26, color: C.blue }, 'wipeR', 'after', 800);
  text('Na , Mg , F , Cl', 1.2, 1.95, 4.6, 0.6, { fontSize: 30, color: C.blue, rtlMode: false, align: 'center', valign: 'middle' }, 'zoom', 'after', 500);
  text('والمطلوب:', 9.0, 2.65, 3.65, 0.55, { fontSize: 25, color: C.coral }, 'fade', 'after', 400);
  text('1 – اكتب أكبر عدد من صيغ المركبات الأيونية الممكن تكوينها من هذه العناصر.', 0.8, 3.2, 11.85, 0.65, { fontSize: 24 }, 'wipeR', 'after', 1000);
  ['NaF', 'NaCl', 'MgF2', 'MgCl2'].forEach((f, i) => chip(fm(f), 9.6 - i * 2.9, 4.25, 2.3, 0.8, [C.purple, C.blue, C.teal, C.coral][i], 'zoom', i ? 'with' : 'click', 30));
  text('2 – رتّب المركبات الأيونية التي حصلت عليها من حيث الخاصّية الأيونية من الأقل إلى الأعلى.', 0.8, 5.35, 11.85, 0.65, { fontSize: 24 }, 'wipeR', 'after', 1000);
  text('(الحل في الشريحة التالية)', 0.8, 6.0, 11.85, 0.5, { fontSize: 18, color: '7A8CA8', align: 'center' }, 'fade', 'after', 300);

  newSlide(); title('تحقق مما تعلمت', 'sp_green', C.green, 5.6);
  badge('badge_check.png');
  text('2 – رتّب المركبات الأيونية التي حصلت عليها من حيث الخاصّية الأيونية من الأقل إلى الأعلى.', 0.5, 1.75, 12.35, 1.0, { fontSize: 24, color: C.blue }, 'wipeR', 'after', 1000);
  {
    const hd = t => cell(t, { fill: C.head, rtl: true, fs: 22 });
    const rows = [[...['F', 'Cl', 'Mg', 'Na'].map(s => cell(s, { fill: C.head, fs: 24 })), hd('رمز العنصر')], [...['4.0', '3.0', '1.2', '0.9'].map(s => cell(s, { fs: 24 })), hd('السّالبية الكهربائية')]];
    table(rows, 6.4, 3.1, [1.05, 1.05, 1.05, 1.05, 2.0], [0.55, 0.55]);
  }
  ['NaF = 4.0 – 0.9 = 3.1', 'MgF2 = 4.0 – 1.2 = 2.8', 'NaCl = 3.0 – 0.9 = 2.1', 'MgCl2 = 3.0 – 1.2 = 1.8'].forEach((t, i) => {
    const k = t.indexOf(' = '), f = t.slice(0, k), rest = t.slice(k + 3);
    text([...fm(f), r(' = ' + rest)], 0.8, 2.95 + i * 0.6, 5.3, 0.55, { fontSize: 25, rtlMode: false, align: 'left', valign: 'middle', color: C.navy }, 'wipeR', i ? 'after' : 'click', 600);
  });
  text([...fm('MgCl2'), r('  <  '), ...fm('NaCl'), r('  <  '), ...fm('MgF2'), r('  <  '), ...fm('NaF')], 1.6, 5.4, 10.1, 0.9, { fontSize: 34, color: C.purple, rtlMode: false, align: 'center', valign: 'middle', shape: pres.ShapeType.roundRect, rectRadius: 0.45, fill: { color: 'F1EDFF' }, shadow: shadow() }, 'zoom', 'click', 700);
  text('الأقل', 0.45, 6.35, 1.6, 0.5, { fontSize: 20, align: 'center', color: C.coral, rtlMode: true }, 'fade', 'with', 400);
  text('الأعلى', 11.3, 6.35, 1.6, 0.5, { fontSize: 20, align: 'center', color: C.green, rtlMode: true }, 'fade', 'with', 400);

  // 14 ── أنت الكيميائي: السؤال الأول ─────────────────────
  newSlide(); title('أنت الكيميائي', 'sp_teal', C.teal, 5.2);
  badge('badge_chem.png');
  text('السؤال الأول: اكتب المصطلح العلمي الذي تدل عليه كل عبارة من العبارات الآتية :', 0.5, 1.8, 12.35, 1.0, { fontSize: 24, color: C.blue }, 'wipeR', 'after', 1000);
  {
    const hd = t => cell(t, { fill: C.head, rtl: true, fs: 24 });
    const rows = [[hd('المصطلح'), hd('العبارة'), hd('م')],
      [cell(''), cell('قوة التجاذب الكهروستاتيكي التي تربط الأيونات مختلفة الشُّحنة في المركب الأيوني.', { rtl: true, fs: 23, extra: { align: 'right' } }), cell('1', { fs: 26 })],
      [cell(''), cell('مصفوفات ثلاثيّة الأبعاد ممتدّة من الكاتيونات والأنيونات في المركبات الأيونية.', { rtl: true, fs: 23, extra: { align: 'right' } }), cell('2', { fs: 26 })]];
    const g = table(rows, 0.85, 3.15, [3.4, 7.3, 0.9], [0.7, 1.4, 1.4]);
    ans(g, 0, 1, 'الرابطة الأيونية', 'click', 26); ans(g, 0, 2, 'الشبكة البلّورية', 'click', 26);
  }

  // 15-16 ── أنت الكيميائي: السؤال الثاني ─────────────────
  const mcq = (y, q, opts, correct) => {
    box(0.5, y, 12.35, 1.95, { fill: C.white, tr: 5, rad: 0.3 }, 'fade', 'after', 400);
    text(q, 0.75, y + 0.1, 11.9, 0.65, { fontSize: 24 }, 'wipeR', 'after', 900);
    opts.forEach((o, i) => text(fm(o).concat([r(' ❏', { color: '7A8CA8' })]), 10.3 - i * 3.1, y + 0.9, 2.5, 0.8, { fontSize: 30, align: 'center', valign: 'middle', rtlMode: false }, 'zoom', 'after', 350));
    const x = 10.3 - correct * 3.1;
    text('✓', x - 0.45, y + 0.86, 0.8, 0.8, { fontSize: 34, color: C.white, align: 'center', valign: 'middle', shape: pres.ShapeType.ellipse, fill: { color: C.green }, rtlMode: false, margin: 0 }, 'zoom', 'click', 500);
    box(x + 0.05, y + 0.85, 2.5, 0.86, { fill: C.green, tr: 85, line: C.green, lw: 3, rad: 0.43, noShadow: true }, 'fade', 'with', 500);
  };
  newSlide(); title('أنت الكيميائي', 'sp_teal', C.teal, 5.2);
  badge('badge_chem.png');
  text('السؤال الثاني: اختر الإجابة الصحيحة لكل عبارة من العبارات الآتية وذلك بوضع علامة (✓) في المربع المقابل لها:', 0.5, 1.8, 12.35, 1.0, { fontSize: 24, color: C.blue }, 'wipeR', 'after', 1200);
  mcq(3.0, '1 – أحد المركبات التالية ينتج من ارتباط المغنيسوم مع النيتروجين:', ['MgCl2', 'Mg3N2', 'MgO', 'Mg2N3'], 1);
  img('nacl_lattice.png', 5.6, 5.1, 2.0, 2.0, 'zoom', 'after', 600);

  newSlide(); title('أنت الكيميائي', 'sp_teal', C.teal, 5.2);
  badge('badge_chem.png');
  text('2 – أحد المركبات التالية له أكبر خاصية أيونية: استخدم الجدول المقابل لقيم السالبية الكهربائية حسب مقياس باولنج.', 0.5, 1.8, 12.35, 1.0, { fontSize: 24, color: C.blue }, 'wipeR', 'after', 1200);
  {
    const sy = ['K', 'Na', 'Li', 'Mg', 'Cl', 'O', 'F'], v = ['0.8', '0.9', '1.0', '1.2', '3.0', '3.5', '4.0'];
    const rows = [[cell('قيم السالبية الكهربائية', { fill: C.head, rtl: true, fs: 18 }), cell('رمز العنصر', { fill: C.head, rtl: true, fs: 18 })], ...sy.map((s, i) => [cell(v[i], { fs: 22 }), cell(s, { fs: 22 })])];
    table(rows, 0.75, 2.95, [2.3, 1.5], [0.5, ...Array(7).fill(0.47)], true, 'fade');
  }
  box(5.0, 3.0, 7.85, 3.7, { fill: C.white, tr: 5, rad: 0.3 }, 'fade', 'after', 400);
  ['NaCl', 'K2O', 'MgF2', 'LiF'].forEach((o, i) => text(fm(o).concat([r(' ❏', { color: '7A8CA8' })]), 11.0 - i * 1.85, 3.2, 1.75, 0.8, { fontSize: 28, align: 'center', valign: 'middle', rtlMode: false }, 'zoom', 'after', 350));
  ['NaCl = 3.0 – 0.9 = 2.1', 'K2O = 3.5 – 0.8 = 2.7', 'MgF2 = 4.0 – 1.2 = 2.8', 'LiF = 4.0 – 1.0 = 3.0'].forEach((t, i) => {
    const k = t.indexOf(' = '), f = t.slice(0, k), rest = t.slice(k + 3);
    text([...fm(f), r(' = ' + rest)], 6.2, 4.1 + i * 0.6, 5.4, 0.55, { fontSize: 24, rtlMode: false, align: 'left', valign: 'middle', color: i === 3 ? C.green : C.navy }, 'wipeR', i ? 'after' : 'click', 500);
  });
  box(5.4, 3.18, 1.85, 0.84, { fill: C.green, tr: 85, line: C.green, lw: 3, rad: 0.42, noShadow: true }, 'fade', 'click', 500);
  text('✓', 5.05, 2.95, 0.6, 0.6, { fontSize: 24, color: C.white, align: 'center', valign: 'middle', shape: pres.ShapeType.ellipse, fill: { color: C.green }, rtlMode: false, margin: 0 }, 'zoom', 'with', 500);

  // 17-18 ── أنت الكيميائي: السؤال الرابع (جدول الكتاب على شريحتين)
  const W6 = Array(6).fill(1.95), span = (c, n) => ({ ...c, options: { ...c.options, colspan: n } });
  const hd4 = (t, fs = 22) => cell(t, { fill: C.head, rtl: true, fs });
  newSlide(); title('أنت الكيميائي', 'sp_teal', C.teal, 5.2);
  badge('badge_chem.png');
  text('السؤال الرابع: أجب عما يلي:', 7.5, 1.75, 5.35, 0.6, { fontSize: 26, color: C.blue }, 'wipeR', 'after', 700);
  {
    const rows = [
      [span(hd4('الفلور'), 2), span(hd4('البوتاسيوم'), 2), span(hd4('وجه المقارنة'), 2)],
      [span(cell(''), 2), span(cell(''), 2), span(hd4('الرمز الكيميائي'), 2)],
      [span(hd4('وضّح بطريقة الترتيب الإلكتروني النقطي كيفية ارتباطهما'), 6)],
      [span(cell(''), 6)],
      [span(hd4('اسم المركب الناتج وصيغته'), 6)],
    ];
    box(0.57, 2.42, 12.26, 4.11, { line: C.border, lw: 5, rad: 0.35, fill: C.white, tr: 15 }, 'zoom', 'after', 600);
    const g = table(rows, 0.85, 2.7, W6, [0.55, 0.6, 0.5, 1.15, 0.5], false);
    const yb = 2.7 + 3.3, cbox = (t, x) => cur.addText(t, reg({ x, y: yb, w: 5.85, h: 0.65, shape: pres.ShapeType.rect, fill: { color: C.white }, line: { color: C.border, width: 1.5 },
      fontFace: FONT, bold: true, fontSize: 21, color: C.navy, align: 'right', valign: 'middle', rtlMode: true, lang: 'ar-KW', margin: 6, isTextBox: true }, 'fade', 'with', 400));
    cbox('اسم المركب:', 6.7); cbox('صيغة المركب:', 0.85);
    g.cy[5] = yb; g.rowH[5] = 0.65;
    text('K', g.cx[2], g.cy[1], 3.9, g.rowH[1], { fontSize: 28, color: C.green, align: 'center', valign: 'middle', rtlMode: false, margin: 0 }, 'zoom', 'click', 400);
    text('F', g.cx[0], g.cy[1], 3.9, g.rowH[1], { fontSize: 28, color: C.green, align: 'center', valign: 'middle', rtlMode: false, margin: 0 }, 'zoom', 'with', 400);
    img('eq_kf.png', 4.35, g.cy[3] + 0.06, null, 1.03, 'zoom', 'click', 600);
    text('فلوريد البوتاسيوم', 6.8, g.cy[5], 3.9, g.rowH[5], { fontSize: 24, color: C.green, align: 'center', valign: 'middle', margin: 0 }, 'zoom', 'click', 400);
    text(fm('KF', { color: C.green }), 0.95, g.cy[5], 3.9, g.rowH[5], { fontSize: 26, align: 'center', valign: 'middle', rtlMode: false, margin: 0 }, 'zoom', 'with', 400);
  }

  newSlide(); title('أنت الكيميائي', 'sp_teal', C.teal, 5.2);
  badge('badge_chem.png');
  text('السؤال الرابع (تابع): البوتاسيوم والفلور', 5.5, 1.75, 7.35, 0.6, { fontSize: 26, color: C.blue }, 'wipeR', 'after', 700);
  {
    const rows = [
      [span(hd4('درجة انصهار أو غليان المركب الناتج؟ (منخفضة/ مرتفعة)'), 6)], [span(cell(''), 6)],
      [span(hd4('هل يوصّل مصهور المركب الناتج التيار الكهربائي؟ (نعم/ لا)'), 6)], [span(cell(''), 6)],
      [span(hd4('فسّر إجابتك'), 6)], [span(cell(''), 6)],
    ];
    const g = table(rows, 0.85, 2.7, W6, [0.55, 0.65, 0.55, 0.65, 0.55, 0.9]);
    const a = (row, t, fs = 26) => text(t, g.cx[0], g.cy[row], 11.7, g.rowH[row], { fontSize: fs, color: C.green, align: 'center', valign: 'middle', margin: 2 }, 'zoom', 'click', 500);
    a(1, 'مرتفعة'); a(3, 'نعم'); a(5, 'لأن الأيونات في المصهور تصبح حرّة الحركة فتوصل التيار الكهربائي.', 23);
  }

  await pres.writeFile({ fileName: OUT });
  fs.writeFileSync(OUT.replace(/\.pptx$/, '.anim.json'), JSON.stringify(ANIM, null, 1));
  console.log('written', OUT, ANIM.length, 'slides');
}
build();
