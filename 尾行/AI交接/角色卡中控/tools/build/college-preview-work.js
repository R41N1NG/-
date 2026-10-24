"use strict";
// 用户暂定：仅独立预览试用DC15；正式底薪模块保持原规则。
const base = require("../../src/runtime/economy/work");
const CFG = require("../../src/config/economy.json");
const R = require("../../src/config/rules.json");
const C = require("../../src/runtime/checks");
const D = require("../../src/runtime/dice");
const WORK_DC = 15;
const names = {
  str: "体格",
  agi: "敏捷",
  int: "情报",
  cha: "口才",
  nrv: "胆量",
};
function createWorkHandler(seedContext) {
  return {
    available: base.handler.available,
    view(ctx) {
      const v = base.handler.view(ctx);
      for (const job of v.jobs)
        if (!job.fixed) {
          const d = CFG.jobs[job.id] || R.identity.jobs[job.id];
          job.note = `1d20 + ${names[d.attr]} vs DC${WORK_DC}；失败底薪${job.tiers.base}，成功${job.tiers.pass}，天然20 ${job.tiers.great || job.tiers.pass}`;
        }
      return v;
    },
    prepare(ctx, args) {
      const effect = base.handler.prepare(ctx, args),
        job = base.workOptions(ctx).find((j) => j.id === args.jobId);
      if (job.fixed) {
        effect.summary = `${job.name}完成，固定工资${job.income}，无需掷骰`;
        return effect;
      }
      const d = CFG.jobs[job.id] || R.identity.jobs[job.id],
        key = d.attr;
      const source = seedContext(),
        adv =
          ctx.player[key] >= R.advantage.attrThreshold ||
          (key === "int" && ctx.ledger.pi >= R.advantage.piThreshold);
      const roll = D.rollD20(
        D.actionSeed(
          source.salt,
          ctx.ledger.date,
          `preview-work:${ctx.dayPlan.period}:${job.id}`,
          source.rngVersion,
        ),
        adv ? "adv" : "normal",
      );
      const high =
          R.check.sweetHigh +
          (ctx.player.nrv >= R.advantage.attrThreshold
            ? R.advantage.sweetHighBonus
            : 0),
        sweet = C.heartLines(ctx.ledger.heart, high).sweet;
      const mods = sweet ? [{ src: "甜区专注", v: R.check.sweetBonus }] : [];
      const res = C.d20Check({
        d20: roll.d20,
        attr: ctx.player[key],
        mods,
        dc: WORK_DC,
      });
      const income =
        res.band === "nat20"
          ? job.tiers.great || job.tiers.pass || job.tiers.base
          : res.band === "success"
            ? job.tiers.pass || job.tiers.base
            : job.tiers.base;
      const check = {
        id: "daily.work",
        name: job.name,
        label: job.name,
        d20: roll.d20,
        raw: roll.raw,
        total: res.total,
        dc: WORK_DC,
        band: res.band,
        attr: { name: names[key], v: ctx.player[key] },
        mods,
        heartState: {
          value: ctx.ledger.heart,
          sweetLow: R.check.sweetLow,
          sweetHigh: high,
          sweet,
        },
        ledger: { applied: { cash: income, stamina: -job.stamina } },
      };
      effect.ledger.cash = income;
      effect.economy.lastWork = { ...effect.economy.lastWork, income, check };
      effect.summary = `${job.name}：1d20(${roll.d20})+${names[key]}${ctx.player[key]}${sweet ? "+甜区1" : ""}=${res.total}，DC${WORK_DC}，${res.band === "nat20" ? "大成功" : res.band === "success" ? "成功" : "底薪"}；收入${income}，体力消耗${job.stamina}`;
      return effect;
    },
  };
}
module.exports = { createWorkHandler, WORK_DC };
