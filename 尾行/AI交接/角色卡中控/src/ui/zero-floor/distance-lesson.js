"use strict";
const { createScreenshotPictures } = require("./screenshot-pictures"),
  { createTutorialPolicy } = require("./tutorial-policy");
const DISTANCES = [
  {
    id: "far",
    name: "远端",
    copy: "保持更远距离，跟随DC＋2。本组骰点足以成功，但远端并不是免检或永不跟丢。",
  },
  {
    id: "same",
    name: "同街",
    copy: "本例没有远端加难，也没有身后／贴身的额外近距暴露；仍要照常进行跟随判定。",
  },
  {
    id: "close",
    name: "身后",
    copy: "可以更近地观察，但会结算额外近距暴露，心跳压力也更高。敏捷能减免一部分，不能把这部分成本全部消掉。",
  },
  {
    id: "touch",
    name: "贴身",
    copy: "贴身的额外近距暴露更大。即使这次判定成功，也不意味着继续贴身不会让她留意你。",
  },
];
const SIGNALS = [
  {
    id: "pace",
    name: "提速",
    title: "她的步频变了",
    copy: "提速可能改变跟随距离。先看行动后的实际距离，不要以为原来的身后位置会一直保留。",
  },
  {
    id: "turn",
    name: "回头",
    title: "她停步，回头看身后",
    copy: "回头会按距离与条件处理，可能看清，也可能没有看清。本例反应后当前仍显示“不安”；不能把一次回头等同为必败或重开。",
  },
  {
    id: "run",
    name: "开跑",
    title: "她的脚步明显加快",
    copy: "本例实际触发开跑。后续她会更快前进，保持目视的压力增加；是否还能继续，以实际距离、目视与判定反馈为准。",
  },
];
function mountDistanceLesson({ document, window, lifecycle, shots, facts }) {
  const $ = (id) => document.getElementById(id),
    root = $("distanceLesson"),
    policy = createTutorialPolicy(window),
    pictures = createScreenshotPictures({ document, lifecycle, shots });
  let current = "same",
    signal = "pace",
    finished = false;
  function finish(skip = false, persisted = true) {
    finished = true;
    root.hidden = true;
    pictures.close();
    $("distanceLessonDone").hidden = false;
    $("distanceLessonDoneText").textContent = skip
      ? "已跳过所有教程，后续章节也会关闭。"
      : "本页已读完。第三组现有心跳、体力、警觉与距离三页说明；可回看前两页，或进入独立玩法预览练习。";
    if (!persisted)
      $("distanceLessonDoneText").textContent +=
        " 本页内已生效，浏览器未能保存偏好。";
  }
  function picture(id) {
    const n = pictures.picture(id);
    for (const f of n.querySelectorAll(".training-shot-frame")) {
      f.style.maxWidth = f.querySelector("img").width + "px";
      f.style.marginInline = "auto";
    }
    return n;
  }
  function show(id) {
    if (finished) return;
    const d = DISTANCES.find((d) => d.id === id);
    if (!d) return;
    current = id;
    pictures.close();
    const f = facts.distances[id];
    $("distanceStateTitle").textContent = d.name + " · 一次真实跟随";
    $("distanceStateCopy").textContent = d.copy;
    $("distanceReadings").textContent =
      `同骰 ${f.d20} · 总DC ${f.dc} · 本例成功`;
    $("distanceCost").textContent =
      `心跳 ${f.beforeHeart} → ${f.heart} · 本回合体力−${f.staminaCost}` +
      (f.exposure ? " · 额外近距暴露仍有剩余" : "");
    $("distanceCheckPicture").replaceChildren(picture(id));
    for (const b of $("distanceTabs").children)
      b.setAttribute("aria-pressed", String(b.dataset.distance === id));
  }
  function showSignal(id) {
    if (finished) return;
    const s = SIGNALS.find((s) => s.id === id);
    if (!s) return;
    signal = id;
    pictures.close();
    $("distanceSignalTitle").textContent = s.title;
    $("distanceSignalCopy").textContent = s.copy;
    $("distanceSignalReading").textContent = facts.signals[id].signal;
    $("distanceSignalPicture").replaceChildren(picture(id + "-signal"));
    $("distancePanelPicture").replaceChildren(picture(id + "-panel"));
    for (const b of $("distanceSignalTabs").children)
      b.setAttribute("aria-pressed", String(b.dataset.signal === id));
  }
  if (!policy.shouldShow("pressure-distance")) {
    finish(true);
    return { show, showSignal, isSkipped: policy.isSkipped };
  }
  root.hidden = false;
  for (const [rows, id, key] of [
    [DISTANCES, "distanceTabs", "distance"],
    [SIGNALS, "distanceSignalTabs", "signal"],
  ])
    for (const row of rows) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = row.name;
      b.dataset[key] = row.id;
      $(id).append(b);
    }
  lifecycle.on($("distanceTabs"), "click", (e) => {
    const b = e.target.closest("[data-distance]");
    if (b) show(b.dataset.distance);
  });
  lifecycle.on($("distanceSignalTabs"), "click", (e) => {
    const b = e.target.closest("[data-signal]");
    if (b) showSignal(b.dataset.signal);
  });
  lifecycle.on(root, "keydown", (e) => {
    if (
      e.altKey ||
      e.ctrlKey ||
      e.metaKey ||
      e.target.closest("input,textarea,select")
    )
      return;
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    const signals = e.target.closest("#distanceSignalTabs"),
      rows = signals ? SIGNALS : DISTANCES,
      i = rows.findIndex((r) => r.id === (signals ? signal : current));
    if (rows[i + step]) {
      e.preventDefault();
      (signals ? showSignal : show)(rows[i + step].id);
    }
  });
  $("distanceEntryPicture").append(picture("entry"));
  $("distanceActionsPicture").append(picture("actions"));
  const a = facts.agility;
  $("distanceAgilityCopy").textContent =
    `同一身后距离的真实对照：敏捷${a.normal}减免${a.normalReduction}点额外暴露，敏捷${a.agile}减免${a.agileExposure.reduction}点；更高敏捷能减轻压力，但仍有剩余。这不是直接降低跟随DC，也不代表其它检定或属性加成都相同。`;
  const stop = facts.stop;
  $("distanceStopCopy").textContent =
    `本例结束提示：“${stop.title}”；结束前已确认${stop.confirmedBefore}段连接，结束后仍保留${stop.confirmedAfter}段，行动点剩${stop.remaining}/4。`;
  lifecycle.on($("distanceStopDetail"), "toggle", () => {
    if (
      !finished &&
      $("distanceStopDetail").open &&
      !$("distanceStopPicture").childElementCount
    )
      $("distanceStopPicture").append(picture("stop"));
  });
  lifecycle.on($("distanceLessonSkipAll"), "click", () =>
    finish(true, policy.skipAll()),
  );
  lifecycle.on($("distanceLessonComplete"), "click", () => {
    policy.complete("pressure-distance");
    finish();
  });
  show("same");
  showSignal("pace");
  return { show, showSignal, isSkipped: policy.isSkipped };
}
module.exports = { mountDistanceLesson, DISTANCES, SIGNALS };
