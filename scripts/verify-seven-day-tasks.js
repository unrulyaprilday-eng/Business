const assert = require("assert/strict");
const fs = require("fs");
const vm = require("vm");

const pageName = "\u4e03\u65e5\u798f\u5229";
const source = fs.readFileSync(`custom/js/${pageName}.js`, "utf8");
const marker = "  ready(function () {";
assert.equal(source.split(marker).length, 2);
const instrumented = source.replace(marker,
  "  globalThis.taskRules = { duplicateTaskRows, taskValueError, migrateTaskRows, normalizeFixedRows, validRewardAmount, packValueError, migratePackRows, migrateBindingRows, migrateChallengeAmounts };\n" + marker);
const context = {
  document: { readyState: "loading", addEventListener() {} }
};
vm.runInNewContext(instrumented, context);
const { duplicateTaskRows, taskValueError, migrateTaskRows, normalizeFixedRows, validRewardAmount, packValueError, migratePackRows, migrateBindingRows, migrateChallengeAmounts } = context.taskRules;
const duplicates = (rows) => Array.from(duplicateTaskRows(rows));

assert.deepEqual(duplicates([["wager", "50000", "5000"], ["wager", "50000.00", "5000.00"]]), [0, 1]);
assert.deepEqual(duplicates([
  ["wager", "50000", "5000"],
  ["deposit", "50000", "5000"],
  ["wager", "100000", "5000"],
  ["wager", "50000", "10000"]
]), []);
assert.deepEqual(duplicates([
  ["login", "7", "100"], ["login", "7.0", "100.00"],
  ["invite", "1", "10"], ["login", "7", "100"]
]), [0, 1, 3]);
assert.deepEqual(duplicates([["", "", ""], ["", "", ""]]), []);
assert.deepEqual(duplicates([["deposit", "NaN", "20"], ["deposit", "NaN", "20"]]), []);

for (const row of [
  ["deposit", "0.01", "0"], ["wager", "50000", "5000.00"],
  ["login", "7", "100"], ["invite", "1", "10"]
]) assert.equal(taskValueError(row), "");
for (const row of [
  ["", "1", "10"], ["login", "8", "100"], ["login", "1.5", "100"],
  ["invite", "0", "100"], ["invite", "1.5", "100"], ["wager", "-1", "100"],
  ["deposit", "100", "-1"], ["deposit", "100", "1.001"],
  ["deposit", "1.001", "1"], ["deposit", "", "100"], ["deposit", "1", "Infinity"]
]) assert.notEqual(taskValueError(row), "");

const stored = { modules: {
  tasks: { rows: [["\u6295\u6ce8 Rp 50,000", "Rp 5,000"], ["\u767b\u5f55 7 \u5929", "Rp 10,000"]] },
  checkin: { rows: [["Day 1", "Rp 1,000"]] }
} };
const migrated = migrateTaskRows(stored);
assert.deepEqual(migrated.modules.tasks.rows.map((row) => Array.from(row)), [["wager", "50000", "5000"], ["login", "7", "10000"]]);
assert.deepEqual(migrated.modules.checkin.rows, [["Day 1", "Rp 1,000"]]);
const typedRow = ["deposit", "50000", "5000"];
assert.deepEqual(migrateTaskRows({ modules: { tasks: { rows: [typedRow] } } }).modules.tasks.rows[0], typedRow);

