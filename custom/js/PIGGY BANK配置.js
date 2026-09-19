(function () {
  var defaults = {
    activityName: "PIGGY BANK",
    masterOn: true,
    method: "recharge",
    payoutMethod: "manual",
    minimumClaimAmount: "1.00",
    wagerMultiplier: "1.50",
    vipRatios: {
      recharge: ["0.30", "0.40", "0.55", "0.70", "0.90", "1.10", "1.30", "1.50", "1.80", "2.10", "2.40", "2.70", "3.00", "3.50", "4.00"],
      wager: ["0.30", "0.40", "0.55", "0.70", "0.90", "1.10", "1.30", "1.50", "1.80", "2.10", "2.40", "2.70", "3.00", "3.50", "4.00"]
    }
  };

  var vipRatioState = {
    recharge: defaults.vipRatios.recharge.slice(),
    wager: defaults.vipRatios.wager.slice()
  };
  var editing = false;
  var savedState = null;

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function getMasterSwitch() {
    return document.querySelector("[data-piggy-master-switch]");
  }

  function setMasterState(isOn) {
    var masterSwitch = getMasterSwitch();
    var label = document.querySelector("[data-piggy-switch-label]");
    var sections = document.querySelectorAll("[data-piggy-section]");

    if (masterSwitch) {
      masterSwitch.classList.toggle("is-on", isOn);
      masterSwitch.setAttribute("aria-checked", isOn ? "true" : "false");
    }

    if (label) {
      label.textContent = isOn ? "已开启" : "已关闭";
      label.classList.toggle("is-off", !isOn);
    }

    sections.forEach(function (section) {
      section.classList.toggle("is-disabled", !isOn);
    });
  }

  function updateVipMethodTag(method) {
    var tag = document.querySelector("[data-vip-method-tag]");
    if (tag) {
      tag.textContent = "当前方式：" + (method === "wager" ? "打码按比例" : "充值");
    }
  }

  function updatePayoutDescription(payoutMethod) {
    var note = document.querySelector("[data-payout-note]");
    var wagerLabel = document.querySelector("[data-wager-label]");
    var wagerNote = document.querySelector("[data-wager-note]");
    var isAuto = payoutMethod === "auto";

    if (note) {
      note.textContent = isAuto
        ? "充值成功后自动到账；独立规则下不经过手动领取门槛。"
        : "手动领取时，玩家达到最低领取金额后可主动领取。";
    }
    if (wagerLabel) {
      wagerLabel.textContent = isAuto ? "独立规则打码倍数" : "打码倍数";
    }
    if (wagerNote) {
      wagerNote.textContent = isAuto
        ? "充值成功后自动转入余额；独立规则下有效投注额 = 充值后余额（含充值前已有余额）× 打码倍数。"
        : "领取前需完成可领取金额 × 打码倍数的有效投注。";
    }
  }

  function setPayoutMethod(payoutMethod) {
    var method = payoutMethod === "auto" ? "auto" : "manual";
    document.querySelectorAll("[data-payout-method]").forEach(function (input) {
      input.checked = input.value === method;
    });
    document.querySelectorAll("[data-payout-card]").forEach(function (card) {
      card.classList.toggle("is-selected", card.getAttribute("data-payout-card") === method);
    });
    updatePayoutDescription(method);
  }

  function saveVipRatios(method) {
    var inputs = document.querySelectorAll("[data-vip-ratio]");
    vipRatioState[method] = Array.prototype.map.call(inputs, function (input) {
      return input.value;
    });
  }

  function renderVipRatios(method) {
    var body = document.querySelector("[data-vip-ratio-body]");
    var ratios = vipRatioState[method] || [];
    var disabled = editing ? "" : " disabled";
    if (!body) return;

    body.innerHTML = ratios.map(function (ratio, index) {
      return "<tr>" +
        "<td><span class=\"vip-badge\">VIP" + (index + 1) + "</span></td>" +
        "<td><div class=\"ratio-input\"><input type=\"number\" min=\"0\" max=\"100\" step=\"0.01\" value=\"" + ratio + "\" data-vip-ratio" + disabled + "/><span>%</span></div></td>" +
      "</tr>";
    }).join("");
  }

  function setMethod(method, skipSave) {
    var table = document.querySelector("[data-vip-ratio-table]");
    var currentMethod = table && table.getAttribute("data-current-method");
    if (!skipSave && currentMethod && currentMethod !== method) {
      saveVipRatios(currentMethod);
    }

    document.querySelectorAll("[data-extract-method]").forEach(function (input) {
      input.checked = input.value === method;
    });

    document.querySelectorAll("[data-extract-card]").forEach(function (card) {
      card.classList.toggle("is-selected", card.getAttribute("data-extract-card") === method);
    });

    document.querySelectorAll("[data-extract-settings]").forEach(function (settings) {
      settings.hidden = settings.getAttribute("data-extract-settings") !== method;
    });

    var vipSection = document.querySelector("[data-vip-section]");
    if (vipSection) {
      vipSection.hidden = method !== "wager";
    }

    if (table) {
      table.setAttribute("data-current-method", method);
      renderVipRatios(method);
    }
    updateVipMethodTag(method);
  }

  function clampInput(input) {
    var value = Number(input.value);
    if (Number.isNaN(value)) {
      input.value = "0";
      return;
    }
    input.value = String(Math.min(100, Math.max(0, value)));
  }

  function normalizeMinimumClaimAmount(input) {
    var value = Number(input.value);
    if (!Number.isFinite(value) || value < 0) {
      input.value = "0.00";
      return;
    }
    input.value = value.toFixed(2);
  }

  function normalizeWagerMultiplier(input) {
    var value = Number(input.value);
    if (!Number.isFinite(value) || value < 0) {
      input.value = "0.00";
      return;
    }
    input.value = value.toFixed(2);
  }

  function normalizeActivityName(input) {
    if (!input) return defaults.activityName;
    var value = input.value.trim();
    if (!value) {
      value = defaults.activityName;
    }
    input.value = value;
    return value;
  }

  function cloneVipState(source) {
    return {
      recharge: source.recharge.slice(),
      wager: source.wager.slice()
    };
  }

  function captureState() {
    var masterSwitch = getMasterSwitch();
    var activityNameInput = document.querySelector("[data-activity-name]");
    var methodInput = document.querySelector("[data-extract-method]:checked");
    var payoutInput = document.querySelector("[data-payout-method]:checked");
    var minimumInput = document.querySelector("[data-claim-minimum]");
    var multiplierInput = document.querySelector("[data-wager-multiplier]");
    var table = document.querySelector("[data-vip-ratio-table]");
    var method = methodInput ? methodInput.value : defaults.method;
    var currentTableMethod = table && table.getAttribute("data-current-method");

    if (minimumInput) {
      normalizeMinimumClaimAmount(minimumInput);
    }
    if (multiplierInput) {
      normalizeWagerMultiplier(multiplierInput);
    }

    if (table && currentTableMethod) {
      saveVipRatios(currentTableMethod);
    }

    return {
      activityName: normalizeActivityName(activityNameInput),
      masterOn: !!(masterSwitch && masterSwitch.classList.contains("is-on")),
      method: method,
      payoutMethod: payoutInput ? payoutInput.value : defaults.payoutMethod,
      minimumClaimAmount: minimumInput ? minimumInput.value : defaults.minimumClaimAmount,
      wagerMultiplier: multiplierInput ? multiplierInput.value : defaults.wagerMultiplier,
      rechargeTiers: Array.prototype.map.call(document.querySelectorAll("[data-recharge-tier]"), function (input) {
        return input.value;
      }),
      vipRatios: cloneVipState(vipRatioState)
    };
  }

  function restoreState(state) {
    if (!state) return;
    vipRatioState = cloneVipState(state.vipRatios);
    var minimumInput = document.querySelector("[data-claim-minimum]");
    var multiplierInput = document.querySelector("[data-wager-multiplier]");
    var activityNameInput = document.querySelector("[data-activity-name]");
    if (activityNameInput) {
      activityNameInput.value = state.activityName || defaults.activityName;
    }
    if (minimumInput && state.minimumClaimAmount !== undefined) {
      minimumInput.value = state.minimumClaimAmount;
    }
    if (multiplierInput && state.wagerMultiplier !== undefined) {
      multiplierInput.value = state.wagerMultiplier;
    }
    setPayoutMethod(state.payoutMethod || defaults.payoutMethod);
    document.querySelectorAll("[data-recharge-tier]").forEach(function (input, index) {
      if (state.rechargeTiers[index] !== undefined) input.value = state.rechargeTiers[index];
    });
    setMasterState(state.masterOn);
    setMethod(state.method, true);
  }

  function setEditing(next) {
    editing = next;
    var page = document.querySelector(".piggy-config-page");
    var editables = document.querySelectorAll("[data-activity-name], [data-piggy-master-switch], [data-extract-method], [data-payout-method], [data-claim-minimum], [data-wager-multiplier], [data-recharge-tier], [data-recharge-tier-ratio], [data-vip-ratio]");
    var editButton = document.querySelector('[data-edit-action="edit"]');
    var cancelButton = document.querySelector('[data-edit-action="cancel"]');
    var saveButton = document.querySelector('[data-edit-action="save"]');
    var table = document.querySelector("[data-vip-ratio-table]");

    if (page) page.classList.toggle("is-readonly", !next);
    editables.forEach(function (control) {
      control.disabled = !next;
    });
    if (editButton) editButton.hidden = next;
    if (cancelButton) cancelButton.hidden = !next;
    if (saveButton) saveButton.hidden = !next;
    renderVipRatios(table ? table.getAttribute("data-current-method") : defaults.method);
  }

  function closeSaveModal() {
    var modal = document.querySelector("[data-save-modal]");
    if (modal) modal.hidden = true;
  }

  function showSaveState(message) {
    var state = document.querySelector("[data-save-state]");
    if (!state) return;
    state.textContent = message;
    window.setTimeout(function () {
      if (state.textContent === message) state.textContent = "";
    }, 2600);
  }

  ready(function () {
    var selectedMethod = document.querySelector("[data-extract-method]:checked");
    setMethod(selectedMethod ? selectedMethod.value : defaults.method, true);
    var selectedPayout = document.querySelector("[data-payout-method]:checked");
    setPayoutMethod(selectedPayout ? selectedPayout.value : defaults.payoutMethod);
    savedState = captureState();
    setEditing(false);

    document.addEventListener("change", function (event) {
      if (!editing) return;

      if (event.target.matches("[data-extract-method]")) {
        setMethod(event.target.value);
      }

      if (event.target.matches("[data-payout-method]")) {
        setPayoutMethod(event.target.value);
      }

      if (event.target.matches("[data-recharge-tier-ratio], [data-vip-ratio]")) {
        clampInput(event.target);
        var table = document.querySelector("[data-vip-ratio-table]");
        if (event.target.matches("[data-vip-ratio]") && table) {
          saveVipRatios(table.getAttribute("data-current-method") || defaults.method);
        }
      }

      if (event.target.matches("[data-claim-minimum]")) {
        normalizeMinimumClaimAmount(event.target);
      }

      if (event.target.matches("[data-wager-multiplier]")) {
        normalizeWagerMultiplier(event.target);
      }
    });

    document.addEventListener("click", function (event) {
      var action = event.target.closest("[data-edit-action]");
      var masterSwitch = event.target.closest("[data-piggy-master-switch]");

      if (action) {
        var actionName = action.getAttribute("data-edit-action");
        if (actionName === "edit") {
          savedState = captureState();
          setEditing(true);
        } else if (actionName === "cancel") {
          restoreState(savedState);
          setEditing(false);
          showSaveState("已取消编辑");
        } else if (actionName === "save") {
          var modal = document.querySelector("[data-save-modal]");
          if (modal) modal.hidden = false;
        }
        return;
      }

      if (masterSwitch) {
        if (!editing) return;
        setMasterState(!masterSwitch.classList.contains("is-on"));
        return;
      }

      if (event.target.closest("[data-close-save-modal]")) {
        closeSaveModal();
        return;
      }

      if (event.target.closest("[data-confirm-save]")) {
        savedState = captureState();
        closeSaveModal();
        setEditing(false);
        showSaveState("配置已保存");
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeSaveModal();
    });
  });
})();
