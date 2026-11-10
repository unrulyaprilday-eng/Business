const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const page = '\u65b0\u589e\u6d3b\u52a8';
const template = '\u780d\u4e00\u5200';
const listUrl = '\u4f18\u60e0\u6d3b\u52a8\u5217\u8868.html';
const html = read(page + '.html');
const source = read('custom/js/bargain-activity.js');
const core = read('custom/js/' + page + '.js');
const css = read('custom/css/bargain-activity.css');
const key = 'promoBargainActivities';
const inviteTypes = ['phone', 'email', 'depositAmount', 'wagerAmount'];
assert(!/\uFFFD|\?{3,}/.test(source + css), 'UTF-8 integrity');
assert(css.includes('[hidden]') && css.includes('appearance: none'), 'hidden and custom control styling');

// Parse the actual exported ancestry, including all direct Axure states.
const stack = [], domIds = new Map(), domNodes = [];
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const structuralHtml = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
function attributes(token) {
  const result = {};
  for (const match of token.matchAll(/\s([\w:-]+)(?:="([^"]*)"|='([^']*)')?/g)) result[match[1]] = match[2] ?? match[3] ?? '';
  return result;
}
// Small detached DOM for exercising the production HTML sanitizer. It parses
// fixture HTML but never executes scripts or requests URLs.
function miniDom(tag = '#fragment') {
  const node = { nodeType: tag === '#fragment' ? 11 : tag === '#text' ? 3 : tag === '#comment' ? 8 : 1,
    tagName: tag.toUpperCase(), childNodes: [], attributes: [], parentNode: null,
    appendChild(child) { if (child.parentNode) child.remove(); child.parentNode = this; this.childNodes.push(child); return child; },
    insertBefore(child, before) { if (child.parentNode) child.remove(); child.parentNode = this; const index = this.childNodes.indexOf(before); this.childNodes.splice(index < 0 ? this.childNodes.length : index, 0, child); return child; },
    remove() { if (this.parentNode) { this.parentNode.childNodes = this.parentNode.childNodes.filter(child => child !== this); this.parentNode = null; } },
    removeAttribute(name) { this.attributes = this.attributes.filter(attr => attr.name !== name); }
  };
  Object.defineProperty(node, 'firstChild', { get() { return this.childNodes[0] || null; } });
  Object.defineProperty(node, 'textContent', { get() { return this.nodeType === 3 ? this.data : this.childNodes.filter(child => child.nodeType !== 8).map(child => child.textContent).join(''); }, set(value) { this.childNodes = []; const text = miniDom('#text'); text.data = String(value); this.appendChild(text); } });
  const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const decode = value => value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_, entity) => {
    if (entity.startsWith('#')) return String.fromCodePoint(entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1)));
    return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' }[entity.toLowerCase()];
  });
  function serialize(child) {
    if (child.nodeType === 3) return escape(child.data);
    if (child.nodeType === 8) return '<!--' + child.data + '-->';
    const tagName = child.tagName.toLowerCase();
    const attrs = child.attributes.map(attr => ' ' + attr.name + '="' + escape(attr.value).replace(/"/g, '&quot;') + '"').join('');
    return '<' + tagName + attrs + '>' + child.childNodes.map(serialize).join('') + (voidTags.has(tagName) ? '' : '</' + tagName + '>');
  }
  Object.defineProperty(node, 'innerHTML', { configurable: true, get() { return this.childNodes.map(serialize).join(''); }, set(value) {
    this.childNodes = []; const parents = [this];
    for (const token of String(value).match(/<!--[\s\S]*?-->|<\/?[a-z][^>]*>|[^<]+|</gi) || []) {
      if (token.startsWith('<!--')) { const comment = miniDom('#comment'); comment.data = token.slice(4, -3); parents.at(-1).appendChild(comment); continue; }
      if (token.startsWith('</')) { const closeTag = /^<\/([^\s>]+)/.exec(token)[1].toUpperCase(); const index = parents.findLastIndex(parent => parent.tagName === closeTag); if (index > 0) parents.length = index; continue; }
      if (token.startsWith('<') && /^<[a-z]/i.test(token)) {
        const child = miniDom(/^<([^\s/>]+)/.exec(token)[1].toLowerCase());
        for (const match of token.matchAll(/\s([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) child.attributes.push({ name: match[1].toLowerCase(), value: decode(match[2] ?? match[3] ?? match[4] ?? '') });
        parents.at(-1).appendChild(child); if (!voidTags.has(child.tagName.toLowerCase()) && !token.endsWith('/>')) parents.push(child);
      } else { const text = miniDom('#text'); text.data = decode(token); parents.at(-1).appendChild(text); }
    }
  } });
  if (tag === 'template') {
    node.content = miniDom();
    Object.defineProperty(node, 'innerHTML', { configurable: true, get() { return this.content.innerHTML; }, set(value) { this.content.innerHTML = value; } });
  }
  return node;
}
for (const match of structuralHtml.matchAll(/<\/?([a-z][\w:-]*)\b[^>]*>/gi)) {
  const token = match[0], tag = match[1].toLowerCase();
  if (token.startsWith('</')) { const node = stack.pop(); assert(node && node.tag === tag, 'HTML ancestry: ' + token); continue; }
  const attrs = attributes(token), id = attrs.id;
  const node = { tag, id, attrs, token, parent: stack.at(-1), children: [] };
  if (node.parent) node.parent.children.push(node);
  if (id) { assert(!domIds.has(id), 'Duplicate id: ' + id); domIds.set(id, node); }
  domNodes.push(node);
  if (!voidTags.has(tag) && !token.endsWith('/>')) stack.push(node);
}
assert.equal(stack.length, 0, 'All HTML tags close');
const actualStates = domIds.get('u6').children.filter(node => /\bpanel_state\b/.test(node.attrs.class));
assert.equal(actualStates.length, 14, 'fourteen direct panel states');
assert.equal(actualStates[13].id, 'u6_state13');
assert.equal(domIds.get('bargainForm').parent.id, 'u6_state13_content');
assert.equal(domIds.get('bargainTaskModal').parent.tag, 'body', 'modal outside inert base');
assert(Object.hasOwn(domIds.get('bargainTaskModal').attrs, 'hidden'));
assert(html.includes('value="' + template + '"'));
assert(html.includes('custom/js/bargain-activity.js') && html.includes('custom/css/bargain-activity.css'));
assert(html.indexOf('custom/js/bargain-activity.js') > html.indexOf('custom/js/' + page + '.js'), 'custom task behavior loads after common core');
for (const id of ['bargainInitialRows', 'bargainPersonalRows', 'bargainInvitationRows']) assert(domIds.get(id).children.some(node => node.tag === 'tr'), 'static table fallback: ' + id);
assert(!['input', 'textarea', 'select'].includes(domIds.get('bargainInitialCuts').tag), 'initial cut total is read-only derived text');
assert.equal(domNodes.filter(node => Object.hasOwn(node.attrs, 'data-ba-condition')).length, 4);
const countdownIds = ['Enabled', 'Fields', 'Days', 'Hours', 'Hint'].map(suffix => 'bargainRegistrationCountdown' + suffix);
for (const id of countdownIds) assert(domIds.has(id), 'registration countdown control: ' + id);
assert(!Object.hasOwn(domIds.get(countdownIds[0]).attrs, 'checked'), 'registration countdown defaults off');
assert(Object.hasOwn(domIds.get(countdownIds[1]).attrs, 'hidden'), 'registration countdown fields initially hidden');
for (const [suffix, value] of [['Days', '1'], ['Hours', '0']]) {
  const attrs = domIds.get('bargainRegistrationCountdown' + suffix).attrs;
  assert.equal(attrs.value, value); assert.equal(attrs.min, '0'); assert.equal(attrs.step, '1'); assert(Object.hasOwn(attrs, 'disabled'));
}
assert.equal(domIds.get('bargainRegistrationCountdownHours').attrs.max, '23');
const countdownHintNode = domIds.get('bargainRegistrationCountdownHint');
const countdownHintOffset = html.indexOf('id="bargainRegistrationCountdownHint"');
const countdownHintMarkup = html.slice(countdownHintOffset, html.indexOf('</' + countdownHintNode.tag + '>', countdownHintOffset));
assert(countdownHintMarkup.includes('\u6ce8\u518c') && countdownHintMarkup.includes('\u6d3b\u52a8'), 'hint explains registration start and activity period constraint');
assert(/\.ba-duration\s*\{[^}]*grid-template-columns:\s*max-content\s+max-content/i.test(css), 'countdown groups keep intrinsic width');
assert(/\.ba-duration\s*>\s*label\s*\{[^}]*grid-template-columns:\s*\d+px\s+max-content/i.test(css), 'countdown input has a compact fixed grid column');
assert(/\.ba-duration\s*>\s*label\s*>\s*span\s*\{[^}]*white-space:\s*nowrap/i.test(css), 'countdown units do not wrap');
assert.equal(domIds.get('bargainDescription').tag, 'div');
assert.equal(domIds.get('bargainDescription').attrs.contenteditable, 'true', 'activity rules use rich text editing');
for (const kind of ['Banner', 'Detail']) {
  assert.equal(domIds.get('bargain' + kind + 'File').attrs.type, 'file');
  assert.equal(domIds.get('bargain' + kind + 'Preview').tag, 'img');
  for (const name of ['data-ba-upload', 'data-ba-remove-image']) assert(domNodes.some(node => node.attrs[name] === kind));
}
const richCommands = ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList', 'undo', 'redo'];
for (const command of richCommands) assert(domNodes.some(node => node.attrs['data-ba-command'] === command), 'rich text command: ' + command);
const curveHint = domIds.get('bargainProgressCurveHint'); assert(curveHint, 'progress curve explanation exists');
const curveOffset = html.indexOf('id="bargainProgressCurveHint"');
const curveMarkup = html.slice(curveOffset, html.indexOf('</' + curveHint.tag + '>', curveOffset));
for (const wording of ['\u6e10\u8fd1', '\u9012\u51cf', '\u6700\u540e\u4e00\u5200', '100%']) assert(curveMarkup.includes(wording), 'progress explanation: ' + wording);

const coreClasses = new Set(['shared-frame']);
function stateNode(id) { return { id, style: {}, attributes: {}, classList: { contains(name) { return name === 'panel_state'; } },
  getAttribute(name) { return this.attributes[name] || null; }, setAttribute(name, value) { this.attributes[name] = value; } }; }
const states = actualStates.map(node => stateNode(node.id));
const panel = Object.assign(stateNode('u6'), { children: states });
const coreWindow = { location: { search: '' } };
const coreDocument = { readyState: 'loading', addEventListener() {}, querySelector() { return null; }, getElementById(id) { return id === 'u6' ? panel : null; }, body: {} };
Object.defineProperty(coreDocument.body, 'className', { get() { return [...coreClasses].join(' '); }, set(value) { coreClasses.clear(); value.split(/\s+/).filter(Boolean).forEach(name => coreClasses.add(name)); } });
assert(core.includes('  ready(function () {'), 'core exposure marker');
vm.runInNewContext(core.replace('  ready(function () {', '  window.testCore = { setTemplateState, TEMPLATE_TO_STATE };\n  ready(function () {'), { window: coreWindow, document: coreDocument, URLSearchParams });
assert.equal(coreWindow.testCore.TEMPLATE_TO_STATE[template], 13);
for (const [name, index] of Object.entries(coreWindow.testCore.TEMPLATE_TO_STATE)) {
  coreWindow.testCore.setTemplateState(template);
  assert.equal(states[13].style.display, 'block'); assert(coreClasses.has('bargain-template-active'));
  coreWindow.testCore.setTemplateState(name);
  assert.equal(states[index].style.display, 'block', name);
  assert.equal(states[index].attributes['aria-hidden'], 'false');
  assert(states.every((state, i) => i === index || state.style.display === 'none'));
  assert.equal(coreClasses.has('bargain-template-active'), name === template);
  assert(coreClasses.has('shared-frame'));
}

function harness(search = '', records = []) {
  const nodes = {}, registry = [];
  const commands = [], readers = [], images = [];
  let raw = JSON.stringify(records), readError = false, writeError = false, confirmed = true, active = true;
  const document = { readyState: 'loading', activeElement: null, body: { classList: { contains(name) { return active && name === 'bargain-template-active'; } } },
    addEventListener(name, callback) { if (name === 'DOMContentLoaded') this.onReady = callback; },
    getElementById(id) { return nodes[id] || null; },
    querySelectorAll(selector) { return registry.filter(node => node.isConnected && matches(node, selector)); },
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
    createElement(tag) { return miniDom(tag); },
    execCommand(command, showUI, value) {
      commands.push({ command, showUI, value, activeElement: this.activeElement });
      if (command === 'insertHTML') nodes.bargainDescription.innerHTML += value;
      if (command === 'insertText') { const safe = miniDom('div'); safe.textContent = value; nodes.bargainDescription.innerHTML += safe.innerHTML; }
      return true;
    }
  };
  function matches(node, selector) {
    if (selector === 'button, input, select') return ['button', 'input', 'select'].includes(node.tag);
    if (selector === 'button') return node.tag === 'button';
    if (selector === '[hidden]') return node.hidden;
    const match = selector.match(/^(input)?\[([^=\]]+)(?:="([^"]*)")?\](:checked)?$/);
    return Boolean(match && (!match[1] || node.tag === 'input') && node.hasAttribute(match[2]) &&
      (match[3] === undefined || node.getAttribute(match[2]) === match[3]) && (!match[4] || node.checked));
  }
  function element(tag = 'input', attrs = {}) {
    const node = { tag, tagName: tag.toUpperCase(), value: attrs.value || '', checked: Object.hasOwn(attrs, 'checked'), hidden: Object.hasOwn(attrs, 'hidden'), disabled: Object.hasOwn(attrs, 'disabled'), required: Object.hasOwn(attrs, 'required'), inert: false, dataset: {}, attributes: { ...attrs }, children: [], listeners: {}, isConnected: true,
      setAttribute(name, value) { this.attributes[name] = String(value); }, getAttribute(name) { return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null; }, hasAttribute(name) { return Object.hasOwn(this.attributes, name); },
      removeAttribute(name) { delete this.attributes[name]; if (name === 'src') delete this.src; },
      focus() { document.activeElement = this; }, scrollIntoView() {},
      click() { this.clicked = (this.clicked || 0) + 1; this.dispatch('click'); },
      addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); },
      dispatch(name, target = this, detail = {}) { const event = Object.assign({ target, preventDefault() {}, stopImmediatePropagation() {} }, detail); for (const callback of this.listeners[name] || []) callback.call(this, event); },
      closest(selector) { return matches(this, selector) ? this : this.parent ? this.parent.closest(selector) : null; },
      querySelectorAll(selector) { return registry.filter(item => { if (!item.isConnected || !matches(item, selector)) return false; for (let parent = item.parent; parent; parent = parent.parent) if (parent === this) return true; return false; }); }
    };
    Object.defineProperty(node, 'innerHTML', { get() { return this.markup || ''; }, set(value) {
      function disconnect(child) { child.isConnected = false; child.children.forEach(disconnect); }
      this.children.forEach(disconnect); this.children = []; this.markup = value;
      for (const match of value.matchAll(/<button\b[^>]*>/g)) { const button = element('button', attributes(match[0])); button.parent = this; this.children.push(button); }
    } });
    Object.defineProperty(node, 'textContent', { get() { const parsed = miniDom('div'); parsed.innerHTML = this.markup || ''; return parsed.textContent; }, set(value) { const parsed = miniDom('div'); parsed.textContent = value; this.innerHTML = parsed.innerHTML; } });
    Object.defineProperty(node, 'innerText', { get() { const parsed = miniDom('div'); parsed.innerHTML = (this.markup || '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ''); return parsed.textContent; }, set(value) { this.textContent = value; } });
    registry.push(node); return node;
  }
  const selected = domNodes.filter(node => (node.id && node.id.startsWith('bargain')) || Object.keys(node.attrs).some(name => name.startsWith('data-ba-')) || node.attrs.name === 'bargainRewardTarget');
  const fromDom = new Map();
  for (const node of selected) { const actual = element(node.tag, node.attrs); fromDom.set(node, actual); if (node.id) nodes[node.id] = actual; }
  for (const node of selected) { let parent = node.parent; while (parent && !fromDom.has(parent)) parent = parent.parent; if (parent) { const actual = fromDom.get(node); actual.parent = fromDom.get(parent); actual.parent.children.push(actual); } }
  for (const id of ['base', 'u4', 'u5', 'u1', 'u3012_input']) nodes[id] = element(id === 'base' ? 'div' : 'button');
  nodes.bargainTaskModal.hidden = true;
  for (const [suffix, value] of Object.entries({ Name: 'Test bargain', Title: 'Test title', StartTime: '2026-11-09T00:00', EndTime: '2026-12-31T23:59', WagerMultiple: '1', Sort: '0', RewardAmount: '100.10', InitialPercent: '85', TotalCuts: '20', Description: 'Initial two cuts included.' })) nodes['bargain' + suffix].value = value;
  nodes.bargainDescription.innerHTML = '<p>Test activity rules.</p>';
  class FileReader {
    constructor() { readers.push(this); }
    readAsDataURL(file) { this.file = file; }
  }
  class Image {
    constructor() { images.push(this); this.width = this.naturalWidth = 640; this.height = this.naturalHeight = 320; }
  }
  const window = { location: { search, href: '' }, confirm() { return confirmed; }, localStorage: {
    getItem(name) { assert.equal(name, key); if (readError) throw Error('read denied'); return raw; },
    setItem(name, value) { assert.equal(name, key); if (writeError) throw Error('quota'); raw = value; }
  } };
  const marker = "  if (document.readyState === 'loading')";
  assert(source.includes(marker), 'activity exposure marker');
  vm.runInNewContext(source.replace(marker, '  window.testApi = { collectRecord, validateRecord, validateTask, decimalHundredths, saveActivity, sanitizeDescription };\n' + marker), { window, document, URLSearchParams, FileReader, Image });
  document.onReady();
  const state = () => JSON.parse(JSON.stringify(window.testApi.collectRecord()));
  const click = button => nodes.bargainForm.dispatch('click', button);
  return { nodes, window, document, commands, readers, images, api: window.testApi, state, click,
    raw() { return raw; }, stored() { return JSON.parse(raw); }, setRaw(value) { raw = value; }, failRead(value = true) { readError = value; }, failWrite(value = true) { writeError = value; }, confirm(value) { confirmed = value; }, active(value) { active = value; },
    save() { nodes.u4.dispatch('click'); },
    open(kind, id) { const button = id ? document.querySelectorAll('[data-ba-edit]').find(item => item.getAttribute('data-ba-kind') === kind && item.getAttribute('data-ba-task') === id) : document.querySelector('[data-ba-add="' + kind + '"]'); assert(button); click(button); },
    remove(kind, id) { const button = element('button', { 'data-ba-delete': '', 'data-ba-kind': kind, 'data-ba-task': id }); click(button); },
    submitTask() { nodes.bargainTaskForm.dispatch('submit'); },
    close() { const button = nodes.bargainTaskModal.querySelectorAll('[data-ba-close]')[0]; assert(button); button.dispatch('click'); },
    conditions(types, amount = '50.10') { document.querySelectorAll('[data-ba-condition]').forEach(input => { input.checked = types.includes(input.getAttribute('data-ba-condition')); input.dispatch('change'); }); nodes.bargainInviteDeposit.value = amount; nodes.bargainInviteWager.value = amount; },
    countdown(enabled, days, hours) {
      if (days !== undefined) nodes.bargainRegistrationCountdownDays.value = String(days);
      if (hours !== undefined) nodes.bargainRegistrationCountdownHours.value = String(hours);
      nodes.bargainRegistrationCountdownEnabled.checked = enabled;
      nodes.bargainRegistrationCountdownEnabled.dispatch('change');
    },
    upload(kind, file = { type: 'image/png', size: 100 }) {
      const button = document.querySelector('[data-ba-upload="' + kind + '"]'); assert(button); click(button);
      const input = nodes['bargain' + kind + 'File']; assert(input.clicked);
      input.files = file ? [file] : []; input.dispatch('change'); return readers.at(-1);
    },
    readImage(reader, source) { reader.result = source; assert(reader.onload); reader.onload({ target: reader }); return images.at(-1); },
    removeImage(kind) { const button = document.querySelector('[data-ba-remove-image="' + kind + '"]'); assert(button); click(button); },
    paste(htmlValue, plainValue) {
      nodes.bargainDescription.dispatch('paste', nodes.bargainDescription, { clipboardData: { getData(type) { return type === 'text/html' ? htmlValue : type === 'text/plain' ? plainValue : ''; } } });
    }
  };
}

const test = harness();
const countdownOff = { enabled: false, days: 0, hours: 0 };
const countdownDraftValue = (days, hours) => ({ enabled: true, days: String(days), hours: String(hours) });
assert.deepEqual(test.state().registrationCountdown, countdownOff, 'default registration countdown is not configured');
assert(test.nodes.bargainRegistrationCountdownFields.hidden && test.nodes.bargainRegistrationCountdownDays.disabled && test.nodes.bargainRegistrationCountdownHours.disabled);
assert.equal(test.state().personalTasks.length, 5);
assert.equal(test.state().invitationTasks.length, 6);
const seeded = harness();
assert.equal(seeded.raw(), '[]', 'default invitation examples stay unsaved until save');
seeded.save();
const seededRecord = seeded.stored()[0];
assert.equal(seededRecord.invitationTasks.length, 6);
assert.deepEqual(harness('?bargainId=' + encodeURIComponent(seededRecord.id), [seededRecord]).state().invitationTasks, seededRecord.invitationTasks);
const emptyInvitationRecord = { ...seededRecord, invitationTasks: [] };
assert.equal(harness('?bargainId=' + encodeURIComponent(seededRecord.id), [emptyInvitationRecord]).state().invitationTasks.length, 0, 'saved empty invitation list stays empty');
const defaultInitialTasks = [
  { id: 'initial-official', type: 'officialCut', rewardCuts: 1 },
  { id: 'initial-premium', type: 'premiumGift', rewardCuts: 1 }
];
assert.deepEqual(test.state().initialTasks, defaultInitialTasks, 'default official and premium gifts are 1 + 1');
assert.equal(test.state().initialCuts, 2);
assert.equal(String(test.nodes.bargainTotalCuts.min), '3');
for (const [id, cuts] of [['initial-official', '3'], ['initial-premium', '2']]) {
  test.open('initial', id);
  assert(test.nodes.bargainTaskTypeField.hidden, 'fixed gift type cannot be changed');
  assert(test.nodes.bargainTaskThresholdField.hidden, 'initial gifts have no personal threshold');
  assert(!test.nodes.bargainGiftTaskField.hidden);
  assert.equal(test.nodes.bargainGiftTaskName.textContent, id === 'initial-official' ? '\u5b98\u65b9\u8d60\u9001' : '\u7cbe\u82f1\u73a9\u5bb6\u8d60\u9001', 'fixed gift uses agreed Chinese label');
  test.nodes.bargainTaskRewardCuts.value = cuts; test.submitTask(); assert(test.nodes.bargainTaskModal.hidden);
  test.remove('initial', id); assert.equal(test.state().initialTasks.length, 2, 'fixed initial gifts cannot be deleted');
}
assert.equal(test.state().initialCuts, 5);
assert(String(test.nodes.bargainInitialCuts.textContent).includes('5'), 'derived total renders five cuts');
assert.equal(String(test.nodes.bargainTotalCuts.min), '6', 'total cut minimum follows gift sum');
assert(test.nodes.bargainProgressHint.textContent.includes('15'), 'remaining cuts equals total twenty less initial five');
const initialDraft = test.state().initialTasks;
test.open('initial', 'initial-official'); test.nodes.bargainTaskRewardCuts.value = '99'; test.close();
assert.deepEqual(test.state().initialTasks, initialDraft); assert.equal(test.state().initialCuts, 5, 'cancel does not change initial sum');
for (const value of ['0', '-1', '1.5', '1e2', '', '9007199254740992']) {
  test.open('initial', 'initial-official'); test.nodes.bargainTaskRewardCuts.value = value; test.submitTask();
  assert(!test.nodes.bargainTaskModal.hidden, 'invalid initial gift reward: ' + value); assert(!test.nodes.bargainTaskError.hidden); test.close();
  assert.deepEqual(test.state().initialTasks, initialDraft);
}
for (const id of ['default-deposit', 'default-wager']) {
  test.open('personal', id); assert(test.nodes.bargainTaskType.disabled); assert(!test.nodes.bargainTaskThreshold.disabled);
  test.nodes.bargainTaskThreshold.value = '4'; test.nodes.bargainTaskRewardCuts.value = '2'; test.submitTask();
  assert(test.nodes.bargainTaskModal.hidden); assert.equal(test.state().personalTasks.find(task => task.id === id).threshold, '4');
  assert.equal(test.state().personalTasks.find(task => task.id === id).rewardCuts, 2);
  test.remove('personal', id); assert(test.state().personalTasks.some(task => task.id === id), 'default task cannot be deleted');
}
assert.equal(test.state().initialCuts, 5, 'personal task rewards do not contribute to initial cuts');
assert.equal(test.raw(), '[]', 'task edits remain drafts');
test.open('personal'); assert(test.nodes.base.inert); test.nodes.bargainTaskType.value = 'phone'; test.nodes.bargainTaskType.dispatch('change');
assert(test.nodes.bargainTaskThresholdField.hidden); test.close(); assert(!test.nodes.base.inert); assert.equal(test.state().personalTasks.length, 5);
test.open('personal'); test.nodes.bargainTaskType.value = 'phone'; test.nodes.bargainTaskType.dispatch('change'); test.submitTask();
let phone = test.state().personalTasks.find(task => task.type === 'phone'); assert(phone); assert.equal(phone.threshold, '1');
test.open('personal', phone.id); test.nodes.bargainTaskRewardCuts.value = '7'; test.close(); assert.equal(test.state().personalTasks.find(task => task.id === phone.id).rewardCuts, 1);
test.confirm(false); test.remove('personal', phone.id); assert(test.state().personalTasks.some(task => task.id === phone.id));
test.confirm(true); test.remove('personal', phone.id); assert(!test.state().personalTasks.some(task => task.id === phone.id));
test.open('personal'); test.nodes.bargainTaskModal.dispatch('keydown', test.nodes.bargainTaskModal, { key: 'Escape' }); assert(test.nodes.bargainTaskModal.hidden);
test.open('personal'); test.nodes.u3012_input.dispatch('change'); assert(test.nodes.bargainTaskModal.hidden); assert(!test.nodes.base.inert);

for (const task of test.state().invitationTasks) test.remove('invitation', task.id);
assert.equal(test.state().invitationTasks.length, 0, 'sample invitation tasks are editable and removable');
for (let mask = 1; mask < 16; mask++) {
  const types = inviteTypes.filter((_, index) => mask & (1 << index));
  test.open('invitation'); test.conditions(types); test.nodes.bargainTaskRewardCuts.value = String(mask); test.submitTask();
  assert(test.nodes.bargainTaskModal.hidden, 'accept combination ' + mask);
  const task = test.state().invitationTasks.at(-1);
  assert.deepEqual(task.conditions.map(condition => condition.type), types); assert.equal(task.rewardCuts, mask);
  for (const condition of task.conditions) if (condition.type.includes('Amount')) assert.equal(condition.threshold, '50.1');
}
assert.equal(test.state().invitationTasks.length, 15);
test.open('invitation'); test.conditions(inviteTypes, '50.100'); test.submitTask(); assert(!test.nodes.bargainTaskModal.hidden); assert(!test.nodes.bargainTaskError.hidden); test.close();
test.open('invitation'); test.conditions(inviteTypes, '050.10'); test.submitTask(); assert(!test.nodes.bargainTaskModal.hidden, 'equivalent amount and complete condition duplicate rejected'); test.close();
test.open('invitation'); test.conditions([]); test.submitTask(); assert(!test.nodes.bargainTaskModal.hidden); test.close();
for (const amount of ['', '0', '-1', '1.001', '1e2', 'Infinity']) {
  test.open('invitation'); test.conditions(['depositAmount'], amount); test.submitTask();
  assert(!test.nodes.bargainTaskModal.hidden, 'invalid invitation amount: ' + amount); assert(!test.nodes.bargainTaskError.hidden); test.close();
}
const allConditions = test.state().invitationTasks.find(task => task.conditions.length === 4);
test.open('invitation', allConditions.id); assert(inviteTypes.every(type => test.document.querySelector('[data-ba-condition="' + type + '"]').checked));
test.nodes.bargainTaskRewardCuts.value = '20'; test.submitTask();
assert.deepEqual(test.state().invitationTasks.find(task => task.id === allConditions.id).conditions, allConditions.conditions, 'editing reward preserves all AND conditions');
assert(test.nodes.bargainInvitationRows.innerHTML.includes(' + '), 'all conditions rendered together');
test.open('invitation', allConditions.id); test.conditions(['phone']); test.nodes.bargainTaskRewardCuts.value = '99'; test.close();
assert.deepEqual(test.state().invitationTasks.find(task => task.id === allConditions.id).conditions, allConditions.conditions, 'cancel discards invitation editor conditions');
assert.equal(test.state().invitationTasks.find(task => task.id === allConditions.id).rewardCuts, 20);
const phoneInvite = test.state().invitationTasks.find(task => task.conditions.length === 1 && task.conditions[0].type === 'phone');
test.confirm(false); test.remove('invitation', phoneInvite.id); assert.equal(test.state().invitationTasks.length, 15);
test.confirm(true); test.remove('invitation', phoneInvite.id); assert.equal(test.state().invitationTasks.length, 14);
test.open('invitation'); test.conditions(['phone']); test.submitTask(); assert.equal(test.state().invitationTasks.length, 15);
assert.equal(test.raw(), '[]', 'invitation additions and deletions remain unsaved drafts');
assert.equal(test.state().initialCuts, 5, 'invitation task rewards do not contribute to initial cuts');

const valid = test.state(); assert.equal(test.api.validateRecord(valid), '');
for (const [field, invalids] of Object.entries({ rewardAmount: ['', '0', '-1', '0.001', '1e2', 'Infinity', '9007199254740991'], initialPercent: ['', '-1', '100', '100.01', '99.999', '1e2'], totalCuts: ['', '0', '2', '3', '4', '5', '5.5', '1e2', '9007199254740992'], wagerMultiple: ['-1', '0.001'], sort: ['-1', '0.1'] })) {
  for (const value of invalids) assert(test.api.validateRecord({ ...valid, [field]: value }), field + ': ' + value);
}
for (const percent of ['0', '99.99']) assert.equal(test.api.validateRecord({ ...valid, initialPercent: percent }), '');
assert.equal(test.api.validateRecord({ ...valid, rewardAmount: '0.01', wagerMultiple: '0', totalCuts: '6' }), '');
assert(test.api.validateRecord({ ...valid, endTime: valid.startTime }));
assert(test.api.validateRecord({ ...valid, rewardTarget: 'invalid' }));
for (const name of ['name', 'title']) for (const value of [null, 42, {}, [], '']) assert(test.api.validateRecord({ ...valid, [name]: value }), 'reject invalid ' + name);
for (const name of ['enabled', 'longTerm']) for (const value of [undefined, null, 'true', 1]) assert(test.api.validateRecord({ ...valid, [name]: value }), 'reject non-boolean ' + name);
assert(test.api.validateRecord({ ...valid, personalTasks: valid.personalTasks.filter(task => task.id !== 'default-deposit') }));
assert(test.api.validateTask({ id: 'new', type: 'depositAmount', threshold: '050000.00', rewardCuts: 1 }, 'personal', valid.personalTasks));
for (const rewardCuts of ['0', '-1', '1.5', '1e2']) assert(test.api.validateTask({ id: 'new', type: 'email', threshold: '1', rewardCuts }, 'personal', []));
for (const type of ['constructor', 'toString', '__proto__', 'invalid']) assert(test.api.validateTask({ id: 'new', type, threshold: '1', rewardCuts: 1 }, 'personal', []));
assert(test.api.validateTask({ id: 'new', type: 'phone', threshold: '1', rewardCuts: 1, isDefault: true }, 'personal', []));

test.save(); assert.equal(test.window.location.href, listUrl + '?bargainSaved=1');
const saved = test.stored()[0]; assert.equal(saved.template, template); assert.equal(saved.rewardAmount, '100.1'); assert.equal(saved.totalCuts, 20); assert.equal(saved.initialCuts, 5);
assert.deepEqual(saved.initialTasks, initialDraft, 'persist both configured initial gifts');
assert.equal(saved.invitationTasks.length, 15); assert.deepEqual(saved.invitationTasks.find(task => task.id === allConditions.id).conditions, allConditions.conditions);
assert(saved.createdAt && saved.updatedAt);
const edit = harness('?bargainId=' + encodeURIComponent(saved.id), [saved]);
assert.deepEqual(edit.state().personalTasks, saved.personalTasks); assert.deepEqual(edit.state().invitationTasks, saved.invitationTasks);
assert.deepEqual(edit.state().initialTasks, saved.initialTasks); assert.equal(edit.state().initialCuts, 5); assert.equal(String(edit.nodes.bargainTotalCuts.min), '6');
edit.nodes.bargainName.value = 'edited'; edit.save(); assert.equal(edit.stored().length, 1); assert.equal(edit.stored()[0].id, saved.id); assert.equal(edit.stored()[0].createdAt, saved.createdAt); assert.equal(edit.stored()[0].name, 'edited');
const cancel = harness('?bargainId=' + encodeURIComponent(saved.id), [saved]); cancel.nodes.bargainName.value = 'draft'; cancel.nodes.u5.dispatch('click'); assert.equal(cancel.window.location.href, listUrl); assert.deepEqual(cancel.stored()[0], saved);
const back = harness('?bargainId=' + encodeURIComponent(saved.id), [saved]); back.nodes.u1.dispatch('click'); assert.equal(back.window.location.href, listUrl); assert.deepEqual(back.stored()[0], saved);
const inactive = harness(); inactive.active(false); inactive.save(); assert.equal(inactive.window.location.href, ''); assert.equal(inactive.raw(), '[]');
const invalidInput = harness(); invalidInput.nodes.bargainRewardAmount.value = '0'; invalidInput.save(); assert.equal(invalidInput.raw(), '[]'); assert(!invalidInput.nodes.bargainError.hidden);

for (const scenario of ['write', 'read', 'corrupt', 'duplicate-id', 'missing-edit']) {
  const failure = harness('?bargainId=' + encodeURIComponent(saved.id), [saved]); failure.nodes.bargainName.value = 'retained draft';
  failure.open('personal', 'default-deposit'); failure.nodes.bargainTaskThreshold.value = '9'; failure.submitTask();
  if (scenario === 'write') failure.failWrite();
  if (scenario === 'read') failure.failRead();
  if (scenario === 'corrupt') failure.setRaw('{}');
  if (scenario === 'duplicate-id') failure.setRaw(JSON.stringify([saved, saved]));
  if (scenario === 'missing-edit') failure.setRaw('[]');
  const before = failure.raw(); failure.save(); assert.equal(failure.window.location.href, ''); assert.equal(failure.raw(), before); assert.equal(failure.state().name, 'retained draft'); assert(!failure.nodes.bargainError.hidden);
  assert.equal(failure.state().personalTasks.find(task => task.id === 'default-deposit').threshold, '9', 'failed save retains task draft');
  failure.failRead(false); failure.failWrite(false); failure.setRaw(JSON.stringify([saved])); failure.save(); assert.equal(failure.stored()[0].name, 'retained draft', 'retry retained data');
  assert.equal(failure.stored()[0].personalTasks.find(task => task.id === 'default-deposit').threshold, '9');
}
for (const raw of ['{}', '[null]', '[{"id":""}]', '{']) {
  const failure = harness(); failure.setRaw(raw); failure.save(); assert.equal(failure.raw(), raw); assert.equal(failure.window.location.href, '');
}
const missing = harness('?bargainId=missing', [saved]); missing.save(); assert.equal(missing.window.location.href, ''); assert.deepEqual(missing.stored(), [saved]);
const legacyRecord = JSON.parse(JSON.stringify(saved)); delete legacyRecord.initialTasks;
const legacy = harness('?bargainId=' + encodeURIComponent(saved.id), [legacyRecord]);
assert.deepEqual(legacy.state().initialTasks, defaultInitialTasks); assert.equal(legacy.state().initialCuts, 2);
assert.equal(legacy.raw(), JSON.stringify([legacyRecord]), 'legacy normalization does not write storage');
legacy.nodes.u5.dispatch('click'); assert.deepEqual(legacy.stored()[0], legacyRecord, 'cancel legacy edit does not migrate stored record');
const legacySave = harness('?bargainId=' + encodeURIComponent(saved.id), [legacyRecord]); legacySave.save();
assert.deepEqual(legacySave.stored()[0].initialTasks, defaultInitialTasks); assert.equal(legacySave.stored()[0].initialCuts, 2);
const invalidInitials = [
  null, {}, [], [saved.initialTasks[0]], [saved.initialTasks[1]],
  [saved.initialTasks[0], saved.initialTasks[0]],
  [saved.initialTasks[0], { ...saved.initialTasks[1], type: 'officialCut' }],
  [{ ...saved.initialTasks[0], id: '' }, saved.initialTasks[1]],
  [saved.initialTasks[0], { ...saved.initialTasks[1], id: saved.initialTasks[0].id }],
  [{ ...saved.initialTasks[0], type: 'constructor' }, saved.initialTasks[1]],
  [{ ...saved.initialTasks[0], type: '' }, saved.initialTasks[1]],
  [saved.initialTasks[0], saved.initialTasks[1], { id: 'extra', type: 'phone', rewardCuts: 1 }]
];
for (const rewardCuts of [0, -1, 1.5, '1e2', '', '9007199254740992']) invalidInitials.push([{ ...saved.initialTasks[0], rewardCuts }, saved.initialTasks[1]]);
for (const initialTasks of invalidInitials) {
  const invalidRecord = { ...saved, initialTasks };
  assert(test.api.validateRecord(invalidRecord), 'reject invalid initial gift task collection: ' + JSON.stringify(initialTasks));
  const rejected = harness('?bargainId=' + encodeURIComponent(saved.id), [invalidRecord]);
  assert(!rejected.nodes.bargainError.hidden); const before = rejected.raw(); rejected.save();
  assert.equal(rejected.raw(), before, 'invalid gifts are never silently replaced or persisted'); assert.equal(rejected.window.location.href, '');
}
const customIdsRecord = { ...saved, initialTasks: saved.initialTasks.map((task, index) => ({ ...task, id: 'custom-gift-' + index })) };
assert.equal(test.api.validateRecord(customIdsRecord), '', 'initial gift identity follows type; unique custom IDs are valid');
const customIds = harness('?bargainId=' + encodeURIComponent(saved.id), [customIdsRecord]);
assert.deepEqual(customIds.state().initialTasks, customIdsRecord.initialTasks); customIds.save();
assert.deepEqual(customIds.stored()[0].initialTasks, customIdsRecord.initialTasks, 'custom gift IDs survive save/reload');

for (const [days, hours] of [[1, 0], [0, 1], [2, 6]]) {
  const countdown = harness(); countdown.countdown(true, days, hours);
  assert(!countdown.nodes.bargainRegistrationCountdownFields.hidden);
  assert(!countdown.nodes.bargainRegistrationCountdownDays.disabled && !countdown.nodes.bargainRegistrationCountdownHours.disabled);
  assert.deepEqual(countdown.state().registrationCountdown, countdownDraftValue(days, hours), 'enabled draft keeps raw input for validation');
  countdown.save(); assert.equal(countdown.window.location.href, listUrl + '?bargainSaved=1');
  const record = countdown.stored()[0]; assert.deepEqual(record.registrationCountdown, { enabled: true, days, hours });
  const reload = harness('?bargainId=' + encodeURIComponent(record.id), [record]);
  assert.deepEqual(reload.state().registrationCountdown, countdownDraftValue(days, hours));
  assert.equal(String(reload.nodes.bargainRegistrationCountdownDays.value), String(days));
  assert.equal(String(reload.nodes.bargainRegistrationCountdownHours.value), String(hours));
}
const countdownDraft = harness(); countdownDraft.countdown(true, 2, 6); countdownDraft.countdown(false);
assert(countdownDraft.nodes.bargainRegistrationCountdownFields.hidden);
assert(countdownDraft.nodes.bargainRegistrationCountdownDays.disabled && countdownDraft.nodes.bargainRegistrationCountdownHours.disabled);
assert.deepEqual(countdownDraft.state().registrationCountdown, countdownOff);
assert.equal(String(countdownDraft.nodes.bargainRegistrationCountdownDays.value), '2'); assert.equal(String(countdownDraft.nodes.bargainRegistrationCountdownHours.value), '6');
countdownDraft.countdown(true); assert.deepEqual(countdownDraft.state().registrationCountdown, countdownDraftValue(2, 6), 'reenabling restores current-page draft');
countdownDraft.countdown(false, '-1', 'invalid'); countdownDraft.save();
assert.deepEqual(countdownDraft.stored()[0].registrationCountdown, countdownOff, 'disabled invalid UI values never affect saved settings');
const disabledRecord = countdownDraft.stored()[0];
const disabledReload = harness('?bargainId=' + encodeURIComponent(disabledRecord.id), [disabledRecord]);
assert.equal(String(disabledReload.nodes.bargainRegistrationCountdownDays.value), '0'); assert.equal(String(disabledReload.nodes.bargainRegistrationCountdownHours.value), '0');
assert.deepEqual(disabledReload.state().registrationCountdown, countdownOff);

for (const [days, hours] of [[0, 0], [-1, 0], [1.5, 0], ['invalid', 0], ['', 0], [0, -1], [0, 1.5], [0, 'invalid'], [0, ''], [0, 24], [104249992, 0], [104249991, 23], ['9007199254740992', 1]]) {
  const invalid = harness(); invalid.countdown(true, days, hours); const before = invalid.raw(); invalid.save();
  assert.equal(invalid.window.location.href, '', 'invalid countdown cannot save: ' + JSON.stringify([days, hours]));
  assert.equal(invalid.raw(), before); assert(!invalid.nodes.bargainError.hidden);
  assert(invalid.nodes.bargainRegistrationCountdownEnabled.checked, 'invalid configuration remains editable');
}
const countdownCancel = harness('?bargainId=' + encodeURIComponent(saved.id), [saved]); countdownCancel.countdown(true, 2, 6); countdownCancel.nodes.u5.dispatch('click');
assert.equal(countdownCancel.window.location.href, listUrl); assert.deepEqual(countdownCancel.stored()[0], saved);
for (const scenario of ['read', 'write']) {
  const failure = harness('?bargainId=' + encodeURIComponent(saved.id), [saved]); failure.countdown(true, 2, 6);
  if (scenario === 'read') failure.failRead(); else failure.failWrite();
  const before = failure.raw(); failure.save(); assert.equal(failure.raw(), before); assert.equal(failure.window.location.href, '');
  assert.deepEqual(failure.state().registrationCountdown, countdownDraftValue(2, 6), 'storage failure preserves countdown draft');
  failure.failRead(false); failure.failWrite(false); failure.save(); assert.deepEqual(failure.stored()[0].registrationCountdown, { enabled: true, days: 2, hours: 6 });
}
const legacyCountdownRecord = JSON.parse(JSON.stringify(saved)); delete legacyCountdownRecord.registrationCountdown;
const legacyCountdown = harness('?bargainId=' + encodeURIComponent(saved.id), [legacyCountdownRecord]);
assert.deepEqual(legacyCountdown.state().registrationCountdown, countdownOff); assert.equal(legacyCountdown.raw(), JSON.stringify([legacyCountdownRecord]), 'legacy countdown normalization does not write');
legacyCountdown.nodes.u5.dispatch('click'); assert.deepEqual(legacyCountdown.stored()[0], legacyCountdownRecord, 'legacy countdown cancel does not migrate');
const legacyCountdownSave = harness('?bargainId=' + encodeURIComponent(saved.id), [legacyCountdownRecord]); legacyCountdownSave.save();
assert.deepEqual(legacyCountdownSave.stored()[0].registrationCountdown, countdownOff, 'explicit save adds missing legacy countdown');
for (const registrationCountdown of [null, [], {}, { enabled: 'false', days: 0, hours: 0 }, { enabled: 1, days: 1, hours: 0 }, { enabled: true, days: -1, hours: 0 }, { enabled: true, days: 0, hours: 24 }, { enabled: true, days: 0, hours: 0 }]) {
  const invalidRecord = { ...saved, registrationCountdown };
  assert(test.api.validateRecord(invalidRecord), 'reject malformed stored countdown: ' + JSON.stringify(registrationCountdown));
  const invalid = harness('?bargainId=' + encodeURIComponent(saved.id), [invalidRecord]); assert(!invalid.nodes.bargainError.hidden);
  const before = invalid.raw(); invalid.save(); assert.equal(invalid.raw(), before, 'present malformed countdown is never silently replaced'); assert.equal(invalid.window.location.href, '');
}
const longTerm = harness('?bargainId=' + encodeURIComponent(saved.id), [saved]); longTerm.nodes.bargainLongTerm.checked = true; longTerm.nodes.bargainLongTerm.dispatch('change'); assert(longTerm.nodes.bargainEndTime.disabled); longTerm.save(); assert.equal(longTerm.stored()[0].endTime, '');
const reloadLong = harness('?bargainId=' + encodeURIComponent(saved.id), longTerm.stored()); reloadLong.nodes.bargainLongTerm.checked = false; reloadLong.nodes.bargainLongTerm.dispatch('change'); assert.equal(reloadLong.nodes.bargainEndTime.value, saved.endTime);
const rich = harness();
for (const command of richCommands) {
  const button = rich.document.querySelector('[data-ba-command="' + command + '"]'); assert(button);
  let prevented = false; button.dispatch('mousedown', button, { preventDefault() { prevented = true; } }); assert(prevented, 'toolbar preserves editor selection on mousedown');
  button.dispatch('click');
  assert.equal(rich.commands.at(-1).command, command); assert.equal(rich.commands.at(-1).activeElement, rich.nodes.bargainDescription, 'toolbar command focuses rich text');
}
const dirtyHtml = '<p class="x" onclick="bad()">Rules <strong style="color:red">bold</strong><br>next</p><!--remove--><script>alert(1)</script><style>bad{}</style><img src="x" onerror="bad()"><svg><text>bad</text></svg><a href="javascript:bad()">safe text</a>';
const cleanHtml = rich.api.sanitizeDescription(dirtyHtml);
assert(cleanHtml.includes('<p>Rules <strong>bold</strong><br>next</p>'));
assert(cleanHtml.includes('safe text'));
assert(!/script|style|onclick|onerror|href|<img|<svg|<!--|alert\(1\)|bad\{\}/i.test(cleanHtml), 'sanitizer drops executable/embedded nodes, comments and all attributes');
const allowedHtml = '<div><h2>Title</h2><h3>Small</h3><blockquote><p><b>B</b><em>E</em><i>I</i><u>U</u></p></blockquote><ul><li>One</li></ul><ol><li>Two</li></ol></div>';
assert.equal(rich.api.sanitizeDescription(allowedHtml), allowedHtml, 'sanitizer preserves the agreed rich text whitelist');
rich.nodes.bargainDescription.innerHTML = dirtyHtml; rich.save();
assert.equal(rich.window.location.href, listUrl + '?bargainSaved=1');
const richRecord = rich.stored()[0]; assert.equal(richRecord.descriptionHtml, cleanHtml); assert(richRecord.description.includes('Rules') && richRecord.description.includes('safe text'));
assert(!richRecord.description.includes('<strong>') && !richRecord.description.includes('alert(1)'), 'legacy description remains sanitized plain text');
const richReload = harness('?bargainId=' + encodeURIComponent(richRecord.id), [richRecord]);
assert.equal(richReload.nodes.bargainDescription.innerHTML, cleanHtml);
richReload.nodes.bargainDescription.innerHTML = '<p>cancelled draft</p>'; richReload.nodes.u5.dispatch('click'); assert.deepEqual(richReload.stored()[0], richRecord);
const paste = harness(); paste.nodes.bargainDescription.innerHTML = '';
paste.paste(dirtyHtml, 'ignored plain fallback'); assert.equal(paste.commands.at(-1).command, 'insertHTML'); assert.equal(paste.commands.at(-1).value, cleanHtml);
paste.paste('', '<script>literal plain</script>'); assert.equal(paste.commands.at(-1).command, 'insertText'); assert.equal(paste.commands.at(-1).value, '<script>literal plain</script>');
assert(paste.nodes.bargainDescription.innerHTML.includes('&lt;script&gt;literal plain&lt;/script&gt;'));
const textLimit = harness(); textLimit.nodes.bargainDescription.innerHTML = '<p>' + 'x'.repeat(4001) + '</p>'; textLimit.save(); assert.equal(textLimit.raw(), '[]'); assert(!textLimit.nodes.bargainError.hidden);
textLimit.nodes.bargainDescription.innerHTML = '<p><strong>' + 'x'.repeat(4000) + '</strong></p>'; textLimit.save(); assert.equal(textLimit.stored()[0].description.length, 4000, 'formatting does not reduce the plain text limit');
const legacyMediaRecord = JSON.parse(JSON.stringify(saved)); delete legacyMediaRecord.bannerImage; delete legacyMediaRecord.detailImage; delete legacyMediaRecord.descriptionHtml;
legacyMediaRecord.description = '<script>literal</script> & old rules';
const legacyMedia = harness('?bargainId=' + encodeURIComponent(saved.id), [legacyMediaRecord]);
assert.equal(legacyMedia.raw(), JSON.stringify([legacyMediaRecord]), 'legacy image/text normalization does not write storage');
assert(legacyMedia.nodes.bargainDescription.innerHTML.includes('&lt;script&gt;literal&lt;/script&gt;'));
assert.equal(legacyMedia.state().bannerImage, ''); assert.equal(legacyMedia.state().detailImage, '');
legacyMedia.nodes.u5.dispatch('click'); assert.deepEqual(legacyMedia.stored()[0], legacyMediaRecord);
const legacyMediaSave = harness('?bargainId=' + encodeURIComponent(saved.id), [legacyMediaRecord]); legacyMediaSave.save();
assert.equal(legacyMediaSave.stored()[0].bannerImage, ''); assert.equal(legacyMediaSave.stored()[0].detailImage, '');
assert(legacyMediaSave.stored()[0].descriptionHtml.includes('&lt;script&gt;literal&lt;/script&gt;'));
for (const field of ['descriptionHtml', 'bannerImage', 'detailImage']) {
  const values = field === 'descriptionHtml' ? [null, {}, 7] : [null, {}, 7, 'https://example.com/image.png', 'data:image/svg+xml;base64,AAAA', 'data:text/html;base64,AAAA'];
  for (const value of values) {
    const invalidRecord = { ...saved, [field]: value }; assert(rich.api.validateRecord(invalidRecord), 'reject malformed ' + field);
    const invalid = harness('?bargainId=' + encodeURIComponent(saved.id), [invalidRecord]); const before = invalid.raw();
    assert(!invalid.nodes.bargainError.hidden); invalid.save(); assert.equal(invalid.raw(), before); assert.equal(invalid.window.location.href, '');
  }
}

const imageA = 'data:image/png;base64,QUFBQQ==';
const imageB = 'data:image/webp;base64,QkJCQg==';
for (const kind of ['Banner', 'Detail']) {
  const imageTest = harness(), field = kind === 'Banner' ? 'bannerImage' : 'detailImage';
  assert.equal(imageTest.state()[field], ''); assert(imageTest.nodes['bargain' + kind + 'Preview'].hidden);
  let reader = imageTest.upload(kind); const pendingBefore = imageTest.raw(); imageTest.save();
  assert.equal(imageTest.raw(), pendingBefore); assert.equal(imageTest.window.location.href, ''); assert(!imageTest.nodes.bargainError.hidden, 'pending image blocks saving');
  let decoded = imageTest.readImage(reader, imageA); imageTest.save(); assert.equal(imageTest.window.location.href, '', 'image decode also blocks saving');
  decoded.onload(); assert.equal(imageTest.state()[field], imageA); assert(!imageTest.nodes['bargain' + kind + 'Preview'].hidden); assert.equal(imageTest.nodes['bargain' + kind + 'Preview'].src, imageA); assert(imageTest.nodes.bargainError.hidden, 'successful image selection clears old error');
  reader = imageTest.upload(kind); reader.onerror(); assert.equal(imageTest.state()[field], imageA, 'read failure keeps existing image');
  reader = imageTest.upload(kind); const imageCount = imageTest.images.length; imageTest.readImage(reader, 'data:image/png;base64,!');
  assert.equal(imageTest.images.length, imageCount, 'malformed data URL is rejected before decoding'); assert.equal(imageTest.state()[field], imageA);
  reader = imageTest.upload(kind); decoded = imageTest.readImage(reader, imageB); decoded.onerror(); assert.equal(imageTest.state()[field], imageA, 'decode failure keeps existing image');
  const readerCount = imageTest.readers.length;
  imageTest.upload(kind, { type: 'image/gif', size: 1 }); assert.equal(imageTest.readers.length, readerCount); assert.equal(imageTest.state()[field], imageA);
  const max = kind === 'Banner' ? 500 * 1024 : 1024 * 1024;
  imageTest.upload(kind, { type: 'image/png', size: max + 1 }); assert.equal(imageTest.readers.length, readerCount); assert.equal(imageTest.state()[field], imageA);
  reader = imageTest.upload(kind, { type: 'image/webp', size: max }); decoded = imageTest.readImage(reader, imageB); decoded.onload(); assert.equal(imageTest.state()[field], imageB, 'valid replacement at file size limit');
  imageTest.save(); const imageRecord = imageTest.stored()[0]; assert.equal(imageRecord[field], imageB);
  const imageReload = harness('?bargainId=' + encodeURIComponent(imageRecord.id), [imageRecord]); assert.equal(imageReload.state()[field], imageB); assert.equal(imageReload.nodes['bargain' + kind + 'Preview'].src, imageB);
  imageReload.removeImage(kind); assert.equal(imageReload.state()[field], ''); assert(imageReload.nodes['bargain' + kind + 'Preview'].hidden); assert(!imageReload.nodes['bargain' + kind + 'Preview'].src);
  imageReload.nodes.u5.dispatch('click'); assert.equal(imageReload.stored()[0][field], imageB, 'image removal remains draft until saved');
  const stale = harness(); const first = stale.upload(kind); const next = stale.upload(kind); const currentImage = stale.readImage(next, imageB); currentImage.onload();
  stale.readImage(first, imageA); assert.equal(stale.state()[field], imageB, 'outdated FileReader callback cannot overwrite replacement');
  first.onerror(); assert(stale.nodes.bargainError.hidden, 'outdated read failure cannot replace current UI error state');
  const lateReader = stale.upload(kind); const lateImage = stale.readImage(lateReader, imageA); stale.removeImage(kind); lateImage.onload(); assert.equal(stale.state()[field], '', 'outdated decode callback cannot resurrect removed image');
  lateImage.onerror(); assert(stale.nodes.bargainError.hidden, 'outdated decode failure does not show an error after removal');
  stale.save(); assert.equal(stale.stored()[0][field], '', 'removal releases pending image state');
}
const tooLargeBanner = 'data:image/png;base64,' + Buffer.alloc(500 * 1024 + 1).toString('base64');
const tooLargeDetail = 'data:image/png;base64,' + Buffer.alloc(1024 * 1024 + 1).toString('base64');
assert(rich.api.validateRecord({ ...saved, bannerImage: tooLargeBanner }));
assert(rich.api.validateRecord({ ...saved, detailImage: tooLargeDetail }));
for (const invalidImage of ['data:image/png;base64,A', 'data:image/jpeg;base64,@@==', 'data:image/webp;base64,']) assert(rich.api.validateRecord({ ...saved, bannerImage: invalidImage }));
const parallelImages = harness(); const bannerRead = parallelImages.upload('Banner'); const detailRead = parallelImages.upload('Detail', { type: 'image/jpeg', size: 100 });
parallelImages.readImage(bannerRead, imageA).onload(); parallelImages.save(); assert.equal(parallelImages.window.location.href, '', 'one finished image does not release the other pending image');
parallelImages.readImage(detailRead, 'data:image/jpeg;base64,Q0NDQw==').onload(); parallelImages.save(); assert(parallelImages.window.location.href); assert.equal(parallelImages.stored()[0].bannerImage, imageA);
const imageWriteFailure = harness('?bargainId=' + encodeURIComponent(saved.id), [saved]);
const uploadReader = imageWriteFailure.upload('Banner'); imageWriteFailure.readImage(uploadReader, imageA).onload();
imageWriteFailure.nodes.bargainDescription.innerHTML = '<p><strong>Retained rich draft</strong></p>'; imageWriteFailure.failWrite();
const mediaBefore = imageWriteFailure.raw(); imageWriteFailure.save(); assert.equal(imageWriteFailure.raw(), mediaBefore); assert.equal(imageWriteFailure.window.location.href, '');
assert.equal(imageWriteFailure.state().bannerImage, imageA); assert(imageWriteFailure.state().descriptionHtml.includes('<strong>Retained rich draft</strong>'));
imageWriteFailure.failWrite(false); imageWriteFailure.save(); assert.equal(imageWriteFailure.stored()[0].bannerImage, imageA); assert(imageWriteFailure.stored()[0].descriptionHtml.includes('<strong>Retained rich draft</strong>'));
console.log('PASS: bargain state switching, initial gifts, personal/invitation tasks, registration countdown, rich text sanitization/commands/paste, asynchronous image validation/replacement/stale callback protection, legacy migration, save/reload/cancel, and storage failure/retry protection.');
