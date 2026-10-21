# يجمع كل الصور في ملف PDF واحد مضغوط (صفحات JPEG عالية الجودة).
# التشغيل: python3 src/make_pdf.py
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent / 'designs'
files = sorted(root.glob('0*.png')) + sorted((root / 'elements').glob('*.png')) + sorted((root / 'questions').glob('*.png'))
pages = [Image.open(f).convert('RGB') for f in files]
out = root / 'الأسبوع-العربي-للكيمياء-الملف-الكامل.pdf'
pages[0].save(out, save_all=True, append_images=pages[1:], resolution=144, quality=90)
print(f'✓ {out.name} — {len(pages)} صفحة')
