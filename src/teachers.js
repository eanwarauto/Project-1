// يولّد بطاقات معلمات قسم الفيزياء والكيمياء (ورقة A4 لكل معلمة) كملف PDF وصور PNG.
// التشغيل: node src/teachers.js
const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

const ROOT = path.join(__dirname, '..')
const FONTS = path.join(ROOT, 'assets', 'fonts')
const OUT = path.join(ROOT, 'teachers')
const fontUrl = f => 'file://' + path.join(FONTS, f)
const LOGO = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(ROOT, 'assets', 'dept-logo.jpg')).toString('base64')

const SCHOOL = 'مدرسة الشرقية الثانوية للبنات'

// الفصول من جدول المعلمات: «10/5» عاشر، «11ع3» حادي عشر علمي
const DATA = {
  chem: [
    ['وضحى العجمي', ['10/1', '12ع4', '12ع6']],
    ['سماح أحمد', ['11ع4', '11ع6', '12ع2']],
    ['نوره العجمي', ['10/2', '11ع1', '11ع2']],
    ['أنوار صالح', ['10/5', '11ع3', '11ع5']],
    ['فاطمة عبدالله', ['10/3', '10/4', '10/7', '12ع5']],
    ['شيخة الدوسري', ['10/6', '12ع1', '12ع3']],
  ],
  phys: [
    ['جمانه دشتي', ['10/3', '10/4']],
    ['انجي الدسوقي', ['11ع4', '12ع2', '12ع3']],
    ['شيماء محمد', ['11ع3', '12ع4', '12ع6']],
    ['شيماء الظفيري', ['10/7', '12ع1', '12ع5']],
    ['وسمية سعد', ['10/1', '11ع2', '11ع5']],
    ['نور نادر', ['10/2', '11ع1', '11ع6']],
    ['زهراء علي', ['10/5', '10/6']],
  ],
}

const THEMES = {
  chem: {
    title: 'الكيمياء', en: 'CHEMISTRY',
    c1: '#E2477F', c2: '#B3245E', deep: '#7A1440', soft: '#FFE3EE', softer: '#FFF5F9', glow: '#FFB8D2',
  },
  phys: {
    title: 'الفيزياء', en: 'PHYSICS',
    c1: '#8B63E6', c2: '#6440C4', deep: '#35207E', soft: '#ECE4FF', softer: '#F8F5FF', glow: '#CBB8FF',
  },
}

const GRADE = { 10: 'الصف العاشر', 11: 'الحادي عشر علمي', 12: 'الثاني عشر علمي' }

function parse(c) {
  const m = c.match(/^(\d+)(\/|ع)(\d+)$/)
  return { grade: m[1], sep: m[2], sec: m[3] }
}

// شكل الفصل: الصف يمين ثم الفاصل ثم الشعبة (قراءة من اليمين لليسار) والأرقام إنجليزية
function classCard(c, t) {
  const { grade, sep, sec } = parse(c)
  return `
  <div class="cls">
    <div class="cls-top">${GRADE[grade]}</div>
    <div class="cls-num">
      <span class="g">${grade}</span>
      <span class="sep ${sep === 'ع' ? 'ain' : 'slash'}">${sep}</span>
      <span class="s">${sec}</span>
    </div>
    <div class="cls-bar"></div>
  </div>`
}

