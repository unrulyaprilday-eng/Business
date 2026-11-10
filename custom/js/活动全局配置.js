(function () {
  "use strict";

  var storageKey = "business.activity-global-config.v1";
  var legacyKey = "business.seven-day-benefits.inline.v1";
  var defaults = {
    schemaVersion: 1,
    bindingEnabled: true,
    bindingReward: "1000",
    updateEnabled: false,
    updateReward: "777"
  };
  var saved;
  var draft;
  var editing = false;
  var page;

  function copy(value) {
    return {
      schemaVersion: 1,
      bindingEnabled: value.bindingEnabled,
      bindingReward: value.bindingReward,
      updateEnabled: value.updateEnabled,
      updateReward: value.updateReward
    };
  }
  function query(selector) { return page.querySelector(selector); }
  function all(selector) { return Array.prototype.slice.call(page.querySelectorAll(selector)); }
  function amount(value) { return typeof value === "string" && /^\d{1,12}(?:\.\d{1,2})?$/.test(value); }
  function validState(value) {
    return value && value.schemaVersion === 1 &&
      typeof value.bindingEnabled === "boolean" && typeof value.updateEnabled === "boolean" &&
      amount(value.bindingReward) && amount(value.updateReward) &&
      (!value.bindingEnabled || Number(value.bindingReward) > 0) &&
      (!value.updateEnabled || Number(value.updateReward) > 0);
  }

  function notice(text, field) {
    var error = query("[data-ag-error]");
    error.textContent = text;
    error.hidden = !text;
    if (field) {
      var input = query('[data-ag-field="' + field + '"]');
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
      var display = query('[data-ag-display="' + key + '"]');
      display.textContent = draft[key] || "未配置";
      display.hidden = editing;
    });
    all("[data-ag-switch]").forEach(function (button) {
      var key = button.getAttribute("data-ag-switch");
      var enabled = draft[key];
      button.disabled = !editing;
      button.classList.toggle("is-on", enabled);
      button.setAttribute("aria-checked", String(enabled));
      query('[data-ag-switch-text="' + key + '"]').textContent = enabled ? "开启" : "关闭";
    });
  }

  function validate() {
    var fields = [["bindingReward", "绑定奖励金额", draft.bindingEnabled], ["updateReward", "更新奖励金额", draft.updateEnabled]];
    for (var index = 0; index < fields.length; index++) {
      var item = fields[index];
      if (!amount(draft[item[0]]) || (item[2] && Number(draft[item[0]]) <= 0)) {
        notice(item[1] + "须为非负数，最多 12 位整数、2 位小数；开启奖励时须大于 0。", item[0]);
        return false;
      }
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
        var value = JSON.parse(stored);
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
        all("[data-ag-field]").forEach(function (input) { draft[input.getAttribute("data-ag-field")] = input.value.trim(); });
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
