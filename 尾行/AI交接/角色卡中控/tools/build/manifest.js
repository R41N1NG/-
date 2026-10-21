"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
function writeManifest(root) {
  const hash = (value) =>
    crypto.createHash("sha256").update(value).digest("hex");
  const sources = [];
  function scan(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) scan(file);
      else
        sources.push({
          file: path.relative(root, file).replaceAll("\\", "/"),
          sha256: hash(fs.readFileSync(file)),
        });
    }
  }
  scan(path.join(root, "src"));
  for (const file of [
    "build.js",
    "build-runtime.js",
    "build-statusbar.js",
    "package.json",
    "package-lock.json",
  ])
    sources.push({
      file,
      sha256: hash(fs.readFileSync(path.join(root, file))),
    });
  scan(path.join(root, "tools/build"));
  sources.sort((a, b) => a.file.localeCompare(b.file));
  const files = [
    "runtime.js",
    "wx-statusbar.user.js",
    "尾行.json",
    "尾行-世界书.json",
  ];
  const manifest = {
    schema: 1,
    version: JSON.parse(fs.readFileSync(path.join(root, "package.json")))
      .version,
    saveVersion: 2,
    timelineSchema: 1,
    sourceHash: hash(JSON.stringify(sources)),
    sources,
    outputs: Object.fromEntries(
      files.map((file) => {
        const data = fs.readFileSync(path.join(root, "dist", file));
        return [file, { bytes: data.length, sha256: hash(data) }];
      }),
    ),
  };
  fs.writeFileSync(
    path.join(root, "dist/build-manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  return manifest;
}
module.exports = { writeManifest };
