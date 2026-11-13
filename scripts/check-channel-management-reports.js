/* 无浏览器黑盒检查：只执行报表脚本和模拟约定的主API，不读写业务数据。 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const script = fs.readFileSync(path.join(__dirname, '../custom/js/channel-management-reports.js'), 'utf8');
const initial = {
  channels: [
    { id: 'CH1001', code: 'AAAA', name: '原生样本', media: 'Facebook', type: 'link', currency: 'INR', createdAt: '2026-11-01', linkName: 'homepageads', packageIds: ['PK1001', 'PK1002'] },
    { id: 'CH1002', code: 'CCCC', name: '渠道包样本', media: 'TikTok', type: 'channel', currency: 'INR', createdAt: '2026-11-02', linkName: 'feed-video-01', packageIds: ['PK1003', 'PK1002'] },
    { id: 'CH1003', code: 'DDDD', name: 'USD样本', media: 'Google', type: 'native', currency: 'USD', createdAt: '2026-11-03', packageIds: ['PK1001'] },
    { id: 'CH1004', code: 'PWA01', name: 'PWA样本', media: '自然流量', type: 'pwa', currency: 'INR', createdAt: '2026-11-04', packageIds: ['PK1002'] },
    { id: 'CH1005', code: 'APK01', name: '快包样本', media: 'Facebook', type: 'trial', currency: 'INR', createdAt: '2026-11-05', packageIds: ['PK1004'] },
    { id: 'CH1006', code: 'WEB01', name: '下载站样本', media: 'TikTok', type: 'download', currency: 'USD', createdAt: '2026-11-06', packageIds: ['PK1004', 'PK1002'] },
    { id: 'CH9999', code: 'NEW', name: '<新渠道>', media: 'Google', type: 'native', currency: 'USD', createdAt: '2026-11-01', packageIds: ['PK9999'] }
  ],
  packages: [
    { id: 'PK1001', name: '安卓包', type: 'native', platform: 'Android', versions: [
      { version: '2.4.0', build: 240, status: 'published', publishedAt: '2026-11-05' },
      { version: '2.3.0', build: 230, status: 'archived', publishedAt: '2026-10-20' },
      { version: '2.5.0', build: 250, status: 'draft', publishedAt: '' }
    ] },
    { id: 'PK1002', name: 'PWA包', type: 'pwa', platform: 'PWA', versions: [] },
    { id: 'PK1003', name: '渠道包', type: 'channel', platform: 'Android', versions: [{ version: '2.4.1', publishedAt: '2026-11-08' }, { version: '2.4.0', publishedAt: '2026-11-01' }] },
    { id: 'PK1004', name: '快包', type: 'fast', platform: 'Android', versions: [{ version: '1.3.0', publishedAt: '2026-11-05' }] },
    { id: 'PK9999', name: '新建安卓包', type: 'native', platform: 'Android', versions: [{ version: '1.0.0', status: 'published', publishedAt: '2026-11-01' }] }
  ],
  spend: [
    { id: 'S1', date: '2026-11-01', channelId: 'CH1001', media: 'Facebook', currency: 'INR', amount: 100, note: '' },
    { id: 'S2', date: '2026-11-03', channelId: 'CH1003', media: 'Google', currency: 'USD', amount: 30, note: '' }
  ], global: {}
};
let state = structuredClone(initial);
let exported;
let dialog;
let saveFails = false;
let lastToast;
const handlers = {};
const section = { innerHTML: '', contains: () => true, addEventListener: (name, fn) => { handlers[name] = fn; } };
const escape = (value) => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const context = {
  window: { CM: {
    getState: () => structuredClone(state),
    saveState: next => { if (saveFails) throw new Error('quota'); state = structuredClone(next); },
    escape, toast: text => { lastToast = text; },
    dialog: config => { dialog = config; },
    download: (name, rows) => { exported = { name, rows }; },
    channelReport: channel => '渠道报表明细.html?channel=' + channel.code,
    go: () => {}
  } },
  document: { getElementById: id => id === 'cm-reports' ? section : null },
  FileReader: function () {}
};
vm.createContext(context);
vm.runInContext(script, context);
const reports = context.window.CMReports;
function click(action, data = {}) {
  const target = { dataset: { cmrAction: action, ...data } };
  handlers.click({ target: { closest: () => target } });
}
function assertTableColumns(html, label) {
  const tables = [...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/g)];
  for (const [tableIndex, table] of tables.entries()) {
    const head = table[1].match(/<thead>([\s\S]*?)<\/thead>/);
    const body = table[1].match(/<tbody>([\s\S]*?)<\/tbody>/);
    assert(head && body, label + ': 表格须有thead/tbody');
    const width = [...head[1].matchAll(/<th\b/g)].length;
    assert(width > 0);
    for (const [rowIndex, row] of [...body[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].entries()) {
      const cells = [...row[1].matchAll(/<td\b([^>]*)>/g)];
      const columns = cells.reduce((sum, cell) => sum + Number((cell[1].match(/colspan="(\d+)"/) || [0, 1])[1]), 0);
      assert.equal(columns, width, label + ': table ' + tableIndex + ', body row ' + rowIndex + ' 与表头列数一致');
    }
  }
}
function assertCsvColumns(rows, label) {
  assert(rows.length > 0);
  for (const [index, row] of rows.entries()) assert.equal(row.length, rows[0].length, label + ': CSV row ' + index + '列数一致');
}
function show(view, options) {
  if (view === 'conversion') options = { breakdown: 'channel', ...options };
  reports.render(view, options); click('export');
  assertTableColumns(section.innerHTML, view);
  assertCsvColumns(exported.rows, view);
  return exported.rows;
}
function fakeForm(values = {}) {
  const events = {};
  const nodes = {
    '[data-cmr-error]': { hidden: true, textContent: '' },
    '[data-cmr-preview]': { innerHTML: '' },
    '[data-cmr-file]': { files: [], addEventListener: () => {} }
  };
  const elements = {};
  Object.entries(values).forEach(([key, value]) => { elements[key] = { value: String(value), addEventListener: () => {} }; });
  return { elements, events, nodes, querySelector: key => nodes[key], addEventListener: (name, fn) => { events[name] = fn; } };
}
function preview(form) { form.events.click({ target: { closest: () => ({}) } }); }
let rows = show('promotion', { start: '2026-11-01', end: '2026-11-01', channel: 'CH1001' });
assert.equal(rows.length, 2);
assert.equal(rows[1][4], 670);
assert.equal(rows[1][5], 123);
assert.equal(rows[1][6], '18.36%');
assert.equal(rows[1][7], 75, '混合渠道仅对PWA对应入口点击计算安装');
assert.equal(rows[1][8], 66, '首次启动保留同下载入口归因，不从APP大厅借分子');
assert.equal(rows[1][9], 15);
assert.equal(rows[1][10], '10,125.00');
assert.equal(rows[1][11], '15,052.50', '累计充值按该批次观察年龄计算');
rows = show('promotion', { channel: 'CH9999' });
assert.equal(rows[1][4], '暂无数据', '新增渠道不得伪造历史');
assert(section.innerHTML.includes('&lt;新渠道&gt;'), '名称必须转义');
rows = show('promotion', { channel: 'CH1004', start: '2026-11-04', end: '2026-11-04' });
assert(rows[1][7] > 0);
assert.equal(rows[1][8], 0, 'PWA包不得冒充原生启动');
assert(!section.innerHTML.includes('href="渠道报表明细'), '未支持的渠道不得链接现有固定报表');
rows = show('retention', { channel: 'CH1001', start: '2026-11-12', end: '2026-11-12' });
assert(rows[1].slice(5, 15).every(value => value === '—'), '观察周期未满的留存人数和比率均导出横杠');
assert.equal((section.innerHTML.match(/title="观察周期未满，暂不可计算"/g) || []).length, 5, '每个未完成周期显示横杠并提供原因提示');
assert(!section.innerHTML.includes('cm-badge orange'), '未完成周期不再显示橙色状态标签');
rows = show('retention', { channel: 'CH1001', start: '2026-11-01', end: '2026-11-01' });
assert.equal(rows[1][5], 58);
assert.equal(rows[1][6], '47.15%');
assert.equal(rows[1][11], '—', 'D14观察未到');
rows = show('roi', { channel: 'CH1001', start: '2026-11-01', end: '2026-11-01', period: '1' });
assert.equal(rows[1][6], '100.00');
assert.equal(rows[1][8], '12,825.00');
assert.equal(rows[1][9], '12825.00%', 'ROI须由同币种批次充值除以消耗计算');
rows = show('roi', { start: '2026-11-12', end: '2026-11-12', period: '7' });
assert.equal(rows[1][9], '—');
assert.equal(rows[1][10], '—', 'ROI未完成周期状态统一显示横杠');
assert(section.innerHTML.includes('title="观察周期未满，暂不可计算"'));
click('roi-detail', { channel: 'CH1001' });
assert(dialog.html.includes('title="观察周期未满，暂不可计算"'), 'ROI明细与主表使用相同横杠和提示');
assert(!dialog.html.includes('未成熟'));
rows = show('roi', { start: '2026-11-02', end: '2026-11-02', period: 'current' });
assert.equal(rows[1][9], '—', '消耗为零时不得显示0或无穷大');
rows = show('roi', { channel: '', start: '2026-11-01', end: '2026-11-01', period: 'current' });
assert(section.innerHTML.includes('<h3>INR</h3>') && section.innerHTML.includes('<h3>USD</h3>'), '币种须分组');
assert.equal(rows.filter(row => row[4] === 'INR').length, 4);
assert.equal(rows.filter(row => row[4] === 'USD').length, 3);
rows = show('conversion', { channel: 'CH1001', start: '2026-11-01', end: '2026-11-01' });
const allVisits = rows.slice(1).reduce((sum, row) => sum + row[4], 0);
assert.equal(allVisits, 670, '分类结果须与推广总量一致');
click('conversion-category', { value: 'app' }); click('export');
assert.equal(exported.rows.length, 2);
assert.equal(exported.rows[1][0], 'APP大厅');
rows = show('updates', { start: '2026-11-01', end: '2026-11-12', channel: '' });
assert(rows.length > 1);
assert(rows.slice(1).every(row => row[2] !== '新建安卓包' && row[3] !== '2.5.0'), '新包与草稿无历史');
assert(rows.slice(1).filter(row => row[2] === '安卓包' && row[3] === '2.4.0').every(row => row[0] >= '2026-11-01'), '历史发布时间固定，不随当前配置变更');
assert(rows.slice(1).filter(row => row[3] === '2.3.0').length === 0, '后继版本发布后不再生成旧版更新');
assert(rows.slice(1).some(row => row[2] === '渠道包') && rows.slice(1).some(row => row[2] === '快包'), 'channel/fast均有更新统计');
assert(rows.slice(1).filter(row => row[2] === '渠道包' && row[3] === '2.4.0').every(row => row[0] < '2026-11-08'));
assert(rows.slice(1).filter(row => row[2] === '渠道包' && row[3] === '2.4.1').every(row => row[0] >= '2026-11-08'));
assert(rows.slice(1).every(row => row[7] === row[8] + row[9] && row[7] <= row[6] && row[6] <= row[5]), '更新漏斗人数守恒');
const historyFilter = { channel: '', media: '', link: '', source: '', scene: '', currency: '', packageId: '', version: '', category: 'all', start: '2026-11-01', end: '2026-11-12', period: 'current' };
function cents(value) { return Math.round(Number(String(value).replace(/,/g, '')) * 100); }
function percentage(numerator, denominator) { return denominator ? (numerator / denominator * 100).toFixed(2) + '%' : '—'; }
for (const view of ['promotion', 'retention', 'conversion', 'updates', 'roi']) {
  const byMedia = show(view, { ...historyFilter, media: 'TikTok', link: '' });
  const codeColumn = view === 'retention' ? 1 : view === 'conversion' ? 1 : view === 'updates' ? 1 : view === 'roi' ? 2 : 0;
  assert(byMedia.slice(1).every(row => ['CCCC', 'WEB01'].includes(row[codeColumn])), view + ' 应按历史媒体筛选');
  const byLink = show(view, { ...historyFilter, media: '', link: 'feed-video-01' });
  assert(byLink.slice(1).every(row => row[codeColumn] === 'CCCC'), view + ' 应按历史广告链接筛选');
}
rows = show('updates', { ...historyFilter, media: '', link: '' });
assert(rows.slice(1).filter(row => row[3] === '2.4.0').every(row => row[4] === '20400'));
assert(rows.slice(1).filter(row => row[3] === '2.4.1').every(row => row[4] === '20401'));
assert(rows.slice(1).filter(row => row[3] === '1.3.0').every(row => row[4] === '10300'));
rows = show('conversion', { ...historyFilter, media: '', link: '', metrics: 'download', classify: 'scene' });
assert(rows.length > 1);
for (const row of rows.slice(1)) {
  assert(row[5] <= row[4], '同入口下载点击不能超过下载曝光');
  assert.equal(row[6], percentage(row[5], row[4]));
  assert.equal(row[5], row[7] + row[10] + row[13] + row[16], '下载点击按包类型互斥归属');
  for (const [clickIndex, startIndex, rateIndex] of [[7, 8, 9], [10, 11, 12], [13, 14, 15], [16, 17, 18]]) {
    assert(row[startIndex] <= row[clickIndex], '对应包首次启动不能超过同入口该包点击');
    assert.equal(row[rateIndex], percentage(row[startIndex], row[clickIndex]));
  }
  if (row[0] === 'APP大厅') assert.equal(row[4], 0, '已安装APP访问不能产生下载曝光');
}
const sceneDownloads = rows.slice(1).reduce((total, row) => total + row[5], 0);
click('conversion-classify', { value: 'type' }); click('export');
assert.equal(exported.rows.slice(1).reduce((total, row) => total + row[5], 0), sceneDownloads, '推广类型与入口分类保持同一下载事实总量');
assert.equal(new Set(exported.rows.slice(1).map(row => row[0])).size, 6, '六类推广类型均可统计');
const downloadNativePart = show('conversion', { ...historyFilter, media: '', link: '', channel: 'CH1001', packageId: 'PK1001', metrics: 'download', classify: 'scene' });
assert(downloadNativePart.slice(1).every(row => row[7] === 0 && row[8] === 0), '原生包下载事实不能混入PWA');
const downloadPwaPart = show('conversion', { ...historyFilter, media: '', link: '', channel: 'CH1001', packageId: 'PK1002', metrics: 'download', classify: 'scene' });
assert(downloadPwaPart.slice(1).every(row => row[10] === 0 && row[11] === 0 && row[13] === 0 && row[16] === 0), 'PWA下载事实不能混入安装包');
rows = show('promotion', { ...historyFilter, media: '', link: '', channel: 'CH1001', promotionMetrics: 'funds', start: '2026-11-01', end: '2026-11-01' });
assert.equal(cents(rows[1][6]), 1505250, '补充资金指标不能改写已有累计充值总量');
assert.equal(cents(rows[1][6]) - cents(rows[1][13]), cents(rows[1][14]), '充值-提现必须等于充提差');
assert(rows[1][5] >= rows[1][4], '充值次数不能少于充值人数');
assert(rows[1][7] <= rows[1][9] && rows[1][9] <= rows[1][11] && rows[1][11] <= rows[1][4], '累计复充用户去重并且不超过首充人数');
for (const [users, rateIndex] of [[7, 8], [9, 10], [11, 12]]) assert.equal(rows[1][rateIndex], percentage(rows[1][users], rows[1][4]), '复充占比以首充人数为分母');
const fundingBase = rows[1];
const fundingParts = ['PK1001', 'PK1002', '__none__'].map(packageId => show('promotion', { ...historyFilter, media: '', link: '', channel: 'CH1001', promotionMetrics: 'funds', packageId, start: '2026-11-01', end: '2026-11-01' })[1]);
for (const index of [4, 5, 7, 9, 11]) assert.equal(fundingParts.reduce((total, row) => total + row[index], 0), fundingBase[index], '复充分包不重复且人数次数守恒');
for (const index of [6, 13, 14, 15]) assert.equal(fundingParts.reduce((total, row) => total + cents(row[index]), 0), cents(fundingBase[index]), '资金分包金额守恒');
rows = show('promotion', { ...historyFilter, media: '', link: '', channel: 'CH1001', promotionMetrics: 'funds', start: '2026-11-12', end: '2026-11-12' });
for (const index of [7, 8, 9, 10, 11, 12]) assert.equal(rows[1][index], '—', '复充观察周期未满时人数和占比均显示横杠');
assert(section.innerHTML.includes('title="观察周期未满，暂不可计算"'));
click('daily-detail', { channel: 'CH1001' });
assert(dialog.html.includes('title="观察周期未满，暂不可计算"'), '复充明细与主表使用相同横杠和提示');
assert(!dialog.html.includes('未成熟'));
show('promotion', { ...historyFilter, media: '', link: '', channel: '', promotionMetrics: 'acquisition' });
show('conversion', { ...historyFilter, media: '', link: '', channel: '', classify: 'scene', metrics: 'register' });
const baselinePromotion = JSON.stringify(show('promotion', historyFilter));
const baselineRetention = JSON.stringify(show('retention', historyFilter));
const baselineUpdates = JSON.stringify(show('updates', historyFilter));
const baselineFunds = JSON.stringify(show('promotion', { ...historyFilter, promotionMetrics: 'funds' }));
const baselineDownloads = JSON.stringify(show('conversion', { ...historyFilter, classify: 'type', metrics: 'download' }));
show('promotion', { ...historyFilter, promotionMetrics: 'acquisition' });
const baseMixed = show('promotion', { ...historyFilter, channel: 'CH1001', start: '2026-11-01', end: '2026-11-01' })[1];
const packageParts = ['PK1001', 'PK1002', '__none__'].map(packageId => show('promotion', { ...historyFilter, channel: 'CH1001', start: '2026-11-01', end: '2026-11-01', packageId })[1]);
for (const index of [4, 5, 7, 8, 9]) assert.equal(packageParts.reduce((total, row) => total + row[index], 0), baseMixed[index], '分包人数合计必须精确守恒：列' + index);
for (const index of [10, 11]) assert.equal(packageParts.reduce((total, row) => total + Math.round(Number(row[index].replace(/,/g, '')) * 100), 0), Math.round(Number(baseMixed[index].replace(/,/g, '')) * 100), '分包金额必须精确守恒：列' + index);
assert.equal(packageParts[0][7], 0, '原生包不分配PWA安装');
assert.equal(packageParts[1][8], 0, 'PWA不分配原生首次启动');
assert.equal(packageParts[2][7], 0);
assert.equal(packageParts[2][8], 0);
assert(packageParts[0][4] < baseMixed[4] && packageParts[1][4] < baseMixed[4], '不能把全渠道访问复制给每个包');
for (const [channelId, packageId] of [['CH1002', 'PK1003'], ['CH1005', 'PK1004']]) {
  const nativePart = show('promotion', { ...historyFilter, channel: channelId, packageId })[1];
  assert(nativePart[8] > 0, channelId + ' 的channel/fast包必须有首次启动');
  assert.equal(nativePart[7], 0);
}
const versionChannel = show('promotion', { ...historyFilter, channel: 'CH1002', packageId: 'PK1003' })[1];
const versionParts = ['PK1003@2.4.0', 'PK1003@2.4.1'].map(version => show('promotion', { ...historyFilter, channel: 'CH1002', packageId: 'PK1003', version })[1]);
for (const index of [4, 5, 8, 9]) assert.equal(versionParts.reduce((total, row) => total + row[index], 0), versionChannel[index], '历史版本分组不能重复计量');
rows = show('promotion', { ...historyFilter, channel: 'CH1002', packageId: 'PK1003', version: '2.4.1', start: '2026-11-02', end: '2026-11-07' });
assert.equal(rows[1][4], '暂无数据', '新版本发布前不存在归因事件');
rows = show('roi', { ...historyFilter, channel: 'CH1001', packageId: 'PK1001' });
assert.equal(rows[1][9], '—（消耗未分包）', '渠道消耗无包归因时不得冒充包ROI');
for (const channel of state.channels.filter(channel => channel.id !== 'CH9999')) {
  Object.assign(channel, { code: 'EDITED', type: 'pwa', media: 'changed-media', currency: 'EUR', createdAt: '2026-11-12', packageIds: ['PK9999'], linkName: 'changed-link' });
}
for (const pkg of state.packages.filter(pkg => pkg.id !== 'PK9999')) {
  Object.assign(pkg, { type: 'pwa', platform: 'changed-platform', status: 'disabled', versions: [{ version: '9.9.9', status: 'published', publishedAt: '2026-11-01' }] });
}
assert.equal(JSON.stringify(show('promotion', historyFilter)), baselinePromotion, '渠道现态及包绑定变化不得重写历史归因');
assert.equal(JSON.stringify(show('retention', historyFilter)), baselineRetention, '媒体/来源/币种/链接变更不得重写留存');
assert.equal(JSON.stringify(show('updates', historyFilter)), baselineUpdates, '现态版本/类型/发布状态变化不得重写APP更新历史');
assert.equal(JSON.stringify(show('promotion', { ...historyFilter, promotionMetrics: 'funds' })), baselineFunds, '历史资金及复充归因不得随配置变更');
assert.equal(JSON.stringify(show('conversion', { ...historyFilter, classify: 'type', metrics: 'download' })), baselineDownloads, '历史推广类型和下载漏斗不得随现态配置变更');
show('promotion', { ...historyFilter, promotionMetrics: 'acquisition' });
rows = show('promotion', { ...historyFilter, packageId: 'PK1001', version: '9.9.9' });
assert(rows.slice(1).every(row => row[4] === '暂无数据'), '新建版本不能伪造历史');
rows = show('promotion', { ...historyFilter, packageId: 'PK9999' });
assert(rows.slice(1).every(row => row[4] === '暂无数据'), '当前绑定到新包不会迁移旧事实');
state = structuredClone(initial);
let liveVersionSelect = { innerHTML: '', value: 'stale' };
handlers.change({ target: { value: 'PK1003', matches: () => true, closest: () => ({ elements: { version: liveVersionSelect } }) } });
assert(liveVersionSelect.innerHTML.includes('PK1003@2.4.1') && !liveVersionSelect.innerHTML.includes('PK1001@2.4.0'), '包切换必须联动版本选项');
assert.equal(liveVersionSelect.value, '', '包切换清空旧版本条件');
show('roi', { channel: '', start: '2026-11-01', end: '2026-11-12', period: 'current' });
click('spend-add');
let form = fakeForm({ date: '2026-11-10', channelId: 'CH1001', media: 'Facebook', currency: 'USD', amount: '10', note: 'wrong currency' });
let closed = false;
assert.equal(dialog.onSubmit(form, () => { closed = true; }), false);
assert.equal(state.spend.length, 2);
assert.equal(closed, false);
form.elements.currency.value = 'INR';
saveFails = true;
assert.equal(dialog.onSubmit(form, () => { closed = true; }), false);
assert(form.nodes['[data-cmr-error]'].textContent.includes('保存失败'));
assert.equal(state.spend.length, 2, '保存失败不应影响已保存消耗');
saveFails = false;
assert.equal(dialog.onSubmit(form, () => { closed = true; }), true);
assert.equal(state.spend.length, 3);
assert.equal(closed, true);
assert.equal(lastToast, '保存成功');
click('spend-import');
form = fakeForm({ csv: '\uFEFFdate,channelId,media,currency,amount,note\r\n2026-11-10,CH1001,Facebook,INR,120.25,"first, line\nsecond ""quoted"" line"' });
dialog.onOpen(form);
preview(form);
assert(form.nodes['[data-cmr-preview]'].innerHTML.includes('校验通过：1条'));
assert.equal(dialog.onSubmit(form, () => {}), true);
assert.equal(state.spend.length, 4);
assert.equal(state.spend[3].amount, 120.25);
assert.equal(state.spend[3].note, 'first, line\nsecond "quoted" line');
click('spend-import');
form = fakeForm({ csv: 'date,channelId,media,currency,amount,note\n2026-11-10,CH1001,Facebook,INR,120.25,"first, line\nsecond ""quoted"" line"' });
dialog.onOpen(form); preview(form);
assert(form.nodes['[data-cmr-error]'].textContent.includes('重复'));
assert.equal(dialog.onSubmit(form, () => {}), false);
assert.equal(state.spend.length, 4);
click('spend-import');
form = fakeForm({ csv: 'date,channelId,media,currency,amount,note\n2026-11-11,CH1001,Facebook,INR,15,ok\n2026-02-30,CH1001,Facebook,INR,10,bad date' });
dialog.onOpen(form); preview(form);
assert(form.nodes['[data-cmr-error]'].textContent.includes('日期无效'));
assert.equal(dialog.onSubmit(form, () => {}), false);
assert.equal(state.spend.length, 4, '一行失败应阻止整批导入');
const badFilter = fakeForm({ start: '2026-11-12', end: '2026-11-01' });
badFilter.matches = () => true;
handlers.submit({ target: badFilter, preventDefault: () => {} });
assert(lastToast.includes('开始日期不能晚于结束日期'));
// 展示矩阵：覆盖全部子切换、无历史新渠道行和整表空态，不启动浏览器。
for (const channel of ['', 'CH9999']) {
  for (const promotionMetrics of ['acquisition', 'funds']) show('promotion', { ...historyFilter, channel, promotionMetrics });
  for (const classify of ['scene', 'type']) {
    for (const metrics of ['register', 'download']) {
      show('conversion', { ...historyFilter, channel, classify, metrics });
      const categories = classify === 'scene' ? ['channel', 'web', 'app', 'download'] : ['link', 'pwa', 'trial', 'channel', 'native', 'download'];
      for (const value of categories) {
        click('conversion-category', { value }); click('export');
        assertTableColumns(section.innerHTML, classify + '/' + metrics + '/' + value + '/' + channel);
        assertCsvColumns(exported.rows, classify + '/' + metrics + '/' + value + '/' + channel);
      }
    }
  }
  show('retention', { ...historyFilter, channel });
  click('retention-group', { value: 'ad' }); click('export');
  assertTableColumns(section.innerHTML, '广告留存/' + channel);
  assertCsvColumns(exported.rows, '广告留存/' + channel);
  show('updates', { ...historyFilter, channel });
  show('roi', { ...historyFilter, channel });
}
console.log('PASS channel reports: immutable attribution, media/ad filters, type/scene classification, matched download funnels, funding/recharge conservation, disjoint package/version totals, linked filters, maturity, currency isolation, update timeline, spend persistence and atomic CSV import');
console.log('PASS display matrix: all subtabs, promotion funding/acquisition, scene/type categories, download/register metrics, new-channel empty rows; table and CSV column counts agree');
// 分类汇总按类别+币种合计，各比例重新计算，媒体过滤后仍遵守相同分组。
for (const classify of ['scene', 'type']) {
  for (const metrics of ['register', 'download']) {
    for (const media of ['', 'Facebook']) {
      const details = show('conversion', { ...historyFilter, classify, metrics, media, breakdown: 'channel' });
      const summaries = show('conversion', { ...historyFilter, classify, metrics, media, breakdown: 'summary' });
      const groups = new Map();
      details.slice(1).forEach(row => {
        const key = row[0] + '|' + row[3];
        const totals = groups.get(key) || [];
        const rateOffsets = metrics === 'register' ? [2, 7, 8] : [2, 5, 8, 11, 14];
        for (let i = 4; i < row.length - 4; i++) if (!rateOffsets.includes(i - 4)) totals[i - 4] = (totals[i - 4] || 0) + row[i];
        groups.set(key, totals);
      });
      assert.equal(summaries.length - 1, groups.size, '汇总须按类别和币种唯一分组');
      summaries.slice(1).forEach(row => {
        const totals = groups.get(row[0] + '|' + row[1]);
        assert(totals, '不能跨币种合并分类');
        totals.forEach((total, offset) => assert.equal(row[offset + 2], total, '分类汇总数值守恒'));
        if (metrics === 'register') {
          assert.equal(row[4], percentage(row[3], row[2]));
          assert.equal(row[9], percentage(row[8], row[2]));
          assert.equal(row[10], percentage(row[8], row[3]));
        } else {
          assert.equal(row[4], percentage(row[3], row[2]));
          for (const [clickIndex, startIndex, rateIndex] of [[5, 6, 7], [8, 9, 10], [11, 12, 13], [14, 15, 16]]) assert.equal(row[rateIndex], percentage(row[startIndex], row[clickIndex]));
        }
      });
    }
  }
}
show('promotion', { ...historyFilter, channel: 'CH1003', media: 'Google', currency: 'USD', packageId: 'PK1001', start: '2026-11-03', end: '2026-11-08' });
reports.render('retention', {}); click('export');
assert(exported.rows.slice(1).every(row => row[1] === 'DDDD' && row[0] >= '2026-11-03' && row[0] <= '2026-11-08'), '跨报表保留最后应用通用筛选');
reports.render('promotion', { channelId: 'CH1001' }); click('export');
assert.equal(exported.rows[1][0], 'AAAA');
assert.equal(exported.rows[1][3], 'INR');
assert(exported.rows[1][4] > 0, '新渠道钻取清除旧USD/Google/包冲突');
assert(section.innerHTML.includes('value="2026-11-03"') && section.innerHTML.includes('value="2026-11-08"'), '新钻取保留日期');
reports.render('roi'); click('export');
assert.equal(exported.rows[1][2], 'AAAA', '普通回Tab从共享条件继续');
assert(section.innerHTML.includes('注册批次充值 ROI'));
reports.render('conversion', { packageId: 'PK1002' }); click('export');
assert(section.innerHTML.includes('cm-report-more" open'), '带包context自动展开高级筛选');
assert(exported.rows.length > 1 && !exported.rows[0].includes('渠道编码'), '分类默认以汇总展示');
reports.render('updates', {}); click('export');
assert(section.innerHTML.includes('value="PK1002" selected') && section.innerHTML.includes('无APP更新事件'), '跨Tab不支持PWA更新时仍明确显示正在生效的包筛选');
assert.equal(exported.rows.length, 1);
reports.render('conversion', {});
click('conversion-breakdown', { value: 'channel' }); click('export');
assert(exported.rows[0].includes('渠道编码'));
assertTableColumns(section.innerHTML, '切到渠道明细'); assertCsvColumns(exported.rows, '切到渠道明细');
click('conversion-breakdown', { value: 'summary' }); click('export');
assert(!exported.rows[0].includes('渠道编码'));
assertTableColumns(section.innerHTML, '切回分类汇总'); assertCsvColumns(exported.rows, '切回分类汇总');
click('reset');
reports.render('promotion', {}); click('export');
assert.equal(exported.rows.length, 8, '重置清共享条件并恢复全部渠道');
assert(section.innerHTML.includes('访问人次（入口人日）') && section.innerHTML.includes('访问首充率'));
assert(!section.innerHTML.includes('渠道报表明细.html'), '新模块不保留重复旧报表入口');
click('definitions'); assert.equal(dialog.readonly, true, '纯详情弹窗使用单关闭按钮');
for (const classify of ['scene', 'type']) for (const metrics of ['register', 'download']) {
  const emptySummary = show('conversion', { ...historyFilter, channel: 'CH9999', classify, metrics, breakdown: 'summary' });
  assert.equal(emptySummary.length, 1);
  assertTableColumns(section.innerHTML, '分类汇总空态/' + classify + '/' + metrics);
}
console.log('PASS audit regression: currency-separated category comparisons, weighted ratios, shared filters, fresh-context conflict reset, summary/detail toggles, explicit person-day labels, readonly details');
