"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const { bundle } = require("../build");
const C = require("../src/runtime/contracts");
const script = bundle();
async function fixture(first = "<IdentityMenu/>") {
  const dom = new JSDOM(
      '<!doctype html><html><head></head><body><div id="chat"><div class="mes"><div class="mes_text"></div></div></div></body></html>',
      { runScripts: "outside-only" },
    ),
    win = dom.window,
    doc = win.document,
    handlers = new Map(),
    errors = [],
    chatVars = {};
  const eventTypes = Object.fromEntries(
    [
      "CHAT_CHANGED",
      "MESSAGE_DELETED",
      "MESSAGE_SWIPED",
      "MESSAGE_UPDATED",
      "MESSAGE_EDITED",
      "USER_MESSAGE_RENDERED",
      "CHARACTER_MESSAGE_RENDERED",
      "GENERATION_STARTED",
      "GENERATION_STOPPED",
      "GENERATION_ENDED",
      "MESSAGE_SENT",
    ].map((k) => [k, k]),
  );
  function appendDOM(i) {
    const el = doc.createElement("div");
    el.className = "mes";
    el.setAttribute("mesid", i);
    el.setAttribute("is_user", String(!!context.chat[i].is_user));
    const body = doc.createElement("div");
    body.className = "mes_text";
    body.textContent = context.chat[i].mes;
    el.append(body);
    doc.querySelector("#chat").append(el);
  }
  const emit = async (name, ...args) => {
    for (const f of [...(handlers.get(name) || [])]) await f(...args);
  };
  const context = {
    chatId: "native-opening",
    chat: [{ mes: first, swipe_id: 0, variables: [{}] }],
    characters: [{ name: "仙姝堕2.0·框架测试" }],
    characterId: 0,
    eventTypes,
    eventSource: {
      on: (n, f) => {
        if (!handlers.has(n)) handlers.set(n, new Set());
        handlers.get(n).add(f);
      },
      removeListener: (n, f) => handlers.get(n)?.delete(f),
    },
    saveChat: async () => {},
    prompts: [],
    setExtensionPrompt(_id, text) { context.prompts.push(text); },
  };
  win.console.error = () => {}; // Expected rejection is asserted through the host reporter.
  win.structuredClone = structuredClone;
  win.SillyTavern = { getContext: () => context };
  win.toastr = { error: (e) => errors.push(String(e)) };
  let replaceError = false,
    replacements = 0;
  win.TavernHelper = {
    getVariables: async ({ type, message_id }) =>
      C.clone(
        type === "chat" ? chatVars : context.chat[message_id].variables[context.chat[message_id].swipe_id ?? 0],
      ),
    replaceVariables: async (v, { type, message_id }) => {
      if (type === "chat") {
        Object.assign(chatVars, C.clone(v));
      } else context.chat[message_id].variables[context.chat[message_id].swipe_id ?? 0] = C.clone(v);
    },
    getCharWorldbookNames: async () => ({ primary: null, additional: [] }),
    setChatMessages: async (rows) => {
      if (replaceError) throw Error("宿主拒绝修改开场白");
      replacements++;
      for (const row of rows) {
        context.chat[row.message_id].mes = row.message;
        const node = doc.querySelector('[mesid="' + row.message_id + '"] .mes_text') || doc.querySelector(".mes_text");
        node.textContent = row.message;
      }
      await emit("CHARACTER_MESSAGE_RENDERED");
    },
  };
  const controls = doc.createElement("div");
  controls.id = "send-controls";
  controls.style.display = "none";
  controls.innerHTML = '<button id="mes_stop">停止</button>';
  doc.body.append(controls);
  const textarea = doc.createElement("textarea");
  textarea.id = "send_textarea";
  const send = doc.createElement("button");
  send.id = "send_but";
  const sends = [];
  send.onclick = () => {
    sends.push(textarea.value);
    context.chat.push({
      mes: textarea.value,
      is_user: true,
      swipe_id: 0,
      variables: [{}],
    });
  };
  doc.body.append(textarea, send);
  win.eval(script);
  await until(() => doc.querySelector("[data-xsd2-root]"));
  return {
    dom,
    win,
    doc,
    context,
    errors,
    sends,
    emit,
    replacements: () => replacements,
    fail: (v) => (replaceError = v),
    appendDOM,
    close: () => {
      win.XSD2?.dispose();
      dom.window.close();
    },
  };
}
async function until(fn) {
  for (let i = 0; i < 100; i++) {
    if (fn()) return;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw Error("首楼操作超时");
}
test("打包脚本+宿主等待渲染回调：六身份真实跳转，画廊只展示，按钮不锁死", async () => {
  for (const identity of [
    "赵无忧",
    "焚欲殿主",
    "欢喜殿主",
    "浊龙殿主",
    "魂欢殿主",
    "自设",
  ]) {
    const h = await fixture();
    try {
      const art = h.doc.querySelector("[data-xds-flower]");
      art.click();
      assert.equal(h.replacements(), 0);
      assert.equal(h.doc.querySelector("[data-xds-card-hint]"), null);
      assert.equal(art.getAttribute("role"), null);
      assert.equal(art.hasAttribute("data-xds-identity"), false);
      if (identity === "自设") {
        h.doc.querySelector("[data-xds-open-custom]").click();
        const set = (k, v) =>
          (h.doc.querySelector('[data-xds-field="' + k + '"]').value = v);
        set("custom_name", "测试道友");
        set("custom_cultivation", "筑基初期");
        set("custom_timepoint", "仙盟历1579年六月初七");
        h.doc.querySelector('[data-xds-action="submit-custom"]').click();
      } else
        h.doc
          .querySelector('button[data-xds-identity="' + identity + '"]')
          .click();
      await until(
        () =>
          h.win.XSD2.runtime.getSnapshot()?.identity === identity &&
          h.doc.querySelector(".xsd2-hud"),
      );
      assert.equal(h.doc.querySelector("[data-xds-menu]"), null);
      assert.equal(h.replacements(), 1);
      assert.equal(h.context.chat[0].variables[0].stat_data.身份, identity);
      assert.equal(h.errors.length, 0);
    } finally {
      h.close();
    }
  }
});
test("打包首楼宿主失败：恢复身份按钮，原开场白不变，可再次成功选择", async () => {
  const h = await fixture();
  try {
    h.fail(true);
    h.doc.querySelector('button[data-xds-identity="赵无忧"]').click();
    await until(() => h.errors.length > 0);
    assert.ok([...h.doc.querySelectorAll("button")].every((b) => !b.disabled));
    assert.equal(h.context.chat[0].mes, "<IdentityMenu/>");
    h.fail(false);
    h.doc.querySelector('button[data-xds-identity="欢喜殿主"]').click();
    await until(() => h.doc.querySelector(".xsd2-hud"));
    assert.equal(h.win.XSD2.runtime.getSnapshot().identity, "欢喜殿主");
  } finally {
    h.close();
  }
});

test("自设候选日期未填：只补设定、不猜日期或开启地图；普通身份候选直接HUD", async () => {
  const data = require("../tools/data.cjs").load(
    require("node:path").join(__dirname, ".."),
  );
  const h = await fixture(
    data.greetings.自设.replaceAll("{{user}}", "测试道友"),
  );
  try {
    await h.win.XSD2.runtime.ready();
    assert.equal(h.win.XSD2.runtime.getSnapshot(), null);
    assert.equal(h.doc.querySelector('[data-xds-view="flower"]'), null);
    assert.equal(h.doc.querySelector(".xsd2-hud"), null);
    assert.equal(h.doc.querySelector('[data-xds-page="custom"]').checked, true);
    h.doc.querySelector('[data-xds-field="custom_name"]').value = "测试道友";
    h.doc.querySelector('[data-xds-field="custom_cultivation"]').value =
      "筑基初期";
    h.doc.querySelector('[data-xds-field="custom_timepoint"]').value =
      "仙盟历1579年六月初七";
    h.doc.querySelector('[data-xds-action="submit-custom"]').click();
    await until(() => h.doc.querySelector(".xsd2-hud"));
    assert.deepEqual(C.clone(h.win.XSD2.runtime.getSnapshot().calendarDate), {
      year: 1579,
      month: 6,
      day: 7,
    });
  } finally {
    h.close();
  }
  const normal = await fixture(data.greetings.赵无忧);
  try {
    await until(() => normal.doc.querySelector(".xsd2-hud"));
    assert.equal(normal.doc.querySelector("[data-xds-menu]"), null);
  } finally {
    normal.close();
  }
});

test("打包HUD快捷行动与地图共用门禁：空闲真实发送，生成中拒绝，结束后恢复", async () => {
  const data = require("../tools/data.cjs").load(
    require("node:path").join(__dirname, ".."),
  );
  for (const action of ["观察四周", "与在场之人交谈", "自行行动", "地图"]) {
    const h = await fixture(data.greetings.赵无忧.replace("3月3日", "4月1日"));
    try {
      await until(() => h.doc.querySelector(".xsd2-hud"));
      const runtime = h.win.XSD2.runtime;
      const dispatch = () => {
        if (action !== "地图")
          return runtime.dispatchIntent({
            type: "QUICK_ACTION",
            payload: { text: action },
          });
        const s = runtime.getSnapshot();
        return runtime.dispatchIntent({
          type: "SELECT_NODE",
          pluginId: "youjigu_map",
          expected: {
            chatId: s.chatId,
            branchId: s.branchId,
            floor: s.floor,
            revision: s.revision,
          },
          payload: { nodeId: "g7p2" },
        });
      };
      await h.emit("GENERATION_STARTED");
      await assert.rejects(dispatch(), /请等/);
      assert.equal(h.sends.length, 0);
      await h.emit("GENERATION_ENDED");
      if (action === "地图") await dispatch();
      else {
        assert.equal(h.doc.querySelector("[data-action]"),null);
        await runtime.dispatchIntent({type:"QUICK_ACTION",payload:{text:action}});
        const fillOnly = ["与在场之人交谈","自行行动"].includes(action);
        await until(() => fillOnly ? h.doc.querySelector("#send_textarea").value.endsWith("：") : h.sends.length === 1);
      }
      assert.equal(h.sends.length, ["与在场之人交谈","自行行动"].includes(action) ? 0 : 1);
      if (action === "地图")
        assert.equal(runtime.getSnapshot().pending.nodeId, "g7p2");
    } finally {
      h.close();
    }
  }
});


test("提示词预计算不会锁动作或阻止原生候选身份恢复，不要求GENERATION_ENDED", async () => {
  const data = require("../tools/data.cjs").load(require("node:path").join(__dirname, ".."));
  const h = await fixture();
  try {
    await h.emit("GENERATION_STARTED", "normal", {}, true);
    h.context.chat[0].mes = data.greetings.赵无忧;
    h.context.chat[0].swipe_id = 1;
    h.context.chat[0].variables[1] = {};
    await h.emit("MESSAGE_SWIPED");
    assert.equal(h.win.XSD2.runtime.getSnapshot()?.identity, "赵无忧");
    const revision = h.win.XSD2.runtime.getSnapshot().revision;
    await h.emit("GENERATION_STARTED", "normal", {}, true);
    assert.equal(h.win.XSD2.runtime.getSnapshot().revision, revision);
    await h.win.XSD2.runtime.dispatchIntent({type:"QUICK_ACTION",payload:{text:"观察四周"}});
    assert.deepEqual(h.sends, ["观察四周"]);
    await h.emit("GENERATION_STARTED", "normal", {}, false);
    assert.equal(h.win.XSD2.runtime.getSnapshot()?.identity, "赵无忧");
    await assert.rejects(h.win.XSD2.runtime.dispatchIntent({type:"QUICK_ACTION",payload:{text:"自行行动"}}), /请等/);
    await h.emit("GENERATION_ENDED");
    await h.win.XSD2.runtime.dispatchIntent({type:"QUICK_ACTION",payload:{text:"自行行动"}});
    assert.equal(h.sends.length, 1);
    assert.equal(h.doc.querySelector("#send_textarea").value,"自行行动：");
  } finally { h.close(); }
});


test("原生先STARTED再用户入楼：地图pending留存，HUD不搬用户楼，回复后出现洞府节点", async () => {
  const data = require("../tools/data.cjs").load(require("node:path").join(__dirname, ".."));
  const h = await fixture(data.greetings.赵无忧.replace("3月3日", "4月1日"));
  try {
    await until(() => h.doc.querySelector(".xsd2-hud"));
    h.doc.querySelector(".mes").setAttribute("mesid", "0");
    h.doc.querySelector("#send_but").onclick = async () => {
      await h.emit("GENERATION_STARTED", "normal", {}, false);
      h.sends.push(h.doc.querySelector("#send_textarea").value);
      h.context.chat.push({mes:h.sends.at(-1),is_user:true,variables:[{}]});
      const floor = h.context.chat.length - 1;
      h.appendDOM(floor);
      await h.emit("USER_MESSAGE_RENDERED", floor);
    };
    h.doc.querySelector(".xsd2-map-trigger-btn").click();
    h.doc.querySelector('[data-node-id="g7p2"]').click();
    await until(() => h.context.chat.length === 2);
    assert.equal(h.win.XSD2.runtime.getSnapshot().pending?.nodeId, "g7p2");
    assert.ok(h.context.prompts.at(-1).includes("玩家已经完成「进入幽寂谷」"));
    assert.ok(h.context.prompts.at(-1).includes("地点：幽寂谷·谷口岔路"));
    assert.ok(!h.context.prompts.at(-1).includes("地点：墨山道·孤剑崖外"));
    await new Promise(r => setTimeout(r, 120));
    assert.ok(h.doc.querySelector('[mesid="0"] .xsd2-hud'));
    assert.equal(h.doc.querySelector('[mesid="1"] [data-xsd2-root]'), null);
    assert.equal(h.doc.querySelector('[mesid="1"] .mes_text').textContent, "进入幽寂谷");
    assert.match(h.context.chat[1].mes, /^XSD2_g7p2_[a-f0-9]{8}$/);
    assert.equal(h.doc.querySelector(".xsd2-map-modal-overlay"), null);
    const reported = require("node:fs").readFileSync(require("node:path").join(__dirname,"fixtures/youjigu-entry-reported.txt"),"utf8");
    h.context.chat.push({mes:reported,is_user:false,variables:[{}]});
    h.appendDOM(2);
    await h.emit("CHARACTER_MESSAGE_RENDERED", 2);
    await h.emit("GENERATION_ENDED");
    await until(() => h.doc.querySelector('[mesid="2"] .xsd2-hud'));
    assert.equal(h.win.XSD2.runtime.getSnapshot().activeEvent?.step, "first");
    assert.equal(h.win.XSD2.runtime.getDiagnostics().lastNodeResult.evidenceMode, "PLAYER_CHOICE_CONFIRMED");
    assert.ok(h.doc.querySelector('[mesid="0"] .xsd2-hud'));
    assert.ok([...h.doc.querySelectorAll('[mesid="0"] button:not([data-diagnostics])')].every(b=>b.disabled));
    h.doc.querySelector('[mesid="2"] .xsd2-map-trigger-btn').click();
    assert.equal(h.doc.querySelector('[data-node-id="g7p2"]'), null);
    assert.ok(h.doc.querySelector('[data-node-id="b3m8"]'));
    h.doc.querySelector('[data-node-id="b3m8"]').click();
    await until(() => h.context.chat.length === 4);
    assert.equal(h.win.XSD2.runtime.getSnapshot().pending?.nodeId, "b3m8");
    h.context.chat.push({mes:"赵无忧运转敛息术，潜行尾随二人深入深谷。",is_user:false,variables:[{}]});
    h.appendDOM(4);
    await h.emit("CHARACTER_MESSAGE_RENDERED", 4);
    await h.emit("GENERATION_ENDED");
    await until(() => h.doc.querySelector('[mesid="4"] .xsd2-hud'));
    assert.equal(h.win.XSD2.runtime.getSnapshot().activeEvent?.step, "valley_deep");
    assert.equal(h.doc.querySelector('[mesid="3"] [data-xsd2-root]'), null);
    // Read-only historical state remains at the fork, not the latest cave.
    assert.equal((await h.win.XSD2.runtime.getFloorSnapshot(2)).activeEvent.step, "first");
    h.doc.querySelector('[mesid="4"] .xsd2-map-trigger-btn').click();
    h.doc.querySelector('[data-node-id="q5w4"]').click();
    await until(() => h.context.chat.length === 6);
    await h.emit("GENERATION_STOPPED");
    h.context.chat.pop();
    h.doc.querySelector('[mesid="5"]').remove();
    await h.emit("MESSAGE_DELETED");
    await until(() => h.doc.querySelector('[mesid="4"] .xsd2-map-trigger-btn')?.disabled === false);
    assert.equal(h.win.XSD2.runtime.getSnapshot().pending, null);
    assert.equal(h.win.XSD2.runtime.getSnapshot().activeEvent.step, "valley_deep");
    h.doc.querySelector('[mesid="4"] .xsd2-map-trigger-btn').click();
    assert.ok(h.doc.querySelector('[data-node-id="q5w4"]'));
  } finally { h.close(); }
});

test("打包人物入口：好感阈值只解锁，按钮发送代码，完成回报切阶段且隐藏标签",async()=>{
  const data=require("../tools/data.cjs").load(require("node:path").join(__dirname,".."));
  const h=await fixture(data.greetings.赵无忧);
  const proto=h.win.HTMLDialogElement.prototype;
  proto.showModal=function(){this.open=true;};proto.close=function(){this.open=false;this.dispatchEvent(new h.win.Event("close"));};
  h.win.confirm=()=>true;
  try{
    const r=h.win.XSD2.runtime;
    await r.dispatchIntent({type:"SET_CHARACTER_METRIC",payload:{character:"叶红缨",key:"好感度",value:20}});
    await until(()=>h.doc.querySelector('[data-favor="叶红缨"]'));
    h.doc.querySelector('[data-favor="叶红缨"]').click();
    assert.equal(r.getSnapshot().stat_data.character_stages.叶红缨.id,"stage01");
    h.doc.querySelector('[data-heart-node="yhrNight"]').click();
    await until(()=>h.sends.length===1);
    assert.match(h.sends[0],/^XSD2_yhrNight_/);
    const enterFloor=h.context.chat.length;
    h.context.chat.push({mes:"你已看到她沐浴。<Status_block><在场>叶红缨</在场></Status_block>",is_user:false,swipe_id:0,variables:[{}]});h.appendDOM(enterFloor);
    await h.emit("GENERATION_ENDED");
    await until(()=>h.doc.querySelector('[mesid="'+enterFloor+'"] [data-favor="叶红缨"]'));
    h.doc.querySelector('[mesid="'+enterFloor+'"] [data-favor="叶红缨"]').click();
    h.doc.querySelector('[data-heart-node="yhrFinish"]').click();await until(()=>h.sends.length===2);
    const code=r.getSnapshot().pending.actionCode,finishFloor=h.context.chat.length;
    h.context.chat.push({mes:'<Promotion_result id="'+code+'">是</Promotion_result>',is_user:false,swipe_id:0,variables:[{}]});h.appendDOM(finishFloor);
    await until(()=>h.doc.querySelector('[mesid="'+finishFloor+'"] .mes_text').classList.contains("xsd2-settlement-obscured"));
    await h.emit("GENERATION_ENDED");
    assert.equal(r.getSnapshot().stat_data.character_stages.叶红缨.id,"stage02");
    assert.ok(!h.context.chat.at(-1).mes.includes("Promotion_result"));
    // Normal STARTED arrives while the completed settlement is still last.
    await h.emit("GENERATION_STARTED","normal",{},false);
    assert.equal(r.getSnapshot().pending,null);assert.equal(r.getSnapshot().activeEvent,null);
    assert.equal(r.getSnapshot().stat_data.character_stages.叶红缨.id,"stage02");
    assert.ok(!h.context.prompts.at(-1).includes("Promotion_result"));
    const userFloor=h.context.chat.length;h.context.chat.push({mes:"请叶红缨喝酒",is_user:true,variables:[{}]});h.appendDOM(userFloor);
    const storyFloor=h.context.chat.length;h.context.chat.push({mes:"叶红缨接过酒坛。<Status_block><在场>叶红缨</在场></Status_block>",is_user:false,variables:[{}]});h.appendDOM(storyFloor);
    await h.emit("GENERATION_ENDED");
    assert.equal(r.getSnapshot().pending,null);assert.equal(r.getSnapshot().stat_data.character_stages.叶红缨.id,"stage02");
    assert.equal(r.getSnapshot().storyCount,2);assert.match(h.context.chat.at(-1).mes,/叶红缨接过酒坛/);
    assert.ok(!Object.values(r.getSnapshot().settlements).some(x=>x.floor===storyFloor));
    await r.dispatchIntent({type:"SET_CHARACTER_METRIC",payload:{character:"叶红缨",key:"好感度",value:40}});
    await until(()=>h.doc.querySelector('[mesid="'+storyFloor+'"] [data-favor="叶红缨"] .xsd2-gourd'));
    h.doc.querySelector('[mesid="'+storyFloor+'"] [data-favor="叶红缨"]').click();
    h.doc.querySelector('[data-heart-node="yhrZwEnter1"]').click();await until(()=>h.sends.length===3);
    assert.match(h.sends[2],/^XSD2_yhrZwEnter1_/);assert.ok(h.context.prompts.at(-1).includes(data.nodeStories.yhrZwEnter1.content));
    assert.ok(h.errors.length===0);
  }finally{h.close();}
});

test('打包结算故障停止自动重试：重复DOM更新不堆叠错误，刷新仍从聊天备份恢复好感',async()=>{
 const data=require('../tools/data.cjs').load(require('node:path').join(__dirname,'..'));
 const h=await fixture(data.greetings.赵无忧);
 try{
  const r=h.win.XSD2.runtime;
  await r.dispatchIntent({type:'SET_CHARACTER_METRIC',payload:{character:'叶红缨',key:'好感度',value:20}});
  const s=r.getSnapshot();await r.dispatchIntent({type:'SELECT_NODE',pluginId:'character_promotion',expected:{chatId:s.chatId,branchId:s.branchId,floor:s.floor,revision:s.revision},payload:{nodeId:'yhrNight'}});
  // Force the missing-base failure at the public boundary. Overlay cleanup must
  // not schedule the same faulty settlement indefinitely.
  r.settleStory=async()=>{throw Error('缺少本楼的前置状态');};
  h.context.chat.push({mes:'新回复',is_user:false,swipe_id:0,variables:[{}]});h.appendDOM(2);
  await h.emit('GENERATION_ENDED');
  for(let i=0;i<4;i++){h.doc.querySelector('#chat').append(h.doc.createElement('span'));await new Promise(resolve=>setTimeout(resolve,40));}
  assert.equal(h.errors.filter(x=>x.includes('缺少本楼')).length,1);
  // Full script reload recreates the dispatcher; message slot loss must not
  // erase the independently saved checkpoint.
  h.context.chat[0].variables=[{}];h.context.chat[0].mes+='\n';
  h.win.eval(script);
  await until(()=>h.win.XSD2.runtime!==r && h.win.XSD2.runtime.getSnapshot()?.stat_data.character_metrics.叶红缨.好感度===20);
  assert.equal(h.win.XSD2.runtime.getSnapshot().stat_data.character_metrics.叶红缨.好感度,20);
 }finally{h.close();}
});

test('打包宿主三段晋升：变量丢失刷新、格式归一化正常发送、删完成回复再点心迹完成',async()=>{
 const data=require('../tools/data.cjs').load(require('node:path').join(__dirname,'..'));
 const h=await fixture(data.greetings.赵无忧);
 h.win.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 h.win.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new h.win.Event('close'));};
 try{
  h.context.saveChat=async()=>{for(const m of h.context.chat)m.swipe_id=String(m.swipe_id??0);};
  let r=h.win.XSD2.runtime;
  const select=async id=>{const s=r.getSnapshot();await r.dispatchIntent({type:'SELECT_NODE',pluginId:'character_promotion',expected:{chatId:s.chatId,branchId:s.branchId,floor:s.floor,revision:s.revision},payload:{nodeId:id}});};
  const reply=async text=>{const floor=h.context.chat.length;h.context.chat.push({mes:text,is_user:false,swipe_id:0,variables:[{}]});h.appendDOM(floor);await h.emit('GENERATION_ENDED');return floor;};
  let lastFloor;
  for(const [score,entry,finish] of [[20,'yhrNight','yhrFinish'],[40,'yhrZwEnter1','yhrZwFinish1'],[60,'yhrZwEnter2','yhrZwFinish2']]){
   await r.dispatchIntent({type:'SET_CHARACTER_METRIC',payload:{character:'叶红缨',key:'好感度',value:score}});
   await select(entry);await reply('本次故事已经发生。<Status_block><在场>叶红缨</在场></Status_block>');await select(finish);
   lastFloor=await reply('<Promotion_result id="'+r.getSnapshot().pending.actionCode+'">是</Promotion_result>');
  }
  assert.equal(r.getSnapshot().stat_data.character_stages.叶红缨.id,'stage04');
  h.context.chat[2].swipe_id='0';h.context.chat.at(-1).mes+='\r\n';
  for(const m of h.context.chat)m.variables=[{}];
  h.win.XSD2.dispose();delete h.win.XSD2;h.win.eval(script);
  await until(()=>h.win.XSD2?.runtime.getSnapshot()?.stat_data.character_stages.叶红缨.id==='stage04');r=h.win.XSD2.runtime;
  await h.emit('GENERATION_STARTED','normal',{},false);
  assert.equal(r.getSnapshot().pending,null);assert.ok(!h.context.prompts.at(-1).includes('Promotion_result'));
  // No generation is started by the fixture, end its lifecycle before deletion.
  h.win.XSD2.host?.markGenerating?.(false);
  await h.emit('GENERATION_ENDED');
  assert.equal(r.getSnapshot().stat_data.character_stages.叶红缨.id,'stage04');
  h.context.chat.pop();h.doc.querySelector('[mesid="'+lastFloor+'"]').remove();await h.emit('MESSAGE_DELETED');
  assert.equal(r.getSnapshot().stat_data.character_stages.叶红缨.id,'stage03');assert.equal(r.getSnapshot().stat_data.character_metrics.叶红缨.好感度,60);assert.equal(r.getSnapshot().pending,null);assert.ok(r.getSnapshot().activeEvent);
  const control=lastFloor-2;
  await until(()=>h.doc.querySelector('[mesid="'+control+'"] [data-favor="叶红缨"]'));
  h.doc.querySelector('[mesid="'+control+'"] [data-favor="叶红缨"]').click();
  const button=h.doc.querySelector('[data-heart-node="yhrZwFinish2"]');assert.ok(button);assert.equal(button.disabled,false);button.click();
  await until(()=>r.getSnapshot().pending?.nodeId==='yhrZwFinish2');
  await reply('<Promotion_result id="'+r.getSnapshot().pending.actionCode+'">是</Promotion_result>');assert.equal(r.getSnapshot().stat_data.character_stages.叶红缨.id,'stage04');
  await h.emit('GENERATION_STARTED','normal',{},false);h.context.chat.push({mes:'请她喝酒',is_user:true,variables:[{}]});await reply('她接过酒杯。');assert.equal(r.getSnapshot().pending,null);assert.ok(h.context.chat.at(-1).mes.includes('她接过酒杯'));assert.ok(!h.context.prompts.at(-1).includes('Promotion_result'));assert.equal(h.errors.length,0);
 }finally{h.close();}
});

