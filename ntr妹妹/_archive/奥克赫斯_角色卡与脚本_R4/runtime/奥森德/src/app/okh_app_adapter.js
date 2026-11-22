/**
 * @module okh_app_adapter
 * @updated 2026-11-11 00:10
 * @status  implemented
 * @reason  纯控制器桥接、台账字符串与监听快照视图（时间结算规则已抽离至 okh_app_time.js）
 * @deps    OKHBackgroundModules.utils, OKH_APP_CONFIG, OKH_APP_TIME, OKH_APP_WORLD, OKHBackgroundAdapter
 * @provides { createController, runtimeConfig, settleTimeEffects, buildLedger, buildWatch }
 */
(function (root) {
  'use strict';

  const u = root.OKHBackgroundModules?.utils;
  const CFG = root.OKH_APP_CONFIG;
  const TIME = root.OKH_APP_TIME;
  const W = root.OKH_APP_WORLD;
  if (!u || !CFG || !TIME || !W || !root.OKHBackgroundAdapter) throw Error('adapter 依赖缺失');

  function runtimeConfig() {
    return CFG.buildConfig();
  }

  function createController(s = W.session()) {
    return root.OKHBackgroundAdapter.createController({
      config: runtimeConfig(),
      readWorld: async () => W.loadWorld(s) || await W.ensureWorld(false, s),
      commit: data => W.commit(s, data)
    });
  }

  function buildLedger(world) {
    const day = Math.floor(world.timeMin / 1440) + 1;
    const local = world.timeMin % 1440;
    const phase = u.phaseAt(world.timeMin, CFG.buildConfig());
    const label = CFG.PHASES.find(p => p.id === phase.id)?.label || phase.id;
    const clock = String(Math.floor(local / 60)).padStart(2, '0') + ':' + String(local % 60).padStart(2, '0');
    const here = Object.values(world.npcs).filter(n =>
      n.monitored === true && n.alive !== false && n.location === world.playerLocation
    );
    const lines = [
      '【第 ' + day + ' 天 · ' + label + ' · ' + clock + '】',
      '玩家位置：' + (CFG.LOCATIONS[world.playerLocation] || world.playerLocation),
      '同地点：' + (here.map(n => n.name).join('、') || '无'),
      '可用活动解除规则：' + Object.keys(CFG.buildConfig().releaseRules).join('、') +
        '。无匹配业务条件时使用 manualRelease，等待明确 finish/cancel。'
    ];
    if (!world.flags?.arrived_oakhaven) lines.push('行程状态：前传途中（尚未抵达奥克赫斯，镇内地点暂未开放）');
    if (world.flags?.playerRoomTarget && world.npcs?.[world.flags.playerRoomTarget]) {
      lines.push('夜间同房：' + world.npcs[world.flags.playerRoomTarget].name);
    }
    const manualActs = Object.values(world.npcs || {}).filter(n => n.activity?.migratedFromReleaseRule);
    if (manualActs.length) {
      lines.push('迁移改手动结束活动（请用 finish/cancel 释放）：' + manualActs.map(n =>
        n.name + '(' + n.id + '):' + n.activity.label + '[原规则 ' + n.activity.migratedFromReleaseRule + ']'
      ).join('；'));
    }
    // Give the model registered IDs and choices, instead of making it infer
    // event_resolve attributes from narrative text. Also covers old saves.
    for (const pending of Object.values(world.bg?.eventStates || {})) {
      if (pending.status !== 'pending') continue;
      const def = CFG.buildConfig().events.find(e => e.id === pending.definitionId);
      if (!def || def.mode !== 'interaction') continue;
      const choices = Object.keys(def.outcomes || {});
      if (def.allowCancel && !choices.includes('cancel')) choices.push('cancel');
      lines.push('待决事件：id=' + JSON.stringify(def.id) +
        (pending.npcId ? ' npc=' + JSON.stringify(pending.npcId) : '') +
        '；登记选项=' + choices.map(choice => JSON.stringify(choice)).join(' / ') +
        '。仅在玩家已经作出对应选择或行动后使用 event_resolve 申报；条件由后台校验。');
    }
    if (world.focusNpcId && world.npcs[world.focusNpcId]) lines.push('本轮聚焦：' + world.npcs[world.focusNpcId].name);
    if (world.playerState?.injury) lines.push('玩家伤情：' + world.playerState.injury.type);
    return lines.join('\n');
  }

  function buildWatch(world) {
    const monitored = root.OKHBackground.watch(world);
    return {
      timeMin: world.timeMin,
      day: Math.floor(world.timeMin / 1440) + 1,
      list: Object.values(monitored.npcs).map(n => ({
        id: n.id,
        name: n.name,
        location: n.location,
        hasStage: n.hasStage !== false,
        stage: n.hasStage === false ? null : (CFG.STAGES[n.stage] ?? n.stage),
        hasAffection: n.hasAffection !== false,
        affectionTier: n.hasAffection === false
          ? null
          : CFG.AFFECTION_TIERS[CFG.getAffectionTier(n.values?.affection)],
        values: u.clone(n.values),
        availability: n.availability,
        activity: n.activity?.label || null,
        sameLocation: n.location === world.playerLocation
      }))
    };
  }

  root.OKH_APP_ADAPTER = Object.freeze({
    createController,
    runtimeConfig,
    settleTimeEffects: TIME.settleTimeEffects,
    buildLedger,
    buildWatch
  });
})(globalThis);

;
