(function () {
  var exportButton = document.querySelector(".summary-toolbar .wide-btn");

  if (exportButton) {
    exportButton.addEventListener("click", function () {
      exportButton.textContent = "导出中...";
      window.setTimeout(function () {
        exportButton.textContent = "导出表格";
      }, 800);
    });
  }
}());
