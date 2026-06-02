(function () {
  function initVipSettings() {
  var tabs = {
    level: {
      headers: ["VIP等级", "累计充值", "打码条件", "奖励金额"],
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
      headers: ["VIP等级", "保级充值条件", "保级打码条件", "未达标降至"],
      rows: [
        [1, "无条件", "无条件", "VIP1"],
        [2, 10, 100, "VIP1"],
        [3, 20, 200, "VIP2"],
        [4, 40, 400, "VIP3"],
        [5, 80, 800, "VIP4"],
        [6, 120, 1200, "VIP5"],
        [7, 160, 1600, "VIP6"],
        [8, 200, 2000, "VIP7"],
        [9, 250, 2500, "VIP8"],
        [10, 300, 3000, "VIP9"],
        [11, 400, 4000, "VIP10"],
        [12, 500, 5000, "VIP11"],
        [13, 600, 6000, "VIP12"],
        [14, 700, 7000, "VIP13"],
        [15, 800, 8000, "VIP14"]
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
  var table = document.querySelector(".vip-table");
  var editBtn = document.querySelector('[data-action="edit"]');
  var saveBtn = document.querySelector('[data-action="save"]');
  var cancelBtn = document.querySelector('[data-action="cancel"]');
  var modal = document.querySelector('[data-dialog="cancel"]');

  if (!table || !editBtn || !saveBtn || !cancelBtn || !modal) {
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
        var attrs = editable ? ' class="editable-cell" data-col="' + index + '"' : "";
        html += "<td" + attrs + ">" + cell + "</td>";
      });
      html += "</tr>";
    });

    table.innerHTML = html + "</tbody>";
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

  function setEditing(next) {
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
  }

  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      commitInput();
      activeTab = btn.dataset.tab;
      document.querySelectorAll(".tab-btn").forEach(function (item) {
        item.classList.toggle("is-active", item === btn);
      });
      render();
    });
  });

  editBtn.addEventListener("click", function () {
    setEditing(true);
  });

  saveBtn.addEventListener("click", function () {
    commitInput();
    setEditing(false);
  });

  cancelBtn.addEventListener("click", function () {
    modal.hidden = false;
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
    if (!activeInput) {
      return;
    }
    if (event.key === "Enter") {
      commitInput();
    }
  });

  document.querySelectorAll("[data-dialog-close]").forEach(function (btn) {
    btn.addEventListener("click", closeModal);
  });

  document.querySelector('[data-action="confirm-cancel"]').addEventListener("click", function () {
    closeModal();
    setEditing(false);
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
