/** 身份：gpt。世界事件日期与自由字段策略核，无宿主读写。 */
function createXsdPlotPolicy() {
const FREE_FIELD_WHITELIST = ['局势', '近闻', '远闻', '危机', '目标', '阶段总结'];
const FREE_WORLD_EVENTS = [
  { 名: '南域大劫', 起点: 1578.08, 宣言: /(神诅|大劫|粉黑天穹|再无元婴)[^，。；！？]{0,10}(已|已经|正在|正|降下|降临|爆发|压在|笼罩)/ },
  { 名: '正式兽潮', 起点: 1579.01, 宣言: /(兽潮|妖兽潮|围城|城防|防线)[^，。；！？]{0,12}(已|已经|正在|正|一波接一波|数日|兵临城下|破关|破门|压城|围了|杀到|冲破|溃缩|溃退|崩溃|失守|告急|溃败)/ },
  { 名: '天溪城破', 起点: 1579.03, 宣言: /(城破|城陷|陷落|城门失守|城墙崩|大阵告破|化为焦土|沦为焦土)/ },
];
const FREE_NEGATED_OR_PLAN = /传闻|据说|听说|谣传|或将|将要|即将|可能|恐怕|尚未|还没|未至|未到|计划|打算|预定|约期|若是|万一|倘若|假如|是否/;

/* 2026-10-08（主人令·选 C）：**泛指战事**不拦，只记账待核 —— gpt 原话「歧义不自动写真，待核」。
 *   六个自由字段里若出现「战火／战事／兵灾／战乱／兵锋／战报／血战」这类**没点名的战争话**，
 *   而当时的可信时点又早于世界事件最早的起点（大劫 1578.08），就记进 `stat_data.自由字段待核`：
 *   **照写、不拒**，只在后台留痕（日志 ＋ 待核台账），由主人/GM 决定要不要清。
 *   传闻／计划／否定／疑问／回忆（当年、昔日…）一律不标。 */
const FREE_VAGUE_WAR = /(战火|战事|兵灾|战乱|兵锋|兵戈|战报|军情|血战|恶战|厮杀|烽烟|烽火)/;
const FREE_SUSPECT_EXEMPT = /传闻|据说|听说|谣传|曾经|当年|昔日|从前|彼时|将要|即将|打算|计划|预定|若是|万一|倘若|假如|是否|尚未|还没|未至|未到/;
const FREE_SUSPECT_FLOOR = 1578.08;   /* 世界事件最早起点（大劫）：过了它，泛指战事属正常，不再标待核 */

/** 返回 {suspect:false} 或 {suspect:true, 事件, 因由, 分句}（纯函数，可离线测） */
function freeFieldSuspect(field, val, sd) {
  if (FREE_FIELD_WHITELIST.indexOf(field) === -1) return { suspect: false };
  if (!val || typeof val !== 'string' || val === '—' || val === '无') return { suspect: false };
  const dnum = Number(sd && sd.仙盟历);
  if (isFinite(dnum) && dnum >= FREE_SUSPECT_FLOOR) return { suspect: false };
  const 命中 = String(val).split(/[，。；！？\n]/).filter((c) => FREE_VAGUE_WAR.test(c) && !FREE_SUSPECT_EXEMPT.test(c));
  if (!命中.length) return { suspect: false };
  return {
    suspect: true, 事件: '战事（泛指）',
    因由: (!isFinite(dnum) ? '时点不可信' : ('当前 ' + dnum + ' 早于大劫起点 ' + FREE_SUSPECT_FLOOR)) + '，而这一格在说战事 ⇒ 标待核（**不拦，只记账**）',
    分句: 命中[0].slice(0, 40),
  };
}

/** 返回 {ok:true} 或 {ok:false, 事件, 因由}（纯函数，可离线测）
 *  ⚠️ 豁免是**按分句**判的：只有"含该事件宣言的那个分句"里出现传闻/计划/否定词才豁免。
 *     否则「兽潮已破两处防区，援军未至」会因为末尾一句"未至"被整段放过（实测踩过）。 */
function freeFieldGate(field, val, sd) {
  if (FREE_FIELD_WHITELIST.indexOf(field) === -1) return { ok: true };
  if (!val || typeof val !== 'string' || val === '—' || val === '无') return { ok: true };
  const 分句 = String(val).split(/[，。；！？\n]/);
  const 命中 = [];
  for (const e of FREE_WORLD_EVENTS) {
    for (const c of 分句) {
      if (!e.宣言.test(c)) continue;
      if (FREE_NEGATED_OR_PLAN.test(c)) continue;      /* 该分句是传闻/计划/否定 ⇒ 不算已发生 */
      命中.push(e);
      break;
    }
  }
  if (!命中.length) return { ok: true };
  const dnum = Number(sd && sd.仙盟历);
  for (const e of 命中) {
    if (!isFinite(dnum) || dnum < e.起点) {
      return {
        ok: false, 事件: e.名,
        因由: !isFinite(dnum) ? '当前没有可信时点，无法证明「' + e.名 + '」已到' : ('当前 ' + dnum + ' 未到「' + e.名 + '」起点 ' + e.起点),
      };
    }
  }
  return { ok: true };
}


const EVENT_ANCHOR_START = Object.freeze({ 南域大劫: 1578.08, 天溪城兽潮: 1579.01, 兽潮血战: 1579.01, 天溪城破: 1579.03 });
function autoEventGate(field, state) {
  if (!Object.prototype.hasOwnProperty.call(EVENT_ANCHOR_START, field)) return { ok: true };
  const date = Number(state && state.仙盟历);
  const year = Math.floor(date), month = Math.round((date - year) * 100);
  const valid = Number.isFinite(date) && year > 0 && month >= 1 && month <= 12;
  if (!valid || date < EVENT_ANCHOR_START[field] - 1e-8) return {
    ok: false, 事件: field,
    因由: valid ? '当前 ' + date + ' 未到「' + field + '」起点 ' + EVENT_ANCHOR_START[field] : '当前没有可信年月，不能新增「' + field + '」',
  };
  return { ok: true };
}

function eligibleKnown(known, state) {
 const result = Object.assign({}, known || {});
 const controls = state && state.人工纠错 && state.人工纠错.覆盖 || {};
 for (const field of Object.keys(EVENT_ANCHOR_START)) {
   const control = controls[JSON.stringify(['known', field])];
   if (!autoEventGate(field, state).ok && (!control || control.value !== true)) result[field] = false;
 }
 return result;
}
return Object.freeze({freeFieldGate, freeFieldSuspect, autoEventGate, eligibleKnown,
 FREE_FIELD_WHITELIST, FREE_WORLD_EVENTS, FREE_NEGATED_OR_PLAN, FREE_VAGUE_WAR,
 FREE_SUSPECT_EXEMPT, FREE_SUSPECT_FLOOR, EVENT_ANCHOR_START});
}
