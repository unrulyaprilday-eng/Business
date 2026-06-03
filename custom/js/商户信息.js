(function() {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
      return;
    }
    fn();
  }

  function setTab(tabName) {
    var tabs = document.querySelectorAll(".merchant-info-page .tab");
    var panels = document.querySelectorAll(".merchant-info-page .tab-panel");
    var found = false;
    tabs.forEach(function(tab) {
      var active = tab.getAttribute("data-tab") === tabName;
      tab.classList.toggle("active", active);
      if (active) {
        found = true;
      }
    });
    panels.forEach(function(panel) {
      panel.classList.toggle("active", panel.getAttribute("data-panel") === tabName);
    });
    if (found && window.history && window.history.replaceState) {
      window.history.replaceState(null, "", "#tab=" + tabName);
    }
  }

  function currentTabFromUrl() {
    var hash = window.location.hash || "";
    var query = window.location.search || "";
    var match = (hash + "&" + query).match(/tab=([a-z]+)/);
    return match ? match[1] : "basic";
  }

  ready(function() {
    var page = document.querySelector(".merchant-info-page");
    if (!page) {
      return;
    }

    page.querySelectorAll(".tab").forEach(function(tab) {
      tab.addEventListener("click", function() {
        setTab(tab.getAttribute("data-tab"));
      });
    });
    setTab(currentTabFromUrl());

    var modal = page.querySelector("[data-whitelist-modal]");
    var modalTitle = page.querySelector("#whitelist-title");
    var ipInput = page.querySelector("#whitelist-ip");
    var remarkInput = page.querySelector("#whitelist-remark");
    var tableBody = page.querySelector(".whitelist-table tbody");
    var editingRow = null;

    function openModal(row) {
      if (!modal || !ipInput || !remarkInput) {
        return;
      }
      editingRow = row || null;
      modalTitle.textContent = editingRow ? "编辑白名单" : "添加白名单";
      ipInput.value = editingRow ? editingRow.children[0].textContent : "";
      remarkInput.value = editingRow ? editingRow.children[1].textContent : "";
      modal.hidden = false;
      ipInput.focus();
    }

    function closeModal() {
      if (modal) {
        modal.hidden = true;
      }
      editingRow = null;
    }

    var addBtn = page.querySelector("[data-open-whitelist]");
    if (addBtn) {
      addBtn.addEventListener("click", function() {
        openModal(null);
      });
    }

    page.querySelectorAll("[data-close-modal]").forEach(function(btn) {
      btn.addEventListener("click", closeModal);
    });

    if (tableBody) {
      tableBody.addEventListener("click", function(event) {
        var edit = event.target.closest("[data-edit-whitelist]");
        var del = event.target.closest("[data-delete-whitelist]");
        var row = event.target.closest("tr");
        if (!row || row.getAttribute("data-source") !== "merchant") {
          return;
        }
        if (edit) {
          openModal(row);
        }
        if (del) {
          row.remove();
        }
      });
    }

    var saveBtn = page.querySelector("[data-save-whitelist]");
    if (saveBtn && tableBody) {
      saveBtn.addEventListener("click", function() {
        var ip = (ipInput.value || "").trim();
        var remark = (remarkInput.value || "").trim();
        if (!ip) {
          ipInput.focus();
          return;
        }
        if (editingRow) {
          editingRow.children[0].textContent = ip;
          editingRow.children[1].textContent = remark || "-";
        } else {
          var row = document.createElement("tr");
          row.setAttribute("data-source", "merchant");
          row.innerHTML = "<td></td><td></td><td>2026-06-03 12:00:00</td><td><button class=\"link-btn\" type=\"button\" data-edit-whitelist>编辑</button><button class=\"link-btn danger\" type=\"button\" data-delete-whitelist>删除</button></td>";
          row.children[0].textContent = ip;
          row.children[1].textContent = remark || "-";
          tableBody.appendChild(row);
        }
        closeModal();
      });
    }

    var rateForm = page.querySelector("[data-rate-filter]");
    var typeFilter = page.querySelector("#game-type-filter");
    var vendorFilter = page.querySelector("#game-vendor-filter");
    var rateRows = page.querySelectorAll(".rate-table tbody tr");

    function filterRates() {
      var type = typeFilter ? typeFilter.value : "";
      var vendor = vendorFilter ? vendorFilter.value : "";
      rateRows.forEach(function(row) {
        var visible = (!type || row.getAttribute("data-type") === type) && (!vendor || row.getAttribute("data-vendor") === vendor);
        row.hidden = !visible;
      });
    }

    var searchBtn = page.querySelector("[data-rate-search]");
    if (searchBtn) {
      searchBtn.addEventListener("click", filterRates);
    }
    if (rateForm) {
      rateForm.addEventListener("reset", function() {
        window.setTimeout(filterRates, 0);
      });
    }
  });
})();
