// 读最新 TT 聊天：先看聊天变量里的中控快照（wx_snap，真值），再看正文推进到哪
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const dir = "E:/tavern/data/default-user/chats/尾行";
const file = readdirSync(dir).map((f) => ({ f, m: statSync(join(dir, f)).mtimeMs }))
  .sort((a, b) => b.m - a.m)[0].f;
const raw = readFileSync(join(dir, file), "utf8").trim().split(/\r?\n/);
console.log("文件:", file, "行数:", raw.length);

const head = JSON.parse(raw[0]);
const vars = (head.chat_metadata && head.chat_metadata.variables) || (head.variables) || {};
console.log("变量键:", Object.keys(vars).join(", "));

const snap = vars.wx_snap;
if (snap) {
  const r = (snap.targetState && snap.targetState.route) || snap.route || {};
  console.log("\n[wx_snap}", JSON.stringify({
    floor: snap.floor,
    mode: snap.mode,
    dist: snap.dist,
    place: snap.place,
    routeId: r.id,
    here: r.here,
    nodes: r.nodes,
    currentPlace: r.currentPlace,
    known: r.known
  }, null, 1));
  console.log("[wx_save.floor]", vars.wx_save && vars.wx_save.floor);
  console.log("[wx_diag]", JSON.stringify(vars.wx_diag));
  console.log("[wx_init]", JSON.stringify(vars.wx_init && {
    targetId: vars.wx_init.targetId, route: vars.wx_init.route && { id: vars.wx_init.route.id, nodes: vars.wx_init.route.nodes, startTime: vars.wx_init.route.startTime }
  }));
} else {
  console.log("!! 没有 wx_snap");
}

const msgs = raw.slice(1).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
console.log("\n消息数:", msgs.length);
msgs.forEach((m, i) => {
  const t = String(m.mes || "").replace(/\s+/g, " ");
  console.log(`--- #${i} ${m.is_user ? "USER" : "AI"} len=${t.length}`);
  console.log("    " + t.slice(0, 320));
  if (!m.is_user) {
    const tail = t.slice(-260);
    console.log("    …尾部: " + tail);
  }
});
