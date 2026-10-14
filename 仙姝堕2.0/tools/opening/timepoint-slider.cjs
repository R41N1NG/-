"use strict";
// Migrated presentation presets only. State/date parsing belongs to the 2.0 kernel.
const POINTS = Object.freeze(
  [
    ["正章之前", 1577, 7, 1, "7月1日", "正篇尚未启幕，可从此前的年月入世。"],
    ["暗流微澜", 1577, 12, 1, "12月1日", "暗流渐起，局势仍在酝酿。"],
    ["第一章（墨山探幽）", 1578, 3, 3, "3月3日", "墨山探幽，正篇由此启卷。"],
    [
      "南域大劫",
      1578,
      8,
      1,
      "8月1日",
      "南域局势剧变，各方势力重新划分疆域。",
    ],
    ["天溪兽潮", 1579, 1, 1, "1月1日", "兽潮迫近天溪，城中局势渐趋紧张。"],
    ["天溪城破", 1579, 3, 1, "3月1日", "天溪城破，南域局势再度转折。"],
    ["乱世割据", 1579, 6, 1, "6月1日", "各方势力割据，局势仍在变动。"],
    [
      "极乐定局",
      1580,
      1,
      1,
      "1月1日",
      "格局趋于定局，后续走向仍由当前故事决定。",
    ],
  ].map(([label, year, month, day, dateText, summary]) =>
    Object.freeze({
      label,
      year,
      month,
      day,
      summary,
      // Preserve the original eight button strings, including this title's spacing.
      value: `${label}${label === "第一章（墨山探幽）" ? "·" : " ·"} 仙盟历 ${year} 年 · ${dateText}`,
      order: year * 10000 + month * 100 + day,
    }),
  ),
);
const DEFAULT_INDEX = 2;
const DEFAULT_VALUE = POINTS[DEFAULT_INDEX].value;
const TIMEPOINT_CSS = `
[data-xds-menu] [data-xds-timepoint-box] [hidden]{display:none!important}
[data-xds-menu] [data-xds-timepoint-enhancer]{margin-top:.5rem}
[data-xds-menu] [data-xds-timepoint-range]{display:block;width:100%;min-height:44px;margin:0;accent-color:#c9a66b;cursor:pointer}
[data-xds-menu] [data-xds-timepoint-range]:focus-visible{outline:2px solid currentColor;outline-offset:2px}
[data-xds-menu] [data-xds-timepoint-out]{display:block;overflow-wrap:anywhere;line-height:1.6}
[data-xds-menu] [data-xds-timepoint-summary]{margin:.25rem 0;line-height:1.6}
[data-xds-menu] [data-xds-timepoint-apply]{min-height:44px;max-width:100%;padding:.35rem .7rem;cursor:pointer;white-space:normal}
@media(pointer:coarse){[data-xds-menu] [data-xds-timepoint-range]{touch-action:pan-y}}
`;

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );

function renderTimepoint(instanceId) {
  if (!/^[a-z][a-z0-9_-]*$/i.test(instanceId))
    throw new Error("不合法的菜单 instanceId");
  const id = `${instanceId}-custom_timepoint`;
  return `<div data-xds-field-box="wide" data-xds-timepoint-box>
      <label data-xds-field-label for="${id}">当前时点</label>
      <input type="text" class="xds-input" id="${id}" name="custom_timepoint" data-xds-field="custom_timepoint" placeholder="填写明确时点；可手填，如仙盟历 1579 年 · 6月7日">
      <div data-xds-timepoint-enhancer>
        <input type="range" min="0" max="7" step="1" value="2" data-xds-timepoint-range aria-label="当前时点预设，共八个停靠点" aria-valuetext="${escapeHtml(DEFAULT_VALUE)}">
        <output data-xds-timepoint-out aria-live="polite" aria-atomic="true">${escapeHtml(DEFAULT_VALUE)}</output>
        <p data-xds-timepoint-summary>${escapeHtml(POINTS[DEFAULT_INDEX].summary)}</p>
        <button type="button" data-xds-timepoint-apply>采用滑块参考点</button>
        <p data-xds-help>手填日期会保留原值；拖动滑块将采用预设日期。落款提交后生效。</p>
      </div>
    </div>`;
}

module.exports = { POINTS, TIMEPOINT_CSS, renderTimepoint };
