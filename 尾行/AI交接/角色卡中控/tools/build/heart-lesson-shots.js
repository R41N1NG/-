"use strict";
const fs = require("node:fs"),
  path = require("node:path");
const { browserSession } = require("../browser-session.cjs");
const { buildUI } = require("./ui");
const { heartLessonScenes, heartLessonHash } = require("./heart-lesson-sample");
async function buildHeartLessonShots() {
  const root = path.resolve(__dirname, "../.."),
    out = path.join(root, "previews/heart-tutorial/source");
  fs.mkdirSync(out, { recursive: true });
  const ui = buildUI({ preview: false, writePreview: false }),
    { scenes, facts } = heartLessonScenes(),
    shots = {},
    b = await browserSession();
  try {
    for (const width of [1100, 390]) {
      await b.send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 1600,
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
      async function capture(id, selector, regions) {
        await b.evaluate(
          "document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))",
        );
        await b.delay(300);
        const rects = await b.evaluate(
          `(()=>{const rect=s=>{const e=document.querySelector(s);if(!e)throw Error('缺少原图元素 '+s);const r=e.getBoundingClientRect();if(r.width<4||r.height<4)throw Error('无截图面积 '+s);return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}};const clip=rect(${JSON.stringify(selector)});const boxes=${JSON.stringify(regions)}.map(([s,title,note])=>{const r=rect(s);return{title,note,left:(r.x-clip.x)/clip.width*100,top:(r.y-clip.y)/clip.height*100,width:r.width/clip.width*100,height:r.height/clip.height*100}});return{clip,boxes}})()`,
        );
        for (const m of rects.boxes)
          if (
            m.left < -0.5 ||
            m.top < -0.5 ||
            m.left + m.width > 100.5 ||
            m.top + m.height > 100.5
          )
            throw Error("原图标注越界 " + id);
        const png = await b.send("Page.captureScreenshot", {
            format: "png",
            captureBeyondViewport: false,
            clip: { ...rects.clip, scale: 1 },
          }),
          key = id + (width === 390 ? "-mobile" : "");
        fs.writeFileSync(
          path.join(out, key + ".png"),
          Buffer.from(png.data, "base64"),
        );
        shots[key] = {
          src: "data:image/png;base64," + png.data,
          width: rects.clip.width,
          height: rects.clip.height,
          pixelRatio: 2,
          boxes: rects.boxes,
        };
      }
      await b.evaluate(
        `WxStatusbar.render(${JSON.stringify(scenes.sweet)});true`,
      );
      const entryRegions = [
        [
          "#heartPillBtn",
          "点击心跳入口",
          "状态栏右侧的小红心可以展开生理心率与压力监控。",
        ],
        [
          "#miniHeartNum",
          "50是负荷值",
          "0–100的心跳负荷参与规则判定，本例50处于默认甜区。",
        ],
      ];
      if (width > 600)
        entryRegions.push([
          "#miniBpmNum",
          "63 BPM是换算读数",
          "BPM用于声音与演出；不要拿63去套负荷阈值。",
        ]);
      else
        entryRegions[0][2] =
          "小屏会收起BPM小字；点击小红心，在展开面板查看完整读数。";
      await capture("entry", "#trpgSlimBar", entryRegions);
      await b.evaluate("document.getElementById('heartPillBtn').click();true");
      for (const [id, snap] of Object.entries(scenes)) {
        await b.evaluate(`WxStatusbar.render(${JSON.stringify(snap)});true`);
        await capture(id, "#heartPopoverCard", [
          [
            "#dial",
            "看负荷与绿弧",
            "绿弧显示当前甜区；70、90两条操作线仍然存在。",
          ],
          [
            "#heartNum",
            "大数字是心跳负荷",
            "是否获得甜区加值、是否触发高压惩罚，都看这个数。",
          ],
          [
            "#bpmNum",
            "小数字是BPM",
            "这是从负荷换算的显示数，不是另一份独立游戏资源。",
          ],
        ]);
      }
    }
    fs.writeFileSync(
      path.join(out, "shots.json"),
      JSON.stringify({
        schema: 1,
        sourceHash: heartLessonHash(root),
        facts,
        shots,
      }),
    );
    console.log(
      "heart lesson real screenshots:",
      Object.keys(shots).join(", "),
    );
  } finally {
    b.close();
  }
}
if (require.main === module)
  buildHeartLessonShots().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { buildHeartLessonShots };
