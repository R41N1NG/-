"use strict";
// build-statusbar.js - 整合构建：引擎(dist/runtime.js) + 原生状态栏(src/ui 模块编译) → dist/wx-statusbar.user.js
// 产物是「一条粘完即用」的酒馆助手脚本：
//   - 纯原生 DOM 无 iframe、无滑块、无视口裁切
//   - 直接嵌入输入栏容器 #form_sheld（位于 #send_form 正上方）
//   - 心跳仪表盘向上弹出为悬浮子菜单、详情抽屉向上平滑滑出
//   - 数据流：LLM 生成结束 → 引擎结算 → wx_snap → 原生 DOM 自动刷新。
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const VERSION = require("./package.json").version;

function buildStatusbar() {
  const runtime = fs.readFileSync(
    path.join(ROOT, "dist", "runtime.js"),
    "utf8",
  );
  const { buildUI } = require("./tools/build/ui.js");
  buildUI();
  const { css, bodyHtml, script } = buildUI({
    preview: false,
    writePreview: false,
  });

  const out = `/*!
 * 尾行 · 酒馆助手整合脚本 v${VERSION}（引擎＋胶水＋原生嵌入状态栏，一条粘完即用）
 * 安装：酒馆助手 → 脚本 → 角色卡脚本 → 新建 → 粘贴本文件全文 → 启用。
 * 嵌入特性：纯原生 DOM 无 iframe、无滑块、直接嵌入输入栏 #form_sheld，心跳卡片与抽屉向上弹出不遮挡输入。
 */
${runtime}
${script}
;(function mountWxStatusbar() {
  var tries = 0;
  (function wait() {
    var engine = window.WxEngine;
    if (engine && engine.glue && typeof engine.glue.then === "function") {
      engine.glue.then(function(result) { if (result && result.ok) mount(); }).catch(function(error) { console.error("[CHAT_SYNC:MOUNT_FAILED]", error); });
      return;
    }
    if (window.WxGlue) return mount();
    if (++tries < 20) setTimeout(wait, 200);
  })();

  function mount() {
    var sameWin = !(window.parent && window.parent !== window);
    var topDoc = sameWin ? document : window.parent.document;
    var topWin = sameWin ? window : window.parent;

    var formSheld = topDoc.getElementById("form_sheld");
    var sendForm = topDoc.getElementById("send_form");
    var chat = topDoc.querySelector("#chat");
    if (!formSheld && !sendForm && !chat) {
      if (++tries < 30) setTimeout(mount, 250);
      return;
    }

    // 1. 注入或刷新 CSS 到父页面 head
    var styleEl = topDoc.getElementById("wx-statusbar-style");
    if (!styleEl) {
      styleEl = topDoc.createElement("style");
      styleEl.id = "wx-statusbar-style";
      topDoc.head.appendChild(styleEl);
    }
    styleEl.textContent = ${JSON.stringify(css)};

    // 2. 支持热更新替换（若已有旧状态栏则安全清理，无需刷新酒馆整页即可立即生效）
    topWin.WxStatusbar?.dispose?.();
    var oldRoot = topDoc.getElementById("wx-statusbar-root");
    if (oldRoot && oldRoot.parentNode) oldRoot.parentNode.removeChild(oldRoot);
    var oldModals = topDoc.getElementById("wx-modals-root");
    if (oldModals && oldModals.parentNode) oldModals.parentNode.removeChild(oldModals);

    // 3. 创建主状态栏 DOM 并嵌入输入栏
    var root = topDoc.createElement("div");
    root.id = "wx-statusbar-root";
    root.className = "trpg";
    root.innerHTML = ${JSON.stringify(bodyHtml)};

    if (sendForm && sendForm.parentNode) {
      sendForm.parentNode.insertBefore(root, sendForm);
    } else if (formSheld) {
      formSheld.insertBefore(root, formSheld.firstChild);
    } else if (chat && chat.parentNode) {
      chat.parentNode.insertBefore(root, chat.nextSibling);
    } else {
      topDoc.body.appendChild(root);
    }

    // 提升全部原生模态对话框（战术终端、档案、谎账、追缉、设备、道具）至独立容器，确保作用域干净
    var modalsRoot = topDoc.createElement("div");
    modalsRoot.id = "wx-modals-root";
    modalsRoot.className = "trpg";
    topDoc.body.appendChild(modalsRoot);

    root.querySelectorAll("dialog").forEach(function(d) {
      d.classList.add("wx-dialog", "trpg");
      modalsRoot.appendChild(d);
    });

    // 3. 运行状态栏 HUD 逻辑（利用参数阴影将 document 与 window 绑定到 topDoc 与 topWin）
    try {
      var mounted = WxStatusbarUI.mountStatusbar(topDoc, topWin);
      window.addEventListener("pagehide", function() { mounted.dispose(); }, { once: true });
    } catch (e) {
      console.error("[尾行状态栏] 初始化异常:", e);
    }

    // 快照监听由 UI lifecycle 管理，热更新时随实例清理。
  }
})();
`;

  const OUT = path.join(ROOT, "dist", "wx-statusbar.user.js");
  const safe = out.replace(/<\/script/gi, "<\\/script");
  fs.writeFileSync(OUT, safe, "utf8");
  for (const must of [
    "WxEngine",
    "WxGlue",
    "mountWxStatusbar",
    "wx-statusbar-root",
    "renderSnapshot",
    "wx_snap",
    "wx-zero-floor",
    "IDENTITY_DATA",
    "zeroFloorInit",
    "newGame",
  ]) {
    if (!safe.includes(must)) throw Error("整合断言失败：产物缺少 " + must);
  }
  if (/<\/script/.test(safe)) throw Error("防截断转义遗漏");
  console.log(
    "dist/wx-statusbar.user.js 构建通过：" +
      (safe.length / 1024).toFixed(1) +
      " KB（原生 DOM 嵌入版，含防截断转义）",
  );
  return safe;
}

if (require.main === module) {
  buildStatusbar();
}

module.exports = { buildStatusbar };
