// يولّد أوراق استيكرات A4 (3 أعمدة × 8 صفوف، كل استيكر 70×35 ملم) للأسبوع العربي للكيمياء، وورقة اختبار للمقاس.
// التشغيل: node src/stickers.js  → stickers/استيكرات-A4.pdf و stickers/اختبار-المقاس.pdf وصور معاينة
// إذا كان مقاس الاستيكر مختلفاً عدّل LABEL أدناه؛ الهامش العلوي يُحسب تلقائياً ليتوسط الصفوف في الورقة.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'stickers');
const HTML_DIR = path.join(ROOT, 'build', 'stickers');
const fontUrl = f => 'file://' + path.join(ROOT, 'assets', 'fonts', f);

// ارتفاع الاستيكر قابل للتغيير: LABEL_H=36 node src/stickers.js (الورق المكتوب عليه 70×35 يأتي أحياناً بصفوف 36 أو 37 ملم)
const LABEL = { w: 70, h: parseFloat(process.env.LABEL_H || '35'), cols: 3, rows: 8 };
const SUFFIX = `-ارتفاع-${LABEL.h}`;
// صور بنسبة 3:4 بلا هوامش (3×8 استيكرات تملأ الصورة)، مثل الصورة التي طُبعت مضبوطة من الجوال
const IMAGE = process.env.IMAGE !== '0';  // الافتراضي: الصور (المقاس المضبوط)؛ IMAGE=0 لملفات PDF
const PAGE = IMAGE ? { w: LABEL.w * LABEL.cols, h: LABEL.h * LABEL.rows } : { w: 210, h: 297 };
const MX = (PAGE.w - LABEL.w * LABEL.cols) / 2, MY = (PAGE.h - LABEL.h * LABEL.rows) / 2;
// المسافة الآمنة: التصميم يبعد عن حافة الاستيكر بهذا المقدار حتى لا يخرج عنه إذا انزاحت الطباعة قليلاً
const SAFE = IMAGE ? { x: 3.5, y: 2.8 } : { x: 4.5, y: 3.2 };
// تصغير التصميم داخل الاستيكر ورفعه قليلاً، ليبقى بعيداً عن الحواف حتى لو انزاحت الطباعة
const CARD_SCALE = parseFloat(process.env.CARD_SCALE || (IMAGE ? '1' : '0.75'));
const SHIFT_UP = parseFloat(process.env.SHIFT_UP || (IMAGE ? '0' : '2'));
const CARD_T = `translateY(${-SHIFT_UP}mm) scale(${CARD_SCALE})`;

// تعويض تصغير/إزاحة الطابعة: تُقاس الأرقام بالمسطرة على «ورقة القياس» المطبوعة ثم تُمرَّر هكذا:
// TOP=9 HEIGHT=272 LEFT=15.5 WIDTH=176 node src/stickers.js
// TOP: من حافة الورقة العليا إلى الخط 1 (الصحيح 8.5)، HEIGHT: بين الخط 1 والخط 2 (الصحيح 280)،
// LEFT: من حافة الورقة اليسرى إلى الخط 3 (الصحيح 15)، WIDTH: بين الخط 3 والخط 4 (الصحيح 180).
const CAL = { top: MY, height: LABEL.h * LABEL.rows, left: 15, width: PAGE.w - 30 };
const num = (k, d) => process.env[k] ? parseFloat(process.env[k]) : d;
const meas = { top: num('TOP', CAL.top), height: num('HEIGHT', CAL.height), left: num('LEFT', CAL.left), width: num('WIDTH', CAL.width) };
// الطابعة ترسم النقطة y في: oy + sy*y ؛ نعكس ذلك حتى تقع كل نقطة في مكانها الصحيح
const sy = meas.height / CAL.height, sx = meas.width / CAL.width;
const oy = meas.top - sy * CAL.top, ox = meas.left - sx * CAL.left;
const FIX = `translate(${-ox / sx}mm,${-oy / sy}mm) scale(${1 / sx},${1 / sy})`;
const COMPENSATED = ['TOP', 'HEIGHT', 'LEFT', 'WIDTH'].some(k => process.env[k]);

