(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {
    var shell = document.querySelector(".agent-data-page");
    if (!shell) return;

    var searchBtn = shell.querySelector('[data-action="search"]');
    var resetBtn = shell.querySelector('[data-action="reset"]');
    var exportBtn = shell.querySelector('[data-action="export"]');
    var inputs = shell.querySelectorAll(".filter-bar input");
    var defaults = Array.prototype.map.call(inputs, function (input) {
      return input.value;
    });

    function pulse(text) {
      var tip = shell.querySelector(".refresh-tip");
      if (!tip) return;
      tip.textContent = text;
      window.setTimeout(function () {
        tip.textContent = "数据更新时间：5分钟";
      }, 1400);
    }

    if (searchBtn) {
      searchBtn.addEventListener("click", function () {
        pulse("查询完成，数据更新时间：5分钟");
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        Array.prototype.forEach.call(inputs, function (input, index) {
          input.value = defaults[index] || "";
        });
        pulse("筛选条件已重置");
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        pulse("报表已加入导出队列");
      });
    }
  });
})();