test('境界子面板：闭关三月发送结算，单实例关闭、刷新保留境界与日期',async()=>{
 const data=require('../tools/data.cjs').load(require('node:path').join(__dirname,'..'));const h=await fixture(data.greetings.赵无忧);
 h.win.HTMLDialogElement.prototype.showModal=function(){this.open=true;};h.win.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new h.win.Event('close'));};
 try{
  const r=h.win.XSD2.runtime;await until(()=>r.getSnapshot());const start=C.day(r.getSnapshot().calendarDate);
  await until(()=>h.doc.querySelector('[data-realm]'));h.doc.querySelector('[data-realm]').click();h.doc.querySelector('[data-realm]').click();assert.equal(h.doc.querySelectorAll('[data-realm-act="retreat"]').length,1);
  h.doc.querySelector('[data-realm-act="retreat"]').click();await until(()=>r.getSnapshot().stat_data.修为==='金丹后期');assert.equal(C.day(r.getSnapshot().calendarDate)-start,90);assert.equal(h.sends.length,1);
  await h.emit('CHAT_CHANGED');assert.equal(r.getSnapshot().stat_data.修为,'金丹后期');assert.equal(C.day(r.getSnapshot().calendarDate)-start,90);assert.ok(h.context.prompts.at(-1).includes('金丹后期'));assert.equal(h.errors.length,0);
 }finally{h.close();}
});

