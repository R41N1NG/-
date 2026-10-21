/**
 * 尾行 · 中控 dispatcher：全游戏唯一的掷骰手与记账员。
 *
 * 每楼流程：
 *   玩家输入 → LLM 申报(parse) → 动作队列逐项结算(标签栈汇总→种子骰→checks)
 *   → 票据结算 → 模式切换 → ledger 单笔事务 → 快照 → 回执(LLM 照此写正文)
 *
 * 铁律：本模块是唯一调用 dice/tags/ledger 的地方；LLM 的任何输出只进 parse。
 */
const { loadLexicon, normalize: D_norm } = require("./lexicon.js");
const { parseFloor, verifyEvidence } = require("./parse.js");
const T = require("./tags.js");
const C = require("./checks.js");
const D = require("./dice.js");
const { createLedger } = require("./ledger.js");
const facts = require("./facts.js");
const map = require("./map.js");
const R = require("../config/rules.json");
const LP = require("../config/lifepack.json");
const TS = require("./target_state.js");
const ALBUM = require("./album.js");

const DIST_KEY = { far: "far", same: "same", close: "close", touch: "touch" };
const DIST_CN = { far: "远端", same: "同街", close: "身后", touch: "贴身" };
const DIST_RANK = { far: 0, same: 1, close: 2, touch: 3 };
const DIST_DOWN = { touch: "close", close: "same", same: "far", far: "far" };
const CA_CN = { front: "正面", side: "侧面", back: "背面", "three-quarter": "斜侧" };
/* 每晚天气掷（二十六节锚：晴夜 70% / 小雨 20% / 暴雨 10%，1d20 区间映射） */
const WEATHER_BANDS = { clear: [1, 14], rain: [15, 18], storm: [19, 20] };
const WEATHER_ICON = { clear: "🌙 晴夜", rain: "🌧 小雨", storm: "⛈ 暴雨" };
const HUNTER_MODES = ["stealth", "contact", "vehicle"];
/* 跟缀族词族（v0.8 刺激接线）：持续暴露类动作，刺激按段一泵、距离定档 */
const TAIL_PUMP_IDS = ["follow", "ride_along", "transfer", "follow_work", "ride_follow", "car_follow"];
const SHOE_ID_MAP = {
  shoe_heel: "heel",
  shoe_flats: "flats",
  shoe_sneakers: "sneakers",
  shoe_barefoot: "barefoot",
  shoe_slippers: "slippers",
  shoe_boots: "boots",
  shoe_platform: "platform",
  shoe_sandals: "sandals",
  shoe_leather: "leather"
};

/* 步声距离系数：越近越响（主人定稿）。声级 = round(步声基准 × 系数)，钳在 0~5 */
const SHOE_DIST_FACTOR = { far: 0.6, same: 1.0, close: 1.25, touch: 1.5 };

