(function () {
  var TEMPLATE_TO_STATE = {
    "打码返水": 0,
    "拼多多": 1,
    "救济金": 2,
    "分享活动": 3
  };

  var SHARE_IMAGE_POOL = [
    "bonus_banner_01.jpg",
    "promo_banner_02.jpg",
    "jackpot_banner.jpg",
    "freeplay_bonus_03.jpg",
    "social_reward_04.jpg"
  ];

  var SHARE_ROW_PRESETS = [
    {
      title: "🎁 Claim Your Bonus",
      description: "Get your free reward now",
      image: "bonus_banner_01.jpg",
      target: "/activity/welcome-bonus"
    },
    {
      title: "🔥 Limited Time Offer",
      description: "Don't miss today's reward",
      image: "promo_banner_02.jpg",
      target: "/activity/welcome-bonus"
    },
    {
      title: "🏆 Big Win Today",
      description: "Can you beat this jackpot?",
      image: "jackpot_banner.jpg",
      target: "/activity/winner-board"
    },
    {
      title: "💎 Ready For Another Reward",
      description: "Share now and unlock your next FreePlay gift",
      image: "freeplay_bonus_03.jpg",
      target: "/activity/freeplay-daily"
    },
    {
      title: "🎉 Bonus Drop Is Live",
      description: "Tap to share and claim your social reward",
      image: "social_reward_04.jpg",
      target: "/activity/social-reward"
    }
  ];
  var panelStateCache = {};

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setText(id, text) {
    var node = document.querySelector("#" + id + "_text span");
    if (node) {
      node.textContent = text;
    }
  }

  function getPanelStates(panel) {
    if (panel.id && panelStateCache[panel.id]) {
      return panelStateCache[panel.id];
    }

    var states = Array.prototype.filter.call(panel.children, function (child) {
      return child && child.classList && child.classList.contains("panel_state");
    });

    if (panel.id) {
      panelStateCache[panel.id] = states;
    }

    return states;
  }

  function isStateVisible(state) {
    return Boolean(state) && state.style.display !== "none" && state.style.visibility !== "hidden";
  }

  function showPanelState(panelId, stateIndex) {
    var panel = document.getElementById(panelId);
    var states;
    var activeState;

    if (!panel) {
      return;
    }

    states = getPanelStates(panel);
    activeState = panel.getAttribute("data-active-state");

    if (!states.length) {
      return;
    }

    if (activeState === String(stateIndex) && isStateVisible(states[stateIndex])) {
      return;
    }

    states.forEach(function (state, index) {
      var isActive = index === stateIndex;
      var nextVisibility = isActive ? "visible" : "hidden";
      var nextDisplay = isActive ? "block" : "none";
      var nextAriaHidden = isActive ? "false" : "true";

      if (state.style.visibility !== nextVisibility) {
        state.style.visibility = nextVisibility;
      }
      if (state.style.display !== nextDisplay) {
        state.style.display = nextDisplay;
      }
      if (state.getAttribute("aria-hidden") !== nextAriaHidden) {
        state.setAttribute("aria-hidden", nextAriaHidden);
      }
    });

    panel.setAttribute("data-active-state", String(stateIndex));
  }

  function scheduleTemplateApply(apply) {
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(apply);
      return;
    }
    window.setTimeout(apply, 0);
  }

  function setTemplateState(template) {
    var state = Object.prototype.hasOwnProperty.call(TEMPLATE_TO_STATE, template) ? TEMPLATE_TO_STATE[template] : 0;
    var isRelief = template === "救济金";
    var isShare = template === "分享活动";

    document.body.classList.toggle("relief-template-active", isRelief);
    document.body.classList.toggle("share-template-active", isShare);
    showPanelState("u6", state);
  }

  function bindTemplateSelect(select) {
    var apply = function () {
      setTemplateState(select.value);
    };

    if (select.getAttribute("data-template-bound") === "true") {
      return;
    }

    select.setAttribute("data-template-bound", "true");
    select.addEventListener("change", apply);
    select.addEventListener("input", apply);

    apply();
    scheduleTemplateApply(apply);
    if (document.readyState !== "complete") {
      window.addEventListener("load", apply, { once: true });
    }
  }

  function nextReliefTierLabel(table) {
    var rows = table.querySelectorAll(".custom-relief-table-row");
    var lastEditableRow = rows.length > 1 ? rows[rows.length - 2] : null;
    var lastEditableInput = lastEditableRow ? lastEditableRow.querySelector(".custom-vip-end") : null;
    var start = lastEditableInput ? Number(lastEditableInput.value) + 1 : 1;
    return String(start || 1);
  }

  function createReliefRewardRow(table) {
    var row = document.createElement("div");
    row.className = "custom-relief-table-row";
    row.innerHTML = [
      '<span class="custom-tier">' + nextReliefTierLabel(table) + "</span>",
      '<div class="custom-vip-cell">',
      '<input class="custom-vip-end" type="number" placeholder="请输入 VIP 等级">',
      "<small></small>",
      "</div>",
      '<input class="custom-reward-input" type="number" placeholder="请输入充值百分比">',
      '<button type="button" class="custom-row-delete" aria-label="删除">删除</button>'
    ].join("");
    return row;
  }

  function formatTierLabel(start, end) {
    if (!start || !end) {
      return start ? String(start) : "";
    }
    return start === end ? String(start) : start + " - " + end;
  }

  function setVipError(row, message) {
    var messageNode = row.querySelector(".custom-vip-cell small");
    row.classList.toggle("is-error", Boolean(message));
    if (messageNode) {
      messageNode.textContent = message || "";
    }
  }

  function syncReliefTierRanges(table) {
    var rows = Array.prototype.slice.call(table.querySelectorAll(".custom-relief-table-row"));
    var expectedStart = 1;

    rows.forEach(function (row, index) {
      var input = row.querySelector(".custom-vip-end");
      var tier = row.querySelector(".custom-tier");
      var isLast = index === rows.length - 1;
      var end = input ? Number(input.value) : 0;
      var message = "";

      if (!input || !tier) {
        return;
      }

      input.min = expectedStart;
      input.max = 15;

      if (isLast) {
        input.value = "15";
        input.disabled = true;
        end = 15;
      } else {
        input.disabled = false;
        if (!input.value) {
          end = expectedStart;
          input.value = String(end);
        } else if (end < expectedStart) {
          message = "必须大于上一档";
        } else if (end >= 15) {
          end = 14;
          input.value = "14";
          message = "最后一档自动补到 15";
        }
      }

      tier.textContent = formatTierLabel(expectedStart, end);
      setVipError(row, message);
      expectedStart = end + 1;
    });
  }

  function bindReliefRewardTable(table) {
    if (!table || table.getAttribute("data-relief-bound") === "true") {
      return;
    }

    table.setAttribute("data-relief-bound", "true");
    syncReliefTierRanges(table);

    table.addEventListener("input", function (event) {
      if (event.target && event.target.classList.contains("custom-vip-end")) {
        syncReliefTierRanges(table);
      }
    });

    table.addEventListener("click", function (event) {
      var target = event.target;
      if (!target) {
        return;
      }

      if (target.classList.contains("custom-row-delete")) {
        var row = target.closest(".custom-relief-table-row");
        if (row) {
          row.parentNode.removeChild(row);
          syncReliefTierRanges(table);
        }
        return;
      }

      if (target.classList.contains("custom-add-row")) {
        var body = table.querySelector(".custom-relief-table-body");
        if (body) {
          var rows = body.querySelectorAll(".custom-relief-table-row");
          var lastRow = rows.length ? rows[rows.length - 1] : null;
          body.insertBefore(createReliefRewardRow(table), lastRow);
          syncReliefTierRanges(table);
        }
      }
    });
  }

  function setShareUploadContent(button, imageName) {
    var currentIndex = SHARE_IMAGE_POOL.indexOf(imageName);
    button.dataset.imageName = imageName;
    button.dataset.imageIndex = String(currentIndex === -1 ? 0 : currentIndex);
    button.innerHTML = [
      '<span class="custom-share-upload-name">' + escapeHtml(imageName) + "</span>",
      "<small>点击更换 OG 图片</small>"
    ].join("");
  }

  function rotateShareUpload(button) {
    var currentIndex = Number(button.dataset.imageIndex || 0);
    var nextIndex = (currentIndex + 1) % SHARE_IMAGE_POOL.length;
    setShareUploadContent(button, SHARE_IMAGE_POOL[nextIndex]);
  }

  function nextSharePreset(rowCount) {
    var presetIndex = Math.min(rowCount, SHARE_ROW_PRESETS.length - 1);
    var preset = SHARE_ROW_PRESETS[presetIndex];
    return {
      title: preset.title,
      description: preset.description,
      image: preset.image,
      target: preset.target
    };
  }

  function createShareRow(data) {
    var row = document.createElement("div");
    row.className = "custom-share-row";
    row.innerHTML = [
      '<span class="custom-share-index"></span>',
      '<input type="text" class="custom-share-title-input" value="' + escapeHtml(data.title) + '" placeholder="请输入分享标题">',
      '<textarea class="custom-share-desc-input" placeholder="请输入分享描述">' + escapeHtml(data.description) + "</textarea>",
      '<button type="button" class="custom-share-upload"></button>',
      '<input type="text" class="custom-share-target-input" value="' + escapeHtml(data.target) + '" placeholder="请输入 target_url">',
      '<button type="button" class="custom-row-delete custom-share-row-delete" aria-label="删除">删除</button>'
    ].join("");

    setShareUploadContent(row.querySelector(".custom-share-upload"), data.image);
    return row;
  }

  function syncShareTable(table) {
    var body = table.querySelector(".custom-share-table-body");
    var rows = body ? Array.prototype.slice.call(body.querySelectorAll(".custom-share-row")) : [];
    var section = table.closest(".custom-share-section");
    var addButton = section ? section.querySelector(".custom-share-add") : null;
    var countTip = table.querySelector(".custom-share-count-tip");
    var canDelete = rows.length > 3;
    var canAdd = rows.length < 5;

    rows.forEach(function (row, index) {
      var indexNode = row.querySelector(".custom-share-index");
      var deleteButton = row.querySelector(".custom-share-row-delete");
      if (indexNode) {
        indexNode.textContent = String(index + 1).padStart(2, "0");
      }
      if (deleteButton) {
        deleteButton.disabled = !canDelete;
        deleteButton.classList.toggle("is-disabled", !canDelete);
      }
    });

    if (addButton) {
      addButton.disabled = !canAdd;
    }

    if (countTip) {
      countTip.textContent = "当前 " + rows.length + " / 5 套分享素材，至少保留 3 套；点击 Share Now 时随机抽取 1 套。";
    }
  }

  function bindShareTable(table) {
    if (!table || table.getAttribute("data-share-bound") === "true") {
      return;
    }

    var section = table.closest(".custom-share-section");
    var addButton = section ? section.querySelector(".custom-share-add") : null;
    var body = table.querySelector(".custom-share-table-body");

    table.setAttribute("data-share-bound", "true");

    if (addButton) {
      addButton.addEventListener("click", function () {
        var rowCount = body ? body.querySelectorAll(".custom-share-row").length : 0;
        if (!body || rowCount >= 5) {
          return;
        }
        body.appendChild(createShareRow(nextSharePreset(rowCount)));
        syncShareTable(table);
      });
    }

    table.addEventListener("click", function (event) {
      var deleteButton = event.target.closest(".custom-share-row-delete");
      if (deleteButton) {
        if (deleteButton.disabled) {
          return;
        }
        var row = deleteButton.closest(".custom-share-row");
        if (body && row) {
          body.removeChild(row);
          syncShareTable(table);
        }
        return;
      }

      var uploadButton = event.target.closest(".custom-share-upload");
      if (uploadButton) {
        rotateShareUpload(uploadButton);
      }
    });

    syncShareTable(table);
  }

  ready(function () {
    var select = document.getElementById("u3012_input");

    setText("u3011", "活动模板");
    Array.prototype.forEach.call(document.querySelectorAll(".custom-relief-table"), bindReliefRewardTable);
    Array.prototype.forEach.call(document.querySelectorAll("[data-share-table]"), bindShareTable);

    if (select) {
      select.setAttribute("aria-label", "活动模板");
      if (!select.value) {
        select.value = "救济金";
      }
      bindTemplateSelect(select);
    }
  });
})();
