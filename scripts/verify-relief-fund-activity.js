'use strict';

// Static and isolated logic checks; no browser, server, or external dependencies.
const assert = require('assert/strict');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, '救济金.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'custom/js/relief-fund-activity.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'custom/css/relief-fund-activity.css'), 'utf8');
new vm.Script(script);
for (const text of [html, script, css]) { assert(!/\?{3,}|\uFFFD/.test(text), 'Invalid text encoding'); }

const editor = html.match(/<div id="rfDescription"[^>]*>([\s\S]*?)\n\s*<\/div>/)[1];
const referenceTable = editor.match(/<table>[\s\S]*?<\/table>/)[0];
assert(html.includes('id="rfDescription" class="rf-rule-editor" contenteditable="true"'));
for (const text of ['Rules', 'Players with higher deposits and losses', 'all other applications require manual review.', 'Losses refer to your daily:', 'Losses = Game Bets - System Rewards - Game Winnings', 'Below are the participation requirements and rebate values for the rescue funds activity:', 'VIP Level', 'Rescue Fund', 'Percentage', 'Deposit', 'requirements', 'Loss Conditions', 'Maximum', 'Amount']) {
  assert(editor.includes(text), 'Missing reference copy: ' + text);
}
const referenceRows = Array.from(referenceTable.matchAll(/<tr><td>(\d+)<\/td><td>(\d+)%<\/td><td>([^<]+)<\/td><td>([^<]+)<\/td><td>([^<]+)<\/td><\/tr>/g), match => match.slice(1));
assert.deepEqual(referenceRows, [0, 1, 2, 3, 4, 5, 6].map(vip => [String(vip), vip < 3 ? '2' : vip < 5 ? '3' : '4', vip ? '50K' : '20K', vip ? '50K' : '20K', '88.99M']));

assert(!html.includes('id="rfTierModal"'), 'Tier editing must not open a modal');
assert(!script.includes('openTier('));
assert(!/id="rf(?:Name|Title|Sort)"/.test(html), 'Removed activity identity and sort fields');
assert(html.indexOf('id="rfDescription"') > html.indexOf('id="rfPreviewModal"'), 'Rule editor lives only inside modal');
assert(html.indexOf('id="rfAddTier"') > html.indexOf('id="rfTierRows"'), 'Add button belongs below the rows');

