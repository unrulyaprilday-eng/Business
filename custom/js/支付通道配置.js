(function () {
  var editingIndex = null;
  var siteEditingIndex = null;
  var deleteIndex = null;
  var toastTimer = null;

  var sites = [
    { id: "101", name: "测试站点" },
    { id: "102", name: "测试站点2" },
    { id: "103", name: "测试站点03" },
    { id: "104", name: "测试003" }
  ];

  var rows = [
    {
      type: "succuspay",
      name: "SuccusPay测试",
      collection: ["Cashapp", "Btcppay", "Paypal", "Applepay"],
      payout: ["Paypal", "Card", "Ecashapp", "Chime"],
      currency: "USD",
      createdAt: "2026-05-20 11:20:08",
      enabled: true,
      merchant: "2026047279",
      sites: [],
      remark: "test"
    },
    {
      type: "UsdtPay",
      name: "USDT收款",
      collection: ["TRC20", "ERC20"],
      payout: ["TRC20"],
      currency: "USD",
      createdAt: "2026-05-07 17:58:04",
      enabled: true,
      merchant: "",
      sites: [],
      remark: "TRC20 USDT手动收款..."
    },
    {
      type: "WiwiPay",
      name: "WiwiPay测试商户",
      collection: ["Cashapp", "Btcppay", "Paypal", "Googlepay"],
      payout: ["Paypal", "Card", "Ecashapp", "ACH"],
      currency: "USD",
      createdAt: "2026-03-22 17:38:26",
      enabled: true,
      merchant: "2026032690",
      sites: [],
      remark: "WiwiPay测试商户"
    },
    {
      type: "WiwiPay",
      name: "测02",
      collection: ["Cashapp", "Btcppay", "Paypal", "Applepay"],
      payout: ["Paypal", "Card", "Ecashapp", "Chime"],
      currency: "USD",
      createdAt: "2026-03-18 15:25:24",
      enabled: false,
      merchant: "2026047279",
      sites: ["101", "103"],
      remark: "1"
    },
    {
      type: "WiwiPay",
      name: "wiwipay01",
      collection: ["Cashapp", "Btcppay", "Paypal", "Manual Deposit"],
      payout: ["Paypal", "Card", "ACH"],
      currency: "USD",
      createdAt: "2026-03-17 17:01:43",
      enabled: true,
      merchant: "2026032690",
      sites: [],
      remark: "WiwiPay-USD通道"
    },
    {
      type: "QQPay",
      name: "qqpay",
      collection: ["PIX"],
      payout: ["PIX"],
      currency: "USD",
      createdAt: "2026-03-13 16:38:09",
      enabled: true,
      merchant: "YOUR_MERCHANT_ID",
      sites: [],
      remark: "QQPay-PIX通道"
    },
    {
      type: "WiwiPay",
      name: "wiwipay正式商户",
      collection: ["Cashapp", "Paypal", "Googlepay", "Manual Deposit"],
      payout: ["Paypal", "Card", "Ecashapp", "ACH"],
      currency: "USD",
      createdAt: "2026-03-13 15:49:17",
      enabled: true,
      merchant: "2025125772",
      sites: [],
      remark: "正式商户"
    }
  ];

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function compactList(list) {
    var text = list.join(", ");
    return text.length > 28 ? text.slice(0, 27) + "..." : text;
  }

  function siteText(row) {
    if (!row.sites.length) return "全部站点";
    return row.sites.map(function (id) {
      var site = sites.find(function (item) { return item.id === id; });
      return site ? site.name : id;
    }).join("、");
  }

  function rowHtml(row, index) {
    var statusClass = row.enabled ? "success" : "danger-text";
    var statusText = row.enabled ? "启用" : "停用";
    return "<tr>"
      + "<td title=\"" + escapeHtml(row.type) + "\">" + escapeHtml(row.type) + "</td>"
      + "<td title=\"" + escapeHtml(row.name) + "\">" + escapeHtml(row.name) + "</td>"
      + "<td title=\"" + escapeHtml(row.collection.join(', ')) + "\">" + escapeHtml(compactList(row.collection)) + "</td>"
      + "<td title=\"" + escapeHtml(row.payout.join(', ')) + "\">" + escapeHtml(compactList(row.payout)) + "</td>"
      + "<td>" + escapeHtml(row.currency) + "</td>"
      + "<td>" + escapeHtml(row.createdAt) + "</td>"
      + "<td class=\"" + statusClass + "\">" + statusText + "</td>"
      + "<td title=\"" + escapeHtml(row.merchant) + "\">" + escapeHtml(row.merchant) + "</td>"
      + "<td><button class=\"link-btn\" data-sites=\"" + index + "\" title=\"" + escapeHtml(siteText(row)) + "\" type=\"button\">" + escapeHtml(siteText(row)) + "</button></td>"
      + "<td title=\"" + escapeHtml(row.remark) + "\">" + escapeHtml(row.remark) + "</td>"
      + "<td><div class=\"action-line\"><button class=\"link-btn\" data-edit=\"" + index + "\" type=\"button\">修改</button><button class=\"link-btn\" data-delete=\"" + index + "\" type=\"button\">删除</button></div></td>"
      + "</tr>";
  }

  function render() {
    document.getElementById("paymentRows").innerHTML = rows.map(rowHtml).join("");
    document.querySelector(".total-count").textContent = "共 " + rows.length + " 条记录";
  }

  function openModal(name) {
    document.querySelector("[data-modal='" + name + "']").classList.remove("is-hidden");
  }

  function closeModals() {
    Array.prototype.forEach.call(document.querySelectorAll(".modal-mask"), function (modal) {
      modal.classList.add("is-hidden");
    });
  }

  function showToast(message) {
    var toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.remove("is-hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.add("is-hidden");
    }, 2200);
  }

  function selectedValues(selector) {
    return Array.prototype.map.call(document.querySelectorAll(selector + " input:checked"), function (item) {
      return item.value;
    });
  }

  function setChecks(selector, values) {
    Array.prototype.forEach.call(document.querySelectorAll(selector + " input"), function (item) {
      item.checked = values.indexOf(item.value) >= 0;
    });
  }

  function openForm(index) {
    editingIndex = index;
    var isEdit = typeof index === "number";
    var row = isEdit ? rows[index] : {
      type: "SuccusPay",
      name: "",
      collection: ["Cashapp", "Btcppay", "Paypal", "Applepay", "Googlepay", "Manual Deposit"],
      payout: ["Paypal", "Card", "Ecashapp", "Chime", "ACH"],
      currency: "USD",
      enabled: false,
      merchant: "",
      remark: ""
    };
    document.getElementById("formTitle").textContent = isEdit ? "修改在线支付平台" : "新增在线支付平台";
    document.getElementById("channelType").value = row.type === "succuspay" ? "SuccusPay" : row.type;
    document.getElementById("channelName").value = row.name;
    document.getElementById("currencyType").value = row.currency;
    document.getElementById("merchantNo").value = row.merchant;
    document.getElementById("remark").value = row.remark;
    document.getElementById("enableSwitch").checked = row.enabled;
    setChecks("[data-group='collection']", row.collection);
    setChecks("[data-group='payout']", row.payout);
    openModal("form");
  }

  function saveForm() {
    var name = document.getElementById("channelName").value.trim();
    if (!name) {
      showToast("请输入通道名称");
      return;
    }
    var next = {
      type: document.getElementById("channelType").value,
      name: name,
      collection: selectedValues("[data-group='collection']"),
      payout: selectedValues("[data-group='payout']"),
      currency: document.getElementById("currencyType").value,
      createdAt: editingIndex === null ? "2026-05-20 11:20:08" : rows[editingIndex].createdAt,
      enabled: document.getElementById("enableSwitch").checked,
      merchant: document.getElementById("merchantNo").value.trim(),
      sites: editingIndex === null ? [] : rows[editingIndex].sites.slice(),
      remark: document.getElementById("remark").value.trim()
    };
    if (editingIndex === null) {
      rows.unshift(next);
    } else {
      rows[editingIndex] = next;
    }
    render();
    closeModals();
  }

  function renderSites(selected) {
    document.getElementById("siteRows").innerHTML = sites.map(function (site) {
      var checked = selected.indexOf(site.id) >= 0 ? " checked" : "";
      return "<tr><td><input class=\"site-check\" value=\"" + site.id + "\" type=\"checkbox\"" + checked + "/></td><td>" + site.id + "</td><td>" + escapeHtml(site.name) + "</td></tr>";
    }).join("");
    document.getElementById("siteCheckAll").checked = selected.length === sites.length;
  }

  function openSites(index) {
    siteEditingIndex = index;
    renderSites(rows[index].sites);
    openModal("sites");
  }

  function saveSites() {
    if (siteEditingIndex === null) return;
    rows[siteEditingIndex].sites = Array.prototype.map.call(document.querySelectorAll(".site-check:checked"), function (item) {
      return item.value;
    });
    render();
    closeModals();
  }

  function requestDelete(index) {
    deleteIndex = index;
    if (rows[index].enabled) {
      showToast("启用状态不可删除，请先停用后再删除");
      return;
    }
    openModal("delete");
  }

  function confirmDelete() {
    if (deleteIndex !== null && !rows[deleteIndex].enabled) {
      rows.splice(deleteIndex, 1);
      render();
      closeModals();
      showToast("删除成功");
    }
    deleteIndex = null;
  }

  document.addEventListener("click", function (event) {
    var target = event.target;
    var editIndex = target.getAttribute("data-edit");
    var siteIndex = target.getAttribute("data-sites");
    var deleteTarget = target.getAttribute("data-delete");

    if (target.hasAttribute("data-open-form")) openForm(null);
    if (editIndex !== null) openForm(Number(editIndex));
    if (siteIndex !== null) openSites(Number(siteIndex));
    if (deleteTarget !== null) requestDelete(Number(deleteTarget));
    if (target.hasAttribute("data-close") || target.classList.contains("modal-mask")) closeModals();
  });

  document.getElementById("confirmForm").addEventListener("click", saveForm);
  document.getElementById("saveSites").addEventListener("click", saveSites);
  document.getElementById("confirmDelete").addEventListener("click", confirmDelete);
  document.getElementById("siteCheckAll").addEventListener("change", function (event) {
    Array.prototype.forEach.call(document.querySelectorAll(".site-check"), function (item) {
      item.checked = event.target.checked;
    });
  });
  document.getElementById("siteRows").addEventListener("change", function () {
    var checkedCount = document.querySelectorAll(".site-check:checked").length;
    document.getElementById("siteCheckAll").checked = checkedCount === sites.length;
  });

  render();
})();
