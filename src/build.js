// يولّد تصاميم «الأسبوع العربي للكيمياء» كصور PNG.
// التشغيل: node src/build.js ثم python3 src/make_pdf.py لملف PDF الكامل
// النسخة الباستيلية: THEME=pastel node src/build.js ثم python3 src/make_pdf.py designs-pastel
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { CATEGORIES, STATES, ELEMENTS, SUBLEVELS, shells, clues, yesNo } = require('./data');

const ROOT = path.join(__dirname, '..');
const THEME = process.env.THEME || 'dark';
const OUT = path.join(ROOT, THEME === 'pastel' ? 'designs-pastel' : 'designs');
const HTML_DIR = path.join(ROOT, 'build', 'html', THEME);
const FONTS = path.join(ROOT, 'assets', 'fonts');
const TITLE = 'الأسبوع العربي للكيمياء';
const SCALE = 2;

// ---------- أدوات الألوان ----------
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function rgbToHex(r, g, b) { return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join(''); }
function mix(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(...A.map((v, i) => v + (B[i] - v) * t)); }
const lighten = (c, t) => mix(c, '#ffffff', t);
const darken = (c, t) => mix(c, '#0b1a2a', t);

// ---------- الخطوط والأنماط المشتركة ----------
const fontUrl = f => 'file://' + path.join(FONTS, f);
const BASE_CSS = `
@font-face{font-family:Pop,Cairo;font-weight:400;src:url(${fontUrl('cairo-arabic-400-normal.woff2')})}
@font-face{font-family:Pop,Cairo;font-weight:600;src:url(${fontUrl('cairo-arabic-600-normal.woff2')})}
@font-face{font-family:Pop,Cairo;font-weight:700;src:url(${fontUrl('cairo-arabic-700-normal.woff2')})}
@font-face{font-family:Pop,Cairo;font-weight:800;src:url(${fontUrl('cairo-arabic-800-normal.woff2')})}
@font-face{font-family:Pop,Cairo;font-weight:900;src:url(${fontUrl('cairo-arabic-900-normal.woff2')})}
@font-face{font-family:Lalezar;src:url(${fontUrl('lalezar-arabic-400-normal.woff2')})}
@font-face{font-family:Lalezar;src:url(${fontUrl('lalezar-latin-400-normal.woff2')});unicode-range:U+0000-00FF}
@font-face{font-family:Pop;font-weight:500;src:url(${fontUrl('poppins-latin-500-normal.woff2')})}
@font-face{font-family:Pop;font-weight:700;src:url(${fontUrl('poppins-latin-700-normal.woff2')})}
@font-face{font-family:Pop;font-weight:800;src:url(${fontUrl('poppins-latin-800-normal.woff2')})}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:var(--w);height:var(--h);overflow:hidden}
body{direction:rtl;font-family:Pop,Cairo,sans-serif;color:#f4f7fb;
  background:#0e2233;position:relative;-webkit-font-smoothing:antialiased}
.bg{position:absolute;inset:0;overflow:hidden;
  background:
    radial-gradient(1100px 800px at 85% -10%, rgba(111,214,181,.28), transparent 60%),
    radial-gradient(900px 700px at -10% 110%, rgba(183,162,255,.26), transparent 60%),
    radial-gradient(700px 600px at 110% 90%, rgba(255,196,126,.16), transparent 60%),
    linear-gradient(160deg,#10283b 0%,#13324a 45%,#0f2638 100%)}
.hex{position:absolute;inset:0;opacity:.07;
  background-image:url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='84' height='97' viewBox='0 0 84 97'><path d='M42 2 L80 24 L80 72 L42 95 L4 72 L4 24 Z' fill='none' stroke='white' stroke-width='2'/></svg>`)}");
  background-size:84px 97px}
.glow{position:absolute;border-radius:50%;filter:blur(70px);opacity:.55}
.sphere{position:absolute;border-radius:50%;
  background:radial-gradient(circle at 32% 28%, #fff 0%, var(--c) 28%, var(--cd) 78%, #0b1a2a 110%);
  box-shadow:0 30px 60px rgba(0,0,0,.35), inset -12px -18px 30px rgba(0,0,0,.25)}
.ring{position:absolute;border-radius:50%;border:3px solid rgba(255,255,255,.18)}
.title3d{font-family:Lalezar,Cairo;font-weight:400;line-height:1.05;color:#fff;
  text-shadow:${Array.from({ length: 10 }, (_, i) => `0 ${i + 1}px 0 var(--ts)`).join(',')},0 22px 40px rgba(0,0,0,.45)}
.pill{display:inline-flex;align-items:center;gap:14px;border-radius:999px;padding:12px 30px;
  background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.06));
  border:2px solid rgba(255,255,255,.18);box-shadow:0 10px 30px rgba(0,0,0,.25), inset 0 2px 0 rgba(255,255,255,.18);
  font-family:Pop,Cairo;font-weight:800;color:#eaf6f2}
