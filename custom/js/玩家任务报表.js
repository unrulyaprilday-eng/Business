(function () {
  function buildMember(config) {
    return {
      accountName: config.accountName,
      playerId: config.playerId,
      agentName: config.agentName || "无",
      vipLevel: config.vipLevel,
      accountStatus: config.accountStatus || "启用",
      registerTime: config.registerTime,
      lastLoginTime: config.lastLoginTime,
      balance: config.balance,
      availableBalance: config.availableBalance || config.balance,
      todayRechargeAmount: config.todayRechargeAmount,
      todayWithdrawAmount: config.todayWithdrawAmount,
      turnover: config.turnover,
      todayTurnover: config.todayTurnover,
      taskRewardAmount: config.taskRewardAmount,
      activityValue: config.activityValue,
      registerIp: config.registerIp,
      lastLoginIp: config.lastLoginIp,
      registerDevice: config.registerDevice,
      walletAccount: config.walletAccount,
      latestTaskName: config.latestTaskName
    };
  }

  var rows = [
    {
      id: "TSK-NB-001",
      name: "新手首充礼",
      typeKey: "newbie",
      type: "新手",
      playerId: "P102438",
      currency: "USDT",
      rewardAmount: "88.00",
      activity: "20",
      rewardStatus: "claimed",
      rewardStatusText: "已领取",
      rewardTime: "2026-06-10 14:18:26",
      rewardRecords: [
        { currency: "USDT", amount: "88.00", activity: "20", time: "2026-06-10 14:18:26" }
      ],
      member: buildMember({
        accountName: "Windr",
        playerId: "P102438",
        agentName: "Aiden88",
        vipLevel: "VIP4",
        registerTime: "2026-02-18 10:22:11",
        lastLoginTime: "2026-06-10 21:12:08",
        balance: "3,246.18",
        todayRechargeAmount: "2,000.00",
        todayWithdrawAmount: "0.00",
        turnover: "126,420.00",
        todayTurnover: "4,880.00",
        taskRewardAmount: "166.00",
        activityValue: "320",
        registerIp: "103.21.44.18",
        lastLoginIp: "103.21.44.20",
        registerDevice: "Android",
        walletAccount: "TX7gk...9PmA",
        latestTaskName: "新手首充礼"
      })
    },
    {
      id: "TSK-NB-002",
      name: "新手绑定送彩金",
      typeKey: "newbie",
      type: "新手",
      playerId: "P204511",
      currency: "USDT",
      rewardAmount: "28.00",
      activity: "10",
      rewardStatus: "claimed",
      rewardStatusText: "已领取",
      rewardTime: "2026-06-10 09:41:02",
      rewardRecords: [
        { currency: "USDT", amount: "28.00", activity: "10", time: "2026-06-10 09:41:02" }
      ],
      member: buildMember({
        accountName: "Nova88",
        playerId: "P204511",
        agentName: "Maple02",
        vipLevel: "VIP2",
        registerTime: "2026-03-05 08:10:24",
        lastLoginTime: "2026-06-10 18:06:31",
        balance: "1,084.50",
        todayRechargeAmount: "1,500.00",
        todayWithdrawAmount: "300.00",
        turnover: "58,800.00",
        todayTurnover: "2,420.00",
        taskRewardAmount: "48.00",
        activityValue: "160",
        registerIp: "182.52.141.78",
        lastLoginIp: "182.52.141.90",
        registerDevice: "iPhone",
        walletAccount: "TQ2ms...12Ac",
        latestTaskName: "新手绑定送彩金"
      })
    },
    {
      id: "TSK-DY-101",
      name: "每日首充返利",
      typeKey: "daily",
      type: "日",
      playerId: "P774520",
      currency: "USD",
      rewardAmount: "18.00",
      activity: "12",
      rewardStatus: "pending",
      rewardStatusText: "待领取",
      rewardTime: "-",
      rewardRecords: [
        { currency: "USD", amount: "18.00", activity: "12", time: "-" }
      ],
      member: buildMember({
        accountName: "Sora",
        playerId: "P774520",
        agentName: "SoraUp",
        vipLevel: "VIP2",
        registerTime: "2026-01-22 19:03:08",
        lastLoginTime: "2026-06-10 23:18:55",
        balance: "2,128.44",
        todayRechargeAmount: "0.00",
        todayWithdrawAmount: "0.00",
        turnover: "94,120.00",
        todayTurnover: "6,420.00",
        taskRewardAmount: "20.00",
        activityValue: "146",
        registerIp: "43.229.80.17",
        lastLoginIp: "43.229.80.19",
        registerDevice: "Windows",
        walletAccount: "0x81c0...9b3e",
        latestTaskName: "每日首充返利"
      })
    },
    {
      id: "TSK-DY-102",
      name: "每日有效投注",
      typeKey: "daily",
      type: "日",
      playerId: "P884203",
      currency: "USDT",
      rewardAmount: "58.00",
      activity: "30",
      rewardStatus: "claimed",
      rewardStatusText: "已领取",
      rewardTime: "2026-06-10 10:18:27",
      rewardRecords: [
        { currency: "USDT", amount: "18.00", activity: "10", time: "2026-06-10 10:06:10" },
        { currency: "USDT", amount: "40.00", activity: "20", time: "2026-06-10 10:18:27" }
      ],
      member: buildMember({
        accountName: "Piper",
        playerId: "P884203",
        agentName: "River66",
        vipLevel: "VIP6",
        registerTime: "2025-12-14 11:42:56",
        lastLoginTime: "2026-06-10 20:39:14",
        balance: "9,822.66",
        todayRechargeAmount: "3,600.00",
        todayWithdrawAmount: "2,000.00",
        turnover: "268,400.00",
        todayTurnover: "18,880.00",
        taskRewardAmount: "320.00",
        activityValue: "680",
        registerIp: "120.79.18.25",
        lastLoginIp: "120.79.18.29",
        registerDevice: "MacOS",
        walletAccount: "TUt8j...4Kza",
        latestTaskName: "每日有效投注"
      })
    },
    {
      id: "TSK-WK-201",
      name: "周累计充值冲榜",
      typeKey: "weekly",
      type: "周",
      playerId: "P661204",
      currency: "USDT",
      rewardAmount: "188.00",
      activity: "88",
      rewardStatus: "claimed",
      rewardStatusText: "已领取",
      rewardTime: "2026-06-09 23:10:18",
      rewardRecords: [
        { currency: "USDT", amount: "188.00", activity: "88", time: "2026-06-09 23:10:18" }
      ],
      member: buildMember({
        accountName: "Ethan27",
        playerId: "P661204",
        agentName: "North11",
        vipLevel: "VIP5",
        registerTime: "2025-11-09 15:08:44",
        lastLoginTime: "2026-06-10 17:45:33",
        balance: "6,940.08",
        todayRechargeAmount: "5,000.00",
        todayWithdrawAmount: "1,200.00",
        turnover: "182,440.00",
        todayTurnover: "12,330.00",
        taskRewardAmount: "426.00",
        activityValue: "1,120",
        registerIp: "154.82.19.61",
        lastLoginIp: "154.82.19.68",
        registerDevice: "Android",
        walletAccount: "TRi56...8KaP",
        latestTaskName: "周累计充值冲榜"
      })
    },
    {
      id: "TSK-CH-301",
      name: "120活跃度宝箱",
      typeKey: "chest",
      type: "活跃度宝箱",
      playerId: "P508632",
      currency: "USDT",
      rewardAmount: "66.00",
      activity: "120",
      rewardStatus: "invalid",
      rewardStatusText: "未达成",
      rewardTime: "-",
      rewardRecords: [],
      member: buildMember({
        accountName: "Mika",
        playerId: "P508632",
        agentName: "Lime77",
        vipLevel: "VIP1",
        registerTime: "2026-04-28 09:12:50",
        lastLoginTime: "2026-06-10 16:05:14",
        balance: "642.30",
        todayRechargeAmount: "0.00",
        todayWithdrawAmount: "0.00",
        turnover: "14,086.00",
        todayTurnover: "980.00",
        taskRewardAmount: "12.00",
        activityValue: "96",
        registerIp: "61.244.77.31",
        lastLoginIp: "61.244.77.45",
        registerDevice: "iPhone",
        walletAccount: "TA0ms...55Dt",
        latestTaskName: "120活跃度宝箱"
      })
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

  function rowKey(item) {
    return [item.id, item.playerId, item.rewardTime].join("__");
  }

  function quickFeedback(button, doneText, originalText) {
    if (!button) return;
    button.textContent = doneText;
    window.setTimeout(function () {
      button.textContent = originalText;
    }, 1000);
  }

  ready(function () {
    var defaultQueryFilters = {
      taskId: "",
      taskName: "",
      taskType: ""
    };
    var tableBody = document.getElementById("reportTableBody");
    var filterBar = document.getElementById("reportFilterBar");
    var playerIdFilter = document.getElementById("playerIdFilter");
    var taskTypeFilter = document.getElementById("taskTypeFilter");
    var taskIdFilter = document.getElementById("taskIdFilter");
    var taskNameFilter = document.getElementById("taskNameFilter");
    var rewardStatusFilter = document.getElementById("rewardStatusFilter");
    var tableTitle = document.getElementById("tableTitle");
    var tableSubline = document.getElementById("tableSubline");
    var pageTotalText = document.getElementById("pageTotalText");
    var searchButton = document.getElementById("searchButton");
    var resetButton = document.getElementById("resetButton");
    var exportButton = document.getElementById("exportButton");
    var refreshPageButton = document.getElementById("refreshPageButton");
    var backButton = document.getElementById("backButton");
    var memberDetailModal = document.getElementById("memberDetailModal");
    var memberDetailModalClose = document.getElementById("memberDetailModalClose");
    var memberDetailModalCancel = document.getElementById("memberDetailModalCancel");
    var memberDetailModalConfirm = document.getElementById("memberDetailModalConfirm");
    var rewardDetailModal = document.getElementById("rewardDetailModal");
    var rewardDetailModalClose = document.getElementById("rewardDetailModalClose");
    var rewardDetailModalCancel = document.getElementById("rewardDetailModalCancel");
    var rewardDetailModalConfirm = document.getElementById("rewardDetailModalConfirm");
    var rewardDetailSubline = document.getElementById("rewardDetailSubline");
    var rewardDetailBody = document.getElementById("rewardDetailBody");
    var rewardDetailTotal = document.getElementById("rewardDetailTotal");
    var memberFields = memberDetailModal.querySelectorAll("[data-member-field]");

    function renderTable(data) {
      tableBody.innerHTML = data
        .map(function (item) {
          return [
            "<tr>",
            "<td>" + escapeHtml(item.id) + "</td>",
            "<td>" + escapeHtml(item.name) + "</td>",
            '<td><button class="link-btn player-link" type="button" data-action="member" data-row-id="' + escapeHtml(rowKey(item)) + '">' + escapeHtml(item.playerId) + "</button></td>",
            "<td>" + escapeHtml(item.type) + "</td>",
            "<td>" + escapeHtml(item.currency) + "</td>",
            '<td class="num positive">' + escapeHtml(item.rewardAmount) + "</td>",
            '<td class="num">' + escapeHtml(item.activity) + "</td>",
            '<td><span class="status-tag ' + escapeHtml(item.rewardStatus) + '">' + escapeHtml(item.rewardStatusText) + "</span></td>",
            "<td>" + escapeHtml(item.rewardTime) + "</td>",
            '<td><div class="action-links"><button class="link-btn" type="button" data-action="member" data-row-id="' + escapeHtml(rowKey(item)) + '">用户详情</button><button class="link-btn" type="button" data-action="reward" data-row-id="' + escapeHtml(rowKey(item)) + '">奖励明细</button></div></td>',
            "</tr>"
          ].join("");
        })
        .join("");

      pageTotalText.textContent = "共 " + data.length + " 条记录";
    }

    function updateHeader(data) {
      var selectedTaskId = taskIdFilter.value.trim();
      var selectedTaskName = taskNameFilter.value.trim();

      if (selectedTaskId || selectedTaskName) {
        tableTitle.textContent = "参与玩家列表";
        tableSubline.textContent =
          "当前任务：" +
          (selectedTaskId || "-") +
          (selectedTaskName ? " / " + selectedTaskName : "") +
          "，共筛出 " +
          data.length +
          " 条参与玩家记录。";
        return;
      }

      tableTitle.textContent = "玩家任务列表";
      tableSubline.textContent = "当前展示筛选范围内完成任务的玩家记录。";
    }

    function applyFilters() {
      var playerId = playerIdFilter.value.trim().toLowerCase();
      var taskType = taskTypeFilter.value;
      var taskId = taskIdFilter.value.trim().toLowerCase();
      var taskName = taskNameFilter.value.trim().toLowerCase();
      var rewardStatus = rewardStatusFilter.value;

      var data = rows.filter(function (item) {
        var playerOk = !playerId || item.playerId.toLowerCase().indexOf(playerId) > -1;
        var typeOk = taskType === "all" || item.typeKey === taskType;
        var idOk = !taskId || item.id.toLowerCase().indexOf(taskId) > -1;
        var nameOk = !taskName || item.name.toLowerCase().indexOf(taskName) > -1;
        var rewardOk = rewardStatus === "all" || item.rewardStatus === rewardStatus;
        return playerOk && typeOk && idOk && nameOk && rewardOk;
      });

      renderTable(data);
      updateHeader(data);
    }

    function fillFromQuery() {
      var params = new URLSearchParams(window.location.search);
      defaultQueryFilters.taskId = params.get("taskId") || "";
      defaultQueryFilters.taskName = params.get("taskName") || "";
      defaultQueryFilters.taskType = params.get("taskType") || "";

      taskIdFilter.value = defaultQueryFilters.taskId;
      taskNameFilter.value = defaultQueryFilters.taskName;
      if (defaultQueryFilters.taskType) {
        taskTypeFilter.value = defaultQueryFilters.taskType;
      }
    }

    function openMemberDetail(item) {
      Array.prototype.forEach.call(memberFields, function (field) {
        var key = field.getAttribute("data-member-field");
        field.textContent = item.member[key] || "-";
      });
      memberDetailModal.hidden = false;
    }

    function closeMemberDetail() {
      memberDetailModal.hidden = true;
    }

    function openRewardDetail(item) {
      rewardDetailSubline.textContent = item.name + " - " + item.playerId + " - 奖励明细";

      if (!item.rewardRecords.length) {
        rewardDetailBody.innerHTML = '<tr><td colspan="4" class="empty-cell">当前玩家在该任务下暂无奖励发放记录</td></tr>';
      } else {
        rewardDetailBody.innerHTML = item.rewardRecords
          .map(function (record) {
            return [
              "<tr>",
              "<td>" + escapeHtml(record.currency) + "</td>",
              '<td class="num positive">' + escapeHtml(record.amount) + "</td>",
              '<td class="num">' + escapeHtml(record.activity) + "</td>",
              "<td>" + escapeHtml(record.time) + "</td>",
              "</tr>"
            ].join("");
          })
          .join("");
      }

      rewardDetailTotal.textContent = "共 " + item.rewardRecords.length + " 条记录";
      rewardDetailModal.hidden = false;
    }

    function closeRewardDetail() {
      rewardDetailModal.hidden = true;
    }

    tableBody.addEventListener("click", function (event) {
      var button = event.target.closest("[data-row-id]");
      var target;
      if (!button) return;

      target = rows.find(function (item) {
        return rowKey(item) === button.getAttribute("data-row-id");
      });

      if (!target) return;

      if (button.getAttribute("data-action") === "reward") {
        openRewardDetail(target);
        return;
      }

      openMemberDetail(target);
    });

    [memberDetailModalClose, memberDetailModalCancel, memberDetailModalConfirm].forEach(function (button) {
      button.addEventListener("click", closeMemberDetail);
    });

    memberDetailModal.addEventListener("click", function (event) {
      if (event.target && event.target.getAttribute("data-close-member-detail") === "true") {
        closeMemberDetail();
      }
    });

    [rewardDetailModalClose, rewardDetailModalCancel, rewardDetailModalConfirm].forEach(function (button) {
      button.addEventListener("click", closeRewardDetail);
    });

    rewardDetailModal.addEventListener("click", function (event) {
      if (event.target && event.target.getAttribute("data-close-reward-detail") === "true") {
        closeRewardDetail();
      }
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
        taskIdFilter.value = defaultQueryFilters.taskId;
        taskNameFilter.value = defaultQueryFilters.taskName;
        if (defaultQueryFilters.taskType) {
          taskTypeFilter.value = defaultQueryFilters.taskType;
        }
        applyFilters();
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
          return;
        }
        window.location.href = "任务统计报表.html";
      });
    }

    fillFromQuery();
    applyFilters();
  });
})();
