/**
 * P37_patch_recall.mjs —— 按 gpt 97c75db 裁定改两条**召回配置**（本轮只改召回，不改正文）：
 *   ① id213／源 uid151【名器】交欢反应律：keys 去掉 8 个泛词，只留 13 个名器专名；保持非恒定。
 *   ② id151／源 uid121【名器】何为道纹：constant=true → false；keys 收紧为「极乐引／本命道纹／名器第二境」；保留知识门。
 * 只改 `references/仙姝墮-世界书.json`（唯一真源）；改前打印"改前配置"，改后打印"改后配置"，
 * 并顺带核查：二级匹配配置（secondaryKeys/selective）、递归开关（preventRecursion）—— 供 gpt 核"会不会被书名反复召回"。
 */
import fs from 'node:fs';

const F = 'references/仙姝墮-世界书.json';
const raw = fs.readFileSync(F, 'utf8');
const j = JSON.parse(raw);
const list = Array.isArray(j.entries) ? j.entries : Object.values(j.entries || {});
const 找 = (uid) => list.find((e) => String(e.uid) === String(uid));

const 泛词 = ['名器', '交欢', '双修', '破身', '采补', '抽送', '合欢', '纯阳'];
const 名器专名 = ['九幽玄阴', '灼酒流炎', '心魔茶璎', '般若菩提', '北冥潮生', '清歌弦鸣', '灵犀同心', '玉虎噙香', '烟霞灵乳', '凤凰羽花', '梅蕊', '冰魄剑心', '流焰叠薪'];

const 报告 = { 改前: {}, 改后: {}, 核查: {} };
const 摘要 = (e) => ({
  uid: e.uid, comment: e.comment, constant: e.constant === true, enabled: e.enabled !== false, disable: e.disable === true,
  key: e.key || e.keys, secondaryKeys: e.keysecondary || e.secondaryKeys || null, selective: e.selective === true,
  selectiveLogic: e.selectiveLogic ?? null, order: e.order ?? null, position: e.position ?? null, depth: e.depth ?? null,
  preventRecursion: e.preventRecursion === true, excludeRecursion: e.excludeRecursion === true,
  正文字符数: (e.content || '').length, 有if门: /^@@if/m.test(e.content || ''),
});

/* ① id213 / uid151 */
const A = 找(151);
if (!A) throw new Error('找不到 uid151');
报告.改前.A = 摘要(A);
const 旧key = A.key || A.keys || [];
const 新key = 旧key.filter((k) => !泛词.includes(k));
if (JSON.stringify(旧key) === JSON.stringify(新key)) throw new Error('uid151 keys 无需改（可能已改过）');
if (新key.length !== 13) throw new Error('去掉泛词后应剩 13 个名器专名，实际 ' + 新key.length + '：' + JSON.stringify(新key));
if (!新key.every((k) => 名器专名.includes(k))) throw new Error('剩余键里出现非名器专名：' + JSON.stringify(新key.filter((k) => !名器专名.includes(k))));
A.key = 新key;
delete A.keys;
报告.改后.A = 摘要(A);

/* ② id151 / uid121 */
const B = 找(121);
if (!B) throw new Error('找不到 uid121');
报告.改前.B = 摘要(B);
B.constant = false;
B.key = ['极乐引', '本命道纹', '名器第二境'];
delete B.keys;
报告.改后.B = 摘要(B);

/* 核查：这条解释条会不会被"别的条目反复提到书名"而召回 */
报告.核查.递归 = {
  '源里 preventRecursion 未开的条目': list.filter((e) => e.preventRecursion !== true).map((e) => e.uid + ':' + (e.comment || '').slice(0, 20)),
  '源条目总数': list.length,
};
报告.核查.二级匹配 = { selective: B.selective === true, keysecondary: B.keysecondary || B.secondaryKeys || null };
报告.核查.A是否有闸门 = /^@@if/m.test(A.content || '');
报告.核查.正文依赖扫描 = (() => {
  /* 正文里有没有"全局执行依赖本条的短核心定义"：扫卡内脚本是否按名字引用这两条 */
  const 面板 = fs.readFileSync('卡片脚本/状态栏面板.js', 'utf8');
  const 状态机 = fs.readFileSync('卡片脚本/状态机.js', 'utf8');
  return {
    '面板提到交欢反应律': /交欢反应律/.test(面板),
    '面板提到何为道纹': /何为道纹/.test(面板),
    '状态机提到交欢反应律': /交欢反应律/.test(状态机),
    '状态机提到何为道纹': /何为道纹/.test(状态机),
  };
})();

fs.writeFileSync(F, JSON.stringify(j, null, 2), 'utf8');
const 复检 = JSON.parse(fs.readFileSync(F, 'utf8'));
const 复检条 = (Array.isArray(复检.entries) ? 复检.entries : Object.values(复检.entries || {}));
报告.JSON合法 = true;
报告.写回后核对 = { A: 摘要(复检条.find((e) => String(e.uid) === '151')), B: 摘要(复检条.find((e) => String(e.uid) === '121')) };

const OUT = 'AI交接/下级更新/2026-10-08-18-gpt17落实/材料/26a_召回配置改前改后对照.json';
fs.mkdirSync(OUT.split('/').slice(0, -1).join('/'), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(报告, null, 2), 'utf8');

console.log('【① uid151【名器】交欢反应律】');
console.log('  改前 constant=' + 报告.改前.A.constant + '｜keys(' + 报告.改前.A.key.length + ')=' + 报告.改前.A.key.join('、'));
console.log('  改后 constant=' + 报告.改后.A.constant + '｜keys(' + 报告.改后.A.key.length + ')=' + 报告.改后.A.key.join('、'));
console.log('【② uid121【名器】何为道纹】');
console.log('  改前 constant=' + 报告.改前.B.constant + '｜keys=' + JSON.stringify(报告.改前.B.key));
console.log('  改后 constant=' + 报告.改后.B.constant + '｜keys=' + JSON.stringify(报告.改后.B.key));
console.log('【核查】');
console.log('  递归：源里 preventRecursion 未开的 ' + 报告.核查.递归['源里 preventRecursion 未开的条目'].length + ' 条（' + 报告.核查.递归['源条目总数'] + ' 条中）');
console.log('  B 的二级匹配：' + JSON.stringify(报告.核查.二级匹配));
console.log('  A 是否有 @@if 门：' + 报告.核查.A是否有闸门);
console.log('  正文依赖扫描：' + JSON.stringify(报告.核查.正文依赖扫描));
console.log('对照件：' + OUT);
