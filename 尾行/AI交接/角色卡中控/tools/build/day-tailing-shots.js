"use strict";
// 用真实独立日程页面与实际引擎存档拍图，坐标相对原截图计算。
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http");
const { browserSession } = require("../browser-session.cjs");
const { buildCollegePreview } = require("./college-preview");
const { courseScenes, courseHash } = require("./day-tailing-sample");
async function buildDayTailingShots() {
  const root = path.resolve(__dirname, "../.."),
    out = path.join(root, "previews/day-tailing-tutorial/source");
  fs.mkdirSync(out, { recursive: true });
  const page = buildCollegePreview().file,
    { scenes, facts } = courseScenes(),
    shots = {},
    b = await browserSession();
  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(fs.readFileSync(page));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  try {
    for (const width of [1100, 390]) {
      await b.send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 1600,
        deviceScaleFactor: 2,
        mobile: false,
      });
      for (const [id, saved] of Object.entries(scenes)) {
        const setter = await b.send("Page.addScriptToEvaluateOnNewDocument", {
          source: `localStorage.setItem('wx_college_schedule_preview_v1',${JSON.stringify(JSON.stringify(saved))});`,
        });
        await b.send("Page.navigate", {
          url: "http://127.0.0.1:" + server.address().port,
        });
        await b.delay(550);
        for (let n = 0; n < 60; n++) {
          if (await b.evaluate("!!window.__collegePreview?.ready")) break;
          await b.delay(100);
        }
        await b.send("Page.removeScriptToEvaluateOnNewDocument", {
          identifier: setter.identifier,
        });
        if (id === "day")
          await b.evaluate(
            "document.getElementById('wxCityMap').open=false;true",
          );
        if (id === "profile")
          await b.evaluate(
            "document.querySelector('[data-wx-dialog=\"wx-profile-dialog\"]').click();true",
          );
        await b.evaluate(
          "document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))",
        );
        await b.delay(300);
        let selectors, regions;
        if (id === "day") {
          selectors = ["#wxDayPlan", "#wxDailyActions"];
          regions = [
            [
              ".wx-day-ap",
              "每天4点",
              "先看剩余行动点，活动费用会在按钮上提前显示。",
            ],
            [
              "#wxDayPeriods",
              "每时段一次行动",
              "一次日程行动完成后进入下一时段；一天有五个时段。",
            ],
            [
              "#wxDailyActionGrid",
              "先看费用，再安排",
              "休息和打工各1点，尾行入场2点；度过时段0点。",
            ],
          ];
        } else if (id === "move") {
          selectors = ["#wxCityMap"];
          regions = [
            [
              '[data-place-id="university_canteen_b"]',
              "点地点直接前往",
              "本例实际到达食堂后才建立目视。移动不扣行动点，但会消耗时间。",
            ],
            [
              "#wxCityCanvas",
              "地图不是透视眼",
              "蓝点代表你；橙色目击记录要结合是否仍在目视判断，不会公开隐藏日程。",
            ],
          ];
        } else if (id === "entry") {
          selectors = [".college-guide"];
          regions = [
            [
              "#collegeSceneTitle",
              "真实出行现场",
              "本例在晚间校门目视她准备离开；不是任何时间到校门都能开始。",
            ],
            [
              "#collegeStart",
              "满足条件才有入口",
              "看见她、存在出行机会且行动点足够，才能进入；本次消耗2点。",
            ],
          ];
        } else if (id === "profile") {
          await b.evaluate(
            "(()=>{const d=document.getElementById('wx-profile-dialog'),p=document.getElementById('profileRoutes');window.scrollTo(0,0);d.scrollTop+=p.getBoundingClientRect().top-d.getBoundingClientRect().top-35;return true})()",
          );
          selectors = ["#profileRoutes"];
          regions = [
            [
              "#profileRoutes form",
              "路线名称可以修改",
              "默认归家路线；保存名称不扣点、不改变真实路线。",
            ],
            [
              "#profileRoutes .profile-route-segment",
              "只记探明的路段",
              "跟丢仍保留已有成果；未确认的后续路线不会补出来。",
            ],
          ];
        } else {
          selectors = ["#collegeTailScreen"];
          regions =
            id === "tailing"
              ? [
                  [
                    "#collegeTailMetrics",
                    "看距离、心跳、体力与警觉",
                    "远端跟随DC＋2；靠近有心跳与近距离暴露代价，敏捷减免一部分暴露。",
                  ],
                  [
                    "#collegeDistance",
                    "自行选择跟随距离",
                    "每次内部跟随真实判定，不再重复扣2点入场费。",
                  ],
                  [
                    "#collegeTailRoute",
                    "下一站不会提前公开",
                    "掌握真实相邻下一站才有情报加值，未知没有加值。",
                  ],
                ]
              : id === "recovery"
                ? [
                    [
                      "#collegeRecoveryControls",
                      "首个普通失败可追找一次",
                      "多花一个内部回合重新判定，不回滚消耗，不保证找回；天然1不提供这次补救。",
                    ],
                    [
                      "#collegeTailRoute",
                      "沿最后目击方向判断",
                      "最后目击只能告诉你上一次在哪里看见她。找回后从远端继续。",
                    ],
                  ]
                : [
                    [
                      "#collegeTailHeading",
                      "已经找不到她了",
                      "补救未能找回，明确结束当前目视；不会让你凭空知道她去了哪里。",
                    ],
                    [
                      "#collegeTailOutcome",
                      "成果会保留",
                      "查看最后目击与本次收益，再返回日程；时段推进一次，已花入场点不退。",
                    ],
                  ];
        }
        const data = await b.evaluate(
          `(()=>{const ss=${JSON.stringify(selectors)},rr=${JSON.stringify(regions)};const rect=s=>{const e=document.querySelector(s);if(!e)throw Error('缺少截图元素 '+s);const r=e.getBoundingClientRect();if(r.width<4||r.height<4)throw Error('无面积 '+s);return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}};const a=ss.map(rect),x=Math.min(...a.map(r=>r.x)),y=Math.min(...a.map(r=>r.y));const clip={x,y,width:Math.max(...a.map(r=>r.x+r.width))-x,height:Math.max(...a.map(r=>r.y+r.height))-y};const boxes=rr.map(([s,title,note])=>{const r=rect(s);return {title,note,left:(r.x-x)/clip.width*100,top:(r.y-y)/clip.height*100,width:r.width/clip.width*100,height:r.height/clip.height*100}});return {clip,boxes}})()`,
        );
        for (const box of data.boxes)
          if (
            box.left < -0.5 ||
            box.top < -0.5 ||
            box.left + box.width > 100.5 ||
            box.top + box.height > 100.5
          )
            throw Error("框选越界 " + id);
        const img = await b.send("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: true,
          clip: { ...data.clip, scale: 1 },
        });
        const key = id + (width === 390 ? "-mobile" : "");
        fs.writeFileSync(
          path.join(out, key + ".png"),
          Buffer.from(img.data, "base64"),
        );
        shots[key] = {
          src: "data:image/png;base64," + img.data,
          width: data.clip.width,
          height: data.clip.height,
          pixelRatio: 2,
          boxes: data.boxes,
        };
      }
    }
    const manifest = { schema: 1, sourceHash: courseHash(root), facts, shots };
    fs.writeFileSync(path.join(out, "shots.json"), JSON.stringify(manifest));
    console.log("day/tailing real screenshots:", Object.keys(shots).join(", "));
  } finally {
    b.close();
    await new Promise((r) => server.close(r));
  }
}
if (require.main === module)
  buildDayTailingShots().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { buildDayTailingShots };
