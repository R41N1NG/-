"use strict";
const ALERT_TIERS = [
  { name: "毫无察觉", range: "0–20", tip: "0–20 · 她完全没觉得这晚有什么不对" },
  { name: "不安", range: "21–40", tip: "21–40 · 她开始留意身后，步频变了" },
  {
    name: "起疑",
    range: "41–60",
    tip: "41–60 · 她放慢脚步、频频侧目，会试着钓你",
  },
  { name: "确认", range: "61–80", tip: "61–80 · 她确信被跟了，会抄近路或求援" },
  {
    name: "反应",
    range: "81+",
    tip: "81–100 · 她进入应激状态，随时爆发或逃向庇护所",
  },
];

function alertTierOf(snap) {
  const stage =
    snap && snap.target && Number.isFinite(snap.target.alertStage)
      ? snap.target.alertStage
      : 0;
  const idx = Math.min(4, Math.max(0, stage));
  return Object.assign({ idx }, ALERT_TIERS[idx]);
}

module.exports = { ALERT_TIERS, alertTierOf };
