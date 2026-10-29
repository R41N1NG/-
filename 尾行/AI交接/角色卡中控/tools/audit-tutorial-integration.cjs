"use strict";
// 接入审计：仅隔离运行真实引擎、构建预览和读取源码；不挂入正式教程、不迁移玩家存档。
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http");
const { JSDOM } = require("jsdom");
const { createGame } = require("../src/runtime/game");
const { defaultInit } = require("../src/host/initial-state");
const {
  createTutorialPolicy,
} = require("../src/ui/zero-floor/tutorial-policy");
const { createPreview } = require("./build/college-preview-model");
const { buildUI } = require("./build/ui");
const { buildCollegePreview } = require("./build/college-preview");
const { browserSession } = require("./browser-session.cjs");
const root = path.resolve(__dirname, ".."),
  read = (p) => fs.readFileSync(path.join(root, p), "utf8");
async function main() {
  const out = path.join(root, "previews/tutorial-audit");
  fs.mkdirSync(out, { recursive: true });
  const ui = buildUI({ preview: false, writePreview: false }),
    g = createGame({ ...defaultInit(), collegeDaily: true }),
    daily = createGame({
      ...defaultInit({ dailyMode: true }),
      collegeDaily:true,
      mode: "prepare",
    });
  const courses = [
    "day-tailing-course",
    "heart-lesson",
    "stamina-lesson",
    "distance-lesson",
  ];
  const combined = new JSDOM(
    ui.template +
      courses.map((n) => read("src/ui/zero-floor/" + n + ".html")).join(""),
  );
  const duplicateRoots = combined.window.document.querySelectorAll(
    '[id="wx-zero-floor"]',
  ).length;
  combined.window.close();
  const policyDOM = new JSDOM("", { url: "https://tutorial-audit.test" }),
    policy = createTutorialPolicy(policyDOM.window);
  policy.skipAll();
  const policyEvidence = {
    futureHidden: !policy.shouldShow("future-course"),
    keys: Object.keys(policyDOM.window.localStorage),
  };
  policyDOM.window.close();
  g.addItem("bento", 1);
  g.gmSet({ stamina: -30 });
  const before = g.snapshot(),
    floor = g.save().floor,
    item = g.useItem("bento"),
    after = g.snapshot();
  const core = read("src/text_data/_card_core.txt");
  const textSection = (name) =>
    core.split("@@@ " + name + "\n")[1]?.split("@@@ ")[0] || "";
  const trainingFrame = {
    description: /全息|特工/.test(textSection("DESCRIPTION")),
    scenario: /全息|特工/.test(textSection("SCENARIO")),
    systemPrompt: /全息|特工/.test(textSection("SYSTEM_PROMPT")),
    tutorial: /全息|特工/.test(read("src/ui/zero-floor/training-pages.js")),
  };
  const evidence = {
    date: "2026-10-29",
    production: {
      trainingFrame,
      defaultMode: createGame({ ...defaultInit(), collegeDaily: true }).snapshot().mode,
      defaultSource: createGame({ ...defaultInit(), collegeDaily: true }).snapshot().dayPlan.source,
      compiledCourses: {
        attributeLessons: ui.script.includes("createAttributeLessons"),
        trainingBrief: ui.script.includes("createTrainingBrief"),
        dayTailing: ui.script.includes("mountDayTailingCourse"),
        heart: ui.script.includes("mountHeartLesson"),
        stamina: ui.script.includes("mountStaminaLesson"),
        distance: ui.script.includes("mountDistanceLesson"),
      },
      tailingWhenDaily: daily
        .snapshot()
        .dayActions.find((a) => a.id === "daily.tailing"),
      food: {
        ok: item.ok,
        before: before.player.stamina,
        after: after.player.stamina,
        turns: g.save().floor - floor,
      },
      mapMoveNeedsConfirm: !g.snapshot().dailyMoves,
      movementTimeInProduction: !!g.snapshot().dailyTime,
    },
    uiIntegration: {
      rootsIfConcatenated: duplicateRoots,
      normalCompletionCallbacks: Object.fromEntries(
        courses.map((n) => [
          n,
          /\bonComplete\b/.test(read("src/ui/zero-floor/" + n + ".js")),
        ]),
      ),
    },
    skip: policyEvidence,
    preview: {},
  };
  const formalMove = createGame({
      ...defaultInit(),
      collegeDaily: true,
      mode: "prepare",
      dayPlan: {
        schema: 1,
        source: "daily",
        period: 1,
        spent: 0,
        activity: null,
        ended: false,
      },
    }),
    previewMove = createPreview(null, { period: 0 });
  const positions = [
    "university_canteen_b",
    "university_library_b",
    "school_gate_b",
  ];
  const periods = {
    formalBefore: formalMove.snapshot().dayPlan.period,
    previewBefore: previewMove.snapshot().dayPlan.period,
  };
  positions.forEach((id, i) => {
    formalMove.executeDailyCommand({
      operationId: "audit-move-" + i,
      command: "move",
      args: { placeId: id },
      expected: formalMove.snapshot().dayPlan.token,
    });
    previewMove.move(id);
  });
  evidence.production.movementProbe = {
    ...periods,
    formalAfter: formalMove.snapshot().dayPlan.period,
    previewAfter: previewMove.snapshot().dayPlan.period,
    formalAPSpent: formalMove.save().dayPlan.spent,
    previewAPSpent: previewMove.save().dayPlan.spent,
  };
  const isolated = previewMove.save(),
    roundTrip = createGame({ saved: isolated }).save();
  evidence.uiIntegration.previewStateRoundTrip = {
    previewHasExtension: Object.hasOwn(isolated, "previewCollege"),
    formalKeepsExtension: Object.hasOwn(roundTrip, "previewCollege"),
    formalSessionRoundTrip: JSON.stringify(createGame({saved: formalMove.save()}).save()) === JSON.stringify(formalMove.save()),
  };
  const p = createPreview(null, { period: 3, seed: "college-preview-2" });
  p.move("school_gate_b");
  p.execute(p.request("start", "daily.tailing"));
  p.game.addItem("bento", 2);
  p.game.gmSet({ stamina: -30 });
  const saved = p.save();
  const file = buildCollegePreview().file,
    server = http.createServer((req, res) => {
      res.setHeader("Content-Type", "text/html;charset=utf-8");
      res.end(fs.readFileSync(file));
    });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const b = await browserSession();
  try {
    await b.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `localStorage.setItem('wx_college_schedule_preview_v1',${JSON.stringify(JSON.stringify(saved))});`,
    });
    await b.send("Page.navigate", {
      url: "http://127.0.0.1:" + server.address().port,
    });
    for (let i = 0; i < 150; i++) {
      await b.delay(100);
      if (
        await b.evaluate(
          "document.readyState==='complete'&&!!window.__collegePreview?.ready",
        )
      )
        break;
    }
    evidence.preview.foodCommand = await b.evaluate(
      "(async()=>{const before=JSON.stringify(__collegePreview.save());let result;try{await WxGlue.command('useItem','bento');result={accepted:true};}catch(e){result={accepted:false,message:e.message,code:e.code||null};}return{...result,unchanged:before===JSON.stringify(__collegePreview.save())};})()",
    );
    await b.evaluate(
      "document.getElementById('wx-terminal-toggle-btn').click();document.querySelector('[data-item-action=use][data-item-id=bento]').click();true",
    );
    await b.delay(200);
    evidence.preview.foodButton = await b.evaluate(
      "({notice:document.getElementById('wxSyncNotice').textContent,stamina:__collegePreview.snapshot().player.stamina})",
    );
  } finally {
    b.close();
    await new Promise((r) => server.close(r));
  }
  fs.writeFileSync(
    path.join(out, "evidence-current.json"),
    JSON.stringify(evidence, null, 2) + "\n",
  );
  console.log(JSON.stringify(evidence, null, 2));
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
