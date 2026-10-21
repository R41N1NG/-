// src/host/glue.js - 酒馆胶水（M4-1 拦截-结算-注入-放行管线）
// 主人定稿 2026-10-17：打字 → 中控转化 → 得到结果后发送放行 · 判定演出与生成同时进行（减少等待感）；
// 默认硬停（结算面板等人点「认」，只管面板收起，不挡生成）；插件设置可切「自动掷」（退回旧 generation_ended 全流程）；
// swipe 不重掷（种子纪律：同楼同输入同结果，LLM 只重写文字——注入不设 once，重生成仍受同一回执约束）。
// 环境探测三级降级（不同版本酒馆助手注入差异全兜住）：
//   变量 insertOrAssignVariables/getVariables（脚本全局函数）→ window.TavernHelper 同名 → 无则不启动
//   事件 eventOn+tavern_events → window.TavernHelper.eventOn → window.eventSource（酒馆原生总线）
// 纯浏览器（无酒馆）环境 startGlue() 返回 false 静默跳过，WxEngine 照常可手动用。
const { createGame } = require("../runtime/game.js");
const LP = require("../config/lifepack.json");
const R = require("../config/rules.json");

const VAR_SAVE = "wx_save";   // 引擎完整存档（save() 产物）
const VAR_SNAP = "wx_snap";   // 最新楼快照（状态栏直接吃）
const VAR_INIT = "wx_init";   // 可选：开局覆盖配置（player/target/stats/world/route/pack/targetId）
const VAR_CONF = "wx_conf";   // M4-1 管线设置（autoSettle 等）

const BAND_CN = { success: "成功", grace: "勉强", fail: "失败", nat1: "天然1", nat20: "大成功" };
const ACC_CN = { stamina: "体力", heart: "心跳", alert: "警觉", pi: "情报", proximity: "接近度", cash: "现金" };

/** 酒馆常把脚本跑在隐藏 iframe 里：变量 API、消息 API 与原生上下文往往只挂在父页面。
 *  这里沿 window → parent → … → top 逐层探测（跨源读不到就 try 吞掉）。
 *  不为任何一家分支特化——标准 SillyTavern 与各分支共用这一套顺序，换了酒馆也不用改代码。 */
function hostFrames() {
  const list = [];
  try {
    let w = (typeof window !== "undefined") ? window : null;
    while (w && list.length < 8 && !list.includes(w)) {
      list.push(w);
      let p = null;
      try { p = w.parent; } catch (e) { p = null; }
      if (!p || p === w) break;
      w = p;
    }
  } catch (e) { /* 跨源：到此为止 */ }
  // Node 单测 / 非浏览器环境里 globalThis 与 window 不是同一个对象，两者都要探
  if (typeof globalThis !== "undefined" && !list.includes(globalThis)) list.push(globalThis);
  return list;
}

/** 跨框架找酒馆助手命名空间（脚本在 iframe 里时它挂在父页面）。 */
function findTavernHelper() {
  for (const w of hostFrames()) {
    try {
      if (w && w.TavernHelper) return w.TavernHelper;
    } catch (e) {}
  }
  try { return (typeof TavernHelper !== "undefined") ? TavernHelper : null; } catch (e) { return null; }
}

