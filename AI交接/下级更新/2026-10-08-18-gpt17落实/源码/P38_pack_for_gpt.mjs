/**
 * P38_pack_for_gpt.mjs —— 按 gpt《交付约定与源码请求》打包**同一快照**的源码，供她云端实接二级面板。
 *
 * 输出目录：`AI交接/下级更新/二级面板接入源码/`（保留原项目相对路径）
 *   ├─ 卡片脚本/…、tools/checks/…、src/…、根目录几个构建脚本（照原相对路径）
 *   ├─ 清单.json              每个文件：原相对路径／是否构建输入／字节／完整 SHA256／对应卡 SHA／采集时间
 *   ├─ 去资源说明.md           面板生产件的 base64 资源替换位置（逻辑原样，不冒称字节一致）
 *   ├─ 门metadata子集.json     当前卡全部条目的 metadata（含 extensions 与有效召回配置）＋主线政策（逐条抄自卡内门）
 *   └─ 脱敏测试状态快照.json   真实局的 stat_data 结构（自由文本字段一律占位，不含正文/私密）
 * 只读原文件；不改任何生产件。
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'AI交接', '下级更新', '二级面板接入源码');
const CARD = '最新角色卡/仙姝堕.json';
const 采集时间 = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' +08:00';
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const 卡buf = fs.readFileSync(CARD);
const 卡SHA = sha256(卡buf);
const 卡json = JSON.parse(卡buf.toString('utf8'));

/* ── 第一批：她点名急需的完整源 ── */
const 第一批 = [
  ['卡片脚本/GM修改器.js', '面板入口／DOM／预览／原写入与撤销／控制台接口', true],
  ['卡片脚本/状态机.js', '自动与命令写入、派生账本、人工假保护、chat/message 双写、日期台账、聊天切换', true],
  ['卡片脚本/_src/状态栏面板.模板.js', '面板**生成源**（要改逻辑改这里）', true],
  ['卡片脚本/状态栏面板.js', '面板**生产件**（由 _pack_panel_script.mjs 从模板生成）', true],
  ['tools/pipeline/_pack_panel_script.mjs', '面板构建脚本（模板→生产件的唯一链路）', true],
  ['src/first_floor_rebuild/inject-timepoint.cjs', '时间点模块注入源（构建期注入状态机）', true],
];
/* ── 第二批：构建链／门禁／上游生成源 ── */
const 第二批 = [
  ['_build_card.js', '实际生效的制卡构建器（根目录这份）', true],
  ['build.js', '全流程构建（卡＋PNG＋世界书＋dist 同步）', true],
  ['ship.js', '一键极速交付（单测→构建→部署）', true],
  ['deploy_to_tavern.cjs', '酒馆部署与双向自检', true],
  ['AGENTS.md', '项目手册与铁律（含交付目录规范）', false],
  ['src/mingqi-db.js', '13 件名器的 brief／formNote／阶段 desc 生成源', true],
  ['卡片脚本/_src/名器图鉴数据.json', '面板名器图鉴（brief／阶段 desc／锁语）真源', true],
  ['src/text_data/_stage_drive.txt', 'id7 阶段驱动条目的内容源', true],
  ['tools/checks/_chk_derive_ledger.mjs', '派生账本与事务撤销门禁', false],
  ['tools/checks/_chk_stage_drive.mjs', '阶段驱动门禁（独立政策表＋卡内 content）', false],
  ['tools/checks/_chk_status_missing.mjs', '缺状态栏分支·真跑门禁', false],
  ['tools/checks/_chk_clock_acc.mjs', '日期台账（nextAcc／parseLishi）门禁', false],
  ['tools/checks/_chk_panel_artifact.mjs', '面板产物门禁', false],
  ['tools/checks/_chk_identity_sync.mjs', '身份同步门禁', false],
  ['tools/checks/_chk_freefield_gate.mjs', '自由字段闸＋泛指战事待核门禁', false],
  ['tools/checks/_chk_recursion.mjs', '世界书防递归门禁', false],
  ['tools/checks/_chk_payload.mjs', 'PNG 载荷（chara／ccv3）一致性门禁', false],
  ['tools/checks/_chk_relic_stage.mjs', '名器阶段条门禁', false],
  ['tools/checks/_chk_plot_gate.mjs', '主线剧情闸门门禁（三形态预期）', false],
  ['tools/checks/_chk_form_gate.mjs', '名器成形闸门门禁', false],
  ['tools/checks/_chk_mingqi_prereq.mjs', '名器成形硬前置门禁', false],
  ['tools/checks/_chk_defect_four.mjs', '四条状态缺陷行为负例', false],
  ['tools/checks/_chk_syntax.mjs', '卡内脚本语法门禁（含 EPERM 口径）', false],
  ['tools/checks/_chk_ejs_native.mjs', '原生 EJS 渲染门禁', false],
  ['tools/checks/_chk_all.mjs', '门禁总入口（只读化）', false],
];

