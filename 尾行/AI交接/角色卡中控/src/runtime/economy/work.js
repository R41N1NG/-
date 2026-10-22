"use strict";
const RULES = require("../../config/rules.json");
const CONFIG = require("../../config/economy.json");
const error = (message) =>
  Object.assign(Error(message), { code: "DAY_UNAVAILABLE" });
function workOptions(ctx) {
  const identity = ctx.identity;
  const rows = Object.entries(CONFIG.jobs).map(([id, d]) => ({ id, ...d }));
  for (const [id, d] of Object.entries(RULES.identity.jobs)) {
    const base = d.baseJob ? CONFIG.jobs[d.baseJob] : d;
    rows.push({
      id,
      name: d.name,
      attr: d.attr,
      base: Math.round(base.base * (d.mult || 1)),
      pass: Math.round(base.pass * (d.mult || 1)),
      great: Math.round(base.great * (d.mult || 1)),
      stamina: d.cost?.stamina ?? base.stamina ?? 0,
      exclusive: d.exclusive,
      nativeMultiplier: d.nativeMult || 1,
    });
  }
  return rows.map((row) => {
    const native = CONFIG.nativeJobs[identity] === row.id;
    const mult = row.nativeMultiplier || (native ? CONFIG.nativeMultiplier : 1);
    let reason = row.pending || null;
    if (row.exclusive && identity !== row.exclusive) reason = "仅对应身份可接";
    if (identity === "criminal" && row.id !== "black_labor")
      reason = "当前身份只能接黑工";
    if (ctx.economy.workedOn === ctx.ledger.date)
      reason = "今天已经完成一班工作";
    if (ctx.ledger.stamina < row.stamina) reason = "体力不足以承担本次工作";
    if (identity === "guard" && row.id === "guard_shift") {
      const night = Math.floor((ctx.ledger.date - 1) / 7) % 2 === 1;
      if (night ? ctx.dayPlan.period < 3 : ctx.dayPlan.period > 2)
        reason = night
          ? "本周是夜班，请在晚间或子夜当班"
          : "本周是昼班，请在白天当班";
    }
    return {
      id: row.id,
      name: row.name,
      income: Math.round(row.base * mult),
      stamina: row.stamina,
      fixed: !!row.fixed,
      enabled: !reason,
      reason,
      note: row.fixed
        ? "固定工资，无需检定"
        : `当前按底薪结算；已定加薪档 ${Math.round(row.pass * mult)}${row.great ? " / " + Math.round(row.great * mult) : ""}，检定门槛待定`,
      tiers: {
        base: Math.round(row.base * mult),
        pass: row.pass ? Math.round(row.pass * mult) : null,
        great: row.great ? Math.round(row.great * mult) : null,
      },
    };
  });
}
const handler = {
  available: (ctx) =>
    workOptions(ctx).some((x) => x.enabled)
      ? null
      : ctx.economy.workedOn === ctx.ledger.date
        ? "今天已经完成一班工作"
        : "当前时段没有可接工作",
  view: (ctx) => ({
    type: "work",
    jobs: workOptions(ctx),
    note: "每天最多一班；确认后消耗 1 点并推进一个时段。",
  }),
  prepare(ctx, args) {
    const job = workOptions(ctx).find((x) => x.id === args.jobId);
    if (!job) throw error("请选择有效工种");
    if (!job.enabled) throw error(job.reason);
    const economy = JSON.parse(JSON.stringify(ctx.economy));
    economy.workedOn = ctx.ledger.date;
    economy.lastWork = {
      jobId: job.id,
      name: job.name,
      date: ctx.ledger.date,
      income: job.income,
      stamina: job.stamina,
    };
    return {
      summary: `${job.name}完成，收入 ${job.income}，体力消耗 ${job.stamina}`,
      ledger: { cash: job.income, stamina: -job.stamina },
      economy,
    };
  },
};
module.exports = { workOptions, handler };
