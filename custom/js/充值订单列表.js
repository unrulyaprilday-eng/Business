(function () {
  function showTab(name) {
    document.querySelectorAll(".tab").forEach(function (tab) {
      tab.classList.toggle("is-active", tab.dataset.tab === name);
    });
    document.querySelectorAll(".tab-pane").forEach(function (pane) {
      pane.classList.toggle("is-active", pane.dataset.pane === name);
    });
  }

  function openDialog(name) {
    var dialog = document.querySelector('[data-dialog="' + name + '"]');
    if (dialog) {
      dialog.hidden = false;
    }
  }

  function closeDialog(target) {
    var dialog = target.closest(".modal-mask");
    if (dialog) {
      dialog.hidden = true;
    }
  }

  document.addEventListener("click", function (event) {
    var tab = event.target.closest(".tab");
    if (tab) {
      showTab(tab.dataset.tab);
      return;
    }

    var detail = event.target.closest("[data-detail]");
    if (detail) {
      openDialog(detail.dataset.detail);
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
