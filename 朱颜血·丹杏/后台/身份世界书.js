'use strict';
// gpt：按主人要求同步当前角色主世界书的四个身份原生开关；只碰四个明确条目。
const LABELS={'锦衣缇骑':'【身份】锦衣缇骑','黑狱恶差':'【身份】黑狱差役','江湖任侠':'【身份】江湖任侠','身世自设':'【身份】自设游侠'};
async function synchronize(api,identity,valid){
 const names=api.pick('getCharWorldbookNames'),get=api.pick('getWorldbook'),replace=api.pick('replaceWorldbook');
 if(!get||!replace)return {ok:false,reason:'缺少酒馆助手getWorldbook/replaceWorldbook，身份规则仍以聊天注入兜底'};
 let name=null;if(names){const binding=await names('current');if(!valid())return {ok:false,reason:'聊天已切换，取消同步'};name=binding?.primary||(typeof binding==='string'?binding:null);}
 const ctx=api.ctx,character=ctx?.characters?.[ctx.characterId??ctx.this_chid]||ctx?.character;
 name ||= character?.data?.extensions?.world||character?.extensions?.world;
 if(!name)return {ok:false,reason:'当前角色未绑定主世界书，请先导入并绑定角色卡内世界书'};
 const entries=await get(name);if(!valid())return {ok:false,reason:'聊天已切换，取消同步'};
 if(!Array.isArray(entries))return {ok:false,reason:'主世界书返回格式无效'};
 const label=e=>e.name||e.comment||'',managed=Object.values(LABELS);
 if(managed.some(s=>entries.filter(e=>label(e)===s).length!==1))return {ok:false,reason:'当前主世界书未包含唯一完整的四身份条目，未修改其他书'};
 const selected=LABELS[identity]||null;let changed=false;
 const updated=entries.map(e=>{if(!managed.includes(label(e)))return e;const on=label(e)===selected;const clean=String(e.content||'').replace(/^@@if [^\n]*\n/,'');
  const desired={...e,enabled:on,disable:!on,content:clean};if(e.strategy)desired.strategy={...e.strategy,type:'constant'};if('constant'in e)desired.constant=true;
  if(JSON.stringify(desired)!==JSON.stringify(e))changed=true;return desired;
 });
 if(changed){if(!valid())return {ok:false,reason:'聊天已切换，取消同步'};await replace(name,updated,{render:'immediate'});if(!valid())return {ok:false,reason:'写入期间聊天改变，等待新聊天重同步'};}
 // 写后读取真实条目，不能把调用成功当作已经开启。
 const saved=await get(name);if(!valid())return {ok:false,reason:'聊天已切换，取消核验'};
 const ok=Array.isArray(saved)&&managed.every(s=>{const row=saved.find(e=>label(e)===s);return !!row&&row.enabled===(s===selected)&&row.disable!==(s===selected);});
 return {ok,name,selected,changed,...(!ok?{reason:'身份世界书写后核验失败'}:{})};
}
module.exports={synchronize,LABELS};
