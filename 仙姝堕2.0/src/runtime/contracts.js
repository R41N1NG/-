"use strict";
const XML_FIELDS = [
  "时间",
  "历时",
  "地点",
  "天气",
  "环境",
  "在场",
  "暗处",
  "身份",
  "修为",
  "状态",
  "目标",
  "局势",
  "线索",
  "近闻",
  "远闻",
  "危机",
  "关系刻度",
  "实际发生",
  "纳戒",
];
const DISPLAY_FIELDS = XML_FIELDS.filter(
  (x) => !["时间", "身份", "实际发生", "纳戒"].includes(x),
);
const clone = (x) =>
  x === undefined ? undefined : JSON.parse(JSON.stringify(x));
function safe(x) {
  if (!x || typeof x !== "object") return;
  for (const k of Object.keys(x)) {
    if (["__proto__", "prototype", "constructor"].includes(k))
      throw Error("非法状态键");
    safe(x[k]);
  }
}
function fingerprint(chat) {
  return chat.map((m) =>
    JSON.stringify([
      !!m.is_user,
      !!m.is_system,
      m.swipe_id ?? 0,
      String(m.mes ?? ""),
    ]),
  );
}
function matches(a, b) {
  return (
    Array.isArray(a) && a.length <= b.length && a.every((x, i) => x === b[i])
  );
}
function assertDate(d) {
  if (
    !d ||
    !Number.isInteger(d.year) ||
    d.year < 1 ||
    !Number.isInteger(d.month) ||
    d.month < 1 ||
    d.month > 12 ||
    !Number.isInteger(d.day) ||
    d.day < 1 ||
    d.day > 30
  )
    throw Error("日期须为有效年、月及1—30日");
  return d;
}
const day = (d) => {
  assertDate(d);
  return d.year * 360 + (d.month - 1) * 30 + d.day - 1;
};
const fromDay = (n) => ({
  year: Math.floor(n / 360),
  month: Math.floor((n % 360) / 30) + 1,
  day: (n % 30) + 1,
});
const dateText = (d) => `${d.year}年${d.month}月${d.day}日`;
function number(s) {
  if (/^\d+$/.test(s)) return +s;
  const a = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  s = s.replace(/^初/, "");
  if (s === "卅") return 30;
  if (s[0] === "廿") return 20 + (a[s[1]] || 0);
  if (s.includes("十")) {
    const p = s.split("十");
    return (a[p[0]] || 1) * 10 + (a[p[1]] || 0);
  }
  return a[s];
}
function parseDate(text) {
  const m = String(text).match(
    /(\d{1,6})\s*年[\s·]*(\d+|[一二三四五六七八九十]+)\s*月[\s·]*(\d+|初[一二三四五六七八九十]+|[一二三四五六七八九十廿卅]+)(?:\s*日)?/,
  );
  if (!m) return null;
  try {
    return assertDate({ year: +m[1], month: number(m[2]), day: number(m[3]) });
  } catch (_) {
    return null;
  }
}
function hash(text) {
  let h = 2166136261;
  for (const c of String(text)) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
const noFact =
  /据说|听说|传闻|计划|打算|准备|将要|即将|可能|假如|如果|尚未|未曾|未能|没有|没能|不曾|并未|无法/;
function fact(prose, needle) {
  return String(prose)
    .split(/[。！？\n]/)
    .some((s) => s.includes(needle) && !noFact.test(s));
}
function parseStatus(text) {
  const block =
    /<(?:Status_block|StatusBlock|status)\b[^>]*>([\s\S]*?)<\/(?:Status_block|StatusBlock|status)>/i.exec(
      String(text),
    )?.[1];
  const fields = {},
    cast = [],
    actions = [];
  if (block === undefined)
    return { found: false, fields, cast, actions, prose: String(text) };
  for (const k of [...XML_FIELDS, "进度", "破处", "名器互动"]) {
    const v =
      new RegExp("<" + k + ">([\\s\\S]*?)</" + k + ">").exec(block)?.[1] ??
      new RegExp("(?:^|\\n)\\s*" + k + "\\s*[:：]\\s*([^\\n]+)").exec(
        block,
      )?.[1];
    if (v !== undefined) fields[k] = v.trim();
  }
  for (const m of block.matchAll(/<角色(\d+)>([\s\S]*?)<\/角色\1>/g)) {
    const c = { 序号: +m[1] };
    for (const k of ["名", "关系", "情况", "心境", "神态", "修为"])
      c[k] =
        new RegExp("<" + k + ">([\\s\\S]*?)</" + k + ">")
          .exec(m[2])?.[1]
          ?.trim() || "";
    if (c.名 && c.名 !== "无") cast.push(c);
  }
  if (fields.实际发生)
    actions.push(
      ...fields.实际发生
        .split(/[；;、\n]/)
        .map((x) => x.trim())
        .filter(Boolean),
    );
  const interactions = (fields.名器互动 || "").split(/[；;\n]/).flatMap((x) => {
    const parts = x.split(/[|｜]/);
    return parts.length > 3
      ? Array.from({ length: Math.floor(parts.length / 3) }, (_, i) =>
          parts.slice(i * 3, i * 3 + 3).join("|"),
        )
      : [x];
  });
  return {
    found: true,
    fields,
    cast,
    actions,
    interactions,
    prose: String(text)
      .replace(
        /<(?:Status_block|StatusBlock|status)\b[^>]*>[\s\S]*?<\/(?:Status_block|StatusBlock|status)>/gi,
        "",
      )
      .replace(/<Youjigu_result\b[^>]*\/>/g, ""),
  };
}
function canonicalStatus(text, s) {
  text = String(text)
    .replace(/<(?:StatusBlock|status)\b[^>]*>/gi, "<Status_block>")
    .replace(/<\/(?:StatusBlock|status)>/gi, "</Status_block>");
  const p = parseStatus(text),
    values = {
      ...p.fields,
      时间: "仙盟历 " + dateText(s.calendarDate),
      身份: s.identity,
    };
  if (s.activeEvent?.place) values.地点 = s.activeEvent.place;
  let block =
    /<Status_block>[\s\S]*?<\/Status_block>/.exec(text)?.[0] ||
    "<Status_block></Status_block>";
  for (const k of ["时间", "身份", ...(s.activeEvent?.place ? ["地点"] : [])]) {
    const re = new RegExp("<" + k + ">[\\s\\S]*?</" + k + ">");
    block = re.test(block)
      ? block.replace(re, "<" + k + ">" + values[k] + "</" + k + ">")
      : block.replace(
          "</Status_block>",
          "<" + k + ">" + values[k] + "</" + k + "></Status_block>",
        );
  }
  return /<Status_block>/.test(text)
    ? text.replace(/<Status_block>[\s\S]*?<\/Status_block>/, block)
    : text + "\n" + block;
}
module.exports = {
  XML_FIELDS,
  DISPLAY_FIELDS,
  number,
  assertDate,
  clone,
  safe,
  fingerprint,
  matches,
  day,
  fromDay,
  dateText,
  parseDate,
  hash,
  fact,
  noFact,
  parseStatus,
  canonicalStatus,
};
