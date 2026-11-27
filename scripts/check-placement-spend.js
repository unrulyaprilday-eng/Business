'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../custom/js/placement-spend.js'), 'utf8');
const copy = value => JSON.parse(JSON.stringify(value));
let state = { channels: [
  { id: 'C1', code: 'AAAA', name: 'Alpha', currency: 'INR', media: 'Facebook', linkName: 'old-main', links: [{ id: 'L1', linkName: 'campaign-1', media: 'TikTok' }] },
  { id: 'C2', code: 'BBBB', name: 'Beta', currency: 'USD', media: 'Google', linkName: 'search' }
], spend: [], packages: [], global: {} };
let modal, failSave = false, lastDownload, lastGo, closeCount = 0, siteCurrency = 'INR';
const root = { innerHTML: '', attributes: {}, events: {}, getAttribute(name) { return this.attributes[name]; }, setAttribute(name, value) { this.attributes[name] = value; }, addEventListener(name, handler) { this.events[name] = handler; } };
const context = { console, Set, BigInt, Date, Number, String, JSON, Array, Object, Math, RegExp, Error, document: { getElementById: id => id === 'cm-spend' ? root : null }, FormData: class {
  constructor(form) { this.values = form.values; }
  forEach(fn) { Object.keys(this.values).forEach(key => fn(this.values[key], key)); }
}, window: { businessSiteCurrency: { read: () => siteCurrency }, CM: {
  getState: () => copy(state),
  saveState(next) { if (failSave) throw new Error('storage failed'); state = copy(next); },
  escape: value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]),
  dialog: options => { modal = options; }, toast() {}, download: (name, rows) => { lastDownload = { name, rows }; }, go: (view, values) => { lastGo = { view, values }; }
} } };
vm.createContext(context);
vm.runInContext(source.replace('window.CMSpend = { init: init, render: render };', 'window.CMSpend = { init: init, render: render }; window.__spend = { makeRecord: makeRecord, normalized: normalized, validateCSV: validateCSV, parseCSV: parseCSV, cents: cents, convert: convert, filtered: filtered, openEditor: openEditor, removeRecord: removeRecord, importCSV: importCSV, action: action, context: context };'), context);
const app = context.window.CMSpend, test = context.window.__spend;
const values = overrides => Object.assign({ date: '2026-11-12', channelId: 'C1', linkId: 'L1', originalCurrency: 'USDT', originalAmount: '12.35', exchangeRate: '83.72', note: '' }, overrides);
const submit = data => modal.onSubmit({ values: data }, () => { closeCount++; });
let checks = 0;
function check(name, body) { body(); checks++; process.stdout.write('PASS ' + name + '\n'); }
check('init binds once without replacing static content', () => { app.init(); const click = root.events.click; app.init(); assert.equal(root.events.click, click); assert.equal(root.innerHTML, ''); });
check('integer cents and decimal conversion round half up', () => {
  assert.equal(test.cents('0.29'), 29); assert.equal(test.convert(29, '1'), 29);
  assert.equal(test.convert(100, '1.005'), 101); assert.equal(test.convert(1235, '83.72'), 103394);
  assert.throws(() => test.cents('1.001')); assert.throws(() => test.cents('-1')); assert.throws(() => test.cents('1000000001'));
  assert.throws(() => test.convert(1, '0')); assert.throws(() => test.convert(100, '1e2'));
});
check('record uses selected link media and stores conversion snapshots', () => {
  const row = test.makeRecord(values(), state);
  assert.equal(row.media, 'TikTok'); assert.equal(row.linkName, 'campaign-1'); assert.equal(row.channelCode, 'AAAA');
  assert.equal(row.currency, 'INR'); assert.equal(row.amount, 1033.94); assert.equal(row.originalCurrency, 'USDT');
  const same = test.makeRecord(values({ originalCurrency: 'INR', exchangeRate: '0', originalAmount: '2.50' }), state);
  assert.equal(same.amount, 2.5); assert.equal(same.exchangeRate, 1);
});
check('all site currencies support original currency conversion and site currency templates', () => {
  const before = JSON.stringify(state);
  ['USD', 'BRL', 'IDR', 'INR'].forEach(code => {
    siteCurrency = code;
    ['USDT', 'INR', 'USD', code].forEach(originalCurrency => {
      const row = test.makeRecord(values({originalCurrency, originalAmount: '2.50', exchangeRate: '2'}), state);
      assert.equal(row.currency, code);
      assert.equal(row.amount, originalCurrency === code ? 2.5 : 5);
      assert.equal(row.exchangeRate, originalCurrency === code ? 1 : 2);
    });
    test.action('template'); assert.equal(lastDownload.rows[1][3], code);
    test.openEditor(); assert.match(modal.html, new RegExp('value="' + code + '" selected'));
    const imported = test.validateCSV('date,channelId,originalCurrency,originalAmount,exchangeRate\n2026-11-12,C1,' + code + ',2.50,0', state);
    assert.equal(imported[0].currency, code); assert.equal(imported[0].amount, 2.5);
  });
  assert.equal(JSON.stringify(state), before);
  siteCurrency = 'INR';
});
check('invalid bindings, unsupported currencies, and invalid dates rejected', () => {
  assert.throws(() => test.makeRecord(values({ channelId: 'missing' }), state));
  assert.throws(() => test.makeRecord(values({ linkId: 'foreign-link' }), state));
  assert.throws(() => test.makeRecord(values({ originalCurrency: 'EUR' }), state));
  assert.throws(() => test.makeRecord(values({ date: '2026-02-30' }), state));
});
check('legacy normalization and main link fallback', () => {
  const row = test.normalized({ id: 'old', date: '2026-11-01', channelId: 'C2', currency: 'USD', amount: 10, media: 'Google' }, state);
  assert.equal(row.originalCurrency, 'USD'); assert.equal(row.originalAmount, 10); assert.equal(row.exchangeRate, 1); assert.equal(row.note, '');
  const linked = test.makeRecord(values({ channelId: 'C2', linkId: 'LK-C2-MAIN', originalCurrency: 'USD', exchangeRate: '1' }), state);
  assert.equal(linked.linkName, 'search');
});
check('create saves one record without altering channels', () => {
  const channels = JSON.stringify(state.channels); test.openEditor(); submit(values());
  assert.equal(state.spend.length, 1); assert.equal(JSON.stringify(state.channels), channels); assert.equal(closeCount, 1);
});
check('duplicate create rejected and persisted data unchanged', () => {
  const before = JSON.stringify(state); test.openEditor(); assert.throws(() => submit(values()), /duplicate|重复/);
  assert.equal(JSON.stringify(state), before);
});
check('edit preserves historical association after channel changes', () => {
  const id = state.spend[0].id; state.channels[0].currency = 'USD'; state.channels[0].media = 'Google'; state.channels[0].links[0].media = 'Google';
  siteCurrency = 'BRL';
  test.openEditor(id); submit(values({ note: 'edited' }));
  assert.equal(state.spend[0].currency, 'INR'); assert.equal(state.spend[0].media, 'TikTok'); assert.equal(state.spend[0].note, 'edited');
  const rebound = test.makeRecord(values({linkId: '', originalCurrency: 'BRL', exchangeRate: '0'}), state, state.spend[0]);
  assert.equal(rebound.currency, 'BRL'); assert.equal(rebound.exchangeRate, 1);
  siteCurrency = 'INR';
  state.channels[0].currency = 'INR';
});
check('storage failure leaves draft dialog and stored list unchanged', () => {
  const before = JSON.stringify(state), closes = closeCount; failSave = true; test.openEditor();
  const draft = values({ originalAmount: '55.00' }); assert.throws(() => submit(draft), /storage failed/);
  assert.equal(JSON.stringify(state), before); assert.equal(draft.originalAmount, '55.00'); assert.equal(closeCount, closes); failSave = false;
});
check('delete removes only spend after confirmation and handles storage failure', () => {
  const before = JSON.stringify(state), id = state.spend[0].id; test.removeRecord(id); assert.equal(JSON.stringify(state), before);
  failSave = true; assert.throws(() => submit({}), /storage failed/); assert.equal(JSON.stringify(state), before);
  failSave = false; submit({}); assert.equal(state.spend.length, 0); assert.equal(state.channels.length, 2);
});
const header = 'date,channelId,linkId,originalCurrency,originalAmount,exchangeRate,note';
const csv = header + '\n2026-11-12,C1,L1,USDT,1.23,83.72,"quoted, note"\n2026-11-13,C2,,USD,5.00,1,"two\nlines"';
check('CSV parses BOM, escaped quotes and multiline cells', () => {
  const rows = test.parseCSV('\uFEFFa,b\r\n"a""b","line\nnext"\r\n'); assert.equal(rows[1][0], 'a"b'); assert.equal(rows[1][1], 'line\nnext');
  const records = test.validateCSV(csv, state); assert.equal(records.length, 2); assert.equal(records[0].amount, 102.98); assert.equal(records[1].date, '2026-11-13');
  assert.throws(() => test.parseCSV('a\n"bad')); assert.throws(() => test.parseCSV('a\n"b"x'));
});
check('CSV validates whole batch, duplicate keys, amounts and 1000 row limit', () => {
  assert.throws(() => test.validateCSV(header + '\n2026-11-12,C1,L1,INR,1,1,a\n2026-11-12,bad,,INR,1,1,a', state));
  assert.throws(() => test.validateCSV(header + '\n2026-11-12,C1,L1,INR,1,1,a\n2026-11-12,C1,L1,INR,1,1,a', state), /重复/);
  assert.throws(() => test.validateCSV(header + '\n2026-11-12,C1,L1,INR,1.001,1,a', state));
  assert.throws(() => test.validateCSV(header + '\n' + Array(1001).fill('2026-11-12,C1,,INR,1,1,a').join('\n'), state), /1000/);
  const old = test.validateCSV('date,channelId,media,currency,amount,note\n2026-11-12,C2,Google,INR,10.00,old', state);
  assert.equal(old[0].originalCurrency, 'INR'); assert.equal(old[0].exchangeRate, 1);
  assert.throws(() => test.validateCSV('date,channelId,media,currency,amount,note\n2026-11-12,C2,Google,USD,10.00,old', state));
});
function importForm(text) {
  const handlers = {}, csvHandlers = {}, nodes = {};
  ['[data-spend-preview]', '[data-spend-import-error]'].forEach(key => { nodes[key] = { innerHTML: '', textContent: '' }; });
  nodes['[data-spend-file]'] = { addEventListener() {} };
  return { elements: { csv: { value: text, addEventListener: (name, fn) => { csvHandlers[name] = fn; } } }, querySelector: key => nodes[key], addEventListener: (name, fn) => { handlers[name] = fn; }, preview() { handlers.click({ target: { closest: () => ({ getAttribute: () => 'preview' }) } }); }, invalidate() { csvHandlers.input(); }, nodes };
}
check('CSV requires current preview and writes atomically with retry after storage failure', () => {
  test.importCSV(); const form = importForm(csv); modal.onOpen(form);
  assert.throws(() => modal.onSubmit(form, () => {}), /预览/); form.preview();
  assert.match(form.nodes['[data-spend-preview]'].innerHTML, /102.98/);
  const before = JSON.stringify(state), closes = closeCount; failSave = true;
  assert.throws(() => modal.onSubmit(form, () => { closeCount++; }), /storage failed/);
  assert.equal(JSON.stringify(state), before); assert.equal(closeCount, closes);
  failSave = false; modal.onSubmit(form, () => { closeCount++; }); assert.equal(state.spend.length, 2);
  assert.throws(() => test.validateCSV(csv, state), /重复/);
});
check('changing CSV after preview requires a fresh validation', () => {
  test.importCSV(); const form = importForm(header + '\n2026-11-12,C2,,USD,7,1,new'); modal.onOpen(form); form.preview();
  form.elements.csv.value += '\n2026-11-12,C2,,USD,8,1,new'; form.invalidate();
  assert.throws(() => modal.onSubmit(form, () => {}), /预览/); assert.equal(state.spend.length, 2);
});
check('changing site currency after CSV preview requires review and preserves stored records', () => {
  test.importCSV(); const form = importForm(header + '\n2026-11-12,C2,,USD,7,1,new'); modal.onOpen(form); form.preview();
  const before = JSON.stringify(state); siteCurrency = 'IDR';
  assert.throws(() => modal.onSubmit(form, () => {}), /重新校验预览/);
  assert.equal(JSON.stringify(state), before); siteCurrency = 'INR';
});
check('filter exports all matching rows and forwards context to reports', () => {
  app.render({ start: '2026-11-01', end: '2026-11-30', channel: 'BBBB', currency: 'INR' });
  assert.match(root.innerHTML, /2026-11-13/); test.action('export');
  assert.equal(lastDownload.rows.length, 2); assert.equal(lastDownload.rows[1][1], 'C2'); assert.equal(lastDownload.rows[1][11], '5.00');
  test.action('roi'); assert.equal(lastGo.view, 'roi'); assert.equal(lastGo.values.channelId, 'C2'); assert.equal(lastGo.values.end, '2026-11-30');
  app.render({ link: '__unassigned' }); assert.equal(test.filtered(state).length, 1);
  app.render({ start: '2026-11-01', end: '2026-11-12', channelId: '', currency: '', link: '' });
  assert.equal(test.filtered(state).length, 1);
});
check('render escapes user content and preserves explicit currency columns', () => {
  state.spend[0].note = '<img src=x onerror=alert(1)>'; app.render();
  assert.equal(root.innerHTML.includes('<img src=x'), false); assert.match(root.innerHTML, /&lt;img/);
  assert.match(root.innerHTML, /原币金额/); assert.match(root.innerHTML, /报表币金额/);
});
check('cross-page entry prefills its link and synchronizes the visible filter query', () => {
  let lastContext;
  context.window.CM.navigateContext = values => { lastContext = copy(values); };
  app.render({ channelId: 'C1', link: 'campaign-1', start: '2026-11-01', end: '2026-11-12', entry: 'add' });
  assert.equal(lastContext.channelId, 'C1');
  assert.equal(lastContext.link, 'L1', 'Legacy display-name query resolves to the matching link ID');
  assert.equal(lastContext.entry, '');
  assert.match(root.innerHTML, /value="L1" selected/);
  assert.match(modal.html, /value="L1" selected/, 'The new record keeps the link selected before crossing pages');
  modal = null; app.render(); assert.equal(modal, null, 'Ordinary rerender does not reopen the entry dialog');
  app.render({ link: '__unassigned' }); test.action('roi');
  assert.equal(lastGo.values.link, '__unassigned', 'Unassigned-only scope must not expand to every link on navigation');
  assert.equal(lastContext.link, '__unassigned');
  delete context.window.CM.navigateContext;
});
check('removed links stay removed and historical report names resolve to stable main IDs', () => {
  const previous = copy(state);
  state.channels = [{id: 'CH1001', code: 'AAAA', name: 'Historical channel', currency: 'INR', media: 'Facebook', linkName: 'homepageads', links: []}];
  state.spend = [];
  assert.throws(() => test.makeRecord(values({channelId: 'CH1001', linkId: 'LK-CH1001-MAIN'}), state), /链接/);
  app.render({channelId: 'CH1001', link: ''});
  assert(!root.innerHTML.includes('value="LK-CH1001-MAIN"'), 'An empty link array must not recreate the removed main link');
  state.channels[0].links = [{id: 'LK-CH1001-MAIN', legacy: true, linkName: 'renamed-main', media: 'Facebook'}];
  state.spend = [{id: 'H1', date: '2026-11-12', channelId: 'CH1001', linkId: 'LK-CH1001-MAIN', linkName: 'renamed-main', media: 'Facebook', currency: 'INR', amount: 100, note: ''}];
  app.render({channelId: 'CH1001', start: '2026-11-01', end: '2026-11-12', link: 'homepageads', currency: ''});
  assert.equal(test.filtered(state).length, 1, 'Report historical label still reaches the stable link record after renaming');
  assert.match(root.innerHTML, /value="LK-CH1001-MAIN" selected/);
  state = previous;
});
process.stdout.write('Verified ' + checks + ' placement spend checks.\n');