const nodes = new Map();
const keys = ['vip', 'deposit', 'loss', 'rate', 'cap'];
let rows = [];
let focused = null;
function makeNode(attrs = {}) {
  const classes = new Set();
  return {
    attrs, value: attrs.value || '', innerHTML: '', textContent: '', hidden: true, disabled: false,
    classList: { toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); }, contains(name) { return classes.has(name); } },
    focus() { focused = this; }, removeAttribute(key) { delete this.attrs[key]; },
    setAttribute(key, value) { this.attrs[key] = String(value); }, getAttribute(key) { return this.attrs[key]; },
    setCustomValidity(message) { this.error = message; }, reportValidity() { return !this.error; },
    querySelector() { return null; }, querySelectorAll() { return []; }
  };
}
function node(id) {
  if (!nodes.has(id)) nodes.set(id, makeNode());
  return nodes.get(id);
}
const attributes = text => Object.fromEntries(Array.from(text.matchAll(/([\w-]+)="([^"]*)"/g), match => [match[1], match[2]]));
Object.defineProperty(node('rfTierRows'), 'innerHTML', {
  get() { return this.markup || ''; },
  set(markup) {
    this.markup = markup;
    rows = Array.from(markup.matchAll(/<tr([^>]*)>([\s\S]*?)<\/tr>/g), match => {
      const row = makeNode(attributes(match[1]));
      row.range = makeNode(); row.inputs = {}; row.errors = {};
      for (const inputTag of match[2].matchAll(/<input([^>]*)>/g)) {
        const input = makeNode(attributes(inputTag[1]));
        const key = input.attrs['data-rf-field'];
        input.disabled = /\sdisabled(?:\s|$)/.test(inputTag[1]);
        input.closest = () => row;
        row.inputs[key] = input;
        row.errors[key] = makeNode();
      }
      row.querySelector = selector => {
        if (selector === '[data-rf-range]') return row.range;
        const field = selector.match(/\[data-rf-(field|error)="(\w+)"\]/);
        return field ? (field[1] === 'field' ? row.inputs : row.errors)[field[2]] : null;
      };
      return row;
    });
  }
});
node('rfTierRows').querySelector = selector => {
  const index = selector.match(/data-rf-index="(\d+)"/);
  if (index) return rows[Number(index[1])];
  if (selector === '[aria-invalid="true"]') return rows.flatMap(row => Object.values(row.inputs)).find(input => input.attrs['aria-invalid'] === 'true');
  return null;
};
let stored = null;
let storageWrites = 0;
const context = {
  document: { readyState: 'loading', addEventListener() {}, getElementById: node, querySelectorAll(selector) { return selector === '#rfTierRows tr' ? rows : []; }, documentElement: { contains() { return true; } } },
  window: { localStorage: { getItem() { return stored; }, setItem() { storageWrites += 1; } } }
};
const marker = "  if (document.readyState === 'loading')";
const expose = "  globalThis.probe = { set(items) { tiers = items; }, get() { return tiers; }, ranges() { return tiers.map(function (tier, index) { return [tierStart(index), tier.vip]; }); }, valid: requireValidTiers, render: renderTiers, update: updateTierInput, add: addTier, remove: deleteTier, save: saveConfiguration, sync: syncRuleTable, restore: restoreRecord, preview: previewRules, editRules: setRuleEditing, close: closeModal, original(html) { originalRuleTable = html; } };\n";
assert(script.includes(marker));
vm.runInNewContext(script.replace(marker, expose + marker), context);
const probe = context.probe;
node('rfPreviewModal').id = 'rfPreviewModal';
node('rfDescription').innerHTML = '<p>Saved rules</p>';
probe.preview(node('rfPreviewRules'));
assert.equal(node('rfRuleFields').disabled, false, 'Rule configuration opens directly in edit mode');
probe.editRules(true);
assert.equal(node('rfRuleFields').disabled, false);
node('rfDescription').innerHTML = '<p>Unsaved rules</p>';
probe.close();
assert.equal(node('rfDescription').innerHTML, '<p>Saved rules</p>', 'Close rolls back unsaved rule text');
assert.equal(node('rfRuleFields').disabled, true);
const clone = value => JSON.parse(JSON.stringify(value));
const base = [0, 2, 4, 15].map((vip, index) => ({ vip, deposit: index ? 50000 : 20000, loss: index ? 50000 : 20000, rate: [2, 2, 3, 4][index], cap: 88990000 }));
function edit(index, key, value) { const input = rows[index].inputs[key]; input.value = String(value); probe.update({ target: input }); }
probe.set(clone(base)); probe.render();
assert.deepEqual(clone(probe.ranges()), [[0, 0], [1, 2], [3, 4], [5, 15]]);
assert.equal(rows[3].inputs.vip.disabled, true);
assert(probe.valid());

// Inline maxima update the next range, while invalid boundaries remain visible.
edit(1, 'vip', 3);
assert.deepEqual(clone(probe.ranges()), [[0, 0], [1, 3], [4, 4], [5, 15]]);
assert.equal(rows[2].range.textContent, '4');
edit(1, 'vip', 4);
assert.equal(probe.get()[1].vip, 3);
assert.equal(rows[1].inputs.vip.attrs['aria-invalid'], 'true');
assert(!probe.valid());
edit(1, 'vip', 3);

// One click inserts a blank row before the automatic final range, with no modal.
probe.add();
assert.deepEqual(clone(probe.ranges()), [[0, 0], [1, 3], [4, 4], [5, 5], [6, 15]]);
for (const key of keys.slice(1)) { assert.equal(probe.get()[3][key], null); assert.equal(rows[3].errors[key].hidden, false); }
assert.equal(focused, rows[3].inputs.deposit);
assert(rows[3].classList.contains('rf-tier-invalid'));
probe.save({ preventDefault() {} });
probe.sync();
assert.equal(storageWrites, 0, 'Incomplete rows must not save or overwrite the rule table');
edit(3, 'vip', 8);
for (const key of keys.slice(1)) edit(3, key, base[3][key]);
assert(probe.valid());
assert.deepEqual(clone(probe.ranges()), [[0, 0], [1, 3], [4, 4], [5, 8], [9, 15]]);

// Amounts and percentages validate in place; zero thresholds are not missing values.
edit(3, 'deposit', 0); assert.equal(probe.get()[3].deposit, 0); assert(probe.valid());
for (const value of ['', 0, 100.01, 4.005]) { edit(3, 'rate', value); assert(!probe.valid()); }
edit(3, 'rate', 4); assert(probe.valid());
edit(3, 'loss', -1); assert(!probe.valid()); edit(3, 'loss', 50000);
edit(3, 'cap', 0); assert(!probe.valid()); edit(3, 'cap', 88990000);

// Deletion fills the removed range and preserves other in-progress inputs.
edit(3, 'rate', '');
probe.remove(1);
assert.deepEqual(clone(probe.ranges()), [[0, 0], [1, 4], [5, 8], [9, 15]]);
assert.equal(probe.get()[2].rate, null);
assert.equal(rows[2].inputs.rate.value, '');
edit(2, 'rate', 4);
probe.remove(3);
assert.deepEqual(clone(probe.ranges()), [[0, 0], [1, 4], [5, 15]]);
assert(probe.valid());
assert.equal(rows[2].inputs.vip.disabled, true);

// A previously invalid maximum can become valid after removing its neighbour.
probe.set(clone(base)); probe.render(); edit(0, 'vip', 3); probe.remove(1);
assert.deepEqual(clone(probe.ranges()), [[0, 3], [4, 4], [5, 15]]);
assert(probe.valid());
probe.set([clone(base[3])]); probe.render(); probe.remove(0);
assert.deepEqual(clone(probe.ranges()), [[0, 15]], 'Keep at least one range');
probe.set(Array.from({ length: 16 }, (_, vip) => ({ ...base[3], vip }))); probe.render(); probe.add();
assert.equal(probe.get().length, 16); assert.equal(node('rfAddTier').disabled, true);

// Previous drafts and the reference rich-text table survive this interaction change.
probe.original(referenceTable);
stored = JSON.stringify({ version: 1, name: 'Saved draft', start: '2026-11-01T00:00', end: '2026-12-31T23:59', longTerm: true, tiers: [0, 1, 2, 3, 4, 5].map(vip => ({ ...base[Math.min(vip, 3)], vip })), description: 'Existing English rules', details: [] });
probe.restore();
assert(probe.valid());
assert.equal(probe.get()[probe.get().length - 1].vip, 15);
assert(node('rfDescription').innerHTML.includes('Existing English rules'));
assert(node('rfDescription').innerHTML.includes('88.99M'));
assert(!/id="rf(?:Start|End|LongTerm)"/.test(html), 'Rescue fund has no activity date range');
assert(!/record\.(?:start|end|longTerm)/.test(script), 'Date range is not part of rescue fund validation or persistence');
console.log('PASS: no activity date range; inline add/edit/delete, amount validation, incomplete-save guard, VIP15 coverage, legacy draft compatibility, rich text, UTF-8.');
