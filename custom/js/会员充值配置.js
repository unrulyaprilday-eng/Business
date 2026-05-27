(function () {
  function showTab(name) {
    document.querySelectorAll(".tab").forEach(function (tab) {
      tab.classList.toggle("is-active", tab.dataset.tab === name);
    });
    document.querySelectorAll("[data-table]").forEach(function (table) {
      table.hidden = table.dataset.table !== name;
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

    var expand = event.target.closest(".expand");
    if (expand) {
      var row = expand.closest(".group-row");
      var group = row.dataset.group;
      var isOpen = expand.classList.toggle("is-open");
      row.classList.toggle("is-collapsed", !isOpen);
      document.querySelectorAll('[data-parent="' + group + '"]').forEach(function (child) {
        child.hidden = !isOpen;
      });
      expand.setAttribute("aria-label", (isOpen ? "收起 " : "展开 ") + group);
      return;
    }

    var opener = event.target.closest("[data-modal]");
    if (opener) {
      openDialog(opener.dataset.modal);
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