const 清单 = { 采集时间, 采集机: require_os(), 卡: { 路径: CARD, 字节: 卡buf.length, SHA256: 卡SHA }, 说明: '所有文件取自同一快照；是否构建输入见字段', 文件: [] };
function require_os() { return process.platform + ' ' + process.arch + ' node ' + process.version; }

for (const [列表, 批次] of [[第一批, '第一批'], [第二批, '第二批']]) {
  for (const [rel, 用途, 是构建输入] of 列表) {
    const src = path.join(ROOT, rel);
    if (!fs.existsSync(src)) { 清单.文件.push({ 原相对路径: rel, 批次, 状态: '**本机不存在**', 用途, 是否构建输入: 是构建输入 }); continue; }
    const buf = fs.readFileSync(src);
    const dst = path.join(OUT, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.writeFileSync(dst, buf);
    清单.文件.push({ 原相对路径: rel, 打包路径: path.relative(ROOT, dst).replace(/\\/g, '/'), 批次, 用途, 是否构建输入: 是构建输入, 字节: buf.length, SHA256: sha256(buf) });
  }
}

/* ── 面板生产件的「去资源副本」：逻辑原样，只把 base64 资源换成空占位 ── */
{
  const rel = '卡片脚本/状态栏面板.js';
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const 替换 = [];
  let out = src;
  /* 资源形态（实测）：`XSD_CSS` 是 base64 文本、最长一条 134,924 字符的 base64（字体/图集）、
   * 7,180 字符 base64（面板 HTML 骨架）—— 它们都在**单引号**字面量里（我第一版只匹配了双引号 ⇒ 0 命中）。
   * 这里把「≥1000 字符的纯 base64 单/双引号字面量」与 `data:image/...;base64,` 一并替换为空占位，
   * 并记录**所属变量名／原长度／行号**。非 base64 的 JSON（如 XSD_RELIC_STAGES）不动 —— 那是数据不是图片资源。 */
  const 所属 = (idx) => {
    const i = src.lastIndexOf('const ', idx);
    if (i < 0) return '（未知）';
    const m = /^const\s+([A-Za-z0-9_$]+)/.exec(src.slice(i, i + 60));
    return m ? m[1] : '（未知）';
  };
  const 收集 = (re, 类型) => {
    out = out.replace(re, (m, g1, offset) => {
      替换.push({ 类型, 所属变量: 所属(offset), 原长度: m.length, 行号: src.slice(0, offset).split('\n').length });
      return m[0] === '"' ? '"__XSD_PLACEHOLDER__"' : (m[0] === "'" ? "'__XSD_PLACEHOLDER__'" : '__XSD_PLACEHOLDER__');
    });
  };
  收集(/'([A-Za-z0-9+/=]{1000,})'/g, 'base64 字面量（单引号）');
  收集(/"([A-Za-z0-9+/=]{1000,})"/g, 'base64 字面量（双引号）');
  收集(/data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]{50,}/g, 'data-URI 内嵌图片');
  const rel2 = '卡片脚本/状态栏面板（去资源副本）.js';
  const dst = path.join(OUT, rel2);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, out, 'utf8');
  清单.文件.push({ 原相对路径: rel, 打包路径: path.relative(ROOT, dst).replace(/\\/g, '/'), 批次: '第一批', 用途: '去资源等价副本（逻辑原样）', 是否构建输入: false, 字节: Buffer.byteLength(out, 'utf8'), SHA256: sha256(Buffer.from(out, 'utf8')), 原文件: { 字节: Buffer.byteLength(src, 'utf8'), SHA256: sha256(Buffer.from(src, 'utf8')) } });
  fs.writeFileSync(path.join(OUT, '去资源说明.md'), [
    '# 面板生产件「去资源副本」说明',
    '',
    '- 原文件：`卡片脚本/状态栏面板.js`（完整件已按原路径一并上传，逻辑与它逐字一致）',
    '- 副本文件：`卡片脚本/状态栏面板（去资源副本）.js`',
    '- 做法：**只把内嵌资源（base64 字面量／data URI 图片）替换为空占位** `__XSD_PLACEHOLDER__`，**不改任何逻辑代码**（不删行、不改函数、不动分支）。',
    '- 非 base64 的**数据表**（如 `XSD_RELIC_STAGES`＝名器图鉴 JSON）**保留原样** —— 那是数据不是图片资源。',
    '- 原文件 SHA256：`' + sha256(Buffer.from(src, 'utf8')) + '`（' + Buffer.byteLength(src, 'utf8') + ' B）',
    '- 副本 SHA256：`' + sha256(Buffer.from(out, 'utf8')) + '`（' + Buffer.byteLength(out, 'utf8') + ' B）⇒ **两者字节不同，不冒称一致**。',
    '',
    '## 替换位置（共 ' + 替换.length + ' 处）',
    ...替换.map((r, i) => `${i + 1}. 所属变量 \`${r.所属变量}\`　${r.类型}　原长度 ${r.原长度} 字符　行 ${r.行号}`),
    替换.length ? '' : '（没有匹配到内嵌资源——若如此，副本与原件等价。）',
  ].join('\n'), 'utf8');
  清单.文件.push({ 原相对路径: '—', 打包路径: 'AI交接/下级更新/二级面板接入源码/去资源说明.md', 批次: '第一批', 用途: '去资源说明（替换位置）', 是否构建输入: false, 字节: fs.statSync(path.join(OUT, '去资源说明.md')).size });
  清单.去资源替换处数 = 替换.length;
}

