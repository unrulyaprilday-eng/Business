(function () {
  "use strict";

  var api = window.SelfGameConfig;
  if (!api) return;

  var games = [
    {
      code: "SLOT-1001",
      name: "星穹宝藏",
      rtp: 96.0,
      updated: "2026-08-18 09:30",
      capability: { freeGamePurchase: true, baseBets: [1, 5, 10, 50] },
      enabledBets: [1, 5, 10],
      freeGameAllowed: true,
      records: [{ time: "2026-08-18 09:30", game: "星穹宝藏", action: "更新玩法配置", before: "95.0%", after: "96.0%", operator: "运营管理员" }]
    },
    {
      code: "SLOT-1002",
      name: "黄金矿场",
      rtp: 95.0,
      updated: "2026-08-17 16:20",
      capability: { freeGamePurchase: false, baseBets: [0.5, 1, 2, 5] },
      enabledBets: [0.5, 1, 2],
      freeGameAllowed: false,
      records: [{ time: "2026-08-17 16:20", game: "黄金矿场", action: "更新玩法配置", before: "94.5%", after: "95.0%", operator: "运营管理员" }]
    },
    {
      code: "SLOT-1003",
      name: "霓虹水果机",
      rtp: 97.0,
      updated: "2026-08-16 11:05",
      capability: { freeGamePurchase: true, baseBets: [1, 2, 5, 10, 20] },
      enabledBets: [1, 2, 5, 10],
      freeGameAllowed: false,
      records: []
    }
  ];

  function renderSummary(game) {
    return "底分 " + game.enabledBets.join(" / ") + " · " + (game.capability.freeGamePurchase ? "Free Game 支持" : "Free Game 不支持");
  }

  function renderCapability(game) {
    return [
      "<div class=\"self-game-capability-item\"><span>玩法类型</span><strong>SLOTS</strong></div>",
      "<div class=\"self-game-capability-item\"><span>Free Game 能力</span><strong>" + (game.capability.freeGamePurchase ? "支持购买" : "不支持购买") + "</strong></div>",
      "<div class=\"self-game-capability-item\"><span>基础底分</span><strong>" + game.capability.baseBets.join(" / ") + "</strong></div>"
    ].join("");
  }

  function renderFields(game) {
    return [
      "<section class=\"self-game-config-section\">",
      "<h3>投注底分</h3>",
      "<p>只能选择游戏基础能力提供的底分，未勾选的底分不会对玩家开放。</p>",
      "<div class=\"self-game-option-grid\">",
      game.capability.baseBets.map(function (value) {
        var checked = game.enabledBets.indexOf(value) !== -1 ? " checked" : "";
        return "<label class=\"self-game-option\"><input class=\"slot-bet-option\" type=\"checkbox\" value=\"" + value + "\"" + checked + "><span>底分 " + value + "</span></label>";
      }).join(""),
      "</div>",
      "</section>",
      "<section class=\"self-game-config-section\">",
      "<h3>购买 Free Game</h3>",
      "<p>该开关仅在游戏基础能力支持时可编辑，购买价格由游戏基础数据提供。</p>",
      "<label class=\"self-game-switch\">",
      "<input id=\"slotFreeGame\" type=\"checkbox\"" + (game.freeGameAllowed ? " checked" : "") + (game.capability.freeGamePurchase ? "" : " disabled") + ">",
      "<span class=\"self-game-switch-track\"></span>",
      "<span class=\"self-game-switch-text\">" + (game.capability.freeGamePurchase ? "允许购买" : "游戏不支持") + "</span>",
      "</label>",
      "</section>"
    ].join("");
  }

  function validateFields(root) {
    if (!root.querySelectorAll(".slot-bet-option:checked").length) {
      return "至少选择一个投注底分";
    }
    return "";
  }

  function collectFields(root, game) {
    game.enabledBets = Array.prototype.map.call(root.querySelectorAll(".slot-bet-option:checked"), function (item) {
      return Number(item.value);
    });
    var freeGame = root.querySelector("#slotFreeGame");
    if (freeGame && !freeGame.disabled) game.freeGameAllowed = freeGame.checked;
  }

  api.initTypePage({
    title: "SLOTS 配置",
    games: games,
    renderSummary: renderSummary,
    renderCapability: renderCapability,
    renderFields: renderFields,
    validateFields: validateFields,
    collectFields: collectFields
  });
}());
