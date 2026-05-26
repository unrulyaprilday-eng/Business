(function () {
  var ticketModal = document.getElementById("ticketModal");
  var confirmModal = document.getElementById("confirmModal");
  var modalTitle = document.getElementById("ticketModalTitle");
  var confirmText = document.getElementById("confirmText");
  var confirmOk = document.getElementById("confirmOk");
  var openCreate = document.getElementById("openCreate");
  var rows = document.getElementById("ticketRows");
  var pendingAction = null;

  function openModal(modal) {
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

  function showTicketPanel(type) {
    var normalized = type === "金蛋" ? "gold" : type === "随机红包" ? "random" : "percent";
    document.querySelectorAll("[data-panel]").forEach(function (panel) {
      panel.hidden = panel.getAttribute("data-panel") !== normalized;
      if (!panel.hidden && panel.classList.contains("amount-panel")) {
        refreshRewardActions(panel);
      }
    });
  }

  function createRewardRow(table) {
    var isGold = table.classList.contains("gold-table");
    var row = document.createElement("div");
    row.className = "prob-row";
    row.innerHTML = isGold
      ? '<input placeholder="金额"/><input placeholder="概率%"/>'
      : '<input placeholder="最小金额"/><input placeholder="最大金额"/><input placeholder="概率%"/>';
    return row;
  }

  function refreshRewardActions(panel) {
    var rows = panel.querySelectorAll(".prob-row");
    panel.querySelectorAll(".round-remove").forEach(function (button) {
      button.remove();
    });
    rows.forEach(function (row, index) {
      if (index > 0) {
        var removeButton = document.createElement("button");
        removeButton.className = "round-remove";
        removeButton.type = "button";
        removeButton.textContent = "－";
        row.appendChild(removeButton);
      }
    });
  }

  function setTicketType(type, locked) {
    document.querySelectorAll("input[name='ticketType']").forEach(function (radio) {
      radio.checked = radio.value === type;
      radio.disabled = !!locked;
    });
    showTicketPanel(type);
  }

  function openTicketModal(mode, type, name) {
    modalTitle.textContent = mode === "edit" ? "修改票券配置" : "新增票券配置";
    ticketModal.querySelector(".ticket-form").classList.toggle("is-edit", mode === "edit");
    document.getElementById("ticketName").value = name || "";
    setTicketType(type || "优惠百分比", mode === "edit");
    openModal(ticketModal);
  }

  function renderStoppedRow(row) {
    row.dataset.status = "stopped";
    row.querySelector("td:nth-child(8)").innerHTML = '<span class="status stopped">停发</span>';
    row.querySelector("td:nth-child(9)").innerHTML = [
      '<button class="link-btn success action-restore" type="button">恢复正常</button>',
      '<button class="link-btn action-edit" type="button">修改</button>',
      '<button class="link-btn danger action-delete" type="button">删除</button>'
    ].join(" ");
  }

  function renderEnabledRow(row) {
    row.dataset.status = "enabled";
    row.querySelector("td:nth-child(8)").innerHTML = '<span class="status enabled">启用</span>';
    row.querySelector("td:nth-child(9)").innerHTML = [
      '<button class="link-btn warn action-stop" type="button">停发</button>',
      '<button class="link-btn action-edit" type="button">修改</button>'
    ].join(" ");
  }

  function openConfirm(message, callback) {
    confirmText.textContent = message;
    pendingAction = callback;
    openModal(confirmModal);
  }

  if (openCreate) {
    openCreate.addEventListener("click", function () {
      openTicketModal("create", "优惠百分比", "");
    });
  }

  document.querySelectorAll("input[name='ticketType']").forEach(function (radio) {
    radio.addEventListener("change", function () {
      showTicketPanel(radio.value);
    });
  });

  document.addEventListener("click", function (event) {
    var closeTarget = event.target.getAttribute("data-close");
    if (closeTarget) {
      closeModal(closeTarget);
    }

    if (event.target.classList.contains("round-add")) {
      var panel = event.target.closest(".amount-panel");
      var table = panel.querySelector(".prob-table");
      table.appendChild(createRewardRow(table));
      refreshRewardActions(panel);
    }

    if (event.target.classList.contains("round-remove")) {
      var rewardPanel = event.target.closest(".amount-panel");
      event.target.closest(".prob-row").remove();
      refreshRewardActions(rewardPanel);
    }
  });

  if (rows) {
    rows.addEventListener("click", function (event) {
      var row = event.target.closest("tr");
      if (!row) {
        return;
      }
      if (event.target.classList.contains("action-edit")) {
        openTicketModal("edit", row.dataset.type || "金蛋", row.children[2].textContent);
      }
      if (event.target.classList.contains("action-stop")) {
        openConfirm("操作停发后，之后会员完成任务也不会再派奖了，是否确定？", function () {
          renderStoppedRow(row);
        });
      }
      if (event.target.classList.contains("action-restore")) {
        openConfirm("是否确认恢复正常？", function () {
          renderEnabledRow(row);
        });
      }
      if (event.target.classList.contains("action-delete") && row.dataset.status === "stopped") {
        openConfirm("确定要移除该票券吗？移除后不可恢复。", function () {
          row.remove();
        });
      }
    });
  }

  if (confirmOk) {
    confirmOk.addEventListener("click", function () {
      if (typeof pendingAction === "function") {
        pendingAction();
      }
      pendingAction = null;
      closeModal("confirmModal");
    });
  }
}());
