(function () {
  "use strict";

  var storageKey = "business.seven-day-benefits.inline.v1";
  var editing = false;
  var savedState;
  var legacyBinding;
  var hasLegacyBinding = false;
  var page;
  var fixedRowCounts = { checkin: 7 };

  function checkinAmount(value, fallback) {
    if (value === "保险箱礼包") return fallback;
    return value.replace(/^Rp\s*/i, "").replace(/,/g, "").trim();
  }

  function migrateChallengeAmounts(state) {
    var challenge = state && state.modules && state.modules.depositChallenge;
    if (!challenge) return state;
    if (Array.isArray(challenge.settings) && typeof challenge.settings[0] === "string") {
      challenge.settings[0] = challenge.settings[0].replace(/^(?:累计)?充值\s*(?:≥|>=)?\s*(?:Rp\s*)?/i, "").replace(/,/g, "").trim();
    }
    if (Array.isArray(challenge.rows)) challenge.rows = challenge.rows.map(function (row) {
      if (!Array.isArray(row) || row.length !== 2 || !row.every(function (value) { return typeof value === "string"; })) return row;
      return [
        row[0].replace(/^(?:累计|有效)?(?:打码|投注)\s*(?:≥|>=)?\s*(?:Rp\s*)?/i, "").replace(/,/g, "").trim(),
        row[1].replace(/^Rp\s*/i, "").replace(/,/g, "").trim()
      ];
    });
    return state;
  }

  function validRewardAmount(value) {
    var amount = Number(value);
    return value.trim() !== "" && Number.isFinite(amount) && amount >= 0 &&
      Math.abs(amount * 100 - Math.round(amount * 100)) <= 0.00001;
  }

  function packValueError(row) {
    if (!validRewardAmount(row[0]) || Number(row[0]) <= 0) return "礼包基础金额必须大于 0，最多保留两位小数。";
    if (!validRewardAmount(row[1])) return "礼包赠送金额必须是非负金额，最多保留两位小数。";
    return "";
  }

  function migratePackRows(state) {
    var packs = state && state.modules && state.modules.activityPack;
    if (!packs || !Array.isArray(packs.rows)) return state;
    packs.rows = packs.rows.map(function (row) {
      if (!Array.isArray(row) || row.length !== 2 || !row.every(function (value) { return typeof value === "string"; })) return row;
      if (!/礼包/.test(row[0])) return row;
      var base = row[1].match(/(?:充值|售价)\s*(?:Rp\s*)?([0-9][0-9,]*(?:\.[0-9]+)?)/i);
      var bonus = row[1].match(/(?:额外赠送|赠送|赠)\s*(?:Rp\s*)?([0-9][0-9,]*(?:\.[0-9]+)?)/i);
      return [base ? base[1].replace(/,/g, "") : "", bonus ? bonus[1].replace(/,/g, "") : ""];
    });
    return state;
  }

  function normalizeFixedRows(state, defaults) {
    Object.keys(fixedRowCounts).forEach(function (id) {
      var item = state.modules[id];
      var fallback = defaults.modules[id].rows;
      if (id === "checkin") {
        item.rows = fallback.map(function (row, index) {
          var day = "Day " + (index + 1);
          var stored = item.rows.find(function (entry) { return entry[0].trim().toLowerCase() === day.toLowerCase(); });
          return [day, stored ? checkinAmount(stored[1], row[1]) : row[1]];
        });
      }
    });
    return state;
  }
  var taskTypes = {
    wager: { label: "有效打码", unit: "", step: "0.01" },
    deposit: { label: "充值", unit: "", step: "0.01" },
    login: { label: "每日登录", unit: "天", step: "1", max: "7" },
    invite: { label: "邀请好友", unit: "人", step: "1" }
  };

  function duplicateTaskRows(rows) {
    var groups = Object.create(null);
    rows.forEach(function (row, index) {
      if (!taskTypes[row[0]] || !row[1].trim()) return;
      var target = Number(row[1]);
      if (!Number.isFinite(target)) return;
      var key = JSON.stringify([row[0], target]);
      if (!groups[key]) groups[key] = [];
      groups[key].push(index);
    });
    return Object.keys(groups).reduce(function (duplicates, key) {
      return groups[key].length > 1 ? duplicates.concat(groups[key]) : duplicates;
    }, []).sort(function (a, b) { return a - b; });
  }

  function taskValueError(row) {
    var type = taskTypes[row[0]];
    if (!type) return "请选择任务类型。";
    if (!row[1].trim()) return "请填写目标值。";
    var target = Number(row[1]);
    if (!Number.isFinite(target) || target <= 0) return "目标值必须大于 0。";
    if (type.step === "1" && !Number.isInteger(target)) return "登录天数和邀请人数必须是整数。";
    if (type.max && target > Number(type.max)) return "七日活动的登录目标不能超过 7 天。";
    if (type.step !== "1" && Math.abs(target * 100 - Math.round(target * 100)) > 0.00001) return "金额最多保留两位小数。";
    return "";
  }

  function migrateTaskRows(state, defaultReward) {
    var tasks = state && state.modules && state.modules.tasks;
    if (!tasks || !Array.isArray(tasks.rows)) return state;
    tasks.completionMode = "all";
    if (Array.isArray(tasks.settings) && tasks.settings.length === 0) tasks.settings = [defaultReward || "10000"];
    tasks.rows = tasks.rows.map(function (row) {
      if (!Array.isArray(row) || (row.length !== 2 && row.length !== 3) || !row.every(function (value) { return typeof value === "string"; })) return row;
      if (row.length === 3) return row.slice(0, 2);
      if (taskTypes[row[0]] || row[0] === "") return row;
      var type = /投注|打码/.test(row[0]) ? "wager" : /充值/.test(row[0]) ? "deposit" : /登录/.test(row[0]) ? "login" : /邀请/.test(row[0]) ? "invite" : "";
      var target = row[0].replace(/,/g, "").match(/\d+(?:\.\d+)?/);
      return [type, target ? target[0] : ""];
    });
    return state;
  }

  function query(selector, root) { return (root || page).querySelector(selector); }
  function all(selector, root) { return Array.prototype.slice.call((root || page).querySelectorAll(selector)); }
  function ready(callback) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback);
    else callback();
  }

  function message(text, isError) {
    var toast = query("[data-seven-toast]");
    toast.textContent = text;
    toast.setAttribute("role", isError ? "alert" : "status");
    toast.classList.add("is-visible");
    window.clearTimeout(message.timer);
    message.timer = window.setTimeout(function () { toast.classList.remove("is-visible"); }, 3500);
  }

  function switchState(button, on) {
    button.classList.toggle("is-on", on);
    button.setAttribute("aria-checked", String(on));
  }

  function moduleState(card, on) {
    card.setAttribute("data-enabled", String(on));
    card.classList.toggle("is-disabled", !on);
    switchState(query("[data-module-switch]", card), on);
    var status = query(".module-status", card);
    status.textContent = on ? "启用中" : "已停用";
    status.classList.toggle("enabled", on);
    status.classList.toggle("disabled", !on);
  }

  function inlineCell(value, label, reward) {
    var cell = document.createElement("span");
    cell.className = "benefit-inline-cell";
    var display = document.createElement(reward ? "strong" : "span");
    display.className = "benefit-value-display";
    display.textContent = value;
    var input = document.createElement("input");
    input.type = "text";
    input.className = "benefit-inline-input";
    input.setAttribute("data-inline-value", "true");
    input.setAttribute("aria-label", label);
    input.required = true;
    input.value = value;
    input.disabled = !editing;
    input.addEventListener("input", function () {
      display.textContent = input.value;
      input.removeAttribute("aria-invalid");
    });
    cell.appendChild(display);
    cell.appendChild(input);
    return cell;
  }

  function appendRow(table, values) {
    var card = table.closest("[data-module]");
    var name = query("h3", card).textContent;
    var headings = all(".is-head > span", table);
    var row = document.createElement("div");
    row.className = "benefit-reward-row benefit-edit-row";
    row.setAttribute("data-tier-row", "true");
    var id = table.getAttribute("data-module-table");
    var isTask = id === "tasks";
    if (isTask) appendTaskCells(row, values);
    else values.forEach(function (value, index) {
      if (id === "checkin" && index === 0) {
        var day = document.createElement("span");
        day.setAttribute("data-fixed-value", "true");
        day.textContent = "Day " + (all("[data-tier-row]", table).length + 1);
        row.appendChild(day);
      } else {
        var cell = inlineCell(value, name + "：" + headings[index].textContent, index === 1);
        if (id === "checkin" || id === "activityPack" || id === "depositChallenge") {
          var amountInput = query("input", cell);
          amountInput.type = "number";
          amountInput.min = id === "activityPack" && index === 0 ? "0.01" : "0";
          amountInput.step = "0.01";
          amountInput.value = value;
        }
        row.appendChild(cell);
      }
    });
    if (!fixedRowCounts[id]) {
      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "seven-day-delete-tier";
      remove.textContent = "删除";
      remove.setAttribute("data-remove-row", "true");
      remove.setAttribute("aria-label", "删除" + name + "当前档位");
      remove.disabled = !editing;
      remove.hidden = !editing;
      row.appendChild(remove);
    }
    table.appendChild(row);
    return row;
  }

  function appendTaskCells(row, values) {
    var typeCell = document.createElement("span");
    typeCell.className = "benefit-inline-cell benefit-task-type";
    var display = document.createElement("span");
    display.className = "benefit-value-display";
    var select = document.createElement("select");
    select.className = "benefit-inline-input";
    select.setAttribute("data-inline-value", "true");
    select.setAttribute("aria-label", "福利任务：任务类型");
    select.setAttribute("aria-describedby", "sevenDayTaskError");
    select.required = true;
    select.disabled = !editing;
    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "请选择类型";
    select.appendChild(placeholder);
    Object.keys(taskTypes).forEach(function (type) {
      var option = document.createElement("option");
      option.value = type;
      option.textContent = taskTypes[type].label;
      select.appendChild(option);
    });
    select.value = values[0];
    typeCell.appendChild(display);
    typeCell.appendChild(select);
    row.appendChild(typeCell);
    row.appendChild(inlineCell(values[1], "福利任务：目标值", false));
    var targetCell = row.children[1];
    targetCell.classList.add("benefit-task-target");
    var unit = document.createElement("span");
    unit.className = "benefit-task-unit";
    targetCell.appendChild(unit);
    var targetInput = query("input", targetCell);
    targetInput.type = "number";
    // Assign after changing the type so legacy numeric strings keep their value.
    targetInput.value = values[1];
    targetInput.setAttribute("aria-describedby", "sevenDayTaskError");
    function updateType() {
      var type = taskTypes[select.value];
      display.textContent = type ? type.label : "请选择类型";
      targetInput.step = type ? type.step : "0.01";
      targetInput.min = type && type.step === "1" ? "1" : "0.01";
      if (type && type.max) targetInput.max = type.max;
      else targetInput.removeAttribute("max");
      unit.textContent = type ? type.unit : "";
      unit.hidden = !type || !type.unit;
    }
    select.addEventListener("change", updateType);
    updateType();
  }

  function syncTaskErrors() {
    var table = query('[data-module-table="tasks"]');
    var rows = all("[data-tier-row]", table);
    var values = rows.map(function (row) { return all("[data-inline-value]", row).map(function (input) { return input.value; }); });
    var duplicates = duplicateTaskRows(values);
    var firstInvalid = null;
    var text = "";
    rows.forEach(function (row, index) {
      var error = taskValueError(values[index]);
      var duplicate = duplicates.indexOf(index) !== -1;
      row.classList.toggle("is-duplicate", duplicate);
      all("[data-inline-value]", row).forEach(function (control) {
        if (error || duplicate) control.setAttribute("aria-invalid", "true");
        else control.removeAttribute("aria-invalid");
      });
      if ((error || duplicate) && !firstInvalid) firstInvalid = query("[data-inline-value]", row);
      if (error && !text) text = "第 " + (index + 1) + " 个任务：" + error;
    });
    if (duplicates.length) text = "第 " + duplicates.map(function (index) { return index + 1; }).join("、") + " 个任务的类型和目标值相同，请修改或删除重复项。";
    var notice = query("[data-task-error]");
    notice.textContent = text;
    notice.hidden = !text || !editing;
    return firstInvalid;
  }

  function captureState() {
    var modules = {};
    all("[data-module]").forEach(function (card) {
      modules[card.getAttribute("data-module")] = {
        enabled: card.getAttribute("data-enabled") === "true",
        settings: all(".benefit-config-row [data-inline-value]", card).map(function (input) { return input.value; }),
        rows: all("[data-tier-row]", card).map(function (row) {
          return all("[data-inline-value], [data-fixed-value]", row).map(function (input) {
            return input.hasAttribute("data-fixed-value") ? input.textContent : input.value;
          });
        })
      };
      if (card.getAttribute("data-module") === "tasks") modules.tasks.completionMode = "all";
    });
    return { masterOn: query("[data-seven-master-switch]").getAttribute("aria-checked") === "true", modules: modules };
  }

  function validState(state) {
    if (!state || typeof state.masterOn !== "boolean" || !state.modules) return false;
    return all("[data-module]").every(function (card) {
      var item = state.modules[card.getAttribute("data-module")];
      var settingCount = all(".benefit-config-row [data-inline-value]", card).length;
      return item && typeof item.enabled === "boolean" && Array.isArray(item.settings) &&
        item.settings.length === settingCount && item.settings.every(function (value) { return typeof value === "string"; }) &&
        Array.isArray(item.rows) && item.rows.every(function (row) {
          return Array.isArray(row) && row.length === 2 && row.every(function (value) { return typeof value === "string"; });
        });
    });
  }

  function restoreState(state) {
    switchState(query("[data-seven-master-switch]"), state.masterOn);
    var status = query("[data-seven-status]");
    status.textContent = state.masterOn ? "已开启" : "已关闭";
    status.classList.toggle("is-off", !state.masterOn);
    all("[data-module]").forEach(function (card) {
      var item = state.modules[card.getAttribute("data-module")];
      moduleState(card, item.enabled);
      all(".benefit-config-row .benefit-inline-cell", card).forEach(function (cell, index) {
        query("input", cell).value = item.settings[index];
        query("input", cell).removeAttribute("aria-invalid");
        query(".benefit-value-display", cell).textContent = item.settings[index];
      });
      var table = query("[data-module-table]", card);
      all("[data-tier-row]", table).forEach(function (row) { row.remove(); });
      item.rows.forEach(function (values) { appendRow(table, values); });
    });
  }

  function setEditing(next) {
    editing = next;
    page.classList.toggle("is-editing", next);
    query('[data-seven-edit="edit"]').hidden = next;
    query("[data-seven-save-bar]").hidden = !next;
    query("[data-seven-readonly]").textContent = next ? "编辑中" : "已保存配置";
    all("[data-inline-value], [data-seven-master-switch], [data-module-switch], [data-add-row], [data-remove-row]").forEach(function (control) { control.disabled = !next; });
    all("[data-add-row], [data-remove-row]").forEach(function (control) { control.hidden = !next; });
    if (!next) query("[data-task-error]").hidden = true;
  }

  function beginEditing() { if (!editing) setEditing(true); }

  function validate() {
    var totalReward = query('[data-task-total-reward-row] [data-inline-value]');
    if (!totalReward || !validRewardAmount(totalReward.value)) {
      if (totalReward) { totalReward.setAttribute("aria-invalid", "true"); totalReward.focus(); }
      message("全部完成奖励金额必须是非负金额，最多保留两位小数。", true);
      return false;
    }
    var unlock = query('[data-module="depositChallenge"] .benefit-config-row [data-inline-value]');
    if (unlock && !validRewardAmount(unlock.value)) {
      unlock.setAttribute("aria-invalid", "true");
      unlock.focus();
      message("解锁充值金额必须是非负金额，最多保留两位小数。", true);
      return false;
    }
    var invalidFixed = Object.keys(fixedRowCounts).find(function (id) {
      return all('[data-module-table="' + id + '"] [data-tier-row]').length !== fixedRowCounts[id];
    });
    if (invalidFixed) {
      message("七日签到必须固定配置 7 天奖励。", true);
      return false;
    }
    var invalidAmount = all('[data-module-table="checkin"] [data-inline-value], [data-module-table="depositChallenge"] [data-inline-value]').find(function (input) {
      return !validRewardAmount(input.value);
    });
    if (invalidAmount) {
      invalidAmount.setAttribute("aria-invalid", "true");
      invalidAmount.focus();
      var id = invalidAmount.closest('[data-module-table]').getAttribute("data-module-table");
      var name = id === "checkin" ? "签到奖励" : "打码目标和奖励";
      message(name + "必须是非负金额，最多保留两位小数。", true);
      return false;
    }
    var invalidPack = all('[data-module-table="activityPack"] [data-tier-row]').find(function (row) {
      return !!packValueError(all("[data-inline-value]", row).map(function (input) { return input.value; }));
    });
    if (invalidPack) {
      var controls = all("[data-inline-value]", invalidPack);
      var values = controls.map(function (input) { return input.value; });
      var invalidControl = controls[validRewardAmount(values[0]) && Number(values[0]) > 0 ? 1 : 0];
      invalidControl.setAttribute("aria-invalid", "true");
      invalidControl.focus();
      message(packValueError(values), true);
      return false;
    }
    var invalidTask = syncTaskErrors();
    if (invalidTask) { invalidTask.focus(); return false; }
    var empty = all("[data-inline-value]").find(function (input) { return !input.value.trim(); });
    if (empty) {
      empty.setAttribute("aria-invalid", "true");
      empty.focus();
      message("请填写完整的档位条件和奖励内容。", true);
      return false;
    }
    var emptyModule = all("[data-module]").find(function (card) {
      return card.getAttribute("data-enabled") === "true" && !query("[data-tier-row]", card);
    });
    if (emptyModule) {
      (query("[data-add-row]", emptyModule) || query("[data-module-edit]", emptyModule)).focus();
      message(query("h3", emptyModule).textContent + "已开启，请至少配置一个奖励档位。", true);
      return false;
    }
    return true;
  }

  ready(function () {
    page = document.querySelector(".seven-day-config-page");
    if (!page || !query("[data-seven-save-bar]") || !query("[data-seven-toast]")) return;
    all("[data-module-table]").forEach(function (table) {
      var values = all(".benefit-reward-row:not(.is-head)", table).map(function (row) {
        return Array.prototype.map.call(row.children, function (cell) { return cell.getAttribute("data-task-type") || cell.textContent; });
      });
      all(".benefit-reward-row:not(.is-head)", table).forEach(function (row) { row.remove(); });
      values.forEach(function (row) { appendRow(table, row); });
    });
    all(".benefit-config-row [data-module-value]").forEach(function (element) {
      var card = element.closest("[data-module]");
      var label = query("h3", card).textContent + "：" + element.previousElementSibling.textContent;
      var cell = inlineCell(element.textContent, label, false);
      if (card.getAttribute("data-module") === "depositChallenge" || card.getAttribute("data-module") === "tasks") {
        var input = query("input", cell);
        input.type = "number";
        input.min = "0";
        input.step = "0.01";
        input.value = element.textContent;
      }
      element.parentNode.replaceChild(cell, element);
    });
    savedState = captureState();
    try {
      var stored = JSON.parse(window.localStorage.getItem(storageKey) || "null");
      // Keep the historical binding payload unchanged for the global configuration migration.
      if (stored && stored.modules && Object.prototype.hasOwnProperty.call(stored.modules, "bindAccount")) {
        hasLegacyBinding = true;
        legacyBinding = stored.modules.bindAccount;
      }
      stored = migrateChallengeAmounts(migratePackRows(migrateTaskRows(stored, savedState.modules.tasks.settings[0])));
      if (validState(stored)) savedState = normalizeFixedRows(stored, savedState);
    } catch (error) { /* Defaults remain available when storage cannot be read. */ }
    restoreState(savedState);
    setEditing(false);
    ["input", "change"].forEach(function (name) {
      page.addEventListener(name, function (event) {
        if (editing && event.target.closest('[data-module-table="tasks"]')) syncTaskErrors();
      });
    });

    page.addEventListener("click", function (event) {
      var action = event.target.closest("[data-seven-edit]");
      if (action) {
        var value = action.getAttribute("data-seven-edit");
        if (value === "edit") beginEditing();
        if (value === "cancel") { restoreState(savedState); setEditing(false); }
        if (value === "save" && editing && validate()) {
          var next = captureState();
          if (hasLegacyBinding) next.modules.bindAccount = legacyBinding;
          try { window.localStorage.setItem(storageKey, JSON.stringify(next)); }
          catch (error) { message("保存失败，请检查浏览器存储空间后重试。", true); return; }
          savedState = next;
          restoreState(savedState);
          setEditing(false);
          message("七日福利配置已保存");
        }
        return;
      }
      var add = event.target.closest("[data-add-row]");
      if (add) {
        if (!editing || fixedRowCounts[add.getAttribute("data-add-row")]) return;
        var table = query('[data-module-table="' + add.getAttribute("data-add-row") + '"]');
        if (table) {
          var values = ["", ""];
          query("[data-inline-value]", appendRow(table, values)).focus();
        }
        return;
      }
      var remove = event.target.closest("[data-remove-row]");
      if (remove && editing) {
        var row = remove.closest("[data-tier-row]");
        if (fixedRowCounts[row.closest("[data-module-table]").getAttribute("data-module-table")]) return;
        var isTask = !!row.closest('[data-module-table="tasks"]');
        row.remove();
        if (isTask) syncTaskErrors();
        return;
      }
      var toggle = event.target.closest("[data-module-switch]");
      if (toggle && editing) {
        var card = toggle.closest("[data-module]");
        moduleState(card, card.getAttribute("data-enabled") !== "true");
        return;
      }
      if (event.target.closest("[data-seven-master-switch]") && editing) {
        var master = query("[data-seven-master-switch]");
        var on = master.getAttribute("aria-checked") !== "true";
        switchState(master, on);
        query("[data-seven-status]").textContent = on ? "已开启" : "已关闭";
        query("[data-seven-status]").classList.toggle("is-off", !on);
        return;
      }
      var moduleEdit = event.target.closest("[data-module-edit]");
      if (moduleEdit) {
        beginEditing();
        var first = query("[data-inline-value]", moduleEdit.closest("[data-module]"));
        if (first) first.focus();
      }
    });
  });
}());
