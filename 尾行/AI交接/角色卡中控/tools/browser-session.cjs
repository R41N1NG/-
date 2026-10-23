"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  { spawn } = require("node:child_process");
async function browserSession() {
  const bin = [
    process.env.WX_BROWSER,
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  ].find((p) => p && fs.existsSync(p));
  if (!bin) throw Error("需要 Chromium；可设置 WX_BROWSER");
  const work = path.resolve(__dirname, "../work/training-shots");
  fs.mkdirSync(work, { recursive: true });
  const profile = fs.mkdtempSync(path.join(work, "profile-"));
  const child = spawn(
    bin,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--remote-debugging-port=0",
      "--user-data-dir=" + profile,
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  try {
    const portFile = path.join(profile, "DevToolsActivePort");
    for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await delay(100);
    const port = fs.readFileSync(portFile, "utf8").split("\n")[0];
    const tab = await (
      await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
        method: "PUT",
      })
    ).json();
    const socket = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      socket.onopen = res;
      socket.onerror = rej;
    });
    let seq = 0;
    const pending = new Map();
    socket.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (pending.has(m.id)) {
        const { res, rej } = pending.get(m.id);
        pending.delete(m.id);
        m.error ? rej(Error(m.error.message)) : res(m.result);
      }
    };
    const send = (method, params = {}) =>
      new Promise((res, rej) => {
        const id = ++seq;
        pending.set(id, { res, rej });
        socket.send(JSON.stringify({ id, method, params }));
      });
    const evaluate = async (expression) => {
      const r = await send("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      if (r.exceptionDetails)
        throw Error(
          r.exceptionDetails.exception?.description || r.exceptionDetails.text,
        );
      return r.result.value;
    };
    await send("Page.enable");
    const { frameTree } = await send("Page.getFrameTree");
    return {
      send,
      evaluate,
      delay,
      frameId: frameTree.frame.id,
      close() {
        socket.close();
        child.kill("SIGKILL");
        try {
          fs.rmSync(profile, { recursive: true, force: true });
        } catch {}
      },
    };
  } catch (e) {
    child.kill("SIGKILL");
    throw e;
  }
}
module.exports = { browserSession };
