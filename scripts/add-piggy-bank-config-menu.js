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
  }
});

if (!documentData || !documentData.sitemap || !Array.isArray(documentData.sitemap.rootNodes)) {
  throw new Error("Unable to parse Axure document sitemap.");
}

const pageName = "PIGGY BANK\u914d\u7f6e";
const node = {
  id: "piggy_bank_config",
  pageName,
  type: "Wireframe",
  url: `${pageName}.html`,
  children: []
};

const activityMenu = documentData.sitemap.rootNodes.find((item) => item.id === "promotion_activity");
if (!activityMenu || !Array.isArray(activityMenu.children)) {
  throw new Error("promotion_activity menu node not found.");
}

const existingIndex = activityMenu.children.findIndex((item) => (
  item.id === node.id || item.pageName === node.pageName || item.url === node.url
));

let configNode;
if (existingIndex >= 0) {
  activityMenu.children[existingIndex] = {
    ...activityMenu.children[existingIndex],
    ...node,
    children: Array.isArray(activityMenu.children[existingIndex].children)
      ? activityMenu.children[existingIndex].children
      : []
  };
  configNode = activityMenu.children[existingIndex];
} else {
  const recordsIndex = activityMenu.children.findIndex((item) => item.id === "piggy_bank_records");
  const insertAt = recordsIndex >= 0 ? recordsIndex : activityMenu.children.length;
  activityMenu.children.splice(insertAt, 0, node);
  configNode = activityMenu.children[insertAt];
}

const recordsIndex = activityMenu.children.findIndex((item) => item.id === "piggy_bank_records");
if (recordsIndex >= 0) {
  const recordsNode = activityMenu.children.splice(recordsIndex, 1)[0];
  const nestedRecordsIndex = configNode.children.findIndex((item) => item.id === "piggy_bank_records");
  if (nestedRecordsIndex >= 0) {
    configNode.children[nestedRecordsIndex] = recordsNode;
  } else {
    configNode.children.push(recordsNode);
  }
}

fs.writeFileSync(documentPath, `$axure.loadDocument(${JSON.stringify(documentData, null, 2)});\n`, "utf8");
console.log(`${configNode.id}\t${configNode.url}\tchildren=${configNode.children.map((item) => item.id).join(",")}`);
