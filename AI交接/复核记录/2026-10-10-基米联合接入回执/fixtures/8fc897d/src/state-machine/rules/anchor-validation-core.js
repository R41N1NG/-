/** 身份：gpt。锚点资格与指纹核，来源状态必须由调用方显式传入。 */
function createXsdAnchorRules(deps) {
 const { ALL_FIELDS, normalizeAnchorName, anchorEvidenceIn, deflowerEvidenceIn, autoEventGate, console, TAG } = deps;
const MINGQI_PREREQ = {
  灼酒流炎穴成形: ['叶红缨处女丧失'],
  九幽玄阴穴成形: ['孤月处女丧失'],
  心魔茶璎乳成形: ['闻观语处女丧失'],
  般若菩提菊成形: ['楚灵夜处女丧失', '楚灵夜后窍开发'],
  灵犀同心成形: ['苏瑶处女丧失', '苏玲处女丧失'],
  北冥潮生穴成形: ['雨霏柔处女丧失'],
  玉虎噙香乳成形: ['云织梦处女丧失'],
  梅蕊穴成形: ['花芷凝处女丧失'],
  冰魄剑心穴成形: ['苏倾寒处女丧失'],
  清歌弦鸣穴成形: ['慕容清歌处女丧失'],
  流焰叠薪穴成形: ['顾云舒处女丧失'],
  凤凰羽花成形: ['陆烬颜处女丧失'],
};


/** 内容哈希指纹（用于精确消息去重，比正文长度判定更可靠） */
function hashText(str) {
  const s = String(str || '');
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) + s.charCodeAt(i);
    h |= 0;
  }
  return (h >>> 0).toString(36) + '_' + s.length;
}

function validateAnchors(listRaw, prose, messageId, knownNow, deflowerNow, sourceState) {
  const list = Array.isArray(listRaw) ? listRaw : [];
  const knownPre = (knownNow && typeof knownNow === 'object') ? knownNow : {};
  /* 2026-10-08（主人确认「肯定算」）：**破身与成形常在同一场戏**（第十五—十六章：破处 → 灼酒流炎穴成形）。
     所以前置不只认已记账的 `X处女丧失`，还认**本轮**的两条证据：
       · 本轮 <破处> 簿里出现该持有者（结构化）；
       · 本轮正文里出现该持有者名 **且** 命中 DEFLOWER_HARD_RES 硬词（沿用既有「防真破身被漏标误杀」兜底）。 */
  const holdersNow = Array.isArray(deflowerNow)
    ? deflowerNow.map((x) => String((x && x.持有者) || x || '').trim()).filter(Boolean)
    : [];
  const 前置满足 = (k) => {
    if (knownPre[k] === true) return true;
    if (!k.endsWith('处女丧失')) return false;
    const holder = k.slice(0, -'处女丧失'.length);
    if (!holder) return false;
    if (deflowerEvidenceIn(prose, holder).ok) return true;
    return false;
  };
  const good = [], bad = [], dropped = [];
  for (const raw of list) {
    const f = normalizeAnchorName(String(raw).trim());
    if (!f) continue;
    if (!ALL_FIELDS.includes(f)) { bad.push(String(raw).trim()); continue; }
    /* 2026-10-08（主人当面指定）：名器成形要先过**前置**（持有者已破身；同轮破身也算）。 */
    const need = MINGQI_PREREQ[f];
    if (need) {
      const missing = need.filter((k) => !前置满足(k));
      if (missing.length) {
        dropped.push(`${f}（前置未满足：${missing.join('、')}）`);
        console.warn(TAG, `⛔ [名器前置] 第 ${messageId} 楼丢弃「${f}」：还差 ${missing.join('、')}（本轮的 <破处> 簿与正文硬词都没给出依据）`
          + `（名器成形的硬前置：持有者必须先破身。确实发生了请先补发「/解锁 ${missing[0]}」）`);
        continue;
      }
    }
    const dateGate = autoEventGate(f, sourceState || {});
    if (!dateGate.ok) {
      dropped.push(f + '（' + dateGate.因由 + '）');
      console.warn(TAG, '[世界事件闸] 第 ' + messageId + ' 楼丢弃「' + f + '」：' + dateGate.因由);
      continue;
    }
    const lm = /^(.+?)处女丧失$/.exec(f);
    if (lm && !deflowerEvidenceIn(prose, lm[1]).ok) {
      dropped.push(f + '（缺少该主体的已发生实证）');
      console.warn(TAG, '[主体实证] 第 ' + messageId + ' 楼丢弃「' + f + '」：未证实该主体的事实');
      continue;
    }
    const ev = anchorEvidenceIn(prose, f);
    if (!ev.ok) {
      dropped.push(`${f}（${ev.why}）`);
      console.warn(TAG, `⛔ [锚点闸门] 第 ${messageId} 楼丢弃「${f}」：${ev.why}` + `（这条是准入／跳段锚点，凭一句空话不能算它发生。确实发生了就发「/解锁 ${f}」手工补）`);
      continue;
    }
    good.push(f);
  }
  return { good, bad, dropped };
}

return Object.freeze({MINGQI_PREREQ, hashText, validateAnchors});
}