function detectApi() {
  const frames = hostFrames();

  /** 逐层找函数：先看该框架自身的同名全局，再看它的 TavernHelper。 */
  const pick = (name) => {
    for (const w of frames) {
      try {
        if (w && typeof w[name] === "function") return w[name].bind(w);
      } catch (e) {}
      try {
        const th = w && w.TavernHelper;
        if (th && typeof th[name] === "function") return th[name].bind(th);
      } catch (e) {}
    }
    return null;
  };

  const holder = (() => {
    for (const w of frames) {
      try {
        if (w && typeof w.insertOrAssignVariables === "function" && typeof w.getVariables === "function") return w;
      } catch (e) {}
      try {
        const th = w && w.TavernHelper;
        if (th && typeof th.insertOrAssignVariables === "function" && typeof th.getVariables === "function") return th;
      } catch (e) {}
    }
    return null;
  })();

  const vars = {
    has: !!holder,
    read: async () => (holder ? ((await holder.getVariables({ type: "chat" })) || {}) : {}),
    assign: async (obj) => { if (holder) await holder.insertOrAssignVariables(obj, { type: "chat" }); },
  };
  const onEvent = (name, fn) => {
    for (const w of frames) {
      try {
        if (typeof w.eventOn === "function" && w.tavern_events && w.tavern_events[name]) {
          w.eventOn(w.tavern_events[name], fn); return true;
        }
      } catch (e) {}
      try {
        const th = w.TavernHelper;
        if (th && typeof th.eventOn === "function" && th.tavern_events && th.tavern_events[name]) {
          th.eventOn(th.tavern_events[name], fn); return true;
        }
      } catch (e) {}
      try {
        if (w.eventSource && typeof w.eventSource.on === "function") {
          w.eventSource.on(String(name).toLowerCase(), fn); return true;   // 酒馆原生总线：事件名小写
        }
      } catch (e) {}
    }
    return false;
  };

  const getChatMessages = pick("getChatMessages");
  let readLast = null;
  if (getChatMessages) {
    readLast = async () => {
      try {
        const list = await getChatMessages(-1);
        return Array.isArray(list) ? list[list.length - 1] : list;
      } catch (e) { return null; }
    };
  }
  /** M4-1 按楼号精读（message_sent 事件自带 message_id；盲读 -1 在真机上读到空——2026-10-17 实测踩坑）。 */
  const readById = async (id) => {
    if (!getChatMessages) return null;
    const last = (arr) => Array.isArray(arr) ? (arr[arr.length - 1] || null) : (arr || null);
    // ① 事件楼号直读
    if (Number.isInteger(id) && id >= 0) {
      try { const m = last(await getChatMessages(id)); if (m && (m.mes ?? m.content ?? m.message)) return m; } catch (e) {}
    }
    // ② 最新楼
    try { const m = last(await getChatMessages(-1)); if (m && (m.mes ?? m.content ?? m.message)) return m; } catch (e) {}
    // ③ 时序兜底：事件早于消息落库时，等一拍再读（提示词组装在 message_sent 之后，120ms 足够安全）
    await new Promise(r => setTimeout(r, 120));
    try { const m = last(await getChatMessages(-1)); if (m) return m; } catch (e) {}
    return null;
  };

  /* ── 回执注入的两条通道（都不特化某一家酒馆） ──
     ① 酒馆助手 TavernHelper.injectPrompts（JS-Slash-Runner 系；返回值可能是 Promise，必须 await，rejected 也要接住）
     ② 酒馆原生 SillyTavern.getContext().setExtensionPrompt(key, value, position, depth, scan, role)
        —— 标准酒馆与分支都认这套；position 1 = IN_CHAT，role 0 = SYSTEM，老版本多传参会被忽略
     ③ 都没有 → 返回 null，调用方打印告警（回执进不了模型，模型只能盲写）
     2026-10-19 复核：部分分支里 TavernHelper 有变量 API 却没有 injectPrompts，且脚本跑在 iframe 内、
     父页面才有 SillyTavern —— 所以两条通道都要跨框架找，助手通道还要等它的 Promise 落地。 */
  const findCtx = () => {
    for (const w of frames) {
      try {
        const st = w && w.SillyTavern;
        if (!st || typeof st.getContext !== "function") continue;
        const ctx = st.getContext();
        if (ctx && typeof ctx.setExtensionPrompt === "function") return ctx;
      } catch (e) {}
    }
    return null;
  };
  const POS_HELPER = { 0: "in_prompt", 1: "in_chat", 2: "none" };
  const ROLE_HELPER = { 0: "system", 1: "user", 2: "assistant" };

  /** 注入回执。成功返回 { mode: "tavernhelper"|"native", verified }；全通道不可用返回 null。
   *  verified：原生通道能回读 extension_prompts 时才给出 true/false；读不到容器则为 null（无法验，不算失败）。 */
  const injectPrompts = async (blocks) => {
    const arr = Array.isArray(blocks) ? blocks : [blocks];
    const helperInject = pick("injectPrompts");
    if (helperInject) {
      try {
        await helperInject(arr.map(b => ({
          id: b.id,
          position: POS_HELPER[b.position] || "in_chat",
          depth: Number.isFinite(b.depth) ? b.depth : 1,
          role: ROLE_HELPER[b.role] || "system",
          content: b.content,
        })));
        return { mode: "tavernhelper", verified: null };
      } catch (e) { /* 抛错或 rejected 都落到原生通道 */ }
    }
    const ctx = findCtx();
    if (!ctx) return null;
    let sent = 0;
    let verified = null;
    for (const b of arr) {
      const pos = Number.isFinite(b.position) ? b.position : 1;
      const depth = Number.isFinite(b.depth) ? b.depth : 1;
      const role = Number.isFinite(b.role) ? b.role : 0;
      try { ctx.setExtensionPrompt(b.id, b.content, pos, depth, false, role); sent++; } catch (e) { continue; }
      try {
        const bag = ctx.extension_prompts || ctx.extensionPrompts;
        if (bag && typeof bag === "object") {
          const slot = bag[b.id];
          const got = slot && (slot.value !== undefined ? slot.value : slot.content);
          if (got !== undefined) verified = (got === b.content);
        }
      } catch (e) {}
    }
    return sent ? { mode: "native", verified } : null;
  };
  const uninjectPrompts = (ids) => {
    const arr = Array.isArray(ids) ? ids : [ids];
    const helperUninject = pick("uninjectPrompts");
    if (helperUninject) {
      try { Promise.resolve(helperUninject(arr)).catch(() => {}); } catch (e) {}
    }
    const ctx = findCtx();
    if (ctx) {
      for (const id of arr) {
        try { ctx.setExtensionPrompt(id, "", 1, 1, false, 0); } catch (e) {}
      }
    }
  };

  return {
    vars, onEvent, readLast, readById,
    injectPrompts, uninjectPrompts,
    generate: pick("generate"),
    stopAllGeneration: pick("stopAllGeneration"),
  };
}

