/* gpt：独立HUD iframe控制器；只读聊天，地图只读，立绘由显式本地图包配置提供。 */
(() => {
 'use strict';
 const root=document.querySelector('.zyx-hud');if(!root||root.dataset.interactive)return;root.dataset.interactive='true';
 const ledger=window.ZYXMartialLedger,config=window.ZYX_HUD_CONFIG??{},mapDialog=root.querySelector('[data-map-dialog]'),portraitDialog=root.querySelector('[data-portrait-dialog]');
 const get=selector=>root.querySelector(selector),text=selector=>get(selector)?.textContent.trim()??'';
 let disposed=false,mapInstance=null,portraitRequest=0,currentPortrait='',trigger=null;
 const snapshot={realm:text('[data-reported-realm]'),skills:text('[data-reported-skills]'),growth:{skill:text('[data-growth-skill]'),reason:text('[data-growth-reason]'),weight:text('[data-growth-weight]')}};
 function windows(){const all=[window];try{if(window.parent!==window)all.push(window.parent)}catch{}try{if(window.top!==window&&!all.includes(window.top))all.push(window.top)}catch{}return all;}
 function host(){for(const w of windows()){try{const c=w.SillyTavern?.getContext?.();if(c&&Array.isArray(c.chat))return {window:w,context:c};}catch{}}return null;}
 function field(body,tag){const matches=[...String(body).matchAll(new RegExp('<'+tag+'>([^<]*)</'+tag+'>','g'))];return matches.length===1?ledger.decodeText(matches[0][1]):'';}
 function matches(body){const checks=[['time',text('[data-snapshot-time]')],['location',text('[data-current-location]')],['favor_char',text('[data-focal-name]')]].filter(([,value])=>value);return checks.length>0&&checks.every(([key,value])=>field(body,key)===value);}
 function boundHistory(){const h=host();if(!h)return null;let index=null;
  try{const node=window.frameElement?.closest('.mes');const attr=node?.getAttribute('mesid')??node?.getAttribute('data-message-id');if(attr!==null&&attr!==undefined&&/^\d+$/.test(attr))index=Number(attr);}catch{}
  if(index===null){for(const w of windows()){try{const fn=w.getCurrentMessageId??w.TavernHelper?.getCurrentMessageId;if(typeof fn==='function'){const id=fn();if(Number.isInteger(id)){index=id;break;}}}catch{}}}
  if(index!==null){const m=h.context.chat[index];return m&&!m.is_user&&matches(m.mes??m.message??'')?{...h,index}:null;}
  const candidates=h.context.chat.map((m,i)=>!m?.is_user&&matches(m?.mes??m?.message??'')?i:-1).filter(i=>i>=0);
  return candidates.length===1?{...h,index:candidates[0]}:null;
 }
 let archive=ledger.fromSnapshot(snapshot);
 function refreshMartial(){const binding=boundHistory();archive=binding?ledger.fromChat(binding.context.chat,{cutoff:binding.index}):ledger.fromSnapshot(snapshot);
  get('[data-player-caption]').textContent=archive.playerName?archive.playerName+' · 武学档案':'主角武学档案';
  for(const node of root.querySelectorAll('[data-player-realm]'))node.textContent=archive.realm??'未登记';
  const list=get('[data-player-skills]');list.replaceChildren();
  for(const skill of archive.skills){const item=document.createElement('li');item.textContent=skill;list.append(item);}
  if(!archive.skills.length){const item=document.createElement('li');item.textContent='尚未登记已掌握武学';item.className='zyx-hud-skill-empty';list.append(item);}
  const source=get('[data-martial-source]');source.textContent=binding?'按本次开局与截至本楼的明确回报记录。':'仅显示本楼回报；开局档案暂未关联。';
 }
 function close(dialog){if(dialog?.open)dialog.close();}
 function open(dialog,source){trigger=source;if(!dialog.open)dialog.showModal();}
 function backdrop(event){const d=event.currentTarget;if(event.target!==d)return;const r=d.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close(d);}
 for(const dialog of [mapDialog,portraitDialog]){dialog.addEventListener('click',backdrop);dialog.addEventListener('close',()=>{trigger?.focus?.({preventScroll:true});trigger=null;});}
 get('[data-open-map]').addEventListener('click',event=>{refreshMartial();mapInstance?.dispose?.();mapInstance=window.ZYXMapPanel.mount(mapDialog,{location:text('[data-current-location]'),identity:archive.identity});open(mapDialog,event.currentTarget);});
 get('.zyx-hud-growth').addEventListener('toggle',()=>{if(get('.zyx-hud-growth').open)refreshMartial();});
 function origin(){const h=host();if(h){try{return h.window.location.href;}catch{}}try{return window.parent.location.href;}catch{return window.location.href;}}
 function loadPortrait(){const revision=++portraitRequest,name=text('[data-focal-name]'),img=get('[data-portrait-image]'),placeholder=get('[data-portrait-placeholder]'),button=get('[data-open-portrait]');
  img.hidden=true;currentPortrait='';button.classList.remove('has-portrait');placeholder.hidden=false;placeholder.textContent=name&&name!=='无'?name+'\n暂无立绘':'独处 · 暂无他人';
  button.setAttribute('aria-label',name&&name!=='无'?'查看'+name+'立绘':'当前无在场人物立绘');
  if(!name||/^(无|暂无|独处)$/.test(name))return;
  let portraitConfig=config.portraits??{};for(const w of windows()){try{if(w.ZYX_DANXING_PORTRAITS&&typeof w.ZYX_DANXING_PORTRAITS==='object'){portraitConfig=w.ZYX_DANXING_PORTRAITS;break;}}catch{}}
  const resolved=window.ZYXPortraitLibrary.resolve(name,portraitConfig,origin());let position=0;
  function attempt(){if(disposed||revision!==portraitRequest||position>=resolved.urls.length)return;const url=resolved.urls[position++],candidate=new Image();candidate.onload=()=>{if(disposed||revision!==portraitRequest)return;currentPortrait=url;img.src=url;img.alt=name;img.hidden=false;placeholder.hidden=true;button.classList.add('has-portrait');if(portraitDialog.open){const large=get('[data-portrait-large]');large.src=url;large.alt=name;large.hidden=false;get('[data-portrait-message]').hidden=true;}};candidate.onerror=attempt;candidate.src=url;}
  attempt();
 }
 get('[data-open-portrait]').addEventListener('click',event=>{const image=get('[data-portrait-large]'),message=get('[data-portrait-message]'),name=text('[data-focal-name]');get('[data-portrait-title]').textContent=name&&name!=='无'?name+' · 立绘':'人物立绘';image.hidden=!currentPortrait;message.hidden=!!currentPortrait;
  if(currentPortrait){image.src=currentPortrait;image.alt=name;}else{image.removeAttribute('src');message.textContent='当前人物尚未配置立绘。';}open(portraitDialog,event.currentTarget);});
 get('[data-close-portrait]').addEventListener('click',()=>close(portraitDialog));
 function resize(){try{const frame=window.frameElement;if(!frame)return;const height=Math.ceil(root.getBoundingClientRect().height+8);if(height>0&&frame.style.height!==height+'px')frame.style.height=height+'px';}catch{}}
 const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;observer?.observe(root);
 window.addEventListener('resize',resize);window.addEventListener('load',resize,{once:true});window.addEventListener('pagehide',()=>{disposed=true;portraitRequest++;observer?.disconnect();mapInstance?.dispose?.();window.removeEventListener('resize',resize)},{once:true});
 refreshMartial();loadPortrait();requestAnimationFrame(resize);
})();
