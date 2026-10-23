"use strict";
const { createTrainingPictures } = require("./training-pictures.js");
const { POINT_BUDGET, ATTR_NAMES } = require("../creation-data.js");
const COURSES = {
  player: {
    step: 1, eyebrow: "属性入门 · 01 / 02", title: "先认识自己，再决定怎么加点",
    lead: "属性决定你擅长什么。选身份、分点数之前，先看懂这五项。",
    cards: [
      ["str", "体格", "体力与力量", "影响体力上限，也用于部分力量检定。"],
      ["agi", "敏捷", "跟上、藏好、行动利落", "跟缀与隐蔽等行动会使用敏捷。"],
      ["nrv", "胆量", "稳住心跳", "影响受刺激时的心跳增长，以及缓息的恢复效果。"],
      ["int", "情报", "看出细节", "打量、推断与读时机等观察行动会使用情报。"],
      ["cha", "口才", "把话说圆", "搭话与交谈等互动会使用口才。"],
    ],
    shot: "player-allocation", caption: "真实加点界面 · 技术宅预设示例，不会替你分配点数",
    rules: [
      ["先分基础点", `你有 ${POINT_BUDGET} 点，五项各分 1～10 点；必须分完才能继续。`],
      ["再看身份修正", "身份加成另算，最终属性最多为 10。加成溢出时，加点界面会提醒你。"],
      ["高属性也有风险", "通常是骰值 + 本次使用的属性 + 修正，与难度比较；天然 1 / 20 另有规则。不是属性高就必定成功。"],
    ],
    next: "我明白了，开始创建角色 →",
  },
  target: {
    step: 2, eyebrow: "属性入门 · 02 / 02", title: "目标也有属性，但你还不知道答案",
    lead: "下一步选择的是训练对象。她的属性不会因为你选中了她，就全部向你公开。",
    cards: [
      ["str", "体格", "身体力量", "用于力量相关的对抗判断。"],
      ["agi", "敏捷", "行动速度", "在追逐等速度对抗中起作用。"],
      ["per", "敏锐", "察觉异常", "影响她察觉动静的能力；性格与装备也可能带来修正。"],
      ["nrv", "胆量", "受惊后的反应", "参与警觉后的行为分支判断，不能只凭外表猜测。"],
      ["soc", "社交", "互动侧的能力记录", "档案中的属性项；实际互动还要看行动规则、性格与修正，不能只比较这一项。"],
    ],
    shot: "target-attributes", caption: "真实目标选择界面 · 这里的问号不是 0，也不是随机生成失败",
    rules: [
      ["“？”就是尚未确认", "选择页保留未知值，不会把后台生成的真实数值直接告诉你。"],
      ["情报点不是情报属性", "情报属性是你的能力；PI 是行动积累的情报点。接近度、警觉与心跳也各有用途。"],
      ["调查后再判断", "只以档案实际解锁的内容为准。一次打量不保证揭开某项属性，更不会直接得到住址和后续行程。"],
    ],
    next: "我明白了，开始选择目标 →",
  },
};
function createAttributeLessons({ document, lifecycle, onContinue, onBack }) {
  const field = (id) => document.getElementById(id);
  const root = field("zeroAttributeLesson"), { picture } = createTrainingPictures({ document, lifecycle });
  let key = "player";
  const el = (tag, text) => { const n = document.createElement(tag); if(text) n.textContent = text; return n; };
  function show(id) {
    key = id;
    const course = COURSES[id];
    root.dataset.attributeCourse = id;
    field("attributeLessonEyebrow").textContent = course.eyebrow;
    field("attributeLessonTitle").textContent = course.title;
    field("attributeLessonLead").textContent = course.lead;
    field("attributeLessonCards").replaceChildren(...course.cards.map(([code,name,label,desc], i) => {
      const card = el("article"); card.dataset.attr = code;
      const index = el("span", String(i+1).padStart(2,"0")); index.className = "attribute-card-index";
      card.append(index, el("h4", id === "player" ? ATTR_NAMES[code] : name), el("strong", label), el("p", desc)); return card;
    }));
    field("attributeLessonShotCaption").textContent = course.caption;
    field("attributeLessonScreenshot").replaceChildren(picture(course.shot));
    field("attributeLessonRules").replaceChildren(...course.rules.map(([title,note]) => {
      const li = el("li"); li.append(el("strong", title),el("p", note)); return li;
    }));
    field("attributeLessonContinue").textContent = course.next;
    field("attributeLessonBack").hidden = id !== "target";
  }
  lifecycle.on(field("attributeLessonContinue"), "click", () => onContinue(key, COURSES[key].step));
  lifecycle.on(field("attributeLessonBack"), "click", onBack);
  return { show, destination: () => COURSES[key].step };
}
module.exports = { createAttributeLessons, COURSES };
