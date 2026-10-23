"use strict";
const { clockLabel } = require("./clock.js");
const { validateActions } = require("../../contracts/validation.js");
const R = require("../../config/rules.json");
const C = require("../checks.js");
const D = require("../dice.js");
const LP = require("../../config/lifepack.json");
const TS = require("../target_state.js");
const map = require("../map.js");
const { normalize: D_norm } = require("../lexicon.js");
const { parseFloor, verifyEvidence } = require("../parse.js");
const { DIST_KEY, HUNTER_MODES, TAIL_PUMP_IDS } = require("./constants.js");

function createTurnSystem({
  g,
  L,
  lex,
  seedAt,
  log,
  addProxLog,
  advanceRouteByClock,
  applyTargetState,
  categoryOf,
  herAdvance,
  resolveAlertCross,
  settleAction,
  investigation,
  snapshot,
  sweetHighNow,
  syncThresholdTags,
  syncSpatial = () => {},
}) {
  /* ---------- 每楼主流程 ---------- */
  /**
   * @param {string} llmText LLM 的整楼输出（正文+标签）
   * @param {object} opts    {floor, evidenceCheck:boolean}
   */
  /** 环境突发判定（猫/狗：严格百分比公式推导；v0.8 起由 processFloor 结算挂账，演出与账同源）。 */
  function rollEnvSfx() {
    if (g.mode !== "stealth") return null;
    const here = g.route ? g.route.here : -1;
    const curId = g.route && here >= 0 ? g.route.nodes[here] : null;
    const cur = curId ? map.getPlace(curId) : null;
    if (!cur) return null;
    if (
      curId.includes("metro") ||
      curId.includes("lobby") ||
      curId.includes("store")
    )
      return null; // 室内豁免
    const sfxSeed = seedAt(g.floor || 0, 99);
    const sfxRoll = D.rollD20(sfxSeed).d20; // 1~20，每点 5%
    const isAlley =
      curId.includes("alley") ||
      curId.includes("stairs") ||
      curId.includes("backstreet") ||
      (cur.spots || []).length > 1;
    const isResidential =
      curId.includes("unit") ||
      curId.includes("residence") ||
      curId.includes("stairs") ||
      curId.includes("old");
    // 猫叫（暗巷野猫受惊）：基础 15%（≤3）；贴身/身后惊扰垃圾桶堆升至 25%（≤5）
    const catThreshold = g.dist === "touch" || g.dist === "close" ? 5 : 3;
    // 狗叫（庭院警戒犬吠）：基础 10%（≥19）；她警觉≥40 行色慌张升至 20%（≥17）
    const dogLow = L.get("alert") >= 41 ? 17 : 19;
    if (isAlley && sfxRoll <= catThreshold) return "cat";
    if (isResidential && sfxRoll >= dogLow) return "dog";
    return null;
  }

  /** 玩家自然语言 → 动作队列（M4-1：分句→词表归一，上限 3；命不中的句子＝纯叙事，不结算不报错）。 */
  function translateInput(text) {
    const clauses = String(text || "")
      .split(/[，,。；;\n！!？?·]+|然后|接着|顺便|之后|再试|同时/)
      .map((s) => s.trim())
      .filter(Boolean);
    const out = [],
      seen = new Set();
    for (const c of clauses) {
      if (out.length >= 3) break;
      const r = D_norm(c, lex);
      if (r.hit && !seen.has(r.id)) (seen.add(r.id), out.push(r));
    }
    return out;
  }

  /**
   * M4-1 动作相（前置结算，主人定稿 2026-10-17「打字→中控转化→得到结果后发送，演出同时进行」）：
   * 玩家输入 → 翻译队列 → 全数值结算（骰/账/刺激/段末）→ 结果包。数在 LLM 写字前定死；
   * 回执相走 processReply（零账目），swipe 天然安全。
   */
  function settleInput(playerText, opts = {}) {
    if (opts.actions != null) validateActions(opts.actions);
    let queue = [];
    if (opts.actions && opts.actions.length) {
      // 胶囊动作结构化直通：直接认代码里的 Action ID，与输入框文本完全解耦，不靠自然语言猜词
      queue = opts.actions
        .map((act) => {
          const entry =
            (act.id && lex.byId.get(act.id)) ||
            (act.name && lex.byName.get(act.name));
          if (!entry)
            throw Object.assign(
              new Error(`未注册的动作：${act.id || act.name}`),
              { code: "ACTION_INVALID" },
            );
          return {
            id: entry ? entry.id : act.id,
            name: entry ? entry.name : act.name,
            label: act.name || (entry ? entry.name : act.id),
            args: act.args || {},
          };
        })
        .filter((r) => r.id && lex.byId.has(r.id));
    } else if (opts.allowTextFallback === true) {
      // 仅 GM / 工具 / 单测用的后备：把自然语言归一到动作。玩家侧默认关闭——
      // 主人 2026-10-19 定：手打绝对无效，动作只认胶囊点选，输入框文本只是伴随叙事。
      queue = translateInput(playerText);
    }
    const results = processFloor(playerText || "", {
      ...opts,
      _actionQueue: queue,
      _fromInput: true,
    });
    results.queue = queue.map((r) => ({
      id: r.id,
      name: r.name,
      args: r.args,
    }));
    results.package = {
      floor: results.floor,
      actions: results.actions.map((a) => ({
        id: a.id,
        name: a.name,
        label: a.label || a.name,
        d20: a.d20,
        total: a.total,
        dc: a.dc,
        band: a.band,
        mods: a.mods,
        attr: a.attr || null,
        targetMod: a.targetMod || 0,
        darkReveal: a.darkReveal || null,
        exposure: a.exposure || null,
        discoveries: a.discoveries || [],
        attributeUnlock: a.attributeUnlock || null,
        attributeUnlockEmpty: !!a.attributeUnlockEmpty,
        capture: a.capture || null,
        raw: a.raw,
        ledger: a.ledger,
        noRoll: a.noRoll,
        text: a.text,
        rejected: a.rejected || false,
        reason: a.reason || null,
      })),
      investigation: results.investigation || null,
      account: results.floorApplied || null,
      seg: results.seg || null,
      logs: g.logs.slice(),
      narrativeOnly: queue.length === 0 || results.actions.length === 0,
      targetState: g.targetState
        ? JSON.parse(JSON.stringify(g.targetState))
        : null,
      herAlert: g.lastHerAlert || null,
      alertEvent: g.alertEvent ? { ...g.alertEvent } : null,
    };
    return results;
  }

  function processFloor(llmText, opts = {}) {
    if (opts.replyOnly) return processReply(llmText);
    const beforeLedger = { ...L.state };
    const replyOnly = opts.replyOnly === true; // M4-1 回执相：动作已前置结算，只走票据/谎言/模式
    if (!replyOnly) g.floor = opts.floor ?? (g.floor || 0) + 1;
    g.logs = [];
    g.lastHerAlert = null;
    g.capture = null;
    if (!replyOnly) g.alertEvent = null; // 过档事件只在本楼回执里出现一次

    investigation.beginTurn();

    // 她按自己的返程表走：先把地点推进到本楼钟点该到的那一站，再结算玩家动作
    if (!replyOnly) advanceRouteByClock();
    // 确认档之后她在跑：每楼多推一站，跑到终点就跟丢
    if (!replyOnly && g.fleeing && g.route) {
      herAdvance(true);
      if (g.route.here >= g.route.nodes.length - 1) g.tailing = false;
    }

    if (!replyOnly && g.targetState) {
      const pack =
        (LP.packs && LP.packs[g.targetId]) ||
        LP.packs.college ||
        LP.packs.student;
      const here = g.route ? g.route.here : -1;
      const curId = g.route && here >= 0 ? g.route.nodes[here] : null;
      g.targetState.hand = TS.resolveHand(
        pack,
        curId,
        g.targetState.hand,
        seedAt(g.floor || 0, "hand"),
      );
      if (g.targetState.route && g.route) {
        g.targetState.route.here = here;
        g.targetState.route.currentPlace = curId
          ? map.getPlace(curId)?.name || curId
          : null;
      }
      applyTargetState();
    }
    const { tags, cleanText, diag } = opts._fromInput
      ? { tags: [], cleanText: String(llmText || ""), diag: {} }
      : parseFloor(llmText, lex);
    syncThresholdTags(); // 每楼先对表：PI 或属性达线/掉线，优势标签挂摘
    const results = {
      floor: g.floor,
      actions: [],
      facts: [],
      lies: [],
      mode: null,
      diag,
      logs: g.logs,
      ledgerSeqs: [],
    };
    const floorApplied = {
      stamina: 0,
      heart: 0,
      alert: 0,
      pi: 0,
      proximity: 0,
      cash: 0,
    };

    // 模式切换（一楼一次已在 parse 层保证）
    const modeTag = tags.find((t) => t.type === "mode");
    if (modeTag) {
      g.mode = modeTag.mode;
      results.mode = modeTag.mode;
    }

    // 谎言：依据锁校验后入账（暂记 pending，账本结构属内容层）
    for (const lie of tags.filter((t) => t.type === "lie")) {
      const ok = verifyEvidence(cleanText, lie.claim);
      if (ok) results.lies.push({ ...lie, verified: true });
      else results.lies.push({ ...lie, verified: false, dropped: true });
    }

    // 动作队列：优先使用结构化 _actionQueue 直通（回执相跳过——动作已在 settleInput 前置结算）
    let seq = 0;
    let heartPeak = L.get("heart"); // 段心跳峰值（档位税按峰值定档）
    let tailFloor = null; // 跟缀族本楼代表结算（持续暴露按段一泵）
    const actionQueue = replyOnly
      ? []
      : Array.isArray(opts._actionQueue)
        ? opts._actionQueue.map((a) => ({
            type: "action",
            id: a.id,
            name: a.name,
            label: a.label || a.name,
            args: a.args,
          }))
        : opts._fromInput
          ? []
          : tags.filter((t) => t.type === "action");
    for (const tag of actionQueue) {
      const out = settleAction(tag, seq++);
      if (out) {
        results.actions.push(out);
        if (out.ledger?.seq) results.ledgerSeqs.push(out.ledger.seq);
        if (out.ledger?.applied) {
          for (const [k, v] of Object.entries(out.ledger.applied)) {
            if (floorApplied[k] !== undefined) floorApplied[k] += v;
          }
        }
        if (!tailFloor && TAIL_PUMP_IDS.includes(tag.id) && out.band) {
          tailFloor = {
            band: out.band,
            dist: DIST_KEY[tag.args?.dist] || g.dist,
          };
        }
      }
      heartPeak = Math.max(heartPeak, L.get("heart"));
    }

    // 她的警觉跨档 → 她的行为（一晚每档只响一次；可能连锁到下一档）
    if (!replyOnly) resolveAlertCross();

    /* v0.8 刺激接线（暂定表 rules.heart.stim.pump，真机实测后拧旋钮）：
       持续暴露按段一泵——跟缀族距离定档，楼内排几个动作只泵一次；
       事件类照单泵——天然1 爆露、环境突发（猫/狗）发生即泵；
       勉强维持结果带 +5 原判不叠档；天然 20 白给不泵；
       熟络常规社交（接触·接近度≥门槛）不进账（心跳节激活规则）。 */
    if (!replyOnly && HUNTER_MODES.includes(g.mode)) {
      const P = R.heart.stim.pump;
      const calm =
        g.mode === "contact" && L.get("proximity") >= P.calmSocialProximity;
      const pumped = [];
      if (tailFloor && !calm) {
        let stim = 0,
          src = "";
        if (tailFloor.band === "nat1") {
          stim = P.exposed;
          src = "爆露照面";
        } else if (tailFloor.band === "fail") {
          stim = P.lost;
          src = "跟丢";
        } else if (tailFloor.band === "grace" || tailFloor.band === "nat20") {
          stim = 0;
        } else {
          stim = P.tail[tailFloor.dist] ?? P.tail.same;
          src = `持续尾随·${tailFloor.dist}`;
        }
        if (stim > 0) pumped.push({ stim, src });
      }
      if (
        !tailFloor &&
        g.mode === "contact" &&
        !calm &&
        actionQueue.some(
          (t) =>
            t.type === "action" &&
            lex.byId.get(t.id) &&
            categoryOf(t.id) === "social",
        )
      ) {
        pumped.push({ stim: P.social, src: "伪装寒暄" });
      }
      const sfx = rollEnvSfx();
      g._envSfx = sfx; // 演出与账同源：snapshot 读缓存
      if (sfx) {
        let stim = P.env[sfx] || 0;
        const fam = g.famSegs[g.world.district] || 0;
        const halved = fam >= R.heart.areaFamiliarSegments; // 熟区环境类减半（指向类永不减——天然1 不走此闸）
        if (halved) stim = Math.round(stim * P.familiarEnvFactor);
        pumped.push({
          stim,
          src:
            (sfx === "cat" ? "猫惊叫" : "狗吠") + (halved ? "·熟区减半" : ""),
        });
      }
      for (const p of pumped) {
        if (p.stim <= 0) continue;
        const d = C.heartDelta({ stim: p.stim, nrv: g.player.nrv });
        if (d) {
          L.commit({ heart: d }, { reason: "stim" });
          floorApplied.heart += d;
          log(`[刺激] ${p.src} +${p.stim} → 心跳 +${d}`);
        }
      }
      heartPeak = Math.max(heartPeak, L.get("heart")); // 泵计入当段峰值（段税按峰值定档）
    } else {
      g._envSfx = null;
    }

    // v0.6 段末账（楼＝场景段）：猎手状态收心跳档位税 + 段末心跳回落（−5 至基线）
    // （段末固定账不进 ledgerSeqs——该序列只收动作结算；段末账入 results.seg 供回执）
    if (!replyOnly && HUNTER_MODES.includes(g.mode)) {
      const tax = C.staminaSegTax(heartPeak, sweetHighNow());
      let appliedTax = 0;
      if (tax) {
        appliedTax = L.commit({ stamina: tax }, { reason: "seg_tax" }).applied
          .stamina;
        floorApplied.stamina += appliedTax;
        log(`[段税] 心跳峰值 ${heartPeak} → 体力 ${appliedTax}`);
      }
      const dropped = C.segHeartDrop(L.get("heart"), g.player.nrv);
      if (dropped !== L.get("heart")) {
        const dH = dropped - L.get("heart");
        L.commit({ heart: dH }, { reason: "seg_drop" });
        floorApplied.heart += dH;
      }
      results.seg = { heartPeak, staminaTax: appliedTax };
      // 猎手状态在她所在大区完成一段：分区熟悉度 +1（10 段熟区，二十六节锚）
      const d = g.world.district;
      if (d && g.famSegs[d] !== undefined) {
        g.famSegs[d] = Math.min(g.famSegs[d] + 1, R.heart.areaFamiliarSegments);
      }
    }

    // 接近度变动记小账（HUD 真实消费）
    if (floorApplied.proximity !== 0) {
      const actName = actionQueue[0]?.name || "接触交互";
      addProxLog(floorApplied.proximity, actName);
    }

    // 她的动静警示（根据警觉过档或剧烈增量涌现）
    if (floorApplied.alert >= 8 || C.alertStage(L.get("alert")) >= 2) {
      const stage = C.alertStage(L.get("alert"));
      const pack =
        (LP.packs && LP.packs[g.targetId]) ||
        LP.packs.college ||
        LP.packs.student;
      const flavor = pack.flavor || {};
      if (stage === 3)
        g.lastHerAlert = `⚠️ 目标神色慌乱，脚步明显加快！（${flavor.evade || "小跑离开"}）`;
      else if (stage === 2)
        g.lastHerAlert = `⚠️ 目标放慢脚步，频频侧目回顾！（${flavor.face || "偷瞥身后"}）`;
      else if (floorApplied.alert >= 8)
        g.lastHerAlert = `⚠️ 目标似乎有所察觉，步伐有些迟疑（${flavor.face || "略带警惕"}）`;
    }

    // 信号流：生成时段流水观察记录
    const tm = clockLabel(g);
    const firstAction = results.actions[0];
    let signalTxt = null;
    if (firstAction) {
      if (firstAction.id === "follow") signalTxt = "目标沿街前行，维持稳定步频";
      else if (firstAction.id === "photo")
        signalTxt = "目标在路口短暂停留，记录其正面特征";
      else if (firstAction.id === "scan")
        signalTxt = firstAction.capture
          ? `目标侧向身形清晰，收录${firstAction.capture.name}（侧面）`
          : ["success", "nat20"].includes(firstAction.band)
            ? "目标侧向身形清晰，未取得可新增的侧面图"
            : "尝试打量，未取得新的侧面记录";
      else if (firstAction.id === "timing")
        signalTxt = "观察其举止神态，捕捉防备松懈间隙";
      else if (firstAction.id === "shop_enter")
        signalTxt = "目标进入沿街商铺，驻足货架前";
      else signalTxt = "目标保持行进，你在侧后方观察记录";
    }
    if (signalTxt && firstAction?.attributeUnlock) {
      const attr = firstAction.attributeUnlock;
      signalTxt += `；大成功额外收益：目标${attr.name} ${attr.value}（基础值）已解锁`;
    }
    if (signalTxt) {
      g.signals = g.signals || [];
      g.signals.push([tm, signalTxt]);
      if (g.signals.length > 20) g.signals.shift();
    }

    results.investigation = investigation.endTurn(results);

    // 由实际账面差值汇总，包含过档行为和上下限钳制，避免回执与存档不一致。
    for (const key of Object.keys(floorApplied))
      floorApplied[key] = L.get(key) - beforeLedger[key];

    // 结算流水摘要
    const parts = [];
    if (floorApplied.stamina)
      parts.push(
        `体力 ${floorApplied.stamina > 0 ? "+" : ""}${floorApplied.stamina}`,
      );
    if (floorApplied.heart)
      parts.push(
        `心跳 ${floorApplied.heart > 0 ? "+" : ""}${floorApplied.heart}`,
      );
    if (floorApplied.alert)
      parts.push(
        `警觉 ${floorApplied.alert > 0 ? "+" : ""}${floorApplied.alert}`,
      );
    if (floorApplied.pi)
      parts.push(`PI ${floorApplied.pi > 0 ? "+" : ""}${floorApplied.pi}`);
    if (floorApplied.proximity)
      parts.push(
        `接近度 ${floorApplied.proximity > 0 ? "+" : ""}${floorApplied.proximity}`,
      );
    if (floorApplied.cash)
      parts.push(
        `现金 ${floorApplied.cash > 0 ? "+" : ""}${floorApplied.cash}`,
      );
    g.lastLedgerSummary =
      parts.length > 0
        ? `本轮结算 · ${parts.join(" · ")}`
        : "本轮结算 · 无数值变动";

    // 票据核销：有票即销，账已在中控（这里只回执）
    for (const t of tags.filter((t) => t.type === "fact")) {
      const issued = g.tickets.find((k) => k.no === t.ticket);
      results.facts.push({ ticket: t.ticket, consumed: !!issued });
    }
    if (!opts._fromInput) g.tickets = [];

    if (!replyOnly) syncSpatial(results);
    results.floorApplied = floorApplied;
    results.stats = snapshot();
    results.capture = g.capture || null;
    results.flow = g.logs.slice();
    return results;
  }

  /**
   * M4-1 回执相（LLM 写完之后）：只处理事实票据/谎言/模式——零账目写入，
   * swipe 重跑天然安全（同包重解析，数字不动）。动作已在 settleInput 前置结算，
   * LLM 回复里的 <动作> 标签在此被忽略（世界书旧指令残留也不重复结算）。
   */
  function processReply(llmText) {
    const { tags, cleanText, diag } = parseFloor(llmText, lex);
    const mode = tags.find((t) => t.type === "mode");
    if (mode) g.mode = mode.mode;
    const claims = tags
      .filter((t) => t.type === "lie")
      .map((t) => ({ ...t, verified: verifyEvidence(cleanText, t.claim) }));
    const facts = tags
      .filter((t) => t.type === "fact")
      .map((t) => ({
        ticket: t.ticket,
        consumed: g.tickets.some((k) => String(k.no) === String(t.ticket)),
      }));
    const consumed = new Set(
      facts.filter((t) => t.consumed).map((t) => String(t.ticket)),
    );
    g.tickets = g.tickets.filter((t) => !consumed.has(String(t.no)));
    return {
      floor: g.floor,
      actions: [],
      facts,
      lies: claims,
      mode: mode?.mode || null,
      diag,
      stats: snapshot(),
    };
  }

  return {
    rollEnvSfx,
    translateInput,
    settleInput,
    processFloor,
    processReply,
  };
}

module.exports = { createTurnSystem };
