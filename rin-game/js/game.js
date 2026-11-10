// 凜界異聞錄 v3｜守護靈結局版 主程式
(function () {
  const S = window.SETTINGS, A = window.ASSETS, SP = window.SPIRITS, ROBIN = window.ROBIN_CARD;
  const ACTS = window.ACTS.slice().sort((a, b) => a.id - b.id);
  const $ = id => document.getElementById(id);
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const CN = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  let cur = null, advance = null, typing = null, log = [];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- 存檔 ----------
  const q = new URLSearchParams(location.search), KEY = "rinkai-v3";
  if (q.get("reset") === "1") localStorage.removeItem(KEY);
  let save = { name: "", done: {}, clues: [], paws: [], choices: {}, forest: [], dex: [], result: "", finaleDone: false, gold: false, opt: { speed: S.typeSpeedMs || 28, bgm: 0.6, sfx: 0.8 } };
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) save = Object.assign(save, s); } catch (e) {}
  if (q.get("debug") === "1") ACTS.forEach(a => { save.done[a.id] = true; if (!save.clues.includes(a.clue.id)) save.clues.push(a.clue.id); });
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} };
  Sound.setVol("bgm", save.opt.bgm); Sound.setVol("sfx", save.opt.sfx);
  const fill = t => String(t).replace(/\{name\}/g, save.name || S.defaultName);

  // ---------- 守護靈計分 ----------
  const askOf = a => a.script.find(n => n.ask);
  function scores() {
    const s = {}; SP.forEach(x => s[x.id] = 0);
    ACTS.forEach(a => { const n = askOf(a), c = save.choices[a.id]; if (n && c != null && n.options[c]) Object.entries(n.options[c].score).forEach(([k, v]) => s[k] = (s[k] || 0) + v); });
    return s;
  }
  const pickOf = (id, lvl) => { const a = ACTS.find(x => x.id === id), c = save.choices[id]; if (!a || c == null) return null; const sc = askOf(a).options[c].score; return Object.keys(sc).find(k => sc[k] === lvl); };
  function topSpirit() {
    const s = scores(), max = Math.max(...Object.values(s));
    const tied = SP.filter(x => s[x.id] === max).map(x => x.id);
    if (tied.length === 1) return SP.find(x => x.id === tied[0]);
    // 同分：從第八章往回找，先看 +2、再看 +1 落在誰身上
    for (const lvl of [2, 1]) for (let id = ACTS.length; id >= 1; id--) { const p = pickOf(id, lvl); if (p && tied.includes(p)) return SP.find(x => x.id === p); }
    return SP.find(x => x.id === tied[0]);
  }
  const silSrc = sp => A.spiritPlaceholder.replace("{id}", sp.id);

  // ---------- 圖片 ----------
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
  // 16:9 背景鋪滿畫面（直式手機取中間），探索點跟著背景走
  function fitScenes() {
    const app = $("app"), W = app.clientWidth, H = app.clientHeight, R = 16 / 9;
    let w, hh; if (W / H > R) { w = W; hh = W / R; } else { hh = H; w = H * R; }
    const portrait = H > W;
    document.querySelectorAll(".scene").forEach(s => {
      // 直式手機探索時：整張背景完整顯示（避免光點跑出畫面）
      const cr = s.id === "title-scene" ? 1754 / 1241 : R;
      if (portrait && s.classList.contains("contain")) { const cw = W, ch = W / cr; s.style.width = cw + "px"; s.style.height = ch + "px"; s.style.left = "0px"; s.style.top = Math.max(70, (H - ch) * 0.32) + "px"; }
      // 比 16:9 還寬的螢幕：完整顯示整張圖（兩側用模糊背景補），避免上下被裁掉
      else if (!portrait && s.classList.contains("contain") && W / H > cr) { const ch = H, cw = H * cr; s.style.width = cw + "px"; s.style.height = ch + "px"; s.style.left = (W - cw) / 2 + "px"; s.style.top = "0px"; }
      else { s.style.width = w + "px"; s.style.height = hh + "px"; s.style.left = (W - w) / 2 + "px"; s.style.top = (H - hh) / 2 + "px"; }
    });
    app.classList.toggle("portrait", portrait);
    placeEgg();
  }
  // 直式手機只看得到背景中間：把隱藏爪印往中間收
  function placeEgg() {
    const egg = $("paw-egg"), a = cur && cur.paw ? cur : null; if (!egg || !a) return;
    const sc = $("play-scene"), app = $("app"), frac = Math.min(1, app.clientWidth / (sc.clientWidth || 1));
    const x = frac < 1 && !sc.classList.contains("contain") ? 50 + (a.paw.x - 50) * frac * 0.8 : a.paw.x;
    egg.style.left = x + "%"; egg.style.top = a.paw.y + "%";
  }
  addEventListener("resize", fitScenes); fitScenes();
  document.documentElement.style.setProperty("--crop", A.standCrop || 0.64);

  const clueDef = id => (ACTS.find(a => a.clue.id === id) || {}).clue || { id, name: id, desc: "" };
  function clueCard(id, small) {
    const d = clueDef(id), n = parseInt(id.replace(/\D/g, "")) || 0;
    const c = h("button", "card" + (small ? " sm" : ""));
    const ic = h("div", "card-ic", `<span>${CN[n] || "?"}</span>`);
    hasImg(A.clue[id]).then(ok => { if (ok) ic.innerHTML = `<img src="${A.clue[id]}" alt="">`; });
    c.appendChild(ic); c.appendChild(h("div", "card-name", d.name));
    return c;
  }
  const PAW_SVG = `<svg viewBox="0 0 64 64" aria-hidden="true"><g fill="currentColor"><ellipse cx="32" cy="42" rx="14" ry="12"/><ellipse cx="15" cy="27" rx="6" ry="8"/><ellipse cx="26" cy="17" rx="6" ry="8"/><ellipse cx="38" cy="17" rx="6" ry="8"/><ellipse cx="49" cy="27" rx="6" ry="8"/></g></svg>`;
  function pawIcon(el) { hasImg(A.ui.paw).then(ok => { el.innerHTML = ok ? `<img src="${A.ui.paw}" alt="">` : PAW_SVG; }); }
  // 守護靈圖：有畫好的立繪就用，沒有就用暫代剪影
  function spiritEl(sp, cls) {
    const el = h("div", "sp-art " + (cls || "")); el.style.setProperty("--c", sp.color);
    hasImg(sp.art).then(ok => { el.innerHTML = `<img src="${ok ? sp.art : silSrc(sp)}" alt="${sp.name}" class="${ok && !/\.svg$/.test(sp.art) ? "real" : "sil"}">`; });
    return el;
  }

  // ---------- 畫面、提示 ----------
  function show(id) { document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.id === id)); fitScenes(); }
  function toast(t) { const e = $("toast"); e.innerHTML = t; e.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove("on"), 2800); }

  let ovResolve = null;
  function openOv(build, opts) {
    const ov = $("ov"), p = $("ov-panel");
    if (ovResolve) { const r = ovResolve; ovResolve = null; r(); }
    p.className = "panel" + (opts && opts.cls ? " " + opts.cls : ""); p.innerHTML = "";
    ov.classList.add("on"); ov.dataset.lock = opts && opts.lock ? "1" : "";
    return new Promise(res => { ovResolve = res; build(p, closeOv); });
  }
  function closeOv(v) { $("ov").classList.remove("on"); const r = ovResolve; ovResolve = null; r && r(v); }
  $("ov").addEventListener("click", e => { if (e.target.id === "ov" && !$("ov").dataset.lock) closeOv(); });
  const btn = (p, label, cls, fn) => { const b = h("button", "btn " + (cls || ""), label); b.onclick = fn; p.appendChild(b); return b; };

  // ---------- 名字 ----------
  function validName(n) {
    n = n.trim();
    if (!n) return { ok: true, name: S.defaultName };
    if ([...n].length > S.nameMax) return { ok: false, msg: `名字最多 ${S.nameMax} 個字喔` };
    const low = n.toLowerCase();
    if ((S.blockedWords || []).some(w => low.includes(w.toLowerCase()))) return { ok: false, msg: "這個名字會印在分享圖上，換一個吧！" };
    return { ok: true, name: n };
  }
  function askName(first) {
    return openOv((p, close) => {
      p.classList.add("name-panel");
      p.appendChild(h("div", "pz-kicker", "記憶妖精靈的聲音"));
      p.appendChild(h("h2", "pz-title", first ? "迷路的旅人，請留下你的名字。" : "要換個名字嗎？"));
      p.appendChild(h("p", "pz-prompt", `名字會出現在故事和守護靈結果圖上（最多 ${S.nameMax} 字）。<br>留白就叫「${S.defaultName}」。`));
      const inp = h("input", "name-input"); inp.maxLength = 20; inp.placeholder = S.defaultName; inp.value = save.name && save.name !== S.defaultName ? save.name : "";
      p.appendChild(inp);
      const msg = h("p", "pz-msg bad", "&nbsp;"); p.appendChild(msg);
      const go = () => { const v = validName(inp.value); if (!v.ok) { msg.textContent = v.msg; return; } save.name = v.name; persist(); close(); };
      btn(p, first ? "就是這個名字" : "確定", "", go);
      if (!first) btn(p, "取消", "ghost", () => close());
      inp.addEventListener("keydown", e => { if (e.key === "Enter") go(); });
      setTimeout(() => inp.focus(), 50);
    }, { lock: !!first });
  }

  // ---------- 標題 ----------
  function initTitle() {
    $("t-title").textContent = S.title; $("t-sub").textContent = S.subtitle; $("t-tag").textContent = S.tagline;
    paintBg($("title-bg"), A.title.bg, ["#0e0b24", "#3d2a72"]); paintBg($("title-backdrop"), A.title.bg);
    $("title-text").style.display = A.title.logoInBg ? "none" : "";
    $("btn-start").textContent = save.name ? "繼續旅程" : "開始旅程";
    $("btn-reset-open").style.display = save.name ? "" : "none";
    $("btn-dex-title").style.display = save.dex.length ? "" : "none";
    show("scr-title");
  }
  $("btn-start").onclick = async () => { Sound.unlock(); Sound.bgm(A.title.bgm); if (!save.name) await askName(true); goMap(); };
  $("btn-reset-open").onclick = () => confirmReset();
  $("btn-dex-title").onclick = () => dex();

  // ---------- 地圖 ----------
  function actState(a) {
    if (save.done[a.id]) return "done";
    const prev = ACTS[ACTS.indexOf(a) - 1];
    return prev && !save.done[prev.id] ? "prev" : "open";
  }
  const allDone = () => ACTS.every(a => save.done[a.id]);
  function goMap() {
    Sound.bgm(A.title.bgm);
    paintBg($("map-bg"), A.finale.bg);
    const n = ACTS.filter(a => save.done[a.id]).length, pct = Math.round((n + (save.finaleDone ? 1 : 0)) / (ACTS.length + 1) * 100);
    $("j-name").textContent = `旅人　${save.name || S.defaultName}`; $("j-pct").textContent = `旅途進度 ${pct}%`;
    $("j-fill").style.width = pct + "%";
    $("j-sub").innerHTML = `線索 ${save.clues.length}／8　・　隱藏爪印 ${save.paws.length}／8　・　圖鑑 ${save.dex.length}／${SP.length}`;
    const list = $("act-list"); list.innerHTML = "";
    ACTS.forEach(a => {
      const st = actState(a), ch = S.characters[a.role] || {};
      const li = h("li", "act " + st); li.style.setProperty("--c", ch.color || "#fff");
      const sub = { done: "✓ 已完成・可重玩改選", open: "可以出發", prev: "完成上一章後開放" }[st];
      li.innerHTML = `<span class="no">第${CN[a.id]}章</span><span class="nm">${a.title}</span><span class="who">${ch.name || ""}</span><span class="st">${sub}</span>`;
      li.onclick = () => (st === "prev" ? toast("先完成上一章吧！") : playAct(a));
      list.appendChild(li);
    });
    const f = $("finale-card"), ready = allDone();
    f.className = "finale-card" + (ready ? " ready" : "");
    if (!ready) f.innerHTML = `<span class="f-k">終章</span><span class="f-t">你的守護靈</span><span class="f-s">走完八章後開啟</span>`;
    else if (!save.finaleDone) f.innerHTML = `<span class="f-k">終章・已開啟</span><span class="f-t">你的守護靈</span><span class="f-s">劇場的燈已經亮了</span>`;
    else { const sp = SP.find(x => x.id === save.result); f.innerHTML = `<span class="f-k">終章・已完成</span><span class="f-t">你的守護靈：${sp ? sp.name : ""}</span><span class="f-s">看結果圖／重新感應</span>`; }
    f.onclick = () => { if (!ready) return toast("先走完八章吧！"); if (!save.finaleDone) return runFinale(); finaleMenu(); };
    show("scr-map");
  }
  $("map-home").onclick = () => initTitle();
  function finaleMenu() {
    const now = topSpirit(), changed = now.id !== save.result;
    openOv((p, close) => {
      p.appendChild(h("div", "pz-kicker", "終章"));
      p.appendChild(h("h2", "pz-title", "你的守護靈"));
      p.appendChild(h("p", "end-s", changed ? `你重新做了一些選擇……<br>森林裡，似乎有另一道光影在等你。` : "要再看一次結果圖，還是重新感應一次？"));
      btn(p, changed ? "重新感應" : "看結果圖", "", () => { close(); changed ? runFinale() : showResult(); });
      if (!changed) btn(p, "重新看一次終章", "ghost", () => { close(); runFinale(); });
      btn(p, "取消", "ghost", () => close());
    });
  }

  // ---------- 遊戲進行 ----------

  function setStand(who) {
    const el = $("stand");
    if (!who) { el.classList.add("dim"); return; }
    el.classList.remove("dim");
    if (el.dataset.who === who) return;
    el.dataset.who = who;
    const ch = S.characters[who] || {}; el.style.setProperty("--c", ch.color || "#fff");
    const src = A.char[who];
    hasImg(src).then(ok => {
      if (el.dataset.who !== who) return;
      el.innerHTML = `<img src="${ok ? src : A.charFallback}" alt="${ch.name || ""}">${!ok && who !== "rin" ? `<span class="temp-tag">${ch.name}（暫代立繪）</span>` : ""}`;
      el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
    });
  }

  function typeLine(name, color, text, narr, noWait) {
    const tag = $("nametag"), tx = $("text"), dlg = $("dialog");
    text = fill(text);
    dlg.classList.add("on"); dlg.classList.toggle("narr", !!narr);
    tag.textContent = name || ""; tag.style.display = name ? "" : "none"; tag.style.setProperty("--c", color || "#fff");
    log.push({ name: name || "", text, color });
    $("next").classList.remove("on");
    return new Promise(res => {
      let i = 0; tx.textContent = "";
      const sp = save.opt.speed;
      const finish = () => { clearInterval(typing); typing = null; tx.textContent = text; if (noWait) { advance = null; res(); return; } $("next").classList.add("on"); advance = () => { advance = null; res(); }; };
      if (sp <= 0) { finish(); return; }
      typing = setInterval(() => { i++; tx.textContent = text.slice(0, i); if (i >= text.length) finish(); }, sp);
      advance = () => finish();
    });
  }
  $("scr-play").addEventListener("click", e => {
    if (e.target.closest(".topbar,.choices,.paw-egg,.explore-bar,.explore-layer,.hud")) return;
    if (advance) advance();
  });
  document.addEventListener("keydown", e => {
    if ((e.key === " " || e.key === "Enter") && $("scr-play").classList.contains("active") && !$("ov").classList.contains("on") && !$("reveal").classList.contains("on")) { e.preventDefault(); advance && advance(); }
  });

  async function say(who, lines) {
    const ch = S.characters[who] || { name: who };
    setStand(who);
    for (const l of lines) { await typeLine(ch.name, ch.color, l); }
  }
  function choose(opts, cls) {
    return new Promise(res => {
      const box = $("choices"); box.innerHTML = ""; box.className = "choices on " + (cls || "");
      $("next").classList.remove("on");
      opts.forEach((o, i) => {
        const b = h("button", "choice", esc(fill(o.text)));
        b.onclick = () => { box.className = "choices"; box.innerHTML = ""; res(i); };
        box.appendChild(b);
      });
    });
  }

  // HUD：線索槽＋守護靈感應度
  function hud(flash) {
    const box = $("hud-clues"); box.innerHTML = "";
    ACTS.forEach(a => { const s = h("span", "hslot" + (save.clues.includes(a.clue.id) ? " got" : "")); s.title = a.clue.name; box.appendChild(s); });
    const n = save.clues.length, pct = Math.min(100, n * 12), sp = topSpirit();
    $("hud-pct").textContent = `守護靈感應度 ${pct}%`;
    const sil = $("hud-sil");
    sil.innerHTML = `<img src="${silSrc(sp)}" alt="">`;
    sil.style.setProperty("--blur", Math.max(1.2, 7 - n * 0.75) + "px");
    sil.style.setProperty("--op", (0.25 + n * 0.08).toFixed(2));
    if (flash) { sil.classList.remove("flash"); void sil.offsetWidth; sil.classList.add("flash"); }
  }

  async function runNode(n, a) {
    if (n.narr != null) { setStand(null); await typeLine("", null, n.narr, true); }
    else if (n.say) await say(n.say, n.lines || []);
    else if (n.sfx) { Sound.sfx(n.sfx); setStand(null); await typeLine("", null, n.text || "", true); }
    else if (n.choice) {
      const i = await choose(n.choice);
      const o = n.choice[i];
      await say("rin", [o.text]);
      if (o.reply) await say(o.reply.who, o.reply.lines);
    }
    else if (n.ask) {
      const ch = S.characters[n.ask] || {};
      setStand(n.ask);
      await typeLine(ch.name, ch.color, n.q, false, true);
      const i = await choose(n.options, "traveler");
      save.choices[a.id] = i; persist();
      Sound.tone(880, 0.5, "sine", 0.12); Sound.tone(1320, 0.6, "sine", 0.08, 0.12);
      hud(true);
      await say(n.ask, [n.options[i].reply]);
    }
    else if (n.explore) await explore(n.explore);
    else if (n.puzzle) {
      setStand(null);
      await openOv((p, close) => Puzzles.run(n.puzzle, {
        panel: p, ownedClues: () => save.clues.slice(), clueCard, pawIcon,
        paintBg: el => paintBg(el, (A.act[a.id] || {}).bg, a.colors)
      }, () => close()), { lock: true });
    }
    else if (n.clue) await getClue(n.clue);
  }

  // 第一章：森林光影探索
  function explore(def) {
    return new Promise(res => {
      const layer = $("explore-layer"), bar = $("explore-bar");
      $("dialog").classList.remove("on"); setStand(null); $("stand").classList.add("hide");
      $("play-scene").classList.add("contain"); fitScenes();
      layer.innerHTML = ""; layer.classList.add("on"); bar.classList.add("on");
      $("explore-prompt").innerHTML = esc(def.prompt).replace(/\n/g, "<br>");
      const found = new Set();
      const upd = () => $("explore-count").textContent = `發現的光影 ${found.size}／${def.spots.length}`;
      upd();
      def.spots.forEach(s => {
        const sp = SP.find(x => x.id === s.spirit); if (!sp) return;
        const b = h("button", "wisp"); b.style.left = s.x + "%"; b.style.top = s.y + "%"; b.style.setProperty("--c", sp.color);
        b.innerHTML = `<i></i>`;
        b.onclick = e => {
          e.stopPropagation();
          if (!found.has(s.spirit)) { found.add(s.spirit); if (!save.forest.includes(s.spirit)) { save.forest.push(s.spirit); persist(); } }
          b.classList.add("seen"); upd(); Sound.tone(700 + found.size * 60, 0.4, "sine", 0.12);
          layer.querySelectorAll(".bubble").forEach(x => x.remove());
          const bub = h("div", "bubble", esc(sp.forest)); bub.style.left = Math.min(80, Math.max(20, s.x)) + "%"; bub.style.top = (s.y > 50 ? s.y - 12 : s.y + 10) + "%";
          layer.appendChild(bub); setTimeout(() => bub.remove(), 2600);
        };
        layer.appendChild(b);
      });
      $("explore-go").onclick = e => { e.stopPropagation(); layer.classList.remove("on"); bar.classList.remove("on"); layer.innerHTML = ""; $("stand").classList.remove("hide"); $("play-scene").classList.remove("contain"); fitScenes(); res(); };
    });
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
      p.appendChild(h("p", "clue-prog", `線索 ${save.clues.length}／8　・　守護靈感應度 ${Math.min(100, save.clues.length * 12)}%`));
      btn(p, "收進手帳", "", () => close());
    }, { lock: true });
    hud(true);
  }

  function resetPlay() {
    $("text").textContent = ""; $("nametag").style.display = "none"; $("dialog").classList.remove("on");
    $("stand").dataset.who = ""; $("stand").innerHTML = ""; $("stand").classList.remove("hide");
    $("explore-layer").classList.remove("on"); $("explore-bar").classList.remove("on");
    $("choices").className = "choices"; log = []; $("play-scene").classList.remove("contain");
  }

  async function playAct(a) {
    cur = a; resetPlay();
    $("act-label").textContent = `第${CN[a.id]}章・${a.title}`;
    paintBg($("play-bg"), (A.act[a.id] || {}).bg, a.colors); paintBg($("play-backdrop"), (A.act[a.id] || {}).bg, a.colors);
    $("hud").style.display = ""; hud();
    Sound.bgm((A.act[a.id] || {}).bgm);
    const egg = $("paw-egg");
    egg.style.display = save.paws.includes(a.id) ? "none" : "";
    placeEgg(); pawIcon(egg);
    egg.onclick = e => {
      e.stopPropagation();
      if (save.paws.includes(a.id)) return;
      save.paws.push(a.id); persist(); egg.style.display = "none"; Sound.sfx("meow");
      toast(`${a.paw.text}<br><small>隱藏爪印 ${save.paws.length}／${ACTS.length}</small>`);
      if (save.paws.length === ACTS.length) setTimeout(pawReward, 1200);
    };
    show("scr-play");
    await titleCard(`第${CN[a.id]}章`, a.title, a.scene);
    for (const n of a.script) { if (cur !== a) return; await runNode(n, a); }
    if (cur !== a) return;
    const firstClear = !save.done[a.id];
    save.done[a.id] = true; persist();
    await endCard(a, firstClear);
    cur = null; goMap();
  }

  function titleCard(k, t, s) {
    const el = h("div", "act-card", `<div class="k">${k}</div><div class="t">${t}</div><div class="s">${s || ""}</div>`);
    $("app").appendChild(el);
    return new Promise(res => {
      let gone = false; const go = () => { if (gone) return; gone = true; el.classList.add("out"); setTimeout(() => { el.remove(); res(); }, 500); };
      el.onclick = go; setTimeout(go, 2600);
    });
  }
  function endCard(a) {
    const next = ACTS[ACTS.indexOf(a) + 1];
    return openOv((p, close) => {
      p.classList.add("end");
      p.appendChild(h("div", "pz-kicker", `第${CN[a.id]}章　完`));
      p.appendChild(h("h2", "pz-title", a.title));
      p.appendChild(h("p", "end-s", next ? `下一章「${next.title}」已經可以出發了！` : "八章都走完了。<br><b>終章「你的守護靈」</b>已經開啟。"));
      if (!save.paws.includes(a.id)) p.appendChild(h("p", "end-hint", "這一章好像還藏著一個爪印……"));
      if (next) btn(p, "直接前往下一章", "", () => { close("next"); });
      else btn(p, "前往終章", "", () => { close("finale"); });
      btn(p, "回到地圖", "ghost", () => close());
    }, { lock: true }).then(v => {
      if (v === "next") { cur = null; setTimeout(() => playAct(next), 0); return new Promise(() => {}); }
      if (v === "finale") { cur = null; setTimeout(runFinale, 0); return new Promise(() => {}); }
    });
  }
  $("play-back").onclick = () => { cur = null; advance = null; clearInterval(typing); resetPlay(); goMap(); };

  // ---------- 終章 ----------
  async function runFinale() {
    const token = cur = { id: "finale" }; resetPlay();
    $("act-label").textContent = "終章・你的守護靈";
    paintBg($("play-bg"), A.finale.bg); paintBg($("play-backdrop"), A.finale.bg); $("hud").style.display = ""; hud();
    Sound.bgm(A.finale.bgm);
    show("scr-play");
    await titleCard("終章", "你的守護靈", "星光劇場。燈光熄滅之前。");
    for (const n of S.finale.before) { if (cur !== token) return; await runNode(n, {}); }
    if (cur !== token) return;
    const sp = topSpirit();
    $("dialog").classList.remove("on"); setStand(null); $("stand").classList.add("hide");
    await reveal(sp);
    if (cur !== token) return;
    $("stand").classList.remove("hide");
    save.result = sp.id; save.finaleDone = true;
    if (!save.dex.includes(sp.id)) save.dex.push(sp.id);
    persist(); hud();
    for (const n of S.finale.after) { if (cur !== token) return; await runNode(n, {}); }
    if (cur !== token) return;
    cur = null; showResult();
  }
  function reveal(sp) {
    return new Promise(res => {
      const r = $("reveal"); r.style.setProperty("--c", sp.color);
      $("rv-sil").innerHTML = ""; $("rv-sil").appendChild(spiritEl(sp));
      $("rv-name").innerHTML = `<small>${esc(save.name || S.defaultName)} 的守護靈</small>${sp.name}<em>${sp.keys.join("・")}</em>`;
      r.classList.remove("step2"); r.classList.add("on");
      Sound.sfx("reveal"); [523, 659, 784, 1047].forEach((f, i) => Sound.tone(f, 1.2, "sine", 0.1, i * 0.35));
      setTimeout(() => r.classList.add("step2"), 2600);
      let done = false;
      const end = () => { if (done || !r.classList.contains("step2")) return; done = true; r.classList.remove("on", "step2"); r.onclick = null; res(); };
      r.onclick = end; setTimeout(end, 7000);
    });
  }

  // ---------- 結果圖 ----------
  let ratio = "post", lastCanvas = null;
  async function showResult() {
    const sp = SP.find(x => x.id === save.result) || topSpirit();
    paintBg($("result-bg"), A.finale.bg); Sound.bgm(A.finale.bgm);
    $("r-name").innerHTML = `<small>${esc(save.name || S.defaultName)} 的守護靈</small>${sp.name}`;
    $("r-oracle").textContent = `「${sp.oracle}」`;
    show("scr-result");
    await renderCard();
  }
  async function renderCard() {
    const sp = SP.find(x => x.id === save.result) || topSpirit();
    $("result-img").classList.add("loading");
    lastCanvas = await Card.draw({ spirit: sp, name: save.name || S.defaultName, ratio, gold: save.gold });
    $("result-img").src = lastCanvas.toDataURL("image/png");
    $("result-img").classList.remove("loading");
    document.querySelectorAll("[data-ratio]").forEach(b => b.classList.toggle("on", b.dataset.ratio === ratio));
  }
  document.querySelectorAll("[data-ratio]").forEach(b => b.onclick = () => { ratio = b.dataset.ratio; renderCard(); });
  const fileName = () => `凜界異聞錄_守護靈_${save.name || S.defaultName}_${ratio === "story" ? "9x16" : "4x5"}.png`;
  const shareText = () => { const sp = SP.find(x => x.id === save.result); return fill(S.share.text).replace("{spirit}", sp.name).replace("{oracle}", sp.oracle) + `\n${S.share.hashtags} ${S.share.handle}\n${location.origin}${location.pathname}`; };
  $("r-save").onclick = () => lastCanvas && lastCanvas.toBlob(b => { const a = h("a"); a.href = URL.createObjectURL(b); a.download = fileName(); document.body.appendChild(a); a.click(); a.remove(); toast("圖片已下載"); });
  $("r-share").onclick = () => lastCanvas && lastCanvas.toBlob(async b => {
    const file = new File([b], fileName(), { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], text: shareText() }); } catch (e) {} }
    else { try { await navigator.clipboard.writeText(shareText()); } catch (e) {} $("r-save").click(); toast("這個瀏覽器不支援直接分享：<br>已下載圖片，分享文字也複製好了"); }
  });
  $("r-copy").onclick = async () => { try { await navigator.clipboard.writeText(shareText()); toast("分享文字已複製"); } catch (e) { toast("複製失敗，請手動複製"); } };
  $("r-letter").onclick = () => letter();
  $("r-dex").onclick = () => dex();
  $("r-map").onclick = () => goMap();

  function letter() {
    return openOv((p, close) => {
      p.classList.add("letter");
      p.appendChild(h("div", "pz-kicker", "一封夾在入場券背面的信"));
      const box = h("div", "letter-body");
      S.finale.letter.forEach(l => box.appendChild(h("p", "", esc(fill(l)))));
      p.appendChild(box);
      Sound.sfx("meow");
      btn(p, "收好", "", () => close());
    });
  }

  // ---------- 守護靈圖鑑 ----------
  function dex() {
    return openOv((p, close) => {
      p.classList.add("dex");
      p.appendChild(h("h2", "pz-title", "守護靈圖鑑"));
      p.appendChild(h("p", "pz-prompt", `已遇見 ${save.dex.length}／${SP.length}。重玩章節、改變旅人抉擇，就有機會遇見其他守護靈。`));
      const grid = h("div", "dex-grid"); p.appendChild(grid);
      const detail = h("div", "dex-detail", "<p class='clue-desc'>點選卡片查看</p>");
      [...SP, ROBIN].forEach(sp => {
        const open = sp.id === "robin" ? save.finaleDone : save.dex.includes(sp.id);
        const seen = save.forest.includes(sp.id);
        const c = h("button", "dex-card" + (open ? " open" : "") + (sp.id === save.result ? " mine" : ""));
        c.style.setProperty("--c", sp.color);
        c.appendChild(h("span", "dx-no", `No.${String(sp.no).padStart(2, "0")}`));
        if (open) c.appendChild(spiritEl(sp, "dx-art")); else c.appendChild(h("div", "dx-art locked", "？"));
        c.appendChild(h("span", "dx-name", open ? sp.name : seen ? "森林裡的光影" : "？？？"));
        c.onclick = () => {
          if (!open) { detail.innerHTML = `<p class="clue-desc">${sp.id === "robin" ? "完成終章後解鎖。" : seen ? `你在森林裡看過牠：「${esc(sp.forest)}」` : "還沒遇見。"}</p>`; return; }
          detail.innerHTML = `<p class="clue-desc"><b>${sp.name}</b>${sp.sub ? `（${sp.sub}）` : ""}<br>${sp.keys.join("・")}<br>「${sp.oracle}」${sp.match ? `<br><small>最合拍：${SP.find(x => x.id === sp.match).name}</small>` : ""}</p>`;
        };
        grid.appendChild(c);
      });
      p.appendChild(detail);
      btn(p, "關閉", "", () => close());
    });
  }

  // ---------- 對話紀錄 ----------
  $("btn-log").onclick = () => openOv((p, close) => {
    p.classList.add("log"); p.appendChild(h("h2", "pz-title", "對話紀錄"));
    const box = h("div", "log-list");
    log.forEach(l => { const r = h("div", "log-row" + (l.name ? "" : " narr")); if (l.name) { const n = h("b", "", esc(l.name)); n.style.color = l.color; r.appendChild(n); } r.appendChild(h("span", "", esc(l.text))); box.appendChild(r); });
    p.appendChild(box); btn(p, "關閉", "", () => close());
    setTimeout(() => box.scrollTop = box.scrollHeight, 0);
  });

  // ---------- 線索手帳 ----------
  function notebook() {
    return openOv((p, close) => {
      p.classList.add("notebook");
      p.appendChild(h("h2", "pz-title", "線索手帳"));
      p.appendChild(h("p", "clue-prog", `線索 ${save.clues.length}／8　・　守護靈感應度 ${Math.min(100, save.clues.length * 12)}%`));
      const grid = h("div", "cards"); p.appendChild(grid);
      const detail = h("p", "clue-desc", "點卡片看說明");
      ACTS.forEach(a => {
        if (save.clues.includes(a.clue.id)) {
          const c = clueCard(a.clue.id);
          c.onclick = () => {
            const ask = askOf(a), ci = save.choices[a.id], ch = S.characters[a.role] || {};
            detail.innerHTML = `<img class="clue-img" src="${A.clue[a.clue.id]}" alt="" onerror="this.remove()"><b>${a.clue.name}</b><br>${a.clue.desc}<br><small>第${CN[a.id]}章・${a.title}・來自${ch.name}${ci != null ? `<br>你的抉擇：${esc(fill(ask.options[ci].text))}` : ""}</small>`;
          };
          grid.appendChild(c);
        } else grid.appendChild(h("div", "card empty", `<div class="card-ic"><span>？</span></div><div class="card-name">尚未取得</div>`));
      });
      p.appendChild(detail);
      const pw = h("div", "paw-row");
      ACTS.forEach(a => pw.appendChild(h("span", "pw" + (save.paws.includes(a.id) ? " got" : ""), PAW_SVG)));
      p.appendChild(h("div", "pz-kicker", `隱藏爪印 ${save.paws.length}／${ACTS.length}`)); p.appendChild(pw);
      btn(p, "關閉", "", () => close());
    });
  }
  function pawReward() {
    openOv((p, close) => {
      p.appendChild(h("div", "pz-kicker", "隱藏獎勵"));
      p.appendChild(h("div", "paw-big", PAW_SVG));
      p.appendChild(h("p", "end-s", S.pawReward.text));
      if (S.pawReward.url) { const a = h("a", "btn", "領取小禮物"); a.href = S.pawReward.url; a.target = "_blank"; a.rel = "noopener"; p.appendChild(a); }
      btn(p, "關閉", "", () => close());
    });
  }

  // ---------- 設定 ----------
  const norm = s => s.replace(/\s/g, "").replace(/週/g, "周").replace(/[／]/g, "/").replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  function settings() {
    return openOv((p, close) => {
      p.appendChild(h("h2", "pz-title", "設定"));
      const nr = h("div", "set-name", `旅人名字：<b>${esc(save.name || S.defaultName)}</b>`);
      const nb = h("button", "btn ghost", "改名"); nb.onclick = async () => { await askName(false); settings(); }; nr.appendChild(nb); p.appendChild(nr);
      const row = (label, min, max, step, val, on, fmtv) => {
        const r = h("label", "set-row"); const t = h("span", "", label); const v = h("em", "", fmtv(val));
        const i = h("input"); i.type = "range"; i.min = min; i.max = max; i.step = step; i.value = val;
        i.oninput = () => { on(+i.value); v.textContent = fmtv(+i.value); persist(); };
        r.append(t, i, v); p.appendChild(r);
      };
      const sp = [60, 35, 18, 0], si = sp.indexOf(save.opt.speed);
      row("文字速度", 0, 3, 1, si >= 0 ? si : 1, x => save.opt.speed = sp[x], x => ["慢", "普通", "快", "瞬間"][x]);
      row("音樂", 0, 1, 0.1, save.opt.bgm, x => { save.opt.bgm = x; Sound.setVol("bgm", x); }, x => Math.round(x * 100) + "%");
      row("音效", 0, 1, 0.1, save.opt.sfx, x => { save.opt.sfx = x; Sound.setVol("sfx", x); Sound.sfx("meow"); }, x => Math.round(x * 100) + "%");
      const cr = h("div", "set-code");
      cr.appendChild(h("span", "", save.gold ? "黑貓密語：<b>已解鎖</b>" : "黑貓密語"));
      if (!save.gold) {
        const inp = h("input", "name-input sm"); inp.placeholder = "輸入 10 篇目擊證詞拼出的密語";
        const b = h("button", "btn ghost", "確認");
        b.onclick = () => { if (norm(inp.value) === norm(S.secretCode)) { save.gold = true; persist(); Sound.sfx("meow"); toast(S.secretReward); settings(); } else { Sound.sfx("ng"); toast("黑貓搖了搖尾巴……不是這句。"); } };
        cr.append(inp, b);
      }
      p.appendChild(cr);
      btn(p, "清除進度，重新開始", "ghost danger", () => { close(); setTimeout(confirmReset, 50); });
      btn(p, "關閉", "", () => close());
    });
  }
  function confirmReset() {
    openOv((p, close) => {
      p.appendChild(h("h2", "pz-title", "重新開始？"));
      p.appendChild(h("p", "end-s", "名字、線索卡、選擇、圖鑑都會清除。"));
      btn(p, "確定清除", "danger", () => { localStorage.removeItem(KEY); location.href = location.pathname; });
      btn(p, "取消", "ghost", () => close());
    });
  }
  document.querySelectorAll("[data-open]").forEach(b => b.onclick = e => { e.stopPropagation(); ({ notebook, settings, dex })[b.dataset.open](); });

  document.addEventListener("visibilitychange", () => { try { const c = Sound.unlock(); if (c) document.hidden ? c.suspend() : c.resume(); } catch (e) {} });
  initTitle();
})();
