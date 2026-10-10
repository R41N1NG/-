/* XSD_CALENDAR_CORE_BEGIN */
/* 身份：gpt。日期计算独立作用域：无宿主API、DOM、日志、存取或启动副作用。
 * 声明工厂供卡内拼接与Node离线加载共用同一真源，不向window挂载接口。 */
function createXsdCalendar() {
  'use strict';
const LISHI_CAP = 0.1;            // 常规单笔最多三日，超限整笔拒绝。
const LISHI_CAP_TRANSIT = 12;     // 合法转场单笔最多一年。

/** 显式输入，不读取宿主、完整stat_data或共享变量，不产生日志/写入。
 * @returns {{acc:number, adv:number, sameFloor?:boolean, clipped:boolean, rejected:boolean, capM:number, raw:number}}
 * 人工同楼分支保留旧返回形状（没有sameFloor）；兼容旧数值转换与缺失回退。
 */
function calculateAdvance({ accumulated, fallbackOffset, previousFloor, previousAdvance,
  manualLocked, manualFloor, floor, months, transit }) {
  if (manualLocked && Number(manualFloor) === Number(floor)) {
    return { acc: Number(accumulated) || 0, adv: 0, clipped: false, rejected: false, raw: 0, capM: LISHI_CAP };
  }
  const xsdNum = (v) => (v === null || v === undefined || v === '' ? NaN : Number(v));
  const nAcc = xsdNum(accumulated);
  const nPush = xsdNum(fallbackOffset);
  const sameFloor = Number(previousFloor) === Number(floor);
  let acc = isFinite(nAcc) ? nAcc : (isFinite(nPush) ? nPush : 0);
  if (sameFloor) acc = Math.max(0, acc - (Number(previousAdvance) || 0));
  if (!isFinite(acc) || acc < 0) acc = 0;
  const capM = transit ? LISHI_CAP_TRANSIT : LISHI_CAP;
  let adv = 0;
  let clipped = false;
  let rejected = false;
  if (Number(months) > 0) {
    const raw = Number(months);
    clipped = raw > capM;
    if (clipped) {
      adv = 0;
      rejected = true;
    } else {
      adv = raw;
      acc = acc + adv;
    }
  }
  return { acc, adv, sameFloor, clipped, rejected, capM, raw: Number(months) || 0 };
}

const LISHI_TRANSIT_RE = /((闭关|数月|数日|数载|隔日|翌日|次日|翌月|次月|开春|入秋|半月|一月|两月|三月|半年|一年|旅程|远行|渡舟|赶路|回宗|返程|数周|一旬|旬日|半月后|数日后|一月后)|([一二三四五六七八九十两半\d]\s*个月|数个月|几个月|数旬|一季|两季))/;   /* 2026-10-08（gpt 04 号②）：原式只认「一月」不认「一个月」⇒ 解析成 1 月却按常规 0.02 截掉 */

const CN_DAY = ['', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

function cnNum(t) {
  /* gpt P1-8 兜底：允许直接传「初X」 */
  { const raw = String(t ?? '').trim(); if (raw.startsWith('初') && raw.length > 1) t = raw.slice(1); }
  
  const D = '〇一二三四五六七八九';
  const x = String(t || '').trim();
  if (!x) return 0;
  if (/^\d+$/.test(x)) return Number(x);
  if (x === '十') return 10;
  if (x === '正') return 1;      // 正月
  if (x === '冬') return 11;     // 冬月
  if (x === '腊') return 12;     // 腊月
  if (x[0] === '廿') return 20 + Math.max(0, D.indexOf(x[1]));
  if (x[0] === '卅') return 30 + Math.max(0, D.indexOf(x[1]));   /* gpt P1-8：卅一=31（原来一律返回 30，把非法日当成 30 收下）*/
  const m = /^([一二三四五六七八九])?十([一二三四五六七八九])?$/.exec(x);
  if (m) return (m[1] ? D.indexOf(m[1]) : 1) * 10 + (m[2] ? D.indexOf(m[2]) : 0);
  if (x.length === 1) { const n = D.indexOf(x); if (n >= 0) return n; }
  return 0;
}

function pickTimepointLine(t) {
  const hits = String(t || '').split('\n').filter((l) => /当前时点/.test(l));
  if (hits.length !== 1) return '';
  const m = /当前时点[：:]\s*(.+)$/.exec(hits[0].trim());
  return m ? m[1].trim() : '';
}

function parseXianmengFromText(t) {
  const m = /仙盟历\s*(\d{3,4})\s*年\s*[·\.、]?\s*([一二三四五六七八九十廿卅正冬腊]{1,3}|\d{1,2})\s*月\s*(?:[·\.、]?\s*(初[一二三四五六七八九十]{1,2}|[一二三四五六七八九十廿卅]{1,3}|\d{1,2})\s*日?)?/.exec(String(t || ''));
  if (!m) return null;
  const y = Number(m[1]);
  const mo = cnNum(m[2]);
  if (!y || mo < 1 || mo > 12) return null;
  let dayNum = 1;
  const ds = String(m[3] || '');
  if (ds) {
    if (ds.startsWith('初')) dayNum = cnNum(ds.slice(1));
    else dayNum = cnNum(ds);
  }
  if (!(dayNum >= 1 && dayNum <= 30)) return null;      // 31 日及越界一律判无效（不静默改成初一）
  return { ym: y + mo / 100, day: dayNum };
}

/** 带日的完整写法：`仙盟历 1578 年 · 三月初三` */
function fmtXianmengDay(v, day) {
  const d = Math.max(1, Math.min(30, Math.round(Number(day) || 1)));
  return '仙盟历 ' + fmtXianmeng(v) + CN_DAY[d];
}
const LISHI_WORDS = [
  ['一个时辰', 0.003], ['半个时辰', 0.003], ['一炷香', 0.01], ['半炷香', 0.01],
  ['一夜', 1 / 30], ['一日', 1 / 30], ['三天', 0.1], ['三日', 0.1],
  ['半月', 0.5], ['一月', 1], ['三月', 3], ['一年', 12],
];
function parseLishi(s) {
  const txt = String(s || '').trim();
  if (!txt || /^[—\-－无]+$/.test(txt)) return 0;
  /* 2026-10-08（gpt 04 号④ ＋ 17 号 §5-4）：倒计时／**未来计划**不计增量。
     『距启程 3 日』『还有两日』『师尊说三日后启程』『定于/拟于/约于 X』一律 0；
     只有明写"已过／已经过／历经"的转场才算（例：『三日已过，我们启程』⇒ 计 3 日）。 */
  const XSD_PASSED = /已过|已经过|过了|历经|这一过/.test(txt);
  if (!XSD_PASSED && /倒计时|距[^，。；]{0,12}?[日天]|还有[^，。；]{0,6}?[日天]|将于|预定于|定于|拟于|约于/.test(txt)) return 0;
  if (!XSD_PASSED && /((说|约定|打算|计划|准备|拟)[^，。；]{0,10}([日天月]|个月)(后|之后))|(([日天月]|个月)后[^，。；]{0,6}(启程|出发|动身|前往|赴))/.test(txt)) return 0;
  let best = 0;
  // ① 优先解析带数量词的常规表达（支持复合中文数字与阿拉伯数字，如：十一日、十五天、2日），避免被「一日」「三日」等短词子串截胡
  const parseCnNum = (str) => {
    if (/^\d+$/.test(str)) return Number(str);
    if (str === '半') return 0.5;
    if (str === '两') return 2;
    const CN = { 零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
    if (CN[str] !== undefined) return CN[str];
    if (str.startsWith('十')) return 10 + (CN[str.slice(1)] || 0);
    if (str.includes('十')) {
      const parts = str.split('十');
      return ((CN[parts[0]] || 1) * 10) + (CN[parts[1]] || 0);
    }
    return NaN;
  };
  const n = /([一二三四五六七八九十两半\d]+)\s*(个?时辰|日|天|个?月|年)/.exec(txt);
  if (n) {
    const v = parseCnNum(n[1]);
    const uMap = { 时辰: 0.003, 个时辰: 0.003, 日: 1 / 30, 天: 1 / 30, 月: 1, 个月: 1, 年: 12 };   /* 2026-10-08（gpt 04 号①）：统一 30 日/月精确单位，一日 ＝ 1/30 ＝ 0.03333 */
    const u = uMap[n[2]] || 0;
    if (isFinite(v) && v > 0) best = v * u;
  }
  // ② 专有或特定词表兜底（如 一夜、一炷香、半个时辰等）
  if (!best) {
    for (const [w, m] of LISHI_WORDS) if (txt.includes(w) && m > best) best = m;
  }
  return best;   /* gpt P1-7：内层不再提前截断 —— 过渡历时会被 0.02 吃掉；截断统一交外层 capM */
}
function fmtXianmeng(v) {
  const y = Math.floor(v + 1e-9);
  const m = Math.max(1, Math.min(12, Math.round((v - y) * 100)));
  return y + ' 年 · ' + ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'][m] + '月';
}

/** 年.月（如 1578.12）转为绝对连续月数标量，彻底杜绝跨年相减 0.89 偏差 */
function ymToMonths(ym) {
  const v = Number(ym) || 0;
  const y = Math.floor(v + 1e-9);
  const m = Math.max(1, Math.min(12, Math.round((v - y) * 100)));
  return y * 12 + (m - 1);
}

/** 连续绝对月数转回 年.月 兼容浮点，格式化为标准仙盟历 */
function monthsToYm(totalMonths) {
  const tm = Number(totalMonths) || 0;
  const y = Math.floor(tm / 12);
  const m = Math.floor(tm % 12) + 1;
  const frac = tm - Math.floor(tm);
  return Math.round((y + (m / 100) + (frac * 0.005)) * 10000) / 10000;
}

function hasTransit(elapsedText, bodyText) {
  return LISHI_TRANSIT_RE.test(String(elapsedText || '') + ' ' + String(bodyText || '').slice(0, 400));
}
function dayOfMonth(totalMonths) {
  return 1 + Math.floor((((totalMonths % 1) + 1) % 1) * 30 + 1e-9);
}
return Object.freeze({
  caps: Object.freeze({ regular: LISHI_CAP, transit: LISHI_CAP_TRANSIT }),
  calculateAdvance, cnNum, pickTimepointLine, parseXianmengFromText, fmtXianmengDay,
  parseLishi, fmtXianmeng, ymToMonths, monthsToYm, hasTransit, dayOfMonth,
});
}
/* XSD_CALENDAR_CORE_END */
