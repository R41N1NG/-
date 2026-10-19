"use strict";
const { writeMetric, metricSpec, canRecover, isPalaceLord } = require("./character_stages");

// 数值事件申报：模型对每个角色每轮至多一个 <好感事件> 标签，申报「档位」或「锚点ID」＋原文依据；
// 分值、上限、冷却全部由配置与后台决定，模型只有举证权，没有定价权。
function proofText(text){
 return String(text).replace(/<\/?(?:span|b|strong|em|i|u|s|p|div|br|blockquote)\b[^>]*>/gi,"")
  .replace(/&(?:#(x[0-9a-f]+|[0-9]+)|nbsp|quot|apos|amp|lt|gt);/gi,(entity,n)=>{
   if(n){const code=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return code>0&&code<=0x10ffff?String.fromCodePoint(code):entity;}
   return ({'&nbsp;':' ','&quot;':'"','&apos;':"'",'&amp;':'&','&lt;':'<','&gt;':'>'})[entity.toLowerCase()] || entity;
  }).normalize("NFKC").replace(/[“”「」『』]/g,'"').replace(/[‘’]/g,"'")
  .replace(/[\s\u200b-\u200d\ufeff*_`]/g,"");
}
function canonicalCharacter(name){return String(name || '').replace(/[（(][\s\S]*?[）)]/g,'').trim();}
function stripForEvidence(text) {
  return String(text)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<Promotion_ready\b[^>]*>[\s\S]*?<\/Promotion_ready>/gi, "")
    .replace(/<(?:think[^>]*|analysis)[^>]*>[\s\S]*?<\/(?:think[^>]*|analysis)>/gi, "")
    .replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi, "")
    .replace(/<(Status_block|StatusBlock|status)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<好感事件>[\s\S]*?(?:<\/好感事件>|(?=<Status_block>|$))/g, "");
}
function eventText(body){
 return String(body)
  .replace(/<!--[\s\S]*?-->/g,'')
  .replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1>/gi,'')
  .replace(/<(?:think[^>]*|analysis)[^>]*>[\s\S]*?<\/(?:think[^>]*|analysis)>/gi,'')
  .replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi,'')
  .replace(/<(Status_block|StatusBlock|status)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
}
function parseMetricEvents(body) {
 const visible=eventText(body);
 const tags=[...visible.matchAll(/<好感事件>([\s\S]*?)(?:<\/好感事件>|(?=<好感事件>|<(?:Status_block|StatusBlock|status)\b|$))/g)];
 return tags.map(tag=>{
  const parts=tag[1].split(/[｜|]/).map(x=>x.trim()),character=canonicalCharacter(parts[0]);
  if(parts.length!==3 || !parts[0] || !parts[1] || !parts[2])return {ok:false,character,reason:'申报格式应为 人物名｜档位或锚点ID｜依据'};
  return {ok:true,character,target:parts[1],evidence:parts[2].replace(/^依据[:：]\s*/,'').trim().replace(/^[“「『"]|[”」』"]$/g,'')};
 });
}
// Compatibility for callers that explicitly expect a single report.
function parseMetricEvent(body) {
 const reports=parseMetricEvents(body);
 return reports.length===1?reports[0]:{ok:false,reason:'单条申报读取需要一个标签'};
}

function visibleCharacters(stat) {
  return new Set([
    stat.身份,
    stat.stage_focus,
    ...(stat.stage_focuses || []),
    ...(stat.在场角色 || []).map(x=>x.名),
    ...String(stat.在场 || '').split(/[、，,；;｜|\n]/),
  ].map(canonicalCharacter).filter(Boolean));
}
function createMetricEvents(defs, profiles, promotions) {
  const table = Object.entries(defs || {});
  // 好感上限梯：按晋升线配置取「当前阶段对应的下一节点阈值」——完成节点之前，好感不得越过该数值
  const ladders = {};
  for (const [, p] of Object.entries(promotions || {})) {
    for(const name of p.participants || [p.character]){
      const cond=(p.conditions || []).find(c=>c.kind==="metric"&&c.character===name);if(!cond)continue;
      (ladders[name] ||= []).push({threshold:Number(cond.value),fromStage:p.fromStage,identity:p.conditions?.find(c=>c.kind==="identity")?.value});
    }
  }
  function favorCap(stat, character, profilesRef) {
    const list = ladders[character];
    if (!list || !list.length) return null;
    const stage =
      stat.completed_character_stages?.[character] ||
      profilesRef?.[character]?.initialStage;
    const candidates = list.filter((x) => x.fromStage === stage && (!x.identity || x.identity === stat.身份));
    if (!candidates.length) return null;
    return Math.min(...candidates.map((x) => x.threshold));
  }
  function lookup(character) {
    return table.find(([, cfg]) => cfg.character === character);
  }
  function eventLabel(cfg,via){const anchor=(cfg.anchors||[]).find(x=>x.id===via);return anchor?.label || (anchor?.desc ? anchor.desc.split(/[（，、：]/)[0].replace(/^(与她|给她|赠她|为她|替她|帮她|当众|主动)/,'').slice(0,8) : via==='记心上'?'交心':via==='记恨'?'不睦':'互动');}
  function record(stat,cfg,via,delta,storyCount,evidence){
    stat.favor_log ||= {};(stat.favor_log[cfg.character] ||= []).unshift({label:eventLabel(cfg,via),delta,via,turn:storyCount,note:evidence.slice(0,40)});
    if(stat.favor_log[cfg.character].length>12)stat.favor_log[cfg.character].length=12;
  }
  function drop(stat, storyCount, reason) {
    if(stat.lastFavorCheck){stat.lastFavorCheck.reason=reason;stat.lastFavorCheck.status="rejected";}
    stat.metric_diag ||= [];
    stat.metric_diag.unshift({ turn: storyCount, reason });
    if (stat.metric_diag.length > 10) stat.metric_diag.length = 10;
    return { changes: [] };
  }
  function applyOne(s, parsed, prose, storyCount) {
    const stat = (s.stat_data ||= {});
    stat.metric_state ||= {};
    stat.metric_anchor_done ||= {};
    const changes = [];
    stat.lastFavorCheck={turn:storyCount,character:parsed.character || null,reported:true,status:"checking",target:parsed.target || null,reason:null};
    if (isPalaceLord(s.identity || stat.身份)) {
      return drop(stat, storyCount, "殿主身份下好感度系统关闭，采用名器恶堕阶梯");
    }
    const visible = visibleCharacters(stat);
    if (!parsed.ok)return drop(stat,storyCount,parsed.reason);
    if (!visible.has(parsed.character)) return drop(stat, storyCount, parsed.character + " 不在场，申报无效");
    const found = lookup(parsed.character);
    if (!found) return drop(stat, storyCount, parsed.character + " 未注册好感表");
    const [, cfg] = found;
    const st = (stat.metric_state[parsed.character] ||= {});
    const proseVisible = stripForEvidence(prose);
    const evidence=proofText(parsed.evidence),narrative=proofText(proseVisible);
    const matched=!!evidence && narrative.includes(evidence);
    stat.lastFavorCheck.evidence={quote:parsed.evidence.slice(0,240),prosePreview:proseVisible.slice(0,600),matched,normalization:'display-v1'};
    if (!matched)
      return drop(stat, storyCount, "申报依据不在本回合正文中：须引用原句，不可改写、拼接或引用上轮内容");
    const spec = metricSpec(profiles, cfg.character, cfg.metric.key);
    let current = stat.character_metrics?.[cfg.character]?.[cfg.metric.key] ?? spec.default;
    writeMetric(stat,profiles,cfg.character,cfg.metric.key,current);
    let delta, via;
    if (cfg.metric.tiers && cfg.metric.tiers[parsed.target] !== undefined) {
      delta = cfg.metric.tiers[parsed.target];
      via = parsed.target;
      if (st.tier === via && storyCount - (st.turn || -999) < (cfg.cooldownTurns || 0))
        return drop(stat, storyCount, cfg.character + "「" + via + "」档位冷却中");
    } else {
      const anchorId = parsed.target.replace(/^锚点\s*/, "");
      const anchor = (cfg.anchors || []).find((a) => a.id === anchorId || a.label === anchorId);
      if (!anchor) return drop(stat, storyCount, "锚点 " + anchorId + " 不在配置内");
      delta = anchor.delta;
      const penalty=profiles[cfg.character]?.preFinalPenalty;
      const completed=stat.completed_character_stages?.[cfg.character] || profiles[cfg.character]?.initialStage;
      if(penalty?.anchorId===anchor.id && (profiles[cfg.character].stages.find(x=>x.id===completed)?.priority??0)<(profiles[cfg.character].stages.find(x=>x.id===penalty.beforeStage)?.priority??Infinity)){
        const proof=coercionEvidence(proseVisible,[s.identity,stat.自设?.name,"你"].filter(Boolean),cfg.character);
        if(!proof)return drop(stat,storyCount,"强迫企图缺少真实正文动作，标签不确权");
        delta=Math.min(current,penalty.target)-current;
      }
      via = anchor.id;
      stat.metric_anchor_done ||= {};
      if (!anchor.repeat && stat.metric_anchor_done[anchor.id])
        return drop(stat, storyCount, "锚点 " + anchorId + " 为一次性事件，已结算");
      st.anchorTurn ||= {};
      if (anchor.repeat !== false && storyCount - (st.anchorTurn[anchor.id] || -999) < (anchor.cooldownTurns ?? cfg.cooldownTurns ?? 0))
        return drop(stat, storyCount, "锚点 " + anchorId + " 冷却中");
    }
    if (s.manual && s.manual["metric." + cfg.character + "." + cfg.metric.key] !== undefined){record(stat,cfg,via,0,storyCount,parsed.evidence);return drop(stat,storyCount,cfg.character+" 好感处于人工覆盖，自动申报拒绝");}
    if(delta>0 && !canRecover(stat,profiles,cfg.character,via,parsed.evidence))return drop(stat,storyCount,"当前负好感档位不接受该正向事件");
    // 好感上限铁律：完成节点之前，好感不得越过该节点的数值
    const permanent=stat.character_metric_caps?.[cfg.character]?.[cfg.metric.key];
    const cap = Math.min(favorCap(stat,cfg.character,profiles)??spec.max,Number.isFinite(permanent)?permanent:spec.max);
    if(delta>0 && Number.isFinite(permanent) && current>=permanent){record(stat,cfg,via,0,storyCount,parsed.evidence);return drop(stat,storyCount,"好感永久上限为−50，不能恢复到−49及以上");}
    if (delta > 0 && cap !== null) {
      if (current >= cap){record(stat,cfg,via,0,storyCount,parsed.evidence);return drop(stat, storyCount, cfg.character + " 好感已达当前节点上限（" + cap + "）——完成对应专属剧情后方可继续累积");}
      if (current + delta > cap) delta = cap - current;
    }
    const value = Math.max(spec.min, Math.min(spec.max, current + delta));
    writeMetric(stat, profiles, cfg.character, cfg.metric.key, value);
    if (cfg.metric.tiers && cfg.metric.tiers[parsed.target] !== undefined) {
      st.tier = via;
      st.turn = storyCount;
    } else {
      const anchorId = via;
      st.anchorTurn ||= {};
      st.anchorTurn[anchorId] = storyCount;
      const anchor = (cfg.anchors || []).find((a) => a.id === anchorId || a.label === anchorId);
      if (anchor && anchor.repeat === false) stat.metric_anchor_done[anchorId] = true;
    }
    stat.lastFavorCheck.reason=null;stat.lastFavorCheck.status="applied";
    record(stat,cfg,via,value-current,storyCount,parsed.evidence);
    changes.push({ character: cfg.character, key: cfg.metric.key, delta, value, via });
    return { changes };
  }
  function apply(s,body,prose,storyCount,options={}){
    const stat=(s.stat_data ||= {}),reports=parseMetricEvents(body),checks=[],changes=[];
    if(!reports.length){
      stat.lastFavorCheck={turn:storyCount,character:null,reported:false,status:'missing',target:null,reason:'本轮未申报好感事件'};
      stat.lastFavorChecks=[stat.lastFavorCheck];return {changes};
    }
    const grouped=new Map();
    for(const report of reports){const key=report.character || '';if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(report);}
    for(const [character,list] of grouped){
      let parsed=list[0];
      if(list.length>1)parsed={ok:false,character,reason:character+' 本轮申报不止一次，同一角色仅允许一次好感结算'};
      if(options.excludedCharacters?.includes(character))parsed={ok:false,character,reason:character+' 本轮已执行正文强迫惩罚，不重复应用普通好感申报'};
      const result=applyOne(s,parsed,prose,storyCount);changes.push(...result.changes);checks.push(stat.lastFavorCheck);
    }
    stat.lastFavorChecks=checks;return {changes};
  }
  return { apply, lookup };
}
function coercionEvidence(prose,actors,name){
 const visible=stripForEvidence(prose).replace(/[「“"][^」”"\n]*[」”"]/g,"");
 return visible.split(/[。！？\n]/).find(line=>{
  if(!actors.some(a=>line.includes(a)) || /据说|传闻|计划|准备|打算|假如|如果|讨论|扬言|威胁|声称|宣称|回忆|曾经|上次|记得|想象|幻想|想要|将要|不会|不曾|没有强|并未强/.test(line))return false;
  return [...line.matchAll(/强行|强迫|强占|硬要/g)].some(m=>{const part=line.slice(m.index).split(/[，；]/)[0];return part.includes(name)&&/破身|侵犯|非礼|强占/.test(part);});
 });
}
function applyPreFinalPenalty(s,prose,profiles,turn){
 const stat=s.stat_data;
 if (isPalaceLord(s.identity || stat?.身份)) return [];
 const visible=stripForEvidence(prose).replace(/[「“"][^」”"\n]*[」”"]/g,"");
 const actors=[s.identity,stat.自设?.name,"你"].filter(Boolean),penalized=[];
 for(const [name,cfg] of Object.entries(profiles)){
  const rule=cfg.preFinalPenalty;if(!rule)continue;
  const currentStage=stat.completed_character_stages?.[name] || cfg.initialStage;
  if((cfg.stages.find(x=>x.id===currentStage)?.priority??0)>=(cfg.stages.find(x=>x.id===rule.beforeStage)?.priority??Infinity))continue;
  const proof=coercionEvidence(visible,actors,name);
  if(!proof)continue;
  const current=stat.character_metrics?.[name]?.好感度 ?? cfg.metrics.好感度.default,value=Math.min(current,rule.target);
  writeMetric(stat,profiles,name,"好感度",value);
  if(s.manual?.["metric."+name+".好感度"]!==undefined)s.manual["metric."+name+".好感度"]=value;
  stat.favor_log ||= {};(stat.favor_log[name] ||= []).unshift({label:"强行越界",delta:value-current,via:"pre-final-coercion",turn,note:proof.slice(0,80)});stat.favor_log[name]=stat.favor_log[name].slice(0,12);
  penalized.push(name);
 }
 return penalized;
}
module.exports = { applyPreFinalPenalty,createMetricEvents, visibleCharacters, parseMetricEvent, parseMetricEvents, stripForEvidence };
