/* 一次性补丁：自设的归属判定改为「NPC 白名单以外一律算自己」
 *  真机 2026-10-07：自设游玩，灼酒流炎穴 弹窗写「目前归属者：刘政宏（已被占据）」且纹章反色。
 *  原因：名器归属表里记的是玩家自设的 persona 名（刘政宏），而 stat_data.身份 只写「自设」，
 *        旧的 isCustom 分支要求「owner 里含『自设』字样或与身份互为包含」，两者对不上 ⇒ 判成他人。
 */
import fs from 'node:fs';

const files = ['卡片脚本/状态栏面板.js', '卡片脚本/_src/状态栏面板.模板.js'];
const log = [];

const OLD = "if (isCustom && (owner === '自设' || owner.indexOf('自设') !== -1 || !idText || xsdSamePerson(owner, idText))) return true;";
const NEW = [
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

for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  if (!s.includes(OLD)) {
    log.push((s.includes('NPC_RE') ? '– ' : '✘ ') + f + '：目标行未命中（' + (s.includes('NPC_RE') ? '已改过' : '形态不同') + '）');
    continue;
  }
  s = s.replace(OLD, NEW);
  fs.writeFileSync(f, s, 'utf8');
  log.push('✔ ' + f + '：自设归属改为 NPC 白名单以外算自己');
}
console.log(log.join('\n'));
