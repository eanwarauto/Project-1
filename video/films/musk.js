// الفيلم ١: حامل المسك ونافخ الكير
(function () {
  const { W, H, sm, io, seg, win, keys, rnd, noise, glow, puff, c, mix, lerp, clamp, figure, ellipse } = E;
  const DUR = 58.5;

  // ----- أشكال معمارية -----
  const archPath = (ctx, x0, x1, ySpring, yBottom, peak) => {
    const xm = (x0 + x1) / 2;
    ctx.beginPath();
    ctx.moveTo(x0, yBottom); ctx.lineTo(x0, ySpring);
    ctx.quadraticCurveTo(x0, ySpring - peak * 0.9, xm, ySpring - peak);
    ctx.quadraticCurveTo(x1, ySpring - peak * 0.9, x1, ySpring);
    ctx.lineTo(x1, yBottom); ctx.closePath();
  };
  const awning = (ctx, x0, x1, y, cols, t, sway) => {
    const n = 9, w = (x1 - x0) / n;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = cols[i % 2];
      const flap = Math.sin(t * 1.3 + i * 0.7) * 3 * sway;
      ctx.beginPath();
      ctx.moveTo(x0 + i * w, y); ctx.lineTo(x0 + (i + 1) * w, y);
      ctx.lineTo(x0 + (i + 1) * w + 6, y + 70 + flap);
      ctx.quadraticCurveTo(x0 + (i + 0.5) * w + 3, y + 92 + flap, x0 + i * w + 6, y + 70 + flap);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x0, y, x1 - x0, 10);
  };
  const bottle = (ctx, x, y, w, h, col, a, gl) => {
    ctx.save();
    ctx.fillStyle = c(col, 0.85 * a);
    E.rrect(ctx, x - w / 2, y - h, w, h * 0.72, w * 0.35); ctx.fill();
    ctx.fillRect(x - w * 0.16, y - h * 1.12, w * 0.32, h * 0.45);
    ctx.fillStyle = c('#7a4a2a', a); ctx.fillRect(x - w * 0.2, y - h * 1.22, w * 0.4, h * 0.12);
    ctx.fillStyle = `rgba(255,255,255,${0.45 * a})`; ctx.fillRect(x - w * 0.3, y - h * 0.9, w * 0.12, h * 0.45);
    ctx.restore();
    if (gl) glow(ctx, x, y - h * 0.55, w * 2.4, col, gl);
  };

  // ----- خلفية السوق -----
  function market(ctx, t, st) {
    // السماء
    ctx.fillStyle = E.vgrad(ctx, -200, 640, [[0, '#0b0a24'], [0.6, '#2b1d50'], [1, '#6b3b63']]);
    ctx.fillRect(-600, -400, W + 1200, 1100);
    E.stars(ctx, t, 90, 3, -100, 420, 0.9);
    // الهلال
    ctx.save(); ctx.translate(990, 210);
    glow(ctx, 0, 0, 160, '#fff1c4', 0.25);
    ctx.fillStyle = '#fff3cf'; ctx.beginPath(); ctx.arc(0, 0, 46, 0, 7); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(18, -10, 42, 0, 7); ctx.fill();
    ctx.restore();
    // أفق المدينة البعيد
    ctx.fillStyle = '#2a1b45';
    ctx.beginPath(); ctx.moveTo(600, 640);
    [[640, 520], [700, 520], [705, 470], [760, 470], [770, 540], [830, 540], [860, 455], [890, 540], [1030, 540], [1060, 400], [1066, 330], [1072, 400], [1100, 540], [1180, 510], [1260, 510], [1300, 640]].forEach(p => ctx.lineTo(...p));
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(960, 540, 70, Math.PI, 0); ctx.fill();
    // أرض الزقاق بالمنظور
    ctx.fillStyle = E.vgrad(ctx, 600, 1100, [[0, '#3a2638'], [1, '#6a4a3e']]);
    ctx.beginPath(); ctx.moveTo(-600, 1200); ctx.lineTo(880, 610); ctx.lineTo(1040, 610); ctx.lineTo(2520, 1200); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4a3140'; ctx.fillRect(-600, 870, W + 1200, 400);
    ctx.fillStyle = E.vgrad(ctx, 870, 1100, [[0, '#4d3443'], [1, '#6e4c42']]); ctx.fillRect(-600, 875, W + 1200, 400);
    // بلاط
    ctx.strokeStyle = 'rgba(20,10,20,0.25)'; ctx.lineWidth = 2;
    for (let i = -12; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(960 + i * 9, 615); ctx.lineTo(960 + i * 160, 1200); ctx.stroke(); }
    for (let j = 0; j < 9; j++) { const y = 615 + Math.pow(j / 8, 1.8) * 560; ctx.beginPath(); ctx.moveTo(-600, y); ctx.lineTo(2520, y); ctx.stroke(); }
    // أقواس بعيدة في عمق الزقاق
    for (let k = 3; k >= 1; k--) {
      const sc = 0.18 * k, cx = 960, by = 615 + k * 16;
      ctx.fillStyle = c(mix('#2a1b40', '#4a2e4a', k / 3));
      ctx.fillRect(cx - 520 * sc - 60, by - 700 * sc, 120 * sc + 40, 700 * sc);
      ctx.fillRect(cx + 520 * sc - 60 * sc, by - 700 * sc, 120 * sc + 40, 700 * sc);
      glow(ctx, cx - 360 * sc, by - 420 * sc, 60 * sc + 20, '#ffb45a', 0.35);
      glow(ctx, cx + 360 * sc, by - 420 * sc, 60 * sc + 20, '#ffb45a', 0.35);
    }

    smithShop(ctx, t, st);
    perfShop(ctx, t, st);

    // حبل الفوانيس بين الدكانين
    ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(640, 240); ctx.quadraticCurveTo(960, 360, 1280, 240); ctx.stroke();
    for (let i = 1; i < 8; i++) {
      const u = i / 8, x = lerp(640, 1280, u), y = 240 + 2 * (1 - u) * u * 120 * 2 * 0.5 * 2;
      const swing = Math.sin(t * 1.4 + i) * 0.12;
      ctx.save(); ctx.translate(x, y); ctx.rotate(swing);
      ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 22); ctx.stroke();
      const lc = ['#ffb347', '#ff6f61', '#ffd56b', '#8fe3c7'][i % 4];
      ctx.fillStyle = c(lc); E.rrect(ctx, -10, 22, 20, 28, 8); ctx.fill();
      ctx.restore();
      glow(ctx, x + Math.sin(swing) * -36, y + 36, 70, lc, 0.45 + 0.1 * Math.sin(t * 5 + i));
    }
  }

  // ----- دكان الحدّاد (نافخ الكير) -----
  const PUMPS = [13.6, 15.0, 16.4, 17.8, 19.2, 20.6, 22.0];
  const pumpAmt = (t) => { let v = 0; for (const p of PUMPS) { const d = t - p; if (d > -0.5 && d < 0.6) v = Math.max(v, d < 0 ? sm(d, -0.5, 0) : 1 - sm(d, 0, 0.6)); } return v; };
  function smithShop(ctx, t, st) {
    const fire = 0.6 + 0.4 * Math.abs(noise(t * 3)) + pumpAmt(t) * 0.8;
    // الواجهة
    ctx.fillStyle = E.vgrad(ctx, 80, 900, [[0, '#3b2430'], [1, '#5a3436']]);
    ctx.fillRect(-500, 80, 1160, 800);
    // حجارة
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2;
    for (let r = 0; r < 14; r++) for (let k = 0; k < 14; k++) { const x = -500 + k * 90 + (r % 2) * 45, y = 90 + r * 56; ctx.strokeRect(x, y, 90, 56); }
    // الفتحة
    archPath(ctx, 80, 600, 420, 880, 140);
    ctx.fillStyle = '#1b0d10'; ctx.fill();
    ctx.save(); archPath(ctx, 80, 600, 420, 880, 140); ctx.clip();
    glow(ctx, 300, 700, 420, '#ff5a1f', 0.35 * fire);
    // الغطاء والمدخنة
    ctx.fillStyle = '#2a1416'; ctx.beginPath(); ctx.moveTo(170, 560); ctx.lineTo(430, 560); ctx.lineTo(360, 420); ctx.lineTo(240, 420); ctx.closePath(); ctx.fill();
    ctx.fillRect(250, 250, 100, 180);
    // الكور
    ctx.fillStyle = '#4a2220'; ctx.beginPath(); ctx.ellipse(300, 860, 150, 190, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 3;
    for (let r = 0; r < 5; r++) { ctx.beginPath(); ctx.ellipse(300, 860, 150 - r * 6, 190 - r * 38, 0, Math.PI, 0); ctx.stroke(); }
    // فم النار
    ellipse(ctx, 300, 790, 70, 48, '#2a0a06');
    for (let k = 0; k < 6; k++) {
      const fx = 300 + (k - 2.5) * 18 + noise(t * 4 + k) * 6, fh = (50 + 30 * Math.abs(noise(t * 5 + k * 3))) * (0.7 + fire * 0.5);
      ctx.fillStyle = k % 2 ? 'rgba(255,190,60,0.9)' : 'rgba(255,90,30,0.9)';
      ctx.beginPath(); ctx.moveTo(fx - 14, 830); ctx.quadraticCurveTo(fx - 12, 830 - fh * 0.6, fx + noise(t * 6 + k) * 8, 830 - fh); ctx.quadraticCurveTo(fx + 12, 830 - fh * 0.6, fx + 14, 830); ctx.fill();
    }
    glow(ctx, 300, 790, 160 * fire, '#ff7a2a', 0.8);
    // المنفاخ
    const p = pumpAmt(t);
    ctx.save(); ctx.translate(140, 800);
    ctx.fillStyle = '#6b3a24';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-90, -40 + p * 28); ctx.lineTo(-90, 40 - p * 28); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2a140a'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#3a2010'; ctx.fillRect(0, -6, 60, 12);
    ctx.restore();
    // السندان
    ctx.fillStyle = '#26232a';
    ctx.beginPath(); ctx.moveTo(470, 800); ctx.lineTo(600, 800); ctx.quadraticCurveTo(620, 800, 640, 790); ctx.lineTo(590, 820); ctx.lineTo(560, 820); ctx.lineTo(570, 880); ctx.lineTo(500, 880); ctx.lineTo(510, 820); ctx.lineTo(470, 820); ctx.closePath(); ctx.fill();
    ctx.restore();
    // الحدّاد
    const bs = st.smithFig;
    if (bs.a > 0) figure(ctx, { x: 470, y: 880, s: 1.55, robe: '#3d2a2a', robe2: '#24181a', skin: '#c88d6a', hair: '#1a1010', mood: 'angry', face: -0.6, armL: 1.2 - p * 0.9, armR: 0.4, ground: false, alpha: bs.a, desat: 0.2 });
    // المظلة
    awning(ctx, 40, 640, 300, ['#5b1f1f', '#2a1414'], t, 1);
    // ضوء النار على الأرض
    glow(ctx, 380, 900, 380, '#ff5a1f', 0.25 * fire);
  }

  // ----- دكان العطّار (حامل المسك) -----
  const BOT_COLS = ['#ff8fb1', '#8fd3ff', '#ffd36b', '#9dffb0', '#c9a0ff', '#ff9f6b', '#ffe9a8'];
  function perfShop(ctx, t, st) {
    ctx.fillStyle = E.vgrad(ctx, 80, 900, [[0, '#3b2e4a'], [1, '#6b4a4a']]);
    ctx.fillRect(1260, 80, 1160, 800);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 2;
    for (let r = 0; r < 14; r++) for (let k = 0; k < 14; k++) { const x = 1260 + k * 90 + (r % 2) * 45, y = 90 + r * 56; ctx.strokeRect(x, y, 90, 56); }
    archPath(ctx, 1320, 1840, 420, 880, 140);
    ctx.fillStyle = '#3a2418'; ctx.fill();
    ctx.save(); archPath(ctx, 1320, 1840, 420, 880, 140); ctx.clip();
    ctx.fillStyle = E.vgrad(ctx, 280, 880, [[0, '#5a3a22'], [1, '#8a5a30']]); ctx.fillRect(1320, 260, 520, 620);
    glow(ctx, 1580, 520, 420, '#ffcf6a', 0.45);
    // رفوف وقوارير
    for (let r = 0; r < 3; r++) {
      const y = 470 + r * 100;
      ctx.fillStyle = '#4a2a14'; ctx.fillRect(1340, y, 480, 12);
      for (let k = 0; k < 9; k++) {
        const i = r * 9 + k, x = 1370 + k * 52 + rnd(i, 4) * 10;
        const w = 22 + rnd(i, 5) * 14, h = 40 + rnd(i, 6) * 30;
        bottle(ctx, x, y, w, h, BOT_COLS[i % BOT_COLS.length], 1, 0.18 + 0.12 * Math.sin(t * 2 + i));
      }
    }
    // قناديل معلّقة
    for (let k = 0; k < 3; k++) {
      const x = 1430 + k * 150, y = 330 + (k % 2) * 30;
      ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 260); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = '#ffcf6a'; ctx.beginPath(); ctx.ellipse(x, y + 16, 14, 18, 0, 0, 7); ctx.fill();
      glow(ctx, x, y + 16, 90, '#ffcf6a', 0.6);
    }
    ctx.restore();
    // العطّار
    if (st.perfFig.a > 0) figure(ctx, { x: 1580, y: 880, s: 1.55, robe: '#3f7a63', robe2: '#2a5546', skin: '#e9b98f', hair: '#3a2a1a', scarf: '#e8c66a', mood: st.perfMood, face: st.perfFace, armL: st.perfArmL, armR: 0.25, ground: false, alpha: st.perfFig.a, glow: 0.3 });
    // الطاولة
    ctx.fillStyle = '#6a3e20'; ctx.fillRect(1340, 790, 480, 90);
    ctx.fillStyle = '#8a5530'; ctx.fillRect(1330, 780, 500, 18);
    ctx.fillStyle = 'rgba(255,220,150,0.15)'; ctx.fillRect(1340, 798, 480, 6);
    awning(ctx, 1280, 1880, 300, ['#1f5a54', '#e2b85c'], t, 1);
    glow(ctx, 1560, 900, 420, '#ffcf6a', 0.22);
  }

  // ----- شرر الكير -----
  function sparks(ctx, t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    PUMPS.forEach((p0, k) => {
      for (let i = 0; i < 34; i++) {
        const age = t - p0 - rnd(i, k * 7) * 0.25;
        if (age < 0 || age > 1.6) continue;
        const vx = 260 + rnd(i, k * 7 + 1) * 520, vy = -340 + rnd(i, k * 7 + 2) * 300;
        const x = 330 + vx * age, y = 780 + vy * age + 380 * age * age;
        const a = 1 - age / 1.6;
        ctx.strokeStyle = `rgba(255,${150 + rnd(i, 3) * 100 | 0},60,${a})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - vx * 0.035, y - (vy + 760 * age) * 0.035); ctx.stroke();
      }
    });
    ctx.restore();
  }
  function smoke(ctx, t, inten) {
    if (inten <= 0) return;
    for (let i = 0; i < 46; i++) {
      const birth = 13.2 + i * 0.24, age = t - birth, life = 5.5;
      if (age < 0 || age > life) continue;
      const x = 330 + age * 120 + noise(i + age * 0.8) * 50, y = 760 - age * 55 + noise(i * 3 + age) * 30;
      const r = 40 + age * 70;
      puff(ctx, x, y - 60, r * 0.85, i % 3 ? '#2f2a2c' : '#4a4246', 0.3 * Math.sin(Math.PI * age / life) * inten);
    }
  }

  // ----- شرائط العطر -----
  function ribbons(ctx, t, from, to, t0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (let j = 0; j < 6; j++) {
      const st = t0 + j * 0.45;
      const head = E.ease.out(seg(t, st, st + 3.2));
      if (head <= 0) continue;
      const fadeOut = 1 - sm(t, 39.5, 41);
      const N = 60;
      let prev = null;
      for (let k = 0; k <= N; k++) {
        const u = (k / N) * head;
        // من القارورة نحو البطل ثم التفاف حوله
        const toward = Math.min(1, u / 0.6);
        const px = lerp(from[0], to[0], E.ease.inOut(toward)), py = lerp(from[1], to[1], toward) - Math.sin(toward * Math.PI) * (90 + j * 25);
        let x = px + Math.sin(u * 9 + t * 1.6 + j) * 18, y = py + Math.cos(u * 7 + t + j) * 12;
        if (u > 0.6) { const sp = (u - 0.6) / 0.4, ang = sp * Math.PI * 3 + j + t * 1.2; x = to[0] + Math.cos(ang) * (70 - sp * 20); y = to[1] - sp * 170 + Math.sin(ang) * 22; }
        if (prev) {
          const tail = k / N;
          ctx.strokeStyle = `rgba(255,${200 + j * 8},${120 + j * 15},${0.42 * tail * fadeOut})`;
          ctx.lineWidth = 2 + 7 * Math.sin(tail * Math.PI);
          ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(x, y); ctx.stroke();
        }
        prev = [x, y];
      }
      if (prev) glow(ctx, prev[0], prev[1], 40, '#ffe7a0', 0.8 * fadeOut);
    }
    ctx.restore();
  }
  function flowers(ctx, t, cx, cy, t0) {
    for (let i = 0; i < 9; i++) {
      const g = E.ease.back(seg(t, t0 + i * 0.35, t0 + i * 0.35 + 1.2));
      if (g <= 0) continue;
      const side = i % 2 ? 1 : -1;
      const x = cx + side * (60 + rnd(i, 50) * 110), y = cy + 8 + rnd(i, 51) * 30;
      const h = (30 + rnd(i, 52) * 40) * g;
      ctx.strokeStyle = '#4f9a5a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + side * 8, y - h / 2, x, y - h); ctx.stroke();
      const pc = ['#ff8fb1', '#ffd36b', '#c9a0ff', '#ffffff'][i % 4];
      for (let k = 0; k < 5; k++) { const an = k * 1.2566 + t * 0.3; ellipse(ctx, x + Math.cos(an) * 9 * g, y - h + Math.sin(an) * 9 * g, 8 * g, 8 * g, pc); }
      ellipse(ctx, x, y - h, 6 * g, 6 * g, '#ffb02e');
      glow(ctx, x, y - h, 40 * g, pc, 0.3);
    }
  }
  function petals(ctx, t, a) {
    if (a <= 0) return;
    for (let i = 0; i < 40; i++) {
      const life = 7, ph = (t + rnd(i, 60) * life) % life;
      const x = 1900 - ph * (200 + rnd(i, 61) * 120) + Math.sin(t * 2 + i) * 30, y = 200 + rnd(i, 62) * 600 + ph * 40 + Math.sin(t + i) * 30;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2 + i); ctx.globalAlpha = a * Math.sin(Math.PI * ph / life);
      ellipse(ctx, 0, 0, 9, 5, ['#ffb3c8', '#ffe39a', '#ffffff'][i % 3]); ctx.restore();
    }
  }

  // ----- مشهد الكشف -----
  function revealWorld(ctx, t) {
    ctx.fillStyle = E.vgrad(ctx, 0, H, [[0, '#0b0818'], [0.55, '#2a1838'], [1, '#3a2232']]); ctx.fillRect(-200, -200, W + 400, H + 400);
    E.stars(ctx, t, 120, 11, 100, 600, 0.8);
    glow(ctx, 1500, 640, 700, '#ffcf6a', 0.25);
    glow(ctx, 380, 640, 600, '#5a1a10', 0.35);
    ctx.fillStyle = E.vgrad(ctx, 640, H, [[0, '#2a1a30'], [1, '#120a14']]);
    ctx.beginPath(); ctx.moveTo(-200, 700); ctx.quadraticCurveTo(960, 620, 2120, 700); ctx.lineTo(2120, 1300); ctx.lineTo(-200, 1300); ctx.fill();
    // طريق ذهبي نحو الأفق
    const pa = sm(t, 45, 48);
    if (pa > 0) {
      ctx.fillStyle = `rgba(255,207,106,${0.18 * pa})`;
      ctx.beginPath(); ctx.moveTo(1120, 660); ctx.lineTo(1160, 660); ctx.lineTo(1500, 1100); ctx.lineTo(1000, 1100); ctx.fill();
    }
  }

  function render(ctx, t) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const P = 41.2; // لحظة الانتقال إلى الكشف
    if (t < P) {
      // ----- الكاميرا -----
      const cam = keys(t, [[0, [960, 520, 1.0]], [8, [960, 560, 1.1]], [11, [960, 580, 1.1]], [13, [640, 610, 1.45]], [24, [640, 620, 1.55]], [26.5, [960, 590, 1.2]], [29, [1300, 610, 1.45]], [41, [1330, 620, 1.62]]]);
      ctx.save();
      const shake = t > 13 && t < 24 ? pumpAmt(t) * 6 : 0;
      E.camera(ctx, { x: cam[0], y: cam[1], zoom: cam[2], shake, t });

      // حالة الشخصيات
      const giftP = sm(t, 37.8, 39.4);
      const st = {
        smithFig: { a: 1 }, perfFig: { a: 1 },
        perfMood: t > 29 ? 'happy' : 'smile', perfFace: t > 29 ? -0.8 : -0.3,
        perfArmL: t > 29.3 ? lerp(0.12, 1.5, sm(t, 29.3, 30)) * (1 - sm(t, 31.5, 32.5)) + (t > 37.3 ? 1.6 * win(t, 37.3, 37.9, 39.3, 40) : 0) + 0.12 : 0.12,
      };
      market(ctx, t, st);

      // القارورة المفتوحة
      const bx = 1440, by = lerp(785, 700, sm(t, 29.4, 30.2)) + lerp(0, 85, sm(t, 31.5, 32.5));
      bottle(ctx, bx, by, 34, 56, '#ffd36b', 1, 0.6 + sm(t, 30.4, 31) * 0.8);
      if (t > 30.4) { // السدادة تطير
        const a = t - 30.4; const sx = bx + a * 40, sy = by - 66 - a * 260 + a * a * 300;
        if (a < 1.4) { ctx.fillStyle = '#7a4a2a'; ctx.fillRect(sx - 7, sy - 5, 14, 10); E.star(ctx, bx, by - 66, 30 * (1 - seg(a, 0, 0.6)), 1 - seg(a, 0, 0.6), '#fff4c8'); }
      }

      // ----- البطل -----
      const hx = keys(t, [[0, 960], [11, 960], [13, 730], [24, 730], [26.2, 950], [27.2, 950], [29, 1170]]);
      const hy = keys(t, [[0, 640], [8, 905]], E.ease.out);
      const hs = keys(t, [[0, 0.32], [8, 1.12]], E.ease.out);
      const walking = (t < 8 ? 1 : 0) + win(t, 11, 11.2, 12.8, 13) + win(t, 24.3, 24.6, 26, 26.2) + win(t, 27.2, 27.4, 28.8, 29);
      const face = t < 8 ? 0 : keys(t, [[8.3, 0], [8.8, -1], [9.6, -1], [10.1, 1], [10.8, 1], [11, -0.8], [24, -0.8], [24.3, 0.6], [26.2, 0], [27, 0.9], [37, 0.9], [37.5, 1]]);
      const sootV = seg(t, 13.6, 23) * (1 - sm(t, 31, 37.5));
      const desat = 0.75 * sootV;
      let mood = 'neutral';
      if (t > 13.8 && t < 24.3) mood = 'scared';
      if (t >= 24.3 && t < 27) mood = 'sad';
      if (t >= 27 && t < 31.5) mood = 'worry';
      if (t >= 31.5) mood = 'happy';
      const coughs = [16.6, 19.4, 22.1];
      let lean = 0; coughs.forEach(cg => { lean += -0.1 * win(t, cg, cg + 0.1, cg + 0.25, cg + 0.6); });
      if (t > 24.3 && t < 26.2) lean += Math.sin(t * 30) * 0.05 * (1 - seg(t, 24.3, 26.2));
      const blink = [3, 6.5, 9.7, 12, 27.6].some(b => t > b && t < b + 0.14) ? 1 : 0;
      const armR = t > 37.6 ? lerp(0.12, 1.45, sm(t, 37.6, 38.6)) * (1 - sm(t, 39.6, 40.4) * 0.45) : 0.12;
      const hero = figure(ctx, {
        x: hx, y: hy, s: hs, walk: t * 7, walking: clamp(walking), face, robe: '#f4efe3', robe2: '#cfc6b4', skin: '#f1c7a1', hair: '#3a2418', scarf: '#5aa0d8',
        mood, blink, soot: sootV, desat, glow: 0.45 * sm(t, 32, 38), armR, lean,
      });
      // الهدية في يده
      if (t > 37.8) {
        const from = [1590, 760], to = hero.handR;
        const p = giftP, gx = lerp(from[0], to[0], p), gy = lerp(from[1], to[1], p) - Math.sin(p * Math.PI) * 120;
        bottle(ctx, gx, gy + 14, 18, 30, '#ffb3c8', 1, 0.9);
        if (p < 1) E.star(ctx, gx, gy - 10, 16, 0.8);
      }

      // تأثيرات الحداد
      sparks(ctx, t);
      smoke(ctx, t, 1 - sm(t, 25, 28));
      // تأثيرات العطار
      if (t > 30.4) ribbons(ctx, t, [bx, by - 70], [hx, hy - 60], 30.5);
      if (t > 32) E.motes(ctx, t, 60, 33, '#ffe08a', { x0: hx - 260, x1: hx + 260, y0: hy - 360, y1: hy + 20, a: 0.8 * sm(t, 32, 34) * (1 - sm(t, 40, 41.2)), size: 3, speed: 40 });
      flowers(ctx, t, hx, hy, 33.2);
      ctx.restore();

      petals(ctx, t, sm(t, 33, 35));
      // ضباب ورمادي فوق الشاشة وقت الكير
      const haze = sm(t, 14, 22) * (1 - sm(t, 24.5, 27.5));
      if (haze > 0) {
        ctx.fillStyle = `rgba(40,30,32,${0.12 * haze})`; ctx.fillRect(0, 0, W, H);
        ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(255,70,20,${0.3 * haze})`; ctx.fillRect(0, 0, W, H); ctx.restore();
      }
      const warm = sm(t, 31, 35);
      if (warm > 0) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(255,200,110,${0.25 * warm})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    } else {
      // ----- الكشف: الدكانان صاحبان -----
      ctx.save();
      const cam = keys(t, [[P, [960, 560, 1.12]], [45, [960, 540, 1.0]], [50, [1080, 500, 1.05]]]);
      E.camera(ctx, { x: cam[0], y: cam[1], zoom: cam[2] });
      revealWorld(ctx, t);
      // الصاحب السيّئ
      const badA = 1 - sm(t, 46.2, 48.5);
      for (let i = 0; i < 26; i++) {
        const ph = (t * 0.5 + rnd(i, 70)) % 1;
        const dis = sm(t, 46.2, 48.5);
        puff(ctx, 480 + noise(i + t * 0.7) * 90 + dis * rnd(i, 71) * 200, 820 - ph * 320 - dis * 200, 50 + ph * 70 + dis * 80, '#2a2228', 0.35 * Math.sin(ph * Math.PI) * (1 - dis * 0.7));
      }
      if (badA > 0) {
        const bf = figure(ctx, { x: 480, y: 900, s: 1.3, robe: '#2b2426', robe2: '#151012', skin: '#5a4a48', hair: '#0d0a0a', mood: 'angry', face: 0.7, armR: 1.1 + Math.sin(t * 3) * 0.35, alpha: badA, hood: '#1a1416', desat: 0.4 });
        glow(ctx, bf.head[0] + 12, bf.head[1] + 2, 26, '#ff2a10', 0.7 * badA);
        glow(ctx, bf.head[0] + 32, bf.head[1] + 2, 26, '#ff2a10', 0.7 * badA);
      }
      // الصاحب الصالح والبطل
      const walkOff = sm(t, 47.4, 50.5);
      const gx = lerp(1440, 1180, walkOff), gy = lerp(900, 690, walkOff), gs = lerp(1.3, 0.55, walkOff);
      const hxR = keys(t, [[P, 960], [44.8, 960], [46.6, 1300]]);
      const hx = lerp(hxR, 1080, walkOff), hy = lerp(905, 692, walkOff), hs = lerp(1.3, 0.55, walkOff);
      const heroFace = keys(t, [[P, 0], [42.6, 0], [43, -1], [43.8, -1], [44.2, 1], [47.4, 1], [47.8, 0]]);
      const together = t > 46.6;
      const walkingH = clamp(win(t, 44.8, 45, 46.4, 46.6) + (walkOff > 0 && walkOff < 1 ? 1 : 0));
      // أثر ذهبي خلفهما
      if (walkOff > 0) E.motes(ctx, t, 50, 77, '#ffd27a', { x0: 1050, x1: 1500, y0: 680, y1: 980, a: 0.9 * walkOff * (1 - sm(t, 50.5, 51.5)), size: 3, speed: 12 });
      // ظهورهما للكاميرا وقت الابتعاد
      figure(ctx, { x: gx, y: gy, s: gs, robe: '#f7e7bf', robe2: '#e0c48a', skin: '#e9b98f', hair: '#3a2a1a', scarf: '#3f7a63', mood: 'happy', face: walkOff > 0.05 ? 0 : -0.6, armL: together ? 0.55 : 1.3, glow: 0.9, walk: t * 6, walking: walkOff > 0 && walkOff < 1 ? 1 : 0 });
      figure(ctx, { x: hx, y: hy, s: hs, robe: '#f4efe3', robe2: '#cfc6b4', skin: '#f1c7a1', hair: '#3a2418', scarf: '#5aa0d8', mood: heroFace < -0.5 ? 'worry' : 'happy', face: heroFace, armR: together ? 0.55 : 0.12, glow: 0.7, walk: t * 6 + 1, walking: walkingH });
      ctx.restore();
    }

    // العنوان
    E.titleCard(ctx, t, '١', 'حاملُ المسكِ ونافخُ الكير');
    // الخاتمة
    E.ending(ctx, t, {
      t0: 50, end: 57.2,
      lines: ['«مَثَلُ الْجَلِيسِ الصَّالِحِ وَالسَّوْءِ', 'كَحَامِلِ الْمِسْكِ وَنَافِخِ الْكِيرِ»'],
      source: 'متفق عليه', tagline: 'اختر جليسك… فإنك تحمل أثره',
    });
    const fade = sm(t, 0, 1.5) * (1 - sm(t, 57.4, 58.4));
    const flash = win(t, 40.6, 41.2, 41.3, 42.4) * 0.95;
    E.post(ctx, t, { fade, flash, flashCol: '#fff3d6', grain: 0.06 });
  }

  window.FILM = { duration: DUR, render };
})();
