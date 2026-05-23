(function () {
  var conversations = [
    {
      id: "C20260522001",
      name: "Aiden_8831",
      status: "pending",
      tag: "充值未到账",
      priority: "高优先级",
      wait: "03:18",
      level: "VIP 4",
      order: "R202605220873",
      device: "iOS / H5",
      preview: "我充值已经扣款了，但是账户余额还没增加，麻烦尽快处理。",
      messages: [
        { role: "customer", text: "我充值已经扣款了，但是账户余额还没增加，麻烦尽快处理。", time: "14:26" },
        { role: "customer", text: "订单号 R202605220873，支付截图已经上传。", time: "14:27" }
      ]
    },
    {
      id: "C20260522002",
      name: "Mia_2190",
      status: "pending",
      tag: "提现审核",
      priority: "普通",
      wait: "06:42",
      level: "VIP 2",
      order: "W202605220142",
      device: "Android / App",
      preview: "提现一直在审核中，请问什么时候可以到账？",
      messages: [
        { role: "customer", text: "提现一直在审核中，请问什么时候可以到账？", time: "14:21" }
      ]
    },
    {
      id: "C20260522003",
      name: "Noah_5567",
      status: "mine",
      tag: "活动奖励",
      priority: "普通",
      wait: "已接入",
      level: "VIP 1",
      order: "B202605210056",
      device: "Windows / Web",
      preview: "昨天参与活动的奖励没有派发。",
      messages: [
        { role: "customer", text: "昨天参与活动的奖励没有派发。", time: "14:12" },
        { role: "agent", text: "您好，我先帮您核对活动资格和派发记录。", time: "14:13" }
      ]
    }
  ];

  var activeId = null;
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

  function filteredConversations() {
    var keyword = $("#conversationSearch").value.trim().toLowerCase();
    return conversations.filter(function (item) {
      var text = [item.name, item.id, item.tag, item.preview].join(" ").toLowerCase();
      return item.status === "mine" && (!keyword || text.indexOf(keyword) >= 0);
    });
  }

  function renderList() {
    var items = filteredConversations();
    var pendingCount = conversations.filter(function (item) {
      return item.status === "pending";
    }).length;
    $("#queueCount").textContent = pendingCount;
    $("#queueAddBtn").hidden = pendingCount === 0;
    $("#emptyList").hidden = items.length > 0;
    $("#conversationList").innerHTML = items.map(function (item) {
      return "<button class=\"conversation-item " + (item.id === activeId ? "is-active" : "") + "\" data-id=\"" + item.id + "\" type=\"button\">"
        + "<span class=\"conv-avatar\">♟</span>"
        + "<span class=\"conv-main\"><strong>" + escapeHtml(item.name) + "</strong><em><i></i>Offline</em></span>"
        + "<span class=\"conv-side\"><small>05/22 06:04</small><span class=\"conv-close\">×</span></span>"
        + "</button>";
    }).join("");
  }

  function renderMessages(item) {
    $("#messageList").innerHTML = item.messages.map(function (message) {
      var cls = message.role === "agent" ? "message-row agent" : "message-row";
      var name = message.role === "agent" ? "Customer Servicer" : item.name;
      return "<div class=\"" + cls + "\"><div class=\"bubble\">"
        + escapeHtml(message.text)
        + "<small>" + escapeHtml(name) + "</small>"
        + "</div></div>";
    }).join("");
    $("#messageList").scrollTop = $("#messageList").scrollHeight;
  }

  function selectConversation(id) {
    var item = conversations.find(function (row) {
      return row.id === id;
    });
    if (!item) return;
    activeId = id;
    $("#chatEmpty").hidden = true;
    $("#chatActive").hidden = false;
    $("#activeName").textContent = item.name;
    $("#activeStatus").textContent = "Offline";
    renderMessages(item);
    renderList();
  }

  function currentConversation() {
    return conversations.find(function (item) {
      return item.id === activeId;
    });
  }

  function nowText() {
    var date = new Date();
    return String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
  }

  function sendReply() {
    var item = currentConversation();
    var input = $("#replyInput");
    var text = input.value.trim();
    if (!item || !text) return;
    item.status = "mine";
    item.wait = "已接入";
    item.messages.push({ role: "agent", text: text, time: nowText() });
    item.preview = text;
    input.value = "";
    selectConversation(item.id);
  }

  document.addEventListener("click", function (event) {
    var conversationBtn = event.target.closest(".conversation-item");
    if (conversationBtn) {
      selectConversation(conversationBtn.getAttribute("data-id"));
      return;
    }

    var quickText = event.target.closest("[data-quick-text]");
    if (quickText) {
      $("#replyInput").value = quickText.getAttribute("data-quick-text");
      $("#replyInput").focus();
      return;
    }

    if (event.target.closest("#quickTrigger")) {
      $("#quickPanel").hidden = !$("#quickPanel").hidden;
      return;
    }

    if (event.target.closest("#closeQuickPanel")) {
      $("#quickPanel").hidden = true;
      return;
    }

    if (event.target.closest("#addQuickTemplate")) {
      var quickInput = $("#quickTemplateInput");
      var value = quickInput.value.trim();
      if (value) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("data-quick-text", value);
        btn.textContent = value;
        $("#quickList").appendChild(btn);
        quickInput.value = "";
      }
      quickInput.focus();
      return;
    }

    if (event.target.closest("#autoToggle")) {
      $("#autoToggle").classList.toggle("is-on");
      return;
    }

    if (event.target.closest("#queueAddBtn")) {
      var pending = conversations.find(function (item) {
        return item.status === "pending";
      });
      if (pending) {
        pending.status = "mine";
        pending.wait = "已接入";
        selectConversation(pending.id);
      }
      return;
    }

    if (event.target.closest("#sendBtn")) {
      sendReply();
    }
  });

  $("#conversationSearch").addEventListener("input", renderList);
  $("#replyInput").addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendReply();
    }
  });
  $("#quickTemplateInput").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      $("#addQuickTemplate").click();
    }
  });

  renderList();
  var firstMine = conversations.find(function (item) {
    return item.status === "mine";
  });
  if (firstMine) {
    selectConversation(firstMine.id);
  }
}());
