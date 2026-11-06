// تركيب النسخة العمودية للريلز (1080×1920): الفيلم في الوسط مع تتبع الحدث،
// خلفية ضبابية من نفس المشهد، العنوان أعلى، والعلامة المائية أسفل.
(function () {
  const VW = 1080, VH = 1920;
  const SRC_Y = 108, SRC_H = 864; // المنطقة المرئية داخل الأشرطة السينمائية
  const K = 0.94; // تكبير الفيلم داخل الإطار العمودي
  const SRC_W = VW / K; // عرض النافذة من المصدر
  const FG_H = SRC_H * K, FG_Y = (VH - FG_H) / 2 - 20;
  const WATERMARK = 'eng.7ikaya';

  // مركز الحدث (بإحداثيات الشاشة الأصلية 1920) عبر الزمن لكل فيلم
  const FOCUS = {
    musk: [[0, 960], [8, 960], [11, 960], [13, 900], [24, 900], [26.5, 960], [28.5, 1030], [41, 1030], [41.3, 960], [42.4, 960], [43.2, 760], [43.9, 760], [44.6, 1130], [47.5, 1130], [50, 1080], [50.2, 960]],
    lantern: [[0, 960]],
    rope: [[0, 1150], [6.9, 1220], [7.1, 950], [16, 960], [17.5, 960], [23.4, 960], [24.2, 890], [30.4, 890], [31.5, 900], [36.4, 900], [36.6, 1000], [48.3, 1000], [48.6, 960]],
    shadow: [[0, 1150], [10, 1100], [21, 1000], [25, 950], [27, 960], [32.5, 1030], [34, 1060], [44, 1060], [46, 980], [49.8, 980], [50.1, 960]],
  };
  const TITLES = { musk: 'حاملُ المسكِ ونافخُ الكير', lantern: 'الفانوس', rope: 'الحبل', shadow: 'الظِّل' };
  const ACCENT = { musk: '#ffd98a', lantern: '#ffd98a', rope: '#dbeeff', shadow: '#ffd98a' };

  let vc = null, vctx = null, blurC = null, bctx = null;
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };

  window.renderVertical = (film, t, src) => {
    if (!vc) {
      vc = document.getElementById('v');
      vctx = vc.getContext('2d');
      blurC = document.createElement('canvas'); blurC.width = 270; blurC.height = 480; bctx = blurC.getContext('2d');
    }
    const g = vctx, dur = FILM.duration;
    const fx = E.clamp(E.keys(t, FOCUS[film] || [[0, 960]]), SRC_W / 2, 1920 - SRC_W / 2);
    // خلفية ضبابية: تُصغّر ثم تُكبّر لتكون ناعمة وسريعة
    bctx.filter = 'blur(6px)';
    const bw = SRC_H * (270 / 480);
    bctx.drawImage(src, fx - bw / 2, SRC_Y, bw, SRC_H, -20, -20, 310, 520);
    bctx.filter = 'none';
    g.imageSmoothingQuality = 'high';
    g.drawImage(blurC, 0, 0, VW, VH);
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 0, VW, VH);
    const vg = g.createLinearGradient(0, 0, 0, VH);
    vg.addColorStop(0, 'rgba(0,0,0,0.55)'); vg.addColorStop(0.3, 'rgba(0,0,0,0)'); vg.addColorStop(0.7, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.7)');
    g.fillStyle = vg; g.fillRect(0, 0, VW, VH);

    // الفيلم
    g.save();
    g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 50; g.shadowOffsetY = 12;
    rr(g, 0, FG_Y, VW, FG_H, 0); g.fillStyle = '#000'; g.fill();
    g.restore();
    g.drawImage(src, fx - SRC_W / 2, SRC_Y, SRC_W, SRC_H, 0, FG_Y, VW, FG_H);
    // حافة ذهبية رفيعة
    const fade = E.sm(t, 0, 1.5) * (1 - E.sm(t, dur - 1.3, dur));
    const acc = ACCENT[film] || '#ffd98a';
    g.globalAlpha = 0.35 * fade; g.fillStyle = acc;
    g.fillRect(0, FG_Y - 3, VW, 2); g.fillRect(0, FG_Y + FG_H + 1, VW, 2);
    g.globalAlpha = 1;

    // العنوان أعلى
    const ty = FG_Y - 210;
    E.text(g, 'الصُّحبة الصالحة', VW / 2, ty, { family: 'Cairo', size: 36, col: '#ffffff', a: 0.8 * fade, spacing: 2 });
    E.text(g, TITLES[film] || '', VW / 2, ty + 88, { family: 'Reem Kufi', size: 86, col: acc, a: fade, glow: acc, glowA: 0.45 });

    // العلامة المائية أسفل + علامة صغيرة على الفيلم
    const wy = FG_Y + FG_H + 150;
    g.save();
    g.globalAlpha = 0.9 * Math.max(0.35, fade);
    g.font = '600 46px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'ltr';
    g.letterSpacing = '3px';
    g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 12;
    g.fillStyle = '#ffffff'; g.fillText(WATERMARK, VW / 2, wy);
    g.shadowBlur = 0; g.fillStyle = acc; g.globalAlpha *= 0.7;
    g.fillRect(VW / 2 - 60, wy + 42, 120, 3);
    g.globalAlpha = 0.45;
    g.font = '600 26px Inter'; g.textAlign = 'left'; g.letterSpacing = '1px';
    g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 6; g.fillStyle = '#ffffff';
    g.fillText(WATERMARK, 28, FG_Y + 40);
    g.restore();
  };
})();
