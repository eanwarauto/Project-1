// Records a 1080x1920 reel of a living book: node reel.js <cov|ion> <outdir>
const { chromium } = require('playwright');
const fs = require('fs');
const which = process.argv[2], OUT = process.argv[3];
const BOOK = which === 'cov' ? '/home/user/Project-1/covalent-book/index.html' : '/home/user/Project-1/chemistry-book/index.html';
const TITLE = which === 'cov' ? 'الروابط التساهمية والتناسقية' : 'الترتيب الإلكتروني والرابطة الأيونية';
const ACC = which === 'cov' ? '#19a7b2' : '#3b97cf';
const QR = fs.readFileSync(`${OUT}/qr_${which}.svg`, 'utf8');
const wait = ms => new Promise(r => setTimeout(r, ms));

const CSS = `
html,body{background:#0b1626!important;overflow:hidden!important}
.bar{visibility:hidden!important}
#rv-end h2{color:#fff!important;-webkit-text-fill-color:#fff}
.app{position:fixed!important;left:0;top:0;width:1200px!important;height:880px!important;transform-origin:0 0;transition:transform .8s cubic-bezier(.3,.7,.2,1)}
#rv-top{position:fixed;top:0;left:0;right:0;height:300px;z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:46px;gap:6px;background:linear-gradient(#0b1626 0,#0b1626 72%,#0b162600);color:#fff;font-family:"Noto Naskh Arabic",Tahoma,sans-serif;text-align:center;direction:rtl;pointer-events:none}
#rv-top .k{font-size:28px;color:#9fd0ff;letter-spacing:.5px}
#rv-top h1{font-size:52px;margin:0;line-height:1.3}
#rv-cap{position:fixed;top:226px;left:0;right:0;margin:auto;width:max-content;max-width:980px;z-index:51;background:${ACC};color:#fff;font:800 34px "Noto Naskh Arabic",Tahoma,sans-serif;padding:10px 30px;border-radius:999px;box-shadow:0 10px 30px #0008;direction:rtl;transition:opacity .35s,transform .35s;pointer-events:none}
#rv-cap.off{opacity:0;transform:translateY(-10px)}
#rv-bot{position:fixed;bottom:0;left:0;right:0;height:150px;z-index:50;display:flex;align-items:center;justify-content:center;background:linear-gradient(#0b162600,#0b1626 40%);pointer-events:none}
#rv-bot b{font:800 46px "Segoe UI",Tahoma,sans-serif;color:#fff;letter-spacing:2px;direction:ltr;text-shadow:0 2px 12px #000a}
#rv-bot b i{font-style:normal;color:${ACC}}
#rv-end{position:fixed;inset:0;z-index:60;background:radial-gradient(circle at 50% 35%,#21466e,#0b1626 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;opacity:0;transition:opacity .6s;font-family:"Noto Naskh Arabic",Tahoma,sans-serif;color:#fff;direction:rtl;text-align:center;pointer-events:none}
#rv-end.on{opacity:1}
#rv-end h2{font-size:56px;margin:0;line-height:1.35}
#rv-end .q{background:#fff;border-radius:40px;padding:26px;box-shadow:0 20px 50px #000a}
#rv-end .q svg{width:520px;height:520px;display:block}
#rv-end p{font-size:40px;font-weight:800;margin:0}
#rv-end .w{font:800 50px "Segoe UI",Tahoma,sans-serif;letter-spacing:2px;direction:ltr}
#rv-end .w i{font-style:normal;color:${ACC}}
`;
const OVER = `<div id="rv-top"><div class="k">كتاب حي تفاعلي · الكيمياء · الصف العاشر</div><h1>${TITLE}</h1></div>
<div id="rv-cap" class="off"></div>
<div id="rv-bot"><b>Eng<i>.</i>Hekaya</b></div>
<div id="rv-end"><h2>الكتاب الحي<br>${TITLE}</h2><div class="q">${QR}</div><p>📱 امسح الرمز وجرّب بنفسك</p><div class="w">Eng<i>.</i>Hekaya</div></div>`;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const t0 = Date.now();
  const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: OUT + '/raw_' + which, size: { width: 1080, height: 1920 } } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + BOOK + '#1'); await wait(500);
  await p.addStyleTag({ content: CSS });
  await p.evaluate(h => {
    document.body.insertAdjacentHTML('beforeend', h);
    window.__k = 1;
    window.__focus = (sel, inst) => {
      const app = document.querySelector('.app'), el = document.querySelector(sel); if (!el) return;
      const k0 = window.__k, ar = app.getBoundingClientRect(), er = el.getBoundingClientRect();
      const x = (er.left - ar.left) / k0, y = (er.top - ar.top) / k0, w = er.width / k0, h = er.height / k0;
      const k = Math.min(1040 / w, 1440 / h), tx = 540 - (x + w / 2) * k, ty = 1035 - (y + h / 2) * k;
      window.__k = k; app.style.transition = inst ? 'none' : ''; app.style.transform = `translate(${tx}px,${ty}px) scale(${k})`;
    };
    window.__cap = t => { const c = document.getElementById('rv-cap'); c.classList.add('off'); setTimeout(() => { c.textContent = t; c.classList.remove('off') }, 300) };
  }, OVER);
  const focus = async (sel, inst) => { await p.evaluate(([s, i]) => window.__focus(s, i), [sel, !!inst]); await wait(inst ? 60 : 850); };
  const cap = async t => { await p.evaluate(t => window.__cap(t), t); };
  const go = async i => { await p.evaluate(i => { jump(i) }, i); await wait(500); };
  const into = async sel => { await p.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); await wait(150); };
  const smoothDrag = async (from, to, n = 22, ms = 22) => {
    await p.mouse.move(from.x, from.y); await p.mouse.down();
    for (let i = 1; i <= n; i++) { await p.mouse.move(from.x + (to.x - from.x) * i / n, from.y + (to.y - from.y) * i / n); await wait(ms) }
    await p.mouse.up();
  };
  const center = async loc => { const bb = await loc.boundingBox(); return { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 } };
  const svgPt = async (loc, vx, vy, W, H) => { const bb = await loc.boundingBox(); return { x: bb.x + vx / W * bb.width, y: bb.y + vy / H * bb.height } };

  await focus('.pg.r', true); await wait(300);
  const tStart = Date.now();

  if (which === 'cov') {
    await cap('اضغط على الهواء… وشاهد جزيئاته 🔍'); await wait(1100);
    await p.locator('.sky').click(); await wait(2700);
    // O2: drag electrons into the sharing zone
    await go(3); await focus('.pg.r'); await into('.pg.r .bb');
    await cap('اسحب الإلكترونات… وكوّن الرابطة بنفسك ✨');
    const ob = p.locator('.pg.r .bb').first();
    for (let i = 0; i < 2; i++) { const svg = ob.locator('.bbsvg svg'); await smoothDrag(await center(ob.locator('.ueg .ue').first()), await svgPt(svg, 180, 100, 360, 200)); await wait(550) }
    await wait(1000);
    // H2O: build then see it in 3D
    await go(5); await focus('.pg.l'); await into('.pg.l .cb');
    await cap('ابنِ جزيء الماء 💧');
    const w = p.locator('.pg.l .cb').first(), ws = () => w.locator('.bbsvg svg');
    await smoothDrag(await center(w.locator('.ueg[data-a="0"] .ue').first()), await svgPt(ws(), 80, 125, 360, 250)); await wait(500);
    await smoothDrag(await center(w.locator('.ueg[data-g] .ue').first()), await svgPt(ws(), 180, 125, 360, 250)); await wait(1300);
    await into('.pg.l .cb .after .mv'); await w.locator('.after .mv [data-o="dip"]').click();
    await cap('وشاهده ثلاثي الأبعاد مع اتجاه القطبية 🧲'); await wait(2300);
    // Lab
    await go(7); await focus('.pg.r'); await into('.pg.r [data-lab2] .labc');
    await cap('مختبر افتراضي: انحراف السائل القطبي 🧪');
    const L = p.locator('[data-lab2]');
    await L.locator('[data-s="B"]').click();
    for (let i = 0; i < 3; i++) { await L.locator('[data-rub]').click(); await wait(120) }
    await L.locator('[data-open]').click(); await wait(500);
    await p.evaluate(() => { const r = document.querySelector('.rod'); r.value = 90; r.dispatchEvent(new Event('input')) }); await wait(2200);
    await p.evaluate(() => document.querySelector('[data-mode="cond"]').click()); await wait(350); await p.evaluate(() => document.querySelector('[data-dip]').click());
    await cap('والمصباح يضيء! 💡'); await wait(2200);
  } else {
    await cap('اضغط العنصر… وشاهد ترتيبه النقطي ⚛️'); await wait(800);
    for (const s of ['Na', 'Cl', 'Mg']) { await p.locator(`.pt button[data-s="${s}"]`).click(); await wait(750) }
    await focus('.pg.l'); await into('.pg.l .bld-wrap');
    await cap('المبنى غير المكتمل يهتز… أكمله فيستقر 🏢');
    const B = p.locator('.bcard').nth(1); await wait(500);
    for (let i = 0; i < 3; i++) { await B.locator('[data-add]').click(); await wait(350) }
    await wait(900);
    await go(4); await focus('.pg.l'); await into('.pg.l .vout');
    await cap('الكلور يكتسب إلكترونًا… فيستقر 🎯'); await wait(500);
    await p.locator('[data-react]').click(); await wait(2000);
    await go(6); await focus('.pg.l'); await into('.pg.l .tr');
    await cap('ينتقل الإلكترون من Na إلى Cl ⚡');
    for (let i = 0; i < 3; i++) { await wait(900); await p.locator('[data-tr]').click() }
    await wait(1000);
    await go(11); await focus('.pg.r'); await into('.pg.r canvas');
    await cap('الشبكة البلورية: صلب… ثم مصهور 🔥'); await wait(1100);
    await p.locator('.pg.r [data-latmode="molten"]').click(); await wait(1500);
    await go(12); await focus('.pg.r'); await into('.pg.r .circ');
    await cap('المصهور يوصل التيار الكهربائي 💡'); await wait(500);
    await p.locator('.pg.r [data-latmode="molten"]').click(); await wait(2600);
  }
  await p.evaluate(() => { document.getElementById('rv-cap').classList.add('off'); document.getElementById('rv-end').classList.add('on') });
  await wait(3600);
  const tEnd = Date.now();
  await ctx.close(); await b.close();
  const vids = fs.readdirSync(OUT + '/raw_' + which).filter(f => f.endsWith('.webm'));
  fs.writeFileSync(OUT + '/meta_' + which + '.json', JSON.stringify({ file: OUT + '/raw_' + which + '/' + vids[0], start: (tStart - t0) / 1000, dur: (tEnd - tStart) / 1000, errs }));
  console.log(which, 'start', ((tStart - t0) / 1000).toFixed(2), 'dur', ((tEnd - tStart) / 1000).toFixed(2), 'errs', errs.length ? errs : 'none');
})();
