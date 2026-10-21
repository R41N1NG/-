"use strict";
const fs = require("node:fs");
const path = require("node:path");

// 静态契约检查读取源码，不依赖 bundle 的缩进、变量重命名和生成顺序。
function readUISource() {
  const root = path.join(__dirname, "../../src/ui");
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.(js|css|html)$/.test(entry.name)) files.push(file);
    }
  }
  walk(root);
  return files.map((file) => fs.readFileSync(file, "utf8")).join("\n");
}
module.exports = { readUISource };
