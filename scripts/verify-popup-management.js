const fs = require("fs");
const path = require("path");

const pageName = String.fromCodePoint(0x5f39, 0x7a97, 0x7ba1, 0x7406);
const htmlFile = path.join(process.cwd(), `${pageName}.html`);
const jsFile = path.join(process.cwd(), "custom", "js", `${pageName}.js`);
const html = fs.readFileSync(htmlFile, "utf8");
const js = fs.readFileSync(jsFile, "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const htmlIds = Array.from(html.matchAll(/\sid="([^"]+)"/g), (match) => match[1]);
const duplicateIds = htmlIds.filter((id, index) => htmlIds.indexOf(id) !== index);
const jsIdRefs = Array.from(js.matchAll(/getElementById\("([^"]+)"\)/g), (match) => match[1]);
const missingIds = Array.from(new Set(jsIdRefs)).filter((id) => !htmlIds.includes(id));
const removedFields = [
  "sessionCap",
  "dailyCap",
  "popupCooldown",
  "name=\"weekday\"",
  "\u5c55\u793a\u63a7\u5236",
  "\u5c55\u793a\u661f\u671f",
  "\u73a9\u5bb6\u51b7\u5374\u65f6\u95f4",
  "\u6bcf\u65e5\u6700\u591a\u5c55\u793a",
  "\u6bcf\u4f1a\u8bdd\u6700\u591a\u5c55\u793a"
];

assert(duplicateIds.length === 0, `Duplicate HTML ids: ${duplicateIds.join(", ")}`);
assert(missingIds.length === 0, `Missing DOM ids referenced by JS: ${missingIds.join(", ")}`);
removedFields.forEach((value) => {
  assert(!html.includes(value) && !js.includes(value), `Removed display-control field remains: ${value}`);
});

["hasButton", "showSkipToday", "showBackdrop", "systemPopupSection", "contentPopupSection", "imageList", "addImageBtn"].forEach((id) => {
  assert(htmlIds.includes(id), `Missing required control: ${id}`);
});
assert(htmlIds.includes("pageDescriptionTitle"), "Missing page description");
assert(html.includes("设置为“自动营销触发”时") && html.includes("是否达到弹窗侧的展示上限"), "Automatic-marketing decision notes are incomplete");
const baseSectionIndex = html.indexOf('class="form-section base-section"');
const triggerSectionIndex = html.indexOf('class="form-section trigger-section"');
const contentSectionIndex = html.indexOf('class="form-section content-section"');
const effectiveSectionIndex = html.indexOf('class="form-section effective-section"');
assert(baseSectionIndex < triggerSectionIndex && triggerSectionIndex < contentSectionIndex && contentSectionIndex < effectiveSectionIndex, "Popup form sections are not in the required configuration order");
assert(contentSectionIndex < html.indexOf('name="contentMode"'), "Popup type selector must be inside content configuration");
assert(html.includes('class="content-mode-options"') && !html.includes('class="segmented-control"'), "Popup type must use visible radio controls");
assert((html.match(/value="auto_marketing"/g) || []).length === 2, "Automatic marketing trigger must exist in filter and form");
assert(js.includes("imageActionType' + index") && js.includes('value="\\u76f4\\u5145"'), "Per-image direct-charge action is missing");
assert(js.includes("popupActionTemplate(block, index)"), "Each image must render its own click-target editor");
assert(js.includes("imageBlocks: cloneBlocks(state.imageBlocks)"), "Per-image click targets must be persisted");
assert(html.includes('custom/js/direct-charge-activity-store.js'), "Direct-charge activity store must load before popup management");
assert(js.includes("data-direct-charge-activity") && js.includes("directChargeActivityId"), "Per-image direct-charge activity selector is missing");
assert(js.includes("\\u6e20\\u9053") && js.includes("\\u5956\\u52b1\\u7c7b\\u578b") && js.includes("\\u8d60\\u9001\\u91d1\\u989d"), "Direct-charge read-only activity details are incomplete");
assert(!js.includes("data-recharge-amount") && !js.includes("data-reward-amount"), "Popup management must not edit template-owned direct-charge amounts");
assert(!htmlIds.includes("trackingBtn") && !htmlIds.includes("popupTrackingModal"), "Delivery records must not appear on popup management");
assert(!htmlIds.includes("actionEditor") && !js.includes("state.popupAction"), "A global click-target editor must not replace per-image targets");
assert(!/\?{3,}/.test(html + js), "Suspicious question-mark run detected");

console.log(`verified popup management: ${htmlIds.length} ids, ${new Set(jsIdRefs).size} JS references`);
