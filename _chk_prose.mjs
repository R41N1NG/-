#!/usr/bin/env node
/**
 * _chk_prose.mjs —— **文风硬关卡**（2026-09-28 第四十七轮）
 *
 * 群里那条要求点得很准：「**ds 的问题不是八股词，是句式和书写结构**」。所以本关卡两条腿：
 *   ① **词表**：八股词／垫词／虚态量词／动量词／神态短句／抽象喻体／冗杂标签／破折号总结／口播腔／同义堆叠；
 *   ② **节奏量尺**：逗号密度／句号密度／平均句长 —— 治的正是"句子结构"。
 *
 * ★ 判据**不是死阈值，而是相对原文**（基准由 `_calib_prose.mjs` 量原文全篇得出，见 `_prose_baseline.json`）：
 *     词表：某类命中密度 > **原文同类的 2.5 倍**（且 ≥1.0/千字）⇒ 红
 *     节奏：逗号 < 原文 ×0.72 ／ 句号 > 原文 ×1.45 ／ 平均句长 < 原文 ×0.68 ⇒ 红
 *   为什么必须这样（第一版的教训）：
 *     · 原文自己就写「一道火红身影」「一丝缝隙」 ⇒ 词表零容忍会**误伤原文照录**；
 *     · `【心智姿态】`那种**标签行条目体**、开场白里的 `<Status_block>` 本来就不是散文 ⇒
 *       拿逗号密度去量它们必然全红。
 *   ⇒ 所以：**先剥结构块**（Status_block／IdentityMenu／角色N），**再按"平均行长"分散文类与条目体**，
 *      节奏只量散文类；词表一律按"相对原文"判。
 *
 * ★ **存量挂账、增量卡死**：卡里已有的欠账记在 `_prose_owed.json`（由 `--snapshot` 生成），
 *   它们只报警不拦；**不在欠账里的新问题一律拦住**（构建脚本据此拒绝写入）。
 *
 * 用法：
 *   node _chk_prose.mjs [卡.json]              判关卡（有新增问题 ⇒ exit 1）
 *   node _chk_prose.mjs [卡.json] --snapshot   把当前全部问题写成欠账（**只在明确要挂账时用**）
 *   node _chk_prose.mjs [卡.json] --all        把欠账也逐条打出来
 * 退出码：0 通过（欠账不算不通过）／1 有**新增**问题／2 环境问题
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const argv = process.argv.slice(2);
const SNAP = argv.includes('--snapshot');
const SHOWALL = argv.includes('--all');
/* `--text <文件>`：**校验任意一段文本**（写的时候就先自查，不用等整卡构建）。
 *   ⚠️ 只查这一段，**不碰欠账**（欠账是"整卡存量"的概念）；句式比照查不误（不看 600 字门槛）。 */
const TI = argv.indexOf('--text');
const TEXT_FILE = TI >= 0 ? argv[TI + 1] : '';
const FILE = TEXT_FILE || argv.find((a) => !a.startsWith('--')) || '仙姝墮-角色卡（全书群像）.json';
const BASE_PATH = existsSync('_prose_baseline.json') ? '_prose_baseline.json' : (existsSync('src/assets_data/_prose_baseline.json') ? 'src/assets_data/_prose_baseline.json' : '');
if (!BASE_PATH) { console.error('缺 _prose_baseline.json —— 先跑 node _calib_prose.mjs'); process.exit(2); }
const BASE = JSON.parse(readFileSync(BASE_PATH, 'utf8'));
const OWED_PATH = existsSync('_prose_owed.json') ? '_prose_owed.json' : (existsSync('src/assets_data/_prose_owed.json') ? 'src/assets_data/_prose_owed.json' : '');
const OWED = OWED_PATH ? JSON.parse(readFileSync(OWED_PATH, 'utf8')) : { 欠账: [] };
/* 原文语料（只给 `--text` 模式的"套话检测"用） */
const ORIG_PATH = 'E:\\火狐下载\\[仙姝墮] 1-49+番外 作者：_肉山佛.txt';
const ORIG = TEXT_FILE && existsSync(ORIG_PATH)
  ? readFileSync(ORIG_PATH, 'utf8').replace(/^[\s\u3000　]+/gm, '').replace(/\n/g, '')
  : '';
const owedKeys = TEXT_FILE ? new Set() : new Set((OWED.欠账 || []).map((x) => x.key));

