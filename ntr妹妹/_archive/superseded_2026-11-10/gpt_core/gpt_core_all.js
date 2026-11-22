// gpt_core_all.js — GPT 提供的核心，9 个文件按加载顺序拼接
// 拼接不改动任何源码内容，仅为规避酒馆脚本 iframe 隔离

/**
 * @module okh_utils
 * @updated 2026-11-09
 * @status implemented
 * @reason 通用校验、深拷贝、时段和模块注册
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
        npc.stage === undefined || minute(npc.stage),
        '阶段非法'
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

    function refresh(world, config, ctx) {
      const released = [];

      for (const npc of u.sortedNpcs(world)) {
        if (!u.active(npc)) continue;

        const task = npc.activity;
        if (!task) continue;

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

        const expired =
          task.kind === 'ordinary' &&
          world.timeMin - task.startedAt >=
            config.policy.ordinaryGraceMin;

        const conditionMet =
          task.kind !== 'ordinary' &&
          task.releaseRule !== undefined &&
          rules.matches(
            config.releaseRules[task.releaseRule],
            { ...ctx, world, npc }
          );

        if (expired || conditionMet) {
          finish(
            npc,
            world.timeMin,
            expired
              ? 'ordinary-timeout'
              : 'release-condition'
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

/**
 * @module okh_nodes
 * @updated 2026-11-09
 * @status implemented
 * @reason 专属数值经节点推进阶段
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

/**
 * @module okh_turn
 * @updated 2026-11-09
 * @status implemented
 * @reason 编排时间、活动、行动、节点和前台回执
 */
