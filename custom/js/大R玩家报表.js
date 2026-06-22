(function () {
  function bindExportState() {
    var exportButton = document.querySelector(".report-toolbar .wide-btn");

    if (!exportButton) {
      return;
    }

    exportButton.addEventListener("click", function () {
      exportButton.textContent = "导出中...";
      window.setTimeout(function () {
        exportButton.textContent = "导出报表";
      }, 800);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindExportState);
  } else {
    bindExportState();
  }
}());
