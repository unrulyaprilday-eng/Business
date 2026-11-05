/* Targeted static and VM checks; no server, browser, or dependencies. */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const page = String.fromCodePoint(0x65b0, 0x589e, 0x6d3b, 0x52a8);
const html = fs.readFileSync(page + '.html', 'utf8');
const source = fs.readFileSync('custom/js/lucky-wheel-activity.js', 'utf8');
const css = fs.readFileSync('custom/css/reward-wheel-activity.css', 'utf8');
const sectionHtml = html.match(/<section id="rewardWheelChanceSection"[\s\S]*?<\/section>/)[0];
assert(!/\?{3,}|\ufffd/.test(sectionHtml + source + css), 'UTF-8 text');
assert(css.includes('overflow-x: auto') && css.includes('.rw-task-toolbar h4'));
assert(css.includes('.rw-image-grid') && css.includes('.rw-image-field'));

// Small DOM surface for the actual task markup, rather than a second implementation
// of the form rules. Only selectors/methods used by the task controller are modeled.
class Element {
  constructor(tag = 'div', attributes = {}) {
    this.tagName = tag.toUpperCase(); this.attributes = { ...attributes }; this.children = [];
    this.value = attributes.value || ''; this.checked = 'checked' in attributes;
    this.disabled = 'disabled' in attributes; this.hidden = 'hidden' in attributes;
    this.listeners = {}; this._text = ''; this.innerHTML = '';
    const classes = new Set((attributes.class || '').split(/\s+/));
    this.classList = { contains: key => classes.has(key), toggle: (key, on) => on ? classes.add(key) : classes.delete(key) };
  }
  appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
  removeChild(child) { this.children.splice(this.children.indexOf(child), 1); child.parentNode = null; }
  set textContent(value) { this._text = value; this.children = []; }
  get textContent() { return this._text; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name]; }
  removeAttribute(name) { delete this.attributes[name]; }
  matches(selector) {
    const match = selector.match(/^([a-z]+)?(?:\[([^=\]]+)(?:=['"]?([^'"\]]+)['"]?)?\])?$/i);
    assert(match, 'Unsupported fixture selector: ' + selector);
    return (!match[1] || this.tagName === match[1].toUpperCase()) && (!match[2] ||
      Object.hasOwn(this.attributes, match[2]) && (match[3] === undefined || this.attributes[match[2]] === match[3]));
  }
  querySelectorAll(selector) {
    return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) { return this.matches(selector) ? this : this.parentNode && this.parentNode.closest(selector); }
  cloneNode(deep) {
    const result = new Element(this.tagName, this.attributes);
    Object.assign(result, { value: this.value, checked: this.checked, disabled: this.disabled, hidden: this.hidden });
    if (deep) this.children.forEach(child => result.appendChild(child.cloneNode(true)));
    return result;
  }
  focus() { this.focused = true; }
  scrollIntoView() {}
  addEventListener(name, callback) { this.listeners[name] = callback; }
}
function parseSection() {
  const root = new Element(); const stack = [root];
  for (const token of sectionHtml.matchAll(/<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi)) {
    if (token[0].startsWith('</')) { stack.pop(); continue; }
    const attributes = {};
    for (const attr of token[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attributes[attr[1]] = attr[2] || '';
    const node = new Element(token[1], attributes); stack.at(-1).appendChild(node);
    if (!/^(input|br|img|hr)$/.test(token[1])) stack.push(node);
  }
  return root.children[0];
}
function plain(value) { return JSON.parse(JSON.stringify(value)); }
function harness(reward = true) {
  const section = parseSection(); const nodes = {};
  for (const id of html.matchAll(/\bid="([^"]+)"/g)) nodes[id[1]] = new Element();
  function index(node) { if (node.attributes.id) nodes[node.attributes.id] = node; node.children.forEach(index); }
  index(section);
  const stored = new Map();
  const window = { location: { search: '', href: '' }, localStorage: {
    getItem: key => stored.get(key) || null, setItem: (key, value) => stored.set(key, value)
  } };
  nodes.u3012_input.value = reward ? '\u5956\u52b1\u8f6c\u76d8' : '\u5e78\u8fd0\u8f6c\u76d8';
  Object.entries({ luckyWheelName: 'Fixture', luckyWheelTitle: 'Fixture title', luckyWheelStartTime: '2026-11-01T00:00',
    luckyWheelEndTime: '2026-12-31T23:59', luckyWheelWagerMultiple: '1', luckyWheelSort: '0', luckyWheelId: 'wheel-1',
    luckyWheelBonusDays: '7', luckyWheelBonusDepositAmount: '', luckyWheelBonusExtraMultiplier: ''
  }).forEach(([id, value]) => { nodes[id].value = value; });
  nodes.luckyWheelId.options = [{ value: 'wheel-1', textContent: 'Fixture wheel' }];
  nodes.luckyWheelId.selectedIndex = 0;
  const document = { readyState: 'loading', addEventListener() {}, getElementById: id => nodes[id],
    querySelectorAll(selector) {
      if (selector.startsWith('#rewardWheelChanceSection ')) return section.querySelectorAll(selector.slice(26));
      if (selector.startsWith('input[name=')) return [];
      throw Error('Unsupported document selector: ' + selector);
    },
    querySelector(selector) { return selector.includes('input[name=') ? null : section.querySelector(selector); },
    createElement(tag) { const node = new Element(tag); if (tag === 'template') node.content = { querySelectorAll: () => [] }; return node; }
  };
  const marker = '  if (document.readyState === "loading")';
  assert(source.includes(marker));
  const injected = source.replace(marker, '  window.testApi = { bindRewardTasks, collectRewardTasks, fillRewardTasks, syncRewardChanceRules, saveActivity, fillForm, renderWheelImage };\n' + marker);
  vm.runInNewContext(injected, { window, document, URLSearchParams });
  const api = window.testApi; api.bindRewardTasks();
  function panel(type) { return section.querySelector('[data-reward-task="' + type + '"]'); }
  function rows(type) { return panel(type).querySelectorAll('[data-reward-tier]'); }
  function input(type, index, field = 'threshold') { return rows(type)[index].querySelector('[data-reward-' + field + ']'); }
  function click(target) { section.listeners.click({ target }); }
  function enable(type, value) { const input = panel(type).querySelector('[data-reward-enabled]'); input.checked = value; section.listeners.change({ target: input }); }
  function valid() { input('deposit', 0).value = '100'; }
  api.renderWheelImage('Banner', 'data:image/png;base64,fixture');
  return { api, nodes, section, panel, rows, input, click, enable, valid, stored, window,
    records: key => JSON.parse(stored.get(key || 'promoRewardWheelActivities') || '[]') };
}

const state = harness();
assert.equal(state.section.querySelectorAll('[data-reward-tab]').length, 0, 'tasks are displayed without tabs');
assert.deepEqual(state.section.querySelectorAll('[data-reward-task]').map(panel => panel.getAttribute('data-reward-task')), ['turnover', 'deposit', 'invite']);
assert(state.section.querySelectorAll('[data-reward-task]').every(panel => !panel.hidden && panel.getAttribute('role') === 'group'), 'all three task groups are visible');
assert.deepEqual(['turnover', 'deposit', 'invite'].map(type => state.rows(type).length), [6, 1, 1]);
assert.deepEqual(state.rows('turnover').map((row, index) => state.input('turnover', index).value), ['1000000', '5000000', '10000000', '20000000', '50000000', '100000000']);
state.input('turnover', 0).value = '123.45';
state.click(state.panel('invite').querySelector('[data-reward-add-tier]'));
assert.equal(state.rows('invite').length, 2);
assert.equal(state.input('invite', 1).value, '');
assert.equal(state.input('invite', 1, 'count').value, '1');
state.click(state.rows('invite')[1].querySelector('[data-reward-delete-tier]'));
state.click(state.rows('invite')[0].querySelector('[data-reward-delete-tier]'));
assert.equal(state.rows('invite').length, 1, 'cannot delete final tier');
state.enable('turnover', false);
assert(state.input('turnover', 0).disabled && state.input('turnover', 0, 'count').disabled);
assert(state.panel('turnover').querySelector('[data-reward-add-tier]').disabled);
state.enable('turnover', true);
assert.equal(state.rows('turnover').length, 6);
assert.equal(state.input('turnover', 0).value, '123.45');
state.valid();
assert(state.api.collectRewardTasks());

let invalidCases = 0;
for (const [type, field, values] of [
  ['turnover', 'threshold', ['0', '-1', '1.001', '1e3', '', 'Infinity']],
  ['deposit', 'threshold', ['0', '-1', '2.001', '1e2', '']],
  ['invite', 'threshold', ['0', '-1', '1.5', '1.0', '9007199254740992']],
  ['invite', 'count', ['0', '-1', '1.5', '1.0', '', '9007199254740992']]
]) {
  for (const value of values) {
    const h = harness(); h.valid(); h.input(type, 0, field).value = value;
    assert.equal(h.api.collectRewardTasks(), null, type + '/' + field + ': ' + value);
    assert(!h.panel(type).hidden, 'failing task stays visible');
    assert(h.input(type, 0, field).focused, 'error focuses failing input');
    assert(h.nodes.luckyWheelError.textContent && !h.nodes.luckyWheelError.hidden);
    h.api.saveActivity(); assert.equal(h.records().length, 0, 'invalid tier blocks save'); invalidCases++;
  }
}
for (const threshold of ['1000000', '999999']) {
  const h = harness(); h.valid(); h.input('turnover', 1).value = threshold;
  assert.equal(h.api.collectRewardTasks(), null, 'duplicate/decreasing thresholds');
}
const saved = harness(); saved.valid(); saved.api.saveActivity();
assert.equal(saved.records().length, 1);
const record = saved.records()[0];
assert.deepEqual(Object.keys(record.chanceTasks), ['turnover', 'deposit', 'invite']);
assert.deepEqual(Object.values(record.chanceTasks).map(task => task.tiers.length), [6, 1, 1]);
assert.equal(record.chanceTasks.turnover.tiers[5].chances, '10');
assert(saved.window.location.href.endsWith('?rewardWheelSaved=1'));
const restored = harness(); restored.api.fillForm(record);
assert.deepEqual(plain(restored.api.collectRewardTasks()), record.chanceTasks, 'new arrays survive form roundtrip');
const legacy = harness();
legacy.api.fillForm({ turnoverThreshold: '100.50', turnoverChances: '3', depositThreshold: '200', depositChances: '0', inviteThreshold: '4', inviteChances: '2' });
assert.deepEqual(plain(legacy.api.collectRewardTasks()), {
  turnover: { enabled: true, tiers: [{ threshold: '100.5', chances: '3' }] },
  deposit: { enabled: false, tiers: [{ threshold: '200', chances: '1' }] },
  invite: { enabled: true, tiers: [{ threshold: '4', chances: '2' }] }
}, 'legacy scalar fields become one-tier tasks');
const disabled = harness(); disabled.valid(); disabled.input('deposit', 0).value = ''; disabled.enable('deposit', false);
disabled.api.saveActivity();
assert.equal(disabled.records()[0].chanceTasks.deposit.enabled, false);
assert.equal(disabled.records()[0].chanceTasks.deposit.tiers[0].threshold, '');
const disabledRestore = harness(); disabledRestore.api.fillRewardTasks(disabled.records()[0]);
assert.equal(disabledRestore.input('deposit', 0).value, '');
assert(disabledRestore.input('deposit', 0).disabled);
const lucky = harness(false); lucky.input('turnover', 0).value = '-1'; lucky.nodes.rewardWheelDefaultCount.value = 'invalid'; lucky.api.saveActivity();
assert.equal(lucky.records('promoLuckyWheelActivities').length, 1, 'ordinary lucky wheel skips reward validation');
assert(!Object.hasOwn(lucky.records('promoLuckyWheelActivities')[0], 'chanceTasks'));
console.log('PASS: all three task groups visible/6+1+1 tiers, add/delete floor, toggle preservation, ' + invalidCases + ' invalid numeric cases, ordered thresholds, error focus, legacy upgrade, full-array save/restore and ordinary lucky-wheel isolation.');
