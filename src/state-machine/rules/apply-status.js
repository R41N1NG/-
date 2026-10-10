async function applyStatusToVars(text, messageId, opt) {
  // ⓪ 独立提取阶段总结与结算（即使没有状态栏，只要有结算/总结就必须存下来）
  const sumMatch = /<(?:阶段总结|结算)>([\s\S]*?)<\/(?:阶段总结|结算)>/.exec(text);
  const capturedSummary = (sumMatch && sumMatch[1].trim()) ? sumMatch[1].trim() : null;
  if (capturedSummary) {
    console.log(TAG, `[阶段总结] 第 ${messageId} 楼捕获阶段纪事存档（${capturedSummary.length} 字）`);
  }

  const p = parseStatusBlock(text);
  p.swipeId = (opt && opt.swipeId) ?? 0;
  
  try { await reconcileNadeLedger(`第 ${messageId} 楼前`); } catch (e) { console.warn(TAG, '[纳戒对账] 失败（已吞掉）：', msgOf(e)); }
  if (!p.found) {
    console.log(TAG, `[状态条] 第 ${messageId} 楼没有状态条（<Status_block>／<status>／<StatusBlock> 都没找到），启动容错保底时钟推进`);
    try { await ensureInit(`第 ${messageId} 楼前·容错`); } catch (e) {}
    try {
      const sdNow = readStatData() || {};
      const pin = (sdNow[FLOOR_PIN] && typeof sdNow[FLOOR_PIN] === 'object') ? sdNow[FLOOR_PIN] : null;
      const floorStg = stageOfFloor(messageId, pin ? pin.shift : 0);

      const curStage = Math.max(1, Number(sdNow.段位) || floorStg);
      /* 2026-10-08（gpt 04 号④）：这一支**不再回写日期**。
         旧写法 patch.仙盟历 = SEG_TIME[curStage-1] —— 段位变就把日历顶到该段的章节时点，
         等于「楼数／段位决定当前日期」，正是 gpt C6 禁止的。日期由「历基准 ＋ 全程累计」导出，
         本支只落段位与阶段总结 ⇒ **缺状态栏时日期保留不动**（gpt 的验收项之一）。 */
      const patch = {
        段位: curStage
      };
      if (capturedSummary) {
        const gS = freeFieldGate('阶段总结', capturedSummary, sdNow);
        if (gS.ok) {
          patch.阶段总结 = capturedSummary;
          const sS = freeFieldSuspect('阶段总结', capturedSummary, sdNow);
          if (sS.suspect) {
            const 旧项 = ((patch.自由字段待核 || {}).项) || [];
            patch.自由字段待核 = { 楼: Number(messageId), 项: 旧项.concat([{ 字段: '阶段总结', 值摘: String(capturedSummary).slice(0, 60), 因由: sS.因由, 分句: sS.分句 }]) };
            console.warn(TAG, `⚠️ [自由字段·待核] 第 ${messageId} 楼「阶段总结」提到战事、时点尚早 —— 记待核（**不拦**）`);
          }
        } else {
          console.warn(TAG, `⛔ [自由字段闸] 第 ${messageId} 楼「阶段总结」被拒（保留旧值）：${gS.因由}`);
          patch.自由字段闸 = { 楼: Number(messageId), 项: [{ 字段: '阶段总结', 被拒值: String(capturedSummary).slice(0, 60), 事件: gS.事件, 因由: gS.因由 }] };
        }
        patch.结算待办 = 0;
        patch.总结待办 = 0;
      }
      await writeStat(patch, `第 ${messageId} 楼容错保底推进${capturedSummary ? '（含阶段总结）' : ''}`);
    } catch (err) {
      console.warn(TAG, `[状态条·容错保底] 异常：`, msgOf(err));
    }
    return null;
  }
  console.log(TAG, `[状态条] 第 ${messageId} 楼：YAML 行 ${p.YAML行数} 条 ｜ XML 标签 ${p.XML标签数} 个 ｜ 归并出 ${Object.keys(p.fields).length} 个字段`);

  /* ⚠️ v1.5（2026-09-28）：**账本自愈**。
   * 起因（真机）：9/27 那局启动自检跑了、身份也写进去了，但 `known` 13 个字段**一个都没落地**
   *   ⇒ 「进度」校验拿空账本做差集，于是每一楼都报「状态条多写：天姝会存在」，提示变成噪音。
   * 根因是 boot 那条路只有「加载后 1500ms 一次」＋「滑开场白」两个入口，跑早／跑空就再也没有补的机会。
   * 现在：**每楼开始前都过一遍 ensureInit**（字段齐全时它只做一次读盘就 return，成本可忽略），
   *   帐本缺就当场补齐，并把「补了什么／补失败」明确打进 console —— 不再静默。 */
  try { await ensureInit(`第 ${messageId} 楼前`); }
  catch (e) { console.warn(TAG, `[初始化·第 ${messageId} 楼前] 失败（已吞掉，不影响本轮记账）：`, msgOf(e)); }

  // ① 展示型字段（解析器把空值记成空串；**空串不写**，免得一行「—」把账本擦掉）
  const patch = {};
  const blanks = [];
  /* 2026-10-08（gpt 17 号 §3）：自由文本字段过一致性闸 —— 未到的固定世界事件不许被写成"正在发生"，
     被拒的值不写盘（保留上一轮的可信值），只落后台诊断。 */
  const sdGate = readStatData() || {};
  const 自由字段闸 = [];
  const 自由字段待核 = [];
  let 自由字段闸有拒 = false;
  for (const k of DISPLAY_FIELDS) {
    if (p.fields[k] === undefined) continue;
    if (p.fields[k] === '') { blanks.push(k); continue; }
    const g = freeFieldGate(k, p.fields[k], sdGate);
    if (!g.ok) {
      自由字段闸有拒 = true;
      自由字段闸.push({ 字段: k, 被拒值: String(p.fields[k]).slice(0, 60), 事件: g.事件, 因由: g.因由 });
      console.warn(TAG, `⛔ [自由字段闸] 第 ${messageId} 楼「${k}」被拒（保留旧值）：${g.因由}｜原值「${String(p.fields[k]).slice(0, 40)}」`);
      continue;
    }
    /* 主人令·选 C：明确宣告才拦；**泛指战事不拦，只记账待核** */
    const s = freeFieldSuspect(k, p.fields[k], sdGate);
    if (s.suspect) 自由字段待核.push({ 字段: k, 值摘: String(p.fields[k]).slice(0, 60), 因由: s.因由, 分句: s.分句 });
    patch[k] = p.fields[k];
  }
  if (自由字段闸.length) {
    patch.自由字段闸 = { 楼: Number(messageId), 项: 自由字段闸 };
    try { toast('warning', '本楼有 ' + 自由字段闸.length + ' 个自由字段写了"尚未到时的世界事件"，已按未发生处理（保留上一轮值）：' + 自由字段闸.map((x) => x.字段).join('、'), 12000); } catch (e) { /* 忽略 */ }
  } else {
    patch.自由字段闸 = null;
  }
  if (自由字段待核.length) {
    patch.自由字段待核 = { 楼: Number(messageId), 项: 自由字段待核 };
    console.warn(TAG, `⚠️ [自由字段·待核] 第 ${messageId} 楼有 ${自由字段待核.length} 项泛指战事（**不拦，只记账**）：` + 自由字段待核.map((x) => x.字段).join('、'));
    try { toast('info', '本楼有 ' + 自由字段待核.length + ' 个自由字段提到战事、但时点尚早 —— 已记入「待核」台账（未拒写）：' + 自由字段待核.map((x) => x.字段).join('、'), 10000); } catch (e) { /* 忽略 */ }
  } else {
    patch.自由字段待核 = null;
  }
  if (blanks.length) console.log(TAG, `[状态条] 第 ${messageId} 楼这些字段是空值，保留旧值：${blanks.join('、')}`);
  /* ①c 段位：以楼层为保底下限，支持事件提前推进，沉浸场景自动驻留等待，每 15 楼/换段触发总结存档 */
  {
    const sdNow = readStatData() || {};

    if (capturedSummary) {
      const gS2 = freeFieldGate('阶段总结', capturedSummary, sdNow);
      if (gS2.ok) {
        patch.阶段总结 = capturedSummary;
        const sS2 = freeFieldSuspect('阶段总结', capturedSummary, sdNow);
        if (sS2.suspect) {
          const 旧项2 = ((patch.自由字段待核 || {}).项) || [];
          patch.自由字段待核 = { 楼: Number(messageId), 项: 旧项2.concat([{ 字段: '阶段总结', 值摘: String(capturedSummary).slice(0, 60), 因由: sS2.因由, 分句: sS2.分句 }]) };
          console.warn(TAG, `⚠️ [自由字段·待核] 第 ${messageId} 楼「阶段总结」提到战事、时点尚早 —— 记待核（**不拦**）`);
        }
        console.log(TAG, `[阶段总结] 第 ${messageId} 楼成功捕获阶段纪事存档（${capturedSummary.length} 字），已持久化进账本并清除待办`);
      } else {
        console.warn(TAG, `⛔ [自由字段闸] 第 ${messageId} 楼「阶段总结」被拒（保留上一份可信总结）：${gS2.因由}`);
        patch.自由字段闸 = Object.assign({ 楼: Number(messageId) }, patch.自由字段闸 || {}, {
          项: ((patch.自由字段闸 && patch.自由字段闸.项) || []).concat([{ 字段: '阶段总结', 被拒值: String(capturedSummary).slice(0, 60), 事件: gS2.事件, 因由: gS2.因由 }]),
        });
      }
      patch.结算待办 = 0;
      patch.总结待办 = 0;
    }

    let pin = (sdNow[FLOOR_PIN] && typeof sdNow[FLOOR_PIN] === 'object') ? sdNow[FLOOR_PIN] : null;
    // 智能继承兜底（针对首几楼直接发大总结但未触发 MESSAGE_SENT 事件的环境）
    if (!pin && Number(messageId) <= 3 && (Number(sdNow.段位) || 1) <= 2) {
      const prevUserText = messageText(messageId - 1);
      if (prevUserText) {
        const inh = detectInheritance(prevUserText, messageId - 1);
        if (inh && inh.isInherited) {
          await applyInheritedArchive(prevUserText, messageId - 1);
          const sdReload = readStatData() || {};
          pin = (sdReload[FLOOR_PIN] && typeof sdReload[FLOOR_PIN] === 'object') ? sdReload[FLOOR_PIN] : null;
          Object.assign(sdNow, sdReload);
        }
      }
    }
    const floorStg = stageOfFloor(messageId, pin ? pin.shift : 0);
    
    /* 2026-10-08（gpt 04 号①）：**先校验、再参与推进**。
       旧写法把 <实际发生> 的原始申报直接并进 knownAhead 再交给 checkFastForwardStage，
       于是「本楼正文根本没有依据」的申报也能把段位顶上去（gpt 复现：正文只写「庭院平静」、
       状态栏乱报「天溪城兽潮」，闸门丢弃了申报、known 仍 false，段位却 6→7）。
       现在只有**通过同一把尺子（validateAnchors）**的锚点才参与跳段，且结果落在 patch 上供记账复用。 */
    const 本轮校验 = validateAnchors(Array.isArray(p && p.里程碑) ? p.里程碑 : [], stripStatusBlock(text), messageId, sdNow.known || {}, Array.isArray(p && p.破处) ? p.破处 : []);
    patch.本轮已验证锚点 = 本轮校验.good;
    const knownAhead = Object.assign({}, sdNow.known || {});
    for (const f of 本轮校验.good) knownAhead[f] = true;
    const ffStg = checkFastForwardStage(knownAhead, floorStg);
    const stg = Math.max(floorStg, ffStg);

    if (stg >= 1) {
      
      const curRaw = Number(sdNow.段位);
      const curValid = Number.isFinite(curRaw) && curRaw >= 1;
      if (!curValid) {
        console.warn(TAG, `[段位] 第 ${messageId} 楼旧段位无效（${String(sdNow.段位)}）⇒ 按保底重新起步（不超过第 2 段），逐段推进`);
      }
      let cur = curValid ? Math.min(16, Math.max(1, Math.round(curRaw))) : Math.min(stg, 2);
      let want = stg;

      // 使用连续绝对月数判断段位跃升（跨年无缝衔接）
      const accP = Number(sdNow.时点加速);
      const addedMonths = (isFinite(accP) ? Math.max(0, accP) : 0) + parseLishi(patch.历时);
      const curTotalM = ymToMonths(SEG_TIME[Math.max(0, Math.min(SEG_TIME.length - 1, cur - 1))]) + addedMonths;
      for (let i = 0; i < SEG_TIME.length; i++) {
        if (curTotalM >= ymToMonths(SEG_TIME[i]) - 1e-6) want = Math.max(want, i + 1);
      }

      
      const locked = isSceneLocked(text, p.fields);
      let lockStart = Number(sdNow.锁起点) || 0;
      if (locked) {
        if (!lockStart || lockStart < 1 || lockStart > messageId) { lockStart = messageId; patch.锁起点 = lockStart; }
      } else if (lockStart) { patch.锁起点 = 0; lockStart = 0; }
      const lockTooLong = locked && lockStart > 0 && (messageId - lockStart >= 6);
      if (locked && want > cur && !lockTooLong) {
        console.log(TAG, `[章节等待] 第 ${messageId} 楼检测到私密交合/沉浸互动进行中，段位暂缓推进（保持第 ${cur} 段），等待玩家本场戏份完成`);
        want = cur;
      } else if (lockTooLong && want > cur) {
        console.warn(TAG, `⚠️ [章节等待] 第 ${messageId} 楼：本场戏已连续 ${messageId - lockStart} 楼被判定为"进行中" ⇒ 达最长驻留（6 楼），照常推进段位，避免永久卡段`);
      }
      want = Math.min(want, cur + 1);
  /* gpt P1-6：**本段楼数**这只计数器以前只读不维护 ⇒ 改成每楼真的加、同楼重绘不重复加、
     满 3 楼升一段并归零；窗口起点与计数器一起落盘。 */
  let wf = Number(sdNow.窗口起点) || 0;
  if (wf && (wf < 1 || wf > messageId)) {
    console.warn(TAG, '[窗口] 第 ' + messageId + ' 楼窗口起点异常（' + sdNow.窗口起点 + '）⇒ 复位');
    wf = 0;
  }
  const sameFloor = Number(sdNow.最后处理楼号) === Number(messageId);
  let segFloors = Number(sdNow.本段楼数);
  if (!isFinite(segFloors) || segFloors < 0) segFloors = 0;
  if (want > cur) {
    if (!wf) { wf = messageId; segFloors = 0; }
    else if (!sameFloor) { segFloors += 1; }
    if (segFloors >= 3) { cur += 1; wf = (cur < want) ? messageId : 0; segFloors = 0; }
  } else { wf = 0; segFloors = 0; }
  patch.本段楼数 = segFloors;
  patch.窗口起点 = wf;
      patch.段位 = cur;
      if (cur !== stg) { console.log(TAG, `[窗口] 第 ${messageId} 楼：本段收尾窗口（起点 ${wf || '已闭'}）⇒ 段位 ${stg} → ${cur}`); }

      const isStageChanged = cur !== (Number(sdNow.段位) || stg);
      const isSummaryInterval = (Number(messageId) > 0 && Number(messageId) % 15 === 0);
      if (isStageChanged || isSummaryInterval) {
        patch.结算待办 = 1;
        patch.总结待办 = 1;
        console.log(TAG, `[总结/结算] 第 ${messageId} 楼已置待办（${isStageChanged ? `段位跃升至 ${cur}` : '周期到达 15 楼'}）`);
      }

      /* ①d 时点 ＝ 绝对连续月数 ＋ 累计历时加速（按月/天高精度累计，杜绝跨年与小步长舍入归零） */
      const segIdx = Math.max(0, Math.min(SEG_TIME.length - 1, (patch.段位 || stg) - 1));
      
      
      const CAL_START_BY_ID = {
        赵无忧: { ym: 1578.03, day: 3 },
        焚欲殿主: { ym: 1578.08, day: 1 }, 浊龙殿主: { ym: 1578.08, day: 1 },
        欢喜殿主: { ym: 1578.08, day: 1 }, 魂欢殿主: { ym: 1578.08, day: 1 },
      };
      const idNow = String(sdNow.身份 || '');
      let basis = Number(sdNow.历基准) || 0;      // 存「年.月」＋日的合成月数
      if (!basis) {
        const fixed = CAL_START_BY_ID[idNow];
        if (fixed) {
          basis = ymToMonths(fixed.ym) + (fixed.day - 1) / 30;
        } else {
          
          /* gpt P1-3：基准不再从「当前 AI 正文」取 —— 只认账上记过的开场时点；
       账上没有（老局）时，仅允许从**首楼文本**补记一次，之后一律走账。 */
    let storedM = Number(sdNow.初始时点);
    if (!(isFinite(storedM) && storedM > 0)) {
      try {
        const introTxt = String(messageText(1) || '');
        const introLine = pickTimepointLine(introTxt);
        const introPick = introLine ? parseXianmengFromText(introLine) : null;
        if (introPick) { storedM = ymToMonths(introPick.ym) + (introPick.day - 1) / 30; patch.初始时点 = storedM; }
      } catch (eIntro) { /* 首楼读不到 ⇒ 走共享默认 */ }
    }
    const basisOk = isFinite(storedM) && storedM > 0;
    basis = basisOk ? storedM : (ymToMonths(1578.03) + 2 / 30);
    console.log(TAG, '[时间基准] 第 ' + messageId + ' 楼：' + (idNow || '（未登记身份）') + ' ⇒ 基准 ' + (basisOk ? fmtXianmeng(monthsToYm(storedM)) : '1578 年 · 初三') + '（来源：账上开场时点，不读正文）');
  }

patch.历基准 = basis;
      }
      const curBaseM = basis;
      

      // 若同楼发生重绘/修改，基于本楼原始基准重新累计，防止重复叠加
      
      /* gpt P1-2/P1-4/P1-5/P1-7：推进逻辑抽成纯函数 nextAcc（见文件上方），此处只落盘 */
      const stepM = parseLishi(patch.历时);
      const hasTransit = LISHI_TRANSIT_RE.test(String(patch.历时 || '') + ' ' + String(text || '').slice(0, 400));
      const accR = nextAcc(sdNow, messageId, stepM, hasTransit);
      const acc = accR.acc;
      const adv = accR.adv;
      patch.历时累计 = acc;          /* P1-5：同楼撤销后的值也落盘 */
      patch.最后处理楼号 = Number(messageId);
      patch.本楼历时加速 = adv;
      /* 2026-10-08（gpt 17 号 §5-4）：超限整笔拒绝时，留下一笔"待确认"账 —— 后台可查、玩家可改，
         下一轮不会因为"本轮记 0"就把申报的那段时间当成没发生过。 */
      if (accR.rejected) {
        patch.历时待确认 = { 楼: Number(messageId), 申报月: accR.raw, 上限月: accR.capM, 原因: '单笔超过上限，整笔未计入（走合法转场或 GM 确认）' };
        try { toast('warning', '本楼申报的历时（' + accR.raw + ' 月）超过单笔上限（' + accR.capM + ' 月），已整笔未计入；要推进请用明写的时间流逝或 GM 面板确认。', 12000); } catch (e) { /* 忽略 */ }
      } else {
        patch.历时待确认 = null;     /* 墓碑：本轮没有待确认项就清掉上一笔 */
      }
      patch.仙盟历 = monthsToYm(curBaseM + acc);
      
      const dayOfMonth = 1 + Math.floor((((curBaseM + acc) % 1) + 1) % 1 * 30 + 1e-9);
      patch.仙盟历文 = fmtXianmengDay(patch.仙盟历, dayOfMonth);
      console.log(TAG, `[段位] 第 ${messageId} 楼 ⇒ 第 ${patch.段位 || stg} 段（楼下限 ${stg}）${pin ? `（时间轴已平移 ${pin.shift} 楼）` : ''}｜历时「${patch.历时 || '—'}」⇒ +${adv}月（累计 ${acc}月）｜仙盟历 ${patch.仙盟历文}（${patch.仙盟历}）`);
    } else {
      console.warn(TAG, `[段位] 第 ${messageId} 楼算不出段位（楼层号异常），本轮不写 —— 渲染侧会按第 1 段兜底`);
    }
  }
  // ①b 在场角色：子块聚合成的**数组**，整组覆盖写。
  //     ⚠️ 空数组**不写** —— 一楼没写子块（或全是「无」）不该把上一楼的速写擦掉。
  if (Array.isArray(p.在场角色) && p.在场角色.length) {
    patch[CAST_FIELD] = p.在场角色;
  } else {
    console.log(TAG, `[状态条] 第 ${messageId} 楼没有可用的 <角色N> 子块，${CAST_FIELD} 保持旧值`);
  }
  if (Object.keys(patch).length) {
    await writeStat(patch, `第 ${messageId} 楼状态条（展示栏）`);
  } else {
    console.log(TAG, `[状态条] 第 ${messageId} 楼没解析到任何可写的展示栏字段`);
  }
  if (p.未识别.length) console.warn(TAG, `[状态条] 第 ${messageId} 楼有没归进面板的标签：${p.未识别.join('、')}`);

  // ② 身份／阵营：只告警，绝不覆盖
  warnIdentityMismatch(p, messageId);

  // ③ 进度一致性校验（只告警，不写变量）
  checkProgressConsistency(p, messageId);

  //      所以要把正文一起传进去 —— 报成形却漏标时，靠正文硬词兜底挽救。
  try { await applyMilestones(p, messageId, text); }
  catch (e) { console.warn(TAG, `[实际发生] 第 ${messageId} 楼自动记账失败（已吞掉）：`, msgOf(e)); }

  // ⑤ 广播通知面板刷新
  try {
    const fill = (typeof window !== 'undefined' && typeof window.__xsdFillPanel === 'function')
      ? window.__xsdFillPanel
      : ((typeof window !== 'undefined' && window.parent && typeof window.parent.__xsdFillPanel === 'function')
        ? window.parent.__xsdFillPanel : null);
    if (fill) fill(messageId, text);
  } catch (e) { /* 忽略 */ }
  try {
    const refresh = (typeof window !== 'undefined' && typeof window.__xsdRefreshRelics === 'function')
      ? window.__xsdRefreshRelics
      : ((typeof window !== 'undefined' && window.parent && typeof window.parent.__xsdRefreshRelics === 'function')
        ? window.parent.__xsdRefreshRelics : null);
    if (refresh) refresh();
  } catch (e) { /* 忽略 */ }

  return p;
}

