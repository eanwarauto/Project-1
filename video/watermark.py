"""يضيف العلامة المائية eng.7ikaya للنسخة الأفقية.
الاستخدام: python3 video/watermark.py   ->  videos/watermarked/*-علامة.mp4
"""
import glob, os, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), '..')
FONT = '/usr/share/fonts/opentype/inter/Inter-SemiBold.otf'
TXT = 'eng.7ikaya'
W, H, BAR = 1920, 1080, 108


def spaced(d, x, y, f, fill, sp):
    for ch in TXT:
        d.text((x, y), ch, font=f, fill=fill); x += d.textlength(ch, font=f) + sp


def overlay(path):
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    f = ImageFont.truetype(FONT, 40)
    tw = sum(d.textlength(c, font=f) + 3 for c in TXT) - 3
    y0 = H - BAR / 2 - 28
    spaced(d, (W - tw) / 2, y0, f, (255, 255, 255, 225), 3)  # في الشريط السفلي
    d.rectangle([W / 2 - 50, y0 + 54, W / 2 + 50, y0 + 56], fill=(255, 217, 138, 170))
    f2 = ImageFont.truetype(FONT, 26)
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    spaced(ImageDraw.Draw(sh), 34, BAR + 22, f2, (0, 0, 0, 160), 1)
    im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(3)))
    spaced(ImageDraw.Draw(im), 34, BAR + 22, f2, (255, 255, 255, 115), 1)  # زاوية الصورة
    im.save(path)


if __name__ == '__main__':
    out = os.path.join(ROOT, 'videos', 'watermarked'); os.makedirs(out, exist_ok=True)
    png = os.path.join(ROOT, 'build', 'video', 'watermark.png'); os.makedirs(os.path.dirname(png), exist_ok=True)
    overlay(png)
    for v in sorted(glob.glob(os.path.join(ROOT, 'videos', '*.mp4'))):
        dst = os.path.join(out, os.path.basename(v)[:-4] + '-علامة.mp4')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', v, '-i', png, '-filter_complex', '[0:v][1:v]overlay=0:0',
                        '-c:v', 'libx264', '-crf', '25', '-preset', 'slow', '-tune', 'animation', '-pix_fmt', 'yuv420p',
                        '-c:a', 'copy', '-movflags', '+faststart', dst], check=True)
        print('->', dst)
