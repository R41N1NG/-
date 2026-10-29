"use strict";
const { createTailView } = require("./college-tail-view");
function createCollegeSessionUI({
  document,
  window,
  lifecycle,
  root,
  getGlue,
  getActions,
}) {
  if (!root.querySelector("#wxCollegeGuide")) return { render() {} };
  const $ = (id) => document.getElementById(id),
    tail = createTailView(document, root);
  let snap = null,
    busy = false;
  function request() {
    return {
      operationId:
        window.crypto?.randomUUID?.() ||
        `session-${Date.now()}-${Math.random()}`,
      expected: { ...snap.dayPlan.token, turn: snap.tailingSession.turn },
      activityId: snap.dayPlan.activity?.id,
      sync: { ...snap.dayPlan.sync },
    };
  }
  async function command(method, arg) {
    if (busy || !snap?.dayPlan.sync) return;
    busy = true;
    try {
      const r = await getGlue().command(method, arg);
      if (
        lifecycle.disposed ||
        snap?.dayPlan.sync?.scope !== arg.sync.scope ||
        snap?.dayPlan.sync?.epoch !== arg.sync.epoch
      )
        return;
      if (r.actions && !r.reused)
        window.WxStatusbar.settle({
          ...r.package,
          ...r,
          floor: -30000 - (r.floor || 0),
        });
      $("collegeTailNotice").textContent = "操作已保存。";
    } catch (e) {
      if (
        !lifecycle.disposed &&
        snap?.dayPlan.sync?.scope === arg.sync.scope &&
        snap?.dayPlan.sync?.epoch === arg.sync.epoch
      )
        $("collegeTailNotice").textContent = e.message;
    } finally {
      busy = false;
    }
  }
  lifecycle.on($("collegeRecover"), "click", () =>
    command("recoverTailing", request()),
  );
  lifecycle.on($("collegeStop"), "click", () =>
    command("executeDailyCommand", { ...request(), command: "cancel" }),
  );
  lifecycle.on($("collegeAbandonRecovery"), "click", () =>
    command("executeDailyCommand", { ...request(), command: "cancel" }),
  );
  lifecycle.on($("collegeReturn"), "click", () =>
    command("acknowledgeTailingOutcome", request()),
  );
  lifecycle.on($("collegeDistance"), "change", () => {
    const action = {
      id: "follow",
      name: "跟缀",
      args: { dist: $("collegeDistance").value },
    };
    window.WxStatusbar.setCapsuleAction?.(action);
  });
  return {
    render(value) {
      snap = value;
      const session = snap.tailingSession,
        guide = $("wxCollegeGuide");
      if (!guide) return;
      guide.hidden = !session;
      if (!session) {
        root.querySelector("#collegeTailScreen").hidden = true;
        delete root.dataset.collegeView;
        return;
      }
      tail.render(snap);
      $("wxCollegeTime").textContent =
        `${snap.dayPlan.periodName} · 剩余${snap.dailyTime.remaining}/3格时间 · 行动点${snap.dayPlan.remaining}/4`;
      $("wxCollegeSceneTitle").textContent = snap.dailyScene.title;
      $("wxCollegeSceneText").textContent = snap.dailyScene.text;
      if (document.activeElement !== $("collegeDistance"))
        $("collegeDistance").value = snap.dist;
      if (session.recovery.pending) $("wxCapsuleBar").hidden = true;
    },
  };
}
module.exports = { createCollegeSessionUI };
