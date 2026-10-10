/* 身份：gpt下级。真实Chromium菜单行为复核，不截图，不调用酒馆写接口。 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),UI=path.join(ROOT,'候选源码/src/state-machine/ui');
const source=fs.readFileSync(path.join(UI,'identity-menu-controller.js'),'utf8');
const adapter=fs.readFileSync(path.join(UI,'identity-menu.js'),'utf8');
const legacy=fs.readFileSync(path.join(__dirname,'fixtures/identity-menu.064d67b.js'),'utf8');
const timepoint=fs.readFileSync(path.join(__dirname,'fixtures/timepoint-slider.064d67b.js'),'utf8');
const names=['xdsMenuHost','xdsMenuContext','xdsMenuChatKey','xdsMenuSetValue','xdsMenuVisible','xdsMenuComposer','xdsMenuCanSend','xdsMenuIntro','xdsMenuStatus','xdsMenuAssets','xdsMenuImageUrl','xdsMenuHydrate','xdsMenuSent','xdsMenuSubmit','bindIdentityMenu','ensureMenuBound'];
const html=`<textarea id="send_textarea"></textarea><button id="send_but">send</button><button id="mes_stop" hidden>stop</button>
<div class="mes_text"><section data-xds-menu><input id="p1" name="pages" type="radio" data-xds-page><label for="p1" role="button" tabindex="0">page</label>
<div data-xds-custom-form><input data-xds-field="custom_name"><input data-xds-field="custom_gender"><input data-xds-field="custom_age"><input data-xds-field="custom_cultivation"><input data-xds-field="custom_sect">
<div data-xds-timepoint-box><input type="text" data-xds-field="custom_timepoint" value="仙盟历 1579 年 · 六月初七">
<div data-xds-timepoint-fallback><button data-xds-fill="custom_timepoint" data-xds-value="仙盟历 1578 年 · 三月初三">preset</button></div>
<div data-xds-timepoint-enhancer hidden><input type="range" min="0" max="7" step="1" data-xds-timepoint-range><output data-xds-timepoint-out></output><div data-xds-timepoint-summary></div><button data-xds-timepoint-apply>apply</button></div></div>
<textarea data-xds-field="custom_origin"></textarea><button data-xds-fill="custom_cultivation" data-xds-value="筑基">chip</button><button data-xds-identity="自设">identity</button><button data-xds-action="submit-custom">submit</button><span data-xds-status></span></div></section></div>`;
let browser;
before(async()=>{browser=await chromium.launch({executablePath:process.env.XSD_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});});
after(async()=>{await browser?.close();});
async function pageFor({mode='new',bind=true,...options}={}){
 const page=await browser.newPage();await page.setContent(html);
 await page.evaluate(({source,adapter,legacy,timepoint,names,options,mode,bind})=>{
  window.__calls={pick:[],send:0,eventOn:0,eventStop:0,correction:0,adds:0,removes:0,warns:[]};
  const calls=window.__calls,ctx=window.__ctx={chatId:'chat-A',characterId:1,groupId:null,chat:[],name1:'玩家',onlineStatus:'connected',characters:[]};
  window.SillyTavern={getContext:()=>ctx};
  const originalAdd=EventTarget.prototype.addEventListener,originalRemove=EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener=function(...args){calls.adds++;return originalAdd.apply(this,args);};
  EventTarget.prototype.removeEventListener=function(...args){calls.removes++;return originalRemove.apply(this,args);};
  window.__xsdCorrection={onChatChanged(){calls.correction++;}};
  window.__layers={chat:{stat_data:{身份:'赵无忧'}},message:{stat_data:{身份:'赵无忧'}}};
  window.__pickGate=null;window.__chatCallback=null;
  const deps={window,API:{getContext:()=>ctx,eventOn(type,fn){calls.eventOn++;window.__chatCallback=fn;return {stop(){calls.eventStop++;}};}},EVENTS:{CHAT_CHANGED:'changed'},IDENTITY_NAMES:['赵无忧','自设'],toast(){},msgOf:e=>String(e.message||e),latestMessageId:()=>ctx.chat.length-1,L_CHAT:'chat',L_MSG:'message',TAG:'test',
   console:{log(){},warn(...args){calls.warns.push(args.map(String));}},setTimeout:(fn,ms)=>window.setTimeout(fn,Math.min(ms,1)),setInterval:window.setInterval.bind(window),clearInterval:window.clearInterval.bind(window),
   readLayer:key=>options.noLayers?null:window.__layers[key],
   async pickIdentity(name,args){calls.pick.push({name,args:args&&{switchGreeting:args.switchGreeting,quiet:args.quiet,strict:args.strict}});if(options.deferPick)await new Promise(resolve=>window.__pickGate=resolve);if(options.failPick)throw Error('pick failed');if(options.chatDuringPick)ctx.chatId='chat-B';if(!options.noReadback){window.__layers.chat.stat_data.身份=name;if(!options.conflictReadback)window.__layers.message.stat_data.身份=name;}}
  };
  const moduleFn=new Function(timepoint+'\nreturn xdsTimepointModule;')();
  deps.timepointModule=options.failTimepoint?()=>({...moduleFn(),install(){throw Error('enhancement failed');}}):moduleFn;
  window.__deps=deps;
  document.querySelector('#send_but').addEventListener('click',()=>{calls.send++;if(!options.noConfirmation){ctx.chat.push({is_user:true,mes:document.querySelector('#send_textarea').value});document.querySelector('#send_textarea').value='';}});
  const before=calls.adds;
  if(mode==='new')window.__menu=new Function(source+'\nreturn createXsdIdentityMenu;')()(deps);
  else window.__menu=new Function('deps',`const {window,API,EVENTS,IDENTITY_NAMES,toast,msgOf,latestMessageId,pickIdentity,readLayer,L_CHAT,L_MSG,TAG,console,setTimeout,setInterval,clearInterval}=deps;const xdsTimepointModule=deps.timepointModule;\n${mode==='adapter'?source+'\n'+adapter:legacy}\nreturn {${names.join(',')}};`)(deps);
  window.__creationAdds=calls.adds-before;
  if(bind)window.__menu.bindIdentityMenu();
  window.__submit=()=>window.__menu.xdsMenuSubmit(document.querySelector('[data-xds-custom-form]'),document.querySelector('[data-xds-action="submit-custom"]'),document.__xsdMenuRuntime);
 },{source,adapter,legacy,timepoint,names,options,mode,bind});
 return page;
}
async function run(options,fn){const p=await pageFor(options);try{return await fn(p);}finally{await p.close();}}
test('菜单控制逻辑整体原样搬迁，仅依赖名接线；refreshGreetings字节保持',()=>{
 const marker='/**\n * 把第 0 楼';const a=legacy.slice(0,legacy.indexOf(marker)).trim();
 const b=source.slice(source.indexOf('function xdsMenuHost()'),source.indexOf('  return Object.freeze({')).trim().replace("typeof timepointModule === 'function'","typeof xdsTimepointModule === 'function'").replace('? timepointModule() : null','? xdsTimepointModule() : null');
 assert.equal(b,a);assert.equal(adapter.slice(adapter.indexOf(marker)),legacy.slice(legacy.indexOf(marker)));
 for(const name of names)assert(adapter.includes(`function ${name}(`)&&adapter.includes(`xsdIdentityMenuController.${name}(...arguments)`),name);
});
test('创建工厂不绑定监听；重复bind复用同runtime和监听',()=>run({bind:false},async p=>{
 assert.equal(await p.evaluate(()=>window.__creationAdds),0);
 const result=await p.evaluate(()=>{window.__menu.bindIdentityMenu();const r=document.__xsdMenuRuntime,a=window.__calls.adds;window.__menu.bindIdentityMenu();return {same:r===document.__xsdMenuRuntime,adds:window.__calls.adds-a,events:window.__calls.eventOn,frozen:Object.isFrozen(window.__menu)};});
 assert.deepEqual(result,{same:true,adds:0,events:1,frozen:true});
}));
test('绑定新实例清理旧runtime及聊天事件；pagehide清理且幂等',()=>run({},async p=>{
 const out=await p.evaluate(source=>{const old=document.__xsdMenuRuntime;const next=new Function(source+'\nreturn createXsdIdentityMenu;')()(window.__deps);next.bindIdentityMenu();const replacement=document.__xsdMenuRuntime;window.dispatchEvent(new Event('pagehide'));replacement.dispose();return {oldDisposed:old.disposed,newDisposed:replacement.disposed,bound:document.__xsdMenuBound,missing:!document.__xsdMenuRuntime,stops:window.__calls.eventStop};},source);
 assert.deepEqual(out,{oldDisposed:true,newDisposed:true,bound:false,missing:true,stops:2});
}));
test('chip原生填值冒泡input与aria-pressed更新，手动修改取消选中',()=>run({},async p=>{
 await p.locator('[data-xds-fill="custom_cultivation"]').click();assert.equal(await p.locator('[data-xds-field="custom_cultivation"]').inputValue(),'筑基');assert.equal(await p.locator('[data-xds-fill="custom_cultivation"]').getAttribute('aria-pressed'),'true');
 await p.locator('[data-xds-field="custom_cultivation"]').fill('金丹');assert.equal(await p.locator('[data-xds-fill="custom_cultivation"]').getAttribute('aria-pressed'),'false');
}));
test('开菜单不吸附六月初七；自设提交回读两层后只发送一次且日期保持',()=>run({},async p=>{
 assert.equal(await p.locator('[data-xds-field="custom_timepoint"]').inputValue(),'仙盟历 1579 年 · 六月初七');
 await p.evaluate(()=>window.__submit());await p.evaluate(()=>window.__submit());
 const o=await p.evaluate(()=>({send:window.__calls.send,pick:window.__calls.pick,msg:window.__ctx.chat[0].mes,disabled:document.querySelector('[data-xds-action]').disabled}));
 assert.equal(o.send,1);assert.equal(o.pick.length,1);assert.deepEqual(o.pick[0],{name:'自设',args:{switchGreeting:false,quiet:true,strict:true}});assert(o.msg.includes('• 当前时点：仙盟历 1579 年 · 六月初七'));assert.equal(o.disabled,true);
}));
test('并发双击共用submitting guard，异步身份切换只执行一次',()=>run({deferPick:true},async p=>{
 await p.evaluate(()=>{window.__first=window.__submit();});await p.waitForFunction(()=>window.__pickGate);await p.evaluate(()=>window.__submit());assert.equal(await p.evaluate(()=>window.__calls.pick.length),1);await p.evaluate(async()=>{window.__pickGate();await window.__first;});assert.equal(await p.evaluate(()=>window.__calls.send),1);
}));
test('未连接/正在生成/旧草稿/字段超长/非法日期阻止身份与发送',()=>run({},async p=>{
 const cases=await p.evaluate(async()=>{const result=[];const textarea=document.querySelector('#send_textarea'),time=document.querySelector('[data-xds-field="custom_timepoint"]'),name=document.querySelector('[data-xds-field="custom_name"]');
 for(const type of ['offline','generating','draft','limit','date']){window.__ctx.onlineStatus=type==='offline'?'no_connection':'connected';document.querySelector('#mes_stop').hidden=type!=='generating';textarea.value=type==='draft'?'我的草稿':'';name.value=type==='limit'?'a'.repeat(65):'';time.value=type==='date'?'无效日期':'仙盟历 1579 年 · 六月初七';await window.__submit();result.push({type,pick:window.__calls.pick.length,send:window.__calls.send,error:document.querySelector('[data-xds-status]').hasAttribute('data-xds-error')});}return result;});
 for(const c of cases){assert.equal(c.pick,0,c.type);assert.equal(c.send,0,c.type);assert.equal(c.error,true,c.type);}
}));
test('身份写入失败/无可读层/两层不一致不发送，保留错误反馈',async()=>{
 for(const opts of [{failPick:true},{noLayers:true},{noReadback:true},{conflictReadback:true}])await run(opts,async p=>{await p.evaluate(()=>window.__submit());assert.equal(await p.evaluate(()=>window.__calls.send),0);assert.equal(await p.locator('[data-xds-action]').isEnabled(),true);assert.equal(await p.locator('[data-xds-status]').getAttribute('data-xds-error'),'');});
});
test('根所属聊天和异步跨聊天guard阻止旧会话提交与发送',async()=>{
 await run({},async p=>{await p.evaluate(()=>window.__ctx.chatId='chat-B');await p.evaluate(()=>window.__submit());assert.equal(await p.evaluate(()=>window.__calls.pick.length),0);assert.equal(await p.evaluate(()=>window.__calls.send),0);});
 await run({chatDuringPick:true},async p=>{await p.evaluate(()=>window.__submit());assert.equal(await p.evaluate(()=>window.__calls.send),0);assert.match(await p.locator('[data-xds-status]').textContent(),/聊天已切换/);});
 await run({deferPick:true},async p=>{await p.evaluate(()=>{window.__pending=window.__submit();});await p.waitForFunction(()=>window.__pickGate);await p.evaluate(async()=>{window.__chatCallback();window.__pickGate();await window.__pending;});assert.equal(await p.evaluate(()=>window.__calls.send),0);assert.equal(await p.evaluate(()=>window.__calls.correction),1);});
});
test('发送触发后无确认可检查但不重复pick或send',()=>run({noConfirmation:true},async p=>{
 await p.evaluate(()=>window.__submit());await p.evaluate(()=>window.__submit());assert.equal(await p.evaluate(()=>window.__calls.send),1);assert.equal(await p.evaluate(()=>window.__calls.pick.length),1);assert.match(await p.locator('[data-xds-status]').textContent(),/避免重复发送/);
}));
test('提交期间编辑草稿保留原文，不覆盖或自动发送',()=>run({deferPick:true},async p=>{
 await p.evaluate(()=>{window.__pending=window.__submit();});await p.waitForFunction(()=>window.__pickGate);await p.locator('#send_textarea').fill('临时修改');await p.evaluate(async()=>{window.__pickGate();await window.__pending;});assert.equal(await p.locator('#send_textarea').inputValue(),'临时修改');assert.equal(await p.evaluate(()=>window.__calls.send),0);
}));
test('键盘Enter和Space激活label原生radio；复制菜单重新映射id/name',()=>run({},async p=>{
 await p.locator('label').press('Enter');assert.equal(await p.locator('input[data-xds-page]').isChecked(),true);await p.evaluate(()=>document.querySelector('input[data-xds-page]').checked=false);await p.locator('label').press('Space');assert.equal(await p.locator('input[data-xds-page]').isChecked(),true);
 const out=await p.evaluate(()=>{const root=document.querySelector('[data-xds-menu]'),copy=root.cloneNode(true);root.after(copy);document.__xsdMenuRuntime.scan(copy);return [...document.querySelectorAll('[data-xds-menu]')].map(r=>{const input=r.querySelector('[data-xds-page]');return {id:input.id,name:input.name,label:r.querySelector('label').htmlFor};});});assert.notEqual(out[0].id,out[1].id);assert.notEqual(out[0].name,out[1].name);for(const r of out)assert.equal(r.id,r.label);
}));
test('同源iframe attach委托chip，动态重渲染只绑定一次，dispose移除委托',()=>run({},async p=>{
 await p.evaluate(html=>{const f=document.createElement('iframe');f.setAttribute('data-xds-menu-frame','');f.srcdoc=html;document.querySelector('.mes_text').append(f);},html);await p.waitForFunction(()=>document.querySelector('iframe')?.contentDocument?.querySelector('[data-xds-menu]'),null,{timeout:5000});await p.waitForFunction(()=>document.__xsdMenuRuntime.docs.has(document.querySelector('iframe').contentDocument),null,{timeout:5000});
 const f=p.frameLocator('iframe');await f.locator('[data-xds-fill="custom_cultivation"]').click();assert.equal(await f.locator('[data-xds-field="custom_cultivation"]').inputValue(),'筑基');
 const before=await p.evaluate(()=>document.__xsdMenuRuntime.docs.size);assert(before>=2);await p.evaluate(()=>document.__xsdMenuRuntime.scan(document));assert.equal(await p.evaluate(()=>document.__xsdMenuRuntime.docs.size),before);await p.evaluate(()=>document.__xsdMenuRuntime.dispose());await f.locator('[data-xds-field="custom_cultivation"]').fill('金丹');await f.locator('[data-xds-fill="custom_cultivation"]').click();assert.equal(await f.locator('[data-xds-field="custom_cultivation"]').inputValue(),'金丹');
}));
test('滑块拖动采用明确预设；增强失败原chip入口仍可用',async()=>{
 await run({},async p=>{await p.locator('[data-xds-timepoint-range]').fill('4');await p.locator('[data-xds-timepoint-range]').dispatchEvent('input');assert.match(await p.locator('[data-xds-field="custom_timepoint"]').inputValue(),/1579 年 · 一月初一/);});
 await run({failTimepoint:true},async p=>{await p.locator('[data-xds-fill="custom_timepoint"]').click();assert.equal(await p.locator('[data-xds-field="custom_timepoint"]').inputValue(),'仙盟历 1578 年 · 三月初三');assert.equal(await p.evaluate(()=>window.__calls.warns.length),1);});
});
test('核心submit成功与guard拒绝路径和固定旧控制器实跑结果一致',async()=>{
 for(const options of [{},{conflictReadback:true},{chatDuringPick:true},{noConfirmation:true}]){
  const collect=p=>p.evaluate(async()=>{await window.__submit();await window.__submit();return {pick:window.__calls.pick,send:window.__calls.send,chat:window.__ctx.chat,status:document.querySelector('[data-xds-status]').textContent,button:document.querySelector('[data-xds-action]').textContent,disabled:document.querySelector('[data-xds-action]').disabled,draft:document.querySelector('#send_textarea').value};});
  const old=await run({...options,mode:'old'},collect),next=await run(options,collect);assert.deepEqual(next,old);
 }
});
test('实际adapter的16旧名接线可绑定、填值、保留六月初七并正常发送',()=>run({mode:'adapter'},async p=>{
 assert.equal(await p.evaluate(()=>window.__creationAdds),0);await p.locator('[data-xds-fill="custom_cultivation"]').click();assert.equal(await p.locator('[data-xds-field="custom_cultivation"]').inputValue(),'筑基');await p.evaluate(()=>window.__submit());assert.equal(await p.evaluate(()=>window.__calls.send),1);assert.match(await p.evaluate(()=>window.__ctx.chat[0].mes),/当前时点：仙盟历 1579 年 · 六月初七/);
}));
