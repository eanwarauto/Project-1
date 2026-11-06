// الفيلم ٣: الحبل
(function () {
  const { W, H, sm, seg, win, keys, rnd, noise, glow, puff, c, mix, lerp, clamp, figure, ellipse } = E;
  const DUR = 58;
  const surf = x => 760 + (x - 1000) * 0.25 + Math.sin(x * 0.01) * 6;
  const XC = 770; // موضع الشق الجليدي
  const CL = [ // المتسلقون: لون السترة، الوشاح، القبعة
    { robe: '#c0392b', scarf: '#f4d03f', hat: '#2c3e50', skin: '#f1c7a1' },
    { robe: '#2e86c1', scarf: '#f5b041', hat: '#922b21', skin: '#d9a07a' },
    { robe: '#f39c12', scarf: '#2e86c1', hat: '#1e8449', skin: '#f1c7a1' }, // البطل
    { robe: '#27ae60', scarf: '#ec7063', hat: '#5b2c6f', skin: '#c68e6a' },
  ];
  const HEAVES = [24.4, 25.8, 27.2, 28.6, 30.0];

  function snow(ctx, t, n, seed, wind = 1, a = 0.8, size = 3) {
    ctx.save();
    for (let i = 0; i < n; i++) {
      const life = 3 + rnd(i, seed) * 3, ph = (t + rnd(i, seed + 1) * life) % life, k = ph / life;
      const x = ((rnd(i, seed + 2) * (W + 800) + 400) - ph * 380 * wind - 0) % (W + 400);
      const y = (rnd(i, seed + 3) * H + ph * 160) % H;
      ctx.globalAlpha = a * Math.sin(k * Math.PI);
      ellipse(ctx, x < -200 ? x + W + 400 : x, y, size * (0.5 + rnd(i, seed + 4)), size * (0.5 + rnd(i, seed + 4)), '#ffffff');
    }
    ctx.restore();
  }
  function ranges(ctx, t, cols, base, amp, seed) {
    cols.forEach((col, L) => {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(-400, 1300);
      for (let x = -400; x <= 2400; x += 40) {
        const y = base[L] - Math.abs(noise(x * 0.004 + L * 10 + seed)) * amp[L] - Math.abs(noise(x * 0.013 + L * 5)) * amp[L] * 0.3;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(2400, 1300); ctx.fill();
    });
  }
  function rope(ctx, pts, sag, col = '#e8d8b0', w = 4) {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag, x1, y1);
    }
    ctx.stroke();
  }
  const climber = (ctx, i, o) => {
    const k = CL[i];
    const face = o.face ?? -1;
    const pack = () => { ctx.fillStyle = c(mix(k.robe, '#000', 0.45)); E.rrect(ctx, o.x - face * 26 * o.s - 20 * o.s, o.y - 128 * o.s + (o.crouch ?? 0) * 30 * o.s, 40 * o.s, 62 * o.s, 12 * o.s); ctx.fill(); };
    if (!o.sil) pack();
    const f = figure(ctx, { ...o, robe: k.robe, scarf: k.scarf, hair: k.hat, skin: k.skin, face, eyeWhite: false });
    if (!o.sil) { ellipse(ctx, f.head[0] - face * 4 * o.s, f.head[1] - 40 * o.s, 10 * o.s, 10 * o.s, '#f5f5f5'); }
    return f;
  };

  // ----- اللقطة الواسعة الليلية -----
  function wideNight(ctx, t) {
    const z = lerp(1, 1.6, E.ease.inOut(seg(t, 0, 7.4)));
    ctx.save(); E.camera(ctx, { x: lerp(960, 1180, seg(t, 0, 7.4)), y: lerp(540, 470, seg(t, 0, 7.4)), zoom: z });
    ctx.fillStyle = E.vgrad(ctx, -200, 1100, [[0, '#030716'], [0.6, '#122a4f'], [1, '#2b4d7a']]); ctx.fillRect(-500, -500, W + 1000, H + 1000);
    E.stars(ctx, t, 200, 5, -100, 700, 1);
    // درب التبانة
    for (let i = 0; i < 30; i++) puff(ctx, 200 + i * 60, 80 + i * 18 + noise(i) * 40, 120, '#5a6aa8', 0.05);
    ranges(ctx, t, ['#1b3358'], [900], [380], 3);
    // القمة الكبيرة
    ctx.fillStyle = '#d8e4f2';
    ctx.beginPath(); ctx.moveTo(300, 1200); ctx.lineTo(1150, 260); ctx.lineTo(1250, 330); ctx.lineTo(1320, 300); ctx.lineTo(2100, 1200); ctx.fill();
    ctx.fillStyle = '#7f97b8';
    ctx.beginPath(); ctx.moveTo(1150, 260); ctx.lineTo(1250, 330); ctx.lineTo(1320, 300); ctx.lineTo(2100, 1200); ctx.lineTo(1300, 1200); ctx.lineTo(1260, 700); ctx.lineTo(1200, 520); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(93,117,150,0.6)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(1150 - k * 60, 300 + k * 90); ctx.quadraticCurveTo(1170 - k * 50, 420 + k * 100, 1120 - k * 70, 560 + k * 110); ctx.stroke(); }
    // غبار ثلجي يتطاير من القمة
    for (let i = 0; i < 30; i++) { const ph = (t * 0.4 + rnd(i, 9)) % 1; puff(ctx, 1250 + ph * 700, 300 - ph * 80 + noise(i + t) * 30, 30 + ph * 90, '#e8f0ff', 0.25 * (1 - ph)); }
    ranges(ctx, t, ['#0d1b33'], [1180], [160], 7);
    // المتسلقون الصغار بمصابيح الرأس على الحافة
    const pts = [];
    for (let i = 0; i < 4; i++) {
      const u = 0.42 + i * 0.022 - t * 0.002;
      const x = lerp(1150, 2100, u * 0.9) - 120, y = lerp(260, 1200, u * 0.9) - 40;
      pts.push([x, y]);
      figure(ctx, { x, y, s: 0.09, sil: '#0a1426', ground: false, walk: t * 5 + i, walking: 1 });
      glow(ctx, x - 2, y - 14, 14, '#fff3c0', 0.9);
      glow(ctx, x - 2, y - 14, 50, '#ffd27a', 0.3);
    }
    rope(ctx, pts.map(p => [p[0], p[1] - 6]), 3, 'rgba(255,240,200,0.5)', 1.2);
    ctx.restore();
    snow(ctx, t, 90, 1, 1.2, 0.7, 2.5);
  }

  // ----- لقطة الفجر على القمة -----
  function summit(ctx, t) {
    const k = seg(t, 36.5, 48.5);
    const z = lerp(1.6, 1.12, E.ease.inOut(seg(t, 37, 46)));
    ctx.save(); E.camera(ctx, { x: lerp(920, 960, k), y: lerp(560, 520, k), zoom: z });
    const sunY = lerp(820, 610, E.ease.out(seg(t, 36.5, 45)));
    ctx.fillStyle = E.vgrad(ctx, -300, 900, [[0, '#1a2a5a'], [0.45, '#6a4a8a'], [0.75, '#f08a6a'], [1, '#ffd08a']]); ctx.fillRect(-600, -500, W + 1200, H + 1200);
    E.stars(ctx, t, 60, 8, -200, 200, 1 - k);
    // الشمس والأشعة
    ctx.save(); ctx.translate(1180, sunY); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) {
      ctx.rotate(Math.PI * 2 / 14);
      const a = 0.08 + 0.05 * Math.sin(t * 0.8 + i * 2);
      const g = ctx.createLinearGradient(0, 0, 1400, 0); g.addColorStop(0, `rgba(255,220,150,${a})`); g.addColorStop(1, 'rgba(255,220,150,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1400, -70); ctx.lineTo(1400, 70); ctx.fill();
    }
    ctx.restore();
    glow(ctx, 1180, sunY, 520, '#ffb070', 0.6); glow(ctx, 1180, sunY, 160, '#fff1c8', 1);
    ellipse(ctx, 1180, sunY, 85, 85, '#fff6dc');
    // بحر الغيوم
    for (let L = 0; L < 3; L++) {
      for (let i = 0; i < 26; i++) {
        const x = -400 + i * 120 + Math.sin(t * 0.2 + i + L) * 20 + ((t * (8 + L * 6)) % 120), y = 760 + L * 60 + rnd(i, L) * 30;
        ellipse(ctx, x, y, 110, 46, c(mix(['#f6b38a', '#e0907a', '#b8708a'][L], '#ffffff', 0.15)));
      }
    }
    // جبل القمة
    ctx.fillStyle = '#e9eef7';
    ctx.beginPath(); ctx.moveTo(-500, 1300); ctx.lineTo(-100, 900); ctx.lineTo(560, 640); ctx.lineTo(900, 545); ctx.lineTo(1080, 620); ctx.lineTo(1500, 800); ctx.lineTo(2000, 1300); ctx.fill();
    ctx.fillStyle = '#b5a2c6';
    ctx.beginPath(); ctx.moveTo(900, 545); ctx.lineTo(1080, 620); ctx.lineTo(1500, 800); ctx.lineTo(2000, 1300); ctx.lineTo(950, 1300); ctx.lineTo(940, 800); ctx.closePath(); ctx.fill();
    glow(ctx, 1000, 600, 500, '#ffb070', 0.25);
    // الأربعة على القمة
    const raise = E.ease.back(seg(t, 41.5, 42.6));
    const ridge = x => x < 900 ? 545 + (900 - x) * 0.28 : 545 + (x - 900) * 0.43;
    const xs = [760, 845, 940, 1030];
    const waists = [];
    xs.forEach((x, i) => {
      const y = ridge(x) + 4;
      const f = climber(ctx, i, { x, y, s: 0.62, sil: '#2a1a3a', face: 0.6, armL: lerp(0.2, 2.75, raise), armR: lerp(0.2, 2.75, raise), bob: -Math.abs(Math.sin(t * 5 + i)) * 4 * raise, ground: false });
      waists.push([x, y - 60 * 0.62]);
    });
    // حبل ذهبي يلمع
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    rope(ctx, waists, 10, `rgba(255,214,130,${0.5 + 0.4 * sm(t, 42, 44)})`, 4);
    const sh = (t * 0.35) % 1;
    const idx = Math.min(2, Math.floor(sh * 3)), u = sh * 3 - idx;
    glow(ctx, lerp(waists[idx][0], waists[idx + 1][0], u), lerp(waists[idx][1], waists[idx + 1][1], u) + Math.sin(u * Math.PI) * 6, 40, '#fff1c8', 0.9 * sm(t, 42, 44));
    ctx.restore();
    // طيور
    for (let i = 0; i < 5; i++) {
      const bx = 1500 - (t - 38) * (60 + i * 8) + i * 70, by = 330 + i * 26 + Math.sin(t * 2 + i) * 8, fl = Math.sin(t * 9 + i) * 8;
      ctx.strokeStyle = '#3a2a4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx - 14, by - fl); ctx.quadraticCurveTo(bx - 6, by - 4, bx, by); ctx.quadraticCurveTo(bx + 6, by - 4, bx + 14, by - fl); ctx.stroke();
    }
    ctx.restore();
    E.motes(ctx, t, 40, 66, '#ffe0a0', { a: 0.5, size: 2.5, speed: 15 });
  }

  // ----- المنحدر والشق الجليدي -----
  function slope(ctx, t, collapse) {
    // سماء ما قبل الفجر
    ctx.fillStyle = E.vgrad(ctx, -400, 1300, [[0, '#0a1838'], [0.6, '#2f5a8a'], [1, '#8fb3d6']]); ctx.fillRect(-1000, -800, 4000, 3200);
    E.stars(ctx, t, 60, 4, -300, 300, 0.6);
    ctx.save(); ctx.globalAlpha = 0.9; ranges(ctx, t, ['#4a6a94', '#36557d'], [620, 760], [300, 220], 12); ctx.restore();
    // جسم الجبل
    ctx.fillStyle = E.vgrad(ctx, 500, 1800, [[0, '#f4f8ff'], [0.08, '#cfdcee'], [0.35, '#8ea6c6'], [1, '#2a3a5a']]);
    ctx.beginPath(); ctx.moveTo(-800, 3000);
    for (let x = -800; x <= 2800; x += 20) ctx.lineTo(x, surf(x));
    ctx.lineTo(2800, 3000); ctx.fill();
    // صخور بارزة
    for (let i = 0; i < 16; i++) {
      const x = -600 + i * 220 + rnd(i, 3) * 80, y = surf(x) + 120 + rnd(i, 4) * 300;
      if (Math.abs(x - XC) < 160) continue;
      ellipse(ctx, x, y, 90 + rnd(i, 5) * 60, 14, 'rgba(255,255,255,0.18)');
      ellipse(ctx, x + 20, y + 16, 70, 8, 'rgba(70,95,130,0.12)');
    }
    // الشق: مقطع عرضي
    const y0 = surf(XC);
    ctx.save();
    ctx.globalAlpha = clamp(collapse * 4);
    ctx.beginPath();
    ctx.moveTo(XC - 78, surf(XC - 78));
    for (let d = 0; d <= 1200; d += 60) ctx.lineTo(XC - 78 + d * 0.035 + noise(d * 0.02) * 14, y0 + d);
    for (let d = 1200; d >= 0; d -= 60) ctx.lineTo(XC + 78 - d * 0.035 + noise(d * 0.02 + 5) * 14, y0 + d);
    ctx.lineTo(XC + 78, surf(XC + 78)); ctx.closePath();
    ctx.fillStyle = E.vgrad(ctx, y0, y0 + 1200, [[0, '#7fc0e8'], [0.25, '#2a6a9e'], [0.6, '#0b2442'], [1, '#02060e']]);
    ctx.fill();
    ctx.clip();
    // خطوط الجليد
    ctx.strokeStyle = 'rgba(200,240,255,0.25)'; ctx.lineWidth = 2;
    for (let k = 0; k < 14; k++) { ctx.beginPath(); ctx.moveTo(XC - 90, y0 + k * 70); ctx.lineTo(XC + 90, y0 + k * 70 + 30); ctx.stroke(); }
    ctx.restore();
    // الجسر الثلجي فوق الشق قبل انهياره
    if (collapse < 1) {
      for (let k = 0; k < 6; k++) {
        const x = XC - 78 + k * 26, d = rnd(k, 90) * 0.3;
        const fall = Math.max(0, collapse * 1.4 - d);
        const yy = surf(x) + fall * fall * 900;
        ctx.save(); ctx.translate(x + 13, yy + 8); ctx.rotate(fall * (rnd(k, 91) - 0.5) * 3);
        ctx.globalAlpha = 1 - clamp(fall * 1.2);
        ctx.fillStyle = '#e4ecf7'; ctx.fillRect(-13, -10, 26, 22);
        ctx.restore();
      }
    }
    // شقوق تظهر قبل الانهيار
    const crack = seg(collapse === 0 ? 0 : 1, 0, 1);
    return y0;
  }
  function cracks(ctx, t) {
    const p = sm(t, 15.6, 16.9);
    if (p <= 0 || t > 17.2) return;
    ctx.strokeStyle = 'rgba(40,80,130,0.9)'; ctx.lineWidth = 2.5;
    for (let k = 0; k < 7; k++) {
      ctx.beginPath(); let x = XC + (rnd(k, 1) - 0.5) * 30, y = surf(x) + 2; ctx.moveTo(x, y);
      for (let s = 0; s < 5 * p; s++) { x += (rnd(k, s + 2) - 0.5) * 50; y = surf(x) + 2 + rnd(k, s + 3) * 6; ctx.lineTo(x, y); }
      ctx.stroke();
    }
  }

  function render(ctx, t) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (t < 7) wideNight(ctx, t);
    else if (t < 36.5) {
      // ----- حالة المشهد -----
      const base = keys(t, [[7, 520], [16.2, 250]], x => x);
      const fallP = E.ease.in(seg(t, 17.0, 17.75));
      const catchJ = win(t, 17.7, 17.8, 17.9, 18.6);
      const collapse = seg(t, 16.95, 18.2);
      const heave = (tt) => { let v = 0; HEAVES.forEach(h => { v += E.ease.inOut(seg(tt, h, h + 0.6)); }); return v; };
      const hv = heave(t);
      const pulse = HEAVES.reduce((m, h) => Math.max(m, win(t, h - 0.1, h + 0.15, h + 0.4, h + 0.75)), 0);
      const y0 = surf(XC);
      const hangY = y0 + 330 - hv * 64; // عمق التعلّق ثم الصعود
      const out = sm(t, 30.6, 31.8); // الخروج من الشق
      // البطل
      let hx = base + 520, hy = surf(hx);
      if (t > 17) {
        const sw = Math.sin((t - 17.8) * 3.2) * 26 * Math.exp(-(t - 17.8) * 0.45) * (t > 17.8 ? 1 : 0);
        hx = lerp(base + 520, XC, fallP) + sw; hy = lerp(surf(base + 520), hangY, fallP);
        if (t > 30.6) { hx = lerp(XC + sw, XC - 130, out); hy = lerp(hangY, surf(XC - 130), E.ease.out(out)); }
      }
      // الأصدقاء
      const brace = sm(t, 17.6, 18.4);
      const slideBack = E.ease.out(seg(t, 17.7, 18.2)) * 24;
      const xL = t < 17 ? base : base - 0 + slideBack * 0.3;
      const x2 = t < 17 ? base + 260 : lerp(base + 260, XC - 120, 0) + slideBack;
      const x4 = t < 17 ? base + 780 : base + 780 - slideBack;
      const celebrate = sm(t, 32, 33);
      const gather = E.ease.inOut(seg(t, 32.5, 34.5));

      const cam = keys(t, [
        [7, [base + 400, surf(base + 400) - 160, 1.25]], [16.2, [400 + 270, surf(670) - 160, 1.3]], [17, [770, surf(770) - 120, 1.3]],
        [18.2, [780, y0 + 120, 1.0]], [20.5, [780, y0 + 470, 1.3]], [22.4, [760, y0 + 470, 1.3]], [23.6, [720, y0 + 60, 0.92]],
        [29.5, [720, y0 + 40, 0.95]], [31, [700, y0 - 100, 1.35]], [34, [640, y0 - 110, 1.2]], [36.5, [600, y0 - 140, 1.3]],
      ]);
      ctx.save();
      E.camera(ctx, { x: cam[0], y: cam[1], zoom: cam[2], shake: catchJ * 18 + pulse * 3, t });
      slope(ctx, t, collapse);
      cracks(ctx, t);
      // كتل جليد تسقط في الهاوية
      if (t > 17) for (let i = 0; i < 12; i++) {
        const a = t - 17 - rnd(i, 30) * 0.6; if (a < 0 || a > 3.5) continue;
        const x = XC + (rnd(i, 31) - 0.5) * 120, y = y0 + a * a * 260;
        ctx.save(); ctx.translate(x, y); ctx.rotate(a * (rnd(i, 32) - 0.5) * 6); ctx.globalAlpha = 1 - a / 3.5;
        ctx.fillStyle = '#dbe9f8'; E.rrect(ctx, -10, -8, 20 + rnd(i, 33) * 14, 16, 4); ctx.fill(); ctx.restore();
      }

      // ----- الشخصيات -----
      const walking = t < 16.2 ? 1 : 0;
      const step = t * 5.5;
      const pos = [
        [t < 33 ? xL : lerp(xL, XC - 330, gather), 0],
        [t < 33 ? x2 : lerp(x2, XC - 230, gather), 1],
        [hx, 2],
        [t < 33 ? x4 : lerp(x4, XC - 30, gather), 3],
      ];
      const f = [];
      // الحبل خلف الشخصيات
      const waist = (p) => [p.x, p.y - 62 * p.s];
      const P = pos.map(([x, i]) => ({ x, i, y: i === 2 ? hy : surf(x), s: 0.95 }));
      const W0 = P.map(waist);
      ctx.save();
      if (t < 17) rope(ctx, W0, 28 + Math.sin(t * 3) * 4);
      else if (t < 31.4) {
        const lipL = [XC - 78, surf(XC - 78)], lipR = [XC + 78, surf(XC + 78)];
        const tight = 1 - win(t, 17.0, 17.3, 17.6, 17.75);
        rope(ctx, [W0[0], W0[1]], 6 * (1 - tight) + 2);
        rope(ctx, [W0[1], lipL, W0[2]], 3 * (1 - tight));
        rope(ctx, [W0[2], lipR, W0[3]], 3 * (1 - tight));
      } else rope(ctx, W0, 22);
      ctx.restore();
      // ظل يد ممدودة ولمعة لحظة الإمساك
      const reach = sm(t, 29.8, 30.6) * (1 - sm(t, 32, 32.8));
      P.forEach((p, k) => {
        const i = p.i;
        let o = { x: p.x, y: p.y, s: p.s, walk: step + i * 1.3, walking, lean: -0.08 * walking };
        if (i === 2) {
          // البطل
          let mood = 'neutral';
          if (t > 15.8) mood = 'scared'; if (t > 19) mood = 'worry'; if (t > 21) mood = 'scared'; if (t > 22.4) mood = 'o'; if (t > 24.4) mood = 'worry'; if (t > 31.6) mood = 'happy';
          const lookY = t > 18.8 && t < 22.2 ? 5 : (t > 22.4 && t < 31 ? -5 : 0);
          o = { ...o, mood, lookY, eyeWhite: false, face: t > 17 && t < 31 ? 0 : -1,
            armL: t > 17 && t < 31.6 ? lerp(0.6, 2.9, sm(t, 17.4, 17.9)) + Math.sin(t * 4) * 0.05 : (t > 33 ? 0.2 + celebrate * 2.4 * Math.abs(Math.sin(t * 3)) : 0.2),
            armR: t > 17 && t < 31.6 ? lerp(0.6, 2.7, sm(t, 17.4, 17.9)) : (t > 33 ? 0.2 + celebrate * 2.4 * Math.abs(Math.sin(t * 3 + 1)) : 0.2),
            lean: t > 17 && t < 30.6 ? Math.sin((t - 17.8) * 3.2) * 0.15 * Math.exp(-(t - 17.8) * 0.45) * (t > 17.8 ? 1 : 0) : (t > 31 ? -0.25 * win(t, 31, 31.4, 32, 32.8) : 0),
            walking: 0, ground: t < 17 || t > 31.6 };
        } else {
          let mood = t > 17.6 ? (t > 24 ? 'angry' : 'scared') : 'neutral';
          if (t > 31.5) mood = 'happy';
          const leanBack = (i === 3 ? 1 : -1) * (0.28 * brace + 0.12 * pulse) * (1 - sm(t, 31, 32));
          o = { ...o, mood, crouch: brace * 0.35 * (1 - sm(t, 31, 32)), lean: t < 17 ? o.lean : leanBack,
            face: i === 3 ? (t > 17.6 && t < 33 ? -1 : -1) : (t > 17.6 && t < 33 ? 1 : (t > 33 ? 0.4 : -1)),
            armL: t > 17.6 && t < 31.5 ? 1.3 : (t > 33 ? 0.2 + celebrate * 2.4 * Math.abs(Math.sin(t * 3 + i)) : 0.2),
            armR: t > 17.6 && t < 31.5 ? 1.3 : (t > 33 ? 0.2 + celebrate * 2.4 * Math.abs(Math.sin(t * 3 + i + 2)) : 0.2),
            bob: t > 33 ? -Math.abs(Math.sin(t * 6 + i)) * 10 * celebrate : 0,
          };
          if (i === 1 && reach > 0) { o.armR = lerp(o.armR, 2.0, reach); o.armL = lerp(o.armL, 2.0, reach); o.lean = lerp(o.lean, 0.35, reach); }
        }
        const fig = climber(ctx, i, o);
        f[i] = fig;
        // رذاذ ثلج عند الأقدام وقت الشد
        if (i !== 2 && t > 17.6 && t < 31) {
          for (let k = 0; k < 6; k++) { const a = ((t * 2 + rnd(k, i)) % 1); puff(ctx, p.x + (i === 3 ? 1 : -1) * (-20 - a * 40), p.y - a * 30, 10 + a * 16, '#ffffff', 0.5 * (1 - a) * (0.4 + pulse)); }
        }
      });
      // لمعة التقاء اليدين
      const meet = win(t, 30.2, 30.6, 31.2, 32.2);
      if (meet > 0) { const hh = f[2].handL; glow(ctx, hh[0], hh[1], 90 * meet, '#fff1c8', 0.9 * meet); E.star(ctx, hh[0], hh[1], 26 * meet, meet); }
      ctx.restore();
      // ظلمة الهاوية عند النظر للأسفل
      const abyss = win(t, 19, 20.5, 21.6, 23.2);
      if (abyss > 0) { ctx.fillStyle = `rgba(0,5,15,${0.25 * abyss})`; ctx.fillRect(0, 0, W, H); }
      // دفء الفجر
      const dawn = sm(t, 31.5, 36.5);
      if (dawn > 0) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(255,170,110,${0.45 * dawn})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
      snow(ctx, t, 110, 2, 1.4, 0.75, 3);
      // خطوط الريح
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2;
      for (let i = 0; i < 14; i++) { const ph = (t * 1.2 + rnd(i, 50)) % 1; const y = 150 + rnd(i, 51) * 800, x = W + 300 - ph * (W + 700); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 220, y + 30); ctx.stroke(); }
    } else summit(ctx, t);

    E.titleCard(ctx, t, '٣', 'الحبل', 1.0, 5.6, '#e6f2ff', 800);
    E.ending(ctx, t, {
      t0: 48.5, end: 56.6,
      lines: ['«الْمُؤْمِنُ لِلْمُؤْمِنِ كَالْبُنْيَانِ', 'يَشُدُّ بَعْضُهُ بَعْضًا»'],
      source: 'متفق عليه', tagline: 'الصاحب الصالح… يمسكك وقت السقوط',
      bg: ['#060912', '#16203a'],
    });
    const gust = win(t, 6.4, 7, 7.05, 7.9) + win(t, 35.9, 36.5, 36.55, 37.6);
    const fade = sm(t, 0, 1.5) * (1 - sm(t, 57, 58));
    E.post(ctx, t, { fade, flash: gust * 0.95 + win(t, 17.7, 17.75, 17.8, 18.1) * 0.25, flashCol: '#eef6ff', grain: 0.06 });
  }

  window.FILM = { duration: DUR, render };
})();
