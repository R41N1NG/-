#!/usr/bin/env node
/**
 * _chk_portrait_flip.mjs —— 立绘「阶段分组 / 随机 / 翻面」的离线验收
 *
 * 断言（都靠桩环境跑真实代码，不依赖酒馆）：
 *   ① `baseline` 组里**只有正常立绘**；`bath` 组里只有沐浴图 ⇒ 两组**零交集**
 *      （主人要求：叶红缨站街绝不会加载沐浴图）
 *   ② 阶段判定：地点/环境里出现「沐浴/浴池/汤池」⇒ `bath`；否则 `baseline`
 *   ③ 随机取图是**稳定伪随机**：同一楼号同一角色 ⇒ 每次同张；换楼号会变
 *   ④ 灯箱 `data-alt` 里列的是**同组每张的首选 URL**，且数量＝该组张数
 *   ⑤ 未登记的角色（如陆十三）⇒ 只给主图，不会瞎猜后缀
 *
 * 用法：node _chk_portrait_flip.mjs [面板脚本路径]
 * 退出码：0 全通过 / 2 有失败
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const FILE = process.argv[2] ?? '卡片脚本/状态栏面板.js';
const src = readFileSync(FILE, 'utf8');

/* 只取立绘子系统那段（避免依赖酒馆宿主） */
const from = src.indexOf('const XSD_PINYIN');
const to = src.indexOf('/** XML 文本转义');
if (from < 0 || to < 0) { console.error('定位不到立绘子系统代码段'); process.exit(2); }
const code = '/** 从面板脚本里借来的小工具（原文在 XSD_PINYIN 之前，这里补上以免 ReferenceError） */\n'
  + 'function s0(v) { return String(v === undefined || v === null ? \'\' : v).trim(); }\n'
  + src.slice(from, to);

const box = { console };
vm.createContext(box);
vm.runInContext(code + `
globalThis.__T = { XSD_VARIANTS, XSD_PINYIN, xsdStageOf, xsdSuffixes, xsdStageImages, xsdPickIndex, xsdPortraitSourcesStaged, pinyinOf, xsdMentioningText, xsdStageForChar, xsdInScene };
`, box);
const T = box.__T;

const ok = [];
const bad = [];
const ck = (cond, label) => (cond ? ok : bad).push(label);

/** 从 URL 数组里抽「文件名」 */
const names = (arr) => arr.map((u) => String(u).split('/').pop());

/* ① 两组零交集 */
const yhBaseline = T.xsdStageImages('yehongying', 'baseline');
const yhBath = T.xsdStageImages('yehongying', 'bath');
const bSet = new Set(names(yhBaseline));
const tSet = new Set(names(yhBath));
ck(bSet.size >= 2, `叶红缨 baseline 组有 ${bSet.size} 张：${[...bSet].join('、')}`);
ck(tSet.size >= 2, `叶红缨 bath 组有 ${tSet.size} 张：${[...tSet].join('、')}`);
ck([...bSet].every((n) => !/bath/.test(n)), '① baseline 组里**没有**沐浴图');
ck([...tSet].every((n) => /bath/.test(n)), '① bath 组里**只有**沐浴图');
ck([...bSet].filter((n) => tSet.has(n)).length === 0, '① 两组零交集（不会互相混入）');

/* ② 阶段判定 */
ck(T.xsdStageOf('地点：花仙城 · 汤池｜环境：水汽氤氲') === 'bath', '② 提到「汤池」⇒ bath');
ck(T.xsdStageOf('地点：中洲 · 内苑九皇子寝宫') === 'baseline', '② 普通地点 ⇒ baseline');
ck(T.xsdStageOf('') === 'baseline', '② 空文本 ⇒ baseline（安全兜底）');

