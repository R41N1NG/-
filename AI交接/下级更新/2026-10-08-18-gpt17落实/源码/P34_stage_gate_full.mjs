/**
 * P34_stage_gate_full.mjs —— **按 gpt 22 批裁定的口径**重做阶段门全组合复算（改正 P33 的覆盖错误）
 *
 * gpt 指出的错（我认）：
 *   · P33 的 A/B/C/D 局面**始终用「九幽玄阴穴」的键**，只有 E 用当前名器 ⇒ 其余 12 件只测了
 *     "未成形"和"只立二阶段" ⇒ 所谓"13×5 穷举"不成立，五组也不构成全组合。
 *   · 末句"已达成的历史阶段不会被裁掉"与互斥断言冲突 —— 正确的是：**同一件旧阶段被裁掉；
 *     不同件各自当前阶段可并存**。
 *   · 字数×0.75 不是 token 计量；"求值通过的条目总长度"只是**条件合格条目字符数**。
 *
 * 本件口径（逐条照 gpt 的补测要求）：
 *   每件名器用**自己的前缀**：成形 ∈ {false,true} × 四阶段 16 种布尔掩码 ⇒ **13 × 32 = 416 组**
 *   断言：未成形 ⇒ 通过 0 条；成形且 mask=0 ⇒ 通过 0 条；否则 ⇒ **恰好 1 条，且是最高已立阶段**
 *   每条输出：条目 id、名器名、成形、mask、实际通过 id、预期最高阶段 id；失败则退出码非零。
 *   求值用**扩展自带原生 EJS** 与其真实转换规则（`@@if ARGS` ⇒ `<%- !!(ARGS) %>`，'false' 即排除）。
 *
 * 另附两类"宿主边界"离线核查（**标注清楚这是离线求值，不是宿主扫描**）：
 *   · 缺字段／异常类型：门表达式里引用不存在的键、或求值抛错时，返回什么 ⇒ 是 fail-closed 还是放行。
 *   · 门编译错误：首行不是合法 `@@if`（缺门）时本件如何记（报 errors，不冒充通过）。
 *
 * 用法：node P34_stage_gate_full.mjs [卡.json] [ejs.js] [输出.json]
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);
const CARD = process.argv[2] || '最新角色卡/仙姝堕.json';
const EJS = process.argv[3] || 'E:/tavern/SillyTavern/data/default-user/extensions/ST-Prompt-Template/src/3rdparty/ejs.js';
const OUT = process.argv[4] || 'AI交接/下级更新/2026-10-08-18-gpt17落实/材料/24a_阶段门全组合复算（416组）.json';

const stages = ['一', '二', '三', '四'];
const raw = fs.readFileSync(CARD);
const ejsRaw = fs.readFileSync(EJS);
const ejs = require_(EJS);
const card = JSON.parse(raw.toString('utf8'));
const entries = card.data.character_book.entries;

/** 政策：未成形 ⇒ 空；成形 ⇒ 最高已立阶段（无已立阶段 ⇒ 空） */
const 期望 = (formed, mask) => {
  if (!formed) return [];
  for (let i = 3; i >= 0; i--) if (mask & (1 << i)) return [i];
  return [];
};

const groups = new Map();
for (const e of entries) {
  const m = /^【名器·阶段】([^、]+)、([一二三四])阶段/.exec(e.comment || '');
  if (!m) continue;
  if (!groups.has(m[1])) groups.set(m[1], new Map());
  groups.get(m[1]).set(m[2], e);
}

const 结果 = [];
const 汇总 = { 名器数: groups.size, 组数: 0, 通过: 0, 失败: 0, 门缺失或错误: [] };
for (const [名, g] of groups) {
  for (const formed of [false, true]) {
    for (let mask = 0; mask < 16; mask++) {
      const known = { 极乐引入手: true };
      known[名 + '成形'] = formed;
      stages.forEach((s, i) => { known[名 + s + '阶段'] = !!(mask & (1 << i)); });
      const variables = { stat_data: { 身份: '赵无忧', 段位: 7, 仙盟历: 1577.07, known } };
      const actual = [], errors = [];
      stages.forEach((s, i) => {
        const e = g.get(s);
        if (!e) { errors.push({ 阶段: s, reason: '阶段条目缺失' }); return; }
        const m = /^@@if[ \t]+(.+)$/.exec(String(e.content || '').split(/\r?\n/)[0]);
        if (!m) { errors.push({ id: e.id, 阶段: s, reason: '缺少首行 @@if 门' }); return; }
        try {
          if (ejs.render('<%- !!(' + m[1].trim() + ') %>', { variables }, {}) !== 'false') actual.push(i);
        } catch (err) { errors.push({ id: e.id, 阶段: s, reason: err.name + ': ' + String(err.message).slice(0, 60) }); }
      });
      const want = 期望(formed, mask);
      const pass = !errors.length && JSON.stringify(actual) === JSON.stringify(want);
      汇总.组数++;
      if (pass) 汇总.通过++; else 汇总.失败++;
      if (errors.length) 汇总.门缺失或错误.push({ 名, formed, mask, errors });
      结果.push({
        名器: 名, 成形: formed, mask, mask二进制: mask.toString(2).padStart(4, '0'),
        实际通过id: actual.map((i) => (g.get(stages[i]) || {}).id),
        预期最高阶段id: want.map((i) => (g.get(stages[i]) || {}).id),
        pass, errors,
      });
    }
  }
}

