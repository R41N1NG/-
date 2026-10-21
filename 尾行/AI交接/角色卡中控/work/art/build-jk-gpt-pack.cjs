// 把 v3 清单整理成「直接喂 GPT」的单一文件。
// 注意：markdown 里的反引号统一先用 @@ 占位，最后一次性替换，避免模板字符串截断。
const fs = require("node:fs");
const path = require("node:path");
const OUT = __dirname;

const rows = fs.readFileSync(path.join(OUT, "jk-wardrobe-v3.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
const meta = JSON.parse(fs.readFileSync(path.join(OUT, "jk-variants-v3.json"), "utf8"));

const HAIR_CN = { long: "长发", ponytail: "马尾", twintails: "双马尾", bob: "短发及颈" };
const BODY_CN = { slim: "清瘦 B", normal: "匀称 D", full: "丰腴 E" };
const NEG = rows[0].negative;
const NEG_ANCHOR = NEG.replace("full body, ", "");   // 锚点本身就是全身，负面里不能禁全身

let md = `# 尾行 · JK 服装图清单（GPT 生成用 · 完整版）

共 **${meta.total} 张**：头饰 ${meta.counts.head} · 上装 ${meta.counts.top} · 下装 ${meta.counts.bottom} · 袜子 ${meta.counts.socks} · 鞋子 ${meta.counts.shoes}

---

## 0. 一致性协议（最重要，先读）

之前生成出来「不是一个人」，是因为模型每次都从头编一个人。按下面四条走，能压住九成漂移：

1. **先出锚点，再出图**：先生成第 2 节的锚点（4 张全身 + 6 张上装），挑最顺眼的当参考图；
2. **每张图都把锚点图作为参考图上传**，并附一句：
   > Same character as the reference image. Keep the same height, shoulder width, waistline, skin tone and hair length. Only change the garment and the framing. Do not redesign the person.
3. **同一变体连着做**：一个「发型 × 体型」列做完，再换下一列；不要来回跳；
4. **每张都逐字带上锚点句与负面词**，不要改写、不要精简。

> 提示词里没有写 B/D/E 杯，只写体态（small / fuller / full bust）。杯型是内部口径，写进 prompt 容易被审核打回，也容易画成夸张比例。

---

## 1. 锚点定义

### 发型（影响头饰）

| key | 中文 | 英文锚点 |
| :--- | :--- | :--- |
| long | 长发 | ${meta.hair.long} |
| ponytail | 马尾 | ${meta.hair.ponytail} |
| twintails | 双马尾 | ${meta.hair.twintails} |
| bob | 短发及颈 | ${meta.hair.bob} |

### 体型（只影响上装）

| key | 中文 | 英文锚点 |
| :--- | :--- | :--- |
| slim | 清瘦（约 B） | ${meta.body.slim.text} |
| normal | 匀称（约 D） | ${meta.body.normal.text} |
| full | 丰腴（约 E） | ${meta.body.full.text} |

---

## 2. 第一步：4 张全身锚点（先把人定下来）

> 背身 3/4，不露脸；背景与光线固定。生成后挑一张当全系列的参考图。

`;

let anchorIdx = 0;
for (const [k, hair] of Object.entries(meta.hair)) {
  anchorIdx++;
  md += `### 锚点 ${anchorIdx} · ${HAIR_CN[k]}（@@anchor_${k}@@）

**file** · @@assets/wardrobe/jk/anchors/${k}.png@@ · 1024x1536

@@@text
full body character reference, standing three-quarter back view, face turned away and not visible, East Asian young woman, 160 cm, ${meta.body.normal.text}, ${hair}, light warm skin tone, wearing navy school blazer over white shirt, navy pleated miniskirt, black knee-high socks, black leather loafers, plain light-grey seamless backdrop, soft even studio light, anime fashion illustration, clean lineart, soft cel shading, whole figure head to shoes, centered, no props, no text, no logo
@@@

负面：@@${NEG_ANCHOR}@@

`;
}
md = md.replace(/@@@/g, "```").replace(/@@/g, "\u0060");

md += `### 上装锚点（3 张，按体型）

> 通用版上装用它：头发裁出画面，只锁躯干与体型。

`;
let ti = 0;
for (const [b, def] of Object.entries(meta.body)) {
  ti++;
  md += `#### 上装锚点 ${ti} · ${BODY_CN[b]}（@@top_base_${b}@@）

**file** · @@assets/wardrobe/jk/anchors/top_base_${b}.png@@ · 768x1024

@@@text
upper body character reference, shoulders to hips, back three-quarter view, hair out of frame, East Asian young woman, 160 cm, ${def.text}, wearing navy single-breasted school blazer over a white shirt, plain light-grey seamless backdrop, soft even studio light, anime fashion illustration, clean lineart, soft cel shading, centered, no props, no text, no logo
@@@

负面：@@${NEG_ANCHOR}@@

`;
}

md += `### 长发上装锚点（3 张，按体型）

> 长发版上装用它：头发压在肩领上，同时锁体型。

`;
let li = 0;
for (const [b, def] of Object.entries(meta.body)) {
  li++;
  md += `#### 长发上装锚点 ${li} · ${BODY_CN[b]}（@@top_long_${b}@@）

**file** · @@assets/wardrobe/jk/anchors/top_long_${b}.png@@ · 768x1024

@@@text
upper body character reference, shoulders to hips, back three-quarter view, long straight black hair falling over the shoulders and collar, straight bangs, East Asian young woman, 160 cm, ${def.text}, wearing navy single-breasted school blazer over a white shirt, plain light-grey seamless backdrop, soft even studio light, anime fashion illustration, clean lineart, soft cel shading, centered, no props, no text, no logo
@@@

负面：@@${NEG_ANCHOR}@@

`;
}

md += `---

## 3. 逐张清单

`;

function block(r) {
  return `**[${r.angle}]** · ${r.size}

file · @@${r.file}@@

@@@text
${r.prompt}
@@@

负面：@@${NEG}@@

`;
}

function group(title, list, note) {
  if (!list.length) return "";
  let out = `### ${title}

${note ? note + "\n\n" : ""}`;
  let last = "";
  for (const r of list) {
    if (r.id !== last) {
      out += `#### ${r.name}（@@${r.id}@@）\n\n`;
      last = r.id;
    }
    out += block(r);
  }
  return out;
}

md += `---

## 3. 逐张清单

`;

md += `## 3.1 头饰（按发型）

`;
for (const h of Object.keys(meta.hair)) {
  md += group(`发型：${HAIR_CN[h]}（@@${h}@@）`, rows.filter(r => r.slot === "head" && r.variant === h),
    `> 参考图用锚点「${HAIR_CN[h]}」那张。`);
}

md += `\n## 3.2 上装 · 通用版（头发裁出画面）\n\n`;
for (const b of Object.keys(meta.body)) {
  md += group(`通用 × ${BODY_CN[b]}（@@base_${b}@@）`, rows.filter(r => r.slot === "top" && r.variant === `base_${b}`),
    `> 参考图用任意一张锚点，并在提示词里保留这句体型：${meta.body[b].text}。`);
}

md += `\n## 3.3 上装 · 长发版（头发压在肩领上）\n\n`;
for (const b of Object.keys(meta.body)) {
  md += group(`长发 × ${BODY_CN[b]}（@@long_${b}@@）`, rows.filter(r => r.slot === "top" && r.variant === `long_${b}`),
    `> 参考图用锚点「长发」那张。`);
}

md += `\n## 3.4 共用：下装 / 袜子 / 鞋子\n\n`;
for (const [slot, title] of [["bottom", "下装"], ["socks", "袜子"], ["shoes", "鞋子"]]) {
  md += group(title, rows.filter(r => r.slot === slot), "> 不绑定发型与体型。");
}

md += `---

## 4. 生成后自检（像不像同一个人）

| 检查项 | 合格 |
| :--- | :--- |
| 肩宽、腰线位置一致 | 同一件衣服的不同角度不改身形 |
| 肤色、发长一致 | 与锚点逐张比对 |
| 百褶是硬褶 | 褶线笔直，不软塌 |
| 袜口有勒痕 | 过膝/及膝袜在腿上有浅压痕 |
| 脸完全在画外 | 不能出现眼睛、鼻、嘴 |
| 鞋型不跑 | 每款只保留 2 个服装 tag |

任何一项不过，**别手动改描述**：把锚点图重新上传、原 prompt 再跑一次。
`;

md = md.replace(/@@@/g, "```").replace(/@@/g, "\u0060");
fs.writeFileSync(path.join(OUT, "jk-for-gpt.md"), md, "utf8");
console.log("wrote jk-for-gpt.md", (md.length / 1024).toFixed(1), "KB");
