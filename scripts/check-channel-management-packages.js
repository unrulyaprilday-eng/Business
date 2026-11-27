/* Run with Node.js. Exercises package workflows without a browser or dependencies. */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const sourcePath = path.join(__dirname, '..', 'custom', 'js', 'channel-management-packages.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const copy = value => JSON.parse(JSON.stringify(value));
const decode = value => String(value || '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
const attr = (tag, name) => { const found = tag.match(new RegExp('\\b' + name + '="([^"]*)"')); return found ? decode(found[1]) : ''; };

function fakeForm(html) {
  const form = {elements: {}, dataset: {}, nodes: {}, listeners: {}, checked: [], closed: false};
  const radios = {};
  for (const match of html.matchAll(/<input\b[^>]*>/g)) {
    const tag = match[0], name = attr(tag, 'name');
    if (!name) continue;
    const input = {value: attr(tag, 'value'), name, disabled: /\sdisabled\b/.test(tag), required: /\srequired\b/.test(tag), checked: /\schecked\b/.test(tag), accept: attr(tag, 'accept'), files: [], validity: {badInput: false}, focus() { this.focused = true; }};
    if (attr(tag, 'type') === 'radio') (radios[name] ||= []).push(input);
    else form.elements[name] = input;
  }
  for (const [name, group] of Object.entries(radios)) {
    Object.defineProperty(group, 'value', {
      get: () => group.find(input => input.checked)?.value || '',
      set: value => group.forEach(input => { input.checked = input.value === value; })
    });
    form.elements[name] = group;
  }
  for (const match of html.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g)) {
    const name = attr(match[1], 'name');
    const options = Array.from(match[2].matchAll(/<option\b([^>]*)>/g), item => ({value: attr(item[1], 'value'), selected: /\sselected\b/.test(item[1]), disabled: /\sdisabled\b/.test(item[1])}));
    form.elements[name] = {name, options, disabled: /\sdisabled\b/.test(match[1]), value: (options.find(item => item.selected) || options[0] || {}).value || ''};
  }
  for (const key of ['data-pkg-error', 'data-pkg-file-area', 'data-pkg-build-required', 'data-pkg-url-label', 'data-pkg-channel-code']) form.nodes['[' + key + ']'] = {hidden: key === 'data-pkg-error', textContent: ''};
  if (html.includes('data-pkg-reward-minimum')) form.nodes['[data-pkg-reward-minimum]'] = {hidden: true};
  if (html.includes('data-pkg-use-legacy-reward')) form.nodes['[data-pkg-use-legacy-reward]'] = {
    addEventListener(event, callback) { this[event] = callback; }
  };
  form.querySelector = selector => form.nodes[selector] || null;
  form.querySelectorAll = selector => selector.includes('packageIds') ? form.checked.map(value => ({value})) : [];
  form.addEventListener = (name, callback) => { (form.listeners[name] || (form.listeners[name] = [])).push(callback); };
  form.emit = (name, target) => { for (const listener of form.listeners[name] || []) listener({target}); };
  return form;
}

function published(version, createdAt) {
  return {version, build: version.replace(/\D/g, ''), url: 'https://download.example.test/' + version + '.apk', fileName: '', size: '', status: 'published', createdAt, publishedAt: createdAt};
}
function draft(version, createdAt) { return Object.assign(published(version, createdAt), {status: 'draft', publishedAt: ''}); }
function channel(id, types, overrides) {
  return {id, name: id, code: id, type: 'link', status: 'enabled', packageIds: ['PK1'], download: Object.assign({show: true, popup: true, force: 'none', types}, overrides)};
}
function seed() {
  return {channels: [
    channel('NATIVE', ['native']),
    Object.assign(channel('PWA', ['pwa']), {packageIds: ['PK3']}),
    channel('CLOSED', [], {show: false, popup: false}),
    channel('BAD_POPUP', ['native'], {show: false}),
    channel('BAD_FORCE_POPUP', ['native'], {force: 'app', popup: false}),
    channel('BAD_FORCE_TYPES', ['pwa'], {force: 'app'}),
    channel('EMPTY_TYPES', []),
    Object.assign(channel('MULTI', ['native', 'pwa']), {packageIds: ['PK1', 'PK3']})
  ], packages: [
    {id: 'PK1', name: 'Native One', type: 'native', platform: 'Android', status: 'published', currentVersion: '2.0', versions: [published('2.0', '2026-11-10'), published('1.0', '2026-11-01'), draft('3.0', '2026-11-11'), draft('3.1', '2026-11-11')]},
    {id: 'PK2', name: 'Native Two', type: 'native', platform: 'Android', status: 'published', currentVersion: '1.0', versions: [published('1.0', '2026-11-01')]},
    {id: 'PK3', name: 'PWA One', type: 'pwa', platform: 'PWA', status: 'published', currentVersion: '1.0', versions: [published('1.0', '2026-11-01')]},
    {id: 'PK4', name: 'Fast APP', type: 'fast', platform: 'Android', status: 'published', currentVersion: '1.0', versions: [published('1.0', '2026-11-01')]},
    {id: 'PK5', name: 'Invalid Current', type: 'native', platform: 'Android', status: 'published', currentVersion: '1.0', versions: [draft('1.0', '2026-11-01')]}
  ], spend: [], global: {}};
}
function harness(legacy = {}) {
  const env = {data: seed(), saved: 0, dialogs: [], events: {}, fail: false, go: [], toasts: []};
  env.root = {innerHTML: '', hidden: true, addEventListener: (event, callback) => { (env.events[event] || (env.events[event] = [])).push(callback); }};
  env.channels = {hidden: false};
  const api = {
    getState: () => copy(env.data),
    saveState: next => { if (env.fail) throw new Error('Storage failure'); env.data = copy(next); env.saved += 1; },
    escape, toast: value => env.toasts.push(value), copy: () => Promise.resolve(true), go: (view, context) => { env.go.push(view); env.lastGo = {view, context}; },
    dialog: options => {
      const record = {options, form: fakeForm(options.html)};
      env.dialogs.push(record);
      if (options.onOpen) options.onOpen(record.form);
      return record.form;
    }
  };
  const context = {window: {CM: api, localStorage: {getItem: key => legacy[key] || null}}, document: {getElementById: id => id === 'cm-packages' ? env.root : id === 'cm-channels' ? env.channels : null}, URL, Date, Promise};
  vm.runInNewContext(source, context, {filename: sourcePath});
  env.module = context.window.CMPackages;
  env.latest = () => env.dialogs[env.dialogs.length - 1];
  env.click = (action, id) => { for (const callback of env.events.click || []) callback({target: {closest: () => ({dataset: {pkgAction: action, pkgId: id}})}}); return env.latest(); };
  env.filter = values => {
    const form = fakeForm(env.root.innerHTML);
    form.matches = selector => selector === '[data-pkg-filter]';
    for (const [name, value] of Object.entries(values)) form.elements[name].value = value;
    for (const callback of env.events.submit || []) callback({target: form, preventDefault: () => {}});
  };
  env.historyAction = (action, version) => { env.latest().form.emit('click', {closest: () => ({dataset: {pkgAction: action, pkgVersion: version}})}); return env.latest(); };
  env.submit = () => { const record = env.latest(); return record.options.onSubmit(record.form, () => { record.form.closed = true; }); };
  env.set = values => { for (const [name, value] of Object.entries(values)) env.latest().form.elements[name].value = value; };
  env.bind = (id, ids) => { env.module.openBind(id); env.latest().form.checked = ids; return env.submit(); };
  env.find = id => env.data.packages.find(item => item.id === id);
  env.snapshot = () => JSON.stringify(env.data);
  env.module.init();
  return env;
}

const env = harness();
env.module.init();
assert.equal(env.events.click.length, 1, 'init must be idempotent');
env.module.render();
assert.ok(env.root.innerHTML.includes('Native One'));
assert.ok(env.root.innerHTML.includes('cm-sticky-action'));

// Rewards bind to the current package; old global values are opt-in draft fields.
const rewards = harness({'business.placement.install-reward.v1': JSON.stringify({installEnabled: true, installReward: '50', installCondition: 'bet', installMinimum: '500'})});
rewards.module.render();
const rewardRow = id => Array.from(rewards.root.innerHTML.matchAll(/<tr>[\s\S]*?<\/tr>/g), match => match[0]).find(row => row.includes('data-pkg-id="' + id + '"')) || '';
const rewardCell = id => {
  const column = Array.from(rewards.root.innerHTML.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g), match => match[1]).indexOf('安装奖励');
  return Array.from(rewardRow(id).matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g), match => match[1])[column] || '';
};
assert.match(rewards.root.innerHTML, /<th\b[^>]*>安装奖励<\/th>/);
for (const item of rewards.data.packages) {
  const row = rewardRow(item.id);
  const actions = Array.from(row.matchAll(/<button\b[^>]*>/g), match => match[0]).filter(tag => attr(tag, 'data-pkg-action') === 'install-reward');
  assert.equal(actions.length, 1, item.id + ' has exactly one dedicated reward entry');
  assert.equal(attr(actions[0], 'data-pkg-id'), item.id, 'reward entry carries its own package ID');
  assert.ok(row.indexOf(actions[0]) > row.indexOf('cm-sticky-action'), 'reward entry is in the right-hand action cell');
  assert.match(rewardCell(item.id), /未配置/);
}
const basic = rewards.click('edit', 'PK1');
for (const name of ['installEnabled', 'installAmount', 'installCondition', 'installMinimum']) assert.equal(basic.form.elements[name], undefined, 'basic editing excludes reward fields');
const beforeReward = copy(rewards.data);
let rewardForm = rewards.click('install-reward', 'PK1').form;
assert.equal(rewardForm.elements.name, undefined, 'dedicated reward form excludes basic package editing');
assert.equal(rewardForm.elements.installEnabled.checked, false);
assert.equal(rewardForm.elements.installAmount.value, '');
rewardForm.nodes['[data-pkg-use-legacy-reward]'].click();
assert.equal(rewardForm.elements.installAmount.value, '50');
assert.equal(rewardForm.elements.installEnabled.checked, false, 'copying old values does not implicitly enable a package');
rewardForm.elements.installEnabled.checked = true;
rewardForm.elements.installCondition.value = 'deposit';
rewardForm.emit('change', {name: 'installCondition'});
assert.equal(rewardForm.elements.installMinimum.value, '');
assert.equal(rewards.submit(), false, 'enabled reward needs a threshold for the selected condition');
rewards.set({installAmount: '55.50', installMinimum: '300'});
rewards.fail = true;
assert.equal(rewards.submit(), false);
assert.equal(rewards.find('PK1').installReward, undefined);
assert.equal(rewardForm.elements.installMinimum.value, '300');
assert.equal(rewardForm.closed, false, 'failed reward persistence keeps its draft open');
assert.match(rewardCell('PK1'), /未配置/, 'failed save must not update the main table');
rewards.fail = false;
assert.equal(rewards.submit(), true);
assert.deepEqual(rewards.find('PK1').installReward, {enabled: true, amount: '55.50', condition: 'deposit', minimum: '300'});
assert.deepEqual(rewards.data.packages.filter(item => item.id !== 'PK1'), beforeReward.packages.filter(item => item.id !== 'PK1'), 'saving a reward leaves every other package untouched');
assert.deepEqual(rewards.data.channels, beforeReward.channels, 'saving a reward leaves channel bindings untouched');
for (const key of ['name', 'type', 'platform', 'status', 'currentVersion', 'versions']) assert.deepEqual(rewards.find('PK1')[key], beforeReward.packages[0][key], 'reward save preserves package ' + key);
assert.equal(rewardCell('PK1'), '55.50 IDR');
assert.match(rewardCell('PK2'), /未配置/);
rewardForm = rewards.click('install-reward', 'PK2').form;
assert.equal(rewardForm.elements.installAmount.value, '');
const beforeCancelledReward = rewards.snapshot();
rewards.set({installAmount: '88', installCondition: 'bet', installMinimum: '900'});
rewardForm.elements.installEnabled.checked = true;
rewardForm.closed = true; // Shared cancel/close discards the dedicated form draft.
assert.equal(rewards.snapshot(), beforeCancelledReward, 'unsaved reward edits never affect another package');
rewardForm = rewards.click('install-reward', 'PK1').form;
assert.equal(rewardForm.elements.installEnabled.checked, true);
assert.equal(rewardForm.elements.installAmount.value, '55.50');
assert.equal(rewardForm.elements.installCondition.value, 'deposit');
assert.equal(rewardForm.elements.installMinimum.value, '300');
rewardForm.elements.installEnabled.checked = false;
assert.equal(rewards.submit(), true);
assert.deepEqual(rewards.find('PK1').installReward, {enabled: false, amount: '55.50', condition: 'deposit', minimum: '300'});
assert.match(rewardCell('PK1'), /已停用/);
assert.doesNotMatch(rewardCell('PK1'), /55\.50|300/);
const savedReward = copy(rewards.find('PK1').installReward);
rewards.click('edit', 'PK1');
rewards.set({name: 'Native One Renamed'});
assert.equal(rewards.submit(), true);
assert.equal(rewards.find('PK1').name, 'Native One Renamed');
assert.deepEqual(rewards.find('PK1').installReward, savedReward, 'saving basic information cannot overwrite the independent reward');
assert.equal(rewards.find('PK2').installReward, undefined);
assert.match(rewardCell('PK1'), /已停用/);
rewardForm = rewards.click('install-reward', 'PK1').form;
assert.equal(rewardForm.elements.installEnabled.checked, false);
assert.equal(rewardForm.elements.installAmount.value, '55.50');
assert.equal(rewardForm.elements.installMinimum.value, '300');

