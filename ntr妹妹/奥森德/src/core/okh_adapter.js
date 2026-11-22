/**
 * @module okh_adapter
 * @updated 2026-11-20
 * @status active
 * @reason 串行读写、原子替换回复、生成记录裁剪与兼容检查点恢复
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
      prepareGeneration(generationId, limit = 8, preparationWorld = null) {
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

            const view = u.clone(preparationWorld || before);

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
          const batch = api.prepare(preparationWorld || state, limit);

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

      finishReply(command, generationId = null, replacement = null) {
        return serial(async () => {
          const before = await readWorld();

          const base = replacement === null ? before : (typeof config.prepareCheckpoint === 'function'
            ? config.prepareCheckpoint(u.clone(replacement)) : u.clone(replacement));
          u.check(base?.bg?.version === 2, '替换回复需要完整 v2 检查点');
          if (replacement !== null) {
            base.bg.revision = before.bg.revision;
            // A checkpoint can contain the original reply's then-prepared generation.
            // Replacing that reply must not resurrect a request that already completed.
            for (const [id, generation] of Object.entries(base.bg.generations)) {
              if (generation.status === 'prepared' && before.bg.generations[id]?.status === 'completed') delete base.bg.generations[id];
            }
          }

          const result = api.advance(
            base,
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

            result.state.bg.generations[generationId] = u.clone(generation);
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
            base,
            replacement === null ? 'finish-reply' : 'replace-reply',
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