`;

// بلاطة ثلاثية الأبعاد (مربع عنصر)
function tileShadow(color, depth) {
  const d = darken(color, .45);
  const steps = Array.from({ length: depth }, (_, i) => `0 ${i + 1}px 0 ${mix(d, '#0b1a2a', i / depth * .4)}`);
  return `${steps.join(',')},0 ${depth + 14}px ${depth * 2 + 26}px rgba(0,0,0,.45),inset 0 3px 0 rgba(255,255,255,.55),inset 0 -6px 14px rgba(0,0,0,.08)`;
}
function tileBg(color) {
  return `linear-gradient(150deg, ${lighten(color, .55)} 0%, ${lighten(color, .15)} 40%, ${color} 75%, ${darken(color, .12)} 100%)`;
}

// أيقونات الحالة الفيزيائية
function stateIcon(state, size = 60, stroke = '#13293d') {
  if (state === 'gas') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 64 64"><g fill="none" stroke="${stroke}" stroke-width="4">
      <circle cx="22" cy="40" r="12"/><circle cx="42" cy="22" r="9"/><circle cx="47" cy="47" r="6"/><circle cx="17" cy="14" r="4"/></g></svg>`;
  }
  if (state === 'liquid') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 64 64"><path d="M32 6 C22 22 14 32 14 42 a18 18 0 0 0 36 0 C50 32 42 22 32 6Z" fill="none" stroke="${stroke}" stroke-width="4"/></svg>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64"><g fill="none" stroke="${stroke}" stroke-width="4" stroke-linejoin="round">
    <path d="M32 6 L56 18 L56 46 L32 58 L8 46 L8 18 Z"/><path d="M8 18 L32 30 L56 18 M32 30 L32 58"/></g></svg>`;
}

// نموذج بور للذرة (SVG)
function bohr(z, color, size = 460) {
  const sh = shells(z);
  const c = size / 2;
  const rMax = c - 28, rMin = 92;
  let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="nuc" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="${lighten(color, .2)}"/><stop offset="1" stop-color="${darken(color, .5)}"/></radialGradient>
    <radialGradient id="ele" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#bfe9ff"/><stop offset="1" stop-color="#3a7bb8"/></radialGradient>
    <filter id="gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <circle cx="${c}" cy="${c}" r="60" fill="${color}" opacity=".35" filter="url(#gl)"/>`;
  sh.forEach((n, i) => {
    const r = sh.length === 1 ? rMax * .82 : rMin + i * (rMax - rMin) / (sh.length - 1);
    svg += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="2.5" stroke-dasharray="${i % 2 ? '2 10' : 'none'}"/>`;
    const off = -Math.PI / 2 + i * 0.5;
    for (let k = 0; k < n; k++) {
      const a = off + (k / n) * Math.PI * 2;
      const x = c + r * Math.cos(a), y = c + r * Math.sin(a);
      svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="13" fill="#7fd1ff" opacity=".35" filter="url(#gl)"/>
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10.5" fill="url(#ele)"/>`;
    }
  });
  svg += `<circle cx="${c}" cy="${c}" r="46" fill="url(#nuc)"/>
  <text x="${c}" y="${c + 11}" text-anchor="middle" font-family="Pop" font-weight="800" font-size="30" fill="#13293d" direction="ltr" unicode-bidi="bidi-override">${z}+</text></svg>`;
  return svg;
}

// ذرة زخرفية ثلاثية الأبعاد (مدارات بيضاوية)
function decoAtom(size, color = '#6fd6b5') {
  const c = size / 2;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="da${size}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="${color}"/><stop offset="1" stop-color="${darken(color, .55)}"/></radialGradient>
    <radialGradient id="de${size}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#ffd59e"/><stop offset="1" stop-color="#d07a3a"/></radialGradient>
    <linearGradient id="dl${size}" x1="0" x2="1"><stop offset="0" stop-color="rgba(255,255,255,.1)"/><stop offset=".5" stop-color="rgba(255,255,255,.75)"/><stop offset="1" stop-color="rgba(255,255,255,.1)"/></linearGradient>
  </defs>
  ${[0, 60, 120].map(rot => `<ellipse cx="${c}" cy="${c}" rx="${c * .9}" ry="${c * .32}" fill="none" stroke="url(#dl${size})" stroke-width="${size / 70}" transform="rotate(${rot} ${c} ${c})"/>`).join('')}
  ${[0, 60, 120].map((rot, i) => {
    const a = [0.4, 2.3, 4.1][i];
    const x = c + c * .9 * Math.cos(a), y = c + c * .32 * Math.sin(a);
    return `<circle cx="${x}" cy="${y}" r="${size / 22}" fill="url(#de${size})" transform="rotate(${rot} ${c} ${c})"/>`;
  }).join('')}
  <circle cx="${c}" cy="${c}" r="${size / 8}" fill="url(#da${size})"/></svg>`;
}

// دورق مخروطي زخرفي
function flask(w, liquid = '#b7a2ff') {
  return `<svg width="${w}" height="${w * 1.25}" viewBox="0 0 160 200">
  <defs>
    <linearGradient id="fg${w}" x1="0" x2="1"><stop offset="0" stop-color="rgba(255,255,255,.35)"/><stop offset=".25" stop-color="rgba(255,255,255,.08)"/><stop offset=".8" stop-color="rgba(255,255,255,.05)"/><stop offset="1" stop-color="rgba(255,255,255,.3)"/></linearGradient>
    <linearGradient id="fl${w}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lighten(liquid, .35)}"/><stop offset="1" stop-color="${darken(liquid, .25)}"/></linearGradient>
  </defs>
  <path d="M30 120 L130 120 L148 178 Q150 192 136 192 L24 192 Q10 192 12 178 Z" fill="url(#fl${w})"/>
  <ellipse cx="80" cy="120" rx="50" ry="7" fill="${lighten(liquid, .5)}" opacity=".9"/>
  <path d="M62 10 L98 10 L98 70 L148 178 Q150 192 136 192 L24 192 Q10 192 12 178 L62 70 Z" fill="url(#fg${w})" stroke="rgba(255,255,255,.7)" stroke-width="4" stroke-linejoin="round"/>
  <rect x="56" y="4" width="48" height="12" rx="6" fill="rgba(255,255,255,.75)"/>
  <circle cx="64" cy="160" r="8" fill="rgba(255,255,255,.6)"/><circle cx="92" cy="146" r="5" fill="rgba(255,255,255,.55)"/><circle cx="104" cy="170" r="10" fill="rgba(255,255,255,.4)"/>
  <circle cx="84" cy="98" r="6" fill="rgba(255,255,255,.4)"/><circle cx="76" cy="54" r="4" fill="rgba(255,255,255,.35)"/>
  <path d="M40 182 L52 136" stroke="rgba(255,255,255,.55)" stroke-width="6" stroke-linecap="round"/></svg>`;
}

// جزيء زخرفي (كرات وروابط)
function molecule(size, colors = ['#ff9f8c', '#7fcbe9', '#eedc78']) {
  const s = size;
  const pts = [[.5, .5, .17, 0], [.16, .24, .11, 1], [.84, .26, .11, 2], [.22, .82, .1, 2], [.82, .8, .12, 1]];
  const g = colors.map((c, i) => `<radialGradient id="mg${s}${i}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="${c}"/><stop offset="1" stop-color="${darken(c, .55)}"/></radialGradient>`).join('');
  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><defs>${g}</defs>
  ${pts.slice(1).map(p => `<line x1="${s / 2}" y1="${s / 2}" x2="${p[0] * s}" y2="${p[1] * s}" stroke="rgba(255,255,255,.6)" stroke-width="${s / 26}" stroke-linecap="round"/>`).join('')}
  ${pts.map(p => `<circle cx="${p[0] * s}" cy="${p[1] * s}" r="${p[2] * s}" fill="url(#mg${s}${p[3]})"/>`).join('')}</svg>`;
}

function page(w, h, body, extraCss = '') {
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
  <style>:root{--w:${w}px;--h:${h}px}${BASE_CSS}${extraCss}</style></head>
  <body><div class="bg"><div class="hex"></div></div>${body}</body></html>`;
}

