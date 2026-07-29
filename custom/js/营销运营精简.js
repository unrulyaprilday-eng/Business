(function () {
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function filterRows(tableId, keywordId, statusId, executionId) {
    var table = document.getElementById(tableId);
    if (!table) return;
    var keyword = document.getElementById(keywordId);
    var status = document.getElementById(statusId);
    var execution = document.getElementById(executionId);
    Array.prototype.forEach.call(table.querySelectorAll("tbody tr"), function (row) {
      var keywordMatch = !keyword || !keyword.value.trim() || row.textContent.indexOf(keyword.value.trim()) !== -1;
      var statusMatch = !status || !status.value || row.getAttribute("data-status") === status.value;
      var executionMatch = !execution || !execution.value || execution.value === "全部" || row.textContent.indexOf(execution.value) !== -1;
      row.hidden = !(keywordMatch && statusMatch && executionMatch);
    });
  }

  function setField(id, value) {
    var field = document.getElementById(id);
    if (field) field.value = value;
  }

  function syncPlanFields() {
    var audienceMode = document.getElementById("audienceMode");
    var savedAudienceField = document.getElementById("savedAudienceField");
    var memberListField = document.getElementById("memberListField");
    if (audienceMode && savedAudienceField && memberListField) {
      savedAudienceField.hidden = audienceMode.value !== "保存人群";
      memberListField.hidden = audienceMode.value !== "会员名单";
    }

    var executionMode = document.getElementById("executionMode");
    var executionTimeField = document.getElementById("executionTimeField");
    if (executionMode && executionTimeField) {
      executionTimeField.hidden = executionMode.value === "立即执行";
      var ruleLabel = document.getElementById("executionRuleLabel");
      var executionTime = document.getElementById("executionTime");
      if (ruleLabel) ruleLabel.innerHTML = '<span class="mo-required">*</span> ' + (executionMode.value === "事件触发" ? "触发事件" : "执行时间");
      if (executionTime && executionMode.value === "事件触发") {
        executionTime.placeholder = "例如：完成注册";
        if (/^\d{2}:\d{2}$/.test(executionTime.value)) executionTime.value = "完成注册";
      } else if (executionTime) {
        executionTime.placeholder = executionMode.value === "每周执行" ? "例如：每周一 10:00" : "例如：10:00";
        if (executionTime.value === "完成注册") executionTime.value = executionMode.value === "每周执行" ? "每周一 10:00" : "10:00";
      }
    }
  }

  function applyTemplate() {
    var select = document.getElementById("planTemplate");
    if (!select) return;
    var option = select.options[select.selectedIndex];
    if (!option || !option.value) return;
    setField("planName", option.getAttribute("data-plan-name") || "");
    setField("savedAudience", option.getAttribute("data-audience") || "");
    setField("executionMode", option.getAttribute("data-execution") || "每日执行");
    setField("executionTime", option.getAttribute("data-time") || "10:00");
    setField("taskResource", option.getAttribute("data-task") || "不使用");
    setField("activityResource", option.getAttribute("data-activity") || "不使用");
    setField("popupResource", option.getAttribute("data-popup") || "不使用");
    syncPlanFields();
  }

  function fillTemplateModal(button) {
    var row = button.closest("tr");
    if (!row) return;
    setField("templateName", row.getAttribute("data-name") || "");
    setField("templateScene", row.getAttribute("data-scene") || "");
    setField("templateAudience", row.getAttribute("data-audience") || "");
    setField("templateExecution", row.getAttribute("data-execution") || "每日执行");
    setField("templateTask", row.getAttribute("data-task") || "不使用");
    setField("templateActivity", row.getAttribute("data-activity") || "不使用");
    setField("templatePopup", row.getAttribute("data-popup") || "不使用");
    setField("templateStatus", row.getAttribute("data-status") || "启用");
    var title = document.getElementById("templateModalTitle");
    if (title) title.textContent = "编辑模板";
  }

  function resetTemplateModal() {
    ["templateName", "templateScene"].forEach(function (id) { setField(id, ""); });
    setField("templateAudience", "注册7天未首充");
    setField("templateExecution", "每日执行");
    setField("templateTask", "不使用");
    setField("templateActivity", "不使用");
    setField("templatePopup", "不使用");
    setField("templateStatus", "启用");
    var title = document.getElementById("templateModalTitle");
    if (title) title.textContent = "新建模板";
  }

  function initPlanQuery() {
    if (!document.getElementById("planForm")) return;
    var params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "edit") {
      var title = document.getElementById("planPageTitle");
      var crumb = document.getElementById("planPageCrumb");
      if (title) title.textContent = "编辑营销方案";
      if (crumb) crumb.textContent = "编辑方案";
    }
    var template = params.get("template");
    var templateSelect = document.getElementById("planTemplate");
    if (template && templateSelect) {
      templateSelect.value = template;
      applyTemplate();
    }
  }

  ready(function () {
    var planSearch = document.getElementById("planSearch");
    var planReset = document.getElementById("planReset");
    if (planSearch) planSearch.addEventListener("click", function () { filterRows("planTable", "planKeyword", "planStatus", "planExecution"); });
    if (planReset) planReset.addEventListener("click", function () {
      setField("planKeyword", "");
      setField("planStatus", "");
      setField("planExecution", "全部");
      filterRows("planTable", "planKeyword", "planStatus", "planExecution");
    });

    var templateSearch = document.getElementById("templateSearch");
    var templateReset = document.getElementById("templateReset");
    if (templateSearch) templateSearch.addEventListener("click", function () { filterRows("templateTable", "templateKeyword", "templateFilterStatus"); });
    if (templateReset) templateReset.addEventListener("click", function () {
      setField("templateKeyword", "");
      setField("templateFilterStatus", "");
      filterRows("templateTable", "templateKeyword", "templateFilterStatus");
    });

    Array.prototype.forEach.call(document.querySelectorAll(".mo-switch"), function (button) {
      button.addEventListener("click", function () {
        var on = !button.classList.contains("is-on");
        button.classList.toggle("is-on", on);
        button.setAttribute("aria-pressed", on ? "true" : "false");
        var row = button.closest("tr");
        if (row) {
          var status = on ? "运行中" : "已暂停";
          row.setAttribute("data-status", status);
          var tag = row.querySelector(".mo-status");
          if (tag) {
            tag.textContent = status;
            tag.classList.toggle("on", on);
            tag.classList.toggle("off", !on);
          }
          button.setAttribute("aria-label", on ? "暂停方案" : "启用方案");
        }
      });
    });

    var audienceMode = document.getElementById("audienceMode");
    var executionMode = document.getElementById("executionMode");
    var planTemplate = document.getElementById("planTemplate");
    if (audienceMode) audienceMode.addEventListener("change", syncPlanFields);
    if (executionMode) executionMode.addEventListener("change", syncPlanFields);
    if (planTemplate) planTemplate.addEventListener("change", applyTemplate);
    syncPlanFields();
    initPlanQuery();

    Array.prototype.forEach.call(document.querySelectorAll("[data-template-add]"), function (button) {
      button.addEventListener("click", resetTemplateModal);
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-template-edit]"), function (button) {
      button.addEventListener("click", function () { fillTemplateModal(button); });
    });
  });
})();
