"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  esbuild = require("esbuild");
const { heartLessonHash } = require("./heart-lesson-sample");
function buildHeartLessonPreview() {
  const root = path.resolve(__dirname, "../.."),
    out = path.join(root, "previews/heart-tutorial"),
    m = JSON.parse(
      fs.readFileSync(path.join(out, "source/shots.json"), "utf8"),
    );
  if (m.sourceHash !== heartLessonHash(root))
    throw Error(
      "心跳教程原图已过期，请运行 npm run screenshots:heart-tutorial",
    );
  const css = [
      "training-brief.css",
      "day-tailing-course.css",
      "heart-lesson.css",
    ]
      .map((n) => fs.readFileSync(path.join(root, "src/ui/styles", n), "utf8"))
      .join("\n"),
    body = fs.readFileSync(
      path.join(root, "src/ui/zero-floor/heart-lesson.html"),
      "utf8",
    );
  const code = esbuild.buildSync({
    stdin: {
      resolveDir: root,
      contents: `const {createLifecycle}=require('./src/ui/lifecycle');const {mountHeartLesson}=require('./src/ui/zero-floor/heart-lesson');const data=${JSON.stringify({ facts: m.facts, shots: m.shots })};window.__heartLesson=mountHeartLesson({document,window,lifecycle:createLifecycle(window),...data});window.__heartLessonReady=true;`,
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
    `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>尾行 · 第三组第一页 · 心跳与甜区</title><style>${css}</style><body><p class="course-preview-note">第三组第1页 · <a href="../stamina-tutorial/index.html">下一页：体力与准备 →</a> · 独立图文预览。图解使用真实心跳界面，示例不会写入你的游戏存档。</p>${body}<script>${code.replace(/<\/script/gi, "<\\/script")}</script></body></html>`,
  );
  return { file };
}
if (require.main === module) console.log(buildHeartLessonPreview().file);
module.exports = { buildHeartLessonPreview };
