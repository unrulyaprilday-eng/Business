(function () {
  "use strict";

  function ready(callback) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback);
    else callback();
  }

  ready(function () {
    var page = document.querySelector(".new-agent-report");
    if (!page) return;

    var defaultRules = {
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
    };
    var config = readConfig();
    var form = page.querySelector("#reportFilters");
    var rows = Array.prototype.slice.call(page.querySelectorAll("#reportRows tr[data-code]"));
    var emptyRow = page.querySelector("#emptyRow");
    var count = page.querySelector("#resultCount");
    var total = page.querySelector("#visibleTotal");
    var toastTimer;

    function readConfig() {
      var result = JSON.parse(JSON.stringify(defaultRules));
      try {
        var saved = JSON.parse(window.localStorage.getItem("business.new-agent-config.v1"));
        if (!saved || saved.version !== 1 || !saved.rules) return result;
        ["invite", "bet", "deposit", "milestone"].forEach(function (key) {
          if (saved.rules[key]) result[key] = saved.rules[key];
        });
      } catch (error) {
        return result;
      }
      return result;
    }

    function formatAmount(value) {
      return Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
    }

    function activeBands(type, level) {
      var rule = config[type] || {};
      var tiers = Array.isArray(rule.tiers) ? rule.tiers : [];
      var bands = Array.isArray(tiers[level - 1]) ? tiers[level - 1] : [];
      return bands.filter(function (band) {
        return Array.isArray(band) && band.length === 3 && Number.isFinite(Number(band[0])) && Number.isFinite(Number(band[1])) && Number(band[2]) > 0;
      });
    }

    function findBand(type, level, amount) {
      if (amount <= 0 || !config[type] || config[type].enabled === false) return null;
      return activeBands(type, level).find(function (band) {
        var minimum = Number(band[0]);
        var maximum = Number(band[1]);
        return amount >= minimum && (maximum === 0 || amount < maximum);
      }) || null;
    }

    function rewardFor(type, level, amount) {
      var band = findBand(type, level, amount);
      return band ? amount * Number(band[2]) / 100 : 0;
    }

    function earnedMilestones(row) {
      return String(row.dataset.milestoneEarned || "").split(",").filter(Boolean).map(Number);
    }

    function milestoneReward(row) {
      var rule = config.milestone || {};
      if (rule.enabled === false || !Array.isArray(rule.rows)) return 0;
      var earned = earnedMilestones(row);
      return rule.rows.reduce(function (sum, milestone) {
        return Array.isArray(milestone) && earned.indexOf(Number(milestone[0])) !== -1 ? sum + Number(milestone[1] || 0) : sum;
      }, 0);
    }

    function updateTierCell(row, level, type, amount) {
      var isBet = type === "bet";
      var cell = row.cells[7 + (level - 1) * 2 + (isBet ? 1 : 0)];
      cell.textContent = formatAmount(amount);
    }

    function updateRowAmounts(row) {
      var betTotal = 0;
      var depositTotal = 0;
      for (var level = 1; level <= 4; level += 1) {
        var betAmount = Number(row.dataset["bet" + level] || 0);
        var depositAmount = Number(row.dataset["deposit" + level] || 0);
        var betReward = rewardFor("bet", level, betAmount);
        var depositReward = rewardFor("deposit", level, depositAmount);
        betTotal += betReward;
        depositTotal += depositReward;
        updateTierCell(row, level, "bet", betAmount);
        updateTierCell(row, level, "deposit", depositAmount);
      }
      var validInvites = Number(row.dataset.validInvites || 0);
      var inviteRule = config.invite || {};
      var inviteReward = inviteRule.enabled === false ? 0 : validInvites * Number(inviteRule.reward || 0);
      var milestoneAmount = milestoneReward(row);
      var periodTotal = betTotal + depositTotal + inviteReward + milestoneAmount;
      row.dataset.bet = String(betTotal);
      row.dataset.deposit = String(depositTotal);
      row.dataset.invite = String(inviteReward);
      row.dataset.milestone = String(milestoneAmount);
      row.cells[15].textContent = formatAmount(betTotal);
      row.cells[16].textContent = formatAmount(depositTotal);
      row.cells[17].textContent = formatAmount(inviteReward);
      row.cells[18].textContent = formatAmount(milestoneAmount);
      row.cells[19].textContent = formatAmount(periodTotal);
    }

    function showToast(message) {
      var toast = page.querySelector("#reportToast");
      toast.textContent = message;
      toast.hidden = false;
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(function () { toast.hidden = true; }, 1800);
    }

    function applyFilters() {
      var start = page.querySelector("#dateStart").value;
      var end = page.querySelector("#dateEnd").value;
      var code = page.querySelector("#agentCode").value.trim().toLocaleLowerCase();
      var account = page.querySelector("#agentAccount").value.trim().toLocaleLowerCase();
      var parent = page.querySelector("#parentAgent").value.trim().toLocaleLowerCase();
      var visible = 0;

      rows.forEach(function (row) {
        var parentText = row.dataset.parent.toLocaleLowerCase();
        var matches = (!start || row.dataset.date >= start) && (!end || row.dataset.date <= end) &&
          (!code || row.dataset.code.toLocaleLowerCase().indexOf(code) !== -1) &&
          (!account || row.dataset.account.toLocaleLowerCase().indexOf(account) !== -1) &&
          (!parent || parentText.indexOf(parent) !== -1);
        row.hidden = !matches;
        if (matches) visible += 1;
      });

      emptyRow.hidden = visible !== 0;
      count.textContent = "共 " + visible + " 条记录";
      total.textContent = String(visible);
    }

    function exportVisible() {
      var headers = ["代理编码", "代理账号", "上级代理", "新增直属人数", "有效邀请人数", "首充人数", "首充金额", "一级充值金额", "一级有效打码", "二级充值金额", "二级有效打码", "三级充值金额", "三级有效打码", "四级充值金额", "四级有效打码", "打码返利", "充值返利", "邀请奖励", "里程碑奖励", "时间段收益合计", "累计直属人数", "累计有效邀请人数", "累计总下级人数", "累计收益"];
      var values = rows.filter(function (row) { return !row.hidden; }).map(function (row) {
        return Array.prototype.map.call(row.cells, function (cell) { return cell.textContent.trim(); });
      });
      if (!values.length) {
        showToast("当前筛选没有可导出的记录");
        return;
      }
      var csv = [headers].concat(values).map(function (line) {
        return line.map(function (cell) { return '"' + cell.replace(/"/g, '""') + '"'; }).join(",");
      }).join("\r\n");
      var blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "新代理数据查询.csv";
      link.click();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
      showToast("已导出 " + values.length + " 条记录");
    }

    rows.forEach(updateRowAmounts);
    form.addEventListener("submit", function (event) { event.preventDefault(); applyFilters(); });
    page.querySelector("#resetFilters").addEventListener("click", function () {
      form.reset();
      applyFilters();
      showToast("筛选条件已重置");
    });
    page.querySelector("#exportReport").addEventListener("click", exportVisible);
  });
})();
