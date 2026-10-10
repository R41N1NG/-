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