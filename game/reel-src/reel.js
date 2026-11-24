const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const DIR = __dirname;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.clock.install({ time: new Date('2026-11-24T10:00:00') });
  await p.addInitScript(() => {
    const now = Date.now();
    const s = {v:3,res:{wood:2,stone:7,fruit:0,egg:0,milk:0,coin:0},level:0,pos:[14,12],stall:{fruit:0,egg:0,milk:0},mute:false,trees:Array(14).fill(0),rocks:Array(8).fill(0),
      hens:[0,0,0],cows:[0,0],barnClean:0,decks:{1:[],2:[]},plots:[now - 999999,now - 999999,null,null,null,null,null,null],stats:{ok:0,total:0,by:{1:[0,0],2:[0,0],3:[0,0],4:[0,0]}},lessons:[1,2,3,4],lastQ:-1,seenHelp:false,won:false};
    localStorage.setItem('chem-village-v1', JSON.stringify(s));
    window.__log = [];
    document.addEventListener('chem-sfx', e => window.__log.push([performance.now(), e.detail]));
  });
  await p.goto('file://' + DIR + '/game.html#reel');
  await p.addStyleTag({ content: `
    @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400&display=swap');
    #app{top:104px!important}
    #reelHead{position:fixed;top:0;left:0;right:0;height:104px;background:linear-gradient(#1b2b52,#22355f);color:#fff;font-family:Cairo,sans-serif;
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center;direction:rtl;z-index:50;border-bottom:3px solid #e3a72f}
    #reelHead .t{font-size:14px;font-weight:700;color:#dfe7f7;letter-spacing:.2px}
    #reelHead .c{font-size:21px;font-weight:800;color:#ffd45e;transition:opacity .15s}
    #reelMark{position:fixed;left:14px;bottom:12px;z-index:60;font-family:'Quicksand',sans-serif;font-weight:400;font-size:15px;color:rgba(255,255,255,.88);
      text-shadow:0 1px 4px rgba(0,0,0,.45);letter-spacing:.5px}
    .tapfx{position:fixed;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:4px solid rgba(255,255,255,.95);background:rgba(255,212,94,.35);
      z-index:70;pointer-events:none;animation:tapfx .9s ease-out forwards}
    @keyframes tapfx{to{transform:scale(2.2);opacity:0}}`});
  await p.evaluate(() => {
    const h = document.createElement('div'); h.id = 'reelHead';
    h.innerHTML = '<div class="t">العب وراجع الوحدة الأولى من كتاب الصف العاشر</div><div class="c" id="cap"></div>';
    document.body.appendChild(h);
    const m = document.createElement('div'); m.id = 'reelMark'; m.textContent = 'eng.7ikaya'; document.body.appendChild(m);
    addEventListener('pointerdown', e => { const d = document.createElement('div'); d.className = 'tapfx'; d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px'; document.body.appendChild(d); setTimeout(() => d.remove(), 900); }, true);
    dispatchEvent(new Event('resize'));
  });
  await p.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 1500));
  await p.clock.pauseAt(new Date('2026-11-24T10:01:00'));

  const ff = spawn('ffmpeg', ['-y','-loglevel','error','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-preset','medium', DIR + '/video.mp4']);
  let frame = 0; const T0 = await p.evaluate(() => performance.now());
  const shots = async n => { for (let i = 0; i < n; i++) { await p.clock.runFor(frame % 3 === 2 ? 34 : 33); const buf = await p.screenshot({ type: 'jpeg', quality: 92 }); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); frame++; } };
  const cap = async t => { await p.evaluate(t => { document.getElementById('cap').textContent = t; }, t); };
  const tapTile = async (x, y) => {
    const [sx, sy] = await p.evaluate(([x, y]) => { const r = document.getElementById('cv').getBoundingClientRect(); const [a, b] = window.__cv.tile(x, y); return [a + r.left, b + r.top]; }, [x, y]);
    await p.mouse.click(sx, sy);
  };
  const untilSheet = async () => { for (let i = 0; i < 200; i++) { if (await p.evaluate(() => !document.getElementById('ov').hidden)) return; await shots(1); } };
  const untilIdle = async () => { for (let i = 0; i < 200; i++) { if (!(await p.evaluate(() => window.__cv.walking()))) return; await shots(1); } };
  const go = async pts => { for (const [x, y] of pts) { await tapTile(x, y); await shots(3); await untilIdle(); } };
  const answer = async good => {   await p.click(good ? '.opt[data-i="0"]' : '.opt:not([data-i="0"])'); };

  const tapAnimal = async kind => {
    const [sx, sy] = await p.evaluate(kind => { const r = document.getElementById('cv').getBoundingClientRect(); const a = window.__cv.animals().filter(a => a[0] === kind)[0]; const [x, y] = window.__cv.tile(a[1], a[2] + (kind === 'cow' ? -.05 : .1)); return [x + r.left, y + r.top]; }, kind);
    await p.mouse.click(sx, sy);
  };
  const qa = async (good, pre, post, capAfter) => { await untilSheet(); await shots(pre); await answer(good); if (capAfter) await cap(capAfter); await shots(post); await p.click('#contBtn'); };

  await cap('مزرعة تُبنى بأسئلة الوحدة الأولى'); await shots(75);
  await p.click('[data-close]'); await shots(8);
  await cap('الحركة بالنقر على الخريطة'); await tapTile(17, 13); await shots(4); await untilIdle(); await shots(6);
  await tapTile(13, 12); await shots(4); await untilIdle(); await shots(4);
  await cap('النقر على الشجرة لقطع الحطب'); await tapTile(11, 5); await untilSheet(); await shots(8);
  await cap('قبل كل مورد سؤال علمي'); await shots(45);
  await cap('الأسئلة تبدأ سهلة ثم تتدرج'); await shots(40);
  await answer(true); await cap('الإجابة الصحيحة تمنح المورد كاملًا'); await shots(55); await p.click('#contBtn'); await shots(45);
  await cap('تكسير الحجارة من الصخور'); await tapTile(16, 16); await qa(false, 60, 75, 'الإجابة الخاطئة تعرض الإجابة الصحيحة'); await shots(40);
  await cap('حصاد المحاصيل من الحقل'); await go([[12,13],[7,13]]); await tapTile(6, 14); await qa(true, 55, 40); await shots(30);
  await cap('تنظيف الحظيرة يمنح عملات'); await go([[5,17]]); await tapTile(3, 19); await qa(true, 55, 45); await shots(40);
  await cap('جمع البيض من الدجاج'); await tapAnimal('hen'); await qa(true, 50, 40); await shots(30);
  await cap('حلب البقرة'); await tapAnimal('cow'); await qa(true, 50, 40); await shots(35);
  await cap('عرض المنتجات في بسطة السوق'); await go([[9,17],[12,13],[16,12],[20,12]]); await tapTile(21, 14); await untilSheet(); await shots(35);
  await p.click('#putAll'); await shots(25); await p.click('[data-close]'); await shots(8);
  await tapTile(19, 12); await shots(3);
  await cap('أهل القرية يشترون المنتجات بالعملات'); await shots(165);
  await cap('البناء يبدأ بالبيت الحجري'); await p.click('#stageBtn'); await shots(55);
  await p.click('#doBuild'); await shots(60); await answer(true); await shots(40);
  await p.click('#contBtn'); await shots(80);
  await cap('وصولًا إلى قصر العلماء'); await p.click('#stageBtn'); await shots(85);
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  const log = await p.evaluate(() => window.__log);
  fs.writeFileSync(DIR + '/sfx.json', JSON.stringify({ frames: frame, events: log.map(([t, k]) => [(t - T0) / 1000, k]) }));
  console.log('frames', frame, 'sfx', log.length, 'coins', await p.textContent('#n-coin'), errs);
  await b.close();
})();
