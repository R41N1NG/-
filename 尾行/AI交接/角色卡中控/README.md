# 尾行 · 角色卡中控（AI 交接）

本目录是「尾行」角色卡的中控工程：引擎 + 状态栏 UI + 测试 + 构建脚本。
图形素材在上级 [图片/](../图片/)，美术提示词清单在本目录 `美术/`。

## 一句话

沙盒都市尾随题材 TRPG 卡：白天自由、夜晚严苛；动作只认胶囊，判定全在中控（单一真源 `src/runtime/`），大模型只负责按回执演出。

## 目录

| 路径 | 作用 |
| :--- | :--- |
| `src/runtime/` | 引擎（game / checks / ledger / map / album / target_state …） |
| `src/host/glue.js` | 宿主胶水：变量、回执注入、开场切换 |
| `src/config/` | rules / lexicon / lifepack / wardrobe |
| `状态栏.html` | 状态栏 UI（esbuild 打成 `dist/wx-statusbar.user.js`） |
| `tests/` | 279 项单测（`node --test tests/*.test.js`） |
| `最新角色卡/尾行.json` | 交付卡（Spec V2，含内嵌世界书） |
| `美术/` | JK 试水图清单（GPT / ComfyUI）与运行时索引 |

## 构建

```bash
node build.js            # 产出 dist/runtime.js、dist/wx-statusbar.user.js、最新角色卡/尾行.json
node --test tests/*.test.js
```

## 现状（2026-10-21）

- 279 项单测全绿；卡 863,604 字节。
- 警觉：0–20 毫无察觉 / 21–40 不安 / 41–60 起疑 / 61–80 确认 / 81+ 反应；五格竖条（2 绿 1 黄 1 橘 1 红）。
- 过档行为：提速（跟速 DC13）／回头·绕路·进店（按胆量敏锐）／开跑／摊牌，一晚每档一次。
- 相册：拍照只出未拥有，角度受距离限制，PI +2 / 贴身正面 +3 / 套装齐 +2；贴墙 UI + 6 秒即时卡片；图片走本地 `user/images/wx_wardrobe/`。
- 待办：白天/夜晚两阶段分离；缩略图批量脚本；冲突系统接线。
