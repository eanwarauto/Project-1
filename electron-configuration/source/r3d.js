const { chromium } = require('playwright');
const path = require('path');
const OUT = path.join(__dirname, 'assets');
const I = 'inner', V = 'val', G = 'gain';
const rep = (t, n) => Array(n).fill(t);
const jobs = [
  { name: 'hero_atom', w: 1500, h: 1500, kind: 'hero', dist: 11 },
  { name: 'carbon', w: 1400, h: 1100, kind: 'bohr', shells: [rep(I, 2), rep(V, 4)], hiOuter: true, nuc: 12, dist: 9.5, tiltX: -0.35, tiltY: 0.15 },
  { name: 'na_atom', w: 1200, h: 1200, kind: 'bohr', shells: [rep(I, 2), rep(I, 8), rep(V, 1)], hiOuter: true, nuc: 16, r0: 1.2, dr: 0.95, dist: 12, eR: 0.16 },
  { name: 'na_ion', w: 1200, h: 1200, kind: 'bohr', shells: [rep(I, 2), rep(V, 8)], hiOuter: true, nuc: 16, r0: 1.2, dr: 0.95, dist: 12, eR: 0.16 },
  { name: 'cl_atom', w: 1200, h: 1200, kind: 'bohr', shells: [rep(I, 2), rep(I, 8), rep(V, 7)], hiOuter: true, nuc: 18, r0: 1.2, dr: 0.95, dist: 12, eR: 0.16 },
  { name: 'cl_ion', w: 1200, h: 1200, kind: 'bohr', shells: [rep(I, 2), rep(I, 8), [...rep(V, 7), G]], hiOuter: true, nuc: 18, r0: 1.2, dr: 0.95, dist: 12, eR: 0.16 },
  { name: 'octet', w: 1300, h: 1300, kind: 'bohr', shells: [rep(I, 2), rep(V, 8)], hiOuter: true, nuc: 14, dist: 9.5, tiltX: -0.45 },
  { name: 'helium', w: 1100, h: 1100, kind: 'bohr', shells: [rep(V, 2)], hiOuter: true, nuc: 4, nucR: 0.5, r0: 1.6, dist: 7.5, tiltX: -0.45 },
  { name: 'be_atom', w: 1100, h: 1100, kind: 'bohr', shells: [rep(I, 2), rep(V, 2)], hiOuter: true, nuc: 9, dist: 8.5, tiltX: -0.45 },
  ...[['sp_teal',0x14b8a6],['sp_coral',0xff4f7b],['sp_gold',0xffb703],['sp_purple',0x7c5cff],['sp_blue',0x2f80ed],['sp_green',0x12b76a]].map(([n,c])=>({name:n,w:500,h:500,kind:'sphere',color:c,dist:5.2})),
  { name: 'nacl_lattice', w: 1400, h: 1400, kind: 'lattice', dist: 9.5 },
  { name: 'ion_pair', w: 1700, h: 1000, kind: 'ionpair', dist: 10 },
  { name: 'lattice_big', w: 1500, h: 1500, kind: 'lattice', n: 4, a: 1.0, rb: 0.3, rs: 0.22, c1: 0x34c759, c2: 0x2f6fed, dist: 11 },
  { name: 'beaker', w: 1100, h: 1400, kind: 'beaker', dist: 8.5 },
];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const p = await b.newPage();
  p.on('console', m => console.log('console:', m.text())); p.on('pageerror', e => console.log('err', e));
  await p.goto('file://' + path.join(__dirname, 'r3d.html')); await p.waitForFunction(() => window.ready);
  for (const j of (process.argv[2] ? jobs.filter(x => x.name === process.argv[2]) : jobs)) {
    await p.setViewportSize({ width: j.w, height: j.h });
    await p.evaluate(c => window.renderScene(c), j);
    await p.locator('canvas').screenshot({ path: path.join(OUT, j.name + '.png'), omitBackground: true });
    console.log('ok', j.name);
  }
  await b.close();
})();
