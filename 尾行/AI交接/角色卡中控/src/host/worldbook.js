"use strict";
const { findTavernHelper, hostCharacterData } = require("./environment.js");
const R = require("../config/rules.json");
const TARGET_ENTRY_NAMES = {
  student: "【目标档案】晚自习女高中生",
  college: "【目标档案】独居女大学生",
  ol: "【目标档案】外企职场女性",
  club: "【目标档案】夜场陪酒女公关",
  wife: "【目标档案】独居全职少妇",
};

async function syncTargetWorldbook(
  targetId = "college",
  guard = async () => {},
) {
  const attempts = [];
  const helper = findTavernHelper();
  if (
    !helper ||
    typeof helper.getWorldbook !== "function" ||
    typeof helper.replaceWorldbook !== "function"
  ) {
    return { skipped: true, reason: "无世界书 API", attempts };
  }
  try {
    /* ① 书名的三种来源都试一遍：角色绑定主书 → 角色扩展 world 字段 → 逐本扫描含【目标档案】的书。
       不同分支给的字段不一样，这里不挑食；全都不中才退回卡名。 */
    const names = [];
    if (typeof helper.getCharWorldbookNames === "function") {
      try {
        const bindings = await helper.getCharWorldbookNames("current");
        if (bindings && bindings.primary) names.push(bindings.primary);
        if (bindings && Array.isArray(bindings.additional))
          names.push(...bindings.additional);
        if (Array.isArray(bindings)) names.push(...bindings);
      } catch (e) {
        attempts.push("getCharWorldbookNames 失败: " + (e && e.message));
      }
    }
    try {
      const card = hostCharacterData();
      const fromCard = card && card.extensions && card.extensions.world;
      if (fromCard) names.push(fromCard);
    } catch (e) {}
    if (typeof helper.getWorldbookNames === "function") {
      try {
        const all = await helper.getWorldbookNames();
        if (Array.isArray(all)) names.push(...all);
      } catch (e) {
        attempts.push("getWorldbookNames 失败: " + (e && e.message));
      }
    }
    names.push("尾行");

    let bookName = null,
      entries = null;
    for (const name of [...new Set(names.filter(Boolean))]) {
      try {
        const got = await helper.getWorldbook(name);
        attempts.push(
          "读 " + name + " → " + (Array.isArray(got) ? got.length : 0) + " 条",
        );
        if (
          Array.isArray(got) &&
          got.some((e) => /^【目标档案】/.test(e.name || e.comment || ""))
        ) {
          bookName = name;
          entries = got;
          break;
        }
      } catch (e) {
        attempts.push("读 " + name + " 失败: " + (e && e.message));
      }
    }
    if (!bookName)
      return {
        skipped: true,
        reason: "没找到带【目标档案】的世界书",
        attempts,
      };

    const targetEntries = entries.filter((e) =>
      /^【目标档案】/.test(e.name || e.comment || ""),
    );
    const configuredName =
      R.targets.list[targetId]?.worldbookEntry || TARGET_ENTRY_NAMES[targetId];
    const activeEntry = targetEntries.find(
      (e) =>
        (e.content || "").match(/\[TARGET_GROUP:\s*([a-z_]+)\s*\]/)?.[1] ===
          targetId || (e.name || e.comment || "") === configuredName,
    );
    const activeName = activeEntry
      ? activeEntry.name || activeEntry.comment
      : null;
    const targetMissing = !activeEntry;
    let changed = false;
    const updated = entries.map((e) => {
      const label = e.name || e.comment || "";
      if (/^【目标档案】/.test(label)) {
        const shouldEnable = label === activeName;
        const shouldConstant = shouldEnable;
        if (
          e.enabled !== shouldEnable ||
          e.constant !== shouldConstant ||
          e.disable !== !shouldEnable
        ) {
          changed = true;
          return {
            ...e,
            enabled: shouldEnable,
            constant: shouldConstant,
            disable: !shouldEnable,
          };
        }
      }
      return e;
    });

    if (!changed)
      return {
        ok: true,
        name: bookName,
        targetId,
        activeName,
        targetMissing,
        unchanged: true,
        attempts,
      };
    await guard();
    await helper.replaceWorldbook(bookName, updated, { render: "immediate" });
    console.log(
      `[M4][世界书] 目标条目同步成功：${activeName || "无匹配档案，全部目标条目关闭"}，其余禁用`,
    );
    return {
      ok: true,
      name: bookName,
      targetId,
      activeName,
      targetMissing,
      attempts,
    };
  } catch (err) {
    console.warn(
      "[M4][世界书] 目标条目同步异常：",
      err && (err.message || err),
    );
    return { ok: false, error: err && err.message, attempts };
  }
}

module.exports = { syncTargetWorldbook };
