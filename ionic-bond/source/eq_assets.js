// معادلات الترتيب النقطي للدرس [2-1] الرابطة الأيونية + أيقونات صغيرة
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const OUT = path.join(__dirname, 'assets');
const F = path.join(__dirname, '..', '..', 'assets', 'fonts') + '/';
const FONTS = fs.existsSync(F) ? F : '/home/user/Project-1/assets/fonts/';
const css = `
@font-face{font-family:Pop;font-weight:700;src:url(file://${FONTS}poppins-latin-700-normal.woff2)}
@font-face{font-family:Pop;font-weight:800;src:url(file://${FONTS}poppins-latin-800-normal.woff2)}
@font-face{font-family:Cairo;font-weight:800;src:url(file://${FONTS}cairo-arabic-800-normal.woff2)}
*{margin:0;padding:0;box-sizing:border-box} html,body{background:transparent}
.eq{display:inline-block;padding:34px 56px;border-radius:36px;background:linear-gradient(160deg,#eef6fd,#d8eaf8);
  box-shadow:0 10px 0 #b9d4ec,0 22px 40px rgba(31,80,140,.22),inset 0 3px 0 #fff;font:800 FSpx Pop;color:#16325c;position:relative}
table{border-collapse:collapse} td{text-align:center;vertical-align:middle;padding:0 14px;white-space:nowrap}
.row2 td{font:700 0.62em Pop;padding-top:10px}
.op{font-weight:700;color:#16325c;font-size:1.05em} .coef{color:#e8335f;margin-right:.18em} .red{color:#e8335f}
.sp{position:relative;display:inline-block}
.sym{display:block;padding:0.36em 0.42em;line-height:1}
.dot{position:absolute;width:.17em;height:.17em;border-radius:50%;
  box-shadow:0 2px 5px rgba(0,0,0,.25)}
.chg{position:absolute;right:-.12em;top:-.05em;font-size:.48em;font-weight:800}
sub{font-size:.55em;vertical-align:-.25em} sup{font-size:.5em;vertical-align:.8em}
`;
const COL = { n: '#16325c', r: '#e8335f' };
const grad = c => `background:radial-gradient(circle at 35% 30%,#fff 0%,${c} 45%,${c} 75%,rgba(0,0,0,.3) 125%)`;
// dots: {r:'nn', l:'r', t:'nn', b:'n'}  n = navy electron, r = red (transferred) electron
function sp(sym, dots = {}, o = {}) {
  const d = (side, k, n, c, id) => {
    const off = n === 1 ? 0 : (k ? .13 : -.13);
    const pos = { r: `right:0;top:calc(50% - .085em + ${off}em)`, l: `left:0;top:calc(50% - .085em + ${off}em)`,
      t: `top:.06em;left:calc(50% - .085em + ${off}em)`, b: `bottom:.06em;left:calc(50% - .085em + ${off}em)` }[side];
    return `<span ${id ? `id="${id}"` : ''} class="dot" style="${pos};${grad(COL[c])}"></span>`;
  };
  let h = '';
  for (const side of ['r', 'l', 't', 'b']) {
    const s = dots[side] || '';
    [...s].forEach((c, k) => { h += d(side, k, s.length, c, o.mark && o.mark[0] === side && o.mark[1] === k ? o.id : null); });
  }
  const chg = o.charge ? `<span class="chg" style="right:${o.charge.length > 1 ? '-.55em' : '-.3em'}">${o.charge}</span>` : '';
  return `${o.coef ? `<span class="coef">${o.coef}</span>` : ''}<span class="sp" ${o.box ? `id="${o.box}"` : ''} style="margin-right:${o.charge ? (o.charge.length > 1 ? '.5em' : '.25em') : 0}"><span class="sym">${sym}</span>${h}${chg}</span>`;
}
const op = v => `<span class="op">${v}</span>`;
const ARROW = `<span class="op" style="font-size:1.3em">&#x2192;</span>`;
function eq(cells, rows = [], fs = 110, curve) {
  const tr = r => `<tr class="row2">${r.map(c => (typeof c === 'object' && c ? `<td colspan="${c.span}">${c.v}</td>` : `<td>${c ?? ''}</td>`)).join('')}</tr>`;
  return `<div class="eq" id="eq" style="font-size:${fs}px${curve ? ';padding-top:120px' : ''}"><table><tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>${rows.map(tr).join('')}</table>
   ${curve ? '<svg id="cv" style="position:absolute;left:0;top:0;overflow:visible" width="10" height="10"></svg>' : ''}</div>`;
}
const CL = { t: 'nn', b: 'nn', r: 'nn', l: 'n' }, CLm = { t: 'nn', b: 'nn', r: 'nn', l: 'rn' };
const O6 = { t: 'nn', r: 'nn', l: 'n', b: 'n' };
const minus = '&#x2212;';
const jobs = [
  ['eq_nacl', eq([sp('Na', { r: 'r' }, { mark: ['r', 0], id: 'from' }), op('+'), sp('Cl', CL, { box: 'to' }), ARROW, sp('Na', {}, { charge: '+' }), sp('Cl', CLm, { charge: minus }), '<span style="margin-left:.6em">NaCl</span>'], [], 110, true)],
  ['eq_mgo', eq([sp('Mg', { r: 'rr' }), op('+'), sp('O', O6), ARROW, sp('Mg', {}, { charge: '2+' }), sp('O', { t: 'nn', r: 'nn', l: 'rr', b: 'nn' }, { charge: '2' + minus }), '<span style="margin-left:.6em">MgO</span>'])],
  ['eq_charge', eq([sp('Na', { r: 'r' }), op('+'), sp('Cl', CL), ARROW, sp('Na', {}, { charge: '+' }), sp('Cl', CLm, { charge: minus })],
    [['0', '+', '0', '&#x2192;', '+1', '+ (-1)'], [{ span: 3, v: '0' }, '=', { span: 2, v: '0' }]], 100)],
  ['eq_kcl', eq([sp('K', { r: 'r' }), op('+'), sp('Cl', CL), ARROW, sp('K', {}, { charge: '+' }), sp('Cl', CLm, { charge: minus }), '<span style="margin-left:.6em">KCl</span>'])],
  ['eq_cao', eq([sp('Ca', { r: 'rr' }), op('+'), sp('O', O6), ARROW, sp('Ca', {}, { charge: '2+' }), sp('O', { t: 'nn', r: 'nn', l: 'rr', b: 'nn' }, { charge: '2' + minus }), '<span style="margin-left:.6em">CaO</span>'])],
  ['eq_k2o_a', eq([sp('K', { r: 'r' }), op('+'), sp('O', O6), ARROW, sp('K', {}, { charge: '+' }), sp('O', { t: 'nn', r: 'nn', l: 'rn', b: 'n' }, { charge: minus })])],
  ['eq_k2o_b', eq([sp('K', { r: 'r' }, { coef: '2' }), op('+'), sp('O', O6, { coef: '1' }), ARROW, sp('K', {}, { coef: '2', charge: '+' }), sp('O', { t: 'nn', r: 'nn', l: 'rr', b: 'nn' }, { charge: '2' + minus }), '<span style="margin-left:.6em">K<sub>2</sub>O</span>'])],
  ['eq_li3n_a', eq([sp('Li', { r: 'n' }), op('+'), sp('N', { l: 'n', r: 'n', t: 'nn', b: 'n' }), ARROW, op('??')],
    [['2,1', '', '2,5', '', ''], [`<span class="red">1e<sup>${minus}</sup></span>`, '', `<span class="red">3e<sup>${minus}</sup></span>`, '', '']], 110)],
  ['eq_li3n_b', eq([sp('Li', { r: 'r' }, { coef: '3' }), op('+'), sp('N', { l: 'n', r: 'n', t: 'nn', b: 'n' }, { coef: '1' }), ARROW, sp('Li', {}, { coef: '3', charge: '+' }), sp('N', { t: 'nn', l: 'rn', r: 'rn', b: 'rn' }, { charge: '3' + minus }), '<span style="margin-left:.6em">Li<sub>3</sub>N</span>'])],
  ['eq_caf2', eq([sp('Ca', { r: 'rr' }), op('+'), sp('F', { t: 'nn', b: 'nn', r: 'nn', l: 'n' }, { coef: '2' }), ARROW, sp('Ca', {}, { charge: '2+' }), sp('F', { t: 'nn', b: 'nn', r: 'nn', l: 'rn' }, { coef: '2', charge: minus }), '<span style="margin-left:.6em">CaF<sub>2</sub></span>'])],
  ['bulb', `<div id="eq" style="display:inline-block;padding:10px"><svg width="300" height="380" viewBox="0 0 100 126">
    <defs><radialGradient id="g" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#fffbe0"/><stop offset=".45" stop-color="#ffd84d"/><stop offset="1" stop-color="#f2a900"/></radialGradient>
    <linearGradient id="m" x1="0" x2="1"><stop offset="0" stop-color="#8aa0b8"/><stop offset=".5" stop-color="#e6eef6"/><stop offset="1" stop-color="#7b8fa6"/></linearGradient></defs>
    <circle cx="50" cy="44" r="38" fill="url(#g)" stroke="#d48a00" stroke-width="2"/>
    <path d="M38 76 Q36 66 32 62 M62 76 Q64 66 68 62" stroke="#d48a00" stroke-width="2" fill="none"/>
    <path d="M42 46 L46 56 L50 46 L54 56 L58 46" stroke="#b86e00" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
    <rect x="34" y="78" width="32" height="26" rx="5" fill="url(#m)" stroke="#5d7088" stroke-width="1.5"/>
    <path d="M34 86 H66 M34 94 H66" stroke="#5d7088" stroke-width="1.5"/><path d="M42 104 H58 L54 114 H46 Z" fill="#4a5b70"/>
    <ellipse cx="38" cy="28" rx="9" ry="6" fill="#fff" opacity=".7" transform="rotate(-30 38 28)"/></svg></div>`],
];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 3000, height: 1200 } });
  for (const [name, html] of jobs) {
    fs.writeFileSync(path.join(__dirname, 'tmp.html'), `<!doctype html><html><head><meta charset=utf-8><style>${css.replace('FSpx', '110px')}</style></head><body>${html}</body></html>`);
    await p.goto('file://' + path.join(__dirname, 'tmp.html')); await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => { // curved arrow from Na electron to Cl
      const cv = document.getElementById('cv'); if (!cv) return;
      const eq = document.getElementById('eq').getBoundingClientRect();
      const a = document.getElementById('from').getBoundingClientRect(), t = document.getElementById('to').getBoundingClientRect();
      const x1 = a.left + a.width / 2 - eq.left, y1 = a.top - eq.top - 6, x2 = t.left + 18 - eq.left, y2 = t.top + t.height * .35 - eq.top;
      const cx = (x1 + x2) / 2, cy = Math.min(y1, y2) - 110;
      cv.innerHTML = `<defs><marker id="ah" markerUnits="userSpaceOnUse" markerWidth="44" markerHeight="44" refX="30" refY="22" orient="auto"><path d="M0 0 L44 22 L0 44 Z" fill="#1f6fb2"/></marker></defs>
        <path d="M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}" stroke="#1f6fb2" stroke-width="9" fill="none" marker-end="url(#ah)" stroke-linecap="round"/>`;
    });
    await p.locator('#eq').screenshot({ path: path.join(OUT, name + '.png'), omitBackground: true });
  }
  await b.close(); console.log('done', jobs.length);
})();
