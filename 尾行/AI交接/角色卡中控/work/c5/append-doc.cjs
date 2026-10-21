const fs = require("node:fs");

const sec = `

## 相册与拍照产物（2026-10-20 落码）

- **只出未拥有**：每次拍照从「未拥有（itemId|角度）」里抽，抽不到＝这条街上能拍的都拍过了（PI 0、不弹卡）。
- **角度受距离限制**：远端只拍到剪影（不进相册）；同街仅侧/背；身后与贴身可正/侧/背。
- **PI**：新照片 +2（沿用拍照收益）；贴身且正面 +3；四件套拍齐额外 +2（每套一次）。
- **图鉴规模**：长发 62 张（头饰 6 · 上装 21 · 下装 12 · 袜 15 · 鞋 8），非长发 41 张。
- **取图路径**：\`user/images/wx_wardrobe/jk/<slot>/<variant>/<item>/<angle>.png\`，缩略图同名 \`.jpg\`（网格用）。
- **UI**：手机「相册」贴墙（五分区、空框无文案、点击放大、可左右翻）；拍照后右下角即时卡片 6 秒自动消失，点开进大图。
- **发型/体型**：开局掷定，只影响取图与图鉴总数，不进数值。
`;

fs.appendFileSync("数值策划.md", sec, "utf8");

const hand = `

**第十二轮（相册与拍照产物落码）**：
- 新增 \`src/runtime/album.js\`（取图纯函数：变体目录、距离角度、未拥有过滤、套装齐奖励）与 \`src/config/wardrobe.json\`（23 件 / 7 套）。
- \`game.js\`：开局掷 \`hair/body\`；\`capturePhoto()\` 接在 photo 成功/大成功之后；album/setBonusDone/captureSeq 进存档；快照新增 \`album{count,total,shots,catalog}\` 与 \`capture\`。
- \`glue.js\`：回执加「拍照成果：件名 · 角度（相册 N/M）；PI +x」。
- \`状态栏.html\`：手机设备页加「相册 ↗」；贴墙相册（五分区、空框无文案、点开大图）；拍照即时卡片 6 秒；取图基址 \`user/images/wx_wardrobe/\`（本地，缩略图 .jpg）。
- 测试：新增 \`tests/album.test.js\` 6 项（远端不进相册、同街角度、未拥有过滤、变体路径、套装齐、capturePhoto 连续取新）。基线 **279**。
`;

fs.appendFileSync("DEEPSEEK交接.md", hand, "utf8");
console.log("appended");
