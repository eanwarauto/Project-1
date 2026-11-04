"""Builds the second mosaic & dilation project poster (fish mosaic, k = 3 and k = 1/2)."""
import math, random, pathlib

OUT = pathlib.Path(__file__).parent
random.seed(11)

def jitter(hex_color, amt=16):
    r, g, b = (int(hex_color[i:i + 2], 16) for i in (1, 3, 5))
    d = random.randint(-amt, amt)
    return "#%02x%02x%02x" % tuple(max(0, min(255, v + d)) for v in (r, g, b))

FISH = [
    "....OOOO....",
    "..OOYYSYOO.T",
    ".OYEYYSYYYOT",
    "OYYYYYSYYYTT",
    "OYYYYYSYYYTT",
    ".OYYYYSYYYOT",
    "..OOYYSYOO.T",
    "....OOOO....",
]
COL = {"O": "#1d3557", "Y": "#f4a261", "S": "#fdf6ec", "E": "#111111", "T": "#e76f51"}
WATER = ["#0b6e8a", "#0e7c99", "#118ab2", "#0a5f78"]
TILES = sum(ch != "." for row in FISH for ch in row)

def fish_svg(cell, ox, oy, sub=1):
    """Draw the fish; each tile is split into sub x sub smaller tiles (grout lines)."""
    out = []
    g = max(1.5, cell / sub * 0.12)
    for i, row in enumerate(FISH):
        for j, ch in enumerate(row):
            for a in range(sub):
                for b in range(sub):
                    s = cell / sub
                    x, y = ox + j * cell + b * s, oy + i * cell + a * s
                    col = COL.get(ch) or random.choice(WATER)
                    out.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{s:.1f}" height="{s:.1f}" rx="{s*0.12:.1f}" '
                               f'fill="{jitter(col)}" stroke="#e8dcc4" stroke-width="{g:.1f}"/>')
    return "\n".join(out)

# ---------- Grid panel ----------
U = 30
GW, GH = 34, 9
base = 8 * U
grid = [f'<rect width="{GW*U}" height="{GH*U}" fill="#fffdf8"/>']
grid += [f'<line x1="{i*U}" y1="0" x2="{i*U}" y2="{GH*U}" stroke="#cfe6e3"/>' for i in range(GW + 1)]
grid += [f'<line x1="0" y1="{j*U}" x2="{GW*U}" y2="{j*U}" stroke="#cfe6e3"/>' for j in range(GH + 1)]

def lbl(x, y, t, size=16, color="#073b4c"):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" font-weight="700" text-anchor="middle">{t}</text>'

def arrow(x, y, t, color):
    return f'<text x="{x}" y="{y}" font-size="20" fill="{color}" font-weight="800" text-anchor="middle" direction="ltr">{t}</text>'

S = []
# rectangle 2x1 -> 6x3 (k = 3)
S.append(f'<rect x="{1*U}" y="{base-1*U}" width="{2*U}" height="{1*U}" fill="#118ab2" stroke="#073b4c" stroke-width="2.5"/>')
S.append(lbl(2*U, base - U - 8, "2")); S.append(lbl(1*U - 10, base - 0.35*U, "1"))
S.append(f'<rect x="{4*U}" y="{base-3*U}" width="{6*U}" height="{3*U}" fill="#118ab2" fill-opacity=".5" stroke="#073b4c" stroke-width="2.5" stroke-dasharray="8 5"/>')
S.append(lbl(7*U, base - 3*U - 8, "6")); S.append(lbl(4*U - 10, base - 1.4*U, "3"))
S.append(arrow(5*U, 2*U, "k = 3 ⟶", "#e76f51"))
# isosceles triangle base 2 height 2 -> base 6 height 6 (k = 3)
S.append(f'<polygon points="{12*U},{base} {14*U},{base} {13*U},{base-2*U}" fill="#06d6a0" stroke="#073b4c" stroke-width="2.5"/>')
S.append(lbl(13*U, base + 20, "2"))
S.append(f'<polygon points="{15*U},{base} {21*U},{base} {18*U},{base-6*U}" fill="#06d6a0" fill-opacity=".5" stroke="#073b4c" stroke-width="2.5" stroke-dasharray="8 5"/>')
S.append(lbl(18*U, base + 20, "6"))
S.append(f'<line x1="{18*U}" y1="{base}" x2="{18*U}" y2="{base-6*U}" stroke="#073b4c" stroke-width="1.5" stroke-dasharray="3 4"/>')
S.append(lbl(18*U + 14, base - 3*U, "6"))
S.append(arrow(16*U, 1.2*U, "k = 3 ⟶", "#e76f51"))
# reduction: square 4 -> 2 (k = 1/2)
S.append(f'<rect x="{23*U}" y="{base-4*U}" width="{4*U}" height="{4*U}" fill="#ffd166" stroke="#073b4c" stroke-width="2.5"/>')
S.append(lbl(25*U, base - 4*U - 8, "4"))
S.append(f'<rect x="{29*U}" y="{base-2*U}" width="{2*U}" height="{2*U}" fill="#ffd166" fill-opacity=".55" stroke="#073b4c" stroke-width="2.5" stroke-dasharray="8 5"/>')
S.append(lbl(30*U, base - 2*U - 8, "2"))
S.append(arrow(28*U, 2*U, "k = ½ ⟶", "#7b2cbf"))

