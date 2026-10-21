"use strict";
const WX_ICON = {
  rain: '<path d="M6.5 13.5h11a3 3 0 0 0 0-6 4.5 4.5 0 0 0-8.6-1 3.2 3.2 0 0 0-2.4 7Z"/><path d="M8 16.5 7 19M12 16.5 11 19M16 16.5 15 19"/>',
  storm:
    '<path d="M6.5 12.5h11a3 3 0 0 0 0-6 4.5 4.5 0 0 0-8.6-1 3.2 3.2 0 0 0-2.4 7Z"/><path d="M12 14.5 10 18h3l-1 3 4-5h-3l1-1.5"/>',
  sunny:
    '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>',
  school:
    '<path d="M3 10 12 4l9 6"/><path d="M5 10v10h14V10"/><path d="M9 20v-5h6v5"/>',
  store:
    '<path d="M4 9h16l-1.5-5H5.5L4 9Z"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/>',
  alley:
    '<path d="M9 3h6"/><path d="M10 3v2h4V3"/><path d="M8 7h8l-1 6H9L8 7Z"/><path d="M12 13v8"/>',
  door: '<path d="M6 21V4h9v17"/><path d="M4 21h16"/><path d="M12.5 12.5h.01"/>',
  subway:
    '<rect x="5" y="3" width="14" height="13" rx="3"/><path d="M5 10h14"/><path d="M8 20l2-4M16 20l-2-4"/>',
  bridge:
    '<path d="M3 18h18"/><path d="M5 18V9a7 7 0 0 1 14 0v9"/><path d="M12 18v-8"/>',
  office:
    '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/>',
  parking:
    '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M10 17V8h3a3 3 0 0 1 0 6h-3"/>',
  bar: '<path d="M4 5h16l-8 9Z"/><path d="M12 14v6"/><path d="M8 20h8"/>',
  unknown:
    '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6"/><path d="M12 16.8h.01"/>',
  tool: '<path d="M14.5 4a3.5 3.5 0 0 0-3 5.3L4 16.8 7.2 20l7.5-7.5A3.5 3.5 0 0 0 19 8.5l-2 1.2-1.7-1.7 1.2-2A3.5 3.5 0 0 0 14.5 4Z"/>',
  tech: '<rect x="5" y="4" width="14" height="10" rx="1.5"/><path d="M3 18h18l-2-4H5l-2 4Z"/>',
  device:
    '<path d="M4 8h4l2-2h4l2 2h4v11H4V8Z"/><circle cx="12" cy="13" r="3"/>',
  mask: '<path d="M4 9c3-2 6-2 8 0 2-2 5-2 8 0v3c0 4-4 7-8 7s-8-3-8-7V9Z"/><path d="M8 11.5h1.8M14.2 11.5H16"/>',
  bolt: '<path d="M13 3 6 13h5l-1 8 8-11h-5l1-7Z"/>',
  cup: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H6a2 2 0 0 0 0 4h2"/><path d="M10 20h4M12 13v7"/>',
  bag: '<path d="M7 8h10a2 2 0 0 1 2 2v10H5V10a2 2 0 0 1 2-2Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/><path d="M9 13h6"/>',
  box: '<path d="M4 8l8-4 8 4v8l-8 4-8-4V8Z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
  paw: '<circle cx="7.5" cy="9" r="1.6"/><circle cx="12" cy="7" r="1.6"/><circle cx="16.5" cy="9" r="1.6"/><path d="M8 14c-1.6 1-2 2.4-1.4 3.4.7 1.1 2.6 1.3 4.2.6 1.6.7 3.5.5 4.2-.6.6-1 .2-2.4-1.4-3.4-1.5-1-4.1-1-5.6 0Z"/>',
  phone:
    '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M10.5 18h3"/>',
  clip: '<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 5V3.5h6V5"/><path d="M8.5 10h7M8.5 13.5h7M8.5 17h4"/>',
  music:
    '<path d="M9 18V6l9-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="16" cy="16" r="2"/>',
  person:
    '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5"/>',
  pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  video:
    '<rect x="3" y="7" width="12" height="10" rx="2"/><path d="M15 11l6-3v8l-6-3"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="12" cy="12" r="1"/>',
  warn: '<path d="M12 4 3 20h18L12 4Z"/><path d="M12 10v5"/><path d="M12 18h.01"/>',
};

const ico = (name) =>
  `<svg class="wx-ico wx-ico-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${WX_ICON[name] || WX_ICON.unknown}</svg>`;

const stripEmoji = (s) =>
  String(s || "")
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}]/gu,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();

module.exports = { WX_ICON, ico, stripEmoji };
