"use strict";
// build-runtime.js - 尾行引擎构建：esbuild 把引擎 bundle 成浏览器单文件 dist/runtime.js
// （酒馆助手脚本条目=纯 JS 单文件，产物直接粘进「角色卡脚本」类别）
// 与 build.js（世界书构建，基米线）互不干扰：本脚本只管引擎，产物文件名不重叠。
// 断言闸门：产物必须含引擎关键符号且语法可解析，缺一拒交。
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ESBUILD = path.join(__dirname, "tools", "esbuild.exe");
const ENTRY = path.join(__dirname, "src", "host", "bootstrap.js");
const OUT = path.join(__dirname, "dist", "runtime.js");

fs.mkdirSync(path.join(__dirname, "dist"), { recursive: true });
execFileSync(ESBUILD, [
  ENTRY, "--bundle", "--format=iife",
  "--outfile=" + OUT,
  "--target=es2020",
  "--legal-comments=none",
  "--log-level=warning",
], { stdio: "inherit" });

const text = fs.readFileSync(OUT, "utf8");
for (const must of ["createGame", "processFloor", "nightFall", "WxEngine", "loadLexicon", "lifepack"]) {
  if (!text.includes(must)) throw Error("构建断言失败：产物缺少 " + must);
}
new vm.Script(text);   // 语法校验（与浏览器执行等价的可解析性检查）
console.log("dist/runtime.js 构建通过：" + (text.length / 1024).toFixed(1) + " KB");
