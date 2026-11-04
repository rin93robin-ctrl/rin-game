# 凜界異聞錄｜尋找失蹤的羅賓（v2）

RiN凜 三週年企劃的互動小品。手機直式優先，純 HTML／CSS／JS，**不用安裝任何東西，雙擊 index.html 就能玩**。

網址：https://rin93robin-ctrl.github.io/rin-game/rin-game/

---

## 資料夾一覽

```
rin-game/
├─ index.html        遊戲本體
├─ check.html        素材檢查頁（看哪些圖／音樂已經放好）
├─ data/             ← 你會改的都在這裡
│  ├─ settings.js    標題文字、每幕開放時間、劇場倒數、角色名稱顏色
│  ├─ assets.js      所有圖片、音樂的路徑
│  └─ acts/act1.js … act8.js   每一幕的台詞與謎題
├─ assets/           ← 素材放這裡
│  ├─ bg/  char/  bgm/  icon/  ui/  sfx/
├─ css/style.css     樣式（顏色在最上面 :root）
└─ js/               程式（一般不用改）
```

## 換素材（最常用）

1. 照下表的檔名把檔案放進 `assets/` 對應資料夾。
2. 打開 `check.html`，✅ 就是放好了。
3. 缺的素材不會讓遊戲壞掉：圖片會用預設剪影／漸層，音樂會靜音，貓叫會用合成音。

| 資料夾 | 檔名 | 規格 |
|---|---|---|
| `assets/char/` | rin、fairy、knight、cyber、librarian、fortune、alchemist、singer、captain `.png` | 立繪，透明背景，高 1600px 以上 |
| `assets/bg/` | `title.jpg`、`act1.jpg`～`act8.jpg`、`finale.jpg` | 直式 1080×1920 |
| `assets/bgm/` | `title.mp3`、`act1.mp3`～`act8.mp3` | 會循環播放 |
| `assets/icon/` | `clue1.png`～`clue8.png` | 線索卡 ICON，方形 512px |
| `assets/ui/` | `logo.png`（標準字）、`paw.png`（爪印） | 透明 PNG |
| `assets/sfx/` | `meow.mp3`、`clue.mp3`、`ok.mp3`、`ng.mp3` | 貓叫、拿到線索、答對、答錯 |

想用別的檔名或 .webp？改 `data/assets.js` 裡的路徑就好。

角色 id：rin 凜／fairy 記憶妖精靈／knight 龍騎士守衛／cyber 賽博情報商／librarian 魔法圖書員／fortune 神秘占卜師／alchemist 煉金坊老闆／singer 酒吧魅歌姬／captain 星劇團團長

## 玩法

- **旅途地圖**：8 幕依序開放（時間到＋完成上一幕），完成的幕可以重玩。最下方是 12/22 劇場倒數。
- **謎題**：每幕一個，答錯不會卡關，錯 3 次會出現「跳過」。
- **線索手帳**：收集 8 張線索卡，後面的謎題會要你「出示」或「排列」它們。
- **隱藏爪印**：每幕畫面上藏著一個淡淡的爪印，8 個全找到有隱藏獎勵（`settings.js` 的 `pawReward` 可放桌布連結）。
- 對話紀錄、文字速度、音樂／音效音量都在右上角。

| 幕 | 謎題 | 類型 |
|---|---|---|
| 1 記憶妖精靈 | 記憶碎片：照順序點亮光點 | sequence（lights） |
| 2 龍騎士守衛 | 城門前找出 3 個爪印 | hunt（paw） |
| 3 賽博情報商 | 出示「騎士通行證」 | present |
| 4 魔法圖書員 | 在會移動的書架上找出古書 | pick |
| 5 神秘占卜師 | 把「異界生物與靈性契約大全」交給占卜師 | present |
| 6 煉金坊老闆 | 擦掉水晶球上的霧斑 | hunt（smudge） |
| 7 酒吧魅歌姬 | 照順序彈出旋律 | sequence（notes） |
| 8 星劇團團長 | 把 7 張線索依得到的順序排好 | order |

第 9、10 幕（劇場結局）不放進遊戲，留給 12/22 直播。

## 改台詞與謎題（data/acts/actN.js）

`script` 裡一行一個步驟，由上往下播放：

```js
{"narr": "旁白字卡"}
{"say": "rin", "lines": ["一行一次點擊", "第二行"]}
{"sfx": "meow", "text": "（播貓叫，同時顯示這段文字）"}
{"choice": [{"text": "凜說的話", "reply": {"who": "knight", "lines": ["對方回答"]}}]}
{"puzzle": { ...謎題設定... }}
{"clue": "clue2"}
```

謎題設定的共用欄位：`type`、`title`、`prompt`（`\n` 換行）、`success`（答對文字）、`wrong`（答錯文字）。各類型額外欄位：

- `sequence`：`style` 為 `"lights"` 或 `"notes"`，`rounds: [3, 4]`＝兩段，各 3、4 個
- `hunt`：`style` 為 `"paw"` 或 `"smudge"`，`spots: [[x%, y%], …]`
- `present`：`answer: "clue2"`（要出示的線索 id）
- `pick`：`options: [...]`、`answer`（正確的是第幾個，從 0 開始）、`moving: true`（會換位置）
- `order`：`items: ["clue1", …]`（正確順序）

謎題可以搬到任何位置、刪掉或加新的。**台詞是你的定稿；謎題文字、選項回覆、彩蛋文字是草擬的，可自由修改。**

改的時候注意：引號用半形 `"`，每行結尾的逗號要保留（最後一行不用）。改壞了畫面會停在標題，按 F12 看 Console 會告訴你哪一行。

## 測試用網址參數

- `?unlock=all` 忽略開放時間
- `?now=2026-12-12T20:00:00+08:00` 假裝現在是某個時間
- `?debug=1` 直接視為全部完成、拿到所有線索
- `?reset=1` 清除進度

進度存在玩家自己的瀏覽器，換裝置不會同步。
