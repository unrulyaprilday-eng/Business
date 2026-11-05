(function () {
  'use strict';

  var STORAGE_KEY = 'promoReliefFundDraft';
  var MIN_VIP = 0;
  var MAX_VIP = 15;
  var tiers = [];
  var activeModal = null;
  var returnFocus = null;
  var banner = '';
  var details = [];
  var uploadPending = false;
  var fields = ['Name', 'Title', 'Start', 'End', 'Wager', 'Sort'];
  var tierFields = ['vip', 'deposit', 'loss', 'rate', 'cap'];
  var tierLabels = { vip: '最大 VIP 等级', deposit: '充值门槛', loss: '亏损门槛', rate: '亏损返还比例', cap: '奖励上限' };
  var originalRuleTable = '';

  function byId(id) { return document.getElementById(id); }
  function all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function formatNumber(value) { return Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 }); }
  function message(id, text, success) {
    var node = byId(id);
    node.textContent = text || '';
    node.hidden = !text;
    node.classList.toggle('is-success', Boolean(success));
  }
  function isValidTier(tier) {
    return tier && !Object.prototype.hasOwnProperty.call(tier, 'vipDraft') && Number.isSafeInteger(tier.vip) && tier.vip >= MIN_VIP && tier.vip <= MAX_VIP &&
      Number.isFinite(tier.deposit) && tier.deposit >= 0 &&
      Number.isFinite(tier.loss) && tier.loss >= 0 &&
      Number.isFinite(tier.rate) && tier.rate > 0 && tier.rate <= 100 &&
      Number.isFinite(tier.cap) && tier.cap > 0 && ['deposit', 'loss', 'rate', 'cap'].every(function (key) { return hasTwoDecimals(tier[key]); });
  }
  function isValidTiers(items) {
    return items.length > 0 && items[items.length - 1].vip === MAX_VIP && items.every(function (tier, index) {
      return isValidTier(tier) && (index === 0 || tier.vip > items[index - 1].vip);
    });
  }
  function tierStart(index) { return index ? tiers[index - 1].vip + 1 : MIN_VIP; }
  function rangeLabel(start, end) { return start === end ? String(start) : start + ' – ' + end; }
  function tierBounds(index) { return { min: tierStart(index), max: index === tiers.length - 1 ? MAX_VIP : tiers[index + 1].vip - 1 }; }
  function hasTwoDecimals(value) { return Math.abs(value * 100 - Math.round(value * 100)) < 0.00001; }
  function tierValue(tier, key) { return key === 'vip' && Object.prototype.hasOwnProperty.call(tier, 'vipDraft') ? tier.vipDraft : tier[key]; }
  function tierFieldError(tier, index, key) {
    var raw = tierValue(tier, key);
    if (raw === null || raw === undefined || String(raw).trim() === '') { return tierLabels[key] + '为必填项'; }
    var value = Number(raw);
    if (!Number.isFinite(value)) { return '请输入有效数值'; }
    if (key === 'vip') {
      var bounds = tierBounds(index);
      return !Number.isSafeInteger(value) || value < bounds.min || value > bounds.max ? '须为 ' + bounds.min + '–' + bounds.max + ' 的整数，不能与相邻档位重叠' : '';
    }
    if (key === 'rate' && (value <= 0 || value > 100)) { return '返还比例须大于 0 且不超过 100'; }
    if (key === 'cap' && value <= 0) { return '奖励上限须大于 0'; }
    if ((key === 'deposit' || key === 'loss') && value < 0) { return '门槛不能小于 0'; }
    return hasTwoDecimals(value) ? '' : '最多保留 2 位小数';
  }
  function syncAddButton() {
    var button = byId('rfAddTier');
    button.disabled = tierStart(tiers.length - 1) >= MAX_VIP;
    button.title = button.disabled ? '末档已仅剩最高等级，请先调小前一档最大等级再添加。' : '在末档前添加新档位，末档自动补齐剩余等级。';
  }
  function isImageSource(value) { return typeof value === 'string' && /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value); }
  function renderTiers() {
    byId('rfTierRows').innerHTML = tiers.map(function (tier, index) {
      var bounds = tierBounds(index);
      var last = index === tiers.length - 1;
      var cells = tierFields.map(function (key) {
        var value = tierValue(tier, key);
        var min = key === 'vip' ? bounds.min : key === 'rate' || key === 'cap' ? 0.01 : 0;
        var max = key === 'vip' ? ' max="' + bounds.max + '"' : key === 'rate' ? ' max="100"' : '';
        var errorId = 'rfTierError-' + index + '-' + key;
        return '<td><input class="rf-tier-input' + (key === 'vip' ? ' rf-max-vip' : '') + '" data-rf-field="' + key + '" type="number" min="' + min + '"' + max + ' step="' + (key === 'vip' ? '1' : '0.01') + '" value="' + escapeHtml(value == null ? '' : value) + '" placeholder="必填" required aria-label="第' + (index + 1) + '档' + tierLabels[key] + '" aria-describedby="' + errorId + '"' + (key === 'vip' && last ? ' disabled title="末档自动适配最高VIP等级"' : '') + '><small id="' + errorId + '" class="rf-field-error" data-rf-error="' + key + '" hidden></small></td>';
      }).join('');
      return '<tr data-rf-index="' + index + '" data-rf-vip="' + tier.vip + '"><th scope="row"><span class="rf-tier-badge" data-rf-range>' + rangeLabel(bounds.min, tier.vip) + '</span></th>' + cells +
        '<td><button type="button" class="rf-delete-tier" data-rf-delete="' + index + '" aria-label="删除第' + (index + 1) + '档" title="删除档位"' + (tiers.length === 1 ? ' disabled' : '') + '><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 6h18M9 6V4h6v2M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg></button></td></tr>';
    }).join('');
    syncTierControls();
  }
  function syncTierControls() {
    tiers.forEach(function (tier, index) {
      if (Object.prototype.hasOwnProperty.call(tier, 'vipDraft') && !tierFieldError(tier, index, 'vip')) {
        tier.vip = Number(tier.vipDraft);
        delete tier.vipDraft;
      }
    });
    all('#rfTierRows tr').forEach(function (row, index) {
      var invalid = false;
      var bounds = tierBounds(index);
      row.querySelector('[data-rf-range]').textContent = rangeLabel(bounds.min, tiers[index].vip);
      row.setAttribute('data-rf-vip', String(tiers[index].vip));
      tierFields.forEach(function (key) {
        var input = row.querySelector('[data-rf-field="' + key + '"]');
        var note = row.querySelector('[data-rf-error="' + key + '"]');
        var error = tierFieldError(tiers[index], index, key);
        if (key === 'vip') { input.min = bounds.min; input.max = bounds.max; }
        input.setCustomValidity(error);
        input.setAttribute('aria-invalid', error ? 'true' : 'false');
        note.textContent = error;
        note.hidden = !error;
        invalid = invalid || Boolean(error);
      });
      row.classList.toggle('rf-tier-invalid', invalid);
    });
    syncAddButton();
  }
  function updateTierInput(event) {
    var input = event.target;
    var key = input.getAttribute('data-rf-field');
    if (tierFields.indexOf(key) === -1 || input.disabled) { return; }
    var index = Number(input.closest('tr').getAttribute('data-rf-index'));
    if (key === 'vip') {
      tiers[index].vipDraft = input.value;
      if (!tierFieldError(tiers[index], index, key)) {
        tiers[index].vip = Number(input.value);
        delete tiers[index].vipDraft;
      }
    } else { tiers[index][key] = input.value === '' ? null : Number(input.value); }
    syncTierControls();
    message('rfTierTableMessage', '');
    message('rfFormMessage', '');
  }
  function addTier() {
    var start = tierStart(tiers.length - 1);
    if (start >= MAX_VIP) { return; }
    tiers.splice(tiers.length - 1, 0, { vip: start, deposit: null, loss: null, rate: null, cap: null });
    renderTiers();
    var row = byId('rfTierRows').querySelector('[data-rf-index="' + (tiers.length - 2) + '"]');
    if (row) { row.querySelector('[data-rf-field="deposit"]').focus(); }
    message('rfTierTableMessage', '');
    message('rfFormMessage', '');
  }
  function deleteTier(index) {
    if (!Number.isInteger(index) || index < 0 || index >= tiers.length) { return; }
    if (tiers.length <= 1) { message('rfTierTableMessage', '请至少保留一个 VIP 档位。'); return; }
    tiers.splice(index, 1);
    tiers[tiers.length - 1].vip = MAX_VIP;
    delete tiers[tiers.length - 1].vipDraft;
    renderTiers();
    message('rfTierTableMessage', '');
    message('rfFormMessage', '');
  }
  function requireValidTiers() {
    syncTierControls();
    if (isValidTiers(tiers)) { message('rfTierTableMessage', ''); return true; }
    message('rfTierTableMessage', '请先修正档位中标红的必填项或数值。');
    var invalid = byId('rfTierRows').querySelector('[aria-invalid="true"]');
    if (invalid) { invalid.focus(); invalid.reportValidity(); }
    return false;
  }
  function openModal(id, trigger) {
    returnFocus = trigger || document.activeElement;
    activeModal = byId(id);
    activeModal.hidden = false;
    var focusTarget = activeModal.querySelector('input:not([disabled]), button');
    if (focusTarget) { focusTarget.focus(); }
  }
  function closeModal() {
    if (!activeModal) { return; }
    activeModal.hidden = true;
    activeModal = null;
    if (returnFocus && document.documentElement.contains(returnFocus)) { returnFocus.focus(); }
    else { byId('rfAddTier').focus(); }
  }
  function escapeHtml(text) { return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function sanitizeDescription(html) {
    var holder = document.createElement('template');
    var allowed = 'P DIV SPAN BR H1 H2 H3 H4 STRONG B EM I U S UL OL LI BLOCKQUOTE TABLE THEAD TBODY TFOOT TR TH TD'.split(' ');
    var removed = 'SCRIPT STYLE IFRAME OBJECT EMBED SVG MATH LINK META'.split(' ');
    holder.innerHTML = String(html || '');
    all('*', holder.content).forEach(function (node) {
      if (removed.indexOf(node.tagName) !== -1) { node.remove(); return; }
      if (allowed.indexOf(node.tagName) === -1) {
        while (node.firstChild) { node.parentNode.insertBefore(node.firstChild, node); }
        node.remove();
        return;
      }
      Array.prototype.slice.call(node.attributes).forEach(function (attribute) {
        if ((node.tagName === 'TD' || node.tagName === 'TH') && /^(colspan|rowspan)$/.test(attribute.name) && /^[1-9][0-9]?$/.test(attribute.value)) { return; }
        node.removeAttribute(attribute.name);
      });
    });
    return holder.innerHTML;
  }
  function plainTextHtml(text) { return String(text).split(/\n\s*\n/).map(function (paragraph) { return '<p>' + escapeHtml(paragraph).replace(/\n/g, '<br>') + '</p>'; }).join(''); }
  function previewRules(trigger) {
    byId('rfPreviewCopy').innerHTML = sanitizeDescription(byId('rfDescription').innerHTML);
    openModal('rfPreviewModal', trigger);
  }
  function syncRuleTable() {
    if (!requireValidTiers()) { return; }
    var editor = byId('rfDescription');
    var existing = editor.querySelector('table');
    var table = document.createElement('table');
    var rows = [];
    tiers.forEach(function (tier, index) {
      for (var vip = tierStart(index); vip <= tier.vip; vip += 1) {
        rows.push('<tr><td>' + vip + '</td><td>' + formatNumber(tier.rate) + '%</td><td>' + formatNumber(tier.deposit) + '</td><td>' + formatNumber(tier.loss) + '</td><td>' + formatNumber(tier.cap) + '</td></tr>');
      }
    });
    table.innerHTML = '<thead><tr><th>VIP Level</th><th>Rescue Fund<br>Percentage</th><th>Deposit<br>requirements</th><th>Loss Conditions</th><th>Maximum<br>Amount</th></tr></thead><tbody>' + rows.join('') + '</tbody>';
    if (existing) { existing.replaceWith(table); } else { editor.appendChild(table); }
    message('rfFormMessage', '');
  }
  function bindDescriptionEditor() {
    var editor = byId('rfDescription');
    all('[data-rf-command]').forEach(function (button) {
      button.addEventListener('mousedown', function (event) { event.preventDefault(); });
      button.addEventListener('click', function () { editor.focus(); document.execCommand(button.getAttribute('data-rf-command'), false, null); message('rfFormMessage', ''); });
    });
    editor.addEventListener('paste', function (event) {
      if (!event.clipboardData) { return; }
      event.preventDefault();
      var html = event.clipboardData.getData('text/html');
      document.execCommand('insertHTML', false, html ? sanitizeDescription(html) : plainTextHtml(event.clipboardData.getData('text/plain')));
    });
    editor.addEventListener('drop', function (event) { event.preventDefault(); });
    byId('rfSyncRuleTable').addEventListener('click', syncRuleTable);
  }
  function renderImages() {
    var image = byId('rfBannerPreview');
    image.hidden = !banner;
    if (banner) { image.src = banner; } else { image.removeAttribute('src'); }
    byId('rfBannerHint').hidden = Boolean(banner);
    byId('rfBannerRemove').hidden = !banner;
    var container = byId('rfDetailImages');
    container.textContent = '';
    details.forEach(function (source, index) {
      var item = document.createElement('div');
      item.className = 'rf-image-item';
      var img = document.createElement('img');
      img.src = source;
      img.alt = '活动详情图片 ' + (index + 1);
      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'rf-text-button rf-danger';
      remove.textContent = '移除';
      remove.setAttribute('data-rf-remove-image', String(index));
      item.appendChild(img);
      item.appendChild(remove);
      container.appendChild(item);
    });
    byId('rfDetailUpload').hidden = details.length >= 5;
  }
  function readImage(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('图片读取失败，请重新选择。')); };
      reader.onload = function () {
        if (!isImageSource(reader.result)) { reject(new Error('图片格式无效，请使用 JPG、PNG 或 WebP。')); return; }
        var img = new Image();
        img.onload = function () { resolve(reader.result); };
        img.onerror = function () { reject(new Error('图片无法打开，请更换有效图片。')); };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }
  function uploadImages(kind, fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    if (!files.length) { return; }
    if (uploadPending) { message('rfImageMessage', '图片正在读取，请稍候。'); return; }
    if (kind === 'banner' && files.length !== 1) { message('rfImageMessage', 'Banner 仅支持上传一张图片。'); return; }
    if (kind === 'detail' && details.length + files.length > 5) { message('rfImageMessage', '活动详情最多上传 5 张图片。'); return; }
    var maxBytes = kind === 'banner' ? 500 * 1024 : 1024 * 1024;
    if (files.some(function (file) { return !/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > maxBytes; })) {
      message('rfImageMessage', '请使用 JPG、PNG 或 WebP；' + (kind === 'banner' ? 'Banner 最大 500KB。' : '详情图片每张最大 1MB。'));
      return;
    }
    uploadPending = true;
    byId('rfSubmit').disabled = true;
    message('rfImageMessage', '');
    Promise.all(files.map(readImage)).then(function (sources) {
      if (kind === 'banner') { banner = sources[0]; } else { details = details.concat(sources); }
      renderImages();
      message('rfFormMessage', '');
    }).catch(function (error) { message('rfImageMessage', error.message); }).then(function () {
      uploadPending = false;
      byId('rfSubmit').disabled = false;
    });
  }
  function bindUpload(kind, buttonId, inputId) {
    var button = byId(buttonId);
    var input = byId(inputId);
    button.addEventListener('click', function () { if (!uploadPending) { input.click(); } });
    button.addEventListener('dragover', function (event) { event.preventDefault(); button.classList.add('is-dragover'); });
    button.addEventListener('dragleave', function () { button.classList.remove('is-dragover'); });
    button.addEventListener('drop', function (event) {
      event.preventDefault();
      button.classList.remove('is-dragover');
      uploadImages(kind, event.dataTransfer && event.dataTransfer.files);
    });
    input.addEventListener('change', function () { uploadImages(kind, input.files); input.value = ''; });
  }
  function syncLongTerm() {
    var longTerm = byId('rfLongTerm').checked;
    byId('rfEnd').disabled = longTerm;
    byId('rfEnd').required = !longTerm;
    message('rfFormMessage', '');
  }
  function collectRecord() {
    var record = { version: 2, type: '救济金', currencySource: 'merchantCoins', vipMode: 'maximum', maxVip: MAX_VIP, tiers: tiers, banner: banner, details: details,
      rewardBasis: 'dailyLoss', lossFormula: 'gameBets-systemRewards-gameWinnings',
      qualification: 'depositAndLoss', statisticsPeriod: 'siteCalendarDay',
      applicationTiming: 'nextDay', distribution: 'customerServiceReview' };
    fields.forEach(function (name) { record[name.toLowerCase()] = byId('rf' + name).value.trim(); });
    record.longTerm = byId('rfLongTerm').checked;
    if (record.longTerm) { record.end = ''; }
    record.description = sanitizeDescription(byId('rfDescription').innerHTML);
    record.descriptionFormat = 'html';
    record.target = byId('reliefFundForm').querySelector('input[name="activityRewardTarget2"]:checked').value;
    return record;
  }
  function restoreRecord() {
    try {
      var record = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
      if (!record || (record.version !== 1 && record.version !== 2)) { return; }
      var restoredTiers = Array.isArray(record.tiers) ? record.tiers.slice() : [];
      if (record.version === 1 && restoredTiers.length && restoredTiers.every(isValidTier)) {
        restoredTiers.sort(function (a, b) { return a.vip - b.vip; });
        restoredTiers[restoredTiers.length - 1].vip = MAX_VIP;
      }
      fields.forEach(function (name) {
        var value = record[name.toLowerCase()];
        if (typeof value === 'string') { byId('rf' + name).value = value; }
      });
      byId('rfLongTerm').checked = record.longTerm === true;
      syncLongTerm();
      all('input[name="activityRewardTarget2"]', byId('reliefFundForm')).forEach(function (input) { input.checked = input.value === (record.target === '存钱罐' ? '存钱罐' : '余额'); });
      if (isValidTiers(restoredTiers)) { tiers = restoredTiers; }
      if (typeof record.description === 'string' && record.description.trim()) {
        byId('rfDescription').innerHTML = record.version === 1 ? '<h3>Rules</h3>' + plainTextHtml(record.description) + originalRuleTable : sanitizeDescription(record.description);
      }
      banner = isImageSource(record.banner) ? record.banner : '';
      details = Array.isArray(record.details) ? record.details.filter(isImageSource).slice(0, 5) : [];
      renderTiers();
      renderImages();
    } catch (error) { /* Keep the static example when local storage is unavailable. */ }
  }
  function saveConfiguration(event) {
    event.preventDefault();
    message('rfFormMessage', '');
    if (uploadPending) { message('rfFormMessage', '请等待图片读取完成后保存。'); return; }
    var form = byId('reliefFundForm');
    if (!requireValidTiers()) { return; }
    if (!form.reportValidity()) { return; }
    var record = collectRecord();
    if (!record.name || !record.title || !byId('rfDescription').textContent.trim()) { message('rfFormMessage', '请填写活动名称、活动标题和活动规则。'); return; }
    if (!record.start) {
      message('rfFormMessage', '请选择活动开始时间。');
      byId('rfStart').focus();
      return;
    }
    if (!record.longTerm && (!record.end || record.start >= record.end)) {
      message('rfFormMessage', '活动结束时间必须晚于开始时间。');
      byId('rfEnd').focus();
      return;
    }
    if (!isValidTiers(tiers)) { message('rfFormMessage', '请检查 VIP 档位，最大等级须递增且末档须覆盖至 VIP ' + MAX_VIP + '。'); return; }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      message('rfFormMessage', '示例配置已保存在当前浏览器，再次打开救济金模板可继续编辑。', true);
    } catch (error) { message('rfFormMessage', '配置保存失败，浏览器存储可能不可用或空间不足，请减少图片后重试。'); }
  }
  function init() {
    var form = byId('reliefFundForm');
    if (!form || form.getAttribute('data-rf-bound') === 'true') { return; }
    form.setAttribute('data-rf-bound', 'true');
    originalRuleTable = byId('rfDescription').querySelector('table').outerHTML;
    tiers = all('#rfTierRows [data-rf-vip]').map(function (row) {
      return { vip: Number(row.getAttribute('data-rf-vip')), deposit: Number(row.getAttribute('data-deposit')), loss: Number(row.getAttribute('data-loss')), rate: Number(row.getAttribute('data-rate')), cap: Number(row.getAttribute('data-cap')) };
    });
    restoreRecord();
    syncLongTerm();
    renderTiers();
    byId('rfLongTerm').addEventListener('change', syncLongTerm);
    byId('rfAddTier').addEventListener('click', addTier);
    byId('rfTierRows').addEventListener('click', function (event) {
      var remove = event.target.closest('[data-rf-delete]');
      if (remove) { deleteTier(Number(remove.getAttribute('data-rf-delete'))); }
    });
    byId('rfTierRows').addEventListener('input', updateTierInput);
    bindDescriptionEditor();
    byId('rfPreviewRules').addEventListener('click', function (event) { previewRules(event.currentTarget); });
    all('.rf-modal-layer').forEach(function (layer) {
      layer.addEventListener('click', function (event) { if (event.target === layer || event.target.closest('[data-rf-close]')) { closeModal(); } });
    });
    document.addEventListener('keydown', function (event) {
      if (!activeModal) { return; }
      if (event.key === 'Escape') { event.preventDefault(); closeModal(); return; }
      if (event.key !== 'Tab') { return; }
      var controls = all('button:not([disabled]), input:not([disabled])', activeModal);
      var first = controls[0];
      var last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    byId('u3012_input').addEventListener('change', closeModal);
    bindUpload('banner', 'rfBannerUpload', 'rfBannerFile');
    bindUpload('detail', 'rfDetailUpload', 'rfDetailFiles');
    byId('rfBannerRemove').addEventListener('click', function () { if (!uploadPending) { banner = ''; renderImages(); message('rfFormMessage', ''); } });
    byId('rfDetailImages').addEventListener('click', function (event) {
      var remove = event.target.closest('[data-rf-remove-image]');
      if (remove && !uploadPending) { details.splice(Number(remove.getAttribute('data-rf-remove-image')), 1); renderImages(); message('rfFormMessage', ''); }
    });
    form.addEventListener('input', function () { message('rfFormMessage', ''); });
    form.addEventListener('submit', saveConfiguration);
    byId('rfCancel').addEventListener('click', function () { window.location.href = '优惠活动列表.html'; });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
