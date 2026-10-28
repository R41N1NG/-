"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  esbuild = require("esbuild");
const { staminaLessonHash } = require("./stamina-lesson-sample");
function buildStaminaLessonPreview() {
  const root = path.resolve(__dirname, "../.."),
    out = path.join(root, "previews/stamina-tutorial"),
    m = JSON.parse(
      fs.readFileSync(path.join(out, "source/shots.json"), "utf8"),
    );
  if (m.sourceHash !== staminaLessonHash(root))
    throw Error(
      "体力教程原图已过期，请运行 npm run screenshots:stamina-tutorial",
    );
  const css = [
      "training-brief.css",
      "day-tailing-course.css",
      "heart-lesson.css",
      "stamina-lesson.css",
    ]
      .map((n) => fs.readFileSync(path.join(root, "src/ui/styles", n), "utf8"))
      .join("\n"),
    body = fs.readFileSync(
      path.join(root, "src/ui/zero-floor/stamina-lesson.html"),
      "utf8",
    );
  const code = esbuild.buildSync({
    stdin: {
      resolveDir: root,
      contents: `const {createLifecycle}=require('./src/ui/lifecycle');const {mountStaminaLesson}=require('./src/ui/zero-floor/stamina-lesson');const data=${JSON.stringify({ facts: m.facts, shots: m.shots })};window.__staminaLesson=mountStaminaLesson({document,window,lifecycle:createLifecycle(window),...data});window.__staminaLessonReady=true;`,
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
    `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>尾行 · 第三组第2页 · 体力与准备</title><style>${css}</style><body><p class="course-preview-note"><a href="../heart-tutorial/index.html">← 上一页：心跳与甜区</a>　<a href="../distance-tutorial/index.html">下一页：她的警觉与跟随距离 →</a>　第三组第2页 · 独立图文预览。图解来自真实界面，示例不会写入你的游戏存档。</p>${body}<script>${code.replace(/<\/script/gi, "<\\/script")}</script></body></html>`,
  );
  return { file };
}
if (require.main === module) console.log(buildStaminaLessonPreview().file);
module.exports = { buildStaminaLessonPreview };
