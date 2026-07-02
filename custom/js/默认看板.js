(function () {
  var PERIODS = ["今日", "昨日", "最近7日", "最近30日"];
  var SECONDARY_PERIODS = ["最近7日", "最近30日"];
  var secondaryTrendState = {
    flow: "最近7日",
    loss: "最近7日"
  };

  var PERIOD_DATA = {
    "今日": {
      label: "今日",
      overview: {
        game: {
          headline: "今日投注额",
          value: "12,864,300.00",
          metrics: [
            ["注单数", "32,845"],
            ["客损", "952,660.00", "positive"],
            ["赢分", "11,911,640.00"],
            ["投注会员", "4,286"]
          ]
        },
        member: {
          headline: "今日活跃会员",
          value: "10,312",
          metrics: [
            ["新增注册", "1,186"],
            ["当前在线", "1,286"],
            ["首充人数", "386"],
            ["累计注册", "486,920"]
          ]
        },
        fund: {
          headline: "今日充提差",
          value: "+1,084,600.00",
          metrics: [
            ["充值金额", "3,268,900.00"],
            ["提现金额", "2,184,300.00"],
            ["充提比", "1.50"],
            ["充值成功率", "86.4%"]
          ]
        },
        risk: {
          headline: "待处理风险",
          value: "7 项",
          metrics: [
            ["大额盈利", "3 人", "negative"],
            ["刷子预警", "7 人", "warning"],
            ["提现复核", "18 笔", "warning"],
            ["会员投诉", "5 件"]
          ]
        }
      },
      trendSummary: [
        ["今日投注额", "12,864,300.00"],
        ["昨日同段", "11,402,800.00"],
        ["峰值时段", "20:00 - 22:00"]
      ],
      mainAxis: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "当前"],
      mainY: ["14M", "11M", "8M", "5M", "2M"],
      legend: ["今日", "昨日同段"],
      flowAxis: ["6/26", "6/27", "6/28", "6/29", "6/30", "7/1", "今日"],
      flowY: ["4M", "3M", "2M", "1M", "0"],
      lossAxis: ["6/26", "6/27", "6/28", "6/29", "6/30", "7/1", "今日"],
      lossY: ["+1.2M", "+0.6M", "0", "-0.6M"],
      rankScale: 1,
      roiOffset: 0
    },
    "昨日": {
      label: "昨日",
      overview: {
        game: {
          headline: "昨日投注额",
          value: "11,402,800.00",
          metrics: [
            ["注单数", "29,618"],
            ["客损", "816,420.00", "positive"],
            ["赢分", "10,586,380.00"],
            ["投注会员", "3,964"]
          ]
        },
        member: {
          headline: "昨日活跃会员",
          value: "9,846",
          metrics: [
            ["新增注册", "1,028"],
            ["当前在线", "1,286"],
            ["首充人数", "342"],
            ["累计注册", "486,920"]
          ]
        },
        fund: {
          headline: "昨日充提差",
          value: "+936,800.00",
          metrics: [
            ["充值金额", "2,984,600.00"],
            ["提现金额", "2,047,800.00"],
            ["充提比", "1.46"],
            ["充值成功率", "85.7%"]
          ]
        },
        risk: {
          headline: "待处理风险",
          value: "7 项",
          metrics: [
            ["大额盈利", "3 人", "negative"],
            ["刷子预警", "7 人", "warning"],
            ["提现复核", "18 笔", "warning"],
            ["会员投诉", "5 件"]
          ]
        }
      },
      trendSummary: [
        ["昨日投注额", "11,402,800.00"],
        ["前日同段", "10,936,500.00"],
        ["峰值时段", "19:00 - 21:00"]
      ],
      mainAxis: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"],
      mainY: ["12M", "10M", "8M", "5M", "2M"],
      legend: ["昨日", "前日同段"],
      flowAxis: ["6/25", "6/26", "6/27", "6/28", "6/29", "6/30", "昨日"],
      flowY: ["3.5M", "2.8M", "2.1M", "1.4M", "0"],
      lossAxis: ["6/25", "6/26", "6/27", "6/28", "6/29", "6/30", "昨日"],
      lossY: ["+1.0M", "+0.5M", "0", "-0.5M"],
      rankScale: 0.92,
      roiOffset: -6
    },
    "最近7日": {
      label: "最近7日",
      overview: {
        game: {
          headline: "最近7日投注额",
          value: "78,496,200.00",
          metrics: [
            ["注单数", "218,640"],
            ["客损", "5,684,900.00", "positive"],
            ["赢分", "72,811,300.00"],
            ["投注会员", "18,926"]
          ]
        },
        member: {
          headline: "最近7日活跃会员",
          value: "42,860",
          metrics: [
            ["新增注册", "7,482"],
            ["当前在线", "1,286"],
            ["首充人数", "2,268"],
            ["累计注册", "486,920"]
          ]
        },
        fund: {
          headline: "最近7日充提差",
          value: "+6,982,400.00",
          metrics: [
            ["充值金额", "21,406,800.00"],
            ["提现金额", "14,424,400.00"],
            ["充提比", "1.48"],
            ["充值成功率", "86.1%"]
          ]
        },
        risk: {
          headline: "待处理风险",
          value: "7 项",
          metrics: [
            ["大额盈利", "3 人", "negative"],
            ["刷子预警", "7 人", "warning"],
            ["提现复核", "18 笔", "warning"],
            ["会员投诉", "5 件"]
          ]
        }
      },
      trendSummary: [
        ["最近7日投注额", "78,496,200.00"],
        ["前7日同期", "73,105,600.00"],
        ["高峰日期", "6/29"]
      ],
      mainAxis: ["6/26", "6/27", "6/28", "6/29", "6/30", "7/1", "今日"],
      mainY: ["82M", "64M", "46M", "28M", "10M"],
      legend: ["最近7日", "前7日同期"],
      flowAxis: ["6/26", "6/27", "6/28", "6/29", "6/30", "7/1", "今日"],
      flowY: ["22M", "16M", "10M", "4M", "0"],
      lossAxis: ["6/26", "6/27", "6/28", "6/29", "6/30", "7/1", "今日"],
      lossY: ["+6M", "+3M", "0", "-3M"],
      rankScale: 6.4,
      roiOffset: 4
    },
    "最近30日": {
      label: "最近30日",
      overview: {
        game: {
          headline: "最近30日投注额",
          value: "326,846,500.00",
          metrics: [
            ["注单数", "906,284"],
            ["客损", "23,486,800.00", "positive"],
            ["赢分", "303,359,700.00"],
            ["投注会员", "64,812"]
          ]
        },
        member: {
          headline: "最近30日活跃会员",
          value: "128,640",
          metrics: [
            ["新增注册", "31,680"],
            ["当前在线", "1,286"],
            ["首充人数", "9,842"],
            ["累计注册", "486,920"]
          ]
        },
        fund: {
          headline: "最近30日充提差",
          value: "+28,946,200.00",
          metrics: [
            ["充值金额", "89,246,800.00"],
            ["提现金额", "60,300,600.00"],
            ["充提比", "1.48"],
            ["充值成功率", "85.9%"]
          ]
        },
        risk: {
          headline: "待处理风险",
          value: "7 项",
          metrics: [
            ["大额盈利", "3 人", "negative"],
            ["刷子预警", "7 人", "warning"],
            ["提现复核", "18 笔", "warning"],
            ["会员投诉", "5 件"]
          ]
        }
      },
      trendSummary: [
        ["最近30日投注额", "326,846,500.00"],
        ["前30日同期", "304,520,800.00"],
        ["高峰日期", "6/29"]
      ],
      mainAxis: ["6/3", "6/8", "6/13", "6/18", "6/23", "6/28", "今日"],
      mainY: ["340M", "260M", "180M", "100M", "20M"],
      legend: ["最近30日", "前30日同期"],
      flowAxis: ["6/3", "6/8", "6/13", "6/18", "6/23", "6/28", "今日"],
      flowY: ["92M", "70M", "48M", "26M", "0"],
      lossAxis: ["6/3", "6/8", "6/13", "6/18", "6/23", "6/28", "今日"],
      lossY: ["+24M", "+12M", "0", "-12M"],
      rankScale: 26,
      roiOffset: 8
    }
  };

  var SECONDARY_TREND_DATA = {
    flow: {
      "最近7日": {
        y: ["4M", "3M", "2M", "1M", "0"],
        axis: ["6/26", "6/27", "6/28", "6/29", "6/30", "7/1", "今日"],
        label: "充值提现趋势（最近7日）"
      },
      "最近30日": {
        y: ["18M", "13M", "8M", "3M", "0"],
        axis: ["6/3", "6/8", "6/13", "6/18", "6/23", "6/28", "今日"],
        label: "充值提现趋势（最近30日）"
      }
    },
    loss: {
      "最近7日": {
        y: ["+1.2M", "+0.6M", "0", "-0.6M"],
        axis: ["6/26", "6/27", "6/28", "6/29", "6/30", "7/1", "今日"],
        label: "客损趋势（最近7日）"
      },
      "最近30日": {
        y: ["+5M", "+2.5M", "0", "-2.5M"],
        axis: ["6/3", "6/8", "6/13", "6/18", "6/23", "6/28", "今日"],
        label: "客损趋势（最近30日）"
      }
    }
  };

  var RANK_BASE = {
    gameType: [
      { name: "电子", bet: 3418600, loss: 264800, users: 1786, bar: 100 },
      { name: "区块链", bet: 2804200, loss: 196500, users: 936, bar: 82 },
      { name: "视讯", bet: 2526800, loss: 186200, users: 708, bar: 74 },
      { name: "体育", bet: 2104900, loss: -86400, users: 642, bar: 62, warn: true },
      { name: "棋牌", bet: 1026300, loss: 92180, users: 396, bar: 30 },
      { name: "彩票", bet: 782500, loss: 48600, users: 284, bar: 23 },
      { name: "捕鱼", bet: 596800, loss: 36900, users: 218, bar: 17 }
    ],
    vendor: [
      { name: "PG", bet: 2286400, loss: 218700, status: "正常", statusClass: "cl-status-success", bar: 100 },
      { name: "Evolution", bet: 2064800, loss: 172300, status: "正常", statusClass: "cl-status-success", bar: 90 },
      { name: "Pragmatic", bet: 1496200, loss: -42500, status: "波动", statusClass: "cl-status-warning", bar: 65, warn: true },
      { name: "JILI", bet: 1126900, loss: 96400, status: "正常", statusClass: "cl-status-success", bar: 49 },
      { name: "Spribe", bet: 782600, loss: 58200, status: "正常", statusClass: "cl-status-success", bar: 34 },
      { name: "CQ9", bet: 668400, loss: 42800, status: "正常", statusClass: "cl-status-success", bar: 29 },
      { name: "JDB", bet: 552700, loss: 31600, status: "正常", statusClass: "cl-status-success", bar: 24 },
      { name: "BBIN", bet: 468200, loss: -16300, status: "波动", statusClass: "cl-status-warning", bar: 20, warn: true },
      { name: "Sexy Gaming", bet: 392900, loss: 26100, status: "正常", statusClass: "cl-status-success", bar: 17 },
      { name: "FC", bet: 324800, loss: 18900, status: "正常", statusClass: "cl-status-success", bar: 14 }
    ],
    channel: [
      { name: "自然流量", register: 426, firstDeposit: 168, roi: 186.2, bar: 100 },
      { name: "Google", register: 318, firstDeposit: 96, roi: 142.8, bar: 77 },
      { name: "TikTok", register: 246, firstDeposit: 62, roi: 92.4, bar: 50, warn: true },
      { name: "Meta", register: 198, firstDeposit: 48, roi: 108.6, bar: 42 },
      { name: "代理渠道", register: 166, firstDeposit: 36, roi: 86.5, bar: 34, warn: true },
      { name: "Facebook", register: 142, firstDeposit: 34, roi: 103.2, bar: 30 },
      { name: "SEO", register: 126, firstDeposit: 29, roi: 118.4, bar: 26 },
      { name: "Telegram", register: 98, firstDeposit: 20, roi: 76.8, bar: 21, warn: true },
      { name: "短信召回", register: 82, firstDeposit: 18, roi: 96.4, bar: 17 },
      { name: "落地页 A", register: 68, firstDeposit: 13, roi: 64.2, bar: 14, warn: true }
    ],
    member: [
      { name: "vip_4821", profit: 286400, bet: 820000, r: "R5", statusClass: "cl-status-danger", bar: 100 },
      { name: "james_908", profit: 176200, bet: 610800, r: "R5", statusClass: "cl-status-danger", bar: 62 },
      { name: "sun_7720", profit: 124600, bet: 386400, r: "R4", statusClass: "cl-status-warning", bar: 44 },
      { name: "mika_6618", profit: 88900, bet: 296400, r: "R4", statusClass: "cl-status-warning", bar: 31 },
      { name: "lee_3056", profit: 68200, bet: 240800, r: "R3", statusClass: "cl-status-warning", bar: 24 },
      { name: "chen_1880", profit: 58400, bet: 218300, r: "R3", statusClass: "cl-status-warning", bar: 20 },
      { name: "alex_7091", profit: 51600, bet: 196800, r: "R2", statusClass: "cl-status-muted", bar: 18 },
      { name: "nora_5207", profit: 42800, bet: 168400, r: "R2", statusClass: "cl-status-muted", bar: 15 },
      { name: "king_9012", profit: 36900, bet: 152600, r: "R2", statusClass: "cl-status-muted", bar: 13 },
      { name: "rose_3341", profit: 31800, bet: 138200, r: "R1", statusClass: "cl-status-muted", bar: 11 }
    ]
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function formatMoney(value, signed) {
    var sign = value < 0 ? "-" : signed ? "+" : "";
    var abs = Math.abs(Math.round(value));
    return sign + abs.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatInt(value) {
    return Math.round(value).toLocaleString("en-US");
  }

  function setText(selector, value, root) {
    var target = (root || document).querySelector(selector);

    if (target) {
      target.textContent = value;
    }
  }

  function renderMetrics(card, metrics) {
    var list = card.querySelector(".domain-metrics");

    if (!list) {
      return;
    }

    list.innerHTML = metrics.map(function (item) {
      var tone = item[2] ? " class=\"" + item[2] + "\"" : "";
      return "<div><dt>" + escapeHtml(item[0]) + "</dt><dd" + tone + ">" + escapeHtml(item[1]) + "</dd></div>";
    }).join("");
  }

  function updateOverview(data) {
    [
      ["game", ".domain-game"],
      ["member", ".domain-member"],
      ["fund", ".domain-fund"],
      ["risk", ".domain-risk"]
    ].forEach(function (pair) {
      var item = data.overview[pair[0]];
      var card = document.querySelector(pair[1]);

      if (!card || !item) {
        return;
      }

      setText(".domain-card-head span:not(.summary-icon)", item.headline, card);
      setText(".domain-card-head strong", item.value, card);
      renderMetrics(card, item.metrics);
    });
  }

  function renderTrendSummary(items) {
    var summary = document.querySelector(".trend-summary");

    if (!summary) {
      return;
    }

    summary.innerHTML = items.map(function (item) {
      return "<span><b>" + escapeHtml(item[0]) + "</b> " + escapeHtml(item[1]) + "</span>";
    }).join("");
  }

  function renderTextList(selector, items) {
    var wrap = document.querySelector(selector);

    if (!wrap) {
      return;
    }

    wrap.innerHTML = items.map(function (item) {
      return "<span>" + escapeHtml(item) + "</span>";
    }).join("");
  }

  function updateTrend(data) {
    renderTrendSummary(data.trendSummary);
    renderTextList(".trend-y-labels", data.mainY);
    renderTextList(".trend-chart .axis-labels", data.mainAxis);
    setText(".trend-legend .legend-current", data.legend[0]);
    setText(".trend-legend .legend-compare", data.legend[1]);

    var chart = document.querySelector(".trend-chart");
    if (chart) {
      chart.setAttribute("aria-label", data.label + "投注额趋势图");
    }
  }

  function updateSecondaryTrend(type, period) {
    var group = SECONDARY_TREND_DATA[type];
    var data = group && (group[period] || group["最近7日"]);
    var selectors = {
      flow: {
        card: ".fund-flow-card",
        chart: ".flow-trend-chart"
      },
      loss: {
        card: ".profit-card",
        chart: ".loss-trend-chart"
      }
    }[type];

    if (!data || !selectors) {
      return;
    }

    secondaryTrendState[type] = period;
    renderTextList(selectors.chart + " .chart-y-axis", data.y);
    renderTextList(selectors.chart + " .chart-axis-row", data.axis);

    var card = document.querySelector(selectors.card);
    var tabs = card && card.querySelector(".period-tabs[data-secondary-period]");
    var chart = document.querySelector(selectors.chart);

    if (tabs) {
      setActivePeriod(tabs, period);
    }

    if (chart) {
      chart.setAttribute("aria-label", data.label);
    }
  }

  function rankIndexCell(index) {
    return "<td><span class=\"rank-index" + (index === 0 ? " is-top" : "") + "\">" + (index + 1) + "</span></td>";
  }

  function nameCell(row) {
    var tone = row.warn ? " is-warn" : row.danger ? " is-danger" : "";
    return "<td>" + escapeHtml(row.name) + "<div class=\"rank-scorebar" + tone + "\"><i style=\"width: " + row.bar + "%\"></i></div></td>";
  }

  function cell(value, className) {
    return "<td" + (className ? " class=\"" + className + "\"" : "") + ">" + value + "</td>";
  }

  function statusCell(text, className) {
    return "<td><span class=\"cl-status " + className + "\">" + escapeHtml(text) + "</span></td>";
  }

  function renderRankTable(panelName, headers, rows) {
    var panel = document.querySelector("[data-rank-panel=\"" + panelName + "\"]");

    if (!panel) {
      return;
    }

    var head = panel.querySelector("thead");
    var body = panel.querySelector("tbody");

    if (!head || !body) {
      return;
    }

    head.innerHTML = "<tr>" + headers.map(function (item) {
      return "<th" + (item.num ? " class=\"cl-num\"" : "") + ">" + escapeHtml(item.text) + "</th>";
    }).join("") + "</tr>";
    body.innerHTML = rows.join("");
  }

  function buildRankRows(data) {
    var scale = data.rankScale;

    renderRankTable("gameType", [
      { text: "排名" },
      { text: "类型" },
      { text: "投注额", num: true },
      { text: "客损", num: true },
      { text: "投注会员", num: true }
    ], RANK_BASE.gameType.map(function (row, index) {
      var loss = Math.round(row.loss * scale);
      return "<tr>" +
        rankIndexCell(index) +
        nameCell(row) +
        cell(formatMoney(row.bet * scale), "cl-num") +
        cell(formatMoney(loss, loss > 0), "cl-num " + (loss >= 0 ? "positive" : "negative")) +
        cell(formatInt(row.users * Math.sqrt(scale)), "cl-num") +
      "</tr>";
    }));

    renderRankTable("vendor", [
      { text: "排名" },
      { text: "厂商" },
      { text: "投注额", num: true },
      { text: "客损", num: true },
      { text: "状态" }
    ], RANK_BASE.vendor.map(function (row, index) {
      var loss = Math.round(row.loss * scale);
      return "<tr>" +
        rankIndexCell(index) +
        nameCell(row) +
        cell(formatMoney(row.bet * scale), "cl-num") +
        cell(formatMoney(loss, loss > 0), "cl-num " + (loss >= 0 ? "positive" : "negative")) +
        statusCell(row.status, row.statusClass) +
      "</tr>";
    }));

    renderRankTable("channel", [
      { text: "排名" },
      { text: "渠道" },
      { text: "注册", num: true },
      { text: "首充", num: true },
      { text: "ROI", num: true }
    ], RANK_BASE.channel.map(function (row, index) {
      var roi = Math.max(0, row.roi + data.roiOffset);
      return "<tr>" +
        rankIndexCell(index) +
        nameCell(row) +
        cell(formatInt(row.register * Math.sqrt(scale)), "cl-num") +
        cell(formatInt(row.firstDeposit * Math.sqrt(scale)), "cl-num") +
        cell(roi.toFixed(1) + "%", "cl-num " + (roi >= 100 ? "positive" : "warning")) +
      "</tr>";
    }));

    renderRankTable("member", [
      { text: "排名" },
      { text: "会员账号" },
      { text: "盈利金额", num: true },
      { text: "投注额", num: true },
      { text: "玩家R级别" }
    ], RANK_BASE.member.map(function (row, index) {
      var rankRow = {
        name: row.name,
        bar: row.bar,
        danger: true
      };

      return "<tr>" +
        rankIndexCell(index) +
        nameCell(rankRow) +
        cell(formatMoney(row.profit * scale), "cl-num negative") +
        cell(formatMoney(row.bet * scale), "cl-num") +
        statusCell(row.r, row.statusClass) +
      "</tr>";
    }));
  }

  function updateRank(data) {
    setText(".rank-board .module-title h2", "排行洞察（" + data.label + "最多 TOP 10）");
    buildRankRows(data);
  }

  function setActivePeriod(tabGroup, period) {
    tabGroup.querySelectorAll("button").forEach(function (button) {
      button.classList.toggle("is-active", button.textContent.trim() === period);
    });
  }

  function getPeriodData(period) {
    return PERIOD_DATA[period] || PERIOD_DATA["今日"];
  }

  function updateModuleByPeriod(tabGroup, period) {
    var data = getPeriodData(period);

    setActivePeriod(tabGroup, period);

    if (tabGroup.closest(".trend-board")) {
      updateTrend(data);
      return;
    }

    if (tabGroup.closest(".rank-board")) {
      updateRank(data);
      return;
    }

    updateOverview(data);
  }

  function bindPeriodTabs() {
    var groups = document.querySelectorAll(".period-tabs:not([data-secondary-period])");

    groups.forEach(function (group) {
      group.querySelectorAll("button").forEach(function (button) {
        button.addEventListener("click", function () {
          var period = button.textContent.trim();

          if (PERIODS.indexOf(period) === -1) {
            return;
          }

          updateModuleByPeriod(group, period);
        });
      });
    });
  }

  function bindSecondaryTrendTabs() {
    var groups = document.querySelectorAll(".period-tabs[data-secondary-period]");

    groups.forEach(function (group) {
      var type = group.getAttribute("data-secondary-period");

      group.querySelectorAll("button").forEach(function (button) {
        button.addEventListener("click", function () {
          var period = button.textContent.trim();

          if (SECONDARY_PERIODS.indexOf(period) === -1) {
            return;
          }

          updateSecondaryTrend(type, period);
        });
      });
    });
  }

  function initializePeriodModules() {
    var defaultData = getPeriodData("今日");

    updateOverview(defaultData);
    updateTrend(defaultData);
    updateSecondaryTrend("flow", secondaryTrendState.flow);
    updateSecondaryTrend("loss", secondaryTrendState.loss);
    updateRank(defaultData);
  }

  function bindRankTabs() {
    var tabs = document.querySelectorAll("[data-rank-tab]");
    var panels = document.querySelectorAll("[data-rank-panel]");

    if (!tabs.length || !panels.length) {
      return;
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-rank-tab");

        tabs.forEach(function (item) {
          item.classList.toggle("is-active", item === tab);
        });

        panels.forEach(function (panel) {
          panel.hidden = panel.getAttribute("data-rank-panel") !== target;
        });
      });
    });
  }

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }

    callback();
  }

  ready(function () {
    bindPeriodTabs();
    bindSecondaryTrendTabs();
    bindRankTabs();
    initializePeriodModules();
  });
}());
