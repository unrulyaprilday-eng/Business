(function () {
  var form = document.querySelector(".usage-toolbar");
  var rows = Array.prototype.slice.call(document.querySelectorAll("#usageRows tr"));
  var searchButton = document.getElementById("searchUsage");

  function normalize(value) {
    return (value || "").trim().toLowerCase();
  }

  function rowMatches(row, values) {
    var cells = row.children;
    var userId = normalize(cells[1].textContent);
    var ticketName = normalize(cells[4].textContent);
    var ticketType = normalize(cells[5].textContent);
    var status = normalize(cells[6].textContent);

    return (!values.userId || userId.indexOf(values.userId) !== -1) &&
      (!values.ticketKeyword || ticketName.indexOf(values.ticketKeyword) !== -1) &&
      (!values.ticketType || ticketType === values.ticketType) &&
      (!values.status || status === values.status);
  }

  function applyFilter() {
    var data = new FormData(form);
    var values = {
      userId: normalize(data.get("userId")),
      ticketKeyword: normalize(data.get("ticketId")),
      ticketType: normalize(data.get("ticketType")),
      status: normalize(data.get("status"))
    };

    rows.forEach(function (row) {
      row.hidden = !rowMatches(row, values);
    });
  }

  if (searchButton && form) {
    searchButton.addEventListener("click", applyFilter);
    form.addEventListener("reset", function () {
      window.setTimeout(function () {
        rows.forEach(function (row) {
          row.hidden = false;
        });
      }, 0);
    });
  }
})();