/* 与 _calib_prose.mjs **同一张词表**（改一边，两边一起改） */
const LEX = [
  ['时间虚指', /(?:就在|在|于)?(?:那一瞬间|这一瞬间|那一刹那|这一刻|那一刻|下一秒|下一瞬|下一刻|转瞬之间|电光石火间|一时之间|一时间|刹那间|倏然间|须臾之间)/g],
  ['程度垫词', /(?:整个人(?:微微|猛地|不由得|不由|不禁)?|不由得|情不自禁地?|忍不住地?|下意识地?|鬼使神差|无端地?|莫名地?|极其|近乎于?|极度)/g],
  ['虚态量词', /(?<![第万同一初每这那一])[一二两三四五六七八九十](?:丝|抹|股|缕|道|阵|团|汪|截|记|丛|分)(?![\u4e00-\u9fa5]*?(?:步|计|律|同|心|起|直|切|贯|体|定))/g],
  ['动量词动作', /(?:(?:看|瞥|扫|望|瞅)了?[一二两三]眼|(?:冷哼|冷笑|轻笑|轻叹|闷哼|怒喝|娇嗔)了?[一二两三]?声|(?:退后|后退|后撤|踏前|抢前|跨前|逼近)了?[一二两三四五六七八九十]步|(?:拔地|腾空)[一二两三四五六七八九十]丈|(?:愣|顿|停|呆|迟疑)了?[一二两三]?下)/g],
  ['神态短句', /(?:嘴角(?:勾起|扬起|泛起|浮起)|眼中(?:闪过|掠过|划过)|眼底(?:闪过|掠过)|眉头(?:微蹙|微皱)|(?:微微|轻轻|浅浅)地?(?:一笑|笑|皱眉)|(?:语气|语调|尾音|声音)(?:里|中|间)?(?:带着|透着|含着|染上))/g],
  ['抽象喻体', /(?:如同|仿佛|宛如|好似|像是)(?:被)?(?:命运|宿命|灵魂|审判|深渊的|某种不可|无形的枷锁|残酷的真相|无声的誓言|一场|一次注定)/g],
  ['冗杂标签', /(?:他|她|对方)?(?:说道|说道：|开口道|出声道|低声道|轻声说道|沉声道)(?=[：:“」])/g],
  ['破折号总结', /(?:^|\n)\s*——[^\n]{2,40}(?:。|！|……)\s*(?:\n|$)/g],
  /* ⚠️ 口播腔两条曾误伤：① 对话里的「反正」是正常口语（已从表里去掉）；
   *    ② 「把话说到**说到底**」会被子串命中 ⇒ 要求「说白了／说到底」出现在**小句开头**。 */
  ['现代口播腔', /(?:^|[\n。！？；，]|「)(?:说白了|说到底)|你(?:手里|身上)有(?:什么|哪些)|你的性子|你怎么想|要不要我|总之你|记住一点/g],
  ['同义堆叠', /(?:剧烈的|强烈的|猛烈的|极致的|难以言喻的|无法言说的)(?:、|，)?(?:剧烈的|强烈的|猛烈的|极致的|难以言喻的|无法言说的)?(?:的)?(?:快感|感觉|刺激|情绪|冲动)/g],
  /* ★ 以下三类是**质检员两轮复检逼出来的**（2026-09-28）——
   * 它们证明"词表 + 6-gram 逐字重合"还不够：**字面 0 命中，套路全中**，
   * 而这三样恰恰**完全可自动量化**。 */
  ['叠词量词', /一([圈寸层丈步节片缕])一\1/g],
  ['套话骨架·咬唇牙关', /(?:牙关|牙齿|下唇|嘴唇|唇瓣)[^，。；！？\n]{0,4}(?:咬|抿)/g],
  ['套话骨架·喉间溢出', /(?:喉间|喉咙|喉头|齿缝)[^，。；！？\n]{0,6}(?:溢出|挤出|漏出|逸出|咽|漏)/g],
  ['套话骨架·咽下那口气', /(?:把|将)[^，。；！？\n]{0,4}(?:那|这)[^，。；！？\n]{0,2}(?:口气|声|呻吟|呜咽|喘息)[^，。；！？\n]{0,4}(?:咽|压)下/g],
];
const LEX_FLOOR = 1.0;      // 每千字下限（避免原文某类≈0 时把阈值压成 0）
const LEX_MULT = 2.5;       // 超过原文同类的多少倍算红
const BAND = { comma: 0.72, period: 1.45, sent: 0.68 };

