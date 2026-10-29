"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  esbuild = require("esbuild"),
  { buildUI } = require("./ui");
function buildFormalCollegePreview() {
  const root = path.resolve(__dirname, "../.."),
    out = path.join(root, "previews/formal-college");
  fs.mkdirSync(out, { recursive: true });
  const ui = buildUI({ preview: false, writePreview: false }),
    entry = esbuild.buildSync({
      entryPoints: [path.join(__dirname, "formal-college-entry.js")],
      bundle: true,
      platform: "browser",
      format: "iife",
      globalName: "FormalCollege",
      write: false,
      legalComments: "none",
    }).outputFiles[0].text;
  const html = ui.template
    .replace(
      "/* WX_STATUSBAR_CSS */",
      () =>
        ui.css +
        "\nbody{background:#091518;padding:20px}.formal-preview-bar{max-width:1100px;margin:0 auto 18px;color:#bdcbbc;font:13px/1.8 system-ui}.formal-preview-bar button{padding:8px 14px;background:#283c3e;color:#e6d7b1;border:1px solid #8b7b51;border-radius:6px;cursor:pointer}",
    )
    .replace(
      '<main class="wx-standalone-main">',
      '<header class="formal-preview-bar"><p>正式女大日程 · 独立验收预览。使用正式引擎、完整保存与聊天检查点；此页另存，与TT聊天隔离。页面中的发送按钮模拟一次聊天行动。</p><button id="formalSend">发送本轮已选行动</button> <button id="formalReset">重置独立验收</button><p id="formalNotice" role="status"></p></header><main class="wx-standalone-main">',
    )
    .replace("/* WX_STATUSBAR_SCRIPT */", () =>
      [ui.script, entry, "FormalCollege.boot();"]
        .join("\n")
        .replace(/<\/script/gi, "<\\/script"),
    );
  const file = path.join(out, "index.html");
  fs.writeFileSync(file, html);
  return { file };
}
if (require.main === module) console.log(buildFormalCollegePreview().file);
module.exports = { buildFormalCollegePreview };
