(function () {
  var RESULT_MULTIPLIERS = [2, 5, 10, 20, 22, 25, 30, 50, 55, 75, 100];
  var THEORETICAL_MIN_MULTIPLE = 2;
  var THEORETICAL_MAX_MULTIPLE = 1000;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function toggleSwitch(button) {
    var isOn = !button.classList.contains("is-on");
    button.classList.toggle("is-on", isOn);
    var field = button.closest(".piggy-switch-field");
    var label = field ? field.querySelector("[data-switch-label]") : null;
    if (label) {
      label.textContent = isOn ? (button.dataset.onLabel || "已开启") : (button.dataset.offLabel || "已关闭");
    }
  }

  function getEditableControls(root) {
    return Array.prototype.slice.call(root.querySelectorAll("input, select, textarea, .js-switch"))
      .filter(function (control) {
        return !control.closest(".piggy-form-actions");
      });
  }

  function getActionButtons(root) {
    var page = root.closest(".piggy-config-page") || root;
    return page.querySelectorAll("[data-edit-action]");
  }

  function hasSnapshotChanged(root) {
    return getEditableControls(root).some(function (control) {
      if (control.classList.contains("js-switch")) {
        return (control.classList.contains("is-on") ? "1" : "0") !== control.dataset.snapshotOn;
      }

      return control.value !== control.dataset.snapshotValue;
    });
  }

  function updateDirtyState(root) {
    root.dataset.hasUnsavedChanges = hasSnapshotChanged(root) ? "1" : "0";
  }

  function saveSnapshot(root) {
    getEditableControls(root).forEach(function (control) {
      if (control.classList.contains("js-switch")) {
        control.dataset.snapshotOn = control.classList.contains("is-on") ? "1" : "0";
        return;
      }

      control.dataset.snapshotValue = control.value;
    });
  }

  function restoreSnapshot(root) {
    getEditableControls(root).forEach(function (control) {
      if (control.classList.contains("js-switch")) {
        control.classList.toggle("is-on", control.dataset.snapshotOn !== "0");
        var field = control.closest(".piggy-switch-field");
        var label = field ? field.querySelector("[data-switch-label]") : null;
        if (label) {
          label.textContent = control.classList.contains("is-on") ? (control.dataset.onLabel || "已开启") : (control.dataset.offLabel || "已关闭");
        }
        return;
      }

      if (Object.prototype.hasOwnProperty.call(control.dataset, "snapshotValue")) {
        control.value = control.dataset.snapshotValue;
      }
    });
  }

  function setEditMode(root, editing) {
    root.classList.toggle("is-editing", editing);
    root.classList.toggle("is-readonly", !editing);

    getEditableControls(root).forEach(function (control) {
      control.disabled = !editing;
    });

    Array.prototype.forEach.call(getActionButtons(root), function (button) {
      var action = button.getAttribute("data-edit-action");
      button.hidden = editing ? action === "edit" : action !== "edit";
    });

    if (!editing) {
      validateRange();
    }
  }

  function initEditState(root) {
    if (!root) return;
    var page = root.closest(".piggy-config-page") || root;
    saveSnapshot(root);
    updateDirtyState(root);
    setEditMode(root, false);

    page.addEventListener("click", function (event) {
      var actionButton = event.target.closest("[data-edit-action]");
      if (!actionButton) return;

      var action = actionButton.getAttribute("data-edit-action");
      if (action === "edit") {
        setEditMode(root, true);
        updateDirtyState(root);
        return;
      }

      if (action === "cancel") {
        restoreSnapshot(root);
        updateDirtyState(root);
        setEditMode(root, false);
        return;
      }

      if (action === "save") {
        if (!validateRange()) {
          var firstInvalid = root.querySelector('[aria-invalid="true"]');
          var warning = root.querySelector("[data-rule-warning]");
          var target = firstInvalid || warning;
          if (target) {
            if (typeof target.focus === "function" && firstInvalid) target.focus();
            target.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          return;
        }

        saveSnapshot(root);
        updateDirtyState(root);
        setEditMode(root, false);
      }
    });

    root.addEventListener("input", function () {
      if (root.classList.contains("is-editing")) updateDirtyState(root);
    });
  }

  function formatAmount(value) {
    return Number.isFinite(value) ? value.toFixed(2) : "--";
  }

  function getReachableTotals(spinCount, betValue, minValue, maxValue) {
    if (!Number.isInteger(spinCount) || spinCount < 1 || !Number.isFinite(betValue) || betValue <= 0) {
      return [];
    }

    var reachable = new Set([0]);

    for (var spin = 0; spin < spinCount; spin += 1) {
      var next = new Set();
      reachable.forEach(function (totalMultiple) {
        RESULT_MULTIPLIERS.forEach(function (multiple) {
          next.add(totalMultiple + multiple);
        });
      });
      reachable = next;
    }

    return Array.from(reachable).filter(function (totalMultiple) {
      var amount = totalMultiple * betValue;
      return amount + 0.000001 >= minValue && amount - 0.000001 <= maxValue;
    });
  }

  function updateRangeHelp(theoreticalMin, theoreticalMax, reachableCount, isComplete) {
    var theoreticalRange = document.querySelector("[data-theoretical-range]");
    var reachableSummary = document.querySelector("[data-reachable-summary]");

    if (theoreticalRange) {
      theoreticalRange.textContent = "理论最低金额：" + formatAmount(theoreticalMin) + "；理论最高金额：" + formatAmount(theoreticalMax);
    }

    if (!reachableSummary) return;

    reachableSummary.classList.toggle("is-valid", isComplete && reachableCount > 0);
    reachableSummary.classList.toggle("is-invalid", isComplete && reachableCount === 0);

    if (!isComplete) {
      reachableSummary.textContent = "填写完整配置后，将自动校验可达结果。";
    } else if (reachableCount > 0) {
      reachableSummary.textContent = "当前范围内存在 " + reachableCount + " 个可达结果，可以保存。";
    } else {
      reachableSummary.textContent = "当前范围内不存在可达结果，无法保存。";
    }
  }

  function validateRange() {
    var min = document.querySelector(".js-range-min");
    var max = document.querySelector(".js-range-max");
    var count = document.querySelector(".js-spin-count");
    var bet = document.querySelector(".js-bet-value");
    var warning = document.querySelector("[data-rule-warning]");
    if (!min || !max || !warning) return;

    var minValue = Number(min.value);
    var maxValue = Number(max.value);
    var countValue = count ? Number(count.value) : NaN;
    var betValue = bet ? Number(bet.value) : NaN;
    var baseValuesValid = Number.isInteger(countValue) && countValue >= 1 && Number.isFinite(betValue) && betValue > 0;
    var rangeValuesValid = Number.isFinite(minValue) && Number.isFinite(maxValue);
    var theoreticalMin = baseValuesValid ? THEORETICAL_MIN_MULTIPLE * countValue * betValue : NaN;
    var theoreticalMax = baseValuesValid ? THEORETICAL_MAX_MULTIPLE * countValue * betValue : NaN;
    var reachableTotals = baseValuesValid && rangeValuesValid
      ? getReachableTotals(countValue, betValue, minValue, maxValue)
      : [];
    var rangeCanBeChecked = baseValuesValid &&
      rangeValuesValid &&
      minValue <= maxValue &&
      minValue >= theoreticalMin &&
      maxValue <= theoreticalMax;
    var messages = [];
    var countInvalid = !Number.isInteger(countValue) || countValue < 1;
    var betInvalid = !Number.isFinite(betValue) || betValue <= 0;
    var minInvalid = !Number.isFinite(minValue) || (rangeValuesValid && minValue > maxValue);
    var maxInvalid = !Number.isFinite(maxValue) || (rangeValuesValid && minValue > maxValue);

    if (!baseValuesValid) {
      messages.push("请输入有效的免费 SPIN 次数和 BET 值。");
    }

    if (!rangeValuesValid) {
      messages.push("请输入完整的最终总金额范围。");
    } else if (minValue > maxValue) {
      messages.push("最终总金额最小值不能大于最大值。");
    }

    if (baseValuesValid && rangeValuesValid && minValue < theoreticalMin) {
      minInvalid = true;
      messages.push("最终总金额下限不得低于理论最低金额 " + formatAmount(theoreticalMin) + "。");
    }

    if (baseValuesValid && rangeValuesValid && maxValue > theoreticalMax) {
      maxInvalid = true;
      messages.push("最终总金额上限不得高于理论最高金额 " + formatAmount(theoreticalMax) + "。");
    }

    if (
      rangeCanBeChecked &&
      reachableTotals.length === 0
    ) {
      minInvalid = true;
      maxInvalid = true;
      messages.push("当前金额范围内没有可生成的结果，请调整金额范围、BET 值或免费 SPIN 次数后重试。");
    }

    if (count) count.setAttribute("aria-invalid", countInvalid ? "true" : "false");
    if (bet) bet.setAttribute("aria-invalid", betInvalid ? "true" : "false");
    min.setAttribute("aria-invalid", minInvalid ? "true" : "false");
    max.setAttribute("aria-invalid", maxInvalid ? "true" : "false");
    var rangeControl = min.closest(".piggy-inline-inputs");
    if (rangeControl) rangeControl.classList.toggle("has-error", minInvalid || maxInvalid);

    updateRangeHelp(theoreticalMin, theoreticalMax, reachableTotals.length, rangeCanBeChecked);

    warning.hidden = messages.length === 0;
    warning.textContent = messages.join(" ");
    return messages.length === 0;
  }

  ready(function () {
    document.addEventListener("click", function (event) {
      var switchButton = event.target.closest(".js-switch");
      if (switchButton) {
        var root = switchButton.closest("[data-edit-root]");
        if (!root || !root.classList.contains("is-editing")) return;
        toggleSwitch(switchButton);
        updateDirtyState(root);
      }
    });

    document.querySelectorAll(".js-range-min, .js-range-max, .js-spin-count, .js-bet-value").forEach(function (input) {
      input.addEventListener("input", validateRange);
    });

    validateRange();
    initEditState(document.querySelector("[data-edit-root]"));

    window.addEventListener("beforeunload", function (event) {
      var dirtyRoot = document.querySelector('[data-edit-root][data-has-unsaved-changes="1"]');
      if (!dirtyRoot) return;
      event.preventDefault();
      event.returnValue = "";
    });
  });
})();
