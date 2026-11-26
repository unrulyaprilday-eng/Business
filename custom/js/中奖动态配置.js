(function () {
  function toggleHidden(node, hidden) {
    if (node) {
      node.hidden = hidden;
    }
  }

  function setSwitch(button, enabled) {
    button.setAttribute("data-on", String(enabled));
    button.setAttribute("aria-checked", String(enabled));
    button.classList.toggle("on", enabled);
  }

  function updateNameHint() {
    var hint = document.getElementById("nameModeHint");
    var prefixInput = document.getElementById("namePrefixInput");
    var customPrefix = prefixInput ? prefixInput.value.trim() : "";

    if (!hint) return;
    if (customPrefix) {
      hint.textContent = "示例：" + customPrefix + "***8 / " + customPrefix + "***3 / " + customPrefix + "***5";
      return;
    }
    hint.textContent = "示例：12***8 / 66***3 / 90***5";
  }

  function updateSourcePanels() {
    var gameToggle = document.getElementById("sourceGame");
    var gameSourceCard = document.getElementById("gameSourceCard");

    if (gameToggle && gameSourceCard) {
      var detail = gameSourceCard.querySelector(".source-detail");
      if (detail) {
        detail.hidden = !gameToggle.checked;
      }
    }
  }

  function setupMultiselect(container) {
    var trigger = container.querySelector(".multiselect-trigger");
    var dropdown = container.querySelector(".multiselect-dropdown");
    var input = container.querySelector(".multiselect-input");
    var tags = container.querySelector(".multiselect-tags");
    var searchInput = container.querySelector(".multiselect-search-input");
    var checkboxes = container.querySelectorAll('.multiselect-option input[type="checkbox"]');
    var selectAll = container.querySelector(".select-all-checkbox");
    var fieldset = container.closest("fieldset");

    function updateView() {
      var values = [];
      tags.innerHTML = "";
      Array.prototype.forEach.call(checkboxes, function (checkbox) {
        if (checkbox.checked) {
          values.push(checkbox.value);
          var tag = document.createElement("span");
          tag.className = "multiselect-tag";
          tag.innerHTML = checkbox.value + '<span class="tag-remove" data-value="' + checkbox.value + '">×</span>';
          tags.appendChild(tag);
        }
      });
      input.value = values.length ? ("已选 " + values.length + " 项") : "";
      if (selectAll) {
        selectAll.checked = values.length === checkboxes.length && checkboxes.length > 0;
      }
    }

    function filterOptions(keyword) {
      var search = keyword ? keyword.trim().toLowerCase() : "";
      Array.prototype.forEach.call(checkboxes, function (checkbox) {
        var option = checkbox.closest(".multiselect-option");
        var text = checkbox.value.toLowerCase();
        if (option) {
          option.hidden = !!search && text.indexOf(search) === -1;
        }
      });
    }

    trigger.addEventListener("click", function () {
      if (fieldset && fieldset.disabled) return;
      dropdown.hidden = !dropdown.hidden;
      if (!dropdown.hidden && searchInput) {
        searchInput.focus();
      }
    });

    Array.prototype.forEach.call(checkboxes, function (checkbox) {
      checkbox.addEventListener("change", updateView);
    });

    if (selectAll) {
      selectAll.addEventListener("change", function () {
        Array.prototype.forEach.call(checkboxes, function (checkbox) {
          checkbox.checked = selectAll.checked;
        });
        updateView();
      });
    }

    tags.addEventListener("click", function (event) {
      if (fieldset && fieldset.disabled) return;
      var remove = event.target.closest(".tag-remove");
      if (!remove) return;
      Array.prototype.forEach.call(checkboxes, function (checkbox) {
        if (checkbox.value === remove.getAttribute("data-value")) {
          checkbox.checked = false;
        }
      });
      updateView();
    });

    document.addEventListener("click", function (event) {
      if (!container.contains(event.target)) {
        dropdown.hidden = true;
      }
    });

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        filterOptions(searchInput.value);
      });
    }

    return function refresh() {
      dropdown.hidden = true;
      if (searchInput) searchInput.value = "";
      filterOptions("");
      updateView();
    };
  }

  function setupTagRow(group) {
    group.addEventListener("click", function (event) {
      var button = event.target.closest(".tag");
      if (!button) return;
      button.classList.toggle("active");
    });
  }

  function syncWeightInputs() {
    var rows = document.querySelectorAll(".robot-panel-column-right .source-config-row");
    var checkedRows = [];

    Array.prototype.forEach.call(rows, function (row) {
      var checkbox = row.querySelector('.source-config-main input[type="checkbox"]');
      var weightInput = row.querySelector(".inline-weight-field input");
      if (!weightInput) return;

      weightInput.readOnly = false;
      weightInput.classList.remove("auto-weight-input");

      if (checkbox && checkbox.checked) {
        checkedRows.push(row);
      }
    });

    if (!checkedRows.length) {
      return;
    }

    var lastRow = checkedRows[checkedRows.length - 1];
    var totalBeforeLast = 0;

    Array.prototype.forEach.call(checkedRows, function (row) {
      if (row === lastRow) return;
      var weightInput = row.querySelector(".inline-weight-field input");
      var value = weightInput ? parseFloat(weightInput.value) : NaN;
      if (!isNaN(value)) {
        totalBeforeLast += value;
      }
    });

    var lastWeightInput = lastRow.querySelector(".inline-weight-field input");
    if (!lastWeightInput) return;

    lastWeightInput.value = Math.max(0, Number((100 - totalBeforeLast).toFixed(10)));
    lastWeightInput.readOnly = true;
    lastWeightInput.classList.add("auto-weight-input");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var pageRoot = document.querySelector(".live-config-page");
    if (!pageRoot) return;
    var robotToggle = document.getElementById("robotToggle");
    var sourceGame = document.getElementById("sourceGame");
    var prefixInput = document.getElementById("namePrefixInput");
    var editBtn = pageRoot.querySelector('[data-action="edit"]');
    var cancelBtn = pageRoot.querySelector('[data-action="cancel"]');
    var saveBtn = pageRoot.querySelector('[data-action="save"]');
    var actions = pageRoot.querySelector("[data-config-actions]");
    var errorNode = pageRoot.querySelector("[data-config-error]");
    if (!robotToggle || !sourceGame || !editBtn || !cancelBtn || !saveBtn || !actions || !errorNode) return;

    var sections = pageRoot.querySelectorAll("fieldset.config-section");
    var robotRows = Array.from(pageRoot.querySelectorAll(".source-config-row"));
    var fields = Array.from(pageRoot.querySelectorAll(".config-section input[name], .multiselect-option input"));
    var refreshMultiselects = Array.from(pageRoot.querySelectorAll(".custom-multiselect"), setupMultiselect);
    var storageKey = "business.liveFeed.config.v1";
    var editing = false;
    var savedConfig = loadConfig();

    function fieldKey(input) {
      return input.name || input.closest("[data-multiselect]").dataset.multiselect + ":" + input.value;
    }

    function readConfig(defaults) {
      var config = { robotEnabled: robotToggle.getAttribute("data-on") === "true" };
      fields.forEach(function (input) {
        config[fieldKey(input)] = input.type === "checkbox"
          ? (defaults ? input.defaultChecked : input.checked)
          : (defaults ? input.defaultValue : input.value);
      });
      return config;
    }

    function loadConfig() {
      var config = readConfig(true);
      try {
        var stored = JSON.parse(window.localStorage.getItem(storageKey));
        if (stored && typeof stored === "object") {
          Object.keys(config).forEach(function (key) {
            if (typeof stored[key] === typeof config[key]) config[key] = stored[key];
          });
        } else {
          var legacyWithdrawal = window.localStorage.getItem("business.liveFeed.withdrawalSuccess");
          if (legacyWithdrawal !== null) config.sourceWithdrawal = legacyWithdrawal === "true";
        }
      } catch (error) {
        // Keep the page defaults when browser storage is unavailable.
      }
      return config;
    }

    function renderConfig(config) {
      fields.forEach(function (input) {
        var value = config[fieldKey(input)];
        if (input.type === "checkbox") input.checked = value;
        else input.value = value;
      });
      setSwitch(robotToggle, config.robotEnabled);
      updateSourcePanels();
      syncWeightInputs();
      updateNameHint();
      refreshMultiselects.forEach(function (refresh) { refresh(); });
    }

    function setError(message) {
      errorNode.textContent = message;
      errorNode.hidden = !message;
    }

    function setEditing(next) {
      editing = next;
      pageRoot.classList.toggle("is-readonly", !editing);
      pageRoot.classList.toggle("is-editing", editing);
      Array.prototype.forEach.call(sections, function (section) { section.disabled = !editing; });
      toggleHidden(editBtn, editing);
      toggleHidden(actions, !editing);
      setError("");
      if (!editing) renderConfig(savedConfig);
    }

    function isAmount(value) {
      return /^(?:\d+\.?\d*|\.\d+)$/.test(value.trim()) && Number.isFinite(Number(value));
    }

    function validateConfig(config) {
      if (config.sourceGame && !isAmount(config.minimumWin)) return "请输入有效的最低中奖金额。";
      if (!config.robotEnabled) return "";

      var interval = Number(config.robotInterval);
      if (!/^\d+$/.test(config.robotInterval.trim()) || !Number.isSafeInteger(interval) || interval < 1) {
        return "补充频率须为正整数。";
      }
      if (!/^\d*$/.test(config.robotPrefix.trim())) return "机器人名称开头只能填写数字。";

      var checkedRows = robotRows.filter(function (row) {
        return row.querySelector(".source-config-main input").checked;
      });
      if (!checkedRows.length) return "启用机器人时，请至少勾选一个补量来源。";

      var total = 0;
      for (var index = 0; index < checkedRows.length; index += 1) {
        var row = checkedRows[index];
        var source = row.querySelector(".source-config-main").textContent.trim();
        var weight = row.querySelector(".inline-weight-field input").value;
        if (!isAmount(weight) || Number(weight) > 100) return source + "的权重须在 0% 至 100% 之间。";
        if (index < checkedRows.length - 1) total += Number(weight);

        var range = row.querySelectorAll(".range-input input");
        if (range.length === 2 && (!isAmount(range[0].value) || !isAmount(range[1].value) || Number(range[0].value) > Number(range[1].value))) {
          return source + "的金额范围须填写有效金额，且下限不能高于上限。";
        }
      }
      if (Number(total.toFixed(10)) > 100) return "手动填写的权重合计不能超过 100%。";
      return "";
    }

    setEditing(false);

    robotToggle.addEventListener("click", function () {
      if (editing) setSwitch(robotToggle, robotToggle.getAttribute("data-on") !== "true");
    });

    if (prefixInput) {
      prefixInput.addEventListener("input", function () {
        updateNameHint();
      });
    }

    sourceGame.addEventListener("change", updateSourcePanels);

    robotRows.forEach(function (row) {
      var checkbox = row.querySelector('.source-config-main input[type="checkbox"]');
      var weightInput = row.querySelector(".inline-weight-field input");

      if (checkbox) {
        checkbox.addEventListener("change", syncWeightInputs);
      }

      if (weightInput) {
        weightInput.addEventListener("input", syncWeightInputs);
        weightInput.addEventListener("change", syncWeightInputs);
      }
    });

    Array.prototype.forEach.call(document.querySelectorAll(".tag-row"), function (group) {
      setupTagRow(group);
    });

    editBtn.addEventListener("click", function () {
      setEditing(true);
      sourceGame.focus({ preventScroll: true });
    });

    cancelBtn.addEventListener("click", function () {
      setEditing(false);
      editBtn.focus({ preventScroll: true });
    });

    saveBtn.addEventListener("click", function () {
      if (!editing) return;
      syncWeightInputs();
      var draft = readConfig(false);
      var issue = validateConfig(draft);
      if (issue) {
        setError(issue);
        return;
      }
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(draft));
      } catch (error) {
        setError("浏览器无法保存配置，修改已保留，请重试。");
        return;
      }
      savedConfig = draft;
      setEditing(false);
      editBtn.focus({ preventScroll: true });
    });
  });
})();