/* ── 门 metadata 子集：当前卡全部条目（含 extensions 与有效召回配置）＋主线政策（逐条抄自卡内门）── */
{
  const 条 = 卡json.data.character_book.entries.map((e) => ({
    id: e.id, uid: e.uid ?? null, comment: e.comment,
    constant: e.constant === true, enabled: e.enabled !== false, disable: e.disable === true,
    keys: e.keys || [], secondaryKeys: e.secondaryKeys || e.keysecondary || null,
    selective: e.selective === true, selectiveLogic: e.selectiveLogic ?? null,
    order: e.order ?? null, position: e.position ?? null, depth: e.depth ?? null,
    preventRecursion: e.preventRecursion === true, excludeRecursion: e.excludeRecursion === true,
    字符数: (e.content || '').length,
    首行门: /^@@if/.test(e.content || '') ? String(e.content).split(/\r?\n/)[0] : null,
    有if门: /^@@if/.test(e.content || ''),
  }));
  const 主线 = 条.filter((e) => /【剧情】(一|二|三|四|五|六|七|八|九|十|十一|十二|十三|十四|十五)\b/.test(e.comment || '') && !/专轨/.test(e.comment || ''));
  fs.writeFileSync(path.join(OUT, '门metadata子集.json'), JSON.stringify({
    来源卡: CARD, 卡字节: 卡buf.length, 卡SHA256: 卡SHA, 条目数: 条.length,
    说明: '全部条目的 metadata（含首行完整门）；召回配置＝constant/enabled/disable/keys/secondaryKeys/selective/order/position/depth/递归开关。**这是当前卡的实测值，不是设计文档**。',
    '卡级 extensions 键': Object.keys(卡json.data.extensions || {}),
    'xsd_assets.meta': (卡json.data.extensions && 卡json.data.extensions.xsd_assets && 卡json.data.extensions.xsd_assets.meta) || null,
    条目: 条,
    '主线事实白名单与固定世界事件政策（逐条抄自卡内门，含日期与前置）': 主线.map((e) => ({ id: e.id, comment: e.comment, 首行门: e.首行门 })),
  }, null, 2), 'utf8');
  清单.文件.push({ 原相对路径: '（由当前卡导出）', 打包路径: 'AI交接/下级更新/二级面板接入源码/门metadata子集.json', 批次: '第二批', 用途: '当前卡门 metadata＋主线政策', 是否构建输入: false, 字节: fs.statSync(path.join(OUT, '门metadata子集.json')).size });
}

