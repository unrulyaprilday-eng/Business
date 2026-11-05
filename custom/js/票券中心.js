(function () {
  var STORAGE_KEY = "business-ticket-coupons-v1";
  var ticketModal = document.getElementById("ticketModal");
  var confirmModal = document.getElementById("confirmModal");
  var modalTitle = document.getElementById("ticketModalTitle");
  var confirmText = document.getElementById("confirmText");
  var confirmOk = document.getElementById("confirmOk");
  var openCreate = document.getElementById("openCreate");
  var saveTicket = document.getElementById("saveTicket");
  var rows = document.getElementById("ticketRows");
  var searchInput = document.querySelector(".search-input");
  var pendingAction = null;
  var editingId = null;
  var coupons = readCoupons();

  function seedCoupons() {
    return [
      { id: "CPN-20261104-001", name: "新客优惠券", type: "percent", enabled: true, validityDays: 0, wagerMultiple: 0, discountValue: 10, distributed: 0, used: 0, createdAt: "2026-05-18 13:24:58" },
      { id: "CPN-20261104-002", name: "满额赠送券", type: "recharge_fixed", enabled: true, validityDays: 0, wagerMultiple: 0, rechargeThreshold: 100, fixedBonus: 20, distributed: 0, used: 0, createdAt: "2026-04-02 18:35:29" },
      { id: "CPN-20261104-003", name: "充值比例赠送券", type: "recharge_percent", enabled: true, validityDays: 0, wagerMultiple: 0, rechargeThreshold: 50, bonusRate: 10, maxBonus: 100, distributed: 1, used: 17, createdAt: "2026-04-02 18:31:18" },
      { id: "CPN-20261104-004", name: "停用优惠券", type: "percent", enabled: false, validityDays: 1, wagerMultiple: 0, discountValue: 5, distributed: 0, used: 0, createdAt: "2026-04-02 18:18:24" }
    ];
  }

  function readCoupons() {
    try {
      var stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        var parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          var current = parsed.filter(function (coupon) {
            return coupon && coupon.type !== "金蛋" && coupon.type !== "随机红包";
          });
          if (current.length !== parsed.length) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
          }
          return current;
        }
      }
      var initial = seedCoupons();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    } catch (error) {
      return seedCoupons();
    }
  }

  function persistCoupons() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
    } catch (error) {
      window.alert("票券配置保存失败，请检查浏览器存储空间后重试。");
    }
  }

  function typeLabel(type) {
    if (type === "recharge_fixed") { return "充值固定优惠券"; }
    if (type === "recharge_percent") { return "充值百分比优惠券"; }
    return "优惠百分比";
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function validityText(coupon) {
    return coupon.validityDays > 0 ? coupon.validityDays + "天" : "长期";
  }

  function renderRow(coupon) {
    var enabled = coupon.enabled !== false;
    var row = document.createElement("tr");
    row.dataset.id = coupon.id;
    row.dataset.type = coupon.type;
    row.dataset.status = enabled ? "enabled" : "stopped";
    row.innerHTML = [
      '<td title="' + escapeHtml(coupon.id) + '">' + escapeHtml(coupon.id) + '</td>',
      '<td>' + escapeHtml(typeLabel(coupon.type)) + '</td>',
      '<td>' + escapeHtml(coupon.name) + '</td>',
      '<td>' + escapeHtml(validityText(coupon)) + '</td>',
      '<td>' + Number(coupon.distributed || 0) + '</td>',
      '<td>' + Number(coupon.used || 0) + '</td>',
      '<td>' + escapeHtml(coupon.createdAt || "-") + '</td>',
      '<td><span class="status ' + (enabled ? "enabled" : "stopped") + '">' + (enabled ? "启用" : "停发") + '</span></td>',
      '<td>' + (enabled
        ? '<button class="link-btn warn action-stop" type="button">停发</button> <button class="link-btn action-edit" type="button">修改</button>'
        : '<button class="link-btn success action-restore" type="button">恢复正常</button> <button class="link-btn action-edit" type="button">修改</button> <button class="link-btn danger action-delete" type="button">删除</button>') + '</td>'
    ].join("");
    return row;
  }

  function renderCoupons() {
    var query = (searchInput.value || "").trim().toLowerCase();
    rows.innerHTML = "";
    coupons.filter(function (coupon) {
      return !query || String(coupon.name || "").toLowerCase().indexOf(query) !== -1 || String(coupon.id || "").toLowerCase().indexOf(query) !== -1;
    }).forEach(function (coupon) {
      rows.appendChild(renderRow(coupon));
    });
    var count = document.querySelector(".pager span:last-child");
    if (count) { count.textContent = "共 " + coupons.length + " 条记录"; }
  }

  function openModal(modal) {
    if (modal) { modal.hidden = false; }
  }

  function closeModal(id) {
    var modal = document.getElementById(id);
    if (modal) { modal.hidden = true; }
  }

  function setField(id, value) {
    var field = document.getElementById(id);
    if (field) { field.value = value == null ? "" : value; }
  }

  function getField(id) {
    var field = document.getElementById(id);
    return field ? field.value.trim() : "";
  }

  function showTicketPanel(type) {
    var normalized = type === "recharge_fixed" ? "recharge-fixed" : type === "recharge_percent" ? "recharge-percent" : "percent";
    document.querySelectorAll("[data-panel]").forEach(function (panel) {
      panel.hidden = panel.getAttribute("data-panel") !== normalized;
    });
  }

  function selectedType() {
    var selected = document.querySelector("input[name='ticketType']:checked");
    return selected ? selected.value : "percent";
  }

  function setTicketType(type, locked) {
    document.querySelectorAll("input[name='ticketType']").forEach(function (radio) {
      radio.checked = radio.value === type;
      radio.disabled = !!locked;
    });
    showTicketPanel(type);
  }

  function openTicketModal(mode, coupon) {
    var form = ticketModal.querySelector(".ticket-form");
    var record = coupon || {};
    editingId = mode === "edit" ? record.id : null;
    modalTitle.textContent = mode === "edit" ? "修改票券配置" : "新增票券配置";
    form.classList.toggle("is-edit", mode === "edit");
    setField("ticketName", record.name || "");
    setField("discountValue", record.discountValue == null ? "0" : record.discountValue);
    setField("percentWagerLegacy", record.wagerMultiple || 0);
    setField("rechargeThresholdFixed", record.rechargeThreshold);
    setField("fixedBonus", record.fixedBonus);
    setField("fixedWagerMultiple", record.wagerMultiple || 0);
    setField("rechargeThresholdPercent", record.rechargeThreshold);
    setField("bonusRate", record.bonusRate);
    setField("maxBonus", record.maxBonus);
    setField("percentWagerMultiple", record.wagerMultiple || 0);
    setField("validityDays", record.validityDays > 0 ? record.validityDays : "");
    var validity = record.validityDays > 0 ? "after_claim" : "long";
    document.querySelectorAll("input[name='validity']").forEach(function (radio) {
      radio.checked = radio.value === validity;
    });
    document.querySelector("[data-valid-days]").hidden = validity !== "after_claim";
    setTicketType(record.type || "percent", mode === "edit");
    openModal(ticketModal);
  }

  function numericValue(id) {
    return Number(getField(id));
  }

  function saveCurrentTicket() {
    var type = selectedType();
    var name = getField("ticketName");
    if (!name) { window.alert("请输入票券名称。"); document.getElementById("ticketName").focus(); return; }
    var validity = document.querySelector("input[name='validity']:checked").value;
    var validityDays = validity === "after_claim" ? numericValue("validityDays") : 0;
    if (validity === "after_claim" && (!Number.isInteger(validityDays) || validityDays < 1)) {
      window.alert("领取后有效期请填写大于等于1的整数天数。"); document.getElementById("validityDays").focus(); return;
    }
    var record = {
      id: editingId || "CPN-" + Date.now(),
      name: name,
      type: type,
      enabled: true,
      validityDays: validityDays,
      wagerMultiple: type === "recharge_fixed" ? numericValue("fixedWagerMultiple") : type === "recharge_percent" ? numericValue("percentWagerMultiple") : numericValue("percentWagerLegacy"),
      distributed: 0,
      used: 0,
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 19)
    };
    if (type === "recharge_fixed") {
      record.rechargeThreshold = numericValue("rechargeThresholdFixed");
      record.fixedBonus = numericValue("fixedBonus");
      if (!(record.rechargeThreshold > 0) || !(record.fixedBonus > 0) || !(record.wagerMultiple >= 0)) {
        window.alert("请填写大于0的充值门槛和固定赠送金额，以及不小于0的打码倍数。"); return;
      }
    } else if (type === "recharge_percent") {
      record.rechargeThreshold = numericValue("rechargeThresholdPercent");
      record.bonusRate = numericValue("bonusRate");
      record.maxBonus = numericValue("maxBonus");
      if (!(record.rechargeThreshold > 0) || !(record.bonusRate > 0 && record.bonusRate <= 100) || !(record.maxBonus > 0) || !(record.wagerMultiple >= 0)) {
        window.alert("请填写有效的充值门槛、0至100之间的赠送比例、大于0的赠送上限及不小于0的打码倍数。"); return;
      }
    } else {
      record.discountValue = numericValue("discountValue");
      if (!(record.discountValue > 0) || !(record.wagerMultiple >= 0)) {
        window.alert("优惠百分比须大于0，打码倍数须大于或等于0。"); return;
      }
    }
    if (editingId) {
      var index = coupons.findIndex(function (coupon) { return coupon.id === editingId; });
      if (index < 0) { window.alert("该票券配置不存在或已删除。"); return; }
      record.enabled = coupons[index].enabled !== false;
      record.distributed = coupons[index].distributed || 0;
      record.used = coupons[index].used || 0;
      record.createdAt = coupons[index].createdAt || record.createdAt;
      coupons[index] = record;
    } else {
      coupons.unshift(record);
    }
    persistCoupons();
    renderCoupons();
    closeModal("ticketModal");
  }

  function openConfirm(message, callback) {
    confirmText.textContent = message;
    pendingAction = callback;
    openModal(confirmModal);
  }

  document.querySelector(".ticket-toolbar .primary-btn").addEventListener("click", renderCoupons);
  document.querySelector(".ticket-toolbar .plain-btn").addEventListener("click", function () {
    window.setTimeout(renderCoupons, 0);
  });
  if (searchInput) {
    searchInput.addEventListener("input", renderCoupons);
  }
  if (openCreate) {
    openCreate.addEventListener("click", function () { openTicketModal("create", null); });
  }
  if (saveTicket) { saveTicket.addEventListener("click", saveCurrentTicket); }

  document.querySelectorAll("input[name='ticketType']").forEach(function (radio) {
    radio.addEventListener("change", function () { showTicketPanel(radio.value); });
  });
  document.querySelectorAll("input[name='validity']").forEach(function (radio) {
    radio.addEventListener("change", function () {
      document.querySelector("[data-valid-days]").hidden = radio.value !== "after_claim" || !radio.checked;
    });
  });
  document.addEventListener("click", function (event) {
    var closeTarget = event.target.getAttribute("data-close");
    if (closeTarget) { closeModal(closeTarget); }
  });

  if (rows) {
    rows.addEventListener("click", function (event) {
      var row = event.target.closest("tr");
      if (!row) { return; }
      var coupon = coupons.find(function (item) { return item.id === row.dataset.id; });
      if (!coupon) { return; }
      if (event.target.classList.contains("action-edit")) {
        openTicketModal("edit", coupon);
      } else if (event.target.classList.contains("action-stop")) {
        openConfirm("操作停发后，之后会员完成任务也不会再派奖了，是否确定？", function () {
          coupon.enabled = false; persistCoupons(); renderCoupons();
        });
      } else if (event.target.classList.contains("action-restore")) {
        openConfirm("是否确认恢复正常？", function () {
          coupon.enabled = true; persistCoupons(); renderCoupons();
        });
      } else if (event.target.classList.contains("action-delete") && !coupon.enabled) {
        openConfirm("确定要移除该票券吗？移除后不可恢复。", function () {
          coupons = coupons.filter(function (item) { return item.id !== coupon.id; });
          persistCoupons(); renderCoupons();
        });
      }
    });
  }
  if (confirmOk) {
    confirmOk.addEventListener("click", function () {
      if (typeof pendingAction === "function") { pendingAction(); }
      pendingAction = null;
      closeModal("confirmModal");
    });
  }

  function initCenterTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-ticket-tab]"));
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-ticket-panel]"));
    var requestedTab = (window.location.search.match(/[?&]tab=(settings|tasks|usage)(?:&|$)/) || [])[1] || "tasks";

    function activate(name) {
      tabs.forEach(function (tab) {
        var active = tab.getAttribute("data-ticket-tab") === name;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
      });
      panels.forEach(function (panel) {
        panel.hidden = panel.getAttribute("data-ticket-panel") !== name;
      });
      var frame = document.querySelector('[data-ticket-frame="' + name + '"]');
      if (frame && !frame.getAttribute("src")) {
        var source = frame.getAttribute("data-src");
        frame.setAttribute("src", source);
      }
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        activate(tab.getAttribute("data-ticket-tab"));
      });
    });
    activate(requestedTab);
  }

  initCenterTabs();
  renderCoupons();
}());