/** 从消息对象里取文本（玩家消息与 AI 消息同构）。
 *  酒馆助手 ChatMessage 的正文字段是 message（字符串）——先解包再判型，两种形状都吃：
 *  TavernHelper 形状 {message: "..."} ／ 原生形状 {mes: "..."} ／ 裸字符串。 */
function extractLlmText(msg) {
  if (!msg) return "";
  if (typeof msg === "string") return msg;
  const m = msg.message ?? msg;
  if (typeof m === "string") return m;
  return String((m && (m.mes ?? m.content ?? m.message)) ?? "");
}

function defaultInit(overrides = {}) {
  const targetId = (overrides && overrides.targetId) || "college";
  const targetPersona = (overrides && overrides.targetPersona) || null;
  const pack = LP.packs && LP.packs[targetId];
  const targetDef = (R.targets && R.targets.list && R.targets.list[targetId]) || (R.targets && R.targets.list && R.targets.list.student);

  let route = null;
  if (pack && pack.routes) {
    const evening = pack.routes.find(r => r.id === "college_evening" || r.id === "workday_evening") || pack.routes[0];
    if (evening) {
      const startT = (evening.path && evening.path[0] && evening.path[0].t)
        ? `${evening.path[0].t.slice(0, 2)}:${evening.path[0].t.slice(2)}`
        : "21:00";
      route = {
        id: evening.id,
        note: evening.note || "",
        prompt: evening.prompt || "",
        startTime: startT,
        nodes: evening.path.map(s => s.place),
        times: evening.path.map(s => s.t),
        known: evening.path.map(() => 1),
        here: 0
      };
    }
  } else {
    // 优雅回退：使用默认傍晚动线骨架
    const fallbackPack = LP.packs.student || LP.packs.college;
    const evening = fallbackPack.routes.find(r => r.id === "workday_evening") || fallbackPack.routes[0];
    route = evening ? {
      id: evening.id,
      note: evening.note || "",
      prompt: evening.prompt || "",
      startTime: "21:00",
      nodes: evening.path.map(s => s.place),
      times: evening.path.map(s => s.t),
      known: evening.path.map(() => 1),
      here: 0
    } : null;
  }

  let targetStats = pack ? { ...pack.stats, social: pack.social }
    : { ...(targetDef.stats || { str: 3, agi: 4, per: 5, nrv: 4 }), social: targetDef.social || 2 };
  if (targetPersona && targetPersona.finalStats) {
    targetStats = Object.assign(targetStats, targetPersona.finalStats);
  }

  let district = "B";
  if (targetId === "club") district = "C";
  else if (targetId === "wife") district = "D";

  return {
    targetId,
    targetPersona,
    player: { str: 3, agi: 5, nrv: 5, int: 5, cha: 2, staminaMax: 115 },
    target: targetStats,
    stats: { date: 1, heart: 30, stamina: 100, cash: 800, pi: 0 },
    world: { weather: "clear", district },
    route,
  };
}

