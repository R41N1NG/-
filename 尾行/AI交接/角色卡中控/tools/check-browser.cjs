"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  { spawn } = require("node:child_process");
const { buildUI } = require("./build/ui");
const { createGame } = require("../src/runtime/game");
const root = path.resolve(__dirname, "..");
const candidates = [
  process.env.WX_BROWSER,
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].filter(Boolean);
const binary = candidates.find((file) => fs.existsSync(file));
if (!binary) {
  console.error(
    "未找到浏览器，请设置 WX_BROWSER 为 Chrome 或 Edge 的可执行路径",
  );
  process.exit(1);
}
const work = path.join(root, "work/browser-check");
fs.mkdirSync(work, { recursive: true });
const profile = fs.mkdtempSync(path.join(work, "profile-"));
const stderr = fs.openSync(path.join(work, "browser.log"), "w");
const browser = spawn(
  binary,
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-background-networking",
    "--no-first-run",
    "--remote-debugging-port=0",
    "--user-data-dir=" + profile,
    "about:blank",
  ],
  { stdio: ["ignore", stderr, stderr], detached: process.platform !== "win32" },
);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
function stop() {
  try {
    process.platform === "win32"
      ? browser.kill()
      : process.kill(-browser.pid, "SIGKILL");
  } catch {}
}
const deadline = setTimeout(() => {
  stop();
  console.error("浏览器检查超时");
  process.exit(1);
}, 45000);
(async () => {
  const active = path.join(profile, "DevToolsActivePort");
  for (let i = 0; i < 80 && !fs.existsSync(active); i++) await delay(150);
  const port = fs.readFileSync(active, "utf8").split("\n")[0];
  const tab = await (
    await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
      method: "PUT",
    })
  ).json();
  socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  let seq = 0;
  const waiting = new Map();
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id) {
      const task = waiting.get(data.id);
      waiting.delete(data.id);
      data.error
        ? task?.reject(Error(data.error.message))
        : task?.resolve(data.result);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++seq;
      waiting.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails)
      throw Error(
        result.exceptionDetails.exception?.description ||
          result.exceptionDetails.text,
      );
    return result.result.value;
  };
  await send("Page.enable");
  const tree = await send("Page.getFrameTree");
  const { script, css } = buildUI({ preview: false, writePreview: false });
  const template = fs.readFileSync(
    path.join(root, "src/ui/template.html"),
    "utf8",
  );
  const html = template
    .replace(
      '<main class="wx-standalone-main">',
      '<main class="wx-standalone-main"><div id="chat"><div class="mes" mesid="0"><div class="mes_text">Opening text</div></div></div>',
    )
    .replace("/* WX_STATUSBAR_CSS */", () => css)
    .replace(
      "/* WX_STATUSBAR_SCRIPT */",
      () =>
        script.replace(/<\/script/gi, "<\\/script") +
        "\nWxStatusbarUI.mountStatusbar(document, window);",
    );
  await send("Page.setDocumentContent", {
    frameId: tree.frameTree.frame.id,
    html,
  });
  const snap = createGame({ sessionSalt: "browser-check" }).snapshot();
  await evaluate(
    `window.__errors=[]; window.addEventListener('error',e=>{if(e.message)window.__errors.push(e.message)}); window.addEventListener('unhandledrejection',e=>window.__errors.push(String(e.reason))); WxStatusbar.render(${JSON.stringify(snap)}); true;`,
  );
  const result = [];
  for (const width of [1100, 390]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    const checks = await evaluate(`(() => {
      const checks=[]; const ok=(name,value)=>checks.push({name,ok:!!value});
      const root=document.querySelector('.trpg');
      WxStatusbar.reset();
      const zero=document.getElementById('wx-zero-floor');
      ok('零楼挂在第0条消息内', zero.closest('.mes')?.getAttribute('mesid')==='0'&&!zero.hidden);
      ok('零楼不是弹窗',zero.tagName==='DIV'&&getComputedStyle(zero).position==='static');
      document.querySelector('#quickPane button').click();document.getElementById('zeroNextStep').click();
      ok('零楼切换到目标步骤',!document.getElementById('zeroStep2').hidden);
      ok('零楼宽度不超消息',zero.scrollWidth<=zero.clientWidth+2);
      document.getElementById('zeroPrevStep').click();
      ok('零楼可返回修改',!document.getElementById('zeroStep1').hidden);
      WxStatusbar.render(${JSON.stringify(snap)});
      ok('确认或续局后恢复开场',document.querySelector('#chat .mes_text').textContent==='Opening text'&&zero.hidden);

      WxStatusbar.reportSyncError({code:'HISTORY_OUTSIDE_WINDOW',location:{index:0,messageId:0,kind:'changed'}});
      const syncNotice=document.getElementById('wxSyncNotice');
      ok('同步提示显示真实聊天楼层',!syncNotice.hidden&&syncNotice.textContent.includes('聊天第 0 楼'));
      syncNotice.querySelector('[data-sync-action="locate"]').click();
      ok('同步提示可以高亮对应楼层',document.querySelector('#chat .mes').classList.contains('wx-sync-floor'));
      syncNotice.querySelector('[data-sync-action="copy"]').click();
      ok('同步诊断可复制',JSON.parse(syncNotice.querySelector('textarea').value).location.index===0);
      WxStatusbar.reset(); WxStatusbar.render(${JSON.stringify(snap)});

      ok('CSS 解析', [...document.styleSheets].some(s=>s.cssRules.length>100));
      ok('整页无横向溢出', document.documentElement.scrollWidth<=innerWidth+2);
      ok('快照渲染',document.getElementById('heartNum').textContent==='${snap.player.heart}');
      ok('档案对应当前目标', document.getElementById('vfTarget').textContent.includes('${snap.target.name}'));
      ok('未知属性不借用后台真值',[...document.querySelectorAll('#pattrs .av')].every(n=>n.textContent==='？'));
      ok('设备不显示样例在线状态',document.getElementById('devicesBody').textContent.includes('暂未接入')&&!document.getElementById('wx-devices-dialog').textContent.includes('在线'));
      ok('旧OL样例情报已清理',!document.getElementById('wx-profile-dialog').textContent.includes('两盒便当')&&!document.getElementById('wx-profile-dialog').textContent.includes('#OL-01'));

      for(const id of ['wx-terminal-dialog','wx-devices-dialog','wx-profile-dialog','wx-lies-dialog','wx-wanted-dialog','wx-item-dialog','wx-id-dialog','wx-settle-dialog']) {
        const d=document.getElementById(id); if(d.open)d.close(); d.showModal(); const open=d.open; d.close(); ok('弹窗 '+id,open&&!d.open);
      }
      document.getElementById('heartPillBtn').click();ok('心跳弹层打开',document.getElementById('heartPopoverCard').classList.contains('show'));document.getElementById('heartPopoverClose').click();ok('心跳弹层关闭',!document.getElementById('heartPopoverCard').classList.contains('show'));
      WxStatusbarUI.mountStatusbar(document,window);document.getElementById('heartPillBtn').click();ok('热重挂载无重复监听',document.getElementById('heartPopoverCard').classList.contains('show'));document.getElementById('heartPopoverClose').click();
      return checks;
    })()`);
    result.push(...checks.map((check) => ({ width, ...check })));
  }
  await evaluate(
    "WxStatusbar.reset(); document.querySelector('#quickPane button').click(); document.getElementById('zeroNextStep').click(); true;",
  );
  const screenshot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
  });
  fs.writeFileSync(
    path.join(work, "zero-floor-mobile.png"),
    Buffer.from(screenshot.data, "base64"),
  );
  await evaluate(`WxStatusbar.render(${JSON.stringify(snap)}); true;`);
  for (const id of ["wx-profile-dialog", "wx-devices-dialog"]) {
    await evaluate(`document.getElementById('${id}').showModal(); true;`);
    const shot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    fs.writeFileSync(
      path.join(work, id + "-mobile.png"),
      Buffer.from(shot.data, "base64"),
    );
    await evaluate(`document.getElementById('${id}').close(); true;`);
  }

  await evaluate(
    `WxStatusbar.settle({floor:1,actions:[{name:'检定',d20:15,total:20,dc:13,band:'success',mods:[],attr:{v:5}}],account:{},seg:{}}); true;`,
  );
  await delay(700);
  const errors = await evaluate("window.__errors");
  result.push({
    name: "Canvas/异步运行无错误",
    ok: errors.length === 0,
    errors,
  });
  await evaluate("WxStatusbar.dispose(); true;");
  fs.writeFileSync(
    path.join(work, "result.json"),
    JSON.stringify(result, null, 2),
  );
  for (const check of result)
    console.log(
      `${check.ok ? "OK" : "FAIL"} ${check.width || ""} ${check.name}`,
    );
  if (result.some((check) => !check.ok)) process.exitCode = 1;
})()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    clearTimeout(deadline);
    socket?.close();
    stop();
    fs.closeSync(stderr);
    try {
      fs.rmSync(profile, { recursive: true, force: true });
    } catch {}
  });
