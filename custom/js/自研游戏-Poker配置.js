(function () {
  "use strict";

  var api = window.SelfGameConfig;
  if (!api) return;

  var FIXED_POKER_ROOM_COUNT = 4;

  var games = [
    {
      code: "POK-3001",
      name: "极速德州",
      rtp: 95.0,
      updated: "2026-08-18 08:55",
      capability: { roomTypes: ["低分房", "中分房", "高分房", "VIP房"], scoreUnit: "积分" },
      rooms: [
        { id: 1, code: "P-L", name: "低分房", baseScore: 1, minEntry: 100, rakeRate: 5, minRobotNum: 0, maxRobotNum: 3, minGold: 100, maxGold: 10000, exitGameMinGold: 10, exitGameMaxGold: 20000, minPlayTime: 5, maxPlayTime: 120, minPlayRound: 1, maxPlayRound: 50 },
        { id: 2, code: "P-M", name: "中分房", baseScore: 10, minEntry: 1000, rakeRate: 5, minRobotNum: 0, maxRobotNum: 2, minGold: 1000, maxGold: 50000, exitGameMinGold: 100, exitGameMaxGold: 100000, minPlayTime: 5, maxPlayTime: 180, minPlayRound: 1, maxPlayRound: 80 },
        { id: 3, code: "P-H", name: "高分房", baseScore: 100, minEntry: 10000, rakeRate: 5, minRobotNum: 0, maxRobotNum: 1, minGold: 10000, maxGold: 500000, exitGameMinGold: 1000, exitGameMaxGold: 1000000, minPlayTime: 10, maxPlayTime: 240, minPlayRound: 1, maxPlayRound: 100 },
        { id: 4, code: "P-VIP", name: "VIP房", baseScore: 500, minEntry: 50000, rakeRate: 5, minRobotNum: 0, maxRobotNum: 1, minGold: 50000, maxGold: 2000000, exitGameMinGold: 5000, exitGameMaxGold: 5000000, minPlayTime: 10, maxPlayTime: 240, minPlayRound: 1, maxPlayRound: 120 }
      ],
      records: [{ time: "2026-08-18 08:55", game: "极速德州", action: "更新玩法配置", before: "94.0%", after: "95.0%", operator: "运营管理员" }]
    },
    {
      code: "POK-3002",
      name: "短牌扑克",
      rtp: 94.5,
      updated: "2026-08-17 12:30",
      capability: { roomTypes: ["低分房", "中分房", "高分房", "VIP房"], scoreUnit: "积分" },
      rooms: [
        { id: 1, code: "S-L", name: "低分房", baseScore: 2, minEntry: 200, rakeRate: 5, minRobotNum: 0, maxRobotNum: 2, minGold: 200, maxGold: 20000, exitGameMinGold: 20, exitGameMaxGold: 40000, minPlayTime: 5, maxPlayTime: 120, minPlayRound: 1, maxPlayRound: 60 },
        { id: 2, code: "S-M", name: "中分房", baseScore: 10, minEntry: 1000, rakeRate: 5, minRobotNum: 0, maxRobotNum: 1, minGold: 1000, maxGold: 50000, exitGameMinGold: 100, exitGameMaxGold: 100000, minPlayTime: 5, maxPlayTime: 180, minPlayRound: 1, maxPlayRound: 80 },
        { id: 3, code: "S-H", name: "高分房", baseScore: 50, minEntry: 5000, rakeRate: 5, minRobotNum: 0, maxRobotNum: 1, minGold: 5000, maxGold: 250000, exitGameMinGold: 500, exitGameMaxGold: 500000, minPlayTime: 10, maxPlayTime: 240, minPlayRound: 1, maxPlayRound: 100 },
        { id: 4, code: "S-VIP", name: "VIP房", baseScore: 200, minEntry: 20000, rakeRate: 5, minRobotNum: 0, maxRobotNum: 1, minGold: 20000, maxGold: 1000000, exitGameMinGold: 2000, exitGameMaxGold: 2000000, minPlayTime: 10, maxPlayTime: 240, minPlayRound: 1, maxPlayRound: 120 }
      ],
      records: []
    }
  ];

  function renderSummary(game) {
    return FIXED_POKER_ROOM_COUNT + " 个房间 · 低分房底分 " + game.rooms[0].baseScore + " · 机器人范围 " + game.rooms[0].minRobotNum + "～" + game.rooms[0].maxRobotNum + " 人";
  }

  function renderCapability(game) {
    return [
      "<div class=\"self-game-capability-item\"><span>玩法类型</span><strong>Poker</strong></div>",
      "<div class=\"self-game-capability-item\"><span>支持房间</span><strong>" + game.capability.roomTypes.join(" / ") + "</strong></div>",
      "<div class=\"self-game-capability-item\"><span>进入条件单位</span><strong>" + game.capability.scoreUnit + "</strong></div>",
      "<div class=\"self-game-capability-item\"><span>机器人设置</span><strong>仅房间游戏支持</strong></div>"
    ].join("");
  }

  function renderFields(game) {
    return [
      "<section class=\"self-game-config-section\">",
      "<h3>房间底分、最低进入条件与抽水比例</h3>",
      "<p>房间类型来自游戏基础数据，SaaS 配置房间底分、最低进入条件和抽水比例；抽水比例默认 5%，范围 0%～100%，步长 0.1%。</p>",
      "<table class=\"self-game-data-table self-game-room-table self-game-poker-room-config-table\"><thead><tr><th>ID</th><th>房间</th><th>房间底分</th><th>最低进入条件</th><th>抽水比例</th></tr></thead><tbody>",
      game.rooms.map(function (room) {
        return "<tr><td>" + room.id + "</td><td>" + room.name + "<span class=\"self-game-help\">（" + room.code + "）</span></td><td><input class=\"poker-base-score\" type=\"number\" min=\"0.1\" step=\"0.1\" value=\"" + room.baseScore + "\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-min-entry\" type=\"number\" min=\"0.1\" step=\"0.1\" value=\"" + room.minEntry + "\" data-room=\"" + room.code + "\"></td><td><div class=\"self-game-input-wrap self-game-room-rate-input\"><input class=\"self-game-input poker-rake-rate\" type=\"number\" min=\"0\" max=\"100\" step=\"0.1\" value=\"" + room.rakeRate + "\" data-room=\"" + room.code + "\"><span class=\"self-game-input-suffix\">%</span></div></td></tr>";
      }).join(""),
      "</tbody></table>",
      "</section>",
      "<section class=\"self-game-config-section self-game-robot-range-section\"><p>按房间配置机器人运行人数及携带金币、退出金币、游戏时长和游戏局数范围，不再按桌子单独限制机器人；人数、金额、时间和局数均按整数配置，最小值不能大于最大值。</p><table class=\"self-game-data-table self-game-room-table self-game-room-ranges-table\"><thead><tr><th>房间</th><th>机器人最低人数</th><th>机器人最高人数</th><th>携带金币最小值</th><th>携带金币最大值</th><th>退出金币最小值</th><th>退出金币最大值</th><th>游戏时间最小值</th><th>游戏时间最大值</th><th>游戏局数最小值</th><th>游戏局数最大值</th></tr></thead><tbody>",
      game.rooms.map(function (room) { return "<tr><td>" + room.name + "</td><td><input class=\"poker-range poker-robot-min\" type=\"number\" min=\"0\" step=\"1\" value=\"" + room.minRobotNum + "\" data-field=\"minRobotNum\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-range poker-robot-max\" type=\"number\" min=\"0\" step=\"1\" value=\"" + room.maxRobotNum + "\" data-field=\"maxRobotNum\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-range\" type=\"number\" min=\"0\" step=\"1\" value=\"" + room.minGold + "\" data-field=\"minGold\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-range\" type=\"number\" min=\"0\" step=\"1\" value=\"" + room.maxGold + "\" data-field=\"maxGold\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-range\" type=\"number\" min=\"0\" step=\"1\" value=\"" + room.exitGameMinGold + "\" data-field=\"exitGameMinGold\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-range\" type=\"number\" min=\"0\" step=\"1\" value=\"" + room.exitGameMaxGold + "\" data-field=\"exitGameMaxGold\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-range\" type=\"number\" min=\"0\" step=\"1\" value=\"" + room.minPlayTime + "\" data-field=\"minPlayTime\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-range\" type=\"number\" min=\"0\" step=\"1\" value=\"" + room.maxPlayTime + "\" data-field=\"maxPlayTime\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-range\" type=\"number\" min=\"0\" step=\"1\" value=\"" + room.minPlayRound + "\" data-field=\"minPlayRound\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-range\" type=\"number\" min=\"0\" step=\"1\" value=\"" + room.maxPlayRound + "\" data-field=\"maxPlayRound\" data-room=\"" + room.code + "\"></td></tr>"; }).join(""),
      "</tbody></table></section>"
    ].join("");
  }

  function validateFields(root, game) {
    var error = "";
    if (!game || !game.rooms || game.rooms.length !== FIXED_POKER_ROOM_COUNT) return "房间配置数量无效";
    root.querySelectorAll(".poker-base-score, .poker-min-entry, .poker-range").forEach(function (input) {
      var value = Number(input.value);
      var mustBePositive = input.classList.contains("poker-base-score") || input.classList.contains("poker-min-entry");
      var mustBeInteger = !input.classList.contains("poker-base-score") && !input.classList.contains("poker-min-entry");
      if (!input.value.trim() || !isFinite(value) || value < 0 || mustBePositive && value <= 0 || mustBeInteger && Math.floor(value) !== value) error = "房间数值不能为空；底分和进入条件必须大于 0，其余字段须为非负整数";
    });
    if (error) return error;
    root.querySelectorAll(".poker-rake-rate").forEach(function (input) {
      var value = Number(input.value);
      if (!input.value.trim() || !isFinite(value) || value < 0 || value > 100 || Math.round(value * 10) !== value * 10) error = "抽水比例必须为 0～100% 之间、步长为 0.1% 的数值";
    });
    if (error) return error;
    game.rooms.forEach(function (room) {
      ["minRobotNum", "minGold", "exitGameMinGold", "minPlayTime", "minPlayRound"].forEach(function (minField) { var maxField = { minRobotNum: "maxRobotNum", minGold: "maxGold", exitGameMinGold: "exitGameMaxGold", minPlayTime: "maxPlayTime", minPlayRound: "maxPlayRound" }[minField]; var minValue = Number(root.querySelector("[data-field=\"" + minField + "\"][data-room=\"" + room.code + "\"]").value); var maxValue = Number(root.querySelector("[data-field=\"" + maxField + "\"][data-room=\"" + room.code + "\"]").value); if (minValue > maxValue) error = room.name + "的最小值不能大于最大值"; });
    });
    return error;
  }

  function collectFields(root, game) {
    game.rooms.forEach(function (room) {
      var base = root.querySelector(".poker-base-score[data-room=\"" + room.code + "\"]");
      var entry = root.querySelector(".poker-min-entry[data-room=\"" + room.code + "\"]");
      var rake = root.querySelector(".poker-rake-rate[data-room=\"" + room.code + "\"]");
      if (base) room.baseScore = Number(base.value);
      if (entry) room.minEntry = Number(entry.value);
      if (rake) room.rakeRate = Number(rake.value);
      ["minRobotNum", "maxRobotNum", "minGold", "maxGold", "exitGameMinGold", "exitGameMaxGold", "minPlayTime", "maxPlayTime", "minPlayRound", "maxPlayRound"].forEach(function (field) { room[field] = Number(root.querySelector("[data-field=\"" + field + "\"][data-room=\"" + room.code + "\"]").value); });
    });
  }

  api.initTypePage({
    title: "Poker 配置",
    games: games,
    renderSummary: renderSummary,
    renderCapability: renderCapability,
    renderFields: renderFields,
    validateFields: validateFields,
    collectFields: collectFields
  });
}());
