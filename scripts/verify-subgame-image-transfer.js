"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const pageName = String.fromCodePoint(0x5b50, 0x6e38, 0x620f, 0x5217, 0x8868);
const pageFile = path.join(__dirname, "..", pageName + ".html");
const pageScript = path.join(__dirname, "..", "custom", "js", pageName + ".js");
const { filenamePart, planImageImport, applyImageImport, saveImageFile } = require(pageScript);

function games() {
  return [
    { id: "wg_3025", vendor: "WG", icon: "old-square", activeIcon: "old-portrait", sort: 1, hot: true, enabled: true, selected: false },
    { id: "wg_3032", vendor: "WG", icon: "untouched-square", activeIcon: "untouched-portrait", selected: true },
    { id: "slot-yellowbat::tigerboom", vendor: "GXgame", icon: "gx-square", activeIcon: "gx-portrait" },
    { id: "wg_3025", vendor: "Other", icon: "other-square", activeIcon: "other-portrait" }
  ];
}
function image(name, extra) {
  return Object.assign({ name, src: "data:image/png;base64,new-image", width: 180, height: 180 }, extra);
}
const original = games();
const files = [
  image("WG/wg_3025.png"),
  image("slot-yellowbat%3A%3Atigerboom.png"),
  image("unknown.png"),
  image("WG/README.txt"),
  image("__MACOSX/._wg_3032.png")
];
const plan = planImageImport(original, files, "WG", "icon");
assert.deepEqual(plan.map(item => item.status), ["ready", "skip", "skip", "skip", "skip"]);
const changed = structuredClone(original);
assert.equal(applyImageImport(changed, plan, "icon"), 1);
assert.deepEqual(changed[0], Object.assign({}, original[0], { icon: files[0].src }));
assert.deepEqual(changed.slice(1), original.slice(1));
assert.deepEqual(planImageImport(original, files, "", "icon").map(item => item.status), Array(5).fill("skip"));

// Bare and percent-escaped IDs work; the selected vendor is always authoritative.
for (const name of ["slot-yellowbat::tigerboom.png", "GXgame/slot-yellowbat%3A%3Atigerboom.png"]) {
  const match = planImageImport(original, [image(name)], "GXgame", "icon");
  assert.equal(match[0].status, "ready");
  assert.equal(match[0].gameIndex, 2);
}
assert.equal(filenamePart("slot-yellowbat::tigerboom"), "slot-yellowbat%3A%3Atigerboom");
assert.equal(filenamePart("a%3Ab"), "a%253Ab");
assert.equal(filenamePart("CON"), "%43ON");
assert.equal(filenamePart("tail."), "tail%2E");
assert.equal(planImageImport(original, [image("Other/wg_3025.png")], "WG", "icon")[0].status, "skip");
assert.equal(planImageImport(original, [image("wrapper/WG/wg_3025.png")], "WG", "icon")[0].status, "ready");
assert.equal(planImageImport(original, [image("exported-images/WG/wg_3025.PNG")], "WG", "icon")[0].gameIndex, 0);
assert.equal(planImageImport(original, [image("exported-images/Other/wg_3025.png")], "WG", "icon")[0].status, "skip");
assert.equal(planImageImport(original, [image("exported-images/GXgame/slot-yellowbat%3A%3Atigerboom.gif")], "GXgame", "icon")[0].gameIndex, 2);
assert.deepEqual(planImageImport(original, [image("images/WG/wg_3025.png"), image("wg_3025.jpg")], "WG", "icon").map(item => item.status), ["skip", "skip"]);

// Duplicates, including a damaged duplicate, cannot pick an arbitrary winner.
for (const second of [image("wg_3025.jpg"), image("wg_3025.gif", { error: "damaged" })]) {
  const duplicate = planImageImport(original, [image("wg_3025.png"), second], "WG", "icon");
  assert.deepEqual(duplicate.map(item => item.status), ["skip", "skip"]);
  const untouched = structuredClone(original);
  assert.equal(applyImageImport(untouched, duplicate, "icon"), 0);
  assert.deepEqual(untouched, original);
}
assert.equal(planImageImport(original, [image("wg_3025.png", { width: 320, height: 427 })], "WG", "icon")[0].status, "skip");
assert.equal(planImageImport(original, [image("wg_3025.png", { src: "" })], "WG", "icon")[0].status, "skip");
assert.equal(planImageImport(original, [image("wg_3025.png", { error: "too large" })], "WG", "icon")[0].status, "skip");

const portrait = image("wg_3025.jpg", { width: 640, height: 854 });
const portraitPlan = planImageImport(original, [portrait], "WG", "activeIcon");
const portraitResult = structuredClone(original);
assert.equal(applyImageImport(portraitResult, portraitPlan, "activeIcon"), 1);
assert.deepEqual(portraitResult[0], Object.assign({}, original[0], { activeIcon: portrait.src }));
assert.deepEqual(portraitResult.slice(1), original.slice(1));
assert.throws(() => applyImageImport(original, plan, "sort"));