/** M4-1 结果包 → 注入文本（LLM 的唯一物理真源与演职回执）。 */
function receiptText(r) {
  const lines = [`【第${r.floor}楼 · 中控结算回执（唯一数值真源）】`];
  const st = r.stats || (r.package && r.package.stats) || {};
  const pkg = r.package || {};

  // 1. 时空环境与站位模式
  const ts = pkg.targetState || st.targetState;
  const startT = (ts && ts.route && ts.route.startTime) || (st.route && st.route.startTime);
  let hh = 21;
  let mm = "15";
  if (startT && typeof startT === "string" && startT.includes(":")) {
    const parts = startT.split(":");
    const baseH = parseInt(parts[0], 10) || 21;
    const baseM = parseInt(parts[1], 10) || 0;
    const totalM = baseM + Math.max(0, (r.floor || 1) - 1) * 15;
    hh = baseH + Math.floor(totalM / 60);
    mm = (totalM % 60).toString().padStart(2, "0");
  } else {
    const timeMin = ((r.floor || 1) * 15) % 120;
    hh = 21 + Math.floor(timeMin / 60);
    mm = (timeMin % 60).toString().padStart(2, "0");
  }
  const timeStr = `周三 ${hh}:${mm}`;

  const weatherKey = (st.world && st.world.weather) || "clear";
  const weatherDesc = {
    clear: "秋末晴夜（干燥清冷，街灯通明）",
    rain: "秋末冷雨夜（地面湿滑，沥青反光，雨伞遮蔽视线）",
    storm: "秋末暴雨夜（狂风暴雨，积水漫溢，视线受限）",
    fog: "秋末夜雾（浓雾弥漫，能见度低，声响沉闷）"
  }[weatherKey] || "秋末冷雨夜（地面湿滑沥青反光）";

  const modeKey = st.mode || "stealth";
  const modeDesc = {
    stealth: "潜行跟缀（明暗隔离态，目标未察觉正面存在，不可当面对话）",
    contact: "接触攀谈（正面相对态，可展开言语交流）",
    lock: "门锁博弈（专注锁具物理交互）",
    endgame: "终局控制（身体对抗与束缚）"
  }[modeKey] || "潜行跟缀";

  const distKey = st.dist || "same";
  const distDesc = {
    far: "远端（约30米以上，仅能辨别身形轮廓，不可感知微表情）",
    same: "同街（约15-20米，必须依托沿街障碍遮蔽，严禁近身触碰）",
    street: "同街（约15-20米，必须依托沿街障碍遮蔽，严禁近身触碰）",
    close: "身后（约3-5米，脚步声与身形清晰，高危戒备区）",
    behind: "身后（约3-5米，脚步声与身形清晰，高危戒备区）",
    touch: "贴身（1米以内，可及肢体与呼吸声）"
  }[distKey] || "同街（约15-20米）";

  const sanc = st.sanctuaryAlert ? `｜逃逸向导：${st.sanctuaryAlert}` : "";

  /* 她本楼所在的地点：由引擎的时刻表推进（route.here → currentPlace），这里只是把它写成硬约束。
     模型只能在这个场所里展开画面，不得自行把她挪到别处、也不得提前抵达下一站。 */
  const placeName = (ts && ts.route && ts.route.currentPlace) || st.place || null;
  const placeStr = placeName ? `地点：[${placeName}]｜` : "";

  lines.push(`[时空与环境] 时间：${timeStr}｜${placeStr}环境：${weatherDesc}`);
  lines.push(`[站位与模式] 交互模式：${modeDesc}｜相对距离：${distDesc}${sanc}`);

  // 2. 动作裁决（去原始算式噪音，保留定性成败）
  if (pkg.narrativeOnly) {
    lines.push("本轮玩家未点选任何动作胶囊：纯叙事推进，不得凭空发生检定或体力/心跳/警觉变动。");
  } else if (pkg.actions && pkg.actions.length) {
    lines.push("[动作裁决]");
    for (const a of pkg.actions) {
      const actName = a.label || a.name;
      if (a.rejected) {
        // 条件门槛（缺工具 / 距离不够 / 不在门前）：动作没做成，正文不许写成成功
        lines.push(`- ${actName}：未执行（${a.reason || "当前条件不满足"}）`);
        continue;
      }
      if (a.noRoll) {
        lines.push(`- ${actName}：${a.text || "完成（无检定）"}`);
        continue;
      }
      const isFail = a.band === "fail" || a.band === "crit_fail";
      const bandStr = BAND_CN[a.band] || (isFail ? "未达成" : "达成");
      let detail = a.text || "";
      if (isFail && !detail) {
        if (actName.includes("潜行") || actName.includes("藏匿")) detail = "踩中积水或碎杂物引发细微动静，引起反光注意";
        else if (actName.includes("拍照") || actName.includes("打量") || actName.includes("观察")) detail = "视线被雨伞与行人物件遮挡，角度不佳";
        else if (actName.includes("锁") || actName.includes("撬")) detail = "锁芯锈死卡涩，发出金属碰撞脆响";
        else detail = "受限于现场环境突发干扰，动作受阻";
      }
      lines.push(`- ${actName}：${bandStr}${detail ? "（" + detail + "）" : ""}`);
    }
  }

  // 3. 叙事断点原则（失败时必发）
  if (pkg.alertEvent) {
    lines.push(`- 她的过档反应：${pkg.alertEvent.kind}（${pkg.alertEvent.detail}）`);
  }
  if (pkg.capture) {
    const cn = { front: "正面", side: "侧面", back: "背面", "three-quarter": "斜侧" };
    const al = pkg.stats && pkg.stats.album ? pkg.stats.album : null;
    lines.push(`- 拍照成果：${pkg.capture.name} · ${cn[pkg.capture.angle] || pkg.capture.angle}` +
      (al ? `（相册 ${al.count}/${al.total}）` : "") + `；PI +${pkg.capture.piBonus}`);
  }
  const fails = (pkg.actions || []).filter(a => a.band === "fail" || a.band === "crit_fail");
  if (fails.length) {
    const failNames = fails.map(a => a.label || a.name).join("、");
    lines.push(`【叙事断点原则】：玩家输入的内容仅为其“主观预想与动作尝试”。判定为未达成（${failNames} 失败/意外），玩家描写的成功预想未发生！请在正文承接尝试细节，随即描写突发意外阻碍与真实挫折后果。`);
  }

  // 4. 目标当前态势与行为焦点（白描约束）
  if (ts) {
    lines.push("【目标当前态势与行为焦点（白描约束）】");
    const defaultTargetName = (st.targetId === "college") ? "林若雪" : "陈雨婷";
    const targetName = (st.target && (st.target.realName || st.target.name)) || (ts.targetName || defaultTargetName);
    if (st.target) {
      lines.push(`- 目标人物：${targetName}`);
    }
    if (ts.route) {
      const curLoc = ts.route.currentPlace ? `[${ts.route.currentPlace}] ` : "";
      const noteStr = ts.route.note ? `[${ts.route.note}] ` : "";
      lines.push(`- 动线情境：${curLoc}${noteStr}${ts.route.prompt || ""}`.trim());
    }
    if (placeName) {
      lines.push(`- 当前位置：[${placeName}]（本楼她只在这里；严禁把她写到别的场所，也严禁提前抵达下一站——地点变更只认回执里的「目标动向推进」）`);
    }
    if (ts.outfit) {
      lines.push(`- 当前着装：[${ts.outfit.name}] ${ts.outfit.desc}。${ts.outfit.prompt || ""}`);
    }
    if (ts.somatic) {
      const modStr = Object.entries(ts.somatic.mod || {})
        .map(([k, v]) => `${k.toUpperCase()} ${v > 0 ? "+" : ""}${v}`).join(" ");
      lines.push(`- 情绪身心：[${ts.somatic.name}] ${ts.somatic.reason}${modStr ? `（${modStr}）` : ""}。${ts.somatic.prompt || ""}`);
    }
    if (ts.hand) {
      let handExtra = "";
      if (ts.hand.fumbling) {
        handExtra = " ⚠️【破绽暴露：低感知翻找态，注意力被手中事务占满，视线脱离周围环境，白描其专注找物、背身无备细节】";
      } else if (ts.hand.isCarriage) {
        handExtra = " 🚇【车厢情境：随车体晃荡而微摆，与外界声音封闭隔离】";
      }
      lines.push(`- 双手焦点：[${ts.hand.name}] ${ts.hand.desc}${handExtra}`);
    }
    const herAlert = pkg.herAlert || st.herAlert;
    if (herAlert) {
      lines.push(`- 警觉反应：${herAlert}`);
    }
  }

  // 5. 纪律底注与微观时间切片
  lines.push("纪律：单轮正文仅限当前场所约 1~2 分钟微观切片，描写完最新动静后即刻定格；本轮动作与数值已由中控封账，正文照此回执演绎，成败不得篡改；文末按规申报事实。");
  return lines.join("\n");
}