// ---------- زخارف ----------
const hex = (x, y, r, o, sw = 2) => {
  const pts = [...Array(6)].map((_, i) => {
    const a = Math.PI / 3 * i + Math.PI / 6
    return `${(x + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')
  return `<polygon points="${pts}" fill="none" stroke="currentColor" stroke-width="${sw}" opacity="${o}"/>`
}
function benzene(x, y, r, o) {
  return hex(x, y, r, o, 2.4) + `<circle cx="${x}" cy="${y}" r="${r * 0.55}" fill="none" stroke="currentColor" stroke-width="2" opacity="${o}"/>`
}
function chemDeco() {
  let s = ''
  // شبكة سداسيات (هيكل جزيئي) أعلى اليمين
  const r = 34, dx = r * Math.sqrt(3)
  const cells = [[0, 0], [1, 0], [0.5, 1], [1.5, 1], [2, 0], [1, 2], [2.5, 1]]
  cells.forEach(([i, j], k) => {
    const x = 640 - i * dx, y = 40 + j * r * 1.5
    s += k % 3 === 0 ? benzene(x, y, r, 0.22) : hex(x, y, r, 0.16)
  })
  // جزيء بذرات وروابط أسفل اليسار
  const atoms = [[70, 960, 16], [140, 1010, 11], [60, 1060, 10], [210, 975, 13], [270, 1030, 9], [130, 920, 8]]
  const bonds = [[0, 1], [0, 2], [1, 3], [3, 4], [0, 5]]
  bonds.forEach(([a, b]) => { s += `<line x1="${atoms[a][0]}" y1="${atoms[a][1]}" x2="${atoms[b][0]}" y2="${atoms[b][1]}" stroke="currentColor" stroke-width="3" opacity=".2"/>`; })
  atoms.forEach(([x, y, rr]) => { s += `<circle cx="${x}" cy="${y}" r="${rr}" fill="currentColor" opacity=".16"/>`; })
  // فقاعات
  ;[[690, 700, 10], [720, 650, 6], [700, 610, 4], [40, 560, 7], [25, 520, 4]].forEach(([x, y, rr]) => {
    s += `<circle cx="${x}" cy="${y}" r="${rr}" fill="none" stroke="currentColor" stroke-width="2" opacity=".22"/>`
  })
  return s
}
function physDeco() {
  let s = ''
  // ذرة كبيرة بمدارات أعلى اليمين
  const cx = 650, cy = 70
  ;[0, 60, 120].forEach(a => {
    s += `<ellipse cx="${cx}" cy="${cy}" rx="120" ry="42" transform="rotate(${a} ${cx} ${cy})" fill="none" stroke="currentColor" stroke-width="2.4" opacity=".2"/>`
  })
  s += `<circle cx="${cx}" cy="${cy}" r="12" fill="currentColor" opacity=".22"/>`
  ;[[cx + 120, cy], [cx - 60, cy + 104], [cx - 60, cy - 104]].forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="6" fill="currentColor" opacity=".3"/>`; })
  // موجات جيبية أسفل الصفحة
  for (let k = 0; k < 3; k++) {
    let d = `M -10 ${1000 + k * 22}`
    for (let x = -10; x <= 800; x += 10) d += ` L ${x} ${(1000 + k * 22 + Math.sin(x / (38 + k * 8) + k) * (16 - k * 4)).toFixed(1)}`
    s += `<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" opacity="${0.2 - k * 0.05}"/>`
  }
  // عدسة وأشعة يسار الصفحة
  s += `<path d="M 30 520 Q 55 580 30 640 Q 5 580 30 520 Z" fill="none" stroke="currentColor" stroke-width="2" opacity=".2"/>`
  ;[500, 580, 660].forEach((y, i) => { s += `<line x1="-20" y1="${y}" x2="30" y2="${560 + i * 20}" stroke="currentColor" stroke-width="1.6" opacity=".18"/>`; })
  // نقاط مجال
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) s += `<circle cx="${690 + j * 18}" cy="${560 + i * 18}" r="2.4" fill="currentColor" opacity=".2"/>`
  return s
}

// أيقونة المادة في الشارة
const ICON = {
  chem: `<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M24 6 H40 M27 6 V24 L12 50 Q9 58 17 58 H47 Q55 58 52 50 L37 24 V6"/><path d="M17 42 Q32 36 47 42"/><circle cx="28" cy="50" r="2.6" fill="#fff"/><circle cx="37" cy="47" r="2" fill="#fff"/></svg>`,
  phys: `<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="3.2"><ellipse cx="32" cy="32" rx="27" ry="10"/><ellipse cx="32" cy="32" rx="27" ry="10" transform="rotate(60 32 32)"/><ellipse cx="32" cy="32" rx="27" ry="10" transform="rotate(120 32 32)"/><circle cx="32" cy="32" r="4.5" fill="#fff" stroke="none"/></svg>`,
}

