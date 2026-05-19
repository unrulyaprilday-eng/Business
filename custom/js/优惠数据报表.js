(function () {
  var modal = document.getElementById("explainModal");
  var openBtn = document.getElementById("openExplain");
  var closeButtons = [
    document.getElementById("closeExplain"),
    document.getElementById("cancelExplain"),
    document.getElementById("confirmExplain")
  ];

  function openModal() {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  if (openBtn && modal) {
    openBtn.addEventListener("click", openModal);
  }

  closeButtons.forEach(function (button) {
    if (button) {
      button.addEventListener("click", closeModal);
    }
  });

  if (modal) {
    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        closeModal();
      }
    });
  }
}());
