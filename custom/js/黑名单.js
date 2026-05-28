(function () {
  function setActiveTab(tabName) {
    document.querySelectorAll(".tab-btn").forEach(function (button) {
      button.classList.toggle("active", button.dataset.tab === tabName);
    });
    document.querySelectorAll(".tab-view").forEach(function (view) {
      view.hidden = view.dataset.view !== tabName;
    });
  }

  function openModal(name) {
    var modal = document.querySelector('[data-modal="' + name + '"]');
    if (modal) modal.hidden = false;
  }

  function closeModal(target) {
    var modal = target.closest(".modal-mask");
    if (modal) modal.hidden = true;
  }

  function updateBatchState(view) {
    var rows = view.querySelectorAll("tbody input[type='checkbox']");
    var checkedRows = view.querySelectorAll("tbody input[type='checkbox']:checked");
    var headerCheck = view.querySelector("thead input[type='checkbox']");
    var batchButton = view.querySelector(".batch-remove");

    if (headerCheck) {
      headerCheck.checked = rows.length > 0 && checkedRows.length === rows.length;
      headerCheck.indeterminate = checkedRows.length > 0 && checkedRows.length < rows.length;
    }

    if (batchButton) {
      batchButton.disabled = checkedRows.length === 0;
      batchButton.classList.toggle("disabled", checkedRows.length === 0);
    }
  }

  function syncAllCheckbox(checkbox) {
    var group = checkbox.closest(".check-list");
    if (!group || checkbox.type !== "checkbox") return;

    var boxes = Array.prototype.slice.call(group.querySelectorAll("input[type='checkbox']"));
    var allBox = boxes[0];
    var optionBoxes = boxes.slice(1);

    if (checkbox === allBox) {
      optionBoxes.forEach(function (box) {
        box.checked = allBox.checked;
      });
      return;
    }

    allBox.checked = optionBoxes.length > 0 && optionBoxes.every(function (box) {
      return box.checked;
    });
  }

  function syncTableCheckbox(checkbox) {
    var view = checkbox.closest(".tab-view");
    if (!view) return;

    if (checkbox.closest("thead")) {
      view.querySelectorAll("tbody input[type='checkbox']").forEach(function (box) {
        box.checked = checkbox.checked;
      });
    }

    updateBatchState(view);
  }

  document.addEventListener("click", function (event) {
    var tab = event.target.closest(".tab-btn");
    if (tab) {
      setActiveTab(tab.dataset.tab);
      return;
    }

    var actionLink = event.target.closest("a");
    if (actionLink && actionLink.textContent.trim() === "修改") {
      var row = actionLink.closest("tr");
      if (row && row.closest(".device-table")) {
        openModal(row.querySelector(".device-kind") ? "deviceDeviceEdit" : "deviceIpEdit");
      } else {
        openModal("memberEdit");
      }
      return;
    }

    if (actionLink && actionLink.textContent.trim() === "移除黑名单") {
      openModal("removeConfirm");
      return;
    }

    var batchButton = event.target.closest(".batch-remove");
    if (batchButton && !batchButton.disabled) {
      openModal("removeConfirm");
      return;
    }

    var opener = event.target.closest("[data-open-modal]");
    if (opener) {
      openModal(opener.dataset.openModal);
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
    if (checkbox.matches(".modal input[type='checkbox']")) {
      syncAllCheckbox(checkbox);
      return;
    }

    if (checkbox.matches(".tab-view input[type='checkbox']")) {
      syncTableCheckbox(checkbox);
    }
  });

  document.querySelectorAll(".tab-view").forEach(updateBatchState);
})();
