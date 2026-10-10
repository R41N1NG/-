/* 身份：gpt。首楼读取由这一层承担，纯核只选择，写回仍由原applyStatus统一负责。 */
const XSD_TIME_BASIS = createXsdTimeBasis(XSD_CALENDAR);
function resolveCalendarBasis(sdNow) {
  const input = { storedBasis: sdNow.历基准, identity: sdNow.身份, initialTime: sdNow.初始时点 };
  let openingLine = '';
  if (XSD_TIME_BASIS.needsOpening(input)) {
    try { openingLine = pickTimepointLine(String(messageText(1) || '')); }
    catch (error) { /* 首楼读不到仍走原共享默认，不读当前AI正文。 */ }
  }
  return XSD_TIME_BASIS.select({ ...input, openingLine });
}
