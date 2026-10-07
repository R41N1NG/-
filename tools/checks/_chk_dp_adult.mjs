#!/usr/bin/env node
/**
 * _chk_dp_adult.mjs —— 验收 `depth_prompt` 第九节「成人场景白描规范」
 *
 * 依据：`制卡规范 v2.0（统一版）` §9.6 成人白描规范 ＋ 附录 C 决议③
 *   （决议③ 的口径是「照范例卡的逻辑并进 `depth_prompt`，**不新增条目**」——
 *     范例卡实测这块是 0 命中（它没做），我们按自己的题材补，做完仍不新增条目。）
 *
 * 查什么（16 项）：
 *   ① 八节仍在（不许覆盖掉堕落轴适配）  ② 第九节存在且有 9.1–9.7 七个子节
 *   ③ 四条决议要点逐条命中：禁医学词／感官双绑定／对白三层／内部生理语义化映射
 *   ④ 映射表七格齐全  ⑤ 优先级一句话在  ⑥ 地图式硬指标在（「感官细节不少于动作数」）
 *   ⑦ 禁忌清单五条在    ⑧ 与 FNE／八节的分工说明在
 *   ⑨ 不新增条目（卡条目数不变）        ⑩ 本节不引入卡片禁用词（除纪律声明句）
 *   ⑪ 「文风」条仍在使用（本节不得越权改文风）
 *
 * 用法：node _chk_dp_adult.mjs [卡.json]
 * 退出码：0 全通过 / 2 有失败项
 */
import { readFileSync } from 'node:fs';

const FILE = process.argv[2] ?? '仙姝墮-角色卡（全书群像）.json';
const card = JSON.parse(readFileSync(FILE, 'utf8').replace(/^\uFEFF/, ''));
const dp = String(card.data.extensions?.depth_prompt?.prompt ?? '');
const entries = card.data.character_book.entries ?? [];

const ok = [];
const bad = [];
const ck = (cond, label) => (cond ? ok : bad).push(label + (cond ? '' : ' ✘'));

const sec9 = dp.split('## 成人场景白描规范')[1];

ck(/## 堕落轴适配/.test(dp), '① 第八节「堕落轴适配」仍在');
ck(sec9 !== undefined, '② 第九节存在');
for (const s of ['词汇纪律', '感官双绑定', '对白三层', '内部生理语言的语义化映射', '节奏与留白', '禁忌清单', '与其它条的优先级', '堕落轴专属白描']) {
  ck(sec9?.includes(s), `② 子节 ${s}`);
}
ck(/禁止医学与解剖术语/.test(sec9 ?? ''), '③ 禁医学词（决议③ 第一条）');
ck(/感官双绑定/.test(sec9 ?? '') && /不得少于动作数量/.test(sec9 ?? ''), '③ 感官双绑定 ＋ 硬指标');
ck(/对白三层/.test(sec9 ?? '') && /身体即时感受/.test(sec9 ?? ''), '③ 对白三层（每句至少两层）');
const MAP = ['收缩绞紧', '化开湿软', '痉挛吮吸', '后腰弓起', '指节抠紧', '仰颈失神', '双腿缠紧'];
ck(MAP.every((k) => (sec9 ?? '').includes(k)), '④ 内部生理语义化映射七格齐全');
ck(/基调听八节，写法听本节/.test(sec9 ?? ''), '⑤ 与第八节的分工／优先级');
ck(/最多复用两次/.test(sec9 ?? ''), '⑥ 同格映射的复用上限');
ck(/推拒必带生理泄密/.test(sec9 ?? '') && /必须有停顿/.test(sec9 ?? '') && /场景要付代价/.test(sec9 ?? ''), '⑦ 节奏与留白三件');
ck(/一犯即废/.test(sec9 ?? '') && (sec9 ?? '').split('\n').filter((l) => /^- /.test(l.trim())).length >= 10, '⑧ 禁忌清单与编号条目齐');
ck(/与八节分工/.test(dp) || /与八节定/.test(dp), '⑨ 第九节抬头写明与八节分工');
ck(/本节的技法\*\*只在成人场景生效/.test(sec9 ?? ''), '⑩ 成人场景限定（不影响日常戏）');
// ⚠️ 2026-09-29：239 → **291**（合册后：＋60 条只有后册有的、＋47 条「（2）」增量条、心智条补到 21 条；
//    撤掉（后册）附条与旧附条、9 条重复【物品】去重 ⇒ 全卡 291）。决议③「本节不新增条目」看的是**本节子节数**，不是全卡条数。
// ⚠️ 2026-09-29 22:4x 主人令「同步」：291 → **292**（合册之后又加了【名器】何为道纹条）。
/* ⚠️ 2026-09-30（主人令「1 改」）：292 → 278 → 275 → 277 → 264 → 253 → 250 → **236**（人物批：十四删、两条启用）。 */
/* ⚠️ 2026-10-07（主人令「7 号了，还按 9.30 的来？」）：这个数字随剧情分流／阶段驱动／锚点扩充一路涨，
 *   固定值只会一直红。改成**下界断言 + 打印实际值**：条目只许多不许少（少于基线说明有人误删了条目）。 */
const MIN_ENTRIES = 232;
ck(entries.length >= MIN_ENTRIES, `⑪ 条目数（${entries.length}）不少于基线 ${MIN_ENTRIES}（主人 2026-09-30 定底线；后续新增属设计扩张）`);
ck(/文风/.test(sec9 ?? ''), '⑫ 本节声明受「文风」条约束');

// ⑬ 本节不得引入卡片禁用词（纪律声明句除外）
const BAN = ['玄阳凤髓', '龙根', '凶器', '茎身', '阳器', '阳物', '阳根', '器物'];
const ALLOW = /禁用|禁止|不得|纪律|改写|一律不用|术语/;
const hits = [];
for (const line of (sec9 ?? '').split('\n')) {
  for (const w of BAN) if (line.includes(w) && !ALLOW.test(line)) hits.push(`${w}：「${line.trim().slice(0, 50)}」`);
}
ck(hits.length === 0, '⑬ 第九节未引入禁用词' + (hits.length ? '：' + hits.join('；') : ''));

// ⑭ 不得把「解释句」当示范写进去（禁忌清单里必须明令禁止）
ck(/不用「她感到/.test(sec9 ?? ''), '⑭ 明令禁止解释句（她感到／她明白／她这才意识到）');

console.log(`【第九节验收】${FILE}`);
for (const l of ok) console.log('  ✔ ' + l);
if (bad.length) {
  console.log('\n【失败项】');
  for (const l of bad) console.log('  ✘ ' + l);
  console.log(`\n${ok.length} 通过 / ${bad.length} 失败`);
  process.exit(2);
}
console.log(`\n${ok.length} 通过 / 0 失败 ✅（第九节 ${sec9?.length ?? 0} 字，depth_prompt 共 ${dp.length} 字）`);
