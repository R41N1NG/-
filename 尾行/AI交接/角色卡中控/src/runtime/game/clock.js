"use strict";
function clockMinutes(g, floor = g.floor) {
  const match = String(g.route?.startTime || "21:00").match(
    /^(\d{1,2}):(\d{2})$/,
  );
  const base = match ? Number(match[1]) * 60 + Number(match[2]) : 1260;
  return base + Math.max(0, (floor || 1) - (g.nightStartFloor || 0) - 1) * 15;
}
function clockLabel(g) {
  const min = clockMinutes(g);
  return `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}
module.exports = { clockMinutes, clockLabel };