test('聊天变量同步与进度写入跨脚本实例排队，旧同步不能覆盖新备份，重roll允许投影前置台账',async()=>{
 const {createTavernHost}=require('../src/host/tavern');
 const dom=new JSDOM('<div id="chat"></div>'),win=dom.window;
 const chat=[{mes:'开局',is_user:false}],context={chatId:'write-race',chat,characters:[{name:'仙姝堕2.0·框架测试'}],characterId:0,saveChat:async()=>{}};
 let vars={externalKey:'保留'},message={},release,entered;
 const gate=new Promise(resolve=>release=resolve),reading=new Promise(resolve=>entered=resolve);let blocked=false;
 win.SillyTavern={getContext:()=>context};win.TavernHelper={
  getVariables:async({type})=>{if(type==='message')return C.clone(message);const saved=C.clone(vars);if(!blocked){blocked=true;entered();await gate;}return saved;},
  replaceVariables:async(v,{type})=>{if(type==='chat')vars=C.clone(v);else message=C.clone(v);},
  getCharWorldbookNames:async()=>({primary:null,additional:[]})
 };
 try{
  const a=createTavernHost(win,win.document,'仙姝堕2.0·框架测试'),b=createTavernHost(win,win.document,'仙姝堕2.0·框架测试');
  const old={revision:1,stat_data:{地点:'旧地点'}},fresh={revision:2,stat_data:{地点:'新地点'}};
  const sync=a.syncState(old);await reading;
  let finished=false;const saving=b.persist({...b.context(),floor:0,trail:C.fingerprint(chat)},{schema:2,chatId:'write-race',branchId:'write-race',trail:C.fingerprint(chat),state:fresh}).then(()=>finished=true);
  await new Promise(resolve=>setTimeout(resolve,20));assert.equal(finished,false);release();await Promise.all([sync,saving]);
  assert.equal(vars.xsd2_checkpoint.state.revision,2);assert.equal(vars.xsd2_history.length,1);assert.equal(vars.externalKey,'保留');
  await a.syncState(old);assert.equal(vars.stat_data.地点,'旧地点');assert.equal(vars.xsd2_checkpoint.state.revision,2);assert.equal(vars.xsd2_history.length,1);
 }finally{release();dom.window.close();}
});

