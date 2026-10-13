(function () {
  function initVipSettings() {
  var tabMeta = {
    level: {
      switchLabel: "",
      enabled: true,
      offHint: ""
    },
    keep: {
      switchLabel: "VIP降级配置",
      enabled: true,
      onHint: "开启后，当前设置生效。",
      offHint: "关闭后，VIP降级配置不生效。"
    },
    daily: {
      switchLabel: "日俸禄",
      enabled: true,
      onHint: "开启后，当前设置生效。",
      offHint: "关闭后，日俸禄设置不生效。"
    },
    weekly: {
      switchLabel: "周俸禄",
      enabled: true,
      onHint: "开启后，当前设置生效。",
      offHint: "关闭后，周俸禄设置不生效。"
    },
    monthly: {
      switchLabel: "月俸禄",
      enabled: true,
      onHint: "开启后，当前设置生效。",
      offHint: "关闭后，月俸禄设置不生效。"
    },
    whale: {
      switchLabel: "",
      enabled: true,
      offHint: ""
    }
  };

  var tabs = {
    level: {
      headers: ["VIP等级", "累计充值", "累计打码", "奖励金额"],
      rows: [
        [1, 0, 0, 0],
        [2, 20, 100, 20],
        [3, 50, 200, 40],
        [4, 100, 400, 100],
        [5, 150, 500, 200],
        [6, 200, 1000, 400],
        [7, 400, 1500, 600],
        [8, 800, 2000, 800],
        [9, 1000, 3000, 1000],
        [10, 1500, 4000, 1200],
        [11, 2000, 5000, 1400],
        [12, 4000, 7000, 1600],
        [13, 8000, 8000, 2000],
        [14, 10000, 12000, 2500],
        [15, 15000, 20000, 3000]
      ],
      focusLevel: 2
    },
    keep: {
      headers: ["VIP等级", "保级充值条件", "保级打码条件"],
      rows: [
        [1, "无条件", "无条件"],
        [2, 10, 100],
        [3, 20, 200],
        [4, 40, 400],
        [5, 80, 800],
        [6, 120, 1200],
        [7, 160, 1600],
        [8, 200, 2000],
        [9, 250, 2500],
        [10, 300, 3000],
        [11, 400, 4000],
        [12, 500, 5000],
        [13, 600, 6000],
        [14, 700, 7000],
        [15, 800, 8000]
      ],
      focusLevel: null
    },
    daily: {
      headers: ["VIP等级", "累计充值", "打码条件", "俸禄金额"],
      rows: [
        [1, 50, 100, 10],
        [2, 100, 200, 20],
        [3, 200, 400, 40],
        [4, 300, 800, 80],
        [5, 400, 1200, 120],
        [6, 500, 1800, 200],
        [7, 600, 2500, 250],
        [8, 700, 4000, 400],
        [9, 800, 8000, 800],
        [10, 900, 12000, 1200],
        [11, 1000, 30000, 2000],
        [12, 1100, 40000, 2500],
        [13, 1200, 80000, 3000],
        [14, 1300, 150000, 4000],
        [15, 1500, 200000, 5000]
      ],
      focusLevel: null
    },
    weekly: {
      headers: ["VIP等级", "累计充值", "打码条件", "俸禄金额"],
      rows: [
        [1, 500, 1000, 100],
        [2, 1000, 2000, 200],
        [3, 2000, 4000, 400],
        [4, 3000, 8000, 800],
        [5, 4000, 12000, 1200],
        [6, 5000, 18000, 2000],
        [7, 6000, 25000, 2500],
        [8, 7000, 40000, 4000],
        [9, 8000, 80000, 8000],
        [10, 9000, 120080, 12000],
        [11, 10000, 300000, 20000],
        [12, 11000, 400000, 25000],
        [13, 12000, 800000, 30000],
        [14, 13000, 1500000, 40000],
        [15, 15000, 2000000, 50000]
      ],
      focusLevel: 2
    },
    monthly: {
      headers: ["VIP等级", "累计充值", "打码条件", "俸禄金额"],
      rows: [
        [1, 5000, 10000, 1000],
        [2, 10000, 20000, 2000],
        [3, 20000, 40000, 4000],
        [4, 30000, 80000, 8000],
        [5, 40000, 120000, 12000],
        [6, 50000, 180000, 20000],
        [7, 60000, 250000, 25000],
        [8, 70000, 400000, 40000],
        [9, 80000, 800000, 80000],
        [10, 90000, 1200000, 120000],
        [11, 100000, 3000000, 200000],
        [12, 110000, 4000000, 250000],
        [13, 120000, 8000000, 300000],
        [14, 130000, 15000000, 400000],
        [15, 150000, 20000000, 500000]
      ],
      focusLevel: null
    },
    whale: {
      headers: ["类型", "累计充值"],
      rows: [
        ["小R玩家", 1000000],
        ["中R玩家", 10000000],
        ["大R玩家", 100000000]
      ],
      focusLevel: null
    }
  };

  var activeTab = "level";
  var editing = false;
  var activeInput = null;
  var keepPeriod = "month";
  var editSnapshot = null;
  var tabNames = {
    level: "VIP晋级条件",
    keep: "VIP降级配置",
    daily: "日俸禄",
    weekly: "周俸禄",
    monthly: "月俸禄",
    whale: "大R等级定义"
  };
  var page = document.querySelector(".vip-settings-page");
  var table = document.querySelector(".vip-table");
  var editBtn = document.querySelector('[data-action="edit"]');
  var saveBtn = document.querySelector('[data-action="save"]');
  var cancelBtn = document.querySelector('[data-action="cancel"]');
  var modal = document.querySelector('[data-dialog="cancel"]');
  var confirmCancelBtn = document.querySelector('[data-action="confirm-cancel"]');
  var sectionTitle = document.querySelector(".vip-section-title");
  var toggleTitle = document.querySelector(".vip-toggle-title");
  var toggleHint = document.querySelector(".vip-toggle-hint");
  var toggleBtn = document.querySelector('[data-action="toggle-setting"]');
  var toggleText = toggleBtn ? toggleBtn.querySelector(".feature-switch-text") : null;
  var tablePanel = document.querySelector(".vip-table-panel");
  var keepPeriodPanel = document.querySelector(".vip-keep-period");
  var keepPeriodInputs = document.querySelectorAll('input[name="keep-period"]');
  var keepPeriodHint = document.querySelector(".vip-period-hint");

  if (!page || !table || !editBtn || !saveBtn || !cancelBtn || !modal || !confirmCancelBtn || !sectionTitle || !toggleTitle || !toggleHint || !toggleBtn || !toggleBtn.parentElement || !toggleText || !tablePanel || !keepPeriodPanel || !keepPeriodHint || keepPeriodInputs.length !== 2) {
    return;
  }

  function render() {
    var data = tabs[activeTab];
    var editableIndexes = getEditableIndexes(data);
    var html = "<thead><tr>" + data.headers.map(function (header, index) {
      var className = editing && editableIndexes.indexOf(index) > -1 ? ' class="editable-heading"' : "";
      return "<th" + className + ">" + header + "</th>";
    }).join("") + "</tr></thead><tbody>";

    data.rows.forEach(function (row) {
      var focusClass = data.focusLevel && row[0] === data.focusLevel ? ' class="is-focus-row"' : "";
      html += "<tr" + focusClass + ">";
      row.forEach(function (cell, index) {
        var editable = editing && editableIndexes.indexOf(index) > -1 && isNumeric(cell);
        var attrs = editable ? ' class="editable-cell" tabindex="0" data-col="' + index + '"' : "";
        html += "<td" + attrs + ">" + cell + "</td>";
      });
      html += "</tr>";
    });

    table.innerHTML = html + "</tbody>";
    table.dataset.tab = activeTab;
    table.setAttribute("aria-label", tabNames[activeTab]);
    page.classList.toggle("is-editing", editing);
    document.querySelectorAll(".tab-btn").forEach(function (btn) {
      var selected = btn.dataset.tab === activeTab;
      btn.classList.toggle("is-active", selected);
      btn.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    renderToggleBar();
    renderKeepPeriod();
    tablePanel.classList.toggle("is-disabled", isSwitchableTab(activeTab) && !tabMeta[activeTab].enabled);
  }

  function renderKeepPeriod() {
    keepPeriodPanel.hidden = activeTab !== "keep";
    keepPeriodHint.hidden = activeTab !== "keep";
    keepPeriodInputs.forEach(function (input) {
      input.checked = input.value === keepPeriod;
      input.disabled = !editing || activeTab !== "keep";
      if (input.parentElement) {
        input.parentElement.classList.toggle("is-selected", input.checked);
      }
    });
    keepPeriodHint.textContent = keepPeriod === "week"
      ? "自然周：周一00:00至下周一00:00；周期结束未达标降一级，最低VIP1。"
      : "自然月：每月1日00:00至次月1日00:00；周期结束未达标降一级，最低VIP1。";
    keepPeriodHint.title = keepPeriodHint.textContent;
  }

  function renderToggleBar() {
    sectionTitle.hidden = isSwitchableTab(activeTab);
    toggleHint.hidden = activeTab === "keep";
    if (!isSwitchableTab(activeTab)) {
      toggleBtn.parentElement.hidden = true;
      sectionTitle.textContent = tabNames[activeTab];
      toggleHint.textContent = activeTab === "level"
        ? "按VIP等级设置累计充值、累计打码门槛及晋级奖励。"
        : "按累计充值设置小R、中R和大R玩家的等级定义。";
      return;
    }

    var meta = tabMeta[activeTab];
    toggleBtn.parentElement.hidden = false;
    toggleTitle.textContent = meta.switchLabel;
    toggleHint.textContent = meta.enabled ? (meta.onHint || "开启后，当前设置生效。") : meta.offHint;
    toggleBtn.classList.toggle("is-on", meta.enabled);
    toggleBtn.setAttribute("aria-checked", meta.enabled ? "true" : "false");
    toggleText.textContent = meta.enabled ? "已开启" : "已关闭";
  }

  function getEditableIndexes(data) {
    if (activeTab === "whale") {
      return [1];
    }
    return data.headers.map(function (_, index) { return index; }).filter(function (index) { return index > 0; });
  }

  function isNumeric(value) {
    return typeof value === "number" || /^\d+$/.test(String(value));
  }

  function isSwitchableTab(tabKey) {
    return !!tabMeta[tabKey] && !!tabMeta[tabKey].switchLabel;
  }

  function setEditing(next) {
    if (next && !editing) {
      editSnapshot = {
        tabs: JSON.parse(JSON.stringify(tabs)),
        tabMeta: JSON.parse(JSON.stringify(tabMeta)),
        keepPeriod: keepPeriod
      };
    }
    editing = next;
    editBtn.hidden = next;
    saveBtn.hidden = !next;
    cancelBtn.hidden = !next;
    activeInput = null;
    render();
  }

  function openStepper(cell) {
    if (!editing || !cell.classList.contains("editable-cell")) {
      return;
    }
    if (activeInput && activeInput.cell === cell) {
      return;
    }
    commitInput();

    var value = parseInt(cell.textContent, 10) || 0;
    cell.dataset.value = String(value);
    cell.innerHTML = '<div class="number-stepper"><input type="text" value="' + value + '"/><span class="step-controls"><button type="button" data-step="1">+</button><button type="button" data-step="-1">−</button></span></div>';
    var input = cell.querySelector("input");
    var data = tabs[activeTab];
    var row = data.rows[cell.parentElement.rowIndex - 1];
    var rowLabel = activeTab === "whale" ? String(row[0]) : "VIP" + row[0];
    input.setAttribute("aria-label", rowLabel + " " + data.headers[Number(cell.dataset.col)]);
    activeInput = { cell: cell, input: input };
    input.focus();
    input.select();
  }

  function commitInput() {
    if (!activeInput) {
      return;
    }
    var value = parseInt(activeInput.input.value, 10);
    if (isNaN(value) || value < 0) {
      value = 0;
    }
    activeInput.cell.textContent = value;
    activeInput.cell.dataset.value = String(value);
    updateData(activeInput.cell, value);
    activeInput = null;
  }

  function updateData(cell, value) {
    var rowIndex = cell.parentElement.rowIndex - 1;
    var colIndex = Number(cell.dataset.col);
    tabs[activeTab].rows[rowIndex][colIndex] = value;
  }

  function closeModal() {
    modal.hidden = true;
    if (editing) {
      cancelBtn.focus();
    }
  }

  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      commitInput();
      activeTab = btn.dataset.tab;
      render();
    });
  });

  editBtn.addEventListener("click", function () {
    setEditing(true);
  });

  keepPeriodInputs.forEach(function (input) {
    input.addEventListener("change", function () {
      if (!editing || activeTab !== "keep" || !input.checked || (input.value !== "week" && input.value !== "month")) {
        return;
      }
      commitInput();
      keepPeriod = input.value;
      renderKeepPeriod();
    });
  });

  toggleBtn.addEventListener("click", function () {
    if (!isSwitchableTab(activeTab)) {
      return;
    }
    commitInput();
    tabMeta[activeTab].enabled = !tabMeta[activeTab].enabled;
    renderToggleBar();
    tablePanel.classList.toggle("is-disabled", !tabMeta[activeTab].enabled);
  });

  saveBtn.addEventListener("click", function () {
    commitInput();
    editSnapshot = null;
    setEditing(false);
    editBtn.focus();
  });

  cancelBtn.addEventListener("click", function () {
    commitInput();
    modal.hidden = false;
    var continueBtn = modal.querySelector(".confirm-footer [data-dialog-close]") || modal.querySelector("[data-dialog-close]");
    if (continueBtn) {
      continueBtn.focus();
    }
  });

  table.addEventListener("click", function (event) {
    var step = event.target.dataset.step;
    if (step && activeInput) {
      var next = (parseInt(activeInput.input.value, 10) || 0) + Number(step);
      activeInput.input.value = Math.max(0, next);
      activeInput.input.focus();
      return;
    }
    var cell = event.target.closest("td");
    if (cell) {
      openStepper(cell);
    }
  });

  table.addEventListener("keydown", function (event) {
    if (activeInput && activeInput.cell.contains(event.target)) {
      if (event.key === "Enter") {
        event.preventDefault();
        var cell = activeInput.cell;
        commitInput();
        cell.focus();
      }
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("td.editable-cell")) {
      event.preventDefault();
      openStepper(event.target);
    }
  });

  document.querySelectorAll("[data-dialog-close]").forEach(function (btn) {
    btn.addEventListener("click", closeModal);
  });

  confirmCancelBtn.addEventListener("click", function () {
    activeInput = null;
    if (editSnapshot) {
      tabs = editSnapshot.tabs;
      tabMeta = editSnapshot.tabMeta;
      keepPeriod = editSnapshot.keepPeriod;
    }
    editSnapshot = null;
    modal.hidden = true;
    setEditing(false);
    editBtn.focus();
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".editable-cell") && !event.target.closest(".number-stepper")) {
      commitInput();
    }
  });

  render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initVipSettings);
  } else {
    initVipSettings();
  }
})();
