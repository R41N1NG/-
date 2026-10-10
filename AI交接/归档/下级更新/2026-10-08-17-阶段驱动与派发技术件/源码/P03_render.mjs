/**
 * P03_render.mjs —— 离线渲染取证（只读，不碰生产源、不写卡）
 *
 * 两件事：
 *   A. id7 渲染矩阵：按 gpt 16 号 §2 点名的组合（日期×段位×known×身份）逐格渲染，
 *      看**实际输出**里有没有「当下式围城/城破」句；
 *   B. 全卡入口扫描：用该局实测快照（1577.07 / 段位2 / known 仅「极乐引入手」/ 自设）
 *      逐条求值 241 个条目的 @@if 闸门 ＋ 常驻与触发词候选，再对通过者渲染，
 *      看这一刻**到底哪些条目**会把战争词递进上下文。
 *
 * 求值方式与 tools/checks/_chk_ejs_stage.mjs 同一套最小 EJS 语义（未另造轮子）。
 * 局限（如实标，不当作已验）：关键词命中只是**候选**，真实注入还受 ST 的递归扫描、
 * 预算、选择逻辑与宿主顺序影响；本脚本不模拟 ST 的最终装配。
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const BASE = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-17-阶段驱动与派发技术件';
const CARD = 'E:/角色卡制作/仙姝堕/最新角色卡/仙姝堕.json';
const CHAT = 'E:/tavern/SillyTavern/data/default-user/chats/仙姝堕/仙姝堕 - 2026-10-08@13h10m49s.jsonl';

/* ═══════════ 最小 EJS 求值器（与 _chk_ejs_stage.mjs 同一套） ═══════════ */
function compileEJS(tplText) {
  const re = /<%([_\-=]?)([\s\S]*?)([_\-]?)%>/g;
  let src = 'var __out = [];\n';
  let last = 0, m, slurp = false;
  const push = (s) => { if (s) src += '__out.push(' + JSON.stringify(s) + ');\n'; };
  while ((m = re.exec(tplText))) {
    let text = tplText.slice(last, m.index);
    const open = m[1], body = m[2], close = m[3];
    if (slurp) text = text.replace(/^[ \t]*\r?\n?/, '');
    if (open === '_') text = text.replace(/[ \t]*$/, '');
    push(text);
    if (open === '=' || open === '-') src += '__out.push(String(' + body + '));\n';
    else src += body + '\n';
    slurp = close === '_';
    last = re.lastIndex;
  }
  push(tplText.slice(last));
  src += 'return __out.join("");';
  // eslint-disable-next-line no-new-func
  return new Function('variables', src);
}
function safeRender(content, variables) {
  /* 闸门首行 @@if 要剥掉再看正文 */
  const lines = content.split('\n');
  let body = content;
  if (/^@@if/.test(lines[0] || '')) body = lines.slice(1).join('\n');
  try { return { ok: true, text: compileEJS(body)(variables) }; }
  catch (e) { return { ok: false, err: String(e && e.message || e) }; }
}
function evalGate(firstLine, variables) {
  const expr = firstLine.replace(/^@@if\s*/, '');
  try { return !!new Function('variables', 'return (' + expr + ');')(variables); }
  catch (e) { return { err: String(e && e.message || e) }; }
}

/* ═══════════ 取该局实测快照（chat_metadata.variables.stat_data） ═══════════ */
const rawLines = fs.readFileSync(CHAT, 'utf8').split(/\r?\n/).filter(Boolean).map((s) => JSON.parse(s));
const head = rawLines.find((r) => r.chat_metadata);
const SNAP = head.chat_metadata.variables.stat_data;
const 快照摘要 = {
  身份: SNAP.身份, 阵营: SNAP.阵营, 段位: SNAP.段位, 仙盟历: SNAP.仙盟历, 仙盟历文: SNAP.仙盟历文,
  初始时点: SNAP.初始时点, 历基准: SNAP.历基准, 历时累计: SNAP.历时累计, 最后处理楼号: SNAP.最后处理楼号,
  known为真的键: Object.keys(SNAP.known).filter((k) => SNAP.known[k] === true),
  known总键数: Object.keys(SNAP.known).length,
  状态栏自由文本: { 局势: SNAP.局势, 近闻: SNAP.近闻, 远闻: SNAP.远闻, 危机: SNAP.危机, 目标: SNAP.目标 },
  锚点账本: SNAP.锚点账本,
};

/* ═══════════ 战争「当下式」措辞表（沿用本卡清查口径） ═══════════ */
const WAR_RE = /兽潮|围城|城破|城陷|兵临城下|血战|断界崖|防线溃|溃缩/g;

