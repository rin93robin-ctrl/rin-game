/* 凜界異聞錄｜文字互動小品引擎（無框架）
   資料：data/config.json（設定）、data/story.json（台詞）。 */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const qs = new URLSearchParams(location.search);
const SAVE_KEY = 'rin-robin-save-v1', MUTE_KEY = 'rin-robin-mute';
let CFG, STORY, save, muted = false, curAct = null, queue = [], typing = null, waiting = false;
let bgm = null, bgmSrc = '', ctx = null, meowAudio = null, meowBroken = false, tickTimer = null;

/* ---------- 工具 ---------- */
const safe = (f, d) => { try { return f(); } catch (e) { return d; } };
const nowMs = () => qs.get('now') ? new Date(qs.get('now')).getTime() : Date.now();
const unlocked = a => qs.get('unlock') === 'all' || nowMs() >= new Date(a.unlock).getTime();
const fmtTime = iso => { const d = new Date(iso); const p = new Intl.DateTimeFormat('zh-TW', {timeZone:'Asia/Taipei', month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false}).formatToParts(d).reduce((o, x) => (o[x.type] = x.value, o), {}); return `${p.month}/${p.day} ${p.hour}:${p.minute}`; };
const fmtLeft = ms => { const s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return `${d} 天 ${h} 小時 ${m} 分`; };
const actCfg = id => CFG.acts.find(a => a.id === id);
const char = id => CFG.characters[id];
const show = id => { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id)); };
const loadSave = () => { if (qs.has('reset')) safe(() => localStorage.removeItem(SAVE_KEY)); return safe(() => JSON.parse(localStorage.getItem(SAVE_KEY)), null) || {done: [], clues: [], eggs: []}; };
const persist = () => safe(() => localStorage.setItem(SAVE_KEY, JSON.stringify(save)));
const fail = msg => { $('errText').textContent = msg; $('errorBox').hidden = false; };

/* ---------- 聲音 ---------- */
function audioCtx() { if (!ctx) ctx = safe(() => new (window.AudioContext || window.webkitAudioContext)(), null); if (ctx && ctx.state === 'suspended') ctx.resume(); return ctx; }
function playBgm(src) {
  if (src === bgmSrc) return;
  bgmSrc = src;
  const old = bgm;
  if (old) { let v = old.volume; const f = setInterval(() => { v -= .08; if (v <= 0) { old.pause(); clearInterval(f); } else old.volume = v; }, 60); }
  bgm = null;
  if (!src) return;
  const a = new Audio(src); a.loop = true; a.volume = muted ? 0 : .5;
  a.addEventListener('error', () => { if (bgm === a) bgm = null; });
  bgm = a;
  a.play().catch(() => {});
}
function applyMute() {
  if (bgm) bgm.volume = muted ? 0 : .5;
  ['btnMute', 'btnMute2'].forEach(i => $(i).classList.toggle('off', muted));
}
function synthMeow() {
  const c = audioCtx(); if (!c) return;
  const t = c.currentTime, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(520, t); o.frequency.linearRampToValueAtTime(900, t + .18); o.frequency.exponentialRampToValueAtTime(480, t + .62);
  f.type = 'bandpass'; f.Q.value = 4; f.frequency.setValueAtTime(900, t); f.frequency.linearRampToValueAtTime(1800, t + .2); f.frequency.linearRampToValueAtTime(800, t + .6);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.35, t + .06); g.gain.linearRampToValueAtTime(.25, t + .35); g.gain.linearRampToValueAtTime(0, t + .65);
  o.connect(f); f.connect(g); g.connect(c.destination); o.start(t); o.stop(t + .7);
}
function meow() {
  if (muted) return;
  if (meowBroken) return synthMeow();
  if (!meowAudio) { meowAudio = new Audio(CFG.meowSfx); meowAudio.addEventListener('error', () => { meowBroken = true; }); }
  meowAudio.currentTime = 0;
  meowAudio.play().catch(() => { meowBroken = true; synthMeow(); });
}

