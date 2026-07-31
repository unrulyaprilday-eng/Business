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
    marketing: "auto_marketing",
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
  TRIGGER_LABEL[T.marketing] = "\u81ea\u52a8\u8425\u9500\u89e6\u53d1";

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
  TIP[T.marketing] = { p: "\u7531\u81ea\u52a8\u8425\u9500\u7b56\u7565\u547d\u4e2d\u73a9\u5bb6\u540e\u8c03\u7528\u5f39\u7a97\u89e6\u53d1\u63a5\u53e3\u3002", s: "\u89e6\u53d1\u65f6\u4f7f\u7528\u5f39\u7a97 ID \u548c\u6807\u51c6\u89e6\u53d1\u7f16\u7801\uff0c\u5c55\u793a\u4ecd\u6267\u884c\u672c\u5f39\u7a97\u7684\u6709\u6548\u671f\u548c\u72b6\u6001\u89c4\u5219\u3002" };

  var POPUPS = [
    { id: "202610001", name: "\u65b0\u4eba\u9996\u767b\u793c\u5305", refs: "2\u4e2a\u65b9\u6848", planRefs: "\u65b0\u4eba\u9996\u5145\u8f6c\u5316 v6\u3001\u6ce8\u518c\u672a\u9996\u5145\u81ea\u52a8\u57f9\u80b2 v2", todayExposure: 8642, todayClicks: 1286, sortOrder: 1, imageTheme: "light", platform: "APP", trigger: T.reg, jumpType: "\u5916\u94fe", jumpLink: "https://gift.example.com", language: "\u8bed\u8a001", status: T.on, startTime: "2026-06-30 00:00:00", endTime: "2026-07-30 23:59:59", createdTime: "2026-06-28 10:21:16" },
    { id: "202610004", name: "\u6bcf\u65e5\u9996\u767b\u7b7e\u5230\u63d0\u9192", todayExposure: 0, todayClicks: 0, sortOrder: 2, imageTheme: "purple", platform: "H5", trigger: T.daily, jumpType: "\u5185\u94fe", jumpLink: "\u7b7e\u5230\u4e2d\u5fc3", language: "\u8bed\u8a002", status: T.on, startTime: "2026-06-29 00:00:00", endTime: "2026-09-30 23:59:59", createdTime: "2026-06-24 09:16:31" },
    { id: "202610002", name: "\u4f59\u989d\u8865\u8d34\u63d0\u793a", todayExposure: 0, todayClicks: 0, sortOrder: 3, imageTheme: "purple", platform: "H5", trigger: T.low, jumpType: "\u5185\u94fe", jumpLink: "\u5145\u503c\u4e2d\u5fc3", language: "\u8bed\u8a001", status: T.on, startTime: "2026-06-30 00:00:00", endTime: "2026-08-31 23:59:59", createdTime: "2026-06-27 16:35:22" },
    { id: "202610003", name: "\u56de\u5385\u518d\u51b2\u793c\u5305", todayExposure: 0, todayClicks: 0, sortOrder: 4, imageTheme: "light", platform: "APP,H5", trigger: T.back, jumpType: "\u5185\u94fe", jumpLink: "\u5145\u503c\u4e2d\u5fc3", language: "\u8bed\u8a001", status: T.off, startTime: "2026-06-26 12:00:00", endTime: "2026-12-31 23:59:59", createdTime: "2026-06-25 14:08:53" }
  ];

  var SYSTEM_POPUP_OPTIONS = [
    { value: "\u5145\u503c", label: "\u5145\u503c" },
    { value: "\u63d0\u73b0", label: "\u63d0\u73b0" },
    { value: "\u5b89\u88c5PWA", label: "\u5b89\u88c5 PWA" },
    { value: "\u5151\u6362\u7801", label: "\u5151\u6362\u7801" }
  ];

  var ENABLED_ANNOUNCEMENTS = [
    { id: "aae327c9-6a27-49ee-9010-7eec062013c9", title: "\u6d4b\u8bd5", endTime: "2026-11-08 00:00" },
    { id: "6a2ec8c2-bd0f-47d5-a5df-1ad5e3e1f355", title: "\u6d4b\u8bd5\u516c\u544a", endTime: "2026-09-20 00:00" }
  ];

  var INTERNAL_LINK_OPTIONS = [
    { value: "\u5145\u503c\u4e2d\u5fc3", label: "\u5145\u503c\u4e2d\u5fc3" },
    { value: "\u6d3b\u52a8\u4e2d\u5fc3", label: "\u6d3b\u52a8\u4e2d\u5fc3" },
    { value: "/activity", label: "\u6d3b\u52a8 /activity" },
    { value: "/vip", label: "VIP /vip" },
    { value: "", label: "\u81ea\u5b9a\u4e49" }
  ];

  var DEFAULT_IMAGE_BLOCKS = [
    { jumpType: "\u5185\u94fe", target: "/activity", directChargeActivityId: "dca_001" }
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
  var balanceSubTypeFieldEl = document.getElementById("balanceSubTypeField");
  var lobbyChargeCountFieldEl = document.getElementById("lobbyChargeCountField");
  var lobbyChargeCountModeEl = document.getElementById("lobbyChargeCountMode");
  var lobbyChargeCountEl = document.getElementById("lobbyChargeCount");
  var statusSwitchEl = document.getElementById("statusSwitch");
  var statusConfirmModalEl = document.getElementById("statusConfirmModal");
  var statusConfirmTextEl = document.getElementById("statusConfirmText");
  var buttonTextFieldEl = document.getElementById("buttonTextField");
  var hasButtonEl = document.getElementById("hasButton");
  var showSkipTodayEl = document.getElementById("showSkipToday");
  var showBackdropEl = document.getElementById("showBackdrop");
  var gameChargeCountModeEl = document.getElementById("gameChargeCountMode");
  var gameChargeCountEl = document.getElementById("gameChargeCount");
  var gameChargeAmountModeEl = document.getElementById("gameChargeAmountMode");
  var gameChargeAmountEl = document.getElementById("gameChargeAmount");
  var contentPopupSectionEl = document.getElementById("contentPopupSection");
  var systemPopupSectionEl = document.getElementById("systemPopupSection");
  var directSystemPopupEl = document.getElementById("directSystemPopup");
  var announcementPickerEl = document.getElementById("announcementPicker");
  var announcementSearchEl = document.getElementById("announcementSearch");
  var announcementOptionsEl = document.getElementById("announcementOptions");
  var selectedAnnouncementIdEl = document.getElementById("selectedAnnouncementId");
  var functionSourceNoteEl = document.getElementById("functionSourceNote");

  function cloneBlocks(blocks) { return blocks.map(function (b) { return Object.assign({}, b); }); }
  function esc(v) { return String(v).replace(/[&<>\"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]; }); }
  function renderOptions(options, selected) { return options.map(function (option) { return '<option value="' + esc(option.value) + '"' + (String(selected) === String(option.value) ? " selected" : "") + '>' + esc(option.label) + "</option>"; }).join(""); }
  function hasOption(options, value) { return options.some(function (option) { return option.value === value; }); }
  function getDirectChargeActivities() {
    return window.DirectChargeActivityStore ? window.DirectChargeActivityStore.getAll() : [];
  }
  function resolveDirectChargeActivity(block) {
    var activities = getDirectChargeActivities();
    var selected = activities.filter(function (activity) { return activity.id === block.directChargeActivityId; })[0] || null;
    if (!selected && block.rechargeAmount != null) {
      selected = activities.filter(function (activity) {
        return Number(activity.rechargeAmount) === Number(block.rechargeAmount) && Number(activity.rewardAmount) === Number(block.rewardAmount);
      })[0] || null;
    }
    if (!selected) selected = activities.filter(function (activity) { return activity.status === "\u542f\u7528"; })[0] || null;
    if (selected) block.directChargeActivityId = selected.id;
    return selected;
  }
  function setSwitch(button, on) {
    button.classList.toggle("on", on);
    button.setAttribute("aria-pressed", on ? "true" : "false");
    if (button.nextElementSibling) button.nextElementSibling.textContent = on ? "\u542f\u7528" : "\u505c\u7528";
  }
  function getTriggerLabel(trigger) { return TRIGGER_LABEL[trigger] || trigger; }
  function getCheckedValue(name, fallback) { var checked = document.querySelector('input[name="' + name + '"]:checked'); return checked ? checked.value : fallback; }
  function setCheckedValue(name, value) { Array.prototype.forEach.call(document.querySelectorAll('input[name="' + name + '"]'), function (input) { input.checked = input.value === value; }); }
  function formatCount(value) { return String(Number(value) || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function getSortValue(item) { var n = Number(item && item.sortOrder); return isNaN(n) ? 999999 : n; }
  function sortRows(list) { return list.slice().sort(function (a, b) { var sa = getSortValue(a); var sb = getSortValue(b); if (sa !== sb) return sa - sb; return String(a.id).localeCompare(String(b.id)); }); }

  function renderTable(list) {
    var sortedList = sortRows(list);
    rowsEl.innerHTML = sortedList.map(function (item) {
      var exposure = Number(item.todayExposure) || 0;
      var clicks = Number(item.todayClicks) || 0;
      var clickRate = exposure > 0 ? (clicks / exposure * 100).toFixed(1) + "%" : "-";
      return [
        "<tr>",
        "<td><strong>" + esc(item.name) + "</strong><small class=\"popup-row-meta\">" + esc(item.refs || "\u6682\u65e0\u65b9\u6848\u5f15\u7528") + "</small></td>",
        "<td>" + esc(getTriggerLabel(item.trigger)) + "</td>",
        "<td>" + esc(item.platform) + "</td>",
        "<td>" + formatCount(exposure) + "</td>",
        "<td>" + formatCount(clicks) + "</td>",
        "<td>" + clickRate + "</td>",
        '<td><div class="status-switch"><button class="cl-switch-button' + (item.status === T.on ? " is-on" : "") + '" type="button" data-status-toggle="' + esc(item.id) + '" aria-pressed="' + (item.status === T.on ? "true" : "false") + '" aria-label="' + (item.status === T.on ? "\u70b9\u51fb\u5173\u95ed\u5f39\u7a97" : "\u70b9\u51fb\u5f00\u542f\u5f39\u7a97") + '"></button></div></td>',
        "<td><span class=\"effective-time\">" + esc(item.startTime) + "<small>\u81f3 " + esc(item.endTime) + "</small></span></td>",
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
    if (!buttonTextFieldEl) return;
    buttonTextFieldEl.hidden = !hasButtonEl.checked;
  }
  function renderContentMode() {
    var mode = getCheckedValue("contentMode", "\u914d\u7f6e\u5f39\u7a97");
    var isSystemPopup = mode === "\u529f\u80fd\u5f39\u7a97";
    systemPopupSectionEl.hidden = !isSystemPopup;
    contentPopupSectionEl.hidden = isSystemPopup;
    if (isSystemPopup) renderFunctionSource();
  }
  function getSelectedAnnouncement() {
    return ENABLED_ANNOUNCEMENTS.filter(function (item) { return item.id === selectedAnnouncementIdEl.value; })[0] || null;
  }
  function renderAnnouncementOptions(keyword) {
    var normalized = String(keyword || "").trim().toLowerCase();
    var list = ENABLED_ANNOUNCEMENTS.filter(function (item) {
      return !normalized || item.title.toLowerCase().indexOf(normalized) !== -1 || item.id.toLowerCase().indexOf(normalized) !== -1;
    });
    announcementOptionsEl.innerHTML = list.length ? list.map(function (item) {
      return '<button class="announcement-option' + (item.id === selectedAnnouncementIdEl.value ? ' is-selected' : '') + '" type="button" role="option" data-announcement-id="' + esc(item.id) + '">' + esc(item.title) + '<small>\u5f00\u542f\u4e2d \u00b7 \u6709\u6548\u671f\u81f3 ' + esc(item.endTime) + '</small></button>';
    }).join("") : '<span class="announcement-empty">\u672a\u627e\u5230\u5f00\u542f\u72b6\u6001\u7684\u6d88\u606f\u516c\u544a</span>';
    announcementOptionsEl.hidden = false;
    announcementSearchEl.setAttribute("aria-expanded", "true");
  }
  function selectAnnouncement(id) {
    var selected = ENABLED_ANNOUNCEMENTS.filter(function (item) { return item.id === id; })[0];
    if (!selected) return;
    selectedAnnouncementIdEl.value = selected.id;
    announcementSearchEl.value = selected.title;
    announcementOptionsEl.hidden = true;
    announcementSearchEl.setAttribute("aria-expanded", "false");
  }
  function renderFunctionSource() {
    var source = getCheckedValue("functionSource", "\u7cfb\u7edf\u529f\u80fd");
    var isAnnouncement = source === "\u6d88\u606f\u516c\u544a";
    directSystemPopupEl.parentElement.hidden = isAnnouncement;
    announcementPickerEl.hidden = !isAnnouncement;
    functionSourceNoteEl.textContent = isAnnouncement ? "\u4ec5\u53ef\u9009\u62e9\u5df2\u53d1\u9001\u4e14\u672a\u64a4\u56de\u7684\u6d88\u606f\u516c\u544a\uff1b\u5f39\u7a97\u5185\u5bb9\u8ddf\u968f\u516c\u544a\u66f4\u65b0\u3002" : "\u4fdd\u5b58\u540e\u89e6\u53d1\u8be5\u5f39\u7a97\u65f6\uff0c\u5c06\u76f4\u63a5\u6253\u5f00\u6240\u9009\u7cfb\u7edf\u529f\u80fd\u3002";
  }
  function renderGameChargeLimits() {
    lobbyChargeCountEl.hidden = lobbyChargeCountModeEl.value === "\u4e0d\u9650\u5236";
    gameChargeCountEl.hidden = gameChargeCountModeEl.value === "\u4e0d\u9650\u5236";
    gameChargeAmountEl.hidden = gameChargeAmountModeEl.value === "\u4e0d\u9650\u5236";
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
      balanceSubTypeLabelEl.textContent = "\u4f59\u989d\u4e0d\u8db3\u5f39\u7a97\u5b50\u7c7b\u578b";
      balanceSubTypeFieldEl.hidden = isBackLobby;
      lobbyChargeCountFieldEl.hidden = !isBackLobby;
    }
  }

  function popupActionTemplate(block, index) {
    var showConfigBox = block.jumpType !== "\u65e0";
    var isExternal = block.jumpType === "\u5916\u94fe";
    var isInternal = block.jumpType === "\u5185\u94fe";
    var isSystemPopup = block.jumpType === "\u529f\u80fd\u5f39\u7a97";
    var isDirectCharge = block.jumpType === "\u76f4\u5145";
    var targetLabel = isExternal ? "\u5916\u90e8\u94fe\u63a5" : isInternal ? "\u5185\u94fe\u76ee\u6807" : isSystemPopup ? "\u7cfb\u7edf\u529f\u80fd" : "\u76f4\u5145\u914d\u7f6e";
    var targetTip = isExternal ? "\u8bf7\u8f93\u5165\u5b8c\u6574 URL\uff0c\u5982 https://promo.example.com" : isInternal ? "\u9009\u62e9\u56fa\u5b9a\u6a21\u5757\u540e\u81ea\u52a8\u586b\u5165\u5185\u94fe\uff0c\u4e0b\u65b9\u4e5f\u53ef\u4ee5\u624b\u52a8\u8f93\u5165\u7ad9\u5185\u8def\u5f84\u3002" : "";
    var internalSelected = hasOption(INTERNAL_LINK_OPTIONS, block.target) ? block.target : "";
    var targetControl = "";
    if (isExternal) {
      targetControl = '<input class="long-input" data-target-input type="text" value="' + esc(block.target || "") + '" placeholder="\u8bf7\u8f93\u5165\u5916\u90e8\u94fe\u63a5">';
    } else if (isInternal) {
      targetControl = '<select class="link-select" data-target-select aria-label="\u56fa\u5b9a\u5185\u94fe">' + renderOptions(INTERNAL_LINK_OPTIONS, internalSelected) + '</select><input class="long-input" data-target-input type="text" value="' + esc(block.target || "") + '" placeholder="\u8bf7\u8f93\u5165\u7ad9\u5185\u8def\u5f84">';
    } else if (isSystemPopup) {
      targetControl = '<select class="link-select" data-target-select aria-label="\u7cfb\u7edf\u529f\u80fd\u5f39\u7a97">' + renderOptions(SYSTEM_POPUP_OPTIONS, block.target || SYSTEM_POPUP_OPTIONS[0].value) + '</select>';
    } else if (isDirectCharge) {
      var directChargeActivity = resolveDirectChargeActivity(block);
      var directChargeOptions = getDirectChargeActivities().filter(function (activity) { return activity.status === "\u542f\u7528" || (directChargeActivity && activity.id === directChargeActivity.id); });
      var activityOptionsHtml = directChargeOptions.length ? directChargeOptions.map(function (activity) {
        return '<option value="' + esc(activity.id) + '"' + (directChargeActivity && activity.id === directChargeActivity.id ? " selected" : "") + '>' + esc(activity.name) + "</option>";
      }).join("") : '<option value="">\u6682\u65e0\u53ef\u7528\u6d3b\u52a8</option>';
      targetControl = [
        '<div class="direct-charge-template">',
        '<div class="direct-charge-template-head"><label><span>\u6d3b\u52a8\u540d</span><select data-direct-charge-activity>' + activityOptionsHtml + '</select></label><a href="\u76f4\u5145\u6d3b\u52a8\u914d\u7f6e.html">\u7ba1\u7406\u6d3b\u52a8\u6a21\u677f</a></div>',
        '<div class="direct-charge-fields">',
        '<label><span>\u6e20\u9053</span><input type="text" value="' + esc(directChargeActivity ? directChargeActivity.channel : "-") + '" readonly></label>',
        '<label><span>\u5145\u503c\u91d1\u989d</span><input type="text" value="' + esc(directChargeActivity && window.DirectChargeActivityStore ? window.DirectChargeActivityStore.formatAmount(directChargeActivity.rechargeAmount) : "-") + '" readonly></label>',
        '<label><span>\u5956\u52b1\u7c7b\u578b</span><input type="text" value="' + esc(directChargeActivity ? directChargeActivity.rewardType : "-") + '" readonly></label>',
        '<label><span>\u8d60\u9001\u91d1\u989d</span><input type="text" value="' + esc(directChargeActivity && window.DirectChargeActivityStore ? window.DirectChargeActivityStore.formatAmount(directChargeActivity.rewardAmount) : "-") + '" readonly></label>',
        "</div></div>"
      ].join("");
    }
    return [
      '<div class="jump-side"><div class="jump-line jump-type-line"><span>\u52a8\u4f5c\u7c7b\u578b</span><div class="jump-choice-group">',
      '<label><input type="radio" name="imageActionType' + index + '" value="\u5185\u94fe"' + (block.jumpType === "\u5185\u94fe" ? " checked" : "") + '>\u5185\u94fe</label>',
      '<label><input type="radio" name="imageActionType' + index + '" value="\u5916\u94fe"' + (block.jumpType === "\u5916\u94fe" ? " checked" : "") + '>\u5916\u94fe</label>',
      '<label><input type="radio" name="imageActionType' + index + '" value="\u529f\u80fd\u5f39\u7a97"' + (block.jumpType === "\u529f\u80fd\u5f39\u7a97" ? " checked" : "") + '>\u529f\u80fd\u5f39\u7a97</label>',
      '<label><input type="radio" name="imageActionType' + index + '" value="\u76f4\u5145"' + (block.jumpType === "\u76f4\u5145" ? " checked" : "") + '>\u76f4\u5145</label>',
      '<label><input type="radio" name="imageActionType' + index + '" value="\u65e0"' + (block.jumpType === "\u65e0" ? " checked" : "") + '>\u65e0</label></div></div>',
      '<div class="jump-config-box"' + (showConfigBox ? "" : ' hidden') + '>',
      '<div class="jump-line target-line"' + (showConfigBox ? "" : ' hidden') + '><span>' + targetLabel + '</span><div class="link-picker jump-link-picker">',
      targetControl,
      '</div></div>',
      '<p class="field-tip jump-field-tip"' + (showConfigBox && targetTip ? "" : ' hidden') + ">" + targetTip + "</p></div></div>"
    ].join("");
  }

  function imageBlockTemplate(block, index) {
    return [
      '<div class="image-item image-upload-item" data-image-index="' + index + '">',
      '<div class="upload-preview"><div class="preview-thumb"></div><div class="upload-actions"><div class="upload-buttons">',
      '<button class="mini-btn select" type="button">\u9009\u62e9\u6587\u4ef6</button>',
      '<button class="mini-btn upload" type="button">\u5f00\u59cb\u4e0a\u4f20</button>',
      "</div><div class=\"upload-note\">\u652f\u6301 jpg\u3001png\uff0c\u5355\u4e2a\u6587\u4ef6\u4e0d\u8d85\u8fc7 1MB\uff0c\u5efa\u8bae 350x120 \u50cf\u7d20</div></div></div>",
      popupActionTemplate(block, index),
      index > 0 ? '<button class="image-remove-btn" type="button" data-remove-image title="\u5220\u9664\u56fe\u7247" aria-label="\u5220\u9664\u56fe\u7247">&times;</button>' : "",
      "</div>"
    ].join("");
  }

  function renderImageBlocks() {
    imageListEl.innerHTML = state.imageBlocks.map(function (block, index) { return imageBlockTemplate(block, index); }).join("");
  }
  function resetImageBlocks() {
    state.imageBlocks = cloneBlocks(DEFAULT_IMAGE_BLOCKS);
  }
  function getRowJumpMeta(block) {
    if (!block || block.jumpType === "\u65e0") {
      return { type: "\u65e0", link: "-" };
    }
    if (block.jumpType === "\u5916\u94fe") {
      return { type: "\u5916\u94fe", link: block.target || "-" };
    }
    if (block.jumpType === "\u529f\u80fd\u5f39\u7a97") {
      return { type: "\u529f\u80fd\u5f39\u7a97", link: block.target || SYSTEM_POPUP_OPTIONS[0].value };
    }
    if (block.jumpType === "\u76f4\u5145") {
      var activity = resolveDirectChargeActivity(block);
      return { type: "\u76f4\u5145", link: activity ? activity.name : "-" };
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
    hasButtonEl.checked = !item || item.hasButton !== false;
    document.getElementById("buttonText").value = item ? (item.buttonText || "") : "";
    showSkipTodayEl.checked = !item || item.showSkipToday !== false;
    showBackdropEl.checked = !item || item.showBackdrop !== false;
    Array.prototype.forEach.call(document.querySelectorAll('input[name="terminal"]'), function (input) {
      input.checked = item ? String(item.platform || "").indexOf(input.value) !== -1 : input.value === "APP";
    });
    document.getElementById("startTime").value = item ? item.startTime : "2026-06-30 00:00:00";
    longTermEl.checked = !!item && item.endTime.indexOf("2026-12-31") === 0;
    endTimeEl.disabled = longTermEl.checked;
    endTimeEl.value = item ? item.endTime : "2026-12-31 23:59:59";
    channelVisibilityEl.value = item ? (item.channelVisibility || (item.trigger === T.guest ? "\u4e0d\u9650\u5236" : "\u4ec5\u6e20\u9053\u53ef\u89c1")) : "\u4ec5\u6e20\u9053\u53ef\u89c1";
    channelNamesEl.value = item ? (item.channelNames || "") : "";
    document.getElementById("balanceAmount").value = item ? (item.balanceAmount || 1) : 1;
    setCheckedValue("balanceSubType", item ? (item.balanceSubType || "\u9996\u5145\u672a\u5b8c\u6210") : "\u9996\u5145\u672a\u5b8c\u6210");
    lobbyChargeCountModeEl.value = item ? (item.lobbyChargeCountMode || "\u4e0d\u9650\u5236") : "\u4e0d\u9650\u5236";
    lobbyChargeCountEl.value = item ? (item.lobbyChargeCount || 1) : 1;
    gameChargeCountModeEl.value = item ? (item.gameChargeCountMode || "\u4e0d\u9650\u5236") : "\u4e0d\u9650\u5236";
    gameChargeCountEl.value = item ? (item.gameChargeCount || 1) : 1;
    gameChargeAmountModeEl.value = item ? (item.gameChargeAmountMode || "\u4e0d\u9650\u5236") : "\u4e0d\u9650\u5236";
    gameChargeAmountEl.value = item ? (item.gameChargeAmount || 1) : 1;
    renderGameChargeLimits();
    setCheckedValue("contentMode", item ? (item.contentMode || "\u914d\u7f6e\u5f39\u7a97") : "\u914d\u7f6e\u5f39\u7a97");
    setCheckedValue("functionSource", item ? (item.functionSource || "\u7cfb\u7edf\u529f\u80fd") : "\u7cfb\u7edf\u529f\u80fd");
    directSystemPopupEl.value = item && hasOption(SYSTEM_POPUP_OPTIONS, item.systemPopupTarget) ? item.systemPopupTarget : SYSTEM_POPUP_OPTIONS[0].value;
    selectedAnnouncementIdEl.value = item ? (item.announcementId || "") : "";
    announcementSearchEl.value = item ? (item.announcementTitle || "") : "";
    setSwitch(statusSwitchEl, !item || item.status === T.on);
    resetImageBlocks();
    if (item && item.imageBlocks && item.imageBlocks.length) {
      state.imageBlocks = cloneBlocks(item.imageBlocks);
      if (item.popupAction && state.imageBlocks.length === 1 && !state.imageBlocks[0].jumpType) {
        state.imageBlocks[0] = Object.assign({}, item.popupAction);
      }
    } else if (item) {
      state.imageBlocks[0].jumpType = item.jumpType === "\u5916\u94fe" ? "\u5916\u94fe" : item.jumpType === "\u529f\u80fd\u5f39\u7a97" ? "\u529f\u80fd\u5f39\u7a97" : item.jumpType === "\u76f4\u5145" ? "\u76f4\u5145" : item.jumpType === "\u65e0" ? "\u65e0" : "\u5185\u94fe";
      state.imageBlocks[0].target = item.jumpLink === "-" ? "" : item.jumpLink;
    }
    renderImageBlocks(); renderTips(formTriggerEl.value); renderChannelState(); renderButtonTextState(); renderConditions(formTriggerEl.value); renderContentMode();
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

  imageListEl.addEventListener("click", function (event) {
    var removeButton = event.target.closest("[data-remove-image]");
    if (!removeButton) return;
    var itemEl = removeButton.closest(".image-item");
    var index = Number(itemEl.getAttribute("data-image-index"));
    if (index > 0) {
      state.imageBlocks.splice(index, 1);
      renderImageBlocks();
    }
  });

  imageListEl.addEventListener("change", function (event) {
    var itemEl = event.target.closest(".image-item");
    if (!itemEl) return;
    var index = Number(itemEl.getAttribute("data-image-index"));
    var block = state.imageBlocks[index];
    if (!block) return;
    if (event.target.name === "imageActionType" + index) {
      block.jumpType = event.target.value;
      if (block.jumpType === "\u5916\u94fe" && (!block.target || block.target.indexOf("http") !== 0)) {
        block.target = "https://promo.example.com";
      }
      if (block.jumpType === "\u529f\u80fd\u5f39\u7a97" && !hasOption(SYSTEM_POPUP_OPTIONS, block.target)) {
        block.target = SYSTEM_POPUP_OPTIONS[0].value;
      }
      if (block.jumpType === "\u5185\u94fe" && (!block.target || block.target.indexOf("http") === 0 || hasOption(SYSTEM_POPUP_OPTIONS, block.target))) {
        block.target = "/activity";
      }
      if (block.jumpType === "\u76f4\u5145") {
        var defaultActivity = getDirectChargeActivities().filter(function (activity) { return activity.status === "\u542f\u7528"; })[0];
        if (defaultActivity && !block.directChargeActivityId) block.directChargeActivityId = defaultActivity.id;
      }
      renderImageBlocks();
      return;
    }

    if (event.target.matches("[data-direct-charge-activity]")) {
      block.directChargeActivityId = event.target.value;
      renderImageBlocks();
    } else if (event.target.matches("[data-target-select]")) {
      block.target = event.target.value || "";
      renderImageBlocks();
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
      if (block.jumpType === "\u5185\u94fe") {
        var linkSelect = itemEl.querySelector("[data-target-select]");
        if (linkSelect) linkSelect.value = hasOption(INTERNAL_LINK_OPTIONS, block.target) && block.target ? block.target : "";
      }
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
  formTriggerEl.addEventListener("change", function () { renderTips(formTriggerEl.value); renderConditions(formTriggerEl.value); });
  gameChargeCountModeEl.addEventListener("change", renderGameChargeLimits);
  gameChargeAmountModeEl.addEventListener("change", renderGameChargeLimits);
  lobbyChargeCountModeEl.addEventListener("change", renderGameChargeLimits);
  hasButtonEl.addEventListener("change", renderButtonTextState);
  Array.prototype.forEach.call(document.querySelectorAll('input[name="contentMode"]'), function (radio) { radio.addEventListener("change", renderContentMode); });
  Array.prototype.forEach.call(document.querySelectorAll('input[name="functionSource"]'), function (radio) { radio.addEventListener("change", renderFunctionSource); });
  announcementSearchEl.addEventListener("focus", function () {
    var selected = getSelectedAnnouncement();
    renderAnnouncementOptions(selected && announcementSearchEl.value === selected.title ? "" : announcementSearchEl.value);
  });
  announcementSearchEl.addEventListener("input", function () { selectedAnnouncementIdEl.value = ""; renderAnnouncementOptions(announcementSearchEl.value); });
  announcementOptionsEl.addEventListener("click", function (event) {
    var option = event.target.closest("[data-announcement-id]");
    if (option) selectAnnouncement(option.getAttribute("data-announcement-id"));
  });
  document.addEventListener("click", function (event) {
    if (!announcementPickerEl.contains(event.target)) {
      announcementOptionsEl.hidden = true;
      announcementSearchEl.setAttribute("aria-expanded", "false");
    }
  });
  channelVisibilityEl.addEventListener("change", renderChannelState);
  longTermEl.addEventListener("change", function () { endTimeEl.disabled = longTermEl.checked; endTimeEl.value = longTermEl.checked ? "\u957f\u671f\u6709\u6548" : "2026-12-31 23:59:59"; });
  document.getElementById("addImageBtn").addEventListener("click", function () { state.imageBlocks.push(Object.assign({}, DEFAULT_IMAGE_BLOCKS[0])); renderImageBlocks(); });
  document.getElementById("saveBtn").addEventListener("click", function () {
    var sortOrder = Number(document.getElementById("formSort").value) || 1;
    var primaryBlock = state.imageBlocks[0] || DEFAULT_IMAGE_BLOCKS[0];
    var contentMode = getCheckedValue("contentMode", "\u914d\u7f6e\u5f39\u7a97");
    var functionSource = getCheckedValue("functionSource", "\u7cfb\u7edf\u529f\u80fd");
    var selectedAnnouncement = getSelectedAnnouncement();
    if (contentMode === "\u529f\u80fd\u5f39\u7a97" && functionSource === "\u6d88\u606f\u516c\u544a" && !selectedAnnouncement) {
      announcementSearchEl.focus();
      renderAnnouncementOptions(announcementSearchEl.value);
      return;
    }
    var jumpMeta = contentMode === "\u529f\u80fd\u5f39\u7a97" ? { type: functionSource, link: functionSource === "\u6d88\u606f\u516c\u544a" ? selectedAnnouncement.id : directSystemPopupEl.value } : getRowJumpMeta(primaryBlock);
    var previous = state.editingId ? getPopupById(state.editingId) : null;
    var item = {
      id: state.editingId || String(Date.now()).slice(-9),
      name: document.getElementById("formName").value || "\u65b0\u5f39\u7a97\u914d\u7f6e",
      refs: previous ? (previous.refs || "0\u4e2a\u65b9\u6848") : "0\u4e2a\u65b9\u6848",
      planRefs: previous ? (previous.planRefs || "") : "",
      todayExposure: previous ? (Number(previous.todayExposure) || 0) : 0,
      todayClicks: previous ? (Number(previous.todayClicks) || 0) : 0,
      sortOrder: sortOrder,
      imageTheme: previous ? previous.imageTheme : (state.imageBlocks.length % 2 === 0 ? "light" : "purple"),
      platform: getSelectedPlatforms().join(",") || "APP",
      trigger: formTriggerEl.value,
      contentMode: contentMode,
      functionSource: functionSource,
      systemPopupTarget: directSystemPopupEl.value,
      announcementId: selectedAnnouncement ? selectedAnnouncement.id : "",
      announcementTitle: selectedAnnouncement ? selectedAnnouncement.title : "",
      imageBlocks: cloneBlocks(state.imageBlocks),
      hasButton: hasButtonEl.checked,
      buttonText: document.getElementById("buttonText").value.trim(),
      showSkipToday: showSkipTodayEl.checked,
      showBackdrop: showBackdropEl.checked,
      channelVisibility: channelVisibilityEl.value,
      channelNames: channelNamesEl.value.trim(),
      balanceAmount: Number(document.getElementById("balanceAmount").value) || 0,
      balanceSubType: getCheckedValue("balanceSubType", "\u9996\u5145\u672a\u5b8c\u6210"),
      lobbyChargeCountMode: lobbyChargeCountModeEl.value,
      lobbyChargeCount: Number(lobbyChargeCountEl.value) || 1,
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

  renderTable(state.rows); renderImageBlocks(); renderTips(formTriggerEl.value); renderChannelState(); renderButtonTextState(); renderConditions(formTriggerEl.value); renderGameChargeLimits(); renderContentMode();
})();
