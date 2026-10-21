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
  const data = {
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
