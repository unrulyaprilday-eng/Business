(function () {
  var currentMerchant = {
    id: "B20018",
    name: "星河游戏",
    sites: [
      { id: "S1001", name: "主站 H5", domain: "star-h5.com" },
      { id: "S1002", name: "PC 官网", domain: "star-web.com" },
      { id: "S1003", name: "代理站", domain: "star-agent.com" },
      { id: "S1004", name: "推广落地页", domain: "star-campaign.com" }
    ]
  };

  var merchants = [
    {
      id: currentMerchant.id,
      name: currentMerchant.name,
      sites: currentMerchant.sites
    }
  ];

  var selectedSites = [];
  var pendingAction = "";
  var els = {};

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function currentScope() {
    var checked = document.querySelector("input[name='scopeType']:checked");
    return checked ? checked.value : "所有站点";
  }

  function siteLabel(site) {
    return site.name + " " + site.domain;
  }

  function currentSiteMerchant() {
    return merchants[0];
  }

  function renderSiteOptions() {
    var merchant = currentSiteMerchant();
    if (!merchant) {
      els.siteOptions.innerHTML = "<span class=\"empty-text\">暂无可维护站点</span>";
      els.targetSite.value = "";
      return;
    }
    els.siteOptions.innerHTML = merchant.sites.map(function (site) {
      var checked = selectedSites.indexOf(site.domain) > -1 ? " checked" : "";
      return "<label class=\"site-option\">"
        + "<input type=\"checkbox\" value=\"" + escapeHtml(site.domain) + "\"" + checked + " />"
        + "<span>" + escapeHtml(siteLabel(site)) + "</span>"
        + "</label>";
    }).join("");
    els.targetSite.value = selectedSites.join("，");
  }

  function refreshScopeArea() {
    var scope = currentScope();
    var options = document.querySelectorAll(".scope-option");
    Array.prototype.forEach.call(options, function (option) {
      var input = option.querySelector("input");
      option.classList.toggle("is-active", input && input.checked);
    });
    els.siteTargetArea.classList.toggle("is-visible", scope === "指定站点");
    els.scopeImpact.textContent = scopeDesc();
  }

  function parseDateTime(value) {
    var match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) return null;
    return new Date(Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6] || 0)
    ));
  }

  function formatDateTimeValue(date) {
    return date.getUTCFullYear() + "-"
      + pad(date.getUTCMonth() + 1) + "-"
      + pad(date.getUTCDate()) + "T"
      + pad(date.getUTCHours()) + ":"
      + pad(date.getUTCMinutes());
  }

  function formatLocalDisplay(date) {
    if (!date) return "--";
    return date.getUTCFullYear() + "-"
      + pad(date.getUTCMonth() + 1) + "-"
      + pad(date.getUTCDate()) + " "
      + pad(date.getUTCHours()) + ":"
      + pad(date.getUTCMinutes()) + ":"
      + pad(date.getUTCSeconds());
  }

  function currentTargetTimeValue() {
    var offset = Number(els.targetTimeZone.value || 0);
    return formatDateTimeValue(new Date(Date.now() + offset * 60 * 60 * 1000));
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function formatInOffset(date, offset) {
    if (!date) return "--";
    var shifted = new Date(date.getTime() + offset * 60 * 60 * 1000);
    return shifted.getUTCFullYear() + "-"
      + pad(shifted.getUTCMonth() + 1) + "-"
      + pad(shifted.getUTCDate()) + " "
      + pad(shifted.getUTCHours()) + ":"
      + pad(shifted.getUTCMinutes()) + ":"
      + pad(shifted.getUTCSeconds());
  }

  function refreshTimezoneCompare() {
    var offset = Number(els.targetTimeZone.value || 0);
    var startTarget = parseDateTime(els.start.value);
    var durationMs = Number(els.duration.value || 0) * 60 * 1000;
    var endTarget = startTarget ? new Date(startTarget.getTime() + durationMs) : null;
    els.end.value = formatLocalDisplay(endTarget);
    var startUtc = startTarget ? new Date(startTarget.getTime() - offset * 60 * 60 * 1000) : null;
    var endUtc = endTarget ? new Date(endTarget.getTime() - offset * 60 * 60 * 1000) : null;
    els.utcBaseTime.textContent = formatInOffset(startUtc, 0) + " - " + formatInOffset(endUtc, 0);
    els.targetZoneTime.textContent = formatInOffset(startUtc, offset) + " - " + formatInOffset(endUtc, offset);
  }

  function refreshSummary() {
    refreshScopeArea();
    var isImmediate = els.effectMode.value === "立即维护";
    els.form.classList.toggle("is-immediate", isImmediate);
    els.start.readOnly = isImmediate;
    if (isImmediate) {
      els.start.value = currentTargetTimeValue();
    }
    refreshTimezoneCompare();
  }

  function scopeDesc() {
    var scope = currentScope();
    if (scope === "所有站点") return "所有站点访问";
    if (selectedSites.length) return selectedSites.length + " 个指定站点访问";
    return "指定站点访问";
  }

  function selectedTargetText() {
    var scope = currentScope();
    if (scope === "所有站点") return currentMerchant.name + " 全部站点";
    return els.targetSite.value.trim() || "未选择站点";
  }

  function setConfirmSummary() {
    var rows = [
      ["维护范围", scopeDesc()],
      ["目标对象", selectedTargetText()],
      ["生效方式", els.effectMode.value],
      ["维护时间", formatLocalDisplay(parseDateTime(els.start.value)) + " 至 " + (els.end.value || "--")],
      ["维护时长", els.duration.options[els.duration.selectedIndex].text],
      ["UTC 0", els.utcBaseTime.textContent]
    ];
    els.confirmSummary.innerHTML = rows.map(function (row) {
      return "<div><dt>" + escapeHtml(row[0]) + "</dt><dd>" + escapeHtml(row[1]) + "</dd></div>";
    }).join("");
  }

  function openDialog(action) {
    pendingAction = action;
    setConfirmSummary();
    if (action === "recover") {
      els.dialogTitle.textContent = "确认一键恢复";
      els.dialogContent.textContent = "确认恢复后，当前维护范围将立即恢复访问。";
    } else {
      els.dialogTitle.textContent = "确认提交维护";
      els.dialogContent.textContent = "提交后将按当前配置变更维护状态，请确认以下影响信息。";
    }
    els.dialog.classList.remove("is-hidden");
  }

  function closeDialog() {
    els.dialog.classList.add("is-hidden");
  }

  function submitMaintenance(event) {
    event.preventDefault();
    openDialog("submit");
  }

  function confirmAction() {
    refreshSummary();
    closeDialog();
  }

  function resetForm() {
    els.form.reset();
    selectedSites = [];
    renderSiteOptions();
    els.effectMode.value = "定时维护";
    els.duration.value = "120";
    els.targetTimeZone.value = "8";
    els.start.value = "2026-05-20T02:00";
    refreshSummary();
  }

  function bind() {
    els.form.addEventListener("submit", submitMaintenance);
    els.recover.addEventListener("click", function () { openDialog("recover"); });
    els.reset.addEventListener("click", resetForm);
    els.close.addEventListener("click", closeDialog);
    els.cancel.addEventListener("click", closeDialog);
    els.confirm.addEventListener("click", confirmAction);
    els.form.addEventListener("input", refreshSummary);
    els.form.addEventListener("change", refreshSummary);
    els.siteOptions.addEventListener("change", function (event) {
      if (event.target.type !== "checkbox") return;
      if (event.target.checked && selectedSites.indexOf(event.target.value) === -1) {
        selectedSites.push(event.target.value);
      }
      if (!event.target.checked) {
        selectedSites = selectedSites.filter(function (site) {
          return site !== event.target.value;
        });
      }
      renderSiteOptions();
      refreshSummary();
    });
  }

  function init() {
    els = {
      form: document.getElementById("maintenanceForm"),
      effectMode: document.getElementById("effectMode"),
      duration: document.getElementById("durationSelect"),
      targetTimeZone: document.getElementById("targetTimeZone"),
      start: document.getElementById("startTime"),
      end: document.getElementById("endTime"),
      message: document.getElementById("messageInput"),
      scopeImpact: document.getElementById("scopeImpactText"),
      siteTargetArea: document.getElementById("siteTargetArea"),
      siteOptions: document.getElementById("siteOptions"),
      targetSite: document.getElementById("targetSiteInput"),
      utcBaseTime: document.getElementById("utcBaseTime"),
      targetZoneTime: document.getElementById("targetZoneTime"),
      recover: document.getElementById("recoverBtn"),
      reset: document.getElementById("resetBtn"),
      dialog: document.getElementById("confirmDialog"),
      dialogTitle: document.getElementById("dialogTitle"),
      dialogContent: document.getElementById("dialogContent"),
      confirmSummary: document.getElementById("confirmSummary"),
      close: document.getElementById("closeDialog"),
      cancel: document.getElementById("cancelDialog"),
      confirm: document.getElementById("confirmAction")
    };
    bind();
    renderSiteOptions();
    refreshSummary();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
