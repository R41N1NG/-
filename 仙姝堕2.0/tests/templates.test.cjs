"use strict";
const {test} = require("node:test"), assert = require("node:assert/strict");
const {resolveStages,writeMetric} = require("../src/runtime/character_stages");
const {meets} = require("../src/runtime/conditions");
const {storyEntries} = require("../src/runtime/story_entries");
const {createWorldbookHost} = require("../src/host/worldbook");
const {createActionCode} = require("../src/runtime/action_wire");
const profiles = {角色甲:{metrics:{好感:{min:0,max:100,default:0}},allowRegression:true,stages:[
  {id:"base",priority:0,conditions:[],story:"基础阶段"},
  {id:"high",priority:1,conditions:[{kind:"metric",character:"角色甲",key:"好感",op:"gte",value:60}],story:"高阶段",portrait:{small:"a.jpg",large:"a.png"},nodes:["test"]},
]}};
test("阶段统一计算：默认/升阶/回退/不可退阶段，数值校验与节点同源", ()=>{
  const s = {stat_data:{}};
  resolveStages(s,profiles);
  assert.equal(s.stat_data.character_stages.角色甲.id,"base");
  writeMetric(s.stat_data,profiles,"角色甲","好感",70);
  resolveStages(s,profiles);
  assert.equal(s.stat_data.character_stages.角色甲.id,"high");
  assert.equal(s.stat_data.character_stages.角色甲.portrait.small,"a.jpg");
  assert.ok(meets(s,[{kind:"stage",character:"角色甲",value:"high"}]));
  writeMetric(s.stat_data,profiles,"角色甲","好感",10);
  const locked = structuredClone(profiles); locked.角色甲.allowRegression = false;
  resolveStages(s,locked); assert.equal(s.stat_data.character_stages.角色甲.id,"high");
  resolveStages(s,profiles); assert.equal(s.stat_data.character_stages.角色甲.id,"base");
  assert.throws(()=>writeMetric(s.stat_data,profiles,"角色甲","好感",NaN),/超出/);
  assert.throws(()=>writeMetric(s.stat_data,profiles,"角色甲","不存在",10),/未注册/);
  assert.equal(meets(s,[{kind:"metric",character:"不存在",key:"好感",op:"gte",value:0}]),false);
});
test("节点世界书按当前授权节点启闭，阶段条目只启一个，历史代码不能保持旧条目", async ()=>{
  const catalog = require("../src/config/node_stories.json"), entries = storyEntries(catalog,profiles);
  assert.ok(entries.every(x=>x.disable && x.preventRecursion && x.excludeRecursion));
  const entry = entries.find(x=>x.comment === "【节点故事】g7p2");
  assert.ok(createActionCode("g7p2","receipt").includes(entry.key[0]));
  assert.ok(!"前往洞府开启暗格".includes(entry.key[0]));
  assert.equal(entry.scanDepth,1);
  let stored = entries.map(x=>({...x,name:x.comment,enabled:!x.disable}));
  const host = createWorldbookHost({getCharWorldbookNames:async()=>({primary:"独立卡"}),getWorldbook:async()=>stored,replaceWorldbook:async(_,rows)=>{stored=rows;}},()=>({}));
  await host.synchronizeState({node_trigger:"g7p2",在场角色:[{名:"角色甲"}],character_stages:{角色甲:{id:"high",story:"高阶段"}}});
  assert.equal(stored.filter(x=>x.enabled && x.name.startsWith("【节点故事】")).length,1);
  assert.equal(stored.find(x=>x.name===entry.comment).enabled,true);
  assert.equal(stored.filter(x=>x.enabled && x.name.startsWith("【人物阶段】")).length,1);
  await host.synchronizeState({node_trigger:null,character_stages:{角色甲:{id:"high",story:"高阶段"}}});
  assert.ok(stored.every(x=>!x.enabled));
  await assert.rejects(host.synchronizeState({node_trigger:"missing"}),/缺少节点故事/);
  await host.synchronizeState({node_trigger:null,character_stages:{}});
  assert.ok(stored.every(x=>!x.enabled && x.disable));
});
test("结算展示只读回执：单独卡/简短卡、无额外发送或计数，清理不重复", ()=>{
  const {JSDOM} = require("jsdom"), d = new JSDOM("<main></main>"), doc=d.window.document;
  const {renderSettlement} = require("../src/ui/settlement_panel"), container=doc.querySelector("main");
  const s={floor:2,settlements:{a:{id:"a",floor:2,title:"结算",mode:"separate",action:"完成",elapsedDays:2,date:{year:1578,month:3,day:5},rewards:["草药"],facts:["采下草药"]}}};
  const before=JSON.stringify(s); renderSettlement(doc,container,s); renderSettlement(doc,container,s);
  assert.equal(container.querySelectorAll("section").length,1);
  assert.match(container.textContent,/3月5日/); assert.equal(JSON.stringify(s),before);
  renderSettlement(doc,container,{...s,pending:{}}); assert.equal(container.children.length,0);
  d.window.close();
});
