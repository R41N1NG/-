"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http");
const { buildUI } = require("./ui"),
  { browserSession } = require("../browser-session.cjs");
const {
  distanceLessonScenes,
  distanceLessonHash,
} = require("./distance-lesson-sample");
const { createLessonCapture } = require("./lesson-capture");
const { buildCollegePreview } = require("./college-preview");
async function buildDistanceLessonShots() {
  const root = path.resolve(__dirname, "../.."),
    out = path.join(root, "previews/distance-tutorial/source");
  fs.mkdirSync(out, { recursive: true });
  const ui = buildUI({ preview: false, writePreview: false }),
    { scenes, facts, receipts, stoppedSave } = distanceLessonScenes(),
    shots = {},
    b = await browserSession(),
    college = buildCollegePreview().file;
  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "text/html;charset=utf-8");
    res.end(fs.readFileSync(college));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = "http://127.0.0.1:" + server.address().port;
  try {
    for (const width of [1100, 390]) {
      await b.send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 2400,
        deviceScaleFactor: 2,
        mobile: false,
      });
      await b.send("Page.navigate", { url: "about:blank" });
      await b.delay(100);
      const html = ui.template
        .replace(
          "/* WX_STATUSBAR_CSS */",
          () => ui.css + "\nbody{padding-top:380px;background:#091518}",
        )
        .replace(
          "/* WX_STATUSBAR_SCRIPT */",
          () => ui.script + "\nWxStatusbarUI.mountStatusbar(document,window);",
        );
      await b.send("Page.setDocumentContent", { frameId: b.frameId, html });
      const capture = createLessonCapture({ b, width, out, shots });
      async function render(id) {
        await b.evaluate(
          `WxStatusbar.render(${JSON.stringify(scenes[id])});document.getElementById('wxCityMap').open=false;true`,
        );
      }
      await render("same");
      await capture(
        "entry",
        ["#trpgSlimBar"],
        [
          [
            "#distStat",
            "先看你与她的距离",
            "远端、同街、身后、贴身是实际距离档；点地图浏览不能直接改变尾行距离。",
          ],
          [
            "#heartPillBtn",
            "展开压力与警觉",
            "从这里展开面板，同时查看你的心跳与她的当前警觉档位。",
          ],
        ],
      );
      for (const id of ["far", "same", "close", "touch"]) {
        await render(id);
        await b.evaluate(
          `WxStatusbar.settle(${JSON.stringify({ ...receipts[id], floor: -9200 - ["far", "same", "close", "touch"].indexOf(id) })});true`,
        );
        for (let i = 0; i < 120; i++) {
          if (
            await b.evaluate(
              "document.getElementById('settleHudStatus').textContent.includes('CHECK FINISHED')",
            )
          )
            break;
          await b.delay(100);
        }
        await b.delay(650);
        await capture(
          id,
          ["#wx-settle-dialog"],
          [
            [
              "#settleLedgerWrap",
              "看距离带来的代价",
              id === "far"
                ? "远端跟随DC＋2；远一点也不能保证一直跟住。"
                : ["close", "touch"].includes(id)
                  ? "近距额外暴露仍会结算，敏捷只减免其中一部分；不会同时消除心跳压力。"
                  : "同街没有远端DC＋2，也没有这两种近距离的额外暴露。",
            ],
            [
              "#settleModsStack",
              "保持相同条件作对照",
              "本组同属性、同初始状态、同一个骰点；不是靠换骰子让近距离看起来更好。",
            ],
          ],
        );
        await b.evaluate(
          "document.getElementById('wx-settle-dialog').close();true",
        );
      }
      for (const id of ["pace", "turn", "run"]) {
        await render(id);
        await capture(
          id + "-signal",
          ["#trpgSlimBar", "#herAlert"],
          [
            [
              "#herAlert",
              "先看她刚才的举动",
              "这是实际触发的行为提示。它提示风险变化，不能据此推算一份精确的隐藏警觉账。",
            ],
          ],
        );
        // 等真实行为提示自然淡出，再拍面板；避免提示条遮住面板底部。
        await b.delay(8300);
        await b.evaluate(
          "document.getElementById('heartPillBtn').click();true",
        );
        await capture(
          id + "-panel",
          ["#heartPopoverCard"],
          [
            [
              "#popoverHerState",
              "看档位，再结合行为",
              "同一次反应发生后，档位还可能变化；一次回头不等于每次都会立刻判你失败。",
            ],
            [
              "#instrument",
              "你的心跳是另一份状态",
              "你的心跳与她的警觉分开计算；你平静下来，不等于她已经不再留意。",
            ],
          ],
        );
        await b.evaluate(
          "document.getElementById('heartPillBtn').click();true",
        );
      }
      await render("same");
      await b.evaluate(
        "document.getElementById('wxMoreActionsBtn').click();true",
      );
      await capture(
        "actions",
        ["#wxCapsuleBar", "#wxActionDrawer"],
        [
          [
            '#wxActionDrawer [data-action-id="follow"]',
            "继续跟随",
            "保持或调整跟随距离需要通过实际动作判定；压近并不保证成功。",
          ],
          [
            '#wxActionDrawer [data-action-id="withdraw"]',
            "拉开距离",
            "结合现场反馈拉开距离；远端的下一次跟随会另加DC＋2。",
          ],
          [
            '#wxActionDrawer [data-action-id="scan"]',
            "需要时再取证",
            "打量要满足目视与距离条件；不是所有距离都能取得相同观察结果。",
          ],
        ],
      );
      const setter = await b.send("Page.addScriptToEvaluateOnNewDocument", {
        source: `localStorage.setItem('wx_college_schedule_preview_v1',${JSON.stringify(JSON.stringify(stoppedSave))});`,
      });
      await b.send("Page.navigate", { url });
      for (let i = 0; i < 150; i++) {
        await b.delay(100);
        if (
          await b.evaluate(
            "document.readyState==='complete'&&!!window.__collegePreview?.ready",
          )
        )
          break;
      }
      await b.send("Page.removeScriptToEvaluateOnNewDocument", {
        identifier: setter.identifier,
      });
      await capture(
        "stop",
        ["#collegeTailScreen"],
        [
          [
            "#collegeOutcomePi",
            "已获信息照常保留",
            "主动结束保留已确认路线并结算本次收获；不会把整段进度清空重来。",
          ],
          [
            "#collegeReturn",
            "回到日程继续安排",
            "这是独立日程预览中的结束回执；内部尾行结束后，外层时段只推进一次。",
          ],
        ],
      );
    }
    fs.writeFileSync(
      path.join(out, "shots.json"),
      JSON.stringify({
        schema: 1,
        sourceHash: distanceLessonHash(root),
        facts,
        shots,
      }),
    );
    console.log("distance lesson screenshots:", Object.keys(shots).join(", "));
  } finally {
    b.close();
    await new Promise((r) => server.close(r));
  }
}
if (require.main === module)
  buildDistanceLessonShots().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { buildDistanceLessonShots };
