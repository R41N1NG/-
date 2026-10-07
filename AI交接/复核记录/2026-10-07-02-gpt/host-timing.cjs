'use strict';
// 身份：gpt。检查固定版本官方源码顺序，并隔离运行原 EventEmitter；不是酒馆 UI 验收。
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const files = process.argv.slice(2);
if (files.length !== 3) throw new Error('用法：node host-timing.cjs script.js eventemitter.js st-context.js');
const [script, emitter, context] = files.map(file => fs.readFileSync(file, 'utf8'));
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const findLine = (source, phrase) => {
  const index = source.indexOf(phrase);
  assert.ok(index >= 0, '找不到源码锚点：' + phrase);
  return source.slice(0, index).split('\n').length;
};
const positions = {
  generation_after_commands: findLine(script, 'await eventSource.emit(event_types.GENERATION_AFTER_COMMANDS'),
  send_user_message: findLine(script, 'await sendMessageAsUser(textareaText, messageBias)'),
  world_info_scan: findLine(script, 'await getWorldInfoPrompt(chatForWI'),
  before_combine_prompts: findLine(script, 'await eventSource.emit(event_types.GENERATE_BEFORE_COMBINE_PROMPTS'),
  accepted_message_event: findLine(script, 'await eventSource.emit(event_types.MESSAGE_SENT, chat_id)'),
};
assert.ok(positions.generation_after_commands < positions.send_user_message);
assert.ok(positions.send_user_message < positions.world_info_scan);
assert.ok(positions.world_info_scan < positions.before_combine_prompts);
assert.ok(context.includes('eventSource,') && context.includes('eventTypes: event_types'));
assert.ok(emitter.includes('await listeners[i].apply(this, args)'));
assert.equal(emitter.split('export { EventEmitter }').length, 2);
const native = vm.createContext({ console: { trace() {}, debug() {}, error() {} }, localStorage: { getItem: () => null } });
new vm.Script(emitter.replace('export { EventEmitter }', '')).runInContext(native);

async function run() {
  const order = [];
  const event = new native.EventEmitter([]);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  event.on('message_sent', async () => { order.push('listener_start'); await gate; order.push('listener_ready'); });
  event.on('message_sent', () => { order.push('later_listener'); });
  const pending = event.emit('message_sent', 8).then(() => { order.push('emit_done'); });
  assert.deepEqual(order, ['listener_start']);
  release(); await pending;
  assert.deepEqual(order, ['listener_start', 'listener_ready', 'later_listener', 'emit_done']);
  const failed = new native.EventEmitter([]), afterError = [];
  failed.on('message_sent', async () => { throw new Error('isolated initialization failure'); });
  failed.on('message_sent', () => { afterError.push('continued_after_listener_error'); });
  await failed.emit('message_sent', 8);
  assert.deepEqual(afterError, ['continued_after_listener_error']);
  const result = {
    identity: 'gpt', date: '2026-10-07', timezone: 'Asia/Shanghai', version: 'SillyTavern 1.14.0',
    sources: [
      ['public/script.js', script], ['public/lib/eventemitter.js', emitter], ['public/scripts/st-context.js', context],
    ].map(([file, value]) => ({ url: 'https://github.com/SillyTavern/SillyTavern/blob/1.14.0/' + file, sha256: sha256(value) })),
    positions, tests: [
      { name: 'native emit awaits listener Promise', passed: true, order },
      { name: 'listener throwing alone does not cancel emit', passed: true, order: afterError },
    ],
    scope: '官方源码静态顺序与原生事件发射器隔离运行；未验证目标酒馆助手 eventOn 桥接、世界书模板求值顺序、实际变量写盘或生成取消。',
  };
  fs.writeFileSync(path.join(__dirname, 'host-timing-results.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ native_event_tests: 2, positions, output: 'host-timing-results.json' }, null, 2));
}
run().catch(error => { console.error(error); process.exitCode = 1; });
