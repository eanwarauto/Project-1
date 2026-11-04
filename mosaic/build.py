"""Builds the mosaic & dilation project poster (HTML + PNG)."""
import math, random, pathlib, asyncio

OUT = pathlib.Path(__file__).parent
random.seed(7)

PALETTE = ["#1d3557", "#e63946", "#f4a261", "#2a9d8f", "#e9c46a", "#457b9d"]

def jitter(hex_color, amt=14):
    r, g, b = (int(hex_color[i:i + 2], 16) for i in (1, 3, 5))
    d = random.randint(-amt, amt)
    return "#%02x%02x%02x" % tuple(max(0, min(255, v + d)) for v in (r, g, b))

def motif(n, cell, ox, oy, grout):
    """Star mosaic on an n x n grid; each cell split in two triangles."""
    parts = []
    c = n / 2
    for i in range(n):
        for j in range(n):
            x, y = ox + j * cell, oy + i * cell
            # diagonal chosen so triangles point toward the centre (diamond look)
            same = (j < c) == (i < c)
            if same:
                tris = [[(x, y), (x + cell, y), (x, y + cell)],
                        [(x + cell, y), (x + cell, y + cell), (x, y + cell)]]
            else:
                tris = [[(x, y), (x + cell, y), (x + cell, y + cell)],
                        [(x, y), (x + cell, y + cell), (x, y + cell)]]
            for t in tris:
                cx = sum(p[0] for p in t) / 3 - ox
                cy = sum(p[1] for p in t) / 3 - oy
                d = abs(cx / cell - c) + abs(cy / cell - c)
                col = PALETTE[int(d) % len(PALETTE)]
                pts = " ".join(f"{px:.1f},{py:.1f}" for px, py in t)
                parts.append(f'<polygon points="{pts}" fill="{jitter(col)}" '
                             f'stroke="#f7f1e3" stroke-width="{grout}" stroke-linejoin="round"/>')
    return "\n".join(parts)

def hexagon(cx, cy, s):
    pts = [(cx + s * math.cos(math.radians(60 * k)), cy + s * math.sin(math.radians(60 * k))) for k in range(6)]
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)

# ---------- Grid panel: originals vs images (k = 2) ----------
U = 32                     # 1 unit = 1 cm on the grid
GW, GH = 31, 11
gx0, gy0 = 0, 0
base = gy0 + 10 * U        # baseline (shapes sit on it)
grid = [f'<rect x="0" y="0" width="{GW*U}" height="{GH*U}" fill="#fffdf8"/>']
for i in range(GW + 1):
    grid.append(f'<line x1="{i*U}" y1="0" x2="{i*U}" y2="{GH*U}" stroke="#cfe0ea" stroke-width="1"/>')
for j in range(GH + 1):
    grid.append(f'<line x1="0" y1="{j*U}" x2="{GW*U}" y2="{j*U}" stroke="#cfe0ea" stroke-width="1"/>')

def lbl(x, y, t, size=17, color="#1d3557", weight=700):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" font-weight="{weight}" text-anchor="middle">{t}</text>'

S = []
# squares
S.append(f'<rect x="{1*U}" y="{base-2*U}" width="{2*U}" height="{2*U}" fill="#e63946" stroke="#1d3557" stroke-width="2.5"/>')
S.append(lbl(2*U, base - 2*U - 10, "2 سم"))
S.append(f'<rect x="{4*U}" y="{base-4*U}" width="{4*U}" height="{4*U}" fill="#e63946" fill-opacity=".55" stroke="#1d3557" stroke-width="2.5" stroke-dasharray="8 5"/>')
S.append(lbl(6*U, base - 4*U - 10, "4 سم"))
# triangles 3-4-5 and 6-8-10
S.append(f'<polygon points="{10*U},{base} {13*U},{base} {10*U},{base-4*U}" fill="#2a9d8f" stroke="#1d3557" stroke-width="2.5"/>')
S.append(lbl(11.5*U, base + 22, "3"))
S.append(lbl(10*U - 14, base - 2*U, "4"))
S.append(lbl(12*U + 6, base - 2.3*U, "5"))
S.append(f'<polygon points="{14*U},{base} {20*U},{base} {14*U},{base-8*U}" fill="#2a9d8f" fill-opacity=".55" stroke="#1d3557" stroke-width="2.5" stroke-dasharray="8 5"/>')
S.append(lbl(17*U, base + 22, "6"))
S.append(lbl(14*U - 16, base - 4*U, "8"))
S.append(lbl(17.6*U, base - 4.4*U, "10"))
for x in (10, 14):  # right-angle marks
    S.append(f'<path d="M{x*U+12},{base} V{base-12} H{x*U}" fill="none" stroke="#1d3557" stroke-width="2"/>')
