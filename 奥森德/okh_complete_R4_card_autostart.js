// GENERATED: 修改 core/、app/ 后重新运行构建，不直接编辑合订本。
/**
 * @module okh_utils
 * @updated 2026-11-11 00:08
 * @status implemented
 * @reason 通用校验、深拷贝、时段，以及待互动事件选项与取消策略校验
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
          spec.effects === undefined || (spec.effects && typeof spec.effects === 'object'),
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
 * @status implemented
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
 * @status implemented
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
/**
 * @module okh_effects
 * @updated 2026-11-10 23:25
 * @status implemented
 * @reason 集中结算位置、专属数值和标记，补充移动门禁校验
 */
(function (root) {
  'use strict';

  function create({ utils: u }) {
    function one(world, npc, data, ctx, config) {
      const allowed = new Set([
        'move',
        'add',
        'npcFlags',
        'worldFlags',
        'monitored'
      ]);

      Object.keys(data).forEach(name => {
        u.check(
          allowed.has(name),
          '未知效果字段：' + name
        );
      });

      u.check(
        npc ||
        (!data.add && !data.move && !data.npcFlags && data.monitored === undefined),
        '世界效果不能隐式修改角色'
      );

      if (data.move !== undefined) {
        u.check(
          u.id(data.move) &&
          !ctx.blockedIds?.has(npc.id) &&
          !npc.activity,
          '不能后台移动互动中或被活动占用的角色'
        );

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

      if (data.monitored !== undefined) {
        u.check(typeof data.monitored === 'boolean', 'monitored 必须是布尔值');
        npc.monitored = data.monitored;
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


;
/**
 * @module okh_events
 * @updated 2026-11-11 00:05
 * @status implemented
 * @reason 条件事件、待互动选择与选项适用条件校验、原子结算及队列覆盖，不访问HUD或调用LLM
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

    function evaluate(world, config, ctx) {
      world.bg.eventStates ||= {};

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
      world.flags = draft.flags;
      world.npcs = draft.npcs;
      world.bg = draft.bg;
    }

    return { evaluate, resolve, emit, prepare, acknowledge, supersede };
  }

  const registry = root.OKHBackgroundModules ||= Object.create(null);
  if (registry.events) throw Error('重复加载 okh_events');
  registry.events = create;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = create;
  }
})(globalThis);

;
/**
 * @module okh_nodes
 * @updated 2026-11-10 23:25
 * @status implemented
 * @reason 专属数值经节点推进阶段；跳过非阶段角色
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

      npc.stage = node.toStage;

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
 * @updated 2026-11-11 00:05
 * @status implemented
 * @reason 统一时间语义的回执时间线穿插引擎：待决应答默认start、新发生里程碑与叙事事实默认end（或at），推进前保留起点refresh防跨边界漏事件
 */
(function (root) {
  'use strict';

  function create({ utils: u, rules, activity, effects, events, nodes }) {
    function refresh(world, config, blockedIds, report) {
      const ctx = { world, phase: u.phaseAt(world.timeMin, config), blockedIds };
      report.released.push(...activity.refresh(world, config, ctx));
      events.evaluate(world, config, ctx);
      nodes.evaluate(world, config, ctx);
      report.released.push(...activity.refresh(world, config, ctx));
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
          bonds: [], room: null, resolveNodes: [], resolveEvents: [], activities: []
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

      if (front.room) {
        getBucket(map, resolveAt(front.room.at, toMin, fromMin, toMin)).room = front.room;
      }

      const hasMeta = front.flags || front.focusNpcId !== undefined || front.playerInjury !== undefined ||
        front.clockState !== undefined || front.timeCheck !== undefined;
      if (hasMeta) {
        getBucket(map, resolveAt(front.metaAt, toMin, fromMin, toMin)).meta = {
          flags: front.flags, focusNpcId: front.focusNpcId, playerInjury: front.playerInjury,
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
      if (meta.playerInjury !== undefined) {
        u.check(u.minute(meta.playerInjury.level) && typeof meta.playerInjury.type === 'string', '受伤申报非法');
        world.playerState ||= {};
        world.playerState.injury = u.clone(meta.playerInjury);
      }
      if (meta.clockState !== undefined) {
        u.check(u.minute(meta.clockState.count) && u.minute(meta.clockState.creditedMin), '时间保底状态非法');
        world.bg.clockState = u.clone(meta.clockState);
      }
      if (meta.timeCheck !== undefined) world.bg.lastTimeCheck = u.clone(meta.timeCheck);
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

      for (const m of bucket.moves) {
        const npc = m.npcId ? world.npcs[m.npcId] : null;
        assertCanMove(world, m.to, npc, config);
        if (npc) npc.location = m.to;
        else world.playerLocation = m.to;
      }

      for (const p of bucket.patches) {
        effects.apply(world, world.npcs[p.id], { add: p.add, npcFlags: p.npcFlags }, { blockedIds }, config);
      }
      applyMeta(world, bucket.meta);

      const ctx = { world, phase: u.phaseAt(world.timeMin, config), blockedIds };
      if (bucket.bonds.length && typeof config.resolveBonds === 'function') {
        const changes = config.resolveBonds(world, bucket.bonds, ctx);
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
/**
 * @module okh_api
 * @updated 2026-11-11 00:08
 * @status implemented
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
 * @updated 2026-11-11 00:08
 * @status implemented
 * @reason 串行读写、保存请求批次与兼容检查点升级恢复
 */
(function (root) {
  'use strict';

  const u = root.OKHBackgroundModules?.utils;
  const api = root.OKHBackground;

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
 * @updated 2026-11-11 00:10
 * @status  implemented
 * @reason  纯配置数据定义：时间常数、场所清单、七人初始台账、行动库、节点与附适用条件交互事件
 * @deps    无
 * @provides { SCHEMA_VERSION, DAY, PHASES, LOCATIONS, TOWN_LOCATIONS, STAGES, AFFECTION_TIERS, ACTIONS, NODES, EVENTS, ROSTER, buildInitialWorld }
 */
(function (root) {
  'use strict'

  const SCHEMA_VERSION = 2

  const DAY = (n, hour = 6, min = 0) => (n - 1) * 1440 + hour * 60 + min

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

  const ACTIONS = [
    {
      id: 'gulan_train',
      priority: 25,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        npc.id === 'gulan' &&
        phase.id === 'afternoon' &&
        !npc.flags?.gulan_captured_orc &&
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
      id: 'return_inn',
      priority: 30,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        ['night', 'deep_night'].includes(phase.id) &&
        npc.homeLocation === 'inn' &&
        npc.location !== 'inn' &&
        !npc.flags?.captured_orc &&
        !npc.flags?.gulan_captured_orc &&
        !npc.flags?.captured_manor,
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
      id: 'return_manor',
      priority: 30,
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
        ['night', 'deep_night'].includes(phase.id) &&
        npc.homeLocation === 'manor' &&
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
    }
  ]

  const gulanSoloTrainingGrounds = ({ world, npc, phase }) =>
    Boolean(world.flags?.arrived_oakhaven) &&
    world.timeMin >= DAY(15, 6) &&
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
      effects: {
        add: { blood_density: 10 },
        npcFlags: { gulan_evt1_done: true },
        worldFlags: { bloody_arena: true }
      }
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
      effects: {
        add: { blood_density: 10 },
        npcFlags: { gulan_evt1_done: true },
        worldFlags: { bloody_arena: true }
      }
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
      id: 'gulan_final_rescue_prompt',
      mode: 'interaction',
      scope: 'npc',
      targets: ['gulan'],
      allowCancel: false,
      resolveWhen: ({ npc }) => npc.stage === 2,
      when: ({ npc }) =>
        npc.stage === 2 &&
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
          text: '你及时入室握住她发颤的手腕稳住气血，助她在最后关头压下了沸腾的始祖龙威。',
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
      id: 'isna_tavern_rumor_alone',
      mode: 'result',
      scope: 'npc',
      targets: ['isna'],
      when: ({ world, npc, phase }) =>
        Boolean(world.flags?.arrived_oakhaven) &&
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
        world.timeMin >= DAY(8, 6) &&
        npc.stage === 0 &&
        npc.location === 'inn' &&
        ['afternoon', 'night'].includes(phase.id) &&
        (npc.values.gold_desire ?? 0) >= 30 &&
        !npc.flags?.gold_desire_frozen &&
        !npc.flags?.isna_evt1_done &&
        !npc.flags?.isna_comforted_today &&
        world.playerLocation === 'inn',
      text: '酒馆大堂里飘着烤肉香气，邻桌正在吹嘘荒原悬赏与领主府的三倍工钱。你注意到同在旅店的{name}正盯着空袋发呆、猫耳紧绷，似在盘算自己单干。',
      effects: { npcFlags: { isna_evt1_done: true } },
      outcomes: {
        soothe: {
          when: ({ world, npc }) => world.playerLocation === 'inn' && npc.location === 'inn',
          text: '你主动坐过去分她一份肉食宽慰几句，她垂下猫耳小声嘀咕了两句，暂且压下了急躁念头。',
          effects: { add: { gold_desire: 5, affection: 2 } }
        },
        ignore: {
          text: '你忙着别的事没有出声干预，{name}灌完杯底残酒，眼底多了几分跃跃欲试。',
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
        npc.stage === 0 &&
        npc.location === 'town' &&
        ['night', 'deep_night'].includes(phase.id) &&
        (npc.values.gold_desire ?? 0) >= 50 &&
        !npc.flags?.gold_desire_frozen &&
        !npc.flags?.isna_evt2_done &&
        world.playerLocation === 'town',
      text: '商业巷拐角忽然炸开一团刺鼻骨粉烟幕，一道敏捷的猫耳身影翻过矮墙正欲抽身遁走，像刚干完私活的{name}。',
      effects: { npcFlags: { isna_evt2_done: true } },
      outcomes: {
        intercept: {
          when: ({ world, npc }) => world.playerLocation === 'town' && npc.location === 'town',
          text: '你快步抢前堵住退路冷脸训了她一顿，{name}心虚夹紧尾巴乖乖认错，收敛了不少冒失念头。',
          effects: { add: { gold_desire: 5, affection: 4 } }
        },
        miss: {
          text: '烟幕散尽后巷内已空无一人，{name}顺利带着快钱脱身，越发笃信凭自己本事去哪都能来去自如。',
          effects: { add: { gold_desire: 15 }, npcFlags: { alley_confidence: true } }
        }
      }
    },
    {
      id: 'lord_hiring',
      mode: 'result',
      scope: 'world',
      when: { worldFlags: { arrived_oakhaven: true }, phase: ['morning', 'afternoon'] },
      text: '领主府放出消息，说山庄正以三倍高薪招几个手脚勤快的女仆与临时差役。',
      effects: { worldFlags: { lord_hiring: true } }
    }
  ]

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
      nodePlan: [],
      plan: ['isna_odd_job', 'return_inn', 'idle_rest']
    }),
    makeNpc({
      id: 'nise', name: '妮丝', location: 'wilds', homeLocation: 'inn',
      hasStage: true, hasAffection: true,
      values: { curiosity: 0, gamble_debt: 0, affection: 70 },
      metricBounds: { curiosity: [0, 100], gamble_debt: [0, 100], affection: [0, 100] },
      nodePlan: [],
      plan: ['return_inn', 'idle_rest']
    }),
    makeNpc({
      id: 'aurora', name: '奥萝拉', location: 'wilds', homeLocation: 'inn',
      hasStage: true, hasAffection: true,
      values: { debt_pressure: 0, affection: 50 },
      metricBounds: { debt_pressure: [0, 100], affection: [0, 100] },
      nodePlan: [],
      plan: ['return_inn', 'idle_rest']
    }),
    makeNpc({
      id: 'eileen', name: '艾琳', location: 'manor', homeLocation: 'manor',
      hasStage: true, hasAffection: true,
      values: { isolation: 0, affection: 20 },
      metricBounds: { isolation: [0, 100], affection: [0, 100] },
      nodePlan: [],
      plan: ['return_manor', 'idle_rest']
    }),
    makeNpc({
      id: 'cecilia', name: '塞西莉亚', location: 'church', homeLocation: 'church',
      hasStage: true, hasAffection: true,
      values: { orphanage_funds: 0, affection: 20 },
      metricBounds: { orphanage_funds: [0, 100], affection: [0, 100] },
      nodePlan: [],
      plan: ['return_church', 'idle_rest']
    }),
    makeNpc({
      id: 'ed', name: '爱德', monitored: false, location: 'wilds', homeLocation: 'inn',
      hasStage: false, hasAffection: false,
      values: { patience: 100 },
      metricBounds: { patience: [0, 100] },
      nodePlan: [],
      plan: ['return_inn', 'idle_rest']
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
      interactingIds: [],
      flags: {
        ed_joined: false,
        arrived_oakhaven: false,
        playerRoomTarget: null
      },
      npcs
    }
  }

  root.OKH_APP_DATA = Object.freeze({
    SCHEMA_VERSION, DAY, PHASES, LOCATIONS, TOWN_LOCATIONS, STAGES, AFFECTION_TIERS,
    ACTIONS, NODES, EVENTS, ROSTER, buildInitialWorld
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_DATA
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)

;
/**
 * @module okh_app_rules
 * @updated 2026-11-11 00:10
 * @status  implemented
 * @reason  纯业务判定规则：好感区间、前传移动门禁、前传里程碑、同房状态与好感/行为上限校验
 * @deps    OKH_APP_DATA
 * @provides { getAffectionTier, canMove, applyPrologueSteps, resolveRoom, resolveBonds }
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

  function canMove(world, to) {
    if (!Object.hasOwn(DATA.LOCATIONS, to)) return false
    if (!world?.flags?.arrived_oakhaven && TOWN_LOCATION_SET.has(to)) return false
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
        out.push({ target: 'world', worldFlags: { arrived_oakhaven: true } })
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

  const BOND_HANDLERS = {
    gulan: {
      spar: ({ world, npc, phase }) =>
        world.flags?.arrived_oakhaven && npc.location === 'training_grounds' &&
        ['morning', 'afternoon'].includes(phase.id) && !npc.flags?.gulan_spar_today
          ? { add: { affection: 2 }, npcFlags: { gulan_spar_today: true } } : null,
      care: ({ npc, phase }) =>
        ['inn', 'wilds'].includes(npc.location) && ['morning', 'night'].includes(phase.id) &&
        !npc.flags?.gulan_care_today
          ? { add: { affection: 1 }, npcFlags: { gulan_care_today: true } } : null,
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
          ? { add: { affection: 1 }, npcFlags: { gulan_confide_today: true } } : null,
      offend: () => ({ add: { affection: -5 }, exemptCap: true })
    },
    isna: {
      comfort: ({ world, npc }) =>
        world.flags?.arrived_oakhaven && world.playerLocation === 'inn' && npc.location === 'inn' &&
        !npc.flags?.gold_desire_frozen && (npc.values.affection ?? 0) >= 60 &&
        (world.timeMin - (npc.flags?.lastComfortMin ?? -9999)) >= 2880
          ? {
              add: { gold_desire: -2, affection: 1 },
              npcFlags: { isna_comforted_today: true, lastComfortMin: world.timeMin }
            }
          : null,
      steady_work: ({ world, npc, phase }) =>
        world.flags?.arrived_oakhaven && ['morning', 'afternoon'].includes(phase.id) &&
        ['town', 'wilds'].includes(npc.location)
          ? { add: { affection: 2 }, npcFlags: { isna_worked_today: true } }
          : null
    }
  }

  function resolveBonds(world, bonds, ctx) {
    const out = []
    const day = Math.floor(world.timeMin / 1440) + 1
    const capCache = {}
    const flagCache = {}

    for (const item of bonds || []) {
      const npc = world.npcs?.[item.npc]
      const fn = BOND_HANDLERS[item.npc]?.[item.kind]
      if (!npc || !fn || npc.location !== world.playerLocation) continue

      const viewNpc = { ...npc, flags: { ...npc.flags, ...(flagCache[npc.id] || {}) } }
      const res = fn({ world, npc: viewNpc, phase: ctx.phase })
      if (!res) continue

      const add = { ...(res.add || {}) }
      const npcFlags = { ...(res.npcFlags || {}) }
      if (npc.id === 'gulan') npcFlags.lastInteractDay = day

      if (npc.hasAffection !== false && add.affection > 0 && !res.exemptCap) {
        const curDay = capCache[npc.id]?.day ?? npc.flags?.dailyAffectionDay
        const used = curDay === day ? (capCache[npc.id]?.gain ?? npc.flags?.dailyAffectionGain ?? 0) : 0
        const allow = Math.max(0, 3 - used)
        add.affection = Math.min(add.affection, allow)
        capCache[npc.id] = { day, gain: used + add.affection }
        npcFlags.dailyAffectionDay = day
        npcFlags.dailyAffectionGain = used + add.affection
      }

      flagCache[npc.id] = { ...(flagCache[npc.id] || {}), ...npcFlags }
      out.push({ target: npc.id, add, npcFlags })
    }
    return out
  }

  root.OKH_APP_RULES = Object.freeze({
    getAffectionTier, canMove, applyPrologueSteps, resolveRoom, resolveBonds
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_RULES
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)

;
/**
 * @module okh_app_time
 * @updated 2026-11-11 00:10
 * @status  implemented
 * @reason  跨日午夜唯一键去重结算（先算第k夜再清日标、支持跳日顺延）与拂晓同房失效规则
 * @deps    OKH_APP_DATA
 * @provides { settleTimeEffects }
 */
(function (root) {
  'use strict'

  const DATA = root.OKH_APP_DATA
  if (!DATA) throw Error('time 缺少 OKH_APP_DATA')

  function makeNightSim(world) {
    const gulan = world.npcs?.gulan, isna = world.npcs?.isna, ed = world.npcs?.ed
    const others = {}
    for (const npc of Object.values(world.npcs || {})) {
      if (npc.id === 'gulan' || npc.id === 'isna') continue
      others[npc.id] = {
        alive: npc.alive !== false,
        lastNight: Number.isFinite(npc.flags?.lastNightSettledDay) ? npc.flags.lastNightSettledDay : 0
      }
    }
    return {
      arrived: Boolean(world.flags?.arrived_oakhaven),
      edJoined: Boolean(world.flags?.ed_joined),
      edMonitored: Boolean(ed?.monitored),
      edLoc: ed?.location || null,
      gulanAlive: Boolean(gulan && gulan.alive !== false),
      gulanHasAff: gulan?.hasAffection !== false,
      gulanStage: gulan?.stage ?? 0,
      gulanLoc: gulan?.location || null,
      gulanLastNight: Number.isFinite(gulan?.flags?.lastNightSettledDay) ? gulan.flags.lastNightSettledDay : 0,
      gulanLastInteract: Number.isFinite(gulan?.flags?.lastInteractDay) ? gulan.flags.lastInteractDay : 1,
      isnaAlive: Boolean(isna && isna.alive !== false),
      isnaFrozen: Boolean(isna?.flags?.gold_desire_frozen),
      isnaWorked: Boolean(isna?.flags?.isna_worked_today),
      isnaComforted: Boolean(isna?.flags?.isna_comforted_today),
      isnaLastNight: Number.isFinite(isna?.flags?.lastNightSettledDay) ? isna.flags.lastNightSettledDay : 0,
      others
    }
  }

  function settleGulanNight(sim, k, changes) {
    if (sim.gulanLastNight >= k) return
    const add = {}
    if (sim.edJoined && sim.arrived && sim.gulanAlive && sim.edMonitored && sim.gulanLoc === sim.edLoc) {
      add.blood_density = sim.gulanStage >= 2 ? 3 : 1
    }
    if (sim.gulanAlive && sim.gulanHasAff && (k - sim.gulanLastInteract) >= 5) {
      add.affection = -1
    }
    const change = {
      target: 'gulan',
      npcFlags: {
        gulan_spar_today: false,
        gulan_care_today: false,
        gulan_gear_today: false,
        gulan_confide_today: false,
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
        isna_comforted_today: false,
        dailyAffectionDay: k + 1,
        dailyAffectionGain: 0,
        lastNightSettledDay: k
      }
    }
    if (sim.arrived && sim.isnaAlive && !sim.isnaFrozen && !sim.isnaWorked && !sim.isnaComforted) {
      change.add = { gold_desire: 1 }
    }
    changes.push(change)
    sim.isnaWorked = false
    sim.isnaComforted = false
    sim.isnaLastNight = k
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
      const sim = makeNightSim(world)
      const kStart = Math.floor(fromMin / 1440) + 1
      const kEnd = Math.floor(toMin / 1440)
      for (let k = kStart; k <= kEnd; k++) {
        settleGulanNight(sim, k, changes)
        settleIsnaNight(sim, k, changes)
        settleOtherNights(sim, k, changes)
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
 * @updated 2026-11-11 00:10
 * @status  implemented
 * @reason  存档版本幂等迁移：剥离废止字段、转换节点与进行中活动/待决事件，确保验证顺序先清理再校验
 * @deps    OKH_APP_DATA
 * @provides { LEGACY_KEYS, migrateWorld }
 */
(function (root) {
  'use strict'

  const DATA = root.OKH_APP_DATA
  if (!DATA) throw Error('migrate 缺少 OKH_APP_DATA')

  const LEGACY_KEYS = [
    'pride', 'duty', 'lust', 'fear', 'shame', 'need',
    'curiosity', 'loyalty', 'corruption', 'sanity', 'exposure'
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

  function migrateNpcFromRoster(existing, tpl, inferredArrived, timeMin, reportList) {
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
    if (world.flags.ed_joined === undefined) world.flags.ed_joined = inferredArrived
    if (world.flags.playerRoomTarget === undefined) world.flags.playerRoomTarget = null
    if (!Object.hasOwn(DATA.LOCATIONS, world.playerLocation)) {
      world.playerLocation = inferredArrived ? 'inn' : 'wilds'
    }

    world.bg ||= { version: 2, revision: 0, receipts: {}, settled: {}, fired: {}, queue: [], generations: {} }
    migratePendingQueueToEventStates(world)

    const manualReleaseActivities = []
    const nextNpcs = {}
    for (const tpl of DATA.ROSTER) {
      nextNpcs[tpl.id] = migrateNpcFromRoster(world.npcs?.[tpl.id], tpl, inferredArrived, timeMin, manualReleaseActivities)
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
 * @updated 2026-11-11 00:10
 * @status  implemented
 * @reason  薄运行时配置装配器：组合数据定义、业务规则、跨日结算与存档迁移并重导出兼容接口
 * @deps    OKH_APP_DATA, OKH_APP_RULES, OKH_APP_TIME, OKH_APP_MIGRATE
 * @provides { SCHEMA_VERSION, DAY, PHASES, LOCATIONS, TOWN_LOCATIONS, STAGES, AFFECTION_TIERS, getAffectionTier, canMove, ACTIONS, NODES, EVENTS, ROSTER, buildConfig, buildInitialWorld, migrateWorld, settleTimeEffects, applyPrologueSteps, resolveRoom, resolveBonds }
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
      metricBounds,
      releaseRules: { manualRelease: () => false },
      canMove: RULES.canMove,
      applyPrologueSteps: RULES.applyPrologueSteps,
      resolveRoom: RULES.resolveRoom,
      resolveBonds: RULES.resolveBonds,
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
    PHASES: DATA.PHASES,
    LOCATIONS: DATA.LOCATIONS,
    TOWN_LOCATIONS: DATA.TOWN_LOCATIONS,
    STAGES: DATA.STAGES,
    AFFECTION_TIERS: DATA.AFFECTION_TIERS,
    getAffectionTier: RULES.getAffectionTier,
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
    resolveBonds: RULES.resolveBonds
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_CONFIG
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)

;
/**
 * @module okh_app_world
 * @updated 2026-11-10 23:34
 * @status  implemented
 * @reason  按聊天隔离的单一存档、显式持久化、原子状态、检查点提交，以及 schemaVersion < CFG.SCHEMA_VERSION 增量迁移
 */
(function (root) {
  'use strict';
  const u = root.OKHBackgroundModules?.utils;
  const CFG = root.OKH_APP_CONFIG;
  if (!u || !CFG) throw Error('world 缺少 utils/config');
  const KEY = 'okh_gpt.state.v1';
  let settings = {}, localLock = Promise.resolve();
  const memory = new Map();

  function configure(options = {}) { settings = { ...settings, ...options }; }
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
      const changed = migrateEnvelope(raw);
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
    resetWorld: () => ensureWorld(true), STORAGE_KEY: KEY });
})(globalThis);

;
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
/**
 * @module okh_app_parse
 * @updated 2026-11-11 00:10
 * @status  implemented
 * @reason  只解析唯一闭合状态栏；支持可选时间点 at="start|end|N日 HH:MM"，并在前传时间线上做移动门禁校验
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
    const relocate = (npc, to, label, atSpec) => {
      if (!canMoveFn) return true;
      const moveMin = toMinute(atSpec, now, world.timeMin, now);
      const unlocked = arrivedAtMin <= moveMin;
      const simWorld = unlocked && !world.flags?.arrived_oakhaven
        ? { ...world, flags: { ...(world.flags || {}), arrived_oakhaven: true } }
        : world;
      if (canMoveFn(simWorld, to, npc)) return true;
      diagnostics.push('前传未抵镇前阻止移动：' + to + (label ? '（' + label + '）' : ''));
      return false;
    };

    const counts = { focus: 0, injury: 0, room: 0 };
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
          playerMoves.push({ to, ...(at !== undefined ? { at } : {}) });
        }
      } else if (name === 'interact') {
        if (known(a.npc)) interacting.add(a.npc);
      } else if (name === 'focus') {
        u.check(++counts.focus === 1, '本轮只能申报一个 focus');
        if (known(a.npc)) front.focusNpcId = a.npc;
      } else if (name === 'injury') {
        u.check(++counts.injury === 1 && /^\d+$/.test(a.level || '') &&
          u.minute(Number(a.level)) && typeof a.type === 'string' && a.type.trim(), 'injury 申报非法');
        front.playerInjury = { level: Number(a.level), type: a.type };
      } else if (name === 'room') {
        u.check(++counts.room === 1 && (a.state === 'together' || a.state === 'separate'), 'room 申报非法');
        if (a.state === 'together') u.check(a.npc && u.own(world.npcs, a.npc), 'room together 需要已知 npc');
        const at = parseAtAttr(a.at, world.timeMin, now);
        front.room = { npc: a.npc || null, state: a.state, ...(at !== undefined ? { at } : {}) };
      } else if (name === 'bond') {
        u.check(a.delta === undefined && a.value === undefined && a.add === undefined, 'bond 只能申报事实，禁止携带数值字段');
        u.check(u.id(a.kind) && typeof a.npc === 'string' && a.npc.trim(), 'bond 缺少合法 npc 或 kind');
        const at = parseAtAttr(a.at, world.timeMin, now);
        if (known(a.npc)) (front.bonds ||= []).push({ npc: a.npc, kind: a.kind, ...(at !== undefined ? { at } : {}) });
      } else if (name === 'event_resolve') {
        u.check(u.id(a.id) && u.id(a.outcome), 'event_resolve 缺少合法 id 或 outcome');
        if (a.npc && !known(a.npc)) continue;
        const at = parseAtAttr(a.at, world.timeMin, now);
        const npcId = inferEventNpcId(world, config, a.id, a.npc);
        (front.resolveEvents ||= []).push({ eventId: a.id, npcId, outcome: a.outcome, ...(at !== undefined ? { at } : {}) });
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
 * @updated 2026-11-09
 * @status implemented
 * @reason 串行处理完整回复、时间保底、历史重放和按生成请求交付事件
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
    const text = opts.text || '';
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
    const command = { id, revision, toMin: plan.toMin, interactingIds: [...during], front,
      chatIndex: opts.chatIndex ?? null };
    const generationId = opts.generationId ?? null;
    const result = await controller(s).finishReply(command, generationId);
    const published = await publish(s);
    last = { advanced: true, from: world.timeMin, to: result.state.timeMin, front,
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
    return changed.chatIndex;
  }
  async function replay(s, chat, from, through) {
    for (let i = from; i <= through; i++) {
      if (!assistant(chat[i])) continue;
      await runStep(undefined, { session: s, msgId: replyId(s, i), revision: revisionFor(chat, i),
        text: chat[i].mes || '', chatIndex: i, countMessage: true, initial: i === 0 });
    }
  }
  function step(minutes, opts = {}) { return serial(() => runStep(minutes, opts)); }
  function beforeGeneration(opts = {}) {
    if (opts.dryRun) return Promise.resolve(null);
    return serial(async () => {
      const s = W.session();
      await W.ensureWorld(false, s);
      if (activeGeneration) {
        await inject('', activeGeneration.session);
        activeGeneration = null;
      }
      const chat = W.context()?.chat || [];
      const from = await reconcile(s, chat, opts.replaceIndex);
      if (from !== null && opts.replaceIndex === undefined) await replay(s, chat, from, newestIndex(chat));
      const id = opts.generationId || 'gen:' + s.id + ':' + Date.now() + ':' + (++seq);
      const batch = await controller(s).prepareGeneration(id, 8);
      const text = A.buildLedger(W.loadWorld(s)) + (batch.text ? '\n\n' + batch.text : '');
      await inject(text, s);
      const lastIndex = newestIndex(chat);
      const targetIndex = opts.replaceIndex ??
        (lastIndex === chat.length - 1 && !chat[lastIndex]?.mes ? lastIndex : chat.length);
      activeGeneration = { id, session: s, targetIndex };
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
      const generation = activeGeneration?.session.id === s.id && activeGeneration.targetIndex === target
        ? activeGeneration : null;
      const result = await runStep(undefined, { session: s, msgId: replyId(s, target),
        revision: revisionFor(chat, target), text: chat[target].mes || '', chatIndex: target,
        countMessage: true, initial: target === 0, generationId: generation?.id });
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
      if (generation) await inject('', generation.session);
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
      try { return await beforeGeneration({ dryRun: dryRun === true || data?.dryRun === true,
        replaceIndex: ['regenerate', 'swipe', 'continue'].includes(type) ? newestIndex(chat) : undefined }); }
      catch (error) { reportFailure(error); throw error; }
    });
    bind(types.MESSAGE_RECEIVED, index => onMessage(index).catch(error => { reportFailure(error); throw error; }));
    for (const name of ['MESSAGE_EDITED', 'MESSAGE_DELETED', 'MESSAGE_SWIPED']) {
      if (types[name] !== undefined) bind(types[name], () => syncHistory().catch(reportFailure));
    }
    if (types.GENERATION_STOPPED !== undefined) bind(types.GENERATION_STOPPED, () => cancelGeneration().catch(reportFailure));
    if (types.CHAT_CHANGED !== undefined) bind(types.CHAT_CHANGED, () => cancelGeneration().catch(reportFailure));
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
 * @status  implemented
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
 * @updated 2026-11-10 23:35
 * @status  implemented
 * @reason  把 world 渲染成界面：在场面板（玩家可见）+ 监听面板（隐藏）
 * @deps    ['okh_app_world', 'okh_app_adapter']
 * @provides { render, startHud, stopHud, LOCATION_NAMES }
 *
 * 用法：
 *   页面上放 <div data-okh-hud></div>  → 显示时间、位置、在场
 *   页面上放 <div data-okh-watch></div> → 显示全员监听（建议设 display:none）
 */

(function (root) {
  'use strict'

  const W = root.OKH_APP_WORLD
  const A = root.OKH_APP_ADAPTER
  const CFG = root.OKH_APP_CONFIG
  let watchVisible = false

  if (!W || !A) {
    console.error('[APP] hud 加载失败：需要 02_world 与 03_adapter')
    return
  }

  /** 地点中文名 */
  const LOCATION_NAMES = CFG.LOCATIONS

  /** 时段中文名 */
  const PHASE_NAMES = CFG.PHASES.map((p, i) => ({ max: CFG.PHASES[i + 1]?.start ?? 1440, name: p.label || p.id }))

  /**
   * 由分钟推时段名
   * @param {number} local
   * @returns {string}
   */
  function phaseName(local) {
    return (PHASE_NAMES.find(p => local < p.max) || PHASE_NAMES[3]).name
  }

  /**
   * 地点名
   * @param {string} key
   * @returns {string}
   */
  function locName(key) {
    return LOCATION_NAMES[key] || key
  }

  // ============================================================
  // 一、在场面板
  // ============================================================

  /**
   * 生成在场面板的 HTML
   * @param {object} world
   * @returns {string}
   */
  function buildHudHtml(world) {
    if (!world) return ''

    const day = Math.floor(world.timeMin / 1440) + 1
    const local = world.timeMin % 1440
    const hour = String(Math.floor(local / 60)).padStart(2, '0')
    const minute = String(local % 60).padStart(2, '0')

    const here = Object.values(world.npcs)
      .filter(n => n.monitored === true && n.alive !== false && n.location === world.playerLocation)

    const presentText = here.length
      ? here.map(n => {
          const busy = n.activity ? `（${n.activity.label}）` : ''
          return `<span class="okh-name">${escape(n.name)}</span><span class="okh-busy">${escape(busy)}</span>`
        }).join('　')
      : '<span class="okh-none">无人</span>'

    return `
      <div class="okh-row">
        <span class="okh-label">时间</span>
        <span class="okh-value">第 ${day} 天 · ${phaseName(local)}</span>
        <span class="okh-clock">${hour}:${minute}</span>
      </div>
      <div class="okh-row">
        <span class="okh-label">位置</span>
        <span class="okh-value">${escape(locName(world.playerLocation))}</span>
      </div>
      <div class="okh-row">
        <span class="okh-label">在场</span>
        <span class="okh-value">${presentText}</span>
      </div>
    `.trim()
  }

  // ============================================================
  // 二、监听面板
  // ============================================================

  /**
   * 生成监听面板的 HTML（等宽文本，便于对齐）
   * @param {object} world
   * @returns {string}
   */
  function buildWatchHtml(world) {
    if (!world) return ''
    const STAGE = CFG.STAGES

    const lines = Object.values(world.npcs).filter(n => n.monitored === true).map(n => {
      const mark = n.location === world.playerLocation ? '●' : '○'
      const stage = n.hasStage === false ? '—' : (STAGE[n.stage] ?? n.stage)
      const busy = n.activity ? `｜${n.activity.label}` : ''
      return `${mark} ${n.name}｜${locName(n.location)}｜${stage}｜${Object.entries(n.values).map(([k,v]) => k + ':' + Math.round(v * 100) / 100).join(' ')}${busy}`
    })

    return lines.join('\n')
  }

  /**
   * HTML 转义
   * @param {string} s
   * @returns {string}
   */
  function escape(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  // ============================================================
  // 三、渲染
  // ============================================================

  /**
   * 渲染一次
   * @returns {boolean} 是否找到容器
   */
  function render() {
    if (typeof document === 'undefined') return false

    const world = W.loadWorld()
    if (!world) return false

    let found = false

    // 在场面板：可能有多个（每条消息一个），全部填
    const huds = document.querySelectorAll('[data-okh-hud]')
    for (const el of huds) {
      el.innerHTML = buildHudHtml(world)
      el.setAttribute('data-okh-ready', '1')
      found = true
    }

    // 监听面板
    const watches = document.querySelectorAll('[data-okh-watch]')
    for (const el of watches) {
      el.hidden = !watchVisible
      el.textContent = watchVisible ? buildWatchHtml(world) : ''
      found = true
    }

    return found
  }

  // ============================================================
  // 四、定时刷新
  // ============================================================

  let _timer = null

  /**
   * 启动定时刷新
   * @param {number} intervalMs
   */
  function startHud(intervalMs = 1000) {
    if (_timer) return
    _timer = setInterval(() => {
      try { render() } catch (e) { /* 静默，不打断页面 */ }
    }, intervalMs)
    console.log('[APP] HUD 已启动 · 每 ' + intervalMs + 'ms 刷新')
  }

  /**
   * 停止
   */
  function stopHud() {
    if (!_timer) return
    clearInterval(_timer)
    _timer = null
    console.log('[APP] HUD 已停止')
  }

  root.OKH_APP_HUD = Object.freeze({
    setWatchVisible(value) { watchVisible = value === true; return render(); },
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
 * @status implemented
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

;
// Append after the complete runtime, in the same script context.
// Starting preserves the current chat save; it never forces reinitialization.
globalThis.OKH_CARD_READY = (async function () {
  if (!globalThis.OKH_APP) throw Error('请先加载完整 okh_complete.js');
  await globalThis.OKH_APP.start();
  const chat = globalThis.OKH_APP.W.context()?.chat || [];
  if (chat.length === 1 && !chat[0]?.is_user && !chat[0]?.is_system && chat[0]?.mes) {
    await globalThis.OKH_APP.onMessage(0);
  }
  console.log('[奥克赫斯] 监听已启动', globalThis.OKH_APP.info());
  return globalThis.OKH_APP.info();
})();
globalThis.OKH_CARD_READY.catch(error => console.error('[奥克赫斯] 启动失败：', error));
