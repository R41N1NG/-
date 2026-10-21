// 一次性清账脚本：删掉状态栏.html 里 C5 覆盖层整块（已折回基础规则）。
const fs = require("node:fs");
const path = require("node:path");
const file = path.join(__dirname, "..", "..", "状态栏.html");
const src = fs.readFileSync(file, "utf8");
const START = "/* ═══════════════════════════════════════════════════════════════\n   C5 · 创角向导 & 判定台收编到「夜巡」语言";
const END_MARK = "#wx-settle-dialog .die-shadow { background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 70%) !important; }\n";
const a = src.indexOf(START);
const b = src.indexOf(END_MARK, a);
if (a < 0 || b < 0) { console.error("定位失败", a, b); process.exit(1); }
const cut = src.slice(a, b + END_MARK.length);
if (cut.length > 20000 || cut.length < 5000) { console.error("切除长度异常", cut.length); process.exit(1); }
const out = src.slice(0, a) + src.slice(b + END_MARK.length);
fs.writeFileSync(file, out, "utf8");
console.log("已删除 C5 覆盖层", cut.split("\n").length - 1, "行；文件", src.length, "->", out.length);
