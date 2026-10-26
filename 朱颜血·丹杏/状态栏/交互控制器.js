/* gpt：只读HUD桥。每个iframe绑定本楼，地图/监牢/历时不发消息、不写游戏状态。 */
(() => {
 'use strict';
 const root=document.querySelector('.zyx-hud');if(!root||root.dataset.interactive)return;
 const ledger=window.ZYXMartialLedger,records=window.ZYXStatusRecords,config=window.ZYX_HUD_CONFIG??{};
 const get=selector=>root.querySelector(selector),text=selector=>get(selector)?.textContent.trim()??'';
 const mapDialog=get('[data-map-dialog]'),portraitDialog=get('[data-portrait-dialog]'),prisonDialog=get('[data-prison-dialog]'),elapsedDialog=get('[data-elapsed-dialog]');
 const triggers=new Map();
 let disposed=false,mapInstance=null,portraitRequest=0,prisonRequest=0,currentPortrait='',prisonPortrait='',selectedPrisoner=null;
 const snapshot={realm:text('[data-reported-realm]'),skills:text('[data-reported-skills]'),growth:{skill:text('[data-growth-skill]'),reason:text('[data-growth-reason]'),weight:text('[data-growth-weight]')}};
 const statusSnapshot=()=>({time:text('[data-snapshot-time]'),elapsed:text('[data-reported-elapsed]'),location:text('[data-current-location]'),bailian_state:text('[data-reported-bailian]'),shuangling_state:text('[data-reported-shuangling]'),roster_event:text('[data-reported-roster]'),...Object.fromEntries(['danniang','yuniang','baiyulian','xieyunsu','junzhu','qingluo'].map(key=>[key+'_state',text('[data-reported-'+key+']')]))});
 const windows=window.ZYXHostBridge.windows,host=window.ZYXHostBridge.host;
 const bridge=window.ZYXHostBridge.create({snapshot:{time:text('[data-snapshot-time]'),location:text('[data-current-location]'),favor_char:text('[data-focal-name]')}});
 const runtime=window.ZYXCore.create({bridge,snapshot:{martial:snapshot,status:statusSnapshot()},modules:{
  martial:{derive:ctx=>ctx.source==='history'?ledger.fromChat(ctx.chat,{cutoff:ctx.cutoff}):ledger.fromSnapshot(ctx.snapshot.martial)},
  status:{derive:ctx=>{const current=records.fromSnapshot(ctx.snapshot.status),value=ctx.source==='history'?records.fromChat(ctx.chat,{cutoff:ctx.cutoff}):current;if(!ctx.live){value.time=current.time;value.elapsed=current.elapsed;}
   const backend=ctx.source==='history'?window.ZYXBackendProjection.read(ctx.chat,ctx.cutoff,ctx.chatId):null;
   value.backend=backend;
   if(backend){value.allPrisoners=backend.custody;value.prisoners=backend.custody.filter(item=>item.inCustody===true);value.time=backend.time.formatted;}
   return value;}}
 }});
 let archive=ledger.fromSnapshot(snapshot),state=records.fromSnapshot(statusSnapshot()),binding=null;
 function refresh(){return runtime.refresh();}
 function renderState(result){archive=result.view.martial;state=result.view.status;binding=result.scope.chatId&&!result.scope.stale?result.scope:null;
  get('[data-player-caption]').textContent=archive.playerName?archive.playerName+' · 武学档案':'主角武学档案';
  for(const node of root.querySelectorAll('[data-player-realm]'))node.textContent=archive.realm??'未登记';
  const list=get('[data-player-skills]');list.replaceChildren();
  for(const skill of archive.skills){const item=document.createElement('li');item.textContent=skill;list.append(item);}
  if(!archive.skills.length){const item=document.createElement('li');item.textContent='尚未登记已掌握武学';item.className='zyx-hud-skill-empty';list.append(item);}
  get('[data-martial-source]').textContent=binding?'按本次开局与截至本楼的明确回报记录。':'仅显示本楼回报；开局档案暂未关联。';
  get('[data-elapsed-summary]').textContent=state.elapsed;
  const backend=state.backend,notice=get('[data-backend-notice]');
  notice.textContent=backend?'后台已同步 · 八人羁押 / 时间 / 信物情报'+(backend.pending.length?' · 有待核事项':''):'后台未同步：当前显示模型回报，尚未确认结算。请启用角色卡后台脚本。';
  if(backend){get('.zyx-hud-time .zyx-hud-value').textContent=backend.time.formatted;get('.zyx-hud-trend strong').textContent='第'+backend.time.act+'幕 · '+backend.time.phase;get('.zyx-hud-trend p').textContent=backend.trend?.summary||'当前大势已接入';}
  get('[data-intel-summary]').textContent=backend?'信物情报 '+backend.intel.value+' 件 · 本幕 '+backend.intel.actCount+'/'+backend.intel.actTotal:'信物情报 · 待后台同步';
  const intel=get('[data-intel-list]');intel.replaceChildren();
  for(const label of backend?.intel.names||[]){const item=document.createElement('li');item.textContent=label;intel.append(item);}
  const nodes=get('[data-node-list]');nodes.replaceChildren();
  for(const node of backend?.nodes||[]){const item=document.createElement('li');item.textContent=node.scene+' · '+node.name+' · '+({available:'可查阅',locked:'条件未满足',unconfirmed:'条件待确认',expired:'已过期'}[node.status]||node.status)+' · '+node.reason;nodes.append(item);}
  const pending=get('[data-backend-pending]');pending.replaceChildren();for(const issue of backend?.pending||[]){const item=document.createElement('li');item.textContent='#'+issue.floor+' · '+issue.message;pending.append(item);}

  if(prisonDialog.open){if(selectedPrisoner&&!state.prisoners.some(item=>item.key===selectedPrisoner))prisonList();else if(!selectedPrisoner)prisonList();else{const current=state.prisoners.find(item=>item.key===selectedPrisoner);get('[data-prison-current-state]').textContent=current.state+(current.floor===null?'':'（最近明报 #'+current.floor+'）');}}
 }
 function close(dialog){dialog?.close();}
 function open(dialog,source){if(!dialog)return;triggers.set(dialog,source);if(!dialog.open)dialog.showModal();}
 function backdrop(event){const d=event.currentTarget;if(event.target!==d)return;const r=d.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close(d);}
 for(const dialog of [mapDialog,portraitDialog,prisonDialog,elapsedDialog]){dialog.addEventListener('click',backdrop);dialog.addEventListener('close',()=>{triggers.get(dialog)?.focus?.({preventScroll:true});triggers.delete(dialog);});}
 get('[data-open-map]').addEventListener('click',event=>{refresh();mapInstance?.dispose?.();mapInstance=window.ZYXMapPanel.mount(mapDialog,{location:text('[data-current-location]'),identity:archive.identity});open(mapDialog,event.currentTarget);});
 get('.zyx-hud-growth').addEventListener('toggle',()=>{if(get('.zyx-hud-growth').open)refresh();});
 get('[data-open-elapsed]').addEventListener('click',event=>{
  refresh();get('[data-elapsed-current]').textContent=state.elapsed;get('[data-elapsed-time]').textContent=state.time;
  get('[data-elapsed-source]').textContent=binding?'本轮相对耗时与近期时间记录；缺报项以“待回报”标示。':'仅本楼记录，历史暂不可用。';
  const list=get('[data-elapsed-history]');list.replaceChildren();
  for(const entry of state.history){const item=document.createElement('li');item.textContent=(entry.floor===null?'本楼':'#'+entry.floor)+' · '+entry.time+' · 耗时 '+entry.elapsed+' · '+entry.location;list.append(item);}
  if(!state.history.length){const item=document.createElement('li');item.textContent='本次开局尚无时间回报。';list.append(item);}
  open(elapsedDialog,event.currentTarget);
 });
 get('[data-close-elapsed]').addEventListener('click',()=>close(elapsedDialog));
 function origin(){const h=host();if(h){try{return h.window.location.href;}catch{}}try{return window.parent.location.href;}catch{return window.location.href;}}
 function portraitConfig(){let found=config.portraits??{};for(const w of windows()){try{if(w.ZYX_DANXING_PORTRAITS&&typeof w.ZYX_DANXING_PORTRAITS==='object'){found=w.ZYX_DANXING_PORTRAITS;break;}}catch{}}return found;}
 function imageUrls(name){return window.ZYXPortraitLibrary.resolve(name,portraitConfig(),origin()).urls;}
 function showImage(title,url,source){const image=get('[data-portrait-large]'),message=get('[data-portrait-message]');get('[data-portrait-title]').textContent=title;image.hidden=!url;message.hidden=!!url;
  if(url){image.src=url;image.alt=title;}else{image.removeAttribute('src');message.textContent='立绘图包尚未接入。';}open(portraitDialog,source);
 }
 function loadPortrait(){const revision=++portraitRequest,name=text('[data-focal-name]'),img=get('[data-portrait-image]'),placeholder=get('[data-portrait-placeholder]'),button=get('[data-open-portrait]');
  img.hidden=true;img.removeAttribute('src');currentPortrait='';button.classList.remove('has-portrait');placeholder.hidden=false;placeholder.textContent=name&&name!=='无'?name+'\n暂无立绘':'独处 · 暂无他人';
  button.setAttribute('aria-label',name&&name!=='无'?'查看'+name+'立绘':'当前无在场人物立绘');
  if(!name||/^(无|暂无|独处)$/.test(name))return;
  const urls=imageUrls(name);let position=0;
  function attempt(){if(disposed||revision!==portraitRequest||position>=urls.length)return;const url=urls[position++],candidate=new Image();candidate.onload=()=>{if(disposed||revision!==portraitRequest)return;currentPortrait=url;img.src=url;img.alt=name;img.hidden=false;placeholder.hidden=true;button.classList.add('has-portrait');};candidate.onerror=attempt;candidate.src=url;}
  attempt();
 }
 get('[data-open-portrait]').addEventListener('click',event=>showImage((text('[data-focal-name]')||'人物')+' · 立绘',currentPortrait,event.currentTarget));
 get('[data-close-portrait]').addEventListener('click',()=>close(portraitDialog));
 function prisonList(){selectedPrisoner=null;prisonRequest++;prisonPortrait='';get('[data-prison-detail]').hidden=true;const list=get('[data-prison-list]');list.hidden=false;list.replaceChildren();
  if(!state.prisoners.length){const empty=document.createElement('p');empty.className='zyx-hud-note';empty.textContent='当前没有明确在押的角色。';list.append(empty);}
  for(const prisoner of state.prisoners){const button=document.createElement('button');button.type='button';button.dataset.prisoner=prisoner.key;const name=document.createElement('strong'),status=document.createElement('span');name.textContent=prisoner.name+(prisoner.aliases?.length?' · '+prisoner.aliases[0]:'');status.textContent=prisoner.state;button.append(name,status);button.addEventListener('click',()=>prisonDetail(prisoner.key));list.append(button);}
 }
 function prisonDetail(key){const prisoner=state.prisoners.find(item=>item.key===key);if(!prisoner)return;selectedPrisoner=key;
  get('[data-prison-list]').hidden=true;get('[data-prison-detail]').hidden=false;get('[data-prison-name]').textContent=prisoner.name;
  get('[data-prison-current-state]').textContent=prisoner.state+(prisoner.floor===null?'':'（最近明报 #'+prisoner.floor+'）');get('[data-prison-profile]').textContent=prisoner.profile;
  const img=get('[data-prison-portrait]'),placeholder=get('[data-prison-placeholder]');img.hidden=true;img.removeAttribute('src');prisonPortrait='';placeholder.hidden=false;placeholder.textContent=prisoner.name+'\n立绘图包尚未接入';
  const revision=++prisonRequest;const urls=imageUrls(prisoner.portraitKey);let at=0;
  function attempt(){if(disposed||revision!==prisonRequest||at>=urls.length)return;const url=urls[at++],candidate=new Image();candidate.onload=()=>{if(disposed||revision!==prisonRequest||selectedPrisoner!==key)return;prisonPortrait=url;img.src=url;img.alt=prisoner.name;img.hidden=false;placeholder.hidden=true;};candidate.onerror=()=>{if(revision===prisonRequest)placeholder.textContent=prisoner.name+'\n立绘未能载入';attempt();};candidate.src=url;}
  attempt();get('[data-prison-back]').focus({preventScroll:true});
 }
 get('[data-open-prison]').addEventListener('click',event=>{refresh();prisonList();open(prisonDialog,event.currentTarget);});
 get('[data-prison-back]').addEventListener('click',()=>{const key=selectedPrisoner;prisonList();get('[data-prison-list]').querySelector('[data-prisoner="'+key+'"]')?.focus();});
 get('[data-close-prison]').addEventListener('click',()=>close(prisonDialog));
 prisonDialog.addEventListener('close',()=>{prisonRequest++;selectedPrisoner=null;});
 get('[data-prison-zoom]').addEventListener('click',event=>{const prisoner=state.prisoners.find(item=>item.key===selectedPrisoner);if(prisoner)showImage(prisoner.name+' · 立绘',prisonPortrait,event.currentTarget);});
 function resize(){try{const frame=window.frameElement;if(!frame)return;const height=Math.ceil(root.getBoundingClientRect().height+8);if(height>0&&frame.style.height!==height+'px')frame.style.height=height+'px';}catch{}}
 const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;observer?.observe(root);
 window.addEventListener('resize',resize);window.addEventListener('load',resize,{once:true});window.addEventListener('pagehide',()=>{disposed=true;portraitRequest++;prisonRequest++;observer?.disconnect();mapInstance?.dispose?.();runtime.dispose();window.removeEventListener('resize',resize)},{once:true});
 runtime.subscribe(renderState);runtime.start();
 window.ZYX=Object.freeze({runtime,Core:window.ZYXCore,PrisonTracker:window.ZYXPrisonTracker,MartialLedger:ledger,StatusRecords:records});
 loadPortrait();root.dataset.interactive='true';get('[data-runtime-notice]')?.remove();requestAnimationFrame(resize);
})();
