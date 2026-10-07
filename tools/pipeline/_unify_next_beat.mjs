#!/usr/bin/env node
/**
 * _unify_next_beat.mjs —— 把「下一步剧情推进方向／剧情推进／接下来的剧情发展」统一成 `- **剧情推进**`
 *   （主人 2026-09-30：「都统一为 - **剧情推进**，并在最后加上括号注」）
 *
 * 【括号注为什么写成"行为约束"而不是"注入约束"】（已当面向主人说明）
 *   · `@@if` 闸门与触发词决定**注入**，那是脚本/插件的事，**模型管不了**；
 *     所以写「必须在 剧情x已完成后才可注入」对模型是无效甚至有害的指令（它会误以为"这段不用我管/我已经完成了"）。
 *   · 写「本回合不得写进正文」是**模型能执行**的行为约束 ⇒ 采用这一种。
 *   · 真正能保证"下次才出现"的办法是**把下一步的内容放进下一条**（下一条有自己的链式闸门），
 *     本条只留「演到哪为止 ＋ 关键词牵引」。关键词是硬机制：模型写出来 ⇒ 下一条的触发词命中 ⇒ 下一回合注入。
 *
 * 用法：node _unify_next_beat.mjs [--apply]
 */
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');
const D = 'E:\\角色卡制作\\仙姝堕\\';
const F = D + '仙姝墮-世界书.json';
const data = JSON.parse(readFileSync(F, 'utf8'));
const book = data.entries || data;
const strip = (c) => String(c).replace(/^(\s*〔待解锁〕)+/, '');
const NOTE = '（**本回合只演完本段：不要把这句推进内容写进正文**，它属于下一次对话。）';
const RE = /^-\s*(\*\*)?(下一步剧情推进方向|剧情推进方向|剧情推进|接下来的剧情发展|后续剧情)(\*\*)?\s*[：:]\s*/;
const log = [];
let n = 0;
for (const e of Object.values(book)) {
  const L = String(e.content).split('\n');
  let hit = false;
  for (let i = 0; i < L.length; i++) {
    const m = RE.exec(L[i].trim());
    if (!m) continue;
    const body = L[i].trim().replace(RE, '');
    const clean = body.replace(/（\*\*本回合只演完本段[\s\S]*?）$/, '').replace(/（剧情推进内容[\s\S]*?）$/, '');
    L[i] = '- **剧情推进**：' + clean + NOTE;
    hit = true; n++;
    log.push('   · [' + strip(e.comment).slice(0, 22) + '] 旧标签「' + m[2] + '」 → **剧情推进**（并补行为约束括号）');
  }
  if (hit) e.content = L.join('\n');
}
console.log('统一了 ' + n + ' 处：\n' + log.join('\n'));
if (!APPLY) { console.log('\n（预演，未写盘）'); process.exit(0); }
copyFileSync(F, F + '.bak-nextbeat');
const out = JSON.stringify(data, null, 2) + '\n';
JSON.parse(out);
writeFileSync(F, out, 'utf8');
console.log('\n✅ 已写盘（备份 .bak-nextbeat）\n──── 改后的推进句 ────');
for (const e of Object.values(book)) {
  String(e.content).split('\n').filter((l) => /^-\s*\*\*剧情推进\*\*/.test(l.trim())).forEach((l) => console.log('   [' + strip(e.comment).slice(0, 22) + '] ' + l.trim()));
}
