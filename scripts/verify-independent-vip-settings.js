const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const originalName = "VIP\u8bbe\u7f6e";
const pageName = "\u72ec\u7acb\u89c4\u5219" + originalName;
const html = fs.readFileSync(path.join(root, pageName + ".html"), "utf8");
const levelKeys = ["level", "keep", "daily", "weekly", "monthly"];
const clone = (value) => JSON.parse(JSON.stringify(value));

// Exercise the actual event handlers in a small DOM fixture; no browser or server.
function createHarness(name) {
  const selectors = new Map();
  function element() {
    const handlers = {};
    const classes = new Set();
    return {
      dataset: {}, hidden: true, disabled: false, value: "0", checked: false,
      textContent: "", innerHTML: "", scrollHeight: 100, scrollTop: 0,
      classList: {
        toggle(key, value) { if (value) classes.add(key); else classes.delete(key); },
        contains(key) { return classes.has(key); }
      },
      setAttribute(key, value) { this[key] = value; },
      setCustomValidity(message) { this.validationMessage = message; },
      reportValidity() { return !this.validationMessage; },
      focus() {}, select() {},
      querySelector() { return element(); },
      querySelectorAll() { return []; },
      addEventListener(type, fn) { (handlers[type] ||= []).push(fn); },
      emit(type, event = {}) {
        for (const fn of handlers[type] || []) {
          fn({ target: this, preventDefault() {}, ...event });
        }
      }
    };
  }
  [
    ".vip-settings-page", ".vip-table", ".vip-section-title", ".vip-toggle-title",
    ".vip-toggle-hint", ".vip-table-panel", ".vip-keep-period", ".vip-period-hint",
    '[data-dialog="cancel"]', '[data-dialog="add-level"]', '[data-dialog="remove-level"]',
    "[data-level-form]", "[data-new-level]", "[data-remove-level]"
  ].forEach((selector) => selectors.set(selector, element()));
  ["edit", "save", "cancel", "confirm-cancel", "toggle-setting", "add-level", "remove-level", "confirm-remove-level"]
    .forEach((action) => selectors.set('[data-action="' + action + '"]', element()));

  const toggle = selectors.get('[data-action="toggle-setting"]');
  toggle.parentElement = element();
  toggle.querySelector = () => element();
  const buttons = ["level", "keep", "daily", "weekly", "monthly", "whale"].map((tab) => {
    const button = element(); button.dataset.tab = tab; return button;
  });
  const periods = ["week", "month"].map((value) => {
    const input = element(); input.value = value; input.parentElement = element(); return input;
  });
  const inputs = new Map();
  for (const match of html.matchAll(/name="((?:level|keep|daily|weekly|monthly)-\d)"/g)) {
    inputs.set(match[1], element());
  }
  const form = selectors.get("[data-level-form]");
  form.elements = { namedItem: (name) => inputs.get(name) };
  form.reset = () => inputs.forEach((input) => { input.value = "0"; input.validationMessage = ""; });
  form.querySelectorAll = () => [...inputs.values()];
  form.reportValidity = () => [...inputs.values()].every((input) => input.value !== "" && Number(input.value) >= 0 && !input.validationMessage);
  const levelCloseButtons = [element(), element(), element(), element()];
  const cancelCloseButtons = [element(), element()];
  const document = element();
  document.readyState = "complete";
  document.querySelector = (selector) => selectors.get(selector) || null;
  document.querySelectorAll = (selector) => ({
    ".tab-btn": buttons,
    'input[name="keep-period"]': periods,
    "[data-level-dialog-close]": levelCloseButtons,
    "[data-dialog-close]": cancelCloseButtons
  }[selector] || []);
  const source = fs.readFileSync(path.join(root, "custom", "js", name + ".js"), "utf8");
  const marker = /  render\(\);\r?\n  }\r?\n\r?\n  if \(document.readyState/;
  assert(marker.test(source), "Expected DOM-ready initializer");
  const code = source.replace(marker,
    '  globalThis.readVipState = function () { return { tabs: tabs, tabMeta: tabMeta, editing: editing, keepPeriod: keepPeriod }; };\n  render();\n  }\n\n  if (document.readyState');
  const context = vm.createContext({ document });
  vm.runInContext(code, context, { filename: name + ".js" });
  assert.equal(typeof context.readVipState, "function", "Page initialization stopped unexpectedly");
  return {
    state: () => clone(context.readVipState()),
    click: (action) => selectors.get('[data-action="' + action + '"]').emit("click"),
    tab: (key) => buttons.find((button) => button.dataset.tab === key).emit("click"),
    get: (selector) => selectors.get(selector),
    form, inputs, periods, levelCloseButtons,
    submit: () => form.emit("submit")
  };
}

