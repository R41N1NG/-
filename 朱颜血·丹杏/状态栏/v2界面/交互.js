/* gpt：独立HUD iframe控制器；只读聊天，地图只读，立绘由显式本地图包配置提供。 */
(() => {
 'use strict';
 /* 酒馆会给消息内的 class 统一加 custom- 前缀，故根节点一律走 data-zyx-hud 定位，避免选择器失配。 */
 const allRoots=document.querySelectorAll('[data-zyx-hud]:not([data-interactive="true"])');const root=allRoots[allRoots.length-1]||document.querySelector('[data-zyx-hud]');if(!root||root.dataset.interactive==='true')return;root.dataset.interactive='true';
 const ledger=window.ZYXMartialLedger,config=window.ZYX_HUD_CONFIG??{},mapDialog=root.querySelector('[data-map-dialog]'),portraitDialog=root.querySelector('[data-portrait-dialog]'),elapsedDialog=root.querySelector('[data-elapsed-dialog]');
 /* 动态生成的类名需与酒馆 custom- 前缀保持同步 */
 const CX=name=>window.ZYXClass?window.ZYXClass(name):name;
 const get=selector=>root.querySelector(selector),text=selector=>get(selector)?.textContent.trim()??'';
 let disposed=false,mapInstance=null,portraitRequest=0,currentPortrait='',portraitSignature='';
 const triggers=new Map();
 const snapshot={realm:text('[data-reported-realm]'),skills:text('[data-reported-skills]'),growth:{skill:text('[data-growth-skill]'),reason:text('[data-growth-reason]'),weight:text('[data-growth-weight]')}};
 /* 主视角原名：调换主次后本楼仍要能被武学账本正确识别，故锁定开局时的 focal 名 */
 const focalOrigin=text('[data-focal-name]');
 /* 情境立绘：显式pose与严格羁押布尔；不从地点或含关押字样的自由文本推断。 */
 let mainPose=text('[data-focal-pose]')||'';
 function rosterOf(){try{const state=currentBackend();if(state?.ready)return state.custody;}catch{}try{const records=window.ZYXStatusRecords,binding=boundHistory();if(records&&binding)return records.fromChat(binding.context.chat,{cutoff:binding.index}).allPrisoners||[];}catch{}try{const tracker=window.ZYXPrisonTracker;if(tracker){const report=Object.fromEntries([...root.querySelectorAll('[data-custody-state]')].map(node=>[node.dataset.custodyState,node.textContent.trim()]));return tracker.evaluateRoster([report]);}}catch{}return [];}
 let prisonRoster=[];
 function custodyFor(name){
  const normalize=window.ZYXPortraitLibrary?.normalizeRole||String,norm=normalize(name);
  return prisonRoster.find(actor=>[actor.name,...(actor.aliases||[])].some(alias=>normalize(alias)===norm))?.inCustody;
 }
 const portraitPoses=new Set(['常态','战斗','拔剑','哭泣','惊恐','愣住','事后','牢狱','关押']);
 function portraitPose(name){
  const pose=String(mainPose||'').trim(),custody=custodyFor(name);
  // pose只接纳协议枚举；未关押、传闻等自由文本不进入画像关键字匹配。
  if(portraitPoses.has(pose))return custody===false&&(pose==='牢狱'||pose==='关押')?'常态':pose;
  return custody===true?'牢狱':'常态';
 }
 function windows(){const all=[window];try{if(window.parent!==window)all.push(window.parent)}catch{}try{if(window.top!==window&&!all.includes(window.top))all.push(window.top)}catch{}return all;}
 function host(){for(const w of windows()){try{const c=w.SillyTavern?.getContext?.();if(c&&Array.isArray(c.chat))return {window:w,context:c};}catch{}}return null;}
 function field(body,tag){const matches=[...String(body).matchAll(new RegExp('<'+tag+'>([^<]*)</'+tag+'>','g'))];return matches.length===1?ledger.decodeText(matches[0][1]):'';}
 function matches(body){const checks=[['time',text('[data-snapshot-time]')],['location',text('[data-current-location]')],['favor_char',focalOrigin]].filter(([,value])=>value);return checks.length>0&&checks.every(([key,value])=>field(body,key)===value);}
 const pinnedChatId=host()?.context.chatId||host()?.context.getCurrentChatId?.()||null;
 function boundHistory(){const h=host();if(!h)return null;const chatId=h.context.chatId||h.context.getCurrentChatId?.();if(pinnedChatId&&chatId!==pinnedChatId)return null;let index=null;
  try{const node=window.frameElement?.closest('.mes');const attr=node?.getAttribute('mesid')??node?.getAttribute('data-message-id');if(attr!==null&&attr!==undefined&&/^\d+$/.test(attr))index=Number(attr);}catch{}
  if(index===null){for(const w of windows()){try{const fn=w.getCurrentMessageId??w.TavernHelper?.getCurrentMessageId;if(typeof fn==='function'){const id=fn();if(Number.isInteger(id)){index=id;break;}}}catch{}}}
  if(index!==null){const m=h.context.chat[index];return m&&!m.is_user&&matches(m.mes??m.message??'')?{...h,index}:null;}
  const candidates=h.context.chat.map((m,i)=>!m?.is_user&&matches(m?.mes??m?.message??'')?i:-1).filter(i=>i>=0);
  return candidates.length===1?{...h,index:candidates[0]}:null;
 }
 function currentBackend(){const binding=boundHistory();return binding?window.ZYXBackendProjection.read(binding.context.chat,binding.index,binding.context.chatId||binding.context.getCurrentChatId?.()):null;}
 prisonRoster=rosterOf();
 let archive=ledger.fromSnapshot(snapshot);
 function refreshMartial(){const binding=boundHistory();archive=binding?ledger.fromChat(binding.context.chat,{cutoff:binding.index}):ledger.fromSnapshot(snapshot);
  get('[data-player-caption]').textContent=archive.playerName?archive.playerName+' · 武学档案':'主角武学档案';
  for(const node of root.querySelectorAll('[data-player-realm]'))node.textContent=archive.realm??'未登记';
  const list=get('[data-player-skills]');list.replaceChildren();
  for(const skill of archive.skills){const item=document.createElement('li');item.textContent=skill;list.append(item);}
  if(!archive.skills.length){const item=document.createElement('li');item.textContent='尚未登记已掌握武学';item.className=CX('zyx-hud-skill-empty');list.append(item);}
  const source=get('[data-martial-source]');source.textContent=binding?'按本次开局与截至本楼的明确回报记录。':'仅显示本楼回报；开局档案暂未关联。';
 }
 function close(dialog){if(dialog&&dialog.open){try{dialog.close();}catch(e){dialog.removeAttribute('open');}}}
 function open(dialog,source){if(dialog)triggers.set(dialog,source);if(dialog&&!dialog.open){try{dialog.showModal();}catch(e){dialog.setAttribute('open','');}}}
 function backdrop(event){const d=event.currentTarget;if(event.target!==d)return;const r=d.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close(d);}
 for(const dialog of [mapDialog,portraitDialog,elapsedDialog]){dialog.addEventListener('click',backdrop);dialog.addEventListener('close',()=>{triggers.get(dialog)?.focus?.({preventScroll:true});triggers.delete(dialog);});}
 get('[data-open-map]').addEventListener('click',event=>{refreshMartial();mapInstance?.dispose?.();mapInstance=window.ZYXMapPanel.mount(mapDialog,{location:text('[data-current-location]'),identity:archive.identity});open(mapDialog,event.currentTarget);});
 const growthPanel=get('[data-martial-ledger]')||get('.zyx-hud-growth')||get('.custom-zyx-hud-growth');if(growthPanel)growthPanel.addEventListener('toggle',()=>{if(growthPanel.open)refreshMartial();});
 /* 立绘轮换种子：同一楼恒定、跨楼变化（时间 + 地点 + 现场五感） */
 function poseSeed(){return [text('[data-snapshot-time]'),text('[data-current-location]'),text('[data-environment]')].join('|');}
 function origin(){const h=host();if(h){try{return h.window.location.href;}catch{}}try{return window.parent.location.href;}catch{return window.location.href;}}
 function focalName(){return text('[data-focal-name]');}
 function isNobody(value){return !value||/^(无|暂无|无他人|暂无他人|独处|未记.*)$/.test(value);}
 function extraNameOf(card){const node=card.querySelector('[data-extra-name]');return isNobody(node?node.textContent.trim():'')?'':node.textContent.trim();}
 function loadPortrait(){const revision=++portraitRequest,name=focalName(),img=get('[data-portrait-image]'),placeholder=get('[data-portrait-placeholder]'),button=get('[data-open-portrait]');
  portraitSignature=JSON.stringify([name,portraitPose(name)]);
  img.hidden=true;currentPortrait='';button.classList.remove(CX('has-portrait'));placeholder.hidden=false;placeholder.textContent=name&&name!=='无'?name+'\n暂无立绘':'独处 · 暂无他人';
  button.setAttribute('aria-label',name&&name!=='无'?'查看'+name+'立绘':'当前无在场人物立绘');
  if(!name||/^(无|暂无|独处)$/.test(name))return;
  let portraitConfig=config.portraits??{};for(const w of windows()){try{if(w.ZYX_DANXING_PORTRAITS&&typeof w.ZYX_DANXING_PORTRAITS==='object'){portraitConfig=w.ZYX_DANXING_PORTRAITS;break;}}catch{}}
  const resolved=window.ZYXPortraitLibrary.resolve(name,portraitConfig,origin(),portraitPose(name),poseSeed());let position=0;
  function attempt(){if(disposed||revision!==portraitRequest||position>=resolved.urls.length)return;const url=resolved.urls[position++],candidate=new Image();candidate.onload=()=>{if(disposed||revision!==portraitRequest)return;currentPortrait=url;img.src=url;img.alt=name;img.hidden=false;placeholder.hidden=true;button.classList.add(CX('has-portrait'));if(portraitDialog.open){const large=get('[data-portrait-large]');large.src=url;large.alt=name;large.hidden=false;get('[data-portrait-message]').hidden=true;}};candidate.onerror=attempt;candidate.src=url;}
  attempt();
 }
 get('[data-open-portrait]').addEventListener('click',event=>{const image=get('[data-portrait-large]'),message=get('[data-portrait-message]'),name=focalName();get('[data-portrait-title]').textContent=name&&name!=='无'?name+' · 立绘':'人物立绘';image.hidden=!currentPortrait;message.hidden=!!currentPortrait;
  if(currentPortrait){image.src=currentPortrait;image.alt=name;}else{image.removeAttribute('src');message.textContent='当前人物尚未配置立绘。';}open(portraitDialog,event.currentTarget);});
 get('[data-close-portrait]').addEventListener('click',()=>close(portraitDialog));

 // -------------------------------------------------------------
 // 在场他人 · 点击与主视角调换主次（再点同一张即换回）
 // 只改展示，不改剧情数据；主视角缺失的判词（favor_reason）暂存到卡片 dataset，换回时还原。
 // -------------------------------------------------------------
 const extraCards=[...root.querySelectorAll('[data-extra-person]')];
 const extraEmpty=get('[data-extra-empty]');
 const mainFields={
  name:get('[data-focal-name]'),
  stage:get('[data-focal-stage]'),
  aura:get('[data-focal-aura]'),
  reason:get('[data-focal-reason]'),
  mind:get('[data-focal-mind]'),
  demeanor:get('[data-focal-demeanor]')
 };
 const reasonRow=mainFields.reason?mainFields.reason.closest('[data-focal-reason-row]'):null;
 function fieldOf(card,selector){const node=card.querySelector(selector);return node?node.textContent.trim():'';}
 function readMain(){return {name:focalName(),stage:mainFields.stage?mainFields.stage.textContent.trim():'',aura:mainFields.aura?mainFields.aura.textContent.trim():'',reason:mainFields.reason?mainFields.reason.textContent.trim():'',mind:mainFields.mind?mainFields.mind.textContent.trim():'',demeanor:mainFields.demeanor?mainFields.demeanor.textContent.trim():''};}
 function readCard(card){return {name:fieldOf(card,'[data-extra-name]'),stage:fieldOf(card,'[data-extra-stage]'),aura:fieldOf(card,'[data-extra-aura]'),reason:card.dataset.reason||'',mind:fieldOf(card,'[data-extra-mind]'),demeanor:fieldOf(card,'[data-extra-demeanor]')};}
 function writeMain(person){
  if(mainFields.name)mainFields.name.textContent=person.name||'无';
  if(mainFields.stage)mainFields.stage.textContent=person.stage||'—';
  if(mainFields.aura)mainFields.aura.textContent=person.aura||'—';
  if(mainFields.mind)mainFields.mind.textContent=person.mind||'—';
  if(mainFields.demeanor)mainFields.demeanor.textContent=person.demeanor||'—';
  if(mainFields.reason)mainFields.reason.textContent=person.reason||'';
  if(reasonRow)reasonRow.hidden=!person.reason;
 }
 function writeCard(card,person){
  const nameNode=card.querySelector('[data-extra-name]');if(nameNode)nameNode.textContent=person.name||'无';
  const stageNode=card.querySelector('[data-extra-stage]');if(stageNode)stageNode.textContent=person.stage||'—';
  const auraNode=card.querySelector('[data-extra-aura]');if(auraNode)auraNode.textContent=person.aura||'—';
  const mindNode=card.querySelector('[data-extra-mind]');if(mindNode)mindNode.textContent=person.mind||'—';
  const demeanorNode=card.querySelector('[data-extra-demeanor]');if(demeanorNode)demeanorNode.textContent=person.demeanor||'—';
  card.dataset.reason=person.reason||'';
 }
 function syncExtraVisibility(){let any=false;for(const card of extraCards){const ok=!!extraNameOf(card);card.hidden=!ok;if(ok)any=true;}if(extraEmpty)extraEmpty.style.display=any?'none':'';}
 function swapWithCard(card){
  const incoming=readCard(card);
  if(isNobody(incoming.name))return;
  const outgoing=readMain();
  const incomingPose=card.dataset.pose||'';
  writeMain({name:incoming.name,stage:incoming.stage,aura:incoming.aura,reason:incoming.reason,mind:incoming.mind,demeanor:incoming.demeanor});
  card.dataset.pose=mainPose;
  mainPose=incomingPose;
  writeCard(card,outgoing);
  card.classList.add(CX('is-swapped'));
  window.setTimeout(()=>card.classList.remove(CX('is-swapped')),600);
  loadPortrait();
 }
 for(const card of extraCards){
  const pick=()=>swapWithCard(card);
  card.addEventListener('click',pick);
  card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();pick();}});
 }
 syncExtraVisibility();
 function resize(){try{const frame=window.frameElement;if(!frame)return;const height=Math.ceil(root.getBoundingClientRect().height+8);if(height>0&&frame.style.height!==height+'px')frame.style.height=height+'px';}catch{}}
 const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;observer?.observe(root);
 window.addEventListener('resize',resize);window.addEventListener('load',resize,{once:true});window.addEventListener('pagehide',()=>{disposed=true;portraitRequest++;observer?.disconnect();mapInstance?.dispose?.();window.removeEventListener('resize',resize)},{once:true});

