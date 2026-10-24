"use strict";
const {
  requirementFailure,
} = require("../../contracts/action-requirements.js");
const R = require("../../config/rules.json");
const { observationItems } = require("../album.js");
const C = require("../checks.js");
const { unlockTargetAttribute } = require("../target-knowledge.js");
const { DIST_CN, DIST_KEY, DIST_RANK } = require("./constants.js");

function createActionSystem({
  g,
  L,
  lex,
  log,
  capturePhoto,
  investigation,
  currentPlaceKind,
  gain,
  runCheck,
  syncHeartTags,
}) {
  /* ---------- 相册：拍照产出一张「未拥有」的特写 ---------- */

  /** 从「未拥有 × 距离合法」里抽一张；抽不到返回 null。 */

  /* ---------- 单动作结算 ---------- */
  function settleAction(tag, seq) {
    const entry = lex.byId.get(tag.id);
    if (!entry) return null;
    const out = {
      type: "action",
      id: tag.id,
      name: tag.name,
      label: tag.label || tag.name,
    };

    if (entry.dailyOnly) {
      out.rejected = true;
      out.reason = "请通过日程行动区安排这项活动";
      return out;
    }

    // 模式门槛：词条声明的 modes 不含当前模式 → 拒绝
    if (
      !(entry.modes || []).includes(g.mode) &&
      !(entry.modes || []).includes("any")
    ) {
      out.rejected = true;
      out.reason = `动作 [${tag.name}] 需要模式：${(entry.modes || []).join("/")}`;
      return out;
    }

    /* 条件门槛（2026-10-19 主人定：非近身不下手、没工具不开锁、不在门前不撬门）。
       放在动作相最前面，UI 藏没藏都不影响——打字申报同样过不去。 */
    const failure = requirementFailure(entry.requires, {
      placeKind: currentPlaceKind(),
      dist: g.dist,
      inventory: g.player.inventory || [],
    });
    if (failure) {
      out.rejected = true;
      out.reason = `动作 [${tag.name}] ${failure.reason}${failure.code === "items" ? "：" + entry.requires.items.map((id) => R.items[id]?.name || id).join(" / ") : ""}`;
      return out;
    }

    /* 动作自身的语义边界（与 UI 灰条同一套口径，打字申报也过不去）： */
    // 偷袭比强攻更苛刻：身后 3-5 米只够强攻，偷袭必须贴身
    if (
      tag.id === "strike" &&
      (tag.args?.style || "ambush") === "ambush" &&
      g.dist !== "touch"
    ) {
      out.rejected = true;
      out.reason = `动作 [${tag.name}·偷袭] 需要贴身（当前 ${DIST_CN[g.dist] || g.dist}）`;
      return out;
    }
    // 缓息的下限就是 20：已经不高了就别白占一个动作位
    if (tag.id === "breath" && L.get("heart") <= 20) {
      out.rejected = true;
      out.reason = `动作 [${tag.name}] 心跳已在低位（${L.get("heart")} ≤ 20），缓息无效`;
      return out;
    }

    if (!entry.check) {
      // 无骰动作：只做资源与账目（缓息/拉远类）
      out.noRoll = true;
      if (tag.id === "breath") {
        const gainAmt = C.breathGain(g.player.nrv);
        const r = L.commit(
          { heart: -Math.min(gainAmt, L.get("heart") - 20) },
          { reason: "breath" },
        );
        out.ledger = r;
        out.text = `缓息：心跳 -${Math.max(0, -r.applied.heart)}`;
      } else if (tag.id === "withdraw") {
        g.dist = "far";
        out.text = "距离拉开至目视远端";
      } else if (tag.id === "approach") {
        // 贴近只能靠近：已贴身或目标距离不比现在更近，直接拒绝（防止「贴近」把人往外推）
        const RANK = DIST_RANK;
        const want = DIST_KEY[tag.args?.dist] || "close";
        if (RANK[g.dist] >= RANK.touch || RANK[want] <= RANK[g.dist]) {
          out.rejected = true;
          out.reason =
            RANK[g.dist] >= RANK.touch
              ? "动作 [贴近] 已贴身，无法再靠近"
              : `动作 [贴近] 目标距离（${DIST_CN[want] || want}）不比当前（${DIST_CN[g.dist] || g.dist}）更近`;
          return out;
        }
        g.dist = want;
        out.text = `距离调整至 ${g.dist}`;
      } else {
        out.text = `${tag.name}：完成（无检定）`;
      }
      return out;
    }

    if (tag.id === "scan" && g.spatial?.tracking === "lost") {
      out.rejected = true;
      out.reason = "已经失去目标目视，先恢复目视再打量";
      return out;
    }

    // 心跳阈值标签在检定前同步：过线瞬间生效，当次动作就吃罚（无白嫖窗口）
    syncHeartTags();
    const {
      roll,
      res,
      mods,
      dc,
      attr,
      targetMod,
      darkReveal,
      distanceDC,
      heartState,
    } = runCheck(entry, tag.args, seq);
    out.d20 = roll.d20;
    out.raw = roll.raw;
    out.mods = mods;
    out.dc = dc;
    out.total = res.total;
    out.band = res.band;
    out.attr = attr;
    out.targetMod = targetMod;
    out.darkReveal = darkReveal;
    out.distanceDC = distanceDC;
    out.heartState = heartState;

    // 双账结算
    let alertD = 0,
      heartD = 0,
      piD = 0,
      faceMemD = 0,
      staminaD = -(entry.cost?.stamina || 0);
    const dist = DIST_KEY[tag.args?.dist] || g.dist;

    if (res.band === "success") {
      if (tag.id === "follow") g.dist = dist; // 跟缀成功推进距离档
      if (tag.id === "withdraw") g.dist = "far"; // 后撤成功拉开（此前漏接，骰了却不动距离）
    } else if (res.band === "grace") {
      const gg = gain({ threat: "minor", dist });
      alertD = gg.alertD;
      heartD = gg.heartD + 5;
      faceMemD = C.faceMemGain({ band: "grace" }); // 勉强瞥见：记忆+1，不掷认脸
    } else if (res.band === "fail") {
      const gg = gain({ threat: "minor", dist });
      alertD = gg.alertD;
      heartD = gg.heartD; // 跟丢未照面：记忆不涨
    } else if (res.band === "nat1") {
      const gg = gain({ threat: "medium", dist });
      alertD = gg.alertD;
      heartD = gg.heartD;
      faceMemD = C.faceMemGain({ band: "nat1" }); // 爆露照面：记忆+2
    } else if (res.band === "nat20") {
      if (tag.id === "follow") g.dist = dist;
    }

    // 拍照：只出「还没拥有」的那一张；抽不到＝这条街上能拍的都拍过了
    if (
      tag.id === "photo" &&
      (res.band === "success" || res.band === "nat20")
    ) {
      const cap = capturePhoto(dist);
      if (cap) {
        out.capture = cap;
      } else {
        piD = 0;
        out.captureEmpty = true;
      }
    }

    // 打量成功收录当前可辨认服装的一张未拥有侧视图，不另造一份相册。
    if (tag.id === "scan" && ["success", "nat20"].includes(res.band)) {
      const outfit = g.targetState?.outfit || {};
      const items = observationItems(outfit);
      // 未有对应素材的部位不以其他款式冒充；仅在目视和合法距离成立时收录。
      const here = g.route?.here;
      const visible =
        g.spatial?.tracking === "visual" &&
        g.spatial.lastSeen?.date === L.get("date") &&
        g.route?.known?.[here] === 1;
      if (
        visible &&
        ["same", "close", "touch"].includes(g.dist) &&
        res.band === "nat20"
      ) {
        out.attributeUnlock = unlockTargetAttribute(g);
        if (!out.attributeUnlock) out.attributeUnlockEmpty = true;
      }
      const cap = visible
        ? capturePhoto(g.dist, {
            angle: "side",
            items,
            source: "scan",
          })
        : null;
      if (cap) {
        out.capture = cap;
      } else out.captureEmpty = true;
    }

    out.exposure = investigation.exposure(tag.id, dist);
    alertD += out.exposure?.applied || 0;
    out.discoveries = investigation.record(out);

    // 结算后再同步一次（本动作的心跳变化影响下一动作）
    syncHeartTags();

    const r = L.settleAction(
      { alertD, heartD, piD, staminaD, faceMemD },
      { reason: tag.id },
    );
    out.ledger = { seq: r.seq, applied: r.applied };

    // v0.8 身份制：当晚 PI 毛入账累计（侦探 ×1.2 过夜补差）；侦探职业病跟缀状态（跟丢解锁）
    if (piD > 0) g.nightPiGross = (g.nightPiGross || 0) + piD;
    if (g.identity === "detective" && tag.id === "follow") {
      if (res.band === "fail" || res.band === "nat1") g.tailing = false;
      else g.tailing = true;
    }

    if (tag.id === "timing") {
      if (res.band === "nat20" || res.band === "success") {
        g.lastAssess =
          "读时机评估：目标分心防备松懈，侧向死角暴露，良机（+2 战力）";
      } else if (res.band === "grace") {
        g.lastAssess = "读时机评估：目标偶有停顿，但余光仍有顾及，时机平平";
      } else {
        g.lastAssess = "读时机评估：未能捕捉到有效破绽，轻举妄动易打草惊蛇";
      }
    }

    g.consecFails =
      res.band === "fail" || res.band === "nat1" ? g.consecFails + 1 : 0;
    log(
      `[${tag.name}] 1d20(${roll.d20}) ${mods.map((m) => `${m.v >= 0 ? "+" : ""}${m.v} ${m.src}`).join(" ")} = ${res.total} vs DC ${dc} → ${res.band}`,
    );
    return out;
  }

  return { settleAction };
}

module.exports = { createActionSystem };
