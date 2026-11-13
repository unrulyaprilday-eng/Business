const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const pageName = '\u65b0\u6e20\u9053\u7ba1\u7406';
const pageId = 'placement_channel_management';
const docPath = path.join(root, 'data/document.js');
const source = fs.readFileSync(docPath, 'utf8');
let doc;
vm.runInNewContext(source, {$axure: {loadDocument(value) { doc = value; }}});
const flat = nodes => nodes.flatMap(node => [node, ...flat(node.children || [])]);
const parent = flat(doc.sitemap.rootNodes).find(node => node.id === 'agent_placement_management');
if (!parent) throw new Error('Placement management parent not found');
const existing = flat(doc.sitemap.rootNodes).find(node => node.id === pageId);
if (existing && !parent.children.includes(existing)) throw new Error('Page id exists under another parent');
parent.children = parent.children.filter(node => node.id !== pageId);
parent.children.unshift(Object.assign(existing || {}, {id: pageId, pageName, type: 'Wireframe', url: pageName + '.html', children: existing ? existing.children : []}));
const nodes = flat(doc.sitemap.rootNodes);
if (new Set(nodes.map(node => node.id)).size !== nodes.length) throw new Error('Duplicate sitemap ids');
const key = source.indexOf('"rootNodes"', source.indexOf('"sitemap"'));
const start = source.indexOf('[', key);
let depth = 0, quoted = false, escaped = false, end = -1;
for (let i = start; i < source.length; i++) {
  const c = source[i];
  if (quoted) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === '"') quoted = false; }
  else if (c === '"') quoted = true;
  else if (c === '[') depth++;
  else if (c === ']' && --depth === 0) { end = i + 1; break; }
}
if (start < 0 || end < 0) throw new Error('Sitemap array boundary not found');
const replacement = JSON.stringify(doc.sitemap.rootNodes, null, 2).replace(/\n/g, '\n    ');
const updated = source.slice(0, start) + replacement + source.slice(end);
vm.runInNewContext(updated, {$axure: {loadDocument(value) {
  if (JSON.stringify(value.sitemap.rootNodes) !== JSON.stringify(doc.sitemap.rootNodes)) throw new Error('Sitemap verification failed');
}}});
fs.writeFileSync(docPath, updated, 'utf8');
let page;
vm.runInNewContext(fs.readFileSync(path.join(root, 'files', '\u6e20\u9053\u62a5\u8868', 'data.js'), 'utf8'), {$axure: {loadCurrentPage(value) { page = value; }}});
page.url = pageName + '.html';
page.page.packageId = pageId;
page.page.name = pageName;
page.page.style.pageAlignment = 'left';
const pageText = JSON.stringify(page, null, 2).replace(/"generationDate": "[^"]+"/, '"generationDate": new Date(1794412800000)');
fs.mkdirSync(path.join(root, 'files', pageName), {recursive: true});
fs.writeFileSync(path.join(root, 'files', pageName, 'data.js'), '$axure.loadCurrentPage(' + pageText + ');\n', 'utf8');
console.log(JSON.stringify({pageId, parentId: parent.id, firstChild: parent.children[0].id, files: true}));
