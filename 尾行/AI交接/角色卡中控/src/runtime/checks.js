/**
 * 尾行 · 检定引擎（纯函数，无状态）
 * 数值真源：数值策划 v0.6。所有断言见 tests/checks.test.js。
 * 本模块不做掷骰（骰子在中控/插件侧），只做公式：吃骰值出结果。
 */
const R = require("../config/rules.json");

/* ================= d20 检定 ================= */
/**
 * 单次 d20 检定（含优势/劣势的骰值由调用方传入 rawAdv/rawDis）。
 * v0.6 结果带（单轨大成功）：天然 20 ＝大成功专属时刻；数值带只分
 * 成功 ≥DC / 勉强 DC−1~−3（仅尾随系词条，stealth=true）/ 失败 ≤DC−4。
 * @param {object} p
 * @param {number} p.d20        骰值 1-20（优势时为取高后的值）
 * @param {number} p.attr       属性值 1-10
 * @param {Array}  p.mods       修正列表 [{src, v}]（标签栈汇总产物）
 * @param {number} p.dc         动作 DC（已含她的暗账）
 * @param {boolean} [p.stealth] 尾随系词条（她在场、动作泡在她感官里）才适用勉强档
 * @returns {{total:number, margin:number, band:string}} band: success|grace|fail|nat1|nat20
 */
function d20Check({ d20, attr, mods = [], dc, stealth = false }) {
  const modSum = mods.reduce((s, m) => s + m.v, 0);
  const total = d20 + attr + modSum;
  const margin = total - dc;
  let band;
  if (d20 === 1) band = "nat1";
  else if (d20 === 20) band = "nat20";
  else if (margin >= 0) band = "success";
  else if (stealth && margin >= -R.check.graceMargin) band = "grace";
  else band = "fail";
  return { total, margin, band };
}

/** 优势：双骰走天然铁律——有 20 必取 20（大成功不可挡，含 {1,20}），无 20 有 1 锁死取 1，否则取高。
 *  劣势：两骰取低（本版未启用劣势侧，保留原样）。 */
function applyAdvDis(roll1, roll2, mode) {
  if (mode === "adv") {
    const d20 = (roll1 === 20 || roll2 === 20) ? 20
      : (roll1 === 1 || roll2 === 1) ? 1
      : Math.max(roll1, roll2);
    return { d20, raw: [roll1, roll2] };
  }
  if (mode === "dis") return { d20: Math.min(roll1, roll2), raw: [roll1, roll2] };
  return { d20: roll1, raw: [roll1] };
}

/** 连败保底：连续两次硬失败后第三次 +3（规则层，不占标签封顶）。 */
function pityBonus(consecFails) {
  return consecFails >= 2 ? 3 : 0;
}

/* ================= 心跳 ================= */
/** 心跳系数（胆量即减免，不叠第二层）。胆2=1.24 / 胆5=1.0 / 胆8=0.76 / 胆10=0.6 */
function heartCoeff(nrv) {
  return R.heart.coeffBase - nrv * R.heart.coeffPerNrv;
}

/** 单笔刺激的心跳进账（四舍五入）。 */
function heartDelta({ stim, nrv }) {
  return Math.round(stim * heartCoeff(nrv));
}

/** 开局基线统一 30（v0.8 主人定稿：原 30+(5-胆)×3 作废——胆高起点低＝进甜区反而慢，双重罚；
 *  胆量的心跳优势只在刺激折扣与缓息效率，不在起点；回落/过夜锚同步统一） */
function heartBaseline() {
  return R.heart.baseline;
}

/** 缓息段回复：10+(胆-5)×2，最低 6。胆2=6 / 胆8=16 */
function breathGain(nrv) {
  return Math.max(R.heart.breathBase + (nrv - 5) * R.heart.breathPerNrv, R.heart.breathMin);
}

/** 段末自然回落：-5 至开局基线为止。 */
function segHeartDrop(current, nrv) {
  const base = heartBaseline();
  return Math.max(current - R.heart.segDrop, Math.min(current, base));
}

/** 缓息回落：至 20 为止。 */
function breathFloor(current, gain) {
  return Math.max(current - gain, Math.min(current, R.heart.floor));
}

/** 心跳封顶（v0.6）：上限 100——条打满即「濒临失控」。ledger 钳制同款，此处供展示层复用。 */
function heartCap(v) {
  return Math.min(v, R.heart.cap);
}

