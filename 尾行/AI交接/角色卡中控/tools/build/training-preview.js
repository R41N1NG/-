"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  esbuild = require("esbuild");
const { buildUI } = require("./ui.js");
const ROOT = path.resolve(__dirname, "../..");
function buildTrainingPreview() {
  const { css, bodyHtml, script } = buildUI({
    preview: false,
    writePreview: false,
  });
  const entry = esbuild.buildSync({
    entryPoints: [path.join(__dirname, "training-preview-entry.js")],
    bundle: true,
    format: "iife",
    globalName: "TrainingPreview",
    platform: "browser",
    target: "es2020",
    write: false,
    legalComments: "none",
  }).outputFiles[0].text;
  const boot = script + "\n" + entry + "\nTrainingPreview.boot();";
  const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>尾行 · 第一次训练 · 五页图文教程预览</title>
<style>${css}
html{min-height:100%;background:#091316}body{margin:0;color:#ccd7ce;font:14px/1.7 system-ui,sans-serif;background:radial-gradient(ellipse at 60% 0,#23413a55,transparent 65%)}.brief-preview-shell{max-width:1080px;margin:auto;padding:32px 22px 42px}.brief-preview-eyebrow{color:#95a893;font-size:10px;letter-spacing:3px;margin-bottom:9px}.brief-preview-heading{display:flex;gap:15px;align-items:baseline;justify-content:space-between;flex-wrap:wrap;margin:0 0 15px}.brief-preview-heading h1{font-size:19px;font-weight:450;letter-spacing:1px;margin:0;color:#c6d6c8}.brief-preview-heading p{font-size:10px;color:#728f81;margin:0}.brief-preview-shell #wx-zero-floor{margin:0 auto}.brief-preview-field{display:none}.brief-preview-field .wx-standalone-main{max-width:none;padding:0}.brief-preview-shell .mes_text{font-size:12px;color:#97b09f}.brief-preview-shell .mes_text p{margin:0}body[data-preview-state="field"] .brief-preview-field{display:block;margin-top:24px}.brief-preview-note{color:#6e8c7c;font-size:10px;margin:17px 0 0;line-height:1.9}.brief-preview-shell #wxSyncNotice{position:relative}.brief-preview-shell .trpg::before,.brief-preview-shell .trpg::after{pointer-events:none}@media(max-width:600px){.brief-preview-shell{padding:21px 10px 28px}.brief-preview-heading{gap:4px;margin-bottom:13px}.brief-preview-heading h1{font-size:16px}.brief-preview-eyebrow{font-size:9px;letter-spacing:2px}}
</style><body data-preview-state="brief"><div class="brief-preview-shell"><div class="brief-preview-eyebrow">尾行 / 零楼后续界面预览</div><div class="brief-preview-heading"><h1>第一次训练 · 五页图文教程</h1><p>已代选阿宅身份与女大学生目标，可返回修改</p></div><div id="chat"><div class="mes" mesid="0"><div class="mes_text">确认简报后载入训练场景。</div></div></div><div class="brief-preview-field"><main class="wx-standalone-main"><section class="trpg" aria-label="玩家状态栏">${bodyHtml}</section></main></div><p class="brief-preview-note">独立交互预览。首页、返回修改与确认建局使用正式界面和引擎；试玩变量仅留在本页，与酒馆存档无关。完整五页：接受任务、认识终端、找到起点、执行观察、查看收获。可前后翻阅，在第4页试一次打量和发送。示范结果来自正式引擎的一次成功案例，不写入你的实际进度。最后载入或随时跳过，均沿原建局流程。</p></div><script>${boot.replace(/<\/script/gi, "<\\/script")}</script></body></html>`;
  const file = path.join(ROOT, "previews/training-brief/index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html.replace(/^[ \t]+$/gm, ""));
  return { file };
}
if (require.main === module) console.log(buildTrainingPreview().file);
module.exports = { buildTrainingPreview };
