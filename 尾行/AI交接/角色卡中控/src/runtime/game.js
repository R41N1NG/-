/**
 * 引擎装配入口：创建实例状态、连接业务模块、恢复存档并导出兼容 API。
 * 职责与修改入口见 docs/模块化维护指南.md。
 * 模块通过显式参数共享本实例状态，禁止导入宿主或 UI。
 */
const { renameRoute } = require("./known-routes.js");
const { loadLexicon } = require("./lexicon.js");
const D = require("./dice.js");
const { createLedger } = require("./ledger.js");
const map = require("./map.js");
const LP = require("../config/lifepack.json");
const TS = require("./target_state.js");
const ALBUM = require("./album.js");
const { createInvestigation } = require("./investigation.js");
const { validateKnowledge } = require("./target-knowledge.js");

const { createTargetSystem } = require("./game/target.js");
const { createActionSystem } = require("./game/actions.js");
const { createTurnSystem } = require("./game/turn.js");
const { createPlayerSystem } = require("./game/player.js");
const { createInventorySystem } = require("./game/inventory.js");
const { createCheckSystem } = require("./game/checks.js");
const { createRouteSystem } = require("./game/route.js");
const { createAlertSystem } = require("./game/alert.js");
const { createAlbumSystem } = require("./game/album.js");
const { createSnapshotSystem } = require("./game/snapshot.js");
const { createSaveSystem } = require("./game/save.js");
const { createEconomy, validateEconomy } = require("../contracts/economy.js");
const { createSpatial, validateSpatial } = require("../contracts/spatial.js");
const { observeScene, routePlace } = require("./spatial/system.js");
const { createDailyRegistry } = require("./daily/registry.js");
const { createDailySystem } = require("./daily/system.js");

const { classifyPlace } = require("../contracts/action-requirements.js");
const { migrateSave } = require("./persistence/migrations.js");
const { createDayPlan, validateDayPlan } = require("../contracts/day-plan.js");

const {
  normalizePersona,
  validatePersona,
} = require("../contracts/persona.js");

