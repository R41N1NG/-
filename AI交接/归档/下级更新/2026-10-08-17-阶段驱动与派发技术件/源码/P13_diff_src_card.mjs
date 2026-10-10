/**
 * P13_diff_src_card.mjs —— 定位「src/text_data/_stage_drive.txt」与「卡内 id7 content」的第一处差异，
 * 并给出两侧上下文；这正是 gpt 要求「源码模板与注入模板另核 SHA 一致」的那一核。
 */
import fs from 'node:fs';

const SRC = 'E:/角色卡制作/仙姝堕/src/text_data/_stage_drive.txt';
const CARD = 'E:/角色卡制作/仙姝堕/最新角色卡/仙姝堕.json';

const srcRaw = fs.readFileSync(SRC, 'utf8').replace(/^\uFEFF/, '');
const src = srcRaw.replace(/\r\n/g, '\n');
const card = JSON.parse(fs.readFileSync(CARD, 'utf8'));
const e = card.data.character_book.entries.find((x) => x.id === 7).content.replace(/\r\n/g, '\n');

const out = { 源字符数: src.length, 卡内字符数: e.length, 逐字相等: src === e };

/* 归一化后再比：忽略尾部空白/换行差异，找出真正的文本差异位置 */
const a = src, b = e;
let i = 0;
while (i < Math.min(a.length, b.length) && a[i] === b[i]) i++;
let ja = a.length - 1, jb = b.length - 1;
while (ja > i && jb > i && a[ja] === b[jb]) { ja--; jb--; }

out.第一处差异偏移 = i;
out.源侧片段 = a.slice(Math.max(0, i - 60), i + 80);
out.卡侧片段 = b.slice(Math.max(0, i - 60), i + 80);
out.源侧尾部 = a.slice(ja - 40, ja + 1);
out.卡侧尾部 = b.slice(jb - 40, jb + 1);
out.差异长度 = { 源: ja - i + 1, 卡: jb - i + 1 };
out.差异内容 = { 源侧: a.slice(i, ja + 1), 卡侧: b.slice(i, jb + 1) };

/* 逐行比对：列出所有不同行 */
const la = a.split('\n'), lb = b.split('\n');
const 行差异 = [];
for (let k = 0; k < Math.max(la.length, lb.length); k++) {
  if (la[k] !== lb[k]) 行差异.push({ 行: k + 1, 源: (la[k] ?? '(无)').slice(0, 160), 卡: (lb[k] ?? '(无)').slice(0, 160) });
}
out.行数 = { 源: la.length, 卡: lb.length };
out.行差异 = 行差异.slice(0, 12);
out.行差异总数 = 行差异.length;

fs.writeFileSync('E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-17-阶段驱动与派发技术件/材料/17p_源模板与卡内注入件之差.json', JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify({ 源字符数: out.源字符数, 卡内字符数: out.卡内字符数, 逐字相等: out.逐字相等, 第一处差异偏移: out.第一处差异偏移, 差异内容: { 源侧: out.差异内容.源侧.slice(0, 200), 卡侧: out.差异内容.卡侧.slice(0, 200) }, 行差异总数: out.行差异总数, 前3行差异: out.行差异.slice(0, 3) }, null, 1));
