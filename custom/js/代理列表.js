(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {
    var form = document.getElementById("agentFilter");
    var keyword = document.getElementById("agentKeyword");
    var tbody = document.getElementById("agentRows");
    var empty = document.getElementById("emptyState");
    var total = document.getElementById("totalCount");

    if (!form || !keyword || !tbody || !empty || !total) {
      return;
    }

    var rows = Array.prototype.slice.call(tbody.querySelectorAll("tr"));

    function render() {
      var term = keyword.value.trim().toLowerCase();
      var visible = 0;

      rows.forEach(function (row) {
        var matched = !term || row.textContent.toLowerCase().indexOf(term) !== -1;
        row.hidden = !matched;
        if (matched) {
          visible += 1;
        }
      });

      empty.hidden = visible !== 0;
      total.textContent = String(visible);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      render();
    });

    form.addEventListener("reset", function () {
      window.setTimeout(render, 0);
    });
  });
})();
