import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, "..", "..", "状态栏.html");
let t = readFileSync(file, "utf8");
// 只给四帧 mock 补上鞋具字段（演示数据，非引擎真源）
const pairs = [
  ["target:{alertStage:1,warinessStage:'低'},", "target:{alertStage:1,warinessStage:'低',shoe:'heel'},"],
  ["target:{alertStage:2,warinessStage:'中'},", "target:{alertStage:2,warinessStage:'中',shoe:'heel'},"],
  ["target:{alertStage:3,warinessStage:'中'},", "target:{alertStage:3,warinessStage:'中',shoe:'heel'},"],
  ["target:{alertStage:0,warinessStage:'低'},", "target:{alertStage:0,warinessStage:'低',shoe:'flat'},"],
];
let n = 0;
for (const [a, b] of pairs) { if (t.includes(a)) { t = t.split(a).join(b); n++; } }
writeFileSync(file, t, "utf8");
console.log("mock 补鞋具帧数 =", n);
