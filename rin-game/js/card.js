// 守護靈結果圖（Canvas 合成）：1080×1350（貼文 4:5）／1080×1920（限動 9:16）
window.Card = (function () {
  const SERIF = '"Noto Serif TC", "Songti TC", "PMingLiU", serif';
  const GOLD = "#e9c98a", LILAC = "#f3dcff", PINK = "#e58cff";
  const cache = {};
  const load = src => {
    if (!src) return Promise.resolve(null);
    if (!cache[src]) cache[src] = new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
    return cache[src];
  };
  // 可重現的亂數（星點每次都一樣）
  const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  async function spiritImage(sp) {
    const art = await load(sp.art);
    if (art) return { img: art, tint: false };
    const ph = await load(window.ASSETS.spiritPlaceholder.replace("{id}", sp.id));
    return { img: ph, tint: true };
  }

  // 剪影上色：白 → 守護靈代表色的漸層
  function tinted(img, color, size) {
    const c = document.createElement("canvas"); c.width = c.height = size;
    const x = c.getContext("2d");
    x.drawImage(img, 0, 0, size, size);
    x.globalCompositeOperation = "source-in";
    const g = x.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, "#ffffff"); g.addColorStop(0.55, color); g.addColorStop(1, shade(color, -0.35));
    x.fillStyle = g; x.fillRect(0, 0, size, size);
    return c;
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = v => Math.max(0, Math.min(255, Math.round(v + (amt < 0 ? v * amt : (255 - v) * amt))));
    return `rgb(${f(r)},${f(g)},${f(b)})`;
  }
  function alpha(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

  function glowText(x, text, px, y, opt) {
    opt = opt || {};
    x.font = `${opt.weight || 700} ${px}px ${SERIF}`;
    x.textAlign = opt.align || "center"; x.textBaseline = "alphabetic";
    if (opt.spacing) x.letterSpacing = opt.spacing + "px";
    x.shadowColor = opt.glow || PINK; x.shadowBlur = opt.blur == null ? 24 : opt.blur;
    x.fillStyle = opt.color || LILAC; x.fillText(text, opt.x || 540, y);
    x.shadowBlur = 0; x.letterSpacing = "0px";
  }
  function star4(x, cx, cy, r, color) {
    x.save(); x.fillStyle = color; x.shadowColor = color; x.shadowBlur = 12; x.beginPath();
    x.moveTo(cx, cy - r); x.quadraticCurveTo(cx, cy, cx + r * 0.32, cy); x.quadraticCurveTo(cx, cy, cx, cy + r);
    x.quadraticCurveTo(cx, cy, cx - r * 0.32, cy); x.quadraticCurveTo(cx, cy, cx, cy - r); x.fill(); x.restore();
  }
  function diamond(x, cx, cy, r, fill, stroke) {
    x.beginPath(); x.moveTo(cx, cy - r); x.lineTo(cx + r, cy); x.lineTo(cx, cy + r); x.lineTo(cx - r, cy); x.closePath();
    if (fill) { x.fillStyle = fill; x.fill(); } if (stroke) { x.strokeStyle = stroke; x.lineWidth = 2; x.stroke(); }
  }
  function archPath(x, l, r, top, bottom, inset) {
    l += inset; r -= inset; top += inset * 1.4; bottom -= inset;
    const cx = (l + r) / 2, shoulder = top + (r - l) * 0.36;
    x.beginPath(); x.moveTo(l, bottom); x.lineTo(l, shoulder);
    x.quadraticCurveTo(l, top + (r - l) * 0.08, cx, top);
    x.quadraticCurveTo(r, top + (r - l) * 0.08, r, shoulder);
    x.lineTo(r, bottom); x.closePath();
  }

  async function draw(o) {
    const S = window.SETTINGS, sp = o.spirit, tall = o.ratio === "story";
    const W = 1080, H = tall ? 1920 : 1350, oy = tall ? 285 : 0;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d");
    const text = [S.title, "守護靈鑑定書", o.name, "的守護靈", sp.name, sp.oracle, sp.keys.join(""), S.share.hashtags, S.share.handle, S.share.footer, "最合拍的守護靈：", "線索感應度No.0123456789%黑貓密語"].join("");
    try { await Promise.all([document.fonts.load(`700 60px ${SERIF}`, text), document.fonts.load(`900 90px ${SERIF}`, text), document.fonts.load(`500 30px ${SERIF}`, text)]); } catch (e) {}
    const [bg, logo, frame, si, ...clues] = await Promise.all([load(window.ASSETS.finale.bg), load(window.ASSETS.ui.logo), load(window.ASSETS.ui.cardFrame), spiritImage(sp), ...Object.values(window.ASSETS.clue).map(load)]);

    // 背景：劇場舞台 + 藍紫漸層
    x.fillStyle = "#0c0820"; x.fillRect(0, 0, W, H);
    if (bg) { const s = Math.max(W / bg.width, H / bg.height); x.globalAlpha = 0.55; x.drawImage(bg, (W - bg.width * s) / 2, (H - bg.height * s) / 2, bg.width * s, bg.height * s); x.globalAlpha = 1; }
    let g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(14,8,40,.78)"); g.addColorStop(0.45, "rgba(40,20,90,.35)"); g.addColorStop(1, "rgba(10,6,30,.92)");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const rand = rng(sp.no * 97 + 13);
    for (let i = 0; i < 140; i++) { x.fillStyle = `rgba(255,240,255,${0.15 + rand() * 0.55})`; const r = rand() * 1.8 + 0.4; x.beginPath(); x.arc(rand() * W, rand() * H, r, 0, 7); x.fill(); }

    // 外框
    x.strokeStyle = alpha("#e9c98a", o.gold ? 0.95 : 0.45); x.lineWidth = o.gold ? 4 : 2;
    x.beginPath(); x.roundRect(28, 28, W - 56, H - 56, 26); x.stroke();
    if (o.gold) { x.lineWidth = 1.5; x.beginPath(); x.roundRect(42, 42, W - 84, H - 84, 20); x.stroke(); [[42, 42], [W - 42, 42], [42, H - 42], [W - 42, H - 42]].forEach(([a, b]) => star4(x, a, b, 22, GOLD)); }

    x.save(); x.translate(0, oy);
    // 標題
    if (logo) { const lw = 520, lh = logo.height * lw / logo.width; x.drawImage(logo, 540 - lw / 2, 112 - lh / 2 - 10, lw, lh); }
    else glowText(x, S.title, 68, 118, { weight: 900, spacing: 10 });
    x.strokeStyle = alpha("#e9c98a", 0.7); x.lineWidth = 1.5;
    x.beginPath(); x.moveTo(250, 160); x.lineTo(390, 160); x.moveTo(690, 160); x.lineTo(830, 160); x.stroke();
    star4(x, 380, 160, 10, GOLD); star4(x, 700, 160, 10, GOLD);
    glowText(x, "守護靈鑑定書", 30, 171, { weight: 700, color: GOLD, glow: "rgba(233,201,138,.6)", blur: 10, spacing: 8 });
    glowText(x, `${o.name} 的守護靈`, 40, 228, { weight: 700, color: "#ffffff", glow: PINK, blur: 18 });

    // 拱門
    const L = 250, R = 830, T = 258, B = 868;
    x.save(); archPath(x, L, R, T, B, 0); x.clip();
    g = x.createRadialGradient(540, 600, 40, 540, 600, 420);
    g.addColorStop(0, alpha(sp.color, 0.55)); g.addColorStop(0.45, "rgba(60,30,120,.55)"); g.addColorStop(1, "rgba(12,8,34,.92)");
    x.fillStyle = g; x.fillRect(L, T, R - L, B - T);
    for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(255,255,255,${rand() * 0.6})`; x.beginPath(); x.arc(L + rand() * (R - L), T + rand() * (B - T), rand() * 2 + 0.5, 0, 7); x.fill(); }
    // 守護靈
    if (si.img) {
      const box = 470, cx = 540, cy = 600;
      if (si.tint) {
        const t = tinted(si.img, sp.color, 600);
        x.shadowColor = sp.color; x.shadowBlur = 60; x.drawImage(t, cx - box / 2, cy - box / 2, box, box);
        x.shadowBlur = 24; x.drawImage(t, cx - box / 2, cy - box / 2, box, box);
      } else {
        const s = Math.min((R - L - 40) / si.img.width, (B - T - 60) / si.img.height);
        const w = si.img.width * s, h = si.img.height * s;
        x.shadowColor = sp.color; x.shadowBlur = 40; x.drawImage(si.img, cx - w / 2, B - 20 - h, w, h);
      }
      x.shadowBlur = 0;
    }
    x.restore();
    if (frame) x.drawImage(frame, 0, 0, W, 1350);
    else {
      x.strokeStyle = GOLD; x.lineWidth = 3; x.shadowColor = "rgba(233,201,138,.6)"; x.shadowBlur = 12; archPath(x, L, R, T, B, 0); x.stroke();
      x.shadowBlur = 0; x.lineWidth = 1.2; x.strokeStyle = alpha("#e9c98a", 0.6); archPath(x, L, R, T, B, 14); x.stroke();
      star4(x, 540, T - 4, 26, "#fff4dc");
      diamond(x, L, B, 7, GOLD); diamond(x, R, B, 7, GOLD);
    }
    glowText(x, `No.${String(sp.no).padStart(2, "0")}`, 24, T + 64, { weight: 500, color: GOLD, glow: "rgba(0,0,0,.6)", blur: 6, spacing: 4 });

    // 守護靈名稱
    glowText(x, sp.name, 92, 960, { weight: 900, glow: sp.color, blur: 30, spacing: 14 });
    // 關鍵字標籤
    x.font = `500 28px ${SERIF}`;
    const pads = 26, gap = 18, ws = sp.keys.map(k => x.measureText(k).width + pads * 2);
    let px = 540 - (ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1)) / 2;
    sp.keys.forEach((k, i) => {
      x.strokeStyle = alpha("#e9c98a", 0.85); x.lineWidth = 1.5; x.fillStyle = "rgba(20,12,50,.6)";
      x.beginPath(); x.roundRect(px, 994, ws[i], 48, 24); x.fill(); x.stroke();
      x.fillStyle = "#fff3dc"; x.textAlign = "center"; x.fillText(k, px + ws[i] / 2, 1028); px += ws[i] + gap;
    });
    // 籤詩
    glowText(x, `「${sp.oracle}」`, 32, 1098, { weight: 500, color: "#e6d6ff", glow: "rgba(150,100,255,.5)", blur: 10 });
    // 最合拍
    const m = window.SPIRITS.find(s => s.id === sp.match);
    if (m) glowText(x, `最合拍的守護靈：${m.name}`, 25, 1144, { weight: 500, color: "#bfb0e0", blur: 0 });
    // 線索列
    for (let i = 0; i < 8; i++) {
      const im = clues[i], tw = 72, th = 40, cx = 540 + (i - 3.5) * (tw + 10);
      if (im) {
        x.save(); x.beginPath(); x.roundRect(cx - tw / 2, 1162, tw, th, 6); x.clip();
        const s = Math.max(tw / im.width, th / im.height); x.drawImage(im, cx - im.width * s / 2, 1182 - im.height * s / 2, im.width * s, im.height * s);
        x.restore(); x.strokeStyle = alpha("#e9c98a", 0.8); x.lineWidth = 1.5; x.beginPath(); x.roundRect(cx - tw / 2, 1162, tw, th, 6); x.stroke();
      } else { diamond(x, cx, 1182, 11, "rgba(233,201,138,.85)"); star4(x, cx, 1182, 5, "#fff"); }
    }
    glowText(x, "線索 8／8 ・ 守護靈感應度 100%", 22, 1230, { weight: 500, color: "#cbbbe8", blur: 0, spacing: 2 });
    x.restore();

    // 底部
    const fy = H - 62;
    x.strokeStyle = alpha("#e9c98a", 0.4); x.lineWidth = 1; x.beginPath(); x.moveTo(140, fy - 38); x.lineTo(W - 140, fy - 38); x.stroke();
    glowText(x, S.share.hashtags, 26, fy - 4, { weight: 700, color: GOLD, glow: "rgba(233,201,138,.4)", blur: 8, spacing: 2 });
    glowText(x, `${S.share.footer}　${S.share.handle}`, 21, fy + 28, { weight: 500, color: "#a99bc9", blur: 0, spacing: 2 });
    if (o.gold) glowText(x, "✦ 黑貓密語 ✦", 20, 78, { weight: 700, color: GOLD, blur: 8, x: W - 90, align: "right" });
    return c;
  }

  return { draw, spiritImage, tinted, load };
})();