/* ---------- 選單 ---------- */
function renderMenu() {
  show('menu');
  playBgm(CFG.titleBgm);
  $('cClue').textContent = `線索 ${save.clues.length}/${CFG.acts.length}`;
  $('cEgg').textContent = `彩蛋 ${save.eggs.length}/${CFG.acts.length}`;
  const ul = $('actList'); ul.innerHTML = '';
  CFG.acts.forEach(a => {
    const s = STORY.acts.find(x => x.id === a.id);
    const done = save.done.includes(a.id), open = unlocked(a);
    const li = document.createElement('li'), b = document.createElement('button');
    b.className = 'act ' + (done ? 'done' : open ? 'open' : 'locked');
    b.innerHTML = `<span class="no">第${a.id}幕</span><span class="t"><b></b><span></span></span><span class="st"></span>`;
    b.querySelector('b').textContent = s.title;
    b.querySelector('.t span').textContent = char(a.role).name;
    b.querySelector('.st').textContent = done ? '已完成 ✓' : open ? '開始' : `${fmtTime(a.unlock)} 解鎖`;
    b.onclick = () => { if (open) startAct(a.id); };
    li.appendChild(b); ul.appendChild(li);
  });
  const fin = new Date(CFG.finaleTime).getTime(), left = fin - nowMs();
  $('finaleLine').textContent = left > 0 ? `${CFG.finaleText}・倒數 ${fmtLeft(left)}` : `${CFG.finaleText}・現在開場！`;
}

