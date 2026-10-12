"use strict";
const {managedEnabled} = require("../runtime/story_entries");
/** Only the current card's primary worldbook; never scan names or additional books. */
function evaluateGate(content, stat) {
  const line = String(content).split("\n")[0];
  if (!line.startsWith("@@if ")) return true;
  let expression = line.match(/try\{return \(([\s\S]*?)\)\}catch/)?.[1];
  if (!expression) return false;
  expression = expression.replace(
    /variables\.stat_data\?\.身份\s*(===|!==)\s*('([^']*)'|undefined)/g,
    (_, op, raw, name) =>
      String(
        op === "==="
          ? stat.身份 === (raw === "undefined" ? undefined : name)
          : stat.身份 !== (raw === "undefined" ? undefined : name),
      ),
  );
  expression = expression.replace(
    /Number\(variables\.stat_data\?\.仙盟历\)\s*(>=|<=|>|<|===)\s*(\d+(?:\.\d+)?)/g,
    (_, op, n) =>
      String(
        {
          ">=": (a, b) => a >= b,
          "<=": (a, b) => a <= b,
          ">": (a, b) => a > b,
          "<": (a, b) => a < b,
          "===": (a, b) => a === b,
        }[op](Number(stat.仙盟历), Number(n)),
      ),
  );
  expression = expression.replace(
    /variables\.stat_data\?\.known\?\.\['([^']+)'\]/g,
    (_, key) => String(stat.known?.[key] === true),
  );
  if (expression.replace(/true|false|===|!==|&&|\|\||[()!\s]/g, ""))
    return false;
  try {
    return !!Function('"use strict";return (' + expression + ")")();
  } catch (_) {
    return false;
  }
}
// Add only missing managed entries from this PNG; never overwrite user edits.
function embeddedEntry(raw, uid, sample) {
  if (!sample?.strategy) return {...raw,uid,name:raw.comment,enabled:false,disable:true};
  return {...sample,uid,name:raw.comment,content:raw.content,enabled:false,
    strategy:{...sample.strategy,type:raw.constant ? "constant" : "selective",keys:raw.key || [],
      keys_secondary:{logic:"and_any",keys:[]},scan_depth:raw.scanDepth ?? "same_as_global"},
    position:{...sample.position,type:"after_character_definition",order:raw.order || 200},
    probability:100,recursion:{...sample.recursion,prevent_incoming:true,prevent_outgoing:true,delay_until:null},
    effect:{sticky:null,cooldown:null,delay:null}};
}
function createWorldbookHost(helper, getContext, scope = {}) {
  async function primary() {
    const bindings = await helper.getCharWorldbookNames("current");
    if (bindings?.primary) {
      if (scope.expectedName && bindings.primary !== scope.expectedName)
        throw Error("2.0测试卡须绑定独立同名世界书，已取消写入其他世界书");
      return bindings.primary;
    }
    const c = getContext(),
      card = c.characters?.[c.characterId ?? c.this_chid];
    const name =
      card?.data?.extensions?.world || card?.extensions?.world || null;
    if (name && scope.expectedName && name !== scope.expectedName)
      throw Error("2.0测试卡须绑定独立同名世界书");
    return name;
  }
  async function synchronize(identity, expected) {
    const name = await primary();
    if (!name) return { skipped: true };
    const entries = await helper.getWorldbook(name);
    if (expected && !expected()) throw Error("切换聊天，取消世界书写入");
    const identities = entries.filter((e) =>
      /^【身份】/.test(e.name || e.comment || ""),
    );
    if (!identities.length) return { skipped: true };
    const selected = identities.find(
      (e) => (e.name || e.comment) === "【身份】" + identity,
    );
    if (!selected) throw Error("当前绑定世界书缺少该身份条目");
    const updated = entries.map((e) => {
      const label = e.name || e.comment || "";
      return /^【身份】/.test(label)
        ? { ...e, enabled: label === "【身份】" + identity }
        : e;
    });
    await helper.replaceWorldbook(name, updated, { render: "immediate" });
    return { name, identity };
  }
  async function synchronizeState(stat, expected) {
    const name = await primary();
    if (!name) return;
    const entries = await helper.getWorldbook(name);
    if (expected && !expected()) throw Error("切换聊天，取消门禁同步");
    let added = false;
    const labels = new Set(entries.map(e=>e.name || e.comment));
    let uid = Math.max(-1,...entries.map(e=>Number.isSafeInteger(e.uid) ? e.uid : -1))+1;
    for (const raw of scope.embeddedManagedEntries || []) {
      if (managedEnabled(raw.comment,stat) === null) throw Error("只允许补齐本卡管理的条目");
      if (labels.has(raw.comment)) continue;
      entries.push(embeddedEntry(raw,uid++,entries[0]));
      labels.add(raw.comment);
      added = true;
    }
    if (stat.node_trigger && !entries.some(e=>(e.name || e.comment) === "【节点故事】"+stat.node_trigger))
      throw Error("当前世界书缺少节点故事条目，请导入新版测试卡和配套世界书");
    let changed = added;
    const updated = entries.map((e) => {
      const managed = managedEnabled(e.name || e.comment || "",stat);
      if (managed === null && !String(e.content).startsWith("@@if ")) return e;
      const enabled = managed === null ? evaluateGate(e.content, stat) : managed;
      if (enabled !== e.enabled) {
        changed = true;
        return { ...e, enabled, disable:!enabled };
      }
      return e;
    });
    if (changed)
      await helper.replaceWorldbook(name, updated, { render: "immediate" });
  }
  return { synchronize, synchronizeState };
}
module.exports = { createWorldbookHost, evaluateGate, embeddedEntry };
