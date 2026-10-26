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
pres.title = 'خواص المركبات الأيونية';
pres.theme = { headFontFace: 'Arial', bodyFontFace: 'Arial' };
const ANIM = []; let cur, curAnim, n = 0;
const reg = (o, fx, trig, dur, delay = 0) => { const name = `anim_${ANIM.length}_${++n}`; curAnim.push({ name, fx, trig, dur, delay }); return { ...o, objectName: name }; };
const LRM = '‎', RLM = '‏';
// `...` = left-to-right chemistry chunk: digits after a symbol/")" are subscripts, ^x is a superscript charge
function chem(t, o) {
  const out = []; let i = 0, buf = '';
  const flush = () => { if (buf) out.push({ text: buf, options: { ...o } }); buf = ''; };
  while (i < t.length) {
    const ch = t[i];
    if (ch === '^') { flush(); let j = i + 1; while (j < t.length && /[0-9+\-−]/.test(t[j])) j++; out.push({ text: t.slice(i + 1, j).replace('-', '−'), options: { ...o, superscript: true } }); i = j; continue; }
    if (/[0-9]/.test(ch) && /[A-Za-z)]/.test(t[i - 1] || '') && !/[ .(]/.test(t[i - 1] || '')) {
      flush(); let j = i; while (j < t.length && /[0-9]/.test(t[j])) j++;
      // only treat as subscript inside a formula (next char is a letter, end, space, comma or ")")
      out.push({ text: t.slice(i, j), options: { ...o, subscript: true } }); i = j; continue;
    }
    buf += ch; i++;
  }
  flush();
  return out;
}
function pieces(t, o, rtl) {
  // split one string into runs; LRM-wrap chemistry chunks and Latin words so Arabic/English mix keeps its order
  const res = [];
  t.split('`').forEach((seg, k) => {
    if (!seg) return;
    if (k % 2) {
      const rs = /^[0-9 .°C()−=×+\-]+$/.test(seg) || /\(/.test(seg) && /[=]/.test(seg) ? [{ text: seg, options: { ...o } }] : chem(seg, o);
      if (rtl) { rs[0].text = LRM + rs[0].text; rs[rs.length - 1].text += LRM; }
      res.push(...rs);
    } else {
      res.push({ text: rtl ? seg.replace(/[A-Za-z][A-Za-z .]*[A-Za-z]|[A-Za-z]/g, m => LRM + m + LRM) : seg, options: { ...o } });
    }
  });
  return res;
}
function runs(t, base, rtl) {
  const parts = (Array.isArray(t) ? t : [t]).map(p => typeof p === 'string' ? { text: p, options: {} } : p);
  const out = [];
  for (const p of parts) {
    const segs = p.text.split('\n');
    segs.forEach((s, i) => {
      const starts = !out.length || out[out.length - 1].options.breakLine;
      if (s) {
        const ps = pieces(s, { ...base, ...p.options }, rtl);
        if (rtl && starts) ps[0].text = RLM + ps[0].text;
        out.push(...ps);
      }
      if (i < segs.length - 1) {
        if (out.length) out[out.length - 1].options = { ...out[out.length - 1].options, breakLine: true };
        else out.push({ text: ' ', options: { ...base, breakLine: true } });
      }
    });
  }
  return out;
}
(async () => {
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
      const flat = (Array.isArray(it.t) ? it.t : [it.t]).map(p => typeof p === 'string' ? p : p.text).join('');
      if (!/[\u0600-\u06FF]/.test(flat)) it.ltr = true;
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
