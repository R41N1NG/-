'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../src/core'),{Engine}=require('../src/engine'),{fixture,deferred}=require('./helpers');
async function setup(){const f=fixture(),e=new Engine(f.host);await e.init();return {...f,e};}
test('旧草稿迁入剧本库，旧当前剧本与工作草稿不丢失',async()=>{
 const f=fixture(),p=C.demoProject();p.id='second';p.title='第二个剧本';f.storage.script.branch_story_settings.drafts={second:p};f.storage.script.branch_story_settings.analysis_draft={project:C.demoProject(),warnings:[]};const e=new Engine(f.host);await e.init();assert.equal(e.projectList().length,2);assert(e.analysisDraft);await e.switchProject('second');assert.equal(e.project.title,'第二个剧本');assert.equal(e.analysisDraft,null);
});
test('A/B切换保存独立内容、数值进度、分析/整理草稿与原始回复，刷新仍能恢复',async()=>{
 const {e,host,storage}=await setup(),a=e.project.id;e.analysisDraft={project:C.demoProject(),warnings:['A']};e.segmentDraft={project:C.demoProject(),warnings:['A']};e.rawAnalysis={original:'A原文',replies:[]};e.state.variables.trust=12;e.save();
 await e.createProject('B');const b=e.project.id;assert.equal(e.settings.enabled,false);assert.equal(e.analysisDraft,null);assert.equal(e.rawAnalysis,null);e.rawAnalysis={original:'B原文',replies:[]};e.saveSettings();
 await e.switchProject(a);assert.equal(e.state.variables.trust,12);assert.equal(e.analysisDraft.warnings[0],'A');assert.equal(e.segmentDraft.warnings[0],'A');assert.equal(e.rawAnalysis.original,'A原文');assert.equal(e.settings.project_workspaces[a],undefined);
 e.destroy();const fresh=new Engine(host);await fresh.init();await fresh.switchProject(b);assert.equal(fresh.project.title,'B');assert.equal(fresh.rawAnalysis.original,'B原文');assert.equal(fresh.analysisDraft,null);assert(storage.script.branch_story_settings.drafts[a]);
});
test('复制内容与规则但使用新剧本身份，进度、奖励与原始回复从零开始',async()=>{
 const {e}=await setup(),id=e.project.id;e.state.variables.trust=30;e.state.collected_ids=['A'];e.save();e.rawAnalysis={original:'旧数据'};await e.copyProject(id);assert.notEqual(e.project.id,id);assert.equal(e.state.variables.trust,0);assert.deepEqual(e.state.collected_ids,[]);assert.equal(e.rawAnalysis,null);assert(e.project.title.endsWith('（副本）'));await e.switchProject(id);assert.equal(e.state.variables.trust,30);
});
test('同一世界书的多个剧本独立入库、读取及编辑，不改相邻项目和普通条目',async()=>{
 const {e,books}=await setup();await e.saveBook('既有世界书');const a=e.project.id;await e.createProject('第二剧本');const b=e.project.id;await e.saveBook('既有世界书');assert.equal(e.projectList().find(p=>p.id===a).worldbook,'既有世界书');await e.switchProject(a);assert.equal(e.settings.worldbook,'既有世界书');await e.editProject(p=>p.title='改名A');await e.switchProject(b);assert.equal(e.project.title,'第二剧本');assert(books.get('既有世界书').some(v=>v.content==='原有内容'));
 const f=fixture();f.books.set('既有世界书',books.get('既有世界书'));const other=new Engine(f.host);await other.init();assert.equal(await other.discoverBook('既有世界书'),2);await other.switchProject(a);assert.equal(other.project.title,'改名A');
});
test('世界书读取失败或并发变更不覆盖当前剧本',async()=>{
 const {e,books,root}=await setup();await e.saveBook('既有世界书');const a=e.project.id;await e.createProject('B');const b=e.project.id;books.delete('既有世界书');await assert.rejects(e.switchProject(a));assert.equal(e.project.id,b);
 const wait=deferred();root.getWorldbook=()=>wait.promise;const request=e.switchProject(a);await e.updateSettings({depth:1});wait.resolve([]);await assert.rejects(request);assert.equal(e.project.id,b);
});
test('活动辅助任务禁止库切换、新建和移除，不污染原稿；移出需由UI确认且只移除本地库',async()=>{
 const {e,storage}=await setup(),a=e.project.id;await e.createProject('B');const b=e.project.id;e.busy=1;await assert.rejects(e.switchProject(a),/辅助任务/);await assert.rejects(e.createProject('C'),/辅助任务/);assert.throws(()=>e.removeProject(a),/辅助任务/);e.busy=0;assert.throws(()=>e.removeProject(b),/其他剧本/);e.removeProject(a);assert(!e.settings.drafts[a]);assert(!e.projectList().some(p=>p.id===a));assert(storage.chats.chat1.branch_story_engine.projects[a]);
});
test('项目切换自动关闭注入，聊天进度分别保存，陌生库ID拒绝',async()=>{
 const {e,root}=await setup();await e.updateSettings({enabled:true});assert(root.injection.length);const a=e.project.id;await e.createProject('B');assert.deepEqual(root.injection,[]);const b=e.project.id;await assert.rejects(e.switchProject('unknown'),/库中/);assert.equal(e.project.id,b);root.chat='chat2';e.bindChat();await e.switchProject(a);assert.equal(e.state.variables.trust,0);root.chat='chat1';e.bindChat();assert.equal(e.project.id,a);e.destroy();const newer=new Engine(e.host);await newer.init();await newer.updateSettings({enabled:true});assert(root.injection.length);e.destroy();assert(root.injection.length);
});
