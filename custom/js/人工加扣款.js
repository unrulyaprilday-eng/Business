(function () {
  function openDialog() {
    var dialog = document.querySelector("[data-dialog]");
    if (dialog) {
      dialog.hidden = false;
      fillMemberInfo("", "", "");
      setAction("add");
    }
  }

  function closeDialog(target) {
    var dialog = target.closest(".modal-mask");
    if (dialog) {
      dialog.hidden = true;
    }
  }

  function setAction(action) {
    var dialog = document.querySelector("[data-dialog]");
    if (!dialog) {
      return;
    }
    dialog.classList.toggle("is-minus", action === "minus");
    dialog.querySelectorAll('input[name="balanceAction"]').forEach(function (input) {
      input.checked = input.value === action;
    });
  }

  function fillMemberInfo(name, merchantId, balance) {
    var nameNode = document.querySelector("[data-member-name]");
    var merchantNode = document.querySelector("[data-merchant-id]");
    var balanceNode = document.querySelector("[data-member-balance]");
    if (nameNode) {
      nameNode.textContent = name;
    }
    if (merchantNode) {
      merchantNode.textContent = merchantId;
    }
    if (balanceNode) {
      balanceNode.textContent = balance;
    }
  }

  document.addEventListener("click", function (event) {
    if (event.target.closest("[data-open-dialog]")) {
      openDialog();
      return;
    }

    if (event.target.closest("[data-member-search]")) {
      fillMemberInfo("gaullow", "101", "85320.1");
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

  document.addEventListener("change", function (event) {
    if (event.target.matches('input[name="balanceAction"]')) {
      setAction(event.target.value);
    }
  });
})();
