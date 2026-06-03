(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {
    var mask = document.querySelector(".modal-mask");
    var content = document.getElementById("detailContent");
    var detailButtons = document.querySelectorAll("[data-detail]");
    var closeButtons = document.querySelectorAll(".modal-close, [data-close]");

    if (!mask || !content) {
      return;
    }

    function openDetail(value) {
      content.textContent = value || "-";
      mask.hidden = false;
    }

    function closeDetail() {
      mask.hidden = true;
    }

    detailButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        openDetail(button.getAttribute("data-detail"));
      });
    });

    closeButtons.forEach(function (button) {
      button.addEventListener("click", closeDetail);
    });

    mask.addEventListener("click", function (event) {
      if (event.target === mask) {
        closeDetail();
      }
    });
  });
})();
