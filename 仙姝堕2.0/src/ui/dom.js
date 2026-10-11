"use strict";
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function modal(doc, title) {
  const el = doc.createElement("dialog");
  el.className = "xsd2-dialog";
  el.innerHTML =
    "<header><strong>" +
    esc(title) +
    '</strong><button type="button" data-close>关闭</button></header><div class="xsd2-dialog-body"></div>';
  doc.body.append(el);
  el.querySelector("[data-close]").onclick = () => el.close();
  el.addEventListener("click", (e) => {
    if (e.target === el) el.close();
  });
  el.addEventListener("close", () => el.remove(), { once: true });
  el.showModal();
  return el;
}
module.exports = { esc, modal };