/* ── 宿主边界离线核查（不是宿主扫描）── */
const 边界 = [];
const 试 = (label, 表达式, vars) => {
  let r;
  try { r = ejs.render('<%- !!(' + 表达式 + ') %>', { variables: vars }, {}); }
  catch (err) { r = 'THROW:' + err.name; }
  边界.push({ 用例: label, 表达式, 结果: r, 判定: r === 'false' ? '排除条目（fail-closed）' : (String(r).startsWith('THROW') ? '求值抛错（结果取决于宿主如何处理）' : '放行条目') });
};
const 存在的 = g_(groups) || {};
function g_(m) { return m.values().next().value; }
{
  const v = { stat_data: { 身份: '赵无忧', 段位: 7, 仙盟历: 1577.07, known: { 极乐引入手: true } } };
  试('引用不存在的键（未成形）', "variables.stat_data?.known?.['某个不存在的名器成形'] === true", v);
  试('引用不存在的键（可选链）', "variables.stat_data?.known?.['某个不存在的名器成形'] === true && variables.stat_data?.known?.['某个不存在的名器一阶段'] === true", v);
  试('无 stat_data（缺整层）', "variables.stat_data?.known?.['极乐引入手'] === true", { variables: {} });
  试('抛错类型（对 null 取属性）', "(null).x === true", v);
  试('抛错但被卡内 try/catch 包住', "(function(){try{return (null).x === true}catch(e){return false}})()", v);
}

const out = {
  口径: '每件名器自己的前缀；成形真假 × 16 阶段掩码 = 13×32 = 416 组（gpt 22 批补测要求）',
  卡: CARD, 卡SHA256: crypto.createHash('sha256').update(raw).digest('hex'),
  EJS: EJS, ejsSHA256: crypto.createHash('sha256').update(ejsRaw).digest('hex'),
  求值规则: "@@if ARGS ⇒ <%- !!(ARGS) %>；结果为 'false' 即排除该条目（ST-Prompt-Template worldinfo.ts:846-865）",
  注意: '本件是**条件求值**复算，**不含宿主召回、关键词匹配、禁用标记、预算与插入顺序**；因此它给的是"条件合格条目"的数量与 id，不是实际注入量，也不是 token。',
  汇总, 边界核查: 边界, 明细: 结果,
};
fs.mkdirSync(OUT.split('/').slice(0, -1).join('/'), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');

console.log('【阶段门全组合复算】卡 ' + CARD);
console.log('  卡 SHA256 ' + out.卡SHA256.slice(0, 16) + '…｜EJS SHA256 ' + out.ejsSHA256.slice(0, 16) + '…');
console.log('  名器 ' + 汇总.名器数 + ' 件｜组数 ' + 汇总.组数 + '｜通过 ' + 汇总.通过 + '｜失败 ' + 汇总.失败);
console.log('\n  按名器看通过数（应为 32/32）：');
for (const 名 of groups.keys()) {
  const a = 结果.filter((r) => r.名器 === 名);
  const p = a.filter((r) => r.pass).length;
  console.log('    ' + 名.padEnd(8) + ' ' + p + '/' + a.length + (p === a.length ? '' : '   ✘ 有失败组'));
}
if (汇总.失败) {
  console.log('\n  ✘ 失败组（最多列 8 条）：');
  for (const r of 结果.filter((x) => !x.pass).slice(0, 8)) console.log('    ' + JSON.stringify(r));
}
console.log('\n  宿主边界离线核查（**离线求值，不是宿主扫描**）：');
for (const b of 边界) console.log('    · ' + b.用例 + ' ⇒ ' + b.结果 + '｜' + b.判定);
console.log('\n  写法更正（gpt 指出）：同一件名器的**旧阶段会被裁掉**；**不同名器各自的当前阶段可同时留下**。');
console.log('  口径更正：字数×0.75 不是 token；本件给出的是"条件合格条目"的 id，不是实际注入量。');
console.log('\n' + (汇总.失败 ? '✘ ' + 汇总.失败 + ' 组未通过' : '✔ 416 组全部通过'));
console.log('完整输出：' + OUT);
process.exit(汇总.失败 ? 1 : 0);
