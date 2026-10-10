/**
 * P28_filter_awaken.mjs —— 把 P27 的 102 处命中**去噪 + 归类**，只留真正"条件型／依赖型"的：
 *   ① 去掉阶段条通用说明「每一阶段须由剧情实际推进到才可呈现」（那是卡内纪律，不是"需要某物"）；
 *   ② 只留 A（条件词）／C（依赖…方能）／D（非…不能），以及 B 里**识别出依赖对象**的；
 *   ③ 按"是否点名某个可依赖对象（气／功法／人物）"排序，便于主人一眼看出与「需要龙气」同类的那几处。
 * 只读。
 */
import fs from 'node:fs';

const SRC = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-18-gpt17落实/材料/20a_觉醒条件扫描.json';
const OUT = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-18-gpt17落实/材料/20b_觉醒条件_去噪归类.json';

const j = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const 噪声 = /每一阶段须由剧情实际推进到才可呈现|须由剧情实际推进/;

const 保留 = j.明细.filter((h) => {
  if (噪声.test(h.句)) return false;
  if (h.类型.indexOf('A') === 0) return true;
  if (h.类型.indexOf('C') === 0) return true;
  if (h.类型.indexOf('D') === 0) return true;
  return (h.依赖对象 || []).length > 0;
});

/* 归类：点名了"可依赖对象"的排前面 */
const 点名 = 保留.filter((h) => (h.依赖对象 || []).length > 0);
const 未点名 = 保留.filter((h) => !(h.依赖对象 || []).length);

const 汇总 = {
  扫描: SRC,
  原始命中: j.命中总数,
  去噪后: 保留.length,
  其中点名依赖对象: 点名.length,
  去噪掉: j.命中总数 - 保留.length,
  点名依赖对象者: 点名,
  其它条件型: 未点名,
};
fs.writeFileSync(OUT, JSON.stringify(汇总, null, 2), 'utf8');

console.log('原始 ' + j.命中总数 + ' 处 ⇒ 去噪后 ' + 保留.length + ' 处（点名依赖对象 ' + 点名.length + ' 处；去掉通用纪律句 ' + 汇总.去噪掉 + ' 处）\n');
console.log('══ 一、点名了「依赖某个对象」的条件（与"需要龙气"同类，重点看这里）══');
for (const h of 点名) console.log('· [' + h.类型 + '] ' + h.来源 + '\n    句：' + h.句 + '\n    对象：' + h.依赖对象.join('、'));
console.log('\n══ 二、其它条件型（没点名具体对象，多为"达成条件/触发条件"句式）══');
for (const h of 未点名) console.log('· [' + h.类型 + '] ' + h.来源 + '\n    句：' + h.句);
