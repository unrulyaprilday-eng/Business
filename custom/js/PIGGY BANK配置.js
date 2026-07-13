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

    Array.prototype.forEach.call(root.querySelectorAll("[data-edit-action]"), function (button) {
      var action = button.getAttribute("data-edit-action");
      button.hidden = editing ? action === "edit" : action !== "edit";
    });

    if (!editing) {
      validateRange();
    }
  }

  function initEditState(root) {
    if (!root) return;
    saveSnapshot(root);
    setEditMode(root, false);

    root.addEventListener("click", function (event) {
      var actionButton = event.target.closest("[data-edit-action]");
      if (!actionButton) return;

      var action = actionButton.getAttribute("data-edit-action");
      if (action === "edit") {
        setEditMode(root, true);
        return;
      }

      if (action === "cancel") {
        restoreSnapshot(root);
        setEditMode(root, false);
        return;
      }

      if (action === "save") {
        if (!validateRange()) {
          return;
        }

        saveSnapshot(root);
        setEditMode(root, false);
      }
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

    if (!baseValuesValid) {
      messages.push("请输入有效的免费 SPIN 次数和 BET 值。");
    }

    if (!rangeValuesValid) {
      messages.push("请输入完整的最终总金额范围。");
    } else if (minValue > maxValue) {
      messages.push("最终总金额最小值不能大于最大值。");
    }

    if (baseValuesValid && rangeValuesValid && minValue < theoreticalMin) {
      messages.push("最终总金额下限不得低于理论最低金额 " + formatAmount(theoreticalMin) + "。");
    }

    if (baseValuesValid && rangeValuesValid && maxValue > theoreticalMax) {
      messages.push("最终总金额上限不得高于理论最高金额 " + formatAmount(theoreticalMax) + "。");
    }

    if (
      rangeCanBeChecked &&
      reachableTotals.length === 0
    ) {
      messages.push("当前金额范围内没有可生成的结果，请调整金额范围、BET 值或免费 SPIN 次数后重试。");
    }

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
        if (root && !root.classList.contains("is-editing")) {
          return;
        }
        toggleSwitch(switchButton);
      }
    });

    document.querySelectorAll(".js-range-min, .js-range-max, .js-spin-count, .js-bet-value").forEach(function (input) {
      input.addEventListener("input", validateRange);
    });

    validateRange();
    initEditState(document.querySelector("[data-edit-root]"));
  });
})();