test('重roll后无匹配进度显示恢复入口，禁止写入；恢复原分支后重读移除提示',async()=>{
 const data=require('../tools/data.cjs').load(require('node:path').join(__dirname,'..'));
 const h=await fixture(data.greetings.赵无忧);
 try{
  await until(()=>h.win.XSD2.runtime.getSnapshot());const old=h.win.XSD2.runtime;
  h.context.chat[0].swipe_id=1;h.context.chat[0].variables[1]={};h.win.eval(script);
  await until(()=>h.doc.querySelector('[data-xsd2-recovery]'));
  const r=h.win.XSD2.runtime;assert.notEqual(r,old);assert.equal(r.getSnapshot(),null);assert.ok(r.getDiagnostics().recoveryFault);assert.equal(h.doc.querySelector('[data-xsd2-recovery]').querySelectorAll('button').length,2);
  await assert.rejects(r.dispatchIntent({type:'GM_PATCH',payload:{地点:'不能改变'}}),/尚未恢复/);
  h.context.chat[0].swipe_id=0;h.doc.querySelector('[data-xsd2-recovery] button').click();
  await until(()=>r.getSnapshot() && !h.doc.querySelector('[data-xsd2-recovery]'));assert.equal(r.getSnapshot().identity,'赵无忧');
 }finally{h.close();}
});