# hexagons (side 1 and 2)
S.append(f'<polygon points="{hexagon(23*U, base - U*0.866, U)}" fill="#f4a261" stroke="#1d3557" stroke-width="2.5"/>')
S.append(lbl(23*U, base - 2*U - 6, "1 سم"))
S.append(f'<polygon points="{hexagon(27.5*U, base - 2*U*0.866, 2*U)}" fill="#f4a261" fill-opacity=".55" stroke="#1d3557" stroke-width="2.5" stroke-dasharray="8 5"/>')
S.append(lbl(27.5*U, base - 4*U + 2, "2 سم"))
# arrows ×2
for x in (3.5, 13.5, 24.6):
    S.append(f'<text x="{x*U}" y="{base - 5.6*U}" font-size="20" fill="#e63946" font-weight="800" text-anchor="middle" direction="ltr">×2 ⟶</text>')

grid_svg = (f'<svg viewBox="-24 -10 {GW*U+48} {GH*U+44}" width="100%" xmlns="http://www.w3.org/2000/svg" '
            f'font-family="Cairo, DejaVu Sans, sans-serif">' + "\n".join(grid + S) + "</svg>")

# ---------- Mosaic panel: motif and its enlargement ----------
cell = 22
small = motif(6, cell, 20, 20 + 3 * cell, 3)
bigo = 20 + 6 * cell + 110
big = motif(6, 2 * cell, bigo, 20, 3)
mosaic_svg = f'''<svg viewBox="0 0 {bigo + 12*cell + 20} {12*cell + 40}" width="100%" xmlns="http://www.w3.org/2000/svg"
  font-family="Cairo, DejaVu Sans, sans-serif">
  <rect width="100%" height="100%" rx="18" fill="#3b2f2a"/>
  {small}
  {big}
  <text x="{20 + 6*cell + 55}" y="{20 + 6*cell + 8}" font-size="30" font-weight="800" fill="#e9c46a" text-anchor="middle" direction="ltr">×2</text>
  <path d="M{20 + 6*cell + 20},{20 + 6*cell + 24} H{bigo - 18}" stroke="#e9c46a" stroke-width="4" marker-end="url(#ar)"/>
  <defs><marker id="ar" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
    <path d="M0,0 L8,4 L0,8 z" fill="#e9c46a"/></marker></defs>
  <text x="{20 + 3*cell}" y="{20 + 9*cell + 30}" font-size="18" fill="#f7f1e3" text-anchor="middle">الأصل 6×6 سم</text>
  <text x="{bigo + 6*cell}" y="{12*cell + 34}" font-size="0" fill="#f7f1e3"></text>
</svg>'''

# full mosaic tile (decorative frame)
frame = motif(10, 30, 10, 10, 3)
frame_svg = f'<svg viewBox="0 0 320 320" width="100%" xmlns="http://www.w3.org/2000/svg"><rect width="320" height="320" rx="16" fill="#3b2f2a"/>{frame}</svg>'

