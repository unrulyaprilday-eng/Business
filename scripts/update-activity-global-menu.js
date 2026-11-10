// Apply only the activity global configuration entry, preserving the current menu.
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const documentPath = "data/document.js";
const source = fs.readFileSync(documentPath, "utf8");
let data;
vm.runInNewContext(source, { $axure: { loadDocument(value) { data = value; } } });
const before = JSON.parse(JSON.stringify(data));
function flatten(nodes) { return nodes.flatMap(node => [node, ...flatten(node.children || [])]); }
const nodes = flatten(data.sitemap.rootNodes);
const parent = nodes.find(node => node.id === "promotion_activity");
assert(parent && Array.isArray(parent.children), "Activity folder is missing");
const id = "activity_global_config";
const pageName = "\u5168\u5c40\u914d\u7f6e";
const url = "\u6d3b\u52a8\u5168\u5c40\u914d\u7f6e.html";
const existing = nodes.filter(node => node.id === id || node.url === url);
assert(existing.length <= 1, "Duplicate activity global entry");
if (!existing.length) parent.children.unshift({ id, pageName, type: "Wireframe", url, children: [] });
else assert(parent.children.includes(existing[0]) && existing[0].id === id && existing[0].pageName === pageName && existing[0].url === url, "Existing entry has a conflicting identity");

const ids = flatten(data.sitemap.rootNodes).map(node => node.id);
assert.strictEqual(new Set(ids).size, ids.length, "Sitemap IDs must be unique");
assert(fs.existsSync(url), "Page HTML is missing");
let page;
vm.runInNewContext(fs.readFileSync("files/" + url.replace(".html", "/data.js"), "utf8"), { $axure: { loadCurrentPage(value) { page = value; } } });
assert(page.url === url && page.page.packageId === id && page.page.name === pageName, "Page identity differs from the menu");
const afterWithoutSitemap = JSON.parse(JSON.stringify(data));
delete before.sitemap.rootNodes;
delete afterWithoutSitemap.sitemap.rootNodes;
assert.deepStrictEqual(afterWithoutSitemap, before, "Document content outside rootNodes changed");
assert(!/\?{3,}/.test(JSON.stringify(data.sitemap.rootNodes)), "Menu encoding is suspicious");

// Replace just the rootNodes array in the original wrapper to avoid unrelated churn.
const marker = /"rootNodes"\s*:\s*/g;
const match = marker.exec(source);
assert(match && source[marker.lastIndex] === "[", "Unable to locate rootNodes array");
const start = marker.lastIndex;
let level = 0;
let inString = false;
let escaped = false;
let end = -1;
for (let index = start; index < source.length; index++) {
  const char = source[index];
  if (inString) {
    if (escaped) escaped = false;
    else if (char === "\\") escaped = true;
    else if (char === '"') inString = false;
  } else if (char === '"') inString = true;
  else if (char === "[" || char === "{") level++;
  else if (char === "]" || char === "}") {
    level--;
    if (level === 0) { end = index + 1; break; }
  }
}
assert(end > start, "Unable to find array end");
const lineEnding = source.includes("\r\n") ? "\r\n" : "\n";
const lineStart = source.lastIndexOf("\n", match.index) + 1;
const indent = source.slice(lineStart, match.index).match(/^\s*/)[0];
const array = JSON.stringify(data.sitemap.rootNodes, null, 2).replace(/\n/g, lineEnding + indent);
const next = source.slice(0, start) + array + source.slice(end);
let verify;
vm.runInNewContext(next, { $axure: { loadDocument(value) { verify = value; } } });
assert.deepStrictEqual(JSON.parse(JSON.stringify(verify)), JSON.parse(JSON.stringify(data)));
if (next !== source) fs.writeFileSync(documentPath, next, "utf8");
console.log("Activity global menu: identity, parent, unique IDs and document wrapper verified.");
