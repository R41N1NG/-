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
