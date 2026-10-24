"use strict";
// 档案路线编辑只发结构化命令，沿宿主原保存／回退链路。
function createKnownRoutesUI({ document, lifecycle, getGlue = () => null }) {
  let current = null,
    signature = null,
    busy = false;
  const root = () => document.getElementById("profileRoutes");
  function render(snap) {
    current = snap;
    const node = root();
    if (!node) return;
    const routes =
      snap?.profile && snap.profile.targetId === snap?.target?.id
        ? snap.profile.routes || []
        : [];
    const next = JSON.stringify([snap?.target?.id, routes]);
    if (signature === next) return;
    signature = next;
    node.replaceChildren();
    if (!routes.length) {
      node.textContent = "尚未探明路线。实际跟随确认的路段会记录在这里。";
      return;
    }
    for (const r of routes) {
      const card = document.createElement("section");
      card.className = "profile-route";
      const form = document.createElement("form");
      form.dataset.knownRoute = r.id;
      const label = document.createElement("label");
      label.textContent = "路线名称";
      const input = document.createElement("input");
      input.name = "routeName";
      input.value = r.name;
      input.maxLength = 48;
      input.required = true;
      input.setAttribute("aria-label", "路线名称（最多24个字）");
      const button = document.createElement("button");
      button.type = "submit";
      button.textContent = "保存名称";
      label.append(input);
      form.append(label, button);
      card.append(form);
      const hint = document.createElement("p");
      hint.className = "muted";
      hint.textContent = "已探明路段 · 未确认的后续行程不会显示";
      card.append(hint);
      for (const s of r.segments) {
        const row = document.createElement("p");
        row.className = "profile-route-segment";
        row.textContent = `${s.from} → ${s.to}`;
        card.append(row);
      }
      const status = document.createElement("p");
      status.className = "profile-route-status";
      status.setAttribute("role", "status");
      card.append(status);
      node.append(card);
    }
  }
  lifecycle?.on(document, "submit", async (event) => {
    const form = event.target.closest?.("form[data-known-route]");
    if (!form) return;
    event.preventDefault();
    if (busy) return;
    const request = {
      targetId: current?.target?.id,
      id: form.dataset.knownRoute,
      name: form.elements.routeName.value,
      sync: current?.dayPlan?.sync,
    };
    const status = form.parentElement.querySelector(".profile-route-status"),
      button = form.querySelector("button");
    try {
      const glue = getGlue();
      if (!glue?.command)
        throw Error("当前环境未接入保存，请在正式游戏或独立试玩中修改");
      busy = true;
      button.disabled = true;
      const result = await glue.command("renameKnownRoute", request);
      form.elements.routeName.value = result.name;
      // 轮询若已重绘，定位同一路线的当前提示。
      const active = root()?.querySelector(
        `[data-known-route="${request.id}"]`,
      );
      const target =
        current?.target?.id === request.targetId
          ? active?.parentElement.querySelector(".profile-route-status")
          : null;
      if (target) target.textContent = "路线名称已保存";
    } catch (error) {
      if (status.isConnected)
        status.textContent = error.message || "保存失败，请重试";
    } finally {
      busy = false;
      button.disabled = false;
    }
  });
  return { render };
}
module.exports = { createKnownRoutesUI };
