"use strict";
const { createPreview } = require("./college-preview-model");
function boot() {
  const key = "wx_college_schedule_preview_v1";
  let model,
    epoch = 0,
    settleSeq = 0,
    busy = false;
  const $ = (id) => document.getElementById(id);
  const message = (text) => {
    $("collegeNotice").textContent = text;
  };
  function persist() {
    try {
      localStorage.setItem(key, JSON.stringify(model.save()));
    } catch {
      message("本次试玩保留在页面内存；浏览器未能保存，刷新后可能丢失。");
    }
  }
  function decorateMoves() {
    if (!model) return;
    document.querySelectorAll("[data-map-move]").forEach((b) => {
      const q = model.quote(b.dataset.mapMove);
      if (!q.reason && b.textContent !== q.label) b.textContent = q.label;
      b.title = q.label;
    });
  }
  function render() {
    const snap = model.snapshot();
    snap.dayPlan.sync = { scope: "college-preview", epoch };
    window.WxStatusbar.render(snap);
    $("collegeSceneTitle").textContent = snap.previewScene.title;
    $("collegeSceneText").textContent = snap.previewScene.text;
    $("collegeTailControls").hidden = !model.active();
    const tail = snap.dayActions.find((a) => a.id === "daily.tailing");
    $("collegeStart").hidden = model.active();
    $("collegeStart").disabled = !tail?.enabled;
    $("collegeStart").textContent = tail?.enabled
      ? "跟随离开 · 2行动点"
      : tail?.reason || "当前不能进入尾行";
    const t = snap.previewTime;
    $("collegeTime").textContent = t.active
      ? "尾行中：时间由内部回合推进"
      : snap.dayPlan.ended
        ? "本日已结束"
        : `本时段剩余 ${t.remaining} / ${t.perPeriod} 格时间`;
    $("collegeTimeCells").hidden = t.active;
    $("collegeTimeCells").replaceChildren(
      ...Array.from({ length: t.perPeriod }, (_, i) => {
        const n = document.createElement("i");
        n.className = i < t.used || snap.dayPlan.ended ? "used" : "";
        return n;
      }),
    );
    document.querySelectorAll("[data-college-place]").forEach((b) => {
      const q = snap.previewMoves[b.dataset.collegePlace];
      b.disabled = !!q.reason;
      b.textContent = q.label;
      b.title =
        q.reason ||
        `到达后：${q.arrival.ended ? "本日结束" : ["早间", "午间", "午后", "晚间", "子夜"][q.arrival.period]}，按到达时的日程判断目视`;
    });
    $("collegePass").disabled = model.active() || snap.dayPlan.ended;
    decorateMoves();
    $("collegePhase").textContent =
      `第${snap.player.date}天 · ${snap.dayPlan.periodName} · 行动点 ${snap.dayPlan.remaining}/4`;
  }
  window.getVariables = async () => {
    if (!model) return {};
    const snap = model.snapshot();
    snap.dayPlan.sync = { scope: "college-preview", epoch };
    return { wx_save: model.save(), wx_snap: snap };
  };
  window.WxGlue = {
    command: async (name, arg) => {
      if (name !== "executeDailyCommand")
        throw Error("此预览只接日程和移动操作");
      if (arg.sync && arg.sync.epoch !== epoch)
        throw Error("试玩已重置，请重新选择");
      const before = model.save();
      try {
        const r = model.execute(arg);
        persist();
        render();
        return r;
      } catch (e) {
        model = createPreview(before);
        render();
        throw e;
      }
    },
    getSyncDiagnostics: () => ({}),
  };
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    model = createPreview(saved);
    if (saved) message("已恢复本浏览器的独立试玩进度。");
  } catch {
    model = createPreview();
    message("试玩进度未能恢复，已载入独立演示起点；酒馆存档未受影响。");
  }
  window.WxStatusbarUI.mountStatusbar(document, window);
  const mapObserver = new MutationObserver(decorateMoves);
  mapObserver.observe(document.querySelector(".trpg"), {
    childList: true,
    subtree: true,
  });
  async function act(fn) {
    if (busy) return;
    busy = true;
    try {
      const result = fn();
      persist();
      render();
      if (result?.package) {
        window.WxStatusbar.settle({
          ...result.package,
          floor: -10000 - ++settleSeq,
        });
        if (!model.active())
          message("本次尾行已结束，时段已推进；已获得的线索保留。");
      } else if (result?.summary)
        message(
          result.command === "start" && result.actionId === "daily.pass"
            ? `已进入${model.snapshot().dayPlan.periodName}；当前时段尚未行动。`
            : result.summary,
        );
    } catch (e) {
      message(e.message);
    } finally {
      busy = false;
    }
  }
  $("collegeStart").onclick = () =>
    act(() => model.execute(model.request("start", "daily.tailing")));
  $("collegePass").onclick = () =>
    act(() => model.execute(model.request("start", "daily.pass")));
  $("collegeStop").onclick = () =>
    act(() => model.execute(model.request("cancel")));
  $("collegeFollow").onclick = () => {
    if ($("wx-settle-dialog")?.open)
      return message("先确认本次判定结果，再继续行动。");
    act(() =>
      model.follow([
        { id: "follow", args: { dist: $("collegeDistance").value } },
      ]),
    );
  };
  $("collegeSend").onclick = () => {
    if ($("wx-settle-dialog")?.open)
      return message("先确认本次判定结果，再继续行动。");
    act(() => model.follow(window.WxStatusbar.consumeActiveActions()));
  };
  document
    .querySelectorAll("[data-college-place]")
    .forEach(
      (b) => (b.onclick = () => act(() => model.move(b.dataset.collegePlace))),
    );
  $("collegeReset").onclick = () => {
    if ($("wx-settle-dialog")?.open) $("wx-settle-dialog").close();
    model = createPreview();
    epoch++;
    persist();
    render();
    message("已重置独立试玩，从午间、4点行动开始。");
  };
  render();
  window.__collegePreview = {
    snapshot: () => model.snapshot(),
    save: () => model.save(),
    move: (id) => act(() => model.move(id)),
    reset: () => $("collegeReset").click(),
    ready: true,
  };
}
module.exports = { boot };
