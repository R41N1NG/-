// gpt：只读；node 本文件 卡.json 扩展原生ejs.js；不输出正文。
// 这是条件求值复算，不能替代宿主扫描、错误处理和最终请求验证。
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const stages = ['一', '二', '三', '四'];
function expected(formed, mask) {
  if (!formed) return [];
  for (let i = 3; i >= 0; i--) if (mask & (1 << i)) return [i];
  return [];
}
if (process.argv[2] === '--policy-selftest') {
  for (const formed of [false, true]) for (let mask = 0; mask < 16; mask++) {
    const actual = stages.flatMap((_, i) => formed && (mask & (1 << i)) && !(mask >> (i + 1)) ? [i] : []);
    assert.deepEqual(actual, expected(formed, mask));
  }
  console.log(JSON.stringify({ scope: '抽象互斥政策；不是当前卡验证', cases: 32, failures: 0 }));
  process.exit(0);
}
if (!process.argv[2] || !process.argv[3]) throw Error('需要 卡.json 和扩展原生ejs.js 路径');
const raw = fs.readFileSync(process.argv[2]);
const ejsRaw = fs.readFileSync(process.argv[3]);
const ejs = require(path.resolve(process.argv[3]));
const card = JSON.parse(raw);
const entries = card.data?.character_book?.entries;
assert(Array.isArray(entries), '卡内entries必须为数组');
const groups = new Map();
for (const entry of entries) {
  const m = /^【名器·阶段】([^、]+)、([一二三四])阶段/.exec(entry.comment || '');
  if (!m) continue;
  if (!groups.has(m[1])) groups.set(m[1], new Map());
  const group = groups.get(m[1]);
  assert(!group.has(m[2]), '重复阶段: ' + m[1] + m[2]);
  group.set(m[2], entry);
}
assert.equal(groups.size, 13, '本基线预期13件；变化须先更新政策与映射');
const results = [];
for (const [name, group] of groups) {
  assert.equal(group.size, 4, name + '阶段不完整');
  for (const formed of [false, true]) for (let mask = 0; mask < 16; mask++) {
    const known = { 极乐引入手: true, [name + '成形']: formed };
    stages.forEach((s, i) => { known[name + s + '阶段'] = !!(mask & (1 << i)); });
    const variables = { stat_data: { 身份: '赵无忧', 段位: 7, 仙盟历: 1577.07, known } };
    const actual = [], errors = [];
    stages.forEach((s, i) => {
      const entry = group.get(s);
      const m = /^@@if[ \t]+(.+)$/.exec(String(entry.content || '').split(/\r?\n/)[0]);
      if (!m) { errors.push({ id: entry.id, reason: '缺少首行条件门' }); return; }
      try {
        if (ejs.render('<%- !!(' + m[1].trim() + ') %>', { variables }, {}) !== 'false') actual.push(i);
      } catch (error) { errors.push({ id: entry.id, reason: error.name }); }
    });
    const want = expected(formed, mask);
    results.push({ name, formed, mask, actualIds: actual.map(i => group.get(stages[i]).id), expectedIds: want.map(i => group.get(stages[i]).id), errors,
      pass: !errors.length && JSON.stringify(actual) === JSON.stringify(want) });
  }
}
const failures = results.filter(r => !r.pass).length;
console.log(JSON.stringify({ scope: '实际卡首行条件求值，不含宿主召回', cardSHA256: crypto.createHash('sha256').update(raw).digest('hex'), ejsSHA256: crypto.createHash('sha256').update(ejsRaw).digest('hex'), cases: results.length, failures, results }, null, 2));
process.exitCode = failures ? 1 : 0;