html = f'''<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>الفسيفساء والرياضيات</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap" rel="stylesheet">
<style>
  :root {{ --ink:#1d3557; --accent:#e63946; --paper:#f7f1e3; --card:#fffdf8; --line:#e2d6bf; }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; background:var(--paper); color:var(--ink); font-family:Cairo, "DejaVu Sans", sans-serif; }}
  .poster {{ width:1200px; margin:0 auto; padding:36px 44px 40px; }}
  header {{ display:flex; align-items:center; gap:28px; background:linear-gradient(135deg,#9b2c5a,#c2185b); color:#fff;
           border-radius:24px; padding:22px 30px; }}
  header .tile {{ width:130px; flex:none; }}
  header h1 {{ margin:0; font-size:50px; line-height:1.2; }}
  header p {{ margin:6px 0 0; font-size:21px; opacity:.95; }}
  h2 {{ font-size:27px; margin:0 0 12px; display:flex; align-items:center; gap:10px; }}
  h2 span {{ background:var(--accent); color:#fff; border-radius:50%; width:40px; height:40px; display:inline-grid; place-items:center; font-size:22px; }}
  .card {{ background:var(--card); border:2px solid var(--line); border-radius:20px; padding:20px 24px; margin-top:24px; }}
  .legend {{ display:flex; gap:28px; font-size:18px; margin-top:6px; }}
  .legend i {{ display:inline-block; width:34px; height:0; border-top:3px solid var(--ink); vertical-align:middle; margin-inline-start:6px; }}
  .legend i.d {{ border-top-style:dashed; }}
  .row {{ display:grid; grid-template-columns:1.15fr 1fr; gap:24px; }}
  table {{ width:100%; border-collapse:collapse; font-size:20px; text-align:center; }}
  th {{ background:var(--ink); color:#fff; padding:10px 6px; }}
  td {{ padding:10px 6px; border-bottom:1px solid var(--line); }}
  tr:nth-child(even) td {{ background:#faf4e8; }}
  .rules {{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }}
  .rule {{ background:#fff; border-radius:16px; padding:14px; text-align:center; border-top:7px solid; font-size:19px; }}
  .rule b {{ display:block; font-size:25px; margin-top:4px; direction:ltr; }}
  .note {{ font-size:19px; line-height:1.8; margin:10px 0 0; }}
  footer {{ text-align:center; margin-top:22px; font-size:18px; color:#6b5a4e; }}
</style></head>
<body><div class="poster">
<header>
  <div class="tile">{frame_svg}</div>
  <div>
    <h1>المشروع الثاني: الفسيفساء والرياضيات</h1>
    <p>نصمّم لوحة فسيفساء من أشكال هندسية بسيطة، ثم نكبّرها بمعامل تكبير k = 2</p>
  </div>
</header>

<section class="card">
  <h2><span>1</span>تصميم الأشكال وتكبيرها على ورق الرسم البياني</h2>
  {grid_svg}
  <div class="legend"><div>الشكل الأصلي<i></i></div><div>صورة الشكل بعد التكبير (k = 2)<i class="d"></i></div><div>كل مربع في الشبكة = 1 سم</div></div>
</section>

<div class="row">
<section class="card">
  <h2><span>2</span>لوحة الفسيفساء: الأصل وصورته</h2>
  {mosaic_svg}
  <p class="note">قصصنا مثلثات ملوّنة ورتّبناها على شكل نجمة. صورة اللوحة بعد التكبير حجمها 12×12 سم،
  وبقيت الزوايا والألوان والتناسق كما هي.</p>
</section>
<section class="card">
  <h2><span>3</span>النتائج</h2>
  <table>
    <tr><th>الشكل</th><th>المحيط<br>الأصل ← الصورة</th><th>المساحة<br>الأصل ← الصورة</th></tr>
    <tr><td>المربع</td><td>8 ← 16 سم</td><td>4 ← 16 سم مربع</td></tr>
    <tr><td>المثلث</td><td>12 ← 24 سم</td><td>6 ← 24 سم مربع</td></tr>
    <tr><td>المسدس</td><td>6 ← 12 سم</td><td>2.6 ← 10.4 سم مربع</td></tr>
    <tr><td>اللوحة</td><td>24 ← 48 سم</td><td>36 ← 144 سم مربع</td></tr>
  </table>
  <p class="note">✔ التحقق: 16 ÷ 4 = 4 = 2²، و 24 ÷ 6 = 4 = 2²</p>
</section>
</div>

<section class="card">
  <h2><span>4</span>ماذا تعلّمنا؟</h2>
  <div class="rules">
    <div class="rule" style="border-color:#e63946">الأطوال<b>× k</b></div>
    <div class="rule" style="border-color:#2a9d8f">المحيط<b>× k</b></div>
    <div class="rule" style="border-color:#f4a261">المساحة<b>× k²</b></div>
    <div class="rule" style="border-color:#457b9d">الزوايا<b>لا تتغيّر</b></div>
  </div>
  <p class="note">معامل التكبير = طول الضلع في الصورة ÷ طول الضلع المقابل له في الأصل = 4 ÷ 2 = <b>2</b>.
  إذا كان k أكبر من 1 فهو تكبير، وإذا كان بين 0 و 1 فهو تصغير.
  ولهذا يستخدم فنّانو الفسيفساء التكبير لتغطية مساحات كبيرة مع المحافظة على جمال التصميم.</p>
</section>
<footer>أسماء أعضاء المجموعة: ........................................................</footer>
</div></body></html>'''

(OUT / "mosaic_project.html").write_text(html, encoding="utf-8")

async def shot():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1200, "height": 1000}, device_scale_factor=2)
        await pg.goto((OUT / "mosaic_project.html").as_uri())
        await pg.wait_for_timeout(1500)
        await pg.locator(".poster").screenshot(path=str(OUT / "mosaic_project.png"))
        await b.close()

# asyncio.run(shot())
print("done")