/** 正文里写了身份／阵营，且与已设值不同 ⇒ 记一条警告（**不写变量**） */
function warnIdentityMismatch(p, messageId) {
  const shown = p.fields['身份'];
  const cur = readIdentity();
  if (shown) {
    const hit = IDENTITY_NAMES.find((n) => shown.includes(n));
    if (hit && cur && hit !== cur) {
      console.warn(TAG, `⚠️ [身份] 第 ${messageId} 楼的状态条写的是「${hit}」，与已设「${cur}」不一致 —— **不覆盖**。`
        + `要换请发 /身份 ${hit}，或点第 0 楼的菜单。`);
      toast('warning', `状态条里的身份是「${hit}」，但当前是「${cur}」——已保持原值（要换发「身份 ${hit}」）`, 12000);
    } else if (!hit && cur && cur !== '自设' && !shown.includes(cur)) {
      console.warn(TAG, `⚠️ [身份] 第 ${messageId} 楼的状态条写了「${shown}」，认不出是哪个身份（当前「${cur}」）—— 仅记录，不动变量。`);
    }
  }
  // 阵营：状态条一般不写它；真写了（YAML 或 XML 写法）且与已设不同就记一笔，**不写变量**
  const curFaction = readFaction();
  const shownFaction = findDeclaredFaction(p.raw);
  if (shownFaction && curFaction && shownFaction !== curFaction) {
    console.warn(TAG, `⚠️ [阵营] 第 ${messageId} 楼的状态条写着「${shownFaction}」，与已设「${curFaction}」不一致 —— **不覆盖**（随 /身份 一起写）。`);
  }
}