// External channel drill-ins replace old filters; ordinary renders and successful saves retain them.
const navigation = harness();
navigation.module.render();
navigation.filter({keyword: 'No matching package', type: 'fast', platform: 'iOS', status: 'draft'});
assert.ok(navigation.root.innerHTML.includes('cm-empty'));
navigation.module.render();
navigation.module.render({});
assert.equal(fakeForm(navigation.root.innerHTML).elements.keyword.value, 'No matching package', 'plain Tab returns retain filters');
navigation.module.render({channelId: 'NATIVE'});
assert.ok(navigation.root.innerHTML.includes('Native One'), 'channel drill-in ignores previous incompatible filters');
assert.ok(!navigation.root.innerHTML.includes('Native Two'), 'channel drill-in still limits results to its bindings');
for (const key of ['keyword', 'type', 'platform', 'status']) assert.equal(fakeForm(navigation.root.innerHTML).elements[key].value, '', key + ' resets on explicit channel context');
navigation.filter({keyword: 'Native One', type: 'native', platform: 'Android', status: 'published'});
navigation.module.render({});
assert.equal(fakeForm(navigation.root.innerHTML).elements.keyword.value, 'Native One');
assert.equal(navigation.bind('NATIVE', ['PK1']), true);
assert.equal(fakeForm(navigation.root.innerHTML).elements.keyword.value, 'Native One', 'binding save render preserves active query');
assert.ok(navigation.root.innerHTML.includes('data-pkg-action="clear-channel"'), 'binding save retains channel context');
navigation.module.render({channelId: ''});
for (const key of ['keyword', 'type', 'platform', 'status']) assert.equal(fakeForm(navigation.root.innerHTML).elements[key].value, '', key + ' resets when explicit context clears channel');
assert.ok(navigation.root.innerHTML.includes('Native Two'));
assert.ok(!navigation.root.innerHTML.includes('data-pkg-action="clear-channel"'));
navigation.filter({keyword: 'Native One', status: 'draft'});
navigation.click('reset');
assert.equal(fakeForm(navigation.root.innerHTML).elements.keyword.value, '');
assert.ok(navigation.root.innerHTML.includes('Native Two'), 'reset returns the full list');

