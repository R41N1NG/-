// 复核 1（静态）：复刻 build-statusbar.js 的提取与断言，但不写 dist。
// 目的：确认改过的 CSS/HTML/JS 仍能被构建脚本原样抽出来。
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const shell = readFileSync(join(root, "状态栏.html"), "utf8");

const css = (shell.match(/<style[^>]*>([\s\S]*?)<\/style>/i) || [])[1] || "";
const body = (shell.match(/<section class="trpg"[^>]*>([\s\S]*?)<\/section>/i) || [])[1] || "";
const script = (shell.match(/<script[^>]*>([\s\S]*?)<\/script>/i) || [])[1] || "";

console.log("提取长度 ::", JSON.stringify({ css: css.trim().length, body: body.trim().length, script: script.trim().length }));

const runtime = readFileSync(join(root, "dist", "runtime.js"), "utf8");
const builder = readFileSync(join(root, "build-statusbar.js"), "utf8");
const must = ["WxEngine", "WxGlue", "mountWxStatusbar", "wx-statusbar-root", "renderSnapshot", "wx_snap",
  "wx-create-dialog", "IDENTITY_DATA", "zeroFloorInit", "newGame"];
const fakeSafe = runtime + script + builder;
for (const m of must) console.log((fakeSafe.includes(m) ? "OK  " : "MISS") + " 构建断言 " + m);
console.log((/<\/script/i.test(script) ? "FAIL" : "OK  ") + " 脚本段无裸 </script");

const probes = [
  ["样式：弹窗关闭态兜底", css.includes("dialog.wx-dialog:not([open])")],
  ["样式：860 断点", css.includes("@media (max-width: 860px)")],
  ["样式：660 断点", css.includes("@media (max-width: 660px)")],
  ["样式：560 断点", css.includes("@media (max-width: 560px)")],
  ["样式：430 断点", css.includes("@media (max-width: 430px)")],
  ["样式：380 断点", css.includes("@media (max-width: 380px)")],
  ["样式：结算条页脚规则", css.includes(".trpg .wx-terminal-ledger[data-tip]")],
  ["样式：tooltip 收起 display:none", /\[data-tip\]::after\s*\{[^}]*display:\s*none/.test(css)],
  ["样式：C 案 token 层", css.includes("--heat:") && css.includes("--her:") && css.includes("--ink-0:")],
  ["样式：路牌灯带", css.includes(".slim-place::after")],
  ["样式：心跳主角字号", /\.mini-heart-num\s*\{[^}]*font-size:\s*24px/.test(css)],
  ["样式：状态即天气", css.includes(".trpg:has(.slim-tag.strike-tag.sealed)")],
  ["样式：dial-caption 已移除（阈值并入 tooltip）", !css.includes(".trpg .dial-caption")],
  ["DOM：dial-caption 节点已移除", !body.includes('class="dial-caption"')],
  ["样式：她的警觉五格配色", css.includes(".alert-pips i:nth-child(4)")],
  ["DOM：SVG 里已无 dial-note 文本", !body.includes('class="dial-note"')],
  ["DOM：结算条已移出 .wx-modal-body（是 dialog 直接子节点）",
    /<\/nav>\s*<\/div>\s*<!--[^>]*-->\s*<div class="ledger wx-terminal-ledger"/.test(body)],
  ["JS：红线标签回 slim-tag 契约", script.includes("'slim-tag strike-tag sealed'") && script.includes("'slim-tag strike-tag allowed'")],
  ["JS：不再写 route-tag", !/className = 'route-tag/.test(script)],
];
for (const [name, ok] of probes) console.log((ok ? "OK  " : "FAIL") + " " + name);

function balance(s) {
  let d = 0, min = 0;
  for (const ch of s) { if (ch === "{") d++; else if (ch === "}") { d--; if (d < min) min = d; } }
  return { depth: d, min };
}
console.log("样式段大括号 ::", JSON.stringify(balance(css)));
console.log("脚本段大括号 ::", JSON.stringify(balance(script)));
