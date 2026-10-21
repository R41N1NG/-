/**
 * 尾行 · 双账本（ledger）：全系统唯一的数值写入口。
 * 总纲 2：故事描写，后台定果——所有结算经 commit 事务落账，带快照可回退。
 *
 * 账目：alert(她的警觉,暗) wariness(她的防备,暗——v0.6 疑虑+戒心合并于此) heart(心跳,上限100)
 *       stamina(体力) cash(现金) pi(情报点) proximity(接近度)
 *       faceMem(面容记忆,暗) pursuit(追缉0-5,结局文案层) date(游戏日)
 * 红线：每笔 commit 生成快照号；回滚按快照号整笔还原；任何模块不得直写账目。
 */
const C = require("./checks.js");
const R = require("../config/rules.json");

const LIMITS = { alert: [0, 100], wariness: [0, 100], heart: [0, R.heart.cap], stamina: [0, 999],
                 cash: [0, 999999], pi: [0, 999], proximity: [0, 100],
                 faceMem: [0, 20], pursuit: [0, 5], date: [1, 999999] };

function createLedger(init = {}) {
  const start = {
    date: init.date ?? 1,
    alert: init.alert ?? 0,
    wariness: init.wariness ?? 0,
    heart: init.heart ?? 30,
    stamina: init.stamina ?? 100,
    cash: init.cash ?? 3000,
    pi: init.pi ?? 0,
    proximity: init.proximity ?? 0,
    faceMem: init.faceMem ?? 0,
    pursuit: init.pursuit ?? 0,
  };
  // 心跳开局基线按胆量校准
  if (init.nrv != null && init.heart == null) start.heart = C.heartBaseline(init.nrv);

  let seq = 0;
  const snapshots = new Map();   // seq → 深拷贝快照

  const state = start;
  const clamp = (k, v) => Math.max(LIMITS[k][0], Math.min(LIMITS[k][1], v));

  return {
    state,

    /** 读账。 */
    get(k) { return state[k]; },

    /**
     * 事务提交：变更集一次性落账。
     * @param {object} changes  {字段: 增量}（负数为扣减）
     * @param {object} meta     {floor, reason, extra} 回执用元信息
     * @returns {{seq, before, after, applied, clipped}} applied=实际落账增量（含边界钳制）
     */
    commit(changes, meta = {}) {
      const before = { ...state };
      const applied = {};
      for (const [k, dv] of Object.entries(changes)) {
        if (!(k in LIMITS)) throw new Error(`未知账目: ${k}`);
        const nv = clamp(k, state[k] + dv);
        applied[k] = nv - state[k];     // 实际落账（撞边界时 ≠ 申报增量）
        state[k] = nv;
      }
      const seqNo = ++seq;
      snapshots.set(seqNo, { before, after: { ...state }, changes, meta, applied });
      return { seq: seqNo, before, after: { ...state }, applied, meta };
    },

    /** 快照回滚：删楼/swipe/分支切换，按 seq 整笔还原。 */
    rollback(seqNo) {
      const snap = snapshots.get(seqNo);
      if (!snap) return false;
      Object.assign(state, snap.before);
      // 撤销该 seq 之后的所有快照（时间线断裂，后续快照失效）
      for (const s of snapshots.keys()) if (s >= seqNo) snapshots.delete(s);
      return true;
    },

    /* ---------- 复合结算（纯函数组装，仍走 commit 单入口） ---------- */

    /** 动作结算：双账（情报收益 / 暴露代价）+ 心跳。delta 由中控用 checks 算好后传入。 */
    settleAction({ alertD = 0, heartD = 0, piD = 0, staminaD = 0, cashD = 0, proximityD = 0, faceMemD = 0 }, meta) {
      return this.commit({ alert: alertD, heart: heartD, pi: piD, stamina: staminaD,
                           cash: cashD, proximity: proximityD, faceMem: faceMemD }, meta);
    },

    /**
     * 过夜结算：警觉峰值沉淀防备、心跳回基线、体力「恢复至」分档（v0.6）、日期+1。
     * 恢复至（模拟过劳睡不好）：收摊剩余 ≥30% → 100%；10%~29% → 80%；<10% → 60%。
     */
    settleNight({ peakAlert, nrv, staminaMax = 100 }) {
      const warinessD = C.warinessGain(peakAlert);
      const ratio = state.stamina / staminaMax;
      const rest = ratio >= R.stamina.nightRest.fullMin ? 1
        : ratio >= R.stamina.nightRest.midMin ? R.stamina.nightRest.midTo
        : R.stamina.nightRest.lowTo;
      const staminaTarget = Math.round(staminaMax * rest);
      const r = this.commit({
        wariness: warinessD,
        alert: -(state.alert),                       // 当晚警觉清零
        heart: C.heartBaseline(nrv) - state.heart,   // 回基线
        stamina: staminaTarget - state.stamina,      // 恢复至（非恢复量）
        date: 1,
      }, { reason: "settleNight" });
      return { ...r, warinessGain: warinessD, restRatio: rest, nextStartAlert: Math.round(state.wariness / 5) };
    },

    /** 追缉：只升不降（7 日冷却回落由调度层走 commit 直改，此处封快路径）。 */
    raisePursuit(level) {
      if (level <= state.pursuit) return null;
      return this.commit({ pursuit: level - state.pursuit }, { reason: "pursuit" });
    },
  };
}

module.exports = { createLedger, LIMITS };
