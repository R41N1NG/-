(function(root,factory){const node=typeof window==='undefined' && typeof module==='object' && module.exports;const value=factory(node?require('./core'):root.BSECore,node?require('./flow'):root.BSEFlow);if(node)module.exports=value;else root.BSECompanion=value;})(typeof window!=='undefined'?window:globalThis,function(C,F){
  'use strict';
  const TAG='bse-report';
  const PROMPT='正文结束后附一个HTML注释：<!--<bse-report>JSON</bse-report>-->。只报告本轮正文实际发生的事实；玩家命令、意图、回忆、假设不等于成功。只用候选编号，遗漏或不确定填uncertain。每项quote摘录本轮正文连续原句，至多160字。不算数值、不发奖励、不解锁未提供剧情。格式：{"turn":"输入turn","complete":true,"stages":[{"id":"阶段ID","status":"in_progress|completed|uncertain","quote":"正文原句"}],"events":[{"id":"事件ID","status":"completed|rejected|uncertain","quote":"正文原句","actor_id":"候选主体","recipient_id":"候选对象","attempt":"待定尝试编号，可省略"}],"choice":{"target":"本轮可选target或空","quote":"正文实际采取行动的原句"},"present":["已定义在场角色ID"]}。没发生的事件省略。关闭标签与注释结束符不可遗漏，不在正文显示技术编号。阶段完成须同时满足criteria与exit_criteria；离开必须正文实际离开，进入不代表完成。';
  const refsIn=c=>{if(!C.object(c))return [];const [op,v]=Object.entries(c)[0];return ['all','any'].includes(op)?v.flatMap(refsIn):op==='not'?refsIn(v):['collected','completed','event_completed','variable'].includes(op)?[op+':'+(op==='variable'?v.id:v)]:[];};
  function init(s){s.companion ||= {turn:null,queue:[],reports:{},attempts:{},round:0,logs:[],message_snapshots:{},present:[],stage_dialogues:{}};const q=s.companion;C.assert(C.object(q) && Array.isArray(q.queue) && Array.isArray(q.logs) && C.object(q.reports) && C.object(q.attempts) && C.object(q.message_snapshots),'剧情回报存档损坏，请恢复备份');q.stage_dialogues ||= {};return q;}
  function log(s,kind,message,extra={}){const q=init(s);q.logs.push({kind,message,...extra,at:Date.now()});q.logs=q.logs.slice(-100);}
  function critical(p,kind,id){
    const def=kind==='stage'?p.nodes.find(n=>n.id===id):p.events.find(e=>e.id===id);
    if(!def)return true;if(def.verification==='critical' || def.irreversible)return true;
    if(kind==='stage' && (def.kind==='ending' || def.checkpoint))return true;
    const effects=def.effects || [], tokens=effects.map(e=>e.collect?'collected:'+e.collect:'variable:'+(e.add || e.set).variable);
    if(kind==='stage')tokens.push('completed:'+id);else tokens.push('event_completed:'+id);
    const conditions=p.nodes.flatMap(n=>[n.entry_condition,...n.routes.map(r=>r.condition)]).concat(p.packages.flatMap(b=>[b.condition,b.continue_condition]),p.collections.map(c=>c.requires),p.events.map(e=>e.condition));
    return effects.some(e=>e.collect) || conditions.some(c=>refsIn(c).some(x=>tokens.includes(x)));
  }
  function spec(p,s,turn){
    const active=F.activeNodes(p,s), events=[...new Map(active.flatMap(x=>C.eligibleEvents(p,s,x.node_id).filter(e=>!e.completion_node_id && e.detection!=='manual').map(e=>[e.id,e])).map(x=>x)).values()].slice(0,32);
    const stages=active.map(x=>({...x,id:x.node_id,...C.clone(p.nodes.find(n=>n.id===x.node_id))})).filter(n=>!s.completed_node_ids.includes(n.id));
    const relevant=new Set([...init(s).present,...stages.flatMap(n=>(n.context_actors || []).concat((n.context_variables || []).map(k=>p.variables.find(v=>v.id===k)?.owner))),...events.flatMap(e=>[e.actor_id,e.recipient_id])]);
    return {turn,actors:p.actors.filter(a=>relevant.has(a.id)).map(a=>({id:a.id,name:a.name,aliases:a.aliases || []})),stages:stages.map(n=>({id:n.id,title:n.title,criteria:n.completion_criteria,exclusions:n.completion_exclusions,completion_action:n.completion_action || null,exit_criteria:n.completion_action?.intent || n.completion_action?.action_text || n.completion_action?.label || ''})),events:events.map(e=>({id:e.id,criteria:e.completion_criteria,exclusions:e.exclusions,actor_id:e.actor_id || '',recipient_id:e.recipient_id || '',attempt:Object.values(init(s).attempts).find(a=>a.event_id===e.id && a.status==='uncertain')?.id || ''})),active};
  }
  function parse(text,expected){
    C.assert(typeof text==='string' && text.length<=2000000,'正文长度无效');
    const matches=[...text.matchAll(/(?:<!--\s*)?<bse-report>\s*([\s\S]*?)\s*<\/bse-report>(?:\s*-->)?/g)];
    C.assert(matches.length===1,'剧情回报缺失、截断或重复');const match=matches[0];
    C.assert(!match[0].startsWith('<!--') || match[0].endsWith('-->'),'剧情回报注释未完整关闭');
    C.assert(!text.slice(match.index+match[0].length).trim(),'剧情回报必须位于正文末尾');C.assert(match[1].length<=12000,'剧情回报过长');
    let raw;try{raw=JSON.parse(match[1]);}catch{throw new Error('剧情回报JSON格式错误');}
    C.assert(C.object(raw) && raw.turn===expected.turn && raw.complete===true,'剧情回报标识不匹配或不完整');
    const body=text.slice(0,match.index);const evidence=quote=>typeof quote==='string' && quote.trim() && quote.length<=160 && body.includes(quote);
    const items=(list,candidates,statuses,kind)=>{
      C.assert(Array.isArray(list) && list.length<=32,kind+'回报格式无效');const seen=new Set();
      return list.map(x=>{C.assert(C.object(x) && candidates.some(c=>c.id===x.id) && !seen.has(x.id) && statuses.includes(x.status),'剧情回报包含未知、重复编号或状态');seen.add(x.id);return {...x,status:x.status==='completed' && !evidence(x.quote)?'uncertain':x.status,quote:evidence(x.quote)?x.quote:''};});
    };
    const stages=items(raw.stages || [],expected.stages,['in_progress','completed','uncertain'],'阶段'),events=items(raw.events || [],expected.events,['completed','rejected','uncertain'],'事件');
    for(const event of events){const def=expected.events.find(e=>e.id===event.id);if(event.status==='completed' && (def.actor_id && event.actor_id!==def.actor_id || def.recipient_id && event.recipient_id!==def.recipient_id))event.status='uncertain';}
    return {body,stages,events,choice:raw.choice && evidence(raw.choice.quote)?raw.choice:null,present:Array.isArray(raw.present)?raw.present.filter(x=>typeof x==='string').slice(0,16):[]};
  }
  function blocked(p,s){return init(s).queue.some(x=>x.kind==='stage' && x.id===s.current_node_id && !['dismissed','settled'].includes(x.status));}
  return {TAG,PROMPT,refsIn,init,log,critical,spec,parse,blocked};
});
