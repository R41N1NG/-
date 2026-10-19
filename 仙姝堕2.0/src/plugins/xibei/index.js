"use strict";
const C=require('../../runtime/contracts');
const {parseResultTag}=require('../promotion/index');
const {modal}=require('../../ui/dom');
const {buildNarrativeScope}=require('../../runtime/narrative_scope');
const {OPEN_DATE,EVENT_DEFS,place}=require('./event_tree');
const {canRecover}=require('../../runtime/character_stages');
const ID='xibei';
function state(s){return s.pluginState?.[ID] || {step:'map',route:null};}
function block(s,d){
 if(!d)return '未知西北事件代码';
 if(s.identity!=='赵无忧')return '西北除害仅对赵无忧开放';
 if(C.day(s.calendarDate)<C.day(OPEN_DATE))return '尚未到西北除害开放日期';
 if(s.activeEvent && s.activeEvent.pluginId!==ID)return '另一个事件尚未结束';
 if(state(s).step==='done')return '本次西北除害已经结束';
 if(!(Array.isArray(d.from)?d.from:[d.from]).includes(state(s).step))return '尚未到达此节点，或该分支已关闭';
 if(d.judge && (!state(s).ambushCode || !state(s).responseFloor))return '请先完成惊变入场并自由输入回应，再判定救护';
 return null;
}
function active(st){return st.step==='done'?null:{id:'xibei',pluginId:ID,step:st.step,place:place(st.step)};}
function configured(s,d,bonus=0){
 const st={...state(s),step:d.to};
 if(d.id==='xbxxLoot')st.lootTaken=true;
 if(d.exitDays)st.receipt={exitType:d.id==='xbxxLeave'?'early':'finished',rewards:(st.lootTaken || s.stat_data.inventory?.some(x=>x.source===ID && x.name==='极乐引'))?[{name:'极乐引',count:1}]:[],summaryLog:['西北除害 · '+d.label,...(d.id==='xbxxFinishA'?['孤月好感 +'+bonus]:[]),...(st.route?['救护分支：'+(st.route==='rescue'?'出手相护':'剑气自护')]:[])]};
 return {outcome:'success',pluginState:st,activeEvent:active(st),rewards:(d.rewards || []).map(name=>({name,count:1})),known:d.grantsKnown || [],...(d.exitDays?{elapsedDays:d.exitDays}:{}),reason:'玩家点选的本地配置结果',evidenceMode:'PLAYER_CHOICE_CONFIRMED'};
}
function createXibeiPlugin(stories,profiles={},promotions={}){
 function favorBonus(s,d){
  if(d.id!=='xbxxFinishA' || s.manual?.['metric.孤月.好感度']!==undefined || !canRecover(s.stat_data,profiles,'孤月','node:'+d.id))return 0;
  const requested=state(s).route==='rescue'?15:state(s).route==='dodge'?5:0,current=s.stat_data.character_metrics?.孤月?.好感度 ?? 0;
  const completed=s.stat_data.completed_character_stages?.孤月 || profiles.孤月?.initialStage || 'stage01';
  const thresholds=Object.values(promotions).filter(p=>p.character==='孤月'&&p.fromStage===completed&&p.conditions.some(c=>c.kind==='identity'&&c.value===s.identity)).map(p=>p.conditions.find(c=>c.kind==='metric')?.value).filter(Number.isFinite);
  const permanent=s.stat_data.character_metric_caps?.孤月?.好感度;
  const cap=Math.min(profiles.孤月?.metrics?.好感度?.max ?? 100,...thresholds,Number.isFinite(permanent)?permanent:100);
  return Math.max(0,Math.min(current+requested,cap)-current);
 }
 function list(s){return Object.values(EVENT_DEFS).filter(d=>!block(s,d));}
 function select(s,id){
  const d=EVENT_DEFS[id],reason=block(s,d);if(reason)return {id,allowed:false,reason};
  const st=state(s),bonus=favorBonus(s,d),result=d.judge?null:configured(s,d,bonus);
  const scope=buildNarrativeScope({place:place(d.to || st.step),cast:['赵无忧','孤月'],facts:['同行者只有赵无忧与孤月，剧情配置中的敌人与受困女子仅在相应现场出现，不引入其他同门','后续路线只由中控授权，不看正文节点名切换','名器/好感阶段继续读取后台，不因解蛊或更衣自动晋升'],options:[]});
  return {id,allowed:true,actionText:d.label,displayText:d.label,identities:['赵无忧'],open:OPEN_DATE,rewards:d.rewards || [],grantsKnown:d.grantsKnown || [],metricChanges:bonus?[{character:'孤月',key:'好感度',delta:bonus}]:[],
   prompt:d.judge?'只核验本次惊变后玩家已经输入并真实演绎的救护，不新增行动凑答案。':(d.rewards?'【固定奖励已入账】极乐引已加入储物栏，不重复发奖。\n':'')+stories[id].content+'\n'+scope,
   ...(d.judge?{completionQuery:'仅核验惊变行动'+st.ambushCode+'之后本次历史：玩家是否明确主动出手帮助孤月应对女奴偷袭？只依实际输入，尚未回应则无有效结果，不能补写挡蛊或凭旧救护判是。'}:{immediateResult:result,settlementMode:'choice',destination:place(d.to)}),
   ...(d.exitDays?{exitDays:d.exitDays,confirmText:d.id==='xbxxLeave'?'提前折返并结算6日？':'完成本次西北除害并结算10日？',settlement:{mode:'separate',title:d.label+' · 结算'}}:{})};
 }
 async function settle(s,p,body){
  const d=EVENT_DEFS[p.nodeId];if(!d || p.pluginId!==ID)return {outcome:'failure',reason:'西北行动不匹配'};
  const st={...state(s)};
  if(d.judge){
   const protocol=parseResultTag(body,p.actionCode),answer=protocol.answer;
   if(!answer){
    const reason={missing:'缺少结果标签',multiple:'收到多个结果标签',malformed:'结果标签格式不符合约定',wrong_id:'结果行动编号不匹配'}[protocol.status] || '回报无法解析';
    return {outcome:'retry',pluginState:st,activeEvent:active(st),reason:'救护判定未完成：'+reason,protocol};
   }
   st.route=answer==='是'?'rescue':'dodge';st.step=st.route;st.judgement={id:p.actionCode,answer};
   return {outcome:'success',pluginState:st,activeEvent:active(st),rewards:[],known:[],body:answer==='是'?'本次救护已确认，可以继续含津更衣剧情。':'本次未出手相护，可以继续孤月剑气自护剧情。',reason:'本轮救护回报已核验',evidenceMode:'XIBEI_JUDGEMENT',protocol};
  }
  if(!p.fixedApplied)return {outcome:'failure',reason:'本地节点结果尚未提交'};
  if(d.id==='xbxxAmbush'){st.ambushCode=p.actionCode;st.ambushFloor=s.floor;}
  return {outcome:'success',pluginState:st,activeEvent:active(st),rewards:[],known:[],body,reason:'点选结果已提交，不重复奖励或耗时',evidenceMode:'FIXED_NODE_CONFIRMED'};
 }
 function getPrompt(s){
  if(s.activeEvent?.pluginId!==ID)return '';
  const st=state(s);
  return buildNarrativeScope({place:place(st.step),cast:['赵无忧','孤月'],facts:[st.step==='ambush'?'女奴已发难，玩家自由回应；不代写玩家动作，不自动判定中蛊或解毒。玩家回应后点击判定本次救护。':'只承接当前已授权节点，不提前进入后续场景',st.route?'已核定路线：'+(st.route==='rescue'?'主动相护，后续含津更衣由玩家点选':'孤月自护，禁止中蛊/解毒/更衣'):'后续分歧未选择，不提前揭示', '同门关系与名器阶段仍按中控记录；事件期间不自行跳日'],options:list(s).map(d=>({label:d.label}))});
 }
 function mount(slot,runtime){
  if(!slot)return ()=>{};
  const s=runtime.getSnapshot();if(!s || s.identity!=='赵无忧' || state(s).step==='done' || C.day(s.calendarDate)<C.day(OPEN_DATE) || (s.activeEvent && s.activeEvent.pluginId!==ID))return ()=>{};
  const doc=slot.ownerDocument,button=doc.createElement('button');button.type='button';button.dataset.xibei='';button.textContent=s.activeEvent?.pluginId===ID?'西北除害 · 继续行动':'西北除害 · 可进行';button.style.cssText='color:#efce84;border:1px solid #d5b97b;border-radius:5px;padding:6px 10px;background:#24342b;box-shadow:0 0 10px #967e4166';slot.append(button);let dialog=null;
  button.onclick=()=>{
   if(dialog?.isConnected)return;
   const current=runtime.getSnapshot();if(!current || state(current).step==='done')return;
   // A historical/remounted HUD must not leave a second event dialog behind.
   doc.querySelectorAll('dialog[data-xsd2-xibei-dialog]').forEach(el=>el.close());
   dialog=modal(doc,'西北除害');dialog.dataset.xsd2XibeiDialog='';
   const opened=dialog,body=opened.querySelector('.xsd2-dialog-body'),hint=doc.createElement('p');hint.textContent=current.lastNodeResult?.nodeId==='xbxxJudge'&&current.lastNodeResult.outcome==='retry'
    ?current.lastNodeResult.reason+'。路线未改变，请重新请求判定。'
    :state(current).step==='ambush'?'先自由输入回应，再点击判定本次救护。':'可以先自由行动，准备好后再推进节点。';body.append(hint);
   const retry=current.pending?.nodeId==='xbxxJudge',choices=current.pending?(retry?[{id:'xbxxJudge',label:'重新生成救护判定'}]:[]):list(current);
   let busy=false;
   for(const d of choices){
    const b=doc.createElement('button');b.type='button';b.dataset.xibeiNode=d.id;b.textContent=d.label;b.style.cssText='display:block;margin:8px 0;width:100%;padding:9px;';body.append(b);
    b.onclick=async()=>{
     if(busy)return;busy=true;
     const buttons=[...body.querySelectorAll('[data-xibei-node]')];buttons.forEach(el=>{el.disabled=true;});
     try{
      const result=await runtime.dispatchIntent({type:retry?'RETRY_COMPLETION':'SELECT_NODE',pluginId:ID,expected:{chatId:current.chatId,branchId:current.branchId,floor:current.floor,revision:current.revision},payload:{nodeId:d.id}});
      if(result?.cancelled){hint.textContent='已取消结算，可以继续自由行动，准备好后再推进节点。';return;}
      if(opened.isConnected)opened.close();
     }catch(e){hint.textContent=e.message;}
     finally{busy=false;buttons.forEach(el=>{if(el.isConnected)el.disabled=false;});}
    };
   }
   if(!choices.length)hint.textContent='当前回复正在结算，请等待回复完成，或使用酒馆重新生成。';
  };
  return ()=>{button.remove();if(dialog?.isConnected)dialog.close();};
 }
 function observe(s,body,floor){const st=state(s);if(st.step==='ambush' && st.ambushCode && floor>st.ambushFloor)s.pluginState[ID]={...st,responseFloor:floor};}
 return {id:ID,observe,version:'1.0',select,settle,getPrompt,list,mount,getDisplayText:id=>EVENT_DEFS[id]?.label};
}
module.exports={createXibeiPlugin,EVENT_DEFS};
