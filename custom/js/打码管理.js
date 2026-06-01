(function () {
  function openModal(name) {
    var modal = document.querySelector('[data-modal="' + name + '"]');
    if (modal) modal.hidden = false;
  }

  function closeModal(target) {
    var modal = target.closest(".modal-mask");
    if (modal) modal.hidden = true;
  }

  function updateBatchState() {
    var rows = document.querySelectorAll("tbody input[type='checkbox']:not(:disabled)");
    var checkedRows = document.querySelectorAll("tbody input[type='checkbox']:not(:disabled):checked");
    var headerCheck = document.querySelector("thead input[type='checkbox']");
    var batchButton = document.querySelector(".batch-action");

    if (headerCheck) {
      headerCheck.checked = rows.length > 0 && checkedRows.length === rows.length;
      headerCheck.indeterminate = checkedRows.length > 0 && checkedRows.length < rows.length;
    }

    if (batchButton) {
      batchButton.disabled = checkedRows.length === 0;
      batchButton.classList.toggle("disabled", checkedRows.length === 0);
    }
  }

  document.addEventListener("click", function (event) {
    var opener = event.target.closest("[data-open-modal]");
    if (opener) {
      openModal(opener.dataset.openModal);
      return;
    }

    var batchButton = event.target.closest(".batch-action");
    if (batchButton && !batchButton.disabled) {
      openModal("singleRemove");
      return;
    }

    if (event.target.closest("[data-close-modal]")) {
      closeModal(event.target);
      return;
    }

    if (event.target.classList.contains("modal-mask")) {
      event.target.hidden = true;
    }
  });

  document.addEventListener("change", function (event) {
    var checkbox = event.target;
    if (!checkbox.matches("table input[type='checkbox']")) return;

    if (checkbox.closest("thead")) {
      document.querySelectorAll("tbody input[type='checkbox']:not(:disabled)").forEach(function (box) {
        box.checked = checkbox.checked;
      });
    }

    updateBatchState();
  });

  document.addEventListener("click", function (event) {
    var search = event.target.closest(".search-member");
    if (!search) return;

    var modal = search.closest(".modal");
    var input = modal.querySelector(".uid-input");
    if (!input || input.value.trim() === "") return;

    modal.querySelector(".user-name").textContent = "dzh222";
    modal.querySelector(".merchant-id").textContent = "101";
    modal.querySelector(".balance").textContent = "1011.37";
    modal.querySelector(".balance").classList.add("green");
    modal.querySelector(".coding-amount").textContent = "0";
    modal.querySelector(".coding-amount").classList.add("blue");
  });

  updateBatchState();
})();
