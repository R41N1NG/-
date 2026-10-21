// tests/map.test.js - 地图系统与拓扑寻路单测
const test = require('node:test');
const assert = require('node:assert');
const {
  getPlace,
  getDistrict,
  getExits,
  isStrikeAllowed,
  isTransitPort,
  findNearestSanctuary,
  getWeatherModifiers
} = require('../src/runtime/map');
const placesData = require('../src/config/places.json');

test('地图大区完整性：A/B/C/D 四大区均存在且配置接驳端口', () => {
  const expectedDistricts = ['A', 'B', 'C', 'D'];
  for (const dId of expectedDistricts) {
    const district = getDistrict(dId);
    assert.ok(district, `大区 ${dId} 必须存在`);
    assert.ok(Array.isArray(district.transit_ports) && district.transit_ports.length > 0, `大区 ${dId} 必须包含接驳端口`);
    assert.ok(district.audio_ambient, `大区 ${dId} 必须预留环境音频路径`);
  }
});

test('拓扑完整性校验：所有 exits 引用的场所 ID 必须真实存在（无悬空死链）', () => {
  const allPlaceIds = Object.keys(placesData.places);
  assert.ok(allPlaceIds.length >= 20, '全地图场所节点数量应在 20 个以上');

  for (const id of allPlaceIds) {
    const place = getPlace(id);
    assert.ok(place, `场所 ${id} 必须能正常读取`);
    assert.ok(Array.isArray(place.exits), `场所 ${id} 的 exits 必须是数组`);

    for (const exitId of place.exits) {
      assert.ok(allPlaceIds.includes(exitId), `场所 ${id} 引用的 exitId '${exitId}' 必须存在于 places.json 中`);
    }
  }
});

test('动手封印：人流密集或门岗直照封印终局，深水暗巷开放', () => {
  assert.strictEqual(isStrikeAllowed('office_lobby_a'), false, '写字楼大堂必须封印动手');
  assert.strictEqual(isStrikeAllowed('school_gate_b'), false, '学校正门必须封印动手');
  assert.strictEqual(isStrikeAllowed('food_street_c'), false, '大排档夜市必须封印动手');

  assert.strictEqual(isStrikeAllowed('back_alley_a'), true, 'CBD后街暗巷允许动手');
  assert.strictEqual(isStrikeAllowed('dark_blind_alley_b'), true, '老城杂物暗巷允许动手');
  assert.strictEqual(isStrikeAllowed('narrow_gap_c'), true, '城中村一线天窄弄允许动手');
  assert.strictEqual(isStrikeAllowed('pine_forest_d'), true, '郊野杉木密林允许动手');
});

test('接驳端口标记识别：地铁枢纽与公路入口正确识别为跨区端口', () => {
  assert.strictEqual(isTransitPort('metro_hub_a'), true);
  assert.strictEqual(isTransitPort('school_bus_terminal_b'), true);
  assert.strictEqual(isTransitPort('suburb_highway_d'), true);
  assert.strictEqual(isTransitPort('back_alley_a'), false);
});

test('逃跑 AI 寻路 (BFS)：受惊时能正确沿边缘寻找最近庇护所', () => {
  // 从老城居民杂物暗巷 dark_blind_alley_b 起跑，最近的庇护所应为 1 步到单元楼道 unit_stairs_b，或 2 步到便利店
  const escapeB = findNearestSanctuary('dark_blind_alley_b');
  assert.ok(escapeB, '暗巷受惊必须能找到逃跑庇护所');
  assert.strictEqual(escapeB.sanctuaryId, 'unit_stairs_b');
  assert.strictEqual(escapeB.steps, 1);

  // 从城中村一线天 narrow_gap_c 起跑，最近庇护所为 rental_iron_door_c
  const escapeC = findNearestSanctuary('narrow_gap_c');
  assert.ok(escapeC, '城中村受惊必须能找到逃跑庇护所');
  assert.strictEqual(escapeC.sanctuaryId, 'rental_iron_door_c');
});

test('天气 × 场所耦合：室内场所豁免天气，室外亲水区雨天追加湿滑', () => {
  // 室内便利店在暴雨中完全豁免
  const indoorResult = getWeatherModifiers('storm', 'store_24h_a');
  assert.strictEqual(indoorResult.mods.indoorImmunity, true);
  assert.strictEqual(indoorResult.tags.length, 0);

  // 室外江堤台阶在小雨下获得雨夜掩护并追加地面湿滑
  const outdoorRain = getWeatherModifiers('rain', 'river_steps_c');
  assert.ok(outdoorRain.tags.includes('tag_rain'));
  assert.ok(outdoorRain.tags.includes('tag_slippery'));
  assert.strictEqual(outdoorRain.mods.slipRisk, true);
  assert.strictEqual(outdoorRain.mods.stealth, 1);
  assert.strictEqual(outdoorRain.mods.sound, -2);
});
