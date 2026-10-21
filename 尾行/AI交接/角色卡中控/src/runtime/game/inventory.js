"use strict";
// inventory：依赖由 game.js 装配，每个游戏实例独立持有状态。
const R = require("../../config/rules.json");
const T = require("../tags.js");
const { HUNTER_MODES } = require("./constants.js");

function createInventorySystem({ g, L, log, syncHeartTags }) {
  function syncEquippedTags() {
    const stack = g.tags || (g.tags = []);
    const equippedIds = new Set();
    for (const it of g.player.inventory || []) {
      if (it.equipped) {
        equippedIds.add(it.id);
        const def = R.items && R.items[it.id];
        if (def && def.tag) {
          const rt = R.tags[def.tag];
          if (rt) {
            T.apply(stack, {
              id: rt.id,
              name: rt.name,
              owner: rt.owner || "player",
              category: rt.category,
              effects: rt.value
                ? [{ category: rt.category, value: rt.value }]
                : [],
              duration: { type: "flag" },
            });
          }
        }
      }
    }
    for (const [itemId, def] of Object.entries(R.items || {})) {
      if (def.tag && !equippedIds.has(itemId)) {
        T.remove(stack, def.tag);
      }
    }
  }

  function addItem(itemId, count = 1) {
    const def = R.items && R.items[itemId];
    if (!def) {
      log(`[行囊] 未知物品 "${itemId}"`);
      return false;
    }
    g.player.inventory = g.player.inventory || [];
    const existing = g.player.inventory.find((it) => it.id === itemId);
    if (existing) {
      existing.count = (existing.count || 1) + count;
    } else {
      g.player.inventory.push({ id: itemId, count, equipped: false });
    }
    log(`[行囊] 获得物品：${def.name} × ${count}`);
    return true;
  }

  function removeItem(itemId, count = 1) {
    g.player.inventory = g.player.inventory || [];
    const idx = g.player.inventory.findIndex((it) => it.id === itemId);
    if (idx < 0) return false;
    const it = g.player.inventory[idx];
    it.count = (it.count || 1) - count;
    if (it.count <= 0) {
      if (it.equipped) unequipItem(itemId);
      g.player.inventory.splice(idx, 1);
    }
    return true;
  }

  function equipItem(itemId) {
    g.player.inventory = g.player.inventory || [];
    const it = g.player.inventory.find((i) => i.id === itemId);
    if (!it) return { ok: false, reason: "行囊中未找到该物品" };
    const def = R.items && R.items[itemId];
    if (!def) return { ok: false, reason: "未知物品规则" };
    if (
      !def.slot &&
      def.type !== "tool" &&
      def.type !== "gear" &&
      def.type !== "disguise"
    ) {
      return { ok: false, reason: "该物品不可随身装备" };
    }
    const slot = def.slot || def.type;
    // 槽位互斥（如 tool 槽位，开锁工具与攀爬套装互斥占槽）
    for (const other of g.player.inventory) {
      if (other.id !== itemId && other.equipped) {
        const otherDef = R.items && R.items[other.id];
        const otherSlot = otherDef?.slot || otherDef?.type;
        if (otherSlot === slot) {
          other.equipped = false;
          if (otherDef?.tag) T.remove(g.tags || [], otherDef.tag);
          log(`[行囊] 槽位互斥：卸下 ${otherDef?.name || other.id}`);
        }
      }
    }
    it.equipped = true;
    syncEquippedTags();
    log(`[行囊] 装备：${def.name}（槽位：${slot}）`);
    return { ok: true, item: def.name, slot };
  }

  function unequipItem(itemId) {
    g.player.inventory = g.player.inventory || [];
    const it = g.player.inventory.find((i) => i.id === itemId);
    if (!it) return { ok: false, reason: "行囊中未找到该物品" };
    it.equipped = false;
    const def = R.items && R.items[itemId];
    if (def && def.tag) {
      T.remove(g.tags || [], def.tag);
    }
    log(`[行囊] 卸下：${def?.name || itemId}`);
    return { ok: true, item: def?.name || itemId };
  }

  function useItem(itemId) {
    g.player.inventory = g.player.inventory || [];
    const it = g.player.inventory.find(
      (i) => i.id === itemId && (i.count || 1) > 0,
    );
    if (!it) return { ok: false, reason: "行囊中无此可用消耗品" };
    const def = R.items && R.items[itemId];
    if (!def || def.type !== "consumable")
      return { ok: false, reason: "该物品不是消耗品" };

    if (itemId === "energy_drink") {
      if (!HUNTER_MODES.includes(g.mode)) {
        return { ok: false, reason: "能量饮料仅限夜间行动窗口可用" };
      }
      if (g.nightDrinkUsed) {
        return { ok: false, reason: "今晚已饮用过能量饮料（每晚限一瓶）" };
      }
      g.nightDrinkUsed = true;
      removeItem(itemId, 1);
      const staminaMax = g.player.staminaMax || 100 + (g.player.str || 4) * 5;
      const curStam = L.get("stamina");
      const staminaGain = Math.min(20, staminaMax - curStam);
      L.commit(
        { stamina: staminaGain, heart: 10 },
        { reason: "item_energy_drink" },
      );
      syncHeartTags();
      log(`[行囊] 饮用能量饮料：体力+${staminaGain}，心悸心跳+10`);
      return {
        ok: true,
        msg: "饮用能量饮料：体力+20，心悸心跳+10",
        stamina: staminaGain,
        heart: 10,
      };
    }

    if (itemId === "bento") {
      removeItem(itemId, 1);
      const staminaMax = g.player.staminaMax || 100 + (g.player.str || 4) * 5;
      const curStam = L.get("stamina");
      const staminaGain = Math.min(20, staminaMax - curStam);
      L.commit({ stamina: staminaGain }, { reason: "item_bento" });
      log(`[行囊] 食用便当：体力+${staminaGain}`);
      return {
        ok: true,
        msg: `食用便当：体力+${staminaGain}`,
        stamina: staminaGain,
      };
    }

    if (itemId === "onigiri") {
      removeItem(itemId, 1);
      const staminaMax = g.player.staminaMax || 100 + (g.player.str || 4) * 5;
      const curStam = L.get("stamina");
      const staminaGain = Math.min(8, staminaMax - curStam);
      L.commit({ stamina: staminaGain }, { reason: "item_onigiri" });
      log(`[行囊] 食用饭团：体力+${staminaGain}`);
      return {
        ok: true,
        msg: `食用饭团：体力+${staminaGain}`,
        stamina: staminaGain,
      };
    }

    if (itemId === "coffee") {
      removeItem(itemId, 1);
      log(`[行囊] 饮用热咖啡：提神醒脑`);
      return { ok: true, msg: "饮用热咖啡：提神醒脑" };
    }

    return { ok: false, reason: "暂未实装该消耗品使用效果" };
  }

  return {
    syncEquippedTags,
    addItem,
    removeItem,
    equipItem,
    unequipItem,
    useItem,
  };
}

module.exports = { createInventorySystem };
