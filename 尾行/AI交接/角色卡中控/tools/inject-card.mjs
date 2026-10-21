// tools/inject-card.mjs - 把 dist/wx-statusbar.user.js 嵌入 最新角色卡/尾行.json 的角色卡脚本层。
// 基米构建线重建卡后重跑本脚本即可重新注入（幂等：同名旧条目先移除）。
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const CARD = join(root, "最新角色卡", "尾行.json");
const SCRIPT = join(root, "dist", "wx-statusbar.user.js");
const NAME = "尾行·引擎+状态栏";

const card = JSON.parse(readFileSync(CARD, "utf8"));
const content = readFileSync(SCRIPT, "utf8");
if (/<\/script/.test(content)) throw new Error("脚本未做防截断转义，拒注");

const ext = (card.data.extensions ||= {});
const th = (ext.tavern_helper ||= { script: { enabled: { characters: [], global: false, presets: [] }, popuped: { characters: [], global: false, presets: [] }, scripts: [] } });
th.scripts ||= [];
const before = th.scripts.length;
th.scripts = th.scripts.filter(t => t && t.name !== NAME && t.id !== "weixing-hud-core" && t.name !== "尾行状态栏与中控");
th.scripts.push({
  type: "script", enabled: true, name: NAME,
  id: "weixing-engine-statusbar-v07",
  content,
  info: "引擎+胶水+状态栏壳（esbuild 防截断版）；卡名含尾行时自动激活；数据存聊天变量 wx_snap/wx_save。tools/inject-card.mjs 注入。",
  button: { enabled: false, buttons: [] },
  data: {}, export_with: { data: true, button: true },
});

// 写前备份一次（幂等注入不动备份）
copyFileSync(CARD, CARD + ".bak");

writeFileSync(CARD, JSON.stringify(card, null, 2), "utf8");

// 回读校验
const back = JSON.parse(readFileSync(CARD, "utf8"));
const mine = back.data.extensions.tavern_helper.scripts.find(t => t.name === NAME);
if (!mine || mine.content !== content) throw new Error("注入校验失败");
console.log(`注入成功：${NAME} ${(content.length / 1024).toFixed(1)}KB · 卡内脚本 ${before}→${back.data.extensions.tavern_helper.scripts.length} 条`);
console.log("卡内清单: " + back.data.extensions.tavern_helper.scripts.map(t => t.name).join(" | "));
