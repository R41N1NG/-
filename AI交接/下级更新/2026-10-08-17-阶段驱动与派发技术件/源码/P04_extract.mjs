/**
 * P04_extract.mjs —— 从 P03 的全卡扫描结果里抽「本刻候选里带战争词的条目」的**实际句子**，
 * 并给出 id7 / id56 / id123 在本刻快照下的闸门与在册判定。
 * 只摘录命中行（不导出整条正文），避免把照录类成人正文带出去。
 */
import fs from 'node:fs';

const BASE = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-17-阶段驱动与派发技术件';
const sweep = JSON.parse(fs.readFileSync(BASE + '/材料/17e_渲染矩阵与全卡入口扫描.json', 'utf8'));

const pick = (id) => sweep.全卡扫描.全部条目明细.find((x) => x.id === id);

const out = {
  扫描口径: sweep.扫描文本口径,
  本刻候选数: sweep.全卡扫描.本刻候选数,
  带战争词的候选: sweep.全卡扫描.候选里输出战争词的条目,
  三条被点名的条目: [7, 56, 123].map((id) => {
    const x = pick(id);
    return x ? {
      id: x.id, 标题: x.标题, 在册: x.在册, 常驻: x.常驻, 有闸门: x.有闸门,
      闸门通过: x.闸门通过, 触发词命中: x.触发词命中, 进入本刻上下文: x.进入本刻上下文,
      正文含战争词: x.正文含战争词, content字符数: x.content字符数,
    } : null;
  }),
  闸门求值抛错: sweep.全卡扫描.闸门求值抛错的条目,
  本刻候选清单: sweep.全卡扫描.候选清单,
};
fs.writeFileSync(BASE + '/材料/17f_关键条目战词栏.json', JSON.stringify(out, null, 2), 'utf8');

console.log('候选数 ' + out.本刻候选数);
for (const c of out.带战争词的候选) {
  console.log('--- id' + c.id + ' ' + c.标题 + ' 常驻=' + c.常驻 + ' 触发词=' + JSON.stringify(c.触发词));
  for (const s of c.战争句) console.log('    · ' + s);
}
console.log('--- 三条点名 ---');
for (const t of out.三条被点名的条目) console.log(JSON.stringify(t));
