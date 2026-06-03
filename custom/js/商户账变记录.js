(function() {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
      return;
    }
    fn();
  }

  ready(function() {
    var form = document.querySelector(".merchant-ledger-page .filter-bar");
    var typeSelect = document.getElementById("merchant-ledger-type");
    if (!form || !typeSelect) {
      return;
    }

    form.addEventListener("reset", function() {
      window.setTimeout(function() {
        typeSelect.selectedIndex = 0;
      }, 0);
    });
  });
})();
