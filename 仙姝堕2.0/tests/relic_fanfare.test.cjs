'use strict';
// 纹章揭幕行为：known 推进触发一次、重复渲染不重播、readOnly 不播、减弱动态只记账不播；
// fx_queue：顺序排队、减弱动态跳过、结算遮罩活跃避让。
const { test } = require('node:test'), assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { mountRelicFanfare } = require('../src/ui/relic_fanfare');
const { createFxQueue } = require('../src/ui/fx_queue');

function makeDom() {
  const d = new JSDOM('<html><head></head><body><main></main></body></html>');
  d.window.matchMedia = (q) => ({ matches: /reduce/.test(q) && !!d.__reduced, media: q });
  return d;
}
const data = {
  rules: () => ({
    RELIC_PILOT_CONFIG: [{ id: 'pilot_zhuo', names: ['灼酒流炎穴'] }],
    getRelicStage: (id, known) => known.zhuo || 0,
  }),
};
const cards = (doc) => doc.querySelectorAll('.xsd2-fan-card').length;

test('known 推进触发一次，重复渲染不重播，destroy 清场', () => {
  const d = makeDom(), doc = d.window.document;
  const fan = mountRelicFanfare(doc, doc.querySelector('main'), data);
  const s = { stat_data: { known: { zhuo: 0 } } };
  fan.check(s, {});
  assert.equal(cards(doc), 0, '未觉醒不播');
  s.stat_data.known.zhuo = 1;
  fan.check(s, {});
  assert.equal(cards(doc), 1, '觉醒即播一次');
  fan.check(s, {});
  fan.check(s, {});
  assert.equal(cards(doc), 1, '重复渲染不重播');
  fan.destroy();
  assert.equal(cards(doc), 0, 'destroy 清场');
});

test('readOnly 历史楼不播也不记账，正式渲染照常补播', () => {
  const d = makeDom(), doc = d.window.document;
  const fan = mountRelicFanfare(doc, doc.querySelector('main'), data);
  fan.check({ stat_data: { known: { zhuo: 2 } } }, { readOnly: true });
  assert.equal(cards(doc), 0);
  fan.check({ stat_data: { known: { zhuo: 2 } } }, {});
  assert.equal(cards(doc), 1, 'readOnly 不消耗一次性播放');
  fan.destroy();
});

test('减弱动态只记账不播', () => {
  const d = makeDom(); d.__reduced = true;
  const doc = d.window.document;
  const fan = mountRelicFanfare(doc, doc.querySelector('main'), data);
  fan.check({ stat_data: { known: { zhuo: 3 } } }, {});
  assert.equal(cards(doc), 0);
  fan.destroy();
});

test('fx_queue 顺序排队，done 后才播下一个', async () => {
  const d = makeDom(), doc = d.window.document;
  const q = createFxQueue(doc);
  const ran = [];
  q.enqueue('a', (done) => { ran.push('a'); setTimeout(done, 20); });
  q.enqueue('b', (done) => { ran.push('b'); done(); });
  assert.equal(ran.join(''), 'a', 'b 在 a 结束前不播');
  await new Promise(r => setTimeout(r, 80));
  assert.equal(ran.join(''), 'ab');
  assert.equal(q.pending, 0);
});

test('fx_queue 减弱动态跳过播放直接 skip', async () => {
  const d = makeDom(); d.__reduced = true;
  const q = createFxQueue(d.window.document);
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
