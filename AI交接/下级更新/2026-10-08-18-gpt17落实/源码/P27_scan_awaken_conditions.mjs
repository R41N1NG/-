/**
 * P27_scan_awaken_conditions.mjs —— 只读扫描：「XX 名器／觉醒 **需要** 某条件」这类**条件型**表述，
 * 找出与「九幽玄阴穴需要龙气」同源的说法（主人问：还有没有类似的）。
 *
 * 只读，不改任何文件。范围＝生产源 ＋ 候选卡（最终形态）：
 *   · 卡内条目 content（候选卡；可 --card 指定）
 *   · 卡内三个脚本（状态机／状态栏面板／GM修改器）
 *   · `src/mingqi-db.js`（名器条的生成源）
 *   · `卡片脚本/_src/名器图鉴数据.json`（面板图鉴真源：brief／stages.desc／stages.lock）
 *   · `references/仙姝墮-世界书.json`（唯一真源底稿）
 *   · `卡片脚本/状态栏面板.js`、`卡片脚本/_src/状态栏面板.模板.js`（XSD_RELIC_STAGES 产物/模板）
 *
 * 判据（条件型）：
 *   A 「触发条件／成形条件／觉醒条件／前置条件」类词
 *   B `(唯有|只有|必须|须|需|非…)[…]{0,18}(方能|才能|才可|才成|不能|方可|始成|方得)`
 *   C 「依赖／凭借／借助 X（方能…）」
 *   D 「非 X 不能…」
 * 并抽「所依赖的对象」（龙气／真龙／纯阳／至阳／雷霆／佛法／蛊火／欲火／阳精／元阳／具体人名…）。
 */
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv;
const argOf = (k, d) => { const i = argv.indexOf(k); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const CARD = argOf('--card', '_staging_2026-10-08-18/仙姝堕.json');
const OUT = 'AI交接/下级更新/2026-10-08-18-gpt17落实/材料/20a_觉醒条件扫描.json';

const RE_A = /(触发条件|成形条件|觉醒条件|形成条件|前置条件|开启条件|达成条件|判定条件)/;
const RE_B = /(唯有|只有|必须|须|需|非)[^，。；！？]{0,18}(方能|才能|才可|才成|不能|方可|始成|方得|才得)/;
const RE_C = /(依赖|凭借|借助|靠)[^，。；！？]{0,14}(方能|才能|才可|才成|不能|方可|方得)/;
const RE_D = /非[^，。；！？]{0,14}(不能|不破|不成)/;
const OBJ = /(龙气|真龙|至阳|纯阳|阳精|元阳|龙阳|雷|佛法|蛊火|欲火|媚毒|阵力|阵丹|赵无忧|九皇子|炎雷子|阎雷子|残阳老怪|极乐太子|肉山佛|病相思|孤月|叶红缨|闻观语|楚灵夜|苏瑶|苏玲)/;

const hits = [];
const push = (来源, 类型, 文本, 偏移) => {
  const s = String(文本);
  const 句 = (() => {
    const a = Math.max(s.lastIndexOf('。', 偏移), s.lastIndexOf('\n', 偏移), s.lastIndexOf('；', 偏移));
    let b = s.length;
    for (const ch of ['。', '\n', '；']) { const i = s.indexOf(ch, 偏移); if (i >= 0 && i < b) b = i; }
    return s.slice(a + 1, b).trim();
  })();
  if (句.length < 6) return;
  const objs = [...new Set((句.match(new RegExp(OBJ.source, 'g')) || []))];
  const 名器 = [...new Set((句.match(/[\u4e00-\u9fa5]{2,6}(?:穴|乳|菊|花|潮生穴|噙香乳|菩提菊)/g) || []))];
  hits.push({ 来源, 类型, 依赖对象: objs, 疑似名器: 名器, 句: 句.slice(0, 160) });
};

function scanText(来源, text) {
  const s = String(text || '');
  for (const [re, 类型] of [[RE_A, 'A·条件词'], [RE_B, 'B·唯有/必须…方能'], [RE_C, 'C·依赖/借助…方能'], [RE_D, 'D·非X不能']]) {
    const g = new RegExp(re.source, 'g');
    let m;
    while ((m = g.exec(s))) push(来源, 类型, s, m.index);
  }
}

/* ① 候选卡：条目 ＋ 脚本 */
const card = JSON.parse(fs.readFileSync(CARD, 'utf8'));
const es = card.data.character_book.entries || [];
for (const e of es) if (/名器|relic/i.test(e.comment || '') || /<relic>/.test(e.content || '')) scanText('卡内条目 id' + e.id + ' ' + e.comment, e.content);
for (const sc of ((card.data.extensions.tavern_helper || {}).scripts || [])) scanText('卡内脚本·' + sc.name, sc.content);

/* ② 生产源 */
scanText('src/mingqi-db.js', fs.readFileSync('src/mingqi-db.js', 'utf8'));
scanText('卡片脚本/状态状态机.js', fs.readFileSync('卡片脚本/状态机.js', 'utf8'));
for (const f of ['卡片脚本/状态栏面板.js', '卡片脚本/_src/状态栏面板.模板.js']) if (fs.existsSync(f)) scanText(f, fs.readFileSync(f, 'utf8'));
{
  const db = JSON.parse(fs.readFileSync('卡片脚本/_src/名器图鉴数据.json', 'utf8'));
  for (const [k, v] of Object.entries(db)) {
    if (v && v.brief) scanText('图鉴数据·' + k + '（brief）', v.brief);
    for (const [st, o] of Object.entries(v.stages || {})) {
      if (o && o.desc) scanText('图鉴数据·' + k + '·阶段' + st + '（desc）', o.desc);
      if (o && o.lock) scanText('图鉴数据·' + k + '·阶段' + st + '（lock）', o.lock);
    }
  }
}
{
  const wb = JSON.parse(fs.readFileSync('references/仙姝墮-世界书.json', 'utf8'));
  const list = Array.isArray(wb.entries) ? wb.entries : Object.values(wb.entries || {});
  for (const e of list) {
    const t = String(e.comment || '');
    if (/名器|九幽玄阴|灼酒|璎乳|菩提菊|同心|噙香|潮生|缘心|梅蕊|冰魄|弦鸣|流焰|凤羽|烟霞/.test(t + String(e.content || ''))) scanText('世界书源 uid' + e.uid + ' ' + t, e.content);
  }
}

/* 去重（同一来源同一句只留一次） */
const seen = new Set();
const uniq = hits.filter((h) => { const k = h.来源 + '|' + h.句; if (seen.has(k)) return false; seen.add(k); return true; });

const out = { 卡: CARD, 只读: true, 命中总数: uniq.length, 按来源: {}, 明细: uniq };
for (const h of uniq) out.按来源[h.来源] = (out.按来源[h.来源] || 0) + 1;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');

console.log('扫描范围：' + CARD + '（条目/脚本）＋ mingqi-db ＋ 状态机 ＋ 面板与模板 ＋ 图鉴数据 ＋ 世界书源');
console.log('条件型命中 ' + uniq.length + ' 处：\n');
for (const h of uniq) {
  console.log('· [' + h.类型 + '] ' + h.来源);
  console.log('    句：' + h.句);
  console.log('    依赖对象：' + (h.依赖对象.length ? h.依赖对象.join('、') : '（未识别）') + (h.疑似名器.length ? '｜疑似名器：' + h.疑似名器.join('、') : ''));
}
