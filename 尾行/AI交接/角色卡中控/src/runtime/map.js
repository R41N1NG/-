// src/runtime/map.js - 地图拓扑查询与逃跑寻路运行时
const defaultPlacesData = require('../config/places.json');

class MapRuntime {
  constructor(data = defaultPlacesData) {
    this.districts = data.districts || {};
    this.places = data.places || {};
  }

  getPlace(placeId) {
    return this.places[placeId] || null;
  }

  getDistrict(districtId) {
    return this.districts[districtId] || null;
  }

  getExits(placeId) {
    const place = this.getPlace(placeId);
    return place ? place.exits || [] : [];
  }

  isStrikeAllowed(placeId) {
    const place = this.getPlace(placeId);
    if (!place) return false;
    return !place.strike_sealed;
  }

  isTransitPort(placeId) {
    const place = this.getPlace(placeId);
    if (!place) return false;
    return !!place.transit_port;
  }

  // 逃跑 AI 寻路：广度优先搜索 (BFS) 寻找最近的庇护所 (Sanctuary)
  findNearestSanctuary(startPlaceId, maxDepth = 4) {
    const start = this.getPlace(startPlaceId);
    if (!start) return null;
    if (start.sanctuary) return startPlaceId;

    const queue = [{ id: startPlaceId, depth: 0, path: [startPlaceId] }];
    const visited = new Set([startPlaceId]);

    while (queue.length > 0) {
      const current = queue.shift();
      if (current.depth >= maxDepth) continue;

      const place = this.getPlace(current.id);
      if (!place) continue;

      for (const nextId of place.exits) {
        if (!visited.has(nextId)) {
          visited.add(nextId);
          const nextPlace = this.getPlace(nextId);
          if (nextPlace && nextPlace.sanctuary) {
            return {
              sanctuaryId: nextId,
              steps: current.depth + 1,
              nextStep: current.path[1] || nextId,
              fullPath: [...current.path, nextId]
            };
          }
          queue.push({
            id: nextId,
            depth: current.depth + 1,
            path: [...current.path, nextId]
          });
        }
      }
    }
    return null;
  }

  // 计算天气与当前场所节点的动态耦合修正
  getWeatherModifiers(weather = 'clear', placeId) {
    const place = this.getPlace(placeId);
    if (!place) return { tags: [], mods: {} };

    // 室内场所豁免室外天气
    if (place.indoor) {
      return {
        tags: [],
        mods: { indoorImmunity: true }
      };
    }

    const result = { tags: [], mods: {} };

    if (weather === 'rain') {
      result.tags.push('tag_rain');
      result.mods.stealth = 1;
      result.mods.sound = -2;
      result.mods.faceCover = 2;

      // 室外高滑地带追加湿滑风险
      const slipperyPlaces = ['old_skybridge_b', 'river_steps_c', 'village_main_c', 'narrow_gap_c'];
      if (slipperyPlaces.includes(placeId)) {
        result.tags.push('tag_slippery');
        result.mods.slipRisk = true;
      }
    } else if (weather === 'storm') {
      result.tags.push('tag_storm');
      result.mods.stealth = 2;
      result.mods.sound = -5;
      result.mods.followSpeed = -2;
      result.mods.surveillanceDiscount = 0.5;

      const slipperyPlaces = ['old_skybridge_b', 'river_steps_c', 'village_main_c', 'narrow_gap_c', 'private_road_d'];
      if (slipperyPlaces.includes(placeId)) {
        result.tags.push('tag_slippery');
        result.mods.slipRisk = true;
      }
    }

    return result;
  }
}

const defaultMap = new MapRuntime();

module.exports = {
  MapRuntime,
  defaultMap,
  getPlace: (id) => defaultMap.getPlace(id),
  getDistrict: (id) => defaultMap.getDistrict(id),
  getExits: (id) => defaultMap.getExits(id),
  isStrikeAllowed: (id) => defaultMap.isStrikeAllowed(id),
  isTransitPort: (id) => defaultMap.isTransitPort(id),
  findNearestSanctuary: (id, maxDepth) => defaultMap.findNearestSanctuary(id, maxDepth),
  getWeatherModifiers: (weather, placeId) => defaultMap.getWeatherModifiers(weather, placeId)
};
