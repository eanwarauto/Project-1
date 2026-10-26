const { all } = require('./spec');
const out = {};
for (const s of all) {
  out[s.src] = s.items.filter(it => it.erase || ((it.e || 't') !== 'n' && (it.t !== undefined || it.ep)))
    .map(it => ({ r: it.erase || it.ep || it.b, m: it.e === 'f' || it.e === 'v' ? it.e : 't', thr: it.thr || 0 }));
}
require('fs').writeFileSync('erase.json', JSON.stringify(out));
console.log(Object.keys(out).length);
