#!/usr/bin/env node
/**
 * _chk_greetings.mjs —— 开场楼结构体检
 *
 * 为什么要有它（2026-09-28 第四十一轮）：开场楼是**模型的模仿样本**（铁律 24），
 *   改一条就会连带影响演绎；而且每条的末尾都挂着一整块 `<Status_block>`（19 个字段 ＋ 角色子块），
 *   少一个字段、配对错一个标签，面板就会静默填不满 —— 这类错**肉眼看不出来**，必须脚本查。
 *
 * 查什么：① `first_mes` 是否是身份菜单首楼；② 每条 `alternate_greetings` 的
 *   19 个状态字段是否齐、`<角色N>`／`</角色N>` 是否配对、`<Status_block>` 是否成对、`<IdentityPick name="…"/>` 是否在位。
 *
 * 用法：node _chk_greetings.mjs [卡.json]        默认 `仙姝墮-角色卡（全书群像）.json`
 */
import { readFileSync } from 'node:fs';

const CARD = process.argv[2] ?? '仙姝墮-角色卡（全书群像）.json';
const card = JSON.parse(readFileSync(CARD, 'utf8').replace(/^\uFEFF/, ''));
const FIELDS = ['时间', '历时', '地点', '天气', '环境', '在场', '暗处', '身份', '修为', '状态',
  '目标', '局势', '线索', '近闻', '远闻', '危机', '关系刻度', '进度',
  // ⚠️ 2026-09-29 新增：`<实际发生>` —— 与「进度」同款**隐藏栏**（不在面板 FIELD_MAP 里）。
  //    模型把"本回合确实发生了"的锚点字段名写在这儿，状态机读它**自动写账本**（不弹提示、不问玩家）。
  '实际发生',
  // ⚠️ 2026-10-06 新增：`<破处>` 破处簿 —— 同样是隐藏栏（不在面板 FIELD_MAP 里）。
  //    格式「女名、破处者」，多个用「｜」；状态机读它 ⇒ 补名器成形 ＋ 写 `stat_data.名器归属`。
  '破处',
  // ⚠️ 2026-10-06 新增：`<纳戒>` —— 隐藏栏。格式「获得：X｜消耗：Y」；
  //    状态机读它 ⇒ 增删 `stat_data.inventory`（在此之前物品栏只进不出）。
  '纳戒'];

const list = [['first_mes', String(card.data.first_mes)]]
  .concat((card.data.alternate_greetings || []).map((g, i) => ['alt#' + i, String(g)]));

let bad = 0;
console.log('【开场楼结构体检】' + CARD + '\n');
for (const [tag, s] of list) {
  const nm = (s.match(/【身份】([^\n]{0,26})/) || [, '(身份菜单)'])[1];
  const menu = s.indexOf('<IdentityMenu/>') >= 0;
  const open = (s.match(/<角色\d+>/g) || []).length;
  const close = (s.match(/<\/角色\d+>/g) || []).length;
  const pick = /<IdentityPick name="[^"]+"\/>/.test(s);
  const miss = FIELDS.filter((f) => s.indexOf('<' + f + '>') < 0);
  const blk = (s.match(/<Status_block>/g) || []).length + (s.match(/<\/Status_block>/g) || []).length;
  const problems = [];
  if (!menu) {
    if (open !== close) problems.push(`角色块不配对 ${open}/${close}`);
    if (!pick) problems.push('缺 IdentityPick');
    if (miss.length) problems.push('缺字段 ' + miss.join('、'));
    if (blk !== 2) problems.push('Status_block 标签数 ' + blk);
  } else {
    if (!pick) problems.push('首楼缺 IdentityPick（菜单首楼应带一条缺省身份）');
  }
  if (problems.length) bad += 1;
  console.log(`  ${problems.length ? '✘' : '✔'} ${tag.padEnd(7)} ${String(s.length).padStart(5)} 字  ${nm}`
    + (menu ? '  [身份菜单首楼]' : `  角色块 ${open}｜字段 ${FIELDS.length - miss.length}/${FIELDS.length}`)
    + (problems.length ? '\n        ⇒ ' + problems.join('；') : ''));
}
console.log(bad ? `\n❌ ${bad} 条有问题` : '\n✅ 全部开场楼结构完整');
if (bad) process.exit(2);
