// عرض تقديمي: الدرس [2-1] الرابطة الأيونية
const pptxgen = require('pptxgenjs');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const A = p => path.join(__dirname, 'assets', p);
const OUT = process.argv[2] || path.join(__dirname, 'deck2.pptx');
const C = {
  navy: '16325C', blue: '1F6FB2', sky: '3FA7D6', teal: '0F9D8E', coral: 'E8335F', gold: 'E59A00',
  purple: '6C4FE0', green: '0B8A5A', head: 'D6ECFA', border: '8FB1DA', white: 'FFFFFF', soft: 'F3F9FF',
};
const FONT = 'Arial';
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5
pres.rtlMode = true;
pres.title = 'الرابطة الأيونية';
pres.theme = { headFontFace: FONT, bodyFontFace: FONT };
pres.defineSlideMaster({ title: 'TITLE', background: { path: A('bg_title.png') } });
pres.defineSlideMaster({ title: 'CONTENT', background: { path: A('bg_content2.png') } });

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

// chip with a chemical formula (kept LTR, outside Arabic paragraphs so bidi can't scramble it)
function chip(runs, x, y, w, h, fill, fx = 'zoom', trig = 'after', fs = 28) {
  text(runs, x, y, w, h, { fontSize: fs, color: C.white, align: 'center', valign: 'middle', rtlMode: false, margin: 0,
    shape: pres.ShapeType.roundRect, rectRadius: h / 2, fill: { color: fill }, shadow: shadow() }, fx, trig, 500);
}
const sup = (s, t, o = {}) => [r(s, o), r(t, { superscript: true, ...o })];
// exercise box like the book: question, dotted answer line, bond type & compound name
function exercise(q, eqFile, bond, name) {
  box(0.5, 1.85, 12.35, 4.85, { line: '8FA9D6', lw: 6, fill: C.white, rad: 0.4 }, 'zoom', 'after', 600);
  text(q, 0.8, 1.95, 11.8, 0.95, { fontSize: 24, color: C.blue, valign: 'middle' }, 'wipeR', 'after', 1000);
  text('..........................................................................................................', 0.8, 3.0, 11.8, 1.5, { fontSize: 22, color: '9AAAC0', align: 'center', valign: 'bottom', rtlMode: false }, 'fade', 'after', 400);
  text([r('نوع الرابطة: '), r('........................', { color: '9AAAC0' })], 6.9, 4.85, 5.75, 0.7, { fontSize: 25 }, 'wipeR', 'after', 600);
  text([r('اسم المركب الناتج: '), r('........................', { color: '9AAAC0' })], 0.8, 4.85, 6.0, 0.7, { fontSize: 25 }, 'wipeR', 'with', 600);
  img(eqFile, 1.9, 3.0, 9.5, null, 'zoom', 'click', 700);
  text(bond, 7.6, 5.6, 4.2, 0.7, { fontSize: 28, color: C.green, align: 'center' }, 'zoom', 'click', 500);
  text(name, 1.2, 5.6, 4.6, 0.7, { fontSize: 28, color: C.green, align: 'center' }, 'zoom', 'with', 500);
}

