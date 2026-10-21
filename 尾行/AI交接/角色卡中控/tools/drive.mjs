// tools/drive.mjs - 真机回放驱动器：跑一局完整对局（OL 包），逐楼导出引擎真快照到 replay.json。
// 状态栏 fetch 该文件进入「真机回放」模式——浏览器里看到的就是 game.snapshot() 的真账。
// 酒馆插件实装时走同一条管道：宿主逐楼注入快照（window.__wxFeed__），状态栏只认喂食。
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const { createGame } = require(join(root, "src/runtime/game.js"));
const LP = require(join(root, "src/config/lifepack.json"));

const ol = LP.packs.ol;

const game = createGame({
  sessionSalt: "drive-demo-ol-2026-10-16",
  player: { str: 3, agi: 5, nrv: 5, int: 6, cha: 4, staminaMax: 110 },
  target: { ...ol.stats, social: ol.social },
  stats: { date: 5, heart: 34, stamina: 96, cash: 620, pi: 14 },
  world: { weather: "rain", district: "B" },
  route: {
    nodes: ol.routes.find(r => r.id === "workday_evening").path.map(s => s.place),
    known: [1, 1, 1, 1, 1],   // 一路尾随跟过来，沿途动线全认识（次晨重置才回到部分未知）
    here: 1
  }
});

const frames = [];
const push = (label, r) => {
  frames.push({ label, snap: r.stats, flow: r.flow.slice() });
};

// 楼1：潜行·远端试拍（首晚摸底）
push("楼1 · 雨夜·写字楼下远缀试拍", game.processFloor(
  `<模式>潜行</模式><动作>跟缀｜对街</动作><动作>拍照</动作>`, { floor: 1 }));
game.herAdvance();   // 她离开公司边便利店，往地铁走

// 楼2：地铁口接触段（跟近 + 听她的通话）
push("楼2 · 地铁枢纽·贴近听通话", game.processFloor(
  `<动作>跟缀｜同街</动作><动作>贴身听</动作>`, { floor: 2 }));
game.herAdvance();   // 上车，跨区回老城

// 楼3：情报爆发（GM 直改演示：PI 精确补到 60 深层线 → 下一楼优势：情报挂金色）
game.gmSet({ pi: 60 - game.ledger.get("pi") });
push("楼3 · 老街地铁段·情报跨过深层线", game.processFloor(
  `<动作>跟缀｜身后</动作><动作>分析她</动作>`, { floor: 3 }));
game.herAdvance();   // 出站，拐向暗巷

// 楼4：优势挂上后的跟缀（双骰生效）＋躲藏缓息
push("楼4 · 出站跟缀·优势：情报已挂（双骰）", game.processFloor(
  `<动作>跟缀｜同街</动作><动作>躲藏</动作><动作>喘口气</动作>`, { floor: 4 }));
game.herAdvance();   // 穿过暗巷，到自家楼道

// 楼5：贴身段——心跳拉进变形区（GM 通道演示 [操作变形] 与甜区边界）
game.gmSet({ heart: 72 });
push("楼5 · 单元楼道·贴身跟缀（心跳过线·操作变形）", game.processFloor(
  `<动作>跟缀｜贴着点</动作><动作>评估时机</动作>`, { floor: 5 }));
game.herAdvance();   // 到终点（家门）

// 楼6：收摊前最后一段（终点·收摊倒计时归零）
push("楼6 · 门前·终局窗口评估", game.processFloor(
  `<动作>跟缀｜身后</动作><动作>看灯</动作>`, { floor: 6 }));

// 过夜：段账清光＋掷下一晚天气
const night = game.nightFall();

// 过夜后新一天快照（她的动线重置到起点、天气换成掷出来的）
game.setRoute({
  nodes: ol.routes.find(r => r.id === "workday_morning").path.map(s => s.place),
  known: [1, 1, 0, 0],
  here: -1
});
frames.push({ label: `次晨 · 过夜结算（防备沉淀 ＋ 掷出下一晚天气）`, snap: game.snapshot(),
              flow: [`[过夜] wariness +${night.warinessGain} · 明晚天气 ${night.nextWeather} · 第 ${night.date} 天`] });

const out = {
  meta: {
    pack: "ol", name: ol.name, salt: "drive-demo-ol-2026-10-16",
    generated: new Date().toISOString(),
    night: { warinessGain: night.warinessGain, nextWeather: night.nextWeather, date: night.date },
    note: "真机回放：全部快照来自 game.snapshot() 引擎真值，状态栏零 mock。"
  },
  frames
};

writeFileSync(join(root, "replay.json"), JSON.stringify(out, null, 1), "utf8");
console.log(`replay.json 写出：${frames.length} 帧 · 明晚天气 ${night.nextWeather} · 防备 +${night.warinessGain}`);
