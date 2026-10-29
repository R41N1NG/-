"use strict";
const { syncReport } = require("../contracts/chat-sync-report.js");
// [CHAT_SYNC:UI] 展示和楼层定位独立于游戏 UI；不解析聊天正文。
function createSyncNotice({ document, lifecycle, getGlue }) {
  const notice = document.getElementById("wxSyncNotice");
  let active = null;
  function clear() {
    active = null;
    if (notice) {
      notice.hidden = true;
      notice.replaceChildren();
    }
  }
  function report(error) {
    const source = error?.report || error;
    if (["STAMINA_INSUFFICIENT", "COLLEGE_CONDITION"].includes(source?.code)) {
      active = null;
      if (notice) {
        notice.hidden = false;
        notice.replaceChildren();
        notice.textContent =
          source.code === "COLLEGE_CONDITION"
            ? "当前不能执行这项行动。请查看尾行界面，先选择追找、确认收获或结束本次跟随。"
            : "体力不足，本次动作未执行，也没有推进时间。请减少所选动作、使用补给，或结束本次尾行。";
      }
      return;
    }
    active = syncReport(
      typeof source === "string"
        ? source
        : {
            code: source?.code,
            location: source?.location,
            sessionEpoch: source?.sessionEpoch,
          },
    );
    if (!notice) return;
    notice.hidden = false;
    notice.replaceChildren();
    const text = document.createElement("div");
    const loc = active.location;
    const floor =
      Number.isInteger(loc.index) && loc.index >= 0
        ? `首次差异：聊天第 ${loc.index} 楼（从 0 楼起算）${loc.kind === "missing" ? "已缺失" : ""}。`
        : "无法确定具体聊天楼层。";
    text.textContent = `${floor} ${active.message} 错误码：${active.code}`;
    notice.append(text);
    function button(label, name) {
      const el = document.createElement("button");
      el.type = "button";
      el.textContent = label;
      el.dataset.syncAction = name;
      notice.append(el);
      return el;
    }
    if (loc.messageId != null && loc.kind !== "missing")
      button("定位该楼", "locate");
    button("重新校验进度", "retry");
    if (active.code === "HISTORY_OUTSIDE_WINDOW")
      button("保留现存进度继续", "rebase");
    button("复制诊断信息", "copy");
  }
  lifecycle.on(notice, "click", async (event) => {
    const button = event.target.closest?.("button[data-sync-action]");
    if (!button || !active) return;
    const current = active;
    if (button.dataset.syncAction === "locate") {
      const node = [...document.querySelectorAll(".mes[mesid]")].find(
        (el) => el.getAttribute("mesid") === String(current.location.messageId),
      );
      if (node) {
        node.scrollIntoView?.({ behavior: "smooth", block: "center" });
        node.classList.add("wx-sync-floor");
        lifecycle.timeout(() => node.classList.remove("wx-sync-floor"), 5000);
      } else button.textContent = "该楼未加载，请先加载历史消息";
    } else if (button.dataset.syncAction === "retry") {
      const glue = getGlue();
      if (!glue?.reconcile) {
        button.textContent = "同步模块未就绪，请稍后重试";
        return;
      }
      button.disabled = true;
      try {
        await glue.reconcile();
        if (!lifecycle.disposed && active === current) clear();
      } catch (error) {
        if (!lifecycle.disposed && active === current) report(error);
      } finally {
        button.disabled = false;
      }
    } else if (button.dataset.syncAction === "rebase") {
      if (notice.querySelector('[data-sync-action="confirm-rebase"]')) return;
      const explanation = document.createElement("div");
      explanation.textContent =
        "确认后以现存存档的数值和进度为准，备份旧档及时间线，并从当前聊天建立新检查点。更早的聊天改动不会补算；不会重开游戏。";
      explanation.dataset.syncConfirmation = "true";
      notice.append(explanation);
      const confirm = document.createElement("button");
      confirm.type = "button";
      confirm.dataset.syncAction = "confirm-rebase";
      confirm.textContent = "确认按现存存档继续";
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.dataset.syncAction = "cancel-rebase";
      cancel.textContent = "取消";
      explanation.append(confirm, cancel);
    } else if (button.dataset.syncAction === "cancel-rebase") {
      notice.querySelector("[data-sync-confirmation]")?.remove();
    } else if (button.dataset.syncAction === "confirm-rebase") {
      const glue = getGlue();
      if (!glue?.acceptCurrentSave) {
        button.textContent = "恢复模块未就绪，请稍后重试";
        return;
      }
      button.disabled = true;
      try {
        await glue.acceptCurrentSave({
          confirm: true,
          expectedEpoch: current.sessionEpoch,
        });
        if (!lifecycle.disposed && active === current) clear();
      } catch (error) {
        if (!lifecycle.disposed && active === current) report(error);
      } finally {
        button.disabled = false;
      }
    } else if (button.dataset.syncAction === "copy") {
      // 始终可见的纯文本副本兼容无剪贴板权限的酒馆 iframe。
      let output = notice.querySelector("textarea");
      if (!output) {
        output = document.createElement("textarea");
        output.readOnly = true;
        notice.append(output);
      }
      output.value = JSON.stringify(
        { ...current, diagnostics: getGlue()?.getSyncDiagnostics?.() },
        null,
        2,
      );
      output.focus();
      output.select();
      button.textContent = "诊断已选中，可复制";
    }
  });
  clear();
  return {
    report,
    clear,
    get active() {
      return active;
    },
  };
}
module.exports = { createSyncNotice };
