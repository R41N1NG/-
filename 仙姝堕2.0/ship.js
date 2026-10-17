"use strict";
const { spawnSync } = require("node:child_process");
if (process.argv.includes("--full"))
  throw Error("本期尚无额外全量实机探针；使用默认离线交付，实机由主人验收。");
const tests = spawnSync(
  process.execPath,
  [
    "--test",
    "tests/core.test.cjs",
    "tests/player_recovery.test.cjs",
    "tests/new_characters.test.cjs",
    "tests/neutral_nodes.test.cjs",
    "tests/xibei.test.cjs",
    "tests/relic_fanfare.test.cjs",
    "tests/negative_favor.test.cjs",
    "tests/gm_panel.test.cjs",
    "tests/panel_actions.test.cjs",
    "tests/realm_feedback.test.cjs",
    "tests/grand_eras.test.cjs",
    "tests/templates.test.cjs",
    "tests/settlement_effects.test.cjs",
    "tests/promotion.test.cjs",
    "tests/metric_events.test.cjs",
    "tests/area_backgrounds.test.cjs",
    "tests/ui.test.cjs",
    "tests/opening_host.test.cjs",
    "tests/youjigu_map.test.cjs",
    "tests/map_integration.test.cjs",
    "tests/ui_discipline.test.cjs",
    "tests/fx_queue.test.cjs",
  ],
  { cwd: __dirname, stdio: "inherit" },
);
if (tests.status !== 0) process.exit(tests.status || 1);
require("./build").build();
// 成品回读依赖本轮构建，不与源码测试并发读取上轮PNG。
const artifacts = spawnSync(process.execPath, ["--test", "tests/v21_integration.test.cjs"],
  { cwd: __dirname, stdio: "inherit" });
if (artifacts.status !== 0) process.exit(artifacts.status || 1);
require("./deploy_to_tavern.cjs").deploy();
