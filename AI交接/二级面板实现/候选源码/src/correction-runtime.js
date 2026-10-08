/* gpt · 二级纠错共用运行时；由构建器前置注入三个卡内脚本。无外链，无资源更改。 */
(function (host, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory; return; }
  var root = host;
  try { if (host.parent && host.parent.document) root = host.parent; } catch (_) {}
  if (!root.__xsdCorrection || root.__xsdCorrection.version !== '1.0.0') root.__xsdCorrection = factory(root);
  host.__xsdCorrection = root.__xsdCorrection;
})(typeof window === 'undefined' ? globalThis : window, function (root) {
  'use strict';
  const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  const own = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);
  const bad = new Set(['__proto__', 'constructor', 'prototype']);
  function safe(o) {
    if (!o || typeof o !== 'object') return;
    for (const k of Object.keys(o)) { if (bad.has(k)) throw Error('非法键'); safe(o[k]); }
  }
  function merge(a, b) {
    safe(b);
    const out = a && typeof a === 'object' && !Array.isArray(a) ? clone(a) : {};
    for (const k of Object.keys(b || {})) out[k] = b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) ? merge(out[k], b[k]) : clone(b[k]);
    return out;
  }
  function at(o, p) { return p.reduce((v, k) => v == null ? undefined : v[k], o); }
  function put(o, p, v) {
    if (p.some(k => bad.has(k))) throw Error('非法路径');
    let t = o; for (const k of p.slice(0, -1)) { if (!t[k] || typeof t[k] !== 'object') t[k] = {}; t = t[k]; }
    t[p[p.length - 1]] = clone(v);
  }
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  function leaves(o, prefix = []) {
    return Object.keys(o || {}).flatMap(k => o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) && Object.keys(o[k]).length && !(prefix.length===2 && prefix[0]==='人工纠错' && ['覆盖','纹章显示'].includes(prefix[1])) && !(prefix.length===1 && ['派生账本','名器归属来源','人工校历'].includes(prefix[0])) ? leaves(o[k], prefix.concat(k)) : [{ path: prefix.concat(k), value: clone(o[k]) }]);
  }
  const cn = ['一', '二', '三', '四'];
  // 显示名、成形键、阶段前缀分别登记，不用显示名猜生产字段。
  const relics = [
    ['jiuyouxuanyinxue','九幽玄阴穴','九幽玄阴穴成形','九幽玄阴穴',4],
    ['zhuojiuliuyanxue','灼酒流炎穴','灼酒流炎穴成形','灼酒流炎穴',4],
    ['xinmochayingru','心魔茶璎乳','心魔茶璎乳成形','心魔茶璎乳',4],
    ['boruoputiju','般若菩提菊','般若菩提菊成形','般若菩提菊',4],
    ['meiruixue','梅蕊穴','梅蕊穴成形','梅蕊穴',4],
    ['bingpojianxinxue','冰魄剑心穴','冰魄剑心穴成形','冰魄剑心穴',4],
    ['qinggexianmingxue','清歌弦鸣穴','清歌弦鸣穴成形','清歌弦鸣穴',4],
    ['liuyandiexinxue','流焰叠薪穴','流焰叠薪穴成形','流焰叠薪穴',4],
    ['fenghuangyuhua','凤凰羽花','凤凰羽花成形','凤凰羽花',4],
    ['beimingchaoshengxue','北冥潮生穴','北冥潮生穴成形','北冥潮生穴',3],
    ['yuhuxiangru','玉虎噙香乳','玉虎噙香乳成形','玉虎噙香乳',3],
    ['lingxitongxin','灵犀同心','灵犀同心成形','灵犀同心穴',3],
    ['yanxialingru','烟霞灵乳',null,'烟霞灵乳',3],
  ].map(([id,name,form,prefix,max]) => ({ id,name,form,prefix,max,stages:cn.map(n => prefix+n+'阶段') }));
  const plotFields = ['极乐引入手','进入幽寂谷','离开幽寂谷','南域大劫','天姝会存在','已抵达天溪','受征召南下','天溪城兽潮','兽潮血战','双姝回归','天溪城破','血染天溪'];
  const dateFacts = { 南域大劫:1578.08, 天姝会存在:1578.08, 天溪城兽潮:1579.01, 兽潮血战:1579.01, 天溪城破:1579.03, 血染天溪:1579.03 };
  let epoch = 0, serial = 0;
  const prerequisites = {};
  const queues = new Map();
  function context(api) {
    if (typeof api.context === 'function') return api.context();
    for (const w of [root, root.parent, root.top]) {
      try { if (w && w.SillyTavern && w.SillyTavern.getContext) return w.SillyTavern.getContext(); } catch (_) {}
    }
    throw Error('无法定位当前聊天');
  }
  function capture(api) {
    const c = context(api), id = c.chatId ?? c.chat_id;
    if (id === undefined || id === null || id === '' || !Array.isArray(c.chat) || !c.chat.length) throw Error('请先打开有消息的聊天');
    return { chatId:String(id), messageId:c.chat.length-1, epoch };
  }
  function guard(api, token) { const n=capture(api); if (!eq(n, token)) throw Error('聊天或最新楼已变化，请重新预览'); }
  function enqueue(api, token, task) {
    const key=token.chatId, prev=queues.get(key)||Promise.resolve();
    const next=prev.catch(()=>{}).then(()=>{guard(api,token);return task();});
    queues.set(key,next);
    next.finally(()=>{if(queues.get(key)===next)queues.delete(key);}).catch(()=>{});
    return next;
  }
  function checked(v) { if (v === false) throw Error('宿主接口返回失败'); return v; }
  async function layer(api,opt) {
    const v=await api.getVariables(opt); if (v === null || v === undefined) return {}; if (typeof v !== 'object' || Array.isArray(v)) throw Error('变量读取失败'); return clone(v);
  }
  function options(token) { return [{type:'chat'}, {type:'message',message_id:token.messageId}]; }
  async function snapshot(api,token) {
    guard(api,token);
    const [c,m]=await Promise.all(options(token).map(o=>layer(api,o)));
    guard(api,token);
    const sd=merge(c.stat_data||{},m.stat_data||{});
    // 人工覆盖以聊天层为准，消息层旧副本不允许复活已解除的覆盖。
    sd.人工纠错 = c.stat_data?.人工纠错?.chatId===token.chatId ? clone(c.stat_data.人工纠错) : null;
    return {sd,layers:[c,m]};
  }
  function controls(sd, chatId) {
    const m=sd && sd.人工纠错;
    return m && (!chatId || m.chatId===chatId) ? (m.覆盖||{}) : {};
  }
  function protect(sd,patch,chatId) {
    const out=clone(patch||{});
    delete out.人工纠错; // 只有人工事务修改覆盖表。
    for (const record of Object.values(controls(sd,chatId))) if (record && record.path && own(record,'value')) {
      put(out,record.path,record.value);
      if (record.path[0]==='名器归属') put(out,['名器归属来源',record.path[1]],{来源:'人工（二级面板）',由脚本写:false});
    }
    return out;
  }
  function effective(sd) { return merge(sd,protect(sd,{},sd?.人工纠错?.chatId)); }
  function visual(sd,id,state) {
    const mode=sd?.人工纠错?.纹章显示?.[id]?.颜色;
    return state==='none' ? state : mode==='original' ? 'self' : mode==='inverted' ? 'other' : state;
  }
  async function setLayer(api,opt,payload,token) {
    guard(api,token);
    if (typeof api.insertOrAssignVariables !== 'function') throw Error('需要深合并写入接口；不使用整层replace覆盖其他更新');
    checked(await api.insertOrAssignVariables(payload,opt)); guard(api,token);
  }
  // 两层都回读才成功；失败只补偿这笔仍等于写后值的键，不覆盖之后的改动。
  async function commit(api,token,patch,base) {
    safe(patch);
    const changes=leaves(patch), done=[];
    try {
      for (const [i,opt] of options(token).entries()) {
        done.push(i); // 接口可能部分落盘后抛错，亦纳入补偿。
        await setLayer(api,opt,{stat_data:patch},token);
        const after=await layer(api,opt); guard(api,token);
        if(changes.some(c=>!eq(at(after.stat_data||{},c.path),c.value)))throw Error('双层回读不一致');
      }
    } catch(error) {
      let restored=true;
      for(const i of done.reverse()) {
        try {
          guard(api,token);
          const opt=options(token)[i],now=await layer(api,opt),rollback={};
          for(const c of changes)if(eq(at(now.stat_data||{},c.path),c.value))put(rollback,c.path,at(base.layers[i].stat_data||{},c.path)??null);
          if(Object.keys(rollback).length)await setLayer(api,opt,{stat_data:rollback},token);
          const verify=await layer(api,opt);
          if(leaves(rollback).some(c=>!eq(at(verify.stat_data||{},c.path),c.value)))restored=false;
        }catch(_){restored=false;}
      }
      throw Error(error.message+(restored?'；本笔已补偿':'；部分写入未能补偿，请回读当前局'));
    }
    if(typeof api.refresh==='function')api.refresh();
  }
  function violations(sd) {
    const date=Number(sd.仙盟历),k=sd.known||{};
    return Object.entries(dateFacts).filter(([f,min])=>k[f]===true&&(!Number.isFinite(date)||date<min)).map(([f])=>f);
  }
  function checkFacts(sd, previous = {}) {
    const old=violations(previous),bad=violations(sd);
    const newlyBad=bad.find(f=>!old.includes(f));
    if(newlyBad || (bad.length && Number(sd.仙盟历)<Number(previous.仙盟历)))throw Error((newlyBad||bad[0])+'与当前日期矛盾，请先纠正事实');
    return bad;
  }
  function datePatch(sd,date,token,tx) {
    const m=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(date||'');
    if(!m)throw Error('日期用年-月-日填写');
    const y=+m[1],mo=+m[2],d=+m[3]; if(y<1000||mo<1||mo>12||d<1||d>30)throw Error('日期范围错误（每月30日）');
    const acc=Number(sd.历时累计??0);if(!Number.isFinite(acc)||acc<0)throw Error('累计台账异常，请先核对原局');
    const absolute=y*12+mo-1+(d-1)/30;
    // 保留历史累计，平移基准；同楼重绘由nextAcc校历守卫阻止重新累计。
    return {仙盟历:Math.round((y+mo/100+(d-1)/30*0.005)*10000)/10000,仙盟历文:y+'年'+mo+'月'+d+'日',
      历基准:absolute-acc,历时累计:acc,本楼历时加速:0,历时待确认:null,人工校历:{楼:token.messageId,事务id:tx}};
  }
  function plan(sd,intent,token) {
    safe(intent);
    if (!Object.keys(intent).some(k=>k!=='relic')) throw Error('请选择一项纠错');
    const tx='gpt-correction-'+Date.now()+'-'+(++serial),patch={}, released=[];
    const meta=clone(sd.人工纠错)||{chatId:token.chatId,覆盖:{},纹章显示:{}};
    meta.chatId=token.chatId;meta.覆盖=meta.覆盖||{};meta.纹章显示=meta.纹章显示||{};
    function change(p,value) {
      const key=JSON.stringify(p); put(patch,p,value);
      meta.覆盖[key]={path:p,value:clone(value),事务id:tx};
      if(p[0]==='known') {
        const prior=sd.派生账本?.[p[1]]?.来源||[];
        put(patch,['派生账本',p[1]],{来源:prior.filter(s=>s.类型!=='人工').concat({类型:'人工',键:'纠错:'+p[1],事务id:tx,楼:token.messageId})});
      }
    }
    function release(p) {
      const key=JSON.stringify(p),old=meta.覆盖[key];
      if(old) { meta.覆盖[key]=null; released.push(p); }
    }
    if(intent.relic) {
      const r=relics.find(r=>r.id===intent.relic);if(!r)throw Error('未知纹章');
      if(own(intent,'lit')) {
        // 烟霞没有成形键：使用全部阶段的人工否定实现熄灭，不新增虚假的成形字段。
        if(intent.lit==='auto'){if(r.form)release(['known',r.form]);else r.stages.forEach(f=>release(['known',f]));}
        else if(typeof intent.lit==='boolean') {
          if(r.form)change(['known',r.form],intent.lit);
          else if(!intent.lit)r.stages.forEach(f=>change(['known',f],false));
          else throw Error('烟霞请通过已有阶段点亮');
        }else throw Error('亮灭值无效');
      }
      if(own(intent,'stage')) {
        if(intent.stage==='auto')r.stages.forEach(f=>release(['known',f]));
        else { const n=intent.stage;if(!Number.isInteger(n)||n<0||n>r.max)throw Error('该阶段未提供内容');r.stages.forEach((f,i)=>change(['known',f],i<n)); }
      }
      if(own(intent,'owner')) {
        if(intent.owner==='__auto__')release(['名器归属',r.name]);
        else {
          const owner=intent.owner===null?null:String(intent.owner).trim();
          if(owner!==null&&(!owner||owner.length>40||/[<>\n\r]/.test(owner)))throw Error('归属名称无效');
          change(['名器归属',r.name],owner);
          put(patch,['名器归属来源',r.name],{归属者:owner,来源:'人工（二级面板）',由脚本写:false,楼:token.messageId});
        }
      }
      if(own(intent,'color')) {
        if(!['auto','original','inverted'].includes(intent.color))throw Error('显示模式无效');
        meta.纹章显示[r.id]=intent.color==='auto'?null:{颜色:intent.color};
      }
    }
    if(own(intent,'personalStage')) {
      if(intent.personalStage==='auto')release(['段位']);
      else {if(!Number.isInteger(intent.personalStage)||intent.personalStage<1||intent.personalStage>16)throw Error('个人段位为1–16');change(['段位'],intent.personalStage);}
    }
    for(const [f,value]of Object.entries(intent.plot||{})) {
      if(!plotFields.includes(f))throw Error('主线事实不在白名单');
      if(value==='auto')release(['known',f]);else if(typeof value==='boolean')change(['known',f],value);else throw Error('主线事实值无效');
    }
    if(intent.date)Object.assign(patch,datePatch(sd,intent.date,token,tx));
    // 交还自动必须解除旧人工贡献，不将旧人工true当独立事实永久保留。
    for(const p of released) {
      if(p[0]==='known') {
        const autoSources=(sd.派生账本?.[p[1]]?.来源||[]).filter(s=>s.类型!=='人工');
        const test=merge(sd,patch),k=test.known||{};
        const sources=autoSources.filter(source=>source.类型==='出场实证' ||
          (source.类型==='前置齐备' && (prerequisites[p[1]]||[]).length>0 && prerequisites[p[1]].every(f=>k[f]===true)) ||
          (source.类型==='依赖' && source.键==='烟霞灵乳二阶段成立' && k['烟霞灵乳二阶段']===true));
        const prerequisiteMatch=(prerequisites[p[1]]||[]).length>0 && prerequisites[p[1]].every(f=>k[f]===true);
        if(prerequisiteMatch && !sources.length)sources.push({类型:'前置齐备',键:'交还自动前置核验',事务id:tx});
        put(patch,p,sources.length>0);
        put(patch,['派生账本',p[1]],sources.length?{来源:sources}:null);
      } else if(p[0]==='名器归属') {put(patch,p,null);put(patch,['名器归属来源',p[1]],null);}
    }
    patch.人工纠错=meta;
    const warnings=checkFacts(merge(sd,patch),sd);
    return {patch,tx,released,warnings};
  }
  async function preview(api,intent) {
    const token=capture(api),base=await snapshot(api,token),p=plan(base.sd,intent,token);
    const changes=leaves(p.patch).filter(c=>!eq(at(base.sd,c.path),c.value)).map(c=>({path:c.path,before:clone(at(base.sd,c.path)),after:c.value}));
    return {...p,token,base,changes};
  }
  function watched(sd) {return {身份:sd.身份,仙盟历:sd.仙盟历,历基准:sd.历基准,历时累计:sd.历时累计,known:sd.known,名器归属:sd.名器归属,人工纠错:sd.人工纠错,派生账本:sd.派生账本};}
  async function save(api,p) {
    return enqueue(api,p.token,async()=>{
      const now=await snapshot(api,p.token);
      if(!eq(watched(now.sd),watched(p.base.sd)))throw Error('状态已改变，请重新预览');
      await commit(api,p.token,p.patch,now);
      const transaction={id:p.tx,token:p.token,changes:p.changes,time:Date.now()};
      const log=now.layers[0].xsd_correction_meta?.chatId===p.token.chatId?now.layers[0].xsd_correction_meta.log||[]:[];
      try {await setLayer(api,{type:'chat'},{xsd_correction_meta:{chatId:p.token.chatId,log:log.concat(transaction).slice(-20)}},p.token);}
      catch(e){throw Error('事实已生效，但操作日志未保存；请回读，暂不能撤销：'+e.message);}
      return {ok:true,id:p.tx};
    });
  }
  async function undo(api) {
    const token=capture(api);
    return enqueue(api,token,async()=>{
      const now=await snapshot(api,token),meta=now.layers[0].xsd_correction_meta;
      if(meta?.chatId!==token.chatId||!meta.log?.length)throw Error('当前局没有可撤销操作');
      const last=meta.log[meta.log.length-1];
      if(last.token.messageId!==token.messageId)throw Error('最新楼已改变，不能盲回滚');
      if(last.changes.some(c=>!eq(at(now.sd,c.path),c.after)))throw Error('相关键已有后续修改，请重新纠错');
      const patch={};for(const c of last.changes)put(patch,c.path,c.before??null);
      await commit(api,token,patch,now);
      await setLayer(api,{type:'chat'},{xsd_correction_meta:{chatId:token.chatId,log:meta.log.slice(0,-1)}},token);
      return {ok:true};
    });
  }
  async function write(api,patch,manual) {
    const token=capture(api);
    return enqueue(api,token,async()=>{
      const base=await snapshot(api,token);let next;
      if(manual) {
        next=clone(patch||{});safe(next);
        const meta=clone(base.sd.人工纠错)||{chatId:token.chatId,覆盖:{},纹章显示:{}};
        meta.chatId=token.chatId;meta.覆盖=meta.覆盖||{};
        const fields=new Set(relics.flatMap(r=>(r.form?[r.form]:[]).concat(r.stages)).concat(plotFields));
        for(const c of leaves(next))if(!eq(at(base.sd,c.path),c.value)&&((c.path[0]==='known'&&fields.has(c.path[1]))||c.path[0]==='名器归属'||c.path[0]==='段位'))meta.覆盖[JSON.stringify(c.path)]={path:c.path,value:c.value,事务id:'legacy-'+(++serial)};
        next.人工纠错=meta;checkFacts(merge(base.sd,next),base.sd);
      }else next=protect(base.sd,patch,token.chatId);
      await commit(api,token,next,base);
      return {ok:true,via:'统一队列·双层回读'};
    }).catch(e=>({ok:false,why:e.message,via:e.message}));
  }
  return {version:'1.0.0',relics,plotFields,prerequisites,merge,clone,at,put,effective,protect,visual,controls,capture,snapshot,preview,save,undo,write,
    onChatChanged(){epoch++; if(root.document)root.document.getElementById('xsd-correction-dialog')?.remove();},
    // 由GM注册实际入口；同一宿主只存在一份运行时和队列。
    root};
});
