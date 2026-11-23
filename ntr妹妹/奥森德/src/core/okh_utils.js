/**
 * @module okh_utils
 * @updated 2026-11-23 19:39
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
        event.afterNodes === undefined || typeof event.afterNodes === 'boolean',
        '事件 afterNodes 必须是布尔值'
      );
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

