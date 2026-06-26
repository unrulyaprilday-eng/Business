(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function openModal(id) {
    var modal = document.getElementById(id);
    if (modal) {
      modal.hidden = false;
    }
  }

  function closeModal(id) {
    var modal = document.getElementById(id);
    if (modal) {
      modal.hidden = true;
    }
  }

  function showCodePanel(type) {
    qsa("[data-code-panel]").forEach(function (panel) {
      panel.hidden = panel.getAttribute("data-code-panel") !== type;
    });
  }

  function showScopePanel(scope) {
    qsa("[data-scope-panel]").forEach(function (panel) {
      panel.hidden = panel.getAttribute("data-scope-panel") !== scope;
    });
  }

  function showDetailView(type) {
    qsa("[data-detail-view]").forEach(function (view) {
      view.hidden = view.getAttribute("data-detail-view") !== type;
    });
  }

  function renderSelectedChannels() {
    var selectedBox = document.getElementById("selectedChannelList");
    var triggerText = document.getElementById("channelPickerText");
    var checked = qsa(".scope-dropdown input[type='checkbox']:checked");
    var values = checked.map(function (input) {
      return input.value;
    });

    if (selectedBox) {
      selectedBox.innerHTML = values.length
        ? values.map(function (value) { return "<div>" + value + "</div>"; }).join("")
        : "<div>暂无已选渠道</div>";
    }

    if (triggerText) {
      if (values.length === 0) {
        triggerText.textContent = "请选择";
      } else if (values.length === 1) {
        triggerText.textContent = values[0];
      } else {
        triggerText.textContent = values[0] + " 等" + values.length + "项";
      }
    }
  }

  function toggleChannelDropdown(forceOpen) {
    var dropdown = document.getElementById("channelDropdown");
    var trigger = document.getElementById("channelPickerTrigger");
    if (!dropdown || !trigger) {
      return;
    }
    var nextOpen = typeof forceOpen === "boolean" ? forceOpen : dropdown.hidden;
    dropdown.hidden = !nextOpen;
    trigger.setAttribute("aria-expanded", nextOpen ? "true" : "false");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var createBtn = document.getElementById("openCreateModal");
    var rows = document.getElementById("redeemRows");
    var channelTrigger = document.getElementById("channelPickerTrigger");
    var channelSearchInput = document.getElementById("channelSearchInput");

    if (createBtn) {
      createBtn.addEventListener("click", function () {
        showCodePanel("reuse");
        showScopePanel("all");
        qsa("input[name='codeType']").forEach(function (radio) {
          radio.checked = radio.value === "reuse";
        });
        qsa("input[name='userScope']").forEach(function (radio) {
          radio.checked = radio.value === "all";
        });
        toggleChannelDropdown(false);
        openModal("createModal");
      });
    }

    qsa("input[name='codeType']").forEach(function (radio) {
      radio.addEventListener("change", function () {
        if (radio.checked) {
          showCodePanel(radio.value);
        }
      });
    });

    qsa("input[name='userScope']").forEach(function (radio) {
      radio.addEventListener("change", function () {
        if (radio.checked) {
          showScopePanel(radio.value);
          if (radio.value !== "channel") {
            toggleChannelDropdown(false);
          }
        }
      });
    });

    if (channelTrigger) {
      channelTrigger.addEventListener("click", function (event) {
        event.stopPropagation();
        toggleChannelDropdown();
      });
    }

    if (channelSearchInput) {
      channelSearchInput.addEventListener("input", function () {
        var keyword = channelSearchInput.value.trim().toLowerCase();
        qsa("[data-channel-option]").forEach(function (option) {
          var value = option.getAttribute("data-channel-option").toLowerCase();
          option.hidden = keyword ? value.indexOf(keyword) === -1 : false;
        });
      });
    }

    qsa(".scope-dropdown input[type='checkbox']").forEach(function (checkbox) {
      checkbox.addEventListener("change", renderSelectedChannels);
    });

    document.addEventListener("click", function (event) {
      var closeTarget = event.target.getAttribute && event.target.getAttribute("data-close");
      if (closeTarget) {
        closeModal(closeTarget);
      }

      if (event.target.classList.contains("view-btn")) {
        var row = event.target.closest("tr");
        if (row) {
          showDetailView(row.getAttribute("data-type") === "one-time" ? "one-time" : "reuse");
          openModal("detailModal");
        }
      }

      if (event.target.classList.contains("delete-btn")) {
        openModal("confirmModal");
      }

      if (!event.target.closest("[data-channel-picker]")) {
        toggleChannelDropdown(false);
      }
    });

    if (rows) {
      rows.addEventListener("click", function (event) {
        var switchEl = event.target.closest(".switch");
        if (switchEl) {
          switchEl.classList.toggle("on");
        }
      });
    }

    showCodePanel("reuse");
    showScopePanel("all");
    showDetailView("reuse");
    renderSelectedChannels();
  });
}());
