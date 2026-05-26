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

  function filterByLocation(locationType, websitePosition, gameType) {
    var tbody = document.querySelector(".online-table tbody");
    if (!tbody) return;
    
    var rows = tbody.querySelectorAll("tr:not(.group-row)");
    var groupRows = tbody.querySelectorAll("tr.group-row");
    
    rows.forEach(function(row) {
      var locationCell = row.cells[3];
      if (!locationCell) return;
      
      var locationText = locationCell.textContent.trim();
      var shouldShow = false;
      
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
    
    updateGroupVisibility();
    updateSummary();
  }
  
  function updateGroupVisibility() {
    var tbody = document.querySelector(".online-table tbody");
    if (!tbody) return;
    
    var groupRows = tbody.querySelectorAll("tr.group-row");
    
    groupRows.forEach(function(groupRow) {
      var nextRow = groupRow.nextElementSibling;
      var hasVisibleData = false;
      
      while (nextRow && !nextRow.classList.contains("group-row")) {
        if (nextRow.style.display !== "none") {
          hasVisibleData = true;
          break;
        }
        nextRow = nextRow.nextElementSibling;
      }
      
      groupRow.style.display = hasVisibleData ? "" : "none";
    });
  }
  
  function updateSummary() {
    var tbody = document.querySelector(".online-table tbody");
    if (!tbody) return;
    
    var visibleRows = tbody.querySelectorAll("tr:not(.group-row):not([style*='display: none'])");
    var totalCount = visibleRows.length;
    
    var needAttentionCount = 0;
    visibleRows.forEach(function(row) {
      var balanceCell = row.cells[2];
      if (balanceCell && balanceCell.classList.contains("danger")) {
        needAttentionCount++;
      }
    });
    
    var totalBalance = 0;
    visibleRows.forEach(function(row) {
      var balanceCell = row.cells[2];
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
    
    var locationSelect = document.querySelector(".filter-bar select");
    var websitePositionSelect = document.querySelectorAll(".filter-bar select")[1];
    var gameTypeSelect = document.querySelectorAll(".filter-bar select")[2];
    
    if (locationSelect) {
      locationSelect.addEventListener("change", function() {
        var websitePosition = websitePositionSelect ? websitePositionSelect.value : "全部";
        var gameType = gameTypeSelect ? gameTypeSelect.value : "全部";
        filterByLocation(this.value, websitePosition, gameType);
      });
      
      var websitePosition = websitePositionSelect ? websitePositionSelect.value : "全部";
      var gameType = gameTypeSelect ? gameTypeSelect.value : "全部";
      filterByLocation(locationSelect.value, websitePosition, gameType);
    }
    
    if (websitePositionSelect) {
      websitePositionSelect.addEventListener("change", function() {
        var locationType = locationSelect ? locationSelect.value : "全部";
        var gameType = gameTypeSelect ? gameTypeSelect.value : "全部";
        filterByLocation(locationType, this.value, gameType);
      });
    }
    
    if (gameTypeSelect) {
      gameTypeSelect.addEventListener("change", function() {
        var locationType = locationSelect ? locationSelect.value : "全部";
        var websitePosition = websitePositionSelect ? websitePositionSelect.value : "全部";
        filterByLocation(locationType, websitePosition, this.value);
      });
    }
  });
})();