// بلاطة صغيرة للجدول الدوري المصغّر
function miniTile(el, size) {
  const c = CATEGORIES[el.cat].color;
  return `<div class="mt" style="width:${size}px;height:${size}px;background:${tileBg(c)};box-shadow:${tileShadow(c, 7)}">
    <span class="mz">${el.z}</span><span class="ms">${el.sym}</span></div>`;
}

function miniTable(size, gap) {
  // ترتيب الجدول الدوري من اليسار لليمين بصرياً كما في الجداول العلمية
  const cells = [];
  for (const el of ELEMENTS) {
    cells.push(`<div style="grid-row:${el.period};grid-column:${el.group}">${miniTile(el, size)}</div>`);
  }
  cells.push(`<div class="gapx" style="grid-row:1/4;grid-column:4/12"><b>21</b><span>عنصراً في انتظارك</span></div>`);
  return `<div class="ptable" style="grid-template-columns:repeat(18,${size}px);grid-template-rows:repeat(4,${size}px);gap:${gap}px">${cells.join('')}</div>`;
}

const MINI_CSS = `
.ptable{display:grid;direction:ltr}
.gapx{display:flex;flex-direction:column;align-items:center;justify-content:center;direction:rtl}
.gapx b{font-family:Pop;font-weight:800;font-size:76px;line-height:1;color:#ffc47e;text-shadow:0 4px 0 #a5652c,0 8px 0 #7c4a1f,0 16px 24px rgba(0,0,0,.4)}
.gapx span{font-family:Pop,Cairo;font-weight:800;font-size:24px;color:#d9ecf4;margin-top:8px}
.mt{position:relative;border-radius:12px;color:#13293d;display:flex;align-items:center;justify-content:center}
.mt .mz{position:absolute;top:4px;left:7px;font-family:Pop;font-weight:700;font-size:11px;opacity:.75}
.mt .ms{font-family:Pop;font-weight:800;font-size:22px;margin-top:6px}
`;

function legend(fontSize = 20) {
  return `<div class="legend">${Object.values(CATEGORIES).map(c =>
    `<span style="font-size:${fontSize}px"><i style="background:${tileBg(c.color)};box-shadow:0 3px 0 ${darken(c.color, .45)}"></i>${c.ar}</span>`).join('')}</div>`;
}
const LEGEND_CSS = `
.legend{display:flex;flex-wrap:wrap;justify-content:center;gap:8px 18px;font-family:Pop,Cairo;font-weight:700;color:#d9e7ef}
.legend span{display:inline-flex;align-items:center;gap:10px}
.legend i{display:inline-block;width:22px;height:22px;border-radius:7px}
`;

