"use strict";
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
    let changed = false;
    const updated = entries.map((e) => {
      if (!String(e.content).startsWith("@@if ")) return e;
      const enabled = evaluateGate(e.content, stat);
      if (enabled !== e.enabled) {
        changed = true;
        return { ...e, enabled };
      }
      return e;
    });
    if (changed)
      await helper.replaceWorldbook(name, updated, { render: "immediate" });
  }
  return { synchronize, synchronizeState };
}
module.exports = { createWorldbookHost, evaluateGate };
