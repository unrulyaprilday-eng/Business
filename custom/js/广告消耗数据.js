(function () {
  function init() {
    var entryModal = document.getElementById("entryModal");
    var entryTitle = document.getElementById("entryModalTitle");
    var channelField = document.getElementById("entryChannel");
    var codeField = document.getElementById("entryCode");
    var amountField = document.getElementById("entryAmount");
    var dateField = document.getElementById("entryDate");
    var remarkField = document.getElementById("entryRemark");
    var remarkCount = document.getElementById("remarkCount");
    var submitButton = document.getElementById("entrySubmit");
    var tableBody = document.querySelector(".data-table tbody");
    var recordCount = document.getElementById("recordCount");
    var filterForm = document.getElementById("spendFilter");
    var filterStartDate = document.getElementById("filterStartDate");
    var filterEndDate = document.getElementById("filterEndDate");
    var filterChannel = document.getElementById("filterChannel");
    var state = { mode: "add", rowId: "" };

    if (!entryModal || !entryTitle || !channelField || !codeField || !amountField || !dateField ||
        !remarkField || !remarkCount || !submitButton || !tableBody || !filterForm ||
        !filterStartDate || !filterEndDate || !filterChannel) {
      return;
    }

    function rowById(rowId) {
      return tableBody.querySelector('[data-row-id="' + rowId + '"]');
    }

    function formatNow() {
      var now = new Date();
      var offset = -now.getTimezoneOffset();
      var sign = offset >= 0 ? "+" : "-";
      var pad = function (value) { return String(value).padStart(2, "0"); };
      return now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) + "T" +
        pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds()) + ".000000" +
        sign + pad(Math.floor(Math.abs(offset) / 60)) + ":" + pad(Math.abs(offset) % 60);
    }

    function setRemarkCount() {
      remarkCount.textContent = String(remarkField.value.length);
    }

    function updateDatePlaceholder(input) {
      var control = input.closest(".date-control");
      if (control) control.classList.toggle("has-value", Boolean(input.value));
    }

    function refreshRecordCount() {
      if (!recordCount) return;
      recordCount.textContent = "共 " + tableBody.querySelectorAll("tr").length + " 条记录";
    }

    function closeModal() {
      entryModal.hidden = true;
    }

    function openEntryModal(mode, row) {
      state.mode = mode;
      state.rowId = row ? row.getAttribute("data-row-id") : "";
      entryTitle.textContent = mode === "edit" ? "编辑渠道消耗" : "新增渠道消耗";
      channelField.value = row ? row.getAttribute("data-channel") : "Facebook测试";
      codeField.value = row ? row.getAttribute("data-channel-code") : "";
      amountField.value = row ? row.getAttribute("data-amount") : "";
      dateField.value = row ? row.getAttribute("data-date") : "";
      remarkField.value = row ? row.getAttribute("data-remark") : "";
      setRemarkCount();
      entryModal.hidden = false;
    }

    function actionMarkup(rowId) {
      return '<button class="link-btn" type="button" data-entry-action="edit" data-row-id="' + rowId + '">编辑</button>' +
        '<button class="link-btn danger-link" type="button" data-entry-action="delete" data-row-id="' + rowId + '">删除</button>';
    }

    function applyPayload(row, payload) {
      row.setAttribute("data-channel", payload.channel);
      row.setAttribute("data-channel-code", payload.code);
      row.setAttribute("data-date", payload.date);
      row.setAttribute("data-amount", payload.amount);
      row.setAttribute("data-remark", payload.remark);
      row.setAttribute("data-user", payload.user);
      row.setAttribute("data-time", payload.time);
      row.children[0].textContent = payload.date;
      row.querySelector(".channel-cell").textContent = payload.channel;
      row.querySelector(".code-cell").textContent = payload.code;
      row.querySelector(".amount-cell").textContent = payload.amount;
      row.querySelector(".remark-cell").textContent = payload.remark;
      row.querySelector(".user-cell").textContent = payload.user;
      row.querySelector(".time-cell").textContent = payload.time;
    }

    function createRow(payload) {
      var rowId = "row-" + Date.now();
      var row = document.createElement("tr");
      row.setAttribute("data-row-id", rowId);
      row.innerHTML = '<td></td><td class="channel-cell"></td><td class="code-cell"></td>' +
        '<td class="amount-cell"></td><td class="remark-cell"></td><td class="user-cell"></td>' +
        '<td class="time-cell"></td><td class="action-cell">' + actionMarkup(rowId) + "</td>";
      applyPayload(row, payload);
      tableBody.insertBefore(row, tableBody.firstChild);
      refreshRecordCount();
    }

    function submitEntry() {
      var code = codeField.value.trim();
      var amount = amountField.value.trim();
      if (!code) {
        codeField.focus();
        return;
      }
      if (!amount || isNaN(Number(amount))) {
        amountField.focus();
        return;
      }
      if (!dateField.value) {
        dateField.focus();
        return;
      }
      var payload = {
        channel: channelField.value,
        code: code,
        amount: amount,
        date: dateField.value,
        remark: remarkField.value.trim(),
        user: "Admin",
        time: formatNow()
      };
      if (state.mode === "edit") {
        var row = rowById(state.rowId);
        if (!row) return;
        applyPayload(row, payload);
      } else {
        createRow(payload);
      }
      closeModal();
      applyFilters();
    }

    function applyFilters() {
      var start = filterStartDate.value;
      var end = filterEndDate.value;
      var channel = filterChannel.value;
      Array.prototype.forEach.call(tableBody.querySelectorAll("tr"), function (row) {
        var date = row.getAttribute("data-date") || "";
        var channelMatches = channel === "请选择渠道" || row.getAttribute("data-channel") === channel;
        row.hidden = !channelMatches || Boolean(start && date < start) || Boolean(end && date > end);
      });
    }

    document.addEventListener("click", function (event) {
      var entryButton = event.target.closest("[data-entry-action]");
      var closeButton = event.target.closest("[data-close-modal]");
      if (entryButton) {
        var action = entryButton.getAttribute("data-entry-action");
        var row = rowById(entryButton.getAttribute("data-row-id"));
        if (action === "delete" && row) {
          row.remove();
          refreshRecordCount();
        } else if (action === "add" || (action === "edit" && row)) {
          openEntryModal(action, row);
        }
      }
      if (closeButton || event.target === entryModal) closeModal();
    });

    filterForm.addEventListener("submit", function (event) {
      event.preventDefault();
      applyFilters();
    });
    filterForm.addEventListener("reset", function () {
      window.setTimeout(function () {
        updateDatePlaceholder(filterStartDate);
        updateDatePlaceholder(filterEndDate);
        applyFilters();
      }, 0);
    });
    filterStartDate.addEventListener("change", function () { updateDatePlaceholder(filterStartDate); });
    filterEndDate.addEventListener("change", function () { updateDatePlaceholder(filterEndDate); });
    submitButton.addEventListener("click", submitEntry);
    remarkField.addEventListener("input", setRemarkCount);
    updateDatePlaceholder(filterStartDate);
    updateDatePlaceholder(filterEndDate);
    setRemarkCount();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
