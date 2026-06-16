(function () {
  function init() {
    var entryModal = document.getElementById("entryModal");
    var historyModal = document.getElementById("historyModal");
    var siteField = document.getElementById("entrySite");
    var channelField = document.getElementById("entryChannel");
    var amountField = document.getElementById("entryAmount");
    var dateField = document.getElementById("entryDate");
    var remarkField = document.getElementById("entryRemark");
    var siteRow = document.getElementById("entrySiteRow");
    var channelRow = document.getElementById("entryChannelRow");
    var amountRow = document.getElementById("entryAmountRow");
    var dateRow = document.getElementById("entryDateRow");
    var remarkRow = document.getElementById("entryRemarkRow");
    var remarkCount = document.getElementById("remarkCount");
    var submitButton = document.getElementById("entrySubmit");
    var historyList = document.getElementById("historyList");
    var entryTitle = document.getElementById("entryModalTitle");
    var tableBody = document.querySelector(".data-table tbody");
    var recordCount = document.getElementById("recordCount");
    var channelIds = {
      "Facebook-AEO": "CH10021",
      "Google-UAC": "CH10035",
      "TikTok-Slot": "CH10052",
      "Kwai-Casino": "CH10077"
    };
    var state = {
      mode: "add",
      rowId: ""
    };

    if (!entryModal || !historyModal || !siteField || !channelField || !amountField || !dateField || !remarkField || !submitButton || !tableBody || !siteRow || !channelRow || !amountRow || !dateRow || !remarkRow) {
      return;
    }

    function rowById(rowId) {
      return document.querySelector('[data-row-id="' + rowId + '"]');
    }

    function formatAmount(value) {
      var number = Number(value || 0);
      return number.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }

    function formatNow() {
      var date = new Date();
      var pad = function (value) {
        return String(value).padStart(2, "0");
      };
      return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + " " +
        pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds());
    }

    function parseHistory(row) {
      try {
        return JSON.parse(row.getAttribute("data-history") || "[]");
      } catch (error) {
        return [];
      }
    }

    function parseSite(siteText) {
      var match = /（ID：(\d+)）/.exec(siteText);
      return {
        name: siteText.split("（")[0],
        id: match ? match[1] : "--"
      };
    }

    function setRemarkCount() {
      remarkCount.textContent = String(remarkField.value.length);
    }

    function closeModal(modal) {
      modal.hidden = true;
    }

    function toggleEditFields(isEdit) {
      channelField.disabled = isEdit;
      dateField.disabled = isEdit;
      amountField.disabled = false;
      remarkField.disabled = false;
      siteRow.hidden = false;
      channelRow.hidden = false;
      dateRow.hidden = false;
      amountRow.hidden = false;
      remarkRow.hidden = false;
    }

    function openEntryModal(mode, row) {
      state.mode = mode;
      state.rowId = row ? row.getAttribute("data-row-id") : "";
      entryTitle.textContent = mode === "edit" ? "渠道消耗金额修改" : "新增广告消耗";
      toggleEditFields(mode === "edit");
      siteField.textContent = row ? (row.getAttribute("data-site") || "TTTT（ID：14）") : "TTTT（ID：14）";
      channelField.value = row ? (row.getAttribute("data-channel") || "Facebook-AEO") : "Facebook-AEO";
      amountField.value = row ? (row.getAttribute("data-amount") || "") : "";
      dateField.value = row ? (row.getAttribute("data-date") || "2026-06-11") : "2026-06-11";
      remarkField.value = row ? (row.getAttribute("data-remark") || "") : "";
      setRemarkCount();
      entryModal.hidden = false;
    }

    function renderHistory(row) {
      var history = parseHistory(row);
      if (!history.length) {
        historyList.innerHTML = '<div class="history-empty">暂无记录</div>';
        return;
      }
      historyList.innerHTML = history.slice().reverse().map(function (item, index) {
        var label = index === 0 ? "最近一次录入" : "历史录入";
        return [
          '<div class="history-item">',
          '<div class="history-top"><span>' + label + '</span><span>金额：' + formatAmount(item.amount) + ' USDT</span></div>',
          '<div class="history-meta">录入人：' + item.user + '　录入时间：' + item.time + '</div>',
          '<div class="history-remark">备注：' + (item.remark || "--") + '</div>',
          '</div>'
        ].join("");
      }).join("");
    }

    function updateRow(row, payload) {
      var history = parseHistory(row);
      history.push({
        amount: payload.amount,
        remark: payload.remark,
        user: payload.user,
        time: payload.time
      });
      row.setAttribute("data-site", payload.site);
      row.setAttribute("data-site-id", payload.siteId);
      row.setAttribute("data-channel", payload.channel);
      row.setAttribute("data-channel-id", payload.channelId);
      row.setAttribute("data-date", payload.date);
      row.setAttribute("data-amount", payload.amount);
      row.setAttribute("data-remark", payload.remark);
      row.setAttribute("data-user", payload.user);
      row.setAttribute("data-time", payload.time);
      row.setAttribute("data-status", payload.status);
      row.setAttribute("data-history", JSON.stringify(history));
      row.querySelector("td:nth-child(1)").textContent = payload.date;
      row.querySelector("td:nth-child(2)").textContent = payload.channelId;
      row.querySelector("td:nth-child(3)").textContent = payload.channel;
      row.querySelector(".amount-cell").textContent = formatAmount(payload.amount);
      row.querySelector(".amount-cell").classList.remove("amount-empty");
      row.querySelector(".remark-cell").textContent = payload.remark || "--";
      row.querySelector(".user-cell").textContent = payload.user;
      row.querySelector(".time-cell").textContent = payload.time;
      row.querySelector("td:nth-child(8)").innerHTML = '<button class="link-btn" type="button" data-entry-action="edit" data-row-id="' + row.getAttribute("data-row-id") + '">修改金额</button>';
    }

    function rowMarkup(rowId, payload) {
      return [
        '<tr data-row-id="' + rowId + '"',
        ' data-site="' + payload.site + '"',
        ' data-site-id="' + payload.siteId + '"',
        ' data-channel="' + payload.channel + '"',
        ' data-channel-id="' + payload.channelId + '"',
        ' data-date="' + payload.date + '"',
        ' data-amount="' + payload.amount + '"',
        ' data-remark="' + (payload.remark || "") + '"',
        ' data-user="' + payload.user + '"',
        ' data-time="' + payload.time + '"',
        " data-history='" + JSON.stringify([{
          amount: payload.amount,
          remark: payload.remark,
          user: payload.user,
          time: payload.time
        }]).replace(/'/g, "&apos;") + "'>",
        "<td>" + payload.date + "</td>",
        "<td>" + payload.channelId + "</td>",
        "<td>" + payload.channel + "</td>",
        '<td class="amount-cell">' + formatAmount(payload.amount) + "</td>",
        '<td class="remark-cell">' + (payload.remark || "--") + "</td>",
        '<td class="user-cell">' + payload.user + "</td>",
        '<td class="time-cell">' + payload.time + "</td>",
        '<td><button class="link-btn" type="button" data-entry-action="edit" data-row-id="' + rowId + '">修改金额</button></td>',
        "</tr>"
      ].join("");
    }

    function createRow(payload) {
      var rowId = "row-" + Date.now();
      tableBody.insertAdjacentHTML("afterbegin", rowMarkup(rowId, payload));
      refreshRecordCount();
    }

    function refreshRecordCount() {
      if (!recordCount) return;
      recordCount.textContent = "共 " + tableBody.querySelectorAll("tr").length + " 条记录";
    }

    function submitEntry() {
      var amount = amountField.value.trim();
      var site = parseSite(siteField.textContent || "");
      if (!amount || isNaN(Number(amount))) {
        amountField.focus();
        return;
      }
      if (!dateField.value) {
        dateField.focus();
        return;
      }
      var payload = {
        site: siteField.textContent || "",
        siteName: site.name,
        siteId: site.id,
        channel: channelField.value,
        channelId: channelIds[channelField.value] || "--",
        amount: String(Number(amount).toFixed(2)),
        date: dateField.value,
        remark: remarkField.value.trim(),
        user: "当前登录人",
        time: formatNow()
      };
      if (state.mode === "edit") {
        var row = rowById(state.rowId);
        if (!row) return;
        updateRow(row, payload);
      } else {
        createRow(payload);
      }
      closeModal(entryModal);
    }

    document.addEventListener("click", function (event) {
      var entryButton = event.target.closest("[data-entry-action]");
      var historyButton = event.target.closest("[data-history]");
      var closeButton = event.target.closest("[data-close-modal]");

      if (entryButton) {
        var rowId = entryButton.getAttribute("data-row-id");
        var row = rowId ? rowById(rowId) : null;
        openEntryModal(entryButton.getAttribute("data-entry-action"), row);
      }

      if (historyButton) {
        var targetRow = rowById(historyButton.getAttribute("data-history"));
        if (targetRow) {
          renderHistory(targetRow);
          historyModal.hidden = false;
        }
      }

      if (closeButton) {
        closeModal(document.getElementById(closeButton.getAttribute("data-close-modal")));
      }

      if (event.target === entryModal) closeModal(entryModal);
      if (event.target === historyModal) closeModal(historyModal);
    });

    submitButton.addEventListener("click", submitEntry);
    remarkField.addEventListener("input", setRemarkCount);
    setRemarkCount();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
