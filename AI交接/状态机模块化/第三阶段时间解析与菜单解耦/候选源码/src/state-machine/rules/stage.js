/* ══════════════════════════════════════════════════════════════════════════
 * 段位与推进调度（2026-10-04 升级 · 方案 B 非均匀长跑 ＋ 场景驻留等待 ＋ 锚点提前驱动）
 *
 * 核心原则：
 * 1. 楼层为保底步长，大段（日常/战事/调教）25-35 楼，小段（送别/转折）15-20 楼；
 * 2. 玩家推得快时，关键事件锚点达成允许提前跳段（快速推进）；
 * 3. 玩家沉浸做爱或私密互动时（Scene Hold），章节停住等待玩家，绝不强行推剧情打扰；
 * 4. 每隔 15 楼或换段时，自动触发后台阶段总结/存档（给后续写作指明方向）。
 * ══════════════════════════════════════════════════════════════════════════ */
const STAGE_STEPS = [30, 20, 25, 20, 15, 20, 30, 20, 25, 20, 20, 20, 30, 30, 35, 999]; // 方案 B 非均匀步长
const STAGE_BASE = [1, 31, 51, 76, 96, 111, 131, 161, 181, 206, 226, 246, 266, 296, 326, 361];
/* 15 个剧情段 ＋ 1 个无档案段（离山之后）的仙盟历时点；[段号-1] */
const SEG_TIME = [1578.03,1578.04,1578.06,1578.08,1578.11,1578.11,1578.12,1579.01,1579.01,1579.02,1579.03,1579.04,1579.04,1579.05,1579.06,1580.01];
const FLOOR_PIN = '段位基准';            // `设段` 写下的 { floor, shift }；缺省＝不平移

/** 关键剧情锚点触发后允许提前跳段的映射表（索引: 段号 - 1） */
const STAGE_FAST_FORWARD = [
  null,                                                      // 段 1: 墨山道起步
  ['极乐引入手', '邪修洞府替孤月中毒', '邪修洞府解毒'],          // 段 2: 邪修洞府
  ['玄机子胁迫过叶红缨', '进入幽寂谷'],                       // 段 3: 幽寂谷秘境
  ['南域大劫'],                                              // 段 4: 南域大劫
  ['孤月定情', '赠送冰心泪'],                                 // 段 5: 孤剑崖送别
  ['已抵达天溪'],                                            // 段 6: 初入天溪
  ['天溪城兽潮', '兽潮血战'],                                 // 段 7: 兽潮血战
  ['玄机子装伤', '灵犀同心成形'],                             // 段 8: 灵犀同心
  ['赵无忧看见乳环'],                                        // 段 9: 越界失控
  ['双姝回归'],                                              // 段 10: 双姝回归
  ['天溪城破'],                                              // 段 11: 天溪城破
  ['封元镇灵环', '赵无忧坠渊'],                               // 段 12: 朱樱逢劫
  ['灼酒流炎穴成形'],                                         // 段 13: 赤羽堕凡尘
  ['残阳老怪洞府调教叶红缨'],                                 // 段 14: 洞府调教
  ['叶红缨认残阳老怪为主', '灼酒流炎穴二阶段']                 // 段 15: 雀奴
];

/** 检查当前是否处于交合温存/沉浸私密场景中（章节等待玩家） */
function isSceneLocked(text, stat) {
  const t = String(text || '');
  const st = String((stat && (stat.状态 || stat.环境 || stat.目标)) || '');
  const combined = t.slice(-600) + ' ' + st;
  const intimacyPattern = /(?:交合|温存|做爱|双修|缠绵|行房|肉壁|花径|抽送|高潮|承欢|索求|调教|侍寝|赤身|相拥|欢好|春潮|花心|蜜液|贯穿|破身|解毒)/;
  const departurePattern = /(?:启程|离开|走出|告辞|返程|回宗|破门而出|数日后|数月后|半年后|一年后|各自散去)/;
  return intimacyPattern.test(combined) && !departurePattern.test(combined);
}

/** 由楼层算段位（floor ≤0 或不合法 ⇒ 0 ＝ 取不到） */
function stageOfFloor(floor, shift) {
  const f = Number(floor) + (Number(shift) || 0);
  if (!isFinite(f) || f < 1) return 0;
  for (let i = 0; i < STAGE_STEPS.length; i++) if (f < STAGE_BASE[i] + STAGE_STEPS[i]) return i + 1;
  return STAGE_STEPS.length;
}

/** 检查事件驱动的提前推进段位 */
function checkFastForwardStage(known, curStage) {
  if (!known || typeof known !== 'object') return curStage;
  for (let s = STAGE_FAST_FORWARD.length; s >= curStage + 1; s--) {
    const list = STAGE_FAST_FORWARD[s - 1];
    if (list && list.some(k => known[k] === true)) {
      return s;
    }
  }
  return curStage;
}

