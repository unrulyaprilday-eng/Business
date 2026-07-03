(function () {
  var CURRENT_USER = "admin02";
  var pendingLockRow = null;
  var pendingLockMode = "";
  var activeAuditRow = null;
  var activeAuditMode = "";

  function formatCount(value) {
    var text = value || "0";
    return Number(text) > 0 ? '<span class="risk-count-text">' + text + '</span>' : text;
  }

  function updateFooter(dialog, mode) {
    var cancelButton = dialog.querySelector("[data-risk-cancel]");
    var rejectButton = dialog.querySelector("[data-risk-reject]");
    var approveButton = dialog.querySelector("[data-approve]");
    var secondOnly = dialog.querySelector("[data-second-only]");
    var isView = mode === "view";
    if (cancelButton) cancelButton.hidden = isView;
    if (rejectButton) rejectButton.hidden = isView;
    if (approveButton) approveButton.textContent = isView ? "确定" : mode === "second" ? "复审通过" : "初审通过";
    if (secondOnly) secondOnly.hidden = mode !== "second";
  }

  function getMode(row) {
    return row && row.dataset.reviewStage === "second" ? "second" : "first";
  }

  function getAuditLabel(mode) {
    return mode === "second" ? "复审" : "初审";
  }

  function isCurrentFirstReviewer(row) {
    return getMode(row) === "second" && row.dataset.firstReviewer === CURRENT_USER;
  }

  function updateLockCell(row) {
    var cell = row && row.querySelector("[data-lock-user-cell]");
    if (!cell) return;
    var lockUser = row.dataset.lockUser || "";
    var badge = document.createElement("span");
    badge.className = "lock-user" + (lockUser ? lockUser === CURRENT_USER ? " is-current" : "" : " is-empty");
    badge.textContent = lockUser || "--";
    cell.replaceChildren(badge);
  }

  function updateFirstReviewerCell(row) {
    var cell = row && row.querySelector("[data-first-reviewer-cell]");
    if (cell) cell.textContent = row.dataset.firstReviewer || "--";
  }

  function updateStatusToSecond(row) {
    var status = row && row.querySelector(".status");
    if (!status) return;
    status.className = "status pass";
    status.textContent = "初审通过";
  }

  function renderAction(row) {
    var cell = row && row.querySelector(".actions");
    if (!cell) return;
    var mode = getMode(row);
    var lockUser = row.dataset.lockUser || "";
    cell.replaceChildren();
    if (isCurrentFirstReviewer(row) || lockUser && lockUser !== CURRENT_USER) return;

    var button = document.createElement("button");
    button.className = "link";
    button.type = "button";
    if (lockUser === CURRENT_USER) {
      button.dataset.audit = mode;
      button.textContent = getAuditLabel(mode);
    } else {
      button.dataset.lock = mode;
      button.textContent = "锁定";
    }
    cell.appendChild(button);
  }

  function renderRows() {
    document.querySelectorAll(".risk-table tbody tr").forEach(function (row) {
      updateLockCell(row);
      renderAction(row);
    });
  }

  function setText(dialog, selector, value) {
    var target = dialog.querySelector(selector);
    if (target) target.textContent = value || "--";
  }

  function updateDialog(dialog, row, mode) {
    if (!row.dataset.memberId) {
      activeAuditRow = null;
      activeAuditMode = "";
      var logNote = dialog.querySelector("[data-lock-note]");
      if (logNote) logNote.hidden = true;
      updateFooter(dialog, mode);
      return;
    }

    activeAuditRow = row;
    activeAuditMode = mode;
    var status = row.querySelector(".status");
    var order = row.querySelector("[data-order-cell]");
    var lockUser = row.dataset.lockUser || "";
    var firstReviewer = row.dataset.firstReviewer || "";
    setText(dialog, "[data-detail-order]", order ? order.textContent.trim() : "");
    setText(dialog, "[data-mode-text]", status ? status.textContent.trim() : "");
    setText(dialog, "[data-detail-member]", row.dataset.memberId);
    setText(dialog, "[data-detail-merchant]", row.dataset.merchantId);
    setText(dialog, "[data-detail-first-reviewer]", firstReviewer || "--");
    setText(dialog, "[data-detail-lock-user]", lockUser || "--");
    setText(dialog, "[data-detail-withdraw]", row.dataset.withdrawAmount);
    setText(dialog, "[data-detail-actual]", row.dataset.actualAmount);
    setText(dialog, "[data-detail-fee]", row.dataset.fee);
    setText(dialog, "[data-detail-apply-time]", row.dataset.applyTime);

    var accountTarget = dialog.querySelector("[data-detail-account-count]");
    var gameTarget = dialog.querySelector("[data-detail-game-count]");
    if (accountTarget) accountTarget.innerHTML = formatCount(row.dataset.accountCount);
    if (gameTarget) gameTarget.innerHTML = formatCount(row.dataset.gameCount);

    var lockNote = dialog.querySelector("[data-lock-note]");
    if (lockNote) {
      lockNote.hidden = mode === "view";
      lockNote.textContent = lockUser === CURRENT_USER
        ? "当前订单已由 " + CURRENT_USER + " 锁定，可继续提交" + getAuditLabel(mode) + "结果。"
        : "当前订单尚未由你锁定，请先锁定后再审核。";
    }
    updateFooter(dialog, mode);
  }

  function openLockConfirm(row, mode) {
    var dialog = document.querySelector('[data-dialog="lock-confirm"]');
    if (!dialog) return;
    var order = row.querySelector("[data-order-cell]");
    var title = dialog.querySelector("[data-lock-confirm-title]");
    var text = dialog.querySelector("[data-lock-confirm-text]");
    pendingLockRow = row;
    pendingLockMode = mode;
    if (title) title.textContent = "确认锁定该提现订单？";
    if (text) {
      text.textContent = "订单 " + (order ? order.textContent.trim() : "--") + " 将由 " + CURRENT_USER + " 锁定，锁定后仅锁定者可继续" + getAuditLabel(mode) + "。";
    }
    dialog.hidden = false;
  }

  function confirmPendingLock() {
    var row = pendingLockRow;
    var mode = pendingLockMode || getMode(row);
    var confirmDialog = document.querySelector('[data-dialog="lock-confirm"]');
    var auditDialog = document.querySelector('[data-dialog="audit"]');
    pendingLockRow = null;
    pendingLockMode = "";
    if (confirmDialog) confirmDialog.hidden = true;
    if (!row || !auditDialog || isCurrentFirstReviewer(row)) return;
    if (row.dataset.lockUser && row.dataset.lockUser !== CURRENT_USER) {
      renderAction(row);
      return;
    }
    row.dataset.lockUser = CURRENT_USER;
    updateLockCell(row);
    renderAction(row);
    updateDialog(auditDialog, row, mode);
    auditDialog.hidden = false;
  }

  function completeFirstReview() {
    var row = activeAuditRow;
    if (!row || activeAuditMode !== "first" || row.dataset.lockUser !== CURRENT_USER) return;
    row.dataset.reviewStage = "second";
    row.dataset.firstReviewer = CURRENT_USER;
    row.dataset.lockUser = "";
    updateStatusToSecond(row);
    updateFirstReviewerCell(row);
    updateLockCell(row);
    renderAction(row);
    activeAuditRow = null;
    activeAuditMode = "";
  }

  document.addEventListener("DOMContentLoaded", renderRows);

  document.addEventListener("click", function (event) {
    var approveButton = event.target.closest("[data-approve]");
    if (approveButton) {
      completeFirstReview();
      return;
    }

    var confirmButton = event.target.closest("[data-confirm-lock]");
    if (confirmButton) {
      confirmPendingLock();
      return;
    }

    var lockButton = event.target.closest("[data-lock]");
    if (lockButton) {
      var lockRow = lockButton.closest("tr");
      if (!lockRow || isCurrentFirstReviewer(lockRow)) return;
      if (lockRow.dataset.lockUser && lockRow.dataset.lockUser !== CURRENT_USER) {
        renderAction(lockRow);
        return;
      }
      openLockConfirm(lockRow, lockButton.dataset.lock || getMode(lockRow));
      return;
    }

    var auditButton = event.target.closest("[data-audit]");
    var row = auditButton && auditButton.closest("tr");
    var dialog = document.querySelector('[data-dialog="audit"]');
    if (!row || !dialog) return;

    updateDialog(dialog, row, auditButton.dataset.audit);
  });
})();
