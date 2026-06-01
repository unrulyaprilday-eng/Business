(function () {
  function openModal(name) {
    var modal = document.querySelector('[data-modal="' + name + '"]');
    if (modal) modal.hidden = false;
  }

  function closeModal(target) {
    var modal = target.closest(".modal-mask");
    if (modal) modal.hidden = true;
  }

  document.addEventListener("click", function (event) {
    if (event.target.closest("[data-operate]")) {
      openModal("operate");
      return;
    }
    if (event.target.closest("[data-detail]")) {
      openModal("detail");
      return;
    }
    if (event.target.closest("[data-create]")) {
      openModal("create");
      return;
    }
    if (event.target.matches("[data-close]")) {
      closeModal(event.target);
      return;
    }
    if (event.target.classList.contains("modal-mask")) {
      event.target.hidden = true;
      return;
    }
    var select = event.target.closest("[data-toggle-select]");
    if (select) {
      var menu = select.closest(".operate-form").querySelector(".select-menu");
      menu.hidden = !menu.hidden;
      select.classList.toggle("open", !menu.hidden);
      return;
    }
    var tab = event.target.closest("[data-tab]");
    if (tab) {
      var modal = tab.closest(".detail-modal");
      var name = tab.dataset.tab;
      modal.querySelectorAll(".detail-tabs button").forEach(function (item) {
        item.classList.toggle("active", item.dataset.tab === name);
      });
      modal.querySelectorAll(".tab-panel").forEach(function (panel) {
        panel.classList.toggle("active", panel.dataset.panel === name);
      });
    }
  });
})();
