"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const { createChatSync } = require("../../src/host/chat-sync/controller.js");
const { createGame } = require("../../src/runtime/game.js");
const clone = (value) => JSON.parse(JSON.stringify(value));
function host() {
  const stores = { A: {}, B: {} },
    histories = {
      A: [{ id: 0, role: "assistant", text: "opening" }],
      B: [{ id: 0, role: "assistant", text: "opening" }],
    };
  let active = "A",
    gate = null,
    writeGate = null,
    writeFail = false,
    failAfterWrite = false;
  const state = { game: null, conf: { autoSettle: false } };
  const sync = createChatSync({
    state,
    vars: {
      read: async () => {
        const copy = clone(stores[active]);
        if (gate) {
          const wait = gate;
          gate = null;
          await wait;
        }
        return copy;
      },
      assign: async (patch) => {
        if (writeFail) throw Error("disk unavailable");
        if (writeGate) {
          const wait = writeGate;
          writeGate = null;
          await wait;
        }
        Object.assign(stores[active], clone(patch));
        if (failAfterWrite) throw Error("acknowledgement lost");
      },
    },
    readContext: async () => ({
      scope: active,
      history: clone(histories[active]),
    }),
    createGame,
    defaultInit: () => ({ sessionSalt: "timeline-test", stats: { heart: 50 } }),
    syncTargetWorldbook: async () => ({ ok: true }),
    applyTargetOpening: async () => ({ ok: true }),
  });
  return {
    sync,
    state,
    stores,
    histories,
    setActive: (v) => {
      active = v;
    },
    user(text = "input") {
      const m = { id: histories[active].length, role: "user", text };
      histories[active].push(m);
      return m.id;
    },
    reply(text = "reply") {
      histories[active].push({
        id: histories[active].length,
        role: "assistant",
        text,
      });
    },
    defer() {
      let release;
      gate = new Promise((r) => {
        release = r;
      });
      return release;
    },
    deferWrite() {
      let release;
      writeGate = new Promise((r) => {
        release = r;
      });
      return release;
    },
    failAfterWrite: (v) => {
      failAfterWrite = v;
    },
    failWrites: (v) => {
      writeFail = v;
    },
  };
}
const action = [{ id: "follow", name: "跟缀", args: { dist: "same" } }];
async function send(h, text) {
  const messageId = h.user(text);
  return h.sync.runInput({ messageId, text, actions: action });
}

module.exports = { host, send };
