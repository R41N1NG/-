/**
 * @module okh_api
 * @updated 2026-11-20
 * @status active
 * @reason 核心 2.1.1，声明原子替换回复能力并保留统一初始化与迁移接口
 */
(function (root) {
  'use strict';

  const registry =
    root.OKHBackgroundModules ||= Object.create(null);

  for (const name of [
    'utils',
    'rules',
    'activity',
    'effects',
    'events',
    'nodes',
    'turn'
  ]) {
    if (!registry[name]) {
      throw Error(
        '缺少依赖：' + name + '，请按加载顺序注册模块'
      );
    }
  }

  const u = registry.utils;
  const rules = registry.rules({ utils: u });
  const activity = registry.activity({ utils: u, rules });
  const effects = registry.effects({ utils: u });

  const events = registry.events({
    utils: u,
    rules,
    effects
  });

  const nodes = registry.nodes({
    utils: u,
    rules,
    effects,
    events
  });

  const turn = registry.turn({
    utils: u,
    rules,
    activity,
    effects,
    events,
    nodes
  });

  function normalize(world, config) {
    world.flags ||= {};

    world.interactingIds = [
      ...u.listIds(
        world.interactingIds || [],
        world.npcs,
        '互动角色列表'
      )
    ];

    const actionIds = new Set(
      (config.actions || []).map(a => a.id)
    );

    const nodeIds = new Set(
      (config.nodes || []).map(n => n.id)
    );

    if (world.bg) world.bg.eventStates ||= {};
    for (const npc of Object.values(world.npcs)) {
      npc.values ||= {};
      npc.flags ||= {};
      if (npc.hasStage === false) delete npc.stage;
      else npc.stage ??= 0;
      npc.activity ??= null;
      npc.activityHistory ||= {};
      npc.nodeStates ||= {};

      for (const id of npc.plan || []) {
        u.check(
          actionIds.has(id),
          '角色引用了未知行动：' + id
        );
      }

      for (const id of npc.nodePlan || []) {
        u.check(
          nodeIds.has(id),
          '角色引用了未知节点：' + id
        );
      }

      if (npc.activity) {
        u.check(
          u.id(npc.activity.id) &&
          u.minute(npc.activity.startedAt) &&
          npc.activity.startedAt <= world.timeMin &&
          ['ordinary', 'important', 'special']
            .includes(npc.activity.kind),
          '存档活动状态非法'
        );

        if (
          npc.activity.releaseRule !== undefined
        ) {
          u.check(
            u.own(
              config.releaseRules || {},
              npc.activity.releaseRule
            ),
            '存档活动解除规则不存在'
          );
        }
      }
    }

    return world;
  }

  function init(world, config) {
    u.validateConfig(config);
    u.check(world && world.npcs && typeof world.npcs === 'object', '世界状态缺少角色表');

    u.check(
      !world.bg,
      '已初始化，禁止覆盖处理记录'
    );

    const state = normalize(u.clone(world), config);
    u.validateWorld(state);

    state.bg = {
      version: 2,
      revision: 0,
      receipts: {},
      settled: {},
      fired: {},
      eventStates: {},
      queue: [],
      generations: {}
    };

    return state;
  }

  function migrate(world, config) {
    u.validateConfig(config);
    u.check(
      world && world.npcs && world.bg?.version === 1,
      '只支持本示例v1到v2，原项目须另写映射'
    );

    const state = normalize(u.clone(world), config);
    u.validateWorld(state);
    const old = state.bg;
    const receipts = {};

    for (const [id, signature] of
      Object.entries(old.receipts || {})) {
      const [
        revision,
        toMin,
        sceneIds,
        front
      ] = JSON.parse(signature);

      receipts[id] = u.signature({
        revision,
        toMin,
        interactingIds: sceneIds || [],
        front: front ?? null
      });
    }

    const fired = {};

    for (const [id, value] of
      Object.entries(old.fired || {})) {
      const [definitionId, npcId] = JSON.parse(id);

      fired[
        u.key('event', definitionId, npcId)
      ] = value;
    }

    const queue = (old.queue || []).map(entry => ({
      ...entry,
      id: u.key(
        'event',
        entry.eventId,
        entry.npcId
      ),
      definitionId: entry.eventId,
      kind: 'event'
    }));

    state.bg = {
      version: 2,
      revision: 0,
      receipts,
      settled: {},
      fired,
      eventStates: {},
      queue,
      generations: {}
    };

    return state;
  }

  function watch(world) {
    const interacting = new Set(
      world.interactingIds || []
    );

    return u.clone({
      timeMin: world.timeMin,

      npcs: Object.fromEntries(
        Object.entries(world.npcs)
          .filter(([, npc]) => npc.monitored === true)
          .map(([id, npc]) => [
            id,
            {
              ...npc,
              availability:
                activity.status(npc, interacting)
            }
          ])
      )
    });
  }

  function ack(world, ids, generationId) {
    const state = u.clone(world);

    events.acknowledge(
      state,
      ids,
      generationId
    );

    state.bg.revision++;

    return state;
  }

  if (root.OKHBackground) {
    throw Error('重复加载 okh_api');
  }

  root.OKHBackground = Object.freeze({
    version: '2.1.1',
    features: Object.freeze({ activitySequences: true, timeEffects: true, receiptCommit: true, atomicReplyReplacement: true }),
    init,
    migrate,
    advance: turn.advance,
    prepare: events.prepare,
    ack,
    watch
  });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKHBackground;
  }
})(globalThis);