// -------------------------------------------------------------
// 豺狼坡黑狱 · 牢狱主导权与人犯卷宗控制器
// -------------------------------------------------------------
const prisonLockedDialog = root.querySelector('[data-prison-locked-dialog]');
const prisonDialog = root.querySelector('[data-prison-dialog]');
const prisonZoomDialog = root.querySelector('[data-prison-zoom-dialog]');
const prisonBtn = root.querySelector('[data-open-prison]');

function prisoners(){return rosterOf().filter(item=>item.inCustody===true);}
let activePrisonerKey = 'bailian';
let currentPrisonerPortrait = '',prisonImageRevision=0;
function renderPrisonTabs(){const list=root.querySelector('[data-prison-tabs]');if(!list)return;const actors=prisoners();list.replaceChildren();for(const actor of actors){const button=document.createElement('button');button.type='button';button.className=CX('zyx-prison-tab');button.dataset.prisonerTab=actor.key;button.textContent=actor.name+' · 在押';button.addEventListener('click',()=>selectPrisoner(actor.key));list.append(button);}const content=root.querySelector('.zyx-prison-content')||root.querySelector('.custom-zyx-prison-content');if(content)content.hidden=!actors.length;if(!actors.length){const empty=document.createElement('p');empty.textContent='当前没有明确在押的角色。';list.append(empty);activePrisonerKey=null;prisonImageRevision++;currentPrisonerPortrait='';}else{if(!actors.some(x=>x.key===activePrisonerKey))activePrisonerKey=actors[0].key;selectPrisoner(activePrisonerKey);}}

