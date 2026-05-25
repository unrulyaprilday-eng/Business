(function () {
  function show(el) {
    if (el) el.hidden = false;
  }

  function hide(el) {
    if (el) el.hidden = true;
  }

  var tabs = document.querySelectorAll(".task-tab");
  var panels = document.querySelectorAll(".task-panel");
  var metricTitles = {
    recharge: "累计充值金额",
    wager: "累计打码金额",
    single: "单局打码金额"
  };

  var metricRows = {
    daily: {
      recharge: [
        ["100", "5", "8", "每日累计充值100"],
        ["300", "15", "15", "每日累计充值300"],
        ["500", "30", "30", "每日累计充值500"]
      ],
      wager: [
        ["1000", "10", "15", ""],
        ["1500", "20", "20", ""],
        ["2000", "30", "16", ""]
      ],
      single: [
        ["200", "8", "8", "单局有效打码达到200"],
        ["500", "18", "18", "单局有效打码达到500"],
        ["1000", "38", "38", "单局有效打码达到1000"]
      ]
    },
    weekly: {
      recharge: [
        ["500", "20", "20", "每周累计充值500"],
        ["1000", "50", "40", "每周累计充值1000"],
        ["3000", "120", "90", "每周累计充值3000"]
      ],
      wager: [
        ["3000", "30", "30", ""],
        ["5000", "60", "45", ""],
        ["8000", "100", "80", ""]
      ],
      single: [
        ["500", "20", "20", "单局有效打码达到500"],
        ["1200", "55", "45", "单局有效打码达到1200"],
        ["3000", "150", "100", "单局有效打码达到3000"]
      ]
    }
  };

  function renderCycleRows(panel, metric) {
    var panelName = panel.getAttribute("data-panel");
    var isEdit = panel.getAttribute("data-mode") === "edit";
    var rows = metricRows[panelName][metric];
    var title = panel.querySelector(".metric-title");
    var body = panel.querySelector(".cycle-body");
    if (title) title.textContent = metricTitles[metric];
    if (!body) return;

    body.innerHTML = rows.map(function (row) {
      if (isEdit) {
        return "<tr>" +
          "<td><input type=\"number\" value=\"" + row[0] + "\"/></td>" +
          "<td><input type=\"number\" value=\"" + row[1] + "\"/></td>" +
          "<td><input type=\"number\" value=\"" + row[2] + "\"/></td>" +
          "<td><input type=\"text\" value=\"" + row[3] + "\" placeholder=\"请输入任务介绍\"/></td>" +
          "<td>-</td>" +
          "</tr>";
      }
      return "<tr>" +
        "<td data-value=\"" + row[0] + "\">" + row[0] + "</td>" +
        "<td data-value=\"" + row[1] + "\">" + row[1] + "</td>" +
        "<td data-value=\"" + row[2] + "\">" + row[2] + "</td>" +
        "<td data-value=\"" + row[3] + "\">" + (row[3] || "-") + "</td>" +
        "<td>-</td>" +
        "</tr>";
    }).join("");
  }

  function getActiveMetric(panel) {
    var active = panel.querySelector(".segment.active");
    return active ? active.getAttribute("data-metric") : "recharge";
  }

  function setCycleMode(panel, mode) {
    panel.setAttribute("data-mode", mode);
    panel.querySelector(".js-edit-cycle").hidden = mode === "edit";
    panel.querySelector(".js-cancel-cycle").hidden = mode !== "edit";
    panel.querySelector(".js-save-cycle").hidden = mode !== "edit";
    renderCycleRows(panel, getActiveMetric(panel));
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-tab");
      tabs.forEach(function (item) {
        item.classList.toggle("active", item === tab);
      });
      panels.forEach(function (panel) {
        panel.classList.toggle("active", panel.getAttribute("data-panel") === target);
      });
    });
  });

  document.querySelectorAll(".segmented").forEach(function (group) {
    group.addEventListener("click", function (event) {
      var button = event.target.closest(".segment");
      if (!button) return;
      group.querySelectorAll(".segment").forEach(function (item) {
        item.classList.toggle("active", item === button);
      });
      var panel = button.closest(".cycle-panel");
      if (panel) renderCycleRows(panel, button.getAttribute("data-metric"));
    });
  });

  document.querySelectorAll(".cycle-panel").forEach(function (panel) {
    setCycleMode(panel, "view");
  });

  document.querySelectorAll(".js-edit-cycle").forEach(function (button) {
    button.addEventListener("click", function () {
      setCycleMode(button.closest(".cycle-panel"), "edit");
    });
  });

  document.querySelectorAll(".js-cancel-cycle, .js-save-cycle").forEach(function (button) {
    button.addEventListener("click", function () {
      setCycleMode(button.closest(".cycle-panel"), "view");
    });
  });

  document.querySelectorAll(".js-open-rule").forEach(function (button) {
    button.addEventListener("click", function () {
      show(document.getElementById("cycleRuleModal"));
    });
  });

  document.querySelectorAll(".js-open-newbie-task").forEach(function (button) {
    button.addEventListener("click", function () {
      show(document.getElementById("newbieRuleModal"));
    });
  });

  document.querySelectorAll(".js-open-chest").forEach(function (button) {
    button.addEventListener("click", function () {
      var title = document.getElementById("chestTitle");
      if (title) title.textContent = button.textContent.indexOf("修改") > -1 ? "修改宝箱" : "新增宝箱";
      show(document.getElementById("chestModal"));
    });
  });

  document.querySelectorAll(".js-close-modal").forEach(function (button) {
    button.addEventListener("click", function () {
      hide(button.closest(".modal-mask"));
    });
  });

  document.querySelectorAll(".modal-mask").forEach(function (mask) {
    mask.addEventListener("click", function (event) {
      if (event.target === mask) hide(mask);
    });
  });
})();
