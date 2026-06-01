(function () {
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