// Verify independent single-select dialogs, local assets and current terminology.
const html = fs.readFileSync(pageFile, "utf8");
const script = fs.readFileSync(pageScript, "utf8");
function element(tag, id) {
  const found = html.match(new RegExp('<' + tag + '\\b([^>]*\\bid="' + id + '"[^>]*)>'));
  assert.ok(found, "Missing " + tag + "#" + id);
  return found[1];
}
element("button", "chooseImageExportFolder");
element("span", "imageExportFolderName");
element("button", "chooseGameImageFiles");
const imageInput = element("input", "gameImageFiles");
assert.match(imageInput, /\btype="file"/);
assert.match(imageInput, /\bmultiple\b/);
assert.match(imageInput, /\baccept="\.png,\.jpg,\.jpeg,\.gif"/);
assert.doesNotMatch(html, /\b(?:webkitdirectory|directory)\b|chooseGameImageFolder|individualGameImageFiles/);
assert.doesNotMatch(script, /webkitRelativePath|chooseGameImageFolder|individualGameImageFiles/);
assert.doesNotMatch(html, /zip/i, "Page must not retain ZIP labels or script references");
assert.doesNotMatch(script, /zip/i, "Image transfer must not retain ZIP code");
for (const id of ["exportImageVendor", "importImageVendor"]) {
  const select = html.match(new RegExp('<select\\b([^>]*\\bid="' + id + '"[^>]*)>'));
  assert.ok(select, "Missing vendor select: " + id);
  assert.ok(!/\bmultiple\b/.test(select[1]), "Vendor must be single-select");
}
for (const id of ["imageExportModal", "imageImportModal"]) {
  assert.ok(new RegExp('<div[^>]+id="' + id + '"[^>]*\\bhidden').test(html));
}
assert.ok(!html.includes("激活图标"));
assert.ok(html.includes("方形图") && html.includes("竖版图"));
assert.ok(html.includes('<tbody id="gameRows"><tr>'));
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (/^(?:data:|#)/.test(match[1])) continue;
  assert.ok(!/^(?:https?:|[A-Za-z]:|\/)/.test(match[1]), "Asset must be relative");
  assert.ok(fs.existsSync(path.join(__dirname, "..", match[1])), "Missing asset: " + match[1]);
}
assert.ok(!html.includes("\ufffd"));
assert.ok(!script.includes("\ufffd"));

// A successful export is committed only after close, and touches one named file.
async function verifyFolderWrites() {
  assert.equal(typeof saveImageFile, "function", "Missing saveImageFile export");
  const data = new Uint8Array([137, 80, 78, 71, 0, 255]);
  const unrelated = new Uint8Array([7, 8, 9]);
  const stored = new Map([["keep.png", unrelated], ["target.png", new Uint8Array([1])]]);
  const calls = [];
  let releaseClose;
  const closeGate = new Promise(resolve => { releaseClose = resolve; });
  let pendingData;
  const directory = {
    async getFileHandle(name, options) {
      calls.push(["getFileHandle", name, options]);
      assert.equal(name, "target.png");
      assert.deepEqual(options, { create: true });
      return {
        async createWritable() {
          calls.push(["createWritable"]);
          return {
            async write(value) { calls.push(["write", value]); pendingData = value; },
            async close() { calls.push(["close"]); await closeGate; stored.set(name, pendingData); },
            async abort() { calls.push(["abort"]); }
          };
        }
      };
    }
  };
  let complete = false;
  const saving = saveImageFile(directory, "target.png", data).then(() => { complete = true; });
  // Flush async handle/create/write continuations while keeping close unresolved.
  for (let turn = 0; turn < 8; turn += 1) await Promise.resolve();
  assert.deepEqual(calls, [["getFileHandle", "target.png", { create: true }], ["createWritable"], ["write", data], ["close"]]);
  assert.equal(complete, false, "Export must await close before reporting completion");
  assert.deepEqual(stored.get("target.png"), new Uint8Array([1]));
  releaseClose();
  await saving;
  assert.equal(complete, true);
  assert.strictEqual(stored.get("target.png"), data);
  assert.strictEqual(stored.get("keep.png"), unrelated);
  assert.equal(stored.size, 2);

  const emptyData = new Uint8Array();
  const emptyEvents = [];
  await saveImageFile({ async getFileHandle(name, options) {
    assert.equal(name, "missing-image.png");
    assert.deepEqual(options, { create: true });
    return { async createWritable() { return {
      async write(value) { assert.strictEqual(value, emptyData); emptyEvents.push("write"); },
      async close() { emptyEvents.push("close"); },
      async abort() { assert.fail("Empty files must be valid exports"); }
    }; } };
  } }, "missing-image.png", emptyData);
  assert.deepEqual(emptyEvents, ["write", "close"]);

  for (const failingStep of ["write", "close"]) {
    for (const abortFails of [false, true]) {
      const failure = new Error(failingStep + " failed");
      const events = [];
      const failingDirectory = {
        async getFileHandle(name, options) {
          events.push("getFileHandle");
          assert.equal(name, "target.png");
          assert.deepEqual(options, { create: true });
          return { async createWritable() {
            events.push("createWritable");
            return {
              async write(value) { events.push("write"); assert.strictEqual(value, data); if (failingStep === "write") throw failure; },
              async close() { events.push("close"); throw failure; },
              async abort() { events.push("abort"); if (abortFails) throw new Error("abort failed"); }
            };
          } };
        }
      };
      await assert.rejects(saveImageFile(failingDirectory, "target.png", data), error => error === failure);
      assert.deepEqual(events, failingStep === "write" ? ["getFileHandle", "createWritable", "write", "abort"] : ["getFileHandle", "createWritable", "write", "close", "abort"]);
    }
  }
  const handleFailure = new Error("permission denied");
  let handleCalls = 0;
  await assert.rejects(saveImageFile({ async getFileHandle(name, options) {
    handleCalls += 1;
    assert.equal(name, "target.png");
    assert.deepEqual(options, { create: true });
    throw handleFailure;
  } }, "target.png", data), error => error === handleFailure);
  assert.equal(handleCalls, 1);
}
verifyFolderWrites().then(() => {
  console.log("PASS: single vendor / image files only / filenames / partial overwrite / independent image types / duplicates / unmatched files / awaited folder writes / abort and error preservation / unrelated files untouched / no ZIP / local assets / UTF-8.");
}).catch(error => { console.error(error); process.exitCode = 1; });
