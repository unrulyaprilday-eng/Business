(function () {
  var resetButton = document.querySelector('.filter-bar button[type="reset"]');
  if (!resetButton) return;

  resetButton.addEventListener("click", function () {
    window.setTimeout(function () {
      var selects = document.querySelectorAll(".filter-bar select");
      selects.forEach(function (select) {
        select.selectedIndex = 0;
      });
    }, 0);
  });
})();