(function (root) {
  'use strict';

  function create({
    utils: u,
    rules,
    activity,
    effects,
    events,
    nodes
  }) {
    function refresh(
      world,
      config,
      blockedIds,
      report
    ) {
      const ctx = {
        world,
        phase: u.phaseAt(world.timeMin, config),
        blockedIds
      };

      report.released.push(
        ...activity.refresh(world, config, ctx)
      );

      events.evaluate(world, config, ctx);
      nodes.evaluate(world, config, ctx);

      report.released.push(
        ...activity.refresh(world, config, ctx)
      );
    }

    function schedule(
      world,
      config,
      blockedIds,
      report
    ) {
      const phase = u.phaseAt(world.timeMin, config);
      const snapshot = u.clone(world);
      const decisions = [];

      for (const npc of u.sortedNpcs(snapshot)) {
        if (
          activity.status(npc, blockedIds) !== 'idle' ||
          world.bg.settled[npc.id] === phase.start
        ) {
          continue;
        }

        const ctx = {
          world: snapshot,
          npc,
          phase,
          blockedIds
        };

        const action = (config.actions || [])
          .filter(item =>
            (npc.plan || []).includes(item.id) &&
            rules.matches(item.when, ctx) &&
            (
              !config.allowed ||
              config.allowed(ctx, item)
            )
          )
          .sort((a, b) =>
            (b.priority || 0) - (a.priority || 0) ||
            a.id.localeCompare(b.id)
          )[0];

        decisions.push({
          id: npc.id,
          action
        });
      }

      for (const { id, action } of decisions) {
        world.bg.settled[id] = phase.start;

        if (!action) continue;

        const npc = world.npcs[id];

        if (
          activity.status(npc, blockedIds) !== 'idle'
        ) {
          continue;
        }

        const ctx = {
          world,
          npc,
          phase,
          blockedIds
        };

        if (
          !rules.matches(action.when, ctx) ||
          (
            config.allowed &&
            !config.allowed(ctx, action)
          )
        ) {
          continue;
        }

        effects.apply(
          world,
          npc,
          action.effects,
          ctx,
          config
        );

        if (action.occupation) {
          activity.start(npc, {
            ...action.occupation,
            id: u.key(
              'action',
              action.id,
              id,
              world.timeMin
            ),
            source: 'background'
          }, world.timeMin, config);
        }

        npc.lastAction = {
          id: action.id,
          at: world.timeMin
        };

        report.actions.push({
          npcId: id,
          actionId: action.id,
          at: world.timeMin
        });
      }
    }

    function applyFront(
      world,
      front,
      config,
      blockedIds
    ) {
      if (front.playerLocation !== undefined) {
        u.check(
          u.id(front.playerLocation),
          '玩家位置非法'
        );

        world.playerLocation = front.playerLocation;
      }

      for (const [id, patch] of
        Object.entries(front.npcs || {})) {
        u.check(
          u.own(world.npcs, id),
          '前台回执角色不存在'
        );

        u.check(
          !u.own(patch, 'stage'),
          '阶段只能由节点推进，不能由前台直接覆盖'
        );

        const npc = world.npcs[id];

        if (patch.location !== undefined) {
          u.check(
            u.id(patch.location),
            '角色位置非法'
          );

          npc.location = patch.location;
        }

        effects.apply(world, npc, {
          add: patch.add,
          npcFlags: patch.flags
        }, { blockedIds }, config);

        if (patch.activity) {
          activity.change(
            npc,
            patch.activity,
            world.timeMin,
            config
          );
        }
      }

      world.flags = {
        ...world.flags,
        ...front.flags
      };

      nodes.resolve(
        world,
        front.resolveNodes,
        config,
        {
          world,
          phase: u.phaseAt(world.timeMin, config),
          blockedIds
        }
      );
    }

    function advance(world, command, config) {
      u.validateConfig(config);
      u.validateWorld(world);

      u.check(
        world.bg?.version === 2,
        '请先初始化，旧版状态须显式迁移'
      );

      u.check(
        u.id(command.id) && u.id(command.revision),
        '需要稳定聊天消息 ID 和回复版本'
      );

      const signature = u.signature({
        revision: command.revision,
        toMin: command.toMin,
        interactingIds:
          command.interactingIds ??
          command.sceneIds ??
          [],
        front: command.front ?? null
      });

      const previous =
        world.bg.receipts[command.id];

      if (previous !== undefined) {
        u.check(
          previous === signature,
          'REPLAY_REQUIRED：先恢复该消息之前的检查点'
        );

        return {
          state: u.clone(world),
          before: null,
          report: {
            duplicate: true,
            released: [],
            actions: []
          },
          duplicate: true
        };
      }

      u.check(
        u.minute(command.toMin) &&
        command.toMin >= world.timeMin,
        '时间倒退须恢复检查点，不能直接减时钟'
      );

      const state = u.clone(world);
      const front = command.front || {};

      // sceneIds仅兼容旧接口。
      // 它现在表示互动角色，不再由位置推导。
      const initialIds =
        command.interactingIds ??
        command.sceneIds ??
        state.interactingIds ??
        [];

      const blockedIds = u.listIds(
        initialIds,
        state.npcs,
        '互动角色列表'
      );

      state.interactingIds = [...blockedIds];

      // 新报告活动先做保护，防止回补时间时被抢占。
      for (const [id, patch] of
        Object.entries(front.npcs || {})) {
        u.check(
          u.own(state.npcs, id),
          '前台回执角色不存在'
        );

        const task = patch.activity;
        const npc = state.npcs[id];

        if (
          task?.op === 'start' &&
          npc.activity?.id !== task.id &&
          !u.own(
            npc.activityHistory || {},
            task.id
          )
        ) {
          blockedIds.add(id);
        }
      }

      const report = {
        duplicate: false,
        released: [],
        actions: []
      };

      refresh(state, config, blockedIds, report);

      let steps = 0;

      while (state.timeMin < command.toMin) {
        u.check(
          ++steps <= (config.maxSteps ?? 128),
          '时间推进过多，本次未提交任何变化'
        );

        const boundary =
          u.phaseAt(state.timeMin, config).end;

        const next = Math.min(
          command.toMin,
          boundary,
          activity.nextDeadline(state, config)
        );

        state.timeMin = next;

        refresh(state, config, blockedIds, report);

        if (next === boundary) {
          schedule(state, config, blockedIds, report);
          refresh(state, config, blockedIds, report);
        }
      }

      applyFront(state, front, config, blockedIds);

      if (front.interactingIds !== undefined) {
        state.interactingIds = [
          ...u.listIds(
            front.interactingIds,
            state.npcs,
            '更新后的互动角色列表'
          )
        ];
      }

      refresh(
        state,
        config,
        new Set(state.interactingIds),
        report
      );

      state.bg.receipts[command.id] = signature;
      state.bg.revision++;

      u.validateWorld(state);

      return {
        state,
        before: u.clone(world),
        report,
        duplicate: false
      };
    }

    return { advance };
  }

  const registry =
    root.OKHBackgroundModules ||= Object.create(null);

  if (registry.turn) {
    throw Error('重复加载 okh_turn');
  }

  registry.turn = create;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = create;
  }
})(globalThis);

/**
 * @module okh_api
 * @updated 2026-11-09
 * @status implemented
 * @reason 公共接口、初始化、监听视图和示例存档迁移
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

    for (const npc of Object.values(world.npcs)) {
      npc.values ||= {};
      npc.flags ||= {};
      npc.stage ??= 0;
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
    u.validateWorld(world);

    u.check(
      !world.bg,
      '已初始化，禁止覆盖处理记录'
    );

    const state = normalize(u.clone(world), config);

    state.bg = {
      version: 2,
      revision: 0,
      receipts: {},
      settled: {},
      fired: {},
      queue: [],
      generations: {}
    };

    return state;
  }

  function migrate(world, config) {
    u.validateConfig(config);
    u.validateWorld(world);

    u.check(
      world.bg?.version === 1,
      '只支持本示例v1到v2，原项目须另写映射'
    );

    const state = normalize(u.clone(world), config);
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

/**
 * @module okh_adapter
 * @updated 2026-11-09
 * @status implemented
 * @reason 串行读写、保存请求批次和检查点恢复
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
      reason
    ) {
      const result = await commit({
        expectedRevision: before.bg.revision,
        state,
        checkpoint,
        reason
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
            'finish-reply'
          );

          return result;
        });
      },

      restore(checkpoint) {
        return serial(async () => {
          u.check(
            checkpoint?.bg?.version === 2,
            '检查点必须是完整v2状态'
          );

          u.validateWorld(checkpoint);

          const before = await readWorld();
          const state = u.clone(checkpoint);

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


