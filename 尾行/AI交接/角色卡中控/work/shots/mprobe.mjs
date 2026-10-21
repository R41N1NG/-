// 鐪熷閲忓彇锛氭妸鐘舵€佹爮濉炶繘鎸囧畾瀹藉害鐨?iframe锛屽唴椤垫妸鑷繁閲忓埌鐨勭洅妯″瀷 postMessage 缁欏灞傦紝澶栧眰钀借繘 <pre> 渚?--dump-dom 璇诲彇銆?import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "..", "鐘舵€佹爮.html"), "utf8");
const CHROME = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const innerJs = `
<style>dialog.wx-dialog:not([open]){display:none!important;}html,body{margin:0;height:100%}body{display:flex;flex-direction:column;justify-content:flex-end}main.wx-standalone-main{min-height:0}</style>
<script>
const hideZero = () => { const c = document.getElementById('wx-create-dialog'); if (c) { try { c.close(); } catch (e) {} }
  const z = document.getElementById('zeroChip'); if (z) { z.hidden = true; z.style.display = 'none'; } };
setInterval(hideZero, 100);
setTimeout(() => { const t = document.getElementById('wx-terminal-toggle-btn'); if (t) t.click(); }, 1200);
setTimeout(() => {
  const items = [
    ['body', 'body'], ['main', 'main.wx-standalone-main'], ['.trpg', '.trpg'],
    ['甯搁┗鏉?, '#trpgSlimBar'], ['宸︾皣', '.slim-left'], ['澶у尯', '#routeDistrict'], ['鍦烘墍', '.slim-place'],
    ['绾㈢嚎', '#routeStrikeTag'], ['涓皣', '.slim-center'], ['闃舵', '#phase'], ['璺濈', '#distName'],
    ['浣撳姏', '#staminaBox'], ['蹇冭烦', '#heartPillBtn'], ['缁堢', '.terminal-toggle-btn'],
    ['鑳跺泭鏉?, '.wx-capsule-bar'], ['鏇村', '#wxMoreActionsBtn'],
  ];
  const out = [];
  out.push('VIEWPORT ' + innerWidth + 'x' + innerHeight);
  for (const [name, sel] of items) {
    const el = document.querySelector(sel);
    if (!el) { out.push(name + ' :: MISSING'); continue; }
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    out.push(name + ' :: x=' + r.x.toFixed(0) + ' w=' + r.width.toFixed(0) + ' right=' + r.right.toFixed(0) + ' display=' + cs.display);
  }
  const bar = document.querySelector('#trpgSlimBar');
  out.push('甯搁┗鏉℃孩鍑?:: client=' + bar.clientWidth + ' scroll=' + bar.scrollWidth);
  // 缁堢搴曡处鏄惁琚拤鍦ㄥ脊绐楀簳杈?  const body = document.querySelector('.wx-modal-body');
  const led = document.getElementById('ledger');
  if (body && led) {
    const rb = body.getBoundingClientRect(), rl = led.getBoundingClientRect();
    const cs = getComputedStyle(led);
    out.push('缁堢搴曡处 :: position=' + cs.position + ' bottom=' + cs.bottom + ' z=' + cs.zIndex
      + ' | body y=' + rb.y.toFixed(0) + '..' + rb.bottom.toFixed(0)
      + ' | ledger y=' + rl.y.toFixed(0) + '..' + rl.bottom.toFixed(0)
      + ' | bodyScroll ' + body.scrollTop + '/' + (body.scrollHeight - body.clientHeight));
  }
  // 鍏虫帀 tooltip 浼厓绱犲啀鐪嬩竴娆★紝纭 16px 鏄皝鎾戠殑
  const st = document.createElement('style');
  st.textContent = '.trpg [data-tip]::after{content:none!important}';
  document.head.appendChild(st);
  out.push('鍏虫帀 data-tip 浼厓绱犲悗 :: scroll=' + bar.scrollWidth);
  // 鎵惧嚭璋佸湪鎾?scrollWidth锛堥殣褰?tooltip 鐨勭粷瀵瑰畾浣嶄吉鍏冪礌涔熶細璁″叆锛?  for (const el of bar.querySelectorAll('*')) {
    if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
      const r = el.getBoundingClientRect();
      out.push('  鎾戝锛?' + el.tagName.toLowerCase() + ' class="' + (el.className || '') + '" id="' + (el.id || '') + '"> client=' + el.clientWidth + ' scroll=' + el.scrollWidth + ' w=' + r.width.toFixed(0));
    }
  }
  parent.postMessage(out.join('\\n'), '*');
}, 1600);
</script>`;

const wrapper = (w, h, inner) => `<!doctype html><html><body style="margin:0;background:#222;height:${h}px">
<iframe id="f" src="${inner}" style="width:${w}px;height:${h}px;border:0"></iframe>
<pre id="out" style="position:fixed;left:0;top:0;background:#000;color:#0f0;font:12px monospace;padding:6px;z-index:9"></pre>
<script>window.addEventListener('message', e => { document.getElementById('out').textContent += e.data + '\\n'; });</script>
</body></html>`;

const widths = [561, 580, 600, 610];
const results = [];
for (const w of widths) {
  const inner = join(here, `p_inner_${w}.html`);
  writeFileSync(inner, src.replace("</html>", innerJs + "\n</html>"), "utf8");
  const wrap = join(here, `p_wrap_${w}.html`);
  writeFileSync(wrap, wrapper(w, 700, `p_inner_${w}.html`), "utf8");
  const url = "file:///" + wrap.replace(/\\/g, "/").replace(/ /g, "%20");
  const dom = execFileSync(CHROME, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-breakpad",
    "--allow-file-access-from-files", `--user-data-dir=${join(here, "ud")}`,
    "--virtual-time-budget=6000", "--window-size=1000,760", "--dump-dom", url,
  ], { encoding: "utf8", timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
  const m = dom.match(/<pre id="out"[^>]*>([\s\S]*?)<\/pre>/);
  results.push('=== ' + w + ' ===\n' + (m ? m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim() : 'NO OUTPUT'));
}
console.log(results.join('\n\n'));


