"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const { waitForSettlement } = require("../tools/build/settlement-capture");
const action = { d20: 16, dc: 13, total: 22, attr: { v: 5 }, mods: [{ v: 1 }] };
const complete = {
  open: true,
  hud: "RESULT LOCKED: [ 16 ] · CHECK FINISHED",
  math: "1d20(16) +6修正 = 22 vs DC 13",
  chips: ["敏捷属性+5", "不起眼+1"],
  ledger: ["体力消耗-4", "近距离暴露8 − 敏捷1 = +7"],
};
function browser(state) {
  return {
    evaluate: async (expression) => expression.startsWith("({hud:") ? {hud:state.hud, chips:state.chips.length, ledger:structuredClone(state.ledger)} : structuredClone(state),
    delay: async () => {},
  };
}
test("旧锁定文字但筹码为空时不得作为完成图片保存", async () => {
  await assert.rejects(
    waitForSettlement(browser({ ...complete, chips: [] }), action, {
      timeoutMs: 0,
    }),
    /禁止保存/,
  );
});
test("动画注入中或仍是等待占位账目时必须失败", async () => {
  for (const state of [
    { ...complete, hud: "INJECTING MODIFIERS …" },
    { ...complete, ledger: ["筹码注入中，等待定格 …"] },
  ])
    await assert.rejects(
      waitForSettlement(browser(state), action, { timeoutMs: 0 }),
      /禁止保存/,
    );
});
test("上一组骰点和DC不能冒充当前组，即使筹码行数相同", async () => {
  await assert.rejects(
    waitForSettlement(browser({ ...complete, math: "22 vs DC 15" }), action, {
      timeoutMs: 0,
    }),
    /禁止保存/,
  );
});
test("筹码、骰点、总值、DC与实际账目均完成才返回拍摄凭据", async () => {
  const b = browser(complete),
    result = await waitForSettlement(b, action);
  assert.equal(result.complete, true);
  assert.deepEqual(result.chips, ["敏捷属性+5", "不起眼+1"]);
  assert.ok(result.ledger.some((s) => s.includes("= +7")));
});
