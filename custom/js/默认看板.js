(function () {
  function bindPeriodTabs() {
    var groups = document.querySelectorAll(".period-tabs, .metric-switch");

    groups.forEach(function (group) {
      var buttons = group.querySelectorAll("button");

      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          buttons.forEach(function (item) {
            item.classList.remove("is-active");
          });
          button.classList.add("is-active");
        });
      });
    });
  }

  function bindRankTabs() {
    var tabs = document.querySelectorAll("[data-rank-tab]");
    var panels = document.querySelectorAll("[data-rank-panel]");

    if (!tabs.length || !panels.length) {
      return;
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-rank-tab");

        tabs.forEach(function (item) {
          item.classList.toggle("is-active", item === tab);
        });

        panels.forEach(function (panel) {
          panel.hidden = panel.getAttribute("data-rank-panel") !== target;
        });
      });
    });
  }

  function bindTrendMetricPanels() {
    var buttons = document.querySelectorAll("[data-trend-metric]");
    var panels = document.querySelectorAll("[data-trend-panel]");

    if (!buttons.length || !panels.length) {
      return;
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var metric = button.getAttribute("data-trend-metric");

        panels.forEach(function (panel) {
          panel.hidden = panel.getAttribute("data-trend-panel") !== metric;
        });
      });
    });
  }

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }

    callback();
  }

  ready(function () {
    bindPeriodTabs();
    bindRankTabs();
    bindTrendMetricPanels();
  });
}());
