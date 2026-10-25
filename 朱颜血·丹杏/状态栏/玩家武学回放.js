/* gpt：只读原生聊天中当前候选的明确记录；不写变量，不用growth推断掌握或升境。 */
(function(global){
 'use strict';
 const realms=['末流','凡骨','淬体','冲脉','通明','入微','绝顶','宗师','半步天人','天人'];
 const none=value=>!value||/^(无|暂无|未明|未知|未记录|未登记|不详)$/.test(String(value).trim());
 function decode(value){return String(value??'').replace(/&(amp|lt|gt|quot|apos|nbsp);|&#(x[0-9a-f]+|[0-9]+);/gi,(all,name,n)=>{if(name)return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:'\u00a0'}[name.toLowerCase()];const v=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return v>0&&v<=0x10ffff?String.fromCodePoint(v):all;}).trim();}
 function realm(value){const text=decode(value);return realms.some(r=>text===r||text===r+'巅峰'||text===r+'·巅峰')?text:null;}
 function skills(value){if(Array.isArray(value))return [...new Set(value.slice(0,64).filter(v=>typeof v==='string').flatMap(skills))];const text=decode(value);if(none(text))return [];if(text.startsWith('[')){try{const parsed=JSON.parse(text);return Array.isArray(parsed)?skills(parsed):[];}catch{return [];}}
  return [...new Set(text.split(/[、,，;；\n]+/).map(v=>v.trim()).filter(v=>v&&!none(v)&&v.length<=80&&!/[<>\x00-\x1f]/.test(v)))].slice(0,64);
 }
 function parseOpening(text){const marker='[玩家开局设定已载入]',at=String(text).indexOf(marker);if(at<0)return null;const start=text.indexOf('{',at+marker.length);if(start<0)return null;let depth=0,quote=false,escape=false;
  for(let i=start;i<text.length;i++){const c=text[i];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quote=false;continue;}if(c==='"')quote=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0){try{const record=JSON.parse(text.slice(start,i+1));if(!record||typeof record!=='object'||Array.isArray(record))return null;return {name:String(record['姓名']??''),identity:String(record['身位']??''),realm:realm(record['武功境界']),skills:skills(record['掌握武学']??record['已掌握武学']),hasSkillRecord:!none(record['掌握武学']??record['已掌握武学'])};}catch{return null;}}}return null;
 }
 function readReport(text){const clean=String(text??'').replace(/<(think|analysis)>[^]*?<\/\1>/gi,'').replace(/<details\b[^>]*>[^]*?<\/details>/gi,'');const blocks=[...clean.matchAll(/<status_bar>((?:(?!<status_bar>)[^])*?)<\/status_bar>/g)];if(blocks.length!==1||!clean.slice(blocks[0].index+blocks[0][0].length).trim().match(/^(?:---)?$/))return null;
  const content=blocks[0][1],get=tag=>{const hits=[...content.matchAll(new RegExp('<'+tag+'>([^<]*)</'+tag+'>','g'))];return hits.length===1?decode(hits[0][1]):'';};
  return {realm:realm(get('player_realm')),skills:skills(get('player_skills')),hasSkillRecord:!none(get('player_skills')),growth:{skill:get('growth_skill'),reason:get('growth_reason'),weight:get('growth_weight')}};
 }
 function skillKey(value){return String(value).replace(/[《》「」]/g,'').replace(/[·・（(\s]+(?:初学|小成|大成|巅峰|圆满)[)）]?$/,'').trim();}
 function mergeSkill(state,skill,source){const key=skillKey(skill),old=state.skills.findIndex(v=>skillKey(v)===key);if(old<0){state.skills.push(skill);state.skillSources[skill]=source;}else if(skill!==state.skills[old]&&/[·・（(\s]+(?:初学|小成|大成|巅峰|圆满)[)）]?$/.test(skill.replace(/[《》「」]/g,''))){delete state.skillSources[state.skills[old]];state.skills[old]=skill;state.skillSources[skill]=source;}}
 function initial(){return {realm:null,skills:[],identity:'',playerName:'',openingFloor:null,realmSource:null,skillSources:Object.create(null),growth:[],reportFloor:null};}
 function apply(state,report,floor){if(!report)return;if(report.realm){state.realm=report.realm;state.realmSource={type:'report',floor};}for(const skill of report.skills)mergeSkill(state,skill,{type:'report',floor});
  if(report.growth&&!none(report.growth.skill))state.growth.push({...report.growth,floor});state.reportFloor=floor;
 }
 function fromChat(chat,{cutoff}={}){if(!Array.isArray(chat)||!Number.isInteger(cutoff)||cutoff<0||cutoff>=chat.length)throw new Error('武学回放必须给出当前楼层边界');let state=initial();
  for(let i=0;i<=cutoff;i++){const message=chat[i];if(!message||message.is_system)continue;const body=String(message.mes??message.message??'');if(message.is_user){const opening=parseOpening(body);if(opening){state=initial();Object.assign(state,{realm:opening.realm,skills:[],identity:opening.identity,playerName:opening.name,openingFloor:i,realmSource:opening.realm?{type:'opening',floor:i}:null});for(const skill of opening.skills)mergeSkill(state,skill,{type:'opening',floor:i});}}else apply(state,readReport(body),i);}
  state.growth=state.growth.slice(-30);return state;
 }
 function fromSnapshot(snapshot){const state=initial();apply(state,{realm:realm(snapshot.realm),skills:skills(snapshot.skills),growth:snapshot.growth},null);return state;}
 global.ZYXMartialLedger={realms,decodeText:decode,normalizeRealm:realm,parseSkills:skills,parseOpening,readReport,fromChat,fromSnapshot};
 if(typeof module==='object'&&module.exports)module.exports=global.ZYXMartialLedger;
})(typeof window==='object'?window:globalThis);
