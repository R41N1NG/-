const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');
const {fixture} = require('./helpers.js');
test('世界书保存关闭所有自有条目自动激活，保留其他条目和 uid', async () => {
  const {host, books} = fixture(), p = C.demoProject();
  await host.saveBook('既有世界书', p); const first = books.get('既有世界书');
  assert.equal(first[0].content, '原有内容'); assert.equal(first[0].enabled, true);
  assert.equal(first.length, p.nodes.length + p.events.length + 2); assert(first.slice(1).every(r => r.enabled === false));
  const uid = first[1].uid; p.title = '新名称'; await host.saveBook('既有世界书', p); assert.equal(books.get('既有世界书')[1].uid, uid);
  assert.equal((await host.loadBook('既有世界书', p.id)).project.title, '新名称');
});
test('同一世界书多剧本，保存当前项目保留其他项目', async () => {
  const {host} = fixture(), a = C.demoProject(), b = C.demoProject(); b.id = 'story2'; b.title = '第二剧本';
  await host.saveBook('库', a); await host.saveBook('库', b); a.title = '改名'; await host.saveBook('库', a);
  const loaded = await host.loadBook('库', b.id); assert.equal(loaded.project.title, '第二剧本'); assert.equal(loaded.projects.length, 2);
});
test('聊天变量按会话隔离，写入保留其他插件变量', () => {
  const {host, root, storage} = fixture(), p = C.demoProject(), s = host.progress(p); C.enterNode(s, p, 'N002'); host.saveProgress(p, s);
  root.chat = 'chat2'; assert.equal(host.progress(p).current_node_id, 'N001'); host.saveProgress(p, host.progress(p));
  root.chat = 'chat1'; assert.equal(host.progress(p).current_node_id, 'N002'); assert.equal(storage.chats.chat1.unrelated, 'keep');
});
test('注入禁止世界书扫描，清理仅删除自己的注入', () => {
  const {host, root} = fixture(); host.inject('指引', 2); assert.equal(root.injection[0].should_scan, false); assert.equal(root.injection[0].depth, 2); host.destroy(); assert.deepEqual(root.injection, []);
});