// Binding invariants match the channel module, including popup/force dependencies.
for (const id of ['BAD_POPUP', 'BAD_FORCE_POPUP', 'BAD_FORCE_TYPES', 'EMPTY_TYPES']) {
  const before = env.snapshot();
  assert.equal(env.bind(id, ['PK1', 'PK3']), false, id + ' must reject contradictory download settings');
  assert.equal(env.snapshot(), before);
}
assert.equal(env.bind('NATIVE', []), false);
assert.equal(env.bind('NATIVE', ['PK3']), false, 'displayed native content needs a native package');
assert.equal(env.bind('NATIVE', ['PK5']), false, 'current version must be published');
assert.equal(env.bind('MULTI', ['PK1']), false, 'every displayed type must have a package');
assert.equal(env.bind('NATIVE', ['PK2', 'PK3']), true, 'spare package types may remain bound');
assert.deepEqual(env.data.channels[0].packageIds, ['PK2', 'PK3']);
assert.equal(env.go[env.go.length - 1], 'channels', 'refresh active channel table after binding');
assert.equal(env.bind('CLOSED', []), true);

// Stop in-use package only after an atomic replacement across its channels.
env.click('disable', 'PK2');
env.set({replacement: ''});
assert.equal(env.submit(), false);
env.set({replacement: 'PK1'});
assert.equal(env.submit(), true);
assert.equal(env.find('PK2').status, 'disabled');
assert.deepEqual(env.data.channels[0].packageIds, ['PK1', 'PK3']);
env.click('restore', 'PK2');
assert.equal(env.submit(), true);
assert.equal(env.find('PK2').status, 'published');

