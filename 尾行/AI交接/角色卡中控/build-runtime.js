"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const esbuild = require("esbuild");

/** 跨平台编译；验证成功后才写产物。供 CLI 与卡片构建重复调用。 */
function buildRuntime() {
  const result = esbuild.buildSync({
    entryPoints: [path.join(__dirname, "src/host/bootstrap.js")],
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "es2020",
    legalComments: "none",
    logLevel: "warning",
    write: false,
  });
  const text = result.outputFiles[0].text;
  for (const must of [
    "createGame",
    "processFloor",
    "nightFall",
    "WxEngine",
    "loadLexicon",
    "lifepack",
  ]) {
    if (!text.includes(must)) throw Error("构建断言失败：产物缺少 " + must);
  }
  new vm.Script(text);
  fs.mkdirSync(path.join(__dirname, "dist"), { recursive: true });
  fs.writeFileSync(path.join(__dirname, "dist/runtime.js"), text, "utf8");
  console.log(
    "dist/runtime.js 构建通过：" + (text.length / 1024).toFixed(1) + " KB",
  );
  return text;
}

if (require.main === module) buildRuntime();
module.exports = { buildRuntime };
