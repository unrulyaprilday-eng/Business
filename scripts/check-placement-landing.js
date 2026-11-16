'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const catalogSource = fs.readFileSync(path.join(__dirname, '../custom/js/placement-landing-catalog.js'), 'utf8');
const pageSource = fs.readFileSync(path.join(__dirname, '../custom/js/落地页管理.js'), 'utf8');
const htmlSource = fs.readFileSync(path.join(__dirname, '../落地页管理.html'), 'utf8');
function node() { return { value: '', innerHTML: '', textContent: '', hidden: false, attributes: {}, classList: { remove() {}, toggle() {} }, setAttribute(name, value) { this.attributes[name] = value; }, getAttribute(name) { return this.attributes[name]; }, addEventListener() {}, insertAdjacentElement() {}, focus() {} }; }
function mask(name) {
  const item = node(), fields = [node(), node(), node(), node(), node()], textarea = node(), template = node(), span = node(), error = node(), iconBox = node(), shotBox = node(), confirm = node(), body = node();
  item.attributes['data-modal'] = name; item.hidden = true;
  template.querySelector = () => span;
  item.querySelectorAll = selector => selector === 'input[type="text"]' ? fields : selector === '.upload-row' ? [ { querySelector: () => iconBox }, { querySelector: () => shotBox } ] : [];
  item.querySelector = selector => ({ textarea, '.select-field': template, '.select-option': node(), '[data-landing-error]': error, '[data-landing-action="confirm-delete"]': confirm, '.confirm-body p': body })[selector] || null;
  item.fields = fields; item.textarea = textarea; item.error = error; item.confirm = confirm; item.iconBox = iconBox; item.shotBox = shotBox;
  return item;
}
const masks = { add: mask('add'), edit: mask('edit'), delete: mask('delete') }, table = node(), pagination = node(), search = node(), filter = node(), root = node(), notices = [];
table.innerHTML = '<tr><td>original fallback</td></tr>';
root.querySelector = selector => ({ '.landing-table tbody': table, '.pagination': pagination, '.filter-bar input': search, '.filter-bar': filter, '[data-modal="add"]': masks.add, '[data-modal="edit"]': masks.edit, '[data-modal="delete"]': masks.delete })[selector] || null;
root.querySelectorAll = selector => selector === '.modal-mask' ? Object.values(masks) : [];
filter.insertAdjacentElement = (where, item) => notices.push(item);
const stored = new Map(), key = 'business.placement-landing-catalog.v1', channelKey = 'business.channel-management.v1';
let failWrite = false, failRead = false, dims = [64, 64];
class Reader { readAsDataURL(file) { this.result = file.data || 'data:image/png;base64,AAAA'; this.onload(); } }
class Picture { set src(value) { this.naturalWidth = dims[0]; this.naturalHeight = dims[1]; this.onload(); } }
const context = { console, URL, Date, JSON, Number, Array, Object, Set, String, Promise, Error, RegExp, Math, FileReader: Reader, Image: Picture,
  localStorage: { getItem(name) { if (failRead) throw new Error('read blocked'); return stored.get(name) || null; }, setItem(name, value) { if (failWrite) throw new Error('quota'); stored.set(name, value); } },
  document: { readyState: 'loading', querySelector: () => root, createElement: node, addEventListener() {} }, window: { history: { back() {} } }
};
vm.createContext(context); vm.runInContext(catalogSource, context);
vm.runInContext(pageSource.replace("if (document.readyState === 'loading')", "window.__landing = { load: load, openEditor: openEditor, saveEditor: saveEditor, references: references, requestDelete: requestDelete, confirmDelete: confirmDelete, hideAll: hideAll, run: run, readImage: readImage, upload: upload, safeImage: safeImage, current: function () { return { draft: draft, activeMask: activeMask, records: records }; } }; if (document.readyState === 'loading')"), context);
const catalog = context.window.CMLanding, test = context.window.__landing;
const current = () => test.current();
function fill(name, values) { const item = masks[name]; ['name', 'appName', 'androidUrl', 'iosUrl', 'rating'].forEach((key, index) => { item.fields[index].value = values[key] == null ? '' : values[key]; }); item.textarea.value = values.description || ''; }
function valid(overrides) { return Object.assign({ name: 'New landing', appName: 'APP', androidUrl: 'https://example.test/app.apk', iosUrl: '', rating: '4.5', description: 'Description' }, overrides); }
let checks = 0;
async function check(name, fn) { await fn(); checks++; process.stdout.write('PASS ' + name + '\n'); }
(async () => {
  await check('catalog reads seed and returns isolated records', () => { const rows = catalog.list(); assert.equal(rows[0].id, 'LP1123'); rows[0].name = 'changed'; assert.equal(catalog.list()[0].name, '1123'); });
  await check('catalog save is atomic when browser storage rejects write', () => { const initial = catalog.list(); catalog.save(initial); const before = stored.get(key); failWrite = true; assert.throws(() => catalog.save([]), /保存失败/); failWrite = false; assert.equal(stored.get(key), before); });
  await check('malformed catalog shows an error and retains existing page content', () => { const previous = stored.get(key); stored.set(key, '{bad'); assert.equal(test.load(), false); assert.equal(table.innerHTML, '<tr><td>original fallback</td></tr>'); assert.equal(notices[0].hidden, false); stored.set(key, previous); assert.equal(test.load(), true); assert.match(table.innerHTML, /LP1123/); });
  await check('create commits catalog record and populates list', () => { test.openEditor(); fill('add', valid()); test.saveEditor(); const rows = catalog.list(); assert.equal(rows.length, 2); assert.equal(rows[0].name, 'New landing'); assert.equal(masks.add.hidden, true); assert.match(table.innerHTML, /New landing/); });
  await check('edit opens actual row and cancel discards form and media drafts', () => { test.openEditor('LP1123'); assert.equal(masks.edit.fields[0].value, '1123'); masks.edit.fields[0].value = 'not saved'; current().draft.icon = 'data:image/png;base64,AAAA'; test.hideAll(); assert.equal(catalog.list().find(item => item.id === 'LP1123').name, '1123'); assert.equal(catalog.list().find(item => item.id === 'LP1123').icon, ''); });
  await check('storage failure preserves editor draft, input, and persisted list', () => { test.openEditor('LP1123'); fill('edit', valid({ name: 'Edited' })); current().draft.icon = 'data:image/png;base64,AAAA'; const before = stored.get(key), listBefore = table.innerHTML; failWrite = true; test.saveEditor(); failWrite = false; assert.equal(stored.get(key), before); assert.equal(table.innerHTML, listBefore); assert.equal(masks.edit.hidden, false); assert.equal(masks.edit.fields[0].value, 'Edited'); assert.equal(current().draft.icon, 'data:image/png;base64,AAAA'); assert.match(masks.edit.error.textContent, /保留/); test.saveEditor(); assert.equal(catalog.list().find(item => item.id === 'LP1123').name, 'Edited'); });
  await check('duplicate names, unsafe URLs and invalid ratings block save', () => { test.openEditor(); fill('add', valid({ name: 'Edited' })); test.saveEditor(); assert.match(masks.add.error.textContent, /已存在/); fill('add', valid({ name: 'Other', androidUrl: 'javascript:alert(1)' })); test.saveEditor(); assert.match(masks.add.error.textContent, /HTTP/); fill('add', valid({ name: 'Other', rating: '5.1' })); test.saveEditor(); assert.match(masks.add.error.textContent, /评分/); assert.equal(catalog.list().length, 2); test.hideAll(); });
  await check('name search, reset and output escaping work', () => { search.value = 'new'; test.run('search', search); assert.match(table.innerHTML, /New landing/); assert.equal(table.innerHTML.includes('Edited'), false); test.run('reset', search); assert.match(table.innerHTML, /Edited/); const rows = catalog.list(); rows[0].name = '<img src=x>'; catalog.save(rows); test.load(); assert.equal(table.innerHTML.includes('<img src=x>'), false); assert.match(table.innerHTML, /&lt;img/); });
  await check('referenced landing cannot be deleted and channel state is unchanged', () => { const channels = JSON.stringify({ channels: [{ id: 'CH1', code: 'AAAA', links: [{ id: 'L1', linkName: 'campaign', landingId: 'LP1123' }] }] }); stored.set(channelKey, channels); test.requestDelete('LP1123'); assert.equal(masks.delete.confirm.disabled, true); assert.match(masks.delete.error.textContent, /AAAA \/ campaign/); const before = stored.get(key); test.confirmDelete(); assert.equal(stored.get(key), before); assert.equal(stored.get(channelKey), channels); });
  await check('reference is rechecked after delete confirmation opened', () => { stored.delete(channelKey); test.requestDelete('LP1123'); assert.equal(masks.delete.confirm.disabled, false); stored.set(channelKey, JSON.stringify({ channels: [{ links: [{ landingId: 'LP1123' }] }] })); test.confirmDelete(); assert.equal(catalog.list().length, 2); assert.match(masks.delete.error.textContent, /引用/); });
  await check('invalid channel storage and read failure safely block deletion', () => { stored.set(channelKey, '{bad'); assert.throws(() => test.references('LP1123'), /无法核对/); failRead = true; assert.throws(() => test.references('LP1123'), /阻止删除/); failRead = false; stored.delete(channelKey); });
  await check('delete storage failure retains confirmation and retry removes only landing', () => { test.requestDelete('LP1123'); const before = stored.get(key); failWrite = true; test.confirmDelete(); failWrite = false; assert.equal(stored.get(key), before); assert.equal(masks.delete.hidden, false); test.confirmDelete(); assert.equal(catalog.list().length, 1); assert.equal(masks.delete.hidden, true); });
  await check('image validation rejects oversized, nonsquare and unsupported media', async () => { await assert.rejects(test.readImage({ type: 'image/png', size: 301 * 1024 }, true), /300/); await assert.rejects(test.readImage({ type: 'image/svg+xml', size: 10 }, true), /PNG/); dims = [64, 65]; await assert.rejects(test.readImage({ type: 'image/png', size: 10 }, true), /正方形/); dims = [64, 64]; assert.equal(await test.readImage({ type: 'image/png', size: 10 }, true), 'data:image/png;base64,AAAA'); assert.equal(test.safeImage('https://external.test/a.png'), ''); });
  await check('image upload updates only the draft and limits screenshots to five', async () => { test.openEditor(); const before = stored.get(key); test.upload({ files: [{ type: 'image/png', size: 10 }], getAttribute: () => 'icon' }); await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); assert.equal(current().draft.icon, 'data:image/png;base64,AAAA'); assert.equal(stored.get(key), before); current().draft.screenshots = Array(5).fill('data:image/png;base64,AAAA'); test.upload({ files: [{ type: 'image/png', size: 10 }], getAttribute: () => 'shots' }); assert.equal(current().draft.screenshots.length, 5); assert.match(masks.add.error.textContent, /最多 5/); test.hideAll(); });
  await check('HTML loads catalog before page script and explains download precedence', () => { assert.ok(htmlSource.indexOf('custom/js/placement-landing-catalog.js') < htmlSource.indexOf('custom/js/落地页管理.js')); assert.match(htmlSource, /当前发布版本/); assert.match(htmlSource, /独立访问/); });
  process.stdout.write('Verified ' + checks + ' placement landing checks.\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
