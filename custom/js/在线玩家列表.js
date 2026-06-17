(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function openActionModal() {
    var modal = $("[data-action-modal]");
    if (modal) modal.hidden = false;
  }

  function closeActionModal() {
    var modal = $("[data-action-modal]");
    if (modal) modal.hidden = true;
  }

  function getText(cell) {
    return cell ? cell.textContent.replace(/\s+/g, " ").trim() : "";
  }

  function getManualBalanceModal() {
    return $("[data-manual-balance-modal]");
  }

  function getMemberFromRow(row) {
    if (!row || !row.cells) {
      return {
        memberId: "",
        memberName: "-",
        merchantId: "-",
        balance: "-"
      };
    }

    var memberId = getText(row.cells[1]);
    return {
      memberId: memberId,
      memberName: memberId || "-",
      merchantId: "101",
      balance: getText(row.cells[3]) || "-"
    };
  }

  function findMemberById(memberId) {
    var matchedRow = null;

    $all(".online-table tbody tr").some(function (row) {
      var currentMemberId = row.cells[1] ? getText(row.cells[1]) : "";
      if (currentMemberId === memberId) {
        matchedRow = row;
        return true;
      }
      return false;
    });

    if (matchedRow) {
      return getMemberFromRow(matchedRow);
    }

    return {
      memberId: memberId,
      memberName: memberId || "-",
      merchantId: "101",
      balance: "-"
    };
  }

  function fillManualBalanceInfo(member) {
    var modal = getManualBalanceModal();
    if (!modal) return;

    var memberIdInput = $("[data-balance-member-id]", modal);
    var memberNameNode = $("[data-balance-member-name]", modal);
    var merchantIdNode = $("[data-balance-merchant-id]", modal);
    var balanceNode = $("[data-balance-member-balance]", modal);

    if (memberIdInput) {
      memberIdInput.value = member.memberId || "";
    }
    if (memberNameNode) {
      memberNameNode.textContent = member.memberName || "-";
    }
    if (merchantIdNode) {
      merchantIdNode.textContent = member.merchantId || "-";
    }
    if (balanceNode) {
      balanceNode.textContent = member.balance || "-";
    }
  }

  function setManualBalanceAction(action) {
    var modal = getManualBalanceModal();
    if (!modal) return;

    modal.classList.toggle("is-minus", action === "minus");
    $all('input[name="onlineBalanceAction"]', modal).forEach(function (input) {
      input.checked = input.value === action;
    });
  }

  function resetManualBalanceFields() {
    var modal = getManualBalanceModal();
    if (!modal) return;

    var amountInput = $("[data-balance-amount]", modal);
    var multipleInput = $("[data-balance-multiple]", modal);
    var remarkInput = $("[data-balance-remark]", modal);
    var addType = $("[data-balance-add-type]", modal);
    var minusType = $("[data-balance-minus-type]", modal);

    if (amountInput) amountInput.value = "";
    if (multipleInput) multipleInput.value = "";
    if (remarkInput) remarkInput.value = "";
    if (addType) addType.selectedIndex = 0;
    if (minusType) minusType.selectedIndex = 0;

    setManualBalanceAction("add");
  }

  function seedManualBalance(trigger) {
    var modal = getManualBalanceModal();
    if (!modal) return;

    var member = getMemberFromRow(trigger ? trigger.closest("tr") : null);
    modal.dataset.memberId = member.memberId || "";
    modal.dataset.memberName = member.memberName || "-";
    modal.dataset.merchantId = member.merchantId || "-";
    modal.dataset.memberBalance = member.balance || "-";

    resetManualBalanceFields();
    fillManualBalanceInfo(member);
  }

  function openManualBalanceModal(trigger) {
    var modal = getManualBalanceModal();
    if (!modal) return;

    seedManualBalance(trigger);
    modal.hidden = false;
  }

  function closeManualBalanceModal() {
    var modal = getManualBalanceModal();
    if (modal) modal.hidden = true;
  }

  function searchManualBalanceMember() {
    var modal = getManualBalanceModal();
    if (!modal) return;

    var input = $("[data-balance-member-id]", modal);
    fillManualBalanceInfo(findMemberById(input ? input.value.trim() : ""));
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
    $all("[data-open-action]").forEach(function (button) {
      button.addEventListener("click", openActionModal);
    });

    $all("[data-close-action]").forEach(function (button) {
      button.addEventListener("click", closeActionModal);
    });

    $all("[data-open-manual-balance]").forEach(function (button) {
      button.addEventListener("click", function () {
        openManualBalanceModal(button);
      });
    });

    $all("[data-close-manual-balance]").forEach(function (button) {
      button.addEventListener("click", closeManualBalanceModal);
    });

    var manualModal = getManualBalanceModal();
    if (manualModal) {
      manualModal.addEventListener("click", function (event) {
        if (event.target === manualModal) closeManualBalanceModal();
      });
    }

    var modal = $("[data-action-modal]");
    if (modal) {
      modal.addEventListener("click", function (event) {
        if (event.target === modal) closeActionModal();
      });
    }

    var searchButton = $("[data-search-manual-balance]");
    if (searchButton) {
      searchButton.addEventListener("click", searchManualBalanceMember);
    }

    document.addEventListener("change", function (event) {
      if (event.target.matches('input[name="onlineBalanceAction"]')) {
        setManualBalanceAction(event.target.value);
      }
    });
    
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
