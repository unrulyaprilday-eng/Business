// No browser or server: exercise the real template switch and style equivalence.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { optimize } = require('./optimize-new-activity-css');
const page = '\u65b0\u589e\u6d3b\u52a8';
const source = fs.readFileSync('custom/js/' + page + '.js', 'utf8');
const html = fs.readFileSync(page + '.html', 'utf8');
const css = fs.readFileSync('files/' + page + '/styles.css', 'utf8');
assert.equal(optimize(css).output, css, 'Exported styles remain optimized and equivalent');
let writes = 0;
function node(id) {
  const values = {};
  const result = { id, style: new Proxy({}, { set(target, key, value) { writes++; target[key] = value; return true; } }),
    getAttribute(key) { return values[key] ?? null; }, setAttribute(key, value) { writes++; values[key] = value; },
    classList: { contains(value) { return value === 'panel_state'; } }
  };
  let text = '';
  Object.defineProperty(result, 'textContent', { get() { return text; }, set(value) { writes++; text = value; } });
  return result;
}
const states = Array.from({ length: 14 }, (_, index) => node('u6_state' + index));
const panel = Object.assign(node('u6'), { children: states });
const footer = { '#u4_text span': node('u4'), '#u5_text span': node('u5') };
let classWrites = 0;
let bodyClass = 'activity-layout-unified relief-template-active unrelated-class';
const body = {};
Object.defineProperty(body, 'className', { get() { return bodyClass; }, set(value) { classWrites++; writes++; bodyClass = value; } });
const document = { readyState: 'loading', addEventListener() {}, body,
  getElementById(id) { return id === 'u6' ? panel : null; }, querySelector(selector) { return footer[selector] || null; }
};
const window = { location: { search: '' } };
vm.runInNewContext(source.replace('  ready(function () {', '  window.switchTest = { setTemplateState };\n  ready(function () {'), { document, window });
const names = [...html.matchAll(/<option class="u3012_input_option"[^>]*value="([^"]+)"/g)].map(match => match[1]);
for (const name of names.concat(names.slice().reverse())) {
  const before = classWrites;
  window.switchTest.setTemplateState(name);
  assert(classWrites - before <= 1, 'Template classes updated at most once');
  assert(bodyClass.includes('activity-layout-unified') && bodyClass.includes('unrelated-class'), 'Shared classes retained');
  assert.equal(states.filter(state => state.style.display === 'block').length, 1, name + ': one active panel');
  const selected = Number(panel.getAttribute('data-active-state'));
  assert.equal(states[selected].getAttribute('aria-hidden'), 'false');
  const after = writes;
  window.switchTest.setTemplateState(name);
  assert.equal(writes, after, 'Repeated selection must not rewrite classes, panel state or footer');
}
window.switchTest.setTemplateState('奖励转盘');
assert(bodyClass.includes('lucky-wheel-template-active') && bodyClass.includes('reward-wheel-template-active'));
window.switchTest.setTemplateState('幸运转盘');
assert(bodyClass.includes('lucky-wheel-template-active') && !bodyClass.includes('reward-wheel-template-active'));
window.switchTest.setTemplateState('特惠礼包');
assert.equal(states[12].style.display, 'block');
assert.equal(footer['#u4_text span'].textContent, '保存');
window.switchTest.setTemplateState('\u780d\u4e00\u5200');
assert.equal(states[13].style.display, 'block');
assert(bodyClass.includes('bargain-template-active'));

// Run the actual wheel dropdown handler to ensure unrelated selections do no work.
const wheel = fs.readFileSync('custom/js/lucky-wheel-activity.js', 'utf8');
const sourceSelect = { options: [], value: '特惠礼包', addEventListener(type, handler) { this.handler = handler; } };
let selectWrites = 0;
const wheelSelect = { addEventListener() {}, set value(value) { selectWrites++; this.current = value; }, get value() { return this.current; } };
const nodes = { u3012_input: sourceSelect, luckyWheelTemplate: wheelSelect, rewardWheelChanceSection: {}, luckyWheelBonusSection: {}, luckyWheelIdLabel: {} };
const wheelWindow = { location: { search: '' } };
const wheelDocument = { readyState: 'loading', addEventListener() {}, getElementById(id) { return nodes[id]; } };
vm.runInNewContext(wheel.replace('  if (document.readyState === "loading")', '  window.bindWheelSelect = bindTemplateSelect;\n  if (document.readyState === "loading")'), { window: wheelWindow, document: wheelDocument, URLSearchParams });
wheelWindow.bindWheelSelect();
for (const name of ['特惠礼包', '救济金', '周卡']) {
  const before = selectWrites; sourceSelect.value = name; sourceSelect.handler(); assert.equal(selectWrites, before);
}
sourceSelect.value = '奖励转盘'; sourceSelect.handler(); assert.equal(nodes.rewardWheelChanceSection.hidden, false);
sourceSelect.value = '幸运转盘'; sourceSelect.handler(); assert.equal(nodes.rewardWheelChanceSection.hidden, true);
console.log('PASS: all template selections and returns, single class update, repeated-selection no-op, shared class preservation, wheel isolation and optimized CSS equivalence.');