// ---------- أيقونات (SVG بإطار 64×64) ----------
const svg = (body, s = 20) => `<svg width="${s}mm" height="${s}mm" viewBox="0 0 64 64">${body}</svg>`;
const IC = {
  flask: (c1, c2) => `<path d="M24 6h16M27 6v18L11 52c-2 5 1 8 6 8h30c5 0 8-3 6-8L37 24V6" fill="#fff" stroke="${c1}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M16 44h32l5 9c1 4-1 6-5 6H16c-4 0-6-2-5-6Z" fill="${c2}"/><circle cx="26" cy="50" r="2.5" fill="#fff" opacity=".8"/><circle cx="36" cy="47" r="1.8" fill="#fff" opacity=".8"/>
    <circle cx="44" cy="14" r="3" fill="${c2}"/><circle cx="50" cy="6" r="2" fill="${c1}"/>`,
  atom: (c1, c2) => `<g fill="none" stroke="${c1}" stroke-width="3"><ellipse cx="32" cy="32" rx="27" ry="10"/><ellipse cx="32" cy="32" rx="27" ry="10" transform="rotate(60 32 32)"/><ellipse cx="32" cy="32" rx="27" ry="10" transform="rotate(-60 32 32)"/></g>
    <circle cx="32" cy="32" r="7" fill="${c2}"/><circle cx="59" cy="32" r="3.5" fill="${c2}"/><circle cx="18.5" cy="8.6" r="3.5" fill="${c2}"/><circle cx="18.5" cy="55.4" r="3.5" fill="${c2}"/>`,
  tubes: (c1, c2, c3 = '#f2b600') => `<rect x="6" y="40" width="52" height="7" rx="2" fill="#b07a3c"/>
    ${[[14, c1], [32, c2], [50, c3]].map(([x, c]) => `<rect x="${x - 6}" y="8" width="12" height="50" rx="6" fill="#fff" stroke="#6b7a8c" stroke-width="2.5"/><rect x="${x - 4}" y="28" width="8" height="28" rx="4" fill="${c}"/>`).join('')}`,
  beaker: (c1, c2) => `<path d="M12 8h40M15 8v46c0 3 2 5 5 5h24c3 0 5-2 5-5V8" fill="#fff" stroke="${c1}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M17 34h30v20c0 2-1 3-3 3H20c-2 0-3-1-3-3Z" fill="${c2}"/><path d="M38 14h8M40 21h6M38 28h8" stroke="${c1}" stroke-width="2.5"/>
    <circle cx="26" cy="44" r="3" fill="#fff" opacity=".8"/><circle cx="33" cy="26" r="2.5" fill="${c2}"/><circle cx="27" cy="18" r="2" fill="${c2}"/>`,
  molecule: (c1, c2) => `<g stroke="#6b7a8c" stroke-width="3.5" fill="none"><path d="M18 20L34 34L50 18M34 34L30 52"/></g>
    <circle cx="34" cy="34" r="9" fill="${c1}"/><circle cx="18" cy="20" r="7" fill="${c2}"/><circle cx="50" cy="18" r="7" fill="${c2}"/><circle cx="30" cy="52" r="7" fill="${c2}"/>
    <circle cx="31" cy="31" r="2.5" fill="#fff" opacity=".7"/>`,
  heartFlask: (c1, c2) => `<path d="M24 6h16M27 6v16L11 52c-2 5 1 8 6 8h30c5 0 8-3 6-8L37 22V6" fill="#fff" stroke="${c1}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M32 54c-9-6-14-10-14-16a6.5 6.5 0 0 1 14-2a6.5 6.5 0 0 1 14 2c0 6-5 10-14 16Z" fill="${c2}"/>
    <path d="M46 10c-3-2-5-3-5-5a2.3 2.3 0 0 1 5-1a2.3 2.3 0 0 1 5 1c0 2-2 3-5 5Z" fill="${c2}"/>`,
  table: () => {
    const cols = ['#ff6b6b', '#ff922b', '#f2b600', '#40c057', '#339af0', '#845ef7'];
    let s = '';
    for (let r = 0; r < 6; r++) for (let g = 0; g < 18; g++) {
      if (r === 0 && g > 0 && g < 17) continue;
      if (r < 3 && g > 1 && g < 12) continue;
      const c = g < 2 ? cols[g] : g > 11 ? cols[Math.min(5, g - 12)] : '#ced4da';
      s += `<rect x="${1 + g * 3.5}" y="${12 + r * 3.5}" width="3" height="3" rx=".6" fill="${c}"/>`;
    }
    return s;
  },
  heartAtom: (c1, c2) => `<g fill="none" stroke="${c1}" stroke-width="3"><ellipse cx="32" cy="32" rx="27" ry="10" transform="rotate(30 32 32)"/><ellipse cx="32" cy="32" rx="27" ry="10" transform="rotate(-30 32 32)"/></g>
    <path d="M32 42c-8-5-12-8-12-13a5.5 5.5 0 0 1 12-2a5.5 5.5 0 0 1 12 2c0 5-4 8-12 13Z" fill="${c2}"/>`,
  hex: (c1, c2) => `<g fill="none" stroke="${c1}" stroke-width="3" stroke-linejoin="round"><path d="M22 14L36 6L50 14V30L36 38L22 30Z"/><path d="M27 17L36 12M45 17V27M27 27L36 32"/>
    <path d="M22 30L10 38V49M50 30L58 38"/></g><circle cx="58" cy="38" r="5" fill="${c2}"/><circle cx="10" cy="54" r="5" fill="${c2}"/>`,
  drop: (c1, c2) => `<path d="M32 4C22 20 14 30 14 40a18 18 0 0 0 36 0C50 30 42 20 32 4Z" fill="${c2}" stroke="${c1}" stroke-width="3"/><path d="M24 40a8 8 0 0 0 8 9" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`,
  bolt: (c1, c2) => `<circle cx="32" cy="32" r="27" fill="${c2}" opacity=".25"/><path d="M36 6L16 36h14l-4 22l22-32H34Z" fill="${c2}" stroke="${c1}" stroke-width="3" stroke-linejoin="round"/>`,
  moon: (c1, c2) => `<path d="M40 6a26 26 0 1 0 18 40A21 21 0 0 1 40 6Z" fill="${c2}" stroke="${c1}" stroke-width="3"/><circle cx="50" cy="14" r="2.5" fill="${c1}"/><circle cx="56" cy="26" r="1.8" fill="${c1}"/><path d="M14 8l1.5 4l4 1.5l-4 1.5l-1.5 4l-1.5-4l-4-1.5l4-1.5Z" fill="${c1}"/>`,
  smile: (c1, c2) => `<circle cx="32" cy="32" r="26" fill="${c2}" stroke="${c1}" stroke-width="3"/><circle cx="23" cy="26" r="3.5" fill="${c1}"/><circle cx="41" cy="26" r="3.5" fill="${c1}"/><path d="M19 38c4 9 22 9 26 0" fill="none" stroke="${c1}" stroke-width="3.5" stroke-linecap="round"/>`,
};

