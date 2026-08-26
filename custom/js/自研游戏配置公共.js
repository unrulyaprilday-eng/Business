(function (global) {
  "use strict";

  var RTP_MIN = 50;
  var RTP_MAX = 200;
  var RTP_STEP = 0.1;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatRtp(value) {
    var number = Number(value);
    return isFinite(number) ? number.toFixed(1) + "%" : "-";
  }

  function parseRtp(value) {
    var raw = String(value == null ? "" : value).trim();
    if (!raw) return { value: null, message: "请输入 RTP" };
    if (!/^\d+(?:\.\d{1})?$/.test(raw)) {
      return { value: null, message: "RTP 只能填写整数或小数点后 1 位" };
    }
    var number = Number(raw);
    if (!isFinite(number) || number < RTP_MIN || number > RTP_MAX) {
      return { value: null, message: "RTP 范围为 50.0%～200.0%" };
    }
    var scaled = Math.round(number * 10);
    if (Math.abs(scaled / 10 - number) > 0.000001 || scaled % 1 !== 0) {
      return { value: null, message: "RTP 最小步长为 0.1%" };
    }
    return { value: scaled / 10, message: "" };
  }

  function nowText() {
    var date = new Date();
    var pad = function (value) { return String(value).padStart(2, "0"); };
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + " " + pad(date.getHours()) + ":" + pad(date.getMinutes());
  }

  function showToast(message, isError) {
    var toast = document.querySelector(".self-game-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "self-game-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.toggle("is-error", !!isError);
    toast.hidden = false;
    window.clearTimeout(toast._timer);
    toast._timer = window.setTimeout(function () {
      toast.hidden = true;
    }, 2600);
  }

  function setLayer(layer, open) {
    if (!layer) return;
    layer.hidden = !open;
    document.body.classList.toggle("self-game-modal-open", open);
  }

  function switchTab(button) {
    var group = button.getAttribute("data-self-tab-group") || "";
    var target = button.getAttribute("data-self-tab") || "";
    document.querySelectorAll("[data-self-tab-group=\"" + group + "\"]").forEach(function (item) {
      if (item.hasAttribute("data-self-tab")) {
        item.classList.toggle("is-active", item === button);
      } else if (item.hasAttribute("data-self-tab-panel")) {
        item.hidden = item.getAttribute("data-self-tab-panel") !== target;
      }
    });
  }

  function renderRecordRows(target, records) {
    if (!target) return;
    if (!records.length) {
      target.innerHTML = "<tr class=\"empty-row\"><td colspan=\"5\">暂无变更记录</td></tr>";
      return;
    }
    target.innerHTML = records.map(function (record) {
      return "<tr>" +
        "<td>" + esc(record.time) + "</td>" +
        "<td>" + esc(record.game) + "</td>" +
        "<td>" + esc(record.action) + "</td>" +
        "<td>" + esc(record.before || "-") + " → " + esc(record.after || "-") + "</td>" +
        "<td>" + esc(record.operator || "运营管理员") + "</td>" +
        "</tr>";
    }).join("");
  }

  function initTypePage(options) {
    ready(function () {
      var games = (options.games || []).map(function (game) {
        return Object.assign({
          updated: "2026-08-18 09:30",
          records: []
        }, game);
      });
      var records = [];
      games.forEach(function (game) {
        records = records.concat(game.records || []);
      });
      records.sort(function (a, b) { return String(b.time).localeCompare(String(a.time)); });

      var nameFilter = document.getElementById("typeGameName");
      var rows = document.getElementById("typeRows");
      var form = document.getElementById("typeFilterForm");
      var modal = document.getElementById("configModal");
      var configTitle = document.getElementById("configTitle");
      var configGameName = document.getElementById("configGameName");
      var configGameCode = document.getElementById("configGameCode");
      var configCapability = document.getElementById("configCapability");
      var configRtp = document.getElementById("configRtp");
      var configRtpError = document.getElementById("configRtpError");
      var configFields = document.getElementById("configFields");
      var configError = document.getElementById("configModalError");
      var recordRows = document.getElementById("recordRows");
      var editingIndex = -1;

      var configMeta = document.querySelector("#configModal .self-game-modal-meta");
      if (configMeta) {
        configMeta.className = "self-game-modal-entity";
        var configBody = document.querySelector("#configModal .self-game-modal-body");
        if (configBody) configBody.insertBefore(configMeta, configBody.firstChild);
      }

      function filteredGames() {
        var keyword = String(nameFilter && nameFilter.value || "").trim().toLowerCase();
        return games.map(function (game, index) {
          return { game: game, index: index };
        }).filter(function (item) {
          var game = item.game;
          var matchesKeyword = !keyword || [game.name, game.code].join(" ").toLowerCase().indexOf(keyword) !== -1;
          return matchesKeyword;
        });
      }

      function renderRows() {
        var visible = filteredGames();
        if (!visible.length) {
          rows.innerHTML = "<tr class=\"empty-row\"><td colspan=\"6\">暂无符合条件的自研游戏</td></tr>";
          return;
        }
        rows.innerHTML = visible.map(function (item) {
          var game = item.game;
          return "<tr>" +
            "<td>" + esc(game.code) + "</td>" +
            "<td>" + esc(game.name) + "</td>" +
            "<td>" + (options.renderSummary ? options.renderSummary(game) : "-") + "</td>" +
            "<td class=\"number-cell\"><span class=\"self-game-rtp\">" + formatRtp(game.rtp) + "</span></td>" +
            "<td>" + esc(game.updated) + "</td>" +
            "<td><button class=\"self-game-link\" type=\"button\" data-config-index=\"" + item.index + "\">配置</button></td>" +
            "</tr>";
        }).join("");
      }

      function renderRecords() {
        renderRecordRows(recordRows, records);
      }

      function setRtpError(message) {
        if (!configRtpError) return;
        configRtpError.textContent = message || "";
        configRtpError.hidden = !message;
        if (configRtp) configRtp.classList.toggle("self-game-input-error", !!message);
      }

      function openConfig(index) {
        var game = games[index];
        if (!game) return;
        editingIndex = index;
        configTitle.textContent = options.title;
        configGameName.textContent = game.name;
        configGameCode.textContent = game.code;
        configCapability.innerHTML = options.renderCapability ? options.renderCapability(game) : "<span>基础能力由游戏服务提供</span>";
        configRtp.value = Number(game.rtp).toFixed(1);
        setRtpError("");
        configError.hidden = true;
        configError.textContent = "";
        configFields.innerHTML = options.renderFields ? options.renderFields(game) : "";
        setLayer(modal, true);
      }

      function closeConfig() {
        editingIndex = -1;
        setLayer(modal, false);
      }

      function saveConfig() {
        if (editingIndex < 0) return;
        var game = games[editingIndex];
        var parsed = parseRtp(configRtp.value);
        setRtpError(parsed.message);
        if (parsed.message) return;
        if (options.validateFields) {
          parsed.message = options.validateFields(configFields, game) || "";
        }
        if (parsed.message) {
          configError.textContent = parsed.message;
          configError.hidden = false;
        }
        if (parsed.message) return;

        var before = game.rtp;
        if (options.collectFields) options.collectFields(configFields, game);
        game.rtp = parsed.value;
        game.updated = nowText();
        var record = {
          time: game.updated,
          game: game.name,
          action: "更新玩法配置",
          before: formatRtp(before),
          after: formatRtp(parsed.value),
          operator: "运营管理员"
        };
        records.unshift(record);
        renderRows();
        renderRecords();
        closeConfig();
        showToast("配置已立即生效", false);
      }

      if (form) {
        form.addEventListener("submit", function (event) {
          event.preventDefault();
          renderRows();
        });
      }
      document.getElementById("typeReset") && document.getElementById("typeReset").addEventListener("click", function () {
        if (nameFilter) nameFilter.value = "";
        renderRows();
      });
      if (nameFilter) nameFilter.addEventListener("input", renderRows);
      rows.addEventListener("click", function (event) {
        var button = event.target.closest("[data-config-index]");
        if (button) openConfig(Number(button.getAttribute("data-config-index")));
      });
      document.querySelectorAll("[data-config-close]").forEach(function (button) {
        button.addEventListener("click", closeConfig);
      });
      if (modal) {
        modal.querySelector(".self-game-modal-mask").addEventListener("click", closeConfig);
      }
      configRtp.addEventListener("input", function () {
        setRtpError("");
      });
      document.getElementById("applyConfig").addEventListener("click", saveConfig);
      document.addEventListener("click", function (event) {
        var tab = event.target.closest("[data-self-tab]");
        if (tab) switchTab(tab);
      });

      renderRows();
      renderRecords();
    });
  }

  global.SelfGameConfig = {
    ready: ready,
    esc: esc,
    formatRtp: formatRtp,
    parseRtp: parseRtp,
    nowText: nowText,
    showToast: showToast,
    setLayer: setLayer,
    renderRecordRows: renderRecordRows,
    initTypePage: initTypePage,
    RTP_MIN: RTP_MIN,
    RTP_MAX: RTP_MAX,
    RTP_STEP: RTP_STEP
  };
}(window));
