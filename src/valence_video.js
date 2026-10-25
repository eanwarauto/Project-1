// يصدّر فيديو «إلكترونات التكافؤ» من video/valence.html إلى MP4.
// التشغيل: node src/valence_video.js            (الفيديو كامل)
//          node src/valence_video.js 12 40 95    (صور ثابتة عند هذه الثواني للمراجعة في build/stills)
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const HTML = 'file://' + path.join(ROOT, 'video', 'valence.html') + '?render=1';
const OUT = path.join(ROOT, 'video', 'إلكترونات-التكافؤ.mp4');
const FPS = 30;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(HTML);
  await page.evaluate(() => window.ready);
  const total = await page.evaluate(() => window.TOTAL);
  const canvas = page.locator('canvas');

  const stills = process.argv.slice(2).map(Number);
  if (stills.length) {
    const dir = path.join(ROOT, 'build', 'stills');
    fs.mkdirSync(dir, { recursive: true });
    for (const t of stills) {
      await page.evaluate(t => window.renderFrame(t), t);
      await canvas.screenshot({ path: path.join(dir, `t${String(t).padStart(5, '0')}.png`) });
    }
    await browser.close();
    return;
  }

  const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT], { stdio: ['pipe', 'ignore', 'inherit'] });
  const frames = Math.ceil(total * FPS);
  for (let i = 0; i < frames; i++) {
    await page.evaluate(t => window.renderFrame(t), i / FPS);
    const buf = await canvas.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`${i}/${frames}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('تم:', OUT);
})();