/* 剥结构块：状态块／身份菜单／角色子块都不是散文 */
const strip = (t) => String(t)
  .replace(/<Status_block>[\s\S]*?<\/Status_block>/gi, ' ')
  .replace(/<IdentityMenu\s*\/>/g, ' ')
  .replace(/<IdentityPick[^>]*\/>/g, ' ')
  .replace(/<角色\d+>[\s\S]*?<\/角色\d+>/g, ' ')
  .replace(/`{3,}[\s\S]*?`{3,}/g, ' ');

const UNITS = [];
const push = (from, text, isProseCandidate) => { const t = String(text || ''); if (t.trim()) UNITS.push({ from, raw: t, text: strip(t), prose: !!isProseCandidate }); };
if (TEXT_FILE) {
  push('文本:' + TEXT_FILE, readFileSync(FILE, 'utf8'), true);      // 单段文本：当散文样本量
} else {
  const card = JSON.parse(readFileSync(FILE, 'utf8').replace(/^\uFEFF/, ''));
  const d = card.data || card;
  push('description', d.description, false);
  push('scenario', d.scenario, false);
  push('first_mes', d.first_mes, true);
  push('mes_example', d.mes_example, false);        // 对话样本，按格式样本处理（不量节奏）
  (d.alternate_greetings || []).forEach((g, i) => push('alternate_greetings[' + i + ']', g, true));
  if (d.extensions && d.extensions.depth_prompt && d.extensions.depth_prompt.prompt) push('depth_prompt', d.extensions.depth_prompt.prompt, false);
  const NARR = /【剧情】|【人物】|【名器·阶段】|【名器·简介】|【心智姿态】/;
  ((d.character_book || {}).entries || []).forEach((e, i) => {
    const name = String(e.comment || e.name || 'entry#' + i);
    if (/净化/.test(name)) return;
    const c = String(e.content || '');
    if (c.includes('〔质检豁免〕')) return;
    push('书[' + i + '] ' + name, c, NARR.test(name));
  });
}

