"use strict";
// checks：依赖由 game.js 装配，每个游戏实例独立持有状态。
const R = require("../../config/rules.json");
const T = require("../tags.js");
const C = require("../checks.js");
const D = require("../dice.js");

function createCheckSystem({ g, seedFor, isFamiliar, investigation }) {
  function targetEffectiveAcuity() {
    const acuityMod = T.summarize(g.tags || [], "acuity").sum;
    return Math.max(1, Math.min(10, (g.target.per || 4) + acuityMod));
  }

  function gain({ threat = null, dist = g.dist, stim = 0 }) {
    const alertD = threat
      ? C.alertDelta({
          threat,
          dist,
          env: g.env,
          acuity: targetEffectiveAcuity(),
          familiar: isFamiliar(),
        })
      : 0;
    const heartD = stim ? C.heartDelta({ stim, nrv: g.player.nrv }) : 0;
    return { alertD, heartD };
  }

  function runCheck(entry, args, seq) {
    const cat = categoryOf(entry.id);
    const sum = T.summarize(g.tags || (g.tags = []), cat);
    const mods = sum.breakdown
      .filter((h) => h.owner !== "target")
      .map((h) => ({ src: h.src, v: h.v }));
    const targetMod = sum.breakdown
      .filter((h) => h.owner === "target")
      .reduce((s, h) => s + h.v, 0);
    const pity =
      T.PITY_BONUS && g.consecFails >= 2 ? C.pityBonus(g.consecFails) : 0;
    if (pity) mods.push({ src: "连败保底", v: pity });
    const nextBonus = investigation.nextBonus(entry.id);
    if (nextBonus) mods.push({ src: "已掌握下一站", v: nextBonus });

    const dc = (R.checks[entry.check] ?? 10) - targetMod; // 她的暗账降 DC 表现为负修正
    // 优势双骰：属性阈值标签自动驱动（效果只认标签；冲突对抗 2d10 不走此处，天然不吃）
    const advTagged = (g.tags || []).some(
      (t) => t.id === "adv_" + attrKeyOf(entry.id),
    );
    const mode =
      (args && args.adv) || advTagged
        ? "adv"
        : args && args.dis
          ? "dis"
          : "normal";
    const roll = D.rollD20(seedFor(seq), mode);
    // v0.6：勉强档仅尾随系词条适用（她在场、动作泡在她感官里）
    const res = C.d20Check({
      d20: roll.d20,
      attr: attrOf(entry.id),
      mods,
      dc,
      stealth: (R.check.graceIds || []).includes(entry.id),
    });

    const attrKey = attrKeyOf(entry.id);
    const ATTR_NAMES = {
      agi: "敏捷",
      str: "体格",
      int: "情报",
      cha: "口才",
      nrv: "胆量",
    };
    const attr = { name: ATTR_NAMES[attrKey] || "属性", v: attrOf(entry.id) };
    const targetTags = sum.breakdown.filter((h) => h.owner === "target");
    const darkReveal = targetTags.length
      ? targetTags
          .map((h) => `${h.src} (${h.v >= 0 ? "+" : ""}${h.v})`)
          .join("、")
      : null;

    return {
      roll,
      res,
      mods,
      dc,
      sum,
      attr,
      targetMod,
      darkReveal,
      heartState: {
        value: g.ledger.get("heart"),
        sweetLow: R.check.sweetLow,
        sweetHigh:
          R.check.sweetHigh +
          ((g.tags || []).some((t) => t.id === "adv_nrv")
            ? R.advantage.sweetHighBonus
            : 0),
        sweet: (g.tags || []).some((t) => t.id === "sweet_focus"),
      },
    };
  }

  function attrKeyOf(id) {
    // 尾随系/暴力系走敏捷或体格，观察系走情报，互动系走口才（返回属性键名，供优势标签匹配）
    const agility = [
      "follow",
      "approach",
      "withdraw",
      "hide",
      "wall",
      "enter_tail",
      "stop",
      "wait",
      "cross",
      "cover",
      "fake_phone",
      "fake_call",
      "shop_enter",
      "window_watch",
      "cafe_sit",
      "ride_along",
      "transfer",
      "follow_work",
      "ride_follow",
      "car_follow",
      "climb",
    ];
    const brawn = ["barrier", "pry", "drag", "pin", "lockpick", "break_in"];
    const intel = [
      "photo",
      "scan",
      "deduce",
      "timing",
      "listen",
      "perch",
      "note",
      "record",
      "plate",
      "trash",
      "pick",
      "listen_home",
      "locate",
      "watch_lights",
      "check_mailbox",
      "watch_visitor",
      "check_camera",
      "check_door",
      "stair_lurk",
      "door_listen",
      "door_peep",
      "try_handle",
      "ransack",
      "plant_bug",
      "cover_tracks",
      "plan_exit",
      "wait_gate",
      "watch_peers",
      "check_desk",
      "hear_gossip",
      "stalk_social",
      "monitor_social",
      "check_parcel",
      "get_number",
      "stakeout",
    ];
    const charm = [
      "greet",
      "chat",
      "ease",
      "misdirection",
      "respond_her",
      "answer_guard",
      "fake_visit",
      "audit_class",
      "lobby_lurk",
      "apply_job",
      "pump_person",
      "bribe",
    ];
    if (brawn.includes(id)) return "str";
    if (charm.includes(id)) return "cha";
    if (intel.includes(id)) return "int";
    return "agi";
  }

  function attrOf(id) {
    return g.player[attrKeyOf(id)];
  }

  function categoryOf(id) {
    const fine = [
      "photo",
      "record",
      "pick",
      "ransack",
      "lockpick",
      "plant_bug",
      "cover_tracks",
    ];
    const conflict = ["strike", "pin", "drag"];
    // 社交类（主人定稿立户，±5 封顶）：口才词条全划入——此前掉默认 stealth 是未立户的遗留错位
    const social = [
      "greet",
      "chat",
      "ease",
      "misdirection",
      "respond_her",
      "answer_guard",
      "fake_visit",
      "audit_class",
      "lobby_lurk",
      "apply_job",
      "pump_person",
      "bribe",
    ];
    if (fine.includes(id)) return "fine";
    if (conflict.includes(id)) return "conflict";
    if (social.includes(id)) return "social";
    return "stealth";
  }

  return { targetEffectiveAcuity, gain, runCheck, categoryOf };
}

module.exports = { createCheckSystem };
