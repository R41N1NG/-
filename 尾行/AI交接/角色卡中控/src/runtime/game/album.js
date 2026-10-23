"use strict";
// album：依赖由 game.js 装配，每个游戏实例独立持有状态。
const D = require("../dice.js");
const ALBUM = require("../album.js");
const map = require("../map.js");
const { CA_CN } = require("./constants.js");

function createAlbumSystem({ g, seedAt }) {
  function placeNameNow() {
    if (!g.route || !Array.isArray(g.route.nodes)) return "";
    const id = g.route.nodes[g.route.here];
    return (id && (map.getPlace(id) || {}).name) || "";
  }

  function capturePhoto(dist, options = {}) {
    const persona = g.targetPersona || {};
    const owned = Object.keys(g.album || {});
    const cands = ALBUM.captureList(persona, owned, dist).filter(
      (c) =>
        (!options.angle || c.angle === options.angle) &&
        (!options.items || options.items.includes(c.item.id)),
    );
    if (!cands.length) return null;
    g.captureSeq = (g.captureSeq || 0) + 1;
    const seed = seedAt(g.floor || 1, "capture_" + g.captureSeq);
    const pick =
      cands[
        g.rngVersion === 1
          ? D.rollD20(seed).d20 % cands.length
          : D.pickIndex(seed, cands.length)
      ];
    const meta = {
      file: pick.file,
      name: pick.item.name,
      slot: pick.item.slot,
      angle: pick.angle,
      t: g.floor || 1,
      place: placeNameNow(),
      dist,
      source: options.source || "photo",
    };
    g.album[pick.key] = meta;
    let piBonus = 0;
    if (dist === "touch" && pick.angle === "front") piBonus += 1;
    const sb = ALBUM.setBonus(g.album, g.setBonusDone);
    piBonus += sb.pi;
    g.lastCapture = { key: pick.key, ...meta, piBonus, outfits: sb.outfits };
    g.capture = g.lastCapture;
    g.signals = g.signals || [];
    g.signals.push([
      options.source === "scan" ? "观察" : "照片",
      `${options.source === "scan" ? "收录" : "拍到"} ${pick.item.name}（${CA_CN[pick.angle] || pick.angle}）`,
    ]);
    if (g.signals.length > 20) g.signals.shift();
    return g.lastCapture;
  }

  return { capturePhoto };
}

module.exports = { createAlbumSystem };
