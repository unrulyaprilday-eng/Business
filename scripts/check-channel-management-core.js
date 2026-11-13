'use strict';

// Business invariants only. Hooks are injected into an in-memory source copy;
// no browser, production test API, dependency, or saved production data is used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.join(__dirname, '..');
const pageName = '新渠道管理';
const sourcePath = path.join(projectRoot, 'custom', 'js', pageName + '.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const packagesPath = path.join(projectRoot, 'custom', 'js', 'channel-management-packages.js');
const storageKey = 'business.channel-management.v1';
const startup = "  if (document.readyState === 'loading')";
assert.equal(source.split(startup).length, 2, 'Expected one startup hook location');
const injection = `
  window.__coreTest = {
    makeSeed: makeSeed, clone: clone, checkDownload: checkDownload, loadState: loadState,
    validateThresholds: validateThresholds, validPackage: validPackage,
    saveState: saveState, editor: editor, globalConfig: globalConfig,
    newChannel: newChannel, closeModal: closeModal, csvDownload: csvDownload,
    onAction: onAction, confirmStatus: confirmStatus,
    snapshot: function () { return clone(state); },
    reset: function () { state = makeSeed(); selected.clear(); filters = {}; },
    captureDialogs: function (capture) { dialog = capture; },
    suppressRendering: function () { renderChannels = function () {}; toast = function () {}; }
  };
`;

const saved = new Map();
let failStorage = false;
let capturedDialog;
let lastBlob;
let downloadAnchor;
let writeCount = 0;
const nodes = {
  'cm-form-status': {textContent: ''},
  'cm-channel-filter': {reset() {}},
  'cm-modal': {hidden: true},
  'cm-app': {inert: false}
};
const documentMock = {
  readyState: 'loading',
  addEventListener() {},
  contains() { return false; },
  getElementById(id) {
    assert.ok(nodes[id], 'Unexpected DOM dependency: ' + id);
    return nodes[id];
  },
  body: {style: {}, appendChild() {}},
  createElement(tag) {
    assert.equal(tag, 'a', 'Only CSV download anchors are expected');
    downloadAnchor = {style: {}, click() { this.clicked = true; }, remove() {}};
    return downloadAnchor;
  }
};
class FormDataMock {
  constructor(form) { this.values = form.values; }
  forEach(callback) {
    Object.entries(this.values).forEach(([name, value]) => {
      if (value == null) return;
      (Array.isArray(value) ? value : [value]).forEach(item => callback(item, name));
    });
  }
}
const context = {
  window: {setTimeout() { return 1; }, clearTimeout() {}},
  document: documentMock,
  localStorage: {
    getItem(key) { return saved.get(key) || null; },
    setItem(key, value) {
      if (failStorage) throw new Error('Storage denied');
      writeCount++;
      saved.set(key, value);
    }
  },
  FormData: FormDataMock,
  Blob,
  URL: {createObjectURL(blob) { lastBlob = blob; return 'blob:core-test'; }, revokeObjectURL() {}},
  navigator: {},
  console
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(packagesPath, 'utf8'), context, {filename: packagesPath});
vm.runInContext(source.replace(startup, injection + startup), context, {filename: sourcePath});
const core = context.window.__coreTest;
context.window.CM = {getState: core.snapshot};
core.captureDialogs(options => { capturedDialog = options; return {}; });
core.suppressRendering();
const plain = value => JSON.parse(JSON.stringify(value));

function reset() {
  core.reset();
  saved.clear();
  capturedDialog = null;
  writeCount = 0;
  failStorage = false;
  nodes['cm-form-status'].textContent = '';
}
function fakeForm(values) {
  return {
    values: plain(values),
    elements: new Proxy({}, {get() { return {focus() {}}; }}),
    querySelectorAll(selector) {
      const match = /^\[name=(packageIds|dl_type)\]:checked$/.exec(selector);
      return match ? (this.values[match[1]] || []).map(value => ({value})) : [];
    }
  };
}
function editorValues(channel) {
  return Object.assign({}, plain(channel), {
    packageIds: plain(channel.packageIds),
    dl_show: channel.download.show ? 'yes' : 'no',
    dl_popup: channel.download.popup ? 'yes' : 'no',
    dl_type: plain(channel.download.types),
    dl_force: channel.download.force,
    dl_days: String(channel.download.days),
    dl_deposits: String(channel.download.deposits),
    dl_withdrawals: String(channel.download.withdrawals),
    dl_inGame: channel.download.inGame ? 'yes' : null,
    dl_reward: channel.download.reward ? 'yes' : null,
    provider: channel.tracking.provider,
    pixel: channel.tracking.pixel,
    registerEvent: channel.tracking.registerEvent,
    firstPayEvent: channel.tracking.firstPayEvent,
    repeatPayEvent: channel.tracking.repeatPayEvent,
    phone: channel.restrictions.phone,
    email: channel.restrictions.email,
    region: channel.restrictions.region ? 'yes' : 'no',
    countries: channel.restrictions.countries,
    masked: channel.restrictions.masked ? 'yes' : null
  });
}
function submit(options, form) {
  let closed = false;
  const result = options.onSubmit(form, () => { closed = true; });
  return {closed, result};
}
const tests = [];
function test(name, run) { tests.push({name, run}); }

test('Static page keeps local assets, empty Axure base, unique IDs and fallback content', () => {
  const html = fs.readFileSync(path.join(projectRoot, pageName + '.html'), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'HTML IDs must be unique');
  assert.match(html, /<div\b[^>]*\bid="base"[^>]*>\s*<\/div>/);
  assert.match(html, /<tbody\b[^>]*id="cm-channel-rows"[^>]*>\s*<tr>/);
  for (const id of ['cm-packages', 'cm-reports', 'cm-modal', 'cm-toast', 'cm-advanced', 'cm-batch-bar']) {
    const tag = [...html.matchAll(/<[a-z][^>]*>/gi)].map(match => match[0]).find(value => value.includes('id="' + id + '"'));
    assert.ok(tag && /\bhidden\b/.test(tag), id + ' must start hidden');
  }
  const urls = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(match => match[1]);
  const generatedLinks = [...source.matchAll(/\bhref="([^"#?]+\.html)"/g)].map(match => match[1]);
  for (const url of urls.concat(generatedLinks)) {
    assert.ok(!/^(?:[a-z]+:|\/|\\|[A-Z]:)/i.test(url), 'Page references must be relative: ' + url);
    const file = decodeURIComponent(url.split(/[?#]/)[0]);
    if (file) assert.ok(fs.existsSync(path.join(projectRoot, file)), 'Missing page reference: ' + file);
  }
  assert.match(html, new RegExp('<title>' + pageName + '</title>'));
  assert.match(html, /data-axure-page-id="placement_channel_management"/);
});

test('Axure runtime order matches the stable report page and custom modules load last', () => {
  const html = fs.readFileSync(path.join(projectRoot, pageName + '.html'), 'utf8');
  const stable = fs.readFileSync(path.join(projectRoot, '渠道报表.html'), 'utf8');
  const scriptTags = value => [...value.matchAll(/<script\b([^>]*\bsrc="([^"]+)"[^>]*)>/gi)];
  const runtime = value => scriptTags(value).map(match => match[2]).filter(url => url.startsWith('resources/scripts/') && !url.endsWith('/ios.js'));
  assert.deepEqual(runtime(html), runtime(stable));
  for (const match of scriptTags(html)) {
    if (match[2].startsWith('resources/scripts/')) assert.doesNotMatch(match[1], /\b(?:defer|async)\b/i);
  }
  const scripts = scriptTags(html).map(match => match[2]);
  assert.ok(scripts.indexOf('data/document.js') < scripts.indexOf('files/' + pageName + '/data.js'));
  const requiredTail = ['custom/js/axure-custom-page-ready.js', 'resources/scripts/axure/ios.js', 'custom/js/channel-management-packages.js', 'custom/js/channel-management-reports.js', 'custom/js/' + pageName + '.js'];
  assert.deepEqual(scripts.slice(-requiredTail.length), requiredTail);
  assert.ok(html.indexOf('id="cm-modal"') < html.indexOf('src="custom/js/axure-custom-page-ready.js"'));
});

test('Menu identity, first position, page data and saved snapshot remain aligned', () => {
  let documentData, pageData;
  vm.runInNewContext(fs.readFileSync(path.join(projectRoot, 'data', 'document.js'), 'utf8'), {$axure: {loadDocument(value) { documentData = value; }}});
  vm.runInNewContext(fs.readFileSync(path.join(projectRoot, 'files', pageName, 'data.js'), 'utf8'), {$axure: {loadCurrentPage(value) { pageData = value; }}});
  const snapshot = JSON.parse(fs.readFileSync(path.join(__dirname, 'ai-menu-snapshot.json'), 'utf8'));
  const all = [];
  function walk(nodes) { for (const node of nodes || []) { all.push(node); walk(node.children); } }
  walk(documentData.sitemap.rootNodes);
  assert.equal(all.filter(node => node.id === 'placement_channel_management').length, 1);
  assert.equal(new Set(all.map(node => node.id)).size, all.length, 'Sitemap IDs must be unique');
  const parent = all.find(node => node.id === 'agent_placement_management');
  assert.ok(parent, 'Expected placement management menu');
  assert.equal(parent.children[0].id, 'placement_channel_management');
  assert.equal(parent.children[0].pageName, pageName);
  assert.equal(parent.children[0].url, pageName + '.html');
  const snapshotNodes = [];
  function collect(nodes) { for (const node of nodes || []) { snapshotNodes.push(node); collect(node.children); } }
  collect(snapshot.rootNodes);
  const savedParent = snapshotNodes.find(node => node.id === 'agent_placement_management');
  assert.deepEqual(plain(savedParent), plain(parent), 'Placement subtree must match the saved menu baseline');
  assert.equal(pageData.url, pageName + '.html');
  assert.equal(pageData.page.name, pageName);
  assert.equal(pageData.page.packageId, 'placement_channel_management');
  for (const key of ['defaultAdaptiveView', 'adaptiveViews', 'sketchKeys', 'variables']) assert.ok(key in pageData, 'Missing page-data field: ' + key);
  for (const key of ['masters', 'objectPaths']) assert.ok(key in pageData.page, 'Missing page field: ' + key);
  assert.ok(Array.isArray(pageData.page.diagram.objects));
  assert.ok(Array.isArray(pageData.page.annotations));
});

test('Renamed page and menu Chinese labels retain the expected Unicode code points', () => {
  assert.deepEqual([...pageName].map(character => character.codePointAt(0)), [0x65b0, 0x6e20, 0x9053, 0x7ba1, 0x7406]);
  for (const relative of [pageName + '.html', 'custom/js/' + pageName + '.js', 'custom/css/' + pageName + '.css', 'files/' + pageName + '/data.js', 'data/document.js', 'scripts/ai-menu-snapshot.json']) {
    const text = fs.readFileSync(path.join(projectRoot, relative), 'utf8');
    assert.ok(!text.includes('\ufffd'), 'Unexpected replacement character: ' + relative);
    if (relative.endsWith('.html') || relative.endsWith('/data.js') || relative === 'data/document.js' || relative.endsWith('.json')) assert.ok(text.includes(pageName), 'Expected page label missing or corrupted: ' + relative);
    assert.ok(!/\?{3,}/.test(text), 'Suspicious question-mark label: ' + relative);
  }
});

test('Seed channels reference valid packages and satisfy download policy', () => {
  const seed = core.snapshot();
  assert.equal(seed.channels.length, 6);
  assert.equal(seed.packages.length, 5);
  assert.equal(new Set(seed.channels.map(channel => channel.id)).size, 6);
  assert.equal(new Set(seed.channels.map(channel => channel.code.toLowerCase())).size, 6);
  assert.equal(seed.packages.find(pkg => pkg.id === 'PK1003').channelCode, 'CCCC');
  seed.channels.forEach(channel => {
    channel.packageIds.forEach(id => assert.ok(seed.packages.some(pkg => pkg.id === id)));
    assert.equal(core.checkDownload(channel, seed.packages), '', channel.id);
  });
  const snapshot = core.snapshot();
  snapshot.channels[0].download.types.length = 0;
  assert.ok(core.snapshot().channels[0].download.types.length > 0, 'Read snapshots must not mutate state');
});

test('Core delegates binding constraints to the real package module', () => {
  const seed = core.snapshot(), channel = plain(seed.channels[0]);
  const original = context.window.CMPackages.validateBindings;
  let calls = 0;
  context.window.CMPackages.validateBindings = function (target, ids, state) {
    calls++;
    assert.equal(target.code, channel.code);
    assert.deepEqual(plain(ids), plain(channel.packageIds));
    assert.deepEqual(plain(state.packages), plain(seed.packages));
    assert.equal(original(target, ids, state), '');
    return 'Binding rejection sentinel';
  };
  try { assert.equal(core.checkDownload(channel, seed.packages), 'Binding rejection sentinel'); }
  finally { context.window.CMPackages.validateBindings = original; }
  assert.equal(calls, 1);
});

test('Duplicate download slots fail while Android and iOS native packages coexist', () => {
  const seed = core.snapshot(), channel = plain(seed.channels[0]);
  const android = plain(seed.packages.find(pkg => pkg.id === 'PK1001'));
  android.id = 'PK_ANDROID_DUPLICATE';
  seed.packages.push(android);
  channel.packageIds.push(android.id);
  assert.ok(core.checkDownload(channel, seed.packages), 'Two native Android packages must fail');
  android.platform = 'iOS';
  assert.equal(core.checkDownload(channel, seed.packages), '', 'Android and iOS may share the native display group');
  channel.packageIds.push('MISSING_PACKAGE');
  assert.ok(core.checkDownload(channel, seed.packages), 'Unknown selections must fail even when other packages cover every requested type');
});

test('Independent packages enforce explicit channel codes with case-insensitive matching', () => {
  const seed = core.snapshot(), channel = plain(seed.channels.find(item => item.code === 'CCCC'));
  const pkg = seed.packages.find(item => item.id === 'PK1003');
  pkg.channelCode = 'cccc';
  assert.equal(core.checkDownload(channel, seed.packages), '');
  pkg.channelCode = 'AAAA';
  assert.ok(core.checkDownload(channel, seed.packages), 'A channel-specific package cannot serve another channel');
  pkg.channelCode = '';
  channel.code = 'UNRELATED';
  assert.ok(core.checkDownload(channel, seed.packages), 'Legacy inference must not authorize an unrelated channel');
});

test('Legacy package channel codes normalize in memory without writing local storage', () => {
  const legacy = plain(core.makeSeed());
  delete legacy.packages.find(pkg => pkg.id === 'PK1003').channelCode;
  const raw = JSON.stringify(legacy);
  saved.set(storageKey, raw);
  const loaded = core.loadState();
  assert.equal(loaded.packages.find(pkg => pkg.id === 'PK1003').channelCode, 'CCCC');
  assert.equal(writeCount, 0, 'Reading legacy state must not automatically persist migration');
  assert.equal(saved.get(storageKey), raw);
  legacy.channels[0].packageIds.push('PK1003');
  saved.set(storageKey, JSON.stringify(legacy));
  assert.ok(!core.loadState().packages.find(pkg => pkg.id === 'PK1003').channelCode, 'Ambiguous legacy ownership cannot be inferred');
  legacy.packages.find(pkg => pkg.id === 'PK1003').channelCode = 'EXPLICIT';
  saved.set(storageKey, JSON.stringify(legacy));
  assert.equal(core.loadState().packages.find(pkg => pkg.id === 'PK1003').channelCode, 'EXPLICIT');
  assert.equal(writeCount, 0);
});

test('Downloads require published coverage and native content for forced APP use', () => {
  const seed = core.snapshot();
  const channel = plain(seed.channels[0]);
  channel.packageIds = ['PK1002'];
  assert.ok(core.checkDownload(channel, seed.packages), 'Missing native package must fail');
  channel.download.types = ['pwa'];
  assert.equal(core.checkDownload(channel, seed.packages), '');
  channel.download.force = 'app';
  assert.ok(core.checkDownload(channel, seed.packages), 'PWA alone cannot satisfy forced APP');
  channel.packageIds.push('PK1001');
  assert.ok(core.checkDownload(channel, seed.packages), 'A hidden native option still cannot satisfy forced APP');
  channel.download.types.push('native');
  assert.equal(core.checkDownload(channel, seed.packages), '');
  seed.packages.find(pkg => pkg.id === 'PK1001').status = 'draft';
  assert.ok(core.checkDownload(channel, seed.packages), 'Draft packages cannot satisfy download coverage');
});

test('Hidden entry, popup and force policies remain consistent', () => {
  const seed = core.snapshot(), channel = plain(seed.channels[0]);
  channel.download.show = false;
  assert.ok(core.checkDownload(channel, seed.packages));
  channel.download.popup = false;
  channel.download.force = 'remind';
  assert.ok(core.checkDownload(channel, seed.packages));
  channel.download.show = true;
  assert.ok(core.checkDownload(channel, seed.packages), 'Forced reminder requires popup');
  channel.download.force = 'none';
  channel.download.show = false;
  channel.download.types = [];
  channel.packageIds = [];
  assert.equal(core.checkDownload(channel, seed.packages), '', 'Fully disabled download requires no package');
});

test('Reminder thresholds accept only integers within business limits', () => {
  assert.equal(core.validateThresholds({days: 0, deposits: 0, withdrawals: 0}), true);
  assert.equal(core.validateThresholds({days: 3650, deposits: 9999, withdrawals: 9999}), true);
  for (const [key, value] of [['days', -1], ['days', 3651], ['deposits', 1.5], ['deposits', 10000], ['withdrawals', NaN], ['withdrawals', Infinity]]) {
    assert.equal(core.validateThresholds(Object.assign({days: 0, deposits: 0, withdrawals: 0}, {[key]: value})), false, key + ': ' + value);
  }
});

test('Saving is atomic on storage failure and isolates caller-owned data', () => {
  const before = core.snapshot(), next = core.snapshot();
  next.channels[0].name = 'Changed';
  failStorage = true;
  assert.throws(() => core.saveState(next), /保存失败/);
  assert.deepEqual(plain(core.snapshot()), plain(before));
  assert.equal(saved.size, 0);
  failStorage = false;
  core.saveState(next);
  next.channels[0].name = 'Changed after save';
  assert.equal(core.snapshot().channels[0].name, 'Changed');
  assert.equal(JSON.parse([...saved.values()][0]).channels[0].name, 'Changed');
});

test('Editor creates a channel and updates only the saved channel', () => {
  core.editor();
  const values = editorValues(core.snapshot().channels[0]);
  Object.assign(values, {name: 'Created channel', code: 'TEST_NEW', linkName: 'test-new'});
  const created = submit(capturedDialog, fakeForm(values));
  assert.equal(created.closed, true);
  assert.equal(core.snapshot().channels.length, 7);
  const added = core.snapshot().channels[0];
  assert.equal(added.code, 'TEST_NEW');
  core.editor(added.id);
  const changed = editorValues(added);
  Object.assign(changed, {name: 'Edited channel', currency: 'USD'});
  assert.equal(submit(capturedDialog, fakeForm(changed)).closed, true);
  assert.equal(core.snapshot().channels.length, 7);
  assert.equal(core.snapshot().channels[0].name, 'Edited channel');
  assert.equal(core.snapshot().channels[0].currency, 'INR', 'Editing must not change historical currency');
  assert.equal(core.snapshot().channels[1].name, core.makeSeed().channels[0].name);
});

test('Editor duplicate codes are rejected before storage and remain editable', () => {
  const before = core.snapshot();
  core.editor();
  const values = editorValues(before.channels[0]);
  Object.assign(values, {name: 'Duplicate', code: 'aaaa'});
  const form = fakeForm(values);
  assert.equal(submit(capturedDialog, form).closed, false);
  assert.equal(writeCount, 0);
  assert.deepEqual(plain(core.snapshot()), plain(before));
  assert.match(nodes['cm-form-status'].textContent, /已存在/);
  assert.equal(form.values.name, 'Duplicate');
});

test('Enabled promotion types require their matching published package', () => {
  const before = core.snapshot(), original = before.channels[0];
  for (const entry of [
    {type: 'pwa', packageIds: ['PK1001'], dl_type: ['native']},
    {type: 'native', packageIds: ['PK1002'], dl_type: ['pwa']},
    {type: 'channel', packageIds: ['PK1001', 'PK1002'], dl_type: ['pwa', 'native']}
  ]) {
    core.editor(original.id);
    const values = Object.assign(editorValues(original), entry);
    assert.equal(submit(capturedDialog, fakeForm(values)).closed, false, entry.type);
    assert.equal(writeCount, 0);
    assert.deepEqual(plain(core.snapshot()), plain(before));
  }
});

test('Disabled independent promotion can be saved before its dedicated package exists', () => {
  const original = core.snapshot().channels[0];
  core.editor(original.id);
  const values = Object.assign(editorValues(original), {type: 'channel', status: 'disabled'});
  assert.equal(submit(capturedDialog, fakeForm(values)).closed, true);
  assert.equal(core.snapshot().channels[0].status, 'disabled');
  assert.equal(core.snapshot().channels[0].type, 'channel');
});

test('Enabling a disabled promotion revalidates its required package before any save', () => {
  const next = core.snapshot(), channel = next.channels[0];
  channel.type = 'channel';
  channel.status = 'disabled';
  core.saveState(next);
  const before = core.snapshot(), previousWrites = writeCount;
  core.confirmStatus([channel.id], true);
  assert.throws(() => submit(capturedDialog, fakeForm({})), /专属|渠道包/);
  assert.equal(writeCount, previousWrites, 'Rejected enable must not persist');
  assert.deepEqual(plain(core.snapshot()), plain(before));
});

test('Cancel and failed editor persistence do not apply drafts', () => {
  const before = core.snapshot();
  core.editor(before.channels[0].id);
  const values = editorValues(before.channels[0]);
  values.name = 'Unsaved draft';
  const form = fakeForm(values);
  core.closeModal();
  assert.deepEqual(plain(core.snapshot()), plain(before));
  core.editor(before.channels[0].id);
  failStorage = true;
  let closed = false;
  assert.throws(() => capturedDialog.onSubmit(form, () => { closed = true; }), /保存失败/);
  assert.equal(closed, false);
  assert.equal(form.values.name, 'Unsaved draft');
  assert.deepEqual(plain(core.snapshot()), plain(before));
  failStorage = false;
  assert.equal(submit(capturedDialog, form).closed, true, 'The same draft must remain saveable');
  assert.equal(core.snapshot().channels[0].name, 'Unsaved draft');
});

test('Public defaults apply to future channels without rewriting existing ones', () => {
  const before = core.snapshot();
  core.globalConfig();
  const result = submit(capturedDialog, fakeForm({domain: 'new.example.com', currency: 'USD', language: '简体中文', show: 'yes', popup: 'yes', phone: 'required', email: 'required', maskLinks: 'yes', rechargeApp: 'yes', rechargeCount: '4'}));
  assert.equal(result.closed, true);
  assert.deepEqual(plain(core.snapshot().channels), plain(before.channels));
  const next = core.newChannel();
  assert.equal(next.domain, 'new.example.com');
  assert.equal(next.currency, 'USD');
  assert.equal(next.language, '简体中文');
  assert.equal(next.download.deposits, 4);
  assert.equal(next.restrictions.masked, true);
  assert.equal(next.restrictions.phone, 'required');
});

test('Batch-created package promotion types stay disabled and cannot enable without a package', () => {
  for (const type of ['pwa', 'native', 'channel']) {
    core.onAction('batch-add');
    const before = core.snapshot();
    const form = fakeForm({media: 'TikTok', type, rows: 'Batch ' + type + ',BATCH_' + type + ',batch-' + type});
    assert.equal(submit(capturedDialog, form).closed, true, type);
    const next = core.snapshot(), channel = next.channels[0];
    assert.equal(next.channels.length, before.channels.length + 1);
    assert.deepEqual(plain(next.channels.slice(1)), plain(before.channels));
    assert.equal(channel.type, type);
    assert.equal(channel.status, 'disabled');
    assert.deepEqual(plain(channel.packageIds), []);
    assert.equal(channel.download.show, false);
    assert.equal(channel.download.popup, false);
    assert.equal(channel.download.force, 'none');
    assert.deepEqual(plain(channel.download.types), []);
    assert.equal(core.checkDownload(channel, next.packages), '', type + ' must be a valid saved draft');
    const previousWrites = writeCount, stored = saved.get(storageKey);
    core.confirmStatus([channel.id], true);
    assert.throws(() => submit(capturedDialog, fakeForm({})), /PWA|原生|专属|渠道包/, type);
    assert.equal(writeCount, previousWrites, 'Blocked enable must not persist: ' + type);
    assert.deepEqual(plain(core.snapshot()), plain(next));
    assert.equal(saved.get(storageKey), stored);
  }
});

test('Batch-created link, trial and download promotions may enable with download controls off', () => {
  for (const [type, destination] of [['link', 'lobby'], ['trial', 'trial'], ['download', 'download']]) {
    core.onAction('batch-add');
    const before = core.snapshot();
    assert.equal(submit(capturedDialog, fakeForm({media: 'Google', type, rows: 'Batch ' + type + ',BATCH_' + type + ',batch-' + type})).closed, true);
    const next = core.snapshot(), channel = next.channels[0];
    assert.equal(next.channels.length, before.channels.length + 1);
    assert.equal(channel.type, type);
    assert.equal(channel.status, 'enabled');
    assert.equal(channel.destination, destination);
    assert.deepEqual(plain(channel.packageIds), []);
    assert.equal(channel.download.show, false);
    assert.equal(channel.download.popup, false);
    assert.equal(channel.download.force, 'none');
    assert.deepEqual(plain(channel.download.types), []);
    assert.equal(core.checkDownload(channel, next.packages), '');
    assert.equal(channel.tracking.provider, '无');
  }
});

test('Existing and within-batch duplicate codes reject the entire batch before saving', () => {
  for (const rows of ['First,BATCH_FIRST,first-link\nExisting,aaaa,existing-link', 'First,BATCH_DUPLICATE,first-link\nDuplicate,batch_duplicate,duplicate-link']) {
    const before = core.snapshot();
    core.onAction('batch-add');
    const form = fakeForm({media: 'Facebook', type: 'link', rows});
    let closed = false;
    assert.throws(() => capturedDialog.onSubmit(form, () => { closed = true; }), /编码重复/);
    assert.equal(closed, false);
    assert.equal(writeCount, 0);
    assert.equal(saved.size, 0);
    assert.deepEqual(plain(core.snapshot()), plain(before));
    assert.equal(form.values.rows, rows, 'The whole rejected batch remains editable');
  }
});

test('Batch creation validates every channel before committing any row', () => {
  const before = core.snapshot(), original = context.window.CMPackages.validateBindings;
  let calls = 0;
  context.window.CMPackages.validateBindings = function (channel, ids, state) {
    calls++;
    assert.equal(original(channel, ids, state), '');
    return channel.code === 'BATCH_SECOND' ? 'Batch binding rejection sentinel' : '';
  };
  try {
    core.onAction('batch-add');
    const form = fakeForm({media: 'Facebook', type: 'link', rows: 'First,BATCH_FIRST,first-link\nSecond,BATCH_SECOND,second-link'});
    let closed = false;
    assert.throws(() => capturedDialog.onSubmit(form, () => { closed = true; }), /Batch binding rejection sentinel/);
    assert.equal(closed, false);
    assert.equal(calls, 2, 'Each row must pass real package validation before saving');
    assert.equal(writeCount, 0);
    assert.equal(saved.size, 0);
    assert.deepEqual(plain(core.snapshot()), plain(before));
  } finally { context.window.CMPackages.validateBindings = original; }
});

test('Batch persistence failure keeps all rows unchanged and the same draft remains saveable', () => {
  const before = core.snapshot();
  core.saveState(before);
  const stored = saved.get(storageKey), previousWrites = writeCount;
  core.onAction('batch-add');
  const form = fakeForm({media: 'TikTok', type: 'link', rows: 'First,BATCH_FIRST,first-link\nSecond,BATCH_SECOND,second-link'});
  failStorage = true;
  let closed = false;
  assert.throws(() => capturedDialog.onSubmit(form, () => { closed = true; }), /保存失败/);
  assert.equal(closed, false);
  assert.equal(writeCount, previousWrites);
  assert.equal(saved.get(storageKey), stored, 'Failed persistence must keep the previously saved data');
  assert.deepEqual(plain(core.snapshot()), plain(before));
  assert.match(form.values.rows, /BATCH_SECOND/);
  failStorage = false;
  assert.equal(submit(capturedDialog, form).closed, true);
  assert.equal(writeCount, previousWrites + 1);
  assert.equal(core.snapshot().channels.length, before.channels.length + 2);
  assert.equal(new Set(core.snapshot().channels.map(channel => channel.id)).size, before.channels.length + 2);
  assert.deepEqual(plain(core.snapshot().channels.slice(2)), plain(before.channels));
  assert.deepEqual(plain(JSON.parse(saved.get(storageKey))), plain(core.snapshot()));
});

test('CSV preserves UTF-8 BOM, quoted newlines and formula-injection protection', async () => {
  core.csvDownload('导出.csv', [['渠道', 'text', 'formula', 'number'], ['中文', 'a,"b"\nnext', '=SUM(A1)', -12]]);
  assert.equal(downloadAnchor.clicked, true);
  assert.equal(downloadAnchor.download, '导出.csv');
  assert.equal(lastBlob.type, 'text/csv;charset=utf-8');
  const bytes = Buffer.from(await lastBlob.arrayBuffer());
  assert.equal(bytes.subarray(0, 3).toString('hex'), 'efbbbf');
  const csv = bytes.toString('utf8');
  assert.ok(csv.includes('"中文"'));
  assert.ok(csv.includes('"a,""b""\nnext"'));
  assert.ok(csv.includes('"\'=SUM(A1)"'));
  assert.ok(csv.includes('"-12"'), 'Actual numeric negatives must not receive a text apostrophe');
});

(async function run() {
  for (const item of tests) {
    reset();
    await item.run();
    console.log('PASS ' + item.name);
  }
  console.log('Channel management core checks passed: ' + tests.length);
})().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
