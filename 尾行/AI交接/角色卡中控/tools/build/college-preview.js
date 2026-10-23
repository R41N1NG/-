"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  esbuild = require("esbuild");
const { buildUI } = require("./ui");
function buildCollegePreview() {
  const root = path.resolve(__dirname, "../.."),
    out = path.join(root, "previews/college-schedule");
  fs.mkdirSync(out, { recursive: true });
  const { script, css, bodyHtml } = buildUI({
    preview: false,
    writePreview: false,
  });
  const entry = esbuild.buildSync({
    entryPoints: [path.join(__dirname, "college-preview-entry.js")],
    bundle: true,
    format: "iife",
    globalName: "CollegePreview",
    platform: "browser",
    target: "es2020",
    write: false,
    legalComments: "none",
  }).outputFiles[0].text;
  const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>尾行 · 标准工作日可操作预览</title><style>${css}
 html{background:#081316}body{margin:0;color:#cfddd9;font:14px/1.7 system-ui;background:radial-gradient(ellipse at 20% 0,#243c3c,transparent 65%)}.college-shell{max-width:1120px;margin:auto;padding:32px 20px}.college-label{color:#bba778;font-size:11px;letter-spacing:2px}.college-shell h1{font-size:25px;margin:8px 0}.college-note{color:#8da7a6;font-size:12px}.college-guide{padding:14px 18px;background:#10272c;border:1px solid #2d4c51;border-radius:10px;margin:20px 0}.college-guide h2{font-size:18px;margin:0;color:#e8e5d7}.college-guide p{margin:6px 0 12px}.college-controls{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.college-shell button,.college-shell select{font:inherit;font-size:12px;color:#c7dcd8;border:1px solid #38565d;border-radius:6px;background:#152a30;padding:8px 12px;cursor:pointer}.college-shell button:disabled{opacity:.45;cursor:default}.college-shell .college-primary{border-color:#b59d62;color:#eed5a4;background:#403922}#collegeNotice{color:#d4b879;min-height:24px;font-size:12px}.college-shell main.wx-standalone-main{padding:0;max-width:none}#collegePhase{color:#8ccfc3;font-size:12px}.college-clock{display:flex;align-items:center;gap:12px;color:#dbcca5;font-size:12px;margin:9px 0 15px}.college-clock i{display:inline-block;width:22px;height:7px;margin-right:5px;border-radius:2px;background:#c0ad7d}.college-clock i.used{background:#263d40} .college-footer{color:#77928e;font-size:11px;margin-top:20px}@media(max-width:560px){.college-shell{padding:20px 10px}.college-shell h1{font-size:21px}.college-guide{padding:12px}.college-controls{gap:6px}}
 </style><body><div class="college-shell"><div class="college-label">全息训练 / 独立玩法预览</div><h1>到现场，再决定是否跟随</h1><p class="college-note">从午间开始。每时段3格时间。同区移动1格、跨区2格，均不扣行动点；到达时可能已经换了时段。</p><div class="college-controls"><button id="collegeReset">重置试玩</button><button id="collegePass">度过当前时段 · 0点</button></div><section class="college-guide"><div id="collegePhase"></div><div class="college-clock"><span id="collegeTime"></span><span id="collegeTimeCells" aria-hidden="true"></span></div><h2 id="collegeSceneTitle"></h2><p id="collegeSceneText"></p><div class="college-controls"><button data-college-place="university_canteen_b">去大学食堂 · 免费移动</button><button data-college-place="university_library_b">去大学图书馆 · 免费移动</button><button data-college-place="school_gate_b">去大学正门</button><button data-college-place="metro_hub_a">去CBD地铁枢纽</button></div><button id="collegeStart" class="college-primary"></button><div id="collegeTailControls" hidden><div class="college-controls"><select id="collegeDistance" aria-label="跟随距离"><option value="far">远端</option><option value="same" selected>同街</option><option value="close">身后</option><option value="touch">贴身</option></select><button id="collegeFollow" class="college-primary">跟随一段 · 不再扣行动点</button><button id="collegeSend">执行下方选中的动作</button><button id="collegeStop">中止尾行 · 不退2点</button></div></div><div id="collegeNotice" role="status"></div></section><main class="wx-standalone-main"><section class="trpg" aria-label="玩家状态栏">${bodyHtml}</section></main><p class="college-footer">时间格为本次暂定规则，未启用精确分钟或交通速度模拟。预览适配器＋正式状态栏／地图／日程扣费／尾行引擎。本页不调用模型；场景文字为固定演示。试玩另存于本浏览器，与酒馆进度隔离，尚未进入正式角色卡。</p></div><script>${(script + "\n" + entry + "\nCollegePreview.boot();").replace(/<\/script/gi, "<\\/script")}</script></body></html>`;
  const file = path.join(out, "index.html");
  fs.writeFileSync(file, html.replace(/^[ \t]+$/gm, "").trimEnd() + "\n");
  return { file };
}
if (require.main === module) console.log(buildCollegePreview().file);
module.exports = { buildCollegePreview };