// New versions are drafts; duplicate versions, unsafe URLs and nonnumeric builds fail.
env.click('new-version', 'PK1');
env.set({version: '2.0', build: '400', url: 'https://download.example.test/4.apk'});
const beforeDraft = env.snapshot();
assert.equal(env.submit(), false);
assert.equal(env.snapshot(), beforeDraft);
env.set({version: '4.0', build: '4x'});
assert.equal(env.submit(), false);
env.set({build: '400', url: 'javascript:alert(1)'});
assert.equal(env.submit(), false);
env.set({url: 'https://download.example.test/4.apk'});
env.fail = true;
assert.equal(env.submit(), false);
assert.equal(env.snapshot(), beforeDraft, 'failed persistence must not mutate saved state');
assert.equal(env.latest().form.elements.version.value, '4.0', 'failed persistence preserves form input');
assert.equal(env.latest().form.closed, false);
env.fail = false;
assert.equal(env.submit(), true);
assert.equal(env.find('PK1').currentVersion, '2.0');
assert.equal(env.find('PK1').versions.find(item => item.version === '4.0').status, 'draft');

// History sorts by creation date, then insertion order. Published rows have no edit action.
env.click('versions', 'PK1');
let historyHtml = env.latest().options.html;
assert.ok(historyHtml.indexOf('data-pkg-version="3.1"') < historyHtml.indexOf('data-pkg-version="3.0"'));
assert.ok(historyHtml.indexOf('data-pkg-version="2.0"') < historyHtml.indexOf('data-pkg-version="1.0"'));
assert.ok(!/data-pkg-action="edit-draft"[^>]*data-pkg-version="2\.0"/.test(historyHtml));
const beforeCancel = env.snapshot();
env.historyAction('edit-draft', '3.0');
env.set({version: '3.9', build: '390', url: 'https://download.example.test/cancel.apk'});
env.latest().form.closed = true; // The shared dialog cancel/close discards this form.
assert.equal(env.snapshot(), beforeCancel, 'closing an unsaved draft editor changes nothing');

