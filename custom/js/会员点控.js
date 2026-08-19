(function () {
  var records = [
    { id: "pc-1001", memberId: "1010123475", username: "xxx123", vip: "VIP15", accountStatus: "启用", rtp: 105, targetAmount: 100000, completedAmount: 68450, status: "active", releaseResult: "", updatedAt: "2026-08-17 10:35:22", remark: "高价值玩家" },
    { id: "pc-1002", memberId: "1010123468", username: "zzz123", vip: "VIP10", accountStatus: "启用", rtp: 98, targetAmount: 50000, completedAmount: 47500, status: "active", releaseResult: "", updatedAt: "2026-08-17 09:42:10", remark: "" },
    { id: "pc-1003", memberId: "1010123462", username: "lucky77", vip: "VIP8", accountStatus: "启用", rtp: 90, targetAmount: 20000, completedAmount: 20000, status: "released", releaseResult: "amount", updatedAt: "2026-08-16 22:10:03", remark: "已达到目标" },
    { id: "pc-1004", memberId: "1010123449", username: "gamer_01", vip: "VIP5", accountStatus: "启用", rtp: 100, targetAmount: 10000, completedAmount: 3650, status: "active", releaseResult: "", updatedAt: "2026-08-16 18:20:44", remark: "100%控赢" },
    { id: "pc-1005", memberId: "1010123421", username: "betmaster", vip: "VIP12", accountStatus: "启用", rtp: 108, targetAmount: null, completedAmount: 123600, status: "active", releaseResult: "", updatedAt: "2026-08-15 16:04:18", remark: "无退出条件" },
    { id: "pc-1006", memberId: "1010123398", username: "sunshine", vip: "VIP3", accountStatus: "冻结", rtp: 92, targetAmount: 5000, completedAmount: 5000, status: "released", releaseResult: "amount", updatedAt: "2026-08-14 12:55:27", remark: "" }
  ];

  var pageSize = 5;
  var currentPage = 1;
  var editingId = null;
  var queriedMember = null;
  var releasingId = null;
  var globalConfig = {
    maxWinningAmount: 200,
    maxWinMultiplier: 200
  };

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function money(value) {
    return Number(value || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(date) {
    var pad = function (number) { return String(number).padStart(2, "0"); };
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + " " + pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds());
  }

  function getDirection(rtp) {
    return Number(rtp) >= 100 ? "win" : "lose";
  }

  function directionHtml(direction) {
    var labels = { win: "控赢", lose: "控输" };
    return '<span class="direction-tag direction-' + direction + '">' + labels[direction] + "</span>";
  }

  function pointValueHtml(value, direction, isTarget) {
    if (isTarget && !(value > 0)) return '<span class="no-exit-condition">不设置</span>';
    var label = direction === "win" ? "净赢 " : "净输 ";
    return '<span class="point-value point-value-' + direction + '">' + label + money(value) + "</span>";
  }

  function syncAutoRelease() {
    records.forEach(function (record) {
      if (record.targetAmount > 0 && record.status === "active" && record.completedAmount >= record.targetAmount) {
        record.status = "released";
        record.releaseResult = "amount";
      }
    });
  }

  function getFilteredRecords() {
    var memberId = $("#pointMemberId").value.trim().toLowerCase();
    var username = $("#pointUsername").value.trim().toLowerCase();
    var status = $("#pointStatus").value;
    var direction = $("#pointDirection").value;
    return records.filter(function (record) {
      return (!memberId || record.memberId.toLowerCase().indexOf(memberId) !== -1) &&
        (!username || record.username.toLowerCase().indexOf(username) !== -1) &&
        (!status || record.status === status) &&
        (!direction || getDirection(record.rtp) === direction);
    });
  }

  function statusHtml(record) {
    if (record.status === "released") return '<span class="cl-status cl-status-success">已解除</span>';
    return '<span class="cl-status cl-status-primary">点控中</span>';
  }

  function releaseResultHtml(record) {
    if (record.status !== "released") return '<span class="no-exit-condition">-</span>';
    if (record.releaseResult === "manual") return '<span class="cl-status cl-status-warning">手动解除</span>';
    return '<span class="cl-status cl-status-success">达到额度解除</span>';
  }

  function renderRows() {
    syncAutoRelease();
    var filtered = getFilteredRecords();
    var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    var start = (currentPage - 1) * pageSize;
    var rows = filtered.slice(start, start + pageSize);
    var body = $("#pointTableBody");

    if (!rows.length) {
      body.innerHTML = '<tr><td class="point-empty" colspan="15">暂无符合条件的点控记录</td></tr>';
    } else {
      body.innerHTML = rows.map(function (record, index) {
        var direction = getDirection(record.rtp);
        var hasExitCondition = record.targetAmount > 0;
        var progress = hasExitCondition ? Math.min(100, record.completedAmount / record.targetAmount * 100) : 0;
        var progressText = hasExitCondition ? progress.toFixed(2).replace(/\.00$/, "") + "%" : "-";
        var action = '<button class="cl-link" data-point-edit="' + escapeHtml(record.id) + '" type="button">编辑</button>';
        if (record.status === "active") action += '<button class="cl-link" data-point-release="' + escapeHtml(record.id) + '" type="button">解除</button>';
        return "<tr>" +
          "<td>" + (start + index + 1) + "</td>" +
          "<td>" + escapeHtml(record.memberId) + "</td>" +
          "<td class=\"point-username\">" + escapeHtml(record.username) + "</td>" +
          "<td>" + escapeHtml(record.vip) + "</td>" +
          "<td><span class=\"cl-status " + (record.accountStatus === "启用" ? "cl-status-success" : "cl-status-muted") + "\">" + escapeHtml(record.accountStatus) + "</span></td>" +
          "<td><strong class=\"rtp-value rtp-" + direction + "\">" + escapeHtml(record.rtp) + "%</strong></td>" +
          "<td>" + directionHtml(direction) + "</td>" +
          "<td>" + pointValueHtml(record.targetAmount, direction, true) + "</td>" +
          "<td>" + pointValueHtml(record.completedAmount, direction, false) + "</td>" +
          "<td>" + (hasExitCondition ? "<span class=\"progress-cell progress-" + direction + "\"><i style=\"width:" + progress + "%\"></i><em>" + progressText + "</em></span>" : "<span class=\"no-exit-condition\">-</span>") + "</td>" +
          "<td>" + statusHtml(record) + "</td>" +
          "<td>" + releaseResultHtml(record) + "</td>" +
          "<td class=\"point-remark\" title=\"" + escapeHtml(record.remark || "-") + "\">" + escapeHtml(record.remark || "-") + "</td>" +
          "<td>" + escapeHtml(record.updatedAt) + "</td>" +
          "<td class=\"action-col\"><span class=\"cl-row-actions\">" + action + "</span></td>" +
          "</tr>";
      }).join("");
    }

    renderSummary();
    renderPager(filtered.length, totalPages);
  }

  function renderSummary() {
    $("#activeCount").textContent = records.filter(function (record) { return record.status === "active"; }).length;
    $("#releasedCount").textContent = records.filter(function (record) { return record.status === "released"; }).length;
  }

  function renderPager(total, totalPages) {
    var pager = $("#pointPager");
    var html = '<button type="button" data-point-page="prev"' + (currentPage === 1 ? " disabled" : "") + '>‹</button>';
    for (var page = 1; page <= totalPages; page += 1) {
      html += '<button type="button" data-point-page="' + page + '" class="' + (page === currentPage ? "is-current" : "") + '">' + page + "</button>";
    }
    html += '<button type="button" data-point-page="next"' + (currentPage === totalPages ? " disabled" : "") + '>›</button>';
    html += "<span>" + pageSize + "条/页</span><span>共 " + total + " 条记录</span>";
    pager.innerHTML = html;
  }

  function setModal(name, open) {
    var modal = $('[data-point-modal="' + name + '"]');
    if (modal) modal.hidden = !open;
  }

  function syncEditorDirection() {
    var rtp = Number($("#editorRtp").value);
    var direction = getDirection(rtp);
    var hint = $("#editorDirectionHint");
    var targetInput = $("#editorTargetAmount");
    var targetLabel = $("#editorTargetLabel");
    hint.className = "rtp-direction-hint direction-" + direction;
    if (direction === "win") {
      hint.innerHTML = "<strong>控赢</strong><span>RTP达到100%，目标按玩家净赢累计</span>";
      targetLabel.textContent = "净赢目标金额";
      targetInput.placeholder = "可不设置净赢目标";
      targetInput.disabled = false;
    } else if (direction === "lose") {
      hint.innerHTML = "<strong>控输</strong><span>RTP低于100%，目标按玩家净输累计</span>";
      targetLabel.textContent = "净输目标金额";
      targetInput.placeholder = "可不设置净输目标";
      targetInput.disabled = false;
    }
  }

  function resetEditor() {
    $("#editorMemberId").value = "";
    $("#editorRtp").value = "95";
    $("#editorTargetAmount").value = "";
    $("#editorRemark").value = "";
    $("#pointConfigStep").hidden = true;
    $("#pointSave").disabled = true;
    $("#pointQueryResult").hidden = true;
    $("#pointQueryError").hidden = true;
    $("#pointFormError").hidden = true;
    queriedMember = null;
    syncEditorDirection();
  }

  function queryMember(isEditing) {
    var memberId = $("#editorMemberId").value.trim();
    var queryError = $("#pointQueryError");
    var queryResult = $("#pointQueryResult");
    var configStep = $("#pointConfigStep");
    var saveButton = $("#pointSave");
    queriedMember = null;
    configStep.hidden = true;
    saveButton.disabled = true;
    queryError.hidden = true;
    queryResult.hidden = true;
    if (!memberId) {
      queryError.textContent = "请输入会员ID后查询。";
      queryError.hidden = false;
      return;
    }
    if (!/^\d+$/.test(memberId)) {
      queryError.textContent = "会员ID只能输入数字。";
      queryError.hidden = false;
      return;
    }
    var existingRecord = records.find(function (item) { return item.memberId === memberId; });
    if (existingRecord && (!isEditing || existingRecord.id !== editingId)) {
      queryError.textContent = "该会员已有点控配置，请直接编辑已有配置。";
      queryError.hidden = false;
      return;
    }
    var member = existingRecord || { memberId: memberId, username: "会员" + memberId.slice(-4), vip: "", accountStatus: "启用" };
    queriedMember = member;
    queryResult.textContent = "已找到会员：" + member.username + "（ID：" + member.memberId + "）";
    queryResult.hidden = false;
    configStep.hidden = false;
    saveButton.disabled = false;
    syncEditorDirection();
  }

  function openEditor(id) {
    editingId = id || null;
    var title = $("#pointEditorTitle");
    if (!id) {
      title.textContent = "新增会员点控";
      resetEditor();
    } else {
      var record = records.find(function (item) { return item.id === id; });
      if (!record) return;
      title.textContent = "编辑会员点控";
      resetEditor();
      $("#editorMemberId").value = record.memberId;
      queryMember(true);
      $("#editorRtp").value = record.rtp;
      $("#editorTargetAmount").value = record.targetAmount == null ? "" : record.targetAmount;
      $("#editorRemark").value = record.remark || "";
      syncEditorDirection();
    }
    setModal("editor", true);
  }

  function saveEditor() {
    var memberId = $("#editorMemberId").value.trim();
    var rtp = Number($("#editorRtp").value);
    var direction = getDirection(rtp);
    var targetAmountInput = $("#editorTargetAmount").value.trim();
    var targetAmount = targetAmountInput === "" ? null : Number(targetAmountInput);
    var error = "";
    if (!queriedMember || queriedMember.memberId !== memberId) error = "请先输入会员ID并查询会员。";
    else if (!Number.isFinite(rtp) || rtp <= 0 || rtp > 200) error = "设定RTP需填写大于0且不超过200的百分比。";
    else if (targetAmount !== null && (!Number.isFinite(targetAmount) || targetAmount <= 0)) error = "目标金额留空表示无退出条件，否则需填写大于0的金额。";
    if (error) {
      $("#pointFormError").textContent = error;
      $("#pointFormError").hidden = false;
      return;
    }

    var now = formatDate(new Date());
    if (editingId) {
      var current = records.find(function (item) { return item.id === editingId; });
      if (!current) return;
      current.memberId = memberId;
      current.rtp = rtp;
      current.targetAmount = targetAmount;
      current.status = targetAmount !== null && current.completedAmount >= targetAmount ? "released" : "active";
      current.releaseResult = current.status === "released" ? "amount" : "";
      current.remark = $("#editorRemark").value.trim();
      current.updatedAt = now;
      showToast("点控配置已更新");
    } else {
      records.unshift({
        id: "pc-" + Date.now(),
        memberId: memberId,
        username: queriedMember.username,
        vip: queriedMember.vip || "-",
        accountStatus: queriedMember.accountStatus || "启用",
        rtp: rtp,
        targetAmount: targetAmount,
        completedAmount: 0,
        status: "active",
        releaseResult: "",
        updatedAt: now,
        remark: $("#editorRemark").value.trim()
      });
      showToast("点控配置已新增");
    }
    setModal("editor", false);
    currentPage = 1;
    renderRows();
  }

  function showToast(message) {
    var toast = $("#pointToast");
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () { toast.hidden = true; }, 2200);
  }

  function saveGlobalConfig() {
    var maxWinningAmount = Number($("#pointMaxWinningAmount").value);
    var maxWinMultiplier = Number($("#pointMaxWinMultiplier").value);
    var error = "";
    if (!Number.isFinite(maxWinningAmount) || maxWinningAmount < 0) {
      error = "最大中奖金额需填写不小于0的金额。";
    } else if (!Number.isFinite(maxWinMultiplier) || maxWinMultiplier < 0) {
      error = "最大中奖励倍数需填写不小于0的倍数。";
    }
    var errorElement = $("#pointGlobalConfigError");
    var saveState = $("#pointConfigSaveState");
    if (error) {
      errorElement.textContent = error;
      errorElement.hidden = false;
      saveState.textContent = "未保存";
      return;
    }
    globalConfig.maxWinningAmount = maxWinningAmount;
    globalConfig.maxWinMultiplier = maxWinMultiplier;
    errorElement.hidden = true;
    saveState.textContent = "已保存";
    showToast("全局配置已保存");
    setModal("global", false);
  }

  function openGlobalConfig() {
    $("#pointMaxWinningAmount").value = globalConfig.maxWinningAmount;
    $("#pointMaxWinMultiplier").value = globalConfig.maxWinMultiplier;
    $("#pointConfigSaveState").textContent = "已保存";
    $("#pointGlobalConfigError").hidden = true;
    setModal("global", true);
  }

  function markGlobalConfigDirty() {
    $("#pointConfigSaveState").textContent = "未保存";
    $("#pointGlobalConfigError").hidden = true;
  }

  function confirmRelease(id) {
    releasingId = id;
    setModal("release", true);
  }

  function bindEvents() {
    $("#pointFilter").addEventListener("submit", function (event) {
      event.preventDefault();
      currentPage = 1;
      renderRows();
    });

    $("#pointReset").addEventListener("click", function () {
      $("#pointFilter").reset();
      currentPage = 1;
      renderRows();
    });

    document.addEventListener("click", function (event) {
      var openButton = event.target.closest("[data-point-open]");
      var closeButton = event.target.closest("[data-point-close]");
      var editButton = event.target.closest("[data-point-edit]");
      var releaseButton = event.target.closest("[data-point-release]");
      var pageButton = event.target.closest("[data-point-page]");

      if (openButton) {
        var openTarget = openButton.getAttribute("data-point-open");
        if (openTarget === "global") openGlobalConfig();
        else openEditor(openTarget === "edit" ? editingId : null);
      }
      if (closeButton) setModal(closeButton.getAttribute("data-point-close"), false);
      if (editButton) openEditor(editButton.getAttribute("data-point-edit"));
      if (releaseButton) confirmRelease(releaseButton.getAttribute("data-point-release"));
      if (pageButton && !pageButton.disabled) {
        var filtered = getFilteredRecords();
        var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
        var requested = pageButton.getAttribute("data-point-page");
        if (requested === "prev") currentPage = Math.max(1, currentPage - 1);
        else if (requested === "next") currentPage = Math.min(totalPages, currentPage + 1);
        else currentPage = Number(requested);
        renderRows();
      }
    });

    $("#pointSave").addEventListener("click", saveEditor);

    $("#pointGlobalConfigSave").addEventListener("click", saveGlobalConfig);
    $("#pointMaxWinningAmount").addEventListener("input", markGlobalConfigDirty);
    $("#pointMaxWinMultiplier").addEventListener("input", markGlobalConfigDirty);

    $("#editorMemberQuery").addEventListener("click", function () {
      queryMember(Boolean(editingId));
    });

    $("#editorRtp").addEventListener("input", syncEditorDirection);

    $("#editorMemberId").addEventListener("input", function () {
      queriedMember = null;
      $("#pointConfigStep").hidden = true;
      $("#pointSave").disabled = true;
      $("#pointQueryResult").hidden = true;
      $("#pointQueryError").hidden = true;
    });

    $("#pointReleaseConfirm").addEventListener("click", function () {
      var record = records.find(function (item) { return item.id === releasingId; });
      if (record) {
        record.status = "released";
        record.releaseResult = "manual";
        record.updatedAt = formatDate(new Date());
      }
      setModal("release", false);
      releasingId = null;
      renderRows();
      showToast("点控已解除");
    });
  }

  bindEvents();
  renderRows();
})();
