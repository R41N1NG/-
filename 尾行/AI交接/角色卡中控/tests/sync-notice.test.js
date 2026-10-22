"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const { createSyncNotice } = require("../src/ui/sync-notice.js");
const { createLifecycle } = require("../src/ui/lifecycle.js");
function ui(reconcile, acceptCurrentSave) {
  const dom = new JSDOM(
    '<div id="wxSyncNotice" hidden></div><div class="mes" mesid="0">opening</div>',
  );
  const lifecycle = createLifecycle(dom.window);
  const notice = createSyncNotice({
    document: dom.window.document,
    lifecycle,
    getGlue: () => ({ reconcile, acceptCurrentSave }),
  });
  return {
    dom,
    lifecycle,
    notice,
    element: dom.window.document.getElementById("wxSyncNotice"),
  };
}
const tick = () => new Promise((resolve) => setImmediate(resolve));

test("同步提示可定位第 0 楼、高亮并导出不含正文的诊断", () => {
  const u = ui(async () => {});
  try {
    const floor = u.dom.window.document.querySelector(".mes");
    let scrolled = false;
    floor.scrollIntoView = () => {
      scrolled = true;
    };
    u.notice.report({
      code: "HISTORY_OUTSIDE_WINDOW",
      location: { index: 0, messageId: 0, kind: "changed" },
      text: "secret",
    });
    assert.match(u.element.textContent, /聊天第 0 楼/);
    assert.match(u.element.textContent, /HISTORY_OUTSIDE_WINDOW/);
    u.element.querySelector('[data-sync-action="locate"]').click();
    assert.equal(scrolled, true);
    assert.ok(floor.classList.contains("wx-sync-floor"));
    u.element.querySelector('[data-sync-action="copy"]').click();
    const copy = u.element.querySelector("textarea").value;
    assert.equal(JSON.parse(copy).location.index, 0);
    assert.ok(!copy.includes("secret"));
  } finally {
    u.lifecycle.dispose();
    u.dom.window.close();
  }
});

test("重新校验失败保留新的原因；只有成功才清理提示", async () => {
  let fail = true;
  const u = ui(async () => {
    if (fail) throw Object.assign(Error(), { code: "READ_FAILED" });
  });
  try {
    u.notice.report({
      code: "HISTORY_OUTSIDE_WINDOW",
      location: { index: 3, kind: "missing" },
    });
    assert.equal(u.element.querySelector('[data-sync-action="locate"]'), null);
    u.element.querySelector('[data-sync-action="retry"]').click();
    await tick();
    assert.equal(u.element.hidden, false);
    assert.match(u.element.textContent, /READ_FAILED/);
    assert.match(u.element.textContent, /无法确定具体聊天楼层/);
    fail = false;
    u.element.querySelector('[data-sync-action="retry"]').click();
    await tick();
    assert.equal(u.element.hidden, true);
  } finally {
    u.lifecycle.dispose();
    u.dom.window.close();
  }
});

test("旧的重试请求迟到不得清除较新的错误提示", async () => {
  let resolve;
  const u = ui(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  try {
    u.notice.report("READ_FAILED");
    u.element.querySelector('[data-sync-action="retry"]').click();
    u.notice.report({
      code: "HISTORY_OUTSIDE_WINDOW",
      location: { index: 7, messageId: 7 },
    });
    resolve();
    await tick();
    assert.equal(u.element.hidden, false);
    assert.match(u.element.textContent, /聊天第 7 楼/);
  } finally {
    u.lifecycle.dispose();
    u.dom.window.close();
  }
});

test("保留当前进度必须二次确认，取消不执行恢复", async () => {
  let calls = 0;
  const u = ui(
    async () => {},
    async (options) => {
      assert.equal(options.confirm, true);
      assert.equal(options.expectedEpoch, 42);
      calls++;
    },
  );
  try {
    u.notice.report({
      code: "HISTORY_OUTSIDE_WINDOW",
      sessionEpoch: 42,
      location: { index: 0, messageId: 0 },
    });
    u.element.querySelector('[data-sync-action="rebase"]').click();
    assert.match(u.element.textContent, /更早的聊天改动不会补算/);
    assert.equal(calls, 0);
    u.element.querySelector('[data-sync-action="cancel-rebase"]').click();
    assert.equal(calls, 0);
    assert.equal(
      u.element.querySelector('[data-sync-action="confirm-rebase"]'),
      null,
    );
    u.element.querySelector('[data-sync-action="rebase"]').click();
    u.element.querySelector('[data-sync-action="confirm-rebase"]').click();
    await tick();
    assert.equal(calls, 1);
    assert.equal(u.element.hidden, true);
  } finally {
    u.lifecycle.dispose();
    u.dom.window.close();
  }
});
