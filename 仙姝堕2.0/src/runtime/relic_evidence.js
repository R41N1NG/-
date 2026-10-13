"use strict";
const C = require('./contracts');
const {stripForEvidence} = require('./metric_events');
// Narrow fallback for a missing interaction report. It adds stage-2 progress,
// never a stage grant. Ambiguous participants and non-events remain uncounted.
function inferRelicActions(rules, prose, known, identity, reported = new Set()) {
  const visible=stripForEvidence(prose).replace(/[「“"][^」”"\n]*[」”"]/g,'');
  const sentences=visible.split(/[。！？\n]/);
  const configs=Object.values(rules.RELIC_PILOT_CONFIG);
  const result=[];
  for(const cfg of configs){
    if(reported.has(cfg.id) || rules.getRelicStage(cfg.id,known)!==1)continue;
    const names=[cfg.owner,...cfg.names.filter(n=>n.length>3)];
    const evidence=sentences.find(line=>
      names.some(n=>line.includes(n)) && (line.includes(identity)||line.includes('你')) &&
      /内射|精液灌注/.test(line) &&
      !C.noFact.test(line) && !/是否|想要|希望|不(?:会|愿|是)|未|没|讨论|提及|解释|说明|之前|上次|曾经|回忆|记得/.test(line) &&
      !configs.some(other=>other.owner!==cfg.owner && line.includes(other.owner)));
    if(!evidence)continue;
    const action=rules.parseRelicAction(cfg.names[0]+'｜'+identity+'｜内射');
    const validation=rules.validateRelicAction(action,evidence,known,identity);
    if(validation.ok)result.push({...action,...validation});
  }
  return result;
}
module.exports={inferRelicActions};
