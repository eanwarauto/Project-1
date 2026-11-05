"""Printable A4 (landscape) page: the colourful fish mosaic only, with a small student label."""
import random, pathlib

OUT = pathlib.Path(__file__).parent
random.seed(21)

# 14 x 10 tiles: fish in the middle, water around it, seabed at the bottom.
SCENE = [
    "..............",
    ".b....OOOO....",
    "b...OOYYSYOO.T",
    ".b.OYEYYSYYYOT",
    "..OYYYYYSYYYTT",
    "..OYYYYYSYYYTT",
    "...OYYYYSYYYOT",
    "....OOYYSYOO.T",
    ".g....OOOO..g.",
    "sgsssgssssgsgs",
]
# shift so the fish is centred (columns 0..13)
SCENE = [row[:14].ljust(14, ".") for row in SCENE]

BODY = ["#ffd60a", "#ffc300", "#ffb703", "#ff9f1c", "#fb8500", "#ff7b00", "#ff6b35", "#ff5400"]
WATER = ["#023e8a", "#0077b6", "#0096c7", "#00b4d8", "#0466c8", "#3a86ff"]
OUTLINE = ["#3a0ca3", "#480ca8", "#4361ee", "#560bad"]
TAIL = ["#9d4edd", "#f72585", "#c77dff", "#f72585"]
STRIPE = ["#ffffff", "#e0fbfc", "#caf0f8", "#fff3b0"]

def jitter(hex_color, amt=18):
    r, g, b = (int(hex_color[i:i + 2], 16) for i in (1, 3, 5))
    d = random.randint(-amt, amt)
    return "#%02x%02x%02x" % tuple(max(0, min(255, v + d)) for v in (r, g, b))

def colour(ch, i, j, a, b):
    if ch == "O":
        return random.choice(OUTLINE)
    if ch == "Y":
        return BODY[min(len(BODY) - 1, max(0, j - 2))]
    if ch == "S":
        return random.choice(STRIPE)
    if ch == "E":
        return "#ffffff" if (a, b) == (0, 0) else "#111111"
    if ch == "T":
        return TAIL[(i + a) % len(TAIL)]
    if ch == "b":
        return "#caf0f8" if (a, b) in ((0, 1), (1, 0), (1, 1), (1, 2), (2, 1)) else random.choice(WATER)
    if ch == "g":
        return random.choice(["#2dc653", "#25a244", "#55a630", "#80b918"])
    if ch == "s":
        return random.choice(["#e9c46a", "#f4d58d", "#dda15e", "#f6bd60"])
    return random.choice(WATER)

T = 60          # tile size (svg units); each tile = 3 x 3 small pieces
SUB = 3
parts = []
for i, row in enumerate(SCENE):
    for j, ch in enumerate(row):
        for a in range(SUB):
            for b in range(SUB):
                s = T / SUB
                x, y = j * T + b * s, i * T + a * s
                parts.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{s:.1f}" height="{s:.1f}" rx="2.5" '
                             f'fill="{jitter(colour(ch, i, j, a, b))}" stroke="#fdf6ec" stroke-width="2.4"/>')
W, H = 14 * T, 10 * T
svg = (f'<svg viewBox="-6 -6 {W+12} {H+12}" xmlns="http://www.w3.org/2000/svg">'
       f'<rect x="-6" y="-6" width="{W+12}" height="{H+12}" rx="10" fill="#fdf6ec"/>' + "".join(parts) + "</svg>")

html = f'''<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<title>سمكة الفسيفساء</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">
<style>
  @page {{ size: A4 landscape; margin: 0; }}
  html, body {{ margin:0; background:#fff; }}
  .page {{ width:297mm; height:210mm; box-sizing:border-box; padding:10mm 12mm 6mm;
          display:flex; flex-direction:column; align-items:center; font-family:Cairo, "DejaVu Sans", sans-serif; }}
  .art {{ flex:1; width:100%; display:flex; justify-content:center; min-height:0; }}
  .art svg {{ height:100%; width:auto; max-width:100%; }}
  .label {{ align-self:flex-start; margin-top:3mm; font-size:10.5pt; color:#333; }}
</style></head>
<body><div class="page">
  <div class="art">{svg}</div>
  <div class="label">الطالبة: نور فيصل &nbsp;|&nbsp; الصف: التاسع/4</div>
</div></body></html>'''
(OUT / "fish_mosaic_A4.html").write_text(html, encoding="utf-8")
print("ok")
