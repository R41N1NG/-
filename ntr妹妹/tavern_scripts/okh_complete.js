// GENERATED: 修改 core/、app/ 后重新运行构建，不直接编辑合订本。
/**
 * @module okh_utils
 * @updated 2026-11-18 21:08
 * @status active
 * @reason 通用校验、深拷贝、时段；扩展 playerState.inventory 结构与去重校验（兼容已注册物品与外部 custom:true 条目）
 */
(function (root) {
  'use strict';

  const registry =
    root.OKHBackgroundModules ||= Object.create(null);

  if (registry.utils) {
    throw Error('重复加载 okh_utils');
  }

  const own = (object, name) =>
    Object.hasOwn(object, name);

  const check = (ok, message) => {
    if (!ok) throw Error(message);
  };

  const minute = value =>
    Number.isSafeInteger(value) && value >= 0;

  const id = value =>
    typeof value === 'string' &&
    value.length > 0 &&
    !['__proto__', 'prototype', 'constructor']
      .includes(value);

  function clone(value) {
    if (typeof structuredClone === 'function') {
      return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value, (_, item) => {
      check(
        typeof item !== 'number' || Number.isFinite(item),
        '状态含非有限数值'
      );
      check(
        typeof item !== 'function',
        '函数只能放在配置，不能放在存档'
      );
      return item;
    }));
  }

  function phaseAt(time, config) {
    const day = Math.floor(time / 1440);
    const local = time % 1440;

    let index = config.phases.length - 1;

    while (config.phases[index].start > local) {
      index--;
    }

    const phase = config.phases[index];

    return {
      id: phase.id,
      start: day * 1440 + phase.start,
      end: day * 1440 +
        (config.phases[index + 1]?.start ?? 1440)
    };
  }

  function active(npc) {
    return npc.monitored === true &&
      npc.alive !== false;
  }

  function listIds(list, npcs, label) {
    check(Array.isArray(list), label + '必须是数组');

    list.forEach(value => {
      check(
        id(value) && own(npcs, value),
        label + '含未知角色'
      );
    });

    return new Set(list);
  }

  function unique(items, label) {
    const seen = new Set();

    for (const item of items || []) {
      check(
        id(item.id) && !seen.has(item.id),
        label + ' ID 缺失或重复'
      );
      seen.add(item.id);
    }
  }

  function validateConfig(config) {
    check(
      config &&
      Array.isArray(config.phases) &&
      config.phases[0]?.start === 0,
      '时段必须从每日第 0 分钟开始'
    );

    unique(config.phases, '时段');

    config.phases.forEach((p, i) => {
      check(
        minute(p.start) &&
        p.start < 1440 &&
        (!i || p.start > config.phases[i - 1].start),
        '时段必须递增且在一天以内'
      );
    });

    check(
      Number.isSafeInteger(
        config.policy?.ordinaryGraceMin
      ) &&
      config.policy.ordinaryGraceMin > 0,
      '请配置正整数普通活动保护时长 ordinaryGraceMin'
    );

    check(
      config.maxSteps === undefined ||
      (
        Number.isSafeInteger(config.maxSteps) &&
        config.maxSteps > 0
      ),
      'maxSteps 必须是正整数'
    );

    for (const name of ['actions', 'events', 'nodes']) {
      check(
        config[name] === undefined ||
        Array.isArray(config[name]),
        name + '必须是数组'
      );
      unique(config[name], name);
    }

    function validateEventOutcomes(event) {
      check(
        event.repeatable === undefined || typeof event.repeatable === 'boolean',
        '事件 repeatable 必须是布尔值'
      );
      check(
        event.expireWhen === undefined ||
        typeof event.expireWhen === 'function' ||
        (event.expireWhen && typeof event.expireWhen === 'object'),
        '事件 expireWhen 条件格式非法'
      );
      check(
        event.allowCancel === undefined || typeof event.allowCancel === 'boolean',
        '事件 allowCancel 必须是布尔值'
      );
      check(
        event.retryOnCancel === undefined || typeof event.retryOnCancel === 'boolean',
        '事件 retryOnCancel 必须是布尔值'
      );
      check(
        !event.retryOnCancel || event.allowCancel === true,
        '启用 retryOnCancel 时必须同时声明 allowCancel: true'
      );
      check(
        event.resolveWhen === undefined ||
        typeof event.resolveWhen === 'function' ||
        (event.resolveWhen && typeof event.resolveWhen === 'object'),
        '事件 resolveWhen 条件格式非法'
      );
      if (event.outcomes === undefined) return;
      check(
        event.mode === 'interaction',
        '只有待互动事件才允许配置 outcomes 选项表'
      );
      check(
        event.outcomes && typeof event.outcomes === 'object' && !Array.isArray(event.outcomes),
        '事件 outcomes 必须是对象'
      );
      const entries = Object.entries(event.outcomes);
      check(entries.length > 0, '事件 outcomes 不能为空对象');
      for (const [choiceId, spec] of entries) {
        check(
          id(choiceId) && spec && typeof spec === 'object' &&
          typeof spec.text === 'string' && spec.text.trim(),
          '事件选项必须配置合法 ID 和非空 text'
        );
        check(
          spec.when === undefined || typeof spec.when === 'function' || typeof spec.when === 'object',
          '事件选项 when 条件格式非法'
        );
        check(
          spec.effects === undefined || typeof spec.effects === 'function' || (spec.effects && typeof spec.effects === 'object'),
          '事件选项 effects 格式非法'
        );
      }
    }

    for (const event of [
      ...(config.events || []),
      ...(config.nodes || [])
    ]) {
      check(
        ['result', 'interaction'].includes(event.mode) &&
        typeof event.text === 'string' &&
        event.text.trim(),
        '事件或节点必须配置模式和文本'
      );

      check(
        !event.scope ||
        ['npc', 'world'].includes(event.scope),
        '事件 scope 非法'
      );
    }

    for (const event of config.events || []) {
      validateEventOutcomes(event);
    }

    for (const node of config.nodes || []) {
      check(
        minute(node.fromStage) &&
        minute(node.toStage) &&
        node.toStage > node.fromStage,
        '节点阶段必须向前推进'
      );

      if (node.mode === 'interaction') {
        check(
          typeof node.completionText === 'string' &&
          node.completionText.trim(),
          '待互动节点必须配置 completionText'
        );
      }
    }

    const nodeIds = new Set(
      (config.nodes || []).map(n => n.id)
    );

    for (const node of config.nodes || []) {
      for (const required of node.requires || []) {
        check(
          nodeIds.has(required) &&
          required !== node.id,
          '节点前置引用非法'
        );
      }
    }

    const visiting = new Set();
    const visited = new Set();

    function visit(node) {
      check(
        !visiting.has(node.id),
        '节点前置条件存在循环'
      );

      if (visited.has(node.id)) return;

      visiting.add(node.id);

      for (const required of node.requires || []) {
        visit(
          config.nodes.find(item => item.id === required)
        );
      }

      visiting.delete(node.id);
      visited.add(node.id);
    }

    for (const node of config.nodes || []) {
      visit(node);
    }
  }

  function validateWorld(world) {
    check(
      minute(world.timeMin) &&
      id(world.playerLocation) &&
      world.npcs,
      '世界状态缺少时间、玩家位置或角色表'
    );
    check(
      world.playerState === undefined ||
      (world.playerState && typeof world.playerState === 'object' &&
        (world.playerState.gold === undefined ||
          (Number.isSafeInteger(world.playerState.gold) && world.playerState.gold >= 0))),
      '玩家状态或金币数值非法'
    );
    if (world.playerState?.inventory !== undefined) {
      check(Array.isArray(world.playerState.inventory), '玩家物品栏必须是数组');
      const seenItemIds = new Set();
      for (const entry of world.playerState.inventory) {
        check(
          entry && typeof entry === 'object' &&
          id(entry.id) &&
          !seenItemIds.has(entry.id) &&
          Number.isSafeInteger(entry.count) && entry.count >= 1,
          '玩家物品栏条目格式非法或 ID 重复'
        );
        if (entry.custom === true) {
          check(
            typeof entry.name === 'string' && entry.name.trim().length > 0 &&
            (entry.category === undefined || entry.category === 'quest' || entry.category === 'supply'),
            '自定义物品条目缺少合法名称或分类'
          );
        }
        seenItemIds.add(entry.id);
      }
    }

    for (const [key, npc] of
      Object.entries(world.npcs)) {
      check(
        id(key) &&
        npc.id === key &&
        id(npc.location),
        '角色 ID 或位置非法'
      );

      check(
        npc.hasStage === false
          ? npc.stage === undefined
          : (npc.stage === undefined || minute(npc.stage)),
        '阶段配置或状态非法'
      );

      if (npc.activity) {
        check(
          id(npc.activity.id) &&
          minute(npc.activity.startedAt) &&
          npc.activity.startedAt <= world.timeMin &&
          ['ordinary', 'important', 'special']
            .includes(npc.activity.kind),
          '角色活动存档非法'
        );
      }

      for (const [name, value] of
        Object.entries(npc.values || {})) {
        check(
          id(name) && Number.isFinite(value),
          '角色专属数值非法'
        );
      }
    }
  }

  function sortedNpcs(world) {
    return Object.values(world.npcs)
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  function stable(value) {
    if (Array.isArray(value)) {
      return value.map(stable);
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.keys(value)
          .sort()
          .map(name => [name, stable(value[name])])
      );
    }

    return value;
  }

  registry.utils = Object.freeze({
    own,
    check,
    minute,
    id,
    clone,
    phaseAt,
    active,
    listIds,
    validateConfig,
    validateWorld,
    sortedNpcs,
    key: (...parts) => JSON.stringify(parts),
    signature: value => JSON.stringify(stable(value))
  });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = registry.utils;
  }
})(globalThis);


;
/**
 * @module okh_rules
 * @updated 2026-11-09
 * @status active
 * @reason 无副作用条件判断；缺少专属数值不视为零
 */
(function (root) {
  'use strict';

  function create({ utils: u }) {
    function compare(actual, expected) {
      if (
        !expected ||
        typeof expected !== 'object' ||
        Array.isArray(expected)
      ) {
        return actual === expected;
      }

      const operations = {
        eq: value => actual === value,
        ne: value => actual !== value,
        gt: value => actual > value,
        gte: value => actual >= value,
        lt: value => actual < value,
        lte: value => actual <= value
      };

      return Object.entries(expected)
        .every(([op, value]) => {
          u.check(
            u.own(operations, op),
            '未知比较运算：' + op
          );

          return actual !== undefined &&
            operations[op](value);
        });
    }

    function fields(actual, expected) {
      return Object.entries(expected || {})
        .every(([name, value]) =>
          actual &&
          u.own(actual, name) &&
          compare(actual[name], value)
        );
    }

    function matches(condition, ctx) {
      if (condition === undefined) return true;

      if (typeof condition === 'function') {
        return Boolean(condition(ctx));
      }

      u.check(
        condition && typeof condition === 'object',
        '条件必须是对象或可信配置函数'
      );

      const tests = {
        all: list =>
          list.every(item => matches(item, ctx)),

        any: list =>
          list.some(item => matches(item, ctx)),

        not: item => !matches(item, ctx),

        metrics: value =>
          fields(ctx.npc?.values, value),

        flags: value =>
          fields(ctx.npc?.flags, value),

        worldFlags: value =>
          fields(ctx.world.flags, value),

        time: value =>
          compare(ctx.world.timeMin, value),

        stage: value =>
          compare(ctx.npc?.stage, value),

        location: value =>
          (Array.isArray(value) ? value : [value])
            .includes(ctx.npc?.location),

        phase: value =>
          (Array.isArray(value) ? value : [value])
            .includes(ctx.phase.id),

        idle: value =>
          Boolean(
            !ctx.npc?.activity &&
            !ctx.blockedIds?.has(ctx.npc?.id)
          ) === value
      };

      return Object.entries(condition)
        .every(([name, value]) => {
          u.check(
            u.own(tests, name),
            '未知条件字段：' + name
          );
          return tests[name](value);
        });
    }

    return { matches, compare };
  }

  const registry =
    root.OKHBackgroundModules ||= Object.create(null);

  if (registry.rules) {
    throw Error('重复加载 okh_rules');
  }

  registry.rules = create;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = create;
  }
})(globalThis);


;
/**
 * @module okh_activity
 * @updated 2026-11-09
 * @status active
 * @reason 管理活动占用、普通保护期及重要活动解除
 */
(function (root) {
  'use strict';

  function create({ utils: u, rules }) {
    function finish(npc, now, reason) {
      if (!npc.activity) return false;

      npc.activityHistory ||= {};

      npc.activityHistory[npc.activity.id] = {
        endedAt: now,
        reason
      };

      npc.activity = null;
      return true;
    }

    function start(npc, input, now, config) {
      u.check(
        u.id(input.id) &&
        ['ordinary', 'important', 'special']
          .includes(input.kind),
        '活动 ID 或类型非法'
      );

      u.check(
        !u.own(input, 'endsAt') &&
        !u.own(input, 'durationMin'),
        '保护期由统一配置管理，不接受逐活动耗时'
      );

      // 同一活动重复申报，不刷新计时。
      // 已结束的同一活动，也不能重新启动。
      if (
        npc.activity?.id === input.id ||
        u.own(npc.activityHistory || {}, input.id)
      ) {
        return false;
      }

      u.check(
        !npc.activity || input.replace === true,
        '角色已有活动，不能隐式覆盖'
      );

      if (
        input.kind !== 'ordinary' &&
        input.releaseRule !== undefined
      ) {
        u.check(
          u.id(input.releaseRule) &&
          u.own(
            config.releaseRules || {},
            input.releaseRule
          ),
          '活动解除规则不存在'
        );
      }

      u.check(
        input.kind !== 'ordinary' ||
        input.releaseRule === undefined,
        '普通活动不使用单独解除规则'
      );

      if (npc.activity) {
        finish(npc, now, 'explicit-interruption');
      }

      npc.activity = {
        id: input.id,
        kind: input.kind,
        label: input.label || input.kind,
        source: input.source || 'narrative',
        startedAt: now
      };

      if (input.releaseRule !== undefined) {
        npc.activity.releaseRule = input.releaseRule;
      }

      return true;
    }

    function change(npc, input, now, config) {
      u.check(
        input &&
        u.id(input.id) &&
        ['start', 'finish', 'cancel'].includes(input.op),
        '活动变更 ID 或 op 非法'
      );

      if (input.op === 'start') {
        return start(npc, input, now, config);
      }

      if (
        u.own(npc.activityHistory || {}, input.id)
      ) {
        return false;
      }

      u.check(
        npc.activity?.id === input.id,
        '结束活动的 ID 与当前活动不一致'
      );

      return finish(
        npc,
        now,
        input.op === 'cancel'
          ? 'explicit-cancel'
          : 'explicit-finish'
      );
    }

    // Expiry is a clock operation, independent of event and release-rule checks.
    // Run it before receipts at the same timestamp can start another activity.
    function releaseExpiredOrdinary(world, config) {
      const released = [];

      for (const npc of u.sortedNpcs(world)) {
        if (!u.active(npc) || npc.activity?.kind !== 'ordinary') continue;
        if (world.timeMin - npc.activity.startedAt >= config.policy.ordinaryGraceMin) {
          finish(npc, world.timeMin, 'ordinary-timeout');
          released.push(npc.id);
        }
      }

      return released;
    }

    function refresh(world, config, ctx) {
      const released = releaseExpiredOrdinary(world, config);

      for (const npc of u.sortedNpcs(world)) {
        if (!u.active(npc)) continue;

        const task = npc.activity;
        if (!task || task.kind === 'ordinary') continue;

        if (
          task.kind !== 'ordinary' &&
          task.releaseRule !== undefined
        ) {
          u.check(
            u.own(
              config.releaseRules || {},
              task.releaseRule
            ),
            '活动解除规则被删除，不能自动释放占用'
          );
        }

        const conditionMet =
          task.kind !== 'ordinary' &&
          task.releaseRule !== undefined &&
          rules.matches(
            config.releaseRules[task.releaseRule],
            { ...ctx, world, npc }
          );

        if (conditionMet) {
          finish(
            npc,
            world.timeMin,
            'release-condition'
          );

          released.push(npc.id);
        }
      }

      return released;
    }

    function nextDeadline(world, config) {
      let next = Infinity;

      for (const npc of Object.values(world.npcs)) {
        if (
          !u.active(npc) ||
          npc.activity?.kind !== 'ordinary'
        ) {
          continue;
        }

        const deadline =
          npc.activity.startedAt +
          config.policy.ordinaryGraceMin;

        u.check(
          u.minute(deadline),
          '活动保护期溢出'
        );

        if (deadline > world.timeMin) {
          next = Math.min(next, deadline);
        }
      }

      return next;
    }

    function status(npc, interactingIds) {
      if (!u.active(npc)) return 'inactive';

      if (interactingIds.has(npc.id)) {
        return 'interacting';
      }

      return npc.activity?.kind || 'idle';
    }

    return {
      start,
      change,
      finish,
      releaseExpiredOrdinary,
      refresh,
      nextDeadline,
      status
    };
  }

  const registry =
    root.OKHBackgroundModules ||= Object.create(null);

  if (registry.activity) {
    throw Error('重复加载 okh_activity');
  }

  registry.activity = create;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = create;
  }
})(globalThis);


;

;
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


;
/**
 * @module okh_events
 * @updated 2026-11-12 23:25
 * @status active
 * @reason 条件事件、待互动选择与选项适用条件校验、原子结算（含 playerState 与 repeatable/expireWhen 支持）及队列覆盖，不访问HUD或调用LLM
 */
(function (root) {
  'use strict';

  function create({ utils: u, rules, effects }) {
    function emit(world, entry, npc) {
      const hasActive = world.bg.queue.some(item =>
        item.id === entry.id &&
        (entry.allowReemit
          ? (item.status === 'pending' || item.status === 'delivered')
          : true)
      );

      if (hasActive) return false;

      const fields = {
        name: npc?.name || npc?.id || '',
        location: npc?.location || ''
      };

      const record = {
        ...entry,
        at: world.timeMin,
        npcId: npc?.id ?? null,
        text: entry.text.replace(
          /\{(name|location)\}/g,
          (_, name) => fields[name]
        ),
        status: 'pending'
      };
      delete record.allowReemit;

      world.bg.queue.push(record);
      return true;
    }

    // Definition keys stay stable for rule lookup. Queue IDs identify one
    // occurrence, so an earlier generation cannot acknowledge a later retry.
    function nextOccurrence(world, event, npc, key) {
      const previous = world.bg.eventStates[key];
      const priorCount = Number.isSafeInteger(previous?.occurrence)
        ? previous.occurrence : (previous ? 1 : 0);
      const queuedCount = world.bg.queue.filter(entry =>
        entry.kind === 'event' && entry.mode === 'interaction' &&
        entry.definitionId === event.id && entry.npcId === (npc?.id ?? null)
      ).length;
      const occurrence = Math.max(priorCount, queuedCount) + 1;
      u.check(Number.isSafeInteger(occurrence) && occurrence > 0, '事件实例编号溢出');
      return {
        occurrence,
        // Preserve first-occurrence IDs and legacy pending saves.
        instanceId: occurrence === 1 ? key
          : u.key('event-instance', event.id, npc?.id ?? null, occurrence)
      };
    }

    function expirePending(world, config, ctx) {
      world.bg.eventStates ||= {};

      for (const event of config.events || []) {
        if (!event.expireWhen) continue;
        const targets = event.scope === 'world'
          ? [null]
          : u.sortedNpcs(world).filter(u.active);

        for (const npc of targets) {
          if (npc && event.targets && !event.targets.includes(npc.id)) continue;

          const key = u.key('event', event.id, npc?.id ?? null);
          const existingState = world.bg.eventStates[key];
          if (existingState?.status === 'pending' &&
              rules.matches(event.expireWhen, { ...ctx, world, npc })) {
            existingState.status = 'cancelled';
            existingState.outcome = 'expired';
            existingState.cancelledAt = world.timeMin;
            supersede(world, existingState.instanceId || key);
            if (event.repeatable === true) delete world.bg.fired[key];
          }
        }
      }
    }

    function evaluate(world, config, ctx) {
      expirePending(world, config, ctx);

      for (const event of config.events || []) {
        const targets = event.scope === 'world'
          ? [null]
          : u.sortedNpcs(world).filter(u.active);

        for (const npc of targets) {
          if (npc && event.targets && !event.targets.includes(npc.id)) continue;

          const key = u.key('event', event.id, npc?.id ?? null);
          if (world.bg.fired[key]) continue;

          if (npc && event.idleOnly && (npc.activity || ctx.blockedIds.has(npc.id))) {
            continue;
          }

          if (!rules.matches(event.when, { ...ctx, world, npc })) continue;

          effects.apply(world, npc, event.effects, ctx, config);
          if (event.repeatable === true && event.mode === 'result') {
            const prev = world.bg.eventStates[key];
            const occurrence = (Number.isSafeInteger(prev?.occurrence) ? prev.occurrence : 0) + 1;
            world.bg.eventStates[key] = {
              status: 'resolved',
              definitionId: event.id,
              npcId: npc?.id ?? null,
              resolvedAt: world.timeMin,
              occurrence
            };
            emit(world, {
              id: occurrence === 1 ? key : u.key('event', event.id, npc?.id ?? null, occurrence),
              definitionId: event.id,
              kind: 'event',
              mode: event.mode,
              text: event.text,
              allowReemit: true
            }, npc);
            continue;
          }

          world.bg.fired[key] = true;

          if (event.mode === 'interaction') {
            const { occurrence, instanceId } = nextOccurrence(world, event, npc, key);
            world.bg.eventStates[key] = {
              status: 'pending',
              definitionId: event.id,
              npcId: npc?.id ?? null,
              triggeredAt: world.timeMin,
              occurrence,
              instanceId
            };
            emit(world, {
              id: instanceId,
              eventKey: key,
              occurrence,
              definitionId: event.id,
              kind: 'event',
              mode: event.mode,
              text: event.text
            }, npc);
          } else {
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
    }

    function prepare(world, limit = 8) {
      u.check(Number.isSafeInteger(limit) && limit > 0, '批次大小非法');

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
      u.check(u.id(generationId) && Array.isArray(ids), '确认生成 ID 或事件批次非法');
      const selected = new Set(ids);

      for (const id of selected) {
        u.check(world.bg.queue.some(e => e.id === id), '待确认事件不存在');
      }

      for (const event of world.bg.queue) {
        if (selected.has(event.id) && event.status === 'pending') {
          event.status = 'delivered';
          event.generationId = generationId;
        }
      }
    }

    function supersede(world, id) {
      for (const entry of world.bg.queue) {
        if (entry.id === id && (entry.status === 'pending' || entry.status === 'delivered')) {
          entry.status = 'superseded';
        }
      }
    }

    function checkTargetMatch(event, draft, npcId) {
      if (event.scope === 'world') {
        u.check(npcId === null, '世界事件不能指定角色目标');
        return null;
      }
      u.check(Boolean(npcId) && (!event.targets || event.targets.includes(npcId)), '事件目标角色不匹配');
      const npc = draft.npcs[npcId];
      u.check(Boolean(npc), '事件目标角色不存在');
      return npc;
    }

    function applyOneResolution(draft, resolution, config, ctx) {
      const event = (config.events || []).find(item => item.id === resolution.eventId);
      u.check(event && event.mode === 'interaction', '待处理事件不存在或不是待互动事件');

      const npcId = resolution.npcId ?? null;
      const npc = checkTargetMatch(event, draft, npcId);
      const key = u.key('event', event.id, npcId);
      const record = draft.bg.eventStates[key];
      u.check(record, '互动事件尚未触发');

      const outcome = resolution.outcome;
      u.check(u.id(outcome), '事件处理结果非法');

      if ((record.status === 'resolved' || record.status === 'cancelled') && record.outcome === outcome) {
        return;
      }
      u.check(record.status === 'pending', '事件已经处理，不能变更结果');
      u.check(!npc || event.allowInactive || u.active(npc), '事件目标角色当前不可交互');

      const matchCtx = { ...ctx, world: draft, npc };
      const spec = event.outcomes && u.own(event.outcomes, outcome)
        ? event.outcomes[outcome] : undefined;
      const isCancel = outcome === 'cancel' && !spec;

      if (isCancel) {
        u.check(event.allowCancel === true, '该事件不允许取消，请选择有效选项');
        u.check(!event.resolveWhen || rules.matches(event.resolveWhen, matchCtx), '当前条件不满足取消该事件');
        record.status = 'cancelled';
        record.outcome = 'cancel';
        record.cancelledAt = draft.timeMin;
        supersede(draft, record.instanceId || key);
        if (event.retryOnCancel === true) delete draft.bg.fired[key];
        return;
      }

      u.check(Boolean(spec), '未登记的事件选项：' + outcome);
      u.check(!event.resolveWhen || rules.matches(event.resolveWhen, matchCtx), '当前条件不满足处理该事件');
      u.check(!spec.when || rules.matches(spec.when, matchCtx), '当前条件不满足该事件选项：' + outcome);

      if (spec.effects) effects.apply(draft, npc, spec.effects, matchCtx, config);

      record.status = 'resolved';
      record.outcome = outcome;
      record.resolvedAt = draft.timeMin;
      supersede(draft, record.instanceId || key);
      if (event.repeatable === true) delete draft.bg.fired[key];

      if (spec.text) {
        emit(draft, {
          id: record.occurrence > 1
            ? u.key('event-result', event.id, npcId, outcome, record.occurrence)
            : u.key('event-result', event.id, npcId, outcome),
          instanceId: record.instanceId || key,
          kind: 'event',
          definitionId: event.id,
          mode: 'result',
          text: spec.text,
          allowReemit: true
        }, npc);
      }
    }

    function resolve(world, resolutions, config, ctx) {
      if (!resolutions?.length) return;
      const draft = u.clone(world);
      draft.bg.eventStates ||= {};

      for (const resolution of resolutions) {
        applyOneResolution(draft, resolution, config, ctx);
      }

      // 全批通过校验后原子写回，保证任意单项失败时不残留部分修改
      world.playerLocation = draft.playerLocation;
      world.playerState = draft.playerState;
      world.flags = draft.flags;
      world.npcs = draft.npcs;
      world.bg = draft.bg;
    }

    return { evaluate, expirePending, resolve, emit, prepare, acknowledge, supersede };
  }

  const registry = root.OKHBackgroundModules ||= Object.create(null);
  if (registry.events) throw Error('重复加载 okh_events');
  registry.events = create;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = create;
  }
})(globalThis);

;

;
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


;
/**
 * @module okh_turn
 * @updated 2026-11-13 01:25
 * @status active
 * @reason 统一时间语义的回执时间线穿插引擎；支持 front.economies 时间桶接入 config.resolveEconomy，移除冗余 playerInjury 处理
 */
(function (root) {
  'use strict';

  function create({ utils: u, rules, activity, effects, events, nodes }) {
    function syncWorld(world, blockedIds, reason, config) {
      if (typeof config?.syncWorld !== 'function') return;
      config.syncWorld(world, {
        blockedIds,
        phase: u.phaseAt(world.timeMin, config),
        activity,
        reason
      });
    }

    function refresh(world, config, blockedIds, report) {
      const ctx = { world, phase: u.phaseAt(world.timeMin, config), blockedIds };
      report.released.push(...activity.refresh(world, config, ctx));
      events.evaluate(world, config, ctx);
      nodes.evaluate(world, config, ctx);
      if (typeof events.expirePending === 'function') events.expirePending(world, config, ctx);
      report.released.push(...activity.refresh(world, config, ctx));
      syncWorld(world, blockedIds, 'refresh', config);
    }

    function pickAction(snapshot, npc, phase, blockedIds, config) {
      const ctx = { world: snapshot, npc, phase, blockedIds };
      return (config.actions || [])
        .filter(item =>
          (npc.plan || []).includes(item.id) &&
          rules.matches(item.when, ctx) &&
          (!config.allowed || config.allowed(ctx, item)) &&
          (!config.canMove || !item.effects?.move || config.canMove(snapshot, item.effects.move, npc))
        )
        .sort((a, b) => (b.priority || 0) - (a.priority || 0) || a.id.localeCompare(b.id))[0];
    }

    function schedule(world, config, blockedIds, report) {
      const phase = u.phaseAt(world.timeMin, config);
      const snapshot = u.clone(world);
      const decisions = [];

      for (const npc of u.sortedNpcs(snapshot)) {
        if (activity.status(npc, blockedIds) !== 'idle' || world.bg.settled[npc.id] === phase.start) {
          continue;
        }
        decisions.push({ id: npc.id, action: pickAction(snapshot, npc, phase, blockedIds, config) });
      }

      for (const { id, action } of decisions) {
        world.bg.settled[id] = phase.start;
        if (!action) continue;
        const npc = world.npcs[id];
        if (activity.status(npc, blockedIds) !== 'idle') continue;
        const ctx = { world, npc, phase, blockedIds };
        if (!rules.matches(action.when, ctx)) continue;
        if (config.allowed && !config.allowed(ctx, action)) continue;
        if (config.canMove && action.effects?.move && !config.canMove(world, action.effects.move, npc)) continue;

        effects.apply(world, npc, action.effects, ctx, config);
        if (action.occupation) {
          activity.start(npc, {
            ...action.occupation,
            id: u.key('action', action.id, id, world.timeMin),
            source: 'background'
          }, world.timeMin, config);
        }
        npc.lastAction = { id: action.id, at: world.timeMin };
        if (action.narration) {
          u.check(typeof action.narration === 'string', '行动反馈必须是预设文本');
          events.emit(world, {
            id: u.key('action', action.id, id, world.timeMin),
            kind: 'action', definitionId: action.id, mode: 'result', text: action.narration
          }, npc);
        }
        report.actions.push({ npcId: id, actionId: action.id, at: world.timeMin });
      }
      syncWorld(world, blockedIds, 'schedule', config);
    }

    function assertCanMove(world, to, npc, config) {
      if (typeof config?.canMove === 'function') {
        u.check(config.canMove(world, to, npc), '当前阶段禁止移动至该地点：' + to);
      }
    }

    function resolveAt(spec, fallback, fromMin, toMin) {
      if (spec === undefined || spec === null || spec === '') return fallback;
      if (spec === 'start') return fromMin;
      if (spec === 'end') return toMin;
      u.check(Number.isSafeInteger(spec) && spec >= fromMin && spec <= toMin, '回执时间点超出本轮推进区间');
      return spec;
    }

    function getBucket(map, t) {
      if (!map.has(t)) {
        map.set(t, {
          prologueSteps: [], moves: [], patches: [], meta: null,
          bonds: [], economies: [], room: null, resolveNodes: [], resolveEvents: [], activities: []
        });
      }
      return map.get(t);
    }

    function collectTimeline(world, front, fromMin, toMin) {
      const map = new Map();

      for (const step of front.prologueSteps || []) {
        const flag = typeof step === 'string' ? step : step?.flag;
        const specAt = typeof step === 'string' ? undefined : step?.at;
        const at = resolveAt(specAt, toMin, fromMin, toMin);
        getBucket(map, at).prologueSteps.push(flag);
      }

      for (const item of front.resolveNodes || []) {
        getBucket(map, resolveAt(item.at, fromMin, fromMin, toMin)).resolveNodes.push(item);
      }

      for (const item of front.resolveEvents || []) {
        getBucket(map, resolveAt(item.at, fromMin, fromMin, toMin)).resolveEvents.push(item);
      }

      const playerMoves = front.playerMoves || (front.playerLocation !== undefined
        ? [{ to: front.playerLocation, at: front.playerLocationAt }] : []);
      for (const m of playerMoves) {
        u.check(u.id(m.to), '玩家位置非法');
        getBucket(map, resolveAt(m.at, toMin, fromMin, toMin)).moves.push({ npcId: null, to: m.to });
      }

      for (const [id, patch] of Object.entries(front.npcs || {})) {
        u.check(u.own(world.npcs, id), '前台回执角色不存在');
        u.check(!u.own(patch, 'stage'), '阶段只能由节点推进，不能由前台直接覆盖');
        const moves = patch.moves || (patch.location !== undefined ? [{ to: patch.location, at: patch.locationAt }] : []);
        for (const m of moves) {
          u.check(u.id(m.to), '角色位置非法');
          getBucket(map, resolveAt(m.at, toMin, fromMin, toMin)).moves.push({ npcId: id, to: m.to });
        }
        if (patch.add || patch.flags) {
          getBucket(map, resolveAt(patch.effectsAt, toMin, fromMin, toMin)).patches.push({
            id, add: patch.add, npcFlags: patch.flags
          });
        }
        const tasks = patch.activities || (patch.activity ? [patch.activity] : []);
        u.check(Array.isArray(tasks), '活动变更必须是数组');
        for (const task of tasks) {
          getBucket(map, resolveAt(task.at, toMin, fromMin, toMin)).activities.push({ npcId: id, task });
        }
      }

      for (const bond of front.bonds || []) {
        getBucket(map, resolveAt(bond.at, toMin, fromMin, toMin)).bonds.push(bond);
      }

      for (const eco of front.economies || []) {
        getBucket(map, resolveAt(eco.at, toMin, fromMin, toMin)).economies.push(eco);
      }

      if (front.room) {
        getBucket(map, resolveAt(front.room.at, toMin, fromMin, toMin)).room = front.room;
      }

      const hasMeta = front.flags || front.focusNpcId !== undefined ||
        front.clockState !== undefined || front.timeCheck !== undefined;
      if (hasMeta) {
        getBucket(map, resolveAt(front.metaAt, toMin, fromMin, toMin)).meta = {
          flags: front.flags, focusNpcId: front.focusNpcId,
          clockState: front.clockState, timeCheck: front.timeCheck
        };
      }

      return map;
    }

    function applyMeta(world, meta) {
      if (!meta) return;
      if (meta.flags) world.flags = { ...world.flags, ...meta.flags };
      if (meta.focusNpcId !== undefined) {
        u.check(u.own(world.npcs, meta.focusNpcId), '聚焦角色不存在');
        world.focusNpcId = meta.focusNpcId;
      }
      if (meta.clockState !== undefined) {
        u.check(u.minute(meta.clockState.count) && u.minute(meta.clockState.creditedMin), '时间保底状态非法');
        world.bg.clockState = u.clone(meta.clockState);
      }
      if (meta.timeCheck !== undefined) world.bg.lastTimeCheck = u.clone(meta.timeCheck);
    }

    function applyBucketMoves(world, moves, blockedIds, config) {
      const ordered = [
        ...moves.filter(m => !m.npcId),
        ...moves.filter(m => Boolean(m.npcId))
      ];
      let syncedAfterPlayer = false;
      for (const m of ordered) {
        if (m.npcId && !syncedAfterPlayer) {
          syncWorld(world, blockedIds, 'bucketPlayerMove', config);
          syncedAfterPlayer = true;
        }
        const npc = m.npcId ? world.npcs[m.npcId] : null;
        assertCanMove(world, m.to, npc, config);
        if (npc) npc.location = m.to;
        else world.playerLocation = m.to;
      }
      syncWorld(world, blockedIds, 'bucketMove', config);
    }

    function applyBucket(world, bucket, config, blockedIds) {
      if (!bucket) return;
      if (bucket.prologueSteps.length && typeof config.applyPrologueSteps === 'function') {
        const changes = config.applyPrologueSteps(world, bucket.prologueSteps, { blockedIds, config }) || [];
        for (const ch of changes) {
          const targetNpc = ch.target && ch.target !== 'world' ? world.npcs[ch.target] : null;
          if (ch.move !== undefined && targetNpc?.activity?.kind === 'ordinary') {
            activity.finish(targetNpc, world.timeMin, 'prologue-milestone');
          }
        }
        effects.apply(world, null, changes, { blockedIds: new Set() }, config);
      }

      applyBucketMoves(world, bucket.moves, blockedIds, config);

      for (const p of bucket.patches) {
        effects.apply(world, world.npcs[p.id], { add: p.add, npcFlags: p.npcFlags }, { blockedIds }, config);
      }
      applyMeta(world, bucket.meta);

      const ctx = { world, phase: u.phaseAt(world.timeMin, config), blockedIds };
      if (bucket.bonds.length && typeof config.resolveBonds === 'function') {
        const changes = config.resolveBonds(world, bucket.bonds, ctx);
        effects.apply(world, null, changes || [], { blockedIds }, config);
      }

      if (bucket.economies.length && typeof config.resolveEconomy === 'function') {
        const changes = config.resolveEconomy(world, bucket.economies, ctx);
        effects.apply(world, null, changes || [], { blockedIds }, config);
      }

      const checkRoom = Boolean(bucket.room || world.flags?.playerRoomTarget);
      if (checkRoom && typeof config.resolveRoom === 'function') {
        const changes = config.resolveRoom(world, bucket.room || null, ctx);
        effects.apply(world, null, changes || [], { blockedIds }, config);
      }

      if (bucket.resolveNodes.length) nodes.resolve(world, bucket.resolveNodes, config, ctx);
      if (bucket.resolveEvents.length) events.resolve(world, bucket.resolveEvents, config, ctx);

      for (const { npcId, task } of bucket.activities) {
        const cleanTask = { ...task };
        delete cleanTask.at;
        activity.change(world.npcs[npcId], cleanTask, world.timeMin, config);
      }
      syncWorld(world, blockedIds, 'bucketEnd', config);
    }

    function initialBlockedIds(state, command, front) {
      const initialIds = command.interactingIds ?? command.sceneIds ?? state.interactingIds ?? [];
      const blockedIds = u.listIds(initialIds, state.npcs, '互动角色列表');
      state.interactingIds = [...blockedIds];

      for (const [id, patch] of Object.entries(front.npcs || {})) {
        u.check(u.own(state.npcs, id), '前台回执角色不存在');
        const npc = state.npcs[id];
        const tasks = patch.activities || (patch.activity ? [patch.activity] : []);
        for (const task of tasks) {
          if (task?.op === 'start' && npc.activity?.id !== task.id &&
              !u.own(npc.activityHistory || {}, task.id)) {
            blockedIds.add(id);
          }
        }
      }
      return blockedIds;
    }

    function advance(world, command, config) {
      u.validateConfig(config);
      u.validateWorld(world);
      u.check(world.bg?.version === 2, '请先初始化，旧版状态须显式迁移');
      u.check(u.id(command.id) && u.id(command.revision), '需要稳定聊天消息 ID 和回复版本');

      const signature = u.signature({
        revision: command.revision,
        toMin: command.toMin,
        interactingIds: command.interactingIds ?? command.sceneIds ?? [],
        front: command.front ?? null
      });

      const previous = world.bg.receipts[command.id];
      if (previous !== undefined) {
        u.check(previous === signature, 'REPLAY_REQUIRED：先恢复该消息之前的检查点');
        return {
          state: u.clone(world),
          before: null,
          report: { duplicate: true, released: [], actions: [] },
          duplicate: true
        };
      }

      u.check(u.minute(command.toMin) && command.toMin >= world.timeMin, '时间倒退须恢复检查点，不能直接减时钟');

      const state = u.clone(world);
      const front = command.front || {};
      const blockedIds = initialBlockedIds(state, command, front);
      const fromMin = state.timeMin;
      const timeline = collectTimeline(state, front, fromMin, command.toMin);
      const report = { duplicate: false, released: [], actions: [] };

      report.released.push(...activity.releaseExpiredOrdinary(state, config));
      if (timeline.has(fromMin)) applyBucket(state, timeline.get(fromMin), config, blockedIds);
      refresh(state, config, blockedIds, report);

      const pendingTimes = [...timeline.keys()].filter(t => t > fromMin).sort((a, b) => a - b);
      let nextIdx = 0, steps = 0;

      while (state.timeMin < command.toMin) {
        u.check(++steps <= (config.maxSteps ?? 128), '时间推进过多，本次未提交任何变化');
        const boundary = u.phaseAt(state.timeMin, config).end;
        const nextReceipt = pendingTimes[nextIdx] ?? Infinity;
        const next = Math.min(command.toMin, boundary, activity.nextDeadline(state, config), nextReceipt);

        const stepFrom = state.timeMin;
        if (config.timeEffects) {
          const changes = config.timeEffects({ world: u.clone(state), fromMin: stepFrom, toMin: next });
          u.check(Array.isArray(changes), 'timeEffects 必须返回明确目标的效果数组');
          effects.apply(state, null, changes, { blockedIds }, config);
        }
        state.timeMin = next;

        report.released.push(...activity.releaseExpiredOrdinary(state, config));
        if (next === nextReceipt) {
          applyBucket(state, timeline.get(next), config, blockedIds);
          nextIdx++;
        }

        refresh(state, config, blockedIds, report);
        if (next === boundary) {
          schedule(state, config, blockedIds, report);
          refresh(state, config, blockedIds, report);
        }
      }

      if (front.interactingIds !== undefined) {
        state.interactingIds = [...u.listIds(front.interactingIds, state.npcs, '更新后的互动角色列表')];
      }

      refresh(state, config, new Set(state.interactingIds), report);
      state.bg.receipts[command.id] = signature;
      state.bg.revision++;
      u.validateWorld(state);

      return { state, before: u.clone(world), report, duplicate: false };
    }

    return { advance };
  }

  const registry = root.OKHBackgroundModules ||= Object.create(null);
  if (registry.turn) throw Error('重复加载 okh_turn');
  registry.turn = create;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = create;
  }
})(globalThis);

;

;
/**
 * @module okh_api
 * @updated 2026-11-11 00:08
 * @status active
 * @reason 公共接口、先归一化后校验的初始化/迁移顺序与非阶段角色适配
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
    version: '2.1.0',
    features: Object.freeze({ activitySequences: true, timeEffects: true, receiptCommit: true }),
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


;
/**
 * @module okh_adapter
 * @updated 2026-11-18 15:25
 * @status active
 * @reason 串行读写、保存请求批次、已完成 generation 记录窗口裁剪（防长对话状态膨胀）与兼容检查点升级恢复
 */
(function (root) {
  'use strict';

  const u = root.OKHBackgroundModules?.utils;
  const api = root.OKHBackground;
  // 32 = 已完成生成记录保留上限，防止长对话中 bg.generations 随检查点倍增膨胀
  const MAX_COMPLETED_GENERATIONS = 32;

  function pruneCompletedGenerations(generations) {
    if (!generations || typeof generations !== 'object') return;
    const completed = Object.keys(generations).filter(
      id => generations[id]?.status === 'completed'
    );
    const excess = completed.length - MAX_COMPLETED_GENERATIONS;
    for (let i = 0; i < excess; i++) {
      delete generations[completed[i]];
    }
  }

  if (!u || !api) {
    throw Error(
      'okh_adapter必须在okh_api后加载'
    );
  }

  function createController({
    readWorld,
    commit,
    config
  }) {
    u.check(
      typeof readWorld === 'function' &&
      typeof commit === 'function',
      '需要提供现有状态读写适配器'
    );

    u.validateConfig(config);

    let pending = Promise.resolve();

    function serial(task) {
      const result = pending.then(task);
      pending = result.catch(() => {});
      return result;
    }

    async function save(
      before,
      state,
      checkpoint,
      reason,
      receipt = null
    ) {
      const result = await commit({
        expectedRevision: before.bg.revision,
        state,
        checkpoint,
        reason,
        receipt
      });

      u.check(
        result === true,
        '保存冲突或失败，未确认提交成功'
      );
    }

    return {
      prepareGeneration(generationId, limit = 8) {
        return serial(async () => {
          u.check(
            u.id(generationId),
            '生成ID非法'
          );

          const before = await readWorld();

          u.check(
            before.bg?.version === 2,
            '需要初始化后的v2状态'
          );

          const previous =
            before.bg.generations[generationId];

          if (previous) {
            u.check(
              previous.status === 'prepared',
              '本生成请求已经完成'
            );

            const view = u.clone(before);

            view.bg.queue = view.bg.queue.filter(
              entry => previous.ids.includes(entry.id)
            );

            const batch = api.prepare(
              view,
              Math.max(previous.ids.length, 1)
            );

            u.check(
              u.signature(batch.ids) ===
                u.signature(previous.ids),
              '已准备事件发生变化，请使用新生成ID'
            );

            return batch;
          }

          const state = u.clone(before);
          const batch = api.prepare(state, limit);

          state.bg.generations[generationId] = {
            ids: batch.ids,
            status: 'prepared'
          };

          state.bg.revision++;

          await save(
            before,
            state,
            null,
            'prepare-generation'
          );

          return batch;
        });
      },

      finishReply(command, generationId = null) {
        return serial(async () => {
          const before = await readWorld();

          const result = api.advance(
            before,
            command,
            config
          );

          if (result.duplicate) return result;

          if (generationId !== null) {
            const generation =
              before.bg.generations[generationId];

            u.check(
              generation?.status === 'prepared',
              '回复没有对应的待完成生成请求'
            );

            result.state = api.ack(
              result.state,
              generation.ids,
              generationId
            );

            result.state.bg
              .generations[generationId]
              .status = 'completed';

            result.state.bg
              .generations[generationId]
              .replyId = command.id;

            pruneCompletedGenerations(
              result.state.bg.generations
            );
          }

          await save(
            before,
            result.state,
            before,
            'finish-reply',
            command
          );

          return result;
        });
      },

      restore(checkpoint) {
        return serial(async () => {
          const state = typeof config.prepareCheckpoint === 'function'
            ? config.prepareCheckpoint(u.clone(checkpoint))
            : u.clone(checkpoint);

          u.check(
            state?.bg?.version === 2,
            '检查点必须是完整v2状态'
          );

          u.validateWorld(state);

          const before = await readWorld();

          // 状态回退，但提交版本仍递增。
          state.bg.revision =
            before.bg.revision + 1;

          await save(
            before,
            state,
            null,
            'restore-checkpoint'
          );

          return state;
        });
      }
    };
  }

  if (root.OKHBackgroundAdapter) {
    throw Error('重复加载 okh_adapter');
  }

  root.OKHBackgroundAdapter = Object.freeze({
    createController
  });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKHBackgroundAdapter;
  }
})(globalThis);




;
/**
 * @module okh_app_data
 * @updated 2026-11-19 15:36
 * @status  active
 * @reason  对齐主人指示：落实古兰在黑兽人营地泥足期双分支（高好感突围+20血脉值、低好感被俘）、爱德次日旅店转交纸条、玩家硬闯营地拦截及一日后天火劫灭同地归队自述双分支（已读纸条vs未读纸条开头加注），严格剔除龙字与极端词，确保纸条与自述逻辑闭环
 * @deps    无
 * @provides { SCHEMA_VERSION, DAY, WEEKDAYS, weekdayOf, isWeekendDay, weekdayLabel, PHASES, LOCATIONS, TOWN_LOCATIONS, STAGES, AFFECTION_TIERS, ITEM_CATALOG, ACTIONS, NODES, EVENTS, ROSTER, buildInitialWorld }
 */
(function (root) {
  'use strict'

  const SCHEMA_VERSION = 3

  const DAY = (n, hour = 6, min = 0) => (n - 1) * 1440 + hour * 60 + min

  // 全局第 1 天设定为周一，周六/周日为周末归队日
  const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const dayAt = world => Math.floor((world?.timeMin ?? 0) / 1440) + 1
  const weekdayOf = day => ((Math.max(1, day) - 1) % 7) + 1
  const isWeekendDay = day => weekdayOf(day) >= 6
  const weekdayLabel = day => WEEKDAYS[weekdayOf(day) - 1]
  const arrivedDayOf = world => (Number.isFinite(world?.flags?.arrivedDay) ? world.flags.arrivedDay : 1)
  const isFugitiveSquadActive = (world, npc) =>
    Boolean(world?.flags?.eileen_fugitive && !world?.flags?.baron_purged) &&
    npc && npc.alive !== false && npc.monitored !== false && (npc.stage ?? 0) < 3 &&
    ((npc.id === 'isna' && Boolean(npc.flags?.eileen_isna_helped) && !npc.flags?.captured_orc && !npc.flags?.isna_fallen_orc && !npc.flags?.isna_captured_ed && !npc.flags?.isna_fallen_labyrinth) ||
     (npc.id === 'nise' && Boolean(npc.flags?.eileen_nise_helped) && !npc.flags?.nise_fled_casino) ||
     (npc.id === 'eileen' && !npc.flags?.eileen_captured && !npc.flags?.eileen_returned_capital))

  const PHASES = [
    { id: 'deep_night', start: 0,    label: '深夜' },
    { id: 'morning',    start: 360,  label: '上午' },
    { id: 'afternoon',  start: 600,  label: '午后' },
    { id: 'night',      start: 1020, label: '夜晚' }
  ]

  const LOCATIONS = {
    inn: '断剑与麦酒',
    training_grounds: '露天练武场',
    town: '镇上',
    church: '圣辉大教堂',
    manor: '领主山庄',
    casino: '地下赌场',
    wilds: '城外荒原',
    wilds_camp: '黑兽人前哨据点'
  }

  const TOWN_LOCATIONS = ['inn', 'training_grounds', 'town', 'church', 'manor', 'casino']

  const STAGES = { 0: '如常', 1: '异兆', 2: '泥足', 3: '沦陷' }

  const AFFECTION_TIERS = {
    ordinary: '普通',
    friendly: '友好',
    intimate: '亲密',
    love: '爱恋'
  }

  // 已注册物品白名单：严格由后台事件、跨日结算与镇内采买规则维护；外部自定义物品须带 custom:true 且禁止冲突
  const ITEM_CATALOG = Object.freeze({
    supply: Object.freeze({
      id: 'supply',
      name: '补给',
      category: 'supply',
      stackable: true,
      maxCount: 999,
      // 1 = 单价 1 金/份：5 人满编露宿一晚消耗 5 份 = 5 金，与旅店宿费持平
      unitPrice: 1,
      desc: '一份常规一人份一天量的补给品，由干粮和药品构成。'
    }),
    alice_ledger: Object.freeze({
      id: 'alice_ledger',
      name: '银月珠宝铺真账与私账证物',
      category: 'quest',
      stackable: false,
      desc: '爱丽丝暗中递出的父母真实收支底单、席德私账破绽与后堂钥匙，用于堂前对质。'
    }),
    manor_intel_note: Object.freeze({
      id: 'manor_intel_note',
      name: '山庄换防与暗锁密笺',
      category: 'quest',
      stackable: false,
      desc: '奥萝拉在山庄当差期间暗中记下的私室换防间隙与领主书房暗锁密码。'
    }),
    barony_patent: Object.freeze({
      id: 'barony_patent',
      name: '奥克赫斯男爵领封赏契书',
      category: 'quest',
      stackable: false,
      desc: '兰开斯特家族颁予的奥克赫斯镇及原男爵辖地封赏爵位契书。'
    }),
    isna_pendant: Object.freeze({
      id: 'isna_pendant',
      name: '母亲遗留的成对吊坠',
      category: 'quest',
      stackable: false,
      desc: '伊丝娜托付的成对魔纹吊坠，彼此相隔千里亦可感知危难。'
    })
  })

  const ACTIONS = [
    {
      id: 'gulan_train',
      priority: 25,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'gulan' &&
        npc.monitored !== false &&
        !npc.flags?.gulan_departed &&
        phase.id === 'afternoon' &&
        npc.location !== 'training_grounds',
      effects: { move: 'training_grounds' },
      occupation: { kind: 'ordinary', label: '前往演武场练剑' }
    },
    {
      id: 'isna_odd_job',
      priority: 22,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'isna' &&
        !isFugitiveSquadActive(world, npc) &&
        !npc.flags?.gold_desire_frozen &&
        npc.stage < 2 &&
        ['morning', 'afternoon'].includes(phase.id) &&
        !npc.flags?.isna_worked_today,
      effects: {
        move: 'town',
        add: { gold_desire: 1 },
        npcFlags: { isna_worked_today: true }
      },
      occupation: { kind: 'ordinary', label: '去镇上接点零散杂活' }
    },
    {
      id: 'nise_town_browse',
      priority: 21,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'nise' &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage < 3 &&
        ['morning', 'afternoon'].includes(phase.id) &&
        !npc.flags?.nise_browsed_today &&
        !npc.flags?.nise_escort_today &&
        !npc.flags?.nise_casino_busy_today,
      effects: {
        move: 'town',
        add: { curiosity: 1 },
        npcFlags: { nise_browsed_today: true }
      },
      occupation: { kind: 'ordinary', label: '在镇上四处闲逛搜罗新奇物件' }
    },
    {
      id: 'nise_secretary_shift',
      priority: 41,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'nise' &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage === 2 &&
        Boolean(npc.flags?.nise_casino_busy_today) &&
        !npc.flags?.nise_fled_casino &&
        ['morning', 'afternoon', 'night'].includes(phase.id) &&
        npc.location !== 'casino',
      effects: { move: 'casino' },
      occupation: { kind: 'ordinary', label: '全天留在金碧赌场内室充当私人秘书暂缓债息' }
    },
    {
      id: 'nise_dealer_shift',
      priority: 40,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'nise' &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage === 1 &&
        Boolean(npc.flags?.nise_casino_busy_today) &&
        !npc.flags?.nise_fled_casino &&
        ['morning', 'afternoon'].includes(phase.id) &&
        npc.location !== 'casino',
      effects: { move: 'casino' },
      occupation: { kind: 'ordinary', label: '白昼留在金碧赌场担任荷官抵偿今日债息' }
    },
    {
      id: 'nise_contract_stay',
      priority: 35,
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'nise' &&
        npc.stage >= 3 &&
        !npc.flags?.nise_fled_casino &&
        npc.location !== 'casino',
      effects: { move: 'casino' },
      occupation: { kind: 'ordinary', label: '签下卖身契长留地下赌场抵债' }
    },
    {
      id: 'aurora_weekend_return',
      priority: 29,
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'aurora' &&
        Boolean(npc.flags?.manor_service_active) &&
        !npc.flags?.aurora_left_manor &&
        npc.stage < 3 &&
        isWeekendDay(dayAt(world)) &&
        npc.location === 'manor',
      effects: { move: 'inn' },
      occupation: { kind: 'ordinary', label: '周末离开领主山庄返回旅店归队' }
    },
    {
      id: 'aurora_manor_work',
      priority: 25,
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.baron_purged &&
        npc.id === 'aurora' &&
        Boolean(npc.flags?.manor_service_active) &&
        !npc.flags?.aurora_left_manor &&
        (npc.stage >= 3 || !isWeekendDay(dayAt(world))) &&
        npc.location !== 'manor',
      effects: { move: 'manor' },
      occupation: { kind: 'ordinary', label: '前往领主山庄任职' }
    },
    {
      id: 'ed_inn_chores',
      priority: 20,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'ed' &&
        npc.monitored !== false &&
        !npc.flags?.ed_revealed &&
        !npc.flags?.ed_home_visiting &&
        (Boolean(world.flags?.ed_custody_active) || Boolean(world.flags?.ed_permanently_joined)) &&
        ['morning', 'afternoon'].includes(phase.id) &&
        npc.location === 'inn',
      effects: {},
      occupation: { kind: 'ordinary', label: '在旅店跑腿打杂与擦拭桌椅' }
    },
    {
      id: 'return_inn',
      priority: 30,
      when: ({ world, npc, phase }) => {
        if (!world.flags?.arrived_oakhaven || !['night', 'deep_night'].includes(phase.id)) return false
        if (npc.homeLocation !== 'inn' || npc.location === 'inn') return false
        if (isFugitiveSquadActive(world, npc)) return false
        if (npc.flags?.captured_orc || npc.flags?.isna_camp_distress || npc.flags?.isna_captured_ed || npc.flags?.captured_manor) return false
        if (npc.id === 'ed' && npc.flags?.ed_home_visiting) return false
        if (npc.id === 'gulan' && (npc.flags?.gulan_departed || npc.monitored === false)) return false
        if (npc.id === 'nise' && (npc.stage >= 3 || (npc.flags?.nise_casino_busy_today && npc.stage === 2 && phase.id === 'night'))) {
          return false
        }
        if (npc.id === 'aurora' && npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor) {
          if (npc.stage >= 3 || !isWeekendDay(dayAt(world))) return false
          return npc.location !== 'manor'
        }
        return true
      },
      effects: { move: 'inn' },
      occupation: { kind: 'ordinary', label: '夜间返回旅店休整' }
    },
    {
      id: 'return_church',
      priority: 30,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        ['night', 'deep_night'].includes(phase.id) &&
        npc.homeLocation === 'church' &&
        npc.location !== 'church' &&
        !npc.flags?.captured_manor,
      effects: { move: 'church' },
      occupation: { kind: 'ordinary', label: '夜间返回修道院' }
    },
    {
      id: 'eileen_post_purge_return',
      priority: 32,
      when: ({ world, npc }) =>
        npc.id === 'eileen' &&
        Boolean(world.flags?.baron_purged) &&
        !npc.flags?.eileen_returned_capital &&
        !npc.flags?.eileen_captured &&
        npc.location !== 'manor',
      effects: { move: 'manor' },
      occupation: { kind: 'ordinary', label: '返驻奥克赫斯领主山庄善后' }
    },
    {
      id: 'aurora_post_purge_return',
      priority: 32,
      when: ({ world, npc }) =>
        npc.id === 'aurora' &&
        Boolean(world.flags?.baron_purged) &&
        (!npc.flags?.manor_service_active || Boolean(npc.flags?.aurora_left_manor)) &&
        npc.stage < 3 &&
        npc.location === 'manor',
      effects: { move: 'inn' },
      occupation: { kind: 'ordinary', label: '领主伏诛后返回旅店归队' }
    },
    {
      id: 'return_manor',
      priority: 30,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        ['night', 'deep_night'].includes(phase.id) &&
        npc.homeLocation === 'manor' &&
        !world.flags?.eileen_fugitive &&
        !npc.flags?.eileen_fugitive &&
        !npc.flags?.eileen_returned_capital &&
        npc.location !== 'manor',
      effects: { move: 'manor' },
      occupation: { kind: 'ordinary', label: '夜间返回领主山庄' }
    },
    {
      id: 'idle_rest',
      priority: 5,
      when: {},
      effects: {},
      occupation: { kind: 'ordinary', label: '歇息整备' }
    }
  ]

  const NODES = [
    {
      id: 'gulan_stage_1',
      mode: 'result',
      fromStage: 0,
      toStage: 1,
      when: { stage: 0, metrics: { blood_density: { gte: 20 } } },
      text: '夜半调息时，{name}感到额角微烫、体内真血出现异样躁动；她以为只是连日奔波或此前激斗余波，神色沉凝地强自压下。'
    },
    {
      id: 'gulan_stage_2',
      mode: 'result',
      fromStage: 1,
      toStage: 2,
      when: ({ npc }) => {
        if (npc.stage !== 1 || !npc.flags?.ed_hypnosis_play_done) return false
        const aff = npc.values.affection ?? 0
        const threshold = aff >= 90 ? 65 : aff >= 70 ? 50 : aff >= 40 ? 45 : 35
        return (npc.values.blood_density ?? 0) >= threshold
      },
      text: '昨夜防线失守的余悸未消，{name}清晨起得比往常更早，将黑底高领长裙的衣襟扣得严严实实，刻意避开了众人投来的目光。'
    },
    {
      id: 'gulan_stage_3',
      mode: 'result',
      fromStage: 2,
      toStage: 3,
      when: { stage: 2, metrics: { blood_density: { gte: 80 } }, flags: { gulan_final_fall_done: true } },
      text: '{name}不再抗拒体内奔涌的古龙真血，琥珀竖瞳沉冷而傲然，龙化形态已化作她自身的常态与本能。'
    },
    {
      id: 'aurora_stage_1',
      mode: 'result',
      fromStage: 0,
      toStage: 1,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven && npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor && !world.flags?.baron_purged) &&
        !npc.flags?.aurora_evt1_done &&
        npc.stage === 0 &&
        npc.location === 'manor' &&
        !isWeekendDay(dayAt(world)) &&
        ['morning', 'afternoon'].includes(phase.id) &&
        (npc.values.debt_pressure ?? 0) > 0 &&
        (npc.flags?.manorWorkDays ?? 0) >= 3,
      effects: {
        add: { debt_pressure: -10 },
        npcFlags: { aurora_evt1_done: true }
      },
      text: '{name}在领主山庄工作满三日后收拾二楼私室时，雷蒙德领主顺手递过一袋额外封口金币并借机贴身占便宜。她指尖攥紧围裙却不敢得罪大领主，红着眼眶咬牙忍下，收下这笔抵掉一成旧债的钱款，此后在山庄干活时也不再敢强硬推阻触碰。'
    },
    {
      id: 'aurora_stage_2',
      mode: 'result',
      fromStage: 1,
      toStage: 2,
      requires: ['aurora_stage_1'],
      when: ({ world, npc, phase }) => {
        if (!world.flags?.arrived_oakhaven || !npc.flags?.manor_service_active || npc.flags?.aurora_left_manor || world.flags?.baron_purged) return false
        if (npc.flags?.aurora_evt2_done || npc.stage !== 1 || npc.location !== 'manor') return false
        if (isWeekendDay(dayAt(world)) || !['morning', 'afternoon'].includes(phase.id)) return false
        if ((npc.values.debt_pressure ?? 0) <= 0) return false
        if ((npc.values.affection ?? 0) >= 90 && !npc.flags?.aurora_evt2_delayed) return false
        const baseDays = npc.flags?.aurora_evt2_delayed ? 14 : 7
        const reqDays = baseDays - (npc.flags?.aurora_lord_punished ? 3 : 0)
        return Boolean(npc.flags?.aurora_evt1_done) && (npc.flags?.manorWorkDays ?? 0) >= reqDays
      },
      effects: {
        add: { debt_pressure: -30 },
        npcFlags: { aurora_evt2_done: true }
      },
      text: '在领主山庄高额加码服务费的步步相逼下，{name}最终没能推辞能一次消去三成债务的私室夜侍条件。厚实橡木门隔绝了外间动静，事后她强忍屈辱收下重金，从此每逢工作日入夜便默认留在山庄侍寝，只在周末换回素净长裙勉强返店归队。'
    },
    {
      id: 'aurora_stage_3',
      mode: 'result',
      fromStage: 2,
      toStage: 3,
      requires: ['aurora_stage_2'],
      when: ({ world, npc, phase }) => {
        const reqDays = 21 - (npc.flags?.aurora_lord_punished ? 3 : 0)
        return (
          Boolean(world.flags?.arrived_oakhaven && npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor && !world.flags?.baron_purged) &&
          Boolean(npc.flags?.aurora_evt2_done) &&
          !npc.flags?.aurora_evt3_done &&
          npc.stage === 2 &&
          npc.location === 'manor' &&
          !isWeekendDay(dayAt(world)) &&
          ['morning', 'afternoon'].includes(phase.id) &&
          (npc.values.debt_pressure ?? 0) > 0 &&
          (npc.flags?.manorWorkDays ?? 0) >= reqDays &&
          (npc.values.affection ?? 0) < 90
        )
      },
      effects: {
        add: { debt_pressure: -100 },
        npcFlags: { aurora_evt3_done: true }
      },
      text: '面对领主一次清空全部剩余家庭旧债的情妇契约，{name}轻叹着合上手中账册签下名字；旧债随之归零，她正式长留在领主山庄成为男爵情妇，从此周末亦不再返回旅店。'
    },
    {
      id: 'eileen_stage_1',
      mode: 'result',
      fromStage: 0,
      toStage: 1,
      when: ({ world, npc }) =>
        Boolean(npc.flags?.eileen_captured && !world.flags?.eileen_fugitive && !world.flags?.baron_purged) &&
        !npc.flags?.eileen_evt1_done &&
        npc.stage === 0 &&
        (npc.flags?.eileenCaptiveDays ?? 0) >= 1,
      effects: { npcFlags: { eileen_evt1_done: true } },
      text: '被秘密羁押入领主山庄地下禁室次日，{name}当面看着雷蒙德拿出自己那支早已被偷偷掉包的假魔能讯号管，又强行缴走细刺剑与王室诏令，原本坚信公文护身的傲气头一次裂开缺口。'
    },
    {
      id: 'eileen_stage_2',
      mode: 'result',
      fromStage: 1,
      toStage: 2,
      requires: ['eileen_stage_1'],
      when: ({ world, npc }) =>
        Boolean(npc.flags?.eileen_captured && !world.flags?.eileen_fugitive && !world.flags?.baron_purged) &&
        Boolean(npc.flags?.eileen_evt1_done) &&
        !npc.flags?.eileen_evt2_done &&
        npc.stage === 1 &&
        (npc.flags?.eileenCaptiveDays ?? 0) >= 7,
      effects: { npcFlags: { eileen_evt2_done: true } },
      text: '幽禁满七日后，男爵将假冒她笔迹的“沿途安好缓归”回执摆到案前；失去王都与外界全部援救希望的{name}在私室与日夜调教的磨折下防线渐崩，开始被迫配合山庄规训。'
    },
    {
      id: 'eileen_stage_3',
      mode: 'result',
      fromStage: 2,
      toStage: 3,
      requires: ['eileen_stage_2'],
      when: ({ world, npc }) =>
        Boolean(npc.flags?.eileen_captured && !world.flags?.eileen_fugitive && !world.flags?.baron_purged) &&
        Boolean(npc.flags?.eileen_evt2_done) &&
        !npc.flags?.eileen_evt3_done &&
        npc.stage === 2 &&
        (npc.flags?.eileenCaptiveDays ?? 0) >= 21,
      effects: { npcFlags: { eileen_evt3_done: true } },
      text: '漫长囚禁至第二十一日，昔日骄傲的王都女巡查使{name}终于磨去了最后一线抗争执念，亲口放弃返都复命的打算，沉沦为领主山庄深处秘密圈养的专属禁脔。'
    },
    {
      id: 'nise_stage_1',
      mode: 'result',
      fromStage: 0,
      toStage: 1,
      when: ({ world, npc, phase, blockedIds }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        !npc.flags?.nise_fled_casino &&
        !npc.flags?.nise_dealer_done &&
        !npc.activity &&
        !blockedIds?.has(npc.id) &&
        npc.stage === 0 &&
        ['morning', 'afternoon'].includes(phase.id) &&
        (npc.values.gamble_debt ?? 0) >= 30,
      effects: {
        move: 'casino',
        npcFlags: { nise_dealer_done: true, nise_casino_busy_today: true }
      },
      text: '滚大的高利借条让{name}再无余地拖延，她独自溜进金碧赌场被黑巨汉胁迫换上露背束腰荷官装站台接客，借此恳求暂缓今日逼债（赌债未减，当日白昼将在赌场内占线，入夜换回常服返店隐瞒众人）。'
    },
    {
      id: 'nise_stage_2',
      mode: 'result',
      fromStage: 1,
      toStage: 2,
      requires: ['nise_stage_1'],
      when: ({ world, npc, phase, blockedIds }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        !npc.flags?.nise_fled_casino &&
        Boolean(npc.flags?.nise_dealer_done) &&
        !npc.flags?.nise_secretary_done &&
        !npc.activity &&
        !blockedIds?.has(npc.id) &&
        npc.stage === 1 &&
        ['morning', 'afternoon'].includes(phase.id) &&
        (npc.values.gamble_debt ?? 0) >= 60,
      effects: {
        move: 'casino',
        npcFlags: { nise_secretary_done: true, nise_casino_busy_today: true }
      },
      text: '越滚越高的赌债将{name}逼入更深的筹码泥潭；黑巨汉以暂缓强收与不向家里告发为挟，把她唤入赌场二三层内室充当贴身私人秘书，整天脱队失联接受愈发露骨的抵债挟制。'
    },
    {
      id: 'nise_stage_3',
      mode: 'result',
      fromStage: 2,
      toStage: 3,
      requires: ['nise_stage_2'],
      when: ({ world, npc, blockedIds }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !npc.flags?.nise_fled_casino &&
        Boolean(npc.flags?.nise_secretary_done) &&
        !npc.flags?.nise_contract_done &&
        !npc.activity &&
        !blockedIds?.has(npc.id) &&
        npc.stage === 2 &&
        (npc.values.gamble_debt ?? 0) >= 90,
      effects: {
        move: 'casino',
        npcFlags: { nise_contract_done: true, casino_debt_frozen: true, nise_casino_busy_today: false }
      },
      text: '债务逼近尽头之际，走投无路的{name}在畏惧责罚与麻木屈服中于卖身契上按下了指印，从此不再回到断剑与麦酒旅店，长留地下赌场沦为黑老大掌控的专属抵债玩物。'
    },
    {
      id: 'cecilia_stage_1',
      mode: 'result',
      fromStage: 0,
      toStage: 1,
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.baron_purged &&
        npc.stage === 0 &&
        !npc.flags?.cecilia_evt1_done &&
        (npc.values.orphanage_funds ?? 0) <= 0 &&
        ((npc.values.affection ?? 0) < 70 ||
          Boolean(npc.flags?.cecilia_manor_go_stage1) ||
          (npc.flags?.ceciliaAppealDays ?? 0) >= 2),
      effects: {
        add: { orphanage_funds: 30 },
        npcFlags: { cecilia_evt1_done: true, cecilia_manor_go_stage1: false, ceciliaAppealDays: 0 }
      },
      text: '孤儿院账面断绝之际，{name}为给孩子们换回口粮与药材，只得独自前往领主山庄恳求雷蒙德男爵拨款。男爵在书房趁机逼迫她忍受猥亵检身与含辱口舌讨好后才肯签下拨款单，{name}攥着新领回的三十份善款重返教堂，神情却多了一层难掩的晦暗（孤儿院资金 +30）。'
    },
    {
      id: 'cecilia_stage_2',
      mode: 'result',
      fromStage: 1,
      toStage: 2,
      requires: ['cecilia_stage_1'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.baron_purged &&
        npc.stage === 1 &&
        Boolean(npc.flags?.cecilia_evt1_done) &&
        !npc.flags?.cecilia_evt2_done &&
        (npc.values.orphanage_funds ?? 0) <= 0 &&
        ((npc.values.affection ?? 0) < 80 ||
          Boolean(npc.flags?.cecilia_manor_go_stage2) ||
          (npc.flags?.ceciliaAppealDays ?? 0) >= 2),
      effects: {
        add: { orphanage_funds: 40 },
        npcFlags: { cecilia_evt2_done: true, cecilia_manor_go_stage2: false, ceciliaAppealDays: 0 }
      },
      text: '刚刚领回的资助再次见底，{name}不得不又一次硬着头皮踏进领主山庄求款。早已握住第一次把柄的雷蒙德这次不再满足于浅尝辄止，强迫她在内室褪下圣袍按在案台前失身成事，才换来新一笔四十份孤儿院经费（孤儿院资金 +40）。'
    },
    {
      id: 'cecilia_stage_3',
      mode: 'result',
      fromStage: 2,
      toStage: 3,
      requires: ['cecilia_stage_2'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.baron_purged &&
        npc.stage === 2 &&
        Boolean(npc.flags?.cecilia_evt2_done) &&
        !npc.flags?.cecilia_evt3_done &&
        (npc.values.orphanage_funds ?? 0) <= 0 &&
        ((npc.values.affection ?? 0) < 90 ||
          Boolean(npc.flags?.cecilia_manor_go_stage3) ||
          (npc.flags?.ceciliaAppealDays ?? 0) >= 2),
      effects: {
        add: { orphanage_funds: 60 },
        npcFlags: { cecilia_evt3_done: true, cecilia_manor_go_stage3: false, ceciliaAppealDays: 0 }
      },
      text: '善款三度耗尽后，{name}再度来到领主山庄却已无力再守最后防线。男爵以长期稳定包揽孤儿院六十份配额为交换，将这位曾经端庄自持的修女长正式收作暗中随叫随到的圣职情妇（孤儿院资金 +60）。'
    },
    {
      id: 'isna_stage_1',
      mode: 'result',
      fromStage: 0,
      toStage: 1,
      when: ({ npc }) =>
        npc.stage === 0 &&
        Boolean(npc.flags?.captured_orc),
      text: '被黑兽人营地守军押入地牢当日，{name}在严酷拷问与强压下终究失守了防线，猫耳无力垂落，心神蒙上难以抹去的阴翳。'
    },
    {
      id: 'isna_stage_2',
      mode: 'result',
      fromStage: 1,
      toStage: 2,
      requires: ['isna_stage_1'],
      when: ({ npc }) =>
        npc.stage === 1 &&
        Boolean(npc.flags?.captured_orc) &&
        (npc.flags?.orcCaptiveDays ?? 0) >= 1,
      text: '被俘次日仍未等到外援，地牢中的连番羞辱与折磨进一步碾碎了{name}的强撑与傲气，她开始在绝望与麻木间泥足深陷。'
    },
    {
      id: 'isna_stage_3',
      mode: 'result',
      fromStage: 2,
      toStage: 3,
      requires: ['isna_stage_2'],
      when: ({ npc }) =>
        npc.stage === 2 &&
        Boolean(npc.flags?.captured_orc) &&
        (npc.flags?.orcCaptiveDays ?? 0) >= 2,
      effects: {
        npcFlags: { isna_fallen_orc: true }
      },
      text: '关押至第三日仍无音讯，孤立无援的{name}心防崩塌，放弃了等待救援的念想，转而与营地黑兽人合流沦陷。'
    }
  ]

  const auroraManorInsider = world => {
    const a = world.npcs?.aurora
    return Boolean(
      a &&
      a.alive !== false &&
      a.flags?.manor_service_active &&
      !a.flags?.aurora_left_manor &&
      a.stage < 3 &&
      (a.values?.affection ?? 0) >= 80
    )
  }

  const gulanSoloTrainingGrounds = ({ world, npc, phase }) =>
    Boolean(world.flags?.arrived_oakhaven) &&
    // 最早不早于第 15 天，若前传超过 4 天抵镇则按 arrivedDay + 11 动态顺延
    world.timeMin >= DAY(Math.max(15, arrivedDayOf(world) + 11), 6) &&
    phase.id === 'afternoon' &&
    npc.location === 'training_grounds' &&
    world.playerLocation !== 'training_grounds' &&
    !npc.flags?.gulan_evt1_done &&
    Object.values(world.npcs).every(
      other => other.id === npc.id || other.alive === false || other.location !== 'training_grounds'
    )

  const EVENTS = [
    {
      id: 'dragon_blood_awakening_resist_low',
      mode: 'result',
      scope: 'npc',
      targets: ['gulan'],
      when: ctx => gulanSoloTrainingGrounds(ctx) && ctx.npc.stage < 2,
      text: '镇上十余名地痞觊觎{name}独处练武场，借讨教暗燃未知催情异香。察觉药力难辨后，{name}为防交手生变果断激发龙鳞护体，挥重剑将围逼宵小依次格杀后径直离开。',
      effects: ({ world }) => ({
        add: { blood_density: 10 },
        npcFlags: { gulan_evt1_done: true },
        worldFlags: {
          bloody_arena: true,
          bloodyArenaDay: dayAt(world),
          martial_law: true,
          panic: true
        }
      })
    },
    {
      id: 'dragon_blood_awakening_mud_guard',
      mode: 'result',
      scope: 'npc',
      targets: ['gulan'],
      when: ctx =>
        gulanSoloTrainingGrounds(ctx) &&
        ctx.npc.stage === 2 &&
        (ctx.npc.values.affection ?? 0) >= 90,
      text: '异香瞬间引动了{name}体内蛰伏的情潮，四肢酸软浮起潮红；但念及对玩家的深情与道义底线，加之药效未明恐生意外，她仍强催龙血覆鳞，提重剑肃清来敌。',
      effects: ({ world }) => ({
        add: { blood_density: 10 },
        npcFlags: { gulan_evt1_done: true },
        worldFlags: {
          bloody_arena: true,
          bloodyArenaDay: dayAt(world),
          martial_law: true,
          panic: true
        }
      })
    },
    {
      id: 'dragon_blood_awakening_mud_fall',
      mode: 'result',
      scope: 'npc',
      targets: ['gulan'],
      when: ctx =>
        gulanSoloTrainingGrounds(ctx) &&
        ctx.npc.stage === 2 &&
        (ctx.npc.values.affection ?? 0) < 90,
      text: '早已被暗中撬开防线的躯体受强力异香催动，{name}双膝一软没能压住奔涌的躁热，演武场内终究守不住最后的防线。',
      effects: {
        npcFlags: { gulan_evt1_done: true, gulan_arena_fall: true }
      }
    },
    {
      id: 'dragon_blood_awakening_fallen',
      mode: 'result',
      scope: 'npc',
      targets: ['gulan'],
      when: ctx => gulanSoloTrainingGrounds(ctx) && ctx.npc.stage >= 3,
      text: '已全面接纳龙血本能的{name}不再顾忌世俗名节，放任热潮与血性在练武场席卷。',
      effects: {
        npcFlags: { gulan_evt1_done: true, gulan_arena_fall: true }
      }
    },
    {
      id: 'gulan_ed_hypnosis_play',
      mode: 'result',
      scope: 'npc',
      targets: ['gulan'],
      when: ({ world, npc, phase }) => {
        if (!world.flags?.arrived_oakhaven || !world.flags?.ed_joined) return false
        const ed = world.npcs?.ed
        if (!ed || ed.monitored !== true || ed.alive === false) return false
        if (npc.stage !== 1 || npc.flags?.ed_hypnosis_play_done) return false
        if (!['night', 'deep_night'].includes(phase.id)) return false
        if (npc.location !== ed.location) return false
        if (world.flags?.playerRoomTarget === 'gulan') return false
        const aff = npc.values?.affection ?? 0
        const threshold = aff >= 90 ? 65 : aff >= 70 ? 50 : aff >= 40 ? 45 : 35
        return (npc.values?.blood_density ?? 0) >= threshold
      },
      effects: {
        npcFlags: { ed_hypnosis_play_done: true }
      },
      text: '夜色沉寂时，蛰伏于客房暗处的古龙威压再度悄然蔓延。{name}在睡梦与龙血躁热的夹缝中未能抵住潜意识引导，醒来后面对异样余悸只觉羞愤难言，却仍死守体面未向外界声张。'
    },
    {
      id: 'gulan_final_rescue_prompt',
      mode: 'interaction',
      scope: 'npc',
      targets: ['gulan'],
      allowCancel: false,
      resolveWhen: ({ npc }) => npc.stage === 2,
      when: ({ world, npc, phase }) =>
        npc.stage === 2 &&
        world.playerLocation === 'inn' &&
        npc.location === 'inn' &&
        ['night', 'deep_night'].includes(phase.id) &&
        (npc.values.blood_density ?? 0) >= 80 &&
        (npc.values.affection ?? 0) >= 90 &&
        !npc.flags?.gulan_final_fall_done &&
        !npc.flags?.gulan_rescued_final,
      text: '夜色深沉，{name}房中传来沉重压抑的吐息与微弱鳞甲摩擦声；在最后一重理智即将溃散前，她仍面向你的方向漏出了一丝挣扎破绽。',
      outcomes: {
        rescue: {
          when: ({ world, npc }) =>
            npc.stage === 2 &&
            world.playerLocation === 'inn' &&
            npc.location === 'inn' &&
            (npc.values.affection ?? 0) >= 90,
          text: '房内的龙威震荡与狂暴气血渐趋平息，{name}在理智边缘硬生生压制住了奔涌的始祖血脉。',
          effects: {
            add: { blood_density: -10 },
            npcFlags: { gulan_rescued_final: true }
          }
        },
        fail: {
          text: '错过了最后的缓冲窗口，奔涌的真血最终吞没了她最后一丝游移。',
          effects: {
            npcFlags: { gulan_final_fall_done: true }
          }
        }
      }
    },
    {
      id: 'gulan_final_fall_dark',
      mode: 'result',
      scope: 'npc',
      targets: ['gulan'],
      when: ({ world, npc, phase }) => {
        if (!world.flags?.arrived_oakhaven || !world.flags?.ed_joined) return false;
        const ed = world.npcs?.ed;
        if (!ed || ed.monitored !== true || ed.alive === false) return false;
        if (npc.stage !== 2 || npc.flags?.gulan_final_fall_done) return false;
        if (!['night', 'deep_night'].includes(phase.id)) return false;
        if (npc.location !== ed.location) return false;
        if (world.flags?.playerRoomTarget === 'gulan') return false;
        const aff = npc.values?.affection ?? 0;
        const bd = npc.values?.blood_density ?? 0;
        if (aff < 90) return bd >= 80;
        return (
          bd >= 90 &&
          (Boolean(npc.flags?.gulan_rescued_final) || world.playerLocation !== npc.location)
        );
      },
      text: '夜色深沉，龙血余热压过了仅存的犹疑。在爱德的贴身诱引下，{name}不再抵抗胸口翻涌的古龙本能，任由真血与誓约一同改写归属。',
      effects: {
        npcFlags: { gulan_final_fall_done: true }
      }
    },
    {
      id: 'isna_tavern_rumor_alone',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        world.timeMin >= DAY(8, 6) &&
        npc.stage === 0 &&
        npc.location === 'inn' &&
        ['afternoon', 'night'].includes(phase.id) &&
        (npc.values.gold_desire ?? 0) >= 30 &&
        !npc.flags?.gold_desire_frozen &&
        !npc.flags?.isna_evt1_done &&
        !npc.flags?.isna_comforted_today &&
        world.playerLocation !== 'inn',
      text: '旅店酒馆里飘着烤肉与麦酒气味，邻桌雇佣兵高声议论着荒原悬赏与领主高薪。{name}摸了摸只剩碎肉干的口袋，猫尾甩得飞快，独自下定决心要找大活赚一笔。',
      effects: {
        add: { gold_desire: 15 },
        npcFlags: { isna_evt1_done: true }
      }
    },
    {
      id: 'isna_tavern_rumor_soothed',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        world.timeMin >= DAY(8, 6) &&
        npc.stage === 0 &&
        npc.location === 'inn' &&
        ['afternoon', 'night'].includes(phase.id) &&
        (npc.values.gold_desire ?? 0) >= 30 &&
        !npc.flags?.gold_desire_frozen &&
        !npc.flags?.isna_evt1_done &&
        Boolean(npc.flags?.isna_comforted_today),
      text: '邻桌照样在吹嘘荒原大赏与山庄阔绰酬金，但{name}咬着你先一步分给她的热食，原本烦躁拍打木凳的猫尾逐渐安静下来。',
      effects: {
        add: { gold_desire: 5, affection: 2 },
        npcFlags: { isna_evt1_done: true }
      }
    },
    {
      id: 'isna_tavern_rumor_notice',
      mode: 'interaction',
      scope: 'npc',
      targets: ['isna'],
      allowCancel: false,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        world.timeMin >= DAY(8, 6) &&
        npc.stage === 0 &&
        npc.location === 'inn' &&
        ['afternoon', 'night'].includes(phase.id) &&
        (npc.values.gold_desire ?? 0) >= 30 &&
        !npc.flags?.gold_desire_frozen &&
        !npc.flags?.isna_evt1_done &&
        !npc.flags?.isna_comforted_today &&
        world.playerLocation === 'inn',
      expireWhen: ({ npc }) =>
        npc.location !== 'inn' ||
        Boolean(npc.flags?.gold_desire_frozen || npc.flags?.captured_orc || npc.flags?.isna_camp_distress),
      text: '酒馆大堂里飘着烤肉香气，邻桌正在吹嘘荒原悬赏与领主府的三倍工钱。你注意到同在旅店的{name}正盯着空袋发呆、猫耳紧绷，似在盘算自己单干。',
      effects: { npcFlags: { isna_evt1_done: true } },
      outcomes: {
        soothe: {
          when: ({ world, npc }) => world.playerLocation === 'inn' && npc.location === 'inn',
          text: '有了同伴的分担与安抚，{name}垂下抖动的猫耳小声嘀咕两句，暂时按捺下了独自涉险的急躁念头。',
          effects: { add: { gold_desire: 5, affection: 2 } }
        },
        ignore: {
          text: '未见有人出声干预，{name}灌完杯底残酒，眼底多了几分独自接活赚快钱的跃跃欲试。',
          effects: { add: { gold_desire: 15 } }
        }
      }
    },
    {
      id: 'isna_alley_lockpick_alone',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage === 0 &&
        npc.location === 'town' &&
        ['night', 'deep_night'].includes(phase.id) &&
        (npc.values.gold_desire ?? 0) >= 50 &&
        !npc.flags?.gold_desire_frozen &&
        !npc.flags?.isna_evt2_done &&
        world.playerLocation !== 'town',
      text: '入夜后{name}在商业巷暗接一桩高酬开锁私活；顺利拿钱撤离时险些撞上巡卫，她撒出靴底烟幕骨粉惊险甩脱，分毫未损反而让自信越发膨胀。',
      effects: {
        add: { gold_desire: 15 },
        npcFlags: { isna_evt2_done: true, alley_confidence: true }
      }
    },
    {
      id: 'isna_alley_lockpick_spot',
      mode: 'interaction',
      scope: 'npc',
      targets: ['isna'],
      allowCancel: false,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage === 0 &&
        npc.location === 'town' &&
        ['night', 'deep_night'].includes(phase.id) &&
        (npc.values.gold_desire ?? 0) >= 50 &&
        !npc.flags?.gold_desire_frozen &&
        !npc.flags?.isna_evt2_done &&
        world.playerLocation === 'town',
      expireWhen: ({ npc }) =>
        npc.location !== 'town' ||
        Boolean(npc.flags?.gold_desire_frozen || npc.flags?.captured_orc || npc.flags?.isna_camp_distress),
      text: '商业巷拐角忽然炸开一团刺鼻骨粉烟幕，一道敏捷的猫耳身影翻过矮墙正欲抽身遁走，像刚干完私活的{name}。',
      effects: { npcFlags: { isna_evt2_done: true } },
      outcomes: {
        intercept: {
          when: ({ world, npc }) => world.playerLocation === 'town' && npc.location === 'town',
          text: '私活退路被当场截住，{name}心虚地夹紧猫尾低头认错，收敛了不少冒失念头。',
          effects: { add: { gold_desire: 5, affection: 4 } }
        },
        miss: {
          text: '烟幕散尽后巷内已空无一人，{name}顺利带着快钱脱身，越发笃信凭自己本事去哪都能来去自如。',
          effects: { add: { gold_desire: 15 }, npcFlags: { alley_confidence: true } }
        }
      }
    },
    {
      id: 'isna_pendant_exchange',
      mode: 'interaction',
      scope: 'npc',
      targets: ['isna'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc, phase }) =>
        npc.stage === 0 &&
        !npc.flags?.captured_orc &&
        !npc.flags?.token_exchanged &&
        (npc.values.affection ?? 0) >= 90 &&
        ['night', 'deep_night'].includes(phase.id) &&
        world.playerLocation === npc.location,
      text: '夜深人静，微醺的{name}倚在身侧闲聊起幼年颠沛的旧事，平日总带着几分促狭笑意的猫耳罕见地放软下来。她从领口摘下一对镌刻微弱魔纹的旧吊坠，指尖微微发紧，将其中半枚推向你掌心前，目光藏着克制的试探与托付，静候你的回应。',
      outcomes: {
        accept_pendant: {
          when: ({ world, npc }) => world.playerLocation === npc.location,
          effects: [
            { target: 'world', itemsAdd: [{ id: 'isna_pendant', count: 1 }] },
            { target: 'isna', npcFlags: { token_exchanged: true } }
          ],
          text: '你接过那枚尚带体温的半对吊坠妥善收好，{name}别过脸轻哼了一声，微微发烫的耳尖却藏不住心底的安定。'
        },
        decline_pendant: {
          text: '你郑重婉拒了这份贵重的贴身旧物，{name}指尖微顿，随后笑着把吊坠重新挂回颈间，没有再勉强。'
        }
      }
    },
    {
      id: 'isna_camp_ambush_pendant',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        !npc.flags?.wilds_camp_tried &&
        !npc.flags?.isna_fallen_orc &&
        !npc.flags?.isna_fallen_labyrinth &&
        !npc.flags?.isna_captured_ed &&
        !npc.flags?.captured_orc &&
        (npc.values.gold_desire ?? 0) >= 70 &&
        (npc.values.affection ?? 0) >= 90 &&
        Boolean(npc.flags?.token_exchanged),
      effects: [
        { target: 'world', itemsRemove: [{ id: 'isna_pendant', all: true }] },
        {
          target: 'isna',
          move: 'wilds_camp',
          forceMove: true,
          npcFlags: {
            wilds_camp_tried: true,
            gold_desire_frozen: true,
            isna_camp_distress: 'pendant',
            isna_help_real: true,
            isnaDistressDays: 0
          }
        }
      ],
      text: '独自潜往城外黑兽人前哨据点探财的{name}不慎撞入重兵包围圈，情急之下捏碎了贴身佩戴的成对吊坠！你随身佩戴的另一半吊坠随之裂响，瞬间传来她遇险受困于黑兽人前哨据点的紧急感应（须于次日完结前赶赴营救）。'
    },
    {
      id: 'isna_camp_ambush_rat',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        !npc.flags?.wilds_camp_tried &&
        !npc.flags?.isna_fallen_orc &&
        !npc.flags?.isna_fallen_labyrinth &&
        !npc.flags?.isna_captured_ed &&
        !npc.flags?.captured_orc &&
        (npc.values.gold_desire ?? 0) >= 70 &&
        (npc.values.affection ?? 0) >= 80 &&
        !((npc.values.affection ?? 0) >= 90 && Boolean(npc.flags?.token_exchanged)),
      effects: {
        move: 'wilds_camp',
        forceMove: true,
        npcFlags: {
          wilds_camp_tried: true,
          gold_desire_frozen: true,
          isna_camp_distress: 'rat',
          isna_help_real: false,
          isnaDistressDays: 0
        }
      },
      text: '独自潜赴城外黑兽人前哨据点寻财的{name}陷入守军围堵，被逼入废墟缝隙暂避；危急间她强忍惊慌，悄然放出随身驯养的灰鼠魔兽衔信赶回镇上报讯。'
    },
    {
      id: 'isna_camp_ambush_direct',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        !npc.flags?.wilds_camp_tried &&
        !npc.flags?.isna_fallen_orc &&
        !npc.flags?.isna_fallen_labyrinth &&
        !npc.flags?.isna_captured_ed &&
        !npc.flags?.captured_orc &&
        (npc.values.gold_desire ?? 0) >= 70 &&
        (npc.values.affection ?? 0) < 80,
      effects: {
        move: 'wilds_camp',
        forceMove: true,
        npcFlags: {
          wilds_camp_tried: true,
          gold_desire_frozen: true,
          captured_orc: true,
          orcCaptiveDays: 0
        }
      },
      text: '独自潜入城外黑兽人前哨据点谋财的{name}行迹败露，未能及时脱身也未向小队发出求援，当场遭黑兽人巡逻队合围擒获押入营地地牢。'
    },
    {
      id: 'isna_rat_signal_arrive',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ npc }) =>
        npc.flags?.isna_camp_distress === 'rat' &&
        !npc.flags?.isna_help_real &&
        !npc.flags?.captured_orc &&
        (npc.flags?.isnaDistressDays ?? 0) >= 1,
      effects: {
        npcFlags: { isna_help_real: true }
      },
      text: '浑身沾满荒原草屑的灰鼠魔兽终于衔着染血短笺窜回队伍落脚处——笺上潦草记着{name}被困黑兽人前哨据点的方位与求救记号（须在明日完结前携古兰赶赴营救）。'
    },
    {
      id: 'isna_distress_timeout_capture',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ npc }) => {
        const mode = npc.flags?.isna_camp_distress
        if (!mode || npc.flags?.captured_orc || npc.flags?.isna_fallen_orc || npc.flags?.isna_captured_ed) return false
        // 吊坠分支 T+1 完结前（跨 2 午夜）；灰鼠分支 T+2 完结前（跨 3 午夜）
        const limit = mode === 'pendant' ? 2 : 3
        return (npc.flags?.isnaDistressDays ?? 0) >= limit
      },
      effects: {
        npcFlags: {
          captured_orc: true,
          orcCaptiveDays: 0,
          isna_camp_distress: null
        }
      },
      text: '迟迟未能等来援军，藏身处最终被黑兽人搜捕队撬开，{name}力竭被擒并押入前哨地牢深处。'
    },
    {
      id: 'isna_wilds_rescue_gulan_fallen',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc }) => {
        const gulan = world.npcs?.gulan
        return Boolean(npc.flags?.isna_help_real) &&
          Boolean(npc.flags?.isna_camp_distress || npc.flags?.captured_orc) &&
          !npc.flags?.isna_fallen_orc &&
          !npc.flags?.isna_captured_ed &&
          Boolean(gulan && gulan.alive !== false && (gulan.stage ?? 0) >= 3 && !gulan.flags?.gulan_departed)
      },
      effects: [
        { target: 'world', worldFlags: { orc_camp_destroyed: true } },
        {
          target: 'isna',
          npcFlags: {
            isna_captured_ed: true,
            captured_orc: false,
            isna_camp_distress: null,
            isna_help_real: false
          }
        }
      ],
      text: '截获{name}的求救信号后，早已接纳古龙真血常态龙化的古兰没有带上你，独自踏破城外黑兽人前哨据点并将守军悉数肃清；获救的{name}未能回到旅店，反而被古兰直接转交给了暗处的艾德掌控。'
    },
    {
      id: 'isna_wilds_rescue_gulan_solo',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc }) => {
        const gulan = world.npcs?.gulan
        return Boolean(npc.flags?.isna_help_real) &&
          Boolean(npc.flags?.isna_camp_distress || npc.flags?.captured_orc) &&
          !npc.flags?.isna_fallen_orc &&
          !npc.flags?.isna_captured_ed &&
          Boolean(world.flags?.eileen_fugitive && !world.flags?.baron_purged) &&
          world.playerLocation !== 'inn' &&
          Boolean(gulan && gulan.alive !== false && (gulan.stage ?? 0) < 3 && gulan.location === 'inn')
      },
      effects: [
        { target: 'gulan', add: { blood_density: 10 } },
        {
          target: 'isna',
          move: 'inn',
          forceMove: true,
          add: { gold_desire: -30 },
          npcFlags: {
            captured_orc: false,
            isna_camp_distress: null,
            isna_help_real: false,
            gold_desire_frozen: false
          }
        }
      ],
      text: '灰鼠带回求救信时你正随反攻小队在外流亡，留在断剑与麦酒旅店的古兰见状立刻独自驰援黑兽人前哨据点；她激发龙血化正面击溃千夫长克罗格与守军（古兰血脉浓度 +10），将脱险的{name}护送回旅店休整。'
    },
    {
      id: 'isna_wilds_rescue_real',
      mode: 'interaction',
      scope: 'npc',
      targets: ['isna'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc }) => {
        const gulan = world.npcs?.gulan
        return Boolean(npc.flags?.isna_help_real) &&
          Boolean(npc.flags?.isna_camp_distress || npc.flags?.captured_orc) &&
          !npc.flags?.isna_fallen_orc &&
          !npc.flags?.isna_captured_ed &&
          !(Boolean(world.flags?.eileen_fugitive && !world.flags?.baron_purged) && world.playerLocation !== 'inn' && gulan?.location === 'inn') &&
          Boolean(gulan && gulan.alive !== false && (gulan.stage ?? 0) < 3)
      },
      expireWhen: ({ world, npc }) =>
        !npc.flags?.isna_help_real ||
        Boolean(npc.flags?.isna_fallen_orc || npc.flags?.isna_captured_ed) ||
        (!npc.flags?.isna_camp_distress && !npc.flags?.captured_orc) ||
        (world.npcs?.gulan?.stage ?? 0) >= 3,
      text: '确认了{name}受困于城外黑兽人前哨据点的求救方位后，古兰已提剑整装待发，正看着你决定是否即刻动身赶往荒原据点营救。',
      outcomes: {
        rescue_now: {
          when: ({ world }) => ['inn', 'town', 'wilds', 'wilds_camp'].includes(world.playerLocation),
          effects: [
            { target: 'gulan', add: { blood_density: 10, affection: 4 } },
            {
              target: 'isna',
              move: 'inn',
              forceMove: true,
              add: { gold_desire: -30, affection: 8 },
              npcFlags: {
                captured_orc: false,
                isna_camp_distress: null,
                isna_help_real: false,
                gold_desire_frozen: false
              }
            }
          ],
          text: '你随古兰星夜奔袭城外黑兽人前哨据点。面对千夫长克罗格与精锐守军合围，古兰果断开启龙血化速战速决（古兰血脉浓度 +10），成功撕开防线将{name}护送回断剑与麦酒旅店（伊丝娜金钱渴望 -30，好感度 +8）。'
        }
      }
    },
    {
      id: 'wilds_rescue_trap_low',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc }) => {
        const gulan = world.npcs?.gulan
        return Boolean(npc.flags?.isna_fallen_orc) &&
          !npc.flags?.isna_trap_fired &&
          Boolean(gulan && gulan.alive !== false && (gulan.stage ?? 0) < 2 && !gulan.flags?.gulan_departed)
      },
      effects: [
        { target: 'gulan', add: { blood_density: 20 } },
        { target: 'isna', npcFlags: { isna_trap_fired: true } }
      ],
      text: '沦陷于兽人营地的{name}发出了绕过你、单向诱引古兰的假求救信号。古兰开启龙血化杀入营地却遭早已密谋好的{name}以反龙器具暗中偷袭，惊怒之下强行进一步催动血脉，拼死重伤突围脱身（古兰血脉浓度 +20）。'
    },
    {
      id: 'wilds_rescue_trap_mud_high',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc }) => {
        const gulan = world.npcs?.gulan
        return Boolean(npc.flags?.isna_fallen_orc) &&
          !npc.flags?.isna_trap_fired &&
          Boolean(gulan && gulan.alive !== false && (gulan.stage ?? 0) === 2 && !gulan.flags?.gulan_departed) &&
          (gulan.values?.affection ?? 0) >= 90
      },
      effects: [
        { target: 'gulan', move: 'inn', forceMove: true, add: { blood_density: 20 } },
        { target: 'isna', npcFlags: { isna_trap_fired: true } }
      ],
      text: '沦陷的{name}发出单向假求救将古兰诱入黑兽人前哨据点。泥足期的古兰激斗中遭{name}持针对性禁锢器具暗算；出于对你的深厚羁绊与意志坚守，强催血脉重创敌阵杀出重围，负伤撤回旅店休整（古兰血脉浓度 +20）。'
    },
    {
      id: 'wilds_rescue_trap_mud_low',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc }) => {
        const gulan = world.npcs?.gulan
        return Boolean(npc.flags?.isna_fallen_orc) &&
          !npc.flags?.isna_trap_fired &&
          Boolean(gulan && gulan.alive !== false && (gulan.stage ?? 0) === 2 && !gulan.flags?.gulan_departed) &&
          (gulan.values?.affection ?? 0) < 90
      },
      effects: ({ world }) => [
        { target: 'gulan', move: 'wilds_camp', forceMove: true, npcFlags: { captured_orc: true, gulan_departed: true } },
        { target: 'isna', npcFlags: { isna_trap_fired: true } },
        { target: 'world', worldFlags: { gulan_trap_captured_day: dayAt(world) } }
      ],
      text: '沦陷的{name}发出单向假求救将古兰诱入黑兽人前哨据点。处于泥足期的古兰激斗中遭{name}持针对性禁锢器具偷袭，在克制与围攻下力竭被擒，关押于据点深处。'
    },
    {
      id: 'gulan_rescue_player_rush_camp',
      mode: 'result',
      scope: 'world',
      when: ({ world }) => {
        const gulan = world.npcs?.gulan
        return Boolean(gulan?.flags?.captured_orc) &&
          !world.flags?.orc_camp_destroyed &&
          world.playerLocation === 'wilds_camp'
      },
      effects: [
        { target: 'world', playerMove: 'wilds' }
      ],
      text: '你试图接近黑兽人前哨据点营救古兰，但作为见习冒险者连营地外围重重哨卡都无法突破，暗哨与巡逻栅栏密布，只得无功而返退回荒原；若执意硬闯，必定会被营地精锐围杀。'
    },
    {
      id: 'gulan_orc_camp_destroyed_resolve_with_note',
      priority: 15,
      mode: 'result',
      scope: 'world',
      when: ({ world }) => {
        const gulan = world.npcs?.gulan
        const day = Math.floor(world.timeMin / 1440) + 1
        const capturedDay = world.flags?.gulan_trap_captured_day ?? (gulan?.flags?.captured_orc ? day : 0)
        return Boolean(gulan?.flags?.captured_orc) &&
          Boolean(world.flags?.gulan_note_delivered) &&
          !world.flags?.gulan_escape_confessed &&
          day >= capturedDay + 2 &&
          (world.playerLocation === 'inn' || world.playerLocation === gulan?.location) &&
          !world.flags?.orc_camp_destroyed
      },
      effects: [
        { target: 'world', worldFlags: { orc_camp_destroyed: true, gulan_escape_confessed: true } },
        { target: 'isna', alive: false, npcFlags: { captured_orc: false, isna_fallen_orc: false } },
        {
          target: 'gulan',
          move: 'inn',
          forceMove: true,
          add: { blood_density: 20 },
          npcFlags: { captured_orc: false, gulan_departed: false }
        }
      ],
      text: '古兰负伤返回与你碰面。她向你自述：自己营救时被伊丝娜偷袭，导致力竭被俘获。当兽人想奸淫她时，只听见巨大的咆哮和震动，营帐外面乱声四起，自己所在的营帐也被巨大的火焰击中；她趁机挣脱了束缚，斩杀了被火焰重伤的兽人，突围而出。但是营地除了自己已无一活口……包括偷袭自己的伊丝娜。（古兰血脉浓度 +20）'
    },
    {
      id: 'gulan_orc_camp_destroyed_resolve_no_note',
      priority: 15,
      mode: 'result',
      scope: 'world',
      when: ({ world }) => {
        const gulan = world.npcs?.gulan
        const day = Math.floor(world.timeMin / 1440) + 1
        const capturedDay = world.flags?.gulan_trap_captured_day ?? (gulan?.flags?.captured_orc ? day : 0)
        return Boolean(gulan?.flags?.captured_orc) &&
          !world.flags?.gulan_note_delivered &&
          !world.flags?.gulan_escape_confessed &&
          day >= capturedDay + 2 &&
          (world.playerLocation === 'inn' || world.playerLocation === gulan?.location) &&
          !world.flags?.orc_camp_destroyed
      },
      effects: [
        { target: 'world', worldFlags: { orc_camp_destroyed: true, gulan_escape_confessed: true } },
        { target: 'isna', alive: false, npcFlags: { captured_orc: false, isna_fallen_orc: false } },
        {
          target: 'gulan',
          move: 'inn',
          forceMove: true,
          add: { blood_density: 20 },
          npcFlags: { captured_orc: false, gulan_departed: false }
        }
      ],
      text: '古兰负伤返回与你碰面。她心有余悸地开口：“营救前我留下了纸条，还好你没有乱来营救。”随后向你自述：自己营救时被伊丝娜偷袭，导致力竭被俘获。当兽人想奸淫她时，只听见巨大的咆哮和震动，营帐外面乱声四起，自己所在的营帐也被巨大的火焰击中；她趁机挣脱了束缚，斩杀了被火焰重伤的兽人，突围而出。但是营地除了自己已无一活口……包括偷袭自己的伊丝娜。（古兰血脉浓度 +20）'
    },
    {
      id: 'gulan_rescue_note_delivered',
      priority: 10,
      mode: 'result',
      scope: 'world',
      when: ({ world }) => {
        const gulan = world.npcs?.gulan
        const ed = world.npcs?.ed
        const day = Math.floor(world.timeMin / 1440) + 1
        const capturedDay = world.flags?.gulan_trap_captured_day ?? (gulan?.flags?.captured_orc ? day : 0)
        return Boolean(gulan?.flags?.captured_orc) &&
          !world.flags?.orc_camp_destroyed &&
          !world.flags?.gulan_note_delivered &&
          !world.flags?.gulan_escape_confessed &&
          world.playerLocation === 'inn' &&
          day > capturedDay &&
          Boolean(ed && ed.alive !== false)
      },
      effects: [
        { target: 'world', worldFlags: { gulan_note_delivered: true } }
      ],
      text: '随行学徒爱德拿来一张折叠的纸条交给你，说是古兰师傅昨天急匆匆离开前让他转交给你的。纸条上写着古兰收到伊丝娜的求救前去荒原救援，并特别写明：如果自己一天都没有回来，那么营地存在着小队现阶段难以抗衡的强敌，千万不要贸然前往救援。'
    },
    {
      id: 'wilds_rescue_trap_fallen',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc }) => {
        const gulan = world.npcs?.gulan
        return Boolean(npc.flags?.isna_fallen_orc) &&
          !npc.flags?.isna_trap_fired &&
          Boolean(gulan && gulan.alive !== false && (gulan.stage ?? 0) >= 3 && !gulan.flags?.gulan_departed)
      },
      effects: [
        { target: 'world', worldFlags: { orc_camp_destroyed: true } },
        { target: 'isna', npcFlags: { isna_trap_fired: true, isna_captured_ed: true, captured_orc: false } }
      ],
      text: '{name}以假求救诱引古兰赴营，但常态龙化的古兰面对反龙偷袭毫不动摇，反手横扫并覆灭整座黑兽人前哨据点，随即将{name}押回转交艾德掌控。'
    },
    {
      id: 'lord_hiring',
      priority: 10,
      mode: 'result',
      scope: 'world',
      when: ({ world, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.baron_purged &&
        dayAt(world) >= arrivedDayOf(world) + 2 &&
        ['morning', 'afternoon'].includes(phase.id),
      text: '镇上告示牌贴出领主府的招募文书，称山庄正以三倍高薪招收手脚勤快、识字算账的长期女仆与差役。',
      effects: { worldFlags: { lord_hiring: true } }
    },
    {
      id: 'aurora_take_manor_job_weekday',
      priority: 5,
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven && world.flags?.lord_hiring && !world.flags?.baron_purged) &&
        ['morning', 'afternoon'].includes(phase.id) &&
        !isWeekendDay(dayAt(world)) &&
        !npc.flags?.aurora_job_taken &&
        !npc.flags?.manor_service_active &&
        !npc.flags?.aurora_left_manor &&
        npc.stage < 3 &&
        (npc.values.debt_pressure ?? 0) > 0,
      effects: {
        move: 'manor',
        npcFlags: { aurora_job_taken: true, manor_service_active: true, manorWorkDays: 0 }
      },
      text: '看见告示牌上高出平日三倍的佣金，{name}对着手中家书犹豫良久，低声向众人道了句想替家里和大家多攒些盘缠，随即离队前往领主山庄任职（仅周六、周日归队）。'
    },
    {
      id: 'aurora_take_manor_job_weekend',
      priority: 5,
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven && world.flags?.lord_hiring && !world.flags?.baron_purged) &&
        ['morning', 'afternoon'].includes(phase.id) &&
        isWeekendDay(dayAt(world)) &&
        !npc.flags?.aurora_job_taken &&
        !npc.flags?.manor_service_active &&
        !npc.flags?.aurora_left_manor &&
        npc.stage < 3 &&
        (npc.values.debt_pressure ?? 0) > 0,
      effects: {
        npcFlags: { aurora_job_taken: true, manor_service_active: true, manorWorkDays: 0 }
      },
      text: '看见告示牌上三倍高薪的招募告示，{name}思索再三还是接下了山庄女仆差事；正逢周末休假，她先留在旅店陪伴众人，准备周一清晨再去领主山庄正式上工。'
    },
    {
      id: 'aurora_lord_punishment',
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.eileen_fugitive && !world.flags?.baron_purged) &&
        Boolean(npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor) &&
        npc.stage < 3 &&
        !npc.flags?.aurora_grey_rat_shield &&
        !npc.flags?.aurora_lord_punished &&
        npc.location === 'manor' &&
        !isWeekendDay(dayAt(world)) &&
        ['morning', 'afternoon'].includes(phase.id),
      effects: { npcFlags: { aurora_lord_punished: true } },
      text: '领主府追查起巡查使艾琳在冒险者掩护下逃走一事，雷蒙德男爵迁怒到当初跑去公会发布任务的{name}头上并严加苛责施压（因未获灰鼠及时传信，事件二、三所需工作日各提前三天）。'
    },
    {
      id: 'aurora_manor_evt2_delay',
      priority: 8,
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc, phase }) => {
        const reqDays = 7 - (npc.flags?.aurora_lord_punished ? 3 : 0)
        return (
          Boolean(world.flags?.arrived_oakhaven && npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor && !world.flags?.baron_purged) &&
          Boolean(npc.flags?.aurora_evt1_done) &&
          !npc.flags?.aurora_evt2_done &&
          !npc.flags?.aurora_evt2_delayed &&
          npc.stage === 1 &&
          npc.location === 'manor' &&
          !isWeekendDay(dayAt(world)) &&
          ['morning', 'afternoon'].includes(phase.id) &&
          (npc.values.debt_pressure ?? 0) > 0 &&
          (npc.flags?.manorWorkDays ?? 0) >= reqDays &&
          (npc.values.affection ?? 0) >= 90
        )
      },
      effects: {
        npcFlags: { aurora_evt2_delayed: true }
      },
      text: '雷蒙德男爵捧着足够再抵三成旧债的重金提出夜宿特侍要求；念及与你确立的恋人情分，{name}眼眶微红却咬紧牙关推辞了当晚留宿，领主暗忖她仍欠巨债，姑且宽限七个工作日再作答复。'
    },
    {
      id: 'aurora_manor_evt3_refuse',
      priority: 8,
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc, phase }) => {
        const reqDays = 21 - (npc.flags?.aurora_lord_punished ? 3 : 0)
        return (
          Boolean(world.flags?.arrived_oakhaven && npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor && !world.flags?.baron_purged) &&
          Boolean(npc.flags?.aurora_evt2_done) &&
          !npc.flags?.aurora_evt3_done &&
          npc.stage === 2 &&
          npc.location === 'manor' &&
          !isWeekendDay(dayAt(world)) &&
          ['morning', 'afternoon'].includes(phase.id) &&
          (npc.values.debt_pressure ?? 0) > 0 &&
          (npc.flags?.manorWorkDays ?? 0) >= reqDays &&
          (npc.values.affection ?? 0) >= 90
        )
      },
      effects: {
        move: 'inn',
        npcFlags: { manor_service_active: false, aurora_left_manor: true, aurora_evt3_done: true }
      },
      text: '雷蒙德领主摊出替她直接清空全部剩余旧债的长期情妇契约。{name}望着面前金币，想起始终在等待她的你，终于轻声却坚定地摇了头——宁可留着余债慢慢偿还，也决不留在宅邸充当情妇，当天便交回钥匙辞工赶回旅店归队。'
    },
    {
      id: 'aurora_debt_cleared_quit',
      priority: 9,
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ npc }) =>
        Boolean(npc.flags?.manor_service_active) &&
        !npc.flags?.aurora_left_manor &&
        npc.stage < 3 &&
        (npc.values.debt_pressure ?? 0) <= 0,
      effects: {
        move: 'inn',
        npcFlags: { manor_service_active: false, aurora_left_manor: true }
      },
      text: '压在心头的千金旧债终于已全部结清，{name}递交辞呈正式辞去领主山庄差事，神情松快地收拾行囊返回断剑与麦酒旅店归队。'
    },
    {
      id: 'aurora_debt_disclose',
      priority: 4,
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !npc.flags?.aurora_debt_disclosed &&
        npc.stage < 3 &&
        (npc.values.debt_pressure ?? 0) > 0 &&
        (npc.values.affection ?? 0) >= 80 &&
        ['inn', 'church'].includes(world.playerLocation) &&
        world.playerLocation === npc.location,
      effects: {
        npcFlags: { aurora_debt_disclosed: true }
      },
      text: '四下无外人打扰时，{name}攥着记账小皮册低着头终于向你吐露了家族欠下足足千金旧债的实情；这一次她没有再一个人强撑推辞，红着脸轻声点头愿意接受你的帮助。'
    },
    {
      id: 'aurora_manor_unease',
      priority: 3,
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven && npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor && !world.flags?.baron_purged) &&
        isWeekendDay(dayAt(world)) &&
        !npc.flags?.aurora_manor_unease_told &&
        npc.stage === 0 &&
        (npc.values.affection ?? 0) >= 90 &&
        ['inn', 'church'].includes(world.playerLocation) &&
        world.playerLocation === npc.location,
      effects: {
        npcFlags: { aurora_manor_unease_told: true }
      },
      text: '周末归队重逢时，{name}依赖地挨在你身边低声提起，说山庄二楼私室气氛总有些沉闷，领主大人的打量眼神也教人发憷。'
    },
    {
      id: 'aurora_manor_confess',
      priority: 4,
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven && npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor && !world.flags?.baron_purged) &&
        isWeekendDay(dayAt(world)) &&
        !npc.flags?.aurora_manor_confessed &&
        npc.stage >= 1 &&
        npc.stage < 3 &&
        (npc.values.affection ?? 0) >= 90 &&
        ['inn', 'church'].includes(world.playerLocation) &&
        world.playerLocation === npc.location,
      effects: {
        npcFlags: { aurora_manor_confessed: true }
      },
      text: '周末归队独处无外人时，{name}终于再也撑不住平时的微笑面具，低声抽泣着把领主府二楼的真相告诉了你——之前抵掉旧债的钱并不是正经工钱，而是男爵给的封口费与留宿私密要求，她攥紧你的衣袖请求帮助。'
    },
    {
      id: 'eileen_arrive',
      mode: 'result',
      scope: 'world',
      when: ({ world, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.eileen_arrived &&
        !world.flags?.baron_purged &&
        dayAt(world) >= 15 &&
        ['morning', 'afternoon', 'night'].includes(phase.id),
      effects: [
        { target: 'world', worldFlags: { eileen_arrived: true } },
        { target: 'eileen', monitored: true, move: 'manor', npcFlags: { eileenInspectDays: 0 } }
      ],
      text: '镇门号角吹响，一队王都仪仗车马沿官道上山入驻领主山庄——王国特派三等巡查使艾琳·冯·兰开斯特奉命前来审计边疆账务；高傲的名门千金眼下只按公文程序接受雷蒙德男爵宴待，不与镇上见习冒险者往来。'
    },
    {
      id: 'aurora_eileen_arrive_tip',
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.eileen_arrived && !world.flags?.eileen_departed && !world.flags?.baron_purged) &&
        auroraManorInsider(world) &&
        !npc.flags?.aurora_told_eileen_arrival &&
        world.playerLocation === 'inn' &&
        npc.location === 'inn',
      effects: { npcFlags: { aurora_told_eileen_arrival: true } },
      text: '趁夜里回旅店歇脚时，{name}轻声向你提起山庄近况：近日刚来了一位王都派下来的女巡查使，是个衣着华贵、神情高傲的千金大小姐，正由男爵亲自安排在客套房款待。'
    },
    {
      id: 'eileen_escort_offer',
      mode: 'interaction',
      scope: 'npc',
      targets: ['eileen'],
      allowCancel: false,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.eileen_arrived && !world.flags?.eileen_departed && !world.flags?.baron_purged) &&
        ['morning', 'afternoon'].includes(phase.id) &&
        (npc.flags?.eileenInspectDays ?? 0) >= 6 &&
        auroraManorInsider(world),
      effects: { worldFlags: { eileen_departed: true } },
      text: '王都特使{name}完成奥克赫斯巡查并向王都发出返程报信函件。离开前她嘱咐侍女奥萝拉去镇上冒险者公会挂出一份报酬优渥的密封护送任务，念着与你的交情，奥萝拉优先赶来私下把这份委托悄悄递到你手边。',
      outcomes: {
        accept: {
          effects: [
            { target: 'world', playerMove: 'wilds', worldFlags: { eileen_departed: true, eileen_fugitive: true } },
            { target: 'eileen', add: { affection: 30 }, npcFlags: { eileen_fugitive: true, eileen_disguised: true } }
          ],
          text: '出城半途突遭掩盖身份的领主私兵合围截杀！古兰因不干涉公会常规护送未曾同行，同行雇佣卫士死战断后；队伍趁乱杀出重围遁入荒原，{name}急忙掏出暗袋里的王室魔能讯号管求救，却愕然发现管体早被男爵偷换为不能激发的赝品。'
        },
        decline: {
          effects: [
            { target: 'world', worldFlags: { eileen_departed: true } },
            { target: 'eileen', npcFlags: { eileen_captured: true, eileenCaptiveDays: 0 } }
          ],
          text: '护送委托未获接下。{name}随少量随从自行出镇半程后遭掩盖身份的领主私兵突袭围捕，捏碎暗袋中早被掉包的伪造讯号管求助无门，连人被暗中押回山庄密室秘囚；因事先已发回都信函，外界竟无一人察觉异常。'
        }
      }
    },
    {
      id: 'eileen_depart_dark_unassisted',
      mode: 'result',
      scope: 'npc',
      targets: ['eileen'],
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.eileen_arrived && !world.flags?.eileen_departed && !world.flags?.baron_purged) &&
        ['morning', 'afternoon'].includes(phase.id) &&
        (npc.flags?.eileenInspectDays ?? 0) >= 6 &&
        !auroraManorInsider(world),
      effects: [
        { target: 'world', worldFlags: { eileen_departed: true } },
        { target: 'eileen', npcFlags: { eileen_captured: true, eileenCaptiveDays: 0 } }
      ],
      text: '{name}结束镇内巡查并向王都寄出“已完检启程回都”公文后独自起程，却在出镇半道遭到掩盖徽记的领主私兵伏击！她在混乱中欲催动王室魔能讯号管，竟发现已被暗中掉包，最终寡不敌众遭擒回领主山庄秘室幽禁。'
    },
    {
      id: 'eileen_escape_move_wilds',
      mode: 'result',
      scope: 'npc',
      targets: ['eileen'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.eileen_fugitive && npc.flags?.eileen_fugitive && !world.flags?.baron_purged) &&
        !npc.flags?.eileen_fugitive_moved,
      effects: { npcFlags: { eileen_fugitive_moved: true, eileen_disguised: true } },
      text: '甩脱领主私兵第一轮合围追截后，{name}随即取兜帽披风默认乔装遮面、收敛王徽与细剑，自此无论宿野入镇都与你全程同步进退。'
    },
    {
      id: 'eileen_ambush_isna_aid',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.eileen_fugitive && !world.flags?.eileen_ambush_closed && !world.flags?.baron_purged) &&
        !npc.flags?.gold_desire_frozen &&
        !npc.flags?.captured_orc &&
        !npc.flags?.isna_fallen_orc &&
        !npc.flags?.isna_captured_ed &&
        !npc.flags?.isna_fallen_labyrinth &&
        npc.stage < 3 &&
        npc.location !== 'wilds_camp' &&
        npc.activity?.releaseRule !== 'manualRelease' &&
        !world.npcs?.eileen?.flags?.eileen_isna_counted,
      effects: [
        { target: 'eileen', add: { counterattack: 10 }, npcFlags: { eileen_isna_counted: true } },
        { target: 'aurora', npcFlags: { aurora_grey_rat_shield: true } },
        { target: 'isna', npcFlags: { eileen_isna_helped: true } }
      ],
      text: '护送突围中在队的{name}凭老练盗贼耳目摸清领主山庄潜入路线，奠定偷取魔能管把握（艾琳反攻值 +10）；临撤入荒原前她又放出通灵灰鼠潜入山庄暗报奥萝拉提早防备，替她摘清了发单迁怒的隐患。'
    },
    {
      id: 'eileen_ambush_nise_aid_high',
      mode: 'result',
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.eileen_fugitive && !world.flags?.eileen_ambush_closed && !world.flags?.baron_purged) &&
        npc.stage < 3 &&
        !npc.flags?.nise_fled_casino &&
        npc.activity?.releaseRule !== 'manualRelease' &&
        (npc.values.affection ?? 0) >= 80 &&
        !world.npcs?.eileen?.flags?.eileen_nise_counted,
      effects: [
        { target: 'eileen', add: { counterattack: 5 }, npcFlags: { eileen_nise_counted: true } },
        { target: 'nise', npcFlags: { eileen_nise_helped: true, nise_casino_busy_today: false } }
      ],
      text: '念及与哥哥同甘共苦的羁绊，高好感的{name}果断搁下镇上杂务直接入队同行；她沿途动用法术感应测算出山庄暗哨与魔能封印节点（艾琳反攻值 +5），为后续潜回反攻攒足先手情报。'
    },
    {
      id: 'eileen_ambush_nise_aid',
      mode: 'result',
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.eileen_fugitive && !world.flags?.eileen_ambush_closed && !world.flags?.baron_purged) &&
        npc.stage < 3 &&
        !npc.flags?.nise_fled_casino &&
        (npc.values.affection ?? 0) < 80 &&
        npc.activity?.releaseRule !== 'manualRelease' &&
        !npc.flags?.nise_casino_busy_today &&
        !world.npcs?.eileen?.flags?.eileen_nise_counted,
      effects: [
        { target: 'eileen', add: { counterattack: 5 }, npcFlags: { eileen_nise_counted: true } },
        { target: 'nise', npcFlags: { eileen_nise_helped: true } }
      ],
      text: '同在护送小队中的{name}沿途动用法术感应测算出山庄暗哨与魔能封印节点（艾琳反攻值 +5），为后续潜回反攻攒足先手情报。'
    },
    {
      id: 'eileen_ambush_isna_move_wilds',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.eileen_fugitive && !world.flags?.baron_purged) &&
        Boolean(npc.flags?.eileen_isna_helped) &&
        !npc.flags?.eileen_isna_moved,
      effects: { npcFlags: { eileen_isna_moved: true } },
      text: '护送突围后，同行在队的{name}随你一并退避至城外荒原潜行汇合；反攻期间她将全程随你同进同退、位置同步锁定，原日常挣钱行动与金欲涨落暂行搁置。'
    },
    {
      id: 'eileen_ambush_nise_move_wilds',
      mode: 'result',
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.eileen_fugitive && !world.flags?.baron_purged) &&
        Boolean(npc.flags?.eileen_nise_helped) &&
        !npc.flags?.eileen_nise_moved,
      effects: { npcFlags: { eileen_nise_moved: true } },
      text: '护送突围后，同行的{name}也已随你退往荒原暂避追兵；反攻期间她将全程随你同进同退、位置同步锁定，不会再独自去镇上闲逛、偷赌或脱队。'
    },
    {
      id: 'eileen_ambush_window_close',
      mode: 'result',
      scope: 'world',
      when: ({ world }) => Boolean(world.flags?.eileen_fugitive && !world.flags?.eileen_ambush_closed),
      effects: { worldFlags: { eileen_ambush_closed: true } },
      text: '雷蒙德领主得知艾琳在半路突围失踪，随即将四门封锁并派出大队私兵入野搜捕；古兰确认伯里尚无性命之虞按规矩留守镇上不掺和纷争。'
    },
    {
      id: 'aurora_pass_manor_intel',
      mode: 'interaction',
      scope: 'npc',
      targets: ['aurora'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc }) =>
        Boolean(world.flags?.eileen_fugitive && !world.flags?.baron_purged) &&
        Boolean(npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor) &&
        npc.stage < 3 &&
        (npc.values.affection ?? 0) >= 80 &&
        !npc.flags?.aurora_eileen_intel_given &&
        world.playerLocation === npc.location,
      text: '你在稳妥时机与在山庄当差的{name}私下碰面了；她左右确认无人盯梢，正紧张地朝你靠近，似乎记下了领主书房内室的重要秘密准备通报。',
      outcomes: {
        receive_intel: {
          when: ({ world, npc }) => world.playerLocation === npc.location,
          effects: [
            { target: 'world', itemsAdd: [{ id: 'manor_intel_note', count: 1 }] },
            { target: 'eileen', add: { counterattack: 20 } },
            { target: 'aurora', npcFlags: { aurora_eileen_intel_given: true } }
          ],
          text: '{name}低声交出自己端茶收拾时悄悄记下的山庄私室换防间隙与领主暗锁密码，艾琳一方的反攻筹备迈出一大步（艾琳反攻值 +20）。'
        }
      }
    },
    {
      id: 'eileen_reclaim_tube',
      mode: 'interaction',
      scope: 'npc',
      targets: ['eileen'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc }) =>
        Boolean(world.flags?.eileen_fugitive && !world.flags?.eileen_signal_fired && !world.flags?.baron_purged) &&
        (npc.values.counterattack ?? 0) >= 100,
      text: '历经荒野蓄势与各方情报汇总（反攻值已满 100），{name}眼神沉静而果断地看向领主山庄方向——潜回山庄夺回那支被掉包的真正王室魔能讯号管，时机已成熟。',
      outcomes: {
        strike: {
          when: ({ world }) => ['wilds', 'manor', 'inn', 'town'].includes(world.playerLocation),
          effects: [
            { target: 'world', worldFlags: { eileen_signal_fired: true }, itemsRemove: [{ id: 'manor_intel_note', all: true }] },
            { target: 'eileen', npcFlags: { eileen_signal_fired: true, eileenSignalDays: 0 } }
          ],
          text: '众人趁夜摸入领主山庄防线深处破开暗格，{name}亲手夺回原装王室魔能讯号管当空拉响传讯焰火！兰开斯特家族东境狮鹫骑士团瞬间收到召唤，一日后即将降临奥克赫斯！'
        }
      }
    },
    {
      id: 'eileen_lancaster_purge',
      mode: 'result',
      scope: 'world',
      when: ({ world }) =>
        Boolean(world.flags?.eileen_signal_fired && !world.flags?.baron_purged) &&
        (world.npcs?.eileen?.flags?.eileenSignalDays ?? 0) >= 1,
      effects: [
        {
          target: 'world',
          goldDelta: 1000,
          itemsRemove: [{ id: 'manor_intel_note', all: true }],
          worldFlags: { baron_purged: true, eileen_fugitive: false, lancaster_purge_reward_paid: true, inn_arrears: false }
        },
        { target: 'eileen', add: { affection: 20 }, npcFlags: { eileen_fugitive: false, eileen_disguised: false, eileen_purged_victory: true, eileenPostPurgeDays: 0 } }
      ],
      text: '发出传讯次日，翼展蔽空的兰开斯特家族狮鹫骑士团（全员三阶精锐，正副团长为四阶宗师）威严降临奥克赫斯上空！雷蒙德男爵私兵伏诛，男爵本人遭当场清算处决；兰开斯特家族颁发重金赏赐，艾琳感激之余神情也随之柔和下来（好感度 +20）。'
    },
    {
      id: 'eileen_purge_aurora_fallen',
      mode: 'result',
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.baron_purged) &&
        npc.stage === 3 &&
        !npc.flags?.aurora_purged_with_baron,
      effects: {
        monitored: false,
        npcFlags: { manor_service_active: false, aurora_purged_with_baron: true }
      },
      text: '清算行动中，早已沦为领主山庄永久情妇的{name}未能脱身，与雷蒙德男爵一并被兰开斯特家族骑士团带走清算处置。'
    },
    {
      id: 'eileen_purge_aurora_freed',
      mode: 'result',
      idleOnly: true,
      scope: 'npc',
      targets: ['aurora'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.baron_purged) &&
        npc.stage < 3 &&
        Boolean(npc.flags?.manor_service_active && !npc.flags?.aurora_left_manor),
      effects: {
        move: 'inn',
        npcFlags: { manor_service_active: false, aurora_left_manor: true }
      },
      text: '随着雷蒙德男爵伏诛倒台，压在山庄与{name}头顶的勒索契约一同作废；她得以脱身返回旅店归队（既往阶段留存不变，剩余家族外债仍需另行设法清偿）。'
    },
    {
      id: 'eileen_purge_nise_fallen',
      mode: 'result',
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.baron_purged) &&
        npc.stage === 3 &&
        !npc.flags?.nise_fled_casino,
      effects: {
        monitored: false,
        npcFlags: { nise_fled_casino: true }
      },
      text: '领主府一朝坍塌，金碧赌场瞬间失去官方保护伞；黑巨汉三人组见势不妙席卷大笔现金夜逃出境，早已签下卖身契沦陷的{name}也随之流落离开奥克赫斯，去向不明。'
    },
    {
      id: 'eileen_purge_nise_freed',
      mode: 'result',
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.baron_purged) &&
        npc.stage < 3 &&
        !npc.flags?.nise_umbrella_broken,
      effects: {
        npcFlags: { nise_umbrella_broken: true, casino_debt_frozen: true }
      },
      text: '领主府倒台后，黑巨汉失去地方武力背书仓皇避祸，金碧赌场再也无法借官府高压强扣{name}逼债（过往经历的阶段依然留存）。'
    },
    {
      id: 'eileen_marriage_grant',
      mode: 'result',
      scope: 'npc',
      targets: ['eileen'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.baron_purged) &&
        !world.flags?.player_barony_granted &&
        !npc.flags?.eileen_returned_capital &&
        (npc.values.affection ?? 0) >= 90,
      effects: [
        { target: 'world', worldFlags: { player_barony_granted: true }, itemsAdd: [{ id: 'barony_patent', count: 1 }] },
        { target: 'eileen', npcFlags: { eileen_betrothed: true } }
      ],
      text: '在狮鹫骑士团团长与兰开斯特家族见证下，与你患难生情、爱恋笃定的{name}亲自申请与你缔结婚约；家族大喜之下正式将奥克赫斯镇及原雷蒙德男爵辖下领地封赏于你，册封贵族爵位。'
    },
    {
      id: 'eileen_depart_with_knights',
      mode: 'result',
      scope: 'npc',
      targets: ['eileen'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.baron_purged) &&
        !world.flags?.player_barony_granted &&
        !npc.flags?.eileen_betrothed &&
        !npc.flags?.eileen_returned_capital &&
        (npc.values.affection ?? 0) < 90 &&
        (npc.flags?.eileenPostPurgeDays ?? 0) >= 1,
      effects: {
        monitored: false,
        npcFlags: { eileen_returned_capital: true }
      },
      text: '虽已成功清剿雷蒙德并颁下重金酬谢，但你与{name}终究未及缔结婚约的深挚情分。翌日在奥克赫斯完成交接与案卷核封后，{name}郑重向你道别，随兰开斯特狮鹫骑士团一同起飞返程回王都复命离队。'
    },
    {
      id: 'eileen_three_month_inspection',
      mode: 'result',
      scope: 'npc',
      targets: ['eileen'],
      when: ({ world, npc }) =>
        Boolean(npc.flags?.eileen_captured && !world.flags?.baron_purged) &&
        npc.stage === 3 &&
        !npc.flags?.eileen_inspection_covered &&
        (npc.flags?.eileenCaptiveDays ?? 0) >= 90,
      effects: { npcFlags: { eileen_inspection_covered: true } },
      text: '自失联囚禁满三个月（九十日）整，兰开斯特家族派遣狮鹫骑士团飞抵奥克赫斯追查特使下落；然而早已在密室被男爵完全调教驯服的{name}却穿戴齐整、神态端庄地走出山庄，替雷蒙德从容掩护圆场，令骑士团确认无误后无事发生返航离去。'
    },
    {
      id: 'orc_camp_bounty_reward',
      mode: 'result',
      scope: 'world',
      when: ({ world }) =>
        Boolean(world.flags?.orc_camp_destroyed) &&
        !world.flags?.orc_camp_bounty_paid &&
        !world.npcs?.isna?.flags?.isna_fallen_orc &&
        (world.npcs?.gulan?.stage ?? 0) < 3,
      effects: {
        goldDelta: 300,
        worldFlags: { orc_camp_bounty_paid: true, inn_arrears: false }
      },
      text: '覆灭黑兽人前哨据点后，你们清点营地遗留财货并向公会交割据点清剿凭证，结清了足额三百枚金币的重赏与战利品（持有金币 +300）。'
    },
    {
      id: 'nise_casino_hint_high',
      mode: 'result',
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage < 3 &&
        !npc.flags?.tasted_casino &&
        !npc.flags?.nise_hint_done &&
        (npc.values.affection ?? 0) >= 80 &&
        (npc.values.curiosity ?? 0) >= 65,
      effects: { npcFlags: { nise_hint_done: true } },
      text: '{name}漫不经心地跟你炫耀镇上商业街深处据说藏着一处用魔法水晶轮盘计赔率的金碧赌场，嘴上说着想去看看那帮老千怎么耍花招，心底正跃跃欲试。'
    },
    {
      id: 'nise_first_taste',
      mode: 'result',
      idleOnly: true,
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage < 3 &&
        !npc.flags?.tasted_casino &&
        (npc.values.curiosity ?? 0) >= 70 &&
        ['morning', 'afternoon'].includes(phase.id) &&
        npc.location === 'town' &&
        !['town', 'casino'].includes(world.playerLocation),
      effects: {
        move: 'casino',
        npcFlags: { tasted_casino: true, casinoGapDays: 0 }
      },
      text: '趁着镇上无人盯梢，{name}好奇压过谨慎溜进商业街金碧赌场试了数把悬晶轮盘，意外赢下一笔零钱后扬眉吐气地揣好钱袋离开。'
    },
    {
      id: 'nise_first_debt',
      mode: 'result',
      idleOnly: true,
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage < 3 &&
        Boolean(npc.flags?.tasted_casino) &&
        !npc.flags?.nise_first_debt_done &&
        (npc.values.gamble_debt ?? 0) === 0 &&
        (npc.flags?.casinoGapDays ?? 0) >= 3 &&
        ['morning', 'afternoon'].includes(phase.id) &&
        world.playerLocation !== 'casino',
      effects: {
        move: 'casino',
        add: { gamble_debt: 10 },
        npcFlags: { nise_first_debt_done: true, casinoGapDays: 0 }
      },
      text: '尝过快钱甜头的{name}瞒着家人再度溜进金碧赌场，却被经验老到的荷官做局接连输空钱袋；急欲翻本的她害怕被古兰知晓责罚，只得按手印签下第一份高利筹码借条（赌债 +10）。'
    },
    {
      id: 'nise_gamble_debt_grow',
      mode: 'result',
      idleOnly: true,
      repeatable: true,
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage < 3 &&
        !npc.flags?.casino_debt_frozen &&
        !npc.flags?.nise_fled_casino &&
        (npc.values.gamble_debt ?? 0) > 0 &&
        (npc.flags?.casinoGapDays ?? 0) >= 3 &&
        ['morning', 'afternoon'].includes(phase.id) &&
        world.playerLocation !== 'casino',
      effects: {
        move: 'casino',
        add: { gamble_debt: 10 },
        npcFlags: { casinoGapDays: 0 }
      },
      text: '不敢向严厉的古兰坦白的{name}抱着自己赢回来平账的侥幸悄悄再入赌场，却又被做局反杀套牢，借条雪球进一步滚大（赌债 +10）。'
    },
    {
      id: 'nise_gamble_relapse',
      mode: 'result',
      idleOnly: true,
      repeatable: true,
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !isFugitiveSquadActive(world, npc) &&
        npc.stage < 3 &&
        !npc.flags?.casino_debt_frozen &&
        !npc.flags?.nise_fled_casino &&
        Boolean(npc.flags?.tasted_casino && npc.flags?.debt_repaid_once) &&
        (npc.values.gamble_debt ?? 0) === 0 &&
        (npc.values.affection ?? 0) < 90 &&
        (npc.values.curiosity ?? 0) >= 65 &&
        (npc.flags?.casinoGapDays ?? 0) >= 3 &&
        ['morning', 'afternoon'].includes(phase.id) &&
        world.playerLocation !== 'casino',
      effects: {
        move: 'casino',
        add: { gamble_debt: 10 },
        npcFlags: { casinoGapDays: 0 }
      },
      text: '虽曾借你帮衬清还过一次账目，好胜心未泯的{name}心瘾再度抬头偷偷潜入赌场，结果重蹈覆辙又签下了新的高利借条（赌债 +10）。'
    },
    {
      id: 'nise_debt_confess',
      mode: 'result',
      scope: 'npc',
      targets: ['nise'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.stage < 3 &&
        !npc.flags?.nise_debt_known &&
        (npc.values.gamble_debt ?? 0) > 0 &&
        (((npc.values.affection ?? 0) >= 80 && ['inn', 'town', 'church'].includes(world.playerLocation) && world.playerLocation === npc.location) ||
          (world.playerLocation === 'casino' && npc.location === 'casino')),
      effects: { npcFlags: { nise_debt_known: true } },
      text: '瞒不住的赌债实情已摆到明面上——{name}红着眼眶咬唇低头不敢看古兰的方向，只敢死死拽住你的袖口低声招认了金碧赌场的高利借条。'
    },
    {
      id: 'cecilia_midgame_crisis',
      mode: 'result',
      scope: 'npc',
      targets: ['cecilia'],
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.baron_purged &&
        npc.stage < 3 &&
        !npc.flags?.cecilia_midgame_crisis &&
        dayAt(world) >= arrivedDayOf(world) + 10,
      effects: {
        add: { orphanage_funds: -30 },
        npcFlags: { cecilia_midgame_crisis: true }
      },
      text: '抵镇进入中期后，远方上级教区拨给边陲晨曦修道院的常年补助突然中断，加之连日孩童药材与寒季修缮开支激增，教堂账房库存猛然大减，每日维持孤儿院的净损耗也翻倍增加。'
    },
    {
      id: 'cecilia_manor_appeal_1',
      mode: 'interaction',
      repeatable: true,
      scope: 'npc',
      targets: ['cecilia'],
      allowCancel: false,
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.baron_purged &&
        npc.stage === 0 &&
        !npc.flags?.cecilia_manor_go_stage1 &&
        (npc.values.orphanage_funds ?? 0) <= 0 &&
        (npc.values.affection ?? 0) >= 70,
      resolveWhen: ({ world, npc }) =>
        !world.flags?.baron_purged && npc.stage === 0 && (npc.values.orphanage_funds ?? 0) <= 0,
      expireWhen: ({ world, npc }) =>
        Boolean(world.flags?.baron_purged) ||
        npc.stage !== 0 ||
        (npc.values.orphanage_funds ?? 0) > 0 ||
        (npc.values.affection ?? 0) < 70,
      text: '孤儿院账面见底且临近断粮，{name}因信赖与你亲密的情分，思虑再三后主动找你商量解决办法——她坦言孩子们已等不得，实在不行也只能自己硬着头皮去找领主申请拨款了。',
      outcomes: {
        help: {
          when: ({ world }) => (world.playerState?.gold ?? 0) >= 50,
          effects: [
            { target: 'world', goldDelta: -50 },
            { target: 'cecilia', add: { orphanage_funds: 15, donated_gold: 50, affection: 4 }, npcFlags: { ceciliaAppealDays: 0, cecilia_manor_go_stage1: false } }
          ],
          text: '五十枚急用金币稳稳填补了孤儿院口粮与药费的燃眉之急；{name}眼底泛起浅浅水光，双手合十低眉致谢（孤儿院资金 +15，好感度 +4）。'
        },
        let_go: {
          effects: { npcFlags: { cecilia_manor_go_stage1: true } },
          text: '孤儿院沉重的亏空未获解决，{name}只得轻叹一口气垂眸颔首，起身整理修女服独自赶往领主山庄恳求男爵拨款。'
        }
      }
    },
    {
      id: 'cecilia_manor_appeal_2',
      mode: 'interaction',
      repeatable: true,
      scope: 'npc',
      targets: ['cecilia'],
      allowCancel: false,
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.baron_purged &&
        npc.stage === 1 &&
        !npc.flags?.cecilia_manor_go_stage2 &&
        (npc.values.orphanage_funds ?? 0) <= 0 &&
        (npc.values.affection ?? 0) >= 80,
      resolveWhen: ({ world, npc }) =>
        !world.flags?.baron_purged && npc.stage === 1 && (npc.values.orphanage_funds ?? 0) <= 0,
      expireWhen: ({ world, npc }) =>
        Boolean(world.flags?.baron_purged) ||
        npc.stage !== 1 ||
        (npc.values.orphanage_funds ?? 0) > 0 ||
        (npc.values.affection ?? 0) < 80,
      text: '上次领回的善款再度耗尽，{name}指尖绞着修女袍袖口再度来找你商议；她神情透着难堪与挣扎，低声表示实在凑不出钱也只能再去求雷蒙德男爵拨款。',
      outcomes: {
        help: {
          when: ({ world }) => (world.playerState?.gold ?? 0) >= 100,
          effects: [
            { target: 'world', goldDelta: -100 },
            { target: 'cecilia', add: { orphanage_funds: 25, donated_gold: 100, affection: 4 }, npcFlags: { ceciliaAppealDays: 0, cecilia_manor_go_stage2: false } }
          ],
          text: '一百枚金币的大额亏空得以填补，孤儿院暂且免遭断炊，也免去了她再次独自前往领主山庄的风险（孤儿院资金 +25，好感度 +4）。'
        },
        let_go: {
          effects: { npcFlags: { cecilia_manor_go_stage2: true } },
          text: '百金窟窿无从筹措，{name}沉默地垂下眼睫，向同伴浅浅欠身后踏出教堂走向领主山庄。'
        }
      }
    },
    {
      id: 'cecilia_manor_appeal_3',
      mode: 'interaction',
      repeatable: true,
      scope: 'npc',
      targets: ['cecilia'],
      allowCancel: false,
      when: ({ world, npc }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.baron_purged &&
        npc.stage === 2 &&
        !npc.flags?.cecilia_manor_go_stage3 &&
        (npc.values.orphanage_funds ?? 0) <= 0 &&
        (npc.values.affection ?? 0) >= 90,
      resolveWhen: ({ world, npc }) =>
        !world.flags?.baron_purged && npc.stage === 2 && (npc.values.orphanage_funds ?? 0) <= 0,
      expireWhen: ({ world, npc }) =>
        Boolean(world.flags?.baron_purged) ||
        npc.stage !== 2 ||
        (npc.values.orphanage_funds ?? 0) > 0 ||
        (npc.values.affection ?? 0) < 90,
      text: '孤儿院账房第三度空底，心系你的{name}眼含微颤找到你商量最后一线对策——她低语若此次实在筹不到大笔资金维持冬春之交用度，为了孩子们恐怕再无法推拒男爵的长期契约条件。',
      outcomes: {
        help: {
          when: ({ world }) => (world.playerState?.gold ?? 0) >= 150,
          effects: [
            { target: 'world', goldDelta: -150 },
            { target: 'cecilia', add: { orphanage_funds: 35, donated_gold: 150, affection: 4 }, npcFlags: { ceciliaAppealDays: 0, cecilia_manor_go_stage3: false } }
          ],
          text: '一百五十枚沉甸重金足额补齐了冬春之交的粮药用度；重压骤释之下，{name}再难自持地俯首低泣，向眼前的支柱吐露积压已久的感激（孤儿院资金 +35，好感度 +4）。'
        },
        let_go: {
          effects: { npcFlags: { cecilia_manor_go_stage3: true } },
          text: '百五重金终未凑齐，{name}在原地伫立良久，含泪轻轻福身行礼后推门赶往了领主山庄。'
        }
      }
    },
    {
      id: 'cecilia_reward_1_oral',
      mode: 'interaction',
      repeatable: true,
      scope: 'npc',
      targets: ['cecilia'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.eileen_fugitive &&
        npc.stage < 3 &&
        !npc.flags?.affection_locked &&
        !npc.flags?.cecilia_reward1_done &&
        ((npc.values.orphanage_funds ?? 0) > 0 || Boolean(world.flags?.baron_purged)) &&
        ['night', 'deep_night'].includes(phase.id) &&
        world.playerLocation === 'church' &&
        npc.location === 'church' &&
        (npc.values.affection ?? 0) >= 70 &&
        (npc.values.donated_gold ?? 0) >= 50,
      resolveWhen: ({ world, npc, phase }) =>
        world.playerLocation === 'church' &&
        npc.location === 'church' &&
        ['night', 'deep_night'].includes(phase.id) &&
        npc.stage < 3 &&
        !npc.flags?.affection_locked &&
        ((npc.values.orphanage_funds ?? 0) > 0 || Boolean(world.flags?.baron_purged)),
      expireWhen: ({ world, npc, phase }) =>
        Boolean(world.flags?.eileen_fugitive) ||
        npc.stage >= 3 ||
        Boolean(npc.flags?.affection_locked) ||
        world.playerLocation !== 'church' ||
        npc.location !== 'church' ||
        !['night', 'deep_night'].includes(phase.id) ||
        ((npc.values.orphanage_funds ?? 0) <= 0 && !world.flags?.baron_purged),
      text: '夜祷后空的圣辉大教堂廊厅只剩你与{name}二人；感恩你多次捐助善款且心生深情依恋的她双颊微热，趁四下寂静贴近你身前，羞涩提出愿以特别方式报答你的扶持（「修女的回馈」第一阶段）。',
      outcomes: {
        accept: {
          effects: { add: { affection: 3 }, npcFlags: { cecilia_reward1_done: true } },
          text: '烛火微摇的偏殿祈祷室中，向来端庄禁欲的{name}红着脸在你身前跪伏下来，解开头巾垂下一缕金发，生涩却十分虔敬地用温软唇舌为你细致侍奉直到终了。'
        }
      }
    },
    {
      id: 'cecilia_reward_2_thighs',
      mode: 'interaction',
      repeatable: true,
      scope: 'npc',
      targets: ['cecilia'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.eileen_fugitive &&
        npc.stage < 3 &&
        !npc.flags?.affection_locked &&
        Boolean(npc.flags?.cecilia_reward1_done) &&
        !npc.flags?.cecilia_reward2_done &&
        ((npc.values.orphanage_funds ?? 0) > 0 || Boolean(world.flags?.baron_purged)) &&
        ['night', 'deep_night'].includes(phase.id) &&
        world.playerLocation === 'church' &&
        npc.location === 'church' &&
        (npc.values.affection ?? 0) >= 80 &&
        (npc.values.donated_gold ?? 0) >= 150,
      resolveWhen: ({ world, npc, phase }) =>
        world.playerLocation === 'church' &&
        npc.location === 'church' &&
        ['night', 'deep_night'].includes(phase.id) &&
        npc.stage < 3 &&
        !npc.flags?.affection_locked &&
        ((npc.values.orphanage_funds ?? 0) > 0 || Boolean(world.flags?.baron_purged)),
      expireWhen: ({ world, npc, phase }) =>
        Boolean(world.flags?.eileen_fugitive) ||
        npc.stage >= 3 ||
        Boolean(npc.flags?.affection_locked) ||
        world.playerLocation !== 'church' ||
        npc.location !== 'church' ||
        !['night', 'deep_night'].includes(phase.id) ||
        ((npc.values.orphanage_funds ?? 0) <= 0 && !world.flags?.baron_purged),
      text: '孤儿院受你重金护持渐趋安稳的某个深夜，{name}特意在弥撒散尽后留灯等你来到教堂内室；她呼吸轻颤地提起长袍下摆一角，暗示愿为你献上更进一步的私密亲近（「修女的回馈」第二阶段）。',
      outcomes: {
        accept: {
          effects: { add: { affection: 3 }, npcFlags: { cecilia_reward2_done: true } },
          text: '掩上木门的修道院内室里，{name}脸颊绯红却未避开目光，将端庄白丝长腿并拢夹紧，隔着温润细腻的白丝腿肉轻缓磨蹭、配合手心与低喘替你悉心承欢。'
        }
      }
    },
    {
      id: 'cecilia_reward_3_sex',
      mode: 'interaction',
      repeatable: true,
      scope: 'npc',
      targets: ['cecilia'],
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        !world.flags?.eileen_fugitive &&
        npc.stage < 3 &&
        !npc.flags?.affection_locked &&
        Boolean(npc.flags?.cecilia_reward2_done) &&
        !npc.flags?.cecilia_reward3_done &&
        ((npc.values.orphanage_funds ?? 0) > 0 || Boolean(world.flags?.baron_purged)) &&
        ['night', 'deep_night'].includes(phase.id) &&
        world.playerLocation === 'church' &&
        npc.location === 'church' &&
        (npc.values.affection ?? 0) >= 90 &&
        (npc.values.donated_gold ?? 0) >= 300,
      resolveWhen: ({ world, npc, phase }) =>
        world.playerLocation === 'church' &&
        npc.location === 'church' &&
        ['night', 'deep_night'].includes(phase.id) &&
        npc.stage < 3 &&
        !npc.flags?.affection_locked &&
        ((npc.values.orphanage_funds ?? 0) > 0 || Boolean(world.flags?.baron_purged)),
      expireWhen: ({ world, npc, phase }) =>
        Boolean(world.flags?.eileen_fugitive) ||
        npc.stage >= 3 ||
        Boolean(npc.flags?.affection_locked) ||
        world.playerLocation !== 'church' ||
        npc.location !== 'church' ||
        !['night', 'deep_night'].includes(phase.id) ||
        ((npc.values.orphanage_funds ?? 0) <= 0 && !world.flags?.baron_purged),
      text: '历经多次慷慨解囊与漫长守望，{name}对你的爱恋已再无余留；深夜孤室烛光下她摘去高领禁欲饰件与头巾，轻声询问今晚能否把一切真正托付给你（「修女的回馈」最终回）。',
      outcomes: {
        accept: {
          effects: { add: { affection: 3 }, npcFlags: { cecilia_reward3_done: true } },
          text: '微凉圣洁的教堂寝室夜色之中，{name}褪下厚重长袍与长袜主动倾身相迎，在交融缠绵间再不克制轻颤呜咽，将身为圣女长久以来的整颗身心悉心交予了你。'
        }
      }
    },
    {
      id: 'ed_grand_stage_2',
      mode: 'result',
      scope: 'world',
      when: ({ world }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        Boolean(world.flags?.ed_joined) &&
        !world.flags?.grand_tier_2 &&
        !world.flags?.ed_showdown_done &&
        (world.npcs?.ed?.values?.patience ?? 100) <= 75,
      effects: {
        worldFlags: { grand_tier_2: true }
      },
      text: '近日奥克赫斯周边发生异样：城外野兽与魔物仿佛感知到城镇方向有不可名状的源初大恐怖，纷纷向外围仓皇逃窜，近郊浅林反常地出现野兽真空；荒原黑兽人营地座狼暴躁狂吠，千夫长下令全要塞加紧戒备并向外派出重装斥候排查；外逃魔兽践踏城镇远郊村落，流民伤员涌入大教堂避难。'
    },
    {
      id: 'ed_grand_stage_3',
      mode: 'result',
      scope: 'world',
      when: ({ world }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        Boolean(world.flags?.ed_joined) &&
        !world.flags?.grand_tier_3 &&
        !world.flags?.ed_showdown_done &&
        (world.npcs?.ed?.values?.patience ?? 100) <= 25,
      effects: {
        worldFlags: { grand_tier_3: true, road_blocked: true, curfew_active: true }
      },
      text: '奥克赫斯咽喉峡谷官道突发巨型塌方，成百上千吨山岩滑坡将进出外界唯一的陆路车马大动脉死死封死，常规商旅与求援信使断绝；面对外围异动与交通断绝，多疑怕死的雷蒙德领主下令全城实行严酷宵禁，夜间四门落锁、卫兵持械巡查，边陲小镇化作一口进出不得的封闭铁笼。'
    },
    {
      id: 'ed_showdown_good',
      mode: 'result',
      scope: 'world',
      when: ({ world }) => {
        if (!world.flags?.arrived_oakhaven || !world.flags?.ed_joined || world.flags?.ed_showdown_done) return false;
        const gulan = world.npcs?.gulan;
        const ed = world.npcs?.ed;
        if (!gulan || !ed) return false;
        const bd = gulan.values?.blood_density ?? 0;
        const aff = gulan.values?.affection ?? 0;
        const stage = gulan.stage ?? 0;
        return bd >= 100 && aff >= 90 && stage < 3;
      },
      effects: [
        {
          target: 'world',
          worldFlags: {
            ed_showdown_done: true,
            ed_revealed: true,
            ed_final_good: true
          }
        },
        {
          target: 'ed',
          monitored: false,
          move: 'wilds',
          forceMove: true,
          npcFlags: { ed_revealed: true }
        }
      ],
      text: '古兰体内真血浓度攀升至顶峰，上位古龙威压再无遮掩地冲天而起，沉睡千年的太古血脉完全觉醒。寄宿在男童皮囊中的恶龙艾德撕破伪装显化真身，庞大龙影笼罩小镇上空，逼迫其归附完成血脉繁育。然而狂暴的血脉沸腾并未冲垮古兰的神智——对伯里生死相托的深厚情义化作她最坚固的人性逆鳞。古兰横重剑立于伯里身前，周身墨黑龙鳞覆体，以同等纯度的超凡龙威正面抗衡生父。她将剑刃划破掌心立下血誓：若艾德强取，她宁可引爆心核玉石俱焚，让其布局数百年的返祖真血化为焦炭残渣。自负贪生的恶龙权衡利弊，深知同源超凡搏杀必有折损且残破母体毫无价值，冷哼一声震裂半座荒山作为惩戒与警告，振翅隐入层云退去。古兰保全自我意志，与伯里紧紧相拥，小队安然度过大劫。'
    },
    {
      id: 'ed_showdown_dark',
      mode: 'result',
      scope: 'world',
      when: ({ world }) => {
        if (!world.flags?.arrived_oakhaven || !world.flags?.ed_joined || world.flags?.ed_showdown_done) return false;
        const gulan = world.npcs?.gulan;
        const ed = world.npcs?.ed;
        if (!gulan || !ed) return false;
        const bd = gulan.values?.blood_density ?? 0;
        const stage = gulan.stage ?? 0;
        return bd >= 100 && stage === 3;
      },
      effects: [
        {
          target: 'world',
          worldFlags: {
            ed_showdown_done: true,
            ed_revealed: true,
            ed_final_dark: true
          }
        },
        {
          target: 'ed',
          monitored: false,
          move: 'wilds',
          forceMove: true,
          npcFlags: { ed_revealed: true }
        },
        {
          target: 'gulan',
          monitored: false,
          move: 'wilds',
          forceMove: true,
          npcFlags: { gulan_departed: true }
        }
      ],
      text: '当古兰体内的古龙真血熟化封顶时，早已沉沦于龙血本能的她已不再保有属于人类的抗拒。寄居的艾德撕去孩童外壳，庞大的太古古龙在镇外暗云中显现身躯，发出低沉古老的心灵共鸣。古兰眼眸中最后一丝温情隐去，取而代之的是纯粹的金红龙瞳。面对惊骇阻拦的伯里与同伴，古兰神情平静如冰，视过往人伦与小队情谊如尘埃，收起重剑一步步走出城镇。在龙王掀起的狂风中，古兰随同生父振翅腾空，回归深山古巢繁育上位龙嗣。小队支柱战力离散，伯里无力回天，暗线终局落幕。'
    },
    {
      id: 'ed_showdown_abduction_mature',
      mode: 'result',
      scope: 'world',
      when: ({ world }) => {
        if (!world.flags?.arrived_oakhaven || !world.flags?.ed_joined || world.flags?.ed_showdown_done) return false;
        const gulan = world.npcs?.gulan;
        const ed = world.npcs?.ed;
        if (!gulan || !ed) return false;
        const bd = gulan.values?.blood_density ?? 0;
        const aff = gulan.values?.affection ?? 0;
        const stage = gulan.stage ?? 0;
        return bd >= 100 && aff < 90 && stage < 3;
      },
      effects: [
        {
          target: 'world',
          worldFlags: {
            ed_showdown_done: true,
            ed_revealed: true,
            ed_final_abduction: true
          }
        },
        {
          target: 'ed',
          monitored: false,
          move: 'wilds',
          forceMove: true,
          npcFlags: { ed_revealed: true }
        },
        {
          target: 'gulan',
          monitored: false,
          move: 'wilds',
          forceMove: true,
          npcFlags: { gulan_departed: true }
        }
      ],
      text: '古兰体内真血浓度达到峰值，恶龙艾德现身收割成熟母体。古兰虽觉醒真血，但由于对伯里的情感羁绊未达顶峰，无法凭借自身力量正面逼退恶龙；但在最后关头，不愿同伴受戮的古兰毫不犹豫反手横剑颈前，以自身性命为注逼退恶龙杀意：“若伤他们，我当场自绝，让你数百年算计换来一具冷尸。”恶龙为保全活体母体放过小队众人，抓起古兰掠回龙巢强行繁衍。主角一行侥幸生还，但失去古兰。'
    },
    {
      id: 'ed_showdown_abduction_early',
      mode: 'result',
      scope: 'world',
      when: ({ world }) => {
        if (!world.flags?.arrived_oakhaven || !world.flags?.ed_joined || world.flags?.ed_showdown_done) return false;
        const gulan = world.npcs?.gulan;
        const ed = world.npcs?.ed;
        if (!gulan || !ed) return false;
        const bd = gulan.values?.blood_density ?? 0;
        const pat = ed.values?.patience ?? 100;
        const stage = gulan.stage ?? 0;
        return pat <= 0 && bd < 100 && stage < 3;
      },
      effects: [
        {
          target: 'world',
          worldFlags: {
            ed_showdown_done: true,
            ed_revealed: true,
            ed_final_abduction: true
          }
        },
        {
          target: 'ed',
          monitored: false,
          move: 'wilds',
          forceMove: true,
          npcFlags: { ed_revealed: true }
        },
        {
          target: 'gulan',
          monitored: false,
          move: 'wilds',
          forceMove: true,
          npcFlags: { gulan_departed: true }
        }
      ],
      text: '变故骤起。面对耐心耗尽提前撕破伪装强行现身的太古巨龙艾德，上位威压如巨石临头，凡俗之躯的伯里与小队众人被龙威压制，无力对抗。古兰血脉尚未完全觉醒，但她未曾沉沦的心智死死系在同伴身上。眼见恶龙利爪即将踏碎旅店与主角一行，古兰毫不犹豫反手将重剑横上颈项，以自身性命为筹码厉声喝止：“若你敢伤他们分毫，我便立刻自断经脉横剑自尽，让你数百年算计换来一具冷尸！”艾德权衡之下认定活着的母体胜过碾碎几只凡人，终究收敛了杀意，巨爪裹挟起古兰腾空而起。主角一行在古兰以命相搏的要挟下侥幸捡回性命，却只能望着那道远去天际的龙影，背负着痛楚在边陲存活。'
    },
    {
      id: 'ed_showdown_dark_early',
      mode: 'result',
      scope: 'world',
      when: ({ world }) => {
        if (!world.flags?.arrived_oakhaven || !world.flags?.ed_joined || world.flags?.ed_showdown_done) return false;
        const gulan = world.npcs?.gulan;
        const ed = world.npcs?.ed;
        if (!gulan || !ed) return false;
        const bd = gulan.values?.blood_density ?? 0;
        const pat = ed.values?.patience ?? 100;
        const stage = gulan.stage ?? 0;
        return pat <= 0 && bd < 100 && stage === 3;
      },
      effects: [
        {
          target: 'world',
          worldFlags: {
            ed_showdown_done: true,
            ed_revealed: true,
            ed_final_dark: true
          }
        },
        {
          target: 'ed',
          monitored: false,
          move: 'wilds',
          forceMove: true,
          npcFlags: { ed_revealed: true }
        },
        {
          target: 'gulan',
          monitored: false,
          move: 'wilds',
          forceMove: true,
          npcFlags: { gulan_departed: true }
        }
      ],
      text: '艾德耐心耗尽撕下伪装提前掳人，而已在暗线中沉沦的古兰早已接纳龙血天性，金红眼眸淡漠无情，听凭生父携同回归龙巢，小队无力挽留，暗线落幕。'
    },
    {
      id: 'ed_wagon_rescue',
      mode: 'result',
      scope: 'world',
      when: ({ world }) =>
        !world.flags?.arrived_oakhaven &&
        !world.flags?.ed_joined &&
        !world.flags?.ed_wagon_found &&
        (world.timeMin ?? 0) >= DAY(3, 8) &&
        world.playerLocation === 'wilds',
      effects: {
        worldFlags: { ed_wagon_found: true }
      },
      text: '旅行途中，伊丝娜敏锐地捕捉到了风中飘来的血腥味，招呼众人赶往事发地点。前方荒道旁横着一辆崩碎的马车，地面躺着车夫与商人装扮的一男一女三具尸体。那对男女在临死前用身体与马车残骸筑起缝隙，护着中间一名陷入昏迷的瘦弱男童。古兰静立一旁并未动手。'
    },
    {
      id: 'ed_wake_camp',
      mode: 'result',
      scope: 'world',
      when: ({ world }) =>
        Boolean(world.flags?.ed_joined) &&
        !world.flags?.arrived_oakhaven &&
        !world.flags?.ed_awake &&
        (world.timeMin ?? 0) >= DAY(3, 20) &&
        world.playerLocation === 'wilds',
      effects: [
        { target: 'world', worldFlags: { ed_awake: true } },
        { target: 'ed', npcFlags: { ed_awake: true } }
      ],
      text: '夜幕降临，荒原营地篝火噼啪作响。白天救下的男童悠悠转醒，初时眼神空洞木然；在奥萝拉轻柔的圣光抚慰与妮丝耐心的呼唤下，他才回过神来放声大哭。在妮丝的柔声安抚中，男孩抽泣着吐露身世：自称是奥克赫斯镇上珠宝铺的孩子，随父母赴邻镇宴席半途突闻巨吼翻车，再次醒来便见父母血肉模糊护住自己，目睹野兽撕咬惨状后吓晕过去。妮丝抱紧他轻声宽慰野兽已除、父母已被好生收敛，欲言又止地替他遮掩惨象。看见这孩子，妮丝不禁想起当年与哥哥遭逢变故后被古兰收养的光景；古兰负手而立未多言语，伊丝娜正将刚煮好的热汤盛入木碗递来。'
    },
    {
      id: 'ed_arrive_oakhaven',
      mode: 'result',
      scope: 'world',
      // 严禁按天数强行传送抵镇；改为玩家实际抵镇（arrived_oakhaven）后触发珠宝铺交接与托孤
      when: ({ world }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        Boolean(world.flags?.ed_joined) &&
        Boolean(world.flags?.ed_awake) &&
        !world.flags?.ed_custody_active &&
        !world.flags?.ed_funeral_done &&
        !world.flags?.ed_permanently_joined &&
        TOWN_LOCATIONS.includes(world.playerLocation),
      effects: ({ world }) => [
        { target: 'world', goldDelta: 250, worldFlags: { ed_custody_active: true, ed_custody_day: dayAt(world) } },
        { target: 'ed', npcFlags: { ed_custody_active: true } }
      ],
      text: '顺利抵达边陲重镇奥克赫斯后，小队护送爱德前往镇上的银月珠宝铺，向惊愕的姐姐爱丽丝与舅舅席德通报了商队遇袭的噩耗。亲人悲痛难当，除奉上二百枚金币重谢外，见爱德精神受创紧依恩人，舅舅席德又额外奉上五十枚金币作为生活用度，恳请小队在安顿盘点的这几天里代为照料爱德。'
    },
    {
      id: 'ed_funeral_home',
      mode: 'result',
      scope: 'world',
      when: ({ world }) => {
        const baseDay = world.flags?.ed_custody_day ?? arrivedDayOf(world)
        // 4 = 抵镇托孤后满 4 自然日且 08:00 后返家奔丧
        return Boolean(world.flags?.arrived_oakhaven) &&
          Boolean(world.flags?.ed_custody_active) &&
          !world.flags?.ed_funeral_done &&
          (world.timeMin ?? 0) >= DAY(baseDay + 4, 8) &&
          world.npcs?.ed?.location === 'inn'
      },
      effects: ({ world }) => [
        { target: 'world', worldFlags: { ed_funeral_done: true, ed_custody_active: false, ed_funeral_day: dayAt(world) } },
        { target: 'ed', move: 'town', forceMove: true, npcFlags: { ed_home_visiting: true } }
      ],
      text: '清晨，珠宝铺送来口信，父母的葬礼与账目盘点已准备就绪，爱德向小队众人礼貌道别后赶回家中参加丧礼，暂且离开旅店。'
    },
    {
      id: 'ed_uncle_betrayal_return',
      mode: 'result',
      scope: 'world',
      when: ({ world }) => {
        const funeralDay = world.flags?.ed_funeral_day ?? (arrivedDayOf(world) + 4)
        return Boolean(world.flags?.ed_funeral_done) &&
          !world.flags?.ed_permanently_joined &&
          (world.timeMin ?? 0) >= DAY(funeralDay + 1, 8) &&
          world.playerLocation === 'inn'
      },
      effects: ({ world }) => [
        { target: 'world', worldFlags: { ed_permanently_joined: true, alice_hostage: true, ed_joined_perm_day: dayAt(world) } },
        { target: 'ed', move: 'inn', forceMove: true, npcFlags: { ed_home_visiting: false, ed_expelled_by_uncle: true } }
      ],
      text: '次日清晨，小队正在旅店一楼共进早饭，客栈木门被轻轻推开，离开一天的爱德再度出现。男孩眼中没有孩童应有的雀跃，反而透着不安与一种少见的决绝，小声提出想随小队学习冒险。在妮丝敏锐的开导与追问下，爱德终于忍不住红了眼眶放声哭泣，吐露了实情：舅舅席德在安葬父母后迅速接管了整座珠宝铺，借口生计将姐姐爱丽丝强行留在店里当柜员看管，却将自己以‘出门学艺’为由直接扫地出门。他抹着眼泪恳求小队接纳自己，并带着颤音担忧舅舅会对被扣下的姐姐图谋不轨。众人一阵讨论，同意了他的请求。'
    },
    {
      id: 'ed_guide_town',
      mode: 'result',
      scope: 'world',
      when: ({ world, phase }) => {
        const permDay = world.flags?.ed_joined_perm_day ?? (arrivedDayOf(world) + 5)
        return Boolean(world.flags?.ed_permanently_joined) &&
          !world.flags?.ed_guide_town_done &&
          (world.timeMin ?? 0) >= DAY(permDay + 2, 8) &&
          world.playerLocation === 'town' &&
          ['morning', 'afternoon'].includes(phase?.id)
      },
      effects: [
        { target: 'world', worldFlags: { ed_guide_town_done: true } },
        { target: 'ed', npcFlags: { ed_town_guided: true } }
      ],
      text: '阳光洒在奥克赫斯由碎石铺就的集市大道上，空气里带着新鲜干草与麦粉的气味。走在身侧的爱德两手紧紧抓着衣角，脚步虽然细碎，引路却熟门熟路。“商行公会每天上午十点放榜，这时候门卫换班，容易看清告示栏上的急单；西街铁匠铺后巷有一口公用水井，去那里打水不用排队……”刚进队两天的男孩认真数着沿途各处门道，仰起小脸观察着同伴的神色，见大家点头，眉眼间才稍稍松下一口气，确认自己并不是吃闲饭的累赘。'
    },
    {
      id: 'ed_watch_store',
      mode: 'result',
      scope: 'world',
      when: ({ world, phase }) => {
        const permDay = world.flags?.ed_joined_perm_day ?? (arrivedDayOf(world) + 5)
        return Boolean(world.flags?.ed_guide_town_done) &&
          !world.flags?.ed_watch_store_done &&
          (world.timeMin ?? 0) >= DAY(permDay + 5, 13) &&
          world.playerLocation === 'town' &&
          phase?.id === 'afternoon'
      },
      effects: [
        { target: 'world', worldFlags: { ed_watch_store_done: true } }
      ],
      text: '商业街中央广场北侧的遮阳木棚旁，爱德原本平稳的脚步忽然慢了下来，随后整个人退入木架阴影中。男孩伸手拉住同伴的衣角，目光直直看向斜对面的三层石楼——黄铜招牌上刻着“银月珠宝铺”。宽大的水晶橱窗后，身着墨绿细呢长裙的年轻女子正在柜台后清点托盘，神情端庄温和，眉宇间却满是化不开的疲惫。两名带棍的伙计守在阶前。“是姐姐爱丽丝……”爱德的声音压得极低，眼眶发红，“父母刚下葬，席德舅舅就带着借据占了铺子，把我赶到街上。可是姐姐从小最护着我，铺子也是父母的心血，为什么姐姐至今还在店里替舅舅照看生意，始终没有离开？”'
    },
    {
      id: 'ed_investigate_truth',
      mode: 'interaction',
      scope: 'world',
      when: ({ world, phase }) => {
        const permDay = world.flags?.ed_joined_perm_day ?? (arrivedDayOf(world) + 5)
        return Boolean(world.flags?.ed_watch_store_done) &&
          !world.flags?.alice_truth_revealed &&
          (world.timeMin ?? 0) >= DAY(permDay + 7, 10) &&
          world.playerLocation === 'town' &&
          ['morning', 'afternoon'].includes(phase?.id)
      },
      text: '街角茶棚的长凳旁，爱德双手紧紧绞着衣角，低着头停下了脚步。男孩眼圈泛红，仰起清瘦的小脸，声音带着难掩的急切与恳求：“{{user}}哥哥，这几天我一闭上眼就是姐姐在橱窗后面的样子……姐姐从小最护着我，铺子也是爹娘留下的，就算舅舅抢了账本，姐姐也绝不可能甘心留下来替他算账。我想不明白姐姐为什么不走，我想求求大家帮帮我，进店去见见姐姐，从姐姐口中得知真相！只要知道姐姐到底在怕什么、舅舅到底背着我跟姐姐说了什么，我们才能帮到她……”穿过马车道，银月珠宝铺门扉半掩，铜铃轻晃。柜台后的爱丽丝一身墨绿细呢长裙，双手交叠于身前，神态端庄娴静，眼底却带着商贾门面惯有的戒备与疏离。内堂账房帘子垂着，守在侧门边的伙计正低头擦拭长凳。前堂恰逢客流间隙，为执行爱德的请托、探明受困内情提供了近身契机。',
      outcomes: {
        probe_direct_mention: {
          text: '冷不防听到爱德的名字，爱丽丝眼底的端庄防备刹那间碎裂。在透过橱窗望见对街喷泉旁安然挥手的弟弟时，年轻女子手指死死扣紧柜沿，极力压低的声音终于颤抖着吐露了实情：父母下葬后，席德谎称爱德已被送往远郊工坊打工顶债，并以断绝爱德口粮与安危相要挟，逼迫她交出地契。获知弟弟实则被救下、一直在旅店安好的真相后，爱丽丝迅速决断，借理货之机将父母生前真实的收支账目底单悄然推过展布。',
          effects: ({ world }) => [
            { target: 'world', worldFlags: { alice_truth_revealed: true, alice_evidence_secured: true, alice_truth_day: dayAt(world) }, itemsAdd: [{ id: 'alice_ledger', count: 1 }] }
          ]
        },
        probe_inquire_debt: {
          text: '听到来者探问账目与债务详情，爱丽丝原本警惕的神色在察觉对方并无恶意后渐渐泛起凄苦。她借着整理饰品盒的动作遮掩，极力压低声音道出了内幕：席德拿出的借据纯系伪造，更以扣押在外当苦工的爱德性命相逼，逼她留在柜台撑门面兼祧完婚。当得知爱德根本未曾沦为人质、就在对街等候的事实后，年轻女子眼眶通红，咬牙下定决意，将藏有席德私账破绽与后堂钥匙的信封迅速塞入托盘底部。',
          effects: ({ world }) => [
            { target: 'world', worldFlags: { alice_truth_revealed: true, alice_evidence_secured: true, alice_truth_day: dayAt(world) }, itemsAdd: [{ id: 'alice_ledger', count: 1 }] }
          ]
        }
      }
    },
    {
      id: 'alice_rescue_resolve',
      mode: 'result',
      scope: 'world',
      when: ({ world, phase }) => {
        const truthDay = world.flags?.alice_truth_day ?? (arrivedDayOf(world) + 12)
        return Boolean(world.flags?.alice_truth_revealed) &&
          !world.flags?.alice_rescued &&
          (world.timeMin ?? 0) >= DAY(truthDay + 2, 10) &&
          world.playerLocation === 'town' &&
          ['morning', 'afternoon'].includes(phase?.id)
      },
      effects: [
        {
          target: 'world',
          worldFlags: { alice_rescued: true, sid_expelled: true, ed_aspiration_adventurer: true },
          goldDelta: 150,
          itemsRemove: [{ id: 'alice_ledger', all: true }]
        },
        {
          target: 'ed',
          move: 'inn',
          forceMove: true,
          npcFlags: { ed_adventurer_role: true }
        }
      ],
      text: '上午十点，银月珠宝铺内客商云集。当活生生的爱德现身堂前、席德捏造债务欺瞒晚辈的事实被当众核对拆穿时，席德面色惨白，手中的茶盏失手摔碎在地。面对真实账据与随行护卫的冒险者小队阵势，席德深知触犯商会律令且无法自圆其说，在众人指责下交出账印，狼狈离开铺面。铺内重新平息。爱丽丝步出柜台抱住失而复得的弟弟，平复心绪后郑重奉上装有 150 枚金币的酬金钱袋，感谢小队保全家业，并轻声唤爱德回家重理旧铺。八岁的男孩看了看熟悉的商铺，又转头望向晨光中的小队同伴，认真摇了摇头，向姐姐立誓：自己不想再做只能等待保护的雏鸟，而是要成为像大家一样能保护别人的真正冒险者，誓言留队继续历练，直至独当一面。爱丽丝欣慰应允，将弟弟正式托付给小队。'
    }
  ]

  // 爱德类型二：2 大普适循环日常事件池（每 3 自然日限 1 次，4 组动态情景轮替，不与主线或其他爱德日常叠弹）
  function hasPendingEdDaily(world) {
    return Object.values(world.bg?.eventStates || {}).some(st =>
      st?.status === 'pending' &&
      (String(st.definitionId || '').startsWith('ed_intercept_job_') ||
       String(st.definitionId || '').startsWith('ed_daily_perk_') ||
       st.definitionId === 'ed_investigate_truth')
    )
  }

  function buildEdTeachPatch(world) {
    const ed = world.npcs?.ed
    const nextCount = (ed?.flags?.ed_teach_count ?? 0) + 1
    // 3 = 爱德求生常识教学达标门槛，解锁潜行放哨与掩护能力
    const stealthReady = Boolean(ed?.flags?.ed_stealth_ready || nextCount >= 3)
    return {
      npcEffect: { target: 'ed', npcFlags: { ed_teach_count: nextCount, ed_stealth_ready: stealthReady } },
      stealthFlag: stealthReady ? { ed_stealth_ready: true } : {}
    }
  }

  const ED_PERK_VARIANTS = [
    {
      id: 'ed_daily_perk_1',
      freeLodging: true,
      text: '清晨大堂刚飘起麦粥香气，爱德提着空菜篮轻快地走过来，难掩欢喜地小声说：“{{user}}哥哥，我一大早帮旅店掌柜去集市大批采买蔬果，靠着以前街坊熟脸谈下了老主顾折让。掌柜心情大好，说今晚小队的 5 枚金币宿费给直接勾销了！”',
      acceptText: '你笑着夸奖爱德持家麻利，掌柜在柜台后摆摆手，在账本上勾销了小队今晚的 5 金房费。',
      teachText: '你拍拍爱德的肩叮嘱他别为了省钱累坏身子，跟掌柜商量把这份工钱折换成 5 金伙食贴补，顺便教他采买称重和量力而行的分寸。'
    },
    {
      id: 'ed_daily_perk_2',
      freeLodging: true,
      text: '爱德拍着粗麻衣袖上的木屑从地窖楼梯走上来，略带腼腆地汇报道：“{{user}}哥哥，刚运来的几只大麦酒桶我帮掌柜和伙计一块儿滚进地窖码整齐了。掌柜说省了雇短工的钱，直接给我们小队抵扣掉今晚的 5 金宿费！”',
      acceptText: '你替爱德拂去肩头灰尘，肯定了他的勤恳付出。旅店掌柜爽快记下免租，今晚宿费得以省下。',
      teachText: '你拉过爱德检查他发红的掌心，仔细教他搬运重物借力省劲的法子，并把这份劳务回扣折成 5 金干粮贴补收好。'
    },
    {
      id: 'ed_daily_perk_3',
      freeLodging: false,
      supplyGrant: 5,
      text: '爱德捧着一大包油纸裹好的熏肉与厚麦饼从后厨小步走出来，眉眼弯弯：“{{user}}哥哥，我清晨帮后厨清扫了肉架和灶台，手脚利落没偷嘴。厨子高兴，特意多切了够咱们省下一天露宿开销的熟肉麦饼作犒劳！”',
      acceptText: '你收下油纸包里的熟肉与麦饼并归入行囊补给（补给 +5），爱德听见夸奖笑得格外踏实。',
      teachText: '你让爱德先坐下分吃一块热麦饼补补力气，边整理干粮入囊（补给 +5）边教他野外保存肉干防潮防鼠的常识。'
    },
    {
      id: 'ed_daily_perk_4',
      freeLodging: false,
      text: '爱德手里攥着几枚亮闪闪的钱币快步凑到桌旁，小声说道：“{{user}}哥哥，前堂有两张长凳和侧门门闩松了，我一大早拿木楔全给修牢实了，省得掌柜再去请木匠。掌柜硬塞给我 5 枚金币当赏钱，正好能抵上今晚的房费！”',
      acceptText: '你接过爱德递来的 5 枚金币并夸他心灵手巧，男孩揉揉鼻尖，眉眼里透着帮上忙的满足。',
      teachText: '你收好 5 枚金币折作行囊补给，顺手握着爱德的手教他用木工活儿护住指节、干活留余力的门道，男孩听得聚精会神。'
    }
  ]

  // 必须先于公会急件注册：免租回扣仅限 inn+morning 窄窗口，先判可避免被宽窗口急件饿死
  ED_PERK_VARIANTS.forEach((variant, idx) => {
    EVENTS.push({
      id: variant.id,
      mode: 'interaction',
      repeatable: true,
      scope: 'world',
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, phase }) =>
        Boolean(world.flags?.ed_permanently_joined && world.flags?.arrived_oakhaven && !world.flags?.eileen_fugitive) &&
        world.playerLocation === 'inn' &&
        phase?.id === 'morning' &&
        world.npcs?.ed?.monitored === true &&
        world.npcs.ed.alive !== false &&
        !hasPendingEdDaily(world) &&
        // 3 = 爱德营生跑腿免租回扣冷却天数（每 3 自然日限触发 1 次）
        (!Number.isFinite(world.flags?.lastEdPerkDay) || (dayAt(world) - world.flags.lastEdPerkDay) >= 3) &&
        ((world.flags?.edPerkSlot ?? 0) % 4) === idx,
      expireWhen: ({ world, phase }) =>
        world.playerLocation !== 'inn' ||
        phase?.id !== 'morning' ||
        Boolean(world.flags?.eileen_fugitive),
      text: variant.text,
      outcomes: {
        accept_perk: {
          text: variant.acceptText,
          effects: ({ world }) => {
            const worldFlags = {
              lastEdPerkDay: dayAt(world),
              edPerkSlot: (idx + 1) % 4,
              ...(variant.freeLodging ? { inn_free_pass_today: true } : {}),
              ...(variant.supplyGrant && world.flags?.supply_shortage ? { supply_shortage: false } : {})
            }
            if (variant.freeLodging) {
              return [{ target: 'world', worldFlags }]
            }
            if (variant.supplyGrant) {
              return [{ target: 'world', itemsAdd: [{ id: 'supply', count: variant.supplyGrant }], worldFlags }]
            }
            const nextGold = (Number.isSafeInteger(world.playerState?.gold) ? world.playerState.gold : 0) + 5
            if (world.flags?.inn_arrears && nextGold >= 5) worldFlags.inn_arrears = false
            return [{ target: 'world', goldDelta: 5, worldFlags }]
          }
        },
        trade_teach: {
          text: variant.teachText,
          effects: ({ world }) => {
            const teach = buildEdTeachPatch(world)
            if (variant.supplyGrant) {
              const worldFlags = {
                lastEdPerkDay: dayAt(world),
                edPerkSlot: (idx + 1) % 4,
                ...teach.stealthFlag,
                ...(world.flags?.supply_shortage ? { supply_shortage: false } : {})
              }
              return [{ target: 'world', itemsAdd: [{ id: 'supply', count: variant.supplyGrant }], worldFlags }, teach.npcEffect]
            }
            const nextGold = (Number.isSafeInteger(world.playerState?.gold) ? world.playerState.gold : 0) + 5
            const worldFlags = {
              lastEdPerkDay: dayAt(world),
              edPerkSlot: (idx + 1) % 4,
              ...teach.stealthFlag,
              ...(world.flags?.inn_arrears && nextGold >= 5 ? { inn_arrears: false } : {})
            }
            return [{ target: 'world', goldDelta: 5, worldFlags }, teach.npcEffect]
          }
        }
      }
    })
  })

  const ED_INTERCEPT_VARIANTS = [
    {
      id: 'ed_intercept_job_1',
      gold: 40,
      text: '爱德一路小跑着拽住你的衣袖，额角沁着细汗，压低声音急切汇报：“{{user}}哥哥，快！公会门口刚来了一名急着离镇的外地行商，他的加急货样和文书落在了城外临时车马棚，天黑前必须取回来。公会走账要压到明天还要抽成，雇主正跟伙计发愁呢！现在去私洽接下，当场现结 40 枚金币，要是等抄上大木板，转眼就会被那群闲汉抢光！”',
      directText: '你当机立断赶往城外临时车马棚，趁着暮色未至把遗落的货样箱与封蜡文书完好交回行商手中。行商松了一口气，爽快按约现结了 40 枚金币。',
      teachText: '你带着爱德先核验了行商的通关货票与封条印记，教他识别真假雇主并顺势谈妥了快马赶路的脚力贴补。货样如期送达，行商爽快付清 45 枚金币，爱德在一旁把核验门道牢牢记在心里。'
    },
    {
      id: 'ed_intercept_job_2',
      gold: 35,
      text: '爱德从集市方向气喘吁吁地奔回来，手指着天边聚拢的灰云提醒道：“{{user}}哥哥，集市大商行的管事正急得团团转！天眼看要落雨，货场里还有一批怕潮的细呢布匹和干草，必须在两个钟头内转进地窖。公会排人手来不及，现在直接过去搭把手，干完当场现结 35 枚金币！”',
      directText: '你赶在雨点砸落前与商行伙计一道把怕潮布匹和草捆稳妥转入干爽地窖。管事查验无损后满意点头，当场点清 35 枚金币交付。',
      teachText: '进货场前，你先指点爱德查看商行字号与货单件数，又替搬运重货的活计谈下 5 枚金币的防雨加急贴补。忙完后管事爽快结清 40 枚金币，爱德学会了接短工先核清权责的规矩。'
    },
    {
      id: 'ed_intercept_job_3',
      gold: 45,
      text: '爱德紧跑几步拉住你的手腕，眼睛发亮地小声道：“{{user}}哥哥，镇郊农庄的庄园主刚在公会外拦人！他家一匹拉货的挽马受了惊，带着半车杂货窜进了近郊林缘。公会登记派单太慢，雇主说只要身手利落的战士立刻去循迹找回，当场现结 45 枚金币！”',
      directText: '你沿车辙与折枝一路追入近郊林缘，安抚住受惊的挽马并将货车稳妥牵回农庄。庄园主连声致谢，如数现结 45 枚金币。',
      teachText: '出发前你带着爱德辨认蹄印深浅、估算林缘风险，并向庄园主谈明进林搜寻的额外补给贴补。寻回挽马后雇主爽快付给 50 枚金币，爱德也记熟了野外循迹的要领。'
    },
    {
      id: 'ed_intercept_job_4',
      gold: 30,
      bonusSupply: 1,
      text: '爱德抱着胳膊快步凑过来，语速偏快地说道：“{{user}}哥哥，镇上药铺掌柜急着找脚程快的人！镇南有户病家等着刚煎配好的退热汤剂，药铺伙计全派出去了脱不开身。不用走公会抽水，现在送过去就能现结 30 枚金币，掌柜还说多捎一份草药补给！”',
      directText: '你妥帖护着药罐快步穿过街巷，趁药汤尚温送到了镇南病家门前。返程后药铺掌柜松了口气，爽快结清 30 枚金币并另捎 1 份补给。',
      teachText: '接药时你先教爱德核对药封标签与病家住址，提醒他贵重急件务必当面签收，并向掌柜谈妥 5 枚金币的急送脚费。差事办妥后入账 35 枚金币与 1 份补给，爱德把跑腿核单的细节暗暗记牢。'
    }
  ]

  ED_INTERCEPT_VARIANTS.forEach((variant, idx) => {
    EVENTS.push({
      id: variant.id,
      mode: 'interaction',
      repeatable: true,
      scope: 'world',
      allowCancel: true,
      retryOnCancel: true,
      when: ({ world, phase }) =>
        Boolean(world.flags?.ed_permanently_joined && world.flags?.arrived_oakhaven && !world.flags?.eileen_fugitive) &&
        ['inn', 'town'].includes(world.playerLocation) &&
        ['morning', 'afternoon'].includes(phase?.id) &&
        world.npcs?.ed?.monitored === true &&
        world.npcs.ed.alive !== false &&
        !hasPendingEdDaily(world) &&
        // 3 = 爱德公会急件抢截冷却天数（每 3 自然日限触发 1 次）
        (!Number.isFinite(world.flags?.lastEdInterceptDay) || (dayAt(world) - world.flags.lastEdInterceptDay) >= 3) &&
        ((world.flags?.edInterceptSlot ?? 0) % 4) === idx,
      expireWhen: ({ world, phase }) =>
        !['inn', 'town'].includes(world.playerLocation) ||
        !['morning', 'afternoon'].includes(phase?.id) ||
        Boolean(world.flags?.eileen_fugitive),
      text: variant.text,
      outcomes: {
        accept_direct: {
          text: variant.directText,
          effects: ({ world }) => {
            const nextGold = (Number.isSafeInteger(world.playerState?.gold) ? world.playerState.gold : 0) + variant.gold
            const worldFlags = {
              lastEdInterceptDay: dayAt(world),
              edInterceptSlot: (idx + 1) % 4,
              ...(world.flags?.inn_arrears && nextGold >= 5 ? { inn_arrears: false } : {}),
              ...(variant.bonusSupply && world.flags?.supply_shortage ? { supply_shortage: false } : {})
            }
            const worldEffect = { target: 'world', goldDelta: variant.gold, worldFlags }
            if (variant.bonusSupply) worldEffect.itemsAdd = [{ id: 'supply', count: variant.bonusSupply }]
            return [worldEffect]
          }
        },
        negotiate_teach: {
          text: variant.teachText,
          effects: ({ world }) => {
            const gain = variant.gold + 5
            const nextGold = (Number.isSafeInteger(world.playerState?.gold) ? world.playerState.gold : 0) + gain
            const teach = buildEdTeachPatch(world)
            const worldFlags = {
              lastEdInterceptDay: dayAt(world),
              edInterceptSlot: (idx + 1) % 4,
              ...teach.stealthFlag,
              ...(world.flags?.inn_arrears && nextGold >= 5 ? { inn_arrears: false } : {}),
              ...(variant.bonusSupply && world.flags?.supply_shortage ? { supply_shortage: false } : {})
            }
            const worldEffect = { target: 'world', goldDelta: gain, worldFlags }
            if (variant.bonusSupply) worldEffect.itemsAdd = [{ id: 'supply', count: variant.bonusSupply }]
            return [worldEffect, teach.npcEffect]
          }
        }
      }
    })
  })

  function makeNpc(cfg) {
    const hasStage = cfg.hasStage !== false
    const hasAffection = cfg.hasAffection !== false
    const values = { ...(cfg.values || {}) }
    const npc = {
      id: cfg.id,
      name: cfg.name,
      monitored: cfg.monitored !== false,
      alive: true,
      hasStage,
      hasAffection,
      homeLocation: cfg.homeLocation || cfg.location,
      location: cfg.location,
      values,
      plan: (cfg.plan || []).slice(),
      nodePlan: hasStage ? (cfg.nodePlan || []).slice() : [],
      activity: null,
      activityHistory: {},
      nodeStates: {},
      flags: {},
      lastAction: null,
      _baseline: { ...values },
      _metricBounds: { ...(cfg.metricBounds || {}) }
    }
    if (hasStage) npc.stage = cfg.stage ?? 0
    return npc
  }

  const ROSTER = [
    makeNpc({
      id: 'gulan', name: '古兰', location: 'wilds', homeLocation: 'inn',
      hasStage: true, hasAffection: true,
      values: { blood_density: 0, affection: 70 },
      metricBounds: { blood_density: [0, 100], affection: [0, 100] },
      nodePlan: ['gulan_stage_1', 'gulan_stage_2', 'gulan_stage_3'],
      plan: ['gulan_train', 'return_inn', 'idle_rest']
    }),
    makeNpc({
      id: 'isna', name: '伊丝娜', location: 'wilds', homeLocation: 'inn',
      hasStage: true, hasAffection: true,
      values: { gold_desire: 25, affection: 60 },
      metricBounds: { gold_desire: [0, 100], affection: [0, 100] },
      nodePlan: ['isna_stage_1', 'isna_stage_2', 'isna_stage_3'],
      plan: ['isna_odd_job', 'return_inn', 'idle_rest']
    }),
    makeNpc({
      id: 'nise', name: '妮丝', location: 'wilds', homeLocation: 'inn',
      hasStage: true, hasAffection: true,
      values: { curiosity: 40, gamble_debt: 0, affection: 70 },
      metricBounds: { curiosity: [0, 100], gamble_debt: [0, 100], affection: [0, 100] },
      nodePlan: ['nise_stage_1', 'nise_stage_2', 'nise_stage_3'],
      plan: ['nise_contract_stay', 'nise_secretary_shift', 'nise_dealer_shift', 'nise_town_browse', 'return_inn', 'idle_rest']
    }),
    makeNpc({
      id: 'aurora', name: '奥萝拉', location: 'wilds', homeLocation: 'inn',
      hasStage: true, hasAffection: true,
      values: { debt_pressure: 100, affection: 50 },
      metricBounds: { debt_pressure: [0, 100], affection: [0, 100] },
      nodePlan: ['aurora_stage_1', 'aurora_stage_2', 'aurora_stage_3'],
      plan: ['aurora_post_purge_return', 'aurora_manor_work', 'aurora_weekend_return', 'return_inn', 'idle_rest']
    }),
    makeNpc({
      id: 'eileen', name: '艾琳', monitored: false, location: 'manor', homeLocation: 'manor',
      hasStage: true, hasAffection: true,
      values: { counterattack: 0, affection: 0 },
      metricBounds: { counterattack: [0, 100], affection: [0, 100] },
      nodePlan: ['eileen_stage_1', 'eileen_stage_2', 'eileen_stage_3'],
      plan: ['eileen_post_purge_return', 'return_manor', 'idle_rest']
    }),
    makeNpc({
      id: 'cecilia', name: '塞西莉亚', location: 'church', homeLocation: 'church',
      hasStage: true, hasAffection: true,
      values: { orphanage_funds: 50, donated_gold: 0, affection: 20 },
      metricBounds: { orphanage_funds: [0, 100], donated_gold: [0, 999999], affection: [0, 100] },
      nodePlan: ['cecilia_stage_1', 'cecilia_stage_2', 'cecilia_stage_3'],
      plan: ['return_church', 'idle_rest']
    }),
    makeNpc({
      id: 'ed', name: '爱德', monitored: false, location: 'wilds', homeLocation: 'inn',
      hasStage: false, hasAffection: false,
      values: { patience: 100 },
      metricBounds: { patience: [0, 100] },
      nodePlan: [],
      plan: ['ed_inn_chores', 'return_inn', 'idle_rest']
    })
  ]

  function buildInitialWorld() {
    const npcs = {}
    for (const n of ROSTER) {
      npcs[n.id] = JSON.parse(JSON.stringify(n))
      npcs[n.id]._baseline = { ...n.values }
    }
    return {
      schemaVersion: SCHEMA_VERSION,
      timeMin: 18 * 60,
      playerLocation: 'wilds',
      // 10 = 开局荒原 5 人小队 2 晚常规补给量（1 人 1 晚消耗 1 份）
      playerState: { gold: 40, inventory: [{ id: 'supply', count: 10 }] },
      interactingIds: [],
      flags: {
        ed_joined: false,
        arrived_oakhaven: false,
        arrivedDay: null,
        playerRoomTarget: null,
        inn_arrears: false,
        supply_shortage: false,
        lastInnSettledDay: 0,
        playerOddJobDay: null,
        lastGuildCommissionDay: null,
        lastChurchErrandDay: null,
        orc_camp_bounty_paid: false,
        lancaster_purge_reward_paid: false,
        eileen_arrived: false,
        eileen_departed: false,
        eileen_fugitive: false,
        eileen_signal_fired: false,
        baron_purged: false,
        player_barony_granted: false
      },
      npcs
    }
  }

  root.OKH_APP_DATA = Object.freeze({
    SCHEMA_VERSION, DAY, WEEKDAYS, weekdayOf, isWeekendDay, weekdayLabel,
    PHASES, LOCATIONS, TOWN_LOCATIONS, STAGES, AFFECTION_TIERS, ITEM_CATALOG,
    ACTIONS, NODES, EVENTS, ROSTER, buildInitialWorld
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_DATA
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)

;
/**
 * @module okh_app_rules
 * @updated 2026-11-19 02:40
 * @status  active
 * @reason  纯业务判定规则：在 resolveEconomy 中移除古兰被俘标记依赖，古兰战力门禁以存活、未沦陷与在场为准
 * @deps    OKH_APP_DATA
 * @provides { getAffectionTier, isFugitiveSyncedNpc, syncWorld, isMetricLocked, onStageChange, canMove, applyPrologueSteps, resolveRoom, resolveBonds, resolveEconomy }
 */
(function (root) {
  'use strict'

  const DATA = root.OKH_APP_DATA
  if (!DATA) throw Error('rules 缺少 OKH_APP_DATA')

  const TOWN_LOCATION_SET = new Set(DATA.TOWN_LOCATIONS)

  function getAffectionTier(value) {
    const score = Number.isFinite(value) ? value : 0
    if (score >= 90) return 'love'
    if (score >= 70) return 'intimate'
    if (score >= 40) return 'friendly'
    return 'ordinary'
  }

  function isFugitiveActive(world) {
    return Boolean(world?.flags?.eileen_fugitive && !world?.flags?.baron_purged)
  }

  function isFugitiveSyncedNpc(world, npc) {
    if (!isFugitiveActive(world) || !npc) return false
    if (npc.alive === false || npc.monitored === false || (npc.stage ?? 0) >= 3) return false
    if (npc.id === 'eileen') {
      return !npc.flags?.eileen_captured && !npc.flags?.eileen_returned_capital
    }
    if (npc.id === 'isna') {
      return Boolean(npc.flags?.eileen_isna_helped) &&
        !npc.flags?.captured_orc &&
        !npc.flags?.isna_fallen_orc &&
        !npc.flags?.isna_captured_ed &&
        !npc.flags?.isna_fallen_labyrinth
    }
    if (npc.id === 'nise') {
      return Boolean(npc.flags?.eileen_nise_helped) && !npc.flags?.nise_fled_casino
    }
    return false
  }

  function syncWorld(world, ctx) {
    if (!isFugitiveActive(world)) return
    for (const id of ['isna', 'nise', 'eileen']) {
      const npc = world?.npcs?.[id]
      if (!isFugitiveSyncedNpc(world, npc)) continue
      if (npc.location !== world.playerLocation) {
        if (npc.activity?.kind === 'ordinary' && ctx?.activity?.finish) {
          ctx.activity.finish(npc, world.timeMin, 'fugitive-squad-sync')
        }
        npc.location = world.playerLocation
      }
    }
  }

  function isMetricLocked(world, npc, name) {
    if (!npc || name !== 'affection' || npc.hasAffection === false) return false
    return Boolean((npc.stage ?? 0) >= 3 || npc.flags?.affection_locked)
  }

  function onStageChange(world, npc, prevStage, toStage) {
    if (!npc || toStage < 3 || npc.hasAffection === false) return
    if (npc.values && Object.hasOwn(npc.values, 'affection')) {
      npc.values.affection = Math.min(npc.values.affection, 50)
    }
    npc.flags = { ...(npc.flags || {}), affection_locked: true }
  }

  function canMove(world, to, npc) {
    if (!Object.hasOwn(DATA.LOCATIONS, to)) return false
    if (!world?.flags?.arrived_oakhaven && TOWN_LOCATION_SET.has(to)) return false
    if (npc && isFugitiveSyncedNpc(world, npc) && to !== world.playerLocation) return false
    return true
  }

  function applyPrologueSteps(world, steps) {
    const out = []
    let arrivedNow = Boolean(world.flags?.arrived_oakhaven)
    let edNow = Boolean(world.flags?.ed_joined)

    for (const flag of steps || []) {
      if (flag === 'ed_joined' && !edNow) {
        edNow = true
        out.push({ target: 'world', worldFlags: { ed_joined: true } })
        if (world.npcs?.ed) {
          out.push({ target: 'ed', monitored: true, move: world.playerLocation || 'wilds' })
        }
      } else if (flag === 'arrived_oakhaven' && !arrivedNow) {
        arrivedNow = true
        const day = Math.floor((world.timeMin ?? 0) / 1440) + 1
        out.push({ target: 'world', worldFlags: { arrived_oakhaven: true, arrivedDay: day } })
        for (const id of ['gulan', 'isna', 'nise', 'aurora', 'ed']) {
          const npc = world.npcs?.[id]
          if (npc && (id !== 'ed' || edNow) && npc.location === 'wilds') {
            out.push({ target: id, move: 'inn' })
          }
        }
      }
    }
    return out
  }

  function resolveRoom(world, room, ctx) {
    const gulan = world.npcs?.gulan
    const current = world.flags?.playerRoomTarget
    if (!room) {
      if (current !== 'gulan') return []
      const stillValid =
        Boolean(world.flags?.arrived_oakhaven) &&
        ['night', 'deep_night'].includes(ctx.phase?.id) &&
        world.playerLocation === 'inn' &&
        gulan?.location === 'inn' &&
        (gulan.stage ?? 0) < 3 &&
        ((gulan.stage ?? 0) < 2 || (gulan.values?.affection ?? 0) >= 90)
      return stillValid ? [] : [{ target: 'world', worldFlags: { playerRoomTarget: null } }]
    }
    if (room.state === 'separate') {
      return [{ target: 'world', worldFlags: { playerRoomTarget: null } }]
    }
    const ok =
      room.npc === 'gulan' &&
      room.state === 'together' &&
      Boolean(world.flags?.arrived_oakhaven) &&
      ['night', 'deep_night'].includes(ctx.phase?.id) &&
      world.playerLocation === 'inn' &&
      gulan?.location === 'inn' &&
      (gulan.values?.affection ?? 0) >= 90 &&
      (gulan.stage ?? 0) < 3

    return [{ target: 'world', worldFlags: { playerRoomTarget: ok ? 'gulan' : null } }]
  }

  function appendNovelty(flags, rawItem) {
    const item = typeof rawItem === 'string' ? rawItem.trim() : ''
    if (!item || item.length > 24) return null
    const list = Array.isArray(flags?.seenNovelties) ? flags.seenNovelties : []
    const norm = item.toLowerCase()
    if (list.some(entry => String(entry).trim().toLowerCase() === norm)) return null
    const nextList = list.concat(item).slice(-50)
    const totalNovelties = (Number.isFinite(flags?.totalNovelties) ? flags.totalNovelties : list.length) + 1
    return { seenNovelties: nextList, totalNovelties }
  }

  const BOND_HANDLERS = {
    gulan: {
      spar: ({ world, npc, phase }) => {
        if (!['morning', 'afternoon'].includes(phase.id) || npc.flags?.gulan_spar_today) return null
        if (world.flags?.arrived_oakhaven && npc.location === 'training_grounds') {
          return { add: { affection: 2 }, npcFlags: { gulan_spar_today: true } }
        }
        if (npc.location === 'wilds') {
          return { add: { affection: 1 }, npcFlags: { gulan_spar_today: true } }
        }
        return null
      },
      care: ({ npc, phase }) => {
        if (npc.flags?.gulan_care_today) return null
        if (npc.location === 'wilds' || (npc.location === 'inn' && ['morning', 'night'].includes(phase.id))) {
          return { add: { affection: 1 }, npcFlags: { gulan_care_today: true } }
        }
        return null
      },
      gear: ({ npc }) =>
        ['inn', 'training_grounds', 'wilds'].includes(npc.location) && !npc.flags?.gulan_gear_today
          ? { add: { affection: 1 }, npcFlags: { gulan_gear_today: true } } : null,
      guild_report: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && npc.flags?.player_guild_job_done
          ? { add: { affection: 2 }, npcFlags: { player_guild_job_done: false } } : null,
      wilds_assist: ({ npc }) =>
        ['wilds', 'wilds_camp'].includes(npc.location)
          ? { add: { affection: 3 }, exemptCap: true } : null,
      calm: ({ world, npc }) =>
        (npc.values.affection ?? 0) >= 70 && npc.stage >= 1 && npc.stage <= 2 &&
        (world.timeMin - (npc.flags?.lastCalmMin ?? -9999)) >= 4320
          ? { add: { affection: 2, blood_density: -2 }, npcFlags: { lastCalmMin: world.timeMin } } : null,
      confide: ({ npc }) =>
        !npc.flags?.gulan_confide_today
          ? { add: { affection: 2 }, npcFlags: { gulan_confide_today: true } } : null,
      watch: ({ npc, phase }) =>
        ['wilds', 'inn'].includes(npc.location) && ['night', 'deep_night'].includes(phase.id) &&
        !npc.flags?.gulan_watch_today
          ? { add: { affection: 1 }, npcFlags: { gulan_watch_today: true } } : null,
      duty: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && ['town', 'inn', 'wilds'].includes(npc.location) &&
        !npc.flags?.gulan_duty_today
          ? { add: { affection: 2 }, npcFlags: { gulan_duty_today: true } } : null,
      offend: () => ({ add: { affection: -5 }, exemptCap: true })
    },
    isna: {
      comfort: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && world.playerLocation === 'inn' && npc.location === 'inn' &&
        !npc.flags?.gold_desire_frozen && (npc.values.affection ?? 0) >= 60 &&
        (world.timeMin - (npc.flags?.lastComfortMin ?? -9999)) >= 2880
          ? {
              goldCost: 2,
              add: { gold_desire: -2, affection: 2 },
              npcFlags: { isna_comforted_today: true, lastComfortMin: world.timeMin }
            }
          : null,
      steady_work: ({ world, npc, phase }) =>
        world.flags?.arrived_oakhaven && ['morning', 'afternoon'].includes(phase.id) &&
        ['town', 'wilds'].includes(npc.location) && !npc.flags?.isna_steady_today
          ? { add: { affection: 2 }, npcFlags: { isna_worked_today: true, isna_steady_today: true } }
          : null,
      share_food: ({ npc }) =>
        ['wilds', 'inn'].includes(npc.location) && !npc.flags?.isna_share_food_today
          ? { add: { affection: 1 }, npcFlags: { isna_share_food_today: true } } : null,
      scout_chat: ({ npc }) =>
        ['wilds', 'inn', 'town'].includes(npc.location) && !npc.flags?.isna_scout_today
          ? { add: { affection: 1 }, npcFlags: { isna_scout_today: true } } : null,
      gift: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && ['inn', 'town'].includes(npc.location) && !npc.flags?.isna_gift_today
          ? { goldCost: 2, add: { affection: 2 }, npcFlags: { isna_gift_today: true } } : null,
      wilds_assist: ({ npc }) =>
        ['wilds', 'wilds_camp'].includes(npc.location)
          ? { add: { affection: 3 }, exemptCap: true } : null,
      offend: () => ({ add: { affection: -5 }, exemptCap: true })
    },
    nise: {
      tease_back: ({ npc }) =>
        ['wilds', 'inn', 'town'].includes(npc.location) && !npc.flags?.nise_tease_today
          ? { add: { affection: 1 }, npcFlags: { nise_tease_today: true } } : null,
      magic_help: ({ npc }) =>
        !npc.flags?.nise_magic_today
          ? { add: { affection: 1, curiosity: -1 }, npcFlags: { nise_magic_today: true } } : null,
      night_chat: ({ npc, phase }) =>
        ['wilds', 'inn'].includes(npc.location) && ['night', 'deep_night'].includes(phase.id) &&
        !npc.flags?.nise_night_today
          ? { add: { affection: 1 }, npcFlags: { nise_night_today: true } } : null,
      treat: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && ['inn', 'town'].includes(npc.location) && !npc.flags?.nise_treat_today
          ? { goldCost: 2, add: { affection: 2 }, npcFlags: { nise_treat_today: true } } : null,
      escort: ({ world, npc, phase }) =>
        world.flags?.arrived_oakhaven && ['morning', 'afternoon'].includes(phase.id) &&
        ['town', 'wilds', 'wilds_camp'].includes(npc.location) && !npc.flags?.nise_escort_today
          ? { add: { affection: 2 }, npcFlags: { nise_escort_today: true } } : null,
      wilds_assist: ({ npc }) =>
        ['wilds', 'wilds_camp'].includes(npc.location)
          ? { add: { affection: 3 }, exemptCap: true } : null,
      guide: ({ world, npc, item }) => {
        if ((world.timeMin - (npc.flags?.lastGuideMin ?? -9999)) < 2880) return null
        const noveltyPatch = item ? appendNovelty(npc.flags, item) : null
        return {
          add: { affection: 2, curiosity: -4 },
          npcFlags: { lastGuideMin: world.timeMin, ...(noveltyPatch || {}) }
        }
      },
      novelty: ({ npc, item, day }) => {
        const used = npc.flags?.nise_novelty_day === day ? (npc.flags?.nise_novelty_count ?? 0) : 0
        if (used >= 2) return null
        const noveltyPatch = appendNovelty(npc.flags, item)
        if (!noveltyPatch) return null
        return {
          add: { curiosity: 3, affection: 1 },
          npcFlags: { ...noveltyPatch, nise_novelty_day: day, nise_novelty_count: used + 1 }
        }
      },
      offend: () => ({ add: { affection: -5, curiosity: 5 }, exemptCap: true })
    },
    aurora: {
      help_chores: ({ npc }) =>
        ['wilds', 'inn', 'town'].includes(npc.location) && !npc.flags?.aurora_chores_today
          ? { add: { affection: 1 }, npcFlags: { aurora_chores_today: true } } : null,
      heal_care: ({ npc }) =>
        ['wilds', 'wilds_camp', 'inn', 'church'].includes(npc.location) &&
        !npc.flags?.aurora_heal_today
          ? { add: { affection: 2 }, npcFlags: { aurora_heal_today: true } } : null,
      reassure: ({ npc, phase }) =>
        ['wilds', 'inn', 'church'].includes(npc.location) && ['night', 'deep_night'].includes(phase.id) &&
        !npc.flags?.aurora_reassure_today
          ? { add: { affection: 2 }, npcFlags: { aurora_reassure_today: true } } : null,
      church_visit: ({ world, npc, day }) => {
        if (!world.flags?.arrived_oakhaven || npc.location !== 'church' || npc.flags?.aurora_church_today) return null
        return DATA.isWeekendDay(day)
          ? { add: { affection: 2 }, exemptAdd: { affection: 3 }, npcFlags: { aurora_church_today: true } }
          : { add: { affection: 2 }, npcFlags: { aurora_church_today: true } }
      },
      gift: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && ['inn', 'town', 'church'].includes(npc.location) && !npc.flags?.aurora_gift_today
          ? { goldCost: 2, add: { affection: 2 }, npcFlags: { aurora_gift_today: true } } : null,
      wilds_assist: ({ npc }) =>
        ['wilds', 'wilds_camp'].includes(npc.location)
          ? { add: { affection: 3 }, exemptCap: true } : null,
      offend: () => ({ add: { affection: -5 }, exemptCap: true })
    },
    eileen: {
      care_watch: ({ world, npc }) =>
        world.flags?.eileen_fugitive && !world.flags?.baron_purged && !npc.flags?.eileen_captured &&
        (npc.values.affection ?? 0) < 70 && !npc.flags?.eileen_care_today
          ? { add: { affection: 1 }, npcFlags: { eileen_care_today: true } } : null,
      encourage: ({ world, npc }) =>
        world.flags?.eileen_fugitive && !world.flags?.baron_purged && !npc.flags?.eileen_captured &&
        !npc.flags?.eileen_encourage_today
          ? { add: { affection: 2 }, npcFlags: { eileen_encourage_today: true } } : null,
      scout_prep: ({ world, npc }) =>
        world.flags?.eileen_fugitive && !world.flags?.baron_purged && !world.flags?.eileen_signal_fired &&
        !npc.flags?.eileen_captured && !npc.flags?.eileen_scout_today
          ? { add: { counterattack: 4 }, npcFlags: { eileen_scout_today: true } } : null,
      cover_hide: ({ world, npc }) => {
        if (!world.flags?.eileen_fugitive || world.flags?.baron_purged || npc.flags?.eileen_captured) return null
        if (npc.flags?.eileen_cover_today) return null
        const add = { affection: 3 }
        if (!world.flags?.eileen_signal_fired) add.counterattack = 6
        return { add, exemptCap: true, npcFlags: { eileen_cover_today: true } }
      },
      rescue_shield: ({ world, npc }) => {
        if (!world.flags?.eileen_fugitive || world.flags?.baron_purged || npc.flags?.eileen_captured) return null
        if (npc.flags?.eileen_rescue_today) return null
        const add = { affection: 5 }
        if (!world.flags?.eileen_signal_fired) add.counterattack = 10
        return { add, exemptCap: true, npcFlags: { eileen_rescue_today: true } }
      },
      offend: ({ world, npc }) =>
        (world.flags?.eileen_fugitive || world.flags?.baron_purged) &&
        !npc.flags?.eileen_captured && !npc.flags?.eileen_returned_capital
          ? { add: { affection: -3 }, exemptCap: true } : null
    },
    cecilia: {
      mass_pray: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && npc.location === 'church' && npc.stage < 3 && !npc.flags?.affection_locked && !npc.flags?.cecilia_mass_today
          ? { add: { affection: 1 }, npcFlags: { cecilia_mass_today: true } } : null,
      help_orphans: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && npc.location === 'church' && npc.stage < 3 && !npc.flags?.affection_locked && !npc.flags?.cecilia_orphans_today
          ? { add: { affection: 2 }, npcFlags: { cecilia_orphans_today: true } } : null,
      herb_assist: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && npc.location === 'church' && npc.stage < 3 && !npc.flags?.affection_locked && !npc.flags?.cecilia_herb_today
          ? { add: { affection: 2, orphanage_funds: 1 }, npcFlags: { cecilia_herb_today: true, ceciliaAppealDays: 0 } } : null,
      night_talk: ({ world, npc, phase }) =>
        world.flags?.arrived_oakhaven && npc.location === 'church' && npc.stage < 3 && !npc.flags?.affection_locked &&
        ['night', 'deep_night'].includes(phase.id) && (npc.values.affection ?? 0) >= 40 && !npc.flags?.cecilia_night_today
          ? { add: { affection: 2 }, npcFlags: { cecilia_night_today: true } } : null,
      church_gift: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && npc.location === 'church' && npc.stage < 3 && !npc.flags?.affection_locked && !npc.flags?.cecilia_gift_today
          ? { goldCost: 2, add: { affection: 2, orphanage_funds: 1 }, npcFlags: { cecilia_gift_today: true, ceciliaAppealDays: 0 } } : null,
      shield_church: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && npc.location === 'church' && npc.stage < 3 && !npc.flags?.affection_locked && !npc.flags?.cecilia_shield_today
          ? { add: { affection: 4 }, exemptCap: true, npcFlags: { cecilia_shield_today: true } } : null,
      offend: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && npc.stage < 3 && !npc.flags?.affection_locked
          ? { add: { affection: -5 }, exemptCap: true } : null
    },
    ed: {
      ask_intel: ({ world, npc, day }) =>
        world.flags?.arrived_oakhaven && npc.monitored === true && npc.alive !== false && npc.flags?.ed_intel_day !== day
          ? { npcFlags: { ed_intel_day: day }, worldFlags: { ed_last_intel_day: day } } : null,
      teach_skills: ({ npc, day }) => {
        if (npc.monitored !== true || npc.alive === false || npc.flags?.ed_teach_day === day) return null
        const nextCount = (npc.flags?.ed_teach_count ?? 0) + 1
        // 3 = 定稿门槛：累计指导求生常识达 3 次解锁潜行放哨与掩护能力
        const stealthReady = Boolean(npc.flags?.ed_stealth_ready || nextCount >= 3)
        return {
          npcFlags: { ed_teach_day: day, ed_teach_count: nextCount, ed_stealth_ready: stealthReady },
          ...(stealthReady ? { worldFlags: { ed_stealth_ready: true } } : {})
        }
      },
      ask_sister: ({ world, npc, day }) =>
        world.flags?.ed_permanently_joined && npc.monitored === true && npc.alive !== false
          ? { npcFlags: { ed_asked_sister_day: day } } : null
    }
  }

  function resolveBonds(world, bonds, ctx) {
    const out = []
    const day = Math.floor(world.timeMin / 1440) + 1
    const capCache = {}
    const flagCache = {}
    let curGold = Number.isSafeInteger(world.playerState?.gold) ? world.playerState.gold : 0
    let innArrears = Boolean(world.flags?.inn_arrears)
    let oddJobUsed = world.flags?.playerOddJobDay === day

    for (const item of bonds || []) {
      const npc = world.npcs?.[item.npc]
      const fn = BOND_HANDLERS[item.npc]?.[item.kind]
      if (!npc || !fn || npc.location !== world.playerLocation) continue

      const viewNpc = { ...npc, flags: { ...npc.flags, ...(flagCache[npc.id] || {}) } }
      const res = fn({ world, npc: viewNpc, phase: ctx.phase, item: item.item, day })
      if (!res) continue

      const cost = res.goldCost ?? 0
      if (cost > 0) {
        if (curGold < cost || (world.playerLocation === 'inn' && innArrears)) continue
        curGold -= cost
        out.push({ target: 'world', goldDelta: -cost })
      }

      if (item.npc === 'isna' && item.kind === 'steady_work' &&
          !world.flags?.eileen_fugitive && !oddJobUsed) {
        oddJobUsed = true
        curGold += 15
        const worldFlags = { playerOddJobDay: day }
        if (curGold >= 5 && innArrears) {
          innArrears = false
          worldFlags.inn_arrears = false
        }
        out.push({ target: 'world', goldDelta: 15, worldFlags })
      }

      const add = { ...(res.add || {}) }
      const npcFlags = { ...(res.npcFlags || {}) }
      const affLocked = isMetricLocked(world, npc, 'affection')
      if (npc.id === 'nise' && item.kind !== 'offend') npcFlags.lastInteractDay = day

      if (affLocked) {
        delete add.affection
      } else {
        if (npc.hasAffection !== false && add.affection > 0 && !res.exemptCap) {
          const curDay = capCache[npc.id]?.day ?? npc.flags?.dailyAffectionDay
          const used = curDay === day ? (capCache[npc.id]?.gain ?? npc.flags?.dailyAffectionGain ?? 0) : 0
          const allow = Math.max(0, 3 - used)
          add.affection = Math.min(add.affection, allow)
          capCache[npc.id] = { day, gain: used + add.affection }
          npcFlags.dailyAffectionDay = day
          npcFlags.dailyAffectionGain = used + add.affection
        }
        if (npc.hasAffection !== false && res.exemptAdd?.affection) {
          add.affection = (add.affection || 0) + res.exemptAdd.affection
        }
      }

      flagCache[npc.id] = { ...(flagCache[npc.id] || {}), ...npcFlags }
      out.push({ target: npc.id, add, npcFlags })
      if (res.worldFlags) out.push({ target: 'world', worldFlags: res.worldFlags })
      if (item.npc === 'gulan' && item.kind === 'calm' && (add.blood_density ?? 0) < 0 &&
          world.flags?.ed_joined && world.npcs?.ed?.monitored) {
        out.push({ target: 'ed', add: { patience: -3 } })
      }
    }
    return out
  }

  function resolveEconomy(world, economies, ctx) {
    const out = []
    if (!world?.flags?.arrived_oakhaven) return out
    const day = Math.floor(world.timeMin / 1440) + 1
    let curGold = Number.isSafeInteger(world.playerState?.gold) ? world.playerState.gold : 0
    let innArrears = Boolean(world.flags?.inn_arrears)
    let oddJobDay = world.flags?.playerOddJobDay
    let guildDay = Number.isFinite(world.flags?.lastGuildCommissionDay) ? world.flags.lastGuildCommissionDay : -99
    let churchDay = Number.isFinite(world.flags?.lastChurchErrandDay) ? world.flags.lastChurchErrandDay : -99

    const gulan = world.npcs?.gulan, isna = world.npcs?.isna
    const aurora = world.npcs?.aurora, nise = world.npcs?.nise, cecilia = world.npcs?.cecilia
    let auroraDebt = aurora?.values?.debt_pressure ?? 0
    let niseDebt = nise?.values?.gamble_debt ?? 0
    let cecFunds = cecilia?.values?.orphanage_funds ?? 0
    let cecAff = cecilia?.values?.affection ?? 0
    const cecLocked = isMetricLocked(world, cecilia, 'affection')
    let cecDaily = cecilia?.flags?.dailyAffectionDay === day ? (cecilia.flags?.dailyAffectionGain ?? 0) : 0

    const pushIncome = (delta, extraFlags) => {
      curGold += delta
      const worldFlags = { ...extraFlags }
      if (curGold >= 5 && innArrears) {
        innArrears = false
        worldFlags.inn_arrears = false
      }
      out.push({ target: 'world', goldDelta: delta, worldFlags })
    }

    for (let i = 0; i < (economies || []).length; i++) {
      const item = economies[i]
      if (!item) continue
      if (item.op === 'work' && !world.flags?.eileen_fugitive) {
        if (item.tier === 'odd' && ['town', 'wilds'].includes(world.playerLocation) && oddJobDay !== day) {
          oddJobDay = day
          pushIncome(15, { playerOddJobDay: day })
        } else if (item.tier === 'guild_normal' && ['town', 'wilds'].includes(world.playerLocation) && (day - guildDay) >= 3) {
          guildDay = day
          pushIncome(60, { lastGuildCommissionDay: day })
          if (gulan && gulan.alive !== false && (gulan.stage ?? 0) < 3) {
            out.push({ target: 'gulan', npcFlags: { player_guild_job_done: true } })
          }
        } else if (item.tier === 'guild_high' && ['town', 'wilds'].includes(world.playerLocation) && (day - guildDay) >= 3) {
          const gulanReady = Boolean(gulan && gulan.alive !== false && (gulan.stage ?? 0) < 3 && world.playerLocation === 'wilds' && gulan.location === 'wilds')
          const isnaReady = Boolean(isna && isna.alive !== false && (isna.stage ?? 0) < 3 && !isna.flags?.captured_orc && !isna.flags?.isna_fallen_orc && !isna.flags?.isna_captured_ed && !isna.flags?.isna_fallen_labyrinth && isna.location === world.playerLocation)
          if (!gulanReady && !isnaReady) continue
          guildDay = day
          pushIncome(140, { lastGuildCommissionDay: day })
          if (gulan && gulan.alive !== false && (gulan.stage ?? 0) < 3) {
            out.push({ target: 'gulan', npcFlags: { player_guild_job_done: true } })
          }
        } else if ((item.tier === 'church_paid' || item.tier === 'church_volunteer') &&
            ['church', 'wilds'].includes(world.playerLocation) &&
            cecilia && cecilia.alive !== false && (cecilia.stage ?? 0) < 3 && (day - churchDay) >= 2) {
          churchDay = day
          const volunteer = item.tier === 'church_volunteer'
          if (volunteer) {
            out.push({ target: 'world', worldFlags: { lastChurchErrandDay: day } })
          } else {
            pushIncome(10, { lastChurchErrandDay: day })
          }
          const fundsGain = Math.min(volunteer ? 8 : 4, Math.max(0, 100 - cecFunds))
          cecFunds += fundsGain
          const capped = cecLocked ? 0 : Math.min(2, Math.max(0, 3 - cecDaily))
          cecDaily += capped
          const affGain = cecLocked ? 0 : (volunteer ? capped + 3 : capped)
          cecAff = Math.min(100, cecAff + affGain)
          const add = {}
          if (fundsGain > 0) add.orphanage_funds = fundsGain
          if (affGain > 0) add.affection = affGain
          out.push({
            target: 'cecilia',
            ...(Object.keys(add).length ? { add } : {}),
            npcFlags: { dailyAffectionDay: day, dailyAffectionGain: cecDaily, ceciliaAppealDays: 0 }
          })
        }
      } else if (item.op === 'repay') {
        if (item.npc === 'aurora' && aurora && aurora.alive !== false && !aurora.flags?.aurora_purged_with_baron &&
            aurora.flags?.aurora_debt_disclosed && auroraDebt > 0 &&
            ['inn', 'town', 'church'].includes(world.playerLocation) && world.playerLocation === aurora.location) {
          const pts = item.tier === 'all' ? auroraDebt : Math.min(auroraDebt, 10)
          const cost = pts * 10
          if (pts <= 0 || curGold < cost) continue
          curGold -= cost
          auroraDebt -= pts
          out.push({ target: 'world', goldDelta: -cost })
          out.push({
            target: 'aurora',
            add: { debt_pressure: -pts },
            ...(auroraDebt <= 0 ? { npcFlags: { aurora_debt_cleared: true } } : {})
          })
        } else if (item.npc === 'nise' && nise && nise.alive !== false && (nise.stage ?? 0) < 3 &&
            !nise.flags?.casino_debt_frozen && !nise.flags?.nise_fled_casino && niseDebt > 0 &&
            ['town', 'casino', 'inn'].includes(world.playerLocation) &&
            (nise.flags?.nise_debt_known || (nise.stage ?? 0) >= 1 || (world.playerLocation === 'casino' && nise.location === 'casino'))) {
          const pts = item.tier === 'all' ? niseDebt : Math.min(niseDebt, 10)
          const cost = pts * 10
          if (pts <= 0 || curGold < cost) continue
          curGold -= cost
          niseDebt -= pts
          out.push({ target: 'world', goldDelta: -cost })
          const npcFlags = {}
          if (world.playerLocation === 'casino') npcFlags.nise_debt_known = true
          if (niseDebt <= 0) {
            npcFlags.debt_repaid_once = true
            npcFlags.casinoGapDays = 0
          }
          out.push({ target: 'nise', add: { gamble_debt: -pts }, ...(Object.keys(npcFlags).length ? { npcFlags } : {}) })
        }
      } else if (item.op === 'donate' && item.npc === 'cecilia' &&
          world.playerLocation === 'church' && cecilia && cecilia.location === 'church' &&
          cecilia.alive !== false && (cecilia.stage ?? 0) < 3 && !cecLocked && cecFunds < 100) {
        const isLarge = item.tier === 'large'
        const cost = isLarge ? 50 : 25
        const fundsGain = Math.min(isLarge ? 10 : 5, 100 - cecFunds)
        if (curGold < cost || fundsGain <= 0) continue
        const rawAff = isLarge ? 10 : 5
        const affGain = cecAff < 70 ? Math.max(0, Math.min(70 - cecAff, rawAff)) : 0
        curGold -= cost
        cecFunds += fundsGain
        cecAff += affGain
        const add = { orphanage_funds: fundsGain, donated_gold: cost }
        if (affGain > 0) add.affection = affGain
        out.push({ target: 'world', goldDelta: -cost })
        out.push({ target: 'cecilia', add, npcFlags: { ceciliaAppealDays: 0 } })
      } else if (item.op === 'buy_supply' && ['inn', 'town'].includes(world.playerLocation)) {
        const count = Number.isSafeInteger(item.count) && item.count >= 1 ? item.count : 0
        const unitPrice = DATA.ITEM_CATALOG?.supply?.unitPrice ?? 1
        const cost = count * unitPrice
        if (count <= 0 || curGold < cost) continue
        curGold -= cost
        out.push({
          target: 'world',
          goldDelta: -cost,
          itemsAdd: [{ id: 'supply', count }],
          ...(world.flags?.supply_shortage ? { worldFlags: { supply_shortage: false } } : {})
        })
      }
    }
    return out
  }

  root.OKH_APP_RULES = Object.freeze({
    getAffectionTier,
    isFugitiveSyncedNpc,
    syncWorld,
    isMetricLocked,
    onStageChange,
    canMove,
    applyPrologueSteps,
    resolveRoom,
    resolveBonds,
    resolveEconomy
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_RULES
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)

;
/**
 * @module okh_app_time
 * @updated 2026-11-19 02:40
 * @status  active
 * @reason  跨日午夜唯一键去重结算：移除古兰被俘天数跨夜自增；新增演武场血案余波 7 天全局 Tag（安保戒严、人心惶惶）满期自动解除
 * @deps    OKH_APP_DATA
 * @provides { settleTimeEffects }
 */
(function (root) {
  'use strict'

  const DATA = root.OKH_APP_DATA
  if (!DATA) throw Error('time 缺少 OKH_APP_DATA')

  function gulanRoomBlockedUntilMin(world, fromMin) {
    if (world.flags?.playerRoomTarget !== 'gulan') return -1
    const gulan = world.npcs?.gulan
    if (!gulan || world.playerLocation !== 'inn' || gulan.location !== 'inn') return -1
    if ((gulan.stage ?? 0) >= 3 || ((gulan.stage ?? 0) === 2 && (gulan.values?.affection ?? 0) < 90)) return -1
    // 同房保护持续至下一个 06:00 拂晓前（跨过该拂晓或离店后由 shouldClearRoomTarget 清零）
    return (Math.floor((fromMin - 360) / 1440) + 1) * 1440 + 360
  }

  function makeNightSim(world, fromMin) {
    const gulan = world.npcs?.gulan, isna = world.npcs?.isna, nise = world.npcs?.nise
    const aurora = world.npcs?.aurora, eileen = world.npcs?.eileen, cecilia = world.npcs?.cecilia, ed = world.npcs?.ed
    const others = {}
    for (const npc of Object.values(world.npcs || {})) {
      if (['gulan', 'isna', 'nise', 'aurora', 'eileen', 'cecilia', 'ed'].includes(npc.id)) continue
      others[npc.id] = {
        alive: npc.alive !== false,
        lastNight: Number.isFinite(npc.flags?.lastNightSettledDay) ? npc.flags.lastNightSettledDay : 0
      }
    }
    const inv = Array.isArray(world.playerState?.inventory) ? world.playerState.inventory : []
    const supplyEntry = inv.find(it => it && it.id === 'supply' && it.custom !== true)
    const supplyCount = Number.isSafeInteger(supplyEntry?.count) && supplyEntry.count > 0 ? supplyEntry.count : 0
    const presentNpcCount = Object.values(world.npcs || {}).filter(n =>
      n && n.monitored === true && n.alive !== false && n.location === world.playerLocation
    ).length
    // 1 = 玩家本人；非旅店过夜按在场总人数（玩家 + 同地存活且受监控的同行 NPC）每人消耗 1 份补给
    const partySizeHere = 1 + presentNpcCount
    return {
      arrived: Boolean(world.flags?.arrived_oakhaven),
      playerLoc: world.playerLocation,
      gold: Number.isSafeInteger(world.playerState?.gold) ? world.playerState.gold : 40,
      supplyCount,
      supplyShortage: Boolean(world.flags?.supply_shortage),
      partySizeHere,
      innArrears: Boolean(world.flags?.inn_arrears),
      innFreePassToday: Boolean(world.flags?.inn_free_pass_today),
      baronyGranted: Boolean(world.flags?.player_barony_granted),
      innLastNight: Number.isFinite(world.flags?.lastInnSettledDay) ? world.flags.lastInnSettledDay : 0,
      edJoined: Boolean(world.flags?.ed_joined),
      edMonitored: Boolean(ed?.monitored),
      edAlive: Boolean(ed && ed.alive !== false),
      edPatience: ed?.values?.patience ?? 100,
      edLoc: ed?.location || null,
      edLastNight: Number.isFinite(ed?.flags?.lastNightSettledDay) ? ed.flags.lastNightSettledDay : 0,
      bloodyArena: Boolean(world.flags?.bloody_arena),
      bloodyArenaDay: Number.isFinite(world.flags?.bloodyArenaDay) ? world.flags.bloodyArenaDay : 0,
      martialLaw: Boolean(world.flags?.martial_law),
      panic: Boolean(world.flags?.panic),
      townLastNight: Number.isFinite(world.flags?.lastTownSettledDay) ? world.flags.lastTownSettledDay : 0,
      gulanAlive: Boolean(gulan && gulan.alive !== false),
      gulanStage: gulan?.stage ?? 0,
      gulanLoc: gulan?.location || null,
      gulanRoomProtectedUntil: gulanRoomBlockedUntilMin(world, fromMin),
      gulanLastNight: Number.isFinite(gulan?.flags?.lastNightSettledDay) ? gulan.flags.lastNightSettledDay : 0,
      isnaAlive: Boolean(isna && isna.alive !== false),
      isnaFrozen: Boolean(isna?.flags?.gold_desire_frozen),
      isnaWorked: Boolean(isna?.flags?.isna_worked_today),
      isnaComforted: Boolean(isna?.flags?.isna_comforted_today),
      isnaDistress: isna?.flags?.isna_camp_distress || null,
      isnaDistressDays: Number.isFinite(isna?.flags?.isnaDistressDays) ? isna.flags.isnaDistressDays : 0,
      isnaCapturedOrc: Boolean(isna?.flags?.captured_orc),
      isnaFallenOrc: Boolean(isna?.flags?.isna_fallen_orc),
      isnaCaptiveDays: Number.isFinite(isna?.flags?.orcCaptiveDays) ? isna.flags.orcCaptiveDays : 0,
      isnaLastNight: Number.isFinite(isna?.flags?.lastNightSettledDay) ? isna.flags.lastNightSettledDay : 0,
      niseAlive: Boolean(nise && nise.alive !== false && nise.monitored !== false && !nise.flags?.nise_fled_casino),
      niseStage: nise?.stage ?? 0,
      niseAff: nise?.values?.affection ?? 0,
      niseDebt: nise?.values?.gamble_debt ?? 0,
      niseTastedCasino: Boolean(nise?.flags?.tasted_casino),
      niseFirstDebtDone: Boolean(nise?.flags?.nise_first_debt_done),
      niseDebtRepaidOnce: Boolean(nise?.flags?.debt_repaid_once),
      niseDebtFrozen: Boolean(nise?.flags?.casino_debt_frozen),
      niseCasinoGapDays: Number.isFinite(nise?.flags?.casinoGapDays) ? nise.flags.casinoGapDays : 0,
      niseHasAff: nise?.hasAffection !== false,
      niseAffLocked: Boolean(nise?.flags?.affection_locked),
      niseLastNight: Number.isFinite(nise?.flags?.lastNightSettledDay) ? nise.flags.lastNightSettledDay : 0,
      niseLastInteract: Number.isFinite(nise?.flags?.lastInteractDay) ? nise.flags.lastInteractDay : 1,
      ceciliaAlive: Boolean(cecilia && cecilia.alive !== false && cecilia.monitored !== false),
      ceciliaStage: cecilia?.stage ?? 0,
      ceciliaFunds: cecilia?.values?.orphanage_funds ?? 0,
      ceciliaAff: cecilia?.values?.affection ?? 0,
      ceciliaMidgameCrisis: Boolean(cecilia?.flags?.cecilia_midgame_crisis),
      ceciliaAppealDays: Number.isFinite(cecilia?.flags?.ceciliaAppealDays) ? cecilia.flags.ceciliaAppealDays : 0,
      ceciliaGoStage1: Boolean(cecilia?.flags?.cecilia_manor_go_stage1),
      ceciliaGoStage2: Boolean(cecilia?.flags?.cecilia_manor_go_stage2),
      ceciliaGoStage3: Boolean(cecilia?.flags?.cecilia_manor_go_stage3),
      ceciliaLastNight: Number.isFinite(cecilia?.flags?.lastNightSettledDay) ? cecilia.flags.lastNightSettledDay : 0,
      auroraAlive: Boolean(aurora && aurora.alive !== false && aurora.monitored !== false && !aurora.flags?.aurora_purged_with_baron),
      auroraStage: aurora?.stage ?? 0,
      auroraManorActive: Boolean(aurora?.flags?.manor_service_active),
      auroraLeftManor: Boolean(aurora?.flags?.aurora_left_manor),
      auroraLoc: aurora?.location || null,
      auroraWorkedDay: Number.isFinite(aurora?.flags?.aurora_worked_manor_day) ? aurora.flags.aurora_worked_manor_day : 0,
      auroraDebt: aurora?.values?.debt_pressure ?? 0,
      auroraWorkDays: Number.isFinite(aurora?.flags?.manorWorkDays) ? aurora.flags.manorWorkDays : 0,
      auroraLastNight: Number.isFinite(aurora?.flags?.lastNightSettledDay) ? aurora.flags.lastNightSettledDay : 0,
      eileenMonitored: Boolean(eileen && eileen.alive !== false && eileen.monitored === true),
      eileenArrived: Boolean(world.flags?.eileen_arrived),
      eileenDeparted: Boolean(world.flags?.eileen_departed),
      eileenFugitive: Boolean(world.flags?.eileen_fugitive || eileen?.flags?.eileen_fugitive),
      eileenCaptured: Boolean(eileen?.flags?.eileen_captured),
      eileenSignalFired: Boolean(world.flags?.eileen_signal_fired || eileen?.flags?.eileen_signal_fired),
      baronPurged: Boolean(world.flags?.baron_purged),
      eileenBetrothed: Boolean(eileen?.flags?.eileen_betrothed || world.flags?.player_barony_granted),
      eileenReturnedCapital: Boolean(eileen?.flags?.eileen_returned_capital),
      eileenInspectDays: Number.isFinite(eileen?.flags?.eileenInspectDays) ? eileen.flags.eileenInspectDays : 0,
      eileenCaptiveDays: Number.isFinite(eileen?.flags?.eileenCaptiveDays) ? eileen.flags.eileenCaptiveDays : 0,
      eileenSignalDays: Number.isFinite(eileen?.flags?.eileenSignalDays) ? eileen.flags.eileenSignalDays : 0,
      eileenPostPurgeDays: Number.isFinite(eileen?.flags?.eileenPostPurgeDays) ? eileen.flags.eileenPostPurgeDays : 0,
      eileenLastNight: Number.isFinite(eileen?.flags?.lastNightSettledDay) ? eileen.flags.lastNightSettledDay : 0,
      others
    }
  }

  function settleGulanNight(sim, k, changes) {
    if (sim.gulanLastNight >= k) return
    const add = {}
    const roomBlocked = k * 1440 < sim.gulanRoomProtectedUntil
    if (!roomBlocked && sim.edJoined && sim.arrived && sim.gulanAlive && sim.edMonitored && sim.gulanLoc === sim.edLoc) {
      add.blood_density = sim.gulanStage >= 2 ? 2 : 1
    }
    const change = {
      target: 'gulan',
      npcFlags: {
        gulan_spar_today: false,
        gulan_care_today: false,
        gulan_gear_today: false,
        gulan_confide_today: false,
        gulan_watch_today: false,
        gulan_duty_today: false,
        dailyAffectionDay: k + 1,
        dailyAffectionGain: 0,
        lastNightSettledDay: k
      }
    }
    if (Object.keys(add).length) change.add = add
    changes.push(change)
    sim.gulanLastNight = k
  }

  function settleIsnaNight(sim, k, changes) {
    if (sim.isnaLastNight >= k) return
    const change = {
      target: 'isna',
      npcFlags: {
        isna_worked_today: false,
        isna_steady_today: false,
        isna_comforted_today: false,
        isna_share_food_today: false,
        isna_scout_today: false,
        isna_gift_today: false,
        dailyAffectionDay: k + 1,
        dailyAffectionGain: 0,
        lastNightSettledDay: k
      }
    }
    const fugitivePaused = Boolean(sim.eileenFugitive && !sim.baronPurged)
    if (sim.arrived && sim.isnaAlive && !sim.isnaFrozen && !sim.isnaWorked && !sim.isnaComforted && !fugitivePaused) {
      change.add = { gold_desire: 1 }
    }
    if (sim.isnaAlive && sim.isnaDistress && !sim.isnaCapturedOrc && !sim.isnaFallenOrc) {
      sim.isnaDistressDays += 1
      change.npcFlags.isnaDistressDays = sim.isnaDistressDays
    } else if (sim.isnaAlive && sim.isnaCapturedOrc && !sim.isnaFallenOrc) {
      sim.isnaCaptiveDays += 1
      change.npcFlags.orcCaptiveDays = sim.isnaCaptiveDays
    }
    changes.push(change)
    sim.isnaWorked = false
    sim.isnaComforted = false
    sim.isnaLastNight = k
  }

  function settleNiseNight(sim, k, changes) {
    if (sim.niseLastNight >= k) return
    const fugitivePaused = Boolean(sim.eileenFugitive && !sim.baronPurged)
    const affLocked = sim.niseStage >= 3 || sim.niseAffLocked
    const add = {}
    if (sim.niseAlive && sim.niseHasAff && !affLocked && !fugitivePaused && (k - sim.niseLastInteract) >= 5) {
      add.affection = -1
    }
    if (sim.niseAlive && sim.niseStage < 3 && !sim.niseDebtFrozen && sim.niseDebt > 0) {
      const interest = sim.niseDebt >= 60 ? 4 : 2
      add.gamble_debt = interest
      sim.niseDebt = Math.min(100, sim.niseDebt + interest)
    }
    const npcFlags = {
      nise_browsed_today: false,
      nise_tease_today: false,
      nise_magic_today: false,
      nise_night_today: false,
      nise_treat_today: false,
      nise_escort_today: false,
      nise_casino_busy_today: false,
      dailyAffectionDay: k + 1,
      dailyAffectionGain: 0,
      lastNightSettledDay: k
    }
    if (sim.arrived && sim.niseAlive && sim.niseStage < 3 && !fugitivePaused && !sim.niseDebtFrozen &&
        sim.niseTastedCasino && (!sim.niseFirstDebtDone || sim.niseDebt > 0 || (sim.niseDebtRepaidOnce && sim.niseAff < 90))) {
      sim.niseCasinoGapDays += 1
      npcFlags.casinoGapDays = sim.niseCasinoGapDays
    }
    if (fugitivePaused) {
      sim.niseLastInteract = Math.max(sim.niseLastInteract, k)
      npcFlags.lastInteractDay = sim.niseLastInteract
    }
    const change = { target: 'nise', npcFlags }
    if (Object.keys(add).length) change.add = add
    changes.push(change)
    sim.niseLastNight = k
  }

  function settleAuroraNight(sim, k, kStart, changes) {
    if (sim.auroraLastNight >= k) return
    const npcFlags = {
      aurora_chores_today: false,
      aurora_heal_today: false,
      aurora_reassure_today: false,
      aurora_church_today: false,
      aurora_gift_today: false,
      dailyAffectionDay: k + 1,
      dailyAffectionGain: 0,
      lastNightSettledDay: k
    }
    const workedToday = sim.auroraWorkedDay === k || sim.auroraLoc === 'manor' || k > kStart
    if (sim.arrived && sim.auroraAlive && !sim.baronPurged && sim.auroraManorActive && !sim.auroraLeftManor &&
        sim.auroraStage < 3 && sim.auroraDebt > 0 && !DATA.isWeekendDay(k) && workedToday) {
      sim.auroraWorkDays += 1
      npcFlags.manorWorkDays = sim.auroraWorkDays
    }
    changes.push({ target: 'aurora', npcFlags })
    sim.auroraLastNight = k
  }

  function settleEileenNight(sim, k, changes) {
    if (sim.eileenLastNight >= k) return
    const npcFlags = {
      eileen_care_today: false,
      eileen_encourage_today: false,
      eileen_scout_today: false,
      eileen_cover_today: false,
      eileen_rescue_today: false,
      dailyAffectionDay: k + 1,
      dailyAffectionGain: 0,
      lastNightSettledDay: k
    }
    const change = { target: 'eileen', npcFlags }
    if (sim.eileenMonitored && !sim.baronPurged) {
      if (sim.eileenSignalFired) {
        sim.eileenSignalDays += 1
        npcFlags.eileenSignalDays = sim.eileenSignalDays
      } else if (sim.eileenFugitive) {
        change.add = { counterattack: 4 }
      } else if (sim.eileenCaptured) {
        sim.eileenCaptiveDays += 1
        npcFlags.eileenCaptiveDays = sim.eileenCaptiveDays
      } else if (sim.eileenArrived && !sim.eileenDeparted) {
        sim.eileenInspectDays += 1
        npcFlags.eileenInspectDays = sim.eileenInspectDays
      }
    } else if (sim.eileenMonitored && sim.baronPurged && !sim.eileenBetrothed && !sim.eileenReturnedCapital) {
      sim.eileenPostPurgeDays += 1
      npcFlags.eileenPostPurgeDays = sim.eileenPostPurgeDays
    }
    changes.push(change)
    sim.eileenLastNight = k
  }

  function settleInnNight(sim, k, changes) {
    if (sim.innLastNight >= k) return
    sim.innLastNight = k
    const clearShortage = sim.supplyShortage ? { supply_shortage: false } : {}

    // 互斥分支 1：在旅店过夜走宿费结算，不消耗野外补给
    if (sim.playerLoc === 'inn') {
      sim.supplyShortage = false
      if (sim.arrived && !sim.eileenFugitive && !sim.baronyGranted) {
        if (sim.innFreePassToday) {
          // 爱德当日帮工抵扣仅免除当晚一次宿费，核销后次日恢复正常计费
          sim.innFreePassToday = false
          changes.push({ target: 'world', worldFlags: { lastInnSettledDay: k, inn_free_pass_today: false, ...clearShortage } })
        } else if (sim.gold >= 5) {
          sim.gold -= 5
          const worldFlags = { lastInnSettledDay: k, ...clearShortage }
          if (sim.innArrears) {
            sim.innArrears = false
            worldFlags.inn_arrears = false
          }
          changes.push({ target: 'world', goldDelta: -5, worldFlags })
        } else {
          const delta = -sim.gold
          sim.gold = 0
          sim.innArrears = true
          changes.push({ target: 'world', ...(delta ? { goldDelta: delta } : {}), worldFlags: { lastInnSettledDay: k, inn_arrears: true, ...clearShortage } })
        }
      } else {
        const worldFlags = { lastInnSettledDay: k, ...clearShortage }
        if (sim.innFreePassToday) {
          sim.innFreePassToday = false
          worldFlags.inn_free_pass_today = false
        }
        changes.push({ target: 'world', worldFlags })
      }
      return
    }

    // 互斥分支 2：获封男爵后在自家领主山庄过夜，免宿费且免扣补给
    if (sim.baronyGranted && sim.playerLoc === 'manor') {
      const worldFlags = { lastInnSettledDay: k, ...clearShortage }
      sim.supplyShortage = false
      if (sim.innFreePassToday) {
        sim.innFreePassToday = false
        worldFlags.inn_free_pass_today = false
      }
      changes.push({ target: 'world', worldFlags })
      return
    }

    // 互斥分支 3：其他非旅店地点过夜，不扣旅店房费，改为按在场人数每人消耗 1 份补给
    const clearPass = sim.innFreePassToday ? { inn_free_pass_today: false } : {}
    sim.innFreePassToday = false
    const need = sim.partySizeHere
    if (sim.supplyCount >= need) {
      sim.supplyCount -= need
      sim.supplyShortage = false
      changes.push({
        target: 'world',
        itemsRemove: [{ id: 'supply', count: need }],
        worldFlags: { lastInnSettledDay: k, ...clearPass, ...clearShortage }
      })
    } else {
      const spent = sim.supplyCount
      sim.supplyCount = 0
      sim.supplyShortage = true
      changes.push({
        target: 'world',
        ...(spent > 0 ? { itemsRemove: [{ id: 'supply', count: spent }] } : {}),
        worldFlags: { lastInnSettledDay: k, supply_shortage: true, ...clearPass }
      })
    }
  }

  function settleCeciliaNight(sim, k, changes) {
    if (sim.ceciliaLastNight >= k) return
    const npcFlags = {
      cecilia_mass_today: false,
      cecilia_orphans_today: false,
      cecilia_herb_today: false,
      cecilia_night_today: false,
      cecilia_gift_today: false,
      cecilia_shield_today: false,
      dailyAffectionDay: k + 1,
      dailyAffectionGain: 0,
      lastNightSettledDay: k
    }
    const add = {}
    if (sim.arrived && sim.ceciliaAlive && !sim.baronPurged && sim.ceciliaStage < 3) {
      if (sim.ceciliaFunds > 0) {
        const drain = sim.ceciliaMidgameCrisis ? 6 : 3
        const drop = Math.min(sim.ceciliaFunds, drain)
        sim.ceciliaFunds -= drop
        add.orphanage_funds = -drop
        if (sim.ceciliaAppealDays > 0) {
          sim.ceciliaAppealDays = 0
          npcFlags.ceciliaAppealDays = 0
        }
      } else {
        const reqAff = sim.ceciliaStage === 0 ? 70 : sim.ceciliaStage === 1 ? 80 : 90
        const goFlag = sim.ceciliaStage === 0 ? sim.ceciliaGoStage1 : sim.ceciliaStage === 1 ? sim.ceciliaGoStage2 : sim.ceciliaGoStage3
        if (sim.ceciliaAff >= reqAff && !goFlag) {
          sim.ceciliaAppealDays += 1
          npcFlags.ceciliaAppealDays = sim.ceciliaAppealDays
        }
      }
    }
    const change = { target: 'cecilia', npcFlags }
    if (Object.keys(add).length) change.add = add
    changes.push(change)
    sim.ceciliaLastNight = k
  }

  function settleEdNight(sim, k, changes) {
    if (sim.edLastNight >= k) return
    const npcFlags = {
      dailyAffectionDay: k + 1,
      dailyAffectionGain: 0,
      lastNightSettledDay: k
    }
    const add = {}
    if (sim.edJoined && sim.edMonitored && sim.edAlive) {
      let delta = -1
      const roomBlocked = k * 1440 < sim.gulanRoomProtectedUntil
      const gulanMatured = !roomBlocked && sim.arrived && sim.gulanAlive && sim.gulanLoc === sim.edLoc
      if (gulanMatured) {
        delta += 1
      }
      if (delta !== 0) {
        add.patience = delta
      }
    }
    const change = { target: 'ed', npcFlags }
    if (Object.keys(add).length) change.add = add
    changes.push(change)
    sim.edLastNight = k
  }

  function settleOtherNights(sim, k, changes) {
    for (const [id, st] of Object.entries(sim.others)) {
      if (!st.alive || st.lastNight >= k) continue
      changes.push({
        target: id,
        npcFlags: {
          dailyAffectionDay: k + 1,
          dailyAffectionGain: 0,
          lastNightSettledDay: k
        }
      })
      st.lastNight = k
    }
  }

  function settleTownNight(sim, k, changes) {
    if (sim.townLastNight >= k) return
    sim.townLastNight = k
    if (sim.bloodyArena && (sim.martialLaw || sim.panic)) {
      // 6 = 案发日当天算第 1 天，历经 7 个自然日（案发日 + 6 个午夜跨入第 8 天）后全局 Tag 自动解除平息
      if (k - sim.bloodyArenaDay >= 6) {
        sim.martialLaw = false
        sim.panic = false
        changes.push({
          target: 'world',
          worldFlags: { martial_law: false, panic: false, lastTownSettledDay: k }
        })
      }
    }
  }

  function shouldClearRoomTarget(world, fromMin, toMin) {
    const target = world.flags?.playerRoomTarget
    if (!target) return false
    const gulan = world.npcs?.gulan
    if (target === 'gulan') {
      const invalidNow =
        world.playerLocation !== 'inn' ||
        !gulan ||
        gulan.location !== 'inn' ||
        (gulan.stage ?? 0) >= 3 ||
        ((gulan.stage ?? 0) === 2 && (gulan.values?.affection ?? 0) < 90)
      if (invalidNow) return true
    }
    const dawnStart = Math.floor((fromMin - 360) / 1440) + 1
    const dawnEnd = Math.floor((toMin - 360) / 1440)
    return dawnStart <= dawnEnd
  }

  function settleTimeEffects({ world, fromMin, toMin }) {
    if (!world || toMin < fromMin) return []
    const changes = []
    if (toMin > fromMin) {
      const sim = makeNightSim(world, fromMin)
      const dayNow = Math.floor(fromMin / 1440) + 1
      if (sim.arrived && sim.auroraAlive && !sim.baronPurged && sim.auroraManorActive && !sim.auroraLeftManor &&
          sim.auroraStage < 3 && sim.auroraDebt > 0 && !DATA.isWeekendDay(dayNow) &&
          sim.auroraLoc === 'manor' && sim.auroraWorkedDay !== dayNow) {
        sim.auroraWorkedDay = dayNow
        changes.push({ target: 'aurora', npcFlags: { aurora_worked_manor_day: dayNow } })
      }
      const kStart = Math.floor(fromMin / 1440) + 1
      const kEnd = Math.floor(toMin / 1440)
      for (let k = kStart; k <= kEnd; k++) {
        settleInnNight(sim, k, changes)
        settleGulanNight(sim, k, changes)
        settleIsnaNight(sim, k, changes)
        settleNiseNight(sim, k, changes)
        settleAuroraNight(sim, k, kStart, changes)
        settleEileenNight(sim, k, changes)
        settleCeciliaNight(sim, k, changes)
        settleEdNight(sim, k, changes)
        settleOtherNights(sim, k, changes)
        settleTownNight(sim, k, changes)
      }
    }
    if (shouldClearRoomTarget(world, fromMin, toMin)) {
      changes.push({ target: 'world', worldFlags: { playerRoomTarget: null } })
    }
    return changes
  }

  root.OKH_APP_TIME = Object.freeze({ settleTimeEffects })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_TIME
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)

;
/**
 * @module okh_app_migrate
 * @updated 2026-11-18 21:08
 * @status  active
 * @reason  存档版本幂等迁移（升级至 schemaVersion=3）：补全 playerState.inventory、supply_shortage 及进行中剧情证物，并保护既有 custom:true 外部条目
 * @deps    OKH_APP_DATA
 * @provides { LEGACY_KEYS, migrateWorld }
 */
(function (root) {
  'use strict'

  const DATA = root.OKH_APP_DATA
  if (!DATA) throw Error('migrate 缺少 OKH_APP_DATA')

  const LEGACY_KEYS = [
    'pride', 'duty', 'lust', 'fear', 'shame', 'need',
    'curiosity', 'loyalty', 'corruption', 'sanity', 'exposure', 'isolation'
  ]

  function normalizeActivityOnMigrate(npc, timeMin, reportList) {
    if (!npc.activity) {
      npc.activity = null
      return
    }
    if (npc.activity.startedAt > timeMin) npc.activity.startedAt = timeMin
    const prevRule = npc.activity.releaseRule
    if (prevRule !== undefined && prevRule !== 'manualRelease') {
      if (npc.activity.kind === 'important' || npc.activity.kind === 'special') {
        npc.activity.migratedFromReleaseRule = prevRule
        npc.activity.releaseRule = 'manualRelease'
        reportList.push({
          npcId: npc.id,
          activityId: npc.activity.id,
          label: npc.activity.label || npc.activity.kind,
          fromReleaseRule: prevRule,
          toReleaseRule: 'manualRelease'
        })
      } else {
        delete npc.activity.releaseRule
      }
    }
  }

  function migrateNpcFromRoster(existing, tpl, inferredArrived, timeMin, reportList, worldFlags) {
    if (!existing) {
      const fresh = JSON.parse(JSON.stringify(tpl))
      if (inferredArrived) {
        if (fresh.location === 'wilds' && tpl.homeLocation) fresh.location = tpl.homeLocation
        if (tpl.id === 'ed') fresh.monitored = true
      }
      return fresh
    }

    const next = JSON.parse(JSON.stringify(existing))
    next.hasStage = tpl.hasStage
    next.hasAffection = tpl.hasAffection
    next.homeLocation = tpl.homeLocation
    next.plan = tpl.plan.slice()
    next.nodePlan = tpl.hasStage ? tpl.nodePlan.slice() : []
    next._metricBounds = { ...tpl._metricBounds }
    next.flags ||= {}
    next.nodeStates ||= {}
    next.activityHistory ||= {}
    if (tpl.id === 'eileen' && !worldFlags?.eileen_arrived && !next.flags.eileen_fugitive && !next.flags.eileen_captured) {
      next.monitored = false
    }
    if (!Object.hasOwn(DATA.LOCATIONS, next.location)) next.location = tpl.location

    const cleanValues = {}
    for (const [k, defVal] of Object.entries(tpl.values)) {
      const oldVal = next.values?.[k]
      cleanValues[k] = Number.isFinite(oldVal) ? oldVal : defVal
    }
    for (const k of LEGACY_KEYS) {
      if (!Object.hasOwn(tpl.values, k)) delete cleanValues[k]
    }
    next.values = cleanValues
    if (tpl.id === 'aurora' && cleanValues.debt_pressure === 0 &&
        !next.flags.aurora_evt3_done && !next.flags.aurora_debt_cleared) {
      cleanValues.debt_pressure = tpl.values.debt_pressure
    }
    if (tpl.id === 'cecilia' && cleanValues.orphanage_funds === 0 &&
        existing.flags?.lastNightSettledDay === undefined &&
        !next.flags.cecilia_evt1_done && !next.flags.cecilia_midgame_crisis && (next.stage ?? 0) === 0) {
      cleanValues.orphanage_funds = tpl.values.orphanage_funds
    }
    next._baseline = { ...cleanValues }

    if (tpl.hasStage === false) {
      delete next.stage
    } else {
      next.stage ??= 0
      if (tpl.id === 'gulan') {
        for (const idx of [1, 2, 3]) {
          if (next.nodeStates['stage_' + idx] && !next.nodeStates['gulan_stage_' + idx]) {
            next.nodeStates['gulan_stage_' + idx] = next.nodeStates['stage_' + idx]
            delete next.nodeStates['stage_' + idx]
          }
        }
      }
    }

    if (tpl.hasAffection !== false && tpl.hasStage !== false && (next.stage ?? 0) >= 3) {
      if (Object.hasOwn(next.values, 'affection')) {
        next.values.affection = Math.min(next.values.affection, 50)
      }
      next.flags.affection_locked = true
    }

    normalizeActivityOnMigrate(next, timeMin, reportList)
    delete next._lines
    return next
  }

  function migratePendingQueueToEventStates(world) {
    world.bg.eventStates ||= {}
    for (const entry of world.bg.queue || []) {
      if (
        entry &&
        entry.kind === 'event' &&
        entry.mode === 'interaction' &&
        (entry.status === 'pending' || entry.status === 'delivered') &&
        entry.id &&
        !Object.hasOwn(world.bg.eventStates, entry.id)
      ) {
        world.bg.eventStates[entry.id] = {
          status: 'pending',
          definitionId: entry.definitionId,
          npcId: entry.npcId ?? null,
          triggeredAt: entry.at ?? world.timeMin
        }
      }
    }
  }

  function migrateWorld(rawWorld) {
    if (!rawWorld) return rawWorld
    if ((rawWorld.schemaVersion ?? 1) >= DATA.SCHEMA_VERSION) return rawWorld

    const world = JSON.parse(JSON.stringify(rawWorld))
    const timeMin = Number.isSafeInteger(world.timeMin) ? world.timeMin : 0
    const inferredArrived =
      world.schemaVersion === undefined &&
      (world.playerLocation === 'inn' || Object.values(world.npcs || {}).some(n => n.location === 'inn'))

    world.flags ||= {}
    if (world.flags.arrived_oakhaven === undefined) world.flags.arrived_oakhaven = inferredArrived
    if (world.flags.arrivedDay === undefined) {
      world.flags.arrivedDay = world.flags.arrived_oakhaven ? 1 : null
    }
    if (world.flags.ed_joined === undefined) world.flags.ed_joined = inferredArrived
    if (world.flags.playerRoomTarget === undefined) world.flags.playerRoomTarget = null
    for (const flagKey of [
      'inn_arrears', 'supply_shortage', 'orc_camp_bounty_paid', 'lancaster_purge_reward_paid',
      'eileen_arrived', 'eileen_departed', 'eileen_fugitive', 'eileen_signal_fired', 'baron_purged', 'player_barony_granted'
    ]) {
      if (world.flags[flagKey] === undefined) world.flags[flagKey] = false
    }
    if (world.flags.lastInnSettledDay === undefined) world.flags.lastInnSettledDay = 0
    if (world.flags.playerOddJobDay === undefined) world.flags.playerOddJobDay = null
    if (world.flags.lastGuildCommissionDay === undefined) world.flags.lastGuildCommissionDay = null
    if (world.flags.lastChurchErrandDay === undefined) world.flags.lastChurchErrandDay = null
    world.playerState ||= {}
    if (!Number.isSafeInteger(world.playerState.gold) || world.playerState.gold < 0) {
      world.playerState.gold = world.flags.player_barony_granted ? 1000 : 40
    }
    delete world.playerState.injury
    if (!Array.isArray(world.playerState.inventory)) {
      // 老存档未建背包时，前传荒原途中补开局 10 份补给，已抵镇存档置空数组避免凭空生出补给
      world.playerState.inventory = world.flags.arrived_oakhaven ? [] : [{ id: 'supply', count: 10 }]
    }
    const ensureQuestItem = (itemId) => {
      if (!world.playerState.inventory.some(it => it && it.id === itemId)) {
        world.playerState.inventory.push({ id: itemId, count: 1 })
      }
    }
    if (world.flags.alice_evidence_secured && !world.flags.alice_rescued) {
      ensureQuestItem('alice_ledger')
    }
    if (world.npcs?.aurora?.flags?.aurora_eileen_intel_given && !world.flags.eileen_signal_fired && !world.flags.baron_purged) {
      ensureQuestItem('manor_intel_note')
    }
    if (world.flags.player_barony_granted) {
      ensureQuestItem('barony_patent')
    }
    if (!Object.hasOwn(DATA.LOCATIONS, world.playerLocation)) {
      world.playerLocation = inferredArrived ? 'inn' : 'wilds'
    }

    world.bg ||= { version: 2, revision: 0, receipts: {}, settled: {}, fired: {}, queue: [], generations: {} }
    migratePendingQueueToEventStates(world)

    const manualReleaseActivities = []
    const nextNpcs = {}
    for (const tpl of DATA.ROSTER) {
      nextNpcs[tpl.id] = migrateNpcFromRoster(world.npcs?.[tpl.id], tpl, inferredArrived, timeMin, manualReleaseActivities, world.flags)
    }
    world.npcs = nextNpcs
    world.bg.migrationReport = {
      fromSchemaVersion: rawWorld.schemaVersion ?? 1,
      toSchemaVersion: DATA.SCHEMA_VERSION,
      manualReleaseActivities
    }
    world.interactingIds = (world.interactingIds || []).filter(id => Object.hasOwn(nextNpcs, id))
    world.schemaVersion = DATA.SCHEMA_VERSION
    return world
  }

  root.OKH_APP_MIGRATE = Object.freeze({ LEGACY_KEYS, migrateWorld })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_MIGRATE
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)

;
/**
 * @module okh_app_config
 * @updated 2026-11-18 21:08
 * @status  active
 * @reason  薄运行时配置装配器：透传 itemCatalog 已注册物品白名单供内核原子结算与前端渲染共源读取
 * @deps    OKH_APP_DATA, OKH_APP_RULES, OKH_APP_TIME, OKH_APP_MIGRATE
 * @provides { SCHEMA_VERSION, DAY, WEEKDAYS, weekdayOf, isWeekendDay, weekdayLabel, PHASES, LOCATIONS, TOWN_LOCATIONS, STAGES, AFFECTION_TIERS, ITEM_CATALOG, getAffectionTier, isFugitiveSyncedNpc, syncWorld, isMetricLocked, onStageChange, canMove, ACTIONS, NODES, EVENTS, ROSTER, buildConfig, buildInitialWorld, migrateWorld, settleTimeEffects, applyPrologueSteps, resolveRoom, resolveBonds, resolveEconomy }
 */
(function (root) {
  'use strict'

  const DATA = root.OKH_APP_DATA
  const RULES = root.OKH_APP_RULES
  const TIME = root.OKH_APP_TIME
  const MIG = root.OKH_APP_MIGRATE
  if (!DATA || !RULES || !TIME || !MIG) throw Error('config 缺少子模块依赖')

  function buildConfig() {
    const metricBounds = Object.fromEntries(DATA.ROSTER.map(n => [n.id, { ...n._metricBounds }]))
    return {
      schemaVersion: DATA.SCHEMA_VERSION,
      policy: { ordinaryGraceMin: 120 },
      phases: DATA.PHASES,
      maxSteps: 128,
      actions: DATA.ACTIONS,
      events: DATA.EVENTS,
      nodes: DATA.NODES,
      itemCatalog: DATA.ITEM_CATALOG,
      metricBounds,
      releaseRules: { manualRelease: () => false },
      canMove: RULES.canMove,
      syncWorld: RULES.syncWorld,
      isMetricLocked: RULES.isMetricLocked,
      onStageChange: RULES.onStageChange,
      applyPrologueSteps: RULES.applyPrologueSteps,
      resolveRoom: RULES.resolveRoom,
      resolveBonds: RULES.resolveBonds,
      resolveEconomy: RULES.resolveEconomy,
      timeEffects: TIME.settleTimeEffects,
      prepareCheckpoint: MIG.migrateWorld,
      allowed(ctx, item) {
        if (!item?.effects?.move) return true
        return RULES.canMove(ctx.world, item.effects.move, ctx.npc)
      }
    }
  }

  root.OKH_APP_CONFIG = Object.freeze({
    SCHEMA_VERSION: DATA.SCHEMA_VERSION,
    DAY: DATA.DAY,
    WEEKDAYS: DATA.WEEKDAYS,
    weekdayOf: DATA.weekdayOf,
    isWeekendDay: DATA.isWeekendDay,
    weekdayLabel: DATA.weekdayLabel,
    PHASES: DATA.PHASES,
    LOCATIONS: DATA.LOCATIONS,
    TOWN_LOCATIONS: DATA.TOWN_LOCATIONS,
    STAGES: DATA.STAGES,
    AFFECTION_TIERS: DATA.AFFECTION_TIERS,
    ITEM_CATALOG: DATA.ITEM_CATALOG,
    getAffectionTier: RULES.getAffectionTier,
    isFugitiveSyncedNpc: RULES.isFugitiveSyncedNpc,
    syncWorld: RULES.syncWorld,
    isMetricLocked: RULES.isMetricLocked,
    onStageChange: RULES.onStageChange,
    canMove: RULES.canMove,
    ACTIONS: DATA.ACTIONS,
    NODES: DATA.NODES,
    EVENTS: DATA.EVENTS,
    ROSTER: DATA.ROSTER,
    buildConfig,
    buildInitialWorld: DATA.buildInitialWorld,
    migrateWorld: MIG.migrateWorld,
    settleTimeEffects: TIME.settleTimeEffects,
    applyPrologueSteps: RULES.applyPrologueSteps,
    resolveRoom: RULES.resolveRoom,
    resolveBonds: RULES.resolveBonds,
    resolveEconomy: RULES.resolveEconomy
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_CONFIG
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)

;
/**
 * @module okh_app_world
 * @updated 2026-11-18 15:24
 * @status  active
 * @reason  按聊天隔离的单一存档、显式持久化、检查点滑动窗口裁剪（防长对话存档体积线性膨胀）与增量迁移
 */
(function (root) {
  'use strict';
  const u = root.OKHBackgroundModules?.utils;
  const CFG = root.OKH_APP_CONFIG;
  if (!u || !CFG) throw Error('world 缺少 utils/config');
  const KEY = 'okh_gpt.state.v1';
  // 24 = 默认回滚窗口上限：覆盖常规滑屏/删楼重放需求，同时把单聊天存档体积压在约 0.6MB 内
  const DEFAULT_MAX_HISTORY = 24;
  let settings = {}, localLock = Promise.resolve();
  const memory = new Map();

  function historyLimit() {
    const custom = settings.maxHistory;
    return Number.isSafeInteger(custom) && custom >= 1 ? custom : DEFAULT_MAX_HISTORY;
  }
  function pruneHistory(history) {
    const limit = historyLimit();
    return history.length > limit ? history.slice(history.length - limit) : history;
  }

  function configure(options = {}) {
    if (options.maxHistory !== undefined) {
      u.check(Number.isSafeInteger(options.maxHistory) && options.maxHistory >= 1,
        'maxHistory 必须为正整数');
    }
    settings = { ...settings, ...options };
  }
  function context() {
    if (settings.getContext) return settings.getContext();
    if (root.SillyTavern?.getContext) return root.SillyTavern.getContext();
    try { if (root.parent?.SillyTavern?.getContext) return root.parent.SillyTavern.getContext(); } catch (_) {}
    return null;
  }
  function chatId() {
    const c = context();
    const value = settings.getChatId ? settings.getChatId() :
      settings.chatId ?? (typeof root.getCurrentChatId === 'function' ? root.getCurrentChatId() : c?.chatId);
    u.check(typeof value === 'string' && value.trim(), '无法确定当前聊天 ID，请配置 getChatId()');
    return value;
  }
  function backend() {
    if (settings.storage) {
      u.check(typeof settings.storage.get === 'function' && typeof settings.storage.set === 'function', '自定义存储需要 get/set');
      return { mode: 'custom', ...settings.storage };
    }
    if (settings.mode === 'memory') {
      u.check(settings.development === true, '内存模式只能显式用于开发测试');
      return { mode: 'memory', get: k => memory.get(k), set: (k, v) => { memory.set(k, v); } };
    }
    if (typeof root.getVariables === 'function' && typeof root.replaceVariables === 'function') {
      return {
        mode: 'helper-chat',
        get: key => root.getVariables({ type: 'chat' })?.[key],
        set: (key, value) => {
          const vars = root.getVariables({ type: 'chat' });
          u.check(vars && typeof vars === 'object' && !vars.then, '聊天变量接口必须支持同步读取');
          return root.replaceVariables({ ...vars, [key]: value }, { type: 'chat' });
        }
      };
    }
    if (typeof root.getvar === 'function' && typeof root.setvar === 'function') {
      return { mode: 'getvar', get: k => root.getvar(k), set: (k, v) => root.setvar(k, v) };
    }
    throw Error('没有可用的持久存储接口；请配置 storage.get/set，正式环境不退回内存');
  }
  function session() {
    const id = chatId(), driver = backend();
    return { id, driver, key: KEY + ':' + encodeURIComponent(id) };
  }
  function assertSession(s) { u.check(chatId() === s.id, '聊天已切换，拒绝旧聊天操作'); }
  function rawGet(s, key) {
    assertSession(s);
    const value = s.driver.get(key);
    u.check(!value?.then, '存储读取必须同步；请适配 storage.get');
    return value;
  }
  function parse(raw, label) {
    if (raw === undefined || raw === null) return null;
    try { return typeof raw === 'string' ? JSON.parse(raw) : u.clone(raw); }
    catch (_) { throw Error(label + '损坏；拒绝覆盖，请先备份恢复'); }
  }

  function migrateEnvelope(data) {
    let migrated = false;
    if ((data.world.schemaVersion ?? 1) < CFG.SCHEMA_VERSION) {
      data.world = CFG.migrateWorld(data.world);
      migrated = true;
    }
    for (const record of data.history || []) {
      if (record?.before && (record.before.schemaVersion ?? 1) < CFG.SCHEMA_VERSION) {
        record.before = CFG.migrateWorld(record.before);
        migrated = true;
      }
    }
    return migrated;
  }

  function readEnvelope(s = session()) {
    const data = parse(rawGet(s, s.key), '存档');
    if (!data) return null;
    u.check(data.version === 1 && data.chatId === s.id && data.world?.bg?.version === 2 &&
      Array.isArray(data.history), '存档版本或聊天归属不匹配，需要显式迁移');
    migrateEnvelope(data);
    u.validateWorld(data.world);
    return data;
  }

  async function lock(s, task) {
    const run = async () => {
      assertSession(s);
      if (root.navigator?.locks?.request) return root.navigator.locks.request('okh:' + s.id, task);
      return task();
    };
    const result = localLock.then(run);
    localLock = result.catch(() => {});
    return result;
  }
  async function writeEnvelope(s, envelope) {
    assertSession(s);
    const text = JSON.stringify(envelope);
    const written = await s.driver.set(s.key, text);
    u.check(written !== false, '存储接口报告写入失败');
    assertSession(s);
    const back = rawGet(s, s.key);
    u.check(typeof back === 'string' ? back === text : u.signature(back) === u.signature(envelope),
      '存档写入回读不一致，提交未获确认');
    return true;
  }
  function loadWorld(s = session()) { return readEnvelope(s)?.world ?? null; }
  async function ensureWorld(force = false, s = session()) {
    return lock(s, async () => {
      const existing = readEnvelope(s);
      if (!force && existing) return existing.world;
      if (!force && rawGet(s, 'okh_gpt.world') != null) {
        throw Error('发现旧版存档，请先备份并调用 OKH_APP.importLegacy()，不会自动覆盖');
      }
      const world = root.OKHBackground.init(CFG.buildInitialWorld(), CFG.buildConfig());
      await writeEnvelope(s, { version: 1, chatId: s.id, world, history: [] });
      return world;
    });
  }
  async function migrateSchema(s = session()) {
    return lock(s, async () => {
      const raw = parse(rawGet(s, s.key), '存档');
      if (!raw) return { migrated: false, schemaVersion: CFG.SCHEMA_VERSION, world: null };
      u.check(raw.version === 1 && raw.chatId === s.id && raw.world?.bg?.version === 2 &&
        Array.isArray(raw.history), '存档版本或聊天归属不匹配，需要显式迁移');
      const trimmed = pruneHistory(raw.history);
      const historyPruned = trimmed.length !== raw.history.length;
      if (historyPruned) raw.history = trimmed;
      const changed = migrateEnvelope(raw) || historyPruned;
      u.validateWorld(raw.world);
      if (changed) await writeEnvelope(s, raw);
      return {
        migrated: changed,
        schemaVersion: CFG.SCHEMA_VERSION,
        manualReleaseActivities: raw.world.bg?.migrationReport?.manualReleaseActivities || [],
        world: raw.world
      };
    });
  }
  async function commit(s, { expectedRevision, state, checkpoint, reason, receipt }) {
    return lock(s, async () => {
      const envelope = readEnvelope(s);
      u.check(envelope && envelope.world.bg.revision === expectedRevision, '存档提交版本冲突');
      u.validateWorld(state);
      if (reason === 'restore-checkpoint') {
        envelope.history = envelope.history.filter(h => u.own(state.bg.receipts, h.id));
      } else if (checkpoint) {
        u.check(receipt && u.id(receipt.id), '保存检查点需要对应回复');
        envelope.history.push({ id: receipt.id, revision: receipt.revision,
          chatIndex: receipt.chatIndex ?? null, before: u.clone(checkpoint) });
      }
      envelope.history = pruneHistory(envelope.history);
      envelope.world = state;
      return writeEnvelope(s, envelope);
    });
  }
  async function importLegacy(s = session()) {
    return lock(s, async () => {
      u.check(!readEnvelope(s), '目标聊天已有新版存档，禁止覆盖导入');
      let old = parse(rawGet(s, 'okh_gpt.world'), '旧版存档');
      u.check(old?.bg?.version === 2, '没有可导入的旧版 v2 world');
      if ((old.schemaVersion ?? 1) < CFG.SCHEMA_VERSION) old = CFG.migrateWorld(old);
      u.validateWorld(old);
      old.bg.generations ||= {};
      await writeEnvelope(s, { version: 1, chatId: s.id, world: old, history: [] });
      return old;
    });
  }
  async function publishDerived(s, values, revision) {
    assertSession(s);
    u.check(loadWorld(s)?.bg.revision === revision, '派生信息已过期，拒绝发布');
    for (const [key, value] of Object.entries(values)) {
      const ok = await s.driver.set(key, value);
      u.check(ok !== false, '派生缓存写入失败：' + key);
      assertSession(s);
      u.check(rawGet(s, key) === value, '派生缓存回读失败：' + key);
    }
  }
  const store = Object.freeze({
    get mode() { return backend().mode; },
    get: key => rawGet(session(), key)
  });
  root.OKH_APP_WORLD = Object.freeze({ configure, context, chatId, session, assertSession,
    loadWorld, ensureWorld, readEnvelope, migrateSchema, commit, importLegacy, publishDerived, store,
    resetWorld: () => ensureWorld(true), STORAGE_KEY: KEY, DEFAULT_MAX_HISTORY });
})(globalThis);

;
/**
 * @module okh_app_adapter
 * @updated 2026-11-19 15:20
 * @status  active
 * @reason  纯控制器桥接、台账字符串（对齐主人指示：古兰外出营救被俘期间台账仅提示暂离或留信嘱咐切勿贸然前往，零剧透据点与被俘状态；古兰脱险后恢复正常）与监听快照视图
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
      '【第 ' + day + ' 天 · ' + CFG.weekdayLabel(day) + ' · ' + label + ' · ' + clock + '】',
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
    const gold = Number.isSafeInteger(world.playerState?.gold) ? world.playerState.gold : 40;
    const goldNote = world.flags?.inn_arrears
      ? '（旅店宿费欠账中：攒够 5 金自动结清；欠账期间暂不可在旅店执行实物赠礼/请酒）'
      : (world.flags?.inn_free_pass_today ? '（今晚旅店宿费已由爱德帮工抵免，免扣 5 金）' : '');
    lines.push('持有金币：' + gold + ' 金' + goldNote);
    const catalog = CFG.ITEM_CATALOG || {};
    const inv = Array.isArray(world.playerState?.inventory) ? world.playerState.inventory : [];
    const supplyEntry = inv.find(it => it && it.id === 'supply' && it.custom !== true);
    const supplyCount = Number.isSafeInteger(supplyEntry?.count) ? supplyEntry.count : 0;
    const otherItems = inv.filter(it => it && !(it.id === 'supply' && it.custom !== true)).map(it => {
      const meta = it.custom === true ? it : catalog[it.id];
      const itemName = meta?.name || it.name || it.id;
      return it.count > 1 ? (itemName + ' ×' + it.count) : itemName;
    });
    const shortageNote = world.flags?.supply_shortage
      ? '（补给不足：非旅店过夜按在场人数每人每晚耗 1 份，可在镇上或旅店按 1 金/份补充）'
      : '';
    lines.push('随身行囊：补给 ×' + supplyCount + shortageNote +
      (otherItems.length ? '｜其余物件：' + otherItems.join('、') : ''));
    const ed = world.npcs?.ed;
    if (ed && ed.monitored === true && ed.alive !== false) {
      const teachCount = ed.flags?.ed_teach_count ?? 0;
      if (teachCount > 0 || ed.flags?.ed_stealth_ready) {
        lines.push('爱德求生常识：已指导 ' + teachCount + ' 次' +
          (ed.flags?.ed_stealth_ready ? '（已解锁潜行放哨与掩护门槛）' : '（累计 3 次解锁潜行放哨）'));
      }
      if (ed.flags?.ed_intel_day === day) {
        const intelPool = [
          '粮行黑麦今早涨了半成，东街卫兵哨卡午后换防较松，城外短工雇主多在上午十点公会放榜前聚在门廊。',
          '南市铁匠铺新到一批精铁矿料，集市客商正急招护送脚夫，断剑与麦酒后厨晚间收鲜肉。',
          '圣辉大教堂清晨弥撒后有商贾布施，西街药铺最近草药紧俏，午后商业街客流相对稀疏。',
          '领主山庄巡逻队在工作日午后加紧盘查，周末镇上集市摊位最多，旅店地窖清晨常需短工帮手。'
        ];
        lines.push('爱德今日市井情报：' + intelPool[day % intelPool.length]);
      }
      if (ed.flags?.ed_asked_sister_day === day) {
        const sisterNote = world.flags?.alice_rescued
          ? '姐姐爱丽丝已重掌银月珠宝铺并驱逐席德，爱德立志留队继续历练。'
          : world.flags?.alice_truth_revealed
            ? '已查明席德借假借据并以爱德安危相胁，并握有爱丽丝暗中递出的账目破绽，待择机堂前对质。'
            : world.flags?.ed_watch_store_done
              ? '已隔街望见爱丽丝在银月珠宝铺柜台算账，神色疲惫，尚待进店近身探知真相。'
              : '已知表舅席德借假借据霸占银月珠宝铺并将爱德逐出街头，姐姐爱丽丝仍在店内受其看管。';
        lines.push('爱丽丝线索摘要：' + sisterNote);
      }
    }
    if (world.flags?.arrived_oakhaven && !world.flags?.eileen_fugitive) {
      const lastGuild = world.flags?.lastGuildCommissionDay;
      const guildWait = Number.isFinite(lastGuild) ? Math.max(0, 3 - (day - lastGuild)) : 0;
      lines.push('公会委托：' + (guildWait > 0 ? '冷却中（还剩 ' + guildWait + ' 天）' : '可接单（guild_normal / guild_high）'));
      const cec = world.npcs?.cecilia;
      if (cec && cec.alive !== false && (cec.stage ?? 0) < 3) {
        const lastChurch = world.flags?.lastChurchErrandDay;
        const churchWait = Number.isFinite(lastChurch) ? Math.max(0, 2 - (day - lastChurch)) : 0;
        lines.push('修道院委托：' + (churchWait > 0 ? '冷却中（还剩 ' + churchWait + ' 天）' : '可接取（church_paid / church_volunteer）'));
      }
    }
    if (world.flags?.ed_final_good) {
      lines.push('【终局·真血自立】恶龙艾德现身，古兰觉醒超凡真血以命立誓正面逼退恶龙，保全自我意志守护小队。');
    } else if (world.flags?.ed_final_abduction) {
      lines.push('【终局·以命相挟】恶龙艾德现身，古兰以死要挟换取小队众人生路，被迫随龙王回巢繁衍。');
    } else if (world.flags?.ed_final_dark) {
      lines.push('【终局·始祖同化】古兰真血封顶并沉沦于始祖本能，化作金红龙瞳跟随生父回归龙巢。');
    } else if (world.flags?.grand_tier_3) {
      lines.push('【大势·剪枝封笼】峡谷官道发生百吨巨石塌方阻断外界，全城推行严酷宵禁，城镇已化为封闭孤岛。');
    } else if (world.flags?.grand_tier_2) {
      lines.push('【大势·惊兽乱局】城外野兽受惊向外溃逃，荒原兽人要塞严加戒备，流民涌入大教堂避难。');
    }
    const eileen = world.npcs?.eileen;
    if (eileen?.flags?.eileen_returned_capital) {
      lines.push('艾琳动向：已随兰开斯特狮鹫骑士团启程返回王都（离队）。');
    } else if (world.flags?.baron_purged) {
      lines.push('局势状态：雷蒙德男爵已遭狮鹫骑士团清算伏诛' +
        (world.flags?.player_barony_granted ? '（已定婚约并受封奥克赫斯领地爵位）' : '') + '。');
    } else if (world.flags?.eileen_signal_fired) {
      lines.push('艾琳动向：已激发原装王室魔能讯号管传讯，兰开斯特家族狮鹫骑士团将于明日空降奥克赫斯。');
    } else if (world.flags?.eileen_fugitive) {
      const disguise = eileen?.flags?.eileen_disguised === false
        ? '未披乔装（高危暴露状态）'
        : '默认兜帽斗篷乔装遮面、收敛王徽与细剑';
      lines.push('艾琳动向：通缉流亡反攻期，全程与你位置同步同行（当前' + disguise + '；反攻值：' + (eileen?.values?.counterattack ?? 0) + '/100，满 100 解锁潜回领主馆夺管事件；入镇与赴旅店时维持低调伪装，切忌在山庄公开露面）。');
    } else if (world.flags?.eileen_arrived && !world.flags?.eileen_departed) {
      lines.push('艾琳动向：在领主山庄巡查核账（期间高傲不与见习冒险者接触）。');
    }
    const aurora = world.npcs?.aurora;
    if (aurora && aurora.alive !== false && aurora.monitored !== false) {
      if (aurora.flags?.aurora_debt_disclosed && !aurora.flags?.aurora_purged_with_baron && (aurora.values?.debt_pressure ?? 0) > 0) {
        lines.push('奥萝拉已知旧债：' + aurora.values.debt_pressure + ' 点（折合 ' + (aurora.values.debt_pressure * 10) + ' 金）');
      }
      if (aurora.flags?.aurora_purged_with_baron) {
        lines.push('奥萝拉动向：男爵倒台清算时作为其山庄情妇一并被骑士团带走处置（离队）。');
      } else if (aurora.stage >= 3 && aurora.flags?.manor_service_active) {
        lines.push('奥萝拉动向：已长留领主山庄成为男爵情妇，周末不再返店。');
      } else if (aurora.flags?.manor_service_active && !aurora.flags?.aurora_left_manor) {
        const auroraBits = [
          CFG.isWeekendDay(day)
            ? '当前周末休假在镇内归队（可于旅店/教堂碰面）'
            : '当前工作日驻守领主山庄（周六、周日返回旅店）'
        ];
        if (aurora.flags?.aurora_lord_punished) auroraBits.push('已遭男爵迁怒责罚（山庄事态提前3个工作日）');
        if (world.flags?.eileen_fugitive && !world.flags?.baron_purged &&
            (aurora.values?.affection ?? 0) >= 80 && !aurora.flags?.aurora_eileen_intel_given) {
          auroraBits.push('暗藏山庄换防与暗锁情报待私下交接（与她同地碰头可推进反攻）');
        }
        lines.push('奥萝拉动向：在领主山庄任职抵债（' + auroraBits.join('；') + '）。');
      }
    }
    if (world.flags?.bloody_arena) {
      const curDay = day;
      const arenaDay = Number.isFinite(world.flags?.bloodyArenaDay) ? world.flags.bloodyArenaDay : 1;
      const daysPassed = curDay - arenaDay;
      const active = (world.flags?.martial_law || world.flags?.panic) || (daysPassed >= 0 && daysPassed < 7);
      if (active && daysPassed < 7) {
        const remaining = Math.max(1, 7 - daysPassed);
        lines.push('【城镇态势·演武场血案余波】演武场发生十余人暴毙血案（凶手未知）：当前全城处于［安保戒严］与［人心惶惶］状态（还剩 ' + remaining + ' 天）。');
      } else {
        lines.push('【城镇态势】演武场血案（凶手未知）已过去逾一周，戒严解除，市井议论逐渐平息。');
      }
    }
    const novelties = world.npcs?.nise?.flags?.seenNovelties;
    if (Array.isArray(novelties) && novelties.length) {
      const total = world.npcs.nise.flags.totalNovelties ?? novelties.length;
      lines.push('妮丝新奇见闻清单（共 ' + total + ' 项，勿重复记入已见旧物）：' + novelties.slice(-8).join('、'));
    }
    const nise = world.npcs?.nise;
    if (nise && (nise.stage ?? 0) < 3 && !nise.flags?.casino_debt_frozen && !nise.flags?.nise_fled_casino &&
        (nise.flags?.nise_debt_known || (nise.stage ?? 0) >= 1) && (nise.values?.gamble_debt ?? 0) > 0) {
      lines.push('妮丝已查明赌债：' + nise.values.gamble_debt + ' 点（折合 ' + (nise.values.gamble_debt * 10) + ' 金）');
    }
    const isna = world.npcs?.isna;
    if (isna && isna.alive !== false && isna.monitored !== false) {
      if (isna.flags?.isna_help_real && (isna.flags?.isna_camp_distress || isna.flags?.captured_orc) &&
          !isna.flags?.isna_fallen_orc && !isna.flags?.isna_captured_ed) {
        lines.push('伊丝娜动向：已收到她在黑兽人前哨据点（wilds_camp）遇险的求救信号，须尽快携古兰营救。');
      } else if (isna.flags?.captured_orc && !isna.flags?.isna_fallen_orc && !isna.flags?.isna_help_real) {
        lines.push('伊丝娜动向：独自外出后暂未归队，下落未明。');
      }
    }
    const gulan = world.npcs?.gulan;
    if (gulan && gulan.alive !== false && gulan.monitored !== false) {
      if (gulan.flags?.captured_orc && !world.flags?.orc_camp_destroyed) {
        if (world.flags?.gulan_note_delivered) {
          lines.push('古兰动向：留信外出营救同伴未归，特意嘱咐切勿贸然前往。');
        } else {
          lines.push('古兰动向：外出暂离，行踪未明。');
        }
      }
    }
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

;
/**
 * @module okh_app_parse
 * @updated 2026-11-18 21:08
 * @status  active
 * @reason  只解析唯一闭合状态栏；扩展 <economy op="buy_supply" count="N" /> 补给采买解析并保持数值防作弊校验
 * @deps    OKHBackgroundModules.utils
 * @provides { statusBody, grabTags, parseAttrs, parseDayClock, parseActivity, parseInteract, parseMove, parseStatusBar, buildFront, compareEnd }
 */
(function (root) {
  'use strict';
  const u = root.OKHBackgroundModules?.utils;
  if (!u) throw Error('parse 缺少 utils');

  const PROLOGUE_FLAGS = new Set(['ed_joined', 'arrived_oakhaven']);

  function statusBody(text) {
    const outside = String(text || '').replace(/```[\s\S]*?```/g, '')
      .replace(/<content\b[^>]*>[\s\S]*?<\/content\s*>/gi, '');
    const matches = [...outside.matchAll(/<status_bar\b[^>]*>([\s\S]*?)<\/status_bar\s*>/gi)];
    const starts = (outside.match(/<status_bar\b/gi) || []).length;
    u.check(starts === matches.length, 'status_bar 未闭合');
    u.check(matches.length <= 1, '每轮只能有一个 status_bar');
    return matches[0]?.[1] ?? null;
  }

  function parseAttrs(raw) {
    const attrs = {};
    const remaining = raw.replace(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g, (_, name, a, b) => {
      u.check(u.id(name) && !u.own(attrs, name), '重复或非法标签属性：' + name);
      attrs[name] = a ?? b;
      return '';
    });
    u.check(!remaining.trim(), '标签属性必须使用引号');
    return attrs;
  }

  function rawTags(body) {
    const out = [], re = /<([a-z_][\w-]*)\b((?:"[^"]*"|'[^']*'|[^'"<>])*)\/\s*>/gi;
    let match;
    while ((match = re.exec(body || '')) !== null) {
      out.push({ name: match[1].toLowerCase(), attrs: parseAttrs(match[2]) });
    }
    return out;
  }

  function grabTags(text, tagName) {
    return rawTags(statusBody(text)).filter(t => t.name === tagName).map(t => t.attrs);
  }

  function parseDayClock(raw) {
    if (typeof raw !== 'string') return null;
    const match = /^(\d+)日\s*(\d{1,2}):(\d{2})$/.exec(raw.trim());
    if (!match) return null;
    const day = Number(match[1]), hour = Number(match[2]), min = Number(match[3]);
    if (day < 1 || hour >= 24 || min >= 60) return null;
    const value = (day - 1) * 1440 + hour * 60 + min;
    return u.minute(value) ? value : null;
  }

  function parseAtAttr(rawAt, fromMin, toMin) {
    if (rawAt === undefined) return undefined;
    if (rawAt === 'start' || rawAt === 'end') return rawAt;
    const value = parseDayClock(rawAt);
    u.check(value !== null && value >= fromMin && value <= toMin, '标签时间 at 非法或超出本轮区间：' + rawAt);
    return value;
  }

  function toMinute(spec, fallback, fromMin, toMin) {
    if (spec === undefined) return fallback;
    if (spec === 'start') return fromMin;
    if (spec === 'end') return toMin;
    return spec;
  }

  function parseStatusBar(text) {
    const body = statusBody(text), diagnostics = [];
    const times = rawTags(body).filter(t => t.name === 'time');
    u.check(times.length <= 1, '状态栏只能有一个 time');
    const time = times[0]?.attrs;
    let elapsed = null, endMin = null;
    if (time?.elapsed !== undefined) {
      const value = Number(time.elapsed);
      if (/^\d+$/.test(time.elapsed) && Number.isSafeInteger(value) && value <= 1440) elapsed = value;
      else diagnostics.push('elapsed 非法，按缺失时间处理；不截断小数');
    }
    if (time?.end) {
      endMin = parseDayClock(time.end);
      if (endMin === null) diagnostics.push('end 格式非法，不能校验落幕时间');
    }
    return { elapsed, end: time?.end || null, endMin, diagnostics, hasStatus: body !== null };
  }

  function inferEventNpcId(world, config, eventId, rawNpc) {
    if (rawNpc) return rawNpc;
    const def = (config.events || []).find(item => item.id === eventId);
    if (def?.scope === 'world') return null;
    if (def?.targets?.length === 1) return def.targets[0];
    const pendingQ = (world.bg?.queue || []).find(q => q.definitionId === eventId && q.status === 'pending');
    if (pendingQ) return pendingQ.npcId ?? null;
    return null;
  }

  function collectPrologueSteps(tags, world, now) {
    const steps = [];
    const seen = new Set();
    let arrivedAtMin = world.flags?.arrived_oakhaven ? -Infinity : Infinity;

    for (const { name, attrs } of tags) {
      if (name !== 'prologue_step') continue;
      u.check(PROLOGUE_FLAGS.has(attrs.flag), '未知前传里程碑：' + attrs.flag);
      const at = parseAtAttr(attrs.at, world.timeMin, now);
      if (attrs.flag === 'arrived_oakhaven') {
        arrivedAtMin = Math.min(arrivedAtMin, toMinute(at, now, world.timeMin, now));
      }
      if (!seen.has(attrs.flag)) {
        seen.add(attrs.flag);
        steps.push(at === undefined ? attrs.flag : { flag: attrs.flag, at });
      }
    }
    return { steps, arrivedAtMin };
  }

  function parseActivityTag(a, ctx) {
    const { world, known, patch, location, relocate, diagnostics, virtual, config, now, token } = ctx;
    if (!known(a.npc)) return;
    u.check(['start', 'finish', 'cancel'].includes(a.op), 'activity op 非法');
    const at = parseAtAttr(a.at, world.timeMin, now);
    if (!u.own(virtual, a.npc)) virtual[a.npc] = world.npcs[a.npc].activity;
    const cur = virtual[a.npc];
    let change;
    if (a.op === 'start') {
      const kind = a.kind || 'ordinary';
      u.check(['ordinary', 'important', 'special'].includes(kind) && a.label?.trim(), '活动必须有合法 kind 和 label');
      const same = cur && cur.kind === kind && cur.label.trim() === a.label.trim();
      const id = a.id || (same ? cur.id : 'act:' + a.npc + ':' + token + ':' + ctx.index++);
      u.check(u.id(id), '活动 ID 非法');
      change = { op: 'start', id, kind, label: a.label.trim(), source: 'narrative' };
      if (a.replace === 'true') change.replace = true;
      if (a.rule) {
        u.check(kind !== 'ordinary' && u.own(config.releaseRules || {}, a.rule), '活动解除规则未知或不适用');
        change.releaseRule = a.rule;
      } else if (same && cur.releaseRule) change.releaseRule = cur.releaseRule;
      if (kind !== 'ordinary') u.check(change.releaseRule, 'important/special 必须申报 rule');
      virtual[a.npc] = { ...change, startedAt: same ? cur.startedAt : toMinute(at, now, world.timeMin, now) };
    } else {
      if (!cur) { diagnostics.push('忽略无当前活动的 ' + a.op + '：' + a.npc); return; }
      change = { op: a.op, id: a.id || cur.id };
      virtual[a.npc] = null;
    }
    if (at !== undefined) change.at = at;
    (patch(a.npc).activities ||= []).push(change);

    if (a.to !== undefined) {
      const to = location(a.to);
      if (relocate(world.npcs[a.npc], to, a.npc, at)) {
        const npcPatch = patch(a.npc);
        if (npcPatch.location !== undefined || npcPatch.moves) {
          if (!npcPatch.moves) {
            npcPatch.moves = [{ to: npcPatch.location, ...(npcPatch.locationAt !== undefined ? { at: npcPatch.locationAt } : {}) }];
            delete npcPatch.location;
            delete npcPatch.locationAt;
          }
          npcPatch.moves.push({ to, ...(at !== undefined ? { at } : {}) });
        } else {
          npcPatch.location = to;
          if (at !== undefined) npcPatch.locationAt = at;
        }
      }
    }
  }

  function buildFront(text, now, world, options = {}) {
    const tags = rawTags(statusBody(text)), diagnostics = [], npcs = {}, virtual = {}, playerMoves = [];
    const front = { interactingIds: [] }, interacting = new Set();
    const token = options.token || String(now), config = options.config || {};
    const canMoveFn = typeof options.canMove === 'function' ? options.canMove : config.canMove;
    const { steps: prologueSteps, arrivedAtMin } = collectPrologueSteps(tags, world, now);
    if (prologueSteps.length) front.prologueSteps = prologueSteps;

    const known = id => u.own(world.npcs, id) ? true : (diagnostics.push('忽略未知角色：' + id), false);
    const patch = id => npcs[id] ||= {};
    const location = value => {
      u.check(u.id(value) && (!options.locations || u.own(options.locations, value)), '未知地点：' + value);
      return value;
    };
    let simPlayerLoc = world.playerLocation;
    const relocate = (npc, to, label, atSpec) => {
      if (!canMoveFn) return true;
      const moveMin = toMinute(atSpec, now, world.timeMin, now);
      const unlocked = arrivedAtMin <= moveMin;
      const nextFlags = unlocked && !world.flags?.arrived_oakhaven
        ? { ...(world.flags || {}), arrived_oakhaven: true }
        : world.flags;
      const simWorld = { ...world, playerLocation: simPlayerLoc, flags: nextFlags };
      if (canMoveFn(simWorld, to, npc)) return true;
      const prefix = !simWorld.flags?.arrived_oakhaven ? '前传未抵镇前阻止移动：' : '当前阶段禁止移动：';
      diagnostics.push(prefix + to + (label ? '（' + label + '）' : ''));
      return false;
    };

    const counts = { focus: 0, room: 0 };
    const actCtx = { world, known, patch, location, relocate, diagnostics, virtual, config, now, token, index: 0 };

    for (const { name, attrs: a } of tags) {
      if (name === 'move') {
        const to = location(a.to);
        const at = parseAtAttr(a.at, world.timeMin, now);
        if (a.npc) {
          if (known(a.npc) && relocate(world.npcs[a.npc], to, a.npc, at)) {
            const p = patch(a.npc);
            if (p.location !== undefined || p.moves) {
              if (!p.moves) {
                p.moves = [{ to: p.location, ...(p.locationAt !== undefined ? { at: p.locationAt } : {}) }];
                delete p.location;
                delete p.locationAt;
              }
              p.moves.push({ to, ...(at !== undefined ? { at } : {}) });
            } else {
              p.location = to;
              if (at !== undefined) p.locationAt = at;
            }
          }
        } else if (relocate(null, to, 'player', at)) {
          simPlayerLoc = to;
          playerMoves.push({ to, ...(at !== undefined ? { at } : {}) });
        }
      } else if (name === 'interact') {
        if (known(a.npc)) interacting.add(a.npc);
      } else if (name === 'focus') {
        u.check(++counts.focus === 1, '本轮只能申报一个 focus');
        if (known(a.npc)) front.focusNpcId = a.npc;
      } else if (name === 'room') {
        u.check(++counts.room === 1 && (a.state === 'together' || a.state === 'separate'), 'room 申报非法');
        if (a.state === 'together') u.check(a.npc && u.own(world.npcs, a.npc), 'room together 需要已知 npc');
        const at = parseAtAttr(a.at, world.timeMin, now);
        front.room = { npc: a.npc || null, state: a.state, ...(at !== undefined ? { at } : {}) };
      } else if (name === 'bond') {
        u.check(a.delta === undefined && a.value === undefined && a.add === undefined, 'bond 只能申报事实，禁止携带数值字段');
        u.check(u.id(a.kind) && typeof a.npc === 'string' && a.npc.trim(), 'bond 缺少合法 npc 或 kind');
        const at = parseAtAttr(a.at, world.timeMin, now);
        let item;
        if (a.item !== undefined) {
          item = typeof a.item === 'string' ? a.item.trim() : '';
          u.check(item.length > 0 && item.length <= 24, 'bond 的 item 必须为 1~24 字非空短词');
        }
        if (known(a.npc)) {
          (front.bonds ||= []).push({
            npc: a.npc,
            kind: a.kind,
            ...(item !== undefined ? { item } : {}),
            ...(at !== undefined ? { at } : {})
          });
        }
      } else if (name === 'event_resolve') {
        u.check(u.id(a.id) && u.id(a.outcome), 'event_resolve 缺少合法 id 或 outcome');
        if (a.npc && !known(a.npc)) continue;
        const at = parseAtAttr(a.at, world.timeMin, now);
        const npcId = inferEventNpcId(world, config, a.id, a.npc);
        (front.resolveEvents ||= []).push({ eventId: a.id, npcId, outcome: a.outcome, ...(at !== undefined ? { at } : {}) });
      } else if (name === 'economy') {
        u.check(
          a.amount === undefined && a.delta === undefined && a.value === undefined && a.add === undefined && a.gold === undefined,
          'economy 只能申报枚举事实，禁止携带数值金额字段'
        );
        u.check(['work', 'repay', 'donate', 'buy_supply'].includes(a.op), 'economy op 非法');
        const at = parseAtAttr(a.at, world.timeMin, now);
        let tier = a.tier;
        let count;
        if (a.op === 'work') {
          u.check(['odd', 'guild_normal', 'guild_high', 'church_paid', 'church_volunteer'].includes(tier), 'economy work tier 非法');
        } else if (a.op === 'repay') {
          u.check(['aurora', 'nise'].includes(a.npc), 'economy repay npc 非法');
          tier = tier || 'part';
          u.check(['part', 'all'].includes(tier), 'economy repay tier 非法');
        } else if (a.op === 'donate') {
          u.check(a.npc === 'cecilia', 'economy donate npc 非法');
          tier = tier || 'small';
          u.check(['small', 'large'].includes(tier), 'economy donate tier 非法');
        } else if (a.op === 'buy_supply') {
          const rawCount = a.count === undefined ? '1' : String(a.count).trim();
          const parsedCount = Number(rawCount);
          // 99 = 单次购入补给份数上限，防止误报或异常大额单笔刷单
          u.check(/^\d+$/.test(rawCount) && Number.isSafeInteger(parsedCount) && parsedCount >= 1 && parsedCount <= 99,
            'economy buy_supply count 必须为 1~99 的整数');
          count = parsedCount;
        }
        (front.economies ||= []).push({
          op: a.op,
          ...(tier !== undefined ? { tier } : {}),
          ...(count !== undefined ? { count } : {}),
          ...(a.npc ? { npc: a.npc } : {}),
          ...(at !== undefined ? { at } : {})
        });
      } else if (name === 'activity') {
        parseActivityTag(a, actCtx);
      }
    }

    if (playerMoves.length === 1) {
      front.playerLocation = playerMoves[0].to;
      if (playerMoves[0].at !== undefined) front.playerLocationAt = playerMoves[0].at;
    } else if (playerMoves.length > 1) {
      front.playerMoves = playerMoves;
    }

    for (const [id, data] of Object.entries(npcs)) {
      if (data.activities?.some(a => a.op === 'start')) interacting.delete(id);
      if (data.activities?.length === 1) { data.activity = data.activities[0]; delete data.activities; }
    }
    if (Object.keys(npcs).length) front.npcs = npcs;
    front.interactingIds = [...interacting];
    Object.defineProperty(front, 'diagnostics', { value: diagnostics, enumerable: false });
    return front;
  }

  function parseActivity(text, now, world, options) { return buildFront(text, now, world, options).npcs || {}; }
  function parseInteract(text) { return [...new Set(grabTags(text, 'interact').map(a => a.npc).filter(Boolean))]; }
  function parseMove(text) { return grabTags(text, 'move').find(a => !a.npc)?.to || null; }
  function compareEnd(parsed, expectedMin) {
    return {
      expectedMin,
      reportedEnd: parsed.end,
      reportedMin: parsed.endMin,
      ok: parsed.endMin === null ? null : parsed.endMin === expectedMin,
      deviationMin: parsed.endMin === null ? null : parsed.endMin - expectedMin
    };
  }

  root.OKH_APP_PARSE = Object.freeze({
    statusBody, grabTags, parseAttrs, parseDayClock, parseActivity, parseInteract,
    parseMove, parseStatusBar, buildFront, compareEnd
  });
})(globalThis);

;
/**
 * @module okh_app_hook
 * @updated 2026-11-11 21:56
 * @status active
 * @reason 修复流式回复结束时 GENERATION_ENDED 早于 MESSAGE_RECEIVED 触发导致的待发事件误回滚竞态
 */
(function (root) {
  'use strict';
  const u = root.OKHBackgroundModules?.utils;
  const CFG = root.OKH_APP_CONFIG, W = root.OKH_APP_WORLD;
  const A = root.OKH_APP_ADAPTER, P = root.OKH_APP_PARSE, GPT = root.OKHBackground;
  if (!u || !CFG || !W || !A || !P || !GPT) throw Error('hook 依赖缺失');
  const RHYTHM = { everyMessages: 3, minutesPerTick: 60, useAITime: true };
  let options = {}, work = Promise.resolve(), activeGeneration = null, seq = 0, last = null;
  const controllers = new Map(), listeners = [];
  function configure(next = {}) { options = { ...options, ...next }; controllers.clear(); }
  function serial(fn) { const result = work.then(fn); work = result.catch(() => {}); return result; }
  function controller(s) {
    W.assertSession(s);
    if (!controllers.has(s.id)) controllers.set(s.id, A.createController(s));
    return controllers.get(s.id);
  }
  function fingerprint(text) {
    // 处理完整文本，不再只取前32字；这是内容标识，不是密码散列。
    let a = 2166136261, b = 2246822519;
    for (let i = 0; i < text.length; i++) {
      const n = text.charCodeAt(i);
      a = Math.imul(a ^ n, 16777619);
      b = Math.imul(b ^ n, 3266489917);
    }
    return 'h2-' + (a >>> 0).toString(16) + '-' + (b >>> 0).toString(16) + '-' + text.length;
  }
  function replyId(s, index) { return 'reply:' + s.id + ':' + index; }
  function revisionFor(chat, index) {
    const item = chat[index];
    return fingerprint(JSON.stringify([item?.swipe_id ?? 0, item?.mes || '',
      chat.slice(0, index).map(m => [Boolean(m.is_user), Boolean(m.is_system), m.mes || '', m.swipe_id ?? 0])]));
  }
  function assistant(item) { return item && !item.is_user && !item.is_system; }
  function newestIndex(chat) {
    for (let i = chat.length - 1; i >= 0; i--) if (assistant(chat[i])) return i;
    return -1;
  }
  async function inject(text, s) {
    if (text) W.assertSession(s);
    if (options.inject) {
      const result = await options.inject(text, { chatId: s.id });
      u.check(result !== false, '提示词注入接口报告失败，事件未确认');
      return result;
    }
    const ctx = W.context();
    u.check(typeof ctx?.setExtensionPrompt === 'function',
      '没有提示词注入接口；请 configure({inject})，不能只保存 pendingText 冒充已交付');
    // SillyTavern 扩展提示位置 IN_CHAT=1、SYSTEM=0；可用 configure 显式覆盖。
    const position = options.promptPosition ?? ctx.extension_prompt_types?.IN_CHAT ?? 1;
    const role = options.promptRole ?? ctx.extension_prompt_roles?.SYSTEM ?? 0;
    const result = await ctx.setExtensionPrompt('okh_pending_' + encodeURIComponent(s.id), text, position,
      options.promptDepth ?? 0, false, role);
    u.check(result !== false, '扩展提示词注入失败');
    return result;
  }
  async function publish(s) {
    const world = W.loadWorld(s), batch = GPT.prepare(world, 8);
    const values = {
      'okh_gpt.pendingText': batch.text,
      'okh_gpt.pendingIds': JSON.stringify(batch.ids),
      'okh_gpt.ledger': A.buildLedger(world),
      'okh_gpt.watch': JSON.stringify(A.buildWatch(world)),
      'okh_gpt.derivedRevision': String(world.bg.revision)
    };
    try { await W.publishDerived(s, values, world.bg.revision); return true; }
    catch (error) { console.warn('[APP] 权威状态已保存，派生缓存发布失败：', error.message); return false; }
  }
  function clockPlan(world, parsed, explicitMinutes, countMessage, initial) {
    u.check(Number.isSafeInteger(RHYTHM.everyMessages) && RHYTHM.everyMessages > 0 &&
      Number.isSafeInteger(RHYTHM.minutesPerTick) && RHYTHM.minutesPerTick > 0, '时间保底参数非法');
    const old = world.bg.clockState || { count: 0, creditedMin: 0 };
    let count = old.count, creditedMin = old.creditedMin;
    let elapsed = explicitMinutes ?? (RHYTHM.useAITime ? parsed.elapsed : null) ?? 0;
    u.check(u.minute(elapsed), '推进分钟必须为非负整数');
    if (initial) elapsed = 0;
    if (countMessage && !initial) {
      count++; creditedMin += elapsed;
      if (count >= RHYTHM.everyMessages) {
        elapsed += Math.max(0, RHYTHM.minutesPerTick - creditedMin);
        count = 0; creditedMin = 0;
      }
    }
    return { toMin: world.timeMin + elapsed, clockState: { count, creditedMin } };
  }
  async function restoreRecord(s, id) {
    const envelope = W.readEnvelope(s), record = envelope.history.find(h => h.id === id);
    u.check(record, '缺少该回复之前的检查点，不能安全重生成：' + id);
    await controller(s).restore(record.before);
    return record;
  }
  function buildTurnCommand(minutes, opts, world, id, revision) {
    const text = opts.text || '';
    try {
      const parsed = P.parseStatusBar(text);
      const plan = clockPlan(world, parsed, minutes, opts.countMessage === true, opts.initial === true);
      const front = P.buildFront(text, plan.toMin, world,
        { token: id, config: CFG.buildConfig(), locations: CFG.LOCATIONS, canMove: CFG.canMove });
      const diagnostics = [...parsed.diagnostics, ...front.diagnostics];
      if (opts.frontOverride) {
        if (!u.own(opts.frontOverride, 'interactingIds')) front.interactingIds = world.interactingIds || [];
        Object.assign(front, u.clone(opts.frontOverride));
      }
      const timeCheck = P.compareEnd(parsed, plan.toMin);
      if (timeCheck.ok === false) diagnostics.push('end 与时间真值偏差 ' + timeCheck.deviationMin + ' 分钟；未覆盖真值');
      front.clockState = plan.clockState;
      front.timeCheck = timeCheck;
      const during = new Set([...(world.interactingIds || []), ...P.parseInteract(text).filter(n => u.own(world.npcs, n))]);
      return {
        command: { id, revision, toMin: plan.toMin, interactingIds: [...during], front, chatIndex: opts.chatIndex ?? null },
        diagnostics,
        timeCheck
      };
    } catch (error) {
      if (!opts.allowFallback) throw error;
      const parsed = {
        elapsed: null, end: null, endMin: null, hasStatus: false,
        diagnostics: ['状态栏解析失败，已按空回执与保底计时降级结算（请重生成或修正本楼状态栏）：' + error.message]
      };
      const plan = clockPlan(world, parsed, minutes, opts.countMessage === true, opts.initial === true);
      const timeCheck = P.compareEnd(parsed, plan.toMin);
      const front = { interactingIds: [], clockState: plan.clockState, timeCheck };
      return {
        command: { id, revision, toMin: plan.toMin, interactingIds: [...(world.interactingIds || [])], front, chatIndex: opts.chatIndex ?? null },
        diagnostics: parsed.diagnostics,
        timeCheck
      };
    }
  }
  async function runStep(minutes, opts = {}) {
    const s = opts.session || W.session();
    await W.ensureWorld(false, s);
    let world = W.loadWorld(s);
    const id = opts.msgId || 'manual:' + s.id + ':' + Date.now() + ':' + (++seq);
    const revision = opts.revision || fingerprint(JSON.stringify([opts.text || '', minutes ?? null, opts.frontOverride ?? null]));
    const recorded = world.bg.receipts[id];
    if (recorded !== undefined) {
      const old = JSON.parse(recorded);
      if (old.revision === revision) return { advanced: false, duplicate: true, reason: '重复提交' };
      await restoreRecord(s, id);
      world = W.loadWorld(s);
    }
    const { command, diagnostics, timeCheck } = buildTurnCommand(minutes, opts, world, id, revision);
    const generationId = opts.generationId ?? null;
    const result = await controller(s).finishReply(command, generationId);
    const published = await publish(s);
    last = { advanced: true, from: world.timeMin, to: result.state.timeMin, front: command.front,
      actions: result.report.actions, released: result.report.released,
      pending: GPT.prepare(result.state, 8).ids.length, diagnostics, timeCheck, published };
    diagnostics.forEach(message => console.warn('[APP] ' + message));
    console.log('[APP] 已提交 ' + world.timeMin + ' → ' + result.state.timeMin);
    return last;
  }
  async function reconcile(s, chat, replaceIndex) {
    const history = W.readEnvelope(s).history;
    const changed = history.find(record => Number.isSafeInteger(record.chatIndex) &&
      (!assistant(chat[record.chatIndex]) || revisionFor(chat, record.chatIndex) !== record.revision ||
       record.chatIndex === replaceIndex));
    if (!changed) return null;
    await controller(s).restore(changed.before);
    await publish(s);
    return changed.chatIndex;
  }
  async function replay(s, chat, from, through) {
    for (let i = from; i <= through; i++) {
      if (!assistant(chat[i])) continue;
      await runStep(undefined, { session: s, msgId: replyId(s, i), revision: revisionFor(chat, i),
        text: chat[i].mes || '', chatIndex: i, countMessage: true, initial: i === 0, allowFallback: true });
    }
  }
  function step(minutes, opts = {}) { return serial(() => runStep(minutes, opts)); }
  const REPLACE_TYPES = new Set(['regenerate', 'swipe', 'continue', 'append', 'appendFinal']);
  const SKIP_TYPES = new Set(['quiet', 'impersonate']);
  function matchesTarget(generation, s, chat, target) {
    if (!generation || generation.session.id !== s.id) return false;
    if (generation.fixed) return generation.targetIndex === target;
    return target >= generation.targetIndex &&
      target <= generation.maxTargetIndex &&
      target === newestIndex(chat) &&
      !chat.slice(generation.targetIndex, target).some(assistant);
  }
  async function rollbackPrepared(generation) {
    if (!generation?.prepared) return;
    const now = W.loadWorld(generation.session);
    if (!now || now.bg?.generations?.[generation.id]?.status !== 'prepared') return;
    if (now.bg.revision === generation.preparedRev && generation.snapshot) {
      await W.commit(generation.session, {
        expectedRevision: now.bg.revision,
        state: generation.snapshot,
        checkpoint: null,
        reason: 'cancel-generation'
      });
    } else {
      const next = u.clone(now);
      delete next.bg.generations[generation.id];
      next.bg.revision = now.bg.revision + 1;
      await W.commit(generation.session, {
        expectedRevision: now.bg.revision,
        state: next,
        checkpoint: null,
        reason: 'cancel-generation-prune'
      });
    }
    await publish(generation.session);
  }
  async function clearGeneration(generation) {
    if (!generation) return;
    try {
      await inject('', generation.session);
    } finally {
      await rollbackPrepared(generation);
    }
  }
  async function preparePromptBatch(s, id) {
    const beforeWorld = W.loadWorld(s);
    const preview = GPT.prepare(beforeWorld, 8);
    if (!preview.ids.length) return { batch: { ...preview, text: '' }, prepared: false, preparedRev: null, snapshot: null };
    const snapshot = u.clone(beforeWorld);
    const batch = await controller(s).prepareGeneration(id, 8);
    return { batch, prepared: true, preparedRev: W.loadWorld(s)?.bg.revision ?? null, snapshot };
  }
  function resolveTargetWindow(chat, replaceIndex) {
    if (replaceIndex !== undefined) return { targetIndex: replaceIndex, maxTargetIndex: replaceIndex, fixed: true };
    const lastIndex = newestIndex(chat);
    if (lastIndex === chat.length - 1 && !chat[lastIndex]?.mes) {
      return { targetIndex: lastIndex, maxTargetIndex: lastIndex, fixed: true };
    }
    return { targetIndex: chat.length, maxTargetIndex: chat.length + 1, fixed: false };
  }
  function beforeGeneration(opts = {}) {
    if (opts.dryRun || SKIP_TYPES.has(opts.type)) return Promise.resolve(null);
    return serial(async () => {
      const s = W.session();
      await W.ensureWorld(false, s);
      if (activeGeneration) {
        const prev = activeGeneration;
        activeGeneration = null;
        await clearGeneration(prev);
      }
      const chat = W.context()?.chat || [];
      const from = await reconcile(s, chat, opts.replaceIndex);
      if (from !== null && opts.replaceIndex === undefined) await replay(s, chat, from, newestIndex(chat));
      const id = opts.generationId || 'gen:' + s.id + ':' + Date.now() + ':' + (++seq);
      const { batch, prepared, preparedRev, snapshot } = await preparePromptBatch(s, id);
      const text = A.buildLedger(W.loadWorld(s)) + (batch.text ? '\n\n' + batch.text : '');
      await inject(text, s);
      activeGeneration = { id, session: s, ...resolveTargetWindow(chat, opts.replaceIndex), prepared, preparedRev, snapshot };
      return { ...batch, generationId: id, text };
    });
  }
  function onMessage(index) {
    return serial(async () => {
      const s = W.session(), chat = W.context()?.chat || [];
      const target = Number.isSafeInteger(index) ? index : newestIndex(chat);
      if (!assistant(chat[target])) return { advanced: false, reason: '不是完整AI回复' };
      await W.ensureWorld(false, s);
      const from = await reconcile(s, chat);
      if (from !== null && from < target) await replay(s, chat, from, target - 1);
      const generation = matchesTarget(activeGeneration, s, chat, target) ? activeGeneration : null;
      const result = await runStep(undefined, { session: s, msgId: replyId(s, target),
        revision: revisionFor(chat, target), text: chat[target].mes || '', chatIndex: target,
        countMessage: true, initial: target === 0, allowFallback: true,
        generationId: generation?.prepared ? generation.id : undefined });
      if (!result.duplicate && generation) {
        activeGeneration = null;
        try { await inject('', s); } catch (error) { console.warn('[APP] 清理提示词失败：', error.message); }
      }
      return result;
    });
  }
  function syncHistory() {
    return serial(async () => {
      const s = W.session(), chat = W.context()?.chat || [];
      await W.ensureWorld(false, s);
      const from = await reconcile(s, chat);
      if (from !== null) { await replay(s, chat, from, newestIndex(chat)); await publish(s); }
      return from;
    });
  }
  function cancelGeneration() {
    return serial(async () => {
      const generation = activeGeneration;
      activeGeneration = null;
      await clearGeneration(generation);
      // 不确认事件；下次生成仍可取出。
    });
  }
  function reportFailure(error) { console.error('[APP]', error); }
  function attach() {
    if (listeners.length) return true;
    const ctx = W.context(), types = options.events || root.tavern_events || ctx?.event_types || root.event_types;
    const on = options.eventOn || root.eventOn || ctx?.eventSource?.on?.bind(ctx.eventSource);
    const off = options.eventOff || root.eventRemoveListener || ctx?.eventSource?.removeListener?.bind(ctx.eventSource);
    u.check(typeof options.inject === 'function' || typeof ctx?.setExtensionPrompt === 'function',
      '没有提示词注入接口，请配置 inject 后再启动');
    u.check(typeof on === 'function' && typeof off === 'function' && types?.MESSAGE_RECEIVED !== undefined &&
      types?.GENERATION_STARTED !== undefined, '缺少生成前/回复完成事件接口，请配置 events/eventOn/eventOff');
    function bind(event, handler) { on(event, handler); listeners.push({ event, handler, off }); }
    bind(types.GENERATION_STARTED, async (type, data, dryRun) => {
      const chat = W.context()?.chat || [];
      const last = newestIndex(chat);
      const canReplace = REPLACE_TYPES.has(type) && last >= 0 && last === chat.length - 1;
      try { return await beforeGeneration({
        type,
        dryRun: dryRun === true || data?.dryRun === true,
        replaceIndex: canReplace ? last : undefined
      }); }
      catch (error) { reportFailure(error); throw error; }
    });
    bind(types.MESSAGE_RECEIVED, index => onMessage(index).catch(error => { reportFailure(error); throw error; }));
    for (const name of ['MESSAGE_EDITED', 'MESSAGE_DELETED', 'MESSAGE_SWIPED']) {
      if (types[name] !== undefined) bind(types[name], () => syncHistory().catch(reportFailure));
    }
    // 流式结束会先触发 GENERATION_ENDED 再触发 MESSAGE_RECEIVED，不能在此取消生成；
    // 主动中止走 GENERATION_STOPPED，请求异常残留由下次 beforeGeneration 兜底清理。
    for (const name of ['GENERATION_STOPPED', 'CHAT_CHANGED']) {
      if (types[name] !== undefined) bind(types[name], () => cancelGeneration().catch(reportFailure));
    }
    return true;
  }
  function detach() {
    for (const { event, handler, off } of listeners.splice(0)) off(event, handler);
    return true;
  }
  function restore(id) { return serial(async () => { const s = W.session(); await restoreRecord(s, id); await publish(s); }); }
  root.OKH_APP_HOOK = Object.freeze({ RHYTHM, configure, attach, detach, step, onMessage,
    beforeGeneration, cancelGeneration, syncHistory, restore, fingerprint, revisionFor,
    applyFront: (front, opts = {}) => serial(() => runStep(opts.minutes ?? 0, { ...opts, frontOverride: front })),
    parseElapsed: text => P.parseStatusBar(text).elapsed, lastReport: () => last, publish });
})(globalThis);

;
/**
 * @module okh_app_debug
 * @updated 2026-11-10 23:35
 * @status  active
 * @reason  调试工具：看状态、看监听、看队列、手动推演
 * @deps    ['okh_app_config', 'okh_app_world', 'okh_app_adapter', 'okh_app_hook']
 * @provides { status, watch, ledger, queue, step, reset, config }
 */

(function (root) {
  'use strict'

  const CFG = root.OKH_APP_CONFIG
  const W = root.OKH_APP_WORLD
  const A = root.OKH_APP_ADAPTER
  const H = root.OKH_APP_HOOK
  const GPT = root.OKHBackground

  if (!CFG || !W || !A || !H) {
    console.error('[APP] debug 加载失败')
    return
  }

  /**
   * 全员状态表
   */
  function status() {
    const world = W.loadWorld()
    if (!world) { console.warn('[APP] 还没初始化，跑 OKH_APP.init()'); return null }

    const STAGE = CFG.STAGES
    const rows = Object.values(world.npcs).map(n => ({
      姓名: n.name,
      监测: n.monitored ? '●' : '○',
      阶段: n.hasStage === false ? '—' : (STAGE[n.stage] ?? n.stage),
      好感: n.hasAffection === false ? '—' : Math.round(n.values?.affection ?? 0),
      位置: n.location,
      当前活动: n.activity?.label || '—',
      同地点: n.location === world.playerLocation ? '●' : '○',
      可调度状态: GPT.watch(world).npcs[n.id]?.availability || 'inactive',
      专属数值: JSON.stringify(n.values)
    }))

    console.group(`[APP] 第 ${Math.floor(world.timeMin / 1440) + 1} 天 · ${world.timeMin % 1440} 分`)
    console.table(rows)
    console.groupEnd()
    return rows
  }

  /**
   * 监听面板
   */
  function watch() {
    const world = W.loadWorld()
    if (!world) { console.warn('[APP] 还没初始化'); return null }
    const w = A.buildWatch(world)
    console.group(`[APP] 监听 · 第 ${w.day} 天`)
    console.table(w.list)
    console.groupEnd()
    return w
  }

  /**
   * 台账文本
   */
  function ledger() {
    const world = W.loadWorld()
    if (!world) return null
    const text = A.buildLedger(world)
    console.log(text)
    return text
  }

  /**
   * 待演绎队列
   */
  function queue() {
    const world = W.loadWorld()
    if (!world) return null
    const list = (world.bg?.queue || [])
    console.group(`[APP] 待演绎队列 · ${list.filter(e => e.status === 'pending').length} 条`)
    console.table(list.map(e => ({
      状态: e.status,
      类型: e.kind,
      定义: e.definitionId,
      角色: e.npcId || '—',
      时间: e.at,
      文本: (e.text || '').slice(0, 30)
    })))
    console.groupEnd()
    return list
  }

  /**
   * 手动推演
   * @param {number} minutes
   */
  function step(minutes) {
    return H.step(minutes ?? H.RHYTHM.minutesPerTick)
  }

  /**
   * 重置
   */
  async function reset() {
    const w = await W.resetWorld()
    console.log('[APP] 已重置')
    return w
  }

  /**
   * 看当前配置概览
   */
  function config() {
    const c = CFG.buildConfig()
    console.group('[APP] 配置')
    console.log('Schema 版本：', c.schemaVersion)
    console.log('时段：', c.phases.map(p => `${p.id}@${p.start}`).join(' '))
    console.log('保护期：', c.policy.ordinaryGraceMin, '分钟')
    console.log('行动：', c.actions.length, '条')
    console.log('事件：', c.events.length, '条')
    console.log('节点：', c.nodes.length, '条')
    console.groupEnd()
    return c
  }

  root.OKH_APP_DEBUG = Object.freeze({
    status, watch, ledger, queue, step, reset, config
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_DEBUG
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
;

;
/**
 * @module okh_app_hud
 * @updated 2026-11-19 15:20
 * @status  active
 * @reason  对齐主人指示：古兰营地被俘期间同伴名册与状态栏强制显示为［暂离］零剧透坐标，补充纸条递交、外围拦截与天火覆灭归队自述标题映射
 * @deps    ['OKH_APP_CONFIG', 'OKH_APP_WORLD', 'OKH_APP_ADAPTER']
 * @provides { setWatchVisible, setAssetBase, LOCATION_NAMES, phaseName, locName, buildHudHtml, buildWatchHtml, render, startHud, stopHud }
 */
(function (root) {
  'use strict'

  const W = root.OKH_APP_WORLD
  const A = root.OKH_APP_ADAPTER
  const CFG = root.OKH_APP_CONFIG
  if (!W || !A || !CFG) {
    console.error('[APP] hud 加载失败：需要 world、adapter 与 config')
    return
  }

  const LOCATION_NAMES = CFG.LOCATIONS
  const PHASE_NAMES = CFG.PHASES.map((p, i) => ({ max: CFG.PHASES[i + 1]?.start ?? 1440, name: p.label || p.id }))

  // 构建期由 build.cjs 注入 Data URI；未构建直跑时回退至本地相对路径
  const ASSET_UI = {
    journalBg: resolveUiAsset('data:image/webp;base64,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', 'assets/ui/journal_bg_1.webp'),
    darkBg: resolveUiAsset('data:image/webp;base64,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', 'assets/ui/dark_parchment_bg.webp'),
    corner: resolveUiAsset('data:image/png;base64,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', 'assets/ui/footer_accent.png'),
    seal: resolveUiAsset('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij4KICA8ZGVmcz4KICAgIDxyYWRpYWxHcmFkaWVudCBpZD0id2F4QmFzZTNEIiBjeD0iMzMlIiBjeT0iMzAlIiByPSI2OCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjZTg0YTNjIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMzUlIiBzdG9wLWNvbG9yPSIjYWIyMzFhIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iNzUlIiBzdG9wLWNvbG9yPSIjNjkxMDBhIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzNkMDcwNCIvPgogICAgPC9yYWRpYWxHcmFkaWVudD4KICAgIDxyYWRpYWxHcmFkaWVudCBpZD0id2F4SW5uZXIzRCIgY3g9IjM2JSIgY3k9IjM0JSIgcj0iNTglIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI2I4MjYxYyIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjcwJSIgc3RvcC1jb2xvcj0iIzczMTEwOSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM0NzA3MDMiLz4KICAgIDwvcmFkaWFsR3JhZGllbnQ+CiAgICA8ZmlsdGVyIGlkPSJzZWFsR2xvdyIgeD0iLTE1JSIgeT0iLTE1JSIgd2lkdGg9IjEzMCUiIGhlaWdodD0iMTMwJSI+CiAgICAgIDxmZURyb3BTaGFkb3cgZHg9IjAiIGR5PSIzIiBzdGREZXZpYXRpb249IjIuNSIgZmxvb2QtY29sb3I9IiMwMDAwMDAiIGZsb29kLW9wYWNpdHk9IjAuODUiLz4KICAgICAgPGZlRHJvcFNoYWRvdyBkeD0iMCIgZHk9IjEiIHN0ZERldmlhdGlvbj0iMC44IiBmbG9vZC1jb2xvcj0iI2ZmOTk4ZiIgZmxvb2Qtb3BhY2l0eT0iMC4zNSIvPgogICAgPC9maWx0ZXI+CiAgPC9kZWZzPgoKICA8IS0tIOiHqueEtua1gea3jOWHneWbuueahOeGlOicoeWklue8mCAo5bim5rOi5rWq6auY5YWJ5LiO5rKJ6ZmNKSAtLT4KICA8ZyBmaWx0ZXI9InVybCgjc2VhbEdsb3cpIj4KICAgIDxwYXRoIGQ9Ik0yNCAyLjUgQzMxIDIgMzggNC41IDQyLjUgMTAgQzQ3IDE1LjUgNDcuNSAyMyA0NS41IDMwIEM0My41IDM3IDM5LjUgNDMgMzMgNDYgQzI2LjUgNDguNSAxOCA0Ny41IDExLjUgNDMuNSBDNSAzOS41IDEuNSAzMS41IDIgMjQgQzIuNSAxNiA2LjUgNy41IDEzIDQgQzE3LjUgMS41IDIwLjUgMiAyNCAyLjUgWiIgZmlsbD0idXJsKCN3YXhCYXNlM0QpIi8+CiAgICA8IS0tIOeGlOicoeWPl+WFieW8p+e6vyAtLT4KICAgIDxwYXRoIGQ9Ik0xMyA1IEM3IDkgMy41IDE2LjUgMyAyNCBDMi41IDMxIDYuNSAzOC41IDEyIDQyLjUiIHN0cm9rZT0iI2ZmYTM5OSIgc3Ryb2tlLXdpZHRoPSIxLjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgZmlsbD0ibm9uZSIgb3BhY2l0eT0iMC41NSIvPgogICAgPCEtLSDpk5zmqKHljovkuIvnmoTlnIblvaLmsonpmY3mp70gLS0+CiAgICA8Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSIxNiIgZmlsbD0idXJsKCN3YXhJbm5lcjNEKSIgc3Ryb2tlPSIjMzgwNTAyIiBzdHJva2Utd2lkdGg9IjEuNCIvPgogICAgPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMTQuMiIgc3Ryb2tlPSIjZTY1YTRlIiBzdHJva2Utd2lkdGg9IjAuOCIgc3Ryb2tlLWRhc2hhcnJheT0iMiAxLjUiIGZpbGw9Im5vbmUiIG9wYWNpdHk9IjAuNSIvPgogICAgCiAgICA8IS0tIOaguOW/g+WOi+eXlee6ueeroO+8muWJkeebvuS4juKAnOW+heWGs+KAnSAtLT4KICAgIDxwYXRoIGQ9Ik0yNCAxMiBMMzAuNSAxNi41IEwzMC41IDI0IEMzMC41IDI4LjUgMjQgMzIgMjQgMzIgQzI0IDMyIDE3LjUgMjguNSAxNy41IDI0IEwxNy41IDE2LjUgWiIgZmlsbD0iIzQ3MDcwMyIgc3Ryb2tlPSIjMjYwMzAxIiBzdHJva2Utd2lkdGg9IjEiLz4KICAgIDx0ZXh0IHg9IjI0IiB5PSIyNi41IiBmb250LWZhbWlseT0iJ05vdG8gU2VyaWYgU0MnLCBzZXJpZiIgZm9udC1zaXplPSI5LjUiIGZvbnQtd2VpZ2h0PSI5MDAiIGZpbGw9IiNmY2U1ZGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGxldHRlci1zcGFjaW5nPSIxIiBzdHlsZT0idGV4dC1zaGFkb3c6IDAgLTFweCAxcHggIzIwMDMwMSwgMCAxcHggMnB4IHJnYmEoMjU1LDI1NSwyNTUsMC40NSk7Ij7lvoXlhrM8L3RleHQ+CiAgPC9nPgo8L3N2Zz4=', 'assets/ui/wax_seal_3d.svg')
  }

  let assetBase = typeof root.OKH_HUD_ASSET_BASE === 'string' ? root.OKH_HUD_ASSET_BASE : 'assets/'
  let watchVisible = false
  let activeTab = 'dispatch'
  let activePresentId = null
  const openRosterIds = new Set()
  let lastWorldRef = null

  function resolveUiAsset(token, fallback) {
    return token.startsWith('data:') ? token : fallback
  }

  function joinAsset(relPath) {
    const base = String(assetBase || '').replace(/\/+$/, '')
    return base ? `${base}/${relPath}` : relPath
  }

  function phaseName(local) {
    return (PHASE_NAMES.find(p => local < p.max) || PHASE_NAMES[PHASE_NAMES.length - 1]).name
  }

  function locName(key) {
    return LOCATION_NAMES[key] || key || '未知地点'
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function formatClock(timeMin) {
    const safeMin = Math.max(0, Number(timeMin) || 0)
    const day = Math.floor(safeMin / 1440) + 1
    const local = safeMin % 1440
    const hour = String(Math.floor(local / 60)).padStart(2, '0')
    const minute = String(local % 60).padStart(2, '0')
    return { day, local, phase: phaseName(local), weekday: CFG.weekdayLabel(day), clock: `${hour}:${minute}` }
  }

  // ============================================================
  // 一、角色公开档案、通俗事件名与快捷交互映射（严禁剧透）
  // ============================================================

  const CHAR_META = {
    gulan: {
      sigil: '⚔', role: '半龙人领队',
      bio: '伯里与妮丝的母亲，威严寡言，以武道身教磨砺后辈，从不代劳琐事。',
      actions: [
        { label: '请教剑术或对练', prompt: '向古兰请教剑术并约一场对练', tag: '对练请教' },
        { label: '照料起居或打理剑具', prompt: '帮古兰擦拭打理重剑并照料日常起居', tag: '日常照料' }
      ]
    },
    isna: {
      sigil: '🗡', role: '猫耳斥候',
      bio: '身手灵巧、市井老练，嗜酒贪食，对商道行情与银钱颇为敏锐。',
      actions: [
        { label: '分食小酌或闲聊宽慰', prompt: '邀伊丝娜坐下分些酒肉闲聊宽慰', tag: '同伴闲聊' },
        { label: '并肩探哨留意街面动静', prompt: '与伊丝娜并肩打探附近风声与动向', tag: '斥候探哨' }
      ]
    },
    nise: {
      sigil: '✧', role: '见习法师',
      bio: '伯里之妹，骄傲好胜、好奇心旺，热衷钻研法术与新奇物件。',
      actions: [
        { label: '探讨法术笔记或稳心指点', prompt: '坐下来陪妮丝探讨法术笔记并指点施法细节', tag: '法术研讨' },
        { label: '兄妹闲聊或陪她见识新鲜事', prompt: '顺着妮丝的话题斗嘴闲聊，带她看看附近的新奇事物', tag: '日常陪伴' }
      ]
    },
    aurora: {
      sigil: '†', role: '见习牧师',
      bio: '温顺内敛的随队医护与随侍，身负家族旧债，默默分担着杂务。',
      actions: [
        { label: '分担杂务或致谢照拂', prompt: '上前帮奥萝拉分担手头杂务并轻声宽慰她', tag: '分担照拂' },
        { label: '陪赴圣辉大教堂祈祷', prompt: '陪奥萝拉一同前往圣辉大教堂静心祈祷', tag: '教堂祈祷' }
      ]
    },
    eileen: {
      sigil: '⚜', role: '王国三等巡查使',
      bio: '王都名门出身，奉王国之命巡查奥克赫斯账目与防务，仪态矜持严谨。',
      actions: [
        { label: '复盘局势并筹备反攻', prompt: '与艾琳私下复盘山庄防务，商议下一步反攻筹备', tag: '反攻筹备' },
        { label: '照料起居并打气宽慰', prompt: '替艾琳留意周遭隐蔽并温言宽慰打气', tag: '流亡照料' }
      ]
    },
    cecilia: {
      sigil: '✝', role: '圣辉修女',
      bio: '驻守圣辉大教堂，主持晨昏弥撒并独自支撑镇内孤儿院的生计。',
      actions: [
        { label: '参加弥撒或照看孤儿', prompt: '留在教堂参加祈祷，并搭手协助塞西莉亚照看孤儿院孩童', tag: '教堂协助' },
        { label: '协助采买炮制伤药', prompt: '帮塞西莉亚采购草药并整理医务柜', tag: '草药帮手' }
      ]
    },
    ed: {
      sigil: '🪶', role: '随行后勤',
      bio: '银月珠宝铺遗孤，八岁人类幼童，勤勉机敏，获救后随小队打理杂务。',
      actions: [
        { label: '打听镇上动态', prompt: '向爱德打听今日镇上的市井动态、物价行情与公会放榜风声', tag: '市井情报' },
        { label: '指导求生常识', prompt: '趁着空闲指导爱德野外识路、潜行避险或核对账目的求生常识', tag: '常识教学' },
        { label: '询问姐姐近况', prompt: '轻声询问爱德关于姐姐爱丽丝与银月珠宝铺的近况线索', tag: '安抚询问' }
      ]
    },
    alice: {
      sigil: '💎', role: '银月珠宝铺掌柜之女',
      bio: '爱德的胞姐，端庄娴静，现于银月珠宝铺柜台理货算账。',
      actions: [
        { label: '借选购首饰上前搭话', prompt: '借选购宝石首饰为由走近柜台，低声向爱丽丝试探铺内近况', tag: '柜台试探' },
        { label: '直接提及爱德安好下落', prompt: '压低声音直接告诉爱丽丝，爱德已被小队救下且安然无恙', tag: '传递真相' }
      ]
    },
    sid: {
      sigil: '🪙', role: '银月珠宝铺代掌柜',
      bio: '高夫家远房表舅，举止圆滑，正以借据代管银月珠宝铺账目。',
      actions: [
        { label: '查问铺面借据与账册', prompt: '以公会冒险者身份查问银月珠宝铺的借据与掌柜账目', tag: '账目质询' }
      ]
    }
  }

  const EVENT_TITLES = {
    gulan_final_rescue_prompt: '龙血躁动 · 守夜相伴',
    isna_tavern_rumor_notice: '酒馆流言 · 斥候心绪',
    isna_alley_lockpick_spot: '暗巷微光 · 斥候试探',
    isna_pendant_exchange: '夜谈信物 · 成对吊坠',
    isna_wilds_rescue_real: '荒原急援 · 黑兽人据点',
    eileen_escort_offer: '巡查使请托 · 突围护送',
    aurora_pass_manor_intel: '山庄密信 · 换防情报',
    eileen_reclaim_tube: '反攻夺管 · 潜回山庄',
    cecilia_manor_appeal_1: '修女求助 · 教堂困境',
    cecilia_manor_appeal_2: '修女求助 · 孤儿院告急',
    cecilia_manor_appeal_3: '修女求助 · 最终危机',
    cecilia_reward_1_oral: '夜祷廊下 · 修女心意',
    cecilia_reward_2_thighs: '夜祷廊下 · 亲密回馈',
    cecilia_reward_3_sex: '夜祷廊下 · 倾心相托',
    ed_investigate_truth: '银月珠宝铺 · 探知真相',
    ed_intercept_job_1: '公会急件抢截 · 加急货样',
    ed_intercept_job_2: '公会急件抢截 · 仓栈急工',
    ed_intercept_job_3: '公会急件抢截 · 镇郊寻回',
    ed_intercept_job_4: '公会急件抢截 · 特急送达',
    ed_daily_perk_1: '旅店营生回扣 · 集市砍价',
    ed_daily_perk_2: '旅店营生回扣 · 地窖转运',
    ed_daily_perk_3: '旅店营生回扣 · 后厨分食',
    ed_daily_perk_4: '旅店营生回扣 · 修补桌椅',
    wilds_rescue_trap_mud_high: '荒原伏击 · 破围突脱',
    wilds_rescue_trap_mud_low: '荒原暗算 · 受困要塞',
    gulan_rescue_note_delivered: '爱德的转交 · 师傅的告诫',
    gulan_rescue_player_rush_camp: '戒备森严 · 无功而返',
    gulan_orc_camp_destroyed_resolve_with_note: '天火覆灭 · 古兰归队自述',
    gulan_orc_camp_destroyed_resolve_no_note: '天火覆灭 · 古兰归队自述'
  }

  const CHOICE_MAP = {
    rescue: { title: '留守陪伴调息，稳住她翻涌的龙血', hint: '守护相伴' },
    fail: { title: '一时措手不及，未能及时拉住她', hint: '错失时机' },
    hire_mercenaries: { title: '出资 200 金赴公会雇佣三阶讨伐队声东击西救出古兰', hint: '重金营救' },
    knight_purge_rescue: { title: '请动兰开斯特狮鹫骑士团清剿黑兽人营地救回古兰', hint: '骑士团平推' },
    pay_fine: { title: '取出 40 枚金币交给治安官破财消灾，平息演武场旧案', hint: '赔款平息' },
    expose_poison: { title: '当众揭穿地痞暗燃违禁催情异香伏击在先，据理驳回勒索', hint: '据理反驳' },
    gulan_intimidate: { title: '由古兰按剑压阵外放龙威，冷声逼退登门镇卫', hint: '按剑震慑' },
    soothe: { title: '坐到伊丝娜身旁温言宽慰，陪她消解浮躁', hint: '宽慰安抚' },
    ignore: { title: '暂且不加干涉，各自回房歇息', hint: '暂且搁置' },
    intercept: { title: '及时上前拦住伊丝娜，拉她离开暗巷谈清利害', hint: '及时劝阻' },
    miss: { title: '慢了一步，没能拦下她的举动', hint: '错失阻拦' },
    accept_pendant: { title: '郑重接过她递来的半枚吊坠并贴身收好', hint: '互换信物' },
    decline_pendant: { title: '婉拒这份贵重旧物，只陪她静静饮完余酒', hint: '礼貌婉拒' },
    rescue_now: { title: '即刻随古兰动身赶往黑兽人前哨据点营救伊丝娜', hint: '星夜驰援' },
    accept: { title: '应下眼前的请托与心意', hint: '欣然应允' },
    decline: { title: '婉拒冒险介入，先保小队眼下周全', hint: '审慎婉拒' },
    receive_intel: { title: '私下接过奥萝拉暗中带出的山庄换防情报', hint: '接收情报' },
    strike: { title: '按既定计划潜回领主山庄，夺回王室讯号管', hint: '展开夺管' },
    help: { title: '设法筹款周转，拦下塞西莉亚前往领主山庄', hint: '出手解围' },
    let_go: { title: '一时无力兜底，只能由她自行抉择', hint: '无力阻拦' },
    probe_direct_mention: { title: '直接提及爱德安好下落，开门见山探问内情', hint: '直询真相' },
    probe_inquire_debt: { title: '借选购宝石切入，探问铺面债务与席德内幕', hint: '委婉试探' },
    accept_direct: { title: '当机立断，前去私洽接下急件差事', hint: '现结入账' },
    negotiate_teach: { title: '教爱德甄别雇主信用并协商补贴', hint: '加赏+教学' },
    accept_perk: { title: '收下掌柜折让优惠，肯定爱德的持家付出', hint: '免租/折抵' },
    trade_teach: { title: '将折让换作干粮贴补，并教爱德爱惜力气', hint: '贴补+教学' },
    cancel: { title: '暂缓决定，容后再议', hint: '暂且搁置' }
  }

  // ============================================================
  // 二、数据抽取（只读 world，绝不改写状态）
  // ============================================================

  function getPendingInteractions(world) {
    const events = CFG.EVENTS || []
    const out = []
    for (const st of Object.values(world.bg?.eventStates || {})) {
      if (st?.status !== 'pending') continue
      const def = events.find(e => e.id === st.definitionId)
      if (!def || def.mode !== 'interaction') continue
      const npc = st.npcId ? world.npcs?.[st.npcId] : null
      const text = String(def.text || '').replace(/\{(name|location)\}/g, (_, k) => {
        if (k === 'name') return npc?.name || ''
        return locName(npc?.location || world.playerLocation)
      })
      const choices = Object.keys(def.outcomes || {})
      if (def.allowCancel && !choices.includes('cancel')) choices.push('cancel')
      out.push({
        id: def.id,
        npcId: st.npcId || null,
        title: EVENT_TITLES[def.id] || '当前待决事项',
        text,
        choices
      })
    }
    return out
  }

  function getPresentCharacters(world, pendingList) {
    const map = new Map()
    const npcs = Object.values(world.npcs || {})
    for (const n of npcs) {
      if (n.monitored === true && n.alive !== false && n.location === world.playerLocation) {
        map.set(n.id, buildCharView(world, n))
      }
    }
    // 纳入当前待决事件关联人物，不局限于随行同伴
    for (const ev of pendingList) {
      if (ev.npcId && !map.has(ev.npcId) && world.npcs?.[ev.npcId]) {
        map.set(ev.npcId, buildCharView(world, world.npcs[ev.npcId]))
      }
      if (ev.id === 'ed_investigate_truth') {
        if (!map.has('alice')) map.set('alice', buildSceneNpcView('alice', '爱丽丝', '柜台算账 · 受胁隐忍'))
        if (!map.has('sid')) map.set('sid', buildSceneNpcView('sid', '席德', '内堂掌账 · 戒备打量'))
      }
    }
    return Array.from(map.values())
  }

  function buildCharView(world, npc) {
    const meta = CHAR_META[npc.id] || { sigil: '◈', role: '同行人物', bio: '当前与你同处一地。', actions: [] }
    const affVal = npc.hasAffection !== false ? Math.round(npc.values?.affection ?? 0) : null
    const affTier = affVal !== null ? (CFG.AFFECTION_TIERS[CFG.getAffectionTier(affVal)] || '普通') : null
    const isDeparted = Boolean(npc.flags?.gulan_departed || npc.flags?.captured_orc)
    const stance = isDeparted
      ? '暂离'
      : (npc.activity ? npc.activity.label : (npc.location === world.playerLocation ? '同地驻留' : locName(npc.location)))
    const metrics = []
    if (affTier !== null) metrics.push({ label: '关系情谊', val: `${affTier} (${affVal})` })
    metrics.push({ label: '当前位置', val: isDeparted ? '暂离' : locName(npc.location) })
    if (npc.id === 'ed') {
      metrics.push({ label: '随行状态', val: world.flags?.alice_rescued ? '立志历练' : '随队后勤' })
      const teachCnt = npc.flags?.ed_teach_count ?? 0
      metrics.push({
        label: '求生常识',
        val: npc.flags?.ed_stealth_ready ? `已掌握潜行放哨 (${teachCnt}次)` : `${teachCnt} / 3 次`
      })
    }
    if (npc.id === 'eileen' && world.flags?.eileen_fugitive && !world.flags?.baron_purged) {
      metrics.push({ label: '反攻筹备', val: `${Math.round(npc.values?.counterattack ?? 0)} / 100` })
    }
    if (npc.id === 'cecilia' && npc.monitored === true) {
      metrics.push({ label: '孤儿院资金', val: `${Math.round(npc.values?.orphanage_funds ?? 0)}` })
    }
    if (npc.id === 'aurora' && npc.flags?.aurora_debt_disclosed && (npc.values?.debt_pressure ?? 0) > 0) {
      metrics.push({ label: '已知旧债', val: `${Math.round(npc.values.debt_pressure * 10)} 金` })
    }
    if (npc.id === 'nise' && (npc.flags?.nise_debt_known || (npc.stage ?? 0) >= 1) && (npc.values?.gamble_debt ?? 0) > 0) {
      metrics.push({ label: '查明赌债', val: `${Math.round(npc.values.gamble_debt * 10)} 金` })
    }
    let bio = meta.bio
    let actions = (meta.actions || []).slice()
    const arrived = Boolean(world.flags?.arrived_oakhaven)
    if (npc.id === 'ed') {
      if (!world.flags?.ed_awake) {
        bio = '荒原商队遇袭后救下的瘦弱男童，惊魂未定，暂由小队照看。'
      } else if (!world.flags?.ed_permanently_joined) {
        bio = '奥克赫斯商铺的孩子，商队遇袭后获救，暂随小队同行照料。'
      }
      actions = actions.filter(a => {
        if (a.tag === '市井情报' && !arrived) return false
        if (a.tag === '安抚询问' && !world.flags?.ed_permanently_joined) return false
        return true
      })
    } else if (npc.id === 'aurora' && !arrived) {
      actions = actions.map(a => a.tag === '教堂祈祷'
        ? { label: '夜间宽慰或照拂伤药', prompt: '在营地坐到奥萝拉身旁温言宽慰，并替她搭手整理药包', tag: '营地宽慰' }
        : a)
    }
    return {
      id: npc.id,
      name: npc.name,
      sigil: meta.sigil,
      role: meta.role,
      bio,
      stance,
      affLabel: affTier !== null ? `${affTier} ${affVal}` : '随行伙伴',
      affIsLove: affVal !== null && affVal >= 90,
      metrics,
      actions,
      portraitPath: joinAsset(`portraits/${npc.id}.png`)
    }
  }

  function buildSceneNpcView(id, name, stance) {
    const meta = CHAR_META[id] || { sigil: '◈', role: '在场人物', bio: '', actions: [] }
    return {
      id,
      name,
      sigil: meta.sigil,
      role: meta.role,
      bio: meta.bio,
      stance,
      affLabel: '场景人物',
      affIsLove: false,
      metrics: [{ label: '当前态势', val: stance }],
      actions: meta.actions || [],
      portraitPath: joinAsset(`portraits/${id}.png`)
    }
  }

  function getChronicleItems(world) {
    const items = []
    const seen = new Set()
    const queue = Array.isArray(world.bg?.queue) ? world.bg.queue : []
    for (let i = queue.length - 1; i >= 0; i--) {
      const rec = queue[i]
      if (!rec || rec.status === 'superseded' || !rec.text) continue
      const key = `${rec.definitionId || rec.id}:${rec.at}`
      if (seen.has(key)) continue
      seen.add(key)
      const clk = formatClock(rec.at)
      const snippet = String(rec.text).replace(/\s+/g, ' ').slice(0, 88)
      items.push({
        day: clk.day,
        header: `第 ${clk.day} 天 · ${clk.phase} ${clk.clock}`,
        desc: snippet + (rec.text.length > 88 ? '…' : '')
      })
      if (items.length >= 12) break
    }
    if (!items.length) {
      const now = formatClock(world.timeMin)
      items.push({
        day: now.day,
        header: `第 ${now.day} 天 · ${now.phase} ${now.clock}（行程起点）`,
        desc: world.flags?.arrived_oakhaven
          ? `队伍已抵达奥克赫斯，当前驻足于${locName(world.playerLocation)}。`
          : '队伍正行进于前往奥克赫斯的城外荒原，暮色降临，暂作休整。'
      })
    }
    return items
  }

  // ============================================================
  // 三、HTML 分页构建器
  // ============================================================

  function buildPortraitHtml(charView) {
    return `
      <div class="okh-portrait-frame" data-okh-act="zoom-char" data-okh-id="${escapeHtml(charView.id)}" data-okh-name="${escapeHtml(charView.name)}" data-okh-role="${escapeHtml(charView.role)}" data-okh-sigil="${escapeHtml(charView.sigil)}" data-okh-src="${escapeHtml(charView.portraitPath)}">
        <span class="okh-pt-c okh-pt-tl"></span><span class="okh-pt-c okh-pt-tr"></span>
        <span class="okh-pt-c okh-pt-bl"></span><span class="okh-pt-c okh-pt-br"></span>
        <img class="okh-portrait-img" src="${escapeHtml(charView.portraitPath)}" alt="${escapeHtml(charView.name)}" onload="this.style.display='block';if(this.nextElementSibling)this.nextElementSibling.style.display='none';" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='flex';">
        <div class="okh-portrait-ph">
          <span class="okh-portrait-icon">${escapeHtml(charView.sigil)}</span>
          <span class="okh-portrait-tag">${escapeHtml(charView.name)}<br><small>肖像位</small></span>
        </div>
        <span class="okh-zoom-badge" aria-hidden="true">🔍</span>
      </div>
    `
  }

  function buildDispatchPage(world, pendingList, presentList) {
    let eventBlock = ''
    if (pendingList.length) {
      const total = pendingList.length
      eventBlock = pendingList.map((ev, idx) => {
        const kicker = total > 1 ? `待决事件 ${idx + 1}/${total} · 局势请托` : '待决事件 · 局势请托'
        const choicesHtml = ev.choices.map(choiceKey => {
          const info = CHOICE_MAP[choiceKey] || { title: choiceKey, hint: '选择执行' }
          return `
            <button type="button" class="okh-decision-row" data-okh-act="fill" data-okh-text="${escapeHtml(info.title)}">
              <span class="okh-decision-text">✦ ${escapeHtml(info.title)}</span>
              <span class="okh-decision-hint">[${escapeHtml(info.hint)}]</span>
            </button>
          `
        }).join('')
        const sep = idx > 0 ? '<div class="okh-art-hr"></div>' : ''
        return `${sep}
          <div class="okh-dispatch-head">
            <div>
              <div class="okh-kicker">${kicker}</div>
              <div class="okh-h1">${escapeHtml(ev.title)}</div>
            </div>
            ${idx === 0 ? '<div class="okh-seal-badge" aria-hidden="true"></div>' : ''}
          </div>
          <div class="okh-narrative">${escapeHtml(ev.text)}</div>
          <div class="okh-sec-label">🪶 待决行动（点击填入输入框）：</div>
          <div class="okh-decision-list">${choicesHtml}</div>
        `
      }).join('')
    } else {
      const journeyState = world.flags?.arrived_oakhaven
        ? `当前位于${locName(world.playerLocation)}，暂无强制待决事件，可自由与在场人物交流或推进行程。`
        : '前传行旅途中，尚未抵达奥克赫斯。可与同行伙伴交谈休整，或继续赶路进镇。'
      eventBlock = `
        <div class="okh-dispatch-head">
          <div>
            <div class="okh-kicker">旅途近况 · ${escapeHtml(locName(world.playerLocation))}</div>
            <div class="okh-h1">${world.flags?.arrived_oakhaven ? '奥克赫斯驻留手札' : '荒原旅途手札'}</div>
          </div>
          <div class="okh-seal-badge" aria-hidden="true"></div>
        </div>
        <div class="okh-narrative">${escapeHtml(journeyState)}</div>
      `
    }

    const mapSrc = joinAsset('maps/world_map.png')
    const mapBlock = `
      <div class="okh-art-hr"></div>
      <div class="okh-map-sec">
        <div class="okh-sub-head">
          <span class="okh-sub-title">🗺 全域态势勘界地图</span>
          <span class="okh-sub-hint">全域勘界图卷</span>
        </div>
        <div class="okh-map-slot" data-okh-act="zoom-map" data-okh-loc="${escapeHtml(locName(world.playerLocation))}" data-okh-src="${escapeHtml(mapSrc)}">
          <span class="okh-mc okh-mc-tl"></span><span class="okh-mc okh-mc-tr"></span>
          <span class="okh-mc okh-mc-bl"></span><span class="okh-mc okh-mc-br"></span>
          <img class="okh-map-img" src="${escapeHtml(mapSrc)}" alt="奥克赫斯全域态势地图" onload="this.style.display='block';if(this.nextElementSibling)this.nextElementSibling.style.display='none';" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='flex';">
          <div class="okh-map-ph">
            <div class="okh-map-compass">✦</div>
            <div class="okh-map-ph-title">奥克赫斯疆域 · 态势勘界卷轴</div>
            <div class="okh-map-ph-pos">当前定位：⚲ ${escapeHtml(locName(world.playerLocation))}</div>
            <div class="okh-map-ph-note">［地图插槽预留 · 待载入 maps/world_map.png］</div>
          </div>
          <span class="okh-zoom-badge" aria-hidden="true">🔍</span>
        </div>
      </div>
    `

    // 在场可交互主要角色（主次联动）
    let selectedId = activePresentId
    if (!presentList.some(c => c.id === selectedId)) {
      selectedId = presentList.find(c => c.id === world.focusNpcId)?.id || presentList[0]?.id || null
    }
    const primary = presentList.find(c => c.id === selectedId) || null
    let presentBody = '<div class="okh-empty-tip">当前地点暂无可交互的主要角色。</div>'
    if (primary) {
      const pills = presentList.map(c => `
        <button type="button" class="okh-p-pill${c.id === primary.id ? ' active' : ''}" data-okh-act="select-present" data-okh-id="${escapeHtml(c.id)}">
          <span>${escapeHtml(c.sigil)}</span><span>${escapeHtml(c.name)}</span>
        </button>
      `).join('')
      const metricsHtml = primary.metrics.map(m =>
        `<span>${escapeHtml(m.label)}：<b>${escapeHtml(m.val)}</b></span>`
      ).join('')
      const actsHtml = primary.actions.map(a => `
        <button type="button" class="okh-char-act-btn" data-okh-act="fill" data-okh-text="${escapeHtml(a.prompt)}">
          <span>✦ ${escapeHtml(a.label)}</span><span class="okh-char-act-tag">[${escapeHtml(a.tag)}]</span>
        </button>
      `).join('')
      presentBody = `
        <div class="okh-present-pills">${pills}</div>
        <div class="okh-primary-box">
          ${buildPortraitHtml(primary)}
          <div class="okh-char-body">
            <div>
              <div class="okh-char-meta">
                <span class="okh-char-name">${escapeHtml(primary.name)} <small>· ${escapeHtml(primary.role)}</small></span>
                <span class="okh-char-stance">${escapeHtml(primary.stance)}</span>
              </div>
              <div class="okh-char-bio">${escapeHtml(primary.bio)}</div>
              <div class="okh-char-metrics">${metricsHtml}</div>
            </div>
            ${actsHtml ? `<div class="okh-char-acts">${actsHtml}</div>` : ''}
          </div>
        </div>
      `
    }

    return `
      <div class="okh-page${activeTab === 'dispatch' ? ' active' : ''}" data-okh-page="dispatch">
        ${eventBlock}
        ${mapBlock}
        <div class="okh-art-hr"></div>
        <div class="okh-present-sec">
          <div class="okh-sub-head">
            <span class="okh-sub-title">👥 在场可交互角色</span>
            <span class="okh-sub-hint">点击名签切换焦点</span>
          </div>
          ${presentBody}
        </div>
      </div>
    `
  }

  function buildRosterPage(world) {
    // 仅展示已开启监控的登场同伴，避免剧透未出场角色；严格仅展示信息，不含操作按钮
    const members = Object.values(world.npcs || {})
      .filter(n => n.monitored === true && n.alive !== false)
      .map(n => buildCharView(world, n))

    const rows = members.length ? members.map(m => {
      const isOpen = openRosterIds.has(m.id)
      const metricsHtml = m.metrics.map(it =>
        `<div class="okh-exp-metric"><span>${escapeHtml(it.label)}：</span><b>${escapeHtml(it.val)}</b></div>`
      ).join('')
      return `
        <div class="okh-member-card${isOpen ? ' open' : ''}" data-okh-member="${escapeHtml(m.id)}">
          <button type="button" class="okh-member-sum" data-okh-act="toggle-roster" data-okh-id="${escapeHtml(m.id)}">
            <span class="okh-mem-left">
              <span class="okh-mem-sigil">${escapeHtml(m.sigil)}</span>
              <span class="okh-mem-name">${escapeHtml(m.name)}</span>
              <span class="okh-mem-job">${escapeHtml(m.role)}</span>
            </span>
            <span class="okh-mem-mid">${escapeHtml(m.stance)}</span>
            <span class="okh-mem-right">
              <span class="okh-mem-bond${m.affIsLove ? ' is-love' : ''}">${escapeHtml(m.affLabel)}</span>
              <span class="okh-mem-chev">›</span>
            </span>
          </button>
          <div class="okh-member-exp">
            <div class="okh-exp-flex">
              ${buildPortraitHtml(m)}
              <div class="okh-exp-info">
                <div class="okh-exp-title">📜 人物档案</div>
                <div class="okh-exp-text">${escapeHtml(m.bio)}</div>
                <div class="okh-exp-title">⚖ 当前状态</div>
                <div class="okh-exp-metrics">${metricsHtml}</div>
              </div>
            </div>
          </div>
        </div>
      `
    }).join('') : '<div class="okh-empty-tip">暂无已登记的同行名册。</div>'

    return `<div class="okh-page${activeTab === 'roster' ? ' active' : ''}" data-okh-page="roster">${rows}</div>`
  }

  function buildSupplyPage(world) {
    const gold = Number.isSafeInteger(world.playerState?.gold) ? world.playerState.gold : 40
    const arrived = Boolean(world.flags?.arrived_oakhaven)
    const arrears = Boolean(world.flags?.inn_arrears)
    const freePass = Boolean(world.flags?.inn_free_pass_today)
    const lodgingText = !arrived
      ? '尚未抵镇（暂免）'
      : (freePass ? '5 金 / 晚（今晚已免）' : (arrears ? '5 金 / 晚（旅店欠账）' : '5 金 / 晚（按日结算）'))

    // 物品栏按 ITEM_CATALOG 查表渲染已注册物品，同时兼容外部（如 MUV）写入的 custom:true 条目
    const catalog = CFG.ITEM_CATALOG || {}
    const rawInv = Array.isArray(world.playerState?.inventory) ? world.playerState.inventory : []
    const resolvedInv = rawInv.filter(Boolean).map(it => {
      if (it.custom === true) {
        return {
          name: it.name || it.id || '未命名物件',
          category: it.category === 'quest' ? 'quest' : 'supply',
          count: Number.isSafeInteger(it.count) ? it.count : 1,
          stackable: true,
          desc: it.desc || ''
        }
      }
      const meta = catalog[it.id] || {}
      return {
        name: meta.name || it.name || String(it.id || it),
        category: meta.category === 'quest' ? 'quest' : 'supply',
        count: Number.isSafeInteger(it.count) ? it.count : 1,
        stackable: meta.stackable !== false,
        desc: meta.desc || it.desc || ''
      }
    })
    const questItems = resolvedInv.filter(it => it.category === 'quest')
    const supplyItems = resolvedInv.filter(it => it.category !== 'quest')
    const shortageTag = world.flags?.supply_shortage ? ' <span class="okh-inv-warn">（补给告罄）</span>' : ''
    const renderList = (list, emptyText) => list.length
      ? list.map(it => {
          const qtyHtml = (it.stackable || it.count > 1)
            ? `<span class="okh-inv-qty">×${it.count}</span>`
            : ''
          const descHtml = it.desc ? `<div class="okh-inv-desc">${escapeHtml(it.desc)}</div>` : ''
          return `<div class="okh-inv-item"><div class="okh-inv-head"><span>✦ ${escapeHtml(it.name)}</span>${qtyHtml}</div>${descHtml}</div>`
        }).join('')
      : `<div class="okh-inv-empty">${emptyText}</div>`

    return `
      <div class="okh-page${activeTab === 'supply' ? ' active' : ''}" data-okh-page="supply">
        <div class="okh-ledger-summary">
          <div class="okh-ledger-box">
            <div class="okh-ledger-label">当前流动资金</div>
            <div class="okh-ledger-val">${gold} 金币</div>
          </div>
          <div class="okh-ledger-box">
            <div class="okh-ledger-label">每日旅店宿费</div>
            <div class="okh-ledger-val okh-dim">${escapeHtml(lodgingText)}</div>
          </div>
        </div>
        <div class="okh-art-hr"></div>
        <div class="okh-inv-cols">
          <div>
            <div class="okh-inv-title">📜 契据与证物</div>
            ${renderList(questItems, '［空置文书格 · 暂无登记物品］')}
          </div>
          <div>
            <div class="okh-inv-title">🧪 随身补给${shortageTag}</div>
            ${renderList(supplyItems, '［空置行囊格 · 暂无登记物品］')}
          </div>
        </div>
      </div>
    `
  }

  function buildChroniclePage(world) {
    const items = getChronicleItems(world)
    const html = items.map(it => `
      <div class="okh-chron-item">
        <div class="okh-chron-node">${it.day}</div>
        <div class="okh-chron-body">
          <div class="okh-chron-day">${escapeHtml(it.header)}</div>
          <div class="okh-chron-desc">${escapeHtml(it.desc)}</div>
        </div>
      </div>
    `).join('')
    return `<div class="okh-page${activeTab === 'chronicle' ? ' active' : ''}" data-okh-page="chronicle"><div class="okh-chron-list">${html}</div></div>`
  }

  /**
   * 生成完整手札 HTML（无 DOM 依赖，Node 沙箱与浏览器均可调用）
   * @param {object} world
   * @returns {string}
   */
  function buildHudHtml(world) {
    if (!world) return ''
    const clk = formatClock(world.timeMin)
    const gold = Number.isSafeInteger(world.playerState?.gold) ? world.playerState.gold : 40
    const arrearsTag = world.flags?.inn_arrears ? '（旅店欠账）' : ''
    const pendingList = getPendingInteractions(world)
    const presentList = getPresentCharacters(world, pendingList)
    const presentHint = presentList.length
      ? `${presentList[0].name}${presentList.length > 1 ? ` 等 ${presentList.length} 人在场` : ' 在场'}`
      : '暂无同行在场'

    const curDay = clk.day
    const arenaDay = Number.isFinite(world.flags?.bloodyArenaDay) ? world.flags.bloodyArenaDay : 1
    const isMartialLaw = Boolean(
      (world.flags?.martial_law || world.flags?.panic) ||
      (world.flags?.bloody_arena && curDay >= arenaDay && (curDay - arenaDay) < 7)
    )
    const townTags = isMartialLaw ? ' <span class="okh-meta-item okh-badge-warn">［安保戒严 · 人心惶惶］</span>' : ''

    return `
      <div class="okh-hud-canvas">
        <span class="okh-corner okh-corner-tl" aria-hidden="true"></span>
        <span class="okh-corner okh-corner-br" aria-hidden="true"></span>
        <div class="okh-crest">◈ OAKHAVEN CHRONICLES ◈</div>
        <div class="okh-top-meta okh-row-time">
          <div class="okh-meta-left">
            <span class="okh-meta-item">⏱ <span class="okh-value">第 ${clk.day} 天 · ${escapeHtml(clk.phase)}（${escapeHtml(clk.weekday)}）</span> <span class="okh-clock">${clk.clock}</span></span>
            <span class="okh-meta-item okh-meta-loc">⚲ ${escapeHtml(locName(world.playerLocation))}</span>${townTags}
          </div>
          <div class="okh-meta-gold">¤ ${gold} 金${escapeHtml(arrearsTag)}</div>
        </div>
        <div class="okh-tabs-bar">
          <div class="okh-tabs-list">
            <button type="button" class="okh-tab-btn${activeTab === 'dispatch' ? ' active' : ''}" data-okh-act="tab" data-okh-tab="dispatch">📖 旅途手札</button>
            <button type="button" class="okh-tab-btn${activeTab === 'roster' ? ' active' : ''}" data-okh-act="tab" data-okh-tab="roster">👥 同伴名册</button>
            <button type="button" class="okh-tab-btn${activeTab === 'supply' ? ' active' : ''}" data-okh-act="tab" data-okh-tab="supply">🎒 随身行囊</button>
            <button type="button" class="okh-tab-btn${activeTab === 'chronicle' ? ' active' : ''}" data-okh-act="tab" data-okh-tab="chronicle">📅 战役历程</button>
          </div>
          <div class="okh-presence-tag"><span class="okh-presence-dot"></span><span>${escapeHtml(presentHint)}</span></div>
        </div>
        ${buildDispatchPage(world, pendingList, presentList)}
        ${buildRosterPage(world)}
        ${buildSupplyPage(world)}
        ${buildChroniclePage(world)}
      </div>
    `.trim()
  }

  function buildCompactHudHtml(world) {
    if (!world) return ''
    const clk = formatClock(world.timeMin)
    const gold = Number.isSafeInteger(world.playerState?.gold) ? world.playerState.gold : 40
    const arrearsTag = world.flags?.inn_arrears ? '（旅店欠账）' : ''
    const curDay = clk.day
    const arenaDay = Number.isFinite(world.flags?.bloodyArenaDay) ? world.flags.bloodyArenaDay : 1
    const isMartialLaw = Boolean(
      (world.flags?.martial_law || world.flags?.panic) ||
      (world.flags?.bloody_arena && curDay >= arenaDay && (curDay - arenaDay) < 7)
    )
    const townTags = isMartialLaw ? ' <span>［安保戒严 · 人心惶惶］</span>' : ''
    return `
      <div class="okh-hud-compact okh-row-time">
        <span>⏱ 第 ${clk.day} 天 · ${escapeHtml(clk.phase)}（${escapeHtml(clk.weekday)}） ${clk.clock}</span>
        <span>⚲ ${escapeHtml(locName(world.playerLocation))}</span>${townTags}
        <span class="okh-meta-gold">¤ ${gold} 金${escapeHtml(arrearsTag)}</span>
      </div>
    `.trim()
  }

  function buildWatchHtml(world) {
    if (!world) return ''
    const STAGE = CFG.STAGES
    return Object.values(world.npcs || {}).filter(n => n.monitored === true).map(n => {
      const mark = n.location === world.playerLocation ? '●' : '○'
      const stage = n.hasStage === false ? '—' : (STAGE[n.stage] ?? n.stage)
      const busy = n.activity ? `｜${n.activity.label}` : ''
      const vals = Object.entries(n.values || {}).map(([k, v]) => `${k}:${Math.round(v * 100) / 100}`).join(' ')
      return `${mark} ${n.name}｜${locName(n.location)}｜${stage}｜${vals}${busy}`
    }).join('\n')
  }

  // ============================================================
  // 四、样式、热更新事件委托与 Lightbox 大图模态
  // ============================================================

  function buildCss() {
    return `
.okh-hud{--g-lt:#fff5e3;--g-mn:#dfc89a;--g-dm:#9c8a70;--t-mn:#e8dfd3;--t-sb:#b3a594;--t-dm:#8a7c6a;margin:12px 0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;font-size:13px;line-height:1.5;color:var(--t-mn);user-select:none}
.okh-hud *{box-sizing:border-box}
.okh-hud-compact{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;padding:7px 14px;border-radius:4px;background:rgba(18,14,10,.92);border:1px solid rgba(195,162,108,.28);font-size:12px;color:var(--t-sb)}
.okh-hud-canvas{position:relative;max-width:760px;margin:0 auto;padding:16px 22px 24px;border-radius:4px;border:1px solid rgba(195,162,108,.32);background-color:#120e0a;background-image:radial-gradient(ellipse at 50% 15%,rgba(28,22,17,.72) 0%,rgba(14,11,8,.94) 80%,rgba(8,6,4,.98) 100%),url('${ASSET_UI.journalBg}');background-repeat:repeat;background-size:760px auto;background-position:top center;box-shadow:0 14px 40px rgba(0,0,0,.85);overflow:hidden}
.okh-corner{position:absolute;width:42px;height:42px;background:url('${ASSET_UI.corner}') no-repeat center/contain;opacity:.35;pointer-events:none}
.okh-corner-tl{top:6px;left:6px}.okh-corner-br{bottom:6px;right:6px;transform:rotate(180deg)}
.okh-crest{text-align:center;font-family:"Cinzel","Songti SC","SimSun",serif;font-size:10px;letter-spacing:2px;color:var(--g-dm);opacity:.82;margin-bottom:8px}
.okh-top-meta{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;padding-bottom:10px;border-bottom:1px solid rgba(195,162,108,.18)}
.okh-meta-left{display:flex;align-items:center;flex-wrap:wrap;gap:14px}
.okh-meta-item{font-size:12.5px;color:var(--t-sb)}.okh-meta-loc{color:var(--g-mn);font-weight:600}
.okh-clock{font-variant-numeric:tabular-nums;color:var(--g-dm);margin-left:4px}
.okh-meta-gold{font-size:12.5px;font-weight:700;color:#f3db9e}
.okh-tabs-bar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding:10px 0 8px;border-bottom:1px solid rgba(195,162,108,.15);margin-bottom:14px}
.okh-tabs-list{display:flex;gap:14px;flex-wrap:wrap}
.okh-tab-btn{background:transparent;border:none;border-bottom:2px solid transparent;padding:4px 2px;color:var(--t-dm);font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;transition:all .2s}
.okh-tab-btn:hover{color:var(--g-mn)}.okh-tab-btn.active{color:var(--g-lt);border-bottom-color:var(--g-mn)}
.okh-presence-tag{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--g-dm)}
.okh-presence-dot{width:6px;height:6px;border-radius:50%;background:#689975;box-shadow:0 0 6px #689975}
.okh-page{display:none}.okh-page.active{display:block}
.okh-dispatch-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px}
.okh-kicker{font-size:11px;color:var(--g-dm);letter-spacing:1px;margin-bottom:3px}
.okh-h1{font-family:"Cinzel","Songti SC","SimSun",serif;font-size:17px;font-weight:700;color:#fff6e5}
.okh-seal-badge{width:46px;height:46px;flex-shrink:0;background:url('${ASSET_UI.seal}') no-repeat center/contain;filter:drop-shadow(0 3px 6px rgba(0,0,0,.7))}
.okh-narrative{color:#dfd3c3;font-size:13.5px;line-height:1.75;padding:6px 0 12px}
.okh-sec-label{font-size:11.5px;color:var(--g-mn);margin-bottom:6px;font-weight:600}
.okh-decision-list{display:flex;flex-direction:column;gap:5px}
.okh-decision-row{width:100%;text-align:left;background:transparent;border:none;border-left:2px solid rgba(195,162,108,.3);padding:7px 12px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:10px;color:inherit;font:inherit;transition:all .2s}
.okh-decision-row:hover{background:rgba(195,162,108,.1);border-left-color:var(--g-lt);padding-left:16px}
.okh-decision-text{font-size:13px;color:var(--g-lt)}.okh-decision-hint{font-size:11px;color:var(--g-dm);white-space:nowrap}
.okh-art-hr{position:relative;height:1px;margin:16px 0;background:linear-gradient(90deg,transparent 0%,rgba(223,200,154,.45) 50%,transparent 100%)}
.okh-art-hr::after{content:'❖';position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:#130f0b;padding:0 8px;color:rgba(223,200,154,.65);font-size:10px}
.okh-sub-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px}
.okh-sub-title{font-family:"Cinzel","Songti SC","SimSun",serif;font-size:12.5px;font-weight:600;color:var(--g-mn)}
.okh-sub-hint{font-size:11px;color:var(--t-dm)}
.okh-map-slot{position:relative;width:100%;height:152px;border-radius:4px;border:1px solid rgba(195,162,108,.35);background:#110d0a;background-image:radial-gradient(ellipse at 50% 50%,rgba(32,25,19,.6) 0%,rgba(12,9,6,.95) 100%),url('${ASSET_UI.darkBg}');background-size:cover;background-position:center;box-shadow:inset 0 0 20px rgba(0,0,0,.95);overflow:hidden;cursor:zoom-in;display:flex;align-items:center;justify-content:center;transition:border-color .2s}
.okh-map-slot:hover{border-color:rgba(223,200,154,.75)}
.okh-map-img{width:100%;height:100%;object-fit:cover;display:none}
.okh-map-ph{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center;padding:10px}
.okh-map-compass{font-size:26px;color:var(--g-mn);opacity:.85}
.okh-map-ph-title{font-family:"Cinzel","Songti SC","SimSun",serif;font-size:13px;font-weight:700;color:#fff6e5}
.okh-map-ph-pos{font-size:12px;color:var(--g-mn)}.okh-map-ph-note{font-size:10.5px;color:var(--g-dm)}
.okh-mc{position:absolute;width:10px;height:10px;border-color:rgba(223,200,154,.7);border-style:solid;pointer-events:none}
.okh-mc-tl{top:4px;left:4px;border-width:2px 0 0 2px}.okh-mc-tr{top:4px;right:4px;border-width:2px 2px 0 0}
.okh-mc-bl{bottom:4px;left:4px;border-width:0 0 2px 2px}.okh-mc-br{bottom:4px;right:4px;border-width:0 2px 2px 0}
.okh-present-pills{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.okh-p-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:3px;border:1px solid rgba(195,162,108,.25);background:rgba(20,16,12,.55);color:var(--t-sb);font:inherit;font-size:12px;cursor:pointer;transition:all .2s}
.okh-p-pill:hover{border-color:rgba(223,200,154,.55);color:var(--g-lt)}
.okh-p-pill.active{border-color:var(--g-mn);background:rgba(223,200,154,.15);color:var(--g-lt);font-weight:600}
.okh-primary-box{display:flex;gap:14px;padding:10px 12px;background:rgba(16,12,9,.45);border-left:2px solid rgba(223,200,154,.45)}
.okh-portrait-frame{width:100px;height:136px;flex-shrink:0;position:relative;background:#0f0c09;border:1px solid rgba(195,162,108,.4);border-radius:3px;box-shadow:inset 0 0 14px rgba(0,0,0,.9);overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:center;cursor:zoom-in;transition:border-color .2s}
.okh-portrait-frame:hover{border-color:rgba(223,200,154,.85)}
.okh-portrait-img{width:100%;height:100%;object-fit:cover;object-position:top center;display:none}
.okh-portrait-ph{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;color:var(--g-dm)}
.okh-portrait-icon{font-size:24px;color:var(--g-mn)}.okh-portrait-tag{font-size:10px;line-height:1.3;color:var(--t-sb)}
.okh-pt-c{position:absolute;width:6px;height:6px;border-color:rgba(223,200,154,.6);border-style:solid;pointer-events:none}
.okh-pt-tl{top:2px;left:2px;border-width:1px 0 0 1px}.okh-pt-tr{top:2px;right:2px;border-width:1px 1px 0 0}
.okh-pt-bl{bottom:2px;left:2px;border-width:0 0 1px 1px}.okh-pt-br{bottom:2px;right:2px;border-width:0 1px 1px 0}
.okh-zoom-badge{position:absolute;bottom:4px;right:4px;width:18px;height:18px;background:rgba(14,11,8,.85);border:1px solid rgba(223,200,154,.45);border-radius:2px;font-size:11px;color:var(--g-mn);display:flex;align-items:center;justify-content:center;opacity:.75;pointer-events:none}
.okh-char-body{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:space-between;gap:8px}
.okh-char-meta{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px;margin-bottom:4px}
.okh-char-name{font-family:"Cinzel","Songti SC","SimSun",serif;font-size:14.5px;font-weight:700;color:#fff6e5}
.okh-char-name small{font-size:11.5px;font-weight:400;color:var(--g-dm)}
.okh-char-stance{font-size:11px;color:var(--g-mn)}
.okh-char-bio{font-size:12px;color:var(--t-sb);line-height:1.55;margin-bottom:6px}
.okh-char-metrics{display:flex;flex-wrap:wrap;gap:12px;font-size:11.5px;color:var(--t-dm)}
.okh-char-metrics b{color:var(--g-lt);font-weight:600}
.okh-char-acts{display:flex;flex-direction:column;gap:4px}
.okh-char-act-btn{width:100%;text-align:left;background:transparent;border:none;border-left:2px solid rgba(195,162,108,.28);padding:5px 10px;color:var(--g-lt);font:inherit;font-size:12px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:all .2s}
.okh-char-act-btn:hover{background:rgba(195,162,108,.1);border-left-color:var(--g-lt);padding-left:14px}
.okh-char-act-tag{font-size:10.5px;color:var(--g-dm)}
.okh-member-card{border-bottom:1px solid rgba(195,162,108,.14)}
.okh-member-sum{width:100%;background:transparent;border:none;padding:9px 4px;display:flex;align-items:center;justify-content:space-between;gap:10px;color:inherit;font:inherit;cursor:pointer;text-align:left}
.okh-member-sum:hover{background:rgba(195,162,108,.06)}
.okh-mem-left{display:flex;align-items:center;gap:8px;min-width:150px}
.okh-mem-sigil{color:var(--g-mn)}.okh-mem-name{font-weight:700;color:var(--g-lt)}.okh-mem-job{font-size:11px;color:var(--g-dm)}
.okh-mem-mid{flex:1;font-size:12px;color:var(--t-sb);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.okh-mem-right{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--g-mn)}
.okh-mem-bond.is-love{color:#c76f82}.okh-mem-chev{transition:transform .2s;color:var(--g-dm)}
.okh-member-card.open .okh-mem-chev{transform:rotate(90deg)}
.okh-member-exp{display:none;padding:8px 8px 14px 12px}.okh-member-card.open .okh-member-exp{display:block}
.okh-exp-flex{display:flex;gap:14px}.okh-exp-info{flex:1;min-width:0}
.okh-exp-title{font-size:11.5px;font-weight:700;color:var(--g-mn);margin:4px 0}
.okh-exp-text{font-size:12px;color:var(--t-sb);line-height:1.6;margin-bottom:8px}
.okh-exp-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:6px;font-size:12px;color:var(--t-dm)}
.okh-exp-metric b{color:var(--g-lt);font-weight:600}
.okh-ledger-summary{display:flex;justify-content:space-between;gap:16px;padding:10px 14px;background:rgba(20,16,12,.55);border-left:2px solid rgba(195,162,108,.45)}
.okh-ledger-box{flex:1}.okh-ledger-label{font-size:11px;color:var(--t-dm);margin-bottom:2px}
.okh-ledger-val{font-size:14px;font-weight:700;color:#f3db9e}.okh-ledger-val.okh-dim{color:var(--g-dm)}
.okh-inv-cols{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.okh-inv-title{font-size:12px;font-weight:700;color:var(--g-mn);margin-bottom:6px}
.okh-inv-warn,.okh-badge-warn{font-size:11px;font-weight:600;color:#d67b7b}
.okh-inv-item{font-size:12.5px;color:var(--t-mn);padding:5px 0;border-bottom:1px dashed rgba(195,162,108,.15)}
.okh-inv-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.okh-inv-qty{font-size:11.5px;font-weight:700;color:#f3db9e;font-variant-numeric:tabular-nums;white-space:nowrap}
.okh-inv-desc{font-size:11px;color:var(--t-dm);line-height:1.45;margin-top:2px;padding-left:13px}
.okh-inv-empty,.okh-empty-tip{font-size:12px;color:var(--t-dm);font-style:italic;padding:6px 0}
.okh-chron-list{display:flex;flex-direction:column;gap:10px}
.okh-chron-item{display:flex;gap:12px;align-items:flex-start}
.okh-chron-node{width:26px;height:26px;flex-shrink:0;border-radius:50%;border:1px solid rgba(223,200,154,.45);background:rgba(20,16,12,.8);color:var(--g-mn);font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center}
.okh-chron-day{font-size:12px;font-weight:700;color:var(--g-lt);margin-bottom:2px}
.okh-chron-desc{font-size:12px;color:var(--t-sb);line-height:1.55}
.okh-watch{display:none;white-space:pre-wrap;font-family:ui-monospace,"Cascadia Code",monospace;font-size:12px;color:#8a8175;margin-top:8px}
.okh-lb-overlay{position:fixed;inset:0;z-index:99999;background:rgba(6,4,3,.9);backdrop-filter:blur(5px);display:none;align-items:center;justify-content:center;padding:20px}
.okh-lb-overlay.active{display:flex}
.okh-lb-frame{position:relative;max-width:90vw;max-height:90vh;padding:22px 24px 18px;border-radius:4px;border:1px solid rgba(223,200,154,.55);background-color:#120e0a;background-image:radial-gradient(ellipse at 50% 20%,rgba(28,22,17,.8) 0%,rgba(10,8,5,.98) 100%),url('${ASSET_UI.journalBg}');background-size:cover;display:flex;flex-direction:column;align-items:center;gap:10px;color:#e8dfd3}
.okh-lb-close{position:absolute;top:-12px;right:-12px;width:30px;height:30px;border-radius:50%;background:#1c1510;border:1px solid rgba(223,200,154,.6);color:#fff5e3;cursor:pointer}
.okh-lb-box{max-width:80vw;max-height:68vh;background:#090705;border:1px solid rgba(195,162,108,.3);display:flex;align-items:center;justify-content:center;overflow:hidden}
.okh-lb-img{max-width:100%;max-height:66vh;object-fit:contain;display:none}
.okh-lb-ph{width:300px;height:380px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:20px;color:#9c8a70}
.okh-lb-ph.is-map{width:min(600px,78vw);height:360px}
.okh-lb-ph-icon{font-size:48px;color:#dfc89a}.okh-lb-name{font-size:15px;font-weight:700;color:#fff6e5}.okh-lb-desc{font-size:12px;color:#b3a594}
@media(max-width:560px){.okh-primary-box,.okh-exp-flex{flex-direction:column}.okh-inv-cols{grid-template-columns:1fr}}
    `.trim()
  }

  function ensureHudStyle() {
    if (typeof document === 'undefined' || !document.head) return
    let style = document.getElementById('okh-hud-style')
    if (!style) {
      style = document.createElement('style')
      style.id = 'okh-hud-style'
      document.head.appendChild(style)
    }
    // 总是覆写最新样式，避免热更新时旧节点拦截死锁
    style.textContent = buildCss()
  }

  function ensureLightbox() {
    if (typeof document === 'undefined' || !document.body) return null
    let lb = document.getElementById('okh-hud-lightbox')
    if (lb) lb.remove()
    lb = document.createElement('div')
    lb.id = 'okh-hud-lightbox'
    lb.className = 'okh-lb-overlay'
    lb.innerHTML = `
      <div class="okh-lb-frame">
        <button type="button" class="okh-lb-close" data-okh-act="close-lb" title="关闭">✕</button>
        <div class="okh-lb-box">
          <img class="okh-lb-img" alt="大图" onload="this.style.display='block';if(this.nextElementSibling)this.nextElementSibling.style.display='none';" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='flex';">
          <div class="okh-lb-ph">
            <div class="okh-lb-ph-icon"></div>
            <div class="okh-lb-name"></div>
            <div class="okh-lb-desc"></div>
          </div>
        </div>
        <div class="okh-lb-name" data-okh-lb-cap></div>
        <div class="okh-lb-desc" data-okh-lb-sub></div>
      </div>
    `
    document.body.appendChild(lb)
    return lb
  }

  function openLightbox(opts) {
    if (typeof document === 'undefined') return
    const lb = document.getElementById('okh-hud-lightbox') || ensureLightbox()
    if (!lb) return
    const img = lb.querySelector('.okh-lb-img')
    const ph = lb.querySelector('.okh-lb-ph')
    const icon = lb.querySelector('.okh-lb-ph-icon')
    const phName = ph?.querySelector('.okh-lb-name')
    const phDesc = ph?.querySelector('.okh-lb-desc')
    const cap = lb.querySelector('[data-okh-lb-cap]')
    const sub = lb.querySelector('[data-okh-lb-sub]')
    if (ph) ph.classList.toggle('is-map', Boolean(opts.isMap))
    if (icon) icon.textContent = opts.sigil || '◈'
    if (phName) phName.textContent = opts.title || ''
    if (phDesc) phDesc.textContent = opts.pathHint || ''
    if (cap) cap.textContent = opts.title || ''
    if (sub) sub.textContent = opts.subtitle || ''
    if (img) {
      img.style.display = 'none'
      if (ph) ph.style.display = 'flex'
      img.src = opts.src || ''
    }
    lb.classList.add('active')
  }

  function closeLightbox() {
    if (typeof document === 'undefined') return
    const lb = document.getElementById('okh-hud-lightbox')
    if (lb) lb.classList.remove('active')
  }

  function fillTavernInput(text) {
    if (typeof document === 'undefined' || !text) return
    const input = document.getElementById('send_textarea') ||
      document.querySelector('#send_form textarea') ||
      document.getElementById('tavern-input')
    if (!input) return
    input.value = text
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
    if (typeof input.focus === 'function') input.focus()
  }

  function bindGlobalEvents() {
    if (typeof document === 'undefined') return
    // 热插拔：先清理旧版本事件与模态节点，再挂新闭包
    if (typeof root.__OKH_HUD_CLEANUP__ === 'function') {
      try { root.__OKH_HUD_CLEANUP__() } catch (_) {}
    }
    ensureLightbox()

    const onClick = event => {
      const overlay = event.target?.id === 'okh-hud-lightbox' ? event.target : null
      if (overlay) { closeLightbox(); return }
      const el = event.target?.closest?.('[data-okh-act]')
      if (!el) return
      const act = el.getAttribute('data-okh-act')
      if (act === 'tab') {
        activeTab = el.getAttribute('data-okh-tab') || 'dispatch'
        rerenderCurrent()
      } else if (act === 'select-present') {
        activePresentId = el.getAttribute('data-okh-id')
        rerenderCurrent()
      } else if (act === 'toggle-roster') {
        const id = el.getAttribute('data-okh-id')
        if (id) {
          if (openRosterIds.has(id)) openRosterIds.delete(id)
          else openRosterIds.add(id)
          rerenderCurrent()
        }
      } else if (act === 'fill') {
        fillTavernInput(el.getAttribute('data-okh-text') || '')
      } else if (act === 'zoom-char') {
        openLightbox({
          isMap: false,
          sigil: el.getAttribute('data-okh-sigil'),
          title: el.getAttribute('data-okh-name'),
          subtitle: el.getAttribute('data-okh-role'),
          pathHint: `肖像槽位：${el.getAttribute('data-okh-src') || ''}`,
          src: el.getAttribute('data-okh-src')
        })
      } else if (act === 'zoom-map') {
        openLightbox({
          isMap: true,
          sigil: '🗺',
          title: '奥克赫斯疆域 · 全域态势地图',
          subtitle: `当前定位：${el.getAttribute('data-okh-loc') || ''}`,
          pathHint: `地图槽位：${el.getAttribute('data-okh-src') || ''}`,
          src: el.getAttribute('data-okh-src')
        })
      } else if (act === 'close-lb') {
        closeLightbox()
      }
    }

    const onKeyDown = event => {
      if (event.key === 'Escape') closeLightbox()
    }

    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKeyDown)
    root.__OKH_HUD_CLEANUP__ = () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKeyDown)
      const oldLb = document.getElementById('okh-hud-lightbox')
      if (oldLb) oldLb.remove()
    }
  }

  function buildRenderSignature(world) {
    const npcSig = Object.values(world.npcs || {})
      .map(n => `${n.id}:${n.monitored ? 1 : 0}:${n.location}:${n.stage ?? ''}:${n.activity?.label || ''}:${JSON.stringify(n.values || {})}`)
      .join('|')
    const pendSig = Object.values(world.bg?.eventStates || {})
      .filter(s => s?.status === 'pending')
      .map(s => `${s.definitionId}:${s.npcId || ''}`)
      .join(',')
    const qLen = Array.isArray(world.bg?.queue) ? world.bg.queue.length : 0
    const invSig = JSON.stringify(world.playerState?.inventory || [])
    return [
      world.timeMin, world.playerLocation, world.focusNpcId || '',
      world.playerState?.gold ?? 40,
      world.flags?.inn_arrears ? 1 : 0,
      world.flags?.inn_free_pass_today ? 1 : 0,
      world.flags?.supply_shortage ? 1 : 0,
      world.flags?.arrived_oakhaven ? 1 : 0,
      world.flags?.ed_awake ? 1 : 0,
      world.flags?.ed_permanently_joined ? 1 : 0,
      world.flags?.alice_rescued ? 1 : 0,
      world.npcs?.ed?.flags?.ed_teach_count ?? 0,
      invSig, pendSig, qLen, npcSig
    ].join('#')
  }

  function rerenderCurrent() {
    if (!lastWorldRef || typeof document === 'undefined') return
    const huds = document.querySelectorAll('[data-okh-hud]')
    if (!huds.length) return
    const latest = huds[huds.length - 1]
    latest.innerHTML = buildHudHtml(lastWorldRef)
    latest.setAttribute('data-okh-ready', '1')
  }

  let eventsBound = false

  /**
   * 渲染所有 HUD 容器（按状态指纹做脏检查，避免定时器覆盖玩家分页/折页交互）
   * @param {boolean} force
   * @returns {boolean}
   */
  function render(force = false) {
    if (typeof document === 'undefined') return false
    ensureHudStyle()
    if (!eventsBound) {
      bindGlobalEvents()
      eventsBound = true
    }

    const world = W.loadWorld()
    if (!world) return false
    lastWorldRef = world

    const sig = buildRenderSignature(world)
    const huds = document.querySelectorAll('[data-okh-hud]')
    let found = false

    for (let i = 0; i < huds.length; i++) {
      const el = huds[i]
      const isLatest = i === huds.length - 1
      const modeTag = isLatest ? 'full' : 'compact'
      const targetSig = `${modeTag}:${sig}`
      if (force || el.getAttribute('data-okh-sig') !== targetSig) {
        el.innerHTML = isLatest ? buildHudHtml(world) : buildCompactHudHtml(world)
        el.setAttribute('data-okh-sig', targetSig)
        el.setAttribute('data-okh-ready', '1')
      }
      found = true
    }

    const watches = document.querySelectorAll('[data-okh-watch]')
    for (const el of watches) {
      el.hidden = !watchVisible
      el.textContent = watchVisible ? buildWatchHtml(world) : ''
      found = true
    }

    return found
  }

  let _timer = null

  function startHud(intervalMs = 1000) {
    if (_timer) return
    try { render(true) } catch (_) { /* 静默，不打断启动 */ }
    _timer = setInterval(() => {
      try { render(false) } catch (_) { /* 静默，不打断页面 */ }
    }, intervalMs)
    console.log('[APP] HUD 已启动 · 每 ' + intervalMs + 'ms 刷新')
  }

  function stopHud() {
    if (!_timer) return
    clearInterval(_timer)
    _timer = null
    console.log('[APP] HUD 已停止')
  }

  root.OKH_APP_HUD = Object.freeze({
    setWatchVisible(value) { watchVisible = value === true; return render(true) },
    setAssetBase(base) { assetBase = String(base ?? ''); return render(true) },
    LOCATION_NAMES,
    phaseName,
    locName,
    buildHudHtml,
    buildWatchHtml,
    render,
    startHud,
    stopHud
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_HUD
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
;

;
/**
 * @module okh_app_entry
 * @updated 2026-11-10 23:35
 * @status active
 * @reason 生命周期和宿主配置统一入口，不隐藏初始化或保存失败
 */
(function (root) {
  'use strict';
  const u = root.OKHBackgroundModules?.utils, GPT = root.OKHBackground;
  const CFG = root.OKH_APP_CONFIG, W = root.OKH_APP_WORLD, A = root.OKH_APP_ADAPTER;
  const H = root.OKH_APP_HOOK, D = root.OKH_APP_DEBUG, HUD = root.OKH_APP_HUD;
  if (!u || !CFG || !W || !A || !H || !D) throw Error('entry 依赖缺失');
  u.check(GPT?.features?.receiptCommit && GPT.features.timeEffects && GPT.features.activitySequences,
    '需要同时更新 gpt_core_all.js 到本修复版；不能混用旧核心');
  let started = false;
  function configure(options = {}) {
    u.check(!started, '修改宿主配置前请先 await OKH_APP.stop()');
    W.configure(options); H.configure(options);
    return info();
  }
  function info() {
    return { coreVersion: GPT.version, schemaVersion: CFG.SCHEMA_VERSION, mode: W.store.mode,
      chatId: W.chatId(), revision: W.loadWorld()?.bg.revision ?? null };
  }
  async function init(force = false) {
    const world = await W.ensureWorld(force);
    console.log('[OKH_APP] 初始化已保存', info());
    return world;
  }
  async function start() {
    const world = await init();
    const hooked = H.attach();
    if (HUD) HUD.startHud(1000);
    started = true;
    return { world, hooked, hud: Boolean(HUD), storage: info() };
  }
  async function stop() {
    H.detach(); if (HUD) HUD.stopHud();
    await H.cancelGeneration(); started = false;
  }
  async function save(world, { debug = false } = {}) {
    u.check(debug === true, '直接保存仅供显式调试；正式回复请用 step/onMessage');
    const s = W.session(), before = W.loadWorld(s), state = u.clone(world);
    u.check(before && state.bg?.version === 2, '调试存档版本非法');
    state.bg.revision = before.bg.revision + 1;
    return W.commit(s, { expectedRevision: before.bg.revision, state, checkpoint: null, reason: 'debug-save' });
  }
  root.OKH_APP = Object.freeze({ configure, init, start, stop, info, save,
    world: W.loadWorld, reset: () => W.resetWorld(), importLegacy: () => W.importLegacy(),
    migrateSchema: () => W.migrateSchema(),
    step: H.step, applyFront: H.applyFront, beforeGeneration: H.beforeGeneration, onMessage: H.onMessage,
    cancelGeneration: H.cancelGeneration, syncHistory: H.syncHistory, restore: H.restore,
    config: A.runtimeConfig, status: D.status, watch: D.watch, ledger: D.ledger, queue: D.queue,
    renderHud: HUD ? HUD.render : () => false,
    showWatch: value => HUD?.setWatchVisible(value), CFG, W, A, H, D, HUD });
  console.log('[OKH_APP] 修复版已加载；请 await OKH_APP.init()，自动运行用 await OKH_APP.start()');
})(globalThis);
