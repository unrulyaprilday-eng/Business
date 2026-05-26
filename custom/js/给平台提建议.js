(function () {
  var suggestions = [
    {
      id: "d6d72acb-f229-47b8-80e6-44...",
      status: "已采纳",
      time: "2026-05-26 16:39:44",
      content: "TTTTTTTTTTTTT",
      attachment: "custom/assets/ace-square.svg",
      reply: "",
      operator: "amumu",
      operateTime: "2026-05-26 16:39:53"
    },
    {
      id: "2497796f-faef-4180-a0a4-d0a...",
      status: "待处理",
      time: "2026-05-26 16:37:19",
      content: "tttttttttttttttttttt",
      attachment: "",
      reply: "",
      operator: "",
      operateTime: "2026-05-26 16:37:19"
    },
    {
      id: "1728b643-2731-4125-9b3b-af...",
      status: "已忽略",
      time: "2026-05-26 16:37:06",
      content: "GOGOGOGOGO",
      attachment: "custom/assets/ace-word.svg",
      reply: "",
      operator: "amumu",
      operateTime: "2026-05-26 16:37:36"
    }
  ];

  var rows = document.getElementById("suggestionRows");
  var totalCount = document.getElementById("totalCount");
  var statusFilter = document.getElementById("statusFilter");
  var createModal = document.getElementById("createModal");
  var detailModal = document.getElementById("detailModal");
  var detailTitle = document.getElementById("detailTitle");
  var detailContent = document.getElementById("detailContent");
  var detailAttachment = document.getElementById("detailAttachment");
  var detailReply = document.getElementById("detailReply");

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

  function render() {
    var selected = statusFilter.value;
    var filtered = suggestions.filter(function (item) {
      return !selected || item.status === selected;
    });

    rows.innerHTML = filtered.map(function (item, index) {
      return [
        "<tr>",
        "<td title=\"" + escapeHtml(item.id) + "\">" + escapeHtml(item.id) + "</td>",
        "<td><span class=\"tag " + statusClass(item.status) + "\">" + item.status + "</span></td>",
        "<td>" + item.time + "</td>",
        "<td title=\"" + escapeHtml(item.content) + "\">" + escapeHtml(item.content) + "</td>",
        "<td>" + (item.attachment ? "<button class=\"link-btn\" type=\"button\" data-view=\"" + index + "\">查看</button>" : "-") + "</td>",
        "<td>" + escapeHtml(item.reply) + "</td>",
        "<td>" + escapeHtml(item.operator) + "</td>",
        "<td>" + item.operateTime + "</td>",
        "<td><button class=\"row-action\" type=\"button\" data-view=\"" + index + "\">查看</button></td>",
        "</tr>"
      ].join("");
    }).join("");

    totalCount.textContent = filtered.length;
  }

  function openModal(modal) {
    modal.hidden = false;
  }

  function closeModal(modal) {
    modal.hidden = true;
  }

  function openDetail(item) {
    detailTitle.textContent = "查看反馈（" + item.status + "）";
    detailContent.value = item.content;
    detailReply.value = item.reply;

    if (item.attachment) {
      detailAttachment.className = "attachment-view has-image";
      detailAttachment.innerHTML = "<img src=\"" + item.attachment + "\" alt=\"附件预览\"/>";
    } else {
      detailAttachment.className = "attachment-view";
      detailAttachment.textContent = "无附件";
    }

    openModal(detailModal);
  }

  document.getElementById("addBtn").addEventListener("click", function () {
    openModal(createModal);
  });

  document.getElementById("resetBtn").addEventListener("click", function () {
    statusFilter.value = "";
    render();
  });

  document.getElementById("searchBtn").addEventListener("click", render);
  statusFilter.addEventListener("change", render);

  document.addEventListener("click", function (event) {
    var closeButton = event.target.closest("[data-close]");
    var viewButton = event.target.closest("[data-view]");

    if (closeButton) {
      closeModal(createModal);
      closeModal(detailModal);
      return;
    }

    if (viewButton) {
      openDetail(suggestions[Number(viewButton.getAttribute("data-view"))]);
    }
  });

  render();
})();
