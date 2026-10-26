const { chromium } = require('playwright');
const path = require('path');
const OUT = path.join(__dirname, 'assets');
const F = '/home/user/Project-1/assets/fonts/';
const css = `
@font-face{font-family:Cairo;font-weight:700;src:url(file://${F}cairo-arabic-700-normal.woff2)}
@font-face{font-family:Cairo;font-weight:900;src:url(file://${F}cairo-arabic-900-normal.woff2)}
@font-face{font-family:Pop;font-weight:700;src:url(file://${F}poppins-latin-700-normal.woff2)}
@font-face{font-family:Pop;font-weight:800;src:url(file://${F}poppins-latin-800-normal.woff2)}
*{margin:0;padding:0;box-sizing:border-box} html,body{background:transparent}`;

// ---------- backgrounds 2400x1350 (13.333in → 180px/in, 12pt = 30px) ----------
const waveTop = (op) => `<svg style="position:absolute;top:0;left:0" width="2400" height="230" viewBox="0 0 2400 230" preserveAspectRatio="none">
 <defs><linearGradient id="w1" x1="0" x2="1"><stop offset="0" stop-color="#1f6fb2"/><stop offset=".5" stop-color="#3fa7d6"/><stop offset="1" stop-color="#2bb3a3"/></linearGradient>
 <linearGradient id="w2" x1="0" x2="1"><stop offset="0" stop-color="#9fd8f5"/><stop offset="1" stop-color="#b9ecdf"/></linearGradient></defs>
 <path d="M0 0H2400V70C2000 150 1700 30 1300 80S600 190 0 95Z" fill="url(#w2)" opacity="${op}"/>
 <path d="M0 0H2400V38C2050 105 1750 0 1350 45S650 135 0 55Z" fill="url(#w1)" opacity="${op}"/>
 <path d="M0 125C500 210 900 60 1400 110S2100 150 2400 80" stroke="#7cc6ea" stroke-width="6" fill="none" opacity=".55"/></svg>`;
const waveBottom = `<svg style="position:absolute;bottom:0;right:0" width="1500" height="150" viewBox="0 0 1500 150" preserveAspectRatio="none">
 <defs><linearGradient id="b1" x1="0" x2="1"><stop offset="0" stop-color="#3fa7d6" stop-opacity="0"/><stop offset=".45" stop-color="#3fa7d6"/><stop offset="1" stop-color="#1f6fb2"/></linearGradient>
 <linearGradient id="b2" x1="0" x2="1"><stop offset="0" stop-color="#b9ecdf" stop-opacity="0"/><stop offset=".5" stop-color="#b9ecdf"/><stop offset="1" stop-color="#9fd8f5"/></linearGradient></defs>
 <path d="M0 150C400 120 700 40 1100 70S1400 60 1500 30V150Z" fill="url(#b2)"/>
 <path d="M300 150C700 135 900 85 1200 105S1420 95 1500 75V150Z" fill="url(#b1)"/></svg>`;
