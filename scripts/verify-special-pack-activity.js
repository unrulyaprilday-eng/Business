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
assert.equal(actualStates.length, 14); assert.equal(actualStates[12], actualState, 'special pack is the thirteenth direct panel state');
assert.equal(domIds.get('specialPackForm').parent.id, 'u6_state12_content');
assert(!domIds.has('specialPackTierModal'), 'tiers use inline editing without a modal');
for (const suffix of ['Daily', 'Weekly', 'Monthly']) {
  const section = domIds.get('specialPackPanel' + suffix);
  assert(section && !/\bhidden\b|tabpanel/.test(section.token), 'all cycle sections are visible');
}
assert(!html.includes('data-sp-tab='));
assert.equal((html.match(/class="sp-add-tier"/g) || []).length, 3);
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
    const node = { tagName: tag.toUpperCase(), value: '', checked: false, hidden: false, disabled: false, required: false, inert: false, dataset: {}, attributes: {}, children: [], listeners: {}, isConnected: true, innerHTML: '', classList: { toggle() {} },
      setAttribute(name, value) { this.attributes[name] = String(value); }, getAttribute(name) { return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null; },
      hasAttribute(name) { return Object.hasOwn(this.attributes, name); }, removeAttribute(name) { delete this.attributes[name]; },
      appendChild(child) { child.parent = this; this.children.push(child); return child; },
      focus() { document.activeElement = this; }, scrollIntoView() {}, reportValidity() { return true; },
      addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); },
      dispatch(name, target = this, detail = {}) { const event = Object.assign({ target, preventDefault() {}, stopImmediatePropagation() {} }, detail); for (const callback of this.listeners[name] || []) callback.call(this, event); },
      closest(selector) { if (selector === 'button' && this.tagName === 'BUTTON') return this; if (selector === 'tr' && this.tagName === 'TR') return this; return this.parent ? this.parent.closest(selector) : null; },
      querySelectorAll(selector) { const children = this.children.flatMap(child => [child, ...child.querySelectorAll(selector)]); return children.filter(child => matches(child, selector)); },
      querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
      remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); }
    };
    Object.defineProperty(node, 'textContent', { get() { return this.text || this.children.map(child => child.textContent).join(''); }, set(value) { this.text = value; this.children = []; } });
    if (tag === 'template') node.content = { childNodes: [] }; // Description sanitization is outside this behavior harness.
    allNodes.push(node); return node;
  }
  for (const id of [...html.matchAll(/id="(specialPack[^"]+)"/g)].map(match => match[1]).concat(['base', 'u4', 'u5', 'u1'])) nodes[id] = element();
  nodes.specialPackError.hidden = true;
  for (const [suffix, value] of Object.entries({ Name: '测试礼包', Title: '活动标题', StartTime: '2026-11-06T00:00', EndTime: '2026-12-31T23:59', WagerMultiple: '1', Sort: '0' })) nodes['specialPack' + suffix].value = value;
  nodes.specialPackEnabled.checked = true;
  const radios = ['余额', '存钱罐'].map((value, index) => Object.assign(element(), { value, checked: index === 0 }));
  function attr(name, value, tag) { const node = element(tag); node.setAttribute(name, value); extra.push(node); return node; }
  const cycleNodes = Object.fromEntries(cycleKeys.map(cycle => [cycle, { panel: attr('data-sp-panel', cycle, 'section'),
    rows: attr('data-sp-rows', cycle, 'tbody'), status: attr('data-sp-status', cycle, 'span'), enabled: attr('data-sp-enabled', cycle, 'input'), add: attr('data-sp-add', cycle, 'button') }]));
  for (const kind of ['Banner', 'Detail']) attr('data-sp-remove-image', kind, 'button');
  const window = { location: { search, href: '' }, confirm() { return confirmed; }, localStorage: {
    getItem(name) { assert.equal(name, key); if (readError) throw Error('read denied'); return raw; },
    setItem(name, value) { assert.equal(name, key); if (writeError) throw Error('quota'); raw = value; }
  } };
  const exposed = '  window.testApi = { amountCents, money, validateTier, validateCycles, validateRecord, collectRecord, saveActivity };\n';
  vm.runInNewContext(source.replace("  if (document.readyState === 'loading')", exposed + "  if (document.readyState === 'loading')"), { window, document, URLSearchParams });
  document.onReady();
  function click(button) { nodes.specialPackForm.dispatch('click', button); }
  function fill(cycle, index, amount, price, enabled = true) {
    const row = cycleNodes[cycle].rows.children[index];
    [amount, price].forEach((value, field) => { const input = row.children[field + 1].children[0]; input.value = value; input.dispatch('input'); });
    const check = row.children[3].children[0].children[0]; check.checked = enabled; check.dispatch('change');
  }
  function add(cycle, amount = '', price = '', enabled = true) {
    click(cycleNodes[cycle].add);
    fill(cycle, cycleNodes[cycle].rows.children.length - 1, amount, price, enabled);
  }
  return { nodes, cycleNodes, window, api: window.testApi, click, fill, add, document,
    state() { return JSON.parse(JSON.stringify(window.testApi.collectRecord())); }, stored() { return JSON.parse(raw); }, raw() { return raw; }, setRaw(value) { raw = value; },
    remove(cycle, index) { click(cycleNodes[cycle].rows.children[index].children[4].children[0]); },
    setCycle(cycle, enabled) { cycleNodes[cycle].enabled.checked = enabled; nodes.specialPackForm.dispatch('change', cycleNodes[cycle].enabled); },
    save() { nodes.specialPackForm.dispatch('submit'); },
    failRead(value = true) { readError = value; }, failWrite(value = true) { writeError = value; }
  };
}

