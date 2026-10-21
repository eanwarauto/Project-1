# يولّد ملفي PDF من الصور:
#   1) الملف الكامل: كل تصميم في صفحة (للعرض والمشاركة)
#   2) ملف الطباعة A4: البوستر والغلاف ومفتاح الإجابات كل منها في ورقة، و4 بطاقات في كل ورقة مع خطوط قصّ
# التشغيل: python3 src/make_pdf.py [designs-pastel]
import sys
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent.parent / (sys.argv[1] if len(sys.argv) > 1 else 'designs')
suffix = '-باستيل' if 'pastel' in root.name else ''
singles = sorted(root.glob('0[12]-*.png'))
answers = sorted(root.glob('03-*.png'))
elements = sorted((root / 'elements').glob('*.png'))
questions = sorted((root / 'questions').glob('*.png'))

# 1) الملف الكامل
pages = [Image.open(f).convert('RGB') for f in singles + elements + questions + answers]
full = root / f'الأسبوع-العربي-للكيمياء-الملف-الكامل{suffix}.pdf'
pages[0].save(full, save_all=True, append_images=pages[1:], resolution=144, quality=90)
print(f'✓ {full.name} — {len(pages)} صفحة')

# 2) ملف الطباعة A4 بدقة 300 نقطة/بوصة
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

print_pages = [single_page(p) for p in singles] + grid_pages(elements) + grid_pages(questions) + [single_page(p) for p in answers]
pr = root / f'الأسبوع-العربي-للكيمياء-للطباعة-A4{suffix}.pdf'
print_pages[0].save(pr, save_all=True, append_images=print_pages[1:], resolution=DPI, quality=88)
print(f'✓ {pr.name} — {len(print_pages)} ورقة A4')

# 3) نسخة خفيفة للمراجعة على الجوال (نفس أوراق الطباعة بدقة أقل واسم إنجليزي بسيط)
small = [p.resize((p.width // 2, p.height // 2), Image.LANCZOS) for p in print_pages]
rv = root / ('Chemistry-Week-Pastel-Review.pdf' if suffix else 'Chemistry-Week-Review.pdf')
small[0].save(rv, save_all=True, append_images=small[1:], resolution=DPI // 2, quality=80)
print(f'✓ {rv.name} — {rv.stat().st_size // 1024} KB')
