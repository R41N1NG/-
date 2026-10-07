/* 一次性补丁：名器归属改为「结构性判定」，不再靠枚举玩家名
 *
 *  主人指正（2026-10-07）：「那是玩家的名字，不是我的，千千万万个玩家呢，你白名单加的完吗？」
 *  ⇒ 玩家名不能枚举。改成两条结构性来源：
 *     ① 玩家名从宿主上下文取（SillyTavern.getContext().name1）—— 任何玩家的名字都从这儿来；
 *     ② 「是不是剧中人物」只认**卡片自带名册**（立绘命名表 XSD_PINYIN 的 18 个登记名）
 *        与既有别名组（四殿主称号↔本名），不再另写死名单。
 *     自设身份下：认不出是剧中人的归属者，一律算**玩家自己**。
 */
import fs from 'node:fs';

const files = ['卡片脚本/状态栏面板.js', '卡片脚本/_src/状态栏面板.模板.js'];
const log = [];

const OLD = [
  'if (isCustom) {',
  '        /* 自设：除非归属者是**有名有姓的剧中 NPC**，一律算自己。',
  '           玩家的自设名通常是 persona 名（如「刘政宏」），而 stat_data.身份 只写「自设」，',
  '           两者对不上就会被误判成「别人占据」（真机 2026-10-07：灼酒流炎穴 归属=刘政宏 却反色）。 */',
  '        const NPC_RE = /赵无忧|残阳老怪|肉山佛|九皇子|病相思|鬼医病相思|焚欲殿主|欢喜殿主|浊龙殿主|魂欢殿主/;',
  '        if (!NPC_RE.test(owner)) return true;',
  '        if (xsdSamePerson(owner, idText)) return true;',
  '        return false;',
  '      }',
].join('\n');

const NEW = [
  'if (isCustom) {',
  '        /* 自设：**结构性判定**，不枚举玩家名（主人 2026-10-07 指正）。',
  '           ① 归属者＝玩家本人（宿主 persona 名，或本人身份文本）⇒ 自己；',
  '           ② 归属者命中卡片自带名册（立绘命名表 18 名）或别名组（四殿主称号↔本名）⇒ 剧中人 ⇒ 他人；',
  '           ③ 其余（任何玩家自取的名字）⇒ 算自己。 */',
  '        if (mine(owner)) return true;',
  '        if (xsdIsCast(owner)) return false;',
  '        return true;',
  '      }',
].join('\n');

const HELPER_ANCHOR = 'function xsdSamePerson(a, b) {';
const HELPER = [
  '/** 宿主上下文里的玩家名（persona 名）—— 千千万万玩家的名字都从这儿来，不写死。 */',
  'function xsdPlayerNames() {',
  '  const out = [];',
  '  const push = (v) => { const s = s0(v); if (s && out.indexOf(s) === -1) out.push(s); };',
  '  const getS = (w) => { try { return w && w.SillyTavern; } catch (e) { return null; } };',
  '  let wins = [];',
  '  try { wins.push(window); } catch (e) { /* 忽略 */ }',
  '  try { wins.push(window.parent); } catch (e) { /* 忽略 */ }',
  '  try { wins.push(window.top); } catch (e) { /* 忽略 */ }',
  '  for (const w of wins) {',
  '    const S = getS(w);',
  '    if (!S || typeof S.getContext !== "function") continue;',
  '    try { const c = S.getContext(); push(c && c.name1); push(c && c.name2); } catch (e) { /* 跨源 */ }',
  '  }',
  '  return out;',
  '}',
  '/** 归属者是不是「剧中人」：先看卡片自带名册（立绘命名表），再看别名组里的本名。',
  ' *  名册与别名组都是**卡片自己的数据**，不额外维护玩家名单。 */',
  'function xsdIsCast(nm) {',
  '  const y = s0(nm);',
  '  if (!y) return false;',
  '  try {',
  '    const table = (typeof XSD_PINYIN === "object" && XSD_PINYIN) ? Object.keys(XSD_PINYIN) : [];',
  '    for (const n of table) { const k = s0(n); if (k && (y.indexOf(k) !== -1 || k.indexOf(y) !== -1)) return true; }',
  '  } catch (e) { /* 表不可用 */ }',
  '  for (const g of XSD_IDENT_GROUPS) { for (const n of g) { if (y.indexOf(n) !== -1) return true; } }',
  '  return false;',
  '}',
].join('\n');

for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes('xsdPlayerNames')) { log.push('– ' + f + '：已改过，跳过'); continue; }
  if (!s.includes(OLD)) { log.push('✘ ' + f + '：目标段未命中'); continue; }
  const hi = s.indexOf(HELPER_ANCHOR);
  if (hi < 0) { log.push('✘ ' + f + '：找不到 xsdSamePerson'); continue; }
  s = s.slice(0, hi) + HELPER + '\n' + s.slice(hi);
  s = s.replace(OLD, NEW);
  /* isMe 里给 mine() 提供实现（放在校验段之前） */
  const chk = s.indexOf('    // 3. 校验：当前身份是否等于归属者');
  if (chk > 0) {
    const mineDef = [
      '    // 3. 校验：当前身份是否等于归属者',
      '    const _playerNames = xsdPlayerNames();',
      '    const mine = (nm) => {',
      '      if (xsdSamePerson(nm, idText)) return true;',
      '      for (const p of _playerNames) { if (xsdSamePerson(nm, p)) return true; }',
      '      return false;',
      '    };',
    ].join('\n');
    s = s.slice(0, chk) + mineDef + s.slice(chk + '    // 3. 校验：当前身份是否等于归属者'.length);
  } else {
    log.push('⚠ ' + f + '：没找到校验段注释，mine() 未注入（会导致 ReferenceError，已放弃该文件）');
    continue;
  }
  fs.writeFileSync(f, s, 'utf8');
  log.push('✔ ' + f + '：归属改为「玩家名（宿主）＋卡片名册」结构性判定');
}
console.log(log.join('\n'));
