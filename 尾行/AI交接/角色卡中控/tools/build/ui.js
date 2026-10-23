"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const esbuild = require("esbuild");
const ROOT = path.resolve(__dirname, "../..");

/** UI 源码是 src/ui；状态栏.html 是供直接打开的生成预览。 */
function buildUI({
  preview = true,
  writePreview = true,
  skipTrainingShotCheck = false,
} = {}) {
  require("./ui-config.js").generateUIConfig();
  const shotsFile = path.join(ROOT, "src/ui/generated/training-shots.json");
  if (!skipTrainingShotCheck) {
    const meta = JSON.parse(fs.readFileSync(shotsFile, "utf8"));
    if (
      meta.sourceHash !==
      require("./training-shot-hash.js").trainingShotHash(ROOT)
    )
      throw Error(
        "正式界面或案例规则已变更，请先运行 npm run screenshots:training 更新原界面截图",
      );
  }
  const css = ["statusbar.css", "city-map.css", "training-brief.css", "attribute-lessons.css"]
    .map((file) =>
      fs.readFileSync(path.join(ROOT, "src/ui/styles", file), "utf8"),
    )
    .join("\n");
  const template = fs
    .readFileSync(path.join(ROOT, "src/ui/template.html"), "utf8")
    .replace("<!-- WX_ATTRIBUTE_LESSONS -->", () => fs.readFileSync(path.join(ROOT, "src/ui/zero-floor/attribute-lessons.html"), "utf8"))
    .replace("<!-- WX_TRAINING_BRIEF -->", () =>
      fs.readFileSync(
        path.join(ROOT, "src/ui/zero-floor/training-brief.html"),
        "utf8",
      ),
    );
  const section = template.match(
    /<section class="trpg"[^>]*>([\s\S]*?)<\/section>/i,
  );
  if (
    !section ||
    !template.includes("/* WX_STATUSBAR_CSS */") ||
    !template.includes("/* WX_STATUSBAR_SCRIPT */")
  ) {
    throw Error("UI 模板缺少 section 或构建占位符");
  }
  const result = esbuild.buildSync({
    entryPoints: [path.join(ROOT, "src/ui/statusbar.js")],
    define: { __WX_PREVIEW__: String(preview) },
    bundle: true,
    format: "iife",
    globalName: "WxStatusbarUI",
    platform: "browser",
    target: "es2020",
    legalComments: "none",
    logLevel: "warning",
    write: false,
  });
  const script = result.outputFiles[0].text;
  new vm.Script(script);
  const previewScript = (
    script + "\nWxStatusbarUI.mountStatusbar(document, window);\n"
  ).replace(/<\/script/gi, "<\\/script");
  const previewHTML = template
    .replace("/* WX_STATUSBAR_CSS */", () => css)
    .replace("/* WX_STATUSBAR_SCRIPT */", () => previewScript);
  if (writePreview)
    fs.writeFileSync(path.join(ROOT, "状态栏.html"), previewHTML, "utf8");
  return { css: css.trim(), bodyHtml: section[1].trim(), script, template };
}

if (require.main === module) {
  buildUI();
  console.log("状态栏.html 预览已从 src/ui 重建");
}
module.exports = { buildUI };
