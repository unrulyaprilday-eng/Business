(function () {
  'use strict';

  var STORAGE_KEY = 'promoFlashRebateActivities';
  var LIST_URL = '优惠活动列表.html';
  var MAX_TIERS = 10;
  var GAME_TYPES = {
    '电子': [
      ['Gates of Olympus', 'Pragmatic Play'], ['Sweet Bonanza', 'Pragmatic Play'], ['Starlight Princess', 'Pragmatic Play'], ['Sugar Rush', 'Pragmatic Play'], ['Mahjong Ways 2', 'PG Soft'],
      ['Fortune Tiger', 'PG Soft'], ['Lucky Neko', 'PG Soft'], ['Treasures of Aztec', 'PG Soft'], ['Wild Ape #1', 'JILI'], ['Dragon Hatch', 'JDB']
    ],
    '捕鱼': [
      ['Ocean King 3', 'JILI'], ['Mega Fishing', 'JDB'], ['Fishing War', 'CQ9'], ['Royal Fishing', 'JILI'], ['Dragon Fishing', 'JDB'],
      ['Ocean Monster', 'JILI'], ['Fishing God', 'CQ9'], ['Golden Toad', 'JDB'], ['Happy Fishing', 'JILI'], ['King of Fishing', 'Habanero']
    ],
    '棋牌': [
      ['Mahjong Ways', 'PG Soft'], ['Mahjong Ways 2', 'PG Soft'], ['Texas Hold’em', 'JILI'], ['Dragon Tiger', 'JDB'], ['Baccarat Deluxe', 'Habanero'],
      ['Andar Bahar', 'JILI'], ['Sic Bo', 'CQ9'], ['Teen Patti', 'JDB'], ['Golden Baccarat', 'Habanero'], ['Bull Fight', 'JILI']
    ],
    '彩票': [
      ['Lucky Keno', 'JILI'], ['Keno 5', 'JDB'], ['Speed Lottery', 'CQ9'], ['Lucky Numbers', 'Habanero'], ['Bingo 88', 'JILI'],
      ['Golden Keno', 'JDB'], ['Super Lotto', 'CQ9'], ['Quick Pick', 'JILI'], ['Number Match', 'Habanero'], ['Daily Draw', 'JDB']
    ],
    '体育电竞': [
      ['Football Studio', 'Evolution'], ['Penalty Shootout', 'JILI'], ['Basketball Star', 'JDB'], ['Virtual Football', 'Pragmatic Play'], ['Esports Battle', 'JILI'],
      ['Racing League', 'CQ9'], ['Boxing King', 'JDB'], ['Sports Roulette', 'Evolution'], ['Cyber Goal', 'Habanero'], ['Virtual Cup', 'Pragmatic Play']
    ]
  };
  var PROVIDERS = ['Pragmatic Play', 'PG Soft', 'JILI', 'JDB', 'CQ9', 'Habanero', 'Evolution'];

  function byId(id) { return document.getElementById(id); }
  function all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function gameKey(item) { return item[0] + '|' + item[1]; }
  function allGames() {
    var seen = {};
    return Object.keys(GAME_TYPES).reduce(function (games, type) {
      GAME_TYPES[type].forEach(function (item) {
        var key = gameKey(item);
        if (!seen[key]) { games.push({ name: item[0], provider: item[1], type: type, key: key }); seen[key] = true; }
      });
      return games;
    }, []);
  }
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
  function makeChoice(item, selected, kind) {
    var key = kind === 'provider' ? item : item.key;
    var title = kind === 'provider' ? item : item.name;
    var detail = kind === 'provider' ? '厂商' : item.provider + ' · ' + item.type;
    return '<label class="fra-choice"><input type="checkbox" data-fra-selected data-fra-key="' + escapeHtml(key) + '" ' + (selected.indexOf(key) >= 0 ? 'checked' : '') + '><span class="fra-choice-copy"><strong>' + escapeHtml(title) + '</strong><small>' + escapeHtml(detail) + '</small></span></label>';
  }
  function selectedKeys(container) {
    return all('[data-fra-selected]:checked', container).map(function (input) { return input.getAttribute('data-fra-key'); });
  }
  function selectedList(scope) {
    var node = scope === 'type' ? byId('fraRecommendedGames') : (scope === 'provider' ? byId('fraProviders') : byId('fraGames'));
    return node ? selectedKeys(node) : [];
  }
  function renderRecommended(selected) {
    var type = byId('fraGameType').value;
    byId('fraRecommendedGames').innerHTML = GAME_TYPES[type].map(function (item) {
      return makeChoice({ name: item[0], provider: item[1], type: type, key: gameKey(item) }, selected || [], 'game');
    }).join('');
  }
  function renderProviders(selected) {
    byId('fraProviders').innerHTML = PROVIDERS.map(function (provider) { return makeChoice(provider, selected || [], 'provider'); }).join('');
  }
  function renderGames(selected) {
    var query = byId('fraGameSearch').value.trim().toLowerCase();
    var games = allGames().filter(function (item) { return !query || (item.name + ' ' + item.provider + ' ' + item.type).toLowerCase().indexOf(query) >= 0; });
    byId('fraGames').innerHTML = games.map(function (item) { return makeChoice(item, selected || [], 'game'); }).join('');
  }
  function currentScope() {
    var active = document.querySelector('[data-fra-scope][aria-pressed="true"]');
    return active ? active.getAttribute('data-fra-scope') : 'type';
  }
  function syncSelectionSummary() {
    var scope = currentScope();
    var count = selectedList(scope).length;
    var label = scope === 'provider' ? '个厂商' : '款游戏';
    byId('fraSelectionSummary').textContent = '已选择 ' + count + ' ' + label;
  }
  function setScope(scope, selection) {
    all('[data-fra-scope]').forEach(function (button) { button.setAttribute('aria-pressed', String(button.getAttribute('data-fra-scope') === scope)); });
    all('[data-fra-panel]').forEach(function (panel) { panel.hidden = panel.getAttribute('data-fra-panel') !== scope; });
    if (scope === 'type') { renderRecommended(selection || []); }
    if (scope === 'provider') { renderProviders(selection || []); }
    if (scope === 'game') { renderGames(selection || []); }
    syncSelectionSummary();
  }
  function getScopeData() {
    var scope = currentScope();
    var selected = selectedList(scope);
    var all = allGames();
    var names;
    var label;
    if (scope === 'provider') {
      names = selected.slice();
      label = '厂商：' + (names.join('、') || '未选择');
    } else {
      names = selected.map(function (key) {
        var found = all.find(function (item) { return item.key === key; });
        return found ? found.name : key.split('|')[0];
      });
      label = (scope === 'type' ? byId('fraGameType').selectedOptions[0].textContent + '：' : '游戏：') + (names.join('、') || '未选择');
    }
    return { scope: scope, scopeLabel: label, gameType: scope === 'type' ? byId('fraGameType').value : '', selectedIds: selected, selectedNames: names };
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
    byId('fraSort').value = record.sort == null ? '0' : record.sort;
    byId('fraGameType').value = record.gameType || '电子';
    setScope(record.scope || 'type', record.selectedIds || []);
    renderTiers(record.tiers);
  }
  function collectRecord(existing) {
    var scopeData = getScopeData();
    var startTime = byId('fraStart').value;
    var endTime = byId('fraEnd').value;
    var sort = Number(byId('fraSort').value || 0);
    var record = {
      id: existing ? existing.id : 'flash-rebate-' + Date.now(),
      name: byId('fraName').value.trim(),
      title: byId('fraTitle').value.trim(),
      template: '打码赠金',
      startTime: startTime,
      endTime: endTime,
      sort: sort,
      enabled: existing ? existing.enabled !== false : true,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      scope: scopeData.scope,
      scopeLabel: scopeData.scopeLabel,
      gameType: scopeData.gameType,
      selectedIds: scopeData.selectedIds,
      selectedNames: scopeData.selectedNames,
      tiers: readTiers()
    };
    return record;
  }
  function validateRecord(record) {
    if (!record.name) { setError('请输入活动名称。', byId('fraName')); return false; }
    if (!record.title) { setError('请输入活动标题。', byId('fraTitle')); return false; }
    if (!record.startTime) { setError('请选择活动开始时间。', byId('fraStart')); return false; }
    if (!record.endTime) { setError('请选择活动结束时间。', byId('fraEnd')); return false; }
    if (new Date(record.endTime) <= new Date(record.startTime)) { setError('活动结束时间必须晚于开始时间。', byId('fraEnd')); return false; }
    if (!Number.isFinite(record.sort) || record.sort < 0) { setError('排序不能小于 0。', byId('fraSort')); return false; }
    if (!record.selectedIds.length) { setError(record.scope === 'provider' ? '请至少选择一个厂商。' : '请至少选择一个游戏。'); return false; }
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
    else { setScope('type'); }
    all('[data-fra-scope]').forEach(function (button) {
      button.addEventListener('click', function () {
        clearError();
        setScope(button.getAttribute('data-fra-scope'));
      });
    });
    byId('fraGameType').addEventListener('change', function () { renderRecommended([]); syncSelectionSummary(); });
    byId('fraGameSearch').addEventListener('input', function () { renderGames(selectedList('game')); });
    form.addEventListener('change', function (event) {
      if (event.target.matches('[data-fra-selected]')) { syncSelectionSummary(); clearError(); }
    });
    form.addEventListener('input', clearError);
    form.addEventListener('click', function (event) {
      var removeButton = event.target.closest('[data-fra-remove-tier]');
      if (event.target.closest('#fraAddTier')) {
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
      var selectButton = event.target.closest('[data-fra-select-visible]');
      if (selectButton) {
        var panel = selectButton.closest('[data-fra-panel]');
        var checkboxes = all('[data-fra-selected]', panel);
        var shouldCheck = checkboxes.some(function (input) { return !input.checked; });
        checkboxes.forEach(function (input) { input.checked = shouldCheck; });
        selectButton.textContent = shouldCheck ? '取消全选' : '全选当前列表';
        syncSelectionSummary();
      }
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
        '<td>' + escapeHtml(formatTime(record.endTime)) + '</td>',
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
