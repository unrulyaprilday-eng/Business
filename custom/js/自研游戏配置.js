(function () {
  "use strict";

  var api = window.SelfGameConfig;
  if (!api) return;

  var games = [
    { code: "SLOT-1001", name: "星穹宝藏", type: "SLOTS", rtp: 96.0, updated: "2026-08-18 09:30", capability: { freeGamePurchase: true, baseBets: [1, 5, 10, 50] }, enabledBets: [1, 5, 10], freeGameAllowed: true, records: [{ time: "2026-08-18 09:30", game: "星穹宝藏", action: "更新玩法配置", before: "95.0%", after: "96.0%", operator: "运营管理员" }] },
    { code: "SLOT-1002", name: "黄金矿场", type: "SLOTS", rtp: 95.0, updated: "2026-08-17 16:20", capability: { freeGamePurchase: false, baseBets: [0.5, 1, 2, 5] }, enabledBets: [0.5, 1, 2], freeGameAllowed: false, records: [{ time: "2026-08-17 16:20", game: "黄金矿场", action: "更新玩法配置", before: "94.5%", after: "95.0%", operator: "运营管理员" }] },
    { code: "SLOT-1003", name: "霓虹水果机", type: "SLOTS", rtp: 97.0, updated: "2026-08-16 11:05", capability: { freeGamePurchase: true, baseBets: [1, 2, 5, 10, 20] }, enabledBets: [1, 2, 5, 10], freeGameAllowed: false, records: [] },
    { code: "FISH-2001", name: "深海猎场", type: "FISH", rtp: 95.5, updated: "2026-08-18 10:05", capability: { levels: 6, minAmount: 0.1, maxAmount: 100, step: 0.1 }, cannons: [{ level: 1, amount: 0.1 }, { level: 2, amount: 0.5 }, { level: 3, amount: 1 }, { level: 4, amount: 5 }, { level: 5, amount: 10 }, { level: 6, amount: 50 }], records: [] },
    { code: "FISH-2002", name: "极地捕鱼王", type: "FISH", rtp: 96.5, updated: "2026-08-17 14:18", capability: { levels: 5, minAmount: 0.1, maxAmount: 50, step: 0.1 }, cannons: [{ level: 1, amount: 0.1 }, { level: 2, amount: 0.2 }, { level: 3, amount: 1 }, { level: 4, amount: 5 }, { level: 5, amount: 20 }], records: [{ time: "2026-08-17 14:18", game: "极地捕鱼王", action: "更新玩法配置", before: "96.0%", after: "96.5%", operator: "运营管理员" }] },
    { code: "FISH-2003", name: "黄金海岸", type: "FISH", rtp: 94.0, updated: "2026-08-16 09:40", capability: { levels: 4, minAmount: 1, maxAmount: 100, step: 1 }, cannons: [{ level: 1, amount: 1 }, { level: 2, amount: 5 }, { level: 3, amount: 10 }, { level: 4, amount: 50 }], records: [] },
    { code: "POK-3001", name: "极速德州", type: "Poker", rtp: 95.0, updated: "2026-08-18 08:55", capability: { roomTypes: ["低分房", "中分房", "高分房"], scoreUnit: "积分" }, rooms: [{ code: "P-L", name: "低分房", baseScore: 1, minEntry: 100 }, { code: "P-M", name: "中分房", baseScore: 10, minEntry: 1000 }, { code: "P-H", name: "高分房", baseScore: 100, minEntry: 10000 }], records: [{ time: "2026-08-18 08:55", game: "极速德州", action: "更新玩法配置", before: "94.0%", after: "95.0%", operator: "运营管理员" }] },
    { code: "POK-3002", name: "短牌扑克", type: "Poker", rtp: 94.5, updated: "2026-08-17 12:30", capability: { roomTypes: ["低分房", "高分房"], scoreUnit: "积分" }, rooms: [{ code: "S-L", name: "低分房", baseScore: 2, minEntry: 200 }, { code: "S-H", name: "高分房", baseScore: 50, minEntry: 5000 }], records: [] },
    { code: "MINI-4001", name: "极速飞车", type: "Mini", miniType: "Crash", rtp: 96.5, updated: "2026-08-17 17:10", capability: { fields: ["最大结算倍数", "自动结束阈值"] }, params: [{ key: "maxMultiplier", label: "最大结算倍数", value: "500", unit: "倍", type: "number", min: 1, max: 10000, step: 1 }, { key: "autoStop", label: "自动结束阈值", value: "1.2", unit: "倍", type: "number", min: 1, max: 100, step: 0.1 }], records: [] },
    { code: "MINI-4002", name: "地雷宝藏", type: "Mini", miniType: "Mines", rtp: 95.5, updated: "2026-08-16 15:45", capability: { fields: ["雷区数量", "风险档位"] }, params: [{ key: "mineCount", label: "雷区数量", value: "5", unit: "个", type: "number", min: 1, max: 24, step: 1 }, { key: "riskLevel", label: "风险档位", value: "中", unit: "", type: "select", options: ["低", "中", "高"] }], records: [{ time: "2026-08-16 15:45", game: "地雷宝藏", action: "更新玩法配置", before: "95.0%", after: "95.5%", operator: "运营管理员" }] },
    { code: "MINI-4003", name: "弹珠风险台", type: "Mini", miniType: "Plinko", rtp: 94.0, updated: "2026-08-15 10:22", capability: { fields: ["风险档位", "落点行数"] }, params: [{ key: "riskLevel", label: "风险档位", value: "中", unit: "", type: "select", options: ["低", "中", "高"] }, { key: "rows", label: "落点行数", value: "12", unit: "行", type: "number", min: 8, max: 20, step: 1 }], records: [] }
  ];
  var records = [];
  var activeType = "全部";
  var editingIndex = -1;

  games.forEach(function (game) { records = records.concat(game.records || []); });
  records.sort(function (a, b) { return String(b.time).localeCompare(String(a.time)); });

  function esc(value) { return api.esc(value); }

  function renderSummary(game) {
    if (game.type === "SLOTS") return "底分 " + game.enabledBets.join(" / ") + " · " + (game.capability.freeGamePurchase ? "Free Game 支持" : "Free Game 不支持");
    if (game.type === "FISH") return game.cannons.length + " 个炮台 · " + game.cannons[0].amount + "～" + game.cannons[game.cannons.length - 1].amount + " / 炮";
    if (game.type === "Poker") return game.rooms.length + " 个房间 · 低分房底分 " + game.rooms[0].baseScore + " · 最低进入 " + game.rooms[0].minEntry;
    return game.miniType + " · " + game.params.length + " 个专属参数";
  }

  function renderCapability(game) {
    if (game.type === "SLOTS") return [
      "<div class=\"self-game-capability-item\"><span>玩法类型</span><strong>SLOTS</strong></div>",
      "<div class=\"self-game-capability-item\"><span>Free Game 能力</span><strong>" + (game.capability.freeGamePurchase ? "支持购买" : "不支持购买") + "</strong></div>",
      "<div class=\"self-game-capability-item\"><span>基础底分</span><strong>" + game.capability.baseBets.join(" / ") + "</strong></div>"
    ].join("");
    if (game.type === "FISH") return [
      "<div class=\"self-game-capability-item\"><span>玩法类型</span><strong>FISH</strong></div>",
      "<div class=\"self-game-capability-item\"><span>炮台档位</span><strong>" + game.capability.levels + " 档</strong></div>",
      "<div class=\"self-game-capability-item\"><span>金额范围</span><strong>" + game.capability.minAmount + "～" + game.capability.maxAmount + "</strong></div>",
      "<div class=\"self-game-capability-item\"><span>调整步长</span><strong>" + game.capability.step + "</strong></div>"
    ].join("");
    if (game.type === "Poker") return [
      "<div class=\"self-game-capability-item\"><span>玩法类型</span><strong>Poker</strong></div>",
      "<div class=\"self-game-capability-item\"><span>支持房间</span><strong>" + game.capability.roomTypes.join(" / ") + "</strong></div>",
      "<div class=\"self-game-capability-item\"><span>进入条件单位</span><strong>" + game.capability.scoreUnit + "</strong></div>"
    ].join("");
    return [
      "<div class=\"self-game-capability-item\"><span>玩法类型</span><strong>Mini / " + game.miniType + "</strong></div>",
      "<div class=\"self-game-capability-item\"><span>基础参数</span><strong>" + game.capability.fields.length + " 项</strong></div>",
      "<div class=\"self-game-capability-item\"><span>可配置字段</span><strong>游戏能力提供</strong></div>"
    ].join("");
  }

  function renderFields(game) {
    if (game.type === "SLOTS") return [
      "<section class=\"self-game-config-section\"><h3>投注底分</h3><p>只能选择游戏基础能力提供的底分，未勾选的底分不会对玩家开放。</p><div class=\"self-game-option-grid\">",
      game.capability.baseBets.map(function (value) { return "<label class=\"self-game-option\"><input class=\"slot-bet-option\" type=\"checkbox\" value=\"" + value + "\"" + (game.enabledBets.indexOf(value) !== -1 ? " checked" : "") + "><span>底分 " + value + "</span></label>"; }).join(""),
      "</div></section><section class=\"self-game-config-section\"><h3>购买 Free Game</h3><p>该开关仅在游戏基础能力支持时可编辑，购买价格由游戏基础数据提供。</p><label class=\"self-game-switch\"><input id=\"slotFreeGame\" type=\"checkbox\"" + (game.freeGameAllowed ? " checked" : "") + (game.capability.freeGamePurchase ? "" : " disabled") + "><span class=\"self-game-switch-track\"></span><span class=\"self-game-switch-text\">" + (game.capability.freeGamePurchase ? "允许购买" : "游戏不支持") + "</span></label></section>"
    ].join("");
    if (game.type === "FISH") return [
      "<section class=\"self-game-config-section\"><h3>炮台金额梯度</h3><p>可在游戏基础数据提供的范围内调整每个炮台档位的金额。</p><table class=\"self-game-data-table\"><thead><tr><th>炮台档位</th><th>当前每炮金额</th><th>金额范围</th><th>调整步长</th></tr></thead><tbody>",
      game.cannons.map(function (cannon) { return "<tr><td>炮台 " + cannon.level + "</td><td><input class=\"fish-amount\" type=\"number\" min=\"" + game.capability.minAmount + "\" max=\"" + game.capability.maxAmount + "\" step=\"" + game.capability.step + "\" value=\"" + cannon.amount + "\" data-level=\"" + cannon.level + "\"></td><td>" + game.capability.minAmount + "～" + game.capability.maxAmount + "</td><td>" + game.capability.step + "</td></tr>"; }).join(""),
      "</tbody></table></section>"
    ].join("");
    if (game.type === "Poker") return [
      "<section class=\"self-game-config-section\"><h3>房间底分与最低进入条件</h3><p>房间类型来自游戏基础数据，页面仅配置房间底分和最低进入条件。</p><table class=\"self-game-data-table\"><thead><tr><th>房间</th><th>房间底分</th><th>最低进入条件</th><th>单位</th></tr></thead><tbody>",
      game.rooms.map(function (room) { return "<tr><td>" + room.name + "<span class=\"self-game-help\">（" + room.code + "）</span></td><td><input class=\"poker-base-score\" type=\"number\" min=\"0.1\" step=\"0.1\" value=\"" + room.baseScore + "\" data-room=\"" + room.code + "\"></td><td><input class=\"poker-min-entry\" type=\"number\" min=\"0.1\" step=\"0.1\" value=\"" + room.minEntry + "\" data-room=\"" + room.code + "\"></td><td>" + game.capability.scoreUnit + "</td></tr>"; }).join(""),
      "</tbody></table></section>"
    ].join("");
    return [
      "<section class=\"self-game-config-section\"><h3>" + game.miniType + " 专属参数</h3><p>参数名称和可用范围由游戏基础能力提供。</p><table class=\"self-game-data-table\"><thead><tr><th>参数</th><th>配置值</th><th>单位</th><th>能力范围</th></tr></thead><tbody>",
      game.params.map(function (param) { var control = param.type === "select" ? "<select class=\"mini-param\" data-param=\"" + param.key + "\">" + param.options.map(function (option) { return "<option" + (option === param.value ? " selected" : "") + ">" + option + "</option>"; }).join("") + "</select>" : "<input class=\"mini-param\" type=\"number\" min=\"" + param.min + "\" max=\"" + param.max + "\" step=\"" + param.step + "\" value=\"" + param.value + "\" data-param=\"" + param.key + "\">"; return "<tr><td>" + param.label + "</td><td>" + control + "</td><td>" + param.unit + "</td><td>" + (param.type === "select" ? param.options.join(" / ") : param.min + "～" + param.max) + "</td></tr>"; }).join(""),
      "</tbody></table></section>"
    ].join("");
  }

  function validateFields(root, game) {
    if (game.type === "SLOTS" && !root.querySelectorAll(".slot-bet-option:checked").length) return "至少选择一个投注底分";
    if (game.type === "FISH") {
      var fishError = "";
      root.querySelectorAll(".fish-amount").forEach(function (input) { var value = Number(input.value); var scale = Math.round(value / game.capability.step); if (!isFinite(value) || value < game.capability.minAmount || value > game.capability.maxAmount || Math.abs(scale * game.capability.step - value) > 0.000001) fishError = "炮台金额必须在基础数据范围内，并符合步长 " + game.capability.step; });
      return fishError;
    }
    if (game.type === "Poker") {
      var pokerError = "";
      root.querySelectorAll(".poker-base-score, .poker-min-entry").forEach(function (input) { if (!isFinite(Number(input.value)) || Number(input.value) <= 0) pokerError = "房间底分和最低进入条件必须大于 0"; });
      return pokerError;
    }
    var miniError = "";
    root.querySelectorAll(".mini-param[type=number]").forEach(function (input) { var value = Number(input.value); var param = game.params.filter(function (item) { return item.key === input.getAttribute("data-param"); })[0]; if (!param || !isFinite(value) || value < param.min || value > param.max) miniError = "Mini 参数必须在游戏基础能力范围内"; });
    return miniError;
  }

  function collectFields(root, game) {
    if (game.type === "SLOTS") {
      game.enabledBets = Array.prototype.map.call(root.querySelectorAll(".slot-bet-option:checked"), function (item) { return Number(item.value); });
      var freeGame = root.querySelector("#slotFreeGame");
      if (freeGame && !freeGame.disabled) game.freeGameAllowed = freeGame.checked;
    } else if (game.type === "FISH") {
      root.querySelectorAll(".fish-amount").forEach(function (input) { var level = Number(input.getAttribute("data-level")); game.cannons.forEach(function (cannon) { if (cannon.level === level) cannon.amount = Number(input.value); }); });
    } else if (game.type === "Poker") {
      game.rooms.forEach(function (room) { var base = root.querySelector(".poker-base-score[data-room=\"" + room.code + "\"]"); var entry = root.querySelector(".poker-min-entry[data-room=\"" + room.code + "\"]"); if (base) room.baseScore = Number(base.value); if (entry) room.minEntry = Number(entry.value); });
    } else {
      game.params.forEach(function (param) { var input = root.querySelector(".mini-param[data-param=\"" + param.key + "\"]"); if (input) param.value = input.value; });
    }
  }

  function syncSelectionState() {
    var selectAll = document.getElementById("gameSelectAll");
    var visibleBoxes = Array.prototype.slice.call(document.querySelectorAll(".game-row-check"));
    var visibleSelected = visibleBoxes.filter(function (box) { return box.checked; }).length;
    document.getElementById("selectedCount").textContent = String(games.filter(function (game) { return game.selected; }).length);
    selectAll.checked = visibleBoxes.length > 0 && visibleSelected === visibleBoxes.length;
    selectAll.indeterminate = visibleSelected > 0 && visibleSelected < visibleBoxes.length;
  }

  function renderRows() {
    var keyword = String(document.getElementById("gameName").value || "").trim().toLowerCase();
    var visible = games.map(function (game, index) { return { game: game, index: index }; }).filter(function (item) { var game = item.game; return (activeType === "全部" || game.type === activeType) && (!keyword || [game.name, game.code].join(" ").toLowerCase().indexOf(keyword) !== -1); });
    var rows = document.getElementById("gameRows");
    rows.innerHTML = visible.length ? visible.map(function (item) { var game = item.game; return "<tr><td class=\"check-cell\"><input class=\"game-row-check\" type=\"checkbox\" data-index=\"" + item.index + "\"" + (game.selected ? " checked" : "") + "></td><td>" + esc(game.type) + "</td><td>" + esc(game.code) + "</td><td>" + esc(game.name) + "</td><td>" + esc(renderSummary(game)) + "</td><td class=\"number-cell\"><span class=\"self-game-rtp\">" + api.formatRtp(game.rtp) + "</span></td><td>" + esc(game.updated) + "</td><td><button class=\"self-game-link\" type=\"button\" data-config-index=\"" + item.index + "\">配置</button></td></tr>"; }).join("") : "<tr class=\"empty-row\"><td colspan=\"8\">暂无符合条件的自研游戏</td></tr>";
    syncSelectionState();
  }

  function renderRecords() {
    var target = document.getElementById("recordRows");
    target.innerHTML = records.length ? records.map(function (record) { return "<tr><td>" + esc(record.time) + "</td><td>" + esc(record.type || "-") + "</td><td>" + esc(record.game) + "</td><td>" + esc(record.action) + "</td><td>" + esc((record.before || "-") + " → " + (record.after || "-")) + "</td><td>" + esc(record.operator || "运营管理员") + "</td></tr>"; }).join("") : "<tr class=\"empty-row\"><td colspan=\"6\">暂无变更记录</td></tr>";
  }

  function openConfig(index) {
    var game = games[index];
    if (!game) return;
    editingIndex = index;
    document.getElementById("configTitle").textContent = game.type + " 配置 / " + game.name;
    document.getElementById("configGameName").textContent = game.name;
    document.getElementById("configGameCode").textContent = game.code;
    document.getElementById("configType").textContent = game.type;
    document.getElementById("configCapability").innerHTML = renderCapability(game);
    document.getElementById("configRtp").value = Number(game.rtp).toFixed(1);
    document.getElementById("configFields").innerHTML = renderFields(game);
    document.getElementById("configModalError").hidden = true;
    document.getElementById("configRtpError").hidden = true;
    api.setLayer(document.getElementById("configModal"), true);
  }

  function closeConfig() { editingIndex = -1; api.setLayer(document.getElementById("configModal"), false); }

  function applyConfig() {
    if (editingIndex < 0) return;
    var game = games[editingIndex];
    var parsed = api.parseRtp(document.getElementById("configRtp").value);
    var rtpError = document.getElementById("configRtpError");
    rtpError.textContent = parsed.message || "";
    rtpError.hidden = !parsed.message;
    if (parsed.message) return;
    var fieldError = validateFields(document.getElementById("configFields"), game);
    if (fieldError) { var error = document.getElementById("configModalError"); error.textContent = fieldError; error.hidden = false; return; }
    var before = game.rtp;
    collectFields(document.getElementById("configFields"), game);
    game.rtp = parsed.value;
    game.updated = api.nowText();
    records.unshift({ time: game.updated, type: game.type, game: game.name, action: "更新玩法配置", before: api.formatRtp(before), after: api.formatRtp(game.rtp), operator: "运营管理员" });
    renderRows();
    renderRecords();
    closeConfig();
    api.showToast("配置已立即生效", false);
  }

  function updateBatchPreview() {
    var count = games.filter(function (game) { return game.selected; }).length;
    document.getElementById("batchPreview").textContent = count ? "本次将立即更新已勾选的 " + count + " 个游戏的 RTP。" : "请先勾选需要修改 RTP 的游戏。";
    document.getElementById("batchApply").disabled = count === 0;
  }

  function openBatch() {
    document.getElementById("batchTypeLabel").textContent = "已勾选游戏";
    document.getElementById("batchRtp").value = "96.0";
    document.getElementById("batchReason").value = "";
    document.getElementById("batchRtpError").hidden = true;
    document.getElementById("batchReasonError").hidden = true;
    updateBatchPreview();
    api.setLayer(document.getElementById("batchModal"), true);
  }

  function closeBatch() { api.setLayer(document.getElementById("batchModal"), false); }

  function applyBatch() {
    var parsed = api.parseRtp(document.getElementById("batchRtp").value);
    var rtpError = document.getElementById("batchRtpError");
    rtpError.textContent = parsed.message || "";
    rtpError.hidden = !parsed.message;
    var reason = document.getElementById("batchReason").value.trim();
    var reasonError = document.getElementById("batchReasonError");
    reasonError.textContent = reason ? "" : "请填写变更原因";
    reasonError.hidden = !!reason;
    if (parsed.message || !reason) return;
    var indexes = games.map(function (game, index) { return game.selected ? index : -1; }).filter(function (index) { return index >= 0; });
    if (!indexes.length) return;
    var time = api.nowText();
    indexes.forEach(function (index) { games[index].rtp = parsed.value; games[index].updated = time; games[index].selected = false; });
    records.unshift({ time: time, type: "批量", game: "批量修改 " + indexes.length + " 个游戏", action: "RTP 立即生效", before: "-", after: api.formatRtp(parsed.value), operator: "运营管理员" });
    renderRows();
    renderRecords();
    closeBatch();
    api.showToast("RTP 已批量立即生效", false);
  }

  api.ready(function () {
    document.querySelectorAll("[data-game-type]").forEach(function (button) { button.addEventListener("click", function () { document.querySelectorAll("[data-game-type]").forEach(function (item) { item.classList.remove("is-active"); }); button.classList.add("is-active"); activeType = button.getAttribute("data-game-type"); renderRows(); }); });
    document.getElementById("gameFilterForm").addEventListener("submit", function (event) { event.preventDefault(); renderRows(); });
    document.getElementById("gameReset").addEventListener("click", function () { document.getElementById("gameName").value = ""; renderRows(); });
    document.getElementById("gameRows").addEventListener("click", function (event) { var button = event.target.closest("[data-config-index]"); if (button) openConfig(Number(button.getAttribute("data-config-index"))); });
    document.getElementById("gameRows").addEventListener("change", function (event) { if (event.target.matches(".game-row-check")) { games[Number(event.target.getAttribute("data-index"))].selected = event.target.checked; syncSelectionState(); } });
    document.getElementById("gameSelectAll").addEventListener("change", function (event) { document.querySelectorAll(".game-row-check").forEach(function (checkbox) { checkbox.checked = event.target.checked; games[Number(checkbox.getAttribute("data-index"))].selected = event.target.checked; }); renderRows(); });
    document.getElementById("openBatchRtp").addEventListener("click", function () { if (!games.some(function (game) { return game.selected; })) { api.showToast("请先勾选需要修改 RTP 的游戏", true); return; } openBatch(); });
    document.getElementById("batchApply").addEventListener("click", applyBatch);
    document.querySelectorAll("[data-batch-close]").forEach(function (button) { button.addEventListener("click", closeBatch); });
    document.querySelectorAll("[data-config-close]").forEach(function (button) { button.addEventListener("click", closeConfig); });
    document.getElementById("configModal").querySelector(".self-game-modal-mask").addEventListener("click", closeConfig);
    document.getElementById("batchModal").querySelector(".self-game-modal-mask").addEventListener("click", closeBatch);
    document.getElementById("applyConfig").addEventListener("click", applyConfig);
    document.addEventListener("click", function (event) { var tab = event.target.closest("[data-self-tab]"); if (!tab) return; var group = tab.getAttribute("data-self-tab-group"); var target = tab.getAttribute("data-self-tab"); document.querySelectorAll("[data-self-tab-group=\"" + group + "\"]").forEach(function (item) { if (item.hasAttribute("data-self-tab")) item.classList.toggle("is-active", item === tab); if (item.hasAttribute("data-self-tab-panel")) item.hidden = item.getAttribute("data-self-tab-panel") !== target; }); });
    renderRows();
    renderRecords();
  });
}());
