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

const pageNodes = [
  ["self_game_rtp_config", "自研游戏-RTP配置", "自研游戏-RTP配置.html"],
  ["self_game_slots_config", "自研游戏-SLOTS配置", "自研游戏-SLOTS配置.html"],
  ["self_game_fish_config", "自研游戏-FISH配置", "自研游戏-FISH配置.html"],
  ["self_game_poker_config", "自研游戏-Poker配置", "自研游戏-Poker配置.html"],
  ["self_game_mini_config", "自研游戏-Mini配置", "自研游戏-Mini配置.html"]
].map(([id, pageName, url]) => ({ id, pageName, type: "Wireframe", url, children: [] }));

const documentData = loadDocument(documentPath);
const gameCenter = findNode(documentData.sitemap.rootNodes, "game_center");
if (!gameCenter || !Array.isArray(gameCenter.children)) {
  throw new Error("未找到游戏中心菜单节点 game_center");
}

gameCenter.children = gameCenter.children.filter((node) => node.id !== "self_game_config");

const existingIds = new Set();
(function collect(nodes) {
  nodes.forEach((node) => {
    existingIds.add(node.id);
    if (Array.isArray(node.children)) collect(node.children);
  });
}(documentData.sitemap.rootNodes));

pageNodes.forEach((node) => {
  if (existingIds.has(node.id)) throw new Error(`菜单 id 已存在：${node.id}`);
});

const insertAfter = gameCenter.children.findIndex((node) => node.id === "sub_game_list");
if (insertAfter < 0) throw new Error("游戏中心下未找到子游戏列表节点");

gameCenter.children.splice(insertAfter + 1, 0, {
  id: "self_game_config",
  pageName: "自研游戏配置",
  type: "Folder",
  url: "",
  children: pageNodes
});

fs.writeFileSync(documentPath, `$axure.loadDocument(${JSON.stringify(documentData, null, 2)});\n`, "utf8");
console.log("已新增游戏中心/自研游戏配置菜单目录。");
console.log(pageNodes.map((node) => `- ${node.pageName} (${node.url})`).join("\n"));
