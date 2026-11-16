(function () {
  function initPlacementReport() {
    var toolbar = document.getElementById("reportToolbar");
    var searchBtn = document.getElementById("searchBtn");
    var exportBtn = document.getElementById("exportBtn");
    var tipButtons = Array.prototype.slice.call(document.querySelectorAll(".tip-trigger"));
    var tooltip = document.createElement("div");
    var activeTip = null;
    var pinnedTip = null;

    tooltip.className = "floating-tip";
    document.body.appendChild(tooltip);

    function hideTooltip() {
      tooltip.classList.remove("is-visible");
    }

    function positionTooltip(button) {
      var rect = button.getBoundingClientRect();
      var tooltipRect;
      var left;
      var top;

      tooltip.classList.add("is-visible");
      tooltipRect = tooltip.getBoundingClientRect();
      left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
      top = rect.top - tooltipRect.height - 12;

      if (left < 8) {
        left = 8;
      }

      if (left + tooltipRect.width > window.innerWidth - 8) {
        left = window.innerWidth - tooltipRect.width - 8;
      }

      if (top < 8) {
        top = rect.bottom + 12;
        tooltip.style.transform = "translateY(0)";
        tooltip.style.setProperty("--tip-arrow-top", "-8px");
        tooltip.style.setProperty("--tip-arrow-bottom", "auto");
        tooltip.style.setProperty("--tip-arrow-border-width", "0 7px 8px");
        tooltip.style.setProperty("--tip-arrow-border-color", "transparent transparent rgba(40, 47, 58, 0.96)");
      } else {
        tooltip.style.transform = "translateY(0)";
        tooltip.style.setProperty("--tip-arrow-top", "auto");
        tooltip.style.setProperty("--tip-arrow-bottom", "-8px");
        tooltip.style.setProperty("--tip-arrow-border-width", "8px 7px 0");
        tooltip.style.setProperty("--tip-arrow-border-color", "rgba(40, 47, 58, 0.96) transparent transparent");
      }

      tooltip.style.left = left + "px";
      tooltip.style.top = top + "px";
    }

    function clearTipButtons(current) {
      tipButtons.forEach(function (button) {
        if (button !== current) {
          button.classList.remove("is-open");
        }
      });
    }

    function closeTips() {
      pinnedTip = null;
      activeTip = null;
      clearTipButtons(null);
      hideTooltip();
    }

    function openTip(button, pinned) {
      activeTip = button;
      pinnedTip = pinned ? button : null;
      tooltip.textContent = button.getAttribute("data-tip") || "";
      clearTipButtons(button);
      button.classList.add("is-open");
      positionTooltip(button);
    }

    if (searchBtn) {
      searchBtn.addEventListener("click", function () {
        searchBtn.textContent = "搜索中...";
        window.setTimeout(function () {
          searchBtn.textContent = "搜索";
        }, 500);
      });
    }

    if (toolbar) {
      toolbar.addEventListener("reset", function () {
        window.setTimeout(function () {
          closeTips();
        }, 0);
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        exportBtn.textContent = "导出中...";
        window.setTimeout(function () {
          exportBtn.textContent = "导出表格";
        }, 800);
      });
    }

    tipButtons.forEach(function (button) {
      button.addEventListener("click", function (event) {
        if (pinnedTip === button) {
          closeTips();
        } else {
          openTip(button, true);
        }
        event.stopPropagation();
      });

      button.addEventListener("mouseenter", function () {
        if (!pinnedTip || pinnedTip === button) {
          openTip(button, false);
        }
      });

      button.addEventListener("mouseleave", function () {
        if (!pinnedTip || pinnedTip !== button) {
          button.classList.remove("is-open");
          activeTip = null;
          hideTooltip();
        }
      });

      button.addEventListener("focus", function () {
        openTip(button, pinnedTip === button);
      });

      button.addEventListener("blur", function () {
        if (!pinnedTip || pinnedTip !== button) {
          button.classList.remove("is-open");
          activeTip = null;
          hideTooltip();
        }
      });
    });

    document.addEventListener("click", function () {
      closeTips();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeTips();
      }
    });

    window.addEventListener("resize", function () {
      if (activeTip) {
        positionTooltip(activeTip);
      }
    });

    window.addEventListener("scroll", function () {
      if (activeTip) {
        positionTooltip(activeTip);
      }
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPlacementReport);
  } else {
    initPlacementReport();
  }
}());
