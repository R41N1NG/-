/**
 * @module okh_effects
 * @updated 2026-11-19 15:44
 * @status active
 * @reason 集中结算位置、数值、标记与物品增删；支持 alive 效果字段（死亡结算置 false 并同步关闭 monitored），确保角色存活状态受引擎规范管辖
 */
(function (root) {
  'use strict';

  function create({ utils: u }) {
    function one(world, npc, data, ctx, config) {
      const allowed = new Set([
        'move',
        'forceMove',
        'playerMove',
        'goldDelta',
        'itemsAdd',
        'itemsRemove',
        'add',
        'npcFlags',
        'worldFlags',
        'monitored',
        'alive'
      ]);

      Object.keys(data).forEach(name => {
        u.check(
          allowed.has(name),
          '未知效果字段：' + name
        );
      });

      u.check(
        npc ||
        (!data.add && !data.move && data.forceMove === undefined && !data.npcFlags && data.monitored === undefined && data.alive === undefined),
        '世界效果不能隐式修改角色'
      );

      if (data.goldDelta !== undefined) {
        u.check(!npc && Number.isSafeInteger(data.goldDelta), 'goldDelta 只能用于世界目标且须为整数');
        world.playerState ||= {};
        const currentGold = Number.isSafeInteger(world.playerState.gold) ? world.playerState.gold : 0;
        world.playerState.gold = Math.max(0, currentGold + data.goldDelta);
      }

      if (data.itemsAdd !== undefined) {
        u.check(!npc && Array.isArray(data.itemsAdd), 'itemsAdd 只能用于世界目标且须为数组');
        world.playerState ||= {};
        world.playerState.inventory = Array.isArray(world.playerState.inventory) ? world.playerState.inventory : [];
        const inv = world.playerState.inventory;
        const catalog = config?.itemCatalog;
        for (const spec of data.itemsAdd) {
          const itemId = typeof spec === 'string' ? spec : spec?.id;
          const delta = typeof spec === 'string' ? 1 : (spec?.count ?? 1);
          u.check(u.id(itemId) && Number.isSafeInteger(delta) && delta >= 1, 'itemsAdd 条目非法');
          u.check(!catalog || u.own(catalog, itemId), '禁止发放未注册物品：' + itemId);
          const meta = catalog?.[itemId];
          const existing = inv.find(entry => entry && entry.id === itemId);
          u.check(!existing || existing.custom !== true, '已注册物品 ID 与外部自定义物品冲突：' + itemId);
          if (meta?.stackable === false) {
            if (!existing) inv.push({ id: itemId, count: 1 });
            else existing.count = 1;
          } else {
            const maxCount = Number.isSafeInteger(meta?.maxCount) && meta.maxCount >= 1 ? meta.maxCount : 999;
            if (!existing) inv.push({ id: itemId, count: Math.min(maxCount, delta) });
            else existing.count = Math.min(maxCount, existing.count + delta);
          }
        }
      }

      if (data.itemsRemove !== undefined) {
        u.check(!npc && Array.isArray(data.itemsRemove), 'itemsRemove 只能用于世界目标且须为数组');
        world.playerState ||= {};
        world.playerState.inventory = Array.isArray(world.playerState.inventory) ? world.playerState.inventory : [];
        const inv = world.playerState.inventory;
        const catalog = config?.itemCatalog;
        for (const spec of data.itemsRemove) {
          const itemId = typeof spec === 'string' ? spec : spec?.id;
          const removeAll = typeof spec === 'object' && spec?.all === true;
          const delta = typeof spec === 'string' ? 1 : (spec?.count ?? 1);
          u.check(u.id(itemId) && (removeAll || (Number.isSafeInteger(delta) && delta >= 1)), 'itemsRemove 条目非法');
          u.check(!catalog || u.own(catalog, itemId), '禁止核销未注册物品：' + itemId);
          const idx = inv.findIndex(entry => entry && entry.id === itemId && entry.custom !== true);
          if (idx < 0) continue;
          if (removeAll || inv[idx].count <= delta) {
            inv.splice(idx, 1);
          } else {
            inv[idx].count -= delta;
          }
        }
      }

      if (data.playerMove !== undefined) {
        u.check(!npc && u.id(data.playerMove), 'playerMove 只能用于世界目标');
        if (typeof config?.canMove === 'function') {
          u.check(
            config.canMove(world, data.playerMove, null),
            '当前阶段禁止玩家移动至该地点：' + data.playerMove
          );
        }
        world.playerLocation = data.playerMove;
      }

      if (data.move !== undefined) {
        u.check(u.id(data.move), '移动目标地点非法');
        if (data.forceMove === true) {
          // 强剧情事件转场：若仅被普通活动占用则自动归档结束，避免与日常打杂或互动冲突抛错
          if (npc.activity && npc.activity.kind === 'ordinary') {
            npc.activityHistory ||= {};
            npc.activityHistory[npc.activity.id] = {
              ...npc.activity,
              status: 'finished',
              endedAt: world.timeMin,
              endReason: 'story-force-move'
            };
            npc.activity = null;
          }
          u.check(!npc.activity, '强剧情转场不能打断重要或特殊活动');
        } else {
          u.check(
            !ctx.blockedIds?.has(npc.id) &&
            !npc.activity,
            '不能后台移动互动中或被活动占用的角色'
          );
        }

        if (typeof config?.canMove === 'function') {
          u.check(
            config.canMove(world, data.move, npc),
            '当前阶段禁止移动至该地点：' + data.move
          );
        }

        npc.location = data.move;
      }

      for (const [name, delta] of
        Object.entries(data.add || {})) {
        u.check(
          npc.values && u.own(npc.values, name),
          '角色未声明专属数值：' + name
        );

        u.check(
          Number.isFinite(delta),
          '数值变化非法'
        );

        if (typeof config?.isMetricLocked === 'function' &&
            config.isMetricLocked(world, npc, name)) {
          continue;
        }

        let value = npc.values[name] + delta;

        u.check(
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

      if (data.monitored !== undefined) {
        u.check(typeof data.monitored === 'boolean', 'monitored 必须是布尔值');
        npc.monitored = data.monitored;
      }

      if (data.alive !== undefined) {
        u.check(typeof data.alive === 'boolean', 'alive 必须是布尔值');
        npc.alive = data.alive;
        if (data.alive === false) {
          npc.monitored = false;
        }
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
      if (typeof effect === 'function') {
        effect = effect({ world, npc: actor, ctx });
      }
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

