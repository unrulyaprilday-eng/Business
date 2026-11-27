(function () {
  var MESSAGE_STORAGE_KEY = "business-message-notices-v1";
  var AUTO_INBOX_KEY = "business.site.auto-inbox.v1";
  var LEGACY_AUTO_INBOX_KEY = "business.site.auto-mail.v1";
  var COUPON_STORAGE_KEY = "business-ticket-coupons-v1";
  var MAIL_TYPE = "消息";
  var DEFAULT_EXPIRY_DAYS = 7;
  var AUTO_INBOX_CONTENT = {
    registerSuccess: "您好，您的账号已注册成功。",
    depositSuccess: "您的充值已到账，可在充值记录中查看详情。",
    depositFailure: "您提交的一笔充值未成功，可在充值记录中查看详情。如已扣款，请核对账单后联系官方客服。",
    withdrawSuccess: "您的提现订单已出款，可在提现记录中查看详情，请核对收款账户。",
    withdrawRejected: "您的提现申请未通过审核，可在提现记录中查看详情。如有疑问，请联系官方客服。"
  };
  var DEFAULT_COUPONS = [
    { id: "CPN-20261104-001", name: "新客优惠券", type: "percent" },
    { id: "CPN-20261104-002", name: "满额赠送券", type: "recharge_fixed" },
    { id: "CPN-20261104-003", name: "充值比例赠送券", type: "recharge_percent" }
  ];
  var sampleMessages = [
    { id: "example-attachment-mail", title: "会员福利补发示例", type: "消息", recipient: "自定义玩家：1010010013", send: "2026-11-26 10:00", end: "2026-12-03 10:00", status: "已发送", operator: "qitian", operateTime: "2026-11-26 10:00", content: "本次补发福利包含余额与优惠券，附件内容请查收。", attachments: { balance: { currency: "USD", amount: "10.00" }, coupon: { id: "CPN-20261104-001", name: "新客优惠券", quantity: 1 } } },
    { id: "21ac3b54-f6c7-49a6-8426-511e7ea2efbf", title: "冲电股份还有大费劲", type: "公告", recipient: "全体玩家", send: "2026-05-24 17:42", end: "2026-05-26 00:00", status: "未开始", operator: "qitian", operateTime: "2026-05-21T17:43:02.353...", content: "大祥图好几年间意后觉特色人呀突然虎牙" },
    { id: "0f6eeacc-e788-44fe-91b0-885e0f8c0a25", title: "很过分党和国", type: "公告", recipient: "全体玩家", send: "2026-05-21 17:42", end: "2026-05-22 00:00", status: "已结束", operator: "qitian", operateTime: "2026-05-21T17:42:38.04...", content: "系统活动公告内容展示。" },
    { id: "798eedf8-986c-4f23-8d77-1cbda28f6242", title: "返回东干粉", type: "公告", recipient: "全体玩家", send: "2026-05-21 17:42", end: "2026-05-22 00:00", status: "已结束", operator: "qitian", operateTime: "2026-05-21T17:42:22.53...", content: "公告结束后保留详情可查看。" },
    { id: "f4645d55-f664-42b7-8469-7dcb084ab64e", title: "发过很多", type: "公告", recipient: "全体玩家", send: "2026-05-21 17:41", end: "2026-05-22 00:00", status: "已结束", operator: "qitian", operateTime: "2026-05-21T17:41:02.07...", content: "批量推送公告示例。" },
    { id: "267c23af-771a-4f52-bb01-e8ed8ddb787f", title: "地方官", type: "公告", recipient: "全体玩家", send: "2026-05-21 17:40", end: "2026-05-22 00:00", status: "已结束", operator: "qitian", operateTime: "2026-05-21T17:40:12.77...", content: "活动结束提示。" },
    { id: "b7e26838-acd2-47be-b892-ea33b0b8e03d", title: "多多在xx游戏", type: "消息", recipient: "全体玩家", send: "2026-05-21 16:33", end: "2026-05-22 00:00", status: "已结束", operator: "qitian", operateTime: "2026-05-21T16:33:39.81...", content: "站内消息正文内容。" },
    { id: "2ea03f7c-ae29-40d8-b57d-11f7eaf2ac19", title: "夏季新体验", type: "公告", recipient: "全体玩家", send: "2026-05-21 16:32", end: "2026-05-23 00:00", status: "已结束", operator: "qitian", operateTime: "2026-05-21T16:32:29.09...", content: "夏季活动体验公告。" },
    { id: "029d6b74-bdf3-42a5-b2d0-159fb1dd1c3a", title: "logo", type: "跑马灯", recipient: "全体玩家", send: "2026-05-21 16:30", end: "2026-05-31 00:00", status: "已发送", operator: "qitian", operateTime: "2026-05-21T16:30:22.12...", content: "logo 跑马灯通知。" },
    { id: "687c595a-d1d2-4fe6-b657-a8bde08637a6", title: "消息", type: "消息", recipient: "全体玩家", send: "2026-05-21 16:27", end: "2026-05-22 00:00", status: "已结束", operator: "qitian", operateTime: "2026-05-21T16:27:17.06...", content: "站内消息内容示例。" },
    { id: "17cc9d2b-dc8c-4e98-9f2a-b7cf5832a9bd", title: "System Ann...", type: "跑马灯", recipient: "全体玩家", send: "2026-05-21 10:56", end: "2026-05-31 00:00", status: "已发送", operator: "qitian", operateTime: "2026-05-21T10:56:11.92...", content: "System Announcement: maintenance window notice." },
    { id: "409176f5-77a2-43a5-ae96-008e231ddc89", title: "为中华崛起而", type: "消息", recipient: "全体玩家", send: "2026-05-20 18:30", end: "2026-05-20 23:59", status: "已结束", operator: "qitian", operateTime: "2026-05-20T18:30:52.63...", content: "历史消息。" },
    { id: "16566f15-8c34-4a5e-9b2b-10a809a6f307", title: "run", type: "跑马灯", recipient: "全体玩家", send: "2026-05-13 18:34", end: "2026-09-20 00:00", status: "已撤回", operator: "qitian", operateTime: "2026-05-21T10:54:53.82...", content: "已撤回的跑马灯消息。" },
    { id: "aae327c9-6a27-49ee-9010-7eec062013c9", title: "测试", type: "公告", recipient: "全体玩家", send: "2026-05-09 16:25", end: "2026-11-08 00:00", status: "已发送", operator: "zhoudaxi", operateTime: "2026-05-09T16:25:37.26...", content: "测试消息内容。" },
    { id: "6a2ec8c2-bd0f-47d5-a5df-1ad5e3e1f355", title: "测试公告", type: "公告", recipient: "全体玩家", send: "2026-05-09 16:22", end: "2026-09-20 00:00", status: "已发送", operator: "zhoudaxi", operateTime: "2026-05-09T16:22:24.21...", content: "测试公告正文。" }
  ];

  var messages = readMessages();
  var recallTarget = null;
  var draftBalanceCurrency = "USD";
  var balanceDraftShown = false;
  var inboxEntries = [];
  var activeInbox = null;
  var createOpener = null;

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

  function readMessages() {
    try {
      var stored = JSON.parse(window.localStorage.getItem(MESSAGE_STORAGE_KEY));
      if (Array.isArray(stored)) return stored;
    } catch (error) {
      return sampleMessages;
    }
    return sampleMessages;
  }

  function saveMessages(nextMessages) {
    try {
      window.localStorage.setItem(MESSAGE_STORAGE_KEY, JSON.stringify(nextMessages));
    } catch (error) {
      return false;
    }
    messages = nextMessages;
    return true;
  }

  function enabledCoupons() {
    try {
      var stored = window.localStorage.getItem(COUPON_STORAGE_KEY);
      var catalog = stored === null ? DEFAULT_COUPONS : JSON.parse(stored);
      if (!Array.isArray(catalog)) return [];
      return catalog.filter(function (coupon) {
        return coupon && coupon.enabled !== false && coupon.id && coupon.name
          && ["percent", "recharge_fixed", "recharge_percent"].indexOf(coupon.type) !== -1;
      });
    } catch (error) {
      return [];
    }
  }

  function messageTypeLabel(type) {
    return type === MAIL_TYPE ? "站内信" : type;
  }

  function messageStatus(item) {
    if (!item.sendAt || item.status === "已撤回") return item.status;
    var now = Date.now();
    if (now >= item.endAt) return "已结束";
    return now < item.sendAt ? "未开始" : "已发送";
  }

  function formatTime(date) {
    function pad(value) { return String(value).padStart(2, "0"); }
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate())
      + " " + pad(date.getHours()) + ":" + pad(date.getMinutes());
  }

  function attachmentLabels(attachments, detailed) {
    if (!attachments) return [];
    var balance = attachments.balance;
    var coupon = attachments.coupon;
    var labels = [];
    if (balance) {
      var multiple = balance.wagerMultiple === undefined ? "未设置" : balance.wagerMultiple + " 倍";
      labels.push(detailed ? "余额：" + balance.amount + "（币种：" + balance.currency + "，打码倍数：" + multiple + "）" : "余额");
    }
    if (coupon) labels.push(detailed ? "优惠券：" + coupon.name + " × " + coupon.quantity + " 张（" + coupon.id + "）" : "优惠券");
    return labels;
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
        && (!status || messageStatus(item) === status)
        && (!title || item.title.indexOf(title) >= 0);
    });
  }

  function renderRows() {
    var rows = filteredMessages();
    $("#messageTotal").textContent = "共 " + rows.length + " 条记录";
    $("#messageRows").innerHTML = rows.map(function (item) {
      var status = messageStatus(item);
      var action = status === "已撤回" ? "删除" : "撤回";
      return "<tr>"
        + "<td title=\"" + escapeHtml(item.id) + "\">" + escapeHtml(shortText(item.id, 13)) + "</td>"
        + "<td title=\"" + escapeHtml(item.title) + "\">" + escapeHtml(shortText(item.title, 8)) + "</td>"
        + "<td>" + escapeHtml(messageTypeLabel(item.type)) + "</td>"
        + "<td title=\"" + escapeHtml(item.recipient) + "\">" + escapeHtml(item.recipient) + "</td>"
        + "<td>" + escapeHtml(item.send) + "</td>"
        + "<td>" + escapeHtml(item.end) + "</td>"
        + "<td><span class=\"status-tag " + statusClass(status) + "\">" + escapeHtml(status) + "</span></td>"
        + "<td>" + escapeHtml(item.operator) + "</td>"
        + "<td title=\"" + escapeHtml(item.operateTime) + "\">" + escapeHtml(item.operateTime) + "</td>"
        + "<td>" + escapeHtml(attachmentLabels(item.attachments).join(" / ") || "—") + "</td>"
        + "<td><button class=\"table-action\" type=\"button\" data-detail=\"" + escapeHtml(item.id) + "\">详情</button>"
        + "<button class=\"table-action danger\" type=\"button\" data-recall=\"" + escapeHtml(item.id) + "\">" + action + "</button></td>"
        + "</tr>";
    }).join("") || '<tr><td colspan="11">暂无符合条件的消息</td></tr>';
  }

  function openModal(id) {
    $("#" + id).hidden = false;
  }

  function closeModal(id) {
    $("#" + id).hidden = true;
    if (id === "createModal") {
      activeInbox = null;
      if (createOpener) createOpener.focus();
      createOpener = null;
    }
  }

  function findMessage(id) {
    return messages.find(function (item) {
      return item.id === id;
    });
  }

  function showDetail(id) {
    var item = findMessage(id);
    if (!item) return;
    var status = messageStatus(item);
    var labels = attachmentLabels(item.attachments, true);
    $("#detailId").textContent = item.id;
    $("#detailStatus").innerHTML = "<span class=\"status-tag " + statusClass(status) + "\">" + escapeHtml(status) + "</span>";
    $("#detailType").textContent = messageTypeLabel(item.type);
    $("#detailRecipient").textContent = item.recipient;
    $("#detailSend").textContent = item.send;
    $("#detailEnd").textContent = item.end;
    $("#detailMessageTitle").textContent = item.title;
    $("#detailContent").textContent = item.content;
    $("#detailAttachmentRow").hidden = item.type !== MAIL_TYPE;
    $("#detailAttachments").textContent = labels.join("\n") || "无附件";
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

  function refreshCouponOptions() {
    var select = $("#attachmentCoupon");
    var selectedId = select.value;
    var coupons = enabledCoupons();
    select.options.length = 1;
    coupons.forEach(function (coupon) {
      select.add(new Option(coupon.name + "（" + coupon.id + "）", coupon.id));
    });
    select.value = coupons.some(function (coupon) { return coupon.id === selectedId; }) ? selectedId : "";
    select.disabled = coupons.length === 0;
    $("#attachmentQuantity").disabled = select.disabled;
    return coupons;
  }

  function currentSiteCurrency() {
    try {
      var source = window.businessSiteCurrency;
      var currency = source && typeof source.read === "function" ? source.read() : "USD";
      return typeof currency === "string" && /^[A-Z]{3}$/.test(currency) ? currency : "USD";
    } catch (error) {
      return "USD";
    }
  }

  function setDraftBalanceCurrency(currency) {
    draftBalanceCurrency = currency;
    $("#attachmentCurrency").textContent = currency;
  }

  function updateAttachmentPanel() {
    var isMail = $("#messageType").value === MAIL_TYPE;
    var hasBalance = isMail && $("#attachBalance").checked;
    var hasCoupon = isMail && $("#attachCoupon").checked;
    $("#messageAttachmentPanel").hidden = !isMail;
    $("#balanceAttachmentFields").hidden = !hasBalance;
    $("#attachmentWagerMultiple").disabled = !hasBalance;
    $("#attachmentWagerMultiple").required = hasBalance;
    $("#couponAttachmentFields").hidden = !hasCoupon;
    $("#attachmentCouponEmpty").hidden = !hasCoupon || !$("#attachmentCoupon").disabled;
  }

  function setAutoTrigger(enabled) {
    var toggle = $("#messageTriggerToggle");
    toggle.classList.toggle("is-on", enabled);
    toggle.setAttribute("aria-checked", String(enabled));
    $("#messageTriggerStatus").textContent = enabled ? "启用" : "停用";
  }

  function setCreateMode(entry) {
    activeInbox = entry;
    $("#createTitle").textContent = entry ? "编辑自动站内信" : "新增";
    $("#confirmCreateBtn").textContent = entry ? "保存" : "确定";
    ["messageTriggerRow", "automaticMessageFields", "automaticSendFields", "automaticMessageEnd"].forEach(function (id) {
      $("#" + id).hidden = !entry;
    });
    ["manualMessageFields", "manualSendFields", "manualMessageEnd"].forEach(function (id) {
      $("#" + id).hidden = !!entry;
    });
    $("#messageTriggerEvent").textContent = entry ? entry.label : "";
  }

  function readAutoInbox() {
    var stored;
    try { stored = JSON.parse(window.localStorage.getItem(AUTO_INBOX_KEY) || window.localStorage.getItem(LEGACY_AUTO_INBOX_KEY) || "null"); }
    catch (error) { /* Use the default templates if storage cannot be read. */ }
    return inboxEntries.reduce(function (config, entry) {
      var value = stored && stored[entry.key];
      var legacyWithdrawal = !value && entry.key === "withdrawRejected" && stored && stored.withdrawFailure;
      value = value || legacyWithdrawal || {};
      var title = typeof value.title === "string" ? value.title : typeof value.subject === "string" ? value.subject : entry.defaultTitle;
      var content = typeof value.content === "string" ? value.content : typeof value.body === "string" ? value.body : AUTO_INBOX_CONTENT[entry.key];
      if (legacyWithdrawal) {
        if (title === "提现失败") title = entry.defaultTitle;
        if (content === "您提交的一笔提现未成功，可在提现记录中查看订单状态。如有疑问，请联系官方客服。") {
          content = AUTO_INBOX_CONTENT[entry.key];
        }
      }
      config[entry.key] = {
        enabled: value.enabled === true,
        title: title,
        content: content,
        attachments: value.attachments || null,
        expiryDays: Number.isSafeInteger(value.expiryDays) && value.expiryDays > 0 ? value.expiryDays : DEFAULT_EXPIRY_DAYS
      };
      return config;
    }, {});
  }

  function renderAutoInbox(config) {
    inboxEntries.forEach(function (entry) {
      var value = config[entry.key];
      entry.title.textContent = value.title || "—";
      entry.title.title = value.title;
      entry.status.textContent = value.enabled ? "启用" : "停用";
      entry.status.classList.toggle("is-on", value.enabled);
      entry.attachments.textContent = attachmentLabels(value.attachments).join(" / ") || "—";
      entry.attachments.title = attachmentLabels(value.attachments, true).join(" / ");
    });
  }

  function openAutoInbox(entry) {
    var value = readAutoInbox()[entry.key];
    setCreateMode(entry);
    resetCreateForm();
    setAutoTrigger(value.enabled);
    $("#messageType").value = MAIL_TYPE;
    $("#messageTitle").value = value.title;
    $("#messageContent").value = value.content;
    $("#charCount").textContent = $("#messageContent").value.length;
    $("#messageExpiryDays").value = value.expiryDays;
    refreshCouponOptions();
    var balance = value.attachments && value.attachments.balance;
    var coupon = value.attachments && value.attachments.coupon;
    if (balance) {
      $("#attachBalance").checked = true;
      balanceDraftShown = true;
      setDraftBalanceCurrency(balance.currency);
      $("#attachmentAmount").value = balance.amount;
      $("#attachmentWagerMultiple").value = balance.wagerMultiple == null ? "" : balance.wagerMultiple;
    }
    if (coupon) {
      $("#attachCoupon").checked = true;
      $("#attachmentCoupon").value = coupon.id;
      $("#attachmentQuantity").value = coupon.quantity;
    }
    updateAttachmentPanel();
    createOpener = entry.edit;
    openModal("createModal");
    $("#messageTitle").focus();
  }

  function initAutoInbox() {
    inboxEntries = $all("[data-inbox-event]").map(function (row) {
      var title = row.querySelector("[data-inbox-title]");
      return {
        key: row.getAttribute("data-inbox-event"),
        label: row.cells[0].textContent.trim(),
        defaultTitle: title.textContent.trim(),
        title: title,
        status: row.querySelector("[data-inbox-status]"),
        attachments: row.querySelector("[data-inbox-attachments]"),
        edit: row.querySelector("[data-inbox-edit]")
      };
    });
    inboxEntries.forEach(function (entry) {
      entry.edit.disabled = false;
      entry.edit.setAttribute("aria-label", "编辑" + entry.label + "站内信");
      entry.edit.addEventListener("click", function () { openAutoInbox(entry); });
    });
    renderAutoInbox(readAutoInbox());

    var tabs = $all('[data-message-tabs] [role="tab"]');
    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (item) {
          item.setAttribute("aria-selected", String(item === tab));
          item.tabIndex = item === tab ? 0 : -1;
        });
      });
      tab.addEventListener("keydown", function (event) {
        var next;
        if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
        else if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else return;
        event.preventDefault();
        tabs[next].click();
        tabs[next].focus();
      });
    });
  }

  function resetCreateForm() {
    $("#messageType").value = "";
    $("#recipientType").value = "";
    $("#messageTitle").value = "";
    $("#messageContent").value = "";
    $("#playerIds").value = "";
    $("#scheduleTime").value = "";
    $("#endTime").value = "";
    $("#messageExpiryDays").value = DEFAULT_EXPIRY_DAYS;
    $("#createError").hidden = true;
    $("#contentError").hidden = true;
    $("#charCount").textContent = "0";
    $("#attachBalance").checked = false;
    $("#attachCoupon").checked = false;
    balanceDraftShown = false;
    setDraftBalanceCurrency(currentSiteCurrency());
    $("#attachmentAmount").value = $("#attachmentAmount").defaultValue;
    $("#attachmentWagerMultiple").value = $("#attachmentWagerMultiple").defaultValue;
    $("#attachmentCoupon").value = "";
    $("#attachmentQuantity").value = $("#attachmentQuantity").defaultValue;
    $all("input[name='vip'], input[name='r']").forEach(function (input) {
      input.checked = false;
    });
    $("#scrollAuto").checked = true;
    document.querySelector("input[name='sendTime'][value='now']").checked = true;
    updateRecipientPanel();
    updateScheduleInput();
    updateAttachmentPanel();
  }

  function resetFilters() {
    $("#filterType").value = "";
    $("#filterStatus").value = "";
    $("#filterTitle").value = "";
  }

  function createError(message, selector) {
    var error = $("#createError");
    error.textContent = message;
    error.hidden = false;
    if (selector) $(selector).focus();
    return false;
  }

  function readRecipient() {
    var type = $("#recipientType").value;
    if (!type) return createError("请选择收件人。", "#recipientType");
    if (type === "自定义玩家") {
      var ids = $("#playerIds").value.split(/[,，\s]+/).filter(Boolean);
      if (!ids.length || ids.some(function (id) { return !/^\d+$/.test(id); })) {
        return createError("请输入有效的收件人ID，多个ID用逗号分隔。", "#playerIds");
      }
      return type + "：" + Array.from(new Set(ids)).join("、");
    }
    if (type === "VIP玩家" || type === "R玩家") {
      var group = type === "VIP玩家" ? "vip" : "r";
      var selector = "input[name='" + group + "']";
      var selected = $all(selector + ":checked").map(function (input) { return input.value; });
      if (!selected.length) return createError("请选择至少一个收件人分组。", selector);
      return type + "：" + selected.join("、");
    }
    return type;
  }

  function readAttachments() {
    if ($("#messageType").value !== MAIL_TYPE) return null;
    var attachments = {};

    if ($("#attachBalance").checked) {
      var currency = currentSiteCurrency();
      if (currency !== draftBalanceCurrency) {
        setDraftBalanceCurrency(currency);
        return createError("站点币种已变更为 " + currency + "，请核对每人金额后再次确定。", "#attachmentAmount");
      }
      var amountInput = $("#attachmentAmount").value;
      if (!/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(amountInput)) {
        return createError("请输入大于 0 的余额金额，最多保留两位小数。", "#attachmentAmount");
      }
      var parts = amountInput.split(".");
      var amount = (parts[0] || "0").replace(/^0+(?=\d)/, "") + "." + (parts[1] || "").padEnd(2, "0");
      var cents = Number(amount.replace(".", ""));
      if (!Number.isSafeInteger(cents) || cents <= 0) {
        return createError("请输入有效的正数余额金额。", "#attachmentAmount");
      }
      var multipleInput = $("#attachmentWagerMultiple").value;
      var wagerMultiple = Number(multipleInput);
      if (!/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(multipleInput) || !Number.isSafeInteger(Math.round(wagerMultiple * 100))) {
        return createError("请输入不小于 0 的打码倍数，最多保留两位小数。", "#attachmentWagerMultiple");
      }
      attachments.balance = { currency: currency, amount: amount, wagerMultiple: wagerMultiple };
    }

    if ($("#attachCoupon").checked) {
      var coupons = refreshCouponOptions();
      updateAttachmentPanel();
      var select = $("#attachmentCoupon");
      if (select.disabled) return createError("没有启用中的优惠券，请先在票券中心配置。", "#attachCoupon");
      var coupon = coupons.find(function (item) { return item.id === select.value; });
      if (!coupon) return createError("请选择一张启用中的优惠券。", "#attachmentCoupon");
      var quantityInput = $("#attachmentQuantity").value;
      var quantity = Number(quantityInput);
      if (!/^\d+$/.test(quantityInput) || !Number.isSafeInteger(quantity) || quantity < 1) {
        return createError("优惠券张数须为正整数。", "#attachmentQuantity");
      }
      attachments.coupon = { id: coupon.id, name: coupon.name, quantity: quantity };
    }

    return attachments.balance || attachments.coupon ? attachments : null;
  }

  function readMessageDraft() {
    var title = $("#messageTitle").value.trim();
    if (!title) return createError("请输入标题。", "#messageTitle");
    var attachments = readAttachments();
    if (attachments === false) return;
    var content = $("#messageContent").value.trim();
    if (!content) {
      $("#contentError").hidden = false;
      return createError("请输入显示内容。", "#messageContent");
    }
    return { title: title, content: content, attachments: attachments };
  }

  function saveAutoInbox(draft) {
    var expiryInput = $("#messageExpiryDays").value;
    var expiryDays = Number(expiryInput);
    if (!/^\d+$/.test(expiryInput) || !Number.isSafeInteger(expiryDays) || expiryDays < 1) {
      return createError("发送后天数须为正整数。", "#messageExpiryDays");
    }
    var config = readAutoInbox();
    config[activeInbox.key] = Object.assign(draft, {
      enabled: $("#messageTriggerToggle").getAttribute("aria-checked") === "true",
      expiryDays: expiryDays
    });
    try { window.localStorage.setItem(AUTO_INBOX_KEY, JSON.stringify(config)); }
    catch (error) { return createError("自动站内信保存失败，请重试。"); }
    renderAutoInbox(config);
    closeModal("createModal");
  }

  function saveCreateForm() {
    $("#createError").hidden = true;
    var type = $("#messageType").value;
    if (!type) return createError("请选择消息类型。", "#messageType");
    var recipient = activeInbox ? null : readRecipient();
    if (!activeInbox && !recipient) return;
    var draft = readMessageDraft();
    if (!draft) return;
    if (activeInbox) return saveAutoInbox(draft);

    var now = new Date();
    var scheduled = document.querySelector("input[name='sendTime']:checked").value === "schedule";
    var send = scheduled ? new Date($("#scheduleTime").value) : now;
    var end = new Date($("#endTime").value);
    if (scheduled && !(send > now)) return createError("定时发送时间须晚于当前时间。", "#scheduleTime");
    if (!(end > send)) return createError("结束时间须晚于发送时间。", "#endTime");

    var item = {
      id: window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : "msg-" + now.getTime(),
      title: draft.title,
      type: type,
      recipient: recipient,
      content: draft.content,
      send: formatTime(send),
      end: formatTime(end),
      sendAt: send.getTime(),
      endAt: end.getTime(),
      status: scheduled ? "未开始" : "已发送",
      operator: "qitian",
      operateTime: formatTime(now),
      attachments: draft.attachments
    };
    if (!saveMessages([item].concat(messages))) return createError("记录保存失败，请检查浏览器存储后重试。");
    if (filteredMessages().indexOf(item) === -1) resetFilters();
    renderRows();
    closeModal("createModal");
  }

  function initEvents() {
    $("#searchBtn").addEventListener("click", renderRows);
    $("#resetBtn").addEventListener("click", function () {
      resetFilters();
      renderRows();
    });
    $("#openCreateBtn").addEventListener("click", function () {
      setCreateMode(null);
      resetCreateForm();
      createOpener = this;
      openModal("createModal");
    });
    $("#messageTriggerToggle").addEventListener("click", function () {
      if (!activeInbox) return;
      setAutoTrigger(this.getAttribute("aria-checked") !== "true");
    });
    $("#createModal").addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeModal("createModal");
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
    $("#messageType").addEventListener("change", function () {
      if (this.value === MAIL_TYPE) refreshCouponOptions();
      updateAttachmentPanel();
    });
    $("#attachBalance").addEventListener("change", function () {
      if (this.checked) {
        if (!balanceDraftShown || !$("#attachmentAmount").value) setDraftBalanceCurrency(currentSiteCurrency());
        balanceDraftShown = true;
      }
      updateAttachmentPanel();
    });
    $("#attachCoupon").addEventListener("change", function () {
      if (this.checked) refreshCouponOptions();
      updateAttachmentPanel();
    });
    window.addEventListener("storage", function (event) {
      if (event.key !== COUPON_STORAGE_KEY || $("#messageAttachmentPanel").hidden || $("#createModal").hidden) return;
      refreshCouponOptions();
      updateAttachmentPanel();
    });
    $("#createModal").addEventListener("input", function () {
      $("#createError").hidden = true;
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
    $("#confirmCreateBtn").addEventListener("click", saveCreateForm);
    $("#confirmRecallBtn").addEventListener("click", function () {
      if (recallTarget) {
        var nextMessages = messages.map(function (item) {
          return item === recallTarget ? Object.assign({}, item, { status: "已撤回", operateTime: formatTime(new Date()) }) : item;
        });
        if (!saveMessages(nextMessages)) {
          window.alert("撤回记录保存失败，请检查浏览器存储后重试。");
          return;
        }
        recallTarget = null;
        renderRows();
      }
      closeModal("recallModal");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!$("#messageRows") || !$("#messageAttachmentPanel")) return;
    renderCheckLists();
    updateRecipientPanel();
    updateScheduleInput();
    updateAttachmentPanel();
    initEvents();
    initAutoInbox();
    renderRows();
  });
})();
