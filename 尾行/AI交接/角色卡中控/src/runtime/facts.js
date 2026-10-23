// src/runtime/facts.js - 生活包事实池运行时：解锁判定、视图过滤、每晚条件、交叉校验
// 纪律（数值策划第二十七节）：池子开局全量生成，情报只决定看几层；
// L1/L2 门槛表 null = 该层不存在（psyche 无中间态），L3 null = 免 PI 门（carry 纯票制）。
const LP = require("../config/lifepack.json");
const R = require("../config/rules.json");
const RAW_LEXICON = require("../config/lexicon.json");
const map = require("./map");

const SLOTS = ["home", "schedule", "carry", "social", "psyche", "romance"];
// 事实条目可选标记白名单（v0.8 身份制）：gym = 该日程条目含健身房——健身教练特权「接近度起点+20」的判定锚
const FACT_TAGS = ["gym"];
// L2 槽位票门（二十七节管道表：carry 观察票 / social watch_peers 票 / romance 情感观察票）
const L2_TICKET_GATE = {
  carry: ["photo", "scan", "listen", "note", "watch_lights"],
  social: ["watch_peers"],
  romance: ["hear_gossip", "chat", "watch_peers"],
};

function loadPack(id, data = LP) {
  return data.packs[id] || null;
}

/* L1 = floor(L2/2) 公式锚自检（防手改门槛表崩锚），null 槽位除外 */
function l1FormulaHold(unlock = LP.unlock) {
  return SLOTS.every(
    (s) =>
      unlock.L1[s] === null ||
      unlock.L1[s] === Math.floor((unlock.L2[s] || 0) / 2),
  );
}

/* 槽位层级资格：只看 PI 门；L1/L2 null=无此层（跳过），L3 null=纯票制（资格直达，单事实票门拦截） */
function slotLevel(slot, intel = {}, unlock = LP.unlock) {
  const pi = intel.pi || 0;
  for (const lv of [3, 2, 1]) {
    const t = unlock["L" + lv][slot];
    if (t === null) {
      if (lv === 3) return 3;
      continue;
    }
    if (pi >= t) return lv;
  }
  return 0;
}

/* 单条事实可见性：public 恒见；层级资格 ≥ fact.level；L3 另需 reveal_via 票命中，L2 按槽位票门 */
function factVisible(fact, level, tickets = [], slot = fact.slot) {
  if (fact.public) return true;
  if (level < fact.level) return false;
  const set = tickets instanceof Set ? tickets : new Set(tickets);
  if (fact.level === 3) return (fact.reveal_via || []).some((a) => set.has(a));
  if (fact.level === 2) {
    const gate = L2_TICKET_GATE[slot];
    return !gate || gate.some((a) => set.has(a));
  }
  return true;
}

/* 预算制视图：LLM 只拿这份过滤结果（四闸②） */
function legacyView(packId, intel = {}, data = LP) {
  const pack = loadPack(packId, data);
  if (!pack) return null;
  const levels = {};
  const facts = [];
  for (const slot of SLOTS) levels[slot] = slotLevel(slot, intel, data.unlock);
  const factList =
    (intel && (intel.assignedFacts || intel.facts)) || pack.factPool || [];
  for (const f of factList) {
    if (factVisible(f, levels[f.slot], intel.tickets || [])) {
      facts.push({
        id: f.id,
        slot: f.slot,
        level: f.level,
        title: f.title,
        text: f.text,
        place: f.place,
      });
    }
  }
  return { pack: packId, levels, facts };
}

// 正式档案只认本地已确认事实；旧 PI 门仅供旧档迁移，不能用于新发现。
function view(packId, intel = {}, data = LP) {
  const pack = loadPack(packId, data);
  if (!pack) return null;
  const known = new Set(intel.knownFacts || []);
  const facts = (intel.assignedFacts || intel.facts || pack.factPool || [])
    .filter((f) => f.public || known.has(f.id))
    .map(({ id, slot, level, title, text, place }) => ({
      id,
      slot,
      level,
      title,
      text,
      place,
    }));
  const levels = Object.fromEntries(
    SLOTS.map((s) => [
      s,
      Math.max(0, ...facts.filter((f) => f.slot === s).map((f) => f.level)),
    ]),
  );
  return { pack: packId, levels, facts };
}

