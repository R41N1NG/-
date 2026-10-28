"use strict";
const fs = require("node:fs"),
  path = require("node:path");
const { browserSession } = require("../browser-session.cjs");
const { buildUI } = require("./ui");
const {
  staminaLessonScenes,
  staminaLessonHash,
} = require("./stamina-lesson-sample");
async function buildStaminaLessonShots() {
  const root = path.resolve(__dirname, "../.."),
    out = path.join(root, "previews/stamina-tutorial/source");
  fs.mkdirSync(out, { recursive: true });
  const ui = buildUI({ preview: false, writePreview: false }),
    { scenes, facts, receipts } = staminaLessonScenes(),
    shots = {},
    b = await browserSession();
  try {
    for (const width of [1100, 390]) {
      await b.send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 2400,
        deviceScaleFactor: 2,
        mobile: false,
      });
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
      async function render(snap) {
        // 与独立日程桥相同的视图会话标记；不改引擎状态或动作可用性。
        if (snap.dayPlan?.source === "daily")
          snap = {
            ...snap,
            dayPlan: {
              ...snap.dayPlan,
              sync: { scope: "stamina-lesson-screenshot", epoch: 1 },
            },
          };
        await b.evaluate(
          `WxStatusbar.render(${JSON.stringify(snap)});document.getElementById('wxCityMap').open=false;true`,
        );
      }
      async function capture(id, selectors, regions) {
        await b.evaluate(
          "document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))",
        );
        await b.delay(350);
        const data = await b.evaluate(
          `(()=>{const rect=s=>{const e=document.querySelector(s);if(!e)throw Error('缺少原图元素 '+s);const r=e.getBoundingClientRect();if(r.width<4||r.height<4)throw Error('无面积 '+s);return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}};const a=${JSON.stringify(selectors)}.map(rect),x=Math.min(...a.map(r=>r.x)),y=Math.min(...a.map(r=>r.y)),clip={x,y,width:Math.max(...a.map(r=>r.x+r.width))-x,height:Math.max(...a.map(r=>r.y+r.height))-y};const boxes=${JSON.stringify(regions)}.map(([s,title,note])=>{const r=rect(s);return{title,note,left:(r.x-x)/clip.width*100,top:(r.y-y)/clip.height*100,width:r.width/clip.width*100,height:r.height/clip.height*100}});return{clip,boxes}})()`,
        );
        for (const m of data.boxes)
          if (
            m.left < -0.5 ||
            m.top < -0.5 ||
            m.left + m.width > 100.5 ||
            m.top + m.height > 100.5
          )
            throw Error("原图框选越界 " + id);
        const png = await b.send("Page.captureScreenshot", {
            format: "png",
            captureBeyondViewport: false,
            clip: { ...data.clip, scale: 1 },
          }),
          key = id + (width === 390 ? "-mobile" : "");
        fs.writeFileSync(
          path.join(out, key + ".png"),
          Buffer.from(png.data, "base64"),
        );
        shots[key] = {
          src: "data:image/png;base64," + png.data,
          width: data.clip.width,
          height: data.clip.height,
          pixelRatio: 2,
          boxes: data.boxes,
        };
      }
      await render(scenes.start);
      await capture(
        "entry",
        ["#trpgSlimBar"],
        [
          [
            "#staminaBox",
            "先看体力百分比",
            "本例28/115，显示24%；百分比按实际体力上限计算。",
          ],
          [
            "#wx-terminal-toggle-btn",
            "再找终端入口",
            "使用补给前，打开这个终端，在行囊中找到已带上的食品。",
          ],
        ],
      );
      await b.evaluate("document.getElementById('heartPillBtn').click();true");
      for (const id of ["start", "supplied"]) {
        await render(scenes[id]);
        await capture(
          id,
          ["#heartPopoverCard"],
          [
            [
              "#fullStaminaBox",
              "体力与疲劳一起看",
              id === "start"
                ? "本例24%，体力处于疲惫档；跟随DC＋3。"
                : "便当后43/115，显示37%，疲劳减为气喘档，跟随DC＋1。",
            ],
          ],
        );
      }
      await b.evaluate("document.getElementById('heartPillBtn').click();true");
      for (const id of ["first", "second"]) {
        await render(scenes[id]);
        await b.evaluate(
          `WxStatusbar.settle(${JSON.stringify({ ...receipts[id], floor: id === "first" ? -9101 : -9102 })});true`,
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
        await b.delay(700);
        await capture(
          id,
          ["#wx-settle-dialog"],
          [
            [
              "#settleLedgerWrap",
              "认准疲劳跟随难度",
              id === "first"
                ? "右侧单独列出疲劳DC＋3；动作体力与回合消耗分别记账。"
                : "本次疲劳DC＋1；总DC还受现场条件影响。",
            ],
            [
              "#settleModsStack",
              "属性仍按原值参与",
              "疲劳增加跟随DC，不直接削减敏捷属性。",
            ],
          ],
        );
        await b.evaluate(
          "document.getElementById('wx-settle-dialog').close();true",
        );
      }
      await render(scenes.bag);
      await b.evaluate(
        "document.getElementById('wx-terminal-toggle-btn').click();true",
      );
      await b.evaluate(
        "document.getElementById('wx-items').closest('.wx-wing-card').scrollIntoView({block:'center'});true",
      );
      await capture(
        "bag",
        [".wx-wing-card:has(#wx-items)"],
        [
          [
            '[data-item-action="use"][data-item-id="bento"]',
            "点击便当右侧的“使用”",
            "本例已有两份便当。使用后恢复20体力、数量减一，不推进内部回合；需要先购买并随身携带。",
          ],
        ],
      );
      await b.evaluate(
        "document.getElementById('wx-terminal-dialog').close();window.scrollTo(0,0);true",
      );
      await render(scenes.restBefore);
      if (
        !(await b.evaluate(
          "!document.querySelector('[data-action-id=\"daily.rest\"]').disabled",
        ))
      )
        throw Error("日程休息截图未连接到可用状态");
      await capture(
        "rest",
        ["#wxDayPlan", "#wxDailyActions"],
        [
          [
            '[data-action-id="daily.rest"]',
            "休息前先看费用和效果",
            "日程休息1点，恢复50且不超上限；完成后进入下一时段。本例28→78，4点→3点，午后→晚间。",
          ],
        ],
      );
      await render(scenes.empty);
      await b.evaluate(
        "document.getElementById('wxMoreActionsBtn').click();true",
      );
      await capture(
        "empty",
        ["#wxCapsuleBar", "#wxActionDrawer"],
        [
          [
            '#wxActionDrawer [data-action-id="follow"]',
            "体力不足时，跟随会锁定",
            "一次跟随需要4点。耗尽或剩余不足4点时，先补给或结束本次尾行；不会因此要求重开存档。",
          ],
        ],
      );
    }
    fs.writeFileSync(
      path.join(out, "shots.json"),
      JSON.stringify({
        schema: 1,
        sourceHash: staminaLessonHash(root),
        facts,
        shots,
      }),
    );
    console.log(
      "stamina lesson real screenshots:",
      Object.keys(shots).join(", "),
    );
  } finally {
    b.close();
  }
}
if (require.main === module)
  buildStaminaLessonShots().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { buildStaminaLessonShots };
