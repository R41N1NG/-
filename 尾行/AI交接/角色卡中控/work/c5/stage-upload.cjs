const fs = require("node:fs");
const path = require("node:path");

const SRC = "E:/角色卡制作/尾行";
const DST = path.join(__dirname, "..", "..", "work", "gh-repo", "尾行", "AI交接", "角色卡中控");

fs.mkdirSync(DST, { recursive: true });

const dirs = ["src", "tests", "scripts", "tools", "最新角色卡", "dist"];
for (const d of dirs) {
  const from = path.join(SRC, d);
  if (fs.existsSync(from)) fs.cpSync(from, path.join(DST, d), { recursive: true });
}

const files = [
  "build.js", "build-runtime.js", "build-statusbar.js", "package.json", "状态栏.html",
  "DEEPSEEK交接.md", "GEMINI.md", "GEMINI交接.md", "写作指导.md", "尾行题材设计.md",
  "数值策划.md", "申报协议与词表.md", "行为册.md", "角色制作规范.md", "项目目录索引.md", "骰子素材规范.md"
];
for (const f of files) {
  const from = path.join(SRC, f);
  if (fs.existsSync(from)) fs.copyFileSync(from, path.join(DST, f));
}

// 美术清单（JK 试水）
const artDir = path.join(DST, "美术");
fs.mkdirSync(artDir, { recursive: true });
for (const f of ["jk-for-gpt.md", "jk-wardrobe-v3.jsonl", "index.json", "jk-variants-v3.json", "jk-comfy-prompts.md"]) {
  const from = path.join(SRC, "work", "art", f);
  if (fs.existsSync(from)) fs.copyFileSync(from, path.join(artDir, f));
}

fs.writeFileSync(path.join(DST, ".gitignore"), "node_modules/\nwork/\n", "utf8");

const readme = `# 尾行 · 角色卡中控（AI 交接）

本目录是「尾行」角色卡的中控工程：引擎 + 状态栏 UI + 测试 + 构建脚本。
图形素材在上级 [图片/](../图片/)，美术提示词清单在本目录 \`美术/\`。

## 一句话

沙盒都市尾随题材 TRPG 卡：白天自由、夜晚严苛；动作只认胶囊，判定全在中控（单一真源 \`src/runtime/\`），大模型只负责按回执演出。

## 目录

| 路径 | 作用 |
| :--- | :--- |
| \`src/runtime/\` | 引擎（game / checks / ledger / map / album / target_state …） |
| \`src/host/glue.js\` | 宿主胶水：变量、回执注入、开场切换 |
| \`src/config/\` | rules / lexicon / lifepack / wardrobe |
| \`状态栏.html\` | 状态栏 UI（esbuild 打成 \`dist/wx-statusbar.user.js\`） |
| \`tests/\` | 279 项单测（\`node --test tests/*.test.js\`） |
| \`最新角色卡/尾行.json\` | 交付卡（Spec V2，含内嵌世界书） |
| \`美术/\` | JK 试水图清单（GPT / ComfyUI）与运行时索引 |

## 构建

\`\`\`bash
node build.js            # 产出 dist/runtime.js、dist/wx-statusbar.user.js、最新角色卡/尾行.json
node --test tests/*.test.js
\`\`\`

## 现状（2026-10-21）

- 279 项单测全绿；卡 863,604 字节。
- 警觉：0–20 毫无察觉 / 21–40 不安 / 41–60 起疑 / 61–80 确认 / 81+ 反应；五格竖条（2 绿 1 黄 1 橘 1 红）。
- 过档行为：提速（跟速 DC13）／回头·绕路·进店（按胆量敏锐）／开跑／摊牌，一晚每档一次。
- 相册：拍照只出未拥有，角度受距离限制，PI +2 / 贴身正面 +3 / 套装齐 +2；贴墙 UI + 6 秒即时卡片；图片走本地 \`user/images/wx_wardrobe/\`。
- 待办：白天/夜晚两阶段分离；缩略图批量脚本；冲突系统接线。
`;
fs.writeFileSync(path.join(DST, "README.md"), readme, "utf8");

const count = [];
for (const d of dirs) {
  const p = path.join(DST, d);
  if (!fs.existsSync(p)) continue;
  let n = 0;
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) walk(path.join(dir, e.name));
      else n++;
    }
  })(p);
  count.push(`${d}:${n}`);
}
console.log("copied ->", DST, count.join(" "));