const TARGET_ENTRY_NAMES = {
  student: "【目标档案】晚自习女高中生",
  college: "【目标档案】独居女大学生",
  ol: "【目标档案】外企职场女性",
  club: "【目标档案】夜场陪酒女公关",
  wife: "【目标档案】独居全职少妇"
};

/** 跨框架找一个宿主函数（同名全局或 TavernHelper 命名空间）。 */
function hostFn(name) {
  for (const w of hostFrames()) {
    try { if (typeof w[name] === "function") return w[name].bind(w); } catch (e) {}
    try {
      const th = w && w.TavernHelper;
      if (th && typeof th[name] === "function") return th[name].bind(th);
    } catch (e) {}
  }
  return null;
}

/** 取角色卡本体数据（SillyTavern 上下文里的角色对象）。 */
function hostCharacterData() {
  for (const w of hostFrames()) {
    try {
      const st = w && w.SillyTavern;
      if (!st || typeof st.getContext !== "function") continue;
      const ctx = st.getContext();
      const ch = ctx && ctx.characters && ctx.characters[ctx.characterId ?? ctx.this_chid];
      if (ch && ch.data) return ch.data;
    } catch (e) {}
  }
  return null;
}

/**
 * 动态同步酒馆世界书目标条目常驻与互斥（仿仙姝堕 2.0 规范）：
 * 依据当前选定目标（默认 college 女大学生），把匹配的【目标档案】条目设为 enabled: true, constant: true，
 * 其余目标档案条目设为 enabled: false, constant: false，杜绝模型产生目标身份混淆。
 * 返回里带 attempts，便于在 wx_diag.wb 里回看是哪一步没成。
 */
