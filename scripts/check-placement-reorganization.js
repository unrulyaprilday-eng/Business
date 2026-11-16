'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function load(file, method) { let result; vm.runInNewContext(read(file), {$axure: {[method](value) { result = value; }}}); assert(result, file); return JSON.parse(JSON.stringify(result)); }
const document = load('data/document.js', 'loadDocument');
const flatten = nodes => nodes.flatMap(node => [node, ...flatten(node.children || [])]);
const nodes = flatten(document.sitemap.rootNodes);
assert.equal(new Set(nodes.map(node => node.id)).size, nodes.length, 'Menu IDs remain unique');
const active = nodes.find(node => node.id === 'agent_placement_management');
const independent = nodes.find(node => node.id === 'independent_rules');
const old = independent.children.find(node => node.id === 'original_placement_management');
assert.deepEqual(active.children.map(node => node.id), ['placement_channel_management', 'ad_spend_data', 'placement_data_report', 'channel_report']);
assert(old && old.children.length === 4, 'Four original pages, excluding the newly added channel page');
assert(!nodes.some(node => node.id === 'original_placement_0'));
assert(independent.children.some(node => node.id === 'independent_vip_settings'));
assert(independent.children.some(node => node.id === 'promotion_global_config'));
assert(!nodes.some(node => node.url === '渠道报表明细.html'), 'Detail opens through drilldown, not an independent menu');
const snapshot = JSON.parse(read('scripts/ai-menu-snapshot.json'));
assert.deepEqual(snapshot.rootNodes, JSON.parse(JSON.stringify(document.sitemap.rootNodes)), 'Menu snapshot is current');
const archive = JSON.parse(read('scripts/placement-original-manifest.json'));
for (const file of archive.files) assert.equal(crypto.createHash('sha256').update(read(file.target)).digest('hex'), file.sha256, 'Frozen original: ' + file.target);
const roles = {新渠道管理: 'channels', 广告消耗数据: 'spend', 投放数据报表: 'placement', 渠道报表: 'reports', 渠道报表明细: 'detail'};
const tabs = {channels: ['channels', 'packages', 'updates'], spend: [], placement: ['daily', 'roi'], reports: ['promotion', 'conversion', 'retention'], detail: []};
const dataIds = {...Object.fromEntries(active.children.map(node => [node.pageName, node.id])), 渠道报表明细: 'channel_report_detail'};
const pages = active.children.concat([{pageName: '渠道报表明细', id: 'channel_report_detail', url: '渠道报表明细.html'}], old.children);
let compiled = new Set();
const stableRuntime = [...read('原版渠道报表.html').matchAll(/<script\b[^>]*src="(resources\/scripts\/[^"?#]+)"/g)].map(match => match[1]).filter(file => !file.endsWith('/ios.js'));
for (const page of pages) {
  const html = read(page.url);
  const data = load('files/' + page.pageName + '/data.js', 'loadCurrentPage');
  assert.equal(data.url, page.url); assert.equal(data.page.name, page.pageName); assert.equal(data.page.packageId, page.id);
  assert(Array.isArray(data.page.diagram.objects));
  for (const value of [html, read('files/' + page.pageName + '/data.js'), read('files/' + page.pageName + '/styles.css')]) {
    assert(!value.includes('\ufffd')); assert(!/\?{3,}/.test(value));
  }
  for (const match of html.matchAll(/\b(?:src|href)="([^"#]+)"/g)) {
    const url = match[1].split(/[?#]/)[0];
    if (/^(https?:|data:)/.test(url)) continue;
    assert(!/^(?:\/|\\|[a-z]:)/i.test(url), 'Relative project reference: ' + url);
    const file = decodeURIComponent(url);
    assert(fs.existsSync(path.join(root, file)), 'Missing linked asset: ' + file + ' on ' + page.url);
    if (file.endsWith('.js') && !file.startsWith('resources/') && !compiled.has(file)) { new vm.Script(read(file), {filename: file}); compiled.add(file); }
  }
  const runtime = [...html.matchAll(/<script\b([^>]*src="(resources\/scripts\/[^"?#]+)"[^>]*)>/g)].filter(match => !match[2].endsWith('/ios.js'));
  assert.deepEqual(runtime.map(match => match[2]), stableRuntime);
  runtime.forEach(match => assert(!/\b(?:async|defer)\b/.test(match[1])));
  if (roles[page.pageName]) {
    const role = roles[page.pageName];
    assert(html.includes('data-cm-page="' + role + '"'));
    assert.match(html, /<div id="base" class="">\s*<\/div>/);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, 'Unique DOM IDs: ' + page.url);
    assert.deepEqual([...html.matchAll(/data-cm-view="([^"]+)"/g)].map(match => match[1]), tabs[role]);
    assert.equal(data.page.packageId, dataIds[page.pageName]);
    assert(!html.includes('custom/js/placement-original/'));
    for (const id of ['cm-channels', 'cm-packages', 'cm-spend', 'cm-reports', 'cm-modal']) assert(html.includes('id="' + id + '"'));
    assert.match(html, /id="cm-modal"[^>]*hidden/);
    const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(match => match[1]);
    assert(scripts.indexOf('custom/js/axure-custom-page-ready.js') > scripts.indexOf('files/' + page.pageName + '/data.js'));
    assert.equal(scripts.at(-1), 'custom/js/新渠道管理.js');
    assert(scripts.indexOf('custom/js/channel-management-links.js') < scripts.length - 1);
    assert(scripts.indexOf('custom/js/placement-spend.js') < scripts.length - 1);
  } else {
    assert(!html.includes('custom/js/新渠道管理.js'));
    assert(!html.includes('custom/js/channel-management-reports.js'));
    assert(!html.includes('custom/js/渠道报表.js'));
    assert(!/href="渠道报表(?:明细)?\.html/.test(html), 'Original links stay inside original report copies');
  }
}
assert(!fs.existsSync(path.join(root, '原版新渠道管理.html')), 'Redundant channel page copy is removed');
assert(/\.cm-btn\.primary[^\n]+#409eff/.test(read('custom/css/新渠道管理.css')));
console.log('PASS placement reorganization: four active entries, four isolated original pages, detail drilldown, frozen assets, current menu snapshot, Axure identity/runtime, local links, UTF-8 and shared modules');