/** 从状态条原文里找「阵营」的声明值（YAML 与 XML 两种写法都认），找不到返回 null */
function findDeclaredFaction(raw) {
  const t = String(raw ?? '');
  const m1 = t.match(/^[^\S\r\n]*阵营[^\S\r\n]*[：:][^\S\r\n]*(.+)$/m);
  if (m1) return m1[1].trim();
  const m2 = t.match(/<阵营>([^<]*)<\/阵营>/);
  if (m2) return String(m2[1]).trim();
  return null;
}

/**
 * 「进度」栏一致性校验：状态条若写了 `进度：X、Y`，与**真值**做差集。
 * ⚠️ 真值 ＝ **账本 ∪ 本回合 `<实际发生>`**（2026-10-01 主人定：「有模型记账才是对的」）。
 *   旧判据只比账本，而 `applyStatusToVars` 里本函数跑在 `applyMilestones()` **之前** ⇒
 *   正常一轮（模型同时写「进度」与 `<实际发生>`）必报「多写」；账本里的老锚点又必报「漏写」
 *   —— 两侧都是误报，玩家每轮被弹一次。现在把本回合实际发生并进真值，「多写」才等于"真·空谈"。
 * ⚠️ 「漏写」**不再提示**：`进度` 栏是接戏线索，**不是全量清单**，没列全是正常的。
 * ⚠️ 不一致**只 console.warn ＋ toastr 提示，绝不写变量**。
 */
