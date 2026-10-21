/**
 * 她的警觉可见性：遵守「她的状态是天气不是仪表」——
 * 快照只给档位（alertStage 0~4），界面显示档位名 + 五格刻度，不报精确数值。
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createGame } = require("../src/runtime/game.js");

const html = require("./helpers/ui-source.js").readUISource();

test("快照：只给她的警觉档位，不给原始数值（明暗分离）", () => {
  const g = createGame({
    sessionSalt: "alert-test",
    target: { str: 3, agi: 4, per: 5, nrv: 4, social: 2 },
    stats: { date: 1, heart: 30, stamina: 100, cash: 800 },
  });
  const s = g.snapshot();
  assert.equal(typeof s.target.alertStage, "number", "档位必须给");
  assert.equal(s.target.alert, undefined, "原始数值不得出现在快照");
});

test("界面：终端「她的警觉」行按档位渲染五格刻度与档位名", () => {
  assert.ok(html.includes('id="alertRow"'), "缺她的警觉行锚点");
  assert.ok(html.includes('id="alertPips"'), "缺五格刻度容器");
  assert.ok(html.includes('id="alertText"'), "缺档位文案锚点");
  for (const tier of ["毫无察觉", "不安", "起疑", "确认", "反应"]) {
    assert.ok(html.includes(tier), `档位文案缺「${tier}」`);
  }
  const fnMatch = html.match(/const ALERT_TIERS = \[[\s\S]*?\];/);
  assert.ok(fnMatch, "应能定位档位表");
  assert.equal((fnMatch[0].match(/name:/g) || []).length, 5, "档位表应为五档");
  assert.ok(html.includes("snap.target.alertStage * 20") || html.includes("alertTierOf"), "刻度应由档位换算，不读原始值");
});

test("界面：心跳弹层右栏也给同一档位（不另起一套）", () => {
  assert.ok(html.includes('id="popoverHerState"'), "缺弹层右栏锚点");
  assert.ok(html.includes('id="popoverAlertPips"'), "缺弹层刻度");
  assert.ok(html.includes('id="popoverAlertText"'), "缺弹层档位名");
  assert.ok(html.includes('id="popoverAlertRange"'), "缺弹层区间");
  assert.ok(html.includes("function alertTierOf"), "两处应共用同一档位函数");
});
