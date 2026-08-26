(function () {
  "use strict";

  var rows = [
    { name: "星穹宝藏", code: "SLOT-1001", type: "SLOTS", bet: 2185600, payout: 2032608, profit: 152992, players: 3842, rtp: "93.0%", inventory: 12840, change: 8.2, attention: "正常", note: "当日表现正常，暂未发现需跟进的异常。" },
    { name: "极速德州", code: "POK-3001", type: "Poker", bet: 1568400, payout: 1468268, profit: 100132, players: 2184, rtp: "93.6%", inventory: 8260, change: 5.6, attention: "正常", note: "当日表现正常，活跃玩家与平台输赢均高于昨日。" },
    { name: "深海猎场", code: "FISH-2001", type: "FISH", bet: 1426800, payout: 1341192, profit: 85608, players: 2760, rtp: "94.0%", inventory: -9120, change: -3.1, attention: "需关注", note: "当日库存下降幅度较大，请核查高倍房派奖及活动投放情况。" },
    { name: "极速飞车", code: "MINI-4001", type: "Mini", bet: 1108200, payout: 1057632, profit: 50568, players: 1932, rtp: "95.4%", inventory: 4640, change: 1.8, attention: "正常", note: "当日表现正常，库存变动处于常规波动范围。" },
    { name: "黄金矿场", code: "SLOT-1002", type: "SLOTS", bet: 746580, payout: 716717, profit: 29863, players: 1104, rtp: "96.0%", inventory: -3850, change: -0.7, attention: "需关注", note: "RTP 接近预警阈值，建议结合奖池配置复核当日派奖。" },
    { name: "霓虹水果机", code: "SLOT-1003", type: "SLOTS", bet: 638420, payout: 619269, profit: 19151, players: 982, rtp: "97.0%", inventory: -2460, change: 2.4, attention: "需关注", note: "RTP 偏高，建议持续关注后续局次的库存变化。" },
    { name: "极地捕鱼王", code: "FISH-2002", type: "FISH", bet: 526800, payout: 508338, profit: 18462, players: 1018, rtp: "96.5%", inventory: 1890, change: 1.2, attention: "正常", note: "当日表现正常，未发现异常库存波动。" },
    { name: "短牌扑克", code: "POK-3002", type: "Poker", bet: 402600, payout: 388110, profit: 14490, players: 634, rtp: "94.5%", inventory: 1360, change: 4.8, attention: "正常", note: "当日表现正常，投注和活跃玩家均有增长。" },
    { name: "地雷宝藏", code: "MINI-4002", type: "Mini", bet: 318900, payout: 307746, profit: 11154, players: 522, rtp: "95.5%", inventory: 760, change: 0.9, attention: "正常", note: "当日表现正常，库存变动处于常规波动范围。" },
    { name: "黄金海岸", code: "FISH-2003", type: "FISH", bet: 286500, payout: 276474, profit: 10026, players: 486, rtp: "94.0%", inventory: -2240, change: -1.6, attention: "需关注", note: "投注金额较昨日下降，请关注渠道导量和入口曝光变化。" },
    { name: "弹珠风险台", code: "MINI-4003", type: "Mini", bet: 245800, payout: 238179, profit: 7621, players: 408, rtp: "94.0%", inventory: 520, change: 2.1, attention: "正常", note: "当日表现正常，暂无需处理事项。" },
    { name: "深海猎场·高倍房", code: "FISH-2001-H", type: "FISH", bet: 198400, payout: 192052, profit: 6348, players: 286, rtp: "96.8%", inventory: -2860, change: 0.5, attention: "需关注", note: "高倍房当日库存下降，请核查大额派奖记录。" }
  ];

  function esc(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
  }

  function formatNumber(value) {
    return Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function signedNumber(value) {
    return (value >= 0 ? "+" : "-") + formatNumber(value);
  }

  function signedPercent(value) {
    return (value >= 0 ? "+" : "") + value.toFixed(1) + "%";
  }

  function numberClass(value) {
    return value >= 0 ? "is-increase" : "is-decrease";
  }

  function sortValue(row, sort) {
    if (sort === "bet") { return row.bet; }
    if (sort === "players") { return row.players; }
    if (sort === "inventory") { return Math.abs(row.inventory); }
    return row.profit;
  }

  function sortLabel(sort) {
    return { profit: "平台输赢", bet: "投注金额", players: "活跃玩家", inventory: "库存变动幅度" }[sort];
  }

  function getVisibleRows() {
    var keyword = String(document.getElementById("performanceKeyword").value || "").trim().toLowerCase();
    var type = document.getElementById("performanceType").value;
    var attention = document.getElementById("performanceAttention").value;
    var sort = document.getElementById("performanceSort").value;
    return rows.filter(function (row) {
      return (type === "全部" || row.type === type) &&
        (attention === "全部" || row.attention === attention) &&
        (!keyword || (row.name + " " + row.code).toLowerCase().indexOf(keyword) !== -1);
    }).sort(function (left, right) { return sortValue(right, sort) - sortValue(left, sort); });
  }

  function render() {
    var sort = document.getElementById("performanceSort").value;
    var reportDate = document.getElementById("performanceDate").value;
    var visible = getVisibleRows();
    document.getElementById("performanceSortHint").textContent = "数据截至 " + reportDate + " 23:00 · 按" + sortLabel(sort) + "从高到低排列";
    document.getElementById("performanceRows").innerHTML = visible.length ? visible.map(function (row, index) {
      return "<tr><td>" + (index + 1) + "</td><td><strong>" + esc(row.name) + "</strong><small>" + esc(row.code) + "</small></td><td><span class=\"performance-tag\">" + esc(row.type) + "</span></td><td class=\"number-cell\">" + formatNumber(row.bet) + "</td><td class=\"number-cell\">" + formatNumber(row.payout) + "</td><td class=\"number-cell is-positive\">" + formatNumber(row.profit) + "</td><td class=\"number-cell\">" + row.players.toLocaleString("en-US") + "</td><td class=\"number-cell\">" + row.rtp + "</td><td class=\"number-cell " + numberClass(row.inventory) + "\">" + signedNumber(row.inventory) + "</td><td class=\"number-cell " + numberClass(row.change) + "\">" + signedPercent(row.change) + "</td><td><span class=\"performance-status " + (row.attention === "需关注" ? "is-attention" : "is-normal") + "\">" + row.attention + "</span></td><td><button class=\"performance-row-link\" type=\"button\" data-game-code=\"" + esc(row.code) + "\">查看</button></td></tr>";
    }).join("") : "<tr><td colspan=\"12\" style=\"text-align:center;color:#94a3b8;padding:28px\">暂无符合条件的自研游戏</td></tr>";
    document.getElementById("performanceCount").textContent = "共 " + visible.length + " 条 · 每页 20 条";
  }

  function showDetail(code) {
    var row = rows.filter(function (item) { return item.code === code; })[0];
    if (!row) { return; }
    document.getElementById("gameDetailTitle").textContent = row.name + " · 当日明细";
    document.getElementById("gameDetailSubtitle").textContent = document.getElementById("performanceDate").value + " 当日数据";
    document.getElementById("gameDetailData").innerHTML = "<dt>游戏编码</dt><dd>" + esc(row.code) + "</dd><dt>游戏类型</dt><dd>" + esc(row.type) + "</dd><dt>投注金额</dt><dd>" + formatNumber(row.bet) + "</dd><dt>派彩金额</dt><dd>" + formatNumber(row.payout) + "</dd><dt>平台输赢</dt><dd class=\"is-positive\">" + formatNumber(row.profit) + "</dd><dt>活跃玩家</dt><dd>" + row.players.toLocaleString("en-US") + "</dd><dt>RTP</dt><dd>" + row.rtp + "</dd><dt>当日库存变化</dt><dd class=\"" + numberClass(row.inventory) + "\">" + signedNumber(row.inventory) + "</dd>";
    document.getElementById("gameAttentionText").textContent = row.note;
    document.getElementById("gameDetailModal").hidden = false;
  }

  function closeDetail() {
    document.getElementById("gameDetailModal").hidden = true;
  }

  function exportRows() {
    var header = ["排名", "游戏名称", "游戏编码", "类型", "投注金额", "派彩金额", "平台输赢", "活跃玩家", "RTP", "当日库存变化", "较昨日", "运营关注"];
    var content = [header].concat(getVisibleRows().map(function (row, index) {
      return [index + 1, row.name, row.code, row.type, formatNumber(row.bet), formatNumber(row.payout), formatNumber(row.profit), row.players, row.rtp, signedNumber(row.inventory), signedPercent(row.change), row.attention];
    })).map(function (row) { return row.map(function (value) { return "\"" + String(value).replace(/\"/g, "\"\"") + "\""; }).join(","); }).join("\r\n");
    var blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "self-game-performance-" + document.getElementById("performanceDate").value + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast("当前筛选结果已导出");
  }

  function toast(message) {
    var node = document.getElementById("performanceToast");
    node.textContent = message;
    node.hidden = false;
    clearTimeout(node._timer);
    node._timer = setTimeout(function () { node.hidden = true; }, 2200);
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("performanceFilter").addEventListener("submit", function (event) { event.preventDefault(); render(); });
    document.getElementById("performanceReset").addEventListener("click", function () {
      document.getElementById("performanceDate").value = "2026-08-26";
      document.getElementById("performanceKeyword").value = "";
      document.getElementById("performanceType").value = "全部";
      document.getElementById("performanceAttention").value = "全部";
      document.getElementById("performanceSort").value = "profit";
      render();
    });
    document.getElementById("performanceSort").addEventListener("change", render);
    document.getElementById("performanceRows").addEventListener("click", function (event) {
      var button = event.target.closest("[data-game-code]");
      if (button) { showDetail(button.getAttribute("data-game-code")); }
    });
    document.getElementById("gameDetailModal").addEventListener("click", function (event) {
      if (event.target.hasAttribute("data-close-detail")) { closeDetail(); }
    });
    document.getElementById("exportPerformance").addEventListener("click", exportRows);
    render();
  });
}());
