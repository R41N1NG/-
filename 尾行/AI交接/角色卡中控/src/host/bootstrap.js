// src/host/bootstrap.js - 浏览器入口：引擎挂 window.WxEngine；酒馆助手环境自动启动胶水闭环
// 真机闭环：generation_ended 事件 → 抓 LLM 申报 → processFloor → 快照/存档写酒馆变量（wx_snap/wx_save）。
const { createGame } = require("../runtime/game.js");
const facts = require("../runtime/facts.js");
const map = require("../runtime/map.js");
const { loadLexicon } = require("../runtime/lexicon.js");
const { startGlue } = require("./glue.js");
const LP = require("../config/lifepack.json");

const gluePromise = startGlue();   // 非酒馆环境/非尾行卡返回 {ok:false}；成功时挂 window.WxGlue
const api = { createGame, facts, map, loadLexicon, lifepack: LP, glue: gluePromise, version: "0.7" };

if (typeof window !== "undefined") window.WxEngine = api;
if (typeof globalThis !== "undefined") globalThis.WxEngine = api;
if (typeof module !== "undefined") module.exports = api;
