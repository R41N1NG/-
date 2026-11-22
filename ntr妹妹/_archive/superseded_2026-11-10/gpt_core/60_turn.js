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
