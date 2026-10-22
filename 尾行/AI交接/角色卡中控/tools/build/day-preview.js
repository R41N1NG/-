"use strict";
const fs = require("node:fs"),
  path = require("node:path");
const { buildUI } = require("./ui.js");
const esbuild = require("esbuild");
const { defaultInit } = require("../../src/host/initial-state.js");
const ROOT = path.resolve(__dirname, "../..");
function buildDayPreview() {
  const { script, css, bodyHtml } = buildUI({
    preview: false,
    writePreview: false,
  });
  const states = [
    {
      title: "早间 · 4 点",
      description:
        "可选工作、批量采买、休息和度过时段，实际结算并保存。上方按钮仅用于重置试玩状态。",
      plan: { period: 0, spent: 0, activity: null, ended: false },
    },
    {
      title: "午后 · 3 点",
      description: "从午后状态继续试玩：每次活动结束后推进一个时段。",
      plan: { period: 2, spent: 1, activity: null, ended: false },
    },
    {
      title: "尾行中 · 2 点",
      description: "展示尾行入场扣除 2 点后的预期状态；本页不执行尾行判定。",
      plan: {
        period: 3,
        spent: 2,
        activity: {
          id: "preview-tailing",
          kind: "tailing",
          name: "尾行进行中",
          cost: 2,
        },
        ended: false,
      },
    },
    {
      title: "本日结束 · 0 点",
      description: "当天结束的显示效果。",
      plan: { period: 4, spent: 4, activity: null, ended: true },
    },
    {
      title: "当前正式流程",
      description: "旧存档保留原流程；点击启用日程安排后，才使用新日程规则。",
      plan: null,
    },
  ].map((state) => {
    const init = {
      ...defaultInit({ targetId: "college" }),
      identity: "otaku",
      sessionSalt: "daily-ui-preview-v2",
      stats: { date: 1, heart: 30, stamina: 55, cash: 800, pi: 0 },
    };
    if (state.plan)
      init.dayPlan = { schema: 1, source: "daily", ...state.plan };
    return { title: state.title, description: state.description, init };
  });
  const entry = esbuild.buildSync({
    entryPoints: [path.join(__dirname, "daily-preview-entry.js")],
    bundle: true,
    format: "iife",
    globalName: "DailyPreview",
    platform: "browser",
    target: "es2020",
    write: false,
    legalComments: "none",
  }).outputFiles[0].text;
  const boot = entry + `\nDailyPreview.boot(${JSON.stringify(states)});`;
  const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>尾行 · 每日行动状态栏预览</title>
<style>${css}
html{min-height:100%;background:#080e14}body{margin:0;color:#c6d0d7;font:14px/1.7 system-ui,sans-serif;background:radial-gradient(ellipse at 50% 0,#1b2b34,transparent 65%)}
.preview-shell{max-width:1000px;margin:0 auto;padding:42px 24px 50px}.preview-eyebrow{font-size:11px;letter-spacing:3px;color:#bca879}.preview-shell h1{font-size:26px;font-weight:500;color:#edf0ed;margin:8px 0 12px}.preview-shell p{max-width:760px;color:#869da9;font-size:12px}.daily-preview-controls{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0 10px}.daily-preview-controls button{padding:7px 12px;border:1px solid #344650;background:#101b23;color:#9eb0bc;border-radius:5px;font:12px system-ui;cursor:pointer}.daily-preview-controls button[aria-pressed="true"]{border-color:#b59e6c;color:#eddbb5;background:#29271f}.preview-description{min-height:42px;margin-bottom:22px}main.wx-standalone-main{padding:0;max-width:none}.preview-bottom{font-size:11px;color:#677e8b;border-top:1px solid #1e303a;margin-top:24px;padding-top:14px}@media(max-width:560px){.preview-shell{padding:24px 12px}.preview-shell h1{font-size:22px}.daily-preview-controls{gap:6px}.daily-preview-controls button{padding:7px 9px}.preview-description{min-height:65px}}
</style>
<div class="preview-shell"><div class="preview-eyebrow">尾行 / 状态栏预览</div><h1>城市地图与每日行动</h1><p>阿宅 × 女大学生。每天 4 点行动点，每时段一次行动；尾行消耗 2 点，仍只算一次行动。</p><div class="daily-preview-controls" id="dailyPreviewControls"></div><p class="preview-description" id="dailyPreviewDescription"></p>
<main class="wx-standalone-main"><section class="trpg" aria-label="玩家状态栏">${bodyHtml}</section></main>
<div class="preview-bottom">本页使用正式界面、引擎和保存流程。地图、市内移动、线上补给与固定黑市采购可操作；交流与尾行待接内容和条件。尾行中按钮仅载入展示样例。试玩进度与酒馆存档相互独立。</div></div>
<script>${(script + "\n" + boot).replace(/<\/script/gi, "<\\/script")}</script></html>`;
  const directory = path.join(ROOT, "previews/day-plan");
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, "index.html");
  fs.writeFileSync(file, html.replace(/^[ \t]+$/gm, ""));
  return { file, states };
}
if (require.main === module) console.log(buildDayPreview().file);
module.exports = { buildDayPreview };
