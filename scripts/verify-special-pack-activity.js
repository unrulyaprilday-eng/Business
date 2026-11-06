const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const source = fs.readFileSync('custom/js/special-pack-activity.js', 'utf8');
const html = fs.readFileSync('新增活动.html', 'utf8');
const css = fs.readFileSync('custom/css/special-pack-activity.css', 'utf8');
const key = 'promoSpecialPackActivities';
const cycleKeys = ['daily', 'weekly', 'monthly'];
assert(!/\uFFFD|\?{3,}/.test(source + css));
assert(css.includes('[hidden]'));

// Parse actual tag ancestry without a browser; script/style bodies are not HTML nodes.
const structuralHtml = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
const stack = [], domIds = new Map(), domNodes = [];
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
for (const match of structuralHtml.matchAll(/<\/?([a-z][\w:-]*)\b[^>]*>/gi)) {
  const token = match[0], tag = match[1].toLowerCase();
  if (token.startsWith('</')) {
    const node = stack.pop(); assert(node && node.tag === tag, 'HTML tag ancestry mismatch: ' + token);
    continue;
  }
  const id = /\bid="([^"]+)"/.exec(token)?.[1];
  const node = { tag, id, parent: stack[stack.length - 1] || null, children: [], token };
  if (node.parent) node.parent.children.push(node);
  if (id) { assert(!domIds.has(id), 'Duplicate HTML id: ' + id); domIds.set(id, node); }
  domNodes.push(node);
  if (!voidTags.has(tag) && !token.endsWith('/>')) stack.push(node);
}
assert.equal(stack.length, 0, 'All HTML tags close');
const actualState = domIds.get('u6_state12');
assert(actualState && actualState.parent === domIds.get('u6'), 'special pack state must directly belong to u6');
const actualStates = domIds.get('u6').children.filter(node => /\bpanel_state\b/.test(node.token));
assert.equal(actualStates.length, 13); assert.equal(actualStates[12], actualState, 'special pack is the thirteenth direct panel state');
assert.equal(domIds.get('specialPackForm').parent.id, 'u6_state12_content');
assert.equal(domIds.get('specialPackTierModal').parent.tag, 'body', 'modal must be outside inert base');
assert(domIds.get('specialPackTierModal').token.includes('hidden'));
assert(html.includes('value="特惠礼包"')); assert(source.includes('特惠礼包'));
for (const node of domNodes.filter(node => node.id && node.id.startsWith('specialPack'))) assert(!/\uFFFD|\?{3,}/.test(node.token));

// Exercise the actual common template switch with the real number of Axure states.
const core = fs.readFileSync('custom/js/新增活动.js', 'utf8');
const coreClasses = new Set();
function stateNode(id) { return { id, style: {}, attributes: {}, classList: { contains(name) { return name === 'panel_state'; } },
  getAttribute(name) { return this.attributes[name] || null; }, setAttribute(name, value) { this.attributes[name] = value; } }; }
const states = actualStates.map(node => stateNode(node.id));
const panel = Object.assign(stateNode('u6'), { children: states });
const coreWindow = { location: { search: '' } };
const coreDocument = { readyState: 'loading', addEventListener() {}, querySelector() { return null; }, getElementById(id) { return id === 'u6' ? panel : null; },
  body: { classList: { toggle(name, enabled) { if (enabled) coreClasses.add(name); else coreClasses.delete(name); } } } };
Object.defineProperty(coreDocument.body, 'className', {
  get() { return [...coreClasses].join(' '); },
  set(value) { coreClasses.clear(); value.split(/\s+/).filter(Boolean).forEach(name => coreClasses.add(name)); }
});
vm.runInNewContext(core.replace('  ready(function () {', '  window.testCore = { setTemplateState };\n  ready(function () {'), { window: coreWindow, document: coreDocument, URLSearchParams });
coreWindow.testCore.setTemplateState('特惠礼包');
assert(coreClasses.has('special-pack-template-active')); assert.equal(states[12].style.display, 'block');
assert.equal(states[12].attributes['aria-hidden'], 'false'); assert(states.slice(0, 12).every(state => state.style.display === 'none'));
for (const [template, index] of [['周卡', 9], ['月签到活动', 7], ['打码赠金', 11], ['打码返水', 0]]) {
  coreWindow.testCore.setTemplateState(template); assert(!coreClasses.has('special-pack-template-active'));
  assert.equal(states[index].style.display, 'block'); assert.equal(states[12].style.display, 'none');
  coreWindow.testCore.setTemplateState('特惠礼包'); assert.equal(states[12].style.display, 'block');
}

