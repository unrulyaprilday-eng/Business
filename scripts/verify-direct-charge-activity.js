const fs = require("fs");
const path = require("path");
const vm = require("vm");

const pageName = String.fromCodePoint(0x76f4, 0x5145, 0x6d3b, 0x52a8, 0x914d, 0x7f6e);
const rootDir = process.cwd();
const html = fs.readFileSync(path.join(rootDir, `${pageName}.html`), "utf8");
const js = fs.readFileSync(path.join(rootDir, "custom", "js", `${pageName}.js`), "utf8");
const store = fs.readFileSync(path.join(rootDir, "custom", "js", "direct-charge-activity-store.js"), "utf8");
const popupJs = fs.readFileSync(path.join(rootDir, "custom", "js", `${String.fromCodePoint(0x5f39, 0x7a97, 0x7ba1, 0x7406)}.js`), "utf8");
const pageDataSource = fs.readFileSync(path.join(rootDir, "files", pageName, "data.js"), "utf8");
const documentSource = fs.readFileSync(path.join(rootDir, "data", "document.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const htmlIds = Array.from(html.matchAll(/\sid="([^"]+)"/g), (match) => match[1]);
const duplicateIds = htmlIds.filter((id, index) => htmlIds.indexOf(id) !== index);
const jsIdRefs = Array.from(js.matchAll(/getElementById\("([^"]+)"\)/g), (match) => match[1]);
const missingIds = Array.from(new Set(jsIdRefs)).filter((id) => !htmlIds.includes(id));
let pageData = null;
let documentData = null;
vm.runInNewContext(pageDataSource, { $axure: { loadCurrentPage(data) { pageData = data; } }, Date });
vm.runInNewContext(documentSource, { $axure: { loadDocument(data) { documentData = data; } } });

function findNode(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findNode(node.children || [], id);
    if (child) return child;
  }
  return null;
}

const packageId = "operation_direct_charge_activity_config";
const menuNode = findNode(documentData.sitemap.rootNodes, packageId);

assert(duplicateIds.length === 0, `Duplicate HTML ids: ${duplicateIds.join(", ")}`);
assert(missingIds.length === 0, `Missing DOM ids referenced by JS: ${missingIds.join(", ")}`);
assert([...pageName].map((char) => char.codePointAt(0)).join(",") === "30452,20805,27963,21160,37197,32622", "Page-name codepoints are invalid");
assert(menuNode && menuNode.pageName === pageName && menuNode.url === `${pageName}.html`, "Sitemap node is missing or misaligned");
assert(pageData && pageData.url === `${pageName}.html` && pageData.page.packageId === packageId && pageData.page.name === pageName, "Axure page data is misaligned");
assert(html.includes('id="base" class=""'), "Axure #base shell is invalid");
assert(html.includes("custom/component-library/css/tokens.css") && html.includes("custom/component-library/css/components.css"), "Component-library styles are missing");
assert(html.includes('id="fixedAmountField"') && html.includes('id="customAmountField"'), "Fixed/custom amount controls are incomplete");
assert(html.includes('id="activityModal" hidden') && html.includes('id="deleteModal" hidden'), "Modal layers must default to hidden");
assert((html.match(/<tr>/g) || []).length >= 4, "Static fallback activity rows are missing");
assert(js.includes("DOMContentLoaded") && js.includes("if (!store || !rowsEl"), "DOM-ready initialization or key DOM guard is missing");
assert(js.includes('channel.amountMode === "fixed"') && js.includes("renderAmountControl"), "Channel amount-mode switching is missing");
assert(js.includes("activity.name.toLowerCase() === name.toLowerCase()"), "Unique activity-name validation is missing");
assert(store.includes("localStorage") && store.includes("getEnabled") && store.includes("getChannel"), "Shared activity store contract is incomplete");
assert(popupJs.includes("DirectChargeActivityStore") && popupJs.includes("data-direct-charge-activity"), "Popup management is not connected to activity templates");
assert(!popupJs.includes("data-recharge-amount") && !popupJs.includes("data-reward-amount"), "Popup management still contains editable amount controls");
assert(!/\?{3,}/.test(html + js + store), "Suspicious question-mark run detected");

console.log(`verified direct-charge activity config: ${htmlIds.length} ids, ${new Set(jsIdRefs).size} JS references`);
