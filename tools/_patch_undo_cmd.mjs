/* 一次性补丁：/撤销（退掉最近一次 /解锁）＋ 命令表/帮助补词
 *  背景：玩家反馈「/send /解锁 灼酒流炎穴成形 打错字，激活了别的」。
 *        命令本身已是严格全等（writeKnownField 要求 ALL_FIELDS 里真有这个名字），
 *        所以能做的是：给出**一键撤销**，别让玩家去背字段名。
 */
import fs from 'node:fs';

const F = '卡片脚本/状态机.js';
let s = fs.readFileSync(F, 'utf8');
const log = [];

/* ① /解锁 成功后记下「最近解锁」 */
const OLD_UNLOCK = [
  '    const val = p.cmd === \'/解锁\';',
  '    const r = await writeKnownField(p.arg, val);',
  '    if (r.ok) {',
].join('\n');
const NEW_UNLOCK = [
  '    const val = p.cmd === \'/解锁\';',
  '    const r = await writeKnownField(p.arg, val);',
  '    if (r.ok) {',
  '      /* 记一笔「最近解锁」——供 /撤销 一键回退（玩家打错字时不必背字段名） */',
  '      if (val) { try { await writeStat({ 最近解锁: p.arg }, \'记录最近解锁\'); } catch (e) { /* 记账失败不影响解锁 */ } }',
].join('\n');
if (s.includes(OLD_UNLOCK)) { s = s.replace(OLD_UNLOCK, NEW_UNLOCK); log.push('✔ /解锁 成功时记「最近解锁」'); }
else log.push('✘ /解锁 段未命中');

/* ② 新增 /撤销 分支（放在解锁分支之后） */
const ANCHOR = '  if (p.cmd === \'/物品\' || p.cmd === \'/行囊\' || p.cmd === \'/纳戒\') {';
const UNDO = [
  '  if (p.cmd === \'/撤销\') {',
  '    const sdU = readStatData() || {};',
  '    const lastU = String(sdU.最近解锁 || \'\').trim();',
  '    if (!lastU || !ALL_FIELDS.includes(lastU)) {',
  '      console.log(TAG, \'没有可撤销的解锁（「最近解锁」是空的）—— 先用 /已知 看已经翻了哪些，再 /回锁 <字段>\');',
  '      toast(\'warning\', \'没有可撤销的解锁（可用 /已知 查看）\', 7000);',
  '      return true;',
  '    }',
  '    const rU = await writeKnownField(lastU, false);',
  '    if (rU.ok) {',
  '      try { await writeStat({ 最近解锁: \'\' }, \'清空最近解锁\'); } catch (e) { /* 忽略 */ }',
  '      console.log(TAG, \'↩ 已撤销：\' + lastU + \' 退回未解锁（下一回合生效）\');',
  '      toast(\'info\', \'已撤销：\' + lastU, 8000);',
  '      setTimeout(() => dumpKnown(\'撤销后\'), 200);',
  '    } else {',
  '      console.warn(TAG, \'撤销失败：\' + rU.why);',
  '      toast(\'warning\', \'撤销失败：\' + rU.why, 8000);',
  '    }',
  '    return true;',
  '  }',
  '',
].join('\n');
if (s.includes(ANCHOR) && !s.includes("p.cmd === '/撤销'")) { s = s.replace(ANCHOR, UNDO + ANCHOR); log.push('✔ 新增 /撤销 分支'); }
else log.push(s.includes("p.cmd === '/撤销'") ? '– /撤销 已存在' : '✘ /撤销 插入锚点未命中');

/* ③ 命令表加 /撤销 */
const iCmd = s.indexOf('const CMD_NAMES');
if (iCmd >= 0 && !s.slice(iCmd, iCmd + 600).includes('撤销')) {
  s = s.replace(/const CMD_NAMES = \[/, "const CMD_NAMES = [\n  '撤销',");
  log.push('✔ CMD_NAMES 加「撤销」');
} else log.push('– CMD_NAMES 已含撤销或未找到');

/* ④ 帮助文本补一行 */
const iHelp = s.indexOf('const HELP');
if (iHelp >= 0 && !s.slice(iHelp, iHelp + 800).includes('撤销')) {
  s = s.replace(/(const HELP = [^\n]*(\n[^\n]*)*?`)/, (m) => m.replace(/\n\s*$/, '\n') + '  /撤销                退掉最近一次 /解锁（打错字就用它）\n`');
  log.push('✔ HELP 补 /撤销 一行');
} else log.push('– HELP 已含撤销或未找到');

fs.writeFileSync(F, s, 'utf8');
console.log(log.join('\n'));
