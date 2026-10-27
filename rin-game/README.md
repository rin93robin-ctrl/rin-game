# 凜界異聞錄｜尋找失蹤的羅賓（文字互動小品）

純 HTML + CSS + JavaScript + JSON，不需安裝任何東西。手機直式優先。

## 1. 在自己電腦預覽
瀏覽器會擋住「雙擊 index.html」讀取 JSON，所以要開本機伺服器：

    cd 這個資料夾
    python3 -m http.server
    # 然後開 http://localhost:8000

## 2. 上線（擇一，免費）
- **Netlify Drop**：把整個資料夾拖到 app.netlify.com/drop，立刻有網址。
- **GitHub Pages** / **Cloudflare Pages**：上傳資料夾即可。

## 3. 放入你的素材（檔名固定，缺檔會自動用預設樣式，不會壞）
| 路徑 | 說明 |
|---|---|
| assets/char/rin.png、fairy.png、knight.png、cyber.png、librarian.png、fortune.png、alchemist.png、singer.png、captain.png | 立繪（透明背景 PNG） |
| assets/bg/act1.jpg … act8.jpg | 背景（直式 9:16 最佳，1080×1920） |
| assets/bgm/title.mp3、act1.mp3 … act8.mp3 | BGM（循環播放；手機需先點「開始」才會播） |
| assets/icon/clue1.png … clue8.png | 線索卡 ICON（方形，256px 即可） |
| assets/egg/act1.png … act8.png | 彩蛋圖（方形） |
| assets/sfx/meow.mp3 | 貓叫聲（沒放的話會用程式合成的簡易喵聲） |

角色 id 對照：rin 凜／fairy 記憶妖精靈／knight 龍騎士守衛／cyber 賽博情報商／librarian 魔法圖書員／fortune 神秘占卜師／alchemist 煉金坊老闆／singer 酒吧魅歌姬／captain 星劇團團長。

## 4. 改設定（data/config.json）
- `acts[].unlock`：每一幕解鎖時間（預設 12/9～12/16 每天 19:00，台北時間 +08:00）。
- `finaleTime`：劇場開場倒數（12/22 20:00）；`finaleUrl`：開場後顯示的直播連結。
- `reward.url`：集滿 8 張線索後圖鑑顯示的小禮物連結（空白＝只顯示文字）。
- `acts[].egg.x / y`：彩蛋位置（畫面百分比）；`text` 為彩蛋文字。
- `acts[].clue.name / desc`：線索卡名稱與說明。

## 5. 改台詞（data/story.json）
每一幕是一串 nodes：
- `{"t":"narr","text":"…"}` 旁白字卡
- `{"t":"say","who":"rin","lines":["…","…"]}` 角色台詞（一行一次點擊）
- `{"t":"sfx","name":"meow","text":"（說明字）"}` 貓叫＋字卡
- `{"t":"choice","options":[{"text":"凜的回答","reply":{"who":"knight","lines":["…"]}}]}` 選項（只增加趣味，不影響劇情）
- `{"t":"clue","id":"clue1"}` 得到線索卡

第 1～8 幕台詞依你的定稿逐句放入。**選項內容與貓叫的說明字是草擬的，可自由修改或刪除。**
第 9、10 幕（劇場結局）刻意不放進遊戲，留給 12/22 直播。

## 6. 測試用網址參數
- `?unlock=all` 全部解鎖　`?now=2026-12-12T20:00:00+08:00` 假裝現在時間　`?reset=1` 清除進度

進度存在玩家瀏覽器的 localStorage，換裝置不會同步。
