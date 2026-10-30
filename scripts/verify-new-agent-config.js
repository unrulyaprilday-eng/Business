const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');
const assert = require('assert/strict');
const name = String.fromCodePoint(0x65b0, 0x4ee3, 0x7406, 0x914d, 0x7f6e);
const html = fs.readFileSync(name + '.html', 'utf8');
const css = fs.readFileSync('custom/css/' + name + '.css', 'utf8');
const source = fs.readFileSync('custom/js/' + name + '.js', 'utf8');
for (const content of [html, css, source]) assert(!content.includes('\ufffd') && !/\?{3,}/.test(content), 'encoding corruption');
for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) assert(fs.existsSync(match[1]), 'missing asset ' + match[1]);
assert(/\[hidden\]\s*\{\s*display:\s*none\s*!important/.test(css));
assert.equal((html.match(/id="commonTime"/g) || []).length, 1, 'one shared settlement time');
const scriptTags = Array.from(html.matchAll(/<script\b([^>]*\bsrc="([^"]+)"[^>]*)>/g));
assert(scriptTags.every((match) => /\bdefer\b/.test(match[1])), 'external scripts must not block HTML parsing');
assert.equal(scriptTags[0][2], 'custom/js/' + name + '.js', 'independent business UI initializes first');
assert.deepEqual(scriptTags.slice(1).map((match) => match[2]), ["resources/scripts/jquery-3.7.1.min.js","resources/scripts/axure/axQuery.js","resources/scripts/axure/globals.js","resources/scripts/axutils.js","resources/scripts/axure/annotation.js","resources/scripts/axure/axQuery.std.js","resources/scripts/axure/doc.js","resources/scripts/messagecenter.js","resources/scripts/axure/events.js","resources/scripts/axure/recording.js","resources/scripts/axure/action.js","resources/scripts/axure/expr.js","resources/scripts/axure/geometry.js","resources/scripts/axure/flyout.js","resources/scripts/axure/model.js","resources/scripts/axure/repeater.js","resources/scripts/axure/sto.js","resources/scripts/axure/utils.temp.js","resources/scripts/axure/variables.js","resources/scripts/axure/drag.js","resources/scripts/axure/move.js","resources/scripts/axure/visibility.js","resources/scripts/axure/style.js","resources/scripts/axure/adaptive.js","resources/scripts/axure/tree.js","resources/scripts/axure/init.temp.js","resources/scripts/axure/legacy.js","resources/scripts/axure/viewer.js","resources/scripts/axure/math.js","resources/scripts/axure/jquery.nicescroll.min.js","data/document.js","files/新代理配置/data.js","custom/js/axure-custom-page-ready.js","resources/scripts/axure/ios.js"], 'Axure dependency order is preserved');
assert(!/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?\$axure/.test(html), 'no early inline dependency on deferred Axure');
assert(html.indexOf('id="milestoneAddRow"') > html.indexOf('id="milestoneTable"'), 'add row belongs below table');
const oldFiles = {
  '代理中心_代理配置.html': '220c7fcfb1316775009c392bbf638d3908b0385c41ca7ffa7d1c0d33ce6ba1a9',
  'custom/js/agent-config.js': 'fe9e7e2bd9892030ba9afd9b3c00e08a05e4038f533c1e224249e432e21bed01',
  'custom/css/agent-config.css': '8e50c4b3ecca54bda812ff29a11f9f6c1fbd701926c0ea999524aa15f0cf4815',
  'files/代理中心_代理配置/data.js': '3b58442a43e4394d5426da38cd0ba465c68a7fe0135a6f05ff0843d8e6a85032',
  'files/代理中心_代理配置/styles.css': '9a6fea7cf564e6a95bf79907b393c71e16369e996e41443d5025326410897986'
};
for (const [file, hash] of Object.entries(oldFiles)) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), hash, 'old config changed: ' + file);
let doc, pageData;
vm.runInNewContext(fs.readFileSync('data/document.js', 'utf8'), { $axure: { loadDocument(value) { doc = value; } } });
vm.runInNewContext(fs.readFileSync('files/' + name + '/data.js', 'utf8'), { $axure: { loadCurrentPage(value) { pageData = value; } } });
const parent = doc.sitemap.rootNodes.find((node) => node.id === 'agent_center');
const matches = parent.children.filter((node) => node.id === 'agent_center_new_config');
assert.equal(matches.length, 1);
assert.equal(matches[0].pageName, name); assert.equal(matches[0].url, name + '.html');
assert.equal(pageData.page.name, name); assert.equal(pageData.page.packageId, matches[0].id);
assert.equal(parent.children.find((node) => node.id === 'agent_center_config').url, '代理中心_代理配置.html');

