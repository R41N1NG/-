"use strict";
const {esc,modal}=require('./dom');
const {describeItem}=require('../runtime/item_catalog');
const {dateText,clone}=require('../runtime/contracts');
const {currentEra}=require('../runtime/grand_eras');
const CSS=`.xsd2-gm{width:min(740px,94vw);max-width:94vw;max-height:94vh;padding:0;background:#100d13;color:#ddd4bf;border:1px solid #b28d35;border-radius:14px;overflow:hidden;box-sizing:border-box;font-size:14px;box-shadow:0 10px 60px #000b}.xsd2-gm header{padding:12px 16px;border-bottom:1px solid #654c1d;background:#18120f;align-items:center;gap:8px}.xsd2-gm header strong{color:#efd58f;font-size:18px}.xsd2-gm header small{font-weight:normal;color:#8d8573;font-size:12px}.xsd2-gm button{background:#1d1811;color:#dfc681;border:1px solid #6d511c;border-radius:7px;margin:0;padding:5px 10px;font-size:13px;cursor:pointer}.xsd2-gm button:hover{border-color:#d9b35b;color:#ffe0a0}.xsd2-gm .xsd2-dialog-body{padding:0}.xsd2-gm form{display:flex;flex-direction:column;min-height:0;margin:0}.xsd2-gm-scroll{overflow:auto;max-height:69vh;padding:14px 16px}.xsd2-gm-section{border:1px solid #3f3221;background:#17131c;border-radius:12px;margin:0 0 12px;padding:12px}.xsd2-gm-section summary{cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 10px;padding-bottom:8px;border-bottom:1px dashed #493825;color:#dfc681;font-size:14px}.xsd2-gm-section summary small{color:#9c927d;font-weight:normal}.xsd2-gm-section summary::before{content:"▾"}.xsd2-gm-section:not([open]) summary::before{content:"▸"}.xsd2-gm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 16px}.xsd2-gm label{display:block;margin:0;color:#a89c86;font-size:13px}.xsd2-gm input:not([type=checkbox]),.xsd2-gm select,.xsd2-gm textarea{display:block;box-sizing:border-box;width:100%;margin:4px 0 0;padding:6px 9px;background:#0c0910;border:1px solid #493b25;color:#ddd4bf;border-radius:7px;font-size:14px}.xsd2-gm textarea{min-height:72px;resize:vertical}.xsd2-gm input[type=checkbox]{width:16px;height:16px;margin:0 8px 0 0;accent-color:#b58a2e;flex:none}.xsd2-gm .xsd2-gm-check{display:flex;align-items:center;color:#ddd4bf;min-height:28px}.xsd2-gm p{color:#9c927d;font-size:12px;margin:7px 0}.xsd2-gm-era{border:1px solid #483520;background:#120f18;border-radius:9px;padding:10px;margin:8px 0}.xsd2-gm-era.current{border-color:#b28d35;background:#2a2119}.xsd2-gm-era h4{margin:0;color:#dfc681}.xsd2-gm-era time{float:right;color:#9c927d;font-size:12px}.xsd2-gm footer{display:flex;gap:8px;flex-wrap:wrap;position:sticky;bottom:0;padding:10px 16px;background:#100d13;border-top:1px solid #493b25}.xsd2-gm footer [type=submit]{flex:1;background:linear-gradient(100deg,#715419,#94701d);color:#fff0c9;font-weight:bold;min-width:160px}.xsd2-gm-log{box-sizing:border-box;margin:0 16px 12px;padding:8px;border:1px solid #35291b;border-radius:7px;background:#0b080e;color:#a3926d;font-size:12px;max-height:64px;overflow:auto;white-space:pre-wrap}.xsd2-gm .xsd2-feedback{color:#edaa7d}.xsd2-gm .xsd2-gm-display{grid-column:1/-1}.xsd2-gm [readonly]{color:#968e7c}.xsd2-gm .xsd2-gm-stage{border-bottom:1px dashed #493825;padding:8px 0}.xsd2-gm .xsd2-gm-tools{display:flex;gap:6px}.xsd2-gm [data-snapshot-output]{min-height:180px}@media(max-width:520px){.xsd2-gm-grid{grid-template-columns:1fr}.xsd2-gm header strong{font-size:15px}.xsd2-gm-scroll{padding:10px}.xsd2-gm-section{padding:10px}}`;
function openGM(doc,runtime,data,report){
 const existing=doc.querySelector('dialog.xsd2-gm');if(existing){existing.focus();return ()=>existing.close();}
 let s=runtime.getSnapshot();if(!s)return;s=clone(s);
 let R=data.rules(s.stat_data);
 const el=modal(doc,'仙姝堕 · 后台 GM 修改器'),body=el.querySelector('.xsd2-dialog-body'),style=doc.createElement('style');
 style.textContent=CSS;doc.head.append(style);el.classList.add('xsd2-gm');
 el.querySelector('header').innerHTML='<strong>🎛 仙姝堕 · 后台 GM 修改器 <small>2.0</small></strong><div class="xsd2-gm-tools"><button type="button" data-reload title="重新读取当前存档">↻</button><button type="button" data-close aria-label="关闭GM">×</button></div>';
 el.querySelector('[data-close]').onclick=()=>el.close();el.addEventListener('close',()=>style.remove(),{once:true});
 const section=(title,content,note='')=>'<details class="xsd2-gm-section" open><summary>'+title+'</summary>'+content+(note?'<p>'+note+'</p>':'')+'</details>';
 const input=(label,name,value,type='text',attr='')=>'<label>'+esc(label)+'<input type="'+type+'" name="'+esc(name)+'" value="'+esc(value)+'" '+attr+'></label>';
 function render(){
  const forms=new Set(Object.values(R.RELIC_PILOT_CONFIG).map(c=>c.formKey));
  const stages=new Set(Object.values(R.RELIC_PILOT_CONFIG).flatMap(c=>[1,2,3,4].map(n=>c['stage'+n+'Key'])));
  const checks=(keys,id)=>section('<span>'+esc(id)+'（'+keys.length+'）</span><span class="xsd2-gm-tools"><button type="button" data-group="'+id+'" data-check="1">全开</button><button type="button" data-group="'+id+'" data-check="0">全关</button></span>',
   '<div class="xsd2-gm-grid" data-known-group="'+id+'">'+keys.map(k=>'<label class="xsd2-gm-check"><input type="checkbox" name="known:'+esc(k)+'" '+(s.known[k]?'checked':'')+'>'+esc(k)+'</label>').join('')+'</div>');
  const era=currentEra(data.grandEras||[],s.calendarDate);
  const metrics=Object.entries(data.characterProfiles||{}).flatMap(([name,cfg])=>Object.entries(cfg.metrics||{}).map(([key,m])=>input(name+' · '+key,'metric:'+name+':'+key,s.stat_data.character_metrics?.[name]?.[key]??m.default,'number','min="'+m.min+'" max="'+(s.stat_data.character_metric_caps?.[name]?.[key]??m.max)+'" step="1"'))).join('');
  const relics=Object.entries(R.RELIC_PILOT_CONFIG).map(([id,c])=>'<div class="xsd2-gm-stage"><strong>'+esc(c.names[0])+'</strong><div class="xsd2-gm-grid"><label>阶位<select name="stage:'+id+'">'+[0,1,2,3,4].map(n=>'<option value="'+n+'" '+(R.getRelicStage(id,s.known)===n?'selected':'')+'>'+['未成形','一阶','二阶','三阶','四阶'][n]+'</option>').join('')+'</select></label>'+input('归属（空表示无）','owner:'+id,s.stat_data.名器归属[id]||'')+'</div></div>').join('');
  const items=s.inventory.map(item=>{const x=describeItem(item);return [x.name,x.count,x.consumable?'消耗品':'非消耗品',x.description,x.effect].join(' | ');}).join('\n');
  const displays=['时间','历时','地点','天气','环境','在场','暗处','状态','目标','局势','线索','近闻','远闻','危机','关系刻度','实际发生','储物栏'];
  body.innerHTML='<form>'+ '<main class="xsd2-gm-scroll">'+
   section('📋 当前账本 <small>known '+Object.values(s.known).filter(Boolean).length+'/'+R.ALL_FIELDS.length+' 已解锁</small>','<p>身份 <b>'+esc(s.identity)+'</b> · 阵营 <b>'+esc(s.stat_data.阵营||'无')+'</b> · 当前时期 '+esc(era?.name||'未配置')+'</p>','人工覆盖会保留设置，可在下方交还自动。未保存的勾选不会改变存档。')+
   section('📜 中立大势 · 剧情时期（'+(data.grandEras||[]).length+'条）','<div class="xsd2-gm-grid">'+input('仙盟历日期（年-月-日）','date',[s.calendarDate.year,s.calendarDate.month,s.calendarDate.day].join('-'))+input('仙盟历数值（按日期派生）','numeric',s.stat_data.仙盟历,'text','readonly')+'</div>'+(data.grandEras||[]).map(e=>'<article class="xsd2-gm-era '+(e.id===era?.id?'current':'')+'"><time>'+dateText(e.startDate)+'</time><h4>'+esc(e.name)+'</h4><p>'+esc(e.background)+'</p><button type="button" data-era-date="'+e.id+'">'+(e.id===era?.id?'✦ 当前时期':'选择该时期日期')+'</button></article>').join(''),'这里只选择待保存日期。世界时期随保存后的日期判定，不靠勾选事件替代；GM日期回拨不会恢复整份历史存档。')+
   checks(R.ALL_FIELDS.filter(k=>!forms.has(k)&&!stages.has(k)),'世界事件与人物事实')+checks([...forms],'名器成形锚点')+checks([...stages],'名器阶位锚点')+
   section('🎭 身份 / 阵营','<div class="xsd2-gm-grid"><label>身份（6选1）<select name="identity">'+R.IDENTITIES.map(x=>'<option '+(x.name===s.identity?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</select></label>'+input('阵营（随身份确定）','faction',s.stat_data.阵营||'','text','readonly')+'</div>','更换身份沿2.0中控规则处理；阵营不作为自由文本覆盖。')+
   section('✦ 境界 / 人物好感','<div class="xsd2-gm-grid">'+input('境界','realm',s.stat_data.修为||'')+metrics+'</div>','好感范围−100至100。负好感心智由中控即时覆盖；未触发永久锁定时回正恢复已完成阶段。降至−51后永久上限−50，GM也不能解除；GM好感覆盖后须交还自动才能继续自然增减。')+
   section('🌸 名器阶段与归属',relics,'阶位需连续；成形、阶位复选框与下拉项同步。四阶自动条件仍待设计，GM手设四阶为人工覆盖。')+
   section('🎒 储物栏物品','<label>每行：名称 | 数量 | 消耗品或非消耗品 | 介绍 | 效果<textarea name="items">'+esc(items)+'</textarea></label>')+
   section('📝 展示型字段（只读）','<div class="xsd2-gm-grid">'+displays.map(k=>'<label class="xsd2-gm-display">'+esc(k)+'<textarea readonly>'+esc(s.stat_data[k]||'无')+'</textarea></label>').join('')+'</div>','这些字段由2.0正文与中控维护，本面板不绕过现有写入规则。')+
   section('人工覆盖 / 交还自动',Object.entries(s.manual).map(([k,v])=>'<label class="xsd2-gm-check"><input type="checkbox" data-release="'+esc(k)+'">'+esc(k)+' = '+esc(JSON.stringify(v))+'</label>').join('')+'<button type="button" data-release-selected>交还选中字段</button> <button type="button" data-cancel>撤回待执行行动</button>')+
   '<details><summary>运行诊断 / 打印快照（只读）</summary><textarea readonly data-diagnostics></textarea><textarea readonly data-snapshot-output hidden></textarea></details><p class="xsd2-feedback" role="status"></p></main>'+
   '<footer><button type="submit">💾 保存并生效</button><button type="button" data-all="1">全部解锁</button><button type="button" data-all="0">全部回锁</button><button type="button" data-print>打印快照</button></footer></form><pre class="xsd2-gm-log" data-gm-log>已读取当前存档；修改后点击保存并生效。</pre>';
  const form=body.querySelector('form'),feedback=body.querySelector('[role=status]');
  const fail=error=>{feedback.textContent=error.message;report?.(error);};
  const stale=()=>{const now=runtime.getSnapshot();if(!now||['chatId','branchId','floor','revision'].some(k=>now[k]!==s[k]))throw Error('当前存档已变化，请点击↻重新读取；未写入旧草稿。');};
  function setStage(id,n){const c=R.RELIC_PILOT_CONFIG[id];form.elements['stage:'+id].value=n;
   form.elements['known:'+c.formKey].checked=n>0;for(let i=1;i<=4;i++)form.elements['known:'+c['stage'+i+'Key']].checked=n>=i;}
  function sync(input){for(const [id,c]of Object.entries(R.RELIC_PILOT_CONFIG)){
   if(input.name==='known:'+c.formKey)setStage(id,input.checked?Math.max(1,+form.elements['stage:'+id].value):0);
   for(let i=1;i<=4;i++)if(input.name==='known:'+c['stage'+i+'Key'])setStage(id,input.checked?i:i-1);
  }}
  form.querySelectorAll('[name^="stage:"]').forEach(input=>input.onchange=()=>setStage(input.name.slice(6),+input.value));
  form.querySelectorAll('[name^="known:"]').forEach(input=>input.onchange=()=>sync(input));
  form.querySelector('[name="identity"]').onchange=e=>form.elements.faction.value=R.IDENTITY_FACTION[e.target.value]||'无';
  body.querySelectorAll('[data-era-date]').forEach(b=>b.onclick=()=>{const e=data.grandEras.find(x=>x.id===b.dataset.eraDate);form.elements.date.value=[e.startDate.year,e.startDate.month,e.startDate.day].join('-');feedback.textContent='已选择日期，点击保存后生效。';});
  body.querySelectorAll('[data-check]').forEach(b=>b.onclick=()=>{const group=[...body.querySelectorAll('[data-known-group]')].find(x=>x.dataset.knownGroup===b.dataset.group);group.querySelectorAll('input').forEach(x=>{x.checked=b.dataset.check==='1';sync(x);});});
  body.querySelectorAll('[data-all]').forEach(b=>b.onclick=()=>{form.querySelectorAll('[name^="known:"]').forEach(x=>x.checked=b.dataset.all==='1');for(const id of Object.keys(R.RELIC_PILOT_CONFIG))setStage(id,b.dataset.all==='1'?4:0);feedback.textContent='仅修改草稿，保存后生效；世界时期仍由日期决定。';});
  body.querySelector('[data-print]').onclick=()=>{const out=body.querySelector('[data-snapshot-output]');out.hidden=false;out.value=JSON.stringify(runtime.getSnapshot(),null,2);out.parentElement.open=true;body.querySelector('[data-gm-log]').textContent='当前快照已打印到只读面板，未修改存档。';};
  if(runtime.getDiagnostics)body.querySelector('[data-diagnostics]').value=JSON.stringify(runtime.getDiagnostics(),null,2);
  form.onsubmit=async e=>{e.preventDefault();try{
   stale();const f=new doc.defaultView.FormData(form),patch={},identity=f.get('identity');if(identity!==s.identity)patch.identity=identity;
   const a=String(f.get('date')).split('-').map(Number),date={year:a[0],month:a[1],day:a[2]};if(JSON.stringify(date)!==JSON.stringify(s.calendarDate))patch.calendarDate=date;
   if(String(f.get('realm')).trim()!==s.stat_data.修为)patch.realm=String(f.get('realm')).trim();
   const items=String(f.get('items')).split('\n').filter(x=>x.trim()).map(line=>{const [name,count='1',type,description,effect]=line.split('|').map(x=>x.trim()),old=s.inventory.find(x=>x.name===name);if(type&&!['消耗品','非消耗品'].includes(type))throw Error('物品类型须填消耗品或非消耗品');return {...old,id:old?.id||name,name,count:Number(count),...(type?{consumable:type==='消耗品'}:{}),...(description!==undefined?{description}:{}),...(effect!==undefined?{effect}:{})};});
   if(JSON.stringify(items.map(describeItem))!==JSON.stringify(s.inventory.map(describeItem)))patch.inventory=items;
   for(const [name,cfg]of Object.entries(data.characterProfiles||{}))for(const key of Object.keys(cfg.metrics||{})){const value=Number(f.get('metric:'+name+':'+key));if(value!==(s.stat_data.character_metrics?.[name]?.[key]??cfg.metrics[key].default))patch['metric.'+name+'.'+key]=value;}
   for(const k of R.ALL_FIELDS){if(forms.has(k)||stages.has(k))continue;const v=f.has('known:'+k);if(v!==!!s.known[k])patch['known.'+k]=v;}
   for(const [id,c]of Object.entries(R.RELIC_PILOT_CONFIG)){const n=+f.get('stage:'+id);if(n!==R.getRelicStage(id,s.known))patch['relicStage.'+id]=n;const owner=String(f.get('owner:'+id)).trim()||null;if(owner!==(s.stat_data.名器归属[id]||null))patch['owner.'+id]=owner;}
   await runtime.dispatchIntent({type:'GM_PATCH',payload:patch});el.close();
  }catch(error){fail(error);}};
  body.querySelector('[data-cancel]').onclick=()=>{try{stale();Promise.resolve(runtime.stop()).then(()=>el.close()).catch(fail);}catch(e){fail(e);}};
  body.querySelector('[data-release-selected]').onclick=()=>{try{stale();runtime.dispatchIntent({type:'GM_RELEASE',payload:{keys:[...body.querySelectorAll('[data-release]:checked')].map(x=>x.dataset.release)}}).then(()=>el.close()).catch(fail);}catch(e){fail(e);}};
 }
 el.querySelector('[data-reload]').onclick=()=>{s=runtime.getSnapshot();if(!s){el.close();return;}s=clone(s);R=data.rules(s.stat_data);render();};render();
 return ()=>{el.close();el.remove();style.remove();};
}
module.exports={openGM};
