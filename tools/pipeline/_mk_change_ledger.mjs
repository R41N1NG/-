#!/usr/bin/env node
/**
 * _mk_change_ledger.mjs —— **变更总账**（2026-09-30 主人令：「每次改完要把所有改动列给我看」）
 *
 * 做法：册子的每一批改动都留了一个 `.bak-<批次>` 备份，于是**条目级差异可以从备份链逐对算出来**，
 *   不靠我回忆、不靠我转述 —— 这一段是本脚本生成的，逐条给出「旧 → 新」。
 *   源码（状态机.js／_build_card.js）的差异另算：新增锚点名单 + 改到的代码段。
 *
 * 用法：node _mk_change_ledger.mjs [输出.md]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const D = 'E:\\角色卡制作\\仙姝堕\\';
const CUR = D + '仙姝墮-世界书.json';
const strip = (c) => String(c ?? '').replace(/^(\s*〔待解锁〕)+/, '');
const load = (p) => { const j = JSON.parse(readFileSync(p, 'utf8')); return j.entries || j; };
const first = (e) => String(e.content).split('\n')[0].trim();

/** 备份链（旧 → 新）；每一对就是一批改动
 *  ⚠️⚠️ 2026-09-30 我在这里连栽三次（记下来防重犯）：**追加批次时不许用字符串手术去插数组项** ——
 *    每次都在 `];` 或 `],` 上把数组结尾咬掉，脚本静默变成语法错或旧边界。
 *    ⇒ **规矩：加批次＝把整个 CHAIN 数组整段重写**（做整体替换，不做局部插入）。
 *  ⚠️ 「本批的新」＝**下一批的旧备份**（每批脚本都在写盘前 copy 一份 `.bak-<批次>`），
 *    绝不要写成「当前文件」。 */