// بطاقة عنصر صغيرة
const tile = (sym, z, name, c, s = 15) => `<div class="tile" style="width:${s}mm;height:${s}mm;background:linear-gradient(150deg,${c[0]},${c[1]})">
  <span class="tz" style="font-size:${s * .17}mm">${z}</span><span class="ts" style="font-size:${s * .44}mm">${sym}</span>${s >= 10 ? `<span class="tn" style="font-size:${s * .15}mm">${name}</span>` : ''}</div>`;

const C = {
  purple: { bg: '#f4effe', ring: '#8b6be0', ink: '#3d2a84', a: '#b197fc', b: '#e64980' },
  orange: { bg: '#fff5e8', ring: '#f2a541', ink: '#7a3e00', a: '#4c6ef5', b: '#ff922b' },
  green: { bg: '#eefaf1', ring: '#3fa75b', ink: '#1d5e30', a: '#e64980', b: '#339af0' },
  blue: { bg: '#edf4ff', ring: '#4c7fd9', ink: '#1f3f80', a: '#4c6ef5', b: '#74c0fc' },
  pink: { bg: '#fff0f5', ring: '#e07aa0', ink: '#8a1f4a', a: '#e64980', b: '#f783ac' },
  teal: { bg: '#e9faf7', ring: '#20a99a', ink: '#0d5c54', a: '#12b886', b: '#fab005' },
  red: { bg: '#fff1f0', ring: '#e8665d', ink: '#8c221b', a: '#e8665d', b: '#ff8787' },
  indigo: { bg: '#eff0ff', ring: '#5c62d6', ink: '#262a7a', a: '#5c62d6', b: '#ffd43b' },
};
const TILE = {
  ar: ['#ff8fab', '#e64980'], he: ['#ffd8a8', '#ff922b'], au: ['#ffe066', '#e0a800'], o: ['#a5d8ff', '#339af0'],
  ti: ['#ced4da', '#868e96'], ne: ['#eebefa', '#be4bdb'], cu: ['#ffc9a0', '#d9480f'], te: ['#b2f2bb', '#2f9e44'],
};