test('打包宿主隐藏旧楼层并导入聊天：前缀匹配恢复好感，新回复仍显示HUD',async()=>{
 const data=require('../tools/data.cjs').load(require('node:path').join(__dirname,'..'));
 const h=await fixture(data.greetings.赵无忧);
 try{
  const r=h.win.XSD2.runtime;await until(()=>r.getSnapshot());await r.dispatchIntent({type:'SET_CHARACTER_METRIC',payload:{character:'叶红缨',key:'好感度',value:12}});
  h.context.chat.push({mes:'继续',is_user:true,variables:[{}]});h.appendDOM(1);
  h.context.chat.push({mes:'她向你颔首。<Status_block><在场>叶红缨</在场></Status_block>',is_user:false,variables:[{}]});h.appendDOM(2);await h.emit('GENERATION_ENDED');
  for(const m of h.context.chat)m.is_system=true;
  h.context.chatId+=' imported';
  h.context.chat.push({mes:'继续探索',is_user:true,variables:[{}]});h.appendDOM(3);
  h.context.chat.push({mes:'你走到石亭。<Status_block><在场>叶红缨</在场></Status_block>',is_user:false,variables:[{}]});h.appendDOM(4);
  h.win.eval(script);await until(()=>h.win.XSD2.runtime!==r && h.win.XSD2.runtime.getSnapshot()?.stat_data.character_metrics.叶红缨.好感度===12);
  await h.emit('GENERATION_ENDED');await until(()=>h.doc.querySelector('[mesid="4"] [data-xsd2-root]'));
  assert.equal(h.win.XSD2.runtime.getDiagnostics().recoveryFault,null);assert.equal(h.errors.length,0);assert.equal(h.doc.querySelector('[data-xsd2-recovery]'),null);
 }finally{h.close();}
});

