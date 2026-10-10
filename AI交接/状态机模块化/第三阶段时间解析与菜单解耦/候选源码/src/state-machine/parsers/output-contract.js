/* ═══════════════════════════════════════════════════════════
 * 七 · 收尾自检
 * ═══════════════════════════════════════════════════════════ */

/**
 * 每轮 AI 消息的收尾自检：**只查状态条**（本版不再要求任何变量块，模型也不该输出）。
 *   状态条的三种外壳任一存在即算合格：`<Status_block>` ／ `<StatusBlock>` ／ `<status>`。
 * ⚠️ 开场楼（第 0 楼，或正文带 `<IdentityPick>` 的身份楼）本来就没有状态条之外的收尾，
 *    直接跳过 —— 否则每换一次身份都会误报「回复可能被截断」。
 */
function checkOutputContract(text, messageId) {
  const t = String(text ?? '');
  
  if (Number(messageId) === 0 || /<IdentityPick/.test(t) || /<结算/.test(t)) return;
  if (hasStatusBlock(t)) return;
  const tail = t.trim().slice(-24);
  console.warn(TAG, `⚠️ 第 ${messageId} 楼缺少状态条（<Status_block>／<StatusBlock>／<status> 都没有）—— 多半是回复被截断了。末尾是「${tail}」`);
  toast('warning', '本轮缺少状态栏，回复可能被截断（可发 /continue 续写）', 12000);
}

