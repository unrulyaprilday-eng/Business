(function () {
  "use strict";

  var api = window.SelfGameConfig;
  if (!api) return;

  var games = [
    { code: "SLOT-1001", name: "星穹宝藏", type: "SLOTS", rtp: 96.0, updated: "2026-08-18 09:30", selected: false },
    { code: "SLOT-1002", name: "黄金矿场", type: "SLOTS", rtp: 95.0, updated: "2026-08-17 16:20", selected: false },
    { code: "FISH-2001", name: "深海猎场", type: "FISH", rtp: 95.5, updated: "2026-08-18 10:05", selected: false },
    { code: "FISH-2002", name: "极地捕鱼王", type: "FISH", rtp: 96.5, updated: "2026-08-17 14:18", selected: false },
    { code: "POK-3001", name: "极速德州", type: "Poker", rtp: 95.0, updated: "2026-08-18 08:55", selected: false },
    { code: "POK-3002", name: "短牌扑克", type: "Poker", rtp: 94.5, updated: "2026-08-17 12:30", selected: false },
    { code: "MINI-4001", name: "极速飞车", type: "Mini", rtp: 96.5, updated: "2026-08-17 17:10", selected: false },
    { code: "MINI-4002", name: "地雷宝藏", type: "Mini", rtp: 95.5, updated: "2026-08-16 15:45", selected: false }
  ];
  var batchRecords = [
    { id: "RTP-20260818-001", time: "2026-08-18 10:10", type: "FISH", count: 2, rtp: "96.5%", action: "立即生效", reason: "统一调整 FISH 运营参数" },
    { id: "RTP-20260817-003", time: "2026-08-17 16:20", type: "SLOTS", count: 1, rtp: "95.0%", action: "立即生效", reason: "测试环境参数校准" }
  ];
  var activeType = "SLOTS";
  var singleIndex = -1;

  function typeLabel(type) {
    return type === "SLOTS" ? "SLOTS" : type;
  }

  function renderRows() {
    var keyword = String(document.getElementById("rtpGameName").value || "").trim().toLowerCase();
    var visible = games.map(function (game, index) { return { game: game, index: index }; }).filter(function (item) {
      var game = item.game;
      var typeMatch = activeType === "全部" || game.type === activeType;
      var keywordMatch = !keyword || [game.name, game.code].join(" ").toLowerCase().indexOf(keyword) !== -1;
      return typeMatch && keywordMatch;
    });
    var rows = document.getElementById("rtpRows");
    if (!visible.length) {
      rows.innerHTML = "<tr class=\"empty-row\"><td colspan=\"7\">暂无符合条件的自研游戏</td></tr>";
      updateSelection();
      return;
    }
    rows.innerHTML = visible.map(function (item) {
      var game = item.game;
      return "<tr>" +
        "<td class=\"check-cell\"><input class=\"rtp-row-check\" type=\"checkbox\" data-index=\"" + item.index + "\"" + (game.selected ? " checked" : "") + "></td>" +
        "<td>" + typeLabel(game.type) + "</td>" +
        "<td>" + api.esc(game.code) + "</td>" +
        "<td>" + api.esc(game.name) + "</td>" +
        "<td class=\"number-cell\"><span class=\"self-game-rtp\">" + api.formatRtp(game.rtp) + "</span></td>" +
        "<td>" + api.esc(game.updated) + "</td>" +
        "<td><button class=\"self-game-link\" type=\"button\" data-single-index=\"" + item.index + "\">设置</button></td>" +
        "</tr>";
    }).join("");
    document.querySelectorAll(".rtp-row-check").forEach(function (checkbox) {
      checkbox.addEventListener("change", function () {
        games[Number(checkbox.getAttribute("data-index"))].selected = checkbox.checked;
        updateSelection();
      });
    });
    updateSelection();
  }

  function updateSelection() {
    var visibleBoxes = Array.prototype.slice.call(document.querySelectorAll(".rtp-row-check"));
    var selectedCount = games.filter(function (game) { return game.selected; }).length;
    var visibleSelected = visibleBoxes.filter(function (box) { return box.checked; }).length;
    var selectAll = document.getElementById("rtpSelectAll");
    selectAll.checked = visibleBoxes.length > 0 && visibleSelected === visibleBoxes.length;
    selectAll.indeterminate = visibleSelected > 0 && visibleSelected < visibleBoxes.length;
    document.getElementById("rtpSelectedCount").textContent = String(selectedCount);
  }

  function renderBatchRecords() {
    var target = document.getElementById("batchRecordRows");
    target.innerHTML = batchRecords.map(function (record) {
      return "<tr><td>" + api.esc(record.id) + "</td><td>" + api.esc(record.time) + "</td><td>" + api.esc(record.type) + "</td><td class=\"number-cell\">" + record.count + "</td><td class=\"number-cell\">" + api.esc(record.rtp) + "</td><td>" + api.esc(record.action) + "</td><td>" + api.esc(record.reason || "-") + "</td></tr>";
    }).join("");
  }

  function setBatchError(message) {
    var input = document.getElementById("batchRtp");
    var error = document.getElementById("batchRtpError");
    input.classList.toggle("self-game-input-error", !!message);
    error.textContent = message || "";
    error.hidden = !message;
  }

  function setReasonError(message) {
    var input = document.getElementById("batchReason");
    var error = document.getElementById("batchReasonError");
    input.classList.toggle("self-game-input-error", !!message);
    error.textContent = message || "";
    error.hidden = !message;
  }

  function updateBatchPreview() {
    var scope = document.getElementById("batchScope").value;
    var count;
    if (singleIndex >= 0) {
      count = 1;
    } else if (scope === "selected") {
      count = games.filter(function (game) { return game.selected && (activeType === "全部" || game.type === activeType); }).length;
    } else {
      count = games.filter(function (game) { return activeType !== "全部" && game.type === activeType; }).length;
    }
    document.getElementById("batchPreview").textContent = count ? "本次将更新 " + count + " 个自研游戏的 RTP，不会修改游戏开关、频道或展示属性。" : "当前范围没有可更新的自研游戏，请先选择游戏类型或勾选记录。";
    document.getElementById("batchApply").disabled = count === 0;
  }

  function openBatch(index) {
    singleIndex = typeof index === "number" ? index : -1;
    var scope = document.getElementById("batchScope");
    var typeLabelNode = document.getElementById("batchTypeLabel");
    var input = document.getElementById("batchRtp");
    if (singleIndex >= 0) {
      typeLabelNode.textContent = games[singleIndex].type + " / " + games[singleIndex].name;
      scope.value = "single";
      scope.disabled = true;
      input.value = games[singleIndex].rtp.toFixed(1);
    } else {
      typeLabelNode.textContent = activeType;
      scope.disabled = false;
      scope.value = "all";
      input.value = "96.0";
    }
    document.getElementById("batchReason").value = "";
    setBatchError("");
    setReasonError("");
    updateBatchPreview();
    api.setLayer(document.getElementById("batchModal"), true);
  }

  function closeBatch() {
    singleIndex = -1;
    api.setLayer(document.getElementById("batchModal"), false);
  }

  function applyBatch() {
    var parsed = api.parseRtp(document.getElementById("batchRtp").value);
    setBatchError(parsed.message);
    if (parsed.message) return;
    var reason = document.getElementById("batchReason").value.trim();
    setReasonError(reason ? "" : "请填写变更原因");
    if (!reason) return;
    var scope = document.getElementById("batchScope").value;
    var indexes = [];
    if (singleIndex >= 0) {
      indexes = [singleIndex];
    } else if (scope === "selected") {
      games.forEach(function (game, index) {
        if (game.selected && activeType !== "全部" && game.type === activeType) indexes.push(index);
      });
    } else {
      games.forEach(function (game, index) {
        if (activeType !== "全部" && game.type === activeType) indexes.push(index);
      });
    }
    if (!indexes.length) return;
    var time = api.nowText();
    indexes.forEach(function (index) {
      var game = games[index];
      game.rtp = parsed.value;
      game.updated = time;
      game.selected = false;
    });
    batchRecords.unshift({
      id: "RTP-" + time.replace(/[- :]/g, "").slice(0, 12) + "-" + String(batchRecords.length + 1).padStart(3, "0"),
      time: time,
      type: singleIndex >= 0 ? games[singleIndex].type : activeType,
      count: indexes.length,
      rtp: api.formatRtp(parsed.value),
      action: "立即生效",
      reason: reason
    });
    renderRows();
    renderBatchRecords();
    closeBatch();
    api.showToast("RTP 已批量立即生效", false);
  }

  api.ready(function () {
    document.querySelectorAll("[data-rtp-type]").forEach(function (button) {
      button.addEventListener("click", function () {
        document.querySelectorAll("[data-rtp-type]").forEach(function (item) { item.classList.remove("is-active"); });
        button.classList.add("is-active");
        activeType = button.getAttribute("data-rtp-type");
        renderRows();
      });
    });
    document.getElementById("rtpFilterForm").addEventListener("submit", function (event) { event.preventDefault(); renderRows(); });
    document.getElementById("rtpReset").addEventListener("click", function () {
      document.getElementById("rtpGameName").value = "";
      renderRows();
    });
    document.getElementById("rtpSelectAll").addEventListener("change", function (event) {
      document.querySelectorAll(".rtp-row-check").forEach(function (checkbox) {
        checkbox.checked = event.target.checked;
        games[Number(checkbox.getAttribute("data-index"))].selected = event.target.checked;
      });
      updateSelection();
    });
    document.getElementById("openBatchRtp").addEventListener("click", function () {
      if (activeType === "全部") {
        api.showToast("请先选择一个游戏类型后再批量设置 RTP", true);
        return;
      }
      openBatch();
    });
    document.getElementById("rtpRows").addEventListener("click", function (event) {
      var button = event.target.closest("[data-single-index]");
      if (button) openBatch(Number(button.getAttribute("data-single-index")));
    });
    document.getElementById("batchScope").addEventListener("change", updateBatchPreview);
    document.getElementById("batchRtp").addEventListener("input", function () { setBatchError(""); });
    document.getElementById("batchReason").addEventListener("input", function () { setReasonError(""); });
    document.getElementById("batchApply").addEventListener("click", applyBatch);
    document.querySelectorAll("[data-batch-close]").forEach(function (button) { button.addEventListener("click", closeBatch); });
    document.getElementById("batchModal").querySelector(".self-game-modal-mask").addEventListener("click", closeBatch);
    document.addEventListener("click", function (event) {
      var tab = event.target.closest("[data-self-tab]");
      if (tab) {
        var group = tab.getAttribute("data-self-tab-group");
        var target = tab.getAttribute("data-self-tab");
        document.querySelectorAll("[data-self-tab-group=\"" + group + "\"]").forEach(function (item) {
          if (item.hasAttribute("data-self-tab")) item.classList.toggle("is-active", item === tab);
          if (item.hasAttribute("data-self-tab-panel")) item.hidden = item.getAttribute("data-self-tab-panel") !== target;
        });
      }
    });
    renderRows();
    renderBatchRecords();
  });
}());
