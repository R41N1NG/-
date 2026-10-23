"use strict";
const fs = require("node:fs"),
  path = require("node:path");
const { buildCollegePreview } = require("./build/college-preview");
const { browserSession } = require("./browser-session.cjs");
async function main() {
  const root = path.resolve(__dirname, ".."),
    file = buildCollegePreview().file,
    out = path.dirname(file),
    b = await browserSession(),
    checks = [];
  const server = require("node:http").createServer((req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(fs.readFileSync(file));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = "http://127.0.0.1:" + server.address().port;
  try {
    await b.send("Page.addScriptToEvaluateOnNewDocument", {
      source:
        "window.__previewErrors=[];addEventListener('error',e=>__previewErrors.push(e.message));addEventListener('unhandledrejection',e=>__previewErrors.push(String(e.reason)));",
    });
    for (const width of [1100, 390]) {
      await b.send("Emulation.setDeviceMetricsOverride", {
        width,
        height: width === 390 ? 1000 : 1000,
        deviceScaleFactor: 2,
        mobile: false,
      });
      await b.send("Page.navigate", {
        url,
      });
      let ready = false;
      for (let n = 0; n < 100; n++) {
        await b.delay(100);
        try {
          ready = await b.evaluate("!!window.__collegePreview?.ready");
        } catch {}
        if (ready) break;
      }
      if (!ready)
        throw Error(
          "预览未就绪：" +
            (await b.evaluate(
              "JSON.stringify({errors:window.__previewErrors,url:location.href,state:document.readyState})",
            )),
        );
      await b.evaluate("__collegePreview.reset();true");
      await b.delay(250);
      async function check(name, code) {
        const ok = await b.evaluate(code);
        checks.push({ width, name, ok: !!ok });
        if (!ok) throw Error(width + " " + name);
      }
      async function click(sel) {
        await b.evaluate(
          `(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(typeof e.click==="function")e.click();else e.dispatchEvent(new MouseEvent("click",{bubbles:true}));return true})()`,
        );
        await b.delay(200);
      }
      async function shot(name) {
        await b.delay(350);
        const img = await b.send("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: false,
        });
        fs.writeFileSync(
          path.join(out, `${name}-${width}.png`),
          Buffer.from(img.data, "base64"),
        );
      }
      await check(
        "起点无目标坐标，4点午间",
        "(()=>{const s=__collegePreview.snapshot();return !s.cityMap.target&&s.dayPlan.remaining===4&&s.dayPlan.period===1})()",
      );
      await click('[data-college-place="university_canteen_b"]');
      await check(
        "到食堂才建立目视，移动耗1格、不扣点",
        "(()=>{const s=__collegePreview.snapshot();return s.cityMap.target.live&&s.dayPlan.remaining===4&&s.previewTime.used===1&&s.dayPlan.period===1&&document.getElementById('collegeSceneTitle').textContent==='午间用餐'})()",
      );
      await check(
        "时间格和移动报价可见",
        "document.getElementById('collegeTime').textContent.includes('2 / 3')&&document.querySelector('[data-college-place=metro_hub_a]').textContent.includes('2格时间')",
      );
      await click('[data-place-id="university_library_b"]');
      await check(
        "原地图移动按钮也显示时间费用",
        "document.querySelector('[data-map-move=university_library_b]')?.textContent.includes('1格时间')",
      );
      await shot("midday");
      await click("#collegePass");
      await click('[data-college-place="university_library_b"]');
      await check(
        "午后图书馆，旧食堂不再实时",
        "(()=>{const s=__collegePreview.snapshot();return s.dayPlan.period===2&&s.cityMap.target.live&&s.cityMap.target.placeId==='university_library_b'})()",
      );
      await click('[data-college-place="school_gate_b"]');
      await check(
        "离开现场只显示最后目击",
        "!__collegePreview.snapshot().cityMap.target.live",
      );
      await click("#collegePass");
      await check(
        "晚间校门出现入口",
        "!document.getElementById('collegeStart').disabled&&__collegePreview.snapshot().dayPlan.remaining===4",
      );
      await shot("opportunity");
      await click("#collegeStart");
      await check(
        "正式入场一次扣2点",
        "__collegePreview.snapshot().dayPlan.remaining===2&&__collegePreview.snapshot().dayPlan.period===3&&!document.getElementById('collegeTailControls').hidden",
      );
      await check(
        "没有提前展示完整路线或住处",
        "(()=>{const s=__collegePreview.snapshot();return s.route.known.slice(1).every(v=>!v)&&!s.profile.facts.some(f=>f.slot==='home')})()",
      );
      await shot("tailing");
      await b.send("Page.reload");
      await b.delay(1000);
      await check(
        "刷新恢复进行中的尾行及费用",
        "__collegePreview.snapshot().dayPlan.activity?.kind==='tailing'&&__collegePreview.snapshot().dayPlan.remaining===2",
      );
      await click("#collegeFollow");
      for (let n = 0; n < 130; n++) {
        if (
          await b.evaluate(
            "document.getElementById('settleHudStatus').textContent.includes('CHECK FINISHED')",
          )
        )
          break;
        await b.delay(100);
      }
      await b.delay(500);
      await check(
        "正式骰子结算，无二次入场扣费",
        "document.getElementById('settleHudStatus').textContent.includes('CHECK FINISHED')&&__collegePreview.snapshot().dayPlan.remaining===2",
      );
      await shot("settlement");
      await b.evaluate(
        "document.getElementById('wx-settle-dialog').close();true",
      );
      await b.delay(150);
      await click("#collegeStop");
      await check(
        "中止进入子夜，不退款且不重复入场",
        "(()=>{const s=__collegePreview.snapshot();return s.dayPlan.period===4&&s.dayPlan.remaining===2&&!s.dayPlan.activity&&document.getElementById('collegeStart').disabled&&__collegePreview.save().previewCollege.usedDate===1})()",
      );
      await shot("finished");
      await check(
        "没有页面横向溢出",
        "document.documentElement.scrollWidth<=innerWidth+2",
      );
      await b.evaluate("__collegePreview.reset();true");
      await click("#collegePass");
      await click("#collegePass");
      await click('[data-college-place="school_gate_b"]');
      await click("#collegePass");
      await check(
        "跳过机会不泄露住处、不扣入场费",
        "(()=>{const s=__collegePreview.snapshot();return s.dayPlan.period===4&&s.dayPlan.remaining===4&&!s.cityMap.target.live&&!s.profile.facts.some(f=>f.slot==='home')})()",
      );
      await b.evaluate("__collegePreview.reset();true");
      await click('[data-college-place="university_canteen_b"]');
      await click('[data-college-place="school_gate_b"]');
      await click('[data-college-place="university_library_b"]');
      await check(
        "3次同区移动跨入午后，并按到达时间见到目标",
        "(()=>{const s=__collegePreview.snapshot();return s.dayPlan.period===2&&s.previewTime.used===0&&s.dayPlan.remaining===4&&s.cityMap.target.live})()",
      );
      await shot("arrival");
      await click("#collegePass");
      await click('[data-college-place="university_canteen_b"]');
      await click('[data-college-place="university_library_b"]');
      await click('[data-college-place="school_gate_b"]');
      await check(
        "晚间最后1格到校门已到子夜，错过入口",
        "(()=>{const s=__collegePreview.snapshot();return s.dayPlan.period===4&&s.dayPlan.remaining===4&&!s.cityMap.target.live&&document.getElementById('collegeStart').disabled})()",
      );
      await shot("missed");
      await b.evaluate("__collegePreview.reset();true");
      await click('[data-college-place="metro_hub_a"]');
      await check(
        "跨区移动用2格，行动点不变",
        "__collegePreview.snapshot().previewTime.used===2&&__collegePreview.snapshot().dayPlan.remaining===4",
      );
      await click('[data-college-place="university_library_b"]');
      await check(
        "跨区到达进入午后且保留已用1格",
        "(()=>{const s=__collegePreview.snapshot();return s.dayPlan.period===2&&s.previewTime.used===1&&s.cityMap.target.live})()",
      );
      await b.send("Page.reload");
      await b.delay(1000);
      await check(
        "刷新保留跨区移动后的时间格",
        "__collegePreview.snapshot().dayPlan.period===2&&__collegePreview.snapshot().previewTime.used===1",
      );
      await click('[data-place-id="school_gate_b"]');
      await click('[data-map-move="school_gate_b"]');
      await check(
        "原地图确认移动同样扣时间格",
        "(()=>{const s=__collegePreview.snapshot();return s.cityMap.player.placeId==='school_gate_b'&&s.previewTime.used===2&&s.dayPlan.period===2&&s.dayPlan.remaining===4})()",
      );
      await click('[data-action-id="daily.pass"]');
      await check(
        "原日程行动同样清格并进入新时段",
        "(()=>{const s=__collegePreview.snapshot();return s.dayPlan.period===3&&s.previewTime.used===0&&!document.getElementById('collegeStart').disabled})()",
      );
      await check("页面没有运行错误", "window.__previewErrors.length===0");
    }
  } finally {
    b.close();
    server.close();
  }
  fs.writeFileSync(
    path.join(out, "checks.json"),
    JSON.stringify(checks, null, 2) + "\n",
  );
  console.log(`PASS ${checks.length} browser checks`);
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
