(function () {
  'use strict';
  var STORAGE_KEY = 'business.channel-management.v1';
  var TYPE_NAMES = {link: '普通渠道链接', pwa: 'PWA 快捷 APP', trial: '游戏试玩链接', channel: '独立渠道包', native: '原生马甲包', download: '下载站'};
  var DEST_NAMES = {lobby: '大厅', register: '注册页', activity: '活动页', trial: '试玩页', download: '下载站', landing: '落地中转页'};
  var PACKAGE_TYPES = {pwa: 'PWA 快捷 APP', fast: '极速 APP', native: '原生 APP'};
  var state, currentView = 'channels', page = 1, pageSize = 10, selected = new Set(), modalOptions, modalOrigin, toastTimer;
  var filters = {}, fieldSerial = 0, silentFilterReset = false;
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); }
  function today() { return '2026-11-12'; }
  function seedVersion(version, build, url, date, status) { return {version: version, build: build, url: url, fileName: '', size: '', status: status || 'published', createdAt: date, publishedAt: status === 'draft' ? '' : date}; }
  function defaultDownload() { return {show: true, popup: true, types: ['pwa', 'native'], force: 'none', days: 0, deposits: 0, withdrawals: 0, inGame: false, reward: false}; }
  function defaultTracking(media) { return {provider: media === 'Facebook' ? 'Meta Pixel' : media === 'TikTok' ? 'TikTok Pixel' : media === 'Google' ? 'Google Tag' : '无', pixel: '', registerEvent: 'registration', firstPayEvent: 'first_deposit', repeatPayEvent: 'repeat_deposit'}; }
  function makeSeed() {
    var specs = [
      ['CH1001', 'AAAA', 'Facebook 印度主渠道', 'Facebook', 'link', 'INR', ['PK1001', 'PK1002'], ['pwa', 'native'], 'homepageads'],
      ['CH1002', 'CCCC', 'TikTok 短视频渠道', 'TikTok', 'channel', 'INR', ['PK1003', 'PK1002'], ['pwa', 'native'], 'feed-video-01'],
      ['CH1003', 'DDDD', 'Google 品牌搜索', 'Google', 'native', 'USD', ['PK1001'], ['native'], 'search-brand-03'],
      ['CH1004', 'PWA01', 'PWA 自然推广', '自然流量', 'pwa', 'INR', ['PK1002'], ['pwa'], 'pwa-home'],
      ['CH1005', 'APK01', 'Facebook 游戏试玩', 'Facebook', 'trial', 'INR', ['PK1004'], ['fast'], 'trial-video-02'],
      ['CH1006', 'WEB01', 'TikTok 下载站推广', 'TikTok', 'download', 'USD', ['PK1004', 'PK1002'], ['pwa', 'fast'], 'download-site-01']
    ];
    var channels = specs.map(function (s, index) {
      var download = defaultDownload(); download.types = s[7]; download.popup = index !== 3; download.days = index === 1 ? 2 : 0;
      return {id: s[0], code: s[1], name: s[2], media: s[3], type: s[4], currency: s[5], language: 'English', status: index === 5 ? 'disabled' : 'enabled', createdAt: '2026-11-0' + (index + 1), domain: 'm.play-demo.com', landing: '仿应用商店落地页', destination: index === 4 ? 'trial' : index === 5 ? 'download' : 'lobby', linkName: s[8], packageIds: s[6], download: download, tracking: Object.assign(defaultTracking(s[3]), {pixel: ['129830401112233', 'TT-8A72F9', 'G-102938', '', '129830401114455', 'TT-9B83G0'][index]}), restrictions: {phone: 'follow', email: 'follow', region: false, countries: '', masked: false}, agent: '', memberLevel: '默认层级', memberTag: '', remark: index === 0 ? '主投放渠道，关联原生包及 PWA 入口' : ''};
    });
    return {schemaVersion: 1, channels: channels, packages: [
      {id: 'PK1001', name: 'Android 原生通用包', type: 'native', platform: 'Android', status: 'published', currentVersion: '2.4.0', updatedAt: '2026-11-01', versions: [seedVersion('2.4.0', '20400', 'https://download.play-demo.com/android/2.4.0.apk', '2026-11-01'), seedVersion('2.3.0', '20300', 'https://download.play-demo.com/android/2.3.0.apk', '2026-10-20')]},
      {id: 'PK1002', name: 'PWA 快捷入口', type: 'pwa', platform: 'PWA', status: 'published', currentVersion: '1.8.0', updatedAt: '2026-11-01', versions: [seedVersion('1.8.0', '10800', 'https://pwa.play-demo.com/', '2026-11-01'), seedVersion('1.7.0', '10700', 'https://pwa.play-demo.com/v1.7/', '2026-10-18')]},
      {id: 'PK1003', name: 'TikTok 独立渠道包', type: 'channel', channelCode: 'CCCC', platform: 'Android', status: 'published', currentVersion: '2.4.1', updatedAt: '2026-11-08', versions: [seedVersion('2.4.1', '20401', 'https://download.play-demo.com/tiktok/2.4.1.apk', '2026-11-08'), seedVersion('2.4.0', '20400', 'https://download.play-demo.com/tiktok/2.4.0.apk', '2026-11-01')]},
      {id: 'PK1004', name: 'Android 极速包', type: 'fast', platform: 'Android', status: 'published', currentVersion: '1.3.0', updatedAt: '2026-11-05', versions: [seedVersion('1.3.0', '10300', 'https://download.play-demo.com/fast/1.3.0.apk', '2026-11-05')]},
      {id: 'PK1005', name: 'iOS 原生包', type: 'native', platform: 'iOS', status: 'draft', currentVersion: '', updatedAt: '2026-11-11', versions: [seedVersion('1.0.0', '10000', 'https://download.play-demo.com/ios/1.0.0.ipa', '2026-11-11', 'draft')]}
    ], spend: [
      {id: 'SP1001', date: '2026-11-02', channelId: 'CH1001', media: 'Facebook', currency: 'INR', amount: 3800, note: '首轮广告投放'},
      {id: 'SP1002', date: '2026-11-06', channelId: 'CH1001', media: 'Facebook', currency: 'INR', amount: 4200, note: '视频素材投放'},
      {id: 'SP1003', date: '2026-11-04', channelId: 'CH1002', media: 'TikTok', currency: 'INR', amount: 6500, note: '信息流广告'},
      {id: 'SP1004', date: '2026-11-05', channelId: 'CH1003', media: 'Google', currency: 'USD', amount: 160, note: '品牌词投放'},
      {id: 'SP1005', date: '2026-11-07', channelId: 'CH1005', media: 'Facebook', currency: 'INR', amount: 2600, note: '试玩素材投放'}
    ], global: {domain: 'm.play-demo.com', language: 'English', currency: 'INR', show: true, popup: true, phone: 'follow', email: 'follow', maskLinks: false, rechargeApp: false, rechargeCount: 3}};
  }
  function normalizeState(next) {
    next.packages.forEach(function (pkg) {
      if (pkg.type !== 'channel' || pkg.channelCode) return;
      var codes = next.channels.filter(function (c) { return (c.packageIds || []).includes(pkg.id); }).map(function (c) { return c.code; }).filter(function (value, i, all) { return value && all.indexOf(value) === i; });
      if (codes.length === 1) pkg.channelCode = codes[0];
    });
    return next;
  }
  function loadState() {
    try { var raw = localStorage.getItem(STORAGE_KEY); if (raw) { var parsed = JSON.parse(raw); if (parsed.schemaVersion === 1 && Array.isArray(parsed.channels) && Array.isArray(parsed.packages) && Array.isArray(parsed.spend) && parsed.global) return normalizeState(parsed); } }
    catch (error) { window.setTimeout(function () { toast('无法读取本机保存的数据，当前使用初始演示数据。'); }, 100); }
    return makeSeed();
  }
  function saveState(next) {
    var serialized = JSON.stringify(next);
    try { localStorage.setItem(STORAGE_KEY, serialized); } catch (error) { throw new Error('保存失败，请检查浏览器存储权限；当前输入已保留。'); }
    state = JSON.parse(serialized);
  }
  function toast(message) { var box = document.getElementById('cm-toast'); if (!box) return; box.textContent = message; box.hidden = false; window.clearTimeout(toastTimer); toastTimer = window.setTimeout(function () { box.hidden = true; }, 3400); }
  function modalError(message) { var box = document.getElementById('cm-form-status'); box.textContent = message; }
  function closeModal() { document.getElementById('cm-modal').hidden = true; document.getElementById('cm-app').inert = false; document.body.style.overflow = ''; modalOptions = null; if (modalOrigin && document.contains(modalOrigin)) modalOrigin.focus(); }
  function dialog(options) {
    var layer = document.getElementById('cm-modal'), previous = document.getElementById('cm-modal-form');
    var form = document.createElement('form'); form.id = 'cm-modal-form';
    form.innerHTML = '<div id="cm-modal-content" class="cm-dialog-body"></div><footer class="cm-dialog-footer"><span id="cm-form-status" class="cm-form-status cm-error" role="alert"></span><button class="cm-btn" type="button" data-cm-close>' + (options.readonly ? '关闭' : '取消') + '</button><button class="cm-btn primary" type="submit" id="cm-modal-submit">保存</button></footer>';
    previous.replaceWith(form);
    modalOrigin = layer.hidden ? document.activeElement : modalOrigin;
    modalOptions = options;
    document.getElementById('cm-modal-title').textContent = options.title;
    document.getElementById('cm-modal-content').innerHTML = options.html;
    document.getElementById('cm-form-status').textContent = '';
    layer.querySelector('.cm-dialog').classList.toggle('is-wide', options.width === 'wide');
    var submit = document.getElementById('cm-modal-submit'); submit.textContent = options.submitLabel || '保存'; submit.hidden = options.readonly === true;
    layer.querySelector('[data-cm-close]').title = '关闭并放弃未保存内容';
    form.noValidate = true;
    form.addEventListener('submit', function (event) { event.preventDefault(); var active = modalOptions; if (!active || !active.onSubmit) return; modalError(''); try { active.onSubmit(form, closeModal); } catch (error) { modalError(error.message || '保存失败，请检查填写内容。'); } });
    layer.hidden = false; document.getElementById('cm-app').inert = true; document.body.style.overflow = 'hidden';
    if (options.onOpen) options.onOpen(form);
    window.setTimeout(function () { if (!layer.hidden) { var first = form.querySelector('.cm-dialog-body input:not([type=checkbox]):not([type=radio]):not([disabled]),.cm-dialog-body select:not([disabled]),.cm-dialog-body button') || layer.querySelector('[data-cm-close]'); if (first) first.focus(); } }, 0);
    return form;
  }
  function csvDownload(filename, rows) {
    var csv = '\uFEFF' + rows.map(function (row) { return row.map(function (v) { var s = String(v == null ? '' : v); if (typeof v !== 'number' && /^[\s]*[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
    var url = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
    var a = document.createElement('a'); a.href = url; a.download = filename; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(function () { toast('已复制'); return true; }).catch(function () { return fallbackCopy(text); });
    return Promise.resolve(fallbackCopy(text));
  }
  function fallbackCopy(text) { var area = document.createElement('textarea'); area.value = text; area.style.position = 'fixed'; area.style.opacity = '0'; document.body.appendChild(area); area.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (error) { ok = false; } area.remove(); toast(ok ? '已复制' : '复制未成功，请在详情中选中链接手动复制。'); return ok; }
  function queryValues(form) { var values = {}; new FormData(form).forEach(function (v, k) { values[k] = String(v).trim(); }); return values; }
  function options(values, value) { return values.map(function (item) { var pair = Array.isArray(item) ? item : [item, item]; return '<option value="' + esc(pair[0]) + '"' + (String(pair[0]) === String(value) ? ' selected' : '') + '>' + esc(pair[1]) + '</option>'; }).join(''); }
  function input(name, value, extra) { return '<input class="cm-input" name="' + esc(name) + '" value="' + esc(value) + '" ' + (extra || '') + '>'; }
  function select(name, values, value, extra) { return '<select class="cm-input" name="' + name + '" ' + (extra || '') + '>' + options(values, value) + '</select>'; }
  function field(label, control, help, wide) {
    var id = 'cm-field-' + (++fieldSerial), hasControl = /^<(input|select|textarea)\b/.test(control);
    if (hasControl) control = control.replace(/^<(input|select|textarea)\b/, '<$1 id="' + id + '"');
    return '<div class="cm-field' + (wide ? ' wide' : '') + '">' + (hasControl ? '<label for="' + id + '">' + label + '</label>' : '<span>' + label + '</span>') + control + (help ? '<small class="cm-field-help">' + help + '</small>' : '') + '</div>';
  }
  function check(name, value, label, checked) { return '<label class="cm-check"><input type="checkbox" name="' + name + '" value="' + esc(value) + '"' + (checked ? ' checked' : '') + '><span>' + label + '</span></label>'; }
  function radios(name, items, value) { return '<div class="cm-option-list">' + items.map(function (p) { return '<label class="cm-radio"><input type="radio" name="' + name + '" value="' + p[0] + '"' + (value === p[0] ? ' checked' : '') + '><span>' + p[1] + '</span></label>'; }).join('') + '</div>'; }
  function channelById(id) { return state.channels.find(function (c) { return c.id === id; }); }
  function validPackage(pkg) { return pkg.status === 'published' && pkg.versions.some(function (v) { return v.version === pkg.currentVersion && v.status === 'published'; }); }
  function checkDownload(channel, packageList) {
    var source = {channels: state ? state.channels : [], packages: packageList};
    return window.CMPackages.validateBindings(channel, channel.packageIds, source);
  }
  function promotionUrl(channel) {
    var paths = {lobby: '/', register: '/register', activity: '/promotions', trial: '/trial', download: '/download', landing: '/landing'};
    var url = 'https://' + channel.domain + (paths[channel.destination] || '/') + '?channel=' + encodeURIComponent(channel.code) + '&media=' + encodeURIComponent(channel.media) + '&link=' + encodeURIComponent(channel.linkName) + '&lang=' + encodeURIComponent(channel.language) + '&currency=' + encodeURIComponent(channel.currency);
    if (channel.destination === 'landing') url += '&template=' + encodeURIComponent(channel.landing);
    return url;
  }
  function filteredChannels() {
    return state.channels.filter(function (c) { return (!filters.keyword || (c.name + ' ' + c.id + ' ' + c.code).toLowerCase().includes(filters.keyword.toLowerCase())) && (!filters.media || filters.media === c.media) && (!filters.type || filters.type === c.type) && (!filters.status || filters.status === c.status) && (!filters.currency || filters.currency === c.currency) && (!filters.show || (filters.show === 'yes') === c.download.show) && (!filters.popup || (filters.popup === 'yes') === c.download.popup) && (!filters.start || c.createdAt >= filters.start) && (!filters.end || c.createdAt <= filters.end); });
  }
  function rowButton(action, label, id) { return '<button type="button" class="cm-link" data-cm-action="' + action + '" data-id="' + esc(id) + '">' + label + '</button>'; }
  function renderChannels() {
    var list = filteredChannels(); page = Math.max(1, Math.min(page, Math.ceil(list.length / pageSize) || 1));
    var visible = list.slice((page - 1) * pageSize, page * pageSize);
    document.getElementById('cm-channel-rows').innerHTML = visible.length ? visible.map(function (c) {
      var names = c.packageIds.map(function (id) { var p = state.packages.find(function (item) { return item.id === id; }); return p ? esc(p.name) + ' <span class="cm-muted">' + esc(p.currentVersion || '未发布') + '</span>' : ''; }).filter(Boolean);
      var force = c.download.force === 'none' ? '不强制下载' : c.download.force === 'remind' ? '强制提醒 · 仍可使用网页' : '下载后仅允许 APP';
      return '<tr><td><input class="cm-check" type="checkbox" data-cm-select="' + c.id + '" aria-label="选择' + esc(c.name) + '"' + (selected.has(c.id) ? ' checked' : '') + '></td><td><div class="cm-cell-title">' + rowButton('detail', esc(c.name), c.id) + '</div><div class="cm-cell-sub">' + esc(c.id + ' · ' + c.code) + '</div></td><td>' + esc(c.media) + '<div class="cm-cell-sub">' + TYPE_NAMES[c.type] + '</div></td><td>' + esc(c.currency) + '<div class="cm-cell-sub">' + esc(c.language) + '</div></td><td><div class="cm-cell-title">' + DEST_NAMES[c.destination] + ' ' + rowButton('copy-link', '复制链接', c.id) + '</div><div class="cm-cell-sub">' + esc(c.linkName) + '</div></td><td>' + (names.length ? names.join('<br>') : '<span class="cm-muted">未关联</span>') + '</td><td>' + (c.download.show ? '展示入口' : '隐藏入口') + ' · ' + (c.download.popup ? '开启提醒' : '关闭提醒') + '<div class="cm-cell-sub">' + force + '</div></td><td><span class="cm-badge ' + (c.status === 'enabled' ? 'green' : 'gray') + '">' + (c.status === 'enabled' ? '启用' : '停用') + '</span></td><td>' + esc(c.createdAt) + '</td><td class="cm-sticky-action"><div class="cm-actions">' + rowButton('edit', '编辑', c.id) + rowButton('bind', '包配置', c.id) + rowButton('report', '报表', c.id) + rowButton('toggle', c.status === 'enabled' ? '停用' : '启用', c.id) + '</div></td></tr>';
    }).join('') : '<tr><td colspan="10"><div class="cm-empty">没有符合条件的渠道，请调整筛选条件或新增渠道。</div></td></tr>';
    document.getElementById('cm-channel-footer').innerHTML = '<span class="cm-muted">共 ' + list.length + ' 个渠道</span><div class="cm-pagination"><label>每页 <select class="cm-input" id="cm-page-size">' + options([10, 20, 50], pageSize) + '</select> 条</label><button type="button" class="cm-btn small" data-cm-action="prev"' + (page <= 1 ? ' disabled' : '') + '>上一页</button><span>' + page + ' / ' + Math.max(1, Math.ceil(list.length / pageSize)) + '</span><button type="button" class="cm-btn small" data-cm-action="next"' + (page * pageSize >= list.length ? ' disabled' : '') + '>下一页</button></div>';
    document.querySelectorAll('#cm-channel-rows .cm-cell-title, #cm-channel-rows .cm-cell-sub').forEach(function (node) { node.title = node.textContent; });
    var all = document.getElementById('cm-select-all'); all.checked = visible.length > 0 && visible.every(function (c) { return selected.has(c.id); }); all.indeterminate = visible.some(function (c) { return selected.has(c.id); }) && !all.checked;
    document.getElementById('cm-batch-bar').hidden = selected.size === 0;
    document.getElementById('cm-selected-count').textContent = '已选择 ' + selected.size + ' 个渠道';
  }
  function newChannel() {
    var g = state.global;
    return {id: '', code: '', name: '', media: 'Facebook', type: 'link', currency: g.currency, language: g.language, status: 'enabled', createdAt: today(), domain: g.domain, landing: '仿应用商店落地页', destination: 'lobby', linkName: '', packageIds: ['PK1001', 'PK1002'].filter(function (id) { return state.packages.some(function (p) { return p.id === id && validPackage(p); }); }), download: Object.assign(defaultDownload(), {show: g.show, popup: g.popup, deposits: g.rechargeApp ? g.rechargeCount : 0}), tracking: defaultTracking('自然流量'), restrictions: {phone: g.phone, email: g.email, region: false, countries: '', masked: g.maskLinks}, agent: '', memberLevel: '默认层级', memberTag: '', remark: ''};
  }
  function downloadForm(dl) {
    return '<div class="cm-form-grid">' + field('展示下载入口', radios('dl_show', [['yes', '展示'], ['no', '隐藏']], dl.show ? 'yes' : 'no')) + field('APP 下载弹窗', radios('dl_popup', [['yes', '开启'], ['no', '关闭']], dl.popup ? 'yes' : 'no')) + '<div class="cm-field wide"><span>展示下载内容</span><div class="cm-option-list">' + Object.keys(PACKAGE_TYPES).map(function (k) { return check('dl_type', k, PACKAGE_TYPES[k], dl.types.includes(k)); }).join('') + '</div><small class="cm-field-help">可同时展示多种下载方式，每种方式需有关联的已发布包。</small></div>' + '<div class="cm-field wide"><span>下载要求</span>' + radios('dl_force', [['none', '不强制下载'], ['remind', '强制提醒，仍可用网页'], ['app', '强制下载，仅允许 APP 使用']], dl.force) + '</div>' + field('注册天数达到', input('dl_days', dl.days, 'type="number" min="0" max="3650" step="1"'), '0 表示不限制') + field('充值次数达到', input('dl_deposits', dl.deposits, 'type="number" min="0" max="9999" step="1"'), '0 表示不限制') + field('提现次数达到', input('dl_withdrawals', dl.withdrawals, 'type="number" min="0" max="9999" step="1"'), '开启弹窗后，满足任一有效条件时提醒') + '<div class="cm-field"><span>其他设置</span>' + check('dl_inGame', 'yes', '游戏内也展示下载提醒', dl.inGame) + check('dl_reward', 'yes', '展示下载奖励入口', dl.reward) + '<small class="cm-field-help">奖励内容沿用活动配置，不在这里设置发奖规则。</small></div></div>';
  }
  function parseDownload(form) {
    var v = queryValues(form);
    return {show: v.dl_show === 'yes', popup: v.dl_popup === 'yes', types: Array.from(form.querySelectorAll('[name=dl_type]:checked')).map(function (x) { return x.value; }), force: v.dl_force || 'none', days: Number(v.dl_days), deposits: Number(v.dl_deposits), withdrawals: Number(v.dl_withdrawals), inGame: v.dl_inGame === 'yes', reward: v.dl_reward === 'yes'};
  }
  function validateThresholds(dl) { return ['days', 'deposits', 'withdrawals'].every(function (k) { return Number.isInteger(dl[k]) && dl[k] >= 0 && dl[k] <= (k === 'days' ? 3650 : 9999); }); }
  function syncEditor(form) {
    var provider = form.elements.provider.value;
    ['pixel', 'registerEvent', 'firstPayEvent', 'repeatPayEvent'].forEach(function (name) { form.elements[name].readOnly = provider === '无'; });
    form.elements.countries.readOnly = form.querySelector('[name=region]:checked').value !== 'yes';
    var landingField = form.elements.landing.closest('.cm-field');
    landingField.hidden = form.elements.destination.value !== 'landing';
    form.querySelectorAll('[data-cm-package-code]').forEach(function (node) {
      var field = node.querySelector('input'), code = node.dataset.cmPackageCode;
      var allowed = !code || code.toLowerCase() === form.elements.code.value.trim().toLowerCase();
      field.disabled = !allowed;
      if (!allowed) field.checked = false;
      node.title = allowed ? '' : '专属渠道包只可用于渠道 ' + code;
    });
    var hint = form.querySelector('[data-cm-type-help]');
    hint.hidden = form.elements.type.value !== 'channel';
    hint.textContent = '独立渠道包需专属渠道码匹配。尚未制包时可先“停用”保存，准备并发布渠道包后再关联启用。';
  }
  function syncDownloadControls(form, changed) {
    var show = form.querySelector('[name=dl_show]:checked').value === 'yes';
    if (!show && changed === 'dl_show') {
      form.querySelector('[name=dl_popup][value=no]').checked = true;
      form.querySelector('[name=dl_force][value=none]').checked = true;
    }
    var popup = form.querySelector('[name=dl_popup]:checked').value === 'yes';
    if (!popup && changed === 'dl_popup') form.querySelector('[name=dl_force][value=none]').checked = true;
    var status = form.querySelector('[data-cm-download-help]');
    if (status) status.textContent = !show ? '下载入口已隐藏，下载弹窗及强制下载保持关闭。' : !popup ? '弹窗已关闭，提醒条件暂不生效。' : '提醒条件：任一大于 0 的条件达到后提醒；全部为 0 时首次访问即提醒。';
    ['dl_days', 'dl_deposits', 'dl_withdrawals'].forEach(function (name) { if (form.elements[name]) form.elements[name].readOnly = !show || !popup; });
  }
  function editor(id) {
    var saved = id ? channelById(id) : null, draft = clone(saved || newChannel());
    var packageChoices = state.packages.filter(validPackage).map(function (p) { var code = window.CMPackages.packageChannelCode(p, state); return '<div data-cm-package-code="' + esc(code) + '">' + check('packageIds', p.id, esc(p.name) + ' <span class="cm-muted">' + esc(p.platform + ' · ' + p.currentVersion) + (code ? ' · ' + esc(code) : '') + '</span>', draft.packageIds.includes(p.id)) + '</div>'; }).join('');
    var html = '<nav class="cm-modal-tabs" aria-label="渠道配置分组">' + [['basic', '基本资料'], ['promotion', '推广与包'], ['download', '下载策略'], ['tracking', '埋点与限制']].map(function (p, i) { return '<button type="button" class="' + (i === 0 ? 'is-active' : '') + '" data-cm-form-tab="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</nav>';
    html += '<section class="cm-modal-pane" data-cm-form-pane="basic"><div class="cm-form-grid">' + field('渠道名称 *', input('name', draft.name, 'maxlength="60" placeholder="例如：Facebook 印度视频渠道"')) + field('渠道编码 *', input('code', draft.code, 'maxlength="32" pattern="[A-Za-z0-9_-]+"' + (saved ? ' readonly' : '')), '创建后不可修改，用于推广归因') + field('媒体', select('media', ['Facebook', 'TikTok', 'Google', '自然流量'], draft.media)) + field('推广类型', select('type', Object.keys(TYPE_NAMES).map(function (k) { return [k, TYPE_NAMES[k]]; }), draft.type)) + field('币种', select('currency', ['INR', 'USD'], draft.currency, saved ? 'disabled' : ''), saved ? '创建后固定，保留历史报表币种口径' : '') + field('语言', select('language', ['English', 'हिन्दी', '简体中文', '繁體中文', 'Português'], draft.language)) + field('渠道状态', select('status', [['enabled', '启用'], ['disabled', '停用']], draft.status)) + field('绑定代理账号', input('agent', draft.agent, 'maxlength="40" placeholder="选填"')) + field('会员层级', select('memberLevel', ['默认层级', '普通会员', '推广新客'], draft.memberLevel)) + field('会员标签', input('memberTag', draft.memberTag, 'maxlength="40" placeholder="选填"')) + field('备注', '<textarea class="cm-input" name="remark" rows="2" maxlength="200">' + esc(draft.remark) + '</textarea>', '', true) + '</div></section>';
    html += '<section class="cm-modal-pane" data-cm-form-pane="promotion" hidden><div class="cm-form-grid">' + field('推广域名 *', input('domain', draft.domain, 'placeholder="m.example.com"'), '填写域名，不含 https:// 和路径；<a class="cm-link" href="站点域名.html" target="_blank" rel="noopener">管理推广域名 ↗</a>') + field('直达位置', select('destination', Object.keys(DEST_NAMES).map(function (k) { return [k, DEST_NAMES[k]]; }), draft.destination)) + field('广告链接标识 *', input('linkName', draft.linkName, 'maxlength="60" placeholder="例如：feed-video-01"'), '用于区分同一渠道下的推广入口') + field('落地页模板', select('landing', ['仿应用商店落地页', '品牌介绍落地页', '下载引导落地页'], draft.landing), '<a class="cm-link" href="落地页管理.html" target="_blank" rel="noopener">管理落地页模板 ↗</a>') + '<div class="cm-field wide"><span>关联已发布包</span><div class="cm-checkbox-list">' + (packageChoices || '<span class="cm-muted">暂无已发布包，请先到包管理发布。</span>') + '</div><small class="cm-field-help">关联包发布新版本后，下载入口跟随当前版本；历史报表保留原包及版本。</small></div></div></section>';
    html += '<section class="cm-modal-pane" data-cm-form-pane="download" hidden>' + downloadForm(draft.download) + '</section>';
    html += '<section class="cm-modal-pane" data-cm-form-pane="tracking" hidden><div class="cm-form-grid">' + field('埋点 / 归因工具', select('provider', ['无', 'Meta Pixel', 'TikTok Pixel', 'Google Tag', 'Adjust'], draft.tracking.provider)) + field('像素 ID / App Token', input('pixel', draft.tracking.pixel, 'maxlength="100"')) + field('注册事件标识', input('registerEvent', draft.tracking.registerEvent, 'maxlength="80"')) + field('首充事件标识', input('firstPayEvent', draft.tracking.firstPayEvent, 'maxlength="80"')) + field('复充事件标识', input('repeatPayEvent', draft.tracking.repeatPayEvent, 'maxlength="80"')) + field('手机号验证', select('phone', [['follow', '跟随站点安全配置'], ['required', '强制验证']], draft.restrictions.phone)) + field('邮箱验证', select('email', [['follow', '跟随站点安全配置'], ['required', '强制验证']], draft.restrictions.email)) + field('投放地区限制', radios('region', [['no', '关闭'], ['yes', '开启']], draft.restrictions.region ? 'yes' : 'no')) + field('允许投放国家 / 地区', input('countries', draft.restrictions.countries, 'placeholder="例如：IN, US" maxlength="100"'), '开启限制时填写两位国家代码，多个以英文逗号分隔') + '<div class="cm-field"><span>链接展示</span>' + check('masked', 'yes', '复制时使用渠道短链接', draft.restrictions.masked) + '<small class="cm-field-help">短链接与完整链接指向同一渠道，原始归因信息不变。</small></div></div></section>';
    dialog({title: saved ? '编辑渠道 · ' + saved.name : '新增渠道', html: html, width: 'wide', submitLabel: saved ? '保存修改' : '创建渠道', onOpen: function (form) {
      form.querySelectorAll('[data-cm-form-tab]').forEach(function (b) { b.addEventListener('click', function () { showFormTab(form, b.dataset.cmFormTab); }); });
      var typeHelp = document.createElement('p'); typeHelp.dataset.cmTypeHelp = ''; typeHelp.className = 'cm-note'; form.querySelector('[data-cm-form-pane=basic]').appendChild(typeHelp);
      var dlHelp = document.createElement('p'); dlHelp.dataset.cmDownloadHelp = ''; dlHelp.className = 'cm-note'; form.querySelector('[data-cm-form-pane=download]').appendChild(dlHelp);
      form.addEventListener('change', function (event) {
        var name = event.target.name;
        if (name === 'type') { var value = event.target.value; if (value === 'trial') form.elements.destination.value = 'trial'; else if (value === 'download') form.elements.destination.value = 'download'; }
        if (['provider', 'region', 'destination', 'type', 'code'].includes(name)) syncEditor(form);
        if (name === 'dl_show' || name === 'dl_popup') syncDownloadControls(form, name);
      });
      form.elements.code.addEventListener('input', function () { syncEditor(form); });
      syncEditor(form); syncDownloadControls(form);
    }, onSubmit: function (form, close) {
      var values = queryValues(form), channel = clone(draft);
      function invalid(message, pane, name) { showFormTab(form, pane); modalError(message); if (name && form.elements[name]) form.elements[name].focus(); return false; }
      if (!values.name) return invalid('请输入渠道名称。', 'basic', 'name');
      if (!/^[A-Za-z0-9_-]{2,32}$/.test(values.code || '')) return invalid('渠道编码需为 2–32 位字母、数字、下划线或短横线。', 'basic', 'code');
      if (state.channels.some(function (c) { return c.id !== id && c.code.toLowerCase() === values.code.toLowerCase(); })) return invalid('渠道编码已存在，请更换。', 'basic', 'code');
      if (!/^(?=.{3,253}$)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/.test(values.domain || '')) return invalid('请输入有效的推广域名，不含协议、路径和空格。', 'promotion', 'domain');
      if (!/^[A-Za-z0-9_-]{2,60}$/.test(values.linkName || '')) return invalid('广告链接标识需为 2–60 位字母、数字、下划线或短横线。', 'promotion', 'linkName');
      ['name', 'code', 'media', 'type', 'language', 'status', 'domain', 'landing', 'destination', 'linkName', 'agent', 'memberLevel', 'memberTag', 'remark'].forEach(function (k) { channel[k] = values[k] || ''; });
      if (saved) channel.code = saved.code;
      channel.currency = saved ? saved.currency : values.currency;
      channel.id = saved ? saved.id : 'CH' + Date.now().toString(36).toUpperCase();
      channel.packageIds = Array.from(form.querySelectorAll('[name=packageIds]:checked')).map(function (x) { return x.value; });
      channel.download = parseDownload(form);
      if (!validateThresholds(channel.download)) return invalid('下载提醒条件必须为有效的非负整数。', 'download', 'dl_days');
      var dlError = checkDownload(channel, state.packages); if (dlError) return invalid(dlError, /关联|绑定|专属|生效包|缺少/.test(dlError) ? 'promotion' : 'download');
      channel.tracking = {provider: values.provider, pixel: values.pixel, registerEvent: values.registerEvent, firstPayEvent: values.firstPayEvent, repeatPayEvent: values.repeatPayEvent};
      if (channel.tracking.provider !== '无' && !values.pixel) return invalid('选择埋点工具后，请填写像素 ID 或 App Token。', 'tracking', 'pixel');
      if (channel.tracking.provider !== '无' && (!values.registerEvent || !values.firstPayEvent || !values.repeatPayEvent)) return invalid('请补全注册、首充及复充事件标识。', 'tracking', 'registerEvent');
      if (values.region === 'yes' && !/^[A-Za-z]{2}(?:\s*,\s*[A-Za-z]{2})*$/.test(values.countries || '')) return invalid('开启地区限制后，请填写两位国家代码，例如 IN, US。', 'tracking', 'countries');
      channel.restrictions = {phone: values.phone, email: values.email, region: values.region === 'yes', countries: (values.countries || '').toUpperCase(), masked: values.masked === 'yes'};
      var next = clone(state); if (saved) next.channels = next.channels.map(function (c) { return c.id === id ? channel : c; }); else next.channels.unshift(channel);
      saveState(next); close(); renderChannels(); toast(saved ? '渠道配置已保存' : '渠道已创建，尚无投放历史数据');
    }});
  }
  function showFormTab(form, tab) { form.querySelectorAll('[data-cm-form-pane]').forEach(function (p) { p.hidden = p.dataset.cmFormPane !== tab; }); form.querySelectorAll('[data-cm-form-tab]').forEach(function (b) { b.classList.toggle('is-active', b.dataset.cmFormTab === tab); }); }
  function channelDetail(id) {
    var c = channelById(id); if (!c) return;
    var short = c.restrictions.masked ? 'https://' + c.domain + '/s/' + encodeURIComponent(c.id) : '';
    var rows = [['渠道编码', c.code], ['推广类型', TYPE_NAMES[c.type]], ['媒体 / 币种 / 语言', c.media + ' / ' + c.currency + ' / ' + c.language], ['投放状态', c.status === 'enabled' ? '启用' : '停用'], ['直达位置 / 落地页', DEST_NAMES[c.destination] + ' / ' + c.landing], ['关联包', c.packageIds.map(function (id) { var pkg = state.packages.find(function (p) { return p.id === id; }); return pkg ? pkg.name + ' ' + (pkg.currentVersion || '草稿') : id; }).join('、') || '未关联'], ['下载策略', (c.download.show ? '展示' : '隐藏') + ' · ' + (c.download.popup ? '开启弹窗' : '关闭弹窗') + ' · ' + (c.download.force === 'app' ? '仅APP' : c.download.force === 'remind' ? '强制提醒' : '不强制')], ['埋点 / 归因工具', c.tracking.provider], ['像素 ID / App Token', c.tracking.pixel || '—'], ['注册 / 首充 / 复充事件', [c.tracking.registerEvent, c.tracking.firstPayEvent, c.tracking.repeatPayEvent].join(' / ')], ['地区限制', c.restrictions.region ? c.restrictions.countries : '关闭'], ['创建时间', c.createdAt]];
    dialog({title: '渠道预览 · ' + c.name, width: 'wide', readonly: true, html: '<div class="cm-form-grid">' + rows.map(function (r) { return field(r[0], '<div>' + esc(r[1]) + '</div>'); }).join('') + field('完整推广链接', input('fullLink', promotionUrl(c), 'readonly'), '推广地址附带渠道、媒体、广告链接、语言及币种；落地页按直达位置识别。', true) + (short ? field('渠道短链接', input('shortLink', short, 'readonly'), '本机演示的短链接样式，需在正式环境配置解析服务。', true) : '') + '</div><div class="cm-actions"><button type="button" class="cm-btn" data-detail-copy="full">复制推广链接</button>' + (short ? '<button type="button" class="cm-btn" data-detail-copy="short">复制短链接</button>' : '') + '<button type="button" class="cm-btn primary" data-detail-target="edit">编辑渠道</button><button type="button" class="cm-btn" data-detail-target="packages">关联包</button><button type="button" class="cm-btn" data-detail-target="conversion">转化统计</button></div>', onOpen: function (form) {
      form.querySelectorAll('[data-detail-copy]').forEach(function (b) { b.addEventListener('click', function () { copy(b.dataset.detailCopy === 'short' ? short : promotionUrl(c)); }); });
      form.querySelectorAll('[data-detail-target]').forEach(function (b) { b.addEventListener('click', function () { closeModal(); if (b.dataset.detailTarget === 'edit') editor(id); else go(b.dataset.detailTarget, {channelId: id}); }); });
    }});
  }
  function confirmStatus(ids, enabled) {
    var items = state.channels.filter(function (c) { return ids.includes(c.id); });
    if (!items.length) return toast('请先选择渠道。');
    dialog({title: (enabled ? '启用' : '停用') + '渠道', html: '<p>确定' + (enabled ? '启用' : '停用') + '以下 ' + items.length + ' 个渠道？</p><p>' + items.map(function (c) { return esc(c.name); }).join('、') + '</p><p class="cm-note">' + (enabled ? '启用后按已保存的推广及下载配置承接新流量。' : '停用影响后续推广入口，保留包版本、会员来源和全部历史统计。') + '</p>', submitLabel: enabled ? '确认启用' : '确认停用', onSubmit: function (form, close) { var next = clone(state); for (var i = 0; i < next.channels.length; i++) if (ids.includes(next.channels[i].id)) { next.channels[i].status = enabled ? 'enabled' : 'disabled'; if (enabled) { var problem = checkDownload(next.channels[i], next.packages); if (problem) throw new Error(next.channels[i].name + '：' + problem); } } saveState(next); close(); selected.clear(); renderChannels(); toast('渠道状态已更新'); }});
  }
  function globalConfig() {
    var g = clone(state.global);
    dialog({title: '渠道公共配置', width: 'normal', submitLabel: '保存公共配置', html: '<p class="cm-note">作为新建渠道的默认值；保存不会覆盖现有渠道。已有渠道请使用编辑或批量下载策略。</p><div class="cm-form-grid">' + field('默认推广域名', input('domain', g.domain)) + field('默认币种', select('currency', ['INR', 'USD'], g.currency)) + field('默认语言', select('language', ['English', 'हिन्दी', '简体中文', '繁體中文', 'Português'], g.language)) + field('下载入口', radios('show', [['yes', '展示'], ['no', '隐藏']], g.show ? 'yes' : 'no')) + field('下载提醒弹窗', radios('popup', [['yes', '开启'], ['no', '关闭']], g.popup ? 'yes' : 'no')) + field('手机号验证', select('phone', [['follow', '跟随站点安全配置'], ['required', '强制验证']], g.phone)) + field('邮箱验证', select('email', [['follow', '跟随站点安全配置'], ['required', '强制验证']], g.email)) + '<div class="cm-field"><span>复制推广链接</span>' + check('maskLinks', 'yes', '默认使用渠道短链接', g.maskLinks) + '</div><div class="cm-field wide"><span>充值后引导 APP</span>' + check('rechargeApp', 'yes', '充值达到指定次数后引导安装 APP', g.rechargeApp) + input('rechargeCount', g.rechargeCount, 'type="number" min="1" max="999"') + '<small class="cm-field-help">作为新渠道下载提醒的默认充值次数；已有渠道不受影响。</small></div></div>', onSubmit: function (form, close) {
      var v = queryValues(form); if (!/^(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/.test(v.domain || '')) throw new Error('请填写有效的默认域名。');
      if (v.show === 'no' && v.popup === 'yes') throw new Error('隐藏下载入口时，请关闭下载提醒弹窗。');
      if (v.rechargeApp && (v.show !== 'yes' || v.popup !== 'yes')) throw new Error('充值后引导 APP 需要同时展示下载入口并开启下载提醒。');
      if (v.rechargeApp && (!Number.isInteger(Number(v.rechargeCount)) || Number(v.rechargeCount) < 1 || Number(v.rechargeCount) > 999)) throw new Error('充值次数需为 1–999 的整数。');
      var next = clone(state); next.global = {domain: v.domain, currency: v.currency, language: v.language, show: v.show === 'yes', popup: v.popup === 'yes', phone: v.phone, email: v.email, maskLinks: v.maskLinks === 'yes', rechargeApp: v.rechargeApp === 'yes', rechargeCount: Number(v.rechargeCount) || 3}; saveState(next); close(); toast('公共配置已保存，对后续新建渠道生效');
    }});
  }
  function batchAdd() {
    dialog({title: '批量新增渠道', width: 'wide', submitLabel: '创建渠道', html: '<p class="cm-note">每行一个渠道：渠道名称,渠道编码,广告链接标识。支持英文逗号或 Tab 分隔，最多 50 行；先校验全部内容，通过后统一创建。</p><div class="cm-form-grid">' + field('媒体', select('media', ['Facebook', 'TikTok', 'Google', '自然流量'], 'Facebook')) + field('推广类型', select('type', Object.keys(TYPE_NAMES).map(function (k) { return [k, TYPE_NAMES[k]]; }), 'link')) + field('批量内容 *', '<textarea class="cm-input" name="rows" rows="8" placeholder="Facebook 视频 A,FB_A,video-a&#10;Facebook 视频 B,FB_B,video-b"></textarea>', '', true) + '</div><p class="cm-muted">使用公共配置的币种、语言和域名；下载入口默认关闭，不创建埋点配置。PWA、原生包和独立渠道包渠道先停用，关联匹配的已发布包后再启用。</p>', onSubmit: function (form, close) {
      var v = queryValues(form), lines = (v.rows || '').split(/\r?\n/).filter(function (s) { return s.trim(); });
      if (!lines.length || lines.length > 50) throw new Error('请输入 1–50 行渠道。');
      var codes = new Set(state.channels.map(function (c) { return c.code.toLowerCase(); }));
      var added = lines.map(function (line, index) {
        var parts = line.split(/[,\t]/).map(function (x) { return x.trim(); });
        if (parts.length !== 3 || !parts[0] || parts[0].length > 60 || !/^[A-Za-z0-9_-]{2,32}$/.test(parts[1]) || !/^[A-Za-z0-9_-]{2,60}$/.test(parts[2])) throw new Error('第 ' + (index + 1) + ' 行格式有误，请检查名称、编码和广告链接标识。');
        if (codes.has(parts[1].toLowerCase())) throw new Error('第 ' + (index + 1) + ' 行渠道编码重复：' + parts[1]); codes.add(parts[1].toLowerCase());
        var c = newChannel(); Object.assign(c, {id: 'CH' + Date.now().toString(36).toUpperCase() + index, name: parts[0], code: parts[1], linkName: parts[2], media: v.media, type: v.type, status: ['pwa', 'native', 'channel'].includes(v.type) ? 'disabled' : 'enabled', packageIds: [], tracking: defaultTracking('自然流量')}); c.download = Object.assign(defaultDownload(), {show: false, popup: false, types: []}); if (v.type === 'trial') c.destination = 'trial'; else if (v.type === 'download') c.destination = 'download'; return c;
      });
      added.forEach(function (channel) { var error = checkDownload(channel, state.packages); if (error) throw new Error(channel.name + '：' + error); });
      var next = clone(state); next.channels = added.concat(next.channels); saveState(next); close(); filters = {}; document.getElementById('cm-channel-filter').reset(); renderChannels(); toast('已创建 ' + added.length + ' 个渠道');
    }});
  }
  function batchDownload() {
    if (!selected.size) return toast('请先选择渠道。');
    var ids = Array.from(selected);
    dialog({title: '批量下载策略 · ' + ids.length + ' 个渠道', width: 'wide', html: '<p class="cm-note">仅修改选中渠道的下载策略。每个渠道须已关联对应的已发布包；全部校验通过才会保存。</p>' + downloadForm(defaultDownload()), onSubmit: function (form, close) {
      var dl = parseDownload(form); if (!validateThresholds(dl)) throw new Error('提醒条件需为有效的非负整数。');
      var next = clone(state); next.channels.forEach(function (c) { if (ids.includes(c.id)) { c.download = clone(dl); var error = checkDownload(c, next.packages); if (error) throw new Error(c.name + '：' + error); } }); saveState(next); close(); selected.clear(); renderChannels(); toast('下载策略已批量保存');
    }});
  }
  function exportChannels() { var rows = [['渠道ID', '渠道名称', '编码', '媒体', '推广类型', '币种', '语言', '广告链接', '关联包', '下载入口', '状态', '创建日期', '推广链接']]; filteredChannels().forEach(function (c) { rows.push([c.id, c.name, c.code, c.media, TYPE_NAMES[c.type], c.currency, c.language, c.linkName, c.packageIds.join('|'), c.download.show ? '展示' : '隐藏', c.status === 'enabled' ? '启用' : '停用', c.createdAt, promotionUrl(c)]); }); csvDownload('渠道列表.csv', rows); }
  function help() {
    dialog({title: '渠道管理说明', width: 'wide', readonly: true, html: '<div class="cm-form-section"><h3>管理流程</h3><p>先在包管理保存版本草稿并发布，再创建渠道、配置推广入口、下载方式和埋点，关联对应已发布包。列表支持筛选、批量配置及查看分类转化、资金、留存和 ROI。</p><p>独立渠道包需先在包信息中选定专属渠道，再能绑定到该渠道；同一下载类型和平台只允许一个生效包。多包并用时按平台与展示类型拆分。</p><h3>数据与使用边界</h3><p>报表按事件当时的渠道、广告、包及版本归因。配置保存在本机浏览器，报表为固定演示数据；包文件仅记录本地文件名和大小，下载链接需另填。域名、短链接为示例，不执行真实文件上传、打包、短链解析或事件回传。</p></div>'});
  }
  function go(view, context) {
    if (!['channels', 'packages', 'promotion', 'retention', 'conversion', 'updates', 'roi'].includes(view)) view = 'channels';
    currentView = view;
    document.querySelectorAll('[data-cm-view]').forEach(function (b) { var active = b.dataset.cmView === view; b.classList.toggle('is-active', active); b.setAttribute('aria-selected', String(active)); b.tabIndex = active ? 0 : -1; });
    document.getElementById('cm-channels').hidden = view !== 'channels'; document.getElementById('cm-packages').hidden = view !== 'packages'; document.getElementById('cm-reports').hidden = view === 'channels' || view === 'packages';
    if (view === 'channels') { if (context && context.channelId) { filters = {keyword: context.channelId}; silentFilterReset = true; document.getElementById('cm-channel-filter').reset(); silentFilterReset = false; document.querySelector('#cm-channel-filter [name=keyword]').value = context.channelId; page = 1; selected.clear(); } renderChannels(); }
    else if (view === 'packages') window.CMPackages.render(context || {});
    else window.CMReports.render(view, context || {});
    try { var url = new URL(window.location.href); url.search = ''; url.searchParams.set('view', view); if (context && context.channelId) url.searchParams.set('channel', context.channelId); if (context && context.packageId) url.searchParams.set('package', context.packageId); history.replaceState(null, '', url.href); } catch (error) { /* File previews may disallow history changes. */ }
  }
  function onAction(action, id) {
    var c = id ? channelById(id) : null;
    if (action === 'add') editor();
    else if (action === 'edit') editor(id);
    else if (action === 'detail') channelDetail(id);
    else if (action === 'bind') window.CMPackages.openBind(id);
    else if (action === 'copy-link' && c) copy(c.restrictions.masked ? 'https://' + c.domain + '/s/' + encodeURIComponent(c.id) : promotionUrl(c));
    else if (action === 'report') go('promotion', {channelId: id});
    else if (action === 'toggle' && c) confirmStatus([id], c.status !== 'enabled');
    else if (action === 'global') globalConfig();
    else if (action === 'batch-add') batchAdd();
    else if (action === 'batch-download') batchDownload();
    else if (action === 'batch-enable' || action === 'batch-disable') confirmStatus(Array.from(selected), action === 'batch-enable');
    else if (action === 'clear-selection') { selected.clear(); renderChannels(); }
    else if (action === 'export') exportChannels();
    else if (action === 'refresh') { renderChannels(); toast('已刷新渠道列表'); }
    else if (action === 'help') help();
    else if (action === 'prev' || action === 'next') { page += action === 'prev' ? -1 : 1; renderChannels(); }
    else if (action === 'advanced') { var area = document.getElementById('cm-advanced'); area.hidden = !area.hidden; var b = document.querySelector('[data-cm-action=advanced]'); b.textContent = area.hidden ? '更多筛选 ▾' : '收起筛选 ▴'; b.setAttribute('aria-expanded', String(!area.hidden)); }
  }
  function init() {
    var app = document.getElementById('cm-app'); if (!app) return;
    state = loadState();
    window.CM = {getState: function () { return clone(state); }, saveState: saveState, escape: esc, toast: toast, dialog: dialog, download: csvDownload, copy: copy, go: go, channelReport: function (channel) { return '渠道报表明细.html?channel=' + encodeURIComponent(channel.code) + '&media=' + encodeURIComponent(channel.media) + '&link=' + encodeURIComponent(channel.linkName); }};
    window.CMPackages.init(); window.CMReports.init();
    app.addEventListener('click', function (event) { var b = event.target.closest('[data-cm-view],[data-cm-action]'); if (!b || b.disabled) return; if (b.dataset.cmView) go(b.dataset.cmView); else onAction(b.dataset.cmAction, b.dataset.id); });
    app.addEventListener('change', function (event) {
      var t = event.target;
      if (t.matches('[data-cm-select]')) { if (t.checked) selected.add(t.dataset.cmSelect); else selected.delete(t.dataset.cmSelect); renderChannels(); }
      else if (t.id === 'cm-select-all') { filteredChannels().slice((page - 1) * pageSize, page * pageSize).forEach(function (c) { if (t.checked) selected.add(c.id); else selected.delete(c.id); }); renderChannels(); }
      else if (t.id === 'cm-page-size') { pageSize = Number(t.value); page = 1; renderChannels(); }
    });
    var form = document.getElementById('cm-channel-filter');
    form.addEventListener('submit', function (event) { event.preventDefault(); var next = queryValues(form); if (next.start && next.end && next.start > next.end) return toast('开始日期不能晚于结束日期。'); filters = next; page = 1; selected.clear(); renderChannels(); });
    form.addEventListener('reset', function () { if (silentFilterReset) return; window.setTimeout(function () { filters = {}; page = 1; selected.clear(); renderChannels(); }, 0); });
    document.getElementById('cm-modal').addEventListener('click', function (event) { if (event.target.closest('[data-cm-close]')) closeModal(); });
    document.addEventListener('keydown', function (event) {
      var layer = document.getElementById('cm-modal');
      if (!layer.hidden && event.key === 'Escape') { closeModal(); return; }
      if (!layer.hidden && event.key === 'Tab') { var nodes = Array.from(layer.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]')).filter(function (n) { return n.offsetParent !== null; }); var first = nodes[0], last = nodes[nodes.length - 1]; if (!layer.contains(document.activeElement)) { event.preventDefault(); first.focus(); } else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
      if (layer.hidden && event.target.matches('[data-cm-view]') && ['ArrowLeft', 'ArrowRight'].includes(event.key)) { var tabs = Array.from(document.querySelectorAll('[data-cm-view]')); var index = tabs.indexOf(event.target); var target = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; event.preventDefault(); go(target.dataset.cmView); target.focus(); }
    });
    var params = new URLSearchParams(window.location.search);
    go(params.get('view') || 'channels', {channelId: params.get('channel') || '', packageId: params.get('package') || ''});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