const storageKey = 'business.new-agent-config.v1';
// Browserless event/state checks; no service, screenshots, or browser execution.
function boot(storage, readyState = 'loading') {
  const nodes = {}, tabs = [], listeners = {}, editHeaders = [];
  const flags = { failSave: false };
  let document;
  function node(id) {
    const item = {
      id, dataset: {}, value: '', textContent: '', hidden: false, disabled: false, checked: true,
      style: {}, events: {}, _html: '', _inputs: [], attributes: {}, classList: { toggle() {} },
      addEventListener(event, callback) { this.events[event] = callback; },
      fire(event, props = {}) { if (this.events[event]) this.events[event]({ preventDefault() {}, ...props }); },
      setAttribute(key, value) { this.attributes[key] = value; },
      focus() { document.activeElement = this; },
      querySelector(selector) {
        if (selector.startsWith('input')) {
          const attrs = Array.from(selector.matchAll(/\[data-([\w-]+)='([^']*)'\]/g));
          return this._inputs.find((input) => attrs.every((attr) => input.dataset[attr[1]] === attr[2])) || null;
        }
        return nodes[selector];
      },
      querySelectorAll(selector) {
        if (selector === '.settings-tab') return tabs;
        if (selector === '[data-edit-only]') return editHeaders;
        if (selector === 'input') return this._inputs;
        return [];
      }
    };
    Object.defineProperty(item, 'innerHTML', {
      get() { return this._html; },
      set(value) {
        this._html = value;
        this._inputs = Array.from(value.matchAll(/<input\b([^>]+)>/g), (match) => {
          const field = node('input');
          for (const attr of match[1].matchAll(/([\w-]+)='([^']*)'/g)) {
            if (attr[1].startsWith('data-')) field.dataset[attr[1].slice(5)] = attr[2];
            else field[attr[1]] = attr[2];
          }
          return field;
        });
      }
    });
    return item;
  }
  for (const match of html.matchAll(/\bid="([^"]+)"/g)) nodes['#' + match[1]] = node(match[1]);
  nodes['#confirmDialog'].hidden = true;
  nodes['.settings-main'] = node('main');
  editHeaders.push(node('editHeader'));
  const page = node('page');
  document = {
    readyState, activeElement: null, body: { style: {} }, contains: () => true,
    querySelector: (selector) => selector === '.agent-settings' ? page : null,
    addEventListener: (event, callback) => { listeners[event] = callback; }
  };
  for (const key of ['invite', 'bet', 'deposit', 'milestone']) { const tab = node(key + 'Tab'); tab.dataset.tab = key; tabs.push(tab); }
  const window = {
    localStorage: {
      getItem: (key) => storage[key] || null,
      setItem: (key, value) => { if (flags.failSave) throw Error('blocked storage'); storage[key] = value; }
    }, setTimeout: () => 1, clearTimeout() {}
  };
  vm.runInNewContext(source, { document, window, Number, Array, String }, { filename: name + '.js' });
  if (readyState === 'loading') { assert(listeners.DOMContentLoaded); listeners.DOMContentLoaded(); }
  else assert.equal(listeners.DOMContentLoaded, undefined, 'deferred UI must initialize immediately after parsing');
  const click = (id) => nodes['#' + id].fire('click');
  const tab = (key) => tabs.find((item) => item.dataset.tab === key).fire('click');
  const commonInput = (id, value) => { nodes['#' + id].value = value; nodes['#commonForm'].fire('input', { target: nodes['#' + id] }); };
  const selectLayers = (value) => { nodes['#commonTierCount'].value = String(value); nodes['#commonTierCount'].fire('change'); };
  function input(container, predicate, value) {
    const field = nodes['#' + container]._inputs.find(predicate); assert(field, 'input missing in ' + container);
    field.value = value;
    nodes[container === 'commonBases' ? '#commonForm' : '#ruleForm'].fire('input', { target: field });
  }
  const action = (dataset) => nodes['#ruleForm'].fire('click', { target: { closest: () => ({ dataset }) } });
  const commonSubmit = () => nodes['#commonForm'].fire('submit');
  const ruleSubmit = () => nodes['#ruleForm'].fire('submit');
  const cancelConfirm = () => nodes['#confirmDialog'].fire('click', { target: { closest: () => ({}) } });
  const saved = () => JSON.parse(storage[storageKey]);
  function fillBases(key) {
    for (const field of nodes['#commonBases']._inputs.filter((input) => !key || input.dataset.key === key)) {
      field.value = field.dataset.column === '0' ? '100000' : field.dataset.column === '2' ? (field.dataset.key === 'bet' ? '0.02' : '0.1') : '0';
      nodes['#commonForm'].fire('input', { target: field });
    }
  }
  return { nodes, flags, click, tab, commonInput, selectLayers, input, action, commonSubmit, ruleSubmit, cancelConfirm, saved, fillBases };
}
const storage = { 'business.agent.reward-settings.v1': 'untouched legacy setting' };
const ui = boot(storage);
assert.equal(ui.nodes['#commonDeposit'].value, '300000');
assert.equal(ui.nodes['#commonBet'].value, '5000');
assert.equal(ui.nodes['#commonTierCount'].value, '4');
assert.equal(ui.nodes['#inviteReward'].value, '60');
assert(!html.includes('连续层级') && !source.includes('统一'));
assert(html.includes('返利层级') && html.includes('有效打码'));
assert.equal(ui.nodes['#commonFields'].disabled, true);
assert.equal(ui.nodes['#editRule'].disabled, false);
ui.click('editCommon'); ui.commonInput('commonDeposit', ''); ui.commonSubmit();
assert.equal(ui.nodes['#commonError'].hidden, false);
assert.equal(storage[storageKey], undefined);
ui.commonInput('commonDeposit', '300000'); ui.commonSubmit();
assert.equal(ui.saved().common.deposit, '300000');
assert.equal(ui.saved().common.time, '06:00');
assert.deepEqual(ui.saved().rules.milestone.rows, [['5', '0', 'Rp'], ['10', '0', 'Rp']]);
assert.deepEqual(ui.saved().rules.bet.tiers[3], [['0', '0', '0']]);
assert.deepEqual(ui.saved().rules.deposit.tiers[3], [['0', '0', '0']]);
assert.equal(ui.nodes['#commonDepositHelp'].hidden, true);
assert.equal(ui.nodes['#editRule'].disabled, false);
assert.equal(storage['business.agent.reward-settings.v1'], 'untouched legacy setting');

