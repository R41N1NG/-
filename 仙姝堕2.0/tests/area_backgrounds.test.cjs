"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  path = require("node:path");
const { createDispatcher } = require("../src/runtime/dispatcher"),
  data = require("../tools/data.cjs").load(path.join(__dirname, "..")),
  plugin = require("../src/plugins/youjigu_map");
const { areaEntries, managedEnabled } = require("../src/runtime/story_entries");

function fixture() {
  const chat = [{ mes: "<IdentityMenu/>", variables: [] }];
  const adapter = {
    context: () => ({ chatId: "area", chat }),
    readMessage: async (i) =>
      JSON.parse(JSON.stringify(chat[i]?.variables?.[chat[i]?.swipe_id || 0] || {})),
    persist: async (c, e) => {
      chat[c.floor].variables ??= [];
      chat[c.floor].variables[chat[c.floor].swipe_id || 0] = {
        stat_data: { ...JSON.parse(JSON.stringify(e.state.stat_data)), xsd2: [JSON.parse(JSON.stringify(e))] },
      };
    },
    replaceOpening: async (t) => (chat[0].mes = t),
    replaceStory: async (i, t) => (chat[i].mes = t),
    send: async (t) => chat.push({ mes: t, is_user: true }),
    preflightSend() {},
    confirmExit: async () => true,
    isAborted: () => false,
    errors: [],
    report(error) { this.errors.push(error.message); },
    prompts: [],
    setPrompt(text) { this.prompts.push(text); },
  };
  const testData = {
    ...data,
    greetings: {
      ...data.greetings,
      赵无忧: data.greetings.赵无忧.replace("3月3日", "4月1日"),
    },
  };
  const r = createDispatcher(adapter, testData);
  r.registerPlugin(plugin);
  const click = (id) => {
    const s = r.getSnapshot();
    return r.dispatchIntent({
      type: "SELECT_NODE", pluginId: plugin.id,
      expected: { chatId: s.chatId, branchId: s.branchId, floor: s.floor, revision: s.revision },
      payload: { nodeId: id },
    });
  };
  const reply = async (prose) => {
    chat.push({ mes: prose, is_user: false, swipe_id: 0 });
    return r.settleStory();
  };
  const act = async (id, prose) => { await click(id); await reply(prose); };
  const ready = () => r.dispatchIntent({ type: "SELECT_IDENTITY", payload: { identity: "赵无忧" } });
  return { r, click, reply, act, ready };
}

test("areaEntries 生成区域背景条目且按 active_area 门控",()=>{
  const entries=areaEntries(data.areaBackgroundDefinitions);
  assert.equal(entries.length,Object.keys(data.areaBackgroundDefinitions).length);
  const ye=entries.find(e=>e.comment==="【区域背景】幽寂谷");
  assert.ok(ye.constant&&ye.disable&&ye.preventRecursion&&ye.order===203);
  assert.ok(ye.content.includes("持续环境提醒"));
  const stat={地点:"幽寂谷·洞府",active_area:"幽寂谷"};
  assert.equal(managedEnabled("【区域背景】幽寂谷",stat),true);
  assert.equal(managedEnabled("【区域背景】幽寂谷",{地点:"幽寂谷外",active_area:""}),false);
  assert.equal(managedEnabled("【区域背景】不存在的区域",stat),false);
});
test("真实调度流：入谷后 active_area=幽寂谷，子地点继承，离开后清空",async()=>{
  const h=fixture();await h.ready();
  assert.equal(h.r.getSnapshot().stat_data.active_area,"");
  await h.click("g7p2");
  await h.reply("你正式步入幽寂谷之中。");
  let s=h.r.getSnapshot();
  assert.equal(s.stat_data.地点,"幽寂谷·谷口岔路");
  assert.equal(s.stat_data.active_area,"幽寂谷");
  await h.act("b3m8","你暗中运转匿气术，潜行尾随二人深入深谷。");
  s=h.r.getSnapshot();
  assert.equal(s.stat_data.地点,"幽寂谷·乱石深涧");
  assert.equal(s.stat_data.active_area,"幽寂谷");
  await h.act("z8u5","你提前收拾行装，离开了幽寂谷。");
  s=h.r.getSnapshot();
  assert.equal(s.stat_data.地点,"幽寂谷外");
  assert.equal(s.stat_data.active_area,"");
});
