"use strict";
const fs = require("node:fs"),
  path = require("node:path");
function generateUIConfig() {
  const root = path.resolve(__dirname, "../..");
  // Read every build; require caching must not keep old edited configuration.
  const rules = JSON.parse(
    fs.readFileSync(path.join(root, "src/config/rules.json"), "utf8"),
  );
  const lexicon = JSON.parse(
    fs.readFileSync(path.join(root, "src/config/lexicon.json"), "utf8"),
  );
  const lifepack = JSON.parse(
    fs.readFileSync(path.join(root, "src/config/lifepack.json"), "utf8"),
  );
  const { places } = JSON.parse(
    fs.readFileSync(path.join(root, "src/config/places.json"), "utf8"),
  );
  const layout = JSON.parse(
    fs.readFileSync(path.join(root, "src/config/city-layout.json"), "utf8"),
  );
  // 教学页只打包公开示例点的名称和坐标，不把完整场所规则再带入 UI。
  const trainingExample = [
    "school_gate_b",
    "university_library_b",
    "university_canteen_b",
    "school_bus_terminal_b",
    "store_24h_b",
  ].map((id) => {
    const p = places[id];
    if (!p || p.district !== "B" || layout.privatePlaces.includes(id))
      throw Error(`教学示例必须是 B 区公开地点：${id}`);
    return { id, name: p.mapName || p.name, at: layout.coordinates[id] };
  });
  const data = {
    trainingExample,
    trainingSample: require("./training-sample.js").buildTrainingSample(),
    targetContent: Object.fromEntries(
      Object.keys(rules.targets.list).map((id) => [
        id,
        { hasPack: !!lifepack.packs[id] },
      ]),
    ),
    identities: Object.fromEntries(
      Object.entries(rules.identity.list).map(([id, r]) => [
        id,
        { name: r.name, mods: r.mods },
      ]),
    ),
    targets: rules.targets.list,
    generator: rules.targets.generator,
    heart: {
      sweet: [rules.check.sweetLow, rules.check.sweetHigh],
      lines: [rules.heart.deformLine, rules.heart.crashLine],
    },
    requirements: Object.fromEntries(
      lexicon.entries.filter((e) => e.requires).map((e) => [e.id, e.requires]),
    ),
  };
  const output = path.join(root, "src/ui/generated/rules.json");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(data, null, 2) + "\n");
  return data;
}
module.exports = { generateUIConfig };
