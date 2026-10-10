/* XSD_CALENDAR_ADAPTER_BEGIN */
/* 身份：gpt。旧调用名兼容层：仅这里读取账本字段、输出拒绝日志。
 * 其它模块继续使用原函数签名，纯核只接受明确的日期/历时输入。 */
const XSD_CALENDAR = createXsdCalendar();

function nextAcc(sdNow, messageId, stepM, hasTransit) {
  const o = sdNow || {};
  const result = XSD_CALENDAR.calculateAdvance({
    accumulated: o.历时累计, fallbackOffset: o.时点加速,
    previousFloor: o.最后处理楼号, previousAdvance: o.本楼历时加速,
    manualLocked: !!o.人工校历, manualFloor: o.人工校历 && o.人工校历.楼,
    floor: messageId, months: stepM, transit: hasTransit,
  });
  if (result.rejected) {
    console.warn('[历时·拒绝] 本楼申报 ' + result.raw + ' 月 超过单笔上限 ' + result.capM + ' 月 ⇒ **整笔不计入**（累计保持 ' +
      result.acc + ' 月）。要推这么多，请走合法转场（明写时间流逝）或由 GM 面板确认；后台已记 [历时待确认]。');
  }
  return result;
}
function cnNum(t) { return XSD_CALENDAR.cnNum(t); }
function pickTimepointLine(t) { return XSD_CALENDAR.pickTimepointLine(t); }
function parseXianmengFromText(t) { return XSD_CALENDAR.parseXianmengFromText(t); }
function fmtXianmengDay(v, day) { return XSD_CALENDAR.fmtXianmengDay(v, day); }
function parseLishi(s) { return XSD_CALENDAR.parseLishi(s); }
function fmtXianmeng(v) { return XSD_CALENDAR.fmtXianmeng(v); }
function ymToMonths(ym) { return XSD_CALENDAR.ymToMonths(ym); }
function monthsToYm(totalMonths) { return XSD_CALENDAR.monthsToYm(totalMonths); }
/* XSD_CALENDAR_ADAPTER_END */
/** 标签 → 变量键（**与 `状态栏面板.js` 的 FIELD_MAP 同源**，改一处必须改两处）
 *  ⚠️ `身份` 在这里只用于「认得出这一行」，**不写进变量**：变量里的 `身份` 是机器字段
 *     （只能是 6 个身份名之一，闸门靠它判真假），写进「墨山道六弟子 · 赵无忧」会把闸门搞坏。
 *  ⚠️ 键的**声明顺序＝状态栏里一级标签的固定顺序**（时间→…→关系刻度，共 16 个；另有序
 *     `进度`，它不进这张表也不写变量，只做一致性校验）。 */
