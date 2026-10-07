#!/usr/bin/env node
/**
 * _push_card.mjs —— 一条命令推卡（2026-09-29 重写，配合"废弃独立世界书 + 心智条进册"）
 *
 *   ① **先看酒馆关没关** —— 酒馆开着时会把内存里的旧卡写回去（铁律 7b），开着就拒绝推
 *   ② 复制卡 PNG 进 characters\（备份并删掉同名旧卡，含 `…1.png` 变体）
 *   ③ **重建世界书文件**（`worlds\<卡名>.json`）—— 2026-09-29 深夜改：卡现在**绑着**它（`extensions.world`），
 *      酒馆据此把它当"卡自带的主世界书"加载；推卡前重建一次，保证它与卡内世界书**逐条一致**（不会再变旧）。
 *      ⚠️ 别删它：删了酒馆就找不到那本书，按身份拨【身份】条目开关也就无从下手（这正是 2026-09-29 之前的病根）。
 *   ④ **读内容核对**：SHA256 ＋ 条数／【身份】order／心智条条数
 *
 * ⚠️ 不带 `--apply` 只预演。
 * 用法：node _push_card.mjs [--apply]
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const APPLY = process.argv.includes('--apply');
const say = console.log;
const BOOK = 'E:/角色卡制作/仙姝堕';
const TAV = 'E:/tavern/SillyTavern/data/default-user';
const SRC = path.join(BOOK, '仙姝墮-角色卡（全书群像）.png');
const CARD_NAME = '仙姝墮 · 一张跑全书.png';
const DST = path.join(TAV, 'characters', CARD_NAME);
const WBP = path.join(TAV, 'worlds', '仙姝墮 · 一张跑全书.json');
const MATCH = /^仙姝墮\s*·\s*一张跑全书.*\.png$/;

/* ① 酒馆开着没有
 *   ⚠️ 2026-09-29 修：旧写法把 PowerShell 命令塞进 `-Command "…$_…"`，嵌套引号一被吃就报错，
 *   而 catch 又把"命令失败"当成"酒馆开着" ⇒ 误报（主人：后台黑框早关了）。
 *   现在改成：让 PowerShell 直接吐 JSON 进程表，**在 Node 里判断**；查不到就**当没开**并明说。 */
