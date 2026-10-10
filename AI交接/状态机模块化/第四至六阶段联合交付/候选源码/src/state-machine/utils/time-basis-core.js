/* XSD_TIME_BASIS_CORE_BEGIN */
/* 身份：gpt。显式选择可信时间基准：不接受当前AI正文、不读取宿主、不写账。
 * 输入openingLine由适配层从首楼唯一“当前时点”行提供；解析不等于事实批准。 */
function createXsdTimeBasis(calendar) {
  'use strict';
  const starts = {
    赵无忧: { ym: 1578.03, day: 3 },
    焚欲殿主: { ym: 1578.08, day: 1 }, 浊龙殿主: { ym: 1578.08, day: 1 },
    欢喜殿主: { ym: 1578.08, day: 1 }, 魂欢殿主: { ym: 1578.08, day: 1 },
  };
  const validInitial = value => isFinite(Number(value)) && Number(value) > 0;
  function needsOpening({ storedBasis, identity, initialTime }) {
    if (Number(storedBasis) || 0) return false;
    if (starts[String(identity || '')]) return false;
    return !validInitial(initialTime);
  }
  function select({ storedBasis, identity, initialTime, openingLine }) {
    const saved = Number(storedBasis) || 0;
    if (saved) return { basis: saved, source: 'stored-basis', saveBasis: false, initialTime: null, logOpening: false };
    const fixed = starts[String(identity || '')];
    if (fixed) return { basis: calendar.ymToMonths(fixed.ym) + (fixed.day - 1) / 30,
      source: 'identity', saveBasis: true, initialTime: null, logOpening: false };
    let start = Number(initialTime);
    let discovered = null;
    if (!validInitial(start)) {
      const picked = openingLine ? calendar.parseXianmengFromText(openingLine) : null;
      if (picked) { start = calendar.ymToMonths(picked.ym) + (picked.day - 1) / 30; discovered = start; }
    }
    const valid = validInitial(start);
    return { basis: valid ? start : calendar.ymToMonths(1578.03) + 2 / 30,
      source: discovered !== null ? 'opening-line' : valid ? 'stored-opening' : 'default',
      saveBasis: true, initialTime: discovered, logOpening: true };
  }
  return Object.freeze({ needsOpening, select });
}
/* XSD_TIME_BASIS_CORE_END */