function isPrisonControlled(){const state=currentBackend();return state?.ready===true&&state.prisonControl==='掌控';}

function updatePrisonBtnVisual() {
  const controlled = isPrisonControlled();
  if (prisonBtn) {
    prisonBtn.classList.toggle(CX('is-controlled'), controlled);
    const lockIcon = prisonBtn.querySelector('[data-prison-lock-icon]');
    const keyIcon = prisonBtn.querySelector('[data-prison-key-icon]');
    const label = prisonBtn.querySelector('[data-prison-btn-label]');
    if (lockIcon) lockIcon.hidden = controlled;
    if (keyIcon) keyIcon.hidden = !controlled;
    if (label) label.textContent = controlled ? '监牢 (已控)' : '监牢 (未控)';
  }
}

function selectPrisoner(key) {
  if(!isPrisonControlled())return;
  const actor=prisoners().find(p=>p.key===key);if(!actor)return;
  activePrisonerKey=key;
  const p={name:actor.name,identity:actor.profile,location:'本轮未明报具体牢房',realm:'参见人物原设；当前封脉情况未明',condition:actor.state,restraints:'本轮未明报',seized:'本轮未明报',threat:'依已确认羁押回报，不推测当前伤势',imprisonedFile:actor.portraitKey};
  const tabs = root.querySelectorAll('[data-prisoner-tab]');
  tabs.forEach(t => t.classList.toggle(CX('is-active'), t.dataset.prisonerTab === key));

  const setT = (sel, val) => { const el = root.querySelector(sel); if (el) el.textContent = val; };
  setT('[data-dossier-name]', p.name);
  setT('[data-dossier-identity]', p.identity);
  setT('[data-dossier-location]', p.location);
  setT('[data-dossier-realm]', p.realm);
  setT('[data-dossier-condition]', p.condition);
  setT('[data-dossier-restraints]', p.restraints);
  setT('[data-dossier-seized]', p.seized);
  setT('[data-dossier-threat]', p.threat);

  loadPrisonerPortrait(p.imprisonedFile, p.name);
}