/* ================= 体力段位税（v0.6） ================= */
/**
 * 段体力消耗＝心跳档位税，按当段心跳峰值定档（猎手状态才收）：
 * <40 → −1（维持）/ 40~甜区上限（甜区）→ −2 / 甜区上限+1~89 → −4 / 90+ → −6。
 * 缓息段无进账，峰值即段初值；静止段（蹲守/潜伏）零段税。
 * sweetHigh 可被 [优势：胆量]（胆量≥10）拓展 +5，甜区档同步拓宽。
 */
function staminaSegTax(heartPeak, sweetHigh = R.check.sweetHigh) {
  if (heartPeak >= R.heart.crashLine) return -R.stamina.segTax.crash;   // 90+ 统一线
  if (heartPeak > sweetHigh) return -R.stamina.segTax.deform;           // 甜区上限+1~89
  if (heartPeak >= R.check.sweetLow) return -R.stamina.segTax.sweet;    // 40~甜区上限
  return -R.stamina.segTax.calm;                                        // <40
}

/* ================= 认脸两层制（v0.6 照面因果） ================= */
/**
 * 照面 → 面容记忆进账：进账唯一因＝她看到你的脸，潜行中绝不固定涨。
 * context: stealth（默认，按检定 band）| social（接触模式正常社交，每段+2）|
 *          locked（对抗被锁定）/ conflict（冲突）/ gaze（数秒对视）→ +2。
 * 遮挡照面不涨——遮挡判断由调用方做（遮挡=0 时才调本函数或对结果清零）。
 */
function faceMemGain({ context = "stealth", band = null }) {
  if (context === "social") return 2;
  if (["locked", "conflict", "gaze"].includes(context)) return 2;
  if (band === "grace") return 1;   // 勉强档瞥见：+1，不掷认脸
  if (band === "nat1") return 2;    // 天然 1 爆露：+2
  return 0;                          // 潜行全绿 / 普通失败（跟丢未照面）＝0
}

/**
 * 身份关联/识别判定（三件套的③，方案 A 平滑缓释乘算）：
 * 判决值 = ⌊(1d20 + 她的敏锐 + 体态醒目修正) × min(1.0, 记忆 × 0.05)⌋ vs 10 + 遮挡（封顶+5）。
 * 记忆为 0 时系数为 0，判决值恒为 0（生活无交集，无法对上号）。
 * 过 = 对上号。扳机（确认档）＋契机（照面/识别）由中控票据层驱动。
 */
function faceAssociate({ d20, acuity, memCells = 0, cover = 0, bodyMod = 0 }) {
  const coeff = Math.min(R.check.identifyMemMax ?? 1.0, memCells * (R.check.identifyMemCoeff ?? 0.05));
  const total = Math.floor((d20 + acuity + bodyMod) * coeff);
  const dc = 10 + Math.min(cover, R.check.coverCap);
  return { total, dc, hit: total >= dc, coeff };
}

/**
 * 操作线状态（v0.8 清账：[老手]/[新手] 双轨废弃，全员统一 70/90——
 * 胆量的心跳系奖励只走优势：胆量甜区上限，不再另开第二条轨）。
 * 返回 { sweet:bool, deform:0|-2, crash:bool }
 */
function heartLines(current, sweetHigh = R.check.sweetHigh) {
  const sweet = current >= R.check.sweetLow && current <= sweetHigh;
  const deform = current >= R.heart.deformLine ? -2 : 0;
  return { sweet, deform, crash: current >= R.heart.crashLine };
}

/* ================= 她的警觉 ================= */
/** 敏锐系数：0.8 + 敏锐×0.04（敏锐9=1.16，装没事再+3 是归因侧规则）。 */
function acuityCoeff(acuity) {
  return R.alert.acuityBase + acuity * R.alert.acuityPer;
}

/**
 * 警觉进账 = 威胁 × 距离系数 × 环境系数 × 敏锐系数（四舍五入）。
 * 眼熟档（接近度20~39）警觉增益系数 ×0.8。
 */
function alertDelta({ threat, dist, env, acuity, familiar = false }) {
  const t = R.alert.threat[threat] ?? 0;
  const d = R.alert.distFactor[dist] ?? 1.0;
  let e = R.alert.envFactor[env] ?? 1.0;
  if (familiar) e *= R.alert.familiarCoeff;
  return Math.round(t * d * e * acuityCoeff(acuity));
}

