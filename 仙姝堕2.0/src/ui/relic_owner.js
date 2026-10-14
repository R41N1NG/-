'use strict';
function relicOwner(stat,cfg,id,name){
 const ledger=stat.名器归属 || {};
 for(const key of [cfg?.id,id,name])if(key && Object.hasOwn(ledger,key)){
  const owner=typeof ledger[key]==='string'?ledger[key].trim():'';
  return /^(?:无|暂无|未知|未明|待定|未确认|未归属|归属未确认|—|-)$/.test(owner)?'':owner;
 }
 return '';
}
module.exports={relicOwner};
