"use strict";
const { isPalaceLord, getCharacterCorruption, CORRUPTION_STAGES } = require("../runtime/corruption");
const {createPanelAction}=require("./panel_action");
const C=require("../runtime/contracts");
const {downloadDiagnostics}=require("./diagnostics");
const {relicOwner,playerOwner}=require("./relic_owner");
const { esc, modal, html } = require("./dom");
const { tokenCss } = require("./tokens");
const {mountPlayerAvatar} = require("./player_avatar");
const { mountOpening } = require("./opening_menu");
const { renderSettlement } = require("./settlement_panel");
const { mountRelicFanfare } = require("./relic_fanfare");
const { openItem } = require("./item_panel");
const { openGM } = require("./gm_panel");
const {openEras}=require("./era_panel");
const {openRealm}=require("./realm_panel");
const {meets} = require("../runtime/conditions");
const { dateText } = require("../runtime/contracts");
const { describeItem } = require("../runtime/item_catalog");
const PALETTE = {
  background: "#171e1c",
  foreground: "#eee9d9",
  muted: "#c5c9bd",
  accent: "#d5b97b",
};
const CSS = `${tokenCss([".xsd2-hud", ".xsd2-dialog", ".xsd2-xj"])}
@font-face{font-family:"xsd2HeadBrush";src:url(data:font/woff2;base64,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) format("woff2");font-display:swap}
.xsd2-stagebar,.xsd2-hud,.xsd2-dialog,.xsd2-xj,.xsd2-fan-host{--xsd2-gold:#d5b97b;--xsd2-gold-bright:#e8cf8f;--xsd2-gold-deep:#b98f3e;--xsd2-gold-warm:#e8b46b;--xsd2-gold-leaf:#E8C363;--xsd2-gold-plate:#D9A93C;--xsd2-seal-red:#C8372A;--xsd2-relic-red:#D8402C;--xsd2-ink:#141B26}
.xsd2-hud,.xsd2-dialog{color:${PALETTE.foreground};background:${PALETTE.background};border:1px solid #756746;border-radius:10px;padding:14px;font-family:serif;line-height:1.7}.xsd2-hud button,.xsd2-dialog button,.xsd2-dialog input,.xsd2-dialog select,.xsd2-dialog textarea{color:#eee9d9;background:#273b34;border:1px solid #8b927e;border-radius:5px;padding:7px;margin:3px;font:inherit}.xsd2-hud button:focus-visible,.xsd2-dialog :focus-visible{outline:2px solid var(--xsd2-gold);outline-offset:2px}.xsd2-head,.xsd2-hud nav{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.xsd2-hud summary{cursor:pointer;color:var(--xsd2-gold)}.xsd2-hud dl{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;margin:8px 0}.xsd2-hud dd{margin:0;color:#c5c9bd}.xsd2-avatar{width:56px;height:68px;object-fit:cover;border-radius:6px}.xsd2-dialog{max-width:min(680px,90vw);max-height:85vh}.xsd2-dialog::backdrop{background:#000b}.xsd2-dialog header{display:flex;justify-content:space-between}.xsd2-dialog label{display:block;margin:8px 0}.xsd2-dialog textarea{width:90%;min-height:90px}.xsd2-dialog img{max-width:100%;max-height:70vh;object-fit:contain}.xsd2-feedback{color:#ffcb8c}.xsd2-label{font-size:.85em;color:#c5c9bd}
.xsd2-hud{background:linear-gradient(180deg,#202925,#171e1c);border-radius:14px;padding:20px 24px 16px;box-shadow:0 8px 40px #0008}.xsd2-head{border-bottom:1px solid #394139;padding-bottom:12px;position:relative}.xsd2-head::after{content:"";position:absolute;left:0;right:0;bottom:-4px;height:1px;background:linear-gradient(90deg,transparent,var(--xsd2-gold-a55) 20%,var(--xsd2-gold-a55) 80%,transparent)}.xsd2-head h1{margin:0;font-family:"xsd2HeadBrush","STXingkai","华文行楷","KaiTi","楷体",serif;font-size:26px;letter-spacing:8px;font-weight:600;color:var(--xsd2-gold-bright)}.xsd2-head .xsd2-sub{font-size:11px;letter-spacing:3px;color:#89948a}.xsd2-head [data-gm]{margin-left:auto}.xsd2-who{display:flex;gap:14px;margin-top:14px;align-items:flex-start}.xsd2-document{flex:1;min-width:0}.xsd2-plaque{display:inline-block;background:#27332b;border:1px solid #756746;border-radius:6px;padding:6px 14px;letter-spacing:2px}.xsd2-portrait{margin-left:auto}.xsd2-atmo{color:#c5c9bd;font-size:.95em}.xsd2-row span{overflow-wrap:anywhere}.xsd2-npcs{display:block}.xsd2-npc{display:flex;gap:12px;max-width:none;border:1px solid #394139;border-radius:8px;padding:10px;margin-top:8px;background:#1a211e}.xsd2-npc h4{margin:0 0 4px;letter-spacing:2px;color:var(--xsd2-gold)}.xsd2-hud .xsd2-npc{display:grid;grid-template-columns:72px minmax(0,1fr);align-items:start;gap:14px}.xsd2-hud .xsd2-npc>[data-portrait],.xsd2-hud .xsd2-portrait>button{width:72px;height:88px;padding:0;margin:0;display:block;line-height:0;overflow:hidden;align-self:start;box-sizing:border-box}.xsd2-hud .xsd2-npc>[data-portrait] img,.xsd2-hud .xsd2-portrait>button img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 25%}.xsd2-hud .xsd2-npc>div{min-width:0}.xsd2-avatar-placeholder{width:72px;height:88px;box-sizing:border-box;border:1px solid #394139;border-radius:6px;display:flex;align-items:center;justify-content:center;text-align:center;color:#89948a;font-size:12px}.xsd2-npc small{color:#89948a}.xsd2-hud details{border:1px solid #394139;border-radius:8px;background:#1a211e;margin-top:10px;padding:4px 12px}.xsd2-foot{text-align:right;color:#89948a;font-size:11px;letter-spacing:2px;margin-top:12px}@media(max-width:640px){.xsd2-hud{padding:14px}.xsd2-head .xsd2-sub{display:none}.xsd2-row{grid-template-columns:56px minmax(0,1fr)}.xsd2-who{gap:8px}.xsd2-plaque{padding:4px 8px}}
.xsd2-stagebar{display:flex;gap:16px;align-items:flex-start;width:100%;max-width:1080px;box-sizing:border-box;justify-content:center;margin-inline:auto}.xsd2-stagebar>.xsd2-hud{flex:1 1 0;max-width:660px;min-width:0;box-sizing:border-box}.xsd2-opening-root{width:100%;min-width:0;box-sizing:border-box}
.xsd2-wing{display:flex;flex-direction:column;gap:10px;padding-top:6px}
.xsd2-tile{position:relative;width:104px;height:104px;border-radius:10px;border:1px solid #333a35;background:#151d1a;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.18s;overflow:hidden;padding:0}
.xsd2-tile:hover{border-color:var(--xsd2-gold);transform:translateY(-2px)}
.xsd2-tile img{width:94px;height:94px;object-fit:contain}
.xsd2-tile.none img{filter:grayscale(1) brightness(.65);opacity:.75}
.xsd2-tile.other img{filter:grayscale(1) brightness(.72) sepia(1) hue-rotate(-38deg) saturate(2.1)}
.xsd2-tile.self{border-color:#756746;box-shadow:0 0 10px var(--xsd2-gold-a22)}
.xsd2-tile.other{border-color:#6e2424;background:#241416;box-shadow:0 0 10px #6e242433}
.xsd2-plaque{display:inline-block;background:#273b34;border:1px solid #756746;border-radius:6px;padding:5px 13px;letter-spacing:2px}
.xsd2-row{display:grid;grid-template-columns:64px 1fr;gap:10px;padding:7px 4px;border-bottom:1px dashed #333931;align-items:baseline}
.xsd2-row b{color:var(--xsd2-gold);font-size:12px;letter-spacing:3px;font-weight:500}
.xsd2-row.crisis b{color:#e08585}
.xsd2-row.crisis span{color:#e08585;background:#3a1e1e55;border-radius:4px;padding:2px 8px}
.xsd2-chip{display:inline-block;border:1px solid #756746;border-radius:999px;padding:1px 10px;margin:1px 4px 1px 0;cursor:pointer;color:#eee9d9;font-size:.92em}
.xsd2-chip:hover{border-color:var(--xsd2-gold);color:var(--xsd2-gold-bright)}
.xsd2-gourd{width:13px;height:13px;color:var(--xsd2-gold-bright);vertical-align:-2px;margin-left:4px}
.xsd2-nodes{display:flex;gap:16px;justify-content:space-around;margin:10px 0 6px}
.xsd2-node{display:flex;flex-direction:column;align-items:center;gap:4px}
.xsd2-node i{width:15px;height:15px;transform:rotate(45deg);border:1.5px solid #4a5258;display:block}
.xsd2-node.done i{background:linear-gradient(135deg,var(--xsd2-gold-bright),var(--xsd2-gold-deep));border-color:var(--xsd2-gold-bright);box-shadow:0 0 8px var(--xsd2-gold-a66)}
.xsd2-node.now{cursor:pointer}
.xsd2-node.now i{border-color:var(--xsd2-gold);box-shadow:0 0 10px var(--xsd2-gold-a88)}
.xsd2-node.now em{color:var(--xsd2-gold-bright)}
.xsd2-node em{font-style:normal;font-size:10px;color:#8b927e;white-space:nowrap}
.xsd2-node span{font-size:11px;color:#c5c9bd}
.xsd2-topmap{margin-left:auto}.xsd2-head .xsd2-topmap+[data-gm]{margin-left:0}.xsd2-favor{width:min(560px,92vw);box-sizing:border-box;max-height:84vh;overflow:auto}.xsd2-favor header strong{color:var(--xsd2-gold-bright);letter-spacing:3px}.xsd2-favor .xsd2-nodes{flex-wrap:wrap}.xsd2-favor .xsd2-node{min-width:56px;background:transparent}
.xsd2-cap{border-left:3px solid var(--xsd2-gold-warm);padding:4px 10px;background:#241f16;border-radius:0 6px 6px 0;margin:8px 0}
.xsd2-cap p{margin:0;color:var(--xsd2-gold-warm);font-size:.9em}
.xsd2-fbar{position:relative;height:18px;background:#20281f;border:1px solid #514d3e;border-radius:999px;overflow:hidden}
.xsd2-fbar i{position:absolute;inset:0;background:linear-gradient(90deg,var(--xsd2-gold-deep),var(--xsd2-gold-bright))}
.xsd2-fbar span{position:absolute;inset:0;text-align:center;font-size:11px;line-height:18px;color:#fffbe9}
.xsd2-flog{list-style:none;padding:0;margin:6px 0}
.xsd2-flog li{display:flex;gap:8px;align-items:baseline;border-bottom:1px dashed #333931;padding:5px 0}
.xsd2-flog b{width:34px;text-align:right}
.xsd2-flog li.up b{color:#9fbf7a}.xsd2-flog li.dn b{color:#e08585}
.xsd2-flog li span{margin-left:0;color:#eee9d9;font-size:.95em}.xsd2-flog li b{margin-left:auto}
.xsd2-xj{position:fixed;inset:0;background:#000b;display:none;align-items:center;justify-content:center;z-index:10}
.xsd2-xj.open{display:flex}
.xsd2-xj-sheet{box-sizing:border-box;background:#1b2320;border:1px solid #756746;border-radius:12px;width:min(1080px,96vw);max-height:92vh;overflow:auto;padding:16px 18px}
.xsd2-xj-sheet header{display:flex;gap:12px;align-items:center;flex-wrap:wrap;border-bottom:1px solid #514d3e;padding-bottom:10px}
.xsd2-xj-sheet header img{width:52px;height:52px;border-radius:8px;border:1px solid #514d3e}
.xsd2-xj-sheet h3{margin:0;color:var(--xsd2-gold-bright);letter-spacing:3px;font-size:20px}
.xsd2-xj-sheet header p{margin:2px 0 0;color:#8b927e;font-size:.9em}
.xsd2-typetag{border:1px solid #514d3e;border-radius:4px;padding:2px 8px;color:#c5c9bd;font-size:.85em}
.xsd2-badge{margin-left:auto;border-radius:999px;padding:4px 12px;font-size:.9em}
.xsd2-badge.bself{background:#1d2b1f;border:1px solid #4a7a4e;color:#9fbf7a}
.xsd2-badge.bother{background:#2b1d1d;border:1px solid #7a2e2e;color:#c96a6a}
.xsd2-badge.bnone{background:#20262a;border:1px solid #4a5258;color:#8b927e}
.xsd2-xtabs{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0 4px}
.xsd2-xtab{background:#1a211e;border:1px solid #514d3e;border-radius:6px;color:#c5c9bd;padding:5px 12px;cursor:pointer;font:inherit;font-size:.9em}
.xsd2-xtab.on{border-color:var(--xsd2-gold);color:var(--xsd2-gold-bright);background:#242a22}
.xsd2-cols{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:10px}
.xsd2-col{min-width:0;overflow-wrap:anywhere;border:1px solid #514d3e;border-radius:10px;padding:12px;background:#1a211e;opacity:.62}
.xsd2-col.awake{opacity:1;border-color:#756746}
.xsd2-col.next{border-color:#5a5342}
.xsd2-colhead{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
.xsd2-jie{font-size:.8em;color:#8b927e;letter-spacing:2px}
.xsd2-st{font-size:.75em;border-radius:4px;padding:1px 6px}
.xsd2-col.awake .xsd2-st{color:var(--xsd2-gold-bright);border:1px solid #756746}
.xsd2-col .xsd2-st{color:#8b927e;border:1px solid #514d3e}
.xsd2-col h4{margin:2px 0 8px;letter-spacing:2px;color:#eee9d9}
.xsd2-sign{color:var(--xsd2-gold);font-size:.85em;letter-spacing:1px;margin:6px 0 2px}
.xsd2-col p{color:#c5c9bd;font-size:.92em;margin:4px 0}
.xsd2-lockbox{border:1px solid #4a4436;border-radius:6px;padding:6px 10px;margin-top:8px;background:#20241e}
.xsd2-lockbox p{color:#c9b98a;font-size:.88em;margin:0}
.xsd2-lockbox.rule{border-color:#756746}
.xsd2-lockbox.rule p{color:var(--xsd2-gold-bright)}
.xsd2-soak{border:1px solid #756746;border-radius:6px;padding:8px 10px;margin-top:10px;background:#232a20}
.xsd2-soak b{color:var(--xsd2-gold-bright);font-size:.88em}
.xsd2-soak p{font-size:.85em;margin:4px 0 0}
.xsd2-sbar{height:8px;background:#20281f;border:1px solid #514d3e;border-radius:999px;overflow:hidden;margin:6px 0}
.xsd2-sbar i{display:block;height:100%;background:linear-gradient(90deg,var(--xsd2-gold-deep),var(--xsd2-gold-bright))}
.xsd2-xj-sheet footer{display:flex;justify-content:space-between;align-items:center;margin-top:12px;color:#8b927e;font-size:.85em}
.xsd2-closegold{background:#242a22;border:1px solid var(--xsd2-gold);color:var(--xsd2-gold-bright);border-radius:6px;padding:6px 14px;cursor:pointer;font:inherit}
@media (max-width:980px){
  .xsd2-stagebar{flex-direction:column;align-items:stretch}
  .xsd2-stagebar>.xsd2-hud{order:0}
  .xsd2-wing{order:1;flex-direction:row;flex-wrap:wrap;width:100%;justify-content:flex-start;padding-top:0}
  .xsd2-tile{width:80px;height:80px}
  .xsd2-tile img{width:72px;height:72px}
  .xsd2-cols{grid-template-columns:repeat(2,minmax(0,1fr))}
  .xsd2-row{grid-template-columns:56px minmax(0,1fr)}
  .xsd2-badge{margin-left:0}
}
.xsd2-favor .xsd2-node{border:0!important;background:transparent!important;box-shadow:none;padding:10px 6px;margin:0;min-width:56px;min-height:76px;outline:none}
.xsd2-favor .xsd2-node i{width:20px;height:20px;margin:5px 0}
.xsd2-favor .xsd2-node:focus-visible i{outline:2px solid var(--xsd2-gold-bright);outline-offset:4px}
.xsd2-promotion-ready-notice{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;box-sizing:border-box;width:100%;margin:14px 0;padding:12px 16px;border:2px solid #e6b75b;border-radius:9px;background:linear-gradient(100deg,#493819,#282b20);color:#ffe5a6;font-size:16px;line-height:1.7;box-shadow:0 0 16px #e6b75b33}
.xsd2-promotion-ready-notice.ongoing{border:1px solid #756746;background:#202925;box-shadow:none;color:#c5c9bd;font-size:14px}
.xsd2-mobile-relics{display:none}
.xsd2-xj{color:#eee9d9;font-family:serif;line-height:1.6}.xsd2-xj [data-close]{background:#273b34;color:var(--xsd2-gold-bright);border:1px solid #8b927e;border-radius:6px;padding:7px;cursor:pointer}.xsd2-xj-sheet header{position:relative;padding-right:48px}.xsd2-xj-sheet header .x{position:absolute;right:0;top:0}
.xsd2-xj{width:100vw;max-width:none;height:100dvh;max-height:none;margin:0;padding:12px;border:0;box-sizing:border-box;background:transparent;overflow:hidden}
.xsd2-xj::backdrop{background:#000b}
.xsd2-xj-sheet{display:flex;flex-direction:column;max-height:calc(100dvh - 24px);overflow:hidden}
.xsd2-xj-sheet header,.xsd2-xtabs,.xsd2-xj-sheet footer{flex:none}
.xsd2-cols{min-height:0;overflow:auto;align-items:start;overscroll-behavior:contain}
.xsd2-portrait-dialog{width:min(800px,calc(100vw - 24px));box-sizing:border-box;overflow:auto;padding:12px}
.xsd2-portrait-dialog .xsd2-dialog-body img{display:block;width:100%;height:auto;max-height:75dvh;object-fit:contain;margin:auto}
.xsd2-dialog{box-sizing:border-box;overflow:auto}.xsd2-dialog header{gap:12px;align-items:center}.xsd2-dialog header button{flex:none}
@media(max-width:980px){
 .xsd2-stagebar{width:100%;gap:10px;min-width:0}.xsd2-stagebar>.xsd2-hud{width:100%;max-width:none;flex:none}
 .xsd2-wing{display:none}.xsd2-mobile-relics{display:flex;gap:8px;overflow-x:auto;width:100%;max-width:100%;box-sizing:border-box;padding:5px 2px 10px;flex-wrap:nowrap;scroll-snap-type:x proximity}
 .xsd2-mobile-relics .xsd2-tile{flex:0 0 64px;width:64px;height:64px;scroll-snap-align:start}.xsd2-mobile-relics .xsd2-tile img{width:58px;height:58px}
 .xsd2-who{display:block}.xsd2-portrait[data-player-avatar-slot]{display:none}.xsd2-document{width:100%}
 .xsd2-xj-sheet{width:100%;padding:12px;max-height:calc(100dvh - 24px)}.xsd2-cols{grid-template-columns:1fr;gap:10px}
 .xsd2-xj-sheet header h3{font-size:17px;letter-spacing:1px}.xsd2-xj-sheet header p{font-size:12px}.xsd2-xj-sheet header img{width:40px;height:40px}.xsd2-xj-sheet footer>span{display:none}
 .xsd2-xtabs{flex-wrap:nowrap;overflow-x:auto;padding:4px 0}.xsd2-xtab{flex:none;white-space:nowrap}
 .xsd2-xj-sheet header [data-close]{margin-left:auto;min-width:40px;min-height:40px}
}
@media(max-width:480px){
 .xsd2-hud{padding:14px 12px;font-size:14px}.xsd2-head h1{font-size:25px;letter-spacing:5px}.xsd2-row{grid-template-columns:48px minmax(0,1fr);gap:8px;padding:8px 0}
 .xsd2-head{gap:8px}.xsd2-dialog{max-width:calc(100vw - 20px);width:calc(100vw - 20px);max-height:90dvh;padding:12px}
 .xsd2-npc{gap:10px}.xsd2-hud .xsd2-npc{grid-template-columns:56px minmax(0,1fr);gap:10px}.xsd2-hud .xsd2-npc>[data-portrait]{width:56px;height:70px}.xsd2-avatar-placeholder{width:56px;height:70px}
}
`;
// Names and file IDs are drawn from the migrated registry / local gallery manifest.
const PORTRAITS = {
  玄机子: "xuanjizi",
  炎雷子: "yanleizi",
  云逸尘: "yunyichen",
  清虚散人: "yunyichen",
  极乐太子: "jiletaizi",
  炼欲魔君: "lianyumojun",
  花间二鬼: "huajianergui",
  残阳老怪: "canyanglaoguai",
  肉山佛: "roushanfo",
  九皇子: "jiuhuangzi",
  厉锋: "lifeng",
  石岩: "shiyan",
  柳玉: "liuyu",
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
const PORTRAIT_CDN = {"bingxiangsi.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/bingxiangsi.jpg","bingxiangsi.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/bingxiangsi.png","canyanglaoguai.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/canyanglaoguai.jpg","canyanglaoguai.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/canyanglaoguai.png","chulingye.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/chulingye.jpg","chulingye_2.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/chulingye_2.jpg","chulingye.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/chulingye.png","chulingye_3.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/chulingye_3.jpg","chulingye_2.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/chulingye_2.png","guyue.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/guyue.jpg","chulingye_3.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/chulingye_3.png","guyue.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/guyue.png","guyue_2.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/guyue_2.jpg","guyue_3.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/guyue_3.jpg","guyue_2.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/guyue_2.png","guyue_3.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/guyue_3.png","guyue_bingxinlei.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/guyue_bingxinlei.jpg","guyue_bingxinlei.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/guyue_bingxinlei.png","guyunshu.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/guyunshu.jpg","huajianergui.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/huajianergui.jpg","guyunshu.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/guyunshu.png","huajianergui.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/huajianergui.png","huazhining.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/huazhining.jpg","jiletaizi.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/jiletaizi.jpg","huazhining.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/huazhining.png","jiletaizi.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/jiletaizi.png","jiuhuangzi.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/jiuhuangzi.jpg","lianyumojun.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/lianyumojun.jpg","jiuhuangzi.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/jiuhuangzi.png","lifeng.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/lifeng.jpg","lianyumojun.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/lianyumojun.png","liuhanyan.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/liuhanyan.jpg","lifeng.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/lifeng.png","liuyu.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/liuyu.jpg","liuhanyan.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/liuhanyan.png","lujinyan.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/lujinyan.jpg","liuyu.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/liuyu.png","lujinyan.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/lujinyan.png","lushisan.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/lushisan.jpg","murongqingge.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/murongqingge.jpg","lushisan.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/lushisan.png","npc_dragon_slave.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/npc_dragon_slave.jpg","murongqingge.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/murongqingge.png","npc_hunhuan_disciple.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/npc_hunhuan_disciple.jpg","npc_dragon_slave.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/npc_dragon_slave.png","npc_hunhuan_disciple.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/npc_hunhuan_disciple.png","npc_jilei_nun.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/npc_jilei_nun.jpg","npc_prince_deathknight.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/npc_prince_deathknight.jpg","npc_jilei_nun.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/npc_jilei_nun.png","roushanfo.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/roushanfo.jpg","npc_prince_deathknight.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/npc_prince_deathknight.png","shiyan.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/shiyan.jpg","roushanfo.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/roushanfo.png","shiyan.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/shiyan.png","suling.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/suling.jpg","suling_2.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/suling_2.jpg","suling.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/suling.png","suqinghan.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/suqinghan.jpg","suling_2.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/suling_2.png","suyao.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/suyao.jpg","suqinghan.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/suqinghan.png","wenguanyu.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/wenguanyu.jpg","suyao.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/suyao.png","wenguanyu.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/wenguanyu.png","wenguanyu_2.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/wenguanyu_2.jpg","xuanjizi.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/xuanjizi.jpg","wenguanyu_2.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/wenguanyu_2.png","xuanjizi.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/xuanjizi.png","yanleizi.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/yanleizi.jpg","yehongying.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/yehongying.jpg","yanleizi.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/yanleizi.png","yehongying.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/yehongying.png","yehongying_2.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/yehongying_2.jpg","yehongying_bath_front.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/yehongying_bath_front.jpg","yehongying_2.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/yehongying_2.png","yehongying_bath_side.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/yehongying_bath_side.jpg","yehongying_bath_side.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/yehongying_bath_side.png","yehongying_bath_front.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/yehongying_bath_front.png","yufeirou.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/yufeirou.jpg","yunyichen.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/yunyichen.jpg","yufeirou.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/yufeirou.png","yunzhimeng.jpg":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/yunzhimeng.jpg","yunyichen.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/yunyichen.png","yunzhimeng.png":"https://cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/yunzhimeng.png"};
const GOURD_SVG = '<svg class="xsd2-gourd" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1.6c-1.9 0-3.2 1.3-3.2 2.8 0 .9.5 1.7 1.2 2.2C8 7.5 6.2 9.4 6.2 11.9c0 3.4 2.7 6.1 5.8 6.1s5.8-2.7 5.8-6.1c0-2.5-1.8-4.4-3.8-5.3.7-.5 1.2-1.3 1.2-2.2 0-1.5-1.3-2.8-3.2-2.8z"/></svg>';
const portraitChoices=new Map();
function choosePortrait(candidates,name,s){
  const key=JSON.stringify([s.chatId,s.branchId,s.floor,name,candidates]);
  if(!portraitChoices.has(key)){if(portraitChoices.size>=512)portraitChoices.delete(portraitChoices.keys().next().value);portraitChoices.set(key,candidates[Math.floor(Math.random()*candidates.length)]);}
  return portraitChoices.get(key);
}
function portrait(name, s, data) {
  const stagePortrait = s.stat_data?.character_stages?.[name]?.portrait;
  if (stagePortrait?.small && stagePortrait?.large) return {...stagePortrait,small:stagePortrait.large,fallback:stagePortrait.small};
  const scene=data.portraitScenes?.[s.activeEvent?.promotionId];
  const scenePool=!s.stat_data?.character_stages?.[name]?.negative && scene && scene.pluginId === s.activeEvent?.pluginId ? scene.portraits?.[name] : null;
  let id = scenePool ? choosePortrait(Array.isArray(scenePool)?scenePool:[scenePool],name,s) : PORTRAITS[name] || PORTRAITS[String(name).replace(/[（(][\s\S]*?[）)]/g,"").trim()];
  if (!id) return null;
  const R = data.rules(s.stat_data),
    cfg = Object.values(R.RELIC_PILOT_CONFIG).find(
      (c) => c.owner === name || c.ownerAliases?.includes(name),
    ),
    stage = cfg ? R.getRelicStage(cfg.id, s.stat_data?.known || s.known) : 0;
  const phase = stage >= 3 ? 3 : stage >= 2 ? 2 : 1;
  if (!scenePool && phase > 1 && data.assets.includes(id + "_" + phase + ".jpg"))
    id += "_" + phase;
  const cdn = (ext) => PORTRAIT_CDN[id + ext];
  return {
    small: cdn(".png") || "user/images/xsd_gallery/" + id + ".png",
    fallback: "user/images/xsd_gallery/" + id + ".jpg",
    sources: [cdn(".png"),cdn(".jpg"),"user/images/xsd_gallery/"+id+".png","user/images/xsd_gallery/"+id+".jpg"].filter(Boolean),
    large: cdn(".png") || "user/images/xsd_gallery/" + id + ".png",
  };
}
function loadPortrait(img,p,large=false){
  const urls=[...new Set(p.sources || [large?p.large:p.small,p.fallback,p.small].filter(Boolean))];
  let index=0;img.src=urls[index];
  img.onerror=()=>{if(++index<urls.length)img.src=urls[index];else{img.onerror=null;img.replaceWith(img.ownerDocument.createTextNode(img.alt||"暂无立绘"));}};
}
// 纹章状态推导：成形=known 旗标、阶段=已知最高阶、归属=名器归属/破处者账本
function relicStates(s, data) {
  const R=data.rules(s.stat_data),known=s.stat_data.known||s.known||{};
  return Object.entries(data.relicDb || {}).map(([id,rel])=>{
    const cfg=Object.values(R.RELIC_PILOT_CONFIG).find(c=>c.names.includes(rel.name)||c.names.includes(id));
    const stage=cfg?R.getRelicStage(cfg.id,known):0;
    const owner=relicOwner(s.stat_data,cfg,id,rel.name);
    return {id,rel,cfg,stage,owner,state:stage===0 || !owner?'none':!playerOwner(s,owner)?'other':'self'};
  });
}
function favorLadder(data, character, s) {
  const list = [];
  for (const [, p] of Object.entries(data.promotionDefinitions || {})) {
    if (!(p.participants || [p.character]).includes(character) || !meets(s, (p.conditions || []).filter(c=>c.kind === "identity"))) continue;
    const cond = (p.conditions || []).find((c) => c.kind === "metric" && c.character===character);
    if (cond) list.push({ threshold: Number(cond.value), fromStage: p.fromStage, toStage: p.toStage, label: p.label, entryId:p.entryId, conditions:p.conditions,open:p.open });
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
  const fanfare = mountRelicFanfare(doc, container, data);
  const stagebar = doc.createElement("div");
  stagebar.className = "xsd2-stagebar";
  const mobileRail=doc.createElement("nav");mobileRail.className="xsd2-mobile-relics";mobileRail.setAttribute("aria-label","名器纹章");
  const wingL = doc.createElement("div");
  wingL.className = "xsd2-wing";
  wingL.dataset.xsd2Wing = "left";
  const wingR = doc.createElement("div");
  wingR.className = "xsd2-wing";
  wingR.dataset.xsd2Wing = "right";
  const xjRoot = doc.createElement("dialog");
  xjRoot.className = "xsd2-xj";
  container.append(settlement, stagebar);
  stagebar.append(wingL, root, wingR,mobileRail);
  const closeXj=()=>{if(xjRoot.open)xjRoot.close();xjRoot.replaceChildren();xjRoot.classList.remove("open");xjRoot.remove();};
  xjRoot.addEventListener("cancel",e=>{e.preventDefault();closeXj();});
  let favorDialog=null,corruptionDialog=null,realmDispose=null,eraDispose=null;
  const closeEras=()=>{eraDispose?.();eraDispose=null;};
  const closeRealm=()=>{realmDispose?.();realmDispose=null;};
  const closeCorruption=()=>{corruptionDialog?.remove();corruptionDialog=null;};
  const closeFavor=()=>{favorDialog?.remove();favorDialog=null;};
  const escape = e => { if(e.key === "Escape") { closeFavor();closeCorruption();closeRealm();closeEras(); closeXj(); } };
  doc.addEventListener("keydown",escape);
  let plugins = [],
    dialogs = [],
    disposed = false,
    opening = null;
  // ── 两翼纹章栏：13 名器真实进度仪表 ──
  function renderWings(s) {
    const tiles = relicStates(s, data);
    const make = (r) => {
      const el = doc.createElement("button");
      el.className = "xsd2-tile " + r.state;
      el.dataset.relic = r.id;
      el.title = r.rel.name + " · " + r.rel.carrier;
      const img = doc.createElement("img");
      img.src = data.relicEmblems?.[r.id]?.[String(r.stage || 1)] || "";
      img.alt = r.rel.name;
      el.append(img);
      el.onclick = () => openXj(r.id, s);
      return el;
    };
    const mobile=!!doc.defaultView.matchMedia?.("(max-width:980px)").matches;
    mobileRail.replaceChildren(...(mobile?tiles.map(make):[]));
    wingL.replaceChildren(...(mobile?[]:tiles.slice(0,7).map(make)));
    wingR.replaceChildren(...(mobile?[]:tiles.slice(7).map(make)));
  }
  // ── 名器玄鉴：烙印归属＋四境界＋朱批＋浸润＋同页跳转 ──
  function openXj(id, s) {
    const rel = data.relicDb[id];
    if (!rel) return;
    const rs = relicStates(s, data).find((x) => x.id === id);
    const owned = rs.state !== "none";
    const badge = owned
      ? rs.state === "self"
        ? '<span class="xsd2-badge bself">◈ 目前的烙印归属：' + esc(rs.owner) + "（契约主）</span>"
        : '<span class="xsd2-badge bother">◈ 目前的烙印归属：' + esc(rs.owner) + "（已被占据）</span>"
      : '<span class="xsd2-badge bnone">◈ '+(rs.stage>0?'归属未确认 · 未点亮':'尚未有烙印归属')+'</span>';
    const tabs = Object.entries(data.relicDb)
      .map(([k, r]) => '<button class="xsd2-xtab' + (k === id ? " on" : "") + '" data-xjtab="' + k + '">' + esc(r.name) + "</button>")
      .join("");
    const CN = ["一", "二", "三", "四"];
    const cols = [1, 2, 3, 4]
      .map((k) => {
        const stg = rel.stages[String(k)];
        if (!stg) return "";
        const awake = owned && rs.stage >= k;
        const isNext = owned && rs.stage + 1 === k;
        const sign = awake
          ? '<p class="xsd2-sign">【玄妙体征】</p><p>' + esc(stg.desc) + "</p>"
          : '<p class="xsd2-sign">【天机未启】</p><p>玄妙道机属于混沌阴阳之间，待双修火候与天道机缘突破方可显化。</p>';
        const lockbox = '<div class="xsd2-lockbox"><p>' + esc(stg.lock || "") + "</p></div>";
        let soak = "";
        if (isNext && k >= 2 && rs.cfg) {
          const pr = s.stat_data.relic_progress?.[rs.cfg.id];
          const ledger=pr?.stages?.[k] || ((pr?.target_stage === k || (!pr?.target_stage && k===2))?pr:null);
          const target=ledger?.target || (k===2?rs.cfg.target:3) || 3;
          const count=Math.max(0,Math.min(target,Number(ledger?.count)||0));
          const pct=Math.round(count/target*100);
          const labels={2:'一升二 · 情动',3:'二升三 · 沉沦',4:'三升四 · 极乐'};
          const conditions={2:'生理自发迎合与名器质变',3:'心智质变或专属烙印'};
          soak='<div class="xsd2-soak" data-relic-progress="'+rs.cfg.id+'" data-target-stage="'+k+'"><b>✦ 阶位浸润（'+labels[k]+' · '+count+'/'+target+'）</b><div class="xsd2-sbar"><i style="width:'+pct+'%"></i></div><p>'+ (k===4?'三升四规则待设计。':count>=target?'火候已满，尚待质变机缘。':'浸润积累中，火候尚未圆满。')+'</p><div class="xsd2-lockbox rule"><b>晋升条件</b><p>'+ (k===4?'待设计，自动晋升暂停。':'浸润达标，并出现'+conditions[k]+'。仅累计次数不能越阶。')+'</p></div></div>';
        }
        return '<div class="xsd2-col' + (awake ? " awake" : "") + (isNext ? " next" : "") + '">'
          + '<div class="xsd2-colhead"><span class="xsd2-jie">第' + CN[k - 1] + '境界</span><span class="xsd2-st">' + (awake ? "✦ 已觉醒" : "🔒 锁羽") + "</span></div>"
          + "<h4>" + esc(stg.name) + "</h4>" + sign + lockbox + soak + "</div>";
      })
      .join("");
    const stageImg = rs.stage > 0 ? data.relicEmblems?.[id]?.[String(rs.stage)] : data.relicEmblems?.[id]?.["1"];
    xjRoot.innerHTML =
      '<div class="xsd2-xj-sheet">'
      + '<header><img style="'+(!owned?'filter:grayscale(1);opacity:.35':'')+'" src="' + (stageImg || "") + '" alt=""><div><h3>仙姝堕 · 名器玄鉴</h3><p>载体宿主：' + esc(rel.carrier) + " · " + esc(rel.name) + '</p></div><span class="xsd2-typetag">' + esc(rel.type) + "</span>" + badge + '<button class="x" data-close>✕</button></header>'
      + '<div class="xsd2-xtabs">' + tabs + '</div><div class="xsd2-cols">' + cols + '</div>'
      + '<footer><span>✦ 名器 1-4 阶段已并入玄鉴画卷 · 点击名签即可同页翻阅</span><button class="xsd2-closegold" data-close>✕ 关闭玄鉴</button></footer>'
      + "</div>";
    xjRoot.classList.add("open");
    if(!xjRoot.isConnected)doc.body.append(xjRoot);
    if(!xjRoot.open)xjRoot.showModal();
    const close = closeXj;
    xjRoot.onclick = e => {
      const button=e.target.closest("[data-close],[data-xjtab]");
      if (e.target === xjRoot || button?.hasAttribute("data-close")) close();
      else if (button?.hasAttribute("data-xjtab")) openXj(button.dataset.xjtab,runtime.getSnapshot() || s);
    };
  }
  // ── 心迹面板：好感金条＋菱形节点（专属剧情启动钮）＋事件流水 ──
  function openFavor(character, s) {
    if (isPalaceLord(s.stat_data?.身份 || s.identity)) {
      return openCorruption(character, s);
    }
    closeFavor();
    closeCorruption();
    const value = s.stat_data.character_metrics?.[character]?.好感度 ?? 0;
    const permanentCap=s.stat_data.character_metric_caps?.[character]?.好感度;
    const negative=value<0;
    const negativeLabel=s.stat_data.character_stages?.[character]?.label || "负好感";
    const ladder = favorLadder(data, character, s);
    const completed = s.stat_data.completed_character_stages?.[character];
    const profiles = data.characterProfiles || {};
    const prio = (sid) => profiles[character]?.stages?.find((x) => x.id === sid)?.priority ?? 0;
    const cap = (() => {
      const open = ladder.filter((x) => prio(x.fromStage) <= curPrio(completed) && prio(x.toStage) > curPrio(completed));
      function curPrio(stage) { return prio(stage); }
      return open.length ? Math.min(...open.map((x) => x.threshold)) : null;
    })();
    const activeId=s.activeEvent?.promotionId || s.pluginState?.character_promotion?.currentId;
    const running=s.activeEvent?.pluginId==="character_promotion" ? data.promotionDefinitions?.[activeId] : null;
    const active=running && (running.participants || [running.character]).includes(character) ? running : null;
    const diamonds = ladder.map((x) => {
      const done = prio(x.toStage) <= prio(completed);
      const now = !negative && !done && x.fromStage === (completed || profiles[character]?.initialStage) && !s.pending && !s.activeEvent && !options.readOnly && meets(s,x.conditions) && (!x.open || C.day(s.calendarDate)>=C.day(x.open));
      return { threshold: x.threshold, done, now, label: x.label, entryId:x.entryId, running:active?.entryId===x.entryId,lockedUntil:x.open && C.day(s.calendarDate)<C.day(x.open)?x.open:null };
    });
    const log = s.stat_data.favor_log?.[character] || [];
    const el = modal(doc, character + " · 心迹");
    el.classList.add("xsd2-favor");
    favorDialog=el;
    el.addEventListener("close",()=>{if(favorDialog===el)favorDialog=null;});
    el.querySelector(".xsd2-dialog-body").innerHTML = '<div class="xsd2-fbar"><i style="width:' + Math.max(0,Math.min(100,value)) + '%"></i><span>' + value + " / 100" + (cap !== null && value >= cap ? " · 已满盈" : "") + "</span></div>"
      + (Number.isFinite(permanentCap) ? '<div class="xsd2-cap"><p>永久上限−50：不能恢复到−49及以上。</p></div>' : "")
      + (negative ? '<div class="xsd2-cap"><p>'+esc(negativeLabel)+' · 正向专属剧情暂停；已完成阶段保留。</p></div>' : "")
      + (cap !== null && value >= cap ? '<div class="xsd2-cap"><p>好感已达当前节点上限（' + cap + "）——完成对应专属剧情之前不再累积。</p><p>好感节点需在故事节点外开启，请先完成或离开当前故事。</p></div>" : "")
      + (diamonds.length
          ? '<div class="xsd2-nodes">' + diamonds.map((x) =>
              '<button type="button" data-heart-node="' + esc(x.entryId) + '"' + (x.now && !negative ? '' : ' disabled') + ' class="xsd2-node' + (!negative && x.done ? " done" : x.now ? " now" : "") + '"'
              + (x.now ? ' title="点击开启专属剧情：' + esc(x.label) + '"' : "") + ">"
              + "<i></i><span>" + x.threshold + "</span><em>"
      + (negative ? esc(negativeLabel) : x.done ? "剧情已了" : x.running ? "剧情进行中" : options.readOnly ? "历史记录" : x.lockedUntil ? esc(C.dateText(x.lockedUntil))+"起开放" : x.now ? esc(x.label) + " · 可开启" : "未达") + "</em></button>"
            ).join("") + "</div>"
          : '<p class="xsd2-label">此人尚未配置晋升之路。</p>')
      + (s.activeEvent && s.activeEvent.pluginId!=="character_promotion" ? '<p class="xsd2-label" data-favor-story-block>正在进行故事节点：好感节点需在故事节点外开启，请先完成或离开当前故事。</p>' : '')
      + "<h4>近日心迹</h4>"
      + (log.length
          ? '<ul class="xsd2-flog">' + log.map(x=>'<li class="'+(x.delta>0?'up':x.delta<0?'dn':'')+'"><span>'+esc(x.label || ((data.metricEventDefinitions && Object.values(data.metricEventDefinitions).find(c=>c.character===character)?.anchors||[]).find(a=>a.id===x.via)?.label) || (x.via==='记恨'?'不睦':x.via==='记心上'?'交心':'互动'))+'</span><b>'+(x.delta>=0?'+':'')+x.delta+'</b></li>').join('')+'</ul>'
          : '<p class="xsd2-label">近日暂无心迹波动。</p>')
      ;
    if(options.readOnly){
      const note=doc.createElement("p");note.className="xsd2-label";note.textContent="当前查看历史楼状态；请到最新回复处理当前剧情。";
      if(options.focusLatest){const jump=doc.createElement("button");jump.type="button";jump.textContent="前往最新回复";jump.onclick=()=>{closeFavor();options.focusLatest();};note.append(jump);}
      el.querySelector(".xsd2-dialog-body").prepend(note);
    }
    const actionFeedback=doc.createElement("p");actionFeedback.setAttribute("role","status");el.querySelector(".xsd2-dialog-body").append(actionFeedback);
    const run=createPanelAction(el,runtime,s,error=>{actionFeedback.textContent=error.message;report?.(error);});
    const metricKey="metric."+character+".好感度";
    if(s.manual?.[metricKey]!==undefined){
      const note=doc.createElement("p");note.className="xsd2-cap";note.textContent="好感已被GM手动锁定，自然互动暂不改变数值。";el.querySelector(".xsd2-dialog-body").prepend(note);
      if(!options.readOnly){const release=doc.createElement("button");release.type="button";release.textContent="恢复自然变化";release.dataset.favorRelease="";note.append(release);release.onclick=()=>run(async()=>{await runtime.dispatchIntent({type:"GM_RELEASE",payload:{keys:[metricKey]}});closeFavor();openFavor(character,runtime.getSnapshot());});}
    }
    const check=s.stat_data.lastFavorChecks?.find(x=>x.character===character) || s.stat_data.lastFavorChecks?.find(x=>x.character===null) || s.stat_data.lastFavorCheck;
    if(check && (check.character===character || check.character===null) && check.reason){const note=doc.createElement("p");note.className="xsd2-label";note.textContent="最近一次好感核验（第"+check.turn+"轮）："+check.reason;el.querySelector(".xsd2-dialog-body").append(note);}
    const close = () => {el.remove();if(favorDialog===el)favorDialog=null;};

    if(active && !negative && !options.readOnly){const b=doc.createElement("button");b.type="button";b.dataset.heartNode=active.finishId;b.dataset.promotionNode=active.finishId;const retry=s.pending?.nodeId===active.finishId && !!s.pending.selection?.completionQuery;b.textContent=retry?"重新结算本次剧情":"完成本次剧情";b.disabled=!!s.pending&&!retry;if(retry)b.dataset.completionRetry="";el.querySelector(".xsd2-dialog-body").prepend(b);}
    el.querySelectorAll("[data-heart-node]").forEach(b=>{b.onclick=()=>run(async now=>{
      await runtime.dispatchIntent({type:b.hasAttribute("data-completion-retry")?"RETRY_COMPLETION":"SELECT_NODE",pluginId:"character_promotion",expected:{chatId:now.chatId,branchId:now.branchId,floor:now.floor,revision:now.revision},payload:{nodeId:b.dataset.heartNode}});
      close();
    });});
    el.addEventListener("click", (e) => { if (e.target === el) close(); });
    el.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
    const p = portrait(character, s, data);
    if (p) {
      const im = doc.createElement("img");
      loadPortrait(im,p); im.alt = character;
      im.style.cssText = "width:44px;height:44px;border-radius:6px;object-fit:cover;cursor:zoom-in";
      im.dataset.xsd2Zoom = p.large;
      im.addEventListener("click", () => {
        const zoom=modal(doc,character+" · 立绘");zoom.classList.add("xsd2-portrait-dialog");const image=doc.createElement("img");loadPortrait(image,p,true);image.alt=character;zoom.querySelector(".xsd2-dialog-body").append(image);dialogs.push(()=>zoom.remove());
      });
      el.querySelector(".xsd2-dialog-body").insertBefore(im, el.querySelector(".xsd2-fbar"));
    }


  }
  // ── 恶堕面板：名器阶位＋恶堕五阶图谱＋阶位浸润火候 ──
  function openCorruption(character, s) {
    closeCorruption();
    closeFavor();
    const c = s.stat_data.character_corruption?.[character] || getCharacterCorruption(character, s.stat_data, data.rules?.(s.stat_data));
    if (!c) return;

    const pr = s.stat_data.relic_progress?.[c.relicId];
    let soakInfo = "";
    if (c.stage >= 1 && c.stage < 4 && pr) {
      const nextTargetStage = c.stage + 1;
      const ledger = pr.stages?.[nextTargetStage] || (pr.target_stage === nextTargetStage ? pr : null);
      const target = ledger?.target || (nextTargetStage === 2 ? 3 : 3);
      const count = Math.max(0, Math.min(target, Number(ledger?.count) || 0));
      const pct = Math.round(count / target * 100);
      soakInfo = '<div class="xsd2-cap" style="border-left-color:var(--xsd2-seal-red,#c8372a);background:#241618">' +
        '<p style="color:#e08585">✦ 阶位浸润火候（' + count + ' / ' + target + '）</p>' +
        '<div class="xsd2-sbar" style="margin:4px 0"><i style="width:' + pct + '%;background:linear-gradient(90deg,#9c2b20,#e85d43)"></i></div>' +
        '</div>';
    }

    const stagesHtml = CORRUPTION_STAGES.map(stg => {
      const isCurrent = stg.stage === c.stage;
      const isDone = stg.stage <= c.stage;
      const statusBadge = isCurrent
        ? '<span style="color:var(--xsd2-gold-bright);border:1px solid #756746;padding:1px 6px;border-radius:4px;font-size:11px">✦ 当前阶位</span>'
        : isDone
        ? '<span style="color:#9fbf7a;font-size:11px">已沦陷</span>'
        : '<span style="color:#8b927e;font-size:11px">🔒 待侵蚀</span>';
      return '<div style="margin:8px 0;padding:8px 10px;border-radius:6px;border:1px solid ' + (isCurrent ? 'var(--xsd2-gold)' : isDone ? '#4a5258' : '#333a35') + ';background:' + (isCurrent ? '#232a20' : '#171e1c') + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<strong style="color:' + (isCurrent ? 'var(--xsd2-gold-bright)' : isDone ? '#eee9d9' : '#8b927e') + '">' + esc(stg.title) + '（' + esc(stg.relicStageName) + '）</strong>' +
        statusBadge +
        '</div>' +
        '<p style="margin:4px 0 0;font-size:12px;color:' + (isDone ? '#c5c9bd' : '#757e74') + '">' + esc(stg.desc) + '</p>' +
        '</div>';
    }).join("");

    const el = modal(doc, character + " · 恶堕阶梯");
    el.classList.add("xsd2-favor");
    corruptionDialog = el;
    el.addEventListener("close", () => { if (corruptionDialog === el) corruptionDialog = null; });
    el.querySelector(".xsd2-dialog-body").innerHTML =
      '<div class="xsd2-cap" style="border-left-color:var(--xsd2-gold)">' +
      '<p><b>载体宿主：' + esc(character) + '</b> ｜ <b>专属名器：' + esc(c.relicName) + '</b></p>' +
      '<p style="margin-top:4px">当前阶位：<strong style="color:var(--xsd2-gold-bright)">' + esc(c.title) + '</strong>（名器' + esc(c.relicStageName) + '）</p>' +
      '</div>' +
      soakInfo +
      '<div class="xsd2-cap" style="border-left-color:#8b927e;background:#1a211e">' +
      '<p style="color:#c5c9bd"><b>晋升机缘：</b>' + esc(c.nextRequirement) + '</p>' +
      '</div>' +
      '<h4 style="margin:12px 0 4px;color:var(--xsd2-gold)">恶堕五阶图谱</h4>' +
      '<div class="xsd2-corruption-ladder">' + stagesHtml + '</div>' +
      '<p class="xsd2-label" style="margin-top:10px">恶堕阶梯与名器阶位同步演变；不采用常规好感度，需依凭双修破身、本源浸润与心神驯服步步推进。</p>';

    const p = portrait(character, s, data);
    if (p) {
      const im = doc.createElement("img");
      loadPortrait(im, p);
      im.alt = character;
      im.style.cssText = "width:44px;height:44px;border-radius:6px;object-fit:cover;cursor:zoom-in;float:right;margin-bottom:8px";
      im.addEventListener("click", () => {
        const zoom = modal(doc, character + " · 立绘");
        zoom.classList.add("xsd2-portrait-dialog");
        const image = doc.createElement("img");
        loadPortrait(image, p, true);
        image.alt = character;
        zoom.querySelector(".xsd2-dialog-body").append(image);
        dialogs.push(() => zoom.remove());
      });
      el.querySelector(".xsd2-dialog-body").prepend(im);
    }
    const close = () => { el.remove(); if (corruptionDialog === el) corruptionDialog = null; };
    el.addEventListener("click", (e) => { if (e.target === el) close(); });
    el.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
  }
  function render() {
    if (disposed) return;
    closeFavor();closeCorruption();closeRealm();closeEras();
    const folds = [...root.querySelectorAll("details")].map((x) => x.open);
    for (const p of plugins) p();
    plugins = [];
    const s = runtime.getSnapshot();
    renderSettlement(doc,settlement,s,options.settlementEffects);
    if (!s) {
      stagebar.style.display = "none";
      container.insertBefore(root, stagebar);
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
    stagebar.style.display = "";
    stagebar.insertBefore(root, wingR);
    root.className = "xsd2-hud";
    renderWings(s);
    fanfare.check(s, options);
    const st = s.stat_data,
      field = (k, n) =>
        html`<dt data-xsd-slot="${n}">${k}</dt><dd>${st[k] || "无"}</dd>`,
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
          : '<div class="xsd2-avatar-placeholder" role="img" aria-label="'+esc(name)+'暂无立绘">暂无立绘</div>';
      };
    const isLord = isPalaceLord(st.身份 || s.identity);
    // 关系刻度（赵无忧/自设好感） ｜ 恶堕阶梯（殿主名器恶堕）
    const metricOf = (name) => s.stat_data.character_metrics?.[name]?.好感度;
    let chips = "";
    if (isLord) {
      chips = String(st.关系刻度 || "")
        .split("｜")
        .map((x) => x.trim())
        .filter(Boolean)
        .map((piece) => {
          const name = piece.split(/[、，,；;｜|\s]/)[0].trim();
          const c = st.character_corruption?.[name] || getCharacterCorruption(name, st, data.rules?.(st));
          if (!c) return '<span class="xsd2-chip">' + esc(piece) + "</span>";
          return '<span class="xsd2-chip" data-corruption="' + esc(name) + '">' + esc(name) + " · " + esc(c.label) + "</span>";
        })
        .join("");
      if (!chips && (st.在场角色 || []).length) {
        chips = (st.在场角色 || [])
          .map((npc) => {
            const c = st.character_corruption?.[npc.名] || getCharacterCorruption(npc.名, st, data.rules?.(st));
            if (!c) return "";
            return '<span class="xsd2-chip" data-corruption="' + esc(npc.名) + '">' + esc(npc.名) + " · " + esc(c.label) + "</span>";
          })
          .filter(Boolean)
          .join("");
      }
    } else {
      chips = String(st.关系刻度 || "")
        .split("｜")
        .map((x) => x.trim())
        .filter(Boolean)
        .map((piece) => {
          const name = piece.split("、")[0].trim();
          if (metricOf(name) === undefined) return '<span class="xsd2-chip">' + esc(piece) + "</span>";
          const hasNode = !s.pending && !s.activeEvent && !options.readOnly && favorLadder(data, name, s).some(
            (x) => (s.stat_data.completed_character_stages?.[name] || data.characterProfiles?.[name]?.initialStage) === x.fromStage && meets(s,x.conditions) && (!x.open || C.day(s.calendarDate)>=C.day(x.open)),
          );
          return '<span class="xsd2-chip" data-favor="' + esc(name) + '">' + esc(st.character_stages?.[name]?.negative ? name+' · '+st.character_stages[name].label : piece) + (hasNode ? GOURD_SVG : "") + "</span>";
        })
        .join("");
    }
    const row=(label,value,slot="")=>'<div class="xsd2-row"><b>'+label+'</b><span'+(slot?' data-xsd-slot="'+slot+'"':'')+'>'+value+'</span></div>';
    const items=s.inventory.map(i=>'<button data-item="'+esc(i.id||i.name)+'">'+esc(i.name)+' × '+i.count+' · '+(describeItem(i).consumable?'消耗品':'非消耗品')+'</button>').join('') || '暂无物品';
    root.innerHTML =
      '<header class="xsd2-head"><h1>卷中錄</h1><span class="xsd2-sub">仙姝堕 · 玄门展</span><div class="xsd2-topmap" data-xsd-slot="map" data-slot-number="4"></div><button type="button" data-diagnostics aria-label="下载报错诊断" title="下载报错诊断" style="padding:4px 8px">🐞</button><button data-gm data-xsd-slot="5" aria-label="GM">⚙</button></header>'+
      '<div class="xsd2-who"><div class="xsd2-document"><span class="xsd2-plaque" data-xsd-slot="1">'+esc([st.阵营,st.自设?.name||s.identity].filter(Boolean).join(' · '))+'</span>'+
      row('时 间','仙盟历 '+esc(dateText(s.calendarDate))+' · '+esc(st.历时||'0日'),2)+
      row('地 点',esc(st.地点||'无'),3)+row('修 为','<button data-realm>'+esc(st.修为||'无')+'</button>')+
      row('氛 围','<span class="xsd2-atmo">'+esc(st.环境||'无')+'</span>')+
      row('状 态',esc(st.状态||'无'))+row('目 标',esc(st.目标||'无'))+
      (st.危机&&st.危机!=='无'?'<div class="xsd2-row crisis"><b>危 机</b><span data-xsd-slot="9">'+esc(st.危机)+'</span></div>':'<span data-xsd-slot="9" hidden></span>')+
      row(isLord ? '恶 堕' : '关 系', chips || '暂无记录')+
      '</div><div class="xsd2-portrait" data-player-avatar-slot></div></div>'+
      '<span data-xsd-slot="6" hidden></span>'+
      '<div class="xsd2-npcs" data-xsd-slot="16">'+(st.在场角色||[]).map(n=>'<article class="xsd2-npc">'+avatar(n.名)+'<div><h4>'+esc(n.名)+' <small>'+esc(n.修为||'')+'</small></h4><div>关系：'+esc(n.关系||'未明')+'</div><div>情况：'+esc(n.情况||'无')+'</div><div>心境：'+esc(n.心境||'无')+'</div><div>神态：'+esc(n.神态||'无')+'</div></div></article>').join('')+'</div>'+
      '<details><summary>局势与线索</summary><button data-eras>中立大势 · 剧情时期</button><dl>'+field('局势',7)+field('线索',8)+field('暗处','hidden')+'</dl></details>'+
      '<details data-storage-fold><summary>储物栏</summary><div data-xsd-slot="10">'+items+'</div><p data-xsd-slot="11">'+esc(st.纳戒||'无')+'</p><p data-xsd-slot="12">'+(options.readOnly?'此楼状态记录':'点击物品查看介绍与操作')+'</p></details>'+
      '<details><summary>风闻与气象</summary><dl>'+field('近闻',13)+field('远闻',14)+field('天气',15)+'</dl></details>'+
      '<div data-xsd-slot="17"></div><footer class="xsd2-foot">暗处 · '+esc(st.暗处||'无')+' ｜ 持续背景 · '+esc(st.active_area||'无')+(Object.keys(s.manual).length?' ｜ 存在人工设置':'')+'</footer><p class="xsd2-feedback" role="status" aria-live="polite"></p>';
    if(s.historyRecovery?.kind==='delete'){
      const notice=doc.createElement('aside');notice.dataset.historyRecovery='';notice.className='xsd2-cap';notice.setAttribute('role','status');
      notice.textContent='删楼后已恢复到最近可信进度。受影响的后续旧回复不再自动结算；可继续对话，未完成节点需重新选择。';
      root.querySelector('.xsd2-who').after(notice);
    }
    if(s.lastNodeResult?.outcome==='failure' && s.lastNodeResult.reason==='行动后的用户消息与授权行动不匹配'){
      const notice=doc.createElement('aside');notice.dataset.actionMismatch='';notice.className='xsd2-cap';notice.setAttribute('role','alert');
      notice.textContent='第'+s.lastNodeResult.floor+'楼的节点指令未通过核验，节点已退回执行前；正文写到后续场景不代表节点已完成。请重新选择未完成节点，或导出聊天记录反馈。';
      const details=doc.createElement('button');details.type='button';details.dataset.diagnostics='';details.textContent='下载诊断';details.onclick=()=>downloadDiagnostics(doc,runtime,{actionMismatch:true});notice.append(details);root.querySelector('.xsd2-who').after(notice);
    }
    const activePromotion=s.activeEvent?.pluginId==="character_promotion" ? data.promotionDefinitions?.[s.activeEvent.promotionId || s.pluginState?.character_promotion?.currentId] : null;
    const retryCompletion=activePromotion && s.pending?.nodeId===activePromotion.finishId && !!s.pending.selection?.completionQuery;
    if(activePromotion && (!s.pending || retryCompletion) && !options.readOnly && !s.stat_data.character_stages?.[activePromotion.character]?.negative){
      const notice=doc.createElement("div");const ready=!!s.pluginState?.character_promotion?.ready;notice.className="xsd2-promotion-ready-notice"+(ready?"":" ongoing");notice.setAttribute("role","status");notice.setAttribute("aria-live","polite");
      const label=doc.createElement("span");label.textContent="✦ "+activePromotion.label+(ready?" · 已可完成剧情，也可继续探索":" · 剧情进行中");
      const button=doc.createElement("button");button.type="button";button.dataset.promotionReady="";button.textContent=retryCompletion?"重新结算本次剧情":"完成本次剧情";notice.append(label,button);
      root.querySelector(".xsd2-who").after(notice);
      const run=createPanelAction(root,runtime,s,error=>{const feedback=root.querySelector(".xsd2-feedback");if(feedback)feedback.textContent=error.message;report?.(error);});
      button.onclick=()=>run(async now=>{await runtime.dispatchIntent({type:retryCompletion?"RETRY_COMPLETION":"SELECT_NODE",pluginId:"character_promotion",expected:{chatId:now.chatId,branchId:now.branchId,floor:now.floor,revision:now.revision},payload:{nodeId:activePromotion.finishId}});});
    }
    plugins.push(mountPlayerAvatar(doc,root.querySelector('[data-player-avatar-slot]'),s,options,report));
    root
      .querySelectorAll("details")
      .forEach((x, i) => (x.open = folds[i] || false));
    root.querySelector("[data-eras]").onclick=()=>{closeEras();eraDispose=openEras(doc,runtime,data,report);};
    root.querySelector("[data-realm]").onclick=()=>{closeRealm();realmDispose=openRealm(doc,runtime,data,report,message=>{const feedback=root.querySelector(".xsd2-feedback");if(feedback)feedback.textContent=message;});};
    root.querySelector("[data-diagnostics]").onclick = () => {try{dialogs.push(downloadDiagnostics(doc,runtime,{floor:s.floor,revision:s.revision,readOnly:!!options.readOnly}));}catch(error){report?.(error);}};
    root.querySelector("[data-gm]").onclick = () =>
      dialogs.push(openGM(doc, runtime, data, report));
    root
      .querySelectorAll("[data-item]")
      .forEach(
        (b) =>
          (b.onclick = () =>
            dialogs.push(openItem(doc, runtime, b.dataset.item, report))),
      );
    root.querySelectorAll("[data-portrait]").forEach(
      (b) =>
        (b.onclick = () => {
          const p = portrait(b.dataset.portrait, s, data),
            el = modal(doc, b.dataset.portrait);
          el.classList.add("xsd2-portrait-dialog");
          dialogs.push(() => el.remove());
          const img = doc.createElement("img");
          loadPortrait(img,p,true);
          img.alt = b.dataset.portrait;
          el.querySelector(".xsd2-dialog-body").append(img);
        }),
    );
    root.querySelectorAll("[data-favor]").forEach(
      (c) =>
        (c.onclick = () => openFavor(c.dataset.favor, s)),
    );
    root.querySelectorAll("[data-corruption]").forEach(
      (c) =>
        (c.onclick = () => openCorruption(c.dataset.corruption, s)),
    );
    root.querySelectorAll("img").forEach(img=>{
      const name=img.closest('[data-portrait]')?.dataset.portrait;
      const p=name?portrait(name,s,data):null;
      if(p)loadPortrait(img,p);
    });
    for (const plugin of runtime.uiPlugins || [])
      if (plugin.mount && plugin.id !== "character_promotion") {
        const unmount = plugin.mount(
          root.querySelector("[data-xsd-slot=map]"),
          runtime,
        );
        if (typeof unmount === "function") plugins.push(unmount);
      }
    if (options.readOnly) {
      root.dataset.xsd2Readonly = "";
      root.querySelectorAll("button:not([data-diagnostics])").forEach(b => { b.disabled = true; b.onclick = null; });
      stagebar.querySelectorAll("button:not([data-diagnostics])").forEach(b => { b.disabled = true; b.onclick = null; });
    }
  }
  const unsubscribe = runtime.subscribe(render);
  render();
  const resize=()=>{const s=runtime.getSnapshot();if(s && !disposed){renderWings(s);if(options.readOnly)stagebar.querySelectorAll("[data-relic]").forEach(b=>{b.disabled=true;b.onclick=null;});}};
  doc.defaultView.addEventListener("resize",resize);
  return {
    render,
    destroy() {
      disposed = true;
      closeFavor();
      closeCorruption();
      fanfare.destroy();closeRealm();closeEras();
      unsubscribe();
      opening?.destroy();
      plugins.forEach((f) => f());
      dialogs.forEach((f) => f?.());
      root.remove();
      settlement.remove();
      stagebar.remove();
      doc.removeEventListener("keydown",escape);
      doc.defaultView.removeEventListener("resize",resize);
      xjRoot.remove();
      style.remove();
    },
  };
}
module.exports = { mountHUD, portrait, CSS, PALETTE, PORTRAITS, PORTRAIT_CDN };