grid_svg = (f'<svg viewBox="-20 -10 {GW*U+40} {GH*U+40}" width="100%" xmlns="http://www.w3.org/2000/svg" '
            f'font-family="Cairo, DejaVu Sans, sans-serif">' + "\n".join(grid + S) + "</svg>")

# ---------- Fish mosaic panel ----------
c1 = 14                      # original tile
fw, fh = 12 * c1, 8 * c1
bx = 30 + fw + 120
W, H = bx + 12 * c1 * 3 + 30, 8 * c1 * 3 + 70
fish = f'''<svg viewBox="0 0 {W} {H}" width="100%" xmlns="http://www.w3.org/2000/svg" font-family="Cairo, DejaVu Sans, sans-serif">
  <rect width="100%" height="100%" rx="18" fill="#073b4c"/>
  {fish_svg(c1, 30, (H - fh) / 2 - 10)}
  {fish_svg(c1 * 3, bx, 25, sub=3)}
  <text x="{30 + fw + 60}" y="{H/2 - 22}" font-size="30" font-weight="800" fill="#ffd166" text-anchor="middle" direction="ltr">×3</text>
  <path d="M{30 + fw + 18},{H/2 - 6} H{bx - 20}" stroke="#ffd166" stroke-width="4" marker-end="url(#ar2)"/>
  <defs><marker id="ar2" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#ffd166"/></marker></defs>
  <text x="{30 + fw/2}" y="{(H + fh)/2 + 18}" font-size="17" fill="#fdf6ec" text-anchor="middle">الأصل: {TILES} بلاطة</text>
</svg>'''

# header tile
hdr = f'<svg viewBox="0 0 {12*12+12} {8*12+12}" width="100%" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" rx="12" fill="#073b4c"/>{fish_svg(12, 6, 6)}</svg>'

