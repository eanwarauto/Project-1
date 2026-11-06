// محرّك الرسوم المشترك لأفلام «الصحبة الصالحة».
// كل فيلم يُرسم كدالة نقية من الزمن t، فكل إطار يُرسم مستقلاً عن غيره.
(function () {
  const W = 1920, H = 1080;
  const E = { W, H };

  // ---------- رياضيات وتوقيت ----------
  E.clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  E.lerp = (a, b, t) => a + (b - a) * t;
  E.seg = (t, a, b) => E.clamp((t - a) / (b - a));
  E.ease = {
    inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    out: t => 1 - Math.pow(1 - t, 3),
    in: t => t * t * t,
    sine: t => -(Math.cos(Math.PI * t) - 1) / 2,
    back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  };
  E.sm = (t, a, b) => E.ease.sine(E.seg(t, a, b));
  E.io = (t, a, b) => E.ease.inOut(E.seg(t, a, b));
  // نافذة: تصعد بين a وb وتنزل بين c وd
  E.win = (t, a, b, c, d) => E.sm(t, a, b) * (1 - E.sm(t, c, d));
  E.hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  E.rnd = (i, k = 0) => E.hash(i * 13.37 + k * 71.13 + 0.5);
  E.noise = x => {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return E.lerp(E.hash(i), E.hash(i + 1), u) * 2 - 1;
  };
  // مفاتيح حركة: [[t,v],...] مع تنعيم
  E.keys = (t, ks, ease = E.ease.inOut) => {
    if (t <= ks[0][0]) return ks[0][1];
    for (let i = 0; i < ks.length - 1; i++) {
      const [t0, v0] = ks[i], [t1, v1] = ks[i + 1];
      if (t <= t1) {
        const p = ease((t - t0) / (t1 - t0));
        if (Array.isArray(v0)) return v0.map((v, j) => E.lerp(v, v1[j], p));
        return E.lerp(v0, v1, p);
      }
    }
    return ks[ks.length - 1][1];
  };

  // ---------- الألوان ----------
  E.hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  E.mix = (a, b, t) => {
    const A = typeof a === 'string' ? E.hex(a) : a, B = typeof b === 'string' ? E.hex(b) : b;
    return A.map((v, i) => v + (B[i] - v) * t);
  };
  E.c = (col, a = 1) => {
    const C = typeof col === 'string' ? E.hex(col) : col;
    return `rgba(${C[0] | 0},${C[1] | 0},${C[2] | 0},${a})`;
  };
  E.grey = (col, t) => { const C = typeof col === 'string' ? E.hex(col) : col; const g = C[0] * 0.3 + C[1] * 0.59 + C[2] * 0.11; return E.mix(C, [g, g, g], t); };

  // ---------- أدوات الرسم ----------
  E.glow = (ctx, x, y, r, col, a = 1) => {
    if (a <= 0 || r <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, E.c(col, a));
    g.addColorStop(0.35, E.c(col, a * 0.45));
    g.addColorStop(1, E.c(col, 0));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  };
  E.puff = (ctx, x, y, r, col, a) => {
    if (a <= 0 || r <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, E.c(col, a));
    g.addColorStop(0.6, E.c(col, a * 0.6));
    g.addColorStop(1, E.c(col, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  E.vgrad = (ctx, y0, y1, stops) => {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    stops.forEach(([p, c]) => g.addColorStop(p, typeof c === 'string' ? c : E.c(c)));
    return g;
  };
  E.rrect = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };
  E.ellipse = (ctx, x, y, rx, ry, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2); ctx.fill(); };
  E.star = (ctx, x, y, r, a, col = '#fff') => {
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.25 : r; const an = (i * Math.PI) / 4; ctx.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); }
    ctx.fill(); ctx.restore();
  };
  // سماء ونجوم
  E.stars = (ctx, t, n, seed, y0, y1, a = 1) => {
    for (let i = 0; i < n; i++) {
      const x = E.rnd(i, seed) * W, y = y0 + E.rnd(i, seed + 1) * (y1 - y0);
      const tw = 0.5 + 0.5 * Math.sin(t * (1 + E.rnd(i, seed + 2) * 3) + i);
      const r = 0.8 + E.rnd(i, seed + 3) * 1.8;
      ctx.fillStyle = `rgba(255,248,230,${a * (0.25 + 0.75 * tw) * (0.4 + E.rnd(i, seed + 4) * 0.6)})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  };
  // جزيئات غبار عائمة
  E.motes = (ctx, t, n, seed, col, opt = {}) => {
    const { x0 = 0, x1 = W, y0 = 0, y1 = H, a = 0.6, size = 3, speed = 20, add = true } = opt;
    ctx.save(); if (add) ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const life = 6 + E.rnd(i, seed) * 6;
      const ph = (t + E.rnd(i, seed + 1) * life) % life;
      const k = ph / life;
      const x = x0 + E.rnd(i, seed + 2) * (x1 - x0) + Math.sin(t * 0.6 + i) * 20;
      const y = y1 - ((E.rnd(i, seed + 3) * (y1 - y0) + ph * speed) % (y1 - y0));
      const al = a * Math.sin(k * Math.PI);
      const r = size * (0.4 + E.rnd(i, seed + 4));
      E.glow(ctx, x, y, r * 4, col, al * 0.5);
      ctx.fillStyle = E.c(col, al); ctx.beginPath(); ctx.arc(x, y, r * 0.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };

  // ---------- الكاميرا ----------
  E.camera = (ctx, cam) => {
    const { x = W / 2, y = H / 2, zoom = 1, rot = 0, shake = 0, t = 0 } = cam;
    ctx.translate(W / 2, H / 2);
    if (shake) ctx.translate(E.noise(t * 23) * shake, E.noise(t * 19 + 9) * shake);
    ctx.scale(zoom, zoom); ctx.rotate(rot); ctx.translate(-x, -y);
  };

  // ---------- النصوص ----------
  E.FONTS = {
    quote: '700 64px Amiri',
    kufi: '700 64px "Reem Kufi"',
    body: '700 40px Cairo',
  };
  E.text = (ctx, str, x, y, o = {}) => {
    const { family = 'Amiri', weight = 700, size = 60, col = '#fff', a = 1, blur = 0, glow = null, glowA = 0.6, dy = 0, spacing = 0 } = o;
    if (a <= 0.003) return;
    ctx.save();
    ctx.font = `${weight} ${size}px "${family}"`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl';
    if (spacing) ctx.letterSpacing = spacing + 'px';
    if (glow) { ctx.shadowColor = E.c(glow, glowA * a); ctx.shadowBlur = size * 0.6; }
    if (blur > 0.2) ctx.filter = `blur(${blur}px)`;
    ctx.globalAlpha = a; ctx.fillStyle = col;
    ctx.fillText(str, x, y + dy);
    ctx.restore();
  };
  // ظهور نص ناعم: شفافية + ضبابية + انزلاق خفيف
  E.reveal = (ctx, str, x, y, t, t0, t1, o = {}) => {
    const p = E.sm(t, t0, t0 + (o.inDur || 1.2));
    const q = t1 == null ? 0 : E.sm(t, t1, t1 + (o.outDur || 1));
    const a = p * (1 - q);
    E.text(ctx, str, x, y, { ...o, a: a * (o.a ?? 1), blur: (1 - p) * 12 + q * 8, dy: (1 - p) * 18 });
  };

  // ---------- الشخصية الكرتونية ----------
  // o: x,y (موضع القدمين)، s مقياس، face (-1..1) اتجاه النظر، walk طور المشي، walking 0..1،
  // robe, robe2, skin, hair, scarf, mood, blink, soot, desat, glow, armL, armR, lean, sil (لون ظل موحّد)
  E.figure = (ctx, o) => {
    const s = o.s ?? 1, f = o.face ?? 0, ph = o.walk ?? 0, wk = o.walking ?? 0;
    const sil = o.sil;
    const ds = o.desat ?? 0;
    const C = (col) => sil ? sil : E.c(E.grey(col, ds));
    const bob = -Math.abs(Math.sin(ph)) * 7 * s * wk + (o.bob ?? 0) * s;
    const out = { head: null, handL: null, handR: null };
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(o.lean ?? 0);
    ctx.scale(s, s);
    const alpha = o.alpha ?? 1;
    ctx.globalAlpha *= alpha;

    // ظل أرضي
    if (!sil && o.ground !== false) E.ellipse(ctx, 0, 2, 46, 9, 'rgba(0,0,0,0.28)');

    const sw = Math.sin(ph) * wk;
    const crouch = o.crouch ?? 0; // جلوس/انحناء
    // القدمان
    const footCol = C(o.shoe || '#3a2c2a');
    const fl = sw * 16, fr = -sw * 16;
    const lift = (v) => Math.max(0, v) * 0.5;
    E.ellipse(ctx, -14 + fl, -6 - lift(sw * 16), 15, 9, footCol);
    E.ellipse(ctx, 14 + fr, -6 - lift(-sw * 16), 15, 9, footCol);

    ctx.translate(0, bob + crouch * 30);
    // الثوب
    const robe = o.robe || '#e8e2d4', robe2 = o.robe2 || E.c(E.mix(robe, '#000', 0.25));
    const sway = Math.sin(ph * 2) * 2 * wk;
    const bodyPath = () => {
      ctx.beginPath();
      ctx.moveTo(-20, -112);
      ctx.bezierCurveTo(-30, -80, -42 + sway, -40, -40 + sway, -12);
      ctx.quadraticCurveTo(0, -4, 40 + sway, -12);
      ctx.bezierCurveTo(42 + sway, -40, 30, -80, 20, -112);
      ctx.closePath();
    };
    const outline = o.outline ?? (sil ? null : 'rgba(25,15,30,0.55)');
    bodyPath();
    if (sil) ctx.fillStyle = sil;
    else {
      const g = ctx.createLinearGradient(-40, 0, 40, 0);
      g.addColorStop(0, C(robe)); g.addColorStop(1, sil || E.c(E.grey(typeof robe2 === 'string' && robe2[0] === '#' ? robe2 : E.mix(robe, '#000', 0.25), ds)));
      ctx.fillStyle = g;
    }
    ctx.fill();
    if (outline) { ctx.lineWidth = 3; ctx.strokeStyle = outline; ctx.stroke(); }
    // حزام/وشاح
    if (o.scarf && !sil) {
      ctx.fillStyle = C(o.scarf);
      ctx.beginPath(); ctx.ellipse(0, -108, 25, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(10 * (f >= 0 ? 1 : -1), -104);
      ctx.quadraticCurveTo(22 * (f >= 0 ? 1 : -1) + (o.scarfWave ?? 0), -80, 18 * (f >= 0 ? 1 : -1) + (o.scarfWave ?? 0) * 1.5, -62);
      ctx.lineTo(8 * (f >= 0 ? 1 : -1) + (o.scarfWave ?? 0), -66); ctx.closePath(); ctx.fill();
    }
    // السخام
    if (o.soot > 0 && !sil) {
      ctx.save(); bodyPath(); ctx.clip();
      for (let i = 0; i < 14; i++) {
        const k = E.rnd(i, 77);
        if (k > o.soot) continue;
        const sx = (E.rnd(i, 78) - 0.5) * 70, sy = -100 + E.rnd(i, 79) * 90, sr = 6 + E.rnd(i, 80) * 16;
        E.puff(ctx, sx, sy, sr * 1.6, '#1d1714', 0.85 * E.clamp((o.soot - k) * 4));
      }
      // ثقوب الشرر
      for (let i = 0; i < 6; i++) {
        const k = E.rnd(i, 81) * 0.9 + 0.1; if (k > o.soot) continue;
        const sx = (E.rnd(i, 82) - 0.5) * 60, sy = -95 + E.rnd(i, 83) * 75;
        E.ellipse(ctx, sx, sy, 4, 3, 'rgba(20,10,8,0.95)');
        ctx.strokeStyle = 'rgba(255,120,40,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(sx, sy, 5, 4, 0, 0, 7); ctx.stroke();
      }
      ctx.restore();
    }

    // الذراعان
    const armSw = sw * 0.45;
    const armL = (o.armL ?? 0.12) + armSw, armR = (o.armR ?? 0.12) - armSw;
    const sleeve = C(o.sleeve || robe);
    const hand = C(o.skin || '#f1c7a1');
    const arm = (side, ang) => {
      const sx = side * 22, sy = -100;
      const len = o.armLen ?? 52;
      const hx = sx + side * Math.sin(ang) * len, hy = sy + Math.cos(ang) * len;
      ctx.strokeStyle = sleeve; ctx.lineCap = 'round'; ctx.lineWidth = 15;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + side * Math.sin(ang) * len * 0.5 + side * 4, sy + Math.cos(ang) * len * 0.5, hx, hy); ctx.stroke();
      if (outline) { ctx.save(); ctx.globalCompositeOperation = 'source-over'; }
      E.ellipse(ctx, hx, hy, 8.5, 8.5, hand);
      if (outline) ctx.restore();
      return [hx, hy];
    };
    const hL = arm(-1, armL), hR = arm(1, armR);

    // الرأس
    const hy = -150 + (o.headDy ?? 0);
    const tilt = o.tilt ?? 0;
    ctx.save();
    ctx.translate(0, hy); ctx.rotate(tilt);
    const skin = C(o.skin || '#f1c7a1');
    E.ellipse(ctx, 0, 0, 40, 38, skin);
    if (outline) { ctx.lineWidth = 3; ctx.strokeStyle = outline; ctx.beginPath(); ctx.ellipse(0, 0, 40, 38, 0, 0, 7); ctx.stroke(); }
    // الشعر/الطاقية
    if (o.hair !== null) {
      ctx.fillStyle = C(o.hair || '#2b1d18');
      ctx.beginPath();
      ctx.ellipse(-f * 4, -10, 41, 31, 0, Math.PI * 1.02, Math.PI * 1.98);
      ctx.quadraticCurveTo(30, -18, 18 - f * 8, -22);
      ctx.quadraticCurveTo(-f * 10, -12, -26, -18);
      ctx.closePath(); ctx.fill();
    }
    if (o.hood && !sil) {
      ctx.fillStyle = C(o.hood);
      ctx.beginPath(); ctx.ellipse(0, -4, 47, 46, 0, Math.PI * 0.92, Math.PI * 2.08); ctx.quadraticCurveTo(30, -10, 0, -20); ctx.quadraticCurveTo(-30, -10, -46, 8); ctx.closePath(); ctx.fill();
    }
    if (!sil) {
      const ex = f * 14, mood = o.mood || 'neutral';
      const blink = o.blink ?? 0;
      const eye = (dx) => {
        const x = ex + dx, y = 2;
        if (mood === 'happy' || blink > 0.9 || mood === 'closed') {
          ctx.strokeStyle = '#2a1a16'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
          ctx.beginPath();
          if (mood === 'happy') ctx.arc(x, y + 3, 6, Math.PI * 1.15, Math.PI * 1.85);
          else { ctx.moveTo(x - 6, y + 1); ctx.quadraticCurveTo(x, y + 5, x + 6, y + 1); }
          ctx.stroke();
          return;
        }
        const big = mood === 'scared' ? 1.25 : 1;
        if (o.eyeWhite || mood === 'scared') E.ellipse(ctx, x, y, 7.5 * big, 9 * big * (1 - blink), '#fff');
        E.ellipse(ctx, x + f * 1.5 + (o.lookY ? 0 : 0), y + (o.lookY ?? 0), 4.6 * (mood === 'scared' ? 0.7 : 1), 6.2 * (1 - blink) * (mood === 'scared' ? 0.7 : 1), o.eyeCol || '#2a1a16');
        E.ellipse(ctx, x + 1.6, y - 2.2, 1.5, 1.5, 'rgba(255,255,255,0.9)');
      };
      eye(-13); eye(13);
      // الحاجبان
      if (mood === 'sad' || mood === 'scared' || mood === 'angry' || mood === 'worry') {
        ctx.strokeStyle = '#2a1a16'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        const k = mood === 'angry' ? -1 : 1;
        ctx.beginPath(); ctx.moveTo(ex - 20, -10 + 3 * k); ctx.lineTo(ex - 7, -13 - 1 * k); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ex + 20, -10 + 3 * k); ctx.lineTo(ex + 7, -13 - 1 * k); ctx.stroke();
      }
      // الخدّان
      E.ellipse(ctx, ex - 22, 13, 7, 4.5, 'rgba(240,110,110,0.35)');
      E.ellipse(ctx, ex + 22, 13, 7, 4.5, 'rgba(240,110,110,0.35)');
      // الفم
      ctx.strokeStyle = '#3a1f1a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      const mx = ex * 1.05, my = 17;
      ctx.beginPath();
      if (mood === 'happy' || mood === 'smile') { ctx.arc(mx, my - 4, 7, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke(); }
      else if (mood === 'sad' || mood === 'worry') { ctx.arc(mx, my + 6, 6, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); }
      else if (mood === 'scared' || mood === 'o') { E.ellipse(ctx, mx, my, 4, 5, '#3a1f1a'); }
      else if (mood === 'angry') { ctx.moveTo(mx - 6, my + 2); ctx.lineTo(mx + 6, my); ctx.stroke(); }
      else { ctx.moveTo(mx - 4, my); ctx.lineTo(mx + 4, my); ctx.stroke(); }
    }
    ctx.restore();

    // توهج ذهبي
    if (o.glow > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, -90, 10, 0, -90, 170);
      g.addColorStop(0, E.c(o.glowCol || '#ffd27a', 0.45 * o.glow));
      g.addColorStop(1, E.c(o.glowCol || '#ffd27a', 0));
      ctx.fillStyle = g; ctx.fillRect(-180, -270, 360, 360);
      ctx.restore();
    }
    ctx.restore();

    const tr = (p) => {
      const ang = o.lean ?? 0, c = Math.cos(ang), sn = Math.sin(ang);
      const lx = p[0] * s, ly = (p[1] + bob + crouch * 30) * s;
      return [o.x + lx * c - ly * sn, o.y + lx * sn + ly * c];
    };
    out.handL = tr(hL); out.handR = tr(hR); out.head = tr([0, hy]);
    return out;
  };

  // ---------- المعالجة النهائية ----------
  let grainCanvases = null;
  const makeGrain = () => {
    grainCanvases = [];
    for (let k = 0; k < 6; k++) {
      const c = document.createElement('canvas'); c.width = 480; c.height = 270;
      const g = c.getContext('2d'); const img = g.createImageData(480, 270);
      let seed = k * 9973 + 1;
      for (let i = 0; i < img.data.length; i += 4) {
        seed = (seed * 16807) % 2147483647; const v = (seed / 2147483647) * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0); grainCanvases.push(c);
    }
  };
  E.post = (ctx, t, o = {}) => {
    const { vignette = 0.55, grain = 0.05, bars = true, fade = 1, tint = null, tintA = 0, fps = 24, flash = 0, flashCol = '#fff' } = o;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (tint && tintA > 0) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = E.c(tint, tintA); ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (vignette > 0) {
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${vignette})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (flash > 0) { ctx.fillStyle = E.c(flashCol, flash); ctx.fillRect(0, 0, W, H); }
    if (fade < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - fade})`; ctx.fillRect(0, 0, W, H); }
    if (grain > 0) {
      if (!grainCanvases) makeGrain();
      const idx = Math.floor(t * fps) % grainCanvases.length;
      ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = grain;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(grainCanvases[idx], 0, 0, W, H); ctx.restore();
    }
    if (bars) { const bh = 108; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh); }
  };

  // شارة العنوان في بداية كل فيلم
  E.titleCard = (ctx, t, num, title, t0 = 0.8, t1 = 5.2, col = '#ffe2a6', y0 = 800) => {
    const a = E.win(t, t0, t0 + 1.2, t1, t1 + 1.0);
    if (a <= 0) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = E.vgrad(ctx, y0 - 170, y0 + 130, [[0, 'rgba(0,0,0,0)'], [0.5, `rgba(0,0,0,${0.4 * a})`], [1, 'rgba(0,0,0,0)']]);
    ctx.fillRect(0, y0 - 170, W, 300);
    E.text(ctx, 'الصُّحبة الصالحة · ' + num, W / 2, y0 - 50, { family: 'Cairo', size: 26, col: '#ffffff', a: a * 0.75, spacing: 2 });
    E.text(ctx, title, W / 2, y0 + 20, { family: 'Reem Kufi', size: 64, col, a, glow: col, glowA: 0.5, blur: (1 - E.sm(t, t0, t0 + 1.2)) * 10 });
    ctx.restore();
  };

  // خاتمة الحديث/الآية
  E.ending = (ctx, t, o) => {
    const { t0, lines, source, tagline, end, gold = '#ffd98a', bg = ['#07060d', '#140f22'] } = o;
    const a = E.sm(t, t0, t0 + 1.2);
    if (a <= 0) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = a;
    ctx.fillStyle = E.vgrad(ctx, 0, H, [[0, bg[0]], [1, bg[1]]]); ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    E.motes(ctx, t, 50, 909, '#ffcf7a', { a: 0.45 * a, size: 2.5, speed: 25 });
    // زخرفة
    const ornA = E.sm(t, t0 + 0.6, t0 + 2) * a;
    ctx.strokeStyle = E.c(gold, 0.6 * ornA); ctx.lineWidth = 2;
    const ow = 260 * E.ease.out(E.sm(t, t0 + 0.6, t0 + 2.2));
    const oy = 360;
    ctx.beginPath(); ctx.moveTo(W / 2 - 30 - ow, oy); ctx.lineTo(W / 2 - 30, oy); ctx.moveTo(W / 2 + 30, oy); ctx.lineTo(W / 2 + 30 + ow, oy); ctx.stroke();
    ctx.save(); ctx.translate(W / 2, oy); ctx.rotate(Math.PI / 4); ctx.strokeRect(-9, -9, 18, 18); ctx.restore();
    let y = 470;
    lines.forEach((ln, i) => {
      E.reveal(ctx, ln, W / 2, y, t, t0 + 1 + i * 1.4, end, { family: 'Amiri', size: 78, col: '#fff6e0', glow: gold, glowA: 0.35, inDur: 1.4 });
      y += 115;
    });
    if (source) E.reveal(ctx, source, W / 2, y - 25, t, t0 + 1.2 + lines.length * 1.4, end, { family: 'Cairo', size: 30, col: gold, a: 0.85 });
    if (tagline) E.reveal(ctx, tagline, W / 2, 860, t, t0 + 2.4 + lines.length * 1.4, end, { family: 'Reem Kufi', size: 46, col: gold, glow: gold, glowA: 0.5 });
    ctx.restore();
  };

  window.E = E;
})();
