"use strict";
const { esc, modal } = require("./dom");
const { mountOpening } = require("./opening_menu");
const { renderSettlement } = require("./settlement_panel");
const { openItem } = require("./item_panel");
const { openGM } = require("./gm_panel");
const { dateText } = require("../runtime/contracts");
const { describeItem } = require("../runtime/item_catalog");
const PALETTE = {
  background: "#171e1c",
  foreground: "#eee9d9",
  muted: "#c5c9bd",
  accent: "#d5b97b",
};
const CSS = `.xsd2-hud,.xsd2-dialog{color:${PALETTE.foreground};background:${PALETTE.background};border:1px solid #756746;border-radius:10px;padding:14px;font-family:serif;line-height:1.7}.xsd2-hud button,.xsd2-dialog button,.xsd2-dialog input,.xsd2-dialog select,.xsd2-dialog textarea{color:#eee9d9;background:#273b34;border:1px solid #8b927e;border-radius:5px;padding:7px;margin:3px;font:inherit}.xsd2-hud button:focus-visible,.xsd2-dialog :focus-visible{outline:2px solid #d5b97b;outline-offset:2px}.xsd2-hud header,.xsd2-hud nav,.xsd2-npcs{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.xsd2-hud details{border-top:1px solid #514d3e;margin-top:9px;padding-top:7px}.xsd2-hud summary{cursor:pointer;color:#d5b97b}.xsd2-hud dl{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;margin:8px 0}.xsd2-hud dd{margin:0;color:#c5c9bd}.xsd2-avatar{width:56px;height:68px;object-fit:cover;border-radius:6px}.xsd2-npc{max-width:240px}.xsd2-dialog{max-width:min(680px,90vw);max-height:85vh}.xsd2-dialog::backdrop{background:#000b}.xsd2-dialog header{display:flex;justify-content:space-between}.xsd2-dialog label{display:block;margin:8px 0}.xsd2-dialog textarea{width:90%;min-height:90px}.xsd2-dialog img{max-width:100%;max-height:70vh;object-fit:contain}.xsd2-feedback{color:#ffcb8c}.xsd2-label{font-size:.85em;color:#c5c9bd}
.xsd2-stagebar{display:flex;gap:16px;align-items:flex-start;max-width:1080px}
.xsd2-wing{display:flex;flex-direction:column;gap:10px;padding-top:6px}
.xsd2-tile{position:relative;width:72px;height:72px;border-radius:10px;border:1px solid #333a35;background:#151d1a;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.18s;overflow:hidden;padding:0}
.xsd2-tile:hover{border-color:#d5b97b;transform:translateY(-2px)}
.xsd2-tile img{width:60px;height:60px;object-fit:contain}
.xsd2-tile.none img{filter:grayscale(1) brightness(.45);opacity:.5}
.xsd2-tile.other img{filter:grayscale(1) brightness(.72) sepia(1) hue-rotate(-38deg) saturate(2.1)}
.xsd2-tile.self{border-color:#756746;box-shadow:0 0 10px #d5b97b22}
.xsd2-tile.other{border-color:#6e2424;background:#241416;box-shadow:0 0 10px #6e242433}
.xsd2-plaque{display:inline-block;background:#273b34;border:1px solid #756746;border-radius:6px;padding:5px 13px;letter-spacing:2px}
.xsd2-row{display:grid;grid-template-columns:64px 1fr;gap:10px;padding:7px 4px;border-bottom:1px dashed #333931;align-items:baseline}
.xsd2-row b{color:#d5b97b;font-size:12px;letter-spacing:3px;font-weight:500}
.xsd2-row.crisis b{color:#e08585}
.xsd2-row.crisis span{color:#e08585;background:#3a1e1e55;border-radius:4px;padding:2px 8px}
.xsd2-alert{border:1px solid #7a2e2e;background:#3a1e1e55;color:#e08585;border-radius:6px;padding:5px 10px;margin:8px 0}
.xsd2-chip{display:inline-block;border:1px solid #756746;border-radius:999px;padding:1px 10px;margin:1px 4px 1px 0;cursor:pointer;color:#eee9d9;font-size:.92em}
.xsd2-chip:hover{border-color:#d5b97b;color:#e8cf8f}
.xsd2-gourd{width:13px;height:13px;color:#e8cf8f;vertical-align:-2px;margin-left:4px}
.xsd2-nodes{display:flex;gap:16px;justify-content:space-around;margin:10px 0 6px}
.xsd2-node{display:flex;flex-direction:column;align-items:center;gap:4px}
.xsd2-node i{width:15px;height:15px;transform:rotate(45deg);border:1.5px solid #4a5258;display:block}
.xsd2-node.done i{background:linear-gradient(135deg,#e8cf8f,#b98f3e);border-color:#e8cf8f;box-shadow:0 0 8px #d5b97b66}
.xsd2-node.now{cursor:pointer}
.xsd2-node.now i{border-color:#d5b97b;box-shadow:0 0 10px #d5b97b88}
.xsd2-node.now em{color:#e8cf8f}
.xsd2-node em{font-style:normal;font-size:10px;color:#8b927e;white-space:nowrap}
.xsd2-node span{font-size:11px;color:#c5c9bd}
.xsd2-cap{border-left:3px solid #e8b46b;padding:4px 10px;background:#241f16;border-radius:0 6px 6px 0;margin:8px 0}
.xsd2-cap p{margin:0;color:#e8b46b;font-size:.9em}
.xsd2-fbar{position:relative;height:18px;background:#20281f;border:1px solid #514d3e;border-radius:999px;overflow:hidden}
.xsd2-fbar i{position:absolute;inset:0;background:linear-gradient(90deg,#b98f3e,#e8cf8f)}
.xsd2-fbar span{position:absolute;inset:0;text-align:center;font-size:11px;line-height:18px;color:#fffbe9}
.xsd2-flog{list-style:none;padding:0;margin:6px 0}
.xsd2-flog li{display:flex;gap:8px;align-items:baseline;border-bottom:1px dashed #333931;padding:5px 0}
.xsd2-flog b{width:34px;text-align:right}
.xsd2-flog li.up b{color:#9fbf7a}.xsd2-flog li.dn b{color:#e08585}
.xsd2-flog li span{margin-left:auto;color:#8b927e;font-size:.85em}
.xsd2-xj{position:fixed;inset:0;background:#000b;display:none;align-items:center;justify-content:center;z-index:10}
.xsd2-xj.open{display:flex}
.xsd2-xj-sheet{background:#1b2320;border:1px solid #756746;border-radius:12px;width:min(1080px,96vw);max-height:92vh;overflow:auto;padding:16px 18px}
.xsd2-xj-sheet header{display:flex;gap:12px;align-items:center;flex-wrap:wrap;border-bottom:1px solid #514d3e;padding-bottom:10px}
.xsd2-xj-sheet header img{width:52px;height:52px;border-radius:8px;border:1px solid #514d3e}
.xsd2-xj-sheet h3{margin:0;color:#e8cf8f;letter-spacing:3px;font-size:20px}
.xsd2-xj-sheet header p{margin:2px 0 0;color:#8b927e;font-size:.9em}
.xsd2-typetag{border:1px solid #514d3e;border-radius:4px;padding:2px 8px;color:#c5c9bd;font-size:.85em}
.xsd2-badge{margin-left:auto;border-radius:999px;padding:4px 12px;font-size:.9em}
.xsd2-badge.bself{background:#1d2b1f;border:1px solid #4a7a4e;color:#9fbf7a}
.xsd2-badge.bother{background:#2b1d1d;border:1px solid #7a2e2e;color:#c96a6a}
.xsd2-badge.bnone{background:#20262a;border:1px solid #4a5258;color:#8b927e}
.xsd2-xtabs{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0 4px}
.xsd2-xtab{background:#1a211e;border:1px solid #514d3e;border-radius:6px;color:#c5c9bd;padding:5px 12px;cursor:pointer;font:inherit;font-size:.9em}
.xsd2-xtab.on{border-color:#d5b97b;color:#e8cf8f;background:#242a22}
.xsd2-cols{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px}
.xsd2-col{border:1px solid #514d3e;border-radius:10px;padding:12px;background:#1a211e;opacity:.62}
.xsd2-col.awake{opacity:1;border-color:#756746}
.xsd2-col.next{border-color:#5a5342}
.xsd2-colhead{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
.xsd2-jie{font-size:.8em;color:#8b927e;letter-spacing:2px}
.xsd2-st{font-size:.75em;border-radius:4px;padding:1px 6px}
.xsd2-col.awake .xsd2-st{color:#e8cf8f;border:1px solid #756746}
.xsd2-col .xsd2-st{color:#8b927e;border:1px solid #514d3e}
.xsd2-col h4{margin:2px 0 8px;letter-spacing:2px;color:#eee9d9}
.xsd2-sign{color:#d5b97b;font-size:.85em;letter-spacing:1px;margin:6px 0 2px}
.xsd2-col p{color:#c5c9bd;font-size:.92em;margin:4px 0}
.xsd2-lockbox{border:1px solid #4a4436;border-radius:6px;padding:6px 10px;margin-top:8px;background:#20241e}
.xsd2-lockbox p{color:#c9b98a;font-size:.88em;margin:0}
.xsd2-lockbox.rule{border-color:#756746}
.xsd2-lockbox.rule p{color:#e8cf8f}
.xsd2-soak{border:1px solid #756746;border-radius:6px;padding:8px 10px;margin-top:10px;background:#232a20}
.xsd2-soak b{color:#e8cf8f;font-size:.88em}
.xsd2-soak p{font-size:.85em;margin:4px 0 0}
.xsd2-sbar{height:8px;background:#20281f;border:1px solid #514d3e;border-radius:999px;overflow:hidden;margin:6px 0}
.xsd2-sbar i{display:block;height:100%;background:linear-gradient(90deg,#b98f3e,#e8cf8f)}
.xsd2-xj-sheet footer{display:flex;justify-content:space-between;align-items:center;margin-top:12px;color:#8b927e;font-size:.85em}
.xsd2-closegold{background:#242a22;border:1px solid #d5b97b;color:#e8cf8f;border-radius:6px;padding:6px 14px;cursor:pointer;font:inherit}
.xsd2-lightbox{position:fixed;inset:0;background:#000d;display:none;align-items:center;justify-content:center;z-index:20;cursor:zoom-out}
.xsd2-lightbox.open{display:flex;flex-direction:column;gap:8px}
.xsd2-lightbox img{max-width:94vw;max-height:88vh;object-fit:contain;border-radius:8px}
.xsd2-lightbox p{margin:0;color:#8b927e;font-size:.85em;text-align:center}
@media (max-width:980px){
  .xsd2-stagebar{flex-direction:column;align-items:stretch}
  .xsd2-wing{flex-direction:row;flex-wrap:wrap;width:100%;justify-content:flex-start;padding-top:0}
  .xsd2-tile{width:60px;height:60px}
  .xsd2-tile img{width:50px;height:50px}
  .xsd2-cols{grid-template-columns:repeat(2,1fr)}
  .xsd2-badge{margin-left:0}
}`;
// Names and file IDs are drawn from the migrated registry / local gallery manifest.
const PORTRAITS = {
  孤月: "guyue",
  叶红缨: "yehongying",
  闻观语: "wenguanyu",
  楚灵夜: "chulingye",
  雨霏柔: "yufeirou",
  苏瑶: "suyao",
  苏玲: "suling",
  云织梦: "yunzhimeng",
  花芷凝: "huazhining",
  苏倾寒: "suqinghan",
  慕容清歌: "murongqingge",
  顾云舒: "guyunshu",
  陆烬颜: "lujinyan",
  焚欲殿主: "canyanglaoguai",
  欢喜殿主: "roushanfo",
  浊龙殿主: "jiuhuangzi",
  魂欢殿主: "bingxiangsi",
};
const GOURD_SVG = '<svg class="xsd2-gourd" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1.6c-1.9 0-3.2 1.3-3.2 2.8 0 .9.5 1.7 1.2 2.2C8 7.5 6.2 9.4 6.2 11.9c0 3.4 2.7 6.1 5.8 6.1s5.8-2.7 5.8-6.1c0-2.5-1.8-4.4-3.8-5.3.7-.5 1.2-1.3 1.2-2.2 0-1.5-1.3-2.8-3.2-2.8z"/></svg>';
function portrait(name, s, data) {
  const stagePortrait = s.stat_data?.character_stages?.[name]?.portrait;
  if (stagePortrait?.small && stagePortrait?.large) return stagePortrait;
  let id = PORTRAITS[name];
  if (!id) return null;
  const R = data.rules(s.stat_data),
    cfg = Object.values(R.RELIC_PILOT_CONFIG).find(
      (c) => c.owner === name || c.ownerAliases?.includes(name),
    ),
    stage = cfg ? R.getRelicStage(cfg.id, s.known) : 0;
  const phase = stage >= 3 ? 3 : stage >= 2 ? 2 : 1;
  if (phase > 1 && data.assets.includes(id + "_" + phase + ".jpg"))
    id += "_" + phase;
  return {
    small: "user/images/xsd_gallery/" + id + ".jpg",
    large: "user/images/xsd_gallery/" + id + ".png",
  };
}
// 纹章状态推导：成形=known 旗标、阶段=已知最高阶、归属=名器归属/破处者账本
function relicStates(s, data) {
  const CN = ["一", "二", "三", "四"];
  return Object.entries(data.relicDb || {}).map(([id, rel]) => {
    const formed = !!s.known?.[rel.name + "成形"];
    let stage = 0;
    for (const k of [1, 2, 3, 4])
      if (s.known?.[rel.name + CN[k - 1] + "阶段"]) stage = k;
    const owner = s.名器归属?.[id] || s.破处者?.[rel.carrier] || "";
    const state = !formed
      ? "none"
      : owner && owner !== s.identity
        ? "other"
        : "self";
    return { id, rel, stage, state, owner };
  });
}
function favorLadder(data, character) {
  const list = [];
  for (const [, p] of Object.entries(data.promotionDefinitions || {})) {
    if (p.character !== character) continue;
    const cond = (p.conditions || []).find((c) => c.kind === "metric");
    if (cond) list.push({ threshold: Number(cond.value), fromStage: p.fromStage, toStage: p.toStage, label: p.label });
  }
  return list.sort((a, b) => a.threshold - b.threshold);
}
function mountHUD(doc, container, runtime, data, report, options = {}) {
  const root = doc.createElement("section");
  root.className = "xsd2-hud";
  const style = doc.createElement("style");
  style.textContent = CSS;
  doc.head.append(style);
  const settlement = doc.createElement("div");
  settlement.dataset.xsd2Settlements = "";
  const stagebar = doc.createElement("div");
  stagebar.className = "xsd2-stagebar";
  const wingL = doc.createElement("div");
  wingL.className = "xsd2-wing";
  wingL.dataset.xsd2Wing = "left";
  const wingR = doc.createElement("div");
  wingR.className = "xsd2-wing";
  wingR.dataset.xsd2Wing = "right";
  const xjRoot = doc.createElement("div");
  xjRoot.className = "xsd2-xj";
  const lightbox = doc.createElement("div");
  lightbox.className = "xsd2-lightbox";
  lightbox.innerHTML = '<img alt=""><p></p>';
  container.append(settlement, stagebar);
  stagebar.append(wingL, root, wingR);
  container.append(xjRoot, lightbox);
  let plugins = [],
    dialogs = [],
    disposed = false,
    opening = null;
  const invoke = (intent) =>
    runtime.dispatchIntent(intent).catch((error) => {
      root.querySelector("[role=status]").textContent = error.message;
      report?.(error);
    });
  // ── 两翼纹章栏：13 名器真实进度仪表 ──
  function renderWings(s) {
    const tiles = relicStates(s, data);
    const make = (r) => {
      const el = doc.createElement("button");
      el.className = "xsd2-tile " + r.state;
      el.dataset.relic = r.id;
      el.title = r.rel.name + " · " + r.rel.carrier;
      const img = doc.createElement("img");
      img.src = data.relicEmblems?.[r.id]?.[String(r.stage) || "1"] || "";
      img.alt = r.rel.name;
      el.append(img);
      el.onclick = () => openXj(r.id, s);
      return el;
    };
    wingL.replaceChildren(...tiles.slice(0, 7).map(make));
    wingR.replaceChildren(...tiles.slice(7).map(make));
  }
  // ── 名器玄鉴：烙印归属＋四境界＋朱批＋浸润＋同页跳转 ──
  function openXj(id, s) {
    const rel = data.relicDb[id];
    if (!rel) return;
    const rs = relicStates(s, data).find((x) => x.id === id);
    const owned = rs.state !== "none";
    const badge = owned
      ? rs.state === "self"
        ? '<span class="xsd2-badge bself">◈ 目前的烙印归属：' + esc(rs.owner || s.identity) + "（契约主）</span>"
        : '<span class="xsd2-badge bother">◈ 目前的烙印归属：' + esc(rs.owner) + "（已被占据）</span>"
      : '<span class="xsd2-badge bnone">◈ 尚未有烙印归属</span>';
    const tabs = Object.entries(data.relicDb)
      .map(([k, r]) => '<button class="xsd2-xtab' + (k === id ? " on" : "") + '" data-xjtab="' + k + '">' + esc(r.name) + "</button>")
      .join("");
    const CN = ["一", "二", "三", "四"];
    const cols = [1, 2, 3, 4]
      .map((k) => {
        const stg = rel.stages[String(k)];
        if (!stg) return "";
        const awake = rs.stage >= k;
        const isNext = rs.stage + 1 === k;
        const sign = awake
          ? '<p class="xsd2-sign">【玄妙体征】</p><p>' + esc(stg.desc) + "</p>"
          : '<p class="xsd2-sign">【天机未启】</p><p>玄妙道机属于混沌阴阳之间，待双修火候与天道机缘突破方可显化。</p>';
        const lockbox = '<div class="xsd2-lockbox"><p>' + esc(stg.lock || "") + "</p></div>";
        let soak = "";
        if (isNext && k === 2) {
          const pr = s.relic_progress?.[id];
          if (pr) {
            const pct = Math.round((pr.count / pr.target) * 100) || 0;
            soak = '<div class="xsd2-soak"><b>✦ 阶位浸润（一升二 · ' + (pr.count || 0) + "/" + (pr.target || 3) + ' 次 情动）（' + pct + '%）</b><div class="xsd2-sbar"><i style="width:' + pct + '%"></i></div><p>💧 蓄力灌注中：每次有效内射/浸润推进 1 次</p></div>';
          }
        }
        return '<div class="xsd2-col' + (awake ? " awake" : "") + (isNext ? " next" : "") + '">'
          + '<div class="xsd2-colhead"><span class="xsd2-jie">第' + CN[k - 1] + '境界</span><span class="xsd2-st">' + (awake ? "✦ 已觉醒" : "🔒 锁羽") + "</span></div>"
          + "<h4>" + esc(stg.name) + "</h4>" + sign + lockbox + soak + "</div>";
      })
      .join("");
    const stageImg = rs.stage > 0 ? data.relicEmblems?.[id]?.[String(rs.stage)] : data.relicEmblems?.[id]?.["1"];
    xjRoot.innerHTML =
      '<div class="xsd2-xj open"><div class="xsd2-xj-sheet">'
      + '<header><img src="' + (stageImg || "") + '" alt=""><div><h3>仙姝堕 · 名器玄鉴</h3><p>载体宿主：' + esc(rel.carrier) + " · " + esc(rel.name) + '</p></div><span class="xsd2-typetag">' + esc(rel.type) + "</span>" + badge + '<button class="x" data-close>✕</button></header>'
      + '<div class="xsd2-xtabs">' + tabs + '</div><div class="xsd2-cols">' + cols + '</div>'
      + '<footer><span>✦ 名器 1-4 阶段已并入玄鉴画卷 · 点击名签即可同页翻阅</span><button class="xsd2-closegold" data-close>✕ 关闭玄鉴</button></footer>'
      + "</div></div>";
    xjRoot.classList.add("open");
    const close = () => (xjRoot.innerHTML = "");
    const xjEl = xjRoot.querySelector(".xj");
    xjEl.addEventListener("click", (e) => { if (e.target.classList.contains("xj")) close(); });
    xjEl.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
    xjEl.querySelectorAll("[data-xjtab]").forEach((b) => b.addEventListener("click", () => { close(); openXj(b.dataset.xjtab, s); }));
    dialogs.push(close);
  }
  // ── 心迹面板：好感金条＋菱形节点（专属剧情启动钮）＋事件流水 ──
  function openFavor(character, s) {
    const value = s.character_metrics?.[character]?.好感度 ?? 0;
    const ladder = favorLadder(data, character);
    const completed = s.completed_character_stages?.[character];
    const profiles = data.characterProfiles || {};
    const prio = (sid) => profiles[character]?.stages?.find((x) => x.id === sid)?.priority ?? 0;
    const cap = (() => {
      const open = ladder.filter((x) => prio(x.fromStage) <= curPrio(completed) && prio(x.toStage) > curPrio(completed));
      function curPrio(stage) { return prio(stage); }
      return open.length ? Math.min(...open.map((x) => x.threshold)) : null;
    })();
    const diamonds = ladder.map((x) => {
      const done = prio(x.toStage) <= prio(completed);
      const now = !done && value >= x.threshold;
      return { threshold: x.threshold, done, now, label: x.label };
    });
    const log = s.favor_log?.[character] || [];
    const el = doc.createElement("aside");
    el.className = "xsd2-favor";
    el.innerHTML =
      '<header><h3>' + esc(character) + " · 心迹</h3><button class=\"x\" data-close>✕</button></header>"
      + '<div class="xsd2-fbar"><i style="width:' + value + '%"></i><span>' + value + " / 100" + (cap !== null && value >= cap ? " · 已满盈" : "") + "</span></div>"
      + (cap !== null && value >= cap ? '<div class="xsd2-cap"><p>好感已达当前节点上限（' + cap + "）——完成对应专属剧情之前不再累积。</p></div>" : "")
      + (diamonds.length
          ? '<div class="xsd2-nodes">' + diamonds.map((x) =>
              '<div class="xsd2-node' + (x.done ? " done" : x.now ? " now" : "") + '"'
              + (x.now ? ' title="点击开启专属剧情：' + esc(x.label) + '"' : "") + ">"
              + (x.now ? GOURD_SVG : "") + "<i></i><span>" + x.threshold + "</span><em>"
              + (x.done ? "剧情已了" : x.now ? esc(x.label) + " · 可开启" : "未达") + "</em></div>"
            ).join("") + "</div>"
          : '<p class="xsd2-label">此人尚未配置晋升之路。</p>')
      + "<h4>近日心迹</h4>"
      + (log.length
          ? '<ul class="xsd2-flog">' + log.map((x) => '<li class="' + (x.delta > 0 ? "up" : "dn") + '"><b>' + (x.delta > 0 ? "+" : "") + x.delta + "</b> " + (x.via === "记心上" || x.via === "记恨" ? "档位 · " : "锚点 · ") + esc(x.note) + "<span>" + x.turn + "轮前</span></li>").join("") + "</ul>"
          : '<p class="xsd2-label">近日暂无心迹波动。</p>')
      + '<p class="xsd2-label">数值与事件由后台核验，模型只作申报；冷却与上限皆按表执行。</p>';
    const close = () => el.remove();
    el.addEventListener("click", (e) => { if (e.target === el) close(); });
    el.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
    const p = portrait(character, s, data);
    if (p) {
      const im = doc.createElement("img");
      im.src = p.small; im.alt = character;
      im.style.cssText = "width:44px;height:44px;border-radius:6px;object-fit:cover;cursor:zoom-in";
      im.dataset.xsd2Zoom = p.large;
      im.addEventListener("click", () => {
        lightbox.querySelector("img").src = p.large;
        lightbox.querySelector("p").textContent = character + " · 立绘大图（本地图包；正式版走 本地图包+图床 双链，不做内嵌）";
        lightbox.classList.add("open");
      });
      el.insertBefore(im, el.querySelector(".xsd2-fbar"));
    }
    lightbox.addEventListener("click", () => lightbox.classList.remove("open"));
    dialogs.push(close);
    container.append(el);
  }
  function render() {
    if (disposed) return;
    const folds = [...root.querySelectorAll("details")].map((x) => x.open);
    for (const p of plugins) p();
    plugins = [];
    const s = runtime.getSnapshot();
    renderSettlement(doc,settlement,s,options.settlementEffects);
    if (!s) {
      root.className = "xsd2-opening-root";
      const view = runtime.getOpeningView?.() || {
        mode: "identity_menu",
        key: "menu",
      };
      if (opening?.key !== view.key) {
        opening?.destroy();
        opening = null;
      }
      if (!opening) {
        if (view.mode === "unavailable") {
          root.textContent = "尚未读取到有效的入世身份，请检查所选开局。";
        } else {
          opening = mountOpening(doc, root, runtime, data, report, view);
          opening.key = view.key;
        }
      }
      return;
    }
    opening?.destroy();
    opening = null;
    root.className = "xsd2-hud";
    renderWings(s);
    const st = s.stat_data,
      field = (k, n) =>
        '<dt data-xsd-slot="' +
        n +
        '">' +
        esc(k) +
        "</dt><dd>" +
        esc(st[k] || "无") +
        "</dd>",
      avatar = (name) => {
        const p = portrait(name, s, data);
        return p
          ? '<button data-portrait="' +
              esc(name) +
              '" aria-label="查看' +
              esc(name) +
              '立绘"><img class="xsd2-avatar" src="' +
              p.small +
              '" alt="' +
              esc(name) +
              '"></button>'
          : "";
      };
    // 关系刻度 → 心迹入口：注册了好感表的人物可点开，有可推进节点者挂专属标记（叶红缨=小葫芦）
    const metricOf = (name) => s.character_metrics?.[name]?.好感度;
    const relationChips = String(st.关系刻度 || "")
      .split("｜")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((piece) => {
        const name = piece.split("、")[0].trim();
        if (metricOf(name) === undefined) return '<span class="xsd2-chip">' + esc(piece) + "</span>";
        const hasNode = favorLadder(data, name).some(
          (x) => (s.completed_character_stages?.[name] || x.fromStage) === x.fromStage && metricOf(name) >= x.threshold,
        );
        return '<span class="xsd2-chip" data-favor="' + esc(name) + '">' + esc(piece) + (hasNode ? GOURD_SVG : "") + "</span>";
      })
      .join("");
    root.innerHTML =
      '<header><span data-xsd-slot="1">' +
      avatar(s.identity) +
      "<strong>" +
      esc(st.自设?.name || s.identity) +
      "</strong> · " +
      esc(st.修为) +
      '</span><span data-xsd-slot="2">仙盟历 ' +
      esc(dateText(s.calendarDate)) +
      " · " +
      esc(st.历时 || "0日") +
      '</span><span data-xsd-slot="3">' +
      esc(st.地点) +
      " · " +
      esc(st.阵营) +
      '</span></header><nav><div data-xsd-slot="map" data-slot-number="4"></div><button data-gm data-xsd-slot="5">GM</button><div data-xsd-slot="6"><button data-action="观察四周">观察</button><button data-action="与在场之人交谈">交谈</button><button data-action="自行行动">自由行动</button></div></nav><p>' +
      esc(st.环境 || "") +
      "</p><p>" +
      esc(st.状态 || "") +
      "</p><p>" +
      esc(st.目标 || "") +
      "</p>" +
      (st.危机 && st.危机 !== "无" ? '<div class="xsd2-alert"><b>危 机</b> · ' + esc(st.危机) + "</div>" : "") +
      '<details><summary>局势与线索</summary><dl>' +
      field("局势", 7) +
      field("线索", 8) +
      field("危机", 9) +
      field("暗处", "hidden") +
      '</dl></details><details><summary>储物栏</summary><div data-xsd-slot="10">' +
      (s.inventory
        .map(
          (i) =>
            '<button data-item="' +
            esc(i.id || i.name) +
            '" title="' + esc(describeItem(i).description + "\n" + describeItem(i).effect) + '">' +
            esc(i.name) +
            " × " + i.count + " · " + (describeItem(i).consumable ? "消耗品" : "非消耗品") +
            "</button>",
        )
        .join("") || "暂无物品") +
      '</div><p data-xsd-slot="11">' +
      esc(st.纳戒 || "") +
      '</p><p data-xsd-slot="12">' +
      (options.readOnly ? "此楼状态记录" : s.manual.inventory ? "物品已人工设置" : "点击物品查看介绍与操作") +
      "</p></details><details><summary>风闻与气象</summary><dl>" +
      field("近闻", 13) +
      field("远闻", 14) +
      field("天气", 15) +
      '</dl></details><div class="xsd2-npcs" data-xsd-slot="16">' +
      (st.在场角色 || [])
        .map(
          (n) =>
            '<article class="xsd2-npc">' +
            avatar(n.名) +
            "<strong>" +
            esc(n.名) +
            "</strong><div>" +
            esc(n.修为 || "") +
            "</div><div>关系：" +
            esc(n.关系 || "未明") +
            "</div><div>" +
            esc(n.心境) +
            " · " +
            esc(n.神态) +
            "</div></article>",
        )
        .join("") +
      '</div><div data-xsd-slot="17"></div><p class="xsd2-label" data-xsd2-relations>' +
      relationChips +
      (Object.keys(s.manual).length ? " · 存在人工设置" : "") +
      '</p><p class="xsd2-feedback" role="status" aria-live="polite"></p>';
    root
      .querySelectorAll("details")
      .forEach((x, i) => (x.open = folds[i] || false));
    root.querySelector("[data-gm]").onclick = () =>
      dialogs.push(openGM(doc, runtime, data, report));
    root
      .querySelectorAll("[data-item]")
      .forEach(
        (b) =>
          (b.onclick = () =>
            dialogs.push(openItem(doc, runtime, b.dataset.item, report))),
      );
    root.querySelectorAll("[data-action]").forEach(
      (b) =>
        (b.onclick = () =>
          invoke({
            type: "QUICK_ACTION",
            payload: { text: b.dataset.action },
          })),
    );
    root.querySelectorAll("[data-portrait]").forEach(
      (b) =>
        (b.onclick = () => {
          const p = portrait(b.dataset.portrait, s, data),
            el = modal(doc, b.dataset.portrait);
          dialogs.push(() => el.remove());
          const img = doc.createElement("img");
          img.src = p.large;
          img.alt = b.dataset.portrait;
          img.onerror = () => {
            if (img.src.endsWith(".png")) img.src = p.small;
            else img.replaceWith(doc.createTextNode("此处尚未部署立绘"));
          };
          el.querySelector(".xsd2-dialog-body").append(img);
        }),
    );
    root.querySelectorAll("[data-favor]").forEach(
      (c) =>
        (c.onclick = () => openFavor(c.dataset.favor, s)),
    );
    root
      .querySelectorAll("img")
      .forEach(
        (img) =>
          (img.onerror = () => img.replaceWith(doc.createTextNode(img.alt))),
      );
    for (const plugin of runtime.uiPlugins || [])
      if (plugin.mount) {
        const unmount = plugin.mount(
          root.querySelector("[data-xsd-slot=map]"),
          runtime,
        );
        if (typeof unmount === "function") plugins.push(unmount);
      }
    if (options.readOnly) {
      root.dataset.xsd2Readonly = "";
      root.querySelectorAll("button").forEach(b => { b.disabled = true; b.onclick = null; });
      stagebar.querySelectorAll("button").forEach(b => { b.disabled = true; b.onclick = null; });
    }
  }
  const unsubscribe = runtime.subscribe(render);
  render();
  return {
    render,
    destroy() {
      disposed = true;
      unsubscribe();
      opening?.destroy();
      plugins.forEach((f) => f());
      dialogs.forEach((f) => f?.());
      root.remove();
      settlement.remove();
      stagebar.remove();
      xjRoot.remove();
      lightbox.remove();
      style.remove();
    },
  };
}
module.exports = { mountHUD, portrait, CSS, PALETTE, PORTRAITS };
