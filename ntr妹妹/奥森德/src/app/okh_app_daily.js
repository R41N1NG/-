/**
 * @module okh_app_daily
 * @reason 每日好感额度与工作冷却的只读诊断
 */
(function (root) {
  'use strict'

  const DATA = root.OKH_APP_DATA
  const AFFECTION_LIMIT = 3

  const affectionUsed = (flags, day) => flags?.dailyAffectionDay === day
    ? flags.dailyAffectionGain ?? 0
    : 0
  const affectionRemaining = used => Math.max(0, AFFECTION_LIMIT - used)
  const affectionFlags = (day, used = 0) => ({ dailyAffectionDay: day, dailyAffectionGain: used })

  function inspect(world) {
    const now = world.timeMin
    const day = Math.floor(now / 1440) + 1
    const nextDayAt = day * 1440
    const affection = Object.values(world.npcs).filter(npc => npc.hasAffection !== false).map(npc => {
      const used = affectionUsed(npc.flags, day)
      return { npc: npc.id, name: npc.name, used, remaining: affectionRemaining(used), limit: AFFECTION_LIMIT, nextDayAt }
    })
    const paidUsed = DATA.paidWorkSettledToday(world)
    const guildStarts = DATA.recentGuildStarts(world, now).sort((a, b) => a - b)
    const guildWindowWait = guildStarts.length >= DATA.WORK_LIMITS.guildStarts
      ? guildStarts.at(-DATA.WORK_LIMITS.guildStarts) + DATA.WORK_LIMITS.guildWindowDays * 1440 - now
      : 0
    return {
      day, timeMin: now, affection,
      work: {
        paidUsed, paidRemaining: paidUsed ? 0 : 1, nextDayAt,
        guildStartsInWindow: guildStarts.length,
        guildWaitMin: Math.max(guildWindowWait, DATA.workCooldownWait(world, 'lastGuildCommission', now, DATA.WORK_LIMITS.guildCooldownDays)),
        churchWaitMin: DATA.workCooldownWait(world, 'lastChurchErrand', now, DATA.WORK_LIMITS.churchCooldownDays)
      }
    }
  }

  root.OKH_APP_DAILY = Object.freeze({ affectionUsed, affectionRemaining, affectionFlags, inspect })
})(globalThis)
