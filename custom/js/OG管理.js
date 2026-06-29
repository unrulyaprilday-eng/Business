(function () {
  var ogRows = document.getElementById("ogRows");
  var ogModal = document.getElementById("ogModal");
  var deleteModal = document.getElementById("deleteModal");
  var ogFilterForm = document.getElementById("ogFilterForm");
  var ogTypeFilter = document.getElementById("ogTypeFilter");
  var ogStatusFilter = document.getElementById("ogStatusFilter");
  var ogKeywordFilter = document.getElementById("ogKeywordFilter");
  var ogFilterSubmit = document.getElementById("ogFilterSubmit");
  var ogModalTitle = document.getElementById("ogModalTitle");
  var ogTypeText = document.getElementById("ogTypeText");
  var ogName = document.getElementById("ogName");
  var ogUrl = document.getElementById("ogUrl");
  var ogEnabledInput = document.getElementById("ogEnabledInput");
  var ogInheritedInput = document.getElementById("ogInheritedInput");
  var ogTitleInput = document.getElementById("ogTitleInput");
  var ogDescriptionInput = document.getElementById("ogDescriptionInput");
  var ogUpdatedAt = document.getElementById("ogUpdatedAt");
  var ogConfirmButton = document.getElementById("ogConfirmButton");
  var ogCancelButton = document.getElementById("ogCancelButton");
  var deleteConfirmButton = document.getElementById("deleteConfirmButton");
  var statusRow = document.getElementById("statusRow");
  var inheritRow = document.getElementById("inheritRow");
  var previewTag = document.getElementById("previewTag");
  var previewImage = document.getElementById("previewImage");
  var previewTitle = document.getElementById("previewTitle");
  var previewDescription = document.getElementById("previewDescription");
  var previewUrl = document.getElementById("previewUrl");
  var previewStatus = document.getElementById("previewStatus");
  var summaryCountTotal = document.getElementById("summaryCountTotal");
  var summaryCountEnabled = document.getElementById("summaryCountEnabled");
  var summaryCountActivity = document.getElementById("summaryCountActivity");
  var library = window.OG_SHARED_LIBRARY || {};
  var rows = buildRows();
  var modalMode = "edit";
  var currentRecordKey = "";
  var pendingDeleteKey = "";
  var customSeed = 0;
  var MOCK_UPDATE_TIME = "2026-06-29 17:20:00";

  if (!ogRows) {
    return;
  }

  function cloneRow(record) {
    return {
      key: record.key,
      rowType: record.rowType,
      typeLabel: record.typeLabel,
      name: record.name,
      path: record.path,
      title: record.title,
      description: record.description,
      image: record.image,
      status: record.status,
      updatedAt: record.updatedAt,
      inherited: Boolean(record.inherited)
    };
  }

  function buildRows() {
    var sourceRows = typeof library.getAllRows === "function" ? library.getAllRows() : [];
    return sourceRows.map(function (record) {
      return cloneRow(record);
    });
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getRecordByKey(key) {
    var index;

    for (index = 0; index < rows.length; index += 1) {
      if (rows[index].key === key) {
        return rows[index];
      }
    }

    return null;
  }

  function getActivityOptionCount() {
    var options = library.activityOptions || [];
    return Math.max(options.length - 1, 0);
  }

  function getActions(record) {
    if (record.rowType === "site") {
      return ["edit", "preview"];
    }

    if (record.rowType === "custom") {
      return ["toggle", "edit", "copy", "delete", "preview"];
    }

    return ["toggle", "edit", "preview"];
  }

  function getStatusText(record) {
    return record.status === "on" ? "启用" : "关闭";
  }

  function renderActions(record) {
    var labels = {
      toggle: record.status === "on" ? "关闭" : "开启",
      edit: "编辑",
      preview: "预览",
      copy: "复制",
      delete: "删除"
    };

    return getActions(record).map(function (action) {
      var className = action === "delete" ? "danger-text" : "";
      return '<button class="' + className + '" type="button" data-action="' + action + '" data-key="' + escapeHtml(record.key) + '">' + labels[action] + "</button>";
    }).join("");
  }

  function getFilteredRows() {
    var typeValue = ogTypeFilter ? ogTypeFilter.value : "全部";
    var statusValue = ogStatusFilter ? ogStatusFilter.value : "全部";
    var keywordValue = ogKeywordFilter ? ogKeywordFilter.value.trim().toLowerCase() : "";

    return rows.filter(function (record) {
      var keywordText;

      if (typeValue !== "全部" && record.typeLabel !== typeValue) {
        return false;
      }

      if (statusValue !== "全部" && getStatusText(record) !== statusValue) {
        return false;
      }

      if (!keywordValue) {
        return true;
      }

      keywordText = [record.name, record.path, record.title, record.description].join(" ").toLowerCase();
      return keywordText.indexOf(keywordValue) !== -1;
    });
  }

  function updateSummary() {
    var enabledCount = rows.filter(function (record) {
      return record.status === "on";
    }).length;

    if (summaryCountTotal) {
      summaryCountTotal.textContent = String(rows.length);
    }

    if (summaryCountEnabled) {
      summaryCountEnabled.textContent = String(enabledCount);
    }

    if (summaryCountActivity) {
      summaryCountActivity.textContent = String(getActivityOptionCount());
    }
  }

  function renderTable() {
    var filteredRows = getFilteredRows();

    updateSummary();

    if (!filteredRows.length) {
      ogRows.innerHTML = '<tr><td colspan="9">暂无匹配的 OG 配置</td></tr>';
      return;
    }

    ogRows.innerHTML = filteredRows.map(function (record) {
      var rowClass = record.rowType === "site" ? "fixed-row" : "";
      var typeClass = record.rowType === "site" ? "site" : record.rowType === "custom" ? "custom" : "";

      return [
        '<tr class="' + rowClass + '">',
        '<td><span class="type-badge ' + typeClass + '">' + escapeHtml(record.typeLabel) + "</span></td>",
        '<td><div class="ell-text">' + escapeHtml(record.name) + "</div></td>",
        '<td><div class="path-text">' + escapeHtml(record.path) + "</div></td>",
        '<td><div class="multi-line">' + escapeHtml(record.title) + "</div></td>",
        '<td><div class="multi-line">' + escapeHtml(record.description) + "</div></td>",
        '<td><span class="thumb-mini">' + escapeHtml(record.image) + "</span></td>",
        '<td><span class="status-tag ' + (record.status === "off" ? "off" : "") + '">' + getStatusText(record) + "</span></td>",
        '<td>' + escapeHtml(record.updatedAt) + "</td>",
        '<td><span class="row-actions">' + renderActions(record) + "</span></td>",
        "</tr>"
      ].join("");
    }).join("");
  }

  function getTypeLabelByRowType(rowType) {
    if (rowType === "site") {
      return "站点OG";
    }

    if (rowType === "custom") {
      return "自定义链接";
    }

    return "页面OG";
  }

  function setPathEditable(isEditable) {
    ogUrl.readOnly = !isEditable;
    ogUrl.classList.toggle("is-readonly", !isEditable);
  }

  function setFormDisabled(isDisabled) {
    ogName.readOnly = isDisabled;
    ogName.classList.toggle("is-readonly", isDisabled);
    ogEnabledInput.disabled = isDisabled || ogTypeText.value === "站点OG";
    ogTitleInput.readOnly = isDisabled;
    ogTitleInput.classList.toggle("is-readonly", isDisabled);
    ogDescriptionInput.readOnly = isDisabled;
    ogDescriptionInput.classList.toggle("is-readonly", isDisabled);
  }

  function buildPreviewRecord() {
    var typeLabel = ogTypeText.value;
    var rowType = typeLabel === "站点OG" ? "site" : typeLabel === "自定义链接" ? "custom" : "module";
    var status = rowType === "site" ? "on" : (ogEnabledInput.checked ? "on" : "off");
    var inherited = rowType !== "site" && status === "off";

    return {
      rowType: rowType,
      typeLabel: typeLabel,
      name: ogName.value || "未命名",
      path: ogUrl.value || "/",
      title: ogTitleInput.value || "请填写OG标题",
      description: ogDescriptionInput.value || "请填写OG描述",
      image: (getRecordByKey(currentRecordKey) || {}).image || "OG",
      status: status,
      inherited: inherited
    };
  }

  function applyPreview(record) {
    previewTag.textContent = record.typeLabel;
    previewTitle.textContent = record.title;
    previewDescription.textContent = record.description;
    previewUrl.textContent = record.path;
    previewStatus.textContent = record.status === "on" ? "启用中" : "已关闭";

    if (previewImage) {
      previewImage.textContent = record.image || "OG";
    }
  }

  function syncPreviewFromInputs() {
    applyPreview(buildPreviewRecord());
  }

  function getEmptyCustomRecord() {
    customSeed += 1;

    return {
      key: "custom-draft-" + customSeed,
      rowType: "custom",
      typeLabel: "自定义链接",
      name: "",
      path: "/",
      title: "",
      description: "",
      image: "NEW",
      status: "on",
      updatedAt: "待保存",
      inherited: false
    };
  }

  function fillModal(record, mode) {
    var isCustom = record.rowType === "custom" || mode === "custom-add";
    var isSite = record.rowType === "site";
    var isPreview = mode === "preview";

    modalMode = mode;
    currentRecordKey = record.key || "";
    ogTypeText.value = mode === "custom-add" ? "自定义链接" : getTypeLabelByRowType(record.rowType);
    ogName.value = record.name || "";
    ogUrl.value = record.path || "/";
    ogEnabledInput.checked = isSite ? true : record.status !== "off";
    ogInheritedInput.checked = record.inherited;
    ogTitleInput.value = record.title || "";
    ogDescriptionInput.value = record.description || "";
    ogUpdatedAt.value = mode === "custom-add" ? "待保存" : record.updatedAt || MOCK_UPDATE_TIME;

    if (isSite) {
      ogModalTitle.textContent = isPreview ? "预览站点OG" : "编辑站点OG";
      statusRow.hidden = true;
    } else if (isCustom) {
      ogModalTitle.textContent = mode === "custom-add" ? "添加自定义链接OG" : (isPreview ? "预览自定义链接OG" : "编辑自定义链接OG");
      statusRow.hidden = false;
    } else {
      ogModalTitle.textContent = isPreview ? "预览页面OG" : "编辑页面OG";
      statusRow.hidden = false;
    }

    inheritRow.hidden = true;
    setPathEditable(isCustom && !isPreview);
    setFormDisabled(isPreview);

    if (ogConfirmButton) {
      ogConfirmButton.hidden = isPreview;
      ogConfirmButton.textContent = mode === "custom-add" ? "创建" : "保存";
    }

    if (ogCancelButton) {
      ogCancelButton.textContent = isPreview ? "关闭" : "取消";
    }

    applyPreview(buildPreviewRecord());
  }

  function openModal(target) {
    target.hidden = false;
  }

  function closeModal(target) {
    target.hidden = true;
  }

  function saveCurrentRecord() {
    var record;
    var nameValue = ogName.value.trim();
    var titleValue = ogTitleInput.value.trim();
    var descriptionValue = ogDescriptionInput.value.trim();
    var pathValue = ogUrl.value.trim() || "/";
    var statusValue = ogEnabledInput.checked ? "on" : "off";

    if (modalMode === "preview") {
      return;
    }

    if (modalMode === "custom-add") {
      rows.push({
        key: "custom-" + String(Date.now()),
        rowType: "custom",
        typeLabel: "自定义链接",
        name: nameValue || "未命名自定义链接",
        path: pathValue,
        title: titleValue || "未填写OG标题",
        description: descriptionValue || "未填写OG描述",
        image: "NEW",
        status: statusValue,
        updatedAt: MOCK_UPDATE_TIME,
        inherited: statusValue === "off"
      });
      renderTable();
      return;
    }

    record = getRecordByKey(currentRecordKey);

    if (!record) {
      return;
    }

    record.name = nameValue || record.name;

    if (record.rowType === "custom") {
      record.path = pathValue;
    }

    record.title = titleValue || record.title;
    record.description = descriptionValue || record.description;

    if (record.rowType !== "site") {
      record.status = statusValue;
      record.inherited = statusValue === "off";
    }

    record.updatedAt = MOCK_UPDATE_TIME;
    renderTable();
  }

  function toggleRecord(record) {
    if (!record || record.rowType === "site") {
      return;
    }

    record.status = record.status === "on" ? "off" : "on";
    record.inherited = record.status === "off";
    record.updatedAt = MOCK_UPDATE_TIME;
    renderTable();
  }

  function duplicateRecord(record) {
    var duplicateKey = "custom-copy-" + String(Date.now());

    rows.push({
      key: duplicateKey,
      rowType: "custom",
      typeLabel: "自定义链接",
      name: record.name + " 副本",
      path: record.path + "-copy",
      title: record.title,
      description: record.description,
      image: record.image,
      status: "off",
      updatedAt: MOCK_UPDATE_TIME,
      inherited: true
    });

    renderTable();
  }

  document.addEventListener("click", function (event) {
    var openButton = event.target.closest("[data-open-modal]");
    var actionButton = event.target.closest("[data-action]");
    var closeButton = event.target.closest("[data-close-modal]");
    var action;
    var record;

    if (openButton) {
      fillModal(getEmptyCustomRecord(), openButton.getAttribute("data-mode"));
      openModal(ogModal);
      return;
    }

    if (actionButton) {
      action = actionButton.getAttribute("data-action");
      record = getRecordByKey(actionButton.getAttribute("data-key"));

      if (!record) {
        return;
      }

      if (action === "toggle") {
        toggleRecord(record);
        return;
      }

      if (action === "edit") {
        fillModal(record, "edit");
        openModal(ogModal);
        return;
      }

      if (action === "preview") {
        fillModal(record, "preview");
        openModal(ogModal);
        return;
      }

      if (action === "copy") {
        duplicateRecord(record);
        return;
      }

      if (action === "delete") {
        pendingDeleteKey = record.key;
        openModal(deleteModal);
      }

      return;
    }

    if (closeButton) {
      if (closeButton === ogConfirmButton) {
        saveCurrentRecord();
      }

      if (closeButton === deleteConfirmButton && pendingDeleteKey) {
        rows = rows.filter(function (item) {
          return item.key !== pendingDeleteKey;
        });
        pendingDeleteKey = "";
        renderTable();
      }

      if (closeButton.closest("#ogModal")) {
        closeModal(ogModal);
        return;
      }

      if (closeButton.closest("#deleteModal")) {
        closeModal(deleteModal);
      }
    }
  });

  if (ogFilterSubmit) {
    ogFilterSubmit.addEventListener("click", renderTable);
  }

  if (ogFilterForm) {
    ogFilterForm.addEventListener("reset", function () {
      window.setTimeout(renderTable, 0);
    });
  }

  [ogName, ogUrl, ogEnabledInput, ogTitleInput, ogDescriptionInput].forEach(function (field) {
    if (!field) {
      return;
    }

    field.addEventListener("input", syncPreviewFromInputs);
    field.addEventListener("change", syncPreviewFromInputs);
  });

  renderTable();
})();