async function build() {
  await loadDims();

  // 1 ── الغلاف ────────────────────────────────────────────
  newSlide('TITLE');
  img('nacl_lattice.png', 0.4, 1.0, 5.4, 5.4, 'zoom', 'after', 1100);
  text('الدرس [2-1]', 9.6, 1.25, 3.1, 0.75, { shape: pres.ShapeType.roundRect, rectRadius: 0.37, fill: { color: C.teal }, color: C.white, fontSize: 28, align: 'center', valign: 'middle', shadow: shadow(), margin: 0 }, 'flyR', 'after', 700);
  text([br('الرابطة'), r('الأيونية')], 5.6, 2.05, 7.2, 2.5, { fontSize: 72, color: C.navy, valign: 'middle', margin: 0, paraSpaceAfter: 0, lineSpacingMultiple: 0.95 }, 'wipeR', 'after', 1300);
  text('Ionic Bond', 5.6, 4.5, 7.2, 0.8, { fontSize: 38, color: C.blue, rtlMode: false, align: 'right', valign: 'middle', margin: 0 }, 'float', 'after', 900);
  img('ion_pair.png', 8.6, 5.3, 3.9, null, 'zoom', 'after', 800);

  // 2 ── ماذا سأتعلم؟ ──────────────────────────────────────
  newSlide(); title('ماذا سأتعلم ؟', 'sp_teal', C.teal, 5.6);
  img('ion_pair.png', 0.3, 2.3, 5.3, null, 'zoom', 'after', 900);
  ['مفهوم الرابطة الأيونية.', 'تكوين المركبات الأيونية.'].forEach((t, i) => {
    const y = 2.4 + i * 1.6;
    box(5.85, y, 7.0, 1.15, { fill: C.white, tr: 5, rad: 0.57 }, 'flyR', 'after', 500);
    text(t, 6.0, y, 5.75, 1.15, { fontSize: 32, valign: 'middle', margin: 0 }, 'wipeR', 'with', 700, 150);
    ball(['sp_teal.png', 'sp_coral.png'][i], i + 1, 11.85, y + 0.08, 1.0, 'zoom', 'with');
  });

  // 3 ── كيف سأتعلم؟ ───────────────────────────────────────
  newSlide(); title('كيف سأتعلم ؟', 'sp_purple', C.purple, 5.6);
  img('nacl_lattice.png', 0.6, 1.9, 4.6, 4.6, 'zoom', 'after', 900);
  ['أتعرّف على مفهوم الرابطة الأيونية.', 'أكتب تفاعل يمثل الترتيب النقطي الإلكتروني المكون للمركبات الأيونية.'].forEach((t, i) => {
    const y = 2.3 + i * 1.85;
    box(5.6, y, 7.25, 1.45, { fill: C.white, tr: 5, rad: 0.5 }, 'flyR', 'after', 500);
    text(t, 5.75, y, 6.0, 1.45, { fontSize: 29, valign: 'middle', margin: 0 }, 'wipeR', 'with', 700, 150);
    ball(['sp_purple.png', 'sp_blue.png'][i], i + 1, 11.85, y + 0.22, 1.0, 'zoom', 'with');
  });

  // 4 ── الصورة الافتتاحية ──────────────────────────────────
  newSlide(); title('تأمّل الصورة الافتتاحية', 'sp_gold', C.gold, 6.4);
  img('book_ionic.png', 0.45, 2.1, 5.5, null, 'zoom', 'after', 900);
  box(6.2, 1.8, 6.65, 5.0, { line: '7FB2D9', lw: 6, fill: C.white, rad: 0.15 }, 'fade', 'after', 500);
  text([r('تعرّفت سابقًا على فلز '), r('الصوديوم', { color: C.purple }), r(' الذي يقع في مجموعة فلزات الأقلاء، وهو فلز نشطٌ جدًا، تكفي قطعة صغيرة منه تلقى في الماء لتسبب انفجارًا حراريًا عنيفًا، وتعرّفت أيضًا على غاز '), r('الكلور', { color: C.green }),
    r(' من مجموعة الهالوجينات، وهو غاز شديد السميّة يسبب أضرارًا بالغةً للجهاز التنفسي، ولكن عند اتحاد الصوديوم مع الكلور برابطة كيميائية، نَتج لنا مركبًا لا نستغني عنه في حياتنا اليومية وهو '), r('ملح الطعام أو كلوريد الصوديوم.', { color: C.coral })],
    6.35, 1.9, 6.35, 3.85, { fontSize: 21 }, 'wipeR', 'after', 2200);
  text('فما هي الرابطة التي جمعت بينهما؟ وكيف تتم هذه الرابطة؟', 6.35, 5.8, 6.35, 0.95, { fontSize: 23, color: C.blue }, 'zoom', 'click', 700);

  // 5 ── نشاط (التعليمات) ───────────────────────────────────
  newSlide(); title('نشاط...', 'sp_coral', C.coral, 4.2);
  img('book_cards.png', 0.6, 1.9, 3.7, null, 'flyL', 'after', 800);
  box(4.65, 1.8, 8.2, 4.95, { line: '8FA9D6', lw: 6, fill: C.white, rad: 0.4 }, 'zoom', 'after', 600);
  text('أمامك بطاقتان ملوّنتان – أقلام ملوّنة – بطاقات ورقية مثنيّة.', 4.85, 1.95, 7.8, 0.95, { fontSize: 25, color: C.blue }, 'wipeR', 'after', 900);
  text('والمطلوب:', 4.85, 2.85, 7.8, 0.55, { fontSize: 25, color: C.coral }, 'fade', 'after', 400);
  ['1 – اختر أنت بطاقة ملوّنة وزميلك يأخذ البطاقة الثانية.', '2 – خذ من المعلّم بطاقة مثنيّة واحدة.', '3 – سجّل اسم عنصر وزميلك عنصر آخر في البطاقة الملوّنة.', '4 – أجب أنت وزميلك على أسئلة زملائكم في الفصل حسب الجدول التالي.']
    .forEach((t, i) => text(t, 4.85, 3.45 + i * 0.78, 7.8, i === 3 ? 0.95 : 0.75, { fontSize: 22 }, 'wipeR', 'click', 700));

  // 6 ── نشاط (الجدول) ──────────────────────────────────────
  newSlide(); title('نشاط... أكمل الجدول', 'sp_coral', C.coral, 6.2);
  {
    const hd = t => cell(t, { fill: C.head, rtl: true, fs: 21 });
    const e = () => cell('');
    const rows = [
      [cell('', { fill: C.head }), cell('', { fill: C.head }), hd('اسم العنصر')],
      [e(), e(), hd('رمز العنصر وعدده الذري')], [e(), e(), hd('فلز / لافلز')],
      [e(), e(), hd('الترتيب الإلكتروني حسب مستويات الطاقة الرئيسية')], [e(), e(), hd('الترتيب النقطي')],
      [e(), e(), hd('للوصول للاستقرار (يفقد/ يكتسب) إلكترونات')], [e(), e(), hd('صيغة الأيون الناتج')],
    ];
    const g = table(rows, 2.0, 1.95, [2.9, 2.9, 4.1], [0.6, 0.62, 0.6, 0.78, 0.82, 0.78, 0.66]);
    const A2 = [['الصوديوم', 'الكلور'], [sub(11, 'Na', { color: C.green }), sub(17, 'Cl', { color: C.green })], ['فلز', 'لافلز'], ['2,8,1', '2,8,7'], null,
      ['يفقد 1', 'يكتسب 1'], [sup('Na', '+', { color: C.green }), sup('Cl', '−', { color: C.green })]];
    A2.forEach((pair, row) => {
      if (!pair) { ansImg(g, 1, row, 'lewisA_Na.png', 'click', 0.7); ansImg(g, 0, row, 'lewisA_Cl.png', 'with', 0.92); return; }
      pair.forEach((t, k) => {
        const col = 1 - k, ar = typeof t === 'string' && /[؀-ۿ]/.test(t);
        text(t, g.cx[col], g.cy[row], g.colW[col], g.rowH[row], { align: 'center', valign: 'middle', fontSize: 24, color: C.green, rtlMode: ar, margin: 0 }, 'zoom', k ? 'with' : 'click', 450);
      });
    });
    img('book_cards.png', 0.4, 4.6, 1.4, null, 'fade', 'after', 400);
  }

  // 7 ── إذًا نستنتج ─────────────────────────────────────────
  newSlide(); title('إذًا نستنتج', 'sp_teal', C.teal, 5.0);
  [['1 – الفلزات تميل لـ ....... الإلكترونات، وتكوّن ....... يحمل شحنة موجبة.', ['فقد', 'كاتيون'], 'FFE8EE', C.coral, 'sp_coral.png', '+'],
   ['2 – اللافلزات تميل لـ ....... الإلكترونات، وتكوّن ....... يحمل شحنة سالبة.', ['اكتساب', 'أنيون'], 'E5F0FF', C.blue, 'sp_blue.png', '−']].forEach(([t, a, f, col, sp, sign], i) => {
    const y = 1.8 + i * 1.8;
    box(0.5, y, 12.35, 1.6, { fill: f, rad: 0.3 }, 'flyR', 'after', 500);
    img(sp, 11.75, y + 0.25, 1.0, 1.0, 'zoom', 'with', 500);
    text(sign, 11.75, y + 0.27, 1.0, 0.92, { fontSize: 40, color: C.white, align: 'center', valign: 'middle', rtlMode: false, margin: 0 }, 'zoom', 'with', 500);
    text(t, 0.7, y + 0.05, 11.0, 0.95, { fontSize: 23, valign: 'middle' }, 'wipeR', 'after', 1100);
    a.forEach((w, k) => text(w, 7.4 - k * 3.4, y + 1.0, 2.6, 0.52, { fontSize: 24, color: C.white, align: 'center', valign: 'middle', margin: 0, shape: pres.ShapeType.roundRect, rectRadius: 0.29, fill: { color: C.green } }, 'zoom', k ? 'with' : 'click', 500));
  });
  box(0.5, 5.5, 12.35, 1.25, { fill: 'FFF4D6', line: 'F2C14E', lw: 3, rad: 0.3 }, 'flyB', 'after', 500);
  text('ماذا يحدث عند تقريب الأيونات مختلفة الشحنة إلى بعضها؟ (فكّر)', 5.2, 5.55, 7.5, 1.15, { fontSize: 23, color: C.navy, valign: 'middle' }, 'wipeR', 'after', 900);
  text('تنشأ بينها قوة تجاذب', 0.75, 5.75, 4.2, 0.75, { fontSize: 24, color: C.white, align: 'center', valign: 'middle', margin: 0, shape: pres.ShapeType.roundRect, rectRadius: 0.37, fill: { color: C.green } }, 'zoom', 'click', 500);

  // 8 ── تعريف الرابطة الأيونية ─────────────────────────────
  newSlide(); title('الرابطة الأيونية', 'sp_purple', C.purple, 5.6);
  text([r('عند تقريب الأيونات مختلفة الشحنة من بعضها البعض تنشأ بينها '), r('قوة تجاذب', { color: C.coral }), r(' وهي الأساس الذي تقوم عليه '), r('الرابطة الأيونية', { color: C.purple }), r(' التي تعرّف بأنها:')],
    0.5, 1.85, 12.35, 1.3, { fontSize: 27 }, 'wipeR', 'after', 1500);
  img('ion_pair.png', 0.5, 3.25, 5.4, null, 'zoom', 'after', 900);
  chip(sup('Cl', '−'), 1.1, 6.35, 1.6, 0.6, C.green, 'zoom', 'after');
  chip(sup('Na', '+'), 3.95, 6.35, 1.6, 0.6, C.purple, 'zoom', 'with');
  box(6.15, 3.45, 6.7, 2.9, { fill: 'F1EDFF', line: 'B9A8FF', lw: 4, rad: 0.35 }, 'zoom', 'click', 500);
  text('«قوّة التجاذب الكهروستاتيكي التي تربط الأيونات مختلفة الشحنة في المركب الأيوني».', 6.4, 3.55, 6.2, 2.7, { fontSize: 29, valign: 'middle', align: 'center' }, 'wipeR', 'after', 1500);

  // 9 ── مثال (1) ────────────────────────────────────────────
  newSlide(); title('مثال (1)', 'sp_blue', C.blue, 4.3);
  text('والآن سنطبق ما تم كتابته في الجدول السابق على شكل معادلة كيميائية تصف تفاعل الصوديوم مع الكلور نقطيًا لتكوين كلوريد الصوديوم كما في المثال (1):', 0.5, 1.75, 12.35, 1.4, { fontSize: 23 }, 'wipeR', 'after', 1500);
  box(0.5, 3.25, 12.35, 3.5, { line: 'A9D6F2', lw: 6, fill: 'EEF8FF', rad: 0.4 }, 'zoom', 'after', 600);
  text('وضّح بطريقة الترتيب الإلكتروني النقطي كيفيّة ارتباط الصوديوم مع الكلور لتكوين كلوريد الصوديوم.', 0.8, 3.33, 11.8, 0.9, { fontSize: 24, color: C.blue }, 'wipeR', 'after', 1200);
  text('الحــل :', 0.8, 4.2, 11.8, 0.55, { fontSize: 26, color: C.coral }, 'fade', 'after', 400);
  img('eq_nacl.png', 2.3, 4.7, 8.7, null, 'zoom', 'click', 900);

  // 10 ── شرح المثال (1) ───────────────────────────────────
  newSlide(); title('لاحظ من التفاعل السابق', 'sp_teal', C.teal, 6.6);
  img('eq_nacl.png', 2.6, 1.75, 8.1, null, 'fade', 'after', 600);
  text([r('لاحظ من التفاعل السابق انتقال إلكترون التكافؤ من ذرّة الصوديوم '), r('(فلز)', { color: C.purple }), r(' إلى ذرّة الكلور '), r('(لافلز)', { color: C.green }), r('، فبسبب هذا الانتقال للإلكترونات تحوّل الصوديوم إلى '),
    r('أيون الصوديوم الموجب (كاتيون)', { color: C.purple }), r('، والكلور إلى '), r('أيون الكلوريد السالب (أنيون)', { color: C.green }), r('، ونتيجة لاختلاف الشحنة بين الأيونات، يحدث تجاذب بين كاتيون الصوديوم وأنيون الكلوريد، وتتكوّن '), r('الرابطة الأيونية.', { color: C.coral })],
    3.4, 3.4, 9.45, 3.35, { fontSize: 24 }, 'wipeR', 'after', 2400);
  img('na_ion.png', 0.4, 3.35, 1.55, 1.55, 'zoom', 'after', 500);
  chip(sup('Na', '+'), 2.0, 3.8, 1.25, 0.6, C.purple, 'zoom', 'with', 26);
  img('cl_ion.png', 0.4, 5.05, 1.55, 1.55, 'zoom', 'after', 500);
  chip(sup('Cl', '−'), 2.0, 5.5, 1.25, 0.6, C.green, 'zoom', 'with', 26);

  // 11 ── مثال (2) ──────────────────────────────────────────
  newSlide(); title('مثال (2)', 'sp_blue', C.blue, 4.3);
  box(0.5, 1.85, 12.35, 4.6, { line: 'A9D6F2', lw: 6, fill: 'EEF8FF', rad: 0.4 }, 'zoom', 'after', 600);
  text('وضّح بطريقة الترتيب الإلكتروني النقطي كيفيّة ارتباط المغنيسيوم مع الأكسجين لتكوين أكسيد المغنيسيوم.', 0.8, 2.0, 11.8, 1.0, { fontSize: 26, color: C.blue }, 'wipeR', 'after', 1200);
  text('الحــل :', 0.8, 3.05, 11.8, 0.55, { fontSize: 26, color: C.coral }, 'fade', 'after', 400);
  img('eq_mgo.png', 1.6, 3.85, 10.1, null, 'zoom', 'click', 900);

  // 12 ── قانون حفظ الشحنة ─────────────────────────────────
  newSlide(); title('قانون حفظ الشحنة', 'sp_gold', C.gold, 5.6);
  text([r('في المثال (1) والمثال (2) لاحظ أن مجموع الشحنات الكهربائية في المتفاعلات والنواتج متساوٍ، وهو ما ينصّ عليه '), r('قانون حفظ الشحنة', { color: C.gold }), r(': '),
    r('«مجموع الشحنات الكهربائية الكلّية للمواد المتفاعلة يساوي مجموع الشحنات الكهربائية الكلّية للمواد الناتجة».', { color: C.purple }), r(' ويستخدم هذا القانون لوزن المعادلة حسب الشحنات الكهربائية، وبتطبيق القانون على المثال (1) نجد ما يلي:')],
    0.5, 1.8, 12.35, 2.5, { fontSize: 24 }, 'wipeR', 'after', 2200);
  img('eq_charge.png', 3.65, 4.3, null, 2.6, 'zoom', 'click', 900);

  // 13 ── السالبية الكهربائية — جدول (13) ───────────────────
  newSlide(); title('الخاصية الأيونية والسالبية', 'sp_purple', C.purple, 7.2);
  text([r('ترتبط '), r('الخاصية الأيونية', { color: C.purple }), r(' للروابط في المركبات '), r('بالسّالبية الكهربائية', { color: C.blue }), r('، فتظهر الخاصية الأيونية في الرابطة الأيونية بشكلٍ كبيرٍ عندما يكون الفرق في السّالبية الكهربائية بين العنصرين المكوّنين للرابطة '),
    r('أكبر من أو يساوي (1.7)', { color: C.coral }), r(' حسب مقياس باولنج؛ فكلّما زاد الفرق في السّالبية الكهربائية للعناصر المكوّنة للمركب زادت الخاصّية الأيونية والعكس صحيح. ويوضح الجدول (13) قيم السّالبية الكهربائية حسب مقياس باولنج لبعض العناصر.')],
    0.5, 1.75, 12.35, 2.95, { fontSize: 23 }, 'wipeR', 'after', 2400);
  {
    const sy = ['F', 'O', 'Cl', 'N', 'S', 'Mg', 'Ca', 'Li', 'Na', 'K'], v = ['4.0', '3.5', '3.0', '3.0', '2.5', '1.2', '1.0', '1.0', '0.9', '0.8'];
    const rows = [[...sy.map(s => cell(s, { fill: C.head, fs: 26 })), cell('رمز العنصر', { fill: C.head, rtl: true, fs: 22 })],
      [...v.map(s => cell(s, { fs: 26 })), cell('السّالبية الكهربائية', { fill: C.head, rtl: true, fs: 22 })]];
    table(rows, 0.75, 5.0, [...Array(10).fill(0.92), 2.65], [0.68, 0.68]);
    text('جدول (13)', 5.2, 6.65, 3.0, 0.45, { fontSize: 18, align: 'center', color: C.blue }, 'fade', 'after', 400);
  }

  // 14 ── مثال (3) ──────────────────────────────────────────
  newSlide(); title('مثال (3)', 'sp_blue', C.blue, 4.3);
  box(0.5, 1.8, 12.35, 5.0, { line: 'A9D6F2', lw: 6, fill: 'EEF8FF', rad: 0.4 }, 'zoom', 'after', 600);
  text('رتّب المركبات الأيونية التالية من حيث الخاصيّة الأيونية ترتيبًا تصاعديًا.', 4.75, 1.95, 7.9, 0.65, { fontSize: 23, color: C.navy }, 'wipeR', 'after', 1100);
  text('LiCl  ,  MgO  ,  NaF', 0.75, 1.95, 3.95, 0.65, { fontSize: 26, color: C.blue, rtlMode: false, align: 'center', valign: 'middle' }, 'zoom', 'after', 500);
  text('الحــل :', 6.8, 2.72, 5.85, 0.45, { fontSize: 25, color: C.coral }, 'fade', 'after', 400);
  text([r('باستخدام المعلومات من جدول '), r('(13)', { color: C.blue }), r('، يتم حساب الفرق في السّالبية الكهربائية للعناصر المكونة للمركب.')], 0.8, 3.15, 11.85, 0.65, { fontSize: 22 }, 'wipeR', 'click', 1100);
  ['LiCl = 3.0 – 1.0 = 2.0', 'MgO = 3.5 – 1.2 = 2.3', 'NaF = 4.0 – 0.9 = 3.1'].forEach((t, i) =>
    text(t, 0.9, 3.75 + i * 0.55, 5.5, 0.55, { fontSize: 26, color: C.navy, rtlMode: false, align: 'left', valign: 'middle' }, 'wipeR', 'after', 600));
  text('NaF > MgO > LiCl', 6.6, 4.0, 5.9, 0.75, { fontSize: 34, color: C.purple, rtlMode: false, align: 'center', valign: 'middle', shape: pres.ShapeType.roundRect, rectRadius: 0.37, fill: { color: C.white }, shadow: shadow() }, 'zoom', 'click', 700);
  text('الأقل', 10.3, 5.55, 1.9, 0.8, { fontSize: 28, align: 'center', valign: 'middle', shape: pres.ShapeType.rect, fill: { color: C.head }, line: { color: C.navy, width: 1.5 }, margin: 0 }, 'flyR', 'after', 500);
  cur.addShape(pres.ShapeType.line, reg({ x: 8.3, y: 5.95, w: 1.85, h: 0, line: { color: '1F5F7A', width: 7, endArrowType: 'triangle' }, flipH: true }, 'wipeR', 'after', 600));
  text('الأعلى', 6.25, 5.55, 1.9, 0.8, { fontSize: 28, align: 'center', valign: 'middle', shape: pres.ShapeType.rect, fill: { color: C.head }, line: { color: C.navy, width: 1.5 }, margin: 0 }, 'flyL', 'after', 500);

  // 15-17 ── تمرين (1) و(2) وأسئلتهما ─────────────────────
  newSlide(); title('تمرين (1)', 'sp_coral', C.coral, 4.3);
  exercise('وضّح بطريقة الترتيب الإلكتروني النقطي كيفيّة ارتباط عنصر البوتاسيوم مع عنصر الكلور', 'eq_kcl.png', 'أيونية', 'كلوريد البوتاسيوم');
  newSlide(); title('تمرين (2)', 'sp_coral', C.coral, 4.3);
  exercise('وضّح بطريقة الترتيب الإلكتروني النقطي كيفيّة ارتباط عنصر الكالسيوم مع عنصر الأكسجين', 'eq_cao.png', 'أيونية', 'أكسيد الكالسيوم');

  newSlide(); title('من إجاباتك', 'sp_green', C.green, 4.6);
  box(0.5, 1.85, 12.35, 4.85, { fill: C.white, rad: 0.4 }, 'zoom', 'after', 600);
  text('من اجاباتك التي حصلت عليها من التمرين (1) والتمرين (2)، أجب عما يلي:', 0.8, 2.0, 11.8, 0.7, { fontSize: 26, color: C.blue }, 'wipeR', 'after', 1000);
  text([r('– الصيغة الكيميائية للمركب الذي له خاصية أيونية أعلى هي '), r('...................', { color: '9AAAC0' })], 4.0, 3.0, 8.65, 0.75, { fontSize: 25 }, 'wipeR', 'after', 900);
  chip('CaO', 1.4, 3.05, 2.2, 0.65, C.green, 'zoom', 'click', 28);
  text([r('– اسم المركب الذي له أقل خاصية أيونية '), r('...................', { color: '9AAAC0' })], 4.0, 4.1, 8.65, 0.75, { fontSize: 25 }, 'wipeR', 'after', 900);
  text('كلوريد البوتاسيوم', 0.9, 4.15, 3.2, 0.65, { fontSize: 24, color: C.white, align: 'center', valign: 'middle', margin: 0, shape: pres.ShapeType.roundRect, rectRadius: 0.32, fill: { color: C.green }, shadow: shadow() }, 'zoom', 'click', 500);
  ['CaO = 3.5 – 1.0 = 2.5', 'KCl = 3.0 – 0.8 = 2.2'].forEach((t, i) =>
    text(t, 0.9 + i * 5.9, 5.45, 5.5, 0.7, { fontSize: 26, color: C.purple, rtlMode: false, align: 'center', valign: 'middle', shape: pres.ShapeType.roundRect, rectRadius: 0.35, fill: { color: 'F1EDFF' } }, 'zoom', i ? 'with' : 'click', 500));

  // 18-19 ── دعنا نلخص ما سبق ──────────────────────────────
  newSlide(); title('دعنا نلخص ما سبق', 'sp_gold', C.gold, 6.0);
  img('bulb.png', 0.55, 1.95, 1.5, null, 'zoom', 'after', 600);
  const sumA = [
    [r('تتكون الرابطة الأيونية غالبًا نتيجة تفاعل ذرّة '), r('فلز', { color: C.coral }), r(' مع ذرّة '), r('لافلز', { color: C.coral }), r(' .')],
    [r('ذرّة الفلز '), r('تفقد', { color: C.coral }), r(' إلكترونات التكافؤ للوصول إلى حالة الاستقرار ⇐ تتحوّل إلى '), r('أيون موجب', { color: C.coral }), r(' (كاتيون)', { color: C.green }), r('.')],
    [r('ذرّة اللافلز تكتسب الإلكترونات المفقودة من ذرّة الفلز للوصول إلى حالة الاستقرار ⇐ تتحوّل إلى '), r('أيون سالب', { color: C.coral }), r(' (أنيون)', { color: C.green }), r('.')],
    [r('يجب أن '), r('تتساوى', { color: C.coral }), r(' الشحنات الكهربائية في طرفي المعادلة.')],
  ];
  const sy = [1.95, 3.0, 4.25, 5.5];
  sumA.forEach((t, i) => {
    ball(['sp_coral.png', 'sp_blue.png', 'sp_teal.png', 'sp_purple.png'][i], i + 1, 12.05, sy[i] + 0.12, 0.7, 'zoom', 'after');
    text(t, 2.3, sy[i], 9.65, i === 0 || i === 3 ? 0.95 : 1.2, { fontSize: 24, valign: 'middle' }, 'wipeR', 'with', 1200, 150);
  });

  newSlide(); title('دعنا نلخص ما سبق', 'sp_gold', C.gold, 6.0);
  img('bulb.png', 0.55, 1.95, 1.5, null, 'zoom', 'after', 600);
  ball('sp_gold.png', 5, 12.05, 2.0, 0.7, 'zoom', 'after');
  text([r('ترتبط الخاصيّة الأيونية في المركبات بالسّالبية الكهربائية، تظهر الخاصيّة الأيونية في الرابطة الأيونية بشكلٍ كبيرٍ عندما يكون الفرق في السّالبية الكهربائية بين العنصرين المكونين للرابطة '), r('أكبر من أو يساوي (1.7)', { color: C.coral }), r(' حسب مقياس باولنج؛ فكلّما زاد الفرق في السّالبية الكهربائية للعناصر المكوّنة للمركب زادت الخاصّية الأيونية والعكس صحيح.')],
    2.3, 1.9, 9.65, 2.4, { fontSize: 23 }, 'wipeR', 'with', 2000, 150);
  ball('sp_green.png', 6, 12.05, 4.4, 0.7, 'zoom', 'click');
  text([r('عند كتابة الصيغة الكيميائية للمركب الأيوني نبدأ بكتابة رمز الفلز '), r('(على اليسار)', { color: C.coral }), r(' يليه رمز اللافلز '), r('(على اليمين)', { color: C.coral }), r('.'), r(' مثل:')],
    2.3, 4.3, 9.65, 1.15, { fontSize: 23 }, 'wipeR', 'with', 1400, 150);
  [['أكسيد المغنيسيوم', 'MgO'], ['كلوريد الليثيوم', 'LiCl']].forEach(([a, f], i) => {
    const x = 7.0 - i * 6.0;
    text(a, x + 1.9, 5.65, 3.6, 0.7, { fontSize: 25, valign: 'middle', shape: pres.ShapeType.roundRect, rectRadius: 0.35, fill: { color: C.white }, align: 'center' }, 'zoom', 'after', 500);
    text('⇐', x + 1.2, 5.65, 0.7, 0.7, { fontSize: 28, align: 'center', valign: 'middle', color: C.navy, margin: 0 }, 'fade', 'with', 400);
    chip(f, x - 0.4, 5.65, 1.6, 0.7, C.purple, 'zoom', 'with', 28);
  });

  // 20-21 ── مثال (4) ───────────────────────────────────────
  newSlide(); title('مثال (4)', 'sp_blue', C.blue, 4.3);
  text('بعد أن تعرّفت إلى كيفية تكوين الرابطة الأيونية لبعض المركبات، دعنا نتعمّق أكثر في المفهوم من خلال المثال التالي:', 0.5, 1.75, 12.35, 0.95, { fontSize: 22 }, 'wipeR', 'after', 1200);
  box(0.5, 2.7, 12.35, 4.1, { line: 'A9D6F2', lw: 6, fill: 'EEF8FF', rad: 0.4 }, 'zoom', 'after', 600);
  text('وضّح بطريقة الترتيب الإلكتروني النقطي كيفيّة ارتباط البوتاسيوم مع الأكسجين لتكوين أكسيد البوتاسيوم.', 0.8, 2.8, 11.8, 0.95, { fontSize: 24, color: C.blue }, 'wipeR', 'after', 1200);
  img('eq_k2o_a.png', 0.8, 3.75, null, 1.25, 'zoom', 'click', 800);
  text([r('يُلاحظ من التفاعل السّابق أن ذرّة البوتاسيوم تفقد إلكترونًا واحدًا من مستوى التكافؤ حتى تصل إلى حالة الاستقرار (2,8)، بينما ذرّة الأكسجين اكتسبت الإلكترون المنتقل إليها من ذرّة البوتاسيوم، '),
    r('ولكن هل وصلت ذرّة الأكسجين إلى حالة الاستقرار بهذا الترتيب حسب مستويات الطاقة الرئيسية (2,7)؟', { color: C.coral })], 0.8, 5.05, 11.8, 1.7, { fontSize: 21 }, 'wipeR', 'after', 2000);
  text('الحــل:', 10.4, 3.95, 2.2, 0.6, { fontSize: 26, color: C.coral }, 'fade', 'with', 400);

  newSlide(); title('مثال (4)', 'sp_blue', C.blue, 4.3);
  box(0.5, 1.85, 12.35, 4.85, { line: 'A9D6F2', lw: 6, fill: 'EEF8FF', rad: 0.4 }, 'zoom', 'after', 600);
  text([r('الإجابة هي لا.', { color: C.coral }), r(' في هذه الحالة تتفاعل '), r('ذرّتين من البوتاسيوم', { color: C.purple }), r(' مع '), r('ذرّة واحدة من الأكسجين', { color: C.teal }), r(' لتكوين أكسيد البوتاسيوم كما يلي:')],
    0.8, 2.05, 11.8, 1.4, { fontSize: 27 }, 'wipeR', 'after', 1500);
  img('eq_k2o_b.png', 1.4, 3.85, 10.5, null, 'zoom', 'click', 900);

  // 22 ── ملاحظة: طريقة التقاطع ───────────────────────────
  newSlide(); title('ملاحظة', 'sp_coral', C.coral, 4.3);
  img('warn.png', 0.6, 1.85, 1.3, null, 'zoom', 'after', 600);
  box(4.4, 1.85, 8.45, 4.85, { fill: 'E3F2FC', rad: 0.3 }, 'flyR', 'after', 500);
  text([r('لجعل الأمر أكثر سهولة يمكن تطبيق '), r('طريقة التقاطع', { color: C.blue }), r('، بمعنى أنه إذا كان عدد إلكترونات التكافؤ التي تفقدها ذرة الفلز '), r('لا يساوي', { color: C.coral }),
    r(' عدد الإلكترونات اللازمة لاستقرار ذرة اللافلز أو العكس، نقوم بإبدال الإلكترونات لذرات العناصر المتفاعلة وكتابة العدد أمام الذرة المقابلة، (مع الاختصار في حال وجود عامل مشترك).')],
    4.6, 1.95, 8.05, 4.65, { fontSize: 25, valign: 'middle' }, 'wipeR', 'after', 2200);
  cur.addText('تحقق من صحّة المعادلة بحساب عدد الشحنات الإلكترونية في طرفي المعادلة.', reg({ x: 0.75, y: 3.35, w: 3.3, h: 2.9, shape: pres.ShapeType.rect, fill: { color: 'F2B66B' }, rotate: -4,
    shadow: { type: 'outer', color: '7A4A10', opacity: 0.35, blur: 10, offset: 6, angle: 90 }, fontFace: FONT, bold: true, fontSize: 21, color: '4A2C0A', align: 'center', valign: 'middle', rtlMode: true, lang: 'ar-KW', margin: 10, isTextBox: true }, 'zoom', 'click', 700));
  img('sp_blue.png', 2.15, 3.1, 0.5, 0.5, 'flyB', 'with', 500, 300);

  // 23-24 ── مثال (5) ───────────────────────────────────────
  newSlide(); title('مثال (5)', 'sp_blue', C.blue, 4.3);
  box(0.5, 1.85, 12.35, 4.9, { line: 'A9D6F2', lw: 6, fill: 'EEF8FF', rad: 0.4 }, 'zoom', 'after', 600);
  text('وضّح بطريقة الترتيب الإلكتروني النقطي كيفيّة ارتباط الليثيوم مع النيتروجين لتكوين نيتريد الليثيوم.', 0.8, 1.95, 11.8, 0.95, { fontSize: 24, color: C.blue }, 'wipeR', 'after', 1200);
  text('الحــل:', 10.4, 2.9, 2.2, 0.55, { fontSize: 26, color: C.coral }, 'fade', 'after', 400);
  img('eq_li3n_a.png', 4.6, 2.85, null, 2.35, 'zoom', 'click', 800);
  text([r('لاحظ أن ذرّة الليثيوم '), r('تفقد إلكترونًا واحدًا', { color: C.coral }), r(' لتصل إلى حالة الاستقرار، بينما ذرّة النيتروجين '), r('تحتاج إلى اكتساب ثلاث إلكترونات', { color: C.coral }), r(' لتصل إلى الاستقرار. نقوم بإبدال عدد الإلكترونات وكتابتها أمام الذرة المقابلة كما يلي:')],
    0.8, 5.25, 11.8, 1.45, { fontSize: 22 }, 'wipeR', 'after', 1800);

  newSlide(); title('مثال (5)', 'sp_blue', C.blue, 4.3);
  box(0.5, 1.85, 12.35, 4.85, { line: 'A9D6F2', lw: 6, fill: 'EEF8FF', rad: 0.4 }, 'zoom', 'after', 600);
  text('نقوم بإبدال عدد الإلكترونات وكتابتها أمام الذرة المقابلة:', 0.8, 2.05, 11.8, 0.8, { fontSize: 27, color: C.blue }, 'wipeR', 'after', 1100);
  img('eq_li3n_a.png', 0.9, 2.95, null, 1.7, 'fade', 'after', 500);
  img('eq_li3n_b.png', 1.4, 4.85, 10.5, null, 'zoom', 'click', 900);

  // 25 ── تمرين (3) ─────────────────────────────────────────
  newSlide(); title('تمرين (3)', 'sp_coral', C.coral, 4.3);
  exercise('وضّح بطريقة الترتيب الإلكتروني النقطي كيفيّة ارتباط الكالسيوم مع الفلور .', 'eq_caf2.png', 'أيونية', 'فلوريد الكالسيوم');

  await pres.writeFile({ fileName: OUT });
  fs.writeFileSync(OUT.replace(/\.pptx$/, '.anim.json'), JSON.stringify(ANIM, null, 1));
  console.log('written', OUT, ANIM.length, 'slides');
}
build();