async function syncTargetWorldbook(targetId = "college") {
  const attempts = [];
  const helper = findTavernHelper();
  if (!helper || typeof helper.getWorldbook !== "function" || typeof helper.replaceWorldbook !== "function") {
    return { skipped: true, reason: "无世界书 API", attempts };
  }
  try {
    /* ① 书名的三种来源都试一遍：角色绑定主书 → 角色扩展 world 字段 → 逐本扫描含【目标档案】的书。
       不同分支给的字段不一样，这里不挑食；全都不中才退回卡名。 */
    const names = [];
    if (typeof helper.getCharWorldbookNames === "function") {
      try {
        const bindings = await helper.getCharWorldbookNames("current");
        if (bindings && bindings.primary) names.push(bindings.primary);
        if (bindings && Array.isArray(bindings.additional)) names.push(...bindings.additional);
        if (Array.isArray(bindings)) names.push(...bindings);
      } catch (e) { attempts.push("getCharWorldbookNames 失败: " + (e && e.message)); }
    }
    try {
      const card = hostCharacterData();
      const fromCard = card && card.extensions && card.extensions.world;
      if (fromCard) names.push(fromCard);
    } catch (e) {}
    if (typeof helper.getWorldbookNames === "function") {
      try {
        const all = await helper.getWorldbookNames();
        if (Array.isArray(all)) names.push(...all);
      } catch (e) { attempts.push("getWorldbookNames 失败: " + (e && e.message)); }
    }
    names.push("尾行");

    let bookName = null, entries = null;
    for (const name of [...new Set(names.filter(Boolean))]) {
      try {
        const got = await helper.getWorldbook(name);
        attempts.push("读 " + name + " → " + (Array.isArray(got) ? got.length : 0) + " 条");
        if (Array.isArray(got) && got.some(e => /^【目标档案】/.test(e.name || e.comment || ""))) {
          bookName = name; entries = got; break;
        }
      } catch (e) { attempts.push("读 " + name + " 失败: " + (e && e.message)); }
    }
    if (!bookName) return { skipped: true, reason: "没找到带【目标档案】的世界书", attempts };

    const targetEntries = entries.filter(e => /^【目标档案】/.test(e.name || e.comment || ""));
    const activeName = TARGET_ENTRY_NAMES[targetId] || `【目标档案】${targetId}`;
    let changed = false;
    const updated = entries.map(e => {
      const label = e.name || e.comment || "";
      if (/^【目标档案】/.test(label)) {
        const shouldEnable = label === activeName;
        const shouldConstant = shouldEnable;
        if (e.enabled !== shouldEnable || e.constant !== shouldConstant) {
          changed = true;
          return {
            ...e,
            enabled: shouldEnable,
            constant: shouldConstant,
            disable: !shouldEnable
          };
        }
      }
      return e;
    });

    if (!changed) return { ok: true, name: bookName, targetId, activeName, unchanged: true, attempts };
    await helper.replaceWorldbook(bookName, updated, { render: "immediate" });
    console.log(`[M4][世界书] 目标条目同步成功：${activeName} (常驻)，其余禁用`);
    return { ok: true, name: bookName, targetId, activeName, attempts };
  } catch (err) {
    console.warn("[M4][世界书] 目标条目同步异常：", err && (err.message || err));
    return { ok: false, error: err && err.message, attempts };
  }
}

/** 开场白与目标的对应关系：默认目标用 first_mes，其余用 alternate_greetings 的下标。 */
const OPENING_SOURCE = { college: "first_mes", student: "alt:0" };

/**
 * 按目标切换开场白：把聊天里那条开场消息换成对应问候语。
 * 只在新局、且聊天里只有开场这一条时动作；宿主没有 setChatMessages 就跳过（不覆盖任何既有对话）。
 */
async function applyTargetOpening(targetId) {
  const spec = OPENING_SOURCE[targetId];
  if (!spec) return { skipped: true, reason: "该目标没有独立开场白" };
  const card = hostCharacterData();
  if (!card) return { skipped: true, reason: "拿不到角色卡数据" };
  const text = spec === "first_mes"
    ? card.first_mes
    : (card.alternate_greetings || [])[Number(spec.split(":")[1])];
  if (!text) return { skipped: true, reason: "卡里没有对应开场白" };

  const setMsgs = hostFn("setChatMessages");
  if (!setMsgs) return { skipped: true, reason: "宿主无 setChatMessages" };
  let count = null;
  for (const w of hostFrames()) {
    try {
      const st = w && w.SillyTavern;
      const ctx = st && typeof st.getContext === "function" ? st.getContext() : null;
      if (ctx && Array.isArray(ctx.chat)) { count = ctx.chat.length; break; }
    } catch (e) {}
  }
  if (count !== null && count > 1) return { skipped: true, reason: "聊天已有内容，不覆盖开场" };
  try {
    await setMsgs([{ message_id: 0, message: text }], { refresh: "affected" });
    return { ok: true, swapped: targetId };
  } catch (e) {
    return { ok: false, error: e && e.message };
  }
}

