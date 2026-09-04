(function () {
  "use strict";

  var api = window.SelfGameConfig;
  if (!api) return;

  var FIXED_POKER_ROOM_COUNT = 4;

  var teenPattiProbabilityRows = [
    { key: "highLow", label: "10以下的高牌（包含10）", count: 4620, natural: 2090, good1: 1558, good2: 1126, good3: 701, basis: "最高牌面≤10，且不属于对子、同花或顺子" },
    { key: "highHigh", label: "10以上的高牌", count: 11820, natural: 5348, good1: 5581, good2: 5761, good3: 5889, basis: "最高牌面≥J，且不属于对子、同花或顺子" },
    { key: "pairLow", label: "10以下的对子（包含10）", count: 2592, natural: 1173, good1: 1224, good2: 1263, good3: 1291, basis: "对子点数≤10，且不是三条" },
    { key: "pairHigh", label: "10以上的对子", count: 1152, natural: 521, good1: 622, good2: 689, good3: 799, basis: "对子点数≥J，且不是三条" },
    { key: "flushLow", label: "10以下的同花（包含10）", count: 308, natural: 139, good1: 152, good2: 164, good3: 173, basis: "三张同花、非顺子，最高牌面≤10" },
    { key: "flushHigh", label: "10以上的同花", count: 788, natural: 357, good1: 443, good2: 524, good3: 615, basis: "三张同花、非顺子，最高牌面≥J" },
    { key: "straightLow", label: "10以下的顺子（包含10）", count: 480, natural: 217, good1: 237, good2: 255, good3: 270, basis: "非同花顺；A-2-3 或顺子最高牌面≤10" },
    { key: "straightHigh", label: "10以上的顺子", count: 240, natural: 109, good1: 135, good2: 170, good3: 208, basis: "非同花顺；顺子最高牌面≥J" },
    { key: "straightFlush", label: "同花顺", count: 48, natural: 22, good1: 23, good2: 23, good3: 27, basis: "三张同花且连续，独立于高低分档" },
    { key: "trips", label: "三条", count: 52, natural: 24, good1: 25, good2: 25, good3: 27, basis: "三张牌点数相同，独立于高低分档" }
  ];

  var games = [
    { code: "SLOT-1001", name: "星穹宝藏", type: "SLOTS", inventory: 68420, rtp: 96.0, updated: "2026-08-18 09:30", capability: { freeGamePurchase: true, baseBets: [1, 5, 10, 50] }, enabledBets: [1, 5, 10], freeGameAllowed: true, records: [{ time: "2026-08-18 09:30", game: "星穹宝藏", action: "更新玩法配置", before: "95.0%", after: "96.0%", operator: "运营管理员" }] },
    { code: "SLOT-1002", name: "黄金矿场", type: "SLOTS", inventory: 52480, rtp: 95.0, updated: "2026-08-17 16:20", capability: { freeGamePurchase: false, baseBets: [0.5, 1, 2, 5] }, enabledBets: [0.5, 1, 2], freeGameAllowed: false, records: [{ time: "2026-08-17 16:20", game: "黄金矿场", action: "更新玩法配置", before: "94.5%", after: "95.0%", operator: "运营管理员" }] },
    { code: "SLOT-1003", name: "霓虹水果机", type: "SLOTS", inventory: 38120, rtp: 97.0, updated: "2026-08-16 11:05", capability: { freeGamePurchase: true, baseBets: [1, 2, 5, 10, 20] }, enabledBets: [1, 2, 5, 10], freeGameAllowed: false, records: [] },
    { code: "FISH-2001", name: "深海猎场", type: "FISH", inventory: 44280, rtp: 95.5, updated: "2026-08-18 10:05", capability: { levels: 6, minAmount: 0.1, maxAmount: 100, step: 0.1 }, cannons: [{ level: 1, amount: 0.1 }, { level: 2, amount: 0.5 }, { level: 3, amount: 1 }, { level: 4, amount: 5 }, { level: 5, amount: 10 }, { level: 6, amount: 50 }], records: [] },
    { code: "FISH-2002", name: "极地捕鱼王", type: "FISH", inventory: 29760, rtp: 96.5, updated: "2026-08-17 14:18", capability: { levels: 5, minAmount: 0.1, maxAmount: 50, step: 0.1 }, cannons: [{ level: 1, amount: 0.1 }, { level: 2, amount: 0.2 }, { level: 3, amount: 1 }, { level: 4, amount: 5 }, { level: 5, amount: 20 }], records: [{ time: "2026-08-17 14:18", game: "极地捕鱼王", action: "更新玩法配置", before: "96.0%", after: "96.5%", operator: "运营管理员" }] },
    { code: "FISH-2003", name: "黄金海岸", type: "FISH", inventory: 18450, rtp: 94.0, updated: "2026-08-16 09:40", capability: { levels: 4, minAmount: 1, maxAmount: 100, step: 1 }, cannons: [{ level: 1, amount: 1 }, { level: 2, amount: 5 }, { level: 3, amount: 10 }, { level: 4, amount: 50 }], records: [] },
    { code: "POK-3001", name: "极速德州", type: "Poker", rtp: 95.0, updated: "2026-08-18 08:55", capability: { roomTypes: ["低分房", "中分房", "高分房", "VIP房"], scoreUnit: "积分" }, rooms: [
      { id: 1, code: "P-L", name: "低分房", baseScore: 1, minEntry: 100, tableNum: 3, joinTableCountLimit: 6, maxRobotNum: 3, robotNum: [1, 1, 0], minGold: 100, maxGold: 10000, exitGameMinGold: 10, exitGameMaxGold: 20000, minPlayTime: 5, maxPlayTime: 120, minPlayRound: 1, maxPlayRound: 50 },
      { id: 2, code: "P-M", name: "中分房", baseScore: 10, minEntry: 1000, tableNum: 3, joinTableCountLimit: 6, maxRobotNum: 2, robotNum: [0, 1, 1], minGold: 1000, maxGold: 50000, exitGameMinGold: 100, exitGameMaxGold: 100000, minPlayTime: 5, maxPlayTime: 180, minPlayRound: 1, maxPlayRound: 80 },
      { id: 3, code: "P-H", name: "高分房", baseScore: 100, minEntry: 10000, tableNum: 2, joinTableCountLimit: 6, maxRobotNum: 1, robotNum: [0, 1], minGold: 10000, maxGold: 500000, exitGameMinGold: 1000, exitGameMaxGold: 1000000, minPlayTime: 10, maxPlayTime: 240, minPlayRound: 1, maxPlayRound: 100 },
      { id: 4, code: "P-VIP", name: "VIP房", baseScore: 500, minEntry: 50000, tableNum: 1, joinTableCountLimit: 6, maxRobotNum: 1, robotNum: [0], minGold: 50000, maxGold: 2000000, exitGameMinGold: 5000, exitGameMaxGold: 5000000, minPlayTime: 10, maxPlayTime: 240, minPlayRound: 1, maxPlayRound: 120 }
    ], records: [{ time: "2026-08-18 08:55", game: "极速德州", action: "更新玩法配置", before: "94.0%", after: "95.0%", operator: "运营管理员" }] },
    { code: "POK-3002", name: "短牌扑克", type: "Poker", rtp: 94.5, updated: "2026-08-17 12:30", capability: { roomTypes: ["低分房", "中分房", "高分房", "VIP房"], scoreUnit: "积分" }, rooms: [
      { id: 1, code: "S-L", name: "低分房", baseScore: 2, minEntry: 200, tableNum: 2, joinTableCountLimit: 6, maxRobotNum: 2, robotNum: [1, 0], minGold: 200, maxGold: 20000, exitGameMinGold: 20, exitGameMaxGold: 40000, minPlayTime: 5, maxPlayTime: 120, minPlayRound: 1, maxPlayRound: 60 },
      { id: 2, code: "S-M", name: "中分房", baseScore: 10, minEntry: 1000, tableNum: 2, joinTableCountLimit: 6, maxRobotNum: 1, robotNum: [0, 1], minGold: 1000, maxGold: 50000, exitGameMinGold: 100, exitGameMaxGold: 100000, minPlayTime: 5, maxPlayTime: 180, minPlayRound: 1, maxPlayRound: 80 },
      { id: 3, code: "S-H", name: "高分房", baseScore: 50, minEntry: 5000, tableNum: 2, joinTableCountLimit: 6, maxRobotNum: 1, robotNum: [0, 1], minGold: 5000, maxGold: 250000, exitGameMinGold: 500, exitGameMaxGold: 500000, minPlayTime: 10, maxPlayTime: 240, minPlayRound: 1, maxPlayRound: 100 },
      { id: 4, code: "S-VIP", name: "VIP房", baseScore: 200, minEntry: 20000, tableNum: 1, joinTableCountLimit: 6, maxRobotNum: 1, robotNum: [0], minGold: 20000, maxGold: 1000000, exitGameMinGold: 2000, exitGameMaxGold: 2000000, minPlayTime: 10, maxPlayTime: 240, minPlayRound: 1, maxPlayRound: 120 }
    ], records: [] },
    { code: "TP-3001", name: "Teen Patti", type: "Poker", isTeenPatti: true, rtp: 95.0, updated: "2026-08-24 10:00", capability: { roomTypes: ["低分房", "中分房", "高分房", "VIP房"], scoreUnit: "积分" }, rooms: [
      { id: 1, code: "TP-L", name: "低分房", baseScore: 10, minEntry: 100, tableNum: 3, joinTableCountLimit: 6, maxRobotNum: 3, robotNum: [1, 1, 0], minGold: 1000, maxGold: 100000, exitGameMinGold: 100, exitGameMaxGold: 200000, minPlayTime: 5, maxPlayTime: 120, minPlayRound: 1, maxPlayRound: 50 },
      { id: 2, code: "TP-M", name: "中分房", baseScore: 50, minEntry: 500, tableNum: 3, joinTableCountLimit: 6, maxRobotNum: 2, robotNum: [0, 1, 1], minGold: 5000, maxGold: 500000, exitGameMinGold: 500, exitGameMaxGold: 1000000, minPlayTime: 5, maxPlayTime: 180, minPlayRound: 1, maxPlayRound: 80 },
      { id: 3, code: "TP-H", name: "高分房", baseScore: 100, minEntry: 1000, tableNum: 2, joinTableCountLimit: 6, maxRobotNum: 1, robotNum: [0, 1], minGold: 10000, maxGold: 1000000, exitGameMinGold: 1000, exitGameMaxGold: 2000000, minPlayTime: 10, maxPlayTime: 240, minPlayRound: 1, maxPlayRound: 100 },
      { id: 4, code: "TP-VIP", name: "VIP房", baseScore: 500, minEntry: 5000, tableNum: 1, joinTableCountLimit: 6, maxRobotNum: 1, robotNum: [0], minGold: 50000, maxGold: 2000000, exitGameMinGold: 5000, exitGameMaxGold: 5000000, minPlayTime: 10, maxPlayTime: 240, minPlayRound: 1, maxPlayRound: 120 }
    ], robotRules: {
      controlMode: "natural",
      goodModeEnabled: false,
      goodMode: "good1",
      roomBotSwitch: true,
      pointControlEnabled: false,
      controlBands: [
        { key: "naturalFull", label: "库存充足 / 完全不控", min: 80, max: 100, action: "自然概率", status: "已确认" },
        { key: "naturalLight", label: "库存充足 / 轻微控制", min: 60, max: 80, action: "好牌强度 1", status: "待配置" },
        { key: "normal", label: "库存不足 / 普通控制", min: 40, max: 60, action: "好牌强度 2", status: "待配置" },
        { key: "point", label: "点控命中", min: 0, max: 40, action: "默认关闭，需授权", status: "待确认" }
      ],
      entry: { count: 3, games: 50, start: "00:00", end: "23:59", poolId: "TP-POOL-01", segment: "TP-3001-0001~0999" },
      game: { gameId: "teen-patti", ruleVersion: "v1", behaviorMode: "current-hand-only", minPlayers: 2, maxPlayers: 5, boot: 10, startingStack: 100000, blind: "1 / 2", seen: "2 / 4", maxBlindBets: 4, maxBetMultiplier: 128, maxPotMultiplier: 1024 },
      probabilityRows: teenPattiProbabilityRows
    }, records: [{ time: "2026-08-24 10:00", game: "Teen Patti", action: "新增游戏设定", before: "-", after: "自然发牌", operator: "运营管理员" }] },
    { code: "MINI-4001", name: "极速飞车", type: "Mini", miniType: "Crash", rtp: 96.5, updated: "2026-08-17 17:10", capability: { fields: ["最大结算倍数", "自动结束阈值"] }, params: [{ key: "maxMultiplier", label: "最大结算倍数", value: "500", unit: "倍", type: "number", min: 1, max: 10000, step: 1 }, { key: "autoStop", label: "自动结束阈值", value: "1.2", unit: "倍", type: "number", min: 1, max: 100, step: 0.1 }], records: [] },
    { code: "MINI-4002", name: "地雷宝藏", type: "Mini", miniType: "Mines", rtp: 95.5, updated: "2026-08-16 15:45", capability: { fields: ["雷区数量", "风险档位"] }, params: [{ key: "mineCount", label: "雷区数量", value: "5", unit: "个", type: "number", min: 1, max: 24, step: 1 }, { key: "riskLevel", label: "风险档位", value: "中", unit: "", type: "select", options: ["低", "中", "高"] }], records: [{ time: "2026-08-16 15:45", game: "地雷宝藏", action: "更新玩法配置", before: "95.0%", after: "95.5%", operator: "运营管理员" }] },
    { code: "MINI-4003", name: "弹珠风险台", type: "Mini", miniType: "Plinko", rtp: 94.0, updated: "2026-08-15 10:22", capability: { fields: ["风险档位", "落点行数"] }, params: [{ key: "riskLevel", label: "风险档位", value: "中", unit: "", type: "select", options: ["低", "中", "高"] }, { key: "rows", label: "落点行数", value: "12", unit: "行", type: "number", min: 8, max: 20, step: 1 }], records: [] }
  ];
  var defaultPokerRobotRules = {
    controlMode: "natural",
    goodModeEnabled: false,
    goodMode: "good1"
  };
  var records = [];
  var activeType = "全部";
  var editingIndex = -1;
  var activeModule = "";
  var editingBefore = "";
  var inventoryMode = "edit";
  var inventoryRecords = [];
  var inventoryGameIndex = -1;

  games.forEach(function (game) {
    if (game.type === "Poker") game.robotRules = Object.assign({}, defaultPokerRobotRules, game.robotRules || {});
  });
  games.forEach(function (game) { records = records.concat(game.records || []); });
  games.forEach(function (game, index) {
    if (game.type !== "Poker" && !isFinite(Number(game.inventory))) game.inventory = [68420, 52480, 38120, 44280, 29760, 18450, 12680, 19840, 15620, 11240, 9840, 13260][index] || 0;
    if (!isFinite(Number(game.inventoryOffset))) game.inventoryOffset = 0;
  });
  var pokerInventoryDefaults = {
    "POK-3001": [
      { inventory: 12800, controlEnabled: false, enterThreshold: 10000, releaseThreshold: 15000 },
      { inventory: 8400, controlEnabled: false, enterThreshold: 8000, releaseThreshold: 12000 },
      { inventory: 3200, controlEnabled: true, enterThreshold: 3500, releaseThreshold: 6000 },
      { inventory: 1200, controlEnabled: false, enterThreshold: 1000, releaseThreshold: 2000 }
    ],
    "POK-3002": [
      { inventory: 9600, controlEnabled: false, enterThreshold: 8000, releaseThreshold: 12000 },
      { inventory: 5600, controlEnabled: false, enterThreshold: 5000, releaseThreshold: 8000 },
      { inventory: 2800, controlEnabled: true, enterThreshold: 3000, releaseThreshold: 5000 },
      { inventory: 1000, controlEnabled: false, enterThreshold: 800, releaseThreshold: 1800 }
    ],
    "TP-3001": [
      { inventory: 18200, controlEnabled: false, enterThreshold: 15000, releaseThreshold: 20000 },
      { inventory: 11400, controlEnabled: false, enterThreshold: 10000, releaseThreshold: 15000 },
      { inventory: 4600, controlEnabled: true, enterThreshold: 4500, releaseThreshold: 8000 },
      { inventory: 1800, controlEnabled: false, enterThreshold: 1500, releaseThreshold: 3000 }
    ]
  };
  games.forEach(function (game) {
    if (game.type !== "Poker") return;
    var defaults = pokerInventoryDefaults[game.code] || [];
    game.rooms.forEach(function (room, roomIndex) {
      var fallback = defaults[roomIndex] || { inventory: 0, controlEnabled: false, enterThreshold: 0, releaseThreshold: 1 };
      if (!isFinite(Number(room.inventory))) room.inventory = fallback.inventory;
      if (!isFinite(Number(room.inventoryOffset))) room.inventoryOffset = 0;
      if (!isFinite(Number(room.enterThreshold))) room.enterThreshold = fallback.enterThreshold;
      if (!isFinite(Number(room.releaseThreshold))) room.releaseThreshold = fallback.releaseThreshold;
      if (typeof room.controlEnabled !== "boolean") room.controlEnabled = fallback.controlEnabled;
    });
  });
  records.sort(function (a, b) { return String(b.time).localeCompare(String(a.time)); });

  function esc(value) { return api.esc(value); }

  function renderSummary(game) {
    if (game.type === "SLOTS") return "底分 " + game.enabledBets.join(" / ") + " · " + (game.capability.freeGamePurchase ? "Free Game 支持" : "Free Game 不支持");
    if (game.type === "FISH") return game.cannons.length + " 个炮台 · " + game.cannons[0].amount + "～" + game.cannons[game.cannons.length - 1].amount + " / 炮";
    if (game.type === "Poker") {
      var pokerSummary = FIXED_POKER_ROOM_COUNT + " 个房间 · 低分房底分 " + game.rooms[0].baseScore + " · 机器人上限 " + game.rooms[0].maxRobotNum + "/桌";
      return pokerSummary + " · " + robotRuleSummary(game);
    }
    return game.miniType + " · " + game.params.length + " 个专属参数";
  }

  var moduleNames = {
    rtp: "RTP 配置",
    slotsBets: "投注底分配置",
    slotsFreeGame: "Free Game 配置",
    fishCannons: "炮台配置",
    pokerRooms: "房间配置",
    pokerRobots: "机器人配置",
    robotRules: "游戏设定",
    miniParams: "玩法参数配置"
  };

  function modulesFor(game) {
    var modules = [{ key: "rtp", label: "RTP 配置" }];
    if (game.type === "SLOTS") {
      modules.push({ key: "slotsBets", label: "投注底分" });
      if (game.capability.freeGamePurchase) modules.push({ key: "slotsFreeGame", label: "Free Game" });
    } else if (game.type === "FISH") {
      modules.push({ key: "fishCannons", label: "炮台配置" });
    } else if (game.type === "Poker") {
      modules.push({ key: "pokerRooms", label: "房间配置" });
      modules.push({ key: "pokerRobots", label: "机器人配置" });
      modules.push({ key: "robotRules", label: "游戏设定" });
    } else if (game.type === "Mini") {
      modules.push({ key: "miniParams", label: "玩法参数" });
    }
    return modules;
  }

  function renderModuleActions(game, index) {
    return modulesFor(game).map(function (module) {
      return "<button class=\"self-game-link\" type=\"button\" data-config-index=\"" + index + "\" data-config-module=\"" + module.key + "\">" + esc(module.label) + "</button>";
    }).join("");
  }

  function typeClass(type) {
    return { SLOTS: "is-slots", FISH: "is-fish", Poker: "is-poker", Mini: "is-mini" }[type] || "";
  }

  var robotModeNames = { natural: "自然概率", good1: "好牌强度 1", good2: "好牌强度 2", good3: "好牌强度 3" };
  var controlModeNames = { natural: "自然规则", normal: "普通控制规则", point: "点控规则" };

  function robotRuleSummary(game) {
    if (!game.robotRules) return "游戏设定未配置";
    if (!game.robotRules.goodModeEnabled) return "自然发牌";
    return "好牌强度 " + String(game.robotRules.goodMode).replace("good", "");
  }

  function probabilityTotal(rows, mode) {
    return rows.reduce(function (total, row) { return total + Number(row[mode] || 0); }, 0);
  }

  function renderRobotProbabilityRows(game) {
    var rows = game.robotRules.probabilityRows || [];
    return rows.map(function (row) {
      return "<tr><td><strong>" + esc(row.label) + "</strong></td><td class=\"number-cell\">" + Number(row.count).toLocaleString("zh-CN") + "</td><td class=\"number-cell\">" + row.natural + "</td>" +
        ["good1", "good2", "good3"].map(function (mode) { return "<td><input class=\"robot-probability-input\" type=\"number\" min=\"0\" max=\"10000\" step=\"1\" value=\"" + row[mode] + "\" data-row=\"" + row.key + "\" data-mode=\"" + mode + "\"></td>"; }).join("") +
        "<td class=\"robot-rule-basis\">" + esc(row.basis) + "</td></tr>";
    }).join("");
  }

  function renderFields(game, module) {
    if (module === "robotRules") return [
      "<section class=\"self-game-config-section\"><h3>发牌模式</h3><p>自然发牌保持自然概率；好牌模式下，整桌玩家和机器人共用对应牌型分布，单局发牌仍保持随机。</p>",
      "<div class=\"self-game-form-field self-game-single-field\"><label for=\"robotDealMode\">发牌模式</label><select class=\"self-game-select\" id=\"robotDealMode\"><option value=\"natural\"" + (!game.robotRules.goodModeEnabled ? " selected" : "") + ">自然发牌</option><option value=\"good1\"" + (game.robotRules.goodModeEnabled && game.robotRules.goodMode === "good1" ? " selected" : "") + ">好牌强度 1</option><option value=\"good2\"" + (game.robotRules.goodModeEnabled && game.robotRules.goodMode === "good2" ? " selected" : "") + ">好牌强度 2</option><option value=\"good3\"" + (game.robotRules.goodModeEnabled && game.robotRules.goodMode === "good3" ? " selected" : "") + ">好牌强度 3</option></select></div></section>"
    ].join("");
    if (module === "rtp") return [
      "<section class=\"self-game-config-section\"><h3>RTP</h3><p>仅修改当前游戏的 RTP，范围 50.0%～200.0%，最小步长 0.1%。</p>",
      "<div class=\"self-game-form-field self-game-single-field\"><label for=\"moduleRtp\">RTP</label><div class=\"self-game-input-wrap\"><input class=\"self-game-input self-game-rtp-input\" id=\"moduleRtp\" type=\"number\" min=\"50\" max=\"200\" step=\"0.1\" value=\"" + Number(game.rtp).toFixed(1) + "\"><span class=\"self-game-input-suffix\">%</span></div><p class=\"self-game-field-error\" id=\"moduleRtpError\" hidden></p></div></section>"
    ].join("");
    if (module === "slotsBets") return [
      "<section class=\"self-game-config-section\"><h3>投注底分</h3><p>只能选择游戏基础能力提供的底分，未勾选的底分不会对玩家开放。</p><div class=\"self-game-option-grid\">",
      game.capability.baseBets.map(function (value) { return "<label class=\"self-game-option\"><input class=\"slot-bet-option\" type=\"checkbox\" value=\"" + value + "\"" + (game.enabledBets.indexOf(value) !== -1 ? " checked" : "") + "><span>底分 " + value + "</span></label>"; }).join(""),
      "</div></section>"
    ].join("");
    if (module === "slotsFreeGame") return "<section class=\"self-game-config-section\"><h3>购买 Free Game</h3><p>此入口仅对游戏基础能力支持购买 Free Game 的游戏显示。</p><label class=\"self-game-switch\"><input id=\"slotFreeGame\" type=\"checkbox\"" + (game.freeGameAllowed ? " checked" : "") + "><span class=\"self-game-switch-track\"></span><span class=\"self-game-switch-text\">允许购买</span></label></section>";
    if (module === "fishCannons") return [
      "<section class=\"self-game-config-section\"><h3>炮台金额梯度</h3><p>可在游戏基础数据提供的范围内调整每个炮台档位的金额。</p><table class=\"self-game-data-table\"><thead><tr><th>炮台档位</th><th>当前每炮金额</th><th>金额范围</th><th>调整步长</th></tr></thead><tbody>",
      game.cannons.map(function (cannon) { return "<tr><td>炮台 " + cannon.level + "</td><td><input class=\"fish-amount\" type=\"number\" min=\"" + game.capability.minAmount + "\" max=\"" + game.capability.maxAmount + "\" step=\"" + game.capability.step + "\" value=\"" + cannon.amount + "\" data-level=\"" + cannon.level + "\"></td><td>" + game.capability.minAmount + "～" + game.capability.maxAmount + "</td><td>" + game.capability.step + "</td></tr>"; }).join(""),
      "</tbody></table></section>"
    ].join("");
    if (module === "pokerRooms") return [
      "<section class=\"self-game-config-section\"><h3>房间底分与最低进入条件</h3><p>房间类型来自游戏基础数据，此处只维护房间底分和最低进入条件。</p><table class=\"self-game-data-table self-game-room-table\"><thead><tr><th>ID</th><th>房间</th><th>房间底分</th><th>最低进入条件</th><th>单位</th></tr></thead><tbody>",
      game.rooms.map(function (room) { return "<tr><td>" + room.id + "</td><td>" + room.name + "<span class=\"self-game-help\">（" + room.code + "）</span></td><td><input class=\"poker-base-score\" type=\"number\" min=\"0.1\" step=\"0.1\" value=\"" + room.baseScore + "\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-min-entry\" type=\"number\" min=\"0.1\" step=\"0.1\" value=\"" + room.minEntry + "\" data-room=\"" + room.code + "\"></td><td>" + game.capability.scoreUnit + "</td></tr>"; }).join(""),
      "</tbody></table></section>"
    ].join("");
    if (module === "pokerRobots") return [
      "<section class=\"self-game-config-section\"><h3>机器人配置</h3><p>仅房间型游戏显示此入口。机器人数量按桌子顺序填写，使用英文逗号分隔。</p><table class=\"self-game-data-table self-game-room-table self-game-room-robot-table\"><thead><tr><th>房间</th><th>进入桌子数量</th><th>进入桌子人数限制</th><th>每桌机器人上限</th><th>机器人数量</th></tr></thead><tbody>",
      game.rooms.map(function (room) { return "<tr><td>" + room.name + "</td><td><input class=\"poker-table-num\" type=\"number\" min=\"1\" step=\"1\" value=\"" + room.tableNum + "\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-join-limit\" type=\"number\" min=\"1\" step=\"1\" value=\"" + room.joinTableCountLimit + "\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-max-robot\" type=\"number\" min=\"0\" step=\"1\" value=\"" + room.maxRobotNum + "\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-robot-num\" type=\"text\" value=\"" + room.robotNum.join(",") + "\" data-room=\"" + room.code + "\" placeholder=\"如 1,0,2\"></td></tr>"; }).join(""),
      "</tbody></table></section>",
      "<section class=\"self-game-config-section self-game-robot-range-section\"><h3>机器人运行范围</h3><p>配置机器人携带金币、退出金币、游戏时长和游戏局数范围；时间单位为分钟，均按整数配置。</p><table class=\"self-game-data-table self-game-room-table self-game-room-ranges-table\"><thead><tr><th>房间</th><th>携带金币最小值</th><th>携带金币最大值</th><th>退出金币最小值</th><th>退出金币最大值</th><th>游戏时间最小值</th><th>游戏时间最大值</th><th>游戏局数最小值</th><th>游戏局数最大值</th></tr></thead><tbody>",
      game.rooms.map(function (room) { return "<tr><td>" + room.name + "</td><td><input class=\"poker-range\" type=\"number\" min=\"0\" step=\"1\" value=\"" + room.minGold + "\" data-field=\"minGold\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-range\" type=\"number\" min=\"0\" step=\"1\" value=\"" + room.maxGold + "\" data-field=\"maxGold\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-range\" type=\"number\" min=\"0\" step=\"1\" value=\"" + room.exitGameMinGold + "\" data-field=\"exitGameMinGold\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-range\" type=\"number\" min=\"0\" step=\"1\" value=\"" + room.exitGameMaxGold + "\" data-field=\"exitGameMaxGold\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-range\" type=\"number\" min=\"0\" step=\"1\" value=\"" + room.minPlayTime + "\" data-field=\"minPlayTime\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-range\" type=\"number\" min=\"0\" step=\"1\" value=\"" + room.maxPlayTime + "\" data-field=\"maxPlayTime\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-range\" type=\"number\" min=\"0\" step=\"1\" value=\"" + room.minPlayRound + "\" data-field=\"minPlayRound\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-range\" type=\"number\" min=\"0\" step=\"1\" value=\"" + room.maxPlayRound + "\" data-field=\"maxPlayRound\" data-room=\"" + room.code + "\"></td></tr>"; }).join(""),
      "</tbody></table></section>"
    ].join("");
    if (module === "miniParams") return [
      "<section class=\"self-game-config-section\"><h3>" + game.miniType + " 专属参数</h3><p>参数名称和可用范围由游戏基础能力提供。</p><table class=\"self-game-data-table\"><thead><tr><th>参数</th><th>配置值</th><th>单位</th><th>能力范围</th></tr></thead><tbody>",
      game.params.map(function (param) { var control = param.type === "select" ? "<select class=\"mini-param\" data-param=\"" + param.key + "\">" + param.options.map(function (option) { return "<option" + (option === param.value ? " selected" : "") + ">" + option + "</option>"; }).join("") + "</select>" : "<input class=\"mini-param\" type=\"number\" min=\"" + param.min + "\" max=\"" + param.max + "\" step=\"" + param.step + "\" value=\"" + param.value + "\" data-param=\"" + param.key + "\">"; return "<tr><td>" + param.label + "</td><td>" + control + "</td><td>" + param.unit + "</td><td>" + (param.type === "select" ? param.options.join(" / ") : param.min + "～" + param.max) + "</td></tr>"; }).join(""),
      "</tbody></table></section>"
    ].join("");
    return "<div class=\"self-game-empty-note\">当前游戏不支持此配置模块</div>";
  }

  function validateFields(root, game, module) {
    if (module === "rtp") {
      var parsedRtp = api.parseRtp(root.querySelector("#moduleRtp").value);
      var rtpError = root.querySelector("#moduleRtpError");
      rtpError.textContent = parsedRtp.message || "";
      rtpError.hidden = !parsedRtp.message;
      return parsedRtp.message;
    }
    if (module === "slotsBets" && !root.querySelectorAll(".slot-bet-option:checked").length) return "至少选择一个投注底分";
    if (module === "fishCannons") {
      var fishError = "";
      root.querySelectorAll(".fish-amount").forEach(function (input) { var value = Number(input.value); var scale = Math.round(value / game.capability.step); if (!isFinite(value) || value < game.capability.minAmount || value > game.capability.maxAmount || Math.abs(scale * game.capability.step - value) > 0.000001) fishError = "炮台金额必须在基础数据范围内，并符合步长 " + game.capability.step; });
      return fishError;
    }
    if (module === "pokerRooms") {
      var roomError = "";
      if (!game.rooms || game.rooms.length !== FIXED_POKER_ROOM_COUNT) return "房间配置数量无效";
      root.querySelectorAll(".poker-base-score, .poker-min-entry").forEach(function (input) { if (!input.value.trim() || !isFinite(Number(input.value)) || Number(input.value) <= 0) roomError = "房间底分和最低进入条件必须大于 0"; });
      return roomError;
    }
    if (module === "pokerRobots") {
      var pokerError = "";
      root.querySelectorAll(".poker-table-num, .poker-join-limit, .poker-max-robot").forEach(function (input) { var value = Number(input.value); var mustBePositive = !input.classList.contains("poker-max-robot"); if (!input.value.trim() || !isFinite(value) || value < 0 || mustBePositive && value <= 0 || Math.floor(value) !== value) pokerError = "桌子数量和人数限制必须为正整数，机器人上限须为非负整数"; });
      if (pokerError) return pokerError;
      game.rooms.forEach(function (room) {
        var tableNum = Number(root.querySelector(".poker-table-num[data-room=\"" + room.code + "\"]").value);
        var joinLimit = Number(root.querySelector(".poker-join-limit[data-room=\"" + room.code + "\"]").value);
        var maxRobot = Number(root.querySelector(".poker-max-robot[data-room=\"" + room.code + "\"]").value);
        var robotsRaw = root.querySelector(".poker-robot-num[data-room=\"" + room.code + "\"]").value.trim();
        var robots = robotsRaw ? robotsRaw.split(",").map(function (item) { return Number(item.trim()); }) : [];
        if (!/^\d+(?:\s*,\s*\d+)*$/.test(robotsRaw) || robots.length !== tableNum || robots.some(function (value) { return value > maxRobot; })) pokerError = room.name + "的机器人数量必须按桌子数量填写，且不能超过每桌上限";
        if (maxRobot > joinLimit) pokerError = room.name + "的桌子机器人上限不能大于进入桌子人数限制";
      });
      if (pokerError) return pokerError;
      root.querySelectorAll(".poker-range").forEach(function (input) { var value = Number(input.value); if (!input.value.trim() || !isFinite(value) || value < 0 || Math.floor(value) !== value) pokerError = "金币、时长和局数必须为非负整数"; });
      game.rooms.forEach(function (room) { ["minGold", "exitGameMinGold", "minPlayTime", "minPlayRound"].forEach(function (minField) { var maxField = { minGold: "maxGold", exitGameMinGold: "exitGameMaxGold", minPlayTime: "maxPlayTime", minPlayRound: "maxPlayRound" }[minField]; var minValue = Number(root.querySelector("[data-field=\"" + minField + "\"][data-room=\"" + room.code + "\"]").value); var maxValue = Number(root.querySelector("[data-field=\"" + maxField + "\"][data-room=\"" + room.code + "\"]").value); if (minValue > maxValue) pokerError = room.name + "的最小值不能大于最大值"; }); });
      return pokerError;
    }
    if (module !== "miniParams") return "";
    var miniError = "";
    root.querySelectorAll(".mini-param[type=number]").forEach(function (input) { var value = Number(input.value); var param = game.params.filter(function (item) { return item.key === input.getAttribute("data-param"); })[0]; if (!param || !isFinite(value) || value < param.min || value > param.max) miniError = "Mini 参数必须在游戏基础能力范围内"; });
    return miniError;
  }

  function collectFields(root, game, module) {
    if (module === "robotRules") {
      game.robotRules.goodMode = root.querySelector("#robotDealMode").value;
      game.robotRules.goodModeEnabled = game.robotRules.goodMode !== "natural";
    } else if (module === "rtp") {
      game.rtp = api.parseRtp(root.querySelector("#moduleRtp").value).value;
    } else if (module === "slotsBets") {
      game.enabledBets = Array.prototype.map.call(root.querySelectorAll(".slot-bet-option:checked"), function (item) { return Number(item.value); });
    } else if (module === "slotsFreeGame") {
      game.freeGameAllowed = root.querySelector("#slotFreeGame").checked;
    } else if (module === "fishCannons") {
      root.querySelectorAll(".fish-amount").forEach(function (input) { var level = Number(input.getAttribute("data-level")); game.cannons.forEach(function (cannon) { if (cannon.level === level) cannon.amount = Number(input.value); }); });
    } else if (module === "pokerRooms") {
      game.rooms.forEach(function (room) { room.baseScore = Number(root.querySelector(".poker-base-score[data-room=\"" + room.code + "\"]").value); room.minEntry = Number(root.querySelector(".poker-min-entry[data-room=\"" + room.code + "\"]").value); });
    } else if (module === "pokerRobots") {
      game.rooms.forEach(function (room) { room.tableNum = Number(root.querySelector(".poker-table-num[data-room=\"" + room.code + "\"]").value); room.joinTableCountLimit = Number(root.querySelector(".poker-join-limit[data-room=\"" + room.code + "\"]").value); room.maxRobotNum = Number(root.querySelector(".poker-max-robot[data-room=\"" + room.code + "\"]").value); room.robotNum = root.querySelector(".poker-robot-num[data-room=\"" + room.code + "\"]").value.split(",").map(function (item) { return Number(item.trim()); }); });
      game.rooms.forEach(function (room) { ["minGold", "maxGold", "exitGameMinGold", "exitGameMaxGold", "minPlayTime", "maxPlayTime", "minPlayRound", "maxPlayRound"].forEach(function (field) { room[field] = Number(root.querySelector("[data-field=\"" + field + "\"][data-room=\"" + room.code + "\"]").value); }); });
    } else if (module === "miniParams") {
      game.params.forEach(function (param) { var input = root.querySelector(".mini-param[data-param=\"" + param.key + "\"]"); if (input) param.value = input.value; });
    }
  }

  function moduleSummary(game, module) {
    if (module === "rtp") return api.formatRtp(game.rtp);
    if (module === "slotsBets") return "底分 " + game.enabledBets.join(" / ");
    if (module === "slotsFreeGame") return game.freeGameAllowed ? "允许购买" : "禁止购买";
    if (module === "fishCannons") return game.cannons.map(function (item) { return item.amount; }).join(" / ");
    if (module === "pokerRooms") return game.rooms.map(function (room) { return room.name + " " + room.baseScore + "/" + room.minEntry; }).join("；");
    if (module === "pokerRobots") return game.rooms.map(function (room) { return room.name + " " + room.tableNum + "桌/上限" + room.maxRobotNum + " · 金币" + room.minGold + "-" + room.maxGold; }).join("；");
    if (module === "robotRules") return robotRuleSummary(game);
    return game.params.map(function (param) { return param.label + "=" + param.value; }).join("；");
  }

  function syncSelectionState() {
    var selectAll = document.getElementById("gameSelectAll");
    var visibleBoxes = Array.prototype.slice.call(document.querySelectorAll(".game-row-check"));
    var visibleSelected = visibleBoxes.filter(function (box) { return box.checked; }).length;
    document.getElementById("selectedCount").textContent = String(games.filter(function (game) { return game.selected; }).length);
    selectAll.checked = visibleBoxes.length > 0 && visibleSelected === visibleBoxes.length;
    selectAll.indeterminate = visibleSelected > 0 && visibleSelected < visibleBoxes.length;
  }

  function renderRows() {
    var keyword = String(document.getElementById("gameName").value || "").trim().toLowerCase();
    var visible = games.map(function (game, index) { return { game: game, index: index }; }).filter(function (item) { var game = item.game; return (activeType === "全部" || game.type === activeType) && (!keyword || [game.name, game.code].join(" ").toLowerCase().indexOf(keyword) !== -1); });
    var rows = document.getElementById("gameRows");
    rows.innerHTML = visible.length ? visible.map(function (item) { var game = item.game; var inventoryCell = game.type === "Poker" ? "<td class=\"number-cell self-game-inventory-cell\"><strong>按房间设置</strong><div class=\"self-game-inventory-row-actions\"><button class=\"self-game-link\" type=\"button\" data-inventory-index=\"" + item.index + "\">库存编辑</button></div></td>" : "<td class=\"number-cell self-game-inventory-cell\"><strong>" + esc(formatAmount(game.inventory, false)) + "</strong><div class=\"self-game-inventory-row-actions\"><button class=\"self-game-link\" type=\"button\" data-inventory-index=\"" + item.index + "\">库存编辑</button></div></td>"; return "<tr><td class=\"check-cell\"><input class=\"game-row-check\" type=\"checkbox\" data-index=\"" + item.index + "\"" + (game.selected ? " checked" : "") + "></td><td><span class=\"self-game-type-tag " + typeClass(game.type) + "\">" + esc(game.type) + "</span></td><td><strong class=\"self-game-name\">" + esc(game.name) + "</strong></td><td><span class=\"self-game-code\">" + esc(game.code) + "</span></td>" + inventoryCell + "<td class=\"self-game-summary-cell\">" + esc(renderSummary(game)) + "</td><td class=\"number-cell\"><span class=\"self-game-rtp\">" + api.formatRtp(game.rtp) + "</span></td><td>" + esc(game.updated) + "</td><td><div class=\"self-game-config-actions\">" + renderModuleActions(game, item.index) + "</div></td></tr>"; }).join("") : "<tr class=\"empty-row\"><td colspan=\"9\">暂无符合条件的自研游戏</td></tr>";
    syncSelectionState();
  }

  function renderRecords() {
    var target = document.getElementById("recordRows");
    target.innerHTML = records.length ? records.map(function (record) { return "<tr><td>" + esc(record.time) + "</td><td>" + esc(record.type || "-") + "</td><td>" + esc(record.game) + "</td><td>" + esc(record.action) + "</td><td>" + esc((record.before || "-") + " → " + (record.after || "-")) + "</td><td>" + esc(record.operator || "运营管理员") + "</td></tr>"; }).join("") : "<tr class=\"empty-row\"><td colspan=\"6\">暂无变更记录</td></tr>";
  }

  function formatAmount(value, signed) {
    var number = Number(value) || 0;
    return (signed && number >= 0 ? "+" : "") + number.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function renderInventory() {
    var rows = document.getElementById("inventoryRecordRows");
    if (!rows) return;
    rows.innerHTML = inventoryRecords.length ? inventoryRecords.map(function (record) {
      return "<tr><td>" + esc(record.time) + "</td><td>" + esc(record.game || "-") + "</td><td>" + esc(record.type) + "</td><td><span class=\"self-game-status-tag " + (record.value >= 0 ? "is-success" : "is-danger") + "\">" + (record.value >= 0 ? "增加" : "减少") + "</span></td><td class=\"number-cell\">" + esc(formatAmount(record.value, true)) + "</td><td>" + esc(record.reason) + "</td><td>运营管理员</td></tr>";
    }).join("") : "<tr class=\"empty-row\"><td colspan=\"7\">暂无库存调整记录</td></tr>";
  }

  function roomControlState(room) {
    var state = Boolean(room.controlEnabled);
    var execution = Number(room.inventory) + Number(room.inventoryOffset || 0);
    if (state && execution >= Number(room.releaseThreshold)) return false;
    if (!state && execution <= Number(room.enterThreshold)) return true;
    return state;
  }

  function renderRoomInventory(game) {
    var rows = document.getElementById("roomInventoryRows");
    if (!rows) return;
    rows.innerHTML = game.rooms.map(function (room, index) {
      var controlled = roomControlState(room);
      return "<tr><td><strong>" + esc(room.name) + "</strong><span class=\"self-game-help\">（" + esc(room.code) + "）</span></td>" +
        "<td class=\"number-cell\">" + esc(formatAmount(room.inventory, false)) + "</td>" +
        "<td><input class=\"room-inventory-offset\" type=\"number\" step=\"0.01\" value=\"" + Number(room.inventoryOffset || 0) + "\" data-room=\"" + index + "\"><p class=\"self-game-field-error room-inventory-offset-error\" data-room=\"" + index + "\" hidden></p></td>" +
        "<td class=\"number-cell room-execution-inventory\" data-room=\"" + index + "\">" + esc(formatAmount(Number(room.inventory) + Number(room.inventoryOffset || 0), false)) + "</td>" +
        "<td><input class=\"room-enter-threshold\" type=\"number\" min=\"0\" step=\"0.01\" value=\"" + Number(room.enterThreshold) + "\" data-room=\"" + index + "\"></td>" +
        "<td><input class=\"room-release-threshold\" type=\"number\" min=\"0\" step=\"0.01\" value=\"" + Number(room.releaseThreshold) + "\" data-room=\"" + index + "\"></td>" +
        "<td><span class=\"self-game-status-tag room-control-status " + (controlled ? "is-warning" : "is-success") + "\" data-room=\"" + index + "\">" + (controlled ? "控制中" : "未控制") + "</span></td></tr>";
    }).join("");
  }

  function updateRoomInventoryPreview(game) {
    var root = document.getElementById("roomInventoryPanel");
    if (!root || root.hidden || !game) return;
    game.rooms.forEach(function (room, index) {
      var offsetInput = root.querySelector(".room-inventory-offset[data-room=\"" + index + "\"]");
      var execution = root.querySelector(".room-execution-inventory[data-room=\"" + index + "\"]");
      var entryInput = root.querySelector(".room-enter-threshold[data-room=\"" + index + "\"]");
      var releaseInput = root.querySelector(".room-release-threshold[data-room=\"" + index + "\"]");
      var status = root.querySelector(".room-control-status[data-room=\"" + index + "\"]");
      if (!offsetInput || !execution || !entryInput || !releaseInput || !status) return;
      var raw = String(offsetInput.value || "").trim();
      var offset = Number(raw);
      execution.textContent = raw && isFinite(offset) ? formatAmount(Number(room.inventory) + offset, false) : "-";
      var preview = { inventory: Number(room.inventory), inventoryOffset: offset, enterThreshold: Number(entryInput.value), releaseThreshold: Number(releaseInput.value), controlEnabled: room.controlEnabled };
      var controlled = raw && isFinite(offset) ? roomControlState(preview) : Boolean(room.controlEnabled);
      status.textContent = controlled ? "控制中" : "未控制";
      status.className = "self-game-status-tag room-control-status " + (controlled ? "is-warning" : "is-success");
    });
  }

  function validateRoomInventory(root, game) {
    var message = "";
    root.querySelectorAll(".room-inventory-offset, .room-enter-threshold, .room-release-threshold").forEach(function (input) {
      var isOffset = input.classList.contains("room-inventory-offset");
      var value = Number(input.value);
      if (!input.value.trim() || !isFinite(value) || !isOffset && value < 0) message = "库存偏移量必须为有效数字，控制金额必须为不小于 0 的数字";
    });
    game.rooms.forEach(function (room, index) {
      var entry = Number(root.querySelector(".room-enter-threshold[data-room=\"" + index + "\"]").value);
      var release = Number(root.querySelector(".room-release-threshold[data-room=\"" + index + "\"]").value);
      if (entry >= release) message = room.name + "的进入控制金额必须低于解除控制金额";
    });
    return message;
  }

  function collectRoomInventory(root, game) {
    game.rooms.forEach(function (room, index) {
      room.inventoryOffset = Number(root.querySelector(".room-inventory-offset[data-room=\"" + index + "\"]").value);
      room.enterThreshold = Number(root.querySelector(".room-enter-threshold[data-room=\"" + index + "\"]").value);
      room.releaseThreshold = Number(root.querySelector(".room-release-threshold[data-room=\"" + index + "\"]").value);
      room.controlEnabled = roomControlState(room);
    });
  }

  function openInventory(index) {
    var game = games[index];
    if (!game) return;
    inventoryGameIndex = index;
    inventoryMode = game.type === "Poker" ? "room" : "edit";
    var roomMode = inventoryMode === "room";
    var modal = document.getElementById("inventoryModal");
    var dialog = modal.querySelector(".self-game-inventory-modal");
    dialog.classList.toggle("is-room", roomMode);
    document.getElementById("roomInventoryPanel").hidden = !roomMode;
    document.getElementById("amountInventoryPanel").hidden = roomMode;
    document.getElementById("inventoryModalTitle").textContent = "库存编辑";
    if (roomMode) renderRoomInventory(game);
    document.getElementById("inventoryModalHint").textContent = "库存本身每日清零，偏移量持续生效；当前执行库存 = 当前库存 + 库存偏移量。";
    document.getElementById("inventoryGameName").textContent = game.name;
    document.getElementById("inventoryGameCode").textContent = game.code;
    if (!roomMode) {
      document.getElementById("inventoryGameAmount").textContent = formatAmount(game.inventory, false);
      document.getElementById("inventoryAfterAmount").textContent = formatAmount(Number(game.inventory) + Number(game.inventoryOffset || 0), false);
      document.getElementById("inventoryAfterLabel").textContent = "当前执行库存";
      document.getElementById("inventoryAfterValue").hidden = false;
      document.getElementById("inventoryAmountLabel").textContent = "库存偏移量";
      document.getElementById("inventoryAmount").min = "";
      document.getElementById("inventoryAmount").placeholder = "可填写正数或负数";
      document.getElementById("inventoryAmount").value = Number(game.inventoryOffset || 0);
    }
    document.getElementById("inventoryReason").value = "";
    document.getElementById("inventoryAmountError").hidden = true;
    document.getElementById("inventoryReasonError").hidden = true;
    var roomError = document.getElementById("roomInventoryError");
    if (roomError) roomError.hidden = true;
    if (!roomMode) updateInventoryPreview();
    else updateRoomInventoryPreview(game);
    api.setLayer(modal, true);
  }

  function updateInventoryPreview() {
    var game = games[inventoryGameIndex];
    var input = document.getElementById("inventoryAmount");
    var after = document.getElementById("inventoryAfterAmount");
    if (!game || !input || !after) return;
    var raw = String(input.value || "").trim();
    var offset = Number(raw);
    if (!raw || !isFinite(offset)) {
      after.textContent = "-";
      return;
    }
    after.textContent = formatAmount(Number(game.inventory) + offset, false);
  }

  function closeInventory() { api.setLayer(document.getElementById("inventoryModal"), false); }

  function applyInventory() {
    var reason = document.getElementById("inventoryReason").value.trim();
    var game = games[inventoryGameIndex];
    if (!game) return;
    var amountError = document.getElementById("inventoryAmountError");
    var reasonError = document.getElementById("inventoryReasonError");
    if (inventoryMode === "room") {
      var roomRoot = document.getElementById("roomInventoryPanel");
      var roomError = validateRoomInventory(roomRoot, game);
      amountError.textContent = roomError;
      amountError.hidden = !roomError;
      var roomMessage = document.getElementById("roomInventoryError");
      roomMessage.textContent = roomError;
      roomMessage.hidden = !roomError;
      reasonError.textContent = reason ? "" : "请填写调整原因";
      reasonError.hidden = !reasonError.textContent;
      if (roomError || !reason) return;
      var roomBefore = game.rooms.map(function (room) { return room.name + " 偏移量 " + formatAmount(room.inventoryOffset || 0, true) + " / 执行库存 " + formatAmount(Number(room.inventory) + Number(room.inventoryOffset || 0), false) + " / 进入 " + formatAmount(room.enterThreshold, false) + " / 解除 " + formatAmount(room.releaseThreshold, false); }).join("；");
      collectRoomInventory(roomRoot, game);
      var roomAfter = game.rooms.map(function (room) { return room.name + " 偏移量 " + formatAmount(room.inventoryOffset || 0, true) + " / 执行库存 " + formatAmount(Number(room.inventory) + Number(room.inventoryOffset || 0), false) + " / 进入 " + formatAmount(room.enterThreshold, false) + " / 解除 " + formatAmount(room.releaseThreshold, false); }).join("；");
      var roomTime = api.nowText();
      game.updated = roomTime;
      inventoryRecords.unshift({ time: roomTime, type: "库存编辑", game: game.name, value: 0, reason: reason });
      records.unshift({ time: roomTime, type: game.type, game: game.name, action: "更新房间库存偏移量及控制金额", before: roomBefore, after: roomAfter, operator: "运营管理员" });
      renderRows();
      renderRecords();
      renderInventory();
      closeInventory();
      api.showToast("库存偏移量已生效", false);
      return;
    }
    var raw = String(document.getElementById("inventoryAmount").value || "").trim();
    var amount = Number(raw);
    amountError.textContent = raw && isFinite(amount) ? "" : "请输入有效的库存偏移量";
    amountError.hidden = !amountError.textContent;
    reasonError.textContent = reason ? "" : "请填写调整原因";
    reasonError.hidden = !reasonError.textContent;
    if (!amountError.hidden || !reasonError.hidden) return;
    var beforeOffset = Number(game.inventoryOffset || 0);
    var beforeExecution = Number(game.inventory) + beforeOffset;
    game.inventoryOffset = amount;
    var time = api.nowText();
    inventoryRecords.unshift({ time: time, type: "库存编辑", game: game.name, value: amount - beforeOffset, reason: reason });
    records.unshift({ time: time, type: game.type, game: game.name, action: "更新库存偏移量", before: "偏移量 " + formatAmount(beforeOffset, true) + " / 执行库存 " + formatAmount(beforeExecution, false), after: "偏移量 " + formatAmount(amount, true) + " / 执行库存 " + formatAmount(Number(game.inventory) + amount, false), operator: "运营管理员" });
    renderRows();
    renderRecords();
    renderInventory();
    closeInventory();
    api.showToast("库存偏移量已生效", false);
  }

  function openModule(index, module) {
    var game = games[index];
    var supported = game && modulesFor(game).some(function (item) { return item.key === module; });
    if (!supported) return;
    editingIndex = index;
    activeModule = module;
    editingBefore = moduleSummary(game, module);
    document.getElementById("moduleTitle").textContent = module === "rtp" ? "RTP 配置" : moduleNames[module];
    document.getElementById("moduleGameName").textContent = game.name;
    document.getElementById("moduleGameCode").textContent = game.code;
    document.getElementById("moduleGameType").textContent = game.type;
    document.getElementById("moduleFields").innerHTML = renderFields(game, module);
    document.getElementById("moduleModalError").hidden = true;
    var dialog = document.querySelector("#moduleModal .self-game-module-modal");
    dialog.classList.toggle("is-medium", ["fishCannons", "pokerRooms", "miniParams"].indexOf(module) !== -1);
    dialog.classList.toggle("is-wide", module === "pokerRobots");
    api.setLayer(document.getElementById("moduleModal"), true);
  }

  function closeModule() { editingIndex = -1; activeModule = ""; editingBefore = ""; api.setLayer(document.getElementById("moduleModal"), false); }

  function applyModule() {
    if (editingIndex < 0 || !activeModule) return;
    var game = games[editingIndex];
    var fields = document.getElementById("moduleFields");
    var error = document.getElementById("moduleModalError");
    error.hidden = true;
    var fieldError = validateFields(fields, game, activeModule);
    if (fieldError) { error.textContent = fieldError; error.hidden = false; return; }
    collectFields(fields, game, activeModule);
    game.updated = api.nowText();
    records.unshift({ time: game.updated, type: game.type, game: game.name, action: moduleNames[activeModule], before: editingBefore, after: moduleSummary(game, activeModule), operator: "运营管理员" });
    renderRows();
    renderRecords();
    api.showToast(moduleNames[activeModule] + "已生效", false);
    closeModule();
  }

  function updateBatchPreview() {
    var count = games.filter(function (game) { return game.selected; }).length;
    document.getElementById("batchPreview").textContent = count ? "本次将立即更新已勾选的 " + count + " 个游戏的 RTP。" : "请先勾选需要修改 RTP 的游戏。";
    document.getElementById("batchApply").disabled = count === 0;
  }

  function openBatch() {
    document.getElementById("batchTypeLabel").textContent = "已勾选游戏";
    document.getElementById("batchRtp").value = "96.0";
    document.getElementById("batchReason").value = "";
    document.getElementById("batchRtpError").hidden = true;
    document.getElementById("batchReasonError").hidden = true;
    updateBatchPreview();
    api.setLayer(document.getElementById("batchModal"), true);
  }

  function closeBatch() { api.setLayer(document.getElementById("batchModal"), false); }

  function applyBatch() {
    var parsed = api.parseRtp(document.getElementById("batchRtp").value);
    var rtpError = document.getElementById("batchRtpError");
    rtpError.textContent = parsed.message || "";
    rtpError.hidden = !parsed.message;
    var reason = document.getElementById("batchReason").value.trim();
    var reasonError = document.getElementById("batchReasonError");
    reasonError.textContent = reason ? "" : "请填写变更原因";
    reasonError.hidden = !!reason;
    if (parsed.message || !reason) return;
    var indexes = games.map(function (game, index) { return game.selected ? index : -1; }).filter(function (index) { return index >= 0; });
    if (!indexes.length) return;
    var time = api.nowText();
    indexes.forEach(function (index) { games[index].rtp = parsed.value; games[index].updated = time; games[index].selected = false; });
    records.unshift({ time: time, type: "批量", game: "批量修改 " + indexes.length + " 个游戏", action: "RTP 立即生效", before: "-", after: api.formatRtp(parsed.value), operator: "运营管理员" });
    renderRows();
    renderRecords();
    closeBatch();
    api.showToast("RTP 已批量立即生效", false);
  }

  api.ready(function () {
    document.querySelectorAll("[data-game-type]").forEach(function (button) { button.addEventListener("click", function () { document.querySelectorAll("[data-game-type]").forEach(function (item) { item.classList.remove("is-active"); }); button.classList.add("is-active"); activeType = button.getAttribute("data-game-type"); renderRows(); }); });
    document.getElementById("gameFilterForm").addEventListener("submit", function (event) { event.preventDefault(); renderRows(); });
    document.getElementById("gameReset").addEventListener("click", function () { document.getElementById("gameName").value = ""; activeType = "全部"; document.querySelectorAll("[data-game-type]").forEach(function (button) { button.classList.toggle("is-active", button.getAttribute("data-game-type") === "全部"); }); renderRows(); });
    document.getElementById("gameRows").addEventListener("click", function (event) { var inventoryButton = event.target.closest("[data-inventory-index]"); if (inventoryButton) { openInventory(Number(inventoryButton.getAttribute("data-inventory-index"))); return; } var button = event.target.closest("[data-config-module]"); if (button) openModule(Number(button.getAttribute("data-config-index")), button.getAttribute("data-config-module")); });
    document.getElementById("gameRows").addEventListener("change", function (event) { if (event.target.matches(".game-row-check")) { games[Number(event.target.getAttribute("data-index"))].selected = event.target.checked; syncSelectionState(); } });
    document.getElementById("gameSelectAll").addEventListener("change", function (event) { document.querySelectorAll(".game-row-check").forEach(function (checkbox) { checkbox.checked = event.target.checked; games[Number(checkbox.getAttribute("data-index"))].selected = event.target.checked; }); renderRows(); });
    document.getElementById("openBatchRtp").addEventListener("click", function () { if (!games.some(function (game) { return game.selected; })) { api.showToast("请先勾选需要修改 RTP 的游戏", true); return; } openBatch(); });
    document.getElementById("batchApply").addEventListener("click", applyBatch);
    document.querySelectorAll("[data-batch-close]").forEach(function (button) { button.addEventListener("click", closeBatch); });
    document.querySelectorAll("[data-module-close]").forEach(function (button) { button.addEventListener("click", closeModule); });
    document.getElementById("applyModule").addEventListener("click", applyModule);
    document.getElementById("applyInventory").addEventListener("click", applyInventory);
    document.getElementById("inventoryAmount").addEventListener("input", updateInventoryPreview);
    var roomInventoryRows = document.getElementById("roomInventoryRows");
    if (roomInventoryRows) roomInventoryRows.addEventListener("input", function () { updateRoomInventoryPreview(games[inventoryGameIndex]); });
    document.querySelectorAll("[data-inventory-close]").forEach(function (button) { button.addEventListener("click", closeInventory); });
    document.addEventListener("click", function (event) { var tab = event.target.closest("[data-self-tab]"); if (!tab || tab.tagName === "SECTION") return; var group = tab.getAttribute("data-self-tab-group"); var target = tab.getAttribute("data-self-tab"); document.querySelectorAll("[data-self-tab-group=\"" + group + "\"]").forEach(function (item) { if (item.hasAttribute("data-self-tab") && item.tagName !== "SECTION") item.classList.toggle("is-active", item === tab); if (item.hasAttribute("data-self-tab-panel") || item.tagName === "SECTION") item.hidden = (item.getAttribute("data-self-tab-panel") || item.getAttribute("data-self-tab")) !== target; }); });
    document.addEventListener("keydown", function (event) { if (event.key !== "Escape") return; if (!document.getElementById("moduleModal").hidden) closeModule(); else if (!document.getElementById("batchModal").hidden) closeBatch(); else if (!document.getElementById("inventoryModal").hidden) closeInventory(); });
    renderRows();
    renderRecords();
    renderInventory();
  });
}());
