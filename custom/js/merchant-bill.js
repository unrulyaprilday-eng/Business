(function () {
  var rows = [
    { month: "2026-05", setupFee: 0, serverFee: 0, vendorFee: 128270.34, manualAdd: 0, manualDeduct: 0, rechargeBonus: 0, otherDeduct: 0, settlementAmount: -128270.34, status: "audited", createdAt: "-", auditedAt: "-" },
    { month: "2026-04", setupFee: 0, serverFee: 0, vendorFee: 802.62, manualAdd: 0, manualDeduct: 0, rechargeBonus: 0, otherDeduct: 0, settlementAmount: -802.62, status: "pending", createdAt: "-", auditedAt: "-" }
  ];

  var vendorDetails = [
    { month: "2026-05", supplier: "Asia Matrix", vendor: "PG Soft", type: "SLOTS", merchantRate: 0.0105, users: 3250, bets: 183224, validBet: 4621800, profit: 311550, fee: 48692.00 },
    { month: "2026-05", supplier: "Asia Matrix", vendor: "JILI", type: "SLOTS", merchantRate: 0.012, users: 2786, bets: 121006, validBet: 3182200, profit: 194600, fee: 38186.40 },
    { month: "2026-05", supplier: "BetLink", vendor: "Evolution", type: "LIVE", merchantRate: 0.0068, users: 1664, bets: 78310, validBet: 6124700, profit: 232500, fee: 41391.94 },
    { month: "2026-05", supplier: "BetLink", vendor: "Pragmatic Play", type: "SLOTS", merchantRate: 0.0085, users: 2190, bets: 104660, validBet: 3748000, profit: 139200, fee: 31858.00 },
    { month: "2026-05", supplier: "Blue Ocean", vendor: "BTI", type: "SPORTS", merchantRate: 0.0045, users: 4120, bets: 139808, validBet: 7518200, profit: 317800, fee: 33831.90 },
    { month: "2026-04", supplier: "Asia Matrix", vendor: "PG Soft", type: "SLOTS", merchantRate: 0.003, users: 128, bets: 5620, validBet: 164200, profit: 8800, fee: 492.60 },
    { month: "2026-04", supplier: "Asia Matrix", vendor: "JILI", type: "ARCADE", merchantRate: 0.0028, users: 86, bets: 3120, validBet: 110721.43, profit: 4200, fee: 310.02 }
  ];

  var statusMap = {
    pending: { label: "待稽核", className: "pending" },
    audited: { label: "已稽核", className: "audited" }
  };

  var els = {};
  var filters = { month: "", status: "" };
  var selected = {};
  var detailState = {
    row: null,
    page: 1,
    pageSize: 4,
    filters: { vendor: "", type: "" }
  };

  function money(value) {
    return Number(value || 0).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function intText(value) {
    return Number(value || 0).toLocaleString("zh-CN");
  }

  function percent(value) {
    return (Number(value || 0) * 100).toFixed(2) + "%";
  }

  function statusTag(status) {
    var item = statusMap[status] || statusMap.pending;
    return "<span class=\"status " + item.className + "\">" + item.label + "</span>";
  }

  function filteredRows() {
    return rows.filter(function (row) {
      return (!filters.month || row.month === filters.month)
        && (!filters.status || row.status === filters.status);
    });
  }

  function rowKey(row) {
    return row.month;
  }

  function findRow(key) {
    return rows.filter(function (row) { return rowKey(row) === key; })[0];
  }

  function rowHtml(row) {
    var key = rowKey(row);
    return "<tr>"
      + "<td class=\"check-col\"><input class=\"row-check\" type=\"checkbox\" data-key=\"" + key + "\" " + (selected[key] ? "checked" : "") + " /></td>"
      + "<td>" + row.month + "</td>"
      + "<td>" + money(row.setupFee) + "</td>"
      + "<td>" + money(row.serverFee) + "</td>"
      + "<td>" + money(row.manualAdd) + "</td>"
      + "<td>" + money(row.manualDeduct) + "</td>"
      + "<td>" + money(row.vendorFee) + "</td>"
      + "<td>" + money(row.rechargeBonus) + "</td>"
      + "<td>" + money(row.otherDeduct) + "</td>"
      + "<td class=\"money negative\">" + money(row.settlementAmount) + "</td>"
      + "<td>" + statusTag(row.status) + "</td>"
      + "<td>" + row.createdAt + "</td>"
      + "<td>" + row.auditedAt + "</td>"
      + "<td><div class=\"row-actions\"><button class=\"link-btn\" type=\"button\" data-action=\"detail\" data-key=\"" + key + "\">详情</button>"
      + "<button class=\"link-btn\" type=\"button\" data-action=\"audit\" data-key=\"" + key + "\"" + (row.status === "audited" ? " disabled" : "") + ">稽核</button></div></td>"
      + "</tr>";
  }

  function render() {
    var list = filteredRows();
    if (!els.billBody || !els.checkAll) return;
    els.billBody.innerHTML = list.map(rowHtml).join("") || "<tr><td colspan=\"14\" class=\"empty-cell\">暂无数据</td></tr>";
    els.checkAll.checked = list.length > 0 && list.every(function (row) { return selected[rowKey(row)]; });
  }

  function readFilters() {
    filters.month = els.month ? els.month.value : "";
    filters.status = els.status ? els.status.value : "";
  }

  function downloadCsv(filename, header, lines) {
    var csv = [header].concat(lines).map(function (line) {
      return line.map(function (value) { return "\"" + String(value).replace(/"/g, "\"\"") + "\""; }).join(",");
    }).join("\n");
    var blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    var header = ["账期", "开版费", "服务器费用", "人工加款", "人工扣款", "游戏厂商费用", "商户充值优惠", "其他减免", "结算金额", "状态", "创建时间", "稽核时间"];
    var lines = filteredRows().map(function (row) {
      return [row.month, money(row.setupFee), money(row.serverFee), money(row.manualAdd), money(row.manualDeduct), money(row.vendorFee), money(row.rechargeBonus), money(row.otherDeduct), money(row.settlementAmount), statusMap[row.status].label, row.createdAt, row.auditedAt];
    });
    downloadCsv("商户账单.csv", header, lines);
  }

  function optionList(list, field) {
    var seen = {};
    return list.map(function (item) { return item[field]; }).filter(function (value) {
      if (seen[value]) return false;
      seen[value] = true;
      return true;
    }).sort();
  }

  function setOptions(select, values, placeholder, current) {
    if (!select) return;
    select.innerHTML = "<option value=\"\">" + placeholder + "</option>" + values.map(function (value) {
      return "<option value=\"" + value + "\">" + value + "</option>";
    }).join("");
    if (values.indexOf(current) >= 0) select.value = current;
  }

  function auditRow(row) {
    if (!row || row.status === "audited") return;
    row.status = "audited";
    row.auditedAt = "2026-06-01 16:30";
  }

  function batchAudit() {
    Object.keys(selected).forEach(function (key) {
      auditRow(findRow(key));
    });
    selected = {};
    render();
  }

  function showDetail(row) {
    if (!row || !els.detailPanel) return;
    detailState.row = row;
    detailState.page = 1;
    detailState.filters = { vendor: "", type: "" };
    els.detailTitle.textContent = row.month + " 游戏厂商费用明细";
    els.detailPanel.classList.remove("is-hidden");
    renderDetail();
  }

  function baseDetailRows() {
    if (!detailState.row) return [];
    return vendorDetails.filter(function (item) {
      return item.month === detailState.row.month;
    });
  }

  function filteredDetailRows() {
    return baseDetailRows().filter(function (item) {
      return (!detailState.filters.vendor || item.vendor === detailState.filters.vendor)
        && (!detailState.filters.type || item.type === detailState.filters.type);
    });
  }

  function syncDetailOptions() {
    var base = baseDetailRows();
    var typeRows = base.filter(function (item) {
      return !detailState.filters.vendor || item.vendor === detailState.filters.vendor;
    });

    setOptions(els.detailVendor, optionList(base, "vendor"), "全部厂商", detailState.filters.vendor);
    setOptions(els.detailType, optionList(typeRows, "type"), "全部游戏类型", detailState.filters.type);
  }

  function renderDetailPagination(total) {
    var pageCount = Math.max(1, Math.ceil(total / detailState.pageSize));
    if (detailState.page > pageCount) detailState.page = pageCount;

    var buttons = [];
    for (var i = 1; i <= pageCount; i += 1) {
      buttons.push("<button class=\"page-btn " + (i === detailState.page ? "active" : "") + "\" type=\"button\" data-detail-page=\"" + i + "\">" + i + "</button>");
    }

    els.detailPaginationInfo.textContent = "共 " + total + " 条明细，当前第 " + detailState.page + " / " + pageCount + " 页";
    els.detailPaginationActions.innerHTML = "<button class=\"page-btn\" type=\"button\" data-detail-page=\"prev\" " + (detailState.page === 1 ? "disabled" : "") + ">上一页</button>"
      + buttons.join("")
      + "<button class=\"page-btn\" type=\"button\" data-detail-page=\"next\" " + (detailState.page === pageCount ? "disabled" : "") + ">下一页</button>";
  }

  function renderDetail() {
    if (!els.vendorDetailBody || !els.detailPaginationInfo || !els.detailPaginationActions) return;
    syncDetailOptions();
    var list = filteredDetailRows();
    var start = (detailState.page - 1) * detailState.pageSize;
    var pageRows = list.slice(start, start + detailState.pageSize);

    els.vendorDetailBody.innerHTML = pageRows.map(function (item) {
      return "<tr>"
        + "<td>" + item.vendor + "</td>"
        + "<td>" + item.type + "</td>"
        + "<td>" + percent(item.merchantRate) + "</td>"
        + "<td>" + intText(item.users) + "</td>"
        + "<td>" + intText(item.bets) + "</td>"
        + "<td>" + money(item.validBet) + "</td>"
        + "<td class=\"" + (item.profit < 0 ? "negative" : "") + "\">" + money(item.profit) + "</td>"
        + "<td class=\"money\">" + money(item.fee) + "</td>"
        + "</tr>";
    }).join("") || "<tr><td colspan=\"8\" class=\"empty-cell\">暂无厂商费用明细</td></tr>";
    renderDetailPagination(list.length);
  }

  function bind() {
    if (!els.search || !els.reset || !els.billBody) return;

    els.search.addEventListener("click", function () {
      readFilters();
      selected = {};
      render();
    });

    els.reset.addEventListener("click", function () {
      filters = { month: "", status: "" };
      selected = {};
      els.month.value = "";
      els.status.value = "";
      render();
    });

    els.batchAuditBtn.addEventListener("click", batchAudit);
    els.exportBtn.addEventListener("click", exportCsv);
    els.closeDetailBtn.addEventListener("click", function () {
      els.detailPanel.classList.add("is-hidden");
    });

    els.detailVendor.addEventListener("change", function () {
      detailState.filters.vendor = els.detailVendor.value;
      detailState.filters.type = "";
      detailState.page = 1;
      renderDetail();
    });

    els.detailType.addEventListener("change", function () {
      detailState.filters.type = els.detailType.value;
      detailState.page = 1;
      renderDetail();
    });

    els.detailPaginationActions.addEventListener("click", function (event) {
      var target = event.target.getAttribute("data-detail-page");
      if (!target) return;
      var pageCount = Math.max(1, Math.ceil(filteredDetailRows().length / detailState.pageSize));
      if (target === "prev") detailState.page = Math.max(1, detailState.page - 1);
      else if (target === "next") detailState.page = Math.min(pageCount, detailState.page + 1);
      else detailState.page = Number(target);
      renderDetail();
    });

    els.checkAll.addEventListener("change", function () {
      filteredRows().forEach(function (row) {
        var key = rowKey(row);
        if (els.checkAll.checked) selected[key] = true;
        else delete selected[key];
      });
      render();
    });

    els.billBody.addEventListener("change", function (event) {
      var key = event.target.getAttribute("data-key");
      if (!key) return;
      if (event.target.checked) selected[key] = true;
      else delete selected[key];
      render();
    });

    els.billBody.addEventListener("click", function (event) {
      var key = event.target.getAttribute("data-key");
      var action = event.target.getAttribute("data-action");
      if (action === "detail") showDetail(findRow(key));
      if (action === "audit") {
        auditRow(findRow(key));
        selected = {};
        render();
      }
    });
  }

  function init() {
    els = {
      month: document.getElementById("filterMonth"),
      status: document.getElementById("filterStatus"),
      search: document.getElementById("searchBtn"),
      reset: document.getElementById("resetBtn"),
      batchAuditBtn: document.getElementById("batchAuditBtn"),
      exportBtn: document.getElementById("exportBtn"),
      checkAll: document.getElementById("checkAll"),
      billBody: document.getElementById("billBody"),
      detailPanel: document.getElementById("detailPanel"),
      detailTitle: document.getElementById("detailTitle"),
      detailVendor: document.getElementById("detailVendor"),
      detailType: document.getElementById("detailType"),
      vendorDetailBody: document.getElementById("vendorDetailBody"),
      detailPaginationInfo: document.getElementById("detailPaginationInfo"),
      detailPaginationActions: document.getElementById("detailPaginationActions"),
      closeDetailBtn: document.getElementById("closeDetailBtn")
    };
    bind();
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
