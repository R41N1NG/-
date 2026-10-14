"use strict";
const C = require("../../runtime/contracts");
const {meets} = require("../../runtime/conditions");
const PLUGIN_ID = "character_promotion";
function resultTag(body, code) {
  const visible = String(body).replace(/<(?:think[^>]*|analysis)[^>]*>[\s\S]*?<\/(?:think[^>]*|analysis)>/gi, "")
    .replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi, "");
  const tags = [...visible.matchAll(/<Promotion_result\b[^>]*>[\s\S]*?<\/Promotion_result>/g)];
  if (tags.length !== 1) return null;
  const parsed = /^<Promotion_result id="([A-Za-z0-9_-]+)">\s*(是|否)\s*<\/Promotion_result>$/.exec(tags[0][0]);
  return parsed && parsed[1] === code ? parsed[2] : null;
}
function createPromotionPlugin(definitions, storyCatalog = {}) {
  const defs = Object.entries(definitions);
  function lookup(nodeId) {
    for (const [id,cfg] of defs) for (const [kind,key] of [["enter","entryId"],["finish","finishId"]])
      if (cfg[key] === nodeId) return {id,cfg,kind};
    return null;
  }
  const members=cfg=>cfg.participants || [cfg.character];
  const grants=cfg=>members(cfg).map(character=>({character,from:cfg.fromStage,to:cfg.toStage}));
  function stagesMatch(s,cfg){return members(cfg).every(name=>s.stat_data.character_stages?.[name]?.id===cfg.fromStage);}
  function stage(s,cfg) { return s.stat_data.character_stages?.[cfg.character]?.id; }
  function state(s) { return s.pluginState?.[PLUGIN_ID] || {}; }
  function available(s, item) {
    const {id,cfg,kind} = item;
    if (!stagesMatch(s,cfg) || (cfg.open && C.day(s.calendarDate)<C.day(cfg.open))) return false;
    if (kind === "enter") return !s.activeEvent && meets(s,cfg.conditions);
    return s.activeEvent?.pluginId === PLUGIN_ID && state(s).currentId === id;
  }
  function getDisplayText(nodeId) {
    const x = lookup(nodeId); if (!x) return null;
    return x.kind === "enter" ? x.cfg.label : "完成本次剧情";
  }
  function select(s,nodeId) {
    const x = lookup(nodeId);
    if (!x || !available(s,x)) return {id:nodeId,allowed:false,reason:"当前阶段、好感或事件状态不满足"};
    const {id,cfg,kind} = x;
    return {id:nodeId,allowed:true,character:cfg.character,characters:members(cfg),open:cfg.open,displayText:getDisplayText(nodeId),
      actionText:getDisplayText(nodeId),promotionId:id,promotionKind:kind,
      prompt:kind === "enter" ? cfg.story || storyCatalog[cfg.entryId]?.content : "核验本次专属剧情，不凭空补写新的行动以达成条件。",
      conditions:kind === "enter" ? cfg.conditions : [], rewards:[],grantsKnown:[],
      completionQuery:kind === "finish" ? "仅判断本次拜访（起始行动 "+(state(s).entryCode || "当前拜访")+"）之后的实际剧情，不把其他历史拜访当本次结果。"+cfg.query : undefined,
      stageGrant:kind === "finish" && !cfg.participants ? grants(cfg)[0] : undefined,
      stageGrants:kind === "finish" && cfg.participants ? grants(cfg) : undefined,
      // Only reserve the event on entry; do not mark the story complete or upgrade.
      reservedState:kind === "enter" ? {...state(s),currentId:id,lastResult:null,entryCode:null,ready:false} : undefined,
      immediateResult:kind === "enter" ? {outcome:"success",pluginState:{...state(s),currentId:id,lastResult:null,entryCode:null,ready:false},
        activeEvent:{pluginId:PLUGIN_ID,character:cfg.character,characters:members(cfg),promotionId:id},rewards:[],known:[]} : undefined,
    };
  }
  async function settle(s,p,body) {
    const x = lookup(p.nodeId);
    if (!x || p.pluginId !== PLUGIN_ID || state(s).currentId !== x.id) return {outcome:"failure",reason:"晋升行动不匹配"};
    const base = {...state(s)}, active = {pluginId:PLUGIN_ID,character:x.cfg.character,characters:members(x.cfg),promotionId:x.id};
    if (x.kind === "enter") return {outcome:"success",pluginState:{...base,entryCode:p.actionCode},activeEvent:active,body,reason:"专属故事已开启，仍为原阶段"};
    const report = resultTag(body,p.actionCode);
    if (!report) return {outcome:"retry",pluginState:{...base,lastResult:"invalid"},activeEvent:active,
      body:"本次结算未收到有效回报，尚未改变人物阶段。可以再次点击完成。",reason:"晋升回报缺失、冲突或行动标识不符"};
    const result = {outcome:report === "是" ? "success" : "failure",activeEvent:null,
      pluginState:{...base,currentId:null,lastResult:report,receipt:{id:p.id,character:x.cfg.character,answer:report}},
      body:report === "是" ? x.cfg.label+"已告一段落。" : x.cfg.label+"尚未达成相应条件。",reason:report === "是" ? "本轮回报确认达成" : "本轮回报未达成",evidenceMode:"PROMOTION_RESULT"};
    if (report === "是") {if(!stagesMatch(s,x.cfg))return {outcome:"retry",activeEvent:active,body:"双方阶段前置不一致，未提交晋升。"};if(x.cfg.participants)result.stageGrants=grants(x.cfg);else result.stageGrant=grants(x.cfg)[0];}
    return result;
  }
  function getReadyPrompt(s){
    const cfg=definitions[state(s).currentId],code=state(s).entryCode || s.pending?.actionCode;
    if(!cfg || !code || s.activeEvent?.pluginId!==PLUGIN_ID || s.pending?.selection?.promotionKind==="finish" || members(cfg).some(name=>(s.stat_data.character_metrics?.[name]?.好感度??0)<0))return "";
    return "本轮正常演绎后核对当前专属剧情是否已具备完成条件："+cfg.query+"。仅看起始行动"+code+"之后本次剧情及已有真实历史，不补写行动凑条件。文末追加唯一一项<Promotion_ready id=\""+code+"\">是</Promotion_ready>或<Promotion_ready id=\""+code+"\">否</Promotion_ready>。此回报只提示玩家可完成；不结束剧情、不晋升，仍须玩家点击完成后另行结算。";
  }
  function observe(s,body,floor){
    const cfg=definitions[state(s).currentId];
    if(!cfg || !state(s).entryCode || s.activeEvent?.pluginId!==PLUGIN_ID || !stagesMatch(s,cfg))return;
    const answer=resultTag(String(body).replaceAll("Promotion_ready","Promotion_result"),state(s).entryCode);
    // Only the progress protocol is accepted; a final result in a free turn cannot grant readiness.
    const visible=String(body).replace(/<(?:think[^>]*|analysis)[^>]*>[\s\S]*?<\/(?:think[^>]*|analysis)>/gi,"").replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi,"");
    if(!/<Promotion_ready\b/.test(visible) || /<Promotion_result\b/.test(visible) || !answer)return;
    s.pluginState[PLUGIN_ID]={...state(s),ready:answer==="是",readyFloor:floor};
  }
  function getPrompt(s) {
    const cfg = definitions[state(s).currentId];
    if (!cfg || s.activeEvent?.pluginId !== PLUGIN_ID) return "";
    if(members(cfg).some(name=>(s.stat_data.character_metrics?.[name]?.好感度??0)<0))return "当前关系已转为负好感，以中控当前负向心智为准；原正向专属剧情暂停，不继续演绎原亲密邀请或提交晋升。已完成阶段保留，玩家可自由行动修复关系。";
    return "本段参与者："+members(cfg).join("、")+"与玩家；不引入无关同门。关系与身体事实分开核验。"+"【当前专属故事】"+cfg.label+"。承接已有历史及当前实际地点，沿用"+cfg.character+"原阶段设定。入口已开启，不反复重演敲门/入场，让玩家自由行动。人物阶段尚未晋升，等待玩家点击完成。正文出现结果或节点名称不会自动结算，不自动切换其他事件，不自行跳日。"+getReadyPrompt(s);
  }
  const plugin = {id:PLUGIN_ID,version:"1.0",select,settle,getPrompt,getReadyPrompt,observe,getDisplayText,
    list(s) {
      const currentIdent = s.identity || s.stat_data?.身份;
      const filtered = defs.filter(([_, cfg]) => {
        const identCond = cfg.conditions?.find(c => c.kind === "identity");
        return !identCond || identCond.value === currentIdent;
      });
      const byChar = new Map();
      for (const [id, cfg] of filtered) {
        const char = cfg.character;
        const curStage = stage(s, cfg);
        const isActive = s.activeEvent?.pluginId === PLUGIN_ID && state(s).currentId === id;
        const isCurrent = cfg.fromStage === curStage;
        const isPast = cfg.toStage === curStage;
        if (!byChar.has(char)) {
          byChar.set(char, { id, cfg, isActive, isCurrent, isPast });
        } else {
          const prev = byChar.get(char);
          if (isActive) {
            byChar.set(char, { id, cfg, isActive, isCurrent, isPast });
          } else if (!prev.isActive && isCurrent) {
            byChar.set(char, { id, cfg, isActive, isCurrent, isPast });
          } else if (!prev.isActive && !prev.isCurrent && isPast) {
            byChar.set(char, { id, cfg, isActive, isCurrent, isPast });
          }
        }
      }
      return [...byChar.values()].map(({ id, cfg }) => ({
        id,
        cfg,
        phase: stage(s, cfg),
        active: s.activeEvent?.pluginId === PLUGIN_ID && state(s).currentId === id,
        allowed: available(s, { id, cfg, kind: "enter" }),
        lastResult: state(s).lastResult,
      }));
    },
  };
  return plugin;
}
module.exports = {createPromotionPlugin,resultTag,PLUGIN_ID};
