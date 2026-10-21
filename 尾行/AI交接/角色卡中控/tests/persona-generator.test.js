"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { generateTargetPersona } = require("../src/persona/generator");
const {
  validatePersona,
  normalizePersona,
} = require("../src/contracts/persona");
const { pickCandidate } = require("../src/persona/candidates");
const { createGame } = require("../src/runtime/game");
const TS = require("../src/runtime/target_state");
const R = require("../src/config/rules.json");

test("人物生成：同种子完整复现，各结果独立，不依赖 Math.random", () => {
  const random = Math.random;
  try {
    Math.random = () => {
      throw new Error("unexpected entropy");
    };
    const a = generateTargetPersona("college", { seed: "reproduce" });
    const b = generateTargetPersona("college", { seed: "reproduce" });
    assert.deepEqual(a, b);
    a.assignedFacts[0].id = "mutated";
    assert.notEqual(a.assignedFacts[0].id, b.assignedFacts[0].id);
    assert.equal(b.generatorVersion, 1);
    assert.equal(b.assignedFacts.length, 18);
  } finally {
    Math.random = random;
  }
});
test("人物生成：所有目标多种子符合契约，完整人物保存恢复不重抽", () => {
  for (const id of Object.keys(R.targets.list))
    for (let seed = 0; seed < 30; seed++) {
      const p = generateTargetPersona(id, { seed: String(seed) });
      validatePersona(p, id, { complete: true });
      const before = JSON.parse(JSON.stringify(p));
      const g = createGame({
        targetId: id,
        targetPersona: p,
        sessionSalt: "separate-engine-salt",
      });
      assert.deepEqual(p, before, "引擎不得修改预览对象");
      assert.deepEqual(g.save().targetPersona, p);
      assert.deepEqual(createGame({ saved: g.save() }).save().targetPersona, p);
    }
});
test("旧画像：中文名称、ID 和对象性格统一；日程消费者一致", () => {
  for (let seed = 0; seed < 100; seed++) {
    const a = {
      personality: "胆小",
      personalityId: "timid",
      finalStats: { social: 1 },
    };
    const b = { ...a, personality: "timid" };
    assert.equal(
      TS.resolveSaturdayRoutine({}, a, seed),
      TS.resolveSaturdayRoutine({}, b, seed),
    );
  }
  assert.equal(
    normalizePersona({ personality: "清冷" }).personalityId,
    "aloof",
  );
  assert.equal(
    normalizePersona({ personality: { id: "timid" } }).personalityId,
    "timid",
  );
});
test("人物校验：非法数值、引用、版本及类型错配提前拒绝", () => {
  const p = generateTargetPersona("college", { seed: "validate" });
  for (const mutate of [
    (x) => {
      x.finalStats.str = NaN;
    },
    (x) => {
      x.shoeId = "missing";
    },
    (x) => {
      x.generatorVersion = 99;
    },
    (x) => {
      x.assignedFacts[0].id = "missing";
    },
    (x) => {
      x.factSummary.home = "missing";
    },
    (x) => {
      x.targetId = "ol";
    },
    (x) => {
      x.hair = "missing";
    },
  ]) {
    const x = JSON.parse(JSON.stringify(p));
    mutate(x);
    assert.throws(() => validatePersona(x, "college", { complete: true }), {
      code: "PERSONA_INVALID",
    });
  }
  assert.throws(
    () => generateTargetPersona("missing", { seed: "a" }),
    /未知目标/,
  );
  assert.throws(
    () => generateTargetPersona("college", { version: 99 }),
    /版本/,
  );
});
test("候选约束：禁用、零权重、互斥与前置条件；空池明确报错", () => {
  const pool = [
    { id: "disabled", enabled: false },
    { id: "zero", weight: 0 },
    { id: "requires", requires: { personalityId: ["timid"] } },
    { id: "excluded", excludes: { targetId: "college" } },
  ];
  for (let seed = 0; seed < 100; seed++)
    assert.equal(
      pickCandidate(pool, seed, "test", {
        targetId: "college",
        personalityId: "timid",
      }).id,
      "requires",
    );
  assert.throws(() => pickCandidate([], 1, "empty"), /候选池为空/);
  assert.throws(
    () => pickCandidate([{ id: "bad", weight: -1 }], 1, "bad"),
    /权重无效/,
  );
  assert.throws(
    () =>
      pickCandidate(pool, 1, "none", {
        targetId: "college",
        personalityId: "aloof",
      }),
    /无可用候选/,
  );
});
