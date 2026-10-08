/* ⚠️ 本文件由 _pack_panel_script.mjs 自动生成，**不要直接手改**。
 *    要改逻辑 → 改 卡片脚本/_src/状态栏面板.模板.js
 *    要改样式 → 改 _card_panel_v4.css / _card_panel_v4.skeleton.html（或 _preview_H.html 后重跑拆解）
 *    本次重打包：scratch/_repack_panel.mjs（三个 base64 大件沿用上一版，逻辑取新模板）
 *    生成时间：2026/10/7 00:52:13
 *    架构照《制卡规范 v2.0》§C 卷：正则只出迷你壳 → 本脚本 getMessageData → mount(el, raw, msgId) */
/* ═══════════════════════════════════════════════════════════════════════════
 * 仙姝墮 · 态势 HUD（卡内脚本 · **模板** · 双端适配版 · 2026-10-06）
 * ---------------------------------------------------------------------------
 * 架构照《制卡规范 v2.0》§C 卷（范例卡《大乾风华录》同构）：
 *   ① 显示层正则把 `<Status_block>…</Status_block>` 换成**迷你壳**（markdown 围栏 ＋
 *      `#content` 占位 ＋ bootstrap）—— 替换串 ~1.6 KB，**不含 CSS/骨架/字体**
 *   ② 壳里的 bootstrap 跨 realm 找 `window.XsdHUD` → `getMessageData()` 反查原文
 *      → `mount(el, raw, msgId)`
 *   ③ 本脚本：`ensureStyleInjected(doc)` 注入样式（**零外部资源**，字体是内联 data URI）
 *             → 骨架 → 填值 → 挂进容器
 *
 * ⚠️ 本文件是**模板**：三个占位符由 `_pack_panel_script.mjs` 换成 base64 字符串，
 *    生成真正进卡的 `卡片脚本\状态栏面板.js`。**改逻辑改这里**，别改生成物。
 * ═══════════════════════════════════════════════════════════════════════════ */

/* 面板 CSS（build 期注入） */
const XSD_CSS = '__XSD_PLACEHOLDER__';
/* 面板骨架（build 期注入；静态可用 ⇒ 脚本失败也不白屏） */
const XSD_SKELETON = '__XSD_PLACEHOLDER__';
/* 楷体子集（LXGW WenKai Medium · OFL 1.1，485 字形 · 98.8 KB woff2 · data URI ⇒ 零外链） */
const XSD_FONT_B64 = '__XSD_PLACEHOLDER__';

/* ══════════════════════════════════════════════════════════════════════
 * 《仙姝墮》· 状态栏面板填充   v2.3   2026-09-27（照抄外卡《大乾风华录 Ver2.0》的「被渲染时调用」：
 *   新增全局入口 __xsdFillPanel(mesid, rawText)，由卡内正则产出的自包含 iframe 在加载时回调）
 * ----------------------------------------------------------------------
 * 相对归档 v1.2 的**关键修复**（v2.0 起的结论，别退回去）：
 *   旧版用 `document.querySelector('.mes[mesid]')` 定位消息 —— 但卡内脚本跑在
 *   酒馆助手的 **iframe（about:srcdoc）** 里（依据：JS-Slash-Runner
 *   `src/panel/script/iframe.ts` 把脚本包进 `<script type="module">`），
 *   **iframe 自己的 document 里一条消息都没有** ⇒ 每次填充都静默失败。
 *   这就是当年「面板 HTML 渲染出来了、9 个字段却永远全空」的根因（交接 6.0b 里那句
 *   「没查清的执行上下文」，现在查清了）。所有 DOM 查询都走 `DOC()`（优先 window.parent.document）。
 *
 *  v2.3 触发架构（照抄外卡）：
 *   **主路径 ＝ 渲染触发**。显示层正则「仙姝墮·状态栏」把 `<Status_block>…</Status_block>`
 *   换成「面板 HTML ＋ 隐藏原文副本 `<pre hidden data-xds-src>` ＋ 自包含 iframe」；
 *   iframe 在 load 时自己从宿主消息里取出 `mesid` 与原文，回调 `window.parent.__xsdFillPanel(mesid, 原文)`。
 *   所以下面那三个 eventOn 钩子（CHARACTER_MESSAGE_RENDERED／USER_MESSAGE_RENDERED／CHAT_CHANGED）
 *   与启动时的 `setTimeout(fillAll, 900)` **都只是冗余兜底** —— 拔掉 eventOn，填充照样工作。
 *   渲染触发那条链同时也会叫状态机（`__xsdStateTick`），两个脚本互不依赖、各自可缺。
 *
 * v2.3 新增：**立绘子系统**（照抄外卡《大乾风华录 Ver2.0》的立绘链，逐条改掉它的 11 个坑）。
 *   入口一条：`renderCast()` 里每张「人」区微卡左侧插 `xsdPortraitHtml()`。
 *   名字 → `XSD_PINYIN`（§〇M 立绘命名表 16 行／18 个人名）→ 拼音 id
 *   → 候选链（本地 3 目录 × `.webp`/`.png` = 6 条 ＋ catbox 云端 1 条）
 *   → 写进 `data-sources`(JSON, 已 esc) ＋ `data-src-idx="0"`（**空链也写**，外卡 P10）
 *   → img 404 由 `xsdWalkDown()` 逐级换源 → 链尽先 `onerror=null` 再落国风 SVG 剪影印章。
 *   点立绘 → `xsdOpenLightbox()` 全屏大图（覆盖层点击关／ESC 关，**关闭时统一摘光监听**，外卡 P2）。
 *   配色走 §〇E·E6 分区（闻观语墨绿／孤月冷蓝白／叶红缨赤红／楚灵夜暖白嫩粉／其余中性色）；
 *   SVG 文本一律 `xsdXmlEsc()`（外卡 P7：不转义 `&`/`<` 会让占位图自己也裂）。
 *   ⚠️ 云表 `XSD_CLOUD_URLS` 目前是**空锚点**：图还没传，此时面板只显示 SVG 剪影（不是 bug）。
 *   ⚠️ 本文件仍是**唯一**需要改的文件；`_build_card.js` 一行未动 ⇒ 面板 CSS 块里没有立绘样式，
 *      所以立绘/微卡的样式走**行内 cssText**（见 XSD_CC_* / XSD_PW_STYLE）。
 *      好处顺带一个：JS 没跑时 `style` 属性不存在 ⇒ 面板自动退化成纯文字（降级壳）。
 *
 * 另两条沿用的结论（6.0b）：
 *   ① 消息里的 `<script>` 会被 DOMPurify 剥掉 ⇒ 填充逻辑**只能**放在卡内脚本里
 *      （所以我们把唯一的例外——引导 iframe 的脚本——塞进 `iframe[srcdoc]`：那是**另一份文档**，不经消毒）；
 *   ② 消息里的 class 会被改名成 `custom-` 前缀 ⇒ 定位一律靠 `data-xds*` 数据属性。
 * ══════════════════════════════════════════════════════════════════════ */

