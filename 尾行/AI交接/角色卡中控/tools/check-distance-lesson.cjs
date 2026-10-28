"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http");
const { browserSession } = require("./browser-session.cjs"),
  { buildDistanceLessonPreview } = require("./build/distance-lesson-preview"),
  { buildStaminaLessonPreview } = require("./build/stamina-lesson-preview");
async function main() {
  const file = buildDistanceLessonPreview().file,
    prior = buildStaminaLessonPreview().file,
    out = path.dirname(file),
    b = await browserSession(),
    checks = [];
  const source = JSON.parse(
    fs.readFileSync(path.join(out, "source/shots.json"), "utf8"),
  );
  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "text/html;charset=utf-8");
    res.end(
      fs.readFileSync(req.url.includes("stamina-tutorial") ? prior : file),
    );
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const origin = "http://127.0.0.1:" + server.address().port,
    url = origin + "/distance-tutorial/index.html";
  try {
    await b.send("Page.addScriptToEvaluateOnNewDocument", {
      source:
        "window.__errors=[];addEventListener('error',e=>__errors.push(e.message));addEventListener('unhandledrejection',e=>__errors.push(String(e.reason)));",
    });
    async function ready(flag = "__distanceLessonReady") {
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
              (await b.evaluate("JSON.stringify(__errors)")),
          );
      }
      async function shot(name) {
        await b.evaluate("scrollTo(0,0);document.fonts.ready");
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
        "默认同街与两组独立选择",
        '!document.getElementById("distanceLesson").hidden&&document.querySelectorAll("[data-distance]").length===4&&document.querySelectorAll("[data-signal]").length===3&&document.getElementById("distanceReadings").textContent.includes("DC 13")',
      );
      for (const [id, dc, heart] of [
        ["far", 15, 30],
        ["same", 13, 33],
        ["close", 13, 37],
        ["touch", 13, 41],
      ]) {
        await b.evaluate(
          `document.querySelector('[data-distance="${id}"]').click();true`,
        );
        await check(
          "真实距离数据 " + id,
          `document.getElementById('distanceReadings').textContent.includes('DC ${dc}')&&document.getElementById('distanceReadings').textContent.includes('16')&&document.getElementById('distanceCost').textContent.includes('30 → ${heart}')`,
        );
        await b.evaluate(
          'Promise.all([...document.querySelectorAll("#distanceCheckPicture img")].map(i=>i.decode()))',
        );
        await check(
          "2x原图与框选 " + id,
          `(()=>{const h=[...document.querySelectorAll('#distanceCheckPicture .training-source-picture')].find(e=>e.getBoundingClientRect().width>0),f=h.querySelector('.training-shot-frame'),r=f.getBoundingClientRect(),i=f.querySelector('img'),m=f.querySelector('.training-shot-mark').getBoundingClientRect();return i.complete&&i.naturalWidth>=i.width*1.9&&r.width<=i.width+1&&m.left>=r.left-1&&m.top>=r.top-1&&m.right<=r.right+1&&m.bottom<=r.bottom+1})()`,
        );
        const proof =
          source.shots[id + (width < 650 ? "-mobile" : "")].settlement;
        await check(
          "实际筹码与账目已完成 " + id,
          JSON.stringify(
            !!proof?.complete &&
              proof.chips.some(
                (s) => s.includes("敏捷属性") && s.includes("+5"),
              ) &&
              proof.chips.some(
                (s) => s.includes("不起眼") && s.includes("+1"),
              ) &&
              proof.ledger.length > 0 &&
              !proof.ledger.some((s) => s.includes("等待定格")),
          ),
        );
        await shot(id);
        if (id === "far" || id === "close") {
          const clip = await b.evaluate(
            "(()=>{const a=document.getElementById('distanceTabs').getBoundingClientRect(),z=document.getElementById('distanceCheckPicture').closest('figure').getBoundingClientRect();return{x:a.x+scrollX,y:a.y+scrollY,width:a.width,height:z.bottom-a.top}})()",
          );
          const image = await b.send("Page.captureScreenshot", {
            format: "png",
            captureBeyondViewport: true,
            clip: { ...clip, scale: 1 },
          });
          fs.writeFileSync(
            path.join(out, `comparison-${id}-${width}.png`),
            Buffer.from(image.data, "base64"),
          );
        }
      }
      await check(
        "敏捷减免范围明确",
        'document.getElementById("distanceAgilityCopy").textContent.includes("敏捷5")&&document.getElementById("distanceAgilityCopy").textContent.includes("敏捷8")&&document.getElementById("distanceAgilityDetail").textContent.includes("不会同时抵消心跳")',
      );
      for (const [id, word] of [
        ["pace", "步频"],
        ["turn", "回头"],
        ["run", "神色慌乱"],
      ]) {
        await b.evaluate(
          `document.querySelector('[data-signal="${id}"]').click();true`,
        );
        await check(
          "真实反应 " + id,
          `document.getElementById('distanceSignalReading').textContent.includes('${word}')&&document.querySelector('[data-signal="${id}"]').getAttribute('aria-pressed')==='true'`,
        );
        await check(
          "手机无溢出 " + id,
          "document.documentElement.scrollWidth<=innerWidth+1",
        );
      }
      await shot("signals");
      await b.evaluate(
        `(()=>{const h=[...document.querySelectorAll('#distanceCheckPicture .training-source-picture')].find(e=>e.getBoundingClientRect().width>0);h.querySelectorAll('.training-shot-choice')[1].click();return true})()`,
      );
      await check(
        "单项框选",
        `(()=>{const h=[...document.querySelectorAll('#distanceCheckPicture .training-source-picture')].find(e=>e.getBoundingClientRect().width>0),m=h.querySelectorAll('.training-shot-mark');return m[0].hidden&&!m[1].hidden})()`,
      );
      await b.evaluate(
        `document.querySelectorAll('#distanceCheckPicture .training-shot-enlarge')[${width < 650 ? 1 : 0}].click();true`,
      );
      await check(
        "原图可放大",
        '!!document.querySelector(".training-shot-zoom[open]")',
      );
      await b.evaluate(
        'document.querySelector(".training-shot-zoom").close();document.getElementById("distanceStopDetail").open=true;true',
      );
      await b.delay(200);
      await check(
        "主动结束按需加载并保留路线",
        'document.getElementById("distanceStopPicture").childElementCount>0&&document.getElementById("distanceStopCopy").textContent.includes("结束后仍保留1段")',
      );
      await check(
        "阅读不写存档",
        'localStorage.length===0&&typeof window.WxGlue==="undefined"',
      );
      await b.evaluate(
        'document.getElementById("distanceLessonComplete").click();true',
      );
      await check(
        "完成关闭本页",
        'document.getElementById("distanceLesson").hidden',
      );
      await b.send("Page.reload");
      await ready();
      await b.evaluate(
        'document.getElementById("distanceLessonSkipAll").click();true',
      );
      await b.send("Page.reload");
      await ready();
      await check(
        "全跳过刷新不挂图",
        'document.getElementById("distanceLesson").hidden&&document.getElementById("distanceEntryPicture").childElementCount===0&&document.getElementById("distanceTabs").childElementCount===0',
      );
      await check("页面无错误", "__errors.length===0");
      await b.send("Page.navigate", {
        url: origin + "/stamina-tutorial/index.html",
      });
      await ready("__staminaLessonReady");
      await check(
        "全跳过覆盖体力页",
        'document.getElementById("staminaLesson").hidden&&document.getElementById("staminaStepPictures").childElementCount===0',
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
  console.log(`PASS ${checks.length} distance lesson browser checks`);
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
