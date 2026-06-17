(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function notifyPlayer() {
    try {
      if (window.parent && window.parent !== window && window.parent.$axure && window.parent.$axure.player) {
        window.parent.$axure.player.resizeContent(true);
        window.parent.$axure.player.refreshViewPort();
      }
    } catch (error) {
      // Local file security can block parent access in some browsers.
    }
  }

  function schedulePlayerRefresh() {
    notifyPlayer();
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(notifyPlayer);
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(notifyPlayer);
      });
    }
    window.setTimeout(notifyPlayer, 60);
    window.setTimeout(notifyPlayer, 180);
    window.setTimeout(notifyPlayer, 360);
  }

  function initMemberPage() {
    var createModal = document.querySelector('[data-modal="create"]');
    var manualModal = document.querySelector('[data-modal="manual-balance"]');
    var createViews = createModal ? createModal.querySelectorAll("[data-create-view]") : [];
    var createFooters = createModal ? createModal.querySelectorAll("[data-create-footer]") : [];
    var createUsername = createModal ? createModal.querySelector("[data-create-username]") : null;
    var createMobile = createModal ? createModal.querySelector("[data-create-mobile]") : null;
    var createPassword = createModal ? createModal.querySelector("[data-create-password]") : null;
    var createChannel = createModal ? createModal.querySelector("[data-create-channel]") : null;
    var createTip = createModal ? createModal.querySelector(".form-tip") : null;
    var createTitle = createModal ? createModal.querySelector("[data-create-title]") : null;
    var resultUsername = createModal ? createModal.querySelector("[data-result-username]") : null;
    var resultPassword = createModal ? createModal.querySelector("[data-result-password]") : null;
    var copyButton = createModal ? createModal.querySelector("[data-copy-account]") : null;
    var defaultTipText = createTip ? createTip.textContent : "";
    var defaultCopyText = copyButton ? copyButton.textContent : "";

    if (!createModal) {
      schedulePlayerRefresh();
      window.addEventListener("load", schedulePlayerRefresh);
      return;
    }

    function setCreateMode(mode) {
      Array.prototype.forEach.call(createViews, function (view) {
        view.hidden = view.getAttribute("data-create-view") !== mode;
      });
      Array.prototype.forEach.call(createFooters, function (footer) {
        footer.hidden = footer.getAttribute("data-create-footer") !== mode;
      });
      if (mode === "form") {
        if (createTitle) {
          createTitle.textContent = "创建玩家";
        }
        if (createTip) {
          createTip.textContent = defaultTipText;
          createTip.classList.remove("error");
        }
        if (copyButton) {
          copyButton.textContent = defaultCopyText;
        }
      } else {
        if (createTitle) {
          createTitle.textContent = "账号已创建";
        }
      }
      schedulePlayerRefresh();
    }

    function resetCreateForm() {
      if (createUsername) createUsername.value = "";
      if (createMobile) createMobile.value = "";
      if (createPassword) createPassword.value = "123456";
      if (createChannel) createChannel.selectedIndex = 0;
      setCreateMode("form");
    }

    function getMemberFromRow(row) {
      if (!row || !row.cells) {
        return {
          memberId: "",
          memberName: "-",
          merchantId: "101",
          balance: "-"
        };
      }

      return {
        memberId: row.cells[1] ? row.cells[1].textContent.trim() : "",
        memberName: row.cells[2] ? row.cells[2].textContent.trim() || "-" : "-",
        merchantId: row.cells[0] ? row.cells[0].textContent.trim() || "101" : "101",
        balance: row.cells[12] ? row.cells[12].textContent.trim() || "-" : "-"
      };
    }

    function fillManualMember(member) {
      if (!manualModal) return;

      var memberIdInput = $("[data-balance-member-id]", manualModal);
      var memberNameNode = $("[data-balance-member-name]", manualModal);
      var merchantIdNode = $("[data-balance-merchant-id]", manualModal);
      var balanceNode = $("[data-balance-member-balance]", manualModal);

      manualModal.dataset.memberId = member.memberId || "";
      manualModal.dataset.memberName = member.memberName || "-";
      manualModal.dataset.merchantId = member.merchantId || "101";
      manualModal.dataset.memberBalance = member.balance || "-";

      if (memberIdInput) {
        memberIdInput.value = member.memberId || "";
      }
      if (memberNameNode) {
        memberNameNode.textContent = member.memberName || "-";
      }
      if (merchantIdNode) {
        merchantIdNode.textContent = member.merchantId || "101";
      }
      if (balanceNode) {
        balanceNode.textContent = member.balance || "-";
      }
    }

    function setBalanceMode(mode) {
      if (!manualModal) return;

      manualModal.classList.toggle("is-minus", mode === "minus");
      $all('input[name="memberBalanceAction"]', manualModal).forEach(function (input) {
        input.checked = input.value === mode;
      });
      schedulePlayerRefresh();
    }

    function resetBalanceForm() {
      if (!manualModal) return;

      var amountInput = $("[data-balance-amount]", manualModal);
      var multipleInput = $("[data-balance-multiple]", manualModal);
      var remarkInput = $("[data-balance-remark]", manualModal);
      var addType = $("[data-balance-add-type]", manualModal);
      var minusType = $("[data-balance-minus-type]", manualModal);

      if (amountInput) amountInput.value = "";
      if (multipleInput) multipleInput.value = "";
      if (remarkInput) remarkInput.value = "";
      if (addType) addType.selectedIndex = 0;
      if (minusType) minusType.selectedIndex = 0;

      setBalanceMode("add");
    }

    function findMemberById(memberId) {
      var matchedRow = null;
      $all(".member-table tbody tr").some(function (row) {
        var currentId = row.cells[1] ? row.cells[1].textContent.trim() : "";
        if (currentId === memberId) {
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
        merchantId: manualModal ? manualModal.dataset.merchantId || "101" : "101",
        balance: "-"
      };
    }

    function openManualBalance(trigger) {
      if (!manualModal) return;

      fillManualMember(getMemberFromRow(trigger ? trigger.closest("tr") : null));
      resetBalanceForm();
      manualModal.hidden = false;
      schedulePlayerRefresh();
    }

    function searchManualBalance() {
      if (!manualModal) return;

      var memberIdInput = $("[data-balance-member-id]", manualModal);
      fillManualMember(findMemberById(memberIdInput ? memberIdInput.value.trim() : ""));
      schedulePlayerRefresh();
    }

    function buildCopyText(username, password) {
      return "账号：" + username + "\n密码：" + password;
    }

    function copyText(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      }
      return new Promise(function (resolve, reject) {
        var textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "readonly");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand("copy");
          document.body.removeChild(textarea);
          resolve();
        } catch (error) {
          document.body.removeChild(textarea);
          reject(error);
        }
      });
    }

    function openModal(name) {
      var modal = document.querySelector('[data-modal="' + name + '"]');
      if (modal) {
        if (name === "create") {
          resetCreateForm();
        }
        modal.hidden = false;
        schedulePlayerRefresh();
      }
    }

    function closeModal(target) {
      var modal = target.closest(".modal-mask");
      if (modal) {
        modal.hidden = true;
        schedulePlayerRefresh();
      }
    }

    function submitCreate() {
      if (!createModal || !createPassword) return;
      var username = createUsername ? createUsername.value.trim() : "";
      var mobile = createMobile ? createMobile.value.trim() : "";
      var password = createPassword.value.trim();
      var account = username || mobile;

      if (!account) {
        if (createTip) {
          createTip.textContent = "请至少填写用户名或手机号";
          createTip.classList.add("error");
        }
        return;
      }

      if (!password) {
        if (createTip) {
          createTip.textContent = "请填写密码";
          createTip.classList.add("error");
        }
        return;
      }

      if (resultUsername) resultUsername.textContent = account;
      if (resultPassword) resultPassword.textContent = password;
      setCreateMode("result");
    }

    document.addEventListener("click", function (event) {
      var manualButton = event.target.closest("[data-manual-balance]");
      if (manualButton) {
        openManualBalance(manualButton);
        return;
      }
      if (event.target.closest("[data-operate]")) {
        openModal("operate");
        return;
      }
      if (event.target.closest("[data-detail]")) {
        openModal("detail");
        return;
      }
      if (event.target.closest("[data-create]")) {
        openModal("create");
        return;
      }
      if (event.target.closest("[data-create-submit]")) {
        submitCreate();
        return;
      }
      if (event.target.closest("[data-create-reset]")) {
        resetCreateForm();
        return;
      }
      if (event.target.closest("[data-copy-account]")) {
        var copiedUsername = resultUsername ? resultUsername.textContent.trim() : "";
        var copiedPassword = resultPassword ? resultPassword.textContent.trim() : "";
        copyText(buildCopyText(copiedUsername, copiedPassword)).then(function () {
          if (copyButton) {
            copyButton.textContent = "已复制";
            window.setTimeout(function () {
              copyButton.textContent = defaultCopyText;
            }, 1600);
          }
        }).catch(function () {
          if (copyButton) {
            copyButton.textContent = "复制失败";
            window.setTimeout(function () {
              copyButton.textContent = defaultCopyText;
            }, 1600);
          }
        });
        return;
      }
      if (event.target.closest("[data-balance-search]")) {
        searchManualBalance();
        return;
      }
      if (event.target.matches("[data-close]")) {
        closeModal(event.target);
        return;
      }
      if (event.target.classList.contains("modal-mask")) {
        event.target.hidden = true;
        schedulePlayerRefresh();
        return;
      }
      var select = event.target.closest("[data-toggle-select]");
      if (select) {
        var menu = select.closest(".operate-form").querySelector(".select-menu");
        menu.hidden = !menu.hidden;
        select.classList.toggle("open", !menu.hidden);
        return;
      }
      var tab = event.target.closest("[data-tab]");
      if (tab) {
        var modal = tab.closest(".detail-modal");
        var name = tab.dataset.tab;
        Array.prototype.forEach.call(modal.querySelectorAll(".detail-tabs button"), function (item) {
          item.classList.toggle("active", item.dataset.tab === name);
        });
        Array.prototype.forEach.call(modal.querySelectorAll(".tab-panel"), function (panel) {
          panel.classList.toggle("active", panel.dataset.panel === name);
        });
        schedulePlayerRefresh();
      }
    });

    document.addEventListener("change", function (event) {
      if (event.target.matches('input[name="memberBalanceAction"]')) {
        setBalanceMode(event.target.value);
      }
    });

    schedulePlayerRefresh();
    window.addEventListener("load", schedulePlayerRefresh);
  }

  ready(initMemberPage);
})();
