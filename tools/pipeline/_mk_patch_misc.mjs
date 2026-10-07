#!/usr/bin/env node
/**
 * _mk_patch_misc.mjs —— 给【势力】【物品】【剧情】三类世界书条**只补 YAML 层级**，一个字不许改。
 *
 * 只做三种动作（对应任务硬规则 1）：
 *   (a) 插入 `# 条名`（条名取自 comment，去掉「〔待解锁〕」与「【势力】」这类分区前缀）
 *   (b) 把**已有的小标题**（`**时点**：…` 这种整行加粗小标题、`解锁条件:`／`认知边界:`／`旁白禁泄：`
 *       这种行首标签）升成 `## 小节名`，原标签行原样挪到下一行、行首加 `- `
 *   (c) 删行首多余缩进（层级只用 # / ## / -；本来已是 `- ` 的行保持原样）
 *   `@@if …` 行原样留在最前。
 *
 * 自检（硬关卡，用任务给的第 4 条口径）：
 *   改前、改后各自归一化 —— 去掉 `#` 开头的标题行 → 去掉行首 `- ` 与缩进 → 去掉所有 `**`
 *   → 去掉「〔待解锁〕」前缀 → 去掉所有空白与缩进；
 *   两次结果必须**逐字符相同**。不相同 = 动了正文 → 不入补丁、记失败、回退重做。
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = process.argv[2] ?? '仙姝墮-世界书.json';
const OUT = process.argv[3] ?? '_patch_misc.json';
const REPORT = process.argv[4] ?? '_misc_patch_report.txt';

const d = JSON.parse(readFileSync(SRC, 'utf8').replace(/^\uFEFF/, ''));
const stripLate = (s) => String(s || '').replace(/^(\s*〔待解锁〕)+/, '');
const NAME_RE = /^【(势力|物品|剧情)([^】]*)】\s*(.*)$/;

/* 分隔符（半角/全角冒号）= 归一化时会被去掉的符号，故小节名一律不带它 */
const isSep = (ch) => ch === ':' || ch === '：';

