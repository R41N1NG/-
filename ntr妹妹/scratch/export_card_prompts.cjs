const fs = require('fs');
const p = '最新角色卡/奥克赫斯.json';
const j = JSON.parse(fs.readFileSync(p, 'utf8'));
const d = j.data;
const wb = d.character_book.entries;
const isna = wb.filter(e => /伊丝娜/.test(e.comment));
const out = [];
out.push('# 奥克赫斯 · 角色卡提示词全文（导出快照）');
out.push('');
out.push('- 卡名：' + d.name + '　版本：' + d.character_version);
out.push('- 导出时间：2026-11-28 10:0x（源自 `最新角色卡/奥克赫斯.json`，SHA-256 BCE1AB0B…A90A2）');
out.push('- 世界书条目：' + wb.length + ' 条；本文件正文给出卡片 7 个提示词字段全文 + 伊丝娜两条世界书条目全文');
out.push('');
const fields = [
  ['description', '一、description（世界观与玩法契约）'],
  ['personality', '二、personality（人物速览）'],
  ['scenario', '三、scenario（开局场景）'],
  ['first_mes', '四、first_mes（开场白 · 含状态栏回执）'],
  ['mes_example', '五、mes_example（对话范例）'],
  ['post_history_instructions', '六、post_history_instructions（后置指令）'],
  ['creator_notes', '七、creator_notes（导入说明）']
];
for (const [k, title] of fields) {
  out.push('## ' + title);
  out.push('');
  out.push('```text');
  out.push(String(d[k] || '').replace(/\n+$/, ''));
  out.push('```');
  out.push('');
}
out.push('## 八、system_prompt');
out.push('');
out.push('```text');
out.push(String(d.system_prompt || '（空字符串，卡片未启用独立 system_prompt，世界与玩法契约全部写在 description 内）'));
out.push('```');
out.push('');
out.push('## 九、alternate_greetings');
out.push('');
out.push('```text');
out.push(d.alternate_greetings && d.alternate_greetings.length ? d.alternate_greetings.join('\n---\n') : '（未设置备用开场白）');
out.push('```');
out.push('');
out.push('## 十、tags');
out.push('');
out.push('```text');
out.push((d.tags || []).join(', ') || '（无）');
out.push('```');
out.push('');
out.push('## 十一、伊丝娜世界书条目全文（' + isna.length + ' 条）');
for (const e of isna) {
  out.push('');
  out.push('### ' + e.comment + '　（keys: ' + e.keys.join(', ') + '｜constant: ' + e.constant + '｜depth: ' + e.extensions.depth + '｜order: ' + e.insertion_order + '）');
  out.push('');
  out.push('```text');
  out.push(e.content);
  out.push('```');
}
fs.writeFileSync('最新角色卡/角色卡提示词全文_2026-11-28.md', out.join('\n'), 'utf8');
console.log('written, bytes=' + fs.statSync('最新角色卡/角色卡提示词全文_2026-11-28.md').size);
console.log('isna entries: ' + isna.map(e => e.comment).join(' | '));