const hex = `background-image:url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='84' height='97' viewBox='0 0 84 97'><path d='M42 2 L80 24 L80 72 L42 95 L4 72 L4 24 Z' fill='none' stroke='%231f6fb2' stroke-width='2'/></svg>`).replace(/%25/g, '%')}");background-size:84px 97px;`;
const orb = (x, y, s, c, o = .5) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${s}px;height:${s}px;border-radius:50%;opacity:${o};
  background:radial-gradient(circle at 32% 28%,#fff 0%,${c} 35%,${c} 60%, rgba(0,0,0,.25) 110%);box-shadow:0 ${s / 6}px ${s / 3}px rgba(31,111,178,.18)"></div>`;
const mark = `<div style="position:absolute;left:62px;bottom:30px;font:700 30px Pop;color:#000;letter-spacing:.5px">Eng.7IKAYA</div>`;
function bg(kind, header = 'الدرس [1-1]: الترتيب الإلكتروني') {
  const title = kind === 'title';
  return `<div style="position:absolute;inset:0;width:2400px;height:1350px;overflow:hidden;
   background:radial-gradient(900px 700px at 92% 18%, rgba(132,214,190,.42), transparent 65%),
   radial-gradient(1000px 800px at 5% 95%, rgba(190,170,255,.30), transparent 65%),
   radial-gradient(800px 600px at 60% 105%, rgba(255,205,160,.28), transparent 65%),
   radial-gradient(900px 600px at 30% 10%, rgba(140,200,255,.30), transparent 65%),
   linear-gradient(135deg,#eef7ff 0%,#f5fbfa 50%,#f6f2ff 100%)">
   <div style="position:absolute;inset:0;opacity:${title ? .07 : .045};${hex}"></div>
   ${waveTop(title ? 1 : .95)}
   ${waveBottom}
   ${title ? orb(120, 260, 120, '#ffb703', .55) + orb(1900, 1050, 90, '#ff6fa8', .5) + orb(980, 1150, 60, '#2ec5ff', .6) + orb(330, 980, 70, '#7c6cf2', .45)
           : orb(2260, 1000, 70, '#ffb703', .35) + orb(40, 720, 54, '#2ec5ff', .3)}
   ${title ? '' : `<div style="position:absolute;left:62px;top:150px;font:700 30px Cairo;color:#1f5f99;direction:rtl;opacity:.85">${header}</div>`}
   ${mark}</div>`;
}

// ---------- Lewis dot ----------
const ORDER = ['r', 'l', 't', 'b'];
function dots(n) { const c = { r: 0, l: 0, t: 0, b: 0 }; for (let i = 0; i < n; i++) c[ORDER[i % 4]]++; return c; }
function lewis(sym, n, o = {}) {
  const fs = o.fs || 120, dot = o.dot || Math.round(fs * .16), col = o.color || '#16325c', dc = o.dotColor || '#ff3d7f';
  const c = dots(n), gap = dot * 1.25, W = fs * (sym.length > 1 ? 1.35 : .9), H = fs * 1.05, pad = dot * 2.2;
  const d = (x, y) => `<div style="position:absolute;left:${x - dot / 2}px;top:${y - dot / 2}px;width:${dot}px;height:${dot}px;border-radius:50%;
     background:radial-gradient(circle at 35% 30%,#fff 0%,${dc} 45%,${dc} 70%,rgba(0,0,0,.3) 120%);box-shadow:0 2px 6px rgba(0,0,0,.25)"></div>`;
  const cx = pad + W / 2, cy = pad + H / 2, tw = W + pad * 2, th = H + pad * 2;
  let h = '';
  const pair = (k, f) => { if (k === 1) h += f(0); if (k === 2) { h += f(-gap / 2); h += f(gap / 2); } };
  pair(c.r, s => d(tw - pad * .55, cy + s)); pair(c.l, s => d(pad * .55, cy + s));
  pair(c.t, s => d(cx + s, pad * .5)); pair(c.b, s => d(cx + s, th - pad * .5));
  return `<div style="position:relative;width:${tw}px;height:${th}px;direction:ltr">
   <div style="position:absolute;left:0;right:0;top:${pad}px;height:${H}px;display:flex;align-items:center;justify-content:center;font:800 ${fs}px Pop;color:${col}">${sym}</div>${h}</div>`;
}

// ---------- Lewis periodic table (book intro image) ----------
const PT = [
  [['H', 1], ...Array(16).fill(null), ['He', 2]],
  [['Li', 1], ['Be', 2], ...Array(10).fill(null), ['B', 3], ['C', 4], ['N', 5], ['O', 6], ['F', 7], ['Ne', 8]],
  [['Na', 1], ['Mg', 2], ...Array(10).fill(null), ['Al', 3], ['Si', 4], ['P', 5], ['S', 6], ['Cl', 7], ['Ar', 8]],
  [['K', 1], ['Ca', 2], ...Array(10).fill(0), ['Ga', 3], ['Ge', 4], ['As', 5], ['Se', 6], ['Br', 7], ['Kr', 8]],
  [['Rb', 1], ['Sr', 2], ...Array(10).fill(0), ['In', 3], ['Sn', 4], ['Sb', 5], ['Te', 6], ['I', 7], ['Xe', 8]],
  [['Cs', 1], ['Ba', 2], ...Array(10).fill(0), ['Tl', 3], ['Pb', 4], ['Bi', 5], ['Po', 6], ['At', 7], ['Rn', 8]],
  [['Fr', 1], ['Ra', 2], ...Array(10).fill(0), ['Nh', 3], ['Fl', 4], ['Mc', 5], ['Lv', 6], ['Ts', 7], ['Og', 8]],
];
const GCOL = { 1: '#ff8fa3', 2: '#ffb27a', 3: '#ffd166', 4: '#8fe3a8', 5: '#6fd3e8', 6: '#8fb5ff', 7: '#b79cff', 8: '#ff7b8a' };
function ptable() {
  const cell = 118;
  let h = `<div id="pt" style="display:inline-grid;grid-template-columns:repeat(18,${cell}px);grid-auto-rows:${cell}px;gap:10px;padding:36px;direction:ltr">`;
  PT.forEach(row => row.forEach(e => {
    if (e === null) { h += '<div></div>'; return; }
    if (e === 0) { h += `<div style="border-radius:14px;background:linear-gradient(150deg,#ffffff,#e6eef8);box-shadow:0 6px 0 #c9d6e6,0 12px 18px rgba(31,80,140,.15)"></div>`; return; }
    const [s, n] = e, c = s === 'He' ? GCOL[8] : GCOL[n];
    const v = s === 'He' ? 2 : n;
    h += `<div style="border-radius:14px;display:flex;align-items:center;justify-content:center;
      background:linear-gradient(150deg,#ffffff 0%,${c}55 55%,${c}aa 100%);box-shadow:0 7px 0 ${c},0 14px 22px rgba(31,80,140,.22),inset 0 3px 0 #fff">
      <div style="transform:scale(${s.length > 1 ? .4 : .45})">${lewis(s, v, { fs: 120, dotColor: '#1d3b6e', color: '#16325c' })}</div></div>`;
  }));
  return h + '</div>';
}
// He as pair: override dots(2) gives r,l -> fine but book shows He: — acceptable

// ---------- noble gas red tiles (book margin) ----------
const NG = [['He', 2, 'Helium'], ['Ne', 10, 'Neon'], ['Ar', 18, 'Argon'], ['Kr', 36, 'Krypton'], ['Xe', 54, 'Xenon'], ['Rn', 86, 'Radon'], ['Og', 118, 'Oganesson']];
function noble() {
  return `<div id="ng" style="display:inline-flex;gap:26px;padding:30px 30px 50px;direction:ltr">${NG.map(([s, z, n]) => `
   <div style="width:190px;height:220px;border-radius:24px;position:relative;
     background:linear-gradient(150deg,#ff9a9a 0%,#ff4d4d 45%,#d61f2c 100%);
     box-shadow:0 12px 0 #9e1520,0 26px 34px rgba(150,20,30,.35),inset 0 4px 0 rgba(255,255,255,.55)">
     <div style="position:absolute;top:12px;left:16px;font:800 28px Pop;color:#fff;opacity:.9">${z}</div>
     <div style="position:absolute;top:44px;width:100%;text-align:center;font:800 96px Pop;color:#fff;text-shadow:0 5px 0 #a3121e,0 10px 18px rgba(0,0,0,.25)">${s}</div>
     <div style="position:absolute;bottom:14px;width:100%;text-align:center;font:700 24px Pop;color:#fff">${n}</div></div>`).join('')}</div>`;
}

// ---------- warning icon & bulb icons ----------
const warn = `<div id="w" style="padding:20px;display:inline-block"><svg width="300" height="270" viewBox="0 0 100 90">
 <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7a7a"/><stop offset="1" stop-color="#d7263d"/></linearGradient></defs>
 <path d="M50 6 L94 82 Q96 86 91 86 H9 Q4 86 6 82 Z" fill="url(#g)" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>
 <rect x="45" y="30" width="10" height="32" rx="5" fill="#fff"/><circle cx="50" cy="72" r="6" fill="#fff"/></svg></div>`;

const ONLY = process.argv[2];
const jobs0 = [
  ['bg_title', `<div id="x" style="width:2400px;height:1350px;position:relative">${bg('title')}</div>`, '#x'],
  ['bg_content', `<div id="x" style="width:2400px;height:1350px;position:relative">${bg('content')}</div>`, '#x'],
  ['bg_content2', `<div id="x" style="width:2400px;height:1350px;position:relative">${bg('content', 'الدرس [2-1]: الرابطة الأيونية')}</div>`, '#x'],
  ['ptable', ptable(), '#pt'], ['noble', noble(), '#ng'], ['warn', warn, '#w'],
];
const L = { Be: 2, H: 1, C: 4, N: 5, K: 1, Li: 1, F: 7, Mg: 2, S: 6, Ca: 2, Na: 1, Cl: 7 };
for (const [s, n] of Object.entries(L)) {
  jobs0.push([`lewis_${s}`, `<div id="l" style="display:inline-block">${lewis(s, n, { fs: 150, dotColor: '#e8335f' })}</div>`, '#l']);
  jobs0.push([`lewisA_${s}`, `<div id="l" style="display:inline-block">${lewis(s, n, { fs: 150, color: '#0b8a5a', dotColor: '#0b8a5a' })}</div>`, '#l']);
}
const jobs = ONLY ? jobs0.filter(j => j[0] === ONLY) : jobs0;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 2600, height: 1500 } });
  for (const [name, html, sel] of jobs) {
    require('fs').writeFileSync(path.join(__dirname,'tmp.html'),`<html><head><meta charset=utf-8><style>${css}</style></head><body>${html}</body></html>`); await p.goto('file://'+path.join(__dirname,'tmp.html'));
    await p.evaluate(() => document.fonts.ready);
    await p.locator(sel).screenshot({ path: path.join(OUT, name + '.png'), omitBackground: true });
  }
  await b.close(); console.log('done', jobs.length);
})();
