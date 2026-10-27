/* Static and VM behavior checks; no browser, server or external dependencies. */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const page = String.fromCodePoint(0x65b0, 0x589e, 0x6d3b, 0x52a8);
const listPage = String.fromCodePoint(0x4f18, 0x60e0, 0x6d3b, 0x52a8, 0x5217, 0x8868);
const html = fs.readFileSync(page + '.html', 'utf8');
const source = fs.readFileSync('custom/js/weekly-card-activity.js', 'utf8');
const css = fs.readFileSync('custom/css/weekly-card-activity.css', 'utf8');
const core = fs.readFileSync('custom/js/' + page + '.js', 'utf8');
const listSource = fs.readFileSync('custom/js/' + listPage + '.js', 'utf8');
const listHtml = fs.readFileSync(listPage + '.html', 'utf8');
const key = 'promoWeeklyCardActivities';
const stack = [], ids = new Map();
for (const match of html.matchAll(/<!--[\s\S]*?-->|<\/?([a-z][a-z0-9]*)\b[^>]*>/gi)) {
  if (!match[1]) continue;
  const tag = match[1].toLowerCase();
  if (match[0].startsWith('</')) {
    const index = stack.map(item => item.tag).lastIndexOf(tag);
    if (index >= 0) stack.length = index;
    continue;
  }
  const id = (match[0].match(/\bid="([^"]+)"/) || [])[1];
  const entry = { tag, id, parent: stack[stack.length - 1] };
  if (id) { assert(!ids.has(id), 'duplicate id: ' + id); ids.set(id, entry); }
  if (!/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag) && !match[0].endsWith('/>')) stack.push(entry);
}
assert.equal(ids.get('u6_state9').parent.id, 'u6');
assert.equal(ids.get('weeklyCardForm').parent.id, 'u6_state9_content');
assert.equal(ids.get('weeklyCardDayModal').parent.tag, 'body');
for (const match of source.matchAll(/byId\('([^']+)'\)/g)) assert(ids.has(match[1]), 'missing control: ' + match[1]);
assert.equal((html.match(/data-wc-day="[1-7]"/g) || []).length, 7);
assert.equal((html.match(/data-wc-preview-day="[1-7]"/g) || []).length, 7, 'all seven daily amounts must have a static table preview');
assert(!/\?{3,}|\ufffd/.test(html + source + css + listHtml + listSource), 'UTF-8 integrity');
assert(css.includes('appearance: none') && css.includes('[hidden]'));
assert(html.includes('value="周卡"') && listHtml.includes('>周卡</option>'));
assert(html.includes('custom/css/weekly-card-activity.css') && html.includes('custom/js/weekly-card-activity.js'));
assert(!ids.has('weeklyCardResetTime'), 'weekly card must follow site local calendar days without a reset time input');
assert(html.includes('站点时区当地自然日'), 'site timezone natural-day rule must be visible');

function control(value = '') {
  return { value, checked: false, hidden: false, disabled: false, inert: false, dataset: {}, style: {}, attributes: {}, listeners: {}, isConnected: true,
    textContent: '', innerHTML: '', classList: { contains() { return false; } },
    setAttribute(name, value) { this.attributes[name] = String(value); }, getAttribute(name) { return this.attributes[name]; },
    removeAttribute(name) { delete this.attributes[name]; }, focus() { this.focused = true; }, scrollIntoView() {},
    reportValidity() { return true; }, addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); },
    dispatch(name, target = this) { for (const callback of this.listeners[name] || []) callback.call(this, { target, preventDefault() {}, stopImmediatePropagation() {} }); }
  };
}
function formHarness(search = '', initial = []) {
  const nodes = Object.fromEntries([...ids.keys()].map(id => [id, control()]));
  let rows = [], raw = JSON.stringify(initial), failWrite = false;
  const dayInputs = Array.from({ length: 7 }, () => control());
  const radio = [Object.assign(control('余额'), { checked: true }), control('存钱罐')];
  function row(tier = {}) {
    const node = control();
    const previews = Array.from({ length: 7 }, () => control());
    const controls = Object.fromEntries(['.wc-tier-index', '.wc-tier-deposit', '.wc-tier-immediate', '[data-wc-configure-days]', '.wc-day-status', '.wc-daily-total', '.wc-grand-total', '[data-wc-delete-tier]'].map(selector => [selector, control()]));
    controls['.wc-tier-deposit'].value = tier.deposit || '';
    controls['.wc-tier-immediate'].value = tier.immediateReward || '';
    node.setAttribute('data-daily-rewards', JSON.stringify(tier.values || ['', '', '', '', '', '', '']));
    node.querySelector = selector => controls[selector];
    node.querySelectorAll = selector => selector === '[data-wc-preview-day]' ? previews : [];
    node.cloneNode = () => row();
    node.remove = () => { rows = rows.filter(item => item !== node); node.isConnected = false; };
    return node;
  }
  rows = [row()];
  const tbody = nodes.weeklyCardTierRows;
  Object.defineProperty(tbody, 'children', { get() { return rows; } });
  Object.defineProperty(tbody, 'firstElementChild', { get() { return rows[0]; } });
  Object.defineProperty(tbody, 'textContent', { set() { rows = []; } });
  tbody.querySelectorAll = () => rows;
  tbody.appendChild = item => rows.push(item);
  nodes.weeklyCardForm.querySelectorAll = () => [];
  nodes.weeklyCardDayForm.querySelectorAll = () => dayInputs;
  nodes.weeklyCardDayForm.querySelector = () => dayInputs[0];
  nodes.weeklyCardDayModal.querySelectorAll = () => [];
  nodes.weeklyCardDayModal.hidden = true;
  const defaults = { Name: 'Weekly card', Title: 'Weekly rewards', StartTime: '2026-10-27T00:00', EndTime: '2026-12-31T23:59', WagerMultiple: '1', Sort: '0' };
  for (const [suffix, value] of Object.entries(defaults)) nodes['weeklyCard' + suffix].value = value;
  nodes.weeklyCardEnabled.checked = true;
  const window = { location: { search, href: '' }, localStorage: { getItem(name) { assert.equal(name, key); return raw; }, setItem(name, value) { assert.equal(name, key); if (failWrite) throw Error('quota'); raw = value; } } };
  const document = { readyState: 'loading', addEventListener() {}, getElementById(id) { return nodes[id]; }, body: { classList: { contains() { return true; } } },
    querySelector(selector) { return selector.includes('weeklyCardRewardTarget') ? radio.find(item => item.checked) : control(); },
    querySelectorAll() { return radio; }, createElement() { return { innerHTML: '', content: { childNodes: [] } }; } };
  const exposed = '  window.testApi = { ready, amountCents, totalCents, validateRecord, collectRecord, saveActivity, openDays, closeDays, confirmDays, createRow, syncRows };\n';
  vm.runInNewContext(source.replace("  if (document.readyState === 'loading')", exposed + "  if (document.readyState === 'loading')"), { window, document, URLSearchParams });
  window.testApi.ready();
  return { api: window.testApi, nodes, window, dayInputs, rows: () => rows, records: () => JSON.parse(raw), setRaw(value) { raw = value; }, failWrite() { failWrite = true; },
    setValidTier(index = 0, deposit = '170000') { const item = rows[index]; item.querySelector('.wc-tier-deposit').value = deposit; item.querySelector('.wc-tier-immediate').value = '1000000'; item.setAttribute('data-daily-rewards', JSON.stringify(Array(7).fill('1000000'))); },
    append(tier) { tbody.appendChild(window.testApi.createRow(tier)); window.testApi.syncRows(); } };
}
const creation = formHarness();
creation.setValidTier(); creation.api.syncRows();
assert.equal(creation.rows()[0].querySelector('.wc-grand-total').textContent, '8,000,000');
assert.equal(creation.rows()[0].querySelectorAll('[data-wc-preview-day]')[0].textContent, '1,000,000');
assert.equal(creation.rows()[0].querySelectorAll('[data-wc-preview-day]')[6].textContent, '1,000,000');
assert.equal(creation.api.totalCents(['0.1', '0.2']), 30);
for (const amount of ['', '-1', '0.001', 'Infinity', '9007199254740991']) assert.equal(creation.api.amountCents(amount, false), null);
assert.equal(creation.api.amountCents('0', false), 0);
assert.equal(creation.api.amountCents('0', true), null);
for (let index = 0; index < 12; index++) creation.nodes.weeklyCardAddTier.dispatch('click');
assert.equal(creation.rows().length, 7, 'add handler must enforce seven-tier cap');
assert(creation.nodes.weeklyCardAddTier.disabled);
for (let index = 1; index < 7; index++) creation.setValidTier(index, String(170000 * (index + 1)));
assert.equal(creation.api.validateRecord(creation.api.collectRecord()), '');
const draft = creation.api.collectRecord();
draft.tiers[1].deposit = draft.tiers[0].deposit;
assert(creation.api.validateRecord(draft), 'duplicate threshold must fail');
draft.tiers[1].deposit = '340000'; draft.tiers[0].dailyRewards.pop();
assert(creation.api.validateRecord(draft), 'all seven days required');
draft.tiers[0].dailyRewards = Array.from({ length: 7 }, (_, day) => ({ day: day + 1, reward: '1' }));
draft.tiers.push(draft.tiers[0]);
assert(creation.api.validateRecord(draft), 'eighth tier must fail');

