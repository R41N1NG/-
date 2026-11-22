/**
 * @module okh_events
 * @updated 2026-11-09
 * @status implemented
 * @reason 条件事件和演绎队列，不访问HUD或调用LLM
 */
(function (root) {
  'use strict';

  function create({ utils: u, rules, effects }) {
    function emit(world, entry, npc) {
      if (
        world.bg.queue.some(item => item.id === entry.id)
      ) {
        return false;
      }

      const fields = {
        name: npc?.name || npc?.id || '',
        location: npc?.location || ''
      };

      world.bg.queue.push({
        ...entry,
        at: world.timeMin,
        npcId: npc?.id ?? null,
        text: entry.text.replace(
          /\{(name|location)\}/g,
          (_, name) => fields[name]
        ),
        status: 'pending'
      });

      return true;
    }

    function evaluate(world, config, ctx) {
      for (const event of config.events || []) {
        const targets = event.scope === 'world'
          ? [null]
          : u.sortedNpcs(world).filter(u.active);

        for (const npc of targets) {
          if (
            npc &&
            event.targets &&
            !event.targets.includes(npc.id)
          ) {
            continue;
          }

          const key = u.key(
            'event',
            event.id,
            npc?.id ?? null
          );

          if (world.bg.fired[key]) continue;

          if (
            npc &&
            event.idleOnly &&
            (
              npc.activity ||
              ctx.blockedIds.has(npc.id)
            )
          ) {
            continue;
          }

          if (
            !rules.matches(
              event.when,
              { ...ctx, world, npc }
            )
          ) {
            continue;
          }

          effects.apply(
            world,
            npc,
            event.effects,
            ctx,
            config
          );

          world.bg.fired[key] = true;

          emit(world, {
            id: key,
            definitionId: event.id,
            kind: 'event',
            mode: event.mode,
            text: event.text
          }, npc);
        }
      }
    }

    function prepare(world, limit = 8) {
      u.check(
        Number.isSafeInteger(limit) && limit > 0,
        '批次大小非法'
      );

      const batch = world.bg.queue
        .filter(e => e.status === 'pending')
        .slice(0, limit);

      return {
        ids: batch.map(e => e.id),

        text: batch.map(e => {
          const instruction = e.mode === 'result'
            ? '【已定事实：保持结果并演绎】'
            : '【待互动：只展开局面，不替玩家决定；未决结果须另行结算】';

          return instruction + '\n' + e.text;
        }).join('\n\n')
      };
    }

    function acknowledge(world, ids, generationId) {
      u.check(
        u.id(generationId) && Array.isArray(ids),
        '确认生成 ID 或事件批次非法'
      );

      const selected = new Set(ids);

      for (const id of selected) {
        u.check(
          world.bg.queue.some(e => e.id === id),
          '待确认事件不存在'
        );
      }

      for (const event of world.bg.queue) {
        if (
          selected.has(event.id) &&
          event.status === 'pending'
        ) {
          event.status = 'delivered';
          event.generationId = generationId;
        }
      }
    }

    function supersede(world, id) {
      const entry = world.bg.queue
        .find(e => e.id === id);

      if (entry?.status === 'pending') {
        entry.status = 'superseded';
      }
    }

    return {
      evaluate,
      emit,
      prepare,
      acknowledge,
      supersede
    };
  }

  const registry =
    root.OKHBackgroundModules ||= Object.create(null);

  if (registry.events) {
    throw Error('重复加载 okh_events');
  }

  registry.events = create;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = create;
  }
})(globalThis);
