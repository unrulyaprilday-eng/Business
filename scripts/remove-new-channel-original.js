const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const manifestPath = path.join(__dirname, 'placement-original-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const page = manifest.pages.find(item => item.name === '原版新渠道管理' && item.id === 'original_placement_0');
if (page && page.url !== '原版新渠道管理.html') throw new Error('Expected archived new channel page changed');
const targets = new Set([
  '原版新渠道管理.html',
  'files/原版新渠道管理/data.js',
  'files/原版新渠道管理/styles.css',
  'custom/css/placement-original/新渠道管理.css',
  'custom/js/placement-original/新渠道管理.js',
  'custom/js/placement-original/channel-management-packages.js',
  'custom/js/placement-original/channel-management-reports.js'
]);
const entries = manifest.files.filter(file => targets.has(file.target));
for (const other of manifest.files.filter(file => !targets.has(file.target) && file.target.endsWith('.html'))) {
  const content = fs.readFileSync(path.join(root, other.target), 'utf8');
  if (entries.some(entry => content.includes(entry.target))) throw new Error('Another original page references a target; no files removed');
}
for (const entry of entries) {
  const content = fs.readFileSync(path.join(root, entry.target));
  if (crypto.createHash('sha256').update(content).digest('hex') !== entry.sha256) throw new Error('Archived file was modified; no files removed: ' + entry.target);
}
for (const entry of entries) fs.unlinkSync(path.join(root, entry.target));
for (const directory of ['files/原版新渠道管理', 'custom/css/placement-original', 'custom/js/placement-original']) {
  const absolute = path.join(root, directory);
  if (fs.existsSync(absolute) && fs.readdirSync(absolute).length === 0) fs.rmdirSync(absolute);
}
manifest.pages = manifest.pages.filter(item => item !== page);
manifest.files = manifest.files.filter(item => !targets.has(item.target));
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log('Removed ' + entries.length + ' verified files belonging only to the archived new channel page.');
