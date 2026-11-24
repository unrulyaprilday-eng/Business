const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const page = "\u6e38\u620f\u9891\u9053\u7ba1\u7406_1";
const html = fs.readFileSync(page + ".html", "utf8");
const source = fs.readFileSync("custom/js/" + page + ".js", "utf8");
class Element {
  constructor() { this.events = {}; this.dataset = {}; this.children = []; this.value = ""; this.classList = { toggle() {} }; }
  addEventListener(type, fn) { this.events[type] = fn; }
  fire(type, target = this, detail = {}) { this.events[type]?.({ target, preventDefault() {}, ...detail }); }
  querySelectorAll() { return []; }
  querySelector() { return null; }
  append() {}
  focus() {}
}
const nodes = new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => [id, new Element()]));
const el = (id) => nodes.get("gc-" + id);
el("channel-form").parentElement = new Element();
el("channel-form").querySelectorAll = (selector) => ["icon", "selectedIcon"].map((key) => Object.assign(new Element(), {
  dataset: { [selector.includes("reset") ? "gcResetIcon" : "gcUpload"]: key }
}));
const table = el("games");
let rows;
Object.defineProperty(table, "innerHTML", {
  set(markup) {
    rows = [...markup.matchAll(/<tr([^>]*)>(.*?)<\/tr>/g)].map(([, attrs, content]) => {
      const match = content.match(/data-gc-game-position="(\d+)" value="(\d+)"/);
      const row = { hidden: attrs.includes("gc-game-hidden") };
      const id = content.match(/data-gc-flag="shown" data-id="(\d+)"/)?.[1];
      row.id = id;
      if (match) {
        row.field = Object.assign(new Element(), { value: match[2], dataset: { gcGamePosition: id }, closest: () => row });
      }
      return row;
    });
  }
});
table.querySelectorAll = (selector) => selector.includes("gc-game-position") ? rows.flatMap((row) => row.field ? [row.field] : []) : [];
table.querySelector = () => rows.find((row) => row.hidden) ?? null;
table.insertBefore = (row, target) => {
  assert.notEqual(row, target);
  rows = rows.filter((candidate) => candidate !== row);
  rows.splice(target ? rows.indexOf(target) : rows.length, 0, row);
};
let saved;
const window = {
  businessSiteSkin: { readActive: () => "ct", isLandscape: () => true },
  localStorage: { getItem: () => null, setItem: (_, value) => { saved = JSON.parse(value); } },
  addEventListener() {},
  removeEventListener() {},
  confirm: () => true
};
vm.runInNewContext(source, { window, document: { readyState: "complete", getElementById: (id) => nodes.get(id), addEventListener() {} } });
const field = (id) => rows.find((row) => row.id === id).field;
const change = (id, value, type = "change") => {
  const input = field(id);
  input.value = value;
  table.fire(type, input, { key: "Enter" });
};
const search = (text) => { el("search").value = text; el("search").fire("input"); };
const preview = el("preview-games");
assert.equal(field("102"), undefined);
el("edit").fire("click");
assert.match(el("channels").innerHTML, /data-gc-move="channel"/);
assert.equal(field("101"), undefined);
assert.equal(field("105").value, "3");
change("105", "1", "keydown");
assert.deepEqual(rows.slice(0, 3).map(({ id, field }) => [id, field.value]), [["105", "1"], ["102", "2"], ["104", "3"]]);
assert.match(preview.innerHTML, /gc-tile is-large is-highlighted gc-game-art[^>]*title="Wild Ape"/);
change("105", "1.5");
assert.equal(field("105").value, "1");
search("Mahjong");
assert.equal(field("102").value, "2");
change("111", "１");
assert.deepEqual(rows.map(({ id, field }) => [id, field.value]), [["111", "1"], ["102", "3"]]);
search("");
assert.deepEqual(rows.slice(0, 4).map(({ id }) => id), ["111", "105", "102", "104"]);
const visibleCount = rows.filter((row) => row.field).length;
change("105", "999");
assert.equal(field("105").value, String(visibleCount));
assert.equal(rows[visibleCount - 1].id, "105");
assert.equal(rows[visibleCount].hidden, true);
el("cancel").fire("click");
assert.equal(rows[0].id, "102");
el("edit").fire("click");
change("105", "1");
el("save").fire("click");
assert.deepEqual(saved.channels.find((channel) => channel.id === "slots").games.slice(0, 3).map(({ id }) => id), ["105", "102", "104"]);
assert.equal(field("105"), undefined);
console.log("OK: direct numeric sorting, invalid input, search, range normalization, preview, save and cancel");