// ======================= 1) البوستر الإعلاني =======================
function posterHtml() {
  const css = MINI_CSS + LEGEND_CSS + `
  .wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:70px 60px 70px}
  .top{display:flex;gap:16px}
  .t1{--ts:#1f6b5b;font-size:132px;margin-top:22px;text-align:center}
  .t1 .l2{display:block;font-size:156px;color:#c9f3e5;--ts:#2f6f8f;
    background:linear-gradient(180deg,#ffffff 0%,#b8f0de 45%,#7fcbe9 100%);-webkit-background-clip:text;background-clip:text;color:transparent;
    filter:drop-shadow(0 6px 0 #1f5d73) drop-shadow(0 12px 0 #184a5d) drop-shadow(0 26px 30px rgba(0,0,0,.45));text-shadow:none}
  .sub{font-family:Pop,Cairo;font-weight:700;font-size:32px;color:#d6ebf3;margin-top:14px;text-align:center}
  .stage{margin-top:auto;perspective:1400px}
  .stage .ptable{transform:rotateX(26deg) rotateZ(0deg);transform-origin:50% 60%}
  .banner{margin-top:auto;width:100%;display:flex;align-items:center;gap:34px;padding:24px 36px;border-radius:40px;
    background:linear-gradient(135deg,rgba(183,162,255,.32),rgba(111,214,181,.22));border:2px solid rgba(255,255,255,.22);
    box-shadow:0 22px 50px rgba(0,0,0,.35), inset 0 2px 0 rgba(255,255,255,.25)}
  .qm{width:136px;height:136px;flex:none;border-radius:38px;display:flex;align-items:center;justify-content:center;
    font-family:Lalezar;font-size:136px;color:#13293d;padding-top:26px;background:${tileBg('#ffc47e')};box-shadow:${tileShadow('#ffc47e', 12)};transform:rotate(-8deg)}
  .btxt h2{font-family:Lalezar;font-weight:400;font-size:66px;line-height:1;color:#fff;text-shadow:0 4px 0 #6a55b8,0 8px 18px rgba(0,0,0,.35)}
  .btxt p{font-family:Pop,Cairo;font-weight:700;font-size:26px;color:#e7f1f6;margin-top:12px;line-height:1.5}
  .foot{margin-top:auto;font-family:Pop,Cairo;font-weight:800;font-size:28px;color:#a8c8d6;letter-spacing:0}
  .t1{margin-bottom:0}
  `;
  const body = `
  <div class="glow" style="width:420px;height:420px;background:#6fd6b5;top:120px;left:-120px"></div>
  <div class="glow" style="width:380px;height:380px;background:#b7a2ff;bottom:220px;right:-140px"></div>
  <div style="position:absolute;top:40px;left:40px;transform:rotate(-14deg);filter:drop-shadow(0 24px 30px rgba(0,0,0,.4))">${decoAtom(230, '#6fd6b5')}</div>
  <div style="position:absolute;top:70px;right:46px;transform:rotate(12deg);filter:drop-shadow(0 24px 30px rgba(0,0,0,.4))">${flask(150, '#b7a2ff')}</div>
  <div style="position:absolute;bottom:200px;left:-30px;transform:rotate(20deg);opacity:.9;filter:drop-shadow(0 20px 26px rgba(0,0,0,.4))">${molecule(170)}</div>
  <div class="sphere" style="--c:#ffc47e;--cd:#b8743a;width:70px;height:70px;top:420px;right:70px"></div>
  <div class="sphere" style="--c:#7fcbe9;--cd:#2c6f92;width:44px;height:44px;top:350px;left:250px"></div>
  <div class="sphere" style="--c:#f6a8c9;--cd:#a1466f;width:36px;height:36px;bottom:420px;right:40px"></div>
  <div class="wrap">
    <div class="top"><span class="pill" style="font-size:28px">⚗️ فعاليات علمية</span><span class="pill" style="font-size:28px">🧪 تحدّيات ومسابقات</span></div>
    <h1 class="title3d t1">الأسبوع العربي<span class="l2">للكيمياء</span></h1>
    <div class="sub">رحلة ممتعة بين عناصر الجدول الدوري</div>
    <div class="stage">${miniTable(50, 5)}</div>
    <div style="margin-top:14px">${legend(24)}</div>
    <div class="banner">
      <div class="qm">؟</div>
      <div class="btxt"><h2>نشاط: من أنا؟</h2>
        <p>21 لغزاً عن العناصر من الهيدروجين حتى السكانديوم<br>دلائل متتالية… والأسرع يفوز بأعلى النقاط!</p></div>
    </div>
    <div class="foot">شارك • فكّر • اكتشف</div>
  </div>`;
  return page(1080, 1350, body, css);
}