const modal = formHarness(); modal.setValidTier();
const minimum = formHarness();
const deleteButton = { hasAttribute(name) { return name === 'data-wc-delete-tier'; }, closest(selector) { return selector === 'button' ? this : minimum.rows()[0]; } };
minimum.nodes.weeklyCardForm.dispatch('click', deleteButton);
assert.equal(minimum.rows().length, 1, 'last tier cannot be deleted');
minimum.append({}); minimum.nodes.weeklyCardForm.dispatch('click', deleteButton);
assert.equal(minimum.rows().length, 1, 'other tiers may be deleted');
modal.append({ deposit: '340000', immediateReward: '1', dailyRewards: Array.from({ length: 7 }, (_, index) => ({ day: index + 1, reward: String(index + 1) })) });
modal.api.openDays(modal.rows()[0]);
modal.dayInputs[0].value = '99'; modal.api.closeDays();
assert.equal(JSON.parse(modal.rows()[0].getAttribute('data-daily-rewards'))[0], '1000000', 'cancel must discard draft');
assert(!modal.nodes.base.inert);
modal.api.openDays(modal.rows()[1]); modal.dayInputs[0].value = '99';
modal.api.confirmDays({ preventDefault() {} });
assert.equal(JSON.parse(modal.rows()[1].getAttribute('data-daily-rewards'))[0], '99');
assert.equal(modal.rows()[1].querySelectorAll('[data-wc-preview-day]')[0].textContent, '99', 'confirm must update the table preview');
assert.equal(modal.rows()[0].querySelectorAll('[data-wc-preview-day]')[0].textContent, '1,000,000', 'other tier previews must remain unchanged');
assert.equal(JSON.parse(modal.rows()[0].getAttribute('data-daily-rewards'))[0], '1000000', 'editing tier two must preserve tier one');
assert(modal.nodes.weeklyCardDayModal.hidden);
modal.api.openDays(modal.rows()[0]); modal.dayInputs[0].value = '-1'; modal.api.confirmDays({ preventDefault() {} });
assert(!modal.nodes.weeklyCardDayError.hidden && !modal.nodes.weeklyCardDayModal.hidden);
modal.api.closeDays();

