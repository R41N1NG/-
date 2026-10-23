"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
function trainingShotHash(root) {
  const hash = crypto.createHash("sha256");
  const scan = (dir) => {
    for (const e of fs
      .readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, e.name);
      if (e.isDirectory()) scan(file);
      else {
        hash.update(path.relative(root, file));
        hash.update(fs.readFileSync(file));
      }
    }
  };
  // 正式 UI 与案例规则变化都必须重拍，课件自身排版不影响截图来源。
  for (const dir of [
    "src/runtime",
    "src/config",
    "src/ui/renderers",
    "src/ui/map",
    "src/ui/settlement",
  ])
    scan(path.join(root, dir));
  for (const file of [
    "src/ui/statusbar.js",
    "src/ui/template.html",
    "src/ui/styles/statusbar.css",
    "src/ui/styles/city-map.css",
    "tools/build/training-sample.js",
  ]) {
    hash.update(file);
    hash.update(fs.readFileSync(path.join(root, file)));
  }
  return hash.digest("hex");
}
module.exports = { trainingShotHash };
