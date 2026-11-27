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
let lastToast;
let navigation;
let urlContext;
const detailBack = { href: '' };
const handlers = {};
const section = { innerHTML: '', contains: () => true, addEventListener: (name, fn) => { handlers[name] = fn; } };
const escape = (value) => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const context = {
  window: { CM: {
    getState: () => structuredClone(state),
    saveState: () => { throw new Error('Reports must never mutate spend or shared state'); },
    escape, toast: text => { lastToast = text; },
    dialog: config => { dialog = config; },
    download: (name, rows) => { exported = { name, rows }; },
    channelReport: channel => '渠道报表明细.html?channel=' + channel.code,
    go: (view, filters) => { navigation = { view, filters }; },
    navigateContext: filters => { urlContext = filters; },
    navigateUrl: (view, filters) => {
      const params = new URLSearchParams({ view });
      Object.entries(filters).forEach(([key, value]) => { if (value != null && value !== '') params.set(key === 'packageId' ? 'package' : key, value); });
      return (['daily', 'roi'].includes(view) ? '投放数据报表.html' : '渠道报表.html') + '?' + params.toString();
    }
  } },
  document: { getElementById: id => id === 'cm-reports' ? section : id === 'cm-detail-back' ? detailBack : null },
  FileReader: function () {}, URLSearchParams
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
function csvRecords(rows) {
  return rows.slice(1).map(row => Object.fromEntries(rows[0].map((header, index) => [header, row[index]])));
}
function csvValue(rows, row, header) {
  const index = rows[0].indexOf(header);
  assert(index !== -1, 'CSV须保留指标：' + header);
  return row[index];
}
function show(view, options) {
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
assert.equal(navigation.view, 'detail');
assert.equal(navigation.filters.returnView, 'roi');
show('detail', navigation.filters);
assert(section.innerHTML.includes('title="观察周期未满，暂不可计算"'), 'ROI明细与主表使用相同横杠和提示');
assert(!section.innerHTML.includes('未成熟'));
rows = show('roi', { start: '2026-11-02', end: '2026-11-02', period: 'current' });
assert.equal(rows[1][9], '—', '消耗为零时不得显示0或无穷大');
rows = show('roi', { channel: '', start: '2026-11-01', end: '2026-11-01', period: 'current' });
assert(section.innerHTML.includes('<h3>INR</h3>') && section.innerHTML.includes('<h3>USD</h3>'), '币种须分组');
assert.equal(rows.filter(row => row[4] === 'INR').length, 4);
assert.equal(rows.filter(row => row[4] === 'USD').length, 3);
rows = show('conversion', { channel: 'CH1001', start: '2026-11-01', end: '2026-11-01' });
assert.equal(rows.slice(1).reduce((sum, row) => sum + row[6], 0), 670, '平铺结果须与推广总量一致');
rows = show('updates', { start: '2026-11-01', end: '2026-11-12', channel: '' });
assert(rows.length > 1);
assert(rows.slice(1).every(row => row[2] !== '新建安卓包' && row[3] !== '2.5.0'), '新包与草稿无历史');
assert(rows.slice(1).filter(row => row[2] === '安卓包' && row[3] === '2.4.0').every(row => row[0] >= '2026-11-01'), '历史发布时间固定，不随当前配置变更');
assert(rows.slice(1).filter(row => row[3] === '2.3.0').length === 0, '后继版本发布后不再生成旧版更新');
assert(rows.slice(1).some(row => row[2] === '渠道包') && rows.slice(1).some(row => row[2] === '快包'), 'channel/fast均有更新统计');
assert(rows.slice(1).filter(row => row[2] === '渠道包' && row[3] === '2.4.0').every(row => row[0] < '2026-11-08'));
assert(rows.slice(1).filter(row => row[2] === '渠道包' && row[3] === '2.4.1').every(row => row[0] >= '2026-11-08'));
assert(rows.slice(1).every(row => row[7] === row[8] + row[9] && row[7] <= row[6] && row[6] <= row[5]), '更新漏斗人数守恒');
const updatesWithoutCurrency = JSON.stringify(rows);
for (const currency of ['USD', 'INR', 'EUR']) {
  assert.equal(JSON.stringify(show('updates', { start: '2026-11-01', end: '2026-11-12', channel: '', currency })), updatesWithoutCurrency, 'APP更新忽略旧URL币种条件');
  assert(!section.innerHTML.includes('name="currency"'), 'APP更新不显示币种筛选');
  assert(!urlContext.currency, 'APP更新导航上下文不保留隐藏币种条件');
}
const historyFilter = { channel: '', media: '', link: '', source: '', scene: '', currency: '', packageId: '', version: '', category: 'all', start: '2026-11-01', end: '2026-11-12', period: 'current' };
function cents(value) { return Math.round(Number(String(value).replace(/,/g, '')) * 100); }
function percentage(numerator, denominator) { return denominator ? (numerator / denominator * 100).toFixed(2) + '%' : '—'; }
for (const view of ['promotion', 'retention', 'conversion', 'updates', 'roi']) {
  const byMedia = show(view, { ...historyFilter, media: 'TikTok', link: '' });
  const codeColumn = view === 'retention' ? 1 : view === 'updates' ? 1 : view === 'roi' ? 2 : 0;
  assert(byMedia.slice(1).every(row => ['CCCC', 'WEB01'].includes(row[codeColumn])), view + ' 应按历史媒体筛选');
  const byLink = show(view, { ...historyFilter, media: '', link: 'feed-video-01' });
  assert(byLink.slice(1).every(row => row[codeColumn] === 'CCCC'), view + ' 应按历史广告链接筛选');
}
rows = show('updates', { ...historyFilter, media: '', link: '' });
assert(rows.slice(1).filter(row => row[3] === '2.4.0').every(row => row[4] === '20400'));
assert(rows.slice(1).filter(row => row[3] === '2.4.1').every(row => row[4] === '20401'));
assert(rows.slice(1).filter(row => row[3] === '1.3.0').every(row => row[4] === '10300'));
const flatLead = ['渠道编码', '渠道名称', '广告链接', '包ID', '包名称', '币种'];
const registerMetrics = ['访问人次（入口人日）', '注册人数', '注册转化率', '下载点击人次', 'PWA安装人次', '安装包首次启动人次', '首充人数', '访问-首充转化率', '注册-首充转化率', '充值人数', '充值转化率'];
const downloadMetrics = ['下载入口曝光人次', '点击下载人次', '下载点击率', '安装 / 首次启动人次', '安装转化率'];
function flatKey(row) { return [row['渠道编码'], row['广告链接'], row['包ID'], row['币种']].join('|'); }
function numericTotal(records, metric) { return records.reduce((sum, row) => sum + (typeof row[metric] === 'number' ? row[metric] : 0), 0); }
const flatRegister = show('conversion', { ...historyFilter, metrics: 'register' });
assert.equal(JSON.stringify(flatRegister[0].slice(0, 17)), JSON.stringify(flatLead.concat(registerMetrics)), '注册导出固定维度及指标顺序');
const flatRegistrations = csvRecords(flatRegister);
assert.equal(new Set(flatRegistrations.map(flatKey)).size, flatRegistrations.length, '渠道/历史链接/包/币种组合唯一，跨场景日期版本合计');
assert(flatRegistrations.some(row => row['包ID'] === '' && row['包名称'] === '未关联包' && row['访问人次（入口人日）'] > 0), '无包访问不得丢失或归到任意包');
rows = show('conversion', { ...historyFilter, metrics: 'download' });
assert.equal(JSON.stringify(rows[0].slice(0, 11)), JSON.stringify(flatLead.concat(downloadMetrics)), '下载导出不再分四种包类型');
assert(!rows[0].includes('PWA点击人次') && !rows[0].includes('原生安装率'));
const flatDownloads = csvRecords(rows);
assert.equal(new Set(flatDownloads.map(flatKey)).size, flatDownloads.length);
assert.equal(JSON.stringify(flatDownloads.map(flatKey)), JSON.stringify(flatRegistrations.map(flatKey)), '两组指标使用相同平铺维度');
for (const row of flatDownloads) {
  const registration = flatRegistrations.find(item => flatKey(item) === flatKey(row));
  assert(row['点击下载人次'] <= row['下载入口曝光人次'], '同包点击不得超过曝光');
  assert.equal(row['下载点击率'], percentage(row['点击下载人次'], row['下载入口曝光人次']));
  assert.equal(row['安装 / 首次启动人次'], registration['PWA安装人次'] + registration['安装包首次启动人次'], '安装数仅合计同归因包PWA安装及首次启动');
  assert.equal(row['安装转化率'], percentage(row['安装 / 首次启动人次'], row['点击下载人次']));
  if (!row['包ID']) {
    assert.equal(row['下载入口曝光人次'], 0); assert.equal(row['点击下载人次'], 0);
    assert.equal(row['安装 / 首次启动人次'], 0); assert.equal(row['下载点击率'], '—'); assert.equal(row['安装转化率'], '—');
  }
}
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
assert.equal(navigation.view, 'detail');
show('detail', navigation.filters);
assert(section.innerHTML.includes('title="观察周期未满，暂不可计算"'), '复充明细与主表使用相同横杠和提示');
assert(!section.innerHTML.includes('未成熟'));
show('promotion', { ...historyFilter, media: '', link: '', channel: '', promotionMetrics: 'acquisition' });
show('conversion', { ...historyFilter, media: '', link: '', channel: '', metrics: 'register' });
const baselinePromotion = JSON.stringify(show('promotion', historyFilter));
const baselineRetention = JSON.stringify(show('retention', historyFilter));
const baselineUpdates = JSON.stringify(show('updates', historyFilter));
const baselineFunds = JSON.stringify(show('promotion', { ...historyFilter, promotionMetrics: 'funds' }));
const baselineConversions = JSON.stringify(show('conversion', { ...historyFilter, metrics: 'register' }));
const baselineDownloads = JSON.stringify(show('conversion', { ...historyFilter, metrics: 'download' }));
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
assert.equal(rows[1][9], '—', '渠道消耗无包归因时不得冒充包ROI');
assert(section.innerHTML.includes('消耗未分包 / 版本'));
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
assert.equal(JSON.stringify(show('conversion', { ...historyFilter, metrics: 'register' })), baselineConversions, '历史渠道/链接/包归因及注册付费不得随现态配置变更');
assert.equal(JSON.stringify(show('conversion', { ...historyFilter, metrics: 'download' })), baselineDownloads, '历史归因下载漏斗不得随现态配置变更');
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
const badFilter = fakeForm({ start: '2026-11-12', end: '2026-11-01' });
badFilter.matches = () => true;
handlers.submit({ target: badFilter, preventDefault: () => {} });
assert(lastToast.includes('开始日期不能晚于结束日期'));
// 展示矩阵：覆盖全部子切换、无历史新渠道行和整表空态，不启动浏览器。
for (const channel of ['', 'CH9999']) {
  for (const promotionMetrics of ['acquisition', 'funds']) show('promotion', { ...historyFilter, channel, promotionMetrics });
  for (const metrics of ['register', 'download']) {
    const conversion = show('conversion', { ...historyFilter, channel, metrics });
    if (channel) assert.equal(conversion.length, 1, '无历史渠道平铺表为空，不造维度行');
    assert(!/data-cmr-action="conversion-(?:classify|breakdown|category)"/.test(section.innerHTML), '不再提供旧分类层级按钮');
    assert.equal((section.innerHTML.match(/data-cmr-action="conversion-metrics"/g) || []).length, 2, '只有注册与付费、下载与安装两按钮');
  }
  show('retention', { ...historyFilter, channel });
  click('retention-group', { value: 'ad' }); click('export');
  assertTableColumns(section.innerHTML, '广告留存/' + channel);
  assertCsvColumns(exported.rows, '广告留存/' + channel);
  show('updates', { ...historyFilter, channel });
  show('roi', { ...historyFilter, channel });
}
console.log('PASS channel reports: immutable attribution, media/ad filters, flat conversion, matched download funnels, funding/recharge conservation, disjoint package/version totals, linked filters, maturity, currency isolation, update timeline');
console.log('PASS display matrix: promotion funding/acquisition, flat download/register metrics, new-channel empty rows; table and CSV column counts agree');
// 平铺数据按渠道及包与原推广报表勾稽，不可复制全渠道值到每个包。
for (const media of ['', 'Facebook']) for (const channel of ['', 'CH1001', 'CH1002']) for (const packageId of ['', 'PK1001', 'PK1002', '__none__']) {
  const filters = { ...historyFilter, media, channel, packageId, metrics: 'register' };
  const flat = csvRecords(show('conversion', filters));
  const promotion = csvRecords(show('promotion', { ...filters, promotionMetrics: 'acquisition' }));
  for (const [metric, promotionMetric] of [['访问人次（入口人日）', '访问人次（入口人日）'], ['注册人数', '注册人数'], ['PWA安装人次', 'PWA安装'], ['安装包首次启动人次', '安装包首次启动'], ['首充人数', '首充人数']]) {
    assert.equal(numericTotal(flat, metric), numericTotal(promotion, promotionMetric), '平铺筛选与推广汇总守恒：' + metric + '/' + channel + '/' + packageId);
  }
  const funding = csvRecords(show('promotion', { ...filters, promotionMetrics: 'funds' }));
  assert.equal(numericTotal(flat, '充值人数'), numericTotal(funding, '充值人数'));
}
for (const filters of [{ channel: 'CH1001' }, { link: 'homepageads' }, { packageId: 'PK1002' }, { currency: 'USD' }, { media: 'Facebook' }, { packageId: 'PK1003', version: '2.4.1' }]) {
  const filtered = csvRecords(show('conversion', { ...historyFilter, ...filters, metrics: 'register' }));
  assert(filtered.length > 0, '历史维度筛选须保留匹配记录');
  if (filters.channel) assert(filtered.every(row => row['渠道编码'] === 'AAAA'));
  if (filters.link) assert(filtered.every(row => row['广告链接'] === filters.link));
  if (filters.packageId) assert(filtered.every(row => row['包ID'] === filters.packageId));
  if (filters.currency) assert(filtered.every(row => row['币种'] === filters.currency));
  if (filters.version) {
    const expected = csvRecords(show('promotion', { ...historyFilter, ...filters, promotionMetrics: 'acquisition' }));
    assert.equal(numericTotal(filtered, '注册人数'), numericTotal(expected, '注册人数'), '版本筛选在平铺合计之前生效');
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
assert(section.innerHTML.includes('注册批次回收分析'));
reports.render('conversion', { packageId: 'PK1002' }); click('export');
assert(exported.rows.length > 1 && exported.rows[0][0] === '渠道编码', '分类默认直接展示平铺渠道/链接/包数据');
assert(!/<select\b[^>]*name="(?:source|scene)"/.test(section.innerHTML), '分类不提供来源或场景筛选');
const conversionMore = section.innerHTML.match(/<details\b[^>]*class="cm-report-more"[^>]*>([\s\S]*?)<\/details>/);
assert(conversionMore, '保留更多筛选');
assert.equal(JSON.stringify([...conversionMore[1].matchAll(/<select\b[^>]*name="([^"]+)"/g)].map(match => match[1]).sort()), JSON.stringify(['media', 'version']), '更多筛选仅历史媒体及归因版本');
reports.render('updates', {}); click('export');
assert(section.innerHTML.includes('value="PK1002" selected') && section.innerHTML.includes('无APP更新事件'), '跨Tab不支持PWA更新时仍明确显示正在生效的包筛选');
assert.equal(exported.rows.length, 1);
reports.render('conversion', {});
click('conversion-metrics', { value: 'download' }); click('export');
assert(exported.rows[0].includes('安装转化率'));
assertTableColumns(section.innerHTML, '切换下载指标'); assertCsvColumns(exported.rows, '切换下载指标');
click('conversion-metrics', { value: 'register' }); click('export');
assert(exported.rows[0].includes('注册转化率'));
assertTableColumns(section.innerHTML, '切回注册指标'); assertCsvColumns(exported.rows, '切回注册指标');
click('reset');
reports.render('promotion', {}); click('export');
assert.equal(exported.rows.length, 8, '重置清共享条件并恢复全部渠道');
assert(section.innerHTML.includes('访问人次（入口人日）') && section.innerHTML.includes('访问-首充转化率'));
assert(!section.innerHTML.includes('渠道报表明细.html'), '新模块不保留重复旧报表入口');
click('definitions'); assert.equal(dialog.readonly, true, '纯详情弹窗使用单关闭按钮');
for (const metrics of ['register', 'download']) {
  const baseline = JSON.stringify(show('conversion', { ...historyFilter, metrics }));
  for (const classify of ['scene', 'type', 'media', 'packageType', 'invalid']) {
    const legacy = show('conversion', { ...historyFilter, metrics, classify, breakdown: 'summary', category: 'app', source: 'native', scene: 'app' });
    assert.equal(JSON.stringify(legacy), baseline, '旧分类/汇总/分类值/来源/场景条件均不得改变结果');
    for (const key of ['classify', 'breakdown', 'source', 'scene']) assert.equal(urlContext[key], '', '同步URL清空废弃条件：' + key);
    assert.equal(urlContext.category, 'all');
  }
  const empty = show('conversion', { ...historyFilter, channel: 'CH9999', metrics });
  assert.equal(empty.length, 1);
  assertTableColumns(section.innerHTML, '分类平铺空态/' + metrics);
  assert.equal(show('conversion', { ...historyFilter, start: '2026-10-01', end: '2026-10-02', metrics }).length, 1, '无历史日期保持空表');
}
const fallbackMetrics = show('conversion', { ...historyFilter, metrics: 'invalid' });
assert(fallbackMetrics[0].includes('注册转化率')); assert.equal(urlContext.metrics, 'register');
console.log('PASS audit regression: flat dimensions, weighted ratios, shared filters, legacy URL cleanup, metric toggles, explicit person-day labels, readonly details');

// 新报表同源勾稽：注册批次日报与渠道汇总、独立按日明细的人数和资金合计一致。
state = structuredClone(initial);
const complete = { ...historyFilter, channel: 'CH1001', promotionMetrics: 'acquisition' };
const acquisitionTable = show('promotion', complete);
const acquisitionSummary = acquisitionTable[1];
const acquisitionDetails = show('detail', { ...complete, returnView: 'promotion' });
const dailySummary = show('daily', complete);
for (const [metric, dailyMetric] of [['注册人数', '注册人数'], ['首充人数', '批次累计首充人数']]) {
  const expected = csvValue(acquisitionTable, acquisitionSummary, metric);
  assert.equal(csvRecords(acquisitionDetails).reduce((sum, row) => sum + row[metric], 0), expected, '获客独立明细与汇总人数勾稽');
  assert.equal(csvRecords(dailySummary).reduce((sum, row) => sum + row[dailyMetric], 0), expected, '投放日报注册/首充与汇总勾稽');
}
for (const metric of ['首充金额', '批次累计充值']) {
  const expected = cents(csvValue(acquisitionTable, acquisitionSummary, metric));
  assert.equal(csvRecords(acquisitionDetails).reduce((sum, row) => sum + cents(row[metric]), 0), expected);
  assert.equal(csvRecords(dailySummary).reduce((sum, row) => sum + cents(row[metric]), 0), expected);
}
assert(section.innerHTML.includes('不是事件日流水') && section.innerHTML.includes('并非利润'));
let dayOne = dailySummary.find(row => row[0] === '2026-11-01');
assert.equal(dayOne[4], '100.00');
assert.equal(dayOne[6], '0.81');
assert.equal(dayOne[8], '6.67');
assert.equal(dayOne[12], percentage(cents(dayOne[10]), cents(dayOne[4])));
assert.equal(dayOne[13], percentage(cents(dayOne[10]) - cents(dayOne[11]), cents(dayOne[4])));
const fundTable = show('promotion', { ...complete, promotionMetrics: 'funds' });
const fundSummary = fundTable[1];
const fundDetails = show('detail', { ...complete, promotionMetrics: 'funds' });
for (const metric of ['充值人数', '充值次数']) assert.equal(csvRecords(fundDetails).reduce((sum, row) => sum + row[metric], 0), csvValue(fundTable, fundSummary, metric));
for (const metric of ['批次累计充值', '累计提现', '充提差', '有效投注额']) assert.equal(csvRecords(fundDetails).reduce((sum, row) => sum + cents(row[metric]), 0), cents(csvValue(fundTable, fundSummary, metric)));
for (const view of ['daily', 'detail']) for (const channel of ['', 'CH9999']) show(view, { ...historyFilter, channel });

// 翻页只影响可见表格，不裁剪导出；首行维度顺序和两组指标切换保持固定。
for (const metrics of ['register', 'download']) {
  const all = show('conversion', { ...historyFilter, metrics });
  const firstPage = section.innerHTML;
  const headings = [...firstPage.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)].slice(0, 4).map(match => match[1].replace(/<[^>]*>/g, ''));
  assert.equal(JSON.stringify(headings), JSON.stringify(['渠道', '链接', '包', '币种']));
  const pageMatch = firstPage.match(/共 (\d+) 条 · 第 1 \/ (\d+) 页/);
  assert(pageMatch); assert.equal(Number(pageMatch[1]), all.length - 1);
  if (Number(pageMatch[2]) > 1) {
    click('page-next'); click('export');
    assert(section.innerHTML.includes('第 2 / '));
    assert.equal(JSON.stringify(exported.rows), JSON.stringify(all), '非首页导出仍覆盖全部平铺行');
    click('page-prev'); assert.equal(section.innerHTML, firstPage, '返回首页恢复相同内容');
  }
}
// 固定历史快照目前不足默认20行；独立VM仅缩小页长，以实际覆盖第二页导出。
assert(script.includes('var pageSize = 20;'), '分页夹具需对齐业务默认页长');
const pagingHandlers = {};
const pagingSection = { innerHTML: '', contains: () => true, addEventListener: (name, fn) => { pagingHandlers[name] = fn; } };
const pagingContext = {
  ...context,
  window: { CM: context.window.CM },
  document: { getElementById: id => id === 'cm-reports' ? pagingSection : null }
};
vm.createContext(pagingContext);
vm.runInContext(script.replace('var pageSize = 20;', 'var pageSize = 2;'), pagingContext);
function pagingClick(action) {
  const target = { dataset: { cmrAction: action } };
  pagingHandlers.click({ target: { closest: () => target } });
}
for (const metrics of ['register', 'download']) {
  const expected = show('conversion', { ...historyFilter, metrics });
  pagingContext.window.CMReports.render('conversion', { ...historyFilter, metrics });
  assert(pagingSection.innerHTML.includes('第 1 / '));
  assert(expected.length > 3, '分页夹具须超过两行');
  pagingClick('page-next');
  assert(pagingSection.innerHTML.includes('第 2 / '));
  assertTableColumns(pagingSection.innerHTML, '受控第二页/' + metrics);
  pagingClick('export');
  assert.equal(JSON.stringify(exported.rows), JSON.stringify(expected), '实际第二页导出全部历史平铺行');
  pagingClick('page-prev');
  assert(pagingSection.innerHTML.includes('第 1 / '));
}

// 每个观察周期统一用于所有行；没有分期提现时，绝不能借用累计提现计算D周期净回收率。
for (const period of ['0', '1', '3', '7', '15', '30']) {
  const roi = show('roi', { ...complete, start: '2026-11-01', end: '2026-11-01', period });
  assert.equal(roi[1][7], 'D' + period);
  assert.equal(roi[1][11], '—');
  assert.equal(roi[1][12], '—');
  assert(section.innerHTML.includes('历史快照不含分期提现'));
  if (Number(period) > 11) { assert.equal(roi[1][8], '—'); assert.equal(roi[1][9], '—'); }
  else assert(roi[1][9] !== '—');
}
const cumulativeRoi = show('roi', { ...complete, start: '2026-11-01', end: '2026-11-01', period: 'current' })[1];
assert.equal(cumulativeRoi[12], percentage(cents(cumulativeRoi[8]) - cents(cumulativeRoi[11]), cents(cumulativeRoi[6])));
assert(!/data-cmr-action="spend-(?:add|edit|delete|import|template|records)/.test(section.innerHTML), '报表不保留第二个消耗编辑器');

// 跨页传参显式条件全部保留；从详情返回保留汇总来源；消耗录入由独立模块负责。
const deepContext = { ...complete, start: '2026-11-03', end: '2026-11-08', media: 'Facebook', link: 'homepageads', currency: 'INR', packageId: 'PK1001', version: '2.4.0', period: '3', promotionMetrics: 'funds' };
show('roi', deepContext);
click('spend-entry');
assert.equal(navigation.view, 'spend');
assert.equal(navigation.filters.entry, 'add');
for (const key of ['start', 'end', 'channel', 'media', 'link', 'currency', 'packageId', 'period']) assert.equal(navigation.filters[key], deepContext[key]);
assert.equal(navigation.filters.version, 'PK1001@2.4.0');
click('spend-view'); assert.equal(navigation.filters.entry, '');
click('roi-detail', { channel: 'CH1001' });
assert.equal(navigation.view, 'detail'); assert.equal(navigation.filters.returnView, 'roi');
show('detail', navigation.filters); click('back-summary');
assert.equal(navigation.view, 'roi'); assert.equal(navigation.filters.packageId, 'PK1001');
assert.equal(urlContext.media, 'Facebook'); assert.equal(urlContext.version, 'PK1001@2.4.0');
assert(detailBack.href.startsWith('投放数据报表.html?view=roi&'));
assert.equal(new URLSearchParams(detailBack.href.split('?')[1]).get('start'), '2026-11-03');
show('daily', complete); click('cohort-detail', { channel: 'CH1001', date: '2026-11-01' });
assert.equal(navigation.filters.start, '2026-11-01'); assert.equal(navigation.filters.end, '2026-11-01'); assert.equal(navigation.filters.returnView, 'daily');
const dailyDetailContext = structuredClone(navigation.filters);
const dailyReturnUrl = dailyDetailContext.returnUrl;
assert.equal(new URLSearchParams(dailyReturnUrl.split('?')[1]).get('start'), '2026-11-01');
assert.equal(new URLSearchParams(dailyReturnUrl.split('?')[1]).get('end'), '2026-11-12', '单日钻取前保存多日汇总范围');
show('detail', dailyDetailContext);
assert.equal(detailBack.href, dailyReturnUrl, '顶部返回与工具栏使用同一来源快照');
click('promotion-metrics', { value: 'acquisition' });
assert.equal(urlContext.returnUrl, dailyReturnUrl, '明细切换资金/获客不得改写来源快照');
click('back-summary');
assert.equal(navigation.view, 'daily'); assert.equal(navigation.filters.start, '2026-11-01'); assert.equal(navigation.filters.end, '2026-11-12');
assert.equal(navigation.filters.promotionMetrics, 'acquisition');
const fundsOrigin = { ...complete, start: '2026-11-03', end: '2026-11-09', promotionMetrics: 'funds', period: '7', returnUrl: '渠道报表.html?view=retention&start=2026-11-01&end=2026-11-02' };
show('promotion', fundsOrigin); click('daily-detail', { channel: 'CH1001' });
const fundsDetailContext = structuredClone(navigation.filters);
assert.equal(new URLSearchParams(fundsDetailContext.returnUrl.split('?')[1]).get('view'), 'promotion', '新明细入口覆盖之前的来源returnUrl');
show('detail', fundsDetailContext); click('promotion-metrics', { value: 'acquisition' }); click('back-summary');
assert.equal(navigation.view, 'promotion'); assert.equal(navigation.filters.promotionMetrics, 'funds', '返回恢复原资金Tab');
assert.equal(navigation.filters.period, '7', '返回恢复原来源period');
assert.equal(navigation.filters.end, '2026-11-09');
show('roi', { ...complete, period: '3' }); click('roi-detail', { channel: 'CH1001' });
show('detail', navigation.filters); click('back-summary');
assert.equal(navigation.view, 'roi'); assert.equal(navigation.filters.period, '3');
for (const returnUrl of ['https://evil.test/渠道报表.html?view=promotion', '//evil.test/渠道报表.html?view=promotion', '../渠道报表.html?view=promotion', '渠道报表明细.html?view=detail', '广告消耗数据.html?view=spend', '渠道报表.html?view=roi', '投放数据报表.html?view=promotion', 'javascript:alert(1)', '%2f%2fevil.test?view=promotion', '渠道报表.html\\evil?view=promotion', '渠道报表.html?view=promotion#bad']) {
  show('detail', { ...complete, returnView: 'daily', returnUrl });
  assert.equal(urlContext.returnUrl, '', '拒绝外部、路径穿越及非允许报表返回地址');
  assert(detailBack.href.startsWith('投放数据报表.html?view=daily&'));
  click('back-summary'); assert.equal(navigation.view, 'daily'); assert.equal(navigation.filters.returnUrl, '');
}

// 链接成本覆盖：旧记录未分链接，不能分摊；全部消耗明确归属主链接时，ID和历史名称结果相同。
let linked = show('roi', { ...complete, link: 'LK-CH1001-MAIN', start: '2026-11-01', end: '2026-11-01' });
const linkSelect = section.innerHTML.match(/<select\b[^>]*name="link"[^>]*>([\s\S]*?)<\/select>/)[1];
assert.equal((linkSelect.match(/\bselected\b/g) || []).length, 1, '广告链接下拉必须唯一选中实际生效条件');
assert(linkSelect.includes('<option value="homepageads" selected>homepageads</option>'), 'legacy链接ID入口须显示正确历史广告标识');
assert(!linkSelect.includes('value="LK-CH1001-MAIN"'), '主链接ID不增加同义重复选项');
assert.equal(urlContext.link, 'homepageads', '同步后的筛选也使用不可变历史广告标识');
assert.equal(linked[1][6], '—'); assert.equal(linked[1][9], '—');
assert(section.innerHTML.includes('渠道级未细分链接消耗'));
state.spend[0].linkId = 'LK-CH1001-MAIN';
linked = show('roi', { ...complete, link: 'LK-CH1001-MAIN', start: '2026-11-01', end: '2026-11-01' });
assert.equal(linked[1][6], '100.00'); assert.equal(linked[1][9], cumulativeRoi[9]);
assert.equal(JSON.stringify(linked.slice(1).map(row => row.slice(0, -1))), JSON.stringify(show('roi', { ...complete, link: 'homepageads', start: '2026-11-01', end: '2026-11-01' }).slice(1).map(row => row.slice(0, -1))), '主链接ID和历史名称均精确匹配');
for (const view of ['roi', 'daily']) {
  const packageRows = show(view, { ...complete, packageId: 'PK1001' });
  assert(section.innerHTML.includes('消耗未分包 / 版本'));
  assert(packageRows.slice(1).every(row => row[view === 'roi' ? 9 : 12] === '—'));
}
state.channels[0].links = [{ id: 'LK-NEW', linkName: 'new-link', media: 'NewMedia', legacy: false }];
state.spend.push({ id: 'S3', date: '2026-11-01', channelId: 'CH1001', media: 'NewMedia', currency: 'INR', amount: 12, linkId: 'LK-NEW', linkName: 'new-link' });
const newLinkDaily = show('daily', { ...complete, link: 'LK-NEW', media: 'NewMedia', start: '2026-11-01', end: '2026-11-01' });
assert.equal(newLinkDaily[1][4], '12.00'); assert.equal(newLinkDaily[1][5], '暂无批次'); assert.equal(newLinkDaily[1][12], '—');
assert.equal(show('detail', { ...complete, link: 'LK-NEW', media: 'NewMedia' }).length, 1, '新增链接不造历史');
state.spend[0].linkId = '';
const unassigned = show('daily', { ...complete, link: '__unassigned', start: '2026-11-01', end: '2026-11-01' });
assert.equal(unassigned[1][4], '100.00'); assert.equal(unassigned[1][5], '暂无批次'); assert.equal(unassigned[1][12], '—');
assert.equal(show('detail', { ...complete, link: '__unassigned' }).length, 1, '未细分消耗不能冒充链接归因');
assert(!script.includes('function spendEditor') && !script.includes('function spendImport') && !script.includes('saveState('));
assert(!script.includes('\uFFFD'), '报表中文不存在替换字符');
click('definitions');
assert(dialog.html.includes('充值回收率') && dialog.html.includes('净回收率') && dialog.html.includes('仅累计周期计算净回收率'));
assert(dialog.html.includes('包消耗、成本和回收率均显示—') && !dialog.html.includes('充值ROI'), '数据口径与实际禁算、展示规则一致');
console.log('PASS placement reports: cohort daily/detail reconciliation, period maturity, cumulative-only net recovery, currency and package cost boundaries, exact legacy-link costs, new-link/unassigned isolation, full navigation context; no spend mutation');

const beforeSiteCurrencySpend = JSON.stringify(show('roi', { ...complete, start: '2026-11-01', end: '2026-11-01' }));
state.spend.push({ id: 'SITE-EUR', date: '2026-11-01', channelId: 'CH1001', media: 'Facebook', currency: 'EUR', amount: 19 });
const mixedCurrencyDaily = show('daily', { ...complete, start: '2026-11-01', end: '2026-11-01' });
const euroSpend = mixedCurrencyDaily.slice(1).find(row => row[1] === 'AAAA' && row[3] === 'EUR');
assert(euroSpend, '站点币种变化后的实际消耗须独立展示');
assert.equal(euroSpend[4], '19.00'); assert.equal(euroSpend[5], '暂无批次');
for (const index of [6, 8, 9, 10, 11, 12, 13, 14]) assert.equal(euroSpend[index], '—', '异币种消耗不得借用历史批次指标');
assert(section.innerHTML.includes('<option value="EUR">EUR</option>'), '日报币种筛选覆盖实际消耗币种');
const euroOnly = show('daily', { ...complete, currency: 'EUR', start: '2026-11-01', end: '2026-11-01' });
assert.equal(euroOnly.length, 2); assert.equal(euroOnly[1][4], '19.00');
click('cohort-detail', { channel: 'CH1001', date: '2026-11-01', currency: 'EUR' });
assert.equal(navigation.filters.currency, 'EUR', '日报明细沿用本行实际币种，不能跳回历史批次');
assert.equal(JSON.stringify(show('roi', { ...complete, start: '2026-11-01', end: '2026-11-01' })), beforeSiteCurrencySpend, '异币种新消耗不影响历史ROI');
state.spend.pop();

// 对照真实旧版表头保留全部指标；业务同义名称明确映射，禁止用新字段覆盖旧字段。
state = structuredClone(initial);
function legacyHeaders(filename) {
  const html = fs.readFileSync(path.join(__dirname, '..', filename), 'utf8');
  const head = html.match(/<thead\b[^>]*>([\s\S]*?)<\/thead>/)[1];
  return [...head.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)].map(match => match[1].replace(/<button\b[\s\S]*?<\/button>/g, '').replace(/<[^>]*>/g, '').replace(/\s+/g, ''));
}
const aliases = {
  渠道名: '渠道编码', 日期: '注册批次日期', 访问人数: '访问人次（入口人日）', 新增: '注册人数',
  PWA安装数: 'PWA安装', 充值金额: '批次累计充值', 提现金额: '累计提现',
  '消耗金额(本地币)': '匹配广告消耗', 当日注册充值人数: '当日首充人数', 新增充值人数: '批次累计首充人数',
  充值成本: '首充成本', 累计充值金额: '批次累计充值', 累计提现金额: '累计提现'
};
for (const [view, original] of [['promotion', '原版渠道报表.html'], ['detail', '原版渠道报表明细.html']]) {
  const acquisition = show(view, { ...complete, promotionMetrics: 'acquisition' });
  const funding = show(view, { ...complete, promotionMetrics: 'funds' });
  const available = new Set(acquisition[0].concat(funding[0]));
  for (const heading of legacyHeaders(original).filter(heading => heading !== '操作')) assert(available.has(aliases[heading] || heading), original + '不得丢失指标：' + heading);
  assert(!acquisition[0].includes('访问首充率') && !acquisition[0].includes('注册首充率'), '转化率沿用可识别的完整原名');
  const f = csvRecords(funding)[0];
  const a = csvRecords(acquisition)[0];
  assert.equal(f['充值转化率'], percentage(f['充值人数'], a['注册人数']));
  assert.equal(cents(f['人均充值']), Math.round(cents(f['批次累计充值']) / f['充值人数']));
  assert.equal(f['提现次数'], '—', '缺少提现事件数时不得按金额虚构次数');
  assert(section.innerHTML.includes('title="当前演示快照未提供提现次数"'));
}
const dailyCoverage = show('daily', complete);
for (const heading of legacyHeaders('原版投放数据报表.html').filter(heading => !/ROI$/.test(heading))) assert(dailyCoverage[0].includes(aliases[heading] || heading), '投放旧指标不得丢失：' + heading);
for (const row of csvRecords(dailyCoverage)) assert.equal(row['当日首充人数'], row['批次累计首充人数'], '仅当前固定样本事件首充与批次首充同值');
assert(section.innerHTML.includes('当日首充人数单独按首充发生日统计') && section.innerHTML.includes('充值成本 = 消耗 / 批次累计首充人数'));
for (const heading of legacyHeaders('原版投放数据报表.html').filter(heading => /ROI$/.test(heading))) {
  const period = heading === '当日ROI' ? '0' : heading.replace('日ROI', '');
  const row = csvRecords(show('roi', { ...complete, period, start: '2026-11-01', end: '2026-11-01' }))[0];
  assert.equal(row['累计观察周期'], 'D' + period);
  assert.equal(row['净回收率'], '—', '旧净ROI窗口继续保留，缺分期提现时不得借累计提现虚算');
}

// 历史累计不受查询开始日影响；逐日累计截至当日，包/版本/场景/来源等约束不丢。
for (const constraints of [{}, { packageId: 'PK1001' }, { packageId: 'PK1002', version: '1.8.0' }, { scene: 'web', source: 'link', currency: 'INR', media: 'Facebook', link: 'homepageads' }]) {
  const context = { ...complete, ...constraints, start: '2026-11-08', end: '2026-11-10' };
  const narrow = csvRecords(show('promotion', context))[0];
  const full = csvRecords(show('promotion', { ...context, start: '2026-11-01' }))[0];
  assert.equal(narrow['累计注册'], full['注册人数'], '累计注册须包含开始日前历史，且保留其他筛选');
  assert(narrow['累计注册'] > narrow['注册人数']);
  const detail = csvRecords(show('detail', context));
  const newest = detail.find(row => row['注册批次日期'] === context.end);
  assert.equal(newest['累计注册'], narrow['累计注册'], '末日累计与渠道汇总勾稽，不能逐日累计值相加');
  const sorted = detail.slice().sort((a, b) => a['注册批次日期'].localeCompare(b['注册批次日期']));
  for (let index = 1; index < sorted.length; index++) assert.equal(sorted[index]['累计注册'] - sorted[index - 1]['累计注册'], sorted[index]['注册人数']);
}
for (const filters of [{}, { media: 'Facebook' }, { packageId: 'PK1001' }, { channel: 'CH1002', packageId: 'PK1003' }]) {
  const table = show('conversion', { ...historyFilter, ...filters, metrics: 'register' });
  for (const row of csvRecords(table)) {
    assert.equal(row['注册转化率'], percentage(row['注册人数'], row['访问人次（入口人日）']));
    assert.equal(row['访问-首充转化率'], percentage(row['首充人数'], row['访问人次（入口人日）']));
    assert.equal(row['注册-首充转化率'], percentage(row['首充人数'], row['注册人数']));
    assert.equal(row['充值转化率'], percentage(row['充值人数'], row['注册人数']), '分类充值转化率由去重人数分子/注册分母重算');
  }
}
show('detail', { ...complete, promotionMetrics: 'funds', period: '30', start: '2026-11-12', end: '2026-11-12' });
const immatureFunding = csvRecords(exported.rows)[0];
assert.equal(immatureFunding['人均充值'], '—');
assert.equal(immatureFunding['提现次数'], '—');
assert.equal(csvRecords(show('promotion', { ...complete, channel: 'CH9999', promotionMetrics: 'funds' }))[0]['提现次数'], '—', '无历史渠道也不虚构提现次数');
click('definitions');
assert(dialog.html.includes('不得根据提现金额反推次数') && dialog.html.includes('不代表生产环境两者恒等'));
console.log('PASS original metric coverage: all legacy channel summary/detail headers, exact conversion names, payer conversion and average, missing withdrawal counts, filtered rolling cumulative registration, distinct event/cohort first pay, and all legacy recovery windows');
