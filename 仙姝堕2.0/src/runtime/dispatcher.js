"use strict";
const C = require("./contracts");
const {meets} = require("./conditions");
const {resolveStages,writeMetric,metricSpec,completeStage} = require("./character_stages");
const {QUICK_ACTIONS,itemAction} = require("./button_actions");
const { describeItem, itemUsePrompt } = require("./item_catalog");
const { createActionCode, readActionCode } = require("./action_wire");
const { startingInventoryFor } = require("./starting_inventory");
const { createMetricEvents,stripForEvidence } = require("./metric_events");
const {inferRelicActions}=require("./relic_evidence");
const Realm=require("./player_realm");
const Eras=require("./grand_eras");
function createDispatcher(adapter, data) {
  const eras=Eras.validate(data.grandEras || []);
  const metricEvents = createMetricEvents(
    data.metricEventDefinitions,
    data.characterProfiles || {},
    data.promotionDefinitions || {},
  );
  const areaBackgrounds = {
    defs: Object.values(data.areaBackgroundDefinitions || {}),
    lookup(location) {
      const loc = String(location || "");
      return this.defs.find((d) => d.matchPrefix && loc.startsWith(d.matchPrefix))?.area || "";
    },
  };
  let current = null,
    scopeChatId = null,
    disposed = false,
    queue = Promise.resolve(),
    serial = 0;
  const subscribers = new Set(),
    plugins = new Map();
  const rules = (s) => data.rules(s.stat_data);
  function context() {
    const c = adapter.context();
    if (!c.chatId || !Array.isArray(c.chat) || !c.chat.length)
      throw Error("请先打开角色聊天");
    return {
      ...c,
      chatId: String(c.chatId),
      branchId: String(c.branchId || c.chatId),
      floor: c.chat.length - 1,
      trail: C.fingerprint(c.chat),
    };
  }
  function token(c) {
    return JSON.stringify([c.chatId, c.branchId, c.trail]);
  }
  function guard(c) {
    if (disposed || token(c) !== token(context()))
      throw Error("聊天、候选或正文已变化，请重新读取");
  }
  function compatible(e, c) {
    return e?.schema === 2 && C.matchesSnapshot(e.trail, c.trail);
  }
  async function history(c, ceiling = c.floor) {
    let best=null,saved=false;
    for (let i = ceiling; i >= 0; i--) {
      const e=(await adapter.readMessage(i))?.stat_data?.xsd2?.[0];guard(c);
      if(e?.schema===2)saved=true;
      if(compatible(e,c)){best={state:C.clone(e.state),floor:i};break;}
    }
    const records=adapter.readCheckpoints ? await adapter.readCheckpoints() : [await adapter.readCheckpoint?.()];guard(c);
    for(const checkpoint of records){
      if(checkpoint?.schema===2 && checkpoint.chatId===c.chatId)saved=true;
      const cpFloor=checkpoint?.trail?.length-1;
      if(checkpoint?.chatId===c.chatId && (!checkpoint.branchId||checkpoint.branchId===c.branchId) && compatible(checkpoint,c) && cpFloor<=ceiling && (!best||cpFloor>best.floor || (cpFloor===best.floor && checkpoint.state?.revision>best.state?.revision))) best={state:C.clone(checkpoint.state),floor:cpFloor};
    }
    const p=scopeChatId===c.chatId?current?.pending:null,auth=p?.authorization;
    if(auth?.chatId===c.chatId && auth.branchId===c.branchId && p.floor<=ceiling && C.matches(auth.trail,c.trail) && (!best||p.floor>=best.floor)) best={state:C.clone(current),floor:p.floor};
    if(!best && saved)throw Error("已有进度记录与当前分支不匹配，已停止初始化以保护存档");
    return best;
  }
  function defaults(identity, opening, custom) {
    const stat = C.parseStatus(opening).fields;
    const d = custom?.date || C.parseDate(stat.时间);
    if (!d) throw Error("开局缺少有效日期，请填写明确的入世日期");
    const R = data.rules({});
    if (!R.IDENTITIES.some((x) => x.name === identity)) throw Error("无效身份");
    const known = Object.fromEntries(R.ALL_FIELDS.map((k) => [k, false]));
    for (const k of R.openFieldsFor(identity)) known[k] = true;
    const baseStat = {
      ...stat,
      身份: identity,
      阵营: R.IDENTITY_FACTION[identity],
      known,
      inventory: startingInventoryFor(identity),
      在场角色: C.parseStatus(opening).cast,
      relic_progress: {},
      名器归属: {},
      破处者: {},
      段位: 1,
    };
    if (identity === "自设") {
      const nameMatch = opening.match(/【身份】自设[·\s]+([^\r\n]+)/);
      const customName =
        custom?.name || nameMatch?.[1]?.trim() || stat.自设?.name || "自设道友";
      baseStat.自设 = {
        name: customName,
        realm: custom?.realm || stat.修为 || "筑基初期",
        date: d,
        place: custom?.place || stat.地点 || "由玩家自定",
        origin: custom?.origin || "",
      };
      if (baseStat.自设.realm) baseStat.修为 = baseStat.自设.realm;
      if (baseStat.自设.place) baseStat.地点 = baseStat.自设.place;
    }
    return {
      schema: 2,
      identity,
      calendarDate: d,
      stat_data: baseStat,
      pluginState: {},
      activeEvent: null,
      pending: null,
      receipts: {},
      manual: {},
      processed: {},
      storyCount: 0,
      revision: 0,
    };
  }
  function normalize(s) {
    C.assertDate(s.calendarDate);
    Realm.ensure(s,rules(s));
    Eras.reconcile(s,eras);
    s.stat_data.inventory = (s.stat_data.inventory || []).map(describeItem);
    s.stat_data.纳戒 = (s.inventoryChanges || [])
      .map(x => x.action + "：" + x.name + "×" + x.count).join("｜") || "无";
    s.stat_data.身份 = s.identity;
    s.stat_data.时间 = "仙盟历 " + C.dateText(s.calendarDate);
    s.stat_data.仙盟历文 = C.dateText(s.calendarDate);
    const d = s.calendarDate;
    s.stat_data.仙盟历 =
      Math.round(
        (d.year + d.month / 100 + ((d.day - 1) / 30) * 0.005) * 10000,
      ) / 10000;
    s.stat_data.历基准 ??= C.day(d) / 30;
    s.stat_data.历时累计 = C.day(d) / 30 - s.stat_data.历基准;
    if (s.activeEvent?.place) s.stat_data.地点 = s.activeEvent.place;
    s.stat_data.node_trigger = s.pending?.nodeId || null;
    s.stat_data.stage_focus = s.pending?.selection?.character || s.activeEvent?.character || s.stat_data.result_focus || null;
    return resolveStages(s, data.characterProfiles || {});
  }
  function manual(s) {
    for (const [k, v] of Object.entries(s.manual || {})) {
      if (k === "identity") {
        s.identity = v;
        s.stat_data.阵营 = rules(s).IDENTITY_FACTION[v];
      } else if (k === "calendarDate") s.calendarDate = C.clone(v);
      else if (k === "inventory") s.stat_data.inventory = C.clone(v);
      else if (k === "段位") s.stat_data.段位 = v;
      else if (k.startsWith("metric.")) {
        const [character,key] = k.slice(7).split(".");
        writeMetric(s.stat_data,data.characterProfiles || {},character,key,v);
      }
      else if (k.startsWith("known.")) s.stat_data.known[k.slice(6)] = v;
      else if (k.startsWith("owner.")) s.stat_data.名器归属[k.slice(6)] = v;
    }
    const R = rules(s);
    s.stat_data.relic_stage_override = {};
    for (const [k, v] of Object.entries(s.manual || {}))
      if (k.startsWith("relicStage.")) {
        const id = k.slice(11),
          cfg = R.RELIC_PILOT_CONFIG[id];
        s.stat_data.relic_stage_override[id] = v;
        s.stat_data.known[cfg.formKey] = v > 0;
        for (let i = 1; i <= 4; i++)
          s.stat_data.known[cfg["stage" + i + "Key"]] = v >= i;
      }
    return normalize(s);
  }
  function snapshot() {
    if (!current) return null;
    const c = context();
    if (scopeChatId !== c.chatId) return null;
    const s = C.clone(current);
    return {
      ...s,
      chatId: c.chatId,
      branchId: c.branchId,
      floor: c.floor,
      inventory: s.stat_data.inventory,
      known: s.stat_data.known,
      relics: s.stat_data.relic_progress,
    };
  }
  function notify(type) {
    for (const f of [...subscribers])
      try {
        f({ type, snapshot: snapshot() });
      } catch (e) {
        adapter.report?.(e);
      }
  }
  async function commit(c, s, type) {
    guard(c);
    s.revision = (current?.revision || s.revision || 0) + 1;
    manual(s);
    s.stat_data.active_area = areaBackgrounds.lookup(String(s.stat_data?.地点 || ""));
    const envelope = {
      schema: 2,
      chatId: c.chatId,
      branchId: c.branchId,
      trail: c.trail.slice(0, c.floor + 1),
      state: s,
    };
    await adapter.persist(c, envelope);
    guard(c);
    current = C.clone(s);
    scopeChatId = c.chatId;
    updatePrompt();
    try {
      await adapter.syncState?.(C.clone(s));
    } catch (e) {
      adapter.report?.(e);
      if (type === "pending") throw e;
    }
    guard(c);
    notify(type);
    return snapshot();
  }
  function enqueue(fn) {
    const c = context();
    const next = queue
      .catch(() => {})
      .then(async () => {
        guard(c);
        return fn(c);
      });
    queue = next;
    return next;
  }
  function lifecycle(fn) {
    const id = context().chatId;
    const next = queue
      .catch(() => {})
      .then(() => {
        const c = context();
        if (c.chatId !== id) return { skipped: true };
        return fn(c);
      });
    queue = next;
    return next;
  }
  async function load(c, rollbackUnsent = true) {
    const found = await history(c);
    if (found) {
      current = manual(found.state);
      scopeChatId = c.chatId;
      if (
        rollbackUnsent &&
        current.pending &&
        !c.chat
          .slice(current.pending.floor + 1)
          .some((m) => m.is_user && !m.is_system)
      ) {
        current = C.clone(current.pending.before);
        await commit(c, current, "rollback");
      } else notify("branch_change");
      updatePrompt();
      return snapshot();
    }
    const first = String(c.chat[0].mes || "");
    if (first.includes("<IdentityMenu")) {
      current = null;
      updatePrompt();
      notify("identity_menu");
      return null;
    }
    const identity =
      Object.keys(data.greetings).find((x) =>
        first.includes('<IdentityPick name="' + x + '"'),
      ) ||
      Object.keys(data.greetings).find((x) =>
        C.parseStatus(first).fields.身份?.includes(x),
      ) ||
      (first.includes("【身份】自设") ? "自设" : null);
    if (identity === "自设" && !C.parseDate(C.parseStatus(first).fields.时间)) {
      current = null;
      updatePrompt();
      notify("identity_menu");
      return null;
    }
    if (identity) {
      // Reconstruct the opening at its own floor, even when a user turn already
      // exists. Saving at the latest floor would leave story() without a base
      // and lose the identity again when that user turn is deleted.
      const result = await commit(
        { ...c, floor: 0 }, defaults(identity, first), "initialize",
      );
      await adapter.syncIdentity?.(identity);
      return result;
    }
    current = null;
    updatePrompt();
    return null;
  }
  function updatePrompt() {
    const p = current?.pending;
    const plugin = p && p.kind !== "item"
      ? plugins.get(p.pluginId)
      : current?.activeEvent
        ? plugins.get(current.activeEvent.pluginId)
        : null;
    const text = p ? (p.actionCode ? "本轮内部节点指令：" + p.actionCode +
      "；玩家显示行动：" + p.displayText + "；含义：" + p.actionText + "。\n" : "") + p.prompt +
      (p.kind === "item" && plugin ? "\n" + plugin.getPrompt?.(snapshot()) : "")
      : plugin?.getPrompt?.(snapshot()) || "";
    const st = current?.stat_data;
    const baseline = current
      ? "后台当前时点：仙盟历 " +
        C.dateText(current.calendarDate) +
        "。当前大势："+(Eras.currentEra(eras,current.calendarDate)?.name || "尚无已配置时期")+"。身份：" +
        current.identity +
        "。后台玩家修为："+st.修为+"。玩家境界由本地记录，正文不得自行提升玩家境界。地点：" +
        (p?.selection?.destination || st.地点 || "未定") +
        "。已知事实：" +
        Object.keys(st.known)
          .filter((k) => st.known[k])
          .join("、") +
        "。纳戒：" +
        JSON.stringify(st.inventory) +
        "。日期照抄后台；历时只写本回合实际耗时，不按轮次固定增加，不默认半个时辰，不写距事件的累计天数；无法确定耗时写—，不沿用上一轮耗时；物品进出和名器互动按原有状态栏协议申报并与正文相符。" +
        (current.activeEvent || p
          ? "事件期间按节点约定停留，退出耗时由后台结算，不另外推进世界日期。"
          : "")
      : "";
    adapter.setPrompt?.(baseline + "\n" + text);
  }
  async function select(c, intent) {
    if (!current) throw Error("请先选择身份");
    if (current.pending) throw Error("当前行动还未完成");
    if (adapter.isGenerating?.()) throw Error("请等本轮回复结束");
    if (
      intent.expected?.chatId !== c.chatId ||
      intent.expected.branchId !== c.branchId ||
      intent.expected.revision !== current.revision ||
      intent.expected.floor !== c.floor
    )
      throw Error("节点来自旧状态，请重新选择");
    const plugin = plugins.get(intent.pluginId);
    if (!plugin) throw Error("地图插件尚未注册");
    if (current.activeEvent && current.activeEvent.pluginId !== plugin.id)
      throw Error("另一个事件尚未结束");
    const n = plugin.select(
      C.clone(snapshot()),
      String(intent.payload?.nodeId || ""),
    );
    if (!n || n.id !== intent.payload.nodeId || n.allowed === false)
      throw Error(n?.reason || "当前节点不可选");
    C.safe(n);
    if (!meets(snapshot(), n.conditions || [])) throw Error("节点数值或阶段条件未满足");
    if (n.identities && !n.identities.includes(current.identity))
      throw Error("身份不满足");
    const stamp = C.day(current.calendarDate);
    if (
      (n.open && stamp < C.day(n.open)) ||
      (n.close && stamp > C.day(n.close))
    )
      throw Error("不在事件开放日期");
    if ((n.requires || []).some((k) => current.stat_data.known[k] !== true))
      throw Error("前置条件未满足");
    if (
      n.ttl !== undefined &&
      (!Number.isInteger(n.ttl) || n.ttl < 1 || !Number.isInteger(n.openedAt))
    )
      throw Error("节点期限配置无效");
    if (n.ttl !== undefined && current.storyCount - n.openedAt >= n.ttl)
      throw Error("节点已过期");
    if (!n.actionText || typeof n.prompt !== "string")
      throw Error("节点配置缺少行动或剧情指令");
    if (n.exitDays !== undefined) {
      if (!Number.isInteger(n.exitDays) || n.exitDays < 0)
        throw Error("退出耗时配置无效");
      if (current.manual.calendarDate)
        throw Error("世界日期处于GM人工覆盖，请先交还自动");
      if (!(await adapter.confirmExit(n))) return { cancelled: true };
      guard(c);
    }
    if (n.immediateResult?.rewards?.length && current.manual.inventory)
      throw Error("纳戒处于人工覆盖，请先交还自动再领取固定节点奖励");
    adapter.preflightSend?.();
    const before = C.clone(current),
      next = C.clone(current);
    const id =
      c.chatId + ":" + c.floor + ":" + current.revision + ":" + C.hash(JSON.stringify(c.trail)) + ":" + ++serial;
    delete next.stat_data.result_focus;
    next.pending = {
      id,
      pluginId: plugin.id,
      nodeId: n.id,
      actionText: n.actionText,
      displayText:n.displayText || n.actionText,
      actionCode:createActionCode(n.id, id),
      prompt: n.prompt,
      floor: c.floor,
      authorization:{chatId:c.chatId,branchId:c.branchId,trail:C.clone(c.trail)},
      selection: C.clone(n),
      before,
    };
    for (const x of n.metricChanges || []) {
      const spec = metricSpec(data.characterProfiles || {},x.character,x.key);
      if (!Number.isFinite(x.delta)) throw Error("节点数值变化须为有限数值");
      if (next.manual["metric."+x.character+"."+x.key] !== undefined) throw Error("人物数值处于人工覆盖，请先交还自动");
      const value = next.stat_data.character_metrics?.[x.character]?.[x.key] ?? spec.default;
      writeMetric(next.stat_data,data.characterProfiles || {},x.character,x.key,value+x.delta);
    }
    if (n.completionQuery) next.pending.prompt += "\n本轮只结算，不继续故事。根据本段历史回答："+n.completionQuery+
      "\n严格输出唯一一项：<Promotion_result id=\""+next.pending.actionCode+"\">是</Promotion_result> 或 <Promotion_result id=\""+next.pending.actionCode+"\">否</Promotion_result>。不得返回另一行动ID，不输出分析过程，不新增剧情来补成成功。";
    if (n.immediateResult !== undefined) {
      const pending = next.pending;
      if (n.immediateResult.outcome !== "success") throw Error("固定结果必须成功且符合节点白名单");
      applyResult(next, pending, n.immediateResult);
      next.inventoryChanges = next.reconciledInventoryChanges || [];
      pending.fixedApplied = true;
      next.pending = pending;
    }
    if (n.reservedState !== undefined)
      next.pluginState[plugin.id] = C.clone(n.reservedState);
    try {
      await commit(c, next, "pending");
      guard(c);
      await adapter.send(next.pending.actionCode);
      return snapshot();
    } catch (e) {
      const now = context();
      if (now.floor === c.floor && token(now) === token(c))
        await commit(now, before, "rollback");
      throw e;
    }
  }
  function applyResult(s, p, result) {
    if (!result || !["success", "failure", "retry"].includes(result.outcome))
      throw Error("插件未返回明确结果");
    C.safe(result);
    if (result.pluginState !== undefined)
      s.pluginState[p.pluginId] = C.clone(result.pluginState);
    if (result.activeEvent !== undefined) {
      if (
        result.activeEvent !== null &&
        result.activeEvent.pluginId !== p.pluginId
      )
        throw Error("插件不能接管别人的事件");
      s.activeEvent = C.clone(result.activeEvent);
    }
    if (result.stageGrant) {
      if (result.outcome !== "success" || JSON.stringify(result.stageGrant) !== JSON.stringify(p.selection.stageGrant) || !p.selection.completionQuery)
        throw Error("插件提交未授权的晋升阶段");
      completeStage(s,data.characterProfiles || {},result.stageGrant);
      s.stat_data.result_focus = result.stageGrant.character;
    }
    if (result.outcome === "success") {
      if (result.elapsedDays !== undefined) {
        if (result.elapsedDays !== p.selection.exitDays)
          throw Error("插件结算耗时不符合节点配置");
        s.calendarDate = C.fromDay(C.day(s.calendarDate) + result.elapsedDays);
        s.stat_data.历时 = result.elapsedDays + "日";
      }
      const rewards = result.rewards || [];
      if (
        rewards.some(
          (x) =>
            !(p.selection.rewards || []).includes(x.name) ||
            !Number.isInteger(x.count || 1) ||
            (x.count || 1) < 1,
        )
      )
        throw Error("插件授予未配置奖励");
      for (const item of rewards) {
        const existing = s.stat_data.inventory.find(
          (x) => x.id === item.name && x.source === p.pluginId,
        );
        if (existing) existing.count += item.count || 1;
        else
          s.stat_data.inventory.push({
            id: item.name,
            name: item.name,
            count: item.count || 1,
            source: p.pluginId,
          });
      }
      for (const k of result.known || []) {
        if (!(p.selection.grantsKnown || []).includes(k))
          throw Error("插件提交未配置事实");
        s.stat_data.known[k] = true;
      }
      s.receipts[p.id] = {
        pluginId: p.pluginId,
        nodeId: p.nodeId,
        floor: context().floor,
        rewards: p.fixedApplied ? C.clone(s.receipts[p.id]?.rewards || []) : C.clone(rewards),
        elapsedDays: p.fixedApplied ? (s.receipts[p.id]?.elapsedDays || 0) : (result.elapsedDays || 0),
        date: C.clone(s.calendarDate),
      };
    }
    const fixedChanges = p.fixedApplied ? (s.inventoryChanges || []) : null;
    s.reconciledInventoryChanges = fixedChanges || (result.outcome === "success"
      ? (result.rewards || []).map(x => ({ action: "获得", name: x.name, count: x.count || 1 })) : []);
    s.reconciledRewards =
      p.fixedApplied ? (p.selection.rewards || []) : result.outcome === "success" ? rewardsNames(result) : [];
    s.reconciledRewardAliases = p.fixedApplied ? C.clone(p.selection.rewardAliases || {}) : {};
    s.lastNodeResult = { nodeId:p.nodeId, floor:context().floor,
      outcome:result.outcome, reason:result.reason || "",
      evidenceMode:result.evidenceMode || null };
    s.pending = null;
    return s;
  }
  function rewardsNames(result) {
    return (result.rewards || []).map((x) => x.name);
  }

  function duration(value) {
    const m = String(value || "")
      .trim()
      .match(
        /^(半|\d+|[一二三四五六七八九十廿卅]+)(?:个)?(日|天|夜|时辰|时|小时|分钟|分)$/,
      );
    if (!m) return 0;
    const n = m[1] === "半" ? 0.5 : C.number(m[1]);
    return (
      n *
      ({ 日: 1440, 天: 1440, 夜: 720, 时辰: 120, 时: 60, 小时: 60, 分钟: 1, 分: 1 }[m[2]] || 0)
    );
  }
  function applyInventory(s, parsed) {
    const changes = s.manual.inventory && !(s.reconciledUse && !s.reconciledUse.consumable) ? [] : (s.reconciledInventoryChanges || []);
    delete s.reconciledInventoryChanges;
    if (s.manual.inventory) return changes;
    for (const part of String(parsed.fields.纳戒 || "").split(/[｜|；;]/)) {
      const m = part
        .trim()
        .match(
          /^(获得|消耗)[:：]\s*(.+?)(?:[×x*]\s*(\d+))?(?:[（(](.*)[）)])?$/,
        );
      if (!m) continue;
      const name = m[2].trim(),
        count = Number(m[3] || 1),
        gain = m[1] === "获得";
      if (!name || count < 1 || !Number.isSafeInteger(count)) continue;
      // An already committed fixed reward is an informational duplicate.
      // Ignore it before prose validation, including aliases scoped to this node.
      const granted = (s.reconciledRewards || []).find(reward =>
        (reward === name || (s.reconciledRewardAliases?.[reward] || []).some(alias => name.includes(alias))) &&
        s.stat_data.inventory.some(item => item.name === reward));
      if (gain && granted) continue;
      if (!gain && s.reconciledUse && (name === s.reconciledUse.name ||
        (s.reconciledUse.aliases || []).some(alias => name.includes(alias)))) continue;
      const existing = s.stat_data.inventory.find(x => x.name === name);
      if (!gain && existing && !describeItem(existing).consumable &&
        !parsed.prose.split(/[。！？\n，,；;]/).some(line => line.includes(name) && !C.noFact.test(line) && /送给|赠给|丢掉|夺走|损毁|销毁|焚毁/.test(line))) continue;
      const proof = parsed.prose.split(/[。！？\n]/).some(
        (line) =>
          line.includes(name) &&
          !C.noFact.test(line) &&
          (line.includes("你") ||
            line.includes(s.identity) ||
            /^(?:获得|取得|得到|拿到|收起|收下|服下|使用|喝掉|吃下)/.test(
              line.trim(),
            )) &&
          !rules(s)
            .FORM_OF_HOLDERS.flatMap((g) => g.holders)
            .some(
              (actor) =>
                actor !== s.identity &&
                new RegExp(
                  actor +
                    "(?:已|已经|亲自|独自|顺手|终于|随后|便)?(?:获得|取得|得到|拿到|收起|服下|用掉)",
                ).test(line),
            ) &&
          (gain
            ? /获得|取得|得到|拿到|收起|收下|放入|拾起|收入/
            : /喝|用掉|使用|服下|消耗|送给|赠给|丢掉|夺走|吃下|吞下/
          ).test(line),
      );
      if (!proof) {
        adapter.report?.(Error("纳戒进出缺少正文实证：" + name));
        continue;
      }
      const old = s.stat_data.inventory.find((x) => x.name === name);
      if (gain) {
        if (old) {
          old.count += count;
        } else
          s.stat_data.inventory.push({
            id: name,
            name,
            count,
            description: m[4] || "",
          });
      } else if (old && old.count >= count) {
        old.count -= count;
        s.stat_data.inventory = s.stat_data.inventory.filter(
          (x) => x.count > 0,
        );
      } else continue;
      changes.push({ action: gain ? "获得" : "消耗", name, count });
    }
    return changes;
  }
  function applyStory(s, text, id, swipe, allowInventory = true) {
    delete s.stat_data.result_focus;
    const parsed = C.parseStatus(text),
      R = rules(s);
    for (const k of C.DISPLAY_FIELDS)
      if (parsed.fields[k] && k !== "历时" && k !== "修为") s.stat_data[k] = parsed.fields[k];
    if (parsed.cast.length || parsed.fields.在场 === "无")
      s.stat_data.在场角色 = parsed.cast;
    if (parsed.fields.实际发生) s.stat_data.实际发生 = parsed.fields.实际发生;
    s.inventoryChanges = allowInventory ? applyInventory(s, parsed) : [];
    if (parsed.fields.历时) s.stat_data.历时 = parsed.fields.历时;
    if (
      !s.pending &&
      !s.activeEvent &&
      !s.manual.calendarDate &&
      !s.suppressClock
    ) {
      const minutes = duration(parsed.fields.历时);
      if (minutes) {
        const total = (s.clockRemainder || 0) + minutes;
        s.calendarDate = C.fromDay(
          C.day(s.calendarDate) + Math.floor(total / 1440),
        );
        s.clockRemainder = total % 1440;
      }
    }
    delete s.suppressClock;
    delete s.reconciledRewards;
    delete s.reconciledRewardAliases;
    delete s.reconciledUse;
    // Model time/identity and inventory dumps are display reports, never authoritative mutations.
    const statements = parsed.actions;
    for (const f of R.FIELD_TABLE) {
      if (
        /成形|[一二三四]阶段|处女丧失/.test(f.name) ||
        !statements.includes(f.name) ||
        !f.kws.some((k) => C.fact(parsed.prose, k))
      )
        continue;
      if (
        eras.some(e=>e.anchors.includes(f.name)) &&
        C.day(s.calendarDate) < C.day(eras.find(e=>e.anchors.includes(f.name)).startDate)
      )
        continue;
      s.stat_data.known[f.name] = true;
    }
    const verifiedProse=stripForEvidence(parsed.prose).replace(/<(?:破处|名器互动|实际发生|进度)>[\s\S]*?<\/(?:破处|名器互动|实际发生|进度)>/gi,"");
    for (const group of R.FORM_OF_HOLDERS) {
      for (const holder of group.holders) {
        const proofLine = verifiedProse
          .split(/[。！？\n]/)
          .find(
            (line) =>
              line.includes(holder) &&
              !C.noFact.test(line) &&
              R.DEFLOWER_HARD_RES.some(([re]) => re.test(line)) &&
              /(落红|破(?:了|去|过|掉)?(?:她|他|其)?的?身|破处|元阴被夺|失了身)/.test(
                line,
              ),
          );
        if (proofLine) {
          s.stat_data.known[holder + "处女丧失"] = true;
          const record = (parsed.fields.破处 || "")
            .split("｜")
            .find((x) => x.split("、")[0] === holder);
          const owner = record?.split("、")[1]?.trim();
          if (
            (owner && C.fact(proofLine, owner)) ||
            (owner === s.identity && C.fact(proofLine, "你"))
          )
            s.stat_data.破处者[holder] = owner;
          else if (
            C.fact(proofLine, "你") ||
            C.fact(proofLine, s.identity)
          )
            s.stat_data.破处者[holder] = s.identity;
        }
      }
      if (group.holders.every((h) => s.stat_data.known[h + "处女丧失"])) {
        s.stat_data.known[group.form] = true;
        s.stat_data.known["获得任意名器"] = true;
        const cfg = Object.values(R.RELIC_PILOT_CONFIG).find(
          (x) => x.formKey === group.form,
        );
        if (cfg) {
          s.stat_data.known[cfg.stage1Key] = true;
          if (s.stat_data.破处者[group.holders[0]])
            s.stat_data.名器归属[cfg.id] = s.stat_data.破处者[group.holders[0]];
        }
      }
    }
    manual(s);
    const rr = rules(s);
    const reportedRelics=new Set();
    for (const raw of parsed.interactions || []) {
      const a = rr.parseRelicAction(raw);
      if (!a) continue;
      reportedRelics.add(a.relicId);
      const validated = rr.validateRelicAction(
        a,
        parsed.prose,
        s.stat_data.known,
        s.identity,
      );
      if (validated.ok)
        s.stat_data.relic_progress = rr.calcRelicProgress(
          s.stat_data.relic_progress,
          { ...a, ...validated },
          id,
          swipe,
          C.hash(text),
          s.stat_data.known,
        );
    }
    for(const action of inferRelicActions(rr,parsed.prose,s.stat_data.known,s.identity,reportedRelics))
      s.stat_data.relic_progress=rr.calcRelicProgress(s.stat_data.relic_progress,action,id,swipe,C.hash(text),s.stat_data.known);
    for (const [rid, cfg] of Object.entries(rr.RELIC_PILOT_CONFIG)) {
      const stage = rr.getRelicStage(rid, s.stat_data.known),
        progress = s.stat_data.relic_progress[rid],
        positive = parsed.prose
          .split(/[。！？\n]/)
          .filter((line) => !C.noFact.test(line))
          .join("。");
      if (
        stage === 1 &&
        progress?.stages?.[2]?.ready &&
        rr.hasRelicPhysiologicalResponse(rid, positive)
      )
        s.stat_data.known[cfg.stage2Key] = true;
      if (
        stage === 2 &&
        progress?.stages?.[3]?.ready &&
        rr.hasRelicStage3Response(rid, positive)
      )
        s.stat_data.known[cfg.stage3Key] = true;
      if (
        stage === 3 &&
        progress?.stages?.[4]?.ready &&
        rr.hasRelicStage4Response(rid, positive)
      )
        s.stat_data.known[cfg.stage4Key] = true;
    }
    Realm.collect(s,rr,parsed.prose,id);
    try {
      const applied = metricEvents.apply(s, text, parsed.prose, s.storyCount + 1);
      if (applied.changes.length) s.lastMetricEvents = applied.changes;
    } catch (error) {
      adapter.report?.(Error("数值事件申报结算失败：" + error.message));
    }
    s.processed[id] = C.hash(text);
    s.storyCount++;
    return s;
  }
  async function story(c) {
    if (adapter.isGenerating?.() || adapter.isAborted?.())
      return { deferred: true };
    const m = c.chat[c.floor];
    if (
      !m ||
      m.is_user ||
      m.is_system ||
      c.floor === 0 ||
      !String(m.mes || "").trim()
    )
      return { skipped: true };
    if (!current || scopeChatId !== c.chatId) await load(c);
    if (!current) return { skipped: true };
    const processed=current.processed[c.floor];
    const normalizedHash=C.hash(String(m.mes).replace(/\r\n/g,"\n").trim());
    const closedCallback=processed && Object.values(current.settlements || {}).some(x=>x.floor===c.floor && x.kind==="promotion");
    // The raw callback has already been replaced by display text. Only an
    // explicit regeneration/delete can revoke its saved settlement receipt.
    if(processed===C.hash(m.mes) || processed===normalizedHash || closedCallback)return {skipped:true};
    const previous = await history(c, c.floor - 1);
    if (!previous) throw Error("缺少本楼的前置状态");
    let s = previous.state;
    // Manual edits on this candidate remain higher priority when its prose is edited.
    const candidate = (await adapter.readMessage(c.floor))?.stat_data
      ?.xsd2?.[0];
    guard(c);
    if (
      candidate?.chatId === c.chatId &&
      C.matches(candidate.trail?.slice(0, c.floor), c.trail)
    )
      s.manual = { ...s.manual, ...candidate.state.manual };
    let body = String(m.mes);
    const p = s.pending;
    const latestUser = c.chat.slice(0, c.floor).reverse().find(x => x.is_user && !x.is_system);
    let allowInventory = !!p || !/\bXSD2_/.test(String(latestUser?.mes || ""));
    if (p) {
      const user = c.chat
        .slice(p.floor + 1, c.floor)
        .reverse().find((x) => x.is_user && !x.is_system);
      if (!user || (p.actionCode ? readActionCode(user.mes)?.code !== p.actionCode : String(user.mes).trim() !== p.actionText)) {
        s = C.clone(p.before);
        allowInventory = false;
        s.lastNodeResult = { nodeId:p.nodeId, floor:c.floor, outcome:"failure",
          reason:"行动后的用户消息与授权行动不匹配", evidenceMode:null };
      } else if (p.kind === "item") {
        s.reconciledUse = C.clone(p.item);
        s.reconciledInventoryChanges = C.clone(s.inventoryChanges || []);
        s.itemUseReceipts ||= {};
        s.itemUseReceipts[p.id] = {name:p.item.name, consumable:p.item.consumable, operation:p.operation || "use", floor:c.floor};
        s.pending = null;
      } else {
        const plugin = plugins.get(p.pluginId);
        if (!plugin) throw Error("活动事件插件尚未加载");
        const result = await plugin.settle(
          C.clone({
            ...s,
            chatId: c.chatId,
            branchId: c.branchId,
            floor: c.floor,
          }),
          C.clone(p),
          body,
        );
        guard(c);
        if (adapter.isAborted?.() || adapter.isGenerating?.())
          return { deferred: true };
        s = applyResult(s, p, result);
        s.suppressClock = true;
        if (result.body !== undefined) body = String(result.body);
      }
    }
    if (p?.selection?.completionQuery) {
      // Completion callbacks are a settlement reply, not an exploration/story turn.
      s.stat_data.历时 = "0日";
      s.inventoryChanges = [];
      delete s.reconciledInventoryChanges;
      delete s.reconciledRewards;
      delete s.reconciledRewardAliases;
      const xml = value => String(value ?? "无").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
      body += "\n<Status_block>"+C.XML_FIELDS.map(k=>"<"+k+">"+xml(s.stat_data[k])+"</"+k+">").join("")+"</Status_block>";
      delete s.suppressClock;
    } else s = applyStory(s, body, c.floor, m.swipe_id ?? 0, allowInventory);
    const confirmedPlace = s.lastNodeResult?.floor === c.floor &&
      s.lastNodeResult.outcome === "success" && p?.selection.settlementMode === "choice"
      ? p.selection.destination : undefined;
    if (confirmedPlace) s.stat_data.地点 = confirmedPlace;
    if (confirmedPlace && p.selection.exitDays) s.stat_data.历时 = p.selection.exitDays + "日";
    if (s.lastNodeResult?.floor === c.floor && s.lastNodeResult.outcome === "success" && p?.selection.settlement?.mode && p.selection.settlement.mode !== "none") {
      const eventReceipt = s.pluginState[p.pluginId]?.receipt;
      s.settlements ||= {};
      s.settlements[p.id] = {id:p.id, floor:c.floor, title:p.selection.settlement.title || "事件结算", mode:p.selection.settlement.mode,
        action:p.displayText || p.actionText, elapsedDays:s.receipts[p.id]?.elapsedDays || 0,
        date:C.clone(s.calendarDate), rewards:C.clone(eventReceipt?.rewards || s.receipts[p.id]?.rewards || []),
        facts:C.clone(eventReceipt?.summaryLog || []), exitType:eventReceipt?.exitType || ""};
    }
    if (p?.selection?.completionQuery && s.lastNodeResult?.evidenceMode === "PROMOTION_RESULT") {
      const receipt=s.pluginState[p.pluginId]?.receipt;
      if(receipt?.id === p.id) {
        s.settlements ||= {};
        s.settlements[p.id]={id:p.id,floor:c.floor,title:(p.selection.character || "人物")+" · 缘事已记",mode:"separate",kind:"promotion",
          answer:receipt.answer,stage:s.stat_data.completed_character_stages?.[p.selection.character] || p.selection.stageGrant.from,
          action:p.displayText,elapsedDays:0,date:C.clone(s.calendarDate),rewards:[],facts:["达成条件："+p.selection.completionQuery]};
      }
    }
    manual(s);
    const fixed = C.canonicalStatus(body, s, confirmedPlace);
    if (fixed !== m.mes) {
      const oldId = c.chatId,
        oldFloor = c.floor;
      await adapter.replaceStory(c.floor, fixed);
      c = context();
      if (c.chatId !== oldId || c.floor !== oldFloor)
        throw Error("正文更新期间聊天变化");
    }
    if (adapter.isAborted?.() || adapter.isGenerating?.())
      return { deferred: true };
    s.processed[c.floor] = C.hash(fixed);
    return commit(c, s, "floor_advance");
  }
  async function gm(c, payload) {
    if (!current) throw Error("请先选择身份");
    C.safe(payload);
    const s = C.clone(current);
    for (const [k, v] of Object.entries(payload || {})) {
      if (k === "identity") {
        if (!rules(s).IDENTITIES.some((x) => x.name === v))
          throw Error("身份无效");
        s.manual[k] = v;
        for (const field of rules(s).openFieldsFor(v))
          s.stat_data.known[field] = true;
        s.pending = null;
        s.activeEvent = null;
      } else if (k === "calendarDate") {
        C.assertDate(v);
        if (s.pending) throw Error("请先撤回待执行行动，再修改日期");
        s.manual[k] = C.clone(v);
      } else if (k === "inventory") {
        if (
          !Array.isArray(v) ||
          v.some((x) => !x.name || !Number.isInteger(x.count) || x.count < 1)
        )
          throw Error("物品须有名称及正整数数量");
        s.manual[k] = C.clone(v);
      } else if (k === "realm") {
        if(s.pending||s.activeEvent)throw Error("请先结束当前剧情或行动，再设置境界");
        if(typeof v!=="string"||!v.trim())throw Error("境界不能为空");
        const old=Realm.ensure(s,rules(s));s.stat_data.player_realm={...old,...Realm.parse(v)};
      } else if (k.startsWith("imprint.") && rules(s).RELIC_PILOT_CONFIG[k.slice(8)] && (typeof v==="string"||v===null)) {
        s.stat_data.relic_imprints ||= {};
        if(v)s.stat_data.relic_imprints[k.slice(8)]={owner:v,source:"GM"};else delete s.stat_data.relic_imprints[k.slice(8)];
      } else if (k === "段位") {
        if (!Number.isInteger(v) || v < 1 || v > 16) throw Error("段位为1—16");
        s.manual[k] = v;
      } else if (k.startsWith("metric.")) {
        if (s.pending) throw Error("请先撤回待执行行动，再修改人物数值");
        const [character,key] = k.slice(7).split(".");
        writeMetric(s.stat_data,data.characterProfiles || {},character,key,v);
        s.manual[k] = v;
      } else if (
        k.startsWith("relicStage.") &&
        rules(s).RELIC_PILOT_CONFIG[k.slice(11)] &&
        Number.isInteger(v) &&
        v >= 0 &&
        v <= 4
      )
        s.manual[k] = v;
      else if (k.startsWith("known.") && typeof v === "boolean")
        s.manual[k] = v;
      else if (k.startsWith("owner.") && (typeof v === "string" || v === null))
        s.manual[k] = v;
      else throw Error("GM字段不在白名单");
    }
    return commit(c, s, "gm_override");
  }
  async function initialize(c, identity, custom) {
    const profile = data.greetings[identity];
    if (!profile) throw Error("身份无效");
    let opening = profile;
    if (identity === "自设") {
      if (!custom?.date || !custom?.name || !custom?.realm)
        throw Error("请填写自设道号、修为和日期");
      C.assertDate(custom.date);
      opening =
        profile
          .replace(
            /<时间>[\s\S]*?<\/时间>/,
            "<时间>仙盟历 " + C.dateText(custom.date) + "</时间>",
          )
          .replace(
            /<修为>[\s\S]*?<\/修为>/,
            "<修为>" + custom.realm + "</修为>",
          )
          .replace(
            /<地点>[\s\S]*?<\/地点>/,
            "<地点>" + (custom.place || "由玩家自定") + "</地点>",
          ) +
        "\n你的入世设定：" +
        custom.name +
        "；" +
        (custom.origin || "");
    }
    const s = defaults(identity, opening, custom);
    if (custom) s.stat_data.自设 = C.clone(custom);
    normalize(s);
    opening=opening.replace(/<修为>[\s\S]*?<\/修为>/,"<修为>"+s.stat_data.修为+"</修为>");
    const oldId = c.chatId;
    await adapter.replaceOpening(opening);
    c = context();
    if (c.chatId !== oldId || c.floor !== 0)
      throw Error("开局更新期间聊天变化");
    await commit(c, s, "identity_change");
    await adapter.syncIdentity?.(identity);
    return snapshot();
  }
  function dispatchIntent(intent) {
    C.safe(intent);
    return enqueue(async (c) => {
      if (intent.type === "SELECT_IDENTITY") {
        if (c.chat.length !== 1) throw Error("开局身份选择仅限第0楼");
        return initialize(c, intent.payload.identity, intent.payload.custom);
      }
      if (!current || scopeChatId !== c.chatId) await load(c);
      switch (intent.type) {
        case "SELECT_NODE":
          return select(c, intent);
        case "ADVANCE_ERA": {
          if(current.pending||current.activeEvent||adapter.isGenerating?.())throw Error("请先结束当前剧情或行动");
          if(intent.expected?.chatId!==c.chatId||intent.expected.branchId!==c.branchId||intent.expected.floor!==c.floor||intent.expected.revision!==current.revision)throw Error("时期按钮来自旧状态，请重新选择");
          if(current.manual.calendarDate)throw Error("日期处于人工覆盖，请先交还自动");
          const next=C.clone(current);Eras.advance(next,eras,intent.payload.id);
          return commit(c,next,"era_advance");
        }
        case "REALM_ACTION": {
          if(current.pending||adapter.isGenerating?.()||(intent.payload.kind==="retreat"&&current.activeEvent))throw Error("请先结束当前剧情或行动");
          if(intent.expected?.chatId!==c.chatId||intent.expected.branchId!==c.branchId||intent.expected.floor!==c.floor||intent.expected.revision!==current.revision)throw Error("境界按钮来自旧状态，请重新选择");
          if(intent.payload.kind==="retreat"&&current.manual.calendarDate)throw Error("日期处于人工覆盖，请先交还自动");
          const next=C.clone(current);Realm.act(next,rules(next),intent.payload.kind,c.floor);
          return commit(c,next,"realm_action");
        }
        case "GM_PATCH": {
          const r = await gm(c, intent.payload);
          await adapter.syncIdentity?.(current.identity);
          return r;
        }
        case "GM_RELEASE": {
          const s = C.clone(current);
          for (const k of intent.payload.keys || []) delete s.manual[k];
          return commit(c, s, "gm_override");
        }
        case "CANCEL_PENDING": {
          if (!current?.pending) return snapshot();
          const p = current.pending;
          const user = c.chat.findIndex(
            (m, i) => i > p.floor && m.is_user && !m.is_system,
          );
          return commit(
            user >= 0 ? { ...c, floor: user } : c,
            C.clone(p.before),
            "rollback",
          );
        }
        case "SET_CHARACTER_METRIC": {
          if (!current || current.pending || adapter.isGenerating?.()) throw Error("请等当前行动结束");
          const next = C.clone(current), x = intent.payload;
          if (next.manual["metric."+x.character+"."+x.key] !== undefined) throw Error("人物数值处于人工覆盖，请先交还自动");
          writeMetric(next.stat_data,data.characterProfiles || {},x.character,x.key,x.value);
          return commit(c,next,"character_metric");
        }
        case "QUICK_ACTION": {
          if (current?.pending || adapter.isGenerating?.())
            throw Error("请等当前行动结束");
          const behavior = QUICK_ACTIONS[intent.payload.text];
          if (!behavior) throw Error("未知快捷行动");
          if (behavior.mode === "fill") {
            if (!adapter.fillInput) throw Error("当前宿主不支持填入输入栏");
            adapter.fillInput(behavior.draft);
            return snapshot();
          }
          adapter.preflightSend?.();
          await adapter.send(intent.payload.text);
          return snapshot();
        }
        case "USE_ITEM":
        case "DISCARD_ITEM": {
          const discard = intent.type === "DISCARD_ITEM";
          if (current?.pending || adapter.isGenerating?.())
            throw Error("请等当前行动结束");
          const item = current?.stat_data.inventory.find(
            (x) => x.id === intent.payload.id || x.name === intent.payload.id,
          );
          if (!item) throw Error("物品不在纳戒");
          const meta = describeItem(item);
          if (!Number.isSafeInteger(meta.count) || meta.count < 1) throw Error("物品数量无效");
          if ((discard || meta.consumable) && current.manual.inventory)
            throw Error("纳戒处于人工覆盖，请先交还自动再消耗物品");
          if (!["send","view"].includes(itemAction(meta))) throw Error("未知物品使用行为");
          const localUse = !discard && itemAction(meta) === "view";
          if (localUse && meta.consumable) throw Error("消耗品不能配置为仅查看使用");
          if (!discard && !localUse) adapter.preflightSend?.();
          const before = C.clone(current), next = C.clone(current);
          if (discard || meta.consumable) {
            const target = next.stat_data.inventory.find(x => x.id === item.id && x.name === item.name);
            target.count--;
            next.stat_data.inventory = next.stat_data.inventory.filter(x => x.count > 0);
          }
          next.inventoryChanges = [{action:discard ? "丢弃" : meta.consumable ? "消耗" : "使用", name:meta.name, count:1}];
          if (discard || localUse) {
            await commit(c,next,discard ? "item_discard" : "item_view");
            return snapshot();
          }
          next.pending = {id:c.chatId+":item:"+c.floor+":"+current.revision+":"+ ++serial,
            kind:"item", authorization:{chatId:c.chatId,branchId:c.branchId,trail:C.clone(c.trail)}, operation:discard ? "discard" : "use", floor:c.floor, actionText:"使用"+meta.name, item:meta, selection:{}, before,
            prompt:itemUsePrompt(meta, meta.count - (meta.consumable ? 1 : 0))};
          await commit(c, next, "item_use");
          guard(c);
          try { await adapter.send(next.pending.actionText); }
          catch(error) {
            const now = context();
            if (token(now) === token(c)) await commit(now,before,"rollback");
            throw error;
          }
          return snapshot();
        }
        default:
          throw Error("未知行动类型");
      }
    });
  }
  const api = {
    getSnapshot: snapshot,
    getActionDisplay(text) {
      const parsed = readActionCode(text);
      if (!parsed) return null;
      const pending = current?.pending;
      const label = pending?.actionCode === parsed.code ? pending.displayText
        : [...plugins.values()].map(p => p.getDisplayText?.(parsed.nodeId)).find(Boolean);
      return label ? String(text).replace(parsed.code, label) : null;
    },
    getDiagnostics() {
      const c = context(), s = snapshot(), latest = c.chat[c.floor];
      return { schema:1, host:adapter.getDiagnostics?.() || {},
        floor:c.floor, latestIsUser:!!latest?.is_user,
        identity:s?.identity || null, pending:s?.pending ? {
          nodeId:s.pending.nodeId, floor:s.pending.floor, actionText:s.pending.actionText,
        } : null, event:s?.activeEvent || null,
        lastNodeResult:s?.lastNodeResult || null,
        storyCount:s?.storyCount || 0,
        latestProcessed:s?.processed?.[c.floor] === C.hash(latest?.mes || ""),
      };
    },
    async getFloorSnapshot(floor) {
      const c = context();
      if (!Number.isInteger(floor) || floor < 0 || floor > c.floor) return null;
      const e = (await adapter.readMessage(floor))?.stat_data?.xsd2?.[0];
      if (token(c) !== token(context()) || !compatible(e, c)) return null;
      const s = C.clone(e.state.pending && floor < c.floor ? e.state.pending.before : e.state);
      normalize(s);
      return { ...s, chatId:c.chatId, branchId:c.branchId, floor,
        inventory:s.stat_data.inventory, known:s.stat_data.known, relics:s.stat_data.relic_progress };
    },
    getOpeningView() {
      const c = context(),
        first = String(c.chat[0]?.mes || "");
      const key = C.hash(
        c.chatId + "|" + first + "|" + (c.chat[0]?.swipe_id || 0),
      );
      if (first.includes("<IdentityMenu"))
        return { mode: "identity_menu", key };
      const stat = C.parseStatus(first).fields;
      if (
        (first.includes('<IdentityPick name="自设"') ||
          first.includes("【身份】自设") ||
          stat.身份?.includes("自设")) &&
        !C.parseDate(stat.时间)
      ) {
        return {
          mode: "custom_setup",
          key,
          name: first.match(/【身份】自设[·\s]+([^\r\n]+)/)?.[1]?.trim() || "",
        };
      }
      return { mode: "unavailable", key };
    },
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
    dispatchIntent,
    ready: () => lifecycle(load),
    restore: (options = {}) => lifecycle(async c=>{
      await load(c);
      if(options.afterDelete && current?.pending?.selection?.completionQuery){
        // Removing the result cancels the outstanding callback. Its user code
        // remains history, not an instruction for the next free-form turn.
        return commit(c,C.clone(current.pending.before),"rollback");
      }
      return snapshot();
    }),
    settleStory: () => lifecycle(story),
    stop: () => dispatchIntent({ type: "CANCEL_PENDING" }),
    registerPlugin(plugin) {
      if (
        !plugin?.id ||
        typeof plugin.select !== "function" ||
        typeof plugin.settle !== "function"
      )
        throw Error("插件缺少选择／结果接口");
      if (plugins.has(plugin.id)) throw Error("插件已注册");
      plugins.set(plugin.id, plugin);
      updatePrompt();
      notify("plugin_registered");
      return () => {
        plugins.delete(plugin.id);
        updatePrompt();
      };
    },
    replay: (generationType = "regenerate") =>
      lifecycle(async (c) => {
        if(!["regenerate","swipe"].includes(generationType)){
          await load(c,false);
          const p=current?.pending;
          const lastUser=c.chat.slice(p?.floor+1).reverse().find(m=>m.is_user&&!m.is_system);
          if(p && lastUser && (p.actionCode ? readActionCode(lastUser.mes)?.code!==p.actionCode : String(lastUser.mes).trim()!==p.actionText))
            await commit(c,C.clone(p.before),"rollback");
          updatePrompt();return snapshot();
        }
        // Explicit regeneration still restores the state before this reply.
        if(c.floor===0)return load(c,false);
        const m=c.chat[c.floor];
        const base = await history(c, m?.is_user ? c.floor : c.floor - 1);
        // Native opening swipes / older chats may have valid source identity
        // but no envelope yet. Read that source instead of erasing the identity.
        if (!base) return load(c, false);
        current = base.state;
        scopeChatId = c.chatId;
        updatePrompt();
        return snapshot();
      }),
    dispose() {
      disposed = true;
      subscribers.clear();
      plugins.clear();
      adapter.setPrompt?.("");
    },
  };
  return api;
}
module.exports = { createDispatcher };