const TAG = '[仙姝墮·面板]';
let debug = false;
let xsdMobileDisposed = false;
const xsdRelicDocBindings = new Map();
const xsdUiInlineNodes = new WeakSet();
// 清理同版本脚本重载留下的原生监听和观察器。
try {
  const seen = new Set();
  for (const get of [() => window, () => window.parent, () => window.top]) {
    try { const w = get(); const fn = w && w.__xsdMobileCleanup;
      if (typeof fn === 'function' && !seen.has(fn)) { seen.add(fn); fn(); }
    } catch (e) { /* 跨源 */ }
  }
} catch (e) { /* 忽略 */ }
function xsdMouseHoverEvent(e, el) {
  try {
    if (e && e.pointerType && e.pointerType !== 'mouse') return false;
    if (e && e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return false;
    const w = el && el.ownerDocument && el.ownerDocument.defaultView || window;
    return !w.matchMedia || w.matchMedia('(hover: hover) and (pointer: fine)').matches;
  } catch (err) { return false; }
}

/** 标签 → 面板里的 data-xds 键（与 PANEL_HTML 一致）
 *  ⚠️ 2026-09-27：「冰心泪」已按用户要求从状态栏移除（它不是值得每回合占位的字段）。
 *  ⚠️ 2026-09-27（扩栏 v2.1）：新增 暗处／身份／目标 三栏。
 *  ⚠️ 2026-09-27（扩栏 v2.2）：照抄外卡《大乾风华录 Ver2.0》补 历时／天气／环境／线索／近闻／
 *     远闻／危机 七栏，另加 `cast`（在场角色子块容器，对应外卡的 extra_char_N）。
 *  ⚠️ **「进度」一栏刻意不进这张表** —— 它在正文里、供模型下一回合接戏，但面板上不显示
 *     （用户要求「要，但是隐藏，仅 ai 可见」）。这张表就是那个「隐藏」开关，别手滑加上去。
 *  ⚠️ 键的声明顺序＝面板上的显示顺序（**不用**状态栏里一级标签的顺序：面板按「场／我／人／局」分区排）。 */
const FIELD_MAP = {
  // 场
  loc: '地点', time: '时间', elapsed: '历时', weather: '天气', env: '环境',
  who: '在场', dark: '暗处',
  // 我
  id: '身份', realm: '修为', state: '状态', goal: '目标',
  // 人
  cast: '在场角色',
  // 局
  sit: '局势', clue: '线索', near: '近闻', mid: '远闻', crisis: '危机', rel: '关系刻度',
};

/** 不走通用「标签→格子」匹配的格子（由专用函数填充，见 renderCast）
 *  ⚠️ `cast`（在场角色）**必须**列在这里：通用匹配是「互相包含」，
 *     而 `<在场>` 与「在场角色」互相包含 ⇒ 不挡的话「在场」那行会把角色区块当文本填掉。 */
const SPECIAL_KEYS = ['cast'];

const CAST_KEYS = ['名', '关系', '情况', '心境', '神态'];
/** 画卡片时按这个顺序排（`名` 做标题，不列在这里） */
const CAST_ROWS = ['关系', '情况', '心境', '神态'];
const CAST_MAX = 3;
/** 外卡六件套的英文标签与旧版写法也认（模型偶尔会回落成 extra_char_N / 阶段 的写法） */
const CAST_FIELD_ALIAS = {
  name: '名', 名称: '名', 对象: '名',
  关系: '关系', relation: '关系',
  阶段: '关系', stage: '关系',
  aura: '情况', 气场: '情况',
  情况: '情况',
  mind: '心境', reason: '心境', 心意缘由: '心境',
  demeanor: '神态', companion: '神态', 姿态: '神态',
};
/** `<角色N>…</角色N>`：惰性 ＋ 反向引用配对的闭合标签，兄弟子块不会串味 */
const CAST_BLOCK_RE = /<角色\s*([0-9０-９一二三四五六七八九]+)\s*>([\s\S]*?)<\/角色\s*\1\s*>/g;
const CAST_FIELD_RE = /<(名|名称|name|对象|关系|relation|阶段|stage|情况|aura|气场|心境|mind|心意缘由|reason|神态|demeanor|姿态|companion)>([^<]*)<\/\1>/g;
const CAST_EMPTY_RE = /^[无無—\-]+$/;

/**
 * 取「能看到消息」的那个 document。
 * ⚠️ 这是本版的核心：卡内脚本在 iframe 内，它自己的 document 里没有 .mes。
 */
function DOC() {
  const cands = [];
  try { if (window.parent && window.parent !== window) cands.push(window.parent.document); } catch (e) { /* 跨源 */ }
  try { if (window.top && window.top !== window) cands.push(window.top.document); } catch (e) { /* 跨源 */ }
  cands.push(document);
  for (const d of cands) {
    try { if (d && d.querySelector('.mes')) return d; } catch (e) { /* 忽略 */ }
  }
  return cands[0] ?? document;
}

/** 面板根元素：优先数据属性（不受 DOMPurify 改名影响），再退回 class 的两种拼法 */
const panelOf = (mesEl) =>
  mesEl.querySelector('[data-xds-panel]') ||
  mesEl.querySelector('.custom-xds-panel') ||
  mesEl.querySelector('.xds-panel');

function log(...a) { if (debug) console.log(TAG, ...a); }

/** HTML 转义：子块内容来自 AI 正文，直接塞 innerHTML 会把尖括号当标签解析掉
 *  ⚠️ v2.3：本函数现在同时兼任**属性转义**（`"`／`'` 也转）—— 立绘的 `data-sources`
 *     里是 JSON（满是双引号），不转 `"` 会在第一个引号处截断属性 ⇒ 降级链静默报废。
 *     `&` **必须第一个**转，否则把后面转出来的 `&lt;` 再转一层（外卡 B3-2 的结论）。 */
function esc(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 摘出全部 `<角色N>` 子块并聚合成数组。
 * ⚠️ 必须**先整块摘掉**再跑顶层字段正则：子块里的 `<名>` 会被「名器」栏的互相包含规则吃掉
 *    （`名器`.includes(`名`）），人物名会写进名器栏。
 * ⚠️ 用 `replace(正则, 函数)`：替换串里的 `$&`／`$'` 是特殊序列，会把内文写坏（铁律 26）。
 */
function parseCast(inner) {
  const list = [];
  const rest = String(inner === undefined || inner === null ? '' : inner)
    .replace(CAST_BLOCK_RE, (whole, no, body) => {
      const b = String(body === undefined || body === null ? '' : body).trim();
      if (!b || CAST_EMPTY_RE.test(b)) return '\n';
      const one = { 序号: String(no === undefined || no === null ? '' : no).trim(), 名: '', 关系: '', 情况: '', 心境: '', 神态: '' };
      for (const mm of b.matchAll(CAST_FIELD_RE)) {
        const k = CAST_FIELD_ALIAS[mm[1]] || mm[1];
        const v = String(mm[2] === undefined || mm[2] === null ? '' : mm[2]).trim();
        if (CAST_KEYS.includes(k) && !one[k]) one[k] = v;
      }
      if (!CAST_KEYS.some((k) => one[k]) && !b.includes('<')) one.名 = b;
      if (CAST_KEYS.some((k) => one[k])) list.push(one);
      return '\n';
    });
  return { list: list.slice(0, CAST_MAX), rest };
}

/** 把在场角色子块画成小卡片（样式沿用书卷格子：.xds-cc／.xds-cc-h／.xds-cc-r）
 *  v2.3：每张小卡**左侧**加立绘（`xsdPortraitHtml`），名字 → 拼音 id → 图源链。
 *  ⚠️ 小卡内的**每一个**来自模型文本的字段都过 esc()（人名／阶段／情况／心境／神态，
 *     以及兜底写法 `角色N` 里的序号）—— 一个都不许裸奔进 innerHTML。 */
function renderCast(panel, list, stage, seed, rawText) {
  const box = panel.querySelector('[data-xds="cast"]');
  if (!box || !list.length) return 0;
  const st = s0(stage) || 'baseline';
  const sd = s0(seed) || '0';
  box.innerHTML = list.map((c, i) => {
    const nm = s0(c.名) || ('角色' + s0(c.序号));

    const myStage = xsdStageForChar(c, nm, st, rawText);
    const rows = CAST_ROWS
      .filter((k) => c[k])
      .map((k) => '<div class="xds-cc-r"><span class="xds-ck">' + esc(k) + '</span><span class="xds-cv">' + esc(c[k]) + '</span></div>')
      .join('');
    /* 每张小卡一个稳定种子（楼层号 ＋ 序号）⇒ 同楼重绘不跳图 */
    return '<div class="xds-cc">' + xsdPortraitHtml(nm, s0(c.情况), undefined, myStage, sd + '#' + i)
      + '<div class="xds-cc-body">'
      + '<div class="xds-cc-h">' + esc(nm) + '</div>' + rows + '</div></div>';
  }).join('');
  return list.length;
}

/* ══════════════════════════════════════════════════════════════════════════
 * 立绘子系统 v2.3（照抄外卡《大乾风华录 Ver2.0》，并逐条改掉它的 11 个坑）
 * --------------------------------------------------------------------------
 *   数据流：人名 → XSD_PINYIN 拼音 id → 有序候选链（本地 ≤6 条 ＋ 云端 1 条）
 *           → 写进 `data-sources`(JSON, esc 过) ＋ `data-src-idx` → img 404 自己往上走
 *           → 链尽 → SVG 国风剪影印章（永不 404）。
 *   外卡的坑与我们这里的对策（编号照 §B6）：
 *     P1 内联 onclick / alt 里的名字不转义          → 本文件一律 esc()（见 xsdPortraitHtml）
 *     P2 ESC 监听只在按 ESC 时移除（内存泄漏）      → xsdCloseLightbox 里**不论哪条路径**都摘光
 *     P3 多处 onclick 不 stopPropagation             → 关闭只认覆盖层一点，其余监听一律 cleanup
 *     P4 getTopDoc 跨域静默回落本地 document         → 回落时 console.warn 点名症状
 *     P5 window.parent 写入吞异常                    → 暴露进本 realm，外层另挂（try/catch + 日志）
 *     P6 云表键格式漂移（.jpg / 裸键）               → 写入统一 `<id>.webp`，读取保留 4 分支
 *     P7 SVG 文本直接拼 name（含 &/</> 会裂）        → xsdXmlEsc()（`&` 先转）
 *     P8 12 条本地候选串行 404 刷屏                  → 按本卡部署形态**裁到 3 目录 ×2 扩展名**
 *     P9 灯箱类名与实现脱节                          → 行内 cssText，不依赖任何外部样式表
 *     P10 空链不写 data-src-idx（状态机起点不明）    → **恒写** `data-sources` ＋ `data-src-idx="0"`
 *     P11 getAvatarUrl 死代码                        → 不搬，入口只有 xsdPortraitSourcesFor 一条
 * ══════════════════════════════════════════════════════════════════════════ */

/** 把任意值收成字符串并去掉空白（收 undefined／null／数字都稳） */
function s0(v) { return String(v === undefined || v === null ? '' : v).trim(); }

/** 名字 → 拼音 id（§〇M 立绘命名表全 16 条；查不到返回**空串**，上层据此直接落 SVG） */
const XSD_PINYIN = {
  '闻观语': 'wenguanyu',        /* 大师姐／千叶先生 · 墨绿 */
  '孤月': 'guyue',              /* 剑仙子 · 冷白＋冰蓝 */
  '叶红缨': 'yehongying',       /* 炎姬 · 赤红＋金 */
  '楚灵夜': 'chulingye',        /* 金花公主 · 暖白＋嫩粉 */
  '柳含烟': 'liuhanyan',        /* 师娘（后期）· 黑红＋牡丹 */
  '赵无忧': 'zhaowuyou',        /* 男主 · 玄青 */
  '玄机子': 'xuanjizi',         /* 本名陆藏锋 · 青灰 */
  '云逸尘': 'yunyichen',        /* 三师兄 · 云青 */
  '炎雷子': 'yanleizi',         /* 道主 · 赤雷 */
  '苏瑶': 'suyao',              /* 听雪双姝 · 月白 */
  '苏玲': 'suling',             /* 听雪双姝 · 月白 */
  '九皇子': 'jiuhuangzi',       /* 玄黑＋金 */
  '残阳老怪': 'canyanglaoguai', /* 焚欲殿主 · 灰败＋蛊火暗红 */
  '肉山佛': 'roushanfo',        /* 欢喜殿主 · 暗黄 */
  '病相思': 'bingxiangsi',      /* 魂欢殿主 · 惨绿 */
  '花芷凝': 'huazhining',       /* 花仙城主 · 桃粉 */
  '陆十三': 'lushisan',         /* 土黄 */
  '陆烬颜': 'lujinyan',         /* 淡紫 */
  '雨霏柔': 'yufeirou',         /* 阵道大能 · 深蓝 */
  '云织梦': 'yunzhimeng',       /* 师尊之徒 · 墨黑＋金＋玫瑰 */
  '极乐太子': 'jiletaizi',      /* 天姝会主宰 · 血紫＋暗金 */
  '炼欲魔君': 'lianyumojun',    /* 欲火峰峰主 · 深红近黑＋古铜 */
  '花间二鬼': 'huajianergui',   /* 荒漠邪修兄弟 · 土褐＋青黑 */
  '厉锋': 'lifeng',             /* 九皇子爪牙 · 褐黑＋口罩 */
  '石岩': 'shiyan',             /* 九皇子爪牙 · 铁灰＋铁护面 */
  '柳玉': 'liuyu',              /* 九皇子爪牙 · 炭蓝＋兜帽阴影 */
  /* 2026-10-08（主人令）：嵌入三位新立绘（慕容清歌／顾云舒／苏倾寒）——只登名册与立绘，
     未加任何称号、门派或剧情设定（铁律 31：不编）。颜色注释取自立绘可观察主色。 */
  '慕容清歌': 'murongqingge',   /* 银发碧眸 · 水青＋琴 · 青白 */
  '顾云舒': 'guyunshu',         /* 玄发赤瞳 · 赤金＋熔炉 · 殷红 */
  '苏倾寒': 'suqinghan',        /* 玄发 · 素银＋王座剑影 · 冷灰 */
};

/** 名字 → 拼音 id；查不到返回 ''（**不猜、不拼音化**：宁可落 SVG 也不发一串必然 404 的请求） */
function pinyinOf(name) {
  const k = s0(name);
  if (!k) return '';
  try { return s0(Object.prototype.hasOwnProperty.call(XSD_PINYIN, k) ? XSD_PINYIN[k] : ''); } catch (e) { return ''; }
}

/* 本地候选目录 —— **按本卡部署形态裁到 3 条**（外卡搬了 6 条 ⇒ 12 次串行 404，见 B6-P8）：
 *   1) user/images/xsd_gallery/   酒馆数据目录用户图库（首选，实际落在 data/default-user/user/images/）
 *   2) /user/images/xsd_gallery/  Web 根相对（反向代理兼容）
 *   3) xsd_gallery/               酒馆 public/ 传统图库相对路径
 * 目录 × `.png`/`.webp` 两个扩展 ⇒ 最多 6 条本地候选。 */
const XSD_LOCAL_PATHS = [
  'user/images/xsd_gallery/',
  '/user/images/xsd_gallery/',
  'xsd_gallery/',
];
/** 本地扩展名优先级。
 *  ⚠️ 2026-09-28（真机 → 测量 → 定案）：
 *    · 原顺序 `.webp` 在前（想省体积），但我们**部署的是 PNG** ⇒ 每角色先吃 3 次 404 才命中 png。
 *    · 真机量了体积：源 PNG 904×1600 ≈ **1.6 MB/张**；缩到面板尺寸 96×128 后
 *      **PNG ≈ 31 KB、基线 JPEG ≈ 3.8 KB**（`_gen_portrait_small.mjs` 实测，11 张合计 44 KB）。
 *    · 所以部署形态定为 **`.jpg` 小图优先**（1/400 的体积、一屏拉完），`png` 留给大图；`webp` 垫底。
 *      ⇒ 正常情况下**一次 404 都不会有**，控制台干净。
 *    ⚠️ 云端锚点那边仍按 `.webp` 键读写（catbox 传的是 webp 时不用改这里）。 */
const XSD_LOCAL_EXTS = ['.jpg', '.png', '.webp'];

/** 云端图床直链表（catbox）。
 *  ⚠️ 这两行锚点注释是**给同步脚本用的**：图传 catbox 后，在锚点之间按
 *     「拼音.webp: 直链」补一行即可（写死一条示例会让读者误以为已经有图）。
 *  ⚠️ 写入格式**只有** `<id>.webp` 一种；读取保留 4 分支（.webp／.png／.jpg／裸 id）宽容。 */
const XSD_CLOUD_URLS = {
  /* XSD_CLOUD:BEGIN —— 图传 catbox 后在此按「拼音.webp: 直链」补一行 */

/* XSD_CLOUD:END */
};

/** 拼音 id 白名单校验：只收 `[a-z0-9_-]{1,64}`，别的一律当空。
 *  ⚠️ 这一条同时挡住「路径穿越」（`../`、`/`）与「属性逃逸」（引号／空格）：
 *     id 会被拼进 URL 再进 HTML 属性，脏 id 能一路穿到宿主 DOM。 */
function safePinyinId(v) {
  const s = s0(v);
  return /^[a-z0-9_-]{1,64}$/.test(s) ? s : '';
}

/** 云端表查表：兼容 `<id>.webp` / `.png` / `.jpg` / 裸 `<id>` 四种键（照外卡 :3811） */
function cloudUrlFor(id, table) {
  const t = (table && typeof table === 'object') ? table : XSD_CLOUD_URLS;
  const k = safePinyinId(id);
  if (!k) return '';
  try {
    return s0(t[k + '.webp'] || t[k + '.png'] || t[k + '.jpg'] || t[k]);
  } catch (e) { return ''; }
}

/**
 * 构建完整立绘候选链：本地 3 目录 × 2 扩展（6 条）→ 云端 1 条（去重）。
 * ⚠️ **纯函数**、不读 DOM、不抛错；`table` 可注入（验收脚本用它避开真实云表）。
 * @returns {string[]} id 非法/为空时返回 `[]`（上层据此**直接**落 SVG，一条请求都不发）
 */
function xsdPortraitSources(id, table) {
  const pid = safePinyinId(id);
  const out = [];
  if (!pid) return out;                                  // 空 id ⇒ 空链 ⇒ 上层直接出 SVG
  for (const ext of XSD_LOCAL_EXTS) {
    for (const dir of XSD_LOCAL_PATHS) out.push(dir + pid + ext);
  }
  const cloud = cloudUrlFor(pid, table);
  if (cloud && out.indexOf(cloud) === -1) out.push(cloud);   // 去重：云端可能等于某条本地路径
  return out;
}

/** 名字 → 候选链（**唯一入口**；外卡的 getAvatarUrl 是死代码，不搬，见 B6-P11） */
function xsdPortraitSourcesFor(name, table) {
  return xsdPortraitSources(pinyinOf(name), table);
}



/** 身份别名 ⇒ 角色名（键是身份文本里可能出现的词；查不到就被 ① 兜住） */
const XSD_IDENTITY_ALIAS = {
  '墨山道六弟子': '赵无忧',
  '浊龙殿主': '九皇子',
  '焚欲殿主': '残阳老怪',
  '欢喜殿主': '肉山佛',
  '魂欢殿主': '病相思',
  '极乐太子': '极乐太子',
  '花仙城主': '花芷凝',
  '城主': '花芷凝',
  '剑仙子': '孤月',
  '听雪双姝': '苏瑶',
};

/** 身份文本 → 角色名（查不到返回 ''）
 *  ⚠️ 2026-10-01 实测踩坑（主人指出「自设这里不能是赵无忧」）：
 *     **自设**身份那个字段里是模板句「写清身份与阵营，别把 {{user}} 当成赵无忧）</身份>」
 *     ⇒ 用"任何位置命中角色名"的老规则会把**赵无忧**认出来，红框就贴了错的立绘。
 *  规则改成三条：① 含「自设」⇒ 一律不认（交回剪影；玩家的自设人物本来就没有立绘）；
 *              ② 先查别名表（浊龙殿主／焚欲殿主这类）；
 *              ③ 名字匹配只在**身份文本较短**（≤20 字，例如「九皇子（天姝会四殿之一）」）时才用 ——
 *                 长文本里出现的名字多半是说明文字，不是身份。 */
function xsdIdentityName(txt) {
  const t = s0(txt).replace(/\s+/g, '');
  if (!t) return '';
  if (t.indexOf('自设') !== -1) return '';
  for (const [k, v] of Object.entries(XSD_IDENTITY_ALIAS)) if (t.indexOf(k) !== -1) return v;
  if (t.length <= 20) for (const nm of Object.keys(XSD_PINYIN)) if (t.indexOf(nm) !== -1) return nm;
  return '';
}

/**
 * 把当前身份对应角色的立绘放进右上角。
 * @param {Element} panel 面板根
 * @param {string} stage  阶段（与在场角色同一套判定）
 */
function xsdPaintIdentityFace(panel, stage) {
  try {
    const face = panel && panel.querySelector ? panel.querySelector('.xh-face') : null;
    if (!face) return false;
    const idEl = panel.querySelector('[data-xds="id"]');
    const name = xsdIdentityName(idEl ? idEl.textContent : '');
    const link = face.querySelector('a.xh-face-link');
    const nmEl = face.querySelector('.nm');
    /* 认不出身份（例如「自设」）⇒ 拆掉图片、只留 CSS 剪影，名字条也清空 */
    if (!name) { if (link) link.remove(); if (nmEl) nmEl.textContent = ''; return false; }
    if (nmEl) nmEl.textContent = name;
    const pid = pinyinOf(name);
    const srcs = xsdPortraitSourcesStaged(pid, stage, null);
    if (!srcs.length) { if (link) link.remove(); return false; }
    let a = link;
    if (!a) {
      a = document.createElement('a');
      a.className = 'xh-face-link';
      a.setAttribute('href', '#');
      a.setAttribute('data-xsd-open', '1');              // ⇒ 由 xsdWireInline 挂上开灯箱
      face.insertBefore(a, face.firstChild);
    }
    /* 与在场微卡同一套属性：灯箱靠 `data-char-id` ＋ img 上的 `data-stage` 自己算大图链 */
    a.setAttribute('data-char-name', name);
    a.setAttribute('data-char-id', pid);
    a.setAttribute('title', '点击查看高清立绘');
    let img = a.querySelector('img.xh-face-img');
    if (!img) {
      img = document.createElement('img');
      img.className = 'xh-face-img';
      img.alt = name;
      /* 图全挂了就**连 a 一起撤**（露出下面的剪影）—— 黑框／碎图一律不落 */
      img.addEventListener('error', () => { try { a.remove(); } catch (e) { /* 忽略 */ } });
      a.appendChild(img);
    }
    img.setAttribute('data-stage', s0(stage) || 'baseline');
    img.setAttribute('data-char-name', name);
    img.setAttribute('data-char-id', pid);
    a.setAttribute('data-sources', JSON.stringify(srcs));
    if (img.getAttribute('src') !== srcs[0]) img.setAttribute('src', srcs[0]);
    return true;
  } catch (e) { return false; }
}

/* ═══════════════════════════════════════════════════════════
 * 立绘「阶段组」与随机加载（2026-09-28 主人要求）
 *   ① 同一个角色多张图时，**只在同一阶段组里随机抽**：
 *      叶红缨的正常立绘永远不会抽到沐浴图，反之亦然。
 *   ② 点立绘放大后能**翻面**（←/→ 键或按钮），翻的就是同组的这几张。
 *   ③ 每层楼随机一次、**用楼层号做种子** ⇒ 同一楼重绘不会跳图，换楼才换。
 * ═══════════════════════════════════════════════════════════ */

/** 拼音 id → { 阶段名: [后缀, …] }；'baseline' 是默认阶段（无后缀 / `_2` / `_3` 都属它）。
 *  ⚠️ 命名规范见图库 README：`<拼音>_<阶段>`。**没登记的后缀不会加载**（宁可不显示也不串阶段）。 */
const XSD_VARIANTS = {
  wenguanyu:  { baseline: ['', '_2'] },
  guyue:      { baseline: ['', '_2', '_3'] },
  yehongying: { baseline: ['', '_2'], bath: ['_bath_front', '_bath_side'] },
  chulingye:  { baseline: ['', '_2', '_3'] },
  suling:     { baseline: ['', '_2'] },
};

/** 阶段关键词 ⇒ 用来从**当前状态**判断该用哪一组。
 *  只认"明显是洗澡"的处境；判不出来一律 baseline（永远是安全的那组）。 */
const XSD_STAGE_RULES = [

  { stage: 'bath',

    re: /洗澡|冲澡|泡澡|沐浴|洗浴|入浴|净身|擦身|洗身|出浴/,
    weak: /浴池|汤池|温泉|浴桶|浴房|水池/,
    support: /裸|赤身|赤足|宽衣|解衣|脱衣|衣不整|衣衫|水汽|雾气|湿发|湿透|泡在|浸在|出浴/,
    deny: /议事|朝会|议事厅|演武|讲经|藏经/ }
];

/**
 * 从状态数据猜当前阶段：`fieldText` 可以传地点／环境／状态拼起来的字符串。
 * @returns {string} 阶段名（默认 'baseline'）
 */
function xsdStageOf(fieldText) {
  const t = s0(fieldText);
  if (!t) return 'baseline';
  for (const r of XSD_STAGE_RULES) { if (!r.re.test(t)) continue; if (r.deny && r.deny.test(t)) continue; return r.stage; }
  return 'baseline';
}

/**
 * 从整块原文里挑出**点名提到这个人**的片段（按 `<标签>…</标签>` 切）。
 *
 * 为什么要它（2026-09-28 第三十七轮，主人报「偷看叶红缨洗澡，立绘还是普通立绘」）：
 *   真机那一楼的状态块是这样的 ——
 *     `<地点>墨山道·赤焰居外悬空栈道</地点>`（无关键词）
 *     `<环境>清冷山风 · 远处松涛声 · 身上残存的热汽与酒气</环境>`（无关键词）
 *     `<状态>灵力圆满｜气血躁动…</状态>`（无关键词）
 *     `<暗处>叶红缨（赤焰居汤池内平复余韵）</暗处>` ← **汤池在这里**
 *     `<线索>红缨师姐沐浴时自抚泄身…</线索>` ← **沐浴在这里**
 *   而原来的阶段判定**只读「地点／环境／状态」** ⇒ 判成 baseline ⇒ 叶红缨照旧出普通立绘。
 *   ⇒ 改成**按人判**：先看这个人自己的四行，再看**整块里点了这个人名字**的字段。
 * @returns {string} 拼起来的相关文本（可能为空）
 */
function xsdMentioningText(rawText, nm) {
  const t = s0(rawText);
  const name = s0(nm);
  if (!t || !name) return '';
  const out = [];
  try {
    /* ⚠️ **只匹配"叶子标签"**（内容里不含 `<`）：`<地点>…</地点>`、`<暗处>…</暗处>` 这种。
     *   若写成 `([\s\S]*?)`，第一个命中就是**外层 `<Status_block>…</Status_block>` 整块**
     *   ⇒ 每个人都会拿到全篇文本 ⇒ 赵无忧也跟着泡汤（这条是实测踩出来的，别改回去）。 */
    const re = /<([^>/\s]+)>([^<]*)<\/\1>/g;
    let m;
    while ((m = re.exec(t))) if (m[2].indexOf(name) >= 0) out.push(m[2]);
  } catch (e) { /* 忽略 */ }
  if (out.length) return out.join(' ');
  /* 没有标签结构（或名字一个标签都没进）：退回"名字附近"的窗口 */
  try {
    let i = -1, n = 0;
    while ((i = t.indexOf(name, i + 1)) >= 0 && n < 8) {
      out.push(t.slice(Math.max(0, i - 40), i + name.length + 80)); n += 1;
    }
  } catch (e) { /* 忽略 */ }
  return out.join(' ');
}

/**
 * 这个人**在不在场**（读 `<在场>`）。
 * 为什么要它：③ 场景通用那一步是"兜底"，但**不在场的人不该被兜进去** ——
 *   实测那一楼 `<地点>` 写着「赤焰居**浴房**梁上」，而 `<暗处>玄机子（刚离去不远，仍在前院石径附近）</暗处>`
 *   ⇒ 若照场景兜底，站在前院的玄机子也会被判成 bath。
 *   规矩：`<在场>` 里**没有这个人** ⇒ 不给场景兜底（判 baseline，永远是安全那组）。
 *   `<在场>` 缺失（老格式／模型漏写）时**不拦**，照旧兜底。
 */
function xsdInScene(rawText, nm) {
  const t = s0(rawText), name = s0(nm);
  if (!t || !name) return false;
  const m = /<在场>([^<]*)<\/在场>/.exec(t);
  if (!m) return true;
  return m[1].indexOf(name) >= 0;
}


function xsdStageForChar(castItem, nm, globalStage, rawText) {
  try {
    const c = castItem || {};
    const own = [c['关系'] || c['阶段'], c['情况'] || c['气场'], c['心境'], c['神态']].map(s0).join(' ');
    const s1 = xsdStageOf(own);
    if (s1 !== 'baseline') return s1;
    const s2 = xsdStageOf(xsdMentioningText(rawText, nm));
    if (s2 !== 'baseline') return s2;
    if (!xsdInScene(rawText, nm)) return 'baseline';
  } catch (e) { /* 退回场景 */ }
  return s0(globalStage) || 'baseline';
}

/** 某 id 在某阶段下的**文件后缀**列表（阶段不存在就回落 baseline；都没登记就 ['']） */
function xsdSuffixes(id, stage) {
  const pid = safePinyinId(id);
  if (!pid) return [];
  const groups = Object.prototype.hasOwnProperty.call(XSD_VARIANTS, pid) ? XSD_VARIANTS[pid] : null;
  if (!groups) return [''];                                     // 未登记 ⇒ 只试主图
  const want = s0(stage) || 'baseline';
  const list = groups[want] || groups.baseline || [''];
  return list.slice();
}


let XSD_EMBED = null;
let XSD_EMBED_BIG = null;
let XSD_EMBED_RELICS = null;
let XSD_EMBED_CHAR_ID = null;

function xsdCheckCharSwitch() {
  let curId = null;
  const cands = [];
  try { cands.push(window); } catch (e) { /* 忽略 */ }
  try { if (window.parent && window.parent !== window) cands.push(window.parent); } catch (e) { /* 忽略 */ }
  try { if (window.top && window.top !== window) cands.push(window.top); } catch (e) { /* 忽略 */ }
  for (const w of cands) {
    try {
      const ctx = (w && w.SillyTavern && typeof w.SillyTavern.getContext === 'function') ? w.SillyTavern.getContext() : null;
      if (ctx && (ctx.characterId !== undefined && ctx.characterId !== null)) {
        curId = String(ctx.characterId);
        break;
      }
    } catch (e) { /* 跨源跳过 */ }
  }
  if (curId !== null && curId !== XSD_EMBED_CHAR_ID) {
    XSD_EMBED_CHAR_ID = curId;
    XSD_EMBED = null;
    XSD_EMBED_BIG = null;
    XSD_EMBED_RELICS = null;
  }
}

/** ⚠️ 卡里的 `xsd_assets` 可能挂在两处，取决于酒馆版本／导入路径：
 *   ① `characters[i].data.extensions.xsd_assets`（V2 规范，本卡按这条写）
 *   ② `characters[i].extensions.xsd_assets`（有的版本会把 V2 data 摊平到顶层）
 *  ⇒ **两处都试**，并把"命中哪一处／有没有命中"打进 console 一行 —— 远端（如别人拿到卡）
 *     看不到图时，看这行就知道断在哪一层（2026-10-01 主人转来「秋风反馈没图片」）。 */
function xsdAssetMaps(w) {
  const out = [];
  try {
    const ctx = (w && w.SillyTavern && typeof w.SillyTavern.getContext === 'function') ? w.SillyTavern.getContext() : null;
    if (!ctx) return out;
    const ch = ctx.characters && ctx.characters[ctx.characterId];
    if (!ch) return out;
    try { const a = ch.data && ch.data.extensions && ch.data.extensions.xsd_assets; if (a) out.push(a); } catch (e) { /* 忽略 */ }
    try { const a = ch.extensions && ch.extensions.xsd_assets; if (a) out.push(a); } catch (e) { /* 忽略 */ }
    /* ③ 兜底：ST 服务端会给角色挂一份**原始 V2 JSON 字符串**（`character.json_data`）。
     *    上面两处都没有时，就解析它取 `data.extensions.xsd_assets`（只解一次，结果被 XSD_EMBED 缓存）。 */
    if (!out.length) {
      try {
        const raw = s0(ch.json_data);
        if (raw) { const v2 = JSON.parse(raw); const a = v2 && v2.data && v2.data.extensions && v2.data.extensions.xsd_assets; if (a) out.push(a); }
      } catch (e) { /* 忽略 */ }
    }
    if (!out.length) {
      try { console.log(TAG, '[内嵌排查] 没找到 xsd_assets｜角色:' + (ch.name || '?') + '｜有 ch.data? ' + !!ch.data + '｜有 data.extensions? ' + !!(ch.data && ch.data.extensions) + '｜有 json_data? ' + !!ch.json_data); } catch (e) { /* 忽略 */ }
    }
  } catch (e) { /* 忽略 */ }
  return out;
}
function xsdEmbedded() {
  xsdCheckCharSwitch();
  if (XSD_EMBED !== null) return XSD_EMBED;
  const cands = [];
  try { cands.push(window); } catch (e) { /* 忽略 */ }
  try { if (window.parent && window.parent !== window) cands.push(window.parent); } catch (e) { /* 忽略 */ }
  try { if (window.top && window.top !== window) cands.push(window.top); } catch (e) { /* 忽略 */ }
  for (const w of cands) {
    for (const assets of xsdAssetMaps(w)) {
      const map = assets && assets.panel;
      if (map && typeof map === 'object' && Object.keys(map).length) {
        XSD_EMBED = map;
        try { console.log(TAG, '[内嵌] 命中 ' + Object.keys(map).length + ' 条' + (assets.lightbox ? '（含灯箱档）' : '（无灯箱档）')); } catch (e) { /* 忽略 */ }
        return XSD_EMBED;
      }
    }
  }
  try { console.log(TAG, '[内嵌] 暂未命中 ⇒ 立绘退回本地文件／剪影（保留重试，不锁死空表）'); } catch (e) { /* 忽略 */ }
  return {};
}

function xsdEmbeddedBig() {
  xsdCheckCharSwitch();
  if (XSD_EMBED_BIG !== null) return XSD_EMBED_BIG;
  const cands = [];
  try { cands.push(window); } catch (e) { /* 忽略 */ }
  try { if (window.parent && window.parent !== window) cands.push(window.parent); } catch (e) { /* 忽略 */ }
  try { if (window.top && window.top !== window) cands.push(window.top); } catch (e) { /* 忽略 */ }
  for (const w of cands) {
    for (const assets of xsdAssetMaps(w)) {   // ⚠️ 与 `xsdEmbedded()` 同一套"两处都试"的查找
      const map = assets && assets.lightbox;
      if (map && typeof map === 'object' && Object.keys(map).length) { XSD_EMBED_BIG = map; return XSD_EMBED_BIG; }
    }
  }
  return {};
}
/** 取内嵌**灯箱大图**（按图库文件名，如 `guyue`／`yehongying_bath_front`）；没有返回 '' */
function xsdEmbedBigUrl(name) {
  try {
    const m = xsdEmbeddedBig();
    return s0(m[s0(name)]);
  } catch (e) { return ''; }
}

function xsdEmbeddedRelics() {
  xsdCheckCharSwitch();
  if (XSD_EMBED_RELICS !== null) return XSD_EMBED_RELICS;
  const cands = [];
  try { cands.push(window); } catch (e) { /* 忽略 */ }
  try { if (window.parent && window.parent !== window) cands.push(window.parent); } catch (e) { /* 忽略 */ }
  try { if (window.top && window.top !== window) cands.push(window.top); } catch (e) { /* 忽略 */ }
  for (const w of cands) {
    for (const assets of xsdAssetMaps(w)) {
      const map = assets && assets.relics;
      if (map && typeof map === 'object' && Object.keys(map).length) { XSD_EMBED_RELICS = map; return XSD_EMBED_RELICS; }
    }
  }
  return {};
}
/** 取内嵌纹章（按纹章 id 与阶段 1..4，如 `jiuyouxuanyinxue`, 2）；没有返回 '' */
function xsdRelicUrl(id, stage) {
  try {
    const m = xsdEmbeddedRelics();
    if (!m) return '';
    const sid = s0(id);
    const s = stage || 1;
    const k = sid + '_' + s;
    if (m[k]) return s0(m[k]);
    if (m[sid]) return s0(m[sid]);
    if (m[sid + '_1']) return s0(m[sid + '_1']);
    return '';
  } catch (e) { return ''; }
}

/** 取纹章图源：内嵌优先；未内嵌时回退本地路径 */
function xsdRelicCandidateUrl(id, stage) {
  const u = xsdRelicUrl(id, stage);
  if (u) return u;
  const sid = s0(id);
  const s = stage || 1;
  return 'user/images/xsd_relics/' + sid + '_' + s + '.webp';
}

/** 取内嵌立绘（按图库文件名，如 `guyue`／`yehongying_bath_front`） */
function xsdEmbedUrl(name) {
  try {
    const m = xsdEmbedded();
    const u = s0(m[s0(name)]);
    return /^data:image\//.test(u) ? u : '';
  } catch (e) { return ''; }
}

/**
 * 构建**按阶段**的立绘候选链。
 * 顺序＝「同阶段优先、逐目录逐扩展兜底、最后才降到别的阶段」：
 *   ① 本阶段每个后缀：先铺该后缀的「目录×扩展」全组合（同一个 id 不跳图，只换目录/格式）
 *   ② 本阶段的后缀用完，才轮到其他阶段（降级兜底，永不碎图）
 *   ③ 最后补云端直链
 * @param {string} id 拼音 id
 * @param {string} stage 阶段名（'baseline' / 'bath' / …）
 * @param {object} table 云表（可注入，便于验收）
 * @returns {string[]}
 */
function xsdPortraitSourcesStaged(id, stage, table) {
  const pid = safePinyinId(id);
  const out = [];
  if (!pid) return out;
  const push = (u) => { if (u && out.indexOf(u) === -1) out.push(u); };
  const groups = Object.prototype.hasOwnProperty.call(XSD_VARIANTS, pid) ? XSD_VARIANTS[pid] : null;
  const want = s0(stage) || 'baseline';
  const suffixes = [];
  const others = [];
  if (groups) {
    for (const sfx of (groups[want] || groups.baseline || [''])) suffixes.push(sfx);
    for (const [g, list] of Object.entries(groups)) {
      if (g === want) continue;
      for (const sfx of list) others.push(sfx);          // 其他阶段垫底（降级用，不会主动选它）
    }
  } else suffixes.push('');
  for (const sfx of suffixes) {
    push(xsdEmbedUrl(pid + sfx));                       // ★ 内嵌优先（卡自带，不 404）
    for (const dir of XSD_LOCAL_PATHS) for (const ext of XSD_LOCAL_EXTS) push(dir + pid + sfx + ext);
  }
  const cloud = cloudUrlFor(pid, table);
  if (cloud) push(cloud);
  /* ⚠️ 其他阶段**排在云端之后**：哪怕同阶段图一张都没放，也是先试云端主图，最后才串阶段。 */
  for (const sfx of others) {
    for (const dir of XSD_LOCAL_PATHS) for (const ext of XSD_LOCAL_EXTS) push(dir + pid + sfx + ext);
  }
  return out;
}

/**
 * 同阶段**「张数」与每张的首选 URL** —— 给随机加载与灯箱翻面用。
 * 每张 = 一个后缀；首选 URL 取「第一个目录 × 第一个扩展名」（本地不存在时由 `xsdWalkDown` 自动往链下走）。
 * @returns {string[]} 该阶段每张图的首选 URL（未登记 id 时返回单元素数组）
 */
function xsdStageImages(id, stage, table, extOverride) {
  const pid = safePinyinId(id);
  if (!pid) return [];
  const sfx = xsdSuffixes(id, stage);
  const dir = XSD_LOCAL_PATHS[0];
  const ext = s0(extOverride) || XSD_LOCAL_EXTS[0];
  const big = !!s0(extOverride);

  const list = sfx.map((s) => {
    const key = pid + s;
    if (big) {
      if (xsdEmbedBigUrl(key) || xsdEmbedUrl(key)) return key;
      return dir + key + ext;
    }
    return xsdEmbedUrl(key) || (dir + key + ext);
  });
  if (list.length) return list;
  const defKey = pid;
  if (big) {
    if (xsdEmbedBigUrl(defKey) || xsdEmbedUrl(defKey)) return [defKey];
    return [dir + defKey + ext];
  }
  return [xsdEmbedUrl(defKey) || (dir + defKey + ext)];
}

/** 稳定伪随机：同一楼号 + 同一角色 ⇒ 同一张图（重绘不跳图） */
function xsdPickIndex(seedText, count) {
  const n = Math.max(1, Number(count) || 1);
  const str = s0(seedText) || '0';
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h) % n;
}


/** XML 文本转义（喂给 SVG 的 `<text>`）。
 *  ⚠️ 外卡 B6-P7 的坑：剪影里直接拼 name，名字含 `&` 或 `<` ⇒ **SVG 本身就解析失败**
 *     ⇒ 连最后一级兜底也裂成一坨。`&` 先转，否则二次转义。 */
function xsdXmlEsc(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/* SVG 占位底色分区（§〇E·E6）——一个色只给一个人当主色，防「楚灵夜和大师姐撞色」。
 * 底＝从深到主色的渐变终点（起点统一 `#141722` 玄黑），边＝押主色的描边。 */
const XSD_PORTRAIT_PALETTE = {
  wenguanyu:     ['#1b3126', '#b9c9a4'],   /* 墨绿 · 暖褐米白 · 玉色茶金 */
  guyue:         ['#5b6b7d', '#e8f1fa'],   /* 冷白＋冰蓝 · 银 */
  yehongying:    ['#6b1a12', '#f0c98a'],   /* 赤红＋金 · 火光橙 */
  chulingye:     ['#e3cdc5', '#fff6ec'],   /* 暖白／米白＋嫩粉 · 淡金 */
  liuhanyan:     ['#2a1218', '#d8a3ac'],   /* 黑红＋牡丹 */
  zhaowuyou:     ['#1d2b31', '#9fb8c4'],   /* 玄青 */
  xuanjizi:      ['#333c42', '#c3cdd3'],   /* 青灰 */
  yunyichen:     ['#3a4a5a', '#cfe0ef'],   /* 云青 */
  yanleizi:      ['#3a1408', '#ff9a4d'],   /* 赤雷 */
  suyao:         ['#3c465a', '#eef2fb'],   /* 月白（听雪双姝） */
  suling:        ['#4a566b', '#f4f5fc'],   /* 月白（听雪双姝，明度微差以分姐妹） */
  jiuhuangzi:    ['#221d14', '#e6c96b'],   /* 玄黑＋金 */
  canyanglaoguai:['#332126', '#e07a3c'],   /* 灰败＋蛊火暗红 */
  roushanfo:     ['#3b3013', '#e0b64f'],   /* 暗黄 */
  bingxiangsi:   ['#1b2a1e', '#b6dba6'],   /* 惨绿 */
  huazhining:    ['#5a2a3a', '#ffd9e2'],   /* 桃粉 */
  lushisan:      ['#3a3018', '#d9c184'],   /* 土黄 */
  lujinyan:      ['#3a2a4a', '#d6bdf0'],   /* 淡紫 */
};
/** 中性色（查不到配色分区的角色一律用它，别让颜色随机漂） */
const XSD_PORTRAIT_NEUTRAL = ['#334155', '#d4af37'];

/** 拼音 id → [底渐变终点色, 描边/人形色]；认不出给中性色 */
function paletteFor(id) {
  const k = safePinyinId(id);
  try {
    if (k && Object.prototype.hasOwnProperty.call(XSD_PORTRAIT_PALETTE, k)) return XSD_PORTRAIT_PALETTE[k];
  } catch (e) { /* 忽略 */ }
  return XSD_PORTRAIT_NEUTRAL;
}

/** 取名字前 n 个字（按码点切，别把 emoji／代理对劈成半个字符） */
function head(n, k) {
  return Array.from(s0(n)).slice(0, k).join('');
}

/**
 * 国风剪影占位头像（160×200，渐变底 ＋ 金边 ＋ 人形 ＋ 名字两字）。
 * 照外卡 :3817–3849 的结构，改了三点：① 底色走我们 §〇E·E6 的配色分区；
 * ② 文本**先过 xsdXmlEsc**；③ 末行不再堆全名（含 `<` 的名字会把 SVG 自己写坏 —— 反正有全文案 alt）。
 * @returns {string} `data:image/svg+xml;utf8,` ＋ encodeURIComponent（`#`／中文／`"` 必须编码）
 */
function xsdAvatarFallbackSvg(name, realm, id) {
  const nm = s0(name);
  const pid = safePinyinId(id) || pinyinOf(nm);
  const pal = paletteFor(pid);
  const fillGrad = pal[0], strokeCol = pal[1];
  const charText = xsdXmlEsc(head(nm, 2) || '仙姝');   /* 剪影里的名字两字 */
  const realmText = xsdXmlEsc(head(realm, 2) || '墮');  /* 门派／封号两字 */
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 200" width="100%" height="100%">',
    '  <defs>',
    '    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
    '      <stop offset="0%" stop-color="#141722"/>',
    '      <stop offset="100%" stop-color="' + fillGrad + '"/>',
    '    </linearGradient>',
    '    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">',
    '      <stop offset="0%" stop-color="#fff1b8"/>',
    '      <stop offset="50%" stop-color="#d4af37"/>',
    '      <stop offset="100%" stop-color="#8c6d1f"/>',
    '    </linearGradient>',
    '  </defs>',
    '  <rect width="160" height="200" fill="url(#bg)"/>',
    '  <rect x="6" y="6" width="148" height="188" rx="6" fill="none" stroke="' + strokeCol + '" stroke-width="1.2" opacity="0.6"/>',
    '  <circle cx="80" cy="76" r="38" fill="none" stroke="url(#gold)" stroke-width="2" opacity="0.45"/>',
    '  <path d="M80 44 Q92 60 90 76 Q88 92 80 96 Q72 92 70 76 Q68 60 80 44 Z" fill="' + strokeCol + '" opacity="0.25"/>',
    '  <circle cx="80" cy="62" r="16" fill="' + strokeCol + '" opacity="0.3"/>',
    '  <rect x="62" y="128" width="36" height="36" rx="4" fill="' + fillGrad + '" fill-opacity="0.55" stroke="' + strokeCol + '" stroke-width="1.2"/>',
    '  <text x="80" y="146" font-family="serif" font-size="11" fill="#ffffff" text-anchor="middle" font-weight="bold">' + realmText + '</text>',
    '  <text x="80" y="159" font-family="serif" font-size="11" fill="#fff1b8" text-anchor="middle" font-weight="bold">' + charText + '</text>',
    '  <text x="80" y="184" font-family="sans-serif" font-size="9" fill="#a9b4c2" text-anchor="middle" letter-spacing="1">仙姝墮 · 立绘待置</text>',
    '</svg>',
  ].join('');
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/* 立绘/小卡的样式：**行内**下发（`_build_card.js` 的 CSS 块不在本次改动范围内，
 * 且本文件是卡内脚本 —— 只许往已存在的面板 DOM 里写内容，不许往宿主文档注入 <style>）。
 * display:inline-flex 打进 cssText 的语义：**没跑 JS ⇒ style 属性不存在 ⇒ 自动退化成块级文字卡**。 */
const XSD_CC_BOX_STYLE = 'display:flex;align-items:flex-start;gap:8px;';
const XSD_CC_BODY_STYLE = 'flex:1;min-width:0;';
const XSD_PW_STYLE = 'flex:0 0 44px;width:44px;height:56px;position:relative;'
  + 'display:inline-flex;align-items:center;justify-content:center;'
  + 'border:1px solid #c8ae82;border-radius:2px;background:rgba(255,252,244,.65);'
  + 'overflow:hidden;cursor:zoom-in;box-shadow:inset 0 0 8px rgba(190,160,110,.25);user-select:none;';
const XSD_PI_STYLE = 'width:100%;height:100%;object-fit:cover;display:block;';

/**
 * 单张立绘微卡（外卡 B5 的 renderAvatarMicroCard 等价物）。
 * ⚠️ 三处必改（都来自 B6）：
 *   ① 内联 onclick 里的**名字与拼音 id 全部 esc()**（外卡 :4251 裸拼 ⇒ 名字含 `'` 直接断 JS）；
 *   ② `data-sources` JSON **必须 esc()** 后进属性（不转 `"` ⇒ 属性在第一个引号处截断 ⇒ 整条链报废）；
 *   ③ 空链也**恒写** `data-sources="[]"` ＋ `data-src-idx="0"`（外卡 P10：起点不明）。
 * @returns {string} 微卡 HTML（`<a href="#">` ＋ `data-xsd-open` ＋ `onclick` 三条开灯箱的路，
 *                  即使两条入参转义出了岔子，`data-char-name` 那条仍带得回名字）
 */
function xsdPortraitHtml(name, realm, table, stage, seed) {
  const nm = s0(name);
  const pinyin = pinyinOf(nm);
  const st = s0(stage) || 'baseline';
  const fallback = xsdAvatarFallbackSvg(nm, realm, pinyin);

  const pid = safePinyinId(pinyin);
  /* ⚠️ 2026-10-01 真机 bug（复现：同一楼里 孤月✅／苏瑶❌灰底／苏玲✅）：
   *   这道闸门原来只看 `XSD_VARIANTS` 表 ⇒ **没登记的角色直接落 SVG 剪影**，
   *   连卡自带的图都不查（`XSD_VARIANTS` 里只登记了 5 个；
   *   `suyao`／`liuhanyan`／`yufeirou`… 全都没登记 ⇒ 一律剪影）。
   *   ⇒ 改成：**表里登记过 或 卡里带了图** 都算"有立绘"。
   *   （卡里没图、表里也没登记的角色 —— 例如还没画立绘的赵无忧 —— 仍然直接落 SVG，**零 404**。） */
  const registered = Object.prototype.hasOwnProperty.call(XSD_VARIANTS, pid) || !!xsdEmbedUrl(pid) || !!xsdEmbedBigUrl(pid);
  const sources = registered ? xsdPortraitSourcesStaged(pinyin, st, table) : [];
  /* 同阶段「每张图的首选 URL」——随机抽一张当起点，并留给灯箱翻面用 */
  const group = registered ? xsdStageImages(pinyin, st, table) : [];

  const bigGroup = registered ? xsdStageImages(pinyin, st, table, XSD_BIG_EXTS[0]) : [];
  const pick = group.length ? group[xsdPickIndex(s0(seed) + '|' + nm, group.length)] : '';
  const pickIdx = Math.max(0, group.indexOf(pick));
  const first = group.length ? (pick || group[0]) : (sources.length ? sources[0] : fallback);
  const attr = ' data-sources="' + esc(JSON.stringify(sources)) + '" data-src-idx="0"'
    + ' data-alt="' + esc(JSON.stringify(bigGroup)) + '" data-alt-idx="' + esc(String(pickIdx)) + '"'
    + ' data-stage="' + esc(st) + '"';
  return '<a class="xds-pw" href="#" data-xsd-open="1"'
    + ' data-char-name="' + esc(nm) + '" data-char-realm="' + esc(s0(realm)) + '"'
    + ' data-char-id="' + esc(pinyin) + '" title="点击查看高清立绘"'
    + ' style="' + esc(XSD_PW_STYLE) + '"'
    + ' onclick="try{event.stopPropagation();}catch(e){}if(window.xsdPortrait&amp;&amp;window.xsdPortrait.openFrom){window.xsdPortrait.openFrom(this);}return false;">'
    + '<img class="xds-pi" src="' + esc(first) + '" alt="' + esc(nm) + '"'
    + ' onerror="if(window.xsdPortrait&amp;&amp;window.xsdPortrait.walkDown){window.xsdPortrait.walkDown(this);}"'
    + ' data-char-name="' + esc(nm) + '" data-char-realm="' + esc(s0(realm)) + '"'
    + attr + ' style="' + esc(XSD_PI_STYLE) + '"/>'
    + '</a>';
}

/**
 * onerror 逐级切源（照外卡 :3905–3933）：
 *   读 `data-sources`（JSON）→ 索引 +1 → 还有就换 `src`；链尽则**先 `onerror=null`** 再落 SVG。
 * ⚠️ 状态存在 **DOM 属性**里（不用闭包变量）⇒ 同一段 HTML 被谁重新插入都能从正确位置续降级。
 * ⚠️ JSON 坏掉／索引越界一律等同「链尽」，绝不抛错（抛在 onerror 里会静默吞掉）。
 * @returns {string} 本次实际写入的 src（链尽时是 SVG data URI；无 img 返回 ''）——给验收脚本用。
 */
function xsdWalkDown(imgEl) {
  try {
    if (!imgEl) return '';
    let src = '';
    let hitEnd = false;
    try {
      const raw = imgEl.getAttribute('data-sources');
      const arr = raw ? JSON.parse(raw) : [];
      const cur = parseInt(imgEl.getAttribute('data-src-idx') || '0', 10) + 1;
      if (Array.isArray(arr) && cur < arr.length) {
        imgEl.setAttribute('data-src-idx', String(cur));
        src = s0(arr[cur]);
      }
      if (!src) hitEnd = true;
    } catch (e) { hitEnd = true; }
    if (imgEl.style) { try { imgEl.style.display = ''; } catch (e) { /* 忽略 */ } }  // 顺手修掉被隐藏的图
    if (src) { imgEl.src = src; return src; }
    if (hitEnd) {
      try { imgEl.onerror = null; } catch (e) { /* 忽略 */ }   // 斩断 error 递归：SVG 自己也可能失败
      const svg = xsdAvatarFallbackSvg(
        imgEl.getAttribute('data-char-name') || '',
        imgEl.getAttribute('data-char-realm') || '',
        imgEl.getAttribute('data-char-id') || '');
      imgEl.src = svg;
      return svg;
    }
    return '';
  } catch (e) {
    console.warn(TAG, '立绘切源失败（已吞掉，图位留空）：', (e && e.message) || e);
    return '';
  }
}

/* ─────────── 灯箱（Lightbox）─────────── */
const XSD_LIGHTBOX_ID = 'xsd-lightbox-modal';

/** 灯箱挂到哪个文档：优先宿主（`window.parent.document`，脚本在 iframe 里 ⇒ 必须走 parent） */
function xsdDoc() {
  const cands = [];
  try { if (window.parent && window.parent !== window) cands.push(window.parent.document); } catch (e) { /* 跨源 */ }
  try { if (window.top && window.top !== window) cands.push(window.top.document); } catch (e) { /* 跨源 */ }
  try { cands.push(document); } catch (e) { /* 忽略 */ }
  for (const d of cands) { try { if (d && d.body) return d; } catch (e) { /* 忽略 */ } }
  const d0 = cands.find((d) => d) || null;
  /* ⚠️ B6-P4：外卡跨域时静默回落本地 document ⇒ 灯箱被关进 100% 高的 iframe 里，
   *   视觉上「点了没反应」。这里不静默 —— 落日志点破症状。 */
  if (d0 && d0 !== cands[cands.length - 1]) {
    console.warn(TAG, '[灯箱] 拿不到宿主 document.body（跨域/沙箱限制），回落本地文档 —— '
      + '灯箱会显示在消息 iframe 内，可能看起来「没反应」。');
  }
  return d0;
}

/** 灯箱状态（模块级单例）*/
const xsdBox = {
  el: null,            // 当前覆盖层节点（null ＝ 没开）
  doc: null,           // 它挂在哪个文档上（关闭时必须按**同一份**文档摘监听）
  img: null,
  listeners: [],       // 灯箱**自己**的监听 [{ t, fn, opt }] —— 关闭时逐个摘掉
  closing: false,      // 幂等闸门：ESC 与点击同时触发只跑一次退场
  leaktick: 0,         // 诊断计数：close 真的摘监听就 +1（漏摘的话它不会涨）
};
/** 常驻接线（委托监听）的条数 —— 与灯箱监听分开记：它只绑一次，永不随开关增长 */
let xsdWireCount = 0;
/** 已绑定的宿主文档标识（诊断用：区分"没绑上"与"本次沿用已有绑定"） */
let xsdWireWhere = "(未绑)";
/** 「同一个元素刚开过箱」的去重记录（见 `xsdOpenFrom` 的闸门） */
const xsdLastOpen = { el: null, t: 0 };

/** 诊断用：当前覆盖层**还挂在宿主文档上**的监听条数（正常开箱 = 1，关闭后 = 0）*/
function xsdListenersAlive() {
  let n = 0;
  for (const it of xsdBox.listeners) {
    let alive = true;
    try { alive = !!(xsdBox.doc && xsdBox.doc.body && xsdBox.doc.body.contains(xsdBox.el)); } catch (e) { alive = false; }
    if (alive) n++;
  }
  return n;
}

/** 关闭灯箱：**不论从哪条路径进来**（点覆盖层 / 按 ESC / 程序调用）都走这里 —— 这是 B6-P2 的修复点。
 *  外卡只在 ESC 分支里 removeEventListener ⇒ 点背景关掉的那些 keydown 监听永远留在宿主文档上。 */
function xsdCloseLightbox() {
  try {
    const doc = xsdBox.doc;
    const el = xsdBox.el;
    if (!el) { xsdBox.closing = false; return false; }
    if (xsdBox.closing) return false;
    xsdBox.closing = true;
    /* ① 先摘监听（**一条不剩**），再退场动画 —— 顺序反了就有窗口期 */
    for (const it of xsdBox.listeners) {
      try { if (doc && typeof doc.removeEventListener === 'function') doc.removeEventListener(it.t, it.fn, it.opt); } catch (e) { /* 忽略 */ }
    }
    xsdBox.listeners = [];
    if (xsdBox.img) { try { xsdBox.img.onerror = null; } catch (e) { /* 忽略 */ } }
    /* ② 退场：行内过渡，250ms 与 transition 对齐后再摘节点（挂哪里不确定 ⇒ 双删）*/
    try { if (el.style) el.style.opacity = '0'; } catch (e) { /* 忽略 */ }
    try {
      const kill = () => {
        try { if (el.parentNode) el.parentNode.removeChild(el); } catch (e) { /* 忽略 */ }
        try { if (doc && doc.getElementById && doc.getElementById(XSD_LIGHTBOX_ID)) doc.removeChild(doc.getElementById(XSD_LIGHTBOX_ID)); } catch (e) { /* 忽略 */ }
        xsdBox.leaktick++;
      };
      if (typeof setTimeout === 'function') setTimeout(kill, 250); else kill();
    } catch (e) { /* 忽略 */ }
    xsdBox.el = null; xsdBox.img = null; xsdBox.doc = null; xsdBox.closing = false;
    return true;
  } catch (e) {
    console.warn(TAG, '关灯箱出错（已吞掉）：', (e && e.message) || e);
    return false;
  }
}

/** 从 `el` 取属性，取不到就退到它内部的 `img`。
 *  ⚠️ 2026-09-28 第三十六轮踩到的真因就在这里：微卡把 `data-alt`／`data-alt-idx`／`data-stage`
 *     写在 **`<img>`** 上（见 `xsdPortraitHtml` 的 `attr`），而读的时候只读 `<a>` ⇒
 *     `a.alts` **恒为 undefined** ⇒ 灯箱里永远没有翻面按钮（主人原话：「角色没有翻页」）。
 *     ⇒ 所有"写在微卡里的数据"一律走这个两段式取法，别再假设它挂在哪一层。 */
function xsdAttrFrom(el, img, key) {
  try {
    const v = el && el.getAttribute ? el.getAttribute(key) : null;
    if (v !== null && v !== undefined && v !== '') return String(v);
  } catch (e) { /* 换 img */ }
  try {
    const v = img && img.getAttribute ? img.getAttribute(key) : null;
    if (v !== null && v !== undefined) return String(v);
  } catch (e) { /* 放弃 */ }
  return '';
}

/** 从微卡取参数（名字／情况／拼音 id／图源链／当前 src／**同阶段各张 alts**）——**只读**，不抛错 */
function xsdLightboxArgsFrom(el) {
  const img = (() => {
    for (const s of ['img.xds-pi', 'img.avatar-img', 'img']) {
      try { const r = el && el.querySelector ? el.querySelector(s) : null; if (r) return r; } catch (e) { /* 换下一个选择器 */ }
    }
    return null;
  })();
  let name = '', realm = '', id = '', src = '', chain = '';
  try { name = s0(el && el.getAttribute && el.getAttribute('data-char-name')); } catch (e) { /* 忽略 */ }
  try { realm = s0(el && el.getAttribute && el.getAttribute('data-char-realm')); } catch (e) { /* 忽略 */ }
  try { id = s0(el && el.getAttribute && el.getAttribute('data-char-id')); } catch (e) { /* 忽略 */ }
  if (img) {
    try { src = s0(img.getAttribute('src')); } catch (e) { /* 忽略 */ }
    try { chain = s0(img.getAttribute('data-sources')); } catch (e) { /* 忽略 */ }
    if (!name) { try { name = s0(img.getAttribute('data-char-name')); } catch (e) { /* 忽略 */ } }
    if (!realm) { try { realm = s0(img.getAttribute('data-char-realm')); } catch (e) { /* 忽略 */ } }
    if (!id) { try { id = s0(img.getAttribute('data-char-id')); } catch (e) { /* 忽略 */ } }
  }
  if (!chain) chain = xsdAttrFrom(el, img, 'data-sources');
  if (!src) { try { const i2 = img || (el && el.querySelector ? el.querySelector('img') : null); if (i2) src = s0(i2.getAttribute('src')); } catch (e) { /* 忽略 */ } }

  let alts = [];
  try { const arr = JSON.parse(xsdAttrFrom(el, img, 'data-alt') || '[]'); if (Array.isArray(arr)) alts = arr.filter(Boolean); } catch (e) { alts = []; }
  const resolveAltUrl = (u) => {
    const s = s0(u);
    if (!s) return '';
    if (/^(?:data:|https?:|\/|user\/)/.test(s)) return s;
    return xsdEmbedBigUrl(s) || xsdEmbedUrl(s) || (XSD_LOCAL_PATHS[0] + s + XSD_BIG_EXTS[0]);
  };
  alts = alts.map(resolveAltUrl).filter(Boolean);
  const altIdx = Number(xsdAttrFrom(el, img, 'data-alt-idx')) || 0;
  const stage = xsdAttrFrom(el, img, 'data-stage');
  return { name, realm, id, src, chain, alts, altIdx, stage };
}


const XSD_BIG_EXTS = ['.png', '.webp', '.jpg'];
function xsdBigSourcesFor(el) {
  const out = [];
  try {
    let id = '';
    try { id = s0(el && el.getAttribute && el.getAttribute('data-char-id')); } catch (e) { /* 忽略 */ }
    if (!id) { try { id = pinyinOf(s0(el && el.getAttribute && el.getAttribute('data-char-name'))); } catch (e) { /* 忽略 */ } }
    const pid = safePinyinId(id);
    if (!pid) { try { return JSON.parse(s0(el.getAttribute('data-sources')) || '[]'); } catch (e) { return []; } }
    /* 阶段：沿用微卡上记录的阶段（沐浴/常态不会串）。
     * ⚠️ `data-stage` 写在 **img** 上，只读 `<a>` 会永远拿到 baseline ⇒ 放大时拿错阶段的大图；
     *    改走两段式读取（`xsdAttrFrom`）。 */
    let stage = 'baseline';
    try {
      const im = el && el.querySelector ? el.querySelector('img') : null;
      stage = s0(xsdAttrFrom(el, im, 'data-stage')) || 'baseline';
    } catch (e) { /* 忽略 */ }
    const suffixes = xsdSuffixes(pid, stage);
    const push = (u) => { if (u && out.indexOf(u) === -1) out.push(u); };

    for (const sfx of suffixes) push(xsdEmbedBigUrl(pid + sfx));
    for (const sfx of suffixes) {
      for (const dir of XSD_LOCAL_PATHS) for (const ext of XSD_BIG_EXTS) push(dir + pid + sfx + ext);
    }
    for (const sfx of suffixes) push(xsdEmbedUrl(pid + sfx));
    const cloud = cloudUrlFor(pid);
    if (cloud) push(cloud);
    /* 兜底：沿用微卡原链（保证链上一定有东西） */
    try { for (const u of JSON.parse(s0(el.getAttribute('data-sources')) || '[]')) push(u); } catch (e) { /* 忽略 */ }
  } catch (e) { /* 忽略 */ }
  return out;
}

/** 微卡 → 开灯箱（内联 onclick／`data-xsd-open` 委托都走这里）*/
function xsdOpenFrom(el) {
  if (!el || xsdMobileDisposed) return false;

  const now = (typeof Date !== 'undefined' && Date.now) ? Date.now() : 0;
  try {
    if (now && xsdLastOpen.el === el && (now - xsdLastOpen.t) < 400) return true;
  } catch (e) { /* 忽略 */ }
  const a = xsdLightboxArgsFrom(el);

  let chain = a.chain;
  try {
    const big = xsdBigSourcesFor(el);
    if (big && big.length) chain = JSON.stringify(big);
  } catch (e) { /* 用原链 */ }
  /* 大图链只放本地大图＋云端：翻面仍按**同阶段各张**（alts 不变） */
  const alts = a.alts || [];
  const want = alts[Math.max(0, Math.min(alts.length - 1, Number(a.altIdx) || 0))] || '';
  const ok = xsdOpenLightbox(a.name, a.realm, big2first(chain, want), a.id, chain, JSON.stringify(alts), a.altIdx);
  try { if (ok) { xsdLastOpen.el = el; xsdLastOpen.t = (typeof Date !== 'undefined' && Date.now) ? Date.now() : 0; } } catch (e) { /* 忽略 */ }
  return ok;
}

/** 取链里**该先显示**的那张：优先与面板当前那张对应的大图，其次第一条大图，最后第一条。
 *  `want` 是微卡 `data-alt[data-alt-idx]`（面板上正显示的那张的大图 URL）。 */
function big2first(chainJson, want) {
  try {
    const arr = JSON.parse(chainJson || '[]');
    if (!arr.length) return '';
    const w = s0(want);
    if (w && arr.indexOf(w) >= 0) return w;
    const big = arr.find((u) => /\.png(\?|$)/i.test(u) || /\.webp(\?|$)/i.test(u));
    return big || arr[0];
  } catch (e) { return ''; }
}

/** 灯箱里「翻面」的实现：换 `src` ＋ 更新计数。
 *  `alts` 是同阶段各张图的首选 URL（来自 `data-alt`）；只有 1 张时按钮自动隐藏。 */
function xsdMakeFlipper(doc, big, counter, alts, startIdx) {
  const list = Array.isArray(alts) ? alts.filter(Boolean) : [];
  if (list.length < 2) return null;
  let i = Math.max(0, Math.min(list.length - 1, Number(startIdx) || 0));
  const show = () => {
    try { big.src = list[i]; } catch (e) { /* 忽略 */ }
    try { counter.textContent = (i + 1) + ' / ' + list.length; } catch (e) { /* 忽略 */ }
  };
  const step = (d) => { i = (i + d + list.length) % list.length; show(); };
  show();
  return { step, count: list.length, index: () => i };
}

/** 灯箱里的圆形小按钮（上一张／下一张） */
function xsdFlipBtn(doc, label, title) {
  const b = doc.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.title = title;
  b.style.cssText = 'width:28px;height:28px;border-radius:50%;cursor:pointer;padding:0;line-height:1;'
    + 'background:linear-gradient(145deg,rgba(212,175,55,0.28),rgba(140,109,31,0.18));'
    + 'border:1px solid rgba(212,175,55,0.55);color:#f5e6c8;font-size:14px;font-weight:700;';
  return b;
}

/** 开灯箱：全屏大图。
 *  ① 覆盖层**点击关闭**；② ESC 关闭；③ **关闭时统一摘掉所有监听**（点关 / ESC 关 / 程序关，一条路径都不漏）；
 *  ④ 大图自己重走同一条链（`walkDown`），链尽落 SVG 印章。
 *  ⚠️ 绝不向宿主文档追加全局 `<style>`（B9/P9）：全部元素 `createElement` ＋ 行内 `cssText`，关闭即销毁。
 *  ⚠️ 覆盖层用 `el.onclick = ...`（属性，不是 addEventListener）⇒ 连开关 N 次也不会累积监听。 */
function xsdOpenLightbox(name, realm, src, id, chainJson, altJson, altStartIdx) {
  try {
    const doc = xsdDoc();
    if (!doc || !doc.body || typeof doc.createElement !== 'function') {
      console.warn(TAG, '[灯箱] 没有可用的宿主文档，放弃开箱（面板文字照旧）。');
      return false;
    }
    xsdCloseLightbox();                              // 同一时刻只允许一个
    try { if (doc.getElementById && doc.getElementById(XSD_LIGHTBOX_ID)) doc.removeChild(doc.getElementById(XSD_LIGHTBOX_ID)); } catch (e) { /* 忽略 */ }

    const nm = s0(name) || '无名';
    const overlay = doc.createElement('div');
    overlay.id = XSD_LIGHTBOX_ID;
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(5,7,10,0.9);'
      + 'backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);z-index:99999999;display:flex;'
      + 'flex-direction:column;justify-content:center;align-items:center;cursor:zoom-out;opacity:0;'
      + 'transition:opacity 0.25s ease-out;box-sizing:border-box;padding:16px;';
    const content = doc.createElement('div');
    content.style.cssText = 'position:relative;max-width:94vw;max-height:94vh;display:flex;flex-direction:column;'
      + 'align-items:center;gap:10px;box-sizing:border-box;';
    const bar = doc.createElement('div');
    bar.style.cssText = 'display:flex;align-items:center;gap:10px;background:linear-gradient(145deg,'
      + 'rgba(22,26,36,0.95),rgba(13,16,23,0.95));padding:8px 18px;border-radius:22px;'
      + 'border:1px solid rgba(212,175,55,0.45);box-shadow:0 4px 20px rgba(0,0,0,0.55);'
      + 'box-sizing:border-box;max-width:94vw;';
    const nameSpan = doc.createElement('span');
    nameSpan.style.cssText = 'font-size:15px;font-weight:700;color:#f5e6c8;font-family:serif;letter-spacing:1px;';
    nameSpan.textContent = nm;                        // ⚠️ textContent，不拼 HTML：名字里的 < 就是文字
    bar.appendChild(nameSpan);
    if (s0(realm)) {
      const rs = doc.createElement('span');
      rs.style.cssText = 'font-size:11.5px;color:#e6c96b;background:rgba(190,18,60,0.35);'
        + 'border:1px solid rgba(212,175,55,0.5);padding:2px 10px;border-radius:10px;font-weight:600;';
      rs.textContent = '【' + s0(realm) + '】';
      bar.appendChild(rs);
    }
    const tip = doc.createElement('span');
    tip.style.cssText = 'font-size:11px;color:#94a3b8;';
    tip.textContent = '（点击任意处或按 ESC 关闭）';
    bar.appendChild(tip);

    /* ── 翻面（2026-09-28 主人要求）：同阶段那几张来回翻，← → 键也行 ──
     *   按钮的 onclick 里**只读变量**，真正的 `flip` 在 big 建好之后才装配 ⇒ 先声明后赋值。 */
    let alts = [];
    try { const a2 = JSON.parse(altJson || '[]'); if (Array.isArray(a2)) alts = a2.filter(Boolean); } catch (e) { alts = []; }
    let flip = null;
    let counter = null;
    const flipBox = { prev: null, next: null };
    if (alts.length > 1) {
      flipBox.prev = xsdFlipBtn(doc, '‹', '上一张（← 键）');
      flipBox.next = xsdFlipBtn(doc, '›', '下一张（→ 键）');
      counter = doc.createElement('span');
      counter.style.cssText = 'font-size:11px;color:#c9a24a;font-variant-numeric:tabular-nums;letter-spacing:1px;';
      counter.textContent = '1 / ' + alts.length;
      bar.appendChild(flipBox.prev); bar.appendChild(counter); bar.appendChild(flipBox.next);
      /* 点击按钮不能连带把覆盖层点关（覆盖层是 cursor:zoom-out ＋ onclick 关闭）*/
      const stop = (fn) => (ev) => { try { ev.stopPropagation(); } catch (e) { /* 忽略 */ } fn(); };
      flipBox.prev.onclick = stop(() => { if (flip) flip.step(-1); });
      flipBox.next.onclick = stop(() => { if (flip) flip.step(1); });
      tip.textContent = '（← → 翻面 ｜ 点击空白或 ESC 关闭）';
    }

    const big = doc.createElement('img');
    big.style.cssText = 'max-width:min(560px,94vw);max-height:74vh;border-radius:12px;'
      + 'border:2px solid rgba(212,175,55,0.55);box-shadow:0 25px 60px rgba(0,0,0,0.85),'
      + '0 0 30px rgba(212,175,55,0.22);object-fit:contain;background:#0d111a;display:block;';
    big.alt = nm;
    /* 大图自己重走同一条链：链透传进 data-sources，链尽同样落 SVG（灯箱里也绝不露裂图）*/
    try {
      const arr = JSON.parse(chainJson || '[]');
      if (Array.isArray(arr) && arr.length) {
        big.setAttribute('data-sources', JSON.stringify(arr));
        big.setAttribute('data-src-idx', '0');
      } else {
        big.setAttribute('data-sources', '[]');
        big.setAttribute('data-src-idx', '0');
      }
    } catch (e) {
      try { big.setAttribute('data-sources', '[]'); big.setAttribute('data-src-idx', '0'); } catch (e2) { /* 忽略 */ }
    }
    big.setAttribute('data-char-name', nm);
    big.setAttribute('data-char-realm', s0(realm));
    big.setAttribute('data-char-id', safePinyinId(id) || pinyinOf(nm));
    const handleBigError = function () {
      try {
        if (xsdWalkDown(big)) return;
        const cur = s0(big.getAttribute('src'));
        const m = String(cur).match(/([a-z0-9_-]+)(?:\.[a-z0-9]+)?$/i);
        const base = m ? m[1] : '';
        const u = base ? (xsdEmbedBigUrl(base) || xsdEmbedUrl(base)) : '';
        if (u && cur !== u) {
          big.setAttribute('src', u);
          return;
        }
        big.onerror = null;
        big.setAttribute('src', xsdAvatarFallbackSvg(s0(big.getAttribute('data-char-name') || big.getAttribute('alt')), s0(big.getAttribute('data-char-realm')), s0(big.getAttribute('data-char-id'))));
      } catch (e) {
        try { big.onerror = null; } catch (e2) {}
      }
    };
    big.onerror = handleBigError;
    big.src = s0(src) || xsdAvatarFallbackSvg(nm, realm, safePinyinId(id) || pinyinOf(nm));

    content.appendChild(bar);
    content.appendChild(big);
    overlay.appendChild(content);
    doc.body.appendChild(overlay);

    /* 装配翻面（big 已存在）：起点＝微卡上那一张的序号，翻面即换 `src` ＋ 更新计数。
     * 三级定位：① 当前 src 就在 `alts` 里 ⇒ 用它；② 否则用微卡给的 `data-alt-idx`；
     * ③ 再否则 0。**必须"先翻面再换大图链"** —— 大图链的 src 是 `.png`，而 `alts` 里通常也是
     * `.png` 首选，两者能对上；对不上时靠 ② 兜住（这正是上一版一直没有的兜底）。 */
    if (alts.length > 1) {
      let startIdx = 0;
      try { const cur = s0(src).split('?')[0]; const at = alts.indexOf(cur); if (at >= 0) startIdx = at; } catch (e) { startIdx = 0; }
      if (!startIdx) { const n = Number(altStartIdx); if (isFinite(n) && n >= 0 && n < alts.length) startIdx = n; }
      flip = xsdMakeFlipper(doc, big, counter, alts, startIdx);
    }

    /* 关闭：**只认覆盖层一点**（外卡 P3 的四处 onclick 一律去掉）⇒ 监听总数恒定、语义单一 */
    overlay.onclick = () => { xsdCloseLightbox(); };

    /* ESC / ← / →：登记在案，关闭时统一摘（B6-P2 的修复点）*/
    const escHandler = (ev) => {
      try {
        if (!ev) return;
        if (ev.key === 'Escape' || ev.key === 'Esc' || ev.keyCode === 27) { xsdCloseLightbox(); return; }
        if (flip) {
          if (ev.key === 'ArrowLeft' || ev.keyCode === 37) { ev.preventDefault(); flip.step(-1); }
          else if (ev.key === 'ArrowRight' || ev.keyCode === 39) { ev.preventDefault(); flip.step(1); }
        }
      } catch (e) { /* 忽略 */ }
    };
    if (typeof doc.addEventListener === 'function') {
      doc.addEventListener('keydown', escHandler);
      xsdBox.listeners.push({ t: 'keydown', fn: escHandler, opt: undefined });
    }
    /* 「点覆盖层关闭」在**有的宿主**里 click 事件被外层拦截 ⇒ 补一条 pointerdown/mousedown 兜底；
     * 两条都登记在案，关闭时一起摘。 */
    const downHandler = (ev) => {
      try { if (ev && ev.target === overlay) xsdCloseLightbox(); } catch (e) { /* 忽略 */ }
    };
    if (typeof doc.addEventListener === 'function') {
      doc.addEventListener('mousedown', downHandler);
      xsdBox.listeners.push({ t: 'mousedown', fn: downHandler, opt: undefined });
    }

    xsdBox.el = overlay; xsdBox.doc = doc; xsdBox.img = big; xsdBox.closing = false;

    /* 入场：先 append 再置 opacity=1 触发过渡（外卡 :4045–4049）*/
    if (typeof setTimeout === 'function') {
      setTimeout(() => { try { overlay.style.opacity = '1'; } catch (e) { /* 忽略 */ } }, 15);
    } else {
      try { overlay.style.opacity = '1'; } catch (e) { /* 忽略 */ }
    }
    return true;
  } catch (e) {
    console.warn(TAG, '开灯箱出错（已吞掉，不影响面板）：', (e && e.message) || e);
    return false;
  }
}

/** 点立绘（事件委托）：面板里所有 `[data-xsd-open]` 的点击都从这一条路走 */
function xsdPortraitClick(ev) {
  try {
    if (xsdMobileDisposed || (ev && ev.type === 'mousedown' && !xsdMouseHoverEvent(ev, ev.target))) return;
    let n = ev && ev.target;
    /* ⚠️ 不用 closest：跨 realm 时 target 可能是别的 realm 的节点，closest 会抛/失效
     *    ⇒ 手动沿 parentNode 上溯（纯属性读取，跨 realm 也安全）。 */
    let guard = 0;
    while (n && guard++ < 64) {
      if (n.getAttribute && n.getAttribute('data-xsd-open')) {
        if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
        /* ⚠️ **这条监听是 capture 阶段注册的**（`addEventListener('click', fn, true)`），
         *   所以它**先于**元素自己的 `onclick` 跑；不在它这里拦住冒泡，元素上的内联／闭包 onclick
         *   会紧接着再跑一次 ⇒ **同一个点击开两次箱**（实测 `appendChild` 计数＝2，keydown 监听
         *   注册两份，先注册的那份闭包握着已被换掉的 flip/counter ⇒ 方向键"没反应"）。
         *   2026-09-28 第三十六轮实测抓到，别再删这一行。 */
        if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
        xsdOpenFrom(n);
        return true;
      }
      n = n.parentNode;
    }
  } catch (e) { console.warn(TAG, '立绘点击处理失败（已吞掉）：', (e && e.message) || e); }
  return false;
}

/** 接线：把立绘入口写进**本 realm**（内联 onclick 由沙箱自己的 realm 求值）＋ 面板根元素上的委托监听。
 *  ⚠️ 全程 typeof 保护，**加载时绝不抛错**（本脚本跑在酒馆助手 iframe 里，任何异常都会白填面板）。 */
const XSD_PORTRAIT_API = {
  version: 'v2.3',
  pinyin: XSD_PINYIN,
  pinyinOf,
  sources: xsdPortraitSources,
  sourcesFor: xsdPortraitSourcesFor,
  cloudUrlFor,
  fallbackSvg: xsdAvatarFallbackSvg,
  walkDown: xsdWalkDown,
  openFrom: xsdOpenFrom,
  openLightbox: xsdOpenLightbox,
  closeLightbox: xsdCloseLightbox,
  listenersAlive: xsdListenersAlive,
  diag: () => ({
    version: 'v2.3',
    pinyinCount: Object.keys(XSD_PINYIN).length,
    localPaths: XSD_LOCAL_PATHS.length,
    cloudKeys: Object.keys(XSD_CLOUD_URLS).length,
    open: !!xsdBox.el,
    listenersAlive: xsdListenersAlive(),
    wireListeners: xsdWireCount, wireWhere: xsdWireWhere,
    closes: xsdBox.leaktick,
  }),
};

/**
 * 立绘接线（2026-09-28 第三十轮重写）：
 *   ① **先绑宿主文档的点击监听**（真机＝父窗口 document），拿不到才退本层；click ＋ mousedown 双绑；
 *   ② window 上的 API 各自独立 try（跨源 window 会抛，不能让它拖垮监听）；
 *   ③ **自检行画进面板页脚** —— 出问题时一眼看得见，不用猜日志去哪了。
 * 命名保持 `wirePortrait`：事件钩子会重复调用它（换楼重绑），幂等（重复绑同一函数无副作用）。
 */

function xsdWireInline(root) {
  let n = 0;
  try {
    const scope = root || (typeof DOC === 'function' ? DOC() : document);
    if (!scope || !scope.querySelectorAll) return 0;
    const list = scope.querySelectorAll('[data-xsd-open]');
    for (const el of list) {
      if (xsdUiInlineNodes.has(el)) continue;
      try {
        /* ⚠️ 必须 `stopPropagation`：内联 onclick 与**宿主 document 上的委托监听**会同时命中同一个点击
         *   ⇒ `xsdOpenFrom` 跑两次 ⇒ **开两次箱**（实测：`appendChild` 计数 = 2），
         *   keydown（ESC／←／→）监听也跟着注册两份，**先注册的那份闭包里握着已经被换掉的
         *   flip/counter/big** ⇒ 按方向键"没反应"。2026-09-28 第三十六轮实测抓到。 */
        el.onclick = function (ev) {
          try { if (ev && ev.preventDefault) ev.preventDefault(); if (ev && ev.stopPropagation) ev.stopPropagation(); } catch (e) { /* 忽略 */ }
          xsdOpenFrom(el); return false;
        };
        /* 兜底：有的宿主会吞 click，用 mousedown 再挂一条（同样要拦住冒泡） */
        el.onmousedown = function (ev) {
          if (!xsdMouseHoverEvent(ev, el)) return;
          try { if (ev && ev.preventDefault) ev.preventDefault(); if (ev && ev.stopPropagation) ev.stopPropagation(); } catch (e) { /* 忽略 */ }
          xsdOpenFrom(el); return false;
        };
        el.style.cursor = 'zoom-in';
        el.setAttribute('data-xsd-wired', '1');
        xsdUiInlineNodes.add(el);
        n += 1;
      } catch (e) { /* 单个失败不影响其余 */ }
    }
  } catch (e) { /* 忽略 */ }
  return n;
}

/* ⚠️ 2026-09-29：**开场白里的「读《极乐引》」按钮**（`[data-xsdsend]`）。
 *   为什么把逻辑放这儿、不放正文的 onclick 里：正文里带 `{}` 的脚本会被 markdown 当代码块**吐成源码**
 *   （主人实测截图：整段 onclick 源码显示在开场白里）。
 *   做法：正文只留一个干净 `<button data-xsdsend="…">`；点击由这里的**事件委托**接住。
 *   用法：先拿宿主上下文跑 `/send <文本>`（＝以玩家身份发一条消息）；退路是填进输入框并提示自按回车。 */
function xsdQuickAct(ev) {
  try {
    const el = ev && ev.target && ev.target.closest ? ev.target.closest('[data-xsdsend]') : null;
    if (!el) return;
    const msg = String(el.getAttribute('data-xsdsend') || '').trim();
    if (!msg) return;
    if (ev.preventDefault) ev.preventDefault();
    if (ev.stopPropagation) ev.stopPropagation();
    const ctxOf = () => {
      const cands = [];
      try { cands.push(window); } catch (e) { /* 忽略 */ }
      try { cands.push(window.parent); } catch (e) { /* 忽略 */ }
      try { cands.push(window.top); } catch (e) { /* 忽略 */ }
      for (const w of cands) {
        try {
          if (w && w.SillyTavern && typeof w.SillyTavern.getContext === 'function') return w.SillyTavern.getContext();
        } catch (e) { /* 跨域，换下一个 */ }
      }
      return null;
    };
    const fillInput = () => {
      const cands = [];
      try { cands.push(document); } catch (e) { /* 忽略 */ }
      try { cands.push(window.parent.document); } catch (e) { /* 忽略 */ }
      try { cands.push(window.top.document); } catch (e) { /* 忽略 */ }
      for (const D of cands) {
        try {
          const ta = D && D.getElementById('send_textarea');
          if (ta) {
            ta.value = msg; ta.focus();
            try { ta.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) { /* 忽略 */ }
            try { alert('已把「' + msg + '」填进输入框 —— 请自己按回车发送（没自动发出）。'); } catch (e) { /* 忽略 */ }
            return true;
          }
        } catch (e) { /* 忽略 */ }
      }
      try { navigator.clipboard.writeText(msg); alert('已复制「' + msg + '」—— 粘进输入框发送。'); } catch (e) { /* 忽略 */ }
      return false;
    };
    try {
      const c = ctxOf();
      if (c && typeof c.executeSlashCommands === 'function') { c.executeSlashCommands('/send ' + msg); return; }
    } catch (e) { /* 落到退路 */ }
    fillInput();
  } catch (e) { /* 整个动作不许把面板带崩 */ }
}

/** 名器玄鉴弹窗委托处理器（独立具名函数，保证引用稳定，幂等绑定） */
function xsdRelicDelegate(e) {
  if (xsdMobileDisposed || !e || e.type !== 'click') return;
  const relicEl = e.target && e.target.closest && (e.target.closest('[data-xds-relic]') || e.target.closest('.xh-relic-popover'));
  if (relicEl) {
    let rid = relicEl.getAttribute('data-xds-relic');
    if (!rid && relicEl.querySelector) {
      const child = relicEl.querySelector('[data-xds-relic]');
      if (child) rid = child.getAttribute('data-xds-relic');
    }
    if (rid) {
      e.stopPropagation();
      try {
        if (typeof xsdOpenRelicModal === 'function') xsdOpenRelicModal(rid);
        else if (typeof window !== 'undefined' && window.XsdHUD && window.XsdHUD.openRelicModal) window.XsdHUD.openRelicModal(rid);
        else if (typeof window !== 'undefined' && window.xsdOpenRelicModal) window.xsdOpenRelicModal(rid);
      } catch (err) {}
    }
  }
}

function wirePortrait() {
  if (xsdMobileDisposed) return;
  const report = { bound: 0, where: '(未绑)', targets: 0, fails: [] };
  const bindOn = (D, label) => {
    if (!D || typeof D.addEventListener !== 'function') { report.fails.push(label + ':无 addEventListener'); return false; }
    try {
      if (!xsdMobileDisposed && !xsdRelicDocBindings.has(D)) {
        D.addEventListener('click', xsdPortraitClick, true);
        D.addEventListener('click', xsdRelicDelegate, true);
        // 原生 click 已统一鼠标、触屏和键盘；不在抬手时抢先展开。
        try { D.addEventListener('mousedown', xsdPortraitClick, true); } catch (e) { /* 有的宿主吞 click，补一条 */ }
        try { D.addEventListener('click', xsdQuickAct, true); } catch (e) { report.fails.push(label + ':xsdQuickAct'); }
        try { D.__xsdRelicDelegateBound = true; } catch (e) {}
        xsdRelicDocBindings.set(D, [
          ['click', xsdPortraitClick, true], ['click', xsdRelicDelegate, true],
          ['mousedown', xsdPortraitClick, true], ['click', xsdQuickAct, true],
        ]);
        xsdWireCount += 1;
        xsdWireWhere = label;
        report.bound += 1;
      }
      report.where = label;
      return true;
    } catch (e) { report.fails.push(label + ':' + ((e && e.message) || e)); return false; }
  };
  let D = null;
  try { D = (typeof DOC === 'function') ? DOC() : null; } catch (e) { report.fails.push('DOC 抛错'); }
  if (!bindOn(D, D === document ? '本层 document' : '宿主 document')) {
    try { bindOn(document, '本层 document（回落）'); } catch (e) { report.fails.push('回落也失败'); }
  }
  const seen = [];
  const tryWin = (get, label) => {
    let w = null;
    try { w = get(); } catch (e) { report.fails.push(label + ':取 window 失败'); return; }
    if (!w || seen.includes(w)) return;
    seen.push(w);
    const put = (k, v) => { try { w[k] = v; } catch (e) { report.fails.push(label + '.' + k); } };
    put('xsdPortrait', XSD_PORTRAIT_API);
    put('handleXsdAvatarError', xsdWalkDown);
    put('openXsdLightboxFromWrap', xsdOpenFrom);
    try { if (typeof w.closeXsdLightbox !== 'function') w.closeXsdLightbox = xsdCloseLightbox; } catch (e) { report.fails.push(label + '.closeXsdLightbox'); }
    report.targets += 1;
  };
  tryWin(() => window, 'window');
  tryWin(() => window.parent, 'parent');
  tryWin(() => window.top, 'top');
  try {
    const D2 = (typeof DOC === 'function') ? DOC() : document;
    const panels = D2 && D2.querySelectorAll ? D2.querySelectorAll('[data-xds-panel]') : [];
    const imgs = D2 && D2.querySelectorAll ? D2.querySelectorAll('[data-xsd-open]') : [];
    const inlined = xsdWireInline(null);
    const line = '⚙ 点击接线：自包含=' + inlined + '｜委托=' + report.bound + '(' + report.where + ')｜立绘入口=' + imgs.length + '｜面板=' + panels.length + '｜API窗=' + report.targets;
    for (const p of panels) {
      let foot = p.querySelector('[data-xds-selfcheck]');
      if (!foot && D2.createElement) {
        foot = D2.createElement('div');
        foot.setAttribute('data-xds-selfcheck', '1');
        foot.style.cssText = 'font-size:11px;line-height:1.7;color:#ffd479;background:rgba(150,44,30,.22);border:1px solid rgba(200,150,90,.45);border-radius:3px;padding:4px 8px;margin-top:6px;letter-spacing:.3px;word-break:break-all;';
        p.appendChild(foot);
      }
      if (foot) foot.textContent = line;
    }
  } catch (e) { /* 自检画不上不影响功能 */ }
  console.log(TAG, '[立绘接线] 委托监听=' + (xsdWireCount > 0
      ? ('已绑 ' + xsdWireCount + ' 条' + (report.bound ? '（本次新绑 ' + report.bound + ' 条）' : '（沿用已有绑定，幂等跳过）'))
      : '未绑')
    + '（' + (xsdWireCount > 0 ? xsdWireWhere : '尚未绑上') + '，wireCount=' + xsdWireCount + '）'
    + '｜API 挂到 ' + report.targets + ' 个 window'
    + (report.fails.length ? '｜失败项：' + report.fails.join('、') : '｜无失败项'));
}
wirePortrait();

/** API 探测记录（诊断用）：看清 getChatMessages 到底返回了什么 */
let apiProbe = null;

/**
 * 取某条消息的**原始正文**。
 * ⚠️ 关键：正则把 <Status_block>…</Status_block> 整段替换成了面板 HTML，
 *    所以 `.mes_text` 里**已经没有原文**了（v2.0 的第二个 bug）。
 *     ① 主路：酒馆助手的 getChatMessages —— 返回**未经正则替换**的原始消息
 *     ② 回退：面板里用 $& 藏的那份原文副本（<pre hidden data-xds-src>）
 *     ③ 兜底：DOM 正文（多半读不到标签，只能靠"无标签"退化解析）
 */
function textOf(mesEl, messageId) {
  try {
    if (typeof getChatMessages === 'function' && messageId !== undefined && messageId !== null) {
      const msgs = getChatMessages(messageId);
      const m = Array.isArray(msgs) ? (msgs[msgs.length - 1] ?? msgs[0]) : msgs;
      const t = m && (m.message ?? m.mes);
      apiProbe = { got: typeof t, len: String(t ?? '').length, keys: m && typeof m === 'object' ? Object.keys(m) : null };
      if (t && String(t).includes('Status_block')) return { text: String(t), from: 'getChatMessages' };
    }
  } catch (e) { apiProbe = { err: String((e && e.message) || e) }; }

  const hidden = mesEl.querySelector('[data-xds-src]');
  if (hidden) {
    const t = hidden.textContent || '';
    if (t.includes('Status_block')) return { text: t, from: '<pre hidden>' };
    if (t.trim()) return { text: t, from: '<pre hidden>（标签被消毒剥离，退化解析）' };
  }

  const el = mesEl.querySelector('.mes_text');
  return { text: el ? (el.textContent || '') : '', from: 'DOM（多半已无原文）' };
}

/** 取顶层宿主文档（供弹窗挂载，防止被 iframe 截断） */
function xsdHostUiDoc(fallback) {
  let d = fallback || DOC() || document;
  try {
    let w = d.defaultView;
    for (let i = 0; w && i < 8; i++) {
      const p = w.parent;
      if (!p || p === w) break;
      if (!p.document || !p.document.body) break;
      d = p.document; w = p;
    }
  } catch (e) { /* 跨源时留在最近的可访问文档 */ }
  return d;
}

/** 读 stat_data 台账（与 `状态机.js` 同一条 API：聊天层打底、消息层覆盖；失败返回 null） */
function xsdStatData() {
  try {
    const gv = (typeof getVariables === 'function') ? getVariables : null;
    if (!gv) return null;
    const pick = (opt) => { try { const v = gv(opt); return (v && typeof v === 'object' && !Array.isArray(v)) ? v : null; } catch (e) { return null; } };
    const cv = pick({ type: 'chat' }), mv = pick({ type: 'message', message_id: -1 });
    const cs = (cv && cv.stat_data && typeof cv.stat_data === 'object') ? cv.stat_data : null;
    const ms = (mv && mv.stat_data && typeof mv.stat_data === 'object') ? mv.stat_data : null;
    if (!cs && !ms) return null;
    const stat = Object.assign({}, cs || {}, ms || {});
    const ck = (cs && cs.known && typeof cs.known === 'object') ? cs.known : null;
    const mk = (ms && ms.known && typeof ms.known === 'object') ? ms.known : null;
    if (ck || mk) stat.known = Object.assign({}, ck || {}, mk || {});
    return stat;
  } catch (e) { return null; }
}

function xsdKnown() {
  const s = xsdStatData();
  return (s && s.known && typeof s.known === 'object') ? s.known : null;
}

/** 身份专属初始随身物品（供纳戒面板显示与降级兜底） */
function defaultInventoryFor(identity) {
  const id = String(identity || '').trim();

  const norm = (arr) => arr.map((it) => ({ ...it, count: Math.max(1, parseInt(it.count, 10) || 1) }));
  if (id === '赵无忧') {
    return norm([
      { name: '醉春风', desc: '墨山道佳酿两坛，酒香浓醇，可解忧畅怀。', full: '墨山道坊市所出的上等灵酿「醉春风」，甘冽清醇，入口温润，为赵无忧探望红缨师姐特备。', count: 2 },
      { name: '墨山道佩剑', desc: '墨山道内门弟子制式青锋剑，温润坚韧。', full: '墨山道制式飞剑，通体以青灵寒铁锻打，刻有墨山宗纹，注入金丹灵力可御剑行空。' }
    ]);
  }
  if (id === '焚欲殿主') {
    return [
      { name: '天姝令（焚欲）', desc: '天姝会焚欲殿殿主信物，正面刻曼妙天女，背面显墨山道。', full: '非金非木，触手冰凉。受极乐太子敕封之信物，可御使会中蛊火与死士，内蕴天姝秘力。' },
      { name: '《燎原蛊火诀》', desc: '极乐太子赐下的暴虐火道真法，以蛊引火。', full: '直指元婴大道的双修采补火诀，能以本源蛊火种入炉鼎，焚其神智、助其情动。' },
      { name: '《极乐引》', desc: '会中通传的名器总录，详载四域仙姝名器体质。', full: '软皮所制，记载落红、情动、沉沦三境之妙，标有墨山道叶红缨等绝品名器之线索。' }
    ];
  }
  if (id === '欢喜殿主') {
    return [
      { name: '天姝令（欢喜）', desc: '天姝会欢喜殿殿主信物，正面刻欢喜天女，背面显墨山道。', full: '极乐太子敕封信物，可号令欢喜殿魔僧与暗桩，调运南域寺院香火暗网。' },
      { name: '《旖旎梵音心经》', desc: '极乐太子赐下的淫靡佛门密经，梵音惑心。', full: '披着慈悲佛光的采补邪功，诵经如闻仙乐，最擅攻破女修心防，化其元阴为佛门甘露。' },
      { name: '《极乐引》', desc: '会中通传的名器总录，详载四域仙姝名器体质。', full: '软皮所制，记载落红、情动、沉沦三境之妙，标有楚灵夜「般若菩提菊」等妙相。' },
      { name: '积云檀木念珠', desc: '积云古寺方丈随身念珠，温润带香。', full: '百年雷击檀木打磨而成，常年受香火熏染，可遮蔽一身魔气、伪作慈悲高僧。' }
    ];
  }
  if (id === '浊龙殿主') {
    return [
      { name: '天姝令（浊龙）', desc: '天姝会浊龙殿殿主信物，正面刻九龙盘桓，背面显墨山道。', full: '极乐太子敕封信物，可调动皇朝暗卫与浊龙殿死士，威慑朝野。' },
      { name: '《极乐龙体诀》', desc: '以皇朝至尊龙气御万欲的霸道体修功法。', full: '龙气灌体、固本培元，能以至阳皇龙霸气彻底征服纯阴至寒体质，专克九幽玄阴脉。' },
      { name: '《极乐引》', desc: '会中通传的名器总录，详载四域仙姝名器体质。', full: '软皮所制，记载落红、情动、沉沦三境之妙，点明墨山道孤月「九幽玄阴穴」一阶未开。' },
      { name: '真龙暗卫密符', desc: '天龙皇朝九皇子私印密符，可调度死士南下。', full: '纯金镂空盘龙符节，持有者可秘密调度皇都死士暗线，执行渗透与截杀。' }
    ];
  }
  if (id === '魂欢殿主') {
    return [
      { name: '天姝令（魂欢）', desc: '天姝会魂欢殿殿主信物，正面刻粉色水滴邪徽。', full: '极乐太子敕封信物，执掌天姝会辨识名器之秘法与北域幽鬼坊市暗线。' },
      { name: '《情丝化灵录》', desc: '鬼医病相思主修的魔道密法，情丝寄魂。', full: '能化无形情愫为万千细密情丝，深入经脉骨髓，潜移默化篡改道心，最擅操控仙子心智。' },
      { name: '《极乐引》', desc: '会中通传的名器总录，详载四域仙姝名器体质。', full: '软皮所制，记载落红、情动、沉沦三境之妙，记有北域花芷凝「梅蕊穴」之秘。' },
      { name: '百毒百草囊', desc: '鬼医随身药囊，内藏无数奇诡灵蛊与迷情秘药。', full: '纳戒级灵丝皮囊，盛装幽冥蚀骨散、软筋融魂液及各类独门毒蛊，伤人于无形。' }
    ];
  }
  return [
    { name: '醉春风', desc: '南域佳酿两坛，酒香浓醇，可解忧畅怀。', full: '南域仙坊颇具盛名的上等灵酿「醉春风」，甘冽清醇，入口温润，最解行者客愁，为云游修士随身常备佳品。' },
    { name: '随身青锋剑', desc: '入世防身佩剑，剑身清寒。', full: '随身淬炼多年的上好青锋剑，寒芒如雪，指使如臂，无论御剑凌风或近身防卫皆得心应手。' },
    { name: '《极乐引》残篇', desc: '记载天下诸般名器与双修造化之无上秘录。', full: '机缘所得的古旧皮质残卷，详载天下至阴名器之玄奥，能辨阴阳造化，推演仙姝命途。' }
  ];
}

/** 纳戒物品详情弹窗（点击物品名查看完整效果与来历） */
function xsdOpenItemModal(item, userDoc) {
  if (xsdMobileDisposed || !item) return false;
  const doc = xsdHostUiDoc((typeof DOC === 'function' ? DOC() : null) || userDoc || document);
  if (!doc || !doc.body) return false;

  const oldModal = doc.getElementById('xsd-item-modal');
  if (oldModal) { try { oldModal.remove(); } catch (e) {} }

  try { if (typeof ensureStyleInjected === 'function') ensureStyleInjected(doc); else if (typeof XsdHUD !== 'undefined' && XsdHUD.ensureStyleInjected) XsdHUD.ensureStyleInjected(doc); } catch (e) {}

  const modal = doc.createElement('div');
  modal.id = 'xsd-item-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'xsd-item-modal-title');
  modal.style.cssText = 'position:fixed!important;inset:0!important;background:rgba(0,0,0,0.85)!important;backdrop-filter:blur(6px)!important;-webkit-backdrop-filter:blur(6px)!important;z-index:9999999!important;display:flex!important;justify-content:center!important;align-items:center!important;padding:16px!important;box-sizing:border-box!important;';

  const itName = item.name || '随身法宝';
  const itDesc = item.desc || '随身所得之物。';
  const itFull = item.full || itDesc;

  modal.innerHTML = '<div class="modal-wrap xsd-item-modal-box" style="width:480px;max-width:94vw;background:radial-gradient(circle at 50% 20%,rgba(28,32,44,.98),rgba(12,13,18,.99));border:1px solid rgba(212,175,55,.5);border-radius:10px;padding:22px 24px;box-shadow:0 18px 50px rgba(0,0,0,.9),0 0 25px rgba(212,175,55,.2);box-sizing:border-box;position:relative;font-family:-apple-system,BlinkMacSystemFont,\'PingFang SC\',\'Microsoft YaHei\',sans-serif;">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(212,175,55,.25);padding-bottom:12px;margin-bottom:16px;">'
    + '  <div style="display:flex;align-items:center;gap:8px;">'
    + '    <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#ffd700;box-shadow:0 0 6px #ffd700;"></span>'
    + '    <h2 id="xsd-item-modal-title" style="margin:0;font-size:16px;color:#ffd700;font-family:\'STKaiti\',\'KaiTi\',serif;letter-spacing:2px;">納 戒 · 物 品 詳 觀</h2>'
    + '  </div>'
    + '  <button type="button" class="close-btn" style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:#d1c7b7;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;line-height:1;" aria-label="关闭">✕</button>'
    + '</div>'
    + '<div style="margin-bottom:14px;">'
    + '  <div style="font-size:18px;font-weight:700;color:#f4efe2;letter-spacing:1px;font-family:\'STKaiti\',\'KaiTi\',serif;margin-bottom:6px;">' + esc(itName) + '</div>'
    + '  <div style="font-size:12.5px;color:#c9a24a;line-height:1.55;">' + esc(itDesc) + '</div>'
    + '</div>'
    + '<div style="background:rgba(0,0,0,.35);border:1px solid rgba(170,140,74,.25);border-radius:6px;padding:14px 16px;margin-bottom:18px;">'
    + '  <div style="font-size:11px;letter-spacing:2px;color:#b2ac9b;font-family:\'STKaiti\',\'KaiTi\',serif;margin-bottom:6px;">【玄机详述与来历】</div>'
    + '  <div style="font-size:13px;color:#e6e0d2;line-height:1.75;white-space:pre-wrap;">' + esc(itFull) + '</div>'
    + '</div>'
    + '<div style="display:flex;justify-content:space-between;align-items:center;">'
    + '  <span style="font-size:11px;color:#9d978d;font-family:\'STKaiti\',\'KaiTi\',serif;">提示：使用 /消耗物品 ' + esc(itName) + ' 可从纳戒中移除</span>'
    + '  <button type="button" class="modal-close-action" style="padding:7px 20px;border-radius:5px;background:linear-gradient(135deg,rgba(212,175,55,.25),rgba(160,120,40,.2));border:1px solid rgba(212,175,55,.5);color:#ffd700;font-size:12.5px;font-weight:700;cursor:pointer;">收归纳戒</button>'
    + '</div>'
    + '</div>';

  let closed = false;
  const closeFn = () => {
    if (closed) return;
    closed = true;
    try { doc.removeEventListener('keydown', onKey); } catch (e) {}
    try { modal.remove(); } catch (e) {}
  };
  const onKey = (e) => {
    if (e.key === 'Escape') closeFn();
  };
  doc.addEventListener('keydown', onKey);
  modal.querySelector('.close-btn')?.addEventListener('click', closeFn);
  modal.querySelector('.modal-close-action')?.addEventListener('click', closeFn);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeFn();
  });
  doc.body.appendChild(modal);
  return true;
}

/** 渲染纳戒与随身物品栏 */
function renderInventory(panel, doc) {
  if (!panel) return 0;
  const box = panel.querySelector('[data-xds="inventory-container"]');
  if (!box) return 0;
  const stat = xsdStatData() || {};
  let inv = Array.isArray(stat.inventory) ? stat.inventory : null;
  if (!inv || !inv.length) {
    const idEl = panel.querySelector('[data-xds="id"]');
    const curId = stat.身份 || (idEl ? idEl.textContent.trim() : '');
    inv = defaultInventoryFor(curId);
  }
  const countEl = panel.querySelector('[data-xds="inv-count"]');
  if (countEl) {
    countEl.textContent = '（共 ' + inv.length + ' 种 · 點擊名號詳觀）';
  }
  if (!inv.length) {
    box.innerHTML = '<div class="xh-inv-empty">囊中空空如也，未纳长物。</div>';
    return 0;
  }
  box.innerHTML = inv.map((it, idx) => {
    const nm = it && it.name ? esc(it.name) : '神秘法宝';
    const ds = it && it.desc ? esc(it.desc) : '随身之物。';

    const n = Math.max(1, parseInt(it && it.count, 10) || 1);
    const cnt = n > 1 ? ' <span style="color:#d4af37;font-size:11px;">×' + n + '</span>' : '';
    return '<div class="xh-inv-item">'
      + '<button type="button" class="xh-inv-name" data-xds-item-idx="' + idx + '">【' + nm + '】' + cnt + '</button>'
      + '<span class="xh-inv-desc">' + ds + '</span>'
      + '</div>';
  }).join('');

  const btns = box.querySelectorAll('.xh-inv-name');
  btns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const idx = Number(btn.getAttribute('data-xds-item-idx'));
      if (Number.isFinite(idx) && inv[idx]) {
        xsdOpenItemModal(inv[idx], doc);
      }
    });
  });
  return inv.length;
}

