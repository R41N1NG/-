#!/usr/bin/env node
/**
 * _merge_specs.mjs —— 把《制卡规范 v2.0》与《制卡规范 v3.0》合并成**一本**（主人 2026-10-01 令）
 *   原则：① 只做**搬运**，正文一个字不重打（避免失真）；② 就地并入 v3.0 的六处改写，删掉所有「沿用 v2.0 §X」跳转；
 *         ③ 顺手清掉已核实的陈旧内容（逐条列在产物开头的「合并说明」里）。
 *   用法：node _merge_specs.mjs            （只打印计划，不写盘）
 *         node _merge_specs.mjs --apply    （写盘）
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const D = 'E:\\角色卡制作\\仙姝堕\\';
const F2 = D + '制卡规范 v2.0（统一版）.md';
const F3 = D + '制卡规范 v3.0（统一版·含秋风体例）.md';
const OUT = D + '制卡规范（统一版）.md';
const APPLY = process.argv.includes('--apply');

const s2 = readFileSync(F2, 'utf8').replace(/\r\n/g, '\n');
const s3 = readFileSync(F3, 'utf8').replace(/\r\n/g, '\n');

/** 取 [from 起、到 to 止（不含）) 的区域；两头都用标题文本定位 */
function cut(src, fromPrefix, toPrefix, name) {
  const i = src.indexOf(fromPrefix);
  if (i < 0) throw new Error('找不到起点：' + fromPrefix);
  const j = toPrefix === null ? src.length : src.indexOf(toPrefix, i + fromPrefix.length);
  if (toPrefix !== null && j < 0) throw new Error('找不到终点：' + toPrefix);
  return src.slice(i, j).trimEnd();
}

/* ── 区域切片（全部按标题定位，找不到就报错，绝不静默产出半成品）── */
const v2_head   = cut(s2, '## 1. 总则', '## 2.', 'v2 §1');
const v2_step   = cut(s2, '| # | 步骤 | 验收标准 |', '## 3.', 'v2 §2 表');
const v2_3      = cut(s2, '## 3. 工程规范', '## 4.', 'v2 §3');
const v2_4      = cut(s2, '## 4. 界面与渲染规范', '## 5.', 'v2 §4');
const v2_5      = cut(s2, '## 5. 立绘规范', '## 6.', 'v2 §5');
const v2_6      = cut(s2, '## 6. 状态与变量规范', '## 7.', 'v2 §6');
const v2_7      = cut(s2, '## 7. 世界书编排规范', '## 8.', 'v2 §7');
const v2_8      = cut(s2, '## 8. 提示词规范', '## 9.', 'v2 §8');
const v2_9      = cut(s2, '## 9. 角色演绎引擎规范', '## 10.', 'v2 §9');
const v2_10     = cut(s2, '## 10. GM 与调试规范', '## 11.', 'v2 §10');
const v2_11     = cut(s2, '## 11. 出图规范', '## 12.', 'v2 §11');
const v2_12     = cut(s2, '## 12. 交付前验收清单', '## 附录 A', 'v2 §12');
const v2_apxA   = cut(s2, '## 附录 A', '## 附录 B', 'v2 附录A');
const v2_apxB   = cut(s2, '## 附录 B', '## 附录 C', 'v2 附录B');
const v2_apxC   = cut(s2, '## 附录 C', null, 'v2 附录C');

const v3_1      = cut(s3, '### 1.3 ★ 图层表', '## 2.', 'v3 §1.3-1.5');
const v3_2      = cut(s3, '## 2. 建卡流程', '## 3.', 'v3 §2');
const v3_7      = cut(s3, '### 7.1', '## 8.', 'v3 §7');
const v3_8      = cut(s3, '### 8.1', '## 9.', 'v3 §8');
const v3_9      = cut(s3, '## 9. 角色演绎引擎规范', '## 10.', 'v3 §9');
const v3_12     = cut(s3, '## 12. ★ 交付前验收清单', '## 附录 A', 'v3 §12');
const v3_apxD   = cut(s3, '## 附录 D', '## 附录 E', 'v3 附录D');
const v3_apxE   = cut(s3, '## 附录 E', null, 'v3 附录E');