function createGame(init = {}, services = {}) {
  if (init.targetPersona) {
    init = { ...init, targetPersona: normalizePersona(init.targetPersona) };
    validatePersona(
      init.targetPersona,
      init.targetId || init.targetPersona.targetId || "college",
      { complete: init.targetPersona.generatorVersion != null },
    );
  }
  if (init.saved) init = { ...init, saved: migrateSave(init.saved) };
  const rngVersion = init.saved?.rngVersion ?? 2;
  const lex = loadLexicon();
  let salt = init.sessionSalt || D.newSessionSalt();

  const g = {
    sessionSalt: salt,
    rngVersion,
    nightStartFloor: init.saved?.nightStartFloor ?? init.nightStartFloor ?? 0,
    player: init.player || {
      str: 4,
      agi: 5,
      nrv: 5,
      int: 5,
      cha: 5,
      staminaMax: 120,
    },
    target: init.target || { str: 3, agi: 4, per: 5, nrv: 4, social: 2 },
    targetId: init.targetId || (init.saved && init.saved.targetId) || "college",
    targetPersona:
      init.targetPersona || (init.saved && init.saved.targetPersona) || null,
    targetState:
      init.targetState || (init.saved && init.saved.targetState) || null,
    mode: init.mode || "stealth",
    dist: init.dist || "same",
    env: init.env || "night",
    slot: init.slot || "e21_23",
    tickets: init.tickets || [], // 本楼事件票据 [{no, kind, guide}]
    ticketsIssued: init.ticketsIssued || 1,
    world: init.world || { weather: "clear", district: "B" }, // 每晚天气与她所在大区（真源在脚本）
    route: init.route || null, // 她的当晚动线 {nodes:[placeId], known:[0|1], here:int}
    dateCount: init.dateCount || (init.saved && init.saved.dateCount) || 0,
    hotelVisitedCount:
      init.hotelVisitedCount ||
      (init.saved && init.saved.hotelVisitedCount) ||
      0,
    lastHotelDate:
      init.lastHotelDate ?? (init.saved && init.saved.lastHotelDate) ?? null,
    famSegs: init.famSegs || { A: 0, B: 0, C: 0, D: 0 }, // 分区熟悉度段数（10 段熟区）
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
    targetKnowledge: init.targetKnowledge || null,
    album: init.album || {},
    setBonusDone: init.setBonusDone || {},
    capture: null,
  };
  // 开局掷发型与体型（只影响图鉴取图，不进数值）
  if (g.targetPersona) {
    if (!g.targetPersona.hair) {
      const i = D.pickIndex(
        D.actionSeed(salt, 0, "hair", rngVersion),
        ALBUM.WARDROBE.variants.hair.length,
      );
      g.targetPersona.hair = ALBUM.WARDROBE.variants.hair[i];
    }
    if (!g.targetPersona.body) {
      const i = D.pickIndex(
        D.actionSeed(salt, 0, "body", rngVersion),
        ALBUM.WARDROBE.variants.body.length,
      );
      g.targetPersona.body = ALBUM.WARDROBE.variants.body[i];
    }
  }
  if (g.targetPersona && !g.targetPersona.assignedFacts) {
    const pack =
      (LP.packs && LP.packs[g.targetId]) ||
      LP.packs.college ||
      LP.packs.student;
    TS.resolveTargetFacts(
      pack,
      g.targetPersona,
      D.actionSeed(salt, 0, "facts", rngVersion),
    );
  }
  if (g.targetPersona && g.targetPersona.finalStats) {
    g.target = Object.assign({}, g.target, g.targetPersona.finalStats);
  }
  g.targetBase = { ...g.target };

  g.player.inventory = Array.isArray(init.inventory)
    ? init.inventory
    : Array.isArray(g.player.inventory)
      ? g.player.inventory
      : [];
  g.nightDrinkUsed = !!init.nightDrinkUsed;
  const L = (g.ledger = createLedger({ ...init.stats, nrv: g.player.nrv }));
  // 装配业务模块：仅传递所需状态和回调，不让业务模块依赖调度器。
  const seedAt = (floor, domain) =>
    D.actionSeed(salt, floor, domain, rngVersion);
  const getSalt = () => salt;
  const {
    sweetHighNow,
    syncHeartTags,
    applyIdentity,
    addProxLog,
    identityShift,
    syncThresholdTags,
  } = createPlayerSystem({ g, L, log });
  const {
    syncEquippedTags,
    addItem,
    removeItem,
    equipItem,
    unequipItem,
    useItem,
  } = createInventorySystem({ g, L, log, syncHeartTags });
  const investigation = createInvestigation({ g, L });
  const {
    applyTargetState,
    applyShoeMod,
    initTargetState,
    syncTargetShoeTags,
    syncPersonaTags,
    nightFall: legacyNightFall,
  } = createTargetSystem({ g, L, seedAt, log, syncHeartTags, investigation });
  const { targetEffectiveAcuity, gain, runCheck, categoryOf } =
    createCheckSystem({ g, seedFor, isFamiliar, investigation });
  const { setRoute, herAdvance, advanceRouteByClock, revealNode } =
    createRouteSystem({ g, seedAt, applyTargetState, investigation });
  const { resolveAlertCross } = createAlertSystem({
    g,
    L,
    seedAt,
    log,
    targetEffectiveAcuity,
    herAdvance,
  });
  const { capturePhoto } = createAlbumSystem({ g, seedAt });
  const { settleAction } = createActionSystem({
    g,
    L,
    lex,
    log,
    capturePhoto,
    investigation,
    currentPlaceKind,
    gain,
    runCheck,
    syncHeartTags,
  });
  const {
    rollEnvSfx,
    translateInput,
    settleInput,
    processFloor,
    processReply,
  } = createTurnSystem({
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
    snapshot: () => snapshot(),
    syncSpatial: (results) => observeScene(g, L.get("date"), results),
    investigation,
    syncHeartTags,
    deferTailingFailure: (results) =>
      services.deferTailingFailure?.({ g, results }) === true,
    sweetHighNow,
    syncThresholdTags,
  });
  const { snapshot } = createSnapshotSystem({
    g,
    L,
    syncTargetShoeTags,
    applyShoeMod,
    identityShift,
    rollEnvSfx,
    getDayActivities: () => dailySystem.activities(),
    getDayToken: () => dailySystem.token(),
    getDayControls: () => dailySystem.controls(),
  });
  const { save } = createSaveSystem({ g, L, getSalt });
  applyIdentity(init.identity, {
    targetGym: init.targetGym,
    packId: init.packId,
  }); // v0.8 开局身份制：修正与常驻标签先落账，再对表优势
  syncThresholdTags(); // 开局即对表：极端出身属性达标直接挂优势
  syncEquippedTags(); // 开局装备标签同步
  syncTargetShoeTags(); // 目标鞋具标签同步
  syncPersonaTags(); // 目标性格与爱好破绽标签同步
  if (!g.targetState) initTargetState();
  else applyTargetState();

  /* ---------- 存档往返（十四节快照回退的地基；宿主每楼把 save() 落进酒馆变量，事件后从 saved 无损重建） ---------- */
  if (init.saved) {
    const s = init.saved;
    if (s.sessionSalt !== undefined) salt = s.sessionSalt; // 闭包盐必须恢复，种子流才续得上
    for (const k of [
      "player",
      "target",
      "targetId",
      "targetPersona",
      "targetState",
      "mode",
      "dist",
      "env",
      "slot",
      "world",
      "route",
      "famSegs",
      "tags",
      "floor",
      "consecFails",
      "tickets",
      "ticketsIssued",
      "identity",
      "startKit",
      "proxLogs",
      "signals",
      "lastAssess",
      "lastHerAlert",
      "lastLedgerSummary",
      "nightDrinkUsed",
      "dateCount",
      "hotelVisitedCount",
      "lastHotelDate",
      "alertLatch",
      "alertEvent",
      "alertHold",
      "fleeing",
      "targetKnowledge",
      "investigation",
      "album",
      "setBonusDone",
      "captureSeq",
    ]) {
      if (s[k] !== undefined) g[k] = s[k];
    }
    if (s.targetBase !== undefined) g.targetBase = { ...s.targetBase };
    if (s.inventory !== undefined)
      g.player.inventory = JSON.parse(JSON.stringify(s.inventory));
    if (s.tailing !== undefined) g.tailing = s.tailing;
    if (s.nightPiGross) g.nightPiGross = s.nightPiGross;
    g.sessionSalt = salt;
    Object.assign(L.state, s.ledgerState || {});
    g._envSfx = s.envSfx ?? null;
    g.logs = [];
    syncThresholdTags();
    syncEquippedTags();
    syncTargetShoeTags();
    syncPersonaTags();
    applyTargetState();
  }

  syncHeartTags({ sweetOnly: true });
  g.targetKnowledge = validateKnowledge(g.targetKnowledge, g.targetId);
  investigation.restore(init.saved);

  // 未提供日程的旧档仅补显示字段，不推测已花点数、不改变夜间流程。
  g.dayPlan = validateDayPlan(
    init.saved?.dayPlan ?? init.dayPlan ?? createDayPlan(g.slot),
  );
  g.economy = validateEconomy(
    init.saved?.economy ?? init.economy ?? createEconomy(),
  );
  // 只能从明确已知的路线节点推断旧流程起点，不能借目标的隐藏节点定位玩家。
  const oldPlace = routePlace(g);
  const hasSavedSpatial =
    init.saved && Object.prototype.hasOwnProperty.call(init.saved, "spatial");
  g.spatial = validateSpatial(
    hasSavedSpatial
      ? init.saved.spatial
      : init.spatial !== undefined
        ? init.spatial
        : createSpatial({
            placeId:
              g.dayPlan.source === "legacy" && map.getPlace(oldPlace)
                ? oldPlace
                : undefined,
            assumed:
              !!init.saved || (g.dayPlan.source === "legacy" && !oldPlace),
          }),
  );
  if (
    !hasSavedSpatial &&
    init.spatial === undefined &&
    g.dayPlan.source === "legacy"
  )
    observeScene(g, L.get("date"));
  const dailySystem = createDailySystem({
    g,
    L,
    registry: createDailyRegistry(services.dailyActions || []),
    nextDay: legacyNightFall,
    afterCommit: () => {
      if (g.dayPlan.source === "daily" && !g.dayPlan.activity)
        investigation.finish("活动结束");
      syncThresholdTags();
      syncHeartTags();
      if (g.dayPlan.source === "daily")
        g.world.district = map.getPlace(g.spatial.playerPlaceId).district;
    },
  });
  function nightFall() {
    if (g.dayPlan.source === "daily")
      throw Object.assign(new Error("请在本日安排结束后使用进入下一天"), {
        code: "DAY_UNAVAILABLE",
      });
    const result = legacyNightFall();
    if (!result?.blocked) g.dayPlan = createDayPlan(g.slot);
    return result;
  }

  /* 老存档兼容：早前 route 只存了 nodes、没存发车时刻，按包内同名动线把 times 补回来。
     规则：只补不覆盖；包内找不到同名动线就保持原样（手搓/GM 动线由调用方自己给 times）。 */
  (function backfillRouteTimes() {
    const r = g.route;
    if (!r || !Array.isArray(r.nodes)) return;
    if (Array.isArray(r.times) && r.times.length === r.nodes.length) return;
    const pack =
      (LP.packs && LP.packs[g.targetId]) ||
      LP.packs.college ||
      LP.packs.student;
    const def = (pack.routes || []).find((x) => x.id === r.id);
    if (!def || !Array.isArray(def.path) || def.path.length !== r.nodes.length)
      return;
    r.times = def.path.map((p) => p.t);
    if (!r.startTime && def.path[0] && def.path[0].t) {
      r.startTime = `${def.path[0].t.slice(0, 2)}:${def.path[0].t.slice(2)}`;
    }
    applyTargetState();
  })();

  /* ---------- 工具 ---------- */
  function log(line) {
    g.logs.push(line);
  }
  function seedFor(seq) {
    return D.actionSeed(salt, g.floor || 0, seq, rngVersion);
  }
  function isFamiliar() {
    return L.get("proximity") >= 20 && L.get("proximity") < 40;
  }

  /** 当前场所类型：door（门前/楼道/玄关）｜room（室内）｜空串（街道等无门无室） */
  function currentPlaceKind() {
    const id = g.route?.nodes?.[g.route.here] || "";
    return classifyPlace(id, map.getPlace(id)?.name || "");
  }

  /** GM 直改（人工覆盖期间申报拒绝的逻辑在外层）。v0.8：tailing 为侦探职业病的状态位，GM 可清。 */
  function gmSet(changes = {}) {
    const { tailing, ...rest } = changes;
    if (tailing !== undefined) g.tailing = !!tailing;
    const r = L.commit(rest, { reason: "gm" });
    syncHeartTags();
    return r;
  }

  return {
    processFloor,
    settleInput,
    processReply,
    translateInput,
    executeDailyCommand: dailySystem.execute,
    renameKnownRoute: (request) => renameRoute(g, request),
    nightFall,
    gmSet,
    snapshot,
    save,
    ledger: L,
    capturePhoto,
    albumTotal: () => ALBUM.totalFor(g.targetPersona || {}),
    setRoute,
    herAdvance,
    advanceRouteByClock,
    revealNode,
    addItem,
    removeItem,
    equipItem,
    unequipItem,
    useItem,
    get mode() {
      return g.mode;
    },
    get dist() {
      return g.dist;
    },
    get targetState() {
      return g.targetState;
    },
    initTargetState,
    applyTargetState,
    _g: g,
  };
}

module.exports = { createGame };
