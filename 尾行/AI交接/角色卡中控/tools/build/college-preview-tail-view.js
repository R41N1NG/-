"use strict";
const { ALERT_TIERS } = require("../../src/ui/alert-view");
const names = { far: "远端", same: "同街", close: "身后", touch: "贴身" };
const periodNames = ["早间", "午间", "午后", "晚间", "子夜"];
function createTailView(document) {
  const $ = (id) => document.getElementById(id);
  const text = (id, value) => {
    $(id).textContent = value;
  };
  let previous = "world";
  function render(snap) {
    const t = snap.previewTailing,
      show = t.active || t.pendingOutcome;
    const view = t.active ? "tailing" : t.pendingOutcome ? "outcome" : "world";
    document.body.dataset.collegeView = view;
    $("collegeTailScreen").hidden = !show;
    if (!show) {
      previous = view;
      return;
    }
    const out = t.pendingOutcome ? t.outcome : null;
    $("collegeTailScreen").dataset.outcome = out?.kind || "";
    $("collegeTailControls").hidden = !t.active || t.recovery.pending;
    $("collegeRecoveryControls").hidden = !t.recovery.pending;
    $("collegeTailMetrics").hidden = !t.active;
    $("collegeTailRoute").hidden = !t.active;
    $("collegeTailOutcome").hidden = !out;
    text(
      "collegeTailPaid",
      `本次入场已用2点 · 当前剩余${snap.dayPlan.remaining}/4点`,
    );
    text(
      "collegeTailBadge",
      out
        ? out.kind === "lost" || out.kind === "escaped"
          ? "失去目视"
          : "本次跟随收获"
        : t.recovery.pending
          ? "暂失目视 · 还有一次追找机会"
          : "正式尾行 · 保持目视",
    );
    text(
      "collegeTailHeading",
      out
        ? out.title
        : t.recovery.pending
          ? "她的身影暂时离开了视线"
          : "跟住她的身影",
    );
    const seen = out?.lastSeen || snap.cityMap.target;
    const place = seen?.placeId
      ? snap.cityMap.nodes.find((n) => n.id === seen.placeId)?.name
      : null;
    if (out) {
      const descriptions = {
        lost: `${place ? `你最后一次看见她，是在「${place}」。` : "你没能继续跟住她。"}${out.recoveryAttempted ? "你又循着最后的方向追找了一段路，仍没能重新看见她。" : "之后已经找不到她的身影，"}接下来的去向尚不清楚。`,
        escaped: "她已经离开你的视线。你没能重新找到她，接下来的去向无法确认。",
        stopped: "你停下脚步，没有再跟下去。这一段确认到的信息会保留。",
        completed: `你跟到了「${place || "最后确认的地点"}」，这段行程已经结束。具体门牌和屋内情况仍须另行确认。`,
        ended: "这次跟随告一段落，已经确认到的信息会保留。",
      };
      text("collegeTailScene", descriptions[out.kind] || descriptions.ended);
      text("collegeOutcomeLastSeen", place || "尚无可确认的目击地点");
      text(
        "collegeOutcomeLastTime",
        seen
          ? `第${seen.date}天 · ${periodNames[seen.period]}`
          : "不显示她的未知去向",
      );
      text("collegeOutcomePi", `调查熟练度 +${out.pi}`);
      text(
        "collegeOutcomeClues",
        `首次线索 ${out.clueCount} 项 · 线索收益 +${out.clueGain} · 跟随保底 +${out.minimum}`,
      );
      text(
        "collegeOutcomeNext",
        `进度已保存，日程已进入${periodNames[out.period]}，行动点剩余${out.remaining}/4。回到日程后可以继续安排；本次离校机会已使用。`,
      );
    } else {
      text(
        "collegeTailScene",
        t.recovery.pending
          ? "你没能保持目视。先别急着认定已经跟丢，仍有一次沿最后目击方向追找的机会。"
          : t.recovery.lastResult === "found"
            ? "你从远端重新看见了她的身影，可以继续跟随。这次追找机会已经用过。"
            : snap.cityMap.target?.live
              ? `她仍在你的视线中。当前目视地点：${snap.cityMap.target.name}。留意距离和她的反应，再决定下一步。`
              : "暂未确认她的当前位置，请以本次行动结果和最后目击为准。",
      );
    }
    text(
      "collegeTailDist",
      t.recovery.pending ? "待确认" : names[snap.dist] || "待确认",
    );
    text("collegeTailHeart", String(snap.player.heart));
    text("collegeTailStamina", String(snap.player.stamina));
    text(
      "collegeTailAlert",
      ALERT_TIERS[snap.target.alertStage]?.name ||
        ALERT_TIERS[snap.target.alertStage]?.label ||
        "留意她的反应",
    );
    text(
      "collegeTailConfirmed",
      t.confirmed.map((n) => n.name).join(" → ") || "暂无新增路线",
    );
    text(
      "collegeTailNext",
      t.recovery.pending
        ? "最后目击后的去向：尚未确认"
        : `下一站：${t.next || "尚未确认"}`,
    );
    if (view !== previous)
      requestAnimationFrame(() => {
        $("collegeTailScreen").scrollIntoView({ block: "start" });
        $("collegeTailHeading").focus({ preventScroll: true });
      });
    previous = view;
  }
  function focusResult() {
    if (document.body.dataset.collegeView === "outcome") {
      $("collegeTailScreen").scrollIntoView({ block: "start" });
      $("collegeTailHeading").focus({ preventScroll: true });
    }
  }
  return { render, focusResult };
}
module.exports = { createTailView };
