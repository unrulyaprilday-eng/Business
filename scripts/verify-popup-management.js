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

["hasButton", "showSkipToday", "showBackdrop", "systemPopupSection", "contentPopupSection"].forEach((id) => {
  assert(htmlIds.includes(id), `Missing required control: ${id}`);
});
assert((html.match(/value="auto_marketing"/g) || []).length === 2, "Automatic marketing trigger must exist in filter and form");
assert(!/\?{3,}/.test(html + js), "Suspicious question-mark run detected");

console.log(`verified popup management: ${htmlIds.length} ids, ${new Set(jsIdRefs).size} JS references`);
