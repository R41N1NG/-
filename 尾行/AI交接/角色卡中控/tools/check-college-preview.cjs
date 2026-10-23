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
    for (const width of process.env.COLLEGE_WIDTH
      ? [Number(process.env.COLLEGE_WIDTH)]
      : [1100, 390]) {
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
        if (!ok)
          throw Error(
            width +
              " " +
              name +
              " " +
              (await b.evaluate(
                "JSON.stringify({snapshot:__collegePreview.snapshot().dayPlan,time:__collegePreview.snapshot().previewTime,player:__collegePreview.snapshot().cityMap.player,notice:document.getElementById('collegeNotice').textContent,errors:window.__previewErrors})",
              )),
          );
      }
      async function click(sel) {
        if (sel.includes("data-place-id")) {
          await b.evaluate(
            `(()=>{const e=document.querySelector(${JSON.stringify(sel)});const id=e.dataset.placeId;const n=__collegePreview.snapshot().cityMap.nodes.find(n=>n.id===id);document.querySelector('[data-map-district="'+n.district+'"]').click();document.querySelector(${JSON.stringify(sel)}).scrollIntoView({block:'center',inline:'center'});return true})()`,
          );
          await b.delay(120);
          const pos = await b.evaluate(
            `(()=>{const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`,
          );
          const hit = await b.evaluate(
            `(()=>{const e=document.elementFromPoint(${pos.x},${pos.y});return {id:e?.closest('[data-place-id]')?.dataset.placeId,tag:e?.outerHTML?.slice(0,220),width:innerWidth,height:innerHeight}})()`,
          );
          const expectedId = await b.evaluate(
            `document.querySelector(${JSON.stringify(sel)}).dataset.placeId`,
          );
          if (hit.id !== expectedId)
            throw Error(
              "点击落点不在目标地点：" +
                JSON.stringify({ pos, hit, expectedId }),
            );
          await b.send("Input.dispatchMouseEvent", {
            type: "mousePressed",
            button: "left",
            clickCount: 1,
            ...pos,
          });
          await b.send("Input.dispatchMouseEvent", {
            type: "mouseReleased",
            button: "left",
            clickCount: 1,
            ...pos,
          });
        } else
          await b.evaluate(
            `(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(typeof e.click==='function')e.click();else e.dispatchEvent(new MouseEvent('click',{bubbles:true}));return true})()`,
          );
        await b.delay(220);
      }
      async function shot(name) {
        await b.evaluate(
          "document.getElementById('wxCityMap').scrollIntoView({block:'start'});true",
        );
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
      await click('[data-place-id="university_canteen_b"]');
      await check(
        "到食堂才建立目视，移动耗1格、不扣点",
        "(()=>{const s=__collegePreview.snapshot();return s.cityMap.target.live&&s.dayPlan.remaining===4&&s.previewTime.used===1&&s.dayPlan.period===1&&document.getElementById('collegeSceneTitle').textContent==='午间用餐'})()",
      );
      await check(
        "时间格和地图地点报价可见",
        "document.getElementById('collegeTime').textContent.includes('2 / 3')&&document.querySelector('[data-place-id=university_library_b] title').textContent.includes('1格时间')",
      );
      await check(
        "没有移动胶囊或二次移动确认按钮",
        "!document.querySelector('[data-college-place]')&&[...document.querySelectorAll('[data-map-move]')].every(e=>getComputedStyle(e).display==='none')",
      );
      await shot("midday");
      await click("#collegePass");
      await click('[data-place-id="university_library_b"]');
      await check(
        "午后图书馆，旧食堂不再实时",
        "(()=>{const s=__collegePreview.snapshot();return s.dayPlan.period===2&&s.cityMap.target.live&&s.cityMap.target.placeId==='university_library_b'})()",
      );
      await click('[data-place-id="school_gate_b"]');
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
      await click('[data-place-id="store_24h_b"]');
      await check(
        "尾行中点击地图不跳转位置或重复扣费",
        "(()=>{const s=__collegePreview.snapshot();return s.cityMap.player.placeId==='school_gate_b'&&s.dayPlan.remaining===2&&s.dayPlan.activity?.kind==='tailing'&&__collegePreview.save().route.here===0})()",
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
      await click('[data-place-id="school_gate_b"]');
      await click("#collegePass");
      await check(
        "跳过机会不泄露住处、不扣入场费",
        "(()=>{const s=__collegePreview.snapshot();return s.dayPlan.period===4&&s.dayPlan.remaining===4&&!s.cityMap.target.live&&!s.profile.facts.some(f=>f.slot==='home')})()",
      );
      await b.evaluate("__collegePreview.reset();true");
      await click('[data-place-id="university_canteen_b"]');
      await click('[data-place-id="school_gate_b"]');
      await click('[data-place-id="university_library_b"]');
      await check(
        "3次同区移动跨入午后，并按到达时间见到目标",
        "(()=>{const s=__collegePreview.snapshot();return s.dayPlan.period===2&&s.previewTime.used===0&&s.dayPlan.remaining===4&&s.cityMap.target.live})()",
      );
      await shot("arrival");
      await click("#collegePass");
      await click('[data-place-id="university_canteen_b"]');
      await click('[data-place-id="university_library_b"]');
      await click('[data-place-id="school_gate_b"]');
      await check(
        "晚间最后1格到校门已到子夜，错过入口",
        "(()=>{const s=__collegePreview.snapshot();return s.dayPlan.period===4&&s.dayPlan.remaining===4&&!s.cityMap.target.live&&document.getElementById('collegeStart').disabled})()",
      );
      await shot("missed");
      await b.evaluate("__collegePreview.reset();true");
      await click('[data-place-id="metro_hub_a"]');
      await check(
        "跨区移动用2格，行动点不变",
        "__collegePreview.snapshot().previewTime.used===2&&__collegePreview.snapshot().dayPlan.remaining===4",
      );
      await click('[data-place-id="university_library_b"]');
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
      await check(
        "地图地点单击即移动并扣时间格",
        "(()=>{const s=__collegePreview.snapshot();return s.cityMap.player.placeId==='school_gate_b'&&s.previewTime.used===2&&s.dayPlan.period===2&&s.dayPlan.remaining===4})()",
      );
      await click('[data-action-id="daily.pass"]');
      await check(
        "原日程行动同样清格并进入新时段",
        "(()=>{const s=__collegePreview.snapshot();return s.dayPlan.period===3&&s.previewTime.used===0&&!document.getElementById('collegeStart').disabled})()",
      );
      await b.evaluate("__collegePreview.reset();true");
      await click('[data-place-id="campus_bookshop_b"]');
      await check(
        "可直接前往原快捷列表之外的公开地点",
        "__collegePreview.snapshot().cityMap.player.placeId==='campus_bookshop_b'&&__collegePreview.snapshot().previewTime.used===1",
      );
      await b.evaluate(
        "document.querySelector('[data-place-id=university_sports_b]').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));true",
      );
      await b.delay(220);
      await check(
        "键盘激活地图地点也只移动一次",
        "__collegePreview.snapshot().cityMap.player.placeId==='university_sports_b'&&__collegePreview.snapshot().previewTime.used===2",
      );
      await b.evaluate(
        "document.querySelector('[data-place-id=school_gate_b]').scrollIntoView({block:'center',inline:'center'});true",
      );
      await b.delay(120);
      const point = await b.evaluate(
        "(()=>{const r=document.querySelector('[data-place-id=school_gate_b]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()",
      );
      await b.send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        button: "left",
        clickCount: 1,
        ...point,
      });
      await b.send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        buttons: 1,
        x: point.x + 30,
        y: point.y,
      });
      await b.send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        button: "left",
        clickCount: 1,
        x: point.x + 30,
        y: point.y,
      });
      await b.delay(220);
      await check(
        "拖动地图不会误触移动耗时",
        "__collegePreview.snapshot().cityMap.player.placeId==='university_sports_b'&&__collegePreview.snapshot().previewTime.used===2",
      );
      await b.send("Emulation.setTouchEmulationEnabled", { enabled: true });
      await b.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [point],
      });
      await b.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await b.delay(400);
      await b.send("Emulation.setTouchEmulationEnabled", { enabled: false });
      await check(
        "触屏点按地图移动，并按抵达时段结算",
        "__collegePreview.snapshot().cityMap.player.placeId==='school_gate_b'&&__collegePreview.snapshot().dayPlan.period===2&&__collegePreview.snapshot().previewTime.used===0",
      );
      await click('[data-place-id="school_gate_b"]');
      await check(
        "重复点击当前位置不耗时",
        "__collegePreview.snapshot().previewTime.used===0",
      );
      await click('[data-place-id="unit_stairs_b"]');
      await check(
        "私人未知地点仍不能点击直达或泄露门牌",
        "__collegePreview.snapshot().cityMap.player.placeId==='school_gate_b'&&__collegePreview.snapshot().previewTime.used===0&&!__collegePreview.snapshot().profile.facts.some(f=>f.slot==='home')",
      );
      await click('[data-map-district="all"]');
      await click('[data-region="C"]');
      await check(
        "点击地区可浏览，分区切换不耗时",
        "__collegePreview.snapshot().previewTime.used===0&&__collegePreview.snapshot().cityMap.player.placeId==='school_gate_b'",
      );
      await check(
        "地图旁持续显示点击方式和时间规则",
        "document.getElementById('collegeMapStatus').textContent.length>0",
      );
      await check("页面没有运行错误", "window.__previewErrors.length===0");
    }
  } finally {
    b.close();
    server.close();
    fs.writeFileSync(
      path.join(out, "checks.json"),
      JSON.stringify(checks, null, 2) + "\n",
    );
  }
  console.log(`PASS ${checks.length} browser checks`);
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
