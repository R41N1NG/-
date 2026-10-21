/**
 * 动线时刻表推进（她按自己的返程表走，LLM 不参与）：
 * 一楼 = 15 分钟，第 1 楼对应 route.startTime；越过节点发车时刻就推进到该站。
 * 没有 times 的旧动线（老存档 / 手搓）保持原语义，不自动推进。
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { createGame } = require("../src/runtime/game.js");

const NODES = ["school_gate_b", "old_skybridge_b", "store_24h_b", "old_alley_main_b", "unit_stairs_b"];
const TIMES = ["2130", "2145", "2200", "2215", "2230"];

function game(route) {
  return createGame({
    sessionSalt: "deadbeefdeadbeefdeadbeefdeadbeef",
    target: { str: 3, agi: 4, per: 5, nrv: 4, social: 2 },
    stats: { date: 1, heart: 30, stamina: 100, cash: 800, pi: 0 },
    world: { weather: "clear", district: "B" },
    route,
  });
}

const route = (extra = {}) => ({
  id: "college_evening", note: "", prompt: "", startTime: "21:30",
  nodes: NODES.slice(), times: TIMES.slice(), known: NODES.map(() => 1), here: 0,
  ...extra,
});

test("时刻表：第 1 楼在校门，22:45 时她已在单元楼道（here 随钟点推进）", () => {
  const g = game(route());
  g.processFloor("", { floor: 1 });
  assert.equal(g.snapshot().place, "学校正门", "21:30 应在起点");

  g.processFloor("", { floor: 2 });   // 21:45
  assert.equal(g.snapshot().place, "老水泥天桥");
  g.processFloor("", { floor: 5 });   // 22:30，末站
  assert.equal(g.snapshot().place, "老旧单元楼道");
  assert.equal(g.snapshot().route.here, 4);
});

test("时刻表：跳楼号会一次跨多站，但只留一条动向信号", () => {
  const g = game(route());
  g.processFloor("", { floor: 6 });   // 22:45，直接跳到终点
  const s = g.snapshot();
  assert.equal(s.route.here, 4);
  const moves = (s.signal || []).filter(x => String(x[1]).includes("目标动向推进"));
  assert.equal(moves.length, 1, "多站合并为一条信号");
  assert.ok(String(moves[0][1]).includes("老旧单元楼道"));
});

test("时刻表：到终点不再越界，且收起侦探职业病状态位", () => {
  const g = game(route());
  g.processFloor("", { floor: 6 });
  g.processFloor("", { floor: 8 });
  assert.equal(g._g.route.here, 4, "终点封顶");
  assert.equal(g._g.tailing, false);
});

test("时刻表：旧动线（无 times）不被自动推进，兼容老存档与手搓动线", () => {
  const g = game({ id: "manual", note: "", prompt: "", startTime: "21:30",
                   nodes: NODES.slice(), known: NODES.map(() => 1), here: 0 });
  g.processFloor("", { floor: 6 });
  assert.equal(g.snapshot().route.here, 0);
  assert.equal(g.snapshot().place, "学校正门");
});

test("老存档兼容：同名动线自动补发车时刻（玩家现有存档不必重开）", () => {
  const g = game({ id: "college_evening", note: "", prompt: "", startTime: "21:30",
                   nodes: NODES.slice(), known: NODES.map(() => 1), here: 0 });
  assert.deepEqual(g._g.route.times, TIMES, "应回填包内同名动线的 t");
  g.processFloor("", { floor: 6 });
  assert.equal(g.snapshot().route.here, 4, "补表后立即按时刻表推进");
});

test("时刻表：回执写明本楼地点并禁止模型自行换场景", () => {
  const { receiptText } = require("../src/host/glue.js");
  const g = game(route());
  const r = g.settleInput("跟缀");
  const text = receiptText(r);
  assert.ok(text.includes("地点：[学校正门]"), "回执应带地点");
  assert.ok(text.includes("严禁把她写到别的场所"), "回执应有硬约束");
});
