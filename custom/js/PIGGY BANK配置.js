(function () {
  var defaults = {
    masterOn: true,
    method: "recharge",
    rechargeTiers: ["1", "499", "20", "500", "999", "40", "1000", "4999", "60", "5000", "100"],
    vipRatios: {
      recharge: ["0.30", "0.40", "0.55", "0.70", "0.90", "1.10", "1.30", "1.50", "1.80", "2.10", "2.40", "2.70", "3.00", "3.50", "4.00"],
      wager: ["0.30", "0.40", "0.55", "0.70", "0.90", "1.10", "1.30", "1.50", "1.80", "2.10", "2.40", "2.70", "3.00", "3.50", "4.00"]
    }
  };

  var vipRatioState = {
    recharge: defaults.vipRatios.recharge.slice(),
    wager: defaults.vipRatios.wager.slice()
  };

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
      masterSwitch.setAttribute("aria-pressed", isOn ? "true" : "false");
    }

    if (label) {
      label.textContent = isOn ? "已开启" : "已关闭";
      label.classList.toggle("is-off", !isOn);
    }

    sections.forEach(function (section) {
      section.classList.toggle("is-disabled", !isOn);
    });
  }

  function updateVipMethodCopy(method) {
    var methodName = method === "wager" ? "打码按比例" : "充值";
    var tag = document.querySelector("[data-vip-method-tag]");
    if (tag) {
      tag.textContent = "当前方式：" + methodName;
    }
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
    if (!body) return;

    body.innerHTML = ratios.map(function (ratio, index) {
      return "<tr>" +
        "<td><span class=\"vip-badge\">VIP" + (index + 1) + "</span></td>" +
        "<td><div class=\"ratio-input\"><input type=\"number\" min=\"0\" max=\"100\" step=\"0.01\" value=\"" + ratio + "\" data-vip-ratio/><span>%</span></div></td>" +
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
    updateVipMethodCopy(method);
  }

  function clampInput(input) {
    var value = Number(input.value);
    if (Number.isNaN(value)) {
      input.value = "0";
      return;
    }
    input.value = String(Math.min(100, Math.max(0, value)));
  }

  function restoreDefaults() {
    vipRatioState = {
      recharge: defaults.vipRatios.recharge.slice(),
      wager: defaults.vipRatios.wager.slice()
    };
    setMasterState(defaults.masterOn);
    setMethod(defaults.method, true);
    var tierInputs = document.querySelectorAll("[data-recharge-tier]");

    tierInputs.forEach(function (input, index) {
      if (defaults.rechargeTiers[index] !== undefined) input.value = defaults.rechargeTiers[index];
    });
    renderVipRatios(defaults.method);
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

    document.addEventListener("change", function (event) {
      if (event.target.matches("[data-extract-method]")) {
        setMethod(event.target.value);
      }

      if (event.target.matches("[data-config-input], [data-recharge-tier-ratio], [data-vip-ratio]")) {
        clampInput(event.target);
        var table = document.querySelector("[data-vip-ratio-table]");
        if (event.target.matches("[data-vip-ratio]") && table) {
          saveVipRatios(table.getAttribute("data-current-method") || defaults.method);
        }
      }
    });

    document.addEventListener("click", function (event) {
      var masterSwitch = event.target.closest("[data-piggy-master-switch]");
      if (masterSwitch) {
        setMasterState(!masterSwitch.classList.contains("is-on"));
        return;
      }

      if (event.target.closest("[data-reset-config]")) {
        restoreDefaults();
        showSaveState("已恢复默认值，尚未保存");
        return;
      }

      if (event.target.closest("[data-save-config]")) {
        var vipTable = document.querySelector("[data-vip-ratio-table]");
        if (vipTable) saveVipRatios(vipTable.getAttribute("data-current-method") || defaults.method);
        var modal = document.querySelector("[data-save-modal]");
        if (modal) modal.hidden = false;
        return;
      }

      if (event.target.closest("[data-close-save-modal]")) {
        closeSaveModal();
        return;
      }

      if (event.target.closest("[data-confirm-save]")) {
        closeSaveModal();
        showSaveState("配置已保存");
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeSaveModal();
    });
  });
})();
