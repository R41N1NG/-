"use strict";
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
require("./build/ui-config.js").generateUIConfig();
const selected = process.argv.slice(2);
const tests = fs
  .readdirSync(path.join(root, "tests"))
  .filter((name) => name.endsWith(".test.js"))
  .sort()
  .filter((name) => !selected.length || selected.includes(name))
  .map((name) => path.join(root, "tests", name));
if (
  selected.some((name) => !tests.some((file) => path.basename(file) === name))
) {
  console.error("测试文件不存在；请传 tests/ 下的 .test.js 文件名");
  process.exit(1);
}
const result = spawnSync(process.execPath, ["--test", ...tests], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, WX_SKIP_SYNC: "1" },
});
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
