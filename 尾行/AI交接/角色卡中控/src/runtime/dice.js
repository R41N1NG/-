/**
 * 尾行 · 确定性骰子（种子化伪随机流）
 * 宪法：同种子必同序列。重放、回滚、防刷全部由此保证。
 * 引擎内零 Math.random —— 一切随机都必须从本模块的种子流来。
 *
 * 会话盐：开局建档时用系统熵源随机生成一次，存入档中，之后只读。
 * 盐本身是真随机（crypto），但只发生一次；之后所有骰子都由「盐+楼号+序号」
 * 确定性推导——对外黑箱（不可预知），对内确定（可重放）。
 */
const MASK = 0xFFFFFFFF;
// 双环境盐源：Node 走 crypto.randomBytes；浏览器/酒馆助手走 Web Crypto（getRandomValues 同步）。
// 变量间接 require 让 esbuild 不静态解析 Node 内建模块。
const req = typeof require === "function" ? require : null;
const nodeCrypto = req ? (() => { try { return req("crypto"); } catch (e) { return null; } })() : null;

/** 开局建档时调用一次：生成会话盐（128bit 真随机，玩家不可见，存档）。 */
function newSessionSalt() {
  if (nodeCrypto) return nodeCrypto.randomBytes(16).toString("hex");
  const buf = new Uint8Array(16);
  if (globalThis.crypto && globalThis.crypto.getRandomValues) globalThis.crypto.getRandomValues(buf);
  else for (let i = 0; i < 16; i++) buf[i] = (Date.now() + i * 7919) & 0xff;   // 极端降级（无 Web Crypto 环境）
  return Array.from(buf, x => x.toString(16).padStart(2, "0")).join("");
}

/** mulberry32：种子 → [0,1) 均匀流。 */
function rng(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6D2B79F5) & MASK;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 楼种子 = hash(会话盐, 楼号)。FNV-1a 32bit。盐不可知 → 种子不可推。 */
function floorSeed(sessionSalt, floor) {
  let h = 0x811c9dc5;
  const s = String(sessionSalt) + ":" + String(floor);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) & MASK;
  }
  return h >>> 0;
}

/** 动作种子 = 楼种子再混动作序号（队列内第几个动作掷的骰永远不同且稳定）。 */
function actionSeed(sessionSalt, floor, seq) {
  let h = floorSeed(sessionSalt, floor);
  h ^= (seq * 0x9E3779B1) & MASK;
  h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B) & MASK;
  return h >>> 0;
}

const d = (next, sides) => Math.floor(next() * sides) + 1;

/** d20（含优势/劣势）。优势走天然铁律（主人定稿）：有 20 必取 20（含 {1,20}）、无 20 有 1 锁死取 1、否则取高。 */
function rollD20(seed, mode = "normal") {
  const next = rng(seed);
  const a = d(next, 20), b = d(next, 20);
  if (mode === "adv") {
    const d20 = (a === 20 || b === 20) ? 20 : (a === 1 || b === 1) ? 1 : Math.max(a, b);
    return { d20, raw: [a, b] };
  }
  if (mode === "dis") return { d20: Math.min(a, b), raw: [a, b] };
  return { d20: a, raw: [a] };
}

/** 2d10（冲突用）。 */
function roll2D10(seed) {
  const next = rng(seed);
  return { dice: [d(next, 10), d(next, 10)], sum: null, get total() { return this.dice[0] + this.dice[1]; } };
}

module.exports = { newSessionSalt, rng, floorSeed, actionSeed, rollD20, roll2D10 };