// كل تصميم: لون، أيقونة (SVG أو بطاقة عنصر)، عنوان، سطر فرعي، وصيغة كيميائية اختيارية
const ARAB = 'الأسبوع العربي<br>للكيمياء';
// كلمات تُكتب برموز عناصر حقيقية فقط: [الكلمة، [[الرمز، العدد الذري]...]، المعنى]
const WORDS = [
  ['Genius', [['Ge', 32], ['Ni', 28], ['U', 92], ['S', 16]], 'عبقري'],
  ['Brain', [['B', 5], ['Ra', 88], ['In', 49]], 'عقل'],
  ['Think', [['Th', 90], ['In', 49], ['K', 19]], 'فكّر'],
  ['Hero', [['H', 1], ['Er', 68], ['O', 8]], 'بطل'],
  ['Bravo', [['B', 5], ['Ra', 88], ['V', 23], ['O', 8]], 'أحسنت'],
  ['Wow', [['W', 74], ['O', 8], ['W', 74]], 'رائع!'],
  ['Life', [['Li', 3], ['Fe', 26]], 'حياة'],
  ['Honey', [['Ho', 67], ['Ne', 10], ['Y', 39]], 'عسل'],
  ['Banana', [['Ba', 56], ['Na', 11], ['Na', 11]], 'موز'],
  ['Care', [['Ca', 20], ['Re', 75]], 'اهتمام'],
  ['Kind', [['K', 19], ['I', 53], ['Nd', 60]], 'لطيف'],
  ['Nice', [['Ni', 28], ['Ce', 58]], 'جميل'],
  ['Hearts', [['He', 2], ['Ar', 18], ['Ts', 117]], 'قلوب'],
  ['Yes', [['Y', 39], ['Es', 99]], 'نعم'],
  ['Fun', [['F', 9], ['U', 92], ['N', 7]], 'مرح'],
  ['Team', [['Te', 52], ['Am', 95]], 'فريق'],
  ['Sis', [['Si', 14], ['S', 16]], 'أختي'],
  ['Snack', [['Sn', 50], ['Ac', 89], ['K', 19]], 'وجبة خفيفة'],
  ['Nora', [['No', 102], ['Ra', 88]], 'نورة'],
  ['Mona', [['Mo', 42], ['Na', 11]], 'منى'],
  ['Layla', [['La', 57], ['Y', 39], ['La', 57]], 'ليلى'],
  ['Lulu', [['Lu', 71], ['Lu', 71]], 'لولو'],
  ['Ruba', [['Ru', 44], ['Ba', 56]], 'ربى'],
  ['Rana', [['Ra', 88], ['Na', 11]], 'رنا'],
  ['Unicorn', [['U', 92], ['Ni', 28], ['Co', 27], ['Rn', 86]], 'يونيكورن'],
  ['Rainbow', [['Ra', 88], ['In', 49], ['B', 5], ['O', 8], ['W', 74]], 'قوس قزح'],
  ['Popcorn', [['Po', 84], ['P', 15], ['Co', 27], ['Rn', 86]], 'فشار'],
  ['Princess', [['Pr', 59], ['In', 49], ['Ce', 58], ['S', 16], ['S', 16]], 'أميرة'],
  ['Physics', [['P', 15], ['H', 1], ['Y', 39], ['Si', 14], ['Cs', 55]], 'فيزياء'],
  ['Flask', [['F', 9], ['La', 57], ['S', 16], ['K', 19]], 'دورق'],
  ['Bunsen', [['B', 5], ['U', 92], ['N', 7], ['Se', 34], ['N', 7]], 'موقد بنسن'],
  ['Carbon', [['C', 6], ['Ar', 18], ['B', 5], ['O', 8], ['N', 7]], 'كربون'],
  ['Neon', [['Ne', 10], ['O', 8], ['N', 7]], 'نيون'],
  ['Books', [['B', 5], ['O', 8], ['O', 8], ['K', 19], ['S', 16]], 'كتب'],
  ['Notes', [['N', 7], ['O', 8], ['Te', 52], ['S', 16]], 'ملاحظات'],
  ['Bunny', [['B', 5], ['U', 92], ['N', 7], ['N', 7], ['Y', 39]], 'أرنوب'],
  ['Pink', [['P', 15], ['In', 49], ['K', 19]], 'وردي'],
  ['Iris', [['Ir', 77], ['I', 53], ['S', 16]], 'زهرة السوسن'],
  ['Moon', [['Mo', 42], ['O', 8], ['N', 7]], 'قمر'],
  ['Sunny', [['S', 16], ['U', 92], ['N', 7], ['N', 7], ['Y', 39]], 'مشمس'],
  ['Choco', [['C', 6], ['Ho', 67], ['Co', 27]], 'شوكولا'],
  ['Sushi', [['S', 16], ['U', 92], ['S', 16], ['H', 1], ['I', 53]], 'سوشي'],
  ['Lunch', [['Lu', 71], ['N', 7], ['C', 6], ['H', 1]], 'غداء'],
  ['Chef', [['C', 6], ['He', 2], ['F', 9]], 'طبّاخ'],
  ['Win', [['W', 74], ['In', 49]], 'فوز'],
  ['Spark', [['S', 16], ['P', 15], ['Ar', 18], ['K', 19]], 'تألّق'],
  ['Cute', [['C', 6], ['U', 92], ['Te', 52]], 'لطيف'],
  ['Bonbon', [['B', 5], ['O', 8], ['Nb', 41], ['O', 8], ['N', 7]], 'حلوى'],
  ['Noura', [['N', 7], ['O', 8], ['U', 92], ['Ra', 88]], 'نورة'],
  ['Amal', [['Am', 95], ['Al', 13]], 'أمل'],
  ['Nawal', [['Na', 11], ['W', 74], ['Al', 13]], 'نوال'],
  ['Lina', [['Li', 3], ['Na', 11]], 'لينا'],
];
const AR_NAME = { Ge: 'جرمانيوم', Ni: 'نيكل', U: 'يورانيوم', S: 'كبريت', B: 'بورون', Ra: 'راديوم', In: 'إنديوم', Th: 'ثوريوم', K: 'بوتاسيوم',
  H: 'هيدروجين', Er: 'إربيوم', O: 'أكسجين', V: 'فاناديوم', W: 'تنجستن', Li: 'ليثيوم', Fe: 'حديد', Ho: 'هولميوم', Ne: 'نيون', Y: 'إتريوم',
  Ba: 'باريوم', Na: 'صوديوم', Ca: 'كالسيوم', Re: 'رينيوم', I: 'يود', Nd: 'نيوديميوم', Ce: 'سيريوم', He: 'هيليوم', Ar: 'أرجون', Ts: 'تينيسين',
  Es: 'أينشتاينيوم', F: 'فلور', N: 'نيتروجين', Te: 'تيلوريوم', Am: 'أمريسيوم', Si: 'سيليكون', Sn: 'قصدير', Ac: 'أكتينيوم', No: 'نوبليوم',
  Mo: 'موليبدنوم', La: 'لانثانوم', Lu: 'لوتيشيوم', Ru: 'روثينيوم', Co: 'كوبالت', Rn: 'رادون', Po: 'بولونيوم', P: 'فوسفور', Pr: 'براسيوديميوم', Cs: 'سيزيوم', Se: 'سيلينيوم', Ir: 'إيريديوم', Nb: 'نيوبيوم', Al: 'ألومنيوم' };
