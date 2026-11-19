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

