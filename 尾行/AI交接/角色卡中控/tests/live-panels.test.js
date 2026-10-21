"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm");
const { JSDOM, VirtualConsole } = require("jsdom");
const { buildUI } = require("../tools/build/ui");
const { createGame } = require("../src/runtime/game");
const { generateTargetPersona } = require("../src/persona/generator");
const F = require("../src/runtime/facts");
const clone = (x) => JSON.parse(JSON.stringify(x));
test("正式模板与脚本没有旧OL档案、假情报、假设备位置和预览档案脚本", () => {
  const { bodyHtml, script } = buildUI({ preview: false, writePreview: false });
  for (const text of [
    "#OL-01",
    "青柳街便利店",
    "22:41 更新",
    "卧室 · 22:47",
    "今晚在便利店买了两盒便当",
    "HER_PROFILE",
  ]) {
    assert.ok(!bodyHtml.includes(text), text);
    assert.ok(!script.includes(text), text);
  }
  const dom = new JSDOM(bodyHtml);
  try {
    const d = dom.window.document;
    assert.deepEqual(
      [...d.querySelectorAll("#pattrs .av")].map((x) => x.textContent),
      ["？", "？", "？", "？"],
    );
    assert.equal(d.querySelector("#cash").textContent, "—");
    assert.ok(!d.querySelector("#devicesBody").textContent.includes("在线"));
    assert.equal(d.querySelectorAll("#wx-items li").length, 0);
  } finally {
    dom.window.close();
  }
});
test("档案投影沿用现有情报资格，未实现属性揭示保持未知，不合成观察事件", () => {
  const persona = generateTargetPersona("college", { seed: "profile-budget" });
  for (const pi of [0, 20, 100]) {
    const g = createGame({
      targetId: "college",
      targetPersona: persona,
      stats: { pi },
      sessionSalt: "profile",
    });
    const snap = g.snapshot();
    assert.equal(snap.profile.targetId, "college");
    assert.deepEqual(snap.profile.attrs, {});
    assert.deepEqual(
      snap.profile.facts,
      F.view("college", {
        pi,
        assignedFacts: persona.assignedFacts,
        tickets: [],
      }).facts,
    );
    assert.ok(
      snap.profile.facts.length < persona.assignedFacts.length,
      "没有成功观察凭据，不能直出全部事实",
    );
    assert.deepEqual(snap.signal, []);
    assert.deepEqual(
      createGame({ saved: g.save() }).snapshot().profile,
      snap.profile,
    );
  }
});
test("正式UI真实数据更新、道具说明、无引擎拒绝模拟、换目标和重开清理", async () => {
  const { bodyHtml, script } = buildUI({ preview: false, writePreview: false });
  const errors = [],
    vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errors.push(e.message));
  const dom = new JSDOM('<div class="trpg">' + bodyHtml + "</div>", {
    url: "https://local.test",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole: vc,
  });
  try {
    const w = dom.window,
      d = w.document;
    w.HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };
    w.HTMLDialogElement.prototype.close = function () {
      this.open = false;
    };
    vm.runInContext(script, dom.getInternalVMContext());
    w.WxStatusbarUI.mountStatusbar(d, w);
    const snap = createGame({
      targetId: "college",
      targetPersona: generateTargetPersona("college", { seed: "live" }),
      sessionSalt: "live",
    }).snapshot();
    snap.profile = {
      targetId: "college",
      attrs: { per: 6 },
      facts: [{ title: "已确认", text: "来自当前记录" }],
      impressions: ["已记录印象"],
    };
    snap.inventory = [
      {
        id: "custom",
        name: "真实道具",
        count: 3,
        desc: "当前道具说明",
        type: "misc",
      },
      { id: "bento", name: "便当", count: 1, canUse: true },
    ];
    w.WxStatusbar.render(snap);
    assert.ok(
      d.getElementById("vfTarget").textContent.includes(snap.target.realName),
    );
    assert.deepEqual(
      [...d.querySelectorAll("#pattrs .av")].map((x) => x.textContent),
      ["？", "？", "6", "？"],
    );
    assert.ok(
      d.getElementById("profileBody").textContent.includes("来自当前记录"),
    );
    d.querySelector('[data-wx-item="custom"]').click();
    assert.equal(
      d.getElementById("item-description").textContent,
      "当前道具说明",
    );
    assert.equal(d.getElementById("itemMeta").textContent, "持有数量：3");
    const before = clone(snap);
    d.querySelector('[data-item-action="use"]').click();
    await new Promise((r) => setTimeout(r, 0));
    assert.deepEqual(
      snap,
      before,
      "生产环境无命令接口时不得本地扣物品或加体力",
    );
    assert.equal(d.getElementById("wxSyncNotice").hidden, false);
    const next = clone(snap);
    next.target.id = "ol";
    next.target.realName = "另一个角色";
    next.route = null;
    w.WxStatusbar.render(next);
    assert.equal(
      d.getElementById("profileBody").textContent,
      "暂无已解锁情报",
      "错配的档案投影必须丢弃",
    );
    assert.deepEqual(
      [...d.querySelectorAll("#pattrs .av")].map((x) => x.textContent),
      ["？", "？", "？", "？"],
    );
    w.WxStatusbar.reset();
    assert.equal(d.getElementById("vfTarget").textContent, "尚未选择目标");
    assert.equal(d.getElementById("cash").textContent, "—");
    assert.equal(d.querySelectorAll("#wx-items li").length, 0);
    assert.equal(d.querySelectorAll("#signal li").length, 0);
    assert.equal(d.getElementById("item-description").textContent, "");
    assert.equal(
      d.getElementById("profileSchedule").textContent,
      "暂无已探明日程",
    );
    assert.ok(!d.getElementById("devicesBody").textContent.includes("在线"));
    assert.deepEqual(errors, []);
    w.WxStatusbar.dispose();
  } finally {
    dom.window.close();
  }
});