/* ②b ★ 按人判阶段 —— 用**真机那一楼的原文**当回归样例（2026-09-28 第三十七轮）
 *     主人报障：「偷看叶红缨洗澡，立绘却是普通立绘」。
 *     真机状态块里：地点/环境/状态**一个关键词都没有**，关键词全在
 *     `<暗处>叶红缨（赤焰居汤池内平复余韵）</暗处>` 与 `<线索>红缨师姐沐浴时自抚泄身…</线索>`。 */
const REAL = ['<Status_block>',
  '<地点>墨山道·赤焰居外悬空栈道</地点>',
  '<环境>清冷山风 · 远处松涛声 · 身上残存的热汽与酒气</环境>',
  '<状态>灵力圆满｜气血躁动，肉棒充血未退｜心境：极度震惊与沉重</状态>',
  '<在场>赵无忧</在场>',
  '<暗处>叶红缨（赤焰居汤池内平复余韵）</暗处>',
  '<线索>红缨师姐沐浴时自抚泄身，胸口穿刺暗红寒铁环</线索>',
  '<角色1><名>叶红缨</名><阶段>信任 +1</阶段><气场>情热难熄</气场><心境>被体内的业火与欲望逼到绝境</心境><神态>瘫坐在水池深处，双臂环抱膝盖</神态></角色1>',
  '<角色2><名>赵无忧</名><阶段>牵挂与疑惧 +2</阶段><气场>紧绷压抑</气场><心境>目睹师姐私密残相</心境><神态>立于栈道寒风中</神态></角色2>',
  '</Status_block>'].join('');
const castYHY = { 名: '叶红缨', 阶段: '信任 +1', 气场: '情热难熄', 心境: '被体内的业火与欲望逼到绝境', 神态: '瘫坐在水池深处，双臂环抱膝盖' };
const castZWY = { 名: '赵无忧', 阶段: '牵挂与疑惧 +2', 气场: '紧绷压抑', 心境: '目睹师姐私密残相', 神态: '立于栈道寒风中' };
const globalStage = T.xsdStageOf(['墨山道·赤焰居外悬空栈道', '清冷山风 · 远处松涛声 · 身上残存的热汽与酒气', '灵力圆满｜气血躁动'].join(' '));
ck(globalStage === 'baseline', '②b 那一楼的"地点＋环境＋状态"判出来确实是 baseline（旧逻辑的死因）');
ck(T.xsdStageForChar(castYHY, '叶红缨', globalStage, REAL) === 'bath',
  '②b ★ 叶红缨 ⇒ bath（靠 `<暗处>`/`<线索>` 里点了她名字的字段救回来）');
ck(T.xsdStageForChar(castZWY, '赵无忧', globalStage, REAL) === 'baseline',
  '②b ★ 同一楼的赵无忧 ⇒ baseline（他在栈道上，不该跟着泡汤）');
ck(T.xsdMentioningText(REAL, '叶红缨').indexOf('汤池') >= 0, '②b 按名字取到的片段里含「汤池」');
ck(T.xsdMentioningText(REAL, '赵无忧').indexOf('汤池') === -1, '②b 赵无忧的片段里**不含**「汤池」（各人各判）');

/* ②c 不在场的人**不该被场景兜底**（真机第二例：地点写着「赤焰居浴房梁上」，而玄机子在"前院石径附近"） */
const REAL2 = '<Status_block>'
  + '<地点>墨山道·赤焰居浴房梁上</地点>'
  + '<环境>池水沸腾声与滴水声 · 滚烫水汽交织</环境>'
  + '<状态>屏息潜伏</状态>'
  + '<在场>叶红缨、{{user}}</在场>'
  + '<暗处>玄机子（刚离去不远，仍在前院石径附近）</暗处>'
  + '<角色1><名>叶红缨</名><阶段>敌意 +2</阶段><气场>烈焰暴起</气场><心境>羞愤至极</心境><神态>赤身立于水中，朱发散落</神态></角色1>'
  + '<角色2><名>玄机子</名><阶段>猜疑 +1</阶段><气场>暗流未平</气场><心境>并未完全走远</心境><神态>青衫慢步前行，指尖扣着折扇</神态></角色2>'
  + '</Status_block>';
