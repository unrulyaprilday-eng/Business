(function () {
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

  document.addEventListener("click", function (event) {
    var auditButton = event.target.closest("[data-audit]");
    var row = auditButton && auditButton.closest("tr");
    var dialog = document.querySelector('[data-dialog="audit"]');
    if (!row || !dialog) return;

    var accountTarget = dialog.querySelector("[data-detail-account-count]");
    var gameTarget = dialog.querySelector("[data-detail-game-count]");
    if (accountTarget) accountTarget.innerHTML = formatCount(row.dataset.accountCount);
    if (gameTarget) gameTarget.innerHTML = formatCount(row.dataset.gameCount);
    updateFooter(dialog, auditButton.dataset.audit);
  });
})();