test('保存未完快速发送只暂存一条，完成后发送一次；草稿修改后不自动发送旧内容',async()=>{
 const data=require('../tools/data.cjs').load(require('node:path').join(__dirname,'..'));
 for(const edit of [false,true]){
  const h=await fixture(data.greetings.赵无忧);
  try{
   await until(()=>h.win.XSD2.runtime.getSnapshot());let release,entered;const gate=new Promise(r=>release=r),writing=new Promise(r=>entered=r),replace=h.win.TavernHelper.replaceVariables;let held=false;
   h.win.TavernHelper.replaceVariables=async(v,where)=>{if(where.type==='message'&&where.message_id===2&&!held){held=true;entered();await gate;}return replace(v,where);};
   h.context.chat.push({is_user:true,mes:'探索',variables:[{}]});h.appendDOM(1);h.context.chat.push({is_user:false,mes:'你获得测试灵石。<Status_block><储物栏>获得：测试灵石×1</储物栏></Status_block>',variables:[{}]});h.appendDOM(2);
   const ended=h.emit('GENERATION_ENDED');await writing;const box=h.doc.querySelector('#send_textarea');box.value='立即发送下一条';h.doc.querySelector('#send_but').click();h.doc.querySelector('#send_but').click();assert.equal(h.sends.length,0);assert.ok(h.doc.querySelector('[data-xsd2-saving]'));
   if(edit)box.value='我修改了草稿';release();await ended;await until(()=>!h.doc.querySelector('[data-xsd2-saving]'));
   assert.equal(h.sends.length,edit?0:1);assert.equal(box.value,edit?'我修改了草稿':'立即发送下一条');assert.equal(h.win.XSD2.runtime.getSnapshot().inventory.find(x=>x.name==='测试灵石').count,1);assert.deepEqual(h.errors,[]);
  }finally{h.close();}
 }
});

