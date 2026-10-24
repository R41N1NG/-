"use strict";
const { createPreview } = require("./college-preview-model");
const { createTailView } = require("./college-preview-tail-view");
function boot() {
  const key = "wx_college_schedule_preview_v1";
  let model,
    epoch = 0,
    settleSeq = 0,
    busy = false,
    tailView;
  const $ = (id) => document.getElementById(id);
  const message = (text) => {
    $("collegeNotice").textContent = text;
    $("collegeTailNotice").textContent = text;
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
    document.querySelectorAll("#wxCityMap [data-place-id]").forEach((node) => {
      const q = model.quote(node.dataset.placeId);
      const label = q.reason || q.label.replace("前往", "点击前往");
      const title = node.querySelector("title");
      if (title && title.textContent !== label) title.textContent = label;
      if (node.getAttribute("aria-label") !== label)
        node.setAttribute("aria-label", label);
      node.setAttribute("aria-disabled", String(!!q.reason));
      node.classList.toggle("college-map-blocked", !!q.reason);
    });
  }
  function render() {
    const snap = model.snapshot();
    snap.dayPlan.sync = { scope: "college-preview", epoch };
    window.WxStatusbar.render(snap);
    tailView?.render(snap);
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
    $("collegePass").disabled =
      model.active() ||
      snap.previewTailing.pendingOutcome ||
      snap.dayPlan.ended;
    decorateMoves();
    const mapStatus = $("collegeMapStatus");
    if (mapStatus)
      mapStatus.textContent = t.active
        ? "尾行中：地图可浏览，位置随跟随动作结算。"
        : `${snap.dayPlan.periodName} · 剩余${t.remaining}/3格。点击地图地点直接移动；同区1格、跨区2格，均不扣行动点。`;
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
  tailView = createTailView(document);
  $("wx-settle-dialog").addEventListener("close", () => tailView.focusResult());
  document.querySelector("#wxCityMap .wx-city-note").textContent =
    "点击地区、缩放或拖动只浏览；点击地点直接移动，同区1格、跨区2格，不扣行动点。私人区域与交通条件仍须满足；尾行中位置由跟随动作结算。";
  const mapStatus = document.createElement("p");
  mapStatus.id = "collegeMapStatus";
  mapStatus.setAttribute("role", "status");
  $("wxCityCanvas").before(mapStatus);
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
          message(
            `${model.snapshot().previewTailing.outcome?.title || "这次跟随告一段落"}。确认收获后，可以回到日程继续安排。`,
          );
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
  $("collegeReturn").onclick = () => {
    if ($("wx-settle-dialog").open)
      return message("先看完这次行动的判定结果。");
    model.acknowledgeOutcome();
    persist();
    render();
    message("已回到日程，之前确认的信息会保留。");
    $("collegePhase").scrollIntoView({ block: "start" });
  };
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
  // 地图直接移动，仅拦截移动意图；缩放、分区与拖动仍由正式地图处理。
  let pointer = null;
  const mapTarget = (event) =>
    event.target.closest?.("#wxCityMap [data-place-id]");
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (e.target.closest?.("#wxCityMap"))
        pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, drag: false };
    },
    true,
  );
  document.addEventListener(
    "pointermove",
    (e) => {
      if (
        pointer &&
        e.pointerId === pointer.id &&
        Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y) > 8
      )
        pointer.drag = true;
    },
    true,
  );
  document.addEventListener(
    "pointercancel",
    () => {
      if (pointer) pointer.drag = true;
    },
    true,
  );
  document.addEventListener(
    "click",
    (e) => {
      const node = mapTarget(e);
      if (pointer?.drag) {
        pointer = null;
        if (node) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
        return;
      }
      pointer = null;
      if (node) {
        const id = node.dataset.placeId;
        queueMicrotask(() => act(() => model.move(id)));
        return;
      }
      const region = e.target.closest?.("#wxCityMap [data-region]");
      if (region)
        document
          .querySelector(`[data-map-district="${region.dataset.region}"]`)
          ?.click();
    },
    true,
  );
  document.addEventListener(
    "keydown",
    (e) => {
      const node = mapTarget(e);
      if (node && ["Enter", " "].includes(e.key)) {
        e.preventDefault();
        if (!e.repeat) {
          const id = node.dataset.placeId;
          queueMicrotask(() => act(() => model.move(id)));
        }
      }
    },
    true,
  );
  document.addEventListener(
    "pointerover",
    (e) => {
      const node = mapTarget(e);
      if (!node) return;
      const q = model.quote(node.dataset.placeId),
        t = model.snapshot().previewTime;
      const text = model.active()
        ? "尾行中：地图可浏览，位置随跟随动作结算。"
        : `点击地点直接移动 · ${q.label}；剩余${t.remaining}/3格时间。`;
      const status = $("collegeMapStatus");
      if (status.textContent !== text) status.textContent = text;
    },
    true,
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
