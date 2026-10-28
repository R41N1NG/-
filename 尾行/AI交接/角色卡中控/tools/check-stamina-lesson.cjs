"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http");
const { browserSession } = require("./browser-session.cjs"),
  { buildStaminaLessonPreview } = require("./build/stamina-lesson-preview"),
  { buildHeartLessonPreview } = require("./build/heart-lesson-preview");
async function main() {
  const file = buildStaminaLessonPreview().file,
    heart = buildHeartLessonPreview().file,
    out = path.dirname(file),
    b = await browserSession(),
    checks = [];
  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "text/html;charset=utf-8");
    res.end(fs.readFileSync(req.url.includes("heart-tutorial") ? heart : file));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const origin = "http://127.0.0.1:" + server.address().port,
    url = origin + "/stamina-tutorial/index.html";
  try {
    await b.send("Page.addScriptToEvaluateOnNewDocument", {
      source:
        "window.__lessonErrors=[];addEventListener('error',e=>__lessonErrors.push(e.message));addEventListener('unhandledrejection',e=>__lessonErrors.push(String(e.reason)));",
    });
    async function ready(flag = "__staminaLessonReady") {
      for (let i = 0; i < 150; i++) {
        await b.delay(100);
        try {
          if (
            await b.evaluate(
              `document.readyState==='complete'&&!!window.${flag}`,
            )
          )
            return;
        } catch {}
      }
      throw Error("教程未就绪");
    }
    for (const width of [1100, 390, 320]) {
      await b.send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 1100,
        deviceScaleFactor: 2,
        mobile: false,
      });
      await b.send("Page.navigate", { url });
      await ready();
      await b.evaluate("localStorage.clear();true");
      await b.send("Page.reload");
      await ready();
      async function check(name, expr) {
        const ok = !!(await b.evaluate(expr));
        checks.push({ width, name, ok });
        if (!ok)
          throw Error(
            width +
              " " +
              name +
              " " +
              (await b.evaluate("JSON.stringify(__lessonErrors)")),
          );
      }
      async function shot(name) {
        await b.evaluate("scrollTo(0,0);document.fonts.ready");
        await b.delay(150);
        const m = await b.send("Page.getLayoutMetrics");
        const img = await b.send("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: true,
          clip: {
            x: 0,
            y: 0,
            width,
            height: Math.ceil(m.cssContentSize.height),
            scale: 1,
          },
        });
        fs.writeFileSync(
          path.join(out, `${name}-${width}.png`),
          Buffer.from(img.data, "base64"),
        );
      }
      await check(
        "四步连续案例与真实费用",
        '!document.getElementById("staminaLesson").hidden&&document.querySelectorAll("[data-stamina-step]").length===4&&document.getElementById("staminaFollowCost").textContent.includes("4")&&document.getElementById("staminaScanCost").textContent.includes("2")&&document.getElementById("staminaPhotoCost").textContent.includes("3")',
      );
      await check(
        "样例不是默认低体力开局",
        'document.body.textContent.includes("新建角色正常以满体力开局")&&document.getElementById("staminaStepReadings").textContent.includes("28 / 115")',
      );
      await check(
        "首步不能继续向前",
        'document.getElementById("staminaPrev").disabled',
      );
      await shot("start");
      for (const [index, name, read] of [
        [1, "check", "28 → 23"],
        [2, "supply", "23 → 43"],
        [3, "continue", "＋3 → ＋1"],
      ]) {
        await b.evaluate(
          `document.querySelector('[data-stamina-step="${index}"]').click();true`,
        );
        await check(
          "真实数据 " + name,
          `document.getElementById('staminaStepReadings').textContent.includes(${JSON.stringify(read)})&&document.querySelector('[data-stamina-step="${index}"]').getAttribute('aria-pressed')==='true'`,
        );
        await b.evaluate(
          'Promise.all([...document.querySelectorAll("#staminaStepPictures img")].map(i=>i.decode()))',
        );
        await check(
          "原图2x、实际尺寸、全部框选边界 " + name,
          `(()=>{const visible=[...document.querySelectorAll('#staminaStepPictures .training-source-picture')].filter(e=>e.getBoundingClientRect().width>0);return visible.length>0&&visible.every(h=>{const f=h.querySelector('.training-shot-frame'),r=f.getBoundingClientRect(),i=f.querySelector('img');return i.complete&&i.naturalWidth>=i.width*1.9&&r.width<=i.width+1&&[...f.querySelectorAll('.training-shot-mark')].filter(m=>!m.hidden).every(m=>{const q=m.getBoundingClientRect();return q.left>=r.left-1&&q.top>=r.top-1&&q.right<=r.right+1&&q.bottom<=r.bottom+1})})})()`,
        );
        await check(
          "无横向溢出 " + name,
          "document.documentElement.scrollWidth<=innerWidth+1",
        );
        await shot(name);
      }
      await check(
        "补给只减少疲劳不保证成功",
        'document.getElementById("staminaStepCopy").textContent.includes("不保证")&&document.getElementById("staminaNext").disabled',
      );
      await b.evaluate(
        `(()=>{const h=[...document.querySelectorAll('#staminaStepPictures .training-source-picture')].find(e=>e.getBoundingClientRect().width>0);h.querySelectorAll('.training-shot-choice')[1].click();return true})()`,
      );
      await check(
        "说明单项框选",
        `(()=>{const h=[...document.querySelectorAll('#staminaStepPictures .training-source-picture')].find(e=>e.getBoundingClientRect().width>0),a=h.querySelectorAll('.training-shot-mark');return a[0].hidden&&!a[1].hidden})()`,
      );
      await b.evaluate(
        `document.querySelectorAll('#staminaStepPictures .training-shot-enlarge')[${width < 650 ? 1 : 0}].click();true`,
      );
      await check(
        "原图可放大",
        '!!document.querySelector(".training-shot-zoom[open]")',
      );
      await b.evaluate(
        'document.querySelector(".training-shot-zoom").close();document.getElementById("staminaLesson").dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowLeft",bubbles:true}));true',
      );
      await check(
        "键盘向前翻阅",
        'document.getElementById("staminaStepCount").textContent==="3 / 4"',
      );
      await b.evaluate(
        'document.getElementById("staminaRulesDetail").open=true;document.getElementById("staminaRestDetail").open=true;true',
      );
      await b.delay(200);
      await check(
        "耗尽与休息图按需加载",
        'document.getElementById("staminaEmptyPicture").childElementCount>0&&document.getElementById("staminaRestPicture").childElementCount>0',
      );
      await check(
        "休息代价和推进时段明确",
        'document.getElementById("staminaRestResult").textContent.includes("28 → 78")&&document.getElementById("staminaRestResult").textContent.includes("4 → 3")&&document.getElementById("staminaRestResult").textContent.includes("午后 → 晚间")',
      );
      await check(
        "阅读不写存档也不建立游戏桥",
        'localStorage.length===0&&typeof window.WxGlue==="undefined"',
      );
      await b.evaluate(
        'document.getElementById("staminaLessonComplete").click();true',
      );
      await check(
        "完成关闭本页",
        'document.getElementById("staminaLesson").hidden&&!document.getElementById("staminaLessonDone").hidden',
      );
      await b.send("Page.reload");
      await ready();
      await b.evaluate(
        'document.getElementById("staminaLessonSkipAll").click();true',
      );
      await b.send("Page.reload");
      await ready();
      await check(
        "全跳过刷新后不挂图或步骤",
        'document.getElementById("staminaLesson").hidden&&document.getElementById("staminaStepPictures").childElementCount===0&&document.getElementById("staminaSteps").childElementCount===0&&JSON.parse(localStorage.getItem("wx_tutorial_preferences_v1")).skipAll',
      );
      await check("本页无运行错误", "__lessonErrors.length===0");
      await b.send("Page.navigate", {
        url: origin + "/heart-tutorial/index.html",
      });
      await ready("__heartLessonReady");
      await check(
        "全跳过同时覆盖心跳课",
        'document.getElementById("heartLesson").hidden&&document.getElementById("heartEntryPicture").childElementCount===0',
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
  console.log(`PASS ${checks.length} stamina lesson browser checks`);
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