let tavernUp = false, why = '';
try {
  const out = execFileSync('powershell', ['-NoProfile', '-Command',
    'Get-CimInstance Win32_Process | Select-Object ProcessId,Name,CommandLine | ConvertTo-Json -Compress'],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  const list = JSON.parse(out.trim() || '[]');
  const arr = Array.isArray(list) ? list : [list];
  /* ⚠️ 2026-09-29 二次修：过滤词太宽会**假命中我自己的命令**（我的检测命令串里就带着
   *   `SillyTavern`／`server.js`／`tavern` 这三个词 ⇒ 自己把自己当成酒馆）。
   *   现在只认这两种真酒馆形态，并排除 dsh 自己的 runner／本脚本： */
  const isTavern = (cmd) => {
    const c = String(cmd ?? '');
    if (/dsh-subprocess|_npx|dsh-guise|Get-CimInstance/.test(c)) return false;   // 我自己的工具链
    if (/SillyTavern\\Start\.bat|SillyTavern[\/\\]Start\.bat/i.test(c)) return true;   // 启动器
    if (/(^|["\s])(node(\.exe)?\s+)?"?server\.js"?\s*$/i.test(c.trim())) return true;  // 裸 `node server.js`
    return false;
  };
  const hit = arr.filter((p) => isTavern(p.CommandLine));
  tavernUp = hit.length > 0;
  why = hit.length
    ? '命中酒馆进程 ' + hit.map((p) => `${p.Name}#${p.ProcessId}「${String(p.CommandLine).trim().slice(0, 60)}」`).join('、')
    : `进程表 ${arr.length} 条，无酒馆进程（已排除自身工具链）`;
} catch (e) {
  tavernUp = false;
  why = '进程查询失败（' + String(e.message).split('\n')[0] + '）⇒ 按"未开"处理';
}
say('① 酒馆进程：' + (tavernUp ? '**开着** ⚠️' : '没开 ✅') + '　（' + why + '）');
if (tavernUp) {
  say('   ⚠️ 请先把酒馆关干净（否则它会把内存里的旧卡写回去）。本次不推。');
  if (APPLY) process.exit(3);
}

if (!fs.existsSync(SRC)) { console.error('❌ 源卡不存在：' + SRC); process.exit(2); }
const srcBuf = fs.readFileSync(SRC);
const srcHash = createHash('sha256').update(srcBuf).digest('hex');
say(`\n② 导入卡（源 ${srcBuf.length} B / ${srcHash.slice(0, 16).toUpperCase()}）`);
const existing = fs.readdirSync(path.join(TAV, 'characters')).filter((f) => MATCH.test(f));
say('   目录里同类卡：' + (existing.length ? existing.join('、') : '（无）'));
if (APPLY) {
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  const bak = path.join(TAV, 'characters', '_卡备份_' + stamp);
  if (existing.length) { fs.mkdirSync(bak, { recursive: true }); for (const f of existing) fs.copyFileSync(path.join(TAV, 'characters', f), path.join(bak, f)); say('   已备份 ⇒ ' + bak); }
  for (const f of existing) fs.unlinkSync(path.join(TAV, 'characters', f));
  fs.copyFileSync(SRC, DST);
  const h = createHash('sha256').update(fs.readFileSync(DST)).digest('hex');
  say(`   已导入 ${CARD_NAME}｜SHA256 ${h.slice(0, 16).toUpperCase()}｜一致 ${h === srcHash ? '✅' : '❌'}`);
  if (h !== srcHash) process.exit(2);
}

say('\n③ 重建世界书文件（与卡内世界书逐条一致）');
if (APPLY) {
  /* ⚠️ 2026-09-29 深夜：从「删」改成「重建」——卡绑着这本书，酒馆靠它加载与拨【身份】开关。
   *   重建源＝卡 JSON 里的 character_book（含 6 条【身份】，那是册子里没有的）。 */
  const wb = path.join(BOOK, '_write_worldbook.mjs');
  if (!fs.existsSync(wb)) { say("   ❌ 缺少 _write_worldbook.mjs"); process.exit(2); }
  try {
    const out = execFileSync(process.execPath, [wb, '--apply'], { encoding: 'utf8' });
    for (const line of String(out).trim().split(/\r?\n/)) say('   ' + line);
  } catch (e) { say("   ❌ 重建失败：" + (e.message || e)); process.exit(2); }
} else say('   （预演：将重建 ' + WBP + '）');

say('\n④ 读内容核对');
if (APPLY) {
  const b = fs.readFileSync(DST);
  let p = 8, info = null;
  while (p + 12 <= b.length) {
    const len = b.readUInt32BE(p); const type = b.toString('ascii', p + 4, p + 8);
    if (type === 'tEXt') {
      const d = b.subarray(p + 8, p + 8 + len); const z = d.indexOf(0);
      if (d.subarray(0, z).toString('latin1') === 'chara') {
        const j = JSON.parse(Buffer.from(d.subarray(z + 1).toString('latin1'), 'base64').toString('utf8'));
        const es = j.data.character_book.entries;
        info = { n: es.length, on: es.filter((e) => e.enabled).length, ids: es.filter((e) => /^【身份】/.test(e.comment)).map((e) => e.insertion_order).join('／'), mind: es.filter((e) => /\(心智姿态\)$/.test(e.comment)).length, world: j.data.extensions?.world };
      }
    }
    p += 12 + len; if (type === 'IEND') break;
  }
  say(`   世界书 ${info.n} 条（启用 ${info.on}）｜【身份】order ${info.ids}｜心智条 ${info.mind} 条｜extensions.world=${info.world ?? 'undefined'}`);
}
say(APPLY ? '\n✅ 推完。请重启酒馆并**开新聊天**（铁律 15）。' : '\n（预演。加 --apply 才动手。）');
