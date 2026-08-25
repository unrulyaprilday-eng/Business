(function () {
  var rows = [
    {
      id: "TSK-NB-001",
      name: "新手首充礼",
      typeKey: "newbie",
      type: "新手",
      cycle: "长期有效",
      participants: "12,604",
      completed: "6,118",
      amount: "426,800.00",
      activity: "98,540",
      rewardTarget: "piggy-bank",
      rewardTargetText: "存钱罐",
      status: "running",
      statusText: "进行中"
    },
    {
      id: "TSK-NB-002",
      name: "新手绑定送彩金",
      typeKey: "newbie",
      type: "新手",
      cycle: "长期有效",
      participants: "8,942",
      completed: "5,834",
      amount: "185,620.00",
      activity: "62,400",
      rewardTarget: "balance",
      rewardTargetText: "余额",
      status: "running",
      statusText: "进行中"
    },
    {
      id: "TSK-DY-101",
      name: "每日首充返利",
      typeKey: "daily",
      type: "日",
      cycle: "每日 00:00 刷新",
      participants: "5,286",
      completed: "2,406",
      amount: "142,320.00",
      activity: "44,860",
      rewardTarget: "balance",
      rewardTargetText: "余额",
      status: "running",
      statusText: "进行中"
    },
    {
      id: "TSK-DY-102",
      name: "每日有效投注",
      typeKey: "daily",
      type: "日",
      cycle: "每日 00:00 刷新",
      participants: "18,466",
      completed: "9,208",
      amount: "296,540.00",
      activity: "136,200",
      rewardTarget: "mixed",
      rewardTargetText: "混合",
      status: "running",
      statusText: "进行中"
    },
    {
      id: "TSK-WK-201",
      name: "周累计充值冲榜",
      typeKey: "weekly",
      type: "周",
      cycle: "每周一 00:00 刷新",
      participants: "3,118",
      completed: "1,242",
      amount: "208,000.00",
      activity: "52,600",
      rewardTarget: "piggy-bank",
      rewardTargetText: "存钱罐",
      status: "pending",
      statusText: "待开始"
    },
    {
      id: "TSK-CH-301",
      name: "120活跃度宝箱",
      typeKey: "chest",
      type: "活跃度宝箱",
      cycle: "每日 00:00-23:59",
      participants: "21,084",
      completed: "10,886",
      amount: "366,880.00",
      activity: "188,640",
      rewardTarget: "piggy-bank",
      rewardTargetText: "存钱罐",
      status: "ended",
      statusText: "已结束"
    }
  ];

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildStatus(status, text) {
    return '<span class="status-tag ' + status + '">' + text + "</span>";
  }

  function buildRewardTarget(target, text) {
    return '<span class="reward-target-badge ' + target + '">' + escapeHtml(text) + "</span>";
  }

  function quickFeedback(button, doneText, originalText) {
    if (!button) return;
    button.textContent = doneText;
    window.setTimeout(function () {
      button.textContent = originalText;
    }, 1000);
  }

  ready(function () {
    var tableBody = document.getElementById("reportTableBody");
    var filterBar = document.getElementById("reportFilterBar");
    var taskTypeFilter = document.getElementById("taskTypeFilter");
    var taskIdFilter = document.getElementById("taskIdFilter");
    var taskNameFilter = document.getElementById("taskNameFilter");
    var taskStatusFilter = document.getElementById("taskStatusFilter");
    var tableSubline = document.getElementById("tableSubline");
    var pageTotalText = document.getElementById("pageTotalText");
    var searchButton = document.getElementById("searchButton");
    var resetButton = document.getElementById("resetButton");
    var exportButton = document.getElementById("exportButton");
    var refreshPageButton = document.getElementById("refreshPageButton");
    var backButton = document.getElementById("backButton");

    function renderTable(data) {
      tableBody.innerHTML = data
        .map(function (item) {
          return [
            "<tr>",
            "<td>" + escapeHtml(item.id) + "</td>",
            "<td>" + escapeHtml(item.name) + "</td>",
            "<td>" + escapeHtml(item.type) + "</td>",
            "<td>" + escapeHtml(item.cycle) + "</td>",
            '<td class="num">' + escapeHtml(item.participants) + "</td>",
            '<td class="num">' + escapeHtml(item.completed) + "</td>",
            '<td class="num positive">' + escapeHtml(item.amount) + "</td>",
            "<td>" + buildRewardTarget(item.rewardTarget, item.rewardTargetText) + "</td>",
            '<td class="num">' + escapeHtml(item.activity) + "</td>",
            "<td>" + buildStatus(item.status, item.statusText) + "</td>",
            '<td><button class="link-btn" type="button" data-row-id="' + escapeHtml(item.id) + '">查看玩家</button></td>',
            "</tr>"
          ].join("");
        })
        .join("");

      pageTotalText.textContent = "共 " + data.length + " 条记录";
      tableSubline.textContent = "共 " + data.length + " 个任务，点击查看玩家可进入对应任务的玩家列表；中途调整到账目标的任务显示为混合。";
    }

    function applyFilters() {
      var taskType = taskTypeFilter.value;
      var taskId = taskIdFilter.value.trim().toLowerCase();
      var taskName = taskNameFilter.value.trim().toLowerCase();
      var taskStatus = taskStatusFilter.value;

      var data = rows.filter(function (item) {
        var typeOk = taskType === "all" || item.typeKey === taskType;
        var idOk = !taskId || item.id.toLowerCase().indexOf(taskId) > -1;
        var nameOk = !taskName || item.name.toLowerCase().indexOf(taskName) > -1;
        var statusOk = taskStatus === "all" || item.status === taskStatus;
        return typeOk && idOk && nameOk && statusOk;
      });

      renderTable(data);
    }

    tableBody.addEventListener("click", function (event) {
      var button = event.target.closest("[data-row-id]");
      var target;
      var params;
      if (!button) return;

      target = rows.find(function (item) {
        return item.id === button.getAttribute("data-row-id");
      });

      if (!target) return;

      params = new URLSearchParams();
      params.set("taskId", target.id);
      params.set("taskName", target.name);
      params.set("taskType", target.typeKey);
      window.location.href = "玩家任务报表.html?" + params.toString();
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

    if (backButton) {
      backButton.addEventListener("click", function () {
        if (window.history.length > 1) {
          window.history.back();
        }
      });
    }

    renderTable(rows);
  });
})();
