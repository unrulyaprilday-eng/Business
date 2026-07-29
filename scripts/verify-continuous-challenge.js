const fs = require("fs");

const fromCodePoints = (...values) => String.fromCodePoint(...values);
const addActivity = fromCodePoints(0x65b0, 0x589e, 0x6d3b, 0x52a8);
const promotionList = fromCodePoints(0x4f18, 0x60e0, 0x6d3b, 0x52a8, 0x5217, 0x8868);
const continuousChallenge = fromCodePoints(0x8fde, 0x7eed, 0x6311, 0x6218);

const files = {
  addHtml: fs.readFileSync(`${addActivity}.html`, "utf8"),
  addJs: fs.readFileSync(`custom/js/${addActivity}.js`, "utf8"),
  addCss: fs.readFileSync(`custom/css/${addActivity}.css`, "utf8"),
  listHtml: fs.readFileSync(`${promotionList}.html`, "utf8"),
  listJs: fs.readFileSync(`custom/js/${promotionList}.js`, "utf8")
};

const checks = [
  ["template option", files.addHtml.includes(`value="${continuousChallenge}"`)],
  ["challenge panel", files.addHtml.includes('id="u6_state5"')],
  ["challenge form", files.addHtml.includes('id="challengeActivityForm"')],
  ["task table fallback rows", (files.addHtml.match(/data-task-type=/g) || []).length >= 3],
  ["no maintenance status", !files.addHtml.includes('name="challengeStatus" value="\u7ef4\u62a4"')],
  ["completion mode", files.addHtml.includes('name="challengeCompletionMode"') && files.addJs.includes("completionMode:")],
  ["sequence and parallel UI", files.addHtml.includes("\u987a\u5e8f\u5b8c\u6210") && files.addHtml.includes("\u5e76\u884c\u5b8c\u6210") && files.addHtml.includes('id="challengeOrderHeader"')],
  ["mixed task rows", files.addHtml.includes("challenge-task-type-select") && files.addHtml.includes('id="challengeAddTask"')],
  ["no duplicate task type picker", !files.addHtml.includes('name="challengeTaskType"') && !files.addHtml.includes('id="challengeFlowPreview"')],
  ["visual ordering", !files.addHtml.includes("challenge-sort") && files.addHtml.includes("data-challenge-move-up") && files.addJs.includes("syncChallengeTaskOrder")],
  ["custom selection controls", files.addCss.includes("appearance: none") && files.addCss.includes("aspect-ratio: 1") && files.addCss.includes("input[type=\"checkbox\"]:checked")],
  ["round radio rendering", files.addCss.includes(".custom-radio-group label::before") && files.addCss.includes("width: 16px") && files.addCss.includes("label:has(input[type=\"radio\"]:checked)::after")],
  ["no condition currency suffix", !files.addHtml.includes('class="challenge-condition-unit">\u5143') && !files.addJs.includes(String.raw`unit: "\u5143"`)],
  ["no tier action", !files.addHtml.includes("data-challenge-add-tier") && !files.addJs.includes("data-challenge-add-tier")],
  ["unified reward panel", files.addHtml.includes('id="challengeUnifiedReward"') && files.addJs.includes("syncChallengeRewardMode")],
  ["unified reward wording", files.addHtml.includes("\u5168\u90e8\u4efb\u52a1\u5b8c\u6210\u540e\u7edf\u4e00\u53d1\u653e")],
  ["template state mapping", files.addJs.includes(String.raw`\u8fde\u7eed\u6311\u6218` + '": 5')],
  ["challenge ready binding", files.addJs.includes("bindChallengeActivity();")],
  ["challenge fixed footer", files.addCss.includes("body.challenge-template-active #u2")],
  ["list filter", files.listHtml.includes(`>${continuousChallenge}</option>`) ],
  ["list insertion target", files.listHtml.includes('id="promoActivityRows"')],
  ["edit action", files.listJs.includes("data-challenge-edit")],
  ["toggle action", files.listJs.includes("data-challenge-toggle")],
  ["delete action", files.listJs.includes("data-challenge-delete")],
  ["encoding", !Object.values(files).some((content) => content.includes("????"))]
];

const failed = checks.filter(([, passed]) => !passed);
checks.forEach(([name, passed]) => console.log(`${passed ? "OK" : "FAIL"}: ${name}`));

if (failed.length) {
  process.exitCode = 1;
}
