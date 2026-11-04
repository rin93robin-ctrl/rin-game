// 凜界異聞錄｜遊戲主程式
(function () {
  const S = window.SETTINGS, A = window.ASSETS;
  const ACTS = window.ACTS.slice().sort((a, b) => a.id - b.id);
  const $ = id => document.getElementById(id);
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const CN = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

  // ---------- 網址參數（測試用）----------
  const q = new URLSearchParams(location.search);
  const KEY = "rinkai-v2";
  if (q.get("reset") === "1") localStorage.removeItem(KEY);
  const now = () => q.get("now") ? new Date(q.get("now")) : new Date();
  const ignoreTime = q.get("unlock") === "all";

  // ---------- 存檔 ----------
  let save = { done: {}, clues: [], paws: [], opt: { speed: S.typeSpeedMs || 28, bgm: 0.6, sfx: 0.8 } };
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) save = Object.assign(save, s); } catch (e) {}
  if (q.get("debug") === "1") { ACTS.forEach(a => { save.done[a.id] = true; if (!save.clues.includes(a.clue.id)) save.clues.push(a.clue.id); }); }
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} };
  Sound.setVol("bgm", save.opt.bgm); Sound.setVol("sfx", save.opt.sfx);

  // ---------- 圖片：缺檔用預設樣式 ----------
  const imgCache = {};
  function hasImg(src) {
    if (!src) return Promise.resolve(false);
    if (!imgCache[src]) imgCache[src] = new Promise(r => { const i = new Image(); i.onload = () => r(true); i.onerror = () => r(false); i.src = src; });
    return imgCache[src];
  }
  function paintBg(el, src, colors) {
    const c = colors || ["#14112e", "#3b2a6b"];
    el.style.backgroundImage = `radial-gradient(120% 80% at 50% 0%, ${c[1]} 0%, ${c[0]} 70%)`;
    hasImg(src).then(ok => { if (ok) el.style.backgroundImage = `url("${src}")`; });
  }
  const clueDef = id => (ACTS.find(a => a.clue.id === id) || {}).clue || { id, name: id, desc: "" };
  function clueCard(id, small) {
    const d = clueDef(id), n = parseInt(id.replace(/\D/g, "")) || 0;
    const c = h("button", "card" + (small ? " sm" : ""));
    const ic = h("div", "card-ic", `<span>${CN[n] || "?"}</span>`);
    hasImg(A.clue[id]).then(ok => { if (ok) ic.innerHTML = `<img src="${A.clue[id]}" alt="">`; });
    c.appendChild(ic); c.appendChild(h("div", "card-name", d.name));
    return c;
  }
  function pawIcon(el) { hasImg(A.ui.paw).then(ok => { el.innerHTML = ok ? `<img src="${A.ui.paw}" alt="">` : PAW_SVG; }); }
  const PAW_SVG = `<svg viewBox="0 0 64 64" aria-hidden="true"><g fill="currentColor"><ellipse cx="32" cy="42" rx="14" ry="12"/><ellipse cx="15" cy="27" rx="6" ry="8"/><ellipse cx="26" cy="17" rx="6" ry="8"/><ellipse cx="38" cy="17" rx="6" ry="8"/><ellipse cx="49" cy="27" rx="6" ry="8"/></g></svg>`;

  // ---------- 畫面切換 ----------
  function show(id) { document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.id === id)); }
  function toast(t) { const e = $("toast"); e.innerHTML = t; e.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove("on"), 2600); }

  // ---------- 覆蓋層 ----------
  let ovResolve = null;
  function openOv(build, opts) {
    const ov = $("ov"), p = $("ov-panel");
    p.className = "panel"; p.innerHTML = "";
    ov.classList.add("on"); ov.dataset.lock = opts && opts.lock ? "1" : "";
    return new Promise(res => { ovResolve = res; build(p, closeOv); });
  }
  function closeOv(v) { $("ov").classList.remove("on"); const r = ovResolve; ovResolve = null; r && r(v); }
  $("ov").addEventListener("click", e => { if (e.target.id === "ov" && !$("ov").dataset.lock) closeOv(); });
  const closeBtn = (p, close, label) => { const b = h("button", "btn", label || "關閉"); b.onclick = () => close(); p.appendChild(b); return b; };

  // ---------- 標題 ----------
  function initTitle() {
    $("t-title").textContent = S.title; $("t-sub").textContent = S.subtitle; $("t-tag").textContent = S.tagline;
    paintBg($("title-bg"), A.title.bg, ["#0e0b24", "#3d2a72"]);
    hasImg(A.title.logo).then(ok => { if (ok) { $("title-logo").src = A.title.logo; $("title-logo").style.display = "block"; $("title-text").style.display = "none"; } });
    $("btn-start").onclick = () => { Sound.unlock(); Sound.bgm(A.title.bgm); goMap(); };
    $("btn-reset-open").style.display = Object.keys(save.done).length ? "" : "none";
    $("btn-reset-open").onclick = () => confirmReset();
    show("scr-title");
  }

  // ---------- 地圖 ----------
  const unlockAt = id => new Date(S.unlock[id] || 0);
  function actState(a) {
    if (save.done[a.id]) return "done";
    const prev = ACTS[ACTS.indexOf(a) - 1];
    if (!ignoreTime && now() < unlockAt(a.id)) return "time";
    if (prev && !save.done[prev.id]) return "prev";
    return "open";
  }
  const fmt = d => `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  function goMap() {
    Sound.bgm(A.title.bgm);
    const list = $("act-list"); list.innerHTML = "";
    ACTS.forEach(a => {
      const st = actState(a), ch = S.characters[a.role] || {};
      const li = h("li", "act " + st);
      li.style.setProperty("--c", ch.color || "#fff");
      const sub = { done: "✓ 已完成・可重玩", open: "可以出發", time: `${fmt(unlockAt(a.id))} 開放`, prev: "完成上一幕後開放" }[st];
      li.innerHTML = `<span class="no">第${CN[a.id]}幕</span><span class="nm">${a.title}</span><span class="who">${st === "time" ? "？？？" : ch.name || ""}</span><span class="st">${sub}</span>`;
      if (st === "open" || st === "done") li.onclick = () => playAct(a);
      else li.onclick = () => toast(st === "time" ? `第${CN[a.id]}幕將在 ${fmt(unlockAt(a.id))} 開放` : "先完成上一幕吧！");
      list.appendChild(li);
    });
    $("paw-count").innerHTML = `<span class="paw-mini">${PAW_SVG}</span> 隱藏爪印 ${save.paws.length}／${ACTS.length}`;
    renderFinale();
    show("scr-map");
  }
  function renderFinale() {
    const box = $("finale-card"), last = ACTS[ACTS.length - 1];
    const ready = last && save.done[last.id];
    const t = new Date(S.finaleTime), diff = t - now();
    let inner = `<div class="f-k">終幕</div><div class="f-t">${S.finaleText}</div>`;
    if (diff > 0) {
      const d = Math.floor(diff / 864e5), hh = Math.floor(diff % 864e5 / 36e5), mm = Math.floor(diff % 36e5 / 6e4);
      inner += `<div class="f-c">開演倒數 <b>${d}</b> 天 <b>${hh}</b> 時 <b>${mm}</b> 分</div><div class="f-s">${fmt(t)}・${ready ? "入場券已在手中" : "集齊線索，拿到入場券吧"}</div>`;
    } else {
      inner += `<div class="f-c">劇場已開演！</div>`;
      if (S.finaleUrl) inner += `<a class="btn" href="${S.finaleUrl}" target="_blank" rel="noopener">進入劇場</a>`;
    }
    box.innerHTML = inner; box.classList.toggle("ready", !!ready);
    paintBg(box, A.ui.finale, ["#0a0f2a", "#3f3f8f"]);
  }
  setInterval(() => { if ($("scr-map").classList.contains("active")) renderFinale(); }, 30000);
  $("map-home").onclick = () => initTitle();

  // ---------- 遊戲進行 ----------
  let cur = null, advance = null, typing = null, log = [];

  function setStage(a) {
    ["stand-left", "stand-right"].forEach((id, i) => {
      const who = i === 0 ? "rin" : a.role, el = $(id), ch = S.characters[who] || {};
      el.innerHTML = ""; el.dataset.who = who; el.className = "stand " + (i ? "right" : "left");
      el.style.setProperty("--c", ch.color || "#fff");
      hasImg(A.char[who]).then(ok => {
        el.innerHTML = ok ? `<img src="${A.char[who]}" alt="${ch.name}">` : `<div class="ph"><div class="ph-body"></div><span>${ch.name || who}</span></div>`;
      });
    });
  }
  function focus(who) {
    ["stand-left", "stand-right"].forEach(id => { const el = $(id); el.classList.toggle("speak", el.dataset.who === who); el.classList.toggle("dim", !!who && el.dataset.who !== who); });
  }

  function typeLine(name, color, text, narr) {
    const tag = $("nametag"), tx = $("text"), dlg = $("dialog");
    dlg.classList.toggle("narr", !!narr);
    tag.textContent = name || ""; tag.style.display = name ? "" : "none"; tag.style.setProperty("--c", color || "#fff");
    log.push({ name: name || "", text, color });
    $("next").classList.remove("on");
    return new Promise(res => {
      let i = 0; tx.textContent = "";
      const sp = save.opt.speed;
      const finish = () => { clearInterval(typing); typing = null; tx.textContent = text; $("next").classList.add("on"); advance = () => { advance = null; res(); }; };
      if (sp <= 0) { finish(); return; }
      typing = setInterval(() => { i++; tx.textContent = text.slice(0, i); if (i >= text.length) finish(); }, sp);
      advance = () => finish();
    });
  }
  // 點畫面前進
  $("scr-play").addEventListener("click", e => {
    if (e.target.closest(".topbar,.choices,.paw-egg")) return;
    if (advance) advance();
  });
  document.addEventListener("keydown", e => {
    if ((e.key === " " || e.key === "Enter") && $("scr-play").classList.contains("active") && !$("ov").classList.contains("on")) { e.preventDefault(); advance && advance(); }
  });

  async function say(who, lines) {
    const ch = S.characters[who] || { name: who };
    focus(who);
    for (const l of lines) { await typeLine(ch.name, ch.color, l); if (!cur) return; }
  }

  function choose(opts) {
    focus(null);
    return new Promise(res => {
      const box = $("choices"); box.innerHTML = ""; box.classList.add("on");
      $("next").classList.remove("on");
      opts.forEach(o => {
        const b = h("button", "choice", o.text);
        b.onclick = () => { box.classList.remove("on"); box.innerHTML = ""; res(o); };
        box.appendChild(b);
      });
    });
  }

  async function runNode(n, a) {
    if (n.narr != null) { focus(null); await typeLine("", null, n.narr, true); }
    else if (n.say) await say(n.say, n.lines || []);
    else if (n.sfx) { Sound.sfx(n.sfx); focus(null); await typeLine("", null, n.text || "", true); }
    else if (n.choice) {
      const o = await choose(n.choice);
      await say("rin", [o.text]);
      if (o.reply) await say(o.reply.who, o.reply.lines);
    }
    else if (n.puzzle) {
      focus(null);
      await openOv((p, close) => Puzzles.run(n.puzzle, {
        panel: p, ownedClues: () => save.clues.slice(),
        clueCard, pawIcon, paintBg: el => paintBg(el, (A.act[a.id] || {}).bg, a.colors)
      }, () => close()), { lock: true });
    }
    else if (n.clue) await getClue(n.clue);
  }

  async function getClue(id) {
    const first = !save.clues.includes(id);
    if (first) { save.clues.push(id); persist(); }
    Sound.sfx("clue");
    const d = clueDef(id);
    await openOv((p, close) => {
      p.classList.add("clue-get");
      p.appendChild(h("div", "pz-kicker", first ? "獲得線索" : "線索"));
      const c = clueCard(id); c.classList.add("big"); p.appendChild(c);
      p.appendChild(h("p", "clue-desc", d.desc));
      closeBtn(p, close, "收進手帳");
    }, { lock: true });
  }

  async function playAct(a) {
    cur = a; log = [];
    $("act-label").textContent = `第${CN[a.id]}幕・${a.title}`;
    paintBg($("play-bg"), (A.act[a.id] || {}).bg, a.colors);
    setStage(a); focus(null);
    $("text").textContent = ""; $("nametag").style.display = "none";
    Sound.bgm((A.act[a.id] || {}).bgm);
    // 隱藏爪印
    const egg = $("paw-egg");
    egg.style.display = save.paws.includes(a.id) ? "none" : "";
    egg.style.left = a.paw.x + "%"; egg.style.top = a.paw.y + "%"; pawIcon(egg);
    egg.onclick = () => {
      if (save.paws.includes(a.id)) return;
      save.paws.push(a.id); persist(); egg.style.display = "none"; Sound.sfx("meow");
      toast(`${a.paw.text}<br><small>隱藏爪印 ${save.paws.length}／${ACTS.length}</small>`);
      if (save.paws.length === ACTS.length) setTimeout(pawReward, 1200);
    };
    show("scr-play");
    await titleCard(a);
    for (const n of a.script) { if (cur !== a) return; await runNode(n, a); }
    if (cur !== a) return;
    const firstClear = !save.done[a.id];
    save.done[a.id] = true; persist();
    await endCard(a, firstClear);
    cur = null; goMap();
  }

  function titleCard(a) {
    const el = h("div", "act-card", `<div class="k">第${CN[a.id]}幕</div><div class="t">${a.title}</div><div class="s">${a.scene}</div>`);
    $("scr-play").appendChild(el);
    return new Promise(res => {
      let gone = false; const go = () => { if (gone) return; gone = true; el.classList.add("out"); setTimeout(() => { el.remove(); res(); }, 500); };
      el.onclick = go; setTimeout(go, 2600);
    });
  }
  function endCard(a, firstClear) {
    const next = ACTS[ACTS.indexOf(a) + 1];
    return openOv((p, close) => {
      p.classList.add("end");
      p.appendChild(h("div", "pz-kicker", `第${CN[a.id]}幕　完`));
      p.appendChild(h("h2", "pz-title", a.title));
      let s = "";
      if (next) { const t = unlockAt(next.id); s = (!ignoreTime && now() < t) ? `下一幕將在 <b>${fmt(t)}</b> 開放` : "下一幕已經可以出發了！"; }
      else s = `所有線索都到齊了。<br>${fmt(new Date(S.finaleTime))}，劇場見。`;
      p.appendChild(h("p", "end-s", s));
      if (!save.paws.includes(a.id)) p.appendChild(h("p", "end-hint", "這一幕好像還藏著一個爪印……"));
      closeBtn(p, close, "回到地圖");
    }, { lock: true });
  }
  $("play-back").onclick = () => { cur = null; advance = null; clearInterval(typing); $("choices").classList.remove("on"); goMap(); };

  // ---------- 對話紀錄 ----------
  $("btn-log").onclick = () => openOv((p, close) => {
    p.classList.add("log"); p.appendChild(h("h2", "pz-title", "對話紀錄"));
    const box = h("div", "log-list");
    log.forEach(l => { const r = h("div", "log-row" + (l.name ? "" : " narr")); if (l.name) { const n = h("b", "", l.name); n.style.color = l.color; r.appendChild(n); } r.appendChild(h("span", "", l.text)); box.appendChild(r); });
    p.appendChild(box); closeBtn(p, close);
    setTimeout(() => box.scrollTop = box.scrollHeight, 0);
  });

  // ---------- 線索手帳 ----------
  function notebook() {
    return openOv((p, close) => {
      p.classList.add("notebook");
      p.appendChild(h("h2", "pz-title", "線索手帳"));
      const grid = h("div", "cards"); p.appendChild(grid);
      const detail = h("p", "clue-desc", "點卡片看說明");
      ACTS.forEach(a => {
        if (save.clues.includes(a.clue.id)) {
          const c = clueCard(a.clue.id); c.onclick = () => { detail.innerHTML = `<b>${a.clue.name}</b><br>${a.clue.desc}`; }; grid.appendChild(c);
        } else grid.appendChild(h("div", "card empty", `<div class="card-ic"><span>？</span></div><div class="card-name">尚未取得</div>`));
      });
      p.appendChild(detail);
      const pw = h("div", "paw-row");
      ACTS.forEach(a => { const s = h("span", "pw" + (save.paws.includes(a.id) ? " got" : ""), PAW_SVG); pw.appendChild(s); });
      p.appendChild(h("div", "pz-kicker", `隱藏爪印 ${save.paws.length}／${ACTS.length}`)); p.appendChild(pw);
      if (save.paws.length === ACTS.length) { const b = h("button", "btn ghost", "爪印獎勵"); b.onclick = () => { close(); setTimeout(pawReward, 50); }; p.appendChild(b); }
      closeBtn(p, close);
    });
  }
  function pawReward() {
    openOv((p, close) => {
      p.appendChild(h("div", "pz-kicker", "隱藏獎勵"));
      p.appendChild(h("div", "paw-big", PAW_SVG));
      p.appendChild(h("p", "end-s", S.pawReward.text));
      if (S.pawReward.url) { const a = h("a", "btn", "領取小禮物"); a.href = S.pawReward.url; a.target = "_blank"; a.rel = "noopener"; p.appendChild(a); }
      closeBtn(p, close);
    });
  }

  // ---------- 設定 ----------
  function settings() {
    return openOv((p, close) => {
      p.appendChild(h("h2", "pz-title", "設定"));
      const row = (label, min, max, step, val, on, fmtv) => {
        const r = h("label", "set-row"); const t = h("span", "", label); const v = h("em", "", fmtv(val));
        const i = h("input"); i.type = "range"; i.min = min; i.max = max; i.step = step; i.value = val;
        i.oninput = () => { on(+i.value); v.textContent = fmtv(+i.value); persist(); };
        r.append(t, i, v); p.appendChild(r);
      };
      row("文字速度", 0, 3, 1, [60, 35, 18, 0].indexOf(save.opt.speed) >= 0 ? [60, 35, 18, 0].indexOf(save.opt.speed) : 1,
        x => save.opt.speed = [60, 35, 18, 0][x], x => ["慢", "普通", "快", "瞬間"][x]);
      row("音樂", 0, 1, 0.1, save.opt.bgm, x => { save.opt.bgm = x; Sound.setVol("bgm", x); }, x => Math.round(x * 100) + "%");
      row("音效", 0, 1, 0.1, save.opt.sfx, x => { save.opt.sfx = x; Sound.setVol("sfx", x); Sound.sfx("meow"); }, x => Math.round(x * 100) + "%");
      const rs = h("button", "btn ghost danger", "清除進度，重新開始"); rs.onclick = () => { close(); setTimeout(confirmReset, 50); }; p.appendChild(rs);
      closeBtn(p, close);
    });
  }
  function confirmReset() {
    openOv((p, close) => {
      p.appendChild(h("h2", "pz-title", "重新開始？"));
      p.appendChild(h("p", "end-s", "線索卡、爪印與已完成的幕都會清除。"));
      const y = h("button", "btn danger", "確定清除"); y.onclick = () => { localStorage.removeItem(KEY); location.href = location.pathname; };
      p.appendChild(y); closeBtn(p, close, "取消");
    });
  }
  document.querySelectorAll("[data-open]").forEach(b => b.onclick = e => { e.stopPropagation(); (b.dataset.open === "notebook" ? notebook : settings)(); });

  initTitle();
})();
