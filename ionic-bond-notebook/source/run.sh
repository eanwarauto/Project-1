set -e
export NODE_PATH=/tmp/claude-0/-home-user-Project-1/15b6a5e4-9a82-534e-a5a4-c32a24e0808e/scratchpad/three/node_modules:/opt/node22/lib/node_modules
timeout 900 python3 clean.py E01 E02 E03 E04 E05 E06 E07 E08 E09 E10 E11 E12 E13 E14 >/dev/null
node nb_deck.js cartoon $PWD/cartoon_raw.pptx >/dev/null
python3 ../animate.py cartoon_raw.pptx cartoon_raw.anim.json cartoon.pptx >/dev/null
python3 /root/.claude/skills/synced/3b8d0f2e-a4fa-406e-9fc0-941cfeb69238_6b5c6192-d4c5-41a9-849a-37815e0a39bb/pptx/scripts/office/validate.py cartoon.pptx | tail -1
mkdir -p r && timeout 300 python3 /root/.claude/skills/synced/3b8d0f2e-a4fa-406e-9fc0-941cfeb69238_6b5c6192-d4c5-41a9-849a-37815e0a39bb/pptx/scripts/office/soffice.py --headless --convert-to pdf --outdir r cartoon.pptx >/dev/null 2>&1
rm -f r/cartoon-*.jpg; pdftoppm -jpeg -r 50 r/cartoon.pdf r/cartoon 2>/dev/null
cd r && python3 -c "
from PIL import Image;import glob
fs=sorted(glob.glob('cartoon-*.jpg'))
for k in range(0,len(fs),4):
  ims=[Image.open(f) for f in fs[k:k+4]]
  w,h=ims[0].size;o=Image.new('RGB',(w*2,h*2))
  for j,i in enumerate(ims): o.paste(i,((j%2)*w,(j//2)*h))
  o.save(f'g_{k//4}.jpg',quality=85)
print(len(fs))"