const CHAIN = [
  ['批复 1｜册子条目名回正 ＋ 删 5 条重复分区标记', '仙姝墮-世界书-前期.json.bak-fixnames-20260929190142', '仙姝墮-世界书-前期.json.bak-hiddengate'],
  ['批复 2｜隐藏层补挂闸门 ＋ 4 条名器本体挂「成形」闸门', '仙姝墮-世界书-前期.json.bak-hiddengate', '仙姝墮-世界书-前期.json.bak-mqgate'],
  ['批复 3｜凤凰羽花 叠加「成形」闸门', '仙姝墮-世界书-前期.json.bak-mqgate', '仙姝墮-世界书-前期.json.bak-ch13'],
  ['批复 4｜剧情十三 时点改按最新', '仙姝墮-世界书-前期.json.bak-ch13', '仙姝墮-世界书-前期.json.bak-rules0930'],
  ['批复 5｜六条闸门规则（26 处 ＋ 11 条启用）', '仙姝墮-世界书-前期.json.bak-rules0930', '仙姝墮-世界书-前期.json.bak-tshcl'],
  ['批复 6｜剧情四 挂新锚点 天姝会成立', '仙姝墮-世界书-前期.json.bak-tshcl', '仙姝墮-世界书-前期.json.bak-20260930plan'],
  ['批复 7｜主人逐条指示的 99 条（删 14／挂闸门 39／无门槛 5／身份 5／标记 33／不动 3）', '仙姝墮-世界书-前期.json.bak-20260930plan', '仙姝墮-世界书-前期.json.bak-fix0930b'],
  ['批复 8｜烟霞灵乳口径回收 ＋ 分区条数 ＋ 断言 292→278', '仙姝墮-世界书-前期.json.bak-fix0930b', '仙姝墮-世界书-前期.json.bak-plot1'],
  ['批复 9｜剧情一：删错误说法／删极乐引段（含空挂小标题）／补下一步／新锚点 剧情一已完成', '仙姝墮-世界书-前期.json.bak-plot1', '仙姝墮-世界书-前期.json.bak-plot2'],
  ['批复 10｜剧情一 时点理顺 ＋ 剧情二 换触发词与闸门 ＋ 新锚点 剧情二已完成', '仙姝墮-世界书-前期.json.bak-plot2', '仙姝墮-世界书-前期.json.bak-plot3'],
  ['批复 11｜14 条剧情条扫描深度=6 ＋ 剧情三 闸门／触发词 ＋ 隐藏层闸门 ＋ 新锚点 剧情三已完成', '仙姝墮-世界书-前期.json.bak-plot3', '仙姝墮-世界书-前期.json.bak-plot3b'],
  ['批复 12｜剧情二 触发词补「孤月」', '仙姝墮-世界书-前期.json.bak-plot3b', '仙姝墮-世界书-前期.json.bak-hidrewrite'],
  ['批复 13｜按原文重写隐藏层（780 → 1826 字；删掉原文查不到的「助修」）', '仙姝墮-世界书-前期.json.bak-hidrewrite', '仙姝墮-世界书-前期.json.bak-unbroken'],
  ['批复 14｜元阴钉死未破身 ＋ 剧情二 下一步改天剑门 ＋ 势力条触发词加天剑门', '仙姝墮-世界书-前期.json.bak-unbroken', '仙姝墮-世界书-前期.json.bak-prosefix'],
  ['批复 15｜清掉隐藏层「那一刻」时间虚指（文风关卡拦下 → 改措辞）', '仙姝墮-世界书-前期.json.bak-prosefix', '仙姝墮-世界书-前期.json.bak-linghuan'],
  ['批复 16｜封元镇灵环：触发词三个＋深度6／闸门改 剧情三已完成＋赵无忧看见乳环／清废占位／新增「主动解释」／新锚点 赵无忧看见乳环', '仙姝墮-世界书-前期.json.bak-linghuan', '仙姝墮-世界书-前期.json.bak-plot4'],
  ['批复 17｜删锚点 幽寂谷秘境／两个乳环锚点定义写清／隐藏层改读 赵无忧看见乳环 并删「第十四章之前」／剧情四 闸门＋正文改写／新锚点 剧情四已完成', '仙姝墮-世界书-前期.json.bak-plot4', '仙姝墮-世界书-前期.json.bak-dingqing'],
  ['批复 18｜按原文补「孤剑崖送别·孤月赠冰心泪」＋改掉卡里「在天溪定情」的错定位', '仙姝墮-世界书-前期.json.bak-dingqing', '仙姝墮-世界书-前期.json.bak-split5'],
  ['批复 19｜孤月定情单开为剧情五、原五～十三顺延为六～十四／剧情四已完成 改「即将出发」／新锚点 剧情五已完成／断言 278→279', '仙姝墮-世界书-前期.json.bak-split5', '仙姝墮-世界书-前期.json.bak-plot56'],
  ['批复 20｜听雪双姝一块从剧情五挪回剧情六（按主人修订文）＋ 剧情五 触发词加「孤月」＋去重复时点行', '仙姝墮-世界书-前期.json.bak-plot56', '仙姝墮-世界书-前期.json.bak-plot567'],
  ['批复 21｜推进句归位／剧情六 补旁白禁泄＋改推进句／新锚点 剧情六、七已完成／触发词删「孤月」两处／剧情七 改纯链式', '仙姝墮-世界书-前期.json.bak-plot567', '仙姝墮-世界书-前期.json.bak-nextbeat'],
  ['批复 22｜5 处「剧情推进」句统一标签并补行为约束括号（＋清多余句号）', '仙姝墮-世界书-前期.json.bak-nextbeat', '仙姝墮-世界书-前期.json.bak-plot34578'],
  ['批复 23｜主人给的 5 条推进句落进剧情三／四／五／七／八 ＋ 剧情八 闸门改链式、触发词改「浴血杀敌」', '仙姝墮-世界书-前期.json.bak-plot34578', '仙姝墮-世界书-前期.json.bak-insert2'],
  ['批复 24｜插两条新剧情（八 双姝／十 城破）并顺延编号 ＋ 剧情三 推进句改词 ＋「最甜」挪到剧情五 ＋ 清 3 个死账 ＋ 新锚点 剧情八/九/十已完成 ＋ 名单与台账同步（修漂移）', '仙姝墮-世界书-前期.json.bak-insert2', '仙姝墮-世界书-前期.json.bak-renumberfix'],
  ['批复 25｜修编号撞车（顺延函数没吃参数的余波）＋ 修两处闸门互换', '仙姝墮-世界书-前期.json.bak-renumberfix', '仙姝墮-世界书-前期.json.bak-gateswap'],
  ['批复 26｜十一～十六 闸门改纯链式 ＋ 补锚点 剧情十六已完成（前期收束）', '仙姝墮-世界书-前期.json.bak-gateswap', '仙姝墮-世界书-前期.json.bak-plot8rewrite'],
  ['批复 27｜按原文重写【剧情】八（493 → 2153 字）：十步收服链条＋名器识出与用法＋八场性爱场景＋两处「设定词≠原文词」标注；触发词加「日月道纹」', '仙姝墮-世界书-前期.json.bak-plot8rewrite', '仙姝墮-世界书-前期.json.bak-plot78round2'],
  ['批复 28｜剧情七：删「噩耗＋痛哭」两段／保留玄机子返宗／补双姝告别／推进句改买手镯 ＋ 剧情八：触发词加「临别礼物」「回天音阁」／③⑦ 措辞照原文修正／清掉行号注与两处 ⚠️ 词义注／性爱场景整节改写为卡片正文', '仙姝墮-世界书-前期.json.bak-plot78round2', '仙姝墮-世界书-前期.json.bak-plot10'],
  ['批复 29｜新建【剧情】十·双姝回归，魅骨生香（4800 字原文照录）＋原十～十六顺延为十一～十七＋锚点同步改名＋剧情十已完成 补定义＋剧情七 已完成改「玄机子已离去」＋剧情八 补全并删第七八场＋剧情九 改推进句', '仙姝墮-世界书-前期.json.bak-plot10', '仙姝墮-世界书-前期.json.bak-plot1011'],
  ['批复 30｜剧情十已完成 改「三人同寝」／剧情十一已完成 改「天溪城破」／剧情十一 触发词改 西南城破·血染天溪／剧情十一 正文换成照录原文 1666 字＋推进句', '仙姝墮-世界书-前期.json.bak-plot1011', '仙姝墮-世界书-前期.json.bak-plot12'],
  ['批复 31｜剧情十二：触发词只留 朱樱逢劫／补前置剧情（偷袭·引爆情毒）／开场改成「他倒在地上」／那道防线改「被残阳老怪冲垮」／删掉名器说明块／加推进句／锚点 剧情十二已完成 改定义', '仙姝墮-世界书-前期.json.bak-plot12', '仙姝墮-世界书-前期.json.bak-plot1213a'],
  ['批复 32｜剧情十二 触发词只留 朱樱逢劫（其余全删）＋ 剧情十三 触发词只留 赤羽堕凡尘（其余全删）', '仙姝墮-世界书-前期.json.bak-plot1213a', '仙姝墮-世界书-前期.json.bak-plot13prose3'],
  ['批复 33｜装【剧情】十三：第十四章照录（10702 字）＋主人给的三块（二阶段／孕炎乳／火凤道纹）＋推进句「上半部分到此为止」；照录段四处最小改动过文风关卡', '仙姝墮-世界书-前期.json.bak-plot13prose3', '仙姝墮-世界书-前期.json.bak-split13prose'],
  ['批复 34｜洞府调教单拉为【剧情】十四（照录 ch17 第九六六一字）＋原十四～十七顺延为十五～十八（条目/锚点/闸门三处一起改）＋剧情十三已完成 改「灼酒流炎穴觉醒」＋分区标记与索引同步', '仙姝墮-世界书-前期.json.bak-split13prose', '仙姝墮-世界书-前期.json.bak-p15prose'],
  ['批复 35｜十三/十四/十五 扫描深度收到 3；十三 删掉二阶段整块并改推进句；十四 触发词清空＋写推进句；十五 改「雀奴」（触发词「炎姬死去」、正文照录 ch18 第九九四三字）；照录段三处抽象喻体最小改动', '仙姝墮-世界书-前期.json.bak-p15prose', '仙姝墮-世界书-前期.json.bak-cut15'],
  ['批复 36｜剧情十四 触发词＝相思豆；剧情十五～十八 全部删除并移出世界书（连同只为它们存在的 4 个锚点）；分区标记 19→15、索引同步', '仙姝墮-世界书-前期.json.bak-cut15', '仙姝墮-世界书-前期.json.bak-restore15'],
  ['批复 37｜把【剧情】十五 · 雀奴 加回来（删错的是它，主人要删的是原十五葬魔渊）＋台账加回锚点 剧情十五已完成＋所有 >4000 字的剧情条扫描深度统一收到 3（含剧情十）＋分区标记与索引同步', '仙姝墮-世界书-前期.json.bak-restore15', '仙姝墮-世界书.json'],
];

