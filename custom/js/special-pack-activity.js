(function () {
  'use strict';
  var STORAGE_KEY = 'promoSpecialPackActivities';
  var LIST_URL = '优惠活动列表.html';
  var CYCLES = ['daily', 'weekly', 'monthly'];
  var LABELS = { daily: '每日礼包', weekly: '每周礼包', monthly: '每月礼包' };
  var editId = new URLSearchParams(window.location.search).get('specialPackId');
  var original = null;
  var invalidEdit = false;
  var cycles = { daily: { enabled: true, tiers: [] }, weekly: { enabled: false, tiers: [] }, monthly: { enabled: false, tiers: [] } };
  var imageState = { Banner: { source: '', busy: false, version: 0 }, Detail: { source: '', busy: false, version: 0 } };

  function byId(id) { return document.getElementById(id); }
  function all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function uid(prefix) { return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10); }
  function message(id, text) { var node = byId(id); node.textContent = text || ''; node.hidden = !text; }
  function fail(text) { message('specialPackError', text); byId('specialPackError').scrollIntoView({ block: 'nearest' }); return false; }
  function clearError() { if (!invalidEdit) { message('specialPackError', ''); } }
  function amountCents(value) {
    if (typeof value !== 'string' && typeof value !== 'number') { return null; }
    var parts = String(value).trim().match(/^(\d+)(?:\.(\d{1,2}))?$/);
    if (!parts) { return null; }
    var cents = Number(parts[1]) * 100 + Number(((parts[2] || '') + '00').slice(0, 2));
    return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
  }
  function money(cents) {
    var fraction = String(cents % 100).padStart(2, '0').replace(/0+$/, '');
    return String(Math.floor(cents / 100)) + (fraction ? '.' + fraction : '');
  }
  function sortedTiers(tiers) { return tiers.slice().sort(function (a, b) { return amountCents(a.amount) - amountCents(b.amount); }); }
  function validateTier(tier, tiers, excludeId) {
    var amount = amountCents(tier.amount);
    var price = amountCents(tier.price);
    if (amount === null || price === null) { return '礼包金额和折后售价必须大于 0，最多保留 2 位小数，且不得超出可处理范围。'; }
    if (price >= amount) { return '折后售价必须小于礼包金额。'; }
    if (tiers.some(function (item) { return item.id !== excludeId && amountCents(item.amount) === amount; })) { return '该类型已存在相同礼包金额，请修改礼包金额；不同售价也不能重复添加。'; }
    return '';
  }
  function getRecords() {
    var records = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(records) || records.some(function (item) { return !item || typeof item.id !== 'string' || !item.id; })) { throw new Error('Invalid special-pack storage'); }
    return records;
  }
  function tierFieldError(key, tier, field) {
    var value = amountCents(tier[field]);
    if (value === null) { return '必填，须大于 0，最多 2 位小数'; }
    if (field === 'amount' && cycles[key].tiers.some(function (item) { return item.id !== tier.id && amountCents(item.amount) === value; })) { return '同类型礼包金额不可重复'; }
    if (field === 'price' && amountCents(tier.amount) !== null && value >= amountCents(tier.amount)) { return '折后售价须小于礼包金额'; }
    return '';
  }
  function syncTierErrors(key) {
    var body = document.querySelector('[data-sp-rows="' + key + '"]');
    all('[data-sp-tier-id]', body).forEach(function (row) {
      var tier = cycles[key].tiers.find(function (item) { return item.id === row.getAttribute('data-sp-tier-id'); });
      var invalid = false;
      ['amount', 'price'].forEach(function (field) {
        var input = row.querySelector('[data-sp-field="' + field + '"]');
        var note = row.querySelector('[data-sp-field-error="' + field + '"]');
        var error = tierFieldError(key, tier, field);
        input.setAttribute('aria-invalid', String(Boolean(error)));
        note.textContent = error; note.hidden = !error;
        invalid = invalid || Boolean(error);
      });
      row.classList.toggle('sp-tier-invalid', invalid);
    });
  }
  function createTierRow(key, tier, index) {
    var row = document.createElement('tr');
    row.setAttribute('data-sp-tier-id', tier.id);
    var numberCell = document.createElement('th'), badge = document.createElement('span');
    numberCell.setAttribute('scope', 'row'); badge.className = 'sp-tier-badge'; badge.textContent = '第' + (index + 1) + '档';
    numberCell.appendChild(badge); row.appendChild(numberCell);
    ['amount', 'price'].forEach(function (field) {
      var cell = document.createElement('td'), input = document.createElement('input'), note = document.createElement('small');
      input.type = 'number'; input.min = '0.01'; input.step = '0.01'; input.value = tier[field];
      input.className = 'sp-tier-input'; input.placeholder = '必填';
      input.setAttribute('aria-required', 'true');
      input.setAttribute('aria-label', LABELS[key] + '第' + (index + 1) + '档' + (field === 'amount' ? '礼包金额' : '折后售价'));
      input.setAttribute('data-sp-field', field);
      note.id = 'sp-error-' + key + '-' + tier.id + '-' + field;
      note.className = 'sp-field-error'; note.setAttribute('data-sp-field-error', field); note.hidden = true;
      input.setAttribute('aria-describedby', note.id);
      input.addEventListener('input', function () { tier[field] = input.value; syncTierErrors(key); clearError(); });
      cell.appendChild(input); cell.appendChild(note); row.appendChild(cell);
    });
    var status = document.createElement('td'), label = document.createElement('label'), enabled = document.createElement('input');
    label.className = 'sp-check'; enabled.type = 'checkbox'; enabled.checked = tier.enabled;
    enabled.setAttribute('aria-label', LABELS[key] + '第' + (index + 1) + '档启用');
    enabled.addEventListener('change', function () { tier.enabled = enabled.checked; clearError(); });
    label.appendChild(enabled);
    var statusText = document.createElement('span'); statusText.textContent = '启用'; label.appendChild(statusText);
    status.appendChild(label); row.appendChild(status);
    var actions = document.createElement('td'), button = document.createElement('button');
    button.type = 'button'; button.className = 'sp-delete-tier'; button.title = '删除档位';
    button.setAttribute('data-sp-delete', key); button.setAttribute('aria-label', '删除第' + (index + 1) + '档');
    button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 6h18M9 6V4h6v2M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>';
    actions.appendChild(button); row.appendChild(actions); return row;
  }
  function renderCycle(key) {
    var cycle = cycles[key], body = document.querySelector('[data-sp-rows="' + key + '"]');
    body.textContent = '';
    if (!cycle.tiers.length) {
      var row = document.createElement('tr'), cell = document.createElement('td');
      cell.colSpan = 5; cell.className = 'sp-empty'; cell.textContent = '暂无档位，请点击下方添加档位。';
      row.appendChild(cell); body.appendChild(row);
    }
    cycle.tiers.forEach(function (tier, index) { body.appendChild(createTierRow(key, tier, index)); });
    var status = document.querySelector('[data-sp-status="' + key + '"]');
    status.textContent = cycle.enabled ? '已开启' : '未开启'; status.setAttribute('data-enabled', String(cycle.enabled));
    document.querySelector('[data-sp-enabled="' + key + '"]').checked = cycle.enabled;
    syncTierErrors(key);
  }
  function focusTier(key, id) {
    var body = document.querySelector('[data-sp-rows="' + key + '"]');
    var row = all('[data-sp-tier-id]', body).find(function (item) { return item.getAttribute('data-sp-tier-id') === id; });
    if (row) { (row.querySelector('[aria-invalid="true"]') || row.querySelector('[data-sp-field="amount"]')).focus(); }
  }
  function addTier(key) {
    var tier = { id: uid('pack-tier'), amount: '', price: '', enabled: true };
    cycles[key].tiers.push(tier); renderCycle(key); focusTier(key, tier.id);
  }
  function collectCycles() {
    return JSON.parse(JSON.stringify(cycles));
  }
  function sanitizeDescription(html) {
    var template = document.createElement('template');
    template.innerHTML = html || '';
    function clean(parent) {
      Array.prototype.slice.call(parent.childNodes).forEach(function (node) {
        if (node.nodeType !== 1) { if (node.nodeType !== 3) { node.remove(); } return; }
        if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|SVG|MATH|LINK|META|IMG|VIDEO|AUDIO)$/.test(node.tagName)) { node.remove(); return; }
        clean(node);
        if (!/^(P|DIV|BR|STRONG|B|EM|I|U|UL|OL|LI|H2|H3|BLOCKQUOTE)$/.test(node.tagName)) {
          while (node.firstChild) { parent.insertBefore(node.firstChild, node); }
          node.remove(); return;
        }
        allAttributes(node).forEach(function (attr) { node.removeAttribute(attr.name); });
      });
    }
    clean(template.content); return template.innerHTML;
  }
  function allAttributes(node) { return Array.prototype.slice.call(node.attributes); }
  function collectRecord() {
    var target = document.querySelector('input[name="specialPackRewardTarget"]:checked');
    return {
      id: editId || uid('special-pack'), template: '特惠礼包',
      name: byId('specialPackName').value.trim(), title: byId('specialPackTitle').value.trim(),
      startTime: byId('specialPackStartTime').value, endTime: byId('specialPackLongTerm').checked ? '' : byId('specialPackEndTime').value,
      endTimeFallback: byId('specialPackEndTime').dataset.longTermFallback || '', longTerm: byId('specialPackLongTerm').checked,
      sort: byId('specialPackSort').value, enabled: byId('specialPackEnabled').checked, wagerMultiple: byId('specialPackWagerMultiple').value,
      rewardTarget: target ? target.value : '余额', currency: 'merchant',
      sameIpOnce: byId('specialPackSameIpOnce').checked, sameWithdrawalAccountOnce: byId('specialPackWithdrawalAccountOnce').checked,
      cycles: collectCycles(),
      bannerImage: imageState.Banner.source, detailImage: imageState.Detail.source, descriptionHtml: sanitizeDescription(byId('specialPackDescription').innerHTML)
    };
  }
  function validateCycles(value) {
    if (!value || typeof value !== 'object') { return '礼包类型数据异常。'; }
    var enabled = 0;
    for (var c = 0; c < CYCLES.length; c++) {
      var key = CYCLES[c], cycle = value[key];
      if (!cycle || typeof cycle.enabled !== 'boolean' || !Array.isArray(cycle.tiers)) { return LABELS[key] + '配置异常。'; }
      var ids = new Set();
      for (var t = 0; t < cycle.tiers.length; t++) {
        var tier = cycle.tiers[t];
        if (!tier || typeof tier.id !== 'string' || !tier.id || ids.has(tier.id) || typeof tier.enabled !== 'boolean') { return LABELS[key] + '档位数据异常。'; }
        ids.add(tier.id);
        var error = validateTier(tier, cycle.tiers.slice(0, t), null);
        if (error) { return LABELS[key] + '：' + error; }
      }
      if (cycle.enabled) {
        enabled++;
        if (!cycle.tiers.some(function (tier) { return tier.enabled; })) { return LABELS[key] + '已开启，请至少配置一个启用的档位。'; }
      }
    }
    return enabled ? '' : '请至少开启一种礼包类型，并配置启用的档位。';
  }
  function validateRecord(record) {
    if (!record.name || !record.title) { return '请填写活动名称和活动标题，不能只输入空格。'; }
    var start = new Date(record.startTime).getTime(), end = new Date(record.endTime).getTime();
    if (!Number.isFinite(start) || (!record.longTerm && (!Number.isFinite(end) || end <= start))) { return '请配置活动时间，结束时间必须晚于开始时间。'; }
    if (String(record.wagerMultiple).trim() === '' || (Number(record.wagerMultiple) !== 0 && amountCents(record.wagerMultiple) === null)) { return '打码倍数须为不小于 0 的数字，最多保留 2 位小数。'; }
    if (String(record.sort).trim() === '' || !Number.isSafeInteger(Number(record.sort)) || Number(record.sort) < 0) { return '活动排序须为不小于 0 的整数。'; }
    return validateCycles(record.cycles);
  }
  function saveActivity() {
    if (invalidEdit) { return fail('未能载入原活动，请返回活动列表后重新打开。'); }
    if (imageState.Banner.busy || imageState.Detail.busy) { return fail('图片正在读取，请稍后保存。'); }
    if (!byId('specialPackForm').reportValidity()) { return; }
    var record = collectRecord();
    var error = validateRecord(record);
    if (error) {
      for (var c = 0; c < CYCLES.length; c++) {
        var key = CYCLES[c];
        var invalid = cycles[key].tiers.find(function (tier) {
          return Boolean(validateTier(tier, cycles[key].tiers, tier.id));
        });
        if (invalid) { syncTierErrors(key); focusTier(key, invalid.id); break; }
      }
      return fail(error);
    }
    CYCLES.forEach(function (key) {
      record.cycles[key].tiers = sortedTiers(record.cycles[key].tiers).map(function (tier) {
        return { id: tier.id, amount: money(amountCents(tier.amount)), price: money(amountCents(tier.price)), enabled: tier.enabled };
      });
    });
    try {
      var records = getRecords();
      var index = records.findIndex(function (item) { return item.id === record.id; });
      if (editId && index < 0) { return fail('该活动已不存在，请返回活动列表后重试。'); }
      if (index < 0) { records.unshift(record); } else { records[index] = Object.assign({}, original, record); }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (storageError) { return fail('保存失败，本地存储不可用、数据异常或空间不足。当前配置已保留，请检查后重试。'); }
    window.location.href = LIST_URL + '?specialPackSaved=1';
  }
  function syncLongTerm() {
    var input = byId('specialPackEndTime');
    var enabled = byId('specialPackLongTerm').checked;
    if (enabled) { if (input.value) { input.dataset.longTermFallback = input.value; } input.value = ''; }
    else if (!input.value) { input.value = input.dataset.longTermFallback || ''; }
    input.disabled = enabled; input.required = !enabled;
  }
  function setImage(kind, source) {
    imageState[kind].source = source || '';
    var preview = byId('specialPack' + kind + 'Preview');
    if (source) { preview.src = source; } else { preview.removeAttribute('src'); }
    preview.hidden = !source; document.querySelector('[data-sp-remove-image="' + kind + '"]').hidden = !source;
  }
  function uploadImage(kind, file) {
    if (!file) { return; }
    var state = imageState[kind], version = ++state.version;
    state.busy = false;
    var max = kind === 'Banner' ? 500 * 1024 : 1024 * 1024;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > max) { return fail('请上传 JPG、PNG 或 WebP 图片；Banner 最大 500KB，内页图最大 1MB。'); }
    state.busy = true;
    var reader = new FileReader();
    function imageError() { if (version === state.version) { state.busy = false; fail('图片读取失败，请更换有效图片。'); } }
    reader.onerror = imageError;
    reader.onload = function () {
      if (version !== state.version) { return; }
      var preview = new Image(); preview.onerror = imageError;
      preview.onload = function () { if (version === state.version) { state.busy = false; setImage(kind, reader.result); clearError(); } };
      preview.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
  function loadActivity() {
    if (!editId) { return; }
    try { original = getRecords().find(function (item) { return item.id === editId; }); }
    catch (error) { invalidEdit = true; return fail('本地活动数据读取失败，请返回活动列表后重试。'); }
    if (!original || validateCycles(original.cycles)) { invalidEdit = true; return fail('活动不存在或礼包数据异常，请返回活动列表后重新打开。'); }
    var fields = { Name: 'name', Title: 'title', StartTime: 'startTime', EndTime: 'endTime', Sort: 'sort', WagerMultiple: 'wagerMultiple' };
    Object.keys(fields).forEach(function (suffix) { if (original[fields[suffix]] != null) { byId('specialPack' + suffix).value = original[fields[suffix]]; } });
    var checks = { LongTerm: 'longTerm', Enabled: 'enabled', SameIpOnce: 'sameIpOnce', WithdrawalAccountOnce: 'sameWithdrawalAccountOnce' };
    Object.keys(checks).forEach(function (suffix) { if (typeof original[checks[suffix]] === 'boolean') { byId('specialPack' + suffix).checked = original[checks[suffix]]; } });
    all('input[name="specialPackRewardTarget"]').forEach(function (input) { input.checked = input.value === (original.rewardTarget || '余额'); });
    byId('specialPackEndTime').dataset.longTermFallback = original.endTimeFallback || original.endTime || '';
    cycles = JSON.parse(JSON.stringify(original.cycles));
    CYCLES.forEach(function (key) { cycles[key].tiers = sortedTiers(cycles[key].tiers); });
    ['Banner', 'Detail'].forEach(function (kind) {
      var source = original[kind === 'Banner' ? 'bannerImage' : 'detailImage'];
      if (typeof source === 'string' && /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(source)) { setImage(kind, source); }
    });
    if (typeof original.descriptionHtml === 'string') { byId('specialPackDescription').innerHTML = sanitizeDescription(original.descriptionHtml); }
  }
  function ready() {
    var form = byId('specialPackForm');
    if (!form || form.getAttribute('data-sp-bound') === 'true') { return; }
    form.setAttribute('data-sp-bound', 'true');
    loadActivity(); syncLongTerm(); CYCLES.forEach(renderCycle);
    byId('specialPackEnabledText').textContent = byId('specialPackEnabled').checked ? '开启' : '关闭';
    byId('specialPackLongTerm').addEventListener('change', syncLongTerm);
    byId('specialPackEnabled').addEventListener('change', function () { byId('specialPackEnabledText').textContent = this.checked ? '开启' : '关闭'; });
    form.addEventListener('submit', function (event) { event.preventDefault(); saveActivity(); });
    form.addEventListener('input', clearError);
    form.addEventListener('change', function (event) {
      var key = event.target.getAttribute('data-sp-enabled');
      if (key && cycles[key]) { cycles[key].enabled = event.target.checked; renderCycle(key); clearError(); }
    });
    form.addEventListener('click', function (event) {
      var button = event.target.closest('button');
      if (!button) { return; }
      if (button.hasAttribute('data-sp-add')) { addTier(button.getAttribute('data-sp-add')); }
      if (button.hasAttribute('data-sp-delete')) {
        var key = button.getAttribute('data-sp-delete'), id = button.closest('tr').getAttribute('data-sp-tier-id');
        cycles[key].tiers = cycles[key].tiers.filter(function (tier) { return tier.id !== id; });
        renderCycle(key); clearError(); document.querySelector('[data-sp-add="' + key + '"]').focus();
      }
      if (button.hasAttribute('data-sp-upload')) { byId('specialPack' + button.getAttribute('data-sp-upload') + 'File').click(); }
      if (button.hasAttribute('data-sp-remove-image')) { var kind = button.getAttribute('data-sp-remove-image'); imageState[kind].version++; imageState[kind].busy = false; setImage(kind, ''); }
    });
    ['Banner', 'Detail'].forEach(function (kind) {
      var input = byId('specialPack' + kind + 'File');
      input.addEventListener('change', function () { uploadImage(kind, input.files && input.files[0]); input.value = ''; });
    });
    all('[data-sp-command]', form).forEach(function (button) {
      button.addEventListener('mousedown', function (event) { event.preventDefault(); });
      button.addEventListener('click', function () { byId('specialPackDescription').focus(); document.execCommand(button.getAttribute('data-sp-command'), false, null); });
    });
    byId('specialPackDescription').addEventListener('paste', function (event) {
      event.preventDefault(); if (event.clipboardData) { document.execCommand('insertText', false, event.clipboardData.getData('text/plain')); }
    });
    ['u4', 'u5', 'u1'].forEach(function (id, index) {
      var button = byId(id); if (!button) { return; }
      button.addEventListener('click', function (event) {
        if (!document.body.classList.contains('special-pack-template-active')) { return; }
        event.preventDefault(); event.stopImmediatePropagation();
        if (index === 0) { saveActivity(); } else { window.location.href = LIST_URL; }
      }, true);
    });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', ready); } else { ready(); }
})();
