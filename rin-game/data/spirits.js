// ===== 守護靈資料 =====
// 順序＝同分時的優先順序。art：你畫好的立繪放這個路徑就會自動取代暫代剪影。
// match：最合拍的守護靈（結果圖上會顯示）。

window.SPIRITS = [
  { id: "cat",       no: 1, name: "月影貓", keys: ["自在", "敏銳", "把溫柔藏在心裡"], oracle: "牠不常靠近，但從不走遠。",                 forest: "樹枝上，一雙亮起又閉上的眼睛。",         color: "#b9a6ff", match: "dog",       art: "assets/spirit/cat.png" },
  { id: "dog",       no: 2, name: "暖陽犬", keys: ["真誠", "熱情", "守護身邊的人"],   oracle: "你回頭的每一次，牠都在。",                 forest: "草叢裡，有條尾巴搖了一下。",             color: "#f2c46b", match: "cat",       art: "assets/spirit/dog.png" },
  { id: "wolf",      no: 3, name: "霜牙狼", keys: ["堅定", "可靠", "說到做到"],       oracle: "約好的路，牠陪你走到最後。",               forest: "遠方的廢墟傳來一聲長嚎。",               color: "#8fd3ff", match: "fox",       art: "assets/spirit/wolf.png" },
  { id: "fox",       no: 4, name: "星尾狐", keys: ["機靈", "好奇", "幽默"],           oracle: "迷路的時候，牠會先笑一下，再帶你找路。",   forest: "兩棵樹之間，一閃而過的光尾。",           color: "#ffab8a", match: "wolf",      art: "assets/spirit/fox.png" },
  { id: "horse",     no: 5, name: "風鬃馬", keys: ["自由", "勇敢", "行動派"],         oracle: "想去的地方，牠會載你去。",                 forest: "林間小徑傳來輕輕的蹄聲。",               color: "#7fe0b0", match: "butterfly", art: "assets/spirit/horse.png" },
  { id: "butterfly", no: 6, name: "幻光蝶", keys: ["感性", "蛻變", "創造力"],         oracle: "每一次改變，牠都看在眼裡。",               forest: "跟著光點飛舞的翅膀。",                   color: "#ff9be6", match: "horse",     art: "assets/spirit/butterfly.png" },
  { id: "owl",       no: 7, name: "夜語鴞", keys: ["冷靜", "洞察", "愛思考"],         oracle: "你想不通的時候，牠已經看見答案。",         forest: "高處枝頭，有顆頭轉過來看了你一眼。",     color: "#8c95ff", match: "deer",      art: "assets/spirit/owl.png" },
  { id: "deer",      no: 8, name: "森息鹿", keys: ["溫柔", "療癒", "善於傾聽"],       oracle: "累了就停下來，牠會守著你。",               forest: "湖邊，一道低頭喝水的影子。",             color: "#fff0d6", match: "owl",       art: "assets/spirit/deer.png" },
  { id: "kiwi",      no: 9, name: "星芽奇異鳥", keys: ["踏實", "樂天", "照自己的步調"], oracle: "慢慢走也沒關係，牠會陪你走到每個明天。", forest: "落葉堆裡，一團毛球低頭啄了啄地面。", color: "#c6e07a", match: "deer",      art: "assets/spirit/kiwi.png" }
];

// 圖鑑第 10 張：完成終章後解鎖，不會是玩家的結果
window.ROBIN_CARD = {
  id: "robin", no: 10, name: "黑貓羅賓", sub: "凜的守護靈",
  keys: ["傲嬌", "愛睡", "一直都在"], oracle: "牠從來沒有離開，只是在等她回頭。",
  color: "#c08cff", art: "assets/spirit/icon/robin.svg"
};