/** 填一条消息里的面板
 *  @param messageId 楼号（`.mes[mesid]` 的那个 mesid）
 *  @param rawText   **可选**：由渲染触发的 iframe 递进来的原文（＝隐藏副本 `<pre data-xds-src>` 的内容）。
 *                   给了就直接用，不再回读 getChatMessages（少一次宿主 API 往返，也更准：
 *                   取的就是这条消息自己的那份副本）；不给/空就退回 textOf 的三级寻址。
 *  ⚠️ 本函数**只写 DOM，不写变量** —— 记账是状态机（`__xsdStateTick`）的事，两者互不依赖。 */
function fillPanel(messageId, rawText, explicitPanel) {
  if (xsdMobileDisposed) return { ok: false, why: 'script disposed' };
  const D = DOC();
  const mesEl = D.querySelector(`.mes[mesid="${messageId}"]`);
  if (!mesEl) return { ok: false, why: '找不到 .mes[mesid]（DOC 可能取错了文档）' };

  let text = '';
  let from = '';
  if (typeof rawText === 'string' && rawText.trim()) {
    text = rawText;
    from = '渲染触发（iframe 随带原文）';
  } else {
    const got = textOf(mesEl, messageId);
    text = got.text;
    from = got.from;
  }
  const hasTag = text.includes('Status_block');
  const looksLikeBlock = /地点\s*[：:]/.test(text) || /在场\s*[：:]/.test(text)
    || /<(地点|时间|时辰|时点|在场|天气|环境|危机)>/.test(text);
  if (!text || (!hasTag && !looksLikeBlock)) {
    return { ok: false, why: `正文里没有状态块（来源 ${from}，${text.length} 字）` };
  }

  const m = text.match(/<Status_block>([\s\S]*?)<\/Status_block>/i);
  let inner = m ? m[1] : text;

  /* 容器优先取显式传入的（mount 路径）；退回 DOM 查找（旧路径／诊断用） */
  const panel = explicitPanel || panelOf(mesEl);
  if (!panel) return { ok: false, why: '该消息里没有面板元素（正则没渲染？也没传容器）' };

  // ⓪ 先摘掉 <角色N> 子块，再跑顶层字段正则（见 parseCast 的两条护栏）
  const cast = parseCast(inner);
  inner = cast.rest;

  let filled = 0;
  const fieldNodeMap = new Map();
  for (const el of panel.querySelectorAll('[data-xds]')) {
    const k = el.getAttribute('data-xds');
    if (k) fieldNodeMap.set(k, el);
  }

  const writtenFields = new Set();
  const put = (k, v, isYaml) => {
    if (!v || v === '—' || v === '-') return;
    for (const key of Object.keys(FIELD_MAP)) {
      if (SPECIAL_KEYS.includes(key)) continue;      // 角色区块由 renderCast 专管
      if (isYaml && writtenFields.has(key)) continue; // ★ XML 优先，YAML 只填补空白
      const label = FIELD_MAP[key];
      const isMatch = k.includes(label) || label.includes(k) || (key === 'time' && (k.includes('时辰') || k.includes('时点')));
      if (!isMatch) continue;
      const el = fieldNodeMap.get(key);
      if (el) { el.textContent = v; writtenFields.add(key); filled++; }
    }
  };
  // ① 主格式：XML 式 `<标签>值</标签>`（2026-09-27 起）
  for (const mm of inner.matchAll(/<([A-Za-z\u4e00-\u9fff][A-Za-z0-9\u4e00-\u9fff·・_\-]{0,24})>([^<]*)<\/\1>/g)) {
    put(mm[1].trim(), String(mm[2] ?? '').trim(), false);
  }
  // ② 兼容格式：YAML 式「标签：值」逐行（老聊天，共用 put 复用匹配与缓存）
  for (const line of inner.split(/\r?\n/)) {
    const mm = line.match(/^\s*([^：:]{1,14})[：:]\s*(.*)$/);
    if (!mm) continue;
    put(mm[1].trim(), mm[2].trim(), true);
  }
    /* gpt P1-1：时间一栏按**脚本台账**覆写（由段位/日历推导），不采信模型写的 <时间>；
     台账里没有 仙盟历文 时保留模型文本（老局/未初始化）。 */
  try {
    const tEl = fieldNodeMap.get('time');
    const tLedger = (stat && typeof stat['仙盟历文'] === 'string') ? String(stat['仙盟历文']).trim() : '';
    if (tEl && tLedger) { tEl.textContent = tLedger; writtenFields.add('time'); }
  } catch (eLedger) { /* 台账不可读 ⇒ 保持模型文本 */ }
// ③ 在场角色子块 → 「人」区的小卡片
  /* 阶段判定（2026-09-28）：拿「地点＋环境＋状态」的原文去判该用哪一组立绘
   *   （例如出现「沐浴/浴池/汤池」⇒ bath 组）。判不出来一律 baseline —— 与主题（主立绘）一致。 */
  let stageText = '';
  try {
    for (const k of ['loc', 'env', 'state']) {
      const el = fieldNodeMap.get(k);
      if (el && el.textContent) stageText += el.textContent + ' ';
    }
  } catch (e) { stageText = ''; }
  const castStage = xsdStageOf(stageText);

  const castBox = fieldNodeMap.get('cast') || panel.querySelector('[data-xds="cast"]');
  const lastRenderedText = panel.getAttribute('data-xds-rendered-text');
  const lastRenderedStage = panel.getAttribute('data-xds-rendered-stage');
  const alreadyRendered = lastRenderedText === text && lastRenderedStage === castStage && castBox && castBox.children && castBox.children.length > 0;

  if (!alreadyRendered) {

    filled += renderCast(panel, cast.list, castStage, String(messageId), text);

    try { xsdPaintIdentityFace(panel, castStage); } catch (e) { /* 头像位不许影响主流程 */ }

    try { xsdWireInline(panel); } catch (e) { /* 忽略 */ }
    panel.setAttribute('data-xds-rendered-text', text);
    panel.setAttribute('data-xds-rendered-stage', castStage);
  }

  try { renderInventory(panel, panel.ownerDocument || DOC()); } catch (e) { /* 纳戒不影响主流程 */ }
  return { ok: true, filled, total: fieldNodeMap.size || panel.querySelectorAll('[data-xds]').length, cast: cast.list.length, from, stage: castStage };
}

