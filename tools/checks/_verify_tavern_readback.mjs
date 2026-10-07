#!/usr/bin/env node
/**
 * _verify_tavern_readback.mjs —— **读回卡内字段**核对「酒馆那张卡是不是我刚构建的那张」
 *
 * 为什么要有它（2026-09-28 第三十五轮，铁律 38）：
 *   `_fix_import_tavern.mjs` 打完"源 ≡ 酒馆（SHA256 一致）"**并不代表卡真的换上了**。
 *   实测：导入后**几秒内**酒馆会按它内存里的**旧角色对象**把 `characters\*.png` 回写一遍 ——
 *     · 酒馆那份 `extensions.depth_prompt.prompt` 只有 1,908 字（无第八、九节），而构建源是 4,790 字；
 *     · 顶层多出一个 `chat` 键（值形如 `2026-9-28 @03h 43m 04s 241ms`）＝**被酒馆复写过的标志**。
 *   而我只比了"文件字节 SHA"⇒ 连报了三轮"已推送、一致"，主人看到的却一直是旧卡。
 *
 * 本脚本核对的是**卡内字段**（不是文件大小），逐项打印：
 *   ① `extensions.depth_prompt.prompt` 字数（酒馆 vs 源）
 *   ② `character_book.entries` 条数
 *   ③ `description / first_mes / mes_example` 字数
 *   ④ 顶层是否出现 `chat` 键（有 ⇒ 被酒馆回写）
 *   ⑤ 面板脚本关键标记：翻面（`xsdMakeFlipper`）、大图链（`xsdBigSourcesFor`）、自检行（`data-xds-selfcheck`）
 *
 * 用法：
 *   node _verify_tavern_readback.mjs                 # 只读一次
 *   node _verify_tavern_readback.mjs --wait 10       # 等 10 秒后再读一次（看有没有被回写）
 *   node _verify_tavern_readback.mjs --strict        # 任何一项不等即 exit 1（给 _chk_all 用）
 *
 * 退出码：0＝通过（或酒馆未安装，自动跳过）；1＝有不一致；2＝源卡缺失
 */
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const SRC = '仙姝墮-角色卡（全书群像）.png';
const TAVERN_DIR = 'E:/tavern/SillyTavern/data/default-user/characters';
const TARGET = '仙姝墮 · 一张跑全书.png';
const STRICT = process.argv.includes('--strict');
const WAIT = (() => {
  const i = process.argv.indexOf('--wait');
  return i >= 0 ? Number(process.argv[i + 1] ?? 8) : 0;
})();

/** 从 PNG 里取出 `chara` 文本块（与 _inspect_card1.mjs / _ref_statusbar.mjs 同法） */
function charaOf(png) {
  const b = readFileSync(png);
  let i = 8;
  while (i + 8 <= b.length) {
    const len = b.readUInt32BE(i);
    const type = b.toString('ascii', i + 4, i + 8);
    const data = b.subarray(i + 8, i + 8 + len);
    if (type === 'tEXt') {
      const z = data.indexOf(0);
      if (data.toString('latin1', 0, z) === 'chara') return data.subarray(z + 1).toString('latin1');
    }
    if (type === 'IEND') break;
    i += 12 + len;
  }
  return null;
}

function readCard(png) {
  const raw = charaOf(png);
  if (!raw) throw new Error('PNG 里没有 chara 块：' + png);
  const j = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  const d = j.data || {};
  const ext = d.extensions || {};
  const dp = ext.depth_prompt;
  const prompt = typeof dp === 'object' && dp ? String(dp.prompt ?? '') : String(dp ?? '');
  /* ★ 面板脚本正文（卡里那份）—— 只比"文件字节"抓不到"同长度不同内容"，必须比正文 */
  const scripts = ((ext.tavern_helper || {}).scripts || []);
  const panel = String((scripts.find((s) => /状态栏面板/.test(String(s.name))) || {}).content ?? '');
  return {
    json: j,
    data: d,
    depthPrompt: prompt,
    depth: typeof dp === 'object' && dp ? dp.depth : undefined,
    role: typeof dp === 'object' && dp ? dp.role : undefined,
    entries: ((d.character_book || {}).entries || []).length,
    desc: String(d.description ?? '').length,
    firstMes: String(d.first_mes ?? '').length,
    mesExample: String(d.mes_example ?? '').length,
    altGreetings: (d.alternate_greetings || []).length,
    hasChat: Object.prototype.hasOwnProperty.call(j, 'chat'),
    chatVal: j.chat,
    extFlat: JSON.stringify(ext),
    regexTracks: ((ext.regex_scripts || [])).length,
    panelLen: panel.length,
    panelSha: createHash('sha256').update(panel).digest('hex').slice(0, 16).toUpperCase(),
    panel,
  };
}
/** 面板脚本必须含有的"最新一版功能标记"——少一个就说明**卡是旧的**（哪怕文件大小对得上） */
const PANEL_MARKERS = [
  'xsdWireInline',      // 自包含点击（第 33 轮）
  'xsdMakeFlipper',     // 同阶段翻面（第 34 轮）
  'xsdBigSourcesFor',   // 放大用大图（第 34 轮）
  'xsdAttrFrom',        // data-alt 两段式读取（第 36 轮）
  'xsdLastOpen',        // 双开箱去重（第 36 轮）
  'xsdStageForChar',    // ★ 按人判阶段（第 38 轮）
  'xsdMentioningText',  // ★ 按名字取字段（第 38 轮）
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!existsSync(SRC)) { console.error('缺源卡：' + SRC + '（先跑 _build_card_png.js）'); process.exit(2); }

