(function () {
  "use strict";
  function ready(callback) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback);
    else callback();
  }
  ready(function () {
    var page = document.querySelector(".agent-settings");
    if (!page) return;
    function get(id) { return page.querySelector("#" + id); }
    var ids = ["commonPanel", "commonForm", "commonFields", "commonDeposit", "commonBet", "commonTime", "commonTierCount", "commonTierChain", "commonBases", "commonError", "editCommon", "commonActions", "cancelCommon", "rulePanel", "ruleForm", "ruleFields", "editRule", "ruleEnabled", "ruleEnabledLabel", "inviteFields", "inviteReward", "publicRuleSummary", "tierBlocks", "milestoneTable", "milestoneRows", "milestoneAddRow", "addMilestone", "ruleError", "ruleActions", "cancelRule", "confirmDialog", "confirmTitle", "confirmText", "confirmAction", "pageToast"];
    if (ids.some(function (id) { return !get(id); })) return;
    var keys = ["invite", "bet", "deposit", "milestone"];
    var tierKeys = ["bet", "deposit"];
    var titles = { invite: "邀请奖励", bet: "投注返水", deposit: "充值返利", milestone: "邀请里程碑" };
    var descriptions = {
      invite: "每成功邀请一位符合条件的好友，获得固定奖励。",
      bet: "按各层级的有效打码档位和返水比例计算奖励。",
      deposit: "按各层级的存款档位和返利比例计算奖励。",
      milestone: "有效邀请人数达到档位后获得对应奖励，每档仅可领取一次。点击编辑后修改人数和金额。"
    };
    var layerNames = ["一级下级", "二级下级", "三级下级", "四级下级"];
    var storageKey = "business.new-agent-config.v1";
    var state = {
      common: { deposit: "300000", bet: "5000", time: "06:00", layers: 4 },
      rules: {
        invite: { enabled: true, reward: "60" },
        bet: { enabled: true, tiers: [
          [["100000", "200000", "0.1"], ["200000", "500000", "0.2"], ["500000", "1000000", "0.3"], ["1000000", "20000000", "0.4"], ["20000000", "0", "0.6"]],
          [["100000", "200000", "0.05"], ["200000", "0", "0.1"]],
          [["100000", "0", "0.03"]], [["0", "0", "0"]]
        ] },
        deposit: { enabled: true, tiers: [
          [["100000", "200000", "1"], ["200000", "500000", "1.25"], ["500000", "1000000", "1.5"], ["1000000", "2000000", "2"]],
          [["200000", "0", "1.2"]],
          [["10000", "20000", "0.1"], ["20000", "50000", "0.25"], ["50000", "100000", "0.3"], ["100000", "200000", "0.4"], ["200000", "0", "0.6"]],
          [["0", "0", "0"]]
        ] },
        milestone: { enabled: true, rows: [["5", "0", "Rp"], ["10", "0", "Rp"]] }
      }
    };
    var active = "invite", mode = null, draft = null, commonSaved = true;
    var confirmation = null, opener = null, oldOverflow = "", toastTimer;
    var main = page.querySelector(".settings-main");
    function clone(value) { return JSON.parse(JSON.stringify(value)); }
    function escapeText(value) {
      return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;").replace(/"/g, "&quot;");
    }
    function numberText(value) {
      var parts = String(value).split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
    }
    function nonnegative(value) {
      return typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) >= 0;
    }
    function commonIssue(common) {
      if (!common || !nonnegative(common.deposit)) return "请填写存款，不能为空。";
      if (!nonnegative(common.bet)) return "请填写有效打码，不能为空。";
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(common.time)) return "请选择结算时间。";
      if (!Number.isInteger(common.layers) || common.layers < 1 || common.layers > 4) return "请选择 1～4 级返利层级。";
      return "";
    }
    function rangeIssue(rows, label) {
      if (!Array.isArray(rows) || !rows.length) return label + " 至少需要一条完整基础档位。";
      if (rows.length > 100) return label + " 最多支持 100 条档位。";
      for (var i = 0; i < rows.length; i += 1) {
        var row = rows[i], prefix = label + " 第 " + (i + 1) + " 档：";
        if (!Array.isArray(row) || row.length !== 3 || !nonnegative(row[0]) || !nonnegative(row[1]) || !nonnegative(row[2])) return prefix + "请补全金额下限、上限和比例，上限为 0 表示无上限。";
        if (Number(row[1]) !== 0 && Number(row[1]) <= Number(row[0])) return prefix + "上限必须大于下限，或填 0 表示无上限。";
        if (Number(row[2]) > 100) return prefix + "比例须为 0～100。";
        if (i > 0 && (Number(rows[i - 1][1]) === 0 || Number(row[0]) < Number(rows[i - 1][1]))) return prefix + "金额档位须递增且不能重叠，无上限档位只能在最后。";
      }
      return "";
    }
    function ruleIssue(key, rule, layers) {
      if (!rule || typeof rule.enabled !== "boolean") return titles[key] + " 配置无效。";
      if (key === "invite") return nonnegative(rule.reward) ? "" : "每位有效邀请的奖励金额必填，且不能小于 0。";
      if (tierKeys.indexOf(key) !== -1) {
        if (!Array.isArray(rule.tiers) || rule.tiers.length !== layers) return titles[key] + " 的层级须与返利层级一致。";
        for (var level = 0; level < layers; level += 1) {
          var issue = rangeIssue(rule.tiers[level], titles[key] + " Tier " + (level + 1));
          if (issue) return issue;
        }
      } else {
        if (!Array.isArray(rule.rows) || !rule.rows.length) return "邀请里程碑至少需要一条完整基础档位。";
        if (rule.rows.length > 100) return "邀请里程碑最多支持 100 条档位。";
        for (var i = 0; i < rule.rows.length; i += 1) {
          var row = rule.rows[i];
          if (!Array.isArray(row) || row.length !== 3 || !nonnegative(row[0]) || !Number.isInteger(Number(row[0])) || Number(row[0]) < 1 || !nonnegative(row[1]) || row[2] !== "Rp") return "里程碑第 " + (i + 1) + " 档需填写正整数人数及非负奖励金额。";
          if (i > 0 && Number(row[0]) <= Number(rule.rows[i - 1][0])) return "邀请人数档位须从小到大排列，且不能重复。";
        }
      }
      return "";
    }
    function load() {
      try {
        var record = JSON.parse(window.localStorage.getItem(storageKey));
        if (!record || record.version !== 1 || commonIssue(record.common) || !record.rules) return;
        // Convert only previously saved blank upper bounds; live inputs remain required.
        tierKeys.forEach(function (key) {
          var rule = record.rules[key];
          if (!rule || !Array.isArray(rule.tiers)) return;
          rule.tiers.forEach(function (rows) {
            if (!Array.isArray(rows)) return;
            rows.forEach(function (row) { if (Array.isArray(row) && row[1] === "") row[1] = "0"; });
          });
        });
        if (tierKeys.some(function (key) { return !!ruleIssue(key, record.rules[key], record.common.layers); })) return;
        state.common = clone(record.common);
        keys.forEach(function (key) {
          if (record.rules[key] && !ruleIssue(key, record.rules[key], state.common.layers)) state.rules[key] = clone(record.rules[key]);
        });
        commonSaved = true;
      } catch (error) { /* Complete defaults remain visible when saved data cannot be validated. */ }
    }
    function setError(id, message) { get(id).textContent = message; get(id).hidden = false; }
    function clearErrors() { get("commonError").hidden = true; get("ruleError").hidden = true; }
    function toast(message) {
      get("pageToast").textContent = message; get("pageToast").hidden = false;
      window.clearTimeout(toastTimer); toastTimer = window.setTimeout(function () { get("pageToast").hidden = true; }, 2800);
    }
    function persist(candidate, affected, errorId) {
      var issue = commonIssue(candidate.common);
      if (!issue) {
        var required = tierKeys.concat(affected);
        for (var i = 0; i < required.length; i += 1) {
          issue = ruleIssue(required[i], candidate.rules[required[i]], candidate.common.layers);
          if (issue) break;
        }
      }
      if (issue) { setError(errorId, issue + " 补齐后才能保存。"); return false; }
      var records = {};
      keys.forEach(function (key) {
        if (!ruleIssue(key, candidate.rules[key], candidate.common.layers)) records[key] = candidate.rules[key];
      });
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ version: 1, common: candidate.common, rules: records }));
        return true;
      } catch (error) {
        setError(errorId, "浏览器无法保存配置，修改仍保留在编辑区，请重试。"); return false;
      }
    }
    function ensureLayers(value) {
      tierKeys.forEach(function (key) {
        while (value.rules[key].tiers.length < value.common.layers) value.rules[key].tiers.push([["0", "0", "0"]]);
        value.rules[key].tiers.forEach(function (rows) { if (!rows.length) rows.push(["0", "0", "0"]); });
      });
    }
    function editableRule() { return mode === active ? draft.rules[active] : state.rules[active]; }
    function showCommonBase(key, level) {
      var rows = state.rules[key].tiers[level];
      return !rows || !!rangeIssue(rows, "");
    }
    function numeric(value, key, level, row, column, seed) {
      var milestone = key === "milestone";
      var attrs = " data-key='" + key + "' data-row='" + row + "' data-column='" + column + "'";
      if (!milestone) attrs += " data-level='" + level + "'";
      if (seed) attrs += " data-seed='true'";
      var label = milestone ? (column === 0 ? "有效邀请人数" : "奖励金额") : ["金额下限", "金额上限", "返利比例"][column];
      return "<input class='" + (milestone ? "inline-milestone-input" : "inline-range-input") + "' type='number' min='" + (milestone && column === 0 ? "1" : "0") +
        "' step='" + (milestone && column === 0 ? "1" : "any") + "'" + (!milestone && column === 2 ? " max='100'" : "") +
        " required" + (!milestone && column === 1 ? " title='0 表示无上限'" : "") + attrs + " aria-label='" + titles[key] + (milestone ? "" : " Tier " + (level + 1)) +
        " 第 " + (row + 1) + " 档" + label + "' value='" + escapeText(value) + "'>";
    }
    function renderBases() {
      var holder = get("commonBases");
      if (mode !== "common") { holder.innerHTML = ""; holder.hidden = true; return; }
      var blocks = [];
      for (var level = 0; level < draft.common.layers; level += 1) {
        if (!tierKeys.some(function (key) { return showCommonBase(key, level); })) continue;
        var rows = tierKeys.map(function (key) {
          if (!showCommonBase(key, level)) return "<tr><td>" + titles[key] + "</td><td colspan='3'>已配置 " + state.rules[key].tiers[level].length + " 条档位</td></tr>";
          return draft.rules[key].tiers[level].map(function (row, index) {
            return "<tr><td>" + titles[key] + (index ? " · 第 " + (index + 1) + " 档" : "") + "</td>" +
              row.map(function (value, column) { return "<td>" + numeric(value, key, level, index, column, true) + "</td>"; }).join("") + "</tr>";
          }).join("");
        }).join("");
        blocks.push("<article class='base-block'><h3>Tier " + (level + 1) + " · 补齐基础档位</h3><p>投注返水和充值返利各至少一条完整数据。金额下限、上限和比例必填，上限为 0 表示无上限。</p><div class='table-scroll'><table class='rules-table'><thead><tr><th>奖励类型</th><th>下限（Rp）</th><th>上限（Rp）</th><th>比例（%）</th></tr></thead><tbody>" + rows + "</tbody></table></div></article>");
      }
      holder.innerHTML = blocks.join(""); holder.hidden = !blocks.length;
    }
    function renderCommon() {
      var value = mode === "common" ? draft.common : state.common;
      get("commonDeposit").value = value.deposit;
      get("commonBet").value = value.bet;
      get("commonTime").value = value.time;
      get("commonTierCount").value = String(value.layers);
      get("commonFields").disabled = mode !== "common";
      get("editCommon").hidden = mode === "common";
      get("editCommon").disabled = !!mode && mode !== "common";
      get("commonActions").hidden = mode !== "common";
      get("commonPanel").classList.toggle("is-editing", mode === "common");
      if (get("commonDepositHelp")) get("commonDepositHelp").hidden = nonnegative(value.deposit);
      get("commonTierChain").textContent = Array.from({ length: value.layers }, function (_, index) { return "Tier " + (index + 1); }).join(" → ");
      renderBases();
    }
    function deleteControl(index, level, length) {
      return "<button type='button' class='row-action delete' data-delete='" + index + "'" + (level === undefined ? "" : " data-level='" + level + "'") +
        (length <= 1 ? " disabled title='至少保留一条完整基础档位'" : "") + ">删除</button>";
    }
    function renderRules() {
      var rule = editableRule(), editing = mode === active, tiered = tierKeys.indexOf(active) !== -1;
      get("sectionTitle").textContent = titles[active]; get("sectionDescription").textContent = descriptions[active];
      get("rulePanel").setAttribute("aria-labelledby", active + "Tab");
      get("editRule").hidden = editing; get("editRule").disabled = mode === "common" || !commonSaved;
      get("ruleEnabled").checked = rule.enabled; get("ruleEnabled").disabled = !editing;
      get("ruleEnabledLabel").textContent = rule.enabled ? "已启用" : "已停用";
      get("ruleFields").disabled = !editing; get("ruleActions").hidden = !editing;
      get("rulePanel").classList.toggle("is-editing", editing);
      get("inviteFields").hidden = active !== "invite";
      get("inviteReward").value = (mode === "invite" ? draft : state).rules.invite.reward;
      get("inviteReward").disabled = !editing || active !== "invite";
      get("tierBlocks").hidden = !tiered;
      get("milestoneTable").hidden = active !== "milestone";
      get("milestoneAddRow").hidden = !editing || active !== "milestone";
      get("publicRuleSummary").textContent = commonSaved ? "存款 ≥ " + numberText(state.common.deposit) + " Rp · 有效打码 ≥ " + numberText(state.common.bet) +
        " Rp · 结算时间 " + state.common.time + (editing ? "。每张表至少保留一条完整档位，保存后生效。" : "") : "请完善基础配置。";
      if (tiered) {
        get("tierBlocks").innerHTML = rule.tiers.slice(0, state.common.layers).map(function (rows, level) {
          var headings = editing ? ["金额下限（Rp）", "金额上限（Rp）", "比例（%）", "操作"] : [active === "bet" ? "有效打码区间（Rp）" : "存款区间（Rp）", "比例"];
          var body = rows.map(function (row, index) {
            if (editing) return "<tr>" + row.map(function (value, column) { return "<td>" + numeric(value, active, level, index, column, false) + "</td>"; }).join("") + "<td>" + deleteControl(index, level, rows.length) + "</td></tr>";
            var pending = !nonnegative(row[0]) || !nonnegative(row[1]) || !nonnegative(row[2]);
            return "<tr><td>" + (pending ? "待配置" : numberText(row[0]) + (Number(row[1]) === 0 ? " ～ 无上限" : " ～ " + numberText(row[1]))) + "</td><td>" + (pending ? "待配置" : escapeText(row[2]) + "%") + "</td></tr>";
          }).join("");
          return "<article class='tier-block'><div class='tier-block-head'><div><strong class='tier-block-title'>Tier " + (level + 1) + " · " + layerNames[level] +
            "</strong><p class='tier-level-note'>" + (level === 0 ? "直属邀请关系" : "向下第 " + (level + 1) + " 层邀请关系") + " · 至少一条档位 · 上限为 0 表示无上限</p></div></div><div class='table-scroll'><table class='rules-table'><thead><tr>" +
            headings.map(function (label) { return "<th>" + label + "</th>"; }).join("") + "</tr></thead><tbody>" + body + "</tbody></table></div>" +
            (editing ? "<div class='range-add-row'><button class='add-range-button' type='button' data-add-range='" + level + "'>＋ 新增档位</button></div>" : "") + "</article>";
        }).join("");
      } else get("tierBlocks").innerHTML = "";
      if (active === "milestone") {
        get("milestoneRows").innerHTML = rule.rows.map(function (row, index) {
          return "<tr><td>" + (editing ? numeric(row[0], active, 0, index, 0, false) : escapeText(row[0])) + "</td><td>" +
            (editing ? numeric(row[1], active, 0, index, 1, false) : row[1] === "" ? "待配置" : escapeText(row[1])) + "</td><td>Rp</td>" +
            (editing ? "<td>" + deleteControl(index, undefined, rule.rows.length) + "</td>" : "") + "</tr>";
        }).join("");
      } else get("milestoneRows").innerHTML = "";
      page.querySelectorAll("[data-edit-only]").forEach(function (element) { element.hidden = !editing; });
      page.querySelectorAll(".settings-tab").forEach(function (tab) {
        tab.classList.toggle("is-active", tab.dataset.tab === active); tab.setAttribute("aria-selected", tab.dataset.tab === active ? "true" : "false");
      });
    }
    function render() { renderCommon(); renderRules(); }
    function closeConfirm() {
      get("confirmDialog").hidden = true; confirmation = null; main.inert = false;
      document.body.style.overflow = oldOverflow;
      if (opener && document.contains(opener) && !opener.disabled && !opener.hidden) opener.focus();
      else get(mode === "common" ? "cancelCommon" : mode ? "cancelRule" : "editCommon").focus();
    }
    function confirm(title, message, callback) {
      opener = document.activeElement; oldOverflow = document.body.style.overflow;
      get("confirmTitle").textContent = title; get("confirmText").textContent = message;
      confirmation = callback; get("confirmDialog").hidden = false; main.inert = true;
      document.body.style.overflow = "hidden"; get("confirmAction").focus();
    }
    function finish(candidate) {
      state = candidate; draft = null; mode = null; commonSaved = true;
      clearErrors(); render(); toast("配置已保存至本浏览器");
    }
    get("editCommon").addEventListener("click", function () {
      if (mode) return;
      mode = "common"; draft = clone(state); ensureLayers(draft); clearErrors(); render(); get("commonDeposit").focus();
    });
    get("commonForm").addEventListener("input", function (event) {
      if (mode !== "common") return;
      var input = event.target;
      if (input.dataset.seed) {
        var key = input.dataset.key, level = Number(input.dataset.level), row = Number(input.dataset.row), column = Number(input.dataset.column);
        if (tierKeys.indexOf(key) !== -1 && draft.rules[key].tiers[level] && draft.rules[key].tiers[level][row] && column >= 0 && column <= 2) draft.rules[key].tiers[level][row][column] = input.value.trim();
      } else {
        var mapping = { commonDeposit: "deposit", commonBet: "bet", commonTime: "time" };
        if (mapping[input.id]) draft.common[mapping[input.id]] = input.value.trim();
        if (input.id === "commonDeposit" && get("commonDepositHelp")) get("commonDepositHelp").hidden = nonnegative(input.value.trim());
      }
      get("commonError").hidden = true;
    });
    get("commonTierCount").addEventListener("change", function () {
      if (mode !== "common") return;
      var value = Number(get("commonTierCount").value);
      if (!Number.isInteger(value) || value < 1 || value > 4) return;
      draft.common.layers = value; ensureLayers(draft); get("commonError").hidden = true; renderCommon();
    });
    get("cancelCommon").addEventListener("click", function () { if (mode === "common") { draft = null; mode = null; clearErrors(); render(); } });
    get("commonForm").addEventListener("submit", function (event) {
      event.preventDefault(); if (mode !== "common") return;
      var candidate = clone(draft);
      tierKeys.forEach(function (key) { candidate.rules[key].tiers = candidate.rules[key].tiers.slice(0, candidate.common.layers); });
      var issue = commonIssue(candidate.common);
      for (var i = 0; !issue && i < tierKeys.length; i += 1) issue = ruleIssue(tierKeys[i], candidate.rules[tierKeys[i]], candidate.common.layers);
      if (issue) { setError("commonError", issue + " 补齐后才能保存。"); return; }
      function commit() { if (persist(candidate, tierKeys, "commonError")) finish(candidate); }
      if (candidate.common.layers < state.common.layers) {
        var removed = tierKeys.map(function (key) { return state.rules[key].tiers.slice(candidate.common.layers).reduce(function (sum, rows) { return sum + rows.length; }, 0); });
        confirm("确认减少返利层级", "由 " + state.common.layers + " 级调整为 " + candidate.common.layers + " 级，将移除超出层级的投注返水 " + removed[0] + " 条档位和充值返利 " + removed[1] + " 条档位。前面层级保持不变。", commit);
      } else commit();
    });
    get("editRule").addEventListener("click", function () {
      if (mode || !commonSaved) return;
      mode = active; draft = clone(state);
      if (tierKeys.indexOf(active) !== -1) ensureLayers(draft);
      if (active === "milestone" && !draft.rules.milestone.rows.length) draft.rules.milestone.rows.push(["1", "0", "Rp"]);
      clearErrors(); render();
    });
    get("cancelRule").addEventListener("click", function () { if (mode === active) { draft = null; mode = null; clearErrors(); render(); } });
    get("ruleEnabled").addEventListener("change", function () {
      if (mode !== active) { get("ruleEnabled").checked = state.rules[active].enabled; return; }
      draft.rules[active].enabled = get("ruleEnabled").checked;
      get("ruleEnabledLabel").textContent = get("ruleEnabled").checked ? "已启用" : "已停用";
    });
    get("ruleForm").addEventListener("input", function (event) {
      if (mode !== active) return;
      var input = event.target;
      if (input.id === "inviteReward" && active === "invite") draft.rules.invite.reward = input.value.trim();
      else if (input.dataset.row !== undefined) {
        var rule = draft.rules[active], index = Number(input.dataset.row), column = Number(input.dataset.column);
        var rows = active === "milestone" ? rule.rows : rule.tiers && rule.tiers[Number(input.dataset.level)];
        if (rows && rows[index] && column >= 0 && column < (active === "milestone" ? 2 : 3)) rows[index][column] = input.value.trim();
      }
      get("ruleError").hidden = true;
    });
    function addRow(level) {
      if (mode !== active) return;
      var rule = draft.rules[active], rows = active === "milestone" ? rule.rows : rule.tiers && rule.tiers[level];
      if (!rows || rows.length >= 100) return;
      var issue = active === "milestone" ? ruleIssue(active, rule, draft.common.layers) : rangeIssue(rows, titles[active] + " Tier " + (level + 1));
      if (issue && rows.length) { setError("ruleError", issue + " 请先完善当前档位。"); return; }
      var last = rows[rows.length - 1];
      if (active !== "milestone" && last && Number(last[1]) === 0) {
        setError("ruleError", "最后一档上限为 0，表示无上限。请先设置大于下限的上限，再新增档位。"); return;
      }
      rows.push(active === "milestone" ? [String(last ? Number(last[0]) + 1 : 1), "0", "Rp"] : [last ? last[1] : "0", "0", "0"]);
      get("ruleError").hidden = true; renderRules();
      var scope = active === "milestone" ? get("milestoneRows") : get("tierBlocks");
      var field = scope.querySelector("input[data-row='" + (rows.length - 1) + "'][data-column='0']" + (active === "milestone" ? "" : "[data-level='" + level + "']"));
      if (field) field.focus();
    }
    get("addMilestone").addEventListener("click", function () { if (active === "milestone") addRow(); });
    get("ruleForm").addEventListener("click", function (event) {
      if (mode !== active) return;
      var button = event.target.closest("[data-add-range], [data-delete]");
      if (!button) return;
      if (button.dataset.addRange !== undefined) { addRow(Number(button.dataset.addRange)); return; }
      var rule = draft.rules[active], index = Number(button.dataset.delete);
      var rows = active === "milestone" ? rule.rows : rule.tiers && rule.tiers[Number(button.dataset.level)];
      if (!rows || !Number.isInteger(index) || index < 0 || index >= rows.length) return;
      if (rows.length <= 1) { setError("ruleError", "至少保留一条基础档位，请修改已有数据，不能全部删除。"); return; }
      rows.splice(index, 1); get("ruleError").hidden = true; renderRules();
    });
    get("ruleForm").addEventListener("submit", function (event) {
      event.preventDefault(); if (mode !== active) return;
      var issue = ruleIssue(active, draft.rules[active], state.common.layers);
      if (issue) { setError("ruleError", issue + " 未保存。"); return; }
      if (persist(draft, [active], "ruleError")) finish(clone(draft));
    });
    page.querySelectorAll(".settings-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        if (!get("confirmDialog").hidden || !titles[tab.dataset.tab] || active === tab.dataset.tab) return;
        function switchTab() {
          if (mode && mode !== "common") { draft = null; mode = null; }
          active = tab.dataset.tab; get("ruleError").hidden = true; render();
        }
        if (mode && mode !== "common" && JSON.stringify(draft) !== JSON.stringify(state)) confirm("有未保存的修改", "切换页签将放弃当前修改，包括新增和删除的档位。取消可继续编辑。", switchTab);
        else switchTab();
      });
    });
    get("confirmAction").addEventListener("click", function () { if (confirmation) { confirmation(); closeConfirm(); } });
    get("confirmDialog").addEventListener("click", function (event) { if (event.target.closest("[data-close-confirm]")) closeConfirm(); });
    get("confirmDialog").addEventListener("keydown", function (event) {
      if (event.key === "Escape") { event.preventDefault(); closeConfirm(); }
      if (event.key === "Tab") {
        var items = get("confirmDialog").querySelectorAll("button:not([disabled])"), first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    load(); render();
  });
})();
