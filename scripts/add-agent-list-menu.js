const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = process.cwd();
const documentPath = path.join(root, "data", "document.js");
const source = fs.readFileSync(documentPath, "utf8");
let documentData = null;

vm.runInNewContext(source, {
  $axure: {
    loadDocument(data) {
      documentData = data;
    }
  },
  console
});

if (!documentData || !documentData.sitemap || !Array.isArray(documentData.sitemap.rootNodes)) {
  throw new Error("Unable to parse Axure document sitemap.");
}

const pageName = "\u4ee3\u7406\u5217\u8868";
const url = `${pageName}.html`;
const node = {
  id: "agent_center_list",
  pageName,
  type: "Wireframe",
  url,
  children: []
};

const agentCenter = documentData.sitemap.rootNodes.find((item) => item.id === "agent_center");
if (!agentCenter) {
  throw new Error("agent_center menu node not found.");
}
if (!Array.isArray(agentCenter.children)) {
  agentCenter.children = [];
}

const existingIndex = agentCenter.children.findIndex((item) => (
  item.id === node.id || item.pageName === node.pageName || item.url === node.url
));

if (existingIndex >= 0) {
  agentCenter.children[existingIndex] = {
    ...agentCenter.children[existingIndex],
    ...node,
    children: Array.isArray(agentCenter.children[existingIndex].children)
      ? agentCenter.children[existingIndex].children
      : []
  };
} else {
  agentCenter.children.unshift(node);
}

const output = `$axure.loadDocument(${JSON.stringify(documentData, null, 2)});\n`;
fs.writeFileSync(documentPath, output, "utf8");

console.log(agentCenter.children.map((item) => `${item.id}\t${item.pageName}\t${item.url}`).join("\n"));
