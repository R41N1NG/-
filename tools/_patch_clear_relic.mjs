/* 一次性补丁：/回锁 <名器名>（不带后缀）＝整件退回（成形 ＋ 四个阶段条）
 *  玩家反馈：「这个关不了好像」——只 /回锁 「＜名器＞成形」时，面板仍会亮纹章：
 *  因为 xsdRelicState 把「任一阶段条为真」也算成形（脚本成形时会自动派发一阶段条）。
 */
import fs from 'node:fs';

const F = '卡片脚本/状态机.js';
let s = fs.readFileSync(F, 'utf8');
const log = [];

const ANCHOR = "    const val = p.cmd === '/解锁';";
if (!s.includes('整件退回') && s.includes(ANCHOR)) {
  const BLOCK = [
    "    /* /回锁 <名器名>（不带后缀）＝**整件退回**：把「<名器>成形」与四个阶段条一起退回。",
    "       为什么要它：只退「成形」时面板仍会亮纹章 —— 判据里「任一阶段条为真」也算成形，",
    "       而脚本在成形时会自动派发一阶段条（玩家反馈「这个关不了好像」就是这个）。 */",
    "    if (p.cmd === '/回锁') {",
    "      const baseRelic = String(p.arg).replace(/[「」\\s]/g, '');",
    "      if (baseRelic && ALL_FIELDS.includes(baseRelic + '成形')) {",
    "        const targets = [baseRelic + '成形'];",
    "        for (const cn of ['一', '二', '三', '四']) { const fx = baseRelic + cn + '阶段'; if (ALL_FIELDS.includes(fx)) targets.push(fx); }",
    "        const patchKnown = {};",
    "        for (const fx of targets) patchKnown[fx] = false;",
    "        const rr = await writeStat({ known: patchKnown }, `整件退回 ${baseRelic}`);",
    "        if (rr && rr.ok) {",
    "          console.log(TAG, `↩ ${baseRelic} 整件已退回（${targets.length} 条）：${targets.join('、')} —— 下一回合生效`);",
    "          toast('info', `${baseRelic} 整件已退回`, 8000);",
    "        } else {",
    "          console.warn(TAG, `整件退回失败：${(rr && rr.why) || '写入接口不可用'}`);",
    "          toast('warning', `整件退回失败：${(rr && rr.why) || '写入接口不可用'}`, 8000);",
    "        }",
    "        setTimeout(() => dumpKnown('整件退回后'), 200);",
    "        return true;",
    "      }",
    "    }",
    '',
    ANCHOR,
  ].join('\n');
  s = s.replace(ANCHOR, BLOCK);
  log.push('✔ 状态机：新增「/回锁 <名器名> = 整件退回」');
} else log.push(s.includes('整件退回') ? '– 已存在' : '✘ 锚点未命中');

/* HELP 里补一句说明 */
if (!s.includes('整件退回')) log.push('（无需补 HELP）');
else if (!/回锁 <名器名>/.test(s)) {
  s = s.replace(/(  \/回锁[^\n]*\n)/, '$1  回锁 <名器名>       整件退回：成形 ＋ 四个阶段条一起关（只退「成形」纹章仍会亮）\n');
  log.push('✔ HELP 补「整件退回」说明');
} else log.push('– HELP 已含说明');

fs.writeFileSync(F, s, 'utf8');
console.log(log.join('\n'));
