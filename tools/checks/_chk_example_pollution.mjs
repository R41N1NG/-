#!/usr/bin/env node
/**
 * _chk_example_pollution.mjs —— 「示例污染」门禁（2026-10-07 立）
 *
 * 起因（主人真机报的两起，同一类根因）：
 *   ① `<纳戒>` 的写法示例里写了真物品名「醉春风」⇒ 模型每楼照抄 `消耗：醉春风×1`，两坛酒被抄光；
 *   ② `<破处>` 的写法示例里写了真名「孤月、赵无忧｜叶红缨、残阳老怪」⇒ 若照抄，会凭空记下两处破身、
 *      连带两件名器成形、归属还写错人。
 * 共同点：**给模型看的「示例值」里带了真实专名**，而示例就在可写栏旁边 ⇒ 模型把它当模板复现。
 *
 * 本门禁只查一类事：**「可写栏的示例标签里，出现了真实专名」**。
 *   判定范围：卡内所有对模型说话的表面（depth_prompt、state 栏相关条目、开场白、常驻条、description 等）。
 *   命中条件：同一行（或它的上一行）出现「例／示例／例如／写法」，**且**该行里某个**可写栏标签**的
 *             标签体内含真实专名（物品名／名器名／锚点名／女角名）。
 *   白名单：
 *     · 「只能写这 N 位：…」这类**允许值枚举**（不是示例）—— 因为它不在可写栏标签体内；
 *     · 开场楼里的真实状态栏（那是「本楼真的如此」，不是示例）—— 行内没有「例／示例」字样即不判。
 * 用法：& 'C:\Program Files\nodejs\node.exe' tools/checks/_chk_example_pollution.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'E:/角色卡制作/仙姝堕';
/* 允许传一个别的卡路径进来（用于「门禁自证」：拿带污染的历史卡跑一遍，应当报错） */
const CARD = process.argv[2] || path.join(DIR, '最新角色卡', '仙姝堕.json');
const SM = path.join(DIR, '卡片脚本', '状态机.js');

/* 可写栏标签（状态栏里模型要填的那些） */
const WRITABLE = ['实际发生', '破处', '纳戒', '进度', '时间', '历时', '地点', '天气', '环境', '在场', '暗处',
  '修为', '状态', '目标', '局势', '线索', '近闻', '远闻', '危机', '关系刻度', '阶段总结'];

const rep = [];
let fail = 0;
const ck = (ok, msg, extra) => { rep.push(`${ok ? '✔' : '✘'} ${msg}${extra ? ' ｜ ' + extra : ''}`); if (!ok) fail += 1; };

