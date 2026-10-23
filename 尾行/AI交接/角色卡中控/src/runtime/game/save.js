"use strict";
// save：依赖由 game.js 装配，每个游戏实例独立持有状态。

function createSaveSystem({ g, L, getSalt }) {
  function save() {
    return JSON.parse(
      JSON.stringify({
        v: 2,
        dayPlan: g.dayPlan,
        economy: g.economy,
        spatial: g.spatial,
        rngVersion: g.rngVersion,
        nightStartFloor: g.nightStartFloor || 0,
        envSfx: g._envSfx ?? null,
        sessionSalt: getSalt(),
        player: { ...g.player },
        target: { ...g.target },
        targetBase: { ...g.targetBase },
        targetId: g.targetId || "ol",
        targetKnowledge: g.targetKnowledge,
        targetPersona: g.targetPersona
          ? JSON.parse(JSON.stringify(g.targetPersona))
          : null,
        targetState: g.targetState
          ? JSON.parse(JSON.stringify(g.targetState))
          : null,
        dateCount: g.dateCount || 0,
        hotelVisitedCount: g.hotelVisitedCount || 0,
        lastHotelDate: g.lastHotelDate || null,
        inventory: JSON.parse(JSON.stringify(g.player.inventory || [])),
        nightDrinkUsed: !!g.nightDrinkUsed,
        mode: g.mode,
        dist: g.dist,
        env: g.env,
        slot: g.slot,
        world: { ...g.world },
        route: g.route ? JSON.parse(JSON.stringify(g.route)) : null,
        famSegs: { ...g.famSegs },
        tags: JSON.parse(JSON.stringify(g.tags || [])),
        identity: g.identity || null,
        tailing: !!g.tailing,
        nightPiGross: g.nightPiGross || 0,
        startKit: g.startKit || null,
        proxLogs: JSON.parse(JSON.stringify(g.proxLogs || [])),
        signals: JSON.parse(JSON.stringify(g.signals || [])),
        lastAssess: g.lastAssess || null,
        lastHerAlert: g.lastHerAlert || null,
        lastLedgerSummary: g.lastLedgerSummary || null,
        floor: g.floor || 0,
        consecFails: g.consecFails,
        alertLatch: (g.alertLatch || []).slice(),
        alertEvent: g.alertEvent || null,
        alertHold: g.alertHold || 0,
        fleeing: !!g.fleeing,
        album: JSON.parse(JSON.stringify(g.album || {})),
        setBonusDone: JSON.parse(JSON.stringify(g.setBonusDone || {})),
        captureSeq: g.captureSeq || 0,
        tickets: JSON.parse(JSON.stringify(g.tickets)),
        ticketsIssued: g.ticketsIssued,
        ledgerState: { ...L.state },
      }),
    );
  }

  return { save };
}

module.exports = { createSaveSystem };
