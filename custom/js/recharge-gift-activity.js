(function () {
  'use strict';
  var STORAGE_KEY = 'promoRechargeGiftActivities';
  var TEMPLATE = '充值送金';
  var LIST_URL = '优惠活动列表.html';
  var editId = new URLSearchParams(window.location.search).get('rechargeGiftId');
  var readOnly = new URLSearchParams(window.location.search).get('mode') === 'view';
  var original = null;
  var bannerData = '';
  var bannerBusy = false;
  var bannerVersion = 0;
  var storageFailed = false;

  function byId(id) { return document.getElementById(id); }
  function each(nodes, callback) { Array.prototype.forEach.call(nodes, callback); }
  function fail(message, control) {
    var error = byId('rechargeGiftError');
    error.textContent = message;
    error.hidden = false;
    if (control) { control.focus(); }
    error.scrollIntoView({ block: 'nearest' });
    return false;
  }
  function clearError() { byId('rechargeGiftError').hidden = true; }
  function getRecords() {
    var records = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(records) || records.some(function (record) {
      return !record || typeof record !== 'object' || typeof record.id !== 'string' || !record.id;
    })) { throw new Error('Invalid activity storage'); }
    return records;
  }
  function selected(name) {
    var node = document.querySelector('input[name="' + name + '"]:checked');
    return node ? node.value : '';
  }
  function setSelected(name, value) {
    each(document.querySelectorAll('input[name="' + name + '"]'), function (input) { input.checked = input.value === value; });
  }
  function syncMembers() {
    byId('rechargeGiftMemberCount').textContent = '已选 ' + byId('rechargeGiftMembers').querySelectorAll('[aria-pressed="true"]').length + ' / 18';
  }
  function syncRewardMode() {
    var isAmount = selected('rechargeGiftRewardMode') === 'amount';
    byId('rechargeGiftRatioSection').hidden = isAmount;
    byId('rechargeGiftRatioSection').disabled = readOnly || isAmount;
    byId('rechargeGiftAmountSection').hidden = !isAmount;
    byId('rechargeGiftAmountSection').disabled = readOnly || !isAmount;
    byId('rechargeGiftAmountHint').textContent = selected('rechargeGiftDepositMode') === 'single'
      ? '每笔充值单独判断，按该笔充值满足的最高档赠送，不叠加档位奖励。'
      : '活动期间累计充值达到门槛，按满足的最高档赠送，不叠加档位奖励。';
  }
  function syncAmountTiers() {
    var rows = byId('rechargeGiftAmountTiers').querySelectorAll('tr');
    each(rows, function (row, index) {
      row.querySelector('.rg-amount-index').textContent = String(index + 1);
      row.querySelector('.rg-deposit-amount').setAttribute('aria-label', '第' + (index + 1) + '档充值达到');
      row.querySelector('.rg-gift-amount').setAttribute('aria-label', '第' + (index + 1) + '档赠送金额');
      row.querySelector('[data-rg-delete-amount-tier]').hidden = readOnly || rows.length === 1;
    });
  }
  function createAmountTier(tier) {
    var row = byId('rechargeGiftAmountTiers').firstElementChild.cloneNode(true);
    row.querySelector('.rg-deposit-amount').value = tier.depositAmount == null ? '' : String(tier.depositAmount);
    row.querySelector('.rg-gift-amount').value = tier.giftAmount == null ? '' : String(tier.giftAmount);
    return row;
  }
  function amountTierError() {
    var previousDeposit = 0;
    var rows = byId('rechargeGiftAmountTiers').querySelectorAll('tr');
    if (!rows.length) { return '请至少添加一个金额奖励档位。'; }
    for (var index = 0; index < rows.length; index++) {
      var deposit = Number(rows[index].querySelector('.rg-deposit-amount').value);
      var gift = Number(rows[index].querySelector('.rg-gift-amount').value);
      if (!Number.isFinite(deposit) || deposit <= 0 || !Number.isFinite(gift) || gift <= 0 ||
          Math.abs(deposit * 100 - Math.round(deposit * 100)) > 0.000001 ||
          Math.abs(gift * 100 - Math.round(gift * 100)) > 0.000001) {
        return '第' + (index + 1) + '档充值门槛和赠送金额须大于 0，最多保留两位小数。';
      }
      if (deposit <= previousDeposit) { return '充值门槛须按档位递增，不能重复或低于上一档。'; }
      previousDeposit = deposit;
    }
    return '';
  }
  function syncTiers() {
    var rows = byId('rechargeGiftTiers').querySelectorAll('tr');
    var start = 1;
    each(rows, function (row, index) {
      var input = row.querySelector('.rg-vip-end');
      var last = index === rows.length - 1;
      var end;
      input.disabled = readOnly || last;
      input.min = String(start);
      input.max = String(last ? 15 : 14 - (rows.length - index - 2));
      if (last) { input.value = '15'; }
      end = Number(input.value);
      row.querySelector('.rg-tier').textContent = start === end ? String(start) : start + ' - ' + (input.value || '…');
      input.setAttribute('aria-label', '第' + (index + 1) + '档 VIP等级上限');
      row.querySelector('.rg-percent').setAttribute('aria-label', '第' + (index + 1) + '档百分比');
      row.querySelector('[data-rg-delete-tier]').hidden = readOnly || rows.length === 1;
      start = end + 1;
    });
    byId('rechargeGiftAddTier').disabled = readOnly || rows.length >= 15;
  }
  function createTier(tier) {
    var row = byId('rechargeGiftTiers').firstElementChild.cloneNode(true);
    row.querySelector('.rg-vip-end').value = String(tier.endVip);
    row.querySelector('.rg-percent').value = tier.percent == null ? '' : String(tier.percent);
    return row;
  }
  function validTiers() {
    var rows = byId('rechargeGiftTiers').querySelectorAll('tr');
    var end = 0;
    var valid = true;
    each(rows, function (row) {
      var input = row.querySelector('.rg-vip-end');
      var current = Number(input.value);
      if (!Number.isInteger(current) || current <= end || current > 15) { valid = false; }
      end = current;
    });
    return valid && end === 15;
  }
  function setBanner(source) {
    bannerData = source || '';
    var image = byId('rechargeGiftBannerPreview');
    if (bannerData) { image.src = bannerData; } else { image.removeAttribute('src'); }
    image.hidden = !bannerData;
    byId('rechargeGiftUploadHint').hidden = Boolean(bannerData);
    byId('rechargeGiftRemoveBanner').hidden = !bannerData || readOnly;
  }
  function uploadBanner(file) {
    if (readOnly || !file) { return; }
    var version = ++bannerVersion;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 500 * 1024) {
      bannerBusy = false;
      fail('请上传不超过 500KB 的 JPG、PNG 或 WebP 图片。', byId('rechargeGiftUpload'));
      return;
    }
    bannerBusy = true;
    var reader = new FileReader();
    reader.onload = function () {
      if (version !== bannerVersion) { return; }
      var image = new Image();
      image.onload = function () {
        if (version !== bannerVersion) { return; }
        bannerBusy = false;
        setBanner(reader.result);
        clearError();
      };
      image.onerror = function () {
        if (version !== bannerVersion) { return; }
        bannerBusy = false;
        fail('图片无法读取，请更换有效图片。');
      };
      image.src = reader.result;
    };
    reader.onerror = function () {
      if (version !== bannerVersion) { return; }
      bannerBusy = false;
      fail('图片读取失败，请重试。');
    };
    reader.readAsDataURL(file);
  }
  // Keep only the editor's supported formatting when saving or restoring content.
  function cleanDescription(html) {
    var template = document.createElement('template');
    template.innerHTML = html || '';
    function clean(parent) {
      each(Array.prototype.slice.call(parent.childNodes), function (node) {
        if (node.nodeType === 8) { node.remove(); return; }
        if (node.nodeType !== 1) { return; }
        if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|SVG|MATH|LINK|META|IMG|VIDEO|AUDIO)$/.test(node.tagName)) { node.remove(); return; }
        clean(node);
        if (!/^(P|DIV|BR|B|STRONG|U|I|EM|S|STRIKE|H3|BLOCKQUOTE|UL|OL|LI|SUB|SUP|SPAN)$/.test(node.tagName)) {
          while (node.firstChild) { node.parentNode.insertBefore(node.firstChild, node); }
          node.remove();
          return;
        }
        each(Array.prototype.slice.call(node.attributes), function (attribute) { node.removeAttribute(attribute.name); });
      });
    }
    clean(template.content);
    return template.innerHTML;
  }
  function syncCharCount() { byId('rechargeGiftCharCount').textContent = 'Character Count: ' + byId('rechargeGiftDescription').textContent.length; }
  function collectRecord() {
    var record = Object.assign({}, original || {});
    record.id = editId || 'recharge-gift-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    record.template = TEMPLATE;
    record.name = byId('rechargeGiftName').value.trim();
    record.title = byId('rechargeGiftTitle').value.trim();
    record.startTime = byId('rechargeGiftStart').value;
    record.endTime = byId('rechargeGiftEnd').value;
    record.rewardTarget = selected('rechargeGiftTarget');
    record.claimMode = selected('rechargeGiftClaim');
    record.rewardMode = selected('rechargeGiftRewardMode') === 'amount' ? 'amount' : 'ratio';
    record.depositMode = selected('rechargeGiftDepositMode') === 'single' ? 'single' : 'cumulative';
    record.firstRechargeOnly = byId('rechargeGiftFirst').checked;
    record.ipOnce = byId('rechargeGiftIp').checked;
    record.members = [];
    each(byId('rechargeGiftMembers').querySelectorAll('[aria-pressed="true"]'), function (button) { record.members.push(button.getAttribute('data-rg-member')); });
    record.tiers = [];
    each(byId('rechargeGiftTiers').querySelectorAll('tr'), function (row) {
      var percent = row.querySelector('.rg-percent').value;
      record.tiers.push({ endVip: Number(row.querySelector('.rg-vip-end').value), percent: percent === '' ? '' : Number(percent) });
    });
    record.amountTiers = [];
    each(byId('rechargeGiftAmountTiers').querySelectorAll('tr'), function (row) {
      var deposit = row.querySelector('.rg-deposit-amount').value;
      var gift = row.querySelector('.rg-gift-amount').value;
      record.amountTiers.push({ depositAmount: deposit === '' ? '' : Number(deposit), giftAmount: gift === '' ? '' : Number(gift) });
    });
    record.banner = bannerData;
    record.description = cleanDescription(byId('rechargeGiftDescription').innerHTML);
    record.wagerMultiple = byId('rechargeGiftWager').value;
    record.sort = byId('rechargeGiftSort').value || '0';
    record.enabled = !original || original.enabled !== false;
    record.visible = !original || original.visible !== false;
    return record;
  }
  function save(event) {
    event.preventDefault();
    if (readOnly || storageFailed) { return; }
    clearError();
    var form = byId('rechargeGiftForm');
    var record = collectRecord();
    if (!record.name) { return fail('请输入活动名称。', byId('rechargeGiftName')); }
    if (!record.title) { return fail('请输入活动标题。', byId('rechargeGiftTitle')); }
    if (!form.reportValidity()) { return; }
    if (record.endTime <= record.startTime) { return fail('结束时间必须晚于开始时间。', byId('rechargeGiftEnd')); }
    if (!record.members.length) { return fail('请至少选择一类参与会员。', byId('rechargeGiftMembers').querySelector('button')); }
    if (record.rewardMode === 'ratio' && !validTiers()) { return fail('VIP 档位须连续递增并完整覆盖 VIP1 至 VIP15，请调整等级上限。', byId('rechargeGiftTiers').querySelector('.rg-vip-end:not(:disabled)')); }
    if (record.rewardMode === 'amount') {
      var amountError = amountTierError();
      if (amountError) { return fail(amountError); }
    }
    if (bannerBusy) { return fail('图片正在读取，请稍后确定。'); }
    if (!bannerData) { return fail('请上传活动 Banner。', byId('rechargeGiftUpload')); }
    try {
      var records = getRecords();
      var index = records.findIndex(function (item) { return item.id === record.id; });
      if (editId && index < 0) { return fail('该活动已被删除，请返回列表重新选择。'); }
      // Keep list switches changed in another tab while this form was open.
      if (index >= 0) {
        record.enabled = records[index].enabled !== false;
        record.visible = records[index].visible !== false;
        records[index] = record;
      } else { records.push(record); }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (error) { return fail('保存失败，请检查浏览器存储权限或剩余空间后重试；当前输入已保留。'); }
    window.location.href = LIST_URL;
  }
  function loadRecord() {
    if (!editId) { return; }
    try { original = getRecords().find(function (record) { return record.id === editId; }); }
    catch (error) { storageFailed = true; fail('活动数据读取失败，请返回列表检查本地存储。'); }
    if (!original) {
      storageFailed = true;
      byId('rechargeGiftSave').disabled = true;
      if (byId('rechargeGiftError').hidden) { fail('未找到该活动，请返回列表重新选择。'); }
      return;
    }
    byId('rechargeGiftDialogTitle').textContent = readOnly ? '查看活动' : '编辑活动';
    byId('rechargeGiftName').value = original.name || '';
    byId('rechargeGiftTitle').value = original.title || '';
    byId('rechargeGiftStart').value = original.startTime || '';
    byId('rechargeGiftEnd').value = original.endTime || '';
    byId('rechargeGiftWager').value = original.wagerMultiple == null ? '1' : original.wagerMultiple;
    byId('rechargeGiftSort').value = original.sort == null ? '0' : original.sort;
    byId('rechargeGiftFirst').checked = Boolean(original.firstRechargeOnly);
    byId('rechargeGiftIp').checked = Boolean(original.ipOnce);
    setSelected('rechargeGiftTarget', original.rewardTarget || '余额');
    setSelected('rechargeGiftClaim', original.claimMode || 'immediate');
    setSelected('rechargeGiftRewardMode', original.rewardMode === 'amount' ? 'amount' : 'ratio');
    setSelected('rechargeGiftDepositMode', original.depositMode === 'single' ? 'single' : 'cumulative');
    each(byId('rechargeGiftMembers').querySelectorAll('button'), function (button) {
      button.setAttribute('aria-pressed', String((original.members || []).indexOf(button.getAttribute('data-rg-member')) >= 0));
    });
    var rows = byId('rechargeGiftTiers');
    var tiers = (original.tiers || []).map(createTier);
    if (tiers.length) { rows.textContent = ''; tiers.forEach(function (row) { rows.appendChild(row); }); }
    var amountRows = byId('rechargeGiftAmountTiers');
    var amountTiers = (original.amountTiers || []).map(createAmountTier);
    if (amountTiers.length) { amountRows.textContent = ''; amountTiers.forEach(function (row) { amountRows.appendChild(row); }); }
    if (/^data:image\/(png|jpeg|webp);base64,/i.test(original.banner || '')) { setBanner(original.banner); }
    byId('rechargeGiftDescription').innerHTML = cleanDescription(original.description || '');
  }
  function ready() {
    var form = byId('rechargeGiftForm');
    var masterSelect = byId('u3012_input');
    if (!form || !masterSelect) { return; }
    var templateSelect = byId('rechargeGiftTemplate');
    templateSelect.innerHTML = masterSelect.innerHTML;
    templateSelect.value = TEMPLATE;
    templateSelect.addEventListener('change', function () {
      masterSelect.value = templateSelect.value;
      masterSelect.dispatchEvent(new Event('change', { bubbles: true }));
      templateSelect.value = TEMPLATE;
    });
    loadRecord();
    syncTiers(); syncAmountTiers(); syncRewardMode(); syncMembers(); syncCharCount();
    each(byId('rechargeGiftDialog').querySelectorAll('[data-rg-close]'), function (button) {
      button.addEventListener('click', function () { window.location.href = LIST_URL; });
    });
    form.addEventListener('submit', save);
    form.addEventListener('change', function (event) {
      if (event.target.name === 'rechargeGiftRewardMode' || event.target.name === 'rechargeGiftDepositMode') {
        syncRewardMode(); clearError();
      }
    });
    form.addEventListener('input', function (event) {
      if (event.target.classList.contains('rg-vip-end')) { syncTiers(); }
      syncCharCount();
    });
    form.addEventListener('click', function (event) {
      if (readOnly) { return; }
      var button = event.target.closest('button');
      if (!button) { return; }
      if (button.hasAttribute('data-rg-member')) {
        button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
        syncMembers();
      }
      if (button.hasAttribute('data-rg-members')) {
        each(byId('rechargeGiftMembers').querySelectorAll('button'), function (member) { member.setAttribute('aria-pressed', String(button.getAttribute('data-rg-members') === 'all')); });
        syncMembers();
      }
      if (button.hasAttribute('data-rg-delete-tier')) { button.closest('tr').remove(); syncTiers(); }
      if (button.hasAttribute('data-rg-delete-amount-tier')) {
        if (byId('rechargeGiftAmountTiers').querySelectorAll('tr').length > 1) { button.closest('tr').remove(); syncAmountTiers(); }
      }
    });
    byId('rechargeGiftAddAmountTier').addEventListener('click', function () {
      if (readOnly) { return; }
      byId('rechargeGiftAmountTiers').appendChild(createAmountTier({}));
      syncAmountTiers(); clearError();
    });
    byId('rechargeGiftAddTier').addEventListener('click', function () {
      if (readOnly) { return; }
      if (!validTiers()) { return fail('请先调整当前档位的 VIP 等级上限。'); }
      var rows = byId('rechargeGiftTiers').querySelectorAll('tr');
      if (rows.length >= 15) { return; }
      var last = rows[rows.length - 1];
      var start = rows.length > 1 ? Number(rows[rows.length - 2].querySelector('.rg-vip-end').value) + 1 : 1;
      if (start >= 15) { return fail('VIP15 已占满，请先调小前一档 VIP 等级上限。'); }
      last.querySelector('.rg-vip-end').value = String(start);
      byId('rechargeGiftTiers').appendChild(createTier({ endVip: 15, percent: '' }));
      syncTiers(); clearError();
    });
    var fileInput = byId('rechargeGiftBannerFile');
    var upload = byId('rechargeGiftUpload');
    upload.addEventListener('click', function () { if (!readOnly) { fileInput.click(); } });
    fileInput.addEventListener('change', function () { uploadBanner(fileInput.files[0]); fileInput.value = ''; });
    upload.addEventListener('dragover', function (event) { event.preventDefault(); if (!readOnly) { upload.classList.add('is-dragging'); } });
    upload.addEventListener('dragleave', function () { upload.classList.remove('is-dragging'); });
    upload.addEventListener('drop', function (event) { event.preventDefault(); upload.classList.remove('is-dragging'); uploadBanner(event.dataTransfer.files[0]); });
    byId('rechargeGiftRemoveBanner').addEventListener('click', function () { if (!readOnly) { bannerVersion++; bannerBusy = false; setBanner(''); } });
    each(form.querySelectorAll('[data-rg-command]'), function (button) {
      button.addEventListener('mousedown', function (event) { event.preventDefault(); });
      button.addEventListener('click', function () {
        if (readOnly) { return; }
        byId('rechargeGiftDescription').focus();
        document.execCommand(button.getAttribute('data-rg-command'), false, button.getAttribute('data-rg-value') || null);
        syncCharCount();
      });
    });
    byId('rechargeGiftDescription').addEventListener('paste', function (event) {
      event.preventDefault();
      if (!readOnly && event.clipboardData) { document.execCommand('insertText', false, event.clipboardData.getData('text/plain')); }
      syncCharCount();
    });
    if (readOnly) {
      byId('rechargeGiftDialog').classList.add('is-readonly');
      each(form.querySelectorAll('input,select,button'), function (input) { input.disabled = true; });
      byId('rechargeGiftDescription').contentEditable = 'false';
      byId('rechargeGiftSave').hidden = true;
      byId('rechargeGiftDialog').querySelector('.rg-foot [data-rg-close]').textContent = '关闭';
    }
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', ready); }
  else { ready(); }
})();
