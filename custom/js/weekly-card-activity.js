(function () {
  'use strict';
  var STORAGE_KEY = 'promoWeeklyCardActivities';
  var MAX_TIERS = 7;
  var LIST_URL = '优惠活动列表.html';
  var editId = new URLSearchParams(window.location.search).get('weeklyCardId');
  var original = null;
  var invalidEdit = false;
  var activeRow = null;
  var returnFocus = null;
  var rowTemplate;
  var imageState = { Banner: { source: '', busy: false, version: 0 }, Detail: { source: '', busy: false, version: 0 } };

  function byId(id) { return document.getElementById(id); }
  function each(nodes, callback) { Array.prototype.forEach.call(nodes, callback); }
  function fail(message, control) {
    var error = byId('weeklyCardError');
    error.textContent = message;
    error.hidden = false;
    if (control) { control.focus(); }
    error.scrollIntoView({ block: 'nearest' });
    return false;
  }
  function clearError() { if (!invalidEdit) { byId('weeklyCardError').hidden = true; } }
  function getRecords() {
    var records = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(records) || records.some(function (item) { return !item || typeof item.id !== 'string' || !item.id; })) {
      throw new Error('Invalid weekly card storage');
    }
    return records;
  }
  function amountCents(value, positive) {
    if (value == null || String(value).trim() === '') { return null; }
    var amount = Number(value);
    var cents = Math.round(amount * 100);
    if (!Number.isFinite(amount) || amount < 0 || (positive && amount === 0) || !Number.isSafeInteger(cents) || Math.abs(amount * 100 - cents) > 0.000001) { return null; }
    return cents;
  }
  function totalCents(values) {
    var total = 0;
    for (var index = 0; index < values.length; index++) {
      var cents = amountCents(values[index], false);
      if (cents === null) { return null; }
      total += cents;
    }
    return Number.isSafeInteger(total) ? total : null;
  }
  function formatCents(cents) { return cents === null ? '—' : (cents / 100).toLocaleString('en-US', { maximumFractionDigits: 2 }); }
  function getDailyValues(row) {
    try {
      var values = JSON.parse(row.getAttribute('data-daily-rewards') || '[]');
      if (Array.isArray(values) && values.length === 7) { return values; }
    } catch (error) { /* Invalid row data is shown as unconfigured. */ }
    return ['', '', '', '', '', '', ''];
  }
  function syncRows() {
    var rows = byId('weeklyCardTierRows').querySelectorAll('tr');
    each(rows, function (row, index) {
      var values = getDailyValues(row);
      var configured = values.filter(function (value) { return amountCents(value, false) !== null; }).length;
      var dailyTotal = totalCents(values);
      var immediate = amountCents(row.querySelector('.wc-tier-immediate').value, false);
      var grandTotal = dailyTotal !== null && immediate !== null && Number.isSafeInteger(dailyTotal + immediate) ? dailyTotal + immediate : null;
      row.querySelector('.wc-tier-index').textContent = '第' + (index + 1) + '档';
      row.querySelector('.wc-tier-deposit').setAttribute('aria-label', '第' + (index + 1) + '档充值金额');
      row.querySelector('.wc-tier-immediate').setAttribute('aria-label', '第' + (index + 1) + '档即时奖励');
      row.querySelector('[data-wc-configure-days]').textContent = configured === 7 ? '编辑7日奖励' : '配置7日奖励';
      row.querySelector('.wc-day-status').textContent = '已配置 ' + configured + ' / 7 日';
      each(row.querySelectorAll('[data-wc-preview-day]'), function (preview, dayIndex) {
        var cents = amountCents(values[dayIndex], false);
        preview.textContent = formatCents(cents);
        preview.setAttribute('data-empty', String(cents === null));
        preview.setAttribute('title', '第' + (dayIndex + 1) + '日' + (dayIndex === 0 ? '（充值当日）' : '') + '奖励：' + (cents === null ? '未配置' : formatCents(cents)));
      });
      row.querySelector('.wc-daily-total').textContent = formatCents(dailyTotal);
      row.querySelector('.wc-grand-total').textContent = formatCents(grandTotal);
      row.querySelector('[data-wc-delete-tier]').disabled = rows.length <= 1;
    });
    byId('weeklyCardTierCount').textContent = '已配置 ' + rows.length + ' / ' + MAX_TIERS + ' 档';
    byId('weeklyCardAddTier').disabled = rows.length >= MAX_TIERS;
  }
  function createRow(tier) {
    var row = rowTemplate.cloneNode(true);
    tier = tier || {};
    row.querySelector('.wc-tier-deposit').value = tier.deposit == null ? '' : tier.deposit;
    row.querySelector('.wc-tier-immediate').value = tier.immediateReward == null ? '' : tier.immediateReward;
    var rewards = Array.isArray(tier.dailyRewards) ? tier.dailyRewards : [];
    row.setAttribute('data-daily-rewards', JSON.stringify([1, 2, 3, 4, 5, 6, 7].map(function (day) {
      var item = rewards.find(function (reward) { return reward && Number(reward.day) === day; });
      return item && item.reward != null ? item.reward : '';
    })));
    return row;
  }
  function syncDayTotal() {
    var values = Array.prototype.map.call(byId('weeklyCardDayForm').querySelectorAll('[data-wc-day]'), function (input) { return input.value; });
    byId('weeklyCardDayTotal').textContent = formatCents(totalCents(values));
  }
  function openDays(row, trigger) {
    var rows = Array.prototype.slice.call(byId('weeklyCardTierRows').children);
    var values = getDailyValues(row);
    activeRow = row;
    returnFocus = trigger || row.querySelector('[data-wc-configure-days]');
    byId('weeklyCardDayModalTitle').textContent = '配置7日奖励 · 第' + (rows.indexOf(row) + 1) + '档';
    each(byId('weeklyCardDayForm').querySelectorAll('[data-wc-day]'), function (input, index) { input.value = values[index]; });
    byId('weeklyCardDayError').hidden = true;
    syncDayTotal();
    byId('weeklyCardDayModal').hidden = false;
    byId('base').inert = true;
    byId('weeklyCardDayForm').querySelector('input').focus();
  }
  function closeDays() {
    byId('weeklyCardDayModal').hidden = true;
    byId('base').inert = false;
    activeRow = null;
    if (returnFocus && returnFocus.isConnected) { returnFocus.focus(); }
    returnFocus = null;
  }
  function confirmDays(event) {
    event.preventDefault();
    var form = byId('weeklyCardDayForm');
    if (!activeRow || !activeRow.isConnected || !form.reportValidity()) { return; }
    var inputs = Array.prototype.slice.call(form.querySelectorAll('[data-wc-day]'));
    var values = inputs.map(function (input) { return input.value; });
    var invalid = inputs.find(function (input) { return amountCents(input.value, false) === null; });
    if (invalid || totalCents(values) === null) {
      byId('weeklyCardDayError').textContent = '请填写有效的7日奖励金额，金额不得为负数，最多两位小数，且合计不得超出可处理范围。';
      byId('weeklyCardDayError').hidden = false;
      if (invalid) { invalid.focus(); }
      return;
    }
    activeRow.setAttribute('data-daily-rewards', JSON.stringify(values));
    syncRows();
    closeDays();
    clearError();
  }
  function sanitizeDescription(html) {
    var template = document.createElement('template');
    var allowed = { P: true, BR: true, STRONG: true, B: true, EM: true, I: true, U: true, UL: true, OL: true, LI: true, H2: true, H3: true, BLOCKQUOTE: true };
    template.innerHTML = html || '';
    function clean(parent) {
      Array.prototype.slice.call(parent.childNodes).forEach(function (node) {
        if (node.nodeType !== 1) { if (node.nodeType !== 3) { node.remove(); } return; }
        if (!allowed[node.tagName]) {
          if (/^(SCRIPT|STYLE|IFRAME|OBJECT|SVG|MATH)$/.test(node.tagName)) { node.remove(); return; }
          clean(node);
          while (node.firstChild) { parent.insertBefore(node.firstChild, node); }
          node.remove();
          return;
        }
        each(Array.prototype.slice.call(node.attributes), function (attribute) { node.removeAttribute(attribute.name); });
        clean(node);
      });
    }
    clean(template.content);
    return template.innerHTML;
  }
  function collectRecord() {
    var target = document.querySelector('input[name="weeklyCardRewardTarget"]:checked');
    return {
      id: editId || 'weekly-card-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      name: byId('weeklyCardName').value.trim(), title: byId('weeklyCardTitle').value.trim(),
      rewardTarget: target ? target.value : '余额',
      startTime: byId('weeklyCardStartTime').value,
      endTime: byId('weeklyCardLongTerm').checked ? '' : byId('weeklyCardEndTime').value,
      endTimeFallback: byId('weeklyCardEndTime').dataset.longTermFallback || '',
      longTerm: byId('weeklyCardLongTerm').checked,
      sort: byId('weeklyCardSort').value, enabled: byId('weeklyCardEnabled').checked,
      sameIpOnce: byId('weeklyCardSameIpOnce').checked,
      sameWithdrawalAccountOnce: byId('weeklyCardWithdrawalAccountOnce').checked,
      wagerMultiple: byId('weeklyCardWagerMultiple').value, dayBoundary: 'site-local-calendar-day',
      tiers: Array.prototype.map.call(byId('weeklyCardTierRows').querySelectorAll('tr'), function (row) {
        return { deposit: row.querySelector('.wc-tier-deposit').value, immediateReward: row.querySelector('.wc-tier-immediate').value,
          dailyRewards: getDailyValues(row).map(function (reward, index) { return { day: index + 1, reward: reward }; }) };
      }),
      bannerImage: imageState.Banner.source, detailImage: imageState.Detail.source,
      descriptionHtml: sanitizeDescription(byId('weeklyCardDescription').innerHTML)
    };
  }
  function validateRecord(record) {
    if (!record.name || !record.title) { return '请填写活动名称和活动标题，不能只输入空格。'; }
    var start = new Date(record.startTime).getTime();
    var end = new Date(record.endTime).getTime();
    if (!Number.isFinite(start) || (!record.longTerm && (!Number.isFinite(end) || end <= start))) { return '请配置活动时间，结束时间必须晚于开始时间。'; }
    if (String(record.wagerMultiple).trim() === '' || !Number.isFinite(Number(record.wagerMultiple)) || Number(record.wagerMultiple) < 0) { return '打码倍数必须为不小于0的数字。'; }
    if (String(record.sort).trim() === '' || !Number.isSafeInteger(Number(record.sort)) || Number(record.sort) < 0) { return '活动排序必须为不小于0的整数。'; }
    if (!Array.isArray(record.tiers) || record.tiers.length < 1 || record.tiers.length > MAX_TIERS) { return '周卡须配置1至' + MAX_TIERS + '档奖励。'; }
    var previous = 0;
    for (var index = 0; index < record.tiers.length; index++) {
      var tier = record.tiers[index];
      var deposit = amountCents(tier.deposit, true);
      var immediate = amountCents(tier.immediateReward, false);
      if (deposit === null || immediate === null) { return '第' + (index + 1) + '档充值金额须大于0，即时奖励不得为负数；金额最多两位小数。'; }
      if (deposit <= previous) { return '充值金额须按档位递增，不能重复或低于上一档。'; }
      previous = deposit;
      if (!Array.isArray(tier.dailyRewards) || tier.dailyRewards.length !== 7 || tier.dailyRewards.some(function (item, dayIndex) {
        return !item || item.day !== dayIndex + 1 || amountCents(item.reward, false) === null;
      })) { return '请完整配置第' + (index + 1) + '档第1至第7日奖励，金额不得为负数，最多两位小数。'; }
      var total = totalCents(tier.dailyRewards.map(function (item) { return item.reward; }));
      if (total === null || !Number.isSafeInteger(total + immediate)) { return '第' + (index + 1) + '档奖励合计超出可处理范围。'; }
    }
    return '';
  }
  function saveActivity() {
    if (invalidEdit) { return fail('未能载入原活动，请返回活动列表后重新打开。'); }
    if (!byId('weeklyCardDayModal').hidden) { return; }
    if (imageState.Banner.busy || imageState.Detail.busy) { return fail('图片正在读取，请稍后保存。'); }
    var form = byId('weeklyCardForm');
    if (!form.reportValidity()) { return; }
    var record = collectRecord();
    var error = validateRecord(record);
    if (error) { return fail(error); }
    try {
      var records = getRecords();
      var index = records.findIndex(function (item) { return item.id === record.id; });
      if (editId && index < 0) { return fail('该活动已不存在，请返回活动列表后重试。'); }
      if (index < 0) { records.unshift(record); } else {
        records[index] = Object.assign({}, original, record);
        delete records[index].resetTime;
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (storageError) { return fail('保存失败，本地存储不可用、数据异常或空间不足。请检查后重试，当前配置已保留。'); }
    window.location.href = LIST_URL + '?weeklyCardSaved=1';
  }
  function syncLongTerm() {
    var input = byId('weeklyCardEndTime');
    var enabled = byId('weeklyCardLongTerm').checked;
    if (enabled) {
      if (input.value) { input.dataset.longTermFallback = input.value; }
      input.value = '';
    } else if (!input.value) { input.value = input.dataset.longTermFallback || ''; }
    input.disabled = enabled;
    input.required = !enabled;
  }
  function setImage(kind, source) {
    var preview = byId('weeklyCard' + kind + 'Preview');
    imageState[kind].source = source || '';
    if (source) { preview.src = source; } else { preview.removeAttribute('src'); }
    preview.hidden = !source;
    document.querySelector('[data-wc-remove-image="' + kind + '"]').hidden = !source;
  }
  function uploadImage(kind, file) {
    if (!file) { return; }
    var state = imageState[kind];
    var version = ++state.version;
    var max = kind === 'Banner' ? 500 * 1024 : 1024 * 1024;
    state.busy = false;
    if (!new RegExp('^image/(png|jpeg|webp)$').test(file.type) || file.size > max) { return fail('请上传 JPG、PNG 或 WebP 图片；Banner 最大500KB，内页图最大1MB。'); }
    state.busy = true;
    var reader = new FileReader();
    function imageError() { if (version === state.version) { state.busy = false; fail('图片读取失败，请更换有效图片。'); } }
    reader.onerror = imageError;
    reader.onload = function () {
      if (version !== state.version) { return; }
      var preview = new Image();
      preview.onerror = imageError;
      preview.onload = function () {
        if (version !== state.version) { return; }
        state.busy = false;
        setImage(kind, reader.result);
        clearError();
      };
      preview.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
  function loadActivity() {
    if (!editId) { return; }
    try { original = getRecords().find(function (item) { return item.id === editId; }); }
    catch (error) { invalidEdit = true; return fail('本地活动数据读取失败，请返回活动列表后重试。'); }
    if (!original || !Array.isArray(original.tiers) || !original.tiers.length) {
      invalidEdit = true; return fail('活动不存在或档位数据异常，请返回活动列表后重新打开。');
    }
    var fields = { Name: 'name', Title: 'title', StartTime: 'startTime', EndTime: 'endTime', Sort: 'sort', WagerMultiple: 'wagerMultiple' };
    Object.keys(fields).forEach(function (suffix) { if (original[fields[suffix]] != null) { byId('weeklyCard' + suffix).value = original[fields[suffix]]; } });
    var checks = { LongTerm: 'longTerm', Enabled: 'enabled', SameIpOnce: 'sameIpOnce', WithdrawalAccountOnce: 'sameWithdrawalAccountOnce' };
    Object.keys(checks).forEach(function (suffix) { if (typeof original[checks[suffix]] === 'boolean') { byId('weeklyCard' + suffix).checked = original[checks[suffix]]; } });
    each(document.querySelectorAll('input[name="weeklyCardRewardTarget"]'), function (input) { input.checked = input.value === (original.rewardTarget || '余额'); });
    byId('weeklyCardEndTime').dataset.longTermFallback = original.endTimeFallback || original.endTime || '';
    byId('weeklyCardTierRows').textContent = '';
    original.tiers.forEach(function (tier) { byId('weeklyCardTierRows').appendChild(createRow(tier)); });
    if (original.tiers.length > MAX_TIERS) { fail('当前活动超过7档，请删除多余档位后保存。'); }
    ['Banner', 'Detail'].forEach(function (kind) {
      var source = original[kind === 'Banner' ? 'bannerImage' : 'detailImage'];
      if (source && new RegExp('^data:image/(png|jpeg|webp);base64,', 'i').test(source)) { setImage(kind, source); }
    });
    if (typeof original.descriptionHtml === 'string') { byId('weeklyCardDescription').innerHTML = sanitizeDescription(original.descriptionHtml); }
  }
  function ready() {
    var form = byId('weeklyCardForm');
    if (!form || form.getAttribute('data-wc-bound') === 'true' || !byId('weeklyCardDayModal') || !byId('weeklyCardTierRows').firstElementChild) { return; }
    form.setAttribute('data-wc-bound', 'true');
    rowTemplate = byId('weeklyCardTierRows').firstElementChild.cloneNode(true);
    loadActivity();
    syncLongTerm();
    syncRows();
    byId('weeklyCardEnabledText').textContent = byId('weeklyCardEnabled').checked ? '开启' : '关闭';
    byId('weeklyCardLongTerm').addEventListener('change', syncLongTerm);
    byId('weeklyCardEnabled').addEventListener('change', function () { byId('weeklyCardEnabledText').textContent = this.checked ? '开启' : '关闭'; });
    byId('weeklyCardAddTier').addEventListener('click', function () {
      if (byId('weeklyCardTierRows').children.length >= MAX_TIERS) { return; }
      byId('weeklyCardTierRows').appendChild(createRow());
      syncRows(); clearError();
    });
    form.addEventListener('submit', function (event) { event.preventDefault(); saveActivity(); });
    form.addEventListener('input', function (event) { if (event.target.classList.contains('wc-tier-immediate')) { syncRows(); } clearError(); });
    form.addEventListener('click', function (event) {
      var button = event.target.closest('button');
      if (!button) { return; }
      if (button.hasAttribute('data-wc-configure-days')) { openDays(button.closest('tr'), button); }
      if (button.hasAttribute('data-wc-delete-tier') && byId('weeklyCardTierRows').children.length > 1) { button.closest('tr').remove(); syncRows(); clearError(); }
      if (button.hasAttribute('data-wc-upload')) { byId('weeklyCard' + button.getAttribute('data-wc-upload') + 'File').click(); }
      if (button.hasAttribute('data-wc-remove-image')) {
        var kind = button.getAttribute('data-wc-remove-image');
        imageState[kind].version++; imageState[kind].busy = false; setImage(kind, '');
      }
    });
    ['Banner', 'Detail'].forEach(function (kind) {
      var input = byId('weeklyCard' + kind + 'File');
      input.addEventListener('change', function () { uploadImage(kind, input.files && input.files[0]); input.value = ''; });
    });
    each(form.querySelectorAll('[data-wc-command]'), function (button) {
      button.addEventListener('mousedown', function (event) { event.preventDefault(); });
      button.addEventListener('click', function () { byId('weeklyCardDescription').focus(); document.execCommand(button.getAttribute('data-wc-command'), false, null); });
    });
    byId('weeklyCardDescription').addEventListener('paste', function (event) {
      event.preventDefault();
      if (event.clipboardData) { document.execCommand('insertText', false, event.clipboardData.getData('text/plain')); }
    });
    byId('weeklyCardDayForm').addEventListener('input', syncDayTotal);
    byId('weeklyCardDayForm').addEventListener('submit', confirmDays);
    each(byId('weeklyCardDayModal').querySelectorAll('[data-wc-close-days]'), function (button) { button.addEventListener('click', closeDays); });
    byId('weeklyCardDayModal').addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { event.preventDefault(); closeDays(); }
      if (event.key !== 'Tab') { return; }
      var focusable = Array.prototype.slice.call(this.querySelectorAll('button:not([disabled]), input:not([disabled])'));
      var first = focusable[0]; var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    ['u4', 'u5', 'u1'].forEach(function (id, index) {
      var button = byId(id);
      if (!button) { return; }
      button.addEventListener('click', function (event) {
        if (!document.body.classList.contains('weekly-card-template-active')) { return; }
        event.preventDefault(); event.stopImmediatePropagation();
        if (index === 0) { saveActivity(); } else { window.location.href = LIST_URL; }
      }, true);
    });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', ready); } else { ready(); }
})();
