// ===== 素材清單：所有圖片、音樂的位置都在這裡 =====
// 換素材：照檔名把檔案放進 assets 資料夾，或改這裡的路徑。
// 缺檔不會壞：立繪會用 charFallback、守護靈會用暫代剪影、音樂靜音。開 check.html 看哪些已經放好。

window.ASSETS = {
  title: {
    bg:  "assets/bg/title.jpg",       // 標題畫面（目前用群像劇標準字主視覺）
    logoInBg: true,                   // 背景圖本身已有標準字 → 不再疊文字標題
    bgm: "assets/bgm/title.mp3"
  },

  // 立繪（透明背景 PNG／WebP）。合作主播的檔案還沒到之前，自動用 charFallback 暫代。
  charFallback: "assets/char/_rin_temp.webp",
  standCrop: 0.64,   // 立繪只顯示上面 64%（約到腰部＝半身）；想多露一點就調大，最多 1
  char: {
    rin:       "assets/char/rin.webp",
    fairy:     "assets/char/fairy.png",
    knight:    "assets/char/knight.png",
    cyber:     "assets/char/cyber.png",
    librarian: "assets/char/librarian.png",
    fortune:   "assets/char/fortune.png",
    alchemist: "assets/char/alchemist.png",
    singer:    "assets/char/singer.png",
    captain:   "assets/char/captain.png"
  },

  // 每一幕的背景與 BGM（背景 16:9）
  act: {
    1: { bg: "assets/bg/act1.jpg", bgm: "assets/bgm/act1.mp3" },   // 藍紫森林
    2: { bg: "assets/bg/act2.jpg", bgm: "assets/bgm/act2.mp3" },   // 城門
    3: { bg: "assets/bg/act3.jpg", bgm: "assets/bgm/act3.mp3" },   // 情報商櫃台
    4: { bg: "assets/bg/act4.jpg", bgm: "assets/bgm/act4.mp3" },   // 古老圖書館
    5: { bg: "assets/bg/act5.jpg", bgm: "assets/bgm/act5.mp3" },   // 占卜店
    6: { bg: "assets/bg/act6.jpg", bgm: "assets/bgm/act6.mp3" },   // 煉金坊
    7: { bg: "assets/bg/act7.jpg", bgm: "assets/bgm/act7.mp3" },   // 深夜酒吧
    8: { bg: "assets/bg/act8.jpg", bgm: "assets/bgm/act8.mp3" }    // 劇場大廳
  },
  finale: { bg: "assets/bg/finale.jpg", bgm: "assets/bgm/finale.mp3" },  // 劇場舞台（終章＋結果圖背景）

  // 守護靈 ICON（A 可愛版，白色單色；遊戲裡會自動套上代表色與光暈）
  // 若之後在 data/spirits.js 的 art 放了完整插畫，結果圖會改用插畫
  spiritPlaceholder: "assets/spirit/icon/{id}.svg",

  // 線索卡圖（16:9，小卡會自動裁中間）
  clue: {
    clue1: "assets/icon/clue1.jpg", clue2: "assets/icon/clue2.jpg",
    clue3: "assets/icon/clue3.jpg", clue4: "assets/icon/clue4.jpg",
    clue5: "assets/icon/clue5.jpg", clue6: "assets/icon/clue6.jpg",
    clue7: "assets/icon/clue7.jpg", clue8: "assets/icon/clue8.jpg"
  },

  ui: {
    paw:      "assets/ui/paw.png",        // 爪印 ICON
    logo:     "assets/ui/logo.png",       // 去背標準字（有放的話結果圖頂端會用它）
    cardFrame:"assets/ui/card_frame.png"  // 結果圖拱門卡框（1080×1350 透明 PNG；沒放就用程式畫的框）
  },

  sfx: {
    meow: "assets/sfx/meow.mp3", clue: "assets/sfx/clue.mp3",
    ok:   "assets/sfx/ok.mp3",   ng:   "assets/sfx/ng.mp3",
    reveal: "assets/sfx/reveal.mp3"
  }
};
