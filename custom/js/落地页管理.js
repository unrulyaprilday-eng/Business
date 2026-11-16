(function () {
  'use strict';
  var root = document.querySelector('.landing-page-admin');
  if (!root) return;
  var records = null, search = '', page = 1, pageSize = 20, draft = null, activeMask = null, deleteId = '', token = 0, reading = false, serial = 0;
  var tableBody = root.querySelector('.landing-table tbody'), pagination = root.querySelector('.pagination'), filterInput = root.querySelector('.filter-bar input');
  var notice = document.createElement('p'); notice.className = 'landing-status'; notice.setAttribute('role', 'status'); notice.hidden = true;
  root.querySelector('.filter-bar').insertAdjacentElement('afterend', notice);
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }
  function message(text, error) { notice.textContent = text; notice.hidden = false; notice.classList.toggle('is-error', !!error); }
  function errorText(mask, text) { var box = mask.querySelector('[data-landing-error]'); box.textContent = text || ''; box.hidden = !text; }
  function catalog() { if (!window.CMLanding) throw new Error('落地页目录未加载，请刷新后重试。'); return window.CMLanding; }
  function load() {
    try { records = catalog().list(); render(); return true; }
    catch (error) { message(error.message || '落地页目录读取失败，已保留当前列表，请检查本机数据。', true); return false; }
  }
  function safeImage(value) { return /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(String(value || '')) ? value : ''; }
  function image(value, className, alt) { var src = safeImage(value); return src ? '<img class="' + className + '" src="' + esc(src) + '" alt="' + esc(alt) + '">' : '<span class="landing-no-image">未设置</span>'; }
  function visibleRecords() { return (records || []).filter(function (item) { return String(item.name).toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) !== -1; }); }
  function render() {
    if (!Array.isArray(records)) return;
    var rows = visibleRecords(), pages = Math.max(1, Math.ceil(rows.length / pageSize)); page = Math.min(Math.max(1, page), pages);
    tableBody.innerHTML = rows.slice((page - 1) * pageSize, page * pageSize).map(function (item) {
      return '<tr><td title="' + esc(item.id) + '">' + esc(item.id) + '</td><td>' + esc(item.name) + '</td><td>' + esc(item.style || '仿谷歌落地页') + '</td><td>' + image(item.icon, 'landing-table-icon', item.appName || 'APP图标') + '</td><td>' + esc(item.appName) + '</td><td>' + esc(item.androidUrl || '—') + '</td><td>' + esc(item.rating) + '</td><td><div class="shot-list">' + (item.screenshots || []).map(function (src, index) { return image(src, 'landing-table-shot', '截图 ' + (index + 1)); }).join('') + (!item.screenshots || !item.screenshots.length ? '<span class="landing-no-image">未设置</span>' : '') + '</div></td><td><button class="text-link" type="button" data-landing-action="edit" data-id="' + esc(item.id) + '">编辑</button><button class="text-link danger" type="button" data-landing-action="delete" data-id="' + esc(item.id) + '">删除</button></td></tr>';
    }).join('') || '<tr><td colspan="9">暂无符合条件的落地页</td></tr>';
    pagination.innerHTML = '<button class="page-icon first" type="button" aria-label="第一页" data-landing-action="first"' + (page === 1 ? ' disabled' : '') + '></button><button class="page-icon prev" type="button" aria-label="上一页" data-landing-action="previous"' + (page === 1 ? ' disabled' : '') + '></button><span>第 ' + page + ' / ' + pages + ' 页</span><button class="page-icon next" type="button" aria-label="下一页" data-landing-action="next"' + (page >= pages ? ' disabled' : '') + '></button><button class="page-icon last" type="button" aria-label="最后一页" data-landing-action="last"' + (page >= pages ? ' disabled' : '') + '></button><span>' + pageSize + ' 条 / 页</span><span>共 ' + rows.length + ' 条记录</span>';
  }
  function hideAll() { token += 1; reading = false; draft = null; deleteId = ''; activeMask = null; root.querySelectorAll('.modal-mask').forEach(function (mask) { mask.hidden = true; }); }
  function modalFields(mask) { var inputs = mask.querySelectorAll('input[type="text"]'); return { name: inputs[0], appName: inputs[1], androidUrl: inputs[2], iosUrl: inputs[3], rating: inputs[4], description: mask.querySelector('textarea') }; }
  function openEditor(id) {
    if (!load()) return;
    var saved = id && records.find(function (item) { return item.id === id; });
    if (id && !saved) return message('落地页已不存在，请重试。', true);
    hideAll();
    draft = saved ? clone(saved) : { id: 'LP-' + Date.now().toString(36) + '-' + (++serial), name: '', style: '仿谷歌落地页', status: 'enabled', appName: '', androidUrl: '', iosUrl: '', rating: '4.5', description: '', icon: '', screenshots: [] };
    draft.screenshots = Array.isArray(draft.screenshots) ? draft.screenshots : [];
    activeMask = root.querySelector('[data-modal="' + (saved ? 'edit' : 'add') + '"]');
    var fields = modalFields(activeMask);
    Object.keys(fields).forEach(function (key) { fields[key].value = draft[key] == null ? '' : draft[key]; fields[key].classList.remove('invalid'); });
    var template = activeMask.querySelector('.select-field');
    if (template) { template.querySelector('span').textContent = '仿谷歌落地页'; template.classList.remove('invalid'); template.setAttribute('aria-expanded', 'false'); }
    var option = activeMask.querySelector('.select-option'); if (option) option.hidden = true;
    errorText(activeMask, ''); renderMedia(); activeMask.hidden = false; fields.name.focus();
  }
  function validate(values) {
    var result = clone(draft);
    Object.keys(values).forEach(function (key) { result[key] = String(values[key]).trim(); });
    if (!result.name || result.name.length > 80) throw new Error('模板名称必填，且不超过 80 字。');
    if (!result.appName || result.appName.length > 80) throw new Error('APP 名字必填，且不超过 80 字。');
    if (!result.androidUrl && !result.iosUrl) throw new Error('请至少填写一个独立访问时的默认下载地址。');
    ['androidUrl', 'iosUrl'].forEach(function (key) {
      if (!result[key]) return;
      try { var url = new URL(result[key]); if (!/^https?:$/.test(url.protocol) || !url.hostname || result[key].length > 2048) throw new Error('invalid'); }
      catch (error) { throw new Error((key === 'androidUrl' ? '安卓' : 'iOS') + '下载地址须为有效的 HTTP / HTTPS 地址。'); }
    });
    if (!/^\d(?:\.\d)?$/.test(result.rating) || Number(result.rating) < 0 || Number(result.rating) > 5) throw new Error('APP 评分须为 0 至 5，最多一位小数。');
    if (!result.description || result.description.length > 5000) throw new Error('APP 详细介绍必填，且不超过 5000 字。');
    result.style = '仿谷歌落地页'; result.updatedAt = new Date().toISOString(); return result;
  }
  function saveEditor() {
    if (!draft || !activeMask) return;
    var mask = activeMask;
    try {
      if (reading) throw new Error('图片仍在读取，请稍后保存。');
      var fields = modalFields(mask), values = {}; Object.keys(fields).forEach(function (key) { values[key] = fields[key].value; });
      var record = validate(values), latest = catalog().list(), editing = mask.getAttribute('data-modal') === 'edit';
      if (editing && !latest.some(function (item) { return item.id === record.id; })) throw new Error('该落地页已被删除，请关闭弹窗并刷新。');
      if (latest.some(function (item) { return item.id !== record.id && String(item.name).trim().toLocaleLowerCase() === record.name.toLocaleLowerCase(); })) throw new Error('模板名称已存在，请更换名称。');
      var next = editing ? latest.map(function (item) { return item.id === record.id ? record : item; }) : [record].concat(latest);
      records = catalog().save(next); hideAll(); render(); message('落地页已保存，渠道广告链接可选择此模板。');
    } catch (error) { errorText(mask, error.message || '保存失败，填写内容已保留。'); }
  }
  function references(id) {
    var raw;
    try { raw = localStorage.getItem('business.channel-management.v1'); }
    catch (error) { throw new Error('无法读取渠道引用，已阻止删除，请检查浏览器存储权限。'); }
    if (!raw) return [];
    var state;
    try { state = JSON.parse(raw); if (!state || !Array.isArray(state.channels) || state.channels.some(function (channel) { return !channel || (channel.links != null && !Array.isArray(channel.links)); })) throw new Error('invalid'); }
    catch (error) { throw new Error('渠道数据格式异常，无法核对引用，已阻止删除。'); }
    var result = [];
    state.channels.forEach(function (channel) {
      (channel.links || []).forEach(function (link) { if (String(link.landingId || '') === String(id)) result.push((channel.code || channel.name || channel.id) + ' / ' + (link.linkName || link.name || link.id)); });
      if (String(channel.landingId || '') === String(id)) result.push((channel.code || channel.name || channel.id) + ' / 渠道默认落地页');
    });
    return result;
  }
  function requestDelete(id) {
    if (!load()) return;
    var record = records.find(function (item) { return item.id === id; });
    if (!record) return message('落地页已不存在。', true);
    hideAll(); deleteId = id; activeMask = root.querySelector('[data-modal="delete"]');
    var submit = activeMask.querySelector('[data-landing-action="confirm-delete"]'); submit.disabled = false;
    activeMask.querySelector('.confirm-body p').textContent = '确定删除落地页“' + record.name + '”？'; errorText(activeMask, '');
    try { var used = references(id); if (used.length) { errorText(activeMask, '此落地页已被广告链接引用，不能删除：' + used.join('、') + '。请先在渠道管理更换落地页。'); submit.disabled = true; } }
    catch (error) { errorText(activeMask, error.message); submit.disabled = true; }
    activeMask.hidden = false;
  }
  function confirmDelete() {
    if (!deleteId || !activeMask) return;
    var mask = activeMask;
    try {
      if (references(deleteId).length) throw new Error('此落地页已被广告链接引用，不能删除；请先在渠道管理更换落地页。');
      var latest = catalog().list(), next = latest.filter(function (item) { return item.id !== deleteId; });
      records = catalog().save(next); hideAll(); render(); message('落地页已删除，渠道数据保持不变。');
    } catch (error) { errorText(mask, error.message || '删除失败，请重试。'); }
  }
  function renderMedia() {
    if (!draft || !activeMask) return;
    var rows = activeMask.querySelectorAll('.upload-row'), iconBox = rows[0].querySelector('div'), shotBox = rows[1].querySelector('div');
    iconBox.innerHTML = '<div class="upload-line">' + (draft.icon ? '<div class="preview app-preview">' + image(draft.icon, 'landing-editor-icon', 'APP图标') + '<button type="button" data-landing-action="remove-icon" aria-label="移除图标">×</button></div>' : '') + '<button class="upload-box small" type="button" data-landing-action="pick-icon"><b>+</b><span>选择图标</span></button></div><input type="file" accept="image/png,image/jpeg,image/webp" data-landing-upload="icon" hidden><p>PNG / JPG / WebP，正方形，最大 300 KB；仅保存在本机浏览器。</p>';
    shotBox.innerHTML = '<div class="upload-line">' + draft.screenshots.map(function (src, index) { return '<div class="preview shot-preview">' + image(src, 'landing-editor-shot', '截图 ' + (index + 1)) + '<button type="button" data-landing-action="remove-shot" data-index="' + index + '" aria-label="移除截图 ' + (index + 1) + '">×</button></div>'; }).join('') + (draft.screenshots.length < 5 ? '<button class="upload-box tall" type="button" data-landing-action="pick-shots"><b>+</b><span>选择截图</span></button>' : '') + '</div><input type="file" accept="image/png,image/jpeg,image/webp" data-landing-upload="shots" multiple hidden><p>推荐 330 × 587，最多 5 张，每张最大 1 MB；仅保存在本机浏览器。</p>';
  }
  function readImage(file, icon) {
    return new Promise(function (resolve, reject) {
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return reject(new Error('仅支持 PNG / JPG / WebP 图片。'));
      if (file.size > (icon ? 300 * 1024 : 1024 * 1024)) return reject(new Error(icon ? '图标不能超过 300 KB。' : '每张截图不能超过 1 MB。'));
      var reader = new FileReader(); reader.onerror = function () { reject(new Error('图片读取失败，请重新选择。')); };
      reader.onload = function () {
        var source = String(reader.result || ''); if (!safeImage(source)) return reject(new Error('图片内容无效，请重新选择。'));
        var pic = new Image(); pic.onerror = function () { reject(new Error('无法解析图片，请重新选择。')); };
        pic.onload = function () { if (!pic.naturalWidth || !pic.naturalHeight || (icon && pic.naturalWidth !== pic.naturalHeight)) return reject(new Error('APP 图标必须为正方形图片。')); resolve(source); }; pic.src = source;
      }; reader.readAsDataURL(file);
    });
  }
  function upload(control) {
    if (!draft || !activeMask) return;
    var icon = control.getAttribute('data-landing-upload') === 'icon', files = Array.from(control.files || []), currentToken = token, mask = activeMask;
    if (!files.length) return;
    if (reading) return errorText(mask, '图片仍在读取，请稍后再选择。');
    if ((!icon && draft.screenshots.length + files.length > 5) || (icon && files.length > 1)) return errorText(mask, '截图最多 5 张，图标仅可选择一张。');
    reading = true; errorText(mask, '正在读取本机图片，请稍候…');
    Promise.all(files.map(function (file) { return readImage(file, icon); })).then(function (images) { if (currentToken !== token || !draft) return; if (icon) draft.icon = images[0]; else draft.screenshots = draft.screenshots.concat(images); reading = false; errorText(mask, ''); renderMedia(); }).catch(function (error) { if (currentToken !== token) return; reading = false; errorText(mask, error.message); });
  }
  function run(action, target) {
    if (action === 'add' || action === 'edit') openEditor(action === 'edit' ? target.getAttribute('data-id') : '');
    else if (action === 'delete') requestDelete(target.getAttribute('data-id'));
    else if (action === 'save') saveEditor();
    else if (action === 'confirm-delete') confirmDelete();
    else if (action === 'search' || action === 'reset') { if (action === 'reset') filterInput.value = ''; search = filterInput.value.trim(); page = 1; load(); }
    else if (action === 'first' || action === 'previous' || action === 'next' || action === 'last') { var pages = Math.max(1, Math.ceil(visibleRecords().length / pageSize)); page = action === 'first' ? 1 : action === 'last' ? pages : page + (action === 'next' ? 1 : -1); render(); }
    else if (action === 'pick-icon' || action === 'pick-shots') { if (activeMask) activeMask.querySelector('[data-landing-upload="' + (action === 'pick-icon' ? 'icon' : 'shots') + '"]').click(); }
    else if (action === 'remove-icon' || action === 'remove-shot') { if (!draft || reading) return; if (action === 'remove-icon') draft.icon = ''; else draft.screenshots.splice(Number(target.getAttribute('data-index')), 1); renderMedia(); }
  }
  function setup() {
    var buttons = root.querySelectorAll('.filter-bar button'); ['search', 'reset', 'add'].forEach(function (action, index) { buttons[index].setAttribute('data-landing-action', action); });
    root.querySelectorAll('.modal-mask').forEach(function (mask) {
      var box = document.createElement('p'); box.className = 'landing-form-error'; box.setAttribute('data-landing-error', ''); box.setAttribute('role', 'alert'); box.hidden = true; mask.querySelector('.modal-footer').insertAdjacentElement('beforebegin', box);
      var submit = mask.querySelector('.modal-footer .primary'); submit.classList.remove('js-close-modal'); submit.setAttribute('data-landing-action', mask.getAttribute('data-modal') === 'delete' ? 'confirm-delete' : 'save');
      mask.addEventListener('click', function (event) { if (event.target === mask) hideAll(); });
      var template = mask.querySelector('.js-template-select'); if (template) { template.disabled = true; template.querySelector('span').textContent = '仿谷歌落地页'; }
      mask.querySelectorAll('.number-field button').forEach(function (button, index) { button.addEventListener('click', function () { var input = modalFields(mask).rating, value = Number(input.value) || 0; input.value = Math.min(5, Math.max(0, value + (index === 0 ? 0.1 : -0.1))).toFixed(1); }); });
    });
    root.addEventListener('click', function (event) { var close = event.target.closest('.js-close-modal'); if (close) return hideAll(); var target = event.target.closest('[data-landing-action]'); if (target && !target.disabled) run(target.getAttribute('data-landing-action'), target); });
    root.addEventListener('change', function (event) { if (event.target.matches('[data-landing-upload]')) upload(event.target); });
    filterInput.addEventListener('keydown', function (event) { if (event.key === 'Enter') { event.preventDefault(); run('search', filterInput); } });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape') hideAll(); });
    var refresh = root.querySelector('.icon-refresh'); if (refresh) refresh.addEventListener('click', load);
    var back = root.querySelector('.icon-back'); if (back) back.addEventListener('click', function () { window.history.back(); });
    load();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
})();
