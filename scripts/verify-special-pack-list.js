const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const page = '优惠活动列表';
const source = fs.readFileSync('custom/js/' + page + '.js', 'utf8');
const html = fs.readFileSync(page + '.html', 'utf8');
const key = 'promoSpecialPackActivities';
assert(html.includes('<option>特惠礼包</option>'));
assert(!/\uFFFD|\?{3,}/.test(source + html), 'UTF-8 integrity');

function control(value = '') {
  return { value, attributes: {}, listeners: {}, hidden: false,
    setAttribute(name, value) { this.attributes[name] = value; },
    getAttribute(name) { return this.attributes[name]; },
    addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); },
    dispatch(name, target = this) { for (const callback of this.listeners[name] || []) callback({ target, preventDefault() {} }); }
  };
}
function harness(initial = []) {
  const stored = new Map([[key, JSON.stringify(initial)], ['promoRechargeGiftActivities', '[]']]);
  const nodes = Object.fromEntries(['promoActivityRows', 'activityTypeFilter', 'searchActivitiesBtn', 'resetActivitiesBtn', 'createActivityBtn'].map(id => [id, control()]));
  nodes.activityTypeFilter.value = '全部类型';
  nodes.activityTypeFilter.options = [{ textContent: '幸运转盘' }, { textContent: '奖励转盘' }, { textContent: '特惠礼包' }];
  const body = nodes.promoActivityRows;
  body.rows = [];
  body.querySelectorAll = selector => body.rows.filter(row => selector === 'tr' || row.attributes[selector.slice(1, -1)] != null);
  body.insertBefore = row => { body.rows.unshift(row); body.firstChild = row; };
  const count = control();
  const alerts = [];
  let onReady, failRead = false, failWrite = false, confirmed = true;
  const window = { location: { href: '' }, alert(message) { alerts.push(message); }, confirm() { return confirmed; },
    localStorage: { getItem(name) { if (name === key && failRead) throw Error('read'); return stored.get(name) || null; }, setItem(name, value) { if (name === key && failWrite) throw Error('write'); stored.set(name, value); } } };
  const document = { addEventListener(name, callback) { onReady = callback; }, getElementById(id) { return nodes[id] || null; },
    querySelectorAll(selector) { return selector === '.pagination > span' ? [count] : []; }, createElement() {
      const row = control(); row.cells = [];
      Object.defineProperty(row, 'innerHTML', { set(value) { row.markup = value; row.cells = [...value.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map(match => ({ textContent: match[1].replace(/<[^>]*>/g, '') })); } });
      row.remove = () => { body.rows = body.rows.filter(item => item !== row); };
      return row;
    } };
  vm.runInNewContext(source, { window, document });
  onReady();
  return { nodes, body, count, stored, alerts, window, setRaw(raw) { stored.set(key, raw); }, failRead() { failRead = true; }, failWrite() { failWrite = true; }, confirm(value) { confirmed = value; },
    action(action) { const row = body.rows.find(item => item.attributes['data-special-pack-id']); assert(row); body.dispatch('click', { closest(selector) { if (selector === '[data-special-pack-id]') return row; if (selector === '[data-special-pack-' + action + ']') return control(); return null; } }); } };
}
const record = { id: 'pack / 1', name: '<礼包>', title: '特惠标题', enabled: false, wagerMultiple: '0', sort: '0', startTime: '2026-11-06T01:00', longTerm: true,
  cycles: { daily: { enabled: true, tiers: [{ id: 'one', amount: '1000000.01', price: '0.10', enabled: true }] } } };
const test = harness([record]);
assert.equal(test.body.rows.length, 1);
assert(test.body.rows[0].markup.includes('&lt;礼包&gt;'));
assert(test.body.rows[0].markup.includes('长期有效'));
assert(test.body.rows[0].markup.includes('<td>0</td>'));
test.nodes.activityTypeFilter.value = '特惠礼包'; test.nodes.searchActivitiesBtn.dispatch('click');
assert(!test.body.rows[0].hidden); assert(test.count.textContent.includes('1'));
test.nodes.activityTypeFilter.value = '周卡'; test.nodes.searchActivitiesBtn.dispatch('click');
assert(test.body.rows[0].hidden); assert(test.count.textContent.includes('0'));
test.nodes.resetActivitiesBtn.dispatch('click'); assert(!test.body.rows[0].hidden);
test.action('edit'); assert.equal(test.window.location.href, '新增活动.html?template=' + encodeURIComponent('特惠礼包') + '&specialPackId=' + encodeURIComponent(record.id));
test.action('toggle');
assert.equal(JSON.parse(test.stored.get(key))[0].enabled, true);
assert.deepEqual(JSON.parse(test.stored.get(key))[0].cycles, record.cycles, 'toggle preserves all cycle data and decimal strings');
test.confirm(false); test.action('delete'); assert.equal(test.body.rows.length, 1);
test.confirm(true); test.action('delete'); assert.equal(test.body.rows.length, 0); assert.equal(test.stored.get(key), '[]');
assert.equal(harness().body.rows.length, 0, 'no fake special pack rows');
const quota = harness([record]); quota.failWrite(); quota.action('toggle');
assert.equal(JSON.parse(quota.stored.get(key))[0].enabled, false); assert(quota.body.rows[0].markup.includes('aria-checked="false"')); assert.equal(quota.alerts.length, 1);
quota.action('delete'); assert.equal(quota.body.rows.length, 1);
const readFailure = harness([record]); readFailure.failRead(); readFailure.action('toggle'); assert.equal(readFailure.stored.get(key), JSON.stringify([record])); assert.equal(readFailure.alerts.length, 1);
const corrupt = harness([record]); corrupt.setRaw('{}'); corrupt.action('delete'); assert.equal(corrupt.stored.get(key), '{}'); assert.equal(corrupt.body.rows.length, 1); assert.equal(corrupt.alerts.length, 1);
console.log('PASS: special pack list display, UTF-8, escaping, filters/reset/count, edit URL, toggle preservation, confirmed deletion, empty storage and read/write failures.');
