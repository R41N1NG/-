// C5 清账审计：把两个弹窗（创角 / 判定台）在无头浏览器里渲染出来，
// 通过 CDP 直接读每个元素的 getComputedStyle，前后两版逐元素逐属性对比。
// 用途：覆盖层折回基础规则时，证明「算出来的样式没变」。
//
// 用法：node work/c5/audit.mjs before:work/c5/before.html after:状态栏.html
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "..", "..");
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const UD = join(here, "ud-cdp");
const PORT = 9411;

const PROPS = [
  "color", "background-color", "background-image", "opacity",
  "border-top-width", "border-top-style", "border-top-color",
  "border-right-width", "border-right-style", "border-right-color",
  "border-bottom-width", "border-bottom-style", "border-bottom-color",
  "border-left-width", "border-left-style", "border-left-color",
  "border-top-left-radius", "border-top-right-radius", "border-bottom-left-radius", "border-bottom-right-radius",
  "box-shadow", "text-shadow", "font-family", "font-size", "font-weight", "letter-spacing", "line-height",
  "padding-top", "padding-right", "padding-bottom", "padding-left",
  "margin-top", "display", "gap", "justify-content", "align-items", "width", "height",
  "stroke", "fill", "transform", "white-space", "overflow-y", "position"
];

const CASES = [
  { id: "create", w: 980, h: 1100 },
  { id: "settle", w: 980, h: 1000 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function probe(mode) {
  const s = "<" + "script>";
  const e = "<" + "/script>";
  return `
${s}
(() => {
  const MODE = ${JSON.stringify(mode)};
  const click = (sel) => { const el = document.querySelector(sel); if (el) el.click(); };
  const open = (id) => { const d = document.getElementById(id); if (d && !d.open) { try { d.showModal(); } catch (err) { d.setAttribute("open", ""); } } };
  function shape() {
    try {
      // 无头渲染下动画/过渡会把颜色与位移停在中间帧（handoff 红线第 2 条），采样前一律停掉
      if (!document.getElementById("wx-audit-freeze")) {
        const st = document.createElement("style");
        st.id = "wx-audit-freeze";
        st.textContent = "* { animation: none !important; transition: none !important; }";
        document.head.appendChild(st);
      }
      if (MODE === "create") {
        const zc = document.getElementById("zeroChip"); if (zc) { zc.hidden = true; zc.style.display = "none"; }
        open("wx-create-dialog");
        click("#zeroStepTab2");
        const cards = document.querySelectorAll("#wx-create-dialog .target-card");
        if (cards[0]) cards[0].classList.add("sel");
        const ids = document.querySelectorAll("#wx-create-dialog .id-card");
        if (ids[0]) ids[0].classList.add("sel");
      } else {
        try { window.WxStatusbar.settle({ floor: 3, actions: [{ name: "跟缀", label: "跟缀｜身后", d20: 14, dc: 12, band: "success", attr: { name: "敏捷", v: 4 }, mods: [{ name: "雨幕", v: 1 }, { name: "情报优势", v: 2 }, { name: "她的暗账", v: -1, ripple: true }] }], account: { stamina: -3, heart: 2 }, seg: {} }); } catch (err) {}
        // 结算面板的内容由 mock 随机生成，这里换成固定语料，保证前后两版元素结构完全一致
        const mods = document.getElementById("settleModsStack");
        if (mods) mods.innerHTML = '<div class="chip-item ripple-mod"><span>雨幕</span><b>+1</b></div>'
          + '<div class="chip-item hidden-mod"><span>她的暗账</span><b>−1</b></div>';
        const ledger = document.getElementById("settleLedgerWrap");
        if (ledger) ledger.innerHTML = '<div class="ledger-row gain show"><span>体力</span><span class="val">−3</span></div>'
          + '<div class="ledger-row warn show"><span>心跳</span><span class="val">+2</span></div>';
        const hist = document.getElementById("settleQueueHistory");
        if (hist) { hist.style.display = ""; hist.innerHTML = '<div class="history-item"><span>第 2 楼 · 跟缀</span><b>达成</b></div>'; }
        const dark = document.getElementById("settleDarkRevealCard");
        if (dark) { dark.innerHTML = "<b>暗账揭示</b> 她其实早就注意到你了。"; dark.classList.add("show"); }
        const vb = document.getElementById("settleVerdictBadge");
        if (vb) { vb.textContent = "达成"; vb.classList.add("show", "crit"); }
        const ml = document.getElementById("settleMathLine");
        if (ml) ml.innerHTML = "d20 <b>14</b> + 敏捷 <b>4</b> + 雨幕 <b>1</b> ≥ DC <b>12</b>";
        open("wx-settle-dialog");
        const consoleEl = document.getElementById("settleConsole");
        if (consoleEl) consoleEl.classList.add("settled", "crit");
      }
    } catch (err) { /* 结构性缺失不中断采样 */ }
  }
  function collect() {
    const els = [];
    for (const r of [document.getElementById("wx-create-dialog"), document.getElementById("wx-settle-dialog")]) {
      if (!r) continue;
      els.push(r);
      r.querySelectorAll("*").forEach((el) => els.push(el));
    }
    const seen = new Map();
    return els.map((el) => {
      const cs = getComputedStyle(el);
      const base = el.tagName.toLowerCase() + "|" + (el.id || "") + "|" + String(el.className || "").trim();
      const n = (seen.get(base) || 0) + 1;
      seen.set(base, n);
      const o = { key: base + "#" + n };
      for (const p of ${JSON.stringify(PROPS)}) o[p] = cs.getPropertyValue(p);
      return o;
    });
  }
  function dump() {
    const pre = document.createElement("pre");
    pre.id = "wx-audit";
    try {
      pre.textContent = JSON.stringify(collect());
    } catch (err) {
      pre.textContent = "ERR:" + (err && (err.stack || err.message || err));
    }
    document.body.appendChild(pre);
    document.title = "AUDIT " + MODE;
  }
  setTimeout(shape, 1200);
  // 采样前再摆一次：结算面板的 chip/账目由 mock 异步追加，最后统一换成固定语料
  setTimeout(() => { shape(); dump(); }, 3000);
})();
${e}`;
}

function url(file) {
  return "file:///" + resolve(ROOT, file).replace(/\\/g, "/").replace(/ /g, "%20").replace(/#/g, "%23");
}

class Cdp {
  constructor(wsUrl) { this.ws = new WebSocket(wsUrl); this.id = 0; this.waiters = new Map(); }
  open() {
    return new Promise((res, rej) => {
      this.ws.addEventListener("open", () => res());
      this.ws.addEventListener("error", (e) => rej(new Error("ws error")));
      this.ws.addEventListener("message", (ev) => {
        const m = JSON.parse(ev.data);
        if (m.id && this.waiters.has(m.id)) { this.waiters.get(m.id)(m); this.waiters.delete(m.id); }
      });
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res) => this.waiters.set(id, res));
  }
  async eval(expr) {
    const r = await this.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result && r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.text);
    return r.result && r.result.result ? r.result.result.value : undefined;
  }
}

async function waitPort() {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      if (r.ok) return (await r.json());
    } catch (e) { /* 还没起来 */ }
    await sleep(150);
  }
  throw new Error("CDP 端口未就绪");
}