creation.api.saveActivity();
assert.equal(creation.records().length, 1);
assert.equal(creation.records()[0].tiers.length, 7);
assert.equal(creation.records()[0].dayBoundary, 'site-local-calendar-day');
assert(!Object.hasOwn(creation.records()[0], 'resetTime'));
assert.equal(creation.window.location.href, listPage + '.html?weeklyCardSaved=1');
const existing = creation.records()[0]; existing.enabled = false; existing.wagerMultiple = '0'; existing.resetTime = '06:00';
const editing = formHarness('?weeklyCardId=' + existing.id, [existing]);
assert.equal(editing.rows().length, 7); assert(!editing.nodes.weeklyCardEnabled.checked);
assert.equal(editing.nodes.weeklyCardWagerMultiple.value, '0');
editing.nodes.weeklyCardName.value = 'Edited'; editing.api.saveActivity();
assert.equal(editing.records().length, 1); assert.equal(editing.records()[0].name, 'Edited');
assert.equal(editing.records()[0].dayBoundary, 'site-local-calendar-day');
assert(!Object.hasOwn(editing.records()[0], 'resetTime'), 'saving a legacy record must discard its custom reset time');
assert.equal(editing.records()[0].tiers[6].dailyRewards.length, 7);
const legacyEight = JSON.parse(JSON.stringify(existing));
legacyEight.tiers.push(Object.assign({}, legacyEight.tiers[6], { deposit: '1360000' }));
const excess = formHarness('?weeklyCardId=' + legacyEight.id, [legacyEight]);
assert.equal(excess.rows().length, 8, 'legacy tiers must not be silently discarded');
excess.api.saveActivity(); assert.equal(excess.window.location.href, '', 'eight-tier activity cannot be saved');
excess.rows()[7].remove(); excess.api.syncRows(); excess.api.saveActivity();
assert.equal(excess.records()[0].tiers.length, 7, 'legacy activity can be reduced to seven tiers and saved');
editing.nodes.weeklyCardLongTerm.checked = true; editing.nodes.weeklyCardLongTerm.dispatch('change');
assert(editing.nodes.weeklyCardEndTime.disabled && !editing.nodes.weeklyCardEndTime.required);
editing.api.saveActivity(); assert.equal(editing.records()[0].endTime, '');
editing.nodes.weeklyCardLongTerm.checked = false; editing.nodes.weeklyCardLongTerm.dispatch('change');
assert.equal(editing.nodes.weeklyCardEndTime.value, '2026-12-31T23:59');
for (const scenario of ['quota', 'missing-edit', 'corrupt-storage', 'missing-reward', 'bad-time']) {
  const test = formHarness(scenario === 'missing-edit' ? '?weeklyCardId=missing' : '');
  test.setValidTier();
  if (scenario === 'quota') test.failWrite();
  if (scenario === 'corrupt-storage') test.setRaw('{}');
  if (scenario === 'missing-reward') test.rows()[0].setAttribute('data-daily-rewards', '["","","","","","",""]');
  if (scenario === 'bad-time') test.nodes.weeklyCardEndTime.value = test.nodes.weeklyCardStartTime.value;
  test.api.saveActivity();
  assert.equal(test.window.location.href, '', scenario + ' must not navigate');
  assert(!test.nodes.weeklyCardError.hidden, scenario + ' must show error');
}

