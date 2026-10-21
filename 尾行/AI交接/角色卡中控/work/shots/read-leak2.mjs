// 把泄露提示词里中控注入的几个小节完整打出来
import { readFileSync, writeFileSync } from "node:fs";

const full = "E:/tavern/data/default-user/chats/尾行/尾行 - 2026-10-19@01h05m34s.jsonl";
const lines = readFileSync(full, "utf8").trim().split(/\r?\n/);
const msgs = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const leak = (msgs[5] && msgs[5].mes) || "";
writeFileSync("E:/角色卡制作/尾行/work/shots/leak-prompt.txt", leak, "utf8");

for (const title of ["【主观意图与动作尝试】", "【唯一客观真源】", "【叙事断点原则】", "【破绽暴露】"]) {
  const i = leak.indexOf(title);
  if (i < 0) { console.log("缺:", title); continue; }
  const next = leak.indexOf("【", i + title.length);
  const body = leak.slice(i, next > i ? next : i + 900);
  console.log("\n==============================================");
  console.log(body.replace(/\n{3,}/g, "\n").trim());
}
