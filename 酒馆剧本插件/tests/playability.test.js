'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),A=require('../src/api'),C=require('../src/core'),R=require('../src/companion'),{Engine,defaults}=require('../src/engine'),{fixture}=require('./helpers');
const original='我拿到了访客凭证。管理员接受凭证，交给我门卡。我带卡离开门厅。';
const raw=()=>({title:'门厅',collections:[{id:'pass',title:'访客凭证',evidence:'我拿到了访客凭证。'},{id:'card',title:'门卡',evidence:'管理员接受凭证，交给我门卡。'}],nodes:[{id:'n1',title:'门厅',detail:original,guidance:'与管理员交涉',completion_criteria:'取得门卡',completion_evidence:'管理员接受凭证，交给我门卡。',completion_action:{label:'离开门厅',action_text:'我带卡离开门厅',intent:'实际离开门厅'},result_ids:['card'],routes:[]}],events:[{id:'get_pass',title:'领取凭证',description:'实际取得凭证',completion_criteria:'取得访客凭证',evidence:'我拿到了访客凭证。',scope:{kind:'nodes',node_ids:['n1']},result_ids:['pass']}]});
const profile={...defaults().profile,base_url:'https://mock.test',model:'extract',auto_partition:false,author_review:true};
function client(handler){const sent=[];const api=new A.Client(async(url,opt)=>{const body=JSON.parse(opt.body),input=JSON.parse(body.messages[1].content);sent.push({body,input});return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(await handler(input,body))}}]})};});return {api,sent};}
test('可游玩性独立提示词/请求/模型与调用预估，四步完成且事实事件不绑阶段奖励',async()=>{
  const f=client(input=>input.operation?.startsWith('review')?{complete:true,issues:[]}:raw()),phases=[];
  const d=await f.api.analyze({...profile,review_model:'auditor',playability_prompt:'独立游戏逻辑审查'},original,'',{onProgress:p=>phases.push(p)});
  assert.equal(f.sent.length,4);assert.equal(f.sent[2].input.operation,'review_playability');assert.equal(f.sent[2].body.messages[0].content,'独立游戏逻辑审查');assert.equal(f.sent[2].body.model,'auditor');assert.equal(d.request_count,4);assert.equal(d.estimated_request_count,4);assert.equal(d.author_review.protocol,'playability-v1');
  assert.deepEqual(d.project.nodes[0].effects,[{collect:'card'}]);assert.deepEqual(d.project.events.find(e=>e.id==='get_pass').effects,[{collect:'pass'}]);assert(phases.some(p=>p.phase.includes('可游玩')));
});
test('可游玩性发现强制事故/边界错误后仅本分段重提取并重新双重复核',async()=>{
  let reviews=0;const f=client(input=>input.operation==='review_playability'?{complete:true,issues:++reviews===1?[{severity:'error',path:'nodes.0.completion_criteria',message:'不要把丢卡事故当完成目标',quotes:['我带卡离开门厅。']}]:[]}:input.operation?.startsWith('review')?{complete:true,issues:[]}:raw());
  const d=await f.api.analyze(profile,original);assert.equal(f.sent.length,7);assert.equal(d.extra_request_count,3);assert(f.sent[3].input.previous_draft);assert.match(f.sent[3].input.repair_issues[0].message,/丢卡/);assert.equal(d.review_blocked,false);
});
test('持续可游玩性错误最多两次修补，不把失败草稿当可执行完成',async()=>{
  const f=client(input=>input.operation==='review_playability'?{complete:true,issues:[{severity:'error',path:'nodes.0',message:'凭证漏记',quotes:['我拿到了访客凭证。']}]}:input.operation?.startsWith('review')?{complete:true,issues:[]}:raw());
  await assert.rejects(f.api.analyze(profile,original),/分段复核仍有错误/);assert.equal(f.sent.filter(x=>x.input.previous_draft).length,2);assert.equal(f.sent.filter(x=>x.input.operation==='review_playability').length,3);
});
test('旧草稿需本版可游玩性+转化复核，错误阻止替换且不改变原条件',async()=>{
  const f=client(input=>input.operation==='review_playability'?{complete:true,issues:[{severity:'error',path:'collections',message:'核对遗漏凭证',quotes:['我拿到了访客凭证。']}]}:{complete:true,issues:[]}),fx=fixture(),e=new Engine(fx.host,f.api);await e.init();await e.updateSettings({profile});e.analysisDraft=f.api.restoreAnalysis(original,raw());e.analysisDraft.author_review={complete:true,issues:[],project_signature:JSON.stringify(e.analysisDraft.project)};
  const before=e.project.id,copy=JSON.stringify(e.analysisDraft.project);await assert.rejects(e.applyAnalysis(),/复核有待处理错误/);assert.equal(e.project.id,before);assert.equal(JSON.stringify(e.analysisDraft.project),copy);assert.deepEqual(f.sent.map(x=>x.input.operation),['review_playability','review_script']);e.destroy();
});
test('本地检查缺自然按钮/技术性名称/无出口，只报告不猜补或放宽条件',()=>{
  const p=C.normalizeProject({id:'p',title:'p',nodes:[{id:'a',title:'阳台',guidance:'阳台',completion_criteria:'离开阳台',effects:[],routes:[{target:'b',condition:false}]},{id:'b',title:'门厅',guidance:'门厅',completion_action:{label:'确认完成'},effects:[],routes:[]}],collections:[],variables:[],events:[]});
  const before=JSON.stringify(p),issues=A.playabilityAudit(p);assert(issues.some(i=>i.path.includes('a.completion_action')));assert(issues.some(i=>i.message.includes('技术性')));assert(issues.some(i=>i.path.includes('b.routes')));assert.equal(JSON.stringify(p),before);assert(issues.every(i=>i.severity==='warning'));
});
test('旧默认分析/复核/短报告精确迁移，自定义字段不改',async()=>{
  const fx=fixture();fx.storage.script.branch_story_settings.profile={...profile,analysis_prompt:A.V152_PROMPTS.analysis,review_prompt:A.V152_PROMPTS.review,review_script_prompt:'自定义转化复核'};fx.storage.script.branch_story_settings.companion_prompt=R.V152_PROMPT;const e=new Engine(fx.host);await e.init();assert.equal(e.settings.profile.analysis_prompt,A.PROMPTS.analysis);assert.equal(e.settings.profile.review_prompt,A.PROMPTS.review);assert.equal(e.settings.profile.review_script_prompt,'自定义转化复核');assert.equal(e.settings.companion_prompt,R.PROMPT);assert.match(e.settings.profile.playability_prompt,/可游玩性/);e.destroy();
});