const card = JSON.parse(fs.readFileSync(CARD, 'utf8'));
const ENTRIES = card.data.character_book.entries;
const id7 = ENTRIES.find((e) => e.id === 7);

/* ═══════════ A. id7 渲染矩阵 ═══════════ */
const knownBase = Object.fromEntries(Object.keys(SNAP.known).map((k) => [k, false]));
const mk = (ov) => ({ stat_data: Object.assign({}, SNAP, { known: Object.assign({}, knownBase, ov) }) });

/* 逐格给足「段位」：id7 判段只读段位（>=15→四；>=12→三；>=6→二；否则一），
 * 所以必须把 1..4 四个块都覆盖到，否则「阶段二三根本没渲染过」会被误读成没风险。 */
const V = (段位, 仙盟历文, 仙盟历, knownOv, 身份) => ({
  stat_data: Object.assign({}, SNAP, {
    段位, 仙盟历, 仙盟历文, 身份: 身份 || SNAP.身份,
    known: Object.assign({}, knownBase, knownOv || {}),
  }),
});
const 缺日期 = () => {
  const v = V(8, undefined, undefined, null);
  delete v.stat_data.仙盟历; delete v.stat_data.仙盟历文;
  return v;
};

const cases = [
  ['A0 ★该局实测快照：1577.07／段位2／known 仅极乐引入手／身份自设', V(2, '仙盟历 1577 年 · 七月初一', 1577.0701, { 极乐引入手: true })],
  ['A1 1577.07／段位8（映射到阶段二）／known空', V(8, '仙盟历 1577 年 · 七月初一', 1577.07, null)],
  ['A2 1577.07／段位13（映射到阶段三）／known空', V(13, '仙盟历 1577 年 · 七月初一', 1577.07, null)],
  ['A3 1577.07／段位16（映射到阶段四）／known空', V(16, '仙盟历 1577 年 · 七月初一', 1577.07, null)],
  ['A4 1578.03／段位8／known空', V(8, '仙盟历 1578 年 · 三月初三', 1578.03, null)],
  ['A5 1579.01／段位8／known[南域大劫]=false', V(8, '仙盟历 1579 年 · 一月初一', 1579.01, null)],
  ['A6 1579.01／段位8／known[南域大劫]=true', V(8, '仙盟历 1579 年 · 一月初一', 1579.01, { 南域大劫: true })],
  ['A7 1579.03／段位8／known[天溪城兽潮]=false（大劫真）', V(8, '仙盟历 1579 年 · 三月初三', 1579.03, { 南域大劫: true })],
  ['A8 1579.03／段位8／known[天溪城兽潮]=true', V(8, '仙盟历 1579 年 · 三月初三', 1579.03, { 南域大劫: true, 天溪城兽潮: true })],
  ['A9 1577.07／段位2／known污染未来（已抵达天溪+兽潮血战+天溪城破+赵无忧坠渊）', V(2, '仙盟历 1577 年 · 七月初一', 1577.07, { 极乐引入手: true, 已抵达天溪: true, 兽潮血战: true, 天溪城破: true, 赵无忧坠渊: true })],
  ['A10 1577.07／段位8／known污染未来（同上）', V(8, '仙盟历 1577 年 · 七月初一', 1577.07, { 已抵达天溪: true, 兽潮血战: true, 天溪城破: true })],
  ['A11 1579.06／段位2（晚日期低段位）／known[天溪城破]=true', V(2, '仙盟历 1579 年 · 六月初一', 1579.06, { 天溪城破: true })],
  ['A12 缺日期／段位8', 缺日期()],
  ['A13 身份=焚欲殿主／1577.07／段位2（殿主下限压到第四段）', V(2, '仙盟历 1577 年 · 七月初一', 1577.07, null, '焚欲殿主')],
];

