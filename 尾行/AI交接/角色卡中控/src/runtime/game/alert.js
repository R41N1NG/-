"use strict";
// alert：依赖由 game.js 装配，每个游戏实例独立持有状态。
const R = require("../../config/rules.json");
const C = require("../checks.js");
const D = require("../dice.js");
const { DIST_DOWN, DIST_CN } = require("./constants.js");

function createAlertSystem({
  g,
  L,
  seedAt,
  log,
  targetEffectiveAcuity,
  herAdvance,
}) {
  function alertBranch() {
    const nrv = g.target.nrv || 4,
      per = g.target.per || 4;
    if (nrv > per) return "turn";
    if (per > nrv) return "detour";
    const roll = D.rollD20(seedAt(g.floor || 1, "alert_branch")).d20;
    return roll <= 7 ? "turn" : roll <= 14 ? "detour" : "shop";
  }

  function applyAlertBehavior(stage) {
    const floor = g.floor || 1;
    const ev = { stage, floor, kind: "", detail: "" };
    if (stage === 1) {
      // 不安：提速（跟速检定，败＝距离退一档）
      const roll = D.rollD20(seedAt(floor, "alert_pace")).d20;
      const total = roll + (g.player.agi || 0);
      const dc = (R.checks && R.checks.follow) || 13;
      ev.kind = "提速";
      if (total <= dc) {
        const before = g.dist;
        g.dist = DIST_DOWN[g.dist] || "far";
        ev.detail = `跟速失败（1d20=${roll}+敏捷${g.player.agi} ≤ DC${dc}）：距离由${DIST_CN[before]}退到${DIST_CN[g.dist]}`;
      } else {
        ev.detail = `跟速成功（1d20=${roll}+敏捷${g.player.agi} > DC${dc}）：维持${DIST_CN[g.dist]}`;
      }
      g.lastHerAlert = "⚠️ 她的步频变了——突然加快，手伸进包里摸手机。";
    } else if (stage === 2) {
      const branch = alertBranch();
      if (branch === "turn") {
        ev.kind = "骤停回头";
        if (g.dist === "close" || g.dist === "touch") {
          const her =
            D.rollD20(seedAt(floor, "alert_turn_her")).d20 +
            targetEffectiveAcuity();
          const me =
            D.rollD20(seedAt(floor, "alert_turn_me")).d20 + (g.player.agi || 0);
          if (me >= her) {
            L.commit({ alert: -5 }, { reason: "alert_turn" });
            ev.detail = `她回头扫街，你贴进阴影（${me} ≥ ${her}）：她没看清，警觉 -5`;
          } else {
            L.commit({ alert: 8, faceMem: 2 }, { reason: "alert_seen" });
            ev.detail = `她回头正好撞上你的视线（${me} < ${her}）：面容记忆 +2、警觉 +8`;
          }
        } else {
          L.commit({ alert: -3 }, { reason: "alert_turn" });
          ev.detail = "她停下回头扫了一眼街面，什么也没看到（警觉 -3）";
        }
        g.lastHerAlert = "⚠️ 她突然停步，回头扫了一眼身后。";
      } else if (branch === "detour") {
        ev.kind = "绕死路";
        const before = g.dist;
        herAdvance(true);
        g.dist = DIST_DOWN[g.dist] || "far";
        ev.detail = `她拐进一条岔路，距离由${DIST_CN[before]}退到${DIST_CN[g.dist]}——跟不跟，你自己决定`;
        g.lastHerAlert = "⚠️ 她没有直走，拐进了一条更暗的岔路。";
      } else {
        ev.kind = "进店";
        g.alertHold = Math.max(g.alertHold || 0, 1);
        ev.detail = "她拐进路边便利店，玻璃门在身后合上（她会在里面停一楼）";
        g.lastHerAlert = "⚠️ 她推门进了便利店，隔着玻璃门还在看街上。";
      }
    } else if (stage === 3) {
      ev.kind = "开跑";
      g.fleeing = true;
      ev.detail = "她确信被跟了，开始小跑（此后每楼她都会往前走一站）";
      g.lastHerAlert = "‼️ 她回头看了你一眼，然后拔腿就跑。";
    } else {
      ev.kind = "摊牌";
      g.tailing = false;
      ev.detail = "她尖叫着冲向路人——今晚到此为止，你只能撤";
      g.lastHerAlert = "‼️ 她尖叫出声，冲向了有人的地方。";
    }
    g.alertEvent = ev;
    log(`[过档] ${ev.kind}：${ev.detail}`);
    g.signals = g.signals || [];
    g.signals.push(["突发", `她${ev.kind}：${ev.detail}`]);
    if (g.signals.length > 20) g.signals.shift();
  }

  function resolveAlertCross() {
    g.alertLatch = g.alertLatch || [];
    for (let guard = 0; guard < 4; guard++) {
      const stage = C.alertStage(L.get("alert"));
      const max = g.alertLatch.length ? Math.max(...g.alertLatch) : 0;
      if (stage <= max) return;
      for (let s = max + 1; s < stage; s++) g.alertLatch.push(s);
      g.alertLatch.push(stage);
      applyAlertBehavior(stage);
    }
  }

  return { resolveAlertCross };
}

module.exports = { createAlertSystem };