/* 每晚条件族真值：P(扰动) = mod × (1 − stability)，截断浮点尾差防边界漂移；静态骨架之外的全部走这里 */
function nightConditions(packId, rng, data = LP) {
  const pack = loadPack(packId, data);
  if (!pack) return null;
  return pack.conditions.map((c) => {
    const p = Math.round(c.mod * (1 - pack.stability) * 1e6) / 1e6;
    return { id: c.id, title: c.title, active: rng() < p };
  });
}

/* 特质标签的敏锐暗修正管道：数值真源在 rules.tags，调用侧传 acuity 前先过这里 */
function effectiveAcuity(per, traits = []) {
  let mod = 0;
  for (const t of traits) {
    const tid = typeof t === "string" ? t : t && t.id;
    const def = R.tags && R.tags[tid];
    if (def && def.category === "acuity" && typeof def.value === "number") {
      mod += def.value;
    }
  }
  return Math.max(1, Math.min(10, per + mod));
}

/* 健身教练特权判定（v0.8 身份制）：她的 schedule 槽事实是否含健身房标记 */
function packHasGym(packId, data = LP) {
  const pack = loadPack(packId, data);
  if (!pack) return false;
  return (pack.factPool || []).some(
    (f) => f.slot === "schedule" && (f.tags || []).includes("gym"),
  );
}

/* 交叉校验：place/reveal_via/traits/routes 全部对真源（抽象实体锚纪律自动化） */
function validate(pack, data = LP) {
  const errors = [];
  const at = `pack(${pack.id || "?"})`;
  if (!pack.id || !pack.name) errors.push(`${at}: 缺 id/name`);
  for (const k of ["str", "agi", "per", "nrv"]) {
    if (typeof pack.stats?.[k] !== "number")
      errors.push(`${at}: stats.${k} 缺失`);
  }
  if (typeof pack.social !== "number") errors.push(`${at}: social 缺失`);
  if (
    typeof pack.stability !== "number" ||
    pack.stability <= 0 ||
    pack.stability >= 1
  )
    errors.push(`${at}: stability 须在 (0,1) 开区间`);
  const tagIds = new Set(Object.keys(RAW_LEXICON.tags));
  for (const t of pack.traits || []) {
    if (!tagIds.has(t))
      errors.push(`${at}: traits "${t}" 不在词表 tags（黑户）`);
  }
  const entryIds = new Set(RAW_LEXICON.entries.map((e) => e.id));
  for (const f of pack.factPool || []) {
    const fat = `${at}.fact(${f.id || "?"})`;
    if (!f.id || !f.title || !f.text) errors.push(`${fat}: 缺 id/title/text`);
    if (!SLOTS.includes(f.slot)) errors.push(`${fat}: 非法槽位 ${f.slot}`);
    if (![1, 2, 3].includes(f.level))
      errors.push(`${fat}: 非法层级 ${f.level}`);
    if (f.place && !map.getPlace(f.place))
      errors.push(`${fat}: place "${f.place}" 不在 places.json`);
    for (const a of f.reveal_via || []) {
      if (!entryIds.has(a))
        errors.push(`${fat}: reveal_via "${a}" 不在词表 entries（黑户）`);
    }
    for (const t of f.tags || []) {
      if (!FACT_TAGS.includes(t))
        errors.push(`${fat}: tags "${t}" 不在事实标记白名单（黑户）`);
    }
  }
  for (const r of pack.routes || []) {
    for (const step of r.path || []) {
      if (!map.getPlace(step.place))
        errors.push(
          `${at}.route(${r.id}): 节点 "${step.place}" 不在 places.json`,
        );
    }
  }
  return errors;
}

module.exports = {
  SLOTS,
  FACT_TAGS,
  L2_TICKET_GATE,
  loadPack,
  l1FormulaHold,
  slotLevel,
  factVisible,
  view,
  legacyView,
  nightConditions,
  effectiveAcuity,
  packHasGym,
  validate,
};
