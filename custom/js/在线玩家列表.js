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
      memberName: getText(row.cells[2]) || memberId || "-",
      merchantId: "101",
      balance: getText(row.cells[5]) || "-"
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

  function getCreatePlayerModal() {
    return $("[data-create-player-modal]");
  }

  function resetCreatePlayerForm() {
    var modal = getCreatePlayerModal();
    if (!modal) return;

    var nameInput = $("[data-create-player-name]", modal);
    var phoneInput = $("[data-create-player-phone]", modal);
    var passwordInput = $("[data-create-player-password]", modal);
    var channelSelect = $("[data-create-player-channel]", modal);
    var tip = $("[data-create-player-tip]", modal);

    if (nameInput) nameInput.value = "";
    if (phoneInput) phoneInput.value = "";
    if (passwordInput) passwordInput.value = "123456";
    if (channelSelect) channelSelect.selectedIndex = 0;
    if (tip) {
      tip.textContent = "用户名和手机号至少填写一项";
      tip.classList.remove("error", "success");
    }
  }

  function openCreatePlayerModal() {
    var modal = getCreatePlayerModal();
    if (!modal) return;

    resetCreatePlayerForm();
    modal.hidden = false;
  }

  function closeCreatePlayerModal() {
    var modal = getCreatePlayerModal();
    if (modal) modal.hidden = true;
  }

  function submitCreatePlayer() {
    var modal = getCreatePlayerModal();
    if (!modal) return;

    var nameInput = $("[data-create-player-name]", modal);
    var phoneInput = $("[data-create-player-phone]", modal);
    var passwordInput = $("[data-create-player-password]", modal);
    var tip = $("[data-create-player-tip]", modal);
    var hasIdentity = !!((nameInput && nameInput.value.trim()) || (phoneInput && phoneInput.value.trim()));
    var hasPassword = !!(passwordInput && passwordInput.value.trim());

    if (!hasIdentity || !hasPassword) {
      if (tip) {
        tip.textContent = !hasIdentity ? "请填写用户名或手机号" : "请填写密码";
        tip.classList.add("error");
        tip.classList.remove("success");
      }
      return;
    }

    if (tip) {
      tip.textContent = "玩家创建成功";
      tip.classList.add("success");
      tip.classList.remove("error");
    }
  }

  function parseAmount(cell) {
    var amount = parseFloat(getText(cell).replace(/,/g, ""));
    return isNaN(amount) ? 0 : amount;
  }

  function filterTable(filters) {
    var tbody = document.querySelector(".online-table tbody");
    if (!tbody) return;

    var rows = tbody.querySelectorAll("tr");

    rows.forEach(function(row) {
      var playerIdCell = row.cells[1];
      var channelCell = row.cells[3];
      var typeCell = row.cells[4];
      var balanceCell = row.cells[5];
      var locationCell = row.cells[6];
      var ipCell = row.cells[14];
      if (!playerIdCell || !channelCell || !typeCell || !balanceCell || !locationCell || !ipCell) return;

      var playerIdText = getText(playerIdCell);
      var channelText = getText(channelCell);
      var typeText = typeCell.textContent.trim();
      var locationText = locationCell.textContent.trim();
      var ipText = getText(ipCell);
      var balance = parseAmount(balanceCell);
      var hasChannel = channelText !== "" && channelText !== "-";
      var shouldShow = true;

      if (filters.playerId && playerIdText.indexOf(filters.playerId) === -1) shouldShow = false;
      if (filters.playerType !== "全部" && typeText !== filters.playerType) shouldShow = false;
      if (filters.channel && (filters.channel === "none" ? hasChannel : channelText !== filters.channel)) shouldShow = false;
      if (filters.balanceMin !== "" && balance < Number(filters.balanceMin)) shouldShow = false;
      if (filters.balanceMax !== "" && balance > Number(filters.balanceMax)) shouldShow = false;
      if (filters.websitePosition !== "全部" && locationText !== "网站-" + filters.websitePosition) shouldShow = false;
      if (filters.loginIp && ipText.indexOf(filters.loginIp) === -1) shouldShow = false;

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
      var balanceCell = row.cells[5];
      if (balanceCell && balanceCell.classList.contains("danger")) {
        needAttentionCount++;
      }
    });
    
    var totalBalance = 0;
    visibleRows.forEach(function(row) {
      var balanceCell = row.cells[5];
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

    var paginationCount = document.querySelector(".pagination-info b");
    if (paginationCount) paginationCount.textContent = totalCount;
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

    var createModal = getCreatePlayerModal();
    var openCreateButton = $("[data-open-create-player]");
    var submitCreateButton = $("[data-submit-create-player]");

    if (openCreateButton) {
      openCreateButton.addEventListener("click", openCreatePlayerModal);
    }

    $all("[data-close-create-player]").forEach(function (button) {
      button.addEventListener("click", closeCreatePlayerModal);
    });

    if (submitCreateButton) {
      submitCreateButton.addEventListener("click", submitCreatePlayer);
    }

    if (createModal) {
      createModal.addEventListener("click", function (event) {
        if (event.target === createModal) closeCreatePlayerModal();
      });
    }

    document.addEventListener("change", function (event) {
      if (event.target.matches('input[name="onlineBalanceAction"]')) {
        setManualBalanceAction(event.target.value);
      }
    });
    
    var filterForm = document.querySelector(".filter-bar");
    var playerIdInput = document.querySelector("[data-player-id-filter]");
    var channelSelect = document.querySelector("[data-channel-filter]");
    var balanceMinInput = document.querySelector("[data-balance-min]");
    var balanceMaxInput = document.querySelector("[data-balance-max]");
    var playerTypeSelect = document.querySelector("[data-player-type-filter]");
    var websitePositionSelect = document.querySelector("[data-website-position-filter]");
    var loginIpInput = document.querySelector("[data-login-ip-filter]");
    var filterSearchButton = document.querySelector("[data-filter-search]");
    var filterResetButton = document.querySelector("[data-filter-reset]");

    function applyFilters() {
      filterTable({
        playerId: playerIdInput ? playerIdInput.value.trim() : "",
        channel: channelSelect ? channelSelect.value : "",
        balanceMin: balanceMinInput ? balanceMinInput.value : "",
        balanceMax: balanceMaxInput ? balanceMaxInput.value : "",
        playerType: playerTypeSelect ? playerTypeSelect.value : "全部",
        websitePosition: websitePositionSelect ? websitePositionSelect.value : "全部",
        loginIp: loginIpInput ? loginIpInput.value.trim() : ""
      });
    }

    if (filterSearchButton) {
      filterSearchButton.addEventListener("click", applyFilters);
    }

    if (filterResetButton) {
      filterResetButton.addEventListener("click", function () {
        if (filterForm) filterForm.reset();
        applyFilters();
      });
    }

    applyFilters();
  });
})();