function createGame(init = {}) {
  const lex = loadLexicon();
  let salt = init.sessionSalt || D.newSessionSalt();

  const g = {
    sessionSalt: salt,
    player: init.player || { str: 4, agi: 5, nrv: 5, int: 5, cha: 5, staminaMax: 120 },
    target: init.target || { str: 3, agi: 4, per: 5, nrv: 4, social: 2 },
    targetId: init.targetId || (init.saved && init.saved.targetId) || "college",
    targetPersona: init.targetPersona || (init.saved && init.saved.targetPersona) || null,
    targetState: init.targetState || (init.saved && init.saved.targetState) || null,
    mode: init.mode || "stealth",
    dist: init.dist || "same",
    env: init.env || "night",
    slot: init.slot || "e21_23",
    tickets: init.tickets || [],        // 本楼事件票据 [{no, kind, guide}]
    ticketsIssued: init.ticketsIssued || 1,
    world: init.world || { weather: "clear", district: "B" },  // 每晚天气与她所在大区（真源在脚本）
    route: init.route || null,          // 她的当晚动线 {nodes:[placeId], known:[0|1], here:int}
    dateCount: init.dateCount || (init.saved && init.saved.dateCount) || 0,
    hotelVisitedCount: init.hotelVisitedCount || (init.saved && init.saved.hotelVisitedCount) || 0,
    lastHotelDate: init.lastHotelDate ?? (init.saved && init.saved.lastHotelDate) ?? null,
    famSegs: init.famSegs || { A: 0, B: 0, C: 0, D: 0 },        // 分区熟悉度段数（10 段熟区）
    proxLogs: init.proxLogs || [],
    signals: init.signals || [],
    lastAssess: init.lastAssess || null,
    lastHerAlert: init.lastHerAlert || null,
    lastLedgerSummary: init.lastLedgerSummary || null,
    consecFails: 0,
    logs: [],
    /* 过档行为（她的警觉每跨一档做一件事，一晚一档只响一次） */
    alertLatch: init.alertLatch || [],
    alertEvent: init.alertEvent || null,
    alertHold: init.alertHold || 0,
    fleeing: !!init.fleeing,
    /* 相册：键＝itemId|角度；值是这张照片的元信息 */
    album: init.album || {},
    setBonusDone: init.setBonusDone || {},
    capture: null,
  };
  // 开局掷发型与体型（只影响图鉴取图，不进数值）
  if (g.targetPersona) {
    if (!g.targetPersona.hair) {
      const i = D.rollD20(D.actionSeed(salt, 0, "hair")).d20 % ALBUM.WARDROBE.variants.hair.length;
      g.targetPersona.hair = ALBUM.WARDROBE.variants.hair[i];
    }
    if (!g.targetPersona.body) {
      const i = D.rollD20(D.actionSeed(salt, 0, "body")).d20 % ALBUM.WARDROBE.variants.body.length;
      g.targetPersona.body = ALBUM.WARDROBE.variants.body[i];
    }
  }
  if (g.targetPersona && !g.targetPersona.assignedFacts) {
    const pack = (LP.packs && LP.packs[g.targetId]) || LP.packs.college || LP.packs.student;
    TS.resolveTargetFacts(pack, g.targetPersona, D.actionSeed(salt, 0, "facts"));
  }
  if (g.targetPersona && g.targetPersona.finalStats) {
    g.target = Object.assign({}, g.target, g.targetPersona.finalStats);
  }
  g.targetBase = { ...g.target };

  function applyTargetState() {
    if (!g.targetState) return;
    g.target = { ...g.targetBase };
    if (g.targetState.somatic && g.targetState.somatic.mod) {
      for (const [k, v] of Object.entries(g.targetState.somatic.mod)) {
        if (g.target[k] !== undefined) {
          g.target[k] = Math.max(1, g.target[k] + v);
        }
      }
    }
    TS.syncTargetStateTags(g.tags || (g.tags = []), g.targetState);
    const isWeekend = g.targetState.outfit && g.targetState.outfit.isWeekend;
    const isCollege = g.targetId === "college";
    const outfitShoe = ((isWeekend || isCollege) && g.targetState.outfit && g.targetState.outfit.shoeId)
      || (g.targetPersona && g.targetPersona.shoeId)
      || (g.targetState.outfit && g.targetState.outfit.shoeId);
    if (outfitShoe && R.tags && R.tags[outfitShoe]) {
      const stack = g.tags || (g.tags = []);
      const oldShoe = stack.find(t => t.owner === "target" && t.id && t.id.startsWith("shoe_"));
      if (oldShoe && oldShoe.id !== outfitShoe) {
        T.remove(stack, oldShoe.id);
        const def = R.tags[outfitShoe];
        T.apply(stack, {
          id: def.id,
          name: def.name,
          owner: "target",
          type: "equipment",
          category: "equipment",
          effects: [],
          duration: { type: "flag" }
        });
      }
    }
    /* 鞋具属性修正：在 targetBase + 身心扰动之上再叠一层（鞋影响她的步态与追逐发挥）
       高跟鞋/松糕鞋/拖鞋 −1，运动鞋 +1；钳制在 1~10，和属性规则一致。
       注意：取【当前实际挂着的鞋标签】，不用 outfitShoe 反推——否则手挂的鞋会被穿搭覆盖 */
    applyShoeMod(g.target);
  }

  /** 当前实际穿戴的鞋具标签定义（没有就返回 null） */
  function activeShoeDef() {
    const tag = (g.tags || []).find(t => t.owner === "target" && t.id && t.id.startsWith("shoe_"));
    return tag && R.tags ? R.tags[tag.id] || null : null;
  }

  /** 把鞋具的属性修正叠到一个 stats 对象上（纯计算，不改全局） */
  function applyShoeMod(stats) {
    const def = activeShoeDef();
    if (!def || !def.mod || !stats) return stats;
    for (const [k, v] of Object.entries(def.mod)) {
      if (stats[k] !== undefined) stats[k] = Math.max(1, Math.min(10, stats[k] + v));
    }
    return stats;
  }

  function initTargetState(dateOverride) {
    const pack = (LP.packs && LP.packs[g.targetId]) || LP.packs.college || LP.packs.student;
    const d = dateOverride ?? (L.get("date") || 1);
    const dayOfWeek = (((d || 1) - 1) % 7) + 1;
    const isLimping = TS.isLimpingDate(d, g.lastHotelDate);
    if (dayOfWeek === 6 && (pack.id === "student" || pack.id === "college") && !g.route) {
      const routine = g.targetPersona?.saturdayRoutine || (g.targetPersona ? (g.targetPersona.saturdayRoutine = TS.resolveSaturdayRoutine(pack, g.targetPersona, D.actionSeed(salt, 0, "saturday_routine"))) : "cram");
      const personalityId = g.targetPersona?.personality?.id || g.targetPersona?.personality || "timid";
      const routeDef = TS.resolveSaturdayRoute(pack, routine, g.dateCount || 0, personalityId, D.actionSeed(salt, d, "saturday_route_branch"), { hotelVisitedCount: g.hotelVisitedCount || 0 });
      if (routeDef) {
        const startT = (routeDef.path && routeDef.path[0] && routeDef.path[0].t)
          ? `${routeDef.path[0].t.slice(0, 2)}:${routeDef.path[0].t.slice(2)}`
          : "21:00";
        g.route = { id: routeDef.id, note: routeDef.note, prompt: routeDef.prompt, startTime: startT,
                    nodes: routeDef.path.map(p => p.place), times: routeDef.path.map(p => p.t),
                    here: 0, known: routeDef.known || routeDef.path.map(() => 1) };
      }
    } else if (dayOfWeek === 7 && (pack.id === "student" || pack.id === "college") && !g.route) {
      const sundayRoute = (pack.routes || []).find(r => r.id === "sunday_rest") || {
        id: "sunday_rest",
        note: "周日全天居家休整（不出门）",
        prompt: "白描少女周日全天在寓所内安静休整，窗帘拉起，未曾外出，街道上无其足迹",
        path: [{ place: "unit_stairs_b", t: "2000" }]
      };
      g.route = {
        id: sundayRoute.id,
        note: sundayRoute.note,
        prompt: sundayRoute.prompt,
        startTime: "20:00",
        nodes: sundayRoute.path.map(p => p.place),
        times: sundayRoute.path.map(p => p.t),
        here: 0,
        known: [1]
      };
      g.tailing = false;
    }
    const outfit = TS.sampleOutfit(pack, d, D.actionSeed(salt, d, "outfit"), g.targetPersona || g.target);
    const somatic = TS.sampleSomatic(pack, D.actionSeed(salt, d, "somatic"), { isLimping });
    const curPlaceId = (g.route && g.route.here >= 0) ? g.route.nodes[g.route.here] : ((g.route && g.route.nodes) ? g.route.nodes[0] : null);
    const curPlaceName = curPlaceId ? (map.getPlace(curPlaceId)?.name || curPlaceId) : null;
    const hand = TS.resolveHand(pack, curPlaceId, null, D.actionSeed(salt, g.floor || 0, "hand"));
    g.targetState = {
      outfit,
      somatic,
      hand,
      route: g.route ? {
        id: g.route.id,
        note: g.route.note,
        prompt: g.route.prompt,
        startTime: g.route.startTime,
        here: g.route.here || 0,
        nodes: g.route.nodes,
        currentPlace: curPlaceName
      } : null
    };
    applyTargetState();
  }

  g.player.inventory = Array.isArray(init.inventory) ? init.inventory
    : (Array.isArray(g.player.inventory) ? g.player.inventory : []);
  g.nightDrinkUsed = !!init.nightDrinkUsed;
  const L = (g.ledger = createLedger({ ...init.stats, nrv: g.player.nrv }));
  applyIdentity(init.identity, { targetGym: init.targetGym, packId: init.packId });   // v0.8 开局身份制：修正与常驻标签先落账，再对表优势
  syncThresholdTags();   // 开局即对表：极端出身属性达标直接挂优势
  syncEquippedTags();    // 开局装备标签同步
  syncTargetShoeTags();  // 目标鞋具标签同步
  syncPersonaTags();     // 目标性格与爱好破绽标签同步
  if (!g.targetState) initTargetState();
  else applyTargetState();

  /* ---------- 存档往返（十四节快照回退的地基；宿主每楼把 save() 落进酒馆变量，事件后从 saved 无损重建） ---------- */
  if (init.saved) {
    const s = init.saved;
    if (s.sessionSalt !== undefined) salt = s.sessionSalt;   // 闭包盐必须恢复，种子流才续得上
    for (const k of ["player", "target", "targetId", "targetPersona", "targetState", "mode", "dist", "env", "slot",
                     "world", "route", "famSegs", "tags", "floor", "consecFails",
                     "tickets", "ticketsIssued", "identity", "startKit",
                     "proxLogs", "signals", "lastAssess", "lastHerAlert", "lastLedgerSummary",
                     "nightDrinkUsed", "dateCount", "hotelVisitedCount", "lastHotelDate",
                     "alertLatch", "alertEvent", "alertHold", "fleeing",
                     "album", "setBonusDone", "captureSeq"]) {
      if (s[k] !== undefined) g[k] = s[k];
    }
    if (s.targetBase !== undefined) g.targetBase = { ...s.targetBase };
    if (s.inventory !== undefined) g.player.inventory = JSON.parse(JSON.stringify(s.inventory));
    if (s.tailing !== undefined) g.tailing = s.tailing;
    if (s.nightPiGross) g.nightPiGross = s.nightPiGross;
    g.sessionSalt = salt;
    Object.assign(L.state, s.ledgerState || {});
    g.logs = [];
    syncThresholdTags();
    syncEquippedTags();
    syncTargetShoeTags();
    syncPersonaTags();
    applyTargetState();
  }


  /* 老存档兼容：早前 route 只存了 nodes、没存发车时刻，按包内同名动线把 times 补回来。
     规则：只补不覆盖；包内找不到同名动线就保持原样（手搓/GM 动线由调用方自己给 times）。 */
  (function backfillRouteTimes() {
    const r = g.route;
    if (!r || !Array.isArray(r.nodes)) return;
    if (Array.isArray(r.times) && r.times.length === r.nodes.length) return;
    const pack = (LP.packs && LP.packs[g.targetId]) || LP.packs.college || LP.packs.student;
    const def = (pack.routes || []).find(x => x.id === r.id);
    if (!def || !Array.isArray(def.path) || def.path.length !== r.nodes.length) return;
    r.times = def.path.map(p => p.t);
    if (!r.startTime && def.path[0] && def.path[0].t) {
      r.startTime = `${def.path[0].t.slice(0, 2)}:${def.path[0].t.slice(2)}`;
    }
    applyTargetState();
  })();

  /* ---------- 工具 ---------- */
  function log(line) { g.logs.push(line); }
  function seedFor(seq) { return D.actionSeed(salt, g.floor || 0, seq); }
  function isFamiliar() { return L.get("proximity") >= 20 && L.get("proximity") < 40; }
  function distFactor() { return R.alert.distFactor[g.dist] ?? 1; }

  /** 有效敏锐暗修正计算（敏锐特质标签在栈内动态叠加，数值受 1~10 秤约束）。 */
  function targetEffectiveAcuity() {
    const acuityMod = T.summarize(g.tags || [], "acuity").sum;
    return Math.max(1, Math.min(10, (g.target.per || 4) + acuityMod));
  }

  /** 心跳与警觉进账的统一入口（结算用）。 */
  function gain({ threat = null, dist = g.dist, stim = 0 }) {
    const alertD = threat
      ? C.alertDelta({ threat, dist, env: g.env, acuity: targetEffectiveAcuity(), familiar: isFamiliar() })
      : 0;
    const heartD = stim ? C.heartDelta({ stim, nrv: g.player.nrv }) : 0;
    return { alertD, heartD };
  }

  /* ---------- 核心检定 ---------- */
  function runCheck(entry, args, seq) {
    const cat = categoryOf(entry.id);
    const sum = T.summarize(g.tags || (g.tags = []), cat);
    const mods = sum.breakdown.filter(h => h.owner !== "target")
      .map(h => ({ src: h.src, v: h.v }));
    const targetMod = sum.breakdown.filter(h => h.owner === "target")
      .reduce((s, h) => s + h.v, 0);
    const pity = T.PITY_BONUS && g.consecFails >= 2 ? C.pityBonus(g.consecFails) : 0;
    if (pity) mods.push({ src: "连败保底", v: pity });

    const dc = (R.checks[entry.check] ?? 10) - targetMod;   // 她的暗账降 DC 表现为负修正
    // 优势双骰：属性阈值标签自动驱动（效果只认标签；冲突对抗 2d10 不走此处，天然不吃）
    const advTagged = (g.tags || []).some(t => t.id === "adv_" + attrKeyOf(entry.id));
    const mode = ((args && args.adv) || advTagged) ? "adv" : (args && args.dis) ? "dis" : "normal";
    const roll = D.rollD20(seedFor(seq), mode);
    // v0.6：勉强档仅尾随系词条适用（她在场、动作泡在她感官里）
    const res = C.d20Check({ d20: roll.d20, attr: attrOf(entry.id), mods, dc,
                             stealth: (R.check.graceIds || []).includes(entry.id) });

    const attrKey = attrKeyOf(entry.id);
    const ATTR_NAMES = { agi: "敏捷", str: "体格", int: "情报", cha: "口才", nrv: "胆量" };
    const attr = { name: ATTR_NAMES[attrKey] || "属性", v: attrOf(entry.id) };
    const targetTags = sum.breakdown.filter(h => h.owner === "target");
    const darkReveal = targetTags.length
      ? targetTags.map(h => `${h.src} (${h.v >= 0 ? "+" : ""}${h.v})`).join("、")
      : null;

    return { roll, res, mods, dc, sum, attr, targetMod, darkReveal };
  }

  function attrKeyOf(id) {
    // 尾随系/暴力系走敏捷或体格，观察系走情报，互动系走口才（返回属性键名，供优势标签匹配）
    const agility = ["follow", "approach", "withdraw", "hide", "wall", "enter_tail", "stop", "wait",
      "cross", "cover", "fake_phone", "fake_call", "shop_enter", "window_watch", "cafe_sit",
      "ride_along", "transfer", "follow_work", "ride_follow", "car_follow", "climb"];
    const brawn = ["barrier", "pry", "drag", "pin", "lockpick", "break_in"];
    const intel = ["photo", "scan", "deduce", "timing", "listen", "perch", "note", "record",
      "plate", "trash", "pick", "listen_home", "locate", "watch_lights", "check_mailbox",
      "watch_visitor", "check_camera", "check_door", "stair_lurk", "door_listen", "door_peep",
      "try_handle", "ransack", "plant_bug", "cover_tracks", "plan_exit", "wait_gate",
      "watch_peers", "check_desk", "hear_gossip", "stalk_social", "monitor_social",
      "check_parcel", "get_number", "stakeout"];
    const charm = ["greet", "chat", "ease", "misdirection", "respond_her", "answer_guard", "fake_visit",
      "audit_class", "lobby_lurk", "apply_job", "pump_person", "bribe"];
    if (brawn.includes(id)) return "str";
    if (charm.includes(id)) return "cha";
    if (intel.includes(id)) return "int";
    return "agi";
  }

  function attrOf(id) {
    return g.player[attrKeyOf(id)];
  }

  function categoryOf(id) {
    const fine = ["photo", "record", "pick", "ransack", "lockpick", "plant_bug", "cover_tracks"];
    const conflict = ["strike", "pin", "drag"];
    // 社交类（主人定稿立户，±5 封顶）：口才词条全划入——此前掉默认 stealth 是未立户的遗留错位
    const social = ["greet", "chat", "ease", "misdirection", "respond_her", "answer_guard", "fake_visit",
      "audit_class", "lobby_lurk", "apply_job", "pump_person", "bribe"];
    if (fine.includes(id)) return "fine";
    if (conflict.includes(id)) return "conflict";
    if (social.includes(id)) return "social";
    return "stealth";
  }

  /** 当前场所类型：door（门前/楼道/玄关）｜room（室内）｜空串（街道等无门无室） */
  function currentPlaceKind() {
    const id = (g.route && Array.isArray(g.route.nodes) && g.route.here >= 0)
      ? String(g.route.nodes[g.route.here] || "") : "";
    if (!id) return "";
    if (/unit|stairs|gate|door|porch|lobby|entrance/.test(id)) return "door";
    if (/residence|room|home|flat|apartment|villa/.test(id)) return "room";
    const name = String((map.getPlace(id) || {}).name || "");
    if (/楼道|单元|门|玄关|电梯|台阶|入口/.test(name)) return "door";
    if (/客厅|卧室|房间|室内|屋内|玄关内/.test(name)) return "room";
    return "";
  }

  /* ---------- 相册：拍照产出一张「未拥有」的特写 ---------- */
  function placeNameNow() {
    if (!g.route || !Array.isArray(g.route.nodes)) return "";
    const id = g.route.nodes[g.route.here];
    return (id && (map.getPlace(id) || {}).name) || "";
  }

  /** 从「未拥有 × 距离合法」里抽一张；抽不到返回 null。 */
  function capturePhoto(dist) {
    const persona = g.targetPersona || {};
    const owned = Object.keys(g.album || {});
    const cands = ALBUM.captureList(persona, owned, dist);
    if (!cands.length) return null;
    g.captureSeq = (g.captureSeq || 0) + 1;
    const pick = cands[D.rollD20(D.actionSeed(salt, g.floor || 1, "capture_" + g.captureSeq)).d20 % cands.length];
    const meta = {
      file: pick.file, name: pick.item.name, slot: pick.item.slot,
      angle: pick.angle, t: g.floor || 1, place: placeNameNow(), dist,
    };
    g.album[pick.key] = meta;
    let piBonus = 0;
    if (dist === "touch" && pick.angle === "front") piBonus += 1;
    const sb = ALBUM.setBonus(g.album, g.setBonusDone);
    piBonus += sb.pi;
    g.lastCapture = { key: pick.key, ...meta, piBonus, outfits: sb.outfits };
    g.capture = g.lastCapture;
    g.signals = g.signals || [];
    g.signals.push(["照片", `拍到 ${pick.item.name}（${CA_CN[pick.angle] || pick.angle}）`]);
    if (g.signals.length > 20) g.signals.shift();
    return g.lastCapture;
  }

  /* ---------- 单动作结算 ---------- */
  function settleAction(tag, seq) {
    const entry = lex.byId.get(tag.id);
    if (!entry) return null;
    const out = { type: "action", id: tag.id, name: tag.name, label: tag.label || tag.name };

    // 模式门槛：词条声明的 modes 不含当前模式 → 拒绝
    if (!(entry.modes || []).includes(g.mode) && !(entry.modes || []).includes("any")) {
      out.rejected = true; out.reason = `动作 [${tag.name}] 需要模式：${(entry.modes || []).join("/")}`;
      return out;
    }

    /* 条件门槛（2026-10-19 主人定：非近身不下手、没工具不开锁、不在门前不撬门）。
       放在动作相最前面，UI 藏没藏都不影响——打字申报同样过不去。 */
    const req = entry.requires;
    if (req) {
      if (req.place) {
        const kind = currentPlaceKind();
        if (kind !== req.place) {
          const label = req.place === "door" ? "门前 / 楼道 / 玄关" : "室内";
          out.rejected = true;
          out.reason = `动作 [${tag.name}] 只能在${label}使用（当前不在该场所）`;
          return out;
        }
      }
      const dist = DIST_KEY[tag.args?.dist] || g.dist;
      if (Array.isArray(req.dist) && req.dist.length && !req.dist.includes(dist)) {
        out.rejected = true;
        out.reason = `动作 [${tag.name}] 需要距离：${req.dist.map(d => DIST_CN[d] || d).join(" / ")}（当前 ${DIST_CN[dist] || dist}）`;
        return out;
      }
      if (Array.isArray(req.items) && req.items.length) {
        const held = (g.player.inventory || []).filter(it => req.items.includes(it.id) && (it.count || 1) > 0);
        if (!held.length) {
          const names = req.items.map(id => (R.items && R.items[id] && R.items[id].name) || id).join(" / ");
          out.rejected = true;
          out.reason = `动作 [${tag.name}] 需要随身工具：${names}（可在终端·战术行囊内购买与装备）`;
          return out;
        }
      }
    }

    /* 动作自身的语义边界（与 UI 灰条同一套口径，打字申报也过不去）： */
    // 偷袭比强攻更苛刻：身后 3-5 米只够强攻，偷袭必须贴身
    if (tag.id === "strike" && (tag.args?.style || "ambush") === "ambush" && g.dist !== "touch") {
      out.rejected = true;
      out.reason = `动作 [${tag.name}·偷袭] 需要贴身（当前 ${DIST_CN[g.dist] || g.dist}）`;
      return out;
    }
    // 缓息的下限就是 20：已经不高了就别白占一个动作位
    if (tag.id === "breath" && L.get("heart") <= 20) {
      out.rejected = true;
      out.reason = `动作 [${tag.name}] 心跳已在低位（${L.get("heart")} ≤ 20），缓息无效`;
      return out;
    }

    if (!entry.check) {
      // 无骰动作：只做资源与账目（缓息/拉远类）
      out.noRoll = true;
      if (tag.id === "breath") {
        const gainAmt = C.breathGain(g.player.nrv);
        const r = L.commit({ heart: -Math.min(gainAmt, L.get("heart") - 20) }, { reason: "breath" });
        out.ledger = r; out.text = `缓息：心跳 -${Math.max(0, -r.applied.heart)}`;
      } else if (tag.id === "withdraw") {
        g.dist = "far"; out.text = "距离拉开至目视远端";
      } else if (tag.id === "approach") {
        // 贴近只能靠近：已贴身或目标距离不比现在更近，直接拒绝（防止「贴近」把人往外推）
        const RANK = DIST_RANK;
        const want = DIST_KEY[tag.args?.dist] || "close";
        if (RANK[g.dist] >= RANK.touch || RANK[want] <= RANK[g.dist]) {
          out.rejected = true;
          out.reason = RANK[g.dist] >= RANK.touch
            ? "动作 [贴近] 已贴身，无法再靠近"
            : `动作 [贴近] 目标距离（${DIST_CN[want] || want}）不比当前（${DIST_CN[g.dist] || g.dist}）更近`;
          return out;
        }
        g.dist = want; out.text = `距离调整至 ${g.dist}`;
      } else {
        out.text = `${tag.name}：完成（无检定）`;
      }
      return out;
    }

    // 心跳阈值标签在检定前同步：过线瞬间生效，当次动作就吃罚（无白嫖窗口）
    syncHeartTags();
    const { roll, res, mods, dc, attr, targetMod, darkReveal } = runCheck(entry, tag.args, seq);
    out.d20 = roll.d20; out.raw = roll.raw; out.mods = mods; out.dc = dc;
    out.total = res.total; out.band = res.band;
    out.attr = attr; out.targetMod = targetMod; out.darkReveal = darkReveal;

    // 双账结算
    let alertD = 0, heartD = 0, piD = 0, faceMemD = 0, staminaD = -(entry.cost?.stamina || 0);
    const dist = DIST_KEY[tag.args?.dist] || g.dist;

    if (res.band === "success") {
      piD = Math.round(2 * (0.6 + g.player.int * 0.06));
      if (tag.id === "follow") g.dist = dist;      // 跟缀成功推进距离档
      if (tag.id === "withdraw") g.dist = "far";   // 后撤成功拉开（此前漏接，骰了却不动距离）
    } else if (res.band === "grace") {
      const gg = gain({ threat: "minor", dist });
      alertD = gg.alertD; heartD = gg.heartD + 5;
      piD = Math.round(1 * (0.6 + g.player.int * 0.06));
      faceMemD = C.faceMemGain({ band: "grace" });   // 勉强瞥见：记忆+1，不掷认脸
    } else if (res.band === "fail") {
      const gg = gain({ threat: "minor", dist });
      alertD = gg.alertD; heartD = gg.heartD;        // 跟丢未照面：记忆不涨
    } else if (res.band === "nat1") {
      const gg = gain({ threat: "medium", dist });
      alertD = gg.alertD; heartD = gg.heartD;
      faceMemD = C.faceMemGain({ band: "nat1" });    // 爆露照面：记忆+2
    } else if (res.band === "nat20") {
      piD = Math.round(4 * (0.6 + g.player.int * 0.06)) + 2;
      if (tag.id === "follow") g.dist = dist;
    }

    // 拍照：只出「还没拥有」的那一张；抽不到＝这条街上能拍的都拍过了
    if (tag.id === "photo" && (res.band === "success" || res.band === "nat20")) {
      const cap = capturePhoto(dist);
      if (cap) {
        piD += cap.piBonus;
        out.capture = cap;
      } else {
        piD = 0;
        out.captureEmpty = true;
      }
    }

    // 结算后再同步一次（本动作的心跳变化影响下一动作）
    syncHeartTags();

    const r = L.settleAction({ alertD, heartD, piD, staminaD, faceMemD }, { reason: tag.id });
    out.ledger = { seq: r.seq, applied: r.applied };

    // v0.8 身份制：当晚 PI 毛入账累计（侦探 ×1.2 过夜补差）；侦探职业病跟缀状态（跟丢解锁）
    if (piD > 0) g.nightPiGross = (g.nightPiGross || 0) + piD;
    if (g.identity === "detective" && tag.id === "follow") {
      if (res.band === "fail" || res.band === "nat1") g.tailing = false;
      else g.tailing = true;
    }

    if (tag.id === "timing") {
      if (res.band === "nat20" || res.band === "success") {
        g.lastAssess = "读时机评估：目标分心防备松懈，侧向死角暴露，良机（+2 战力）";
      } else if (res.band === "grace") {
        g.lastAssess = "读时机评估：目标偶有停顿，但余光仍有顾及，时机平平";
      } else {
        g.lastAssess = "读时机评估：未能捕捉到有效破绽，轻举妄动易打草惊蛇";
      }
    }

    g.consecFails = (res.band === "fail" || res.band === "nat1") ? g.consecFails + 1 : 0;
    log(`[${tag.name}] 1d20(${roll.d20}) ${mods.map(m => `${m.v >= 0 ? "+" : ""}${m.v} ${m.src}`).join(" ")} = ${res.total} vs DC ${dc} → ${res.band}`);
    return out;
  }

  /** 心跳阈值标签同步（脚本自动挂摘，状态阈值类）。甜区上限按 [优势：胆量] 拓展。 */
  function sweetHighNow() {
    const advNrv = (g.tags || []).some(t => t.id === "adv_nrv");
    return R.check.sweetHigh + (advNrv ? R.advantage.sweetHighBonus : 0);
  }

  function syncHeartTags() {
    const lines = C.heartLines(L.get("heart"), sweetHighNow());
    const stack = g.tags || (g.tags = []);
    if (lines.deform === -2) T.apply(stack, { id: "deform", name: "操作变形", owner: "player", category: "fine", effects: [{ category: "fine", value: -2 }], duration: { type: "flag" } });
    else if (lines.deform === 0) T.remove(stack, "deform");
    if (lines.crash) T.apply(stack, { id: "crash", name: "操作崩溃", owner: "player", category: "fine", effects: [{ category: "fine", value: -2 }], duration: { type: "flag" } });
    else T.remove(stack, "crash");
  }

  /** 开局身份制（v0.8）：属性修正＋常驻标签＋身份参数，全部开局落账；运行时规则层不碰。
   *  真源 rules.json → identity.list；存档恢复不重跑（attrs/tags/账面已随档还原，防二次修正）。 */
  function applyIdentity(identityId, opts = {}) {
    if (!identityId) return false;
    const def = R.identity.list[identityId];
    if (!def) { log(`[身份] 未知身份 "${identityId}"，忽略`); return false; }
    g.identity = identityId;
    for (const [k, v] of Object.entries(def.mods || {})) {
      g.player[k] = Math.max(1, Math.min(10, (g.player[k] || 0) + v));   // 修正后仍受 1~10 秤约束
      if (k === "str") {
        g.player.staminaMax = 100 + g.player.str * 5;                    // 体格变动联动体力上限真源
      }
    }
    const stack = g.tags || (g.tags = []);
    for (const tid of def.tags || []) {
      const rt = R.tags[tid];
      if (!rt) { log(`[身份] 标签 "${tid}" 未在 rules.tags 注册（黑户）`); continue; }
      T.apply(stack, { id: rt.id, name: rt.name, owner: rt.owner || "player",
                       category: rt.category, effects: [{ category: rt.category, value: rt.value }],
                       duration: { type: "flag" } });
    }
    // 教练特权：她的日程含健身房 → 接近度起点 +20（判定锚 facts.packHasGym，宿主传 targetGym 或 packId）
    if (def.gymProximity && (opts.targetGym || (opts.packId && facts.packHasGym(opts.packId)))) {
      L.commit({ proximity: def.gymProximity }, { reason: "identity_gym" });
      addProxLog(def.gymProximity, "健身房行程 (身份特权)");
      log(`[身份] 她的日程含健身房：接近度 +${def.gymProximity}`);
    }
    // 阿宅开局器材：开局自带针孔摄像机（存储档，等值800），落位直接入包
    if (def.startKit) {
      g.startKit = { ...def.startKit };
      if (def.startKit.item && !g.player.inventory.some(it => it.id === def.startKit.item)) {
        g.player.inventory.push({ id: def.startKit.item, count: 1, equipped: false });
      }
    }
    return true;
  }

  function addProxLog(dv, reason) {
    if (!dv) return;
    const sign = dv > 0 ? "+" : "";
    const dateStr = `第 ${L.get("date")} 晚`;
    const entry = `${sign}${dv} · ${reason} (${dateStr})`;
    g.proxLogs = g.proxLogs || [];
    g.proxLogs.push(entry);
    if (g.proxLogs.length > 20) g.proxLogs.shift();
  }

  /** 保安排班周轮换（v0.8）：floor((游戏日-1)/7) mod 2 → 昼班周/夜班周；夜班周夜窗被占（硬锁挂 M4 日程层） */
  function identityShift() {
    const rot = g.identity && R.identity.list[g.identity] ? R.identity.list[g.identity].shiftRotation : null;
    if (!rot) return null;
    return rot.order[Math.floor((L.get("date") - 1) / 7) % rot.order.length];
  }

  /** 优势五标签与玩家属性阈值标签同步（达线挂、掉线摘）。 */
  function syncThresholdTags() {
    const A = R.advantage;
    const stack = g.tags || (g.tags = []);
    // 1. 优势五标签
    const defs = [
      { id: "adv_int", name: "优势：情报", on: L.get("pi") >= A.piThreshold },
      { id: "adv_agi", name: "优势：敏捷", on: g.player.agi >= A.attrThreshold },
      { id: "adv_str", name: "优势：体格", on: g.player.str >= A.attrThreshold },
      { id: "adv_cha", name: "优势：口才", on: g.player.cha >= A.attrThreshold },
      { id: "adv_nrv", name: "优势：胆量", on: g.player.nrv >= A.attrThreshold },
    ];
    for (const d of defs) {
      if (d.on) T.apply(stack, { id: d.id, name: d.name, owner: "player", category: "advantage",
                                 effects: [], duration: { type: "flag" } });
      else T.remove(stack, d.id);
    }

    // 2. 玩家五维属性阈值标签（五维细磨档案落码）
    const attrDefs = [
      { id: "bulky", name: "身形醒目", owner: "player", category: "stealth", value: -1, on: g.player.str >= 8 },
      { id: "unobtrusive", name: "不起眼", owner: "player", category: "stealth", value: 1, on: g.player.str <= 3 },
      { id: "light_footed", name: "脚步轻", owner: "player", category: "stealth", value: 2, on: g.player.agi >= 8 },
      { id: "clumsy", name: "笨拙", owner: "player", category: "stealth", value: -2, on: g.player.agi <= 3 },
      { id: "stammer", name: "结巴", owner: "player", category: "social", value: -2, on: g.player.cha <= 2 && L.get("heart") > 70 },
    ];
    for (const d of attrDefs) {
      if (d.on) {
        T.apply(stack, {
          id: d.id,
          name: d.name,
          owner: d.owner,
          category: d.category,
          effects: [{ category: d.category, value: d.value }],
          duration: { type: "flag" }
        });
      } else {
        T.remove(stack, d.id);
      }
    }
  }

  /** 装备标签栈同步（已装备挂载对应标签，未装备摘除）。 */
  function syncEquippedTags() {
    const stack = g.tags || (g.tags = []);
    const equippedIds = new Set();
    for (const it of (g.player.inventory || [])) {
      if (it.equipped) {
        equippedIds.add(it.id);
        const def = R.items && R.items[it.id];
        if (def && def.tag) {
          const rt = R.tags[def.tag];
          if (rt) {
            T.apply(stack, {
              id: rt.id,
              name: rt.name,
              owner: rt.owner || "player",
              category: rt.category,
              effects: rt.value ? [{ category: rt.category, value: rt.value }] : [],
              duration: { type: "flag" }
            });
          }
        }
      }
    }
    for (const [itemId, def] of Object.entries(R.items || {})) {
      if (def.tag && !equippedIds.has(itemId)) {
        T.remove(stack, def.tag);
      }
    }
  }

  /** 行囊：增加物品。 */
  function addItem(itemId, count = 1) {
    const def = R.items && R.items[itemId];
    if (!def) { log(`[行囊] 未知物品 "${itemId}"`); return false; }
    g.player.inventory = g.player.inventory || [];
    const existing = g.player.inventory.find(it => it.id === itemId);
    if (existing) {
      existing.count = (existing.count || 1) + count;
    } else {
      g.player.inventory.push({ id: itemId, count, equipped: false });
    }
    log(`[行囊] 获得物品：${def.name} × ${count}`);
    return true;
  }

  /** 行囊：扣减或移除物品。 */
  function removeItem(itemId, count = 1) {
    g.player.inventory = g.player.inventory || [];
    const idx = g.player.inventory.findIndex(it => it.id === itemId);
    if (idx < 0) return false;
    const it = g.player.inventory[idx];
    it.count = (it.count || 1) - count;
    if (it.count <= 0) {
      if (it.equipped) unequipItem(itemId);
      g.player.inventory.splice(idx, 1);
    }
    return true;
  }

  /** 行囊：装备物品（同槽位互斥，自动挂载装备标签）。 */
  function equipItem(itemId) {
    g.player.inventory = g.player.inventory || [];
    const it = g.player.inventory.find(i => i.id === itemId);
    if (!it) return { ok: false, reason: "行囊中未找到该物品" };
    const def = R.items && R.items[itemId];
    if (!def) return { ok: false, reason: "未知物品规则" };
    if (!def.slot && def.type !== "tool" && def.type !== "gear" && def.type !== "disguise") {
      return { ok: false, reason: "该物品不可随身装备" };
    }
    const slot = def.slot || def.type;
    // 槽位互斥（如 tool 槽位，开锁工具与攀爬套装互斥占槽）
    for (const other of g.player.inventory) {
      if (other.id !== itemId && other.equipped) {
        const otherDef = R.items && R.items[other.id];
        const otherSlot = otherDef?.slot || otherDef?.type;
        if (otherSlot === slot) {
          other.equipped = false;
          if (otherDef?.tag) T.remove(g.tags || [], otherDef.tag);
          log(`[行囊] 槽位互斥：卸下 ${otherDef?.name || other.id}`);
        }
      }
    }
    it.equipped = true;
    syncEquippedTags();
    log(`[行囊] 装备：${def.name}（槽位：${slot}）`);
    return { ok: true, item: def.name, slot };
  }

  /** 行囊：卸下物品。 */
  function unequipItem(itemId) {
    g.player.inventory = g.player.inventory || [];
    const it = g.player.inventory.find(i => i.id === itemId);
    if (!it) return { ok: false, reason: "行囊中未找到该物品" };
    it.equipped = false;
    const def = R.items && R.items[itemId];
    if (def && def.tag) {
      T.remove(g.tags || [], def.tag);
    }
    log(`[行囊] 卸下：${def?.name || itemId}`);
    return { ok: true, item: def?.name || itemId };
  }

  /** 行囊：使用消耗品。 */
  function useItem(itemId) {
    g.player.inventory = g.player.inventory || [];
    const it = g.player.inventory.find(i => i.id === itemId && (i.count || 1) > 0);
    if (!it) return { ok: false, reason: "行囊中无此可用消耗品" };
    const def = R.items && R.items[itemId];
    if (!def || def.type !== "consumable") return { ok: false, reason: "该物品不是消耗品" };

    if (itemId === "energy_drink") {
      if (!HUNTER_MODES.includes(g.mode)) {
        return { ok: false, reason: "能量饮料仅限夜间行动窗口可用" };
      }
      if (g.nightDrinkUsed) {
        return { ok: false, reason: "今晚已饮用过能量饮料（每晚限一瓶）" };
      }
      g.nightDrinkUsed = true;
      removeItem(itemId, 1);
      const staminaMax = g.player.staminaMax || (100 + (g.player.str || 4) * 5);
      const curStam = L.get("stamina");
      const staminaGain = Math.min(20, staminaMax - curStam);
      L.commit({ stamina: staminaGain, heart: 10 }, { reason: "item_energy_drink" });
      syncHeartTags();
      log(`[行囊] 饮用能量饮料：体力+${staminaGain}，心悸心跳+10`);
      return { ok: true, msg: "饮用能量饮料：体力+20，心悸心跳+10", stamina: staminaGain, heart: 10 };
    }

    if (itemId === "bento") {
      removeItem(itemId, 1);
      const staminaMax = g.player.staminaMax || (100 + (g.player.str || 4) * 5);
      const curStam = L.get("stamina");
      const staminaGain = Math.min(20, staminaMax - curStam);
      L.commit({ stamina: staminaGain }, { reason: "item_bento" });
      log(`[行囊] 食用便当：体力+${staminaGain}`);
      return { ok: true, msg: `食用便当：体力+${staminaGain}`, stamina: staminaGain };
    }

    if (itemId === "onigiri") {
      removeItem(itemId, 1);
      const staminaMax = g.player.staminaMax || (100 + (g.player.str || 4) * 5);
      const curStam = L.get("stamina");
      const staminaGain = Math.min(8, staminaMax - curStam);
      L.commit({ stamina: staminaGain }, { reason: "item_onigiri" });
      log(`[行囊] 食用饭团：体力+${staminaGain}`);
      return { ok: true, msg: `食用饭团：体力+${staminaGain}`, stamina: staminaGain };
    }

    if (itemId === "coffee") {
      removeItem(itemId, 1);
      log(`[行囊] 饮用热咖啡：提神醒脑`);
      return { ok: true, msg: "饮用热咖啡：提神醒脑" };
    }

    return { ok: false, reason: "暂未实装该消耗品使用效果" };
  }

  /** 目标穿着鞋型标签同步（后台无数值flag标签，驱动状态栏脚步声） */
  function syncTargetShoeTags() {
    const stack = g.tags || (g.tags = []);
    const found = stack.find(t => t.owner === "target" && t.id && t.id.startsWith("shoe_"));
    if (found && SHOE_ID_MAP[found.id]) {
      return SHOE_ID_MAP[found.id];
    }
    const isWeekend = g.targetState && g.targetState.outfit && g.targetState.outfit.isWeekend;
    const isCollege = g.targetId === "college";
    const shoeTagId = ((isWeekend || isCollege) && g.targetState && g.targetState.outfit && g.targetState.outfit.shoeId)
      || (g.targetPersona && g.targetPersona.shoeId)
      || (g.targetState && g.targetState.outfit && g.targetState.outfit.shoeId)
      || (R.targets && R.targets.list && R.targets.list[g.targetId] && R.targets.list[g.targetId].shoe)
      || "shoe_heel";
    const def = R.tags && R.tags[shoeTagId] ? R.tags[shoeTagId] : R.tags.shoe_heel;
    if (def) {
      T.apply(stack, {
        id: def.id,
        name: def.name,
        owner: "target",
        type: "equipment",
        category: "equipment",
        effects: [],
        duration: { type: "flag" }
      });
      return SHOE_ID_MAP[def.id] || "heel";
    }
    return "heel";
  }

  /** 目标性格与爱好破绽标签同步（flag型常驻标签） */
  function syncPersonaTags() {
    if (!g.targetPersona) return;
    const stack = g.tags || (g.tags = []);
    const pTagId = g.targetPersona.personalityTag || g.targetPersona.personalityId;
    if (pTagId && R.tags && R.tags[pTagId]) {
      const def = R.tags[pTagId];
      T.apply(stack, {
        id: def.id,
        name: def.name,
        owner: def.owner || "target",
        type: def.type || "personality",
        category: def.category || "social",
        effects: def.value ? [{ category: def.category, value: def.value }] : [],
        duration: { type: "flag" }
      });
    }
    const hTagId = g.targetPersona.hobbyTag || g.targetPersona.hobbyId;
    if (hTagId && R.tags && R.tags[hTagId]) {
      const def = R.tags[hTagId];
      T.apply(stack, {
        id: def.id,
        name: def.name,
        owner: def.owner || "scene",
        type: def.type || "hobby",
        category: def.category || "stealth",
        effects: def.value ? [{ category: def.category, value: def.value }] : [],
        duration: { type: "flag" }
      });
    }
  }


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
    if (curId.includes("metro") || curId.includes("lobby") || curId.includes("store")) return null;   // 室内豁免
    const sfxSeed = D.actionSeed(salt, g.floor || 0, 99);
    const sfxRoll = D.rollD20(sfxSeed).d20;   // 1~20，每点 5%
    const isAlley = curId.includes("alley") || curId.includes("stairs") || curId.includes("backstreet") || (cur.spots || []).length > 1;
    const isResidential = curId.includes("unit") || curId.includes("residence") || curId.includes("stairs") || curId.includes("old");
    // 猫叫（暗巷野猫受惊）：基础 15%（≤3）；贴身/身后惊扰垃圾桶堆升至 25%（≤5）
    const catThreshold = (g.dist === "touch" || g.dist === "close") ? 5 : 3;
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
      .map(s => s.trim()).filter(Boolean);
    const out = [], seen = new Set();
    for (const c of clauses) {
      if (out.length >= 3) break;
      const r = D_norm(c, lex);
      if (r.hit && !seen.has(r.id)) seen.add(r.id), out.push(r);
    }
    return out;
  }

  /**
   * M4-1 动作相（前置结算，主人定稿 2026-10-17「打字→中控转化→得到结果后发送，演出同时进行」）：
   * 玩家输入 → 翻译队列 → 全数值结算（骰/账/刺激/段末）→ 结果包。数在 LLM 写字前定死；
   * 回执相走 processReply（零账目），swipe 天然安全。
   */
  function settleInput(playerText, opts = {}) {
    let queue = [];
    if (opts.actions && opts.actions.length) {
      // 胶囊动作结构化直通：直接认代码里的 Action ID，与输入框文本完全解耦，不靠自然语言猜词
      queue = opts.actions.map(act => {
        const entry = (act.id && lex.byId.get(act.id)) || (act.name && lex.byName.get(act.name));
        return {
          id: entry ? entry.id : act.id,
          name: entry ? entry.name : act.name,
          label: act.name || (entry ? entry.name : act.id),
          args: act.args || {}
        };
      }).filter(r => r.id && lex.byId.has(r.id));
    } else if (opts.allowTextFallback === true) {
      // 仅 GM / 工具 / 单测用的后备：把自然语言归一到动作。玩家侧默认关闭——
      // 主人 2026-10-19 定：手打绝对无效，动作只认胶囊点选，输入框文本只是伴随叙事。
      queue = translateInput(playerText);
    }
    const results = processFloor(playerText || "", { ...opts, _actionQueue: queue, _fromInput: true });
    results.queue = queue.map(r => ({ id: r.id, name: r.name, args: r.args }));
    results.package = {
      floor: results.floor,
      actions: results.actions.map(a => ({
        id: a.id, name: a.name, label: a.label || a.name, d20: a.d20, total: a.total, dc: a.dc, band: a.band, mods: a.mods,
        attr: a.attr || null, targetMod: a.targetMod || 0, darkReveal: a.darkReveal || null,
        raw: a.raw, ledger: a.ledger, noRoll: a.noRoll, text: a.text,
        rejected: a.rejected || false, reason: a.reason || null
      })),
      account: results.floorApplied || null,
      seg: results.seg || null,
      logs: g.logs.slice(),
      narrativeOnly: queue.length === 0 || results.actions.length === 0,
      targetState: g.targetState ? JSON.parse(JSON.stringify(g.targetState)) : null,
      herAlert: g.lastHerAlert || null,
      alertEvent: g.alertEvent ? { ...g.alertEvent } : null,
    };
    return results;
  }

  function processFloor(llmText, opts = {}) {
    const replyOnly = opts.replyOnly === true;   // M4-1 回执相：动作已前置结算，只走票据/谎言/模式
    if (!replyOnly) g.floor = opts.floor ?? ((g.floor || 0) + 1);
    g.logs = [];
    g.lastHerAlert = null;
    g.capture = null;
    if (!replyOnly) g.alertEvent = null;   // 过档事件只在本楼回执里出现一次

    // 她按自己的返程表走：先把地点推进到本楼钟点该到的那一站，再结算玩家动作
    if (!replyOnly) advanceRouteByClock();
    // 确认档之后她在跑：每楼多推一站，跑到终点就跟丢
    if (!replyOnly && g.fleeing && g.route) {
      herAdvance(true);
      if (g.route.here >= g.route.nodes.length - 1) g.tailing = false;
    }

    if (!replyOnly && g.targetState) {
      const pack = (LP.packs && LP.packs[g.targetId]) || LP.packs.college || LP.packs.student;
      const here = g.route ? g.route.here : -1;
      const curId = g.route && here >= 0 ? g.route.nodes[here] : null;
      g.targetState.hand = TS.resolveHand(pack, curId, g.targetState.hand, D.actionSeed(salt, g.floor || 0, "hand"));
      if (g.targetState.route && g.route) {
        g.targetState.route.here = here;
        g.targetState.route.currentPlace = curId ? (map.getPlace(curId)?.name || curId) : null;
      }
      applyTargetState();
    }
    const { tags, cleanText, diag } = parseFloor(llmText, lex);
    syncThresholdTags();   // 每楼先对表：PI 或属性达线/掉线，优势标签挂摘
    const results = { floor: g.floor, actions: [], facts: [], lies: [], mode: null, diag, logs: g.logs, ledgerSeqs: [] };
    const floorApplied = { stamina: 0, heart: 0, alert: 0, pi: 0, proximity: 0, cash: 0 };

    // 模式切换（一楼一次已在 parse 层保证）
    const modeTag = tags.find(t => t.type === "mode");
    if (modeTag) { g.mode = modeTag.mode; results.mode = modeTag.mode; }

    // 谎言：依据锁校验后入账（暂记 pending，账本结构属内容层）
    for (const lie of tags.filter(t => t.type === "lie")) {
      const ok = verifyEvidence(cleanText, lie.claim);
      if (ok) results.lies.push({ ...lie, verified: true });
      else results.lies.push({ ...lie, verified: false, dropped: true });
    }

    // 动作队列：优先使用结构化 _actionQueue 直通（回执相跳过——动作已在 settleInput 前置结算）
    let seq = 0;
    let heartPeak = L.get("heart");                 // 段心跳峰值（档位税按峰值定档）
    let tailFloor = null;                           // 跟缀族本楼代表结算（持续暴露按段一泵）
    const actionQueue = replyOnly
      ? []
      : Array.isArray(opts._actionQueue)
        ? opts._actionQueue.map(a => ({ type: "action", id: a.id, name: a.name, label: a.label || a.name, args: a.args }))
        : (opts._fromInput ? [] : tags.filter(t => t.type === "action"));
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
          tailFloor = { band: out.band, dist: DIST_KEY[tag.args?.dist] || g.dist };
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
      const calm = g.mode === "contact" && L.get("proximity") >= P.calmSocialProximity;
      const pumped = [];
      if (tailFloor && !calm) {
        let stim = 0, src = "";
        if (tailFloor.band === "nat1") { stim = P.exposed; src = "爆露照面"; }
        else if (tailFloor.band === "fail") { stim = P.lost; src = "跟丢"; }
        else if (tailFloor.band === "grace" || tailFloor.band === "nat20") { stim = 0; }
        else { stim = P.tail[tailFloor.dist] ?? P.tail.same; src = `持续尾随·${tailFloor.dist}`; }
        if (stim > 0) pumped.push({ stim, src });
      }
      if (!tailFloor && g.mode === "contact" && !calm
          && tags.some(t => t.type === "action" && lex.byId.get(t.id) && categoryOf(t.id) === "social")) {
        pumped.push({ stim: P.social, src: "伪装寒暄" });
      }
      const sfx = rollEnvSfx();
      g._envSfx = sfx;                              // 演出与账同源：snapshot 读缓存
      if (sfx) {
        let stim = P.env[sfx] || 0;
        const fam = g.famSegs[g.world.district] || 0;
        const halved = fam >= R.heart.areaFamiliarSegments;   // 熟区环境类减半（指向类永不减——天然1 不走此闸）
        if (halved) stim = Math.round(stim * P.familiarEnvFactor);
        pumped.push({ stim, src: (sfx === "cat" ? "猫惊叫" : "狗吠") + (halved ? "·熟区减半" : "") });
      }
      for (const p of pumped) {
        if (p.stim <= 0) continue;
        const d = C.heartDelta({ stim: p.stim, nrv: g.player.nrv });
        if (d) { L.commit({ heart: d }, { reason: "stim" }); floorApplied.heart += d; log(`[刺激] ${p.src} +${p.stim} → 心跳 +${d}`); }
      }
      heartPeak = Math.max(heartPeak, L.get("heart"));   // 泵计入当段峰值（段税按峰值定档）
    } else {
      g._envSfx = null;
    }

    // v0.6 段末账（楼＝场景段）：猎手状态收心跳档位税 + 段末心跳回落（−5 至基线）
    // （段末固定账不进 ledgerSeqs——该序列只收动作结算；段末账入 results.seg 供回执）
    if (!replyOnly && HUNTER_MODES.includes(g.mode)) {
      const tax = C.staminaSegTax(heartPeak, sweetHighNow());
      if (tax) {
        L.commit({ stamina: tax }, { reason: "seg_tax" });
        floorApplied.stamina += tax;
        log(`[段税] 心跳峰值 ${heartPeak} → 体力 ${tax}`);
      }
      const dropped = C.segHeartDrop(L.get("heart"), g.player.nrv);
      if (dropped !== L.get("heart")) {
        const dH = dropped - L.get("heart");
        L.commit({ heart: dH }, { reason: "seg_drop" });
        floorApplied.heart += dH;
      }
      results.seg = { heartPeak, staminaTax: tax };
      // 猎手状态在她所在大区完成一段：分区熟悉度 +1（10 段熟区，二十六节锚）
      const d = g.world.district;
      if (d && g.famSegs[d] !== undefined) {
        g.famSegs[d] = Math.min(g.famSegs[d] + 1, R.heart.areaFamiliarSegments);
      }
    }

    // 接近度变动记小账（HUD 真实消费）
    if (floorApplied.proximity !== 0) {
      const actName = tags.find(t => t.type === "action")?.name || "接触交互";
      addProxLog(floorApplied.proximity, actName);
    }

    // 她的动静警示（根据警觉过档或剧烈增量涌现）
    if (floorApplied.alert >= 8 || C.alertStage(L.get("alert")) >= 2) {
      const stage = C.alertStage(L.get("alert"));
      const pack = (LP.packs && LP.packs[g.targetId]) || LP.packs.college || LP.packs.student;
      const flavor = pack.flavor || {};
      if (stage === 3) g.lastHerAlert = `⚠️ 目标神色慌乱，脚步明显加快！（${flavor.evade || "小跑离开"}）`;
      else if (stage === 2) g.lastHerAlert = `⚠️ 目标放慢脚步，频频侧目回顾！（${flavor.face || "偷瞥身后"}）`;
      else if (floorApplied.alert >= 8) g.lastHerAlert = `⚠️ 目标似乎有所察觉，步伐有些迟疑（${flavor.face || "略带警惕"}）`;
    }

    // 信号流：生成时段流水观察记录
    const timeMin = ((g.floor || 1) * 15) % 120;
    const hh = 21 + Math.floor(timeMin / 60);
    const mm = (timeMin % 60).toString().padStart(2, "0");
    const tm = `${hh}:${mm}`;
    const firstAction = results.actions[0];
    let signalTxt = null;
    if (firstAction) {
      if (firstAction.id === "follow") signalTxt = "目标沿街前行，维持稳定步频";
      else if (firstAction.id === "photo") signalTxt = "目标在路口短暂停留，记录其正面特征";
      else if (firstAction.id === "scan") signalTxt = "目标环顾四周，侧向身形清晰";
      else if (firstAction.id === "timing") signalTxt = "观察其举止神态，捕捉防备松懈间隙";
      else if (firstAction.id === "shop_enter") signalTxt = "目标进入沿街商铺，驻足货架前";
      else signalTxt = "目标保持行进，你在侧后方观察记录";
    }
    if (signalTxt) {
      g.signals = g.signals || [];
      g.signals.push([tm, signalTxt]);
      if (g.signals.length > 20) g.signals.shift();
    }

    // 结算流水摘要
    const parts = [];
    if (floorApplied.stamina) parts.push(`体力 ${floorApplied.stamina > 0 ? "+" : ""}${floorApplied.stamina}`);
    if (floorApplied.heart) parts.push(`心跳 ${floorApplied.heart > 0 ? "+" : ""}${floorApplied.heart}`);
    if (floorApplied.alert) parts.push(`警觉 ${floorApplied.alert > 0 ? "+" : ""}${floorApplied.alert}`);
    if (floorApplied.pi) parts.push(`PI ${floorApplied.pi > 0 ? "+" : ""}${floorApplied.pi}`);
    if (floorApplied.proximity) parts.push(`接近度 ${floorApplied.proximity > 0 ? "+" : ""}${floorApplied.proximity}`);
    if (floorApplied.cash) parts.push(`现金 ${floorApplied.cash > 0 ? "+" : ""}${floorApplied.cash}`);
    g.lastLedgerSummary = parts.length > 0 ? `本轮结算 · ${parts.join(" · ")}` : "本轮结算 · 无数值变动";

    // 票据核销：有票即销，账已在中控（这里只回执）
    for (const t of tags.filter(t => t.type === "fact")) {
      const issued = g.tickets.find(k => k.no === t.ticket);
      results.facts.push({ ticket: t.ticket, consumed: !!issued });
    }
    g.tickets = [];

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
  function processReply(llmText, opts = {}) {
    const filtered = String(llmText || "").replace(/<动作>[\s\S]*?<\/动作>/g, "");
    return processFloor(filtered, { ...opts, floor: g.floor, replyOnly: true });
  }

  /** 给状态栏/回执用的账面快照（明暗分离）。 */
  function snapshot() {
    const s = L.state;
    /* ── 地图 HUD 管道：world/route → 状态栏 route-tracker 与战术沙盘字段 ── */
    const w = g.world;
    const districtObj = map.getDistrict(w.district);
    const here = g.route ? g.route.here : -1;
    const curId = g.route && here >= 0 ? g.route.nodes[here] : null;
    const cur = curId ? map.getPlace(curId) : null;
    const nextId = g.route && here >= 0 && here + 1 < g.route.nodes.length ? g.route.nodes[here + 1] : null;
    const routeView = g.route ? {
      id: g.route.id,
      note: g.route.note,
      startTime: g.route.startTime,
      times: g.route.times || null,
      nodes: g.route.nodes.map((id, i) => (g.route.known && g.route.known[i] ? (map.getPlace(id)?.name || id) : id)),
      known: g.route.known || g.route.nodes.map(() => 1),
      here
    } : null;
    const exits = cur
      ? cur.exits.map(id => (map.getPlace(id)?.name || id) + (id === nextId ? " (前)" : ""))
      : [];
    let sanctuaryAlert = "";
    if (cur) {
      if (cur.sanctuary) sanctuaryAlert = "当前即为安全庇护场所";
      else {
        const sn = map.findNearestSanctuary(curId);
        sanctuaryAlert = sn
          ? `若目标受惊：将循最近通路逃往 [${map.getPlace(sn.sanctuaryId)?.name || sn.sanctuaryId}] (${sn.steps}步)`
          : "此处呼救无门——声浪传导衰减为 0（孤岛区）";
      }
    }

    const activeShoe = syncTargetShoeTags();

    /* ── 环境突发（v0.8 演出与账同源：processFloor 已结算挂账，快照读缓存；未结算时现算仅供显示） ── */
    const envSfx = g._envSfx !== undefined ? g._envSfx : rollEnvSfx();

    return {
      player: { heart: s.heart, stamina: s.stamina, cash: s.cash, pi: s.pi, proximity: s.proximity, date: s.date,
                attrs: { str: g.player.str, agi: g.player.agi, nrv: g.player.nrv, int: g.player.int, cha: g.player.cha } },
      target: {
        id: g.targetId || "college",
        name: (R.targets && R.targets.list && R.targets.list[g.targetId || "college"]) ? R.targets.list[g.targetId || "college"].name : "独居女大学生",
        realName: g.targetPersona ? g.targetPersona.name : null,
        persona: g.targetPersona ? JSON.parse(JSON.stringify(g.targetPersona)) : null,
        /* 她的有效属性 = 基底 + 当天身心扰动 + 鞋具修正（每次现算，不依赖 g.target 的中间态） */
        stats: (() => {
          const base = g.targetBase || g.target || {};
          const out = {};
          for (const k of ["str", "agi", "per", "nrv", "social"]) out[k] = base[k];
          const som = g.targetState && g.targetState.somatic && g.targetState.somatic.mod;
          if (som) for (const [k, v] of Object.entries(som)) {
            if (out[k] !== undefined) out[k] = Math.max(1, out[k] + v);
          }
          return applyShoeMod(out);
        })(),
        alertStage: C.alertStage(s.alert),
        warinessStage: s.wariness >= 60 ? "高" : s.wariness >= 30 ? "中" : "低",
        shoe: activeShoe,
        /* 鞋具读数（状态栏悬停用）：鞋型 + 敏捷修正 + 步声基准 + 按距离折算的当前声级 */
        shoeInfo: (() => {
          const id = (g.tags || []).find(t => t.owner === "target" && t.id && t.id.startsWith("shoe_"))?.id;
          const def = id && R.tags ? R.tags[id] : null;
          if (!def) return null;
          const base = typeof def.noise === "number" ? def.noise : 1;
          const factor = SHOE_DIST_FACTOR[g.dist] ?? 1;
          return {
            id: def.id,
            name: def.name,
            agi: def.mod && typeof def.mod.agi === "number" ? def.mod.agi : 0,
            noise: base,
            distFactor: factor,
            level: Math.max(0, Math.min(5, Math.round(base * factor)))
          };
        })(),
        state: g.targetState ? JSON.parse(JSON.stringify(g.targetState)) : null
      },
      targetState: g.targetState ? JSON.parse(JSON.stringify(g.targetState)) : null,
      envSfx,
      mode: g.mode, dist: g.dist, env: g.env, slot: g.slot,
      identity: { id: g.identity || null,
                  name: g.identity && R.identity.list[g.identity] ? R.identity.list[g.identity].name : null,
                  shift: identityShift(), kit: g.startKit || null },   // v0.8 身份徽记数据源（状态栏常驻条）
      tags: (g.tags || []).map(t => ({ id: t.id, name: t.name, owner: t.owner, type: t.type || "status", duration: t.duration.type, count: t.duration.count })),
      /* 战术行囊持有物 */
      inventory: (g.player.inventory || []).map(it => {
        const def = R.items && R.items[it.id] ? R.items[it.id] : { name: it.id, type: "misc", desc: "" };
        return {
          id: it.id,
          name: def.name,
          type: def.type,
          slot: def.slot || null,
          count: it.count || 1,
          equipped: !!it.equipped,
          canEquip: !!(def.slot || def.type === "tool" || def.type === "gear" || def.type === "disguise"),
          canUse: def.type === "consumable",
          desc: def.desc || "",
          effectsDesc: def.effectsDesc || ""
        };
      }),
      /* 状态栏 HUD 动态内容管道接通 */
      herAlert: g.lastHerAlert || (envSfx ? (envSfx === "cat" ? "🐱 惊动暗巷野猫！垃圾桶传来抓挠声" : "🐕 触动庭院犬吠！院内传来低沉低吼") : null),
      signal: (g.signals && g.signals.length > 0) ? g.signals.slice(-8) : [[(g.route && g.route.startTime) || "21:00", "目标离开原位，步入街道"]],
      proxLog: (g.proxLogs && g.proxLogs.length > 0) ? g.proxLogs.slice(-5).reverse() : [],
      assess: g.lastAssess || null,
      ledger: g.lastLedgerSummary || "本轮暂无结算",
      /* 地图 HUD 字段（状态栏 route-tracker + 战术沙盘） */
      area: districtObj ? districtObj.name : "未知",
      place: cur && routeView.known[here] ? cur.name : null,
      weather: w.weather,
      weatherName: WEATHER_ICON[w.weather] || "🌙 晴夜",
      strikeSealed: cur ? !!cur.strike_sealed : false,
      fam: w.district ? (g.famSegs[w.district] || 0) : 0,
      route: routeView,
      exits,
      spots: cur ? (cur.spots || []) : [],
      sanctuaryAlert,
      /* 相册：计数 + 已拍清单（贴墙渲染用） */
      album: (() => {
        const persona = g.targetPersona || {};
        const shots = Object.entries(g.album || {}).map(([k, v]) => ({ key: k, ...v }));
        return { count: shots.length, total: ALBUM.totalFor(persona), shots };
      })(),
      capture: g.capture || null
    };
  }

  /* ---------- 动线接口（她的位置由脚本全权持有，LLM 只拿过滤视图） ---------- */
  /** 装载/更换她的当晚动线 {nodes:[placeId], times:[HHMM], known:[0|1], here:int}。 */
  function setRoute(route) {
    g.route = route;
    if (g.targetState && route && route.nodes) {
      const curId = route.nodes[route.here || 0];
      const curName = curId ? (map.getPlace(curId)?.name || curId) : null;
      const pack = (LP.packs && LP.packs[g.targetId]) || LP.packs.college || LP.packs.student;
      g.targetState.hand = TS.resolveHand(pack, curId, g.targetState.hand, D.actionSeed(salt, g.floor || 0, "hand_set_route"));
      if (g.targetState.route) {
        g.targetState.route.id = route.id;
        g.targetState.route.note = route.note;
        g.targetState.route.prompt = route.prompt;
        g.targetState.route.here = route.here || 0;
        g.targetState.route.nodes = route.nodes;
        g.targetState.route.currentPlace = curName;
      }
      applyTargetState();
    }
  }
  /** 她推进一步（节点深层博弈结束，内容层驱动）。quiet=true 时不写信号（时刻表批量推进用）。 */
  function herAdvance(quiet) {
    if (g.route && g.route.here < g.route.nodes.length - 1) {
      g.route.here += 1;
      const toId = g.route.nodes[g.route.here];
      const toName = map.getPlace(toId)?.name || toId;
      if (!quiet) {
        g.signals = g.signals || [];
        g.signals.push(["移动", `目标动向推进：前往 [${toName}]`]);
      }
      if (g.targetState) {
        const pack = (LP.packs && LP.packs[g.targetId]) || LP.packs.college || LP.packs.student;
        g.targetState.hand = TS.resolveHand(pack, toId, g.targetState.hand, D.actionSeed(salt, g.floor || 0, "hand_adv_" + g.route.here));
        if (g.targetState.route) {
          g.targetState.route.here = g.route.here;
          g.targetState.route.currentPlace = toName;
        }
        applyTargetState();
      }
    }
    if (g.route && g.route.here >= g.route.nodes.length - 1) g.tailing = false;   // 她到家：侦探职业病解锁（v0.8）
    return g.route ? g.route.here : -1;
  }

  /* ---------- 过档行为：她的警觉每跨一档，她做一件事（一晚每档只响一次） ---------- */
  /** 起疑档的三选一：胆大 → 回头；敏锐 → 绕路；势均力敌 → 按种子骰定。 */
  function alertBranch() {
    const nrv = g.target.nrv || 4, per = g.target.per || 4;
    if (nrv > per) return "turn";
    if (per > nrv) return "detour";
    const roll = D.rollD20(D.actionSeed(salt, g.floor || 1, "alert_branch")).d20;
    return roll <= 7 ? "turn" : roll <= 14 ? "detour" : "shop";
  }

  function applyAlertBehavior(stage) {
    const floor = g.floor || 1;
    const ev = { stage, floor, kind: "", detail: "" };
    if (stage === 1) {
      // 不安：提速（跟速检定，败＝距离退一档）
      const roll = D.rollD20(D.actionSeed(salt, floor, "alert_pace")).d20;
      const total = roll + (g.player.agi || 0);
      const dc = (R.checks && R.checks.follow) || 13;
      ev.kind = "提速";
      if (total <= dc) {
        const before = g.dist;
        g.dist = DIST_DOWN[g.dist] || "far";
        ev.detail = `跟速失败（1d20=${roll}+敏捷${g.player.agi} ≤ DC${dc}）：距离由${DIST_CN[before]}退到${DIST_CN[g.dist]}`;
      } else {
        ev.detail = `跟速成功（1d20=${roll}+敏捷${g.player.agi} > DC${dc}）：维持${DIST_CN[g.dist]}`;
      }
      g.lastHerAlert = "⚠️ 她的步频变了——突然加快，手伸进包里摸手机。";
    } else if (stage === 2) {
      const branch = alertBranch();
      if (branch === "turn") {
        ev.kind = "骤停回头";
        if (g.dist === "close" || g.dist === "touch") {
          const her = D.rollD20(D.actionSeed(salt, floor, "alert_turn_her")).d20 + targetEffectiveAcuity();
          const me = D.rollD20(D.actionSeed(salt, floor, "alert_turn_me")).d20 + (g.player.agi || 0);
          if (me >= her) {
            L.commit({ alert: -5 }, { reason: "alert_turn" });
            ev.detail = `她回头扫街，你贴进阴影（${me} ≥ ${her}）：她没看清，警觉 -5`;
          } else {
            L.commit({ alert: 8, faceMem: 2 }, { reason: "alert_seen" });
            ev.detail = `她回头正好撞上你的视线（${me} < ${her}）：面容记忆 +2、警觉 +8`;
          }
        } else {
          L.commit({ alert: -3 }, { reason: "alert_turn" });
          ev.detail = "她停下回头扫了一眼街面，什么也没看到（警觉 -3）";
        }
        g.lastHerAlert = "⚠️ 她突然停步，回头扫了一眼身后。";
      } else if (branch === "detour") {
        ev.kind = "绕死路";
        const before = g.dist;
        herAdvance(true);
        g.dist = DIST_DOWN[g.dist] || "far";
        ev.detail = `她拐进一条岔路，距离由${DIST_CN[before]}退到${DIST_CN[g.dist]}——跟不跟，你自己决定`;
        g.lastHerAlert = "⚠️ 她没有直走，拐进了一条更暗的岔路。";
      } else {
        ev.kind = "进店";
        g.alertHold = Math.max(g.alertHold || 0, 1);
        ev.detail = "她拐进路边便利店，玻璃门在身后合上（她会在里面停一楼）";
        g.lastHerAlert = "⚠️ 她推门进了便利店，隔着玻璃门还在看街上。";
      }
    } else if (stage === 3) {
      ev.kind = "开跑";
      g.fleeing = true;
      ev.detail = "她确信被跟了，开始小跑（此后每楼她都会往前走一站）";
      g.lastHerAlert = "‼️ 她回头看了你一眼，然后拔腿就跑。";
    } else {
      ev.kind = "摊牌";
      g.tailing = false;
      ev.detail = "她尖叫着冲向路人——今晚到此为止，你只能撤";
      g.lastHerAlert = "‼️ 她尖叫出声，冲向了有人的地方。";
    }
    g.alertEvent = ev;
    log(`[过档] ${ev.kind}：${ev.detail}`);
    g.signals = g.signals || [];
    g.signals.push(["突发", `她${ev.kind}：${ev.detail}`]);
    if (g.signals.length > 20) g.signals.shift();
  }

  /** 每跨一档只响一次；一次跳多档时只演最高那一档，低档记为已过。 */
  function resolveAlertCross() {
    g.alertLatch = g.alertLatch || [];
    for (let guard = 0; guard < 4; guard++) {
      const stage = C.alertStage(L.get("alert"));
      const max = g.alertLatch.length ? Math.max(...g.alertLatch) : 0;
      if (stage <= max) return;
      for (let s = max + 1; s < stage; s++) g.alertLatch.push(s);
      g.alertLatch.push(stage);
      applyAlertBehavior(stage);
    }
  }

  /* ---------- 时刻表推进（她按自己的返程表走，LLM 不参与） ----------
     口径：一楼 = 15 分钟，第 1 楼对应 route.startTime；越过哪个节点的发车时刻，她就推进到哪。
     没有 times 的旧动线（老存档 / 单测手搓）一律不自动推进，保持原语义。 */
  function routeClockMin(floor) {
    const start = g.route && g.route.startTime ? String(g.route.startTime) : "";
    const m = start.match(/^(\d{1,2}):(\d{2})$/);
    const base = m ? (parseInt(m[1], 10) * 60 + parseInt(m[2], 10)) : 21 * 60;
    return base + Math.max(0, (floor || 1) - 1) * 15;
  }
  function hhmmToMin(t) {
    const s = String(t || "").replace(":", "");
    if (!/^\d{3,4}$/.test(s)) return null;
    const v = s.padStart(4, "0");
    return parseInt(v.slice(0, 2), 10) * 60 + parseInt(v.slice(2), 10);
  }
  function fmtMin(min) {
    const h = Math.floor(min / 60) % 24;
    return `${String(h).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
  }
  /** 按时刻表把 here 推到「当前钟点已经到达的最后一站」；一次跨多站只记一条信号。 */
  function advanceRouteByClock() {
    const r = g.route;
    if (!r || !Array.isArray(r.nodes) || !Array.isArray(r.times) || !r.times.length) return r ? (r.here || 0) : -1;
    if (g.alertHold > 0) { g.alertHold -= 1; return r.here || 0; }   // 过档「进店」：她在店里停一楼
    const now = routeClockMin(g.floor || 1);
    const from = r.here || 0;
    while (r.here < r.nodes.length - 1) {
      const t = hhmmToMin(r.times[r.here + 1]);
      if (t === null || t > now) break;
      herAdvance(true);
    }
    if (r.here > from) {
      const toName = map.getPlace(r.nodes[r.here])?.name || r.nodes[r.here];
      g.signals = g.signals || [];
      g.signals.push([fmtMin(now), `目标动向推进：前往 [${toName}]`]);
      if (g.signals.length > 20) g.signals.shift();
    }
    return r.here;
  }

  /** 情报事件点亮某个节点（locate/stakeout 成功等）。 */
  function revealNode(i) {
    if (g.route && g.route.known && i >= 0 && i < g.route.known.length) g.route.known[i] = 1;
  }

  /** 过夜（收摊）。 */
  function nightFall() {
    // v0.8 侦探职业病：跟缀未结束（没跟丢、她也没到家）不可收摊——宁可不结算，不可错结算；GM 可 gmSet({tailing:false}) 解锁
    if (g.tailing) {
      const atEnd = g.route && g.route.here >= g.route.nodes.length - 1;
      if (!atEnd) return { blocked: true, reason: "职业病：跟缀未结束，今晚只能跟丢或跟她到家" };
    }
    const curDate = L.get("date");
    if (g.route && g.route.id === "saturday_date_hotel") {
      g.hotelVisitedCount = (g.hotelVisitedCount || 0) + 1;
      g.lastHotelDate = curDate;
    }
    const r = L.settleNight({ peakAlert: L.get("alert"), nrv: g.player.nrv, staminaMax: g.player.staminaMax });
    (g.tags || (g.tags = [])).length ? T.clearNight(g.tags) && (g.tags = T.clearNight(g.tags)) : null;
    syncHeartTags();
    g.consecFails = 0;
    // v0.8 侦探 PI ×1.2：当晚毛入账合计补差 round(×(mult−1))，四舍五入当晚入账
    const mult = (g.identity && R.identity.list[g.identity] && R.identity.list[g.identity].piMult) || 1;
    let piBonus = 0;
    if (mult > 1 && g.nightPiGross > 0) {
      piBonus = Math.round(g.nightPiGross * (mult - 1));
      if (piBonus > 0) { L.commit({ pi: piBonus }, { reason: "identity_pi" }); log(`[身份] PI×${mult}：当晚毛入账 ${g.nightPiGross}，补差 +${piBonus}`); }
    }
    g.nightPiGross = 0;
    g.tailing = false;
    g.nightDrinkUsed = false;
    g.alertLatch = [];
    g.alertEvent = null;
    g.alertHold = 0;
    g.fleeing = false;
    // 掷下一晚天气（种子骰：同 salt+floor 恒同值；70/20/10 区间映射）
    const wd = D.rollD20(D.actionSeed(salt, 9000 + (g.floor || 0), "weather")).d20;
    g.world.weather = wd <= WEATHER_BANDS.clear[1] ? "clear" : wd <= WEATHER_BANDS.rain[1] ? "rain" : "storm";
    // 掷下一晚目标态势（日期已推进）
    const nextDate = L.get("date");
    const dayOfWeek = (((nextDate || 1) - 1) % 7) + 1;
    const pack = (LP.packs && LP.packs[g.targetId]) || LP.packs.college || LP.packs.student;
    const isLimping = TS.isLimpingDate(nextDate, g.lastHotelDate);
    if (dayOfWeek === 6 && (pack.id === "student" || pack.id === "college")) {
      const routine = g.targetPersona?.saturdayRoutine || (g.targetPersona ? (g.targetPersona.saturdayRoutine = TS.resolveSaturdayRoutine(pack, g.targetPersona, D.actionSeed(salt, 0, "saturday_routine"))) : "cram");
      if (routine === "date") {
        g.dateCount = (g.dateCount || 0) + 1;
      }
      const personalityId = g.targetPersona?.personality?.id || g.targetPersona?.personality || "timid";
      const routeDef = TS.resolveSaturdayRoute(pack, routine, g.dateCount || 0, personalityId, D.actionSeed(salt, nextDate, "saturday_route_branch"), { hotelVisitedCount: g.hotelVisitedCount || 0 });
      if (routeDef) {
        const startT = (routeDef.path && routeDef.path[0] && routeDef.path[0].t)
          ? `${routeDef.path[0].t.slice(0, 2)}:${routeDef.path[0].t.slice(2)}`
          : "21:00";
        g.route = { id: routeDef.id, note: routeDef.note, prompt: routeDef.prompt, startTime: startT,
                    nodes: routeDef.path.map(p => p.place), times: routeDef.path.map(p => p.t),
                    here: 0, known: routeDef.known || routeDef.path.map(() => 1) };
      }
    } else if (dayOfWeek === 7 && (pack.id === "student" || pack.id === "college")) {
      const sundayRoute = (pack.routes || []).find(r => r.id === "sunday_rest") || {
        id: "sunday_rest",
        note: "周日全天居家休整（不出门）",
        prompt: "白描少女周日全天在寓所内安静休整，窗帘拉起，未曾外出，街道上无其足迹",
        path: [{ place: "unit_stairs_b", t: "2000" }]
      };
      g.route = {
        id: sundayRoute.id,
        note: sundayRoute.note,
        prompt: sundayRoute.prompt,
        startTime: "20:00",
        nodes: sundayRoute.path.map(p => p.place),
        times: sundayRoute.path.map(p => p.t),
        here: 0,
        known: [1]
      };
      g.tailing = false;
    } else if (dayOfWeek >= 1 && dayOfWeek <= 5 && (pack.id === "student" || pack.id === "college")) {
      let routeDef = null;
      if (dayOfWeek === 5) {
        routeDef = pack.routes.find(r => r.id === "friday_late" || r.id === "college_friday_night");
      }
      if (!routeDef) {
        routeDef = pack.routes.find(r => r.id === "college_evening" || r.id === "workday_evening") || pack.routes[0];
      }
      if (routeDef) {
        const startT = (routeDef.path && routeDef.path[0] && routeDef.path[0].t)
          ? `${routeDef.path[0].t.slice(0, 2)}:${routeDef.path[0].t.slice(2)}`
          : "21:00";
        g.route = {
          id: routeDef.id,
          note: routeDef.note,
          prompt: routeDef.prompt,
          startTime: startT,
          nodes: routeDef.path.map(p => p.place),
          times: routeDef.path.map(p => p.t),
          here: 0,
          known: routeDef.known || routeDef.path.map(() => 1)
        };
      }
    }
    const outfit = TS.sampleOutfit(pack, nextDate, D.actionSeed(salt, nextDate, "outfit"), g.targetPersona || g.target);
    const somatic = TS.sampleSomatic(pack, D.actionSeed(salt, nextDate, "somatic"), { isLimping });
    const startPlaceId = (g.route && g.route.nodes) ? g.route.nodes[0] : null;
    const startPlaceName = startPlaceId ? (map.getPlace(startPlaceId)?.name || startPlaceId) : null;
    const hand = TS.resolveHand(pack, startPlaceId, null, D.actionSeed(salt, 9000 + (g.floor || 0), "hand_night"));
    g.targetState = {
      outfit,
      somatic,
      hand,
      route: g.route ? {
        id: g.route.id,
        note: g.route.note,
        prompt: g.route.prompt,
        startTime: g.route.startTime,
        here: g.route.here || 0,
        nodes: g.route.nodes,
        currentPlace: startPlaceName
      } : null
    };
    applyTargetState();
    return { seq: r.seq, warinessGain: r.warinessGain, nextStartAlert: r.nextStartAlert, date: L.get("date"), nextWeather: g.world.weather, piBonus, targetState: g.targetState };
  }

  /** GM 直改（人工覆盖期间申报拒绝的逻辑在外层）。v0.8：tailing 为侦探职业病的状态位，GM 可清。 */
  function gmSet(changes = {}) {
    const { tailing, ...rest } = changes;
    if (tailing !== undefined) g.tailing = !!tailing;
    return L.commit(rest, { reason: "gm" });
  }

  /** 导出纯数据存档（JSON 可序列化；含引擎全部状态与账本面）。 */
  function save() {
    return {
      v: 1,
      sessionSalt: salt,
      player: { ...g.player }, target: { ...g.target }, targetBase: { ...g.targetBase },
      targetId: g.targetId || "ol",
      targetPersona: g.targetPersona ? JSON.parse(JSON.stringify(g.targetPersona)) : null,
      targetState: g.targetState ? JSON.parse(JSON.stringify(g.targetState)) : null,
      dateCount: g.dateCount || 0,
      hotelVisitedCount: g.hotelVisitedCount || 0,
      lastHotelDate: g.lastHotelDate || null,
      inventory: JSON.parse(JSON.stringify(g.player.inventory || [])),
      nightDrinkUsed: !!g.nightDrinkUsed,
      mode: g.mode, dist: g.dist, env: g.env, slot: g.slot,
      world: { ...g.world }, route: g.route ? JSON.parse(JSON.stringify(g.route)) : null,
      famSegs: { ...g.famSegs },
      tags: JSON.parse(JSON.stringify(g.tags || [])),
      identity: g.identity || null, tailing: !!g.tailing, nightPiGross: g.nightPiGross || 0,
      startKit: g.startKit || null,
      proxLogs: JSON.parse(JSON.stringify(g.proxLogs || [])),
      signals: JSON.parse(JSON.stringify(g.signals || [])),
      lastAssess: g.lastAssess || null,
      lastHerAlert: g.lastHerAlert || null,
      lastLedgerSummary: g.lastLedgerSummary || null,
      floor: g.floor || 0, consecFails: g.consecFails,
      alertLatch: (g.alertLatch || []).slice(), alertEvent: g.alertEvent || null,
      alertHold: g.alertHold || 0, fleeing: !!g.fleeing,
      album: JSON.parse(JSON.stringify(g.album || {})),
      setBonusDone: JSON.parse(JSON.stringify(g.setBonusDone || {})),
      captureSeq: g.captureSeq || 0,
      tickets: JSON.parse(JSON.stringify(g.tickets)), ticketsIssued: g.ticketsIssued,
      ledgerState: { ...L.state },
    };
  }

  return { processFloor, settleInput, processReply, translateInput, nightFall, gmSet, snapshot, save, ledger: L,
           capturePhoto, albumTotal: () => ALBUM.totalFor(g.targetPersona || {}),
           setRoute, herAdvance, advanceRouteByClock, revealNode,
           addItem, removeItem, equipItem, unequipItem, useItem,
           get mode() { return g.mode; }, get dist() { return g.dist; },
           get targetState() { return g.targetState; },
           initTargetState, applyTargetState,
           _g: g };
}

module.exports = { createGame };