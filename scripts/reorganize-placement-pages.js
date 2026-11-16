const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, text) => { fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true}); fs.writeFileSync(path.join(root, file), text, 'utf8'); };
const archive = JSON.parse(read('scripts/placement-original-manifest.json'));
// The copied CSS lives one level deeper; preserve its original local image reference.
for (const file of archive.files.filter(item => item.target.endsWith('.css'))) {
  const previous = read(file.target);
  if (crypto.createHash('sha256').update(previous).digest('hex') !== file.sha256) throw new Error('Archive changed: ' + file.target);
  const next = previous.replace(/url\((["']?)\.\.\/assets\//g, 'url($1../../assets/');
  if (next !== previous) { write(file.target, next); file.sha256 = crypto.createHash('sha256').update(next).digest('hex'); }
}
write('scripts/placement-original-manifest.json', JSON.stringify(archive, null, 2) + '\n');
const template = read('新渠道管理.html');
const pages = [
  {name: '新渠道管理', id: 'placement_channel_management', role: 'channels', tabs: [['channels', '渠道与链接'], ['packages', '包管理'], ['updates', 'APP 更新统计']]},
  {name: '广告消耗数据', id: 'ad_spend_data', role: 'spend', tabs: []},
  {name: '投放数据报表', id: 'placement_data_report', role: 'placement', tabs: [['daily', '每日投放'], ['roi', '批次回收']]},
  {name: '渠道报表', id: 'channel_report', role: 'reports', tabs: [['promotion', '渠道汇总'], ['conversion', '分类转化'], ['retention', '留存分析']]},
  {name: '渠道报表明细', id: 'channel_report_detail', role: 'detail', tabs: []}
];
let stableData;
vm.runInNewContext(read('files/新渠道管理/data.js'), {$axure: {loadCurrentPage(value) { stableData = value; }}});
const channelStart = template.indexOf('<section id="cm-channels"');
const channelEnd = template.indexOf('<section id="cm-packages"', channelStart);
if (channelStart < 0 || channelEnd < channelStart) throw new Error('Channel section boundaries not found');
let channelSection = template.slice(channelStart, channelEnd);
if (!channelSection.includes('cm-channel-filter')) throw new Error('Channel fallback missing');
const modal = template.slice(template.indexOf('    <div id="cm-modal"'), template.indexOf('    <script src="custom/js/axure-custom-page-ready.js"'));
for (const page of pages) {
  let head = template.slice(0, template.indexOf('  <body'));
  head = head.replace('<title>新渠道管理</title>', '<title>' + page.name + '</title>')
    .split('files/新渠道管理/').join('files/' + page.name + '/');
  const nav = page.tabs.length ? '<nav class="cm-tabs" role="tablist" aria-label="' + page.name + '功能">' + page.tabs.map((tab, index) => '<button type="button" role="tab" aria-selected="' + (index === 0) + '" aria-controls="' + (tab[0] === 'channels' ? 'cm-channels' : tab[0] === 'packages' ? 'cm-packages' : 'cm-reports') + '"' + (index === 0 ? ' class="is-active"' : '') + ' data-cm-view="' + tab[0] + '">' + tab[1] + '</button>').join('') + '</nav>' : '';
  const links = page.role === 'channels' ? [['广告消耗数据', '广告消耗'], ['渠道报表', '渠道报表']] : [['新渠道管理', '渠道管理'], ...(page.role !== 'spend' ? [['广告消耗数据', '维护消耗']] : [['投放数据报表', '投放报表']])];
  const targets = {新渠道管理: 'channels', 广告消耗数据: 'spend', 投放数据报表: 'daily', 渠道报表: 'promotion'};
  const header = '<header class="cm-page-header"><div><div class="cm-muted">投放管理 / ' + page.name + '</div><h1>' + page.name + '</h1></div><div class="cm-actions">' + links.map(link => '<a class="cm-btn" data-cm-target="' + targets[link[0]] + '" href="' + link[0] + '.html">' + link[1] + '</a>').join('') + (page.role === 'detail' ? '<a class="cm-btn" href="渠道报表.html" id="cm-detail-back">返回汇总</a>' : '') + '<button type="button" class="cm-btn" data-cm-action="help">使用说明</button></div></header>';
  const channels = page.role === 'channels' ? channelSection : channelSection.replace('id="cm-channels"', 'id="cm-channels" hidden');
  const reportFallback = page.role === 'detail' ? '请从渠道报表选择渠道查看明细；也可使用筛选条件查询。' : '暂无查询结果，请选择日期、渠道和币种后查询。';
  const spendFallback = '<form class="cm-filter"><label class="cm-field"><span>渠道</span><select class="cm-input" disabled><option>渠道列表将在初始化后显示</option></select></label><button type="button" class="cm-btn primary" disabled>查询</button></form><div class="cm-empty">暂无查询结果，可在初始化后录入或导入消耗。</div>';
  const html = head + '  <body class="cm-body" data-axure-page-id="' + page.id + '" data-cm-page="' + page.role + '">\n    <div id="base" class=""></div>\n    <main id="cm-app" class="cm-page">' + header + nav + '\n' + channels +
    '<section id="cm-packages" class="cm-panel" role="tabpanel" aria-label="包管理" hidden><div class="cm-empty">暂无包，请在初始化后新增或筛选。</div></section>\n' +
    '<section id="cm-spend" class="cm-panel" aria-label="广告消耗数据"' + (page.role === 'spend' ? '' : ' hidden') + '>' + spendFallback + '</section>\n' +
    '<section id="cm-reports" class="cm-panel" role="tabpanel" aria-label="统计报表"' + (['placement', 'reports', 'detail'].includes(page.role) ? '' : ' hidden') + '><div class="cm-empty">' + reportFallback + '</div></section>\n' +
    '<noscript><p class="cm-note">请启用 JavaScript 以使用筛选、配置、导出和页面联动。</p></noscript></main>\n' + modal +
    ['custom/js/axure-custom-page-ready.js', 'resources/scripts/axure/ios.js', 'custom/js/placement-landing-catalog.js', 'custom/js/channel-management-packages.js', 'custom/js/channel-management-links.js', 'custom/js/channel-management-reports.js', 'custom/js/placement-spend.js', 'custom/js/新渠道管理.js'].map(file => '    <script src="' + file + '"></script>').join('\n') + '\n  </body>\n</html>\n';
  write(page.name + '.html', html);
  const data = JSON.parse(JSON.stringify(stableData));
  data.url = page.name + '.html'; data.page.name = page.name; data.page.packageId = page.id;
  write('files/' + page.name + '/data.js', '$axure.loadCurrentPage(' + JSON.stringify(data, null, 2) + ');\n');
  write('files/' + page.name + '/styles.css', '/* Layout is scoped in custom/css/新渠道管理.css. */\n');
}
const source = read('data/document.js');
let document;
vm.runInNewContext(source, {$axure: {loadDocument(value) { document = value; }}});
const flat = nodes => nodes.flatMap(node => [node, ...flat(node.children || [])]);
const active = flat(document.sitemap.rootNodes).find(node => node.id === 'agent_placement_management');
const independent = flat(document.sitemap.rootNodes).find(node => node.id === 'independent_rules');
if (!active || !independent) throw new Error('Placement/independent menu missing');
const previous = new Map(active.children.map(node => [node.id, node]));
active.children = pages.filter(page => page.role !== 'detail').map(page => Object.assign(previous.get(page.id) || {}, {id: page.id, pageName: page.name, type: 'Wireframe', url: page.name + '.html', children: []}));
const oldFolder = {id: 'original_placement_management', pageName: '投放管理（原版）', type: 'Folder', url: '', children: archive.pages.map(page => ({id: page.id, pageName: page.name, type: 'Wireframe', url: page.url, children: []}))};
const oldIndex = independent.children.findIndex(node => node.id === oldFolder.id);
if (oldIndex === -1) independent.children.push(oldFolder); else independent.children[oldIndex] = oldFolder;
const nodes = flat(document.sitemap.rootNodes);
if (new Set(nodes.map(node => node.id)).size !== nodes.length) throw new Error('Duplicate menu id');
const key = source.indexOf('"rootNodes"', source.indexOf('"sitemap"'));
const start = source.indexOf('[', key);
let depth = 0, quoted = false, escaped = false, end = -1;
for (let i = start; i < source.length; i++) {
  const char = source[i];
  if (quoted) { if (escaped) escaped = false; else if (char === '\\') escaped = true; else if (char === '"') quoted = false; }
  else if (char === '"') quoted = true;
  else if (char === '[') depth++;
  else if (char === ']' && --depth === 0) { end = i + 1; break; }
}
if (start < 0 || end < 0) throw new Error('Sitemap array boundaries missing');
const result = source.slice(0, start) + JSON.stringify(document.sitemap.rootNodes, null, 2).replace(/\n/g, '\n    ') + source.slice(end);
vm.runInNewContext(result, {$axure: {loadDocument(value) { if (JSON.stringify(value.sitemap.rootNodes) !== JSON.stringify(document.sitemap.rootNodes)) throw new Error('Menu write mismatch'); }}});
write('data/document.js', result);
console.log('Reorganized 4 active menu pages; preserved ' + archive.pages.length + ' original pages under independent_rules; detail remains a drilldown page.');
