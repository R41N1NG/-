/**
 * @module okh_turn
 * @updated 2026-11-23 19:39
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
      events.evaluate(world, config, ctx, true);
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

    function collectTimeline(world, front, fromMin, toMin, config) {
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
        const event = (config.events || []).find(event => event.id === item.eventId);
        const defaultAt = event?.settleAtEnd ? toMin : fromMin;
        getBucket(map, resolveAt(item.at, defaultAt, fromMin, toMin)).resolveEvents.push(item);
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

    function applyBucket(world, bucket, config, blockedIds, workWindow) {
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

      const ctx = { world, phase: u.phaseAt(world.timeMin, config), blockedIds, ...workWindow };
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
      const workUntilMin = front.workUntilMin ?? command.toMin;
      u.check(u.minute(workUntilMin) && workUntilMin >= fromMin && workUntilMin <= command.toMin, '工时区间超出本轮时间');
      const workWindow = { turnFromMin: fromMin, workUntilMin };
      const timeline = collectTimeline(state, front, fromMin, command.toMin, config);
      const report = { duplicate: false, released: [], actions: [] };

      report.released.push(...activity.releaseExpiredOrdinary(state, config));
      if (timeline.has(fromMin)) applyBucket(state, timeline.get(fromMin), config, blockedIds, workWindow);
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
          applyBucket(state, timeline.get(next), config, blockedIds, workWindow);
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
