// 音效與 BGM。缺檔時自動靜音，貓叫與音符用 WebAudio 合成。
window.Sound = (function () {
  let ctx = null, bgmEl = null, bgmSrc = "";
  const vol = { bgm: 0.6, sfx: 0.8 };
  const missing = new Set();

  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, gain, when) {
    const c = ac(); if (!c || vol.sfx <= 0) return;
    const t = c.currentTime + (when || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine"; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime((gain || 0.25) * vol.sfx, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  }

  function synthMeow() {
    const c = ac(); if (!c || vol.sfx <= 0) return;
    const t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = "sawtooth"; f.type = "bandpass"; f.Q.value = 6;
    o.frequency.setValueAtTime(520, t);
    o.frequency.linearRampToValueAtTime(820, t + 0.18);
    o.frequency.linearRampToValueAtTime(480, t + 0.55);
    f.frequency.setValueAtTime(900, t); f.frequency.linearRampToValueAtTime(1600, t + 0.2); f.frequency.linearRampToValueAtTime(700, t + 0.55);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35 * vol.sfx, t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(f).connect(g).connect(c.destination); o.start(t); o.stop(t + 0.65);
  }

  const fallback = {
    meow: synthMeow,
    clue: () => { [784, 988, 1319].forEach((f, i) => tone(f, 0.35, "triangle", 0.2, i * 0.09)); },
    ok:   () => { tone(880, 0.18, "triangle", 0.2); tone(1175, 0.3, "triangle", 0.2, 0.1); },
    ng:   () => { tone(220, 0.25, "square", 0.08); }
  };

  function sfx(name) {
    ac();
    const src = (window.ASSETS.sfx || {})[name];
    if (!src || missing.has(src)) { (fallback[name] || (() => {}))(); return; }
    const a = new Audio(src); a.volume = vol.sfx;
    a.onerror = () => { missing.add(src); (fallback[name] || (() => {}))(); };
    a.play().catch(() => {});
  }

  function bgm(src) {
    if (src === bgmSrc) return;
    bgmSrc = src;
    if (bgmEl) { const old = bgmEl; fade(old, 0, () => old.pause()); }
    bgmEl = null;
    if (!src || missing.has(src)) return;
    const a = new Audio(src); a.loop = true; a.volume = 0;
    a.onerror = () => missing.add(src);
    bgmEl = a;
    a.play().then(() => fade(a, vol.bgm)).catch(() => {});
  }

  function fade(a, to, done) {
    const from = a.volume, steps = 15; let i = 0;
    const id = setInterval(() => {
      i++; a.volume = Math.max(0, Math.min(1, from + (to - from) * i / steps));
      if (i >= steps) { clearInterval(id); done && done(); }
    }, 40);
  }

  function setVol(kind, v) { vol[kind] = v; if (kind === "bgm" && bgmEl) bgmEl.volume = v; }

  return { sfx, bgm, tone, setVol, vol, unlock: ac };
})();
