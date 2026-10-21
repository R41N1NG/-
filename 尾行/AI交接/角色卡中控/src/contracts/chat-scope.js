"use strict";
function scopeKey(characterId, chatId) {
  return chatId == null || chatId === ""
    ? null
    : JSON.stringify([characterId ?? null, String(chatId)]);
}
module.exports = { scopeKey };
