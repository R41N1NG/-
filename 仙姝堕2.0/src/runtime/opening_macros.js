"use strict";
const C=require('./contracts');
// Resolve the two native name macros before recording an opening identity.
function expandOpening(text,user,char){
 return String(text).replace(/\{\{(user|char)\}\}/gi,(macro,key)=>String((key.toLowerCase()==='user'?user:char) || macro));
}
// Narrow migration for unplayed custom roots: macro equivalence or unchanged
// status/configuration under a presentation edit, never an inferred outcome.
function migrateOpening(e,c){
 const s=e?.state,old=e?.identityTrail?.[0],now=c.identities?.[0];
 if(e?.chatId!==c.chatId || e.branchId!==c.branchId || e.identityTrail?.length!==1 || s?.identity!=='自设' || s.storyCount!==0 || s.pending || s.activeEvent || Object.keys(s.processed||{}).length || Object.keys(s.receipts||{}).length || !old || !now || old.messageId!==now.messageId || old.user || now.user)return null;
 let tuple;try{tuple=JSON.parse(e.trail?.[0]);}catch{return null;}
 if(!tuple || Number(tuple[2])!==Number(c.chat[0]?.swipe_id??0) || !tuple[3] || /<IdentityMenu\b/.test(c.chat[0].mes))return null;
 const normalize=t=>String(t).replace(/\r\n/g,'\n').trim();
 const users=[c.raw?.name1,s.stat_data?.自设?.name].filter(Boolean),char=c.raw?.name2 || c.card?.name || c.card?.data?.name;
 const macroMatch=/\{\{(?:user|char)\}\}/i.test(tuple[3]) && users.some(user=>normalize(expandOpening(tuple[3],user,char))===normalize(c.chat[0].mes));
 // Legacy unplayed roots can recover presentation edits only when every
 // status field and the explicit identity remain unchanged. No played save,
 // compact journal, changed config or different candidate is guessed here.
 const before=C.parseStatus(tuple[3]).fields,after=C.parseStatus(c.chat[0].mes).fields;
 const sameFields=Object.keys(before).length>0 && JSON.stringify(Object.entries(before).sort())===JSON.stringify(Object.entries(after).sort());
 const marker=t=>String(t).match(/<IdentityPick\s+name=["']([^"']+)["']/)?.[1] || (String(t).includes('【身份】自设')?'自设':null);
 const settings=t=>normalize(String(t).split('你的入世设定：')[1] || '');
 if(!macroMatch && !(settings(tuple[3])===settings(c.chat[0].mes) && sameFields && marker(tuple[3])===s.identity && marker(c.chat[0].mes)===s.identity))return null;
 const migrated=C.clone(e);
 function replaceRefs(v){if(!v||typeof v!=='object')return;
  if(v.messageId===old.messageId && v.revisionId===old.revisionId){v.revisionId=now.revisionId;if('signature'in v)v.signature=now.signature;}
  for(const x of Object.values(v))replaceRefs(x);
 }
 replaceRefs(migrated.state);
 migrated.identityTrail=C.clone([now]);migrated.trail=c.trail.slice(0,1);
 migrated.state.openingMacroMigration={version:1,sourceRevisionId:old.revisionId,revisionId:now.revisionId};
 return migrated;
}
module.exports={expandOpening,migrateOpening};
