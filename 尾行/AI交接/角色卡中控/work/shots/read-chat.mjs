// 读 TT 酒馆最新聊天记录，检查中控回执有没有落进对话
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const dir = "E:/tavern/data/default-user/chats/尾行";
const files = readdirSync(dir).map(f => ({ f, m: statSync(join(dir, f)).mtimeMs }))
  .sort((a, b) => b.m - a.m).slice(0, 1).map(x => x.f);

for (const f of files) {
  const full = join(dir, f);
  const lines = readFileSync(full, "utf8").trim().split(/\r?\n/);
  console.log("文件:", f, "消息数:", lines.length);
  lines.forEach((l, i) => {
    let m; try { m = JSON.parse(l); } catch { return; }
    const text = (m.mes || "").replace(/\s+/g, " ");
    console.log(`--- #${i} ${m.is_user ? "USER" : "AI"} len=${(m.mes || "").length} name=${m.name || ""}`);
    console.log("    ", text.slice(0, 240));
  });
}
