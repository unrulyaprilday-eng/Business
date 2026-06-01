(function () {
  function numberFromPx(value) {
    var parsed = parseFloat(value || "0");
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function getLayoutNumber(element, property) {
    var inlineValue = element.style[property];
    if (inlineValue) {
      return numberFromPx(inlineValue);
    }

    return numberFromPx(window.getComputedStyle(element)[property]);
  }

  function setLayoutNumber(element, property, value) {
    element.style[property] = value + "px";
  }

  function sameRow(a, b) {
    return Math.abs(a - b) < 2;
  }

  function shiftFilterControlsLeft() {
    [
      ["u12443", "u12442", "u12441"],
      ["u12792", "u12791", "u12790"],
      ["u13141", "u13140", "u13139"],
      ["u13490", "u13489", "u13488"]
    ].forEach(function (ids) {
      ids.forEach(function (id) {
        var control = document.getElementById(id);
        if (control && control.dataset.languageFilterShifted !== "true") {
          setLayoutNumber(control, "left", getLayoutNumber(control, "left") - 226);
          control.dataset.languageFilterShifted = "true";
        }
      });
    });
  }

  function hideLanguageFilters() {
    ["u12594", "u12943", "u13292", "u13641"].forEach(function (id) {
      var panel = document.getElementById(id);
      if (panel) {
        panel.style.setProperty("display", "none", "important");
        panel.style.setProperty("visibility", "hidden", "important");
      }
    });

    document.querySelectorAll("input").forEach(function (input) {
      if ((input.value || "").trim() !== "\u5168\u90e8\u8bed\u8a00") {
        return;
      }

      var panel = input.closest(".ax_default[data-label='\u4e0b\u62c9\u5355\u9009']");
      if (panel) {
        panel.style.setProperty("display", "none", "important");
        panel.style.setProperty("visibility", "hidden", "important");
      }
    });
  }

  function hideLanguageColumns() {
    document.querySelectorAll(".ax_default.table_cell").forEach(function (cell) {
      var textElement = cell.querySelector(".text");
      var label = textElement ? textElement.textContent.replace(/\s+/g, "") : "";

      if (!/^\u8bed\u8a00[12]?$/.test(label)) {
        return;
      }

      var table = cell.parentElement;
      if (!table) {
        return;
      }

      var hiddenLeft = getLayoutNumber(cell, "left");
      var hiddenTop = getLayoutNumber(cell, "top");
      var hiddenWidth = getLayoutNumber(cell, "width") || cell.getBoundingClientRect().width;

      cell.style.display = "none";
      cell.style.visibility = "hidden";

      Array.prototype.forEach.call(table.children, function (sibling) {
        if (sibling === cell || !sibling.classList || !sibling.classList.contains("table_cell")) {
          return;
        }

        var siblingTop = getLayoutNumber(sibling, "top");
        var siblingLeft = getLayoutNumber(sibling, "left");
        if (sameRow(siblingTop, hiddenTop) && siblingLeft > hiddenLeft) {
          setLayoutNumber(sibling, "left", Math.round(siblingLeft - hiddenWidth));
        }
      });
    });
  }

  function applyDataRankingCleanup() {
    hideLanguageFilters();
    shiftFilterControlsLeft();
    hideLanguageColumns();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyDataRankingCleanup);
  } else {
    applyDataRankingCleanup();
  }

  window.addEventListener("load", applyDataRankingCleanup);
})();
