// الفيلم ٤: الظل
(function () {
  const { W, H, sm, seg, win, keys, rnd, noise, glow, puff, c, mix, lerp, clamp, figure, ellipse } = E;
  const DUR = 58;
  const WT = 210, WB = 800, GY = 900; // أعلى الجدار، أسفله، مستوى الشارع
  const SOFF = 120; // إزاحة الظل على الجدار
  const SSC = 1.55; // تكبير الظل
  const POT_X = 1235;

  let layer = null, lctx = null;

  // ----- الشخصيات -----
  const heroX = t => keys(t, [[0, 2500], [7, 1900], [10, 1680], [21, 960], [22, 960], [25, 1150], [27, 1150], [33, 1150], [44, 470], [50, 470]], x => x);
  const badX = t => keys(t, [[0, 600], [7, 900], [10, 1540], [21, 820], [25, 800], [26, 800], [29, -200]], x => x);
  const goodX = t => keys(t, [[0, 3300], [27.5, 2400], [32.5, 1310], [33.5, 1300], [44, 620], [45.5, 600], [50, 600]], x => x);
  const corrupt = t => sm(t, 10.5, 19.5) * (1 - sm(t, 24.6, 26.2) * 0.85) * (1 - sm(t, 33, 37));
  const goodness = t => sm(t, 33, 39);

  // ----- الجدار -----
  function wall(ctx, t, camX, cr, gd) {
    // سماء
    const skyTop = c(mix(mix('#3a5a8a', '#3a1f3a', cr), '#4a5aa0', gd * 0.5)), skyBot = c(mix(mix('#ffb36b', '#c0443a', cr), '#ffcf7a', gd));
    ctx.fillStyle = E.vgrad(ctx, -200, WT + 60, [[0, skyTop], [1, skyBot]]); ctx.fillRect(camX - 2000, -300, 4000, WT + 400);
    // سطح المدينة خلف الجدار
    ctx.fillStyle = c(mix('#7a4a5a', '#3a1a2a', cr));
    for (let i = Math.floor((camX - 1500) / 260); i < (camX + 1500) / 260; i++) {
      const x = i * 260 + camX * 0.4 % 260, h = 60 + rnd(i, 2) * 90;
      ctx.fillRect(i * 260 + camX * 0.35, WT - h, 180, h);
      if (rnd(i, 3) > 0.6) { ctx.beginPath(); ctx.arc(i * 260 + camX * 0.35 + 90, WT - h, 50, Math.PI, 0); ctx.fill(); }
    }
    // جسم الجدار
    const base = mix(mix('#e0a46a', '#9a5a50', cr * 0.8), '#f0b870', gd * 0.3);
    ctx.fillStyle = c(base); ctx.fillRect(camX - 2000, WT, 4000, WB - WT);
    // بقع الجص
    for (let i = Math.floor((camX - 1500) / 120); i < (camX + 1500) / 120; i++) {
      for (let k = 0; k < 2; k++) {
        const x = i * 120 + rnd(i, k) * 120, y = WT + 40 + rnd(i, k + 5) * (WB - WT - 80);
        ellipse(ctx, x, y, 30 + rnd(i, k + 7) * 50, 14 + rnd(i, k + 8) * 20, c(mix(base, rnd(i, k + 9) > 0.5 ? '#ffffff' : '#7a4a3a', 0.12)));
        if (rnd(i, k + 11) > 0.85) { // طوب ظاهر
          ctx.fillStyle = c(mix(base, '#8a3a2a', 0.35));
          for (let b = 0; b < 3; b++) ctx.fillRect(x + (b % 2) * 18, y + b * 16, 34, 12);
        }
      }
    }
    // حافة الجدار العلوية
    ctx.fillStyle = c(mix(base, '#5a3a3a', 0.35)); ctx.fillRect(camX - 2000, WT - 14, 4000, 22);
    // نوافذ وأبواب
    for (let i = -3; i < 12; i++) {
      const x = i * 520 + 180;
      if (x < camX - 1400 || x > camX + 1400) continue;
      if (i % 3 === 0) { // باب خشبي
        ctx.fillStyle = c(mix('#5a3020', '#2a1a1a', cr)); ctx.beginPath(); ctx.moveTo(x, WB); ctx.lineTo(x, WB - 260); ctx.arc(x + 80, WB - 260, 80, Math.PI, 0); ctx.lineTo(x + 160, WB); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 3; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + k * 40, WB); ctx.lineTo(x + k * 40, WB - 300); ctx.stroke(); }
      } else { // نافذة مقوسة
        ctx.fillStyle = c(mix('#2a3a5a', '#1a0a1a', cr)); ctx.beginPath(); ctx.moveTo(x, 470); ctx.lineTo(x, 380); ctx.arc(x + 50, 380, 50, Math.PI, 0); ctx.lineTo(x + 100, 470); ctx.fill();
        ctx.fillStyle = c(mix('#6a4030', '#3a2020', cr)); ctx.fillRect(x - 12, 470, 124, 12);
        ctx.strokeStyle = c(mix('#6a4030', '#3a2020', cr)); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 50, 330); ctx.lineTo(x + 50, 470); ctx.moveTo(x, 410); ctx.lineTo(x + 100, 410); ctx.stroke();
      }
    }
  }
  function street(ctx, t, camX, cr) {
    ctx.fillStyle = E.vgrad(ctx, WB, 1200, [[0, c(mix('#8a5a40', '#4a2a2a', cr))], [1, c(mix('#5a3a2a', '#2a1418', cr))]]);
    ctx.fillRect(camX - 2000, WB, 4000, 600);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(camX - 2000, WB, 4000, 14);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 2;
    for (let r = 0; r < 6; r++) { const y = WB + 20 + r * r * 9 + r * 14; ctx.beginPath(); ctx.moveTo(camX - 2000, y); ctx.lineTo(camX + 2000, y); ctx.stroke();
      for (let i = Math.floor((camX - 1400) / 70); i < (camX + 1400) / 70; i++) { const x = i * 70 + (r % 2) * 35; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 20 + r * 6); ctx.stroke(); } }
  }

  // ----- الشقوق والذهب -----
  const CRACKS = Array.from({ length: 9 }, (_, i) => {
    const pts = []; let x = 700 + i * 70 + rnd(i, 1) * 50, y = 300 + rnd(i, 2) * 300;
    pts.push([x, y]);
    for (let k = 0; k < 9; k++) { x += (rnd(i, k + 3) - 0.5) * 70; y += (rnd(i, k + 20) - 0.3) * 50; pts.push([x, clamp(y, WT + 10, WB - 10)]); }
    return pts;
  });
  function cracks(ctx, t) {
    const grow = sm(t, 12, 20), heal = sm(t, 36, 41);
    if (grow <= 0) return;
    CRACKS.forEach((pts, i) => {
      const n = Math.floor(pts.length * clamp(grow * 1.6 - rnd(i, 40) * 0.6));
      if (n < 2) return;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(40,15,20,0.75)'; ctx.lineWidth = 4;
      ctx.beginPath(); pts.slice(0, n).forEach((p, k) => k ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.stroke();
      if (heal > 0) {
        const m = Math.max(2, Math.floor(n * clamp(heal * 1.5 - rnd(i, 41) * 0.5)));
        ctx.save(); ctx.strokeStyle = '#ffd25a'; ctx.lineWidth = 5; ctx.shadowColor = 'rgba(255,200,80,0.9)'; ctx.shadowBlur = 18;
        ctx.beginPath(); pts.slice(0, m).forEach((p, k) => k ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.stroke(); ctx.restore();
      }
    });
  }

  // ----- الأصيص والطيور -----
  function pot(ctx, t) {
    const fallP = seg(t, 16.9, 17.5);
    const sprout = sm(t, 38, 42);
    if (fallP <= 0) {
      ctx.strokeStyle = '#3a2a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(POT_X - 20, 470); ctx.lineTo(POT_X, 450); ctx.lineTo(POT_X + 20, 470); ctx.stroke();
      drawPot(ctx, POT_X, 470, 0, 1);
      return;
    }
    if (fallP < 1) { drawPot(ctx, POT_X + fallP * 40, 470 + fallP * fallP * (GY - 470 - 20), fallP * 2.4, 1); return; }
    // شظايا على الأرض
    for (let k = 0; k < 6; k++) {
      const a = Math.min(1, (t - 17.5) * 3), dx = (rnd(k, 5) - 0.5) * 160 * a, dy = -Math.sin(a * Math.PI) * 30 * rnd(k, 6);
      ctx.save(); ctx.translate(POT_X + 40 + dx, GY - 6 + dy); ctx.rotate(rnd(k, 7) * 6);
      ctx.fillStyle = '#b5603a'; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(10, -6); ctx.lineTo(8, 8); ctx.fill(); ctx.restore();
    }
    ellipse(ctx, POT_X + 40, GY, 46, 10, '#4a2a1a');
    // نبتة جديدة تنمو من بين الشظايا
    if (sprout > 0) {
      const h = 70 * E.ease.back(sprout);
      ctx.strokeStyle = '#3a8a4a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(POT_X + 40, GY); ctx.quadraticCurveTo(POT_X + 30, GY - h / 2, POT_X + 42, GY - h); ctx.stroke();
      ellipse(ctx, POT_X + 28, GY - h * 0.6, 14 * sprout, 6 * sprout, '#4aa05a'); ellipse(ctx, POT_X + 54, GY - h * 0.75, 14 * sprout, 6 * sprout, '#4aa05a');
      for (let k = 0; k < 5; k++) { const an = k * 1.2566; ellipse(ctx, POT_X + 42 + Math.cos(an) * 10 * sprout, GY - h + Math.sin(an) * 10 * sprout, 8 * sprout, 8 * sprout, '#ff8fb1'); }
      ellipse(ctx, POT_X + 42, GY - h, 6 * sprout, 6 * sprout, '#ffd25a');
      glow(ctx, POT_X + 42, GY - h, 80 * sprout, '#ffd27a', 0.4);
    }
  }
  function drawPot(ctx, x, y, rot, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a;
    ctx.fillStyle = '#c0703a'; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(26, 0); ctx.lineTo(18, 46); ctx.lineTo(-18, 46); ctx.fill();
    ctx.fillStyle = '#d88a4a'; ctx.fillRect(-30, -4, 60, 10);
    for (let k = 0; k < 5; k++) { ctx.strokeStyle = '#3a8a4a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo((k - 2) * 12, -30 - (k % 2) * 10); ctx.stroke(); ellipse(ctx, (k - 2) * 12, -32 - (k % 2) * 10, 9, 9, ['#ff6f8f', '#ffd25a', '#ff9f6b'][k % 3]); }
    ctx.restore();
  }
  function bird(ctx, x, y, s, flap, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ellipse(ctx, 0, 0, 18, 11, col); ellipse(ctx, -14, -8, 8, 8, col);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-4, -2); ctx.lineTo(12, -26 * flap - 2); ctx.lineTo(16, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(30, -6); ctx.lineTo(28, 6); ctx.fill();
    ctx.restore();
  }
  function pigeons(ctx, t) {
    for (let i = 0; i < 7; i++) {
      const x0 = 520 + i * 130 + rnd(i, 1) * 40;
      const flee = seg(t, 13.6 + rnd(i, 2) * 0.4, 16.5);
      const back = sm(t, 39 + i * 0.3, 41.5 + i * 0.3);
      let x = x0, y = WT - 22, flap = 0.2;
      if (flee > 0 && back <= 0) { x = x0 - flee * 900 * (0.6 + rnd(i, 3)); y = WT - 22 - flee * 700; flap = Math.abs(Math.sin(t * 25 + i)); }
      if (back > 0) { x = lerp(x0 + 800, x0, back); y = lerp(WT - 500, WT - 22, back); flap = back < 1 ? Math.abs(Math.sin(t * 22 + i)) : 0.2; }
      if (flee >= 1 && back <= 0) continue;
      bird(ctx, x, y + Math.sin(t * 3 + i) * (flap > 0.3 ? 4 : 0), 0.9, flap, i % 3 ? '#8a8aa0' : '#e8e8f0');
    }
  }

  // ----- طبقة الظلال -----
  function shadowFig(g, o, extra) {
    // ظل الأرض من القدمين إلى أسفل الجدار
    g.fillStyle = '#000';
    g.beginPath(); g.moveTo(o.x - 34, GY); g.lineTo(o.x + 34, GY); g.lineTo(o.x + SOFF + 40, WB); g.lineTo(o.x + SOFF - 40, WB); g.closePath(); g.fill();
    g.save();
    g.translate(o.x + SOFF, WB);
    g.transform(1, 0, -0.12, 1, 0, 0);
    const sy = SSC * (o.tall ?? 1);
    g.scale(SSC, sy);
    const f = figure(g, { ...o, x: 0, y: 0, s: 1, sil: '#000', ground: false });
    if (extra) extra(g, f);
    g.restore();
    // تحويل الإحداثيات لاستخدامها خارج الطبقة
    const T = (p) => { const X = p[0] * SSC, Y = p[1] * sy; return [o.x + SOFF + X - 0.12 * Y, WB + Y]; };
    return { head: T(f.head), handL: T(f.handL), handR: T(f.handR) };
  }
  const spiky = (b, t) => (g, f) => {
    if (b <= 0.02) return;
    g.fillStyle = '#000';
    // أشواك على الرأس والظهر
    const [hx, hy] = f.head;
    for (let k = 0; k < 6; k++) {
      const an = -Math.PI * 0.85 + k * 0.32, r = 38, len = (20 + 16 * Math.sin(k * 2.1 + t * 3)) * b;
      const bx = hx + Math.cos(an) * r, by = hy + Math.sin(an) * r;
      g.beginPath(); g.moveTo(bx + Math.cos(an + 1.4) * 8, by + Math.sin(an + 1.4) * 8); g.lineTo(bx + Math.cos(an) * len, by + Math.sin(an) * len); g.lineTo(bx + Math.cos(an - 1.4) * 8, by + Math.sin(an - 1.4) * 8); g.fill();
    }
    // مخالب
    [f.handL, f.handR].forEach((h, j) => {
      for (let k = 0; k < 3; k++) {
        const an = Math.PI * 0.35 + k * 0.28 + (j ? -0.6 : 0.2), len = 34 * b;
        g.beginPath(); g.moveTo(h[0] - 4, h[1]); g.lineTo(h[0] + Math.cos(an) * len * (j ? -1 : 1), h[1] + Math.sin(an) * len); g.lineTo(h[0] + 4, h[1]); g.fill();
      }
    });
    // ذيل الثوب الممزق
    for (let k = 0; k < 5; k++) { const x = -36 + k * 18; g.beginPath(); g.moveTo(x, -14); g.lineTo(x + 9, 8 + 18 * b * (0.6 + 0.4 * Math.sin(t * 6 + k))); g.lineTo(x + 18, -14); g.fill(); }
  };

  // كروم وأزهار ظلّية تنمو على الجدار
  function vines(g, t, xs) {
    const p = sm(t, 36, 46);
    if (p <= 0) return;
    g.strokeStyle = '#000'; g.fillStyle = '#000'; g.lineCap = 'round';
    xs.forEach((x0, j) => {
      for (let v = 0; v < 3; v++) {
        const dir = v === 1 ? -1 : 1, len = 520 * clamp(p * 1.4 - v * 0.15);
        if (len <= 5) continue;
        g.lineWidth = 6; g.beginPath();
        const pts = [];
        for (let s = 0; s <= len; s += 10) { const x = x0 + dir * s * (0.6 + v * 0.3), y = WB - 30 - s * (0.55 - v * 0.12) - Math.sin(s * 0.025 + v + j) * 40; pts.push([x, Math.max(WT + 20, y)]); }
        pts.forEach((q, k) => k ? g.lineTo(...q) : g.moveTo(...q)); g.stroke();
        pts.forEach((q, k) => {
          if (k % 5 !== 2) return;
          g.save(); g.translate(q[0], q[1]); g.rotate(k + v); E.ellipse(g, 12, 0, 14, 6, '#000'); g.restore();
          if (k % 15 === 7) { for (let m = 0; m < 5; m++) { const an = m * 1.2566; E.ellipse(g, q[0] + Math.cos(an) * 11, q[1] + Math.sin(an) * 11, 8, 8, '#000'); } }
        });
      }
    });
  }
  function shadowBirds(g, t) {
    [38.2, 40.2, 42.2, 44.2].forEach((t0, i) => {
      const a = t - t0; if (a < 0 || a > 4) return;
      for (let k = 0; k < 3; k++) {
        const sx = lerp(heroX(t0) + SOFF + 40, goodX(t0) + SOFF + 40, i % 2) + k * 30, sy = WB - 330;
        const x = sx - a * (140 + k * 40), y = sy - a * 150 - k * 30 + Math.sin(a * 3 + k) * 20;
        if (y < WT) continue;
        bird(g, x, y, 1.2, Math.abs(Math.sin(t * 14 + k)), '#000');
      }
    });
  }

  function render(ctx, t) {
    if (!layer) { layer = document.createElement('canvas'); layer.width = W; layer.height = H; lctx = layer.getContext('2d'); }
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const cr = corrupt(t), gd = goodness(t);
    const hx = heroX(t), bx = badX(t), gx = goodX(t);
    const camX = keys(t, [[0, 2380], [7, 1800], [10, 1560], [21, 920], [25, 1040], [27, 1120], [33, 1180], [44, 560], [46, 560], [50, 700]], x => x);
    const zoom = keys(t, [[0, 1.15], [7, 1.0], [18, 1.08], [20.5, 1.3], [22, 1.1], [27, 1.15], [30, 1.25], [33, 1.05], [44, 1.0], [49.5, 0.82]]);
    const camY = keys(t, [[0, 560], [20.5, 580], [22, 560], [44, 560], [49.5, 520]]);
    const cam = { x: camX, y: camY, zoom, t, shake: win(t, 25.4, 25.5, 25.6, 26) * 10 };

    ctx.save(); E.camera(ctx, cam);
    wall(ctx, t, camX, cr, gd);
    street(ctx, t, camX, cr);
    cracks(ctx, t);
    pot(ctx, t);
    ctx.restore();

    // ----- الظلال -----
    lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.clearRect(0, 0, W, H);
    E.camera(lctx, cam);
    const walkH = (t < 21 ? 1 : 0) + win(t, 22, 22.3, 24.7, 25) + (t > 33.5 && t < 44 ? 1 : 0);
    const walkB = (t > 7 && t < 21 ? 1 : 0) + (t > 26 && t < 29 ? 1 : 0);
    const walkG = (t > 27.5 && t < 32.5 ? 1 : 0) + (t > 33.5 && t < 44 ? 1 : 0);
    const sitH = sm(t, 27.2, 28.4) * (1 - sm(t, 32.8, 33.6));
    // الشخصية السيئة
    const badO = { x: bx, y: GY, s: 1.0, walk: t * 6.2 + 2, walking: clamp(walkB), lean: 0.12 };
    if (bx > -150) shadowFig(lctx, { ...badO, tall: 1.05 }, spiky(0.8, t));
    // البطل
    const scaredLook = t > 19.2 && t < 22;
    const heroLean = cr * 0.22 - gd * 0.02;
    const heroShadowO = { x: hx, y: GY, s: 1.0, walk: t * 6.2, walking: clamp(walkH), crouch: sitH * 0.8, lean: heroLean + (t > 16.3 && t < 17.2 ? 0.2 * win(t, 16.3, 16.6, 16.8, 17.2) : 0),
      armR: t > 16.3 && t < 17.3 ? 2.4 * win(t, 16.3, 16.7, 16.9, 17.3) : 0.15 + cr * 0.9, armL: t > 13.4 && t < 14.4 ? 2.6 * win(t, 13.4, 13.7, 13.9, 14.4) : 0.15 + cr * 0.6 + gd * (t > 38 && t < 44 ? 1.4 * win(t, 38, 38.4, 39, 39.6) : 0),
      tall: 1 + cr * 0.32 + gd * 0.12 };
    // حبال قطران بين ظل البطل وظل السيئ
    const tar = sm(t, 21, 22) * (1 - sm(t, 25.4, 25.6));
    const hs = shadowFig(lctx, heroShadowO, spiky(cr, t));
    if (tar > 0 && bx > -150) {
      lctx.save(); lctx.setTransform(1, 0, 0, 1, 0, 0); E.camera(lctx, cam);
      lctx.strokeStyle = '#000'; lctx.lineCap = 'round';
      for (let k = 0; k < 4; k++) {
        const y = WB - 150 - k * 70, x0 = bx + SOFF + 30, x1 = hx + SOFF - 30;
        lctx.lineWidth = (14 - k * 2) * tar * (1 - clamp((x1 - x0 - 140) / 300) * 0.6);
        lctx.beginPath(); lctx.moveTo(x0, y); lctx.bezierCurveTo((x0 + x1) / 2, y + 40 + Math.sin(t * 5 + k) * 20, (x0 + x1) / 2, y - 30, x1, y + Math.sin(t * 4 + k) * 10); lctx.stroke();
      }
      lctx.restore();
    }
    // الصاحب الصالح
    const goodO = { x: gx, y: GY, s: 1.02, walk: t * 6.2 + 1, walking: clamp(walkG), armR: t > 31.8 && t < 33.6 ? 1.4 * win(t, 31.8, 32.4, 33, 33.6) : 0.2, armL: t > 39.2 && t < 41 ? 1.4 * win(t, 39.2, 39.6, 40.4, 41) : 0.2, tall: 1.1 };
    if (gx < 2500) shadowFig(lctx, goodO);
    vines(lctx, t, [hx + SOFF, gx + SOFF]);
    shadowBirds(lctx, t);
    // تلوين الطبقة ثم دمجها على الجدار
    lctx.setTransform(1, 0, 0, 1, 0, 0);
    lctx.globalCompositeOperation = 'source-in';
    lctx.fillStyle = c(mix(mix('#4a2a40', '#2a0a1a', cr), '#3a2a50', gd)); lctx.fillRect(0, 0, W, H);
    lctx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.globalAlpha = 0.5 + cr * 0.25;
    ctx.globalCompositeOperation = 'multiply';
    ctx.filter = `blur(${2.5 - cr * 1.5}px)`;
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
    // حافة ذهبية للظلال الطيبة
    if (gd > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.18 * gd; ctx.filter = 'blur(14px)'; ctx.drawImage(layer, 0, 0); ctx.restore(); }

    // ----- المقدمة: الشخصيات الحقيقية -----
    ctx.save(); E.camera(ctx, cam);
    // عيون ظلّ البطل الحمراء
    if (cr > 0.55) { const a = (cr - 0.55) / 0.45; [-16, 14].forEach(d => { ellipse(ctx, hs.head[0] + d - 10, hs.head[1] + 4, 10, 5, c('#ff3a2a', a)); glow(ctx, hs.head[0] + d - 10, hs.head[1] + 4, 34, '#ff2a10', 0.7 * a); }); }
    pigeons(ctx, t);
    if (bx > -150) figure(ctx, { ...badO, robe: '#5a4a6a', robe2: '#3a2a4a', skin: '#c99a80', hair: '#1a1018', hood: '#4a3a5a', mood: t > 21 && t < 26 ? 'angry' : 'smile', face: t > 21 ? 0.8 : (t > 10 ? 0.4 : 1), eyeWhite: false,
      armR: t > 22 && t < 25.5 ? 1.2 + Math.sin(t * 5) * 0.4 : 0.3, armL: t > 26 && t < 26.8 ? 1.8 : 0.3 });
    let heroMood = 'neutral';
    if (t > 10.5) heroMood = 'smile'; if (t > 15) heroMood = 'neutral'; if (scaredLook) heroMood = 'scared'; if (t > 22) heroMood = 'worry'; if (t > 26) heroMood = 'sad'; if (t > 32) heroMood = 'o'; if (t > 33.4) heroMood = 'smile'; if (t > 38) heroMood = 'happy';
    const heroFace = keys(t, [[0, -1], [10, -1], [10.5, -0.6], [18.8, -0.6], [19.2, 0.9], [21.5, 0.9], [22, -0.7], [26, -0.3], [31.5, -0.3], [32, 0.8], [33.5, 0.8], [34, -0.6], [44, -0.6], [44.6, 0.9]]);
    figure(ctx, { x: hx, y: GY, s: 1.0, walk: t * 6.2, walking: clamp(walkH), face: heroFace, robe: '#f2ede0', robe2: '#c8bfaa', skin: '#f1c7a1', hair: '#2b1d18', scarf: '#e07a3a', mood: heroMood, crouch: sitH * 0.8,
      armR: t > 32.6 && t < 33.6 ? 1.3 * win(t, 32.6, 33, 33.2, 33.6) : 0.15, armL: 0.15, eyeWhite: scaredLook, lookY: scaredLook ? -3 : 0,
      blink: [4, 8, 29.5].some(b => t > b && t < b + 0.15) ? 1 : 0, glow: gd * 0.25 });
    if (gx < 2500) figure(ctx, { ...goodO, robe: '#4a8fc0', robe2: '#2f6a96', skin: '#d9a07a', hair: '#1e1410', scarf: '#f2c14e', mood: 'smile', face: t < 33.5 ? -0.8 : (t > 44.6 ? -0.9 : -0.5), glow: 0.2 + gd * 0.2 });
    ctx.restore();

    // ----- تدرّج الإضاءة -----
    ctx.save(); ctx.globalCompositeOperation = 'soft-light';
    if (cr > 0) { ctx.fillStyle = `rgba(150,20,40,${0.55 * cr})`; ctx.fillRect(0, 0, W, H); }
    if (gd > 0) { ctx.fillStyle = `rgba(255,190,90,${0.45 * gd})`; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
    const sun = ctx.createLinearGradient(0, 0, W, 0); sun.addColorStop(0, `rgba(255,200,120,${0.18 + gd * 0.12})`); sun.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = sun; ctx.fillRect(0, 0, W, H); ctx.restore();
    if (gd > 0) E.motes(ctx, t, 45, 12, '#ffd98a', { a: 0.5 * gd, size: 2.5, speed: 18 });

    E.titleCard(ctx, t, '٤', 'الظِّل', 1.0, 5.8, '#ffe2a6', 330);
    E.ending(ctx, t, {
      t0: 50, end: 56.8,
      lines: ['«الْمَرْءُ عَلَى دِينِ خَلِيلِهِ', 'فَلْيَنْظُرْ أَحَدُكُمْ مَنْ يُخَالِلُ»'],
      source: 'رواه أبو داود والترمذي', tagline: 'صاحبك… يرسم ظلّك',
      bg: ['#0c0708', '#24141a'],
    });
    const fade = sm(t, 0, 1.4) * (1 - sm(t, 57, 58));
    E.post(ctx, t, { fade, grain: 0.06, vignette: 0.5 + cr * 0.25, flash: win(t, 25.4, 25.5, 25.6, 26) * 0.35, flashCol: '#ffd8c0' });
  }

  window.FILM = { duration: DUR, render };
})();
