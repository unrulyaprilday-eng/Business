(function () {
  var table = document.querySelector('.retention-table');
  if (!table) return;

  table.addEventListener('click', function (event) {
    var row = event.target.closest('tbody tr');
    if (!row) return;
    table.querySelectorAll('tbody tr.is-selected').forEach(function (item) {
      item.classList.remove('is-selected');
    });
    row.classList.add('is-selected');
  });
})();
