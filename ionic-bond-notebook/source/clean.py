import json, sys, cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
spec = json.load(open('erase.json'))
only = sys.argv[1:]
F = ImageFont.truetype('Poppins-Bold.ttf', 34)
S = 2
def detect(img, mask, x0, y0, x1, y1, thr):
    H, W = mask.shape
    P = 40
    X0, Y0, X1, Y1 = max(0, x0 - P), max(0, y0 - P), min(W, x1 + P), min(H, y1 + P)
    roi = img[Y0:Y1, X0:X1]
    k = int(min(201, max(41, 1.3 * (y1 - y0)))) | 1
    lab = cv2.cvtColor(roi, cv2.COLOR_BGR2LAB).astype(np.float32)
    bg = cv2.cvtColor(cv2.medianBlur(roi, k), cv2.COLOR_BGR2LAB).astype(np.float32)
    d = np.sqrt(((lab - bg) ** 2).sum(2))
    m = (d > (thr or 24)).astype(np.uint8) * 255
    m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    sub = np.zeros_like(m); sub[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0] = m[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0]
    mask[Y0:Y1, X0:X1] |= sub
for name, regions in spec.items():
    if only and name not in only: continue
    img = cv2.imread(f'{name}.png')
    img = cv2.resize(img, None, fx=S, fy=S, interpolation=cv2.INTER_LANCZOS4)
    H, W = img.shape[:2]
    mask = np.zeros((H, W), np.uint8)
    vfill = []
    regions = regions + [{'r': [1255, 736, 1376, 768], 'm': 'f', 'thr': 0}]
    for g in regions:
        x0, y0, x1, y1 = [v * S for v in g['r']]
        x0, y0 = max(0, x0 - 4), max(0, y0 - 4); x1, y1 = min(W, x1 + 4), min(H, y1 + 4)
        if g['m'] in ('f', 'v'):
            # also catch letter parts sticking out of a title box
            E = 12 * S
            detect(img, mask, max(0, x0 - E), max(0, y0 - E), min(W, x1 + E), min(H, y1 + E), g['thr'])
        if g['m'] == 'v':
            sm = lambda v, sg: cv2.GaussianBlur(v[None], (0, 0), sg)[0]
            top = sm(img[max(0, y0 - 10):y0 - 2, x0:x1].astype(np.float32).mean(0), 40)
            bot = sm(img[y1 + 2:min(H, y1 + 10), x0:x1].astype(np.float32).mean(0), 40)
            lef = sm(img[y0:y1, max(0, x0 - 10):x0 - 2].astype(np.float32).mean(1), 25)
            rig = sm(img[y0:y1, x1 + 2:min(W, x1 + 10)].astype(np.float32).mean(1), 25)
            hh, ww = y1 - y0, x1 - x0
            v = np.linspace(0, 1, hh)[:, None, None]; u = np.linspace(0, 1, ww)[None, :, None]
            c00, c01, c10, c11 = top[0], top[-1], bot[0], bot[-1]
            fill = (1 - v) * top[None] + v * bot[None] + (1 - u) * lef[:, None] + u * rig[:, None] \
                - ((1 - u) * (1 - v) * c00 + u * (1 - v) * c01 + (1 - u) * v * c10 + u * v * c11)
            fill = cv2.GaussianBlur(fill, (0, 0), 6)
            fill += np.random.normal(0, 1.5, fill.shape)
            img[y0:y1, x0:x1] = np.clip(fill, 0, 255).astype(np.uint8)
            vfill.append((x0, y0, x1, y1))
            continue
        if g['m'] == 'f':
            mask[y0:y1, x0:x1] = 255; continue
        detect(img, mask, x0, y0, x1, y1, g['thr'])
    for (a, b, c, d) in vfill: mask[b:d, a:c] = 0
    out = cv2.inpaint(img, mask, 9, cv2.INPAINT_TELEA)
    # soften the filled areas a little so inpaint streaks don't show
    blur = cv2.GaussianBlur(out, (0, 0), 3)
    mk = cv2.GaussianBlur(cv2.dilate(mask, np.ones((5, 5), np.uint8)).astype(np.float32) / 255, (0, 0), 3)[..., None]
    out = (out * (1 - mk * 0.6) + blur * (mk * 0.6)).astype(np.uint8)
    # crop to 16:9 of the 17.778 x 10 slide
    tw = round(H * 17.7778 / 10); cx = (W - tw) // 2
    out = out[:, cx:cx + tw]
    pil = Image.fromarray(cv2.cvtColor(out, cv2.COLOR_BGR2RGB))
    # signature baked into the picture: bottom-left, black, with a faint light halo for dark scenes
    txt = 'Eng.7IKAYA'; x, y = 70, H - 34 - 40
    halo = Image.new('L', pil.size, 0); ImageDraw.Draw(halo).text((x, y), txt, font=F, fill=255)
    halo = halo.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(3))
    pil.paste(Image.new('RGB', pil.size, (255, 255, 255)), (0, 0), halo.point(lambda v: int(v * 0.55)))
    ImageDraw.Draw(pil).text((x, y), txt, font=F, fill=(0, 0, 0))
    pil.save(f'clean_{name}.jpg', quality=92)
    cv2.imwrite(f'mask_{name}.png', mask)
    print(name, end=' ', flush=True)