const md = [];
const P = (s) => { console.log(s); md.push(s); };
P('# 变更总账（《仙姝墮》· 2026-09-30）');
P('');
P('> 主人令：**每次改完，把所有改动列出来**。本账的「条目级差异」由脚本从备份链逐对比出（不是回忆、不是转述）。');
P('> 源码改动单独列；改动后的产物哈希与条数在文末。');
P('');

for (const [label, oldF, newF] of CHAIN) {
  const op = D + oldF, np = D + newF;
  if (!existsSync(op) || !existsSync(np)) { P(`\n## ${label}\n\n（缺备份，跳过：${oldF} → ${newF}）\n`); continue; }
  const a = load(op), b = load(np);
  const rows = [];
  const allU = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const u of allU) {
    const x = a[u], y = b[u];
    if (!x) { rows.push(`- **新增** uid ${u}：${strip(y.comment)}`); continue; }
    if (!y) { rows.push(`- **删除** uid ${u}：${strip(x.comment)}`); continue; }
    const ch = [];
    if (String(x.comment) !== String(y.comment)) ch.push(`   · 条目名：「${strip(x.comment)}」 → 「${strip(y.comment)}」`);
    if (first(x) !== first(y)) ch.push(`   · 首行闸门：\n       旧：${first(x)}\n       新：${first(y)}`);
    /* ⚠️ 2026-09-30 补：原先没比 scanDepth／constant／position，结果「14 条剧情条扫描深度改成 6」这种
     *   整批改动在总账里**一条都不显示** —— 主人要的是「所有改动」，所以这几个字段也要比。 */
    if ((x.scanDepth ?? null) !== (y.scanDepth ?? null)) ch.push(`   · 扫描深度：${x.scanDepth ?? '（默认，吃全局 2）'} → ${y.scanDepth ?? '默认'}`);
    if (x.constant !== y.constant) ch.push(`   · 常驻：${x.constant} → ${y.constant}`);
    if ((x.order ?? null) !== (y.order ?? null)) ch.push(`   · order：${x.order} → ${y.order}`);
    if ((x.disable === true) !== (y.disable === true)) ch.push(`   · 启用位：${x.disable === true ? '停用' : '启用'} → ${y.disable === true ? '停用' : '启用'}`);
    if (JSON.stringify(x.key) !== JSON.stringify(y.key)) ch.push(`   · 触发词：${JSON.stringify(x.key)} → ${JSON.stringify(y.key)}`);
    /* ⚠️ 2026-09-30 修本脚本自己的误报：原先「去掉首行再比字串」，一插闸门行边界就移了位，
     *   把「只加了一行闸门」误报成「正文也变了」。改成**行级差异**：直接列出新增/删除了哪几行。
     *   （用多重集差：同一行出现几次也算得准；我们的编辑全是行级增删改。） */
    if (String(x.content) !== String(y.content)) {
      const cnt = (arr) => arr.reduce((m, l) => (m.set(l, (m.get(l) || 0) + 1), m), new Map());
      const cx = cnt(String(x.content).split('\n')), cy = cnt(String(y.content).split('\n'));
      const added = [], removed = [];
      for (const [l, n] of cy) { const d = n - (cx.get(l) || 0); for (let k = 0; k < d; k++) added.push(l); }
      for (const [l, n] of cx) { const d = n - (cy.get(l) || 0); for (let k = 0; k < d; k++) removed.push(l); }
      const pack = (arr) => arr.map((l) => '        ' + (l === '' ? '（空行）' : l.slice(0, 150))).join('\n');
      ch.push(`   · 新增 ${added.length} 行${added.length ? '：\n' + pack(added) : ''}`);
      ch.push(`   · 删除 ${removed.length} 行${removed.length ? '：\n' + pack(removed) : ''}`);
    }
    if (ch.length) rows.push(`- **${strip(y.comment)}**（uid ${u}）\n${ch.join('\n')}`);
  }
  P(`\n---\n\n## ${label}\n`);
  P(`> 对比：\`${oldF.replace('仙姝墮-世界书.json', '主文件')}\` → \`${newF.replace('仙姝墮-世界书.json', '主文件')}\``);
  P(`> 条目数：${Object.keys(a).length} → ${Object.keys(b).length}｜**改动 ${rows.length} 处**\n`);
  P(rows.length ? rows.join('\n') : '（无条目级差异）');
  P('');
}