const TILE_COLORS = [['#ff8fab', '#e64980'], ['#ffc078', '#f76707'], ['#ffe066', '#e0a800'], ['#8ce99a', '#2f9e44'], ['#66d9e8', '#1098ad'], ['#91a7ff', '#4263eb'], ['#d0bfff', '#7048e8'], ['#fcc2d7', '#d6336c']];
// ترتيب الورقة (24 استيكر)، والكلمات المفضلة مكررة
const WORD_SHEET = ['Genius', 'Brain', 'Think', 'Bravo', 'Wow', 'Hero', 'Genius', 'Brain', 'Bravo', 'Life', 'Honey', 'Banana',
  'Think', 'Wow', 'Genius', 'Kind', 'Nice', 'Hearts', 'Brain', 'Bravo', 'Snack', 'Nora', 'Mona', 'Lulu'];
const IDEAS = ['Physics', 'Flask', 'Bunsen', 'Carbon', 'Neon', 'Books', 'Notes', 'Bunny', 'Pink', 'Iris', 'Moon', 'Sunny',
  'Choco', 'Sushi', 'Lunch', 'Chef', 'Win', 'Spark', 'Cute', 'Bonbon', 'Noura', 'Amal', 'Nawal', 'Lina'];
const FUN_SHEET = Array.from({ length: 24 }, (_, i) => ['Unicorn', 'Rainbow', 'Popcorn', 'Princess'][i % 4]);
function wordItems(order = WORD_SHEET) {
  const pal = [C.pink, C.orange, C.indigo, C.green, C.teal, C.blue, C.purple, C.red];
  return order.map(w => WORDS.find(x => x[0] === w)).map(([word, els, ar], i) => {
    const size = els.length === 2 ? 11.5 : els.length === 3 ? 9.4 : els.length === 4 ? 7.6 : 5.9;
    const tiles = els.map(([sym, z], j) => tile(sym, z, AR_NAME[sym], TILE_COLORS[(i + j * 3) % TILE_COLORS.length], size)).join('');
    return { c: pal[Math.floor(i / 3) % pal.length], art: `<div class="tiles${els.length >= 5 ? ' tight' : ''}">${tiles}</div>`, small: true,
      t: `<span dir="ltr" class="word${word.length >= 7 ? ' long' : ''}">${word}</span>`, s: `<span dir="ltr" class="eq${els.length >= 5 ? ' long' : ''}">${els.map(e => e[0]).join(' + ')}</span><br>${ar}` };
  });
}

