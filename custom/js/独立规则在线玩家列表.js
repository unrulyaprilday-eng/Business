(function () {
  function init() {
    var page = document.querySelector(".independent-online-page");
    var pointControl = window.memberPointControl;
    if (!page || !pointControl) return;

    var table = page.querySelector(".online-table");
    var mount = page.querySelector("[data-member-point-editor]");
    if (!table || !mount) return;

    function renderRtp() {
      var records = pointControl.getRecords();
      table.querySelectorAll("[data-base-rtp]").forEach(function (cell) {
        var playerId = cell.closest("tr").cells[1].textContent.trim();
        var record = records.find(function (item) {
          return item.memberId === playerId && item.status === "active";
        });
        cell.textContent = (record ? record.rtp : cell.dataset.baseRtp) + "%";
      });
    }

    var editor = pointControl.createEditor(mount, renderRtp);
    table.addEventListener("click", function (event) {
      var button = event.target.closest("[data-open-member-point]");
      if (!button) return;

      var row = button.closest("tr");
      if (!row || !row.cells[1] || !row.cells[2]) return;
      editor.open({ member: {
        memberId: row.cells[1].textContent.trim(),
        username: row.cells[2].textContent.trim()
      } });
    });

    pointControl.onStorageChange(renderRtp);
    renderRtp();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
