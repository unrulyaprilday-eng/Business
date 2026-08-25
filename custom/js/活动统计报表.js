(function () {
  var rows = [
    {
      id: "AC240601",
      name: "6月首充加赠",
      typeKey: "deposit",
      type: "首充活动",
      time: "2026-06-01 至 2026-06-30",
      participants: "12,860",
      claimed: "5,126",
      amount: "826,400.00",
      rewardTarget: "piggy-bank",
      rewardTargetText: "存钱罐",
      status: "running",
      statusText: "进行中"
    },
    {
      id: "AC240588",
      name: "周末返水加码",
      typeKey: "rebate",
      type: "返水活动",
      time: "2026-06-07 至 2026-06-29",
      participants: "10,204",
      claimed: "4,880",
      amount: "624,260.00",
      rewardTarget: "mixed",
      rewardTargetText: "混合",
      status: "running",
      statusText: "进行中"
    },
    {
      id: "AC240522",
      name: "老用户救援金",
      typeKey: "rescue",
      type: "救援金活动",
      time: "2026-06-01 至 2026-06-15",
      participants: "6,904",
      claimed: "2,910",
      amount: "438,000.00",
      rewardTarget: "balance",
      rewardTargetText: "余额",
      status: "ended",
      statusText: "已结束"
    },
    {
      id: "AC240610",
      name: "世界杯竞猜赛",
      typeKey: "tournament",
      type: "竞赛活动",
      time: "2026-06-12 至 2026-07-12",
      participants: "2,892",
      claimed: "510",
      amount: "296,000.00",
      rewardTarget: "piggy-bank",
      rewardTargetText: "存钱罐",
      status: "pending",
      statusText: "待开始"
    }
  ];

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function buildStatus(status, text) {
    return '<span class="status-tag ' + status + '">' + text + "</span>";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildRewardTarget(target, text) {
    return '<span class="reward-target-badge ' + target + '">' + escapeHtml(text) + "</span>";
  }

  ready(function () {
    var tableBody = document.getElementById("reportTableBody");
    var searchButton = document.getElementById("searchButton");
    var resetButton = document.getElementById("resetButton");
    var exportButton = document.getElementById("exportButton");
    var refreshPageButton = document.getElementById("refreshPageButton");
    var filterBar = document.getElementById("reportFilterBar");
    var activityTypeFilter = document.getElementById("activityTypeFilter");
    var activityStatusFilter = document.getElementById("activityStatusFilter");
    var activityIdFilter = document.getElementById("activityIdFilter");
    var activityNameFilter = document.getElementById("activityNameFilter");
    var pageTotalText = document.getElementById("pageTotalText");
    var tableSubline = document.getElementById("tableSubline");
    var ticketStatNote = document.getElementById("ticketStatNote");

    function renderTable(data) {
      tableBody.innerHTML = data
        .map(function (item) {
          return [
            "<tr>",
            "<td>" + escapeHtml(item.id) + "</td>",
            "<td>" + escapeHtml(item.name) + "</td>",
            "<td>" + escapeHtml(item.type) + "</td>",
            "<td>" + escapeHtml(item.time) + "</td>",
            '<td class="num">' + escapeHtml(item.participants) + "</td>",
            '<td class="num">' + escapeHtml(item.claimed) + "</td>",
            '<td class="num positive">' + escapeHtml(item.amount) + "</td>",
            "<td>" + buildRewardTarget(item.rewardTarget, item.rewardTargetText) + "</td>",
            "<td>" + buildStatus(item.status, item.statusText) + "</td>",
            '<td><button class="link-btn" type="button" data-row-id="' + escapeHtml(item.id) + '">查看玩家</button></td>',
            "</tr>"
          ].join("");
        })
        .join("");

      if (pageTotalText) {
        pageTotalText.textContent = "共 " + data.length + " 条记录";
      }
      if (tableSubline) {
        tableSubline.textContent = "共 " + data.length + " 个活动，点击查看玩家可进入对应活动的玩家列表。";
      }
      if (ticketStatNote) {
        ticketStatNote.textContent = "奖励到账目标按当前统计范围内的实际发放记录汇总；中途调整目标时显示混合，明细以每笔记录为准。";
      }
    }

    function applyFilters() {
      var type = activityTypeFilter.value;
      var status = activityStatusFilter.value;
      var activityId = activityIdFilter.value.trim().toLowerCase();
      var activityName = activityNameFilter.value.trim().toLowerCase();

      var data = rows.filter(function (item) {
        var typeOk = type === "all" || item.typeKey === type;
        var statusOk = status === "all" || item.status === status;
        var idOk = !activityId || item.id.toLowerCase().indexOf(activityId) > -1;
        var nameOk = !activityName || item.name.toLowerCase().indexOf(activityName) > -1;
        return typeOk && statusOk && idOk && nameOk;
      });

      renderTable(data);
    }

    function quickFeedback(button, doneText, originalText) {
      if (!button) return;
      button.textContent = doneText;
      window.setTimeout(function () {
        button.textContent = originalText;
      }, 1000);
    }

    tableBody.addEventListener("click", function (event) {
      var button = event.target.closest("[data-row-id]");
      if (!button) return;
      var target = rows.find(function (item) {
        return item.id === button.getAttribute("data-row-id");
      });
      if (!target) return;

      var params = new URLSearchParams();
      params.set("activityId", target.id);
      params.set("activityName", target.name);
      window.location.href = "玩家活动报表.html?" + params.toString();
    });

    searchButton.addEventListener("click", function () {
      applyFilters();
      quickFeedback(searchButton, "查询完成", "查询");
    });

    resetButton.addEventListener("click", function () {
      window.setTimeout(function () {
        Array.prototype.forEach.call(filterBar.querySelectorAll("input[type='text']"), function (input) {
          input.value = "";
        });
        Array.prototype.forEach.call(filterBar.querySelectorAll("select"), function (select) {
          select.selectedIndex = 0;
        });
        renderTable(rows);
      }, 0);
    });

    exportButton.addEventListener("click", function () {
      quickFeedback(exportButton, "导出完成", "导出数据");
    });

    refreshPageButton.addEventListener("click", function () {
      quickFeedback(refreshPageButton, "已刷新", "↻");
    });

    renderTable(rows);
  });
})();
