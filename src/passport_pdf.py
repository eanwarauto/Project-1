# ملفات PDF لنشاط «جواز السفر الكيميائي»
#   1) ملف الطباعة A4: البوستر، ثم صفحات الجواز (4 صفحات في كل ورقة مع خطوط قص)، ثم لوحات المحطات الخمس، ثم الإجابات
#   2) الملف الكامل: كل تصميم في صفحة
#   3) نسخة خفيفة للمراجعة على الجوال
# التشغيل: python3 src/passport_pdf.py [passport-pastel]
import sys
from pathlib import Path
from PIL import Image
sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_pdf_lib as lib

root = Path(__file__).resolve().parent.parent / (sys.argv[1] if len(sys.argv) > 1 else 'passport')
pastel = 'pastel' in root.name
suffix = '-باستيل' if pastel else ''
poster = root / '01-البوستر.png'
book = sorted((root / 'passport-pages').glob('*.png'))
stations = sorted((root / 'stations').glob('*.png'))
answers = root / '99-إجابات-المحطات.png'

full = [Image.open(f).convert('RGB') for f in [poster, *book, *stations, answers]]
out = root / f'جواز-السفر-الكيميائي-الملف-الكامل{suffix}.pdf'
full[0].save(out, save_all=True, append_images=full[1:], resolution=144, quality=90)
print(f'✓ {out.name} — {len(full)} صفحة')

pages = [lib.single_page(poster)] + lib.grid_pages(book) + [lib.single_page(p) for p in stations] + [lib.single_page(answers)]
pr = root / f'جواز-السفر-الكيميائي-للطباعة-A4{suffix}.pdf'
pages[0].save(pr, save_all=True, append_images=pages[1:], resolution=lib.DPI, quality=88)
print(f'✓ {pr.name} — {len(pages)} ورقة A4')

small = [p.resize((p.width // 2, p.height // 2), Image.LANCZOS) for p in pages]
rv = root / ('Chemical-Passport-Pastel-Review.pdf' if pastel else 'Chemical-Passport-Review.pdf')
small[0].save(rv, save_all=True, append_images=small[1:], resolution=lib.DPI // 2, quality=80)
print(f'✓ {rv.name} — {rv.stat().st_size // 1024} KB')
