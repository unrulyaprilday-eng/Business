(function () {
  var TASK_STORAGE_KEY = 'promoCouponTaskActivities';
  var COUPON_STORAGE_KEY = 'business-ticket-coupons-v1';
  var TASK_TYPES = {
    recharge_total: { label: '累计充值', condition: '累计充值', unit: '金额', integer: false },
    wager: { label: '游戏任务', condition: '游戏任务条件', unit: '金额', integer: false },
    recharge_single: { label: '单次充值', condition: '单次充值', unit: '金额', integer: false },
    login_total: { label: '累计登录', condition: '累计登录', unit: '天', integer: true }
  };
  var GAME_CONDITIONS = {
    wager: { condition: '打码', unit: '金额', integer: false, placeholder: '请输入打码门槛' },
    game_count: { condition: '游戏次数', unit: '次', integer: true, placeholder: '请输入游戏次数' }
  };
  var RECHARGE_PERIODS = {
    day: '自然日',
    week: '自然周',
    month: '自然月'
  };
  var records = [];
  var coupons = [];
  var editorActivity = null;
  var activeTaskType = 'recharge_total';
  var activeGameCondition = 'wager';
  var editingTierId = '';
  var resetPeriodDraft = 'day';
  var isEditingResetPeriod = false;

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getTaskType(type) {
    return TASK_TYPES[type] || TASK_TYPES.recharge_total;
  }

  function getGameCondition(condition) {
    return GAME_CONDITIONS[condition] || GAME_CONDITIONS.wager;
  }

  function getRechargePeriod(period) {
    return RECHARGE_PERIODS[period] ? period : 'day';
  }

  function getActivityResetPeriod(activity) {
    if (activity && RECHARGE_PERIODS[activity.resetPeriod]) { return activity.resetPeriod; }
    var tasks = activity && Array.isArray(activity.tasks) ? activity.tasks : [];
    var legacyTask = tasks.find(function (task) { return RECHARGE_PERIODS[task.rechargePeriod]; });
    return legacyTask ? legacyTask.rechargePeriod : 'day';
  }

  function renderResetPeriod() {
    var period = getRechargePeriod(editorActivity.resetPeriod);
    Array.prototype.forEach.call(document.querySelectorAll('[name="taskResetPeriod"]'), function (input) {
      input.checked = input.value === period;
      input.disabled = !isEditingResetPeriod;
    });
  }

  function renderFeatureToggle() {
    var enabled = editorActivity.enabled !== false;
    var toggle = byId('taskFeatureToggle');
    toggle.classList.toggle('on', enabled);
    toggle.setAttribute('aria-checked', enabled ? 'true' : 'false');
    toggle.setAttribute('aria-label', enabled ? '关闭优惠券任务功能' : '启用优惠券任务功能');
  }

  function openResetPeriodEditor() {
    resetPeriodDraft = getRechargePeriod(editorActivity.resetPeriod);
    isEditingResetPeriod = true;
    renderResetPeriod();
    byId('editTaskResetPeriod').hidden = true;
    byId('taskResetPeriodEditActions').hidden = false;
  }

  function closeResetPeriodEditor() {
    isEditingResetPeriod = false;
    byId('editTaskResetPeriod').hidden = false;
    byId('taskResetPeriodEditActions').hidden = true;
    renderResetPeriod();
  }

  function normalizeActivity(record) {
    if (!record || typeof record !== 'object') { return null; }
    if (Array.isArray(record.tasks)) { return record; }
    var task = record.taskType ? {
      id: record.id + '-tier',
      taskType: record.taskType,
      conditionValue: String(record.conditionValue || ''),
      couponId: record.couponId || '',
      couponName: record.couponName || '',
      couponType: record.couponType || '',
      couponSnapshot: record.couponSnapshot || {
        id: record.couponId || '',
        name: record.couponName || '',
        type: record.couponType || '',
        wagerMultiple: record.wagerMultiple || '0'
      },
      wagerMultiple: record.wagerMultiple == null ? '0' : String(record.wagerMultiple)
    } : null;
    var activity = Object.assign({}, record, { tasks: task ? [task] : [] });
    return activity;
  }

  function seedTaskActivities() {
    var configuredCoupons = readCoupons();
    var samples = {
      percent: { id: 'CPN-20261104-001', name: '新客优惠券', type: 'percent', enabled: true, discountValue: 10, wagerMultiple: 0 },
      fixed: { id: 'CPN-20261104-002', name: '满额赠送券', type: 'recharge_fixed', enabled: true, rechargeThreshold: 100, fixedBonus: 20, wagerMultiple: 0 },
      rate: { id: 'CPN-20261104-003', name: '充值比例赠送券', type: 'recharge_percent', enabled: true, rechargeThreshold: 50, bonusRate: 10, maxBonus: 100, wagerMultiple: 0 }
    };
    Object.keys(samples).forEach(function (key) {
      samples[key] = configuredCoupons.find(function (coupon) { return coupon.id === samples[key].id; }) || samples[key];
    });
    function task(id, taskType, conditionValue, coupon) {
      return {
        id: id,
        taskType: taskType,
        conditionValue: String(conditionValue),
        couponId: coupon.id,
        couponName: coupon.name,
        couponType: coupon.type,
        couponSnapshot: coupon,
        wagerMultiple: String(coupon.wagerMultiple || 0)
      };
    }
    return [{
      id: 'coupon-activity-demo-2026',
      name: '多类别优惠券任务',
      title: '多类别优惠券任务',
      startTime: '2026-11-01T00:00',
      endTime: '2026-12-31T23:59',
      sort: '10',
      enabled: true,
      singleRewardLimit: true,
      visible: true,
      tasks: [
        task('coupon-tier-deposit-9000', 'recharge_total', 9000, samples.fixed),
        task('coupon-tier-deposit-20000', 'recharge_total', 20000, samples.rate),
        task('coupon-tier-wager-50000', 'wager', 50000, samples.percent),
        task('coupon-tier-wager-100000', 'wager', 100000, samples.fixed),
        task('coupon-tier-single-1000', 'recharge_single', 1000, samples.fixed),
        task('coupon-tier-single-3000', 'recharge_single', 3000, samples.rate),
        task('coupon-tier-login-3', 'login_total', 3, samples.percent),
        task('coupon-tier-login-7', 'login_total', 7, samples.fixed)
      ]
    }];
  }

  function readRecords() {
    try {
      var stored = window.localStorage.getItem(TASK_STORAGE_KEY);
      if (stored === null) {
        var initial = seedTaskActivities();
        window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(initial));
        return initial;
      }
      var value = JSON.parse(stored || '[]');
      if (!Array.isArray(value)) { return []; }
      value = value.filter(function (record) {
        return record && typeof record === 'object' && typeof record.id === 'string' && record.id;
      });
      if (value.length > 1) { value = value.slice(0, 1); }
      var migrated = value.map(normalizeActivity);
      if (migrated.length !== JSON.parse(stored || '[]').length || value.some(function (record) { return !Array.isArray(record.tasks); })) {
        window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(migrated));
      }
      return migrated;
    } catch (error) {
      window.alert('优惠券任务活动读取失败，请检查浏览器本地存储后重试。');
      return [];
    }
  }

  function writeRecords(nextRecords) {
    try {
      records = nextRecords.slice(0, 1);
      window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(records));
      return true;
    } catch (error) {
      window.alert('优惠券任务活动保存失败，请检查浏览器存储空间后重试。');
      return false;
    }
  }

  function readCoupons() {
    try {
      var value = JSON.parse(window.localStorage.getItem(COUPON_STORAGE_KEY) || '[]');
      if (!Array.isArray(value)) { return []; }
      return value.filter(function (coupon) {
        return coupon && typeof coupon.id === 'string' && coupon.id && coupon.enabled !== false;
      });
    } catch (error) {
      window.alert('优惠券配置读取失败，请先检查票券中心数据。');
      return [];
    }
  }

  function couponDescription(coupon) {
    if (coupon.type === 'recharge_fixed') {
      return '充值满 ' + (coupon.rechargeThreshold || 0) + ' 赠 ' + (coupon.fixedBonus || 0);
    }
    if (coupon.type === 'recharge_percent') {
      return '充值赠 ' + (coupon.bonusRate || 0) + '%，上限 ' + (coupon.maxBonus || 0);
    }
    return '优惠券';
  }

  function couponTypeLabel(coupon) {
    if (coupon.type === 'recharge_fixed') { return '充值满额固定赠送'; }
    if (coupon.type === 'recharge_percent') { return '充值比例赠送'; }
    return '优惠券';
  }

  function couponOptionLabel(coupon) {
    return coupon.name + '（' + couponDescription(coupon) + '）';
  }

  function populateCoupons(selectedId, fallbackCoupon) {
    var select = byId('tierRewardCoupon');
    var choices = coupons.slice();
    if (fallbackCoupon && selectedId && !choices.some(function (coupon) { return coupon.id === selectedId; })) {
      choices.push(fallbackCoupon);
    }
    select.innerHTML = '<option value="">请选择优惠券</option>' + choices.map(function (coupon) {
      var disabledSuffix = coupon.enabled === false ? '（已停用，保留现有奖励）' : '';
      return '<option value="' + escapeHtml(coupon.id) + '">' + escapeHtml(couponOptionLabel(coupon) + disabledSuffix) + '</option>';
    }).join('');
    if (selectedId) { select.value = selectedId; }
    byId('couponEmptyHint').hidden = coupons.length > 0;
    return select;
  }

  function getSelectedCoupon() {
    var id = byId('tierRewardCoupon').value;
    var selected = coupons.find(function (coupon) { return coupon.id === id; });
    if (selected) { return selected; }
    if (editorActivity && editingTierId) {
      var existing = editorActivity.tasks.find(function (task) { return task.id === editingTierId; });
      if (existing && existing.couponId === id) { return existing.couponSnapshot; }
    }
    return null;
  }

  function localDateTime(date) {
    var offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  function setActiveTaskType(type) {
    activeTaskType = TASK_TYPES[type] ? type : 'recharge_total';
    Array.prototype.forEach.call(document.querySelectorAll('[data-task-type]'), function (button) {
      var active = button.getAttribute('data-task-type') === activeTaskType;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    clearTierEditor();
    renderTierRows();
  }

  function updateTierCondition() {
    var type = getTaskType(activeTaskType);
    var isGameTask = activeTaskType === 'wager';
    var condition = isGameTask ? getGameCondition(activeGameCondition) : type;
    byId('tierWagerMetricField').hidden = !isGameTask;
    byId('tierWagerMetric').value = activeGameCondition;
    byId('taskConditionHeading').textContent = type.label + '条件';
    byId('tierConditionLabel').textContent = condition.condition;
    byId('tierConditionUnit').textContent = condition.unit;
    byId('tierConditionValue').min = condition.integer ? '1' : '0.01';
    byId('tierConditionValue').step = condition.integer ? '1' : '0.01';
    byId('tierConditionValue').placeholder = condition.placeholder || (activeTaskType === 'login_total' ? '请输入登录天数' : '请输入金额');
  }

  function conditionText(task) {
    var type = task.taskType === 'wager' ? getGameCondition(task.gameCondition) : getTaskType(task.taskType);
    return type.condition + ' ≥ ' + task.conditionValue + ' ' + type.unit;
  }

  function renderTierRows() {
    if (!editorActivity) { return; }
    var tbody = byId('taskTierRows');
    var tasks = editorActivity.tasks.filter(function (task) { return task.taskType === activeTaskType; });
    tasks.sort(function (left, right) { return Number(left.conditionValue) - Number(right.conditionValue); });
    if (!tasks.length) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="4">当前类别暂无奖励档</td></tr>';
      return;
    }
    tbody.innerHTML = tasks.map(function (task) {
      var coupon = task.couponSnapshot || { type: task.couponType || '' };
      return '<tr data-tier-id="' + escapeHtml(task.id) + '">' +
        '<td>' + escapeHtml(conditionText(task)) + '</td>' +
        '<td title="' + escapeHtml(task.couponName) + '">' + escapeHtml(task.couponName) + '</td>' +
        '<td>' + escapeHtml(couponTypeLabel(coupon) + ' / ' + couponDescription(coupon)) + '</td>' +
        '<td><span class="tier-row-actions"><button type="button" data-tier-edit>编辑</button><button class="danger" type="button" data-tier-delete>删除</button></span></td>' +
        '</tr>';
    }).join('');
  }

  function clearTierEditor() {
    editingTierId = '';
    byId('tierConditionValue').value = '';
    byId('tierModalTitle').textContent = '新增奖励档';
    byId('saveTier').textContent = '确定';
    populateCoupons('');
    updateTierCondition();
    byId('tierFormError').hidden = true;
  }

  function openNewTier() {
    clearTierEditor();
    byId('tierModal').hidden = false;
    byId('tierConditionValue').focus();
  }

  function closeTierModal() {
    byId('tierModal').hidden = true;
    clearTierEditor();
  }

  function showTierError(message) {
    var error = byId('tierFormError');
    error.textContent = message;
    error.hidden = false;
  }

  function editTier(id) {
    var task = editorActivity.tasks.find(function (item) { return item.id === id; });
    if (!task) { return; }
    editingTierId = id;
    activeGameCondition = task.taskType === 'wager' ? (task.gameCondition || 'wager') : 'wager';
    updateTierCondition();
    byId('tierConditionValue').value = task.conditionValue;
    populateCoupons(task.couponId, task.couponSnapshot);
    byId('tierModalTitle').textContent = '编辑奖励档';
    byId('saveTier').textContent = '保存修改';
    byId('tierFormError').hidden = true;
    byId('tierModal').hidden = false;
    byId('tierConditionValue').focus();
  }

  function persistTaskActivity() {
    var existing = records.find(function (item) { return item.id === editorActivity.id; });
    var now = new Date();
    var activity = {
      id: editorActivity.id || ('coupon-activity-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)),
      name: editorActivity.name || '优惠券任务',
      title: editorActivity.title || '优惠券任务',
      startTime: editorActivity.startTime || localDateTime(now),
      endTime: editorActivity.endTime || localDateTime(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)),
      sort: editorActivity.sort || '0',
      enabled: editorActivity.enabled !== false,
      singleRewardLimit: editorActivity.singleRewardLimit !== false,
      visible: true,
      resetPeriod: getActivityResetPeriod(editorActivity),
      tasks: editorActivity.tasks.slice(),
      createdAt: existing ? existing.createdAt : new Date().toISOString()
    };
    if (writeRecords([activity])) { editorActivity = activity; }
  }

  function saveTier() {
    var type = getTaskType(activeTaskType);
    var condition = activeTaskType === 'wager' ? getGameCondition(activeGameCondition) : type;
    var value = Number(byId('tierConditionValue').value);
    var coupon = getSelectedCoupon();
    if (!Number.isFinite(value) || value <= 0 || (condition.integer && Math.floor(value) !== value)) {
      var validationLabel = activeTaskType === 'login_total' ? '累计登录天数' : condition.condition;
      showTierError(condition.integer ? validationLabel + '须为正整数。' : validationLabel + '门槛须为大于 0 的数字。');
      return;
    }
    if (!coupon) { showTierError('请选择一张优惠券作为该档奖励。'); return; }
    var duplicate = editorActivity.tasks.some(function (task) {
      var sameGameCondition = activeTaskType !== 'wager' || (task.gameCondition || 'wager') === activeGameCondition;
      return task.taskType === activeTaskType && sameGameCondition && task.id !== editingTierId && Number(task.conditionValue) === value;
    });
    if (duplicate) { showTierError('同一类别下不能重复设置相同门槛。'); return; }
    var existing = editorActivity.tasks.find(function (task) { return task.id === editingTierId; });
    var task = {
      id: editingTierId || ('tier-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)),
      taskType: activeTaskType,
      gameCondition: activeTaskType === 'wager' ? activeGameCondition : '',
      conditionValue: String(value),
      couponId: coupon.id,
      couponName: coupon.name,
      couponType: coupon.type,
      couponSnapshot: coupon,
      wagerMultiple: coupon.wagerMultiple == null ? '0' : String(coupon.wagerMultiple)
    };
    editorActivity.tasks = editorActivity.tasks.filter(function (item) { return item.id !== task.id; });
    editorActivity.tasks.push(task);
    persistTaskActivity();
    byId('tierModal').hidden = true;
    clearTierEditor();
    renderTierRows();
  }

  function handleTierAction(event) {
    var row = event.target.closest('[data-tier-id]');
    if (!row) { return; }
    var id = row.getAttribute('data-tier-id');
    if (event.target.closest('[data-tier-edit]')) {
      editTier(id);
      return;
    }
    if (event.target.closest('[data-tier-delete]') && window.confirm('确定删除这个奖励档吗？')) {
      editorActivity.tasks = editorActivity.tasks.filter(function (task) { return task.id !== id; });
      persistTaskActivity();
      if (editingTierId === id) { clearTierEditor(); }
      renderTierRows();
    }
  }

  function openActivityEditor(activity) {
    coupons = readCoupons();
    editorActivity = activity ? JSON.parse(JSON.stringify(activity)) : {
      id: '', name: '', startTime: '', endTime: '', sort: '0', enabled: true, singleRewardLimit: true, tasks: []
    };
    editorActivity.resetPeriod = getActivityResetPeriod(editorActivity);
    renderFeatureToggle();
    closeResetPeriodEditor();
    activeTaskType = 'recharge_total';
    Array.prototype.forEach.call(document.querySelectorAll('[data-task-type]'), function (button) {
      var active = button.getAttribute('data-task-type') === activeTaskType;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    clearTierEditor();
    renderTierRows();
  }

  document.addEventListener('DOMContentLoaded', function () {
    records = readRecords();
    openActivityEditor(records[0] || null);
    byId('saveTier').addEventListener('click', saveTier);
    byId('taskFeatureToggle').addEventListener('click', function () {
      editorActivity.enabled = editorActivity.enabled === false;
      persistTaskActivity();
      renderFeatureToggle();
    });
    byId('editTaskResetPeriod').addEventListener('click', openResetPeriodEditor);
    byId('saveTaskResetPeriod').addEventListener('click', function () {
      var selected = document.querySelector('[name="taskResetPeriod"]:checked');
      editorActivity.resetPeriod = getRechargePeriod(selected && selected.value);
      persistTaskActivity();
      closeResetPeriodEditor();
    });
    byId('cancelTaskResetPeriod').addEventListener('click', function () {
      editorActivity.resetPeriod = resetPeriodDraft;
      closeResetPeriodEditor();
    });
    byId('tierWagerMetric').addEventListener('change', function () {
      activeGameCondition = this.value === 'game_count' ? 'game_count' : 'wager';
      updateTierCondition();
    });
    byId('tierConditionValue').addEventListener('keydown', function (event) {
      if (event.key === 'Enter') { event.preventDefault(); saveTier(); }
    });
    byId('taskTierRows').addEventListener('click', handleTierAction);
    byId('addTierButton').addEventListener('click', openNewTier);
    byId('tierModal').addEventListener('click', function (event) {
      if (event.target === byId('tierModal') || event.target.closest('[data-close-tier-modal]')) { closeTierModal(); }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !byId('tierModal').hidden) { closeTierModal(); }
    });
    document.querySelector('.task-type-tabs').addEventListener('click', function (event) {
      var tab = event.target.closest('[data-task-type]');
      if (tab) { setActiveTaskType(tab.getAttribute('data-task-type')); }
    });
  });
})();
