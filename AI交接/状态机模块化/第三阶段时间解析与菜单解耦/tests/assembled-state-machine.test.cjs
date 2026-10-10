'use strict';
// gpt 下级：加载最终真实拼接文件，检查共享作用域及显式依赖的初始化。
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const project = path.resolve(__dirname, '../候选源码');
const builder = require(path.join(project, 'src/state-machine/build.cjs'));
const source = fs.readFileSync(path.join(project, '卡片脚本/状态机.js'), 'utf8');
function host(withDocument = false) {
  const writes = [], reads = [], logs = [], timers = [];
  const box = {
    console: Object.fromEntries(['log', 'warn', 'error', 'info'].map(level => [level, (...args) => logs.push([level, ...args])])),
    setTimeout: (fn, delay) => { timers.push(['timeout', delay]); return timers.length; },
    setInterval: (fn, delay) => { timers.push(['interval', delay]); return timers.length; },
    clearInterval() {}, clearTimeout() {},
  };
  box.window = box;
  box.parent = box;
  box.top = box;
  box.addEventListener = () => {};
  box.removeEventListener = () => {};
  if (withDocument) {
    const doc = { querySelector: () => null, querySelectorAll: () => [], documentElement: {},
      addEventListener() {}, removeEventListener() {}, defaultView: box };
    box.document = doc;
    box.MutationObserver = class { observe() {} disconnect() {} };
    box.getVariables = opts => { reads.push(['variables', opts]); return {}; };
    box.getChatMessages = range => { reads.push(['messages', range]); return []; };
    box.setChatMessages = patch => { writes.push(['messages', patch]); };
    box.insertOrAssignVariables = patch => { writes.push(['variables', patch]); };
    box.replaceVariables = patch => { writes.push(['replace', patch]); };
  }
  vm.createContext(box);
  return { box, writes, reads, logs, timers };
}
test('最终生成物与源片段完全相同并可整体编译', () => {
  const checked = builder.buildStateMachine({ checkOnly: true });
  const assembled = builder.assemble();
  assert.ok(assembled.bytes.equals(Buffer.from(source)));
  assert.equal(checked.sha256, assembled.sha256);
  assert.doesNotThrow(() => new vm.Script(source));
});
test('酒馆 API 全缺时，完整脚本仍加载并暴露原入口', () => {
  const { box, logs, timers } = host();
  assert.doesNotThrow(() => vm.runInContext(source, box));
  for (const name of ['__xsdStateTick', '__xsdWho', '__xsdDump', '__xsdBoot']) assert.equal(typeof box[name], 'function');
  assert.ok(logs.some(row => row.some(value => String(value).includes('相关功能降级'))));
  assert.ok(timers.some(row => row[0] === 'timeout' && row[1] === 1500));
});
test('真实 adapter 初始化依赖齐全；解析和已存时间基准读取不写盘', () => {
  const { box, writes, reads } = host(true);
  assert.doesNotThrow(() => vm.runInContext(source, box));
  assert.equal(box.document.__xsdMenuBound, true);
  assert.equal(writes.length, 0);
  reads.length = 0;
  const parsed = box.parseStatusBlock('<Status_block><地点>测试庭院</地点><历时>一日</历时></Status_block>');
  assert.equal(parsed.fields['地点'], '测试庭院');
  assert.equal(parsed.fields['历时'], '一日');
  const basis = box.resolveCalendarBasis({ 历基准: 18938.066666666666, 身份: '赵无忧' });
  assert.equal(basis.source, 'stored-basis');
  assert.equal(basis.basis, 18938.066666666666);
  assert.equal(reads.length, 0);
  assert.equal(writes.length, 0);
});
