(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
      return;
    }
    fn();
  }

  ready(function () {
    var rows = [
      { name: "测试003", template: "首页", status: "正常开启" },
      { name: "测试站点03", template: "首页", status: "正常开启" },
      { name: "测试站点2", template: "测试站点 模板", status: "正常开启" },
      { name: "测试站点", template: "首页", status: "正常开启" }
    ];
    var siteModal = document.querySelector("[data-modal='site']");
    var templateModal = document.querySelector("[data-modal='template']");
    var userIdModal = document.querySelector("[data-modal='user-id']");
    var title = document.getElementById("siteModalTitle");
    var siteName = document.getElementById("siteNameInput");
    var siteStatus = document.getElementById("siteStatusSelect");
    var minUserIdInput = document.getElementById("minUserIdInput");
    var statusRow = document.querySelector(".status-row");
    var modeRow = document.querySelector(".create-mode-row");
    var copyRow = document.querySelector(".copy-site-row");
    var templateText = document.getElementById("selectedTemplateText");
    var selectedTemplate = "首页";

    if (!siteModal || !templateModal || !userIdModal || !title || !siteName || !siteStatus || !templateText || !minUserIdInput) {
      return;
    }

    function openModal(modal) {
      modal.hidden = false;
    }

    function closeModal(modal) {
      modal.hidden = true;
    }

    function setTemplateText(value, muted) {
      templateText.classList.toggle("has-value", !muted);
      templateText.innerHTML = muted ? "暂未选择" : "已选择模板： <a href=\"模板管理.html\">" + value + "</a>";
    }

    function openCreate() {
      title.textContent = "创建站点";
      siteName.value = "";
      siteStatus.value = "正常开启";
      selectedTemplate = "";
      setTemplateText("", true);
      modeRow.hidden = false;
      statusRow.hidden = true;
      copyRow.hidden = true;
      var direct = document.querySelector("input[name='createMode'][value='direct']");
      if (direct) {
        direct.checked = true;
      }
      openModal(siteModal);
    }

    function openEdit(index) {
      var row = rows[index] || rows[0];
      title.textContent = "编辑站点";
      siteName.value = row.name;
      siteStatus.value = row.status;
      selectedTemplate = row.template || "首页";
      setTemplateText(selectedTemplate, false);
      modeRow.hidden = true;
      copyRow.hidden = true;
      statusRow.hidden = false;
      openModal(siteModal);
    }

    var createBtn = document.getElementById("createSiteBtn");
    if (createBtn) {
      createBtn.addEventListener("click", openCreate);
    }

    Array.prototype.forEach.call(document.querySelectorAll("[data-edit-site]"), function (btn) {
      btn.addEventListener("click", function () {
        openEdit(Number(btn.getAttribute("data-edit-site")));
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-close-modal]"), function (btn) {
      btn.addEventListener("click", function () {
        closeModal(siteModal);
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-close-template]"), function (btn) {
      btn.addEventListener("click", function () {
        closeModal(templateModal);
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-user-id]"), function (btn) {
      btn.addEventListener("click", function () {
        minUserIdInput.value = btn.getAttribute("data-user-id") || "1000";
        openModal(userIdModal);
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-close-user-id]"), function (btn) {
      btn.addEventListener("click", function () {
        closeModal(userIdModal);
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-step-user-id]"), function (btn) {
      btn.addEventListener("click", function () {
        var direction = btn.getAttribute("data-step-user-id") === "up" ? 1 : -1;
        var value = Number(minUserIdInput.value || 1000) + direction;
        minUserIdInput.value = Math.max(0, value);
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll("input[name='createMode']"), function (radio) {
      radio.addEventListener("change", function () {
        copyRow.hidden = radio.value !== "copy" || !radio.checked;
      });
    });

    var pickTemplateBtn = document.getElementById("pickTemplateBtn");
    if (pickTemplateBtn) {
      pickTemplateBtn.addEventListener("click", function () {
        openModal(templateModal);
      });
    }

    Array.prototype.forEach.call(document.querySelectorAll(".template-card"), function (card) {
      card.addEventListener("click", function () {
        Array.prototype.forEach.call(document.querySelectorAll(".template-card"), function (item) {
          item.classList.remove("is-selected");
        });
        card.classList.add("is-selected");
        selectedTemplate = card.getAttribute("data-template") || "首页";
      });
    });

    var confirmTemplate = document.getElementById("confirmTemplateBtn");
    if (confirmTemplate) {
      confirmTemplate.addEventListener("click", function () {
        setTemplateText(selectedTemplate || "首页", false);
        closeModal(templateModal);
      });
    }

    var resetBtn = document.getElementById("resetBtn");
    var statusFilter = document.getElementById("statusFilter");
    if (resetBtn && statusFilter) {
      resetBtn.addEventListener("click", function () {
        statusFilter.value = "";
      });
    }
  });
})();