async function startGlue() {
  const api = detectApi();
  if (!api.vars.has) return { ok: false, reason: "无酒馆变量 API（非酒馆助手环境）" };

  // 卡名过滤：全局脚本挂在所有卡上，只在「尾行」卡才真正启动（壳的挂载也以 WxGlue 存在为前提）
  const g0 = typeof globalThis !== "undefined" ? globalThis : window;
  const nameHolder = (typeof g0.getCurrentCharacterName === "function" && g0)
    || (g0.TavernHelper && g0.TavernHelper.getCurrentCharacterName ? g0.TavernHelper : null);
  if (nameHolder) {
    try {
      const name = String(await nameHolder.getCurrentCharacterName() || "");
      if (name && !name.includes("尾行")) return { ok: false, reason: "非尾行卡（" + name + "）" };
    } catch (e) { /* 探测失败不拦截 */ }
  }

  const state = { game: null, conf: { autoSettle: false }, pending: null, raced: false, injectMode: null, injectVerified: null };
  {   // 设置先行：事件挂载前读一次 wx_conf，避免首个 MESSAGE_SENT 撞上默认值
    const v0 = await api.vars.read();
    if (v0[VAR_CONF]) Object.assign(state.conf, v0[VAR_CONF]);
  }

  async function rebuild() {
    const v = await api.vars.read();
    if (v[VAR_CONF]) Object.assign(state.conf, v[VAR_CONF]);
    const saved = v[VAR_SAVE];
    if (saved && saved.v === 1) {
      state.game = createGame({ saved });
    } else {
      const init = Object.assign(defaultInit(v[VAR_INIT]), v[VAR_INIT] || {});
      state.game = createGame(init);
    }
    const currentTargetId = (state.game && state.game._g && state.game._g.targetId) || (v[VAR_INIT] && v[VAR_INIT].targetId) || "college";
    syncTargetWorldbook(currentTargetId).then((res) => { state.wb = res; }).catch(() => {});
    return state.game;
  }

  async function persist() {
    const snap = state.game.snapshot();
    await api.vars.assign({
      [VAR_SNAP]: snap,
      [VAR_SAVE]: state.game.save(),
      wx_diag: {
        inject: state.injectMode || "unknown",
        verified: state.injectVerified ?? null,
        wb: state.wb ? { ok: !!state.wb.ok, skipped: !!state.wb.skipped, reason: state.wb.reason || state.wb.error || null, name: state.wb.name || null, active: state.wb.activeName || null } : null,
        opening: state.opening || null,
        floor: state.game.save().floor,
        at: Date.now()
      },
    });
    // 实时通道：酒馆助手的脚本跑在隐藏 iframe 里，快照递给父页面 → 壳转发给状态栏
    try {
      if (typeof window !== "undefined" && window.parent && window.parent !== window) {
        window.parent.postMessage({ wxSnap: snap }, "*");
      }
    } catch (e) { /* 消息失败不影响变量持久化 */ }
    return snap;
  }

  /** 主闭环（自动掷模式 / 手动喂 / GM / 测试）：LLM 整楼输出 → 结算 → 写变量。 */
  async function handleFloor(llmText) {
    if (!state.game) await rebuild();
    const result = state.game.processFloor(String(llmText || ""));
    result.stats = await persist();
    return result;
  }

  /** 零楼开局（v0.8 状态栏开局面板调用）：写 wx_init、清 wx_save、重建引擎并产出首快照。 */
  async function newGame(init) {
    await api.vars.assign({ [VAR_INIT]: init, [VAR_SAVE]: null });
    state.game = null;
    await rebuild();
    if (init && init.targetId) {
      try { state.wb = await syncTargetWorldbook(init.targetId); } catch (e) { state.wb = { ok: false, error: e && e.message }; }
      try { state.opening = await applyTargetOpening(init.targetId); } catch (e) { state.opening = { ok: false, error: e && e.message }; }
    }
    return persist();
  }

  /** 重开新局（v0.8）：清档回到未开局态，状态栏会重新弹出零楼面板。 */
  async function resetGame() {
    await api.vars.assign({ [VAR_INIT]: null, [VAR_SAVE]: null });
    state.game = null;
    syncTargetWorldbook("college").catch(() => {});
  }

  /** M4-1 设置（状态栏面板开关调用）：autoSettle 等，写 wx_conf 持久。 */
  async function setConf(patch) {
    Object.assign(state.conf, patch || {});
    await api.vars.assign({ [VAR_CONF]: state.conf });
    return state.conf;
  }

  /** 演出通知：结算包递给状态栏（与 LLM 生成同时——面板等人认，不挡生成）。
   *  直调成功后立即退出，杜绝 postMessage 消息重复派发导致结算面板双重弹起与筹码倍增。 */
  function notifySettlePanel(r) {
    let shown = false;
    try {
      const top = (typeof window !== "undefined" && window.parent && window.parent !== window) ? window.parent : null;
      if (top && top.WxStatusbar && typeof top.WxStatusbar.settle === "function") {
        top.WxStatusbar.settle(r.package);
        shown = true;
        return;
      }
      if (top) top.postMessage({ wxSettle: r.package }, "*");
    } catch (e) { console.warn("[M4] 面板直调失败：", e && e.message); }
    console.log("[M4] 面板通知已发", shown ? "（直调✓）" : "（仅消息通道）");
  }

  /** M4-1 玩家消息拦截：同步结算 → 注入回执 → 放行（生成照常，演出同时）。 */
  async function onUserSent(messageId) {
    try {
      console.log("[M4] MESSAGE_SENT 收到", messageId !== undefined ? ("楼" + messageId) : "");
      if (state.conf.autoSettle) { console.log("[M4] 自动掷模式，跳过拦截"); return; }
      const msg = await api.readById(messageId);
      const text = extractLlmText(msg);
      if (!text || text.startsWith("/")) { console.log("[M4] 空输入/斜杠命令，放行不结算"); return; }
      state.pending = { text };
      if (!state.game) await rebuild();
      const topWin = (typeof window !== "undefined" && window.parent && window.parent !== window)
        ? window.parent
        : ((typeof window !== "undefined") ? window : (typeof globalThis !== "undefined" ? globalThis : null));
      let pickedActions = null;
      if (topWin && topWin.WxStatusbar && typeof topWin.WxStatusbar.consumeActiveActions === "function") {
        try { pickedActions = topWin.WxStatusbar.consumeActiveActions(); } catch (e) {}
      }
      const actSummary = (pickedActions && pickedActions.length)
        ? pickedActions.map(a => `${a.id}(${a.name || a.id})`).join(", ")
        : "未选胶囊（纯叙事）";
      console.log(`[M4] 动作输入：[${actSummary}] ｜ 伴随叙事：${String(text).slice(0, 30)}`);
      // 主人定：手打绝对无效，只认胶囊。没点胶囊就传空队列，文本不参与任何动作归一。
      const r = state.game.settleInput(text, { actions: pickedActions || [] });
      state.pending = null;
      console.log(`[M4] 结算完成：楼${r.floor} · 动作${r.package.actions.length}个${r.package.narrativeOnly ? "（纯叙事）" : ""}`);
      let injectRes = null;
      if (api.injectPrompts) {
        try { api.uninjectPrompts(["wx_receipt"]); } catch (e) {}
        // 位置/深度可由 wx_conf 覆盖（某些分支对 IN_CHAT 的处理不同：模型看不见回执时试 0/2 或 depth 0，不必改卡）
        const pos = Number.isInteger(state.conf.injectPos) ? state.conf.injectPos : 1;
        const depth = Number.isInteger(state.conf.injectDepth) ? state.conf.injectDepth : 1;
        injectRes = await api.injectPrompts([{
          id: "wx_receipt", position: pos, depth, role: 0,
          content: receiptText(r),
        }]);
      }
      state.injectMode = injectRes ? injectRes.mode : "none";
      state.injectVerified = injectRes ? injectRes.verified : null;
      if (injectRes) {
        console.log(`[M4] 回执已注入 ✓（通道：${injectRes.mode}）`
          + (injectRes.verified === null ? "" : injectRes.verified ? "，回读校验通过" : "，回读校验不符"));
      } else {
        console.warn("[M4] 回执注入失败：TavernHelper.injectPrompts 与 SillyTavern.setExtensionPrompt 都不可用——模型将看不到中控真值");
      }
      await persist();
      notifySettlePanel(r);
      console.log("[M4] 面板通知已发 ✓");
      if (state.raced && api.stopAllGeneration && api.generate) {   // 竞速兜底：生成抢跑则停了重发
        state.raced = false;
        try { api.stopAllGeneration(); } catch (e) {}
        try { api.generate({}); } catch (e) {}
      }
    } catch (e) {
      console.warn("[M4] 拦截结算失败：", e && (e.stack || e.message || e));
      state.pending = null;
    }
  }

  /** M4-1 回执相：LLM 写完 → 只处理事实/谎言/模式（零账目，swipe 重跑安全）。 */
  async function onReplyEnded() {
    try {
      const v = await api.vars.read();
      if (v[VAR_CONF]) Object.assign(state.conf, v[VAR_CONF]);
      const msg = api.readLast ? await api.readLast() : null;
      const text = extractLlmText(msg);
      if (state.conf.autoSettle) {
        if (text) await handleFloor(text);
        return;
      }
      if (!state.game) { await rebuild(); return; }
      if (text) { state.game.processReply(text); await persist(); }
    } catch (e) { /* 单楼回执失败不锁流程 */ }
  }

  api.onEvent("MESSAGE_SENT", (messageId) => onUserSent(messageId));
  api.onEvent("GENERATION_STARTED", () => { if (state.pending) state.raced = true; });
  api.onEvent("GENERATION_ENDED", onReplyEnded);
  api.onEvent("MESSAGE_SWIPED", () => { /* swipe：不重掷（种子纪律）——GENERATION_ENDED 带新正文重走回执相 */ });

  if (typeof globalThis !== "undefined" && !globalThis.WxGlue) {
    globalThis.WxGlue = { handleFloor, rebuild, persist, newGame, resetGame, setConf,
                          syncTargetWorldbook,
                          onUserSent, onReplyEnded, get game() { return state.game; },
                          get conf() { return state.conf; } };
  }
  return { ok: true, hasEvent: true, hasReadLast: !!api.readLast };
}

module.exports = { startGlue, syncTargetWorldbook, applyTargetOpening, receiptText, VAR_SAVE, VAR_SNAP, VAR_INIT, VAR_CONF };
