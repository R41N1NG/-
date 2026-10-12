"use strict";
const { esc, modal } = require("./dom");
const { mountOpening } = require("./opening_menu");
const {renderSettlement} = require("./settlement_panel");
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
const CSS = `.xsd2-hud,.xsd2-dialog{color:${PALETTE.foreground};background:${PALETTE.background};border:1px solid #756746;border-radius:10px;padding:14px;font-family:serif;line-height:1.7}.xsd2-hud button,.xsd2-dialog button,.xsd2-dialog input,.xsd2-dialog select,.xsd2-dialog textarea{color:#eee9d9;background:#273b34;border:1px solid #8b927e;border-radius:5px;padding:7px;margin:3px;font:inherit}.xsd2-hud button:focus-visible,.xsd2-dialog :focus-visible{outline:2px solid #d5b97b;outline-offset:2px}.xsd2-hud header,.xsd2-hud nav,.xsd2-npcs{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.xsd2-hud details{border-top:1px solid #514d3e;margin-top:9px;padding-top:7px}.xsd2-hud summary{cursor:pointer;color:#d5b97b}.xsd2-hud dl{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;margin:8px 0}.xsd2-hud dd{margin:0;color:#c5c9bd}.xsd2-avatar{width:56px;height:68px;object-fit:cover;border-radius:6px}.xsd2-npc{max-width:240px}.xsd2-dialog{max-width:min(680px,90vw);max-height:85vh}.xsd2-dialog::backdrop{background:#000b}.xsd2-dialog header{display:flex;justify-content:space-between}.xsd2-dialog label{display:block;margin:8px 0}.xsd2-dialog textarea{width:90%;min-height:90px}.xsd2-dialog img{max-width:100%;max-height:70vh;object-fit:contain}.xsd2-feedback{color:#ffcb8c}.xsd2-label{font-size:.85em;color:#c5c9bd}`;
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
function mountHUD(doc, container, runtime, data, report, options = {}) {
  const root = doc.createElement("section");
  root.className = "xsd2-hud";
  const style = doc.createElement("style");
  style.textContent = CSS;
  doc.head.append(style);
  const settlement = doc.createElement("div");
  settlement.dataset.xsd2Settlements = "";
  container.append(settlement,root);
  let plugins = [],
    dialogs = [],
    disposed = false,
    opening = null;
  const invoke = (intent) =>
    runtime.dispatchIntent(intent).catch((error) => {
      root.querySelector("[role=status]").textContent = error.message;
      report?.(error);
    });
  function render() {
    if (disposed) return;
    const folds = [...root.querySelectorAll("details")].map((x) => x.open);
    for (const p of plugins) p();
    plugins = [];
    const s = runtime.getSnapshot();
    renderSettlement(doc,settlement,s);
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
      "</p><details><summary>局势与线索</summary><dl>" +
      field("局势", 7) +
      field("线索", 8) +
      field("危机", 9) +
      field("暗处", "hidden") +
      '</dl></details><details><summary>纳戒与囊中物</summary><div data-xsd-slot="10">' +
      (s.inventory
        .map(
          (i) =>
            '<button data-item="' +
            esc(i.id || i.name) +
            '" title="' + esc(describeItem(i).description + "\n" + describeItem(i).effect) + '">' +
            esc(i.name) +
            " × " +
            i.count + " · " + (describeItem(i).consumable ? "消耗品" : "非消耗品") +
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
      '</div><div data-xsd-slot="17"></div><p class="xsd2-label">' +
      esc(st.关系刻度 || "") +
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
      style.remove();
    },
  };
}
module.exports = { mountHUD, portrait, CSS, PALETTE, PORTRAITS };
