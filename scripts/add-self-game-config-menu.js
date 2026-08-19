const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const documentPath = path.join(rootDir, "data", "document.js");

function loadDocument(filePath) {
  let loaded = null;
  let source = fs.readFileSync(filePath, "utf8");
  if (/^\s*\.loadDocument\s*\(/.test(source)) {
    source = source.replace(/^\s*\.loadDocument\s*\(/, "$axure.loadDocument(");
  }
  new Function("$axure", source)({
    loadDocument(data) {
      loaded = data;
    }
  });
  if (!loaded || !loaded.sitemap || !Array.isArray(loaded.sitemap.rootNodes)) {
    throw new Error("data/document.js 中没有读取到有效的 sitemap.rootNodes");
  }
  return loaded;
}

function findNode(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (Array.isArray(node.children)) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

const pageNode = { id: "self_game_config", pageName: "自研游戏配置", type: "Wireframe", url: "自研游戏配置.html", children: [] };

const documentData = loadDocument(documentPath);
const gameCenter = findNode(documentData.sitemap.rootNodes, "game_center");
if (!gameCenter || !Array.isArray(gameCenter.children)) {
  throw new Error("未找到游戏中心菜单节点 game_center");
}

gameCenter.children = gameCenter.children.filter((node) => !["self_game_config", "self_game_config_page", "self_game_rtp_config", "self_game_slots_config", "self_game_fish_config", "self_game_poker_config", "self_game_mini_config"].includes(node.id));

const existingIds = new Set();
(function collect(nodes) {
  nodes.forEach((node) => {
    existingIds.add(node.id);
    if (Array.isArray(node.children)) collect(node.children);
  });
}(documentData.sitemap.rootNodes));

if (existingIds.has(pageNode.id)) throw new Error(`菜单 id 已存在：${pageNode.id}`);

const insertAfter = gameCenter.children.findIndex((node) => node.id === "sub_game_list");
if (insertAfter < 0) throw new Error("游戏中心下未找到子游戏列表节点");

gameCenter.children.splice(insertAfter + 1, 0, pageNode);

fs.writeFileSync(documentPath, `$axure.loadDocument(${JSON.stringify(documentData, null, 2)});\n`, "utf8");
console.log("已更新游戏中心/自研游戏配置菜单目录。");
console.log(`- ${pageNode.pageName} (${pageNode.url})`);
