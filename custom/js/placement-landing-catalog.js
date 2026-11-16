(function () {
  'use strict';
  var key = 'business.placement-landing-catalog.v1';
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function seed() { return [{id: 'LP1123', name: '1123', style: '仿谷歌落地页', status: 'enabled', appName: '测试', androidUrl: 'http://localhost:3080/promotion?tab=vip', iosUrl: 'https://apps.apple.com/app/id123456789', rating: '4.5', description: 'ces', icon: '', screenshots: []}]; }
  function list() {
    var raw = localStorage.getItem(key);
    if (!raw) return seed();
    var records = JSON.parse(raw);
    if (!Array.isArray(records) || records.some(function (record) { return !record.id || !record.name; })) throw new Error('落地页目录读取失败，请检查已保存数据。');
    return clone(records);
  }
  function save(records) {
    var next = clone(records);
    if (!Array.isArray(next) || new Set(next.map(function (item) { return item.id; })).size !== next.length || next.some(function (item) { return !item.id || !String(item.name || '').trim(); })) throw new Error('落地页数据无效。');
    try { localStorage.setItem(key, JSON.stringify(next)); } catch (error) { throw new Error('保存失败，当前填写内容已保留，请检查浏览器存储权限。'); }
    return clone(next);
  }
  window.CMLanding = {list: list, save: save};
})();