/* 真实专名清单：全部从卡与状态机现取，不另编 */
const card = JSON.parse(fs.readFileSync(CARD, 'utf8'));
/* 兼容两种卡形：卡 JSON（charadata 包在 `data` 下）／旧式 ST 角色文件（顶层就是字段） */
const cdata = card.data || card;
const entries = cdata.character_book ? (cdata.character_book.entries || []) : [];
const sm = fs.readFileSync(SM, 'utf8');
function arrOf(txt, name) {
  const i = txt.indexOf('const ' + name + ' = [');
  if (i < 0) return '';
  let d = 0, j = i + ('const ' + name + ' = ').length;
  for (; j < txt.length; j += 1) { if (txt[j] === '[') d += 1; else if (txt[j] === ']') { d -= 1; if (d === 0) { j += 1; break; } } }
  return txt.slice(i, j);
}
const ANCHORS = [...arrOf(sm, 'FIELD_TABLE').matchAll(/kind:\s*'[^']+',\s*name:\s*'([^']+)'/g)].map((m) => m[1]);
const RELICS = [...arrOf(sm, 'HOLDER_TO_RELIC').matchAll(/'([^']+)'/g)].map((m) => m[1]);
const ITEMS = (entries.find((e) => String(e.comment).includes('状态栏模板')) ? [] : []);
/* 物品名从状态机的起手行囊表里取（避免把剧情里出现的普通名词也算进来） */
const INV_NAMES = [...arrOf(sm, 'defaultInventoryRaw' in {} ? '' : 'FIELD_TABLE')]
  .concat([...sm.matchAll(/name:\s*'([^']+)',\s*desc:\s*'[^']*(两坛|佳酿|佩剑|念珠|密符|残篇|秘录)/g)].map((m) => m[1]));
const CAST = ['孤月', '叶红缨', '闻观语', '楚灵夜', '雨霏柔', '苏瑶', '苏玲', '云织梦', '柳含烟',
  '花芷凝', '苏倾寒', '慕容清歌', '顾云舒', '陆烬颜', '残阳老怪', '病相思'];
const PROPER = [...new Set([...ANCHORS, ...RELICS, ...ITEMS, ...INV_NAMES, ...CAST])].filter((x) => x && x.length >= 2);

/* 表面集合 */
const surfaces = [];
surfaces.push({ name: 'depth_prompt', lines: String((cdata.extensions && cdata.extensions.depth_prompt && cdata.extensions.depth_prompt.prompt) || '').split('\n') });
surfaces.push({ name: 'description', lines: String(cdata.description || '').split('\n') });
surfaces.push({ name: 'mes_example', lines: String(cdata.mes_example || '').split('\n') });
surfaces.push({ name: 'first_mes', lines: String(cdata.first_mes || '').split('\n') });
((cdata.alternate_greetings || []) || []).forEach((g, i) => surfaces.push({ name: `开场白#${i + 1}`, lines: String(g).split('\n') }));
entries.filter((e) => e.constant || /状态栏模板|状态字段表|收尾契约|卡、运行规则|信息闸门|文风|阶段驱动/.test(String(e.comment)))
  .forEach((e) => surfaces.push({ name: `条目〈${String(e.comment).slice(0, 26)}〉`, lines: String(e.content || '').split('\n') }));

const SAMPLE = /(例\s*[:：]|例：|示例|例如|写法示例|格式示例)/;
const hits = [];
for (const s of surfaces) {
  s.lines.forEach((line, idx) => {
    const prev = idx > 0 ? s.lines[idx - 1] : '';
    if (!SAMPLE.test(line) && !SAMPLE.test(prev)) return;
    for (const tag of WRITABLE) {
      const m = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(line);
      if (!m) continue;
      const body = m[1];
      const names = PROPER.filter((n) => body.includes(n));
      /* 允许「无」「某物」「某女」「X」这类占位 */
      if (names.length) hits.push({ where: s.name, lineNo: idx + 1, tag, names: [...new Set(names)], text: line.trim().slice(0, 160) });
    }
  });
}

rep.push(`卡：${CARD}`);
rep.push(`扫描表面 ${surfaces.length} 个｜可写栏标签 ${WRITABLE.length} 个｜专名清单 ${PROPER.length} 条`);
ck(hits.length === 0, '可写栏的**示例**里没有出现真实专名（示例必须用「某物／某女／X」这类占位）',
  hits.slice(0, 6).map((h) => `${h.where} 第 ${h.lineNo} 行 <${h.tag}>：${h.names.join('、')}`).join('；'));

/* 附加自查：示例必须同时写明「不许照抄」这类禁令（防下一次又有人写成真实值） */
{
  const text = surfaces.flatMap((s) => s.lines).join('\n');
  ck(/不许照抄|绝不许照抄|只有写法|只是格式/.test(text), '提示词里有「不许照抄示例」的明文禁令');
  ck(/与正文对得上|在正文里找不到|正文里没有这一笔/.test(text), '提示词写明了「必须与正文对得上、无据会被丢弃」');
}

console.log(rep.join('\n'));
console.log(`\n${fail === 0 ? '✅ 通过：没有示例污染' : '❌ ' + fail + ' 项未通过'}`);
process.exit(fail === 0 ? 0 : 2);
