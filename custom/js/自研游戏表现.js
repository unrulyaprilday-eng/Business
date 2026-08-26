(function () {
  "use strict";
  var rows = [
    ["星穹宝藏", "SLOT-1001", "SLOTS", "2,185,600.00", "2,032,608.00", "152,992.00", "35.0%", "3,842", "93.0%", "↑ 8.2%"],
    ["极速德州", "POK-3001", "Poker", "1,568,400.00", "1,468,268.00", "100,132.00", "22.9%", "2,184", "93.6%", "↑ 5.6%"],
    ["深海猎场", "FISH-2001", "FISH", "1,426,800.00", "1,341,192.00", "85,608.00", "19.6%", "2,760", "94.0%", "↑ 3.1%"],
    ["极速飞车", "MINI-4001", "Mini", "1,108,200.00", "1,057,632.00", "50,568.00", "11.6%", "1,932", "95.4%", "↑ 1.8%"],
    ["黄金矿场", "SLOT-1002", "SLOTS", "746,580.00", "716,717.00", "29,863.00", "6.8%", "1,104", "96.0%", "↓ 0.7%"]
    ,["霓虹水果机", "SLOT-1003", "SLOTS", "638,420.00", "619,269.00", "19,151.00", "4.4%", "982", "97.0%", "↑ 2.4%"]
    ,["极地捕鱼王", "FISH-2002", "FISH", "526,800.00", "508,338.00", "18,462.00", "4.2%", "1,018", "96.5%", "↑ 1.2%"]
    ,["短牌扑克", "POK-3002", "Poker", "402,600.00", "388,110.00", "14,490.00", "3.3%", "634", "94.5%", "↑ 4.8%"]
    ,["地雷宝藏", "MINI-4002", "Mini", "318,900.00", "307,746.00", "11,154.00", "2.6%", "522", "95.5%", "↑ 0.9%"]
    ,["黄金海岸", "FISH-2003", "FISH", "286,500.00", "276,474.00", "10,026.00", "2.3%", "486", "94.0%", "↓ 1.6%"]
    ,["弹珠风险台", "MINI-4003", "Mini", "245,800.00", "238,179.00", "7,621.00", "1.7%", "408", "94.0%", "↑ 2.1%"]
    ,["深海猎场·高倍房", "FISH-2001-H", "FISH", "198,400.00", "192,052.00", "6,348.00", "1.5%", "286", "96.8%", "↑ 0.5%"]
    ,["Teen Patti", "TP-3001", "Poker", "176,300.00", "170,484.00", "5,816.00", "1.3%", "242", "96.7%", "↑ 3.3%"]
    ,["极速飞车·高风险", "MINI-4001-H", "Mini", "152,600.00", "147,413.00", "5,187.00", "1.2%", "218", "96.6%", "↓ 0.4%"]
    ,["星穹宝藏·高倍房", "SLOT-1001-H", "SLOTS", "128,400.00", "124,162.00", "4,238.00", "1.0%", "186", "96.7%", "↑ 1.7%"]
    ,["扑克锦标赛", "POK-3003", "Poker", "114,800.00", "111,469.00", "3,331.00", "0.8%", "164", "97.1%", "↑ 0.6%"]
    ,["水果派对", "SLOT-1004", "SLOTS", "98,600.00", "95,937.00", "2,663.00", "0.6%", "145", "97.3%", "↑ 0.2%"]
    ,["迷你矿洞", "MINI-4004", "Mini", "86,200.00", "83,700.00", "2,500.00", "0.6%", "127", "97.1%", "↑ 1.4%"]
    ,["捕鱼狂欢", "FISH-2004", "FISH", "72,500.00", "70,905.00", "1,595.00", "0.4%", "108", "97.8%", "↓ 0.2%"]
    ,["极速德州·体验房", "POK-3001-E", "Poker", "54,800.00", "53,758.00", "1,042.00", "0.2%", "86", "98.1%", "↑ 0.3%"]
  ];
  function esc(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;"); }
  function render() {
    var keyword = String(document.getElementById("performanceKeyword").value || "").trim().toLowerCase();
    var type = document.getElementById("performanceType").value;
    var visible = rows.filter(function (row) { return (type === "全部" || row[2] === type) && (!keyword || (row[0] + " " + row[1]).toLowerCase().indexOf(keyword) !== -1); });
    var sortDirection = document.getElementById("performanceSort").value;
    visible.sort(function (a, b) { var left = Number(a[5].replace(/,/g, "")); var right = Number(b[5].replace(/,/g, "")); return sortDirection === "asc" ? left - right : right - left; });
    document.getElementById("performanceSortHint").textContent = sortDirection === "asc" ? "按平台输赢从低到高排列" : "按平台输赢从高到低排列";
    document.getElementById("performanceRows").innerHTML = visible.length ? visible.map(function (row, index) {
      return "<tr><td>" + (index + 1) + "</td><td><strong>" + esc(row[0]) + "</strong><small>" + esc(row[1]) + "</small></td><td><span class=\"performance-tag\">" + esc(row[2]) + "</span></td><td class=\"number-cell\">" + row[3] + "</td><td class=\"number-cell\">" + row[4] + "</td><td class=\"number-cell is-positive\">" + row[5] + "</td><td class=\"number-cell\">" + row[6] + "</td><td class=\"number-cell\">" + row[7] + "</td><td class=\"number-cell\">" + row[8] + "</td><td><span class=\"performance-up\">" + esc(row[9]) + "</span></td></tr>";
    }).join("") : "<tr><td colspan=\"10\" style=\"text-align:center;color:#94a3b8;padding:28px\">暂无符合条件的自研游戏</td></tr>";
    document.getElementById("performanceCount").textContent = "共 " + visible.length + " 条 · 每页 20 条";
  }
  function drawChart() {
    var host = document.getElementById("performanceChart");
    host.innerHTML = "<svg viewBox=\"0 0 720 190\" role=\"img\" aria-label=\"平台输赢与库存净变化趋势\"><polyline points=\"0,145 102,132 204,139 306,108 408,113 510,82 612,65 720,42\" fill=\"none\" stroke=\"#2f6fed\" stroke-width=\"3\"/><polyline points=\"0,162 102,150 204,153 306,140 408,132 510,120 612,105 720,96\" fill=\"none\" stroke=\"#f59e0b\" stroke-width=\"2\" stroke-dasharray=\"6 5\"/><g fill=\"#2f6fed\"><circle cx=\"0\" cy=\"145\" r=\"4\"/><circle cx=\"102\" cy=\"132\" r=\"4\"/><circle cx=\"204\" cy=\"139\" r=\"4\"/><circle cx=\"306\" cy=\"108\" r=\"4\"/><circle cx=\"408\" cy=\"113\" r=\"4\"/><circle cx=\"510\" cy=\"82\" r=\"4\"/><circle cx=\"612\" cy=\"65\" r=\"4\"/><circle cx=\"720\" cy=\"42\" r=\"4\"/></g><g fill=\"#64748b\" font-size=\"11\"><text x=\"0\" y=\"184\">08-20</text><text x=\"204\" y=\"184\">08-22</text><text x=\"408\" y=\"184\">08-24</text><text x=\"680\" y=\"184\">08-26</text></g></svg>";
  }
  function toast(message) { var node = document.getElementById("performanceToast"); node.textContent = message; node.hidden = false; clearTimeout(node._timer); node._timer = setTimeout(function () { node.hidden = true; }, 2200); }
  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("performanceFilter").addEventListener("submit", function (event) { event.preventDefault(); render(); });
    document.getElementById("performanceReset").addEventListener("click", function () { document.getElementById("performanceKeyword").value = ""; document.getElementById("performanceType").value = "全部"; render(); });
    document.getElementById("performanceSort").addEventListener("change", render);
    document.getElementById("exportPerformance").addEventListener("click", function () { toast("经营表现报表已生成"); });
    render();
    drawChart();
  });
}());
