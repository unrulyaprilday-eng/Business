(function () {
  "use strict";

  var api = window.SelfGameConfig;
  if (!api) return;

  var games = [
    {
      code: "FISH-2001",
      name: "深海猎场",
      rtp: 95.5,
      updated: "2026-08-18 10:05",
      capability: { levels: 6, minAmount: 0.1, maxAmount: 100, step: 0.1 },
      cannons: [{ level: 1, amount: 0.1 }, { level: 2, amount: 0.5 }, { level: 3, amount: 1 }, { level: 4, amount: 5 }, { level: 5, amount: 10 }, { level: 6, amount: 50 }],
      records: []
    },
    {
      code: "FISH-2002",
      name: "极地捕鱼王",
      rtp: 96.5,
      updated: "2026-08-17 14:18",
      capability: { levels: 5, minAmount: 0.1, maxAmount: 50, step: 0.1 },
      cannons: [{ level: 1, amount: 0.1 }, { level: 2, amount: 0.2 }, { level: 3, amount: 1 }, { level: 4, amount: 5 }, { level: 5, amount: 20 }],
      records: [{ time: "2026-08-17 14:18", game: "极地捕鱼王", action: "更新玩法配置", before: "96.0%", after: "96.5%", operator: "运营管理员" }]
    },
    {
      code: "FISH-2003",
      name: "黄金海岸",
      rtp: 94.0,
      updated: "2026-08-16 09:40",
      capability: { levels: 4, minAmount: 1, maxAmount: 100, step: 1 },
      cannons: [{ level: 1, amount: 1 }, { level: 2, amount: 5 }, { level: 3, amount: 10 }, { level: 4, amount: 50 }],
      records: []
    }
  ];

  function renderSummary(game) {
    var first = game.cannons[0];
    var last = game.cannons[game.cannons.length - 1];
    return game.cannons.length + " 个炮台 · " + first.amount + "～" + last.amount + " / 炮";
  }

  function renderCapability(game) {
    return [
      "<div class=\"self-game-capability-item\"><span>玩法类型</span><strong>FISH</strong></div>",
      "<div class=\"self-game-capability-item\"><span>炮台档位</span><strong>" + game.capability.levels + " 档</strong></div>",
      "<div class=\"self-game-capability-item\"><span>金额范围</span><strong>" + game.capability.minAmount + "～" + game.capability.maxAmount + "</strong></div>",
      "<div class=\"self-game-capability-item\"><span>调整步长</span><strong>" + game.capability.step + "</strong></div>"
    ].join("");
  }

  function renderFields(game) {
    return [
      "<section class=\"self-game-config-section\">",
      "<h3>炮台金额梯度</h3>",
      "<p>可在游戏基础数据提供的范围内调整每个炮台档位的金额，级数和步长不可超过能力限制。</p>",
      "<table class=\"self-game-data-table\"><thead><tr><th>炮台档位</th><th>当前每炮金额</th><th>金额范围</th><th>调整步长</th></tr></thead><tbody>",
      game.cannons.map(function (cannon) {
        return "<tr><td>炮台 " + cannon.level + "</td><td><input class=\"fish-amount\" type=\"number\" min=\"" + game.capability.minAmount + "\" max=\"" + game.capability.maxAmount + "\" step=\"" + game.capability.step + "\" value=\"" + cannon.amount + "\" data-level=\"" + cannon.level + "\"></td><td>" + game.capability.minAmount + "～" + game.capability.maxAmount + "</td><td>" + game.capability.step + "</td></tr>";
      }).join(""),
      "</tbody></table>",
      "</section>"
    ].join("");
  }

  function validateFields(root, game) {
    var error = "";
    root.querySelectorAll(".fish-amount").forEach(function (input) {
      var value = Number(input.value);
      var scale = Math.round(value / game.capability.step);
      if (!isFinite(value) || value < game.capability.minAmount || value > game.capability.maxAmount || Math.abs(scale * game.capability.step - value) > 0.000001) {
        error = "炮台金额必须在基础数据范围内，并符合步长 " + game.capability.step;
      }
    });
    return error;
  }

  function collectFields(root, game) {
    root.querySelectorAll(".fish-amount").forEach(function (input) {
      var level = Number(input.getAttribute("data-level"));
      game.cannons.forEach(function (cannon) {
        if (cannon.level === level) cannon.amount = Number(input.value);
      });
    });
  }

  api.initTypePage({
    title: "FISH 配置",
    games: games,
    renderSummary: renderSummary,
    renderCapability: renderCapability,
    renderFields: renderFields,
    validateFields: validateFields,
    collectFields: collectFields
  });
}());
