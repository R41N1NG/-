/* ══════════════════════════════════════════════════════════════════════════
 * 派生：来源账本 ＋ 事务撤销（2026-10-08 · gpt 17 号 §2 ⑤⑦⑧ 同批修）
 * ──────────────────────────────────────────────────────────────────────────
 * gpt 原话要点：
 *   ⑤ 「选**实际出场事件**的正文证据触发柳含烟派生，在场/暗处仅辅助；不沿用脱困资格；
 *      名字提及、传闻、回忆、计划不算当前参与；缺证据不补真。」
 *   ⑦ 「该项真实出场派生事务中，若归属尚未有更强的既成来源，写明确 NPC 归属与来源；
 *      已有合法转移／玩家修改不得被每轮默认值覆盖；未出场不因 lord 有值就亮。」
 *   ⑧ 「来源记录＋统一依赖重算／事务撤销；撤一个来源只去掉它的贡献，另有合法来源则保留；
 *      阶段2撤销不能误删独立来源的阶段1；人工来源不静默消失；出场是历史事件，离场不撤二阶段。」
 * ══════════════════════════════════════════════════════════════════════════ */

/** 出场实证：本楼正文里**真的参与了当前场景**才算（提及／传闻／回忆／计划都不算）。
 *  fail-closed：读不到正文一律不算。 */
const APPEAR_VERBS = /(说|道|问|答|笑|叹|看|望|瞧|走|来|去|坐|立|站|行|伸手|抬手|握住|拦住|挡|递|接|点头|摇头|皱眉|转身|出声|开口|走进|出场|露面|现身|化作|扫过|俯|跪下|跪|抱|牵|扶|推|踢|挥|落座|饮|喝|吃)/;
/* gpt ⑤：**传闻／回忆／计划都不算当前参与** —— 窗口里出现这些词就不认定（点名同理）。 */
const APPEAR_EXCLUDE = /传闻|据说|听说|谣传|曾经|当年|昔年|记得|回忆|想起|梦见|将要|即将|打算|计划|预定|若是|万一|倘若|假如|是否|尚未|还没|未至|未到|提到|提起|之名|的名字|画像|名录/;
function 出场实证名(name, prose) {
  const t = String(prose || '');
  const nm = String(name || '');
  if (!nm) return { ok: false, why: '角色名为空' };
  if (!t) return { ok: false, why: '本楼读不到正文 ⇒ 不予认定（fail-closed）' };
  const esc = nm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(.{0,24})' + esc + '(.{0,32})', 'g');
  let m, 试 = 0;
  while ((m = re.exec(t)) && 试 < 40) {
    试++;
    const 窗 = m[1] + nm + m[2];
    if (APPEAR_EXCLUDE.test(窗)) continue;                 /* 传闻／回忆／计划／点名 ⇒ 不算出场 */
    if (negatedAround(t, new RegExp(esc))) continue;       /* 同一句里是否定／未发生 ⇒ 不算 */
    if (APPEAR_VERBS.test(窗)) return { ok: true, 证据: 窗.replace(/\s+/g, ' ').slice(0, 70) };
    if (re.lastIndex <= m.index) re.lastIndex = m.index + 1;
  }
  return { ok: false, why: '正文里没有「' + nm + '」参与当前场景的实证（点名／传闻／回忆／计划不算）' };
}

/** 纯函数：算本轮派生闭包（不写盘）。可离线测。
 *  @param inp { known, news, ledger, 名器归属, 归属来源, messageId, 指纹, 出场实证 }
 *  @returns { news, ledger, 归属补写, 归属来源补写, 撤销, 日志 } */