const SHEETS = [
  { name: 'الأسبوع العربي للكيمياء', items: [
    { c: C.pink, art: tile('Ar', 18, 'أرجون', TILE.ar), t: ARAB, s: 'أرجون… عنصرنا العربي' },
    { c: C.purple, art: svg(IC.flask('#8b6be0', '#b197fc')), t: ARAB, s: 'حيث تبدأ التفاعلات' },
    { c: C.orange, art: svg(IC.atom('#4c6ef5', '#ff922b')), t: ARAB, s: 'كل شيء حولنا كيمياء' },
    { c: C.green, art: svg(IC.tubes('#e64980', '#339af0')), t: ARAB, s: 'نجرّب… نكتشف… نبدع' },
    { c: C.blue, art: svg(IC.table(), 22), t: ARAB, s: '118 عنصراً من الإبداع' },
    { c: C.teal, art: svg(IC.molecule('#12b886', '#fab005')), t: ARAB, s: 'معادلة النجاح: علم + شغف' },
    { c: C.red, art: svg(IC.beaker('#e8665d', '#ff8787')), t: ARAB, s: 'العلم نور' },
    { c: C.indigo, art: svg(IC.heartFlask('#5c62d6', '#ff6b9a')), t: ARAB, s: 'نحب الكيمياء' },
  ] },
  { name: 'كيمياء المشاعر', items: [
    { c: C.pink, art: svg(IC.heartFlask('#e07aa0', '#e64980')), t: 'كيمياء<br>الحب', s: 'بيننا رابطة لا تنكسر' },
    { c: C.orange, art: tile('He', 2, 'هيليوم', TILE.he), t: 'كيمياء<br>السعادة', s: 'خفيفة مثل الهيليوم' },
    { c: C.indigo, art: tile('Au', 79, 'ذهب', TILE.au), t: 'كيمياء<br>الجمال', s: 'تلمع مثل الذهب' },
    { c: C.purple, art: svg(IC.heartAtom('#8b6be0', '#e64980')), t: 'كيمياء<br>المشاعر', s: 'تفاعل يبدأ من القلب' },
    { c: C.teal, art: svg(IC.molecule('#12b886', '#4dabf7')), t: 'كيمياء<br>الصداقة', s: 'رابطة تساهمية: نتشارك كل شيء' },
    { c: C.blue, art: tile('O', 8, 'أكسجين', TILE.o), t: 'كيمياء<br>الأمل', s: 'الأمل أكسجين الحياة' },
    { c: C.green, art: tile('Ti', 22, 'تيتانيوم', TILE.ti), t: 'كيمياء<br>النجاح', s: 'عزيمة من تيتانيوم' },
    { c: C.red, art: tile('Ne', 10, 'نيون', TILE.ne), t: 'كيمياء<br>الهدوء', s: 'مستقرة مثل الغازات النبيلة' },
  ] },
  { name: 'هرمونات وعبارات', items: [
    { c: C.orange, art: svg(IC.smile('#e67700', '#ffe066')), t: 'هرمون السعادة', s: 'السيروتونين', f: 'C10H12N2O' },
    { c: C.pink, art: svg(IC.heartAtom('#e07aa0', '#e64980')), t: 'هرمون الحب', s: 'الأوكسيتوسين', f: 'C43H66N12O12S2' },
    { c: C.purple, art: svg(IC.hex('#8b6be0', '#f783ac')), t: 'هرمون الفرح', s: 'الدوبامين', f: 'C8H11NO2' },
    { c: C.indigo, art: svg(IC.moon('#5c62d6', '#ffd43b')), t: 'هرمون النوم', s: 'الميلاتونين', f: 'C13H16N2O2' },
    { c: C.red, art: svg(IC.bolt('#c92a2a', '#ff8787')), t: 'هرمون الحماس', s: 'الأدرينالين', f: 'C9H13NO3' },
    { c: C.green, art: svg(IC.smile('#2f9e44', '#b2f2bb')), t: 'الإندورفين', s: 'يُفرَز مع الضحك والرياضة' },
    { c: C.teal, art: `<div class="tiles">${tile('Cu', 29, 'نحاس', TILE.cu, 12.5)}${tile('Te', 52, 'تيلوريوم', TILE.te, 12.5)}</div>`, t: '<span dir="ltr">Cu + Te = Cute</span>', s: 'كيمياء… بس لطيفة!', small: true },
    { c: C.blue, art: svg(IC.drop('#1c7ed6', '#74c0fc')), t: 'الماء سرّ الحياة', s: 'جسمك حوالي <span dir="ltr">60%</span> ماء', f: 'H2O' },
  ] },
  { name: 'كلمات من الجدول الدوري', unique: true, items: wordItems() },
  { name: 'يونيكورن وقوس قزح', unique: true, items: wordItems(FUN_SHEET) },
  { name: 'أفكار للاختيار', unique: true, preview: true, items: wordItems(IDEAS).map((d, i) => ({ ...d, n: i + 1 })) },
];

const formula = f => `<span class="formula" dir="ltr">${f.replace(/(\d+)/g, '<sub>$1</sub>')}</span>`;
function sticker(d) {
  const { c } = d;
  return `<div class="label"><div class="card" style="background:${c.bg};border-color:${c.ring}">
    ${d.n ? `<div class="num" style="background:${c.ring}">${d.n}</div>` : ''}<div class="spark" style="color:${c.ring}">✦</div><div class="spark s2" style="color:${c.ring}">✦</div>
    <div class="txt" style="color:${c.ink}">
      <div class="t ${d.small ? 'sm' : ''}">${d.t}</div>
      <div class="brush" style="background:linear-gradient(90deg,transparent,${c.ring})"></div>
      <div class="s">${d.s}${d.f ? '<br>' + formula(d.f) : ''}</div></div>
    <div class="art">${d.art}</div></div></div>`;
}

