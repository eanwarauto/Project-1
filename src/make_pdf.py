# يولّد ملفي PDF من الصور:
#   1) الملف الكامل: كل تصميم في صفحة (للعرض والمشاركة)
#   2) ملف الطباعة A4: البوستر والغلاف ومفتاح الإجابات كل منها في ورقة، و4 بطاقات في كل ورقة مع خطوط قصّ
# التشغيل: python3 src/make_pdf.py [designs-pastel]
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
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
from make_pdf_lib import DPI, single_page, grid_pages

print_pages = [single_page(p) for p in singles] + grid_pages(elements) + grid_pages(questions) + [single_page(p) for p in answers]
pr = root / f'الأسبوع-العربي-للكيمياء-للطباعة-A4{suffix}.pdf'
print_pages[0].save(pr, save_all=True, append_images=print_pages[1:], resolution=DPI, quality=88)
print(f'✓ {pr.name} — {len(print_pages)} ورقة A4')

# 3) نسخة خفيفة للمراجعة على الجوال (نفس أوراق الطباعة بدقة أقل واسم إنجليزي بسيط)
small = [p.resize((p.width // 2, p.height // 2), Image.LANCZOS) for p in print_pages]
rv = root / ('Chemistry-Week-Pastel-Review.pdf' if suffix else 'Chemistry-Week-Review.pdf')
small[0].save(rv, save_all=True, append_images=small[1:], resolution=DPI // 2, quality=80)
print(f'✓ {rv.name} — {rv.stat().st_size // 1024} KB')
