"use strict";
const { modal } = require("./dom");
const { downloadDiagnostics } = require("./diagnostics");
function openRecovery(doc, runtime, report) {
  doc.querySelector("[data-player-recovery]")?.close();
  const sheet = modal(doc, "检查与修复");
  sheet.dataset.playerRecovery = "";
  const body = sheet.querySelector(".xsd2-dialog-body"),
    message = doc.createElement("p"),
    note = doc.createElement("p");
  message.setAttribute("role", "status");
  message.setAttribute("aria-live", "polite");
  note.textContent =
    "修复前自动保留一份备份。修复不改正文、不重新生成；继续聊天或调整进度后，不能撤销之前的修复。";
  const controls = doc.createElement("div"),
    buttons = {};
  for (const [key, label] of Object.entries({
    check: "重新检查",
    repair: "检查并修复",
    cancel: "撤回中断操作",
    undo: "撤销本次修复",
    diagnostic: "导出诊断",
  })) {
    const b = doc.createElement("button");
    b.type = "button";
    b.dataset.recoveryAction = key;
    b.textContent = label;
    controls.append(b);
    buttons[key] = b;
  }
  body.append(message, note, controls);
  let plan = null,
    busy = false;
  const scope = () => {
      const s = runtime.getRecoveryScope?.() || runtime.getSnapshot?.();
      return JSON.stringify([s?.chatId, s?.branchId]);
    },
    origin = scope();
  function enabled() {
    buttons.check.disabled = busy;
    buttons.repair.disabled =
      busy || !plan?.actions?.some((x) => x === "replay" || x === "refresh");
    buttons.repair.textContent = plan?.actions?.includes("replay")
      ? "补核验原回复"
      : "重新读取并刷新";
    buttons.cancel.hidden = !plan?.actions?.includes("cancel");
    buttons.cancel.disabled = busy;
    buttons.undo.disabled = busy || !plan?.canUndo;
    buttons.diagnostic.disabled = busy;
  }
  async function run(task) {
    if (busy || !sheet.isConnected) return;
    busy = true;
    sheet.setAttribute("aria-busy", "true");
    enabled();
    try {
      if (scope() !== origin)
        throw Error("聊天已切换，请关闭后在当前聊天重新检查。");
      await task();
    } catch (error) {
      message.textContent = error.message;
      plan = null;
      report?.(error);
    } finally {
      busy = false;
      sheet.removeAttribute("aria-busy");
      enabled();
    }
  }
  async function check(prefix = "") {
    plan = await runtime.inspectRecovery();
    if (sheet.isConnected)
      message.textContent = prefix + (prefix ? "\n" : "") + plan.message;
  }
  buttons.check.onclick = () => run(() => check());
  buttons.repair.onclick = () =>
    run(async () => {
      const result = await runtime.repair(
        plan.id,
        plan.actions.includes("replay") ? "replay" : "refresh",
      );
      await check(result.message);
    });
  buttons.cancel.onclick = () =>
    run(async () => {
      const result = await runtime.repair(plan.id, "cancel");
      await check(result.message);
    });
  buttons.undo.onclick = () =>
    run(async () => {
      const result = await runtime.undoRepair();
      await check(result.message);
    });
  buttons.diagnostic.onclick = () =>
    downloadDiagnostics(doc, runtime, { playerRecovery: true, check: plan });
  run(() => check());
  return () => sheet.remove();
}
module.exports = { openRecovery };