const sheet = sh => `<section class="page"><div class="sheet">${(sh.unique ? sh.items : sh.items.flatMap(d => [d, d, d])).map(sticker).join('')}</div></section>`;

function calSheet() {
  const ln = (style, n) => `<div class="cal" style="${style}"><b>${n}</b></div>`;
  return `<section class="page"><div class="sheet calsheet">
    ${ln(`left:0;right:0;top:${CAL.top}mm;height:0;border-top:.3mm solid #000`, '1')}
    ${ln(`left:0;right:0;top:${CAL.top + CAL.height}mm;height:0;border-top:.3mm solid #000`, '2')}
    ${ln(`top:0;bottom:0;left:${CAL.left}mm;width:0;border-left:.3mm solid #000`, '3')}
    ${ln(`top:0;bottom:0;left:${CAL.left + CAL.width}mm;width:0;border-left:.3mm solid #000`, '4')}
    <div class="calbox">
      <div class="calt">ورقة القياس</div>
      <p>تُطبع على ورق عادي، ثم تُقاس هذه المسافات بالمسطرة بالملّيمتر:</p>
      <table>
        <tr><th>المسافة</th><th>الصحيح</th><th>المقاس</th></tr>
        <tr><td>من حافة الورقة العليا إلى الخط 1</td><td>8.5 ملم</td><td></td></tr>
        <tr><td>من الخط 1 إلى الخط 2</td><td>280 ملم</td><td></td></tr>
        <tr><td>من حافة الورقة اليسرى إلى الخط 3</td><td>15 ملم</td><td></td></tr>
        <tr><td>من الخط 3 إلى الخط 4</td><td>180 ملم</td><td></td></tr>
      </table>
      <p>إذا كانت كلها صحيحة فالطباعة مضبوطة. وإذا اختلفت، تُرسل الأرقام الأربعة ليُضبط ملف الاستيكرات على هذه الطابعة.</p>
    </div></div></section>`;
}

function testSheet() {
  let s = '';
  for (let i = 0; i < LABEL.cols * LABEL.rows; i++) s += `<div class="label test"><div class="safe"></div><span>${i + 1}</span></div>`;
  return `<section class="page"><div class="sheet">${s}</div><div class="note">تُطبع هذه الورقة على ورق عادي بمقاس «الحجم الفعلي <span dir="ltr">100%</span>»، ثم توضع فوق ورقة الاستيكر مقابل الضوء: الخط الأسود هو حدود الاستيكر، والمستطيل المتقطع هو مكان التصميم.</div></section>`;
}

const CSS = `
@font-face{font-family:Cairo;font-weight:700;src:url(${fontUrl('cairo-arabic-700-normal.woff2')})}
@font-face{font-family:Cairo;font-weight:800;src:url(${fontUrl('cairo-arabic-800-normal.woff2')})}
@font-face{font-family:Lalezar;src:url(${fontUrl('lalezar-arabic-400-normal.woff2')})}
@font-face{font-family:Lalezar;src:url(${fontUrl('lalezar-latin-400-normal.woff2')});unicode-range:U+0000-00FF}
@font-face{font-family:Pop;font-weight:700;src:url(${fontUrl('poppins-latin-700-normal.woff2')})}
@font-face{font-family:Pop;font-weight:800;src:url(${fontUrl('poppins-latin-800-normal.woff2')})}
@page{size:A4;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Cairo;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:${PAGE.w}mm;height:${PAGE.h}mm;page-break-after:always;overflow:hidden;position:relative;background:#fff}
.sheet{width:${PAGE.w}mm;height:${PAGE.h}mm;padding:${MY}mm ${MX}mm;display:grid;direction:ltr;transform-origin:0 0;transform:${FIX};
  grid-template-columns:repeat(${LABEL.cols},${LABEL.w}mm);grid-template-rows:repeat(${LABEL.rows},${LABEL.h}mm);position:relative}
.calsheet{display:block;padding:0}
.cal{position:absolute}
.cal b{position:absolute;font:800 4mm Pop;background:#fff;padding:0 1mm;top:-2.6mm;left:40mm}
.cal[style*="border-left"] b{top:60mm;left:-2.4mm}
.calbox{position:absolute;left:30mm;right:30mm;top:80mm;direction:rtl;font:700 4mm/1.7 Cairo;color:#212529}
.calt{font:800 7mm Cairo;margin-bottom:2mm}
.calbox table{width:100%;border-collapse:collapse;margin:3mm 0 4mm}
.calbox td,.calbox th{border:.3mm solid #adb5bd;padding:1.5mm 2.5mm;text-align:right}
.calbox td:last-child{width:28mm}
.label{width:${LABEL.w}mm;height:${LABEL.h}mm;padding:${SAFE.y}mm ${SAFE.x}mm;position:relative}
.card{width:100%;height:100%;border:.6mm solid;border-radius:5mm;display:flex;align-items:center;gap:1.5mm;padding:0 2.6mm 0 3mm;position:relative;overflow:hidden;direction:rtl;transform:${CARD_T}}
.txt{flex:1;text-align:center;min-width:0}
.t{font-family:Lalezar;font-size:5.4mm;line-height:1.08}
.t.sm{font-size:4.6mm}
.word{font-family:Pop;font-weight:800;font-size:5mm;letter-spacing:.1mm}
.word.long{font-size:4.1mm}
.eq.long{font-size:2mm}
.num{position:absolute;top:1mm;right:1.6mm;min-width:4.6mm;height:4.6mm;border-radius:3mm;color:#fff;font:800 2.7mm/4.6mm Pop;text-align:center;padding:0 .8mm;z-index:2}
.tiles.tight{gap:.6mm}
.eq{font-family:Pop;font-weight:700;font-size:2.4mm;white-space:nowrap}
.brush{height:.9mm;width:62%;margin:1mm auto .6mm;border-radius:1mm}
.s{font-weight:800;font-size:2.7mm;line-height:1.35}
.formula{font-family:Pop;font-weight:700;font-size:2.5mm;white-space:nowrap}
.formula sub{font-size:.75em;vertical-align:-.25em}
.art{flex:none;display:flex;align-items:center;justify-content:center}
.tiles{display:flex;gap:1mm;direction:ltr}
.tile{border-radius:2.4mm;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;box-shadow:inset 0 -.5mm 0 rgba(0,0,0,.15);text-shadow:0 .2mm .3mm rgba(0,0,0,.2)}
.tz{position:absolute;top:6%;left:10%;font-family:Pop;font-weight:700}
.ts{font-family:Pop;font-weight:800;line-height:1;margin-top:8%}
.tn{font-weight:800;line-height:1.4}
.spark{position:absolute;font-size:2.6mm;top:1.2mm;left:24mm;opacity:.8}
.spark.s2{top:auto;bottom:1.1mm;left:auto;right:2mm;font-size:2mm}
.test{border:.25mm solid #000}
.test .safe{position:absolute;inset:${SAFE.y}mm ${SAFE.x}mm;border:.3mm dashed #e8665d;border-radius:5mm;transform:${CARD_T}}
.test span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:700 6mm Pop;color:#adb5bd}
.note{position:absolute;left:8mm;right:8mm;bottom:${Math.max(.5, MY / 2 - 2.5)}mm;font:700 2.3mm/1.3 Cairo;color:#495057;text-align:center;direction:rtl}
`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(HTML_DIR, { recursive: true });
  const browser = await chromium.launch();
  if (IMAGE) {
    // عرض 2480 بكسل (300 نقطة في البوصة لعرض 210 ملم)
    const dir = path.join(OUT, 'صور-للطباعة');
    fs.mkdirSync(dir, { recursive: true });
    const pg = await browser.newPage({ viewport: { width: 794, height: 1060 }, deviceScaleFactor: 2480 / (PAGE.w / 25.4 * 96) });
    const f = path.join(HTML_DIR, 'صور.html');
    fs.writeFileSync(f, `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${SHEETS.map(sheet).join('')}</body></html>`);
    await pg.goto('file://' + f, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    const secs = await pg.$$('section.page');
    for (let i = 0; i < secs.length; i++) await secs[i].screenshot({ path: SHEETS[i].preview ? path.join(OUT, `${SHEETS[i].name.replace(/ /g, '-')}.png`) : path.join(dir, `استيكرات-${i + 1}-${SHEETS[i].name.replace(/ /g, '-')}.png`) });
    await browser.close();
    return;
  }
  const pg = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 3 });
  const jobs = [
    [(COMPENSATED ? 'استيكرات-A4-مضبوط-على-الطابعة' : 'استيكرات-A4') + SUFFIX, SHEETS.map(sheet).join(''), SHEETS.map((s, i) => `ورقة-${i + 1}-${s.name.replace(/ /g, '-')}${SUFFIX}`)],
    [(COMPENSATED ? 'اختبار-المقاس-مضبوط-على-الطابعة' : 'اختبار-المقاس') + SUFFIX, calSheet() + testSheet(), (COMPENSATED ? ['ورقة-القياس-مضبوط', 'اختبار-المقاس-مضبوط'] : ['ورقة-القياس', 'اختبار-المقاس']).map(n => n + SUFFIX)],
  ];
  for (const [name, body, previews] of jobs) {
    const f = path.join(HTML_DIR, name + '.html');
    fs.writeFileSync(f, `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body}</body></html>`);
    await pg.goto('file://' + f, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.pdf({ path: path.join(OUT, name + '.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
    const secs = await pg.$$('section.page');
    for (let i = 0; i < secs.length; i++) await secs[i].screenshot({ path: path.join(OUT, previews[i] + '.png') });
  }
  await browser.close();
})();
