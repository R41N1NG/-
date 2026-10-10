/* ═══════════════════════════════════════════════════════════
 * 十一 · 锚点旁证（关键词对照，只打 console）
 * ═══════════════════════════════════════════════════════════ */

/**
 * 每轮 AI 消息后检查锚点：命中就提示「/解锁 X」。
 *   · 主路：关键词表（`ANCHOR_KEYWORDS`）—— 本版模型不再输出任何标记，只能靠正文认
 *   · 兼容：正文里若还写了 `<AnchorProposal>字段</AnchorProposal>` 也照收
 * ⚠️ **只提示、不写变量**：锚点只有玩家自己发 /解锁 才会翻开。
 */
function proposeAnchors(text, messageId) {
  const t = String(text ?? '');
  if (!t) return [];
  const hits = new Set();
  for (const m of t.matchAll(/<AnchorProposal>\s*([^<\s]+)\s*<\/AnchorProposal>/g)) hits.add(m[1]);
  const known = readKnown() || {};
  const skips = [];
  for (const f of ALL_FIELDS) {
    if (known[f] === true) continue;                          // 已解锁的不再提
    const kws = ANCHOR_KEYWORDS[f] || [];
    if (!kws.length) continue;
    const hitWords = kws.filter((k) => t.includes(k));
    if (!hitWords.length) continue;
    /* 2026-10-08（gpt 03 号：anchor 3 红）：**取消 second-signal 旁路**。
       旧写法是「命中词全是地点名 且 正文里有事件动词」就照提议 —— 于是
         · 「在幽寂谷里胁迫叶红缨屈从」把「进入幽寂谷／离开幽寂谷」一起提了出来；
         · 「在葬魔渊边失足坠渊」把「进入葬魔渊」也提了出来；
       地点名 + 任意事件动词，并不证明**这个地点类锚点**本身发生。
       现在：命中词全是地点名 ⇒ 一律不提议；复合词（「进入幽寂谷」「驰援天溪」）不是裸地点名，
       自己能命中就照旧提议。 */
    const onlyLocation = hitWords.every((k) => ANCHOR_LOCATION_ONLY.includes(k));
    if (onlyLocation) {
      skips.push(`${f}（命中词全是地点名 ${hitWords.join('、')} ⇒ 不提议：地点名不等于该事件发生）`);
      continue;
    }
    hits.add(f);
  }
  if (skips.length) console.log(TAG, `🔍 [旁证·已抑制] ${skips.join('；')}`);
  if (!hits.size) return [];
  for (const f of hits) {
    const ok = ALL_FIELDS.includes(f);
    console.log(TAG, `[旁证·关键词] ${f}${ok ? '' : '（⚠️ 不在字段台账里）'} —— 若认可，发送 /解锁 ${f}`
      );
    if (!ok) continue;
    
    console.log(TAG, `[旁证·关键词] ${f} 的触发词在正文里出现了 —— 若模型没在 <实际发生> 里记它，`
      + `说明漏记了（可手工 /解锁 ${f}）。`);
  }
  return [...hits];
}