// ======================= 2) غلاف نشاط «من أنا؟» =======================
function whoAmIHtml() {
  const floating = [
    { c: '#6fd6b5', x: 90, y: 330, r: -14, s: 120 }, { c: '#b7a2ff', x: 870, y: 320, r: 12, s: 112 },
    { c: '#ff9f8c', x: 120, y: 560, r: 10, s: 96 }, { c: '#eedc78', x: 880, y: 540, r: -10, s: 100 },
    { c: '#7fcbe9', x: 40, y: 150, r: 18, s: 84 }, { c: '#f6a8c9', x: 950, y: 150, r: -18, s: 80 },
  ];
  const css = `
  .wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:64px 70px 50px}
  .ft{position:absolute;border-radius:26px;display:flex;align-items:center;justify-content:center;font-family:Lalezar;color:#13293d}
  .big{position:relative;margin-top:26px;width:250px;height:250px;border-radius:64px;display:flex;align-items:center;justify-content:center;
    font-family:Lalezar;font-size:250px;color:#13293d;padding-top:54px;transform:rotate(-6deg)}
  .t{--ts:#5b47a8;font-size:128px;margin-top:40px}
  .s{font-family:Pop,Cairo;font-weight:800;font-size:36px;color:#d9ecf4;margin-top:10px;text-align:center}
  .steps{margin-top:26px;width:100%;display:flex;flex-direction:column;gap:14px}
  .st{display:flex;align-items:center;gap:22px;padding:12px 26px;border-radius:30px;background:rgba(255,255,255,.08);
    border:2px solid rgba(255,255,255,.15);box-shadow:0 14px 30px rgba(0,0,0,.25), inset 0 2px 0 rgba(255,255,255,.12)}
  .st .n{flex:none;width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:Pop;font-weight:800;font-size:32px;color:#13293d}
  .st p{font-family:Pop,Cairo;font-weight:700;font-size:27px;line-height:1.45;color:#eef6fa}
  .pts{margin-top:24px;display:flex;gap:14px;align-items:flex-end;direction:rtl}
  .pts div{width:112px;border-radius:22px 22px 14px 14px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:12px;color:#13293d}
  .pts b{font-family:Pop;font-weight:800;font-size:40px;line-height:1}
  .pts span{font-family:Pop,Cairo;font-weight:800;font-size:19px}
  .foot{margin-top:auto;font-family:Pop,Cairo;font-weight:800;font-size:28px;color:#a8c8d6}
  `;
  const stepColors = ['#6fd6b5', '#ffc47e', '#b7a2ff', '#ff9f8c'];
  const steps = [
    'اقرئي الدليل الأول في بطاقتكِ، ثم انتقلي إلى الدليل التالي واحداً تلو الآخر.',
    'كل دليل يقرّبكِ أكثر من العنصر المجهول بين العناصر 1 إلى 21.',
    'عندما تعرفين العنصر، اكتبي اسمه ورمزه في خانة «إجابتي».',
    'كلما عرفتِ الإجابة من دليل أبكر حصلتِ على نقاط أكثر!',
  ];
  const ptsColors = ['#6fd6b5', '#7fcbe9', '#b7a2ff', '#ffc47e', '#ff9f8c', '#f6a8c9'];
  const body = `
  <div class="glow" style="width:520px;height:520px;background:#b7a2ff;top:140px;left:280px;opacity:.35"></div>
  <div class="ring" style="width:520px;height:520px;top:110px;left:280px"></div>
  <div class="ring" style="width:660px;height:660px;top:40px;left:210px;border-style:dashed;opacity:.6"></div>
  ${floating.map(f => `<div class="ft" style="width:${f.s}px;height:${f.s}px;left:${f.x}px;top:${f.y}px;transform:rotate(${f.r}deg);font-size:${f.s * .9}px;padding-top:${f.s * .2}px;background:${tileBg(f.c)};box-shadow:${tileShadow(f.c, 9)}">؟</div>`).join('')}
  <div class="sphere" style="--c:#ffc47e;--cd:#b8743a;width:54px;height:54px;top:450px;left:290px"></div>
  <div class="sphere" style="--c:#6fd6b5;--cd:#23816a;width:46px;height:46px;top:200px;left:740px"></div>
  <div class="wrap">
    <span class="pill" style="font-size:30px">🧪 ${TITLE}</span>
    <div class="big" style="background:${tileBg('#b7a2ff')};box-shadow:${tileShadow('#b7a2ff', 18)}">؟</div>
    <h1 class="title3d t">من أنا؟</h1>
    <div class="s">تحدّي عناصر الجدول الدوري من 1 إلى 21</div>
    <div class="steps">${steps.map((s, i) => `<div class="st"><div class="n" style="background:${tileBg(stepColors[i])};box-shadow:${tileShadow(stepColors[i], 5)}">${i + 1}</div><p>${s}</p></div>`).join('')}</div>
    <div class="pts">${POINTS.map((p, i) => `<div style="height:${64 + p * 12}px;background:${tileBg(ptsColors[i])};box-shadow:${tileShadow(ptsColors[i], 7)}"><b>${p}</b><span>الدليل ${i + 1}</span></div>`).join('')}</div>
    <div class="foot">نقاطكِ تتناقص مع كل دليل جديد… كوني الأسرع!</div>
  </div>`;
  return page(1080, 1350, body, css);
}

// البطاقات بنسبة A6 (ربع ورقة A4) لتُطبع 4 بطاقات في الورقة الواحدة
const CARD_W = 1080, CARD_H = 1527;
const POINTS = [6, 5, 4, 3, 2, 1];
const pointsWord = p => (p > 2 ? 'نقاط' : p === 2 ? 'نقطتان' : 'نقطة');
const sup = n => String(n).split('').map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('');