function harness(search = '', records = []) {
  const nodes = {}, extra = [], allNodes = [];
  let raw = JSON.stringify(records), readError = false, writeError = false, confirmed = true;
  const document = { readyState: 'loading', activeElement: null, body: { classList: { contains() { return true; } } },
    addEventListener(name, callback) { if (name === 'DOMContentLoaded') this.onReady = callback; },
    getElementById(id) { return nodes[id] || null; },
    querySelectorAll(selector) { if (selector.startsWith('input[name=')) return radios; return extra.filter(node => matches(node, selector)); },
    querySelector(selector) { if (selector.includes(':checked')) return radios.find(node => node.checked); return this.querySelectorAll(selector)[0] || null; },
    createElement(tag) { return element(tag); }, execCommand() {} };
  function matches(node, selector) {
    const match = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    return match && node.hasAttribute(match[1]) && (match[2] === undefined || node.getAttribute(match[1]) === match[2]);
  }
  function element(tag = 'input') {
    const node = { tagName: tag.toUpperCase(), value: '', checked: false, hidden: false, disabled: false, required: false, inert: false, dataset: {}, attributes: {}, children: [], listeners: {}, isConnected: true, innerHTML: '',
      setAttribute(name, value) { this.attributes[name] = String(value); }, getAttribute(name) { return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null; },
      hasAttribute(name) { return Object.hasOwn(this.attributes, name); }, removeAttribute(name) { delete this.attributes[name]; },
      appendChild(child) { child.parent = this; this.children.push(child); return child; },
      focus() { document.activeElement = this; }, scrollIntoView() {}, reportValidity() { return true; },
      addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); },
      dispatch(name, target = this, detail = {}) { const event = Object.assign({ target, preventDefault() {}, stopImmediatePropagation() {} }, detail); for (const callback of this.listeners[name] || []) callback.call(this, event); },
      closest(selector) { if (selector === 'button' && this.tagName === 'BUTTON') return this; if (selector === 'tr' && this.tagName === 'TR') return this; return this.parent ? this.parent.closest(selector) : null; },
      querySelectorAll(selector) { const children = this.children.flatMap(child => [child, ...child.querySelectorAll(selector)]); return children.filter(child => matches(child, selector)); },
      remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); }
    };
    Object.defineProperty(node, 'textContent', { get() { return this.text || this.children.map(child => child.textContent).join(''); }, set(value) { this.text = value; this.children = []; } });
    if (tag === 'template') node.content = { childNodes: [] }; // Description sanitization is outside this behavior harness.
    allNodes.push(node); return node;
  }
  for (const id of [...html.matchAll(/id="(specialPack[^"]+)"/g)].map(match => match[1]).concat(['base', 'u4', 'u5', 'u1'])) nodes[id] = element();
  for (const id of ['specialPackTierModal', 'specialPackTierError', 'specialPackError']) nodes[id].hidden = true;
  for (const [suffix, value] of Object.entries({ Name: '测试礼包', Title: '活动标题', StartTime: '2026-11-06T00:00', EndTime: '2026-12-31T23:59', WagerMultiple: '1', Sort: '0' })) nodes['specialPack' + suffix].value = value;
  nodes.specialPackEnabled.checked = true;
  const radios = ['余额', '存钱罐'].map((value, index) => Object.assign(element(), { value, checked: index === 0 }));
  function attr(name, value, tag) { const node = element(tag); node.setAttribute(name, value); extra.push(node); return node; }
  const cycleNodes = Object.fromEntries(cycleKeys.map(cycle => [cycle, { tab: attr('data-sp-tab', cycle, 'button'), panel: attr('data-sp-panel', cycle, 'section'),
    rows: attr('data-sp-rows', cycle, 'tbody'), status: attr('data-sp-status', cycle, 'span'), enabled: attr('data-sp-enabled', cycle, 'input'), add: attr('data-sp-add', cycle, 'button') }]));
  for (const kind of ['Banner', 'Detail']) attr('data-sp-remove-image', kind, 'button');
  const close = attr('data-sp-close', '', 'button');
  const window = { location: { search, href: '' }, confirm() { return confirmed; }, localStorage: {
    getItem(name) { assert.equal(name, key); if (readError) throw Error('read denied'); return raw; },
    setItem(name, value) { assert.equal(name, key); if (writeError) throw Error('quota'); raw = value; }
  } };
  const exposed = '  window.testApi = { amountCents, money, validateTier, validateCycles, validateRecord, collectRecord, saveActivity };\n';
  vm.runInNewContext(source.replace("  if (document.readyState === 'loading')", exposed + "  if (document.readyState === 'loading')"), { window, document, URLSearchParams });
  document.onReady();
  function click(button) { nodes.specialPackForm.dispatch('click', button); }
  function open(cycle, tierIndex) {
    if (tierIndex === undefined) click(cycleNodes[cycle].add);
    else { const row = cycleNodes[cycle].rows.children[tierIndex]; click(row.children[3].children[0]); }
  }
  function fill(amount, price, enabled = true) { nodes.specialPackTierAmount.value = amount; nodes.specialPackTierPrice.value = price; nodes.specialPackTierEnabled.checked = enabled; }
  function add(cycle, amount, price, enabled = true) { open(cycle); fill(amount, price, enabled); nodes.specialPackTierForm.dispatch('submit'); }
  return { nodes, cycleNodes, window, api: window.testApi, click, open, fill, add,
    state() { return JSON.parse(JSON.stringify(window.testApi.collectRecord())); }, stored() { return JSON.parse(raw); }, raw() { return raw; }, setRaw(value) { raw = value; },
    submitTier() { nodes.specialPackTierForm.dispatch('submit'); }, cancelTier() { close.dispatch('click'); },
    setCycle(cycle, enabled) { cycleNodes[cycle].enabled.checked = enabled; nodes.specialPackForm.dispatch('change', cycleNodes[cycle].enabled); },
    tab(cycle) { click(cycleNodes[cycle].tab); }, save() { nodes.specialPackForm.dispatch('submit'); },
    failRead(value = true) { readError = value; }, failWrite(value = true) { writeError = value; }, confirm(value) { confirmed = value; }
  };
}

