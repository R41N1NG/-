"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM, VirtualConsole } = require("jsdom");
const vm = require("node:vm");
const { buildUI } = require("../tools/build/ui");
const { createLifecycle } = require("../src/ui/lifecycle");
const { createZeroFloorHost } = require("../src/ui/zero-floor/host");
const { createStages } = require("../src/ui/zero-floor/stages");
const { createChatSync } = require("../src/host/chat-sync/controller");
const { createGame } = require("../src/runtime/game");
const { defaultInit } = require("../src/host/initial-state");
const { syncTargetWorldbook } = require("../src/host/worldbook");
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test("零楼挂载：等待消息出现、隐藏并恢复原文、宿主重绘与销毁", async () => {
  const dom = new JSDOM(
    '<div id="home"><div id="wx-zero-floor" hidden><div data-zero-slot="after"></div></div></div><div id="chat"></div>',
  );
  try {
    const w = dom.window,
      d = w.document,
      life = createLifecycle(w);
    const host = createZeroFloorHost({
      document: d,
      window: w,
      lifecycle: life,
    });
    host.show();
    assert.equal(d.getElementById("wx-zero-floor").hidden, true);
    d.getElementById("chat").innerHTML =
      '<div class="mes" mesid="0"><div class="mes_text">opening <b>preserved</b></div></div>';
    await tick();
    assert.equal(
      d.getElementById("wx-zero-floor").closest(".mes").getAttribute("mesid"),
      "0",
    );
    assert.equal(d.querySelector("[data-wx-opening]").hidden, true);
    const extension = d.createElement("p");
    extension.textContent = "extension";
    const remove = host.registerExtension("demo", extension);
    assert.ok(extension.isConnected);
    remove();
    assert.ok(!extension.isConnected);
    d.querySelector(".mes_text").innerHTML = "rerendered opening";
    await tick();
    assert.equal(d.getElementById("wx-zero-floor").hidden, false);
    host.hide();
    assert.equal(
      d.querySelector(".mes_text").textContent,
      "rerendered opening",
    );
    host.show();
    life.dispose();
    assert.equal(
      d.querySelector(".mes_text").textContent,
      "rerendered opening",
    );
    assert.equal(d.getElementById("wx-zero-floor").parentNode.id, "home");
  } finally {
    dom.window.close();
  }
});
test("零楼步骤注册：允许追加步骤，前置条件阻止越步", () => {
  const dom = new JSDOM(
    '<button id="t1"></button><button id="t2"></button><div id="v1"></div><div id="v2"></div>',
  );
  const life = createLifecycle(dom.window);
  let allowed = false,
    current;
  try {
    const stages = createStages({
      document: dom.window.document,
      lifecycle: life,
      onChange: (id) => (current = id),
    });
    stages.register("first", { viewId: "v1", tabId: "t1" });
    stages.register("extra", {
      viewId: "v2",
      tabId: "t2",
      canEnter: () => allowed,
    });
    stages.go("first");
    assert.equal(stages.go("extra"), false);
    assert.equal(current, "first");
    allowed = true;
    dom.window.document.getElementById("t2").click();
    assert.equal(current, "extra");
    assert.equal(dom.window.document.getElementById("v1").hidden, true);
  } finally {
    life.dispose();
    dom.window.close();
  }
});

