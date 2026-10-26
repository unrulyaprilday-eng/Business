const fs = require("fs");
const path = require("path");
const assert = require("assert");

const documentPath = path.resolve(__dirname, "../data/document.js");
const folderId = "independent_rules";
const pageId = "independent_vip_settings";
const folderName = "\u72ec\u7acb\u89c4\u5219";
const pageName = "VIP\u8bbe\u7f6e";
const pageUrl = "\u72ec\u7acb\u89c4\u5219VIP\u8bbe\u7f6e.html";

function readDocument() {
  let result;
  const source = fs.readFileSync(documentPath, "utf8");
  assert(/^\s*\$axure\.loadDocument\s*\(/.test(source), "Expected Axure document wrapper");
  new Function("$axure", source)({ loadDocument(value) { result = value; } });
  assert(Array.isArray(result?.sitemap?.rootNodes), "Missing sitemap rootNodes");
  return result;
}

function collect(nodes, parentId = null, out = []) {
  for (const node of nodes) {
    out.push({ node, parentId });
    collect(node.children || [], node.id, out);
  }
  return out;
}

function withoutRoots(document) {
  const copy = JSON.parse(JSON.stringify(document));
  delete copy.sitemap.rootNodes;
  return copy;
}

const before = readDocument();
const document = JSON.parse(JSON.stringify(before));
const roots = document.sitemap.rootNodes;
const all = collect(roots);
const folders = all.filter(({ node }) => node.id === folderId);
const pages = all.filter(({ node }) => node.id === pageId || node.url === pageUrl);
assert(folders.length <= 1 && pages.length <= 1, "Duplicate target node");

if (!folders.length) {
  assert(!pages.length, "Target page exists outside expected folder");
  roots.push({
    id: folderId, pageName: folderName, type: "Folder", url: "",
    children: [{ id: pageId, pageName, type: "Wireframe", url: pageUrl, children: [] }]
  });
} else {
  const folder = folders[0];
  assert(folder.parentId === null, "Target folder must be top-level");
  assert(folder.node.pageName === folderName && folder.node.type === "Folder", "Unexpected existing folder");
  if (!pages.length) {
    folder.node.children.push({ id: pageId, pageName, type: "Wireframe", url: pageUrl, children: [] });
  } else {
    assert(pages[0].parentId === folderId, "Unexpected existing page parent");
    assert(pages[0].node.id === pageId && pages[0].node.pageName === pageName && pages[0].node.url === pageUrl, "Unexpected existing page contract");
  }
}

assert.deepStrictEqual(withoutRoots(document), withoutRoots(before), "Non-menu data changed");
const originalNodes = collect(before.sitemap.rootNodes).filter(({ node }) => node.id !== folderId && node.id !== pageId);
const currentNodes = collect(roots).filter(({ node }) => node.id !== folderId && node.id !== pageId);
assert.deepStrictEqual(currentNodes, originalNodes, "Existing menu changed");
if (JSON.stringify(document) !== JSON.stringify(before)) {
  fs.writeFileSync(documentPath, `$axure.loadDocument(${JSON.stringify(document, null, 2)});\n`, "utf8");
}

const verified = readDocument();
const verifiedNodes = collect(verified.sitemap.rootNodes);
const verifiedFolder = verifiedNodes.filter(({ node }) => node.id === folderId);
const verifiedPage = verifiedNodes.filter(({ node }) => node.id === pageId || node.url === pageUrl);
assert(verifiedFolder.length === 1 && verifiedFolder[0].parentId === null, "Folder validation failed");
assert(verifiedPage.length === 1 && verifiedPage[0].parentId === folderId, "Page validation failed");
assert(verifiedFolder[0].node.pageName === folderName && verifiedPage[0].node.pageName === pageName, "Unicode name validation failed");
assert(!/[?\ufffd]/.test(verifiedFolder[0].node.pageName + verifiedPage[0].node.pageName + verifiedPage[0].node.url), "Invalid menu code points");
assert.deepStrictEqual(withoutRoots(verified), withoutRoots(before));
console.log(JSON.stringify({ folderId, pageId, topLevel: true, addedNodes: collect(roots).length - all.length, existingMenuPreserved: true, nonMenuDataPreserved: true, unicodeValid: true }));