const problems = [];
const INFO = [];                 // 散文样本的读数（只打印，不拦）
const clip = (s, n = 30) => s.replace(/\s+/g, ' ').slice(0, n);
for (const u of UNITS) {
  const n = u.text.length;
  if (!n) continue;
  /* ① 词表（相对原文）
   *   ⚠️ 加**最小样本护栏**：密度在 200–400 字的短条目上方差极大 ——
   *      实测「一股电流」「一道虚影」「五道身影」这类**自然搭配**会在 278 字的条目里算出 7/千字而被误判。
   *      ⇒ 短条目（<800 字）要求**绝对 ≥6 次**才算习惯；长条目才按密度判。 */
  for (const [cls, re] of LEX) {
    const hits = (u.text.match(re) || []).length;
    if (!hits) continue;
    const baseDensity = BASE.词表每千字[cls] || 0;
    /* ★ **零容忍类**：原文基本不这么写（密度 < 0.1/千字）的毛病 —— 破折号总结／现代口播腔／抽象喻体 ——
     *   **命中 1 次即红**。为什么必须单列：上一版"≥2 次 + 密度"的护栏把
     *   赵无忧开场楼那句「——三日后山门汇合……」**放过去了**（1 次 / 1929 字 = 0.52/千字 < 下限 1.0）。
     *   而这一句恰恰同时犯了「——」起头、无关联「而」、自造总结三样。⇒ 原文一次都不写的东西，写一次就是习惯的开端。 */
    if (baseDensity < 0.1) {
      const m0 = re.exec(u.text);
      problems.push({ key: u.from + '|词|' + cls, kind: '词', from: u.from, cls, val: hits, limit: 1,
        text: cls + ' ×' + hits + '（**零容忍类**：原文 ' + baseDensity + '/千字，一次都不这么写）'
          + (m0 ? ' …' + clip(u.text.slice(Math.max(0, m0.index - 8), m0.index + 34)) + '…' : '') });
      continue;
    }
    if (hits < 2) continue;
    if (n < 800 && hits < 6) continue;
    const per = hits / n * 1000;
    const limit = Math.max(LEX_FLOOR, baseDensity * LEX_MULT);
    if (per > limit) {
      const m = re.exec(u.text);
      problems.push({ key: u.from + '|词|' + cls, kind: '词', from: u.from, cls, val: per, limit,
        text: cls + ' ×' + hits + '（' + per.toFixed(2) + '/千字 > 阈值 ' + limit.toFixed(2) + '）' + (m ? ' …' + clip(u.text.slice(Math.max(0, m.index - 10), m.index + 30)) + '…' : '') });
    }
  }
  /* ①b ★ **原文套话检测（n-gram 逐字重合）** —— 只在 `--text` 模式跑：
   *   为什么：主人要"写东西**不准抄原文**"。而**词表关卡抓不到抄** ——
   *   我写的那段 200 字，八股词命中 0，但末尾那句是把原文 L5450「带着压抑的闷哼从她喉间溢出。她猛地咬住下唇」
   *   三要素换序拼出来的；「喉间溢出一声」在原文出现 11 次、「咬住下唇」32 次。
   *   ⇒ 用 **6-gram 逐字重合**当尺：命中的最长连续串 ≥8 字，或命中数 ≥4，就判"在拼原文"。
   *   ⚠️ 只对**自写段落**用（`--text`）；卡里的开场白／【剧情】条目本来就是**原文照录**，那是设计要求，不在此列。 */
  if (TEXT_FILE && ORIG) {
    const grams = [];
    for (let i = 0; i + 6 <= u.text.length; i += 1) grams.push(u.text.slice(i, i + 6));
    const hitGrams = grams.filter((g) => ORIG.indexOf(g) >= 0);
    let maxRun = 0, maxAt = -1;
    for (let i = 0; i < u.text.length; i += 1) {
      let len = 6;
      while (i + len <= u.text.length && ORIG.indexOf(u.text.slice(i, i + len)) >= 0) len += 1;
      const best = len - 1;                       // 最后一次成功的长度
      if (best > maxRun) { maxRun = best; maxAt = i; }
    }
    if (maxRun >= 8 || hitGrams.length >= 4) {
      problems.push({ key: u.from + '|套话', kind: '套话', from: u.from, cls: '原文套话', val: hitGrams.length, limit: 4,
        text: '原文套话：6-gram 命中 ' + hitGrams.length + ' 处｜**最长连续逐字重合 ' + maxRun + ' 字**'
          + (maxAt >= 0 ? '（…' + clip(u.text.slice(Math.max(0, maxAt - 6), maxAt + maxRun + 6)) + '…）' : '')
          + ' —— 判据：最长 ≥8 字 或 命中 ≥4 处 ⇒ **这是在拼原文，不是仿写**' });
    }
  }

  /* ② 句式结构（**只量散文样本**：开场白）——
   *    第一版用"逗号密度／句长"直接对原文全篇均值，结果**对话密集的段落天然吃亏**（原文全篇均值被长描写段拉高了）。
   *    ⇒ 换成**尺度无关**的结构指标：**句号/逗号比**。原文 22.86/52.64 = 0.434；
   *      "把本该一句读完的长句剁成一句一顿"必然让这个比值翻倍 —— 这正是 DS 最典型的毛病。 */
  const commaN = (u.text.match(/[，,]/g) || []).length;
  const periodN = (u.text.match(/[。！？]/g) || []).length;
  const isProse = /^(first_mes|alternate_greetings\[|文本:)/.test(u.from) && (!!TEXT_FILE || n >= 600);
  if (!isProse || commaN < 5) continue;
  const ratio = periodN / commaN;
  /* 线＝**原文最散的那一章 × 1.15**（实测第十章 0.624 ⇒ 0.718）：
   *   拿全篇均值（0.434）当线会**冤枉对话密集的段落**（原文自己的第十章就有 0.624）；
   *   拿"最差章 ×1.15"当线，则"比原文最散的章还散 15%"才算**真·剁短句**。
   *   对照：`我的写作缺陷记录.md` 里用户点名那句（逗号 24.5/千字）折算比值 1.1+ ⇒ 必红。 */
  const chapMax = (BASE.章级句号逗号比 && BASE.章级句号逗号比.最高) || 0.624;
  const ratioLimit = +(chapMax * 1.15).toFixed(3);
  const sents = u.text.split(/[。！？]/).filter((s) => s.trim().length);
  const sent = sents.reduce((a, s) => a + s.length, 0) / Math.max(1, sents.length);
  if (ratio > ratioLimit) {
    problems.push({ key: u.from + '|句式', kind: '句式', from: u.from, cls: '句式', val: ratio, limit: ratioLimit,
      text: u.from + '（' + n + ' 字）⇒ 句号/逗号 = ' + ratio.toFixed(3) + ' > ' + ratioLimit.toFixed(3)
        + '（原文最散的一章 ' + chapMax + '×1.15）——句子被剁短了；平均句长 ' + sent.toFixed(1) });
  }
  INFO.push({ from: u.from, n, comma: (commaN / n * 1000).toFixed(1), period: (periodN / n * 1000).toFixed(1), sent: sent.toFixed(1), ratio: ratio.toFixed(3) });

  /* ②b ★ **实物比喻缺失**（文风规范规则 2：每 200–300 字必须落一个「如同／仿佛」＋看得见摸得着的喻体）
   *   规则 2 是**下限要求**，所以"没有比喻"本身就是违规 —— 可自动查：整段一个「如同／仿佛」都没有 ⇒ 红。
   *   ⚠️ 只查**自写散文样本**（`--text` 或开场白）。
   *   ⚠️ 阈值分档：`--text`（专门送进来审的自写段落）**150 字**就查 ——
   *      质检员指出过：卡内 189 字的小样本若按 200 字门槛，"比喻缺失"这条**根本不会被执行**，于是"硬关卡通过"变得没有含金量。 */
  const simFloor = TEXT_FILE ? 150 : 200;
  if (/^(first_mes|alternate_greetings\[|文本:)/.test(u.from) && n >= simFloor) {
    const sim = (u.text.match(/如同|仿佛/g) || []).length;
    if (sim === 0) {
      problems.push({ key: u.from + '|比喻', kind: '比喻', from: u.from, cls: '实物比喻缺失', val: 0, limit: 1,
        text: '实物比喻缺失：' + n + ' 字里「如同／仿佛」**0 个** —— 文风规范规则 2 是**下限**（每 200–300 字一个，喻体必须看得见摸得着）。'
          + '⚠️ 注意用「像」不算数：规范只准「如同」「仿佛」。' });
    }
  }
}

const fresh = problems.filter((p) => !owedKeys.has(p.key));
const owedNow = problems.filter((p) => owedKeys.has(p.key));

console.log('【文风硬关卡】' + FILE);
console.log('  基准（原文 ' + BASE.字数 + ' 字实测，' + BASE.校准时间 + '）：平均句长 ' + BASE.节奏.平均句长
  + '｜逗号 ' + BASE.节奏.逗号每千字 + '/千字｜句号 ' + BASE.节奏.句号每千字 + '/千字');
console.log('  文本单元 ' + UNITS.length + ' 个｜本次问题 ' + problems.length + ' 处（新增 ' + fresh.length + '｜存量欠账 ' + owedNow.length + '）\n');

if (fresh.length) {
  console.log('  ✘ **新增问题 ' + fresh.length + ' 处（必须改）**：');
  for (const p of fresh) console.log('     · ' + p.text);
} else {
  console.log('  ✔ 没有新增问题');
}
if (owedNow.length) {
  console.log('\n  ⚠️ 存量欠账 ' + owedNow.length + ' 处（只报警、不拦；**只减不增**）：');
  const show = SHOWALL ? owedNow : owedNow.slice(0, 6);
  for (const p of show) console.log('     · ' + p.text);
  if (!SHOWALL && owedNow.length > show.length) console.log('     …（另有 ' + (owedNow.length - show.length) + ' 处，加 --all 看全）');
}

if (INFO.length) {
  console.log('\n  ℹ 散文样本读数（信息项，不拦）：');
  for (const x of INFO) console.log('     · ' + x.from + '（' + x.n + ' 字）逗号 ' + x.comma + '｜句号 ' + x.period + '｜句长 ' + x.sent + '｜句号/逗号 ' + x.ratio);
}

if (SNAP) {
  const merged = [...new Map([...OWED.欠账 || [], ...problems.map((p) => ({ key: p.key, text: p.text }))]
    .map((x) => [x.key, x])).values()];
  writeFileSync('_prose_owed.json', JSON.stringify({ 更新时间: new Date().toLocaleString('zh-CN'), 说明: '存量欠账（只减不增）；新增问题由 _chk_prose.mjs 拦截', 欠账: merged }, null, 2), 'utf8');
  console.log('\n📝 已把 ' + merged.length + ' 条写进 `_prose_owed.json`（存量挂账）');
  process.exit(0);
}
if (fresh.length) { console.log('\n❌ 硬关卡未通过 —— **按规矩：不许写入卡**。改完重跑。'); process.exit(1); }
console.log('\n✅ 硬关卡通过（新增 0）');