const scheduledTimers = new Map();
/** 渲染后多试几次（酒馆渲染时序不定）—— 冗余兜底，带同楼去重闸门，主路径是 iframe 的渲染触发 */
function schedule(messageId) {
  const mid = String(messageId);
  const old = scheduledTimers.get(mid);
  if (old) {
    for (const t of old) clearTimeout(t);
  }
  const timers = [];
  for (const d of [120, 600, 1500, 3000]) {
    const t = setTimeout(() => { const r = fillPanel(messageId); log(`#${messageId}`, r); }, d);
    timers.push(t);
  }
  scheduledTimers.set(mid, timers);
}

/** 补齐所有已有消息的面板（换聊天、刷新后） */
function fillAll() {
  const D = DOC();
  let n = 0;
  D.querySelectorAll('.mes[mesid]').forEach((el) => { n++; schedule(el.getAttribute('mesid')); });
  return n;
}

/* ─────────── 渲染触发入口（主路径）—— 照抄外卡《大乾风华录 Ver2.0》───────────
 * 卡内正则产出的 iframe 在 load 时调本函数，把 (楼号, 原文) 递进来。
 * ⚠️ 必须**同步返回**一个结果对象（iframe 不 await），也**绝不抛错**（抛了就白填）。
 * ⚠️ 参数可以是 (mesid, rawText)，也可以只给 mesid（rawText 走 textOf 兜底）。 */
