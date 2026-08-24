(function () {
  function show(el) {
    if (el) el.hidden = false;
  }

  function hide(el) {
    if (el) el.hidden = true;
  }

  var tabs = document.querySelectorAll(".task-tab");
  var panels = document.querySelectorAll(".task-panel");
  var activeNewbieRow = null;
  var activeRulePanel = null;
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

  var ruleSettings = {
    daily: { multiplier: "2", target: "piggy-bank", enabled: true },
    weekly: { multiplier: "2", target: "piggy-bank", enabled: true },
    chest: { multiplier: "1", target: "piggy-bank", cycle: "weekly" }
  };

  function targetLabel(value) {
    return value === "balance" ? "余额" : "存钱罐";
  }

  function setRadioValue(name, value) {
    var input = document.querySelector("input[name=\"" + name + "\"][value=\"" + value + "\"]");
    if (input) input.checked = true;
  }

  function getRadioValue(name) {
    var input = document.querySelector("input[name=\"" + name + "\"]:checked");
    return input ? input.value : "";
  }

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

  function saveCycleRows(panel) {
    var rows = panel.querySelectorAll(".cycle-body tr");
    var values = [];
    rows.forEach(function (row) {
      var inputs = row.querySelectorAll("input");
      if (inputs.length === 4) {
        values.push([inputs[0].value, inputs[1].value, inputs[2].value, inputs[3].value]);
      }
    });
    if (values.length) {
      metricRows[panel.getAttribute("data-panel")][getActiveMetric(panel)] = values;
    }
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

  document.querySelectorAll(".js-cancel-cycle").forEach(function (button) {
    button.addEventListener("click", function () {
      setCycleMode(button.closest(".cycle-panel"), "view");
    });
  });

  document.querySelectorAll(".js-save-cycle").forEach(function (button) {
    button.addEventListener("click", function () {
      var panel = button.closest(".cycle-panel");
      saveCycleRows(panel);
      setCycleMode(panel, "view");
    });
  });

  document.querySelectorAll(".js-open-rule").forEach(function (button) {
    button.addEventListener("click", function () {
      var modal = document.getElementById("cycleRuleModal");
      activeRulePanel = button.closest(".task-panel");
      var panelName = activeRulePanel ? activeRulePanel.getAttribute("data-panel") : "daily";
      var settings = ruleSettings[panelName];
      var isChest = panelName === "chest";
      modal.querySelector(".js-rule-wager-multiplier").value = settings.multiplier;
      modal.querySelector(".js-rule-enabled-row").hidden = isChest;
      modal.querySelector(".js-rule-cycle-row").hidden = !isChest;
      if (isChest) {
        setRadioValue("ruleCycle", settings.cycle);
      } else {
        modal.querySelector(".js-rule-enabled").checked = settings.enabled;
      }
      setRadioValue("ruleRewardTarget", settings.target);
      show(modal);
    });
  });

  document.querySelectorAll(".js-open-newbie-task").forEach(function (button) {
    button.addEventListener("click", function () {
      var modal = document.getElementById("newbieRuleModal");
      var row = button.closest("tr");
      var cells = row.children;
      activeNewbieRow = row;
      modal.querySelector(".js-newbie-condition").textContent = cells[0].textContent.trim();
      modal.querySelector(".js-newbie-reward").value = cells[2].textContent.trim() === "-" ? "0" : cells[2].textContent.trim();
      modal.querySelector(".js-newbie-activity").value = cells[3].textContent.trim() === "-" ? "0" : cells[3].textContent.trim();
      modal.querySelector(".js-newbie-description").value = cells[4].textContent.trim() === "-" ? "" : cells[4].textContent.trim();
      modal.querySelector(".js-newbie-multiplier").value = row.getAttribute("data-multiplier") || "2";
      modal.querySelector(".js-newbie-enabled").checked = cells[7].querySelector(".switch-static").classList.contains("on");
      modal.querySelector(".js-newbie-bubble").checked = cells[8].querySelector(".switch-static").classList.contains("on");
      setRadioValue("newbieReceiveMethod", row.querySelector(".receive-method").getAttribute("data-receive"));
      setRadioValue("newbieRewardTarget", row.querySelector(".reward-target").getAttribute("data-target"));
      show(modal);
    });
  });

  document.querySelector(".js-save-newbie-task").addEventListener("click", function () {
    if (!activeNewbieRow) return;
    var modal = document.getElementById("newbieRuleModal");
    var cells = activeNewbieRow.children;
    var receive = getRadioValue("newbieReceiveMethod");
    var target = getRadioValue("newbieRewardTarget");
    cells[2].textContent = modal.querySelector(".js-newbie-reward").value || "0";
    cells[3].textContent = modal.querySelector(".js-newbie-activity").value || "0";
    cells[4].textContent = modal.querySelector(".js-newbie-description").value;
    cells[5].textContent = receive === "auto" ? "自动派发" : "手动领取";
    cells[5].setAttribute("data-receive", receive);
    cells[6].textContent = targetLabel(target);
    cells[6].setAttribute("data-target", target);
    cells[7].querySelector(".switch-static").classList.toggle("on", modal.querySelector(".js-newbie-enabled").checked);
    cells[8].querySelector(".switch-static").classList.toggle("on", modal.querySelector(".js-newbie-bubble").checked);
    activeNewbieRow.setAttribute("data-multiplier", modal.querySelector(".js-newbie-multiplier").value || "0");
    hide(modal);
  });

  document.querySelector(".js-save-rule").addEventListener("click", function () {
    if (!activeRulePanel) return;
    var modal = document.getElementById("cycleRuleModal");
    var panelName = activeRulePanel.getAttribute("data-panel");
    var settings = ruleSettings[panelName];
    settings.multiplier = modal.querySelector(".js-rule-wager-multiplier").value || "0";
    settings.target = getRadioValue("ruleRewardTarget");
    activeRulePanel.querySelector(".js-rule-target").textContent = targetLabel(settings.target);
    activeRulePanel.querySelector(".js-rule-multiplier").textContent = settings.multiplier;
    if (panelName === "chest") {
      settings.cycle = getRadioValue("ruleCycle");
      activeRulePanel.querySelector(".js-rule-cycle").textContent = settings.cycle === "daily" ? "每日循环" : "每周循环";
    } else {
      settings.enabled = modal.querySelector(".js-rule-enabled").checked;
      activeRulePanel.classList.toggle("rule-disabled", !settings.enabled);
    }
    hide(modal);
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
