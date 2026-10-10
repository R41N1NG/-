/** 身份：gpt。双层账本只读合并与有限恢复；人工覆盖由外部服务最后应用。 */
function createXsdLedgerReader({ getPrerequisites }) {
function mergeStatLayers(chatV, msgV, context = {}) {
  const cs = (chatV && chatV.stat_data && typeof chatV.stat_data === 'object') ? chatV.stat_data : null;
  const ms = (msgV && msgV.stat_data && typeof msgV.stat_data === 'object') ? msgV.stat_data : null;
  if (!cs && !ms) return null;
  const stat = Object.assign({}, cs || {}, ms || {});
  const ck = (cs && cs.known && typeof cs.known === 'object') ? cs.known : null;
  const mk = (ms && ms.known && typeof ms.known === 'object') ? ms.known : null;
  if (ck || mk) stat.known = Object.assign({}, ck || {}, mk || {});
  // ── 账本与事务来源自愈保底（防止因单层空读或初始化时差误置 false）──
  stat.known = stat.known || {};
  const controls = cs && cs.人工纠错 && String(cs.人工纠错.chatId) === String(context.chatId)
    ? cs.人工纠错.覆盖 || {} : {};
  const setKnown = (field, value) => {
    const control = controls[JSON.stringify(['known', field])];
    stat.known[field] = control && typeof control.value === 'boolean' ? control.value : value;
  };
  for (const record of Object.values(controls)) {
    if (record && Array.isArray(record.path) && record.path[0] === 'known' && typeof record.value === 'boolean') setKnown(record.path[1], record.value);
  }
  if (stat.锚点账本 && typeof stat.锚点账本 === 'object') {
    for (const k of Object.keys(stat.锚点账本)) {
      const entry = stat.锚点账本[k];
      if (entry && Array.isArray(entry.新置真)) {
        for (const f of entry.新置真) setKnown(f, true);
      }
    }
  }
  const book = stat.破处者 && typeof stat.破处者 === 'object' ? stat.破处者 : {};
  for (const holder of Object.keys(book)) if (book[holder]) setKnown(holder + '处女丧失', true);
  const prerequisites = getPrerequisites();
  const recovered = [];
  for (const [form, required] of Object.entries(prerequisites)) {
    if (!required.every(field => stat.known[field] === true)) continue;
    setKnown(form, true);
    if (stat.known[form] !== true) continue;
    const relic = form.replace(/成形$/, '');
    setKnown((relic === '灵犀同心' ? '灵犀同心穴' : relic) + '一阶段', true);
    recovered.push(relic);
  }
  const identity = String(stat.身份 || '');
  const owners = stat.名器归属 && typeof stat.名器归属 === 'object' ? stat.名器归属 : {};
  if (recovered.some(relic => owners[relic] && owners[relic] === identity)) setKnown('获得任意名器', true);
  return stat;

}
return Object.freeze({ mergeStatLayers });
}
