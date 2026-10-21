// يولّد تصاميم نشاط «جواز السفر الكيميائي — رحلة مع علمائنا» (الأسبوع العربي للكيمياء).
// التشغيل: node src/passport.js  (أو THEME=pastel node src/passport.js) ثم python3 src/passport_pdf.py [passport-pastel]
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { page, tileBg, tileShadow, lighten, darken, decoAtom, flask, molecule, pastel, fontUrl, TITLE, THEME, SCALE, CARD_W, CARD_H } = require('./build');
const { STATIONS } = require('./passport-data');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, THEME === 'pastel' ? 'passport-pastel' : 'passport');
const HTML_DIR = path.join(ROOT, 'build', 'passport', THEME);
const NAME = 'جواز السفر الكيميائي';
const SUB = 'رحلة مع علمائنا';

const EXTRA_FONTS = `
@font-face{font-family:Ruqaa;font-weight:700;src:url(${fontUrl('aref-ruqaa-arabic-700-normal.woff2')})}
@font-face{font-family:Kufi;font-weight:700;src:url(${fontUrl('reem-kufi-arabic-700-normal.woff2')})}
.ruqaa{font-family:Ruqaa,Cairo;font-weight:700}
.kufi{font-family:Kufi,Cairo;font-weight:700}
`;
const P = (w, h, body, css) => page(w, h, body, EXTRA_FONTS + css);

// ---------- أيقونات خطية صغيرة ----------
const ICONS = {
  crown: '<path d="M10 46 L13 18 L25 31 L32 12 L39 31 L51 18 L54 46 Z"/><path d="M10 54 H54"/>',
  beaker: '<path d="M22 8 H42 M26 8 V24 L12 52 Q10 58 16 58 H48 Q54 58 52 52 L38 24 V8"/><path d="M18 42 H46"/><circle cx="28" cy="50" r="2.5"/><circle cx="36" cy="47" r="2"/>',
  drops: '<path d="M22 10 C14 24 10 30 10 37 a12 12 0 0 0 24 0 C34 30 30 24 22 10Z"/><path d="M45 26 C40 35 38 39 38 43 a7 7 0 0 0 14 0 C52 39 50 35 45 26Z"/>',
  crystal: '<path d="M32 6 L46 16 L46 44 L32 58 L18 44 L18 16 Z"/><path d="M18 16 L32 26 L46 16 M32 26 V58"/>',
  vapor: '<path d="M18 56 C10 46 26 40 18 30 C10 20 26 14 20 6"/><path d="M34 56 C26 46 42 40 34 30 C26 20 42 14 36 6"/><path d="M50 56 C42 46 58 40 50 30"/>',
  cross: '<path d="M25 8 H39 V25 H56 V39 H39 V56 H25 V39 H8 V25 H25 Z"/>',
  tools: '<circle cx="24" cy="42" r="14"/><path d="M34 32 L56 14 M50 10 L58 18"/><path d="M14 46 H34"/>',
  layers: '<path d="M32 8 L56 20 L32 32 L8 20 Z"/><path d="M8 32 L32 44 L56 32"/><path d="M8 44 L32 56 L56 44"/>',
  gem: '<path d="M14 24 L22 10 H42 L50 24 L32 56 Z"/><path d="M14 24 H50 M26 24 L32 56 L38 24 M22 10 L26 24 M42 10 L38 24"/>',
  leaf: '<path d="M10 54 C10 26 30 10 56 8 C56 34 40 54 10 54 Z"/><path d="M10 54 L40 24"/>',
  paw: '<ellipse cx="32" cy="42" rx="12" ry="10"/><circle cx="16" cy="28" r="5"/><circle cx="26" cy="18" r="5"/><circle cx="38" cy="18" r="5"/><circle cx="48" cy="28" r="5"/>',
  scroll: '<path d="M16 10 H46 a6 6 0 0 1 6 6 V48 a6 6 0 0 1 -6 6 H18 a6 6 0 0 1 -6 -6 V14"/><path d="M12 14 a4 4 0 0 1 8 0 V20 H12"/><path d="M22 26 H42 M22 34 H42 M22 42 H36"/>',
  bottle: '<path d="M26 6 H38 V14 H26 Z"/><path d="M28 14 V20 C16 22 12 30 12 40 C12 52 20 58 32 58 C44 58 52 52 52 40 C52 30 48 22 36 20 V14"/><path d="M14 40 H50"/>',
  ban: '<circle cx="32" cy="32" r="24"/><path d="M15 15 L49 49"/>',
  book: '<path d="M32 16 C24 10 14 10 8 12 V52 C14 50 24 50 32 56 C40 50 50 50 56 52 V12 C50 10 40 10 32 16 Z"/><path d="M32 16 V56"/>',
  flower: '<circle cx="32" cy="18" r="9"/><circle cx="46" cy="28" r="9"/><circle cx="41" cy="44" r="9"/><circle cx="23" cy="44" r="9"/><circle cx="18" cy="28" r="9"/><circle cx="32" cy="32" r="6"/>',
  eye: '<path d="M6 32 C16 16 48 16 58 32 C48 48 16 48 6 32 Z"/><circle cx="32" cy="32" r="9"/>',
  globe: '<circle cx="32" cy="32" r="24"/><ellipse cx="32" cy="32" rx="10" ry="24"/><path d="M8 32 H56 M12 20 H52 M12 44 H52"/>',
  scale: '<path d="M32 8 V54 M18 54 H46 M12 18 H52"/><path d="M12 18 L4 36 H20 Z M52 18 L44 36 H60 Z"/>',
  stamp: '<circle cx="32" cy="32" r="24" stroke-dasharray="6 5"/><path d="M22 32 L29 39 L43 25"/>',
  plane: '<path d="M6 34 L58 12 L44 54 L34 38 Z"/><path d="M34 38 L58 12"/>',
};
function icon(name, size = 48, stroke = '#13293d') {
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
}
function iconTile(name, color, size = 84) {
  return `<div class="itile" style="width:${size}px;height:${size}px;background:${tileBg(color)};box-shadow:${tileShadow(color, 6)}">${icon(name, size * .58)}</div>`;
}