// Draft edits exclude themselves from uniqueness validation and preserve published history.
env.click('versions', 'PK1');
env.historyAction('edit-draft', '3.0');
const publishedBefore = JSON.stringify(env.find('PK1').versions.filter(item => item.status === 'published'));
env.set({version: '2.0', build: '390', url: 'https://download.example.test/edit.apk'});
assert.equal(env.submit(), false, 'draft cannot take a published version number');
env.set({version: '3.1'});
assert.equal(env.submit(), false, 'draft cannot take another draft version number');
env.set({version: '3.0'});
assert.equal(env.submit(), true, 'unchanged own version number is permitted');
env.click('versions', 'PK1');
env.historyAction('edit-draft', '3.0');
env.set({version: '3.9', build: '390', url: 'https://download.example.test/edited.apk'});
const beforeEditFailure = env.snapshot();
env.fail = true;
assert.equal(env.submit(), false);
assert.equal(env.snapshot(), beforeEditFailure);
assert.equal(env.latest().form.elements.version.value, '3.9');
env.fail = false;
assert.equal(env.submit(), true);
assert.equal(env.find('PK1').versions.some(item => item.version === '3.0'), false);
assert.equal(env.find('PK1').versions.find(item => item.version === '3.9').createdAt, '2026-11-11');
assert.equal(env.find('PK1').currentVersion, '2.0');
assert.equal(JSON.stringify(env.find('PK1').versions.filter(item => item.status === 'published')), publishedBefore);
env.click('versions', 'PK1');
const dialogCount = env.dialogs.length;
env.historyAction('edit-draft', '2.0');
assert.equal(env.dialogs.length, dialogCount, 'published versions cannot be edited even through a synthetic action');
env.historyAction('publish-version', '3.9');
assert.equal(env.find('PK1').currentVersion, '2.0', 'opening publish confirmation changes nothing');
assert.equal(env.submit(), true);
assert.equal(env.find('PK1').currentVersion, '3.9');
assert.equal(env.find('PK1').versions.find(item => item.version === '2.0').status, 'published');

// PWA uses an entry URL; native files only retain metadata and platform-specific suffixes.
env.click('create');
env.set({name: 'PWA Draft', type: 'pwa', platform: 'Android', version: '1.0', build: '', url: 'https://download.example.test/pwa'});
let form = env.latest().form;
form.emit('change', {name: 'type'});
assert.equal(form.elements.platform.value, 'PWA');
assert.equal(form.nodes['[data-pkg-file-area]'].hidden, true);
assert.equal(form.elements.build.required, false);
form.elements.installEnabled.checked = true;
env.set({installAmount: '80', installCondition: 'bet'});
const beforeNewPackage = env.snapshot();
assert.equal(env.submit(), false);
assert.equal(env.snapshot(), beforeNewPackage, 'invalid reward does not create a partial package');
env.set({installMinimum: '400'});
assert.equal(env.submit(), true);
assert.deepEqual(env.data.packages[env.data.packages.length - 1].installReward, {enabled: true, amount: '80', condition: 'bet', minimum: '400'});
assert.equal(env.data.packages[env.data.packages.length - 1].status, 'draft');
assert.equal(env.data.packages[env.data.packages.length - 1].currentVersion, '');
env.click('new-version', 'PK1');
form = env.latest().form;
form.emit('change', {name: 'packageFile', value: '', files: [{name: 'bad.ipa', size: 1024}]});
assert.equal(form.elements.fileName.value, '');
form.emit('change', {name: 'packageFile', value: '', files: [{name: 'demo.aab', size: 2097152}]});
assert.equal(form.elements.fileName.value, 'demo.aab');
assert.equal(form.elements.fileSize.value, '2.00 MB');
assert.equal(form.dataset.pkgFileBytes, '2097152');
env.set({version: '5.0', build: '500', url: ''});
assert.equal(env.submit(), false, 'local file metadata does not replace required public download URL');
env.set({url: 'https://download.example.test/5.aab'});
assert.equal(env.submit(), true);
env.click('versions', 'PK1');
env.historyAction('edit-draft', '5.0');
assert.equal(env.latest().form.dataset.pkgFileBytes, '2097152', 'draft editor preserves existing file metadata');
form = env.latest().form;
form.emit('click', {closest: selector => selector === '[data-pkg-clear-file]' ? {} : null});
assert.equal(form.elements.fileName.value, '');
assert.equal(env.submit(), true);
assert.equal(env.find('PK1').versions.find(item => item.version === '5.0').fileBytes, 0);