// ======================= 3) بطاقة العنصر =======================
function elementHtml(el) {
  const cat = CATEGORIES[el.cat];
  const c = cat.color;
  const sub = SUBLEVELS[el.z];
  const config = sub
    ? sub.map(([n, e]) => `${n}<sup>${e}</sup>`).join(' ')
    : shells(el.z).join(' , ');
  const css = `
  .wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:56px 60px 54px}
  .hd{width:100%;display:flex;justify-content:space-between;align-items:center}
  .idx{font-family:Pop;font-weight:700;font-size:28px;color:#a8c8d6;direction:ltr}
  .tilebox{perspective:1400px;margin-top:40px}
  .tile{position:relative;width:560px;height:600px;border-radius:64px;color:#13293d;transform:rotateY(-10deg) rotateX(8deg);
    display:flex;flex-direction:column;align-items:center;justify-content:center}
  .tile .z{position:absolute;top:30px;left:40px;font-family:Pop;font-weight:800;font-size:54px;opacity:.85}
  .tile .ic{position:absolute;top:34px;right:38px;opacity:.75}
  .tile .sym{font-family:Pop;font-weight:800;font-size:${el.sym.length > 1 ? 250 : 280}px;line-height:1;margin-top:46px;
    text-shadow:0 3px 0 rgba(255,255,255,.55),0 10px 18px rgba(0,0,0,.18)}
  .tile .ar{font-family:Pop,Cairo;font-weight:900;font-size:80px;line-height:1.2;margin-top:6px}
  .tile .en{font-family:Pop;font-weight:500;font-size:30px;opacity:.7;direction:ltr}
  .tile .catp{margin-top:14px;font-family:Pop,Cairo;font-weight:800;font-size:28px;padding:4px 26px;border-radius:999px;background:rgba(19,41,61,.12);border:2px solid rgba(19,41,61,.18)}
  .visual{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px}
  .bohr{transform:perspective(1100px) rotateX(14deg);filter:drop-shadow(0 30px 40px rgba(0,0,0,.35))}
  .chips{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .chip{border-radius:28px;padding:14px 22px;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.16);
    box-shadow:0 14px 30px rgba(0,0,0,.22), inset 0 2px 0 rgba(255,255,255,.12);display:flex;align-items:center;gap:18px}
  .chip.wide{grid-column:1/-1}
  .chip .ico{flex:none;width:76px;height:76px;border-radius:22px;display:flex;align-items:center;justify-content:center}
  .chip small{display:block;font-family:Pop,Cairo;font-weight:700;font-size:24px;color:#a8c8d6}
  .chip b{display:block;font-family:Pop,Cairo;font-weight:900;font-size:38px;color:#fff;line-height:1.3}
  .chip b.ltr{font-family:Pop;font-weight:700;direction:ltr;text-align:right}
  .chip sup{font-size:.6em;line-height:0}
  `;
  const visual = `<div class="bohr">${bohr(el.z, c, 400)}</div>`;
  const body = `
  <div class="glow" style="width:600px;height:600px;background:${c};top:180px;left:240px;opacity:.36"></div>
  <div class="glow" style="width:420px;height:420px;background:#7fcbe9;bottom:200px;left:-60px;opacity:.22"></div>
  <div class="sphere" style="--c:${c};--cd:${darken(c, .45)};width:60px;height:60px;top:240px;left:90px"></div>
  <div class="sphere" style="--c:#ffc47e;--cd:#b8743a;width:36px;height:36px;top:620px;right:70px"></div>
  <div style="position:absolute;top:720px;left:40px;transform:rotate(-14deg);opacity:.85">${decoAtom(140, c)}</div>
  <div class="wrap">
    <div class="hd"><span class="pill" style="font-size:28px">🧪 ${TITLE}</span><span class="idx">${el.z} / 21</span></div>
    <div class="tilebox"><div class="tile" style="background:${tileBg(c)};box-shadow:${tileShadow(c, 24)}">
      <span class="z">${el.z}</span><span class="ic">${stateIcon(el.state, 60)}</span>
      <div class="sym">${el.sym}</div><div class="ar">${el.ar}</div><div class="en">${el.en}</div><div class="catp">${cat.ar}</div>
    </div></div>
    <div class="visual">${visual}</div>
    <div class="chips">
      <div class="chip"><div class="ico" style="background:${tileBg(c)};box-shadow:${tileShadow(c, 5)}">${stateIcon(el.state, 50)}</div>
        <div><small>الحالة الفيزيائية</small><b>${STATES[el.state]}</b></div></div>
      <div class="chip"><div class="ico" style="background:${tileBg('#7fcbe9')};box-shadow:${tileShadow('#7fcbe9', 5)};font-family:Pop;font-weight:800;font-size:36px;color:#13293d">Z</div>
        <div><small>العدد الذري</small><b class="ltr">${el.z}</b></div></div>
      <div class="chip wide"><div class="ico" style="background:${tileBg('#b7a2ff')};box-shadow:${tileShadow('#b7a2ff', 5)}">${decoAtom(56, '#ffffff')}</div>
        <div><small>${sub ? 'التوزيع الإلكتروني (المستويات الفرعية)' : 'التوزيع الإلكتروني'}</small><b class="ltr">${config}</b></div></div>
    </div>
  </div>`;
  return page(CARD_W, CARD_H, body, css);
}

// ======================= 4) بطاقة الأسئلة (للطالبة — بدون إجابة) =======================
const CARD_ACCENTS = ['#6fd6b5', '#7fcbe9', '#b7a2ff', '#ffc47e', '#ff9f8c', '#f6a8c9'];
function questionHtml(el) {
  // لون البطاقة يتبدّل حسب رقمها، لا حسب تصنيف العنصر، حتى لا يكشف الإجابة
  const c = CARD_ACCENTS[(el.z - 1) % CARD_ACCENTS.length];
  const clueColors = ['#6fd6b5', '#7fcbe9', '#b7a2ff', '#ffc47e', '#ff9f8c', '#f6a8c9'];
  const ord = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
  const css = `
  .wrap{position:absolute;inset:0;display:flex;flex-direction:column;padding:54px 56px 50px}
  .hd{display:flex;justify-content:space-between;align-items:center}
  .no{font-family:Pop,Cairo;font-weight:900;font-size:32px;color:#13293d;padding:10px 28px;border-radius:999px;background:${tileBg(c)};box-shadow:${tileShadow(c, 5)}}
  .ttl{display:flex;align-items:center;justify-content:center;gap:24px;margin-top:14px}
  .ttl h1{--ts:#5b47a8;font-size:100px}
  .mq{width:100px;height:100px;border-radius:28px;display:flex;align-items:center;justify-content:center;font-family:Lalezar;font-size:98px;
    color:#13293d;padding-top:18px;transform:rotate(-8deg);background:${tileBg('#b7a2ff')};box-shadow:${tileShadow('#b7a2ff', 11)}}
  .lead{text-align:center;font-family:Pop,Cairo;font-weight:700;font-size:27px;color:#a8c8d6;margin-top:2px}
  .clues{flex:1;display:flex;flex-direction:column;justify-content:center;gap:14px;margin:20px 0}
  .cl{display:flex;align-items:center;gap:18px;padding:12px 20px;border-radius:30px;
    background:linear-gradient(180deg,rgba(255,255,255,.11),rgba(255,255,255,.05));border:2px solid rgba(255,255,255,.15);
    box-shadow:0 12px 26px rgba(0,0,0,.25), inset 0 2px 0 rgba(255,255,255,.12)}
  .cl .n{flex:none;width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-family:Pop;font-weight:800;font-size:32px;color:#13293d}
  .cl .tx{flex:1}
  .cl .tx small{display:block;font-family:Pop,Cairo;font-weight:800;font-size:20px;color:#a8c8d6;margin-bottom:4px}
  .cl .tx p{font-family:Pop,Cairo;font-weight:700;font-size:32px;line-height:1.4;color:#f4f8fb}
  .cl .pt{flex:none;width:84px;text-align:center;border-radius:20px;padding:6px 0;background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.18)}
  .cl .pt b{display:block;font-family:Pop;font-weight:800;font-size:34px;line-height:1.1}
  .cl .pt span{font-family:Pop,Cairo;font-weight:800;font-size:18px;color:#cfe2ea}
  .ans{border-radius:32px;padding:20px 30px 26px;background:#fbfdfe;border:4px solid ${c};box-shadow:0 14px 30px rgba(0,0,0,.3)}
  .ans .lab{font-family:Pop,Cairo;font-weight:900;font-size:32px;color:#13293d}
  .ans .row{display:flex;gap:30px;margin-top:14px}
  .ans .f{flex:1;display:flex;align-items:flex-end;gap:14px;font-family:Pop,Cairo;font-weight:800;font-size:27px;color:#3d5568}
  .ans .f.sm{flex:.55}
  .ans .f i{flex:1;height:52px;border-bottom:3px dotted #7a8e9c}
  `;
  const body = `
  <div class="glow" style="width:480px;height:480px;background:#b7a2ff;top:-60px;left:300px;opacity:.35"></div>
  <div class="glow" style="width:420px;height:420px;background:${c};bottom:-80px;right:-60px;opacity:.3"></div>
  <div style="position:absolute;top:150px;left:26px;transform:rotate(-16deg);opacity:.9;filter:drop-shadow(0 18px 24px rgba(0,0,0,.4))">${decoAtom(140, c)}</div>
  <div style="position:absolute;top:140px;right:36px;transform:rotate(14deg);opacity:.9;filter:drop-shadow(0 18px 24px rgba(0,0,0,.4))">${flask(96, c)}</div>
  <div class="wrap">
    <div class="hd"><span class="pill" style="font-size:26px">🧪 ${TITLE}</span><span class="no">البطاقة ${el.z}</span></div>
    <div class="ttl"><div class="mq">؟</div><h1 class="title3d">من أنا؟</h1></div>
    <div class="lead">اقرئي الدلائل واحداً تلو الآخر حتى تصلي إلى العنصر</div>
    <div class="clues">${clues(el).map((t, i) => `
      <div class="cl"><div class="n" style="background:${tileBg(clueColors[i])};box-shadow:${tileShadow(clueColors[i], 6)}">${i + 1}</div>
        <div class="tx"><small>الدليل ${ord[i]}</small><p>${t}</p></div>
        <div class="pt"><b style="color:${clueColors[i]}">${POINTS[i]}</b><span>${pointsWord(POINTS[i])}</span></div></div>`).join('')}
    </div>
    <div class="ans">
      <div class="lab">✍️ إجابتي:</div>
      <div class="row"><div class="f">اسم العنصر<i></i></div><div class="f sm">الرمز<i></i></div></div>
    </div>
  </div>`;
  return page(CARD_W, CARD_H, body, css);
}

