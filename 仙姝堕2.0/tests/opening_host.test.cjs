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
    const h = await fixture(data.greetings.赵无忧);
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
  const h = await fixture(data.greetings.赵无忧);
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
    assert.ok([...h.doc.querySelectorAll('[mesid="0"] button')].every(b=>b.disabled));
    h.doc.querySelector('[mesid="2"] .xsd2-map-trigger-btn').click();
    assert.equal(h.doc.querySelector('[data-node-id="g7p2"]'), null);
    assert.ok(h.doc.querySelector('[data-node-id="k4m8"]'));
    h.doc.querySelector('[data-node-id="k4m8"]').click();
    await until(() => h.context.chat.length === 4);
    assert.equal(h.win.XSD2.runtime.getSnapshot().pending?.nodeId, "k4m8");
    h.context.chat.push({mes:"赵无忧推开石门，步入幽寂谷洞府之中。",is_user:false,variables:[{}]});
    h.appendDOM(4);
    await h.emit("CHARACTER_MESSAGE_RENDERED", 4);
    await h.emit("GENERATION_ENDED");
    await until(() => h.doc.querySelector('[mesid="4"] .xsd2-hud'));
    assert.equal(h.win.XSD2.runtime.getSnapshot().activeEvent?.step, "cave");
    assert.equal(h.doc.querySelector('[mesid="3"] [data-xsd2-root]'), null);
    // Read-only historical state remains at the fork, not the latest cave.
    assert.equal((await h.win.XSD2.runtime.getFloorSnapshot(2)).activeEvent.step, "first");
    h.doc.querySelector('[mesid="4"] .xsd2-map-trigger-btn').click();
    h.doc.querySelector('[data-node-id="q3f7"]').click();
    await until(() => h.context.chat.length === 6);
    await h.emit("GENERATION_STOPPED");
    h.context.chat.pop();
    h.doc.querySelector('[mesid="5"]').remove();
    await h.emit("MESSAGE_DELETED");
    await until(() => h.doc.querySelector('[mesid="4"] .xsd2-map-trigger-btn')?.disabled === false);
    assert.equal(h.win.XSD2.runtime.getSnapshot().pending, null);
    assert.equal(h.win.XSD2.runtime.getSnapshot().activeEvent.step, "cave");
    h.doc.querySelector('[mesid="4"] .xsd2-map-trigger-btn').click();
    assert.ok(h.doc.querySelector('[data-node-id="q3f7"]'));
    assert.ok(h.doc.querySelector('[data-node-id="b8n2"]'));
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
