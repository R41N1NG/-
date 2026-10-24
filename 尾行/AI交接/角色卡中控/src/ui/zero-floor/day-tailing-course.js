"use strict";
// 第二组课程：只读图文，不执行日程、骰子或保存游戏进度。
const { createScreenshotPictures } = require("./screenshot-pictures");
const { createTutorialPolicy } = require("./tutorial-policy");
const PAGES = [
  {
    key: "day",
    label: "安排一天",
    title: "每天4点，先看时段，再安排活动",
    lead: "早间、午间、午后、晚间、子夜，共五个时段。行动点与时间各管一件事。",
    cards: [
      [
        "先看费用",
        "每天4点行动点，每个时段最多安排一次日程行动；做完就进入下一时段。",
      ],
      [
        "移动也会花时间",
        "地图移动不扣行动点，但会消耗时间格。一个时段不能靠反复移动无限停住。",
      ],
      [
        "不必用完每个时段",
        "休息、打工各1点；尾行入场2点。度过当前时段0点，没有恢复或收入。",
      ],
    ],
    shot: "day",
    caption: "真实日程界面 · 本例从午间开始，仍有4点行动点",
  },
  {
    key: "move",
    label: "到达现场",
    title: "在地图上点地点，去现场确认",
    lead: "这次训练以大学城为例。公开地点给你调查方向，目标的隐藏日程不会直接交到你手里。",
    cards: [
      [
        "点地点直接移动",
        "同区移动1格、跨区2格；每时段3格。到达时可能已换时段，目标也可能已经离开。",
      ],
      [
        "实心橙点：正在目视",
        "本例实际到达食堂后才看见她。蓝点是你；空心橙点只代表最后一次目击。",
      ],
      [
        "普通移动还不是尾行",
        "走到某个地点不会自动跟着她走。只有实际出现出行机会，才可能接入正式尾行。",
      ],
    ],
    shot: "move",
    caption: "真实地图 · 到达大学食堂后的目视记录，不展示完整行程表",
  },
  {
    key: "entry",
    label: "开始尾行",
    title: "看见她准备离开，才有跟随的机会",
    lead: "不是每天固定开一晚。是否开始，要看你在正确的现场有没有目视她的出行。",
    cards: [
      [
        "先满足现场条件",
        "本例在晚间大学正门，看见她准备离开。仅到校门、仅有旧目击、或已经错过时段都不够。",
      ],
      [
        "入口提前说明费用",
        "本次尾行入场消耗2点；行动点不足不能开始。读地图、查看档案不会代替入场。",
      ],
      [
        "进入后换一种操作",
        "进入明确的尾行界面，使用跟随动作逐段判定。内部回合不再重复扣入场的2点；整段结束后推进一次外层时段。",
      ],
    ],
    shot: "entry",
    caption:
      "真实离校现场 · 本例的时段条件只属于这次女大学生出行，不是全目标通用的晚间限制",
  },
  {
    key: "follow",
    label: "跟随与收获",
    title: "保持目视，留住已经确认的路段",
    lead: "下面几张图来自同一套真实引擎规则。失败样例可以复现，但不代表每次尾行都会在同一段失败。",
    cards: [],
    caption: "点击下方情形切换真实界面；点击说明切换标注",
  },
];
const SITUATIONS = [
  {
    key: "tailing",
    label: "距离与判定",
    title: "远近都有代价",
    text: "远端跟随DC＋2；身后、贴身的心跳与近距离暴露更高，敏捷可减免一部分暴露。掌握真实相邻下一站才有情报加值，未知没有加值。",
  },
  {
    key: "recovery",
    label: "一次追找",
    title: "首个普通失败，还能追找一次",
    text: "每次尾行首个普通失败提供一次追找机会。真实再花一个内部回合判定，原消耗不退，也不保证找回。找回后从远端继续；天然1不提供这次补救。",
  },
  {
    key: "lost",
    label: "确认跟丢",
    title: "没能找回，就明确结束这次跟随",
    text: "这里只保留最后目击，不公开她之后的去向。已花的入场点不退，结束时推进一次日程；此前确认的线索与实际结算的调查熟练度会保留。",
  },
  {
    key: "profile",
    label: "路线收获",
    title: "已探明路线留在她的档案里",
    text: "默认名称是“归家路线”，可以自行改名。只记录确实探明的连接，缺失的路段不会补出来；保存名称不花行动点，也不会改变她的真实行程。",
  },
];
function mountDayTailingCourse({
  document,
  window,
  lifecycle,
  shots,
  onComplete = () => {},
}) {
  const root = document.getElementById("dayCourse"),
    policy = createTutorialPolicy(window),
    COURSE = "day-tailing";
  const { picture, close } = createScreenshotPictures({
    document,
    lifecycle,
    shots,
  });
  let page = 0,
    situation = 0;
  const el = (tag, text) => {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const $ = (id) => document.getElementById(id);
  function finish(skipped = false) {
    root.hidden = true;
    $("dayCourseDone").hidden = false;
    $("dayCourseDoneText").textContent = skipped
      ? "已跳过全部教程。后续教程也会关闭。"
      : "这一章已读完。可以在配套日程试玩里练习移动、入场和跟随。";
    close();
    onComplete({ skipped });
  }
  function render(focus = false) {
    const p = PAGES[page];
    root.dataset.page = p.key;
    $("dayCourseTitle").textContent = p.title;
    $("dayCourseLead").textContent = p.lead;
    $("dayCourseCount").textContent = `第二组 · ${page + 1} / ${PAGES.length}`;
    for (const b of $("dayCourseNav").children)
      b.setAttribute(
        "aria-current",
        Number(b.dataset.page) === page ? "step" : "false",
      );
    const cards = $("dayCourseCards");
    cards.replaceChildren();
    for (const [title, text] of p.cards) {
      const c = el("article");
      c.append(el("h3", title), el("p", text));
      cards.append(c);
    }
    const last = page === PAGES.length - 1;
    $("dayCourseSituations").hidden = !last;
    $("dayCourseSituationCopy").hidden = !last;
    const scene = SITUATIONS[situation];
    if (last) {
      $("dayCourseSituationTitle").textContent = scene.title;
      $("dayCourseSituationText").textContent = scene.text;
      for (const b of $("dayCourseSituations").children)
        b.setAttribute(
          "aria-pressed",
          Number(b.dataset.situation) === situation ? "true" : "false",
        );
    }
    $("dayCoursePicture").replaceChildren(picture(last ? scene.key : p.shot));
    $("dayCourseCaption").textContent = p.caption;
    $("dayCoursePrev").disabled = page === 0;
    $("dayCourseNext").textContent = last
      ? "读完这一章 ✓"
      : `下一页：${PAGES[page + 1].label} →`;
    if (focus) $("dayCourseTitle").focus();
  }
  PAGES.forEach((p, i) => {
    const b = el("button", `${String(i + 1).padStart(2, "0")} ${p.label}`);
    b.type = "button";
    b.dataset.page = String(i);
    $("dayCourseNav").append(b);
  });
  SITUATIONS.forEach((s, i) => {
    const b = el("button", s.label);
    b.type = "button";
    b.dataset.situation = String(i);
    $("dayCourseSituations").append(b);
  });
  function show(n) {
    if (!Number.isInteger(n) || n < 0 || n >= PAGES.length || root.hidden)
      return;
    close();
    page = n;
    render(true);
  }
  lifecycle.on($("dayCourseNav"), "click", (e) => {
    const b = e.target.closest("[data-page]");
    if (b) show(Number(b.dataset.page));
  });
  lifecycle.on($("dayCourseSituations"), "click", (e) => {
    const b = e.target.closest("[data-situation]");
    if (b) {
      close();
      situation = Number(b.dataset.situation);
      render();
    }
  });
  lifecycle.on($("dayCoursePrev"), "click", () => show(page - 1));
  lifecycle.on($("dayCourseNext"), "click", () => {
    if (page === PAGES.length - 1) {
      policy.complete(COURSE);
      finish();
    } else show(page + 1);
  });
  lifecycle.on($("dayCourseSkipAll"), "click", () => {
    const persisted = policy.skipAll();
    finish(true);
    if (!persisted)
      $("dayCourseDoneText").textContent +=
        " 浏览器未能保存偏好，本页内已生效。";
  });
  lifecycle.on(root, "keydown", (e) => {
    if (
      e.target.closest("input,textarea,select") ||
      e.altKey ||
      e.ctrlKey ||
      e.metaKey
    )
      return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      show(page + (e.key === "ArrowRight" ? 1 : -1));
    }
  });
  if (policy.shouldShow(COURSE)) {
    root.hidden = false;
    render();
  } else finish(true);
  return { show, getPage: () => page, isSkipped: policy.isSkipped };
}
module.exports = { mountDayTailingCourse, PAGES, SITUATIONS };