ui.click('editCommon'); ui.commonInput('commonTime', '18:00'); ui.commonSubmit();
for (const key of ['invite', 'bet', 'deposit', 'milestone']) {
  ui.tab(key); assert(ui.nodes['#publicRuleSummary'].textContent.includes('18:00'), 'shared settlement time must update every tab');
  assert.equal(ui.nodes['#rulePanel'].attributes['aria-labelledby'], key + 'Tab');
}
ui.click('editRule');
assert.equal(ui.nodes['#milestoneRows']._inputs.length, 4);
ui.input('milestoneRows', (input) => input.dataset.row === '0' && input.dataset.column === '0', '5.5');
ui.input('milestoneRows', (input) => input.dataset.row === '0' && input.dataset.column === '1', '10');
ui.input('milestoneRows', (input) => input.dataset.row === '1' && input.dataset.column === '1', '20');
ui.ruleSubmit(); assert.equal(ui.nodes['#ruleError'].hidden, false);
ui.input('milestoneRows', (input) => input.dataset.row === '0' && input.dataset.column === '0', '5');
ui.click('addMilestone');
assert.equal(ui.nodes['#milestoneRows']._inputs.find((input) => input.dataset.row === '2' && input.dataset.column === '0').value, '11');
assert.equal(ui.nodes['#milestoneRows']._inputs.find((input) => input.dataset.row === '2' && input.dataset.column === '1').value, '0');
ui.input('milestoneRows', (input) => input.dataset.row === '2' && input.dataset.column === '1', '');
ui.ruleSubmit();
assert.equal(ui.saved().rules.milestone.rows.length, 2, 'cleared required value blocks saving');
ui.input('milestoneRows', (input) => input.dataset.row === '2' && input.dataset.column === '0', '15');
ui.input('milestoneRows', (input) => input.dataset.row === '2' && input.dataset.column === '1', '30');
ui.ruleSubmit(); assert.equal(ui.saved().rules.milestone.rows.length, 3);
ui.click('editRule'); ui.action({ delete: '2' }); ui.action({ delete: '1' }); ui.action({ delete: '0' });
assert.equal(ui.nodes['#milestoneRows']._inputs.length, 2, 'last milestone row cannot be removed');
ui.click('cancelRule'); assert.equal(ui.saved().rules.milestone.rows.length, 3);

