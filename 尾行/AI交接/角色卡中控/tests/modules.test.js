"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const acorn = require("acorn");
const { createGame } = require("../src/runtime/game.js");
const legacy = require("./fixtures/legacy-v1.json");
const clone = (value) => JSON.parse(JSON.stringify(value));

test("旧 v1 存档迁移到 v2，保留账目、装备与数值动作随机流", () => {
  const game = createGame({ saved: clone(legacy.save) });
  const upgraded = game.save();
  assert.equal(upgraded.v, 2);
  assert.equal(upgraded.rngVersion, 1);
  for (const key of ["ledgerState", "inventory", "album", "targetBase", "floor", "route"]) assert.deepEqual(clone(upgraded[key]), legacy.save[key], key);
  const result = game.settleInput(legacy.input.text, legacy.input.options);
  assert.deepEqual(result.actions.map(a => [a.id, a.d20, a.total, a.band]), legacy.next.actions.map(a => [a.id, a.d20, a.total, a.band]));
  // 新规则取消逐动作PI；旧档骰流与其余账目保持兼容。
  assert.deepEqual(clone(game.save().ledgerState), {...legacy.nextSave.ledgerState, pi:legacy.save.ledgerState.pi, stamina: legacy.nextSave.ledgerState.stamina - 4});
});

test("模块实例隔离：行囊、账本、模式与快照不跨实例共享", () => {
  const a = createGame({ sessionSalt: "instance-A" });
  const b = createGame({ sessionSalt: "instance-B" });
  const before = clone(b.save());
  a.addItem("bento", 2);
  a.gmSet({ cash: -100 });
  a.settleInput("", { actions: [] });
  assert.deepEqual(clone(b.save()), before);
  assert.notEqual(a.ledger, b.ledger);
});

test("依赖边界：源码无循环依赖，运行时不导入 UI/宿主，UI 不导入引擎/宿主", () => {
  const root = path.resolve(__dirname, "../src");
  const graph = new Map();
  function visit(file) {
    if (graph.has(file)) return;
    const deps = [];
    graph.set(file, deps);
    const ast = acorn.parse(fs.readFileSync(file, "utf8"), {
      ecmaVersion: "latest",
    });
    function walk(node) {
      if (!node || typeof node !== "object") return;
      if (
        node.type === "CallExpression" &&
        node.callee.type === "Identifier" &&
        node.callee.name === "require"
      ) {
        const id = node.arguments[0]?.value;
        if (typeof id === "string" && id.startsWith(".")) {
          let target = path.resolve(path.dirname(file), id);
          if (!path.extname(target)) target += ".js";
          if (target.endsWith(".js")) deps.push(target);
          const from = path.relative(root, file),
            to = path.relative(root, target);
          if (from.startsWith("runtime/"))
            assert.ok(!/^(host|ui)\//.test(to), `${from} → ${to}`);
          if (from.startsWith("ui/"))
            assert.ok(!/^(host|runtime)\//.test(to), `${from} → ${to}`);
        }
      }
      for (const value of Object.values(node)) {
        if (Array.isArray(value)) value.forEach(walk);
        else if (value && typeof value === "object") walk(value);
      }
    }
    walk(ast);
    deps.forEach(visit);
  }
  function scan(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) scan(file);
      else if (entry.name.endsWith(".js")) visit(file);
    }
  }
  scan(root);
  const done = new Set(),
    active = new Set();
  function check(file) {
    assert.ok(!active.has(file), `循环依赖：${path.relative(root, file)}`);
    if (done.has(file)) return;
    active.add(file);
    for (const target of graph.get(file) || []) check(target);
    active.delete(file);
    done.add(file);
  }
  for (const file of graph.keys()) check(file);
});
