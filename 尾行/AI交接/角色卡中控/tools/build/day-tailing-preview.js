"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  esbuild = require("esbuild");
const { courseHash } = require("./day-tailing-sample");
function buildDayTailingPreview() {
  const root = path.resolve(__dirname, "../.."),
    out = path.join(root, "previews/day-tailing-tutorial"),
    manifest = JSON.parse(
      fs.readFileSync(path.join(out, "source/shots.json"), "utf8"),
    );
  if (manifest.sourceHash !== courseHash(root))
    throw Error(
      "日程教程截图已过期，请运行 node tools/build/day-tailing-shots.js",
    );
  const css = ["training-brief.css", "day-tailing-course.css"]
      .map((n) => fs.readFileSync(path.join(root, "src/ui/styles", n), "utf8"))
      .join("\n"),
    body = fs.readFileSync(
      path.join(root, "src/ui/zero-floor/day-tailing-course.html"),
      "utf8",
    );
  const code = esbuild.buildSync({
    stdin: {
      contents: `const {createLifecycle}=require('./src/ui/lifecycle');const {mountDayTailingCourse}=require('./src/ui/zero-floor/day-tailing-course');const shots=${JSON.stringify(manifest.shots)};const lifecycle=createLifecycle(window);window.__dayCourse=mountDayTailingCourse({document,window,lifecycle,shots});window.__dayCourseReady=true;`,
      resolveDir: root,
    },
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "es2020",
    write: false,
    legalComments: "none",
  }).outputFiles[0].text;
  const file = path.join(out, "index.html");
  fs.writeFileSync(
    file,
    `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>尾行 · 第二组教程 · 日程与尾行</title><style>${css}</style><body><p class="course-preview-note">第二组教程预览 · 图解取自配套日程试玩，正式卡的全天日程尚待接入。这里仅阅读教学，不写入游戏进度。</p>${body}<script>${code.replace(/<\/script/gi, "<\\/script")}</script></body></html>`,
  );
  return { file };
}
if (require.main === module) console.log(buildDayTailingPreview().file);
module.exports = { buildDayTailingPreview };
