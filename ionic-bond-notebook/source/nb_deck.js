// Builds the two decks: cleaned picture per slide + editable bold text boxes with entrance animations.
const pptxgen = require('pptxgenjs');
const sharp = require('sharp');
const fs = require('fs'), path = require('path');
const { decks } = require('./spec');
const which = process.argv[2], OUT = process.argv[3];
const K = 17.7778 / 1365.5;
const X = px => (px - 5) * K, Y = py => py * 10 / 768;
const pres = new pptxgen();
pres.defineLayout({ name: 'NB', width: 17.7778, height: 10 });
pres.layout = 'NB'; pres.rtlMode = true;
pres.title = 'الترتيب الإلكتروني وإلكترونات التكافؤ';
pres.theme = { headFontFace: 'Arial', bodyFontFace: 'Arial' };
const ANIM = []; let cur, curAnim, n = 0;
const reg = (o, fx, trig, dur, delay = 0) => { const name = `anim_${ANIM.length}_${++n}`; curAnim.push({ name, fx, trig, dur, delay }); return { ...o, objectName: name }; };
function runs(t, base, rtl) {
  const parts = (Array.isArray(t) ? t : [t]).map(p => typeof p === 'string' ? { text: p, options: {} } : p);
  const out = [];
  for (const p of parts) {
    const segs = p.text.split('\n');
    segs.forEach((s, i) => {
      const starts = !out.length || out[out.length - 1].options.breakLine;
      if (s) out.push({ text: (rtl && starts ? '\u200F' : '') + s, options: { ...base, ...p.options } });
      if (i < segs.length - 1) {
        if (out.length) out[out.length - 1].options = { ...out[out.length - 1].options, breakLine: true };
        else out.push({ text: ' ', options: { ...base, breakLine: true } });
      }
    });
  }
  return out;
}
const fitStyle = require('../fitstyle.js');
(async () => {
  await fitStyle(decks[which], X, Y);
  const dims = {};
  for (const s of decks[which]) for (const it of s.items) if (it.img && !dims[it.img]) { const m = await sharp(it.img).metadata(); dims[it.img] = m.width / m.height; }
  for (const s of decks[which]) {
    cur = pres.addSlide(); curAnim = []; ANIM.push(curAnim);
    cur.addImage({ path: `clean_${s.src}.jpg`, x: 0, y: 0, w: 17.7778, h: 10, altText: 'خلفية الشريحة' });
    for (const it of s.items) {
      if (it.erase) continue;
      const [x0, y0, x1, y1] = it.b;
      const trig = it.trig || 'after';
      if (it.img) {
        const bw = X(x1) - X(x0), bh = Y(y1) - Y(y0), ar = dims[it.img];
        let w = bh * ar, h = bh; if (w > bw) { w = bw; h = bw / ar; }
        cur.addImage(reg({ path: it.img, x: X(x0) + (bw - w) / 2, y: Y(y0) + (bh - h) / 2, w, h, altText: 'الترتيب النقطي' }, 'zoom', trig, 500));
        continue;
      }
      const base = { fontFace: 'Arial', bold: true, color: it.c, fontSize: it.s };
      const o = {
        x: X(x0), y: Y(y0), w: X(x1) - X(x0), h: Y(y1) - Y(y0), margin: 0, isTextBox: true,
        align: { r: 'right', c: 'center', l: 'left' }[it.a || 'r'], valign: 'middle', rtlMode: !it.ltr, lang: it.ltr ? 'en-US' : 'ar-KW',
        lineSpacingMultiple: it.ls || 1.05, paraSpaceAfter: 0, fontFace: 'Arial', bold: true, color: it.c, fontSize: it.s,
      };
      if (it.rot) o.rotate = it.rot;
      if (it.glow) o.glow = { ...it.glow };
      if (it.outline) o.outline = { ...it.outline };
      if (it.outline || it.glow) o.shadow = { type: 'outer', color: '000000', opacity: 0.35, blur: 6, offset: 3, angle: 90 };
      cur.addText(runs(it.t, base, !it.ltr), reg(o, it.fx || (it.ltr ? 'fade' : 'wipeR'), trig, it.dur || (it.fx === 'zoom' ? 500 : 700)));
    }
  }
  await pres.writeFile({ fileName: OUT });
  fs.writeFileSync(OUT.replace(/\.pptx$/, '.anim.json'), JSON.stringify(ANIM));
  console.log('written', OUT, ANIM.length);
})();
