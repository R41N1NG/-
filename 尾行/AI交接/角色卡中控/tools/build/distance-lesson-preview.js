"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  esbuild = require("esbuild");
const { distanceLessonHash } = require("./distance-lesson-sample");
function buildDistanceLessonPreview() {
  const root = path.resolve(__dirname, "../.."),
    out = path.join(root, "previews/distance-tutorial"),
    m = JSON.parse(
      fs.readFileSync(path.join(out, "source/shots.json"), "utf8"),
    );
  if (m.sourceHash !== distanceLessonHash(root))
    throw Error(
      "距离教程原图已过期，请运行 npm run screenshots:distance-tutorial",
    );
  for (const id of ["far", "same", "close", "touch"]) {
    for (const suffix of ["", "-mobile"]) {
      const proof = m.shots[id + suffix]?.settlement;
      if (!proof?.complete || proof.chips.length < 2 || !proof.ledger.length)
        throw Error("距离教程存在未完成的判定截图：" + id + suffix);
    }
  }
  const css = [
      "training-brief.css",
      "day-tailing-course.css",
      "heart-lesson.css",
      "distance-lesson.css",
    ]
      .map((n) => fs.readFileSync(path.join(root, "src/ui/styles", n), "utf8"))
      .join("\n"),
    body = fs.readFileSync(
      path.join(root, "src/ui/zero-floor/distance-lesson.html"),
      "utf8",
    );
  const code = esbuild.buildSync({
    stdin: {
      resolveDir: root,
      contents: `const {createLifecycle}=require('./src/ui/lifecycle');const {mountDistanceLesson}=require('./src/ui/zero-floor/distance-lesson');const data=${JSON.stringify({ facts: m.facts, shots: m.shots })};window.__distanceLesson=mountDistanceLesson({document,window,lifecycle:createLifecycle(window),...data});window.__distanceLessonReady=true;`,
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
    `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>尾行 · 第三组第3页 · 她的警觉与跟随距离</title><style>${css}</style><body><p class="course-preview-note"><a href="../stamina-tutorial/index.html">← 上一页：体力与准备</a>　第三组第3页 · 独立图文预览。图解来自真实界面，示例不会写入你的游戏存档。</p>${body}<script>${code.replace(/<\/script/gi, "<\\/script")}</script></body></html>`,
  );
  return { file };
}
if (require.main === module) console.log(buildDistanceLessonPreview().file);
module.exports = { buildDistanceLessonPreview };