const test = harness();
for (const invalid of ['', '0', '-1', '0.001', '1e2', 'Infinity', 'NaN', '9007199254740991']) assert.equal(test.api.amountCents(invalid), null, invalid);
assert.equal(test.api.amountCents('0.01'), 1); assert.equal(test.api.amountCents('1000000.10'), 100000010);
assert.equal(test.api.money(test.api.amountCents('0.10')), '0.1');
assert(!test.nodes.specialPackError.textContent);
test.save(); assert(!test.nodes.specialPackError.hidden, 'enabled cycle needs an enabled tier'); assert.equal(test.window.location.href, '');
test.open('daily'); assert(!test.nodes.specialPackTierModal.hidden && test.nodes.base.inert);
test.fill('1000000', '900000'); test.cancelTier(); assert.equal(test.state().cycles.daily.tiers.length, 0, 'cancel new must discard draft');
assert(test.nodes.specialPackTierModal.hidden && !test.nodes.base.inert);
test.add('daily', '1000000', '900000');
test.add('daily', '200', '100');
test.add('daily', '500', '50');
assert.deepEqual(test.state().cycles.daily.tiers.map(tier => tier.amount), ['200', '500', '1000000'], 'amounts sorted, prices may decrease');
test.add('daily', '200.00', '50');
assert(!test.nodes.specialPackTierError.hidden); assert(!test.nodes.specialPackTierModal.hidden);
assert.equal(test.state().cycles.daily.tiers.length, 3, 'same amount with different price must be rejected'); test.cancelTier();
test.open('daily', 0); test.fill('500', '25'); test.submitTier();
assert(!test.nodes.specialPackTierError.hidden, 'editing amount to another tier amount must fail'); test.cancelTier();
test.open('daily', 0); test.fill('200', '25'); test.cancelTier();
assert.equal(test.state().cycles.daily.tiers[0].price, '100', 'cancel edit preserves stored draft');
test.open('daily', 0); test.fill('200.00', '125.10'); test.submitTier();
assert.equal(test.state().cycles.daily.tiers[0].price, '125.1', 'edit same amount excludes own id');
for (const [amount, price] of [['10', '10'], ['10', '11'], ['-1', '0.1'], ['10', '0'], ['10.001', '1'], ['10', '1.001']]) {
  test.open('daily'); test.fill(amount, price); test.submitTier(); assert(!test.nodes.specialPackTierError.hidden); test.cancelTier();
}
test.tab('weekly'); assert(test.cycleNodes.daily.panel.hidden && !test.cycleNodes.weekly.panel.hidden);
test.add('weekly', '200', '199'); assert.equal(test.state().cycles.weekly.tiers.length, 1, 'same amount allowed across cycles');
test.setCycle('weekly', true); test.tab('monthly'); test.add('monthly', '0.10', '0.01'); test.setCycle('monthly', true);
test.tab('daily'); assert.equal(test.state().cycles.daily.tiers.length, 3); assert.equal(test.cycleNodes.daily.rows.children[0].children[0].textContent, '200');
test.setCycle('weekly', false); assert.equal(test.state().cycles.weekly.tiers.length, 1, 'disabling a cycle preserves its tiers');
test.setCycle('daily', false); test.setCycle('monthly', false); test.save();
assert(!test.nodes.specialPackError.hidden); assert.equal(test.window.location.href, '', 'at least one enabled cycle required');
test.setCycle('monthly', true); test.open('monthly', 0); test.fill('0.10', '0.01', false); test.submitTier(); test.save();
assert(!test.nodes.specialPackError.hidden); assert.equal(test.window.location.href, '', 'enabled cycle needs enabled tier');
test.open('monthly', 0); test.fill('0.10', '0.01', true); test.submitTier();
test.setCycle('daily', true);
test.save(); assert.equal(test.window.location.href, '优惠活动列表.html?specialPackSaved=1');
const saved = test.stored()[0]; assert.equal(test.stored().length, 1); assert.equal(saved.currency, 'merchant');
assert.deepEqual(saved.cycles.daily.tiers.map(tier => tier.price), ['125.1', '50', '900000'], 'non-monotonic prices and discount ratios may save');
assert.equal(saved.cycles.monthly.tiers[0].amount, '0.1'); assert.equal(saved.cycles.monthly.tiers[0].price, '0.01');
assert(!/percent|discount|rate/i.test(JSON.stringify(saved)), 'discount percentages are not persisted');

