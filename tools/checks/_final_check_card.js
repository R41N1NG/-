// 终检：卡内全部启用内容的用词与剧透纪律
const fs = require('fs');
const path = require('path');
const DIR = 'E:\\角色卡制作\\仙姝堕';
const card = JSON.parse(fs.readFileSync(path.join(DIR, '仙姝墮-角色卡（全书群像）.json'), 'utf8').replace(/^\uFEFF/, ''));
const d = card.data;

// 1) 禁用词：只统计「实质使用」，排除禁用词清单/纪律声明所在的句子
const BAN = ['玄阳凤髓', '龙根', '凶器', '茎身', '阳器', '阳物', '阳根', '器物'];
const ALLOW_CTX = /禁用|一律改写|不得使用|不可使用|禁写|禁止|改写为/;
const NARRATIVE = [
  d.description, d.scenario, d.first_mes, d.mes_example,
  ...d.alternate_greetings,
  ...d.character_book.entries.filter(e => e.enabled).map(e => e.comment + '\n' + e.content)
].join('\n');

const bad = [];
NARRATIVE.split('\n').forEach((line, i) => {
  for (const w of BAN) {
    if (line.includes(w) && !ALLOW_CTX.test(line)) bad.push(`禁用词「${w}」用于实质内容：${line.trim().slice(0, 70)}`);
  }
});
console.log('【禁用词】' + (bad.length ? '\n  ' + bad.join('\n  ') : '✅ 无实质使用（仅出现在纪律声明中）'));

// 2) 剧透词：只在「启用且**无条件注入**」的条目里查
//    ⚠️ 2026-09-27（身份切换）：挂了 `@@if` 的条目是**条件注入** —— 闸门为假时 ST-PT 会把整条 splice 掉，
//       一个字都不进上下文。所以带闸门的条目单列一行（信息级），不算违规；
//       否则「天姝令与奴种」这类**身份专属**条目一启用就会被误报。
const SPOIL = ['溟龙神女', '月奴', '欲凰神女', '孽莲神女', '惑心神女', '神女殿', '天姝榜', '奴种', '昨日欢', '邪心天目', '千心一欲', '邪欲凤翼', '拓印'];
const isGated = (e) => String(e.content).startsWith('@@if');
const gate = new Set();
const gatedHit = new Set();
d.character_book.entries.filter(e => e.enabled).forEach(e => {
  for (const s of SPOIL) if (e.content.includes(s)) (isGated(e) ? gatedHit : gate).add(`id${e.id} ${e.comment} → ${s}`);
});
console.log('【启用条目剧透词·无条件注入】' + (gate.size ? '\n  ' + [...gate].join('\n  ') : '✅ 无'));
console.log('【启用条目剧透词·带闸门条件注入】' + (gatedHit.size ? `（${gatedHit.size} 处，闸门为假时不进上下文）\n  ` + [...gatedHit].join('\n  ') : '✅ 无'));

// 3) 停用条目是否都带标记
const off = d.character_book.entries.filter(e => !e.enabled);
  // [initvar] 是 MVU 的初值表：必须停用（靠代码读、不进上下文），名字又必须保持 [initvar] 前缀 ⇒ 豁免标记要求
  const unmarked = off.filter(e => !e.comment.startsWith('〔待解锁〕') && !e.comment.startsWith('[initvar]'));
console.log('【停用条目】' + off.length + ' 条，未带标记的 ' + unmarked.length + ' 条 ' + (unmarked.length ? '❌ ' + unmarked.map(e => e.comment).join('、') : '✅'));

// 4) 关键字段
console.log('【字段】description ' + d.description.length + ' 字 ｜ scenario ' + d.scenario.length + ' 字 ｜ first_mes ' + d.first_mes.length + ' 字 ｜ alt ' + d.alternate_greetings.length + ' 条 ｜ mes_example ' + d.mes_example.length + ' 字/' + (d.mes_example.match(/<START>/g) || []).length + ' 场景');
console.log('【世界书】' + d.character_book.entries.length + ' 条（启用 ' + d.character_book.entries.filter(e => e.enabled).length + '／停用 ' + off.length + '）');
// ⚠️ 2026-09-27：比较前先剥掉首行的 `@@if …` 闸门条件 —— 挂了闸门的条目正文都以同一段前缀开头，
//    不剥的话它们会被误判成「重复条目」（实测误报 4 处）。
// ⚠️ 2026-09-27：比较基准改成「标题 ＋ 正文开头 40 字」。
//    只比正文开头会把【名器·阶段】那一批误判成重复 —— 它们常常共用同一句起手式（「元阴被破、花宫门户被顶到…」）。
const ukeys = new Set(d.character_book.entries.map(e => e.comment + '|' + String(e.content).replace(/^@@if[^\n]*\n/, '').slice(0, 40)));
console.log('【重复条目】' + (ukeys.size === d.character_book.entries.length ? '✅ 无' : '⚠ 有 ' + (d.character_book.entries.length - ukeys.size) + ' 处开头重复'));

// 5) {{user}} 是否在正文出现
const uCount = (NARRATIVE.match(/\{\{user\}\}/g) || []).length;
console.log('【{{user}} 引用】' + uCount + ' 处 ' + (uCount ? '✅' : '⚠ 未使用'));
