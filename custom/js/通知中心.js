(function () {
  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  onReady(function () {
    var tabButtons = Array.prototype.slice.call(document.querySelectorAll(".tab-button"));
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-panel]"));
    var autoModal = document.getElementById("autoEditModal");
    var detailModal = document.getElementById("recordDetailModal");
    var rateLimitModal = document.getElementById("rateLimitModal");
    var autoTitleInput = document.getElementById("autoTitleInput");
    var autoContentInput = document.getElementById("autoContentInput");
    var autoPageInput = document.getElementById("autoPageInput");
    var autoTimeInput = document.getElementById("autoTimeInput");
    var saveAutoEdit = document.getElementById("saveAutoEdit");
    var rateLimitButton = document.getElementById("rateLimitButton");
    var rateLimitCount = document.getElementById("rateLimitCount");
    var rateStartTime = document.getElementById("rateStartTime");
    var rateEndTime = document.getElementById("rateEndTime");
    var saveRateLimit = document.getElementById("saveRateLimit");
    var linkPickers = Array.prototype.slice.call(document.querySelectorAll("[data-link-picker]"));
    var editingRow = null;
    var detailFields = [
      { label: "通知标题", index: 0 },
      { label: "文本内容", index: 10 },
      { label: "跳转目标", index: 11 },
      { label: "来源类型", index: 1 },
      { label: "发送对象", index: 2 },
      { label: "发送时间", index: 3 },
      { label: "发送人数", index: 4 },
      { label: "成功数", index: 5 },
      { label: "失败数", index: 6 },
      { label: "点击人数", index: 7 },
      { label: "点击率", index: 8 },
      { label: "状态", index: 9 }
    ];

    function activateTab(name) {
      tabButtons.forEach(function (button) {
        button.classList.toggle("is-active", button.getAttribute("data-tab") === name);
      });
      panels.forEach(function (panel) {
        var active = panel.getAttribute("data-panel") === name;
        panel.classList.toggle("is-active", active);
        panel.hidden = !active;
      });
    }

    tabButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        activateTab(button.getAttribute("data-tab"));
      });
    });

    document.addEventListener("click", function (event) {
      var switchButton = event.target.closest(".switch");
      if (switchButton) {
        var nextState = switchButton.getAttribute("aria-checked") !== "true";
        switchButton.setAttribute("aria-checked", nextState ? "true" : "false");
        switchButton.classList.toggle("is-on", nextState);
        var label = switchButton.querySelector("span");
        if (label) {
          label.textContent = nextState ? "启用" : "停用";
        }
      }
    });

    function closeModal(modal) {
      if (modal) {
        modal.hidden = true;
      }
      editingRow = null;
    }

    function bindClose(modal) {
      if (!modal) {
        return;
      }
      modal.addEventListener("click", function (event) {
        if (event.target.hasAttribute("data-close-modal")) {
          closeModal(modal);
        }
      });
    }

    function syncLinkPicker(picker) {
      if (!picker) {
        return;
      }
      var select = picker.querySelector("[data-link-select]");
      var input = picker.querySelector("[data-link-input]");
      if (!select || !input) {
        return;
      }
      var matchedOption = Array.prototype.slice.call(select.options).some(function (option) {
        return option.value && option.value === input.value;
      });
      select.value = matchedOption ? input.value : "";
    }

    function syncAllLinkPickers() {
      linkPickers.forEach(syncLinkPicker);
    }

    linkPickers.forEach(function (picker) {
      var select = picker.querySelector("[data-link-select]");
      var input = picker.querySelector("[data-link-input]");
      if (select && input) {
        select.addEventListener("change", function () {
          if (select.value) {
            input.value = select.value;
            input.dispatchEvent(new Event("input", { bubbles: true }));
          }
          syncLinkPicker(picker);
          input.focus();
        });
      }
      if (input) {
        input.addEventListener("input", function () {
          syncLinkPicker(picker);
        });
        input.addEventListener("change", function () {
          syncLinkPicker(picker);
        });
      }
      syncLinkPicker(picker);
    });

    bindClose(autoModal);
    bindClose(detailModal);
    bindClose(rateLimitModal);

    function updateRateLimitSummary() {
      if (!rateLimitButton) {
        return;
      }
      var count = rateLimitCount && Number(rateLimitCount.value) > 0 ? rateLimitCount.value : "1";
      var start = rateStartTime && rateStartTime.value ? rateStartTime.value : "10:00";
      var end = rateEndTime && rateEndTime.value ? rateEndTime.value : "21:00";
      rateLimitButton.title = "每个用户每天最多 " + count + " 条；当地 " + start + "-" + end + " 发送";
    }

    if (rateLimitButton && rateLimitModal) {
      rateLimitButton.addEventListener("click", function () {
        updateRateLimitSummary();
        rateLimitModal.hidden = false;
      });
    }

    if (saveRateLimit) {
      saveRateLimit.addEventListener("click", function () {
        if (rateLimitCount && Number(rateLimitCount.value) < 1) {
          rateLimitCount.value = "1";
        }
        updateRateLimitSummary();
        closeModal(rateLimitModal);
      });
    }

    document.addEventListener("click", function (event) {
      var editButton = event.target.closest("[data-edit-auto]");
      if (!editButton || !autoModal) {
        return;
      }
      editingRow = editButton.closest("tr");
      if (!editingRow || !autoTitleInput || !autoContentInput || !autoPageInput || !autoTimeInput) {
        return;
      }
      autoTitleInput.value = editingRow.getAttribute("data-title") || "";
      autoContentInput.value = editingRow.getAttribute("data-content") || "";
      autoPageInput.value = editingRow.getAttribute("data-page") || "/activity";
      autoTimeInput.value = editingRow.getAttribute("data-time") || "";
      syncAllLinkPickers();
      autoModal.hidden = false;
    });

    if (saveAutoEdit) {
      saveAutoEdit.addEventListener("click", function () {
        if (!editingRow) {
          return;
        }
        var title = autoTitleInput ? autoTitleInput.value : "";
        var content = autoContentInput ? autoContentInput.value : "";
        var page = autoPageInput ? autoPageInput.value : "";
        editingRow.setAttribute("data-title", title);
        editingRow.setAttribute("data-content", content);
        editingRow.setAttribute("data-page", page);
        var titleCell = editingRow.querySelector(".auto-title");
        var pageCell = editingRow.querySelector(".auto-page");
        if (titleCell) {
          titleCell.textContent = title;
        }
        if (pageCell) {
          pageCell.textContent = page;
        }
        closeModal(autoModal);
      });
    }

    var targetRadios = Array.prototype.slice.call(document.querySelectorAll("input[name='sendTarget']"));
    var targetPanels = Array.prototype.slice.call(document.querySelectorAll("[data-target-panel]"));
    var noticeTitle = document.getElementById("noticeTitle");
    var noticeContent = document.getElementById("noticeContent");
    var noticePage = document.getElementById("noticePage");
    var playerIds = document.getElementById("playerIds");
    var groupScene = document.getElementById("groupScene");
    var previewTitle = document.getElementById("previewTitle");
    var previewContent = document.getElementById("previewContent");
    var previewPage = document.getElementById("previewPage");
    var previewTarget = document.getElementById("previewTarget");
    var multiSelect = document.getElementById("gamePreferenceSelect");
    var sendNoticeButton = document.getElementById("sendNoticeButton");
    var recordTableBody = document.getElementById("recordTableBody");
    var groupTargetRuleNote = document.getElementById("groupTargetRuleNote");

    function selectedTarget() {
      var selected = targetRadios.find(function (radio) {
        return radio.checked;
      });
      return selected ? selected.value : "players";
    }

    function selectedGames() {
      if (!multiSelect) {
        return [];
      }
      return Array.prototype.slice.call(multiSelect.querySelectorAll("input[type='checkbox']:checked:not([data-any-game])")).map(function (input) {
        return input.value;
      });
    }

    function isGamePreferenceUnlimited() {
      if (!multiSelect) {
        return true;
      }
      var anyGame = multiSelect.querySelector("[data-any-game]");
      return Boolean(anyGame && anyGame.checked) || selectedGames().length === 0;
    }

    function normalizeGamePreference(changedInput) {
      if (!multiSelect) {
        return;
      }
      var anyGame = multiSelect.querySelector("[data-any-game]");
      var gameInputs = Array.prototype.slice.call(multiSelect.querySelectorAll("input[type='checkbox']:not([data-any-game])"));
      if (changedInput && changedInput.hasAttribute("data-any-game") && changedInput.checked) {
        gameInputs.forEach(function (input) {
          input.checked = false;
        });
      }
      if (changedInput && !changedInput.hasAttribute("data-any-game") && changedInput.checked && anyGame) {
        anyGame.checked = false;
      }
      var hasGameSelected = gameInputs.some(function (input) {
        return input.checked;
      });
      if (!hasGameSelected && anyGame) {
        anyGame.checked = true;
      }
    }

    function updateMultiLabel() {
      if (!multiSelect) {
        return;
      }
      var trigger = multiSelect.querySelector(".multi-trigger");
      if (!trigger) {
        return;
      }
      var games = selectedGames();
      trigger.textContent = isGamePreferenceUnlimited() ? "不限游戏偏好" : games.join("、");
    }

    function isGroupTargetInvalid() {
      return selectedTarget() === "group" && groupScene && !groupScene.value && isGamePreferenceUnlimited();
    }

    function updateSendAvailability() {
      var invalid = isGroupTargetInvalid();
      if (sendNoticeButton) {
        sendNoticeButton.disabled = invalid;
        sendNoticeButton.title = invalid ? "场景和游戏偏好不能同时不限；如需全量发送，请选择全部玩家。" : "";
      }
      if (groupTargetRuleNote) {
        groupTargetRuleNote.classList.toggle("is-warning", invalid);
      }
    }

    function updateTargetPanels() {
      var target = selectedTarget();
      targetRadios.forEach(function (radio) {
        var label = radio.closest("label");
        if (label) {
          label.classList.toggle("is-selected", radio.value === target);
        }
      });
      targetPanels.forEach(function (panel) {
        panel.hidden = panel.getAttribute("data-target-panel") !== target;
      });
      updateSendAvailability();
      updatePreview();
    }

    function countPlayerIds() {
      if (!playerIds) {
        return 0;
      }
      return playerIds.value.split(/[\s,，;；]+/).filter(Boolean).length;
    }

    function targetText() {
      var target = selectedTarget();
      if (target === "players") {
        return "玩家ID：" + countPlayerIds() + "人";
      }
      if (target === "group") {
        if (isGroupTargetInvalid()) {
          return "指定玩家群体：请至少限制一个维度";
        }
        return (groupScene && groupScene.value ? groupScene.value : "不限场景") + " / " + (isGamePreferenceUnlimited() ? "不限游戏偏好" : selectedGames().join("、"));
      }
      return "全部玩家";
    }

    function updatePreview() {
      if (previewTitle && noticeTitle) {
        previewTitle.textContent = noticeTitle.value || "未填写标题";
      }
      if (previewContent && noticeContent) {
        previewContent.textContent = noticeContent.value || "未填写内容";
      }
      if (previewPage && noticePage) {
        previewPage.textContent = noticePage.value;
      }
      if (previewTarget) {
        previewTarget.textContent = targetText();
      }
      updateSendAvailability();
    }

    targetRadios.forEach(function (radio) {
      radio.addEventListener("change", updateTargetPanels);
    });

    [noticeTitle, noticeContent, noticePage, playerIds, groupScene].forEach(function (element) {
      if (element) {
        element.addEventListener("input", updatePreview);
        element.addEventListener("change", updatePreview);
      }
    });

    if (multiSelect) {
      var trigger = multiSelect.querySelector(".multi-trigger");
      var menu = multiSelect.querySelector(".multi-menu");
      if (trigger && menu) {
        trigger.addEventListener("click", function () {
          var expanded = trigger.getAttribute("aria-expanded") === "true";
          trigger.setAttribute("aria-expanded", expanded ? "false" : "true");
          menu.hidden = expanded;
        });
        menu.addEventListener("change", function (event) {
          normalizeGamePreference(event.target);
          updateMultiLabel();
          updatePreview();
        });
        document.addEventListener("click", function (event) {
          if (!multiSelect.contains(event.target)) {
            trigger.setAttribute("aria-expanded", "false");
            menu.hidden = true;
          }
        });
      }
    }

    function currentSendTimeText() {
      var selected = document.querySelector("input[name='sendTimeType']:checked");
      if (selected && selected.value === "定时") {
        var scheduleTime = document.getElementById("scheduleTime");
        return scheduleTime && scheduleTime.value ? scheduleTime.value.replace("T", " ") : "定时";
      }
      return "立即";
    }

    if (sendNoticeButton && recordTableBody) {
      sendNoticeButton.addEventListener("click", function () {
        if (isGroupTargetInvalid()) {
          updateSendAvailability();
          return;
        }
        var title = noticeTitle && noticeTitle.value ? noticeTitle.value : "未命名通知";
        var content = noticeContent && noticeContent.value ? noticeContent.value : "";
        var link = noticePage && noticePage.value ? noticePage.value : "";
        var target = targetText();
        var total = selectedTarget() === "players" ? countPlayerIds() : selectedTarget() === "group" ? 8420 : 36580;
        var timeText = currentSendTimeText();
        var detail = [title, "通知发送", target, timeText, total, 0, 0, 0, "0.00%", "等待发送", content, link].join("|");
        var row = document.createElement("tr");
        row.setAttribute("data-detail", detail);
        row.innerHTML = [
          "<td>" + escapeHtml(title) + "</td>",
          "<td>通知发送</td>",
          "<td>" + escapeHtml(target) + "</td>",
          "<td>" + escapeHtml(timeText) + "</td>",
          "<td>" + total.toLocaleString() + "</td>",
          "<td>0</td>",
          "<td>0</td>",
          "<td>0</td>",
          "<td>0.00%</td>",
          "<td><span class=\"status pending\">等待发送</span></td>",
          "<td><button class=\"link-button\" type=\"button\" data-view-detail>详情</button></td>"
        ].join("");
        recordTableBody.insertBefore(row, recordTableBody.firstChild);
        activateTab("sendRecords");
      });
    }

    document.addEventListener("click", function (event) {
      var detailButton = event.target.closest("[data-view-detail]");
      if (!detailButton || !detailModal) {
        return;
      }
      var row = detailButton.closest("tr");
      var detailList = document.getElementById("recordDetailList");
      if (!row || !detailList) {
        return;
      }
      var values = (row.getAttribute("data-detail") || "").split("|");
      detailList.innerHTML = detailFields.map(function (field) {
        return "<div><dt>" + escapeHtml(field.label) + "</dt><dd>" + escapeHtml(values[field.index] || "-") + "</dd></div>";
      }).join("");
      detailModal.hidden = false;
    });

    updateRateLimitSummary();
    updateMultiLabel();
    updateTargetPanels();
    updatePreview();
  });
}());
