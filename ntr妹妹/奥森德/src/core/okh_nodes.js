/**
 * @module okh_nodes
 * @updated 2026-11-12 08:35
 * @status active
 * @reason 专属数值经节点推进阶段；跳过非阶段角色并回调 config.onStageChange
 */
(function (root) {
  'use strict';

  function create({ utils: u, rules, effects, events }) {
    const queueId = (node, npc) =>
      u.key('node', node.id, npc.id);

    function complete(
      world,
      npc,
      node,
      config,
      ctx,
      fromPending
    ) {
      u.check(
        npc.stage === node.fromStage,
        '节点完成时阶段已变化，需要处理冲突'
      );

      effects.apply(
        world,
        npc,
        node.effects,
        ctx,
        config
      );

      const prevStage = npc.stage;
      npc.stage = node.toStage;

      if (typeof config?.onStageChange === 'function') {
        config.onStageChange(world, npc, prevStage, node.toStage, ctx);
      }

      npc.nodeStates[node.id] = {
        ...npc.nodeStates[node.id],
        status: 'completed',
        completedAt: world.timeMin
      };

      if (fromPending) {
        events.supersede(world, queueId(node, npc));
      }

      if (node.covert === true) return;

      events.emit(world, {
        id: fromPending
          ? u.key('node-result', node.id, npc.id)
          : queueId(node, npc),
        kind: 'node',
        definitionId: node.id,
        mode: 'result',
        text: fromPending
          ? node.completionText
          : node.text
      }, npc);
    }

    function evaluate(world, config, ctx) {
      const definitions = [...(config.nodes || [])]
        .sort((a, b) =>
          (b.priority || 0) - (a.priority || 0) ||
          a.id.localeCompare(b.id)
        );

      for (const npc of
        u.sortedNpcs(world).filter(u.active)) {
        if (npc.hasStage === false || npc.stage === undefined) {
          continue;
        }
        npc.nodeStates ||= {};

        if (
          Object.values(npc.nodeStates)
            .some(record => record.status === 'pending')
        ) {
          continue;
        }

        const node = definitions.find(item =>
          (npc.nodePlan || []).includes(item.id) &&
          !u.own(npc.nodeStates, item.id) &&
          npc.stage === item.fromStage &&
          (item.requires || []).every(
            id =>
              npc.nodeStates[id]?.status === 'completed'
          ) &&
          rules.matches(
            item.when,
            { ...ctx, world, npc }
          )
        );

        if (!node) continue;

        npc.nodeStates[node.id] = {
          status: 'pending',
          triggeredAt: world.timeMin
        };

        if (node.mode === 'result') {
          complete(
            world,
            npc,
            node,
            config,
            ctx,
            false
          );
        } else {
          events.emit(world, {
            id: queueId(node, npc),
            kind: 'node',
            definitionId: node.id,
            mode: 'interaction',
            text: node.text
          }, npc);
        }
      }
    }

    function resolve(world, resolutions, config, ctx) {
      for (const resolution of resolutions || []) {
        const npc = world.npcs[resolution.npcId];

        const node = (config.nodes || [])
          .find(n => n.id === resolution.nodeId);

        u.check(
          npc &&
          npc.hasStage !== false &&
          node &&
          (npc.nodePlan || []).includes(node.id),
          '待处理节点或角色不存在'
        );

        const record = npc.nodeStates?.[node.id];

        u.check(record, '节点尚未触发');

        u.check(
          ['complete', 'cancel']
            .includes(resolution.outcome),
          '节点处理结果非法'
        );

        if (
          record.status === 'completed' &&
          resolution.outcome === 'complete'
        ) {
          continue;
        }

        if (
          record.status === 'cancelled' &&
          resolution.outcome === 'cancel'
        ) {
          continue;
        }

        u.check(
          record.status === 'pending',
          '节点已经处理，不能变更结果'
        );

        if (resolution.outcome === 'cancel') {
          record.status = 'cancelled';
          record.cancelledAt = world.timeMin;

          events.supersede(
            world,
            queueId(node, npc)
          );
        } else {
          complete(
            world,
            npc,
            node,
            config,
            ctx,
            true
          );
        }
      }
    }

    return { evaluate, resolve };
  }

  const registry =
    root.OKHBackgroundModules ||= Object.create(null);

  if (registry.nodes) {
    throw Error('重复加载 okh_nodes');
  }

  registry.nodes = create;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = create;
  }
})(globalThis);

