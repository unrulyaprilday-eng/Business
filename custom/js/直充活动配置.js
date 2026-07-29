(function () {
  "use strict";

  function ready(callback) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback);
    else callback();
  }

  ready(function () {
    var store = window.DirectChargeActivityStore;
    var rowsEl = document.getElementById("activityRows");
    var modalEl = document.getElementById("activityModal");
    var deleteModalEl = document.getElementById("deleteModal");
    var channelEl = document.getElementById("activityChannel");
    var fixedAmountFieldEl = document.getElementById("fixedAmountField");
    var customAmountFieldEl = document.getElementById("customAmountField");
    var fixedAmountEl = document.getElementById("fixedRechargeAmount");
    var customAmountEl = document.getElementById("customRechargeAmount");
    var nameErrorEl = document.getElementById("activityNameError");
    if (!store || !rowsEl || !modalEl || !deleteModalEl || !channelEl || !fixedAmountEl || !customAmountEl) return;

    var state = { activities: store.getAll(), editingId: null, deletingId: null };
    var toastTimer = null;

    function esc(value) {
      return String(value).replace(/[&<>\"']/g, function (char) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char];
      });
    }

    function nowText() {
      var date = new Date();
      function pad(value) { return String(value).padStart(2, "0"); }
      return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join("-") + " " + [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join(":");
    }

    function showToast(message) {
      var toastEl = document.getElementById("activityToast");
      toastEl.textContent = message;
      toastEl.hidden = false;
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(function () { toastEl.hidden = true; }, 1800);
    }

    function saveState() {
      state.activities = store.setAll(state.activities);
    }

    function findActivity(id) {
      return state.activities.filter(function (activity) { return activity.id === id; })[0] || null;
    }

    function renderRows(list) {
      rowsEl.innerHTML = list.map(function (activity) {
        var enabled = activity.status === "启用";
        return [
          "<tr>",
          "<td><strong>" + esc(activity.name) + "</strong></td>",
          "<td>" + esc(activity.channel) + "</td>",
          '<td class="cl-num">' + store.formatAmount(activity.rechargeAmount) + "</td>",
          "<td>" + esc(activity.rewardType) + "</td>",
          '<td class="cl-num">' + store.formatAmount(activity.rewardAmount) + "</td>",
          '<td><span class="cl-status ' + (enabled ? "cl-status-success" : "cl-status-muted") + '">' + esc(activity.status) + "</span></td>",
          "<td>" + esc(activity.updatedAt) + "</td>",
          '<td><span class="cl-row-actions"><button class="cl-link" type="button" data-edit="' + esc(activity.id) + '">编辑</button><button class="cl-link" type="button" data-toggle="' + esc(activity.id) + '">' + (enabled ? "停用" : "启用") + '</button><button class="cl-link cl-link-danger" type="button" data-delete="' + esc(activity.id) + '">删除</button></span></td>',
          "</tr>"
        ].join("");
      }).join("");
      document.getElementById("activityEmpty").hidden = list.length > 0;
      document.getElementById("totalCount").textContent = "共 " + list.length + " 条记录";
    }

    function applyFilters() {
      var keyword = document.getElementById("filterKeyword").value.trim().toLowerCase();
      var channel = document.getElementById("filterChannel").value;
      var status = document.getElementById("filterStatus").value;
      var list = state.activities.filter(function (activity) {
        return (!keyword || activity.name.toLowerCase().indexOf(keyword) !== -1) && (!channel || activity.channel === channel) && (!status || activity.status === status);
      });
      renderRows(list);
    }

    function renderFormOptions() {
      channelEl.innerHTML = store.channels.map(function (channel) { return '<option value="' + esc(channel.value) + '">' + esc(channel.value) + "</option>"; }).join("");
      document.getElementById("activityRewardType").innerHTML = store.rewardTypes.map(function (type) { return '<option value="' + esc(type) + '">' + esc(type) + "</option>"; }).join("");
    }

    function renderAmountControl(selectedAmount) {
      var channel = store.getChannel(channelEl.value);
      var fixed = channel.amountMode === "fixed";
      fixedAmountFieldEl.hidden = !fixed;
      customAmountFieldEl.hidden = fixed;
      if (fixed) {
        fixedAmountEl.innerHTML = channel.amounts.map(function (amount) { return '<option value="' + amount + '">' + store.formatAmount(amount) + "</option>"; }).join("");
        var candidate = selectedAmount == null ? channel.amounts[0] : Number(selectedAmount);
        fixedAmountEl.value = String(channel.amounts.indexOf(candidate) !== -1 ? candidate : channel.amounts[0]);
      } else {
        customAmountEl.value = selectedAmount == null ? "" : String(selectedAmount);
      }
    }

    function closeActivityModal() {
      modalEl.hidden = true;
      nameErrorEl.hidden = true;
    }

    function openActivityModal(activity) {
      state.editingId = activity ? activity.id : null;
      document.getElementById("activityModalTitle").textContent = activity ? "编辑直充活动" : "新增直充活动";
      document.getElementById("activityName").value = activity ? activity.name : "";
      channelEl.value = activity ? activity.channel : store.channels[0].value;
      renderAmountControl(activity ? activity.rechargeAmount : null);
      document.getElementById("activityRewardType").value = activity ? activity.rewardType : store.rewardTypes[0];
      document.getElementById("activityRewardAmount").value = activity ? String(activity.rewardAmount) : "";
      document.getElementById("activityStatus").value = activity ? activity.status : "启用";
      nameErrorEl.hidden = true;
      modalEl.hidden = false;
    }

    function validateAndSave() {
      var nameEl = document.getElementById("activityName");
      var name = nameEl.value.trim();
      var duplicate = state.activities.some(function (activity) { return activity.id !== state.editingId && activity.name.toLowerCase() === name.toLowerCase(); });
      if (!name || duplicate) {
        nameErrorEl.textContent = !name ? "请输入活动名" : "活动名已存在，请使用其他名称";
        nameErrorEl.hidden = false;
        nameEl.focus();
        return;
      }
      var channel = store.getChannel(channelEl.value);
      var rechargeAmount = channel.amountMode === "fixed" ? Number(fixedAmountEl.value) : Number(customAmountEl.value);
      var rewardAmount = Number(document.getElementById("activityRewardAmount").value);
      if (!(rechargeAmount > 0)) {
        showToast("请输入有效的充值金额");
        (channel.amountMode === "fixed" ? fixedAmountEl : customAmountEl).focus();
        return;
      }
      if (!(rewardAmount >= 0)) {
        showToast("请输入有效的赠送金额");
        document.getElementById("activityRewardAmount").focus();
        return;
      }
      var activity = {
        id: state.editingId || "dca_" + String(Date.now()).slice(-9),
        name: name,
        channel: channelEl.value,
        rechargeAmount: rechargeAmount,
        rewardType: document.getElementById("activityRewardType").value,
        rewardAmount: rewardAmount,
        status: document.getElementById("activityStatus").value,
        updatedAt: nowText()
      };
      if (state.editingId) {
        state.activities = state.activities.map(function (item) { return item.id === state.editingId ? activity : item; });
      } else {
        state.activities.unshift(activity);
      }
      saveState();
      closeActivityModal();
      applyFilters();
      showToast(state.editingId ? "活动已更新" : "活动已新增");
    }

    function closeDeleteModal() {
      state.deletingId = null;
      deleteModalEl.hidden = true;
    }

    renderFormOptions();
    renderRows(state.activities);

    document.getElementById("searchBtn").addEventListener("click", applyFilters);
    document.getElementById("resetBtn").addEventListener("click", function () {
      document.getElementById("activityFilter").reset();
      renderRows(state.activities);
    });
    document.getElementById("addActivityBtn").addEventListener("click", function () { openActivityModal(null); });
    channelEl.addEventListener("change", function () { renderAmountControl(null); });
    document.getElementById("saveActivityBtn").addEventListener("click", validateAndSave);
    document.getElementById("activityModalClose").addEventListener("click", closeActivityModal);
    document.getElementById("activityModalCancel").addEventListener("click", closeActivityModal);
    document.getElementById("deleteModalClose").addEventListener("click", closeDeleteModal);
    document.getElementById("deleteModalCancel").addEventListener("click", closeDeleteModal);
    document.getElementById("confirmDeleteBtn").addEventListener("click", function () {
      state.activities = state.activities.filter(function (activity) { return activity.id !== state.deletingId; });
      saveState();
      closeDeleteModal();
      applyFilters();
      showToast("活动已删除");
    });

    rowsEl.addEventListener("click", function (event) {
      var editButton = event.target.closest("[data-edit]");
      var toggleButton = event.target.closest("[data-toggle]");
      var deleteButton = event.target.closest("[data-delete]");
      if (editButton) {
        openActivityModal(findActivity(editButton.getAttribute("data-edit")));
      } else if (toggleButton) {
        var activity = findActivity(toggleButton.getAttribute("data-toggle"));
        if (activity) {
          activity.status = activity.status === "启用" ? "停用" : "启用";
          activity.updatedAt = nowText();
          saveState();
          applyFilters();
          showToast(activity.status === "启用" ? "活动已启用" : "活动已停用");
        }
      } else if (deleteButton) {
        state.deletingId = deleteButton.getAttribute("data-delete");
        deleteModalEl.hidden = false;
      }
    });

    [modalEl, deleteModalEl].forEach(function (layer) {
      layer.addEventListener("click", function (event) { if (event.target.classList.contains("cl-modal-mask")) layer === modalEl ? closeActivityModal() : closeDeleteModal(); });
    });
  });
}());
