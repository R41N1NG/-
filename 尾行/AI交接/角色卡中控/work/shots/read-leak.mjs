// 把聊天记录里泄露的提示词抽出来，找中控注入的段落
import { readFileSync } from "node:fs";

const full = "E:/tavern/data/default-user/chats/尾行/尾行 - 2026-10-19@01h05m34s.jsonl";
const lines = readFileSync(full, "utf8").trim().split(/\r?\n/);
const msgs = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

const leak = msgs[5] && msgs[5].mes || "";
console.log("泄露提示词长度 =", leak.length);

const MARKERS = [
  "【中控", "【本轮", "【回执", "【目标当前态势", "【状态栏", "【结算", "【真值", "白描", "回执",
  "真值", "骰", "DC", "动作", "标签", "距离", "警觉", "心跳", "体力"
];
for (const k of MARKERS) {
  const n = leak.split(k).length - 1;
  if (n) console.log(`  ${k} × ${n}`);
}

// 打印所有 【...】 小节标题
const heads = [...leak.matchAll(/【[^】]{2,40}】/g)].map(m => m[0]);
console.log("\n小节标题:", [...new Set(heads)].join(" | "));

// 找与中控/回执相关的段落上下文
for (const kw of ["回执", "真值", "中控", "结算"]) {
  let idx = -1, shown = 0;
  while ((idx = leak.indexOf(kw, idx + 1)) >= 0 && shown < 3) {
    console.log(`\n=== 关键词「${kw}」@${idx} ===`);
    console.log(leak.slice(Math.max(0, idx - 220), idx + 320).replace(/\s+/g, " "));
    shown++;
  }
}