/* ---------- 归一化：自检专用 ---------- */
const normalize = (s) => String(s)
  .replace(/^\uFEFF/, '')
  .replace(/\r\n?/g, '\n')
  .split('\n')
  .filter((ln) => !/^\s*#{1,6}\s/.test(ln))                       // 去掉 # 开头的标题行
  .map((ln) => ln.replace(/^\s*-?\s*/, '').replace(/^\s+/, ''))   // 去掉行首 "- "（含我加的与原有的缩进条）与缩进
  .join('\n')
  .replace(/\*\*/g, '')                                          // 去掉加粗星号
  .replace(/〔待解锁〕/g, '')                             // 去掉停用前缀
  .replace(/\s+/g, '');                                          // 去掉所有空白

/* ---------- 行形判定 → {sec, text} | {plain} | {dashed} ---------- */
const DELIM = '[：:]';
function toSection(line, nextLine) {
  const raw = line.replace(/\r$/, '');
  const t = raw.replace(/^\s+/, '');
  if (!t) return { blank: true };
  if (/^@@/.test(t)) return { plain: t };            // `@@if …` 原样、不加前缀
  if (/^#{1,6}\s/.test(t)) return { plain: t };
  if (/^-\s/.test(t)) return { dashed: t };          // 已是 `- ` 条目：只删行首缩进
  if (/^-\s*@@/.test(t)) return { plain: t };

  /* ① 整行加粗小标题：**标签**：内容 / **标签**： / **标签。** 内容
   *   标签要**短得像个标题**（≤14 字，且不含句读）才算小标题；
   *   `**这是…**：` 这种夹在正文里的整句加粗是行内强调，不升小节。 */
  const LABEL_OK = (s) => s && s.length <= 14 && !/[。！？；，、（）：:「」《》]/.test(s);
  if (/^\*\*.+?\*\*/.test(t)) {
    let m = t.match(new RegExp('^(\\*\\*.+?\\*\\*)\\s*' + DELIM + '\\s*(.*)$'));
    if (m && LABEL_OK(m[1].replace(/\*\*/g, '').trim())) return { sec: secOf(m[1]), text: t };
    m = t.match(new RegExp('^(\\*\\*.+?\\*\\*)\\s*' + DELIM + '\\s*$'));
    if (m && LABEL_OK(m[1].replace(/\*\*/g, '').trim())) return { sec: secOf(m[1]), text: t };
    m = t.match(/^(\*\*.+?\*\*)\s*([^\s].*)$/);
    if (m) {
      const label = m[1].replace(/\*\*/g, '').trim();
      const tail = m[2].replace(/^\s+/, '');
      if (/^[。．.]$/.test(tail[0]) && LABEL_OK(label)) {
        return { sec: secOf(m[1]).replace(/[。．.]$/, ''), text: t };
      }
    }
    return { plain: t };
  }

  /* ② 行首标签：解锁条件：内容 / 短标签：内容 / 短标签：独占一行且下面挂着条目 */
  let m = t.match(new RegExp('^(解锁条件)\\s*' + DELIM + '\\s*(.*)$'));
  if (m) return { sec: secOf(m[1]), text: t };
  m = t.match(new RegExp('^([^' + DELIM + ']{1,14})\\s*' + DELIM + '\\s*(.*)$'));
  if (!m) m = t.match(new RegExp('^([^' + DELIM + ']{1,14})\\s*' + DELIM + '\\s*$'));
  if (m && !/[。！？；，、（）「」《》]/.test(m[1])) {    const rest = (m[2] ?? '').trim();
    /* 空标签行：只在下一行确实挂着 `- ` 条目时才升小节 */
    if (rest !== '' || /^\s*-\s/.test(nextLine ?? '')) return { sec: secOf(m[1]), text: t };
  }
  return { plain: t };
}
/* 标签 → 小节名：去加粗星号、去尾部分隔符与句读 */
function secOf(labelRaw) {
  return labelRaw.replace(/\*\*/g, '').replace(/[：:。．.、\s]+$/, '').trim();
}

/* ---------- 单条转换 ---------- */
function convert(content) {
  const c = String(content);
  const hadNL = /\n$/.test(c);
  const lines = c.replace(/\n$/, '').split('\n');
  const out = [];
  let sawSec = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*$/.test(line)) { out.push(''); continue; }
    const r = toSection(line, lines[i + 1]);
    if (r.blank) { out.push(''); continue; }
    if (r.dashed) { out.push(r.dashed); continue; }   // 已是 `- `：原样（含原有的 `- `），只删了行首缩进
    if (r.sec) {
      out.push('## ' + r.sec);
      sawSec = true;
      out.push('- ' + r.text);
    } else {
      out.push(/^@@/.test(r.plain) ? r.plain : '- ' + r.plain);   // `@@if …` 不加前缀，原样留在原位
    }
  }
  if (!sawSec) {
    const idx = out.findIndex((l) => l !== '' && !/^\s*@@/.test(l));
    if (idx >= 0) out.splice(idx, 0, '## 正文');
  }
  return out.join('\n') + (hadNL ? '\n' : '');
}

/* ---------- 跑 ---------- */
const picked = [];
for (const [uid, e] of Object.entries(d.entries)) {
  const rawComment = String(e.comment || '');
  const cm = stripLate(rawComment).match(NAME_RE);
  if (!cm) continue;
  const title = cm[3].trim() || stripLate(rawComment).replace(/^【[^】]*】\s*/, '').trim();
  picked.push({ uid, kind: cm[1], title, rawComment, before: String(e.content || '') });
}
picked.sort((a, b) => Number(a.uid) - Number(b.uid));

