(function () {
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
        saveSnapshot(root);
        setEditMode(root, false);
      }
    });
  }

  function validateRange() {
    var min = document.querySelector(".js-range-min");
    var max = document.querySelector(".js-range-max");
    var warning = document.querySelector("[data-rule-warning]");
    if (!min || !max || !warning) return;

    var minValue = Number(min.value);
    var maxValue = Number(max.value);
    warning.hidden = !(Number.isFinite(minValue) && Number.isFinite(maxValue) && minValue > maxValue);
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

    document.querySelectorAll(".js-range-min, .js-range-max").forEach(function (input) {
      input.addEventListener("input", validateRange);
    });

    validateRange();
    initEditState(document.querySelector("[data-edit-root]"));
  });
})();
