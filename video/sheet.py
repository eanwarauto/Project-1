import sys, glob
from PIL import Image
d=sys.argv[1]; name=d.rstrip('/').split('/')[-1]
fs=sorted(glob.glob(f'{d}/{name}_*.jpg'),key=lambda f:float(f.split('_')[-1][:-4]))
if len(sys.argv)>2: fs=[f for f in fs if f.split('_')[-1][:-4] in sys.argv[2].split(',')]
ims=[Image.open(f).resize((640,360)) for f in fs]
cols=3; rows=(len(ims)+cols-1)//cols
sheet=Image.new('RGB',(640*cols,360*rows))
for i,im in enumerate(ims): sheet.paste(im,((i%cols)*640,(i//cols)*360))
sheet.save(f'{d}/sheet.jpg',quality=85); print([f.split('_')[-1][:-4] for f in fs])
