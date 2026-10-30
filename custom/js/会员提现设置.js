(function () {
  function initWithdrawSettings() {
  if (!document.querySelector(".withdraw-page") || !document.querySelector("#withdrawRows")) return;
  var currentTab = "online";
  var currentEdit = null;
  var savedVipFreeCounts = Array.prototype.map.call(document.querySelectorAll("[data-vip-free-level]"), function (input) {
    return input.value;
  });
  var pendingVipFreeCounts = savedVipFreeCounts.slice();

  var data = {
    online: [
      { sort: 14, method: "chime", icon: "chime", enabled: true, limit: "50 - 10000", min: 50, max: 10000, rate: 5, fixed: 5, minFee: 10, remark: "" },
      { sort: 0, method: "paypal", icon: "", enabled: false, limit: "-", min: 0, max: 0, rate: 0, fixed: 0, minFee: 0, remark: "" },
      { sort: 0, method: "card", icon: "", enabled: false, limit: "-", min: 0, max: 0, rate: 0, fixed: 0, minFee: 0, remark: "" },
      { sort: 0, method: "ach", icon: "", enabled: false, limit: "-", min: 0, max: 0, rate: 0, fixed: 0, minFee: 0, remark: "" },
      { sort: 0, method: "pix", icon: "", enabled: false, limit: "-", min: 0, max: 0, rate: 0, fixed: 0, minFee: 0, remark: "" },
      { sort: 0, method: "ecashapp", icon: "ecashapp", enabled: true, limit: "50 - 100000", min: 50, max: 100000, rate: 8, fixed: 8, minFee: 16, remark: "" }
    ],
    usdt: [
      { sort: 15, method: "trc20", icon: "trc20", enabled: true, limit: "50 - 20000", min: 50, max: 20000, rate: 5, fixed: 0, minFee: 5, remark: "" }
    ]
  };

  var vipColumnsA = ["VIP1", "VIP2", "VIP3", "VIP4", "VIP5", "VIP6"];
  var vipColumnsB = ["VIP9", "VIP10", "VIP11", "VIP12", "VIP13", "VIP14", "VIP15"];
  var vipRows = [
    ["每日提款次数限制", "开", 1, 2, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 4],
    ["每日提款总额限额", "开", 10, 100, 50, 100, 150, 200, 500, 600, 800, 1000, 1500, 2000, 5000],
    ["提款总次数限制", "关", 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ["提款总额限额", "关", 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ["每日免手续费交易笔数", "开", 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 12, 13, 14],
    ["单次提现最小额度", "开", 100, 100, 100, 100, 100, 100, 100, 100, 100, 10, 100, 100, 10],
    ["单次提现最大额度", "开", 500, 500, 500, 500, 500, 500, 500, 500, 500, 5000, 500, 500, 50000]
  ];

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function iconHtml(row, large) {
    if (!row.icon) return '<span class="dash">-</span>';
    var text = row.icon === "chime" ? "ecashapp" : row.icon === "ecashapp" ? "⇪" : "T";
    return '<span class="pay-icon ' + row.icon + (large ? " large" : "") + '">' + text + "</span>";
  }

  function renderRows() {
    var rows = data[currentTab];
    $("#withdrawRows").innerHTML = rows.map(function (row, index) {
      return [
        "<tr>",
        "<td>" + row.sort + "</td>",
        "<td>" + row.method + "</td>",
        "<td>" + iconHtml(row) + "</td>",
        '<td class="' + (row.enabled ? "enabled" : "disabled") + '">' + (row.enabled ? "已开通" : "未开通") + "</td>",
        '<td class="' + (row.limit === "-" ? "dash" : "") + '">' + row.limit + "</td>",
        "<td>" + row.rate + "</td>",
        "<td>" + row.fixed + "</td>",
        "<td>" + row.minFee + "</td>",
        "<td>" + (row.remark || "") + "</td>",
        '<td><button class="link" data-edit="' + index + '" type="button">修改</button></td>',
        "</tr>"
      ].join("");
    }).join("");

    $("#pager").innerHTML = currentTab === "usdt"
      ? '<span class="page-arrows">|‹ ‹ › ›|</span><span class="page-box">1</span><span>/1</span><span class="page-size">20条/页⌄</span><span>共 1 条记录</span>'
      : "";

    $all("[data-edit]").forEach(function (button) {
      button.addEventListener("click", function () {
        openEdit(rows[Number(button.getAttribute("data-edit"))]);
      });
    });
  }

  function openModal(name) {
    if (name === "vip-free") {
      openVipFreeModal();
      return;
    }
    var modal = $('[data-modal="' + name + '"]');
    if (name === "params" && modal && modal.classList.contains("is-hidden")) {
      pendingVipFreeCounts = savedVipFreeCounts.slice();
    }
    if (modal) modal.classList.remove("is-hidden");
  }

  function closeModal(modal) {
    if (!modal) return;
    if (modal.getAttribute("data-modal") === "vip-free") {
      closeVipFreeModal();
      return;
    }
    if (modal.getAttribute("data-modal") === "params") {
      closeVipFreeModal();
      pendingVipFreeCounts = savedVipFreeCounts.slice();
    }
    modal.classList.add("is-hidden");
  }

  function openVipFreeModal() {
    var mask = $('[data-modal="vip-free"]');
    var parent = $('[data-modal="params"]');
    if (!mask || !parent || parent.classList.contains("is-hidden")) return;
    $all("[data-vip-free-level]").forEach(function (input, index) {
      input.value = pendingVipFreeCounts[index];
      input.removeAttribute("aria-invalid");
    });
    $("#vipFreeError").hidden = true;
    mask.hidden = false;
    $(".params-modal").inert = true;
    $(".vip-free-table-wrap").scrollTop = 0;
    $("#vipFree0").focus();
  }

  function closeVipFreeModal() {
    var mask = $('[data-modal="vip-free"]');
    if (!mask || mask.hidden) return;
    mask.hidden = true;
    $(".params-modal").inert = false;
    $("#vipFreeTrigger").focus();
  }

  function bindVipFreeModal() {
    var form = $("#vipFreeForm");
    if (!form) return;
    $all("[data-close-vip-free]").forEach(function (button) {
      button.addEventListener("click", closeVipFreeModal);
    });
    form.addEventListener("input", function (event) {
      event.target.removeAttribute("aria-invalid");
      $("#vipFreeError").hidden = true;
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var inputs = $all("[data-vip-free-level]", form);
      var invalid = inputs.find(function (input) {
        var value = input.value.trim();
        return input.validity.badInput || !/^\d+$/.test(value) || !Number.isSafeInteger(Number(value));
      });
      if (invalid) {
        var error = $("#vipFreeError");
        error.textContent = "VIP" + invalid.getAttribute("data-vip-free-level") + " 每周提现次数不能为空，请填写有效的非负整数。";
        error.hidden = false;
        invalid.setAttribute("aria-invalid", "true");
        invalid.focus();
        return;
      }
      pendingVipFreeCounts = inputs.map(function (input) {
        return String(Number(input.value));
      });
      closeVipFreeModal();
    });
    $("#submitWithdrawParams").addEventListener("click", function () {
      savedVipFreeCounts = pendingVipFreeCounts.slice();
      closeModal($('[data-modal="params"]'));
    });
    document.addEventListener("keydown", function (event) {
      if ($('[data-modal="vip-free"]').hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeVipFreeModal();
      } else if (event.key === "Tab") {
        var controls = $all("button, input", form);
        var first = controls[0];
        var last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  function openEdit(row) {
    currentEdit = row;
    $("#editMethod").value = row.method;
    $("#editRate").value = row.rate;
    $("#editFixed").value = row.fixed;
    $("#editMinFee").value = row.minFee;
    $("#editEnabled").checked = row.enabled;
    $("#editMinLimit").value = row.min || "";
    $("#editMaxLimit").value = row.max || "";
    $("#editSort").value = row.sort;
    $("#editRemark").value = row.remark || "";
    $("#editIconPreview").className = "pay-icon large " + (row.icon || "ecashapp");
    $("#editIconPreview").textContent = row.icon === "chime" ? "ecashapp" : row.icon === "trc20" ? "T" : "⇪";
    openModal("edit");
  }

  function renderVipChecks() {
    $all(".check-grid").forEach(function (grid) {
      var count = Number(grid.getAttribute("data-count")) || 15;
      var selected = grid.classList.contains("selected");
      grid.innerHTML = Array.from({ length: count }, function (_, index) {
        var vip = index + 1;
        var checked = selected && vip <= 4 ? " checked" : "";
        return '<label><input type="checkbox"' + checked + "/> VIP" + vip + "</label>";
      }).join("");
    });
  }

  function renderVipTable(columns, offset, includeSwitch) {
    var head = "<thead><tr><th>配置</th>" + (includeSwitch ? "<th>开关</th>" : "") + columns.map(function (item) {
      return "<th>" + item + "</th>";
    }).join("") + "</tr></thead>";
    var body = "<tbody>" + vipRows.map(function (row) {
      var cells = "<td>" + row[0] + "</td>";
      if (includeSwitch) cells += '<td><span class="mini-switch ' + (row[1] === "开" ? "on" : "") + '">' + row[1] + "</span></td>";
      cells += columns.map(function (_, columnIndex) {
        return "<td>" + row[offset + columnIndex] + "</td>";
      }).join("");
      return "<tr>" + cells + "</tr>";
    }).join("") + "</tbody>";
    $("#vipTable").innerHTML = head + body;
  }

  function bindRuleMode() {
    var tabs = $all('input[name="withdrawRuleMode"]');
    tabs.forEach(function (input) {
      input.addEventListener("change", function () {
        $all(".mode-option").forEach(function (option) {
          option.classList.toggle("is-active", option.contains(input) && input.checked);
        });
        $all("[data-rule-panel]").forEach(function (panel) {
          panel.classList.toggle("is-hidden", panel.getAttribute("data-rule-panel") !== input.value);
        });
      });
    });
  }

  function bindWithdrawReview() {
    var radios = $all('input[name="withdrawReview"]');
    var config = $("[data-review-config]");
    if (!radios.length || !config) return;

    function syncReviewConfig() {
      var enabled = radios.some(function (input) {
        return input.checked && input.value === "enabled";
      });
      config.hidden = !enabled;
    }

    radios.forEach(function (input) {
      input.addEventListener("change", syncReviewConfig);
    });
    syncReviewConfig();
  }

  function bindEvents() {
    $all("[data-tab]").forEach(function (button) {
      button.addEventListener("click", function () {
        currentTab = button.getAttribute("data-tab");
        $all("[data-tab]").forEach(function (item) { item.classList.remove("is-active"); });
        button.classList.add("is-active");
        renderRows();
      });
    });

    $all("[data-open-modal]").forEach(function (button) {
      button.addEventListener("click", function () {
        openModal(button.getAttribute("data-open-modal"));
      });
    });

    $all("[data-close], .modal-mask").forEach(function (item) {
      item.addEventListener("click", function (event) {
        if (event.target === item || event.target.hasAttribute("data-close")) closeModal(item.closest(".modal-mask"));
      });
    });

    $(".edit-vip").addEventListener("click", function () {
      var showingA = $("#vipTable").textContent.indexOf("VIP1") > -1;
      renderVipTable(showingA ? vipColumnsB : vipColumnsA, showingA ? 8 : 2, !showingA);
    });

    bindRuleMode();
    bindWithdrawReview();
    bindVipFreeModal();
  }

  renderVipChecks();
  renderVipTable(vipColumnsA, 2, true);
  bindEvents();
  renderRows();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWithdrawSettings);
  } else {
    initWithdrawSettings();
  }
})();
