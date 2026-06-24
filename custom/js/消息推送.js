(function () {
  var messages = [
    { id: "21ac3b54-f6c7-49a6-8426-511e7ea2efbf", title: "冲电股份还有大费劲", type: "公告", recipient: "全体玩家", send: "2026-05-24 17:42", end: "2026-05-26 00:00", status: "未开始", operator: "qitian", operateTime: "2026-05-21T17:43:02.353...", frequency: "不弹窗", content: "大祥图好几年间意后觉特色人呀突然虎牙" },
    { id: "0f6eeacc-e788-44fe-91b0-885e0f8c0a25", title: "很过分党和国", type: "公告", recipient: "全体玩家", send: "2026-05-21 17:42", end: "2026-05-22 00:00", status: "已结束", operator: "qitian", operateTime: "2026-05-21T17:42:38.04...", frequency: "不弹窗", content: "系统活动公告内容展示。" },
    { id: "798eedf8-986c-4f23-8d77-1cbda28f6242", title: "返回东干粉", type: "公告", recipient: "全体玩家", send: "2026-05-21 17:42", end: "2026-05-22 00:00", status: "已结束", operator: "qitian", operateTime: "2026-05-21T17:42:22.53...", frequency: "不弹窗", content: "公告结束后保留详情可查看。" },
    { id: "f4645d55-f664-42b7-8469-7dcb084ab64e", title: "发过很多", type: "公告", recipient: "全体玩家", send: "2026-05-21 17:41", end: "2026-05-22 00:00", status: "已结束", operator: "qitian", operateTime: "2026-05-21T17:41:02.07...", frequency: "不弹窗", content: "批量推送公告示例。" },
    { id: "267c23af-771a-4f52-bb01-e8ed8ddb787f", title: "地方官", type: "公告", recipient: "全体玩家", send: "2026-05-21 17:40", end: "2026-05-22 00:00", status: "已结束", operator: "qitian", operateTime: "2026-05-21T17:40:12.77...", frequency: "不弹窗", content: "活动结束提示。" },
    { id: "b7e26838-acd2-47be-b892-ea33b0b8e03d", title: "多多在xx游戏", type: "消息", recipient: "全体玩家", send: "2026-05-21 16:33", end: "2026-05-22 00:00", status: "已结束", operator: "qitian", operateTime: "2026-05-21T16:33:39.81...", frequency: "不弹窗", content: "站内消息正文内容。" },
    { id: "2ea03f7c-ae29-40d8-b57d-11f7eaf2ac19", title: "夏季新体验", type: "公告", recipient: "全体玩家", send: "2026-05-21 16:32", end: "2026-05-23 00:00", status: "已结束", operator: "qitian", operateTime: "2026-05-21T16:32:29.09...", frequency: "每日一次", content: "夏季活动体验公告。" },
    { id: "029d6b74-bdf3-42a5-b2d0-159fb1dd1c3a", title: "logo", type: "跑马灯", recipient: "全体玩家", send: "2026-05-21 16:30", end: "2026-05-31 00:00", status: "已发送", operator: "qitian", operateTime: "2026-05-21T16:30:22.12...", frequency: "每次进入首页弹窗", content: "logo 跑马灯通知。" },
    { id: "687c595a-d1d2-4fe6-b657-a8bde08637a6", title: "消息", type: "消息", recipient: "全体玩家", send: "2026-05-21 16:27", end: "2026-05-22 00:00", status: "已结束", operator: "qitian", operateTime: "2026-05-21T16:27:17.06...", frequency: "不弹窗", content: "消息内容示例。" },
    { id: "17cc9d2b-dc8c-4e98-9f2a-b7cf5832a9bd", title: "🔥 System Ann...", type: "跑马灯", recipient: "全体玩家", send: "2026-05-21 10:56", end: "2026-05-31 00:00", status: "已发送", operator: "qitian", operateTime: "2026-05-21T10:56:11.92...", frequency: "每小时一次", content: "System Announcement: maintenance window notice." },
    { id: "409176f5-77a2-43a5-ae96-008e231ddc89", title: "为中华崛起而", type: "消息", recipient: "全体玩家", send: "2026-05-20 18:30", end: "2026-05-20 23:59", status: "已结束", operator: "qitian", operateTime: "2026-05-20T18:30:52.63...", frequency: "不弹窗", content: "历史消息。" },
    { id: "16566f15-8c34-4a5e-9b2b-10a809a6f307", title: "run", type: "跑马灯", recipient: "全体玩家", send: "2026-05-13 18:34", end: "2026-09-20 00:00", status: "已撤回", operator: "qitian", operateTime: "2026-05-21T10:54:53.82...", frequency: "登录后弹一次", content: "已撤回的跑马灯消息。" },
    { id: "aae327c9-6a27-49ee-9010-7eec062013c9", title: "测试", type: "公告", recipient: "全体玩家", send: "2026-05-09 16:25", end: "2026-11-08 00:00", status: "已发送", operator: "zhoudaxi", operateTime: "2026-05-09T16:25:37.26...", frequency: "不弹窗", content: "测试消息内容。" },
    { id: "6a2ec8c2-bd0f-47d5-a5df-1ad5e3e1f355", title: "测试公告", type: "公告", recipient: "全体玩家", send: "2026-05-09 16:22", end: "2026-09-20 00:00", status: "已发送", operator: "zhoudaxi", operateTime: "2026-05-09T16:22:24.21...", frequency: "每日一次", content: "测试公告正文。" }
  ];

  var recallTarget = null;

  function $(selector) {
    return document.querySelector(selector);
  }

  function $all(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function shortText(value, length) {
    var text = String(value || "");
    return text.length > length ? text.slice(0, length) + "..." : text;
  }

  function statusClass(status) {
    if (status === "已发送") return "status-sent";
    if (status === "未开始") return "status-pending";
    if (status === "已撤回") return "status-recalled";
    return "status-ended";
  }

  function filteredMessages() {
    var type = $("#filterType").value;
    var status = $("#filterStatus").value;
    var title = $("#filterTitle").value.trim();
    return messages.filter(function (item) {
      return (!type || item.type === type)
        && (!status || item.status === status)
        && (!title || item.title.indexOf(title) >= 0);
    });
  }

  function renderRows() {
    $("#messageRows").innerHTML = filteredMessages().map(function (item) {
      var action = item.status === "已撤回" ? "删除" : "撤回";
      return "<tr>"
        + "<td title=\"" + escapeHtml(item.id) + "\">" + escapeHtml(shortText(item.id, 13)) + "</td>"
        + "<td title=\"" + escapeHtml(item.title) + "\">" + escapeHtml(shortText(item.title, 8)) + "</td>"
        + "<td>" + escapeHtml(item.type) + "</td>"
        + "<td>" + escapeHtml(item.recipient) + "</td>"
        + "<td>" + escapeHtml(item.send) + "</td>"
        + "<td>" + escapeHtml(item.end) + "</td>"
        + "<td><span class=\"status-tag " + statusClass(item.status) + "\">" + escapeHtml(item.status) + "</span></td>"
        + "<td>" + escapeHtml(item.operator) + "</td>"
        + "<td title=\"" + escapeHtml(item.operateTime) + "\">" + escapeHtml(item.operateTime) + "</td>"
        + "<td><button class=\"table-action\" type=\"button\" data-detail=\"" + escapeHtml(item.id) + "\">详情</button>"
        + "<button class=\"table-action danger\" type=\"button\" data-recall=\"" + escapeHtml(item.id) + "\">" + action + "</button></td>"
        + "</tr>";
    }).join("");
  }

  function openModal(id) {
    $("#" + id).hidden = false;
  }

  function closeModal(id) {
    $("#" + id).hidden = true;
  }

  function findMessage(id) {
    return messages.find(function (item) {
      return item.id === id;
    });
  }

  function showDetail(id) {
    var item = findMessage(id);
    if (!item) return;
    $("#detailId").textContent = item.id;
    $("#detailStatus").innerHTML = "<span class=\"status-tag " + statusClass(item.status) + "\">" + escapeHtml(item.status) + "</span>";
    $("#detailType").textContent = item.type;
    $("#detailFrequency").textContent = item.frequency;
    $("#detailRecipient").textContent = item.recipient;
    $("#detailSend").textContent = item.send;
    $("#detailEnd").textContent = item.end;
    $("#detailMessageTitle").textContent = item.title;
    $("#detailContent").textContent = item.content;
    openModal("detailModal");
  }

  function showRecall(id) {
    recallTarget = findMessage(id);
    if (!recallTarget) return;
    $("#recallName").textContent = recallTarget.title;
    openModal("recallModal");
  }

  function renderCheckLists() {
    $("#vipChecks").innerHTML = Array.from({ length: 15 }, function (_, index) {
      var level = "VIP" + (index + 1);
      return "<label><input type=\"checkbox\" name=\"vip\" value=\"" + level + "\"/>" + level + "</label>";
    }).join("");
    $("#rChecks").innerHTML = ["大R玩家", "中R玩家", "小R玩家"].map(function (name) {
      return "<label><input type=\"checkbox\" name=\"r\" value=\"" + name + "\"/>" + name + "</label>";
    }).join("");
  }

  function updateRecipientPanel() {
    var value = $("#recipientType").value;
    $("#vipPanel").hidden = value !== "VIP玩家";
    $("#rPanel").hidden = value !== "R玩家";
    $("#customPlayerPanel").hidden = value !== "自定义玩家";
  }

  function updateScheduleInput() {
    $("#scheduleTime").hidden = document.querySelector("input[name='sendTime']:checked").value !== "schedule";
  }

  function resetCreateForm() {
    $("#messageType").value = "";
    $("#popupFrequency").value = "不弹窗";
    $("#recipientType").value = "";
    $("#messageTitle").value = "";
    $("#messageContent").value = "";
    $("#playerIds").value = "";
    $("#scheduleTime").value = "";
    $("#endTime").value = "";
    $("#contentError").hidden = true;
    $("#charCount").textContent = "0";
    $all("input[name='vip'], input[name='r']").forEach(function (input) {
      input.checked = false;
    });
    $("#scrollAuto").checked = true;
    document.querySelector("input[name='sendTime'][value='now']").checked = true;
    updateRecipientPanel();
    updateScheduleInput();
  }

  function initEvents() {
    $("#searchBtn").addEventListener("click", renderRows);
    $("#resetBtn").addEventListener("click", function () {
      $("#filterType").value = "";
      $("#filterStatus").value = "";
      $("#filterTitle").value = "";
      renderRows();
    });
    $("#openCreateBtn").addEventListener("click", function () {
      resetCreateForm();
      openModal("createModal");
    });
    $("#messageRows").addEventListener("click", function (event) {
      var detailId = event.target.getAttribute("data-detail");
      var recallId = event.target.getAttribute("data-recall");
      if (detailId) showDetail(detailId);
      if (recallId) showRecall(recallId);
    });
    $all("[data-close]").forEach(function (button) {
      button.addEventListener("click", function () {
        closeModal(button.getAttribute("data-close"));
      });
    });
    $("#recipientType").addEventListener("change", updateRecipientPanel);
    $all("input[name='sendTime']").forEach(function (input) {
      input.addEventListener("change", updateScheduleInput);
    });
    $("#messageContent").addEventListener("input", function () {
      $("#charCount").textContent = this.value.length;
      $("#contentError").hidden = this.value.trim().length > 0;
    });
    $all("[data-check-group]").forEach(function (button) {
      button.addEventListener("click", function () {
        var group = button.getAttribute("data-check-group");
        var checked = button.getAttribute("data-action") === "all";
        $all("input[name='" + group + "']").forEach(function (input) {
          input.checked = checked;
        });
      });
    });
    $("#confirmCreateBtn").addEventListener("click", function () {
      if (!$("#messageContent").value.trim()) {
        $("#contentError").hidden = false;
        return;
      }
      closeModal("createModal");
    });
    $("#confirmRecallBtn").addEventListener("click", function () {
      if (recallTarget) {
        recallTarget.status = "已撤回";
        recallTarget.operateTime = "2026-05-23T10:32:00.00...";
        renderRows();
      }
      closeModal("recallModal");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderCheckLists();
    updateRecipientPanel();
    updateScheduleInput();
    initEvents();
    renderRows();
  });
})();
