const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const documentPath = path.join(__dirname, "..", "data", "document.js");
let documentData;
vm.runInNewContext(fs.readFileSync(documentPath, "utf8"), {
  $axure: { loadDocument(data) { documentData = data; } }
});

const parent = documentData.sitemap.rootNodes.find((node) => node.id === "user_management");
const index = parent?.children?.findIndex((node) => node.id === "user_all_members");
if (index == null || index < 0) throw new Error("user_management / user_all_members not found");
const id = "player_credit_score";
const pageName = "玩家信誉分";
const url = pageName + ".html";
function matchingNodes(nodes) {
  return nodes.flatMap((node) => [
    ...(node.id === id || node.url === url ? [node] : []), ...matchingNodes(node.children || [])
  ]);
}
const matches = matchingNodes(documentData.sitemap.rootNodes);
if (matches.length === 1 && parent.children[index + 1] === matches[0] && matches[0].id === id && matches[0].url === url) {
  console.log(`${id} already follows user_all_members`);
} else {
  if (matches.length) throw new Error(`Conflicting menu entry: ${id}`);
  parent.children.splice(index + 1, 0, { id, pageName, type: "Wireframe", url, children: [] });
  fs.writeFileSync(documentPath, `$axure.loadDocument(${JSON.stringify(documentData, null, 2)});\n`, "utf8");
  console.log(`${id} added after user_all_members`);
}
