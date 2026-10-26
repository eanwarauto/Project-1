const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const F = '/home/user/Project-1/assets/fonts/';
const css = `@font-face{font-family:Pop;font-weight:800;src:url(file://${F}poppins-latin-800-normal.woff2)}*{margin:0;padding:0}html,body{background:transparent}`;
const ORDER = ['r', 'l', 't', 'b'];
function lewis(sym, n, { color, dot, glow }) {
  const fs = 150, d = 26, c = { r: 0, l: 0, t: 0, b: 0 }; for (let i = 0; i < n; i++) c[ORDER[i % 4]]++;
  const gap = d * 1.3, W = fs * (sym.length > 1 ? 1.35 : .9), H = fs * 1.05, pad = d * 2.2, tw = W + pad * 2, th = H + pad * 2, cx = tw / 2, cy = pad + H / 2;
  const dd = (x, y) => `<div style="position:absolute;left:${x - d / 2}px;top:${y - d / 2}px;width:${d}px;height:${d}px;border-radius:50%;background:${dot};${glow ? `box-shadow:0 0 12px ${glow}` : ''}"></div>`;
  let h = ''; const pair = (k, f) => { if (k === 1) h += f(0); if (k === 2) { h += f(-gap / 2); h += f(gap / 2); } };
  pair(c.r, s => dd(tw - pad * .55, cy + s)); pair(c.l, s => dd(pad * .55, cy + s)); pair(c.t, s => dd(cx + s, pad * .5)); pair(c.b, s => dd(cx + s, th - pad * .5));
  return `<div id="l" style="position:relative;display:inline-block;width:${tw}px;height:${th}px"><div style="position:absolute;left:0;right:0;top:${pad}px;height:${H}px;display:flex;align-items:center;justify-content:center;font:800 ${fs}px Pop;color:${color};${glow ? `text-shadow:0 0 14px ${glow}` : ''}">${sym}</div>${h}</div>`;
}
const V = { Mg: 2, F: 7, Li: 1, N: 5, S: 6, Ca: 2, Be: 2, K: 1, H: 1, C: 4 };
const STY = { W: { color: '#ffffff', dot: '#ffffff', glow: 'rgba(120,220,255,.9)' }, N: { color: '#1e2a3a', dot: '#e8862a' }, K: { color: '#111111', dot: '#111111' }, T: { color: '#2a9fb0', dot: '#3fd3e6', glow: 'rgba(63,211,230,.6)' } };
const jobs = [['W', ['Mg', 'F', 'Li']], ['N', ['N', 'S', 'Ca']], ['K', ['Be', 'K', 'N', 'H', 'C', 'F', 'Mg', 'Li']], ['T', ['N', 'S', 'Ca']]];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  for (const [k, syms] of jobs) for (const s of syms) {
    fs.writeFileSync(path.join(__dirname, 'l.html'), `<!doctype html><html><head><meta charset=utf-8><style>${css}</style></head><body>${lewis(s, V[s], STY[k])}</body></html>`);
    await p.goto('file://' + path.join(__dirname, 'l.html')); await p.evaluate(() => document.fonts.ready);
    await p.locator('#l').screenshot({ path: path.join(__dirname, `lew${k}_${s}.png`), omitBackground: true });
  }
  await b.close(); console.log('lewis ok');
})();
