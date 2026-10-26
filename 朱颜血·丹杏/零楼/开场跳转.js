/* gpt：确认身份后选择实际零楼候选；仅新聊天可提交，不生成/发送玩家消息。 */
(function(global){
 'use strict';
 const indices=Object.freeze({'锦衣缇骑':1,'黑狱恶差':2,'江湖任侠':3,'身世自设':4});
 function parseRecord(text){const marker='[玩家开局设定已载入]',at=String(text).indexOf(marker);if(at<0)return null;const start=text.indexOf('{',at+marker.length);let depth=0,quote=false,escape=false;
  for(let i=start;i>=0&&i<text.length;i++){const c=text[i];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quote=false;continue;}if(c==='"')quote=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0){try{const record=JSON.parse(text.slice(start,i+1));return indices[record['身位']]&&Number.isInteger(record['年龄'])&&record['年龄']>0?record:null;}catch{return null;}}}return null;
 }
 function safeJson(record){return JSON.stringify(record,null,2).replace(/[<>&`]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));}
 function prepare(config,record,context,zero){
  const index=indices[record?.['身位']];if(!index||!Array.isArray(config?.greetings)||config.greetings.length!==4)throw Error('没有对应身份的开场白');
  const substitute=text=>String(text).replace(/\{\{user\}\}/gi,()=>String(context.name1||record['姓名']||'玩家')).replace(/\{\{char\}\}/gi,()=>String(context.name2||'朱颜血·丹杏'));
  const swipes=Array.isArray(zero.swipes)?[...zero.swipes]:[String(zero.mes??'')];
  for(let i=swipes.length;i<5;i++)swipes[i]=substitute(i?config.greetings[i-1]:config.gateway);
  const committed={...record};
  if(config.identityRules?.[index-1])committed['身份规则']=substitute(config.identityRules[index-1]);
  const content=substitute(config.greetings[index-1])+'\n\n<details data-zyx-opening="committed"><summary>本次开局卷宗</summary>\n[玩家开局设定已载入]\n'+safeJson(committed)+'\n</details>';
  swipes[index]=content;
  const swipes_info=swipes.map((_,i)=>({...((zero.swipe_info??[])[i]??(i===(zero.swipe_id??0)?zero.extra:{}))}));
  swipes_info[index]={...swipes_info[index],zyx_opening:{version:1,record:structuredClone(committed)}};
  const swipes_data=swipes.map((_,i)=>structuredClone(Array.isArray(zero.variables)?zero.variables[i]??{}:{}));
  // 不混传message/data：真实Helper将它们分流到普通消息分支，届时swipe_id会被忽略。
  return {message_id:0,swipes,swipe_id:index,swipes_info,swipes_data};
 }
 function install(){
  const root=document.getElementById('zyx-zero-floor'),config=global.ZYX_OPENING_CONFIG,original=global.ZYX_ZERO_ACTION;if(!root||!config||typeof original!=='function'||root.dataset.openingBridge)return;
  root.dataset.openingBridge='true';let busy=false;
  function windows(){const all=[global];try{if(global.parent!==global)all.push(global.parent)}catch{}try{if(global.top!==global&&!all.includes(global.top))all.push(global.top)}catch{}return all;}
  function connection(){for(const w of windows()){try{const context=w.SillyTavern?.getContext?.();if(!context||!Array.isArray(context.chat))continue;for(const candidate of windows()){const api=typeof candidate.TavernHelper?.setChatMessages==='function'?candidate.TavernHelper:candidate;if(typeof api.setChatMessages==='function')return {context,window:w,api};}}catch{}}throw Error('未连接到酒馆开场切换接口，请启用酒馆助手后重试');}
  function chatId(context){return context.chatId||context.getCurrentChatId?.();}
  function fingerprint(zero){return JSON.stringify([zero.mes,zero.swipe_id,zero.swipes]);}
  function check(conn,pin){const current=conn.window.SillyTavern.getContext(),id=chatId(current);if(!id)throw Error('无法确认当前聊天，未修改开场');if(pin&&id!==pin.id)throw Error('已切换聊天，开场切换中断');
   if(current.chat.length!==1||current.chat[0]?.is_user||current.chat[0]?.is_system)throw Error('这段聊天已开始，不能覆盖已有剧情；请新建聊天选择身份');
   const zero=current.chat[0];if(!/<zyx_gateway>[^]*?<\/zyx_gateway>/.test(String(zero.mes??'')))throw Error('当前零楼已不是身份菜单，未覆盖已有开场');
   if(pin&&fingerprint(zero)!==pin.fingerprint)throw Error('零楼已发生变化，开场切换中断');
   const stop=conn.window.document?.querySelector('#mes_stop');if((typeof current.isGenerating==='function'?current.isGenerating():current.isGenerating)||stop&&conn.window.getComputedStyle(stop).display!=='none'&&!stop.hidden)throw Error('正在生成，请结束后再选择开场');
   return {context:current,zero,id};
  }
  function message(value){const status=root.querySelector('[data-step="record"]')?.hidden?root.querySelector('[data-form-status]'):root.querySelector('[data-output-status]');if(status)status.textContent=value;}
  function applied(conn,pin,patch){const now=conn.window.SillyTavern.getContext();return chatId(now)===pin.id&&now.chat[0]?.swipe_id===patch.swipe_id&&now.chat[0]?.mes===patch.swipes[patch.swipe_id]&&now.chat[0]?.swipes?.[patch.swipe_id]===patch.swipes[patch.swipe_id];}
  async function commit(conn,start){if(busy)return;busy=true;const buttons=[...root.querySelectorAll('button')];for(const b of buttons)b.disabled=true;
   const pin={id:start.id,fingerprint:fingerprint(start.zero)};let patch=null;
   try{
    const record=parseRecord(root.querySelector('[data-output]')?.value??'');if(!record)throw Error('开局卷宗未生成，请返回检查身份配置');
    message('正在切换到对应身份开场……');
    const current=check(conn,pin);patch=prepare(config,record,current.context,current.zero);
    await conn.api.setChatMessages([patch],{refresh:'affected'});
    if(!applied(conn,pin,patch))throw Error('未确认开场切换成功，请检查当前聊天，不自动重复提交');
    message('已进入对应身份开场。');
   }catch(error){
    let saved=false;try{saved=!!patch&&applied(conn,pin,patch);}catch{}
    message(saved?'开场已切换，但界面刷新未完成；请重载当前聊天，不要重复提交。':(error?.message||'开场切换未完成；未自动发送任何消息。'));
   }finally{busy=false;for(const b of buttons)b.disabled=false;}
  }
  // 页面首次安装即锁定所属聊天；不能等确认才把旧iframe绑定到新聊天。
  let pagePin=null;
  try{const initial=check(connection());pagePin={id:initial.id,fingerprint:fingerprint(initial.zero)};}catch{}
  global.ZYX_ZERO_ACTION=function(action,button){
   if(busy)return;
   if(action!=='confirm'&&action!=='fill')return original(action,button);
   let conn,start;try{if(!pagePin)throw Error('无法确认此身份页所属聊天，请重载当前聊天后选择');conn=connection();start=check(conn,pagePin);}catch(error){message(error.message);return;}
   if(action==='confirm'){
    if(root.querySelector('[data-step="configure"]')?.hidden)return;
    original(action,button);
    if(root.querySelector('[data-step="record"]')?.hidden)return;
   }
   void commit(conn,start);
  };
 }
 const api={parseRecord,safeJson,prepare,install};global.ZYXOpeningBridge=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(typeof document==='object')install();
})(typeof window==='object'?window:globalThis);
