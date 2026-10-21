// 创角弹窗的组件规则统一改用 ID 作用域：
// 宿主通用按钮皮里有 `.trpg dialog.wx-dialog button`（0,2,2），
// 单看 `.wx-create-dialog .x`（0,2,0）压不住，必须提到 ID 级（1,2,0）。
const fs = require("node:fs");
const path = require("node:path");
const file = path.join(__dirname, "..", "..", "状态栏.html");
const src = fs.readFileSync(file, "utf8");
const out = src.replace(/\.wx-create-dialog \./g, "#wx-create-dialog .");
if (out === src) { console.error("没有命中"); process.exit(1); }
fs.writeFileSync(file, out, "utf8");
console.log("替换", (src.match(/\.wx-create-dialog \./g) || []).length, "处");