const test = harness();
for (const invalid of ['', '0', '-1', '0.001', '1e2', 'Infinity', 'NaN', '9007199254740991']) assert.equal(test.api.amountCents(invalid), null, invalid);
assert.equal(test.api.amountCents('0.01'), 1);
assert.equal(test.api.money(test.api.amountCents('0.10')), '0.1');
test.save(); assert(!test.nodes.specialPackError.hidden); assert.equal(test.window.location.href, '');
test.add('daily', '1000000', '900000'); test.add('daily', '200', '125.10'); test.add('daily', '500', '50');
assert.equal(test.cycleNodes.daily.rows.children.length, 3);
assert.deepEqual(test.state().cycles.daily.tiers.map(tier => tier.amount), ['1000000', '200', '500'], 'typing does not move rows or lose focus');
test.add('daily', '200.00', '50'); test.save();
assert.equal(test.window.location.href, '');
assert.equal(test.cycleNodes.daily.rows.children[1].children[1].children[0].getAttribute('aria-invalid'), 'true');
assert.equal(test.cycleNodes.daily.rows.children[3].children[1].children[0].getAttribute('aria-invalid'), 'true');
test.remove('daily', 3);
assert.equal(test.cycleNodes.daily.rows.children[1].children[1].children[0].getAttribute('aria-invalid'), 'false', 'removing duplicate clears both errors');
for (const [amount, price] of [['10', '10'], ['10', '11'], ['-1', '0.1'], ['10', '0'], ['10.001', '1'], ['10', '1.001']]) {
  test.add('daily', amount, price); test.save(); assert.equal(test.window.location.href, ''); test.remove('daily', 3);
}
test.add('weekly', '200', '199'); test.setCycle('weekly', true);
test.add('monthly', '0.10', '0.01'); test.setCycle('monthly', true);
test.setCycle('weekly', false); assert.equal(test.state().cycles.weekly.tiers.length, 1);
assert(cycleKeys.every(key => !test.cycleNodes[key].panel.hidden), 'all periods stay visible, including disabled ones');
test.save(); assert.equal(test.window.location.href, '优惠活动列表.html?specialPackSaved=1');
const saved = test.stored()[0];
assert.deepEqual(saved.cycles.daily.tiers.map(tier => tier.amount), ['200', '500', '1000000']);
assert.deepEqual(saved.cycles.daily.tiers.map(tier => tier.price), ['125.1', '50', '900000'], 'non-monotonic prices and discounts allowed');
assert.equal(saved.cycles.weekly.tiers[0].amount, '200', 'cross-type equal amounts allowed');
assert.equal(saved.cycles.monthly.tiers[0].amount, '0.1');
assert(!/percent|discount|rate/i.test(JSON.stringify(saved)));
const edit = harness('?specialPackId=' + saved.id, [saved]);
assert.deepEqual(edit.state().cycles, saved.cycles);
assert.equal(edit.cycleNodes.daily.rows.children[0].children[1].children[0].value, '200', 'loaded tiers are immediately editable');
edit.fill('daily', 0, '750', '600'); edit.save();
assert.equal(edit.stored().length, 1); assert.equal(edit.stored()[0].id, saved.id);
assert.deepEqual(edit.stored()[0].cycles.daily.tiers.map(tier => tier.amount), ['500', '750', '1000000']);
const disabled = harness('?specialPackId=' + saved.id, [saved]);
cycleKeys.forEach(key => disabled.setCycle(key, false)); disabled.save(); assert.equal(disabled.window.location.href, '');
disabled.setCycle('monthly', true); disabled.fill('monthly', 0, '0.1', '0.01', false); disabled.save(); assert.equal(disabled.window.location.href, '');
disabled.fill('monthly', 0, '0.1', '0.01', true); disabled.save(); assert(disabled.window.location.href);
const cancel = harness('?specialPackId=' + saved.id, [saved]); cancel.fill('daily', 0, '700', '600'); cancel.nodes.u5.dispatch('click');
assert.equal(cancel.window.location.href, '优惠活动列表.html'); assert.deepEqual(cancel.stored()[0], saved);
const incomplete = harness('?specialPackId=' + saved.id, [saved]); incomplete.add('weekly', '500', ''); incomplete.save();
assert.equal(incomplete.window.location.href, '');
assert.equal(incomplete.document.activeElement, incomplete.cycleNodes.weekly.rows.children[1].children[2].children[0], 'focus invalid field in visible weekly section');
incomplete.remove('weekly', 1); incomplete.save(); assert(incomplete.window.location.href);
for (const scenario of ['write', 'read', 'corrupt', 'missing-edit']) {
  const failure = harness('?specialPackId=' + saved.id, [saved]); failure.fill('daily', 0, '750', '600');
  if (scenario === 'write') failure.failWrite();
  if (scenario === 'read') failure.failRead();
  if (scenario === 'corrupt') failure.setRaw('{}');
  if (scenario === 'missing-edit') failure.setRaw('[]');
  const before = failure.raw(); failure.save();
  assert.equal(failure.window.location.href, ''); assert.equal(failure.raw(), before); assert.equal(failure.state().cycles.daily.tiers[0].amount, '750');
  failure.failWrite(false); failure.failRead(false); failure.setRaw(JSON.stringify([saved])); failure.save();
  assert.equal(failure.stored()[0].cycles.daily.tiers[1].amount, '750', 'retry saves retained inline data');
}
const longTerm = harness('?specialPackId=' + saved.id, [saved]);
longTerm.nodes.specialPackLongTerm.checked = true; longTerm.nodes.specialPackLongTerm.dispatch('change'); longTerm.save();
assert.equal(longTerm.stored()[0].endTime, '');
const reloadLong = harness('?specialPackId=' + saved.id, longTerm.stored());
reloadLong.nodes.specialPackLongTerm.checked = false; reloadLong.nodes.specialPackLongTerm.dispatch('change');
assert.equal(reloadLong.nodes.specialPackEndTime.value, saved.endTime);
const missing = harness('?specialPackId=missing', [saved]); missing.save(); assert.equal(missing.window.location.href, '');
console.log('PASS: three stacked periods, inline add/edit/delete, field errors, same-type duplicates, cross-type equal amounts, stable typing order, sorted save, reload, cancel and storage retry.');