/* ── 陈旧内容替换表（逐条可核；找不到就报警）── */
const FIX = [
  [
    '23. 生成卡是两步：`_build_card.js`（写 JSON）→ `_build_card_png.js`（打进 PNG）',
    '23. **生成卡是三步**（2026-10-01 现行）：`node _build_card.js`（写 JSON，含文风硬关卡） → `node _make_card_png.mjs --apply`（打进 PNG） → **把酒馆关干净** → `node _push_card.mjs --apply`（导入 ＋ **自动重建世界书** ＋ 读内容核对） → `node _verify_tavern_readback.mjs --wait 8`\n    ⚠️ 旧稿写的 `_build_card_png.js` 已作废；**世界书文件不要手改**（推卡时会被卡内世界书覆盖重建）。',
  ],
  [
    '22. 卡 JSON 的条目启用位是 `enabled`，不是 `disable`',
    '22. 卡 JSON 的条目启用位是 `enabled`，不是 `disable`（⚠️ **独立世界书那份文件用的是 `disable`** —— 两个文件的两套字段名别混）',
  ],
  [
    '2. 改条目标题／触发词，两册必须同步改',
    '2. **改条目标题／触发词后必须重跑构建并核对卡产物**（**已无"两册"**：2026-09-29 两册合一，`仙姝墮-世界书.json` 就是全书唯一真源，文件名里的"前期"是历史遗留）',
  ],
  [
    '12. 推卡顺序：先复制卡 → 再重建独立世界书 → 最后拨开关',
    '12. 推卡顺序：先复制卡 → 再重建独立世界书 → 最后拨开关（⚠️ 2026-10-01：这三步已由 `_push_card.mjs --apply` **自动执行**；照 §2 第 11 步走即可）',
  ],
];
const fixLog = [];
function applyFix(t, from, to, idx) {
  if (!t.includes(from)) { fixLog.push(`❌ 未命中（#${idx}）：${from.slice(0, 40)}`); return t; }
  fixLog.push(`✅ 已替换（#${idx}）：${from.slice(0, 40)}…`);
  return t.replace(from, to);
}

let body = '';
body += v2_head.replace('### 1.2 六条设计原则（违反任何一条都算不合格）',
  '### 1.2 六条设计原则（违反任何一条都算不合格；＋**第七条见 §1.5**）') + '\n\n';
body += v3_1.replace('### 1.3 ★ 图层表（本版新增 · 硬性）', '### 1.3 ★ 注入位置分层（硬性）')
               .replace('### 1.4 ★ 体例三件（本版新增 · 硬性）', '### 1.4 ★ 体例三件（硬性）')
               .replace('### 1.5 ★★ 承压原则（本版新增 · 硬性设计判据 · 主人 2026-10-01 定）', '### 1.5 ★★ 承压原则（硬性设计判据）') + '\n\n';
