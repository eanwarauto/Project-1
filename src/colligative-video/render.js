// يصدّر فيديو «الخواص المجمعة» إلى MP4 مع الموسيقى والمؤثرات الصوتية.
// التشغيل: node src/colligative-video/render.js            (الفيديو الكامل)
//          node src/colligative-video/render.js --stills 5,30,60 [مجلد]   (صور للمراجعة)
// يتطلب Playwright وffmpeg وPython مع numpy.
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'colligative-video');
const BUILD = path.join(ROOT, 'build', 'colligative-video');
const VIDEO = path.join(OUT_DIR, 'الخواص-المجمعة.mp4');

(async () => {
  fs.mkdirSync(BUILD, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('file://' + path.join(__dirname, 'scene.html') + '?export');
  await page.evaluate(() => window.ready);
  const frame = t => page.evaluate(t => { window.renderFrame(t); return document.getElementById('c').toDataURL('image/png'); }, t)
    .then(u => Buffer.from(u.split(',')[1], 'base64'));

  const si = process.argv.indexOf('--stills');
  if (si > 0) {
    const dir = process.argv[si + 2] || path.join(BUILD, 'stills');
    fs.mkdirSync(dir, { recursive: true });
    for (const t of process.argv[si + 1].split(',').map(Number)) {
      fs.writeFileSync(path.join(dir, `t${String(t).padStart(5, '0')}.png`), await frame(t));
    }
    await browser.close();
    return;
  }

  const { DURATION, FPS, SFX } = await page.evaluate(() => ({ DURATION: window.DURATION, FPS: window.FPS, SFX: window.SFX }));
  const sfxPath = path.join(BUILD, 'sfx.json'), wav = path.join(BUILD, 'audio.wav'), silent = path.join(BUILD, 'video.mp4');
  fs.writeFileSync(sfxPath, JSON.stringify({ duration: DURATION, events: SFX }));
  execFileSync('python3', [path.join(__dirname, 'audio.py'), sfxPath, wav], { stdio: 'inherit' });

  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = Math.round(DURATION * FPS);
  for (let i = 0; i < total; i++) {
    const buf = await frame(i / FPS);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`frame ${i}/${total}`);
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', c => c ? rej(new Error('ffmpeg ' + c)) : res()));
  await browser.close();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', wav, '-c:v', 'copy', '-af', 'loudnorm=I=-16:TP=-1.5', '-ar', '44100', '-c:a', 'aac', '-b:a', '160k',
    '-shortest', '-movflags', '+faststart', VIDEO], { stdio: 'inherit' });
  console.log('done:', VIDEO);
})();
