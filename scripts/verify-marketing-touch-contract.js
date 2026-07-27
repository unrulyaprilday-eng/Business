const fs = require("fs");

const templatePage = String.fromCodePoint(0x8425, 0x9500, 0x6a21, 0x677f, 0x7ba1, 0x7406) + ".html";
const popupPage = String.fromCodePoint(0x5f39, 0x7a97, 0x7ba1, 0x7406) + ".html";
const planPage = String.fromCodePoint(0x81ea, 0x52a8, 0x7b56, 0x7565, 0x914d, 0x7f6e) + ".html";

const templateHtml = fs.readFileSync(templatePage, "utf8");
const templateRows = [...templateHtml.matchAll(/<tr data-template-row[\s\S]*?<\/tr>/g)].map((match) => match[0]);
const invalidCellRows = templateRows.filter((row) => (row.match(/<td\b/g) || []).length !== 9);
const missingTouchRows = templateRows.filter((row) => !/data-touch="[^"]+"/.test(row) || !/data-template-touch/.test(row));
const templateTouchValues = [...new Set(templateRows.map((row) => (row.match(/data-touch="([^"]+)"/) || [])[1]))];
const touchSelectBlock = (templateHtml.match(/<select class="cl-select" id="templateTouchTiming">([\s\S]*?)<\/select>/) || [])[1] || "";
const touchOptions = [...touchSelectBlock.matchAll(/<option>([^<]+)<\/option>/g)].map((match) => match[1]);

const popupHtml = fs.readFileSync(popupPage, "utf8");
const filterTriggerBlock = (popupHtml.match(/<select class="cl-select" id="popupTrigger">([\s\S]*?)<\/select>/) || [])[1] || "";
const triggerBlock = (popupHtml.match(/<select id="formTrigger">([\s\S]*?)<\/select>/) || [])[1] || "";
const filterTriggerCodes = [...filterTriggerBlock.matchAll(/<option value="([^"]+)"/g)]
  .map((match) => match[1])
  .filter(Boolean);
const triggerCodes = [...triggerBlock.matchAll(/<option value="([^"]+)"/g)].map((match) => match[1]);
const expectedTriggerCodes = [
  "register_success",
  "login_success",
  "guest_visit",
  "daily_first_login",
  "low_balance",
  "withdraw_success",
  "repeat_recharge_success",
  "game_pre_enter",
  "lobby_return",
  "register_closed",
  "first_recharge_success",
];
const genericMarketingTrigger = String.fromCodePoint(0x8425, 0x9500, 0x65b9, 0x6848, 0x89e6, 0x53d1);

const planHtml = fs.readFileSync(planPage, "utf8");
const checks = {
  templateRows: templateRows.length === 30,
  templateColumns: invalidCellRows.length === 0,
  templateTouchPolicy: missingTouchRows.length === 0,
  fourTouchPolicies: touchOptions.length === 4 && templateTouchValues.length === 4 && templateTouchValues.every((value) => touchOptions.includes(value)),
  popupTriggerCodes: JSON.stringify(triggerCodes) === JSON.stringify(expectedTriggerCodes) && JSON.stringify(filterTriggerCodes) === JSON.stringify(expectedTriggerCodes),
  noGenericMarketingTrigger: !popupHtml.includes(genericMarketingTrigger),
  popupBaselineReadonly: /id="popupBaseRule"[^>]*readonly/.test(planHtml),
  onePlanExtraLimit: (planHtml.match(/id="planExtraLimit"/g) || []).length === 1,
};

Object.entries(checks).forEach(([name, passed]) => {
  console.log(`${passed ? "OK" : "FAIL"} ${name}`);
});

if (Object.values(checks).some((passed) => !passed)) {
  process.exitCode = 1;
}
