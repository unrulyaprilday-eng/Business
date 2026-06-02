const fs = require("fs");
const vm = require("vm");

let documentData;
vm.runInNewContext(fs.readFileSync("data/document.js", "utf8"), {
  $axure: {
    loadDocument(data) {
      documentData = data;
    }
  }
});

const pageName = "\u4ee3\u7406\u5217\u8868";
const parent = documentData.sitemap.rootNodes.find((item) => item.id === "agent_center");
const node = parent && parent.children.find((item) => item.id === "agent_center_list");

let pageData;
vm.runInNewContext(fs.readFileSync(`files/${pageName}/data.js`, "utf8"), {
  $axure: {
    loadCurrentPage(data) {
      pageData = data;
    }
  }
});

const html = fs.readFileSync(`${pageName}.html`, "utf8");
const css = fs.readFileSync(`custom/css/${pageName}.css`, "utf8");
const js = fs.readFileSync(`custom/js/${pageName}.js`, "utf8");
const values = [
  node && node.pageName,
  node && node.url,
  pageData && pageData.url,
  pageData && pageData.page && pageData.page.packageId,
  pageData && pageData.page && pageData.page.name,
  html,
  css,
  js
];

if (values.some((value) => Array.from(String(value)).some((char) => char.charCodeAt(0) === 0x3f))) {
  throw new Error("Question mark codepoint detected in new page assets.");
}

if (!node || node.pageName !== pageName || node.url !== `${pageName}.html`) {
  throw new Error("Menu node mismatch.");
}

if (pageData.page.packageId !== node.id || pageData.url !== node.url || pageData.page.name !== node.pageName) {
  throw new Error("Page data mismatch.");
}

if (!html.includes("custom/js/axure-custom-page-ready.js") || !html.includes("resources/scripts/axure/ios.js")) {
  throw new Error("Required Axure custom ready or iOS script missing.");
}

if ((html.match(/<tr>/g) || []).length < 13) {
  throw new Error("Fallback table rows missing.");
}

if (!js.includes("DOMContentLoaded") || !js.includes("addEventListener")) {
  throw new Error("Interaction script is missing ready or event binding.");
}

console.log(parent.children.map((item) => `${item.id}\t${item.pageName}\t${item.url}`).join("\n"));
console.log("verified");