test('保存失败释放等待计数但不自动发送草稿，错误可诊断',async()=>{
 const data=require('../tools/data.cjs').load(require('node:path').join(__dirname,'..')),h=await fixture(data.greetings.赵无忧);
 try{
  await until(()=>h.win.XSD2.runtime.getSnapshot());let release,entered;const gate=new Promise(r=>release=r),writing=new Promise(r=>entered=r),replace=h.win.TavernHelper.replaceVariables;let held=false;
  h.win.TavernHelper.replaceVariables=async(v,where)=>{if(where.type==='message'&&where.message_id===2&&!held){held=true;entered();await gate;}return replace(v,where);};h.context.saveChat=async()=>{throw Error('测试保存失败');};
  h.context.chat.push({is_user:true,mes:'探索',variables:[{}]});h.appendDOM(1);h.context.chat.push({is_user:false,mes:'回复结束。<Status_block><历时>10分钟</历时></Status_block>',variables:[{}]});h.appendDOM(2);
  const ended=h.emit('GENERATION_ENDED');await writing;h.doc.querySelector('#send_textarea').value='保留此草稿';h.doc.querySelector('#send_but').click();release();await ended;await until(()=>!h.doc.querySelector('[data-xsd2-saving]'));
  assert.equal(h.sends.length,0);assert.equal(h.doc.querySelector('#send_textarea').value,'保留此草稿');assert.equal(h.win.XSD2.runtime.getDiagnostics().host.pendingSaves,0);assert.ok(h.errors.some(x=>x.includes('保存失败')));
 }finally{h.close();}
});

test('打包原生保存导入：稳定extra编号落盘，删早期普通输入、移除楼变量仍恢复且不重复奖励',async()=>{
 const data=require('../tools/data.cjs').load(require('node:path').join(__dirname,'..')),h=await fixture(data.greetings.赵无忧);
 try{
  const r=h.win.XSD2.runtime;await until(()=>r.getSnapshot());let exported;
  h.context.saveChat=async()=>{exported=JSON.stringify(h.context.chat);};
  h.context.chat.push({mes:'额外补充',is_user:true,variables:[{}],extra:{other_extension:'保留'}});h.appendDOM(1);
  h.context.chat.push({mes:'继续探索',is_user:true,variables:[{}]});h.appendDOM(2);
  h.context.chat.push({mes:'你获得测试灵石。<Status_block><储物栏>获得：测试灵石×1</储物栏></Status_block>',is_user:false,variables:[{}]});h.appendDOM(3);
  await h.emit('GENERATION_ENDED');await until(()=>r.getSnapshot().storyCount===1);
  const identity=JSON.parse(exported)[3].extra.xsd2_identity.revisionId;
  h.context.chat=JSON.parse(exported);assert.equal(h.context.chat[1].extra.other_extension,'保留');h.context.chat.splice(1,1);for(const m of h.context.chat)m.variables=[{}];h.context.chatId+=' imported';
  h.doc.querySelector('#chat').replaceChildren();for(let i=0;i<h.context.chat.length;i++)h.appendDOM(i);
  h.win.eval(script);await until(()=>h.win.XSD2.runtime!==r && h.win.XSD2.runtime.getSnapshot()?.storyCount===1);
  const fresh=h.win.XSD2.runtime;assert.equal(fresh.getSnapshot().inventory.find(x=>x.name==='测试灵石').count,1);assert.equal(fresh.getDiagnostics().messageIdentity.revisionId,identity);
  await fresh.flushCompleted();assert.equal(fresh.getSnapshot().storyCount,1);assert.equal(fresh.getDiagnostics().storageIdentityVersion,1);assert.deepEqual(h.errors,[]);
 }finally{h.close();}
});

