"use strict";
// tests/inventory.test.js - 战术行囊系统单测
// 覆盖：物品真源、阿宅开局器材入包、工具槽互斥、装备标签栈联动、消耗品结算与限制、存档无损往返
const test = require("node:test");
const assert = require("node:assert/strict");
const { createGame } = require("../src/runtime/game.js");
const R = require("../src/config/rules.json");

test("战术行囊 · 物品真源与器材注册完整性", () => {
  assert.ok(R.items, "rules.json 必须定义 items 节点");
  assert.ok(R.items.lockpick, "开锁工具必须存在");
  assert.equal(R.items.lockpick.slot, "tool");
  assert.ok(R.items.climb_gear, "攀爬套装必须存在");
  assert.equal(R.items.climb_gear.slot, "tool");
  assert.ok(R.items.cam_storage, "针孔摄像机(存储档)必须存在");
  assert.ok(R.items.energy_drink, "能量饮料必须存在");

  // 装备标签在 tags 字典中必须已注册（严禁口头黑户）
  assert.ok(R.tags.lockpick_gear, "开锁装备标签必须注册");
  assert.ok(R.tags.climb_steady, "攀爬装备标签必须注册");
  assert.ok(R.tags.disguise_delivery, "外卖伪装标签必须注册");
});

test("战术行囊 · 阿宅开局自带针孔摄像机入包", () => {
  const game = createGame({ identity: "otaku" });
  const snap = game.snapshot();
  assert.equal(snap.identity.id, "otaku");
  assert.ok(Array.isArray(snap.inventory), "快照必须包含 inventory 数组");
  assert.equal(snap.inventory.length, 1);
  const cam = snap.inventory[0];
  assert.equal(cam.id, "cam_storage");
  assert.equal(cam.count, 1);
  assert.equal(cam.equipped, false);
});

test("战术行囊 · 普通身份开局背包默认空", () => {
  const game = createGame({ identity: "student" });
  const snap = game.snapshot();
  assert.ok(Array.isArray(snap.inventory));
  assert.equal(snap.inventory.length, 0);
});

test("战术行囊 · 物品添加与扣减管理", () => {
  const game = createGame();
  game.addItem("bento", 2);
  let snap = game.snapshot();
  let bento = snap.inventory.find(i => i.id === "bento");
  assert.ok(bento);
  assert.equal(bento.count, 2);

  game.removeItem("bento", 1);
  snap = game.snapshot();
  bento = snap.inventory.find(i => i.id === "bento");
  assert.equal(bento.count, 1);

  game.removeItem("bento", 1);
  snap = game.snapshot();
  assert.equal(snap.inventory.find(i => i.id === "bento"), undefined);
});

test("战术行囊 · 工具槽位互斥装备与标签栈挂摘联动", () => {
  const game = createGame();
  game.addItem("lockpick", 1);
  game.addItem("climb_gear", 1);

  // 1. 装备开锁工具
  const res1 = game.equipItem("lockpick");
  assert.equal(res1.ok, true);
  let snap = game.snapshot();
  let lockpick = snap.inventory.find(i => i.id === "lockpick");
  let climb = snap.inventory.find(i => i.id === "climb_gear");
  assert.equal(lockpick.equipped, true);
  assert.equal(climb.equipped, false);
  assert.ok(snap.tags.some(t => t.name === "开锁工具在手"), "装备开锁工具后必须挂载 [开锁工具在手] 标签");

  // 2. 装备攀爬套装（同为 tool 槽位，互斥自动卸下开锁工具）
  const res2 = game.equipItem("climb_gear");
  assert.equal(res2.ok, true);
  snap = game.snapshot();
  lockpick = snap.inventory.find(i => i.id === "lockpick");
  climb = snap.inventory.find(i => i.id === "climb_gear");
  assert.equal(lockpick.equipped, false, "开锁工具应被自动卸下");
  assert.equal(climb.equipped, true, "攀爬套装应处于装备状态");
  assert.ok(!snap.tags.some(t => t.name === "开锁工具在手"), "卸下开锁工具后标签应被摘除");
  assert.ok(snap.tags.some(t => t.name === "攀爬稳当"), "装备攀爬套装后必须挂载 [攀爬稳当] 标签");

  // 3. 手动卸下攀爬套装
  const res3 = game.unequipItem("climb_gear");
  assert.equal(res3.ok, true);
  snap = game.snapshot();
  climb = snap.inventory.find(i => i.id === "climb_gear");
  assert.equal(climb.equipped, false);
  assert.ok(!snap.tags.some(t => t.name === "攀爬稳当"), "手动卸下后标签必须摘除");
});

test("战术行囊 · 消耗品使用（便当恢复体力）", () => {
  const game = createGame({ stats: { stamina: 60 } });
  game.addItem("bento", 1);
  const snapBefore = game.snapshot();
  assert.equal(snapBefore.player.stamina, 60);

  const res = game.useItem("bento");
  assert.equal(res.ok, true);
  const snapAfter = game.snapshot();
  assert.equal(snapAfter.player.stamina, 80, "使用便当应恢复 20 点体力");
  assert.equal(snapAfter.inventory.find(i => i.id === "bento"), undefined, "便当使用后数量归零移除");
});

test("战术行囊 · 能量饮料夜间专供与每晚限次", () => {
  const game = createGame({ mode: "stealth", stats: { stamina: 50, heart: 40 } });
  game.addItem("energy_drink", 2);

  // 第一次使用：体力+20，心悸心跳+10
  const res1 = game.useItem("energy_drink");
  assert.equal(res1.ok, true);
  let snap = game.snapshot();
  assert.equal(snap.player.stamina, 70);
  assert.equal(snap.player.heart, 50);

  // 第二次使用（同晚）：受到每晚限一瓶拦截
  const res2 = game.useItem("energy_drink");
  assert.equal(res2.ok, false);
  assert.match(res2.reason, /每晚限一瓶/);

  // 过夜结算后：重置限次
  game.nightFall();
  const res3 = game.useItem("energy_drink");
  assert.equal(res3.ok, true, "过夜后限次重置，允许再次饮用");
});

test("战术行囊 · 存档与读档往返无损", () => {
  const game1 = createGame({ identity: "otaku", mode: "stealth" });
  game1.addItem("lockpick", 1);
  game1.equipItem("lockpick");
  game1.addItem("energy_drink", 1);

  const saved = game1.save();
  assert.ok(saved.inventory, "存档必须保存 inventory 数组");
  assert.equal(saved.inventory.length, 3, "含阿宅相机、开锁工具、能量饮料");

  // 从 saved 重建
  const game2 = createGame({ saved });
  const snap2 = game2.snapshot();
  assert.equal(snap2.inventory.length, 3);
  const lockpick2 = snap2.inventory.find(i => i.id === "lockpick");
  assert.equal(lockpick2.equipped, true, "读档后装备状态必须保持");
  assert.ok(snap2.tags.some(t => t.name === "开锁工具在手"), "读档后装备标签必须自动同步恢复");
});
