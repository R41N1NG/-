'use strict';
// gpt：按当前聊天的已提交开局与节点路由资料，不修改所有聊天共用的世界书开关。
const {committedOpening}=require('../状态栏/玩家武学回放.js');
const ROLES=Object.freeze({'锦衣缇骑':'jinyiwei','黑狱恶差':'yuzu','江湖任侠':'xiake','身世自设':'custom'});
function route(chat,config={},context={}){
 const zero=chat?.[0],opening=zero&&!zero.is_user&&!zero.is_system?committedOpening(zero):null;
 if(!opening||!Object.hasOwn(ROLES,opening.identity))return {identity:'',identityId:'',identityProfile:'',playerOpening:null};
 const substitute=value=>String(value||'').replace(/\{\{user\}\}/gi,()=>String(context.name1||opening.name||'玩家')).replace(/\{\{char\}\}/gi,()=>String(context.name2||'朱颜血·丹杏'));
 let profile=config.identityProfiles?.[opening.identity]||'';const start=profile.indexOf('<identity>');if(start>=0)profile=profile.slice(start);
 const record=JSON.parse(JSON.stringify(zero.extra.zyx_opening.record));delete record['身份规则'];
 return {identity:opening.identity,identityId:ROLES[opening.identity],identityProfile:substitute(profile),playerOpening:record};
}
module.exports={route};
