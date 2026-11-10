(function () {
  'use strict';
  var STORAGE_KEY = 'promoBargainActivities';
  var LIST_URL = '优惠活动列表.html';
  var INITIAL_TASK_TYPES = { officialCut: '官方赠送', premiumGift: '精英玩家赠送' };
  var LEGACY_DESCRIPTION = '1. 初始赠送 2 刀，使用后达到配置的初始进度。\n2. 完成个人任务或邀请好友完成指定条件，获得更多砍刀次数。\n3. 使用刀数达到获奖总刀数、进度达到 100% 后，可领取最终奖励。';
  var TYPES = {
    depositCount: { label: '完成充值', kind: 'count', prefix: '累计完成充值 ', suffix: ' 次' },
    wagerCount: { label: '完成打码', kind: 'count', prefix: '累计完成打码 ', suffix: ' 次' },
    depositAmount: { label: '累计充值', kind: 'amount', prefix: '累计充值达到 ', suffix: '' },
    wagerAmount: { label: '累计打码', kind: 'amount', prefix: '累计打码达到 ', suffix: '' },
    phone: { label: '绑定手机', kind: 'once', prefix: '完成手机绑定' },
    email: { label: '绑定邮箱', kind: 'once', prefix: '完成邮箱绑定' },
    app: { label: '下载 / 使用官方 App', kind: 'once', prefix: '下载 / 使用官方 App' }
  };
  var INVITE_TYPES = ['phone', 'email', 'depositAmount', 'wagerAmount'];
  var editId = new URLSearchParams(window.location.search).get('bargainId');
  var invalidEdit = false;
  var initialTasks = defaultInitialTasks();
  var personalTasks = [
    { id: 'default-deposit', type: 'depositCount', threshold: '3', rewardCuts: 1, isDefault: true },
    { id: 'default-wager', type: 'wagerCount', threshold: '3', rewardCuts: 1, isDefault: true },
    { id: 'deposit-tier-1', type: 'depositAmount', threshold: '50000', rewardCuts: 3 },
    { id: 'wager-tier-1', type: 'wagerAmount', threshold: '100000', rewardCuts: 5 }
  ];
  var invitationTasks = [
    { id: 'invite-phone', conditions: [{ type: 'phone' }], rewardCuts: 1 },
    { id: 'invite-email', conditions: [{ type: 'email' }], rewardCuts: 1 },
    { id: 'invite-deposit', conditions: [{ type: 'depositAmount', threshold: '50000' }], rewardCuts: 3 },
    { id: 'invite-wager', conditions: [{ type: 'wagerAmount', threshold: '100000' }], rewardCuts: 5 },
    { id: 'invite-phone-email', conditions: [{ type: 'phone' }, { type: 'email' }], rewardCuts: 2 },
    { id: 'invite-all', conditions: [{ type: 'phone' }, { type: 'email' }, { type: 'depositAmount', threshold: '50000' }, { type: 'wagerAmount', threshold: '100000' }], rewardCuts: 8 }
  ];
  var imageState = { Banner: { source: '', busy: false, version: 0 }, Detail: { source: '', busy: false, version: 0 } };
  var editor = null;
  var returnFocus = null;
  var baseWasInert = false;

  function byId(id) { return document.getElementById(id); }
  function all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function uid() { return 'bargain-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10); }
  function escapeHtml(value) { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function isInteger(value, min) { return /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) >= min; }
  function defaultInitialTasks() {
    return [
      { id: 'initial-official', type: 'officialCut', rewardCuts: 1 },
      { id: 'initial-premium', type: 'premiumGift', rewardCuts: 1 }
    ];
  }
  function initialCutsFor(tasks) {
    if (!Array.isArray(tasks) || tasks.length !== 2) { return null; }
    var types = new Set(), ids = new Set(), sum = 0;
    for (var i = 0; i < tasks.length; i++) {
      var task = tasks[i];
      if (!task || typeof task.id !== 'string' || !task.id || ids.has(task.id) ||
          !Object.prototype.hasOwnProperty.call(INITIAL_TASK_TYPES, task.type) || types.has(task.type) || !isInteger(task.rewardCuts, 1)) { return null; }
      types.add(task.type); ids.add(task.id); sum += Number(task.rewardCuts);
    }
    return Number.isSafeInteger(sum) ? sum : null;
  }
  function normalizeRecord(record) {
    var normalized = copy(record);
    if (Array.isArray(normalized.personalTasks)) { normalized.personalTasks = normalized.personalTasks.filter(function (task) { return !task || task.type !== 'login'; }); }
    if (!Object.prototype.hasOwnProperty.call(normalized, 'initialTasks')) { normalized.initialTasks = defaultInitialTasks(); }
    if (!Object.prototype.hasOwnProperty.call(normalized, 'registrationCountdown')) { normalized.registrationCountdown = { enabled: false, days: 0, hours: 0 }; }
    var cuts = initialCutsFor(normalized.initialTasks);
    if (cuts !== null) { normalized.initialCuts = cuts; }
    if (normalized.description === LEGACY_DESCRIPTION) { normalized.description = LEGACY_DESCRIPTION.replace('初始赠送 2 刀', '完成官方赠送和精英玩家赠送任务，获得配置的初始赠送刀数'); }
    if (!Object.prototype.hasOwnProperty.call(normalized, 'bannerImage')) { normalized.bannerImage = ''; }
    if (!Object.prototype.hasOwnProperty.call(normalized, 'detailImage')) { normalized.detailImage = ''; }
    if (!Object.prototype.hasOwnProperty.call(normalized, 'descriptionHtml')) { normalized.descriptionHtml = plainTextToHtml(typeof normalized.description === 'string' ? normalized.description : ''); }
    return normalized;
  }
  function plainTextToHtml(text) {
    return text ? String(text).split(/\r?\n/).map(function (line) { return '<p>' + (escapeHtml(line) || '<br>') + '</p>'; }).join('') : '';
  }
  function sanitizeDescription(html) {
    var template = document.createElement('template');
    template.innerHTML = html || '';
    function clean(parent) {
      Array.prototype.slice.call(parent.childNodes).forEach(function (node) {
        if (node.nodeType !== 1) { if (node.nodeType !== 3) { node.remove(); } return; }
        if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|SVG|MATH|LINK|META|IMG|VIDEO|AUDIO|TEMPLATE)$/.test(node.tagName)) { node.remove(); return; }
        clean(node);
        if (!/^(P|DIV|BR|STRONG|B|EM|I|U|UL|OL|LI|H2|H3|BLOCKQUOTE)$/.test(node.tagName)) {
          while (node.firstChild) { parent.insertBefore(node.firstChild, node); }
          node.remove(); return;
        }
        Array.prototype.slice.call(node.attributes).forEach(function (attr) { node.removeAttribute(attr.name); });
      });
    }
    clean(template.content); return template.innerHTML;
  }
  function descriptionText() {
    var editorNode = byId('bargainDescription');
    return String(editorNode.innerText || editorNode.textContent || '').replace(/\u00a0/g, ' ').replace(/\r\n/g, '\n').trim();
  }
  function imageLimit(kind) { return kind === 'Banner' ? 500 * 1024 : 1024 * 1024; }
  function validImageSource(source, kind) {
    if (source === '') { return true; }
    if (typeof source !== 'string') { return false; }
    var match = /^data:image\/(png|jpeg|webp);base64,([a-z0-9+/]+={0,2})$/i.exec(source);
    if (!match || match[2].length % 4 !== 0) { return false; }
    var padding = (match[2].match(/=+$/) || [''])[0].length;
    return match[2].length * 3 / 4 - padding <= imageLimit(kind);
  }
  function setImage(kind, source) {
    imageState[kind].source = source;
    var preview = byId('bargain' + kind + 'Preview');
    if (source) { preview.src = source; } else { preview.removeAttribute('src'); }
    preview.hidden = !source;
    byId('bargain' + kind + 'Placeholder').hidden = Boolean(source);
    document.querySelector('[data-ba-remove-image="' + kind + '"]').hidden = !source;
  }
  function uploadImage(kind, file) {
    if (!file) { return; }
    var state = imageState[kind], version = ++state.version;
    state.busy = false;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > imageLimit(kind)) { return fail('请上传 JPG、PNG 或 WebP 图片；Banner 最大 500KB，内页图最大 1MB。'); }
    state.busy = true;
    function imageError() { if (version === state.version) { state.busy = false; fail('图片读取失败，请更换有效图片。'); } }
    try {
      var reader = new FileReader(); reader.onerror = imageError;
      reader.onload = function () {
        if (version !== state.version) { return; }
        if (!reader.result || !validImageSource(reader.result, kind)) { imageError(); return; }
        var decoded = new Image(); decoded.onerror = imageError;
        decoded.onload = function () {
          if (version !== state.version) { return; }
          state.busy = false; setImage(kind, reader.result); clearError();
        };
        decoded.src = reader.result;
      };
      reader.readAsDataURL(file);
    } catch (error) { imageError(); }
  }
  function bindGeneralSettings(form) {
    ['Banner', 'Detail'].forEach(function (kind) {
      setImage(kind, imageState[kind].source);
      var input = byId('bargain' + kind + 'File');
      input.addEventListener('change', function () { uploadImage(kind, input.files && input.files[0]); input.value = ''; });
    });
    all('[data-ba-command]', form).forEach(function (button) {
      button.addEventListener('mousedown', function (event) { event.preventDefault(); });
      button.addEventListener('click', function () {
        byId('bargainDescription').focus(); document.execCommand(button.getAttribute('data-ba-command'), false, null);
      });
    });
    byId('bargainDescription').addEventListener('paste', function (event) {
      event.preventDefault(); if (!event.clipboardData) { return; }
      var html = event.clipboardData.getData('text/html');
      document.execCommand(html ? 'insertHTML' : 'insertText', false, html ? sanitizeDescription(html) : event.clipboardData.getData('text/plain'));
    });
    byId('bargainDescription').addEventListener('drop', function (event) { event.preventDefault(); });
  }
  function decimalHundredths(value, allowZero) {
    var match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(value));
    if (!match) { return null; }
    var number = Number(match[1]) * 100 + Number(((match[2] || '') + '00').slice(0, 2));
    return Number.isSafeInteger(number) && (allowZero ? number >= 0 : number > 0) ? number : null;
  }
  function decimalText(number) { return String(Math.floor(number / 100)) + (number % 100 ? '.' + String(number % 100).padStart(2, '0').replace(/0+$/, '') : ''); }
  function displayError(id, message) { var node = byId(id); node.textContent = message; node.hidden = !message; }
  function fail(message) { displayError('bargainError', message); byId('bargainError').scrollIntoView({ block: 'nearest' }); return false; }
  function clearError() { if (!invalidEdit) { displayError('bargainError', ''); } }
  function getRecords() {
    var records = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    var ids = new Set();
    if (!Array.isArray(records) || records.some(function (record) {
      if (!record || typeof record.id !== 'string' || !record.id || ids.has(record.id)) { return true; }
      ids.add(record.id); return false;
    })) { throw new Error('Invalid bargain activity storage'); }
    return records;
  }
  function taskCondition(task) {
    var meta = TYPES[task.type];
    return meta.prefix + (meta.kind === 'once' ? '' : task.threshold + meta.suffix);
  }
  function conditionSignature(conditions) {
    return INVITE_TYPES.filter(function (type) { return conditions.some(function (item) { return item.type === type; }); }).map(function (type) {
      var condition = conditions.find(function (item) { return item.type === type; });
      return type + (TYPES[type].kind === 'amount' ? ':' + decimalHundredths(condition.threshold, false) : '');
    }).join('|');
  }
  function personalSignature(task) { return task.type + ':' + (TYPES[task.type].kind === 'amount' ? decimalHundredths(task.threshold, false) : Number(task.threshold)); }
  function validateTask(task, kind, tasks) {
    if (!task || typeof task.id !== 'string' || !task.id || !isInteger(task.rewardCuts, 1)) { return '赠送刀数须为大于 0 的整数。'; }
    if (task.isDefault != null && (typeof task.isDefault !== 'boolean' || (task.isDefault && (kind !== 'personal' || ['depositCount', 'wagerCount'].indexOf(task.type) < 0)))) { return '默认任务配置异常。'; }
    if (tasks.some(function (item) { return item.id === task.id; })) { return '任务编号重复，请重新添加任务。'; }
    if (kind === 'initial') {
      if (!Object.prototype.hasOwnProperty.call(INITIAL_TASK_TYPES, task.type)) { return '初始赠送任务类型异常。'; }
      if (tasks.some(function (item) { return item.type === task.type; })) { return '初始赠送任务不可重复。'; }
      return '';
    }
    if (kind === 'personal') {
      var meta = Object.prototype.hasOwnProperty.call(TYPES, task.type) ? TYPES[task.type] : null;
      if (!meta || (meta.kind === 'amount' ? decimalHundredths(task.threshold, false) === null : !isInteger(task.threshold, 1))) { return '请填写有效的达标条件；金额须大于 0 且最多 2 位小数，次数须为正整数。'; }
      if (meta.kind === 'once' && Number(task.threshold) !== 1) { return '绑定及 App 任务仅需完成一次。'; }
      if (tasks.some(function (item) { return personalSignature(item) === personalSignature(task); })) { return '已存在相同类型及达标条件的个人任务。'; }
      return '';
    }
    if (!Array.isArray(task.conditions) || !task.conditions.length || task.conditions.length > 4) { return '请至少选择一项好友完成条件。'; }
    var types = new Set();
    for (var i = 0; i < task.conditions.length; i++) {
      var condition = task.conditions[i];
      if (!condition || INVITE_TYPES.indexOf(condition.type) < 0 || types.has(condition.type)) { return '邀请任务条件异常。'; }
      types.add(condition.type);
      if (TYPES[condition.type].kind === 'amount' && decimalHundredths(condition.threshold, false) === null) { return '勾选累计充值或累计打码时，门槛金额须大于 0 且最多保留 2 位小数。'; }
    }
    if (tasks.some(function (item) { return conditionSignature(item.conditions) === conditionSignature(task.conditions); })) { return '已存在相同条件组合及金额门槛的邀请任务。'; }
    return '';
  }
  function validateTasks(record) {
    if (initialCutsFor(record.initialTasks) === null) { return '请保留官方赠送、精英玩家赠送两项任务，并分别配置正整数赠送刀数。'; }
    if (!Array.isArray(record.personalTasks) || !Array.isArray(record.invitationTasks)) { return '任务配置异常，请重新打开活动。'; }
    var groups = [record.initialTasks, record.personalTasks, record.invitationTasks];
    var kinds = ['initial', 'personal', 'invitation'], labels = ['初始赠送任务：', '个人任务：', '邀请任务：'];
    for (var group = 0; group < groups.length; group++) {
      for (var i = 0; i < groups[group].length; i++) {
        var error = validateTask(groups[group][i], kinds[group], groups[group].slice(0, i));
        if (error) { return labels[group] + error; }
      }
    }
    if (!record.personalTasks.some(function (task) { return task.type === 'depositCount' && task.isDefault === true; }) ||
        !record.personalTasks.some(function (task) { return task.type === 'wagerCount' && task.isDefault === true; })) { return '请保留完成充值、完成打码两项默认任务。'; }
    return '';
  }
  function validateRegistrationCountdown(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.enabled !== 'boolean') { return '注册后倒计时配置异常，请重新打开活动。'; }
    if (!value.enabled) { return ''; }
    if (!isInteger(value.days, 0) || !isInteger(value.hours, 0) || Number(value.hours) > 23) { return '倒计时天数须为不小于 0 的整数，小时须为 0 至 23 的整数。'; }
    var totalHours = Number(value.days) * 24 + Number(value.hours);
    if (!Number.isSafeInteger(totalHours * 3600000) || totalHours <= 0) { return '倒计时总时长须大于 0，且不能超出可处理范围。'; }
    return '';
  }
  function collectRegistrationCountdown() {
    var enabled = byId('bargainRegistrationCountdownEnabled').checked;
    return {
      enabled: enabled,
      days: enabled ? byId('bargainRegistrationCountdownDays').value : 0,
      hours: enabled ? byId('bargainRegistrationCountdownHours').value : 0
    };
  }
  function syncRegistrationCountdown() {
    var value = collectRegistrationCountdown();
    byId('bargainRegistrationCountdownFields').hidden = !value.enabled;
    byId('bargainRegistrationCountdownEnabled').setAttribute('aria-expanded', String(value.enabled));
    ['Days', 'Hours'].forEach(function (suffix) {
      var input = byId('bargainRegistrationCountdown' + suffix); input.disabled = !value.enabled; input.required = value.enabled;
    });
    var hint = '未设置玩家个人倒计时，玩家参与仅受活动有效期限制。启用后从玩家注册时间开始计算。';
    if (value.enabled) {
      hint = validateRegistrationCountdown(value) ? '从玩家注册时间起算；天数须为非负整数，小时为 0 至 23，总时长须大于 0。' : '从玩家注册时间起算，有效时长为 ' + Number(value.days) + ' 天 ' + Number(value.hours) + ' 小时；仍受活动有效期限制。';
    }
    byId('bargainRegistrationCountdownHint').textContent = hint;
  }
  function validateRecord(record) {
    if (!record || typeof record.name !== 'string' || typeof record.title !== 'string' || !record.name.trim() || !record.title.trim() || record.name.length > 40 || record.title.length > 60) { return '请填写活动名称（40 字内）和活动标题（60 字内）。'; }
    if (typeof record.longTerm !== 'boolean' || typeof record.enabled !== 'boolean') { return '活动状态数据异常。'; }
    var start = new Date(record.startTime).getTime(), end = new Date(record.endTime).getTime();
    if (!Number.isFinite(start) || (!record.longTerm && (!Number.isFinite(end) || end <= start))) { return '请配置活动时间，结束时间须晚于开始时间。'; }
    var countdownError = validateRegistrationCountdown(record.registrationCountdown);
    if (countdownError) { return countdownError; }
    if (decimalHundredths(record.rewardAmount, false) === null) { return '最终奖励金额须大于 0，最多保留 2 位小数。'; }
    var percent = decimalHundredths(record.initialPercent, true);
    if (percent === null || percent >= 10000) { return '初始百分比须为 0 至 100 之间（不含 100），最多保留 2 位小数。'; }
    var initial = initialCutsFor(record.initialTasks);
    if (initial === null) { return '请为官方赠送、精英玩家赠送两项任务配置有效的赠送刀数。'; }
    if (!isInteger(record.totalCuts, initial + 1)) { return '获奖总刀数须为大于初始赠送合计 ' + initial + ' 刀的整数，包含这两项任务赠送的刀数。'; }
    if (decimalHundredths(record.wagerMultiple, true) === null) { return '打码倍数须不小于 0，最多保留 2 位小数。'; }
    if (!isInteger(record.sort, 0)) { return '活动排序须为不小于 0 的整数。'; }
    if (['余额', '存钱罐'].indexOf(record.rewardTarget) < 0) { return '请选择奖励金额目标。'; }
    if (typeof record.description !== 'string' || record.description.length > 4000) { return '活动规则文本最多填写 4000 字。'; }
    if (typeof record.descriptionHtml !== 'string') { return '活动富文本数据异常，请重新打开活动。'; }
    if (!validImageSource(record.bannerImage, 'Banner') || !validImageSource(record.detailImage, 'Detail')) { return '活动图片数据异常或超过大小限制，请重新上传图片。'; }
    return validateTasks(record);
  }
  function renderTasks() {
    var personal = byId('bargainPersonalRows'), invitation = byId('bargainInvitationRows');
    byId('bargainInitialRows').innerHTML = initialTasks.map(function (task) {
      return '<tr><td>' + escapeHtml(INITIAL_TASK_TYPES[task.type]) + '</td><td>初始赠送，每轮领取一次</td><td>' + escapeHtml(task.rewardCuts) + ' 刀</td><td>' + taskActions(task, 'initial') + '</td></tr>';
    }).join('');
    personal.innerHTML = personalTasks.map(function (task) {
      return '<tr><td>' + escapeHtml(TYPES[task.type].label) + (task.isDefault ? '<span class="ba-tag">默认</span>' : '') + '</td><td>' + escapeHtml(taskCondition(task)) + '</td><td>' + escapeHtml(task.rewardCuts) + ' 刀</td><td>' + taskActions(task, 'personal') + '</td></tr>';
    }).join('');
    invitation.innerHTML = invitationTasks.length ? invitationTasks.map(function (task, index) {
      return '<tr><td>邀请任务 ' + (index + 1) + '</td><td>' + task.conditions.map(function (condition) {
        return escapeHtml(TYPES[condition.type].kind === 'amount' ? taskCondition(condition) : TYPES[condition.type].label);
      }).join(' + ') + '</td><td>' + escapeHtml(task.rewardCuts) + ' 刀</td><td>' + taskActions(task, 'invitation') + '</td></tr>';
    }).join('') : '<tr><td class="ba-empty" colspan="4">暂无邀请任务，请添加任务并勾选好友需完成的条件。</td></tr>';
  }
  function taskActions(task, kind) {
    var attrs = ' data-ba-kind="' + kind + '" data-ba-task="' + escapeHtml(task.id) + '"';
    return '<button class="ba-link" type="button" data-ba-edit' + attrs + '>编辑</button>' + (kind === 'initial' || task.isDefault ? '' : '<button class="ba-link ba-danger" type="button" data-ba-delete' + attrs + '>删除</button>');
  }
  function syncProgress() {
    var total = byId('bargainTotalCuts').value, percent = byId('bargainInitialPercent').value;
    var initial = initialCutsFor(initialTasks);
    byId('bargainInitialCuts').textContent = initial === null ? '请配置初始赠送任务' : initial + ' 刀（由下方两项任务合计）';
    byId('bargainTotalCuts').min = String(initial === null ? 1 : initial + 1);
    var valid = initial !== null && isInteger(total, initial + 1) && decimalHundredths(percent, true) !== null && Number(percent) < 100;
    byId('bargainProgressHint').textContent = valid ? '官方赠送和精英玩家赠送共提供 ' + initial + ' 刀，全部使用后进度达到 ' + percent + '%；获奖总刀数包含这些赠送刀数，还需使用 ' + (Number(total) - initial) + ' 刀达到 100% 并领取最终奖励。' : '初始百分比为官方赠送和精英玩家赠送任务所赠刀数全部使用后的进度；获奖总刀数须大于初始赠送合计，请检查配置。';
  }
  function syncLongTerm() {
    var input = byId('bargainEndTime'), checked = byId('bargainLongTerm').checked;
    if (checked) { if (input.value) { input.dataset.endFallback = input.value; } input.value = ''; }
    else if (!input.value) { input.value = input.dataset.endFallback || ''; }
    input.disabled = checked; input.required = !checked;
  }
  function syncTaskType(reset) {
    var type = byId('bargainTaskType').value, meta = TYPES[type], input = byId('bargainTaskThreshold');
    var show = editor && editor.kind === 'personal' && meta.kind !== 'once';
    byId('bargainTaskThresholdField').hidden = !show;
    input.disabled = !show; input.required = Boolean(show);
    byId('bargainTaskThresholdLabel').textContent = meta.kind === 'amount' ? '达标金额' : '达标次数';
    input.min = meta.kind === 'amount' ? '0.01' : '1'; input.step = meta.kind === 'amount' ? '0.01' : '1';
    if (reset) { input.value = meta.kind === 'amount' ? '100' : '1'; }
  }
  function syncInviteConditions() {
    [['depositAmount', 'bargainInviteDeposit'], ['wagerAmount', 'bargainInviteWager']].forEach(function (item) {
      var selected = document.querySelector('[data-ba-condition="' + item[0] + '"]').checked;
      byId(item[1]).disabled = !selected; byId(item[1]).required = selected;
    });
  }
  function openTask(kind, task, opener) {
    var modal = byId('bargainTaskModal');
    editor = { kind: kind, id: task ? task.id : '', isDefault: Boolean(task && task.isDefault), giftType: kind === 'initial' && task ? task.type : '' };
    returnFocus = opener || document.activeElement;
    byId('bargainTaskModalTitle').textContent = (task ? '编辑' : '添加') + (kind === 'initial' ? '初始赠送任务' : kind === 'personal' ? '个人任务' : '邀请任务');
    byId('bargainGiftTaskField').hidden = kind !== 'initial';
    byId('bargainGiftTaskName').textContent = kind === 'initial' ? INITIAL_TASK_TYPES[task.type] : '';
    byId('bargainTaskTypeField').hidden = kind !== 'personal';
    byId('bargainTaskType').disabled = kind !== 'personal' || editor.isDefault;
    byId('bargainInviteConditions').hidden = kind !== 'invitation';
    byId('bargainTaskType').value = task && kind === 'personal' ? task.type : 'depositCount';
    byId('bargainTaskThreshold').value = task && kind === 'personal' ? task.threshold : '1';
    byId('bargainTaskRewardCuts').value = task ? String(task.rewardCuts) : '1';
    var conditions = task && kind === 'invitation' ? task.conditions : [];
    all('[data-ba-condition]').forEach(function (input) { input.checked = conditions.some(function (condition) { return condition.type === input.getAttribute('data-ba-condition'); }); });
    [['depositAmount', 'bargainInviteDeposit'], ['wagerAmount', 'bargainInviteWager']].forEach(function (item) {
      var condition = conditions.find(function (entry) { return entry.type === item[0]; }); byId(item[1]).value = condition ? condition.threshold : '';
    });
    displayError('bargainTaskError', ''); syncTaskType(false); syncInviteConditions();
    baseWasInert = Boolean(byId('base').inert); byId('base').inert = true; modal.hidden = false;
    (kind === 'initial' ? byId('bargainTaskRewardCuts') : kind === 'invitation' ? document.querySelector('[data-ba-condition="phone"]') : editor.isDefault ? byId('bargainTaskThreshold') : byId('bargainTaskType')).focus();
  }
  function closeTask() {
    byId('bargainTaskModal').hidden = true; byId('base').inert = baseWasInert; editor = null;
    if (returnFocus && returnFocus.isConnected) { returnFocus.focus(); }
    returnFocus = null;
  }
  function confirmTask() {
    if (!editor) { return; }
    var task = { id: editor.id || uid(), rewardCuts: byId('bargainTaskRewardCuts').value };
    var tasks = editor.kind === 'initial' ? initialTasks : editor.kind === 'personal' ? personalTasks : invitationTasks;
    if (editor.kind === 'initial') { task.type = editor.giftType; }
    else if (editor.kind === 'personal') {
      task.type = byId('bargainTaskType').value;
      task.threshold = TYPES[task.type].kind === 'once' ? '1' : byId('bargainTaskThreshold').value;
      if (editor.isDefault) { task.isDefault = true; }
    } else {
      task.conditions = all('[data-ba-condition]').filter(function (input) { return input.checked; }).map(function (input) {
        var type = input.getAttribute('data-ba-condition'), condition = { type: type };
        if (TYPES[type].kind === 'amount') { condition.threshold = byId(type === 'depositAmount' ? 'bargainInviteDeposit' : 'bargainInviteWager').value; }
        return condition;
      });
    }
    var error = validateTask(task, editor.kind, tasks.filter(function (item) { return item.id !== editor.id; }));
    if (error) { displayError('bargainTaskError', error); return; }
    task.rewardCuts = Number(task.rewardCuts);
    if (editor.kind === 'personal') { task.threshold = TYPES[task.type].kind === 'amount' ? decimalText(decimalHundredths(task.threshold, false)) : String(Number(task.threshold)); }
    else if (editor.kind === 'invitation') { task.conditions.forEach(function (condition) { if (TYPES[condition.type].kind === 'amount') { condition.threshold = decimalText(decimalHundredths(condition.threshold, false)); } }); }
    if (editor.kind === 'initial') {
      var proposed = tasks.map(function (item) { return item.id === editor.id ? task : item; });
      if (initialCutsFor(proposed) === null) { displayError('bargainTaskError', '初始赠送合计超出可处理范围，请减少赠送刀数。'); return; }
    }
    var index = tasks.findIndex(function (item) { return item.id === editor.id; });
    if (index < 0) { tasks.push(task); } else { tasks[index] = task; }
    var kind = editor.kind, id = task.id;
    closeTask(); renderTasks(); syncProgress(); clearError();
    // Persisted task IDs are used as data, never interpolated into selectors.
    var button = all('[data-ba-edit]').find(function (item) { return item.getAttribute('data-ba-kind') === kind && item.getAttribute('data-ba-task') === id; });
    if (button) { button.focus(); }
  }
  function collectRecord() {
    var target = document.querySelector('input[name="bargainRewardTarget"]:checked');
    return {
      id: editId || uid(), template: '砍一刀',
      name: byId('bargainName').value.trim(), title: byId('bargainTitle').value.trim(),
      startTime: byId('bargainStartTime').value, endTime: byId('bargainLongTerm').checked ? '' : byId('bargainEndTime').value,
      longTerm: byId('bargainLongTerm').checked, endTimeFallback: byId('bargainEndTime').dataset.endFallback || '',
      registrationCountdown: collectRegistrationCountdown(),
      wagerMultiple: byId('bargainWagerMultiple').value, sort: byId('bargainSort').value,
      enabled: byId('bargainEnabled').checked, rewardTarget: target ? target.value : '', currency: 'merchant',
      rewardAmount: byId('bargainRewardAmount').value, initialPercent: byId('bargainInitialPercent').value,
      totalCuts: byId('bargainTotalCuts').value, initialCuts: initialCutsFor(initialTasks), initialTasks: copy(initialTasks),
      personalTasks: copy(personalTasks), invitationTasks: copy(invitationTasks),
      bannerImage: imageState.Banner.source, detailImage: imageState.Detail.source,
      description: descriptionText(), descriptionHtml: sanitizeDescription(byId('bargainDescription').innerHTML)
    };
  }
  function saveActivity() {
    if (invalidEdit) { return fail('原活动载入失败，请返回活动列表后重新打开。'); }
    if (imageState.Banner.busy || imageState.Detail.busy) { return fail('图片正在读取，请稍后保存。'); }
    var record = collectRecord(), error = validateRecord(record);
    if (error) { return fail(error); }
    record.rewardAmount = decimalText(decimalHundredths(record.rewardAmount, false));
    record.initialPercent = decimalText(decimalHundredths(record.initialPercent, true));
    record.totalCuts = Number(record.totalCuts);
    record.registrationCountdown.days = Number(record.registrationCountdown.days);
    record.registrationCountdown.hours = Number(record.registrationCountdown.hours);
    try {
      var records = getRecords(), index = records.findIndex(function (item) { return item.id === record.id; });
      if (editId && index < 0) { return fail('该活动已不存在，请返回活动列表后重试。'); }
      var now = new Date().toISOString(); record.updatedAt = now; record.createdAt = index < 0 ? now : records[index].createdAt || now;
      if (index < 0) { records.unshift(record); } else { records[index] = Object.assign({}, records[index], record); }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (storageError) { return fail('保存失败，本地存储不可用、数据异常或空间不足。当前配置已保留，请检查后重试。'); }
    window.location.href = LIST_URL + '?bargainSaved=1';
    return true;
  }
  function loadActivity() {
    if (!editId) { return; }
    var original;
    try { original = getRecords().find(function (record) { return record.id === editId; }); }
    catch (error) { invalidEdit = true; return fail('本地活动数据读取失败，请返回活动列表后重试。'); }
    if (original) { original = normalizeRecord(original); }
    if (!original || validateRecord(original)) { invalidEdit = true; return fail('活动不存在或配置数据异常，请返回活动列表后重新打开。'); }
    var fields = { Name: 'name', Title: 'title', StartTime: 'startTime', EndTime: 'endTime', WagerMultiple: 'wagerMultiple', Sort: 'sort', RewardAmount: 'rewardAmount', InitialPercent: 'initialPercent', TotalCuts: 'totalCuts' };
    Object.keys(fields).forEach(function (suffix) { byId('bargain' + suffix).value = String(original[fields[suffix]]); });
    byId('bargainEnabled').checked = original.enabled !== false; byId('bargainLongTerm').checked = original.longTerm === true;
    byId('bargainRegistrationCountdownEnabled').checked = original.registrationCountdown.enabled;
    byId('bargainRegistrationCountdownDays').value = String(original.registrationCountdown.enabled ? original.registrationCountdown.days : 0);
    byId('bargainRegistrationCountdownHours').value = String(original.registrationCountdown.enabled ? original.registrationCountdown.hours : 0);
    byId('bargainEndTime').dataset.endFallback = original.endTimeFallback || original.endTime || '';
    all('input[name="bargainRewardTarget"]').forEach(function (input) { input.checked = input.value === original.rewardTarget; });
    setImage('Banner', original.bannerImage); setImage('Detail', original.detailImage);
    byId('bargainDescription').innerHTML = sanitizeDescription(original.descriptionHtml);
    initialTasks = copy(original.initialTasks); personalTasks = copy(original.personalTasks); invitationTasks = copy(original.invitationTasks);
  }
  function ready() {
    var form = byId('bargainForm'), modal = byId('bargainTaskModal');
    if (!form || !modal || form.getAttribute('data-ba-bound') === 'true') { return; }
    form.setAttribute('data-ba-bound', 'true'); loadActivity(); bindGeneralSettings(form); syncLongTerm(); syncRegistrationCountdown(); syncProgress(); renderTasks();
    byId('bargainEnabledText').textContent = byId('bargainEnabled').checked ? '开启' : '关闭';
    byId('bargainLongTerm').addEventListener('change', syncLongTerm);
    byId('bargainRegistrationCountdownEnabled').addEventListener('change', syncRegistrationCountdown);
    ['Days', 'Hours'].forEach(function (suffix) { byId('bargainRegistrationCountdown' + suffix).addEventListener('input', syncRegistrationCountdown); });
    byId('bargainEnabled').addEventListener('change', function () { byId('bargainEnabledText').textContent = this.checked ? '开启' : '关闭'; });
    ['bargainInitialPercent', 'bargainTotalCuts'].forEach(function (id) { byId(id).addEventListener('input', syncProgress); });
    form.addEventListener('submit', function (event) { event.preventDefault(); saveActivity(); });
    form.addEventListener('input', clearError); form.addEventListener('change', clearError);
    form.addEventListener('click', function (event) {
      var button = event.target.closest('button'); if (!button) { return; }
      if (button.hasAttribute('data-ba-upload')) { byId('bargain' + button.getAttribute('data-ba-upload') + 'File').click(); return; }
      if (button.hasAttribute('data-ba-remove-image')) {
        var kind = button.getAttribute('data-ba-remove-image');
        imageState[kind].version++; imageState[kind].busy = false; setImage(kind, ''); clearError(); return;
      }
      if (button.hasAttribute('data-ba-add')) { openTask(button.getAttribute('data-ba-add'), null, button); return; }
      var kind = button.getAttribute('data-ba-kind'), tasks = kind === 'initial' ? initialTasks : kind === 'personal' ? personalTasks : invitationTasks;
      var id = button.getAttribute('data-ba-task'), task = tasks.find(function (item) { return item.id === id; });
      if (!task) { return; }
      if (button.hasAttribute('data-ba-edit')) { openTask(kind, task, button); }
      else if (button.hasAttribute('data-ba-delete') && kind !== 'initial' && !task.isDefault && window.confirm('确定删除该任务吗？保存活动后生效。')) {
        tasks.splice(tasks.indexOf(task), 1); renderTasks(); clearError();
        document.querySelector('[data-ba-add="' + kind + '"]').focus();
      }
    });
    byId('bargainTaskType').addEventListener('change', function () { syncTaskType(true); });
    all('[data-ba-condition]').forEach(function (input) { input.addEventListener('change', syncInviteConditions); });
    byId('bargainTaskForm').addEventListener('submit', function (event) { event.preventDefault(); confirmTask(); });
    all('[data-ba-close]', modal).forEach(function (button) { button.addEventListener('click', closeTask); });
    modal.addEventListener('click', function (event) { if (event.target === modal) { closeTask(); } });
    modal.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { event.preventDefault(); closeTask(); }
      if (event.key !== 'Tab') { return; }
      var nodes = all('button, input, select', modal).filter(function (node) { return !node.disabled && !node.closest('[hidden]'); });
      if (!nodes.length) { return; }
      var first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    byId('u3012_input').addEventListener('change', function () { if (editor) { closeTask(); } });
    ['u4', 'u5', 'u1'].forEach(function (id, index) {
      var button = byId(id); if (!button) { return; }
      button.addEventListener('click', function (event) {
        if (!document.body.classList.contains('bargain-template-active')) { return; }
        event.preventDefault(); event.stopImmediatePropagation();
        if (index === 0) { saveActivity(); } else { window.location.href = LIST_URL; }
      }, true);
    });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', ready); } else { ready(); }
})();
