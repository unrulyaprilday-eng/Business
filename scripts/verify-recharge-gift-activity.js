/* Targeted static/VM checks. No server, browser or external packages required. */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const page = String.fromCodePoint(0x65b0, 0x589e, 0x6d3b, 0x52a8);
const list = String.fromCodePoint(0x4f18, 0x60e0, 0x6d3b, 0x52a8, 0x5217, 0x8868);
const html = fs.readFileSync(page + '.html', 'utf8');
const source = fs.readFileSync('custom/js/recharge-gift-activity.js', 'utf8');
const core = fs.readFileSync('custom/js/' + page + '.js', 'utf8');
const listSource = fs.readFileSync('custom/js/' + list + '.js', 'utf8');
const css = fs.readFileSync('custom/css/recharge-gift-activity.css', 'utf8');
const key = 'promoRechargeGiftActivities';

// Validate actual tag nesting, especially the extra state in the Axure panel.
const stack = [];
const ids = new Map();
for (const match of html.matchAll(/<!--[\s\S]*?-->|<\/?([a-z][a-z0-9]*)\b[^>]*>/gi)) {
  if (!match[1]) continue;
  const tag = match[1].toLowerCase();
  if (match[0].startsWith('</')) {
    const index = stack.map(item => item.tag).lastIndexOf(tag);
    if (index >= 0) stack.length = index;
    continue;
  }
  const idMatch = match[0].match(/\bid="([^"]+)"/);
  const entry = { tag, id: idMatch && idMatch[1], parent: stack[stack.length - 1] };
  if (entry.id) { assert(!ids.has(entry.id), 'duplicate id: ' + entry.id); ids.set(entry.id, entry); }
  if (!/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag) && !match[0].endsWith('/>')) stack.push(entry);
}
assert.equal(ids.get('u6_state8').parent.id, 'u6');
assert.equal([...ids.values()].filter(item => item.parent && item.parent.id === 'u6' && /^u6_state\d+$/.test(item.id)).length, 10);
for (const match of source.matchAll(/byId\('([^']+)'\)/g)) assert(ids.has(match[1]), 'missing form control: ' + match[1]);
assert(!/\?{3,}|\ufffd/.test(html + source + css + listSource), 'invalid text encoding');
assert(css.includes('appearance: none') && css.includes('[hidden]'), 'scoped controls/hidden styles');
assert(html.includes('custom/js/recharge-gift-activity.js') && html.includes('custom/css/recharge-gift-activity.css'));
assert(core.includes('"\\u5145\\u503c\\u9001\\u91d1": 8'));
assert.equal((html.match(/data-rg-member="/g) || []).length, 18);

function control(value = '') {
  return { value, disabled: false, hidden: false, checked: false, textContent: '', innerHTML: '', attributes: {},
    setAttribute(name, next) { this.attributes[name] = next; }, getAttribute(name) { return this.attributes[name]; },
    focus() {}, scrollIntoView() {}, removeAttribute(name) { delete this.attributes[name]; } };
}
function tier(end, percent = '5') {
  const controls = { '.rg-vip-end': control(String(end)), '.rg-percent': control(String(percent)), '.rg-tier': control(), '[data-rg-delete-tier]': control() };
  return { querySelector(selector) { return controls[selector]; }, cloneNode() { return tier(controls['.rg-vip-end'].value, controls['.rg-percent'].value); } };
}
function amountTier(deposit = '', gift = '') {
  const controls = { '.rg-deposit-amount': control(String(deposit)), '.rg-gift-amount': control(String(gift)), '.rg-amount-index': control(), '[data-rg-delete-amount-tier]': control() };
  return { querySelector(selector) { return controls[selector]; }, cloneNode() { return amountTier(controls['.rg-deposit-amount'].value, controls['.rg-gift-amount'].value); } };
}
function formHarness(search = '', initial = []) {
  const nodes = {};
  for (const id of ids.keys()) if (id.startsWith('rechargeGift')) nodes[id] = control();
  let rows = [tier(15)];
  let amountRows = [amountTier()];
  let members = ['VIP1'];
  const radioGroups = Object.fromEntries(Object.entries({ rechargeGiftTarget: ['余额', '存钱罐'], rechargeGiftClaim: ['immediate', 'manual'], rechargeGiftRewardMode: ['ratio', 'amount'], rechargeGiftDepositMode: ['cumulative', 'single'] }).map(([name, values]) => [name, values.map((value, index) => Object.assign(control(value), { checked: index === 0 }))]));
  let raw = JSON.stringify(initial);
  let failWrite = false;
  const window = { location: { search, href: '' }, localStorage: { getItem() { return raw; }, setItem(name, next) { assert.equal(name, key); if (failWrite) throw new Error('quota'); raw = next; } } };
  nodes.rechargeGiftName.value = 'Test recharge';
  nodes.rechargeGiftTitle.value = 'Test title';
  nodes.rechargeGiftStart.value = '2026-10-23T00:00';
  nodes.rechargeGiftEnd.value = '2026-12-31T23:59';
  nodes.rechargeGiftWager.value = '1';
  nodes.rechargeGiftSort.value = '0';
  nodes.rechargeGiftError.hidden = true;
  nodes.rechargeGiftForm.reportValidity = () => {
    if (!nodes.rechargeGiftRatioSection.disabled) {
      return rows.every(row => Number(row.querySelector('.rg-percent').value) >= 0.01 && Number(row.querySelector('.rg-percent').value) <= 100);
    }
    return true;
  };
  nodes.rechargeGiftTiers.querySelectorAll = () => rows;
  nodes.rechargeGiftTiers.querySelector = selector => rows[0].querySelector(selector.replace(':not(:disabled)', ''));
  nodes.rechargeGiftAmountTiers.querySelectorAll = () => amountRows;
  nodes.rechargeGiftTiers.appendChild = row => rows.push(row);
  nodes.rechargeGiftAmountTiers.appendChild = row => amountRows.push(row);
  Object.defineProperty(nodes.rechargeGiftTiers, 'firstElementChild', { get() { return rows[0]; } });
  Object.defineProperty(nodes.rechargeGiftAmountTiers, 'firstElementChild', { get() { return amountRows[0]; } });
  Object.defineProperty(nodes.rechargeGiftTiers, 'textContent', { set() { rows = []; } });
  Object.defineProperty(nodes.rechargeGiftAmountTiers, 'textContent', { set() { amountRows = []; } });
  nodes.rechargeGiftMembers.querySelectorAll = () => members.map(value => ({ getAttribute() { return value; }, setAttribute() {} }));
  nodes.rechargeGiftMembers.querySelector = () => control();
  const document = { readyState: 'loading', addEventListener() {}, getElementById(id) { return nodes[id]; },
    querySelector(selector) { return radioGroups[selector.match(/name="([^"]+)"/)[1]].find(input => input.checked); },
    querySelectorAll(selector) { return radioGroups[selector.match(/name="([^"]+)"/)[1]]; },
    createElement() { return { innerHTML: '', content: { childNodes: [] } }; } };
  const context = { document, window, URLSearchParams };
  // Inspect closure behavior without adding test globals to the delivered page.
  const instrumented = source.replace("  if (document.readyState === 'loading')", '  window.testApi = { syncTiers: syncTiers, validTiers: validTiers, save: save, setBanner: setBanner, getRecords: getRecords, uploadBanner: uploadBanner, syncRewardMode: syncRewardMode, syncAmountTiers: syncAmountTiers, amountTierError: amountTierError, loadRecord: loadRecord };\n  if (document.readyState === \'loading\')');
  vm.runInNewContext(instrumented, context);
  window.testApi.syncRewardMode();
  return { api: window.testApi, nodes, window, setRows(next) { rows = next; }, setMembers(next) { members = next; }, setAmountRows(next) { amountRows = next; }, getAmountRows() { return amountRows; },
    setRadio(name, value) { radioGroups[name].forEach(input => { input.checked = input.value === value; }); window.testApi.syncRewardMode(); },
    setRaw(next) { raw = next; }, records() { return JSON.parse(raw); }, failWrite() { failWrite = true; }, save() { window.testApi.save({ preventDefault() {} }); } };
}
const range = formHarness();
let rows = [tier(5), tier(10), tier(15)];
range.setRows(rows); range.api.syncTiers();
assert.equal(rows[1].querySelector('.rg-tier').textContent, '6 - 10');
assert(rows[2].querySelector('.rg-vip-end').disabled);
assert(range.api.validTiers());
rows[1].querySelector('.rg-vip-end').value = '5';
assert(!range.api.validTiers(), 'duplicate range boundary must fail');
range.setRows([rows[0], rows[2]]); range.api.syncTiers();
assert.equal(rows[2].querySelector('.rg-tier').textContent, '6 - 15', 'delete must close range gap');

const creation = formHarness();
creation.api.setBanner('data:image/png;base64,fixture');
creation.save();
assert.equal(creation.records().length, 1);
assert.equal(creation.records()[0].tiers[0].endVip, 15);
assert.equal(creation.records()[0].members[0], 'VIP1');
assert.equal(creation.records()[0].rewardMode, 'ratio');
assert.equal(creation.window.location.href, list + '.html');
for (const scenario of ['time', 'members', 'banner', 'quota']) {
  const state = formHarness();
  if (scenario !== 'banner') state.api.setBanner('data:image/png;base64,fixture');
  if (scenario === 'time') state.nodes.rechargeGiftEnd.value = state.nodes.rechargeGiftStart.value;
  if (scenario === 'members') state.setMembers([]);
  if (scenario === 'quota') state.failWrite();
  state.save();
  assert.equal(state.records().length, 0, scenario + ' must prevent save');
  assert.equal(state.window.location.href, '');
  assert(!state.nodes.rechargeGiftError.hidden);
}
const existing = creation.records()[0];
existing.enabled = false; existing.visible = false;
const editing = formHarness('?rechargeGiftId=' + existing.id, [existing]);
editing.api.loadRecord(); editing.api.syncRewardMode();
editing.api.setBanner(existing.banner); editing.nodes.rechargeGiftName.value = 'Edited'; editing.save();
assert.equal(editing.records().length, 1, 'editing must replace, not duplicate');
assert.equal(editing.records()[0].name, 'Edited');
assert.equal(editing.records()[0].enabled, false);
assert.equal(editing.records()[0].visible, false);
const view = formHarness('?mode=view', [existing]); view.save(); assert.equal(view.window.location.href, '');
const malformed = formHarness(); malformed.setRaw('{}'); assert.throws(() => malformed.api.getRecords());

// Amount rewards use independent, ordered thresholds and do not validate hidden ratio drafts.
const amount = formHarness();
amount.setAmountRows([amountTier(100, 10), amountTier(500, 60)]);
amount.setRows([tier(15, '')]);
amount.setRadio('rechargeGiftRewardMode', 'amount');
assert(amount.nodes.rechargeGiftRatioSection.hidden && amount.nodes.rechargeGiftRatioSection.disabled);
assert(!amount.nodes.rechargeGiftAmountSection.hidden && !amount.nodes.rechargeGiftAmountSection.disabled);
amount.api.syncAmountTiers();
assert.equal(amount.getAmountRows()[1].querySelector('.rg-amount-index').textContent, '2');
assert.equal(amount.api.amountTierError(), '');
amount.api.setBanner('data:image/png;base64,fixture'); amount.save();
const amountRecord = amount.records()[0];
assert.equal(amountRecord.rewardMode, 'amount');
assert.equal(amountRecord.depositMode, 'cumulative');
assert.equal(amountRecord.amountTiers[1].depositAmount, 500);
assert.equal(amountRecord.amountTiers[1].giftAmount, 60);
const amountEdit = formHarness('?rechargeGiftId=' + amountRecord.id, [amountRecord]);
amountEdit.api.loadRecord(); amountEdit.api.syncRewardMode();
assert(!amountEdit.nodes.rechargeGiftAmountSection.hidden, 'amount edit must restore type');
assert.equal(amountEdit.getAmountRows()[1].querySelector('.rg-gift-amount').value, '60');
amountEdit.setRadio('rechargeGiftDepositMode', 'single');
assert(amountEdit.nodes.rechargeGiftAmountHint.textContent.includes('每笔'));
amountEdit.save();
assert.equal(amountEdit.records()[0].depositMode, 'single');
assert.equal(amountEdit.records().length, 1);
amountEdit.setRadio('rechargeGiftRewardMode', 'ratio');
assert(amountEdit.nodes.rechargeGiftAmountSection.disabled && amountEdit.nodes.rechargeGiftAmountSection.hidden);
amountEdit.setRadio('rechargeGiftRewardMode', 'amount');
assert.equal(amountEdit.getAmountRows()[1].querySelector('.rg-gift-amount').value, '60', 'mode switching preserves drafts');
for (const invalid of [ [amountTier(100, 10), amountTier(100, 20)], [amountTier(500, 50), amountTier(100, 10)], [amountTier(0, 10)], [amountTier(100, 0)], [amountTier(100, -1)], [amountTier('', '')], [amountTier(100.001, 10)], [amountTier(100, 1.001)] ]) {
  const state = formHarness();
  state.setRadio('rechargeGiftRewardMode', 'amount'); state.setAmountRows(invalid);
  assert(state.api.amountTierError(), 'invalid money/threshold must fail');
  state.api.setBanner('data:image/png;base64,fixture'); state.save();
  assert.equal(state.records().length, 0);
}
const legacyRecord = Object.assign({}, existing);
delete legacyRecord.rewardMode; delete legacyRecord.depositMode; delete legacyRecord.amountTiers;
const legacy = formHarness('?rechargeGiftId=' + legacyRecord.id, [legacyRecord]);
legacy.api.loadRecord(); legacy.api.syncRewardMode();
assert(!legacy.nodes.rechargeGiftRatioSection.hidden && legacy.nodes.rechargeGiftAmountSection.disabled, 'old records default to ratio');
const amountView = formHarness('?rechargeGiftId=' + amountRecord.id + '&mode=view', [amountRecord]);
amountView.api.loadRecord(); amountView.api.syncRewardMode();
assert(amountView.nodes.rechargeGiftRatioSection.disabled && amountView.nodes.rechargeGiftAmountSection.disabled);
amountView.save(); assert.equal(amountView.window.location.href, '');

// Run the real list DOM-ready callback; catches missing startup rendering.
function listHarness(initial) {
  const stored = new Map(Object.entries(initial || {}));
  const body = { rows: [], firstChild: null, querySelectorAll(selector) { return this.rows.filter(row => selector === 'tr' || row.hasAttribute(selector.slice(1, -1))); }, insertBefore(row) { this.rows.unshift(row); this.firstChild = row; } };
  const total = control();
  let readyCallback;
  const document = { addEventListener(name, callback) { readyCallback = callback; },
    getElementById(id) { return id === 'promoActivityRows' ? body : null; },
    querySelectorAll(selector) { return selector === '.pagination > span' ? [total] : []; },
    createElement() { return { cells: [], attributes: {}, setAttribute(name, value) { this.attributes[name] = value; }, hasAttribute(name) { return name in this.attributes; }, remove() { body.rows.splice(body.rows.indexOf(this), 1); } }; } };
  body.addEventListener = () => {};
  vm.runInNewContext(listSource, { document, window: { localStorage: { getItem(name) { return stored.has(name) ? stored.get(name) : null; }, setItem(name, value) { stored.set(name, value); } }, alert(message) { throw new Error(message); } } });
  readyCallback();
  return { body, stored, total };
}
const seeded = listHarness();
assert.equal(seeded.body.rows.length, 1, 'list must initialize recharge rows at DOM-ready');
assert.equal(JSON.parse(seeded.stored.get(key))[0].id, 'recharge-gift-demo');
assert.equal(JSON.parse(seeded.stored.get(key))[0].tiers[0].endVip, '15');
assert(seeded.total.textContent.includes('1'));
const empty = listHarness({ [key]: '[]' });
assert.equal(empty.body.rows.length, 0, 'deleted demo must stay deleted');
const saved = listHarness({ [key]: JSON.stringify([existing]) });
assert(saved.body.rows[0].innerHTML.includes('data-recharge-gift-edit'));
assert.equal(saved.body.rows[0].attributes['data-recharge-gift-id'], existing.id);
console.log('PASS: static structure, UTF-8, VIP ranges, ratio/amount switching, cumulative/single, threshold validation, create/edit/readonly, legacy records and list persistence.');
