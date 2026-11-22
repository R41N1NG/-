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
