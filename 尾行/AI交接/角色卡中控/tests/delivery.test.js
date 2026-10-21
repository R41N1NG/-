"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os");
const { publishLatest } = require("../tools/build/delivery");
test("成品交付：仅保留最新卡；旧文件和旧交付目录归档；相同成品不重复归档", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "wx-delivery-"));
  const root = path.join(temp, "尾行/AI交接/角色卡中控");
  try {
    fs.mkdirSync(path.join(root, "dist"), { recursive: true });
    const card = (version) =>
      JSON.stringify({
        spec: "chara_card_v2",
        data: { character_book: { entries: [] }, character_version: version },
      });
    fs.writeFileSync(path.join(root, "dist/尾行.json"), card("1"));
    const first = publishLatest(root);
    assert.equal(first.archive, null);
    assert.deepEqual(fs.readdirSync(path.dirname(first.destination)), [
      "尾行.json",
    ]);
    assert.equal(publishLatest(root).archive, null);
    fs.writeFileSync(
      path.join(path.dirname(first.destination), "old.json"),
      "history",
    );
    fs.mkdirSync(path.join(root, "最新角色卡"));
    fs.writeFileSync(path.join(root, "最新角色卡/旧卡.json"), "legacy");
    fs.writeFileSync(path.join(root, "dist/尾行.json"), card("2"));
    const next = publishLatest(root);
    assert.equal(fs.readFileSync(next.destination, "utf8"), card("2"));
    assert.equal(
      fs.readFileSync(path.join(next.archive, "尾行.json"), "utf8"),
      card("1"),
    );
    assert.equal(
      fs.readFileSync(path.join(next.archive, "old.json"), "utf8"),
      "history",
    );
    assert.equal(
      fs.readFileSync(path.join(next.archive, "旧交付目录/旧卡.json"), "utf8"),
      "legacy",
    );
    assert.deepEqual(fs.readdirSync(path.dirname(next.destination)), [
      "尾行.json",
    ]);
    assert.equal(publishLatest(root).archive, null);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
