'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, 'custom', 'js', file), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
let data, captured, failStorage = false, writes = 0;
const dialogs = [], notices = [], navigations = [];
const context = {window: {}, document: {readyState: 'loading', addEventListener() {}}, FormData: class {
  constructor(form) { this.values = form.values; }
  forEach(callback) { Object.entries(this.values).forEach(([key, value]) => (Array.isArray(value) ? value : [value]).forEach(item => { if (item != null) callback(item, key); })); }
}, console};
vm.createContext(context);
const coreSource = read('新渠道管理.js');
vm.runInContext(coreSource.replace("  if (document.readyState === 'loading')", "  window.__seed = function () { return normalizeState(makeSeed()); };\n  if (document.readyState === 'loading')"), context);
const packageSource = read('channel-management-packages.js');
vm.runInContext(packageSource.replace('  window.CMPackages =', '  window.__disablePackage = disablePackage;\n  window.CMPackages ='), context);
const linksSource = read('channel-management-links.js');
vm.runInContext(linksSource.replace('  window.CMLinks =', '  window.__links = {edit: edit, action: action};\n  window.CMLinks ='), context);
context.window.CM = {
  getState: () => clone(data),
  saveState(next) { if (failStorage) throw new Error('Storage denied'); data = clone(next); writes++; },
  escape: value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char])),
  dialog(options) { captured = options; dialogs.push(options); return {}; },
  toast(value) { notices.push(value); },
  go(view, args) { navigations.push({view, context: args}); },
  copy(value) { notices.push(value); return Promise.resolve(true); }
};
const links = context.window.CMLinks, hooks = context.window.__links;
function reset() { data = clone(context.window.__seed()); captured = null; failStorage = false; writes = 0; dialogs.length = 0; notices.length = 0; navigations.length = 0; context.window.CMLanding = {list() { return []; }}; }
function channel() { return data.channels[0]; }
function primary() { return channel().links[0]; }
function form(values) { return {values: clone(values), elements: {}, querySelectorAll(selector) { const match = /^\[name=(packageIds|types)\]:checked$/.exec(selector); return match ? (this.values[match[1]] || []).map(value => ({value})) : []; }, querySelector() { return {hidden: true, textContent: ''}; }}; }
function values(link, overrides) {
  const effective = links.effective(channel(), link || primary());
  return Object.assign({linkName: link ? link.linkName : 'new-entry', media: effective.media, domain: effective.domain, destination: effective.destination, status: 'enabled', inheritConfig: 'yes', landingId: link ? link.landingId || (link.landing ? '__legacy__' : '') : '', provider: '无', pixel: '', registerEvent: 'registration', firstPayEvent: 'first_deposit', repeatPayEvent: 'repeat_deposit', packageIds: clone(effective.packageIds), show: effective.download.show ? 'yes' : 'no', popup: effective.download.popup ? 'yes' : 'no', force: effective.download.force, types: clone(effective.download.types), days: String(effective.download.days), deposits: String(effective.download.deposits), withdrawals: String(effective.download.withdrawals), inGame: 'no', reward: 'no'}, overrides);
}
function submit(value) { let closed = false; captured.onSubmit(form(value), () => { closed = true; }); return closed; }
const tests = [];
function test(name, run) { tests.push({name, run}); }

test('Migration creates one stable main link without changing the legacy history aliases', () => {
  assert.equal(primary().id, 'LK-CH1001-MAIN');
  assert.equal(primary().legacy, true);
  assert.equal(primary().inheritConfig, true);
  const effective = links.effective(channel(), primary());
  assert.deepEqual(clone(effective.packageIds), channel().packageIds);
  assert.deepEqual(clone(effective.download), channel().download);
  assert.equal(links.validateChannel(channel(), data), '');
  const url = new URL(links.url(Object.assign({}, channel(), {language: 'English', currency: 'INR'}), primary()));
  assert.equal(url.searchParams.get('linkId'), 'LK-CH1001-MAIN');
  assert.equal(url.searchParams.has('lang'), false);
  assert.equal(url.searchParams.has('currency'), false);
});

test('Create, edit, duplicate, copy and report actions keep stable IDs and immutable history aliases', () => {
  const historic = clone(channel());
  hooks.edit(channel().id);
  assert.equal(submit(values(null)), true);
  assert.equal(channel().links.length, 2);
  const created = clone(channel().links[1]);
  assert.equal(created.legacy, false);
  assert.notEqual(created.id, primary().id);
  hooks.edit(channel().id, primary().id);
  assert.equal(submit(values(primary(), {linkName: 'main-renamed', media: 'TikTok'})), true);
  assert.equal(primary().id, historic.links[0].id);
  assert.equal(primary().linkName, 'main-renamed');
  assert.equal(channel().linkName, historic.linkName);
  assert.equal(channel().media, historic.media);
  assert.equal(JSON.stringify(data.spend), JSON.stringify(context.window.__seed().spend));
  hooks.action(channel().id, 'duplicate', created.id);
  assert.equal(submit(values(created, {linkName: 'new-entry-copy-2'})), true);
  assert.equal(channel().links.length, 3);
  assert.equal(new Set(channel().links.map(link => link.id)).size, 3);
  assert.equal(channel().links[2].legacy, false);
  hooks.action(channel().id, 'copy-url', created.id);
  assert.ok(notices[notices.length - 1].includes('linkId=' + created.id));
  hooks.action(channel().id, 'report', created.id);
  assert.equal(navigations[navigations.length - 1].context.link, created.id);
});

