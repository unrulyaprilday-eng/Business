(function () {
  var pointControl = window.memberPointControl;
  var records = pointControl.getRecords();
  var editor = pointControl.createEditor($("[data-member-point-editor]"), function () {
    currentPage = 1;
    renderRows();
  });

  var pageSize = 5;
  var currentPage = 1;
  var releasingId = null;
  var globalConfig = {
    balanceTriggerAmount: 100000,
    balanceReleaseAmount: 80000,
    balanceRtp: 95,
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
    records = pointControl.getRecords();
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

  function saveGlobalConfig() {
    var balanceTriggerAmount = Number($("#pointBalanceTrigger").value);
    var balanceReleaseAmount = Number($("#pointBalanceRelease").value);
    var balanceRtp = Number($("#pointBalanceRtp").value);
    var maxWinningAmount = Number($("#pointMaxWinningAmount").value);
    var maxWinMultiplier = Number($("#pointMaxWinMultiplier").value);
    var error = "";
    if (!Number.isFinite(balanceTriggerAmount) || balanceTriggerAmount < 0) {
      error = "触发余额需填写不小于0的数值，设为0表示不启用触发条件。";
    } else if (!Number.isFinite(balanceReleaseAmount) || balanceReleaseAmount < 0) {
      error = "解除余额需填写不小于0的数值，设为0表示不启用余额解除条件。";
    } else if (balanceTriggerAmount === 0 && balanceReleaseAmount !== 0) {
      error = "触发余额为0时，解除余额也需设为0。";
    } else if (balanceTriggerAmount > 0 && balanceReleaseAmount > 0 && balanceReleaseAmount >= balanceTriggerAmount) {
      error = "解除余额需低于触发余额，避免反复触发。";
    } else if (!Number.isFinite(balanceRtp) || balanceRtp < 50 || balanceRtp > 200) {
      error = "设定RTP需填写50至200之间的百分比。";
    } else if (!Number.isFinite(maxWinningAmount) || maxWinningAmount < 0) {
      error = "最大中奖金额需填写不小于0的金额。";
    } else if (!Number.isFinite(maxWinMultiplier) || maxWinMultiplier < 0) {
      error = "最大中奖倍数需填写不小于0的倍数。";
    }
    var errorElement = $("#pointGlobalConfigError");
    var saveState = $("#pointConfigSaveState");
    if (error) {
      errorElement.textContent = error;
      errorElement.hidden = false;
      saveState.textContent = "未保存";
      return;
    }
    globalConfig.balanceTriggerAmount = balanceTriggerAmount;
    globalConfig.balanceReleaseAmount = balanceReleaseAmount;
    globalConfig.balanceRtp = balanceRtp;
    globalConfig.maxWinningAmount = maxWinningAmount;
    globalConfig.maxWinMultiplier = maxWinMultiplier;
    errorElement.hidden = true;
    saveState.textContent = "已保存";
    editor.notify("全局配置已保存");
    setModal("global", false);
  }

  function openGlobalConfig() {
    $("#pointBalanceTrigger").value = globalConfig.balanceTriggerAmount;
    $("#pointBalanceRelease").value = globalConfig.balanceReleaseAmount;
    $("#pointBalanceRtp").value = globalConfig.balanceRtp;
    $("#pointMaxWinningAmount").value = globalConfig.maxWinningAmount;
    $("#pointMaxWinMultiplier").value = globalConfig.maxWinMultiplier;
    syncBalanceRtp();
    $("#pointConfigSaveState").textContent = "已保存";
    $("#pointGlobalConfigError").hidden = true;
    setModal("global", true);
  }

  function markGlobalConfigDirty() {
    $("#pointConfigSaveState").textContent = "未保存";
    $("#pointGlobalConfigError").hidden = true;
  }

  function syncBalanceRtp() {
    var rtp = Number($("#pointBalanceRtp").value);
    var direction = getDirection(rtp);
    var hint = $("#pointBalanceRtpHint");
    hint.className = "rtp-direction-hint direction-" + direction;
    if (direction === "win") {
      hint.innerHTML = "<strong>控赢</strong><span>RTP达到100%，按玩家净赢累计</span>";
    } else {
      hint.innerHTML = "<strong>控输</strong><span>RTP低于100%，按玩家净输累计</span>";
    }
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
        else if (openTarget === "create") editor.open();
      }
      if (closeButton) setModal(closeButton.getAttribute("data-point-close"), false);
      if (editButton) editor.open({ id: editButton.getAttribute("data-point-edit") });
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

    $("#pointGlobalConfigSave").addEventListener("click", saveGlobalConfig);
    $("#pointBalanceTrigger").addEventListener("input", markGlobalConfigDirty);
    $("#pointBalanceRelease").addEventListener("input", markGlobalConfigDirty);
    $("#pointBalanceRtp").addEventListener("input", function () {
      syncBalanceRtp();
      markGlobalConfigDirty();
    });
    $("#pointMaxWinningAmount").addEventListener("input", markGlobalConfigDirty);
    $("#pointMaxWinMultiplier").addEventListener("input", markGlobalConfigDirty);

    $("#pointReleaseConfirm").addEventListener("click", function () {
      var released = pointControl.release(releasingId);
      setModal("release", false);
      releasingId = null;
      renderRows();
      if (released) editor.notify("点控已解除");
    });
  }

  bindEvents();
  pointControl.onStorageChange(renderRows);
  syncBalanceRtp();
  renderRows();
})();
