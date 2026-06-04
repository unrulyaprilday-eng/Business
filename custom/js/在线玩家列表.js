(function () {
  function $(selector) {
    return document.querySelector(selector);
  }

  function openActionModal() {
    var modal = $("[data-action-modal]");
    if (modal) modal.hidden = false;
  }

  function closeActionModal() {
    var modal = $("[data-action-modal]");
    if (modal) modal.hidden = true;
  }

  function filterTable(playerType, locationType, websitePosition, gameType) {
    var tbody = document.querySelector(".online-table tbody");
    if (!tbody) return;
    
    var rows = tbody.querySelectorAll("tr");
    
    rows.forEach(function(row) {
      var typeCell = row.cells[2];
      var locationCell = row.cells[4];
      if (!typeCell || !locationCell) return;
      
      var typeText = typeCell.textContent.trim();
      var locationText = locationCell.textContent.trim();
      var shouldShow = false;

      if (playerType && playerType !== "全部" && typeText !== playerType) {
        row.style.display = "none";
        return;
      }
      
      // 所在位置筛选
      if (locationType === "全部") {
        shouldShow = true;
      } else if (locationType === "网站") {
        shouldShow = locationText.startsWith("网站-");
      } else if (locationType === "游戏") {
        shouldShow = locationText.startsWith("真人-") || 
                     locationText.startsWith("电子-") || 
                     locationText.startsWith("棋牌-") || 
                     locationText.startsWith("捕鱼-");
      }
      
      // 网站位置筛选（独立生效）
      if (shouldShow && websitePosition && websitePosition !== "全部") {
        shouldShow = locationText === "网站-" + websitePosition;
      }
      
      // 游戏类型筛选（独立生效）
      if (shouldShow && gameType && gameType !== "全部") {
        shouldShow = locationText.startsWith(gameType + "-");
      }
      
      row.style.display = shouldShow ? "" : "none";
    });
    
    updateSummary();
  }
  
  function updateSummary() {
    var tbody = document.querySelector(".online-table tbody");
    if (!tbody) return;
    
    var visibleRows = Array.prototype.slice.call(tbody.querySelectorAll("tr")).filter(function(row) {
      return row.style.display !== "none";
    });
    var totalCount = visibleRows.length;
    
    var needAttentionCount = 0;
    visibleRows.forEach(function(row) {
      var balanceCell = row.cells[3];
      if (balanceCell && balanceCell.classList.contains("danger")) {
        needAttentionCount++;
      }
    });
    
    var totalBalance = 0;
    visibleRows.forEach(function(row) {
      var balanceCell = row.cells[3];
      if (balanceCell) {
        var balanceText = balanceCell.textContent.replace(/,/g, "").trim();
        var balance = parseFloat(balanceText);
        if (!isNaN(balance)) {
          totalBalance += balance;
        }
      }
    });
    
    var summarySpans = document.querySelectorAll(".summary-strip span b");
    if (summarySpans.length >= 3) {
      summarySpans[0].textContent = totalCount;
      summarySpans[1].textContent = needAttentionCount;
      summarySpans[2].textContent = totalBalance.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    Array.prototype.slice.call(document.querySelectorAll("[data-open-action]")).forEach(function (button) {
      button.addEventListener("click", openActionModal);
    });

    Array.prototype.slice.call(document.querySelectorAll("[data-close-action]")).forEach(function (button) {
      button.addEventListener("click", closeActionModal);
    });

    var modal = $("[data-action-modal]");
    if (modal) {
      modal.addEventListener("click", function (event) {
        if (event.target === modal) closeActionModal();
      });
    }
    
    var playerTypeSelect = document.querySelector("[data-player-type-filter]");
    var locationSelect = document.querySelectorAll(".filter-bar select")[1];
    var websitePositionSelect = document.querySelectorAll(".filter-bar select")[2];
    var gameTypeSelect = document.querySelectorAll(".filter-bar select")[3];

    function applyFilters() {
      var playerType = playerTypeSelect ? playerTypeSelect.value : "全部";
      var locationType = locationSelect ? locationSelect.value : "全部";
      var websitePosition = websitePositionSelect ? websitePositionSelect.value : "全部";
      var gameType = gameTypeSelect ? gameTypeSelect.value : "全部";
      filterTable(playerType, locationType, websitePosition, gameType);
    }

    if (playerTypeSelect) {
      playerTypeSelect.addEventListener("change", applyFilters);
    }
    
    if (locationSelect) {
      locationSelect.addEventListener("change", applyFilters);
    }
    
    if (websitePositionSelect) {
      websitePositionSelect.addEventListener("change", applyFilters);
    }
    
    if (gameTypeSelect) {
      gameTypeSelect.addEventListener("change", applyFilters);
    }

    applyFilters();
  });
})();
