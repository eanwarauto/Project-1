# يحوّل نص الإذاعة المدرسية (Markdown) إلى ملف PDF بمقاس A4 للطباعة
# التشغيل: python3 src/radio_pdf.py   (يتطلب: pip install markdown، وPlaywright)
import subprocess, json
from pathlib import Path
import markdown

root = Path(__file__).resolve().parent.parent
md = root / 'radio' / 'الإذاعة-المدرسية-الصحبة-الصالحة.md'
out = md.with_suffix('.pdf')
fonts = (root / 'assets' / 'fonts').as_uri()
body = markdown.markdown(md.read_text(encoding='utf-8'), extensions=['tables'])
html = f"""<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face{{font-family:Cairo;font-weight:400;src:url({fonts}/cairo-arabic-400-normal.woff2)}}
@font-face{{font-family:Cairo;font-weight:700;src:url({fonts}/cairo-arabic-700-normal.woff2)}}
@font-face{{font-family:Cairo;font-weight:900;src:url({fonts}/cairo-arabic-900-normal.woff2)}}
@font-face{{font-family:Reem;src:url({fonts}/reem-kufi-arabic-700-normal.woff2)}}
@page{{size:A4;margin:16mm 16mm 18mm}}
body{{font-family:Cairo;font-size:12.5pt;line-height:1.85;color:#24323f}}
h1{{font-family:Reem;font-size:24pt;text-align:center;color:#1f6f5c;margin:0 0 6px;padding:14px;
   background:#e8f4ef;border-radius:14px;border:2px solid #9fd1bf}}
h2{{font-size:15pt;color:#fff;background:#2f8f76;border-radius:10px;padding:2px 14px;margin:20px 0 8px;break-after:avoid}}
h3{{color:#1f6f5c;margin:14px 0 4px}}
table{{width:100%;border-collapse:collapse;margin:10px 0}}
td,th{{border:1px solid #b9dccf;padding:4px 10px}} th{{background:#e8f4ef}}
blockquote{{margin:6px 0;padding:6px 16px;background:#fbf6ea;border-right:4px solid #d9b45b;border-radius:8px;font-weight:700}}
blockquote p{{margin:0}}
hr{{border:0;border-top:2px dashed #b9dccf;margin:18px 0}}
strong{{color:#1f6f5c}}
</style></head><body>{body}</body></html>"""
tmp = root / 'build' / 'radio.html'
tmp.parent.mkdir(exist_ok=True)
tmp.write_text(html, encoding='utf-8')
js = f"""const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();const p=await b.newPage();
await p.goto({json.dumps(tmp.as_uri())});await p.evaluate(()=>document.fonts.ready);
await p.pdf({{path:{json.dumps(str(out))},format:'A4',printBackground:true,preferCSSPageSize:true}});await b.close();}})();"""
subprocess.run(['node', '-e', js], check=True)
print(f'✓ {out.name}')
