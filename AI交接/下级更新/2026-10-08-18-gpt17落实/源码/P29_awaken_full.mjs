/**
 * P29_awaken_full.mjs —— 修正 P28 的过滤缺口：**只排除通用纪律句**，其余命中全部保留并细分。
 * （P28 把"B 类但没识别出对象"的条目也丢掉了，结果漏报了 id24/uid9 那条「须依赖「同源」气息方能引爆」
 *   —— 这正是主人要找的同类表述之一。本件把它补回来，并给出完整非噪声清单。）
 * 只读。
 */
import fs from 'node:fs';

const SRC = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-18-gpt17落实/材料/20a_觉醒条件扫描.json';
const OUT = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-18-gpt17落实/材料/20b_觉醒条件_完整非噪声清单.json';

const j = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const 噪声 = /每一阶段须由剧情实际推进到才可呈现/;

const 全部 = j.明细;
const 噪声项 = 全部.filter((h) => 噪声.test(h.句));
const 非噪声 = 全部.filter((h) => !噪声.test(h.句));

const 点名 = 非噪声.filter((h) => (h.依赖对象 || []).length > 0);
const B未点名 = 非噪声.filter((h) => (h.依赖对象 || []).length === 0 && h.类型.indexOf('B') === 0);
const 其它 = 非噪声.filter((h) => (h.依赖对象 || []).length === 0 && h.类型.indexOf('B') !== 0);

const 汇总 = {
  扫描件: SRC, 原始命中: 全部.length,
  通用纪律句_已排除: 噪声项.length,
  非噪声总数: 非噪声.length,
  一_点名依赖对象: 点名, 二_B类未点名: B未点名, 三_其它条件词: 其它,
};
fs.writeFileSync(OUT, JSON.stringify(汇总, null, 2), 'utf8');

console.log('原始 ' + 全部.length + ' 处｜通用纪律句 ' + 噪声项.length + ' 处（已排除）｜**非噪声 ' + 非噪声.length + ' 处**\n');
const 显示 = (标题, arr) => { console.log('══ ' + 标题 + '（' + arr.length + '）══'); for (const h of arr) console.log('· [' + h.类型 + '] ' + h.来源 + '\n    ' + h.句.slice(0, 150) + (h.依赖对象.length ? '\n    对象：' + h.依赖对象.join('、') : '')); console.log(''); };
显示('一、点名依赖对象', 点名);
显示('二、B 类「须/唯有…方能」（未点名对象）', B未点名);
显示('三、其它条件词（触发条件/成形条件…）', 其它);
