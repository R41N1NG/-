/**
 * @module okh_app_worldbook
 * @updated 2026-11-23 19:57
 * @status active
 * @reason 已揭晓的人物档案需要随存档常驻，同时服从事件交付与回滚。
 * @deps ['okh_app_world']
 * @provides { sync, isUnlocked, pendingReveal }
 */
(function (root) {
  'use strict';
  const W = root.OKH_APP_WORLD;
  const PACKS = /* __OKH_PREINJECTED_WORLDBOOK__ */ [];
  const REVEAL_IDS = new Set(PACKS.flatMap(pack => pack.afterEvents));
  const BOOK_PREFIX = 'OKH_Chat_Archive_';
  const entryId = entry => entry.extra?.okh_preinjected_id;
  const managedBook = name => typeof name === 'string' && name.startsWith(BOOK_PREFIX);

  function bookName(session) {
    const ctx = W.context();
    // Chat filenames can repeat across characters and may contain path characters.
    const identity = JSON.stringify([ctx?.groupId ?? ctx?.characters?.[ctx.characterId]?.avatar ?? '', session.id]);
    let a = 2166136261, b = 2246822519;
    for (let i = 0; i < identity.length; i++) {
      const code = identity.charCodeAt(i);
      a = Math.imul(a ^ code, 16777619);
      b = Math.imul(b ^ code, 3266489917);
    }
    return BOOK_PREFIX + (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0');
  }

  function unlockedPacks(world) {
    // The flag is set when the event settles, before the reveal reply is delivered.
    const delivered = new Set((world?.bg?.queue || [])
      .filter(event => event.kind === 'event' && event.status === 'delivered' && event.generationId)
      .map(event => event.definitionId));
    return PACKS.filter(pack => world?.flags?.[pack.requiredFlag] === true &&
      pack.afterEvents.some(id => delivered.has(id)));
  }

  function isUnlocked(world, requiredFlag) {
    return unlockedPacks(world).some(pack => pack.requiredFlag === requiredFlag);
  }

  function pendingReveal(world, ids) {
    return world.bg.queue.find(event => event.kind === 'event' && event.status === 'pending' &&
      REVEAL_IDS.has(event.definitionId) && ids.includes(event.id));
  }

  function sameEntry(current, wanted) {
    return entryId(current) === entryId(wanted) && current.name === wanted.name &&
      current.content === wanted.content && current.enabled === true &&
      current.strategy?.type === wanted.strategy.type &&
      JSON.stringify(current.strategy.keys) === JSON.stringify(wanted.strategy.keys) &&
      current.position?.type === wanted.position.type && current.position.role === wanted.position.role &&
      current.position.depth === wanted.position.depth && current.position.order === wanted.position.order &&
      current.probability === wanted.probability && current.recursion?.prevent_incoming === true &&
      current.recursion?.prevent_outgoing === true;
  }

  /**
   * Synchronize only the generated book for this chat, retaining independent entries.
   * @returns {Promise<boolean>} Whether any entries will be active in the generated book.
   */
  async function updateBook(session, name, wanted) {
    if (!root.getWorldbookNames().includes(name)) {
      if (!wanted.length) return false;
      await root.createWorldbook(name, wanted);
    }
    const existing = await root.getWorldbook(name);
    W.assertSession(session);
    const generated = existing.filter(entry => entryId(entry));
    const other = existing.filter(entry => !entryId(entry));
    if (generated.length !== wanted.length ||
        !wanted.every(entry => generated.some(current => sameEntry(current, entry)))) {
      await root.replaceWorldbook(name, [...other, ...wanted]);
      W.assertSession(session);
    }
    return wanted.length > 0 || other.some(entry => entry.enabled);
  }

  /**
   * Reconcile the currently visible chat's book against the specified world snapshot.
   * @returns {Promise<Array>} Entries to include in the prompt when no native book is available.
   */
  async function sync(session, world) {
    W.assertSession(session);
    const wanted = unlockedPacks(world).flatMap(pack => pack.entries);
    const apis = ['getChatWorldbookName', 'rebindChatWorldbook', 'getWorldbookNames',
      'createWorldbook', 'getWorldbook', 'replaceWorldbook'];
    if (!apis.every(api => typeof root[api] === 'function')) return wanted;

    const currentBook = () => root.getChatWorldbookName('current');
    const name = bookName(session);
    try {
      let bound = currentBook();
      if (managedBook(bound) && bound !== name) {
        // A branched or copied chat can inherit the original chat's book binding.
        await root.rebindChatWorldbook('current', null);
        W.assertSession(session);
        bound = currentBook();
      }
      if (bound && bound !== name) return wanted;
      if (!bound && !wanted.length) return [];
      const active = await updateBook(session, name, wanted);
      if (currentBook() === bound && bound !== (active ? name : null)) {
        await root.rebindChatWorldbook('current', active ? name : null);
        W.assertSession(session);
      }
      return currentBook() === name ? [] : wanted;
    } catch (error) {
      W.assertSession(session);
      // If native entries may still be active, let the caller retry before generating.
      if (managedBook(currentBook())) throw error;
      console.warn('[APP] 聊天世界书同步失败，改用当轮档案：', error.message);
      return wanted;
    }
  }

  root.OKH_APP_WORLDBOOK = Object.freeze({ sync, isUnlocked, pendingReveal });
})(globalThis);
