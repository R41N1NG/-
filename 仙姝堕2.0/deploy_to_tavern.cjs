"use strict";
const fs = require("node:fs"),
  path = require("node:path");
function deploy() {
  const user = process.env.XSD2_TAVERN_USER_DIR;
  if (!user) {
    console.log("未配置 XSD2_TAVERN_USER_DIR，保留独立成品供导入，未部署。");
    return { skipped: true };
  }
  const root = path.resolve(user),
    name = "仙姝堕2.0·框架测试";
  for (const dir of ["characters", "worlds"])
    if (!fs.statSync(path.join(root, dir)).isDirectory())
      throw Error("部署目录必须是现有酒馆用户目录");
  const charDir = path.join(root, "characters");
  const matchingCards = fs.readdirSync(charDir)
    .filter(f => new RegExp(`^${name}(?:\\d+)?\\.png$`).test(f));
  if (!matchingCards.includes(name + ".png")) matchingCards.push(name + ".png");
  const files = [
    ...matchingCards.map(f => [
      path.join(__dirname, "最新角色卡", name + ".png"),
      path.join(charDir, f),
    ]),
    [
      path.join(__dirname, "dist", name + "-世界书.json"),
      path.join(root, "worlds", name + ".json"),
    ],
  ];
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  for (const [src, dst] of files) {
    if (fs.existsSync(dst)) {
      const backup = path.join(root, "backups", "xsd2", stamp);
      fs.mkdirSync(backup, { recursive: true });
      fs.copyFileSync(dst, path.join(backup, path.basename(dst)));
    }
    fs.copyFileSync(src, dst);
    if (!fs.readFileSync(src).equals(fs.readFileSync(dst)))
      throw Error("部署回读失败");
  }
  console.log("已备份并部署独立2.0测试卡，未覆盖正式卡。");
  return { skipped: false };
}
if (require.main === module) deploy();
module.exports = { deploy };
