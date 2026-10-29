"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http");
const { buildFormalCollegePreview } = require("./build/formal-college-preview"),
  { browserSession } = require("./browser-session.cjs"),
  { closeSettlement } = require("./build/settlement-capture");
async function main() {
  const file = buildFormalCollegePreview().file,
    out = path.dirname(file),
    checks = [],
    b = await browserSession();
  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "text/html;charset=utf-8");
    res.end(fs.readFileSync(file));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = "http://127.0.0.1:" + server.address().port;
  try {
    await b.send("Page.addScriptToEvaluateOnNewDocument", {
      source:
        "window.__errors=[];addEventListener('error',e=>__errors.push(e.message));addEventListener('unhandledrejection',e=>__errors.push(String(e.reason)));",
    });
    async function until(expr) {
      for (let i = 0; i < 180; i++) {
        try {
          if (await b.evaluate(expr)) return;
        } catch {}
        await b.delay(100);
      }
      throw Error(
        "等待失败 " +
          expr +
          " " +
          (await b.evaluate("JSON.stringify(__errors)")),
      );
    }
    for (const width of [1100, 390]) {
      await b.send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 1200,
        deviceScaleFactor: 2,
        mobile: false,
      });
      await b.send("Page.navigate", { url });
      await until('document.readyState==="complete"&&!!window.__formal?.ready');
      await b.evaluate("localStorage.clear();true");
      await b.send("Page.reload");
      await until('document.readyState==="complete"&&!!window.__formal?.ready');
      async function check(name, code) {
        const ok = !!(await b.evaluate(code));
        checks.push({ width, name, ok });
        if (!ok)
          throw Error(
            width +
              " " +
              name +
              " " +
              (await b.evaluate("JSON.stringify(__errors)")),
          );
      }
      async function shot(name) {
        await b.evaluate("scrollTo(0,0);document.fonts.ready");
        await b.delay(200);
        const metrics = await b.send("Page.getLayoutMetrics"),
          img = await b.send("Page.captureScreenshot", {
            format: "png",
            captureBeyondViewport: true,
            clip: {
              x: 0,
              y: 0,
              width,
              height: Math.ceil(metrics.cssContentSize.height),
              scale: 1,
            },
          });
        fs.writeFileSync(
          path.join(out, `${name}-${width}.png`),
          Buffer.from(img.data, "base64"),
        );
      }
      await check(
        "正式新日程从早间4点、据点、非目视开始",
        '__formal.snapshot().dayPlan.period===0&&__formal.snapshot().dayPlan.remaining===4&&!__formal.snapshot().cityMap.target?.live&&!document.getElementById("wxCollegeGuide").hidden',
      );
      await shot("day");
      for (const [i, id] of [
        "university_canteen_b",
        "university_library_b",
        "school_gate_b",
      ].entries()) {
        await b.evaluate(
          `document.querySelector('#wxCityMap [data-place-id="${id}"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));true`,
        );
        await until(
          `__formal.snapshot().dailyTime.used===${(i + 1) % 3}&&__formal.snapshot().dayPlan.period===${i === 2 ? 1 : 0}`,
        );
      }
      await check(
        "直接点图跨时段不扣AP，无二次确认",
        '__formal.snapshot().dayPlan.period===1&&__formal.snapshot().dayPlan.remaining===4&&document.querySelector("[data-map-move]").hidden',
      );
      for (const period of [2, 3]) {
        await b.evaluate(
          "document.querySelector('[data-action-id=\"daily.pass\"]').click();true",
        );
        await until(`__formal.snapshot().dayPlan.period===${period}`);
      }
      await check(
        "现场目视与真实入场机会",
        '__formal.snapshot().cityMap.target.live&&__formal.snapshot().dayActions.find(a=>a.id==="daily.tailing").enabled',
      );
      await shot("entry");
      await b.evaluate(
        "document.querySelector('[data-action-id=\"daily.tailing\"]').click();true",
      );
      await until(
        '__formal.snapshot().tailingSession.active&&document.getElementById("collegeTailScreen").hidden===false',
      );
      await check(
        "进入正式尾行界面、入场2点",
        '__formal.snapshot().dayPlan.remaining===2&&getComputedStyle(document.getElementById("wxDailyActions")).display==="none"',
      );
      await shot("tailing");
      for (let i = 0; i < 10; i++) {
        const stop = await b.evaluate(
          "__formal.snapshot().tailingSession.recovery.pending||!__formal.snapshot().tailingSession.active",
        );
        if (stop) break;
        await b.evaluate("__formal.send([{id:'follow',args:{dist:'same'}}])");
        await until(
          "document.getElementById('settleHudStatus').textContent.includes('CHECK FINISHED')",
        );
        await closeSettlement(b);
      }
      await check(
        "首次普通失败进入可保存的追找状态",
        "__formal.snapshot().tailingSession.recovery.pending&&__formal.snapshot().dayPlan.remaining===2",
      );
      await shot("recovery");
      await b.send("Page.reload");
      await until('document.readyState==="complete"&&!!window.__formal?.ready');
      await check(
        "刷新保留补救与当前回合",
        '__formal.snapshot().tailingSession.recovery.pending&&!document.getElementById("collegeRecoveryControls").hidden',
      );
      const floor = await b.evaluate("__formal.save().floor");
      await b.evaluate(
        "document.getElementById('collegeRecover').click();true",
      );
      await until(
        `__formal.save().floor===${floor + 1}&&!__formal.snapshot().tailingSession.recovery.pending`,
      );
      await until(
        "document.getElementById('settleHudStatus').textContent.includes('CHECK FINISHED')",
      );
      await closeSettlement(b);
      await check(
        "真实补救一次不重扣入场点",
        "__formal.snapshot().tailingSession.recovery.used&&__formal.snapshot().dayPlan.remaining===2",
      );
      await shot("result");
      const saved = await b.evaluate("JSON.stringify(__formal.save())");
      await b.send("Page.reload");
      await until('document.readyState==="complete"&&!!window.__formal?.ready');
      await check(
        "补救后完整存档刷新往返",
        "JSON.stringify(__formal.save())===" + JSON.stringify(saved),
      );
      if (
        await b.evaluate("__formal.snapshot().tailingSession.pendingOutcome")
      ) {
        await b.evaluate(
          "document.getElementById('collegeReturn').click();true",
        );
        await until("!__formal.snapshot().tailingSession.pendingOutcome");
        await check(
          "确认结果后回到日程且不再扣点",
          '__formal.snapshot().dayPlan.remaining===2&&!document.getElementById("wxCollegeGuide").hidden',
        );
      }
      await check(
        "页面无横向溢出",
        "document.documentElement.scrollWidth<=innerWidth+1",
      );
      await check(
        "无脚本错误或误报同步故障",
        '__errors.length===0&&document.getElementById("wxSyncNotice").hidden',
      );
    }
  } finally {
    b.close();
    await new Promise((r) => server.close(r));
    fs.writeFileSync(
      path.join(out, "checks.json"),
      JSON.stringify(checks, null, 2) + "\n",
    );
  }
  console.log(`PASS ${checks.length} formal college browser checks`);
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
