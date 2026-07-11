(function () {
  var pendingConfirmAction = null;

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
    if (id === "confirmModal") {
      pendingConfirmAction = null;
    }
  }

  function setText(id, text) {
    var node = document.getElementById(id);
    if (node) {
      node.textContent = text;
    }
  }

  function openConfirm(options) {
    setText("confirmTitle", options.title);
    setText("confirmBody", options.body);
    pendingConfirmAction = options.onConfirm || null;
    openModal("confirmModal");
  }

  function setFeatureEnabled(enabled) {
    var masterSwitch = document.getElementById("featureMasterSwitch");
    var statusText = document.getElementById("featureMasterStatus");
    var panel = qs(".redeem-panel");

    if (masterSwitch) {
      masterSwitch.classList.toggle("on", enabled);
      masterSwitch.setAttribute("aria-pressed", enabled ? "true" : "false");
      masterSwitch.setAttribute("aria-label", enabled ? "本功能总开关，当前已开启" : "本功能总开关，当前已关闭");
    }

    if (statusText) {
      statusText.textContent = enabled ? "已开启" : "已关闭";
      statusText.classList.toggle("off", !enabled);
    }

    if (panel) {
      panel.classList.toggle("feature-disabled", !enabled);
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

  function showDetailClaimLimit(limit) {
    var text = limit === "none" ? "无" : "已完成首充";
    qsa("[data-detail-claim-limit]").forEach(function (node) {
      node.textContent = text;
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
    var masterSwitch = document.getElementById("featureMasterSwitch");
    var confirmSubmitButton = document.getElementById("confirmSubmitButton");
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

    if (masterSwitch) {
      masterSwitch.addEventListener("click", function () {
        var enabled = masterSwitch.classList.contains("on");
        var nextEnabled = !enabled;
        openConfirm({
          title: nextEnabled ? "开启功能确认" : "关闭功能确认",
          body: nextEnabled
            ? "确认开启兑换码功能？开启后玩家可使用有效兑换码兑换奖励。"
            : "确认关闭兑换码功能？关闭后玩家将无法使用兑换码兑换奖励，已有兑换码配置保留。",
          onConfirm: function () {
            setFeatureEnabled(nextEnabled);
          }
        });
      });
    }

    if (confirmSubmitButton) {
      confirmSubmitButton.addEventListener("click", function () {
        var action = pendingConfirmAction;
        if (action) {
          action();
        }
        closeModal("confirmModal");
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
          showDetailClaimLimit(row.getAttribute("data-claim-limit"));
          openModal("detailModal");
        }
      }

      if (event.target.classList.contains("delete-btn")) {
        openConfirm({
          title: "删除确认",
          body: "确认删除这条兑换码吗？删除后不可恢复。"
        });
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
    setFeatureEnabled(true);
    renderSelectedChannels();
  });
}());
