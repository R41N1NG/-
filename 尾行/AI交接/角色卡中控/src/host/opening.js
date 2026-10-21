"use strict";
const { hostCharacterData, hostFn, hostFrames } = require("./environment.js");
const OPENING_SOURCE = { college: "first_mes", student: "alt:0" };

async function applyTargetOpening(targetId, guard = async () => {}) {
  const spec = OPENING_SOURCE[targetId];
  if (!spec) return { skipped: true, reason: "该目标没有独立开场白" };
  const card = hostCharacterData();
  if (!card) return { skipped: true, reason: "拿不到角色卡数据" };
  const text =
    spec === "first_mes"
      ? card.first_mes
      : (card.alternate_greetings || [])[Number(spec.split(":")[1])];
  if (!text) return { skipped: true, reason: "卡里没有对应开场白" };

  const setMsgs = hostFn("setChatMessages");
  if (!setMsgs) return { skipped: true, reason: "宿主无 setChatMessages" };
  let count = null;
  for (const w of hostFrames()) {
    try {
      const st = w && w.SillyTavern;
      const ctx =
        st && typeof st.getContext === "function" ? st.getContext() : null;
      if (ctx && Array.isArray(ctx.chat)) {
        count = ctx.chat.length;
        break;
      }
    } catch (e) {}
  }
  if (count !== null && count > 1)
    return { skipped: true, reason: "聊天已有内容，不覆盖开场" };
  try {
    await guard();
    await setMsgs([{ message_id: 0, message: text }], { refresh: "affected" });
    return { ok: true, swapped: targetId };
  } catch (e) {
    return { ok: false, error: e && e.message };
  }
}

module.exports = { applyTargetOpening };
