"use strict";
const { places } = require("../config/places.json");
const layout = require("../config/city-layout.json");
const clone = (x) => JSON.parse(JSON.stringify(x));
const validId = (id) =>
  typeof id === "string" && Object.prototype.hasOwnProperty.call(places, id);
function createSpatial({ placeId = layout.home, assumed = false } = {}) {
  return {
    schema: 1,
    playerPlaceId: placeId,
    assumed,
    tracking: "none",
    lastSeen: null,
    knownPlaces: [],
  };
}
function validateSpatial(value) {
  const seen = value?.lastSeen;
  if (
    !value ||
    value.schema !== 1 ||
    !validId(value.playerPlaceId) ||
    typeof value.assumed !== "boolean" ||
    !["none", "visual", "lost"].includes(value.tracking) ||
    !Array.isArray(value.knownPlaces) ||
    value.knownPlaces.some((id) => !validId(id)) ||
    new Set(value.knownPlaces).size !== value.knownPlaces.length ||
    (seen !== null &&
      (!seen ||
        !validId(seen.placeId) ||
        typeof seen.targetId !== "string" ||
        !Number.isSafeInteger(seen.date) ||
        seen.date < 1 ||
        !Number.isInteger(seen.period) ||
        seen.period < 0 ||
        seen.period > 4 ||
        !Number.isSafeInteger(seen.turn) ||
        seen.turn < 0))
  )
    throw Object.assign(Error("地图位置存档无效，原进度已保留"), {
      code: "SAVE_INVALID",
    });
  return clone(value);
}
module.exports = { createSpatial, validateSpatial };