/* ---------- 舞台 ---------- */
function setPortrait(slot, id) {
  slot.innerHTML = ''; slot.dataset.id = id;
  const c = char(id), img = new Image();
  img.alt = c.name; img.src = c.img;
  img.onerror = () => { img.remove(); const p = document.createElement('div'); p.className = 'ph'; p.style.setProperty('--c', c.color); p.textContent = c.name[0]; slot.appendChild(p); };
  slot.appendChild(img);
}
function startAct(id) {
  const a = actCfg(id), s = STORY.acts.find(x => x.id === id);
  curAct = id; show('stage');
  playBgm(a.bgm);
  const bg = $('bg'); bg.style.backgroundImage = `url("${a.bg}"), linear-gradient(160deg,${a.colors[0]},${a.colors[1]})`;
  $('actName').textContent = `第${id}幕｜${s.title}`;
  setPortrait($('slotL'), 'rin'); setPortrait($('slotR'), a.role);
  $('slotL').classList.add('empty'); $('slotR').classList.add('empty');
  // 彩蛋
  const e = $('egg'), ec = a.egg;
  e.hidden = save.eggs.includes(ec.id); e.innerHTML = '';
  e.style.left = ec.x + '%'; e.style.top = ec.y + '%';
  const ei = new Image(); ei.src = ec.img; ei.onerror = () => { e.textContent = '🐾'; }; e.appendChild(ei);
  e.onclick = ev => { ev.stopPropagation(); collectEgg(a); };
  // 佇列
  queue = [];
  queue.push({k: 'scene', text: s.scene});
  s.nodes.forEach(n => expand(n, queue));
  queue.push({k: 'end'});
  step();
}
function expand(n, q) {
  if (n.t === 'narr') q.push({k: 'narr', text: n.text});
  else if (n.t === 'say') n.lines.forEach(l => q.push({k: 'say', who: n.who, text: l}));
  else if (n.t === 'sfx') q.push({k: 'sfx', text: n.text});
  else if (n.t === 'choice') q.push({k: 'choice', options: n.options});
  else if (n.t === 'clue') q.push({k: 'clue', id: n.id});
}
function focus(who) {
  const L = $('slotL'), R = $('slotR');
  if (who) {
    const sl = who === 'rin' ? L : R;
    sl.classList.remove('empty');
    L.classList.toggle('dim', sl !== L); R.classList.toggle('dim', sl !== R);
  } else { L.classList.add('dim'); R.classList.add('dim'); }
}
function showText(kind, who, text, after) {
  const d = $('dialog'), tag = $('nameTag');
  d.className = kind === 'narr' ? 'narr' : (who === 'rin' ? 'rin' : 'role');
  if (kind === 'narr') { tag.textContent = ''; focus(null); }
  else { const c = char(who); tag.textContent = c.name; tag.style.setProperty('--tag', who === 'rin' ? '#ffb3cf' : '#b9c3ff'); focus(who); }
  $('next').style.visibility = 'hidden';
  const el = $('text'); el.textContent = ''; waiting = false;
  let i = 0; const sp = CFG.typeSpeedMs || 28;
  typing = setInterval(() => { el.textContent = text.slice(0, ++i); if (i >= text.length) finishTyping(text); }, sp);
}
function finishTyping(text) { clearInterval(typing); typing = null; if (text != null) $('text').textContent = text; $('next').style.visibility = 'visible'; waiting = true; }
let curText = '';
function step() {
  waiting = false;
  const n = queue.shift();
  if (!n) return;
  if (n.k === 'scene') { $('slotL').classList.add('empty'); $('slotR').classList.add('empty'); curText = n.text; showText('narr', null, n.text); }
  else if (n.k === 'narr') { curText = n.text; showText('narr', null, n.text); }
  else if (n.k === 'say') { curText = n.text; showText('say', n.who, n.text); }
  else if (n.k === 'sfx') { meow(); curText = n.text; showText('narr', null, n.text); }
  else if (n.k === 'choice') showChoice(n);
  else if (n.k === 'clue') collectClue(n.id);
  else if (n.k === 'end') endAct();
}
function advance() {
  if (!$('stage').classList.contains('active') || !$('choices').hidden) return;
  if (typing) return finishTyping(curText);
  if (waiting) step();
}
function showChoice(n) {
  const box = $('choices'); box.hidden = false; box.innerHTML = '<p>你要怎麼回答？</p>';
  n.options.forEach(o => {
    const b = document.createElement('button'); b.textContent = o.text;
    b.onclick = ev => {
      ev.stopPropagation(); box.hidden = true;
      const rep = [{k: 'say', who: 'rin', text: o.text}, ...o.reply.lines.map(t => ({k: 'say', who: o.reply.who, text: t}))];
      queue.unshift(...rep); step();
    };
    box.appendChild(b);
  });
}
function collectClue(id) {
  const a = CFG.acts.find(x => x.clue.id === id), c = a.clue;
  const first = !save.clues.includes(id);
  if (first) { save.clues.push(id); persist(); }
  fillClue('clueIcon', c.icon, '🗝️');
  $('clueName').textContent = c.name; $('clueDesc').textContent = c.desc;
  $('clueModal').hidden = false;
}
function fillClue(boxId, src, fallback) {
  const b = $(boxId); b.innerHTML = ''; const i = new Image(); i.src = src; i.alt = '';
  i.onerror = () => { i.remove(); b.textContent = fallback; }; b.appendChild(i);
}
function collectEgg(a) {
  meow();
  if (!save.eggs.includes(a.egg.id)) { save.eggs.push(a.egg.id); persist(); }
  $('egg').hidden = true;
  fillClue('eggImg', a.egg.img, '🐾');
  $('eggText').textContent = a.egg.text;
  $('eggModal').hidden = false;
}
function endAct() {
  if (!save.done.includes(curAct)) { save.done.push(curAct); persist(); }
  const s = STORY.acts.find(x => x.id === curAct);
  $('endTitle').textContent = `第${curAct}幕完成`;
  $('endModal').hidden = false;
  const render = () => {
    const nxt = actCfg(curAct + 1), cnt = $('endCount');
    if (nxt) {
      const left = new Date(nxt.unlock).getTime() - nowMs();
      $('endText').textContent = '線索已收進圖鑑。';
      cnt.textContent = (left > 0 && qs.get('unlock') !== 'all') ? `第${nxt.id}幕將於 ${fmtTime(nxt.unlock)} 解鎖（倒數 ${fmtLeft(left)}）` : `第${nxt.id}幕已解鎖，可以繼續出發！`;
    } else {
      const left = new Date(CFG.finaleTime).getTime() - nowMs();
      $('endText').textContent = '所有線索都集齊了。最後的答案，在劇場裡等著妳。';
      cnt.textContent = left > 0 ? `${CFG.finaleText}開場倒數 ${fmtLeft(left)}（${fmtTime(CFG.finaleTime)}）` : `${CFG.finaleText}已經開場！`;
      if (left <= 0 && CFG.finaleUrl) cnt.innerHTML += `<br><a href="${CFG.finaleUrl}" target="_blank" rel="noopener" style="color:#ffb3cf">前往直播</a>`;
    }
  };
  render(); clearInterval(tickTimer); tickTimer = setInterval(render, 30000);
}

