"use strict";
const { writeMetric, metricSpec, canRecover } = require("./character_stages");

// 数值事件申报：模型每轮至多一个 <好感事件> 标签，申报「档位」或「锚点ID」＋原文依据；
// 分值、上限、冷却全部由配置与后台决定，模型只有举证权，没有定价权。
function stripForEvidence(text) {
  return String(text)
    .replace(/<(?:think[^>]*|analysis)[^>]*>[\s\S]*?<\/(?:think[^>]*|analysis)>/gi, "")
    .replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi, "")
    .replace(/<Status_block>[\s\S]*?<\/Status_block>/gi, "")
    .replace(/<好感事件>[\s\S]*?(?:<\/好感事件>|(?=<Status_block>|$))/g, "");
}
function parseMetricEvent(body) {
  const visible = String(body)
    .replace(/<(?:think[^>]*|analysis)[^>]*>[\s\S]*?<\/(?:think[^>]*|analysis)>/gi, "")
    .replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi, "");
  const tags = [...visible.matchAll(/<好感事件>([\s\S]*?)(?:<\/好感事件>|(?=<Status_block>|$))/g)];
  if (tags.length !== 1 || (visible.match(/<好感事件>/g)||[]).length !== 1) return { ok: false, reason: "申报标签缺失或不止一个" };
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
function createMetricEvents(defs, profiles, promotions) {
  const table = Object.entries(defs || {});
  // 好感上限梯：按晋升线配置取「当前阶段对应的下一节点阈值」——完成节点之前，好感不得越过该数值
  const ladders = {};
  for (const [, p] of Object.entries(promotions || {})) {
    const cond = (p.conditions || []).find((c) => c.kind === "metric");
    if (!cond) continue;
    (ladders[p.character] ||= []).push({
      threshold: Number(cond.value),
      fromStage: p.fromStage, identity: p.conditions?.find(c=>c.kind === "identity")?.value,
    });
  }
  function favorCap(stat, character, profilesRef) {
    const list = ladders[character];
    if (!list || !list.length) return null;
    const stage =
      stat.completed_character_stages?.[character] ||
      profilesRef?.[character]?.initialStage;
    const candidates = list.filter((x) => x.fromStage === stage && (!x.identity || x.identity === stat.身份));
    if (!candidates.length) return null;
    return Math.min(...candidates.map((x) => x.threshold));
  }
  function lookup(character) {
    return table.find(([, cfg]) => cfg.character === character);
  }
  function eventLabel(cfg,via){const anchor=(cfg.anchors||[]).find(x=>x.id===via);return anchor?.label || (anchor?.desc ? anchor.desc.split(/[（，、：]/)[0].replace(/^(与她|给她|赠她|为她|替她|帮她|当众|主动)/,'').slice(0,8) : via==='记心上'?'交心':via==='记恨'?'不睦':'互动');}
  function record(stat,cfg,via,delta,storyCount,evidence){
    stat.favor_log ||= {};(stat.favor_log[cfg.character] ||= []).unshift({label:eventLabel(cfg,via),delta,via,turn:storyCount,note:evidence.slice(0,40)});
    if(stat.favor_log[cfg.character].length>12)stat.favor_log[cfg.character].length=12;
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
    const visible = visibleCharacters(stat);
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
    const spec = metricSpec(profiles, cfg.character, cfg.metric.key);
    let current = stat.character_metrics?.[cfg.character]?.[cfg.metric.key] ?? spec.default;
    writeMetric(stat,profiles,cfg.character,cfg.metric.key,current);
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
    if (s.manual && s.manual["metric." + cfg.character + "." + cfg.metric.key] !== undefined){record(stat,cfg,via,0,storyCount,parsed.evidence);return drop(stat,storyCount,cfg.character+" 好感处于人工覆盖，自动申报拒绝");}
    if(delta>0 && !canRecover(stat,profiles,cfg.character,via,parsed.evidence))return drop(stat,storyCount,"当前负好感档位不接受该正向事件");
    // 好感上限铁律：完成节点之前，好感不得越过该节点的数值
    const permanent=stat.character_metric_caps?.[cfg.character]?.[cfg.metric.key];
    const cap = Math.min(favorCap(stat,cfg.character,profiles)??spec.max,Number.isFinite(permanent)?permanent:spec.max);
    if(delta>0 && Number.isFinite(permanent) && current>=permanent){record(stat,cfg,via,0,storyCount,parsed.evidence);return drop(stat,storyCount,"好感永久上限为−50，不能恢复到−49及以上");}
    if (delta > 0 && cap !== null) {
      if (current >= cap){record(stat,cfg,via,0,storyCount,parsed.evidence);return drop(stat, storyCount, cfg.character + " 好感已达当前节点上限（" + cap + "）——完成对应专属剧情后方可继续累积");}
      if (current + delta > cap) delta = cap - current;
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
    record(stat,cfg,via,value-current,storyCount,parsed.evidence);
    changes.push({ character: cfg.character, key: cfg.metric.key, delta, value, via });
    return { changes };
  }
  return { apply, lookup };
}
module.exports = { createMetricEvents, parseMetricEvent, stripForEvidence };