function xsdFillPanel(mesid, rawText, explicitPanel) {
  try {
    /* 楼号拿不到时**绝不放弃填充**（迷你壳的 bootstrap 有时 DOM 溯源失败）：
     *   ① 用显式容器反推它在哪一楼；② 退回"最新一楼"。（规范 §1.2 原则 3：判不出来就放行） */
    let n = Number(mesid);
    if (!Number.isFinite(n) || n < 0) {
      const guess = [];
      try { const m = explicitPanel && explicitPanel.closest ? explicitPanel.closest('.mes') : null; if (m) guess.push(m); } catch (e) { /* 忽略 */ }
      try { const D = DOC(); const all = D.querySelectorAll('.mes[mesid]'); if (all.length) guess.push(all[all.length - 1]); } catch (e) { /* 忽略 */ }
      for (const g of guess) {
        const v = g && g.getAttribute ? g.getAttribute('mesid') : null;
        if (v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v))) { n = Number(v); break; }
      }
      if (!Number.isFinite(n) || n < 0) return { ok: false, why: 'bad mesid：' + mesid };
      console.warn(TAG, '[渲染触发] 楼号无效（' + mesid + '）⇒ 已按容器/最新楼推断为 #' + n);
    }
    const r = fillPanel(n, rawText, explicitPanel);
    log(`[渲染触发] #${n}`, r);
    return r;
  } catch (e) {
    console.warn(TAG, '[渲染触发] 填充失败（已吞掉，不影响渲染）：', (e && e.message) || e);
    return { ok: false, why: String((e && e.message) || e) };
  }
}


/* ─────────── 诊断入口（主控制台可调：__xsdPanelDiag()）─────────── */
function diag() {
  const D = DOC();
  const mesList = [...D.querySelectorAll('.mes')];
  const rows = mesList.map((m) => {
    const id = m.getAttribute('mesid');
    const p = panelOf(m);
    const t = m.querySelector('.mes_text');
    const txt = t ? (t.textContent || '') : '';
    const hasPre = !!m.querySelector('[data-xds-src]');
    const preLen = hasPre ? (m.querySelector('[data-xds-src]').textContent || '').length : 0;
    const vals = p ? [...p.querySelectorAll('[data-xds]')].map((e) => (e.textContent || '∅')).join(',') : '-';
    return `#${id} 正文${txt.length}字 面板=${p ? '有' : '无'} DOM状态块=${txt.includes('Status_block')} pre副本=${hasPre ? preLen + '字' : '无'} 字段=${vals}`;
  });
  const out = [
    '───── 仙姝墮面板诊断 v2.3 ─────',
    `在 iframe 里: ${(() => { try { return window.top !== window.self; } catch { return '跨源未知'; } })()}`,
    `DOC 来源: ${D === document ? '自身 document ⚠️' : '父窗口 document ✅'}`,
    `getChatMessages 探测: ${JSON.stringify(apiProbe)}`,
    `渲染触发入口 __xsdFillPanel: 本层=${(() => { try { return typeof window.__xsdFillPanel === 'function' ? '有' : '无'; } catch { return '?'; } })()}`
      + ` 父窗=${(() => { try { return (window.parent && typeof window.parent.__xsdFillPanel === 'function') ? '有' : '无'; } catch { return '跨源未知'; } })()}`
      + ` 顶层=${(() => { try { return (window.top && typeof window.top.__xsdFillPanel === 'function') ? '有' : '无'; } catch { return '跨源未知'; } })()}`,    `iframe 引导件: ${D.querySelectorAll('iframe[data-xds-boot]').length} 个`,
    `全页 pre[data-xds-src]: ${D.querySelectorAll('[data-xds-src]').length} 个`,
    `自由字段待核: ${(() => { try { const s = xsdStatData() || {}; const w = s.自由字段待核; if (!w) return '无'; const items = (w.项 || []); return items.length + ' 项（楼 ' + (w.楼 === null || w.楼 === undefined ? '?' : w.楼) + '）：' + items.map((x) => x.字段).join('、'); } catch (e) { return '?'; } })()}`,  /* 主人令·选C：泛指战事只记账待核，面板可见 */
    `消息总数: ${mesList.length} ｜ 面板元素: ${D.querySelectorAll('[data-xds-panel]').length}`,
    ...rows,
  ].join('\n');
  console.log(out);
  return out;
}
window.__xsdPanelDiag = diag;
try { window.parent.__xsdPanelDiag = diag; } catch (e) { /* 忽略 */ }


/* ═══════════════════════════════════════════════════════════════════════════
 * XsdHUD —— 纯入口（照《制卡规范 v2.0》§3.1 与规范 C 卷 J:4885-5002）
 *   迷你壳（正则替换串）里的 bootstrap 跨 realm 取它 → getMessageData() 反查原文
 *   → mount(container, raw, msgId) 渲进 #content。
 *   ⚠️ 事件钩子按规范 §3.1 **不接**（不赌宿主事件名与版本）。
 * ═══════════════════════════════════════════════════════════════════════════ */
const XsdHUD = (function () {
  const STYLE_ID = 'xsd-hud-injected-style';

  /** base64 → UTF-8 文本（CSS／骨架／字体都用 base64 承载，源码里只有 ASCII，绝无引号风险） */
  const b64utf8 = (b64) => {
    const bin = (typeof atob === 'function') ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  };
  let cssCache = '';
  const css = () => { if (!cssCache) cssCache = b64utf8(XSD_CSS); return cssCache; };
  let skelCache = '';
  const skeleton = () => { if (!skelCache) { try { skelCache = b64utf8(XSD_SKELETON); } catch (e) { skelCache = ''; } } return skelCache; };

  /** 样式**只注入一次**：字体（data URI）＋ 面板 CSS。零外部资源。 */
  function ensureStyleInjected(doc) {
    try {
      const d = doc || (typeof document !== 'undefined' ? document : null);
      if (!d || !d.head) return false;
      const previousStyle = d.getElementById(STYLE_ID);
      if (previousStyle && previousStyle.getAttribute('data-xds-style-version') === 'mobile-20261006') return true;
      if (previousStyle) previousStyle.remove();
      const st = d.createElement('style');
      st.id = STYLE_ID;
      st.setAttribute('data-xds-style-version', 'mobile-20261006');
      // 彻底剥除任何 html/body 全局选择器，严禁污染宿主酒馆页面的 body 背景与边距，杜绝黑屏与白屏
      const cleanCss = css()
        .replace(/(?:^|\})\s*(?:html\s*,\s*body|html|body)\s*\{[^}]*\}/gi, '$1')
        .replace(/html\s*,\s*body\s*\{[^}]*\}/gi, '');
      st.textContent = '@font-face{font-family:"XSD Kai";src:url(data:font/woff2;base64,'
        + XSD_FONT_B64 + ') format("woff2");font-weight:400 700;font-style:normal;font-display:swap;}'
        + cleanCss;
      d.head.appendChild(st);
      return true;
    } catch (e) { return false; }
  }


  function locateMes(el) {
    const cands = [];
    try {
      if (el && el.ownerDocument && el.ownerDocument.defaultView && el.ownerDocument.defaultView.frameElement) {
        cands.push(el.ownerDocument.defaultView.frameElement);
      }
    } catch (e) { /* 跨源跳过 */ }
    try { if (typeof window !== 'undefined' && window.frameElement) cands.push(window.frameElement); } catch (e) { /* 跨源 */ }
    try { if (el) cands.push(el); } catch (e) { /* 忽略 */ }
    for (const c of cands) {
      try { const m = c && c.closest ? c.closest('.mes') : null; if (m) return m; } catch (e) { /* 换下一个 */ }
    }
    /* DOM 扫描兜底：优先"含状态块"的楼（菜单楼=2 / 普通楼=1 / 无关=0），同分取最新 */
    try {
      const D = DOC();
      const all = [...D.querySelectorAll('.mes[mesid]')];
      const key = (m) => {
        try {
          const t = m.querySelector('.mes_text');
          const txt = t ? (t.textContent || '') : '';
          if (txt.includes('Status_block') || /<地点>/.test(txt)) return 3;
          if (txt.includes('IdentityPick') || txt.includes('择身而入')) return 2;
          return 1;
        } catch (e) { return 0; }
      };
      let best = null, bestK = -1;
      for (const m of all) { const k = key(m); if (k >= bestK) { best = m; bestK = k; } }
      return best;
    } catch (e) { return null; }
  }

  /** 反查本消息原文：① 宿主 API getChatMessages ② DOM 抠法（摘掉面板／隐藏副本／style／iframe） */
  function getMessageData(el) {
    let mes = null;
    try { mes = locateMes(el); } catch (e) { mes = null; }
    try {
      const id = mes ? mes.getAttribute('mesid') : null;
      if (mes && typeof getChatMessages === 'function') {
        const arr = getChatMessages(id !== null && id !== undefined && id !== '' ? Number(id) : undefined);
        const m = Array.isArray(arr) ? (arr[0] || null) : (arr || null);
        const t = m && (m.message ?? m.mes);
        if (typeof t === 'string' && t) return t;
      }
    } catch (e) { /* 换下一条路 */ }
    try {
      const t = mes ? mes.querySelector('.mes_text') : null;
      if (!t) return null;
      const c = t.cloneNode(true);
      for (const junk of c.querySelectorAll('[data-xds-panel], [data-xds-src], style, iframe, script')) {
        try { junk.remove(); } catch (e) { /* 忽略 */ }
      }
      const txt = (c.textContent || '').trim();
      return txt ? txt : null;
    } catch (e) { return null; }
  }

  /** 本 iframe 属于哪一楼（DOM 溯源；取不到返回 null，由 xsdFillPanel 兜底） */
  function detectCurrentMessageId(el) {
    try {
      const mes = locateMes(el);
      if (!mes) return null;
      const v = mes.getAttribute('mesid');
      return (v === null || v === undefined || v === '') ? null : Number(v);
    } catch (e) { return null; }
  }


  const XSD_RELICS = [
    { n: '九幽玄阴穴', id: 'jiuyouxuanyinxue', c: '九幽玄阴穴成形', s: '九幽玄阴穴', a: 4, lord: '九皇子', hall: '浊龙殿主' },
    { n: '灼酒流炎穴', id: 'zhuojiuliuyanxue', c: '灼酒流炎穴成形', s: '灼酒流炎穴', a: 4, lord: '残阳老怪', hall: '焚欲殿主' },
    { n: '心魔茶璎乳', id: 'xinmochayingru', c: '心魔茶璎乳成形', s: '心魔茶璎乳', a: 4, lord: '肉山佛', hall: '欢喜殿主' },
    { n: '般若菩提菊', id: 'boruoputiju', c: '般若菩提菊成形', s: '般若菩提菊', a: 4, lord: '肉山佛', hall: '欢喜殿主' },
    { n: '梅蕊穴', id: 'meiruixue', c: '梅蕊穴成形', s: '梅蕊穴', a: 4, lord: '病相思', hall: '魂欢殿主' },
    { n: '冰魄剑心穴', id: 'bingpojianxinxue', c: '冰魄剑心穴成形', s: '冰魄剑心穴', a: 4, lord: '', hall: '' },
    { n: '清歌弦鸣穴', id: 'qinggexianmingxue', c: '清歌弦鸣穴成形', s: '清歌弦鸣穴', a: 4, lord: '', hall: '' },
    { n: '流焰叠薪穴', id: 'liuyandiexinxue', c: '流焰叠薪穴成形', s: '流焰叠薪穴', a: 4, lord: '', hall: '' },
    { n: '凤凰羽花', id: 'fenghuangyuhua', c: '凤凰羽花成形', s: '凤凰羽花', a: 4, lord: '病相思', hall: '魂欢殿主' },
    { n: '北冥潮生穴', id: 'beimingchaoshengxue', c: '北冥潮生穴成形', s: '北冥潮生穴', a: 4, lord: '赵无忧', hall: '赵无忧' },
    { n: '玉虎噙香乳', id: 'yuhuxiangru', c: '玉虎噙香乳成形', s: '玉虎噙香乳', a: 4, lord: '九皇子', hall: '浊龙殿主' },
    { n: '灵犀同心', id: 'lingxitongxin', c: '灵犀同心成形', s: '灵犀同心穴', a: 4, lord: '残阳老怪', hall: '焚欲殿主' },
    { n: '烟霞灵乳', id: 'yanxialingru', c: '烟霞灵乳二阶段', s: '烟霞灵乳', a: 4, lord: '阎雷子', hall: '' },
  ];
  const XSD_RELIC_CN = ['', '一', '二', '三', '四'];
  const XSD_RG = '#d4af37', XSD_RGL = '#fff1b8', XSD_RGD = '#8c6d1f';
  const XSD_RO = '#e84118', XSD_ROL = '#ff7675', XSD_ROD = '#8c1d10';

  /** 读 stat_data 台账（与 `状态机.js` 同一条 API：聊天层打底、消息层覆盖；失败返回 null） */
  function xsdStatData() {
    try {
      const gv = (typeof getVariables === 'function') ? getVariables : null;
      if (!gv) return null;
      const pick = (opt) => { try { const v = gv(opt); return (v && typeof v === 'object' && !Array.isArray(v)) ? v : null; } catch (e) { return null; } };
      const cv = pick({ type: 'chat' }), mv = pick({ type: 'message', message_id: -1 });
      const cs = (cv && cv.stat_data && typeof cv.stat_data === 'object') ? cv.stat_data : null;
      const ms = (mv && mv.stat_data && typeof mv.stat_data === 'object') ? mv.stat_data : null;
      if (!cs && !ms) return null;
      const stat = Object.assign({}, cs || {}, ms || {});
      const ck = (cs && cs.known && typeof cs.known === 'object') ? cs.known : null;
      const mk = (ms && ms.known && typeof ms.known === 'object') ? ms.known : null;
      if (ck || mk) stat.known = Object.assign({}, ck || {}, mk || {});
      return stat;
    } catch (e) { return null; }
  }

  function xsdKnown() {
    const s = xsdStatData();
    return (s && s.known && typeof s.known === 'object') ? s.known : null;
  }

  /**
   * 单枚状态：校验归属、当前归属者与阶段
   * 状态三态：
   *   · 'none' ：未成形/无人获得 ⇒ 灰纹灰底（未出世）
   *   · 'self' ：当前身份持有 ⇒ 原色金色高亮点亮
   *   · 'other'：被他人占据（NPC或非当前身份）⇒ 从原色改为反色（异化负相）
   * @param {object} rel 纹章配置
   * @param {object} known 已知锚点表
   * @param {string} identity 玩家当前身份
   * @param {object} customOwners 自定义归属表 (stat_data.名器归属)
   * @returns {{ state: 'none'|'self'|'other', owner: string, arcs: number, owned: boolean }}
   */
  /** 身份别名组（同一人物的不同写法／称号）——名器归属判定不能只靠字符串相等：
 *  殿主开局的身份是**称号**（如「魂欢殿主」），而名器归属常写成**本名**（如「鬼医病相思」），
 *  两份写法对不上就会被判成「别人占据」，纹章反色。
 */
const XSD_IDENT_GROUPS = [
  ['魂欢殿主', '病相思', '鬼医病相思', '鬼醫病相思'],
  ['焚欲殿主', '残阳老怪', '焚欲殿'],
  ['欢喜殿主', '肉山佛', '欢喜殿'],
  ['浊龙殿主', '九皇子', '浊龙殿'],
  ['赵无忧'],
];
/** 两个人名（或称号）是否指同一个人：先直接包含，再按别名组交叉命中。
 *  @returns {boolean} */
/** 宿主上下文里的玩家名（persona 名）—— 千千万万玩家的名字都从这儿来，不写死。 */
function xsdPlayerNames() {
  const out = [];
  const push = (v) => { const s = s0(v); if (s && out.indexOf(s) === -1) out.push(s); };
  const getS = (w) => { try { return w && w.SillyTavern; } catch (e) { return null; } };
  let wins = [];
  try { wins.push(window); } catch (e) { /* 忽略 */ }
  try { wins.push(window.parent); } catch (e) { /* 忽略 */ }
  try { wins.push(window.top); } catch (e) { /* 忽略 */ }
  for (const w of wins) {
    const S = getS(w);
    if (!S || typeof S.getContext !== "function") continue;
    try { const c = S.getContext(); push(c && c.name1); push(c && c.name2); } catch (e) { /* 跨源 */ }
  }
  return out;
}
/** 归属者是不是「剧中人」：先看卡片自带名册（立绘命名表），再看别名组里的本名。
 *  名册与别名组都是**卡片自己的数据**，不额外维护玩家名单。 */