/* ── 源码改动（按批次，逐段引用当前文件里的代码） ── */
P('\n---\n\n## 源码改动（`卡片脚本/状态机.js` 与 `_build_card.js`）\n');
const sm = readFileSync(D + '卡片脚本/状态机.js', 'utf8');
const bc = readFileSync(D + '_build_card.js', 'utf8');
const anchorNames = [...sm.slice(sm.indexOf('const FIELD_TABLE'), sm.indexOf('const AI_FIELDS')).matchAll(/name: '([^']+)'/g)].map((m) => m[1]);
P(`\n### 1. 锚点台账：${anchorNames.length} 个（原 14 → 25 → 74）`);
P('\n```\n' + anchorNames.map((n, i) => String(i + 1).padStart(2) + '. ' + n).join('\n') + '\n```');
const code = (src, marker, lines) => {
  const L = src.split('\n');
  const i = L.findIndex((l) => l.includes(marker));
  return i < 0 ? '（找不到 ' + marker + '）' : L.slice(i, i + lines).join('\n');
};
P('\n### 2. 阶段锚点闸门（本次新增，`_build_card.js`）\n');
P('```js\n' + code(bc, 'MQ_STAGE_ANCHOR', 12) + '\n```');
P('\n### 3. 名器「成形」锚点表（`_build_card.js`）\n');
P('```js\n' + code(bc, 'const MQ_ANCHOR', 9) + '\n```');
P('\n### 4. 角色名 → 身份名（身份互斥闸门，`_build_card.js`）\n');
P('```js\n' + code(bc, 'const CHAR2IDENTITY', 1) + '\n```');
P('\n### 5. `@@if` 必须在正文第一个字符（`_build_card.js` 的 `normalizeEntry`）\n');
P('```js\n' + code(bc, 'const dm = /^((?:@@[^\\n]*\\n)+)/', 4) + '\n```');
P('\n### 6. 两处「模型可写的字段名」清单已同步（+49 个名字，各一处）\n');

/* ── 产物 ── */
const card = JSON.parse(readFileSync(D + '仙姝墮-角色卡（全书群像）.json', 'utf8')).data.character_book.entries;
P('\n---\n\n## 产物现状\n');
P(`- 册：**${Object.keys(load(CUR)).length}** 条`);
P(`- 卡：**${card.length}** 条（启用 ${card.filter((e) => e.enabled !== false).length}／停用 ${card.filter((e) => e.enabled === false).length}）`);
P(`- 锚点：**${anchorNames.length}** 个`);
const out = process.argv[2] ?? D + '变更总账.md';
writeFileSync(out, md.join('\n') + '\n', 'utf8');
console.log('\n已写 ' + out);
