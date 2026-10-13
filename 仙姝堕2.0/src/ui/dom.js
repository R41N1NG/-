"use strict";
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
// 转义模板助手：插值自动转义，确需原文时用 html.raw() 显式放行——
// 约定：innerHTML 的模板串一律走 html`，禁止裸 ` 拼接（tests/ui_discipline 静态把关）。
const RAW = Symbol("xsd2RawHtml");
const html = (strings, ...vals) => {
  let out = strings[0];
  vals.forEach((v, i) => {
    out += (v && typeof v === "object" && Object.hasOwn(v, RAW) ? v[RAW] : esc(v)) + strings[i + 1];
  });
  return out;
};
html.raw = (v) => ({ [RAW]: String(v ?? "") });
function modal(doc, title) {
  const el = doc.createElement("dialog");
  el.className = "xsd2-dialog";
  el.innerHTML = html`<header><strong>${title}</strong><button type="button" data-close>关闭</button></header><div class="xsd2-dialog-body"></div>`;
  doc.body.append(el);
  el.querySelector("[data-close]").onclick = () => el.close();
  el.addEventListener("click", (e) => {
    if (e.target === el) el.close();
  });
  el.addEventListener("close", () => el.remove(), { once: true });
  el.showModal();
  return el;
}
module.exports = { esc, modal, html };
