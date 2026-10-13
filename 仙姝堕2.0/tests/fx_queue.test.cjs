'use strict';
// 动效队列中枢：顺序排队、减弱动态跳过、结算遮罩活跃避让
const { test } = require('node:test'), assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { createFxQueue } = require('../src/ui/fx_queue');

function makeDom(reduced = false) {
  const d = new JSDOM('<html><head></head><body><main></main></body></html>');
  d.window.matchMedia = (q) => ({ matches: reduced && /reduce/.test(q), media: q });
  return d;
}

test('fx_queue 顺序排队，done 后才播下一个', async () => {
  const d = makeDom(), q = createFxQueue(d.window.document);
  const ran = [];
  q.enqueue('a', (done) => { ran.push('a'); setTimeout(done, 20); });
  q.enqueue('b', (done) => { ran.push('b'); done(); });
  assert.equal(ran.join(''), 'a', 'b 在 a 结束前不播');
  await new Promise(r => setTimeout(r, 80));
  assert.equal(ran.join(''), 'ab');
  assert.equal(q.pending, 0);
});

test('fx_queue 减弱动态跳过播放直接 skip', async () => {
  const q = createFxQueue(makeDom(true).window.document);
  let played = 0, skipped = 0;
  q.enqueue('a', () => { played++; }, { skip: () => { skipped++; } });
  await new Promise(r => setTimeout(r, 30));
  assert.equal(played, 0); assert.equal(skipped, 1);
});

test('fx_queue 结算遮罩活跃时避让，遮撤后续播', async () => {
  const d = makeDom(), doc = d.window.document;
  doc.body.innerHTML = '<div class="xsd2-tj-on"></div>';
  const q = createFxQueue(doc, { retryMs: 10 });
  const ran = [];
  q.enqueue('a', (done) => { ran.push('a'); done(); });
  await new Promise(r => setTimeout(r, 40));
  assert.equal(ran.join(''), '', '遮罩活跃不播');
  doc.querySelector('.xsd2-tj-on').remove();
  await new Promise(r => setTimeout(r, 60));
  assert.equal(ran.join(''), 'a', '遮撤后续播');
});

test('fx_queue clear 停止活跃播放并清队', async () => {
  const d = makeDom(), q = createFxQueue(d.window.document);
  let stopped = false, secondPlayed = false;
  q.enqueue('a', (done) => ({ stop: () => { stopped = true; done(); } }));
  q.enqueue('b', (done) => { secondPlayed = true; done(); });
  q.clear();
  await new Promise(r => setTimeout(r, 20));
  assert.equal(stopped, true, '活跃播放收到 stop');
  assert.equal(secondPlayed, false, '清队后 b 不得播出');
  assert.equal(q.pending, 0);
});

function fakeClock(){let serial=0;const jobs=new Map();return {setTimeout(fn){jobs.set(++serial,fn);return serial;},clearTimeout(id){jobs.delete(id);},tick(){const f=[...jobs.values()];jobs.clear();f.forEach(fn=>fn());},size:()=>jobs.size};}
test('clear取消遮罩等待计时器，马上可播新队列',()=>{
 const d=makeDom(),doc=d.window.document,t=fakeClock(),q=createFxQueue(doc,{clock:t});let old=0,newPlay=0;
 doc.body.innerHTML='<div class="xsd2-tj-on"></div>';q.enqueue('old',done=>{old++;done();});assert.equal(t.size(),1);q.clear();assert.equal(t.size(),0);
 doc.body.replaceChildren();q.enqueue('new',done=>{newPlay++;done();});t.tick();assert.equal(old,0);assert.equal(newPlay,1);assert.equal(q.pending,0);d.window.close();
});
test('无句柄也计活跃；clear后的旧done与重复done不抢占新项',()=>{
 const d=makeDom(),q=createFxQueue(d.window.document);let oldDone,newDone,b=0;
 q.enqueue('old',done=>{oldDone=done;});assert.equal(q.pending,1);q.clear();q.enqueue('new',done=>{newDone=done;});q.enqueue('b',done=>{b++;done();});oldDone();assert.equal(b,0);assert.equal(q.pending,2);newDone();newDone();assert.equal(b,1);assert.equal(q.pending,0);q.clear();d.window.close();
});
test('同步done返回句柄不泄漏或抢占后续播放',()=>{
 const d=makeDom(),q=createFxQueue(d.window.document);let aDone,bDone,c=0;
 q.enqueue('a',done=>{aDone=done;done();return {stop(){throw Error('完成项不应被stop');}};});assert.equal(q.pending,0);
 q.enqueue('b',done=>{bDone=done;});q.enqueue('c',done=>{c++;done();});aDone();assert.equal(c,0);bDone();assert.equal(c,1);assert.equal(q.pending,0);q.clear();d.window.close();
});
