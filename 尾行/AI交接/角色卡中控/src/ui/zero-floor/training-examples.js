"use strict";
// 教学展示仅消费构建时白名单案例。点击示范不访问 WxGlue，不运行生产命令。
const { trainingSample: sample } = require("../generated/rules.json");
function createTrainingExamples({ document, lifecycle, root }) {
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const mount = (kind, content) =>
    root
      .querySelector(`[data-training-example="${kind}"]`)
      ?.replaceChildren(content);
  const tag = (number, title, hint) => {
    const row = el("div", "training-ui-callout");
    row.append(
      el("b", "", number),
      el("strong", "", title),
      el("span", "", hint),
    );
    return row;
  };
  const block = (title) => {
    const b = el("div", "training-ui-box");
    if (title) b.append(el("p", "training-ui-label", title));
    return b;
  };
  const signed = (n) => `${n > 0 ? "+" : ""}${n}`;
  const { before, after } = sample;
  const terminal = el("div", "training-ui-terminal");
  terminal.append(tag("01", "状态栏", "先读当前状态 ↓"));
  const bar = block();
  bar.classList.add("training-ui-highlight");
  const line = el("div", "training-ui-bar");
  line.append(
    el("strong", "", before.place),
    el("span", "", `体力 ${before.stamina} · 心跳 ${before.heart}`),
    el("span", "training-ui-link", "战术终端 ↗"),
  );
  bar.append(
    line,
    el(
      "p",
      "training-ui-date",
      `第 ${before.date} 天 · ${before.period}　行动点 ${before.remaining} / ${before.budget}`,
    ),
    el("p", "training-ui-muted", "原流程示例 · 日程活动尚未启用"),
  );
  terminal.append(bar, tag("02", "更多 ▾", "展开“侦查与取证” ↓"));
  const drawer = block("侦查与取证");
  const chips = el("div", "training-ui-chips");
  for (const label of ["拍照", "打量", "读时机"])
    chips.append(el("span", label === "打量" ? "selected" : "", label));
  drawer.append(chips);
  terminal.append(drawer, tag("03", "战术终端", "观察流水 / 本轮结算 ↓"));
  const records = block("行动后回来查看");
  records.append(
    el("p", "training-ui-muted", "新的观察会带着时间出现在流水中。"),
    el("span", "training-ui-link", "她的档案 ↗"),
  );
  terminal.append(records);
  mount("terminal", terminal);
  mount(
    "location",
    el(
      "p",
      "",
      `你在：${before.place} · ${before.targetLive ? "目视位置" : "最后目击"}：${before.place}`,
    ),
  );

  const action = el("div", "training-action-example");
  action.append(tag("01", "更多 → 侦查与取证", "点选打量 ↓"));
  const actionChoices = el("div", "training-ui-chips training-ui-action-chips");
  actionChoices.append(el("span", "", "拍照"));
  const select = el("button", "training-scan-button", "打量");
  select.type = "button";
  select.dataset.trainingSelect = "scan";
  select.setAttribute("aria-pressed", "false");
  actionChoices.append(select, el("span", "", "读时机"));
  action.append(actionChoices);
  const status = el("p", "training-ui-queue", "待选动作：点击上方“打量”");
  status.dataset.trainingQueue = "";
  status.setAttribute("role", "status");
  action.append(status, tag("02", "随本轮发送", "文字可以补充做法 ↓"));
  const inputLabel = el(
    "label",
    "training-narration-label",
    "伴随描写（可选，仅用于这次示范）",
  );
  const input = el("textarea", "training-narration");
  input.id = "trainingBriefNarration";
  input.rows = 2;
  input.maxLength = 500;
  input.placeholder = "例如：我留意她的步幅和周围动静。";
  inputLabel.htmlFor = input.id;
  action.append(inputLabel, input);
  action.append(
    el(
      "p",
      "training-ui-muted",
      `本例：${before.place} / 已目视目标 / 同街。发送后比较实际消耗。`,
    ),
  );
  const send = el("button", "training-demo-send", "示范发送本轮 →");
  send.type = "button";
  send.dataset.trainingSend = "";
  send.disabled = true;
  const output = el("div", "training-demo-output");
  output.dataset.trainingOutput = "";
  output.setAttribute("role", "status");
  output.hidden = true;
  output.append(
    el("strong", "", `${sample.action.name} · 成功示例`),
    el("p", "", `${sample.record[0]} · ${sample.record[1]}`),
    el(
      "p",
      "training-ui-gain",
      `情报 PI ${signed(sample.delta.pi)} · 体力 ${signed(sample.delta.stamina)} · 日程行动点 ${before.remaining} → ${after.remaining}`,
    ),
    el(
      "p",
      "training-ui-muted",
      "这是一次成功示例；正式游玩的结果取决于当次检定。",
    ),
  );
  action.append(send, output);
  mount("action", action);
  let selected = false,
    demonstrated = false,
    busy = false;
  function sync() {
    select.disabled = busy;
    select.setAttribute("aria-pressed", String(selected));
    send.disabled = busy || !selected || demonstrated;
    send.textContent = demonstrated ? "示范已展示 ✓" : "示范发送本轮 →";
    status.textContent = demonstrated
      ? "已发送示范动作：打量"
      : selected
        ? "已选中：打量 · 发送后才执行"
        : "待选动作：点击上方“打量”";
    output.hidden = !demonstrated;
    input.disabled = busy;
  }
  lifecycle.on(select, "click", () => {
    if (busy || demonstrated) return;
    selected = !selected;
    sync();
  });
  lifecycle.on(send, "click", () => {
    if (busy || !selected || demonstrated) return;
    demonstrated = true;
    sync();
  });
  const result = el("div", "training-result-example");
  const comparison = el("div", "training-comparison");
  for (const [title, view] of [
    ["行动前", before],
    ["行动后", after],
  ]) {
    const column = block(title);
    column.append(
      el("strong", "training-ui-value", `PI ${view.pi}`),
      el("p", "", `体力 ${view.stamina}`),
      el(
        "p",
        "training-ui-muted",
        `日程行动点 ${view.remaining} / ${view.budget}`,
      ),
    );
    comparison.append(column);
  }
  result.append(
    comparison,
    tag("新增", "终端观察流水", "在这里看到第一次发现 ↓"),
  );
  const record = block();
  record.classList.add("training-ui-highlight");
  record.append(
    el("time", "", sample.record[0]),
    el("p", "", sample.record[1]),
  );
  record.dataset.trainingRecord = "";
  result.append(record);
  const limits = block("仍然未知");
  limits.append(
    el("p", "training-ui-muted", "住址与后续行程：未因这次打量解锁"),
    el("p", "training-ui-muted", "目标属性：仍为 ？"),
    el("p", "training-ui-muted", `本例新增档案条目：${sample.newFactCount} 条`),
  );
  result.append(
    limits,
    el(
      "p",
      "training-ui-route-hint",
      "查流水 → 核对结算 → 条件满足后再查“她的档案”",
    ),
  );
  mount("result", result);
  sync();
  return {
    setBusy(value) {
      busy = value;
      sync();
    },
    reset() {
      selected = false;
      demonstrated = false;
      input.value = "";
      sync();
    },
  };
}
module.exports = { createTrainingExamples };
