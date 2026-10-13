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