ui.tab('bet'); ui.click('editRule');
ui.input('tierBlocks', (input) => input.dataset.level === '0' && input.dataset.row === '0' && input.dataset.column === '2', '0.15');
ui.tab('deposit'); assert.equal(ui.nodes['#confirmDialog'].hidden, false);
ui.cancelConfirm(); assert(ui.nodes['#tierBlocks']._inputs.some((input) => input.value === '0.15'));
ui.tab('deposit'); ui.click('confirmAction');
assert.equal(ui.saved().rules.bet.tiers[0][0][2], '0.1', 'discard preserves previous data');
ui.tab('bet'); ui.click('editRule');
ui.action({ level: '3', delete: '0' });
assert.equal(ui.nodes['#tierBlocks']._inputs.filter((input) => input.dataset.level === '3').length, 3, 'last tier row is protected');
ui.action({ addRange: '3' });
assert.equal(ui.nodes['#ruleError'].hidden, false);
assert.equal(ui.nodes['#tierBlocks']._inputs.filter((input) => input.dataset.level === '3').length, 3, 'cannot append after an unbounded range');
ui.input('tierBlocks', (input) => input.dataset.level === '3' && input.dataset.row === '0' && input.dataset.column === '1', '100000');
ui.action({ addRange: '3' });
assert.deepEqual(ui.nodes['#tierBlocks']._inputs.filter((input) => input.dataset.level === '3' && input.dataset.row === '1').map((input) => input.value), ['100000', '0', '0']);
ui.input('tierBlocks', (input) => input.dataset.level === '3' && input.dataset.row === '1' && input.dataset.column === '2', '');
ui.ruleSubmit(); assert.equal(ui.nodes['#ruleError'].hidden, false);
ui.action({ level: '3', delete: '1' });
ui.input('tierBlocks', (input) => input.dataset.level === '3' && input.dataset.column === '2', '0.05');
const depositBefore = ui.saved().rules.deposit;
ui.ruleSubmit();
assert.deepEqual(ui.saved().rules.deposit, depositBefore, 'bet and deposit rates remain independent');