function deriveRelicClosure(inp) {
  const known = inp.known || {};
  const service = typeof window !== 'undefined' ? window.__xsdCorrection : null;
  const records = inp.人工纠错 && inp.人工纠错.覆盖 || {};
  const manual = f => records[JSON.stringify(['known', f])];
  const allowed = f => !(manual(f) && manual(f).value === false);
  const news = (inp.news || []).filter(allowed);
  const ledger = JSON.parse(JSON.stringify(inp.ledger || {}));
  const 归属来源 = Object.assign({}, inp.归属来源 || {});
  const messageId = inp.messageId;
  const 指纹 = String(inp.指纹 || '');
  const 出场实证 = inp.出场实证 || {};
  const 撤销 = [], 日志 = [], 归属补写 = {}, 归属来源补写 = {};
  let ledgerChanged = false;
  const has = (f) => manual(f) ? manual(f).value === true : known[f] === true || news.includes(f);
  const 来源表 = (f) => (ledger[f] && Array.isArray(ledger[f].来源)) ? ledger[f].来源 : null;
  const 记来源 = (f, 类型, 键, 证据) => {
    if (!ledger[f] || !Array.isArray(ledger[f].来源)) { ledger[f] = { 来源: [] }; ledgerChanged = true; }
    if (!ledger[f].来源.some((s) => s.键 === 键)) {
      ledger[f].来源.push({ 键, 类型, 楼: Number(messageId) || null, 指纹, 证据: String(证据 || '').slice(0, 70) });
      ledgerChanged = true;
    }
  };
  const 有类型 = (f, 类型) => (来源表(f) || []).some((s) => s.类型 === 类型);
  if (!has('烟霞灵乳二阶段') && ledger['烟霞灵乳一阶段']) {
    ledger['烟霞灵乳一阶段'].来源 = (ledger['烟霞灵乳一阶段'].来源 || []).filter(s => s.键 !== '烟霞灵乳二阶段成立');
    ledgerChanged = true;
  }

  /* ⑤① 柳含烟**实际出场** ⇒ 烟霞灵乳二阶段（不再沿用 known['阎雷子脱困'] 当资格） */
  const 场 = 出场实证['柳含烟'];
  if (场 && 场.ok) 记来源('烟霞灵乳二阶段', '出场实证', '柳含烟出场', 场.证据);
  if (场 && 场.ok && allowed('烟霞灵乳二阶段') && !has('烟霞灵乳二阶段')) {
    news.push('烟霞灵乳二阶段');
    日志.push('柳含烟实际出场（正文实证：' + (场.证据 || '') + '）⇒ 烟霞灵乳二阶段');
  }
  /* ⑦ 归属：只在"出场实证"这条来源在场时补写，且不覆盖既有的更强来源 */
  if (has('烟霞灵乳二阶段') && 有类型('烟霞灵乳二阶段', '出场实证')) {
    const 现 = (inp.名器归属 || {})['烟霞灵乳'] || null;
    const 旧来源 = 归属来源['烟霞灵乳'] || null;
    if (!现) {
      归属补写['烟霞灵乳'] = '阎雷子';
      归属来源补写['烟霞灵乳'] = { 归属者: '阎雷子', 来源: '柳含烟实际出场（正文实证）', 由脚本写: true, 楼: Number(messageId) || null };
    } else if (旧来源 && 旧来源.由脚本写 === true) {
      if (现 !== '阎雷子') { 归属补写['烟霞灵乳'] = '阎雷子'; 归属来源补写['烟霞灵乳'] = { 归属者: '阎雷子', 来源: '柳含烟实际出场（正文实证）', 由脚本写: true, 楼: Number(messageId) || null }; }
    } else {
      日志.push('归属保持既有来源「' + 现 + '」—— 脚本不覆盖玩家/GM 的写入');
    }
  }
  /* ⑥ 楚灵夜两项硬前置齐备 ⇒ 般若菩提菊成形（来源＝前置齐备） */
  const 前置齐 = known['楚灵夜处女丧失'] === true && known['楚灵夜后窍开发'] === true;
  if (前置齐) 记来源('般若菩提菊成形', '前置齐备', '楚灵夜双前置', '处女丧失＋后窍开发');
  if (前置齐 && allowed('般若菩提菊成形') && !has('般若菩提菊成形')) {
    news.push('般若菩提菊成形');
    日志.push('楚灵夜两项前置齐备 ⇒ 般若菩提菊成形');
  }
  /* ④ 出场即二境：一阶段随二阶段（依赖来源），但**保留**它自己的独立来源 */
  if (has('烟霞灵乳二阶段')) 记来源('烟霞灵乳一阶段', '依赖', '烟霞灵乳二阶段成立', '出场即二境');
  if (has('烟霞灵乳二阶段') && allowed('烟霞灵乳一阶段') && !has('烟霞灵乳一阶段')) {
    news.push('烟霞灵乳一阶段');
    日志.push('烟霞灵乳出场即第二境 ⇒ 补记一阶段');
  }

  /* ⑧ 依赖重算：账本里"来源清零"的字段才撤 —— 人工来源永不自动撤；别的合法来源在场则保留 */
  for (const f of Object.keys(ledger)) {
    if (!ledger[f]) continue;
    const 剩 = ledger[f].来源 || [];
    const 人工 = 剩.some((s) => s.类型 === '人工');
    if (manual(f)) continue; // 人工true和false都不由来源清零改回
    if (剩.length === 0 && !人工) {
      const i = news.indexOf(f);
      if (i >= 0) news.splice(i, 1);
      else if (known[f] === true) 撤销.push(f);
      ledger[f] = null;                                    /* 墓碑（深合并不认 delete） */
      ledgerChanged = true;
      日志.push('来源清零 ⇒ 撤销派生「' + f + '」（写 null 墓碑）');
    } else if (人工 && has(f) === false && known[f] !== true) {
      /* 有人工来源但字段是 false ⇒ 说明被手工撤过；不自动补回 */
      日志.push('「' + f + '」有人工来源但当前为假 ⇒ 不自动补回');
    }
  }
  return { news, ledger, ledgerChanged, 归属补写, 归属来源补写, 撤销, 日志 };
}

/**
 * 把解析结果并入 `stat_data`。
 *   · 展示型字段（时间／历时／地点／天气／环境／在场／暗处／修为／状态／目标／局势／
 *     线索／近闻／远闻／危机／关系刻度）**直接覆盖**
 *   · `在场角色`（`<角色N>` 子块聚合成的数组）**整组覆盖**；空数组不写
 *   · `身份`／`阵营` —— **只告警、绝不覆盖**（由 /身份 写）
 *   · `进度` 只做一致性校验，**不写变量**
 * ⚠️ 只在 `MESSAGE_RECEIVED`（message_id > 0）时调用。
 */
