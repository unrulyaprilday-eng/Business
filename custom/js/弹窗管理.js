(function () {
  var T = {
    reg: "register_success",
    login: "login_success",
    guest: "guest_visit",
    daily: "daily_first_login",
    low: "low_balance",
    withdraw: "withdraw_success",
    recharge: "repeat_recharge_success",
    enter: "game_pre_enter",
    back: "lobby_return",
    closeReg: "register_closed",
    firstPay: "first_recharge_success",
    on: "\u5f00\u542f",
    off: "\u5173\u95ed"
  };

  var TRIGGER_LABEL = {};
  TRIGGER_LABEL[T.reg] = "\u6ce8\u518c\u6210\u529f";
  TRIGGER_LABEL[T.login] = "\u767b\u5f55\u6210\u529f";
  TRIGGER_LABEL[T.guest] = "\u6e38\u5ba2\u8bbf\u95ee";
  TRIGGER_LABEL[T.daily] = "\u6bcf\u65e5\u9996\u6b21\u767b\u5f55";
  TRIGGER_LABEL[T.low] = "\u4f59\u989d\u4e0d\u8db3";
  TRIGGER_LABEL[T.withdraw] = "\u63d0\u73b0\u6210\u529f";
  TRIGGER_LABEL[T.recharge] = "\u975e\u9996\u6b21\u5145\u503c\u6210\u529f";
  TRIGGER_LABEL[T.enter] = "\u8fdb\u5165\u6e38\u620f\u524d";
  TRIGGER_LABEL[T.back] = "\u8fd4\u56de\u5927\u5385";
  TRIGGER_LABEL[T.closeReg] = "\u5173\u95ed\u6ce8\u518c";
  TRIGGER_LABEL[T.firstPay] = "\u9996\u5145\u6210\u529f";

  var TIP = {};
  TIP[T.reg] = {
    p: "\u6ce8\u518c\u6210\u529f\u540e\u9996\u6b21\u8fdb\u5165\u5927\u5385\u5c55\u793a\uff0c\u9002\u5408\u5f15\u5bfc\u7ed1\u5b9a\u3001\u4e0b\u8f7d\u6216\u6b22\u8fce\u793c\u5305\u3002",
    s: "\u540c\u4e00\u79cd\u89e6\u53d1\u5f39\u7a97\u4e0b\uff0c\u591a\u4e2a\u5f39\u7a97\u6309\u6392\u5e8f\u4ece\u5c0f\u5230\u5927\u4f9d\u6b21\u5f39\u51fa\uff1b\u524d\u4e00\u4e2a\u7a97\u53e3\u5173\u95ed\u540e\u518d\u5c55\u793a\u4e0b\u4e00\u4e2a\u3002"
  };
  TIP[T.login] = { p: "\u767b\u5f55\u6210\u529f\u9002\u5408\u627f\u63a5\u56de\u6d41\u53ec\u56de\u3001\u7b7e\u5230\u63d0\u9192\u548c\u9650\u65f6\u5956\u52b1\u66dd\u5149\u3002", s: "\u5982\u5b58\u5728\u591a\u4e2a\u767b\u5f55\u6210\u529f\u5f39\u7a97\uff0c\u5efa\u8bae\u6309\u6e20\u9053\u3001\u8bed\u8a00\u548c\u4f18\u5148\u7ea7\u62c6\u5206\uff0c\u907f\u514d\u7528\u6237\u91cd\u590d\u6253\u65ad\u3002" };
  TIP[T.guest] = { p: "\u6e38\u5ba2\u8bbf\u95ee\u9002\u5408\u5c55\u793a\u6ce8\u518c\u5f15\u5bfc\u3001\u4e0b\u8f7d\u63d0\u9192\u6216\u65b0\u5ba2\u798f\u5229\u5165\u53e3\u3002", s: "\u6e38\u5ba2\u8bbf\u95ee\u65e0\u6cd5\u7ed1\u5b9a\u8d26\u53f7\u6761\u4ef6\uff0c\u5efa\u8bae\u914d\u5408\u6e20\u9053\u9650\u5236\u548c\u5c55\u793a\u661f\u671f\u63a7\u5236\u6295\u653e\u8303\u56f4\u3002" };
  TIP[T.daily] = { p: "\u6bcf\u65e5\u9996\u6b21\u767b\u5f55\u5e38\u7528\u4e8e\u7b7e\u5230\u3001\u8fd4\u5229\u6216\u5f53\u5929\u8fd0\u8425\u516c\u544a\u63d0\u9192\u3002", s: "\u6bcf\u65e5\u9996\u6b21\u767b\u5f55\u4ec5\u5728\u81ea\u7136\u65e5\u9996\u4e2a\u4f1a\u8bdd\u89e6\u53d1\uff0c\u6392\u5e8f\u8d8a\u5c0f\u8d8a\u5148\u5c55\u793a\u3002" };
  TIP[T.low] = { p: "\u4f59\u989d\u4e0d\u8db3\u65f6\u9002\u5408\u62c9\u8d77\u5145\u503c\u3001\u9996\u5145\u8f6c\u5316\u6216\u4f59\u989d\u8865\u8d34\u63d0\u9192\u3002", s: "\u53ef\u901a\u8fc7\u4f59\u989d\u9608\u503c\u548c\u5b50\u7c7b\u578b\u533a\u5206\u9996\u5145\u672a\u5b8c\u6210\u3001\u4e8c\u5145\u672a\u5b8c\u6210\u7b49\u4e0d\u540c\u8f6c\u5316\u94fe\u8def\u3002" };
  TIP[T.withdraw] = { p: "\u63d0\u73b0\u6210\u529f\u573a\u666f\u9002\u5408\u4e8c\u6b21\u5145\u503c\u3001\u6d3b\u52a8\u56de\u6d41\u6216\u8fd4\u573a\u5956\u52b1\u63d0\u793a\u3002", s: "\u5982\u9700\u51cf\u5c11\u6253\u6270\uff0c\u53ef\u5173\u95ed\u4e0d\u518d\u63d0\u793a\u6216\u4ec5\u6295\u653e\u6307\u5b9a\u8bed\u8a00\u3001\u6307\u5b9a\u6e20\u9053\u3002" };
  TIP[T.recharge] = { p: "\u975e\u9996\u6b21\u5145\u503c\u6210\u529f\u53ef\u627f\u63a5\u5145\u503c\u8fd4\u5229\u3001\u793c\u5305\u52a0\u7801\u6216\u4efb\u52a1\u5956\u52b1\u63d0\u9192\u3002", s: "\u5efa\u8bae\u548c\u7d2f\u8ba1\u5145\u503c\u91d1\u989d\u6761\u4ef6\u8054\u52a8\uff0c\u907f\u514d\u4e0d\u540c\u68af\u5ea6\u7528\u6237\u770b\u5230\u540c\u4e00\u5f39\u7a97\u3002" };
  TIP[T.enter] = { p: "\u8fdb\u5165\u6e38\u620f\u524d\u9002\u5408\u5c55\u793a\u9650\u65f6\u4efb\u52a1\u3001\u5c40\u5185\u6d3b\u52a8\u548c\u8865\u8d34\u5f15\u5bfc\u3002", s: "\u53ef\u901a\u8fc7\u7d2f\u8ba1\u5145\u503c\u6b21\u6570\u3001\u7d2f\u8ba1\u5145\u503c\u91d1\u989d\u9650\u5236\u547d\u4e2d\u6761\u4ef6\u3002" };
  TIP[T.back] = { p: "\u8fd4\u56de\u5927\u5385\u65f6\u5c55\u793a\u8865\u8d34\u6216\u5145\u503c\u5f15\u5bfc\uff0c\u9002\u5408\u5728\u4f59\u989d\u4e0d\u8db3\u540e\u627f\u63a5\u3002", s: "\u5e38\u4e0e\u4f59\u989d\u4e0d\u8db3\u9608\u503c\u7ec4\u5408\u4f7f\u7528\uff0c\u73a9\u5bb6\u9000\u51fa\u6e38\u620f\u540e\u518d\u89e6\u53d1\u5f39\u7a97\u3002" };
  TIP[T.closeReg] = { p: "\u5173\u95ed\u6ce8\u518c\u9002\u5408\u8bf4\u660e\u539f\u56e0\u3001\u5f15\u5bfc\u8054\u7cfb\u5ba2\u670d\u6216\u8df3\u8f6c\u5907\u7528\u5165\u53e3\u3002", s: "\u5efa\u8bae\u957f\u671f\u6709\u6548\u5e76\u8986\u76d6\u591a\u8bed\u8a00\uff0c\u907f\u514d\u4e0d\u540c\u7aef\u5c55\u793a\u53e3\u5f84\u4e0d\u4e00\u81f4\u3002" };
  TIP[T.firstPay] = { p: "\u9996\u5145\u6210\u529f\u5e38\u7528\u4e8e\u4e8c\u5145\u5f15\u5bfc\u3001\u6210\u957f\u793c\u5305\u6216\u798f\u5229\u5347\u7ea7\u63d0\u793a\u3002", s: "\u53ef\u642d\u914d\u5f39\u7a97\u6309\u94ae\u548c\u5185\u94fe\u8df3\u8f6c\uff0c\u627f\u63a5\u540e\u7eed\u8f6c\u5316\u52a8\u4f5c\u3002" };

  var POPUPS = [
    { id: "202610001", name: "\u65b0\u4eba\u9996\u767b\u793c\u5305", version: "v5", refs: "2\u4e2a\u65b9\u6848", planRefs: "\u65b0\u4eba\u9996\u5145\u8f6c\u5316 v6\u3001\u6ce8\u518c\u672a\u9996\u5145\u81ea\u52a8\u57f9\u80b2 v2", metrics: "8,642 / 1,286", sortOrder: 1, imageTheme: "light", platform: "APP", trigger: T.reg, deliveryMode: "\u72ec\u7acb\u6295\u653e\u5e76\u5141\u8bb8\u65b9\u6848\u5f15\u7528", planRequestCapability: "\u5141\u8bb8\u65b9\u6848\u8bf7\u6c42\uff08\u4ecd\u6267\u884c\u5168\u90e8\u89c4\u5219\uff09", priority: 80, mutex: "\u65b0\u4eba\u8f6c\u5316\u7ec4", sessionCap: 1, dailyCap: 1, cooldown: "12\u5c0f\u65f6", jumpType: "\u5916\u94fe", jumpLink: "https://gift.example.com", language: "\u8bed\u8a001", status: T.on, startTime: "2026-06-30 00:00:00", endTime: "2026-07-30 23:59:59", createdTime: "2026-06-28 10:21:16" },
    { id: "202610004", name: "\u6bcf\u65e5\u9996\u767b\u7b7e\u5230\u63d0\u9192", sortOrder: 2, imageTheme: "purple", platform: "H5", trigger: T.daily, jumpType: "\u5185\u94fe", jumpLink: "\u7b7e\u5230\u4e2d\u5fc3", language: "\u8bed\u8a002", status: T.on, startTime: "2026-06-29 00:00:00", endTime: "2026-09-30 23:59:59", createdTime: "2026-06-24 09:16:31" },
    { id: "202610002", name: "\u4f59\u989d\u8865\u8d34\u63d0\u793a", sortOrder: 3, imageTheme: "purple", platform: "H5", trigger: T.low, jumpType: "\u5185\u94fe", jumpLink: "\u5145\u503c\u4e2d\u5fc3", language: "\u8bed\u8a001", status: T.on, startTime: "2026-06-30 00:00:00", endTime: "2026-08-31 23:59:59", createdTime: "2026-06-27 16:35:22" },
    { id: "202610003", name: "\u56de\u5385\u518d\u51b2\u793c\u5305", sortOrder: 4, imageTheme: "light", platform: "APP,H5", trigger: T.back, jumpType: "\u5185\u94fe", jumpLink: "\u5145\u503c\u4e2d\u5fc3", language: "\u8bed\u8a001", status: T.off, startTime: "2026-06-26 12:00:00", endTime: "2026-12-31 23:59:59", createdTime: "2026-06-25 14:08:53" }
  ];

  var SYSTEM_POPUP_OPTIONS = [
    { value: "\u5145\u503c\u5f39\u7a97", label: "\u5145\u503c\u5f39\u7a97" },
    { value: "\u767b\u5f55\u5f39\u7a97", label: "\u767b\u5f55\u5f39\u7a97" },
    { value: "\u6ce8\u518c\u5f39\u7a97", label: "\u6ce8\u518c\u5f39\u7a97" },
    { value: "\u5b89\u88c5PWA", label: "\u5b89\u88c5PWA" },
    { value: "\u4f59\u989d\u4e0d\u8db3\u5f39\u7a97", label: "\u4f59\u989d\u4e0d\u8db3\u5f39\u7a97" },
    { value: "\u9996\u5145\u6210\u529f\u5f39\u7a97", label: "\u9996\u5145\u6210\u529f\u5f39\u7a97" }
  ];

  var INTERNAL_LINK_OPTIONS = [
    { value: "\u5145\u503c\u4e2d\u5fc3", label: "\u5145\u503c\u4e2d\u5fc3" },
    { value: "\u6d3b\u52a8\u4e2d\u5fc3", label: "\u6d3b\u52a8\u4e2d\u5fc3" },
    { value: "/activity", label: "\u6d3b\u52a8 /activity" },
    { value: "/vip", label: "VIP /vip" },
    { value: "", label: "\u81ea\u5b9a\u4e49" }
  ];

  var DEFAULT_IMAGE_BLOCKS = [
    { jumpType: "\u5185\u94fe", innerType: "\u5f39\u7a97", target: "\u5145\u503c\u5f39\u7a97" },
    { jumpType: "\u5916\u94fe", target: "https://promo.example.com" }
  ];

  var state = { rows: POPUPS.slice(), editingId: null, imageBlocks: cloneBlocks(DEFAULT_IMAGE_BLOCKS), pendingStatusId: null, pendingStatusNext: null };

  var rowsEl = document.getElementById("popupRows");
  var emptyStateEl = document.getElementById("emptyState");
  var totalCountEl = document.getElementById("totalCount");
  var modalEl = document.getElementById("popupModal");
  var modalTitleEl = document.getElementById("popupModalTitle");
  var imageListEl = document.getElementById("imageList");
  var tipP = document.getElementById("triggerTipPrimary");
  var tipS = document.getElementById("triggerTipSecondary");
  var triggerCodeEl = document.getElementById("triggerCode");
  var formTriggerEl = document.getElementById("formTrigger");
  var channelVisibilityEl = document.getElementById("channelVisibility");
  var channelTargetRowEl = document.getElementById("channelTargetRow");
  var channelNamesEl = document.getElementById("channelNames");
  var channelNoteEl = document.getElementById("channelNote");
  var longTermEl = document.getElementById("longTerm");
  var endTimeEl = document.getElementById("endTime");
  var conditionSectionEl = document.getElementById("triggerConditionSection");
  var conditionCardTitleEl = document.getElementById("conditionCardTitle");
  var balanceAmountLabelEl = document.getElementById("balanceAmountLabel");
  var balanceSubTypeLabelEl = document.getElementById("balanceSubTypeLabel");
  var statusSwitchEl = document.getElementById("statusSwitch");
  var statusConfirmModalEl = document.getElementById("statusConfirmModal");
  var statusConfirmTextEl = document.getElementById("statusConfirmText");
  var buttonTextFieldEl = document.getElementById("buttonTextField");
  var deliveryModeEl = document.getElementById("deliveryMode");
  var planRequestCapabilityEl = document.getElementById("planRequestCapability");
  var popupVersionEl = document.getElementById("popupVersion");
  var popupPriorityEl = document.getElementById("popupPriority");
  var popupMutexEl = document.getElementById("popupMutex");
  var sessionCapEl = document.getElementById("sessionCap");
  var dailyCapEl = document.getElementById("dailyCap");
  var popupCooldownEl = document.getElementById("popupCooldown");
  var testMembersEl = document.getElementById("testMembers");
  var popupPlanRefsEl = document.getElementById("popupPlanRefs");

  function cloneBlocks(blocks) { return blocks.map(function (b) { return Object.assign({}, b); }); }
  function esc(v) { return String(v).replace(/[&<>\"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]; }); }
  function renderOptions(options, selected) { return options.map(function (option) { return '<option value="' + esc(option.value) + '"' + (String(selected) === String(option.value) ? " selected" : "") + '>' + esc(option.label) + "</option>"; }).join(""); }
  function hasOption(options, value) { return options.some(function (option) { return option.value === value; }); }
  function setSwitch(button, on) { button.classList.toggle("on", on); button.setAttribute("aria-pressed", on ? "true" : "false"); }
  function getTriggerLabel(trigger) { return TRIGGER_LABEL[trigger] || trigger; }
  function getCheckedValue(name, fallback) { var checked = document.querySelector('input[name="' + name + '"]:checked'); return checked ? checked.value : fallback; }
  function setCheckedValue(name, value) { Array.prototype.forEach.call(document.querySelectorAll('input[name="' + name + '"]'), function (input) { input.checked = input.value === value; }); }
  function nextVersion(value) { var number = Number(String(value || "v0").replace("v", "")); return "v" + (isNaN(number) ? 1 : number + 1); }
  function getSortValue(item) { var n = Number(item && item.sortOrder); return isNaN(n) ? 999999 : n; }
  function sortRows(list) { return list.slice().sort(function (a, b) { var sa = getSortValue(a); var sb = getSortValue(b); if (sa !== sb) return sa - sb; return String(a.id).localeCompare(String(b.id)); }); }

  function renderTable(list) {
    var sortedList = sortRows(list);
    rowsEl.innerHTML = sortedList.map(function (item) {
      var pillClass = item.status === T.on ? "" : "off";
      var pillText = item.status === T.on ? T.on : T.off;
      return [
        "<tr>",
        "<td>" + esc(item.id) + "</td>",
        "<td><strong>" + esc(item.name) + "</strong><small class=\"popup-row-meta\">" + esc(item.version || "v1") + " · " + esc(item.refs || "\u72ec\u7acb\u6295\u653e") + "<br>\u4eca\u65e5\u66dd\u5149/\u70b9\u51fb " + esc(item.metrics || "0 / 0") + "</small></td>",
        "<td>" + esc(getSortValue(item)) + "</td>",
        '<td><div class="thumb-card ' + esc(item.imageTheme) + '"></div></td>',
        "<td>" + esc(item.platform) + "</td>",
        "<td>" + esc(getTriggerLabel(item.trigger)) + "<small class=\"popup-row-meta\">" + esc(item.trigger) + "</small></td>",
        "<td>" + esc(item.jumpType) + "</td>",
        "<td>" + esc(item.jumpLink) + "</td>",
        "<td>" + esc(item.language) + "</td>",
        '<td><div class="status-switch"><button class="cl-switch-button' + (item.status === T.on ? " is-on" : "") + '" type="button" data-status-toggle="' + esc(item.id) + '" aria-pressed="' + (item.status === T.on ? "true" : "false") + '" aria-label="' + (item.status === T.on ? "\u70b9\u51fb\u5173\u95ed\u5f39\u7a97" : "\u70b9\u51fb\u5f00\u542f\u5f39\u7a97") + '"></button></div></td>',
        "<td>" + esc(item.startTime) + "</td>",
        "<td>" + esc(item.endTime) + "</td>",
        "<td>" + esc(item.createdTime) + "</td>",
        '<td><div class="action-stack"><button class="action-link" type="button" data-edit="' + esc(item.id) + '">\u7f16\u8f91</button><button class="action-link danger" type="button" data-delete="' + esc(item.id) + '">\u5220\u9664</button></div></td>',
        "</tr>"
      ].join("");
    }).join("");
    emptyStateEl.hidden = list.length > 0;
    totalCountEl.textContent = "\u5171 " + list.length + " \u6761\u8bb0\u5f55";
  }

  function applyFilters() {
    var keyword = document.getElementById("popupKeyword").value.trim();
    var trigger = document.getElementById("popupTrigger").value;
    var platform = document.getElementById("popupTerminal").value;
    var status = document.getElementById("popupStatus").value;
    state.rows = POPUPS.filter(function (item) {
      var passPlatform = true;
      if (platform === "app") passPlatform = item.platform.indexOf("APP") !== -1;
      else if (platform === "h5") passPlatform = item.platform.indexOf("H5") !== -1;
      return (!keyword || item.name.indexOf(keyword) !== -1) && (!trigger || item.trigger === trigger) && passPlatform && (!status || item.status === status);
    });
    renderTable(state.rows);
  }

  function getPopupById(id) { return POPUPS.filter(function (item) { return item.id === id; })[0]; }
  function getSelectedPlatforms() { return Array.prototype.slice.call(document.querySelectorAll('input[name="terminal"]:checked')).map(function (i) { return i.value; }); }
  function renderTips(trigger) {
    var t = TIP[trigger] || TIP[T.reg];
    tipP.textContent = t.p;
    tipS.textContent = t.s;
    triggerCodeEl.textContent = trigger;
  }
  function renderPlanCapabilityState() {
    var independentOnly = deliveryModeEl.value === "\u4ec5\u72ec\u7acb\u6295\u653e";
    planRequestCapabilityEl.disabled = independentOnly;
    if (independentOnly) planRequestCapabilityEl.value = "\u4ec5\u767b\u8bb0\u8d44\u683c\uff0c\u7b49\u5f85\u539f\u573a\u666f";
  }
  function renderChannelState() {
    var v = channelVisibilityEl.value;
    var needTarget = v === "\u4ec5\u6e20\u9053\u53ef\u89c1" || v === "\u4ec5\u6e20\u9053\u4e0d\u53ef\u89c1";
    channelTargetRowEl.hidden = !needTarget;
    channelNoteEl.textContent = v === "\u4ec5\u6e20\u9053\u53ef\u89c1" ? "\u591a\u6e20\u9053\u8fd0\u8425\u5efa\u8bae\u5f00\u542f\uff0c\u4ec5\u8ba9\u547d\u4e2d\u6e20\u9053\u67e5\u770b\u5bf9\u5e94\u8bed\u8a00\u5f39\u7a97\u3002" : v === "\u4ec5\u6e20\u9053\u4e0d\u53ef\u89c1" ? "\u6392\u9664\u6295\u653e\u6e20\u9053\u65f6\u53ef\u7528\uff0c\u907f\u514d\u7279\u5b9a\u6e20\u9053\u91cd\u590d\u547d\u4e2d\u5f39\u7a97\u3002" : "\u6e38\u5ba2\u8bbf\u95ee\u3001\u73a9\u6cd5\u9650\u5236\u7b49\u573a\u666f\u5efa\u8bae\u5f00\u653e\u5168\u90e8\u6e20\u9053\u3002";
  }
  function openStatusConfirm(id, nextStatus) {
    state.pendingStatusId = id;
    state.pendingStatusNext = nextStatus;
    statusConfirmTextEl.textContent = nextStatus === T.on ? "\u786e\u8ba4\u5f00\u542f\u8be5\u5f39\u7a97\u5417\uff1f" : "\u786e\u8ba4\u5173\u95ed\u8be5\u5f39\u7a97\u5417\uff1f";
    statusConfirmModalEl.hidden = false;
  }
  function closeStatusConfirm() {
    state.pendingStatusId = null;
    state.pendingStatusNext = null;
    statusConfirmModalEl.hidden = true;
  }
  function submitStatusConfirm() {
    var item = getPopupById(state.pendingStatusId);
    if (item && state.pendingStatusNext) {
      item.status = state.pendingStatusNext;
      applyFilters();
    }
    closeStatusConfirm();
  }
  function renderButtonTextState() {
    var checked = document.querySelector('input[name="hasButton"]:checked');
    if (!buttonTextFieldEl) return;
    buttonTextFieldEl.hidden = !!checked && checked.value === "\u65e0";
  }
  function renderConditions(trigger) {
    var balanceVisible = trigger === T.low || trigger === T.back;
    var gameVisible = trigger === T.enter;
    var cards = conditionSectionEl.querySelectorAll(".condition-card");
    var visibleCount = 0;
    conditionSectionEl.hidden = !(balanceVisible || gameVisible);
    Array.prototype.forEach.call(cards, function (card) {
      var rule = card.getAttribute("data-condition") || "";
      var hide = (rule.indexOf("\u4f59\u989d\u4e0d\u8db3") !== -1 || rule.indexOf("\u8fd4\u56de\u5927\u5385") !== -1) ? !balanceVisible : (rule.indexOf("\u8fdb\u5165\u6e38\u620f\u524d") !== -1 ? !gameVisible : false);
      card.hidden = hide;
      if (!hide) visibleCount += 1;
    });
    conditionSectionEl.classList.toggle("trigger-conditions--single", visibleCount <= 1);
    if (balanceVisible) {
      var isBackLobby = trigger === T.back;
      conditionCardTitleEl.textContent = isBackLobby ? "\u8bbe\u7f6e\u8fd4\u56de\u5927\u5385\u4f59\u989d" : "\u8bbe\u7f6e\u4f59\u989d\u4e0d\u8db3";
      balanceAmountLabelEl.textContent = isBackLobby ? "\u8fd4\u56de\u5927\u5385\u4f59\u989d" : "\u4f59\u989d\u4e0d\u8db3";
      balanceSubTypeLabelEl.textContent = isBackLobby ? "\u8fd4\u56de\u5927\u5385\u5f39\u7a97\u5b50\u7c7b\u578b" : "\u4f59\u989d\u4e0d\u8db3\u5f39\u7a97\u5b50\u7c7b\u578b";
    }
  }

  function imageBlockTemplate(block, index) {
    var showConfigBox = block.jumpType !== "\u65e0";
    var showInnerType = block.jumpType === "\u5185\u94fe";
    var isSystemPopup = block.jumpType === "\u5185\u94fe" && block.innerType === "\u5f39\u7a97";
    var targetLabel = block.jumpType === "\u5916\u94fe" ? "\u5916\u90e8\u94fe\u63a5" : isSystemPopup ? "\u7cfb\u7edf\u529f\u80fd" : "\u8df3\u8f6c\u94fe\u63a5";
    var targetTip = block.jumpType === "\u5916\u94fe" ? "\u8bf7\u8f93\u5165\u5b8c\u6574 URL\uff0c\u5982 https://promo.example.com" : "";
    var internalSelected = hasOption(INTERNAL_LINK_OPTIONS, block.target) ? block.target : "";
    return [
      '<div class="image-item" data-image-index="' + index + '">',
      '<div class="upload-preview"><div class="preview-thumb"></div><div class="upload-actions"><div class="upload-buttons">',
      '<button class="mini-btn select" type="button">\u9009\u62e9\u6587\u4ef6</button>',
      '<button class="mini-btn upload" type="button">\u5f00\u59cb\u4e0a\u4f20</button>',
      "</div><div class=\"upload-note\">\u652f\u6301\u683c\u5f0f\uff1ajpg\u3001png\uff0c\u5355\u4e2a\u6587\u4ef6\u4e0d\u8d85\u8fc71MB\uff0c\u5c3a\u5bf8\u5efa\u8bae350x120\u50cf\u7d20</div></div></div>",
      '<div class="jump-side"><div class="jump-line jump-type-line"><span>\u8df3\u8f6c\u7c7b\u578b</span><div class="jump-choice-group">',
      '<label><input type="radio" name="jumpType' + index + '" value="\u5185\u94fe"' + (block.jumpType === "\u5185\u94fe" ? " checked" : "") + '>\u5185\u94fe</label>',
      '<label><input type="radio" name="jumpType' + index + '" value="\u5916\u94fe"' + (block.jumpType === "\u5916\u94fe" ? " checked" : "") + '>\u5916\u94fe</label>',
      '<label><input type="radio" name="jumpType' + index + '" value="\u65e0"' + (block.jumpType === "\u65e0" ? " checked" : "") + '>\u65e0</label></div></div>',
      '<div class="jump-config-box"' + (showConfigBox ? "" : ' hidden') + '>',
      '<div class="jump-line inner-type-line"' + (showInnerType ? "" : ' hidden') + '><span>\u5185\u94fe\u8df3\u8f6c</span><div class="jump-choice-group">',
      '<label><input type="radio" name="innerType' + index + '" data-inner-type value="\u5f39\u7a97"' + (block.innerType === "\u5f39\u7a97" ? " checked" : "") + '>\u7cfb\u7edf\u529f\u80fd\u5f39\u7a97</label>',
      '<label><input type="radio" name="innerType' + index + '" data-inner-type value="\u5185\u90e8\u94fe\u63a5"' + (block.innerType === "\u5185\u90e8\u94fe\u63a5" ? " checked" : "") + '>\u5185\u90e8\u94fe\u63a5</label></div></div>',
      '<div class="jump-line target-line"' + (showConfigBox ? "" : ' hidden') + '><span>' + targetLabel + '</span><div class="link-picker jump-link-picker">',
      block.jumpType === "\u5916\u94fe" ? '<input class="long-input" data-target-input type="text" value="' + esc(block.target || "") + '" placeholder="\u8bf7\u8f93\u5165\u5916\u90e8\u94fe\u63a5">' : isSystemPopup ? '<select class="link-select" data-target-select aria-label="\u7cfb\u7edf\u529f\u80fd\u5f39\u7a97">' + renderOptions(SYSTEM_POPUP_OPTIONS, block.target || SYSTEM_POPUP_OPTIONS[0].value) + '</select>' : '<select class="link-select" data-target-select aria-label="\u56fa\u5b9a\u5185\u94fe">' + renderOptions(INTERNAL_LINK_OPTIONS, internalSelected) + '</select><input class="long-input" data-target-input type="text" value="' + esc(block.target || "") + '" placeholder="\u8bf7\u8f93\u5165\u7ad9\u5185\u8def\u5f84">',
      '</div></div>',
      '<p class="field-tip jump-field-tip"' + (showConfigBox && targetTip ? "" : ' hidden') + ">" + targetTip + "</p></div></div></div>"
    ].join("");
  }

  function renderImageBlocks() { imageListEl.innerHTML = state.imageBlocks.map(function (block, index) { return imageBlockTemplate(block, index); }).join(""); }
  function resetImageBlocks() { state.imageBlocks = cloneBlocks(DEFAULT_IMAGE_BLOCKS); }
  function getRowJumpMeta(block) {
    if (!block || block.jumpType === "\u65e0") {
      return { type: "\u65e0", link: "-" };
    }
    if (block.jumpType === "\u5916\u94fe") {
      return { type: "\u5916\u94fe", link: block.target || "-" };
    }
    if (block.innerType === "\u5f39\u7a97") {
      return { type: "\u529f\u80fd\u5f39\u7a97", link: block.target || SYSTEM_POPUP_OPTIONS[0].value };
    }
    return { type: "\u5185\u94fe", link: block.target || "-" };
  }

  function openModal(item) {
    state.editingId = item ? item.id : null;
    modalTitleEl.textContent = item ? "\u7f16\u8f91\u5f39\u7a97" : "\u6dfb\u52a0\u5f39\u7a97";
    document.getElementById("formName").value = item ? item.name : "";
    formTriggerEl.value = item ? item.trigger : T.reg;
    document.getElementById("popupTitle").value = item ? item.name + "\u6807\u9898" : "";
    document.getElementById("formSort").value = item ? String(getSortValue(item)) : "1";
    document.getElementById("buttonText").value = "";
    Array.prototype.forEach.call(document.querySelectorAll('input[name="terminal"]'), function (input) {
      input.checked = item ? String(item.platform || "").indexOf(input.value) !== -1 : input.value === "APP";
    });
    document.getElementById("startTime").value = item ? item.startTime : "2026-06-30 00:00:00";
    longTermEl.checked = !!item && item.endTime.indexOf("2026-12-31") === 0;
    endTimeEl.disabled = longTermEl.checked;
    endTimeEl.value = item ? item.endTime : "2026-12-31 23:59:59";
    channelVisibilityEl.value = item ? (item.channelVisibility || (item.trigger === T.guest ? "\u4e0d\u9650\u5236" : "\u4ec5\u6e20\u9053\u53ef\u89c1")) : "\u4ec5\u6e20\u9053\u53ef\u89c1";
    channelNamesEl.value = item ? (item.channelNames || "") : "";
    deliveryModeEl.value = item ? (item.deliveryMode || "\u72ec\u7acb\u6295\u653e\u5e76\u5141\u8bb8\u65b9\u6848\u5f15\u7528") : "\u72ec\u7acb\u6295\u653e\u5e76\u5141\u8bb8\u65b9\u6848\u5f15\u7528";
    planRequestCapabilityEl.value = item ? (item.planRequestCapability || "\u4ec5\u767b\u8bb0\u8d44\u683c\uff0c\u7b49\u5f85\u539f\u573a\u666f") : "\u4ec5\u767b\u8bb0\u8d44\u683c\uff0c\u7b49\u5f85\u539f\u573a\u666f";
    popupVersionEl.value = item ? (item.version || "v1") : "v1";
    popupPriorityEl.value = item ? (item.priority || 80) : 80;
    popupMutexEl.value = item ? (item.mutex || "\u65e0\u4e92\u65a5\u7ec4") : "\u65e0\u4e92\u65a5\u7ec4";
    sessionCapEl.value = item ? (item.sessionCap || 1) : 1;
    dailyCapEl.value = item ? (item.dailyCap || 1) : 1;
    popupCooldownEl.value = item ? (item.cooldown || "12\u5c0f\u65f6") : "12\u5c0f\u65f6";
    testMembersEl.value = item ? (item.testMembers || "") : "";
    popupPlanRefsEl.textContent = item && item.planRefs ? item.planRefs : "\u6682\u65e0\u8fd0\u884c\u4e2d\u65b9\u6848\u5f15\u7528";
    var weekdays = item && item.weekdays ? item.weekdays : ["\u5468\u4e00", "\u5468\u4e8c", "\u5468\u4e09", "\u5468\u56db", "\u5468\u4e94", "\u5468\u516d", "\u5468\u65e5"];
    Array.prototype.forEach.call(document.querySelectorAll('input[name="weekday"]'), function (input) { input.checked = weekdays.indexOf(input.value) !== -1; });
    document.getElementById("balanceAmount").value = item ? (item.balanceAmount || 1) : 1;
    setCheckedValue("balanceSubType", item ? (item.balanceSubType || "\u9996\u5145\u672a\u5b8c\u6210") : "\u9996\u5145\u672a\u5b8c\u6210");
    document.getElementById("gameChargeCountMode").value = item ? (item.gameChargeCountMode || "\u4e0d\u9650\u5236") : "\u4e0d\u9650\u5236";
    document.getElementById("gameChargeCount").value = item ? (item.gameChargeCount || 1) : 1;
    document.getElementById("gameChargeAmountMode").value = item ? (item.gameChargeAmountMode || "\u4e0d\u9650\u5236") : "\u4e0d\u9650\u5236";
    document.getElementById("gameChargeAmount").value = item ? (item.gameChargeAmount || 1) : 1;
    setSwitch(statusSwitchEl, !item || item.status === T.on);
    resetImageBlocks();
    if (item && state.imageBlocks[0]) {
      state.imageBlocks[0].jumpType = item.jumpType === "\u5916\u94fe" ? "\u5916\u94fe" : item.jumpType === "\u65e0" ? "\u65e0" : "\u5185\u94fe";
      state.imageBlocks[0].innerType = item.jumpType === "\u529f\u80fd\u5f39\u7a97" ? "\u5f39\u7a97" : "\u5185\u90e8\u94fe\u63a5";
      state.imageBlocks[0].target = item.jumpLink === "-" ? "" : item.jumpLink;
    }
    renderImageBlocks(); renderTips(formTriggerEl.value); renderChannelState(); renderPlanCapabilityState(); renderButtonTextState(); renderConditions(formTriggerEl.value);
    modalEl.hidden = false;
  }

  function closeModal() { modalEl.hidden = true; }

  document.getElementById("searchBtn").addEventListener("click", applyFilters);
  document.getElementById("resetBtn").addEventListener("click", function () { ["popupKeyword","popupTrigger","popupTerminal","popupStatus"].forEach(function (id) { document.getElementById(id).value = ""; }); state.rows = POPUPS.slice(); renderTable(state.rows); });
  document.getElementById("addBtn").addEventListener("click", function () { openModal(null); });

  rowsEl.addEventListener("click", function (event) {
    var s = event.target.closest("[data-status-toggle]");
    var e = event.target.closest("[data-edit]");
    var d = event.target.closest("[data-delete]");
    if (s) {
      var statusId = s.getAttribute("data-status-toggle");
      var current = getPopupById(statusId);
      if (current) openStatusConfirm(statusId, current.status === T.on ? T.off : T.on);
      return;
    }
    if (e) { openModal(getPopupById(e.getAttribute("data-edit"))); return; }
    if (d) { var id = d.getAttribute("data-delete"); var next = POPUPS.filter(function (item) { return item.id !== id; }); POPUPS.length = 0; Array.prototype.push.apply(POPUPS, next); applyFilters(); }
  });

  imageListEl.addEventListener("change", function (event) {
    var itemEl = event.target.closest(".image-item");
    if (!itemEl) return;
    var index = Number(itemEl.getAttribute("data-image-index"));
    var block = state.imageBlocks[index];
    if (!block) return;

    if (event.target.name === "jumpType" + index) {
      block.jumpType = event.target.value;
      if (block.jumpType === "\u5185\u94fe" && block.innerType !== "\u5f39\u7a97" && block.innerType !== "\u5185\u90e8\u94fe\u63a5") {
        block.innerType = "\u5f39\u7a97";
      }
      if (block.jumpType === "\u5916\u94fe" && (!block.target || block.target.indexOf("http") !== 0)) {
        block.target = "https://promo.example.com";
      }
      if (block.jumpType === "\u5185\u94fe" && block.innerType === "\u5f39\u7a97" && !hasOption(SYSTEM_POPUP_OPTIONS, block.target)) {
        block.target = SYSTEM_POPUP_OPTIONS[0].value;
      }
      if (block.jumpType === "\u5185\u94fe" && block.innerType === "\u5185\u90e8\u94fe\u63a5" && (!block.target || block.target.indexOf("http") === 0 || hasOption(SYSTEM_POPUP_OPTIONS, block.target))) {
        block.target = "/activity";
      }
      renderImageBlocks();
      return;
    }

    if (event.target.matches("[data-inner-type]")) {
      block.innerType = event.target.value;
      if (block.innerType === "\u5185\u90e8\u94fe\u63a5" && (!block.target || block.target.indexOf("http") === 0 || hasOption(SYSTEM_POPUP_OPTIONS, block.target))) {
        block.target = "/activity";
      }
      if (block.innerType === "\u5f39\u7a97" && (!block.target || block.target.indexOf("/") === 0 || block.target.indexOf("http") === 0 || !hasOption(SYSTEM_POPUP_OPTIONS, block.target))) {
        block.target = SYSTEM_POPUP_OPTIONS[0].value;
      }
      renderImageBlocks();
      return;
    }

    if (event.target.matches("[data-target-select]")) {
      block.target = event.target.value || "";
      renderImageBlocks();
      return;
    }
  });

  imageListEl.addEventListener("input", function (event) {
    var itemEl = event.target.closest(".image-item");
    if (!itemEl) return;
    var index = Number(itemEl.getAttribute("data-image-index"));
    var block = state.imageBlocks[index];
    if (!block) return;

    if (event.target.matches("[data-target-input]")) {
      block.target = event.target.value;
    }
  });

  document.addEventListener("click", function (event) {
    if (event.target.matches("[data-close]")) { closeModal(); return; }
    if (event.target === modalEl) { closeModal(); return; }
    if (event.target === statusConfirmModalEl) { closeStatusConfirm(); return; }
    var sw = event.target.closest(".switch");
    if (sw) {
      setSwitch(sw, !sw.classList.contains("on"));
      return;
    }
  });
  document.getElementById("statusConfirmClose").addEventListener("click", closeStatusConfirm);
  document.getElementById("statusConfirmCancel").addEventListener("click", closeStatusConfirm);
  document.getElementById("statusConfirmSubmit").addEventListener("click", submitStatusConfirm);
  var trackingModalEl = document.getElementById("popupTrackingModal");
  document.getElementById("trackingBtn").addEventListener("click", function () { trackingModalEl.hidden = false; });
  Array.prototype.forEach.call(document.querySelectorAll("[data-tracking-close]"), function (button) {
    button.addEventListener("click", function () { trackingModalEl.hidden = true; });
  });
  trackingModalEl.addEventListener("click", function (event) {
    if (event.target === trackingModalEl) trackingModalEl.hidden = true;
  });
  formTriggerEl.addEventListener("change", function () { renderTips(formTriggerEl.value); renderConditions(formTriggerEl.value); });
  deliveryModeEl.addEventListener("change", renderPlanCapabilityState);
  Array.prototype.forEach.call(document.querySelectorAll('input[name="hasButton"]'), function (radio) { radio.addEventListener("change", renderButtonTextState); });
  channelVisibilityEl.addEventListener("change", renderChannelState);
  longTermEl.addEventListener("change", function () { endTimeEl.disabled = longTermEl.checked; endTimeEl.value = longTermEl.checked ? "\u957f\u671f\u6709\u6548" : "2026-12-31 23:59:59"; });
  document.getElementById("addImageBtn").addEventListener("click", function () { state.imageBlocks.push({ jumpType: "\u5185\u94fe", innerType: "\u5f39\u7a97", target: SYSTEM_POPUP_OPTIONS[0].value }); renderImageBlocks(); });
  document.getElementById("saveBtn").addEventListener("click", function () {
    var sortOrder = Number(document.getElementById("formSort").value) || 1;
    var primaryBlock = state.imageBlocks[0] || DEFAULT_IMAGE_BLOCKS[0];
    var jumpMeta = getRowJumpMeta(primaryBlock);
    var previous = state.editingId ? getPopupById(state.editingId) : null;
    var allowsPlan = deliveryModeEl.value !== "\u4ec5\u72ec\u7acb\u6295\u653e";
    var item = {
      id: state.editingId || String(Date.now()).slice(-9),
      name: document.getElementById("formName").value || "\u65b0\u5f39\u7a97\u914d\u7f6e",
      version: previous ? nextVersion(previous.version || "v1") : "v1",
      refs: allowsPlan ? "0\u4e2a\u65b9\u6848" : "\u72ec\u7acb\u6295\u653e",
      planRefs: "",
      metrics: previous ? (previous.metrics || "0 / 0") : "0 / 0",
      sortOrder: sortOrder,
      imageTheme: previous ? previous.imageTheme : (state.imageBlocks.length % 2 === 0 ? "light" : "purple"),
      platform: getSelectedPlatforms().join(",") || "APP",
      trigger: formTriggerEl.value,
      deliveryMode: deliveryModeEl.value,
      planRequestCapability: planRequestCapabilityEl.value,
      priority: Number(popupPriorityEl.value) || 80,
      mutex: popupMutexEl.value,
      sessionCap: Number(sessionCapEl.value) || 1,
      dailyCap: Number(dailyCapEl.value) || 1,
      cooldown: popupCooldownEl.value,
      testMembers: testMembersEl.value.trim(),
      channelVisibility: channelVisibilityEl.value,
      channelNames: channelNamesEl.value.trim(),
      weekdays: Array.prototype.slice.call(document.querySelectorAll('input[name="weekday"]:checked')).map(function (input) { return input.value; }),
      balanceAmount: Number(document.getElementById("balanceAmount").value) || 0,
      balanceSubType: getCheckedValue("balanceSubType", "\u9996\u5145\u672a\u5b8c\u6210"),
      gameChargeCountMode: document.getElementById("gameChargeCountMode").value,
      gameChargeCount: Number(document.getElementById("gameChargeCount").value) || 1,
      gameChargeAmountMode: document.getElementById("gameChargeAmountMode").value,
      gameChargeAmount: Number(document.getElementById("gameChargeAmount").value) || 0,
      jumpType: jumpMeta.type,
      jumpLink: jumpMeta.link,
      language: previous ? previous.language : "\u8bed\u8a001",
      status: statusSwitchEl.classList.contains("on") ? T.on : T.off,
      startTime: document.getElementById("startTime").value,
      endTime: longTermEl.checked ? "2026-12-31 23:59:59" : endTimeEl.value,
      createdTime: previous ? previous.createdTime : "2026-06-30 14:30:00"
    };
    if (state.editingId) { for (var i = 0; i < POPUPS.length; i += 1) { if (POPUPS[i].id === state.editingId) { POPUPS[i] = item; break; } } } else { POPUPS.unshift(item); }
    applyFilters(); closeModal();
  });

  renderTable(state.rows); renderImageBlocks(); renderTips(formTriggerEl.value); renderChannelState(); renderPlanCapabilityState(); renderButtonTextState(); renderConditions(formTriggerEl.value);
})();
