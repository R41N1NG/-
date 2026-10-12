"use strict";
const { writeMetric, metricSpec } = require("./character_stages");

// 数值事件申报：模型每轮至多一个 <好感事件> 标签，申报「档位」或「锚点ID」＋原文依据；
// 分值、上限、冷却全部由配置与后台决定，模型只有举证权，没有定价权。
function stripForEvidence(text) {
  return String(text)
    .replace(/<(?:think[^>]*|analysis)[^>]*>[\s\S]*?<\/(?:think[^>]*|analysis)>/gi, "")
    .replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi, "")
    .replace(/<Status_block>[\s\S]*?<\/Status_block>/gi, "")
    .replace(/<好感事件>[\s\S]*?<\/好感事件>/g, "");
}
function parseMetricEvent(body) {
  const visible = String(body)
    .replace(/<(?:think[^>]*|analysis)[^>]*>[\s\S]*?<\/(?:think[^>]*|analysis)>/gi, "")
    .replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi, "");
  const tags = [...visible.matchAll(/<好感事件>([\s\S]*?)<\/好感事件>/g)];
  if (tags.length !== 1) return { ok: false, reason: "申报标签缺失或不止一个" };
  const parts = tags[0][1].split(/[｜|]/).map((x) => x.trim());
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2])
    return { ok: false, reason: "申报格式应为 人物名｜档位或锚点ID｜依据" };
  return {
    ok: true,
    character: parts[0],
    target: parts[1],
    evidence: parts[2].replace(/^依据[:：]\s*/, "").trim(),
  };
}
function visibleCharacters(stat) {
  return new Set([
    stat.身份,
    stat.stage_focus,
    ...(stat.在场角色 || []).map((x) => x.名),
  ]);
}
function createMetricEvents(defs, profiles) {
  const table = Object.entries(defs || {});
  function lookup(character) {
    return table.find(([, cfg]) => cfg.character === character);
  }
  function drop(stat, storyCount, reason) {
    stat.metric_diag ||= [];
    stat.metric_diag.unshift({ turn: storyCount, reason });
    if (stat.metric_diag.length > 10) stat.metric_diag.length = 10;
    return { changes: [] };
  }
  function apply(s, body, prose, storyCount) {
    const stat = (s.stat_data ||= {});
    stat.metric_state ||= {};
    stat.metric_anchor_done ||= {};
    const changes = [];
    const visible = visibleCharacters(s);
    const parsed = parseMetricEvent(body);
    if (!parsed.ok) {
      if (/<好感事件>/.test(String(body))) return drop(stat, storyCount, parsed.reason);
      return { changes };
    }
    if (!visible.has(parsed.character)) return drop(stat, storyCount, parsed.character + " 不在场，申报无效");
    const found = lookup(parsed.character);
    if (!found) return drop(stat, storyCount, parsed.character + " 未注册好感表");
    const [, cfg] = found;
    const st = (stat.metric_state[parsed.character] ||= {});
    const proseVisible = stripForEvidence(prose);
    if (!parsed.evidence || !proseVisible.includes(parsed.evidence))
      return drop(stat, storyCount, "申报依据不在本回合正文中");
    if (s.manual && s.manual["metric." + cfg.character + "." + cfg.metric.key] !== undefined)
      return drop(stat, storyCount, cfg.character + " 好感处于人工覆盖，自动申报拒绝");
    const spec = metricSpec(profiles, cfg.character, cfg.metric.key);
    let current = stat.character_metrics?.[cfg.character]?.[cfg.metric.key] ?? spec.default;
    let delta, via;
    if (cfg.metric.tiers && cfg.metric.tiers[parsed.target] !== undefined) {
      delta = cfg.metric.tiers[parsed.target];
      via = parsed.target;
      if (st.tier === via && storyCount - (st.turn || -999) < (cfg.cooldownTurns || 0))
        return drop(stat, storyCount, cfg.character + "「" + via + "」档位冷却中");
    } else {
      const anchorId = parsed.target.replace(/^锚点\s*/, "");
      const anchor = (cfg.anchors || []).find((a) => a.id === anchorId);
      if (!anchor) return drop(stat, storyCount, "锚点 " + anchorId + " 不在配置内");
      delta = anchor.delta;
      via = anchorId;
      stat.metric_anchor_done ||= {};
      if (!anchor.repeat && stat.metric_anchor_done[anchorId])
        return drop(stat, storyCount, "锚点 " + anchorId + " 为一次性事件，已结算");
      st.anchorTurn ||= {};
      if (anchor.repeat !== false && storyCount - (st.anchorTurn[anchorId] || -999) < (cfg.cooldownTurns || 0))
        return drop(stat, storyCount, "锚点 " + anchorId + " 冷却中");
    }
    const value = Math.max(spec.min, Math.min(spec.max, current + delta));
    writeMetric(stat, profiles, cfg.character, cfg.metric.key, value);
    if (cfg.metric.tiers && cfg.metric.tiers[parsed.target] !== undefined) {
      st.tier = via;
      st.turn = storyCount;
    } else {
      const anchorId = via;
      st.anchorTurn ||= {};
      st.anchorTurn[anchorId] = storyCount;
      const anchor = (cfg.anchors || []).find((a) => a.id === anchorId);
      if (anchor && anchor.repeat === false) stat.metric_anchor_done[anchorId] = true;
    }
    changes.push({ character: cfg.character, key: cfg.metric.key, delta, value, via });
    return { changes };
  }
  return { apply, lookup };
}
module.exports = { createMetricEvents, parseMetricEvent, stripForEvidence };
