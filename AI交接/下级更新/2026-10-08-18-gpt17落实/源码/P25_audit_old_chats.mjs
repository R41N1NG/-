/**
 * P25_audit_old_chats.mjs —— 旧局**只读审查**（不写任何聊天）：按 gpt 17 §3 末段做"审查候选"
 *   ① 扫描本机 `仙姝堕` 聊天，逐局读 `chat_metadata.variables.stat_data`；
 *   ② 用**卡内真实的** `freeFieldGate` 口径（从卡内状态机脚本切片）判"六个自由字段里有没有把未到的
 *      世界事件写成正在发生"；
 *   ③ 出污染清单（只列字段名与被拒因由，摘 40 字上下文），并给出可控修复候选所需的锚点。
 * 只读；不改任何聊天、不改任何变量。
 */
import fs from 'node:fs';
import path from 'node:path';

const CHAT_DIR = 'E:/tavern/SillyTavern/data/default-user/chats/仙姝堕';
const CARD = 'E:/角色卡制作/仙姝堕/_staging_2026-10-08-18/仙姝堕.json';
const OUT = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-18-gpt17落实/材料/19c_旧局只读审查.json';

/* 取卡内状态机脚本，切出 freeFieldGate ＋ freeFieldSuspect 相关定义（与门禁同一套切法） */
const card = JSON.parse(fs.readFileSync(CARD, 'utf8'));
const sm = (card.data.extensions.tavern_helper.scripts || []).find((s) => s.name === '状态机').content;
const i1 = sm.indexOf('const FREE_FIELD_WHITELIST');
const i2 = sm.indexOf('/** 返回 {ok:true} 或 {ok:false, 事件, 因由}（纯函数，可离线测）', i1);
const i3 = sm.indexOf('function freeFieldGate(', i2);
const i4 = sm.indexOf('\n  return { ok: true };\n}', i3) + '\n  return { ok: true };\n}'.length;
const 切片 = sm.slice(i1, i2) + '\n' + sm.slice(i3, i4);
// eslint-disable-next-line no-new-func
const { freeFieldGate, freeFieldSuspect } = new Function(切片 + '\nreturn { freeFieldGate, freeFieldSuspect };')();

const FIELDS = ['局势', '近闻', '远闻', '危机', '目标', '阶段总结'];
const rows = [];
if (fs.existsSync(CHAT_DIR)) {
  for (const f of fs.readdirSync(CHAT_DIR).filter((x) => x.endsWith('.jsonl'))) {
    const full = path.join(CHAT_DIR, f);
    const lines = fs.readFileSync(full, 'utf8').split(/\r?\n/).filter(Boolean);
    let head = null;
    for (const l of lines) { try { const r = JSON.parse(l); if (r && r.chat_metadata) { head = r; break; } } catch (e) {} }
    const sd = head && head.chat_metadata && head.chat_metadata.variables && head.chat_metadata.variables.stat_data;
    if (!sd) { rows.push({ 聊天: f, 备注: '读不到 stat_data（跳过）' }); continue; }
    const 命中 = []; const 待核 = [];
    for (const k of FIELDS) {
      const v = sd[k];
      if (typeof v !== 'string' || !v) continue;
      const g = freeFieldGate(k, v, sd);
      const s2 = freeFieldSuspect(k, v, sd);
      if (!g.ok) 命中.push({ 字段: k, 值摘: v.slice(0, 40), 事件: g.事件, 因由: g.因由 });
      if (s2.suspect) 待核.push({ 字段: k, 值摘: v.slice(0, 40), 因由: s2.因由 });
    }
    rows.push({
      聊天: f,
      楼数: lines.length,
      身份: sd.身份 ?? null,
      仙盟历: sd.仙盟历 ?? null,
      仙盟历文: sd.仙盟历文 ?? null,
      段位: sd.段位 ?? null,
      known为真: Object.keys(sd.known || {}).filter((k) => sd.known[k] === true),
      自由字段污染命中: 命中,
      自由字段待核: 待核,
      自由字段现值: Object.fromEntries(FIELDS.map((k) => [k, typeof sd[k] === 'string' ? sd[k].slice(0, 60) : sd[k] ?? null])),
      有派生账本: !!(sd.派生账本 && Object.keys(sd.派生账本).length),
      有名器归属: !!sd.名器归属,
    });
  }
}
const out = { 审查范围: CHAT_DIR, 只读: true, 判定口径: '卡内实际 freeFieldGate（切自候选卡里的状态机脚本）', 局数: rows.length, 局: rows };
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
console.log('审查 ' + rows.length + ' 局（只读）：');
for (const r of rows) {
  if (r.备注) { console.log('  · ' + r.聊天 + ' — ' + r.备注); continue; }
  console.log('  · ' + r.聊天 + '｜身份=' + r.身份 + '｜仙盟历=' + r.仙盟历 + '(' + r.仙盟历文 + ')｜段位=' + r.段位 + '｜known真 ' + r.known为真.length + ' 项' + (r.known为真.length ? '（' + r.known为真.join('、') + '）' : '') + '｜拦下(污染) ' + r.自由字段污染命中.length + ' 项｜待核 ' + ((r.自由字段待核||[]).length) + ' 项');
  for (const h of r.自由字段污染命中) console.log('      ⛔ ' + h.字段 + '：' + h.因由 + '｜值「' + h.值摘 + '」');
  for (const h of (r.自由字段待核 || [])) console.log('      ⚠️ 待核 ' + h.字段 + '：' + h.因由 + '｜值「' + h.值摘 + '」');
}
