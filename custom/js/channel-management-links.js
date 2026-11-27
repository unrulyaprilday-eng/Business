(function () {
  'use strict';
  var serial = 0;
  var destinations = {lobby: '大厅', register: '注册页', activity: '活动页', trial: '试玩页', download: '下载站', landing: '落地中转页'};
  var downloadTypes = {pwa: 'PWA 快捷 APP', native: '原生 APP', fast: '极速 APP'};
  function api() { return window.CM; }
  function esc(value) { return api().escape(value); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function findChannel(id, state) { return (state || api().getState()).channels.find(function (channel) { return channel.id === id; }); }
  function effective(channel, link) {
    var result = Object.assign({}, channel, link), config = link.config || {};
    result.id = channel.id; result.code = channel.code;
    result.status = channel.status === 'enabled' && link.status !== 'disabled' ? 'enabled' : 'disabled';
    result.packageIds = clone(link.inheritConfig !== false ? channel.packageIds : config.packageIds || []);
    result.download = clone(link.inheritConfig !== false ? channel.download : config.download || channel.download);
    return result;
  }
  function validateChannel(channel, state) {
    var links = channel.links || [], ids = [], names = [];
    for (var i = 0; i < links.length; i++) {
      var link = links[i], name = String(link.linkName || '').toLowerCase();
      if (!link.id || ids.indexOf(link.id) !== -1) return '推广链接 ID 不可重复。';
      if (!name || names.indexOf(name) !== -1) return '同一渠道的推广链接标识不可重复。';
      ids.push(link.id); names.push(name);
      var item = effective(channel, link);
      var reason = window.CMPackages.validateBindings(item, item.packageIds, state);
      if (reason) return '推广链接“' + link.linkName + '”：' + reason;
    }
    return '';
  }
  function url(channel, link) {
    var item = effective(channel, link), paths = {lobby: '/', register: '/register', activity: '/promotions', trial: '/trial', download: '/download', landing: '/landing'};
    var address = 'https://' + item.domain + (paths[item.destination] || '/') + '?channel=' + encodeURIComponent(channel.code) + '&media=' + encodeURIComponent(item.media) + '&link=' + encodeURIComponent(item.linkName) + '&linkId=' + encodeURIComponent(link.id);
    if (item.destination === 'landing') address += '&template=' + encodeURIComponent(item.landingId || item.landing || '');
    return address;
  }
  function input(name, value, extra) { return '<input class="cm-input" name="' + name + '" value="' + esc(value == null ? '' : value) + '" ' + (extra || '') + '>'; }
  function field(label, control, help, wide) { return '<label class="cm-field' + (wide ? ' wide' : '') + '"><span>' + label + '</span>' + control + (help ? '<small class="cm-field-help">' + help + '</small>' : '') + '</label>'; }
  function options(items, value) { return items.map(function (item) { var pair = Array.isArray(item) ? item : [item, item]; return '<option value="' + esc(pair[0]) + '"' + (String(value) === String(pair[0]) ? ' selected' : '') + '>' + esc(pair[1]) + '</option>'; }).join(''); }
  function select(name, items, value) { return '<select class="cm-input" name="' + name + '">' + options(items, value) + '</select>'; }
  function button(action, text, id) { return '<button type="button" class="cm-link" data-link-action="' + action + '" data-link-id="' + esc(id || '') + '">' + text + '</button>'; }
  function idFor(state) {
    var id;
    do { id = 'LK-' + Date.now().toString(36).toUpperCase() + '-' + (++serial); } while (state.channels.some(function (channel) { return (channel.links || []).some(function (link) { return link.id === id; }); }));
    return id;
  }
  function save(next, close, channelId, message) {
    var channel = findChannel(channelId, next), reason = validateChannel(channel, next);
    if (reason) throw new Error(reason);
    var allIds = [];
    next.channels.forEach(function (item) { (item.links || []).forEach(function (link) { if (allIds.indexOf(link.id) !== -1) throw new Error('推广链接 ID 不可重复。'); allIds.push(link.id); }); });
    api().saveState(next); close(); api().go('channels'); api().toast(message); open(channelId);
  }
  function open(channelId) {
    var channel = findChannel(channelId); if (!channel) return api().toast('渠道不存在。');
    var links = channel.links || [];
    api().dialog({title: '推广链接 · ' + channel.name, width: 'wide', readonly: true,
      html: '<p class="cm-note">同一渠道可按媒体与广告素材维护多条链接。链接可继承渠道默认包和下载策略；历史统计保留事件发生时的归因，新链接没有历史数据。</p><div class="cm-toolbar"><strong>推广链接 · ' + links.length + ' 条</strong><button type="button" class="cm-btn primary" data-link-action="create">新增推广链接</button></div><div class="cm-table-wrap"><table class="cm-table"><thead><tr><th>链接标识 / ID</th><th>媒体</th><th>直达 / 落地页</th><th>包与下载策略</th><th>状态</th><th>操作</th></tr></thead><tbody>' + (links.map(function (link) {
        return '<tr><td><strong>' + esc(link.linkName) + '</strong><div class="cm-cell-sub">' + esc(link.id) + (link.legacy ? ' · 历史主链接' : '') + '</div></td><td>' + esc(link.media) + '</td><td>' + esc(destinations[link.destination] || link.destination) + '<div class="cm-cell-sub">' + esc(link.landing || '—') + '</div></td><td>' + (link.inheritConfig !== false ? '继承渠道配置' : '独立配置') + '</td><td><span class="cm-badge ' + (link.status === 'disabled' ? 'gray' : 'green') + '">' + (link.status === 'disabled' ? '停用' : '启用') + '</span></td><td><div class="cm-actions">' + button('edit', '编辑', link.id) + button('copy-url', '复制地址', link.id) + button('duplicate', '复制新增', link.id) + button('toggle', link.status === 'disabled' ? '启用' : '停用', link.id) + button('report', '报表', link.id) + button('delete', '删除', link.id) + '</div></td></tr>';
      }).join('') || '<tr><td colspan="6" class="cm-empty">暂无推广链接，请新增。</td></tr>') + '</tbody></table></div>', onOpen: function (form) {
        form.addEventListener('click', function (event) { var target = event.target.closest('[data-link-action]'); if (target) action(channelId, target.dataset.linkAction, target.dataset.linkId); });
      }});
  }
  function readLandingCatalog() {
    if (!window.CMLanding || !window.CMLanding.list) throw new Error('落地页目录未加载，请刷新后重试。');
    try { return window.CMLanding.list(); }
    catch (error) { throw new Error('落地页目录读取失败，请到落地页管理检查后重试；当前修改尚未保存。'); }
  }
  function landingChoices(link, saved) {
    var list = [], error = '';
    try { list = readLandingCatalog().filter(function (entry) { return entry.status === 'enabled' || saved && entry.id === saved.landingId; }); }
    catch (problem) { error = problem.message; }
    var legacy = saved && !saved.landingId && saved.landing;
    var items = [['', list.length ? '请选择落地页模板' : '暂无可用落地页模板']];
    if (legacy) items.push(['__legacy__', saved.landing + '（历史配置，只读保留）']);
    items = items.concat(list.map(function (entry) { return [entry.id, entry.name]; }));
    return {items: items, value: saved && saved.landingId || (legacy ? '__legacy__' : ''), error: error, help: error ? error + '普通直达链接仍可保存；落地中转页需先恢复目录。' : (!list.length ? '请先到落地页管理创建模板。' : '历史配置可原样保留，更换模板需选择目录中的有效模板。')};
  }
  function landingControl(landing) {
    return '<select class="cm-input" name="landingId"' + (landing.error ? ' disabled' : '') + '>' + options(landing.items, landing.value) + '</select><small class="cm-field-help' + (landing.error ? ' cm-error' : '') + '"' + (landing.error ? ' role="alert"' : '') + '>' + esc(landing.help) + ' <a class="cm-link" href="落地页管理.html" target="_blank" rel="noopener">落地页管理 ↗</a></small>';
  }
  function edit(channelId, linkId, duplicate) {
    var state = api().getState(), channel = findChannel(channelId, state); if (!channel) return;
    var saved = (channel.links || []).find(function (link) { return link.id === linkId; });
    var link = saved ? clone(saved) : {linkName: '', media: channel.media, domain: channel.domain, destination: channel.destination, landing: channel.landing, status: 'enabled', inheritConfig: true, tracking: clone(channel.tracking), createdAt: new Date().toISOString().slice(0, 10)};
    if (duplicate) { var suffix = 2, base = link.linkName.slice(0, 50); do { link.linkName = base + '-copy-' + suffix++; } while (channel.links.some(function (item) { return item.linkName.toLowerCase() === link.linkName.toLowerCase(); })); link.legacy = false; saved = null; }
    var config = effective(channel, link), dl = config.download, tracking = link.tracking || channel.tracking, landing = landingChoices(link, saved);
    var html = '<p class="cm-note">包下载地址与版本在包管理维护。本表单只选择已发布包和下载策略。取消或关闭会丢弃草稿。</p><div class="cm-form-grid">' + field('广告链接标识 *', input('linkName', link.linkName, 'maxlength="60"'), '同一渠道内唯一，2–60 位字母、数字、下划线或短横线') + field('媒体', select('media', ['Facebook', 'TikTok', 'Google', '自然流量'], link.media)) + field('推广域名 *', input('domain', link.domain)) + field('状态', select('status', [['enabled', '启用'], ['disabled', '停用']], link.status)) + field('直达位置', select('destination', Object.keys(destinations).map(function (key) { return [key, destinations[key]]; }), link.destination)) + field('落地页模板', landingControl(landing)) + field('包与下载策略', select('inheritConfig', [['yes', '继承渠道默认配置'], ['no', '独立配置']], link.inheritConfig !== false ? 'yes' : 'no'), '修改渠道默认配置时，继承配置的链接同步使用新值。', true) + '</div><fieldset data-link-config' + (link.inheritConfig !== false ? ' hidden disabled' : '') + '><legend>独立包与下载策略</legend><div class="cm-checkbox-list">' + state.packages.filter(function (pkg) { return pkg.status === 'published' && pkg.versions.some(function (version) { return version.version === pkg.currentVersion && version.status === 'published'; }); }).map(function (pkg) { return '<label class="cm-check"><input type="checkbox" name="packageIds" value="' + esc(pkg.id) + '"' + (config.packageIds.indexOf(pkg.id) !== -1 ? ' checked' : '') + '><span>' + esc(pkg.name + ' · ' + pkg.currentVersion) + '</span></label>'; }).join('') + '</div><div class="cm-form-grid">' + field('下载入口', select('show', [['yes', '展示'], ['no', '隐藏']], dl.show ? 'yes' : 'no')) + field('下载提醒弹窗', select('popup', [['yes', '开启'], ['no', '关闭']], dl.popup ? 'yes' : 'no')) + field('强制下载', select('force', [['none', '不强制下载'], ['remind', '强制提醒，仍可使用网页'], ['app', '下载后仅允许 APP']], dl.force)) + field('展示下载内容', '<span class="cm-option-list">' + Object.keys(downloadTypes).map(function (key) { return '<label class="cm-check"><input type="checkbox" name="types" value="' + key + '"' + (dl.types.indexOf(key) !== -1 ? ' checked' : '') + '><span>' + downloadTypes[key] + '</span></label>'; }).join('') + '</span>') + ['days', 'deposits', 'withdrawals'].map(function (key) { return field({days: '注册天数', deposits: '充值次数', withdrawals: '提现次数'}[key], input(key, dl[key], 'type="number" min="0" max="' + (key === 'days' ? 3650 : 9999) + '"')); }).join('') + field('游戏中提醒', select('inGame', [['no', '关闭'], ['yes', '开启']], dl.inGame ? 'yes' : 'no')) + field('下载奖励', select('reward', [['no', '关闭'], ['yes', '开启']], dl.reward ? 'yes' : 'no')) + '</div></fieldset><div class="cm-form-section"><h3>链接埋点</h3><div class="cm-form-grid">' + field('埋点工具', select('provider', ['无', 'Meta Pixel', 'TikTok Pixel', 'Google Tag', 'Adjust'], tracking.provider)) + field('像素 ID / App Token', input('pixel', tracking.pixel, 'maxlength="100"')) + ['registerEvent', 'firstPayEvent', 'repeatPayEvent'].map(function (key) { return field({registerEvent: '注册事件', firstPayEvent: '首充事件', repeatPayEvent: '复充事件'}[key], input(key, tracking[key], 'maxlength="80"')); }).join('') + '</div></div>';
    api().dialog({title: (saved ? '编辑推广链接' : duplicate ? '复制新增推广链接' : '新增推广链接') + ' · ' + channel.name, width: 'wide', html: html,
      onOpen: function (form) { form.addEventListener('change', function (event) { if (event.target.name !== 'inheritConfig') return; var area = form.querySelector('[data-link-config]'); area.hidden = form.elements.inheritConfig.value !== 'no'; area.disabled = area.hidden; }); },
      onSubmit: function (form, close) {
        var values = {}; new FormData(form).forEach(function (value, key) { values[key] = String(value).trim(); });
        var next = api().getState(), target = findChannel(channelId, next); if (!target) throw new Error('渠道已不存在，请关闭后刷新。');
        if (!/^[A-Za-z0-9_-]{2,60}$/.test(values.linkName || '')) throw new Error('请填写有效的广告链接标识。');
        if ((target.links || []).some(function (entry) { return (!saved || entry.id !== saved.id) && entry.linkName.toLowerCase() === values.linkName.toLowerCase(); })) throw new Error('同一渠道的广告链接标识不可重复。');
        if (!/^(?=.{3,253}$)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/.test(values.domain || '')) throw new Error('请输入有效域名，不含协议或路径。');
        var draft = Object.assign({}, link, {id: saved ? saved.id : idFor(next), legacy: saved ? !!saved.legacy : false, linkName: values.linkName, media: values.media, domain: values.domain, destination: values.destination, status: values.status, inheritConfig: values.inheritConfig !== 'no'});
        if (!destinations[draft.destination] || ['Facebook', 'TikTok', 'Google', '自然流量'].indexOf(draft.media) === -1 || ['enabled', 'disabled'].indexOf(draft.status) === -1) throw new Error('推广链接选项无效，请重新选择。');
        var catalog = [], catalogError = '';
        try { catalog = readLandingCatalog(); } catch (problem) { catalogError = problem.message; }
        if (catalogError && draft.destination === 'landing') throw new Error(catalogError);
        var keepLegacy = saved && !saved.landingId && saved.landing && values.landingId === '__legacy__';
        if (catalogError) {
          // The destination does not use a landing material; preserve saved metadata.
          if (!saved) { delete draft.landingId; draft.landing = ''; }
        } else if (values.landingId && !keepLegacy) {
          var entry = catalog.find(function (item) { return item.id === values.landingId; });
          if (!entry || (entry.status !== 'enabled' && (!saved || entry.id !== saved.landingId))) throw new Error('请选择目录中有效的落地页模板；暂无模板时请先到落地页管理创建。');
          draft.landingId = entry.id; draft.landing = entry.name;
        } else if (keepLegacy) { draft.landing = saved.landing; delete draft.landingId; }
        else {
          if (draft.destination === 'landing') throw new Error('请先到落地页管理创建并选择有效的落地页模板。');
          delete draft.landingId; draft.landing = '';
        }
        draft.tracking = {provider: values.provider, pixel: values.pixel, registerEvent: values.registerEvent, firstPayEvent: values.firstPayEvent, repeatPayEvent: values.repeatPayEvent};
        if (draft.tracking.provider !== '无' && (!values.pixel || !values.registerEvent || !values.firstPayEvent || !values.repeatPayEvent)) throw new Error('选择埋点工具后，请补全像素 ID 和事件标识。');
        if (!draft.inheritConfig) {
          var download = {show: values.show === 'yes', popup: values.popup === 'yes', force: values.force, types: Array.from(form.querySelectorAll('[name=types]:checked')).map(function (item) { return item.value; }), days: Number(values.days), deposits: Number(values.deposits), withdrawals: Number(values.withdrawals), inGame: values.inGame === 'yes', reward: values.reward === 'yes'};
          if (!['days', 'deposits', 'withdrawals'].every(function (key) { return values[key] !== '' && Number.isInteger(download[key]) && download[key] >= 0 && download[key] <= (key === 'days' ? 3650 : 9999); })) throw new Error('下载提醒条件需为有效的非负整数。');
          draft.config = {packageIds: Array.from(form.querySelectorAll('[name=packageIds]:checked')).map(function (item) { return item.value; }), download: download};
        } else delete draft.config;
        if (!draft.inheritConfig && target.status !== 'disabled' && draft.config.packageIds.some(function (id) { var pkg = next.packages.find(function (item) { return item.id === id; }), previous = saved ? effective(target, saved).packageIds : []; return pkg && pkg.type === 'channel' && previous.indexOf(id) === -1; })) throw new Error('绑定新的独立渠道包前，请先停用渠道；保存链接配置后再启用。');
        if (saved && !target.links.some(function (item) { return item.id === saved.id; })) throw new Error('链接已不存在，请关闭后刷新。');
        if (saved) target.links = target.links.map(function (item) { return item.id === saved.id ? draft : item; }); else { target.links = target.links || []; target.links.push(draft); }
        save(next, close, channelId, saved ? '推广链接已保存，历史归因保留原值' : '推广链接已创建，尚无历史数据');
      }});
  }
  function action(channelId, name, linkId) {
    var channel = findChannel(channelId), link = channel && (channel.links || []).find(function (item) { return item.id === linkId; });
    if (!channel) return;
    if (name === 'create') return edit(channelId);
    if (!link) return;
    if (name === 'edit' || name === 'duplicate') return edit(channelId, linkId, name === 'duplicate');
    if (name === 'copy-url') return api().copy(url(channel, link));
    if (name === 'report') {
      var report = {channelId: channelId, link: linkId, media: '', currency: '', packageId: '', version: '', source: '', scene: '', category: 'all', period: 'current', returnView: '', returnUrl: '', entry: ''};
      return api().go('promotion', api().entityReportContext ? api().entityReportContext(report) : report);
    }
    if (name !== 'toggle' && name !== 'delete') return;
    api().dialog({title: name === 'delete' ? '删除推广链接' : link.status === 'disabled' ? '启用推广链接' : '停用推广链接', html: '<p>确认' + (name === 'delete' ? '删除' : link.status === 'disabled' ? '启用' : '停用') + '“' + esc(link.linkName) + '”？</p><p class="cm-note">保留历史报表与消耗记录中的链接归因。停用或删除仅影响后续推广入口。</p>', submitLabel: '确定', onSubmit: function (form, close) {
      var next = api().getState(), target = findChannel(channelId, next), item = target && target.links.find(function (entry) { return entry.id === linkId; });
      if (!item) throw new Error('链接已不存在，请关闭后刷新。');
      if (name === 'delete') target.links = target.links.filter(function (entry) { return entry.id !== linkId; }); else item.status = item.status === 'disabled' ? 'enabled' : 'disabled';
      save(next, close, channelId, '推广链接已更新');
    }});
  }
  function init() {}
  window.CMLinks = {init: init, open: open, effective: effective, validateChannel: validateChannel, url: url};
})();
