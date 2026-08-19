(function () {
  "use strict";

  var api = window.SelfGameConfig;
  if (!api) return;

  var games = [
    {
      code: "MINI-4001",
      name: "极速飞车",
      miniType: "Crash",
      rtp: 96.5,
      updated: "2026-08-17 17:10",
      capability: { fields: ["最大结算倍数", "自动结束阈值"] },
      params: [{ key: "maxMultiplier", label: "最大结算倍数", value: "500", unit: "倍", type: "number", min: 1, max: 10000, step: 1 }, { key: "autoStop", label: "自动结束阈值", value: "1.2", unit: "倍", type: "number", min: 1, max: 100, step: 0.1 }],
      records: []
    },
    {
      code: "MINI-4002",
      name: "地雷宝藏",
      miniType: "Mines",
      rtp: 95.5,
      updated: "2026-08-16 15:45",
      capability: { fields: ["雷区数量", "风险档位"] },
      params: [{ key: "mineCount", label: "雷区数量", value: "5", unit: "个", type: "number", min: 1, max: 24, step: 1 }, { key: "riskLevel", label: "风险档位", value: "中", unit: "", type: "select", options: ["低", "中", "高"] }],
      records: [{ time: "2026-08-16 15:45", game: "地雷宝藏", action: "更新玩法配置", before: "95.0%", after: "95.5%", operator: "运营管理员" }]
    },
    {
      code: "MINI-4003",
      name: "弹珠风险台",
      miniType: "Plinko",
      rtp: 94.0,
      updated: "2026-08-15 10:22",
      capability: { fields: ["风险档位", "落点行数"] },
      params: [{ key: "riskLevel", label: "风险档位", value: "中", unit: "", type: "select", options: ["低", "中", "高"] }, { key: "rows", label: "落点行数", value: "12", unit: "行", type: "number", min: 8, max: 20, step: 1 }],
      records: []
    }
  ];

  function renderSummary(game) {
    return game.miniType + " · " + game.params.length + " 个专属参数";
  }

  function renderCapability(game) {
    return [
      "<div class=\"self-game-capability-item\"><span>玩法类型</span><strong>Mini / " + game.miniType + "</strong></div>",
      "<div class=\"self-game-capability-item\"><span>基础参数</span><strong>" + game.capability.fields.length + " 项</strong></div>",
      "<div class=\"self-game-capability-item\"><span>可配置字段</span><strong>游戏能力提供</strong></div>"
    ].join("");
  }

  function renderFields(game) {
    return [
      "<section class=\"self-game-config-section\">",
      "<h3>" + game.miniType + " 专属参数</h3>",
      "<p>参数名称和可用范围由游戏基础能力提供，配置页只展示当前游戏支持的字段。</p>",
      "<table class=\"self-game-data-table\"><thead><tr><th>参数</th><th>配置值</th><th>单位</th><th>能力范围</th></tr></thead><tbody>",
      game.params.map(function (param) {
        var control = param.type === "select"
          ? "<select class=\"mini-param\" data-param=\"" + param.key + "\">" + param.options.map(function (option) { return "<option" + (option === param.value ? " selected" : "") + ">" + option + "</option>"; }).join("") + "</select>"
          : "<input class=\"mini-param\" type=\"number\" min=\"" + param.min + "\" max=\"" + param.max + "\" step=\"" + param.step + "\" value=\"" + param.value + "\" data-param=\"" + param.key + "\">";
        var range = param.type === "select" ? param.options.join(" / ") : param.min + "～" + param.max;
        return "<tr><td>" + param.label + "</td><td>" + control + "</td><td>" + param.unit + "</td><td>" + range + "</td></tr>";
      }).join(""),
      "</tbody></table>",
      "</section>"
    ].join("");
  }

  function validateFields(root, game) {
    var error = "";
    root.querySelectorAll(".mini-param[type=number]").forEach(function (input) {
      var value = Number(input.value);
      var param = game.params.filter(function (item) { return item.key === input.getAttribute("data-param"); })[0];
      if (!param || !isFinite(value) || value < param.min || value > param.max) error = "Mini 参数必须在游戏基础能力范围内";
    });
    return error;
  }

  function collectFields(root, game) {
    game.params.forEach(function (param) {
      var input = root.querySelector(".mini-param[data-param=\"" + param.key + "\"]");
      if (input) param.value = input.type === "number" ? input.value : input.value;
    });
  }

  api.initTypePage({
    title: "Mini 配置",
    games: games,
    renderSummary: renderSummary,
    renderCapability: renderCapability,
    renderFields: renderFields,
    validateFields: validateFields,
    collectFields: collectFields
  });
}());
