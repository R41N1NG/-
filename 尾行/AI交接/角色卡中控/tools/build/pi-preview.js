"use strict";
// 公开调参场景，使用正式引擎和正式结算台；不连接酒馆变量。
const fs = require("node:fs"),
  path = require("node:path");
const { createGame } = require("../../src/runtime/game");
const { defaultInit } = require("../../src/host/initial-state");
const { buildUI } = require("./ui");
const { browserSession } = require("../browser-session.cjs");
async function main() {
  const root = path.resolve(__dirname, "../.."),
    out = path.join(root, "previews/pi-familiarity");
  fs.mkdirSync(out, { recursive: true });
  const cases = {};
  for (const known of [false, true]) {
    let result;
    for (let n = 0; n < 100; n++) {
      const g = createGame({
        ...defaultInit(),
        sessionSalt: "pi-preview-" + n,
        dist: "close",
        stats: { pi: 20 },
        route: {
          id: "preview",
          nodes: ["school_gate_b", "store_24h_b"],
          known: [1, 0],
          here: 0,
          startTime: "21:00",
          times: ["2100", "2100"],
        },
      });
      if (known) g.revealNode(1);
      result = g.settleInput("", {
        actions: [{ id: "follow", args: { dist: "close" } }],
      });
      if (result.actions[0].band === "nat20") break;
    }
    if (result.actions[0].band !== "nat20") throw Error("未取得稳定的预览案例");
    cases[known ? "known" : "unknown"] = {
      snap: result.stats,
      pkg: result.package,
    };
  }
  const ui = buildUI({ preview: false, writePreview: false });
  const boot = `\n(()=>{WxStatusbarUI.mountStatusbar(document,window);const cases=${JSON.stringify(cases)};let seq=-9000;window.previewPi=async(id)=>{const dlg=document.getElementById('wx-settle-dialog');if(dlg?.open){dlg.close();await new Promise(r=>setTimeout(r,150));}WxStatusbar.render(cases[id].snap);WxStatusbar.settle({...cases[id].pkg,floor:seq--});};document.getElementById('piKnown').onclick=()=>previewPi('known');document.getElementById('piUnknown').onclick=()=>previewPi('unknown');})();`;
  const html = ui.template
    .replace("/* WX_STATUSBAR_CSS */", () => ui.css)
    .replace(
      '<main class="wx-standalone-main">',
      '<main class="wx-standalone-main"><p style="color:#d3bc7e">规则预览 · 构造场景：PI20、敏捷5、身后距离。对比相同天然20，当前相邻下一站已确认／未知。使用正式引擎，预览不写酒馆存档。</p><button id="piKnown">已掌握下一站</button> <button id="piUnknown">未知下一站</button>',
    )
    .replace("/* WX_STATUSBAR_SCRIPT */", () => ui.script + boot);
  fs.writeFileSync(path.join(out, "index.html"), html);
  fs.writeFileSync(
    path.join(out, "cases.json"),
    JSON.stringify(cases, null, 2) + "\n",
  );
  const b = await browserSession();
  const checks = [];
  try {
    for (const width of [1100, 390]) {
      await b.send("Emulation.setDeviceMetricsOverride", {
        width,
        height: width === 390 ? 2200 : 1000,
        deviceScaleFactor: 2,
        mobile: false,
      });
      await b.send("Page.setDocumentContent", { frameId: b.frameId, html });
      await b.delay(400);
      for (const id of ["known", "unknown"]) {
        await b.evaluate(`previewPi('${id}').then(()=>true)`);
        let ready = false;
        for (let n = 0; n < 130; n++) {
          await b.delay(100);
          ready = await b.evaluate(
            "document.getElementById('settleHudStatus').textContent.includes('CHECK FINISHED')",
          );
          if (ready) break;
        }
        if (!ready) throw Error("结算动画未完成");
        await b.delay(1800);
        const text = await b.evaluate(
          "document.getElementById('wx-settle-dialog').innerText",
        );
        const a = cases[id].pkg.actions[0];
        if (
          !text.includes("近距离暴露") ||
          !text.includes("整段结算") ||
          a.exposure.applied !== 3 ||
          a.mods.some((m) => m.src === "已掌握下一站") !== (id === "known")
        )
          throw Error(
            "规则预览验证失败：" +
              JSON.stringify({
                id,
                width,
                text,
                exposure: a.exposure,
                mods: a.mods,
              }),
          );
        checks.push({
          width,
          id,
          bonus: a.mods.find((m) => m.src === "已掌握下一站")?.v || 0,
          exposure: a.exposure.applied,
          receipt: cases[id].pkg.investigation,
        });
        await b.delay(800);
        const clip = await b.evaluate(
          "(()=>{const r=document.getElementById('wx-settle-dialog').getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}})()",
        );
        const shot = await b.send("Page.captureScreenshot", {
          format: "png",
          captureBeyondViewport: true,
          clip,
        });
        fs.writeFileSync(
          path.join(out, `${id}-${width}.png`),
          Buffer.from(shot.data, "base64"),
        );
      }
    }
  } finally {
    await b.close();
  }
  fs.writeFileSync(
    path.join(out, "checks.json"),
    JSON.stringify(checks, null, 2) + "\n",
  );
  console.log(JSON.stringify(checks));
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
