// JK 服装特写清单 v3（主人定稿的维度规则）
//   头饰：受发型影响（长发 / 马尾 / 双马尾 / 短发及颈）
//   上装：通用一套 + 长发一套，各自受体型影响（清瘦 B / 匀称 D / 丰腴 E）→ 6 套
//   下装、丝袜、鞋子：不受影响，各一套
const fs = require("node:fs");
const path = require("node:path");
const OUT = __dirname;

const STYLE = [
  "fashion catalog photography, vertical composition",
  "anonymous model, face cropped out of the frame",
  "matte dark grey seamless backdrop, soft diffused studio light",
  "50mm lens, shallow depth of field, tasteful editorial look",
  "no text, no logo, no watermark"
].join(", ");

const BASE = "East Asian young woman, 160 cm, light warm skin tone, face is never visible";

const HAIR = {
  long: "long straight black hair falling past the shoulders, straight bangs",
  ponytail: "black high ponytail, straight bangs, tail falling behind the head",
  twintails: "black twintails tied high on both sides, straight bangs",
  bob: "black chin-length bob, straight bangs, hair ends at the jawline"
};

// 杯型只作内部口径；提示词用体态描述，避免审核与夸张
const BODY = {
  slim: { cup: "B", text: "slender frame, small bust, narrow shoulders and hips" },
  normal: { cup: "D", text: "balanced figure, fuller bust, defined waist, soft hip curve" },
  full: { cup: "E", text: "full figure, full bust, rounded hips, soft waistline" }
};

const NEG = "face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render";

const ANGLES = {
  head: [
    { a: "side", crop: "framed from jawline to crown, face out of frame", size: "512x512" },
    { a: "back", crop: "back view of head and shoulders, hair and accessory centered", size: "512x512" }
  ],
  top: [
    { a: "front", crop: "framed from shoulders to hips", size: "512x768" },
    { a: "side", crop: "profile view, shoulders to hips", size: "512x768" },
    { a: "back", crop: "back view, shoulders to hips", size: "512x768" }
  ],
  bottom: [
    { a: "front", crop: "framed from waist to just above the knee", size: "512x768" },
    { a: "side", crop: "profile view, waist to just above the knee", size: "512x768" },
    { a: "back", crop: "back view, waist to just above the knee", size: "512x768" }
  ],
  socks: [
    { a: "front", crop: "framed from knee to ankle", size: "512x640" },
    { a: "side", crop: "profile view, knee to ankle", size: "512x640" },
    { a: "back", crop: "back view, knee to ankle", size: "512x640" }
  ],
  shoes: [
    { a: "three-quarter", crop: "framed from ankle to floor, three-quarter view", size: "512x512" },
    { a: "side", crop: "side view, ankle to floor", size: "512x512" }
  ]
};

const ITEMS = [
  { id: "head_ribbon_navy", name: "藏青发带", slot: "head", batch: 1,
    garment: "navy satin ribbon hairband tied at the back of the head, two tail ends falling into the hair" },
  { id: "head_clip_plaid", name: "格纹发夹", slot: "head", batch: 2,
    garment: "small plaid one-piece hairpin fastening the side hair, navy and cream plaid" },
  { id: "head_earphone_wired", name: "白色有线耳机", slot: "head", batch: 2,
    garment: "white wired earphones, one earbud at the ear, thin cable falling toward the chest" },

  { id: "top_jk_blazer", name: "藏青西装外套", slot: "top", batch: 1,
    garment: "navy single-breasted school blazer with fitted waist and white piping on the cuffs, worn open over a white shirt" },
  { id: "top_jk_sailor", name: "白底水手服上衣", slot: "top", batch: 1,
    garment: "white sailor blouse with navy collar, two white stripes on the collar edge, short cropped length" },
  { id: "top_jk_shirt", name: "白衬衫", slot: "top", batch: 1,
    garment: "crisp white cotton shirt, small square collar, buttoned to the top" },
  { id: "top_jk_cardigan", name: "米色针织开衫", slot: "top", batch: 2,
    garment: "beige loose-knit long cardigan, hip length, open front, sleeves slightly long" },
  { id: "top_jk_hoodie", name: "浅米灰连帽卫衣", slot: "top", batch: 2,
    garment: "light greige oversized hoodie, drop shoulders, hem below the hips, hood down" },
  { id: "top_jk_knit", name: "奶白蓬松针织衫", slot: "top", batch: 2,
    garment: "cream fluffy round-neck knit sweater, sleeves bunched at the wrists" },
  { id: "top_jk_baseball", name: "拼色棒球服", slot: "top", batch: 2,
    garment: "two-tone cropped baseball jacket, ribbed cuffs and hem, front zipper half open" },

  { id: "bottom_jk_pleat_navy", name: "藏青百褶短裙", slot: "bottom", batch: 1,
    garment: "navy pleated school skirt with hard pleats, high waist, hem at mid-thigh" },
  { id: "bottom_jk_pleat_plaid", name: "格纹百褶短裙", slot: "bottom", batch: 2,
    garment: "cream and navy plaid pleated skirt, sharp pleats, high waist, hem above the knee" },
  { id: "bottom_jk_denim", name: "水洗牛仔短裙", slot: "bottom", batch: 2,
    garment: "light-wash denim mini skirt, high waist, raw frayed hem" },
  { id: "bottom_jk_shorts", name: "运动短裤", slot: "bottom", batch: 2,
    garment: "navy sports shorts with white side piping, elastic waist" },

  { id: "sock_knee_black", name: "黑色及膝袜", slot: "socks", batch: 1,
    garment: "black opaque knee-high cotton socks, band resting just below the knee" },
  { id: "sock_thigh_white", name: "白色过膝袜", slot: "socks", batch: 2,
    garment: "sheer white over-the-knee socks, soft band at mid-thigh" },
  { id: "sock_pile_cream", name: "米白堆堆袜", slot: "socks", batch: 2,
    garment: "cream fine-knit slouch socks bunched at the ankle" },
  { id: "sock_sport_stripe", name: "条纹运动长袜", slot: "socks", batch: 2,
    garment: "white calf-length sports socks with two navy stripes" },
  { id: "sock_cotton_short", name: "纯白短棉袜", slot: "socks", batch: 2,
    garment: "plain white short cotton socks, cuff just above the shoe opening" },

  { id: "shoe_leather", name: "制服小皮鞋", slot: "shoes", batch: 1,
    garment: "black round-toe leather loafers with a slim buckle strap" },
  { id: "shoe_sneakers", name: "运动鞋", slot: "shoes", batch: 2,
    garment: "white low-top sneakers with grey accents" },
  { id: "shoe_platform", name: "松糕鞋", slot: "shoes", batch: 2,
    garment: "dark brown platform mary-jane shoes with a thick sole" },
  { id: "shoe_flats", name: "平底鞋", slot: "shoes", batch: 2,
    garment: "pale beige leather flat shoes" }
];