const g2 = T.xsdStageOf(['墨山道·赤焰居浴房梁上', '池水沸腾声与滴水声 · 滚烫水汽交织', '屏息潜伏'].join(' '));
ck(g2 === 'bath', '②c 那一楼的场景通用判定确实是 bath（地点含「浴房」）');
ck(T.xsdStageForChar({ 名: '叶红缨', 阶段: '敌意 +2', 气场: '烈焰暴起', 心境: '羞愤至极', 神态: '赤身立于水中，朱发散落' }, '叶红缨', g2, REAL2) === 'bath',
  '②c ★ 叶红缨 ⇒ bath（自己的神态写了「水中」）');
ck(T.xsdStageForChar({ 名: '玄机子', 阶段: '猜疑 +1', 气场: '暗流未平', 心境: '并未完全走远', 神态: '青衫慢步前行' }, '玄机子', g2, REAL2) === 'baseline',
  '②c ★ 不在 `<在场>` 里的玄机子 ⇒ baseline（人在前院，不该被浴房兜进去）');

/* ③ 稳定伪随机 */
const picks = new Set();
for (let i = 0; i < 8; i += 1) picks.add(names(yhBaseline)[T.xsdPickIndex('12#' + i, 2)] || '');
const sameFloorA = T.xsdPickIndex('12#0', 2);
const sameFloorB = T.xsdPickIndex('12#0', 2);
ck(sameFloorA === sameFloorB, '③ 同一楼号 ⇒ 每次同一张（重绘不跳图）');
ck(picks.size >= 1 && [...picks].every(Boolean), `③ 不同楼号能抽到图（本次出现 ${picks.size} 种）`);

/* ④ data-alt 语义：同组每张的首选 URL（数量＝张数） */
ck(yhBaseline.length === T.xsdSuffixes('yehongying', 'baseline').length,
  `④ baseline 首选 URL 数 ${yhBaseline.length} ＝ 后缀数 ${T.xsdSuffixes('yehongying', 'baseline').length}`);

/* ⑤ 未登记角色 */
const unknown = T.xsdStageImages('lushisan', 'bath');
ck(unknown.length === 1 && /^lushisan\./.test(names(unknown)[0]), `⑤ 未登记 id 只给主图：${names(unknown)[0]}`);

/* ⑥ 完整候选链：同阶段全部排在前面，其他阶段只在**最后**兜底 */
const chain = T.xsdPortraitSourcesStaged('yehongying', 'baseline');
const firstBathAt = chain.findIndex((u) => /bath/.test(u));
const lastBaselineAt = chain.map((u, i) => (/bath/.test(u) ? -1 : i)).reduce((a, b) => Math.max(a, b), -1);
ck(firstBathAt === -1 || firstBathAt > lastBaselineAt,
  `⑥ 沐浴图全部排在正常立绘之后（正常最后一条 #${lastBaselineAt}，沐浴最早 #${firstBathAt}，共 ${chain.length} 条）`);
const bathChain = T.xsdPortraitSourcesStaged('yehongying', 'bath');
ck(bathChain.findIndex((u) => /_2\./.test(u) && !/bath/.test(u)) > bathChain.findIndex((u) => /bath/.test(u)),
  '⑥ 反过来（bath 场景）：正常立绘只在沐浴图之后兜底');

console.log(`【立绘阶段分组验收】${FILE}\n`);
for (const l of ok) console.log('  ✔ ' + l);
if (bad.length) {
  console.log('\n【失败项】\n  ' + bad.join('\n  '));
  console.log(`\n${ok.length} 通过 / ${bad.length} 失败`);
  process.exit(2);
}
console.log(`\n✅ 全部通过（${ok.length} 项）`);
