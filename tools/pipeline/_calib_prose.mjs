#!/usr/bin/env node
/**
 * _calib_prose.mjs —— 用**原文全篇**校准文风基准，写 `_prose_baseline.json`
 *
 * 为什么必须校准（2026-09-28 第四十七轮）：
 *   我第一版硬关卡是"零容忍词表 ＋ 死阈值"，一跑就误伤 ——
 *     · 原文自己就写「一道火红身影」「一丝缝隙」 ⇒ 词表不能零容忍；
 *     · `【心智姿态】`那种**标签行条目体**、以及开场白里的 `<Status_block>`，本来就不是散文，
 *       拿"逗号密度"去量它们必然全红。
 *   ⇒ 改成**以原文为基准的相对判据**：先量原文每类的密度，卡关时只判"明显超出原文"。
 *
 * 用法：node _calib_prose.mjs [原文.txt]
 *   默认读 `[仙姝墮] 1-49+番外 作者：_肉山佛.txt`（在 `E:\火狐下载\`）
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const SRC = process.argv[2] || 'E:\\火狐下载\\[仙姝墮] 1-49+番外 作者：_肉山佛.txt';
if (!existsSync(SRC)) { console.error('找不到原文：' + SRC); process.exit(2); }
/* 原文里每行前面有全角缩进，先压平；再只取正文（跳过简介与作者信息） */
const raw = readFileSync(SRC, 'utf8').replace(/^\uFEFF/, '');
const body = raw.split('\n').map((l) => l.replace(/^[\s\u3000　]+/, '')).filter((l) => l.trim()).join('\n');
console.log('原文正文 ' + body.length + ' 字');

/* 与 _chk_prose.mjs 保持**同一张词表**（改词表两边一起改；这里是"量原文"，那边是"卡关卡"） */
export const LEX = [
  ['时间虚指', /(?:就在|在|于)?(?:那一瞬间|这一瞬间|那一刹那|这一刻|那一刻|下一秒|下一瞬|下一刻|转瞬之间|电光石火间|一时之间|一时间|刹那间|倏然间|须臾之间)/g],
  ['程度垫词', /(?:整个人(?:微微|猛地|不由得|不由|不禁)?|不由得|情不自禁地?|忍不住地?|下意识地?|鬼使神差|无端地?|莫名地?|极其|近乎于?|极度)/g],
  ['虚态量词', /(?<![第万同一初每这那一])[一二两三四五六七八九十](?:丝|抹|股|缕|道|阵|团|汪|截|记|丛|分)(?![\u4e00-\u9fa5]*?(?:步|计|律|同|心|起|直|切|贯|体|定))/g],
  ['动量词动作', /(?:(?:看|瞥|扫|望|瞅)了?[一二两三]眼|(?:冷哼|冷笑|轻笑|轻叹|闷哼|怒喝|娇嗔)了?[一二两三]?声|(?:退后|后退|后撤|踏前|抢前|跨前|逼近)了?[一二两三四五六七八九十]步|(?:拔地|腾空)[一二两三四五六七八九十]丈|(?:愣|顿|停|呆|迟疑)了?[一二两三]?下)/g],
  ['神态短句', /(?:嘴角(?:勾起|扬起|泛起|浮起)|眼中(?:闪过|掠过|划过)|眼底(?:闪过|掠过)|眉头(?:微蹙|微皱)|(?:微微|轻轻|浅浅)地?(?:一笑|笑|皱眉)|(?:语气|语调|尾音|声音)(?:里|中|间)?(?:带着|透着|含着|染上))/g],
  ['抽象喻体', /(?:如同|仿佛|宛如|好似|像是)(?:被)?(?:命运|宿命|灵魂|审判|深渊的|某种不可|无形的枷锁|残酷的真相|无声的誓言|一场|一次注定)/g],
  ['冗杂标签', /(?:他|她|对方)?(?:说道|说道：|开口道|出声道|低声道|轻声说道|沉声道)(?=[：:“」])/g],
  ['破折号总结', /(?:^|\n)\s*——[^\n]{2,40}(?:。|！|……)\s*(?:\n|$)/g],
  ['现代口播腔', /(?:^|[\n。！？；，]|「)(?:说白了|说到底)|你(?:手里|身上)有(?:什么|哪些)|你的性子|你怎么想|要不要我|总之你|记住一点/g],
  ['同义堆叠', /(?:剧烈的|强烈的|猛烈的|极致的|难以言喻的|无法言说的)(?:、|，)?(?:剧烈的|强烈的|猛烈的|极致的|难以言喻的|无法言说的)?(?:的)?(?:快感|感觉|刺激|情绪|冲动)/g],
  /* ★ 质检员复检逼出来的三类（2026-09-28）：字面 0 命中但套路全中，且完全可自动量化 */
  ['叠词量词', /一([圈寸层丈步节片缕])一\1/g],
  ['套话骨架·咬唇牙关', /(?:牙关|牙齿|下唇|嘴唇|唇瓣)[^，。；！？\n]{0,4}(?:咬|抿)/g],
  ['套话骨架·喉间溢出', /(?:喉间|喉咙|喉头|齿缝)[^，。；！？\n]{0,6}(?:溢出|挤出|漏出|逸出|咽|漏)/g],
  ['套话骨架·咽下那口气', /(?:把|将)[^，。；！？\n]{0,4}(?:那|这)[^，。；！？\n]{0,2}(?:口气|声|呻吟|呜咽|喘息)[^，。；！？\n]{0,4}(?:咽|压)下/g],
];

