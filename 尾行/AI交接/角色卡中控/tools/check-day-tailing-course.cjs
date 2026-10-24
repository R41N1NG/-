"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http");
const { browserSession } = require("./browser-session.cjs");
const { buildDayTailingPreview } = require("./build/day-tailing-preview"),
  { buildTrainingPreview } = require("./build/training-preview");
async function main() {
  const root = path.resolve(__dirname, ".."),
    file = buildDayTailingPreview().file,
    first = buildTrainingPreview().file,
    out = path.dirname(file),
    checks = [],
    b = await browserSession();
  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(fs.readFileSync(req.url === "/first" ? first : file));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = "http://127.0.0.1:" + server.address().port;
  try {
    await b.send("Page.addScriptToEvaluateOnNewDocument", {
      source:
        "window.__errors=[];addEventListener('error',e=>__errors.push(e.message));addEventListener('unhandledrejection',e=>__errors.push(String(e.reason)));",
    });
    async function ready(flag) {
      for (let n=0;n<150;n++) {
        await b.delay(100);
        try { if (await b.evaluate(`document.readyState==='complete' && !!window.${flag}`)) return; } catch {}
      }
      throw Error("教程页面未就绪："+flag+" "+await b.evaluate("JSON.stringify(window.__errors)"));
    }
    for (const width of [1100, 390, 320]) {
      await b.send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 1100,
        deviceScaleFactor: 2,
        mobile: false,
      });
      await b.send("Page.navigate", { url });
      await ready("__dayCourseReady");
      await b.evaluate("localStorage.clear();true");
      await b.send("Page.reload");
      await ready("__dayCourseReady");
      async function check(name, code) {
        const ok = !!(await b.evaluate(code));
        checks.push({ width, name, ok });
        if (!ok)
          throw Error(
            width +
              " " +
              name +
              " " +
              (await b.evaluate(
                "JSON.stringify({errors:window.__errors,title:document.title,body:document.body.innerText.slice(-500)})",
              )),
          );
      }
      async function click(sel) {
        await b.evaluate(
          `document.querySelector(${JSON.stringify(sel)}).click();true`,
        );
        await b.delay(100);
      }
      async function shot(name) {
        await b.evaluate(
          "window.scrollTo(0,0);document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))",
        );
        await b.delay(150);
        const metrics = await b.send("Page.getLayoutMetrics"),
          h = Math.ceil(metrics.cssContentSize.height);
        const img = await b.send("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: true,
          clip: { x: 0, y: 0, width, height: h, scale: 1 },
        });
        fs.writeFileSync(
          path.join(out, `${name}-${width}.png`),
          Buffer.from(img.data, "base64"),
        );
      }
      await check(
        "四页课程及全教程跳过入口可见",
        "window.__dayCourseReady&&document.querySelectorAll('#dayCourseNav button').length===4&&!document.getElementById('dayCourse').hidden&&!document.getElementById('dayCourseSkipAll').hidden",
      );
      const keys = ["day", "move", "entry", "follow"];
      for (let i = 0; i < 4; i++) {
        await click(`#dayCourseNav [data-page="${i}"]`);
        await check(
          "正确页号 " + keys[i],
          `document.getElementById('dayCourse').dataset.page==='${keys[i]}'`,
        );
        await check(
          "手机无横向溢出 " + keys[i],
          "document.documentElement.scrollWidth<=innerWidth+1",
        );
        await check(
          "高清截图与对应标注在图片范围内 " + keys[i],
          "(()=>{const h=[...document.querySelectorAll('.training-source-picture')].find(e=>e.getBoundingClientRect().width>0),f=h.querySelector('.training-shot-frame'),r=f.getBoundingClientRect(),m=f.querySelector('.training-shot-mark').getBoundingClientRect(),img=f.querySelector('img');return img.complete&&img.naturalWidth>=img.width*1.9&&m.left>=r.left-1&&m.top>=r.top-1&&m.right<=r.right+1&&m.bottom<=r.bottom+1})()",
        );
        if (i < 3) await shot(keys[i]);
      }
      for (const [i, name] of [
        "tailing",
        "recovery",
        "lost",
        "profile",
      ].entries()) {
        await click(`#dayCourseSituations [data-situation="${i}"]`);
        await check(
          "情形切换 " + name,
          `document.querySelector('#dayCourseSituations [data-situation="${i}"]').getAttribute('aria-pressed')==='true'`,
        );
        await shot(name);
      }
      await check(
        "阅读课程不产生游戏进度",
        "localStorage.length===0&&typeof window.WxGlue==='undefined'",
      );
      const selected = await b.evaluate(
        "(()=>{const h=[...document.querySelectorAll('.training-source-picture')].find(e=>e.getBoundingClientRect().width>0);return {id:[...document.querySelectorAll('.training-source-picture')].indexOf(h)}})()",
      );
      await b.evaluate(
        `document.querySelectorAll('.training-source-picture')[${selected.id}].querySelectorAll('.training-shot-choice')[1].click();true`,
      );
      await check(
        "点说明切换单项标注",
        "(()=>{const h=[...document.querySelectorAll('.training-source-picture')].find(e=>e.getBoundingClientRect().width>0),m=h.querySelectorAll('.training-shot-mark');return m[0].hidden&&!m[1].hidden})()",
      );
      await b.evaluate(
        `document.querySelectorAll('.training-source-picture')[${selected.id}].querySelector('.training-shot-enlarge').click();true`,
      );
      await check(
        "原截图放大可打开",
        "!!document.querySelector('.training-shot-zoom[open]')",
      );
      await b.evaluate(
        "document.querySelector('.training-shot-zoom').close();true",
      );
      await click("#dayCourseSkipAll");
      await b.send("Page.reload");
      await ready("__dayCourseReady");
      await check(
        "全跳过刷新后不再出现",
        "document.getElementById('dayCourse').hidden&&document.getElementById('dayCoursePicture').childElementCount===0&&JSON.parse(localStorage.getItem('wx_tutorial_preferences_v1')).skipAll===true",
      );
      await b.evaluate("localStorage.clear();true");
      await b.send("Page.navigate", { url: url + "/first" });
      await ready("__trainingPreviewReady");
      await b.evaluate("window.__trainingPreviewReady.then(()=>true)");
      await click('[data-training-page="2"]');
      await check(
        "第一组不再教旧二次移动确认",
        "!document.getElementById('zeroStep3').innerText.includes('地图点选只查看')&&document.getElementById('zeroStep3').innerText.includes('普通移动在地图中完成')",
      );
      await shot("first-location-revised");
      await click('[data-training-page="4"]');
      await check(
        "第一组清楚显示待结算线索",
        "document.querySelector('[data-training-pending]').textContent.includes('PI +3 待尾行结束结算')",
      );
      await shot("first-result-revised");
      await check("页面无运行报错", "window.__errors.length===0");
    }
  } finally {
    b.close();
    await new Promise((r) => server.close(r));
    fs.writeFileSync(
      path.join(out, "checks.json"),
      JSON.stringify(checks, null, 2) + "\n",
    );
  }
  console.log(`PASS ${checks.length} course browser checks`);
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
