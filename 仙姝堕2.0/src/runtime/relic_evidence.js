"use strict";
const C = require('./contracts');
const {stripForEvidence} = require('./metric_events');
// A missing report can be recovered from a clear, attributable action.
// Each stage uses its existing action set; counting never grants a stage.
function inferRelicActions(rules, prose, known, identity, reported = new Set()) {
  const visible=stripForEvidence(prose).replace(/[「“"][^」”"\n]*[」”"]/g,'');
  const configs=Object.values(rules.RELIC_PILOT_CONFIG);
  const result=[];
  const STAGE2_ACTIONS=rules.RELIC_STAGE_ACTIONS[2],STAGE3_ACTIONS=rules.RELIC_STAGE_ACTIONS[3];
  for(const cfg of configs){
    const stage=rules.getRelicStage(cfg.id,known);
    if(reported.has(cfg.id) || stage<1 || stage>=4)continue;
    const allowed=(stage===1 ? cfg.validActions.filter(a=>a!=='破身'&&!STAGE2_ACTIONS.includes(a)&&!STAGE3_ACTIONS.includes(a))
      : stage===2 ? STAGE2_ACTIONS.concat(STAGE3_ACTIONS) : STAGE3_ACTIONS).filter(a=>cfg.validActions.includes(a)).sort((a,b)=>b.length-a.length);
    const names=cfg.ownerAliases.filter(n=>n!=='师姐').concat(cfg.names.filter(n=>n.length>3));
    const scoped=rules.relicEvidenceProse(cfg.id,visible);
    if(!names.some(n=>scoped.includes(n)))continue;
    const evidence=scoped.split(/[。！？\n]/).find(line=>
      (line.includes(identity)||line.includes('你')) &&
      allowed.some(a=>line.includes(a)) &&
      !C.noFact.test(line) && !/是否|想要|希望|不(?:会|愿|是)|未|没|讨论|提及|解释|说明|之前|上次|曾经|回忆|记得/.test(line) &&
      !configs.some(other=>other.owner!==cfg.owner && line.includes(other.owner)));
    if(!evidence)continue;
    const event=allowed.find(a=>evidence.includes(a));
    const action=rules.parseRelicAction(cfg.names[0]+'｜'+identity+'｜'+event);
    const validation=rules.validateRelicAction(action,scoped,known,identity);
    if(validation.ok)result.push({...action,...validation});
  }
  return result;
}
// Attribute a first-stage fact across adjacent sentences without trusting XML claims.
function findDeflowerEvidence(holder, prose, rules) {
 const group=rules.FORM_OF_HOLDERS.find(g=>g.holders.includes(holder));
 const cfg=Object.values(rules.RELIC_PILOT_CONFIG).find(c=>c.formKey===group?.form);
 const aliases=group?.holders.length===1 ? [...new Set([holder,...(cfg?.ownerAliases || []).filter(a=>a!=='师姐'),...(cfg?.names || [])])] : [holder];
 const others=rules.FORM_OF_HOLDERS.flatMap(g=>g.holders).filter(h=>h!==holder);
 const text=stripForEvidence(prose).replace(/<(?:破处|名器互动|实际发生|进度)>[\s\S]*?<\/(?:破处|名器互动|实际发生|进度)>/gi,'').replace(/[「“"][^」”"\n]*[」”"]/g,'');
 const completed=/(落红|破(?:了|去|过|掉)?(?:她|他|其)?的?身|破(?:了|去|过|掉)?(?:她|他|其)?的?处|破瓜|元阴(?:被夺|初破|失守)|失了身)/;
 for(const paragraph of text.split(/\n\s*\n/)){
  let context=false;
  for(const line of paragraph.split(/[。！？\n]/)){
   if(others.some(h=>line.includes(h))){context=false;continue;}
   const named=aliases.some(a=>line.includes(a));
   if(C.noFact.test(line) || /未|没|否认|并不|不是|并非|拒绝|是否|想要|希望|不会|不愿|讨论|提及|解释|说明|之前|上次|曾经|回忆|记得/.test(line)){if(named)context=false;continue;}
   if(named)context=true;
   if(context && completed.test(line))return line;
  }
 }
 return null;
}
module.exports={inferRelicActions,findDeflowerEvidence};