/* ── 脱敏测试状态快照：真实局的 stat_data 结构，自由文本一律占位 ── */
{
  const CHAT_DIR = 'E:/tavern/SillyTavern/data/default-user/chats/仙姝堕';
  const 自由文本 = ['阶段总结', '局势', '近闻', '远闻', '危机', '目标', '线索', '时间', '仙盟历文', '地点', '天气', '环境', '在场', '暗处'];
  let 快照 = null, 来源 = null;
  if (fs.existsSync(CHAT_DIR)) {
    const f = fs.readdirSync(CHAT_DIR).filter((x) => x.endsWith('.jsonl')).sort().pop();
    if (f) {
      const lines = fs.readFileSync(path.join(CHAT_DIR, f), 'utf8').split(/\r?\n/).filter(Boolean);
      for (const l of lines) { try { const r = JSON.parse(l); if (r && r.chat_metadata && r.chat_metadata.variables && r.chat_metadata.variables.stat_data) { 快照 = r.chat_metadata.variables.stat_data; break; } } catch (e) {} }
      来源 = f;
    }
  }
  const 脱敏 = { 来源说明: '本机真实测试局 ' + (来源 || '（未找到）') + ' 的 chat_metadata.variables.stat_data 结构；**已脱敏**：所有自由文本字段与正文相关值一律替换为占位，不含剧情正文、聊天记录、密钥或图片。', 采集时间, 自由文本字段处理: '置为 "<占位·已脱敏>"', 数据: null };
  if (快照) {
    const 复制 = JSON.parse(JSON.stringify(快照));
    for (const k of 自由文本) if (k in 复制 && typeof 复制[k] === 'string') 复制[k] = '<占位·已脱敏>';
    if (复制.known && typeof 复制.known === 'object') {
      /* known 只保留键与布尔值（这本来就是她要的"最近解锁结构"） */
      复制.known = Object.fromEntries(Object.entries(复制.known).map(([k, v]) => [k, v === true ? true : (v === false ? false : '<非布尔·已置占位>')]));
    }
    脱敏.数据 = 复制;
    脱敏.键清单 = Object.keys(复制);
  }
  fs.writeFileSync(path.join(OUT, '脱敏测试状态快照.json'), JSON.stringify(脱敏, null, 2), 'utf8');
  清单.文件.push({ 原相对路径: '（真实局 stat_data 脱敏）', 打包路径: 'AI交接/下级更新/二级面板接入源码/脱敏测试状态快照.json', 批次: '第二批', 用途: '脱敏测试状态快照', 是否构建输入: false, 字节: fs.statSync(path.join(OUT, '脱敏测试状态快照.json')).size });
}

/* ── 清单.json ── */
清单.缺少的文件 = 清单.文件.filter((f) => f.状态).map((f) => f.原相对路径);
清单['根目录 package.json'] = fs.existsSync('package.json') ? fs.readFileSync('package.json', 'utf8').slice(0, 200) : '**不存在**（本工程无 Node 包依赖，脚本全部为自带依赖的 .mjs/.js/.cjs）';
清单['根目录锁文件'] = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'].filter((f) => fs.existsSync(f));
fs.writeFileSync(path.join(OUT, '清单.json'), JSON.stringify(清单, null, 2), 'utf8');

const 总字节 = 清单.文件.reduce((a, f) => a + (f.字节 || 0), 0);
console.log('【打包完成】' + path.relative(ROOT, OUT).replace(/\\/g, '/'));
console.log('  文件 ' + 清单.文件.length + ' 个｜合计 ' + (总字节 / 1024).toFixed(0) + ' KB｜卡 SHA256 ' + 卡SHA.slice(0, 16) + '…');
for (const f of 清单.文件) console.log('   ' + (f.状态 ? '✘ ' : '✔ ') + (f.原相对路径 || '') + ' → ' + (f.打包路径 || '') + (f.字节 ? '　' + (f.字节 / 1024).toFixed(0) + ' KB' : ''));
if (清单.缺少的文件.length) console.log('  ⚠️ 本机缺少：' + 清单.缺少的文件.join('、'));
