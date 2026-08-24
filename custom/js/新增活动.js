(function () {
  var TEMPLATE_TO_STATE = {
    "\u6253\u7801\u8fd4\u6c34": 0,
    "\u62fc\u591a\u591a": 1,
    "\u6551\u6d4e\u91d1": 2,
    "\u5206\u4eab\u6d3b\u52a8": 3,
    "\u81ea\u5b9a\u4e49\u6d3b\u52a8": 4,
    "\u8fde\u7eed\u6311\u6218": 5,
    "\u7ea2\u5305\u96e8": 6
  };

  var CHALLENGE_NAME_OPTIONS = [
    { value: "holiday-benefits", label: "Holiday Benefits", localLabel: "\u8282\u65e5\u798f\u5229" },
    { value: "carnival", label: "Carnival", localLabel: "\u5609\u5e74\u534e" },
    { value: "challenge", label: "Challenge", localLabel: "\u6311\u6218" },
    { value: "new-user-bonus", label: "New-User Bonus", localLabel: "\u65b0\u624b\u5956\u52b1" }
  ];

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

  function createRewardTargetField(stateIndex) {
    var field = document.createElement("div");
    var inputName = "activityRewardTarget" + stateIndex;

    field.className = "custom-field activity-reward-target";
    field.setAttribute("data-activity-reward-target", String(stateIndex));
    field.innerHTML = [
      "<span>\u4e2d\u5956\u91d1\u989d\u76ee\u6807</span>",
      '<div class="custom-radio-group">',
      '<label><input type="radio" name="' + inputName + '" value="\u4f59\u989d" checked>\u4f59\u989d</label>',
      '<label><input type="radio" name="' + inputName + '" value="\u5b58\u94b1\u7f50">\u5b58\u94b1\u7f50</label>',
      "</div>"
    ].join("");
    return field;
  }

  function ensureRewardTargetFields() {
    var stateIndex;

    for (stateIndex = 0; stateIndex <= 6; stateIndex += 1) {
      var state = document.getElementById("u6_state" + stateIndex);
      var content;
      var grid;
      var field;

      if (!state) {
        continue;
      }

      if (stateIndex === 6) {
        field = state.querySelector(".red-packet-target-field");
        if (field) {
          field.classList.add("activity-reward-target");
          field.querySelector("span").textContent = "\u4e2d\u5956\u91d1\u989d\u76ee\u6807";
          Array.prototype.forEach.call(field.querySelectorAll('input[name="redPacketRewardTarget"]'), function (input) {
            var label = input.parentNode;
            if (input.value === "\u91d1\u989d") {
              input.value = "\u4f59\u989d";
              if (label) {
                label.lastChild.nodeValue = "\u4f59\u989d";
              }
            }
          });
        }
        continue;
      }

      if (state.querySelector("[data-activity-reward-target]")) {
        continue;
      }

      field = createRewardTargetField(stateIndex);
      grid = state.querySelector(".custom-relief-grid, .custom-share-grid");
      if (grid) {
        grid.insertBefore(field, grid.children[2] || null);
        continue;
      }

      content = document.getElementById("u6_state" + stateIndex + "_content");
      if (content) {
        field.classList.add("activity-reward-target-legacy");
        content.appendChild(field);
      }
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
    var isChallenge = template === "\u8fde\u7eed\u6311\u6218";
    var isRedPacket = template === "\u7ea2\u5305\u96e8";

    document.body.classList.toggle("relief-template-active", isRelief);
    document.body.classList.toggle("share-template-active", isShare);
    document.body.classList.toggle("custom-template-active", isCustom);
    document.body.classList.toggle("challenge-template-active", isChallenge);
    document.body.classList.toggle("red-packet-template-active", isRedPacket);
    showPanelState("u6", state);
    syncChallengeFooter(isChallenge || isRedPacket);
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

  var CHALLENGE_STORAGE_KEY = "promoChallengeActivities";

  function syncChallengeFooter(active) {
    setText("u4", active ? "\u4fdd\u5b58" : "\u63d0\u4ea4");
    setText("u5", "\u53d6\u6d88");
  }

  function getChallengeTaskMeta(type) {
    var meta = {
      "\u5145\u503c": { label: "\u7d2f\u8ba1\u5145\u503c\u6ee1", unit: "", condition: "100" },
      "\u6709\u6548\u6253\u7801": { label: "\u6709\u6548\u6253\u7801\u6ee1", unit: "", condition: "1000" },
      "\u6bcf\u65e5\u767b\u5f55": { label: "\u8fde\u7eed\u767b\u5f55", unit: "\u5929", condition: "1" },
      "\u9080\u8bf7\u597d\u53cb": { label: "\u6210\u529f\u9080\u8bf7", unit: "\u4eba", condition: "1" }
    };
    return meta[type] || meta["\u5145\u503c"];
  }

  function getChallengeTaskTypeOptions(selectedType) {
    return ["\u5145\u503c", "\u6709\u6548\u6253\u7801", "\u6bcf\u65e5\u767b\u5f55", "\u9080\u8bf7\u597d\u53cb"].map(function (type) {
      return "<option" + (type === selectedType ? " selected" : "") + ">" + type + "</option>";
    }).join("");
  }

  function createChallengeTaskRow(type, orderIndex) {
    var meta = getChallengeTaskMeta(type);
    var row = document.createElement("tr");
    row.setAttribute("data-task-type", type);
    row.innerHTML = [
      "<td><select class=\"challenge-task-type-select\">" + getChallengeTaskTypeOptions(type) + "</select></td>",
      "<td><div class=\"challenge-condition\"><span class=\"challenge-condition-label\">" + meta.label + "</span><input type=\"number\" value=\"" + meta.condition + "\" min=\"1\"><span class=\"challenge-condition-unit\">" + meta.unit + "</span></div></td>",
      "<td class=\"challenge-row-reward\"><select class=\"challenge-reward-type\"><option value=\"\u91d1\u989d\">\u91d1\u989d</option><option value=\"\u5b58\u94b1\u7f50\">\u5b58\u94b1\u7f50</option><option value=\"\u4f18\u60e0\u5238\">\u4f18\u60e0\u5238</option></select><span class=\"challenge-unified-label\">\u5168\u90e8\u4efb\u52a1\u5b8c\u6210\u540e\u7edf\u4e00\u53d1\u653e</span></td>",
      "<td class=\"challenge-row-reward\"><input class=\"challenge-reward-value\" type=\"number\" value=\"5\" min=\"0\" step=\"0.01\"><span class=\"challenge-unified-label\">--</span></td>",
      "<td class=\"challenge-order-cell\"><span class=\"challenge-order-index\">" + orderIndex + "</span><span class=\"challenge-order-actions\"><button type=\"button\" data-challenge-move-up title=\"\u4e0a\u79fb\u4efb\u52a1\" aria-label=\"\u4e0a\u79fb\u4efb\u52a1\">\u2191</button><button type=\"button\" data-challenge-move-down title=\"\u4e0b\u79fb\u4efb\u52a1\" aria-label=\"\u4e0b\u79fb\u4efb\u52a1\">\u2193</button></span></td>",
      "<td><button class=\"challenge-row-action danger\" type=\"button\" data-challenge-delete-task>\u5220\u9664</button></td>"
    ].join("");
    return row;
  }

  function syncChallengeTaskRow(row, resetCondition) {
    var typeSelect = row.querySelector(".challenge-task-type-select");
    var condition = row.querySelector(".challenge-condition");
    var input = condition ? condition.querySelector("input") : null;
    var label = condition ? condition.querySelector(".challenge-condition-label") : null;
    var unit = condition ? condition.querySelector(".challenge-condition-unit") : null;
    var meta;
    if (!typeSelect || !condition || !input || !label || !unit) { return; }
    meta = getChallengeTaskMeta(typeSelect.value);
    row.setAttribute("data-task-type", typeSelect.value);
    label.textContent = meta.label;
    unit.textContent = meta.unit;
    if (resetCondition) { input.value = meta.condition; }
  }

  function syncChallengeTaskOrder(rows) {
    var root = document.getElementById("u6_state5");
    var parallel = getCheckedValue("challengeCompletionMode", "\u987a\u5e8f\u5b8c\u6210") === "\u5e76\u884c\u5b8c\u6210";
    var rowList = Array.prototype.slice.call(rows.querySelectorAll("tr"));
    var orderHeader = document.getElementById("challengeOrderHeader");
    if (root) { root.classList.toggle("is-parallel-tasks", parallel); }
    if (orderHeader) { orderHeader.textContent = parallel ? "\u5b8c\u6210\u65b9\u5f0f" : "\u6267\u884c\u987a\u5e8f"; }
    rowList.forEach(function (row, index) {
      var order = row.querySelector(".challenge-order-index");
      var up = row.querySelector("[data-challenge-move-up]");
      var down = row.querySelector("[data-challenge-move-down]");
      if (order) { order.textContent = parallel ? "\u5e76\u884c" : String(index + 1); }
      if (up) { up.disabled = index === 0; }
      if (down) { down.disabled = index === rowList.length - 1; }
    });
  }

  function syncChallengeRewardControl(row) {
    var typeSelect = row.querySelector(".challenge-reward-type");
    var oldControl = row.querySelector(".challenge-reward-value");
    var control;
    if (!typeSelect || !oldControl) {
      return;
    }
    if (typeSelect.value === "\u4f18\u60e0\u5238" && oldControl.tagName !== "SELECT") {
      control = document.createElement("select");
      control.className = "challenge-reward-value";
      control.innerHTML = "<option>5\u5143\u65e0\u95e8\u69db\u5238</option><option>10\u5143\u6ee150\u51cf\u514d\u5238</option><option>VIP\u4e13\u5c5e\u52a0\u606f\u5238</option>";
      oldControl.parentNode.replaceChild(control, oldControl);
    } else if (typeSelect.value !== "\u4f18\u60e0\u5238" && oldControl.tagName !== "INPUT") {
      control = document.createElement("input");
      control.className = "challenge-reward-value";
      control.type = "number";
      control.min = "0";
      control.step = "0.01";
      control.value = "5";
      oldControl.parentNode.replaceChild(control, oldControl);
    }
  }

  function syncChallengeGrandRewardControl() {
    var typeSelect = document.getElementById("challengeGrandRewardType");
    var oldControl = document.getElementById("challengeGrandRewardValue");
    var control;
    if (!typeSelect || !oldControl) { return; }
    if (typeSelect.value === "\u4f18\u60e0\u5238" && oldControl.tagName !== "SELECT") {
      control = document.createElement("select");
      control.id = "challengeGrandRewardValue";
      control.required = true;
      control.innerHTML = "<option>5\u5143\u65e0\u95e8\u69db\u5238</option><option>10\u5143\u6ee150\u51cf\u514d\u5238</option><option>VIP\u4e13\u5c5e\u52a0\u606f\u5238</option>";
      oldControl.parentNode.replaceChild(control, oldControl);
    } else if (typeSelect.value !== "\u4f18\u60e0\u5238" && oldControl.tagName !== "INPUT") {
      control = document.createElement("input");
      control.id = "challengeGrandRewardValue";
      control.type = "number";
      control.min = "0";
      control.step = "0.01";
      control.value = "50";
      control.required = true;
      oldControl.parentNode.replaceChild(control, oldControl);
    }
  }

  function syncChallengeRewardSettings() {
    var taskEnabledInput = document.getElementById("challengeTaskRewardEnabled");
    var grandEnabledInput = document.getElementById("challengeGrandRewardEnabled");
    var root = document.getElementById("u6_state5");
    var grandPanel = document.getElementById("challengeGrandReward");
    var taskEnabled = Boolean(taskEnabledInput && taskEnabledInput.checked);
    var grandEnabled = Boolean(grandEnabledInput && grandEnabledInput.checked);

    if (root) { root.classList.toggle("is-task-reward-disabled", !taskEnabled); }
    if (grandPanel) { grandPanel.hidden = !grandEnabled; }
    Array.prototype.forEach.call(document.querySelectorAll("#challengeTaskRows .challenge-reward-type, #challengeTaskRows .challenge-reward-value"), function (control) {
      control.disabled = !taskEnabled;
      control.required = taskEnabled;
    });
    Array.prototype.forEach.call(document.querySelectorAll("#challengeGrandReward select, #challengeGrandReward input"), function (control) {
      control.disabled = !grandEnabled;
      control.required = grandEnabled;
    });
    return taskEnabled || grandEnabled;
  }

  function showChallengeRewardTip() {
    var tip = document.getElementById("challengeRewardTip");
    var confirmButton;
    if (!tip) { return; }
    tip.hidden = false;
    confirmButton = tip.querySelector(".challenge-tip-confirm");
    if (confirmButton) { confirmButton.focus(); }
  }

  function closeChallengeRewardTip() {
    var tip = document.getElementById("challengeRewardTip");
    if (tip) { tip.hidden = true; }
  }

  function enforceChallengeRewardSelection(input) {
    var taskEnabledInput = document.getElementById("challengeTaskRewardEnabled");
    var grandEnabledInput = document.getElementById("challengeGrandRewardEnabled");
    if (taskEnabledInput && grandEnabledInput && !taskEnabledInput.checked && !grandEnabledInput.checked) {
      input.checked = true;
      showChallengeRewardTip();
    }
    syncChallengeRewardSettings();
  }

  function getChallengeRecords() {
    try {
      return JSON.parse(window.localStorage.getItem(CHALLENGE_STORAGE_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  function setChallengeRecords(records) {
    try {
      window.localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      return false;
    }
    return true;
  }

  function getNamedValues(name) {
    return Array.prototype.map.call(document.querySelectorAll('input[name="' + name + '"]:checked'), function (input) {
      return input.value;
    });
  }

  function getChallengeNameOption(value) {
    return CHALLENGE_NAME_OPTIONS.find(function (option) {
      return option.value === value;
    }) || null;
  }

  function getChallengeNameValue() {
    var select = document.getElementById("challengeNamePreset");
    var customInput = document.getElementById("challengeNameCustom");
    var option;
    if (!select) {
      return "";
    }
    if (select.value === "custom") {
      return customInput ? customInput.value.trim() : "";
    }
    option = getChallengeNameOption(select.value);
    return option ? option.label : "";
  }

  function syncChallengeNamePicker() {
    var select = document.getElementById("challengeNamePreset");
    var customInput = document.getElementById("challengeNameCustom");
    var isCustom;

    if (!select) {
      return;
    }

    isCustom = select.value === "custom";
    if (customInput) {
      customInput.hidden = !isCustom;
      customInput.required = isCustom;
    }
  }

  function setChallengeNameSelection(record) {
    var select = document.getElementById("challengeNamePreset");
    var customInput = document.getElementById("challengeNameCustom");
    var savedName = String(record && record.name || "").trim();
    var option = record && record.nameKey ? getChallengeNameOption(record.nameKey) : null;
    var isCustom = Boolean(record && record.nameMode === "custom");

    if (!select) {
      return;
    }
    if (!isCustom && !option) {
      option = CHALLENGE_NAME_OPTIONS.find(function (item) {
        return item.label === savedName || item.localLabel === savedName;
      }) || null;
    }
    if (option && !isCustom) {
      select.value = option.value;
      if (customInput) {
        customInput.value = "";
      }
    } else {
      select.value = "custom";
      if (customInput) {
        customInput.value = savedName;
      }
    }
    syncChallengeNamePicker();
  }

  function collectChallengeRecord() {
    var taskRows = Array.prototype.map.call(document.querySelectorAll("#challengeTaskRows tr"), function (row, index) {
      var condition = row.querySelector(".challenge-condition input");
      var rewardType = row.querySelector(".challenge-reward-type");
      var rewardValue = row.querySelector(".challenge-reward-value");
      var typeSelect = row.querySelector(".challenge-task-type-select");
      return { taskType: typeSelect ? typeSelect.value : row.getAttribute("data-task-type"), condition: condition ? condition.value : "", rewardType: rewardType ? rewardType.value : "", rewardValue: rewardValue ? rewardValue.value : "", order: index + 1 };
    });
    var taskTypes = taskRows.map(function (task) { return task.taskType; }).filter(function (type, index, values) { return values.indexOf(type) === index; });
    var grandRewardType = document.getElementById("challengeGrandRewardType");
    var grandRewardValue = document.getElementById("challengeGrandRewardValue");
    var taskRewardEnabledInput = document.getElementById("challengeTaskRewardEnabled");
    var grandRewardEnabledInput = document.getElementById("challengeGrandRewardEnabled");
    var taskRewardEnabled = Boolean(taskRewardEnabledInput && taskRewardEnabledInput.checked);
    var grandRewardEnabled = Boolean(grandRewardEnabledInput && grandRewardEnabledInput.checked);
    var rewardMode = taskRewardEnabled && grandRewardEnabled ? "\u5b50\u4efb\u52a1\u5956\u52b1+\u5b8c\u6210\u5927\u5956" : (taskRewardEnabled ? "\u6bcf\u9879\u4efb\u52a1\u72ec\u7acb\u5956\u52b1" : "\u5168\u90e8\u4efb\u52a1\u5b8c\u6210\u540e\u7edf\u4e00\u5956\u52b1");
    var nameSelect = document.getElementById("challengeNamePreset");
    var nameOption = nameSelect ? getChallengeNameOption(nameSelect.value) : null;
    var nameMode = nameSelect && nameSelect.value !== "custom" ? "fixed" : "custom";
    return {
      id: new URLSearchParams(window.location.search).get("challengeId") || "challenge-" + Date.now(),
      name: getChallengeNameValue(),
      nameMode: nameMode,
      nameKey: nameMode === "fixed" && nameOption ? nameOption.value : "",
      title: document.getElementById("challengeTitle").value.trim(),
      startTime: document.getElementById("challengeStartTime").value,
      endTime: document.getElementById("challengeEndTime").value,
      status: getCheckedValue("challengeStatus", "\u5f00\u653e"),
      enabled: getCheckedValue("challengeStatus", "\u5f00\u653e") !== "\u5173\u95ed",
      vips: getNamedValues("challengeVip"),
      cycle: getCheckedValue("challengeCycle", "\u6bcf\u65e5"),
      claimMode: getCheckedValue("challengeClaimMode", "\u624b\u52a8\u9886\u53d6"),
      taskRewardEnabled: taskRewardEnabled,
      grandRewardEnabled: grandRewardEnabled,
      rewardMode: rewardMode,
      completionMode: getCheckedValue("challengeCompletionMode", "\u987a\u5e8f\u5b8c\u6210"),
      taskTypes: taskTypes,
      tasks: taskRows,
      grandReward: { type: grandRewardType ? grandRewardType.value : "\u91d1\u989d", value: grandRewardValue ? grandRewardValue.value : "50" },
      rules: document.getElementById("challengeRules").value,
      sort: document.getElementById("challengeSort").value || "0"
    };
  }

  function saveChallengeActivity() {
    var form = document.getElementById("challengeActivityForm");
    var record;
    var records;
    var index;
    if (!form) {
      return;
    }
    if (!syncChallengeRewardSettings()) {
      showChallengeRewardTip();
      return;
    }
    if (!form.checkValidity()) {
      if (form) { form.reportValidity(); }
      return;
    }
    record = collectChallengeRecord();
    if (!record.vips.length || !record.taskTypes.length || !record.tasks.length) {
      window.alert("\u8bf7\u81f3\u5c11\u9009\u62e9\u4e00\u4e2aVIP\u7b49\u7ea7\u548c\u4e00\u79cd\u4efb\u52a1\u7c7b\u578b\u3002");
      return;
    }
    records = getChallengeRecords();
    index = records.findIndex(function (item) { return item.id === record.id; });
    if (index === -1) { records.unshift(record); } else { records[index] = record; }
    setChallengeRecords(records);
    window.location.href = "\u4f18\u60e0\u6d3b\u52a8\u5217\u8868.html?challengeSaved=1";
  }

  function loadChallengeRecord() {
    var id = new URLSearchParams(window.location.search).get("challengeId");
    var record = id ? getChallengeRecords().find(function (item) { return item.id === id; }) : null;
    var rows = document.getElementById("challengeTaskRows");
    var legacyRewardMode;
    var taskRewardEnabled;
    var grandRewardEnabled;
    var savedGrandReward;
    if (!record) { return; }
    setChallengeNameSelection(record);
    document.getElementById("challengeTitle").value = record.title || "";
    document.getElementById("challengeStartTime").value = record.startTime || "";
    document.getElementById("challengeEndTime").value = record.endTime || "";
    document.getElementById("challengeSort").value = record.sort || "0";
    document.getElementById("challengeRules").value = record.rules || "";
    legacyRewardMode = record.rewardMode || "\u6bcf\u9879\u4efb\u52a1\u72ec\u7acb\u5956\u52b1";
    taskRewardEnabled = typeof record.taskRewardEnabled === "boolean" ? record.taskRewardEnabled : legacyRewardMode !== "\u5168\u90e8\u4efb\u52a1\u5b8c\u6210\u540e\u7edf\u4e00\u5956\u52b1";
    grandRewardEnabled = typeof record.grandRewardEnabled === "boolean" ? record.grandRewardEnabled : (legacyRewardMode === "\u5168\u90e8\u4efb\u52a1\u5b8c\u6210\u540e\u7edf\u4e00\u5956\u52b1" || legacyRewardMode === "\u5b50\u4efb\u52a1\u5956\u52b1+\u5b8c\u6210\u5927\u5956");
    document.getElementById("challengeTaskRewardEnabled").checked = taskRewardEnabled;
    document.getElementById("challengeGrandRewardEnabled").checked = grandRewardEnabled;
    ["challengeStatus", "challengeCycle", "challengeClaimMode", "challengeCompletionMode"].forEach(function (name) {
      var completionMode = record.completionMode === "\u6309\u987a\u5e8f\u5b8c\u6210" ? "\u987a\u5e8f\u5b8c\u6210" : (record.completionMode === "\u540c\u65f6\u5b8c\u6210" ? "\u5e76\u884c\u5b8c\u6210" : (record.completionMode || "\u987a\u5e8f\u5b8c\u6210"));
      var value = { challengeStatus: record.status === "\u7ef4\u62a4" ? "\u5f00\u653e" : record.status, challengeCycle: record.cycle, challengeClaimMode: record.claimMode, challengeCompletionMode: completionMode }[name];
      var input = document.querySelector('input[name="' + name + '"][value="' + value + '"]');
      if (input) { input.checked = true; }
    });
    Array.prototype.forEach.call(document.querySelectorAll('input[name="challengeVip"]'), function (input) {
      input.checked = (record.vips || []).indexOf(input.value) !== -1;
    });
    rows.innerHTML = "";
    (record.tasks || []).forEach(function (task, index) {
      var row = createChallengeTaskRow(task.taskType, index + 1);
      row.querySelector(".challenge-condition input").value = task.condition;
      row.querySelector(".challenge-reward-type").value = task.rewardType;
      rows.appendChild(row);
      syncChallengeRewardControl(row);
      row.querySelector(".challenge-reward-value").value = task.rewardValue;
    });
    savedGrandReward = record.grandReward || record.unifiedReward;
    if (savedGrandReward) {
      document.getElementById("challengeGrandRewardType").value = savedGrandReward.type || "\u91d1\u989d";
      syncChallengeGrandRewardControl();
      document.getElementById("challengeGrandRewardValue").value = savedGrandReward.value || "50";
    }
    syncChallengeRewardSettings();
    syncChallengeTaskOrder(rows);
  }

  function bindChallengeActivity() {
    var root = document.getElementById("u6_state5");
    var rows = document.getElementById("challengeTaskRows");
    var empty = document.getElementById("challengeTaskEmpty");
    var addTask = document.getElementById("challengeAddTask");
    var rewardTip = document.getElementById("challengeRewardTip");
    if (!root || !rows) { return; }
    if (rewardTip) {
      Array.prototype.forEach.call(rewardTip.querySelectorAll("[data-challenge-reward-tip-close]"), function (button) {
        button.addEventListener("click", closeChallengeRewardTip);
      });
    }
    loadChallengeRecord();
    syncChallengeNamePicker();
    syncChallengeRewardSettings();
    root.addEventListener("change", function (event) {
      var input = event.target;
      if (input && input.id === "challengeNamePreset") { syncChallengeNamePicker(); }
      if (input && (input.id === "challengeTaskRewardEnabled" || input.id === "challengeGrandRewardEnabled")) { enforceChallengeRewardSelection(input); }
      if (input && input.classList.contains("challenge-reward-type")) { syncChallengeRewardControl(input.closest("tr")); syncChallengeRewardSettings(); }
      if (input && input.classList.contains("challenge-task-type-select")) {
        syncChallengeTaskRow(input.closest("tr"), true);
      }
      if (input && input.name === "challengeCompletionMode") { syncChallengeTaskOrder(rows); }
      if (input && input.id === "challengeGrandRewardType") { syncChallengeGrandRewardControl(); syncChallengeRewardSettings(); }
    });
    root.addEventListener("input", function (event) {
      if (event.target && event.target.id === "challengeNameCustom") { syncChallengeNamePicker(); }
    });
    if (addTask) {
      addTask.addEventListener("click", function () {
        var lastTypeSelect = rows.lastElementChild ? rows.lastElementChild.querySelector(".challenge-task-type-select") : null;
        var type = lastTypeSelect ? lastTypeSelect.value : "\u5145\u503c";
        rows.appendChild(createChallengeTaskRow(type, rows.children.length + 1));
        empty.hidden = true;
        syncChallengeRewardSettings();
        syncChallengeTaskOrder(rows);
      });
    }
    rows.addEventListener("click", function (event) {
      var button = event.target.closest("button");
      var row;
      if (!button) { return; }
      row = button.closest("tr");
      if (button.hasAttribute("data-challenge-delete-task")) {
        row.remove();
      } else if (button.hasAttribute("data-challenge-move-up") && row.previousElementSibling) {
        rows.insertBefore(row, row.previousElementSibling);
      } else if (button.hasAttribute("data-challenge-move-down") && row.nextElementSibling) {
        rows.insertBefore(row.nextElementSibling, row);
      }
      syncChallengeTaskOrder(rows);
      empty.hidden = Boolean(rows.children.length);
    });
    syncChallengeRewardSettings();
    syncChallengeTaskOrder(rows);
    empty.hidden = Boolean(rows.children.length);
    [document.getElementById("u4"), document.getElementById("u5"), document.getElementById("u1")].forEach(function (button, index) {
      if (!button) { return; }
      button.addEventListener("click", function (event) {
        if (!document.body.classList.contains("challenge-template-active")) { return; }
        event.preventDefault();
        event.stopImmediatePropagation();
        if (index === 0) { saveChallengeActivity(); } else { window.location.href = "\u4f18\u60e0\u6d3b\u52a8\u5217\u8868.html"; }
      }, true);
    });
  }

  var RED_PACKET_STORAGE_KEY = "promoRedPacketActivities";

  function parseRedPacketTime(value) {
    var parts = String(value || "").split(":");
    var hours;
    var minutes;
    if (parts.length !== 2) { return null; }
    hours = Number(parts[0]);
    minutes = Number(parts[1]);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) { return null; }
    return hours * 60 + minutes;
  }

  function formatRedPacketTime(totalMinutes) {
    var hours = Math.floor(totalMinutes / 60);
    var minutes = totalMinutes % 60;
    return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
  }

  function createRedPacketTimeRow(start, end, endDay) {
    var row = document.createElement("div");
    var selectedEndDay = endDay === "next" ? "next" : "same";
    row.className = "red-packet-time-row";
    row.innerHTML = [
      '<span class="red-packet-time-index"></span>',
      '<input class="red-packet-start-time" type="time" value="' + (start || "12:00") + '" aria-label="\u5f00\u59cb\u65f6\u95f4">',
      "<em>\u81f3</em>",
      '<select class="red-packet-end-day" aria-label="\u7ed3\u675f\u65e5\u671f"><option value="same"' + (selectedEndDay === "same" ? " selected" : "") + '>\u5f53\u65e5</option><option value="next"' + (selectedEndDay === "next" ? " selected" : "") + '>\u6b21\u65e5</option></select>',
      '<input class="red-packet-end-time" type="time" value="' + (end || "13:00") + '" aria-label="\u7ed3\u675f\u65f6\u95f4">',
      '<button type="button" data-red-packet-remove-time aria-label="\u5220\u9664\u65f6\u95f4\u6bb5">\u5220\u9664</button>'
    ].join("");
    return row;
  }

  function syncRedPacketTimeRows() {
    var rows = Array.prototype.slice.call(document.querySelectorAll("#redPacketTimeRanges .red-packet-time-row"));
    rows.forEach(function (row, index) {
      var indexNode = row.querySelector(".red-packet-time-index");
      var endDay = row.querySelector(".red-packet-end-day");
      var isLast = index === rows.length - 1;
      if (indexNode) { indexNode.textContent = String(index + 1); }
      if (endDay) {
        endDay.disabled = !isLast;
        if (!isLast) { endDay.value = "same"; }
      }
    });
  }

  function getNextRedPacketTimeDefaults() {
    var rows = document.querySelectorAll("#redPacketTimeRanges .red-packet-time-row");
    var lastRow = rows.length ? rows[rows.length - 1] : null;
    var lastEnd = lastRow ? lastRow.querySelector(".red-packet-end-time") : null;
    var endMinutes;
    if (!lastEnd || !lastEnd.value) { return { start: "12:00", end: "13:00", endDay: "same" }; }
    endMinutes = parseRedPacketTime(lastEnd.value);
    if (endMinutes === null || endMinutes + 60 > 1439) { return null; }
    return { start: lastEnd.value, end: formatRedPacketTime(endMinutes + 60), endDay: "same" };
  }

  function createRedPacketTierRow(tier) {
    var row = document.createElement("tr");
    var item = tier || { min: "0.1", max: "1", count: "10", recharge: "100", validBet: "0" };
    row.innerHTML = [
      '<td class="red-packet-tier-index"></td>',
      '<td><input class="red-packet-tier-min" type="number" value="' + escapeHtml(item.min) + '" min="0" step="0.01" aria-label="\u6700\u5c0f\u91d1\u989d"></td>',
      '<td><input class="red-packet-tier-max" type="number" value="' + escapeHtml(item.max) + '" min="0" step="0.01" aria-label="\u6700\u5927\u91d1\u989d"></td>',
      '<td><input class="red-packet-tier-count" type="number" value="' + escapeHtml(item.count) + '" min="1" aria-label="\u7ea2\u5305\u6570\u91cf"></td>',
      '<td><input class="red-packet-tier-recharge" type="number" value="' + escapeHtml(item.recharge === undefined ? "100" : item.recharge) + '" min="0" step="0.01" aria-label="\u5145\u503c\u8fbe\u5230"></td>',
      '<td><input class="red-packet-tier-valid-bet" type="number" value="' + escapeHtml(item.validBet === undefined ? "0" : item.validBet) + '" min="0" step="0.01" aria-label="\u6709\u6548\u6295\u6ce8\u8fbe\u5230"></td>',
      '<td><button type="button" data-red-packet-remove-tier>\u5220\u9664</button></td>'
    ].join("");
    return row;
  }

  function syncRedPacketTierIndexes() {
    Array.prototype.forEach.call(document.querySelectorAll("#redPacketTierRows tr"), function (row, index) {
      var node = row.querySelector(".red-packet-tier-index");
      if (node) { node.textContent = String(index + 1); }
    });
  }

  function syncRedPacketConditionMode() {
    var disabled = getCheckedValue("redPacketConditionMode", "\u6ee1\u8db3\u4efb\u610f\u4e00\u4e2a") === "\u4e0d\u9650\u5236";
    var panel = document.getElementById("redPacketConditionPanel");
    var lookback = document.getElementById("redPacketLookbackDays");
    var lookbackField = document.getElementById("redPacketLookbackField");
    if (!panel) { return; }
    if (lookbackField) { lookbackField.hidden = disabled; }
    if (lookback) { lookback.disabled = disabled; }
    Array.prototype.forEach.call(document.querySelectorAll("#redPacketTierRows .red-packet-tier-recharge, #redPacketTierRows .red-packet-tier-valid-bet"), function (control) {
      control.disabled = disabled;
    });
  }

  function syncRedPacketEnabledLabel() {
    var input = document.getElementById("redPacketEnabled");
    var label = input ? input.closest("label") : null;
    var textNode = label ? label.querySelector("b") : null;
    if (textNode) { textNode.textContent = input.checked ? "\u5f00\u542f" : "\u5173\u95ed"; }
  }

  function getRedPacketRecords() {
    try {
      return JSON.parse(window.localStorage.getItem(RED_PACKET_STORAGE_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  function setRedPacketRecords(records) {
    try {
      window.localStorage.setItem(RED_PACKET_STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      return false;
    }
    return true;
  }

  function collectRedPacketRecord() {
    return {
      id: new URLSearchParams(window.location.search).get("redPacketId") || "red-packet-" + Date.now(),
      name: document.getElementById("redPacketName").value.trim(),
      sort: document.getElementById("redPacketSort").value || "0",
      enabled: document.getElementById("redPacketEnabled").checked,
      monthDays: getNamedValues("redPacketMonthDay"),
      weekDays: getNamedValues("redPacketWeekDay"),
      cycleRelation: getCheckedValue("redPacketCycleRelation", "or"),
      timeRanges: Array.prototype.map.call(document.querySelectorAll("#redPacketTimeRanges .red-packet-time-row"), function (row) {
        var endDay = row.querySelector(".red-packet-end-day");
        return { start: row.querySelector(".red-packet-start-time").value, end: row.querySelector(".red-packet-end-time").value, endDay: endDay ? endDay.value : "same" };
      }),
      wagerMultiple: document.getElementById("redPacketWagerMultiple").value,
      dailyClaimLimit: document.getElementById("redPacketDailyClaimLimit").value,
      totalDisplay: document.getElementById("redPacketTotalDisplay").value,
      singleDisplay: document.getElementById("redPacketSingleDisplay").value,
      totalLimit: document.getElementById("redPacketTotalLimit").value,
      singleLimit: document.getElementById("redPacketSingleLimit").value,
      tiers: Array.prototype.map.call(document.querySelectorAll("#redPacketTierRows tr"), function (row) {
        return {
          min: row.querySelector(".red-packet-tier-min").value,
          max: row.querySelector(".red-packet-tier-max").value,
          count: row.querySelector(".red-packet-tier-count").value,
          recharge: row.querySelector(".red-packet-tier-recharge").value,
          validBet: row.querySelector(".red-packet-tier-valid-bet").value
        };
      }),
      rewardTarget: getCheckedValue("redPacketRewardTarget", "\u4f59\u989d"),
      conditionMode: getCheckedValue("redPacketConditionMode", "\u6ee1\u8db3\u4efb\u610f\u4e00\u4e2a"),
      lookbackDays: document.getElementById("redPacketLookbackDays").value,
      description: document.getElementById("redPacketDescription").value
    };
  }

  function validateRedPacketTimeRanges(ranges) {
    var previousEnd = null;
    var lastIndex = ranges.length - 1;
    for (var index = 0; index < ranges.length; index += 1) {
      var range = ranges[index];
      var start = parseRedPacketTime(range.start);
      var end = parseRedPacketTime(range.end);
      var endAbsolute;
      if (start === null || end === null) { return "请完整配置每个红包时间段的开始和结束时间。"; }
      if (index !== lastIndex && range.endDay === "next") { return "只有最后一个时间段可以选择次日结束。"; }
      endAbsolute = end + (range.endDay === "next" ? 1440 : 0);
      if (endAbsolute <= start) { return "时间段必须按时间先后配置，结束时间需晚于开始时间。"; }
      if (endAbsolute - start >= 1440) { return "单个红包时间段不能达到或超过 24 小时。"; }
      if (previousEnd !== null && start < previousEnd) { return "后一时间段不能早于前一时间段结束时间，时间段之间不能重叠。"; }
      previousEnd = endAbsolute;
    }
    return "";
  }

  function isRedPacketCycleDate(date, record) {
    var weekValue = date.getDay() === 0 ? 7 : date.getDay();
    var monthMatch = record.monthDays.indexOf(String(date.getDate())) !== -1;
    var weekMatch = record.weekDays.indexOf(String(weekValue)) !== -1;
    return record.cycleRelation === "and" ? monthMatch && weekMatch : monthMatch || weekMatch;
  }

  function formatRedPacketDate(date) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }

  function findRedPacketCycleConflict(record) {
    var ranges = record.timeRanges;
    var lastRange = ranges[ranges.length - 1];
    var firstStart = parseRedPacketTime(ranges[0].start);
    var crossEnd = parseRedPacketTime(lastRange.end);
    var cursor;
    var next;
    var daysToCheck = 366 * 28;
    if (!ranges.length || lastRange.endDay !== "next" || firstStart === null || crossEnd === null || crossEnd <= firstStart) { return null; }
    cursor = new Date(new Date().getFullYear(), 0, 1, 12, 0, 0, 0);
    for (var index = 0; index < daysToCheck; index += 1) {
      next = new Date(cursor.getTime());
      next.setDate(next.getDate() + 1);
      if (isRedPacketCycleDate(cursor, record) && isRedPacketCycleDate(next, record)) {
        return { current: formatRedPacketDate(cursor), next: formatRedPacketDate(next) };
      }
      cursor = next;
    }
    return null;
  }

  function saveRedPacketActivity() {
    var form = document.getElementById("redPacketActivityForm");
    var record;
    var records;
    var index;
    var rangeError;
    var cycleConflict;
    var invalidTier;
    if (!form || !form.checkValidity()) {
      if (form) { form.reportValidity(); }
      return;
    }
    record = collectRedPacketRecord();
    rangeError = validateRedPacketTimeRanges(record.timeRanges);
    invalidTier = record.tiers.some(function (tier) {
      return tier.min === "" || tier.max === "" || tier.count === "" || tier.recharge === "" || tier.validBet === "" || Number(tier.min) > Number(tier.max);
    });
    if (!record.monthDays.length && !record.weekDays.length) {
      window.alert("\u8bf7\u81f3\u5c11\u9009\u62e9\u4e00\u4e2a\u7ea2\u5305\u5468\u671f\u3002");
      return;
    }
    if (record.cycleRelation === "and" && (!record.monthDays.length || !record.weekDays.length)) {
      window.alert("\u9009\u62e9\u201c\u540c\u65f6\u6ee1\u8db3\uff08\u4e14\uff09\u201d\u65f6，\u6bcf\u6708\u548c\u6bcf\u5468\u90fd\u9700\u81f3\u5c11\u914d\u7f6e\u4e00\u9879。");
      return;
    }
    if (!record.timeRanges.length || rangeError) {
      window.alert(rangeError || "\u8bf7\u81f3\u5c11\u914d\u7f6e\u4e00\u4e2a\u7ea2\u5305\u65f6\u95f4\u6bb5。");
      return;
    }
    cycleConflict = findRedPacketCycleConflict(record);
    if (cycleConflict) {
      window.alert("\u5468\u671f\u4f1a\u751f\u6210\u76f8\u90bb\u6295\u653e\u65e5\uff1a" + cycleConflict.current + " \u4e0e " + cycleConflict.next + " \u7684\u8de8\u5929\u65f6\u95f4\u6bb5\u53ef\u80fd\u91cd\u53e0，\u8bf7\u8c03\u6574\u65f6\u95f4\u6bb5\u6216\u5468\u671f。");
      return;
    }
    if (!record.tiers.length || invalidTier) {
      window.alert("\u8bf7\u81f3\u5c11\u914d\u7f6e\u4e00\u4e2a\u7ea2\u5305\u6863\u4f4d\uff0c\u4e14\u6700\u5927\u91d1\u989d\u4e0d\u5f97\u5c0f\u4e8e\u6700\u5c0f\u91d1\u989d\u3002");
      return;
    }
    records = getRedPacketRecords();
    index = records.findIndex(function (item) { return item.id === record.id; });
    if (index === -1) { records.unshift(record); } else { records[index] = record; }
    setRedPacketRecords(records);
    window.location.href = "\u4f18\u60e0\u6d3b\u52a8\u5217\u8868.html?redPacketSaved=1";
  }

  function setRedPacketFieldValue(id, value) {
    var control = document.getElementById(id);
    if (control && value !== undefined && value !== null) { control.value = value; }
  }

  function loadRedPacketRecord() {
    var id = new URLSearchParams(window.location.search).get("redPacketId");
    var record = id ? getRedPacketRecords().find(function (item) { return item.id === id; }) : null;
    var timeRows = document.getElementById("redPacketTimeRanges");
    var tierRows = document.getElementById("redPacketTierRows");
    var timeHeader;
    var legacyLookback;
    if (!record) { return; }
    setRedPacketFieldValue("redPacketName", record.name);
    setRedPacketFieldValue("redPacketSort", record.sort);
    setRedPacketFieldValue("redPacketWagerMultiple", record.wagerMultiple);
    setRedPacketFieldValue("redPacketDailyClaimLimit", record.dailyClaimLimit);
    setRedPacketFieldValue("redPacketTotalDisplay", record.totalDisplay);
    setRedPacketFieldValue("redPacketSingleDisplay", record.singleDisplay);
    setRedPacketFieldValue("redPacketTotalLimit", record.totalLimit);
    setRedPacketFieldValue("redPacketSingleLimit", record.singleLimit);
    setRedPacketFieldValue("redPacketDescription", record.description);
    legacyLookback = record.conditions && record.conditions.length ? record.conditions[0].days : "3";
    setRedPacketFieldValue("redPacketLookbackDays", record.lookbackDays || legacyLookback);
    document.getElementById("redPacketEnabled").checked = record.enabled !== false;
    Array.prototype.forEach.call(document.querySelectorAll('input[name="redPacketMonthDay"]'), function (input) { input.checked = (record.monthDays || []).indexOf(input.value) !== -1; });
    Array.prototype.forEach.call(document.querySelectorAll('input[name="redPacketWeekDay"]'), function (input) { input.checked = (record.weekDays || []).indexOf(input.value) !== -1; });
    ["redPacketRewardTarget", "redPacketConditionMode", "redPacketCycleRelation"].forEach(function (name) {
      var value = name === "redPacketRewardTarget" ? (record.rewardTarget === "\u91d1\u989d" ? "\u4f59\u989d" : (record.rewardTarget || "\u4f59\u989d")) : (name === "redPacketConditionMode" ? record.conditionMode : (record.cycleRelation || "or"));
      var input = document.querySelector('input[name="' + name + '"][value="' + value + '"]');
      if (input) { input.checked = true; }
    });
    timeHeader = timeRows.querySelector(".red-packet-time-header");
    timeRows.innerHTML = "";
    if (timeHeader) { timeRows.appendChild(timeHeader); }
    (record.timeRanges || []).forEach(function (range) { timeRows.appendChild(createRedPacketTimeRow(range.start, range.end, range.endDay || "same")); });
    tierRows.innerHTML = "";
    (record.tiers || []).forEach(function (tier) { tierRows.appendChild(createRedPacketTierRow(tier)); });
    syncRedPacketTimeRows();
    syncRedPacketTierIndexes();
    syncRedPacketConditionMode();
    syncRedPacketEnabledLabel();
  }

  function bindRedPacketActivity() {
    var root = document.getElementById("u6_state6");
    var timeRows = document.getElementById("redPacketTimeRanges");
    var tierRows = document.getElementById("redPacketTierRows");
    if (!root || !timeRows || !tierRows) { return; }
    loadRedPacketRecord();
    root.addEventListener("click", function (event) {
      var target = event.target.closest("button");
      var row;
      if (!target) { return; }
      if (target.hasAttribute("data-red-packet-month-select-all")) {
        Array.prototype.forEach.call(document.querySelectorAll('input[name="redPacketMonthDay"]'), function (input) { input.checked = true; });
      } else if (target.hasAttribute("data-red-packet-month-invert")) {
        Array.prototype.forEach.call(document.querySelectorAll('input[name="redPacketMonthDay"]'), function (input) { input.checked = !input.checked; });
      } else if (target.hasAttribute("data-red-packet-month-clear")) {
        Array.prototype.forEach.call(document.querySelectorAll('input[name="redPacketMonthDay"]'), function (input) { input.checked = false; });
      } else if (target.id === "redPacketAddTimeRange") {
        var timeRowsList = timeRows.querySelectorAll(".red-packet-time-row");
        var lastTimeRow = timeRowsList.length ? timeRowsList[timeRowsList.length - 1] : null;
        var lastEndDay = lastTimeRow ? lastTimeRow.querySelector(".red-packet-end-day") : null;
        var nextDefaults;
        if (lastEndDay && lastEndDay.value === "next") {
          window.alert("\u5f53\u524d\u6700\u540e\u4e00\u4e2a\u65f6\u95f4\u6bb5\u5df2\u8de8\u5929，\u8bf7\u5148\u53d6\u6d88\u6b21\u65e5\u7ed3\u675f\u518d\u6dfb\u52a0\u65b0\u65f6\u95f4\u6bb5。");
          return;
        }
        nextDefaults = getNextRedPacketTimeDefaults();
        if (!nextDefaults) {
          window.alert("\u5f53\u524d\u65f6\u95f4\u5df2\u63a5\u8fd1\u5f53\u65e5\u7ed3\u675f，\u8bf7\u5148\u8c03\u6574\u4e0a\u4e00\u6bb5\u65f6\u95f4\u3002");
          return;
        }
        timeRows.appendChild(createRedPacketTimeRow(nextDefaults.start, nextDefaults.end, nextDefaults.endDay));
        syncRedPacketTimeRows();
      } else if (target.id === "redPacketAddTier") {
        tierRows.appendChild(createRedPacketTierRow());
        syncRedPacketTierIndexes();
        syncRedPacketConditionMode();
      } else if (target.hasAttribute("data-red-packet-remove-time")) {
        row = target.closest(".red-packet-time-row");
        if (row) { row.remove(); syncRedPacketTimeRows(); }
      } else if (target.hasAttribute("data-red-packet-remove-tier")) {
        row = target.closest("tr");
        if (row) { row.remove(); syncRedPacketTierIndexes(); }
      }
    });
    root.addEventListener("change", function (event) {
      if (event.target && event.target.name === "redPacketConditionMode") { syncRedPacketConditionMode(); }
      if (event.target && event.target.id === "redPacketEnabled") { syncRedPacketEnabledLabel(); }
      if (event.target && event.target.classList.contains("red-packet-end-day")) { syncRedPacketTimeRows(); }
    });
    syncRedPacketTimeRows();
    syncRedPacketTierIndexes();
    syncRedPacketConditionMode();
    syncRedPacketEnabledLabel();
    [document.getElementById("u4"), document.getElementById("u5"), document.getElementById("u1")].forEach(function (button, index) {
      if (!button) { return; }
      button.addEventListener("click", function (event) {
        if (!document.body.classList.contains("red-packet-template-active")) { return; }
        event.preventDefault();
        event.stopImmediatePropagation();
        if (index === 0) { saveRedPacketActivity(); } else { window.location.href = "\u4f18\u60e0\u6d3b\u52a8\u5217\u8868.html"; }
      }, true);
    });
  }

  ready(function () {
    var select = document.getElementById("u3012_input");

    setText("u3011", "\u6d3b\u52a8\u6a21\u677f");
    ensureRewardTargetFields();
    Array.prototype.forEach.call(document.querySelectorAll(".custom-relief-table"), bindReliefRewardTable);
    bindActivityOgSelection();
    bindCustomActivityJump();
    bindChallengeActivity();
    bindRedPacketActivity();

    if (select) {
      select.setAttribute("aria-label", "\u6d3b\u52a8\u6a21\u677f");
      if (!select.value) {
        select.value = "\u5206\u4eab\u6d3b\u52a8";
      }
      if (new URLSearchParams(window.location.search).has("challengeId")) {
        select.value = "\u8fde\u7eed\u6311\u6218";
      }
      if (new URLSearchParams(window.location.search).has("redPacketId")) {
        select.value = "\u7ea2\u5305\u96e8";
      }
      bindTemplateSelect(select);
    }
  });
})();
