"use strict";
const C=require('./contracts');
const {relicOwner,playerOwner}=require('./relic_owner');
const PHASES=['前期','中期','后期','大圆满'];
const MAJORS=['炼气','筑基','金丹','元婴','化神'];
function parse(text){
 const raw=String(text||'').trim(),m=/^(炼气|练气|筑基|金丹|元婴|化神)(?:期)?(初期|前期|中期|后期|大圆满)?$/.exec(raw);
 return m?{major:m[1]==='练气'?'炼气':m[1],phase:m[2]==='初期'?'前期':m[2]||null,label:raw}:{major:null,phase:null,label:raw};
}
function label(realm){return realm?.phase?realm.major+realm.phase:realm?.label||'未定';}
function brokenByPlayer(s,cfg,rules){
 const group=rules.FORM_OF_HOLDERS.find(x=>x.form===cfg.formKey);
 return !!group && s.stat_data.known[cfg.formKey] && group.holders.every(h=>s.stat_data.known[h+'处女丧失'] && playerOwner(s,s.stat_data.破处者?.[h]));
}
function ensure(s,rules){
 const st=s.stat_data;
 st.relic_imprints ||= {};
 if(!st.player_realm){
  st.player_realm={...parse(st.修为),credited:Object.values(rules.RELIC_PILOT_CONFIG).filter(c=>brokenByPlayer(s,c,rules)).map(c=>c.id),actions:[]};
 }
 // Migrate validated receipts on existing saves too; never infer them from ownership alone.
  for(const cfg of Object.values(rules.RELIC_PILOT_CONFIG))if(brokenByPlayer(s,cfg,rules) && playerOwner(s,relicOwner(st,cfg)) && (st.relic_progress?.[cfg.id]?.history||[]).some(h=>playerOwner(s,h.actor)&&/内射|精液灌注|本源浸润/.test(h.action||'')))
   st.relic_imprints[cfg.id] ||= {owner:s.identity,source:'validated-history'};
 st.player_realm.credited ||= [];st.player_realm.actions ||= [];
 st.修为=label(st.player_realm);
 return st.player_realm;
}
function collect(s,rules,prose,floor){
 const r=ensure(s,rules),st=s.stat_data;
 for(const cfg of Object.values(rules.RELIC_PILOT_CONFIG)){
  if(brokenByPlayer(s,cfg,rules) && !r.credited.includes(cfg.id)){
   r.credited.push(cfg.id);
   const from=label(r);
   if(['炼气','筑基'].includes(r.major))r.phase='大圆满';
   else if(r.major==='金丹' && r.phase && r.phase!=='大圆满')r.phase=PHASES[PHASES.indexOf(r.phase)+1];
   if(label(r)!==from)r.actions.push({kind:'first-deflower',relicId:cfg.id,floor,from,to:label(r)});
  }
  const scoped=rules.relicEvidenceProse(cfg.id,prose);
  const proof=scoped.split(/[。！？\n]/).some(line=>(line.includes(s.identity)||line.includes('你')||(st.自设?.name&&line.includes(st.自设.name))) && /内射|精液灌注|本源浸润|(?:留下|产生|生成|形成|确立).{0,12}本源烙印/.test(line));
  if(st.known[cfg.formKey] && playerOwner(s,relicOwner(st,cfg)) && proof)
   st.relic_imprints[cfg.id] ||= {owner:s.identity,source:'story',floor};
 }
 st.修为=label(r);
}
function eligibility(s,rules){
 const r=s.stat_data.player_realm || parse(s.stat_data.修为),cfgs=Object.values(rules.RELIC_PILOT_CONFIG);
 const details=cfgs.map(cfg=>{
  const owner=relicOwner(s.stat_data,cfg),formed=!!s.stat_data.known[cfg.formKey],broken=!!brokenByPlayer(s,cfg,rules),owned=playerOwner(s,owner),imprinted=playerOwner(s,s.stat_data.relic_imprints?.[cfg.id]?.owner),stage=rules.getRelicStage(cfg.id,s.stat_data.known);
  return {id:cfg.id,name:cfg.names[0],owner,formed,broken,owned,imprinted,stage,missing:[!formed?'未确认成型':'',!broken?'未确认由你破处':'',!owned?'归属不是你或未确认':'',!imprinted?'未确认本源烙印':''].filter(Boolean)};
 });
 const marked=details.filter(c=>c.broken&&c.owned&&c.imprinted),trained=details.filter(c=>c.owned&&c.stage>=3);
 const breakthrough=r.phase==='大圆满' && (['炼气','筑基'].includes(r.major)||(r.major==='金丹'&&(marked.length>=3||trained.length>0)));
 return {details,marked:marked.map(c=>c.name),trained:trained.map(c=>c.name),breakthrough,retreat:r.major==='金丹'&&PHASES.slice(0,3).includes(r.phase)};
}
function act(s,rules,kind,floor){
 const r=ensure(s,rules),e=eligibility(s,rules),from=label(r);
 if(kind==='breakthrough'){
  if(!e.breakthrough)throw Error('尚未满足当前境界的突破条件');
  r.major=MAJORS[MAJORS.indexOf(r.major)+1];r.phase='前期';
 }else if(kind==='retreat'){
  if(!e.retreat)throw Error('闭关升档仅适用于金丹前期、中期、后期');
  r.phase=PHASES[PHASES.indexOf(r.phase)+1];
  s.calendarDate=C.fromDay(C.day(s.calendarDate)+90);s.stat_data.历时='90日';
 }else throw Error('未知境界行动');
 r.actions.push({kind,floor,from,to:label(r),days:kind==='retreat'?90:0});s.stat_data.修为=label(r);
}
module.exports={PHASES,MAJORS,parse,label,ensure,collect,eligibility,act,playerOwner};
