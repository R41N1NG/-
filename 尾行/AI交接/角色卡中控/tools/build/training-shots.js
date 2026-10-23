"use strict";
// 实际正式 UI + 实际引擎案例，用 CDP 截图并记录框选坐标；不手绘替代状态栏。
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const { browserSession } = require("../browser-session.cjs");
const { buildUI } = require("./ui");
const { trainingScenes } = require("./training-sample");
async function buildTrainingShots() {
  const root = path.resolve(__dirname, "../.."),
    out = path.join(root, "previews/training-brief/source");
  fs.mkdirSync(out, { recursive: true });
  const ui = buildUI({
      preview: false,
      writePreview: false,
      skipTrainingShotCheck: true,
    }),
    scenes = trainingScenes();
  const b = await browserSession();
  const shots = {};
  try {
    for (const viewport of [1100, 390]) {
      await b.send("Emulation.setDeviceMetricsOverride", {
        width: viewport,
        height: 2000,
        deviceScaleFactor: 2,
        mobile: false,
      });
      const html = ui.template
        .replace('<main class="wx-standalone-main">', '<main class="wx-standalone-main"><div id="chat"><div class="mes" mesid="0"><div class="mes_text">教学截图</div></div></div>')
        .replace("/* WX_STATUSBAR_CSS */", () => ui.css)
        .replace(
          "/* WX_STATUSBAR_SCRIPT */",
          () => ui.script + "\nWxStatusbarUI.mountStatusbar(document,window);",
        );
      await b.send("Page.setDocumentContent", { frameId: b.frameId, html });
      await b.evaluate(
        `WxStatusbar.render(${JSON.stringify(scenes.before)});true`,
      );
      const rectCode = (s) =>
        `(()=>{const e=document.querySelector(${JSON.stringify(s)});if(!e)throw Error('截图元素不存在');const r=e.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}})()`;
      async function capture(id, selector, regions) {
        // 字体与弹窗入场动画完成后再测量；避免 transform 让测量与截图处于不同帧。
        await b.evaluate("document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))");
        await b.delay(300);
        let clip = await b.evaluate(rectCode(selector));
        if (id === "capsule") {
          const r = await b.evaluate(rectCode("#wxActionDrawer"));
          const x = Math.min(clip.x, r.x),
            y = Math.min(clip.y, r.y);
          clip = {
            x,
            y,
            width: Math.max(clip.x + clip.width, r.x + r.width) - x,
            height: Math.max(clip.y + clip.height, r.y + r.height) - y,
          };
        }
        if (id === "capsule-focus")
          clip = {
            x: clip.x - 60,
            y: clip.y - 12,
            width: clip.width + 120,
            height: clip.height + 24,
          };
        const boxes = [];
        for (const [target, title, note] of regions) {
          const r = await b.evaluate(rectCode(target));
          if (r.width < 4 || r.height < 4) throw Error(`标注区域无有效面积：${id} ${target}`);
          boxes.push({
            left: ((r.x - clip.x) / clip.width) * 100,
            top: ((r.y - clip.y) / clip.height) * 100,
            width: (r.width / clip.width) * 100,
            height: (r.height / clip.height) * 100,
            title,
            note,
          });
        }
        const shot = await b.send("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: true,
          clip: { ...clip, scale: 1 },
        });
        fs.writeFileSync(
          path.join(out, id + (viewport === 390 ? "-mobile" : "") + ".png"),
          Buffer.from(shot.data, "base64"),
        );
        shots[id + (viewport === 390 ? "-mobile" : "")] = {
          src: "data:image/png;base64," + shot.data,
          width: clip.width,
          height: clip.height,
          pixelRatio: 2,
          boxes,
        };
      }
      await capture("statusbar", "#trpgSlimBar", [
        [
          "#wx-terminal-toggle-btn",
          "终端入口",
          "在状态栏右侧点击“战术终端”，展开完整信息。",
        ],
        ["#staminaBox", "体力", "安排下一次行动前，先确认体力是否充足。"],
        ["#heartPillBtn", "心跳", "点击小红心可展开生理心率与压力监控。"],
      ]);
      await b.evaluate(
        `document.getElementById('wx-terminal-toggle-btn').click();document.querySelectorAll('#wx-terminal-dialog details').forEach(x=>x.open=true);true`,
      );
      await capture("terminal", "#wx-terminal-dialog", [
        [
          "#wx-terminal-dialog .wx-modal-title-wrap",
          "战术终端",
          "这是正式界面完整展开后的样子。",
        ],
        ["#signal", "观察流水", "这里按时间记录实际观察，查看本次新增的内容。"],
        ["#ledger", "本轮结算", "消耗、情报点等变化在这里汇总。"],
        [
          '[data-wx-dialog="wx-profile-dialog"]',
          "她的档案",
          "满足情报条件后，在这里查看已解锁内容。",
        ],
        ["#wx-items", "战术行囊", "持有物、装备和使用入口集中在这里。"],
        [
          "#routeTracker",
          "路线节点",
          "这里是已知路线和当前节点；剩余节点不等于行动点。",
        ],
        [
          ".wx-player-banner",
          "资产与属性",
          "现金、情报点和玩家五维属性在这里。",
        ],
        ["#tags", "生效修正", "装备、身份或当前状态带来的增益与妨碍。"],
        ["#proxContainer", "接近度", "接触进展另行记录，不等同目标的警觉。"],
        [
          ".wx-terminal-envbox",
          "环境与沙盘",
          "查看天气、熟悉度、出口、可用掩护和警觉信号。",
        ],
        [
          ".wx-terminal-links",
          "深页入口",
          "档案、说过的话、设备及声音；未接入项会显示空态说明。",
        ],
      ]);
      await b.evaluate(
        `document.getElementById('wx-terminal-dialog').close();document.getElementById('wxCityMap').open=true;true`,
      );
      await capture("map-visible", "#wxCityMap", [
        [".wx-map-player", "蓝点：你", "当前地点来自玩家自己的位置。"],
        [
          ".wx-map-target",
          "橙点：目视",
          "本例已经目视目标，才显示当前目标位置。",
        ],
      ]);
      await b.evaluate(
        `WxStatusbar.render(${JSON.stringify(scenes.lostAfter)});document.getElementById('wxCityMap').open=true;true`,
      );
      await capture("map-lost", "#wxCityMap", [
        [
          ".wx-map-target",
          "最后目击",
          "一次真实跟缀失败后，橙点转为空心虚线；位置停留在最后目击处。",
        ],
        [
          "#wxCityPosition",
          "看清状态",
          "这里显示“最后目击”与记录日期，不再声称是实时位置。",
        ],
      ]);
      await b.evaluate(
        `WxStatusbar.render(${JSON.stringify(scenes.before)});document.getElementById('wxCityMap').open=false;document.getElementById('wxMoreActionsBtn').click();true`,
      );
      await b.evaluate("document.body.style.paddingTop='380px';true");
      await capture("capsule", "#wxCapsuleBar", [
        [
          '#wxActionDrawer [data-action-id="scan"]',
          "点击打量胶囊",
          "先点亮这个胶囊，再发送本轮。点选只排队，不会立即执行。",
        ],
      ]);
      await capture(
        "capsule-focus",
        '#wxActionDrawer [data-action-id="scan"]',
        [
          [
            '#wxActionDrawer [data-action-id="scan"]',
            "点亮这个胶囊",
            "这是正式抽屉中的“打量”胶囊原截图裁切。点选后再发送。",
          ],
        ],
      );
      await b.evaluate(
        `document.body.style.paddingTop='0px';WxStatusbar.settle(${JSON.stringify({ ...scenes.result.package, ...scenes.result, floor: -9000 })});true`,
      );
      for (let i = 0; i < 100; i++) {
        if (
          await b.evaluate(
            `document.getElementById('settleHudStatus').textContent.includes('CHECK FINISHED')`,
          )
        )
          break;
        await b.delay(100);
      }
      await b.delay(700); // 等待逐行账目与透明度过渡完成后再拍。
      await capture("settlement", "#wx-settle-dialog", [
        [
          "#wx-settle-dialog .wing-left",
          "① 检定态势与筹码",
          "看本次行动、使用的属性和修正：这些决定你带着什么条件掷骰。",
        ],
        [
          "#wx-settle-dialog .stage-center",
          "② D20 判定",
          "中间展示骰子动画与落点；结果已经由本地规则确定，动画不重新计算。",
        ],
        [
          "#wx-settle-dialog .wing-right",
          "③ 结论与账目",
          "天然20是大成功。本例额外解锁目标敏锐的基础值；收益来自同一次正式结算。",
        ],
      ]);
      await b.evaluate("document.getElementById('wx-settle-dialog').close();WxStatusbar.reset();document.getElementById('attributeLessonContinue').click();document.querySelector('#quickPane [data-preset=otaku]').click();true");
      await capture("player-allocation", "#allocBox", [
        ["#allocRemain", "基础点数", "把基础点全部分完，再继续。"],
        ['.alloc-row[data-k="int"]', "读一行加点", "基础数值、身份修正与最终档位放在同一行；加减按钮只调整基础点。"],
      ]);
      await b.evaluate("document.getElementById('zeroNextStep').click();document.getElementById('attributeLessonContinue').click();true");
      await capture("target-attributes", "#tDetailStats", [
        ["#tDetailStats", "五项未知值", "问号表示尚未确认，不代表 0；目标不会因被选中而公开真实属性。"],
      ]);
      await b.evaluate("WxStatusbar.dispose();true");
    }
    const manifest = {
      version: require("../../package.json").version,
      sourceHash: require("./training-shot-hash.js").trainingShotHash(root),
      shots,
    };
    fs.writeFileSync(
      path.join(root, "src/ui/generated/training-shots.json"),
      JSON.stringify(manifest),
    );
    console.log("formal UI screenshots:", Object.keys(shots).join(", "));
  } finally {
    b.close();
  }
}
if (require.main === module)
  buildTrainingShots().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { buildTrainingShots };