/* ---------- 圖鑑 ---------- */
function openCodex() {
  const g = $('codexGrid'); g.innerHTML = '';
  CFG.acts.forEach(a => {
    const got = save.clues.includes(a.clue.id), egg = save.eggs.includes(a.egg.id);
    const c = document.createElement('div'); c.className = 'cell' + (got ? '' : ' lock');
    if (got) { const i = new Image(); i.src = a.clue.icon; i.onerror = () => { i.remove(); c.insertAdjacentText('afterbegin', '🗝️'); }; c.appendChild(i); } else c.textContent = '？';
    const sm = document.createElement('small'); sm.textContent = got ? a.clue.name : '???'; c.appendChild(sm);
    if (egg) { const e = document.createElement('span'); e.className = 'e'; e.textContent = '🐾'; c.appendChild(e); }
    if (got) c.onclick = () => { $('clueModal').dataset.from = 'codex'; fillClue('clueIcon', a.clue.icon, '🗝️'); $('clueName').textContent = a.clue.name; $('clueDesc').textContent = a.clue.desc; $('clueModal').hidden = false; };
    g.appendChild(c);
  });
  const ban = $('codexBanner');
  if (save.clues.length >= CFG.acts.length) {
    ban.hidden = false; ban.innerHTML = CFG.reward.text + (CFG.reward.url ? ` <a href="${CFG.reward.url}" target="_blank" rel="noopener">領取小禮物</a>` : '');
  } else ban.hidden = true;
  $('codexModal').hidden = false;
}

/* ---------- 初始化 ---------- */
async function boot() {
  if (location.protocol === 'file:') return fail('用雙擊開啟時，瀏覽器會擋住資料檔讀取。\n\n請改用本機伺服器開啟：\n在資料夾裡執行  python3 -m http.server\n再打開 http://localhost:8000\n\n或直接上傳到 GitHub Pages / Netlify / Cloudflare Pages。');
  try {
    [CFG, STORY] = await Promise.all(['data/config.json', 'data/story.json'].map(u => fetch(u).then(r => { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); })));
  } catch (e) { return fail('資料檔讀取失敗：' + e.message + '\n請檢查 data/ 資料夾與 JSON 格式（可用 jsonlint 檢查）。'); }
  save = loadSave();
  muted = safe(() => localStorage.getItem(MUTE_KEY) === '1', false);
  $('tTitle').textContent = CFG.title; $('tSub').textContent = CFG.subtitle; $('tTagline').textContent = CFG.tagline;
  document.title = `${CFG.title}｜${CFG.subtitle}`;
  applyMute();
  $('btnStart').onclick = () => { audioCtx(); renderMenu(); };
  const toggle = () => { muted = !muted; safe(() => localStorage.setItem(MUTE_KEY, muted ? '1' : '0')); applyMute(); };
  $('btnMute').onclick = toggle; $('btnMute2').onclick = toggle;
  $('btnCodex').onclick = openCodex; $('codexOk').onclick = () => { $('codexModal').hidden = true; };
  $('btnReset').onclick = () => { if (confirm('確定要清除所有進度嗎？')) { save = {done: [], clues: [], eggs: []}; persist(); renderMenu(); } };
  $('btnBack').onclick = () => { clearInterval(typing); typing = null; renderMenu(); };
  $('clueOk').onclick = () => { const fromCodex = $('clueModal').dataset.from === 'codex'; $('clueModal').dataset.from = ''; $('clueModal').hidden = true; if (!fromCodex) step(); };
  $('eggOk').onclick = () => { $('eggModal').hidden = true; };
  $('endOk').onclick = () => { $('endModal').hidden = true; clearInterval(tickTimer); renderMenu(); };
  $('dialog').onclick = advance; $('stage').addEventListener('click', e => { if (e.target.id === 'stage' || e.target.id === 'chars' || e.target.id === 'bg' || e.target.closest('.slot')) advance(); });
  document.addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); advance(); } });
  window.__rin = {get save() { return save; }, startAct};
}
boot();
})();