html = f'''<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>سمكة الفسيفساء</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap" rel="stylesheet">
<style>
  :root {{ --ink:#073b4c; --accent:#e76f51; --paper:#eef7f6; --card:#ffffff; --line:#cfe6e3; }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; background:var(--paper); color:var(--ink); font-family:Cairo, "DejaVu Sans", sans-serif; }}
  .poster {{ width:1200px; margin:0 auto; padding:36px 44px 40px; }}
  header {{ display:flex; align-items:center; gap:28px; background:linear-gradient(135deg,#073b4c,#118ab2); color:#fff; border-radius:24px; padding:22px 30px; }}
  header .tile {{ width:170px; flex:none; }}
  header h1 {{ margin:0; font-size:38px; line-height:1.3; }}
  header p {{ margin:6px 0 0; font-size:21px; opacity:.95; }}
  h2 {{ font-size:27px; margin:0 0 12px; display:flex; align-items:center; gap:10px; }}
  h2 span {{ background:var(--accent); color:#fff; border-radius:12px; width:40px; height:40px; display:inline-grid; place-items:center; font-size:22px; }}
  .card {{ background:var(--card); border:2px solid var(--line); border-radius:20px; padding:20px 24px; margin-top:24px; }}
  .legend {{ display:flex; gap:28px; font-size:18px; margin-top:6px; }}
  .legend i {{ display:inline-block; width:34px; border-top:3px solid var(--ink); vertical-align:middle; margin-inline-start:6px; }}
  .legend i.d {{ border-top-style:dashed; }}
  table {{ width:100%; border-collapse:collapse; font-size:20px; text-align:center; }}
  th {{ background:var(--ink); color:#fff; padding:10px 6px; }}
  td {{ padding:10px 6px; border-bottom:1px solid var(--line); }}
  tr:nth-child(even) td {{ background:#f3faf9; }}
  .k {{ font-weight:800; direction:ltr; display:inline-block; }}
  .rules {{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }}
  .rule {{ border-radius:16px; padding:14px 18px; font-size:19px; line-height:1.9; }}
  .rule h3 {{ margin:0 0 4px; font-size:22px; }}
  .note {{ font-size:19px; line-height:1.8; margin:10px 0 0; }}
  footer {{ text-align:center; margin-top:22px; font-size:18px; color:#4a6670; }}
</style></head>
<body><div class="poster">
<header>
  <div class="tile">{hdr}</div>
  <div>
    <h1>الفسيفساء والرياضيات: سمكة الفسيفساء</h1>
    <p>نكبّر الأشكال بمعامل k = 3، ونصغّرها بمعامل k = ½، ثم نصمّم لوحة سمكة من بلاطات مربعة</p>
  </div>
</header>

<section class="card">
  <h2><span>1</span>التكبير والتصغير على ورق الرسم البياني</h2>
  {grid_svg}
  <div class="legend"><div>الشكل الأصلي<i></i></div><div>صورة الشكل<i class="d"></i></div><div>كل مربع في الشبكة = 1 سم</div></div>
</section>

<section class="card">
  <h2><span>2</span>لوحة السمكة: الأصل وصورتها بعد التكبير</h2>
  {fish}
  <p class="note">طول ضلع البلاطة الأصلية 0.5 سم، وطوله في الصورة 1.5 سم. لذلك تتحوّل كل بلاطة إلى <span class="k">3 × 3 = 9</span> بلاطات،
  فيصير عدد بلاطات السمكة <span class="k">{TILES} × 9 = {TILES*9}</span> بلاطة. هذا يوضّح لماذا تُضرب المساحة في k².</p>
</section>

<section class="card">
  <h2><span>3</span>النتائج</h2>
  <table>
    <tr><th>الشكل</th><th>المعامل</th><th>الأبعاد<br>الأصل ← الصورة</th><th>المحيط<br>الأصل ← الصورة</th><th>المساحة<br>الأصل ← الصورة</th></tr>
    <tr><td>المستطيل</td><td><span class="k">k = 3</span></td><td>2×1 ← 6×3</td><td>6 ← 18 سم</td><td>2 ← 18 سم مربع</td></tr>
    <tr><td>المثلث</td><td><span class="k">k = 3</span></td><td>القاعدة والارتفاع: 2 ← 6</td><td>—</td><td>2 ← 18 سم مربع</td></tr>
    <tr><td>المربع</td><td><span class="k">k = ½</span></td><td>4 ← 2</td><td>16 ← 8 سم</td><td>16 ← 4 سم مربع</td></tr>
    <tr><td>السمكة</td><td><span class="k">k = 3</span></td><td>6×4 ← 18×12 سم</td><td>—</td><td>{TILES} ← {TILES*9} بلاطة</td></tr>
  </table>
</section>

<section class="card">
  <h2><span>4</span>ماذا تعلّمنا؟</h2>
  <div class="rules">
    <div class="rule" style="background:#fde8e1"><h3>التكبير (k أكبر من 1)</h3>
      الأطوال × 3، والمحيط × 3، والمساحة × 9 لأن <span class="k">3 × 3 = 9</span></div>
    <div class="rule" style="background:#efe4fb"><h3>التصغير (k بين 0 و 1)</h3>
      الأطوال × ½، والمحيط × ½، والمساحة × ¼ لأن <span class="k">½ × ½ = ¼</span></div>
  </div>
  <p class="note">في الحالتين <b>تبقى الزوايا كما هي</b> ويبقى الشكل متشابهًا.
  معامل التكبير = طول الضلع في الصورة ÷ طول الضلع المقابل في الأصل، مثل: <span class="k">6 ÷ 2 = 3</span> و <span class="k">2 ÷ 4 = ½</span></p>
</section>
<footer>أسماء أعضاء المجموعة: ........................................................</footer>
</div></body></html>'''

(OUT / "mosaic_project_2.html").write_text(html, encoding="utf-8")
print("tiles:", TILES)
