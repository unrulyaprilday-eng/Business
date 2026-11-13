(function () {
  'use strict';

  var filters = { keyword: '', type: '', platform: '', status: '', channelId: '' };
  var page = 1;
  var pageSize = 10;
  var initialized = false;
  var types = { native: '原生 APP', pwa: 'PWA 快捷 APP', channel: '渠道包', fast: '极速 APP' };
  var statuses = { published: '已发布', draft: '草稿', disabled: '已停用' };

  function api() { return window.CM; }
  function esc(value) { return api().escape(value == null ? '' : value); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function state() { return api().getState(); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function findPackage(id, source) { return (source || state()).packages.find(function (item) { return item.id === id; }); }
  function findChannel(id, source) { return (source || state()).channels.find(function (item) { return item.id === id; }); }
  function currentVersion(item) { return item.versions.find(function (version) { return version.version === item.currentVersion; }); }
  function packageGroup(item) { return item.type === 'pwa' || item.platform === 'PWA' ? 'pwa' : item.type === 'fast' ? 'fast' : 'native'; }
  function relatedChannels(id, source) { return (source || state()).channels.filter(function (channel) { return (channel.packageIds || []).indexOf(id) !== -1; }); }
  function packageChannelCode(item, source) {
    if (item.type !== 'channel') return '';
    if (item.channelCode) return item.channelCode;
    var codes = relatedChannels(item.id, source).map(function (channel) { return channel.code; }).filter(function (value, index, all) { return value && all.indexOf(value) === index; });
    return codes.length === 1 ? codes[0] : '';
  }
  function nextId(source) {
    var index = 1001;
    while (source.packages.some(function (item) { return item.id === 'PK' + index; })) index += 1;
    return 'PK' + index;
  }
  function option(value, label, selected) { return '<option value="' + esc(value) + '"' + (value === selected ? ' selected' : '') + '>' + esc(label) + '</option>'; }
  function typeOptions(selected, all) {
    return (all ? option('', '全部类型', selected) : '') + Object.keys(types).map(function (key) { return option(key, types[key], selected); }).join('');
  }
  function platformOptions(selected, all) {
    return (all ? option('', '全部平台', selected) : '') + ['Android', 'iOS', 'PWA'].map(function (value) { return option(value, value, selected); }).join('');
  }
  function statusOptions(selected) {
    return option('', '全部状态', selected) + Object.keys(statuses).map(function (key) { return option(key, statuses[key], selected); }).join('');
  }
  function badge(status) { return '<span class="cm-badge ' + (status === 'published' ? 'green' : status === 'draft' ? 'orange' : 'gray') + '">' + esc(statuses[status] || status) + '</span>'; }
  function button(action, label, id, extra) {
    return '<button type="button" class="cm-link" data-pkg-action="' + action + '" data-pkg-id="' + esc(id) + '"' + (extra || '') + '>' + esc(label) + '</button>';
  }
  function field(label, input) { return '<label class="cm-field"><span>' + label + '</span>' + input + '</label>'; }
  function input(name, value, attributes) { return '<input class="cm-input" name="' + name + '" value="' + esc(value) + '"' + (attributes || '') + '>'; }
  function error(form, message) {
    var node = form.querySelector('[data-pkg-error]');
    if (node) { node.textContent = message; node.hidden = false; }
    return false;
  }
  function errorHtml() { return '<p class="cm-error" data-pkg-error role="alert" hidden></p>'; }
  function save(next, form, close, message) {
    try { api().saveState(next); }
    catch (failure) { return error(form, '保存失败，当前填写内容已保留。请检查浏览器存储空间后重试。'); }
    close();
    render();
    api().toast(message || '已保存');
    return true;
  }
  function validateBindings(channel, ids, source) {
    source = source || state();
    var download = channel.download || {};
    var requested = download.types || [];
    var groups = [];
    var slots = [];
    var hasChannelPackage = false;
    var needsPackages = download.show || download.popup || (download.force && download.force !== 'none');
    if (!download.show && (download.popup || (download.force && download.force !== 'none'))) return '隐藏下载入口时，请先到渠道配置关闭下载弹窗并选择“不强制下载”，再保存包绑定。';
    if (download.force && download.force !== 'none' && !download.popup) return '强制提醒或强制下载需要开启下载弹窗，请先调整渠道下载配置。';
    if (download.force === 'app' && requested.indexOf('native') === -1 && requested.indexOf('fast') === -1) return '仅允许 APP 使用时，展示下载内容必须包含原生 APP 或极速 APP。';
    if (needsPackages && !requested.length) return '请先到渠道下载配置选择至少一种下载内容，再绑定对应的已发布包。';
    for (var i = 0; i < ids.length; i += 1) {
      var item = findPackage(ids[i], source);
      var version = item && currentVersion(item);
      if (!item || item.status !== 'published' || !version || version.status !== 'published') return '只能绑定有当前已发布版本的包。';
      var group = packageGroup(item);
      var slot = group + '|' + item.platform;
      if (slots.indexOf(slot) !== -1) return '同一下载类型和平台只能关联一个生效包，请取消重复选择：' + ({ pwa: 'PWA 快捷 APP', native: '原生 APP', fast: '极速 APP' }[group] || group) + ' / ' + item.platform + '。';
      slots.push(slot);
      if (item.type === 'channel') {
        var channelCode = packageChannelCode(item, source);
        if (!channelCode) return '独立渠道包“' + item.name + '”缺少专属渠道码，请先到包管理编辑补充。';
        if (String(channelCode).toLowerCase() !== String(channel.code).toLowerCase()) return '独立渠道包“' + item.name + '”仅可绑定专属渠道 ' + channelCode + '。';
        hasChannelPackage = true;
      }
      if (groups.indexOf(group) === -1) groups.push(group);
    }
    if (channel.status === 'enabled') {
      if (channel.type === 'pwa' && groups.indexOf('pwa') === -1) return '启用 PWA 推广渠道前，请先绑定有当前已发布版本的 PWA 快捷 APP 包。';
      if (channel.type === 'native' && groups.indexOf('native') === -1) return '启用原生 APP 推广渠道前，请先绑定有当前已发布版本的原生 APP / 渠道包。';
      if (channel.type === 'channel' && !hasChannelPackage) return '启用独立渠道包推广渠道前，请先绑定专属渠道码匹配的已发布渠道包。';
    }
    if (!ids.length) return !needsPackages ? '' : '请先关闭渠道下载入口、下载弹窗并将强制下载设为“不强制”，再取消全部绑定。';
    if (needsPackages) {
      for (var j = 0; j < requested.length; j += 1) {
        if (groups.indexOf(requested[j]) === -1) return '还需绑定' + ({ pwa: ' PWA 快捷 APP ', native: '原生 APP / 渠道包', fast: '极速 APP' }[requested[j]] || requested[j]) + '，以覆盖渠道已展示的下载类型。';
      }
    }
    if (download.force === 'app' && groups.indexOf('native') === -1 && groups.indexOf('fast') === -1) return '强制 APP 下载需要至少绑定一个原生 APP / 渠道包或极速 APP。';
    return '';
  }

  function render(context) {
    var container = document.getElementById('cm-packages');
    if (!container || !api()) return;
    if (context && Object.prototype.hasOwnProperty.call(context, 'channelId')) {
      filters = { keyword: '', type: '', platform: '', status: '', channelId: context.channelId || '' };
      page = 1;
    }
    var source = state();
    var channel = findChannel(filters.channelId, source);
    var keyword = filters.keyword.toLowerCase();
    var results = source.packages.filter(function (item) {
      return (!keyword || (item.name + ' ' + item.id).toLowerCase().indexOf(keyword) !== -1) &&
        (!filters.type || item.type === filters.type) && (!filters.platform || item.platform === filters.platform) &&
        (!filters.status || item.status === filters.status) && (!channel || (channel.packageIds || []).indexOf(item.id) !== -1);
    });
    var pages = Math.max(1, Math.ceil(results.length / pageSize));
    page = Math.min(page, pages);
    var rows = results.slice((page - 1) * pageSize, page * pageSize).map(function (item) {
      var version = currentVersion(item);
      var channels = relatedChannels(item.id, source);
      var links = channels.map(function (entry) { return '<span class="cm-nowrap">' + esc(entry.name) + ' <span class="cm-muted">(' + esc(entry.code) + ')</span></span>'; }).join('<br>');
      var actions = button('edit', '编辑', item.id) + button('new-version', '新建版本', item.id) + button('versions', item.status === 'draft' ? '版本与发布' : '版本记录', item.id) + button('conversion', '查看转化', item.id);
      if (item.status === 'published') actions += button('disable', '停用', item.id);
      if (item.status === 'disabled') actions += button('restore', '恢复', item.id);
      var code = item.type === 'channel' ? packageChannelCode(item, source) : '';
      return '<tr><td><strong>' + esc(item.name) + '</strong><br><span class="cm-muted">' + esc(item.id) + '</span>' + (item.type === 'channel' ? '<br><span class="' + (code ? 'cm-muted' : 'cm-error') + '">专属渠道码：' + esc(code || '待补充，请先编辑') + '</span>' : '') + '</td><td>' + esc(types[item.type] || item.type) + '</td><td>' + esc(item.platform) + '</td><td>' + (version ? esc(version.version) + '<br><span class="cm-muted">Build ' + esc(version.build || '—') + '</span>' : '<span class="cm-muted">尚未发布</span>') + '</td><td>' + badge(item.status) + '</td><td>' + (links || '<span class="cm-muted">未关联</span>') + '</td><td class="cm-nowrap">' + esc(item.updatedAt || '—') + '</td><td>' + (version && item.status === 'published' ? button('copy', '复制下载地址', item.id) : '<span class="cm-muted">发布后可复制</span>') + '</td><td class="cm-sticky-action"><div class="cm-actions">' + actions + '</div></td></tr>';
    }).join('');
    container.innerHTML = '<form class="cm-filter" data-pkg-filter>' + field('包名 / 包 ID', input('keyword', filters.keyword, ' placeholder="请输入包名或 ID" maxlength="80"')) + field('包类型', '<select class="cm-input" name="type">' + typeOptions(filters.type, true) + '</select>') + field('平台', '<select class="cm-input" name="platform">' + platformOptions(filters.platform, true) + '</select>') + field('状态', '<select class="cm-input" name="status">' + statusOptions(filters.status) + '</select>') + '<div class="cm-actions"><button class="cm-btn primary" type="submit">查询</button><button class="cm-btn" type="button" data-pkg-action="reset">重置</button></div></form>' +
      (channel ? '<p class="cm-note">当前查看渠道：' + esc(channel.name) + '（' + esc(channel.code) + '） ' + button('clear-channel', '查看全部包', '') + button('bind-context', '调整绑定', channel.id) + '</p>' : '') +
      '<div class="cm-toolbar"><strong>包列表 <span class="cm-muted">共 ' + results.length + ' 个</span></strong><button class="cm-btn primary" type="button" data-pkg-action="create">新增包</button></div>' +
      '<div class="cm-table-wrap"><table class="cm-table"><thead><tr><th>包名称 / ID</th><th>包类型</th><th>平台</th><th>当前版本</th><th>状态</th><th>关联渠道</th><th>更新时间</th><th>下载地址</th><th class="cm-sticky-action">操作</th></tr></thead><tbody>' + (rows || '<tr><td colspan="9" class="cm-empty">暂无符合条件的包，请调整查询条件或新增包。</td></tr>') + '</tbody></table></div>' +
      '<div class="cm-pagination"><span>共 ' + results.length + ' 条，第 ' + page + ' / ' + pages + ' 页</span><button type="button" class="cm-btn small" data-pkg-action="previous"' + (page <= 1 ? ' disabled' : '') + '>上一页</button><button type="button" class="cm-btn small" data-pkg-action="next"' + (page >= pages ? ' disabled' : '') + '>下一页</button></div>';
  }

  function versionFields(version) {
    return '<div class="cm-form-grid">' + field('版本号 <span class="cm-error">*</span>', input('version', version.version || '', ' required maxlength="40" placeholder="例如 2.5.0"')) +
      field('Build 编号 <span data-pkg-build-required class="cm-error">*</span>', input('build', version.build || '', ' inputmode="numeric" maxlength="20" placeholder="仅数字"')) +
      '</div>' + field('<span data-pkg-url-label>下载地址</span> <span class="cm-error">*</span>', input('url', version.url || '', ' required type="url" maxlength="2000" placeholder="https://"')) +
      '<div data-pkg-file-area>' + field('选择本地包文件（可选）', '<input class="cm-input" name="packageFile" type="file" accept=".apk,.aab">') +
      '<p class="cm-muted" data-pkg-file-tip>仅记录文件名和大小作为演示；文件不会上传，下载地址仍需填写。</p>' +
      '<div class="cm-form-grid">' + field('文件名', input('fileName', version.fileName || '', ' readonly placeholder="未选择文件"')) + field('文件大小', input('fileSize', version.size || '', ' readonly placeholder="未选择文件"')) + '</div><button class="cm-link" type="button" data-pkg-clear-file>清除本地文件信息</button></div>';
  }
  function syncPlatform(form, changed) {
    var type = form.elements.type;
    var platform = form.elements.platform;
    if (type && platform && !platform.disabled) {
      if (type.value === 'pwa') platform.value = 'PWA';
      else if (platform.value === 'PWA') platform.value = 'Android';
      Array.prototype.forEach.call(platform.options, function (entry) { entry.disabled = type.value === 'pwa' ? entry.value !== 'PWA' : entry.value === 'PWA'; });
    }
    var value = platform ? platform.value : form.dataset.pkgPlatform;
    var isPwa = value === 'PWA';
    var fileArea = form.querySelector('[data-pkg-file-area]');
    var required = form.querySelector('[data-pkg-build-required]');
    var urlLabel = form.querySelector('[data-pkg-url-label]');
    if (fileArea) fileArea.hidden = isPwa;
    if (required) required.hidden = isPwa;
    if (urlLabel) urlLabel.textContent = isPwa ? 'PWA 入口地址' : '下载地址';
    if (form.elements.build) form.elements.build.required = !isPwa;
    var fileInput = form.elements.packageFile;
    if (fileInput) fileInput.accept = value === 'iOS' ? '.ipa' : '.apk,.aab';
    if (changed && fileInput) {
      fileInput.value = '';
      form.elements.fileName.value = '';
      form.elements.fileSize.value = '';
      form.dataset.pkgFileBytes = '';
    }
  }
  function syncChannelCode(form) {
    var group = form.querySelector('[data-pkg-channel-code]');
    var enabled = form.elements.type && form.elements.type.value === 'channel';
    if (group) group.hidden = !enabled;
    if (form.elements.channelCode) form.elements.channelCode.required = enabled;
  }
  function setupVersionForm(form, platform, fileBytes) {
    form.dataset.pkgPlatform = platform;
    form.dataset.pkgFileBytes = String(fileBytes || '');
    syncPlatform(form, false);
    form.addEventListener('click', function (event) {
      if (!event.target.closest('[data-pkg-clear-file]')) return;
      form.elements.packageFile.value = '';
      form.elements.fileName.value = '';
      form.elements.fileSize.value = '';
      form.dataset.pkgFileBytes = '';
    });
    form.addEventListener('change', function (event) {
      if (event.target.name === 'type' || event.target.name === 'platform') syncPlatform(form, true);
      if (event.target.name === 'type') syncChannelCode(form);
      if (event.target.name === 'packageFile') {
        var file = event.target.files && event.target.files[0];
        var currentPlatform = form.elements.platform ? form.elements.platform.value : form.dataset.pkgPlatform;
        if (!file) { form.elements.fileName.value = ''; form.elements.fileSize.value = ''; form.dataset.pkgFileBytes = ''; return; }
        var allowed = currentPlatform === 'iOS' ? /\.ipa$/i : /\.(apk|aab)$/i;
        if (!allowed.test(file.name)) {
          event.target.value = '';
          form.elements.fileName.value = '';
          form.elements.fileSize.value = '';
          form.dataset.pkgFileBytes = '';
          error(form, currentPlatform === 'iOS' ? 'iOS 仅支持 .ipa 文件。' : 'Android 仅支持 .apk 或 .aab 文件。');
          return;
        }
        form.elements.fileName.value = file.name;
        form.elements.fileSize.value = file.size < 1048576 ? (file.size / 1024).toFixed(1) + ' KB' : (file.size / 1048576).toFixed(2) + ' MB';
        form.dataset.pkgFileBytes = String(file.size);
        var errorNode = form.querySelector('[data-pkg-error]');
        if (errorNode) errorNode.hidden = true;
      }
    });
  }
  function readVersion(form, item, excludedVersion) {
    var value = form.elements.version.value.trim();
    var build = form.elements.build.value.trim();
    var url = form.elements.url.value.trim();
    var platform = form.elements.platform ? form.elements.platform.value : item.platform;
    if (!value) return { error: '请填写版本号。' };
    if (/\s/.test(value)) return { error: '版本号不能包含空格或换行。' };
    if (item.versions.some(function (version) { return version !== excludedVersion && version.version.toLowerCase() === value.toLowerCase(); })) return { error: '版本号已存在，请使用新的版本号；历史版本会保留。' };
    if (platform !== 'PWA' && !build) return { error: '请填写 Build 编号。' };
    if (build && !/^\d+$/.test(build)) return { error: 'Build 编号只能包含数字。' };
    try { var parsed = new URL(url); if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return { error: '地址必须使用 http:// 或 https://。' }; }
    catch (failure) { return { error: '请填写有效的 http:// 或 https:// 地址。' }; }
    var fileName = platform === 'PWA' ? '' : form.elements.fileName.value;
    if (fileName && !(platform === 'iOS' ? /\.ipa$/i : /\.(apk|aab)$/i).test(fileName)) return { error: '包文件扩展名与所选平台不匹配，请重新选择文件。' };
    return { value: { version: value, build: build, url: url, fileName: fileName, size: platform === 'PWA' ? '' : form.elements.fileSize.value, fileBytes: Number(form.dataset.pkgFileBytes || 0), status: 'draft', publishedAt: '', createdAt: today() } };
  }
  function editPackage(id) {
    var item = id ? findPackage(id) : null;
    if (id && !item) return;
    var isNew = !item;
    var type = item ? item.type : 'native';
    var platform = item ? item.platform : 'Android';
    var code = item ? packageChannelCode(item) : '';
    var codeControl = item && code ? input('channelCode', code, ' readonly') : '<select class="cm-input" name="channelCode">' + option('', '请选择专属渠道', '') + state().channels.map(function (channel) { return option(channel.code, channel.name + '（' + channel.code + '）', code); }).join('') + '</select>';
    api().dialog({
      title: isNew ? '新增包' : '编辑包基本信息', width: isNew ? 'wide' : 'normal', submitLabel: isNew ? '保存草稿' : '保存',
      html: errorHtml() + '<div class="cm-form-grid">' + field('包名称 <span class="cm-error">*</span>', input('name', item ? item.name : '', ' required maxlength="60" placeholder="请输入包名称"')) +
        field('包类型', '<select class="cm-input" name="type"' + (isNew ? '' : ' disabled') + '>' + typeOptions(type, false) + '</select>') + field('平台', '<select class="cm-input" name="platform"' + (isNew ? '' : ' disabled') + '>' + platformOptions(platform, false) + '</select>') + '</div><div data-pkg-channel-code' + (type === 'channel' ? '' : ' hidden') + '>' + field('专属渠道码 <span class="cm-error">*</span>', codeControl) + '<p class="cm-muted">独立渠道包只可绑定此渠道。专属码保存后固定，不通过修改包名称改变归属。</p></div>' +
        (isNew ? '<div class="cm-form-section"><strong>首个版本</strong><p class="cm-muted">保存为草稿后，在版本记录中确认发布才会生效。</p>' + versionFields({}) + '</div>' : '<p class="cm-note">包类型和平台用于关联渠道及历史版本，创建后固定。如需更换，请新增包后调整渠道绑定。</p>'),
      onOpen: function (form) { syncChannelCode(form); if (isNew) setupVersionForm(form, platform); },
      onSubmit: function (form, close) {
        var name = form.elements.name.value.trim();
        if (!name) return error(form, '请填写包名称。');
        var next = clone(state());
        var chosenType = isNew ? form.elements.type.value : item.type;
        var chosenCode = chosenType === 'channel' ? (code || form.elements.channelCode.value.trim()) : '';
        if (chosenType === 'channel') {
          if (!chosenCode || !next.channels.some(function (channel) { return channel.code.toLowerCase() === chosenCode.toLowerCase(); })) return error(form, '请选择已存在渠道的专属渠道码。');
          var references = item ? relatedChannels(item.id, next) : [];
          if (references.some(function (channel) { return channel.code.toLowerCase() !== chosenCode.toLowerCase(); })) return error(form, '现有绑定包含其他渠道，请先到渠道列表解除不匹配的绑定，再补充专属渠道码。');
        }
        if (isNew) {
          var nextType = form.elements.type.value;
          var nextPlatform = form.elements.platform.value;
          if ((nextType === 'pwa') !== (nextPlatform === 'PWA')) return error(form, 'PWA 类型必须选择 PWA 平台，其他包类型请选择 Android 或 iOS。');
          var read = readVersion(form, { platform: nextPlatform, versions: [] });
          if (read.error) return error(form, read.error);
          next.packages.push({ id: nextId(next), name: name, type: nextType, platform: nextPlatform, channelCode: chosenCode, status: 'draft', versions: [read.value], currentVersion: '', updatedAt: today() });
        } else {
          var target = findPackage(id, next);
          if (!target) return error(form, '该包已不存在，请关闭后刷新。');
          target.name = name;
          if (target.type === 'channel') target.channelCode = chosenCode;
          target.updatedAt = today();
        }
        return save(next, form, close, isNew ? '包已保存为草稿，请在版本记录中发布。' : '基本信息已保存');
      }
    });
  }
  function newVersion(id) {
    var item = findPackage(id);
    if (!item) return;
    api().dialog({
      title: '新建版本 · ' + item.name, width: 'wide', submitLabel: '保存草稿',
      html: errorHtml() + '<p class="cm-note">' + esc(types[item.type]) + ' / ' + esc(item.platform) + '；保存草稿不会替换当前版本。发布后，关联渠道将使用新的当前版本。</p>' + versionFields({}),
      onOpen: function (form) { setupVersionForm(form, item.platform); },
      onSubmit: function (form, close) {
        var next = clone(state());
        var target = findPackage(id, next);
        if (!target) return error(form, '该包已不存在，请关闭后刷新。');
        var read = readVersion(form, target);
        if (read.error) return error(form, read.error);
        target.versions.push(read.value);
        target.updatedAt = today();
        return save(next, form, close, '新版本已保存为草稿，当前版本保持不变。');
      }
    });
  }
  function versionHistory(id) {
    var item = findPackage(id);
    if (!item) return;
    var sorted = item.versions.map(function (version, index) { return { version: version, index: index }; }).sort(function (a, b) {
      var dateOrder = String(b.version.createdAt || '').localeCompare(String(a.version.createdAt || ''));
      return dateOrder || b.index - a.index;
    });
    var html = sorted.map(function (entry) {
      var version = entry.version;
      var active = version.version === item.currentVersion;
      return '<tr><td>' + esc(version.version) + (active ? ' <span class="cm-badge blue">当前</span>' : '') + '</td><td>' + esc(version.build || '—') + '</td><td>' + badge(version.status) + '</td><td>' + esc(version.fileName || (item.platform === 'PWA' ? 'PWA 入口' : '未选择本地文件')) + '<br><span class="cm-muted">' + esc(version.size || '') + '</span></td><td><input class="cm-input" readonly aria-label="版本下载地址" value="' + esc(version.url) + '"></td><td>' + esc(version.createdAt || '—') + '</td><td>' + esc(version.publishedAt || '—') + '</td><td><div class="cm-actions">' + button('copy-version', '复制地址', id, ' data-pkg-version="' + esc(version.version) + '"') + (version.status === 'draft' && !active ? button('edit-draft', '编辑草稿', id, ' data-pkg-version="' + esc(version.version) + '"') : '') + (!active || item.status !== 'published' ? button('publish-version', version.status === 'draft' ? '发布' : '设为当前', id, ' data-pkg-version="' + esc(version.version) + '"') : '<span class="cm-muted">使用中</span>') + '</div></td></tr>';
    }).join('');
    api().dialog({
      title: '版本记录 · ' + item.name, width: 'wide', readonly: true,
      html: '<p class="cm-note">历史版本永久保留。只有明确发布后才会切换当前版本；关联渠道跟随包的当前版本。</p><div class="cm-table-wrap"><table class="cm-table"><thead><tr><th>版本</th><th>Build</th><th>状态</th><th>文件信息</th><th>下载 / 入口地址</th><th>创建日期</th><th>发布日期</th><th>操作</th></tr></thead><tbody>' + (html || '<tr><td colspan="8" class="cm-empty">暂无版本</td></tr>') + '</tbody></table></div>',
      onOpen: function (form) {
        form.addEventListener('click', function (event) {
          var target = event.target.closest('[data-pkg-action]');
          if (!target) return;
          if (target.dataset.pkgAction === 'copy-version') copyVersion(id, target.dataset.pkgVersion);
          if (target.dataset.pkgAction === 'edit-draft') editDraft(id, target.dataset.pkgVersion);
          if (target.dataset.pkgAction === 'publish-version') publishVersion(id, target.dataset.pkgVersion);
        });
      },
      onSubmit: function (form, close) { close(); return true; }
    });
  }
  function editDraft(id, number) {
    var item = findPackage(id);
    var version = item && item.versions.find(function (entry) { return entry.version === number; });
    if (!version || version.status !== 'draft' || item.currentVersion === number) { api().toast('仅可编辑未发布的版本草稿，已发布版本请新建版本。'); return; }
    api().dialog({
      title: '编辑版本草稿 · ' + item.name, width: 'wide', submitLabel: '保存草稿',
      html: errorHtml() + '<p class="cm-note">仅修改此未发布草稿，当前版本和已发布历史保持不变。取消或关闭会丢弃本次修改。</p>' + versionFields(version),
      onOpen: function (form) { setupVersionForm(form, item.platform, version.fileBytes); },
      onSubmit: function (form, close) {
        var next = clone(state());
        var target = findPackage(id, next);
        var chosen = target && target.versions.find(function (entry) { return entry.version === number; });
        if (!chosen || chosen.status !== 'draft' || target.currentVersion === number) return error(form, '该版本已发布或不存在，不能继续编辑。请关闭后重新查看版本记录。');
        var read = readVersion(form, target, chosen);
        if (read.error) return error(form, read.error);
        read.value.createdAt = chosen.createdAt || today();
        target.versions[target.versions.indexOf(chosen)] = read.value;
        target.updatedAt = today();
        return save(next, form, close, '版本草稿已更新，当前版本保持不变。');
      }
    });
  }
  function publishVersion(id, number) {
    var item = findPackage(id);
    var version = item && item.versions.find(function (entry) { return entry.version === number; });
    if (!version) return;
    var channels = relatedChannels(id);
    api().dialog({
      title: '确认发布版本', width: 'normal', submitLabel: '确认发布',
      html: errorHtml() + '<p>将“' + esc(item.name) + '”的 <strong>' + esc(number) + '</strong> 设为当前版本。</p><p class="cm-note">' + (channels.length ? '以下 ' + channels.length + ' 个关联渠道将同步使用此版本：' + channels.map(function (entry) { return esc(entry.name); }).join('、') : '当前没有关联渠道，发布后可在渠道中绑定。') + '</p>' + (item.status === 'disabled' ? '<p class="cm-note">此包目前已停用，发布将同时恢复包。</p>' : ''),
      onSubmit: function (form, close) {
        var next = clone(state());
        var target = findPackage(id, next);
        var chosen = target && target.versions.find(function (entry) { return entry.version === number; });
        if (!chosen) return error(form, '版本已不存在，请关闭后重新查看。');
        try { var parsed = new URL(chosen.url); if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return error(form, '版本地址必须使用 http:// 或 https://。'); }
        catch (failure) { return error(form, '版本下载地址无效，请新建正确版本。'); }
        chosen.status = 'published';
        chosen.publishedAt = chosen.publishedAt || today();
        target.currentVersion = chosen.version;
        target.status = 'published';
        target.updatedAt = today();
        return save(next, form, close, '版本已发布，当前版本已更新。');
      }
    });
  }
  function disablePackage(id) {
    var item = findPackage(id);
    if (!item) return;
    var source = state();
    var channels = relatedChannels(id, source);
    var candidates = source.packages.filter(function (entry) {
      if (entry.id === id || entry.status !== 'published') return false;
      if (entry.platform !== item.platform || packageGroup(entry) !== packageGroup(item)) return false;
      return channels.every(function (channel) {
        var replacement = (channel.packageIds || []).map(function (value) { return value === id ? entry.id : value; });
        return !validateBindings(channel, replacement, source);
      });
    });
    api().dialog({
      title: '停用包 · ' + item.name, width: 'normal', submitLabel: channels.length ? '替换绑定并停用' : '确认停用',
      html: errorHtml() + '<p>停用后不可再绑定此包，版本历史仍会保留。</p>' + (channels.length ? '<p class="cm-note">此包被 ' + channels.length + ' 个渠道使用：' + channels.map(function (entry) { return esc(entry.name); }).join('、') + '。需先选择替代包，确认后同步替换关联渠道的绑定。</p>' + field('替代包 <span class="cm-error">*</span>', '<select class="cm-input" name="replacement" required>' + option('', '请选择匹配渠道配置的已发布包', '') + candidates.map(function (entry) { return option(entry.id, entry.name + ' / ' + entry.platform + ' / ' + types[entry.type], ''); }).join('') + '</select>') + (!candidates.length ? '<p class="cm-error">暂无满足全部关联渠道下载类型的替代包。请先新建并发布匹配的包，或到渠道列表逐个调整绑定后再停用。</p>' : '') : ''),
      onSubmit: function (form, close) {
        var next = clone(state());
        var target = findPackage(id, next);
        if (!target) return error(form, '该包已不存在，请关闭后刷新。');
        var references = relatedChannels(id, next);
        if (references.length) {
          var replacement = form.elements.replacement && form.elements.replacement.value;
          if (!replacement || replacement === id) return error(form, '当前包正在渠道中使用，请先选择有效的替代包。');
          var replacementPackage = findPackage(replacement, next);
          if (!replacementPackage || replacementPackage.platform !== target.platform || packageGroup(replacementPackage) !== packageGroup(target)) return error(form, '替代包必须与当前包的下载类型和平台一致。');
          for (var i = 0; i < references.length; i += 1) {
            var channel = references[i];
            var ids = (channel.packageIds || []).map(function (value) { return value === id ? replacement : value; }).filter(function (value, index, all) { return all.indexOf(value) === index; });
            var reason = validateBindings(channel, ids, next);
            if (reason) return error(form, channel.name + '：' + reason);
            channel.packageIds = ids;
          }
        }
        target.status = 'disabled';
        target.updatedAt = today();
        return save(next, form, close, references.length ? '关联渠道已替换绑定，包已停用。' : '包已停用');
      }
    });
  }
  function restorePackage(id) {
    var item = findPackage(id);
    if (!item) return;
    api().dialog({
      title: '恢复包', width: 'normal', submitLabel: '确认恢复',
      html: errorHtml() + '<p>确认恢复“' + esc(item.name) + '”？恢复后可重新绑定渠道，当前版本为 ' + esc(item.currentVersion || '尚未发布') + '。</p>',
      onSubmit: function (form, close) {
        var next = clone(state());
        var target = findPackage(id, next);
        if (!target) return error(form, '该包已不存在，请关闭后刷新。');
        var version = currentVersion(target);
        target.status = version && version.status === 'published' ? 'published' : 'draft';
        target.updatedAt = today();
        return save(next, form, close, target.status === 'published' ? '包已恢复' : '包已恢复为草稿，请先发布版本。');
      }
    });
  }
  function copyVersion(id, number) {
    var item = findPackage(id);
    if (!item) return;
    var version = number ? item.versions.find(function (entry) { return entry.version === number; }) : currentVersion(item);
    if (!version || !version.url) { api().toast('此版本尚未填写下载地址'); return; }
    Promise.resolve(api().copy(version.url)).then(function (success) { api().toast(success ? (version.status === 'draft' ? '草稿地址已复制，此版本尚未发布。' : '下载地址已复制') : '复制失败，请在版本详情中手动复制。'); }).catch(function () { api().toast('复制失败，请重试。'); });
  }
  function openBind(channelId) {
    var channel = findChannel(channelId);
    if (!channel) { api().toast('渠道不存在'); return; }
    var packages = state().packages;
    var selected = channel.packageIds || [];
    var requested = (channel.download && channel.download.types || []).map(function (value) { return { pwa: 'PWA 快捷 APP', native: '原生 APP / 渠道包', fast: '极速 APP' }[value] || value; }).join('、');
    api().dialog({
      title: '绑定渠道包 · ' + channel.name, width: 'wide', submitLabel: '保存绑定',
      html: errorHtml() + '<p class="cm-note">当前下载类型：' + esc(requested || '未配置') + '。不同类型和平台可同时绑定，同一下载类型和平台仅保留一个生效包。</p><div class="cm-option-list">' + packages.map(function (item) {
        var version = currentVersion(item);
        var available = item.status === 'published' && !!version && version.status === 'published';
        var code = item.type === 'channel' ? packageChannelCode(item) : '';
        return '<label class="cm-check"><input type="checkbox" name="packageIds" value="' + esc(item.id) + '"' + (selected.indexOf(item.id) !== -1 ? ' checked' : '') + (available || selected.indexOf(item.id) !== -1 ? '' : ' disabled') + '><span><strong>' + esc(item.name) + '</strong> <span class="cm-muted">' + esc(types[item.type]) + ' / ' + esc(item.platform) + ' / ' + esc(item.currentVersion || '未发布') + (item.type === 'channel' ? ' / 专属渠道码：' + esc(code || '待补充，请先编辑') : '') + '</span> ' + badge(item.status) + (available ? '' : '<span class="cm-muted"> 请先发布或恢复后绑定；已有绑定可取消勾选</span>') + '</span></label>';
      }).join('') + '</div><p class="cm-muted">启用的 PWA、原生 APP、独立渠道包推广渠道必须保留对应包；取消全部绑定还需关闭下载入口、下载弹窗且不强制下载。保存前可随时取消，不影响原绑定。</p>',
      onSubmit: function (form, close) {
        var next = clone(state());
        var target = findChannel(channelId, next);
        if (!target) return error(form, '该渠道已不存在，请关闭后刷新。');
        var ids = Array.prototype.map.call(form.querySelectorAll('input[name="packageIds"]:checked'), function (entry) { return entry.value; });
        var reason = validateBindings(target, ids, next);
        if (reason) return error(form, reason);
        target.packageIds = ids;
        var saved = save(next, form, close, '渠道包绑定已保存');
        var channelPanel = document.getElementById('cm-channels');
        if (saved && channelPanel && !channelPanel.hidden) api().go('channels');
        return saved;
      }
    });
  }
  function init() {
    var container = document.getElementById('cm-packages');
    if (!container || initialized) return;
    initialized = true;
    container.addEventListener('submit', function (event) {
      if (!event.target.matches('[data-pkg-filter]')) return;
      event.preventDefault();
      ['keyword', 'type', 'platform', 'status'].forEach(function (key) { filters[key] = event.target.elements[key].value.trim(); });
      page = 1;
      render();
    });
    container.addEventListener('click', function (event) {
      var target = event.target.closest('[data-pkg-action]');
      if (!target) return;
      var action = target.dataset.pkgAction;
      var id = target.dataset.pkgId;
      if (action === 'reset') { filters = { keyword: '', type: '', platform: '', status: '', channelId: '' }; page = 1; render(); }
      if (action === 'clear-channel') { filters.channelId = ''; page = 1; render(); }
      if (action === 'bind-context') openBind(id);
      if (action === 'create') editPackage();
      if (action === 'edit') editPackage(id);
      if (action === 'new-version') newVersion(id);
      if (action === 'versions') versionHistory(id);
      if (action === 'disable') disablePackage(id);
      if (action === 'restore') restorePackage(id);
      if (action === 'copy') copyVersion(id);
      if (action === 'conversion') api().go('conversion', { packageId: id });
      if (action === 'previous') { page = Math.max(1, page - 1); render(); }
      if (action === 'next') { page += 1; render(); }
    });
  }
  window.CMPackages = { init: init, render: render, openBind: openBind, validateBindings: validateBindings, packageGroup: packageGroup, packageChannelCode: packageChannelCode };
}());
