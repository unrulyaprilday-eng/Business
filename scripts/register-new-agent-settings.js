const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const filename = 'data/document.js';
const pageName = '新代理配置';
const nodeId = 'agent_center_new_config';
const source = fs.readFileSync(filename, 'utf8');
let model;
vm.runInNewContext(source, { $axure: { loadDocument(value) { model = value; } } });
const roots = model.sitemap.rootNodes;
const parent = roots.find((node) => node.id === 'agent_center');
assert(parent, 'Missing agent center parent');
assert(fs.existsSync(pageName + '.html'), 'New page must exist before menu registration');
const originalOldNode = JSON.stringify(parent.children.find((node) => node.id === 'agent_center_config'));
function flatten(nodes) { return nodes.flatMap((node) => [node, ...flatten(node.children || [])]); }
const matches = flatten(roots).filter((node) => node.id === nodeId || node.url === pageName + '.html');
assert(matches.length <= 1, 'Duplicate new-page identity');
if (!matches.length) {
  parent.children.splice(parent.children.findIndex((node) => node.id === 'agent_center_config') + 1, 0, {
    id: nodeId, pageName, type: 'Wireframe', url: pageName + '.html', children: []
  });
} else {
  assert(parent.children.includes(matches[0]), 'Existing new page belongs to a different parent');
  assert.equal(matches[0].id, nodeId);
  assert.equal(matches[0].pageName, pageName);
  assert.equal(matches[0].url, pageName + '.html');
}
assert.equal(JSON.stringify(parent.children.find((node) => node.id === 'agent_center_config')), originalOldNode);
const start = source.indexOf('[', source.indexOf('"rootNodes"', source.indexOf('"sitemap"')));
assert(start >= 0, 'Cannot locate sitemap rootNodes');
let depth = 0, quote = false, escape = false, end = -1;
for (let index = start; index < source.length; index += 1) {
  const ch = source[index];
  if (quote) {
    if (escape) escape = false;
    else if (ch === '\\') escape = true;
    else if (ch === '"') quote = false;
  } else if (ch === '"') quote = true;
  else if (ch === '[') depth += 1;
  else if (ch === ']' && --depth === 0) { end = index + 1; break; }
}
assert(end > start, 'Cannot locate end of rootNodes');
const encoded = JSON.stringify(roots, null, 2).split('\n').map((line, index) => index ? '    ' + line : line).join('\n');
const next = source.slice(0, start) + encoded + source.slice(end);
let checked;
vm.runInNewContext(next, { $axure: { loadDocument(value) { checked = value; } } });
assert.deepEqual(JSON.parse(JSON.stringify(checked)), JSON.parse(JSON.stringify(model)));
fs.writeFileSync(filename, next, 'utf8');
console.log('Registered agent_center_new_config under agent_center; original agent config node preserved.');
