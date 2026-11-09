// GENERATED: 修改 core/、app/ 后重新运行构建，不直接编辑合订本。
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


;
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


;
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


;
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


;
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

        if (action.narration) {
          u.check(typeof action.narration === 'string', '行动反馈必须是预设文本');
          events.emit(world, { id: u.key('action', action.id, id, world.timeMin),
            kind: 'action', definitionId: action.id, mode: 'result', text: action.narration }, npc);
        }

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

        const changes = patch.activities || (patch.activity ? [patch.activity] : []);
        u.check(Array.isArray(changes), '活动变更必须是数组');
        for (const change of changes) {
          activity.change(
            npc,
            change,
            world.timeMin,
            config
          );
        }
      }

      world.flags = {
        ...world.flags,
        ...front.flags
      };

      if (front.focusNpcId !== undefined) {
        u.check(u.own(world.npcs, front.focusNpcId), '聚焦角色不存在');
        world.focusNpcId = front.focusNpcId;
      }
      if (front.playerInjury !== undefined) {
        u.check(u.minute(front.playerInjury.level) && typeof front.playerInjury.type === 'string', '受伤申报非法');
        world.playerState ||= {};
        world.playerState.injury = u.clone(front.playerInjury);
      }
      if (front.clockState !== undefined) {
        u.check(u.minute(front.clockState.count) && u.minute(front.clockState.creditedMin), '时间保底状态非法');
        world.bg.clockState = u.clone(front.clockState);
      }
      if (front.timeCheck !== undefined) world.bg.lastTimeCheck = u.clone(front.timeCheck);

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

        const npc = state.npcs[id];
        for (const task of patch.activities || (patch.activity ? [patch.activity] : [])) {
          if (task?.op === 'start' && npc.activity?.id !== task.id &&
              !u.own(npc.activityHistory || {}, task.id)) blockedIds.add(id);
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

        const fromMin = state.timeMin;
        if (config.timeEffects) {
          const changes = config.timeEffects({ world: u.clone(state), fromMin, toMin: next });
          u.check(Array.isArray(changes), 'timeEffects 必须返回明确目标的效果数组');
          effects.apply(state, null, changes, { blockedIds }, config);
        }
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


;
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




;
/**
 * @module okh_app_config
 * @updated 2026-11-09 06:40
 * @status  implemented; content-demo
 * @reason  基于 GPT 核心的配置。全部为示例数据，不是定稿
 * @deps    无（纯数据 + 少量纯函数）
 * @provides { buildConfig, buildInitialWorld, LINES, CHARACTER_IDS }
 *
 * ============================================================
 * ⚠️ 本文件中的角色、行动、事件、节点全部是占位示例
 *    目的是让 GPT 的核心能跑起来，不是项目定稿。
 * ============================================================
 */

(function (root) {
  'use strict'

  // ============================================================
  // 一、时段（GPT 要求：从 0 开始、递增、id 唯一）
  // ============================================================

  const PHASES = [
    { id: 'deep_night', start: 0, label: '深夜' },      // 00:00 – 06:00
    { id: 'morning',    start: 360, label: '上午' },    // 06:00 – 10:00
    { id: 'afternoon',  start: 600, label: '午后' },    // 10:00 – 17:00
    { id: 'night',      start: 1020, label: '夜晚' }    // 17:00 – 24:00
  ]

  // ============================================================
  // 二、底线表（用 GPT 的 allowed 钩子实现）
  //    holdsWhile 里用的是 GPT 的比较对象语法
  // ============================================================

  const LINES = {
    no_physical_contact: {
      type: 'no_physical_contact',
      holdsWhile: { corruption: { lt: 30 } }
    },
    no_admit: {
      type: 'no_admit',
      holdsWhile: { corruption: { lt: 70 } }
    },
    never_abandon: {
      type: 'never_abandon',
      holdsWhile: {}          // 永不解除
    },
    resist: {
      type: 'resist',
      holdsWhile: { corruption: { lt: 75 } }
    },
    no_public_shame: {
      type: 'no_public_shame',
      holdsWhile: { corruption: { lt: 65 } }
    }
  }

  // ============================================================
  // 三、行动库（GPT 格式）
  //    priority 对应原来的 base
  //    blockedBy 通过 allowed 钩子生效
  // ============================================================

  const ACTIONS = [
    // ── 生计 ──
    {
      id: 'work_shift', priority: 28,
      when: { phase: ['morning', 'afternoon'], metrics: { need: { gt: 50 } } },
      effects: { add: { need: -12, fear: 2 } },
      occupation: { kind: 'ordinary', label: '去做工' }
    },
    {
      id: 'work_extra', priority: 20,
      when: { metrics: { need: { gt: 60 } } },
      effects: { add: { need: -18, shame: 4, corruption: 2, exposure: 2 } },
      occupation: { kind: 'ordinary', label: '接私活' }
    },
    {
      id: 'trade', priority: 16,
      when: { phase: ['morning', 'afternoon'] },
      effects: { add: { need: -8 } },
      occupation: { kind: 'ordinary', label: '做点买卖' }
    },

    // ── 日常 ──
    {
      id: 'pray', priority: 24,
      when: {},
      effects: { add: { shame: -6, duty: 3, fear: -3, sanity: 3 } },
      occupation: { kind: 'ordinary', label: '去祈祷' }
    },
    {
      id: 'rest', priority: 18,
      when: {},
      effects: { add: { fear: -4, sanity: 2 } },
      occupation: { kind: 'ordinary', label: '歇着' }
    },
    {
      id: 'care', priority: 22,
      when: {},
      effects: { add: { duty: 5, shame: -4, sanity: 4 } },
      occupation: { kind: 'ordinary', label: '去照顾人' }
    },
    {
      id: 'visit_bond', priority: 20,
      when: {},
      effects: { add: { loyalty: 6, need: -2 } },
      occupation: { kind: 'ordinary', label: '去看望亲近的人' }
    },
    {
      id: 'socialize', priority: 17,
      when: {},
      effects: { add: { shame: -5, curiosity: 3, exposure: 1 } },
      occupation: { kind: 'ordinary', label: '和人应酬' }
    },

    // ── 越界边缘 ──
    {
      id: 'serve', priority: 22,
      when: { metrics: { need: { gt: 55 } } },
      effects: { add: { need: -20, shame: 10, fear: 5, corruption: 6, exposure: 3 } },
      occupation: { kind: 'important', label: '去侍奉', releaseRule: 'serviceResolved' },
      blockedBy: ['no_physical_contact']
    },
    {
      id: 'gamble', priority: 18,
      when: { metrics: { curiosity: { gt: 45 } } },
      effects: { add: { curiosity: -5, lust: 4, fear: 5, corruption: 3, exposure: 3 } },
      occupation: { kind: 'ordinary', label: '去赌一把' }
    },
    {
      id: 'drink', priority: 16,
      when: {},
      effects: { add: { fear: -6, shame: -5, corruption: 1 } },
      occupation: { kind: 'ordinary', label: '去喝一杯' }
    },
    {
      id: 'indulge', priority: 14,
      when: { metrics: { corruption: { gte: 30 } } },
      effects: { add: { shame: 8, lust: 8, corruption: 8, exposure: 4 } },
      occupation: { kind: 'important', label: '放纵一次', releaseRule: 'indulgenceResolved' },
      blockedBy: ['no_physical_contact']
    },

    // ── 探索 / 危险 ──
    {
      id: 'explore', priority: 17,
      when: { metrics: { curiosity: { gt: 50 } } },
      effects: { add: { curiosity: -8, fear: 4, exposure: 1 } },
      occupation: { kind: 'ordinary', label: '去看看' }
    },
    {
      id: 'sneak', priority: 15,
      when: { phase: ['night'] },
      effects: { add: { fear: 6, curiosity: -4, corruption: 2, exposure: 3 } },
      occupation: { kind: 'ordinary', label: '偷偷出去' }
    },
    {
      id: 'resist', priority: 20,
      when: { metrics: { pride: { gt: 60 } } },
      effects: { add: { pride: 4, fear: 4, sanity: 2 } },
      occupation: { kind: 'ordinary', label: '顶回去' }
    },
    {
      id: 'submit', priority: 18,
      when: {},
      effects: { add: { shame: 5, fear: 3, corruption: 3 } },
      occupation: { kind: 'ordinary', label: '忍下来' }
    },

    // ── 掩饰 ──
    {
      id: 'conceal', priority: 19,
      when: { metrics: { corruption: { gte: 20 } } },
      effects: { add: { fear: 3, shame: 4, exposure: -8 } },
      occupation: { kind: 'ordinary', label: '把事瞒下来' }
    },
    {
      id: 'confess', priority: 12,
      when: { metrics: { loyalty: { gt: 65 } } },
      effects: { add: { shame: -10, loyalty: 5, sanity: 5, exposure: -3 } },
      occupation: { kind: 'ordinary', label: '说出来' }
    },
    {
      id: 'show_off', priority: 15,
      when: {},
      effects: { add: { pride: 6 } },
      occupation: { kind: 'ordinary', label: '显摆一下' }
    }
  ]

  // ============================================================
  // 四、阶段节点（GPT 的核心推进方式）
  // ============================================================

  const NODES = [
    {
      id: 'stage_1', mode: 'result', fromStage: 0, toStage: 1,
      when: { metrics: { corruption: { gte: 30 } } },
      text: '{name}最近有些不一样了，说不上来哪里不对。'
    },
    {
      id: 'stage_2', mode: 'result', fromStage: 1, toStage: 2,
      when: { metrics: { corruption: { gte: 55 } } },
      text: '{name}已经不太解释了，也不再遮掩。'
    },
    {
      id: 'stage_3', mode: 'result', fromStage: 2, toStage: 3,
      when: { metrics: { corruption: { gte: 80 } } },
      text: '{name}不再提以前的事，仿佛那些从没发生过。'
    }
  ]

  // ============================================================
  // 五、世界事件（GPT 格式）
  //    时间换算：第 N 天 06:00 = (N-1)*1440 + 360
  // ============================================================

  const DAY = (n, hour = 6) => (n - 1) * 1440 + hour * 60

  const EVENTS = [
    {
      id: 'lord_hiring', mode: 'result', scope: 'world',
      when: { time: { gte: DAY(1, 6) }, phase: ['morning', 'afternoon'] },
      text: '领主府放出消息，说要招几个手脚勤快的女仆，工钱给得比镇上高出一截。',
      effects: { worldFlags: { lord_hiring: true } }
    },
    {
      id: 'casino_open', mode: 'result', scope: 'world',
      when: { time: { gte: DAY(2, 17) }, phase: ['night'] },
      text: '镇子东头那家赌场重新开张了，门口站着两个黑塔一样的保镖。',
      effects: { worldFlags: { casino_unlocked: true } }
    },
    {
      id: 'debt_collector', mode: 'result', scope: 'npc',
      targets: ['aurora'],
      when: { time: { gte: DAY(3, 12) }, phase: ['afternoon', 'night'] },
      text: '有人在旅店门口堵住了{name}，声音不大，但说得很清楚。',
      effects: { add: { need: 15, fear: 12, shame: 8 } }
    },
    {
      id: 'eileen_arrive', mode: 'result', scope: 'npc', idleOnly: true,
      targets: ['eileen'],
      when: { time: { gte: DAY(4, 6) }, phase: ['morning', 'afternoon'] },
      text: '一队人马从东边官道进了镇，打头的是个穿白金制服的年轻女人。',
      effects: { move: 'manor', worldFlags: { eileen_arrived: true } }
    },
    {
      id: 'convent_shortage', mode: 'result', scope: 'npc',
      targets: ['cecilia'],
      when: { time: { gte: DAY(5, 6) }, phase: ['morning', 'afternoon'] },
      text: '修道院的存粮见了底，孩子们一天只吃一顿。',
      effects: { add: { need: 20, duty: 10 } }
    },
    {
      id: 'first_crack', mode: 'result', scope: 'npc',
      when: { metrics: { corruption: { gte: 30 } }, phase: ['night'] },
      text: '镇上开始有人私下议论，说某个人的样子不太一样了。',
      effects: { worldFlags: { rumor_started: true } }
    },
    {
      id: 'lord_moves', mode: 'result', scope: 'world',
      when: { time: { gte: DAY(6, 0) } },
      text: '领主府的管事开始频繁地派人来镇上走动，说是办事，眼睛却在到处看。',
      effects: { worldFlags: { lord_aggressive: true } }
    }
  ]

  // ============================================================
  // 六、角色（初始 world 用）
  // ============================================================

  const LOCATIONS = { town: '镇上', inn: '断剑与麦酒', church: '圣辉大教堂', manor: '领主山庄', casino: '地下赌场', wilds: '城外荒原' }
  const STAGES = { 0: '正常', 1: '异常', 2: '沉沦', 3: '臣服' }
  // 仅对列出的驱动力做按时间回归；债务、觉醒度、堕落度等进程指标不自动回归。
  const DRIFT = { perHour: 0.10, needPerHour: 2, fields: ['pride', 'duty', 'lust', 'fear', 'shame', 'curiosity', 'loyalty', 'sanity'] }
  const ALL_DRIVES = ['pride', 'duty', 'lust', 'fear', 'shame', 'need', 'curiosity', 'loyalty']

  /**
   * 造一个角色
   * @param {object} cfg
   * @returns {object}
   */
  function makeNpc(cfg) {
    const values = {}
    for (const k of ALL_DRIVES) values[k] = cfg.drives?.[k] ?? 0
    values.corruption = cfg.corruption ?? 0
    values.sanity = cfg.sanity ?? 80
    values.exposure = cfg.exposure ?? 0
    Object.assign(values, cfg.values || {})

    return {
      id: cfg.id,
      name: cfg.name,
      monitored: true,
      alive: true,
      location: cfg.location,
      values,
      stage: 0,
      plan: cfg.plan.slice(),
      nodePlan: ['stage_1', 'stage_2', 'stage_3'],
      activity: null,
      activityHistory: {},
      nodeStates: {},
      flags: {},
      lastAction: null,
      // 桥接私用：基线，用于漂移
      _baseline: { ...values },
      _metricBounds: { ...(cfg.metricBounds || {}) },
      // 桥接私用：底线
      _lines: (cfg.lines || []).slice()
    }
  }

  const ROSTER = [
    makeNpc({
      id: 'aurora', name: '奥萝拉', location: 'inn',
      drives: { duty: 70, shame: 65, fear: 50, need: 75, loyalty: 60 },
      plan: ['work_shift', 'work_extra', 'pray', 'care', 'visit_bond', 'serve', 'conceal', 'confess', 'rest'],
      lines: ['no_physical_contact', 'no_admit', 'never_abandon']
    }),
    makeNpc({
      id: 'nise', name: '妮丝', location: 'inn',
      drives: { pride: 80, curiosity: 75, lust: 40, fear: 30 },
      plan: ['show_off', 'gamble', 'explore', 'sneak', 'socialize', 'drink', 'resist', 'rest', 'indulge'],
      lines: ['no_admit', 'never_abandon']
    }),
    makeNpc({
      id: 'eileen', name: '艾琳', location: 'manor',
      drives: { pride: 95, duty: 70, fear: 45, shame: 55 },
      plan: ['resist', 'work_shift', 'pray', 'socialize', 'explore', 'conceal', 'submit', 'rest'],
      lines: ['no_public_shame', 'resist']
    }),
    makeNpc({
      id: 'cecilia', name: '塞西莉亚', location: 'church',
      drives: { duty: 85, loyalty: 80, shame: 70, need: 60 },
      plan: ['care', 'pray', 'work_shift', 'serve', 'conceal', 'confess', 'submit', 'rest'],
      lines: ['never_abandon', 'no_public_shame']
    }),
    makeNpc({
      id: 'gulan', name: '古兰', location: 'inn',
      drives: { pride: 75, duty: 90, fear: 20, loyalty: 85 },
      plan: ['work_shift', 'resist', 'care', 'rest', 'socialize', 'explore'],
      lines: ['no_public_shame']
    })
  ]

  // ============================================================
  // 七、配置构造
  // ============================================================

  /**
   * 判断某角色某条底线是否仍然有效
   * @param {object} line
   * @param {object} values
   * @returns {boolean}
   */
  function lineHolds(line, values) {
    for (const [k, cond] of Object.entries(line.holdsWhile || {})) {
      const v = values[k] ?? 0
      for (const [op, n] of Object.entries(cond)) {
        const ok = op === 'gt' ? v > n
                 : op === 'gte' ? v >= n
                 : op === 'lt' ? v < n
                 : op === 'lte' ? v <= n
                 : op === 'eq' ? v === n
                 : op === 'ne' ? v !== n
                 : false
        if (!ok) return false
      }
    }
    return true
  }

  /**
   * 取角色当前生效的底线类型
   * @param {object} npc
   * @returns {string[]}
   */
  function activeLineTypes(npc) {
    return (npc._lines || [])
      .map(id => LINES[id])
      .filter(Boolean)
      .filter(l => lineHolds(l, npc.values))
      .map(l => l.type)
  }

  /**
   * 生成 GPT 需要的 config
   * @returns {object}
   */
  function buildConfig() {
    const destinations = { work_shift: 'town', work_extra: 'town', trade: 'town', pray: 'church', care: 'church', visit_bond: 'inn', socialize: 'town', serve: 'manor', gamble: 'casino', drink: 'inn', indulge: 'manor', explore: 'wilds', sneak: 'town' }
    const actions = ACTIONS.map(a => ({
      id: a.id,
      priority: a.priority,
      when: a.when,
      effects: { ...a.effects, ...(destinations[a.id] ? { move: destinations[a.id] } : {}),
        ...(a.occupation?.releaseRule ? { npcFlags: { [a.occupation.releaseRule]: false } } : {}) },
      occupation: a.occupation,
      narration: a.narration || (a.occupation?.kind === 'important'
        ? '{name}开始了一项重要活动：' + a.occupation.label + '。请演绎当前进展；实际结束时按活动契约申报 finish。'
        : undefined),
      _blockedBy: a.blockedBy || []
    }))

    return {
      policy: { ordinaryGraceMin: 120 },
      phases: PHASES,
      maxSteps: 128,
      actions,
      events: EVENTS,
      nodes: NODES,
      metricBounds: Object.fromEntries(ROSTER.map(n => [n.id, { ...Object.fromEntries([...ALL_DRIVES, 'corruption', 'sanity', 'exposure'].map(k => [k, [0, 100]])), ...n._metricBounds }])),
      releaseRules: {
        manualRelease: () => false, // 只等待明确的 finish/cancel，不自动解除。
        assignmentResolved: { flags: { assignmentResolved: true } },
        serviceResolved: { flags: { serviceResolved: true } },
        indulgenceResolved: { flags: { indulgenceResolved: true } }
      },

      /**
       * GPT 留的钩子：筛选行动时调用
       * 在这里实现底线判定
       */
      allowed(ctx, item) {
        const npc = ctx.npc
        if (!npc || !item._blockedBy?.length) return true
        const types = activeLineTypes(npc)
        return !item._blockedBy.some(t => types.includes(t))
      }
    }
  }

  /**
   * 生成初始 world
   * @returns {object}
   */
  function buildInitialWorld() {
    const npcs = {}
    for (const n of ROSTER) {
      npcs[n.id] = JSON.parse(JSON.stringify(n))
      npcs[n.id]._baseline = { ...n.values }
    }

    return {
      // 开场是暮色，初始化时间与之对齐：第 1 天 18:00（属于 night 时段）
      timeMin: 18 * 60,
      playerLocation: 'inn',
      interactingIds: [],
      flags: {},
      npcs
    }
  }

  root.OKH_APP_CONFIG = Object.freeze({
    PHASES,
    LOCATIONS,
    STAGES,
    DRIFT,
    LINES,
    ACTIONS,
    NODES,
    EVENTS,
    ROSTER,
    ALL_DRIVES,
    buildConfig,
    buildInitialWorld,
    activeLineTypes,
    lineHolds
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_CONFIG
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
;

;
/**
 * @module okh_app_world
 * @updated 2026-11-09
 * @status implemented
 * @reason 按聊天隔离的单一存档、显式持久化、原子状态及检查点提交
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
  function readEnvelope(s = session()) {
    const data = parse(rawGet(s, s.key), '存档');
    if (!data) return null;
    u.check(data.version === 1 && data.chatId === s.id && data.world?.bg?.version === 2 &&
      Array.isArray(data.history), '存档版本或聊天归属不匹配，需要显式迁移');
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
      const old = parse(rawGet(s, 'okh_gpt.world'), '旧版存档');
      u.check(old?.bg?.version === 2, '没有可导入的旧版 v2 world');
      u.validateWorld(old);
      old.bg.generations ||= {};
      await writeEnvelope(s, { version: 1, chatId: s.id, world: old, history: [] });
      return old;
    });
  }
  async function publishDerived(s, values, revision) {
    assertSession(s);
    u.check(loadWorld(s)?.bg.revision === revision, '派生信息已过期，拒绝发布');
    // 仅为旧世界书兼容缓存；权威状态和队列始终在同一 envelope 中。
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
    loadWorld, ensureWorld, readEnvelope, commit, importLegacy, publishDerived, store,
    resetWorld: () => ensureWorld(true), STORAGE_KEY: KEY });
})(globalThis);

;
/**
 * @module okh_app_adapter
 * @updated 2026-11-09
 * @status implemented
 * @reason 控制器接入、按时间的纯数值变化，以及脱离原始监听的提示快照
 */
(function (root) {
  'use strict';
  const u = root.OKHBackgroundModules?.utils;
  const CFG = root.OKH_APP_CONFIG, W = root.OKH_APP_WORLD;
  if (!u || !CFG || !W || !root.OKHBackgroundAdapter) throw Error('adapter 依赖缺失');
  function driftEffects({ world, fromMin, toMin }) {
    const hours = (toMin - fromMin) / 60, policy = CFG.DRIFT;
    const retention = Math.pow(1 - policy.perHour, hours), changes = [];
    for (const npc of Object.values(world.npcs).filter(u.active)) {
      const add = {}, base = npc._baseline || {};
      for (const name of policy.fields) {
        if (!u.own(npc.values, name) || !Number.isFinite(base[name])) continue;
        const value = base[name] + (npc.values[name] - base[name]) * retention;
        add[name] = Math.max(0, Math.min(100, value)) - npc.values[name];
      }
      if (Number.isFinite(npc.values.need)) {
        add.need = Math.max(0, Math.min(100, npc.values.need + policy.needPerHour * hours)) - npc.values.need;
      }
      if (Object.keys(add).length) changes.push({ target: npc.id, add });
    }
    return changes;
  }
  function runtimeConfig() { return { ...CFG.buildConfig(), timeEffects: driftEffects }; }
  function createController(s = W.session()) {
    return root.OKHBackgroundAdapter.createController({
      config: runtimeConfig(),
      readWorld: async () => W.loadWorld(s) || await W.ensureWorld(false, s),
      commit: data => W.commit(s, data)
    });
  }
  function buildLedger(world) {
    const day = Math.floor(world.timeMin / 1440) + 1, local = world.timeMin % 1440;
    const phase = u.phaseAt(world.timeMin, CFG.buildConfig());
    const label = CFG.PHASES.find(p => p.id === phase.id)?.label || phase.id;
    const clock = String(Math.floor(local / 60)).padStart(2, '0') + ':' + String(local % 60).padStart(2, '0');
    const here = Object.values(world.npcs).filter(n => n.alive !== false && n.location === world.playerLocation);
    const lines = ['【第 ' + day + ' 天 · ' + label + ' · ' + clock + '】',
      '玩家位置：' + (CFG.LOCATIONS[world.playerLocation] || world.playerLocation),
      '同地点：' + (here.map(n => n.name).join('、') || '无'),
      '可用活动解除规则：' + Object.keys(CFG.buildConfig().releaseRules).join('、') +
        '。无匹配业务条件时使用 manualRelease，等待明确 finish/cancel。'];
    if (world.focusNpcId && world.npcs[world.focusNpcId]) lines.push('本轮聚焦：' + world.npcs[world.focusNpcId].name);
    if (world.playerState?.injury) lines.push('玩家伤情：' + world.playerState.injury.type);
    // 事件由 prepareGeneration 的批次另行提供，避免 ledger 再次注入旧事件。
    return lines.join('\n');
  }
  function buildWatch(world) {
    const monitored = root.OKHBackground.watch(world);
    return { timeMin: world.timeMin, day: Math.floor(world.timeMin / 1440) + 1,
      list: Object.values(monitored.npcs).map(n => ({ id: n.id, name: n.name,
        location: n.location, stage: CFG.STAGES[n.stage] ?? n.stage,
        values: u.clone(n.values), availability: n.availability, activity: n.activity?.label || null,
        sameLocation: n.location === world.playerLocation })) };
  }
  root.OKH_APP_ADAPTER = Object.freeze({ createController, runtimeConfig, driftEffects, buildLedger, buildWatch });
})(globalThis);

;
/**
 * @module okh_app_parse
 * @updated 2026-11-09
 * @status implemented
 * @reason 只解析唯一闭合状态栏；保留活动实例和同轮多项活动顺序
 */
(function (root) {
  'use strict';
  const u = root.OKHBackgroundModules?.utils;
  if (!u) throw Error('parse 缺少 utils');
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
    while ((match = re.exec(body || '')) !== null) out.push({ name: match[1].toLowerCase(), attrs: parseAttrs(match[2]) });
    return out;
  }
  function grabTags(text, tagName) {
    return rawTags(statusBody(text)).filter(t => t.name === tagName).map(t => t.attrs);
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
      const match = /^(\d+)日\s*(\d{1,2}):(\d{2})$/.exec(time.end);
      if (match && Number(match[1]) >= 1 && Number(match[2]) < 24 && Number(match[3]) < 60) {
        const value = (Number(match[1]) - 1) * 1440 + Number(match[2]) * 60 + Number(match[3]);
        if (u.minute(value)) endMin = value;
      }
      if (endMin === null) diagnostics.push('end 格式非法，不能校验落幕时间');
    }
    return { elapsed, end: time?.end || null, endMin, diagnostics, hasStatus: body !== null };
  }
  function buildFront(text, now, world, options = {}) {
    const tags = rawTags(statusBody(text)), diagnostics = [], npcs = {}, virtual = {};
    const front = { interactingIds: [] }, interacting = new Set();
    const token = options.token || String(now), config = options.config || {};
    function known(id) {
      if (u.own(world.npcs, id)) return true;
      diagnostics.push('忽略未知角色：' + id);
      return false;
    }
    function patch(id) { return npcs[id] ||= {}; }
    function location(value) {
      u.check(u.id(value) && (!options.locations || u.own(options.locations, value)), '未知地点：' + value);
      return value;
    }
    let index = 0, focusCount = 0, injuryCount = 0;
    for (const { name, attrs: a } of tags) {
      if (name === 'move') {
        const to = location(a.to);
        if (a.npc) { if (known(a.npc)) patch(a.npc).location = to; }
        else front.playerLocation = to;
      } else if (name === 'interact') {
        if (known(a.npc)) interacting.add(a.npc);
      } else if (name === 'focus') {
        u.check(++focusCount === 1, '本轮只能申报一个 focus');
        if (known(a.npc)) front.focusNpcId = a.npc;
      } else if (name === 'injury') {
        u.check(++injuryCount === 1 && /^\d+$/.test(a.level || '') &&
          u.minute(Number(a.level)) && typeof a.type === 'string' && a.type.trim(), 'injury 申报非法');
        front.playerInjury = { level: Number(a.level), type: a.type };
      } else if (name === 'activity') {
        if (!known(a.npc)) continue;
        u.check(['start', 'finish', 'cancel'].includes(a.op), 'activity op 非法');
        if (!u.own(virtual, a.npc)) virtual[a.npc] = world.npcs[a.npc].activity;
        const cur = virtual[a.npc];
        let change;
        if (a.op === 'start') {
          const kind = a.kind || 'ordinary';
          u.check(['ordinary', 'important', 'special'].includes(kind) && a.label?.trim(), '活动必须有合法 kind 和 label');
          const same = cur && cur.kind === kind && cur.label.trim() === a.label.trim();
          const id = a.id || (same ? cur.id : 'act:' + a.npc + ':' + token + ':' + index++);
          u.check(u.id(id), '活动 ID 非法');
          change = { op: 'start', id, kind, label: a.label.trim(), source: 'narrative' };
          if (a.replace === 'true') change.replace = true;
          if (a.rule) {
            u.check(kind !== 'ordinary' && u.own(config.releaseRules || {}, a.rule), '活动解除规则未知或不适用');
            change.releaseRule = a.rule;
          } else if (same && cur.releaseRule) change.releaseRule = cur.releaseRule;
          if (kind !== 'ordinary') u.check(change.releaseRule, 'important/special 必须申报 rule');
          virtual[a.npc] = { ...change, startedAt: same ? cur.startedAt : now };
        } else {
          if (!cur) { diagnostics.push('忽略无当前活动的 ' + a.op + '：' + a.npc); continue; }
          change = { op: a.op, id: a.id || cur.id };
          virtual[a.npc] = null;
        }
        (patch(a.npc).activities ||= []).push(change);
        if (a.to !== undefined) patch(a.npc).location = location(a.to);
      }
    }
    for (const [id, data] of Object.entries(npcs)) {
      if (data.activities?.some(a => a.op === 'start')) interacting.delete(id);
      if (data.activities?.length === 1) {
        data.activity = data.activities[0];
        delete data.activities;
      }
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
    return { expectedMin, reportedEnd: parsed.end, reportedMin: parsed.endMin,
      ok: parsed.endMin === null ? null : parsed.endMin === expectedMin,
      deviationMin: parsed.endMin === null ? null : parsed.endMin - expectedMin };
  }
  root.OKH_APP_PARSE = Object.freeze({ statusBody, grabTags, parseAttrs, parseActivity,
    parseInteract, parseMove, parseStatusBar, buildFront, compareEnd });
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
      { token: id, config: CFG.buildConfig(), locations: CFG.LOCATIONS });
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
 * @updated 2026-11-09 07:00
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
      阶段: STAGE[n.stage] || n.stage,
      堕落: Math.round(n.values.corruption ?? 0),
      理智: Math.round(n.values.sanity ?? 0),
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
 * @updated 2026-11-09 07:45
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
      .filter(n => n.alive !== false && n.location === world.playerLocation)

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
      const stage = STAGE[n.stage] || n.stage
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
 * @updated 2026-11-09
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
    return { coreVersion: GPT.version, mode: W.store.mode, chatId: W.chatId(),
      revision: W.loadWorld()?.bg.revision ?? null };
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
    step: H.step, applyFront: H.applyFront, beforeGeneration: H.beforeGeneration, onMessage: H.onMessage,
    cancelGeneration: H.cancelGeneration, syncHistory: H.syncHistory, restore: H.restore,
    config: A.runtimeConfig, status: D.status, watch: D.watch, ledger: D.ledger, queue: D.queue,
    renderHud: HUD ? HUD.render : () => false,
    showWatch: value => HUD?.setWatchVisible(value), CFG, W, A, H, D, HUD });
  console.log('[OKH_APP] 修复版已加载；请 await OKH_APP.init()，自动运行用 await OKH_APP.start()');
})(globalThis);
