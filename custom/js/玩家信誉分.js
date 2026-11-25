(function () {
  'use strict';

  function init() {
    var root = document.getElementById('creditPage');
    if (!root) return;
    var api = window.CreditScore;
    function el(id) { return document.getElementById(id); }
    function show(id, visible) { el(id).hidden = !visible; }
    function value(id) { return el(id).value.trim(); }
    var feedbackTimer;
    function feedback(message, error) {
      window.clearTimeout(feedbackTimer);
      el('creditFeedback').textContent = message || '';
      el('creditFeedback').classList.toggle('is-error', !!error);
      show('creditFeedback', !!message);
      if (message) feedbackTimer = window.setTimeout(function () { show('creditFeedback', false); }, error ? 5000 : 2400);
    }
    function fieldError(id, message) {
      el(id).textContent = message || '';
      show(id, !!message);
    }
    if (!api) {
      show('disabledState', false);
      show('deniedState', true);
      el('deniedState').textContent = '暂时无法加载信誉分，请刷新页面后重试。';
      return;
    }
    var editing = false;
    var draft = false;
    var editorMerchant = null;
    var editorOperator = null;
    var activeTab = 'members';
    var memberFilter = {};
    var historyFilter = {};

    function context() {
      var session = api.session();
      var permissions = session.permissions || {};
      return { session: session, permissions: permissions, enabled: api.isEnabled(session.merchantId) };
    }
    function canList(c) { return c.enabled && (c.permissions.view || c.permissions.adjust); }
    function cell(row, text, className) {
      var td = document.createElement('td');
      td.textContent = text == null ? '—' : String(text);
      if (className) td.className = className;
      row.appendChild(td);
      return td;
    }
    function empty(body, cols, message) {
      var tr = document.createElement('tr');
      var td = cell(tr, message, 'credit-empty-cell');
      td.colSpan = cols;
      body.appendChild(tr);
    }
    function includes(text, filter) {
      return !filter || String(text == null ? '' : text).toLowerCase().indexOf(filter.toLowerCase()) !== -1;
    }
    function action(container, label, callback) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'credit-action';
      button.textContent = label;
      button.addEventListener('click', function () { callback(button); });
      container.appendChild(button);
    }
    function renderMembers(c) {
      var body = el('memberRows');
      body.replaceChildren();
      if (!canList(c)) {
        el('memberCount').textContent = '共 0 条记录';
        return;
      }
      var recordFilter = c.permissions.view ? memberFilter.records : '';
      var list = api.getMembers(c.session.merchantId).filter(function (member) {
        return includes(member.memberId, memberFilter.id) && includes(member.memberName, memberFilter.name) &&
          (!recordFilter || member.hasAdjustments === (recordFilter === 'with'));
      });
      list.forEach(function (member) {
        var tr = document.createElement('tr');
        cell(tr, member.memberId);
        cell(tr, member.memberName);
        cell(tr, member.score);
        var controls = document.createElement('span');
        controls.className = 'credit-row-actions';
        if (c.permissions.adjust) action(controls, '调整信誉分', function (button) {
          var current = context();
          if (!canList(current) || !current.permissions.adjust || current.session.merchantId !== c.session.merchantId) {
            refresh();
            feedback('当前无法调整信誉分。', true);
            return;
          }
          if (window.CreditScoreDialog) window.CreditScoreDialog.open(member, button, function () {
            var replacement = body.querySelector('[data-credit-member="' + CSS.escape(member.memberId) + '"] .credit-action');
            if (replacement) replacement.focus();
            feedback('调整成功');
          });
          else feedback('暂时无法调整，请刷新后重试。', true);
        });
        if (c.permissions.view) action(controls, '变动记录', function () {
          var current = context();
          if (!current.enabled || !current.permissions.view || current.session.merchantId !== c.session.merchantId) {
            refresh();
            return;
          }
          el('historyFilters').reset();
          fieldError('historyError', '');
          el('historyMemberId').value = member.memberId;
          historyFilter = { id: String(member.memberId), exact: true };
          selectTab('history', true);
        });
        var td = cell(tr, '');
        td.appendChild(controls);
        tr.dataset.creditMember = member.memberId;
        body.appendChild(tr);
      });
      if (!list.length) empty(body, 4, memberFilter.id || memberFilter.name || recordFilter ? '未找到符合条件的会员' : '暂无数据');
      el('memberCount').textContent = '共 ' + list.length + ' 条记录';
    }
    function formatTime(timestamp) {
      var date = new Date(timestamp);
      if (!Number.isFinite(date.getTime())) return '—';
      function pad(n) { return String(n).padStart(2, '0'); }
      return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
    }
    function renderHistory(c) {
      var body = el('historyRows');
      body.replaceChildren();
      if (!c.enabled || !c.permissions.view) {
        el('historyCount').textContent = '共 0 条记录';
        return;
      }
      var list = api.getHistory(c.session.merchantId).filter(function (row) {
        return (historyFilter.exact ? String(row.memberId) === historyFilter.id : includes(row.memberId, historyFilter.id)) &&
          includes(row.memberName, historyFilter.name) &&
          includes(row.operator, historyFilter.operator) &&
          (historyFilter.start == null || row.timestamp >= historyFilter.start) &&
          (historyFilter.end == null || row.timestamp <= historyFilter.end);
      });
      list.forEach(function (row) {
        var tr = document.createElement('tr');
        cell(tr, row.memberId);
        cell(tr, row.memberName);
        cell(tr, row.before);
        cell(tr, row.delta > 0 ? '加分' : '扣分');
        cell(tr, (row.delta > 0 ? '+' : '') + row.delta, row.delta > 0 ? 'credit-delta-plus' : 'credit-delta-minus');
        cell(tr, row.after);
        cell(tr, row.reason, 'credit-reason');
        cell(tr, row.operator);
        cell(tr, formatTime(row.timestamp));
        body.appendChild(tr);
      });
      if (!list.length) empty(body, 9, Object.values(historyFilter).some(function (filter) { return filter != null && filter !== ''; }) ? '未找到符合条件的变动记录' : '暂无变动记录');
      el('historyCount').textContent = '共 ' + list.length + ' 条记录';
    }
    var previousContext = null;
    function refresh() {
      var c = context();
      var contextKey = JSON.stringify([c.session.merchantId, c.session.operator, c.permissions]);
      if (previousContext && previousContext !== contextKey) {
        memberFilter = {};
        historyFilter = {};
        el('memberFilters').reset();
        el('historyFilters').reset();
        activeTab = 'members';
        editing = false;
        feedback('当前账号或权限已变更。', false);
      }
      previousContext = contextKey;
      if (editing && (!c.permissions.configure || editorMerchant !== c.session.merchantId || editorOperator !== c.session.operator)) editing = false;
      var accessible = api.canAccessPage() && (c.enabled ? !!(c.permissions.view || c.permissions.adjust || c.permissions.configure) : !!c.permissions.configure);
      show('creditSettings', accessible && !!c.permissions.configure);
      el('creditMerchant').textContent = c.permissions.configure ? '商户ID：' + c.session.merchantId : '';
      show('deniedState', !accessible);
      show('disabledState', accessible && !c.enabled);
      show('configOnlyState', accessible && c.enabled && !canList(c));
      show('creditContent', accessible && canList(c));
      show('historyTab', accessible && c.enabled && !!c.permissions.view);
      show('memberHistoryField', accessible && c.enabled && !!c.permissions.view);
      show('editSettings', !editing);
      show('settingsActions', editing);
      el('draftHint').textContent = c.enabled && !draft ? '停用后保留原分数和变动记录。' : '保存后生效。';
      var switchOn = editing ? draft : c.enabled;
      el('enabledSwitch').disabled = !editing || !accessible || !c.permissions.configure;
      el('enabledSwitch').classList.toggle('is-on', switchOn);
      el('enabledSwitch').setAttribute('aria-checked', String(switchOn));
      el('enabledSwitch').setAttribute('aria-describedby', editing ? 'enabledStatus draftHint settingsError' : 'enabledStatus');
      el('enabledStatus').textContent = editing ? (draft ? '启用' : '停用') : (c.enabled ? '已启用' : '未启用');
      el('enabledStatus').classList.toggle('is-on', switchOn);
      if (!c.enabled || !c.permissions.view) activeTab = 'members';
      ['members', 'history'].forEach(function (name) {
        var selected = name === activeTab;
        el(name + 'Tab').classList.toggle('is-active', selected);
        el(name + 'Tab').setAttribute('aria-selected', String(selected));
        el(name + 'Tab').tabIndex = selected ? 0 : -1;
        show(name + 'Panel', accessible && canList(c) && selected && (name !== 'history' || !!c.permissions.view));
      });
      renderMembers(accessible ? c : { enabled: false, permissions: {} });
      renderHistory(accessible ? c : { enabled: false, permissions: {} });
    }
    function beginEdit() {
      var c = context();
      if (!c.permissions.configure || !api.canAccessPage()) return refresh();
      editorMerchant = c.session.merchantId;
      editorOperator = c.session.operator;
      editing = true;
      draft = c.enabled;
      feedback('');
      fieldError('settingsError', '');
      refresh();
      el('enabledSwitch').focus();
    }
    el('editSettings').addEventListener('click', beginEdit);
    el('enabledSwitch').addEventListener('click', function () {
      var c = context();
      if (!editing || !c.permissions.configure || c.session.merchantId !== editorMerchant || c.session.operator !== editorOperator) return refresh();
      draft = !draft;
      fieldError('settingsError', '');
      refresh();
    });
    el('cancelSettings').addEventListener('click', function () {
      editing = false;
      fieldError('settingsError', '');
      refresh();
      el('editSettings').focus();
    });
    el('saveSettings').addEventListener('click', function () {
      var c = context();
      if (!editing || !c.permissions.configure || c.session.merchantId !== editorMerchant || c.session.operator !== editorOperator) return refresh();
      var result;
      try { result = api.setEnabled(c.session.merchantId, draft); }
      catch (error) { result = { ok: false, error: '保存失败，请重试。' }; }
      if (!result || !result.ok) { fieldError('settingsError', (result && result.error) || '保存失败，请重试。'); refresh(); return; }
      editing = false;
      fieldError('settingsError', '');
      feedback('保存成功');
      refresh();
      el('editSettings').focus();
    });
    function selectTab(name, focus) {
      var c = context();
      if (!canList(c) || (name === 'history' && !c.permissions.view)) return;
      activeTab = name;
      refresh();
      if (focus) el(name + 'Tab').focus();
    }
    ['members', 'history'].forEach(function (name) {
      var tab = el(name + 'Tab');
      tab.addEventListener('click', function () { selectTab(name, false); });
      tab.addEventListener('keydown', function (event) {
        if (el('historyTab').hidden || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        var next = event.key === 'Home' ? 'members' : event.key === 'End' ? 'history' : name === 'members' ? 'history' : 'members';
        selectTab(next, true);
      });
    });
    el('memberFilters').addEventListener('submit', function (event) {
      event.preventDefault();
      memberFilter = { id: value('memberId'), name: value('memberName'), records: value('memberHistory') };
      refresh();
    });
    el('resetMembers').addEventListener('click', function () { el('memberFilters').reset(); memberFilter = {}; refresh(); });
    el('historyFilters').addEventListener('submit', function (event) {
      event.preventDefault();
      var start = value('historyStart') ? new Date(value('historyStart')).getTime() : null;
      var end = value('historyEnd') ? new Date(value('historyEnd')).getTime() + 59999 : null;
      if ((start !== null && !Number.isFinite(start)) || (end !== null && !Number.isFinite(end))) { fieldError('historyError', '请选择有效的操作时间。'); return; }
      if (start !== null && end !== null && start > end) { fieldError('historyError', '结束时间不能早于开始时间。'); el('historyEnd').focus(); return; }
      historyFilter = { id: value('historyMemberId'), name: value('historyMemberName'), operator: value('historyOperator'), start: start, end: end };
      fieldError('historyError', '');
      refresh();
    });
    ['historyStart', 'historyEnd'].forEach(function (id) {
      el(id).addEventListener('input', function () { fieldError('historyError', ''); });
    });
    el('resetHistory').addEventListener('click', function () { el('historyFilters').reset(); historyFilter = {}; fieldError('historyError', ''); refresh(); });
    api.subscribe(refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    refresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
