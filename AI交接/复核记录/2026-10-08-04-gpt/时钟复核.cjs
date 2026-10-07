'use strict';
// 身份：gpt。运行既有上传源的实际历时函数；不写卡、不连接酒馆、不消费模型API。
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const inputPath = path.resolve(__dirname, '../../下级更新/2026-10-07-01/源码/卡片脚本·状态机（2026-10-08·含撤销命令与整件退回）.js');
const source = fs.readFileSync(inputPath, 'utf8');
// 按完整声明区段读取，不靠括号配平截表达式。
function region(from, to) {
  const start = source.indexOf(from), end = source.indexOf(to, start + from.length);
  assert.ok(start >= 0 && end > start, '声明区段缺失');
  return source.slice(start, end);
}
const clock = region('const LISHI_CAP =', 'const CN_DAY =');
const parser = region('const LISHI_WORDS =', 'function fmtXianmeng(v)');
const sandbox = {};
new vm.Script(clock + '\n' + parser + '\nglobalThis.api = {nextAcc, parseLishi, LISHI_TRANSIT_RE};').runInNewContext(sandbox);
const api = sandbox.api;
const plain = value => JSON.parse(JSON.stringify(value));
const observations = [];
for (const duration of ['一日', '一个月', '半年', '距启程3日']) {
  const parsed = api.parseLishi(duration);
  const hasTransit = api.LISHI_TRANSIT_RE.test(duration);
  observations.push({ duration, parsed_months: parsed, recognized_as_transit: hasTransit,
    actual_nextAcc: plain(api.nextAcc({历时累计: 0}, 8, parsed, hasTransit)) });
}
assert.equal(observations[0].actual_nextAcc.adv, 0.02);
assert.equal(observations[1].actual_nextAcc.adv, 0.02);
assert.equal(observations[2].actual_nextAcc.adv, 3);
assert.ok(observations[3].parsed_months > 0);
let state = {历时累计: 0};
for (let floor = 1; floor <= 30; floor++) {
  const r = api.nextAcc(state, floor, api.parseLishi('一日'), false);
  state = {历时累计: r.acc, 最后处理楼号: floor, 本楼历时加速: r.adv};
}
assert.equal(state.历时累计, 0.6);
const rate = 0.047 / 22;
const table = [
  ['二', 1578, 4], ['三', 1578, 6], ['四', 1578, 8], ['五', 1578, 11], ['六', 1578, 11],
  ['七', 1579, 1], ['八', 1578, 12], ['九', 1579, 1], ['十', 1579, 2], ['十一', 1579, 3],
  ['十二', 1579, 4], ['十三', 1579, 4], ['十四', 1579, 5], ['十五', 1579, 6],
].map(([chapter, year, month]) => {
  const gap = year * 12 + month - 1 - (1578 * 12 + 2 + 2 / 30);
  return { chapter, target_month: year + month / 100, gap_months: Number(gap.toFixed(6)),
    hypothetical_floors_if_same_rate: Math.ceil(gap / rate) };
});
assert.equal(table[0].hypothetical_floors_if_same_rate, 437);
assert.equal(table.at(-1).hypothetical_floors_if_same_rate, 6991);
const result = { identity: 'gpt', baseline_commit: '2410bec', source_sha256: crypto.createHash('sha256').update(source).digest('hex'),
  observations, thirty_accepted_one_day_labels: { actual_months: state.历时累计, actual_days_by_30_day_calendar: state.历时累计 * 30,
    nominal_days_in_labels: 30 }, rate_extrapolation: { rate_months_per_message_index: rate, table },
  limits: '函数来自既有上传源，未取得01:43部署的最新全文。证明这些解析/截断行为及线性外推算术；外推假设小样本平均永久不变，不是实际必需楼数，更不是采用该时间节奏的建议。未运行新调度、宿主、构建或玩家旧局。' };
fs.writeFileSync(path.join(__dirname, '时钟复核结果.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
