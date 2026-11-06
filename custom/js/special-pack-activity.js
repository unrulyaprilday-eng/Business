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
  var activeCycle = 'daily';
  var editing = null;
  var returnFocus = null;
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
  function formatAmount(value) {
    var cents = amountCents(value);
    if (cents === null) { return '—'; }
    var parts = money(cents).split('.');
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (parts[1] ? '.' + parts[1] : '');
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
  function selectCycle(key, focus) {
    if (CYCLES.indexOf(key) < 0) { return; }
    activeCycle = key;
    all('[data-sp-tab]').forEach(function (tab) {
      var selected = tab.getAttribute('data-sp-tab') === key;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) { tab.focus(); }
    });
    all('[data-sp-panel]').forEach(function (panel) { panel.hidden = panel.getAttribute('data-sp-panel') !== key; });
  }
  function renderCycle(key) {
    var cycle = cycles[key];
    var body = document.querySelector('[data-sp-rows="' + key + '"]');
    body.textContent = '';
    cycle.tiers = sortedTiers(cycle.tiers);
    if (!cycle.tiers.length) {
      var emptyRow = document.createElement('tr');
      var emptyCell = document.createElement('td');
      emptyCell.colSpan = 4;
      emptyCell.className = 'sp-empty';
      emptyCell.textContent = '暂无档位，请新增' + LABELS[key] + '档位。';
      emptyRow.appendChild(emptyCell); body.appendChild(emptyRow);
    }
    cycle.tiers.forEach(function (tier) {
      var row = document.createElement('tr');
      row.setAttribute('data-sp-tier-id', tier.id);
      [formatAmount(tier.amount), formatAmount(tier.price)].forEach(function (text) {
        var cell = document.createElement('td'); cell.textContent = text; row.appendChild(cell);
      });
      var status = document.createElement('td');
      var tag = document.createElement('span');
      tag.className = 'sp-tag' + (tier.enabled ? '' : ' is-disabled'); tag.textContent = tier.enabled ? '启用' : '停用'; status.appendChild(tag); row.appendChild(status);
      var actions = document.createElement('td');
      ['edit', 'delete'].forEach(function (action) {
        var button = document.createElement('button');
        button.type = 'button'; button.className = 'sp-link' + (action === 'delete' ? ' sp-danger' : '');
        button.setAttribute('data-sp-' + action, key); button.textContent = action === 'edit' ? '编辑' : '删除'; actions.appendChild(button);
      });
      row.appendChild(actions); body.appendChild(row);
    });
    var statusText = document.querySelector('[data-sp-status="' + key + '"]');
    statusText.textContent = cycle.enabled ? '已开启' : '未开启';
    statusText.setAttribute('data-enabled', String(cycle.enabled));
    document.querySelector('[data-sp-enabled="' + key + '"]').checked = cycle.enabled;
  }
  function syncPreview() {
    var amount = formatAmount(byId('specialPackTierAmount').value);
    byId('specialPackPreviewAmount').textContent = amount;
    byId('specialPackPreviewOriginal').textContent = amount;
    byId('specialPackPreviewPrice').textContent = formatAmount(byId('specialPackTierPrice').value);
  }
  function openTier(key, id, trigger) {
    var tier = id ? cycles[key].tiers.find(function (item) { return item.id === id; }) : null;
    if (id && !tier) { return; }
    editing = { cycle: key, id: id || null };
    returnFocus = trigger;
    byId('specialPackTierModalTitle').textContent = (tier ? '编辑档位 · ' : '新增档位 · ') + LABELS[key];
    byId('specialPackTierAmount').value = tier ? tier.amount : '';
    byId('specialPackTierPrice').value = tier ? tier.price : '';
    byId('specialPackTierEnabled').checked = tier ? tier.enabled : true;
    message('specialPackTierError', ''); syncPreview();
    byId('specialPackTierModal').hidden = false; byId('base').inert = true;
    byId('specialPackTierAmount').focus();
  }
  function closeTier() {
    byId('specialPackTierModal').hidden = true; byId('base').inert = false; editing = null;
    if (returnFocus && returnFocus.isConnected) { returnFocus.focus(); }
    else { document.querySelector('[data-sp-add="' + activeCycle + '"]').focus(); }
    returnFocus = null;
  }
  function confirmTier(event) {
    event.preventDefault();
    if (!editing) { return; }
    var tier = { id: editing.id || uid('pack-tier'), amount: byId('specialPackTierAmount').value, price: byId('specialPackTierPrice').value, enabled: byId('specialPackTierEnabled').checked };
    var cycle = cycles[editing.cycle];
    var error = validateTier(tier, cycle.tiers, editing.id);
    if (error) { message('specialPackTierError', error); return; }
    tier.amount = money(amountCents(tier.amount)); tier.price = money(amountCents(tier.price));
    if (editing.id) {
      var index = cycle.tiers.findIndex(function (item) { return item.id === editing.id; });
      if (index < 0) { message('specialPackTierError', '该档位已不存在，请关闭后重试。'); return; }
      cycle.tiers[index] = tier;
    } else { cycle.tiers.push(tier); }
    renderCycle(editing.cycle); closeTier(); clearError();
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
      cycles: JSON.parse(JSON.stringify(cycles)),
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
    if (editing) { return; }
    if (imageState.Banner.busy || imageState.Detail.busy) { return fail('图片正在读取，请稍后保存。'); }
    if (!byId('specialPackForm').reportValidity()) { return; }
    var record = collectRecord();
    var error = validateRecord(record);
    if (error) { return fail(error); }
    CYCLES.forEach(function (key) { record.cycles[key].tiers = sortedTiers(record.cycles[key].tiers); });
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
    activeCycle = CYCLES.find(function (key) { return cycles[key].enabled; }) || 'daily';
    ['Banner', 'Detail'].forEach(function (kind) {
      var source = original[kind === 'Banner' ? 'bannerImage' : 'detailImage'];
      if (typeof source === 'string' && /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(source)) { setImage(kind, source); }
    });
    if (typeof original.descriptionHtml === 'string') { byId('specialPackDescription').innerHTML = sanitizeDescription(original.descriptionHtml); }
  }
  function ready() {
    var form = byId('specialPackForm');
    if (!form || form.getAttribute('data-sp-bound') === 'true' || !byId('specialPackTierModal')) { return; }
    form.setAttribute('data-sp-bound', 'true');
    loadActivity(); syncLongTerm(); CYCLES.forEach(renderCycle); selectCycle(activeCycle);
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
      if (button.hasAttribute('data-sp-tab')) { selectCycle(button.getAttribute('data-sp-tab')); }
      if (button.hasAttribute('data-sp-add')) { openTier(button.getAttribute('data-sp-add'), null, button); }
      if (button.hasAttribute('data-sp-edit')) { openTier(button.getAttribute('data-sp-edit'), button.closest('tr').getAttribute('data-sp-tier-id'), button); }
      if (button.hasAttribute('data-sp-delete')) {
        var key = button.getAttribute('data-sp-delete'), id = button.closest('tr').getAttribute('data-sp-tier-id');
        var tier = cycles[key].tiers.find(function (item) { return item.id === id; });
        if (tier && window.confirm('确认删除' + LABELS[key] + '中礼包金额为 ' + formatAmount(tier.amount) + ' 的档位？')) {
          cycles[key].tiers = cycles[key].tiers.filter(function (item) { return item.id !== id; }); renderCycle(key); clearError();
          document.querySelector('[data-sp-add="' + key + '"]').focus();
        }
      }
      if (button.hasAttribute('data-sp-upload')) { byId('specialPack' + button.getAttribute('data-sp-upload') + 'File').click(); }
      if (button.hasAttribute('data-sp-remove-image')) { var kind = button.getAttribute('data-sp-remove-image'); imageState[kind].version++; imageState[kind].busy = false; setImage(kind, ''); }
    });
    all('[data-sp-tab]').forEach(function (tab) {
      tab.addEventListener('keydown', function (event) {
        var index = CYCLES.indexOf(activeCycle);
        if (event.key === 'ArrowRight') { index = (index + 1) % 3; }
        else if (event.key === 'ArrowLeft') { index = (index + 2) % 3; }
        else if (event.key === 'Home') { index = 0; }
        else if (event.key === 'End') { index = 2; } else { return; }
        event.preventDefault(); selectCycle(CYCLES[index], true);
      });
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
    byId('specialPackTierForm').addEventListener('input', function () { message('specialPackTierError', ''); syncPreview(); });
    byId('specialPackTierForm').addEventListener('submit', confirmTier);
    all('[data-sp-close]').forEach(function (button) { button.addEventListener('click', closeTier); });
    byId('specialPackTierModal').addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { event.preventDefault(); closeTier(); }
      if (event.key !== 'Tab') { return; }
      var focusable = all('button:not([disabled]), input:not([disabled])', this), first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
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
