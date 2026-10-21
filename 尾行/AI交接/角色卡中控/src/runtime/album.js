/**
 * 相册：服装图鉴的取图与抽取（纯函数，不碰状态）。
 * 口径：
 *   - 头饰按发型；上装＝通用/长发 × 体型；下装/袜子/鞋 共用。
 *   - 只能拍到「还没拥有」的（id|角度）。
 *   - 角度受距离限制：远端拍不到；同街只侧/背；身后与贴身可正/侧/背。
 */
const WARDROBE = require("../config/wardrobe.json");

const DIR = (item, persona) => {
  if (item.slot === "head") return `hair/${persona.hair || "long"}`;
  if (item.slot === "top") {
    const body = persona.body || "normal";
    return persona.hair === "long" ? `long/${body}` : `base/${body}`;
  }
  return "shared";
};

const fileOf = (item, persona, angle) => `jk/${item.slot}/${DIR(item, persona)}/${item.id}/${angle}.png`;

/** 该距离下允许的角度。远端＝只拍到剪影，不进相册。 */
const anglesFor = (dist) => {
  if (dist === "far") return [];
  if (dist === "same") return ["side", "back"];
  return ["front", "side", "back"];
};

/** 本次能拍到的候选：未拥有 × 角度合法。 */
function captureList(persona, owned, dist) {
  const allowed = anglesFor(dist);
  if (!allowed.length) return [];
  const own = new Set(owned);
  const out = [];
  for (const item of WARDROBE.items) {
    for (const angle of item.angles) {
      if (!allowed.includes(angle)) continue;
      const key = `${item.id}|${angle}`;
      if (own.has(key)) continue;
      out.push({ item, angle, key, file: fileOf(item, persona, angle) });
    }
  }
  return out;
}

/** 本次最多能拍多少张（用于相册计数）。 */
function totalFor(persona) {
  return captureList(persona, [], "touch").length;
}

/** 套装齐活奖励：四件都拍过（任意角度）且未领过 → 每套 +2。 */
function setBonus(album, done = {}) {
  const ids = new Set(Object.keys(album).map(k => k.split("|")[0]));
  const newly = [];
  for (const [outfitId, set] of Object.entries(WARDROBE.outfits)) {
    if (done[outfitId]) continue;
    const need = [set.top, set.bottom, set.socks, set.shoes].filter(Boolean);
    if (need.every(id => ids.has(id))) {
      done[outfitId] = true;
      newly.push(outfitId);
    }
  }
  return { pi: newly.length * 2, outfits: newly };
}

module.exports = { DIR, fileOf, anglesFor, captureList, totalFor, setBonus, WARDROBE };
