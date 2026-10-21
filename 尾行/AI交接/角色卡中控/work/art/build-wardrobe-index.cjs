// 生成运行时索引 index.json，并校验「套装必须成套」：
//   1) 每套 outfit 的四件（上装/下装/袜子/鞋）都必须存在；
//   2) 每件上装至少被一套 outfit 使用；
//   3) 每件下装至少被一套 outfit 使用。
// 校验失败直接非零退出，防止把「毛衣配运动短裤」这种组合写进卡里。
const fs = require("node:fs");
const path = require("node:path");
const OUT = __dirname;

const rows = fs.readFileSync(path.join(OUT, "jk-wardrobe-v3.jsonl"), "utf8").trim().split("\n").map(JSON.parse);

// 套装表：JK 的每一套，四件齐 + 可选头饰
const OUTFITS = {
  outfit_jk_uniform:  { top: "top_jk_blazer",   bottom: "bottom_jk_pleat_navy", socks: "sock_knee_black",   shoes: "shoe_leather",  head: "head_ribbon_navy" },
  outfit_jk_sailor:   { top: "top_jk_sailor",   bottom: "bottom_jk_pleat_navy", socks: "sock_knee_black",   shoes: "shoe_leather",  head: "head_ribbon_navy" },
  outfit_jk_plaid:    { top: "top_jk_shirt",    bottom: "bottom_jk_pleat_plaid", socks: "sock_pile_cream",  shoes: "shoe_platform", head: "head_clip_plaid" },
  outfit_jk_hoodie:   { top: "top_jk_hoodie",   bottom: "bottom_jk_denim",      socks: "sock_cotton_short", shoes: "shoe_sneakers", head: "head_earphone_wired" },
  outfit_jk_knit:     { top: "top_jk_knit",     bottom: "bottom_jk_pleat_plaid", socks: "sock_thigh_white",  shoes: "shoe_platform", head: null },
  outfit_jk_baseball: { top: "top_jk_baseball", bottom: "bottom_jk_shorts",     socks: "sock_sport_stripe", shoes: "shoe_sneakers", head: null },
  outfit_jk_cardigan: { top: "top_jk_cardigan", bottom: "bottom_jk_pleat_navy", socks: "sock_knee_black",   shoes: "shoe_leather",  head: null }
};

const ids = new Set(rows.map(r => r.id));
const bySlot = { head: new Set(), top: new Set(), bottom: new Set(), socks: new Set(), shoes: new Set() };
for (const r of rows) bySlot[r.slot].add(r.id);

let fail = 0;
const need = ["top", "bottom", "socks", "shoes"];
for (const [id, set] of Object.entries(OUTFITS)) {
  for (const slot of need) {
    if (!bySlot[slot].has(set[slot])) { console.error(`✗ ${id} 缺 ${slot}: ${set[slot]}`); fail++; }
  }
  if (set.head && !bySlot.head.has(set.head)) { console.error(`✗ ${id} 缺头饰: ${set.head}`); fail++; }
}
for (const t of bySlot.top) if (!Object.values(OUTFITS).some(o => o.top === t)) { console.error(`✗ 上装没有被任何套装使用: ${t}`); fail++; }
for (const b of bySlot.bottom) if (!Object.values(OUTFITS).some(o => o.bottom === b)) { console.error(`✗ 下装没有被任何套装使用: ${b}`); fail++; }

// 索引：itemKey = id|variant|angle → 路径
const items = {};
for (const r of rows) items[`${r.id}|${r.variant}|${r.angle}`] = r.file;

const index = {
  version: 1,
  note: "相册取图：先按 outfit 拆四件，再按 id|variant|angle 查路径；variant 由开局掷出的发型/体型决定",
  targets: {
    jk: {
      variants: { hair: ["long", "ponytail", "twintails", "bob"], body: ["slim", "normal", "full"] },
      items,
      outfits: OUTFITS
    }
  }
};

fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index, null, 2), "utf8");

if (fail) {
  console.error(`校验失败：${fail} 项`);
  process.exit(1);
}
console.log(`OK：${Object.keys(OUTFITS).length} 套 / ${rows.length} 张图 / ${Object.keys(items).length} 条索引`);
