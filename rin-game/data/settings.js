// ===== 遊戲設定（文字、名字規則、終章台詞、分享文字）=====
// 改完存檔、重新整理網頁就會生效。注意：每一行結尾的逗號、引號要保留。
// 台詞裡寫 {name} 會自動換成玩家的名字。

window.SETTINGS = {
  title: "凜界異聞錄",
  subtitle: "尋找失蹤的羅賓",
  tagline: "RiN凜 三週年紀念・守護靈互動小品",

  // ---- 名字 ----
  defaultName: "馬凜薯",
  nameMax: 8,
  // 名字會印在公開分享的結果圖上；命中以下字詞就請玩家換一個（可自行增減）
  blockedWords: ["幹", "靠北", "靠杯", "操你", "雞巴", "機掰", "白癡", "智障", "去死", "fuck", "shit", "bitch"],

  // ---- 黑貓密語（10 篇目擊證詞的提示字）----
  secretCode: "12/22三周年紀念直播見",
  secretReward: "結果圖解鎖「黑貓密語」金色卡框！",

  // ---- 終章：守護靈揭曉（說話的人用 fairy＝記憶妖精靈）----
  finale: {
    before: [
      { narr: "劇場的燈光暗了下來。凜走向第一排，而你停在入口。" },
      { narr: "口袋裡的「記憶之葉」忽然微微發亮。" },
      { say: "fairy", lines: ["{name}，還記得森林裡那些光影嗎？", "凜在找她的羅賓。而你一路上做的每一個選擇，也都被某個存在默默看著。", "其中一道光，從那時起就一直跟著你了。"] }
    ],
    after: [
      { say: "fairy", lines: ["牠一直都在。只是現在，你終於看見牠了。"] }
    ],
    // 結果圖之後的「羅賓的信」（草稿，可自由修改）
    letter: [
      "致 {name}：",
      "喵。（凜說要寫得正式一點。）",
      "謝謝你陪她走完這一趟。",
      "她總以為是自己在找我，其實我一直都在她身後——就像你的守護靈，一直在你身後一樣。",
      "下次她又只顧著往前衝的時候，記得幫我叫她回頭看一下。",
      "——羅賓"
    ]
  },

  // ---- 分享 ----
  share: {
    hashtags: "#凜界異聞錄 #我的守護靈",
    handle: "@rinrin_taiwan",
    footer: "RiN凜 三週年紀念",
    text: "我在《凜界異聞錄》找到了我的守護靈「{spirit}」！{oracle}"
  },

  typeSpeedMs: 28,          // 打字速度（毫秒／字），玩家也可以在設定裡調
  skipAfterFails: 3,        // 謎題錯幾次後出現「跳過」按鈕

  pawReward: { text: "你找齊了羅賓留下的 8 個爪印！", url: "" },

  characters: {
    rin:       { name: "凜",         color: "#e9799f" },
    fairy:     { name: "記憶妖精靈", color: "#9ad8c4" },
    knight:    { name: "龍騎士守衛", color: "#e0855f" },
    cyber:     { name: "賽博情報商", color: "#38d6e8" },
    librarian: { name: "魔法圖書員", color: "#b49bf0" },
    fortune:   { name: "神秘占卜師", color: "#c99bff" },
    alchemist: { name: "煉金坊老闆", color: "#e0a93b" },
    singer:    { name: "酒吧魅歌姬", color: "#ff7aa0" },
    captain:   { name: "星劇團團長", color: "#8fa0ff" }
  }
};

window.ACTS = [];
