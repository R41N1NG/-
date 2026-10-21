/**
 * 尾行 · 词表引擎：加载校验 + 归一（自由短语 → 词条 + 参数）
 * 纪律：词表不发明数字（数值真源在 rules.json）；别名是活的（诊断样本回流生长）。
 */
const R = require("../config/rules.json");
const RAW = require("../config/lexicon.json");

/* ---------- 加载与校验 ---------- */
function loadLexicon(raw = RAW, rules = R) {
  const errors = [];
  const byId = new Map();
  const byName = new Map();
  const byAlias = new Map();
  const validModes = new Set(raw.modes);

  raw.entries.forEach((e, i) => {
    const at = `entries[${i}](${e.id || "?"})`;
    if (!e.id || !e.name) { errors.push(`${at}: 缺 id/name`); return; }
    if (byId.has(e.id)) errors.push(`${at}: id 重复`);
    else byId.set(e.id, e);
    const nKey = String(e.name).trim().toLowerCase();
    if (byName.has(nKey)) errors.push(`${at}: name "${e.name}" 重复`);
    else byName.set(nKey, e);

    const modes = e.modes || ["any"];
    for (const m of modes) if (!validModes.has(m)) errors.push(`${at}: 非法模式 ${m}`);

    if (e.check !== null && e.check !== undefined && !(e.check in rules.checks))
      errors.push(`${at}: check "${e.check}" 不在 rules.checks`);

    for (const a of e.aliases || []) {
      if (byAlias.has(a)) errors.push(`别名冲突: "${a}" 同时属于 ${byAlias.get(a)} 与 ${e.id}`);
      else byAlias.set(a, e.id);
    }
  });

  if (errors.length) { const err = new Error("词表校验失败:\n  " + errors.join("\n  ")); err.details = errors; throw err; }

  return { entries: raw.entries, byId, byName, byAlias, argKeys: raw.argKeys, defaultArgs: raw.defaultArgs };
}

/* ---------- 归一引擎：精确 → 别名 → 降级 ---------- */
/**
 * @param {string} text 玩家直达指令、动作标签或自由短语
 * @returns {{hit:boolean, id?:string, name?:string, args?:object, degraded?:boolean, sample?:string}}
 * 规范三段式：首词/全词命中官方 name 或 id → 别名最长匹配 → 降级（纯叙事，无机械效果）。
 */
function normalize(text, lex) {
  const t = String(text || "").trim().toLowerCase();
  if (!t) return { hit: false, degraded: true, sample: text };

  // ① 直达指令：首词命中官方 id 或官方 name（带参/不带参）
  const head = t.split(/[\s|｜]+/)[0];
  let e = (lex.byName && lex.byName.get(head)) || (lex.byId && lex.byId.get(head));
  if (e) {
    return { hit: true, id: e.id, name: e.name, args: parseArgs(e, text, lex) };
  }

  // ② 别名直达（首词为别名）
  if (lex.byAlias && lex.byAlias.has(head)) {
    const id = lex.byAlias.get(head);
    const item = lex.byId.get(id);
    if (item) {
      return { hit: true, id: item.id, name: item.name, args: parseArgs(item, text, lex) };
    }
  }

  // 全词完全匹配（整句即官方名或别名）
  if (t !== head) {
    e = (lex.byName && lex.byName.get(t)) || (lex.byId && lex.byId.get(t));
    if (e) {
      return { hit: true, id: e.id, name: e.name, args: parseArgs(e, text, lex) };
    }
    if (lex.byAlias && lex.byAlias.has(t)) {
      const id = lex.byAlias.get(t);
      const item = lex.byId.get(id);
      if (item) {
        return { hit: true, id: item.id, name: item.name, args: parseArgs(item, text, lex) };
      }
    }
  }

  // ③ 降级：纯叙事，无机械效果
  return { hit: false, degraded: true, sample: String(text).slice(0, 40) };
}

/** 参数解析：先查英文枚举值（直达指令），再查中文关键词；缺失走 defaultArgs。 */
function parseArgs(entry, text, lex) {
  const out = {};
  const words = String(text).toLowerCase().split(/[\s,，、]+/);
  for (const arg of entry.args || []) {
    const keymap = lex.argKeys[arg];
    if (!keymap) continue;
    let found = null;
    // ① 直达指令：英文枚举值作为独立词出现（'follow close'）
    for (const val of Object.keys(keymap)) {
      if (words.includes(val)) { found = val; break; }
    }
    // ② 自然语言：中文关键词包含匹配
    if (!found) {
      for (const [val, ws] of Object.entries(keymap)) {
        if (ws.some(w => text.includes(w))) { found = val; break; }
      }
    }
    if (!found) {
      const def = lex.defaultArgs[entry.id];
      found = def && def[arg] ? def[arg] : null;
    }
    if (found) out[arg] = found;
  }
  return out;
}

module.exports = { loadLexicon, normalize, parseArgs };
