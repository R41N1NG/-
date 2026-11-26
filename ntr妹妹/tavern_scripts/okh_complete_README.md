# 奥森德 · 后台整合脚本说明 (0.2.0 / R4)

## 产出文件

- **`okh_complete_autostart.js`（单文件开箱版，推荐）**：已将 `autostart.js` 附着到完整运行时末尾，只需在酒馆助手启用这一份脚本即可自动启动 `OKH_APP.start()`，并在首楼场景登记初始状态；重复加载不会重置既有存档。可通过 `await OKH_CARD_READY` 与 `OKH_APP.info()` 检查启动状态。
- **`okh_complete.js`（纯净运行库，21 模块）**：适合自备启动器的脚本上下文；同上下文执行 `await OKH_APP.start()` 即可。
- **严禁重复挂载**：不要同时启用旧核心、旧应用合订本，也不要同时启用本目录里的两个文件。

## 构成与校验

- 核心（9 模块）：`okh_utils` / `okh_rules` / `okh_activity` / `okh_effects` / `okh_events` / `okh_nodes` / `okh_turn` / `okh_api` / `okh_adapter`
- 应用（12 模块）：`okh_app_data` / `okh_app_rules` / `okh_app_time` / `okh_app_migrate` / `okh_app_config` / `okh_app_world` / `okh_app_adapter` / `okh_app_parse` / `okh_app_hook` / `okh_app_debug` / `okh_app_hud` / `okh_app_entry`
- 启动附着：`奥森德/scripts/autostart.js`（仅随 `okh_complete_autostart.js` 合并输出）

## 配套检查命令

```powershell
node 奥森德/scripts/build.cjs
node --test 奥森德/scripts/test_card.cjs
node 奥森德/scripts/test_foundation.cjs
node --test 奥森德/scripts/review-regressions.cjs
```
