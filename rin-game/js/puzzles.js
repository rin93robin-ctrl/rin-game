// 謎題：sequence（記憶順序）、hunt（找東西）、present（出示線索）、pick（挑出正確的）、order（排順序）
window.Puzzles = (function () {
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const wait = ms => new Promise(r => setTimeout(r, ms));

  // 共用外框
  function frame(def, ctx, done) {
    const p = ctx.panel; p.innerHTML = ""; p.className = "panel puzzle";
    p.appendChild(h("div", "pz-kicker", "謎題"));
    p.appendChild(h("h2", "pz-title", def.title || ""));
    p.appendChild(h("p", "pz-prompt", (def.prompt || "").replace(/\n/g, "<br>")));
    const body = h("div", "pz-body"); p.appendChild(body);
    const msg = h("p", "pz-msg", "&nbsp;"); p.appendChild(msg);
    const foot = h("div", "pz-foot"); p.appendChild(foot);
    let fails = 0, finished = false, cleanup = [];
    const api = {
      body, foot, msg,
      say(t, cls) { msg.className = "pz-msg " + (cls || ""); msg.innerHTML = t || "&nbsp;"; },
      fail(t) {
        fails++; Sound.sfx("ng"); api.say(t || def.wrong || "再試一次。", "bad");
        p.classList.remove("shake"); void p.offsetWidth; p.classList.add("shake");
        if (fails >= (window.SETTINGS.skipAfterFails || 3) && !foot.querySelector(".skip")) {
          const s = h("button", "btn ghost skip", "跳過這個謎題");
          s.onclick = () => api.win(true); foot.appendChild(s);
        }
      },
      async win(skipped) {
        if (finished) return; finished = true; cleanup.forEach(f => f());
        if (!skipped) Sound.sfx("ok");
        api.say(skipped ? "（已跳過）" : (def.success || "成功！"), "good");
        p.classList.add("solved");
        await wait(skipped ? 500 : 1400);
        done();
      },
      onCleanup(f) { cleanup.push(f); }
    };
    return api;
  }

  // ---------- sequence ----------
  async function sequence(def, ctx, done) {
    const f = frame(def, ctx, done);
    const notes = def.style === "notes";
    const N = notes ? 5 : 6;
    const freqs = notes ? [523, 587, 659, 784, 880] : [440, 494, 554, 659, 740, 880];
    const labels = notes ? ["Do", "Re", "Mi", "Sol", "La"] : ["", "", "", "", "", ""];
    const grid = h("div", "seq " + (notes ? "notes" : "lights")); f.body.appendChild(grid);
    const pads = [];
    for (let i = 0; i < N; i++) {
      const b = h("button", "pad p" + i, labels[i]); b.disabled = true;
      b.onclick = () => press(i); grid.appendChild(b); pads.push(b);
    }
    const replay = h("button", "btn ghost", "再看一次"); f.foot.appendChild(replay);
    const rounds = def.rounds || [3, 4];
    let r = 0, seq = [], pos = 0, busy = false;

    function flash(i, d) {
      pads[i].classList.add("on"); Sound.tone(freqs[i], 0.35, notes ? "triangle" : "sine", 0.22);
      return wait(d || 380).then(() => pads[i].classList.remove("on"));
    }
    async function show() {
      busy = true; pads.forEach(p => p.disabled = true); replay.disabled = true;
      f.say(`第 ${r + 1}／${rounds.length} 段　仔細看……`);
      await wait(600);
      for (const i of seq) { await flash(i); await wait(160); }
      pos = 0; busy = false; pads.forEach(p => p.disabled = false); replay.disabled = false;
      f.say("換妳了！");
    }
    function newRound() { seq = []; for (let k = 0; k < rounds[r]; k++) { let x; do { x = Math.floor(Math.random() * N); } while (x === seq[k - 1]); seq.push(x); } show(); }
    async function press(i) {
      if (busy) return;
      flash(i, 200);
      if (i !== seq[pos]) { f.fail(notes ? "音好像不太對……" : "光點散開了……"); await wait(700); show(); return; }
      pos++;
      if (pos === seq.length) {
        r++; busy = true;
        if (r >= rounds.length) { pads.forEach(p => p.disabled = true); replay.remove(); f.win(); }
        else { f.say("很好！下一段……", "good"); await wait(900); newRound(); }
      }
    }
    replay.onclick = () => { if (!busy) show(); };
    newRound();
  }

  // ---------- hunt ----------
  function hunt(def, ctx, done) {
    const f = frame(def, ctx, done);
    const smudge = def.style === "smudge";
    const area = h("div", "hunt " + (smudge ? "orb" : "scene"));
    if (!smudge) ctx.paintBg(area);
    f.body.appendChild(area);
    const spots = def.spots || [];
    let left = spots.length;
    const count = h("span", "hunt-count"); f.foot.appendChild(count);
    const upd = () => count.textContent = smudge ? `剩下 ${left} 處霧斑` : `已找到 ${spots.length - left}／${spots.length}`;
    upd();
    spots.forEach(([x, y]) => {
      const b = h("button", "spot " + (smudge ? "smudge" : "paw"));
      b.style.left = x + "%"; b.style.top = y + "%";
      if (!smudge) ctx.pawIcon(b);
      b.onclick = () => {
        if (b.classList.contains("got")) return;
        b.classList.add("got"); left--; upd();
        Sound.tone(smudge ? 1200 : 900, 0.2, "triangle", 0.15);
        if (left === 0) f.win();
      };
      area.appendChild(b);
    });
    // 點空白處＝沒找到
    area.addEventListener("click", e => { if (e.target === area) { Sound.tone(200, 0.08, "sine", 0.06); } });
    const hint = h("button", "btn ghost", "提示"); f.foot.prepend(hint);
    hint.onclick = () => {
      const s = [...area.querySelectorAll(".spot:not(.got)")][0]; if (!s) return;
      s.classList.add("hint"); setTimeout(() => s.classList.remove("hint"), 1600);
    };
  }

  // ---------- present ----------
  function present(def, ctx, done) {
    const f = frame(def, ctx, done);
    const owned = ctx.ownedClues();
    const grid = h("div", "cards"); f.body.appendChild(grid);
    if (!owned.includes(def.answer)) owned.push(def.answer);
    owned.forEach(id => {
      const c = ctx.clueCard(id); c.classList.add("pick");
      c.onclick = () => {
        if (id === def.answer) { c.classList.add("right"); f.win(); }
        else { c.classList.add("wrong"); setTimeout(() => c.classList.remove("wrong"), 500); f.fail(); }
      };
      grid.appendChild(c);
    });
    f.say("點選要出示的線索卡");
  }

  // ---------- pick ----------
  function pick(def, ctx, done) {
    const f = frame(def, ctx, done);
    const shelf = h("div", "shelf"); f.body.appendChild(shelf);
    const books = def.options.map((t, i) => {
      const b = h("button", "book b" + (i % 6), `<span>${t.replace(/[《》]/g, "")}</span>`);
      b.onclick = () => {
        if (i === def.answer) { b.classList.add("right"); clearInterval(timer); f.win(); }
        else { b.classList.add("wrong"); setTimeout(() => b.classList.remove("wrong"), 500); f.fail(); }
      };
      return b;
    });
    const lay = () => { shelf.innerHTML = ""; shuffle(books).forEach(b => shelf.appendChild(b)); };
    lay();
    const timer = def.moving ? setInterval(() => { shelf.classList.add("move"); setTimeout(() => { lay(); shelf.classList.remove("move"); }, 220); }, 2600) : null;
    f.onCleanup(() => clearInterval(timer));
  }

  // ---------- order ----------
  function order(def, ctx, done) {
    const f = frame(def, ctx, done);
    const slots = h("div", "slots"); const pool = h("div", "cards small");
    f.body.appendChild(slots); f.body.appendChild(pool);
    const items = def.items, filled = new Array(items.length).fill(null);
    const slotEls = items.map((_, i) => { const s = h("button", "slot", `<b>${i + 1}</b>`); s.onclick = () => unplace(i); slots.appendChild(s); return s; });
    const cards = {};
    shuffle(items).forEach(id => {
      const c = ctx.clueCard(id, true); c.classList.add("pick"); cards[id] = c;
      c.onclick = () => place(id); pool.appendChild(c);
    });
    function render() {
      slotEls.forEach((s, i) => {
        s.innerHTML = `<b>${i + 1}</b>`; s.classList.toggle("full", !!filled[i]);
        if (filled[i]) s.appendChild(ctx.clueCard(filled[i], true));
      });
      Object.entries(cards).forEach(([id, c]) => c.classList.toggle("used", filled.includes(id)));
    }
    function place(id) {
      if (filled.includes(id)) return;
      const i = filled.indexOf(null); if (i < 0) return;
      filled[i] = id; Sound.tone(660 + i * 40, 0.12, "triangle", 0.12); render();
      if (!filled.includes(null)) check();
    }
    function unplace(i) { if (!filled[i] || slotEls[i].classList.contains("ok")) return; filled[i] = null; render(); }
    function check() {
      let allOk = true;
      filled.forEach((id, i) => {
        const ok = id === items[i];
        slotEls[i].classList.toggle("ok", ok);
        if (!ok) { allOk = false; filled[i] = null; }
      });
      if (allOk) { render(); slotEls.forEach(s => s.classList.add("ok")); f.win(); }
      else { f.fail("有些順序不對……亮起來的位置是對的。"); setTimeout(render, 450); }
    }
    f.say("點卡片放進格子；點格子可以拿回來");
  }

  const types = { sequence, hunt, present, pick, order };
  return {
    run(def, ctx, done) { (types[def.type] || ((d, c, cb) => cb()))(def, ctx, done); }
  };
})();
