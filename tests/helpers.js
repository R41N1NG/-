'use strict';
const C = require('../src/core.js');
const {Host} = require('../src/host.js');
function fixture() {
  const storage = {script: {unrelated: 'keep'}, chats: {chat1: {unrelated: 'keep'}}};
  const books = new Map([['既有世界书', [{uid: 7, name: '其他素材', enabled: true, content: '原有内容'}]]]);
  const listeners = new Map();
  const root = {
    chat: 'chat1', messages: [{message_id: 0, role: 'user', name: '玩家', message: '我与她一起调查。'}, {message_id: 1, role: 'assistant', name: '同行者', message: '她握住你的手，一起走入黑暗的走廊。'}], injection: [],
    getCurrentChatId() { return this.chat; },
    getVariables({type}) { return C.clone(type === 'script' ? storage.script : storage.chats[this.chat] || {}); },
    updateVariablesWith(fn, {type}) { if (type === 'script') storage.script = fn(this.getVariables({type})); else storage.chats[this.chat] = fn(this.getVariables({type})); },
    getChatMessages(id) { const m = id === -1 ? this.messages.at(-1) : this.messages.find(m => m.message_id === Number(id)); return m ? [C.clone(m)] : []; },
    injectPrompts(items) { this.injection = items; }, uninjectPrompts() { this.injection = []; },
    eventOn(name, fn) { const set = listeners.get(name) || new Set(); set.add(fn); listeners.set(name, set); return {stop: () => set.delete(fn)}; },
    async eventEmit(name, value) { await Promise.all([...(listeners.get(name) || [])].map(fn => fn(value))); },
    getWorldbookNames() { return [...books.keys()]; },
    async getWorldbook(name) { if (!books.has(name)) throw Error('世界书不存在'); return C.clone(books.get(name)); },
    async createWorldbook(name) { if (books.has(name)) return false; books.set(name, []); return true; },
    async updateWorldbookWith(name, fn) { const rows = await fn(C.clone(books.get(name))); let next = Math.max(0, ...rows.map(r => r.uid || 0)); books.set(name, rows.map(r => ({uid: ++next, ...r}))); return this.getWorldbook(name); },
  };
  return {root, storage, books, listeners, host: new Host(root)};
}
function deferred() { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return {promise, resolve, reject}; }
const tick = () => new Promise(resolve => setTimeout(resolve, 5));
function mockClient(detect) { return {usage: {calls: 0, input: 0, output: 0, unknown: 0}, cancel() {}, detect: detect || (async (profile, messages, events) => events.map(e => ({event_id: e.id, status: 'completed', evidence: [{message_id: '1', quote: '一起走入黑暗的走廊'}]})))}; }
module.exports = {fixture, deferred, tick, mockClient};