function loadPrisonerPortrait(fileKey, charName) {
  const revision=++prisonImageRevision;
  const img = root.querySelector('[data-prisoner-portrait]');
  const ph = root.querySelector('[data-prisoner-placeholder]');
  if (!img) return;
  img.hidden = true;
  currentPrisonerPortrait = '';
  if (ph) { ph.hidden = false; ph.textContent = charName + '\n关押中立绘载入中'; }

  let portraitConfig = config.portraits ?? {};
  for (const w of windows()) {
    try {
      if (w.ZYX_DANXING_PORTRAITS && typeof w.ZYX_DANXING_PORTRAITS === 'object') {
        portraitConfig = w.ZYX_DANXING_PORTRAITS;
        break;
      }
    } catch {}
  }

  let resolved = window.ZYXPortraitLibrary?.resolve ? window.ZYXPortraitLibrary.resolve(fileKey, portraitConfig, origin()) : { urls: [] };
  const candidateUrls = [...(resolved.urls || [])];
  // 只用图包配置里的显式地址。

  let pos = 0;
  function attempt() {
    if(disposed||revision!==prisonImageRevision)return;
    if (pos >= candidateUrls.length) {
      if (ph) ph.textContent = charName + '\n暂无关押立绘';
      return;
    }
    const url = candidateUrls[pos++];
    const candidate = new Image();
    candidate.onload = () => {
      if (disposed||revision!==prisonImageRevision) return;
      currentPrisonerPortrait = url;
      img.src = url;
      img.alt = charName;
      img.hidden = false;
      if (ph) ph.hidden = true;
    };
    candidate.onerror = attempt;
    candidate.src = url;
  }
  attempt();
}

