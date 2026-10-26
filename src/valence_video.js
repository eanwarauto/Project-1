// يصدّر فيديو «إلكترونات التكافؤ» من video/valence.html إلى MP4 مع تعليق صوتي بالفصحى.
// التشغيل: node src/valence_video.js            (الصوت ثم الفيديو كاملاً)
//          node src/valence_video.js 12 40 95    (صور ثابتة عند هذه الثواني للمراجعة في build/stills)
// يتطلب: Playwright وffmpeg وpip install piper-tts (يُنزَّل نموذج الصوت تلقائياً أول مرة إلى build/voice)
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const HTML = 'file://' + path.join(ROOT, 'video', 'valence.html') + '?render=1';
const OUT = path.join(ROOT, 'video', 'إلكترونات-التكافؤ.mp4');
const NARR_DIR = path.join(ROOT, 'video', 'narration');
const BUILD = path.join(ROOT, 'build', 'narration');
const VOICE_DIR = path.join(ROOT, 'build', 'voice');
const VOICE = path.join(VOICE_DIR, 'vits-piper-ar_JO-kareem-medium', 'ar_JO-kareem-medium.onnx');
const VOICE_URL = 'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-ar_JO-kareem-medium.tar.bz2';
const FPS = 30;
const py = (...args) => execFileSync('python3', [path.join(__dirname, 'narrate.py'), ...args], { encoding: 'utf8', maxBuffer: 1 << 26 });

function ensureVoice() {
  if (fs.existsSync(VOICE)) return;
  fs.mkdirSync(VOICE_DIR, { recursive: true });
  const tar = path.join(VOICE_DIR, 'voice.tar.bz2');
  execFileSync('curl', ['-sSL', '-o', tar, VOICE_URL], { stdio: 'inherit' });
  execFileSync('tar', ['xjf', tar, '-C', VOICE_DIR], { stdio: 'inherit' });
  fs.unlinkSync(tar);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(HTML);
  await page.evaluate(() => window.ready);

  // 1) توليد جمل الراوي وقياس مددها، ثم بناء الخط الزمني عليها
  ensureVoice();
  fs.mkdirSync(BUILD, { recursive: true });
  fs.mkdirSync(NARR_DIR, { recursive: true });
  const textsFile = path.join(BUILD, 'texts.json');
  fs.writeFileSync(textsFile, JSON.stringify(await page.evaluate(() => window.narrTexts())));
  const clips = JSON.parse(py('synth', textsFile, path.join(BUILD, 'clips'), VOICE));
  const durs = Object.fromEntries(Object.entries(clips).map(([k, v]) => [k, +v.dur.toFixed(3)]));
  fs.writeFileSync(path.join(NARR_DIR, 'durations.js'), '// مدد جمل الراوي بالثواني (يولّدها src/valence_video.js)\nwindow.NARR_DURS = ' + JSON.stringify(durs) + ';\n');
  await page.evaluate(d => window.buildTimeline(d), durs);
  const total = await page.evaluate(() => window.TOTAL);
  const plan = (await page.evaluate(() => window.narrPlan())).map(p => ({ ...p, file: clips[p.key].file }));
  const planFile = path.join(BUILD, 'plan.json'), wav = path.join(BUILD, 'narration.wav');
  fs.writeFileSync(planFile, JSON.stringify(plan));
  py('mix', planFile, wav, String(total));
  const m4a = path.join(NARR_DIR, 'narration.m4a');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', wav, '-ar', '44100', '-ac', '2', '-c:a', 'aac', '-b:a', '160k', m4a]);
  console.log(`الصوت: ${plan.length} جملة، المدة ${total.toFixed(1)} ث`);

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

  // 2) الصور ← ffmpeg مع الصوت
  const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', m4a,
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'copy', '-shortest', '-movflags', '+faststart', OUT], { stdio: ['pipe', 'ignore', 'inherit'] });
  const frames = Math.ceil(total * FPS);
  for (let i = 0; i < frames; i++) {
    await page.evaluate(t => window.renderFrame(t), i / FPS);
    const buf = await canvas.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 600 === 0) console.log(`${i}/${frames}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('تم:', OUT);
})();
