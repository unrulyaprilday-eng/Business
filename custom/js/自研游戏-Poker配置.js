(function () {
  "use strict";

  var api = window.SelfGameConfig;
  if (!api) return;

  var games = [
    {
      code: "POK-3001",
      name: "极速德州",
      rtp: 95.0,
      updated: "2026-08-18 08:55",
      capability: { roomTypes: ["低分房", "中分房", "高分房"], scoreUnit: "积分" },
      rooms: [{ code: "P-L", name: "低分房", baseScore: 1, minEntry: 100 }, { code: "P-M", name: "中分房", baseScore: 10, minEntry: 1000 }, { code: "P-H", name: "高分房", baseScore: 100, minEntry: 10000 }],
      records: [{ time: "2026-08-18 08:55", game: "极速德州", action: "更新玩法配置", before: "94.0%", after: "95.0%", operator: "运营管理员" }]
    },
    {
      code: "POK-3002",
      name: "短牌扑克",
      rtp: 94.5,
      updated: "2026-08-17 12:30",
      capability: { roomTypes: ["低分房", "高分房"], scoreUnit: "积分" },
      rooms: [{ code: "S-L", name: "低分房", baseScore: 2, minEntry: 200 }, { code: "S-H", name: "高分房", baseScore: 50, minEntry: 5000 }],
      records: []
    }
  ];

  function renderSummary(game) {
    return game.rooms.length + " 个房间 · 低分房底分 " + game.rooms[0].baseScore + " · 最低进入 " + game.rooms[0].minEntry;
  }

  function renderCapability(game) {
    return [
      "<div class=\"self-game-capability-item\"><span>玩法类型</span><strong>Poker</strong></div>",
      "<div class=\"self-game-capability-item\"><span>支持房间</span><strong>" + game.capability.roomTypes.join(" / ") + "</strong></div>",
      "<div class=\"self-game-capability-item\"><span>进入条件单位</span><strong>" + game.capability.scoreUnit + "</strong></div>"
    ].join("");
  }

  function renderFields(game) {
    return [
      "<section class=\"self-game-config-section\">",
      "<h3>房间底分与最低进入条件</h3>",
      "<p>房间类型来自游戏基础数据，SaaS 仅配置房间底分和玩家最低进入条件。</p>",
      "<table class=\"self-game-data-table\"><thead><tr><th>房间</th><th>房间底分</th><th>最低进入条件</th><th>单位</th></tr></thead><tbody>",
      game.rooms.map(function (room) {
        return "<tr><td>" + room.name + "<span class=\"self-game-help\">（" + room.code + "）</span></td><td><input class=\"poker-base-score\" type=\"number\" min=\"0.1\" step=\"0.1\" value=\"" + room.baseScore + "\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-min-entry\" type=\"number\" min=\"0.1\" step=\"0.1\" value=\"" + room.minEntry + "\" data-room=\"" + room.code + "\"></td><td>" + game.capability.scoreUnit + "</td></tr>";
      }).join(""),
      "</tbody></table>",
      "</section>"
    ].join("");
  }

  function validateFields(root) {
    var error = "";
    root.querySelectorAll(".poker-base-score, .poker-min-entry").forEach(function (input) {
      if (!isFinite(Number(input.value)) || Number(input.value) <= 0) error = "房间底分和最低进入条件必须大于 0";
    });
    return error;
  }

  function collectFields(root, game) {
    game.rooms.forEach(function (room) {
      var base = root.querySelector(".poker-base-score[data-room=\"" + room.code + "\"]");
      var entry = root.querySelector(".poker-min-entry[data-room=\"" + room.code + "\"]");
      if (base) room.baseScore = Number(base.value);
      if (entry) room.minEntry = Number(entry.value);
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
