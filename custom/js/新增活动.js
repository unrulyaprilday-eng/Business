(function () {
  var templateToPanelState = {
    "打码返水": 0,
    "救济金": 2,
    "拼多多": 1
  };

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function setText(id, text) {
    var node = document.querySelector("#" + id + "_text span");
    if (node) {
      node.textContent = text;
    }
  }

  function showPanelState(panelId, stateIndex) {
    var panel = document.getElementById(panelId);
    if (!panel) {
      return;
    }

    var stateNumber = stateIndex + 1;
    if (window.$ax && typeof window.$ax === "function") {
      try {
        window.$ax("#" + panelId).SetPanelState(stateNumber, {
          animateIn: { easingType: "none" },
          animateOut: { easingType: "none" }
        }, null, false);
      } catch (error) {
        // Fall through to direct DOM state switching if Axure is not ready yet.
      }
    }

    Array.prototype.forEach.call(panel.querySelectorAll(":scope > .panel_state"), function (state, index) {
      var isActive = index === stateIndex;
      state.style.visibility = isActive ? "visible" : "hidden";
      state.style.display = isActive ? "block" : "none";
    });
  }

  function setTemplateState(template) {
    var state = templateToPanelState.hasOwnProperty(template) ? templateToPanelState[template] : 0;
    document.body.classList.toggle("relief-template-active", template === "救济金");
    showPanelState("u6", state);
  }

  function bindTemplateSelect(select) {
    var apply = function () {
      setTemplateState(select.value);
    };

    select.addEventListener("change", apply);
    select.addEventListener("input", apply);

    var lastValue = select.value;
    window.setInterval(function () {
      if (select.value !== lastValue) {
        lastValue = select.value;
        apply();
      }
    }, 200);

    apply();
    window.setTimeout(apply, 0);
    window.setTimeout(apply, 300);
    window.setTimeout(apply, 1000);
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
      '<span class="custom-tier">' + nextReliefTierLabel(table) + '</span>',
      '<div class="custom-vip-cell">',
      '<input class="custom-vip-end" type="number" placeholder="请输入VIP等级">',
      '<small></small>',
      '</div>',
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
          message = "最后一档自动补到15";
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

  ready(function () {
    var select = document.getElementById("u3012_input");
    setText("u3011", "活动模板");

    Array.prototype.forEach.call(document.querySelectorAll(".custom-relief-table"), bindReliefRewardTable);

    if (select) {
      select.setAttribute("aria-label", "活动模板");
      if (!select.value) {
        select.value = "救济金";
      }
      bindTemplateSelect(select);
    }
  });
})();