const edit = harness('?template=' + encodeURIComponent('特惠礼包') + '&specialPackId=' + encodeURIComponent(saved.id), [saved]);
assert.deepEqual(edit.state().cycles, saved.cycles); assert.equal(edit.nodes.specialPackName.value, saved.name);
assert(!edit.cycleNodes.weekly.enabled.checked && edit.state().cycles.weekly.tiers.length === 1, 'disabled tiers reload');
edit.nodes.specialPackName.value = '更新礼包'; edit.save(); assert.equal(edit.stored().length, 1); assert.equal(edit.stored()[0].id, saved.id); assert.equal(edit.stored()[0].name, '更新礼包');
const longTerm = harness('?specialPackId=' + saved.id, [saved]);
longTerm.nodes.specialPackLongTerm.checked = true; longTerm.nodes.specialPackLongTerm.dispatch('change');
assert(longTerm.nodes.specialPackEndTime.disabled && !longTerm.nodes.specialPackEndTime.required); assert.equal(longTerm.nodes.specialPackEndTime.value, '');
longTerm.save(); assert.equal(longTerm.stored()[0].endTime, '');
const reloadLong = harness('?specialPackId=' + saved.id, longTerm.stored());
assert(reloadLong.nodes.specialPackLongTerm.checked); reloadLong.nodes.specialPackLongTerm.checked = false; reloadLong.nodes.specialPackLongTerm.dispatch('change');
assert.equal(reloadLong.nodes.specialPackEndTime.value, saved.endTime, 'saved long-term mode restores previous end time');
assert(!reloadLong.nodes.specialPackEndTime.disabled && reloadLong.nodes.specialPackEndTime.required);

for (const scenario of ['write', 'read', 'corrupt', 'missing-edit']) {
  const failure = harness('?specialPackId=' + saved.id, [saved]);
  failure.nodes.specialPackName.value = '草稿保留';
  if (scenario === 'write') failure.failWrite();
  if (scenario === 'read') failure.failRead();
  if (scenario === 'corrupt') failure.setRaw('{}');
  if (scenario === 'missing-edit') failure.setRaw('[]');
  const before = failure.raw(); failure.save();
  assert.equal(failure.window.location.href, '', scenario + ' must stay on form'); assert.equal(failure.raw(), before, scenario + ' storage must remain unchanged');
  assert.equal(failure.nodes.specialPackName.value, '草稿保留'); assert.deepEqual(failure.state().cycles, saved.cycles); assert(!failure.nodes.specialPackError.hidden);
  failure.failWrite(false); failure.failRead(false); failure.setRaw(JSON.stringify([saved])); failure.save(); assert.equal(failure.stored()[0].name, '草稿保留', scenario + ' retry must save retained draft');
}
const invalidEdit = harness('?specialPackId=missing', [saved]); invalidEdit.save(); assert.equal(invalidEdit.window.location.href, ''); assert(!invalidEdit.nodes.specialPackError.hidden);
const cancel = harness('?specialPackId=' + saved.id, [saved]); cancel.nodes.specialPackName.value = '不要保存'; cancel.nodes.u5.dispatch('click');
assert.equal(cancel.window.location.href, '优惠活动列表.html'); assert.deepEqual(cancel.stored()[0], saved);
const deletion = harness('?specialPackId=' + saved.id, [saved]); const first = deletion.cycleNodes.daily.rows.children[0].children[3].children[1];
deletion.confirm(false); deletion.click(first); assert.equal(deletion.state().cycles.daily.tiers.length, 3);
deletion.confirm(true); deletion.click(first); assert.equal(deletion.state().cycles.daily.tiers.length, 2);
console.log('PASS: special pack HTML ancestry/unique IDs/UTF-8, actual template switching, modal add/edit/cancel/delete, per-cycle duplicate amounts, cross-cycle amounts, decimal strings, amount sorting with independent prices, tabs and disabled drafts, enabled-tier requirements, create/edit/reload/cancel, long-term end-time fallback, storage failures and retry.');
