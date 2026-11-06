// يرسم فيلماً إطاراً إطاراً عبر Playwright ويمرّره إلى ffmpeg.
// node video/render.js <film> [--stills 1,5.5,20] [--fps 24] [--from 0 --to 60]
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const film = args[0];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const FPS = +opt('fps', 24);
const VERT = args.includes('--vertical');
const SPEED = +opt('speed', 1); // تسريع: يُرسم كل إطار في زمن أبعد بدل حذف إطارات
const CANVAS = VERT ? 'v' : 'c', RENDER = VERT ? 'renderFrameV' : 'renderFrame';
const OUT = path.join(__dirname, '..', 'build', 'video');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await page.goto('file://' + path.join(__dirname, 'page.html') + '?film=' + film);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 30000 });
  const grab = async (t, type, q) => {
    const b64 = await page.evaluate(([t, type, q, fn, cv]) => { window[fn](t); return document.getElementById(cv).toDataURL(type, q).split(',')[1]; }, [t, type, q, RENDER, CANVAS]);
    return Buffer.from(b64, 'base64');
  };
  const stills = opt('stills', null);
  if (stills) {
    const dir = path.join(OUT, 'stills', film); fs.mkdirSync(dir, { recursive: true });
    for (const s of stills.split(',')) {
      fs.writeFileSync(path.join(dir, `${film}${VERT ? 'V' : ''}_${(+s).toFixed(1)}.jpg`), await grab(+s, 'image/jpeg', 0.85));
    }
    console.log('stills ->', dir);
    await browser.close(); return;
  }
  const dur = await page.evaluate(() => FILM.duration);
  const from = +opt('from', 0), to = Math.min(+opt('to', dur), dur);
  const out = path.join(OUT, `${film}${VERT ? '.vertical' : ''}.silent.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '25', '-preset', 'slow', '-tune', 'animation', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round((to - from) / SPEED * FPS);
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const buf = await grab(from + i * SPEED / FPS, 'image/jpeg', 0.93);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 120 === 0) console.log(`${film}: ${i}/${n} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('done ->', out);
})();
