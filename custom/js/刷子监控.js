(function () {
  var rows = [
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
    { type: "设备", kind: "device", value: "25770014-3731-452f-ac0b-d187c517b175", playerId: "P112509", accounts: ["P112509"], count: 1, action: "限制领取优惠", created: "2026-04-24 17:51:52", updated: "2026-04-24 17:51:52" }
  ];

  var defaultRules = [
    { type: "同IP", trigger: 4, limit: 100, scope: "只处罚超出范围的账号", method: "限制提现" },
    { type: "同设备号", trigger: 4, limit: 100, scope: "只处罚超出范围的账号", method: "限制领取优惠" },
    { type: "同提现名称", trigger: 2, limit: "", scope: "只处罚超出范围的账号", method: "冻结账户" }
  ];

  var scopeOptions = ["只处罚超出范围的账号", "全部处罚"];
  var methodOptions = ["正常", "冻结账户", "限制领取优惠", "限制提现", "禁止注册"];
  var records = [
    { triggerUser: "123ooo", punishId: "1010010307", punishUser: "123ooo", type: "设备", kind: "device", value: "4a3bb409-dc95-4d9...", count: 15, action: "限制领取优惠", scope: "只处罚超出范围的...", operator: "system", remark: "bot spy auto", created: "2026-05-28 15:13:31", updated: "2026-05-28 15:13:31" },
    { triggerUser: "123ooo", punishId: "1010010307", punishUser: "123ooo", type: "IP", kind: "ip", value: "50.7.250.106", count: 5, action: "限制提现", scope: "只处罚超出范围的...", operator: "system", remark: "bot spy auto", created: "2026-05-28 15:13:31", updated: "2026-05-28 15:13:31" },
    { triggerUser: "123hhh", punishId: "1010010185", punishUser: "123hhh", type: "设备", kind: "device", value: "4a3bb409-dc95-4d9...", count: 14, action: "限制领取优惠", scope: "只处罚超出范围的...", operator: "system", remark: "bot spy auto", created: "2026-05-28 15:07:05", updated: "2026-05-28 15:07:05" },
    { triggerUser: "123hhh", punishId: "1010010185", punishUser: "123hhh", type: "IP", kind: "ip", value: "50.7.250.106", count: 4, action: "限制提现", scope: "只处罚超出范围的...", operator: "system", remark: "bot spy auto", created: "2026-05-28 15:07:05", updated: "2026-05-28 15:07:05" },
    { triggerUser: "123ppp", punishId: "1010010309", punishUser: "123ppp", type: "设备", kind: "device", value: "4a3bb409-dc95-4d9...", count: 13, action: "限制领取优惠", scope: "只处罚超出范围的...", operator: "system", remark: "bot spy auto", created: "2026-05-28 14:37:34", updated: "2026-05-28 14:37:34" },
    { triggerUser: "123fff", punishId: "1010010181", punishUser: "123fff", type: "设备", kind: "device", value: "b78cca14-053c-4a9d...", count: 7, action: "限制领取优惠", scope: "只处罚超出范围的...", operator: "system", remark: "bot spy auto", created: "2026-05-28 14:31:34", updated: "2026-05-28 14:31:34" },
    { triggerUser: "aaa147", punishId: "1010010337", punishUser: "aaa147", type: "设备", kind: "device", value: "4a3bb409-dc95-4d9...", count: 12, action: "限制领取优惠", scope: "只处罚超出范围的...", operator: "system", remark: "bot spy auto", created: "2026-05-28 13:40:57", updated: "2026-05-28 13:40:57" },
    { triggerUser: "aaa147", punishId: "1010010337", punishUser: "aaa147", type: "IP", kind: "ip", value: "50.7.250.50", count: 5, action: "限制提现", scope: "只处罚超出范围的...", operator: "system", remark: "bot spy auto", created: "2026-05-28 13:40:57", updated: "2026-05-28 13:40:57" },
    { triggerUser: "123ooo", punishId: "1010010307", punishUser: "123ooo", type: "IP", kind: "ip", value: "45.149.92.7", count: 15, action: "限制提现", scope: "只处罚超出范围的...", operator: "system", remark: "bot spy auto", created: "2026-05-27 18:58:50", updated: "2026-05-27 18:58:50" },
    { triggerUser: "123jjj", punishId: "1010010186", punishUser: "123jjj", type: "设备", kind: "device", value: "4a3bb409-dc95-4d9...", count: 11, action: "限制领取优惠", scope: "只处罚超出范围的...", operator: "system", remark: "bot spy auto", created: "2026-05-27 17:58:17", updated: "2026-05-27 17:58:17" },
    { triggerUser: "123jjj", punishId: "1010010186", punishUser: "123jjj", type: "IP", kind: "ip", value: "45.149.92.7", count: 14, action: "限制提现", scope: "只处罚超出范围的...", operator: "system", remark: "bot spy auto", created: "2026-05-27 17:54:40", updated: "2026-05-27 17:54:40" }
  ];

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

  function renderAccounts(row, index) {
    var firstTen = row.accounts.slice(0, 10);
    var content = firstTen.map(function (id) {
      return '<span class="account-id">' + escapeHtml(id) + "</span>";
    }).join("<span>,</span>");
    if (row.accounts.length > 10) {
      content += '<button class="more-accounts" data-accounts="' + index + '" type="button">+' + (row.accounts.length - 10) + "</button>";
    }
    return '<div class="account-cell">' + content + "</div>";
  }

  function renderRows() {
    $("#monitorRows").innerHTML = rows.map(function (row, index) {
      return [
        "<tr>",
        '<td><span class="tag ' + row.kind + '">' + row.type + "</span></td>",
        "<td>" + escapeHtml(row.value) + "</td>",
        "<td>" + row.playerId + "</td>",
        "<td>" + renderAccounts(row, index) + "</td>",
        "<td>" + row.count + "</td>",
        "<td>" + row.action + "</td>",
        "<td>" + row.created + "</td>",
        "<td>" + row.updated + "</td>",
        '<td><button class="danger-link" data-manual-punish="' + index + '" type="button">手动风控处罚</button></td>',
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
        '<td><span class="tag ' + row.kind + '">' + row.type + "</span></td>",
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

  function switchTab(tab) {
    $all(".tab-btn").forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-tab") === tab);
    });
    var isRecords = tab === "records";
    $("#monitorFilters").hidden = isRecords;
    $("#monitorTable").hidden = isRecords;
    $("#recordFilters").hidden = !isRecords;
    $("#recordTable").hidden = !isRecords;
  }

  function numberStepper(value) {
    if (value === "") return "";
    return '<div class="number-stepper"><input value="' + value + '"/><div class="step-actions"><button type="button">＋</button><button type="button">－</button></div></div>';
  }

  function selectHtml(options, selected) {
    return '<select class="rule-select">' + options.map(function (option) {
      return '<option' + (option === selected ? " selected" : "") + ">" + option + "</option>";
    }).join("") + "</select>";
  }

  function renderRules(rules) {
    $("#ruleRows").innerHTML = rules.map(function (rule) {
      return [
        "<tr>",
        "<td>" + rule.type + "</td>",
        "<td>" + numberStepper(rule.trigger) + "</td>",
        "<td>" + numberStepper(rule.limit) + "</td>",
        "<td>" + selectHtml(scopeOptions, rule.scope) + "</td>",
        "<td>" + selectHtml(methodOptions, rule.method) + "</td>",
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

  function defaultMethodFor(row) {
    var ruleType = row.kind === "ip" ? "同IP" : row.type === "设备" ? "同设备号" : "同提现名称";
    var rule = defaultRules.find(function (item) {
      return item.type === ruleType;
    });
    return rule ? rule.method : row.action;
  }

  function openManualModal(row) {
    $("#manualScope").value = row.count > 1 ? "只处罚超出范围的账号" : "全部处罚";
    $("#manualMethod").value = defaultMethodFor(row);
    $("#manualModal").hidden = false;
  }

  function showAccounts(button) {
    var row = rows[Number(button.getAttribute("data-accounts"))];
    var rect = button.getBoundingClientRect();
    var popover = $("#accountPopover");
    popover.innerHTML = '<h3>关联账号</h3><div class="account-list">' + row.accounts.map(function (id) {
      return "<span>" + escapeHtml(id) + "</span>";
    }).join("") + "</div>";
    popover.style.left = Math.min(rect.left, window.innerWidth - 300) + "px";
    popover.style.top = rect.bottom + 8 + "px";
    popover.hidden = false;
  }

  function bindEvents() {
    $("#openDefaultRules").addEventListener("click", function () {
      openRuleModal("默认自动规则", defaultRules);
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

    $("#ruleModal").addEventListener("click", function (event) {
      if (event.target === $("#ruleModal")) closeRuleModal();
    });

    $("#manualModal").addEventListener("click", function (event) {
      if (event.target === $("#manualModal")) closeManualModal();
    });

    document.addEventListener("click", function (event) {
      var moreButton = event.target.closest("[data-accounts]");
      var manualButton = event.target.closest("[data-manual-punish]");
      var manualRecordButton = event.target.closest("[data-manual-record]");
      if (moreButton) {
        showAccounts(moreButton);
        event.stopPropagation();
        return;
      }
      if (manualButton) {
        openManualModal(rows[Number(manualButton.getAttribute("data-manual-punish"))]);
        return;
      }
      if (manualRecordButton) {
        var record = records[Number(manualRecordButton.getAttribute("data-manual-record"))];
        openManualModal({ kind: record.kind, type: record.type, count: record.count, action: record.action });
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
  });
})();