const patch = {};
const ok = [], bad = [], secNames = new Map(), secPerEntry = new Map();
for (const p of picked) {
  const converted = convert(p.before);
  const after = '# ' + p.title + '\n' + converted;
  const normBefore = normalize(p.before);
  const normAfter = normalize(after);
  let same = normBefore === normAfter;
  const why = [];
  if (!same) {
    let k = 0;
    while (k < Math.min(normBefore.length, normAfter.length) && normBefore[k] === normAfter[k]) k++;
    why.push(`归一化第 ${k + 1} 字符起不同：改前「${normBefore.slice(Math.max(0, k - 14), k + 14)}」／改后「${normAfter.slice(Math.max(0, k - 14), k + 14)}」`);
  }
  /* 结构硬项 */
  const h1 = after.split('\n').filter((l) => /^# /.test(l));
  if (h1.length !== 1) { same = false; why.push(`# 条名有 ${h1.length} 个（应为 1 个）`); }
  else if (h1[0] !== '# ' + p.title) { same = false; why.push('# 条名与 comment 推得的条名不一致'); }
  if (!/^## /m.test(after)) { same = false; why.push('没有 ## 小节'); }
  const firstNonIf = after.split('\n').find((l) => l !== '' && !/^\s*@@/.test(l));
  if (!/^# /.test(firstNonIf || '')) { same = false; why.push('# 条名不在（@@if 之后的）最前'); }
  for (const ln of after.split('\n')) {
    const t = ln.replace(/^\s+/, '');
    if (t && !/^(#|##|- )/.test(t) && !/^@@/.test(t)) { same = false; why.push(`出现非 #/##/- 开头的内容行：${t.slice(0, 24)}`); break; }
  }
  const beforeIf = p.before.split('\n').filter((l) => /^\s*@@/.test(l)).map((l) => l.trim());
  const afterIf = after.split('\n').filter((l) => /^\s*@@/.test(l)).map((l) => l.trim());
  if (JSON.stringify(beforeIf) !== JSON.stringify(afterIf)) {
    same = false;
    why.push(`@@if 行被改动或移位：改前 ${JSON.stringify(beforeIf)} ／ 改后 ${JSON.stringify(afterIf)}`);
  }

  const secs = [...after.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
  secPerEntry.set(p.uid, secs.join(' ｜ '));
  for (const s of secs) secNames.set(s, (secNames.get(s) || 0) + 1);

  if (same) { patch[p.uid] = after; ok.push({ ...p, after }); }
  else bad.push({ ...p, after, why });
}

const byKind = {};
for (const k of ['势力', '物品', '剧情']) byKind[k] = { total: 0, ok: 0, fail: 0 };
for (const p of picked) byKind[p.kind].total++;
for (const p of ok) byKind[p.kind].ok++;
for (const p of bad) byKind[p.kind].fail++;

writeFileSync(OUT, JSON.stringify(patch, null, 2) + '\n', 'utf8');

const L = [];
L.push(`来源：${SRC}`);
L.push(`处理 ${picked.length} 条 ｜ 自检通过 ${ok.length} 条 ｜ 失败 ${bad.length} 条`);
for (const k of ['势力', '物品', '剧情']) {
  const b = byKind[k];
  L.push(`  【${k}】处理 ${b.total} ｜ 通过 ${b.ok} ｜ 失败 ${b.fail}`);
}
L.push('');
L.push('小节名清单（去重，' + secNames.size + ' 个）：');
L.push([...secNames.keys()].sort().join(' ｜ '));
L.push('');
L.push('小节名频次：');
L.push([...secNames.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}×${v}`).join(' ｜ '));
if (bad.length) {
  L.push('');
  L.push('失败条目：');
  for (const b of bad) L.push(`  uid=${b.uid} ${b.rawComment} —— ${b.why.join('；')}`);
}
L.push('');
L.push('逐条小节：');
for (const p of picked) L.push(`  uid=${String(p.uid).padStart(6)} ｜ ${p.rawComment} ｜ ${p.before.length}→${(patch[p.uid] || '').length} 字 ｜ ${patch[p.uid] ? 'OK' : 'FAIL'} ｜ ${secPerEntry.get(p.uid)}`);
const rep = L.join('\n');
writeFileSync(REPORT, rep + '\n', 'utf8');
console.log(rep);
