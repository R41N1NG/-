"use strict";
const ATTRS = { str: "体格", agi: "敏捷", per: "敏锐", nrv: "胆量" };
/** Details consume only explicitly public projections. Never infer knowledge from target.stats/persona. */
function createDetailsRenderer({ document }) {
  const text = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };
  function list(id, entries, empty) {
    const node = document.getElementById(id);
    if (!node) return;
    node.replaceChildren();
    if (!entries.length) {
      node.textContent = empty;
      return;
    }
    for (const entry of entries) {
      const row = document.createElement("p");
      row.textContent = entry;
      node.append(row);
    }
  }
  function render(snap) {
    const target = snap?.target;
    const profile =
      snap?.profile?.targetId === target?.id ? snap?.profile : null;
    text(
      "vfTarget",
      target
        ? [target.realName, target.name].filter(Boolean).join(" · ") ||
            "当前目标"
        : "尚未选择目标",
    );
    text("vfStatus", target ? "档案视图 · 非实时画面" : "等待开局");
    // Decorative silhouette is not an actual captured image or camera connection.
    text(
      "vfMeta",
      target
        ? "距离档位：" +
            ({ far: "远端", same: "同街", close: "身后", touch: "贴身" }[
              snap.dist
            ] || "未知")
        : "暂无观察数据",
    );
    text("vfAfBadge", target ? "[ 档案 ]" : "[ 等待 ]");
    const attrs = document.getElementById("pattrs");
    if (attrs) {
      attrs.replaceChildren();
      for (const [key, label] of Object.entries(ATTRS)) {
        const value = profile?.attrs?.[key];
        const known = Number.isFinite(value) && value >= 1 && value <= 10;
        const row = document.createElement("div");
        row.className = "pattr" + (known ? "" : " unknown");
        const title = document.createElement("div");
        title.className = "an";
        title.textContent = label;
        const number = document.createElement("div");
        number.className = "av";
        number.textContent = known ? String(value) : "？";
        row.append(title, number);
        attrs.append(row);
      }
    }
    list(
      "ptags",
      Array.isArray(profile?.impressions)
        ? profile.impressions.filter((x) => typeof x === "string")
        : [],
      "暂无已记录的外观印象",
    );
    const facts = Array.isArray(profile?.facts) ? profile.facts : [];
    list(
      "profileBody",
      facts.map((f) => [f.title, f.text].filter(Boolean).join("：")),
      "暂无已解锁情报",
    );
    const route = snap?.route;
    list(
      "profileSchedule",
      route?.nodes?.flatMap((place, i) =>
        route.known?.[i]
          ? [
              `${String(route.times?.[i] || "时间未记录").replace(/^(\d{2})(\d{2})$/, "$1:$2")} · ${place}`,
            ]
          : [],
      ) || [],
      "暂无已探明日程",
    );
    // These backends do not currently persist device, lie-history or pursuit state.
    text("devicesBody", "设备状态暂未接入，暂无可显示的设备记录。");
    text("liesBody", "暂无已保存的谎言记录。");
    text("wantedBody", "当前版本未启用追缉系统。");
  }
  return { render, reset: () => render(null) };
}
module.exports = { createDetailsRenderer };
