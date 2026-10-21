// 修正锚点：用 tags 段的键 `"shoe_xxx": {` 定位（鞋池里也有 "id": "shoe_xxx"，会误命中）
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, "..", "..", "src", "config", "rules.json");
let src = readFileSync(file, "utf8");

const TABLE = {
  shoe_heel:     { agi: -1, noise: 3 },
  shoe_platform: { agi: -1, noise: 2 },
  shoe_slippers: { agi: -1, noise: 2 },
  shoe_sandals:  { agi: 0,  noise: 2 },
  shoe_boots:    { agi: 0,  noise: 3 },
  shoe_leather:  { agi: 0,  noise: 2 },
  shoe_flats:    { agi: 0,  noise: 1 },
  shoe_sneakers: { agi: 1,  noise: 1 },
  shoe_barefoot: { agi: 0,  noise: 1 }
};

let done = 0, skipped = 0;
for (const [id, v] of Object.entries(TABLE)) {
  const at = src.indexOf(`"${id}": {`);
  if (at < 0) { console.log("找不到 tags 键", id); skipped++; continue; }
  const lineEnd = src.indexOf("\n", at);
  let line = src.slice(at, lineEnd);
  if (line.includes('"noise"')) { console.log("已存在，跳过", id); skipped++; continue; }
  const patched = line.replace(/"value": 0,/, `"value": 0, "mod": { "agi": ${v.agi} }, "noise": ${v.noise},`);
  if (patched === line) { console.log("无法插入", id); skipped++; continue; }
  src = src.slice(0, at) + patched + src.slice(lineEnd);
  done++;
}
writeFileSync(file, src, "utf8");

const R = JSON.parse(src);
let bad = 0;
for (const [id, v] of Object.entries(TABLE)) {
  const t = R.tags[id];
  const ok = t && t.mod && t.mod.agi === v.agi && t.noise === v.noise;
  if (!ok) bad++;
  console.log(id.padEnd(15), "mod =", JSON.stringify(t && t.mod), "noise =", t && t.noise, ok ? "OK" : "!!");
}
console.log("本次写入", done, "条，跳过", skipped, "条，不合格", bad, "条");