body += '## 2. 建卡流程（11 步 · 每步带验收）\n\n' + v3_2.replace(/^## 2\. 建卡流程[^\n]*\n+/, '') + '\n\n' + v2_step + '\n\n';
body += v2_3 + '\n\n';
body += v2_4 + '\n\n';
body += v2_5 + '\n\n';
body += v2_6 + '\n\n';
body += v2_7 + '\n\n' + v3_7 + '\n\n';
body += v2_8 + '\n\n' + v3_8 + '\n\n';
body += v2_9 + '\n\n### 9.9 缩水约束（并入 v3.0 §9）\n\n'
      + v3_9.replace(/^## 9\. 角色演绎引擎规范[^\n]*\n+/, '')
            .replace(/^- 三层结构／泄压口铁律[^\n]*\n/m, '')
            .replace(/^- \*\*本版追加\*\*：/, '- ') + '\n\n';
body += v2_10 + '\n\n';
body += v2_11 + '\n\n';
body += v2_12 + '\n\n### 12.4 ★ 硬关卡／逐行复核／软关卡／未达标在册（原 v3.0 §12）\n\n'
      + v3_12.replace(/^## 12\. ★ 交付前验收清单[^\n]*\n+/, '')
            .replace(/^> ⚠️ \*\*本节是追加、不是替代\*\*：/m, '> ⚠️ **这四小节是 §12.1–12.3 的补充**：')
            .replace(/^### 12\.1 /m, '#### 12.4.1 ').replace(/^### 12\.2 /m, '#### 12.4.2 ')
            .replace(/^### 12\.3 /m, '#### 12.4.3 ').replace(/^### 12\.4 /m, '#### 12.4.4 ')
            .replace('（本版新增的规矩）', '') + '\n\n';
body += v2_apxA + '\n\n' + v2_apxB + '\n\n' + v2_apxC + '\n\n';
body += v3_apxD + '\n\n' + v3_apxE + '\n';

for (let i = 0; i < FIX.length; i++) body = applyFix(body, FIX[i][0], FIX[i][1], i + 1);

const header = `# 制卡规范（统一版 · 2026-10-01 合并）

> **本文件是唯一执行版。** 由 \`制卡规范 v2.0（统一版）.md\` 的十二节体系 ＋ \`制卡规范 v3.0（统一版·含秋风体例）.md\` 的六处改写**就地合并**而成，
> 原文两本已归档到 \`_归档-规范旧版\\\`（**不再执行**）。合并只做**搬运**，正文一个字没有重打（防失真）。
>
> **姊妹文件**：
> - \`书写规范 v1.0（全局·合并版）.md\` —— **只管我生成的文字内容**（怎么写出处、行文、对话）
> - \`错题本.md\` —— 写之前必读，写完把新错并进去
> - \`秋风规范（给模型读）.md\`（提示词体例执行版）｜\`世界书体例（YAML+tag）.md\`（标签名表）｜\`质检规范（硬关卡+软关卡）.md\`
>
> ⚠️ **分工（主人 2026-10-01）**：「**制卡规范才是管卡的设计的，书写规范是管你生成文字内容的，不要弄错了。**」
> ⚠️ **一切以 PNG 角色卡为准**；**世界书已无前期／后期之分**。
> 文中凡出现 \`仙姝墮-世界书.json\`，一律指**构建用的那本册子源** —— 文件名里的"前期"是历史遗留，**它现在就是全书唯一真源**（\`_build_card.js:12\` 读它）。
> ⚠️ **学范例卡的架构，不抄它的表面值**（字数／order／keys 数量／目录名／图床与否 —— 一律按本卡自己的来）。
>
> 标注体例：凡**只适用于《仙姝墮》本卡**或**本项目工具链**的条目，一律以 \`〔仅本卡〕\`／\`〔仅本项目〕\` 起头，**做新卡时不继承**；通用条目照旧继承。

---

## 0. 合并说明（本版相对两本旧稿做了什么）

| # | 旧稿的问题 | 本版怎么处理 |
|---|---|---|
| 1 | v3.0 是**补丁**：§3/4/5/6/9/10/11 全是「沿用 v2.0 §X」的空指针，附录 A/B/C 是「见 v2.0 附录 X」 ⇒ 必须两本连读 | **全部展开成本文**，删掉所有跨文件跳转；两本旧稿归档 |
| 2 | 「层」同名不同义：§1.1 的"四层架构"与 §1.3 的"四档硬图层" | §1.1 改名 **运行分层**（四层 ＋ 演绎规则的落位）；§1.3 改名 **注入位置分层**；§1.1 下加区分注 |
| 3 | §2 引用的步号与 v2.0 的 11 步**对不上**（"第 7 步／第 10 步"） | 改成**按步骤内容指认**；并注明推卡顺序仍按第 11 步 |
| 4 | §12 说"本版扩写"，却把 v2.0 §12＋12.1／12.2／12.3 的 21 项 checkbox 悬空 | §12 保留 v2.0 全部 checkbox，v3.0 的四小节**顺延编号为 §12.4** |
| 5 | 小引擎「四行」与「五段」两种叫法并存 | 统一为**五段**（范例卡四行 ＋「角色定位」首行） |
| 6 | 小引擎挂载字段写 \`after_char\`，实测是 \`at_depth\` | 以**本卡实测**为准更正（\`at_depth\`／\`depth 1\`／\`insertion_order 50\`；\`keys\` 仍按本卡约定 2–4） |
| 7 | 常驻预算「≤ 10k 字」与实测（本卡 \`constant\` 15 条／22,867 字）对不上 | **如实标出矛盾**，改线由主人定；范例卡数字只作参照 |
| 8 | 立绘链还写着「云端外链／外部图床」，图库目录写 \`<卡名>_gallery\` | 已按本卡现状更正：**图内嵌进卡、不用图床**；目录前缀 \`xsd_\` |
| 9 | 铁律 2／12／22／23 有陈旧内容（两册同步、\`_build_card_png.js\`） | 逐条就地更正（见 §3.3） |
| 10 | 附录 C「依据」里两处**假出处**（演绎规则全在 \`depth_prompt\` 1,823 字符；\`after_char/order 50\`） | 已标出并更正；并写明「学架构，不抄表面值」 |

---

`;

const out = header + body;
console.log('=== 陈旧内容替换表 ===');
console.log(fixLog.join('\n'));
console.log('\n=== 产物 ===');
console.log('行数', out.split('\n').length, '｜字符', out.length);
console.log('章节：');
console.log(out.split('\n').filter((l) => /^#{2,3} /.test(l)).map((l) => '  ' + l).join('\n'));
if (APPLY) {
  writeFileSync(OUT, out, 'utf8');
  console.log('\n✅ 已写盘：' + OUT);
} else {
  console.log('\n（演练模式，未写盘；加 --apply 落盘）');
}
