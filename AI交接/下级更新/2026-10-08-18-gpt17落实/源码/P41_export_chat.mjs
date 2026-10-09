/**
 * 导出酒馆聊天记录（只读源文件，不改动酒馆数据）
 * 目标：角色卡「测试剧本】」最近一次会话
 * 输出三份：原样 .jsonl（无损）＋ 可读 .txt ＋ 结构化 .json
 */
import fs from 'node:fs';
import path from 'node:path';

const CHAT_DIR = 'E:/tavern/SillyTavern/data/default-user/chats/测试剧本】';
const OUT_DIR = 'E:/角色卡制作/导出/测试剧本聊天记录';

const files = fs.readdirSync(CHAT_DIR).filter((f) => f.endsWith('.jsonl'));
if (!files.length) { console.error('该聊天目录里没有 .jsonl'); process.exit(1); }
const 最新 = files.map((f) => ({ f, t: fs.statSync(path.join(CHAT_DIR, f)).mtimeMs })).sort((a, b) => b.t - a.t)[0].f;
const 源 = path.join(CHAT_DIR, 最新);
const raw = fs.readFileSync(源, 'utf8');
const lines = raw.split(/\r?\n/).filter((l) => l.trim());

const 元 = JSON.parse(lines[0]);
const 楼 = lines.slice(1).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

fs.mkdirSync(OUT_DIR, { recursive: true });
const base = 最新.replace(/\.jsonl$/, '');

// ① 原样复制（无损）
fs.writeFileSync(path.join(OUT_DIR, 最新), raw, 'utf8');

// ② 结构化 JSON
fs.writeFileSync(path.join(OUT_DIR, base + '（结构化）.json'), JSON.stringify({
  来源: 源,
  角色卡: 元.character_name, 用户名: 元.user_name, 创建时间: 元.create_date,
  楼层数: 楼.length,
  聊天元数据键: Object.keys(元.chat_metadata || {}),
  消息: 楼.map((m, i) => ({
    楼号: i + 1, 角色: m.name, 是玩家: m.is_user === true, 是系统: m.is_system === true,
    时间: m.send_date, 正文: m.mes,
    swipes数: Array.isArray(m.swipes) ? m.swipes.length : 0,
    变量: m.variables ? '<有>' : null,
  })),
}, null, 2), 'utf8');

// ③ 可读文本
const 头 = [
  '='.repeat(72),
  '酒馆聊天记录导出',
  '角色卡：' + 元.character_name + '（聊天目录：测试剧本】）',
  '用户名：' + 元.user_name,
  '会话创建：' + 元.create_date,
  '源文件：' + 源,
  '楼层数：' + 楼.length,
  '导出时间：' + new Date().toISOString().replace('T', ' ').slice(0, 19) + ' +08:00',
  '='.repeat(72), '',
].join('\n');
const 体 = 楼.map((m, i) => {
  const who = m.is_system ? '【系统】' : (m.is_user ? '【玩家·' + (m.name || '') + '】' : '【' + (m.name || '角色') + '】');
  return '────── 第 ' + (i + 1) + ' 楼 ' + who + ' ' + (m.send_date || '') + ' ──────\n' + (m.mes || '') + '\n';
}).join('\n');
fs.writeFileSync(path.join(OUT_DIR, base + '（可读）.txt'), 头 + 体, 'utf8');

console.log('源：' + 源 + '（' + raw.length + ' 字符，' + 楼.length + ' 楼）');
console.log('输出目录：' + OUT_DIR);
for (const f of fs.readdirSync(OUT_DIR)) console.log('  · ' + f + '　' + fs.statSync(path.join(OUT_DIR, f)).size + ' B');