const ios = {id: 'IOS', name: 'iOS Draft', type: 'native', platform: 'iOS', status: 'draft', currentVersion: '', versions: [draft('1.0', '2026-11-11')]};
env.data.packages.push(ios);
env.click('new-version', 'IOS');
form = env.latest().form;
assert.equal(form.elements.packageFile.accept, '.ipa');
form.emit('change', {name: 'packageFile', value: '', files: [{name: 'bad.apk', size: 1024}]});
assert.equal(form.elements.fileName.value, '');
form.emit('change', {name: 'packageFile', value: '', files: [{name: 'demo.ipa', size: 1024}]});
assert.equal(form.elements.fileName.value, 'demo.ipa');

// Each displayed kind/platform has one active package; other platforms and kinds coexist.
const unique = harness();
unique.data.channels = [channel('NATIVE', ['native'])];
const beforeDuplicate = unique.snapshot();
assert.equal(unique.bind('NATIVE', ['PK1', 'PK2']), false, 'two Android/native packages cannot compete for one download slot');
assert.equal(unique.snapshot(), beforeDuplicate);
unique.data.packages.push({id: 'IOSPUB', name: 'iOS Published', type: 'native', platform: 'iOS', status: 'published', currentVersion: '1.0', versions: [published('1.0', '2026-11-11')]});
assert.equal(unique.bind('NATIVE', ['PK1', 'IOSPUB', 'PK3', 'PK4']), true, 'different platforms and download kinds may coexist');
unique.data.channels[0].packageIds = ['PK1'];
unique.click('disable', 'PK1');
assert.equal(unique.latest().options.html.includes('value="IOSPUB"'), false, 'Android replacement selector excludes iOS');
assert.equal(unique.latest().options.html.includes('value="PK4"'), false, 'native replacement selector excludes fast packages');
const beforeWrongReplacement = unique.snapshot();
unique.set({replacement: 'IOSPUB'});
assert.equal(unique.submit(), false, 'submit rechecks replacement platform');
unique.set({replacement: 'PK4'});
assert.equal(unique.submit(), false, 'submit rechecks replacement download kind');
assert.equal(unique.snapshot(), beforeWrongReplacement);
unique.set({replacement: 'PK2'});
assert.equal(unique.submit(), true);
assert.deepEqual(unique.data.channels[0].packageIds, ['PK2']);

