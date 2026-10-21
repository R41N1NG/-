// 把 C5 段里的创角向导选择器从类前缀升级为 ID 前缀（#wx-create-dialog），
// 以压过 dialog.wx-dialog button 这类组合选择器的 !important。只改 C5 段，不动历史规则。
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, "..", "..", "状态栏.html");
const src = readFileSync(file, "utf8");

const marker = "C5 · 创角向导";
const at = src.indexOf(marker);
if (at < 0) { console.error("找不到 C5 段"); process.exit(1); }

const head = src.slice(0, at);
const tail = src.slice(at).replaceAll(".wx-create-dialog ", "#wx-create-dialog ");
// 兜底：段内若还有不带前导点的 .wx-create-dialog（比如单独成条），也一并换掉
const tail2 = tail.replaceAll(".wx-create-dialog{", "#wx-create-dialog{");

writeFileSync(file, head + tail2, "utf8");
console.log("C5 段前缀已升级，替换次数 =", (src.slice(at).match(/\.wx-create-dialog /g) || []).length);
