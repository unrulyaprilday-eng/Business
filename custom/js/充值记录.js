(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  ready(function () {
    var form = document.querySelector(".filterbar");
    var searchButton = document.getElementById("searchButton");
    var resetButton = document.getElementById("resetButton");
    var exportButton = document.getElementById("exportButton");
    var rows = Array.prototype.slice.call(document.querySelectorAll(".record-table tbody tr"));

    if (!form || !searchButton || !resetButton || !exportButton || rows.length === 0) return;

    searchButton.addEventListener("click", function () {
      searchButton.textContent = "已搜索";
      setTimeout(function () {
        searchButton.textContent = "⌕ 搜索";
      }, 1200);
    });

    resetButton.addEventListener("click", function () {
      Array.prototype.forEach.call(form.querySelectorAll("input"), function (input) {
        input.value = "";
      });
      Array.prototype.forEach.call(form.querySelectorAll("select"), function (select) {
        select.selectedIndex = 0;
      });
      rows.forEach(function (row) {
        row.hidden = false;
      });
    });

    exportButton.addEventListener("click", function () {
      exportButton.textContent = "导出完成";
      setTimeout(function () {
        exportButton.textContent = "⇩ 导出表格";
      }, 1200);
    });
  });
})();
