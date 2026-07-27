(function () {
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  ready(function () {
    var templateSelect = document.getElementById("planTemplateSelect");
    function setText(id, value) {
      var element = document.getElementById(id);
      if (element) element.textContent = value;
    }
    function setValue(id, value) {
      var element = document.getElementById(id);
      if (element) element.value = value;
    }
    function executionMode(period) {
      if (period.indexOf("每月") !== -1 || period.indexOf("月末") !== -1) return "每月周期";
      if (period.indexOf("每周") !== -1) return "每周周期";
      if (period.indexOf("每日") !== -1) return "每日周期";
      if (period.indexOf("画像") !== -1) return "画像触发";
      return "事件触发";
    }
    function applyTemplate() {
      if (!templateSelect) return;
      var option = templateSelect.options[templateSelect.selectedIndex];
      if (!option) return;
      var name = option.textContent.split(" MT-")[0];
      var templateId = option.value;
      var version = option.getAttribute("data-version") || "v1";
      var stage = option.getAttribute("data-stage") || "第一期";
      var goal = option.getAttribute("data-goal") || "促活";
      var audience = option.getAttribute("data-audience") || "按模板条件筛选";
      var task = option.getAttribute("data-task") || "无";
      var activity = option.getAttribute("data-activity") || "无";
      var popup = option.getAttribute("data-popup") || "场景弹窗";
      var success = option.getAttribute("data-success") || "目标事件完成";
      var period = option.getAttribute("data-period") || "立即执行";
      var taskCost = Number(option.getAttribute("data-task-cost") || 0);
      var activityCost = Number(option.getAttribute("data-activity-cost") || 0);
      var totalCost = taskCost + activityCost;
      if (templateId === "MT-016") task = "已完成待领取任务";

      setText("configPageTitle", "配置方案：" + name);
      setText("configPageMeta", "模板 " + templateId + " " + version + " · 方案草稿 v1 · " + stage + "执行模式");
      setValue("planName", name + "-常规方案");
      setValue("planGoal", goal);
      setValue("planDescription", "面向" + audience + "，按模板组合" + [task, activity, popup].filter(function (item) { return item !== "无"; }).join("、") + "；以" + success + "作为成功或退出口径。");
      setText("templateStageLabel", stage + "可用");
      setText("templateAudience", audience);
      setText("templateTask", task);
      setText("templateActivity", activity);
      setText("templatePopup", popup);
      setText("templateSuccess", success);

      var savedAudience = document.getElementById("savedAudience");
      if (savedAudience && savedAudience.options.length) savedAudience.options[0].textContent = audience;
      setValue("fixedCondition", audience + " AND 账号状态=正常 AND 不在排除名单");
      setValue("executionMode", executionMode(period));
      setValue("executionTime", period);

      var taskRow = document.getElementById("taskResourceRow");
      var activityRow = document.getElementById("activityResourceRow");
      if (taskRow) taskRow.hidden = task === "无";
      if (activityRow) activityRow.hidden = activity === "无";
      setText("taskResourceName", task);
      setText("activityResourceName", activity);
      setText("popupResourceName", popup);
      setText("taskResourceRule", taskCost ? "按任务原生条件推进；单人预计成本 " + taskCost + " EvUSD" : "按任务原生条件推进，不新增奖励");
      setText("activityResourceRule", activityCost ? "按活动原生规则参与；单人最高成本 " + activityCost + " EvUSD" : "沿用活动原生资格与权益，不新增奖励");

      var taskCostNode = document.querySelector("[data-task-cost]");
      var activityCostNode = document.querySelector("[data-activity-cost]");
      var totalCostNode = document.querySelector("[data-total-cost]");
      if (taskCostNode) {
        taskCostNode.setAttribute("data-base-cost", String(taskCost));
        taskCostNode.textContent = String(taskCost);
      }
      if (activityCostNode) {
        activityCostNode.setAttribute("data-base-cost", String(activityCost));
        activityCostNode.textContent = String(activityCost);
      }
      if (totalCostNode) totalCostNode.textContent = String(totalCost);
      var costItems = document.querySelectorAll(".im-cost-item strong");
      if (costItems[3]) costItems[3].textContent = (totalCost * 1024).toLocaleString("en-US");

      var rewardRadios = document.querySelectorAll('input[name="rewardPolicy"]');
      Array.prototype.forEach.call(rewardRadios, function (radio) {
        radio.disabled = (radio.value === "task" && task === "无") || (radio.value === "activity" && activity === "无") || (radio.value === "stack" && (task === "无" || activity === "无"));
        radio.checked = false;
      });
      var defaultPolicy = task !== "无" && activity !== "无" ? "stack" : (task !== "无" ? "task" : "activity");
      var defaultRadio = document.querySelector('input[name="rewardPolicy"][value="' + defaultPolicy + '"]');
      if (defaultRadio) defaultRadio.checked = true;
      var rewardOptions = document.querySelectorAll(".im-reward-option small");
      var rewardTitles = document.querySelectorAll(".im-reward-option strong");
      if (rewardTitles[0]) rewardTitles[0].textContent = task === "无" ? "不使用任务" : (taskCost ? "仅任务奖励" : "任务不新增奖励");
      if (rewardTitles[1]) rewardTitles[1].textContent = activity === "无" ? "不使用活动" : (activityCost ? "仅活动奖励" : "活动不新增奖励");
      if (rewardTitles[2]) rewardTitles[2].textContent = "任务与活动叠加";
      if (rewardOptions[0]) rewardOptions[0].textContent = task === "无" ? "该模板不使用任务资源。" : task + "按任务系统原生规则结算，单人预计 " + taskCost + " EvUSD。";
      if (rewardOptions[1]) rewardOptions[1].textContent = activity === "无" ? "该模板不使用活动资源。" : activity + "按活动系统原生规则结算，单人最高 " + activityCost + " EvUSD。";
      if (rewardOptions[2]) rewardOptions[2].textContent = task !== "无" && activity !== "无" ? "任务与活动分别结算、分别记账，单人最高 " + totalCost + " EvUSD。" : "当前模板没有同时使用任务和活动，不能选择叠加奖励。";
      var stackWarning = document.querySelector("[data-stack-warning]");
      if (stackWarning) {
        stackWarning.hidden = defaultPolicy !== "stack";
        stackWarning.textContent = "已选择叠加奖励。任务和活动将分别发奖、分别记账；单人最高 " + totalCost + " EvUSD，发布时需要二次确认预计成本。";
      }

      var checkItems = document.querySelectorAll('[data-wizard-panel="5"] .im-status-line span');
      if (checkItems[1]) checkItems[1].hidden = task === "无";
      if (checkItems[2]) checkItems[2].hidden = activity === "无";
      if (checkItems[4]) checkItems[4].hidden = task === "无" || activity === "无";
      var timelineItems = document.querySelectorAll('[data-wizard-panel="5"] .im-timeline-item');
      if (timelineItems[0]) {
        timelineItems[0].querySelector("strong").textContent = period + "计算/接收人群";
        timelineItems[0].querySelector("span").textContent = "按模板条件筛选" + audience + "，合并固定名单并应用排除名单。";
      }
      if (timelineItems[1]) {
        timelineItems[1].querySelector("strong").textContent = "绑定模板允许的营销资源";
        timelineItems[1].querySelector("span").textContent = [task, activity].filter(function (item) { return item !== "无"; }).join("；") + "，发布时固定资源版本。";
      }
      if (timelineItems[2]) timelineItems[2].querySelector("span").textContent = popup + "仅在同时满足方案资格和弹窗自身规则时展示。";
      if (timelineItems[3]) {
        timelineItems[3].querySelector("strong").textContent = success;
        timelineItems[3].querySelector("span").textContent = "记录成功事件，分别汇总任务与活动奖励，并停止后续触达。";
      }
      var summaryValues = document.querySelectorAll('[data-wizard-panel="5"] aside dl dd');
      if (summaryValues[0]) summaryValues[0].textContent = name + " " + version;
      if (summaryValues[1]) summaryValues[1].textContent = period;
      if (summaryValues[3]) summaryValues[3].textContent = totalCost === 0 ? "不新增奖励" : (defaultPolicy === "stack" ? "任务与活动叠加" : (defaultPolicy === "task" ? "仅任务奖励" : "仅活动奖励"));
      if (summaryValues[4]) summaryValues[4].textContent = totalCost + " EvUSD";
      var publishNotice = document.querySelector('[data-cl-modal="publishConfirmModal"] .im-notice');
      var publishNote = document.querySelector('[data-cl-modal="publishConfirmModal"] textarea');
      if (publishNotice) publishNotice.textContent = "当前模板单人最高预计成本 " + totalCost + " EvUSD，本批按1,024人估算最高 " + (totalCost * 1024).toLocaleString("en-US") + " EvUSD；任务与活动奖励按所选策略分别结算和记账。";
      if (publishNote) publishNote.value = name + "常规方案，模板 " + templateId + " " + version + "，资源版本在发布时固定。";
    }
    if (templateSelect) {
      var queryTemplate = new URLSearchParams(window.location.search).get("template");
      if (queryTemplate && templateSelect.querySelector('option[value="' + queryTemplate + '"]')) templateSelect.value = queryTemplate;
      templateSelect.addEventListener("change", applyTemplate);
      applyTemplate();
    }

    var previewButton = document.getElementById("refreshAudiencePreview");
    var previewValue = document.getElementById("audiencePreviewValue");
    var previewTime = document.getElementById("audiencePreviewTime");
    if (previewButton && previewValue && previewTime) {
      previewButton.addEventListener("click", function () {
        previewValue.textContent = "947";
        previewTime.textContent = "刚刚更新";
      });
    }
    var publish = document.getElementById("submitStrategyReview");
    if (publish) {
      publish.addEventListener("click", function () {
        var modal = document.querySelector('[data-cl-modal="publishConfirmModal"]');
        if (modal) modal.hidden = false;
      });
    }
  });
})();