function xsdIsCast(nm) {
  const y = s0(nm);
  if (!y) return false;
  try {
    const table = (typeof XSD_PINYIN === "object" && XSD_PINYIN) ? Object.keys(XSD_PINYIN) : [];
    for (const n of table) { const k = s0(n); if (k && (y.indexOf(k) !== -1 || k.indexOf(y) !== -1)) return true; }
  } catch (e) { /* 表不可用 */ }
  for (const g of XSD_IDENT_GROUPS) { for (const n of g) { if (y.indexOf(n) !== -1) return true; } }
  return false;
}
function xsdSamePerson(a, b) {
  const x = s0(a); const y = s0(b);
  if (!x || !y) return false;
  if (x === y || x.indexOf(y) !== -1 || y.indexOf(x) !== -1) return true;
  for (const g of XSD_IDENT_GROUPS) {
    let hx = false, hy = false;
    for (const n of g) { if (x.indexOf(n) !== -1) hx = true; if (y.indexOf(n) !== -1) hy = true; }
    if (hx && hy) return true;
  }
  return false;
}

function xsdRelicState(rel, known, identity, customOwners) {
    const K = known || {};
    let formed = false;
    if (rel.c && K[rel.c] === true) formed = true;
    for (let n = 1; n <= rel.a; n++) { if (K[rel.s + XSD_RELIC_CN[n] + '阶段'] === true) { formed = true; break; } }
    if (!formed) return { state: 'none', owner: '', arcs: 0, owned: false };

    let hi = 0;
    for (let n = 1; n <= rel.a; n++) { if (K[rel.s + XSD_RELIC_CN[n] + '阶段'] === true) hi = n; }
    const arcs = Math.max(1, hi);

    const idText = s0(identity);
    const isLord = (lord, hall) => {
      if (hall && idText.indexOf(hall) !== -1) return true;
      if (lord && idText.indexOf(lord) !== -1) return true;
      return false;
    };
    const isCustomExplicit = idText.indexOf('自设') !== -1 || idText.indexOf('玩家') !== -1 || idText.indexOf('{{user}}') !== -1;
    const isZhao = !isCustomExplicit && (idText.indexOf('赵无忧') !== -1);
    const isLordAny = isLord('残阳老怪', '焚欲殿主') || isLord('肉山佛', '欢喜殿主') || isLord('九皇子', '浊龙殿主') || isLord('病相思', '魂欢殿主');
    const isCustom = isCustomExplicit || (!isZhao && !isLordAny);

    // 1. 显式自定义归属表 (stat_data.名器归属)
    let owner = '';
    if (customOwners && typeof customOwners === 'object') {
      const specified = customOwners[rel.n] || customOwners[rel.id];
      if (specified) owner = String(specified).trim();
    }

    // 2. 依据剧情事实与当前局势判定归属者
    if (!owner) {

      if (isCustom) {

        owner = idText || '自设';
      } else if (isZhao) {
        owner = '赵无忧';
      } else if (rel.lord && isLord(rel.lord, rel.hall)) {
        owner = rel.lord;                       // 殿主本人：该殿名下的名器归他
      } else if (rel.hall && isLord(rel.lord, rel.hall)) {
        owner = rel.hall;
      } else {
        owner = idText || '自设';
      }
    }

    // 3. 校验：当前身份是否等于归属者
    const _playerNames = xsdPlayerNames();
    const mine = (nm) => {
      if (xsdSamePerson(nm, idText)) return true;
      for (const p of _playerNames) { if (xsdSamePerson(nm, p)) return true; }
      return false;
    };
    const isMe = (function() {
      if (!owner) return false;
      if (owner === '玩家' || owner === '{{user}}') return true;
      if (isZhao && (owner === '赵无忧' || owner.includes('赵无忧'))) return true;
      if (isCustom) {
        /* 自设：**结构性判定**，不枚举玩家名（主人 2026-10-07 指正）。
           ① 归属者＝玩家本人（宿主 persona 名，或本人身份文本）⇒ 自己；
           ② 归属者命中卡片自带名册（立绘命名表 18 名）或别名组（四殿主称号↔本名）⇒ 剧中人 ⇒ 他人；
           ③ 其余（任何玩家自取的名字）⇒ 算自己。 */
        if (mine(owner)) return true;
        if (xsdIsCast(owner)) return false;
        return true;
      }
      if (rel.lord && owner === rel.lord && isLord(rel.lord, rel.hall)) return true;
      if (rel.hall && owner === rel.hall && isLord(rel.lord, rel.hall)) return true;
      if (xsdSamePerson(owner, idText)) return true;   /* 别名／口径统一：殿主称号 ↔ 本名 */
      return false;
    })();
    if (!isMe) {
      try {
        console.log(TAG, '[名器归属·诊断] ' + rel.n + '：身份=「' + idText + '」｜归属=「' + owner + '」'
          + '｜身份判定：自设=' + isCustom + '／赵无忧=' + isZhao + '／任一殿主=' + isLordAny
          + '｜名器表 lord=「' + String(rel.lord || '') + '」hall=「' + String(rel.hall || '') + '」'
          + '（判为他人 ⇒ 纹章会反色）');
      } catch (e) { /* 诊断失败不影响功能 */ }
    }

    if (isMe) {
      return { state: 'self', owner, arcs, owned: true };
    } else {
      return { state: 'other', owner, arcs, owned: false };
    }
  }

  /** 一枚纹章的 SVG（底图 ＋ 墨底压边 ＋ 双层金框 ＋ 阶段弧 ＋ 四阶金晕；未获取＝灰罩，被夺＝反色/异化暗红框） */
  function xsdRelicSvg(rel, st) {
    const id = rel.id, N = rel.a, R = 436;
    const isSelf = st.state === 'self';
    const isOther = st.state === 'other';
    const isActive = isSelf || isOther;

    const P = (ang, r) => [(500 + r * Math.cos(ang * Math.PI / 180)).toFixed(1), (500 + r * Math.sin(ang * Math.PI / 180)).toFixed(1)];
    const A = (a1, a2) => { const p1 = P(a1, R), p2 = P(a2, R); return 'M' + p1[0] + ' ' + p1[1] + ' A' + R + ' ' + R + ' 0 0 1 ' + p2[0] + ' ' + p2[1]; };
    const span = 360 / N, pad = 10, parts = [];
    const activeStroke = isSelf ? ('url(#ra' + id + ')') : (isOther ? ('url(#ro' + id + ')') : '#39404a');

    for (let k = 0; k < N; k++) {
      const s = -90 - span / 2 + span * (k + 0.5) + pad;
      const e = -90 - span / 2 + span * (k + 1.5) - pad;
      const mid = (s + e) / 2;
      if (!(isActive && k < st.arcs)) {
        parts.push('<path d="' + A(s, e) + '" fill="none" stroke="' + (isActive ? activeStroke : '#39404a') + '" stroke-width="11" opacity="' + (isActive ? 0.12 : 0.12) + '"/>');
        continue;
      }
      const gap = N === 4 ? [0, 34, 20, 10, 0][st.arcs] : [0, 30, 18, 0][st.arcs];
      if (gap > 0) {
        parts.push('<path d="' + A(s, mid - gap / 2) + '" fill="none" stroke="' + activeStroke + '" stroke-width="16" stroke-linecap="round" filter="url(#rg' + id + ')"/>');
        parts.push('<path d="' + A(mid + gap / 2, e) + '" fill="none" stroke="' + activeStroke + '" stroke-width="16" stroke-linecap="round" filter="url(#rg' + id + ')"/>');
      } else {
        parts.push('<path d="' + A(s, e) + '" fill="none" stroke="' + activeStroke + '" stroke-width="16" stroke-linecap="round" filter="url(#rg' + id + ')"/>');
      }
      const len = N === 4 ? [0, 18, 26, 34, 44][st.arcs] : [0, 16, 26, 38][st.arcs];
      const b = P(mid, R + 6), t = P(mid, R + 6 + len), d1 = P(mid - 10, R + 6 + len * 0.5), d2 = P(mid + 10, R + 6 + len * 0.5);
      parts.push('<path d="M' + b[0] + ' ' + b[1] + ' L' + t[0] + ' ' + t[1] + '" stroke="' + activeStroke + '" stroke-width="14" stroke-linecap="round" filter="url(#rg' + id + ')"/>');
      parts.push('<path d="M' + b[0] + ' ' + b[1] + ' L' + d1[0] + ' ' + d1[1] + '" stroke="' + activeStroke + '" stroke-width="9" stroke-linecap="round" opacity="0.85"/>');
      parts.push('<path d="M' + b[0] + ' ' + b[1] + ' L' + d2[0] + ' ' + d2[1] + '" stroke="' + activeStroke + '" stroke-width="9" stroke-linecap="round" opacity="0.85"/>');
    }
    const bloom = isSelf && st.arcs >= N, inner = isActive && st.arcs >= 2;
    return '<svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
      + '<defs>'
      + '<linearGradient id="ra' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="' + XSD_RGL + '"/><stop offset="50%" stop-color="' + XSD_RG + '"/><stop offset="100%" stop-color="' + XSD_RGD + '"/></linearGradient>'
      + '<linearGradient id="ro' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="' + XSD_ROL + '"/><stop offset="50%" stop-color="' + XSD_RO + '"/><stop offset="100%" stop-color="' + XSD_ROD + '"/></linearGradient>'
      + '<radialGradient id="rv' + id + '" cx="50%" cy="50%" r="62%"><stop offset="46%" stop-color="#0b0f14" stop-opacity="0"/><stop offset="84%" stop-color="#0b0f14" stop-opacity="0.62"/><stop offset="100%" stop-color="#0b0f14" stop-opacity="0.92"/></radialGradient>'
      + '<radialGradient id="rb' + id + '" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff8dc" stop-opacity="' + (bloom ? 0.24 : 0) + '"/><stop offset="100%" stop-color="#d4af37" stop-opacity="0"/></radialGradient>'
      + '<filter id="rg' + id + '" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
      + '</defs>'
      + '<rect width="1000" height="1000" fill="url(#rv' + id + ')"/>'
      + (bloom ? '<circle cx="500" cy="500" r="420" fill="url(#rb' + id + ')"/>' : '')
      + '<circle cx="500" cy="500" r="436" fill="none" stroke="#0b0f14" stroke-width="17" opacity="0.62"/>'
      + (inner ? '<circle cx="500" cy="500" r="406" fill="none" stroke="' + activeStroke + '" stroke-width="5" opacity="' + (st.arcs >= 3 ? 0.5 : 0.3) + '"/>' : '')
      + parts.join('')
      + '<rect x="16" y="16" width="968" height="968" rx="72" fill="none" stroke="' + (isSelf ? 'url(#ra' + id + ')' : (isOther ? 'url(#ro' + id + ')' : '#39404a')) + '" stroke-width="10" opacity="' + (isActive ? 1 : 0.55) + '"/>'
      + '<rect x="46" y="46" width="908" height="908" rx="54" fill="none" stroke="' + (isSelf ? XSD_RG : (isOther ? XSD_RO : '#6b7280')) + '" stroke-width="3" opacity="' + (isSelf ? 0.32 : (isOther ? 0.45 : 0.2)) + '"/>'
      + '</svg>';
  }

  
  /** 13 件名器 1-4 阶段精炼神韵数据库（用于 Hover 气泡与全景玄鉴画卷） */
  const XSD_RELIC_STAGES = {"jiuyouxuanyinxue":{"id":"jiuyouxuanyinxue","name":"九幽玄阴穴","carrier":"孤月","type":"阴窍绝品 · 极寒冰窟","brief":"阴窍至极名器，位列《极乐引》绝品。宿主身负世间至阴玄冥之气，深邃如坠万载寒潭，凡俗阳气触之即冻，常与九幽玄阴脉伴生。","stages":{"1":{"name":"一阶段","desc":"触发条件是元阴初破。花宫最深处凝出一朵虚幻冰莲花苞，抖着绽开第一片花瓣，随后层层全绽。整条花径翻脸——原本温热的媚肉一瞬覆上万年玄冰般的寒气，收缩到近乎攻击性地箍紧肉棒，把入侵的烫物硬生生裹进冰里。至阴汁水触到肉棒即凝成薄冰霜，下一刻被烫化，再凝、再化，循环往复，交合处不断冒出细碎滋滋声，蒸起冰冷雾气，把两人下身罩在寒雾里。对方感受到的是仿佛连","lock":""},"2":{"name":"二阶段","desc":"冰棱漩涡成形。内壁长出无数细密、高速旋转的冰棱，在花径内壁疯狂游走、刮擦、研磨，每一下带出刺骨寒意与头皮发麻的快感。冰莲花瓣浮出丝丝缕缕淡暗金龙纹，像微小邪龙在瓣上游动；莲心亮起一点极致幽蓝，冰魄核心成形，花瓣层层怒放。携带者小腹浮出冰蓝与暗金交织的龙形道纹，如活物般缓缓游动；对方背脊浮出呼应的冰龙道纹。空中凝出一雄一雌两条缠暗金纹的冰龙虚影，交颈缠绕，散出","lock":"「极乐引·玄阴篇」朱批：冰棱回旋生暗金，阴阳交泰极处，龙纹自显于背。"},"3":{"name":"三阶段","desc":"漩涡收凝成龙鳞。无序旋转的冰棱猛然收缩凝聚，化作无数细小、如同活物般的冰晶龙鳞，紧密排列，布满整条花径。它们不再被动应激，而是主动：肉棒侵入的瞬间，满壁龙鳞仿佛见到君王般齐齐震颤、翕张，发出细碎的、如同冰晶摩擦的沙沙声，一层层叠上来包裹、缠绕肉棒；边缘锋利如刃，触到肉棒时又变软，带着吸力刮搔每一道沟壑。莲台上两条微缩冰龙虚影首尾相衔，绕着莲心幽蓝核心飞速盘旋","lock":"「极乐引·玄阴篇」朱批：玄魄收凝化为鳞，至柔胜刚，百骸龙髓交感。"},"4":{"name":"四阶段","desc":"身体外形被改写。莲心那点幽蓝核心先向内坍塌，接着轰然爆开，龙气逆流上头。额角两侧刺出一对幽蓝龙角，蜿蜒生长，通体如万载玄冰雕琢，表面缠着暗金色、活物般游走的细纹；身躯覆上龙鳞。背后一道庞大狰狞、覆着幽蓝冰晶与暗金纹路的邪龙虚影挣脱浮现，龙威压低整间宫殿的气温。龙角是整具名器的命脉，被攥住拨弄时，一股混着酥麻、刺痛的强烈电流瞬间窜遍全身，绷紧的身体当场软下去。","lock":"「极乐引·玄阴篇」朱批：龙角峥嵘命脉生，九幽冰魄大成，神仙俯首任凭驱策。"}}},"zhuojiuliuyanxue":{"id":"zhuojiuliuyanxue","name":"灼酒流炎穴","carrier":"叶红缨","type":"阴窍绝品 · 焚欲赤羽","brief":"阴窍绝品名器，出自《极乐引》名器谱，称其足以燃情蚀骨、醉倒仙神。花宫深处有纯阳酒泉，情动时溢散陈酿异香，炽热如熔岩暗涌，能反激交合者阳煞生机。","stages":{"1":{"name":"一阶段","desc":"元阴被破的那一刻由血脉自己引爆。未觉醒时只有一股淡淡的酒味混在情动气息里。入口先热后紧，被按压摩擦时不受控地一阵阵收缩，主动吸附吮吸，蜜液多到顺着大腿内侧拖出亮晶晶的水痕。插入那一下滚烫的温度先把携带者从迷乱里烫醒，随后破膜、撕裂、被撑到极限。真正的机制在第一下撞到花宫口时启动：一股热从花宫最深处自己炸开，被动承受的肉壁立刻改态，化成流动的温暖火焰层层叠叠缠","lock":"「极乐引·焚欲篇」朱批：幽谷藏纯阳酒泉，初度红尘自生温，烈火遇酒即引燃。"},"2":{"name":"二阶段","desc":"肉壁性质直接换掉。媚肉不再是温暖的火绸，而是化作流动的炽白烈焰；蜜汁不再流淌，而是像千年酒髓瞬间蒸干，化成无形无质却无处不在的烈炎琼浆，作用于双方神魂，把快感成倍往上推。体液相交处会响出滋滋声，像火焰遇上烈酒。背部浮出火凤道纹。这一段的乳尖另有孕炎乳一路：淡琥珀色，跟下身同源的酒香，被吸出后顺喉咙下肚，下去就催情。","lock":"「极乐引·焚欲篇」朱批：肉壁化流光炽焰，白焰琼浆蚀骨，乳尖暗凝琥珀之膏。"},"3":{"name":"三阶段","desc":"炽白流转为暗金，火凤虚影成形，修为随之破入元婴。此段触发「极乐轮回」——巅峰那一瞬邪凤法相双目亮起，力量顺着三人接触的部位反向灌回，本该退去的快感以更强力度从花心与后庭同时再爆一次，接着第三次、第四次，变成永不停歇的海啸，把携带者钉在极乐里。汁液带上了实质重量，酒香浓到能侵蚀心智。","lock":"「极乐引·焚欲篇」朱批：暗金凤影啸九天，快意迭起如海啸，极乐轮回不可休。"},"4":{"name":"四阶段","desc":"背脊肩胛裂开两道口子，长出翼展近丈的邪欲凤翼，暗红凤羽里流着金色情火。法相效果转为「欲火焚身，高潮迭起」：灼热的波纹以结合处为中心向外推，被携带者带到的人高潮一波未平一波又起。高潮时汁液可从穴口像小型喷泉般激射。","lock":"「极乐引·焚欲篇」朱批：双生赤羽裂肩胛，欲火焚身，神魂尽销于情焰之中。"}}},"xinmochayingru":{"id":"xinmochayingru","name":"心魔茶璎乳","carrier":"闻观语","type":"乳窍绝品 · 魔念茶香","brief":"双峰类奇珍名器，上古极阴之体之至高变种。双峰与周身灵窍浑然一体，天生体蕴幽渺魔性茶香，传闻灵乳初溢之时可洗练神魂杂毒，玄机深不可测。","stages":{"1":{"name":"一阶段","desc":"破元阴、阴阳交泰时，花宫凝出半透明的幽蓝心魔茶树虚影，爱液转成黏腻乳白，双峰胀大、乳尖渗出淡金灵乳。内壁黏膜像活了过来，生出无数细密柔软、如同新生茶蕊般的微小凸起与褶皱，疯狂摩擦、刮蹭、吮吸，快感按几何倍数往上翻。灵乳被饮下，能让人耗损的修为顷刻尽复，甚至犹有精进，还能把蚀心焚毒的奇毒消解大半。","lock":"「极乐引·魔念篇」朱批：花宫生茶树，璎珞初绽，灵乳溢香可涤神魂宿毒。"},"2":{"name":"二阶段","desc":"花宫孕出背生黑色魔翅的天魔之女虚影，蜜汁化成璎珞乳浆，黏稠如蜜、闪珍珠光泽，异香比先前浓十倍；双峰泌出天魔金乳，宛如流动的黄金，带炽热生命气息与魔性茶香。内壁茶蕊更密更软，如同活过来的触须，缠绕舔舐入侵的肉棒，每次摩擦带出电流般的细密快感。双方小腹浮出天魔道纹，身后虚空浮出天魔与天魔之女两道虚影交感。此段可行峰峦叠嶂之法：以乳肉包裹肉棒，与下穴共鸣，上下同时","lock":"「极乐引·魔念篇」朱批：天魔之女凝金乳，双峰与玄谷共鸣，上下通感如一。"},"3":{"name":"三阶段","desc":"在雷霆与欲火双重作用下彻底觉醒。茶蕊顶端生出细小的紫金触须，抽离时依依不舍缠住挽留、刮过棱角，插入时又欢快缠上来贴着律动，把更细腻的刮擦送进濒临崩溃的神经。天魔金乳转为瑰丽的紫金色，入口带电般的酥麻。花宫茶树化作幽蓝、暗金、紫红三色交织、缠着银白雷弧的紫金雷火茶树。天魔女法相左半身缠融情欲火、右半身跃动暗紫雷蛇。奴种于此段扎进茶树核心根系。","lock":"「极乐引·魔念篇」朱批：紫金雷火动道纹，奴种深植根系，欢愉锁死于魔念之中。"},"4":{"name":"四阶段","desc":"脑后虚空凝出一枚拳头大小、深邃暗绿的邪心天目，缓缓睁开。随之展开领域「千心一欲」——领域内所有女子的感官、情绪、乃至被身体承载的快感被强行连接、共享、放大，数千人的感受叠加进一具身体，被灌入的元阳洪流也叠成数千道贯穿。身心与欢愉法则锁死，退不回来。","lock":"「极乐引·魔念篇」朱批：千心归一欲，天目睁时照十方，万千神魂共此极乐。"}}},"boruoputiju":{"id":"boruoputiju","name":"般若菩提菊","carrier":"楚灵夜","type":"后窍绝品 · 佛光净莲","brief":"后窍绝品名器，载于《极乐引》佛宗异宝残卷。隐于后庭菊径，聚散如清净莲台，禅韵与媚煞相生相克，传有逆向洗练神魂杂质之旷世神效。","stages":{"1":{"name":"一阶段","desc":"入口是一圈极紧的环状门户，被撑开时先是极涩，随后是轻微撕裂痛，很快转成饱胀、酥麻与深层悸动。内壁的褶皱自己重排，形成一圈圈细微而排列有序、如同菩提树叶脉般的纹路，侵入的瞬间被激活，不再是单纯紧箍，而是带韵律地蠕动、吸附、吮吸。这些叶脉缠绕入侵的肉棒，每次摩擦刮搔都带出电流窜脊髓的感觉，并反向把佛门元阴之气渡回施术者。","lock":"「极乐引·梵音篇」朱批：后庭暗藏清净莲，叶脉随律蠕动，逆吸真阳洗练神魄。"},"2":{"name":"二阶段","desc":"双穴互通成形。前后两条幽径彻底贯通，前方每收缩一次必然引动后方同步吸附，后方每蠕动一次也必然激起前方更剧烈的缠绕，形成循环放大的闭环。花径内的金色莲花与后庭的菩提叶瓣形成共振，后庭叶瓣像潮汐般层层涌动，带出更深沉的饱胀与酸痒。汁液从透明黏稠渐染淡金，转成黏稠醇厚如百花蜜露。","lock":"「极乐引·梵音篇」朱批：双穴相通成阴阳循环，前合后翕，禅意与媚煞同炉。"},"3":{"name":"三阶段","desc":"内壁纹路升格为半透明玉质般的菩提叶瓣，层层叠叠缠裹上来，节奏比花径更慢更深，缓慢而坚定地蠕动开合，带来直抵灵魂深处的吸力。汁液转成浓郁如琥珀、仿佛融化了黄金，气味是檀香混着极品花蜜的甜。额心暗金红莲印亮起，体表暗红邪莲图腾绽放旋转；法相为邪菩萨，诵出扭曲六字真言，化金色波纹笼罩全场，把领域里所有人的双穴同时点着。","lock":"「极乐引·梵音篇」朱批：邪菩萨法相低诵，红莲图腾照虚空，领域之内皆燃欲火。"},"4":{"name":"四阶段","desc":"机制转为镜像转移——携带者的感知被硬生生劈成两半，前一半在前面承受撑开的胀痛、棱角刮擦内壁的酥麻、顶端撞进深处的震荡，后一半分毫不差搬到后庭里，完全同步。高潮时花宫处的菩萨莲台主动张开一道细小缝隙，产生无法抗拒的吸力，像长鲸吸水般把灌进去的东西连同携带者自身的汁液一起吞下锁死在体内；被灌满后小腹肉眼可见微微隆起，事后蜜穴与后庭都红肿外翻。","lock":"「极乐引·梵音篇」朱批：镜像移转，莲台含吮封真阳，长鲸吸水分毫不泄。"}}},"beimingchaoshengxue":{"id":"beimingchaoshengxue","name":"北冥潮生穴","carrier":"雨霏柔","type":"阴窍绝品 · 惊涛潮汐","brief":"阴窍旷世绝品，暗合浩瀚北冥水行天道法则。花径幽邃如深海寒渊，潮起潮落皆合天时律动，非大机缘大定力者难窥其万分之一玄妙。","stages":{"1":{"name":"一阶段","desc":"内壁不按规律收缩，而是化作无数方向各异、力道不同的暗流与漩涡，从四面八方冲击、刮搔、缠绕入侵的肉棒。常态冰凉滑腻，汁水色泽深邃幽玄、质地如水银般沉重顺滑，气味是深海与月光混在一起的冷冽芬芳，量大到随内壁潮汐一波波涌出。插入的感觉不是陷进温暖的巢穴，而是闯进一片有了生命与意志的海洋，四周是无边包裹与冲击，还带着要把灵魂吸出去的力量。抽送到底时顶端撞上正在加速旋","lock":"「极乐引·北冥篇」朱批：水行法则纳于方寸，暗流漩涡不息，玄津如水银沉重。"},"2":{"name":"二阶段","desc":"那些暗流与漩涡化成无数细小活着的鲲鹏虚影，按规律层层叠叠地缠绕、吸吮、刮搔；花径从温暖海洋变成无垠的北冥之海，空间感被无限拉长，内壁媚肉带上韧性与活性，每一次收缩挤压都像整片北冥在呼吸律动。背脊浮出鲲鹏道纹。高潮不是普通喷发，是源涡运行方向轰然逆转：北冥玄津一瞬冰凉刺骨又极致灼热，量大到不可思议，如决堤的北冥之海从结合处冲出，同时把混着两人生命本源与阵道法则","lock":"「极乐引·北冥篇」朱批：源涡逆转沧海立，鲲鹏展翼，生命本源反哺纯阳。"},"3":{"name":"三阶段","desc":"领域展开。洞府内的景象开始扭曲模糊，空气里响起来自远古的潮汐声，四周浮出鲲鹏展翅、鱼跃沧海的虚影，以两人结合处为中心，把整间洞府变成只属于结合双方的独立神国。乳尖被吮时另有一路反馈，汁水混着浓郁乳香与一丝北冥玄津特有的冷冽激射而出。携带者这时只能死死捂住嘴、指甲掐进对方皮肉、拼命压住声音，身体却一路跟上去，直到双眼翻白。","lock":"「极乐引·北冥篇」朱批：帝溟神国自成天地，浪涛拍岸处，直指元婴大道。"},"4":{"name":"四阶段","desc":"帝溟神国彻底凝实为体内洞天，花宫深处「潮汐源涡」与鲲鹏本源合道。潮生自律无需刻意催发，暗流与浪涛自花宫深处层层逆卷，生命本源源源不绝反哺纯阳。玄津如银瀑倒倾，交媾即入天道冥想之境，元婴瓶颈应声而破。","lock":"「极乐引·北冥篇」朱批：溟海化虚为真界，鲲化为鹏扶摇起，极乐极境直通合道造化。"}}},"lingxitongxin":{"id":"lingxitongxin","name":"灵犀同心穴","carrier":"苏瑶、苏玲","type":"阴窍奇珍 · 灵犀双生","brief":"双生造化奇珍名器，需同胎血亲合道共构。二人同心异质、命格相系，传闻阴阳两极共济互补，在《极乐引》中被列为最不可思议之双生玄枢。","stages":{"1":{"name":"一阶段","desc":"同时探入两根手指能摸到两种截然不同的手感——一路温热黏稠，像最上等的温热丝绸，内壁嫩肉如活物缠绕蠕动，包裹紧致而富有弹性；一路冰凉爽滑，像浸润在寒泉里的美玉，内里细密褶皱如无数小舌缠绕，深处仿佛有无数细小漩涡旋转。破处即激活：谁在承欢，另一方无论隔多远都能同步感到被填满的胀满、被撑开的胀痛、甚至处子膜破裂那一瞬的痛，高潮几乎在同一刻到达。","lock":"「极乐引·双生篇」朱批：同胞共命，异体同心，一人承欢则千里同感。"},"2":{"name":"二阶段","desc":"一人的快感被放大数倍再叠到另一人身上，形成双重贯穿感，像自己同时被两根操着。同时使用两人时，一边是灼热如地心熔岩的包裹与吮吸，一边是冰冷如九幽寒泉的浸润与缠绕，交替贯穿时热气与寒气在两人体内来回流转碰撞。汁液性质分化：苏玲的蜜汁骤然变得无比黏稠温热，如同融化的金液；苏瑶的爱液瞬间冰凉滑腻，如同万载寒泉。","lock":"「极乐引·双生篇」朱批：一温一寒冰火旋，阳蜜炽如熔金，阴蜜清如寒泉。"},"3":{"name":"三阶段","desc":"花宫门户被撞开那一刻，两人花宫深处各自升腾起一股截然不同的气旋，浮出太阳道纹与月亮道纹，日月交辉。这对道纹可外移到施术者双臂，被识出名器来源。高潮时姐妹各走一路：苏玲花宫深处的太阳气旋爆发，一股浓郁灼热、含精纯太阳之气的黏浊蜜汁像火山喷发般冲出；苏瑶体内喷出大量清冽冰凉、含太阴之气的蜜汁，两者混在一起形成奇异的冰火交织。对方射时元阳分作两股，一股灌进苏玲花宫","lock":"「极乐引·双生篇」朱批：日月交辉道纹现，两极交泰，造化神妙天地不存。"},"4":{"name":"四阶段","desc":"同心通感升华至神魂相通、太极合璧。无需同榻，一人承欢则双姝同享无上极乐。花宫内冰火阴阳二气在结合中自行演化太极漩涡，苏玲之阳蜜如熔金、苏瑶之阴蜜如万载寒泉，双流交汇反哺采补者。姐妹双纹与采补者双臂铭纹彻底互为表里，锁死同生共死之契。","lock":"「极乐引·双生篇」朱批：太极双生归混沌，千里同春情不息，日月同辉证无上玄妙。"}}},"yuhuxiangru":{"id":"yuhuxiangru","name":"玉虎噙香乳","carrier":"云织梦","type":"乳窍奇珍 · 猛虎衔香","brief":"双源奇珍名器，肌肤如润泽暖玉，天生蕴含冷冽蜜桃异香。相传宿主体内潜藏远古庚金白虎真煞，兼具镇邪与生阳之奇妙潜质。","stages":{"1":{"name":"一阶段","desc":"觉醒征兆不是汁液，是触感先变——肌肤红潮沉淀成温润莹透的光泽，摸上去不像单纯柔软，而像最上等的暖玉，细腻滑嫩下面藏着惊人弹性；乳晕向熟透蜜桃尖的橘红过渡，乳根与肋侧浮出极淡近乎透明的银白虎纹，随呼吸心跳流转，纹路本身散着微弱温热，碰到会引出全身细战栗。花宫深处的本源之相初显为一枚浸润清冷月华的饱满玉桃。汁液是初香玉露：清亮透明、微带粘丝、清冽纯净的蜜桃冷香，","lock":"「极乐引·白虎篇」朱批：玉骨凝香如冷桃，初露清冽，可开通天彻地五感。"},"2":{"name":"二阶段","desc":"体内的淫龙涎香余毒突然活跃，化成数条细如发丝的粉色光龙钻进那枚月下蜜桃虚影，把虚影撑碎，一头通体晶莹、毛发如粉色琉璃、双眼燃着情焰的邪魅白虎虚影就此盘踞花宫，骚痒与膨胀从深处往上顶。内壁淡银灵络整体转成鲜艳桃粉，像活过来的藤蔓紧紧缠住深埋的肉棒，一波波更绵密、深入骨髓的酥麻与吸力跟着压上来。胸前泌出的转成炽情桃蜜，黏稠如蜜、泛莹润桃粉光泽，催情更强；花径爱液","lock":"「极乐引·白虎篇」朱批：春潮催发庚金煞，白虎踞深闺，桃蜜浓艳催生真阳。"},"3":{"name":"三阶段","desc":"交合方混着混沌镇封之力的元阳洪流把邪灵包裹压缩，化成一道黯淡的粉红纹路锁进识海最深处。镇封那一刻花宫深处亮起一点白金光芒，演进成玉虎镇渊阵，名器本源被稳住，邪异气息消散，快感反而更纯：深埋在名器中的肉棒不仅未因倾泻元阳疲软，反被阵纹的威严与名器自身的吸吮之力激得愈发胀硬，尺寸再涨一圈。双峰与花径的双向共鸣此时完全打开——虎纹随花径收缩明暗闪烁，把快感反馈增幅","lock":"「极乐引·白虎篇」朱批：大阵镇渊锁邪灵，共鸣回路全启，反激阳根愈战愈强。"},"4":{"name":"四阶段","desc":"识海邪灵尽化为至纯神煞，白虎法相与月下玉桃本源彻底相融，胸前虎纹与花径灵络彻底通融。无需爱抚，情动即溢浓郁初熟桃蜜；双峰微颤间，庚金之气化作至刚至柔的锁阳大阵，深埋之阳物如遭天锁相吸，愈战愈坚，阴阳真火生生不息。","lock":"「极乐引·白虎篇」朱批：白虎衔香归至纯，神煞化甘露，双峰锁阳直臻长生妙境。"}}},"yanxialingru":{"id":"yanxialingru","name":"烟霞灵乳","carrier":"柳含烟","type":"乳窍绝品 · 紫雾霞光","brief":"双峰绝品名器，天生聚拢紫雾霞光。所溢甘露宛如凝练烟霞，自带颠倒红尘、勾动神魂最深处缠绵记忆之天然道韵。","stages":{"1":{"name":"一阶段","desc":"乳肉绵软硕大、弹力惊人，入手温热，五指抓下去乳肉几乎从指缝满溢出来。乳尖被含住吮吸时，一股温热、醇厚、带浓郁幽昙花香与奇异乳甜的粉白色乳汁不受控地激射出来，质地更接近凝练的烟霞。花径插入是填充与撕裂同时超限：肉棒撑开唇瓣、撕开柔韧的甬道入口长驱直入，每一寸敏感媚肉被碾平、撑开到极限的轮廓都能清楚感到；内壁肉壁上的幽昙花花蕊被刮过或撞上时，应激般分泌出接近烟霞","lock":"「极乐引·烟霞篇」朱批：紫雾霞光凝琼浆，幽昙半合，每一吮皆落仙家露。"},"2":{"name":"二阶段","desc":"花宫最深处那株由精纯欲火与幽昙本源凝成的幽昙花虚影被直接撞上时，会生出一种名器本源被外力猛撞震荡的、源自灵魂深处的战栗。抽出时几乎退到穴口，内壁上的暗金锁链虚影一路刮擦，带来奇异而强烈的酥麻与微痛；每一次深入都像要撞碎花宫门户。乳尖被从乳下缘向上猛力推挤时，乳汁会被挤成细线四处飞溅，携带者身上那层成熟妖媚的壳会彻底碎掉，声音散成断句。","lock":"「极乐引·烟霞篇」朱批：暗金锁链动神魂，幽昙撞破，高傲道心尽作断续啼痕。"},"3":{"name":"三阶段","desc":"身后蛇姬法相虚影凝实，周身缠绕漆黑火焰，散出缕缕肉眼可见、氤氲粉黑色泽的烟雾。此段成形道韵「昨日欢」——非幻术，直接引动周遭女子肉身与神魂最深处的记忆烙印，让众女修一次次重温自己人生中最极致、最难忘的那次泄身体验，可反复叠加、越来越强。乳尖泌出的乳汁与花径分泌的烟霞蜜汁同时成倍加量，异香浓郁十倍。","lock":"「极乐引·烟霞篇」朱批：昨日欢起蛇姬舞，重温极乐忆，世间至高缠绵道韵。"},"4":{"name":"四阶段","desc":"「昨日欢」道韵凝为实质领域，幽昙花彻底盛开，粉黑霞光如轻纱笼罩结合双方。双峰泌出之烟霞琼浆与花径溢出之极乐花蜜化作神魂养料。每一次抽送皆精准引动神魂最极致之快感记忆，层层叠增、无休无止，令道心永沦于欢愉梦境，不可自拔。","lock":"「极乐引·烟霞篇」朱批：幽昙盛放烟霞定，昨日欢化万古春，沉沦无悔至死方休。"}}},"meiruixue":{"id":"meiruixue","name":"梅蕊穴","carrier":"花芷凝","type":"阴窍奇珍 · 寒梅暗香","brief":"阴窍暗香奇珍，清幽冷冽，自带绝俗梅花冷香。内蕴玄妙蕊形灵络，有以幽谷阴元孕养灵药、反哺丹道造化之殊胜传闻。","stages":{"1":{"name":"一阶段","desc":"元阴被破、花宫门户被顶到，则被激活。入口紧窄，初入时偏涩，内壁出现的不是单纯褶皱，而是一圈圈排列有序、边缘微卷的蕊状结构，像被撩开的花瓣一样逐层裹上来。本阶段蕊状结构不主动吸附，仅在肉棒退出时产生轻刮。温度起始偏低，接近携带者常年偏凉的体表手感；随交合推进内壁自行升温，出现冷热交替，交接处的凉意与热度在两息之内反复一遍。汁液清透微黏，气味为梅花冷香，浓度随情","lock":"「极乐引·梅蕊篇」朱批：幽谷清冷生梅香，蕊瓣层叠，退出微刮引动心弦。"},"2":{"name":"二阶段","desc":"蕊状结构吸水后膨起，边缘由微卷转为向外翻张，像花瓣张开一样全部贴上肉棒，形成持续的刮擦与吸附。中心位置生出一条纵向敏感带并沿壁贯穿，肉棒压过该带时产生的感觉沿脊柱向下传导。汁液由清透转为蜜状，黏稠度上升，冷香之外多出一层熟果般的甜。胸前双峰开始泌出与汁液同源的乳白液体，被含住吮吸时随吸力成股涌出。此阶段可通过意志调节蕊状结构的开合频率，频率升高时吸附加强，主","lock":"「极乐引·梅蕊篇」朱批：蕊瓣翻张温养灵药，纳丹化水，蜜液同具神丹造化。"},"3":{"name":"三阶段","desc":"内壁在冷热交替中析出一层极薄的霜状凝结，触感转为先凉后烫，肉棒进入时形成明显的温差冲击。蕊心深度增加，进入任意一点均被两组结构同时夹持，一组产生吸附，一组产生向外推压，两种力量交替出现，节奏约每三息轮换一次，轮换时出现被推出去又被吸回来的两段感。小腹浮现梅花状的淡青纹路，并随高峰向腰侧蔓延。高潮时花径收缩与霜状凝结同时发生，汁液自穴口成股涌出，量足以顺着大腿","lock":"「极乐引·梅蕊篇」朱批：霜凝玉壁温差现，推吸交错，青梅道纹蔓延腰腹。"},"4":{"name":"四阶段","desc":"胸前形成一处稳定的蕊心显化，位于双峰正中，外观为一点半透明的淡青花蕊，触感冰凉，与双峰其余部分的温热形成明显分界，按压时引发花径同步收缩。高潮后香气外溢，可在身下织物与所处环境中残留数个时辰。此阶段携带者对是否接纳具有主动控制权，通过调节蕊鸣频率可在接纳与排斥之间切换；排斥时内壁整体向外推压，接纳时立即转为全线吸附，被夹住一次后很难再退出。","lock":"「极乐引·梅蕊篇」朱批：双峰蕊心受按通幽径，或拒或纳，全凭神识一念开合。"}}},"bingpojianxinxue":{"id":"bingpojianxinxue","name":"冰魄剑心穴","carrier":"苏倾寒","type":"阴窍绝品 · 剑骨冰魄","brief":"阴窍绝品名器，宿主以剑入道，至纯剑骨与元阴凝结化窍。传其门户有锋芒内敛之坚韧封障，唯有以刚克刚或水火相济方得其门而入。","stages":{"1":{"name":"一阶段","desc":"元阴被破、花宫门户被顶到，则被激活。入口为多层结构，最内一层由寒气凝成的剑意封膜封闭，肉棒需先破开该层才能进入，破层时有筋络崩断般的顿感与短促刺痛。进入后内壁贴合极紧，表面布满细密的纵向寒棱，沿肉棒轴向刮擦，触感偏冷、偏涩、带轻微麻感。汁液稀薄冰凉，气味清淡，近雪水，量不大。此阶段内壁收缩频率低而深，每次收缩的间隔约五息，夹一下再松一下，松的时候仍贴着不放。","lock":"「极乐引·剑心篇」朱批：剑气封膜闭门户，落红化刃，内蕴化神诛邪真意。"},"2":{"name":"二阶段","desc":"第二层剑意封膜展开，形成交叉的斜向纹路，肉棒在其中进出时同时受到两组反向刮擦，产生相错的牵引感。内壁温度出现分层，深处偏冷、浅处转温，交接处反复切换，形成冷热交替的夹感。汁液转稠，带微弱甘味，气味中出现一丝金属般的清冽。携带者体内原有的寒冰剑气开始沿花径游走，在肉棒表面形成断续的刺感；被刺到最深处时，携带者的腰会自行向上迎一次，随即又强压回去。","lock":"「极乐引·剑心篇」朱批：寒棱交错如剑阵，冷热分层，剑煞游走触电生麻。"},"3":{"name":"三阶段","desc":"第三层封膜转为可吸入的寒气，随抽送被带入肉棒表层，使触感由冷涩转为冷滑，摩擦阻力下降但吸附增强，退出时产生明显的挽留感。内壁的纵向寒棱边缘软化，转为持续贴合与压迫。锁骨到小腹之间浮现一线斜剑状的淡银纹路，纹路随呼吸明暗。高潮时寒气短时间内集中自穴口泄出，接触外界的部分凝成细霜；携带者的声音在泄出的同时第一次断开，随后又被携带者自身咬回去。","lock":"「极乐引·剑心篇」朱批：斜剑银纹浮肌表，剑意化霜吸纯阳，挽留之意难平。"},"4":{"name":"四阶段","desc":"层叠剑意封膜全部破开，内壁恢复柔软，只在深处保留一处独立的寒气核心，触感为冷而韧，进入时产生短暂的空间扩开感，随后核心合拢把肉棒整个含住。同一路径二次进入不再受封膜阻挡，适应速度明显提高。此阶段携带者的自持下降，声音与呼吸的节律不再维持阻断，之前长期压制的反应在同一段时间内集中出现，一旦开口便接连不断。","lock":"「极乐引·剑心篇」朱批：重膜尽破留剑心，外冷内韧，百转柔肠一朝尽倾。"}}},"qinggexianmingxue":{"id":"qinggexianmingxue","name":"清歌弦鸣穴","carrier":"慕容清歌","type":"阴窍奇珍 · 天籁琴音","brief":"阴窍音律奇珍，天籁入骨，音律与气血共鸣。动情吐息之际宛如弦歌轻颤，暗含天道宫商角徵羽五音律动，神妙非常。","stages":{"1":{"name":"一阶段","desc":"元阴被破、花宫门户被顶到，则被激活。入口紧窄，内壁贴合均匀，无凹凸感，触感接近被绷紧的软绸。进入时无明显摩擦感，随即出现细密而均匀的振动，频率与携带者的呼吸同步，吸气时减弱、呼气时增强。汁液清透，气味清淡，带一丝类似松香与弦丝的味道，量随呼吸的节律一波波出现，一波比一波多。此阶段触感以持续的细微振动为主，位置均匀分布，像整条内壁在同时出声。","lock":"「极乐引·弦歌篇」朱批：气血微颤应呼吸，松香泛起，整壁低鸣如抚素琴。"},"2":{"name":"二阶段","desc":"内壁的束状结构分化为多组，各自独立振动，互不同步，肉棒在不同深度会同时受到两组以上频率不同的振动，形成相错的推压与回抽。汁液转稠，量增加，内壁温度略升。携带者一旦发声，振动频率会随音高改变，音越高振动越细密，音越低振动越沉；被逼出声音时内壁会短暂自我加强，振幅提高约一倍，等于携带者每叫一声就自己把肉棒夹紧一次。","lock":"「极乐引·弦歌篇」朱批：泛音分化多重束，娇啼愈尖夹缚愈紧，音律自为锁阳扣。"},"3":{"name":"三阶段","desc":"多组振动叠加成稳定的复合波形，波形沿内壁循环推进，进入任意位置都会被连续三段不同频率的振动依次扫过，形成周期性的收放节律。汁液转为黏滑，气味变浓且带明显和弦感。内壁开始对外界声音产生反应，附近有连续乐音时振动会自动向该音高靠拢；若一直闭口不出声，振动会转沉压向深处，逼携带者开口。颈侧至锁骨之间浮现一线淡金纹路，其明暗与振动频率一致。","lock":"「极乐引·弦歌篇」朱批：宫商交叠领域生，金纹明灭，波及方圆女修同频泄身。"},"4":{"name":"四阶段","desc":"波形稳定后可脱离直接动作自行维持，仅在外部声音变化时调整。内壁保留一处集中的振动核心，位于深处，进入时产生一次全壁同频的共振，持续约两息，期间内壁整体贴合并发声。此后声音不再受控，振动与音高之间形成固定关联，无法再主动压低；同一路径二次进入不再需要重新积累，反应速度明显提高，尚未开口，里面已经先响。","lock":"「极乐引·弦歌篇」朱批：花宫深处凝琴核，无需铺垫，甫一接近里面先鸣相迎。"}}},"liuyandiexinxue":{"id":"liuyandiexinxue","name":"流焰叠薪穴","carrier":"顾云舒","type":"阴窍奇珍 · 流光幻蝶","brief":"阴窍流光奇珍，极乐引载其如薪火相传、余温不绝。气机运转之际暗金流光如蝶，天生蕴藏淬炼兵甲、反哺纯阳之神火潜能。","stages":{"1":{"name":"一阶段","desc":"元阴被破、花宫门户被顶到，则被激活。入口温热，内壁贴合充分，进入时先产生缓慢而均匀的吸附，无明显摩擦感。内壁温度随交合轮次逐次升高，第一轮结束后温度不回落，而是在深处留存一部分，下一次进入时起步就比上次更烫。汁液金红色、粘稠、带温热感，量中等，气味接近熬煮过的果实。体表在小腹出现浅淡的暗金纹路，纹路随每一轮的温度上升加深一分。","lock":"「极乐引·流焰篇」朱批：余温积存步步高，流光如蝶，暗金细纹铭刻小腹。"},"2":{"name":"二阶段","desc":"滑液进一步粘稠，呈蜜状，内壁整体温度抬升，同时在深处形成一处集中的热源。该热源使深处触感明显偏烫，浅处仍维持温和，形成持续的温度差；热源位置可随体位改变随机移动，移动时在内壁上留下短暂的移动热痕，像一条火线从内壁爬过去。携带者的呼吸频率低于常人，但吸吮的力度不降，每一次吸附都伴随深处热源的集中释放；想缓一缓时里面的温度反而更高。","lock":"「极乐引·流焰篇」朱批：游移热痕如走线，深烫浅温，抽送越缓内热愈烈。"},"3":{"name":"三阶段","desc":"内壁积存的余温由滑液转为蒸汽状热雾，肉棒在湿滑与雾气之间交替通过，抽送时热雾被挤到浅层，形成明显的内外温差，一路热浪推着走。内壁出现密集的热纹，边缘由锐转柔，转为持续的吮吸与压迫，温度维持在同一水平不再回落。颈后至双侧肩胛之间浮现暗金流焰纹路，与呼吸的起伏同步明暗。此阶段被撞得越快，积温越稳，停下反而难受。","lock":"「极乐引·流焰篇」朱批：热雾蒸腾成熔炉，淬炼兵刃法器，品阶威能随火候暴涨。"},"4":{"name":"四阶段","desc":"热源不再依赖持续性交合即可维持，进入前已完成积温时，其温度可在数刻内保持；同一路径二次进入无需重新积温。高峰时全部积存的热量在极短时间内集中释放，热浪自结合处向外扩散，体表渗出的汗与汁液混在一起，离体后仍带热量。事后热度不随结束散尽，仍在深处维持一段时间，痕迹可留数处。此阶段携带者对温度的耐受上升，对节奏的耐受下降，松手就自己贴回去。","lock":"「极乐引·流焰篇」朱批：薪火相传热不散，高峰瞬释，身心耐热终生难舍阳息。"}}},"fenghuangyuhua":{"id":"fenghuangyuhua","name":"凤凰羽花","carrier":"陆烬颜","type":"阴窍绝品 · 涅槃凤羽","brief":"肢足类绝世奇器，异象凝于足心与双腿，天生泛起暖羽异香。相传身具神禽涅槃余脉，与纯阳之息天然共鸣，越是相持越见坚韧。","stages":{"1":{"name":"一阶段","desc":"元阴被破时激活，载体在双足心与腿根内侧。足心蕴出薄汗状的暖津，触感温润不涩，足趾能屈伸扣握，足心正中那点花心受摩挲时自行开合，如活物含吮，含住后能凭足弓的收放把对方箍住不放。腿根内侧温度较别处高一线，夹持时贴合严密，久夹不松。花径受凤凰余炎浸润，温而不烫，内壁收束的节律与腿法同步，腿一动，内壁便跟着收一下。此阶段暖津清透微黏，气味为花香混暖羽的馥郁暖香，浓度","lock":"「极乐引·凤羽篇」朱批：足心生暖津，足趾扣握如花开合，腿法与花径同律。"},"2":{"name":"二阶段","desc":"羽纹上溯至腿根，纹路转赤金并绽出细密的花形脉络，泛出热光。足心的花心能主动开合得更深更快，双足可分别以不同节奏收束，一紧一松交替，等于两处同时夹。腿根夹持的炎力转盛，贴合处出现的不是单纯的热，而是热里有韧，越夹越紧，越紧越烫；对方腰背会被这股韧劲牵着走，抽送越快，缠得越密。暖津由清透转为粘稠如蜜，充足而不黏滞，改称「炽情羽津」；暖香可及一丈，闻者下腹发紧。此","lock":"「极乐引·凤羽篇」朱批：赤金凰纹上溯腿根，羽津黏蜜，夹持如活翼绞缠。"},"3":{"name":"三阶段","desc":"羽纹上溯至腰。足踝处可自行凝出赤色翎羽状的炎力虚影，随情动聚散，虚影擦过对方时额外带上一层灼热的抽打感。足心与腿根的收束转为持续，不再需要主动施力，停在一处也会自行夹吸；炎力自腿足涌入经脉并向上盘行，使对方四肢末端发热、指尖发麻，越往上越沉。暖津出量增加，足心湿成一片，气味转浓可及三丈，五丈内以镜类法器可辨。腰侧浮现羽列纹路，与呼吸同频明暗；被逼到极处时双腿","lock":"「极乐引·凤羽篇」朱批：足踝赤翎擦虚空，炎力反哺主人，泄身后阳息反更盛。"},"4":{"name":"四阶段","desc":"自足踝至腰后凝出一束火凤尾羽虚影，静息时暖金色，情动时转赤红并显出羽列纹路。足心与腿根可脱离直接接触维持余炎，进入前已积温时，进入后即自行收紧；同一路径二次进入无需重新铺垫，反应速度明显提高。暖香满室，赤足踏地处凝出短时火痕，结束后仍在原处留存一段时间。此阶段两处羽纹在情动至极时同时显形，腿足一侧为凰纹，主人小腹或腰际一侧为凤纹，一明一暗交替而应。","lock":"「极乐引·凤羽篇」朱批：足下凰纹腹间凤，双纹交相辉映，尾羽涅槃回路锁死。"}}}};

  const mobileViews = new Map();
  const mobileModalStops = [];
  let activeModalRelicId = '', activeModalFocus = null;

  function xsdHostUiDoc(fallback) {
    let d = fallback || DOC() || document;
    try {
      let w = d.defaultView;
      for (let i = 0; w && i < 8; i++) {
        const p = w.parent;
        if (!p || p === w) break;
        if (!p.document || !p.document.body) break;
        d = p.document; w = p;
      }
    } catch (e) { /* 跨源时留在最近的可访问文档 */ }
    return d;
  }

  function xsdApplyPanelLayout(wrap) {
    const width = wrap.getBoundingClientRect().width;
    if (!(width > 0)) return;
    const layout = width <= 600 ? 'mobile' : width <= 900 ? 'compact' : 'desktop';
    if (wrap.getAttribute('data-xds-layout') !== layout) wrap.setAttribute('data-xds-layout', layout);
    wrap.setAttribute('data-xds-tiny', width < 350 ? '1' : '0');
    const cols = Math.max(3, Math.min(8, Math.floor((width + 8) / 64)));
    wrap.style.setProperty('--xsd-relic-columns', String(cols));
  }

  function xsdObservePanel(wrap) {
    for (const [el, view] of mobileViews) {
      if (!el.isConnected && view.wasConnected) { view.stop(); mobileViews.delete(el); }
    }
    let view = mobileViews.get(wrap);
    if (!view) {
      const win = wrap.ownerDocument.defaultView || window;
      const update = () => {
        if (xsdMobileDisposed) return;
        if (!wrap.isConnected) {
          if (view.wasConnected) { view.stop(); mobileViews.delete(wrap); }
          return;
        }
        view.wasConnected = true;
        xsdApplyPanelLayout(wrap);
      };
      let stop;
      if (typeof win.ResizeObserver === 'function') {
        const observer = new win.ResizeObserver(update);
        observer.observe(wrap);
        stop = () => observer.disconnect();
      } else {
        win.addEventListener('resize', update);
        stop = () => win.removeEventListener('resize', update);
      }
      view = { stop, boxes: [], wasConnected: wrap.isConnected }; mobileViews.set(wrap, view);
    }
    xsdApplyPanelLayout(wrap);
    return view;
  }

  function xsdPlaceModal(modal, doc) {
    const win = doc.defaultView || window;
    const update = () => {
      if (modal !== activeModal && !modal.isConnected) return;
      const vv = win.visualViewport;
      const width = vv && vv.width || doc.documentElement.clientWidth || win.innerWidth;
      const height = vv && vv.height || win.innerHeight;
      const mobile = width <= 600 || (height <= 500 && win.matchMedia && win.matchMedia('(pointer: coarse)').matches);
      modal.setAttribute('data-xds-mobile-modal', mobile ? '1' : '0');
      modal.style.setProperty('inset', '0', 'important');
      modal.style.removeProperty('width'); modal.style.removeProperty('height');
      if (mobile) {
        modal.style.setProperty('top', (vv && vv.offsetTop || 0) + 'px', 'important');
        modal.style.setProperty('left', (vv && vv.offsetLeft || 0) + 'px', 'important');
        modal.style.setProperty('right', 'auto', 'important');
        modal.style.setProperty('bottom', 'auto', 'important');
        modal.style.setProperty('width', width + 'px', 'important');
        modal.style.setProperty('height', height + 'px', 'important');
      }
    };
    const bind = (target, type) => {
      if (!target || !target.addEventListener) return;
      target.addEventListener(type, update, { passive: true });
      mobileModalStops.push(() => target.removeEventListener(type, update));
    };
    bind(win, 'resize'); bind(win.visualViewport, 'resize'); bind(win.visualViewport, 'scroll');
    update();
  }

  function xsdCenterRelicTab(modal) {
    const tabs = modal.querySelector('.relic-tabs'), tab = modal.querySelector('.relic-tab.active');
    if (tabs && tab) tabs.scrollLeft = Math.max(0, tab.offsetLeft - tabs.offsetLeft - (tabs.clientWidth - tab.offsetWidth) / 2);
  }

  function xsdClearRelicPopover() {
    if (popoverTimer) clearTimeout(popoverTimer);
    popoverTimer = null;
    if (activePopover && activePopover.parentNode) activePopover.parentNode.removeChild(activePopover);
    activePopover = null;
  }

  function xsdCleanupMobileUI() {
    if (xsdMobileDisposed) return;
    xsdMobileDisposed = true;
    xsdClearRelicPopover(); xsdCloseRelicModal();
    try { xsdCloseLightbox(); } catch (e) { /* 忽略 */ }
    for (const view of mobileViews.values()) view.stop();
    mobileViews.clear();
    for (const [doc, rows] of xsdRelicDocBindings) {
      for (const [type, fn, capture] of rows) doc.removeEventListener(type, fn, capture);
      try { delete doc.__xsdRelicDelegateBound; } catch (e) { /* 忽略 */ }
    }
    xsdRelicDocBindings.clear();
    try { window.removeEventListener('pagehide', xsdCleanupMobileUI); } catch (e) { /* 忽略 */ }
  }


  let activePopover = null;
  let popoverTimer = null;

  function xsdHideRelicPopover() {
    if (popoverTimer) clearTimeout(popoverTimer);
    popoverTimer = setTimeout(() => {
      if (activePopover && activePopover.parentNode) {
        activePopover.parentNode.removeChild(activePopover);
      }
      activePopover = null;
    }, 160);
  }

  function xsdShowRelicPopover(targetBox, rel, st) {
    if (xsdMobileDisposed || !xsdMouseHoverEvent(null, targetBox) || activeModal) return;
    if (popoverTimer) clearTimeout(popoverTimer);
    const doc = (targetBox && targetBox.ownerDocument) || (typeof DOC === 'function' ? DOC() : document);
    if (!doc || !doc.body) return;
    if (activePopover && activePopover.parentNode) {
      activePopover.parentNode.removeChild(activePopover);
      activePopover = null;
    }

    const data = XSD_RELIC_STAGES[rel.id] || {
      name: rel.n,
      carrier: '仙姝',
      type: '绝品名器',
      stages: {}
    };

    const pop = doc.createElement('div');
    pop.className = 'xh-relic-popover';
    pop.setAttribute('data-xds-relic', rel.id);
    
    // 计算位置（视口左右智能躲避）
    const rect = targetBox.getBoundingClientRect();
    const win = doc.defaultView || window;
    const winW = win.innerWidth || 1000;
    const isLeft = rect.left < winW / 2;
    const scrollX = win.pageXOffset || (doc.documentElement && doc.documentElement.scrollLeft) || 0;
    const scrollY = win.pageYOffset || (doc.documentElement && doc.documentElement.scrollTop) || 0;
    
    pop.style.top = Math.max(10, rect.top + scrollY - 20) + 'px';
    if (isLeft) {
      pop.style.left = (rect.right + scrollX + 12) + 'px';
    } else {
      pop.style.left = Math.max(10, rect.left + scrollX - 355) + 'px';
    }

    let ownerHtml = '';
    if (st.state === 'self') {
      ownerHtml = '<div class="pop-owner">● 目前归属者：' + esc(st.owner || '你') + '（契约认主）</div>';
    } else if (st.state === 'other') {
      ownerHtml = '<div class="pop-owner other">● 目前归属者：' + esc(st.owner) + '（已被占据）</div>';
    } else {
      ownerHtml = '<div class="pop-owner none">○ 未出世 · 无人获得</div>';
    }

    let barsHtml = '';
    for (let i = 1; i <= rel.a; i++) {
      barsHtml += '<div class="stage-bar ' + (i <= st.arcs ? 'reached' : '') + '"></div>';
    }

    // 当前阶段核心神韵
    let cscHtml = '';
    const curStageData = data.stages && data.stages[st.arcs || 1];
    if (st.state !== 'none' && curStageData) {
      cscHtml = '<div class="current-stage-card">'
        + '<div class="csc-title"><span>【第' + XSD_RELIC_CN[st.arcs] + '阶段 · ' + esc(curStageData.name || '境界') + '】</span><span style="color:#4ade80;font-size:10px;">已激活</span></div>'
        + '<div class="csc-text">' + esc(curStageData.desc) + '</div>'
        + '</div>';
    } else {
      cscHtml = '<div class="current-stage-card">'
        + '<div class="csc-title"><span style="color:#9ca3af">【尚未成形】</span><span style="color:#9ca3af;font-size:10px;">未觉醒</span></div>'
        + '<div class="csc-text">' + esc(data.brief || '名器天生神秀，待红尘机缘与元阴破除后始现峥嵘。') + '</div>'
        + '</div>';
    }

    // 后续锁闭阶段
    let lockedHtml = '';
    for (let i = (st.state === 'none' ? 1 : st.arcs + 1); i <= rel.a; i++) {
      const sObj = data.stages && data.stages[i];
      const sName = sObj ? sObj.name : ('第' + XSD_RELIC_CN[i] + '阶段');
      lockedHtml += '<div class="locked-item"><span>' + esc(sName) + '</span><span>🔒 锁闭</span></div>';
    }

    const curStageNum = (st.state === 'none') ? 1 : Math.max(1, Math.min(4, st.arcs || 1));
    const imgUrl = xsdRelicCandidateUrl(rel.id, curStageNum);
    let filterStyle = (st.state === 'other') ? 'filter:invert(1) contrast(1.15);' : (st.state === 'none' ? 'filter:grayscale(1) brightness(.5);opacity:0.6;' : '');

    pop.innerHTML = '<div class="pop-header">'
      + '<div class="pop-avatar" style="background-image:url(\'' + imgUrl + '\');' + filterStyle + '"></div>'
      + '<div class="pop-titles">'
      + '<div class="pop-name"><span>' + esc(rel.n) + '</span><span class="pop-badge">' + esc(data.carrier) + ' · ' + esc(data.type) + '</span></div>'
      + ownerHtml
      + '</div>'
      + '</div>'
      + '<div class="pop-stages">' + barsHtml + '</div>'
      + cscHtml
      + (lockedHtml ? '<div class="locked-stages">' + lockedHtml + '</div>' : '')
      + '<div class="pop-footer" style="cursor:pointer;" title="点击可展开玄鉴画卷">✦ 点击展开「全景名器玄鉴」画卷（全13器自由查阅）</div>';

    pop.addEventListener('mouseenter', () => { if (popoverTimer) clearTimeout(popoverTimer); });
    pop.addEventListener('mouseleave', () => xsdHideRelicPopover());
    const triggerPopOpen = (e) => { if (e) e.stopPropagation(); xsdHideRelicPopover(); xsdOpenRelicModal(rel.id); };
    pop.addEventListener('click', triggerPopOpen);
    // 预览也只处理 click，避免同一次操作重复打开。

    doc.body.appendChild(pop);
    // 按真实浮层尺寸收回边界，窄消息 iframe 中也不向右溢出。
    const popRect = pop.getBoundingClientRect();
    pop.style.left = (scrollX + Math.max(10, Math.min(parseFloat(pop.style.left) - scrollX, winW - popRect.width - 10))) + 'px';
    const winH = win.innerHeight || doc.documentElement.clientHeight;
    pop.style.top = (scrollY + Math.max(10, Math.min(rect.top - 20, winH - popRect.height - 10))) + 'px';
    activePopover = pop;
  }

  let activeModal = null;
  let activeModalDoc = null;
  let activeModalKeyHandler = null;

  function xsdCloseRelicModal() {
    if (activeModal && activeModal.parentNode) {
      activeModal.parentNode.removeChild(activeModal);
    }
    activeModal = null;
    if (activeModalKeyHandler) {
      try {
        const doc = activeModalDoc || (typeof DOC === 'function' ? DOC() : null) || document;
        if (doc && doc.removeEventListener) doc.removeEventListener('keydown', activeModalKeyHandler);
      } catch (e) {}
      activeModalKeyHandler = null;
    }
    activeModalDoc = null; activeModalRelicId = '';
    for (const stop of mobileModalStops.splice(0)) { try { stop(); } catch (e) { /* 忽略 */ } }
    const focus = activeModalFocus; activeModalFocus = null;
    try { if (focus && focus.isConnected && typeof focus.focus === 'function') focus.focus({ preventScroll: true }); } catch (e) { /* 忽略 */ }
  }

  function xsdOpenRelicModal(relicId) {
    if (xsdMobileDisposed) return false;
    const doc = xsdHostUiDoc((typeof DOC === 'function' ? DOC() : null) || document);
    if (!doc || !doc.body) return false;
    const wanted = XSD_RELICS.find(r => r.id === relicId) || XSD_RELICS[0];
    if (activeModal && activeModal.isConnected && activeModalDoc === doc && activeModalRelicId === wanted.id) return true;
    xsdClearRelicPopover(); xsdCloseRelicModal();
    activeModalFocus = doc.activeElement;
    try { if (typeof ensureStyleInjected === 'function') ensureStyleInjected(doc); } catch (e) {}
    try { if (typeof document !== 'undefined' && document !== doc && typeof ensureStyleInjected === 'function') ensureStyleInjected(document); } catch (e) {}

    const curRel = XSD_RELICS.find(r => r.id === relicId) || XSD_RELICS[0];
    const stat = xsdStatData() || {};
    const known = stat.known || xsdKnown() || {};
    const idEl = doc.querySelector('[data-xds="id"]') || (typeof document !== 'undefined' ? document.querySelector('[data-xds="id"]') : null);
    const idStr = (stat && stat.身份) || (idEl && idEl.textContent.trim()) || '';
    const customOwners = (stat && (stat.名器归属 || stat.relic_owners)) || null;

    const modal = doc.createElement('div');
    modal.id = 'xsd-relic-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'xsd-relic-modal-title');
    // 行内绝对强保样式：采用顶部安全流式对齐 + 容器滚动，杜绝居中溢出导致顶部关闭按钮被推至屏幕外
    modal.style.cssText = 'position:fixed!important;inset:0!important;background:rgba(0,0,0,0.85)!important;backdrop-filter:blur(6px)!important;-webkit-backdrop-filter:blur(6px)!important;z-index:9999999!important;display:flex!important;justify-content:center!important;align-items:flex-start!important;overflow-y:var(--xsd-modal-overflow,auto)!important;-webkit-overflow-scrolling:touch!important;padding:var(--xsd-modal-padding,20px 10px)!important;box-sizing:border-box!important;';

    const renderInner = (relObj) => {
      const st = xsdRelicState(relObj, known, idStr, customOwners);
      const data = XSD_RELIC_STAGES[relObj.id] || { name: relObj.n, carrier: '仙姝', type: '绝品名器', stages: {} };
      const curStage = (st.state === 'none') ? 1 : Math.max(1, Math.min(4, st.arcs || 1));
      const imgUrl = xsdRelicCandidateUrl(relObj.id, curStage);
      let filterStyle = (st.state === 'other') ? 'filter:invert(1) contrast(1.15);' : (st.state === 'none' ? 'filter:grayscale(1) brightness(.5);opacity:0.6;' : '');

      let tabsHtml = '';
      XSD_RELICS.forEach(r => {
        const rSt = xsdRelicState(r, known, idStr, customOwners);
        let cls = 'relic-tab';
        if (r.id === relObj.id) cls += ' active';
        else if (rSt.state === 'other') cls += ' other';
        tabsHtml += '<button type="button" class="' + cls + '" data-tab-id="' + r.id + '" aria-pressed="' + (r.id === relObj.id ? 'true' : 'false') + '">' + (rSt.state === 'self' ? '● ' : (rSt.state === 'other' ? '▲ ' : '○ ')) + esc(r.n) + '</button>';
      });

      let ownerBadge = '';
      if (st.state === 'self') {
        ownerBadge = '<div class="owner-badge">✦ 目前烙印归属：' + esc(st.owner || '你') + '（契约认主）</div>';
      } else if (st.state === 'other') {
        ownerBadge = '<div class="owner-badge other">▲ 目前烙印归属：' + esc(st.owner) + '（已被占据）</div>';
      } else {
        ownerBadge = '<div class="owner-badge none">○ 尚未出世 · 无人获得</div>';
      }

      let gridHtml = '';
      for (let i = 1; i <= relObj.a; i++) {
        const isReached = (st.state !== 'none') && (i <= st.arcs);
        const sObj = (data.stages && data.stages[i]) || { name: '第' + XSD_RELIC_CN[i] + '境界', desc: '', lock: '' };
        const stageImg = xsdRelicCandidateUrl(relObj.id, i);
        const stageImgFilter = isReached ? (st.state === 'other' ? 'filter:invert(1) contrast(1.15);' : '') : 'filter:grayscale(1) brightness(.45);opacity:.5;';
        gridHtml += '<div class="stage-card ' + (isReached ? 'unlocked' : 'locked') + '">'
          + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">'
          + '<div style="width:34px;height:34px;border-radius:50%;background-image:url(\'' + stageImg + '\');background-size:cover;background-position:center;border:1px solid ' + (isReached ? (st.state === 'other' ? '#ff7675' : '#d4af37') : '#444') + ';flex-shrink:0;' + stageImgFilter + '"></div>'
          + '<div>'
          + '<span class="sc-badge">第' + XSD_RELIC_CN[i] + '境界</span>'
          + '<div class="sc-title" style="margin:2px 0 0 0;">' + esc(sObj.name) + '</div>'
          + '</div>'
          + '</div>'
          + '<span class="sc-status-pill">' + (isReached ? '已觉醒' : '🔒 锁闭') + '</span>'
          + '<div class="sc-field-title">【玄妙体征】</div>'
          + '<div class="sc-field-text">' + esc(isReached ? (sObj.desc || data.brief) : '【天机未启】玄妙道机隐于混沌阴阳之间，待双修火候与天道机缘突破方可显化。') + '</div>'
          + (isReached ? '' : ('<div class="sc-lock-hint" style="color:#d4af37;background:rgba(212,175,55,.08);border:1px solid rgba(212,175,55,.2);padding:6px 10px;border-radius:4px;font-size:11px;line-height:1.5;">' + esc(sObj.lock || '「极乐引」残篇朱批：玄妙道机隐于混沌，待红尘机缘方显真章。') + '</div>'))
          + '</div>';
      }

      return '<div class="modal-wrap">'
        + '<div class="modal-header">'
        + '<div class="header-left">'
        + '<div class="relic-emblem" style="background-image:url(\'' + imgUrl + '\');' + filterStyle + '"></div>'
        + '<div class="title-group">'
        + '<h1 id="xsd-relic-modal-title"><span>仙姝墮 · 名器玄鉴</span><span style="font-size:12px;font-weight:400;color:#d4af37;border:1px solid rgba(212,175,55,.3);padding:1px 6px;border-radius:3px;">' + esc(data.type) + '</span></h1>'
        + '<div class="title-sub">载体宿主：' + esc(data.carrier) + ' · ' + esc(relObj.n) + '</div>'
        + '</div>'
        + '</div>'
        + '<div class="header-right">'
        + ownerBadge
        + '<button type="button" class="close-btn" data-modal-close="1" title="关闭玄鉴" aria-label="关闭玄鉴">✕</button>'
        + '</div>'
        + '</div>'
        + '<div class="relic-tabs">' + tabsHtml + '</div>'
        + '<div class="stages-grid">' + gridHtml + '</div>'
        + '<div class="modal-footer">'
        + '<div class="modal-footer-hint">'
        + '<div>✦ 名器 1-4 阶段已并入玄鉴画卷 · 点击标签即可自由翻阅全器</div>'
        + '<div class="modal-footer-esc">按 ESC 键或点击遮罩关闭</div>'
        + '</div>'
        + '<button type="button" class="modal-close-action" data-modal-close="1">✕ 关闭玄鉴</button>'
        + '</div>'
        + '</div>';
    };

    modal.innerHTML = renderInner(curRel);

    let backdropPress = null;
    const startPress = e => {
      const p = e.touches && e.touches[0] || e;
      backdropPress = { outside: e.target === modal, x: p.clientX, y: p.clientY };
    };
    const modalWin = doc.defaultView || window;
    modal.addEventListener('PointerEvent' in modalWin ? 'pointerdown' : 'mousedown', startPress, { passive: true });
    if (!('PointerEvent' in modalWin)) modal.addEventListener('touchstart', startPress, { passive: true });
    modal.addEventListener('touchmove', e => {
      if (modal.getAttribute('data-xds-mobile-modal') === '1' && !e.target.closest('.stages-grid, .relic-tabs') && e.cancelable) e.preventDefault();
    }, { passive: false });
    const handleModalInteraction = (e) => {
      const target = e.target;
      if (target === modal && (!backdropPress || !backdropPress.outside || Math.hypot(e.clientX - backdropPress.x, e.clientY - backdropPress.y) > 10)) return;
      if (target === modal || (target.closest && target.closest('[data-modal-close]'))) {
        e.stopPropagation();
        try { e.preventDefault(); } catch(err){}
        xsdCloseRelicModal();
        return;
      }
      const tab = target.closest && target.closest('[data-tab-id]');
      if (tab) {
        e.stopPropagation();
        try { e.preventDefault(); } catch(err){}
        const nextId = tab.getAttribute('data-tab-id');
        const nextRel = XSD_RELICS.find(r => r.id === nextId);
        if (nextRel) {
          modal.innerHTML = renderInner(nextRel);
          activeModalRelicId = nextRel.id;
          xsdCenterRelicTab(modal);
          const activeTab = modal.querySelector('.relic-tab.active');
          if (activeTab) { try { activeTab.focus({ preventScroll: true }); } catch (err) {} }
          try { modal.scrollTop = 0; } catch(err){}
        }
      }
    };

    modal.addEventListener('click', handleModalInteraction);

    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); xsdCloseRelicModal(); return; }
      if (e.key !== 'Tab') return;
      const controls = [...modal.querySelectorAll('button:not([disabled]), [tabindex="0"]')];
      const first = controls[0], last = controls[controls.length - 1];
      if (!first) return;
      if (e.shiftKey && (doc.activeElement === first || !modal.contains(doc.activeElement))) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && (doc.activeElement === last || !modal.contains(doc.activeElement))) {
        e.preventDefault(); first.focus();
      }
    };
    activeModalKeyHandler = onKey;
    activeModalDoc = doc;
    doc.addEventListener('keydown', onKey);

    doc.body.appendChild(modal);
    activeModal = modal; activeModalRelicId = curRel.id;
    xsdPlaceModal(modal, doc); xsdCenterRelicTab(modal);
    try { modal.querySelector('[data-modal-close]').focus({ preventScroll: true }); } catch (err) {}
    console.log(TAG, '[玄鉴画卷] 已成功展开名器画卷:', relicId);
    return true;
  }

  /** 把两翼纹章栏装到面板两侧（**面板本体不动**；窄屏由 CSS 折到面板下方）。防重跑。 */
  function xsdRenderRails(container) {
    if (xsdMobileDisposed) return false;
    try {
      const doc = container && container.ownerDocument || DOC();
      const panel = container && container.matches && container.matches('[data-xds-panel]')
        ? container : container && container.querySelector && container.querySelector('[data-xds-panel]');
      if (!doc || !panel || !panel.parentNode) return false;
      ensureStyleInjected(doc);
      let wrap = panel.parentNode;
      if (!(wrap.classList && wrap.classList.contains('xh-wrap'))) {
        const parent = wrap;
        wrap = doc.createElement('div'); wrap.className = 'xh-wrap';
        parent.insertBefore(wrap, panel); wrap.appendChild(panel);
        const l = doc.createElement('div'); l.className = 'xh-rail xh-rail-l';
        const r = doc.createElement('div'); r.className = 'xh-rail xh-rail-r';
        l.setAttribute('data-xds-rail','l'); r.setAttribute('data-xds-rail','r');
        wrap.insertBefore(l, wrap.firstChild); wrap.appendChild(r);
      }
      const l = wrap.querySelector('.xh-rail-l'), r = wrap.querySelector('.xh-rail-r');
      if (!l || !r) return false;
      const view = xsdObservePanel(wrap);
      if (!view.boxes.length || view.boxes.some(b => !b.box.isConnected)) {
        l.innerHTML = ''; r.innerHTML = ''; view.boxes = [];
        XSD_RELICS.forEach((rel, i) => {
          const box = doc.createElement('div'), img = doc.createElement('div'), holder = doc.createElement('div'), label = doc.createElement('span');
          box.setAttribute('data-xds-relic', rel.id); box.setAttribute('role', 'button');
          box.setAttribute('aria-haspopup', 'dialog'); box.tabIndex = 0;
          box.style.cursor = 'pointer'; img.className = 'xh-relic-img';
          holder.setAttribute('style', 'position:absolute;inset:0;pointer-events:none;');
          label.className = 'xh-relic-label'; label.textContent = rel.n;
          box.appendChild(img); box.appendChild(holder); box.appendChild(label);
          (i < 7 ? l : r).appendChild(box);
          const row = { box, img, holder, rel, st: null, signature: '' }; view.boxes.push(row);
          box.addEventListener('pointerenter', e => { if (row.st && xsdMouseHoverEvent(e, box)) xsdShowRelicPopover(box, rel, row.st); });
          box.addEventListener('pointerleave', e => { if (xsdMouseHoverEvent(e, box)) xsdHideRelicPopover(); });
          if (!('PointerEvent' in (doc.defaultView || window))) {
            box.addEventListener('mouseenter', e => { if (row.st && xsdMouseHoverEvent(e, box)) xsdShowRelicPopover(box, rel, row.st); });
            box.addEventListener('mouseleave', () => xsdHideRelicPopover());
          }
          box.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); xsdOpenRelicModal(rel.id); });
          box.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); box.click(); }
          });
        });
      }
      const stat = xsdStatData() || {}, known = stat.known || xsdKnown() || {};
      const idEl = panel.querySelector('[data-xds="id"]');
      const idStr = stat.身份 || idEl && idEl.textContent.trim() || '';
      const customOwners = stat.名器归属 || stat.relic_owners || null;
      for (const row of view.boxes) {
        const { rel, box, img, holder } = row;
        const st = xsdRelicState(rel, known, idStr, customOwners); row.st = st;
        const stage = st.state === 'none' ? 1 : Math.max(1, Math.min(4, st.arcs || 1));
        const url = xsdRelicCandidateUrl(rel.id, stage);
        const signature = JSON.stringify([st.state,st.owner,st.arcs,url]);
        if (row.signature === signature) continue;
        row.signature = signature; box.className = 'xh-relic xh-relic-' + st.state;
        const tip = rel.n + (st.state === 'none' ? '（未出世 · 无人获得）' : '（第' + XSD_RELIC_CN[st.arcs] + '阶段' + (st.state === 'other' ? ' · 已被占据' : '') + '）\n目前归属者：' + (st.owner || '你'));
        box.title = tip; box.setAttribute('aria-label', tip);
        const filter = st.state === 'other' ? 'filter:invert(1) contrast(1.15);' : st.state === 'none' ? 'filter:grayscale(1) brightness(.5);opacity:0.6;' : '';
        img.setAttribute('style', 'background-image:url("' + url + '");' + filter);
        holder.innerHTML = xsdRelicSvg(rel, st);
      }
      return true;
    } catch (e) { console.warn(TAG, '[移动端布局]', (e && e.message) || e); return false; }
  }

  /** 纯入口：骨架静态可用 → 填值 → 出错保留骨架（规范 §4：脚本失败也不白屏） */
  function mount(container, rawMsg, msgId) {
    try {
      if (!container || xsdMobileDisposed) return false;
      ensureStyleInjected(container.ownerDocument || DOC());
      const skel = skeleton();
      if (skel) container.innerHTML = skel;
      let r = null;
      try { r = xsdFillPanel(msgId, rawMsg, container); }
      catch (e) { console.warn(TAG, 'mount 填值失败（骨架已显示，不影响阅读）：', (e && e.message) || e); }

      try { xsdRenderRails(container); } catch (e) { /* 忽略 */ }

      try { renderInventory(container, container.ownerDocument || DOC()); } catch (e) { /* 忽略 */ }

      try { if (typeof wirePortrait === 'function') wirePortrait(); } catch (e) { /* 忽略 */ }
      return r || true;
    } catch (e) {
      console.warn(TAG, 'mount 出错（已吞掉）：', (e && e.message) || e);
      return false;
    }
  }

  return {
    version: 'v3.0',
    name: '仙姝墮态势HUD',
    CSS_CONTENT: XSD_CSS,
    ensureStyleInjected: ensureStyleInjected,
    getMessageData: getMessageData,
    detectCurrentMessageId: detectCurrentMessageId,
    locateMes: locateMes,
    mount: mount,
    fillPanel: (id, raw) => xsdFillPanel(id, raw),
    renderRails: (c) => xsdRenderRails(c),
    renderInventory: (panel, doc) => renderInventory(panel, doc),
    refreshRelics: () => {
      try {
        const D = DOC();
        const wraps = D.querySelectorAll ? D.querySelectorAll('.xh-wrap') : [];
        for (let i = 0; i < wraps.length; i++) xsdRenderRails(wraps[i]);
        const panels = D.querySelectorAll ? D.querySelectorAll('[data-xds-panel]') : [];
        for (let i = 0; i < panels.length; i++) renderInventory(panels[i], D);
      } catch (e) { /* 忽略 */ }
    },
    openRelicModal: (id) => xsdOpenRelicModal(id),
    closeRelicModal: () => xsdCloseRelicModal(),
    openItemModal: (it, doc) => xsdOpenItemModal(it, doc),
    disposeMobileUI: xsdCleanupMobileUI,
  };
})();

