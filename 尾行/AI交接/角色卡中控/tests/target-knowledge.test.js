"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {createGame}=require("../src/runtime/game"),{defaultInit}=require("../src/host/initial-state");
const {unlockTargetAttribute,knownAttributes,validateKnowledge}=require("../src/runtime/target-knowledge");
const scan=(g)=>g.settleInput("",{actions:[{id:"scan",name:"打量",args:{}}]}).actions[0];
test("打量天然20额外揭示一项基础属性，普通成功不揭示，保存重读不丢失",()=>{
 const g=createGame({...defaultInit(),sessionSalt:"tutorial-crit-95"});
 assert.deepEqual(g.snapshot().profile.attrs,{});const action=scan(g);
 assert.equal(action.d20,20);assert.equal(action.band,"nat20");assert.deepEqual(action.attributeUnlock,{key:"per",name:"敏锐",value:4});
 assert.deepEqual(g.snapshot().profile.attrs,{per:4});
 const saved=g.save(),loaded=createGame({saved});assert.deepEqual(loaded.snapshot().profile.attrs,{per:4});assert.deepEqual(loaded.save().targetKnowledge,saved.targetKnowledge);
 const normal=createGame({...defaultInit(),sessionSalt:"tutorial-3"});assert.equal(scan(normal).band,"success");assert.deepEqual(normal.snapshot().profile.attrs,{});
});
test("属性解锁去重与白名单，旧档默认未知，不跨目标继承或泄露其他值",()=>{
 const g={targetId:"college",targetBase:{per:4,agi:5,str:3,nrv:4,social:2}};
 for(let i=0;i<4;i++){const reward=unlockTargetAttribute(g);assert.ok(reward);assert.equal(Object.keys(knownAttributes(g)).length,i+1);}
 assert.equal(unlockTargetAttribute(g),null);assert.deepEqual(knownAttributes({...g,targetId:"ol"}),{});
 assert.deepEqual(validateKnowledge({targetId:"college",known:["per","per","social","address"]},"college"),{targetId:"college",known:["per"]});
 const saved=createGame(defaultInit()).save();delete saved.targetKnowledge;assert.deepEqual(createGame({saved}).snapshot().profile.attrs,{});
});
test("跟丢、远端、未知节点不能借天然20获取目标属性",()=>{
 const far=createGame({...defaultInit(),dist:"far",sessionSalt:"tutorial-crit-95"});assert.equal(scan(far).d20,20);assert.deepEqual(far.snapshot().profile.attrs,{});
 const init=defaultInit();init.route.known=init.route.nodes.map(()=>0);const unknown=createGame({...init,sessionSalt:"tutorial-crit-95"});scan(unknown);assert.deepEqual(unknown.snapshot().profile.attrs,{});
 const saved=createGame({...defaultInit(),sessionSalt:"tutorial-crit-95"}).save();saved.spatial.tracking="lost";const lost=createGame({saved});
 assert.equal(scan(lost).rejected,true);assert.deepEqual(lost.snapshot().profile.attrs,{});
});
