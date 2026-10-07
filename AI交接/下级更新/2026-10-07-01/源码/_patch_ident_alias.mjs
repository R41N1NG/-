/* 一次性补丁：面板加入身份别名组与 xsdSamePerson，并修正名器归属校验口径
 *  运行：node tools/_patch_ident_alias.mjs
 *  说明：殿主开局的身份是称号（魂欢殿主），名器归属常写本名（鬼医病相思），
 *        原判定只做字符串相等 ⇒ 判成「别人占据」⇒ 纹章反色。改为按别名组比对。
 */
import fs from 'node:fs';

const files = [
  '卡片脚本/状态栏面板.js',
  '卡片脚本/_src/状态栏面板.模板.js',
];
const log = [];

const helper = [
  '/** 身份别名组（同一人物的不同写法／称号）——名器归属判定不能只靠字符串相等：',
  ' *  殿主开局的身份是**称号**（如「魂欢殿主」），而名器归属常写成**本名**（如「鬼医病相思」），',
  ' *  两份写法对不上就会被判成「别人占据」，纹章反色。',
  ' */',
  'const XSD_IDENT_GROUPS = [',
  "  ['魂欢殿主', '病相思', '鬼医病相思', '鬼醫病相思'],",
  "  ['焚欲殿主', '残阳老怪', '焚欲殿'],",
  "  ['欢喜殿主', '肉山佛', '欢喜殿'],",
  "  ['浊龙殿主', '九皇子', '浊龙殿'],",
  "  ['赵无忧'],",
  '];',
  '/** 两个人名（或称号）是否指同一个人：先直接包含，再按别名组交叉命中。',
  ' *  @returns {boolean} */',
  'function xsdSamePerson(a, b) {',
  '  const x = s0(a); const y = s0(b);',
  '  if (!x || !y) return false;',
  '  if (x === y || x.indexOf(y) !== -1 || y.indexOf(x) !== -1) return true;',
  '  for (const g of XSD_IDENT_GROUPS) {',
  '    let hx = false, hy = false;',
  '    for (const n of g) { if (x.indexOf(n) !== -1) hx = true; if (y.indexOf(n) !== -1) hy = true; }',
  '    if (hx && hy) return true;',
  '  }',
  '  return false;',
  '}',
  '',
].join('\n');

const OLD_FALLBACK = 'if (idText && (idText === owner || idText.includes(owner) || owner.includes(idText))) return true;';
const NEW_FALLBACK = 'if (xsdSamePerson(owner, idText)) return true;   /* 别名／口径统一：殿主称号 ↔ 本名 */';
const OLD_CUSTOM = "if (isCustom && (owner === '自设' || owner.includes('自设') || !idText || owner === idText || idText.includes(owner) || owner.includes(idText))) return true;";
const NEW_CUSTOM = "if (isCustom && (owner === '自设' || owner.indexOf('自设') !== -1 || !idText || xsdSamePerson(owner, idText))) return true;";

for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes('XSD_IDENT_GROUPS')) { log.push('– ' + f + '：已含别名表，跳过插入'); }
  else {
    const i = s.indexOf('function xsdRelicState(');
    if (i < 0) { log.push('✘ ' + f + '：找不到 xsdRelicState'); continue; }
    s = s.slice(0, i) + helper + '\n' + s.slice(i);
  }
  if (s.includes(OLD_FALLBACK)) { s = s.replace(OLD_FALLBACK, NEW_FALLBACK); log.push('✔ ' + f + '：归属兜底改用 xsdSamePerson'); }
  else log.push('– ' + f + '：兜底行已改过或形态不同');
  if (s.includes(OLD_CUSTOM)) { s = s.replace(OLD_CUSTOM, NEW_CUSTOM); log.push('✔ ' + f + '：自设分支也接 samePerson'); }
  fs.writeFileSync(f, s, 'utf8');
}
console.log(log.join('\n'));
