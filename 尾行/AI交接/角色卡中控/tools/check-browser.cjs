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
}, 60000);
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
  const { script, css, template } = buildUI({ preview: false, writePreview: false });
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
      ok('常驻条不虚构探头锁定',!document.getElementById('routeStrikeTag')&&!document.querySelector('.trpg').textContent.includes('探头锁定'));
      ok('路线进度不冒充收摊倒计时',!document.getElementById('routeRemain').textContent.includes('收摊')&&!document.getElementById('routeRemain').textContent.includes('步'));
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
  // 教程首页：同一零楼与建局管线。首页不建档，确认载入后续局不重放。
  const briefPreview = require("./build/training-preview.js").buildTrainingPreview();
  await send("Page.setDocumentContent", {
    frameId: tree.frameTree.frame.id,
    html: fs.readFileSync(briefPreview.file, "utf8"),
  });
  await evaluate("window.__trainingPreviewReady");
  for (const width of [1100, 390, 320]) {
    await send("Emulation.setDeviceMetricsOverride", {width,height:900,deviceScaleFactor:1,mobile:false});
    const checks = await evaluate(`(()=>{
      const checks=[];const ok=(name,value)=>checks.push({name,ok:!!value});
      WxStatusbar.reset();
      ok('简报不能越过角色与目标选择',document.getElementById('zeroStepTab3').disabled);
      document.querySelector('#quickPane [data-preset="otaku"]').click();
      document.getElementById('zeroNextStep').click();
      const name=document.getElementById('tDetailRealName').textContent;
      document.getElementById('createConfirm').click();
      const brief=document.getElementById('zeroStep3');
      ok('目标选择后进入零楼教程首页',!brief.hidden&&document.getElementById('wx-zero-floor').closest('.mes')?.getAttribute('mesid')==='0');
      ok('简报同步实际身份与目标',document.getElementById('trainingBriefIdentity').textContent==='阿宅'&&document.getElementById('trainingBriefTarget').textContent==='独居女大学生');
      ok('简报不提前建局或泄露目标档案',!__trainingPreviewStore().wx_save&&!brief.textContent.includes(name)&&!brief.textContent.includes(document.getElementById('tDetailWindow').textContent));
      document.getElementById('trainingBriefBack').click();
      ok('返回目标不重抽人物',!document.getElementById('zeroStep2').hidden&&document.getElementById('tDetailRealName').textContent===name);
      document.querySelector('[data-tid="ol"]').click();document.getElementById('createConfirm').click();
      ok('换目标后简报更新类型',document.getElementById('trainingBriefTarget').textContent==='疲惫的OL');
      document.getElementById('trainingBriefBack').click();document.querySelector('[data-tid="college"]').click();document.getElementById('createConfirm').click();
      ok('教程首页适配窄屏且可操作',document.documentElement.scrollWidth<=innerWidth+2&&brief.scrollWidth<=brief.clientWidth+2&&!document.getElementById('trainingBriefNext').disabled);
      const diagram=document.getElementById('trainingBriefDiagram');
      ok('PPT 图解手机也保留高亮框与箭头',diagram.getBoundingClientRect().width>200&&diagram.getBoundingClientRect().height>100&&getComputedStyle(diagram).display!=='none'&&diagram.querySelector('img[src^="data:image/jpeg"]')&&diagram.querySelector('.training-shot-mark'));
      ok('PPT 首步明确且示例不冒充实时定位',brief.textContent.includes('打开城市地图，确认自己在哪里')&&brief.textContent.includes('教学示意，非实时定位')&&!diagram.querySelector('button, [tabindex], .wx-map-target, .wx-map-player'));
      return checks;
    })()`);
    result.push(...checks.map(check=>({width,...check})));
    const clip=await evaluate(`(()=>{const r=document.getElementById('wx-zero-floor').getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1};})()`);
    const shot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:true,clip});
    fs.writeFileSync(path.join(path.dirname(briefPreview.file),width===1100?"desktop.png":width===390?"mobile.png":"mobile-320.png"),Buffer.from(shot.data,"base64"));
    for (let page = 1; page < 5; page++) {
      const pageChecks = await evaluate(`(()=>{
        const checks=[];const ok=(name,value)=>checks.push({name,ok:!!value});
        document.querySelector('[data-training-page="${page}"]').click();
        const brief=document.getElementById('zeroStep3');
        ok('教程第 ${page+1} 页可到达且只显示一页',brief.dataset.trainingPage==='${page}'&&document.querySelectorAll('[data-training-slide]:not([hidden])').length===1);
        ok('教程第 ${page+1} 页窄屏不溢出',document.documentElement.scrollWidth<=innerWidth+2&&brief.scrollWidth<=brief.clientWidth+2);
        if (${page}===2) {
          const map=document.getElementById('trainingBriefLocatedMap');
          ok('示例蓝橙位置点无字且同地分开',[...map.querySelectorAll('img[src^="data:image/jpeg"]')].filter(i=>i.getBoundingClientRect().width>0).length===2&&map.textContent.includes('最后目击')&&map.textContent.includes('真实跟缀失败'));
        }
        if (${page}===3) {
          const send=document.querySelector('[data-training-send]'),output=document.querySelector('[data-training-output]');
          document.getElementById('trainingBriefNarration').value='我已经知道了她的住址';
          ok('文字不能替代点选示范动作',send.disabled&&output.hidden);
          [...document.querySelectorAll('[data-training-select]')].find(b=>b.getBoundingClientRect().width>0).click();
          ok('选中打量只入队未执行',!send.disabled&&output.hidden);
          send.click();const text=output.textContent;send.click();
          ok('示范发送有真实结果且不累加或建局',!output.hidden&&text.includes('情报 PI +2')&&text===output.textContent&&send.disabled&&!__trainingPreviewStore().wx_save);
          document.getElementById('trainingBriefNarration').value='我留意她的步幅和周围动静。';
        }
        if (${page}===4) {
          ok('成果显示新增观察与未知边界',document.querySelector('[data-training-record]').textContent.includes('侧向身形清晰')&&document.querySelector('.training-result-example').textContent.includes('本例新增档案条目：0 条'));
          ok('最后一页才出现载入按钮',!document.getElementById('trainingBriefStart').hidden&&document.getElementById('trainingBriefNext').hidden);
        }
        window.scrollTo(0,0);return checks;
      })()`);
      result.push(...pageChecks.map(check=>({width,...check})));
      if(page===3){
        for(let i=0;i<100;i++){
          if(await evaluate("document.getElementById('settleHudStatus').textContent.includes('CHECK FINISHED')"))break;
          await delay(100);
        }
        result.push({width,name:'示范发送调用原判定台并标出三部分',ok:await evaluate("document.getElementById('wx-settle-dialog').open&&document.getElementById('wx-settle-dialog').dataset.trainingDemo==='true'&&document.getElementById('settleDieCanvas').width>0&&document.getElementById('settleAuto').disabled")});
        result.push({width,name:'判定三部分均在面板内且手机纵向排列',ok:await evaluate("(()=>{const d=document.getElementById('wx-settle-dialog').getBoundingClientRect(),panels=[...document.querySelectorAll('#wx-settle-dialog .wing-left,#wx-settle-dialog .stage-center,#wx-settle-dialog .wing-right')].map(e=>e.getBoundingClientRect());return panels.every(r=>r.left>=d.left&&r.right<=d.right+1)&&(innerWidth>760||panels.every((r,i)=>!i||r.top>=panels[i-1].bottom-1))})()")});
        await delay(700);
        const dialogClip=await evaluate("(()=>{const r=document.getElementById('wx-settle-dialog').getBoundingClientRect();return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}})()");
        const dialogShot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:dialogClip});
        fs.writeFileSync(path.join(path.dirname(briefPreview.file),'settlement-live-'+width+'.png'),Buffer.from(dialogShot.data,'base64'));
        await evaluate("document.getElementById('settleAck').click();true");
      }

      const pageClip=await evaluate(`(()=>{const r=document.getElementById('wx-zero-floor').getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1};})()`);
      const pageShot=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:true,clip:pageClip});
      const variant=width===1100?"desktop":width===390?"mobile":"mobile-320";
      fs.writeFileSync(path.join(path.dirname(briefPreview.file),`page-${page+1}-${variant}.png`),Buffer.from(pageShot.data,"base64"));
    }

  }
  const briefEnd = await evaluate(`(async()=>{
    const checks=[];const ok=(name,value)=>checks.push({name,ok:!!value});
    document.getElementById('trainingBriefStart').click();document.getElementById('trainingBriefStart').click();
    ok('载入期间防止重复确认',document.getElementById('trainingBriefStart').disabled);
    await window.__trainingPreviewOperation;await Promise.resolve();
    ok('确认后沿原管线保存并关闭简报',__trainingPreviewStore().wx_save?.targetId==='college'&&__trainingPreviewStore().wx_save.floor===0&&document.getElementById('wx-zero-floor').hidden);
    WxStatusbarUI.mountStatusbar(document,window);await new Promise(resolve=>setTimeout(resolve,0));
    ok('续局不重弹简报或重建人物',document.getElementById('wx-zero-floor').hidden&&__trainingPreviewStore().wx_save.floor===0);
    WxStatusbar.dispose();return checks;
  })()`);
  result.push(...briefEnd);
  // 跳过入口同样必须接正式建局，且不会把教学示范的收益带入新局。
  await send("Page.setDocumentContent", {frameId:tree.frameTree.frame.id,html:fs.readFileSync(briefPreview.file,"utf8")});
  const skipChecks=await evaluate(`(async()=>{
    await window.__trainingPreviewReady;
    const checks=[];const ok=(name,value)=>checks.push({name,ok:!!value});
    document.getElementById('trainingBriefSkip').click();document.getElementById('trainingBriefSkip').click();
    ok('跳过教程的载入期间也禁用重复点击',document.getElementById('trainingBriefSkip').disabled);
    await window.__trainingPreviewOperation;await Promise.resolve();
    const saved=__trainingPreviewStore().wx_save;
    ok('跳过沿正式管线建局且不带示例情报',saved?.targetId==='college'&&saved.floor===0&&saved.ledgerState.pi===0&&document.getElementById('wx-zero-floor').hidden);
    WxStatusbar.dispose();return checks;
  })()`);
  result.push(...skipChecks);

  // 用户可打开的独立日程预览：同一正式 UI、实际引擎往返快照。
  const preview = require("./build/day-preview.js").buildDayPreview();
  await send("Page.setDocumentContent", {
    frameId: tree.frameTree.frame.id,
    html: fs.readFileSync(preview.file, "utf8"),
  });
  for (const width of [1100, 390, 320]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });
    const checks = await evaluate(`(async () => {
      await window.__dailyPreviewReady;
      const checks=[]; const ok=(name,value)=>checks.push({name,ok:!!value});
      document.querySelector('[data-state-index="0"]').click(); await window.__dailyPreviewReady;
      ok('无目击记录不画目标点',!document.querySelector('.wx-map-target'));
      ok('日程开局 4/4',document.getElementById('wxDayAp').textContent==='4'&&document.getElementById('wxDayBudget').textContent==='4');
      ok('五时段与早间标记',document.querySelectorAll('#wxDayPeriods li').length===5&&document.querySelector('#wxDayPeriods [aria-current="step"]').textContent==='早间');
      ok('日程待机不显示目标距离或原尾行胶囊',document.getElementById('distStat').hidden&&document.getElementById('wxCapsuleBar').hidden);
      ok('统一活动区展示七项费用',document.querySelectorAll('#wxDailyActionGrid button').length===7&&document.querySelector('[data-action-id="daily.rest"]').textContent.includes('1 点')&&document.querySelector('[data-action-id="daily.tailing"]').textContent.includes('2 点'));
      ok('未接内容禁用且说明原因', ['daily.talk','daily.tailing'].every(id=>document.querySelector('[data-action-id="'+id+'"]').disabled));
      document.querySelector('[data-action-id="daily.rest"]').click(); await window.__dailyPreviewOperation; await Promise.resolve();
      ok('休息实际扣点并推进时段',document.getElementById('wxDayAp').textContent==='3'&&document.querySelector('#wxDayPeriods [aria-current="step"]').textContent==='午间');
      await window.__dailyPreviewSync.rebuild(); await window.__dailyPreviewSync.reconcile();
      ok('重读存档保留休息结果',document.getElementById('wxDayAp').textContent==='3'&&document.getElementById('wxDailyStatus').textContent.includes('休息完成'));
      document.querySelector('[data-action-id="daily.pass"]').click(); await window.__dailyPreviewOperation; await Promise.resolve();
      ok('度过时段零消耗推进一次',document.getElementById('wxDayAp').textContent==='3'&&document.querySelector('#wxDayPeriods [aria-current="step"]').textContent==='午后');
      document.querySelector('[data-state-index="0"]').click(); await window.__dailyPreviewReady;
      const before=(await getVariables()).wx_save;
      const canvas=document.getElementById('wxCityCanvas');
      ok('城市交通层含地铁市区公交和郊外公路',document.querySelector('[data-transit-line="metro_1"]')&&document.querySelector('[data-transit-line="night_bus"]')&&document.querySelector('[data-transit-line="river_express"]')&&document.querySelector('[data-transit-line="north_road"]'));
      document.querySelector('[data-map-transit]').click();
      ok('关闭交通不移位或扣点',!document.querySelector('[data-transit-line]')&&JSON.stringify((await getVariables()).wx_save)===JSON.stringify(before));
      document.querySelector('[data-map-transit]').click();
      document.querySelector('[data-map-district="A"]').click();document.querySelector('[data-place-id="central_mall_a"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));
      ok('新增设施说明公共入口而不冒充已开商店',document.getElementById('wxCityInfo').textContent.includes('场所内活动暂未开放')&&!document.querySelector('[data-map-market]')&&JSON.stringify((await getVariables()).wx_save)===JSON.stringify(before));
      document.querySelector('[data-map-district="B"]').click();
      ok('街区地图有建筑道路绿地与江面',document.querySelectorAll('.wx-map-block').length>30&&document.querySelector('.wx-map-street .road-surface')&&document.querySelector('.wx-map-water')&&document.querySelector('.wx-map-block .tree'));
      ok('默认完整街区适合屏幕',canvas.scrollWidth<=canvas.clientWidth+2);
      document.querySelector('[data-map-zoom="detail"]').click();
      ok('放大地图可横向查看，整页不溢出',canvas.scrollWidth>canvas.clientWidth&&document.documentElement.scrollWidth<=innerWidth+2);
      document.querySelector('[data-map-zoom="fit"]').click();
      ok('缩放浏览不改存档',JSON.stringify((await getVariables()).wx_save)===JSON.stringify(before)&&canvas.scrollWidth<=canvas.clientWidth+2);

      document.querySelector('[data-action-id="daily.work"]').click();
      ok('已有工作入口可选，不扣浏览费用',!document.getElementById('wxEconomyInput').hidden&&document.querySelector('input[value="remote"]')&&document.getElementById('wxDayAp').textContent==='4');
      // 模拟轮询刷新：不能使等待确认的选择失效。
      await window.__dailyPreviewSync.reconcile();
      const remote=document.querySelector('input[value="remote"]');remote.checked=true;remote.dispatchEvent(new Event('change'));
      document.querySelector('[data-economy-submit]').click(); await Promise.resolve(); await window.__dailyPreviewOperation; await Promise.resolve();
      ok('阿宅接单实际获得264且一天一班',(await getVariables()).wx_save.ledgerState.cash===before.ledgerState.cash+264&&document.getElementById('wxDayAp').textContent==='3'&&document.querySelector('[data-action-id="daily.work"]').disabled);
      document.querySelector('[data-action-id="daily.shop"]').click();
      const quantity=document.querySelector('[data-item-id="bento"]');quantity.value='2';quantity.dispatchEvent(new Event('input'));
      ok('线上商城仅售食品补给',!document.querySelector('[data-item-id="lockpick"]')&&!document.querySelector('[data-item-id="climb_gear"]')&&document.querySelectorAll('#wxEconomyInput [data-item-id]').length===3);
      ok('购物提前显示一批总价与行动费用',document.querySelector('[data-economy-total]').textContent.includes('总价 40')&&document.querySelector('[data-economy-total]').textContent.includes('行动点 1'));
      document.querySelector('[data-economy-submit]').click(); await Promise.resolve(); await window.__dailyPreviewOperation; await Promise.resolve();
      const food=(await getVariables()).wx_save;
      ok('线上付款与食品入库同步保存',food.ledgerState.cash===before.ledgerState.cash+264-40&&food.player.inventory.find(i=>i.id==='bento').count===2&&document.getElementById('wxDayAp').textContent==='2');
      document.querySelector('[data-map-district="C"]').click();
      document.querySelector('[data-place-id="black_market_c"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));
      ok('地图点选仅浏览，不改玩家位置',(await getVariables()).wx_save.spatial.playerPlaceId==='player_base_b');
      document.querySelector('[data-map-move="black_market_c"]').click();await window.__dailyPreviewOperation;await Promise.resolve();
      ok('固定黑市移动保存独立位置且不扣AP',(await getVariables()).wx_save.spatial.playerPlaceId==='black_market_c'&&document.getElementById('wxDayAp').textContent==='2'&&document.getElementById('wxCityPosition').textContent.includes('临江黑市'));
      document.querySelector('[data-map-market]').click();
      const gear=document.querySelector('[data-item-id="climb_gear"]');gear.value='1';gear.dispatchEvent(new Event('input'));
      ok('黑市供应器材且不混入食品',!document.querySelector('#wxEconomyInput [data-item-id="bento"]')&&document.querySelector('[data-economy-total]').textContent.includes('总价 500'));
      document.querySelector('[data-economy-submit]').click();await Promise.resolve();await window.__dailyPreviewOperation;await Promise.resolve();
      const bought=(await getVariables()).wx_save;
      ok('黑市付款与待收货同步保存',bought.ledgerState.cash===before.ledgerState.cash+264-540&&!bought.player.inventory.some(i=>i.id==='climb_gear')&&document.getElementById('wxDayAp').textContent==='1'&&document.getElementById('wxEconomyOrders').textContent.includes('第 2 天到货'));
      while(!((await getVariables()).wx_save.dayPlan.ended)){document.querySelector('[data-action-id="daily.pass"]').click();await window.__dailyPreviewOperation;await Promise.resolve();}
      document.querySelector('[data-day-command="next-day"]').click(); await window.__dailyPreviewOperation; await Promise.resolve();
      ok('隔日到货一次入库',(await getVariables()).wx_save.player.inventory.find(i=>i.id==='climb_gear')?.count===1);
      document.querySelector('[data-state-index="2"]').click(); await window.__dailyPreviewReady;
      ok('尾行展示扣 2 点后状态',document.getElementById('wxDayAp').textContent==='2'&&document.getElementById('wxDayActivity').textContent==='尾行进行中');
      ok('尾行仍占当前晚间时段',document.querySelector('#wxDayPeriods [aria-current="step"]').textContent==='晚间');
      ok('日程预览无横向溢出',document.documentElement.scrollWidth<=innerWidth+2);
      document.querySelector('[data-state-index="3"]').click(); await window.__dailyPreviewReady;
      ok('日程结束状态',document.getElementById('wxDayAp').textContent==='0'&&!document.querySelector('#wxDayPeriods [aria-current="step"]'));
      document.querySelector('[data-day-command="next-day"]').click(); await window.__dailyPreviewOperation; await Promise.resolve();
      ok('日终换日恢复四点并回早间',document.getElementById('wxDayAp').textContent==='4'&&document.querySelector('#wxDayPeriods [aria-current="step"]').textContent==='早间');
      document.querySelector('[data-state-index="4"]').click(); await window.__dailyPreviewReady;
      ok('地图保留真实目视目标标记',!!document.querySelector('.wx-map-target circle:not(.last-seen)'));
      ok('位置点仅用蓝橙颜色不含字',!document.querySelector('.wx-map-player text, .wx-map-target text')&&getComputedStyle(document.querySelector('.wx-map-player circle')).fill==='rgb(49, 139, 192)'&&getComputedStyle(document.querySelector('.wx-map-target circle')).fill==='rgb(225, 141, 48)');
      ok('旧流程明确提示未启用活动扣点',document.getElementById('wxDayHint').textContent==='日程活动尚未启用');
      document.querySelector('[data-state-index="0"]').click(); await window.__dailyPreviewReady;
      return checks;
    })()`);
    result.push(...checks.map((check) => ({ width, ...check })));
    if (width !== 320) {
      await delay(120);
      const shot = await send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: true,
      });
      fs.writeFileSync(
        path.join(
          path.dirname(preview.file),
          width === 1100 ? "desktop.png" : "mobile.png",
        ),
        Buffer.from(shot.data, "base64"),
      );
    }
  }
  // 保存经济面板截图，使用真实按钮打开，不构造 UI 假数据。
  for (const [kind, width] of [
    ["work", 1100],
    ["shop", 390],
    ["black_market", 1100],
  ]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await evaluate(
      `(async()=>{ document.querySelector('[data-state-index="0"]').click(); await window.__dailyPreviewReady; ${kind === "black_market" ? `document.querySelector('[data-map-district="C"]').click();document.querySelector('[data-place-id="black_market_c"]').dispatchEvent(new MouseEvent('click',{bubbles:true}));document.querySelector('[data-map-move="black_market_c"]').click();await window.__dailyPreviewOperation;await Promise.resolve();` : ""}document.querySelector('[data-action-id="daily.${kind}"]').click(); await Promise.resolve(); document.getElementById('wxEconomyInput').scrollIntoView({block:'start'}); })()`,
    );
    const shot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
    });
    fs.writeFileSync(
      path.join(path.dirname(preview.file), kind + ".png"),
      Buffer.from(shot.data, "base64"),
    );
  }
  for (const [kind, width, region] of [
    ["map-city", 1100, "all"],
    ["map-district", 390, "B"],
    ["map-riverside", 1100, "C"],
    ["map-cbd",1100,"A"],
    ["map-oldtown",1100,"B"],
    ["map-suburb",1100,"D"],
  ]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await evaluate(
      `(async()=>{document.querySelector('[data-state-index="4"]').click();await window.__dailyPreviewReady;document.querySelector('[data-map-district="${region}"]').click();document.getElementById('wxCityMap').scrollIntoView({block:'start'});})()`,
    );
    const clip = await evaluate(`(()=>{const r=document.getElementById('wxCityMap').getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1};})()`);
    const shot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip,
    });
    fs.writeFileSync(
      path.join(path.dirname(preview.file), kind + ".png"),
      Buffer.from(shot.data, "base64"),
    );
  }
  await evaluate("WxStatusbar.dispose(); true;");
  const overview = require("./build/training-overview.js").buildTrainingOverview();
  await send("Emulation.setDeviceMetricsOverride", {width:1600,height:900,deviceScaleFactor:1,mobile:false});
  await send("Page.setDocumentContent", {frameId:tree.frameTree.frame.id,html:overview.embedded});
  await evaluate("Promise.all([...document.images].map(image=>image.decode()))");
  const overviewClip=await evaluate('(()=>{const r=document.querySelector("main").getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1}})()');
  const overviewShot=await send("Page.captureScreenshot", {format:"png",captureBeyondViewport:true,clip:overviewClip});
  fs.writeFileSync(path.join(path.dirname(overview.file),"overview.png"),Buffer.from(overviewShot.data,"base64"));
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