function pageHtml(subject, name, classes) {
  const t = THEMES[subject]
  const sorted = [...classes].sort((a, b) => {
    const A = parse(a), B = parse(b)
    return A.grade - B.grade || A.sec - B.sec
  })
  const cols = sorted.length === 4 ? 2 : sorted.length
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face{font-family:Cairo;font-weight:400;src:url(${fontUrl('cairo-arabic-400-normal.woff2')})}
@font-face{font-family:Cairo;font-weight:600;src:url(${fontUrl('cairo-arabic-600-normal.woff2')})}
@font-face{font-family:Cairo;font-weight:700;src:url(${fontUrl('cairo-arabic-700-normal.woff2')})}
@font-face{font-family:Cairo;font-weight:800;src:url(${fontUrl('cairo-arabic-800-normal.woff2')})}
@font-face{font-family:Cairo;font-weight:900;src:url(${fontUrl('cairo-arabic-900-normal.woff2')})}
@font-face{font-family:Pop;font-weight:700;src:url(${fontUrl('poppins-latin-700-normal.woff2')})}
@font-face{font-family:Pop;font-weight:800;src:url(${fontUrl('poppins-latin-800-normal.woff2')})}
@font-face{font-family:Pop;font-weight:500;src:url(${fontUrl('poppins-latin-500-normal.woff2')})}
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:210mm;height:297mm}
body{font-family:Cairo,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#fff;color:${t.deep}}
.page{position:relative;width:210mm;height:297mm;overflow:hidden;
  background:
    radial-gradient(120mm 90mm at 85% 6%, ${t.soft} 0%, transparent 70%),
    radial-gradient(110mm 90mm at 0% 100%, ${t.soft} 0%, transparent 70%),
    linear-gradient(180deg, ${t.softer}, #fff 45%, ${t.softer});}
.deco{position:absolute;inset:0;width:100%;height:100%;color:${t.c2}}
.frame{position:absolute;inset:7mm;border:1.2mm solid ${t.c1};border-radius:9mm;opacity:.9}
.frame2{position:absolute;inset:9.5mm;border:.35mm dashed ${t.glow};border-radius:7mm}
.content{position:absolute;inset:14mm 16mm 14mm;display:flex;flex-direction:column;align-items:center}

/* الرأس */
.head{width:100%;display:flex;align-items:center;justify-content:space-between;direction:rtl}
.school{text-align:right}
.school .s1{font-weight:800;font-size:15pt;color:${t.deep}}
.school .s2{font-weight:600;font-size:11pt;color:${t.c2};margin-top:-1mm}
.logo{width:36mm;height:36mm;border-radius:50%;background:#fff;padding:1.2mm;
  box-shadow:0 2mm 6mm ${t.glow}, 0 0 0 1mm ${t.soft};overflow:hidden}
.logo img{width:100%;height:100%;border-radius:50%;display:block;object-fit:cover}

/* شارة المادة */
.badge{margin-top:9mm;display:flex;align-items:center;gap:4mm;padding:3mm 9mm 3mm 4mm;border-radius:20mm;
  background:linear-gradient(135deg, ${t.c1}, ${t.c2});color:#fff;box-shadow:0 3mm 8mm ${t.glow}}
.badge .ic{width:15mm;height:15mm;border-radius:50%;background:rgba(255,255,255,.18);display:grid;place-items:center;border:.5mm solid rgba(255,255,255,.45)}
.badge .ic svg{width:10mm;height:10mm}
.badge .t{font-weight:900;font-size:30pt;line-height:1.25;text-align:center}
.badge .en{font-family:Pop;font-weight:500;font-size:8.5pt;letter-spacing:1.6mm;opacity:.9;margin-top:2.5mm;text-align:center;direction:ltr;line-height:1}

/* الاسم */
.lbl{margin-top:13mm;font-weight:700;font-size:15pt;color:${t.c2};display:flex;align-items:center;gap:4mm}
.lbl::before,.lbl::after{content:"";width:22mm;height:.6mm;border-radius:1mm;background:linear-gradient(90deg,transparent,${t.c1})}
.lbl::after{background:linear-gradient(270deg,transparent,${t.c1})}
.name{font-weight:900;font-size:50pt;line-height:1.35;color:${t.deep};text-align:center;
  text-shadow:0 1.2mm 0 ${t.soft}}
.uline{width:70mm;height:2mm;border-radius:2mm;background:linear-gradient(90deg, ${t.glow}, ${t.c1}, ${t.glow});margin-top:4mm}

/* الفصول */
.classes{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding-bottom:12mm}
.sect{font-weight:800;font-size:17pt;color:${t.deep};display:flex;align-items:center;gap:3mm}
.sect .n{font-family:Pop;font-weight:700;font-size:12pt;background:${t.soft};color:${t.c2};border-radius:5mm;padding:.5mm 3.5mm}
.grid{margin-top:7mm;display:grid;grid-template-columns:repeat(${cols}, ${cols >= 3 ? '54mm' : '66mm'});gap:7mm;direction:rtl;justify-content:center}
.cls{position:relative;background:#fff;border-radius:7mm;padding:4mm 3mm 6mm;text-align:center;overflow:hidden;
  box-shadow:0 2.5mm 7mm ${t.glow}, inset 0 0 0 .6mm ${t.soft}}
.cls-top{font-weight:700;font-size:11.5pt;color:${t.c2};background:${t.softer};border-radius:4mm;padding:.6mm 0}
.cls-num{display:flex;flex-direction:row;direction:rtl;justify-content:center;align-items:center;gap:${cols >= 3 ? '1.5mm' : '2.5mm'};margin-top:3mm;height:${cols >= 3 ? '36mm' : '34mm'}}
.cls-num .g,.cls-num .s{font-family:Pop;font-weight:800;font-size:${cols >= 3 ? '44pt' : '52pt'};line-height:1;color:${t.deep}}
.cls-num .s{color:${t.c1}}
.cls-num .sep{font-weight:900;color:${t.c2};line-height:1}
.cls-num .slash{font-family:Pop;font-weight:500;font-size:${cols >= 3 ? '34pt' : '40pt'};opacity:.6}
.cls-num .ain{font-family:Cairo;font-size:${cols >= 3 ? '30pt' : '36pt'};margin-top:-3mm}
.cls-bar{position:absolute;bottom:0;left:0;right:0;height:3mm;background:linear-gradient(90deg, ${t.c1}, ${t.c2})}

.foot{position:absolute;bottom:0;left:0;right:0;text-align:center;font-weight:700;font-size:11pt;color:${t.c2};display:flex;justify-content:center;align-items:center;gap:3mm}
.foot .dot{width:2mm;height:2mm;border-radius:50%;background:${t.c1}}
</style></head><body><div class="page">
<svg class="deco" viewBox="0 0 794 1123" preserveAspectRatio="none">${subject === 'chem' ? chemDeco() : physDeco()}</svg>
<div class="frame"></div><div class="frame2"></div>
<div class="content">
  <div class="head">
    <div class="school"><div class="s1">${SCHOOL}</div><div class="s2">قسم الفيزياء والكيمياء</div></div>
    <div class="logo"><img src="${LOGO}"></div>
  </div>
  <div class="badge"><div class="ic">${ICON[subject]}</div><div><div class="t">${t.title}</div><div class="en">${t.en}</div></div></div>
  <div class="lbl">المعلمة</div>
  <div class="name">${name}</div>
  <div class="uline"></div>
  <div class="classes">
  <div class="sect">الفصول <span class="n">${sorted.length}</span></div>
  <div class="grid">${sorted.map(c => classCard(c, t)).join('')}</div>
  </div>
  <div class="foot"><span class="dot"></span>${t.title} · ${SCHOOL}<span class="dot"></span></div>
</div>
</div></body></html>`
}

;(async () => {
  fs.mkdirSync(path.join(OUT, 'pages'), { recursive: true })
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 3 })
  const pg = await ctx.newPage()
  const tmp = path.join(ROOT, 'build', 'teachers')
  fs.mkdirSync(tmp, { recursive: true })
  const pdfs = []
  let i = 0
  for (const subject of ['chem', 'phys']) {
    for (const [name, classes] of DATA[subject]) {
      i++
      const file = path.join(tmp, `${i}.html`)
      fs.writeFileSync(file, pageHtml(subject, name, classes))
      await pg.goto('file://' + file)
      await pg.evaluate(() => document.fonts.ready)
      const base = `${String(i).padStart(2, '0')}-${THEMES[subject].title}-${name}`
      await pg.screenshot({ path: path.join(OUT, 'pages', base + '.png') })
      const pdf = path.join(tmp, `${i}.pdf`)
      await pg.pdf({ path: pdf, format: 'A4', printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } })
      pdfs.push(pdf)
    }
  }
  await browser.close()
  fs.writeFileSync(path.join(tmp, 'list.json'), JSON.stringify(pdfs))
  console.log('pages:', pdfs.length)
})()