/* 挂到三层 window：迷你壳里的 bootstrap 在**任意一层**都取得到 */
(function registerHud() {
  const targets = [];
  const push = (get) => { try { const w = get(); if (w && !targets.includes(w)) targets.push(w); } catch (e) { /* 跨源 */ } };
  push(() => window); push(() => window.parent); push(() => window.top);
  let ok = 0;
  for (const w of targets) {
    try {
      w.XsdHUD = XsdHUD;
      w.__xsdMobileCleanup = XsdHUD.disposeMobileUI;
      w.__xsdFillPanel = xsdFillPanel;
      w.__xsdRefreshRelics = () => (XsdHUD.refreshRelics && XsdHUD.refreshRelics());
      w.xsdOpenRelicModal = (id) => (XsdHUD.openRelicModal && XsdHUD.openRelicModal(id));
      w.xsdCloseRelicModal = () => (XsdHUD.closeRelicModal && XsdHUD.closeRelicModal());
      w.xsdOpenItemModal = (it, doc) => (XsdHUD.openItemModal && XsdHUD.openItemModal(it, doc));
      ok += 1;
    } catch (e) { /* 跨源跳过 */ }
  }
  console.log(TAG, '[接线] XsdHUD 已挂到 ' + ok + ' 个全局（v3.0 · mount/getMessageData/ensureStyleInjected）');
})();

