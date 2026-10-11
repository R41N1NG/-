"use strict";
const fs = require("node:fs");
const path = require("node:path");

const assetPath = path.join(__dirname, "../src/plugins/youjigu_map/assets/map.jpg");
const outPath = path.join(__dirname, "../src/plugins/youjigu_map/map_asset.js");

const b64 = fs.readFileSync(assetPath).toString("base64");
const code = [
  '"use strict";',
  'const MAP_IMAGE_DATA = "data:image/jpeg;base64,' + b64 + '";',
  'module.exports = { MAP_IMAGE_DATA };',
  ''
].join("\n");

fs.writeFileSync(outPath, code, "utf8");
console.log("Successfully generated CommonJS map_asset.js, size:", code.length);