function checkProgressConsistency(p, messageId) {
  if (p.进度 === null) return;                       // 没有这一行 ⇒ 不校验
  const known = readKnown() || {};
  const truth = ALL_FIELDS.filter((f) => known[f] === true);
  const thisRound = Array.isArray(p.里程碑)
    ? p.里程碑.map((x) => String(x).trim()).filter((f) => ALL_FIELDS.includes(f))
    : [];
  const merged = Array.from(new Set(truth.concat(thisRound)));
  const claimed = p.进度.filter((f) => ALL_FIELDS.includes(f));
  const bogus = p.进度.filter((f) => !ALL_FIELDS.includes(f));
  const onlyClaimed = claimed.filter((f) => !merged.includes(f));   // 账本没有、本回合也没实际发生 ⇒ 真·空谈
  if (!onlyClaimed.length && !bogus.length) {
    console.log(TAG, `[进度校验] 第 ${messageId} 楼：一致（账本 ${truth.length} 项，本回合实际发生 ${thisRound.length} 项）`);
    return;
  }
  const parts = [];
  if (onlyClaimed.length) parts.push(`状态条写了但账本与本回合 <实际发生> 里都没有：${onlyClaimed.join('、')}`);
  if (bogus.length) parts.push(`不是锚点字段：${bogus.join('、')}`);
  console.warn(TAG, `⚠️ [进度校验] 第 ${messageId} 楼：${parts.join('；')}。`
    + `**只告警，不写变量**（账本由模型在 <实际发生> 里报、脚本自动记账；玩家发「解锁」是手工通道）。`);
  // 仅在控制台记录排障信息，不再弹窗打断玩家沉浸感
}

