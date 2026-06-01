(function () {
  function bindQuickRange() {
    var buttons = document.querySelectorAll('.quick-btn');
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        buttons.forEach(function (item) {
          item.classList.remove('active');
        });
        button.classList.add('active');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindQuickRange);
  } else {
    bindQuickRange();
  }
})();
