"use strict";
const fs = require("node:fs");
const path = require("node:path");
/** Only the importable card lives in 最新成品; worldbook is already embedded in it. */
function publishLatest(root) {
  const project = path.resolve(root, "../..");
  const latest = path.join(project, "最新成品");
  const archive = path.join(project, "成品归档");
  const source = path.join(root, "dist", "尾行.json");
  const data = fs.readFileSync(source);
  const parsed = JSON.parse(data.toString("utf8"));
  if (parsed.spec !== "chara_card_v2" || !parsed.data?.character_book)
    throw new Error("交付角色卡无效，未更换最新成品");
  fs.mkdirSync(latest, { recursive: true });
  let batch;
  const archiveTo = () => {
    if (!batch) {
      fs.mkdirSync(archive, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      batch = fs.mkdtempSync(path.join(archive, stamp + "-"));
    }
    return batch;
  };
  const destination = path.join(latest, "尾行.json");
  // Prepare the complete replacement before moving any existing deliverable.
  const staged = path.join(
    root,
    "dist",
    `.delivery-${process.pid}-${Date.now()}.tmp`,
  );
  fs.writeFileSync(staged, data, { flag: "wx" });
  try {
    for (const entry of fs.readdirSync(latest, { withFileTypes: true })) {
      const file = path.join(latest, entry.name);
      if (
        entry.name === "尾行.json" &&
        entry.isFile() &&
        fs.readFileSync(file).equals(data)
      )
        continue;
      fs.renameSync(file, path.join(archiveTo(), entry.name));
    }
    if (!fs.existsSync(destination)) fs.renameSync(staged, destination);
    const legacy = path.join(root, "最新角色卡");
    if (fs.existsSync(legacy))
      fs.renameSync(legacy, path.join(archiveTo(), "旧交付目录"));
  } finally {
    if (fs.existsSync(staged)) fs.unlinkSync(staged);
  }
  return { destination, archive: batch || null };
}
module.exports = { publishLatest };
