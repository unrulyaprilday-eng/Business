const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");

function fromCp(values) {
  return values.map((value) => String.fromCodePoint(value)).join("");
}

const oldName = fromCp([0x7ad9, 0x70b9, 0x914d, 0x7f6e]);
const newName = fromCp([0x7ad9, 0x70b9, 0x5e94, 0x7528, 0x914d, 0x7f6e]);
const parentId = "site_config";
const pageId = "page_settings";

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function loadDocument() {
  let loaded;
  vm.runInNewContext(read(path.join("data", "document.js")), {
    $axure: {
      loadDocument(value) {
        loaded = value;
      }
    }
  });
  return loaded;
}

function fail(message) {
  throw new Error(message);
}

const doc = loadDocument();
const parent = doc.sitemap.rootNodes.find((node) => node.id === parentId);
if (!parent) fail("Missing site_config parent node");
if (parent.pageName !== oldName) {
  fail(`Parent menu should remain ${oldName}, found ${parent.pageName}`);
}

const page = (parent.children || []).find((node) => node.id === pageId);
if (!page) fail("Missing page_settings child node");
if (page.pageName !== newName) fail(`Child pageName mismatch: ${page.pageName}`);
if (page.url !== `${newName}.html`) fail(`Child url mismatch: ${page.url}`);

const pageDataText = read(path.join("files", newName, "data.js"));
let pageData;
vm.runInNewContext(pageDataText, {
  $axure: {
    loadCurrentPage(value) {
      pageData = value;
    }
  }
});
if (!pageData) fail("Unable to load page data");
if (pageData.url !== `${newName}.html`) fail(`Page data url mismatch: ${pageData.url}`);
if (pageData.page.packageId !== pageId) fail(`Package id mismatch: ${pageData.page.packageId}`);
if (pageData.page.name !== newName) fail(`Page data name mismatch: ${pageData.page.name}`);

const required = [
  `${newName}.html`,
  path.join("files", newName, "data.js"),
  path.join("files", newName, "styles.css"),
  path.join("custom", "css", `${newName}.css`),
  path.join("custom", "js", `${newName}.js`)
];
for (const file of required) {
  if (!exists(file)) fail(`Missing required file: ${file}`);
}

const html = read(`${newName}.html`);
const htmlNeedles = [
  `<title>${newName}</title>`,
  `files/${newName}/styles.css`,
  `custom/css/${newName}.css`,
  `files/${newName}/data.js`,
  `custom/js/${newName}.js`
];
for (const needle of htmlNeedles) {
  if (!html.includes(needle)) fail(`HTML missing reference: ${needle}`);
}

const staleNeedles = [
  `${oldName}.html`,
  `files/${oldName}`,
  `custom/css/${oldName}.css`,
  `custom/js/${oldName}.js`
];
const checkedFiles = [
  path.join("data", "document.js"),
  `${newName}.html`,
  path.join("files", newName, "data.js"),
  path.join("custom", "component-library", "component-map.json"),
  path.join("scripts", "refine_manual_page_notes.py")
];
for (const file of checkedFiles) {
  const text = read(file);
  for (const needle of staleNeedles) {
    if (text.includes(needle)) fail(`Stale reference ${needle} in ${file}`);
  }
  if (/\?{3,}/.test(text)) fail(`Suspicious question marks in ${file}`);
}

console.log(JSON.stringify({
  parent: { id: parent.id, pageName: parent.pageName, url: parent.url },
  page: { id: page.id, pageName: page.pageName, url: page.url },
  pageData: {
    packageId: pageData.page.packageId,
    name: pageData.page.name,
    url: pageData.url
  }
}, null, 2));