// Exercise actual template switching against all ten panel states.
const states = Array.from({ length: 10 }, () => Object.assign(control(), { classList: { contains() { return true; } } }));
const panel = Object.assign(control(), { id: 'u6', children: states });
const classes = new Set();
const coreWindow = { location: { search: '' } };
const coreDocument = { readyState: 'loading', addEventListener() {}, querySelector() { return null; }, getElementById(id) { return id === 'u6' ? panel : null; }, body: { classList: { toggle(name, active) { if (active) classes.add(name); else classes.delete(name); } } } };
vm.runInNewContext(core.replace('  ready(function () {', '  window.testCore = { setTemplateState };\n  ready(function () {'), { window: coreWindow, document: coreDocument, URLSearchParams });
coreWindow.testCore.setTemplateState('周卡');
assert.equal(states[9].style.display, 'block'); assert.equal(states[7].style.display, 'none'); assert(classes.has('weekly-card-template-active'));
coreWindow.testCore.setTemplateState('月签到活动');
assert.equal(states[9].style.display, 'none'); assert.equal(states[7].style.display, 'block'); assert(!classes.has('weekly-card-template-active'));

// Run list startup and real edit/toggle/delete handlers using persisted form output.
const stored = new Map([[key, JSON.stringify([existing])], ['promoRechargeGiftActivities', '[]']]);
const listNodes = { promoActivityRows: control(), activityTypeFilter: control('全部类型'), searchActivitiesBtn: control(), resetActivitiesBtn: control(), createActivityBtn: control() };
const body = listNodes.promoActivityRows; body.rows = [];
body.querySelectorAll = selector => body.rows.filter(item => selector === 'tr' || item.attributes[selector.slice(1, -1)] != null);
body.insertBefore = item => { body.rows.unshift(item); body.firstChild = body.rows[0]; };
const count = control(); let onReady;
const listWindow = { location: { href: '' }, alert(message) { throw Error(message); }, confirm() { return true; }, localStorage: { getItem(name) { return stored.get(name) || null; }, setItem(name, value) { stored.set(name, value); } } };
const listDocument = { addEventListener(name, callback) { onReady = callback; }, getElementById(id) { return listNodes[id] || null; }, querySelectorAll(selector) { return selector === '.pagination > span' ? [count] : []; }, createElement() {
  const item = control(); item.cells = [];
  Object.defineProperty(item, 'innerHTML', { set(value) { this.markup = value; this.cells = [...value.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map(match => ({ textContent: match[1].replace(/<[^>]*>/g, '') })); } });
  item.hasAttribute = name => name in item.attributes; item.remove = () => { body.rows = body.rows.filter(row => row !== item); };
  return item;
} };
vm.runInNewContext(listSource, { window: listWindow, document: listDocument }); onReady();
assert.equal(body.rows.length, 1); assert(count.textContent.includes('1'));
assert(body.rows[0].markup.includes('<td>0</td>'), 'zero wager must display');
listNodes.activityTypeFilter.value = '周卡'; listNodes.searchActivitiesBtn.dispatch('click');
assert(!body.rows[0].hidden);
function listAction(action) {
  const row = body.rows[0]; const attribute = '[data-weekly-card-' + action + ']';
  body.dispatch('click', { closest(selector) { if (selector === '[data-weekly-card-id]') return row; if (selector === attribute) return control(); return null; } });
}
listAction('edit'); assert.equal(listWindow.location.href, page + '.html?weeklyCardId=' + encodeURIComponent(existing.id));
listAction('toggle'); assert.equal(JSON.parse(stored.get(key))[0].enabled, true);
assert(!body.rows[0].hidden && count.textContent.includes('1'));
listAction('delete'); assert.equal(JSON.parse(stored.get(key)).length, 0); assert.equal(body.rows.length, 0);
console.log('PASS: weekly card structure/UTF-8, template switch, 1-7 tiers, 7-day drafts, totals, validation, create/edit, storage failures, long-term toggle and list edit/status/delete.');