// ======================= 5) مفتاح الإجابات (للمعلمة) =======================
function answerKeyHtml() {
  const css = `
  .wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:56px 56px 50px}
  .t{--ts:#1f6b5b;font-size:104px;margin-top:26px}
  .s{font-family:Pop,Cairo;font-weight:800;font-size:30px;color:#d9ecf4;margin-top:6px}
  .grid{flex:1;width:100%;display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:1fr;gap:16px;margin-top:34px}
  .it{display:flex;align-items:center;gap:16px;padding:12px 16px;border-radius:26px;background:rgba(255,255,255,.08);
    border:2px solid rgba(255,255,255,.15);box-shadow:0 12px 26px rgba(0,0,0,.25), inset 0 2px 0 rgba(255,255,255,.12)}
  .it .mini{flex:none;position:relative;width:96px;height:96px;border-radius:22px;color:#13293d;display:flex;align-items:center;justify-content:center}
  .it .mini i{position:absolute;top:6px;left:10px;font-style:normal;font-family:Pop;font-weight:800;font-size:17px}
  .it .mini b{font-family:Pop;font-weight:800;font-size:44px;margin-top:8px}
  .it small{display:block;font-family:Pop,Cairo;font-weight:800;font-size:22px;color:#a8c8d6}
  .it strong{display:block;font-family:Pop,Cairo;font-weight:900;font-size:34px;line-height:1.25;color:#fff}
  .it .yn{display:flex;gap:14px;margin-top:4px;font-family:Pop,Cairo;font-weight:700;font-size:21px;color:#a8c8d6}
  .it .yn b{color:#6fd6b5}.it .yn b.no{color:#ff9f8c}
  .foot{margin-top:24px;font-family:Pop,Cairo;font-weight:800;font-size:24px;color:#a8c8d6}
  `;
  const body = `
  <div class="glow" style="width:520px;height:520px;background:#6fd6b5;top:-120px;left:-120px;opacity:.3"></div>
  <div class="glow" style="width:480px;height:480px;background:#b7a2ff;bottom:-100px;right:-100px;opacity:.3"></div>
  <div style="position:absolute;top:40px;left:40px;transform:rotate(-14deg);opacity:.9">${decoAtom(150, '#6fd6b5')}</div>
  <div style="position:absolute;top:60px;right:46px;transform:rotate(12deg);opacity:.9">${flask(96, '#b7a2ff')}</div>
  <div class="wrap">
    <span class="pill" style="font-size:28px">🧪 ${TITLE}</span>
    <h1 class="title3d t">مفتاح الإجابات</h1>
    <div class="s">نشاط «من أنا؟» — للمعلمة فقط</div>
    <div class="grid">${ELEMENTS.map(el => {
      const c = CATEGORIES[el.cat].color;
      return `<div class="it"><div class="mini" style="background:${tileBg(c)};box-shadow:${tileShadow(c, 6)}"><i>${el.z}</i><b>${el.sym}</b></div>
        <div><small>البطاقة ${el.z}</small><strong>${el.ar}</strong>
        <div class="yn">${yesNo(el).map((v, i) => `<span>د${i + 5}: <b class="${v === 'لا' ? 'no' : ''}">${v}</b></span>`).join('')}</div></div></div>`;
    }).join('')}</div>
    <div class="foot">رقم البطاقة يساوي العدد الذري للعنصر • د5 ود6: جواب سؤالي «هل» في الدليلين الخامس والسادس</div>
  </div>`;
  return page(CARD_W, CARD_H, body, css);
}