async function main() {
  const pairs = process.argv.slice(2).map((s) => {
    const i = s.indexOf(":");
    return { tag: s.slice(0, i), file: s.slice(i + 1) };
  });
  if (pairs.length !== 2) { console.log("用法: node work/c5/audit.mjs before:<file> after:<file>"); process.exit(2); }
  mkdirSync(here, { recursive: true });

  const results = {};
  for (const c of CASES) {
    const html = probe(c.id);
    for (const p of pairs) {
      const src = readFileSync(resolve(ROOT, p.file), "utf8");
      const fixture = join(here, `audit_${p.tag}_${c.id}.html`);
      writeFileSync(fixture, src.replace("</html>", html + "\n</html>"), "utf8");
    }
  }

  const proc = spawn(CHROME, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad", "--hide-scrollbars",
    "--allow-file-access-from-files", `--user-data-dir=${UD}`, `--remote-debugging-port=${PORT}`,
    "--window-size=980,1100", "about:blank",
  ], { stdio: "ignore" });

  try {
    const targets = await waitPort();
    const page = targets.find((t) => t.type === "page");
    if (!page) throw new Error("没有 page target");
    const cdp = new Cdp(page.webSocketDebuggerUrl);
    await cdp.open();
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 980, height: 1100, deviceScaleFactor: 1, mobile: false });

    for (const c of CASES) {
      for (const p of pairs) {
        const file = join(here, `audit_${p.tag}_${c.id}.html`);
        await cdp.send("Page.navigate", { url: "file:///" + file.replace(/\\/g, "/").replace(/ /g, "%20") });
        let rows = null;
        for (let i = 0; i < 80; i++) {
          await sleep(150);
          const txt = await cdp.eval(`(() => { const n = document.getElementById("wx-audit"); return n ? n.textContent : ""; })()`);
          if (txt) { rows = JSON.parse(txt); break; }
        }
        if (!rows) throw new Error(`${p.tag}/${c.id}: 采样节点缺失（页面脚本没跑完）`);
        writeFileSync(join(here, `${p.tag}_${c.id}.json`), JSON.stringify(rows), "utf8");
        if (!results[`${p.tag}_${c.id}`]) results[`${p.tag}_${c.id}`] = rows;
        const shot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
        if (shot.result && shot.result.data) writeFileSync(join(here, `${p.tag}_${c.id}.png`), Buffer.from(shot.result.data, "base64"));
      }
      const a = results[`${pairs[0].tag}_${c.id}`];
      const b = results[`${pairs[1].tag}_${c.id}`];
      const d = diff(a, b);
      writeFileSync(join(here, `diff_${c.id}.json`), JSON.stringify(d, null, 1), "utf8");
      console.log(`\n== ${c.id} == before ${a.length} 元素 / after ${b.length} 元素 / 差异 ${d.length} 项`);
      const bySel = new Map();
      for (const x of d) {
        const k = x.key + " :: " + x.prop;
        bySel.set(k, x);
      }
      for (const [k, x] of bySel) console.log(`  ${k}: ${x.before ?? ""} -> ${x.after ?? ""}`);
      globalThis.__total = (globalThis.__total || 0) + d.length;
    }
    console.log(`\n总差异 ${globalThis.__total || 0} 项`);
  } finally {
    proc.kill();
  }
}

function diff(a, b) {
  const mapB = new Map(b.map((r) => [r.key, r]));
  const out = [];
  for (const ra of a) {
    const rb = mapB.get(ra.key);
    if (!rb) { out.push({ key: ra.key, prop: "(after 缺此元素)" }); continue; }
    mapB.delete(ra.key);
    for (const p of PROPS) {
      if (ra[p] !== rb[p]) out.push({ key: ra.key, prop: p, before: ra[p], after: rb[p] });
    }
  }
  for (const k of mapB.keys()) out.push({ key: k, prop: "(before 缺此元素)" });
  return out;
}

await main();