/** 每个槽位的变体：头饰 4 发型；上装 2 版（通用/长发）× 3 体型；其余共用 */
function variantsFor(slot) {
  if (slot === "head") return Object.keys(HAIR).map(h => ({
    key: h, dir: `hair/${h}`, hair: HAIR[h], body: null, note: "发型"
  }));
  if (slot === "top") {
    const out = [];
    for (const [b, def] of Object.entries(BODY)) {
      out.push({ key: `base_${b}`, dir: `base/${b}`, hair: null, body: def.text, note: `通用·${b}` });
      out.push({ key: `long_${b}`, dir: `long/${b}`, hair: HAIR.long, body: def.text, note: `长发·${b}` });
    }
    return out;
  }
  return [{ key: "shared", dir: "shared", hair: null, body: null, note: "共用" }];
}

const rows = [];
for (const it of ITEMS) {
  for (const v of variantsFor(it.slot)) {
    for (const ang of ANGLES[it.slot]) {
      const parts = [STYLE, BASE];
      if (v.hair) parts.push(v.hair);
      if (v.body) parts.push(v.body);
      if (it.slot === "top" && !v.hair) parts.push("hair out of frame, shoulders bare of hair");
      if (it.slot === "top" && v.hair) parts.push("long hair falling over the shoulders and collar");
      parts.push(`wearing ${it.garment}`);
      parts.push(`${ang.crop}, garment centered`);
      rows.push({
        id: it.id, name: it.name, slot: it.slot, batch: it.batch,
        variant: v.key, note: v.note, angle: ang.a, size: ang.size, crop: ang.crop,
        prompt: parts.join(", ") + ".",
        negative: NEG,
        file: `assets/wardrobe/jk/${it.slot}/${v.dir}/${it.id}/${ang.a}.png`
      });
    }
  }
}

fs.writeFileSync(path.join(OUT, "jk-wardrobe-v3.jsonl"), rows.map(r => JSON.stringify(r)).join("\n") + "\n", "utf8");

const slotName = {
  head: "头饰（按发型，4 套）",
  top: "上半身（通用/长发 × 清瘦/匀称/丰腴，6 套）",
  bottom: "下半身（共用）",
  socks: "袜子（共用）",
  shoes: "鞋子（共用）"
};
const byItem = new Map();
for (const r of rows) {
  const k = r.id + "|" + r.variant;
  if (!byItem.has(k)) byItem.set(k, []);
  byItem.get(k).push(r);
}

let md = `# JK 服装特写清单 v3（定稿维度）

- **头饰**：受发型影响（长发 / 马尾 / 双马尾 / 短发及颈）
- **上装**：通用一套 + 长发一套，各受体型影响（清瘦 B / 匀称 D / 丰腴 E）→ 6 套
- **下装、丝袜、鞋子**：一套共用
- 共 ${rows.length} 张。一图一条，按 \`file\` 存；同一变体连着生成。

`;

let lastSlot = "";
for (const [k, list] of byItem) {
  if (list[0].slot !== lastSlot) {
    md += `\n## ${slotName[list[0].slot]}\n\n`;
    lastSlot = list[0].slot;
  }
  md += `### ${list[0].name}（\`${list[0].id}\` · ${list[0].note}）\n\n`;
  for (const r of list) {
    md += `**${r.angle}** · ${r.size} · \`${r.file}\`\n\n`;
    md += "```text\n" + r.prompt + "\n```\n\n";
    md += `负面：\`${r.negative}\`\n\n`;
  }
}
fs.writeFileSync(path.join(OUT, "jk-wardrobe-v3.md"), md, "utf8");

const meta = {
  hair: HAIR,
  body: BODY,
  counts: rows.reduce((m, r) => (m[r.slot] = (m[r.slot] || 0) + 1, m), {}),
  total: rows.length
};
fs.writeFileSync(path.join(OUT, "jk-variants-v3.json"), JSON.stringify(meta, null, 2), "utf8");
console.log("total:", rows.length, meta.counts);
