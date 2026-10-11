"use strict";
const C = require("../runtime/contracts");
function mountOpening(doc, root, runtime, data, report) {
  root.innerHTML = data.openingMenu;
  let busy = false,
    disposed = false;
  const field = (name) => root.querySelector('[data-xds-field="' + name + '"]');
  const value = (name) => field(name)?.value.trim() || "";
  const status = () =>
    root.querySelector(
      '[data-xds-view="' +
        (root.querySelector('[data-xds-page="custom"]').checked
          ? "custom"
          : "flower") +
        '"] [data-xds-status]',
    );
  function page(name) {
    root.querySelector('[data-xds-page="' + name + '"]').checked = true;
  }
  async function submit(payload) {
    if (busy || disposed) return;
    busy = true;
    status().textContent = "";
    status().removeAttribute("data-xds-error");
    root.querySelectorAll("button").forEach((b) => (b.disabled = true));
    try {
      await runtime.dispatchIntent({ type: "SELECT_IDENTITY", payload });
    } catch (error) {
      if (!disposed) {
        status().textContent = error.message;
        status().setAttribute("data-xds-error", "");
        report?.(error);
      }
    } finally {
      busy = false;
      if (!disposed)
        root.querySelectorAll("button").forEach((b) => (b.disabled = false));
    }
  }
  const range = root.querySelector("[data-xds-timepoint-range]"),
    output = root.querySelector("[data-xds-timepoint-out]"),
    summary = root.querySelector("[data-xds-timepoint-summary]"),
    apply = root.querySelector("[data-xds-timepoint-apply]");
  function preview() {
    const point = data.openingTimepoints[Number(range.value)],
      raw = value("custom_timepoint");
    output.textContent = raw || "参考：" + point.value;
    range.setAttribute(
      "aria-valuetext",
      raw ? "参考：" + point.value + "；所填日期：" + raw : point.value,
    );
    summary.textContent = raw
      ? "采用所填写的日期；拖动滑块可改用预设时点。"
      : point.summary;
    apply.hidden = !!raw && raw === point.value;
  }
  function applyPoint() {
    field("custom_timepoint").value =
      data.openingTimepoints[Number(range.value)].value;
    preview();
  }
  function click(e) {
    const b = e.target.closest(
      "button,label[data-xds-open-custom],label[data-xds-back],[data-xds-identity]",
    );
    if (!b || !root.contains(b) || busy) return;
    if (b.hasAttribute("data-xds-open-custom")) {
      e.preventDefault();
      page("custom");
    } else if (b.hasAttribute("data-xds-back")) {
      e.preventDefault();
      page("flower");
    } else if (b.hasAttribute("data-xds-identity"))
      void submit({ identity: b.dataset.xdsIdentity });
    else if (b.hasAttribute("data-xds-carousel-step")) {
      const carousel = root.querySelector("[data-xds-carousel]");
      const distance =
        Number(b.dataset.xdsCarouselStep) * (carousel.clientWidth || 660);
      if (carousel.scrollBy)
        carousel.scrollBy({
          left: distance,
          behavior: doc.defaultView.matchMedia?.(
            "(prefers-reduced-motion: reduce)",
          ).matches
            ? "instant"
            : "smooth",
        });
      else carousel.scrollLeft += distance;
    } else if (b.hasAttribute("data-xds-fill")) {
      field(b.dataset.xdsFill).value = b.dataset.xdsValue;
      root
        .querySelectorAll('[data-xds-fill="' + b.dataset.xdsFill + '"]')
        .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      preview();
    } else if (b.hasAttribute("data-xds-timepoint-apply")) applyPoint();
    else if (b.dataset.xdsAction === "submit-custom") {
      const date = C.parseDate(value("custom_timepoint"));
      const extra = [
        value("custom_gender") && "性别：" + value("custom_gender"),
        value("custom_age") && "年岁：" + value("custom_age"),
        value("custom_sect") && "来历：" + value("custom_sect"),
        value("custom_origin"),
      ]
        .filter(Boolean)
        .join("；");
      void submit({
        identity: "自设",
        custom: {
          name: value("custom_name"),
          realm: value("custom_cultivation"),
          date,
          place: value("custom_place"),
          origin: extra,
        },
      });
    }
  }
  function input(e) {
    if (e.target === range) applyPoint();
    else if (e.target === field("custom_timepoint")) preview();
  }
  function key(e) {
    const label = e.target.closest("[data-xds-open-custom],[data-xds-back]");
    if (label && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      label.click();
    }
    if (
      e.target.matches("[data-xds-carousel]") &&
      ["ArrowLeft", "ArrowRight"].includes(e.key)
    ) {
      e.preventDefault();
      root
        .querySelector(
          '[data-xds-carousel-step="' +
            (e.key === "ArrowLeft" ? "-1" : "1") +
            '"]',
        )
        .click();
    }
  }
  root.addEventListener("click", click);
  root.addEventListener("input", input);
  root.addEventListener("change", input);
  root.addEventListener("keydown", key);
  for (const img of root.querySelectorAll("[data-xds-image]")) {
    img.onload = () => {
      if (disposed) return;
      img.removeAttribute("data-xds-missing");
      const ready =
        img.dataset.xdsImage === "portrait"
          ? img.closest("[data-xds-flower]")
          : img.closest("[data-xds-badge]");
      ready?.setAttribute(
        img.dataset.xdsImage === "portrait"
          ? "data-xds-art-ready"
          : "data-xds-ready",
        "",
      );
    };
    img.onerror = () => img.setAttribute("data-xds-missing", "");
    if (img.complete && img.naturalWidth) img.onload();
  }
  preview();
  return {
    destroy() {
      disposed = true;
      root.removeEventListener("click", click);
      root.removeEventListener("input", input);
      root.removeEventListener("change", input);
      root.removeEventListener("keydown", key);
      root.querySelectorAll("img").forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
      root.replaceChildren();
    },
  };
}
module.exports = { mountOpening };
