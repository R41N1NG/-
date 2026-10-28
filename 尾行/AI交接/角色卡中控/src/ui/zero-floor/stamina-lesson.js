"use strict";
const { createScreenshotPictures } = require("./screenshot-pictures");
const { createTutorialPolicy } = require("./tutorial-policy");
const STEPS = [
  {
    id: "start",
    name: "疲劳出发",
    title: "先读体力，再决定怎样行动",
    text: "本例28/115，显示24%，处于疲惫档。体力还有剩余，但跟随已经受到难度惩罚。",
    pictures: [
      ["entry", "先找到状态栏的体力与终端入口"],
      ["start", "展开后的真实生理面板"],
    ],
  },
  {
    id: "first",
    name: "跟随判定",
    title: "同一次跟随，疲劳会抬高难度",
    text: "右侧账目明确列出“疲劳跟随难度”。它增加的是跟随DC，不是扣掉敏捷，也不等于必定失败。动作费用与心跳回合消耗分开列账。",
    pictures: [["first", "本次真实跟随判定"]],
  },
  {
    id: "supply",
    name: "使用补给",
    title: "打开终端，在行囊里使用食品",
    text: "先点状态栏的“战术终端”，找到“战术行囊持有物”，再点便当右侧“使用”。本例恢复了体力，物品也真实减少一份；不是免费补满。",
    pictures: [
      ["bag", "终端内的行囊与使用入口"],
      ["supplied", "使用便当后的真实生理面板"],
    ],
  },
  {
    id: "second",
    name: "恢复行动",
    title: "疲劳减轻了，再决定要不要继续",
    text: "本例补给后仍在气喘档，跟随疲劳DC由＋3降为＋1。总DC还受现场条件影响，不能把两次总DC之差全归因于补给；补给也不保证下次判定成功。",
    pictures: [["second", "补给后的下一次真实跟随判定"]],
  },
];
function mountStaminaLesson({ document, window, lifecycle, shots, facts }) {
  const $ = (id) => document.getElementById(id),
    root = $("staminaLesson"),
    policy = createTutorialPolicy(window),
    COURSE = "pressure-stamina";
  const pictures = createScreenshotPictures({ document, lifecycle, shots });
  let current = 0,
    finished = false;
  function finish(skip = false, persisted = true) {
    finished = true;
    root.hidden = true;
    pictures.close();
    $("staminaLessonDone").hidden = false;
    $("staminaLessonDoneText").textContent = skip
      ? "已跳过所有教程，后续章节也会关闭。"
      : "本页已读完。下一页将讲她的警觉与距离，目前尚未制作。";
    if (!persisted)
      $("staminaLessonDoneText").textContent +=
        " 本页内已生效，浏览器未能保存偏好。";
  }
  function originalPicture(id) {
    const node = pictures.picture(id);
    for (const frame of node.querySelectorAll(".training-shot-frame")) {
      frame.style.maxWidth = frame.querySelector("img").width + "px";
      frame.style.marginInline = "auto";
    }
    return node;
  }
  function figure(id, caption) {
    const f = document.createElement("figure");
    f.className = "heart-lesson-figure stamina-shot-" + id;
    const c = document.createElement("figcaption");
    c.textContent = caption;
    f.append(c, originalPicture(id));
    return f;
  }
  function show(index) {
    if (finished || index < 0 || index >= STEPS.length) return;
    current = index;
    pictures.close();
    const s = STEPS[index],
      f = facts;
    $("staminaStepNumber").textContent = `连续案例 / ${index + 1}`;
    $("staminaStepTitle").textContent = s.title;
    $("staminaStepCopy").textContent = s.text;
    const readings = [
      `体力 ${f.first.stamina} / ${f.maximum} · 疲惫 · 跟随DC＋${f.first.fatigue}`,
      `体力 ${f.first.stamina} → ${f.first.after} · 跟随−${f.first.actionCost} · 心跳回合−${f.first.tax}`,
      `便当恢复＋${f.supply.gain} · 体力 ${f.supply.before} → ${f.supply.after}`,
      `疲劳跟随DC ＋${f.first.fatigue} → ＋${f.second.fatigue} · 仍有气喘`,
    ];
    const result = [
      "体力低于上限25%时，跟随DC＋3；不是等到体力归零才有影响。",
      `本次总DC ${f.first.dc}；行动点不重复扣入场费。`,
      `便当 ${f.supply.countBefore}份 → ${f.supply.countAfter}份；本次使用没有推进内部回合。`,
      `这次总DC ${f.second.dc}，行动后体力 ${f.second.after}。疲劳加难按每次动作执行前的体力计算。`,
    ];
    $("staminaStepReadings").textContent = readings[index];
    $("staminaStepResult").textContent = result[index];
    $("staminaStepPictures").replaceChildren(
      ...s.pictures.map(([id, c]) => figure(id, c)),
    );
    for (const b of $("staminaSteps").children)
      b.setAttribute(
        "aria-pressed",
        String(Number(b.dataset.staminaStep) === index),
      );
    $("staminaPrev").disabled = index === 0;
    $("staminaNext").disabled = index === STEPS.length - 1;
    $("staminaStepCount").textContent = `${index + 1} / ${STEPS.length}`;
  }
  if (!policy.shouldShow(COURSE)) {
    finish(true);
    return { show, isSkipped: policy.isSkipped };
  }
  root.hidden = false;
  for (const [i, s] of STEPS.entries()) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.staminaStep = i;
    b.textContent = `${i + 1}. ${s.name}`;
    $("staminaSteps").append(b);
  }
  for (const [id, key] of [
    ["staminaFollowCost", "follow"],
    ["staminaScanCost", "scan"],
    ["staminaPhotoCost", "photo"],
  ])
    $(id).textContent = `每次 ${facts.costs[key]} 点体力`;
  for (const band of facts.bands) {
    const e = document.createElement("article"),
      title = document.createElement("strong"),
      p = document.createElement("p");
    title.textContent = band.name;
    p.textContent =
      `${band.current}/${facts.maximum} · ` +
      (band.current === 0
        ? "先补给或结束尾行"
        : band.dc
          ? `跟随DC＋${band.dc}`
          : "跟随无疲劳加难");
    e.append(title, p);
    $("staminaBands").append(e);
  }
  const r = facts.rest;
  $("staminaRestResult").textContent =
    `独立日程样例：体力 ${r.before} → ${r.after}，行动点 ${r.apBefore} → ${r.apAfter}，${r.periodBefore} → ${r.periodAfter}。恢复不超过上限；提前花掉一个时段，也可能错过目标出行。`;
  lifecycle.on($("staminaSteps"), "click", (e) => {
    const b = e.target.closest("[data-stamina-step]");
    if (b) show(Number(b.dataset.staminaStep));
  });
  lifecycle.on($("staminaPrev"), "click", () => show(current - 1));
  lifecycle.on($("staminaNext"), "click", () => show(current + 1));
  lifecycle.on(root, "keydown", (e) => {
    if (
      e.altKey ||
      e.ctrlKey ||
      e.metaKey ||
      e.target.closest("input,textarea,select")
    )
      return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      show(current + (e.key === "ArrowRight" ? 1 : -1));
    }
  });
  lifecycle.on($("staminaLessonSkipAll"), "click", () =>
    finish(true, policy.skipAll()),
  );
  lifecycle.on($("staminaLessonComplete"), "click", () => {
    policy.complete(COURSE);
    finish();
  });
  lifecycle.on($("staminaRulesDetail"), "toggle", () => {
    if (
      !finished &&
      $("staminaRulesDetail").open &&
      !$("staminaEmptyPicture").childElementCount
    )
      $("staminaEmptyPicture").append(originalPicture("empty"));
  });
  lifecycle.on($("staminaRestDetail"), "toggle", () => {
    if (
      !finished &&
      $("staminaRestDetail").open &&
      !$("staminaRestPicture").childElementCount
    )
      $("staminaRestPicture").append(originalPicture("rest"));
  });
  show(0);
  return { show, isSkipped: policy.isSkipped };
}
module.exports = { mountStaminaLesson, STEPS };