if (prisonBtn) {
  prisonBtn.addEventListener('click', event => {
    updatePrisonBtnVisual();
    if (isPrisonControlled()) {
      renderPrisonTabs();
      open(prisonDialog, event.currentTarget);
    } else {
      open(prisonLockedDialog, event.currentTarget);
    }
  });
}

const pTabs = root.querySelectorAll('[data-prisoner-tab]');
pTabs.forEach(t => {
  t.addEventListener('click', () => {
    selectPrisoner(t.dataset.prisonerTab);
  });
});

function openPrisonZoom() {
  if(!isPrisonControlled())return;
  const zoomImg = root.querySelector('[data-prison-zoom-large]');
  const zoomTitle = root.querySelector('[data-prison-zoom-title]');
  if (zoomImg && currentPrisonerPortrait) {
    zoomImg.src = currentPrisonerPortrait;
    zoomImg.alt = prisoners().find(p=>p.key===activePrisonerKey)?.name || '关押立绘';
    if (zoomTitle) zoomTitle.textContent = (prisoners().find(p=>p.key===activePrisonerKey)?.name || '人犯') + ' · 关押中立绘';
    open(prisonZoomDialog, root.querySelector('[data-zoom-prisoner]'));
  }
}
root.querySelector('[data-zoom-prisoner]')?.addEventListener('click', openPrisonZoom);
root.querySelector('[data-prisoner-portrait-wrapper]')?.addEventListener('click', openPrisonZoom);

