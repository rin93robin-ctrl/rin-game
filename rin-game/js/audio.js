// 音效與 BGM。缺檔時自動靜音，貓叫與音符用 WebAudio 合成。
window.Sound = (function () {
  let ctx = null, bgmSrc = "";
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

  // BGM：優先用 WebAudio 無縫循環；本機雙擊開啟（file://）或解碼失敗時退回 <audio loop>
  const bufCache = {};
  let cur = null;   // { stop(), setVol(v) }
  function stopCur() { if (cur) { const c = cur; cur = null; c.stop(); } }
  async function loadBuf(src) {
    if (!bufCache[src]) bufCache[src] = fetch(src).then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(b => ac().decodeAudioData(b));
    return bufCache[src];
  }
  // MP3 編碼器會在頭尾補一點靜音，循環時跳過
  function trimPoints(buf) {
    const d = buf.getChannelData(0), n = d.length, lim = Math.min(4000, n >> 2);
    let s = 0, e = n - 1;
    while (s < lim && Math.abs(d[s]) < 1e-6) s++;
    while (e > n - lim && Math.abs(d[e]) < 1e-6) e--;
    return [s / buf.sampleRate, (e + 1) / buf.sampleRate];
  }
  async function bgm(src) {
    if (src === bgmSrc) return;
    bgmSrc = src; stopCur();
    if (!src || missing.has(src)) return;
    const c = ac();
    if (c && location.protocol !== "file:") {
      try {
        const buf = await loadBuf(src);
        if (bgmSrc !== src) return;
        const s = c.createBufferSource(), g = c.createGain();
        const [ls, le] = trimPoints(buf);
        s.buffer = buf; s.loop = true; s.loopStart = ls; s.loopEnd = le;
        g.gain.value = 0; s.connect(g).connect(c.destination); s.start(0, ls);
        g.gain.linearRampToValueAtTime(vol.bgm, c.currentTime + 1.5);
        cur = {
          stop() { const t = c.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 0.9); s.stop(t + 1); },
          setVol(v) { g.gain.cancelScheduledValues(c.currentTime); g.gain.setValueAtTime(v, c.currentTime); }
        };
        return;
      } catch (e) { delete bufCache[src]; }
    }
    const a = new Audio(src); a.loop = true; a.volume = 0;
    a.onerror = () => missing.add(src);
    a.play().then(() => fade(a, vol.bgm)).catch(() => {});
    cur = { stop() { fade(a, 0, () => a.pause()); }, setVol(v) { a.volume = v; } };
  }

  function fade(a, to, done) {
    const from = a.volume, steps = 15; let i = 0;
    const id = setInterval(() => {
      i++; a.volume = Math.max(0, Math.min(1, from + (to - from) * i / steps));
      if (i >= steps) { clearInterval(id); done && done(); }
    }, 40);
  }

  function setVol(kind, v) { vol[kind] = v; if (kind === "bgm" && cur) cur.setVol(v); }

  return { sfx, bgm, tone, setVol, vol, unlock: ac };
})();
