// الفيلم ٢: الفانوس
(function () {
  const { W, H, sm, seg, win, keys, rnd, noise, glow, puff, c, mix, lerp, clamp, figure, ellipse } = E;
  const DUR = 58;
  const GY = 880; // مستوى الأرض

  let dark = null, dctx = null;

  // ----- عناصر الغابة -----
  function tree(ctx, x, y, h, col, i, t, sway) {
    const w = h * 0.07;
    ctx.fillStyle = c(col);
    ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x - w * 0.45, y - h * 0.7); ctx.lineTo(x + w * 0.45, y - h * 0.7); ctx.lineTo(x + w, y); ctx.fill();
    const s = Math.sin(t * 0.8 + i) * sway;
    for (let k = 0; k < 5; k++) {
      const cx = x + (rnd(i, k) - 0.5) * h * 0.35 + s * (1 + k * 0.3), cy = y - h * (0.62 + rnd(i, k + 9) * 0.38), r = h * (0.13 + rnd(i, k + 20) * 0.1);
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
    }
    // فرع ملتوٍ
    ctx.strokeStyle = c(col); ctx.lineWidth = w * 0.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y - h * 0.45); ctx.quadraticCurveTo(x + h * 0.15, y - h * 0.5, x + h * 0.22 + s, y - h * 0.62); ctx.stroke();
  }
  function layer(ctx, t, camX, p, n, seed, col, hMin, hMax, gy, sway, spacing) {
    const off = camX * (1 - p);
    const x0 = camX - 2400, x1 = camX + 2400;
    const i0 = Math.floor((x0 - off) / spacing), i1 = Math.ceil((x1 - off) / spacing);
    for (let i = i0; i <= i1; i++) {
      const x = off + i * spacing + (rnd(i, seed) - 0.5) * spacing * 0.7;
      const h = hMin + rnd(i, seed + 1) * (hMax - hMin);
      tree(ctx, x, gy, h, col, i + seed * 100, t, sway);
    }
  }
  function lantern(ctx, x, y, flame, t, col = '#ffb347', swing = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(swing);
    ctx.strokeStyle = '#2a1e18'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, 10); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 4, 7, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#3a2a20'; ctx.fillRect(-14, 10, 28, 7); ctx.fillRect(-12, 52, 24, 7);
    ctx.fillStyle = flame > 0.05 ? c(mix('#4a3a30', col, 0.55 * flame), 0.9) : 'rgba(60,70,90,0.5)';
    E.rrect(ctx, -11, 16, 22, 36, 5); ctx.fill();
    ctx.strokeStyle = '#2a1e18'; ctx.lineWidth = 2; ctx.strokeRect(-11, 16, 22, 36);
    if (flame > 0.02) {
      const fl = flame * (0.85 + 0.15 * noise(t * 9));
      ctx.fillStyle = '#fff4c0'; ctx.beginPath(); ctx.moveTo(-5 * fl, 44); ctx.quadraticCurveTo(-6 * fl, 34, noise(t * 7) * 2, 44 - 22 * fl); ctx.quadraticCurveTo(6 * fl, 34, 5 * fl, 44); ctx.fill();
    }
    ctx.restore();
    return [x - Math.sin(swing) * 34, y + Math.cos(swing) * 34];
  }

  // حالة اللهب
  const heroFlame = t => {
    if (t < 9) return 1;
    if (t < 18.2) { const k = seg(t, 9, 18.2); return clamp((1 - k * 0.8) * (0.75 + 0.25 * noise(t * 12)) - (Math.sin(t * 17) > 0.7 ? 0.25 * k : 0)); }
    if (t < 37) return 0;
    return E.ease.out(seg(t, 37, 37.6));
  };

  function render(ctx, t) {
    if (!dark) { dark = document.createElement('canvas'); dark.width = W; dark.height = H; dctx = dark.getContext('2d'); }
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);

    // ----- المواقع -----
    const heroX = keys(t, [[0, 3000], [9, 2200], [18.2, 1700], [41, 1700], [50, 700]], x => x);
    const heroWalking = t < 18.2 ? (t < 9 ? 1 : 1 - seg(t, 15, 18.2) * 0.6) : (t > 41 ? 1 : 0) + win(t, 38.6, 38.8, 39.4, 39.6) * 0;
    const friendX = keys(t, [[0, -1200], [24, 300], [30.2, 1560], [41, 1560], [50, 560]], x => x);
    const friendWalking = (t > 24 && t < 30.2 ? 1 : 0) + (t > 41 ? 1 : 0);
    const crouchH = sm(t, 19, 20.5) * (1 - sm(t, 38.2, 39.4));
    const crouchF = win(t, 30.8, 31.8, 38.2, 39.2) * 0.45;

    const zoom = keys(t, [[0, 1.6], [6, 1.15], [18, 1.35], [24, 1.25], [31, 1.45], [37, 1.55], [39, 1.2], [41, 1.1], [49, 0.62]]);
    const camX = keys(t, [[0, 3000], [9, 2200], [18.2, 1700], [24, 1640], [31, 1640], [41, 1630], [50, 900]], x => x) - (t > 24 && t < 31 ? 0 : 0);
    const camY = keys(t, [[0, 700], [18, 720], [37, 740], [41, 680], [49, 520]]);
    const toScreen = (x, y) => [(x - camX) * zoom + W / 2, (y - camY) * zoom + H / 2];

    ctx.save();
    E.camera(ctx, { x: camX, y: camY, zoom });
    // السماء
    ctx.fillStyle = E.vgrad(ctx, camY - 900, camY + 600, [[0, '#0a1430'], [0.7, '#1e4064'], [1, '#2e5878']]);
    ctx.fillRect(camX - 3000, camY - 1500, 6000, 3000);
    ctx.save(); ctx.translate(camX - W / 2 / zoom, camY - H / 2 / zoom); ctx.scale(1 / zoom, 1 / zoom); E.stars(ctx, t, 120, 21, 0, 600, 0.8); ctx.restore();
    glow(ctx, camX + 500, camY - 420, 300, '#9fc4ff', 0.12);
    // طبقات الأشجار
    layer(ctx, t, camX, 0.2, 0, 1, '#2a5a7a', 520, 780, GY - 40, 3, 150);
    // ضباب
    for (let k = 0; k < 3; k++) { ctx.fillStyle = `rgba(90,130,170,${0.06})`; ctx.fillRect(camX - 3000, GY - 160 - k * 70 + Math.sin(t * 0.3 + k) * 10, 6000, 60); }
    layer(ctx, t, camX, 0.5, 0, 2, '#1f4562', 600, 900, GY - 10, 5, 210);
    // الأرض والممر
    ctx.fillStyle = '#1c3330'; ctx.fillRect(camX - 3000, GY - 20, 6000, 1200);
    ctx.fillStyle = '#2a2a2a'; ctx.fillStyle = E.vgrad(ctx, GY - 20, GY + 60, [[0, '#7a6448'], [1, '#3a3026']]);
    ctx.fillRect(camX - 3000, GY - 18, 6000, 70);
    // حجارة الممر
    for (let i = Math.floor((camX - 2600) / 95); i < (camX + 2600) / 95; i++) {
      const x = i * 95 + rnd(i, 3) * 20;
      ellipse(ctx, x, GY + 12, 30, 9, '#9a8a6a');
      // تضيء خلف الصاحبين
      const lit = t > 41 ? clamp((x - friendX) / 220) * sm(t, 41, 42) : 0;
      if (lit > 0 && x < 1800) { ellipse(ctx, x, GY + 12, 30, 9, c('#ffd27a', 0.6 * lit)); glow(ctx, x, GY + 10, 70, '#ffb347', 0.35 * lit); }
    }
    // عشب
    ctx.strokeStyle = '#3f7a50'; ctx.lineWidth = 3;
    for (let i = Math.floor((camX - 2600) / 18); i < (camX + 2600) / 18; i++) {
      const x = i * 18, h = 14 + rnd(i, 8) * 22, s = Math.sin(t * 1.5 + i * 0.4) * 4 * (1 + 2 * win(t, 9, 11, 17, 19));
      ctx.beginPath(); ctx.moveTo(x, GY - 14); ctx.quadraticCurveTo(x + s * 0.5, GY - 14 - h / 2, x + s, GY - 14 - h); ctx.stroke();
    }
    // فطر وزهور مضيئة تظهر بعد عودة النور
    const bloom = sm(t, 37.5, 41);
    for (let i = 0; i < 70; i++) {
      const x = 200 + i * 37 + rnd(i, 30) * 25, y = GY - 10 + rnd(i, 31) * 30;
      const pc = ['#7ff0d0', '#ffd27a', '#c9a0ff', '#ff9fc1'][i % 4];
      const g = E.ease.back(clamp(bloom * 2 - rnd(i, 32)));
      if (g <= 0) continue;
      ctx.strokeStyle = '#2a5a44'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 22 * g); ctx.stroke();
      ellipse(ctx, x, y - 22 * g, 8 * g, 6 * g, pc);
    }
    // الأشجار القريبة (خلف الشخصيات)
    layer(ctx, t, camX, 0.85, 0, 3, '#14304a', 700, 1000, GY + 20, 8, 380);

    // ----- الشخصيات -----
    const heroFace = keys(t, [[0, -1], [12, -1], [13, 0.4], [14, -0.8], [15.5, 0.5], [16.5, -1], [24, -1], [26, -1], [30, -0.6], [38, -0.5], [41, -1]]);
    let heroMood = 'neutral';
    if (t > 11) heroMood = 'worry'; if (t > 15) heroMood = 'scared'; if (t > 18.6) heroMood = 'sad';
    if (t > 27) heroMood = 'o'; if (t > 31.5) heroMood = 'worry'; if (t > 37.2) heroMood = 'happy';
    const shiver = t > 14 && t < 27 ? Math.sin(t * 40) * 0.015 * (t < 19 ? 1 : 0.6) : 0;
    const heroLook = t > 19 && t < 27 ? 4 : 0;
    const swingH = Math.sin(t * 7 * 0.5) * 0.15 * heroWalking + noise(t * 2) * 0.1 * win(t, 9, 10, 17, 18);
    const hero = figure(ctx, {
      x: heroX, y: GY, s: 1.05, walk: t * 6.5, walking: t < 18.2 ? heroWalking : (t > 41 ? 1 : 0), face: heroFace, robe: '#e9e2d0', robe2: '#bdb4a0', skin: '#f1c7a1', hair: '#2b1d18', scarf: '#d9534f', scarfWave: Math.sin(t * 4) * 3 + win(t, 9, 11, 17, 19) * 10,
      mood: heroMood, lookY: heroLook, crouch: crouchH, lean: shiver - crouchH * 0.08, armL: t < 9 ? 0.5 : lerp(0.5, 1.1, crouchH), armR: lerp(0.15, 0.9, win(t, 10, 11, 18, 19)) + crouchH * 0.6,
      blink: [4, 7.5, 22, 34].some(b => t > b && t < b + 0.15) ? 1 : 0,
    });
    const hL = hero.handL;
    const hLantern = lantern(ctx, hL[0], hL[1] - 6, heroFlame(t), t, '#ffb347', swingH);
    // دخان انطفاء
    if (t > 18.2 && t < 21) for (let i = 0; i < 6; i++) { const a = t - 18.2 - i * 0.12; if (a > 0) puff(ctx, hLantern[0] + noise(i + a) * 20, hLantern[1] - 30 - a * 70, 14 + a * 22, '#8892a0', 0.35 * (1 - a / 2.8)); }

    const friendFace = t < 30.2 ? 1 : (t < 41 ? 0.9 : -1);
    const friend = figure(ctx, {
      x: friendX, y: GY, s: 1.08, walk: t * 6.5 + 1.5, walking: clamp(friendWalking), face: friendFace, robe: '#3e8f86', robe2: '#2a635d', skin: '#d9a07a', hair: '#1e1410', scarf: '#f2c14e', scarfWave: Math.sin(t * 4 + 1) * 3,
      mood: t > 30 ? 'smile' : 'neutral', crouch: crouchF, armR: t > 33 && t < 38.5 ? lerp(0.3, 1.25, sm(t, 33, 34.2)) : (t > 41 ? 0.5 : 0.35), armL: 0.2,
      blink: [26, 32.5].some(b => t > b && t < b + 0.15) ? 1 : 0,
    });
    const fH = friend.handR;
    const fLantern = lantern(ctx, fH[0], fH[1] - 6, 1, t, '#ffcf6a', Math.sin(t * 3.2) * 0.12 * (friendWalking ? 1 : 0.3));
    // الصاحبان يمسكان يدي بعض أثناء المشي
    if (t > 41) { ctx.strokeStyle = '#2a635d'; ctx.lineWidth = 0; }

    // قوس الشرارة من فانوس الصاحب إلى فانوس البطل
    if (t > 35 && t < 37.4) {
      const p = E.ease.inOut(seg(t, 35.2, 37));
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 18; k++) {
        const u = p - k * 0.025; if (u < 0) continue;
        const x = lerp(fLantern[0], hLantern[0], u), y = lerp(fLantern[1], hLantern[1], u) - Math.sin(u * Math.PI) * 120;
        glow(ctx, x, y, 22 - k, '#ffe6a0', 0.9 - k * 0.05);
      }
      ctx.restore();
    }
    ctx.restore();

    // ----- قناع الظلام -----
    const ambient = 0.88 - 0.05 * sm(t, 0, 3) + 0.06 * sm(t, 15, 19) - 0.32 * sm(t, 37.2, 42) - 0.2 * sm(t, 42, 49);
    dctx.globalCompositeOperation = 'source-over';
    dctx.clearRect(0, 0, W, H);
    dctx.fillStyle = `rgba(3,6,16,${clamp(ambient)})`; dctx.fillRect(0, 0, W, H);
    dctx.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r, a = 1) => {
      if (r <= 1) return;
      const [sx, sy] = toScreen(x, y), rr = r * zoom;
      const g = dctx.createRadialGradient(sx, sy, 0, sx, sy, rr);
      g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.45, `rgba(0,0,0,${a * 0.75})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = g; dctx.fillRect(sx - rr, sy - rr, rr * 2, rr * 2);
    };
    const hf = heroFlame(t);
    const flick = 1 + 0.05 * noise(t * 10);
    const ignite = win(t, 37, 37.3, 37.6, 39);
    hole(hLantern[0], hLantern[1], (330 * hf + ignite * 500) * flick);
    hole(hLantern[0], hLantern[1] - 60, 70 * (1 - hf) * (t > 18 ? 0.6 : 0), 0.5); // ضوء خافت جداً حتى لا يختفي البطل
    hole(fLantern[0], fLantern[1], 360 * flick);
    // أضواء أخرى بعيدة في النهاية
    const others = [[-200, 0.5], [-650, 0.62], [2500, 0.5], [2950, 0.7]];
    const oA = sm(t, 43, 46);
    if (oA > 0) others.forEach(([x0, sp], i) => { const x = x0 - (t - 43) * 100 * sp; hole(x, GY - 60, 240 * oA); });
    ctx.drawImage(dark, 0, 0);

    // ----- عيون في الظلام -----
    const eyesA = sm(t, 11.5, 14) * (1 - sm(t, 27.5, 30.5));
    if (eyesA > 0) {
      ctx.save(); E.camera(ctx, { x: camX, y: camY, zoom });
      for (let i = 0; i < 14; i++) {
        const appear = 11.5 + rnd(i, 40) * 9;
        const a0 = sm(t, appear, appear + 1.2);
        const close = sm(t, 19, 26) * 0.35;
        const ex = lerp(heroX + (rnd(i, 41) - 0.5) * 1700, heroX, close), ey = lerp(GY - 80 - rnd(i, 42) * 420, GY - 180, close * 0.5);
        const blink = Math.sin(t * (1 + rnd(i, 43)) * 2 + i * 5) > 0.93 ? 0.1 : 1;
        // تختفي إذا لامسها نور الصاحب
        const dF = Math.hypot(ex - fLantern[0], ey - fLantern[1]);
        const lightKill = 1 - clamp(1 - (dF - 150) / 300);
        const a = eyesA * a0 * lightKill;
        if (a <= 0.01) continue;
        const sz = 0.7 + rnd(i, 44) * 0.6;
        [-1, 1].forEach(d => { E.ellipse(ctx, ex + d * 14 * sz, ey, 7 * sz, 4.5 * sz * blink, c('#ffe35a', a)); glow(ctx, ex + d * 14 * sz, ey, 26 * sz, '#ffd23a', 0.5 * a); });
      }
      ctx.restore();
    }

    // ----- توهج الأضواء (فوق الظلام) -----
    ctx.save(); E.camera(ctx, { x: camX, y: camY, zoom });
    if (hf > 0) { glow(ctx, hLantern[0], hLantern[1] + 28, 60 * hf, '#fff1b0', 0.9); glow(ctx, hLantern[0], hLantern[1] + 28, 260 * hf * flick, '#ff9a3a', 0.35); }
    glow(ctx, fLantern[0], fLantern[1] + 28, 60, '#fff1b0', 0.9); glow(ctx, fLantern[0], fLantern[1] + 28, 280 * flick, '#ffb347', 0.35);
    if (ignite > 0) { glow(ctx, hLantern[0], hLantern[1] + 28, 600 * ignite, '#ffd27a', 0.3 * ignite); }
    // حلقات الاشتعال
    if (t > 37 && t < 39.5) for (let k = 0; k < 3; k++) {
      const a = seg(t, 37 + k * 0.18, 38.8 + k * 0.18); if (a <= 0 || a >= 1) continue;
      ctx.strokeStyle = `rgba(255,220,140,${(1 - a) * 0.8})`; ctx.lineWidth = 6 * (1 - a) + 1;
      ctx.beginPath(); ctx.arc(hLantern[0], hLantern[1] + 28, 30 + a * 520, 0, 7); ctx.stroke();
    }
    if (oA > 0) others.forEach(([x0, sp], i) => {
      const x = x0 - (t - 43) * 100 * sp;
      figure(ctx, { x, y: GY, s: 0.9, sil: 'rgba(10,14,24,0.85)', walk: t * 6 + i, walking: 1, alpha: oA, ground: false });
      figure(ctx, { x: x + 90, y: GY, s: 0.95, sil: 'rgba(10,14,24,0.85)', walk: t * 6 + i + 1, walking: 1, alpha: oA, ground: false });
      glow(ctx, x + 40, GY - 90, 50, '#fff1b0', 0.8 * oA); glow(ctx, x + 40, GY - 90, 200, '#ffb347', 0.35 * oA);
    });
    // يراعات
    const ff = sm(t, 38, 42);
    if (ff > 0) E.motes(ctx, t, 90, 55, '#d9ff8a', { x0: camX - 1600, x1: camX + 1600, y0: GY - 700, y1: GY + 30, a: 0.9 * ff, size: 3, speed: 18 });
    // أوراق تطير مع الريح
    const wind = win(t, 8.5, 10, 17, 19);
    if (wind > 0) for (let i = 0; i < 40; i++) {
      const life = 2.2, ph = (t + rnd(i, 70) * life) % life;
      const x = camX + 1100 - ph * 1100 - rnd(i, 71) * 400, y = camY - 300 + rnd(i, 72) * 600 + Math.sin(ph * 6 + i) * 40;
      ctx.save(); ctx.translate(x, y); ctx.rotate(ph * 8 + i); ctx.globalAlpha = wind * 0.8;
      ellipse(ctx, 0, 0, 10, 4, i % 2 ? '#3a5a3a' : '#5a4a2a'); ctx.restore();
    }
    ctx.restore();

    // ريح باردة: خطوط
    if (wind > 0) {
      ctx.save(); ctx.strokeStyle = `rgba(160,200,255,${0.12 * wind})`; ctx.lineWidth = 2;
      for (let i = 0; i < 18; i++) { const ph = (t * 1.6 + rnd(i, 80)) % 1; const y = 200 + rnd(i, 81) * 700; const x = W + 200 - ph * (W + 600); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 120, y - 10, x - 260, y + 5); ctx.stroke(); }
      ctx.restore();
    }

    E.titleCard(ctx, t, '٢', 'الفانوس', 1.2, 6, '#ffe2a6', 260);
    E.ending(ctx, t, {
      t0: 50, end: 56.8,
      lines: ['﴿وَاصْبِرْ نَفْسَكَ مَعَ الَّذِينَ يَدْعُونَ رَبَّهُم', 'بِالْغَدَاةِ وَالْعَشِيِّ يُرِيدُونَ وَجْهَهُ﴾'],
      source: '[الكهف: ٢٨]', tagline: 'الصاحب الصالح… يُعيد إليك نورك',
      bg: ['#04070f', '#0c1a2a'],
    });
    const fade = sm(t, 0.3, 2.5) * (1 - sm(t, 57, 58));
    E.post(ctx, t, { fade, grain: 0.06, vignette: 0.6, flash: ignite * 0.1, flashCol: '#ffe6b0' });
  }

  window.FILM = { duration: DUR, render };
})();