test("零楼真实建局：预设、返回、切换缓存、摇号；只确认时同步档案并保存，续局不重建", async () => {
  const { bodyHtml, script } = buildUI({ preview: false, writePreview: false });
  const errors = [],
    vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errors.push(e.message));
  const dom = new JSDOM(
    '<div id="chat"><div class="mes" mesid="0"><div class="mes_text">original opening</div></div></div><div class="trpg">' +
      bodyHtml +
      "</div>",
    {
      url: "https://local.test",
      runScripts: "dangerously",
      pretendToBeVisual: true,
      virtualConsole: vc,
    },
  );
  const store = {},
    state = { game: null, conf: {} },
    wbCalls = [],
    openingCalls = [];
  try {
    const w = dom.window,
      d = w.document;
    w.HTMLCanvasElement.prototype.getContext = () => null;
    w.HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };
    w.HTMLDialogElement.prototype.close = function () {
      this.open = false;
      this.dispatchEvent(new w.Event("close"));
    };
    w.getVariables = async () => JSON.parse(JSON.stringify(store));
    w.SillyTavern = { getContext: () => ({ characterId: 1, chatId: "zero" }) };
    const sync = createChatSync({
      state,
      vars: {
        read: w.getVariables,
        assign: async (patch) => Object.assign(store, patch),
      },
      readContext: () => ({ scope: "test-zero", history: [] }),
      createGame,
      defaultInit,
      syncTargetWorldbook: async (id) => {
        wbCalls.push(id);
        return { ok: true };
      },
      applyTargetOpening: async (id) => {
        openingCalls.push(id);
        d.querySelector(".mes_text").innerHTML = "chosen opening";
        return { ok: true };
      },
      publishSnapshot: (snap) => {
        if (snap) w.WxStatusbar.render(snap);
      },
    });
    w.WxGlue = { newGame: sync.newGame };
    vm.runInContext(script, dom.getInternalVMContext());
    w.WxStatusbarUI.mountStatusbar(d, w);
    await tick();
    assert.equal(
      d.getElementById("wx-zero-floor").closest(".mes").getAttribute("mesid"),
      "0",
    );
    assert.equal(d.querySelector("dialog#wx-zero-floor"), null);
    d.querySelector("#quickPane button").click();
    d.getElementById("zeroNextStep").click();
    const name = d.getElementById("tDetailRealName").textContent;
    d.querySelector('[data-tid="ol"]').click();
    d.querySelector('[data-tid="college"]').click();
    assert.equal(d.getElementById("tDetailRealName").textContent, name);
    d.getElementById("zeroPrevStep").click();
    d.getElementById("zeroNextStep").click();
    assert.equal(d.getElementById("tDetailRealName").textContent, name);
    assert.deepEqual(wbCalls, []);
    assert.equal(store.wx_save, undefined);
    d.getElementById("tDetailReroll").click();
    const confirmedName = d.getElementById("tDetailRealName").textContent;
    d.getElementById("createConfirm").click();
    assert.equal(d.getElementById("zeroStep3").hidden, false);
    assert.equal(store.wx_save, undefined, "简报浏览不提前建局");
    assert.deepEqual(wbCalls, []);
    assert.equal(
      d.getElementById("trainingBriefTarget").textContent,
      "独居女大学生",
    );
    d.getElementById("trainingBriefBack").click();
    assert.equal(
      d.getElementById("tDetailRealName").textContent,
      confirmedName,
    );
    d.querySelector('[data-tid="ol"]').click();
    d.getElementById("createConfirm").click();
    assert.equal(
      d.getElementById("trainingBriefTarget").textContent,
      "疲惫的OL",
    );
    d.getElementById("trainingBriefBack").click();
    d.querySelector('[data-tid="college"]').click();
    d.getElementById("createConfirm").click();
    d.querySelector('[data-training-page="3"]').click();
    d.querySelector('[data-training-select="scan"]').click();
    d.querySelector("[data-training-send]").click();
    d.getElementById("wx-settle-dialog").close();
    assert.equal(store.wx_save, undefined, "教学示范不提前写正式存档");
    d.getElementById("trainingBriefNext").click();
    assert.equal(d.getElementById("trainingBriefStart").hidden, false);
    const realNewGame = w.WxGlue.newGame;
    w.WxGlue.newGame = async () => {
      throw Object.assign(Error("测试：保存暂不可用"), {
        code: "WRITE_FAILED",
      });
    };
    d.getElementById("trainingBriefStart").click();
    await tick();
    assert.equal(store.wx_save, undefined);
    assert.equal(d.getElementById("zeroStep3").hidden, false);
    assert.equal(d.getElementById("trainingBriefStart").disabled, false);
    assert.ok(
      d
        .getElementById("trainingBriefNotice")
        .textContent.includes("当前选择已保留"),
    );
    assert.equal(
      d.getElementById("tDetailRealName").textContent,
      confirmedName,
    );
    w.WxGlue.newGame = realNewGame;
    d.getElementById("trainingBriefStart").click();
    d.getElementById("trainingBriefStart").click();
    assert.equal(d.getElementById("trainingBriefStart").disabled, true);
    for (let i = 0; i < 20 && !store.wx_save; i++) await tick();
    assert.ok(store.wx_save);
    assert.equal(store.wx_save.floor, 0);
    assert.equal(store.wx_save.ledgerState.pi, 0, "示范 PI 不得进入正式存档");
    assert.equal(store.wx_save.targetPersona.name, confirmedName);
    assert.equal(store.wx_save.targetPersona.generatorVersion, 1);
    assert.deepEqual(wbCalls, ["college"]);
    assert.deepEqual(openingCalls, ["college"]);
    d.getElementById("trainingBriefStart").click();
    await tick();
    assert.deepEqual(wbCalls, ["college"], "载入成功后旧按钮不能重复重建局");
    assert.equal(d.querySelectorAll("#chat .mes").length, 1);
    assert.equal(d.querySelector(".mes_text").textContent, "chosen opening");
    assert.equal(d.getElementById("wx-zero-floor").hidden, true);
    w.WxStatusbarUI.mountStatusbar(d, w);
    await tick();
    assert.equal(d.getElementById("wx-zero-floor").hidden, true);
    assert.deepEqual(wbCalls, ["college"]);
    assert.deepEqual(errors, []);
    w.WxStatusbar.reset();
    d.querySelector("#quickPane button").click();
    d.getElementById("zeroNextStep").click();
    assert.equal(
      d.getElementById("zeroStep2").hidden,
      false,
      "重挂载后创角按钮仍可用",
    );
    w.WxStatusbar.dispose();
    sync.dispose();
  } finally {
    dom.window.close();
  }
});

