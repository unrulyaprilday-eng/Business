(function () {
  "use strict";

  // Keep filename matching independent of table filters, selected rows and edit fields.
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function filenamePart(value) {
    return String(value).replace(/[<>:"/\\|?*%\u0000-\u001f]|[. ]$/g, function (character) {
      return "%" + character.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0");
    }).replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?=\.|$)/i, function (name) {
      return "%" + name.charCodeAt(0).toString(16).toUpperCase() + name.slice(1);
    });
  }

  function planImageImport(gameList, files, vendor, kind) {
    if (kind !== "icon" && kind !== "activeIcon") throw new Error("请选择图片类型");
    var targets = Object.create(null);
    var plan = files.map(function (file) {
      var result = { file: file, gameIndex: -1, status: "skip", reason: "" };
      var path = file.name.replace(/\\/g, "/").split("/");
      var basename = path.pop();
      if (path.some(function (part) { return part === "__MACOSX"; }) || basename.indexOf("._") === 0) {
        result.reason = "系统辅助文件，已跳过";
        return result;
      }
      var extension = /\.(png|jpe?g|gif)$/i.exec(basename);
      if (!extension) {
        result.reason = "仅支持 PNG / JPG / GIF 图片";
        return result;
      }
      var stem = basename.slice(0, -extension[0].length);
      var folder = path.length ? path[path.length - 1] : "";
      var knownFolder = gameList.some(function (game) {
        return folder === game.vendor || folder === filenamePart(game.vendor);
      });
      var matches = [];
      gameList.forEach(function (game, index) {
        if (game.id !== stem && filenamePart(game.id) !== stem) return;
        if (knownFolder && folder !== game.vendor && folder !== filenamePart(game.vendor)) return;
        matches.push(index);
      });
      if (!matches.length) {
        result.reason = "游戏 ID 无匹配，已跳过";
        return result;
      }
      matches = matches.filter(function (index) { return gameList[index].vendor === vendor; });
      if (!matches.length) {
        result.reason = "不在所选厂商范围，已跳过";
        return result;
      }
      if (matches.length > 1) {
        result.reason = "游戏 ID 重复，无法唯一匹配，已跳过";
        return result;
      }
      result.gameIndex = matches[0];
      if (file.error) {
        result.reason = file.error;
      } else if (!file.src) {
        result.reason = "图片无法读取，已跳过";
      } else {
        var ratio = kind === "activeIcon" ? 320 / 427 : 1;
        if (!file.width || !file.height || Math.abs(file.width / file.height - ratio) > ratio * .01) {
          result.reason = kind === "activeIcon" ? "比例不符，需 320×427 或等比例" : "比例不符，需 180×180 或等比例";
        } else {
          result.status = "ready";
          result.reason = "匹配成功，待覆盖";
        }
      }
      var key = String(result.gameIndex);
      if (!targets[key]) targets[key] = [];
      targets[key].push(result);
      return result;
    });
    Object.keys(targets).forEach(function (key) {
      if (targets[key].length < 2) return;
      targets[key].forEach(function (item) {
        item.status = "skip";
        item.reason = "同一游戏重复文件，全部跳过";
      });
    });
    return plan;
  }

  function applyImageImport(gameList, plan, kind) {
    if (kind !== "icon" && kind !== "activeIcon") throw new Error("请选择图片类型");
    var count = 0;
    plan.forEach(function (item) {
      if (item.status === "ready" && item.file.src && gameList[item.gameIndex]) {
        gameList[item.gameIndex][kind] = item.file.src;
        count += 1;
      }
    });
    return count;
  }

  async function saveImageFile(directory, name, data) {
    var handle = await directory.getFileHandle(name, { create: true });
    var writable = await handle.createWritable();
    try {
      await writable.write(data);
      await writable.close();
    } catch (error) {
      try { await writable.abort(); } catch (ignored) { /* Preserve the original write error. */ }
      throw error;
    }
  }

  if (typeof module === "object" && module.exports) {
    module.exports = { filenamePart: filenamePart, planImageImport: planImageImport, applyImageImport: applyImageImport, saveImageFile: saveImageFile };
    return;
  }

  function init() {
  if (!document.getElementById("gameRows") || !document.getElementById("imageExportModal") || !document.getElementById("imageImportModal")) return;
  var fallbackIcon = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='#13243d'/><stop offset='1' stop-color='#efb64a'/></linearGradient></defs><rect width='180' height='180' rx='16' fill='url(#g)'/><text x='90' y='76' text-anchor='middle' font-size='20' font-family='Arial' font-weight='700' fill='#ffd45d'>BLACK MYTH</text><text x='90' y='104' text-anchor='middle' font-size='24' font-family='Arial' font-weight='700' fill='#fff'>WUKONG</text><circle cx='90' cy='126' r='22' fill='#47301f'/></svg>");
  var fallbackActiveIcon = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='320' height='427'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='#0f1b2d'/><stop offset='1' stop-color='#b35b32'/></linearGradient></defs><rect width='320' height='427' fill='url(#g)'/><text x='160' y='76' text-anchor='middle' font-size='34' font-family='Arial' font-weight='700' fill='#ffd45d'>BLACK MYTH</text><text x='160' y='120' text-anchor='middle' font-size='46' font-family='Arial' font-weight='700' fill='#fff'>WUKONG</text><circle cx='160' cy='245' r='76' fill='#573320'/></svg>");

  var games = [
    { sort: 999, id: "slot-yellowbat::tigerboom", name: "Tiger Boom", supplier: "GX-INR", vendor: "GXgame", type: "电子", tag: "hot", enabled: true, icon: fallbackIcon, activeIcon: "" },
    { sort: 3, id: "60096", name: "Crash Touchdown", supplier: "GB-USD", vendor: "JL", type: "区块链", tag: "none", enabled: true, icon: "", activeIcon: "" },
    { sort: 1, id: "wg_3025", name: "Black Myth: Wukong", supplier: "HG-USD", vendor: "WG", type: "电子", tag: "new", enabled: true, icon: fallbackIcon, activeIcon: fallbackActiveIcon },
    { sort: 0, id: "wg_3032", name: "Mahjong Ways 2", supplier: "HG-USD", vendor: "WG", type: "电子", tag: "none", enabled: true, icon: "", activeIcon: "" },
    { sort: 0, id: "wg_3031", name: "Fortune Tiger", supplier: "HG-USD", vendor: "WG", type: "电子", tag: "none", enabled: true, icon: "", activeIcon: "" },
    { sort: 0, id: "wg_3029", name: "Mahjong Ways", supplier: "HG-USD", vendor: "WG", type: "电子", tag: "none", enabled: true, icon: "", activeIcon: "" },
    { sort: 0, id: "wg_3028", name: "Dragon's Treasure2", supplier: "HG-USD", vendor: "WG", type: "电子", tag: "hot", enabled: true, icon: "", activeIcon: "" }
  ];

  var rows = document.getElementById("gameRows");
  var selectAllRows = document.getElementById("selectAllRows");
  var batchToggle = document.getElementById("batchToggle");
  var batchMenu = document.getElementById("batchMenu");
  var modal = document.getElementById("editModal");
  var modalIcon = document.getElementById("modalIcon");
  var modalActiveIcon = document.getElementById("modalActiveIcon");
  var modalSort = document.getElementById("modalSort");
  var modalStatus = document.getElementById("modalStatus");
  var tagModal = document.getElementById("tagModal");
  var tagForm = document.getElementById("tagForm");
  var filterForm = document.getElementById("gameFilterForm");
  var activeFilters = {};
  var editingIndex = -1;
  var tagTargets = [];
  var returnFocus = null;
  var previousOverflow = "";
  var noticeTimer;
  var storageKey = "business.subgames.config.v1";

  function showNotice(text, error) {
    var element = document.getElementById("gameNotice");
    window.clearTimeout(noticeTimer);
    element.textContent = text;
    element.classList.toggle("is-error", !!error);
    element.hidden = false;
    noticeTimer = window.setTimeout(function () { element.hidden = true; }, 4500);
  }

  function formError(id, text) {
    var element = document.getElementById(id);
    element.textContent = text;
    element.hidden = !text;
  }

  function validTag(tag) {
    return tag === "none" || tag === "hot" || tag === "new";
  }

  function loadSavedGames() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
      if (!Array.isArray(saved) || saved.some(function (item) {
        return !item || !validTag(item.tag) || !Number.isSafeInteger(item.sort) || item.sort < 0 || typeof item.enabled !== "boolean";
      })) throw new Error("Invalid configuration");
      games.forEach(function (game) {
        var item = saved.find(function (entry) { return entry.id === game.id && entry.supplier === game.supplier && entry.vendor === game.vendor; });
        if (item) {
          game.tag = item.tag;
          game.sort = item.sort;
          game.enabled = item.enabled;
        }
      });
    } catch (error) {
      showNotice("已保存配置读取失败，请检查浏览器存储后重试。", true);
    }
  }

  // Commit configuration only after storage succeeds; images remain independent.
  function saveChanges(changes, errorId) {
    var next = games.map(function (game, index) {
      var change = changes.find(function (item) { return item.index === index; });
      return Object.assign({ id: game.id, supplier: game.supplier, vendor: game.vendor, sort: game.sort, tag: game.tag, enabled: game.enabled }, change ? change.values : {});
    });
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (error) {
      var text = "保存失败，请检查浏览器存储空间或权限后重试。";
      if (errorId) formError(errorId, text);
      else showNotice(text, true);
      return false;
    }
    changes.forEach(function (change) { Object.assign(games[change.index], change.values); });
    return true;
  }

  function matchesFilters(game) {
    return (!activeFilters.supplier || game.supplier === activeFilters.supplier) &&
      (!activeFilters.type || game.type === activeFilters.type) &&
      (!activeFilters.name || game.name.toLowerCase().indexOf(activeFilters.name) !== -1) &&
      (!activeFilters.enabled || game.enabled === (activeFilters.enabled === "on")) &&
      (!activeFilters.tag || game.tag === activeFilters.tag);
  }

  function chooseTag(layer, value) {
    layer.querySelectorAll('input[type="radio"]').forEach(function (input) { input.checked = input.value === value; });
  }

  function selectedTag(layer) {
    var input = layer.querySelector('input[type="radio"]:checked');
    return input ? input.value : "";
  }

  function openLayer(layer) {
    closeBatchMenu();
    returnFocus = document.activeElement;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    layer.hidden = false;
    layer.querySelector('[role="dialog"]').focus();
  }

  function closeLayer(layer) {
    layer.hidden = true;
    document.body.style.overflow = previousOverflow;
    if (returnFocus && returnFocus.isConnected) returnFocus.focus();
    else batchToggle.focus();
    if (layer === modal) editingIndex = -1;
    if (layer === tagModal) tagTargets = [];
  }

  function openTagModal(indices, value, batch) {
    tagTargets = indices.slice();
    chooseTag(tagForm, value);
    document.getElementById("tagTitle").textContent = batch ? "批量设置游戏标签" : "设置游戏标签";
    document.getElementById("tagTarget").textContent = batch ? "已选择 " + indices.length + " 个游戏" : games[indices[0]].name + "（" + games[indices[0]].id + "）";
    document.getElementById("tagHelp").textContent = batch ? "保存后，所选游戏的原有标签将统一替换；选择“无标签”将清除原有标签。" : "HOT 与 NEW 只能选择一个，选择“无标签”可清除已有标签。";
    formError("tagError", "");
    openLayer(tagModal);
  }

  function switchCell(value) {
    return "<span class=\"switch" + (value ? " on" : "") + "\" role=\"img\" aria-label=\"" + (value ? "开启" : "关闭") + "\"></span>";
  }

  function tagCell(game, index) {
    var badge = game.tag === "none" ? '<span class="subgame-no-tag">无标签</span>' : '<span class="subgame-tag subgame-tag-' + game.tag + '">' + game.tag.toUpperCase() + '</span>';
    return '<div class="subgame-tag-cell">' + badge + '<button class="tag-edit-link" type="button" data-index="' + index + '" aria-label="设置 ' + escapeHtml(game.name) + ' 的游戏标签">设置</button></div>';
  }

  function imageCell(src, active) {
    return src ? "<img class=\"thumb" + (active ? " active" : "") + "\" src=\"" + src + "\" alt=\"\">" : "-";
  }

  function renderRows() {
    games.forEach(function (game) { if (!matchesFilters(game)) game.selected = false; });
    rows.innerHTML = games.map(function (game, index) {
      if (!matchesFilters(game)) return "";
      return "<tr" + (game.selected ? " class=\"is-selected\"" : "") + ">" +
        "<td><input class=\"row-check\" type=\"checkbox\" data-index=\"" + index + "\"" + (game.selected ? " checked" : "") + "></td>" +
        "<td>" + game.sort + "</td>" +
        "<td>" + escapeHtml(game.id) + "</td>" +
        "<td>" + escapeHtml(game.name) + "</td>" +
        "<td>" + game.supplier + "</td>" +
        "<td>" + game.vendor + "</td>" +
        "<td>" + game.type + "</td>" +
        "<td>" + tagCell(game, index) + "</td>" +
        "<td>" + switchCell(game.enabled) + "</td>" +
        "<td>" + imageCell(game.icon, false) + "</td>" +
        "<td>" + imageCell(game.activeIcon, true) + "</td>" +
        "<td><button class=\"edit-link\" type=\"button\" data-index=\"" + index + "\">修改</button></td>" +
      "</tr>";
    }).join("") || '<tr><td colspan="12">暂无符合筛选条件的游戏，请调整条件或重置。</td></tr>';
    document.getElementById("gameTotal").textContent = "共 " + games.filter(matchesFilters).length + " 条记录";
    updateSelectAllState();
  }

  function getSelectedGames() {
    return games.filter(function (game) {
      return game.selected && matchesFilters(game);
    });
  }

  function updateSelectAllState() {
    var selectedCount = getSelectedGames().length;
    var visibleCount = games.filter(matchesFilters).length;
    selectAllRows.disabled = !visibleCount;
    selectAllRows.checked = visibleCount > 0 && selectedCount === visibleCount;
    selectAllRows.indeterminate = selectedCount > 0 && selectedCount < visibleCount;
  }

  function closeBatchMenu() {
    batchMenu.hidden = true;
    batchToggle.setAttribute("aria-expanded", "false");
  }

  function applyBatch(action) {
    var indices = [];
    games.forEach(function (game, index) { if (game.selected && matchesFilters(game)) indices.push(index); });
    if (!indices.length) {
      showNotice("请先勾选需要操作的游戏。", true);
      return;
    }
    var parts = action.split(":");
    if (parts[0] === "tag" && validTag(parts[1])) {
      openTagModal(indices, parts[1], true);
    } else if (parts[0] === "enabled" && (parts[1] === "on" || parts[1] === "off")) {
      if (!saveChanges(indices.map(function (index) { return { index: index, values: { enabled: parts[1] === "on" } }; }))) return;
      renderRows();
      showNotice("已更新 " + indices.length + " 个游戏的游戏开关。");
    }
  }

  function openModal(index) {
    var game = games[index];
    editingIndex = index;
    modalIcon.src = game.icon || fallbackIcon;
    modalActiveIcon.src = game.activeIcon || fallbackActiveIcon;
    modalSort.value = game.sort;
    chooseTag(modal, game.tag);
    modalStatus.checked = game.enabled;
    document.getElementById("modalStatusText").textContent = game.enabled ? "启用" : "停用";
    formError("editError", "");
    openLayer(modal);
  }

  rows.addEventListener("click", function (event) {
    var target = event.target;
    if (target && target.matches(".edit-link")) {
      openModal(Number(target.getAttribute("data-index")));
    } else if (target && target.matches(".tag-edit-link")) {
      var index = Number(target.getAttribute("data-index"));
      openTagModal([index], games[index].tag, false);
    }
  });

  rows.addEventListener("change", function (event) {
    var target = event.target;
    if (target && target.matches(".row-check")) {
      games[Number(target.getAttribute("data-index"))].selected = target.checked;
      renderRows();
    }
  });

  selectAllRows.addEventListener("change", function () {
    games.forEach(function (game) {
      game.selected = matchesFilters(game) && selectAllRows.checked;
    });
    renderRows();
  });

  batchToggle.addEventListener("click", function (event) {
    event.stopPropagation();
    batchMenu.hidden = !batchMenu.hidden;
    batchToggle.setAttribute("aria-expanded", String(!batchMenu.hidden));
  });

  batchMenu.addEventListener("click", function (event) {
    var target = event.target;
    if (target && target.hasAttribute("data-batch")) {
      applyBatch(target.getAttribute("data-batch"));
      closeBatchMenu();
    }
  });

  document.addEventListener("click", function (event) {
    if (!batchMenu.hidden && !event.target.closest(".batch-dropdown")) {
      closeBatchMenu();
    }
  });

  modal.addEventListener("click", function (event) {
    if (event.target === modal || event.target.hasAttribute("data-close")) {
      closeLayer(modal);
    }
  });

  modalStatus.addEventListener("change", function () {
    document.getElementById("modalStatusText").textContent = modalStatus.checked ? "启用" : "停用";
  });

  document.getElementById("saveGameEdit").addEventListener("click", function () {
    var sort = Number(modalSort.value);
    var tag = selectedTag(modal);
    if (!modalSort.value.trim() || !Number.isSafeInteger(sort) || sort < 0) {
      formError("editError", "排序请输入大于或等于 0 的整数。");
      return;
    }
    if (editingIndex < 0 || !validTag(tag)) return;
    if (!saveChanges([{ index: editingIndex, values: { sort: sort, tag: tag, enabled: modalStatus.checked } }], "editError")) return;
    renderRows();
    closeLayer(modal);
    showNotice("子游戏设置已保存。");
  });

  tagForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var tag = selectedTag(tagForm);
    if (!tagTargets.length || !validTag(tag)) return;
    var count = tagTargets.length;
    if (!saveChanges(tagTargets.map(function (index) { return { index: index, values: { tag: tag } }; }), "tagError")) return;
    renderRows();
    closeLayer(tagModal);
    showNotice("已" + (tag === "none" ? "清除 " : "设置 ") + count + " 个游戏的标签" + (tag === "none" ? "。" : "为 " + tag.toUpperCase() + "。"));
  });

  tagModal.addEventListener("click", function (event) {
    if (event.target === tagModal || event.target.closest("[data-tag-close]")) closeLayer(tagModal);
  });

  document.addEventListener("keydown", function (event) {
    var layer = !tagModal.hidden ? tagModal : !modal.hidden ? modal : null;
    if (event.key === "Escape") {
      closeBatchMenu();
      if (layer) closeLayer(layer);
    } else if (event.key === "Tab" && layer) {
      var controls = Array.from(layer.querySelectorAll("button, input")).filter(function (input) { return !input.disabled; });
      var first = controls[0];
      var last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === layer.querySelector('[role="dialog"]'))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  filterForm.addEventListener("submit", function (event) {
    event.preventDefault();
    activeFilters = {
      supplier: document.getElementById("filterSupplier").value,
      type: document.getElementById("filterType").value,
      name: document.getElementById("filterName").value.trim().toLowerCase(),
      enabled: document.getElementById("filterEnabled").value,
      tag: document.getElementById("filterTag").value
    };
    games.forEach(function (game) { game.selected = false; });
    closeBatchMenu();
    renderRows();
  });

  filterForm.addEventListener("reset", function () {
    activeFilters = {};
    games.forEach(function (game) { game.selected = false; });
    closeBatchMenu();
    renderRows();
  });

  function initImageTransfer() {
    var exportModal = document.getElementById("imageExportModal");
    var importModal = document.getElementById("imageImportModal");
    var exportForm = document.getElementById("imageExportForm");
    var importForm = document.getElementById("imageImportForm");
    var exportType = document.getElementById("exportImageType");
    var importType = document.getElementById("importImageType");
    var exportVendor = document.getElementById("exportImageVendor");
    var importVendor = document.getElementById("importImageVendor");
    var exportRows = document.getElementById("imageExportRows");
    var importRows = document.getElementById("imageImportRows");
    var fileInput = document.getElementById("gameImageFiles");
    var chooseExportFolder = document.getElementById("chooseImageExportFolder");
    var exportFolderName = document.getElementById("imageExportFolderName");
    var exportDirectory = null;
    var confirmExport = document.getElementById("confirmImageExport");
    var confirmImport = document.getElementById("confirmImageImport");
    var vendorNames = games.map(function (game) { return game.vendor; }).filter(function (name, index, names) { return names.indexOf(name) === index; });
    var importedFiles = [];
    var importPlan = [];
    var importApplied = false;
    var busy = false;
    var returnFocus = null;
    var previousOverflow = "";
    var noticeTimer;
    var maxImageBytes = 100 * 1024;
    var maxUploadBytes = 100 * 1024 * 1024;
    var maxFiles = 1000;

    function populateVendors(select) {
      select.innerHTML = '<option value="">请选择厂商</option>' + vendorNames.map(function (name) {
        return '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>';
      }).join("");
    }

    function selectedGames(select) {
      return games.filter(function (game) { return game.vendor === select.value; });
    }

    function message(id, text, success) {
      var element = document.getElementById(id);
      element.textContent = text;
      element.hidden = !text;
      element.classList.toggle("is-success", !!success);
    }

    function notice(text) {
      var element = document.getElementById("imageTransferNotice");
      window.clearTimeout(noticeTimer);
      element.textContent = text;
      element.hidden = false;
      noticeTimer = window.setTimeout(function () { element.hidden = true; }, 6000);
    }

    function setBusy(form, value) {
      busy = value;
      form.setAttribute("aria-busy", String(value));
      form.querySelectorAll("button, input, select").forEach(function (element) { element.disabled = value; });
    }

    function renderExport() {
      var list = selectedGames(exportVendor);
      document.getElementById("imageExportSummary").textContent = !exportVendor.value ? "请选择需要导出的厂商。" : exportVendor.value + "，共 " + list.length + " 个游戏，按游戏 ID 逐张保存图片。";
      exportRows.innerHTML = list.map(function (game) {
        return "<tr><td>" + escapeHtml(game.vendor) + "</td><td>" + escapeHtml(game.id) + "</td><td>" + escapeHtml(game.name) + "</td></tr>";
      }).join("") || '<tr><td colspan="3">请选择需要导出的厂商。</td></tr>';
      exportFolderName.textContent = exportDirectory ? exportDirectory.name : "未选择文件夹";
      chooseExportFolder.textContent = exportDirectory ? "重新选择文件夹" : "选择保存文件夹";
      chooseExportFolder.disabled = busy || typeof window.showDirectoryPicker !== "function";
      confirmExport.disabled = busy || !list.length || !exportDirectory;
      if (typeof window.showDirectoryPicker !== "function") message("imageExportMessage", "当前浏览器环境不支持选择保存文件夹，请在支持文件夹保存的浏览器中打开页面后重试。");
    }

    function renderImport() {
      importPlan = planImageImport(games, importedFiles, importVendor.value, importType.value);
      var ready = importPlan.filter(function (item) { return item.status === "ready"; }).length;
      var total = importPlan.length;
      document.getElementById("imageImportSizeHint").textContent = importType.value === "activeIcon" ? "320×427 或等比例" : "180×180 或等比例";
      document.getElementById("imageImportSummary").textContent = !total ? "请上传需要替换的图片。" : importApplied ? "已覆盖 " + ready + " 张，跳过 " + (total - ready) + " 个文件。未匹配到上传文件的游戏保持原样。" : "共 " + total + " 个文件，匹配成功 " + ready + " 张，跳过 " + (total - ready) + " 个。确认后仅覆盖匹配成功的图片。";
      importRows.innerHTML = importPlan.map(function (item) {
        var game = games[item.gameIndex];
        var label = game ? escapeHtml(game.name) + '<span class="image-preview-subtext">' + escapeHtml(game.id) + " / " + escapeHtml(game.vendor) + "</span>" : "—";
        var before = game && game[importType.value] ? '<img src="' + escapeHtml(game[importType.value]) + '" alt="原图">' : "—";
        var after = item.file.src ? '<img src="' + escapeHtml(item.file.src) + '" alt="待导入图片">' : "—";
        return "<tr><td>" + escapeHtml(item.file.name) + "</td><td>" + label + "</td><td>" + before + "</td><td>" + after + '</td><td class="image-match-' + item.status + '">' + escapeHtml(importApplied && item.status === "ready" ? "已覆盖" : item.reason) + "</td></tr>";
      }).join("") || '<tr><td colspan="5">上传后预览匹配结果，确认后才会覆盖。</td></tr>';
      confirmImport.textContent = importApplied ? "已完成覆盖" : "确认覆盖" + (ready ? "（" + ready + " 张）" : "");
      confirmImport.disabled = busy || !ready || importApplied;
    }

    function resetImport() {
      importedFiles = [];
      importPlan = [];
      importApplied = false;
      fileInput.value = "";
      document.getElementById("gameImageFileSummary").textContent = "可多选图片文件。支持 PNG / JPG / GIF，单张小于 100KB，每次最多 1000 张，总大小不超过 100MB。";
      message("imageImportMessage", "");
      renderImport();
    }

    function openTransfer(layer) {
      if (busy) return;
      closeBatchMenu();
      returnFocus = document.activeElement;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      layer.hidden = false;
      if (layer === exportModal) {
        exportDirectory = null;
        message("imageExportMessage", "");
        renderExport();
      } else {
        resetImport();
      }
      layer.querySelector(".image-transfer-modal").focus();
    }

    function closeTransfer(layer) {
      if (busy) return;
      layer.hidden = true;
      if (layer === exportModal) exportDirectory = null;
      if (layer === importModal) resetImport();
      document.body.style.overflow = previousOverflow;
      if (returnFocus) returnFocus.focus();
    }

    function loadImage(src) {
      return new Promise(function (resolve, reject) {
        var image = new Image();
        var timer = window.setTimeout(function () { image.src = ""; reject(new Error("图片读取超时")); }, 10000);
        image.onload = function () { window.clearTimeout(timer); resolve(image); };
        image.onerror = function () { window.clearTimeout(timer); reject(new Error("图片损坏或无法读取")); };
        image.src = src;
      });
    }

    function dataUrl(blob) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () { resolve(reader.result); };
        reader.onerror = function () { reject(new Error("文件读取失败")); };
        reader.readAsDataURL(blob);
      });
    }

    function detectImage(bytes) {
      if (bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10) return { mime: "image/png", extension: "png" };
      if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return { mime: "image/jpeg", extension: "jpg" };
      if (bytes.length >= 6 && String.fromCharCode.apply(null, bytes.subarray(0, 6)).match(/^GIF8[79]a$/)) return { mime: "image/gif", extension: "gif" };
      return null;
    }

    async function exportImage(src) {
      if (!src) return { data: new Uint8Array(), extension: "png" };
      var response = await fetch(src);
      if (!response.ok) throw new Error("图片读取失败");
      var blob = await response.blob();
      var bytes = new Uint8Array(await blob.arrayBuffer());
      if (!bytes.length) return { data: bytes, extension: "png" };
      var format = detectImage(bytes);
      if (format) return { data: bytes, extension: format.extension };
      // Axure prototype defaults use SVG; deliver editable PNG files for the same import workflow.
      var image = await loadImage(src);
      var canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      var context = canvas.getContext("2d");
      if (!context) throw new Error("当前浏览器无法转换图片");
      context.drawImage(image, 0, 0);
      var png = await new Promise(function (resolve, reject) {
        canvas.toBlob(function (result) { if (result) resolve(result); else reject(new Error("图片转换失败")); }, "image/png");
      });
      return { data: new Uint8Array(await png.arrayBuffer()), extension: "png" };
    }

    async function inspectFile(file) {
      var result = { name: file.name, src: "", error: "" };
      if (!/\.(png|jpe?g|gif)$/i.test(file.name)) return result;
      if (file.error) { result.error = file.error; return result; }
      if (file.data.byteLength >= maxImageBytes) {
        result.error = "图片需小于 100KB，已跳过";
        return result;
      }
      var format = detectImage(file.data);
      if (!format) {
        result.error = "图片格式无效，已跳过";
        return result;
      }
      var fileExtension = /\.([^./]+)$/.exec(file.name)[1].toLowerCase().replace("jpeg", "jpg");
      if (fileExtension !== format.extension) {
        result.error = "扩展名与图片格式不一致，已跳过";
        return result;
      }
      try {
        var src = await dataUrl(new Blob([file.data], { type: format.mime }));
        var image = await loadImage(src);
        result.src = src;
        result.width = image.naturalWidth;
        result.height = image.naturalHeight;
      } catch (error) {
        result.error = error.message + "，已跳过";
      }
      return result;
    }

    populateVendors(exportVendor);
    populateVendors(importVendor);
    document.getElementById("openImageExport").addEventListener("click", function () { openTransfer(exportModal); });
    document.getElementById("openImageImport").addEventListener("click", function () { openTransfer(importModal); });
    [exportModal, importModal].forEach(function (layer) {
      layer.addEventListener("click", function (event) {
        if (event.target === layer || event.target.closest("[data-image-close]")) closeTransfer(layer);
      });
    });
    document.addEventListener("keydown", function (event) {
      var layer = !exportModal.hidden ? exportModal : !importModal.hidden ? importModal : null;
      if (!layer) return;
      if (event.key === "Escape") { event.preventDefault(); closeTransfer(layer); }
      if (event.key === "Tab") {
        var focusables = Array.from(layer.querySelectorAll("button:not(:disabled), input:not(:disabled), select:not(:disabled)")).filter(function (element) { return !element.hidden; });
        if (!focusables.length) { event.preventDefault(); return; }
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === layer.querySelector("section"))) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
    });
    exportVendor.addEventListener("change", function () { message("imageExportMessage", ""); renderExport(); });
    importVendor.addEventListener("change", function () { importApplied = false; message("imageImportMessage", ""); renderImport(); });
    exportType.addEventListener("change", function () { message("imageExportMessage", ""); renderExport(); });
    importType.addEventListener("change", function () { importApplied = false; message("imageImportMessage", ""); renderImport(); });
    document.getElementById("clearGameImageFiles").addEventListener("click", resetImport);

    chooseExportFolder.addEventListener("click", async function () {
      if (busy || typeof window.showDirectoryPicker !== "function") return;
      setBusy(exportForm, true);
      try {
        var directory = await window.showDirectoryPicker({ id: "subgame-images", mode: "readwrite", startIn: "downloads" });
        exportDirectory = directory;
        message("imageExportMessage", "已选择保存文件夹：" + directory.name + "。点击开始下载，图片将逐张保存。", true);
      } catch (error) {
        if (error.name === "AbortError") {
          message("imageExportMessage", exportDirectory ? "已取消重新选择，继续使用当前文件夹。" : "已取消选择文件夹。请选择保存位置后开始下载。");
        } else if (error.name === "SecurityError") {
          message("imageExportMessage", "当前页面无法访问文件夹，请在浏览器中单独打开本页面后重试。");
        } else {
          message("imageExportMessage", "无法选择保存文件夹，请允许文件夹访问后重试。" + (error.message || ""));
        }
      } finally {
        setBusy(exportForm, false);
        renderExport();
      }
    });

    exportForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (busy) return;
      if (!exportDirectory) { message("imageExportMessage", "请先选择保存文件夹。"); return; }
      var kind = exportType.value;
      var list = selectedGames(exportVendor);
      if (!list.length) return;
      var failed = [];
      var saved = 0;
      setBusy(exportForm, true);
      try {
        for (var index = 0; index < list.length; index += 1) {
          var game = list[index];
          message("imageExportMessage", "正在下载 " + (index + 1) + " / " + list.length + "：" + game.id);
          try {
            var file = await exportImage(game[kind]);
            await saveImageFile(exportDirectory, filenamePart(game.id) + "." + file.extension, file.data);
            saved += 1;
          } catch (error) {
            failed.push(game.id + "（" + error.message + "）");
          }
        }
        var result = "已保存 " + saved + " 个文件到「" + exportDirectory.name + "」。";
        if (failed.length) result += " 下载失败 " + failed.length + " 个：" + failed.join("、") + "。请检查后重试。";
        message("imageExportMessage", result, !failed.length);
        if (saved) notice("已保存 " + saved + " 个游戏图片文件到「" + exportDirectory.name + "」。");
      } catch (error) {
        message("imageExportMessage", "已保存 " + saved + " 个文件，下载中断：" + error.message);
      } finally {
        setBusy(exportForm, false);
        renderExport();
      }
    });

    document.getElementById("chooseGameImageFiles").addEventListener("click", function () {
      if (busy) return;
      fileInput.value = "";
      fileInput.click();
    });

    async function readUploads(event) {
      if (busy) return;
      var uploads = Array.from(event.currentTarget.files || []);
      importedFiles = [];
      importApplied = false;
      message("imageImportMessage", "");
      renderImport();
      if (!uploads.length) { resetImport(); return; }
      setBusy(importForm, true);
      try {
        if (uploads.length > maxFiles) throw new Error("每次最多上传 1000 个文件，请分批处理。");
        if (uploads.reduce(function (total, file) { return total + file.size; }, 0) > maxUploadBytes) throw new Error("文件总大小超过 100MB，请分批处理。");
        for (var index = 0; index < uploads.length; index += 1) {
          var upload = uploads[index];
          var name = upload.name;
          message("imageImportMessage", "正在检查图片 " + (index + 1) + " / " + uploads.length + "…");
          var entry = { name: name, data: new Uint8Array() };
          if (!/\.(png|jpe?g|gif)$/i.test(name)) {
            importedFiles.push(await inspectFile(entry));
            continue;
          }
          if (upload.size >= maxImageBytes) {
            entry.error = "图片需小于 100KB，已跳过";
          } else {
            try { entry.data = new Uint8Array(await upload.arrayBuffer()); }
            catch (error) { entry.error = "文件读取失败，已跳过"; }
          }
          importedFiles.push(await inspectFile(entry));
        }
        document.getElementById("gameImageFileSummary").textContent = "已选择 " + importedFiles.length + " 个图片文件。重新选择会替换本次待导入内容。";
        message("imageImportMessage", "请核对匹配结果；跳过项不会覆盖已有图片。");
      } catch (error) {
        importedFiles = [];
        fileInput.value = "";
        document.getElementById("gameImageFileSummary").textContent = "文件未读取成功，请检查后重新选择。";
        message("imageImportMessage", "导入文件读取失败：" + error.message);
      } finally {
        setBusy(importForm, false);
        renderImport();
      }
    }
    fileInput.addEventListener("change", readUploads);

    importForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (busy || importApplied) return;
      renderImport();
      var ready = importPlan.filter(function (item) { return item.status === "ready"; }).length;
      if (!ready) return;
      var count = applyImageImport(games, importPlan, importType.value);
      importApplied = true;
      renderRows();
      renderImport();
      message("imageImportMessage", "已覆盖 " + count + " 张" + (importType.value === "icon" ? "方形图" : "竖版图") + "。其他游戏图片保持原样。", true);
      notice("游戏图片导入完成，已覆盖 " + count + " 张。");
    });
  }

  loadSavedGames();
  initImageTransfer();
  renderRows();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
