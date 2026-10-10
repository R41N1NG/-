#!/usr/bin/env node
/**
 * _chk_all.mjs —— **一条命令跑完全部验收**（交接用）
 *
 * 为什么要有它：验收脚本已经长到 10+ 个（卡的、脚本的、提示词的、锚点的、离线真机的），
 *   下一轮开工的人（很可能是下一个 agent）不该靠翻文档去找「该跑哪些」。
 *
 * 用法：node _chk_all.mjs            （只跑验收）
 *       node _chk_all.mjs --push     （跑完验收再跑 _push_card.mjs --apply ＋ _clean_cards.mjs --apply）
 *
 * 退出码：0＝全绿；1＝有脚本失败；2＝脚本不存在
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const NODE = 'C:\\Program Files\\nodejs\\node.exe';
const PUSH = process.argv.includes('--push');
/* --build：显式构建**候选**（只写隔离暂存目录，绝不碰 最新角色卡/ 与 dist/）。 */
const BUILD = process.argv.includes('--build');
const STAGE_DIR = path.join(process.cwd(), '_staging_chk');
const FULL = process.argv.includes('--full') || process.argv.includes('--allow-heavy') || process.argv.includes('--full-ci-release-only');

if (!FULL) {
  console.error(`
╔═══════════════════════════════════════════════════════════════════════════╗
║  ⚠️  【铁律 33 防盲测拦截提示】                                          ║
║  日常开发请优先使用秒级交付流：node ship.js 或定向单测（耗时 < 1 秒）！   ║
║                                                                           ║
║  _chk_all 包含无头 Chrome 等 31 个重型探针，总耗时 30+ 秒。               ║
║  若【确实需要全套验收】（例如发版前夕全量回归），请显式追加参数：          ║
║  👉 node tools/checks/_chk_all.mjs --full                                 ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);
  process.exit(1);
}

/** [脚本, 参数[], 说明, 期望退出码] —— **全部只读**。
 *  2026-10-08（gpt 17 号 §5-3「只读检查、候选构建、载荷验证、发布各自独立」）：
 *  原先第一项是 `_build_card.js` ⇒ **跑一次门禁就重写角色卡 JSON 与交付目录**。现已摘出：
 *  构建只在显式加 `--build` 时跑，而且**只写隔离暂存**（`--stage`），不碰交付目录。 */
const STEPS = [
  ['_final_check_card.js', [], '终检（禁用词／剧透词／停用标记／重复条目／{{user}} 引用）', 0],
  ['_chk_greetings.mjs', [], '★ 开场楼结构：19 个状态字段齐／角色块配对／IdentityPick 在位', 0],
  ['_chk_prose.mjs', [], '★ 文风硬关卡（词表相对原文 ＋ 句号/逗号比 vs 原文最散的一章；新增问题即红）', 0],
  ['_chk_panel.mjs', [], '面板：11 格 + FIELD_MAP + 模板 + 状态栏纪律', 0],
  ['_chk_hires_and_click.mjs', [], '★ 放大用大图（.png 优先）＋ 自包含点击（六项）', 0],
  ['_chk_click_paths.mjs', [], '★ 立绘点击四条路断言（内联onclick／事件钩子／宿主委托／mousedown／自检行）', 0],
  ['_chk_shell_frontend.mjs', [], '★ 迷你壳能被酒馆助手识别为前端代码块（html>/<head>/<body 命中 ⇒ 才会建 iframe）', 0],
  ['_chk_shell_syntax.mjs', [], '★ 壳的 bootstrap 语法／结构体检（编译＋桩环境试跑＋重试路径）', 0],
  ['_ef_true_sequence.mjs', [], '★ 复现真机时序：壳先跑→脚本后到→面板须被填上（含日志两行）', 0],
  ['_chk_panel_artifact.mjs', [], '面板产物终点断言（33 项：替换串瘦身/围栏壳/双轨制/样式内联/容器查询）', 0],
  ['_chk_stage_drive.mjs', [], '★【阶段驱动】结构＋独立政策表 12 例＋fail-closed＋源模板与卡内 content 对照（取代旧 _chk_ejs_stage）', 0],
  ['_chk_freefield_gate.mjs', [], '★ 自由字段一致性闸：未到的世界事件不许写成正在发生／传闻计划放行／日期不可信拒（行为 22 项）', 0],
  ['_chk_derive_ledger.mjs', [], '★ 派生来源账本＋事务撤销：出场才触发／写明确归属／来源清零才撤／人工来源不撤（行为 25 项）', 0],
  ['_chk_status_missing.mjs', [], '★ 缺状态栏分支·**真跑**（卡内脚本进 vm）：已知有效日期/累计不被改写、<时间> 不覆盖台账、正常路径仍推进', 0],
  ['_chk_ejs_native.mjs', [], '★ 原生 EJS（卡实际运行的 ST-Prompt-Template 自带那份）渲染卡内 id7 content 的 12 例，并与最小 EJS 逐字节对照', 0],
  ['_chk_payload.mjs', [], '★ 交付物载荷一致性：PNG 的 chara 与 ccv3 两份载荷逐项比 JSON（顶层/data/条目全字段/id 顺序/脚本/depth_prompt）', 0],
  ['_chk_panel_regex_cases.mjs', [], '状态栏正则边界用例（13 项：截断命中/不吞正文/双轨制同一条）', 0],
  ['_ef_panel_fill.mjs', [], '★ 浏览器里跑真脚本：取原文→mount→读真实 DOM（13 项，含"骨架无样例值"）', 0],
  ['_ef_lightbox_click.mjs', [], '★ 浏览器里真点立绘（跨源 window 恶劣环境：委托监听仍须绑上、灯箱须打开）', 0],
  ['_ef_lightbox_flip.mjs', [], '★ 浏览器里真开灯箱验「同阶段翻面」：按钮 2 个／计数 n/N／› 与 ←→ 都能翻／**只开一次箱**', 0],
  ['_chk_contrast.mjs', [], '★ 面板小字对比度（WCAG，底取噪点峰值 #2f3031；低于 4.5:1 就红）', 0],
  ['_chk_contrast.mjs', ['--menu'], '★ 身份菜单卡（另一份 CSS，写在 _build_card.js 的 MENU_HTML 里）小字对比度', 0],
  ['_probe_cast_styles.mjs', [], '★ 在场要角的 `.xds-*` 真有样式（computed 色 ≠ 宿主继承）＋ 未登记角色直接落 SVG', 0],
  ['_verify_panel_pack.mjs', [], '面板脚本打包校验（19 项：容器参数/常量单份/容器查询/无遗留占位符）', 0],
  ['_test_hud_locatemes.mjs', [], 'XsdHUD 取原文／溯源桩测（4 例：frameElement／DOM 扫描／直接命中）', 0],
  ['_chk_no_mvu.mjs', [], '拆 MVU 基线：39 项（含条目数 239、FNE 全文、MNE 未进卡）', 0],
  ['_chk_layering.mjs', [], '★ 分层关卡（秋风 22:25）：演绎／导演指引不落 D1／D0；状态栏三块连成一组；心智姿态在 CHAR 级', 0],
  ['_chk_dp_adult.mjs', [], 'depth_prompt 第九节「成人场景白描规范」：23 项', 0],
  ['_chk_anchor_gate.mjs', [], '锚点闸门：地点词不误报、真事件仍命中（5 例）', 0],
  ['_chk_defect_four.mjs', [], '四条状态缺陷行为负例（校验后置／隐式继承只建议／证据收紧＋否定闸／缺状态栏不覆写日期）', 0],
  ['_chk_mingqi_prereq.mjs', [], '名器成形硬前置（持有者须先破身；同轮破身算数；楚灵夜需后窍；灵犀同心需双姝两人）', 0],
  ['_chk_portrait_thumbs.mjs', [], '立绘小图落地核对（读面板真实配置：路径表＋扩展名顺序，逐个 id 验小图）', 0],
  ['_chk_prompt_offline.mjs', [], '离线提示词复核：52 条 @@if 求值 + 净化正则 depth 行为', 0],
  ['_chk_budget.mjs', [], '每回合固定注入预算（常驻 + depth_prompt + 卡字段）', 0],
  ['_verify_tavern_readback.mjs', ['--wait', '8'], '★ 铁律 38：读回酒馆**卡内字段**（depth_prompt／条目数／翻面·大图链），8 秒后复查未被回写', 0],
];

const SEARCH_DIRS = ['.', 'tools/checks', 'tools/pipeline', 'tools/previews', 'tools/debug', '卡片脚本'];
function resolveFile(file) {
  for (const dir of SEARCH_DIRS) {
    const p = dir === '.' ? file : `${dir}/${file}`;
    if (existsSync(p)) return p;
  }
  return null;
}

const results = [];
for (const [file, args, desc, expect] of STEPS) {
  const resolved = resolveFile(file);
  if (!resolved) { results.push({ file, desc, status: 'MISSING' }); continue; }
  const started = Date.now();
  let out = '';
  let code = 0;
  try {
    out = execFileSync(NODE, [resolved, ...args], { encoding: 'utf8', timeout: 300000, maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    code = typeof e.status === 'number' ? e.status : 1;
    out = String(e.stdout ?? '') + String(e.stderr ?? '');
  }
  const tail = out.trim().split('\n').filter(Boolean).slice(-2).join(' ／ ').slice(0, 150);
  results.push({ file, desc, status: code === expect ? 'PASS' : 'FAIL', code, ms: Date.now() - started, tail });
}

console.log('【全量验收·只读】' + new Date().toLocaleString('zh-CN') + (BUILD ? '（含显式候选构建到隔离暂存）' : '（未构建：加 --build 才会构建，且只写隔离暂存）'));

/* 显式候选构建：--build 时先构建到隔离暂存，**不碰交付目录** */
if (BUILD) {
  console.log('\n【显式候选构建】_build_card.js --stage ' + STAGE_DIR + ' （只写隔离暂存，不发布）');
  try {
    const o = execFileSync(NODE, ['_build_card.js', '--stage', STAGE_DIR], { encoding: 'utf8', timeout: 600000, maxBuffer: 64 * 1024 * 1024 });
    console.log('  ✔ ' + (o.trim().split('\n').filter(Boolean).slice(-1)[0] || '构建完成'));
  } catch (e) {
    console.log('  ✘ 候选构建失败：' + String(e.stdout || e.message).slice(-300));
    process.exit(1);
  }
}
for (const r of results) {
  const icon = r.status === 'PASS' ? '✔' : r.status === 'MISSING' ? '？' : '✘';
  console.log(`  ${icon} ${r.file}${r.status === 'PASS' ? '' : `（exit ${r.code ?? '-'}）`} — ${r.desc}`);
  if (r.tail) console.log(`      ↳ ${r.tail}`);
}
const bad = results.filter((r) => r.status !== 'PASS');
console.log(`\n${results.length - bad.length}/${results.length} 个脚本通过` + (bad.length ? `；失败：${bad.map((b) => b.file).join('、')}` : ''));

if (PUSH && !bad.length) {
  console.log('\n【推卡】_push_card.mjs --apply → _clean_cards.mjs --apply');
  for (const script of ['_push_card.mjs', '_clean_cards.mjs']) {
    try {
      const o = execFileSync(NODE, [script, '--apply'], { encoding: 'utf8', timeout: 300000, maxBuffer: 64 * 1024 * 1024 });
      const keep = o.split('\n').filter((l) => /已重建|不一致|改动|已执行|同名卡|✅/.test(l)).slice(-3).join(' ／ ');
      console.log(`  ✔ ${script} — ${keep.slice(0, 220)}`);
    } catch (e) {
      console.log(`  ✘ ${script} 失败：${String(e.message).slice(0, 160)}`);
      bad.push({ file: script });
    }
  }
}
if (bad.length) process.exit(1);
console.log('\n✅ 全绿');