// Independent channel packages have immutable exclusive channel codes, including legacy data.
const exclusive = harness();
exclusive.data.channels = [channel('FACEBOOK', ['native']), channel('TIKTOK', ['native'])];
exclusive.data.packages.push({id: 'CP1', name: 'TikTok Independent', type: 'channel', channelCode: 'TIKTOK', platform: 'Android', status: 'published', currentVersion: '1.0', versions: [published('1.0', '2026-11-11')]});
assert.equal(exclusive.bind('FACEBOOK', ['CP1']), false, 'independent package cannot bind another channel code');
assert.equal(exclusive.bind('TIKTOK', ['CP1']), false, 'stop channel before first binding a new independent package');
exclusive.data.channels[1].status = 'disabled';
assert.equal(exclusive.bind('TIKTOK', ['CP1']), true);
exclusive.data.channels[1].status = 'enabled';
assert.equal(exclusive.bind('TIKTOK', ['CP1', 'PK2']), false, 'channel packages and native packages share the native download slot');
exclusive.data.packages.push({id: 'LEGACY', name: 'Legacy Independent', type: 'channel', platform: 'Android', status: 'published', currentVersion: '1.0', versions: [published('1.0', '2026-11-11')]});
assert.equal(exclusive.bind('FACEBOOK', ['LEGACY']), false, 'unassigned legacy independent package must be edited first');
exclusive.click('edit', 'LEGACY');
exclusive.set({channelCode: 'FACEBOOK'});
assert.equal(exclusive.submit(), true);
assert.equal(exclusive.find('LEGACY').channelCode, 'FACEBOOK');
assert.equal(exclusive.bind('FACEBOOK', ['LEGACY']), false, 'existing independent packages also require stopping the channel before a new binding');
exclusive.data.channels[0].status = 'disabled';
assert.equal(exclusive.bind('FACEBOOK', ['LEGACY']), true);
exclusive.data.channels[0].status = 'enabled';
exclusive.click('edit', 'LEGACY');
assert.ok(/name="channelCode"[^>]*readonly/.test(exclusive.latest().options.html));
exclusive.set({channelCode: 'TIKTOK'}); // Readonly field tampering must not move package ownership.
assert.equal(exclusive.submit(), true);
assert.equal(exclusive.find('LEGACY').channelCode, 'FACEBOOK');
delete exclusive.find('LEGACY').channelCode;
assert.equal(exclusive.module.packageChannelCode(exclusive.find('LEGACY'), exclusive.data), 'FACEBOOK', 'legacy package can derive its unique existing reference');
assert.equal(exclusive.bind('TIKTOK', ['LEGACY']), false, 'derived legacy ownership is also exclusive');
exclusive.click('edit', 'LEGACY');
assert.ok(/name="channelCode"[^>]*readonly/.test(exclusive.latest().options.html));
assert.equal(exclusive.submit(), true);
assert.equal(exclusive.find('LEGACY').channelCode, 'FACEBOOK', 'editing persists inferred ownership');
exclusive.click('create');
exclusive.set({name: 'New Independent', type: 'channel', platform: 'Android', version: '1.0', build: '100', url: 'https://download.example.test/channel.apk'});
exclusive.latest().form.emit('change', {name: 'type'});
assert.equal(exclusive.latest().form.nodes['[data-pkg-channel-code]'].hidden, false);
assert.equal(exclusive.submit(), false, 'creating independent package requires an existing channel code');
exclusive.set({channelCode: 'DOES_NOT_EXIST'});
assert.equal(exclusive.submit(), false);
exclusive.set({channelCode: 'TIKTOK'});
assert.equal(exclusive.submit(), false, 'stop owner channel before creating a new independent package');
exclusive.data.channels[1].status = 'disabled';
assert.equal(exclusive.submit(), true);
assert.equal(exclusive.data.packages[exclusive.data.packages.length - 1].channelCode, 'TIKTOK');
exclusive.click('versions', 'CP1');
assert.equal(exclusive.latest().options.readonly, true, 'version history uses shared read-only footer');
exclusive.module.render();
assert.ok(exclusive.root.innerHTML.includes('版本与发布'));
exclusive.click('conversion', 'CP1');
assert.equal(exclusive.lastGo.view, 'conversion');
assert.equal(exclusive.lastGo.context.packageId, 'CP1');

// Promotion requirements remain active when every download control is off.
const promotions = harness();
for (const type of ['pwa', 'native', 'channel', 'link', 'trial', 'download']) {
  promotions.data.channels = [Object.assign(channel('PROMOTION', [], {show: false, popup: false}), {type, packageIds: []})];
  const requiresPackage = ['pwa', 'native', 'channel'].includes(type);
  const before = promotions.snapshot();
  assert.equal(promotions.bind('PROMOTION', []), !requiresPackage, type + ' empty binding checks promotion independently of downloads');
  assert.equal(promotions.snapshot(), before);
  if (requiresPackage) {
    promotions.data.channels[0].status = 'disabled';
    assert.equal(promotions.bind('PROMOTION', []), true, 'disabled ' + type + ' channel may be recorded before making its package');
    promotions.data.channels[0].status = 'enabled';
  }
  if (type === 'pwa') {
    assert.equal(promotions.bind('PROMOTION', ['PK1']), false, 'native package cannot satisfy PWA promotion');
    assert.equal(promotions.bind('PROMOTION', ['PK3']), true);
  }
  if (type === 'native') {
    assert.equal(promotions.bind('PROMOTION', ['PK3']), false, 'PWA package cannot satisfy native promotion');
    assert.equal(promotions.bind('PROMOTION', ['PK4']), false, 'fast package cannot satisfy native promotion');
    assert.equal(promotions.bind('PROMOTION', ['PK1']), true);
  }
}

