const fs = require("fs");
const path = require("path");

let documentData;
let currentPage;

global.$axure = {
  loadDocument(data) {
    documentData = data;
  },
  loadCurrentPage(data) {
    currentPage = data;
  }
};

require(path.resolve("data/document.js"));

const root = documentData.sitemap.rootNodes.find(
  (node) => node.id === "intelligent_marketing_solution"
);

if (!root) {
  throw new Error("Intelligent marketing menu root is missing.");
}

let checkedPages = 0;

function verifyNode(node, depth) {
  const indent = "  ".repeat(depth);
  if (node.pageName.includes("?")) {
    throw new Error(`Menu name contains a replacement question mark: ${node.id}`);
  }
  console.log([indent + node.pageName, node.id, node.url || "[folder]"].join("\t"));

  if (node.url) {
    const htmlPath = path.resolve(node.url);
    const pageBaseName = path.basename(node.url, ".html");
    const dataPath = path.resolve("files", pageBaseName, "data.js");

    if (!fs.existsSync(htmlPath)) {
      throw new Error(`HTML file is missing: ${node.url}`);
    }
    if (!fs.existsSync(dataPath)) {
      throw new Error(`Page data is missing: ${dataPath}`);
    }

    currentPage = undefined;
    delete require.cache[require.resolve(dataPath)];
    require(dataPath);

    if (!currentPage) {
      throw new Error(`Page data did not load: ${dataPath}`);
    }
    if (currentPage.page.packageId !== node.id) {
      throw new Error(`Menu and package ID differ: ${node.pageName}`);
    }
    if (currentPage.url !== node.url) {
      throw new Error(`Menu and page URL differ: ${node.pageName}`);
    }
    if (currentPage.page.name !== node.pageName) {
      throw new Error(`Menu and page name differ: ${node.pageName}`);
    }

    checkedPages += 1;
  }

  (node.children || []).forEach((child) => verifyNode(child, depth + 1));
}

verifyNode(root, 0);
console.log(`checked pages: ${checkedPages}`);
