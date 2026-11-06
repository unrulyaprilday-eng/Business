(function () {
  'use strict';
  function init() {
    var root = document.getElementById('rfApprovalPanel');
    if (!root || root.dataset.rfaReady) return;
    var ids = ['rfaRows', 'rfaRuleForm', 'rfaRuleEdit', 'rfaRuleSave', 'rfaRuleCancel', 'rfaRuleSummary', 'rfaSavedStatus', 'rfaSavedLimit', 'rfaAutoSwitch', 'rfaLimit', 'rfaFilterForm', 'rfaDateField', 'rfaModal', 'rfaDecisionForm', 'rfaDetail', 'rfaReason'];
    if (ids.some(function (id) { return !document.getElementById(id); })) return;
    root.dataset.rfaReady = 'true';
    function el(id) { return document.getElementById(id); }
    var ruleKey = 'business.reliefFund.approvalRule.v1';
    var rowsKey = 'business.reliefFund.approvalRows.v1';
    var rule = { enabled: false, limit: '' };
    var rows = [
      { id: 'JJ202611060008', account: 'member1008', level: 'VIP3', amount: 18.8, time: '2026-11-06 14:28:16', status: 'pending', method: '', handled: '', reason: '' },
      { id: 'JJ202611060007', account: 'member1007', level: 'VIP2', amount: 8, time: '2026-11-06 13:52:09', status: 'pending', method: '', handled: '', reason: '' },
      { id: 'JJ202611060006', account: 'member1006', level: 'VIP5', amount: 50, time: '2026-11-06 12:40:35', status: 'pending', method: '', handled: '', reason: '' },
      { id: 'JJ202611060005', account: 'member1005', level: 'VIP1', amount: 5, time: '2026-11-06 11:21:03', status: 'paid', method: '自动审批', handled: '2026-11-06 11:21:03', reason: '申请时金额未超过当时自动审批上限，审批通过并直接发放。' },
      { id: 'JJ202611060004', account: 'member1004', level: 'VIP4', amount: 30, time: '2026-11-06 10:32:55', status: 'paid', method: '人工审批', handled: '2026-11-06 10:36:20', reason: '人工审批通过并直接发放。' },
      { id: 'JJ202611050003', account: 'member1003', level: 'VIP2', amount: 10, time: '2026-11-05 19:15:22', status: 'rejected', method: '人工审批', handled: '2026-11-05 19:23:10', reason: '不符合救济金申请条件，本次申请不再领取。' },
      { id: 'JJ202611050002', account: 'member1002', level: 'VIP1', amount: 5, time: '2026-11-05 17:04:51', status: 'paid', method: '自动审批', handled: '2026-11-05 17:04:51', reason: '申请时金额未超过当时自动审批上限，审批通过并直接发放。' },
      { id: 'JJ202611050001', account: 'member1001', level: 'VIP3', amount: 20, time: '2026-11-05 15:30:28', status: 'pending', method: '', handled: '', reason: '' }
    ].map(function (row, index) {
      var rate = row.level === 'VIP5' ? 4 : /VIP[34]/.test(row.level) ? 3 : 2;
      var amount = [1500, 1000, 4000, 1000, 3000, 1000, 1000, 1800][index];
      var loss = Math.round(amount * 100 / rate);
      return Object.assign(row, { amount: amount, cycle: '每日一次', statisticsDate: row.time.slice(0, 10) === '2026-11-06' ? '2026-11-05' : '2026-11-04', yesterdayRecharge: index % 2 ? 50000 : 100000, yesterdayLoss: loss, wageringAmount: loss * 3, gameCount: [180, 126, 268, 115, 226, 108, 132, 156][index], rechargeThreshold: 50000, lossThreshold: 50000, rate: rate, cap: 88990000, target: '余额', reason: row.status === 'rejected' ? '审核资料存在异常，本次申请已拒绝，请联系客服核实。' : row.reason });
    });
    var page = 1, pageSize = 5, criteria = { account: '', status: '', dateField: 'statisticsDate', from: '', to: '' }, active = null, lastFocus = null;
    var statusNames = { pending: '待审批', paid: '已发放', rejected: '已拒绝' };
    function money(value) { return /^\d{1,10}(\.\d{1,2})?$/.test(String(value)) && Number(value) > 0; }
    function nonnegative(value) { return /^\d{1,10}(\.\d{1,2})?$/.test(String(value)); }
    function count(value) { return (typeof value === 'number' || typeof value === 'string' && /^\d+$/.test(value)) && Number.isSafeInteger(Number(value)) && Number(value) >= 0; }
    function snapshotMoney(value) { return nonnegative(value) ? Number(value).toFixed(2) : '—'; }
    function snapshotCount(value) { return count(value) ? String(Number(value)) : '—'; }
    function validRow(item) { return item && typeof item.id === 'string' && typeof item.account === 'string' && typeof item.level === 'string' && money(item.amount) && typeof item.time === 'string' && typeof item.handled === 'string' && typeof item.method === 'string' && typeof item.reason === 'string' && Object.prototype.hasOwnProperty.call(statusNames, item.status); }
    function message(id, text, success) { el(id).textContent = text; el(id).classList.toggle('is-success', !!success); }
    try {
      var savedRule = JSON.parse(localStorage.getItem(ruleKey) || 'null');
      if (savedRule && typeof savedRule.enabled === 'boolean' && (!savedRule.enabled || money(savedRule.limit))) rule = { enabled: savedRule.enabled, limit: money(savedRule.limit) ? Number(savedRule.limit).toFixed(2) : '' };
      var savedRows = JSON.parse(localStorage.getItem(rowsKey) || 'null');
      if (Array.isArray(savedRows) && savedRows.length && savedRows.every(validRow) && new Set(savedRows.map(function (item) { return item.id; })).size === savedRows.length) rows = savedRows;
    } catch (error) { message('rfaListMessage', '浏览器数据不可用，已加载示例记录；请检查浏览器存储设置。'); }
    var persistedRule = Object.assign({}, rule);
    var editingRule = false;
    function cents(value) { var parts = String(value).split('.'); return Number(parts[0]) * 100 + Number((parts[1] || '').padEnd(2, '0')); }
    function renderRule() {
      el('rfaRuleSummary').hidden = editingRule;
      el('rfaRuleForm').hidden = !editingRule;
      el('rfaRuleEdit').hidden = editingRule;
      el('rfaRuleEdit').setAttribute('aria-expanded', String(editingRule));
      el('rfaSavedStatus').textContent = persistedRule.enabled ? '开启' : '关闭';
      el('rfaSavedStatus').classList.toggle('is-enabled', persistedRule.enabled);
      el('rfaSavedLimit').textContent = persistedRule.limit || '未设置';
      el('rfaAutoSwitch').disabled = !editingRule;
      el('rfaAutoSwitch').setAttribute('aria-checked', String(rule.enabled));
      el('rfaSwitchText').textContent = rule.enabled ? '开启' : '关闭';
      el('rfaLimit').disabled = !editingRule || !rule.enabled;
      el('rfaRuleSave').disabled = !editingRule;
      el('rfaRuleCancel').disabled = !editingRule;
    }
    el('rfaLimit').value = rule.limit || '';
    renderRule();
    el('rfaRuleEdit').addEventListener('click', function () {
      rule = Object.assign({}, persistedRule);
      el('rfaLimit').value = rule.limit;
      editingRule = true;
      renderRule();
      message('rfaRuleMessage', '编辑中的规则尚未生效，保存后仅对新申请生效。');
      el('rfaAutoSwitch').focus();
    });
    el('rfaRuleCancel').addEventListener('click', function () {
      rule = Object.assign({}, persistedRule);
      el('rfaLimit').value = rule.limit;
      editingRule = false;
      renderRule();
      message('rfaRuleMessage', '');
      el('rfaRuleEdit').focus();
    });
    el('rfaAutoSwitch').addEventListener('click', function () {
      if (!editingRule) return;
      rule.enabled = !rule.enabled;
      renderRule();
      message('rfaRuleMessage', '编辑中的规则尚未生效，请保存后生效。');
    });
    el('rfaLimit').addEventListener('input', function () { if (editingRule) message('rfaRuleMessage', '编辑中的规则尚未生效，请保存后生效。'); });
    el('rfaRuleForm').addEventListener('submit', function (event) {
      event.preventDefault();
      if (!editingRule) return;
      var limit = el('rfaLimit').value.trim();
      if (rule.enabled && !money(limit)) { message('rfaRuleMessage', '请输入大于 0、最多两位小数的金额上限（最多10位整数）。'); el('rfaLimit').focus(); return; }
      var nextRule = { enabled: rule.enabled, limit: money(limit) ? Number(limit).toFixed(2) : '' };
      try { localStorage.setItem(ruleKey, JSON.stringify(nextRule)); }
      catch (error) { message('rfaRuleMessage', '保存失败，浏览器存储不可用；规则未生效。'); return; }
      rule = nextRule;
      persistedRule = Object.assign({}, nextRule);
      el('rfaLimit').value = rule.limit;
      editingRule = false;
      renderRule();
      message('rfaRuleMessage', '规则已保存，仅对新申请生效，历史待审批记录保持不变。', true);
      el('rfaRuleEdit').focus();
    });
    function esc(value) { return String(value).replace(/[&<>"']/g, function (char) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]; }); }
    function render() {
      var filtered = rows.filter(function (row) {
        var date = criteria.dateField === 'time' ? row.time.slice(0, 10) : row.statisticsDate;
        return row.account.toLowerCase().indexOf(criteria.account) !== -1 && (!criteria.status || criteria.status === row.status) && (!criteria.from || !!date && date >= criteria.from) && (!criteria.to || !!date && date <= criteria.to);
      });
      var pages = Math.max(1, Math.ceil(filtered.length / pageSize));
      page = Math.min(page, pages);
      el('rfaRows').innerHTML = filtered.slice((page - 1) * pageSize, page * pageSize).map(function (row) {
        var actions = row.status === 'pending' ? '<button type="button" class="rfa-link" data-rfa-action="approve" data-rfa-id="' + esc(row.id) + '">通过</button><button type="button" class="rfa-link rfa-link-danger" data-rfa-action="reject" data-rfa-id="' + esc(row.id) + '">拒绝</button>' : '<button type="button" class="rfa-link" data-rfa-action="view" data-rfa-id="' + esc(row.id) + '">查看</button>';
        return '<tr><td>' + esc(row.id) + '</td><td>' + esc(row.account) + '</td><td>' + esc(row.level) + '</td><td>' + esc(row.statisticsDate || '—') + '</td><td class="rfa-num">' + snapshotMoney(row.yesterdayRecharge) + '</td><td class="rfa-num">' + snapshotMoney(row.yesterdayLoss) + '</td><td class="rfa-num">' + snapshotMoney(row.wageringAmount) + '</td><td class="rfa-num">' + snapshotCount(row.gameCount) + '</td><td class="rfa-num">' + Number(row.amount).toFixed(2) + '</td><td>商户金币</td><td>' + esc(row.time) + '</td><td><span class="rfa-tag ' + row.status + '">' + statusNames[row.status] + '</span></td><td>' + esc(row.method || '—') + '</td><td>' + actions + '</td></tr>';
      }).join('') || '<tr><td colspan="14" class="rfa-empty">暂无符合条件的申请记录</td></tr>';
      el('rfaCount').textContent = '共 ' + filtered.length + ' 条';
      el('rfaPage').textContent = page + ' / ' + pages;
      el('rfaPrev').disabled = page <= 1;
      el('rfaNext').disabled = page >= pages;
    }
    el('rfaFilterForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var from = el('rfaDateFrom').value, to = el('rfaDateTo').value;
      if (from && to && from > to) { message('rfaListMessage', '开始日期不能晚于结束日期。'); return; }
      criteria = { account: el('rfaAccount').value.trim().toLowerCase(), status: el('rfaStatus').value, dateField: el('rfaDateField').value === 'time' ? 'time' : 'statisticsDate', from: from, to: to };
      page = 1; message('rfaListMessage', ''); render();
    });
    el('rfaFilterForm').addEventListener('reset', function () { criteria = { account: '', status: '', dateField: 'statisticsDate', from: '', to: '' }; page = 1; message('rfaListMessage', ''); render(); });
    el('rfaPrev').addEventListener('click', function () { if (page > 1) { page--; render(); } });
    el('rfaNext').addEventListener('click', function () { page++; render(); });
    // 新申请接入：detail = { account, level, amount, cycle, target,
    // statisticsDate, yesterdayRecharge, yesterdayLoss, wageringAmount, gameCount,
    // rechargeThreshold, lossThreshold, rate, cap }。
    // statisticsDate 为站点时区的完整统计日，非申请提交日；所有数据和门槛均为该日快照。
    // amount 为已经计算好的救济金，cycle / target 为提交时的周期和入账目标快照。
    root.addEventListener('relief-fund:application', function (event) {
      var input = event.detail || {};
      function report(result) { root.dispatchEvent(new CustomEvent('relief-fund:application-result', { detail: result })); }
      var validDate = typeof input.statisticsDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.statisticsDate) && !isNaN(Date.parse(input.statisticsDate)) && new Date(input.statisticsDate).toISOString().slice(0, 10) === input.statisticsDate;
      if (typeof input.account !== 'string' || !input.account.trim() || input.account.length > 80 || typeof input.level !== 'string' || !input.level.trim() || input.level.length > 30 || !money(input.amount) || typeof input.cycle !== 'string' || !input.cycle.trim() || input.cycle.length > 120 || typeof input.target !== 'string' || !input.target.trim() || input.target.length > 200 || !validDate || !nonnegative(input.yesterdayRecharge) || !nonnegative(input.yesterdayLoss) || !nonnegative(input.wageringAmount) || !count(input.gameCount) || !nonnegative(input.rechargeThreshold) || !nonnegative(input.lossThreshold) || !nonnegative(input.rate) || Number(input.rate) > 100 || !money(input.cap)) {
        report({ ok: false, error: '申请资料无效，请提供账号、VIP、周期、救济金、入账目标及完整统计日快照（充值、亏损、打码量、游戏次数、门槛、比例、上限）；金额最多两位小数，游戏次数须为非负安全整数，返还比例须在0至100之间。' });
        return;
      }
      var account = input.account.trim();
      var duplicate = rows.some(function (item) { return item.account.toLowerCase() === account.toLowerCase() && item.statisticsDate === input.statisticsDate && item.cycle === input.cycle.trim(); });
      if (duplicate) { report({ ok: false, error: '该会员在此统计日期和周期内已提交申请，请勿重复申请。' }); return; }
      var paid = persistedRule.enabled && cents(input.amount) <= cents(persistedRule.limit);
      var created = now();
      var id = 'JJ' + Date.now() + String(rows.length + 1).padStart(4, '0');
      var row = { id: id, account: account, level: input.level.trim(), amount: cents(input.amount) / 100, time: created, status: paid ? 'paid' : 'pending', method: paid ? '自动审批' : '', handled: paid ? created : '', reason: paid ? '申请金额未超过提交时自动审批上限，审批通过并直接发放。' : '', cycle: input.cycle.trim(), target: input.target.trim(), statisticsDate: input.statisticsDate, yesterdayRecharge: Number(input.yesterdayRecharge), yesterdayLoss: Number(input.yesterdayLoss), wageringAmount: Number(input.wageringAmount), gameCount: Number(input.gameCount), rechargeThreshold: Number(input.rechargeThreshold), lossThreshold: Number(input.lossThreshold), rate: Number(input.rate), cap: Number(input.cap), ruleSnapshot: { enabled: persistedRule.enabled, limit: persistedRule.limit } };
      var next = [row].concat(rows);
      try { localStorage.setItem(rowsKey, JSON.stringify(next)); }
      catch (error) { report({ ok: false, error: '浏览器存储不可用，申请未提交。' }); return; }
      rows = next; page = 1; render();
      message('rfaListMessage', paid ? '新申请已自动审批通过并直接发放（原型演示）。' : '新申请已提交，等待人工审批（原型演示）。', true);
      report({ ok: true, id: id, status: row.status, amount: row.amount, cycle: row.cycle, target: row.target });
    });
    function close() { el('rfaModal').hidden = true; active = null; if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); else el('rfaAccount').focus(); }
    root.querySelectorAll('[data-rfa-close]').forEach(function (button) { button.addEventListener('click', close); });
    function detail(label, value) { return '<dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd>'; }
    el('rfaRows').addEventListener('click', function (event) {
      var button = event.target.closest('[data-rfa-action]');
      if (!button) return;
      var row = rows.find(function (item) { return item.id === button.dataset.rfaId; });
      if (!row || (button.dataset.rfaAction !== 'view' && row.status !== 'pending')) return;
      active = { id: row.id, action: button.dataset.rfaAction };
      lastFocus = button;
      el('rfaModalTitle').textContent = active.action === 'view' ? '处理结果' : active.action === 'approve' ? '通过申请' : '拒绝申请';
      el('rfaDetail').innerHTML = detail('申请单号', row.id) + detail('会员账号', row.account) + detail('会员等级', row.level) + detail('申请金额', Number(row.amount).toFixed(2)) + detail('币种', '商户金币') + detail('申请时间', row.time) + (active.action === 'view' ? detail('审批状态', statusNames[row.status]) + detail('审批方式', row.method) + detail('处理时间', row.handled) + detail('处理说明', row.reason) : '');
      if (row.cycle) el('rfaDetail').innerHTML += detail('申请周期', row.cycle);
      if (row.target) el('rfaDetail').innerHTML += detail('入账目标', row.target);
      el('rfaDetail').innerHTML += detail('数据日期', row.statisticsDate || '—') + detail('统计口径', '站点时区统计日，非申请提交日；以下数据及资格门槛均为申请时保存的该日快照。') + detail('当日充值', snapshotMoney(row.yesterdayRecharge)) + detail('当日亏损', snapshotMoney(row.yesterdayLoss)) + detail('当日打码量', snapshotMoney(row.wageringAmount)) + detail('游戏次数', snapshotCount(row.gameCount)) + detail('充值门槛', snapshotMoney(row.rechargeThreshold)) + detail('亏损门槛', snapshotMoney(row.lossThreshold)) + detail('返还比例', nonnegative(row.rate) && Number(row.rate) <= 100 ? Number(row.rate) + '%' : '—') + detail('奖励上限', snapshotMoney(row.cap));
      el('rfaDecisionHint').textContent = active.action === 'approve' ? '确认通过后将直接发放本次救济金，无需会员再次领取。' : active.action === 'reject' ? '拒绝后本次申请不再领取，请填写拒绝理由。' : '';
      el('rfaReasonField').hidden = active.action !== 'reject';
      el('rfaReason').required = active.action === 'reject';
      el('rfaReason').value = '';
      el('rfaConfirm').textContent = active.action === 'view' ? '确定' : active.action === 'approve' ? '确定通过并发放' : '确定拒绝';
      message('rfaModalMessage', '');
      el('rfaModal').hidden = false;
      if (active.action === 'reject') el('rfaReason').focus(); else el('rfaConfirm').focus();
    });
    function now() { var date = new Date(); function pad(value) { return String(value).padStart(2, '0'); } return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds()); }
    el('rfaDecisionForm').addEventListener('submit', function (event) {
      event.preventDefault();
      if (!active) return;
      if (active.action === 'view') { close(); return; }
      var row = rows.find(function (item) { return item.id === active.id; });
      if (!row || row.status !== 'pending') { message('rfaModalMessage', '该申请已处理，请关闭后重新查询。'); return; }
      var reason = el('rfaReason').value.trim();
      if (active.action === 'reject' && !reason) { message('rfaModalMessage', '请填写拒绝理由。'); el('rfaReason').focus(); return; }
      var next = rows.map(function (item) { return item.id !== row.id ? item : Object.assign({}, item, { status: active.action === 'approve' ? 'paid' : 'rejected', method: '人工审批', handled: now(), reason: active.action === 'approve' ? '人工审批通过并直接发放。' : reason }); });
      try { localStorage.setItem(rowsKey, JSON.stringify(next)); }
      catch (error) { message('rfaModalMessage', '保存失败，浏览器存储不可用；本次申请尚未处理，请重试。'); return; }
      var approved = active.action === 'approve';
      rows = next; close(); render(); message('rfaListMessage', approved ? '审批通过，救济金已直接发放（原型演示）。' : '已拒绝，本次申请不再领取（原型演示）。', true);
    });
    el('rfaModal').addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key !== 'Tab') return;
      var focusable = Array.prototype.filter.call(el('rfaModal').querySelectorAll('button, textarea'), function (node) { return !node.disabled && node.getClientRects().length; });
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
