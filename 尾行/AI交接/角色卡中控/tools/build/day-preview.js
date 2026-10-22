"use strict";
const fs = require("node:fs"),
  path = require("node:path");
const { buildUI } = require("./ui.js");
const { createGame } = require("../../src/runtime/game.js");
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
      description: "当天尚未行动。",
      plan: { period: 0, spent: 0, activity: null, ended: false },
    },
    {
      title: "午后 · 3 点",
      description: "展示已花费 1 点后的状态；普通活动内容仍待接入。",
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
      description:
        "当前角色卡仍沿用原夜间流程。新增日程显示与存档字段已接通，活动扣费和时段推进尚未启用。",
      plan: null,
    },
  ].map((state) => {
    const init = {
      ...defaultInit({ targetId: "college" }),
      identity: "otaku",
      sessionSalt: "daily-ui-preview-v1",
    };
    if (state.plan)
      init.dayPlan = { schema: 1, source: "daily", ...state.plan };
    const game = createGame(init);
    const saved = game.save();
    return {
      title: state.title,
      description: state.description,
      snap: createGame({ saved }).snapshot(),
    };
  });
  const boot = `const states=${JSON.stringify(states)};
window.getVariables=async()=>({wx_save:{v:2}});
WxStatusbarUI.mountStatusbar(document,window);
const controls=document.getElementById('dailyPreviewControls');
function show(index){WxStatusbar.render(states[index].snap);document.getElementById('dailyPreviewDescription').textContent=states[index].description;controls.querySelectorAll('button').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));window.__dailyPreviewIndex=index;}
states.forEach((state,index)=>{const button=document.createElement('button');button.type='button';button.textContent=state.title;button.dataset.stateIndex=index;button.onclick=()=>show(index);controls.append(button);});show(0);`;
  const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>尾行 · 每日行动状态栏预览</title>
<style>${css}
html{min-height:100%;background:#080e14}body{margin:0;color:#c6d0d7;font:14px/1.7 system-ui,sans-serif;background:radial-gradient(ellipse at 50% 0,#1b2b34,transparent 65%)}
.preview-shell{max-width:1000px;margin:0 auto;padding:42px 24px 50px}.preview-eyebrow{font-size:11px;letter-spacing:3px;color:#bca879}.preview-shell h1{font-size:26px;font-weight:500;color:#edf0ed;margin:8px 0 12px}.preview-shell p{max-width:760px;color:#869da9;font-size:12px}.daily-preview-controls{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0 10px}.daily-preview-controls button{padding:7px 12px;border:1px solid #344650;background:#101b23;color:#9eb0bc;border-radius:5px;font:12px system-ui;cursor:pointer}.daily-preview-controls button[aria-pressed="true"]{border-color:#b59e6c;color:#eddbb5;background:#29271f}.preview-description{min-height:42px;margin-bottom:22px}main.wx-standalone-main{padding:0;max-width:none}.preview-bottom{font-size:11px;color:#677e8b;border-top:1px solid #1e303a;margin-top:24px;padding-top:14px}@media(max-width:560px){.preview-shell{padding:24px 12px}.preview-shell h1{font-size:22px}.daily-preview-controls{gap:6px}.daily-preview-controls button{padding:7px 9px}.preview-description{min-height:65px}}
</style>
<div class="preview-shell"><div class="preview-eyebrow">尾行 / 状态栏预览</div><h1>每日行动与时段</h1><p>阿宅 × 女大学生。每天 4 点行动点，每时段一次行动；尾行消耗 2 点，仍只算一次行动。</p><div class="daily-preview-controls" id="dailyPreviewControls"></div><p class="preview-description" id="dailyPreviewDescription"></p>
<main class="wx-standalone-main"><section class="trpg" aria-label="玩家状态栏">${bodyHtml}</section></main>
<div class="preview-bottom">本页为显示预览，切换按钮不产生游戏进度。演示状态经实际引擎保存、恢复后生成快照。当前交付先接显示和共用存档，全天活动与尾行入口下一步接入。</div></div>
<script>${(script + "\n" + boot).replace(/<\/script/gi, "<\\/script")}</script></html>`;
  const directory = path.join(ROOT, "previews/day-plan");
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, "index.html");
  fs.writeFileSync(file, html.replace(/^[ \t]+$/gm, ""));
  return { file, states };
}
if (require.main === module) console.log(buildDayPreview().file);
module.exports = { buildDayPreview };
