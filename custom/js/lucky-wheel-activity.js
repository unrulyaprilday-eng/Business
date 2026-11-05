(function () {
  var STORAGE_KEY = "promoLuckyWheelActivities";
  var REWARD_STORAGE_KEY = "promoRewardWheelActivities";
  var LIST_URL = "优惠活动列表.html";
  var query = new URLSearchParams(window.location.search);
  var editId = query.get("rewardWheelId") || query.get("luckyWheelId");
  var invalidEdit = false;
  var rewardTaskNames = { turnover: "打码", deposit: "充值", invite: "邀请" };
  var imageState = {
    Banner: { source: "", busy: false, version: 0 },
    Detail: { source: "", busy: false, version: 0 }
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function isRewardWheelType() {
    var template = byId("u3012_input");
    return Boolean(template && template.value === "\u5956\u52b1\u8f6c\u76d8");
  }

  function getStorageKey() {
    return isRewardWheelType() ? REWARD_STORAGE_KEY : STORAGE_KEY;
  }

  function each(nodes, callback) {
    Array.prototype.forEach.call(nodes, callback);
  }

  function readRecords() {
    var raw = window.localStorage.getItem(getStorageKey());
    var records = raw === null ? [] : JSON.parse(raw);
    if (!Array.isArray(records) || records.some(function (record) {
      return !record || typeof record !== "object" || typeof record.id !== "string" || !record.id;
    })) {
      throw new Error("Invalid wheel activities");
    }
    return records;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function sanitizeDescription(html) {
    var template = document.createElement("template");
    var allowedTags = "P BR DIV SPAN STRONG B EM I U S DEL H1 H2 H3 H4 H5 H6 BLOCKQUOTE UL OL LI A IMG TABLE THEAD TBODY TR TD TH".split(" ");
    var removedTags = "SCRIPT STYLE IFRAME OBJECT EMBED SVG MATH LINK META".split(" ");
    template.innerHTML = String(html || "");
    each(template.content.querySelectorAll("*"), function (element) {
      var tag = element.tagName;
      var parent = element.parentNode;
      if (!parent) { return; }
      if (removedTags.indexOf(tag) !== -1) {
        parent.removeChild(element);
        return;
      }
      if (allowedTags.indexOf(tag) === -1) {
        while (element.firstChild) { parent.insertBefore(element.firstChild, element); }
        parent.removeChild(element);
        return;
      }
      each(Array.prototype.slice.call(element.attributes), function (attribute) {
        var name = attribute.name.toLowerCase();
        var value = attribute.value.trim();
        var allowed = (tag === "A" && name === "href") ||
          (tag === "IMG" && (name === "src" || name === "alt" || name === "title")) ||
          ((tag === "TD" || tag === "TH") && (name === "colspan" || name === "rowspan"));
        if (!allowed || /^\s*javascript:/i.test(value)) {
          element.removeAttribute(attribute.name);
          return;
        }
        if (tag === "A" && name === "href" && !/^(https?:\/\/|mailto:|\/|\.\.?\/|#)/i.test(value)) {
          element.removeAttribute(attribute.name);
          return;
        }
        if (tag === "IMG" && name === "src" && !/^data:image\/(png|jpeg|webp);base64,/i.test(value)) {
          element.removeAttribute(attribute.name);
        }
      });
    });
    return template.innerHTML;
  }

  function showError(message) {
    var error = byId("luckyWheelError");
    if (!error) { return; }
    error.textContent = message;
    error.hidden = !message;
    if (message) { error.scrollIntoView({ block: "nearest" }); }
  }

  function clearError() {
    if (!invalidEdit) { showError(""); }
  }

  function syncLongTerm() {
    var longTerm = byId("luckyWheelLongTerm").checked;
    var endTime = byId("luckyWheelEndTime");
    endTime.disabled = longTerm;
    endTime.required = !longTerm;
  }

  function syncBonusFields() {
    byId("luckyWheelBonusFields").disabled = !byId("luckyWheelBonusEnabled").checked;
  }

  function syncRewardWheelSection() {
    var section = byId("rewardWheelChanceSection");
    var bonusSection = byId("luckyWheelBonusSection");
    var idLabel = byId("luckyWheelIdLabel");
    var rewardWheel = isRewardWheelType();
    if (section) { section.hidden = !rewardWheel; }
    if (bonusSection) { bonusSection.hidden = rewardWheel; }
    if (idLabel) { idLabel.textContent = rewardWheel ? "奖励转盘 ID" : "幸运转盘 ID"; }
  }

  function syncRewardChanceRules() {
    var enabledMethods = [];
    each(document.querySelectorAll("#rewardWheelChanceSection [data-reward-task]"), function (panel) {
      var type = panel.getAttribute("data-reward-task");
      var enabled = panel.querySelector("[data-reward-enabled]").checked;
      var rows = panel.querySelectorAll("[data-reward-tier]");
      panel.classList.toggle("is-disabled", !enabled);
      panel.querySelector("[data-reward-add-tier]").disabled = !enabled;
      panel.querySelector("[data-reward-status]").textContent = enabled ? "已配置 " + rows.length + " 档" : "已关闭，保留档位配置";
      each(rows, function (row, index) {
        var threshold = row.querySelector("[data-reward-threshold]");
        var count = row.querySelector("[data-reward-count]");
        row.querySelector("th[scope='row']").textContent = "第 " + (index + 1) + " 档";
        threshold.disabled = !enabled;
        count.disabled = !enabled;
        threshold.setAttribute("aria-label", rewardTaskNames[type] + "第" + (index + 1) + "档门槛");
        count.setAttribute("aria-label", rewardTaskNames[type] + "第" + (index + 1) + "档增加次数");
        row.querySelector("[data-reward-delete-tier]").disabled = !enabled || rows.length === 1;
      });
      if (enabled) { enabledMethods.push(rewardTaskNames[type] + "任务"); }
    });
    byId("rewardWheelMethodList").textContent = enabledMethods.length ? enabledMethods.join("、") : "无额外获次方式";
  }

  function fillRewardTasks(record) {
    each(document.querySelectorAll("#rewardWheelChanceSection [data-reward-task]"), function (panel) {
      var type = panel.getAttribute("data-reward-task");
      var task;
      if (record.chanceTasks != null) {
        task = record.chanceTasks[type];
        if (!task || typeof task.enabled !== "boolean" || !Array.isArray(task.tiers) || !task.tiers.length || task.tiers.some(function (tier) {
          return !tier || tier.threshold == null || tier.chances == null;
        })) { throw new Error("Invalid reward tiers"); }
      } else {
        // Upgrade existing single-rule activities without replacing their configured values.
        var oldChances = record[type + "Chances"];
        var oldThreshold = record[type + "Threshold"];
        task = {
          enabled: oldChances == null || Number(oldChances) !== 0,
          tiers: [{ threshold: oldThreshold == null ? (type === "invite" ? "1" : "") : oldThreshold,
            chances: oldChances == null || Number(oldChances) === 0 ? "1" : oldChances }]
        };
      }
      var tbody = panel.querySelector("tbody");
      var template = tbody.querySelector("[data-reward-tier]").cloneNode(true);
      tbody.textContent = "";
      task.tiers.forEach(function (tier) {
        var row = template.cloneNode(true);
        row.querySelector("[data-reward-threshold]").value = tier.threshold;
        row.querySelector("[data-reward-count]").value = tier.chances;
        tbody.appendChild(row);
      });
      panel.querySelector("[data-reward-enabled]").checked = task.enabled;
    });
    syncRewardChanceRules();
  }

  function collectRewardTasks() {
    var tasks = {};
    var panels = document.querySelectorAll("#rewardWheelChanceSection [data-reward-task]");
    var failure = null;
    each(panels, function (panel) {
      var type = panel.getAttribute("data-reward-task");
      var enabled = panel.querySelector("[data-reward-enabled]").checked;
      var previous = 0;
      var tiers = [];
      each(panel.querySelectorAll("[data-reward-tier]"), function (row, index) {
        var thresholdInput = row.querySelector("[data-reward-threshold]");
        var countInput = row.querySelector("[data-reward-count]");
        var threshold = thresholdInput.value.trim();
        var chances = countInput.value.trim();
        var label = rewardTaskNames[type] + "任务第 " + (index + 1) + " 档：";
        if (enabled && !failure) {
          if (!/^(?:\d+)(?:\.\d{1,2})?$/.test(threshold) || !Number.isFinite(Number(threshold)) || Number(threshold) <= 0 || Number(threshold) > Number.MAX_SAFE_INTEGER ||
              (type === "invite" && (!/^\d+$/.test(threshold) || !Number.isSafeInteger(Number(threshold))))) {
            failure = { type: type, input: thresholdInput, message: label + (type === "invite" ? "邀请人数须为正整数。" : "金额须大于 0，最多保留两位小数。") };
          } else if (Number(threshold) <= previous) {
            failure = { type: type, input: thresholdInput, message: label + "门槛须大于上一档，不能重复。" };
          } else if (!/^\d+$/.test(chances) || !Number.isSafeInteger(Number(chances)) || Number(chances) <= 0) {
            failure = { type: type, input: countInput, message: label + "增加次数须为正整数。" };
          }
        }
        previous = Number(threshold);
        tiers.push({ threshold: enabled ? String(Number(threshold)) : threshold, chances: enabled ? String(Number(chances)) : chances });
      });
      tasks[type] = { enabled: enabled, tiers: tiers };
    });
    if (failure) {
      showError(failure.message);
      failure.input.focus();
      return null;
    }
    return tasks;
  }

  function bindRewardTasks() {
    var section = byId("rewardWheelChanceSection");
    if (!section) { return; }
    section.addEventListener("click", function (event) {
      var add = event.target.closest("[data-reward-add-tier]");
      var remove = event.target.closest("[data-reward-delete-tier]");
      if ((!add && !remove) || (add || remove).disabled) { return; }
      var panel = (add || remove).closest("[data-reward-task]");
      var tbody = panel.querySelector("tbody");
      var focusInput;
      if (add) {
        var row = tbody.querySelector("[data-reward-tier]").cloneNode(true);
        focusInput = row.querySelector("[data-reward-threshold]");
        focusInput.value = "";
        row.querySelector("[data-reward-count]").value = "1";
        tbody.appendChild(row);
      } else if (tbody.querySelectorAll("[data-reward-tier]").length > 1) {
        tbody.removeChild(remove.closest("[data-reward-tier]"));
        focusInput = panel.querySelector("[data-reward-add-tier]");
      }
      syncRewardChanceRules();
      clearError();
      if (focusInput) { focusInput.focus(); }
    });
    section.addEventListener("change", function (event) {
      if (event.target.matches("[data-reward-enabled]")) { syncRewardChanceRules(); }
    });
    syncRewardChanceRules();
  }

  function renderWheelImage(kind, dataUrl) {
    var state = imageState[kind];
    var preview = byId("luckyWheel" + kind + "Preview");
    var hint = byId("luckyWheel" + kind + "Hint");
    var remove = byId("luckyWheel" + kind + "Remove");
    state.source = dataUrl || "";
    if (!state.source) {
      preview.removeAttribute("src");
      preview.hidden = true;
      hint.hidden = false;
      remove.hidden = true;
      return;
    }
    preview.src = state.source;
    preview.hidden = false;
    hint.hidden = true;
    remove.hidden = false;
  }

  function uploadWheelImage(kind, file) {
    if (!file) { return; }
    var state = imageState[kind];
    var version = ++state.version;
    var maxSize = kind === "Banner" ? 500 * 1024 : 1024 * 1024;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > maxSize) {
      state.busy = false;
      showError(kind === "Banner" ? "请上传 JPG、PNG 或 WebP 图片，Banner 最大 500KB。" : "请上传 JPG、PNG 或 WebP 图片，活动内页图最大 1MB。");
      return;
    }
    state.busy = true;
    var reader = new FileReader();
    function failImage() {
      if (version !== state.version) { return; }
      state.busy = false;
      showError("图片读取失败，请更换有效图片后重试。");
    }
    reader.onerror = failImage;
    reader.onload = function () {
      if (version !== state.version) { return; }
      var image = new Image();
      image.onerror = failImage;
      image.onload = function () {
        if (version !== state.version) { return; }
        state.busy = false;
        renderWheelImage(kind, reader.result);
        clearError();
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function ensureWheelOption(record) {
    var select = byId("luckyWheelId");
    if (!record.wheelId || Array.prototype.some.call(select.options, function (option) { return option.value === record.wheelId; })) {
      return;
    }
    var option = document.createElement("option");
    option.value = record.wheelId;
    option.textContent = record.wheelName || record.wheelId;
    select.appendChild(option);
  }

  function bindTemplateSelect() {
    var select = byId("luckyWheelTemplate");
    var source = byId("u3012_input");
    if (!select || !source) { return; }
    select.textContent = "";
    each(source.options, function (sourceOption) {
      if (!sourceOption.value) { return; }
      var option = sourceOption.cloneNode(true);
      option.removeAttribute("class");
      select.appendChild(option);
    });
    select.value = source.value || "幸运转盘";
    source.addEventListener("change", function () {
      select.value = source.value;
      syncRewardWheelSection();
    });
    select.addEventListener("change", function () {
      if (source.value === select.value) { return; }
      source.value = select.value;
      source.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  function fillForm(record) {
    var fields = {
      luckyWheelName: "name",
      luckyWheelTitle: "title",
      luckyWheelStartTime: "startTime",
      luckyWheelEndTime: "endTime",
      luckyWheelWagerMultiple: "wagerMultiple",
      luckyWheelSort: "sort",
      luckyWheelBonusDays: "bonusDays"
    };
    Object.keys(fields).forEach(function (id) {
      if (record[fields[id]] != null) { byId(id).value = record[fields[id]]; }
    });
    if (record.bonusExtraMultiplier != null || record.bonusMultiplier != null) {
      byId("luckyWheelBonusExtraMultiplier").value = record.bonusExtraMultiplier == null ? record.bonusMultiplier : record.bonusExtraMultiplier;
    }
    if (record.bonusCumulativeDepositAmount != null || record.bonusDepositAmount != null) {
      byId("luckyWheelBonusDepositAmount").value = record.bonusCumulativeDepositAmount == null ? record.bonusDepositAmount : record.bonusCumulativeDepositAmount;
    }
    byId("luckyWheelLongTerm").checked = record.longTerm === true;
    byId("luckyWheelBonusEnabled").checked = record.bonusEnabled === true;
    byId("luckyWheelSort").value = record.sort == null ? "0" : record.sort;
    byId("luckyWheelWagerMultiple").value = record.wagerMultiple == null ? "1" : record.wagerMultiple;
    byId("luckyWheelBonusDays").value = record.bonusDays == null ? "7" : record.bonusDays;
    each(document.querySelectorAll('input[name="luckyWheelRewardTarget"]'), function (input) {
      input.checked = input.value === (record.rewardTarget || "余额");
    });
    each(document.querySelectorAll('input[name="luckyWheelDrawPeriod"]'), function (input) {
      input.checked = input.value === (record.drawPeriod || "活动期间仅一次");
    });
    ensureWheelOption(record);
    byId("luckyWheelId").value = record.wheelId || "";
    renderWheelImage("Banner", record.banner || record.bannerImage || "");
    renderWheelImage("Detail", record.detailImage || "");
    var descriptionHtml = record.descriptionHtml;
    if (typeof descriptionHtml !== "string" || !descriptionHtml.trim()) {
      descriptionHtml = byId("luckyWheelDescription").innerHTML;
    }
    byId("luckyWheelDescription").innerHTML = sanitizeDescription(descriptionHtml);
    byId("rewardWheelDefaultCount").value = record.defaultChances == null ? "1" : record.defaultChances;
    if (isRewardWheelType()) { fillRewardTasks(record); }
    syncLongTerm();
    syncBonusFields();
    syncRewardWheelSection();
    updateCharCount();
  }

  function getDescriptionHtml() {
    var editor = byId("luckyWheelDescription");
    return sanitizeDescription(editor.classList.contains("is-source") ? editor.textContent : editor.innerHTML);
  }

  function updateCharCount() {
    var editor = byId("luckyWheelDescription");
    var text = editor.classList.contains("is-source") ? editor.textContent : editor.innerText;
    byId("luckyWheelCharCount").textContent = "Character Count: " + String(text || "").replace(/\s/g, "").length;
  }

  function getCheckedValue(name, fallback) {
    var checked = document.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : fallback;
  }

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") { return window.crypto.randomUUID(); }
    return (isRewardWheelType() ? "reward-wheel-" : "lucky-wheel-") + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
  }

  function saveActivity() {
    var name = byId("luckyWheelName").value.trim();
    var title = byId("luckyWheelTitle").value.trim();
    var startTime = byId("luckyWheelStartTime").value;
    var endTime = byId("luckyWheelEndTime").value;
    var longTerm = byId("luckyWheelLongTerm").checked;
    var wheelSelect = byId("luckyWheelId");
    var banner = imageState.Banner.source;
    var detailImage = imageState.Detail.source;
    var wagerMultiple = Number(byId("luckyWheelWagerMultiple").value);
    var sortValue = byId("luckyWheelSort").value;
    var bonusEnabled = byId("luckyWheelBonusEnabled").checked;
    var bonusCumulativeDepositAmount = byId("luckyWheelBonusDepositAmount").value;
    var bonusExtraMultiplier = byId("luckyWheelBonusExtraMultiplier").value;
    var bonusDays = byId("luckyWheelBonusDays").value;
    var rewardWheel = isRewardWheelType();
    var defaultChances = byId("rewardWheelDefaultCount").value;
    bonusEnabled = !rewardWheel && bonusEnabled;
    var chanceTasks;
    var storageKey = getStorageKey();
    var records;
    var record;
    var existingIndex;

    if (invalidEdit) { showError("无法编辑该活动，请返回列表重新打开。"); return; }
    if (imageState.Banner.busy || imageState.Detail.busy) { showError("图片仍在读取，请完成后再保存。"); return; }
    if (!name || !title || !startTime || (!longTerm && !endTime) || (!longTerm && startTime >= endTime) || !wheelSelect.value || !banner || byId("luckyWheelWagerMultiple").value === "" || !Number.isFinite(wagerMultiple) || wagerMultiple < 0) {
      showError("请填写活动名称、标题、有效时间、转盘 ID、Banner 和有效打码倍数；活动结束时间需晚于开始时间。");
      return;
    }
    if (!rewardWheel && bonusEnabled && (!Number.isFinite(Number(bonusCumulativeDepositAmount)) || Number(bonusCumulativeDepositAmount) <= 0 || !Number.isFinite(Number(bonusExtraMultiplier)) || Number(bonusExtraMultiplier) < 1 || !/^\d+$/.test(bonusDays) || Number(bonusDays) < 1)) {
      showError("请填写大于 0 的累计充值门槛、不小于 1 的额外发放倍数和正整数有效天数。");
      return;
    }
    if (sortValue !== "" && (!Number.isInteger(Number(sortValue)) || Number(sortValue) < 0)) {
      showError("排序请输入大于等于 0 的整数。");
      return;
    }
    if (rewardWheel && (!/^\d+$/.test(defaultChances) || !Number.isSafeInteger(Number(defaultChances)))) {
      showError("参与活动默认次数须为大于或等于 0 的整数。");
      byId("rewardWheelDefaultCount").focus();
      return;
    }
    if (rewardWheel) {
      chanceTasks = collectRewardTasks();
      if (!chanceTasks) { return; }
    }

    try {
      records = readRecords();
    } catch (error) {
      showError((rewardWheel ? "奖励转盘" : "幸运转盘") + "活动数据读取失败，请检查浏览器本地存储后重试。");
      return;
    }
    record = {
      id: editId || makeId(),
      activityType: rewardWheel ? "奖励转盘" : "幸运转盘",
      name: name,
      title: title,
      startTime: startTime,
      endTime: endTime,
      longTerm: longTerm,
      rewardTarget: getCheckedValue("luckyWheelRewardTarget", "余额"),
      drawPeriod: getCheckedValue("luckyWheelDrawPeriod", "活动期间仅一次"),
      wheelId: wheelSelect.value,
      wheelName: wheelSelect.options[wheelSelect.selectedIndex].textContent,
      banner: banner,
      detailImage: detailImage,
      wagerMultiple: String(wagerMultiple),
      sort: sortValue === "" ? "0" : String(Number(sortValue)),
      descriptionHtml: getDescriptionHtml(),
      bonusEnabled: bonusEnabled,
      bonusCumulativeDepositAmount: bonusEnabled ? String(Number(bonusCumulativeDepositAmount)) : "",
      bonusExtraMultiplier: bonusEnabled ? String(Number(bonusExtraMultiplier)) : "",
      bonusDays: bonusEnabled ? String(Number(bonusDays)) : "7",
      defaultChances: rewardWheel ? String(Number(defaultChances)) : undefined,
      chanceTasks: rewardWheel ? chanceTasks : undefined,
      chanceRewardMode: rewardWheel ? "each-tier-once-per-period" : undefined,
      enabled: true
    };
    existingIndex = records.findIndex(function (item) { return item.id === record.id; });
    if (existingIndex === -1) { records.push(record); } else {
      record.enabled = records[existingIndex].enabled !== false;
      records[existingIndex] = record;
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(records));
    } catch (error) {
      showError((rewardWheel ? "奖励转盘" : "幸运转盘") + "活动保存失败，请检查浏览器存储权限或剩余空间后重试。");
      return;
    }
    window.location.href = LIST_URL + (rewardWheel ? "?rewardWheelSaved=1" : "?luckyWheelSaved=1");
  }

  function closeForm() {
    window.location.href = LIST_URL;
  }

  function insertEditorImage(file, editor) {
    var reader;
    if (!file) { return; }
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 1024 * 1024) {
      showError(file.size > 1024 * 1024 ? "描述图片不能超过 1MB。" : "请使用 PNG、JPG 或 WebP 图片。");
      return;
    }
    reader = new FileReader();
    reader.onload = function () {
      editor.focus();
      document.execCommand("insertImage", false, reader.result);
      updateCharCount();
    };
    reader.onerror = function () { showError("图片读取失败，请重试。"); };
    reader.readAsDataURL(file);
  }

  function bindEditor(form) {
    var editor = byId("luckyWheelDescription");
    var imageInput = byId("luckyWheelDescriptionImage");
    var sourceMode = false;
    var previewMode = false;

    each(form.querySelectorAll("[data-lw-command]"), function (button) {
      button.addEventListener("mousedown", function (event) { event.preventDefault(); });
      button.addEventListener("click", function () {
        var command = button.getAttribute("data-lw-command");
        var value = button.getAttribute("data-lw-value");
        if (sourceMode || previewMode) { return; }
        editor.focus();
        document.execCommand(command, false, value || null);
        updateCharCount();
      });
    });
    each(form.querySelectorAll("[data-lw-action]"), function (button) {
      button.addEventListener("mousedown", function (event) { event.preventDefault(); });
      button.addEventListener("click", function () {
        var action = button.getAttribute("data-lw-action");
        var url;
        if (sourceMode || previewMode) { return; }
        if (action === "link") {
          url = window.prompt("请输入链接地址");
          if (!url || !/^(https?:\/\/|mailto:)/i.test(url)) { return; }
          editor.focus();
          document.execCommand("createLink", false, url);
        } else if (action === "image") {
          imageInput.click();
        } else if (action === "table") {
          editor.focus();
          document.execCommand("insertHTML", false, "<table><tbody><tr><td><br></td><td><br></td></tr><tr><td><br></td><td><br></td></tr></tbody></table><p><br></p>");
        }
        updateCharCount();
      });
    });
    each(form.querySelectorAll("[data-lw-mode]"), function (button) {
      button.addEventListener("mousedown", function (event) { event.preventDefault(); });
      button.addEventListener("click", function () {
        var mode = button.getAttribute("data-lw-mode");
        if (mode === "source") {
          if (previewMode) {
            previewMode = false;
            editor.classList.remove("is-preview");
            editor.setAttribute("contenteditable", "true");
          }
          if (sourceMode) {
            editor.innerHTML = sanitizeDescription(editor.textContent);
            editor.classList.remove("is-source");
            sourceMode = false;
            editor.setAttribute("contenteditable", "true");
          } else {
            editor.textContent = editor.innerHTML;
            editor.classList.add("is-source");
            sourceMode = true;
            editor.setAttribute("contenteditable", "true");
          }
          button.setAttribute("aria-pressed", String(sourceMode));
          var previewButton = form.querySelector('[data-lw-mode="preview"]');
          if (previewButton) { previewButton.setAttribute("aria-pressed", "false"); }
        } else {
          if (sourceMode) {
            editor.innerHTML = sanitizeDescription(editor.textContent);
            editor.classList.remove("is-source");
            sourceMode = false;
            form.querySelector('[data-lw-mode="source"]').setAttribute("aria-pressed", "false");
          }
          previewMode = !previewMode;
          editor.classList.toggle("is-preview", previewMode);
          editor.setAttribute("contenteditable", String(!previewMode));
          button.setAttribute("aria-pressed", String(previewMode));
        }
        updateCharCount();
      });
    });
    imageInput.addEventListener("change", function () {
      insertEditorImage(imageInput.files && imageInput.files[0], editor);
      imageInput.value = "";
    });
    editor.addEventListener("input", updateCharCount);
    editor.addEventListener("paste", function (event) {
      var html = event.clipboardData && event.clipboardData.getData("text/html");
      if (!html || sourceMode || previewMode) { return; }
      event.preventDefault();
      document.execCommand("insertHTML", false, sanitizeDescription(html));
      updateCharCount();
    });
    updateCharCount();
  }

  function bind() {
    var form = byId("luckyWheelActivityForm");
    if (!form || form.getAttribute("data-lw-bound") === "true") { return; }
    form.setAttribute("data-lw-bound", "true");
    bindTemplateSelect();
    syncRewardWheelSection();
    bindRewardTasks();
    byId("luckyWheelLongTerm").addEventListener("change", syncLongTerm);
    byId("luckyWheelBonusEnabled").addEventListener("change", syncBonusFields);
    ["Banner", "Detail"].forEach(function (kind) {
      var input = byId("luckyWheel" + kind + "File");
      var upload = byId("luckyWheel" + kind + "Upload");
      var remove = byId("luckyWheel" + kind + "Remove");
      upload.addEventListener("click", function () { input.click(); });
      upload.addEventListener("dragover", function (event) { event.preventDefault(); });
      upload.addEventListener("drop", function (event) {
        var file = event.dataTransfer && event.dataTransfer.files[0];
        event.preventDefault();
        if (file) { uploadWheelImage(kind, file); }
      });
      input.addEventListener("change", function () {
        uploadWheelImage(kind, input.files && input.files[0]);
        input.value = "";
      });
      remove.addEventListener("click", function () {
        imageState[kind].version++;
        imageState[kind].busy = false;
        input.value = "";
        renderWheelImage(kind, "");
        clearError();
      });
    });
    form.addEventListener("submit", function (event) { event.preventDefault(); saveActivity(); });
    form.addEventListener("input", clearError);
    form.addEventListener("change", clearError);
    each(form.closest(".lw-dialog").querySelectorAll("[data-lw-close], [data-lw-cancel]"), function (button) {
      button.addEventListener("click", closeForm);
    });
    bindEditor(form);
    syncLongTerm();
    syncBonusFields();

    if (editId) {
      try {
        var record = readRecords().find(function (item) { return item.id === editId; });
        if (record) { fillForm(record); }
        else { invalidEdit = true; showError("该转盘活动已不存在，请返回列表刷新后重试。"); }
      } catch (error) {
        invalidEdit = true;
        showError((isRewardWheelType() ? "奖励转盘" : "幸运转盘") + "活动数据读取失败，请检查浏览器本地存储后重试。");
      }
    }
    [byId("u4"), byId("u5"), byId("u1")].forEach(function (button, index) {
      if (!button) { return; }
      button.addEventListener("click", function (event) {
        if (!document.body.classList.contains("lucky-wheel-template-active")) { return; }
        event.preventDefault();
        event.stopImmediatePropagation();
        if (index === 0) { saveActivity(); } else { closeForm(); }
      }, true);
    });
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", bind); }
  else { bind(); }
})();
