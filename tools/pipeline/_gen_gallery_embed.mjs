/* 生成内嵌立绘表：把 xsd_gallery 里的原图缩成 192×256 WebP，拿 data URI 写成 _gallery_embed.json
 * 用法：node _gen_gallery_embed.mjs            （起本地服务，等浏览器回传后写盘、退出）
 *      端口默认 8791，可用 --port=xxxx 改
 * 依赖：零 npm 包（用 headless Chrome 的 canvas.toDataURL('image/webp') 编码）
 */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const D = 'E:\\角色卡制作\\仙姝堕\\';
const GAL = 'E:\\tavern\\SillyTavern\\data\\default-user\\user\\images\\xsd_gallery';
const OUT = D + '_gallery_embed.json';
const W = 192, H = 256, Q = 0.85;
const portArg = process.argv.find((a) => a.startsWith('--port='));
const PORT = portArg ? Number(portArg.split('=')[1]) : 8791;

/* ★ 2026-10-01 主人令：「只有『立绘-原图』这个文件夹里的图片才被加入卡内」
 *   ⇒ 读 `_gallery_ids.json`（由 `_sync_gallery_from_src.mjs --apply` 产出）当**白名单**；
 *      清单不存在时退回原来的"扫图库"行为（向后兼容，老流程照跑）。 */
let ids;
try {
  ids = JSON.parse(readFileSync(D + '_gallery_ids.json', 'utf8'));
  if (!Array.isArray(ids) || !ids.length) throw new Error('清单为空');
  console.log('白名单：_gallery_ids.json（' + ids.length + ' 个 id，来自「立绘-原图」）');
} catch (e) {
  const files = readdirSync(GAL).filter((f) => /\.(png|jpg|jpeg)$/i.test(f) && !/_thumb/i.test(f));
  ids = [...new Set(files.map((f) => f.replace(/\.(png|jpg|jpeg)$/i, '')))];
  console.log('⚠️ 没读到 _gallery_ids.json ⇒ 退回扫图库（' + ids.length + ' 个 id）');
}
console.log('待编码 ' + ids.length + ' 张：' + ids.join('、'));

const PAGE = `<!DOCTYPE html><meta charset="utf-8"><title>enc</title><body style="background:#111;color:#e6c96b;font:15px monospace">
<div id="o">编码中…</div>
<script>
const IDS = ${JSON.stringify(ids)};
const W = ${W}, H = ${H}, Q = ${Q};
const out = {}; const log = [];
(async () => {
  for (const id of IDS) {
    let ok = false;
    for (const ext of ['png','jpg','jpeg']) {
      try {
        const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = '/img/' + id + '.' + ext; });
        const c = document.createElement('canvas'); c.width = W; c.height = H;
        const g = c.getContext('2d'); g.drawImage(img, 0, 0, W, H);
        const u = c.toDataURL('image/webp', Q);
        out[id] = u;
        log.push(id + '.' + ext + ' → ' + img.naturalWidth + 'x' + img.naturalHeight + ' → ' + W + 'x' + H + ' webp ' + Math.round(u.length * 3 / 4 / 1024 * 10) / 10 + ' KB');
        ok = true; break;
      } catch (e) { /* 换下一个扩展名 */ }
    }
    if (!ok) log.push(id + ' ✘ 找不到源图');
  }
  document.getElementById('o').innerHTML = log.join('<br>');
  const r = await fetch('/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(out) });
  document.getElementById('o').innerHTML += '<br><br>回传：' + r.status;
})();
</script>`;

const srv = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      try {
        const map = JSON.parse(body);
        const total = Object.values(map).reduce((a, s) => a + s.length, 0);
        writeFileSync(OUT, JSON.stringify(map), 'utf8');
        console.log('\n✅ 已写 ' + OUT);
        console.log('   条目 ' + Object.keys(map).length + ' 个｜data URI 字符串合计 ' + Math.round(total / 1024) + ' KB（写进卡 JSON 就是这个量）');
        for (const k of Object.keys(map)) console.log('   · ' + k.padEnd(24) + Math.round(map[k].length / 1024 * 10) / 10 + ' KB');
        res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end('ok');
        setTimeout(() => process.exit(0), 200);
      } catch (e) {
        console.error('回传解析失败：' + e.message);
        res.writeHead(500); res.end('bad');
      }
    });
    return;
  }
  if (req.url.startsWith('/img/')) {
    const name = decodeURIComponent(req.url.slice(5));
    if (name.includes('..') || name.includes('/') || name.includes('\\')) { res.writeHead(400); res.end(); return; }
    try {
      const buf = readFileSync(join(GAL, name));
      res.writeHead(200, { 'Content-Type': /\.png$/i.test(name) ? 'image/png' : 'image/jpeg' });
      res.end(buf);
    } catch (e) { res.writeHead(404); res.end(); }
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(PAGE);
});

srv.listen(PORT, '127.0.0.1', () => {
  console.log('READY http://127.0.0.1:' + PORT + '/');
  console.log('（用 headless Chrome 打开这个地址；它编码完会自己回传，然后我这边写盘退出）');
});
setTimeout(() => { console.error('✘ 超时（90 秒）——浏览器没回传'); process.exit(3); }, 90000);
