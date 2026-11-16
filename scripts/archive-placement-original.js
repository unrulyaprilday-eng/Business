const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const pages = ['广告消耗数据', '投放数据报表', '渠道报表', '渠道报表明细'];
const manifestPath = path.join(__dirname, 'placement-original-manifest.json');
if (fs.existsSync(manifestPath)) {
  const saved = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const file of saved.files) {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file.target))).digest('hex');
    if (hash !== file.sha256) throw new Error('Archived file changed: ' + file.target);
  }
  console.log('Original placement archive already exists and is intact: ' + saved.files.length + ' files');
  process.exit(0);
}
const mappings = new Map();
pages.forEach(name => {
  const html = fs.readFileSync(path.join(root, name + '.html'), 'utf8');
  for (const match of html.matchAll(/(?:href|src)="(custom\/(?:css|js)\/[^"?#]+)"/g)) {
    const source = match[1];
    if (source === 'custom/js/axure-custom-page-ready.js') continue;
    mappings.set(source, source.replace(/^(custom\/(?:css|js))\//, '$1/placement-original/'));
  }
  for (const file of ['data.js', 'styles.css']) mappings.set('files/' + name + '/' + file, 'files/原版' + name + '/' + file);
  mappings.set(name + '.html', '原版' + name + '.html');
});
const files = [];
for (const [source, target] of mappings) {
  let text = fs.readFileSync(path.join(root, source), 'utf8');
  for (const [from, to] of mappings) text = text.split(from).join(to);
  text = text.replace(/business\.channel-management\.v1/g, 'business.placement-original.v1');
  if (source.endsWith('.css')) text = text.replace(/url\((["']?)\.\.\/assets\//g, 'url($1../../assets/');
  const pageIndex = pages.findIndex(name => target === 'files/原版' + name + '/data.js');
  if (pageIndex !== -1) {
    let data;
    vm.runInNewContext(text, {$axure: {loadCurrentPage(value) { data = value; }}});
    data.url = '原版' + pages[pageIndex] + '.html';
    data.page.name = '原版' + pages[pageIndex];
    data.page.packageId = 'original_placement_' + (pageIndex + 1);
    text = '$axure.loadCurrentPage(' + JSON.stringify(data, null, 2) + ');\n';
  }
  if (target.endsWith('.html')) text = text.replace(/data-axure-page-id="[^"]*"/, 'data-axure-page-id="original_placement_' + (pages.findIndex(name => target === '原版' + name + '.html') + 1) + '"');
  if (fs.existsSync(path.join(root, target))) throw new Error('Archive target already exists: ' + target);
  fs.mkdirSync(path.dirname(path.join(root, target)), {recursive: true});
  fs.writeFileSync(path.join(root, target), text, 'utf8');
  files.push({source, target, sha256: crypto.createHash('sha256').update(text).digest('hex')});
}
fs.writeFileSync(manifestPath, JSON.stringify({createdAt: new Date().toISOString(), pages: pages.map((name, index) => ({name: '原版' + name, id: 'original_placement_' + (index + 1), url: '原版' + name + '.html'})), files}, null, 2) + '\n', 'utf8');
console.log('Archived original placement pages and isolated assets: ' + files.length + ' files');