root.querySelector('[data-close-prison-locked]')?.addEventListener('click', () => close(prisonLockedDialog));
root.querySelector('[data-close-prison]')?.addEventListener('click', () => close(prisonDialog));
root.querySelector('[data-close-prison-zoom]')?.addEventListener('click', () => close(prisonZoomDialog));

[prisonLockedDialog, prisonDialog, prisonZoomDialog].forEach(d => {
  if (d) {
    d.addEventListener('click', backdrop);
    d.addEventListener('close', () => { triggers.get(d)?.focus?.({ preventScroll: true }); triggers.delete(d); });
  }
});

updatePrisonBtnVisual();

 function refreshElapsed(){
  const binding=boundHistory(),state=currentBackend(),ready=state?.ready===true&&!!state.time;
  let record=null;try{if(binding)record=window.ZYXStatusRecords.fromChat(binding.context.chat,{cutoff:binding.index});}catch{}
  const elapsed=record?.elapsed||text('[data-reported-elapsed]');
  get('[data-elapsed-current]').textContent=elapsed&&!/^(?:无|未知|未明)$/.test(elapsed)?elapsed:'待回报';
  get('[data-elapsed-time]').textContent=ready?state.time.formatted:'时刻未确认';
  get('[data-elapsed-source]').textContent=binding?'截至本楼的逐楼耗时申报；每行是该轮耗时，不是开局累计。':'仅显示本楼申报；历史暂未关联。';
  const list=get('[data-elapsed-history]');list.replaceChildren();
  for(const entry of record?.history||[]){const item=document.createElement('li');item.textContent='#'+entry.floor+' · 本轮耗时 '+entry.elapsed+' · '+entry.location;list.append(item);}
  if(!list.children.length){const item=document.createElement('li');item.textContent='暂无可关联的历史耗时记录。';list.append(item);}
 }
 get('[data-open-elapsed]').addEventListener('click',event=>{refreshElapsed();open(elapsedDialog,event.currentTarget);});
 get('[data-close-elapsed]').addEventListener('click',()=>close(elapsedDialog));
 function revokePrisonAccess(){
  prisonImageRevision++;currentPrisonerPortrait='';
  for(const selector of ['[data-prisoner-portrait]','[data-prison-zoom-large]']){const img=get(selector);if(img){img.hidden=true;img.removeAttribute('src');}}
  close(prisonZoomDialog);close(prisonDialog);
 }
 function refreshBackend(){
  const state=currentBackend(),ready=state?.ready===true&&!!state.time,badge=get('[data-zyx-force]');
  if(badge){badge.hidden=false;badge.textContent=ready?'第'+state.time.act+'幕 · 官方知晓 '+state.official.val+'（'+state.official.tierName+'）· 节点 '+Object.keys(state.events.fired).length+'/8'+(state.pending?.length?' · 待核'+state.pending.length+'项':''):state?'开局待核 · 时刻未确认':'后台未同步 · 此楼尚未确认结算';}
  {const clock=get('.zyx-hud-time .zyx-hud-value')||get('.custom-zyx-hud-time .custom-zyx-hud-value');if(clock)clock.textContent=ready?state.time.formatted:'时刻未确认';const trend=get('.zyx-hud-trend p')||get('.custom-zyx-hud-trend p');if(trend)trend.textContent=ready?(state.trend?.summary||''):'开局待核，天下大势尚未确认。';}
  const clueNode=get('[data-backend-clues]');if(clueNode)clueNode.textContent=ready?'已确认信物 '+state.intel.value+' 件，本幕 '+state.intel.actCount+'/'+state.intel.actTotal:state?'开局待核，信物尚未结算':'后台未同步';
  const events=get('[data-backend-events]');if(events){events.replaceChildren();for(const node of Object.values(state?.events.fired||{})){const li=document.createElement('li');li.textContent=node.name;events.append(li);}}
  const issues=get('[data-backend-issues]');if(issues){issues.replaceChildren();for(const issue of state?.pending||[]){const li=document.createElement('li');li.textContent='#'+issue.floor+' '+issue.message;issues.append(li);}if(!state?.pending.length){const li=document.createElement('li');li.textContent=state?'无待核事项':'等待独立后台';issues.append(li);}}
  prisonRoster=rosterOf();if(portraitSignature!==JSON.stringify([focalName(),portraitPose(focalName())]))loadPortrait();updatePrisonBtnVisual();if(!isPrisonControlled())revokePrisonAccess();else if(prisonDialog?.open)renderPrisonTabs();if(elapsedDialog?.open)refreshElapsed();
 }
 const backendOff=[];for(const w of windows()){w.addEventListener('zyx-backend-state',refreshBackend);backendOff.push(()=>w.removeEventListener('zyx-backend-state',refreshBackend));}
 window.addEventListener('pagehide',()=>{for(const off of backendOff)off();prisonImageRevision++;},{once:true});
 window.ZYX=Object.freeze({getSnapshot:currentBackend,getFullRoster:()=>currentBackend()?.custody||[],getImprisonedList:()=>currentBackend()?.custody.filter(x=>x.inCustody===true)||[]});
 refreshBackend();refreshMartial();requestAnimationFrame(resize);
})();
