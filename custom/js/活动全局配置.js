(function () {
  "use strict";

  var storageKey = "business.activity-global-config.v1";
  var legacyKey = "business.seven-day-benefits.inline.v1";
  var defaults = {
    schemaVersion: 1,
    bindingEnabled: true,
    bindingReward: "1000",
    updateEnabled: false,
    updateVersion: "V1.2.3",
    updateReward: "777",
    installEnabled: false,
    installReward: "",
    installCondition: "",
    installMinimum: ""
  };
  var conditionNames = { bet: "有效投注", deposit: "充值" };
  var saved;
  var draft;
  var editing = false;
  var page;

  function copy(value) {
    return {
      schemaVersion: value.schemaVersion,
      bindingEnabled: value.bindingEnabled,
      bindingReward: value.bindingReward,
      updateEnabled: value.updateEnabled,
      updateVersion: value.updateVersion === undefined ? defaults.updateVersion : value.updateVersion,
      updateReward: value.updateReward,
      installEnabled: value.installEnabled === undefined ? defaults.installEnabled : value.installEnabled,
      installReward: value.installReward === undefined ? defaults.installReward : value.installReward,
      installCondition: value.installCondition === undefined ? defaults.installCondition : value.installCondition,
      installMinimum: value.installMinimum === undefined ? defaults.installMinimum : value.installMinimum
    };
  }
  function query(selector) { return page.querySelector(selector); }
  function all(selector) { return Array.prototype.slice.call(page.querySelectorAll(selector)); }
  function amount(value) { return typeof value === "string" && /^\d{1,12}(?:\.\d{1,2})?$/.test(value); }
  function positiveAmount(value) { return amount(value) && Number(value) > 0; }
  function version(value) { return typeof value === "string" && value.length <= 64 && !/\s/.test(value); }

  function restoreInstallCondition(value) {
    var state = copy(value);
    if (value.installCondition !== undefined || value.installMinimum !== undefined) return state;
    var hasBet = positiveAmount(value.installBetMinimum);
    var hasDeposit = positiveAmount(value.installDepositMinimum);
    if (hasBet !== hasDeposit) {
      state.installCondition = hasBet ? "bet" : "deposit";
      state.installMinimum = hasBet ? value.installBetMinimum : value.installDepositMinimum;
    } else if (state.installEnabled === true) {
      state.installEnabled = false;
    }
    return state;
  }

  function installIssue(state) {
    if (state.installReward !== "" && !positiveAmount(state.installReward)) {
      return { field: "installReward", message: "安装包奖励金额须大于 0，最多 12 位整数、2 位小数。" };
    }
    if (state.installEnabled && !state.installReward) {
      return { field: "installReward", message: "开启安装包奖励时，请填写奖励金额。" };
    }
    if (state.installCondition !== "bet" && state.installCondition !== "deposit") {
      if (state.installEnabled || state.installCondition !== "" || state.installMinimum !== "") {
        return { field: "installCondition", message: "请选择一项获奖条件。" };
      }
    } else if ((state.installEnabled || state.installMinimum !== "") && !positiveAmount(state.installMinimum)) {
      return { field: "installMinimum", message: "达标金额须大于 0，最多 12 位整数、2 位小数。" };
    }
    return null;
  }

  function validState(value) {
    return value && value.schemaVersion === 1 &&
      typeof value.bindingEnabled === "boolean" && typeof value.updateEnabled === "boolean" &&
      amount(value.bindingReward) && amount(value.updateReward) &&
      (value.updateVersion === undefined || (version(value.updateVersion) && (!value.updateEnabled || value.updateVersion.length > 0))) &&
      (!value.bindingEnabled || Number(value.bindingReward) > 0) &&
      (!value.updateEnabled || Number(value.updateReward) > 0) &&
      typeof value.installEnabled === "boolean" && !installIssue(value);
  }

  function notice(text, field) {
    var error = query("[data-ag-error]");
    error.textContent = text;
    error.hidden = !text;
    if (field) {
      var input = field === "installCondition" ? query("[data-ag-condition]") : query('[data-ag-field="' + field + '"]');
      input.setAttribute("aria-invalid", "true");
      input.focus();
    }
  }

  function clearErrors() {
    notice("");
    all("[aria-invalid]").forEach(function (input) { input.removeAttribute("aria-invalid"); });
  }

  function restoreLegacy() {
    var state = copy(defaults);
    var old = JSON.parse(window.localStorage.getItem(legacyKey) || "null");
    var binding = old && old.modules && old.modules.bindAccount;
    if (!binding) return state;
    if (typeof binding.enabled === "boolean") state.bindingEnabled = binding.enabled;
    var raw = binding.rows && binding.rows[0] && binding.rows[0][0];
    if (typeof raw === "string") {
      var value = raw.replace(/^Rp\s*/i, "").replace(/,/g, "").replace(/\s*活动奖金$/, "").trim();
      if (amount(value)) state.bindingReward = value;
    }
    return state;
  }

  function renderInstallCondition() {
    var condition = draft.installCondition;
    var display = query("[data-ag-condition-display]");
    display.textContent = conditionNames[condition] || "未配置";
    display.hidden = editing;
    query("[data-ag-condition-options]").hidden = !editing;
    all("[data-ag-condition]").forEach(function (radio) {
      radio.checked = radio.value === condition;
      radio.disabled = !editing;
      radio.required = draft.installEnabled;
    });
    query("[data-ag-minimum-row]").hidden = !condition;
    var minimum = query('[data-ag-field="installMinimum"]');
    minimum.value = draft.installMinimum;
    minimum.disabled = !editing || !condition;
    minimum.required = draft.installEnabled && !!condition;
  }

  function render() {
    page.classList.toggle("is-editing", editing);
    query('[data-ag-action="edit"]').hidden = editing;
    query('[data-ag-action="edit"]').disabled = false;
    query("[data-ag-save-bar]").hidden = !editing;
    query("[data-ag-mode]").textContent = editing ? "编辑中" : "已保存配置";
    all("[data-ag-field]").forEach(function (input) {
      var key = input.getAttribute("data-ag-field");
      input.value = draft[key];
      input.disabled = !editing;
      input.hidden = !editing;
      if (key === "updateVersion") input.required = draft.updateEnabled;
      if (key === "installReward") input.required = draft.installEnabled;
      var display = query('[data-ag-display="' + key + '"]');
      display.textContent = draft[key] || "未配置";
      display.hidden = editing;
      var currency = query('[data-ag-currency="' + key + '"]');
      if (currency) currency.hidden = !editing && !draft[key];
    });
    all("[data-ag-switch]").forEach(function (button) {
      var key = button.getAttribute("data-ag-switch");
      var enabled = draft[key];
      button.disabled = !editing;
      button.classList.toggle("is-on", enabled);
      button.setAttribute("aria-checked", String(enabled));
      query('[data-ag-switch-text="' + key + '"]').textContent = enabled ? "开启" : "关闭";
    });
    renderInstallCondition();
  }

  function validate() {
    if (!version(draft.updateVersion) || (draft.updateEnabled && !draft.updateVersion)) {
      notice("开启更新奖励时须填写版本号，最多 64 个字符，不能包含空格。", "updateVersion");
      return false;
    }
    var fields = [["bindingReward", "绑定奖励金额", draft.bindingEnabled], ["updateReward", "更新奖励金额", draft.updateEnabled]];
    for (var index = 0; index < fields.length; index++) {
      var item = fields[index];
      if (!amount(draft[item[0]]) || (item[2] && Number(draft[item[0]]) <= 0)) {
        notice(item[1] + "须为非负数，最多 12 位整数、2 位小数；开启奖励时须大于 0。", item[0]);
        return false;
      }
    }
    var issue = installIssue(draft);
    if (issue) {
      notice(issue.message, issue.field);
      return false;
    }
    return true;
  }

  function init() {
    page = document.querySelector(".activity-global-page");
    if (!page || !query("[data-ag-form]") || !query("[data-ag-save-bar]") || !query("[data-ag-error]")) return;
    saved = copy(defaults);
    var loadError = "";
    try {
      var stored = window.localStorage.getItem(storageKey);
      if (stored === null) saved = restoreLegacy();
      else {
        var storedValue = JSON.parse(stored);
        var value = storedValue && restoreInstallCondition(storedValue);
        if (validState(value)) saved = copy(value);
        else loadError = "已保存配置格式异常，当前展示默认值。请核对后编辑保存。";
      }
    } catch (error) { loadError = "读取本地配置失败，当前展示默认值。请核对配置后重试保存。"; }
    draft = copy(saved);
    render();
    if (loadError) notice(loadError);

    query("[data-ag-form]").addEventListener("submit", function (event) { event.preventDefault(); });
    page.addEventListener("input", function (event) {
      var input = event.target.closest("[data-ag-field]");
      if (!editing || !input) return;
      draft[input.getAttribute("data-ag-field")] = input.value.trim();
      input.removeAttribute("aria-invalid");
    });
    page.addEventListener("change", function (event) {
      var radio = event.target.closest("[data-ag-condition]");
      if (!editing || !radio || !radio.checked || radio.value === draft.installCondition) return;
      draft.installCondition = radio.value;
      draft.installMinimum = "";
      clearErrors();
      renderInstallCondition();
    });
    page.addEventListener("click", function (event) {
      var toggle = event.target.closest("[data-ag-switch]");
      if (toggle && editing) {
        var key = toggle.getAttribute("data-ag-switch");
        draft[key] = !draft[key];
        render();
        return;
      }
      var action = event.target.closest("[data-ag-action]");
      if (!action) return;
      var name = action.getAttribute("data-ag-action");
      if (name === "edit" && !editing) {
        draft = copy(saved);
        editing = true;
        clearErrors();
        render();
      } else if (name === "cancel" && editing) {
        draft = copy(saved);
        editing = false;
        clearErrors();
        render();
        query('[data-ag-action="edit"]').focus();
      } else if (name === "save" && editing) {
        clearErrors();
        var inputs = all("[data-ag-field]");
        for (var index = 0; index < inputs.length; index++) {
          var input = inputs[index];
          var field = input.getAttribute("data-ag-field");
          if (input.validity.badInput) {
            notice("请输入有效的金额。", field);
            return;
          }
          draft[field] = input.value.trim();
        }
        if (!validate()) return;
        try { window.localStorage.setItem(storageKey, JSON.stringify(draft)); }
        catch (error) { notice("保存失败，请检查浏览器存储权限或空间后重试；当前修改已保留。"); return; }
        saved = copy(draft);
        editing = false;
        render();
        var toast = query("[data-ag-toast]");
        toast.textContent = "全局配置已保存";
        toast.hidden = false;
        window.clearTimeout(init.toastTimer);
        init.toastTimer = window.setTimeout(function () { toast.hidden = true; }, 3000);
        query('[data-ag-action="edit"]').focus();
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}());