function independentPromotionHarness() {
  const result = harness();
  result.data.packages = [
    Object.assign(copy(result.find('PK1')), {id: 'PK1001'}),
    Object.assign(copy(result.find('PK3')), {id: 'PK1002'}),
    Object.assign(copy(result.find('PK2')), {id: 'PK1003', type: 'channel', channelCode: 'AFF002'}),
    Object.assign(copy(result.find('PK2')), {id: 'PK1004', type: 'channel', channelCode: 'AFF002'}),
    Object.assign(copy(result.find('PK2')), {id: 'PK1005', type: 'channel', channelCode: 'OTHER'})
  ];
  result.data.channels = [Object.assign(channel('CH1002', ['native', 'pwa']), {code: 'AFF002', type: 'channel', packageIds: ['PK1003', 'PK1002']})];
  return result;
}

// Real bypass: adjusting CH1002 keeps PWA/download coverage but removes its independent package.
const rebind = independentPromotionHarness();
const beforeRebind = rebind.snapshot();
assert.equal(rebind.bind('CH1002', ['PK1001', 'PK1002']), false, 'generic native plus PWA must not replace required independent package');
assert.equal(rebind.snapshot(), beforeRebind);
assert.equal(rebind.latest().form.closed, false);
assert.equal(rebind.bind('CH1002', ['PK1005', 'PK1002']), false, 'independent promotion still requires the matching owner code');
rebind.fail = true;
assert.equal(rebind.bind('CH1002', ['PK1004', 'PK1002']), false);
assert.equal(rebind.snapshot(), beforeRebind, 'failed binding persistence retains all previous bindings');
assert.deepEqual(rebind.latest().form.checked, ['PK1004', 'PK1002'], 'failed save retains binding selections');
assert.equal(rebind.latest().form.closed, false);
rebind.fail = false;
rebind.data.channels[0].status = 'disabled';
assert.equal(rebind.submit(), true);
assert.deepEqual(rebind.data.channels[0].packageIds, ['PK1004', 'PK1002']);

// The same promotion invariant guards replacement selection and submission during disable.
const stopIndependent = independentPromotionHarness();
stopIndependent.click('disable', 'PK1003');
assert.equal(stopIndependent.latest().options.html.includes('value="PK1001"'), false, 'generic native is not an independent-promotion replacement candidate');
assert.equal(stopIndependent.latest().options.html.includes('value="PK1004"'), true);
assert.equal(stopIndependent.latest().options.html.includes('value="PK1005"'), false);
const beforeStopIndependent = stopIndependent.snapshot();
stopIndependent.set({replacement: 'PK1001'});
assert.equal(stopIndependent.submit(), false, 'tampering replacement with generic native must fail');
assert.equal(stopIndependent.snapshot(), beforeStopIndependent);
stopIndependent.set({replacement: 'PK1004'});
stopIndependent.fail = true;
assert.equal(stopIndependent.submit(), false);
assert.equal(stopIndependent.snapshot(), beforeStopIndependent, 'failed disable persistence changes neither package nor channel');
assert.equal(stopIndependent.latest().form.elements.replacement.value, 'PK1004');
assert.equal(stopIndependent.latest().form.closed, false);
stopIndependent.fail = false;
assert.equal(stopIndependent.submit(), true);
assert.equal(stopIndependent.find('PK1003').status, 'disabled');
assert.deepEqual(stopIndependent.data.channels[0].packageIds, ['PK1004', 'PK1002']);

// Every referencing channel is validated and committed together, including late failures.
const atomic = harness();
atomic.data.channels = [channel('FIRST', ['native']), Object.assign(channel('SECOND', ['native', 'pwa']), {packageIds: ['PK1', 'PK3']})];
atomic.click('disable', 'PK1');
atomic.set({replacement: 'PK2'});
atomic.data.channels[1].download.types.push('fast'); // A later reference changes after confirmation opens.
const beforeLateFailure = atomic.snapshot();
assert.equal(atomic.submit(), false);
assert.equal(atomic.snapshot(), beforeLateFailure, 'later channel validation failure must not replace the first channel');
atomic.data.channels[1].download.types.pop();
const beforeAtomicSave = atomic.snapshot();
atomic.fail = true;
assert.equal(atomic.submit(), false);
assert.equal(atomic.snapshot(), beforeAtomicSave, 'failed batch persistence preserves both channels and the published package');
assert.equal(atomic.latest().form.closed, false);
atomic.fail = false;
assert.equal(atomic.submit(), true);
assert.deepEqual(atomic.data.channels.map(item => item.packageIds), [['PK2'], ['PK2', 'PK3']]);
assert.equal(atomic.find('PK1').status, 'disabled');

assert.equal(source.includes('\ufffd'), false, 'UTF-8 must contain no replacement characters');
assert.equal(/\?{3}/.test(source), false, 'Chinese text must not degrade to question marks');
console.log('PASS channel-management-packages: isolated package rewards, table reward states, basic editing, promotion requirements, binding slots, exclusive channel codes, atomic replacement, lifecycle, drafts, publishing, files and persistence');
