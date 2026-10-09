/**
 * P01_chat.mjs —— 只读取证：从 1577.07 那一局的聊天记录里取
 * ① 身份 / 仙盟历 / 段位 / known 快照；② 是否有该次目标 Prompt 记录。
 * 不写聊天、不改状态；只读 jsonl。
 */
import fs from 'node:fs';

const CHAT = 'E:/tavern/SillyTavern/data/default-user/chats/仙姝堕/仙姝堕 - 2026-10-08@13h10m49s.jsonl';
const OUT = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-17-阶段驱动与派发技术件/材料/P01_chat.json';

const lines = fs.readFileSync(CHAT, 'utf8').split(/\r?\n/).filter((s) => s.trim());
const recs = lines.map((s) => { try { return JSON.parse(s); } catch (e) { return { __parseError: String(e) }; } });

const out = {
  聊天文件: CHAT,
  行数: recs.length,
  每条顶层键: recs.map((r, i) => ({ i, keys: Object.keys(r).slice(0, 40) })),
};

/* 1. 头记录（chat_metadata 等） */
const head = recs.find((r) => r && r.chat_metadata);
if (head) {
  const cm = head.chat_metadata;
  out.chat_metadata键 = Object.keys(cm);
  out.variables原始 = cm.variables ?? null;
  out.统合变量 = cm.variables ? null : (cm['tavern_helper'] ? cm['tavern_helper'].variables ?? null : null);
  out.chat_metadata瘦身 = JSON.parse(JSON.stringify(cm, (k, v) => (typeof v === 'string' && v.length > 400 ? `«${v.length} 字符»` : v)));
}

/* 2. 所有消息里找 stat_data / 变量快照 */
for (const r of recs) {
  if (!r || !r.mes) continue;
  const sd = r.mes.match(/<Status_block>[\s\S]*?<\/Status_block>/);
  if (sd) out.状态块样本 = out.状态块样本 || [];
  if (sd && out.状态块样本.length < 4) out.状态块样本.push({ 楼: recs.indexOf(r), 块: sd[0] });
}

/* 3. 变量可能挂在每条消息的 extra 或 sweak 里 */
out.消息变量命中 = recs
  .map((r, i) => ({ i, hasVar: !!(r && (r.variables || (r.extra && r.extra.variables))) }))
  .filter((x) => x.hasVar);

/* 4. 所有已知的 stat_data 形态（深度扫描对象键名，不导出正文） */
const hits = [];
(function walk(o, path, depth) {
  if (!o || typeof o !== 'object' || depth > 6) return;
  for (const k of Object.keys(o)) {
    if (/stat_data|known|段位|仙盟历|身份|时点|历时/.test(k)) hits.push(path + '.' + k + ' :: ' + (typeof o[k] === 'object' ? (Array.isArray(o[k]) ? 'array[' + o[k].length + ']' : 'object{' + Object.keys(o[k]).slice(0, 12).join(',') + '}') : String(o[k]).slice(0, 60)));
    walk(o[k], path + '.' + k, depth + 1);
  }
})(recs, '$', 0);
out.变量路径命中 = [...new Set(hits)].slice(0, 120);

/* 5. 目标 Prompt 是否留痕 */
out.Prompt留痕 = recs
  .map((r, i) => ({ i, keys: r && typeof r === 'object' ? Object.keys(r).filter((k) => /prompt|itemiz/i.test(k)) : [] }))
  .filter((x) => x.keys.length);

fs.mkdirSync(OUT.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
console.log('OK ' + OUT);