const per1k = (n, len) => +(n / len * 1000).toFixed(2);
const lex = {};
for (const [cls, re] of LEX) lex[cls] = per1k((body.match(re) || []).length, body.length);

const comma = per1k((body.match(/[，,]/g) || []).length, body.length);
const period = per1k((body.match(/[。！？]/g) || []).length, body.length);
const sents = body.split(/[。！？]/).filter((s) => s.trim().length);
const sent = +(sents.reduce((a, s) => a + s.length, 0) / sents.length).toFixed(2);

/* ★ 章级「句号/逗号」比值 —— 这才是**判短句**该用的线（全篇均值会被长描写段拉低、冤枉对话戏）。
 *   实测（2026-09-28）：原文 50 章，章级均值 0.440｜中位 0.424｜**最高 0.624（第十章）**｜最低 0.321。 */
const chaps = [];
{
  let cur = { name: '卷首', buf: [] };
  for (const l of raw.split('\n')) {
    const mm = /^\s*第([一二三四五六七八九十百]+)章/.exec(l);
    if (mm) { chaps.push(cur); cur = { name: '第' + mm[1] + '章', buf: [] }; continue; }
    cur.buf.push(l);
  }
  chaps.push(cur);
}
const chapRatios = chaps.map((c) => {
  const t = c.buf.join('');
  const cN = (t.match(/[，,]/g) || []).length, pN = (t.match(/[。！？]/g) || []).length;
  return { name: c.name, n: t.length, ratio: t.length > 500 && cN ? +(pN / cN).toFixed(3) : null };
}).filter((x) => x.ratio);
const rv = chapRatios.map((x) => x.ratio).sort((a, b) => a - b);
const chapMax = rv[rv.length - 1], chapMid = rv[Math.floor(rv.length / 2)];
const chapMaxName = (chapRatios.find((x) => x.ratio === chapMax) || {}).name;

const out = {
  来源: SRC,
  字数: body.length,
  校准时间: new Date().toLocaleString('zh-CN'),
  节奏: { 逗号每千字: comma, 句号每千字: period, 平均句长: sent },
  章级句号逗号比: { 均值: +(rv.reduce((a, b) => a + b, 0) / rv.length).toFixed(3), 中位: chapMid, 最高: chapMax, 最高所在章: chapMaxName, 最低: rv[0], 章数: rv.length },
  词表每千字: lex,
};
writeFileSync('_prose_baseline.json', JSON.stringify(out, null, 2), 'utf8');
console.log('\n【原文基准】');
console.log('  节奏：逗号 ' + comma + '/千字｜句号 ' + period + '/千字｜平均句长 ' + sent);
console.log('  章级句号/逗号比：均值 ' + out.章级句号逗号比.均值 + '｜中位 ' + chapMid + '｜**最高 ' + chapMax + '（' + chapMaxName + '）**｜最低 ' + rv[0] + '（共 ' + rv.length + ' 章）');
console.log('  词表：');
for (const [k, v] of Object.entries(lex)) console.log('    ' + k.padEnd(6) + ' ' + String(v).padStart(7) + ' /千字');
console.log('\n✅ 已写 _prose_baseline.json');
