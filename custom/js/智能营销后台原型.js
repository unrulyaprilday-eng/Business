(function () {
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    var notice = document.querySelector("[data-demo-notice]");
    var noticeTimer;
    function showNotice(message) {
      if (!notice) return;
      notice.textContent = message;
      notice.hidden = false;
      clearTimeout(noticeTimer);
      noticeTimer = setTimeout(function () { notice.hidden = true; }, 1800);
    }

    Array.prototype.forEach.call(document.querySelectorAll("[data-demo-status]"), function (button) {
      button.addEventListener("click", function () {
        var row = button.closest("tr");
        var status = row ? row.querySelector("[data-demo-status-label]") : null;
        var on = button.getAttribute("data-demo-status") !== "on";
        button.setAttribute("data-demo-status", on ? "on" : "off");
        button.classList.toggle("is-on", on);
        button.setAttribute("aria-label", on ? "停用" : "启用");
        if (status) {
          status.textContent = on ? "运行中" : "已暂停";
          status.className = on ? "cl-status cl-status-success" : "cl-status cl-status-muted";
        }
        showNotice(on ? "已恢复运行" : "已暂停运行");
      });
    });

    document.addEventListener("click", function (event) {
      var edit = event.target.closest("[data-demo-edit-title]");
      if (edit) {
        var title = document.querySelector(edit.getAttribute("data-demo-edit-title"));
        if (title) title.textContent = edit.getAttribute("data-demo-edit-text") || "编辑配置";
      }

      var remove = event.target.closest("[data-remove-condition]");
      if (remove) {
        var item = remove.closest(".im-rule-row");
        var list = item ? item.parentNode : null;
        if (item && list && list.querySelectorAll(".im-rule-row").length > 1) item.remove();
        else showNotice("至少保留一个条件");
      }

      var copy = event.target.closest("[data-demo-copy]");
      if (copy) {
        var oldText = copy.textContent;
        copy.textContent = "已复制";
        showNotice("已生成副本草稿");
        setTimeout(function () { copy.textContent = oldText; }, 1200);
      }
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-add-condition]"), function (button) {
      button.addEventListener("click", function () {
        var list = document.querySelector(button.getAttribute("data-add-condition"));
        if (!list) return;
        var row = document.createElement("div");
        row.className = "im-rule-row";
        row.innerHTML = '<select class="cl-select"><option>AND</option><option>OR</option></select>' +
          '<select class="cl-select"><option>事件名称</option><option>会员属性</option><option>画像分数</option></select>' +
          '<select class="cl-select"><option>等于</option><option>大于等于</option><option>未发生</option></select>' +
          '<input class="cl-input" value="page_view"/>' +
          '<button class="im-icon-btn" type="button" data-remove-condition aria-label="删除条件">×</button>';
        list.appendChild(row);
        showNotice("已新增条件");
      });
    });

    var wizard = document.querySelector("[data-demo-wizard]");
    if (wizard) {
      var current = 1;
      var max = wizard.querySelectorAll("[data-wizard-step]").length;
      function showStep(step) {
        current = Math.max(1, Math.min(max, step));
        Array.prototype.forEach.call(wizard.querySelectorAll("[data-wizard-step]"), function (item) {
          var value = Number(item.getAttribute("data-wizard-step"));
          item.classList.toggle("is-active", value === current);
          item.classList.toggle("is-done", value < current);
        });
        Array.prototype.forEach.call(document.querySelectorAll("[data-wizard-panel]"), function (panel) {
          panel.hidden = Number(panel.getAttribute("data-wizard-panel")) !== current;
        });
      }
      Array.prototype.forEach.call(wizard.querySelectorAll("[data-wizard-step]"), function (item) {
        item.addEventListener("click", function () { showStep(Number(item.getAttribute("data-wizard-step"))); });
      });
      Array.prototype.forEach.call(document.querySelectorAll("[data-wizard-go]"), function (button) {
        button.addEventListener("click", function () { showStep(Number(button.getAttribute("data-wizard-go"))); });
      });
      showStep(1);
    }

    Array.prototype.forEach.call(document.querySelectorAll("[data-demo-period]"), function (button) {
      button.addEventListener("click", function () {
        var group = button.parentNode;
        Array.prototype.forEach.call(group.querySelectorAll("[data-demo-period]"), function (item) {
          item.classList.toggle("cl-btn-primary", item === button);
        });
        showNotice("统计周期已切换为" + button.textContent);
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-demo-notify]"), function (button) {
      button.addEventListener("click", function () { showNotice(button.getAttribute("data-demo-notify")); });
    });

    Array.prototype.forEach.call(document.querySelectorAll('input[name="rewardPolicy"]'), function (radio) {
      radio.addEventListener("change", function () {
        var policy = radio.value;
        var taskCost = document.querySelector("[data-task-cost]");
        var activityCost = document.querySelector("[data-activity-cost]");
        var totalCost = document.querySelector("[data-total-cost]");
        var warning = document.querySelector("[data-stack-warning]");
        var taskBase = taskCost ? Number(taskCost.getAttribute("data-base-cost") || taskCost.textContent || 0) : 0;
        var activityBase = activityCost ? Number(activityCost.getAttribute("data-base-cost") || activityCost.textContent || 0) : 0;
        if (taskCost) taskCost.textContent = policy === "activity" ? "0" : String(taskBase);
        if (activityCost) activityCost.textContent = policy === "task" ? "0" : String(activityBase);
        if (totalCost) totalCost.textContent = String(policy === "stack" ? taskBase + activityBase : (policy === "task" ? taskBase : activityBase));
        if (warning) warning.hidden = policy !== "stack";
        showNotice("奖励策略已切换为" + radio.closest("label").querySelector("strong").textContent);
      });
    });

    var templateRows = Array.prototype.slice.call(document.querySelectorAll("[data-template-row]"));
    var templateVisibleCount = document.getElementById("templateVisibleCount");
    function applyTemplateFilters() {
      if (!templateRows.length) return;
      var keyword = (document.getElementById("templateKeyword") || {}).value || "";
      var category = (document.getElementById("templateCategory") || {}).value || "";
      var period = (document.getElementById("templatePeriod") || {}).value || "";
      var visible = 0;
      templateRows.forEach(function (row) {
        var matched = (!keyword || row.textContent.toLowerCase().indexOf(keyword.toLowerCase()) !== -1) &&
          (!category || row.getAttribute("data-category") === category) &&
          (!period || row.getAttribute("data-period") === period);
        row.hidden = !matched;
        if (matched) visible += 1;
      });
      if (templateVisibleCount) templateVisibleCount.textContent = "共 " + visible + " 个模板";
      showNotice(visible ? "已找到 " + visible + " 个模板" : "没有符合条件的模板");
    }
    var templateQuery = document.getElementById("templateQuery");
    var templateReset = document.getElementById("templateReset");
    if (templateQuery) templateQuery.addEventListener("click", applyTemplateFilters);
    if (templateReset) {
      templateReset.addEventListener("click", function () {
        setTimeout(applyTemplateFilters, 0);
      });
    }

    var activeTemplateVersion;
    function setTemplateModal(row) {
      var title = document.getElementById("templateModalTitle");
      var name = document.getElementById("templateName");
      var lifecycle = document.getElementById("templateLifecycle");
      var goal = document.getElementById("templateGoal");
      var execution = document.getElementById("templateExecution");
      var reward = document.getElementById("templateReward");
      var description = document.getElementById("templateDescription");
      if (!name || !lifecycle || !goal || !execution || !reward || !description) return;
      if (!row) {
        activeTemplateVersion = null;
        if (title) title.textContent = "新建营销模板";
        name.value = "";
        lifecycle.value = "新手建立";
        goal.value = "";
        execution.value = "立即/单次";
        reward.value = "仅任务奖励";
        description.value = "";
        return;
      }
      var cells = row.querySelectorAll("td");
      var nameNode = cells[0] ? cells[0].querySelector("strong") : null;
      var templateName = nameNode ? nameNode.textContent : "营销模板";
      activeTemplateVersion = row.querySelector("[data-template-version]");
      if (title) title.textContent = "编辑模板：" + templateName;
      name.value = templateName;
      lifecycle.value = row.getAttribute("data-category") || "新手建立";
      goal.value = row.getAttribute("data-goal") || "";
      execution.value = row.getAttribute("data-period") || "立即/单次";
      var rewardText = cells[4] ? cells[4].textContent.trim() : "按方案选择";
      if (rewardText === "任务奖励") rewardText = "仅任务奖励";
      else if (rewardText === "仅原活动奖励") rewardText = "仅活动奖励";
      else if (rewardText.indexOf("不新增") !== -1) rewardText = "不新增奖励";
      else if (rewardText.indexOf("任务/活动") !== -1 || rewardText.indexOf("叠加") !== -1 || rewardText.indexOf("可配置") !== -1 || rewardText.indexOf("按旅程节点") !== -1) rewardText = "按方案选择";
      reward.value = rewardText;
      if (!Array.prototype.some.call(reward.options, function (option) { return option.value === reward.value; })) reward.value = "按方案选择";
      description.value = "适用于" + lifecycle.value + "生命周期，默认" + (cells[2] ? cells[2].textContent.trim() : "按条件入组") + "；资源结构为" + (cells[3] ? cells[3].textContent.trim() : "按方案选择") + "。";
    }
    Array.prototype.forEach.call(document.querySelectorAll("[data-template-edit]"), function (button) {
      button.addEventListener("click", function () { setTemplateModal(button.closest("tr")); });
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-template-create]"), function (button) {
      button.addEventListener("click", function () { setTemplateModal(null); });
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-template-publish]"), function (button) {
      button.addEventListener("click", function () {
        var nextVersion = "v1";
        if (activeTemplateVersion) {
          nextVersion = "v" + (Number(activeTemplateVersion.textContent.replace("v", "")) + 1);
          activeTemplateVersion.textContent = nextVersion;
        }
        showNotice("模板 " + nextVersion + " 已发布，运行中方案继续使用原版本");
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-ai-apply]"), function (button) {
      button.addEventListener("click", function () {
        button.textContent = "已加入候选";
        button.disabled = true;
        showNotice("策略建议已加入待审核队列");
      });
    });
  });
})();
