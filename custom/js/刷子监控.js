(function () {
  var rows = [
    { type: "客户端指纹", kind: "fingerprint", value: "fp-9f4c18d2a7e6b031", playerId: "P558214", accounts: ["P558214", "P558239", "P558266", "P558291", "P558304"], count: 5, action: "限制领取优惠", created: "2026-05-23 10:24:16", updated: "2026-05-28 15:02:41" },
    { type: "设备", kind: "device", value: "4a3bb409-dc95-4d9d-ad8a-4a8fdbfe24e9", playerId: "P884201", accounts: ["P884201", "P884219", "P884238", "P884247", "P884251", "P884260", "P884281", "P884294", "P884305", "P884319", "P884332", "P884340"], count: 10, action: "限制领取优惠", created: "2026-05-22 18:05:38", updated: "2026-05-28 14:37:34" },
    { type: "设备", kind: "device", value: "b78cca14-053c-4a9d-8c97-fd6b2afbcecf", playerId: "P730112", accounts: ["P730112", "P730148", "P730173", "P730205"], count: 4, action: "限制领取优惠", created: "2026-05-22 17:08:36", updated: "2026-05-28 14:31:34" },
    { type: "IP", kind: "ip", value: "50.7.250.50", playerId: "P624918", accounts: ["P624918", "P624966"], count: 2, action: "限制提现", created: "2026-05-21 11:13:14", updated: "2026-05-28 13:40:57" },
    { type: "IP", kind: "ip", value: "45.149.92.7", playerId: "P418520", accounts: ["P418520", "P418533", "P418548", "P418561", "P418579", "P418602", "P418633", "P418641", "P418652", "P418677", "P418690", "P418704"], count: 12, action: "限制提现", created: "2026-05-22 16:58:18", updated: "2026-05-27 18:58:50" },
    { type: "设备", kind: "device", value: "450c7802536c619d24fa9af872154145", playerId: "P966351", accounts: ["P966351"], count: 1, action: "限制领取优惠", created: "2026-05-27 17:51:12", updated: "2026-05-27 17:51:12" },
    { type: "设备", kind: "device", value: "8330e27a-ad18-4b39-b511-4ca49c09a920", playerId: "P302447", accounts: ["P302447"], count: 1, action: "限制领取优惠", created: "2026-05-27 15:59:08", updated: "2026-05-27 15:59:08" },
    { type: "IP", kind: "ip", value: "154.12.53.157", playerId: "P517028", accounts: ["P517028", "P517044", "P517062", "P517091", "P517115", "P517133"], count: 6, action: "限制提现", created: "2026-05-13 16:33:27", updated: "2026-05-27 13:22:02" },
    { type: "IP", kind: "ip", value: "56.155.114.134", playerId: "P803906", accounts: ["P803906"], count: 1, action: "限制提现", created: "2026-05-22 17:08:36", updated: "2026-05-22 17:08:36" },
    { type: "IP", kind: "ip", value: "66.90.99.234", playerId: "P785013", accounts: ["P785013"], count: 1, action: "限制提现", created: "2026-05-22 14:24:16", updated: "2026-05-22 14:24:16" },
    { type: "IP", kind: "ip", value: "66.90.99.210", playerId: "P785021", accounts: ["P785021"], count: 1, action: "限制提现", created: "2026-04-24 18:33:38", updated: "2026-04-24 18:33:38" },
    { type: "设备", kind: "device", value: "25770014-3731-452f-ac0b-d187c517b175", playerId: "P112509", accounts: ["P112509"], count: 1, action: "限制领取优惠", created: "2026-04-24 17:51:52", updated: "2026-04-24 17:51:52" },
    { type: "客户端指纹", kind: "fingerprint", value: "fp-1c7b9a24e8d6053f", playerId: "P412708", accounts: ["P412708", "P412736", "P412759"], count: 3, action: "限制领取优惠", created: "2026-05-25 09:17:44", updated: "2026-05-28 11:26:18" },
    { type: "提现账号", kind: "name", value: "BANK-6222****4388", playerId: "P671204", accounts: ["P671204", "P671238", "P671259", "P671271"], count: 4, action: "冻结账户", created: "2026-05-28 16:18:09", updated: "2026-05-28 16:32:41" },
    { type: "提现账号", kind: "name", value: "PIX-maria.pay@example.com", playerId: "P520917", accounts: ["P520917", "P520944", "P520966"], count: 3, action: "冻结账户", created: "2026-05-27 19:24:36", updated: "2026-05-28 09:46:12" }
  ];

  var ipFallbacks = ["50.7.250.50", "50.7.250.106", "50.7.250.50", "45.149.92.7", "57.181.37.232", "50.7.158.235", "154.12.53.157", "56.155.114.134", "66.90.99.234", "66.90.99.210", "154.12.53.157"];
  var deviceFallbacks = [
    "4a3bb409-dc95-4d9d-ad8a-4a8fdbfe24e9",
    "b78cca14-053c-4a9d-8c97-fd6b2afbcecf",
    "ddbce991-f5f3-4be2-b5cf-a4d0a6e32190",
    "f3827459-227c-4dd2-bbb8-d91ed8c1ab56",
    "450c7802536c619d24fa9af872154145",
    "8330e27a-ad18-4b39-b511-4ca49c09a920",
    "02b5132c-6aa4-45d1-9c75-5818ae226a31",
    "d221fd4a-a2dc-4601-a96f-b8091b4c9834",
    "a4435916-c5aa-4c9f-b2d7-b3a4c0e92a19",
    "bb942f3f-636c-4d05-a5f4-12ce1a2789d5",
    "25770014-3731-452f-ac0b-d187c517b175"
  ];

  rows = rows.map(function (row, index) {
    return Object.assign({}, row, {
      ipValue: row.kind === "ip" ? row.value : ipFallbacks[index] || "",
      deviceValue: row.kind === "device" ? row.value : deviceFallbacks[index] || "",
      fingerprintValue: row.kind === "fingerprint" ? row.value : ""
    });
  });

  var defaultRules = [
    { type: "同IP", warning: 3, trigger: 4, register1d: 10, register7d: 50, scope: "只处罚超出范围账号", method: "限制提现" },
    { type: "同设备号", warning: 3, trigger: 4, register1d: 8, register7d: 40, scope: "只处罚超出范围账号", method: "限制领取优惠" },
    { type: "同客户端指纹", warning: 3, trigger: 4, register1d: 8, register7d: 40, scope: "只处罚超出范围账号", method: "限制领取优惠" },
    { type: "同提现名称", warning: 2, trigger: 3, register1d: null, register7d: null, scope: "只处罚超出范围账号", method: "冻结账户" }
  ];

  var scopeOptions = ["只处罚超出范围账号", "全部处罚"];
  var methodOptions = ["正常", "冻结账户", "限制领取优惠", "限制提现", "禁止注册"];
  var withdrawMethodOptions = ["正常", "冻结账户", "限制领取优惠", "限制提现"];
  var records = [
    { triggerUser: "123kkk", punishId: "1010010412", punishUser: "123kkk", type: "客户端指纹", kind: "fingerprint", value: "fp-9f4c18d2a7e6...", count: 8, action: "限制领取优惠", scope: "只处罚超出范围账...", operator: "system", remark: "fingerprint match", created: "2026-05-28 15:02:41", updated: "2026-05-28 15:02:41" },
    { triggerUser: "123ooo", punishId: "1010010307", punishUser: "123ooo", type: "设备", kind: "device", value: "4a3bb409-dc95-4d9...", count: 15, action: "限制领取优惠", scope: "只处罚超出范围账...", operator: "system", remark: "bot spy auto", created: "2026-05-28 15:13:31", updated: "2026-05-28 15:13:31" },
    { triggerUser: "123ooo", punishId: "1010010307", punishUser: "123ooo", type: "IP", kind: "ip", value: "50.7.250.106", count: 5, action: "限制提现", scope: "只处罚超出范围账...", operator: "system", remark: "bot spy auto", created: "2026-05-28 15:13:31", updated: "2026-05-28 15:13:31" },
    { triggerUser: "123hhh", punishId: "1010010185", punishUser: "123hhh", type: "设备", kind: "device", value: "4a3bb409-dc95-4d9...", count: 14, action: "限制领取优惠", scope: "只处罚超出范围账...", operator: "system", remark: "bot spy auto", created: "2026-05-28 15:07:05", updated: "2026-05-28 15:07:05" },
    { triggerUser: "123hhh", punishId: "1010010185", punishUser: "123hhh", type: "IP", kind: "ip", value: "50.7.250.106", count: 4, action: "限制提现", scope: "只处罚超出范围账...", operator: "system", remark: "bot spy auto", created: "2026-05-28 15:07:05", updated: "2026-05-28 15:07:05" },
    { triggerUser: "123ppp", punishId: "1010010309", punishUser: "123ppp", type: "设备", kind: "device", value: "4a3bb409-dc95-4d9...", count: 13, action: "限制领取优惠", scope: "只处罚超出范围账...", operator: "system", remark: "bot spy auto", created: "2026-05-28 14:37:34", updated: "2026-05-28 14:37:34" },
    { triggerUser: "123fff", punishId: "1010010181", punishUser: "123fff", type: "设备", kind: "device", value: "b78cca14-053c-4a9d...", count: 7, action: "限制领取优惠", scope: "只处罚超出范围账...", operator: "system", remark: "bot spy auto", created: "2026-05-28 14:31:34", updated: "2026-05-28 14:31:34" },
    { triggerUser: "aaa147", punishId: "1010010337", punishUser: "aaa147", type: "设备", kind: "device", value: "4a3bb409-dc95-4d9...", count: 12, action: "限制领取优惠", scope: "只处罚超出范围账...", operator: "system", remark: "bot spy auto", created: "2026-05-28 13:40:57", updated: "2026-05-28 13:40:57" },
    { triggerUser: "aaa147", punishId: "1010010337", punishUser: "aaa147", type: "IP", kind: "ip", value: "50.7.250.50", count: 5, action: "限制提现", scope: "只处罚超出范围账...", operator: "system", remark: "bot spy auto", created: "2026-05-28 13:40:57", updated: "2026-05-28 13:40:57" },
    { triggerUser: "123ooo", punishId: "1010010307", punishUser: "123ooo", type: "IP", kind: "ip", value: "45.149.92.7", count: 15, action: "限制提现", scope: "只处罚超出范围账...", operator: "system", remark: "bot spy auto", created: "2026-05-27 18:58:50", updated: "2026-05-27 18:58:50" },
    { triggerUser: "123jjj", punishId: "1010010186", punishUser: "123jjj", type: "设备", kind: "device", value: "4a3bb409-dc95-4d9...", count: 11, action: "限制领取优惠", scope: "只处罚超出范围账...", operator: "system", remark: "bot spy auto", created: "2026-05-27 17:58:17", updated: "2026-05-27 17:58:17" },
    { triggerUser: "123jjj", punishId: "1010010186", punishUser: "123jjj", type: "IP", kind: "ip", value: "45.149.92.7", count: 14, action: "限制提现", scope: "只处罚超出范围账...", operator: "system", remark: "bot spy auto", created: "2026-05-27 17:54:40", updated: "2026-05-27 17:54:40" },
    { triggerUser: "123mmm", punishId: "1010010455", punishUser: "123mmm", type: "客户端指纹", kind: "fingerprint", value: "fp-1c7b9a24e8d6...", count: 6, action: "限制领取优惠", scope: "只处罚超出范围账...", operator: "system", remark: "fingerprint match", created: "2026-05-27 11:26:18", updated: "2026-05-27 11:26:18" }
  ];

  var monitorRows = rows.filter(function (row) {
    return row.accounts.length > 1;
  });

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char];
    });
  }

  function displayRiskType(row) {
    return row.kind === "device" ? "设备号" : row.type;
  }

  function renderAccounts(row, index) {
    var visibleAccounts = row.accounts.slice(0, 5);
    return [
      '<div class="account-cell">',
      '<div class="account-grid">',
      visibleAccounts.map(function (account) {
        return '<span class="account-id">' + escapeHtml(account) + "</span>";
      }).join(""),
      row.accounts.length > 5
        ? '<button class="more-accounts" data-accounts="' + index + '" type="button">...</button>'
        : "",
      "</div>",
      "</div>"
    ].join("");
  }

  function renderMonitorActions(row, index) {
    var blacklistButton = "";
    if (row.kind === "ip" || row.kind === "device" || row.kind === "fingerprint") {
      var blacklistLabel = row.kind === "ip" ? "IP拉黑" : row.kind === "device" ? "设备拉黑" : "指纹拉黑";
      var blacklistKind = row.kind === "ip" ? "ip" : row.kind === "device" ? "device" : "fingerprint";
      blacklistButton = '<button class="danger-link" data-blacklist="' + blacklistKind + '" data-blacklist-row="' + index + '" type="button">' + blacklistLabel + "</button>";
    }
    return [
      '<div class="action-group">',
      blacklistButton,
      '<button class="danger-link" data-account-action="' + index + '" type="button">手动风控处罚</button>',
      "</div>"
    ].join("");
  }

  function renderRows() {
    $("#monitorRows").innerHTML = monitorRows.map(function (row, index) {
      return [
        "<tr>",
        '<td><span class="tag ' + row.kind + '">' + displayRiskType(row) + "</span></td>",
        "<td>" + escapeHtml(row.value) + "</td>",
        "<td>" + escapeHtml(row.playerId) + "</td>",
        '<td class="account-column">' + renderAccounts(row, index) + "</td>",
        "<td>" + row.accounts.length + "</td>",
        "<td>" + row.created + "</td>",
        "<td>" + row.updated + "</td>",
        "<td>" + renderMonitorActions(row, index) + "</td>",
        "</tr>"
      ].join("");
    }).join("");
  }

  function renderRecords() {
    $("#recordRows").innerHTML = records.map(function (row, index) {
      return [
        "<tr>",
        "<td></td>",
        "<td>" + row.triggerUser + "</td>",
        "<td>" + row.punishId + "</td>",
        "<td>" + row.punishUser + "</td>",
        '<td><span class="tag ' + row.kind + '">' + displayRiskType(row) + "</span></td>",
        "<td>" + row.value + "</td>",
        "<td>" + row.count + "</td>",
        "<td>" + row.action + "</td>",
        "<td>" + row.scope + "</td>",
        "<td>" + row.operator + "</td>",
        "<td>" + row.remark + "</td>",
        "<td>" + row.created + "</td>",
        "<td>" + row.updated + "</td>",
        '<td><button class="danger-link" data-manual-record="' + index + '" type="button">手动风控处罚</button></td>',
        "</tr>"
      ].join("");
    }).join("");
  }

  function updateSummary(tab) {
    var summary = $("#tableSummary");
    if (!summary) return;
    summary.textContent = tab === "records"
      ? "共 " + records.length + " 条记录"
      : "共 " + monitorRows.length + " 条记录";
  }

  function switchTab(tab) {
    $all(".tab-btn").forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-tab") === tab);
    });
    var isRecords = tab === "records";
    $("#monitorFilters").hidden = isRecords;
    $("#monitorTable").hidden = isRecords;
    $("#recordFilters").hidden = !isRecords;
    $("#recordTable").hidden = !isRecords;
    updateSummary(tab);
  }

  function numberStepper(value) {
    if (value === null || value === undefined) return '<span class="rule-empty">-</span>';
    return '<div class="number-stepper"><input value="' + value + '"/><div class="step-actions"><button type="button">＋</button><button type="button">－</button></div></div>';
  }

  function selectHtml(options, selected) {
    return '<select class="rule-select">' + options.map(function (option) {
      return '<option' + (option === selected ? " selected" : "") + ">" + option + "</option>";
    }).join("") + "</select>";
  }

  function methodOptionsFor(row) {
    return row.kind === "name" || row.type === "同提现名称" || row.type === "提现账号"
      ? withdrawMethodOptions
      : methodOptions;
  }

  function renderRules(rules) {
    $("#ruleRows").innerHTML = rules.map(function (rule) {
      return [
        "<tr>",
        "<td>" + rule.type + "</td>",
        "<td>" + numberStepper(rule.warning) + "</td>",
        "<td>" + numberStepper(rule.trigger) + "</td>",
        "<td>" + numberStepper(rule.register1d) + "</td>",
        "<td>" + numberStepper(rule.register7d) + "</td>",
        "<td>" + selectHtml(scopeOptions, rule.scope) + "</td>",
        "<td>" + selectHtml(methodOptionsFor(rule), rule.method) + "</td>",
        "</tr>"
      ].join("");
    }).join("");
  }

  function openRuleModal(title, rules) {
    $("#ruleModalTitle").textContent = title;
    renderRules(rules);
    $("#ruleModal").hidden = false;
  }

  function closeRuleModal() {
    $("#ruleModal").hidden = true;
  }

  function closeManualModal() {
    $("#manualModal").hidden = true;
  }

  function closeBlacklistModal() {
    $("#blacklistModal").hidden = true;
  }

  function defaultMethodFor(row) {
    var ruleType = row.kind === "ip" ? "同IP" : row.kind === "device" ? "同设备号" : row.kind === "fingerprint" ? "同客户端指纹" : "同提现名称";
    var rule = defaultRules.find(function (item) {
      return item.type === ruleType;
    });
    return rule ? rule.method : row.action;
  }

  function openAccountModal(title, row) {
    $("#manualModalTitle").textContent = title;
    $("#manualMethod").innerHTML = methodOptionsFor(row).map(function (option) {
      return "<option>" + option + "</option>";
    }).join("");
    $("#manualMethod").value = defaultMethodFor(row);
    $("#manualModal").hidden = false;
  }

  function openBlacklistModal(row, kind) {
    $("#blacklistModalTitle").textContent = kind === "ip" ? "IP拉黑" : kind === "device" ? "设备拉黑" : "客户端指纹拉黑";
    $("#blacklistKind").value = kind;
    $("#blacklistKind").disabled = true;
    $("#blacklistValue").value = kind === "ip" ? row.ipValue : kind === "device" ? row.deviceValue : row.fingerprintValue;
    $("#blacklistModal textarea").value = "";
    $all("#blacklistModal input[type='checkbox']").forEach(function (checkbox, index) {
      checkbox.checked = index === 0;
    });
    $("#blacklistModal").hidden = false;
  }

  function showAccounts(button) {
    var row = monitorRows[Number(button.getAttribute("data-accounts"))];
    var rect = button.getBoundingClientRect();
    var popover = $("#accountPopover");
    popover.innerHTML = '<h3>账号列表</h3><div class="account-list">' + row.accounts.map(function (id) {
      return "<span>" + escapeHtml(id) + "</span>";
    }).join("") + "</div>";
    popover.style.left = Math.min(rect.left, window.innerWidth - 320) + "px";
    popover.style.top = rect.bottom + 8 + "px";
    popover.hidden = false;
  }

  function bindEvents() {
    $("#openDefaultRules").addEventListener("click", function () {
      openRuleModal("监控处罚设置", defaultRules);
    });

    $all(".tab-btn").forEach(function (button) {
      button.addEventListener("click", function () {
        switchTab(button.getAttribute("data-tab"));
      });
    });

    $all("[data-close-modal]").forEach(function (button) {
      button.addEventListener("click", closeRuleModal);
    });

    $all("[data-close-manual]").forEach(function (button) {
      button.addEventListener("click", closeManualModal);
    });

    $all("[data-close-blacklist]").forEach(function (button) {
      button.addEventListener("click", closeBlacklistModal);
    });

    $("#ruleModal").addEventListener("click", function (event) {
      if (event.target === $("#ruleModal")) closeRuleModal();
    });

    $("#manualModal").addEventListener("click", function (event) {
      if (event.target === $("#manualModal")) closeManualModal();
    });

    $("#blacklistModal").addEventListener("click", function (event) {
      if (event.target === $("#blacklistModal")) closeBlacklistModal();
    });

    document.addEventListener("click", function (event) {
      var moreButton = event.target.closest("[data-accounts]");
      var accountActionButton = event.target.closest("[data-account-action]");
      var recordActionButton = event.target.closest("[data-manual-record]");
      var blacklistButton = event.target.closest("[data-blacklist-row]");

      if (moreButton) {
        showAccounts(moreButton);
        event.stopPropagation();
        return;
      }

      if (blacklistButton) {
        openBlacklistModal(
          monitorRows[Number(blacklistButton.getAttribute("data-blacklist-row"))],
          blacklistButton.getAttribute("data-blacklist")
        );
        return;
      }

      if (accountActionButton) {
        openAccountModal(
          "手动风控处罚",
          monitorRows[Number(accountActionButton.getAttribute("data-account-action"))]
        );
        return;
      }

      if (recordActionButton) {
        var record = records[Number(recordActionButton.getAttribute("data-manual-record"))];
        openAccountModal("手动风控处罚", {
          kind: record.kind,
          type: record.type,
          count: record.count,
          action: record.action
        });
        return;
      }

      if (!event.target.closest("#accountPopover")) {
        $("#accountPopover").hidden = true;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderRows();
    renderRecords();
    bindEvents();
    switchTab("monitor");
  });
})();