const defaults = { modules: {
  checkin: { rows: Array.from({ length: 7 }, (_, index) => [`Day ${index + 1}`, String(index + 1)]) },
  bindAccount: { rows: [["1000"]] }
} };
const oldRows = { modules: {
  checkin: { rows: [["Day 1", "100"], ["Day 3", "300"], ["Day 8", "800"]] },
  bindAccount: { rows: [["2000", "manual"], ["3000", "extra"]] }
} };
const fixed = normalizeFixedRows(oldRows, defaults);
assert.deepEqual(Array.from(fixed.modules.checkin.rows, (row) => Array.from(row)), [
  ["Day 1", "100"], ["Day 2", "2"], ["Day 3", "300"], ["Day 4", "4"],
  ["Day 5", "5"], ["Day 6", "6"], ["Day 7", "7"]
]);
assert.deepEqual(Array.from(fixed.modules.bindAccount.rows, (row) => Array.from(row)), [["2000"]]);
const emptyFixed = normalizeFixedRows({ modules: { checkin: { rows: [] }, bindAccount: { rows: [] } } }, defaults);
assert.equal(emptyFixed.modules.checkin.rows.length, 7);
assert.deepEqual(Array.from(emptyFixed.modules.bindAccount.rows[0]), ["1000"]);
assert.equal(defaults.modules.checkin.rows[0][1], "1");
const legacyReward = normalizeFixedRows({ modules: {
  checkin: { rows: [["Day 6", "Rp 6,000"], ["Day 7", "\u4fdd\u9669\u7bb1\u793c\u5305"]] },
  bindAccount: { rows: [["1000", "manual"]] }
} }, defaults);
assert.equal(legacyReward.modules.checkin.rows[5][1], "6000");
assert.equal(legacyReward.modules.checkin.rows[6][1], "7");
for (const value of ["0", "7000", "7.01"]) assert.equal(validRewardAmount(value), true);
for (const value of ["", "-1", "1.001", "NaN", "Infinity", "gift"]) assert.equal(validRewardAmount(value), false);

for (const row of [["1000000", "150000"], ["0.01", "0"], ["50000.00", "20000.50"]]) assert.equal(packValueError(row), "");
for (const row of [["0", "100"], ["-1", "100"], ["100", "-1"], ["100", "1.001"], ["", "10"], ["10", "gift"]]) assert.notEqual(packValueError(row), "");
const oldPacks = { modules: {
  activityPack: { enabled: false, rows: [
    ["\u5145\u503c\u793c\u5305", "\u5145\u503c Rp 50,000\uff0c\u8d60 Rp 20,000 + 1 \u5f20\u52a0\u8d60\u5238"],
    ["\u7279\u60e0\u793c\u5305", "\u552e\u4ef7 Rp 1,000,000\uff0c\u989d\u5916\u8d60\u9001 Rp 150,000\uff0815%\uff09"],
    ["100000", "10000"]
  ] },
  checkin: { rows: [["Day 1", "1000"]] }
} };
const numericPacks = migratePackRows(oldPacks);
assert.deepEqual(Array.from(numericPacks.modules.activityPack.rows, (row) => Array.from(row)), [
  ["50000", "20000"], ["1000000", "150000"], ["100000", "10000"]
]);
assert.equal(numericPacks.modules.activityPack.enabled, false);
assert.deepEqual(numericPacks.modules.checkin.rows, [["Day 1", "1000"]]);

const oldBinding = migrateBindingRows({ modules: {
  bindAccount: { enabled: false, settings: ["old condition"], rows: [["Rp 1,234.50 \u6d3b\u52a8\u5956\u91d1", "manual"]] },
  tasks: { rows: [["deposit", "50", "5"]] }
} });
assert.deepEqual(Array.from(oldBinding.modules.bindAccount.rows[0]), ["1234.50"]);
assert.equal(oldBinding.modules.bindAccount.settings.length, 0);
assert.equal(oldBinding.modules.bindAccount.enabled, false);
assert.deepEqual(oldBinding.modules.tasks.rows, [["deposit", "50", "5"]]);
const oldUnlock = migrateChallengeAmounts({ modules: { depositChallenge: { settings: ["\u7d2f\u8ba1\u5145\u503c Rp 100,000"] } } });
assert.equal(oldUnlock.modules.depositChallenge.settings[0], "100000");
const typedUnlock = migrateChallengeAmounts({ modules: { depositChallenge: { settings: ["100000.50"] } } });
assert.equal(typedUnlock.modules.depositChallenge.settings[0], "100000.50");
const oldChallenge = migrateChallengeAmounts({ modules: { depositChallenge: { enabled: false, rows: [
  ["\u6253\u7801 Rp 1,000,000", "Rp 1,000"],
  ["\u7d2f\u8ba1\u6253\u7801 \u2265 2,000,000", "2000"],
  ["5000000.50", "5000.25"]
] } } });
assert.deepEqual(Array.from(oldChallenge.modules.depositChallenge.rows, (row) => Array.from(row)), [
  ["1000000", "1000"], ["2000000", "2000"], ["5000000.50", "5000.25"]
]);
assert.equal(oldChallenge.modules.depositChallenge.enabled, false);

console.log("OK: task duplicates, numeric validation, fixed rewards, pack, binding and recharge config migration");
