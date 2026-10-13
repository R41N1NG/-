"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),path=require("node:path");
const {createMetricEvents,parseMetricEvent}=require("../src/runtime/metric_events");
const {metricEntries,managedEnabled}=require("../src/runtime/story_entries");
const data=require("../tools/data.cjs").load(path.join(__dirname,".."));

const profiles={叶红缨:{initialStage:"stage01",metrics:{好感度:{min:0,max:100,default:0}},stages:[{id:"stage01",priority:0}]}};
const defs=data.metricEventDefinitions;
function state(present=true){
  const s={manual:{},stat_data:{character_metrics:{叶红缨:{好感度:0}}}};
  if(present)s.stat_data.在场角色=[{名:"叶红缨"}];
  return s;
}
function tag(text){return "<好感事件>"+text+"</好感事件>";}
const prose="叶红缨接过酒坛仰头饮尽，笑骂了一句。";

test("有效档位申报落账并记冷却；冷却内重复申报丢弃",()=>{
  const api=createMetricEvents(defs,profiles),s=state();
  const r1=api.apply(s,tag("叶红缨｜记心上｜依据：叶红缨接过酒坛仰头饮尽"),prose,5);
  assert.equal(r1.changes.length,1);assert.equal(r1.changes[0].delta,1);assert.equal(r1.changes[0].value,1);
  assert.equal(s.stat_data.metric_state.叶红缨.tier,"记心上");
  const r2=api.apply(s,tag("叶红缨｜记心上｜依据：叶红缨接过酒坛仰头饮尽"),prose,6);
  assert.equal(r2.changes.length,0);
  assert.match(s.stat_data.metric_diag[0].reason,/冷却/);
  const r3=api.apply(s,tag("叶红缨｜记心上｜依据：叶红缨接过酒坛仰头饮尽"),prose,8);
  assert.equal(r3.changes.length,1);assert.equal(r3.changes[0].value,2);
});
test("记恨档扣分并钳制在下限",()=>{
  const api=createMetricEvents(defs,profiles),s=state();
  s.stat_data.character_metrics.叶红缨.好感度=1;
  const r=api.apply(s,tag("叶红缨｜记恨｜依据：叶红缨接过酒坛仰头饮尽"),prose,5);
  assert.equal(r.changes[0].delta,-2);assert.equal(r.changes[0].value,0);
});
test("依据不在本回合正文中则丢弃并记诊断",()=>{
  const api=createMetricEvents(defs,profiles),s=state();
  const r=api.apply(s,tag("叶红缨｜记心上｜依据：这句话正文里没有"),prose,5);
  assert.equal(r.changes.length,0);
  assert.match(s.stat_data.metric_diag[0].reason,/不在本回合正文/);
});
test("一次性锚点只结算一次；可重复锚点受冷却约束",()=>{
  const api=createMetricEvents(defs,profiles),s=state();
  const a1=api.apply(s,tag("叶红缨｜锚点 yh_shengjiu｜依据：叶红缨接过酒坛仰头饮尽"),prose,5);
  assert.equal(a1.changes[0].delta,20);
  const a2=api.apply(s,tag("叶红缨｜锚点 yh_shengjiu｜依据：叶红缨接过酒坛仰头饮尽"),prose,20);
  assert.equal(a2.changes.length,0);assert.ok(s.stat_data.metric_anchor_done.yh_shengjiu);
  const b1=api.apply(s,tag("叶红缨｜锚点 yh_zengjiu｜依据：叶红缨接过酒坛仰头饮尽"),prose,5);
  assert.equal(b1.changes[0].delta,1);
  const b2=api.apply(s,tag("叶红缨｜锚点 yh_zengjiu｜依据：叶红缨接过酒坛仰头饮尽"),prose,6);
  assert.equal(b2.changes.length,0);
});
test("人工覆盖期间自动申报拒绝；双标签、未注册人物、不在场全丢弃",()=>{
  const api=createMetricEvents(defs,profiles);
  const s=state();s.manual["metric.叶红缨.好感度"]=0;
  assert.equal(api.apply(s,tag("叶红缨｜记心上｜依据：叶红缨接过酒坛仰头饮尽"),prose,5).changes.length,0);
  const two=state();
  assert.equal(api.apply(two,tag("叶红缨｜记心上｜依据：叶红缨接过酒坛仰头饮尽")+tag("叶红缨｜记恨｜依据：叶红缨接过酒坛仰头饮尽"),prose,5).changes.length,0);
  const unknown=state();
  assert.equal(api.apply(unknown,tag("路人甲｜记心上｜依据：叶红缨接过酒坛仰头饮尽"),prose,5).changes.length,0);
  const absent=state(false);
  assert.equal(api.apply(absent,tag("叶红缨｜记心上｜依据：叶红缨接过酒坛仰头饮尽"),prose,5).changes.length,0);
});
test("申报标签进入思考块时不作为正文证据，正常标签可结算",()=>{
  const api=createMetricEvents(defs,profiles),s=state();
  const body="<think>"+tag("叶红缨｜记心上｜依据：暗语")+"</think>"+prose+tag("叶红缨｜记心上｜依据：叶红缨接过酒坛仰头饮尽");
  const r=api.apply(s,body,prose+"<think>"+tag("叶红缨｜记心上｜依据：暗语")+"</think>",5);
  assert.equal(r.changes.length,1);assert.equal(r.changes[0].delta,1);
});
test("metricEntries 生成在场门控条目",()=>{
  const entries=metricEntries(defs);
  assert.equal(entries.length,Object.keys(defs).length);
  const ye=entries.find(e=>e.comment==="【好感事件表】叶红缨");
  assert.ok(ye.constant&&ye.disable&&ye.preventRecursion);
  assert.ok(ye.content.includes("记心上")&&ye.content.includes("yh_zengjiu"));
  const stat={身份:"赵无忧",在场角色:[{名:"叶红缨"}],character_metrics:{叶红缨:{好感度:0}}};
  assert.equal(managedEnabled("【好感事件表】叶红缨",stat),true);
  assert.equal(managedEnabled("【好感事件表】孤月",stat),false);
  assert.equal(managedEnabled("【好感事件表】叶红缨",{身份:"赵无忧",在场角色:[{名:"叶红缨"}],character_metrics:{}}),false);
  assert.equal(managedEnabled("【好感事件表】不存在的角色",stat),false);
});
test("真实卡数据：14 人物全部注册且锚点ID唯一",()=>{
  const names=Object.values(data.metricEventDefinitions).map(x=>x.character).sort();
  assert.deepEqual(names,["云织梦","叶红缨","孤月","闻观语","楚灵夜","苏瑶","苏玲","柳含烟","雨霏柔","花芷凝","苏倾寒","慕容清歌","顾云舒","陆烬颜"].sort());
  for(const[,cfg]of Object.entries(data.metricEventDefinitions)){
    assert.ok(data.characterProfiles[cfg.character],"未注册指标:"+cfg.character);
    const ids=cfg.anchors.map(a=>a.id);assert.equal(new Set(ids).size,ids.length);
  }
});
test("parseMetricEvent 兼容半角分隔与依据前缀",()=>{
  const r=parseMetricEvent(tag("叶红缨|记恨|依据：测试句子"));
  assert.equal(r.character,"叶红缨");assert.equal(r.target,"记恨");assert.equal(r.evidence,"测试句子");
});
test('对饮简短流水：闭合或末尾漏闭标签可核验，封顶/人工覆盖记实际+0，自证不入账',()=>{
 const api=createMetricEvents(defs,data.characterProfiles,data.promotionDefinitions),s=state();s.stat_data.身份='赵无忧';s.stat_data.completed_character_stages={叶红缨:'stage02'};s.stat_data.character_metrics.叶红缨.好感度=20;
 const prose='叶红缨举杯与你对饮。',report='<好感事件>叶红缨｜锚点 yh_gongyin｜依据：叶红缨举杯与你对饮。';
 assert.equal(api.apply(s,report,prose+report,5).changes[0].value,22);assert.equal(s.stat_data.favor_log.叶红缨[0].label,'对饮');assert.equal(s.stat_data.favor_log.叶红缨[0].delta,2);
 const bad=state();assert.equal(api.apply(bad,report,report,5).changes.length,0);
 s.stat_data.character_metrics.叶红缨.好感度=40;assert.equal(api.apply(s,report,prose+report,9).changes.length,0);assert.equal(s.stat_data.favor_log.叶红缨[0].delta,0);
 s.stat_data.character_metrics.叶红缨.好感度=20;s.manual['metric.叶红缨.好感度']=20;assert.equal(api.apply(s,report+'</好感事件>',prose,12).changes.length,0);assert.equal(s.stat_data.favor_log.叶红缨[0].delta,0);
});
