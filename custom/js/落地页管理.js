(function () {
  function show(name) {
    var modal = document.querySelector('[data-modal="' + name + '"]');
    if (modal) modal.hidden = false;
  }

  function hideAll() {
    document.querySelectorAll(".modal-mask").forEach(function (modal) {
      modal.hidden = true;
    });
  }

  var addBtn = document.querySelector(".js-open-add");
  var editBtn = document.querySelector(".js-open-edit");
  var deleteBtn = document.querySelector(".js-open-delete");
  var templateSelect = document.querySelector(".js-template-select");
  var templateOption = document.querySelector(".js-template-option");

  if (addBtn) addBtn.addEventListener("click", function () { show("add"); });
  if (editBtn) editBtn.addEventListener("click", function () { show("edit"); });
  if (deleteBtn) deleteBtn.addEventListener("click", function () { show("delete"); });

  if (templateSelect && templateOption) {
    templateSelect.addEventListener("click", function () {
      templateOption.hidden = !templateOption.hidden;
      templateSelect.setAttribute("aria-expanded", String(!templateOption.hidden));
    });

    templateOption.addEventListener("click", function () {
      templateSelect.querySelector("span").textContent = templateOption.textContent;
      templateSelect.classList.remove("invalid");
      templateOption.hidden = true;
      templateSelect.setAttribute("aria-expanded", "false");
    });
  }

  document.querySelectorAll(".js-close-modal").forEach(function (button) {
    button.addEventListener("click", hideAll);
  });

  document.querySelectorAll(".modal-mask").forEach(function (mask) {
    mask.addEventListener("click", function (event) {
      if (event.target === mask) hideAll();
    });
  });
})();
