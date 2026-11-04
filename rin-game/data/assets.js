// ===== 素材清單：所有圖片、音樂的位置都在這裡 =====
// 換素材有兩種方法：
//   1. 照下面的檔名把檔案放進 assets 資料夾（最簡單，不用改這個檔）
//   2. 想用別的檔名，就改這裡的路徑
// 缺檔不會壞：圖片會用預設樣式、音樂會靜音。開 check.html 可以看哪些素材已經放好。

window.ASSETS = {
  title: {
    bg:   "assets/bg/title.jpg",      // 標題畫面背景（直式 1080×1920）
    logo: "assets/ui/logo.png",       // 標準字（透明 PNG；沒放就顯示文字標題）
    bgm:  "assets/bgm/title.mp3"
  },

  // 立繪（透明背景 PNG，建議高 1600px 以上）
  char: {
    rin:       "assets/char/rin.png",
    fairy:     "assets/char/fairy.png",
    knight:    "assets/char/knight.png",
    cyber:     "assets/char/cyber.png",
    librarian: "assets/char/librarian.png",
    fortune:   "assets/char/fortune.png",
    alchemist: "assets/char/alchemist.png",
    singer:    "assets/char/singer.png",
    captain:   "assets/char/captain.png"
  },

  // 每一幕的背景與 BGM（背景直式 1080×1920；BGM 會循環播放）
  act: {
    1: { bg: "assets/bg/act1.jpg", bgm: "assets/bgm/act1.mp3" },
    2: { bg: "assets/bg/act2.jpg", bgm: "assets/bgm/act2.mp3" },
    3: { bg: "assets/bg/act3.jpg", bgm: "assets/bgm/act3.mp3" },
    4: { bg: "assets/bg/act4.jpg", bgm: "assets/bgm/act4.mp3" },
    5: { bg: "assets/bg/act5.jpg", bgm: "assets/bgm/act5.mp3" },
    6: { bg: "assets/bg/act6.jpg", bgm: "assets/bgm/act6.mp3" },
    7: { bg: "assets/bg/act7.jpg", bgm: "assets/bgm/act7.mp3" },
    8: { bg: "assets/bg/act8.jpg", bgm: "assets/bgm/act8.mp3" }
  },

  // 線索卡 ICON（方形 PNG，512px）
  clue: {
    clue1: "assets/icon/clue1.png",
    clue2: "assets/icon/clue2.png",
    clue3: "assets/icon/clue3.png",
    clue4: "assets/icon/clue4.png",
    clue5: "assets/icon/clue5.png",
    clue6: "assets/icon/clue6.png",
    clue7: "assets/icon/clue7.png",
    clue8: "assets/icon/clue8.png"
  },

  ui: {
    paw:    "assets/ui/paw.png",      // 爪印 ICON（隱藏收集＆第2幕謎題）
    dialog: "assets/ui/dialog.png",   // 對話框底圖（可拉伸的橫式 PNG；沒放就用預設框）
    finale: "assets/bg/finale.jpg"    // 劇場倒數畫面背景
  },

  sfx: {
    meow:  "assets/sfx/meow.mp3",     // 貓叫（沒放會用程式合成的喵聲）
    clue:  "assets/sfx/clue.mp3",     // 拿到線索
    ok:    "assets/sfx/ok.mp3",       // 謎題答對
    ng:    "assets/sfx/ng.mp3"        // 謎題答錯
  }
};
