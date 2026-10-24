"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http");
const { browserSession } = require("./browser-session.cjs"),
  { buildHeartLessonPreview } = require("./build/heart-lesson-preview");
async function main() {
  const file = buildHeartLessonPreview().file,
    out = path.dirname(file),
    checks = [],
    b = await browserSession();
  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(fs.readFileSync(file));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = "http://127.0.0.1:" + server.address().port;
  try {
    await b.send("Page.addScriptToEvaluateOnNewDocument", {
      source:
        "window.__errors=[];addEventListener('error',e=>__errors.push(e.message));addEventListener('unhandledrejection',e=>__errors.push(String(e.reason)));",
    });
    async function ready() {
      for (let n = 0; n < 120; n++) {
        await b.delay(100);
        try {
          if (
            await b.evaluate(
              "document.readyState==='complete'&&window.__heartLessonReady",
            )
          )
            return;
        } catch {}
      }
      throw Error("心跳教程未就绪");
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
      async function check(name, code) {
        const ok = !!(await b.evaluate(code));
        checks.push({ width, name, ok });
        if (!ok)
          throw Error(
            width +
              " " +
              name +
              " " +
              (await b.evaluate("JSON.stringify(window.__errors)")),
          );
      }
      async function shot(name) {
        await b.evaluate("window.scrollTo(0,0);document.fonts.ready");
        await b.delay(130);
        const m = await b.send("Page.getLayoutMetrics"),
          img = await b.send("Page.captureScreenshot", {
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
        "默认甜区示例明确区分50负荷与63BPM",
        "!document.getElementById('heartLesson').hidden&&document.getElementById('heartStateReadings').textContent.includes('50 / 100')&&document.getElementById('heartStateReadings').textContent.includes('63 BPM')&&document.getElementById('heartStateMod').textContent.includes('+1')",
      );
      await shot("sweet");
      for (const [id, value] of [
        ["calm", 0],
        ["buffer", 0],
        ["deform", -2],
        ["crash", -4],
      ]) {
        await b.evaluate(
          `document.querySelector('[data-heart-state="${id}"]').click();true`,
        );
        await check(
          "真实修正 " + id,
          `document.getElementById('heartStateMod').textContent.includes('${value}')&&document.querySelector('[data-heart-state="${id}"]').getAttribute('aria-pressed')==='true'`,
        );
        await check(
          "图片高清且框选不越界 " + id,
          "(()=>{const h=[...document.querySelectorAll('#heartStatePicture .training-source-picture')].find(e=>e.getBoundingClientRect().width>0),f=h.querySelector('.training-shot-frame'),r=f.getBoundingClientRect(),m=f.querySelector('.training-shot-mark').getBoundingClientRect(),i=f.querySelector('img');return i.complete&&i.naturalWidth>=i.width*1.9&&m.left>=r.left-1&&m.top>=r.top-1&&m.right<=r.right+1&&m.bottom<=r.bottom+1})()",
        );
        await shot(id);
      }
      await check(
        "手机无横向溢出",
        "document.documentElement.scrollWidth<=innerWidth+1",
      );
      await b.evaluate(
        "(()=>{const h=[...document.querySelectorAll('#heartStatePicture .training-source-picture')].find(e=>e.getBoundingClientRect().width>0);h.querySelectorAll('.training-shot-choice')[1].click();return true})()",
      );
      await check(
        "说明切换为单项框选",
        "(()=>{const h=[...document.querySelectorAll('#heartStatePicture .training-source-picture')].find(e=>e.getBoundingClientRect().width>0),m=h.querySelectorAll('.training-shot-mark');return m[0].hidden&&!m[1].hidden})()",
      );
      await b.evaluate(
        "[...document.querySelectorAll('#heartStatePicture .training-source-picture')].find(e=>e.getBoundingClientRect().width>0).querySelector('.training-shot-enlarge').click();true",
      );
      await check(
        "原图可放大",
        "!!document.querySelector('.training-shot-zoom[open]')",
      );
      await b.evaluate(
        "document.querySelector('.training-shot-zoom').close();document.getElementById('heartBreathDetail').open=true;true",
      );
      await b.delay(150);
      await check(
        "缓息真实结果与代价明确",
        "document.getElementById('heartBreathResult').textContent.includes('75 → 60')&&document.getElementById('heartBreathResult').textContent.includes('体力 -4')&&document.getElementById('heartBreathPicture').childElementCount>0",
      );
      await shot("breath");
      await b.evaluate(
        "document.querySelector('.heart-lesson-advanced').open=true;true",
      );
      await check(
        "优势甜区与70精细惩罚可同时成立",
        "document.getElementById('heartAdvancedCopy').textContent.includes('上限扩至70')&&document.getElementById('heartAdvancedCopy').textContent.includes('合计-1')",
      );
      await check(
        "阅读不写游戏进度",
        "localStorage.length===0&&typeof window.WxGlue==='undefined'",
      );
      await b.evaluate(
        "document.getElementById('heartLessonSkipAll').click();true",
      );
      await b.send("Page.reload");
      await ready();
      await check(
        "全跳过刷新后不加载课程图片",
        "document.getElementById('heartLesson').hidden&&document.getElementById('heartEntryPicture').childElementCount===0&&JSON.parse(localStorage.getItem('wx_tutorial_preferences_v1')).skipAll",
      );
      await check("页面无报错", "window.__errors.length===0");
    }
  } finally {
    b.close();
    await new Promise((r) => server.close(r));
    fs.writeFileSync(
      path.join(out, "checks.json"),
      JSON.stringify(checks, null, 2) + "\n",
    );
  }
  console.log(`PASS ${checks.length} heart lesson browser checks`);
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