try { window.addEventListener('pagehide', XsdHUD.disposeMobileUI); } catch (e) { /* 忽略 */ }

/* ─────────── 冗余加速：事件钩子（缺失时整段跳过；拔掉不影响主路径）─────────── */
(function hookEvents() {
  try {
    if (typeof eventOn !== 'function' || typeof tavern_events === 'undefined') {
      console.warn(TAG, '[冗余加速] eventOn / tavern_events 不可用 —— 不影响渲染与点击（靠上面的接线）');
      return;
    }
    const on = (name, fn) => { try { if (tavern_events[name]) eventOn(tavern_events[name], fn); } catch (e) { /* 忽略 */ } };
    on('CHARACTER_MESSAGE_RENDERED', (id) => {
      try { wirePortrait(); } catch (e) { /* 自带 try，这里是双保险 */ }
      try { schedule(Number(id)); } catch (e) { /* 忽略 */ }
    });
    on('CHAT_CHANGED', () => { try { wirePortrait(); } catch (e) { /* 忽略 */ } try { fillAll(); } catch (e) { /* 忽略 */ } });
    on('MESSAGE_SWIPED', (id) => { try { schedule(Number(id)); } catch (e) { /* 忽略 */ } });
    console.log(TAG, '[冗余加速] 事件钩子已接（换楼重绑监听 ＋ 补填面板）');
  } catch (e) { console.warn(TAG, '[冗余加速] 事件钩子接线失败（不影响主路径）：', (e && e.message) || e); }
})();
