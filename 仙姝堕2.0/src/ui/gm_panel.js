"use strict";
const { esc, modal } = require("./dom");
const { describeItem } = require("../runtime/item_catalog");
function openGM(doc, runtime, data, report) {
  const s = runtime.getSnapshot();
  if (!s) return;
  const R = data.rules(s.stat_data),
    el = modal(doc, "GM 控制台"),
    body = el.querySelector(".xsd2-dialog-body");
  body.innerHTML =
    '<p>带人工标记的字段会保留你的设置。可在下方交还自动。</p><form><label>身份<select name="identity">' +
    R.IDENTITIES.map(
      (x) =>
        "<option" +
        (x.name === s.identity ? " selected" : "") +
        ">" +
        esc(x.name) +
        "</option>",
    ).join("") +
    '</select></label><label>仙盟历日期<input name="date" value="' +
    s.calendarDate.year +
    "-" +
    s.calendarDate.month +
    "-" +
    s.calendarDate.day +
    '"></label><label>境界<input name="realm" value="'+esc(s.stat_data.修为||'')+'"></label><label>段位<input name="rank" type="number" min="1" max="16" value="' +
    s.stat_data.段位 +
    '"></label><label>纳戒物品（每行：名称 | 数量 | 消耗品或非消耗品 | 介绍 | 效果）<textarea name="items">' +
    esc(s.inventory.map((item) => { const x = describeItem(item); return [x.name,x.count,x.consumable ? "消耗品" : "非消耗品",x.description,x.effect].join(" | "); }).join("\n")) +
    "</textarea></label>" + Object.entries(data.characterProfiles || {}).flatMap(([name,cfg])=>Object.entries(cfg.metrics || {}).map(([key,m])=>
      '<label>'+esc(name+' · '+key)+'<input type="number" name="metric:'+esc(name)+':'+esc(key)+'" min="'+m.min+'" max="'+m.max+'" value="'+(s.stat_data.character_metrics?.[name]?.[key] ?? m.default)+'"></label>'
    )).join("") + "<details><summary>名器阶段与归属</summary>" +
    Object.entries(R.RELIC_PILOT_CONFIG)
      .map(
        ([id, c]) =>
          "<label>" +
          esc(c.names[0]) +
          '<select name="stage:' +
          id +
          '">' +
          [0, 1, 2, 3, 4]
            .map(
              (n) =>
                '<option value="' +
                n +
                '"' +
                (R.getRelicStage(id, s.known) === n ? " selected" : "") +
                ">" +
                ["未成形", "一阶", "二阶", "三阶", "四阶"][n] +
                "</option>",
            )
            .join("") +
          '</select><input name="owner:' +
          id +
          '" placeholder="归属（空表示无）" value="' +
          esc(s.stat_data.名器归属[id] || "") +
          '"></label>',
      )
      .join("") +
    "</details><details><summary>已知事实</summary>" +
    R.ALL_FIELDS.map(
      (k) =>
        '<label><input type="checkbox" name="known:' +
        esc(k) +
        '"' +
        (s.known[k] ? " checked" : "") +
        ">" +
        esc(k) +
        "</label>",
    ).join("") +
    '</details><p class="xsd2-feedback" role="status"></p><button type="submit">应用修改</button><button type="button" data-cancel>撤回待执行行动</button></form><details><summary>人工覆盖 / 交还自动</summary>' +
    Object.entries(s.manual)
      .map(
        ([k, v]) =>
          '<label><input type="checkbox" data-release="' +
          esc(k) +
          '">' +
          esc(k) +
          " = " +
          esc(JSON.stringify(v)) +
          "</label>",
      )
      .join("") +
    "<button data-release-selected>交还选中字段</button></details>";
  if (runtime.getDiagnostics) {
    const details = doc.createElement("details");
    details.innerHTML = '<summary>运行诊断（只读）</summary><textarea readonly data-diagnostics aria-label="运行诊断"></textarea><button type="button" data-refresh-diagnostics>刷新诊断</button>';
    const refresh = () => {
      details.querySelector("textarea").value = JSON.stringify(runtime.getDiagnostics(), null, 2);
    };
    details.querySelector("button").onclick = refresh;
    body.append(details);
    refresh();
  }
  const form = body.querySelector("form"),
    fields = () => new FormData(form),
    feedback = body.querySelector("[role=status]");
  form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      const f = fields(),
        patch = {},
        identity = f.get("identity");
      if (identity !== s.identity) patch.identity = identity;
      const d = String(f.get("date")).split("-").map(Number),
        date = { year: d[0], month: d[1], day: d[2] };
      if (JSON.stringify(date) !== JSON.stringify(s.calendarDate))
        patch.calendarDate = date;
      if(f.has("realm") && String(f.get("realm")).trim()!==s.stat_data.修为)patch.realm=String(f.get("realm")).trim();
      const rank = +f.get("rank");
      if (rank !== s.stat_data.段位) patch.段位 = rank;
      const items = String(f.get("items"))
        .split("\n")
        .filter((x) => x.trim())
        .map((line) => {
          const [name, count = "1", type, description, effect] = line.split("|").map((x) => x.trim());
          const old = s.inventory.find((x) => x.name === name);
          if (type && !["消耗品","非消耗品"].includes(type)) throw Error("物品类型须填消耗品或非消耗品");
          return { ...old, id: old?.id || name, name, count: Number(count),
            ...(type ? {consumable:type === "消耗品"} : {}),
            ...(description !== undefined ? {description} : {}), ...(effect !== undefined ? {effect} : {}) };
        });
      if (JSON.stringify(items.map(describeItem)) !== JSON.stringify(s.inventory.map(describeItem)))
        patch.inventory = items;
      for (const [name,cfg] of Object.entries(data.characterProfiles || {})) for (const key of Object.keys(cfg.metrics || {})) {
        const value = Number(f.get("metric:"+name+":"+key));
        if (value !== (s.stat_data.character_metrics?.[name]?.[key] ?? cfg.metrics[key].default)) patch["metric."+name+"."+key] = value;
      }
      for (const k of R.ALL_FIELDS) {
        const v = f.has("known:" + k);
        if (v !== !!s.known[k]) patch["known." + k] = v;
      }
      for (const [id, c] of Object.entries(R.RELIC_PILOT_CONFIG)) {
        const n = +f.get("stage:" + id);
        if (n !== R.getRelicStage(id, s.known)) {
          patch["relicStage." + id] = n;
        }
        const owner = String(f.get("owner:" + id)).trim() || null;
        if (owner !== (s.stat_data.名器归属[id] || null))
          patch["owner." + id] = owner;
      }
      await runtime.dispatchIntent({ type: "GM_PATCH", payload: patch });
      el.close();
    } catch (error) {
      feedback.textContent = error.message;
      report?.(error);
    }
  };
  body.querySelector("[data-cancel]").onclick = () =>
    runtime
      .stop()
      .then(() => el.close())
      .catch(report);
  body.querySelector("[data-release-selected]").onclick = () =>
    runtime
      .dispatchIntent({
        type: "GM_RELEASE",
        payload: {
          keys: [...body.querySelectorAll("[data-release]:checked")].map(
            (x) => x.dataset.release,
          ),
        },
      })
      .then(() => el.close())
      .catch(report);
  return () => el.remove();
}
module.exports = { openGM };
