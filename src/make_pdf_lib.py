# دوال مشتركة لتخطيط صفحات A4 (صفحة كاملة، أو 4 بطاقات مع خطوط قص)
from PIL import Image, ImageDraw

DPI = 300
mm = lambda v: round(v / 25.4 * DPI)
A4 = (mm(210), mm(297))
MARGIN, GAP = mm(6), mm(4)

def blank():
    return Image.new('RGB', A4, 'white')

def single_page(path):
    pg = blank()
    im = Image.open(path).convert('RGB')
    w = A4[0] - 2 * MARGIN
    h = round(im.height * w / im.width)
    if h > A4[1] - 2 * MARGIN:
        h = A4[1] - 2 * MARGIN
        w = round(im.width * h / im.height)
    pg.paste(im.resize((w, h), Image.LANCZOS), ((A4[0] - w) // 2, (A4[1] - h) // 2))
    return pg

def dashed(d, a, b, dash=mm(2.5), color=(150, 150, 150)):
    (x1, y1), (x2, y2) = a, b
    length = max(abs(x2 - x1), abs(y2 - y1))
    for s in range(0, length, dash * 2):
        e = min(s + dash, length)
        if x1 == x2:
            d.line([(x1, y1 + s), (x1, y1 + e)], fill=color, width=3)
        else:
            d.line([(x1 + s, y1), (x1 + e, y1)], fill=color, width=3)

def grid_pages(paths):
    # بطاقتان في كل صف، وصفّان في كل ورقة (ترتيب من اليمين لليسار)
    cw = (A4[0] - 2 * MARGIN - GAP) // 2
    first = Image.open(paths[0])
    ch = round(first.height * cw / first.width)
    total_h = 2 * ch + GAP
    top = (A4[1] - total_h) // 2
    out = []
    for i in range(0, len(paths), 4):
        pg = blank()
        d = ImageDraw.Draw(pg)
        for j, p in enumerate(paths[i:i + 4]):
            r, c = divmod(j, 2)
            x = A4[0] - MARGIN - (c + 1) * cw - c * GAP
            y = top + r * (ch + GAP)
            pg.paste(Image.open(p).convert('RGB').resize((cw, ch), Image.LANCZOS), (x, y))
        # خطوط القص
        mid_x = MARGIN + cw + GAP // 2
        mid_y = top + ch + GAP // 2
        dashed(d, (mid_x, mm(2)), (mid_x, A4[1] - mm(2)))
        dashed(d, (mm(2), mid_y), (A4[0] - mm(2), mid_y))
        out.append(pg)
    return out

