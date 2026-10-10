/**
 * P22_verify_nodragon.mjs —— 复核「九幽玄阴穴需要龙气」是否已从**候选卡**里清干净：
 *   ① 逐条列出候选卡里凡含「龙气」的位置（条目 / 脚本），并标它属哪一类：
 *      · 需要型（"必须/唯有/须依赖/方能…"）⇒ 应 **0 处**
 *      · 现象/意象型（龙角、龙鳞、龙纹、冰龙、龙气逆流）⇒ 保留，列出来供主人裁
 *      · 别的事项（天龙皇朝、九皇子、《极乐龙体诀》、太上守郡符、九幽玄阴脉共鸣）⇒ 不该动
 *   ② 断言：九幽玄阴穴相关的三条（名器条 / 阶段条 / 面板脚本）里**没有**"需要型"表述。
 */
import fs from 'node:fs';

const CARD = 'E:/角色卡制作/仙姝堕/_staging_2026-10-08-18/仙姝堕.json';
const OUT = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-18-gpt17落实/材料/18t_候选卡龙气清点.json';

const card = JSON.parse(fs.readFileSync(CARD, 'utf8'));
const es = card.data.character_book.entries;
const scripts = (card.data.extensions.tavern_helper && card.data.extensions.tavern_helper.scripts) || [];

const 需要型 = /(唯有|必须|非[^，。；]{0,12}不能|须依赖|依赖同源|方能引动|方能引爆|需[^，。；]{0,6}龙气|龙气贯体|至阳龙气方能)/;
const 相关名 = /九幽玄阴/;

const 命中 = [];
const 检查文本 = (来源, 类型, text) => {
  const s = String(text || '');
  let i = s.indexOf('龙气');
  while (i >= 0) {
    const 窗 = s.slice(Math.max(0, i - 60), i + 60).replace(/\s+/g, ' ');
    const 相关 = 相关名.test(窗);
    let 类 = '其他事项（不该动）';
    if (需要型.test(窗) && 相关) 类 = '★需要型（应已删净）';
    else if (相关) 类 = '现象/意象或机制（保留，待主人裁）';
    else if (/龙角|龙鳞|龙纹|冰龙|龙涎/.test(窗)) 类 = '现象/意象（保留）';
    命中.push({ 来源, 类型, 类, 上下文: 窗 });
    i = s.indexOf('龙气', i + 1);
  }
};

for (const e of es) 检查文本('id' + e.id + ' ' + e.comment, '世界书条目', e.content);
for (const sc of scripts) 检查文本('脚本·' + sc.name, '卡内脚本', sc.content);
检查文本('depth_prompt', '卡字段', ((card.data.extensions.depth_prompt || {}).prompt) || '');
检查文本('scenario', '卡字段', card.data.scenario || '');

const 需要型命中 = 命中.filter((x) => x.类.indexOf('★') === 0);
const out = {
  候选卡: CARD, 字节: fs.statSync(CARD).size,
  '龙气出现总处数': 命中.length,
  '需要型（应 0）': 需要型命中.length,
  '分类统计': 命中.reduce((a, x) => (a[x.类] = (a[x.类] || 0) + 1, a), {}),
  需要型残留: 需要型命中,
  全部命中: 命中,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');

console.log('候选卡 ' + out.字节 + ' 字节｜「龙气」共 ' + 命中.length + ' 处');
console.log('需要型（应为 0）：' + 需要型命中.length);
for (const x of 需要型命中) console.log('  ✘ ' + x.来源 + '：…' + x.上下文 + '…');
console.log('\n按类分：');
for (const [k, v] of Object.entries(out.分类统计)) console.log('  ' + v + ' 处 — ' + k);
console.log('\n逐条（保留项与前缀）：');
for (const x of 命中) console.log('  [' + x.类 + '] ' + x.来源 + '：…' + x.上下文.slice(0, 78) + '…');
process.exit(需要型命中.length ? 1 : 0);