// ---------- النسخة الباستيلية: خلفية فاتحة ناعمة ونصوص داكنة ----------
const PASTEL_SWAPS = [
  ['background:#0e2233', 'background:#f7f3fb'],
  ['linear-gradient(160deg,#10283b 0%,#13324a 45%,#0f2638 100%)', 'linear-gradient(160deg,#fdf6ee 0%,#f4effd 50%,#eaf7f3 100%)'],
  ['color:#f4f7fb', 'color:#26384d'],
  ['#a8c8d6', '#6b8193'],
  ['--ts:#1f6b5b', '--ts:#a9e3d1'], ['--ts:#5b47a8', '--ts:#d3c8fa'], ['--ts:#2f6f8f', '--ts:#b5dcec'],
  ['#ffffff 0%,#b8f0de 45%,#7fcbe9 100%', '#3fae90 0%,#3f9cc4 55%,#7a6bd4 100%'],
  ['drop-shadow(0 6px 0 #1f5d73) drop-shadow(0 12px 0 #184a5d)', 'drop-shadow(0 6px 0 #c4e9df) drop-shadow(0 12px 0 #b0dcd3)'],
  ['#6a55b8', '#d3c8fa'],
  ['rgba(255,255,255,.16),rgba(255,255,255,.06)', 'rgba(255,255,255,.92),rgba(255,255,255,.7)'],
  ['rgba(255,255,255,.11),rgba(255,255,255,.05)', 'rgba(255,255,255,.92),rgba(255,255,255,.72)'],
  ['background:rgba(255,255,255,.08)', 'background:rgba(255,255,255,.75)'],
  ['background:rgba(255,255,255,.07)', 'background:rgba(255,255,255,.75)'],
  ['background:rgba(255,255,255,.1)', 'background:rgba(255,255,255,.85)'],
  ['rgba(0,0,0,.', 'rgba(90,100,150,.'],
  ["'white'", "'%235a6a90'"],
  ['stroke="rgba(255,255,255,.28)"', 'stroke="rgba(70,90,140,.35)"'],
  ['stop-color="rgba(255,255,255,.75)"', 'stop-color="rgba(80,95,150,.6)"'],
  ['stop-color="rgba(255,255,255,.1)"', 'stop-color="rgba(80,95,150,.08)"'],
  ['stroke="rgba(255,255,255,.7)"', 'stroke="rgba(80,95,150,.55)"'],
  ['fill="rgba(255,255,255,.75)"', 'fill="rgba(80,95,150,.45)"'],
  ['stroke="rgba(255,255,255,.6)"', 'stroke="rgba(80,95,150,.5)"'],
];
const PASTEL_TEXT = ['#eaf6f2', '#d6ebf3', '#e7f1f6', '#cfe6ee', '#d9e7ef', '#d9ecf4', '#eef6fa', '#f4f8fb', '#cfe2ea', '#d6e8ef', '#c9f3e5'];
const PASTEL_CSS = `.cl .pt b{color:#2b3a5c!important}.glow{opacity:.45!important}`;
function pastel(html) {
  for (const [a, b] of PASTEL_SWAPS) html = html.split(a).join(b);
  for (const t of PASTEL_TEXT) html = html.split(t).join('#34495e');
  html = html.replace(/color:#fff(?=[;}"])/g, 'color:#2b3a5c');
  html = html.replace(/border:(\d+px) (solid|dashed) rgba\(255,255,255,\.\d+\)/g, 'border:$1 $2 rgba(60,80,130,.14)');
  return html.replace('</style>', PASTEL_CSS + '</style>');
}

// ======================= التوليد =======================
async function main() {
  const pages = [
    { file: '01-البوستر-الإعلاني.png', html: posterHtml(), w: 1080, h: 1350 },
    { file: '02-نشاط-من-أنا.png', html: whoAmIHtml(), w: 1080, h: 1350 },
    { file: '03-مفتاح-الإجابات.png', html: answerKeyHtml(), w: CARD_W, h: CARD_H },
  ];
  for (const el of ELEMENTS) {
    const n = String(el.z).padStart(2, '0');
    pages.push({ file: `elements/${n}-${el.sym}-${el.ar}.png`, html: elementHtml(el), w: CARD_W, h: CARD_H });
  }
  for (const el of ELEMENTS) {
    const n = String(el.z).padStart(2, '0');
    pages.push({ file: `questions/${n}-${el.sym}-${el.ar}-أسئلة.png`, html: questionHtml(el), w: CARD_W, h: CARD_H });
  }
  const only = process.argv[2];

  fs.mkdirSync(path.join(OUT, 'elements'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'questions'), { recursive: true });
  fs.mkdirSync(HTML_DIR, { recursive: true });

  const browser = await chromium.launch();
  for (const p of pages) {
    if (only && !p.file.includes(only)) continue;
    const htmlPath = path.join(HTML_DIR, p.file.replace(/\//g, '_').replace('.png', '.html'));
    fs.writeFileSync(htmlPath, THEME === 'pastel' ? pastel(p.html) : p.html);
    const ctx = await browser.newContext({ viewport: { width: p.w, height: p.h }, deviceScaleFactor: SCALE });
    const pg = await ctx.newPage();
    await pg.goto('file://' + htmlPath);
    await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({ path: path.join(OUT, p.file) });
    await ctx.close();
    console.log('✓', p.file);
  }

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
