(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var createButton = document.getElementById('createActivityBtn');
    if (createButton) {
      createButton.addEventListener('click', function () {
        window.location.href = '新增活动.html';
      });
    }

    document.querySelectorAll('.switch').forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        toggle.classList.toggle('on');
      });
    });
  });
})();
