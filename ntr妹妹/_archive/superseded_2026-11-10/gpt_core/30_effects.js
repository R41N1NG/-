/**
 * @module okh_effects
 * @updated 2026-11-09
 * @status implemented
 * @reason 集中结算位置、专属数值和标记
 */
(function (root) {
  'use strict';

  function create({ utils: u }) {
    function one(world, npc, data, ctx, config) {
      const allowed = new Set([
        'move',
        'add',
        'npcFlags',
        'worldFlags'
      ]);

      Object.keys(data).forEach(name => {
        u.check(
          allowed.has(name),
          '未知效果字段：' + name
        );
      });

      u.check(
        npc ||
        (!data.add && !data.move && !data.npcFlags),
        '世界效果不能隐式修改角色'
      );

      if (data.move !== undefined) {
        u.check(
          u.id(data.move) &&
          !ctx.blockedIds.has(npc.id) &&
          !npc.activity,
          '不能后台移动互动中或被活动占用的角色'
        );

        npc.location = data.move;
      }

      for (const [name, delta] of
        Object.entries(data.add || {})) {
        u.check(
          npc.values && u.own(npc.values, name),
          '角色未声明专属数值：' + name
        );

        let value = npc.values[name] + delta;

        u.check(
          Number.isFinite(delta) &&
          Number.isFinite(value),
          '数值变化非法'
        );

        const bounds =
          config.metricBounds?.[npc.id]?.[name];

        if (bounds) {
          u.check(
            bounds.length === 2 &&
            bounds.every(Number.isFinite) &&
            bounds[0] <= bounds[1],
            '数值边界非法'
          );

          value = Math.max(
            bounds[0],
            Math.min(bounds[1], value)
          );
        }

        npc.values[name] = value;
      }

      if (npc) {
        npc.flags = {
          ...npc.flags,
          ...data.npcFlags
        };
      }

      world.flags = {
        ...world.flags,
        ...data.worldFlags
      };
    }

    function apply(world, actor, effect, ctx, config) {
      if (!effect) return;

      if (Array.isArray(effect)) {
        for (const item of effect) {
          u.check(
            u.own(item, 'target'),
            '跨目标效果必须显式指定 target'
          );

          const { target, ...data } = item;

          u.check(
            target === 'world' ||
            u.own(world.npcs, target),
            '效果目标不存在'
          );

          one(
            world,
            target === 'world'
              ? null
              : world.npcs[target],
            data,
            ctx,
            config
          );
        }
      } else {
        one(world, actor, effect, ctx, config);
      }
    }

    return { apply };
  }

  const registry =
    root.OKHBackgroundModules ||= Object.create(null);

  if (registry.effects) {
    throw Error('重复加载 okh_effects');
  }

  registry.effects = create;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = create;
  }
})(globalThis);