test('打包西北归宗：浏览器确认不可用也能在原子页面确认、发送并完成结算',async()=>{
 const data=require('../tools/data.cjs').load(require('node:path').join(__dirname,'..')),h=await fixture(data.greetings.赵无忧);
 try{
  h.win.HTMLDialogElement.prototype.showModal=function(){this.open=true;};h.win.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new h.win.Event('close'));};
  h.win.confirm=()=>{throw Error('浏览器已禁止原生确认');};
  const r=h.win.XSD2.runtime;await until(()=>r.getSnapshot());const start=C.day(r.getSnapshot().calendarDate);
  const click=async nodeId=>{const s=r.getSnapshot();await r.dispatchIntent({type:'SELECT_NODE',pluginId:'xibei',expected:{chatId:s.chatId,branchId:s.branchId,floor:s.floor,revision:s.revision},payload:{nodeId}});};
  const reply=async text=>{h.context.chat.push({mes:text+'<Status_block><历时>—</历时></Status_block>',is_user:false,variables:[{}]});h.appendDOM(h.context.chat.length-1);await h.emit('GENERATION_ENDED');};
  for(const id of ['xbxxEnter','xbxxFight','xbxxLoot','xbxxAmbush']){await click(id);await reply('你与孤月完成了当前行动。');}
  h.context.chat.push({mes:'我退后让孤月自护',is_user:true,variables:[{}]});await reply('你已回应偷袭。');await click('xbxxJudge');await reply('<Promotion_result id="'+r.getSnapshot().pending.actionCode+'">否</Promotion_result>');await click('xbxxDodge');await reply('孤月以剑气自护。');
  h.doc.querySelector('[data-xibei]:not(:disabled)').click();h.doc.querySelector('[data-xibei-node="xbxxFinishA"]').click();await until(()=>h.doc.querySelector('[data-exit-confirm]'));
  assert.equal(h.doc.querySelectorAll('dialog').length,1);h.doc.querySelector('[data-exit-cancel]').click();await until(()=>!h.doc.querySelector('[data-exit-confirm]'));await until(()=>!h.doc.querySelector('[data-xibei-node="xbxxFinishA"]').disabled);
  const count=h.sends.length;assert.equal(C.day(r.getSnapshot().calendarDate),start);h.doc.querySelector('[data-xibei-node="xbxxFinishA"]').click();await until(()=>h.doc.querySelector('[data-exit-confirm]'));h.doc.querySelector('[data-exit-confirm]').click();await until(()=>h.sends.length===count+1);
  assert.equal(C.day(r.getSnapshot().calendarDate),start+10);assert.equal(h.doc.querySelector('dialog'),null);await reply('你与孤月返回墨山道山门复命。');
  assert.equal(r.getSnapshot().pending,null);assert.equal(r.getSnapshot().pluginState.xibei.step,'done');assert.equal(r.getSnapshot().stat_data.character_metrics.孤月.好感度,5);assert.equal(h.doc.querySelector('[data-xibei]:not(:disabled)'),null);assert.deepEqual(h.errors,[]);
 }finally{h.close();}
});

test('自设开局先展开用户名并同步原生swipes，首轮发送与重挂载不误判分支',async()=>{
 const h=await fixture();try{
  h.context.name1='酒馆道友';h.context.name2='仙姝堕2.0·框架测试';h.context.chat[0].swipes=[h.context.chat[0].mes];h.context.chat[0].swipe_info=[{extra:{}}];
  h.doc.querySelector('[data-xds-open-custom]').click();h.doc.querySelector('[data-xds-field="custom_name"]').value='青岚';h.doc.querySelector('[data-xds-field="custom_timepoint"]').value='仙盟历1578年3月3日';h.doc.querySelector('[data-xds-action="submit-custom"]').click();await until(()=>h.win.XSD2.runtime.getSnapshot()?.identity==='自设');
  assert.ok(!h.context.chat[0].mes.includes('{{user}}'));assert.ok(h.context.chat[0].mes.includes('自设 · 青岚'));assert.equal(h.context.chat[0].swipes[0],h.context.chat[0].mes);
  const r=h.win.XSD2.runtime;h.doc.querySelector('#send_textarea').value='我查看四周';h.doc.querySelector('#send_but').click();await h.emit('GENERATION_STARTED','normal',{},false);h.context.chat.push({mes:'你来到石亭。<Status_block><历时>10分钟</历时></Status_block>',is_user:false,variables:[{}]});h.appendDOM(2);await h.emit('GENERATION_ENDED');assert.equal(r.getSnapshot().storyCount,1);
  h.win.eval(script);await until(()=>h.win.XSD2.runtime!==r && h.win.XSD2.runtime.getSnapshot()?.storyCount===1);assert.equal(h.win.XSD2.runtime.getSnapshot().stat_data.自设.name,'青岚');assert.deepEqual(h.errors,[]);
 }finally{h.close();}
});

test('主书无间隔点的同名别名可同步；误绑其他世界书不写入且HUD仍显示绑定警告',async()=>{
 const data=require('../tools/data.cjs').load(require('node:path').join(__dirname,'..')),h=await fixture(data.greetings.赵无忧);
 try{
  let binding='其他正式世界书',writes=0;h.win.TavernHelper.getCharWorldbookNames=async()=>({primary:binding});h.win.TavernHelper.getWorldbook=async()=>[{uid:1,name:'【身份】赵无忧',content:'角色身份',enabled:true}];h.win.TavernHelper.replaceWorldbook=async()=>{writes++;};
  const r=h.win.XSD2.runtime;await r.restore();await h.emit('CHAT_CHANGED');assert.equal(writes,0);assert.ok(h.doc.querySelector('[data-xsd2-root]'));assert.ok(h.doc.querySelector('[data-xsd2-worldbook-warning]'));assert.equal(r.getDiagnostics().host.worldbook.primary,binding);
  for(const alias of ['仙姝堕2.0框架测试','仙姝堕2.0框架测试（2）','仙姝堕2.0·框架测试 (3)']){binding=alias;await h.emit('CHAT_CHANGED');assert.ok(writes>0);assert.equal(r.getDiagnostics().host.worldbook.blocked,false);assert.equal(h.doc.querySelector('[data-xsd2-worldbook-warning]'),null);}
 }finally{h.close();}
});
