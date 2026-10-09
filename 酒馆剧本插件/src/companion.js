(function(root,factory){const node=typeof window==='undefined' && typeof module==='object' && module.exports;const value=factory(node?require('./core'):root.BSECore,node?require('./flow'):root.BSEFlow);if(node)module.exports=value;else root.BSECompanion=value;})(typeof window!=='undefined'?window:globalThis,function(C,F){
  'use strict';
  const TAG='bse-report';
  const PREVIOUS_PROMPT='正文结束后附一个HTML注释：<!--<bse-report>JSON</bse-report>-->。只报告本轮正文实际发生的事实；玩家命令、意图、回忆、假设不等于成功。只用候选编号，遗漏或不确定填uncertain。每项quote摘录本轮正文连续原句，至多160字。不算数值、不发奖励、不解锁未提供剧情。格式：{"turn":"输入turn","complete":true,"stages":[{"id":"阶段ID","status":"in_progress|completed|uncertain","quote":"正文原句"}],"events":[{"id":"事件ID","status":"completed|rejected|uncertain","quote":"正文原句","actor_id":"候选主体","recipient_id":"候选对象","attempt":"待定尝试编号，可省略"}],"choice":{"target":"本轮可选target或空","quote":"正文实际采取行动的原句"},"present":["已定义在场角色ID"]}。没发生的事件省略。关闭标签与注释结束符不可遗漏，不在正文显示技术编号。阶段完成须同时满足criteria与exit_criteria；离开必须正文实际离开，进入不代表完成。';
  const V152_PROMPT=PREVIOUS_PROMPT.replace('<!--<bse-report>JSON</bse-report>-->','<!--BSE_REPORT JSON -->').replace('关闭标签与注释结束符不可遗漏','JSON须完整，HTML注释以-->结束；不再套bse-report标签。TSE等其他状态元数据可以放在该注释前后，但不算正文证据');
  const PROMPT=V152_PROMPT+'进入选择choice和阶段完成stages彼此独立：stages只用输入stages里的ID，空列表时输出[]；routes里的目标是可进入节点，不能报告它已完成。每轮最多选择一个入口，不跨跳。choice可用source:"user"、quote摘录输入player_input中明确采取行动的原句；讨论、否定、假设不选。或source:"assistant"引用正文中玩家实际采取行动，不以NPC移动代替玩家选择。不确定choice=null。取得物品与阶段离开分别判断，不把到达当完成。turn逐字复制，禁止自造。';
  const tse=()=>/<tse_meta\b[^>]*>[\s\S]*?<\/tse_meta\s*>/g;
  function stripMetadata(text){return text.replace(tse(),'\n').replace(/<!--\s*(?:BSE_REPORT\b|<bse-report>)[\s\S]*?-->/g,'\n').replace(/<bse-report>[\s\S]*?<\/bse-report>/g,'\n').replace(/(?:<!--\s*(?:BSE_REPORT\b|<bse-report>)|<bse-report>)[\s\S]*$/,'\n');}
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
    const markers=[...text.matchAll(/<!--\s*BSE_REPORT\b|<bse-report>/g)];
    C.assert(markers.length===1,'剧情回报缺失、截断或重复');
    const matches=[...text.matchAll(/<!--\s*BSE_REPORT\s+([\s\S]*?)\s*-->|<!--\s*<bse-report>\s*([\s\S]*?)\s*-->|<bse-report>\s*([\s\S]*?)\s*<\/bse-report>/g)];
    C.assert(matches.length===1,'剧情回报注释未完整关闭或报告截断');const match=matches[0];
    // An unclosed comment must not be mistaken for a valid bare legacy tag.
    C.assert(match[3]===undefined || !/<!--\s*$/.test(text.slice(0,match.index)),'剧情回报注释未完整关闭');
    let json=match[1] ?? match[2] ?? match[3],repair='';
    if(match[2]!==undefined){if(/<\/bse-report>\s*$/.test(json))json=json.replace(/<\/bse-report>\s*$/,'');else repair='旧报告缺少结束标签；完整JSON与注释已通过格式恢复';}
    C.assert(!text.slice(match.index+match[0].length).replace(tse(),'').trim(),'剧情回报后含正文或不完整元数据');C.assert(json.length<=12000,'剧情回报过长');
    let raw;try{raw=JSON.parse(json);}catch{throw new Error('剧情回报JSON格式错误');}
    C.assert(C.object(raw) && raw.turn===expected.turn && raw.complete===true,'剧情回报标识不匹配或不完整');
    const originalBody=text.slice(0,match.index),body=stripMetadata(originalBody);const evidence=quote=>typeof quote==='string' && quote.trim() && quote.length<=160 && body.includes(quote) && originalBody.includes(quote);
    const warnings=[];
    const items=(list,candidates,statuses,kind)=>{
      if(!Array.isArray(list) || list.length>32){warnings.push(kind+'列表格式无效，已单独忽略');return [];}
      const counts=new Map();for(const x of list)if(C.object(x))counts.set(x.id,(counts.get(x.id) || 0)+1);
      return list.flatMap(x=>{
        if(!C.object(x) || !candidates.some(c=>c.id===x.id) || counts.get(x.id)!==1 || !statuses.includes(x.status)){warnings.push(kind+'项 '+String(x?.id || '?').slice(0,80)+' 越界、重复或状态无效，未结算');return [];}
        return [{...x,status:x.status==='completed' && !evidence(x.quote)?'uncertain':x.status,quote:evidence(x.quote)?x.quote:''}];
      });
    };
    const stages=items(raw.stages || [],expected.stages,['in_progress','completed','uncertain'],'阶段'),events=items(raw.events || [],expected.events,['completed','rejected','uncertain'],'事件');
    for(const event of events){const def=expected.events.find(e=>e.id===event.id);if(event.status==='completed' && (def.actor_id && event.actor_id!==def.actor_id || def.recipient_id && event.recipient_id!==def.recipient_id))event.status='uncertain';}
    let choice=null;
    if(raw.choice?.target){
      const x=raw.choice,fromUser=x.source==='user',validQuote=fromUser ? typeof x.quote==='string' && x.quote.trim() && x.quote.length<=160 && typeof expected.player_input==='string' && expected.player_input.includes(x.quote) : (x.source==null || x.source==='assistant') && evidence(x.quote);
      if((!expected.routes || expected.routes.some(r=>r.target===x.target)) && validQuote)choice=x;
      else warnings.push('进入选择不属于本轮入口或缺少对应来源依据，未推进');
    }
    return {body,repair,warnings,stages,events,choice,present:Array.isArray(raw.present)?raw.present.filter(x=>typeof x==='string').slice(0,16):[]};
  }
  function blocked(p,s){return init(s).queue.some(x=>x.kind==='stage' && x.id===s.current_node_id && !['dismissed','settled'].includes(x.status));}
  return {TAG,PROMPT,PREVIOUS_PROMPT,V152_PROMPT,stripMetadata,refsIn,init,log,critical,spec,parse,blocked};
});
