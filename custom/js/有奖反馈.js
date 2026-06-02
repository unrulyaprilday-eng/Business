(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  ready(function () {
    var feedback = [
      { account: "123kkk", id: "1010010119", status: "已领取", time: "2026-05-22 17:27:16", type: "优化建议", content: "retwegtrikugytrtrterdrdr", attachment: "-", reply: "", bonus: "1000", operator: "qitian", operateTime: "2026-05-22 17:28:39" },
      { account: "qitian", id: "1010010030", status: "已领取", time: "2026-05-21 18:14:38", type: "优化建议", content: "对光反馈感觉色莹莹感送人...", attachment: "-", reply: "非常棒", bonus: "100000", operator: "qitian", operateTime: "2026-05-21 18:21:42" },
      { account: "dzh222", id: "1010010007", status: "已采纳", time: "2026-05-20 17:28:06", type: "其他建议", content: "12121212ss121212", attachment: "-", reply: "", bonus: "0", operator: "qitian", operateTime: "2026-05-20 18:00:33" },
      { account: "dzh222", id: "1010010007", status: "已忽略", time: "2026-05-20 17:27:58", type: "其他建议", content: "2121212122", attachment: "-", reply: "", bonus: "0", operator: "qitian", operateTime: "2026-05-21 18:19:57" },
      { account: "dzh222", id: "1010010007", status: "待领取", time: "2026-05-20 17:27:51", type: "其他建议", content: "121212121212", attachment: "-", reply: "", bonus: "10000000000", operator: "qitian", operateTime: "2026-05-21 18:20:40" },
      { account: "dzh222", id: "1010010007", status: "已忽略", time: "2026-05-20 17:27:45", type: "优化建议", content: "121212121212", attachment: "-", reply: "", bonus: "0", operator: "qitian", operateTime: "2026-05-25 18:36:47" },
      { account: "dzh222", id: "1010010007", status: "已忽略", time: "2026-05-20 17:26:01", type: "其他建议", content: "qwqwqwwqwqqwqwqwwqw...", attachment: "-", reply: "", bonus: "0", operator: "josez", operateTime: "2026-06-02 13:49:15" },
      { account: "dzh222", id: "1010010007", status: "待处理", time: "2026-05-20 17:25:47", type: "优化建议", content: "122sasasasaqwqwqwqw", attachment: "-", reply: "", bonus: "0", operator: "", operateTime: "2026-05-20 17:25:47" }
    ];

    var state = { tab: "待处理", status: "", member: "" };
    var rows = document.getElementById("feedbackRows");
    var totalCount = document.getElementById("totalCount");
    var statusFilter = document.getElementById("statusFilter");
    var memberFilter = document.getElementById("memberFilter");
    var modal = document.getElementById("feedbackModal");
    var modalTitle = document.getElementById("modalTitle");
    var modalContent = document.getElementById("modalContent");
    var modalAttachment = document.getElementById("modalAttachment");
    var modalType = document.getElementById("modalType");
    var modalBonus = document.getElementById("modalBonus");
    var modalReply = document.getElementById("modalReply");
    var modalFoot = document.getElementById("modalFoot");

    if (!rows || !totalCount || !statusFilter || !memberFilter || !modal) {
      return;
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, function (char) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char];
      });
    }

    function statusClass(status) {
      return { "待处理": "pending", "已采纳": "accepted", "已忽略": "ignored", "待领取": "waiting", "已领取": "received" }[status] || "";
    }

    function currentRows() {
      return feedback.filter(function (item) {
        var tabMatch = state.tab === "全部反馈" || item.status === "待处理";
        var statusMatch = !state.status || item.status === state.status;
        var memberMatch = !state.member || item.id.indexOf(state.member) !== -1 || item.account.indexOf(state.member) !== -1;
        return tabMatch && statusMatch && memberMatch;
      });
    }

    function render() {
      var isAll = state.tab === "全部反馈";
      var list = currentRows();
      document.querySelectorAll("[data-all-only]").forEach(function (cell) {
        cell.hidden = !isAll;
      });

      rows.innerHTML = list.map(function (item, index) {
        var actionText = item.status === "待处理" ? "处理" : "查看";
        var actionClass = item.status === "待处理" ? "primary" : "view";
        return [
          "<tr>",
          "<td>" + escapeHtml(item.account) + "</td>",
          "<td>" + escapeHtml(item.id) + "</td>",
          isAll ? "<td><span class=\"status-tag " + statusClass(item.status) + "\">" + escapeHtml(item.status) + "</span></td>" : "",
          "<td>" + escapeHtml(item.time) + "</td>",
          "<td>" + escapeHtml(item.type) + "</td>",
          "<td title=\"" + escapeHtml(item.content) + "\">" + escapeHtml(item.content) + "</td>",
          "<td>" + escapeHtml(item.attachment) + "</td>",
          "<td>" + escapeHtml(item.reply) + "</td>",
          "<td>" + escapeHtml(item.bonus) + "</td>",
          "<td>" + escapeHtml(item.operator) + "</td>",
          "<td>" + escapeHtml(item.operateTime) + "</td>",
          "<td><button class=\"row-btn " + actionClass + "\" type=\"button\" data-index=\"" + feedback.indexOf(item) + "\">" + actionText + "</button></td>",
          "</tr>"
        ].join("");
      }).join("");
      totalCount.textContent = list.length;
    }

    function setFooterByTitle(title) {
      if (title.indexOf("处理反馈") === 0) {
        modalFoot.innerHTML = "<button class=\"ghost-btn\" type=\"button\" data-close>忽略</button><button class=\"primary-btn\" type=\"button\" data-close>采纳</button>";
        return;
      }
      modalFoot.innerHTML = "<button class=\"primary-btn\" type=\"button\" data-close>关闭</button>";
    }

    function openFeedback(item) {
      var title = item.status === "待处理" ? "处理反馈" : "查看反馈（" + item.status + "）";
      modalTitle.textContent = title;
      modalContent.value = item.content;
      modalAttachment.value = item.attachment === "-" ? "无附件" : item.attachment;
      modalType.value = item.type;
      modalBonus.value = item.bonus;
      modalReply.value = item.reply;
      modalReply.readOnly = item.status !== "待处理";
      modalType.disabled = item.status !== "待处理";
      modalBonus.disabled = item.status !== "待处理";
      setFooterByTitle(title);
      modal.hidden = false;
    }

    document.querySelectorAll(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        document.querySelectorAll(".tab").forEach(function (item) { item.classList.remove("active"); });
        tab.classList.add("active");
        state.tab = tab.getAttribute("data-tab");
        state.status = "";
        statusFilter.value = "";
        render();
      });
    });

    document.getElementById("searchBtn").addEventListener("click", function () {
      state.status = statusFilter.value;
      state.member = memberFilter.value.trim();
      render();
    });

    document.getElementById("resetBtn").addEventListener("click", function () {
      state.status = "";
      state.member = "";
      statusFilter.value = "";
      memberFilter.value = "";
      render();
    });

    statusFilter.addEventListener("change", function () {
      state.status = statusFilter.value;
      render();
    });

    document.addEventListener("click", function (event) {
      var closeButton = event.target.closest("[data-close]");
      var rowButton = event.target.closest("[data-index]");
      if (closeButton) {
        modal.hidden = true;
        return;
      }
      if (rowButton) {
        openFeedback(feedback[Number(rowButton.getAttribute("data-index"))]);
      }
    });

    render();
  });
})();
