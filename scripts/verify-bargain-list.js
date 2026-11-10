const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const page = '\u4f18\u60e0\u6d3b\u52a8\u5217\u8868';
const type = '\u780d\u4e00\u5200';
const source = fs.readFileSync(path.join(root, 'custom', 'js', page + '.js'), 'utf8');
const html = fs.readFileSync(path.join(root, page + '.html'), 'utf8');
const key = 'promoBargainActivities';
assert(html.includes('<option>' + type + '</option>'), 'static filter option');
assert(!/\uFFFD|\?{3,}/.test(source + html), 'UTF-8 integrity');

function control(value = '') {
  return { value, attributes: {}, listeners: {}, hidden: false,
    setAttribute(name, value) { this.attributes[name] = value; },
    getAttribute(name) { return this.attributes[name]; },
    hasAttribute(name) { return Object.hasOwn(this.attributes, name); },
    addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); },
    dispatch(name, target = this) { for (const callback of this.listeners[name] || []) callback({ target, preventDefault() {} }); }
  };
}

function harness(initial = []) {
  const stored = new Map([[key, JSON.stringify(initial)], ['promoRechargeGiftActivities', '[]']]);
  const nodes = Object.fromEntries(['promoActivityRows', 'activityTypeFilter', 'searchActivitiesBtn', 'resetActivitiesBtn', 'createActivityBtn'].map(id => [id, control()]));
  nodes.activityTypeFilter.value = '\u5168\u90e8\u7c7b\u578b';
  nodes.activityTypeFilter.options = [{ textContent: '\u5e78\u8fd0\u8f6c\u76d8' }, { textContent: '\u5956\u52b1\u8f6c\u76d8' }, { textContent: type }];
  const body = nodes.promoActivityRows;
  const staticRow = control();
  staticRow.cells = Array.from({ length: 12 }, () => ({ textContent: 'existing' }));
  body.rows = [staticRow];
  body.querySelectorAll = selector => body.rows.filter(row => selector === 'tr' || row.hasAttribute(selector.slice(1, -1)));
  body.insertBefore = row => { body.rows.unshift(row); body.firstChild = row; };
  const count = control();
  const alerts = [];
  const storageListeners = [];
  let onReady, failRead = false, failWrite = false, confirmed = true;
  const window = { location: { href: '' }, alert(message) { alerts.push(message); }, confirm() { return confirmed; },
    addEventListener(name, callback) { assert.equal(name, 'storage'); storageListeners.push(callback); },
    localStorage: {
      getItem(name) { if (name === key && failRead) throw Error('read'); return stored.get(name) || null; },
      setItem(name, value) { if (name === key && failWrite) throw Error('write'); stored.set(name, value); }
    }
  };
  const document = {
    addEventListener(name, callback) { assert.equal(name, 'DOMContentLoaded'); onReady = callback; },
    getElementById(id) { return nodes[id] || null; },
    querySelectorAll(selector) { return selector === '.pagination > span' ? [count] : []; },
    createElement() {
      const row = control(); row.cells = [];
      Object.defineProperty(row, 'innerHTML', { set(value) {
        row.markup = value;
        row.cells = [...value.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map(match => ({ textContent: match[1].replace(/<[^>]*>/g, '') }));
      } });
      row.remove = () => { body.rows = body.rows.filter(item => item !== row); };
      return row;
    }
  };
  vm.runInNewContext(source, { window, document });
  onReady();
  return { nodes, body, count, stored, alerts, window, staticRow,
    rows() { return body.querySelectorAll('[data-bargain-id]'); },
    setRaw(raw) { stored.set(key, raw); }, failRead() { failRead = true; }, failWrite() { failWrite = true; }, confirm(value) { confirmed = value; },
    storage(eventKey = key, storageArea = window.localStorage) { for (const callback of storageListeners) callback({ key: eventKey, storageArea }); },
    action(action) {
      const row = this.rows()[0]; assert(row);
      body.dispatch('click', { closest(selector) {
        if (selector === '[data-bargain-id]') return row;
        if (selector === '[data-bargain-' + action + ']') return control();
        return null;
      } });
    }
  };
}

const record = {
  id: 'bargain / 1', template: type, name: '<bargain>', title: '"title"', enabled: false, wagerMultiple: '0', sort: '0',
  startTime: '2026-11-09T01:00', endTime: '2026-12-31T23:59', longTerm: true,
  rewardTarget: 'balance', rewardAmount: '100.10', initialPercent: '20', totalCuts: '5',
  personalTasks: [{ type: 'login', count: '1' }], invitationTasks: [{ count: '2', amount: '10.10' }],
  createdAt: '2026-11-09T01:00:00.000Z', updatedAt: '2026-11-09T01:00:00.000Z'
};
const test = harness([record]);
assert.equal(test.rows().length, 1);
assert.equal(test.rows()[0].cells.length, 12);
assert(test.rows()[0].markup.includes('&lt;bargain&gt;'));
assert(test.rows()[0].markup.includes('&quot;title&quot;'));
assert(test.rows()[0].markup.includes('\u957f\u671f\u6709\u6548'));
assert(test.rows()[0].markup.includes('2026-11-09 01:00:00'));
assert(test.rows()[0].markup.includes('<td>0</td>'));
assert(test.body.rows.includes(test.staticRow), 'existing rows remain');
test.nodes.activityTypeFilter.value = type; test.nodes.searchActivitiesBtn.dispatch('click');
assert(!test.rows()[0].hidden); assert(test.staticRow.hidden); assert(test.count.textContent.includes('1'));
test.nodes.activityTypeFilter.value = '\u5468\u5361'; test.nodes.searchActivitiesBtn.dispatch('click');
assert(test.rows()[0].hidden); assert(test.count.textContent.includes('0'));
test.nodes.resetActivitiesBtn.dispatch('click'); assert(!test.rows()[0].hidden); assert(!test.staticRow.hidden);
test.action('edit');
assert.equal(test.window.location.href, '\u65b0\u589e\u6d3b\u52a8.html?template=' + encodeURIComponent(type) + '&bargainId=' + encodeURIComponent(record.id));
test.action('toggle');
let saved = JSON.parse(test.stored.get(key))[0];
assert.equal(saved.enabled, true); assert.notEqual(saved.updatedAt, record.updatedAt);
for (const field of Object.keys(record).filter(field => field !== 'enabled' && field !== 'updatedAt')) assert.deepEqual(saved[field], record[field], 'toggle preserves ' + field);
assert(test.rows()[0].markup.includes('aria-checked="true"'));
test.action('toggle'); assert.equal(JSON.parse(test.stored.get(key))[0].enabled, false);
test.confirm(false); test.action('delete'); assert.equal(test.rows().length, 1);
test.confirm(true); test.action('delete'); assert.equal(test.rows().length, 0); assert.equal(test.stored.get(key), '[]');
assert(test.body.rows.includes(test.staticRow), 'deletion preserves other activity rows');
assert.equal(harness().rows().length, 0, 'no fake bargain rows');
const quota = harness([record]); quota.failWrite(); quota.action('toggle');
assert.equal(quota.stored.get(key), JSON.stringify([record])); assert(quota.rows()[0].markup.includes('aria-checked="false"')); assert.equal(quota.alerts.length, 1);
quota.action('delete'); assert.equal(quota.rows().length, 1); assert.equal(quota.stored.get(key), JSON.stringify([record]));
const readFailure = harness([record]); readFailure.failRead(); readFailure.action('toggle');
assert.equal(readFailure.stored.get(key), JSON.stringify([record])); assert.equal(readFailure.alerts.length, 1);
for (const invalid of ['{}', '[null]', '[{"id":""}]', '[{"id":"duplicate"},{"id":"duplicate"}]', '{']) {
  const corrupt = harness([record]); corrupt.setRaw(invalid); corrupt.action('delete');
  assert.equal(corrupt.stored.get(key), invalid); assert.equal(corrupt.rows().length, 1); assert.equal(corrupt.alerts.length, 1);
}
const sync = harness([record]);
sync.nodes.activityTypeFilter.value = type; sync.nodes.searchActivitiesBtn.dispatch('click');
sync.setRaw(JSON.stringify([{ ...record, id: 'new', name: 'updated', longTerm: false }])); sync.storage('unrelated');
assert.equal(sync.rows()[0].getAttribute('data-bargain-id'), record.id);
sync.storage(key, {}); assert.equal(sync.rows()[0].getAttribute('data-bargain-id'), record.id);
sync.storage(); assert.equal(sync.rows()[0].getAttribute('data-bargain-id'), 'new');
assert(sync.rows()[0].markup.includes('2026-12-31 23:59:00')); assert(!sync.rows()[0].hidden); assert(sync.staticRow.hidden);
sync.setRaw('[]'); sync.storage(null); assert.equal(sync.rows().length, 0); assert(sync.body.rows.includes(sync.staticRow));
console.log('PASS: bargain list UTF-8, rendering/escaping, type filtering/count/reset, edit URL, enable/disable and timestamp preservation, confirmed deletion, storage sync/clear, and read/write failure handling.');
