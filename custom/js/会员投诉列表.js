(function () {
  var complaints = [
    {
      account: "dzh111",
      memberId: "1010010005",
      status: "待处理",
      time: "2026-05-21 18:30:37",
      type: "游戏",
      content: "32121212121",
      attachment: "",
      reply: "",
      operator: "",
      operateTime: "2026-05-23 00:00:00"
    },
    {
      account: "qitian",
      memberId: "1010010030",
      status: "已采纳",
      time: "2026-05-21 17:51:26",
      type: "充值",
      content: "就看过环境设计构架结构经济法",
      attachment: "",
      reply: "",
      operator: "qitian",
      operateTime: "2026-05-21 18:12:32"
    },
    {
      account: "qitian",
      memberId: "1010010030",
      status: "已采纳",
      time: "2026-05-21 17:26:56",
      type: "游戏",
      content: "爱烤肉饭工业白豆腐脑打卡机IGV就亏大发嘎哈就开发越辣哈计德身房二等吩咐那iis放你那手机打急急急急急急急经济法哈哈哈哈哈哈哈哈哈哈哈哈哈哈哈",
      attachment: "video",
      reply: "不予解决",
      operator: "qitian",
      operateTime: "2026-05-21 18:12:16"
    },
    {
      account: "qitian",
      memberId: "1010010030",
      status: "待处理",
      time: "2026-05-21 17:10:52",
      type: "游戏",
      content: "5745u一天人防发给你吧地方经济法很久很久没有处理",
      attachment: "",
      reply: "",
      operator: "",
      operateTime: "2026-05-21 17:26:56"
    },
    {
      account: "qitian",
      memberId: "1010010030",
      status: "待处理",
      time: "2026-05-21 17:09:36",
      type: "活动",
      content: "活动羊毛不够薅活动羊毛不够薅",
      attachment: "image",
      reply: "",
      operator: "",
      operateTime: "2026-05-21 17:26:56"
    },
    {
      account: "dzh222",
      memberId: "1010010007",
      status: "待处理",
      time: "2026-05-21 10:37:40",
      type: "活动",
      content: "WEWEWEWEEEWEWEW",
      attachment: "",
      reply: "",
      operator: "",
      operateTime: "2026-05-21 10:37:40"
    },
    {
      account: "dzh222",
      memberId: "1010010007",
      status: "待处理",
      time: "2026-05-21 10:37:10",
      type: "登录",
      content: "WEWEWEWWEWEWEWE",
      attachment: "",
      reply: "",
      operator: "",
      operateTime: "2026-05-21 10:37:10"
    },
    {
      account: "dzh222",
      memberId: "1010010007",
      status: "已忽略",
      time: "2026-05-21 10:37:04",
      type: "登录",
      content: "sdsdsdsdsdWEWEWEWE",
      attachment: "",
      reply: "",
      operator: "amumu",
      operateTime: "2026-05-26 16:38:04"
    },
    {
      account: "dzh222",
      memberId: "1010010007",
      status: "已采纳",
      time: "2026-05-20 17:53:21",
      type: "充值",
      content: "12121212121221",
      attachment: "",
      reply: "",
      operator: "admin",
      operateTime: "2026-05-20 18:00:45"
    }
  ];

  var rows = document.getElementById("complaintRows");
  var totalCount = document.getElementById("totalCount");
  var memberFilter = document.getElementById("memberFilter");
  var statusFilter = document.getElementById("statusFilter");
  var modal = document.getElementById("complaintModal");
  var modalTitle = document.getElementById("modalTitle");
  var modalContent = document.getElementById("modalContent");
  var modalAttachment = document.getElementById("modalAttachment");
  var modalReply = document.getElementById("modalReply");
  var processActions = document.getElementById("processActions");
  var viewActions = document.getElementById("viewActions");
  var currentIndex = -1;

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

  function statusClass(status) {
    return {
      "已采纳": "accepted",
      "待处理": "pending",
      "已忽略": "ignored"
    }[status] || "";
  }

  function filteredComplaints() {
    var member = memberFilter.value.trim();
    var status = statusFilter.value;
    return complaints.filter(function (item) {
      return (!member || item.memberId.indexOf(member) > -1 || item.account.indexOf(member) > -1) &&
        (!status || item.status === status);
    });
  }

  function render() {
    var filtered = filteredComplaints();
    rows.innerHTML = filtered.map(function (item) {
      var index = complaints.indexOf(item);
      var handled = item.status !== "待处理";
      return [
        "<tr>",
        "<td>" + escapeHtml(item.account) + "</td>",
        "<td>" + escapeHtml(item.memberId) + "</td>",
        "<td><span class=\"tag " + statusClass(item.status) + "\">" + item.status + "</span></td>",
        "<td>" + item.time + "</td>",
        "<td>" + escapeHtml(item.type) + "</td>",
        "<td title=\"" + escapeHtml(item.content) + "\">" + escapeHtml(item.content) + "</td>",
        "<td>" + (item.attachment ? "<button class=\"link-btn\" type=\"button\" data-open=\"" + index + "\">查看</button>" : "-") + "</td>",
        "<td title=\"" + escapeHtml(item.reply) + "\">" + escapeHtml(item.reply) + "</td>",
        "<td>" + escapeHtml(item.operator) + "</td>",
        "<td>" + item.operateTime + "</td>",
        "<td><button class=\"row-action " + (handled ? "view" : "process") + "\" type=\"button\" data-open=\"" + index + "\">" + (handled ? "查看" : "处理") + "</button></td>",
        "</tr>"
      ].join("");
    }).join("");
    totalCount.textContent = filtered.length;
  }

  function openModal(item, index) {
    var handled = item.status !== "待处理";
    currentIndex = index;
    modalTitle.textContent = handled ? "查看反馈（" + item.status + "）" : "处理投诉";
    modalContent.value = item.content;
    modalReply.value = item.reply;
    modalReply.readOnly = handled;
    processActions.hidden = handled;
    viewActions.hidden = !handled;

    if (item.attachment === "video") {
      modalAttachment.className = "attachment-view has-media";
      modalAttachment.innerHTML = "<video controls preload=\"metadata\"><source src=\"\" type=\"video/mp4\"></video>";
    } else if (item.attachment === "image") {
      modalAttachment.className = "attachment-view has-media";
      modalAttachment.innerHTML = "<img src=\"custom/assets/ace-square.svg\" alt=\"附件预览\"/>";
    } else {
      modalAttachment.className = "attachment-view";
      modalAttachment.textContent = "无附件";
    }

    modal.hidden = false;
  }

  function closeModal() {
    modal.hidden = true;
    currentIndex = -1;
  }

  document.getElementById("searchBtn").addEventListener("click", render);
  statusFilter.addEventListener("change", render);

  document.getElementById("resetBtn").addEventListener("click", function () {
    memberFilter.value = "";
    statusFilter.value = "";
    render();
  });

  document.addEventListener("click", function (event) {
    var closeButton = event.target.closest("[data-close]");
    var openButton = event.target.closest("[data-open]");
    var resolveButton = event.target.closest("[data-resolve]");

    if (closeButton) {
      closeModal();
      return;
    }

    if (openButton) {
      var index = Number(openButton.getAttribute("data-open"));
      openModal(complaints[index], index);
      return;
    }

    if (resolveButton && currentIndex > -1) {
      complaints[currentIndex].status = resolveButton.getAttribute("data-resolve");
      complaints[currentIndex].reply = modalReply.value.trim();
      complaints[currentIndex].operator = "admin";
      complaints[currentIndex].operateTime = "2026-05-26 17:05:00";
      closeModal();
      render();
    }
  });

  render();
})();
