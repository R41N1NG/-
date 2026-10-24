"use strict";
// 独立预览适配器；不进入生产角色卡，不改原聊天存档协议。
const { createGame } = require("../../src/runtime/game");
const { defaultInit } = require("../../src/host/initial-state");
const { createSpatial } = require("../../src/contracts/spatial");
const TIME = require("./college-preview-time");
const { createWorkHandler } = require("./college-preview-work");
const { TAIL_PUMP_IDS } = require("../../src/runtime/game/constants");
const { prepareMove } = require("../../src/runtime/spatial/system");
const periods = require("../../src/config/day-plan.json").periods;
const clone = (value) => JSON.parse(JSON.stringify(value));
const places = require("../../src/config/places.json").places;
const definition = require("../../src/config/daily-actions.json").find(
  (d) => d.id === "daily.tailing",
);
const scenes = [
  { place: null, title: "校内上课", text: "校门外看不见课堂内的情况。" },
  {
    place: "university_canteen_b",
    title: "午间用餐",
    text: "她端着餐盘，在食堂靠窗的位置坐下。",
  },
  {
    place: "university_library_b",
    title: "午后自习",
    text: "她坐在阅览区，将翻开的书页压在笔记本旁。",
  },
  {
    place: "school_gate_b",
    title: "离校现场",
    text: "她走出大学正门，把手机收进口袋，准备沿街离开。下一站尚未确认。",
  },
  {
    place: null,
    title: "子夜居家",
    text: "当前没有新的目视记录。未确认的住处不会显示在地图上。",
  },
];
function createPreview(saved, options = {}) {
  let usedDate = saved?.previewCollege?.usedDate ?? null;
  let serial = saved?.previewCollege?.serial || 0;
  let outcome = saved?.previewCollege?.outcome
    ? clone(saved.previewCollege.outcome)
    : null;
  let sessionPiStart =
    saved?.previewCollege?.sessionPiStart ?? saved?.ledgerState?.pi ?? 0;
  let pendingEnd = null;
  let recovery = clone(
    saved?.previewCollege?.recovery || {
      used: false,
      pending: false,
      attempted: false,
      lastResult: null,
      lastSeen: null,
    },
  );
  let used = TIME.timeUsed(
    saved?.previewCollege?.timeUsed ?? options.timeUsed ?? 0,
  );
  const initial = {
    ...defaultInit(),
    identity: "otaku",
    sessionSalt: options.seed || "college-preview-9",
    dayPlan: {
      schema: 1,
      source: "daily",
      period: options.period ?? 1,
      spent: options.spent ?? 0,
      activity: null,
      ended: false,
    },
    spatial: createSpatial({ placeId: "player_base_b" }),
  };
  let game;
  const weekday = () => ((game.ledger.get("date") - 1) % 7) + 1;
  function available(ctx) {
    if (weekday() > 4) return "预览只配置周一至周四的标准工作日";
    if (ctx.dayPlan.period !== 3) return "此时段没有可接入的出行机会";
    if (usedDate === ctx.ledger.date) return "本次离校机会已经使用";
    if (
      ctx.spatial.playerPlaceId !== "school_gate_b" ||
      ctx.spatial.tracking !== "visual"
    )
      return "须在大学正门实际目视目标";
    return null;
  }
  game = createGame(saved ? { saved } : initial, {
    deferTailingFailure: ({ g, results }) => {
      const attempts = results.actions.filter(
        (a) => !a.rejected && TAIL_PUMP_IDS.includes(a.id),
      );
      if (
        g.dayPlan.activity?.kind !== "tailing" ||
        recovery.used ||
        attempts.at(-1)?.band !== "fail" ||
        attempts.some((a) => a.band === "nat1") ||
        g.alertEvent?.stage === 4
      )
        return false;
      recovery = {
        used: true,
        pending: true,
        attempted: false,
        lastResult: null,
        lastSeen: clone(g.spatial.lastSeen),
      };
      return true;
    },
    dailyActions: [
      {
        definition: require("../../src/config/daily-actions.json").find(
          (d) => d.id === "daily.work",
        ),
        handler: createWorkHandler(() => ({
          salt: game.save().sessionSalt,
          rngVersion: game._g.rngVersion,
        })),
      },
      {
        definition: {
          ...definition,
          name: "跟随离开",
          effect: "消耗2点进入返程；结束后推进时段",
        },
        handler: {
          available,
          prepare: () => ({
            summary: "开始跟随离开，行动点已扣2点",
            payload: { eventId: "college-departure" },
          }),
          finish: () => ({ summary: "这次跟随告一段落，进入下一时段" }),
          cancel: () => ({
            summary: "你停下脚步，结束了这次跟随；已用的2点不退还",
          }),
        },
      },
    ],
  });
  function active() {
    return game._g.dayPlan.activity?.kind === "tailing";
  }
  function observe() {
    if (active()) return;
    const g = game._g,
      p = g.dayPlan,
      scene = scenes[p.period];
    const visible =
      !p.ended &&
      weekday() <= 4 &&
      !!scene.place &&
      scene.place === g.spatial.playerPlaceId &&
      !(p.period === 3 && usedDate === game.ledger.get("date"));
    if (visible) {
      g.spatial.tracking = "visual";
      g.spatial.assumed = false;
      g.spatial.lastSeen = {
        targetId: g.targetId,
        placeId: scene.place,
        date: game.ledger.get("date"),
        period: p.period,
        turn: g.floor || 0,
      };
      if (!g.spatial.knownPlaces.includes(scene.place))
        g.spatial.knownPlaces.push(scene.place);
    } else g.spatial.tracking = "none";
    return visible;
  }
  observe();
  function save() {
    return {
      ...game.save(),
      previewCollege: {
        schema: 4,
        usedDate,
        serial,
        timeUsed: used,
        outcome,
        sessionPiStart,
        recovery,
      },
    };
  }
  function quote(placeId) {
    const g = game._g;
    const cost = places[placeId]
      ? TIME.travelCost(places[g.spatial.playerPlaceId], places[placeId])
      : 0;
    let reason = null,
      to = null;
    try {
      if (outcome && !outcome.acknowledged)
        throw Error("请先查看尾行结果，返回日程后再移动");
      if (g.dayPlan.ended || g.dayPlan.activity)
        throw Error(g.dayPlan.ended ? "本日已结束" : "尾行中请使用跟随动作");
      prepareMove({ spatial: g.spatial }, placeId);
      to = TIME.arrival(g.dayPlan, used, cost);
    } catch (e) {
      reason = e.message;
    }
    return {
      placeId,
      cost,
      reason,
      arrival: to,
      label:
        reason ||
        `前往${places[placeId].mapName || places[placeId].name} · ${cost}格时间 · 0点`,
    };
  }
  function snapshot() {
    const s = game.snapshot();
    s.previewTime = {
      used,
      remaining: s.dayPlan.ended ? 0 : TIME.RULES.perPeriod - used,
      perPeriod: TIME.RULES.perPeriod,
      active: active(),
    };
    s.previewMoves = Object.fromEntries(
      s.cityMap.nodes.map((n) => [n.id, quote(n.id)]),
    );
    for (const n of s.cityMap.nodes)
      if (!n.moveReason && s.previewMoves[n.id].reason)
        n.moveReason = s.previewMoves[n.id].reason;
    if (!active() && s.cityMap.target) s.cityMap.target.live = !!observe();
    if (s.cityMap.target)
      s.cityMap.target.status = s.cityMap.target.live ? "目视位置" : "最后目击";
    const route = game._g.route;
    s.previewTailing = {
      active: active(),
      outcome: outcome ? clone(outcome) : null,
      pendingOutcome: !!outcome && !outcome.acknowledged,
      recovery: clone(recovery),
      confirmed: (route?.nodes || []).flatMap((id, i) =>
        route.known?.[i] === 1 && i <= route.here
          ? [
              {
                id,
                name: places[id]?.mapName || places[id]?.name || "已确认地点",
              },
            ]
          : [],
      ),
      next:
        active() && route?.known?.[route.here + 1] === 1
          ? places[route.nodes[route.here + 1]]?.mapName ||
            places[route.nodes[route.here + 1]]?.name
          : null,
    };
    s.previewScene = active()
      ? {
          title: "正式尾行中",
          text: "已进入返程。跟随判定、心跳、警觉与PI由原引擎结算；内部回合不再扣行动点。",
          active: true,
        }
      : s.cityMap.target?.live
        ? scenes[game._g.dayPlan.period]
        : {
            title: "尚未目视目标",
            text:
              game._g.dayPlan.period === 4
                ? scenes[4].text
                : "当前地点未见目标。地图上的旧目击点不代表她现在仍在那里。",
            active: false,
          };
    return s;
  }
  function request(command, actionId, args = {}) {
    return {
      operationId: "college-preview-" + ++serial,
      command,
      actionId,
      args,
      expected: {
        date: game.ledger.get("date"),
        period: game._g.dayPlan.period,
        sequence: game._g.dayPlan.sequence || 0,
      },
      ...(game._g.dayPlan.activity
        ? { activityId: game._g.dayPlan.activity.id }
        : {}),
    };
  }
  function execute(req) {
    // 先由原请求缓存核对内容；重复请求即使已经跨时段或日终也不得再耗时。
    if (
      game._g.dayPlan.receipts?.some((r) => r.operationId === req.operationId)
    )
      return game.executeDailyCommand(req);
    if (outcome && !outcome.acknowledged)
      throw Error("请先查看尾行结果，返回日程后再继续");
    const wasActive = active(),
      priorReceipt = game._g.investigation.lastReceipt;
    const lastSeenBefore = clone(game._g.spatial.lastSeen);
    const before = {
      period: game._g.dayPlan.period,
      ended: game._g.dayPlan.ended,
      date: game.ledger.get("date"),
      used,
    };
    const travel = req.command === "move" ? quote(req.args?.placeId) : null;
    if (travel?.reason) throw Error(travel.reason);
    let result = game.executeDailyCommand(req);
    if (!result.reused && travel) {
      const p = game._g.dayPlan;
      p.period = travel.arrival.period;
      p.ended = travel.arrival.ended;
      used = travel.arrival.used;
      game._g.env = p.period < 3 ? "day" : "night";
      game._g.slot =
        p.period < 3 ? "prepare" : p.period === 3 ? "e21_23" : "e23_01";
      result = {
        ...result,
        after: { ...result.after, period: p.period },
        travel: {
          cost: travel.cost,
          before: { period: before.period, used: before.used },
          after: { period: p.period, used, ended: p.ended },
        },
        summary: `已到达${places[req.args.placeId].mapName || places[req.args.placeId].name}，耗时${travel.cost}格、行动点不变；${p.ended ? "本日已结束" : periods[p.period].name + "剩余" + (TIME.RULES.perPeriod - used) + "格时间"}`,
      };
      p.receipts = p.receipts.map((r) =>
        r.operationId === req.operationId ? clone(result) : r,
      );
      p.lastReceipt = clone(result);
    } else if (
      !result.reused &&
      (game._g.dayPlan.period !== before.period ||
        game._g.dayPlan.ended !== before.ended ||
        game.ledger.get("date") !== before.date)
    )
      used = 0;
    if (
      !result.reused &&
      req.command === "start" &&
      req.actionId === "daily.tailing"
    ) {
      outcome = null;
      recovery = {
        used: false,
        pending: false,
        attempted: false,
        lastResult: null,
        lastSeen: null,
      };
      sessionPiStart = game.ledger.get("pi");
      usedDate = game.ledger.get("date");
      game._g.nightStartFloor = game._g.floor || 0;
      game.setRoute({
        id: "college-preview-return",
        note: "标准工作日返程预览",
        here: 0,
        known: [1, 0, 0, 0, 0, 0],
        startTime: "21:30",
        nodes: [
          "school_gate_b",
          "old_skybridge_b",
          "store_24h_b",
          "old_alley_main_b",
          "dark_blind_alley_b",
          "unit_stairs_b",
        ],
        times: ["2130", "2145", "2200", "2215", "2230", "2245"],
      });
      game._g.mode = "stealth";
      game._g.dist = "same";
    }
    if (wasActive && ["finish", "cancel"].includes(req.command)) {
      const receipt =
        pendingEnd?.receipt ||
        (game._g.investigation.lastReceipt !== priorReceipt
          ? game._g.investigation.lastReceipt
          : null);
      const kind =
        pendingEnd?.kind || (req.command === "cancel" ? "stopped" : "ended");
      const titles = {
        lost: "已经找不到她了",
        escaped: "她已经离开视线",
        completed: "这段路，你跟到了最后",
        stopped: "你停下了跟随的脚步",
        ended: "这次跟随告一段落",
      };
      outcome = {
        kind,
        title: titles[kind],
        lastSeen: lastSeenBefore,
        pi: Math.max(0, game.ledger.get("pi") - sessionPiStart),
        minimum: receipt?.minimum || 0,
        clueGain: receipt?.clueGain || 0,
        clueCount: receipt?.clues?.length || 0,
        date: game.ledger.get("date"),
        period: game._g.dayPlan.period,
        remaining: 4 - game._g.dayPlan.spent,
        acknowledged: false,
        recoveryAttempted: recovery.attempted,
        declinedRecovery: recovery.pending,
      };
      recovery.pending = false;
    }
    if (
      !result.reused &&
      req.command === "start" &&
      req.actionId === "daily.work"
    ) {
      const check = game._g.economy.lastWork?.check;
      if (check) {
        result = { ...result, workCheck: clone(check) };
        game._g.dayPlan.receipts = game._g.dayPlan.receipts.map((r) =>
          r.operationId === req.operationId ? clone(result) : r,
        );
        game._g.dayPlan.lastReceipt = clone(result);
      }
    }
    observe();
    return result;
  }
  function follow(actions = [{ id: "follow", args: { dist: game.dist } }]) {
    if (!active()) throw Error("请先在离校现场进入正式尾行");
    if (recovery.pending) throw Error("她暂时离开视线，请先选择追找或停下");
    recovery.lastResult = null;
    if (!Array.isArray(actions) || !actions.length) throw Error("请先选择动作");
    const result = game.settleInput("", { actions });
    const lost = game._g.spatial.tracking === "lost";
    const terminal = game._g.route.here >= game._g.route.nodes.length - 1;
    if (
      !recovery.pending &&
      (lost ||
        terminal ||
        result.investigation ||
        game._g.alertEvent?.stage === 4)
    ) {
      const seen = game._g.spatial.lastSeen;
      const confirmedEnd =
        terminal &&
        game._g.spatial.tracking === "visual" &&
        seen?.placeId === game._g.route.nodes.at(-1);
      pendingEnd = {
        kind: lost
          ? "lost"
          : game._g.alertEvent?.stage === 4 || game._g.fleeing
            ? "escaped"
            : confirmedEnd
              ? "completed"
              : "ended",
        receipt: result.investigation,
      };
      try {
        execute(request("finish"));
      } finally {
        pendingEnd = null;
      }
      result.stats = snapshot();
    }
    return result;
  }
  function recover() {
    if (!active() || !recovery.pending) throw Error("当前没有可用的追找机会");
    recovery.pending = false;
    recovery.attempted = true;
    // 追找从远端重新建立目视，勉强过关也不能保留失败前的近距离。
    game._g.dist = "far";
    const r = follow([
      { id: "follow", name: "寻找她的身影", args: { dist: "far" } },
    ]);
    recovery.lastResult =
      game._g.spatial.tracking === "visual" ? "found" : "lost";
    r.stats = snapshot();
    return r;
  }
  function move(placeId) {
    return execute(request("move", undefined, { placeId }));
  }
  return {
    save,
    snapshot,
    request,
    execute,
    follow,
    recover,
    renameKnownRoute: (request) => game.renameKnownRoute(request),
    move,
    quote,
    acknowledgeOutcome: () => {
      if (outcome) outcome.acknowledged = true;
      return snapshot();
    },
    active,
    game,
    places,
  };
}
module.exports = { createPreview };