const tavernPath = join(TAVERN_DIR, TARGET);
if (!existsSync(tavernPath)) {
  console.log('⚠️ 酒馆未安装／没有这张卡 ⇒ 跳过读回核对（' + tavernPath + '）');
  process.exit(0);
}

const src = readCard(SRC);
const rows = [];
const push = (k, a, b, ok) => rows.push({ 项: k, 酒馆: a, 源: b, ok });

function compare(label) {
  const tav = readCard(tavernPath);
  const st = statSync(tavernPath);
  rows.length = 0;
  push('depth_prompt 字数', tav.depthPrompt.length, src.depthPrompt.length, tav.depthPrompt.length === src.depthPrompt.length);
  push('depth_prompt 含第八节', tav.depthPrompt.includes('第八节'), src.depthPrompt.includes('第八节'),
    tav.depthPrompt.includes('第八节') === src.depthPrompt.includes('第八节'));
  push('depth_prompt 含 9.8', tav.depthPrompt.includes('9.8'), src.depthPrompt.includes('9.8'),
    tav.depthPrompt.includes('9.8') === src.depthPrompt.includes('9.8'));
  push('世界书条目数', tav.entries, src.entries, tav.entries === src.entries);
  push('description 字数', tav.desc, src.desc, tav.desc === src.desc);
  push('first_mes 字数', tav.firstMes, src.firstMes, tav.firstMes === src.firstMes);
  push('mes_example 字数', tav.mesExample, src.mesExample, tav.mesExample === src.mesExample);
  push('顶层 chat 键（被酒馆回写）', tav.hasChat ? '有 ⇒ ' + String(tav.chatVal) : '无', src.hasChat ? '有' : '无', tav.hasChat === src.hasChat);
  push('面板·翻面 xsdMakeFlipper', tav.extFlat.includes('xsdMakeFlipper'), src.extFlat.includes('xsdMakeFlipper'),
    tav.extFlat.includes('xsdMakeFlipper') === src.extFlat.includes('xsdMakeFlipper'));
  push('面板·大图链 xsdBigSourcesFor', tav.extFlat.includes('xsdBigSourcesFor'), src.extFlat.includes('xsdBigSourcesFor'),
    tav.extFlat.includes('xsdBigSourcesFor') === src.extFlat.includes('xsdBigSourcesFor'));
  push('面板·自检行 data-xds-selfcheck', tav.extFlat.includes('data-xds-selfcheck'), src.extFlat.includes('data-xds-selfcheck'),
    tav.extFlat.includes('data-xds-selfcheck') === src.extFlat.includes('data-xds-selfcheck'));
  push('depth_prompt 深度/角色', `${tav.depth}/${tav.role}`, `${src.depth}/${src.role}`,
    String(tav.depth) === String(src.depth) && String(tav.role) === String(src.role));
  /* ★★ 面板脚本正文：长度 + sha + 逐条功能标记（这是 2026-09-28 那次"卡被客户端回写"唯一能抓到的口径） */
  push('面板脚本字符数', tav.panelLen, src.panelLen, tav.panelLen === src.panelLen);
  push('★ 面板脚本 sha256', tav.panelSha, src.panelSha, tav.panelSha === src.panelSha);
  for (const mk of PANEL_MARKERS) {
    const a = tav.panel.includes(mk), b = src.panel.includes(mk);
    push('  · 面板含 ' + mk, a, b, a && b);
  }
  return { tav, st };
}

const first = compare();
console.log('【读回卡内字段】' + new Date().toLocaleString('zh-CN') + (WAIT ? `（先读一次，${WAIT} 秒后复读）` : ''));
console.log('  酒馆：' + tavernPath + '｜' + first.st.size + ' B｜' + first.st.mtime.toLocaleString('zh-CN'));
console.log('  源卡：' + SRC + '｜' + statSync(SRC).size + ' B');
for (const r of rows) console.log(`  ${r.ok ? '✔' : '✘'} ${r.项}：酒馆 ${r.酒馆} ／ 源 ${r.源}`);

let bad = rows.filter((r) => !r.ok);
let recheckBad = [];

if (WAIT) {
  await sleep(WAIT * 1000);
  const second = compare();
  recheckBad = rows.filter((r) => !r.ok);
  console.log(`\n【${WAIT} 秒后复读】文件 ${second.st.size} B｜mtime ${second.st.mtime.toLocaleString('zh-CN')}`);
  for (const r of recheckBad) console.log(`  ✘ ${r.项}：酒馆 ${r.酒馆} ／ 源 ${r.源}`);
  if (!recheckBad.length) console.log('  ✔ 复读一致 —— 没有被酒馆回写');
}

const badNow = recheckBad.length ? recheckBad : bad;
if (!badNow.length) {
  console.log('\n✅ 读回通过：酒馆那份卡与构建源的**卡内字段**一致');
  process.exit(0);
}
console.log('\n❌ 不一致（共 ' + badNow.length + ' 项）：' + badNow.map((r) => r.项).join('、'));
console.log('   ⇒ 处置（铁律 38）：让主人**先关掉/重开酒馆**（或切到别的角色触发重载），再 `node _fix_import_tavern.mjs --apply`，');
console.log('      然后重跑本脚本。**不要连做两遍导入** —— 第一遍会被酒馆内存里的旧卡再盖一次。');
process.exit(STRICT || badNow.length ? 1 : 0);