test('Duplicate names are case-insensitive and failed persistence preserves the same editable draft', () => {
  const before = JSON.stringify(data);
  hooks.edit(channel().id);
  const options = captured, draft = values(null, {linkName: primary().linkName.toUpperCase()});
  assert.throws(() => submit(draft), /不可重复/);
  assert.equal(JSON.stringify(data), before);
  assert.equal(writes, 0);
  draft.linkName = 'fresh-link';
  failStorage = true;
  assert.throws(() => submit(draft), /Storage denied/);
  assert.equal(JSON.stringify(data), before);
  assert.equal(captured, options, 'failed persistence keeps the editor open');
  failStorage = false;
  assert.equal(submit(draft), true);
  assert.equal(channel().links.length, 2);
});

test('Closing a link editor leaves all saved data untouched', () => {
  const before = JSON.stringify(data);
  hooks.edit(channel().id, primary().id);
  assert.equal(JSON.stringify(data), before);
  links.open(channel().id);
  assert.equal(JSON.stringify(data), before);
  assert.equal(captured.readonly, true);
  assert.ok(captured.html.includes('data-link-action="create"'));
});

test('Independent link configuration validates download coverage and tracks later channel inheritance', () => {
  hooks.edit(channel().id);
  assert.throws(() => submit(values(null, {inheritConfig: 'no', packageIds: ['PK1002']})), /原生/);
  assert.equal(channel().links.length, 1);
  assert.throws(() => submit(values(null, {inheritConfig: 'no', days: '-1'})), /非负整数/);
  assert.throws(() => submit(values(null, {inheritConfig: 'no', show: 'no', popup: 'yes'})), /隐藏下载入口/);
  assert.equal(submit(values(null, {inheritConfig: 'no', packageIds: ['PK1002'], types: ['pwa']})), true);
  const separate = channel().links[1];
  assert.deepEqual(separate.config.packageIds, ['PK1002']);
  channel().packageIds = ['PK1001']; channel().download.types = ['native'];
  assert.deepEqual(clone(links.effective(channel(), primary()).packageIds), ['PK1001']);
  assert.deepEqual(clone(links.effective(channel(), separate).packageIds), ['PK1002']);
});

test('Toggle and delete require confirmation; failed storage changes neither links nor historical spend', () => {
  const history = JSON.stringify(data.spend), id = primary().id;
  hooks.action(channel().id, 'toggle', id);
  assert.equal(primary().status, 'enabled');
  failStorage = true;
  assert.throws(() => submit({}), /Storage denied/);
  assert.equal(primary().status, 'enabled');
  failStorage = false;
  assert.equal(submit({}), true);
  assert.equal(primary().status, 'disabled');
  hooks.action(channel().id, 'toggle', id); assert.equal(submit({}), true);
  assert.equal(primary().status, 'enabled');
  hooks.action(channel().id, 'delete', id);
  assert.equal(channel().links.length, 1);
  assert.equal(submit({}), true);
  assert.equal(channel().links.length, 0);
  assert.equal(JSON.stringify(data.spend), history);
});

test('New independent package link bindings require a disabled channel before saving', () => {
  data.packages.push(Object.assign(clone(data.packages[0]), {id: 'PK-INDEPENDENT', type: 'channel', channelCode: channel().code}));
  hooks.edit(channel().id);
  const candidate = values(null, {inheritConfig: 'no', packageIds: ['PK-INDEPENDENT', 'PK1002']});
  const before = JSON.stringify(data);
  assert.throws(() => submit(candidate), /先停用渠道/);
  assert.equal(JSON.stringify(data), before);
  channel().status = 'disabled';
  assert.equal(submit(candidate), true);
  assert.deepEqual(channel().links[1].config.packageIds, ['PK-INDEPENDENT', 'PK1002']);
});