test("目标条目切换：机器标识扩展、关闭其他条目、保留普通条目，缺条目不残留旧档案", async () => {
  let entries = [
      {
        name: "【目标档案】A",
        content: "[TARGET_GROUP: college]",
        enabled: false,
        constant: false,
        disable: true,
      },
      {
        name: "【目标档案】B",
        content: "[TARGET_GROUP: ol]",
        enabled: true,
        constant: true,
        disable: false,
      },
      { name: "ordinary", enabled: true },
    ],
    writes = 0;
  globalThis.TavernHelper = {
    getCharWorldbookNames: async () => ({ primary: "test" }),
    getWorldbook: async () => entries,
    replaceWorldbook: async (_, next) => {
      entries = next;
      writes++;
    },
  };
  try {
    assert.equal((await syncTargetWorldbook("college")).ok, true);
    assert.equal(entries[0].enabled, true);
    assert.equal(entries[0].constant, true);
    assert.equal(entries[0].disable, false);
    assert.equal(entries[1].enabled, false);
    assert.equal(entries[1].constant, false);
    assert.equal(entries[1].disable, true);
    assert.equal(entries[2].enabled, true);
    assert.equal((await syncTargetWorldbook("police")).targetMissing, true);
    assert.equal(entries[0].enabled, false);
    assert.equal(entries[1].enabled, false);
    assert.equal(entries[2].enabled, true);
    assert.equal((await syncTargetWorldbook("ol")).ok, true);
    assert.equal(entries[1].enabled, true);
    assert.equal(entries[0].enabled, false);
    const n = writes;
    await syncTargetWorldbook("ol");
    assert.equal(writes, n, "相同状态不重复写书");
  } finally {
    delete globalThis.TavernHelper;
  }
});

test("PPT 首页：公开地理图解不读取隐私或伪造定位，浏览和切换不触发建局", () => {
  const {
    createTrainingBrief,
  } = require("../src/ui/zero-floor/training-brief");
  const dom = new JSDOM(buildUI({ writePreview: false }).template);
  const d = dom.window.document,
    life = createLifecycle(dom.window);
  let calls = 0;
  try {
    const brief = createTrainingBrief({
      document: d,
      lifecycle: life,
      onBack: () => calls++,
      onStart: () => calls++,
    });
    const secret = "不能出现的目标住址";
    const selection = {
      identity: { name: "阿宅" },
      target: {
        name: "独居女大学生",
        home: secret,
        route: { nodes: [secret] },
        stats: { per: 99 },
      },
    };
    const before = JSON.stringify(selection);
    brief.setSelection(selection);
    const diagram = d.getElementById("trainingBriefDiagram");
    const drawing = diagram.innerHTML;
    assert.ok(diagram.querySelector('img[src^="data:image/png"]'));
    assert.ok(diagram.querySelector(".training-shot-mark"));
    assert.ok(diagram.querySelector("img").alt.includes("map-visible"));
    assert.ok(
      d
        .getElementById("zeroStep3")
        .textContent.includes("教学示意，非实时定位"),
    );
    assert.equal(
      diagram.querySelector(
        "button, a, [tabindex], .wx-map-player, .wx-map-target",
      ),
      null,
    );
    assert.equal(
      d.getElementById("zeroStep3").textContent.includes(secret),
      false,
    );
    diagram
      .querySelector("img")
      .dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    brief.setSelection({
      identity: { name: "学生" },
      target: { name: "疲惫的OL" },
    });
    assert.equal(diagram.innerHTML, drawing, "示例地图不能随目标隐藏路线改变");
    assert.equal(
      d.getElementById("trainingBriefTarget").textContent,
      "疲惫的OL",
    );
    assert.equal(JSON.stringify(selection), before);
    assert.equal(calls, 0);
  } finally {
    life.dispose();
    dom.window.close();
  }
});