/** 档位：0无感 1不安 2起疑 3确认 4反应。 */
function alertStage(alert) {
  const b = R.alert.bands;
  if (alert >= b.react) return 4;
  if (alert >= b.confirmed) return 3;
  if (alert >= b.suspicious) return 2;
  if (alert >= b.uneasy) return 1;
  return 0;
}

/** 当晚开局警觉 = 时段基础 + 长期戒心÷5（四舍五入）。 */
function nightStartAlert(slot, wariness) {
  return Math.round((R.alert.nightBase[slot] ?? 0) + wariness / 5);
}

/** 过夜：长期戒心 += max(0, 当晚警觉峰值-50)÷4（四舍五入）。 */
function warinessGain(peakAlert) {
  return Math.round(Math.max(0, peakAlert - 50) / 4);
}

/* ================= 冲突（2d10） ================= */
/**
 * 战力 = 体格×3 + 敏捷×2 + 2d10 + 修正。
 * 修正：机会等级 opp(0-5 → -15..+10)、偷袭先手 +5（玩家侧）、
 *       她警觉每过一档她方 +2、玩家心跳>80 玩家方 -3、女警训练 +5（她方）。
 */
function conflictPower({ str, agi, dice, opp = 3, firstStrike = false, training = 0 }) {
  const base = str * R.conflict.strWeight + agi * R.conflict.agiWeight;
  const oppMod = R.conflict.oppMods[opp] ?? 0;
  return base + dice + oppMod + (firstStrike ? R.conflict.firstStrike : 0) + training;
}

function conflictModsSelf({ heart, firstStrike = false }) {
  return (heart > R.conflict.highHeartLine ? R.conflict.highHeartPenalty : 0) + (firstStrike ? R.conflict.firstStrike : 0);
}
function conflictModsHer({ alertStageNow, training = 0 }) {
  return Math.max(0, alertStageNow) * R.conflict.alertStageBonus + training;
}

/** 差值落档：pin 压制 / scuffle 得手有挣打 / grind 纠缠 / overpowered 被反制。 */
function conflictOutcome(diff) {
  const b = R.conflict.bands;
  if (diff >= b.pin) return "pin";
  if (diff >= b.scuffle) return "scuffle";
  if (diff >= b.grindLow) return "grind";
  return "overpowered";
}

/**
 * 僵住检定（终局生理恐惧）：1d20 + 胆量 ± [胆小-3/胆大+3] vs DC13。
 * 胆量>=9 女警自带训练修正。不过 = 僵住。
 */
function freezeCheck({ d20, nrv, training = 0 }) {
  let mod = 0;
  if (nrv <= 3) mod = -3;
  else if (nrv >= 6) mod = 3;
  const total = d20 + nrv + mod + training;
  const dc = R.conflict.freezeDC ?? 13;
  return { total, dc, frozen: total < dc };
}

/**
 * 迟疑轮数（终局认知信任崩塌）：<40: 0轮；40~69: 1轮；>=70: 2轮。
 */
function hesitationRounds(proximity) {
  if (proximity >= 70) return 2;
  if (proximity >= 40) return 1;
  return 0;
}

/* ================= 追逐（格移） ================= */
/** 每轮格移：差 ≥+5 追近2 / >0 追近1 / 0 僵持 / >-4 拉开1 / ≤-5 拉开2。 */
function chaseStep(diff) {
  if (diff >= R.chase.dashDiff) return 2;
  if (diff > 0) return 1;
  if (diff === 0) return 0;
  if (diff > -R.chase.dashDiff) return -1;
  return -2;
}

/** 她的暗体力 = 体格×10。 */
function herStamina(str) {
  return str * R.chase.herStaminaPerStr;
}

module.exports = {
  d20Check, applyAdvDis, pityBonus,
  heartCoeff, heartDelta, heartBaseline, breathGain, segHeartDrop, breathFloor, heartLines, heartCap,
  staminaSegTax, faceMemGain, faceAssociate, identifyCheck: faceAssociate,
  acuityCoeff, alertDelta, alertStage, nightStartAlert, warinessGain,
  conflictPower, conflictModsSelf, conflictModsHer, conflictOutcome,
  freezeCheck, hesitationRounds,
  chaseStep, herStamina
};