const matrix = cases.map(([名, variables]) => {
  const r = safeRender(id7.content, variables);
  const txt = r.ok ? r.text : '';
  const 段标题 = [...txt.matchAll(/##\s*阶段([一二三四])\s*·\s*([^\n]*)/g)].map((m) => m[1] + '·' + m[2].trim());
  const 战争句 = [...txt.matchAll(new RegExp('[^\\n]{0,40}' + WAR_RE.source + '[^\\n]{0,40}', 'g'))].map((m) => m[0].trim());
  return {
    用例: 名,
    输入段位: variables.stat_data.段位,
    输入日期: variables.stat_data.仙盟历文 || '（缺）',
    渲染成功: r.ok,
    输出字符数: txt.length,
    渲染出的阶段块: 段标题,
    输出中的战争词句: 战争句,
    走了安全占位: 段标题.length === 0,
  };
});

/* 该局快照下 id7 的实际渲染全文（业务规则文本，可交） */
const r0 = safeRender(id7.content, mk({ 极乐引入手: true }));
if (r0.ok) fs.writeFileSync(BASE + '/材料/17d_id7在该局快照下的真实渲染.txt',
  `【渲染条件】1577.07／段位2／known 仅「极乐引入手」为真／身份=自设\n【来源】最新角色卡/仙姝堕.json entry id=7（正文 SHA256 88caa540…）\n\n` + r0.text, 'utf8');

/* ═══════════ B. 全卡入口扫描（该局快照下的候选集） ═══════════ */
const scanText = rawLines.filter((r) => r.mes).slice(-6).map((r) => r.mes).join('\n');
const snapVars = mk({ 极乐引入手: true });

const sweep = ENTRIES.map((e) => {
  const c = e.content || '';
  const lines = c.split('\n');
  const isGate = /^@@if/.test(lines[0] || '');
  const gate = isGate ? evalGate(lines[0], snapVars) : null;
  const gatePass = isGate ? gate === true : null;
  const gateErr = isGate && typeof gate === 'object' ? gate.err : null;
  const keyHits = (e.keys || []).filter((k) => k && scanText.includes(k));
  const 候选理由 = [];
  if (e.constant) 候选理由.push('常驻');
  if (keyHits.length) 候选理由.push('触发词命中:' + keyHits.join('/'));
  const 在册 = e.enabled !== false;
  const 进入本刻上下文 = 在册 && (e.constant || keyHits.length > 0) && (isGate ? gatePass === true : true);

  let 战争句 = [];
  let 渲染错误 = null;
  if (进入本刻上下文 && /兽潮|围城|城破|城陷|血战|兵临城下|兽乱/.test(c)) {
    const r = safeRender(c, snapVars);
    if (r.ok) 战争句 = [...r.text.matchAll(new RegExp('[^\\n]{0,40}' + WAR_RE.source + '[^\\n]{0,40}', 'g'))].map((m) => m[0].trim()).slice(0, 6);
    else 渲染错误 = r.err;
  }

  return {
    id: e.id, 标题: e.comment, 在册, 常驻: !!e.constant, 有闸门: isGate, 闸门通过: gatePass, 闸门错: gateErr,
    触发词命中: keyHits, 候选理由, 进入本刻上下文,
    正文含战争词: /兽潮|围城|城破|城陷|血战|兵临城下|兽乱/.test(c),
    渲染后战争句: 战争句, 渲染错误,
    content字符数: c.length, contentSHA: crypto.createHash('sha256').update(Buffer.from(c, 'utf8')).digest('hex').slice(0, 16),
  };
});

const 候选 = sweep.filter((x) => x.进入本刻上下文);
const 候选里带战争词 = 候选.filter((x) => x.渲染后战争句.length > 0);

const out = {
  快照: 快照摘要,
  扫描文本口径: '本局最后 6 条消息正文拼接（近似 scan_depth=6 的重放，非 ST 最终装配）',
  id7渲染矩阵: matrix,
  全卡扫描: {
    条目数: sweep.length,
    本刻候选数: 候选.length,
    候选清单: 候选.map((x) => ({ id: x.id, 标题: x.标题, 常驻: x.常驻, 触发词: x.触发词命中, 有闸门: x.有闸门 })),
    候选里输出战争词的条目: 候选里带战争词.map((x) => ({ id: x.id, 标题: x.标题, 常驻: x.常驻, 触发词: x.触发词命中, 闸门通过: x.闸门通过, 战争句: x.渲染后战争句 })),
    闸门求值抛错的条目: sweep.filter((x) => x.闸门错).map((x) => ({ id: x.id, 标题: x.标题, 错: x.闸门错 })),
    全部条目明细: sweep,
  },
  卡: { 路径: CARD, sha256: crypto.createHash('sha256').update(fs.readFileSync(CARD)).digest('hex'), 字节: fs.statSync(CARD).size },
};

fs.mkdirSync(BASE + '/材料', { recursive: true });
fs.writeFileSync(BASE + '/材料/17e_渲染矩阵与全卡入口扫描.json', JSON.stringify(out, null, 2), 'utf8');

console.log(JSON.stringify({
  id7矩阵: matrix.map((m) => ({ 用例: m.用例.slice(0, 12), 段: m.渲染出的阶段块.join('|'), 战争句数: m.输出中的战争词句.length })),
  候选数: 候选.length,
  候选里带战争词: 候选里带战争词.map((x) => x.id + ':' + x.标题),
}, null, 1));
