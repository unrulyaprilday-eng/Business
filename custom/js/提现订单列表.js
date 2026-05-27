(function () {
  function showTab(name) {
    document.querySelectorAll(".tab").forEach(function (tab) {
      tab.classList.toggle("is-active", tab.dataset.tab === name);
    });
    document.querySelectorAll(".tab-pane").forEach(function (pane) {
      pane.classList.toggle("is-active", pane.dataset.pane === name);
    });
  }

  function showInnerTab(name) {
    document.querySelectorAll(".dialog-tab").forEach(function (tab) {
      tab.classList.toggle("is-active", tab.dataset.innerTab === name);
    });
    document.querySelectorAll(".dialog-pane").forEach(function (pane) {
      pane.classList.toggle("is-active", pane.dataset.innerPane === name);
    });
  }

  function openAudit(mode) {
    var dialog = document.querySelector('[data-dialog="audit"]');
    var modeText = dialog && dialog.querySelector("[data-mode-text]");
    var approve = dialog && dialog.querySelector("[data-approve]");
    if (!dialog) return;
    if (dialog.querySelector("[data-detail-only]")) {
      dialog.hidden = false;
      return;
    }
    if (modeText) modeText.textContent = mode === "second" ? "初审通过" : mode === "view" ? "已审核" : "待初审";
    if (approve) approve.textContent = mode === "second" ? "复审通过" : mode === "view" ? "确定" : "初审通过";
    showInnerTab("detail");
    dialog.hidden = false;
  }

  function openPay() {
    var dialog = document.querySelector('[data-dialog="pay"]');
    if (!dialog) return;
    dialog.hidden = false;
  }

  function openConfirmPay() {
    var dialog = document.querySelector('[data-dialog="confirm-pay"]');
    if (!dialog) return;
    dialog.hidden = false;
  }

  function closeDialog(target) {
    var dialog = target.closest(".modal-mask");
    if (dialog) dialog.hidden = true;
  }

  document.addEventListener("click", function (event) {
    var tab = event.target.closest(".tab");
    if (tab) {
      showTab(tab.dataset.tab);
      return;
    }

    var innerTab = event.target.closest(".dialog-tab");
    if (innerTab) {
      showInnerTab(innerTab.dataset.innerTab);
      return;
    }

    var audit = event.target.closest("[data-audit]");
    if (audit) {
      openAudit(audit.dataset.audit);
      return;
    }

    var pay = event.target.closest("[data-pay]");
    if (pay) {
      openPay();
      return;
    }

    var confirmPay = event.target.closest("[data-confirm-pay]");
    if (confirmPay) {
      openConfirmPay();
      return;
    }

    if (event.target.matches("[data-close]")) {
      closeDialog(event.target);
      return;
    }

    if (event.target.classList.contains("modal-mask")) {
      event.target.hidden = true;
    }
  });
})();
