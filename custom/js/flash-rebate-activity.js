(function () {
  'use strict';

  var STORAGE_KEY = 'promoFlashRebateActivities';
  var LIST_URL = '优惠活动列表.html';
  var MAX_TIERS = 10;
  var selectedGames = {};
  var imageState = {
    Banner: { source: '', busy: false, version: 0 },
    Detail: { source: '', busy: false, version: 0 }
  };
  var descriptionImageBusy = false;
  var descriptionImageVersion = 0;
  var GAME_CATALOG = [
    { id: 'slot-yellowbat::tigerboom', name: 'Tiger Boom' },
    { id: '60096', name: 'Crash Touchdown' },
    { id: 'wg_3025', name: 'Black Myth: Wukong' },
    { id: 'wg_3032', name: 'Mahjong Ways 2' },
    { id: 'wg_3031', name: 'Fortune Tiger' },
    { id: 'wg_3029', name: 'Mahjong Ways' },
    { id: 'wg_3028', name: "Dragon's Treasure2" }
  ].map(function (game) { return { id: game.id, name: game.name, key: game.id }; });

  function byId(id) { return document.getElementById(id); }
  function all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function sanitizeDescription(html) {
    var template = document.createElement('template');
    var allowedTags = 'P BR DIV SPAN STRONG B EM I U S DEL H1 H2 H3 H4 H5 H6 BLOCKQUOTE UL OL LI A IMG TABLE THEAD TBODY TR TD TH'.split(' ');
    var removedTags = 'SCRIPT STYLE IFRAME OBJECT EMBED SVG MATH LINK META'.split(' ');
    template.innerHTML = String(html || '');
    Array.prototype.forEach.call(template.content.querySelectorAll('*'), function (element) {
      var tag = element.tagName;
      var parent = element.parentNode;
      if (!parent) { return; }
      if (removedTags.indexOf(tag) !== -1) { parent.removeChild(element); return; }
      if (allowedTags.indexOf(tag) === -1) {
        while (element.firstChild) { parent.insertBefore(element.firstChild, element); }
        parent.removeChild(element);
        return;
      }
      Array.prototype.slice.call(element.attributes).forEach(function (attribute) {
        var name = attribute.name.toLowerCase();
        var value = attribute.value.trim();
        var allowed = (tag === 'A' && name === 'href') ||
          (tag === 'IMG' && (name === 'src' || name === 'alt' || name === 'title')) ||
          ((tag === 'TD' || tag === 'TH') && (name === 'colspan' || name === 'rowspan'));
        if (!allowed || /^\s*javascript:/i.test(value)) { element.removeAttribute(attribute.name); return; }
        if (tag === 'A' && name === 'href' && !/^(https?:\/\/|mailto:|\/|\.\.?\/|#)/i.test(value)) { element.removeAttribute(attribute.name); return; }
        if (tag === 'IMG' && name === 'src' && !/^data:image\/(png|jpeg|webp);base64,/i.test(value)) { element.removeAttribute(attribute.name); }
      });
    });
    return template.innerHTML;
  }
  function getDescriptionHtml() {
    var editor = byId('fraDescription');
    return sanitizeDescription(editor.classList.contains('is-source') ? editor.textContent : editor.innerHTML);
  }
  function updateDescriptionCount() {
    var editor = byId('fraDescription');
    if (!editor) { return; }
    var text = editor.classList.contains('is-source') ? editor.textContent : editor.innerText;
    byId('fraDescriptionCharCount').textContent = '字符数：' + String(text || '').replace(/\s/g, '').length;
  }
  function renderActivityImage(kind, dataUrl) {
    var state = imageState[kind];
    var prefix = 'fra' + kind;
    var preview = byId(prefix + 'Preview');
    var hint = byId(prefix + 'Hint');
    var remove = byId(prefix + 'Remove');
    state.source = dataUrl || '';
    if (!state.source) {
      preview.removeAttribute('src');
      preview.hidden = true;
      hint.hidden = false;
      remove.hidden = true;
      return;
    }
    preview.src = state.source;
    preview.hidden = false;
    hint.hidden = true;
    remove.hidden = false;
  }
  function uploadActivityImage(kind, file) {
    if (!file) { return; }
    var state = imageState[kind];
    var version = ++state.version;
    var maxSize = kind === 'Banner' ? 500 * 1024 : 1024 * 1024;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > maxSize) {
      state.busy = false;
      setError(kind === 'Banner' ? '请上传 JPG、PNG 或 WebP 图片，Banner 最大 500KB。' : '请上传 JPG、PNG 或 WebP 图片，活动内页图最大 1MB。');
      return;
    }
    state.busy = true;
    var reader = new FileReader();
    function failImage() {
      if (version !== state.version) { return; }
      state.busy = false;
      setError('图片读取失败，请更换有效图片后重试。');
    }
    reader.onerror = failImage;
    reader.onload = function () {
      if (version !== state.version) { return; }
      var image = new Image();
      image.onerror = failImage;
      image.onload = function () {
        if (version !== state.version) { return; }
        state.busy = false;
        renderActivityImage(kind, reader.result);
        clearError();
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
  function bindActivityImages(form) {
    ['Banner', 'Detail'].forEach(function (kind) {
      var prefix = 'fra' + kind;
      var input = byId(prefix + 'File');
      var upload = byId(prefix + 'Upload');
      var remove = byId(prefix + 'Remove');
      upload.addEventListener('click', function () { input.click(); });
      upload.addEventListener('dragover', function (event) { event.preventDefault(); });
      upload.addEventListener('drop', function (event) {
        var file = event.dataTransfer && event.dataTransfer.files[0];
        event.preventDefault();
        if (file) { uploadActivityImage(kind, file); }
      });
      input.addEventListener('change', function () {
        uploadActivityImage(kind, input.files && input.files[0]);
        input.value = '';
      });
      remove.addEventListener('click', function () {
        imageState[kind].version += 1;
        imageState[kind].busy = false;
        input.value = '';
        renderActivityImage(kind, '');
        clearError();
      });
    });
  }
  function insertDescriptionImage(file, editor) {
    if (!file) { return; }
    var version = ++descriptionImageVersion;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 1024 * 1024) {
      descriptionImageBusy = false;
      setError(file.size > 1024 * 1024 ? '描述图片不能超过 1MB。' : '请使用 PNG、JPG 或 WebP 图片。');
      return;
    }
    descriptionImageBusy = true;
    var reader = new FileReader();
    reader.onload = function () {
      if (version !== descriptionImageVersion) { return; }
      descriptionImageBusy = false;
      editor.focus();
      document.execCommand('insertImage', false, reader.result);
      updateDescriptionCount();
      clearError();
    };
    reader.onerror = function () {
      if (version !== descriptionImageVersion) { return; }
      descriptionImageBusy = false;
      setError('图片读取失败，请重试。');
    };
    reader.readAsDataURL(file);
  }
  function bindDescriptionEditor(form) {
    var editor = byId('fraDescription');
    var imageInput = byId('fraDescriptionImage');
    var sourceMode = false;
    var previewMode = false;
    Array.prototype.forEach.call(form.querySelectorAll('[data-fra-command]'), function (button) {
      button.addEventListener('mousedown', function (event) { event.preventDefault(); });
      button.addEventListener('click', function () {
        if (sourceMode || previewMode) { return; }
        editor.focus();
        document.execCommand(button.getAttribute('data-fra-command'), false, button.getAttribute('data-fra-value') || null);
        updateDescriptionCount();
      });
    });
    Array.prototype.forEach.call(form.querySelectorAll('[data-fra-action]'), function (button) {
      button.addEventListener('mousedown', function (event) { event.preventDefault(); });
      button.addEventListener('click', function () {
        if (sourceMode || previewMode) { return; }
        var action = button.getAttribute('data-fra-action');
        if (action === 'link') {
          var url = window.prompt('请输入链接地址');
          if (!url || !/^(https?:\/\/|mailto:)/i.test(url)) { return; }
          editor.focus();
          document.execCommand('createLink', false, url);
        } else if (action === 'image') {
          imageInput.click();
        } else if (action === 'table') {
          editor.focus();
          document.execCommand('insertHTML', false, '<table><tbody><tr><td><br></td><td><br></td></tr><tr><td><br></td><td><br></td></tr></tbody></table><p><br></p>');
        }
        updateDescriptionCount();
      });
    });
    Array.prototype.forEach.call(form.querySelectorAll('[data-fra-mode]'), function (button) {
      button.addEventListener('mousedown', function (event) { event.preventDefault(); });
      button.addEventListener('click', function () {
        var mode = button.getAttribute('data-fra-mode');
        if (mode === 'source') {
          if (previewMode) {
            previewMode = false;
            editor.classList.remove('is-preview');
            editor.setAttribute('contenteditable', 'true');
          }
          if (sourceMode) {
            editor.innerHTML = sanitizeDescription(editor.textContent);
            editor.classList.remove('is-source');
            sourceMode = false;
          } else {
            editor.textContent = editor.innerHTML;
            editor.classList.add('is-source');
            sourceMode = true;
          }
          editor.setAttribute('contenteditable', 'true');
          button.setAttribute('aria-pressed', String(sourceMode));
          var previewButton = form.querySelector('[data-fra-mode="preview"]');
          if (previewButton) { previewButton.setAttribute('aria-pressed', 'false'); }
        } else {
          if (sourceMode) {
            editor.innerHTML = sanitizeDescription(editor.textContent);
            editor.classList.remove('is-source');
            sourceMode = false;
            form.querySelector('[data-fra-mode="source"]').setAttribute('aria-pressed', 'false');
          }
          previewMode = !previewMode;
          editor.classList.toggle('is-preview', previewMode);
          editor.setAttribute('contenteditable', String(!previewMode));
          button.setAttribute('aria-pressed', String(previewMode));
        }
        updateDescriptionCount();
      });
    });
    imageInput.addEventListener('change', function () {
      insertDescriptionImage(imageInput.files && imageInput.files[0], editor);
      imageInput.value = '';
    });
    editor.addEventListener('input', updateDescriptionCount);
    editor.addEventListener('paste', function (event) {
      var html = event.clipboardData && event.clipboardData.getData('text/html');
      if (!html || sourceMode || previewMode) { return; }
      event.preventDefault();
      document.execCommand('insertHTML', false, sanitizeDescription(html));
      updateDescriptionCount();
    });
    updateDescriptionCount();
  }
  function allGames() { return GAME_CATALOG.slice(); }
  function readRecords() {
    try {
      var records = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(records) ? records.filter(function (record) { return record && typeof record.id === 'string'; }) : [];
    } catch (error) { return []; }
  }
  function writeRecords(records) {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); return true; }
    catch (error) { window.alert('打码赠金活动保存失败，请检查浏览器存储空间后重试。'); return false; }
  }
  function setError(message, control) {
    var node = byId('fraError');
    if (!node) { window.alert(message); return; }
    node.textContent = message;
    node.hidden = false;
    if (control) { control.focus(); }
    node.scrollIntoView({ block: 'nearest' });
  }
  function clearError() { var node = byId('fraError'); if (node) { node.hidden = true; } }
  function syncLongTerm() {
    var longTerm = byId('fraLongTerm').checked;
    byId('fraEnd').disabled = longTerm;
    byId('fraEnd').required = !longTerm;
  }
  function makeChoice(item) {
    var key = item.key;
    var added = Boolean(selectedGames[key]);
    return '<div class="fra-choice"><span class="fra-choice-copy"><strong>' + escapeHtml(item.name) + '</strong><small>ID：' + escapeHtml(item.id) + '</small></span><button type="button" data-fra-add-game="' + escapeHtml(key) + '" ' + (added ? 'disabled' : '') + '>' + (added ? '已添加' : '添加') + '</button></div>';
  }
  function renderGames() {
    var query = byId('fraGameSearch').value.trim().toLowerCase();
    var container = byId('fraGames');
    if (!query) {
      container.innerHTML = '<p class="fra-empty-selection">输入游戏名称或 ID 搜索。</p>';
      return;
    }
    var games = allGames().filter(function (item) {
      return (item.name + ' ' + item.id).toLowerCase().indexOf(query) >= 0;
    });
    container.innerHTML = games.map(function (item) { return makeChoice(item); }).join('') || '<p class="fra-empty-selection">没有匹配的游戏。</p>';
  }
  function syncSelectionSummary() {
    var count = Object.keys(selectedGames).length;
    byId('fraSelectionSummary').textContent = '已添加 ' + count + ' 款游戏';
    renderSelectedGames();
  }
  function renderSelectedGames() {
    var container = byId('fraSelectedGames');
    var games = Object.keys(selectedGames).map(function (key) { return selectedGames[key]; });
    if (!container) { return; }
    if (!games.length) {
      container.innerHTML = '<p class="fra-empty-selection">请从上方游戏列表添加游戏。</p>';
      return;
    }
    container.innerHTML = games.map(function (game) {
      return '<article class="fra-selected-game" data-fra-selected-game="' + escapeHtml(game.key) + '">' +
        '<div class="fra-selected-game-head"><span class="fra-game-number">' + escapeHtml(game.name) + '</span><button type="button" data-fra-remove-game="' + escapeHtml(game.key) + '" title="移除游戏" aria-label="移除 ' + escapeHtml(game.name) + '">移除</button><small>ID：' + escapeHtml(game.id || '-') + '</small></div>' +
        '<label><span>配套文字</span><textarea data-fra-copy="' + escapeHtml(game.key) + '" maxlength="500" rows="2" placeholder="请输入该游戏专属的活动文案">' + escapeHtml(game.text || '') + '</textarea></label>' +
        '</article>';
    }).join('');
  }
  function getSelectedGameData() {
    var games = Object.keys(selectedGames).map(function (key) { return selectedGames[key]; });
    var names = games.map(function (game) { return game.name; });
    var label = '游戏：' + (names.join('、') || '未选择');
    return { scopeLabel: label, selectedIds: games.map(function (game) { return game.id || game.key; }), selectedNames: names, selectedGames: games };
  }
  function createTierRow(tier, index) {
    tier = tier || {};
    return '<tr><td class="fra-tier-index">第' + (index + 1) + '档</td>' +
      '<td><input data-fra-threshold type="number" min="0.01" step="0.01" placeholder="请输入打码量" required value="' + escapeHtml(tier.threshold == null ? '' : tier.threshold) + '" aria-label="第' + (index + 1) + '档累计有效打码量"></td>' +
      '<td><input data-fra-reward type="number" min="0.01" step="0.01" placeholder="请输入固定金额" required value="' + escapeHtml(tier.reward == null ? '' : tier.reward) + '" aria-label="第' + (index + 1) + '档固定奖励金额"></td>' +
      '<td><button type="button" data-fra-remove-tier>删除</button></td></tr>';
  }
  function syncTierRows() {
    var rows = all('#fraTierRows tr');
    rows.forEach(function (row, index) {
      row.querySelector('.fra-tier-index').textContent = '第' + (index + 1) + '档';
      row.querySelector('[data-fra-threshold]').setAttribute('aria-label', '第' + (index + 1) + '档累计有效打码量');
      row.querySelector('[data-fra-reward]').setAttribute('aria-label', '第' + (index + 1) + '档固定奖励金额');
      row.querySelector('[data-fra-remove-tier]').disabled = rows.length <= 1;
    });
    byId('fraAddTier').disabled = rows.length >= MAX_TIERS;
    byId('fraAddTier').textContent = rows.length >= MAX_TIERS ? '已达档位上限' : '＋ 添加奖励档位';
  }
  function renderTiers(tiers) {
    var values = Array.isArray(tiers) && tiers.length ? tiers : [{}];
    byId('fraTierRows').innerHTML = values.slice(0, MAX_TIERS).map(createTierRow).join('');
    syncTierRows();
  }
  function readTiers() {
    return all('#fraTierRows tr').map(function (row) {
      return {
        threshold: row.querySelector('[data-fra-threshold]').value.trim(),
        reward: row.querySelector('[data-fra-reward]').value.trim()
      };
    });
  }
  function populateForm(record) {
    byId('fraName').value = record.name || '';
    byId('fraTitle').value = record.title || '';
    byId('fraStart').value = record.startTime || '';
    byId('fraEnd').value = record.endTime || '';
    byId('fraLongTerm').checked = record.longTerm === true;
    byId('fraWagerMultiple').value = record.wagerMultiple == null ? '1' : record.wagerMultiple;
    byId('fraSort').value = record.sort == null ? '0' : record.sort;
    selectedGames = {};
    var storedGames = Array.isArray(record.selectedGames) ? record.selectedGames : [];
    if (!storedGames.length && Array.isArray(record.selectedIds)) {
      var catalog = allGames();
      storedGames = record.selectedIds.reduce(function (games, key, index) {
        var directMatch = catalog.find(function (game) { return game.id === key || game.key === key || game.name === (record.selectedNames || [])[index]; });
        if (directMatch) { games.push(directMatch); }
        return games;
      }, []);
    }
    storedGames.forEach(function (game) {
      var name = game.name || String(game.key || '').split('|')[0];
      var catalogGame = allGames().find(function (item) { return item.id === game.id || item.name === name; });
      var id = catalogGame ? catalogGame.id : (game.id || '');
      var key = catalogGame ? catalogGame.key : (game.key || id || name);
      if (name) { selectedGames[key] = { key: key, id: id, name: name, text: game.text || '' }; }
    });
    renderActivityImage('Banner', record.banner || record.bannerImage || '');
    renderActivityImage('Detail', record.detailImage || '');
    if (typeof record.descriptionHtml === 'string') {
      byId('fraDescription').innerHTML = sanitizeDescription(record.descriptionHtml);
    }
    updateDescriptionCount();
    renderTiers(record.tiers);
  }
  function collectRecord(existing) {
    var scopeData = getSelectedGameData();
    var startTime = byId('fraStart').value;
    var endTime = byId('fraEnd').value;
    var wagerMultiple = byId('fraWagerMultiple').value.trim();
    var sort = Number(byId('fraSort').value || 0);
    var record = {
      id: existing ? existing.id : 'flash-rebate-' + Date.now(),
      name: byId('fraName').value.trim(),
      title: byId('fraTitle').value.trim(),
      template: '打码赠金',
      startTime: startTime,
      endTime: endTime,
      longTerm: byId('fraLongTerm').checked,
      wagerMultiple: wagerMultiple,
      sort: sort,
      enabled: existing ? existing.enabled !== false : true,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      scopeLabel: scopeData.scopeLabel,
      selectedIds: scopeData.selectedIds,
      selectedNames: scopeData.selectedNames,
      selectedGames: scopeData.selectedGames,
      tiers: readTiers(),
      banner: imageState.Banner.source,
      detailImage: imageState.Detail.source,
      descriptionHtml: getDescriptionHtml()
    };
    return record;
  }
  function validateRecord(record) {
    if (imageState.Banner.busy || imageState.Detail.busy || descriptionImageBusy) { setError('图片仍在读取，请完成后再保存。'); return false; }
    if (!record.name) { setError('请输入活动名称。', byId('fraName')); return false; }
    if (!record.title) { setError('请输入活动标题。', byId('fraTitle')); return false; }
    if (!record.startTime) { setError('请选择活动开始时间。', byId('fraStart')); return false; }
    if (!record.longTerm && !record.endTime) { setError('请选择活动结束时间，或勾选长期有效。', byId('fraEnd')); return false; }
    if (!record.longTerm && new Date(record.endTime) <= new Date(record.startTime)) { setError('活动结束时间必须晚于开始时间。', byId('fraEnd')); return false; }
    var wagerMultiple = Number(record.wagerMultiple);
    if (record.wagerMultiple === '' || !Number.isFinite(wagerMultiple) || wagerMultiple < 0) { setError('请输入大于或等于 0 的打码倍数。', byId('fraWagerMultiple')); return false; }
    if (!Number.isInteger(record.sort) || record.sort < 0) { setError('排序请输入大于或等于 0 的整数。', byId('fraSort')); return false; }
    record.wagerMultiple = String(wagerMultiple);
    if (!record.selectedIds.length) { setError('请至少添加一款游戏。'); return false; }
    if (!record.tiers.length) { setError('请至少配置一个奖励档位。', byId('fraAddTier')); return false; }
    for (var index = 0; index < record.tiers.length; index += 1) {
      var tier = record.tiers[index];
      var threshold = Number(tier.threshold);
      var reward = Number(tier.reward);
      if (tier.threshold === '' || !Number.isFinite(threshold) || threshold <= 0) {
        setError('第' + (index + 1) + '档累计有效打码量须大于 0。', all('[data-fra-threshold]')[index]);
        return false;
      }
      if (tier.reward === '' || !Number.isFinite(reward) || reward <= 0) {
        setError('第' + (index + 1) + '档固定奖励金额须大于 0。', all('[data-fra-reward]')[index]);
        return false;
      }
      if (index > 0 && threshold <= Number(record.tiers[index - 1].threshold)) {
        setError('累计有效打码量须按档位逐档递增。', all('[data-fra-threshold]')[index]);
        return false;
      }
      tier.threshold = String(threshold);
      tier.reward = String(reward);
    }
    return true;
  }
  function bindForm() {
    var form = byId('flashRebateForm');
    if (!form) { return; }
    var editId = new URLSearchParams(window.location.search).get('flashRebateId');
    var records = readRecords();
    var existing = editId ? records.find(function (record) { return record.id === editId; }) : null;
    if (editId && !existing) { setError('该打码赠金活动不存在或已删除。'); return; }
    if (existing) { populateForm(existing); }
    syncLongTerm();
    syncSelectionSummary();
    byId('fraGameSearch').addEventListener('input', renderGames);
    renderGames();
    bindActivityImages(form);
    bindDescriptionEditor(form);
    byId('fraLongTerm').addEventListener('change', function () { syncLongTerm(); clearError(); });
    form.addEventListener('input', function (event) {
      var copyKey = event.target.getAttribute('data-fra-copy');
      if (copyKey && selectedGames[copyKey]) { selectedGames[copyKey].text = event.target.value; }
      clearError();
    });
    form.addEventListener('click', function (event) {
      var removeButton = event.target.closest('[data-fra-remove-tier]');
      var removeGameButton = event.target.closest('[data-fra-remove-game]');
      var addGameButton = event.target.closest('[data-fra-add-game]');
      if (addGameButton) {
        var key = addGameButton.getAttribute('data-fra-add-game');
        var game = allGames().find(function (item) { return item.key === key; });
        if (game && !selectedGames[key]) {
          selectedGames[key] = { key: game.key, id: game.id, name: game.name, text: '' };
          renderGames();
          syncSelectionSummary();
        }
        clearError();
      } else if (removeGameButton) {
        delete selectedGames[removeGameButton.getAttribute('data-fra-remove-game')];
        renderGames();
        syncSelectionSummary();
      } else if (event.target.closest('#fraAddTier')) {
        clearError();
        var rows = byId('fraTierRows');
        if (rows.children.length < MAX_TIERS) {
          rows.insertAdjacentHTML('beforeend', createTierRow({}, rows.children.length));
          syncTierRows();
        }
      } else if (removeButton && byId('fraTierRows').children.length > 1) {
        clearError();
        removeButton.closest('tr').remove();
        syncTierRows();
      }
    });
    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-fra-cancel]') && document.body.classList.contains('flash-rebate-template-active')) {
        event.preventDefault();
        window.location.href = LIST_URL;
      }
    }, true);
    form.addEventListener('submit', function (event) {
      var record;
      var currentRecords;
      event.preventDefault();
      clearError();
      record = collectRecord(existing);
      if (!validateRecord(record)) { return; }
      currentRecords = readRecords();
      if (existing) {
        currentRecords = currentRecords.map(function (item) { return item.id === existing.id ? record : item; });
      } else {
        currentRecords.unshift(record);
      }
      if (writeRecords(currentRecords)) { window.location.href = LIST_URL; }
    });
  }
  function formatTime(value) { return value ? String(value).replace('T', ' ') : '-'; }
  function renderActivityRows() {
    var tbody = byId('promoActivityRows');
    var records = readRecords();
    var typeFilter = byId('activityTypeFilter');
    if (!tbody) { return; }
    all('[data-flash-rebate-id]', tbody).forEach(function (row) { row.remove(); });
    records.slice().reverse().forEach(function (record) {
      var row = document.createElement('tr');
      var enabled = record.enabled !== false;
      var details = record.scopeLabel || (record.selectedNames || []).join('、') || '-';
      row.hidden = Boolean(typeFilter && typeFilter.value !== '全部类型' && typeFilter.value !== '打码赠金');
      row.setAttribute('data-flash-rebate-id', record.id);
      row.innerHTML = [
        '<td title="' + escapeHtml(record.name) + '">' + escapeHtml(record.name) + '</td>',
        '<td class="ellipsis" title="' + escapeHtml(details) + '">' + escapeHtml(details) + '</td>',
        '<td title="' + escapeHtml(record.title) + '">' + escapeHtml(record.title) + '</td>',
        '<td>打码赠金</td>',
        '<td>' + escapeHtml(formatTime(record.startTime)) + '</td>',
        '<td>' + escapeHtml(record.longTerm ? '长期有效' : formatTime(record.endTime)) + '</td>',
        '<td>-</td><td><span class="switch on" aria-label="活动可见"></span></td>',
        '<td><button class="switch' + (enabled ? ' on' : '') + '" type="button" data-fra-toggle role="switch" aria-checked="' + enabled + '" aria-label="' + (enabled ? '关闭活动' : '启用活动') + '"></button></td>',
        '<td>' + escapeHtml(record.sort == null ? '0' : record.sort) + '</td><td>admin</td>',
        '<td class="actions"><button type="button" data-fra-edit>编辑</button><button class="danger" type="button" data-fra-delete>删除</button></td>'
      ].join('');
      tbody.insertBefore(row, tbody.firstChild);
    });
    var count = Array.prototype.filter.call(tbody.rows, function (row) { return !row.hidden; }).length;
    var spans = document.querySelectorAll('.pagination > span');
    if (spans.length) { spans[spans.length - 1].textContent = '共 ' + count + ' 条记录'; }
  }
  function bindList() {
    var tbody = byId('promoActivityRows');
    if (!tbody) { return; }
    renderActivityRows();
    tbody.addEventListener('click', function (event) {
      var row = event.target.closest('[data-flash-rebate-id]');
      var id;
      var records;
      if (!row) { return; }
      event.preventDefault();
      event.stopImmediatePropagation();
      id = row.getAttribute('data-flash-rebate-id');
      if (event.target.closest('[data-fra-edit]')) {
        window.location.href = '新增活动.html?flashRebateId=' + encodeURIComponent(id);
        return;
      }
      if (event.target.closest('[data-fra-toggle]')) {
        records = readRecords().map(function (record) { if (record.id === id) { record.enabled = record.enabled === false; } return record; });
        if (writeRecords(records)) { renderActivityRows(); }
        return;
      }
      if (event.target.closest('[data-fra-delete]') && window.confirm('确定删除该打码赠金活动吗？删除后不可恢复。')) {
        records = readRecords().filter(function (record) { return record.id !== id; });
        if (writeRecords(records)) { renderActivityRows(); }
      }
    }, true);
  }
  document.addEventListener('DOMContentLoaded', function () {
    bindForm();
    bindList();
  });
})();
