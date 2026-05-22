(function () {
  var activeTab = "frontend";
  var bindingRow = null;

  var data = {
    frontend: [
      {
        cdn: "CF",
        domain: "test3.gbsoft8686.com",
        site: "",
        status: "已停用",
        enabled: false,
        operator: "white",
        time: "2026-05-13T13:39:48..."
      },
      {
        cdn: "CF",
        domain: "test2.gbsoft8686.com",
        site: "",
        status: "已停用",
        enabled: false,
        operator: "white",
        time: "2026-05-13T13:39:48..."
      },
      {
        cdn: "CF",
        domain: "test1.gbsoft8686.com",
        site: "(102)测试站点2",
        status: "正常使用",
        enabled: true,
        operator: "white",
        time: "2026-05-13T18:36:32..."
      },
      {
        cdn: "CF",
        domain: "cloud222w.jyowhite.cc",
        site: "",
        status: "已停用",
        enabled: false,
        operator: "white",
        time: "2026-05-13T13:32:50..."
      },
      {
        cdn: "CF",
        domain: "cloud22w.jyowhite.cc",
        site: "",
        status: "已停用",
        enabled: false,
        operator: "white",
        time: "2026-05-13T13:32:29..."
      },
      {
        cdn: "CF",
        domain: "www.jyowhite.cc",
        site: "(101)测试站点",
        status: "正常使用",
        enabled: true,
        operator: "white",
        time: "2026-05-13T13:56:59..."
      },
      {
        cdn: "CF",
        domain: "jyowhite.cc",
        site: "(101)测试站点",
        status: "正常使用",
        enabled: true,
        operator: "white",
        time: "2026-02-24T16:00:24..."
      }
    ],
    backend: [
      {
        cdn: "CF",
        domain: "admin.jyowhite.cc",
        site: "(101)测试站点",
        status: "正常使用",
        enabled: true,
        operator: "white",
        time: "2026-05-13T14:08:21..."
      },
      {
        cdn: "CF",
        domain: "bo-test.gbsoft8686.com",
        site: "",
        status: "已停用",
        enabled: false,
        operator: "white",
        time: "2026-05-13T13:47:06..."
      },
      {
        cdn: "CF",
        domain: "manage.jyowhite.cc",
        site: "(102)测试站点2",
        status: "正常使用",
        enabled: true,
        operator: "white",
        time: "2026-04-28T19:22:10..."
      }
    ],
    promotion: [
      {
        cdn: "CF",
        domain: "uiguaranwda.jyowhite.cc",
        site: "(101)测试站点",
        template: "1123",
        status: "正常使用",
        enabled: true,
        operator: "white",
        time: "2026-05-13T15:11:1..."
      }
    ]
  };

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function nsCell() {
    return "<div class=\"ns-lines\">"
      + "<span><span>jocelyn.ns.cloudflare.com</span><i class=\"copy-icon\">□</i></span>"
      + "<span><span>zeus.ns.cloudflare.com</span><i class=\"copy-icon\">□</i></span>"
      + "</div><span class=\"success\">验证通过</span>";
  }

  function siteCell(row, index) {
    if (!row.site) {
      return "<button class=\"link-btn\" data-bind=\"" + index + "\" type=\"button\">绑定站点</button>";
    }
    return "<span class=\"cell-line\"><span>" + escapeHtml(row.site) + "</span><button class=\"link-btn\" data-bind=\"" + index + "\" type=\"button\">修改</button></span>";
  }

  function actionsCell(row, index) {
    var statusAction = row.enabled ? "停用" : "启用";
    return "<div class=\"action-stack\">"
      + "<button class=\"link-btn\" data-toggle=\"" + index + "\" type=\"button\">" + statusAction + "</button>"
      + "<button class=\"link-btn danger-link\" type=\"button\">删除</button>"
      + "</div>";
  }

  function rowHtml(row, index, isPromotion) {
    var statusClass = row.enabled ? "success" : "warning";
    var cells = [
      "<td>" + escapeHtml(row.cdn) + "</td>",
      "<td class=\"domain-cell\"><span class=\"cell-line\"><span>" + escapeHtml(row.domain) + "</span><i class=\"copy-icon\">□</i></span></td>",
      "<td>" + nsCell() + "</td>",
      "<td>" + siteCell(row, index) + "</td>"
    ];
    if (isPromotion) {
      cells.push("<td><span class=\"cell-line\"><span>" + escapeHtml(row.template || "") + "</span><button class=\"link-btn\" data-template=\"" + index + "\" type=\"button\">修改</button></span></td>");
    }
    cells = cells.concat([
      "<td class=\"" + statusClass + "\">" + escapeHtml(row.status) + "</td>",
      "<td></td>",
      "<td>" + escapeHtml(row.operator) + "</td>",
      "<td>" + escapeHtml(row.time) + "</td>",
      "<td>" + actionsCell(row, index) + "</td>"
    ]);
    return "<tr>" + cells.join("") + "</tr>";
  }

  function renderTable(tab) {
    var panel = document.querySelector("[data-panel='" + tab + "']");
    var tbody = panel.querySelector("tbody");
    var rows = data[tab] || [];
    var isPromotion = tab === "promotion";
    if (!rows.length) {
      tbody.innerHTML = "<tr class=\"empty-row\"><td colspan=\"9\">暂无数据</td></tr>";
    } else {
      tbody.innerHTML = rows.map(function (row, index) {
        return rowHtml(row, index, isPromotion);
      }).join("");
    }
    document.querySelector(".total-count").textContent = "共 " + rows.length + " 条记录";
  }

  function setActiveTab(tab) {
    activeTab = tab;
    Array.prototype.forEach.call(document.querySelectorAll(".tab-btn"), function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-tab") === tab);
    });
    Array.prototype.forEach.call(document.querySelectorAll(".table-view"), function (panel) {
      panel.classList.toggle("is-active", panel.getAttribute("data-panel") === tab);
    });
    document.getElementById("addModalTitle").textContent = tab === "backend" ? "新增后台域名" : (tab === "promotion" ? "新增推广域名" : "新增前台域名");
    renderTable(tab);
  }

  function openModal(name) {
    document.querySelector("[data-modal='" + name + "']").classList.remove("is-hidden");
  }

  function closeModals() {
    Array.prototype.forEach.call(document.querySelectorAll(".modal-mask"), function (modal) {
      modal.classList.add("is-hidden");
    });
  }

  function openBind(index) {
    bindingRow = data[activeTab][index];
    var select = document.getElementById("bindSiteSelect");
    var hint = document.getElementById("bindStatusHint");
    select.value = "";
    select.disabled = bindingRow.enabled;
    document.getElementById("confirmBind").disabled = bindingRow.enabled;
    hint.textContent = bindingRow.enabled ? "当前域名启用中，必须先停用域名后才能修改绑定站点。" : "";
    openModal("bind");
  }

  function confirmBind() {
    var select = document.getElementById("bindSiteSelect");
    if (bindingRow && !bindingRow.enabled && select.value) {
      bindingRow.site = select.value;
      renderTable(activeTab);
      closeModals();
    }
  }

  function toggleStatus(index) {
    var row = data[activeTab][index];
    row.enabled = !row.enabled;
    row.status = row.enabled ? "正常使用" : "已停用";
    renderTable(activeTab);
  }

  function editTemplate(index) {
    var row = data.promotion[index];
    row.template = row.template === "1123" ? "落地页模板A" : "1123";
    renderTable("promotion");
  }

  document.addEventListener("click", function (event) {
    var target = event.target;
    var tab = target.getAttribute("data-tab");
    var bindIndex = target.getAttribute("data-bind");
    var toggleIndex = target.getAttribute("data-toggle");
    var templateIndex = target.getAttribute("data-template");
    if (tab) setActiveTab(tab);
    if (target.hasAttribute("data-open-add")) openModal("add");
    if (target.hasAttribute("data-close") || target.classList.contains("modal-mask")) closeModals();
    if (bindIndex !== null) openBind(Number(bindIndex));
    if (toggleIndex !== null) toggleStatus(Number(toggleIndex));
    if (templateIndex !== null) editTemplate(Number(templateIndex));
  });

  document.getElementById("confirmBind").addEventListener("click", confirmBind);
  renderTable(activeTab);
})();