const baseline = createHarness(originalName).state();
const page = createHarness(pageName);
const initial = page.state();
for (const key of levelKeys) {
  const expected = baseline.tabs[key].rows.map((row, index) => [index, ...row.slice(1)]);
  assert.deepEqual(initial.tabs[key].rows, expected, "Original values changed: " + key);
}
assert.deepEqual(initial.tabs.whale, baseline.tabs.whale, "Whale settings changed");
assert.deepEqual(initial.tabMeta, baseline.tabMeta, "Feature switches changed");
assert.equal(initial.keepPeriod, baseline.keepPeriod);
assert(html.includes('data-axure-page-id="independent_vip_settings"'));
assert(/<tbody>\s*<tr><td>0<span/.test(html), "Static first screen must start at VIP0");

page.click("edit");
const firstRow = page.get(".vip-table").innerHTML.split("<tbody>")[1].split("</tr>")[0];
assert(!firstRow.includes("editable-cell"), "Registration grade must have no promotion requirements to edit");
assert.equal(page.get('[data-action="add-level"]').hidden, false);
const configuredValues = {};
for (let added = 0; added < 2; added += 1) {
  page.click("add-level");
  let value = 100 * (added + 1);
  for (const [name, input] of page.inputs) { input.value = String(++value); configuredValues[name] = value; }
  page.submit();
}
for (const key of levelKeys) {
  const rows = page.state().tabs[key].rows;
  assert.equal(rows.length, 17, "Levels must grow beyond the original fixed count");
  assert.equal(rows.at(-1)[0], 16, "VIP16 must be supported");
  for (let col = 1; col < rows.at(-1).length; col += 1) {
    assert.equal(rows.at(-1)[col], configuredValues[key + "-" + col], "New configuration not synchronized");
  }
  page.tab(key);
  assert(page.get(".vip-table").innerHTML.includes(">16</td>"), "Added level missing from rendered tab");
}
page.click("save");
const saved = page.state();

page.tab("level");
page.click("edit");
page.click("add-level");
page.submit();
page.tab("keep");
page.click("toggle-setting");
page.periods[0].checked = true;
page.periods[0].emit("change");
assert.equal(page.state().keepPeriod, "week");
page.click("cancel");
page.click("confirm-cancel");
assert.deepEqual(page.state(), saved, "Cancel must restore grades, values, switches, and period across tabs");

page.tab("level");
page.click("edit");
page.click("remove-level");
page.levelCloseButtons[0].emit("click");
assert.equal(page.state().tabs.level.rows.length, 17, "Closing delete dialog must preserve grades");
for (let count = 17; count > 1; count -= 1) {
  page.click("remove-level");
  page.click("confirm-remove-level");
}
page.click("remove-level");
page.click("confirm-remove-level");
for (const key of levelKeys) {
  assert.equal(page.state().tabs[key].rows.length, 1, "All tab rows must be removed together");
  assert.equal(page.state().tabs[key].rows[0][0], 0, "VIP0 must never be deleted");
}
assert.equal(page.get('[data-action="remove-level"]').disabled, true);
page.click("add-level");
page.submit();
assert.equal(page.state().tabs.level.rows.at(-1)[0], 1, "Level sequence must resume correctly");
page.click("cancel");
page.click("confirm-cancel");
assert.deepEqual(page.state(), saved, "Cancel deletion must restore all saved configuration");

for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  assert(fs.existsSync(path.join(root, match[1])), "Missing relative asset: " + match[1]);
}
for (const file of [pageName + ".html", "custom/js/" + pageName + ".js", "custom/css/" + pageName + ".css", "files/" + pageName + "/data.js"]) {
  assert(!/\?{2,}|\ufffd/.test(fs.readFileSync(path.join(root, file), "utf8")), "Suspicious Unicode: " + file);
}
let documentData;
vm.runInNewContext(fs.readFileSync(path.join(root, "data/document.js"), "utf8"), {
  $axure: { loadDocument(data) { documentData = data; } }
});
const snapshot = JSON.parse(fs.readFileSync(path.join(root, "scripts/ai-menu-snapshot.json"), "utf8"));
assert.deepEqual(clone(documentData.sitemap.rootNodes), snapshot.rootNodes, "Saved menu snapshot must match current sitemap");
const folders = documentData.sitemap.rootNodes.filter((node) => node.id === "independent_rules");
assert.equal(folders.length, 1);
assert.equal(folders[0].pageName, "\u72ec\u7acb\u89c4\u5219");
const menuPages = folders[0].children.filter((node) => node.id === "independent_vip_settings");
assert.equal(menuPages.length, 1);
assert.equal(menuPages[0].url, pageName + ".html");
let metadata;
vm.runInNewContext(fs.readFileSync(path.join(root, "files", pageName, "data.js"), "utf8"), {
  $axure: { loadCurrentPage(data) { metadata = data; } }
});
assert.equal(metadata.page.packageId, menuPages[0].id);
assert.equal(metadata.page.name, menuPages[0].pageName);
assert.equal(metadata.url, menuPages[0].url);
console.log("PASS: original configuration values, VIP0 default/protection, dynamic VIP16, five-tab synchronization, save/cancel, delete confirmation, relative assets, UTF-8, menu/page metadata and snapshot.");