// ---------- رسوم المشاهد (SVG) ----------
function defs(id, c) {
  return `<radialGradient id="${id}s" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="${c}"/><stop offset="1" stop-color="${darken(c, .5)}"/></radialGradient>
  <linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lighten(c, .35)}"/><stop offset="1" stop-color="${darken(c, .25)}"/></linearGradient>
  <linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="rgba(255,255,255,.4)"/><stop offset=".3" stop-color="rgba(255,255,255,.1)"/><stop offset=".8" stop-color="rgba(255,255,255,.06)"/><stop offset="1" stop-color="rgba(255,255,255,.3)"/></linearGradient>
  <linearGradient id="${id}f" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff8a5c"/><stop offset=".6" stop-color="#ffc47e"/><stop offset="1" stop-color="#fff3c4"/></linearGradient>`;
}
const GLASS = 'stroke="rgba(255,255,255,.7)" stroke-width="5" stroke-linejoin="round"';
const flame = (x, y, s, id) => `<path d="M${x} ${y - 46 * s} C${x + 22 * s} ${y - 20 * s} ${x + 20 * s} ${y} ${x} ${y} C${x - 20 * s} ${y} ${x - 22 * s} ${y - 20 * s} ${x} ${y - 46 * s} Z" fill="url(#${id}f)"/>`;
const steam = (x, y, h, op = .6) => `<path d="M${x} ${y} c-14 -${h / 4} 14 -${h / 4} 0 -${h / 2} s14 -${h / 4} 0 -${h / 2}" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="6" stroke-linecap="round" opacity="${op}"/>`;
function crystals(x, y, s, c) {
  const one = (dx, h, w, rot) => `<g transform="translate(${x + dx * s} ${y}) rotate(${rot})">
    <path d="M0 0 L${-w * s} ${-10 * s} L${-w * s} ${-h * s} L0 ${-(h + 16) * s} L${w * s} ${-h * s} L${w * s} ${-10 * s} Z" fill="${lighten(c, .25)}"/>
    <path d="M0 0 L${w * s} ${-10 * s} L${w * s} ${-h * s} L0 ${-(h + 16) * s} Z" fill="${darken(c, .15)}"/>
    <path d="M${-w * s * .5} ${-14 * s} L${-w * s * .5} ${-h * s * .9}" stroke="rgba(255,255,255,.7)" stroke-width="${4 * s}" stroke-linecap="round"/></g>`;
  return one(-34, 60, 14, -18) + one(30, 70, 15, 16) + one(0, 96, 18, 0);
}
function gem(x, y, s, c) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-40 -14 L-24 -38 H24 L40 -14 L0 40 Z" fill="${c}"/>
    <path d="M-40 -14 H40 L0 40 Z" fill="${darken(c, .18)}"/>
    <path d="M-24 -38 L-12 -14 L0 -38 L12 -14 L24 -38" fill="${lighten(c, .35)}"/>
    <path d="M-12 -14 L0 40 L12 -14 Z" fill="${lighten(c, .15)}"/>
    <path d="M-30 -18 L-20 -32" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/></g>`;
}
function rose(x, y, s) {
  const pet = (dx, dy, r, c) => `<circle cx="${dx}" cy="${dy}" r="${r}" fill="${c}"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 40 C-6 90 6 120 0 170" stroke="#5fae7f" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M0 110 C-40 90 -60 110 -64 130 C-40 136 -14 126 0 110Z" fill="#6fd6b5"/>
    <path d="M2 140 C40 120 60 136 64 154 C40 160 16 152 2 140Z" fill="#5cc4a0"/>
    ${pet(-34, 4, 34, '#e98bb2')}${pet(34, 4, 34, '#e98bb2')}${pet(0, 30, 36, '#df7aa5')}
    ${pet(-18, -20, 30, '#f6a8c9')}${pet(18, -20, 30, '#f6a8c9')}${pet(0, -4, 26, '#fbc4dc')}
    <path d="M-12 -6 C-6 -20 10 -18 12 -4 C8 8 -6 8 -12 -6Z" fill="#e98bb2"/></g>`;
}
function coin(x, y, r) {
  return `<g><circle cx="${x}" cy="${y}" r="${r}" fill="url(#coin)"/><circle cx="${x}" cy="${y}" r="${r * .78}" fill="none" stroke="#b8862f" stroke-width="5"/>
    <text x="${x}" y="${y + r * .28}" text-anchor="middle" font-family="Pop" font-weight="800" font-size="${r * .8}" fill="#9a6d22" direction="ltr">Au</text>
    <circle cx="${x}" cy="${y}" r="${r + 14}" fill="none" stroke="#ff7b6b" stroke-width="12"/><path d="M${x - r * .8} ${y - r * .8} L${x + r * .8} ${y + r * .8}" stroke="#ff7b6b" stroke-width="12" stroke-linecap="round"/></g>`;
}
function bottle(x, y, s, c, id) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-22" y="-150" width="44" height="34" rx="10" fill="${darken(c, .1)}"/>
    <rect x="-14" y="-120" width="28" height="30" fill="url(#${id}g)" ${GLASS}/>
    <path d="M-14 -92 C-70 -84 -84 -40 -84 0 C-84 52 -48 70 0 70 C48 70 84 52 84 0 C84 -40 70 -84 14 -92 Z" fill="url(#${id}g)" ${GLASS}/>
    <path d="M-78 -6 C-78 46 -46 64 0 64 C46 64 78 46 78 -6 Z" fill="url(#${id}l)"/>
    <ellipse cx="0" cy="-6" rx="78" ry="10" fill="${lighten(c, .45)}"/>
    <path d="M-56 -50 C-62 -30 -62 -14 -60 0" stroke="rgba(255,255,255,.75)" stroke-width="8" stroke-linecap="round" fill="none"/></g>`;
}
function alembic(x, y, s, c, id) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${flame(0, 150, 1.1, id)}
    <rect x="-46" y="150" width="92" height="14" rx="7" fill="rgba(255,255,255,.35)"/>
    <circle cx="0" cy="70" r="68" fill="url(#${id}g)" ${GLASS}/>
    <path d="M-62 82 A68 68 0 0 0 62 82 Z" fill="url(#${id}l)"/>
    <rect x="-16" y="-8" width="32" height="18" fill="url(#${id}g)" ${GLASS}/>
    <path d="M-44 -6 C-44 -60 44 -60 44 -6 Z" fill="url(#${id}g)" ${GLASS}/>
    <path d="M40 -30 L190 60" stroke="rgba(255,255,255,.7)" stroke-width="14" stroke-linecap="round"/>
    <path d="M40 -30 L190 60" stroke="rgba(255,255,255,.18)" stroke-width="7" stroke-linecap="round"/>
    ${steam(-12, -14, 34)}${steam(12, 2, 30, .5)}
    <path d="M196 74 C190 86 188 90 188 94 a8 8 0 0 0 16 0 C204 90 202 86 196 74Z" fill="${lighten(c, .3)}"/>
    <circle cx="200" cy="150" r="42" fill="url(#${id}g)" ${GLASS}/>
    <path d="M160 160 A42 42 0 0 0 240 160 Z" fill="url(#${id}l)"/>
    <rect x="190" y="98" width="20" height="14" fill="url(#${id}g)" ${GLASS}/></g>`;
}
function balance(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})" stroke="rgba(255,255,255,.7)" stroke-width="7" stroke-linecap="round" fill="none">
    <path d="M0 -110 V100 M-60 100 H60 M-120 -80 H120"/><circle cx="0" cy="-118" r="10" fill="rgba(255,255,255,.7)"/>
    <path d="M-120 -80 L-150 -10 M-120 -80 L-90 -10 M120 -80 L90 -10 M120 -80 L150 -10"/>
    <path d="M-160 -10 H-80 C-84 14 -156 14 -160 -10 Z M80 -10 H160 C156 14 84 14 80 -10 Z" fill="rgba(255,255,255,.25)"/></g>`;
}
function cone(x, y, s, id) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-70 -90 H70 L14 40 V70 H-14 V40 Z" fill="url(#${id}g)" ${GLASS}/>
    <path d="M-52 -50 H52 L14 36 V66 H-14 V36 Z" fill="url(#${id}l)" opacity=".85"/>
    <path d="M14 -20 L80 -20 L80 -6" stroke="rgba(255,255,255,.7)" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M80 4 C76 12 74 15 74 18 a6 6 0 0 0 12 0 C86 15 84 12 80 4Z" fill="${lighten('#b7a2ff', .3)}"/></g>`;
}
function scene(st, size = 460) {
  const id = 'sc' + st.n, c = st.color;
  let art = '';
  if (st.scene === 'alembic') {
    art = alembic(150, 150, 1.05, c, id) + crystals(110, 440, 1.1, '#b7a2ff') + `<g opacity=".9">${steam(330, 440, 90)}${steam(370, 430, 70, .5)}</g>`
      + `<g transform="translate(300 420)">${gem(0, 0, .55, '#7fcbe9')}</g>`;
  } else if (st.scene === 'lab') {
    art = `<g transform="translate(40 40)">${flask(170, '#7fcbe9')}</g><g transform="translate(250 120) rotate(8)">${flask(120, '#6fd6b5')}</g>`
      + gem(110, 400, .7, '#b7a2ff') + `<g transform="translate(250 340)" fill="none">${icon('leaf', 90, '#6fd6b5')}</g>`
      + `<g transform="translate(350 360)">${icon('paw', 80, '#ffc47e')}</g>`;
  } else if (st.scene === 'perfume') {
    art = bottle(170, 280, 1.15, '#ffc47e', id) + coin(350, 120, 54) + `<g opacity=".85">${steam(170, 110, 70)}${steam(200, 100, 54, .5)}</g>`
      + `<g transform="translate(330 300) rotate(10)">${flask(110, '#f6a8c9')}</g>`;
  } else if (st.scene === 'rose') {
    art = rose(140, 150, 1.05) + alembic(250, 120, .62, '#f6a8c9', id) + bottle(380, 390, .55, '#f6a8c9', id) + `<g opacity=".85">${steam(280, 60, 60)}</g>`;
  } else if (st.scene === 'gems') {
    art = balance(230, 210, 1.05) + gem(110, 210, .9, '#b7a2ff') + gem(350, 210, .9, '#7fcbe9') + cone(240, 400, .7, id)
      + `<g transform="translate(60 380)">${decoAtom(110, '#ffc47e')}</g>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 460 460"><defs>${defs(id, c)}
    <radialGradient id="coin" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff6cf"/><stop offset=".4" stop-color="#ffd166"/><stop offset="1" stop-color="#c8902c"/></radialGradient></defs>${art}</svg>`;
}

// ختم دائري (فارغ أو مختوم)
function stampSlot(label, size, color, filled = false) {
  if (filled) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 200 200" style="transform:rotate(-12deg)">
      <circle cx="100" cy="100" r="92" fill="none" stroke="${color}" stroke-width="8"/><circle cx="100" cy="100" r="74" fill="none" stroke="${color}" stroke-width="3"/>
      <text x="100" y="92" text-anchor="middle" font-family="Ruqaa" font-weight="700" font-size="34" fill="${color}">${label}</text>
      <text x="100" y="132" text-anchor="middle" font-family="Pop" font-weight="800" font-size="22" fill="${color}">✓</text></svg>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="92" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.55)" stroke-width="5" stroke-dasharray="14 10"/>
    <text x="100" y="94" text-anchor="middle" font-family="Cairo" font-weight="800" font-size="22" fill="#a8c8d6">مكان الختم</text>
    <text x="100" y="128" text-anchor="middle" font-family="Ruqaa" font-weight="700" font-size="${label.length > 8 ? 26 : 32}" fill="#a8c8d6">${label}</text></svg>`;
}

const COMMON_CSS = `
.itile{flex:none;border-radius:24px;display:flex;align-items:center;justify-content:center}
.panel{background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.15);box-shadow:0 14px 30px rgba(0,0,0,.25), inset 0 2px 0 rgba(255,255,255,.12)}
.paper{background:#fbfdfe;border-radius:30px;box-shadow:0 16px 34px rgba(0,0,0,.3)}
.lines i{display:block;height:64px;border-bottom:3px dotted #7a8e9c}
`;

// ======================= 1) البوستر =======================
function posterHtml() {
  const css = COMMON_CSS + `
  .wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:60px 60px 54px}
  .t{--ts:#5b47a8;font-size:120px;margin-top:24px;text-align:center}
  .sub{font-size:64px;color:#c9f3e5;margin-top:-6px;text-shadow:0 4px 0 #1f6b5b}
  .lead{font-family:Pop,Cairo;font-weight:800;font-size:33px;line-height:1.55;color:#eef6fa;text-align:center;margin-top:16px;max-width:880px}
  .pp{margin-top:auto;width:100%;border-radius:36px;padding:22px 26px 18px}
  .pp h3{font-family:Pop,Cairo;font-weight:900;font-size:28px;color:#fff;display:flex;align-items:center;gap:12px;justify-content:center}
  .slots{display:flex;justify-content:space-between;margin-top:10px}
  .slot{display:flex;flex-direction:column;align-items:center;gap:6px}
  .slot b{font-family:Pop;font-weight:800;font-size:22px;color:#13293d;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center}
  .steps{margin-top:auto;width:100%;display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .st{display:flex;align-items:center;gap:16px;padding:14px 20px;border-radius:26px}
  .st .n{flex:none;width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:Pop;font-weight:800;font-size:28px;color:#13293d}
  .st p{font-family:Pop,Cairo;font-weight:700;font-size:25px;line-height:1.4;color:#eef6fa}
  .hd2{margin-top:auto;font-family:Pop,Cairo;font-weight:900;font-size:30px;color:#fff;display:flex;gap:12px;align-items:center}
  .foot{margin-top:18px;font-size:46px;color:#ffc47e;text-shadow:0 3px 0 #a5652c}
  `;
  const stepColors = ['#6fd6b5', '#7fcbe9', '#b7a2ff', '#ffc47e'];
  const steps = ['استلمي جوازك واكتبي اسمك.', 'زوري المحطات واقرئي معلومة عن كل عالم.', 'أجيبي سؤال المحطة في جوازك واحصلي على الختم.', '5 أختام = ختم الوصول وجائزة 🏆'];
  const body = `
  <div class="glow" style="width:460px;height:460px;background:#6fd6b5;top:60px;left:-140px;opacity:.4"></div>
  <div class="glow" style="width:460px;height:460px;background:#b7a2ff;top:520px;right:-160px;opacity:.35"></div>
  <svg style="position:absolute;top:150px;left:0" width="1080" height="420"><path d="M60 360 C260 120 520 420 760 170 S1000 60 1040 120" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="4" stroke-dasharray="4 14" stroke-linecap="round"/></svg>
  <div style="position:absolute;top:56px;right:56px;transform:rotate(-24deg)">${icon('plane', 76, '#ffc47e')}</div>
  <div style="position:absolute;top:40px;left:40px;transform:rotate(-12deg);filter:drop-shadow(0 20px 26px rgba(0,0,0,.4))">${decoAtom(170, '#6fd6b5')}</div>
  <div style="position:absolute;top:390px;left:30px;transform:rotate(-10deg);opacity:.9">${flask(110, '#b7a2ff')}</div>
  <div style="position:absolute;top:400px;right:40px;transform:rotate(12deg);opacity:.9">${molecule(120)}</div>
  <div class="wrap">
    <span class="pill" style="font-size:28px">🧪 ${TITLE}</span>
    <h1 class="title3d t">${NAME}</h1>
    <div class="ruqaa sub">${SUB}</div>
    <div class="lead">سافري عبر الزمن وقابلي علماء وضعوا أساس الكيمياء،<br>واجمعي أختامهم في جوازك!</div>
    <div class="pp panel">
      <h3>${icon('stamp', 40, '#ffc47e')} أختام رحلتك</h3>
      <div class="slots">${STATIONS.map(s => `<div class="slot">${stampSlot(s.name.replace('أبو بكر ', ''), 170, s.color)}<b style="background:${tileBg(s.color)};box-shadow:${tileShadow(s.color, 4)}">${s.n}</b></div>`).join('')}</div>
    </div>
    <div class="hd2">${icon('plane', 40, '#ffc47e')} كيف تسافرين؟</div>
    <div class="steps" style="margin-top:14px">${steps.map((t, i) => `<div class="st panel"><div class="n" style="background:${tileBg(stepColors[i])};box-shadow:${tileShadow(stepColors[i], 5)}">${i + 1}</div><p>${t}</p></div>`).join('')}</div>
    <div class="ruqaa foot">رحلة سعيدة!</div>
  </div>`;
  return P(1080, 1350, body, css);
}

// ======================= 2) صفحات الجواز (A6 للقص والتدبيس) =======================
// هامش التدبيس على الجهة اليمنى (الجواز العربي يُفتح من اليمين)
const BOOK_CSS = COMMON_CSS + `
.wrap{position:absolute;inset:0;display:flex;flex-direction:column;padding:56px 130px 50px 56px}
.bind{position:absolute;top:0;bottom:0;right:0;width:96px;border-left:3px dashed rgba(255,255,255,.3);background:rgba(255,255,255,.08)}
.bind i{position:absolute;right:30px;width:36px;height:10px;border-radius:5px;background:rgba(255,255,255,.4)}
.pghd{display:flex;justify-content:space-between;align-items:center}
.pgno{font-family:Pop,Cairo;font-weight:800;font-size:24px;color:#a8c8d6}
`;
const binding = `<div class="bind"><i style="top:22%"></i><i style="top:76%"></i></div>`;

function coverHtml() {
  const css = BOOK_CSS + `
  .wrap{align-items:center;text-align:center}
  .emb{margin-top:80px;width:360px;height:360px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.25),rgba(255,255,255,.05));border:6px double rgba(255,255,255,.55)}
  .lat{font-family:Pop;font-weight:700;font-size:26px;letter-spacing:10px;color:#a8c8d6;margin-top:34px;direction:ltr}
  .t{--ts:#5b47a8;font-size:116px;line-height:1.1;margin-top:10px}
  .sub{font-size:60px;color:#c9f3e5;text-shadow:0 4px 0 #1f6b5b;margin-top:4px}
  .fields{margin-top:auto;width:100%;padding:24px 34px 30px;text-align:right}
  .fields .f{display:flex;align-items:flex-end;gap:16px;font-family:Pop,Cairo;font-weight:800;font-size:34px;color:#3d5568;margin-top:10px}
  .fields .f i{flex:1;height:62px;border-bottom:3px dotted #7a8e9c}
  `;
  const body = `
  <div class="glow" style="width:560px;height:560px;background:#b7a2ff;top:100px;left:160px;opacity:.38"></div>
  <div class="glow" style="width:380px;height:380px;background:#6fd6b5;bottom:120px;left:-120px;opacity:.3"></div>
  ${binding}
  <div class="wrap">
    <span class="pill" style="font-size:28px">🧪 ${TITLE}</span>
    <div class="emb">${decoAtom(270, '#ffc47e')}</div>
    <div class="lat">CHEMICAL PASSPORT</div>
    <h1 class="title3d t">${NAME}</h1>
    <div class="ruqaa sub">${SUB}</div>
    <div style="display:flex;gap:18px;margin-top:56px">${STATIONS.map(s => `<div style="width:62px;height:62px;border-radius:50%;background:${tileBg(s.color)};box-shadow:${tileShadow(s.color, 4)};display:flex;align-items:center;justify-content:center;font-family:Pop;font-weight:800;font-size:28px;color:#13293d">${s.n}</div>`).join('')}</div>
    <div class="fields paper">
      <div class="f">الاسم<i></i></div>
      <div class="f">الصف<i></i></div>
    </div>
  </div>`;
  return P(CARD_W, CARD_H, body, css);
}

function stationPageHtml(st, pgNo) {
  const c = st.color;
  const css = BOOK_CSS + `
  .badge{font-family:Pop,Cairo;font-weight:900;font-size:32px;color:#13293d;padding:10px 28px;border-radius:999px}
  .dest{margin-top:28px;border-radius:32px;padding:22px 28px;display:flex;align-items:center;gap:24px}
  .dest .lab{font-family:Pop,Cairo;font-weight:800;font-size:22px;color:#a8c8d6}
  .dest .nm{font-size:62px;line-height:1.2;color:#fff}
  .dest .meta{font-family:Pop,Cairo;font-weight:700;font-size:24px;color:#eef6fa}
  .q{margin-top:26px;border-radius:30px;padding:20px 26px}
  .q .lab{font-family:Pop,Cairo;font-weight:900;font-size:26px;color:${c};display:flex;align-items:center;gap:10px}
  .q p{font-family:Pop,Cairo;font-weight:800;font-size:36px;line-height:1.5;color:#eef6fa;margin-top:6px}
  .ans{margin-top:20px;padding:16px 28px 26px}
  .ans .lab{font-family:Pop,Cairo;font-weight:900;font-size:28px;color:#13293d}
  .stamp{flex:1;display:flex;align-items:center;justify-content:center;gap:30px}
  .stamp .hint{font-family:Pop,Cairo;font-weight:800;font-size:24px;color:#a8c8d6;line-height:1.6;max-width:300px}
  `;
  const body = `
  <div class="glow" style="width:520px;height:520px;background:${c};top:120px;left:180px;opacity:.32"></div>
  ${binding}
  <div class="wrap">
    <div class="pghd"><span class="badge" style="background:${tileBg(c)};box-shadow:${tileShadow(c, 5)}">المحطة ${st.n}</span><span class="pgno">${NAME} • ${pgNo}</span></div>
    <div class="dest panel">
      <div style="flex:none;transform:rotate(-6deg)">${scene(st, 190)}</div>
      <div><div class="lab">✈ الوجهة</div><div class="ruqaa nm">${st.name}</div><div class="meta">${st.title} • ${st.place} • ${st.era}</div></div>
    </div>
    <div class="q panel"><div class="lab">${icon('scroll', 34, c)} سؤال المحطة</div><p>${st.q}</p></div>
    <div class="ans paper"><div class="lab">✍️ إجابتي:</div><div class="lines"><i></i><i></i><i></i></div></div>
    <div class="stamp">${stampSlot(st.name.replace('أبو بكر ', ''), 380, c)}<div class="hint">بعد الإجابة الصحيحة تحصلين على ختم ${st.name}</div></div>
  </div>`;
  return P(CARD_W, CARD_H, body, css);
}

function arrivalHtml(pgNo) {
  const css = BOOK_CSS + `
  .wrap{align-items:center;text-align:center}
  .t{--ts:#1f6b5b;font-size:104px;margin-top:40px}
  .s{font-family:Pop,Cairo;font-weight:800;font-size:32px;color:#eef6fa;margin-top:8px;line-height:1.5}
  .big{margin-top:36px}
  .tally{margin-top:auto;width:100%;border-radius:32px;padding:20px 22px}
  .tally h4{font-family:Pop,Cairo;font-weight:900;font-size:26px;color:#fff}
  .tally .row{display:flex;justify-content:space-between;margin-top:14px}
  .tally .it{display:flex;flex-direction:column;align-items:center;gap:8px;font-size:24px;color:#eef6fa}
  .tally .box{width:58px;height:58px;border-radius:16px;background:#fbfdfe;border:4px solid}
  .prize{margin-top:22px;font-family:Pop,Cairo;font-weight:900;font-size:34px;color:#ffc47e}
  `;
  const body = `
  <div class="glow" style="width:600px;height:600px;background:#ffc47e;top:220px;left:140px;opacity:.3"></div>
  ${binding}
  <div class="wrap">
    <div class="pghd" style="width:100%"><span class="pill" style="font-size:24px">🏁 نهاية الرحلة</span><span class="pgno">${NAME} • ${pgNo}</span></div>
    <h1 class="title3d t">ختم الوصول</h1>
    <div class="s">أكملتِ رحلتك عبر الزمن مع علمائنا!</div>
    <div class="big">${stampSlot('الوصول', 420, '#ffc47e')}</div>
    <div class="tally panel"><h4>ضعي علامة ✓ عند كل ختم حصلتِ عليه</h4>
      <div class="row">${STATIONS.map(s => `<div class="it ruqaa"><div class="box" style="border-color:${s.color}"></div>${s.name.replace('أبو بكر ', '')}</div>`).join('')}</div></div>
    <div class="prize">5 أختام = ختم الوصول + جائزة 🏆</div>
  </div>`;
  return P(CARD_W, CARD_H, body, css);
}

function instructionsHtml(pgNo) {
  const css = BOOK_CSS + `
  .t{--ts:#5b47a8;font-size:100px;margin-top:40px;text-align:center}
  .steps{flex:1;display:flex;flex-direction:column;justify-content:center;gap:30px}
  .st{display:flex;align-items:center;gap:22px;padding:30px 26px;border-radius:30px}
  .st p{font-family:Pop,Cairo;font-weight:800;font-size:37px;line-height:1.45;color:#eef6fa}
  .bye{text-align:center;margin-bottom:20px}
  .bye .ruqaa{font-size:76px;color:#ffc47e;text-shadow:0 4px 0 #a5652c}
  `;
  const items = [
    ['globe', '#6fd6b5', 'زوري المحطات الخمس بأي ترتيب.'],
    ['scroll', '#7fcbe9', 'اقرئي معلومات المحطة، ثم أجيبي سؤالها في جوازك.'],
    ['stamp', '#b7a2ff', 'احصلي على ختم المحطة بعد الإجابة الصحيحة.'],
    ['crown', '#ffc47e', '5 أختام = ختم الوصول وجائزة!'],
  ];
  const body = `
  <div class="glow" style="width:520px;height:520px;background:#7fcbe9;top:160px;left:120px;opacity:.3"></div>
  ${binding}
  <div style="position:absolute;bottom:60px;left:80px;transform:rotate(-20deg)">${icon('plane', 110, '#ffc47e')}</div>
  <div class="wrap">
    <div class="pghd"><span class="pill" style="font-size:24px">🧭 دليل المسافرة</span><span class="pgno">${NAME} • ${pgNo}</span></div>
    <h1 class="title3d t">تعليمات السفر</h1>
    <div class="steps">${items.map(([ic, col, t]) => `<div class="st panel">${iconTile(ic, col, 88)}<p>${t}</p></div>`).join('')}</div>
    <div class="bye"><div class="ruqaa">رحلة سعيدة!</div></div>
  </div>`;
  return P(CARD_W, CARD_H, body, css);
}

// ======================= 3) لوحات المحطات (A4 للستاندات) =======================
function standHtml(st) {
  const c = st.color;
  const css = COMMON_CSS + `
  .wrap{position:absolute;inset:0;display:flex;flex-direction:column;padding:54px 56px 50px}
  .hd{display:flex;justify-content:space-between;align-items:center}
  .badge{font-family:Pop,Cairo;font-weight:900;font-size:40px;color:#13293d;padding:12px 34px;border-radius:999px}
  .hero{display:flex;align-items:center;gap:10px;margin-top:20px}
  .who{flex:1;min-width:0}
  .who .lab{font-family:Pop,Cairo;font-weight:800;font-size:26px;color:#a8c8d6}
  .who .nm{font-size:${st.name.length > 9 ? 92 : 112}px;line-height:1.15;color:#fff;text-shadow:0 5px 0 ${darken(c, .35)},0 16px 30px rgba(0,0,0,.35)}
  .who .ttl{display:inline-block;margin-top:8px;font-family:Pop,Cairo;font-weight:900;font-size:32px;color:#13293d;padding:8px 26px;border-radius:999px}
  .who .meta{margin-top:16px;display:flex;flex-wrap:wrap;gap:12px}
  .who .meta span{font-family:Pop,Cairo;font-weight:800;font-size:25px;color:#eef6fa;padding:8px 20px;border-radius:999px}
  .art{flex:none;filter:drop-shadow(0 26px 34px rgba(0,0,0,.35))}
  .facts{flex:1;display:flex;flex-direction:column;justify-content:center;gap:${st.chips ? 14 : 22}px;margin:6px 0 ${st.chips ? 0 : 20}px}
  .fc{display:flex;align-items:center;gap:22px;padding:14px 22px;border-radius:30px}
  .fc h4{font-family:Pop,Cairo;font-weight:900;font-size:30px;color:#fff}
  .fc p{font-family:Pop,Cairo;font-weight:700;font-size:${st.chips ? 27 : 30}px;line-height:1.45;color:#eef6fa;margin-top:2px}
  .chips{display:flex;gap:14px;margin:16px 0 20px}
  .chip{flex:1;display:flex;align-items:center;justify-content:center;gap:12px;padding:12px 10px;border-radius:24px;font-family:Pop,Cairo;font-weight:900;font-size:28px;color:#13293d}
  .qbox{padding:20px 28px 22px;border:5px solid ${c}}
  .qbox .lab{display:flex;align-items:center;gap:12px;font-family:Pop,Cairo;font-weight:900;font-size:30px;color:#13293d}
  .qbox .lab span{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:Lalezar;font-size:46px;padding-top:8px}
  .qbox p{font-family:Pop,Cairo;font-weight:900;font-size:36px;line-height:1.42;color:#13293d;margin-top:10px}
  .qbox small{display:block;margin-top:10px;font-family:Pop,Cairo;font-weight:800;font-size:24px;color:#5f7a8c}
  `;
  const body = `
  <div class="glow" style="width:640px;height:640px;background:${c};top:80px;left:-120px;opacity:.38"></div>
  <div class="glow" style="width:420px;height:420px;background:#b7a2ff;bottom:260px;right:-140px;opacity:.25"></div>
  <div class="sphere" style="--c:${c};--cd:${darken(c, .45)};width:50px;height:50px;top:560px;right:46px"></div>
  <div class="wrap">
    <div class="hd"><span class="pill" style="font-size:26px">🧪 ${TITLE} • ${NAME}</span><span class="badge" style="background:${tileBg(c)};box-shadow:${tileShadow(c, 7)}">المحطة ${st.n}</span></div>
    <div class="hero">
      <div class="who">
        <div class="lab">✈ وصلتِ إلى محطة العالم</div>
        <div class="ruqaa nm">${st.name}</div>
        <div class="ttl" style="background:${tileBg(c)};box-shadow:${tileShadow(c, 5)}">${st.title}</div>
        <div class="meta"><span class="panel">📍 ${st.place}</span><span class="panel">⏳ ${st.era}</span></div>
      </div>
      <div class="art">${scene(st, 370)}</div>
    </div>
    <div class="facts">${st.facts.map(f => `<div class="fc panel">${iconTile(f.icon, c, 84)}<div><h4>${f.h}</h4><p>${f.t}</p></div></div>`).join('')}</div>
    ${st.chips ? `<div class="chips">${st.chips.map(([ic, t]) => `<div class="chip" style="background:${tileBg(c)};box-shadow:${tileShadow(c, 6)}">${icon(ic, 40)}${t}</div>`).join('')}</div>` : ''}
    <div class="qbox paper">
      <div class="lab"><span style="background:${tileBg(c)};box-shadow:${tileShadow(c, 4)}">؟</span>سؤال المحطة</div>
      <p>${st.q}</p>
      <small>✍️ اكتبي الإجابة في جوازك، ثم احصلي على ختم المحطة.</small>
    </div>
  </div>`;
  return P(CARD_W, CARD_H, body, css);
}

// ======================= 4) إجابات المحطات (للمعلمة) =======================
function answersHtml() {
  const css = COMMON_CSS + `
  .wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:56px 56px 50px}
  .t{--ts:#1f6b5b;font-size:104px;margin-top:24px}
  .s{font-family:Pop,Cairo;font-weight:800;font-size:30px;color:#d9ecf4;margin-top:4px}
  .list{flex:1;width:100%;display:flex;flex-direction:column;justify-content:center;gap:18px;margin-top:20px}
  .row{display:flex;align-items:center;gap:22px;padding:18px 24px;border-radius:30px}
  .row .n{flex:none;width:76px;height:76px;border-radius:22px;display:flex;align-items:center;justify-content:center;font-family:Pop;font-weight:800;font-size:38px;color:#13293d}
  .row .nm{font-size:40px;color:#fff;line-height:1.2}
  .row .q{font-family:Pop,Cairo;font-weight:700;font-size:23px;color:#a8c8d6;line-height:1.45}
  .row .a{margin-top:6px;display:inline-block;font-family:Pop,Cairo;font-weight:900;font-size:30px;color:#13293d;background:#fbfdfe;padding:6px 20px;border-radius:16px;border:3px solid}
  `;
  const body = `
  <div class="glow" style="width:520px;height:520px;background:#6fd6b5;top:-120px;left:-120px;opacity:.3"></div>
  <div class="glow" style="width:480px;height:480px;background:#b7a2ff;bottom:-100px;right:-100px;opacity:.3"></div>
  <div style="position:absolute;top:40px;left:40px;transform:rotate(-14deg);opacity:.9">${decoAtom(150, '#6fd6b5')}</div>
  <div class="wrap">
    <span class="pill" style="font-size:28px">🧪 ${TITLE} • ${NAME}</span>
    <h1 class="title3d t">إجابات المحطات</h1>
    <div class="s">للمعلمة فقط</div>
    <div class="list">${STATIONS.map(s => `<div class="row panel"><div class="n" style="background:${tileBg(s.color)};box-shadow:${tileShadow(s.color, 6)}">${s.n}</div>
      <div><div class="ruqaa nm">${s.name}</div><div class="q">${s.q}</div><div class="a" style="border-color:${s.color}">✓ ${s.a}</div></div></div>`).join('')}</div>
  </div>`;
  return P(CARD_W, CARD_H, body, css);
}

// عناصر بيضاء خاصة بالجواز تحتاج لوناً داكناً على الخلفية الباستيلية
function pastelPassport(html) {
  return pastel(html
    .split('stroke="rgba(255,255,255,.55)"').join('stroke="rgba(70,90,140,.5)"')
    .split('border-left:3px dashed rgba(255,255,255,.3)').join('border-left:3px dashed rgba(70,90,140,.35)')
    .split('background:rgba(255,255,255,.4)}').join('background:rgba(70,90,140,.35)}')
    .split('border:6px double rgba(255,255,255,.55)').join('border:6px double rgba(70,90,140,.4)')
    .split('color:#ffc47e').join('color:#d4842f'));
}

// ======================= التوليد =======================
async function main() {
  const pages = [{ file: '01-البوستر.png', html: posterHtml(), w: 1080, h: 1350 }];
  const book = [coverHtml(), ...STATIONS.map((s, i) => stationPageHtml(s, i + 2)), arrivalHtml(7), instructionsHtml(8)];
  book.forEach((html, i) => pages.push({ file: `passport-pages/${String(i + 1).padStart(2, '0')}.png`, html, w: CARD_W, h: CARD_H }));
  STATIONS.forEach(s => pages.push({ file: `stations/المحطة-${s.n}-${s.name}.png`, html: standHtml(s), w: CARD_W, h: CARD_H }));
  pages.push({ file: '99-إجابات-المحطات.png', html: answersHtml(), w: CARD_W, h: CARD_H });

  const only = process.argv[2];
  for (const d of ['passport-pages', 'stations']) fs.mkdirSync(path.join(OUT, d), { recursive: true });
  fs.mkdirSync(HTML_DIR, { recursive: true });
  const browser = await chromium.launch();
  for (const p of pages) {
    if (only && !p.file.includes(only)) continue;
    const htmlPath = path.join(HTML_DIR, p.file.replace(/\//g, '_').replace('.png', '.html'));
    fs.writeFileSync(htmlPath, THEME === 'pastel' ? pastelPassport(p.html) : p.html);
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
