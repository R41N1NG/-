"use strict";
// 第三组第一页；只读教学，复用全局跳过偏好和原图标注，不执行游戏动作。
const { createScreenshotPictures } = require("./screenshot-pictures");
const { createTutorialPolicy } = require("./tutorial-policy");
const STATES = [
  {
    id: "calm",
    name: "平稳 · 30",
    title: "负荷偏低，暂时没有甜区加值",
    text: "本例30低于甜区下限40。可以观察当前状态，不必为了追求加值主动冒险。",
  },
  {
    id: "sweet",
    name: "甜区 · 50",
    title: "本例50在甜区，检定获得＋1",
    text: "默认甜区为40–65。下面给出真实照片检定的心跳修正；属性、装备等其它修正仍各自计算。",
  },
  {
    id: "buffer",
    name: "离开甜区 · 68",
    title: "离开甜区不等于立刻扣精细检定",
    text: "本例68已失去甜区＋1，但还没到70的精细检定惩罚线。负荷继续升高会增加压力，不能只盯着是否已经受罚。",
  },
  {
    id: "deform",
    name: "操作变形 · 75",
    title: "从70起，精细检定受到−2修正",
    text: "照片、录音等精细操作会受到影响。扣的是这类检定的修正，不是把你的敏捷属性减掉2点。",
  },
  {
    id: "crash",
    name: "操作崩溃 · 95",
    title: "从90起，精细检定惩罚合计−4",
    text: "操作变形与操作崩溃各带来−2，合计−4。高负荷也会提高内部回合的体力消耗；先结合现场情况判断是否还要继续。",
  },
];
function mountHeartLesson({ document, window, lifecycle, shots, facts }) {
  const root = document.getElementById("heartLesson"),
    policy = createTutorialPolicy(window),
    COURSE = "pressure-heart";
  const { picture, close } = createScreenshotPictures({
    document,
    lifecycle,
    shots,
  });
  let current = "sweet";
  const $ = (id) => document.getElementById(id),
    el = (tag, text) => {
      const n = document.createElement(tag);
      n.textContent = text;
      return n;
    },
    sign = (n) => (n > 0 ? "+" : "") + n;
  function finish(skip = false, persisted = true) {
    root.hidden = true;
    close();
    $("heartLessonDone").hidden = false;
    $("heartLessonDoneText").textContent = skip
      ? "已跳过所有教程，后续章节也会关闭。"
      : "本页已读完。可继续第三组第二页“体力与准备”。";
    if (!persisted)
      $("heartLessonDoneText").textContent +=
        " 本页内已生效，浏览器未能保存偏好。";
  }
  function show(id) {
    if (root.hidden || !STATES.some((s) => s.id === id)) return;
    current = id;
    const state = STATES.find((s) => s.id === id),
      f = facts[id];
    $("heartStateTitle").textContent = state.title;
    $("heartStateCopy").textContent = state.text;
    $("heartStateReadings").textContent =
      `负荷 ${f.heart} / 100　→　${f.bpm} BPM`;
    $("heartStateMod").textContent = f.mods.length
      ? f.mods.map((m) => `${m.src} ${sign(m.v)}`).join(" ＋ ") +
        `；心跳部分合计 ${sign(f.mod)}`
      : "本次照片检定：心跳部分修正 0";
    $("heartStateMod").dataset.band =
      f.mod > 0 ? "gain" : f.mod < 0 ? "warn" : "calm";
    $("heartStatePicture").replaceChildren(picture(id));
    for (const b of $("heartStateTabs").children)
      b.setAttribute(
        "aria-pressed",
        b.dataset.heartState === id ? "true" : "false",
      );
  }
  STATES.forEach((s) => {
    const b = el("button", s.name);
    b.type = "button";
    b.dataset.heartState = s.id;
    $("heartStateTabs").append(b);
  });
  lifecycle.on($("heartStateTabs"), "click", (e) => {
    const b = e.target.closest("[data-heart-state]");
    if (b) {
      close();
      show(b.dataset.heartState);
    }
  });
  lifecycle.on($("heartLessonSkipAll"), "click", () =>
    finish(true, policy.skipAll()),
  );
  lifecycle.on($("heartLessonComplete"), "click", () => {
    policy.complete(COURSE);
    finish();
  });
  lifecycle.on(root, "keydown", (e) => {
    if (
      e.altKey ||
      e.ctrlKey ||
      e.metaKey ||
      e.target.closest("input,textarea,select")
    )
      return;
    const i = STATES.findIndex((s) => s.id === current),
      step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (step && STATES[i + step]) {
      e.preventDefault();
      close();
      show(STATES[i + step].id);
    }
  });
  lifecycle.on($("heartBreathDetail"), "toggle", () => {
    if (
      $("heartBreathDetail").open &&
      !$("heartBreathPicture").childElementCount
    )
      $("heartBreathPicture").append(picture("breath"));
  });
  if (!policy.shouldShow(COURSE)) {
    finish(true);
    return { show, isSkipped: policy.isSkipped };
  }
  root.hidden = false;
  $("heartEntryPicture").append(picture("entry"));
  const b = facts.breath;
  $("heartBreathResult").textContent =
    `本例胆量5：缓息本身 ${sign(b.direct)} 负荷，段末回落 ${sign(b.other)}，整轮 ${b.before} → ${b.after}。体力 ${sign(b.stamina)}，内部回合＋${b.turns}；没有重复扣入场行动点。`;
  $("heartAdvancedCopy").textContent =
    `胆量优势可把甜区上限扩至${facts.advanced.high}；但70操作线仍生效。实际样例在负荷70同时获得${facts.advanced.mods.map((m) => m.src + sign(m.v)).join("、")}，精细检定的心跳部分合计${sign(facts.advanced.mods.reduce((n, m) => n + m.v, 0))}。`;
  show("sweet");
  return { show, isSkipped: policy.isSkipped };
}
module.exports = { mountHeartLesson, STATES };
