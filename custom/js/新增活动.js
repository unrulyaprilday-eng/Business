(function () {
  var TEMPLATE_TO_STATE = {
    "\u6253\u7801\u8fd4\u6c34": 0,
    "\u62fc\u591a\u591a": 1,
    "\u6551\u6d4e\u91d1": 2,
    "\u5206\u4eab\u6d3b\u52a8": 3,
    "\u81ea\u5b9a\u4e49\u6d3b\u52a8": 4
  };

  var panelStateCache = {};

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setText(id, text) {
    var node = document.querySelector("#" + id + "_text span");
    if (node) {
      node.textContent = text;
    }
  }

  function getPanelStates(panel) {
    if (panel.id && panelStateCache[panel.id]) {
      return panelStateCache[panel.id];
    }

    var states = Array.prototype.filter.call(panel.children, function (child) {
      return child && child.classList && child.classList.contains("panel_state");
    });

    if (panel.id) {
      panelStateCache[panel.id] = states;
    }

    return states;
  }

  function isStateVisible(state) {
    return Boolean(state) && state.style.display !== "none" && state.style.visibility !== "hidden";
  }

  function showPanelState(panelId, stateIndex) {
    var panel = document.getElementById(panelId);
    var states;
    var activeState;

    if (!panel) {
      return;
    }

    states = getPanelStates(panel);
    activeState = panel.getAttribute("data-active-state");

    if (!states.length) {
      return;
    }

    if (activeState === String(stateIndex) && isStateVisible(states[stateIndex])) {
      return;
    }

    states.forEach(function (state, index) {
      var isActive = index === stateIndex;
      var nextVisibility = isActive ? "visible" : "hidden";
      var nextDisplay = isActive ? "block" : "none";
      var nextAriaHidden = isActive ? "false" : "true";

      if (state.style.visibility !== nextVisibility) {
        state.style.visibility = nextVisibility;
      }
      if (state.style.display !== nextDisplay) {
        state.style.display = nextDisplay;
      }
      if (state.getAttribute("aria-hidden") !== nextAriaHidden) {
        state.setAttribute("aria-hidden", nextAriaHidden);
      }
    });

    panel.setAttribute("data-active-state", String(stateIndex));
  }

  function setTemplateState(template) {
    var state = Object.prototype.hasOwnProperty.call(TEMPLATE_TO_STATE, template) ? TEMPLATE_TO_STATE[template] : 0;
    var isRelief = template === "\u6551\u6d4e\u91d1";
    var isShare = template === "\u5206\u4eab\u6d3b\u52a8";
    var isCustom = template === "\u81ea\u5b9a\u4e49\u6d3b\u52a8";

    document.body.classList.toggle("relief-template-active", isRelief);
    document.body.classList.toggle("share-template-active", isShare);
    document.body.classList.toggle("custom-template-active", isCustom);
    showPanelState("u6", state);
  }

  function bindTemplateSelect(select) {
    var apply = function () {
      setTemplateState(select.value);
    };

    if (select.getAttribute("data-template-bound") === "true") {
      return;
    }

    select.setAttribute("data-template-bound", "true");
    select.addEventListener("change", apply);
    apply();
  }

  function nextReliefTierLabel(table) {
    var rows = table.querySelectorAll(".custom-relief-table-row");
    var lastEditableRow = rows.length > 1 ? rows[rows.length - 2] : null;
    var lastEditableInput = lastEditableRow ? lastEditableRow.querySelector(".custom-vip-end") : null;
    var start = lastEditableInput ? Number(lastEditableInput.value) + 1 : 1;
    return String(start || 1);
  }

  function createReliefRewardRow(table) {
    var row = document.createElement("div");
    row.className = "custom-relief-table-row";
    row.innerHTML = [
      '<span class="custom-tier">' + nextReliefTierLabel(table) + "</span>",
      '<div class="custom-vip-cell">',
      '<input class="custom-vip-end" type="number" placeholder="\u8bf7\u8f93\u5165VIP\u7b49\u7ea7">',
      "<small></small>",
      "</div>",
      '<input class="custom-reward-input" type="number" placeholder="\u8bf7\u8f93\u5165\u5145\u503c\u767e\u5206\u6bd4">',
      '<button type="button" class="custom-row-delete" aria-label="\u5220\u9664">\u5220\u9664</button>'
    ].join("");
    return row;
  }

  function formatTierLabel(start, end) {
    if (!start || !end) {
      return start ? String(start) : "";
    }
    return start === end ? String(start) : start + " - " + end;
  }

  function setVipError(row, message) {
    var messageNode = row.querySelector(".custom-vip-cell small");
    row.classList.toggle("is-error", Boolean(message));
    if (messageNode) {
      messageNode.textContent = message || "";
    }
  }

  function syncReliefTierRanges(table) {
    var rows = Array.prototype.slice.call(table.querySelectorAll(".custom-relief-table-row"));
    var expectedStart = 1;

    rows.forEach(function (row, index) {
      var input = row.querySelector(".custom-vip-end");
      var tier = row.querySelector(".custom-tier");
      var isLast = index === rows.length - 1;
      var end = input ? Number(input.value) : 0;
      var message = "";

      if (!input || !tier) {
        return;
      }

      input.min = expectedStart;
      input.max = 15;

      if (isLast) {
        input.value = "15";
        input.disabled = true;
        end = 15;
      } else {
        input.disabled = false;
        if (!input.value) {
          end = expectedStart;
          input.value = String(end);
        } else if (end < expectedStart) {
          message = "\u5fc5\u987b\u5927\u4e8e\u4e0a\u4e00\u6863";
        } else if (end >= 15) {
          end = 14;
          input.value = "14";
          message = "\u6700\u540e\u4e00\u6863\u81ea\u52a8\u8865\u523015";
        }
      }

      tier.textContent = formatTierLabel(expectedStart, end);
      setVipError(row, message);
      expectedStart = end + 1;
    });
  }

  function bindReliefRewardTable(table) {
    if (!table || table.getAttribute("data-relief-bound") === "true") {
      return;
    }

    table.setAttribute("data-relief-bound", "true");
    syncReliefTierRanges(table);

    table.addEventListener("input", function (event) {
      if (event.target && event.target.classList.contains("custom-vip-end")) {
        syncReliefTierRanges(table);
      }
    });

    table.addEventListener("click", function (event) {
      var target = event.target;
      if (!target) {
        return;
      }

      if (target.classList.contains("custom-row-delete")) {
        var row = target.closest(".custom-relief-table-row");
        if (row) {
          row.parentNode.removeChild(row);
          syncReliefTierRanges(table);
        }
        return;
      }

      if (target.classList.contains("custom-add-row")) {
        var body = table.querySelector(".custom-relief-table-body");
        if (body) {
          var rows = body.querySelectorAll(".custom-relief-table-row");
          var lastRow = rows.length ? rows[rows.length - 1] : null;
          body.insertBefore(createReliefRewardRow(table), lastRow);
          syncReliefTierRanges(table);
        }
      }
    });
  }

  function getOgLibrary() {
    return window.OG_SHARED_LIBRARY || null;
  }

  function getActivityOgRecord(value) {
    var ogLibrary = getOgLibrary();
    var options = ogLibrary && ogLibrary.activityOptions ? ogLibrary.activityOptions : [];
    var option = null;
    var record = null;
    var index;

    for (index = 0; index < options.length; index += 1) {
      if (options[index].value === value) {
        option = options[index];
        break;
      }
    }

    if (!option || !ogLibrary || typeof ogLibrary.findByKey !== "function") {
      return null;
    }

    record = ogLibrary.findByKey(option.key);

    if (!record) {
      return null;
    }

    return {
      value: option.value,
      key: option.key,
      label: option.label,
      typeLabel: option.value === "follow-default" ? "\u7ad9\u70b9OG" : record.typeLabel,
      bizType: record.bizType,
      path: record.path,
      title: record.title,
      description: record.description,
      image: record.image,
      status: record.status
    };
  }

  function getEnabledActivityOgOptions() {
    var ogLibrary = getOgLibrary();
    var options = ogLibrary && ogLibrary.activityOptions ? ogLibrary.activityOptions : [];

    return options.map(function (option) {
      return getActivityOgRecord(option.value);
    }).filter(function (record) {
      return record && record.status === "on";
    });
  }

  function normalizeSearchText(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, "");
  }

  function matchActivityOgRecord(record, keyword) {
    var haystack;

    if (!keyword) {
      return true;
    }

    haystack = normalizeSearchText([
      record.label,
      record.title,
      record.path,
      record.bizType,
      record.typeLabel
    ].join(" "));

    return haystack.indexOf(keyword) !== -1;
  }

  function renderActivityOgSelectionCards(values, listNode, emptyNode) {
    var records = values.map(function (value) {
      return getActivityOgRecord(value);
    }).filter(Boolean);

    if (!records.length) {
      listNode.innerHTML = "";
      emptyNode.hidden = false;
      return;
    }

    emptyNode.hidden = true;
    listNode.innerHTML = records.map(function (record) {
      return [
        '<div class="custom-og-selection-card" data-og-value="' + escapeHtml(record.value) + '">',
        '<strong class="custom-og-name">' + escapeHtml(record.label) + "</strong>",
        '<div class="custom-og-preview">',
        '<span class="custom-og-preview-label">\u9884\u89c8</span>',
        '<div class="custom-og-preview-image">' + escapeHtml(record.image || "OG") + "</div>",
        "<p>" + escapeHtml(record.title) + "</p>",
        "</div>",
        '<button type="button" class="custom-og-remove-button" data-og-remove="' + escapeHtml(record.value) + '">\u5220\u9664</button>',
        "</div>"
      ].join("");
    }).join("");
  }

  function renderActivityOgDropdown(records, dropdownNode, activeValue) {
    if (!records.length) {
      dropdownNode.innerHTML = '<div class="custom-og-empty-option">\u672a\u627e\u5230\u53ef\u6dfb\u52a0\u7684OG\u914d\u7f6e</div>';
      return;
    }

    dropdownNode.innerHTML = records.map(function (record) {
      var isActive = record.value === activeValue;

      return [
        '<button type="button" class="custom-og-option' + (isActive ? " is-active" : "") + '" data-og-option="' + escapeHtml(record.value) + '">',
        "<strong>" + escapeHtml(record.label) + "</strong>",
        "</button>"
      ].join("");
    }).join("");
  }

  function bindActivityOgSelection() {
    var input = document.getElementById("activityOgSearch");
    var addButton = document.getElementById("activityOgAdd");
    var dropdownNode = document.getElementById("activityOgDropdown");
    var countNode = document.getElementById("activityOgCount");
    var listNode = document.getElementById("activityOgSelectionList");
    var emptyNode = document.getElementById("activityOgEmpty");
    var selectedValues = [];
    var activeOptionValue = "";
    var dropdownVisible = false;
    var MAX_SELECTION = 5;

    function getAvailableRecords() {
      var keyword = normalizeSearchText(input.value);

      return getEnabledActivityOgOptions().filter(function (record) {
        return selectedValues.indexOf(record.value) === -1 && matchActivityOgRecord(record, keyword);
      });
    }

    function syncCount() {
      countNode.textContent = "\u5df2\u6dfb\u52a0 " + selectedValues.length + " / " + MAX_SELECTION;
    }

    function setDropdownVisible(visible) {
      dropdownVisible = visible;
      dropdownNode.hidden = !visible;
    }

    function resetPicker() {
      activeOptionValue = "";
      input.value = "";
      input.removeAttribute("data-selected-value");
      addButton.disabled = true;
    }

    function refreshPicker(openDropdown) {
      var records = getAvailableRecords();

      renderActivityOgSelectionCards(selectedValues, listNode, emptyNode);
      renderActivityOgDropdown(records, dropdownNode, activeOptionValue);
      syncCount();

      if (selectedValues.length >= MAX_SELECTION) {
        addButton.disabled = true;
        input.disabled = true;
        setDropdownVisible(false);
        return;
      }

      input.disabled = false;
      addButton.disabled = !activeOptionValue;

      if (openDropdown && records.length) {
        setDropdownVisible(true);
        return;
      }

      if (!dropdownVisible || !records.length) {
        setDropdownVisible(false);
      }
    }

    if (!input || !addButton || !dropdownNode || !countNode || !listNode || !emptyNode) {
      return;
    }

    Array.prototype.forEach.call(listNode.querySelectorAll("[data-og-value]"), function (node) {
      var value = node.getAttribute("data-og-value");
      if (value) {
        selectedValues.push(value);
      }
    });

    input.addEventListener("focus", function () {
      refreshPicker(true);
    });

    input.addEventListener("click", function () {
      refreshPicker(true);
    });

    input.addEventListener("input", function () {
      activeOptionValue = "";
      input.removeAttribute("data-selected-value");
      addButton.disabled = true;
      refreshPicker(true);
    });

    input.addEventListener("blur", function () {
      window.setTimeout(function () {
        setDropdownVisible(false);
      }, 120);
    });

    dropdownNode.addEventListener("click", function (event) {
      var optionButton = event.target.closest("[data-og-option]");
      var record;

      if (!optionButton) {
        return;
      }

      activeOptionValue = optionButton.getAttribute("data-og-option");
      record = getActivityOgRecord(activeOptionValue);

      if (!record) {
        return;
      }

      input.value = record.label;
      input.setAttribute("data-selected-value", activeOptionValue);
      addButton.disabled = false;
      setDropdownVisible(false);
    });

    addButton.addEventListener("click", function () {
      if (!activeOptionValue || selectedValues.length >= MAX_SELECTION) {
        return;
      }

      if (selectedValues.indexOf(activeOptionValue) !== -1) {
        return;
      }

      selectedValues.push(activeOptionValue);
      resetPicker();
      refreshPicker(false);
    });

    listNode.addEventListener("click", function (event) {
      var removeButton = event.target.closest("[data-og-remove]");
      var value;

      if (!removeButton) {
        return;
      }

      value = removeButton.getAttribute("data-og-remove");
      selectedValues = selectedValues.filter(function (item) {
        return item !== value;
      });
      refreshPicker(false);
    });

    refreshPicker(false);
  }

  function getCheckedValue(name, fallback) {
    var checked = document.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : fallback;
  }

  function syncCustomActivityJump() {
    var mode = getCheckedValue("customActivityJumpMode", "detail");
    var jumpType = getCheckedValue("customActivityJumpType", "inner");
    var innerType = getCheckedValue("customActivityInnerType", "internal");
    var buttonField = document.getElementById("customActivityButtonField");
    var targetLabel = document.getElementById("customActivityTargetLabel");
    var innerTypeRow = document.getElementById("customActivityInnerTypeRow");
    var systemTarget = document.getElementById("customActivitySystemTarget");
    var internalTargetSelect = document.getElementById("customActivityInternalTargetSelect");
    var internalTargetInput = document.getElementById("customActivityInternalTargetInput");
    var externalTargetInput = document.getElementById("customActivityExternalTargetInput");
    var tip = document.getElementById("customActivityJumpTip");
    var isOuter = jumpType === "outer";
    var isPopup = !isOuter && innerType === "popup";
    var target = "";
    var targetTypeLabel = "";
    var actionLabel = mode === "cover" ? "\u5c01\u9762\u70b9\u51fb\u540e\u5c06\u8df3\u8f6c\u81f3" : "\u8be6\u60c5\u6309\u94ae\u5c06\u8df3\u8f6c\u81f3";

    if (!innerTypeRow || !targetLabel || !systemTarget || !internalTargetSelect || !internalTargetInput || !externalTargetInput) {
      return;
    }

    innerTypeRow.hidden = isOuter;
    systemTarget.hidden = !isPopup;
    internalTargetSelect.hidden = isOuter || isPopup;
    internalTargetInput.hidden = isOuter || isPopup || Boolean(internalTargetSelect.value);
    externalTargetInput.hidden = !isOuter;

    if (isOuter) {
      targetLabel.textContent = "\u5916\u90e8\u94fe\u63a5";
      target = externalTargetInput.value || "https://promo.example.com";
      targetTypeLabel = "\u5916\u94fe";
    } else if (isPopup) {
      targetLabel.textContent = "\u7cfb\u7edf\u529f\u80fd";
      target = systemTarget.value || "\u5145\u503c\u5f39\u7a97";
      targetTypeLabel = "\u7cfb\u7edf\u529f\u80fd\u5f39\u7a97";
    } else {
      targetLabel.textContent = "\u8df3\u8f6c\u94fe\u63a5";
      target = internalTargetSelect.value || internalTargetInput.value || "/activity/custom-campaign";
      targetTypeLabel = "\u5185\u90e8\u94fe\u63a5";
    }

    if (buttonField) {
      buttonField.classList.toggle("is-secondary", mode === "cover");
    }
    if (tip) {
      tip.textContent = actionLabel + targetTypeLabel + " " + target + "\u3002";
    }
  }

  function bindCustomActivityJump() {
    var root = document.getElementById("u6_state4");

    if (!root || root.getAttribute("data-custom-jump-bound") === "true") {
      return;
    }

    root.setAttribute("data-custom-jump-bound", "true");
    root.addEventListener("change", function (event) {
      if (event.target && event.target.name && event.target.name.indexOf("customActivity") === 0) {
        syncCustomActivityJump();
      }
      if (event.target && event.target.id === "customActivityInternalTargetSelect") {
        syncCustomActivityJump();
      }
    });
    root.addEventListener("input", function (event) {
      if (event.target && event.target.id && event.target.id.indexOf("customActivity") === 0) {
        syncCustomActivityJump();
      }
    });
    syncCustomActivityJump();
  }

  ready(function () {
    var select = document.getElementById("u3012_input");

    setText("u3011", "\u6d3b\u52a8\u6a21\u677f");
    Array.prototype.forEach.call(document.querySelectorAll(".custom-relief-table"), bindReliefRewardTable);
    bindActivityOgSelection();
    bindCustomActivityJump();

    if (select) {
      select.setAttribute("aria-label", "\u6d3b\u52a8\u6a21\u677f");
      if (!select.value) {
        select.value = "\u5206\u4eab\u6d3b\u52a8";
      }
      bindTemplateSelect(select);
    }
  });
})();
