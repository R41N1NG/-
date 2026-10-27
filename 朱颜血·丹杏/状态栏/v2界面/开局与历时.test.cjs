'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {prepare}=require('../../零楼/开场跳转.js'),{build}=require('./build.cjs');
const card=require('../../试用卡/backend-v2-上传基线.json');
function embeddedLedger(){const script=[...build().replaceString.matchAll(/src="data:[^,]+,([^"]+)"/g)].map(m=>Buffer.from(m[1],'base64').toString()).find(code=>code.includes('function committedOpening'));assert.ok(script,'必须实际打包支持已提交零楼的唯一账本');const window={};vm.runInNewContext(script,{window});return window.ZYXMartialLedger;}
test('四身份真实开场切换产物可读姓名身份自设武学；原开场默认回报不盖卷宗',()=>{
 const ledger=embeddedLedger();for(const role of ['锦衣缇骑','黑狱恶差','江湖任侠','身世自设']){
  const record={'姓名':'测试主角甲','身位':role,'年龄':25,'武功境界':'冲脉','掌握武学':['自设剑法']};const patch=prepare({greetings:card.data.alternate_greetings,gateway:card.data.first_mes,identityRules:['一','二','三','四']},record,{name1:'测试主角甲'},{mes:card.data.first_mes});
  const zero={mes:patch.swipes[patch.swipe_id],extra:patch.swipes_info[patch.swipe_id],swipes:patch.swipes,swipe_id:patch.swipe_id};
  const value=ledger.fromChat([zero],{cutoff:0});assert.equal(value.playerName,'测试主角甲');assert.equal(value.identity,role);assert.equal(value.realm,'冲脉');assert.deepEqual(Array.from(value.skills),['自设剑法']);
  const other=structuredClone(zero);other.extra.zyx_opening.record['姓名']='不一致的元数据';assert.notEqual(ledger.fromChat([other],{cutoff:0}).playerName,'不一致的元数据');
 }
});
test('历时记录逐楼保留自身耗时，cutoff不读未来且不复制末楼耗时',()=>{
 const ledger=require('../玩家武学回放.js'),records=require('./状态回放.js');const m=elapsed=>({mes:'剧情。<status_bar><time>宣德五年四月初一 酉时</time><elapsed>'+elapsed+'</elapsed></status_bar>'});const chat=[m('初至'),m('半刻钟'),m('一个时辰'),m('两日')];
 assert.deepEqual(records.fromChat(chat,{cutoff:2}).history.map(x=>x.elapsed),['初至','半刻钟','一个时辰']);assert.deepEqual(records.fromChat(chat,{cutoff:3}).history.map(x=>x.elapsed),['初至','半刻钟','一个时辰','两日']);assert.ok(ledger.committedOpening);
});