test('Landing catalog saves an independent material reference and safely handles corrupt catalog storage', () => {
  context.window.CMLanding = {list() { return [{id: 'LP1123', name: '1123', status: 'enabled'}]; }};
  hooks.edit(channel().id);
  assert.ok(captured.html.includes('name="landingId"'));
  assert.equal(submit(values(null, {destination: 'landing', landingId: 'LP1123'})), true);
  assert.equal(channel().links[1].landingId, 'LP1123');
  assert.equal(channel().links[1].landing, '1123');
  assert.ok(links.url(channel(), channel().links[1]).includes('template=LP1123'));
  context.window.CMLanding.list = () => { throw new Error('corrupt'); };
  assert.doesNotThrow(() => hooks.edit(channel().id, channel().links[1].id));
  assert.match(captured.html, /落地页目录读取失败/);
  assert.match(captured.html, /name="landingId" disabled/);
  const before = JSON.stringify(data);
  assert.throws(() => submit(values(channel().links[1], {linkName: 'catalog-kept'})), /读取失败/);
  assert.equal(JSON.stringify(data), before, 'catalog read failure cannot report a successful reference save');
  assert.equal(channel().links[1].landingId, 'LP1123');
  hooks.edit(channel().id);
  assert.equal(submit(values(null, {linkName: 'direct-during-error', destination: 'lobby'})), true, 'broken landing catalog must not block an ordinary direct link');
  assert.equal(channel().links[2].landingId, undefined);
});

test('A valid empty catalog offers no invented templates and blocks new landing destinations', () => {
  hooks.edit(channel().id);
  assert.ok(captured.html.includes('暂无可用落地页模板'));
  assert.equal(captured.html.includes('value="__legacy__"'), false, 'new links cannot inherit an unreferenced historic template');
  assert.equal(captured.html.includes('name="landing"'), false);
  const before = JSON.stringify(data);
  assert.throws(() => submit(values(null, {destination: 'landing'})), /先到落地页管理创建/);
  assert.throws(() => submit(values(null, {destination: 'landing', landingId: 'LP-DELETED'})), /目录中有效/);
  assert.throws(() => submit(values(null, {destination: 'landing', landingId: '__legacy__'})), /目录中有效/);
  assert.equal(JSON.stringify(data), before);
  assert.equal(submit(values(null, {destination: 'lobby'})), true, 'ordinary direct links need no landing template');
});

test('Historical links retain their old template read-only and replacement requires a current catalog ID', () => {
  primary().destination = 'landing';
  const legacyName = primary().landing;
  hooks.edit(channel().id, primary().id);
  assert.ok(captured.html.includes('历史配置，只读保留'));
  assert.equal(submit(values(primary(), {landing: 'tampered-template'})), true);
  assert.equal(primary().landing, legacyName, 'historic label is preserved from saved data, not submitted text');
  hooks.action(channel().id, 'duplicate', primary().id);
  assert.equal(captured.html.includes('value="__legacy__"'), false, 'copying creates a new link requiring a valid template');
  assert.throws(() => submit(values(null, {destination: 'landing', landingId: '__legacy__'})), /目录中有效/);
  context.window.CMLanding = {list() { return [{id: 'LP-NEW', name: 'New material', status: 'enabled'}]; }};
  hooks.edit(channel().id, primary().id);
  assert.equal(submit(values(primary(), {landingId: 'LP-NEW'})), true);
  assert.equal(primary().landingId, 'LP-NEW');
  assert.equal(primary().landing, 'New material');
  hooks.edit(channel().id, primary().id);
  context.window.CMLanding.list = () => [];
  const before = JSON.stringify(data);
  assert.throws(() => submit(values(primary())), /目录中有效/);
  assert.equal(JSON.stringify(data), before, 'deleted references are rechecked at save time');
});

test('Package replacement reaches custom link bindings and is atomic across storage failures', () => {
  const reference = clone(primary());
  reference.id = 'LK-CUSTOM'; reference.linkName = 'custom-only'; reference.legacy = false; reference.inheritConfig = false;
  reference.config = {packageIds: ['PK1001', 'PK1002'], download: clone(channel().download)};
  channel().links.push(reference);
  channel().packageIds = ['PK1002']; channel().download.types = ['pwa'];
  data.packages.push(Object.assign(clone(data.packages[0]), {id: 'PK-REPLACEMENT', name: 'Replacement'}));
  context.window.__disablePackage('PK1001');
  assert.ok(captured.html.includes('value="PK-REPLACEMENT"'));
  const before = JSON.stringify(data), options = captured, packageForm = form({});
  packageForm.elements.replacement = {value: 'PK-REPLACEMENT'};
  failStorage = true;
  assert.equal(options.onSubmit(packageForm, () => {}), false);
  assert.equal(JSON.stringify(data), before);
  failStorage = false;
  // Package save refreshes the package table, which is outside this business-only harness.
  context.document.getElementById = () => null;
  options.onSubmit(packageForm, () => {});
  assert.deepEqual(channel().links[1].config.packageIds, ['PK-REPLACEMENT', 'PK1002']);
  assert.equal(data.packages.find(pkg => pkg.id === 'PK1001').status, 'disabled');
});

for (const item of tests) { reset(); item.run(); console.log('PASS ' + item.name); }
assert.equal(linksSource.includes('\ufffd'), false);
assert.equal(/\?{3}/.test(linksSource), false);
console.log('Channel management link checks passed: ' + tests.length);
