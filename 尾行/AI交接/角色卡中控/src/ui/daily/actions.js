"use strict";
function createDailyActionsUI({
  document,
  window,
  lifecycle,
  getGlue,
  reportSyncError,
}) {
  const grid = document.getElementById("wxDailyActionGrid"),
    controls = document.getElementById("wxDailyControls"),
    status = document.getElementById("wxDailyStatus");
  let snapshot = null,
    pending = null,
    retry = null,
    counter = 0;
  const inputs = new Map();
  const sameSession = (a, b) =>
    !!a && !!b && a.scope === b.scope && a.epoch === b.epoch;
  function message(text) {
    if (status) status.textContent = text;
  }
  function reset() {
    snapshot = null;
    pending = null;
    retry = null;
    grid?.replaceChildren();
    controls?.replaceChildren();
    message("");
  }
  function card(data, command) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "wx-daily-action";
    button.dataset.dayCommand = command;
    if (data.id) button.dataset.actionId = data.id;
    const heading = document.createElement("span");
    heading.className = "wx-daily-action-head";
    const name = document.createElement("strong");
    name.textContent = data.name;
    const cost = document.createElement("span");
    cost.className = "wx-daily-action-cost";
    cost.textContent = `${data.cost || 0} 点`;
    heading.append(name, cost);
    const effect = document.createElement("span");
    effect.className = "wx-daily-action-effect";
    effect.textContent = data.effect;
    const reason = document.createElement("span");
    reason.className = "wx-daily-action-reason";
    const missingInput = data.inputRequired && !inputs.has(data.id);
    button.disabled =
      !!pending || !data.enabled || !snapshot?.dayPlan?.sync || !!missingInput;
    reason.textContent = !snapshot?.dayPlan?.sync
      ? "正在连接当前日程"
      : missingInput
        ? "请先选择活动内容"
        : !data.enabled
          ? data.reason || "当前不可执行"
          : pending
            ? "正在保存…"
            : "";
    button.append(heading, effect, reason);
    return button;
  }
  function render(snap) {
    if (!snap?.dayPlan || !Array.isArray(snap.dayActions)) return reset();
    if (snapshot && !sameSession(snapshot.dayPlan.sync, snap.dayPlan.sync)) {
      pending = null;
      retry = null;
      message("");
    }
    snapshot = snap;
    if (grid) {
      grid.replaceChildren();
      snap.dayActions.forEach((action) => grid.append(card(action, "start")));
    }
    if (controls) {
      controls.replaceChildren();
      (snap.dayControls || []).forEach((control) =>
        controls.append(card(control, control.command)),
      );
      if (retry) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.dayCommand = "retry";
        button.textContent = "重新提交上次活动";
        button.disabled = !!pending;
        controls.append(button);
      }
    }
  }
  async function submit(request) {
    const operation = { request };
    pending = operation;
    render(snapshot);
    try {
      const glue = getGlue();
      if (!glue?.command)
        throw Object.assign(Error("日程引擎尚未就绪"), {
          code: "ENGINE_UNAVAILABLE",
        });
      const receipt = await glue.command("executeDailyCommand", request);
      if (
        lifecycle.disposed ||
        pending !== operation ||
        !sameSession(snapshot?.dayPlan?.sync, request.sync)
      )
        return;
      retry = null;
      message(receipt.summary);
    } catch (error) {
      if (
        lifecycle.disposed ||
        pending !== operation ||
        !sameSession(snapshot?.dayPlan?.sync, request.sync)
      )
        return;
      message(error.message || "活动未完成，请重试");
      if (
        ["WRITE_FAILED", "READ_FAILED", "WRITE_CONFLICT"].includes(error.code)
      ) {
        retry = request;
        reportSyncError(error);
      } else retry = null;
    } finally {
      if (pending === operation) {
        pending = null;
        if (!lifecycle.disposed && snapshot) render(snapshot);
      }
    }
  }
  async function click(event) {
    const button = event.target.closest?.("button[data-day-command]");
    if (!button || button.disabled || pending || !snapshot?.dayPlan?.sync)
      return;
    if (button.dataset.dayCommand === "retry") return submit(retry);
    const captured = snapshot;
    let args = {};
    const input = inputs.get(button.dataset.actionId);
    if (input) {
      args = await input(captured);
      if (args == null || snapshot !== captured || lifecycle.disposed) return;
    }
    const operationId =
      window.crypto?.randomUUID?.() || `daily-${Date.now()}-${++counter}`;
    const request = {
      operationId,
      command: button.dataset.dayCommand,
      expected: { ...captured.dayPlan.token },
      sync: { ...captured.dayPlan.sync },
      args,
    };
    if (button.dataset.actionId) request.actionId = button.dataset.actionId;
    if (captured.dayPlan.activity)
      request.activityId = captured.dayPlan.activity.id;
    return submit(request);
  }
  lifecycle.on(grid, "click", click);
  lifecycle.on(controls, "click", click);
  return {
    render,
    reset,
    registerInput(id, provider) {
      if (typeof provider !== "function") throw Error("活动输入接口无效");
      inputs.set(id, provider);
      if (snapshot) render(snapshot);
      return () => inputs.delete(id);
    },
  };
}
module.exports = { createDailyActionsUI };