ui.click('editCommon'); ui.selectLayers(2); ui.commonSubmit();
assert.equal(ui.nodes['#confirmDialog'].hidden, false);
ui.cancelConfirm(); assert.equal(ui.saved().common.layers, 4);
ui.commonSubmit(); ui.click('confirmAction');
assert.equal(ui.saved().common.layers, 2);
assert.equal(ui.saved().rules.bet.tiers.length, 2); assert.equal(ui.saved().rules.deposit.tiers.length, 2);
ui.click('editCommon'); ui.selectLayers(4);
ui.input('commonBases', (input) => input.dataset.key === 'bet' && input.dataset.level === '3' && input.dataset.column === '2', '');
ui.commonSubmit(); assert.equal(ui.saved().common.layers, 2, 'cleared new tier base blocks saving');
ui.input('commonBases', (input) => input.dataset.key === 'bet' && input.dataset.level === '3' && input.dataset.column === '2', '0');
ui.commonSubmit();
assert.equal(ui.saved().common.layers, 4);
assert(ui.saved().rules.bet.tiers.every((rows) => rows.length >= 1));
assert(ui.saved().rules.deposit.tiers.every((rows) => rows.length >= 1));
assert.deepEqual(ui.saved().rules.bet.tiers[3], [['0', '0', '0']]);
assert.deepEqual(ui.saved().rules.deposit.tiers[3], [['0', '0', '0']]);
ui.tab('invite'); ui.click('editRule');
ui.nodes['#inviteReward'].value = '75';
ui.nodes['#ruleForm'].fire('input', { target: ui.nodes['#inviteReward'] });
const beforeFailure = storage[storageKey];
ui.flags.failSave = true; ui.ruleSubmit();
assert.equal(storage[storageKey], beforeFailure); assert.equal(ui.nodes['#ruleActions'].hidden, false);
ui.flags.failSave = false; ui.ruleSubmit(); assert.equal(ui.saved().rules.invite.reward, '75');
const restored = boot(storage);
assert.equal(restored.nodes['#commonTime'].value, '18:00');
assert.equal(restored.nodes['#inviteReward'].value, '75');
assert.equal(restored.nodes['#ruleFields'].disabled, true);
restored.tab('milestone'); assert(restored.nodes['#milestoneRows'].innerHTML.includes('<td>15</td>'));
const early = boot(storage, 'interactive');
assert.equal(early.nodes['#commonTime'].value, '18:00', 'UI initializes before deferred Axure dependencies');
early.tab('bet'); assert(early.nodes['#tierBlocks'].innerHTML.includes('Tier 4'));
// Zero is an unlimited upper bound in both reward types; blanks cannot be saved.
for (const key of ['bet', 'deposit']) {
  const checkStorage = { ...storage }, check = boot(checkStorage);
  check.tab(key);
  assert(check.nodes['#tierBlocks'].innerHTML.includes('0 ～ 无上限'));
  check.click('editRule');
  const upper = (input) => input.dataset.level === '3' && input.dataset.row === '0' && input.dataset.column === '1';
  assert.equal(check.nodes['#tierBlocks']._inputs.find(upper).value, '0');
  for (const invalid of ['', '-1']) {
    check.input('tierBlocks', upper, invalid); check.ruleSubmit();
    assert.equal(checkStorage[storageKey], storage[storageKey]);
    assert.equal(check.nodes['#ruleError'].hidden, false);
  }
  check.input('tierBlocks', (input) => input.dataset.level === '3' && input.dataset.row === '0' && input.dataset.column === '0', '100');
  check.input('tierBlocks', upper, '100'); check.ruleSubmit();
  assert.equal(check.nodes['#ruleError'].hidden, false, 'finite upper must exceed lower');
  check.input('tierBlocks', upper, '0'); check.ruleSubmit();
  assert.deepEqual(check.saved().rules[key].tiers[3], [['100', '0', '0']]);
  check.click('editRule');
  check.input('tierBlocks', (input) => input.dataset.level === '0' && input.dataset.row === '0' && input.dataset.column === '1', '0');
  check.ruleSubmit(); assert.equal(check.nodes['#ruleError'].hidden, false, 'unlimited range must be last');
}
const legacyRecord = JSON.parse(storage[storageKey]);
for (const key of ['bet', 'deposit']) {
  for (const rows of legacyRecord.rules[key].tiers) {
    for (const row of rows) if (row[1] === '0') row[1] = '';
  }
}
const legacyStorage = { [storageKey]: JSON.stringify(legacyRecord) }, migrated = boot(legacyStorage);
assert.equal(migrated.nodes['#inviteReward'].value, '75', 'migration preserves saved custom values');
migrated.click('editCommon'); migrated.commonSubmit();
assert.deepEqual(migrated.saved(), JSON.parse(storage[storageKey]), 'legacy blank bounds become zero without changing other settings');
const axurePaths = { utils: {}, loadCurrentPage() {} };
vm.runInNewContext(fs.readFileSync('files/' + name + '/data.js', 'utf8'), { $axure: axurePaths });
assert.equal(axurePaths.utils.getTransparentGifPath(), 'resources/images/transparent.gif');
assert.equal(axurePaths.utils.getOtherPath(), 'resources/Other.html');
assert.equal(axurePaths.utils.getReloadPath(), 'resources/reload.html');
console.log('OK: independent new page/menu, old-page hashes, shared eligibility/time/layers, no empty saves, protected base rows, inline edit/cancel, synchronized tiers, separate rates and atomic local storage');
