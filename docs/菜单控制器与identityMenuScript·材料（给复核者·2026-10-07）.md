# 菜单控制器与 identityMenuScript · 材料汇编（给复核者 · 2026-10-07）

> 用途：你（GPT）要的三样材料 —— **① 菜单生成器完整代码；② 填表／提交处理函数；③ `identityMenuScript` 完整配置**。
> 全部**原样摘录**，不摘要、不改写；找不到的项如实写「未找到」，不猜。生成脚本：`scratch/_export_menu_materials2.mjs`（可重跑复现）。

> ⚠️ 上一版导出脚本把 17 个文件（含 `archive/_vendor/MVU/bundle.js` 等）全部照录，产出 3.3 MB 无法使用 —— 本版改为**白名单**，只收下面这几份。

## 一、菜单生成器（完整代码）

### `src/first_floor_rebuild/menu-builder.cjs`（7805 字符，逐字全录）

```javascript
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { FLOWER_ROSTER } = require('./flower-roster.cjs');
const MENU_CSS = fs.readFileSync(path.join(__dirname, 'menu.css'), 'utf8');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isImage = value => typeof value === 'string' && (/^data:image\/(?:png|webp|jpeg|gif|avif);base64,/i.test(value) || /^https?:\/\//i.test(value));

function buildMenuHtml({ roster = FLOWER_ROSTER, assets = {}, tokenMap = {}, instanceId = 'xds-opening' } = {}) {
  if (!Array.isArray(roster) || !roster.length) throw new Error('FLOWER_ROSTER 至少需要一位角色');
  if (!/^[a-z][a-z0-9_-]*$/i.test(instanceId)) throw new Error('instanceId 只能使用字母、数字、下划线和连字符，且以字母开头');
  const seen = new Set();
  const attr = escapeHtml;
  function imageAttrs(token, key, kind) {
    const tokenName = String(token).replace(/^\{\{|\}\}$/g, '');
    const direct = isImage(token) ? token : tokenMap[token] || tokenMap[tokenName] || assets.menu?.[tokenName] ||
      (kind === 'portrait' ? assets.lightbox?.[key] || assets.panel?.[key] : assets.relics?.[key]);
    return `data-xds-image="${kind}" data-xds-token="${attr(tokenName)}" data-xds-asset-key="${attr(key)}"${isImage(direct) ? ` src="${attr(direct)}"` : ''}`;
  }
  const cards = roster.map(person => {
    if (!/^[a-z][a-z0-9_-]*$/i.test(person.id) || seen.has(person.id)) throw new Error('角色 id 必须合法且唯一：' + person.id);
    seen.add(person.id);
    return `<article data-xds-flower data-xds-roster-id="${attr(person.id)}" aria-label="${attr(person.name)}">
      <div data-xds-art-state><b>${attr(person.name)}</b><span>仙姿待绘入卷</span></div>
      <img data-xds-art ${imageAttrs(person.image, person.imageKey || person.id, 'portrait')} alt="${attr(person.name)}彩色立绘" loading="lazy" decoding="async">
      <div data-xds-badge title="${attr(person.relicName)} · 图鉴预览" aria-label="${attr(person.relicName)} · 图鉴预览"><span>待</span><img ${imageAttrs(person.relicIcon, person.relicKey || '', 'relic')} alt="${attr(person.relicName)}纹章" loading="lazy" decoding="async"></div>
      <div data-xds-card-info><div data-xds-card-name>${attr(person.name)}</div>${person.title ? `<div data-xds-card-title>${attr(person.title)}</div>` : ''}${person.sect ? `<div data-xds-card-sect>${attr(person.sect)}</div>` : ''}${person.quote ? `<p data-xds-card-quote>${attr(person.quote)}</p>` : ''}</div>
    </article>`;
  }).join('');
  const chips = (field, values) => `<div data-xds-chips>${values.map(value => `<button type="button" data-xds-fill="${field}" data-xds-value="${attr(value)}" aria-pressed="false">${attr(value)}</button>`).join('')}</div>`;
  const field = (name, label, placeholder, max, extra = '') => `<div data-xds-field-box><label data-xds-field-label for="${instanceId}-${name}">${label}</label><input type="text" id="${instanceId}-${name}" name="${name}" data-xds-field="${name}" class="xds-input" placeholder="${attr(placeholder)}" maxlength="${max}" ${extra}></div>`;
  const template = `<style>${MENU_CSS}</style><div class="xds-menu-wrapper" data-xds-menu>
    <input type="radio" class="xds-page-radio" data-xds-page="flower" id="${instanceId}-page-flower" name="${instanceId}-page" checked aria-label="太微百花谱">
    <input type="radio" class="xds-page-radio" data-xds-page="custom" id="${instanceId}-page-custom" name="${instanceId}-page" aria-label="自设问道书卷">
    <div class="xds-view-flower" data-xds-view="flower">
      <header data-xds-heading><div data-xds-eyebrow>揽 芳 卷</div><h2>太微百花谱</h2><p>雾隐仙姿 · 纹章辨器 · 一卷定命途</p></header>
      <div class="xds-flower-carousel" data-xds-carousel tabindex="0" role="region" aria-label="仙姝名录，左右翻阅">${cards}</div>
      <div data-xds-carousel-nav><button type="button" data-xds-carousel-step="-1" aria-label="向左翻阅">‹</button><span>左右翻阅仙姝名录 · 四阶纹章为图鉴预览</span><button type="button" data-xds-carousel-step="1" aria-label="向右翻阅">›</button></div>
      <div data-xds-section-title>择一命途 · 入太微红尘</div>
      <div data-xds-identity-grid>
        <button type="button" class="xds-mbtn" data-xds-entry data-xds-identity="赵无忧"><b>赵无忧</b><small>墨山道六弟子 · 原作主角</small></button>
        <details data-xds-lords><summary data-xds-entry><b>四大殿主 <span aria-hidden="true">⌄</span></b><small>残阳 · 肉山 · 九皇子 · 病相思</small></summary><div data-xds-lord-list><button type="button" data-xds-identity="焚欲殿主">焚欲殿主 · 残阳老怪</button><button type="button" data-xds-identity="欢喜殿主">欢喜殿主 · 肉山佛</button><button type="button" data-xds-identity="浊龙殿主">浊龙殿主 · 九皇子</button><button type="button" data-xds-identity="魂欢殿主">魂欢殿主 · 病相思</button></div></details>
        <label for="${instanceId}-page-custom" class="xds-mbtn" data-xds-entry data-xds-open-custom role="button" tabindex="0"><b>自设命途</b><small>问道问心 · 提笔亲定来历与机缘</small></label>
      </div><p data-xds-status role="status" aria-live="polite"></p>
    </div>
    <div class="xds-view-custom" data-xds-view="custom"><div class="xds-custom-scroll" data-xds-custom-form>
      <label for="${instanceId}-page-flower" data-xds-back role="button" tabindex="0">‹ 返回百花谱</label>
      <header data-xds-heading><div data-xds-eyebrow>自 设 · 问 道 问 心 简</div><h2>提笔定命 · 启卷入世</h2><p>道号、根骨与来处，皆由道友亲书。</p></header>
      <div data-xds-fields>
        ${field('custom_name', '道号尊名', '留空使用当前 Persona 名', 64, 'autocomplete="off"')}
        ${field('custom_gender', '根骨性别', '如：男 / 女 / 自定', 16, 'value="男" autocomplete="off"')}
        ${field('custom_age', '寿数年岁', '如：弱冠之年（20）', 32, 'autocomplete="off"')}
        <div data-xds-field-box><label data-xds-field-label for="${instanceId}-custom_cultivation">境界修为</label><input type="text" class="xds-input" id="${instanceId}-custom_cultivation" name="custom_cultivation" data-xds-field="custom_cultivation" placeholder="如：练气圆满、筑基初期" maxlength="96">${chips('custom_cultivation', ['练气圆满', '筑基初期', '筑基大圆满', '金丹大修'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_sect">入世身份</label><input type="text" class="xds-input" id="${instanceId}-custom_sect" name="custom_sect" data-xds-field="custom_sect" placeholder="宗门、行当或来历，随心填写" maxlength="128">${chips('custom_sect', ['大荒散修', '天枢剑宗弃徒', '墨山道外门散人', '天音阁弄琴客', '欢喜魔门谍客'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_timepoint">当前时点</label><input type="text" class="xds-input" id="${instanceId}-custom_timepoint" name="custom_timepoint" data-xds-field="custom_timepoint" placeholder="留空默认第一章（墨山探幽 · 仙盟历 1578 年 · 三月初三），可自定年月日，如「仙盟历 1579 年 · 六月初七」" maxlength="64">${chips('custom_timepoint', ['正章之前 · 仙盟历 1577 年 · 七月初一', '暗流微澜 · 仙盟历 1577 年 · 十二月初一', '第一章（墨山探幽）· 仙盟历 1578 年 · 三月初三', '南域大劫 · 仙盟历 1578 年 · 八月初一', '天溪兽潮 · 仙盟历 1579 年 · 一月初一', '天溪城破 · 仙盟历 1579 年 · 三月初一', '乱世割据 · 仙盟历 1579 年 · 六月初一', '极乐定局 · 仙盟历 1580 年 · 一月初一'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_origin">获取《极乐引》的机缘方式</label><textarea class="xds-textarea" data-xds-field="custom_origin" id="${instanceId}-custom_origin" name="custom_origin" rows="4" maxlength="1800" placeholder="捡得、窃取、夺来、师门密传……写下独属于你的机缘。"></textarea><p data-xds-help>留空采用默认来历；提交会先切换为自设，再将设定发送至当前会话。</p></div>
      </div><button type="button" class="xds-submit-seal" data-xds-action="submit-custom">提笔落款 · 启卷入世</button><p data-xds-status role="status" aria-live="polite"></p>
    </div></div>
  </div>`;
  // 消息 HTML 按一行输出，避免 Showdown 把缩进识别成代码块或插入额外 <br>。
  return template.replace(/\/\*[\s\S]*?\*\//g, '').replace(/>\s+</g, '><').replace(/[\r\n]+\s*/g, ' ').trim();
}

const MENU_HTML = buildMenuHtml();
module.exports = { MENU_HTML, MENU_CSS, FLOWER_ROSTER, buildMenuHtml };

if (require.main === module) fs.writeFileSync(path.join(__dirname, 'MENU_HTML.html'), MENU_HTML, 'utf8');

```

### `src/first_floor_rebuild/state_machine_first_floor.js`（140514 字符，照录前 40000 字符）

```javascript
/* ══════════════════════════════════════════════════════════════════════
 * 《仙姝墮》· 状态机（纯酒馆助手版）   v1.0   2026-09-27
 * ----------------------------------------------------------------------
 * 本脚本取代旧的「外挂变量插件」版本。模型**不再输出任何 JSON／变量块**，
 * 状态与身份改由本脚本自己解析、自己记账。七个钩子：
 *
 *   ① 状态条解析 —— 每轮 AI 消息末尾的状态条，**两种写法都认**：
 *        · 主格式（XML 式）`<地点>…</地点>`（2026-09-27 起升为主格式；外壳可为 <Status_block>／<StatusBlock>／<status>）
 *        · 兼容格式（YAML 式）`<Status_block>` 里的「标签：值」逐行（老聊天与旧开场白仍能读）
 *      字段名做别名归一（繁简／大小写／同义／`·` 分隔符），统一落到 stat_data 的规范键；
 *      口径与 `状态栏面板.js` 的 FIELD_MAP 一致。
 *   ② 身份与闸门 —— `stat_data.身份`／`stat_data.阵营` 写进酒馆的**消息层 ＋ 聊天层**
 *      （双写，消息层优先）。世界书里那 52 条 `@@if variables.stat_data…` 闸门读的
 *      就是酒馆自己的变量表，所以一条都不用改。
 *   ③ 推进命令 —— /已知 · /解锁 <字段> · /回锁 <字段> · /锚点 · /身份 [名字] · /刷新开场白
 *   ④ 身份点击菜单 —— 主文档事件委托：点第 0 楼的按钮 ⇒ 写身份 ＋ 切第 0 楼的 swipe
 *   ⑤ 身份条目开关 —— 按「【身份】<名字>」前缀把 6 条世界书条目拨成「开其一、关其余」
 *   ⑥ 锚点自动记账 —— 模型在状态栏 `<实际发生>` 栏里记「本回合确实发生了什么」，脚本读它**自动写账本**（不弹提示）
 *   ⑦ 收尾自检 ＋ 进度一致性校验 —— 缺状态栏时告警；「进度」与账本不符时只告警
 *
 * ⚠️ 触发架构（v1.4，2026-09-27 照抄外卡《大乾风华录 Ver2.0》的「被渲染时调用」）：
 *   **主路径 ＝ 渲染触发**。显示层正则「仙姝墮·状态栏」（`_build_card.js` 的 `PANEL_HTML`）把
 *   `<Status_block>…</Status_block>` 换成「面板 HTML ＋ 隐藏原文副本 ＋ 自包含 iframe」；
 *   iframe 里那份独立文档（不被 DOMPurify 清洗）在 `load` 时自己读宿主消息、算出楼号，
 *   再回调本脚本挂在 `window.parent` 上的全局入口 `__xsdStateTick(mesid, rawText)` ——
 *   这条链一走通，**下面那些 eventOn 钩子全拔掉，状态记账照样工作**。
 *   `MESSAGE_RECEIVED`／`CHARACTER_MESSAGE_RENDERED` 因此**降级为「可选冗余加速」**
 *   （早一拍、少一次回读），不是必需品；`MESSAGE_SENT`（命令拦截）与本脚本自管的
 *   `CHAT_CHANGED`／`CHAT_CREATED`／`MESSAGE_SWIPED` 仍然是**事件驱动**，
 *   因为外卡没有命令系统／换聊天语义，这部分照抄不了、也不许拆。
 *
 * 变更记录
 *   v1.0（2026-09-27）首版。由 v0.7 的同名功能改写：去掉了对旧变量插件的全部依赖，
 *        变量读写换成酒馆助手自带的 getVariables／replaceVariables／insertOrAssignVariables，
 *        新增「状态条解析 → 变量」这条路（v0.7 的状态是模型写变量块写进来的，现在由脚本读状态条）。
 *        状态条解析器**同时兼容 YAML 式与 XML 式**，字段名走别名归一（见 FIELD_ALIAS）——
 *        以后想把输出格式换成 XML，只改提示词即可，脚本不用动。
 *   v1.3（2026-09-27）**照抄外卡《大乾风华录 Ver2.0》的字段体系**：一级标签由 11 个扩到 19 个
 *        （新增 历时／天气／环境／线索／近闻／远闻／危机），并新增**可重复的「在场角色」子块**
 *        （`<角色1>…</角色1>`，内含 名／阶段／情况／心境／神态，最多 3 个），
 *        解析后**聚合成数组**写进 `stat_data.在场角色`。我们比外卡强的那一项（身份条目互斥）
 *        与「名器双轨纪律」原样保留，未动。
 *   v1.4（2026-09-27）**照抄外卡《大乾风华录 Ver2.0》的「被渲染时调用」触发架构**：
 *        新增全局入口 `window.__xsdStateTick(mesid, rawText)`（同时挂 `window.parent`／`window.top`），
 *        由卡内正则产出的 iframe 在加载时调用 ⇒ 解析与记账的主路径不再依赖宿主事件。
 *        `MESSAGE_RECEIVED`／`CHARACTER_MESSAGE_RENDERED` 退为冗余加速；命令与换聊天钩子原样保留；
 *        v1.1 的「只记最新一楼」闸门（`latestMessageId()`）**逐字保留**——改楼／翻历史一律只重绘不记账。
 *        我们的 `window.__xsdStateTick` 会**顺带调面板脚本的 `window.__xsdFillPanel`**（若在），
 *        这样即使面板脚本没挂事件钩子，被渲染时也能把格子填上（互斥项：条目互斥仍是我们更强，未动）。
 *
 * ⚠️ 运行环境：本脚本跑在酒馆助手的**脚本 iframe**（about:srcdoc）里。
 *    iframe 自己的 document 里一条消息都没有 ⇒ 碰主页面 DOM 必须走 `window.parent.document`。
 * ⚠️ 本脚本用到的酒馆助手接口**全部**做了 `typeof x === 'function'` 保护：
 *    取不到就降级 ＋ `console.warn`，**绝不在加载时抛错**（一个接口缺失不该让整张卡塌掉）。
 * ⚠️ 变量双写：`{type:'message', message_id:-1}`（最新一楼）与 `{type:'chat'}` 同时写。
 *    酒馆侧读变量表的顺序是 全局 ⊕ 初始 ⊕ 聊天层 ⊕ **消息层**（消息层最后 ⇒ 优先），
 *    只写聊天层会被消息层遮掉（闸门判 false、整条被剔除，实测踩过）。双写则两头都不丢。
 * ⚠️ 全部改动前后的 `stat_data` 快照都会打进 console（字段值截断到 24 字），**不打印正文**。
 * ══════════════════════════════════════════════════════════════════════ */

const TAG = '[仙姝堕·状态机]';
const VERSION = 'v1.5';

/* ═══════════════════════════════════════════════════════════
 * 一 · 台账
 * ⚠️ 下面所有字段名／身份名都必须与世界书闸门、`_card_greetings.txt`
 *    的 `@@@ <名字>` 段落名、`_build_card.js` 的隐藏正则**逐字一致**，不得改动。
 * ═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════
 * 一 · 账本字段表（**唯一真源 · 2026-09-29 合并**）
 *
 * 存在的原因（主人口径）：「2 得改，而且后面还要加很多呢」
 *   —— 原先把同一件事散在**三处**写死（字段清单／FIELD_DESC／ANCHOR_KEYWORDS），
 *   加一个字段要改三遍，加十几个必然会漏。现在**只在这张表里加一行**，
 *   下面会自动派生出：`AI_FIELDS` / `OPEN_FIELDS` / `ALL_FIELDS` /
 *   `FIELD_DESC` / `ANCHOR_KEYWORDS`。
 *
 * 一行 = { name, kind, desc, kws }
 *   · `kind`：`'ai'`   ＝ 可由剧情推进解锁（脚本按锚点**提议**，玩家自己 `/解锁` 才翻开）
 *             （一律同一套：模型在状态栏记、脚本自动记账）
 *             `'open'` ＝ 起手公开（四殿主身份下由 `openFieldsFor()` 自动置 true）
 *   · `desc`：玩家发 `/锚点` 时打印，方便决定解锁什么
 *   · `kws` ：锚点关键词（**只提示、不写变量**）。⚠️ 用**长词／专名**，
 *             免得「天溪城」「孤月」这种满篇都有的普通词每轮都弹提示。
 *
 * ⚠️ 字段名一律与世界书闸门、`状态字段表` 条、`_card_greetings.txt` 的 `@@@` 段名**逐字一致**，不得改名。
 * ⚠️ 顺序即「读顺序」（`/已知` 的打印顺序按它）：剧情推进 → 起手公开，新字段往所属段的末尾加。
 * ═══════════════════════════════════════════════════════════════════════ */
const FIELD_TABLE = [
  /* ── 剧情推进（可由剧情推进解锁） ── */
  { kind: 'ai', name: '极乐引入手', desc: '第二章 · 邪修洞府：**两支都置 true** —— ①替孤月中毒（含口交解毒那一场）②与孤月合力消灭邪修／探完洞府；两支的共同结果是拿到《极乐引》', kws: ['极乐引', '口含阴津'] },
  { kind: 'ai', name: '邪修洞府替孤月中毒', desc: '第二章 · 邪修洞府：**替孤月中毒那一支**（孤月以口含阴津度入营救那场）。⚠️ 只是"发生过的标记"（配立绘／分支用），**不单独作为《剧情》条的闸门**；正常路线不置它', kws: ['口含阴津', '孤月中毒', '替她解毒'] },
  { kind: 'ai', name: '已抵达天溪', desc: '第九—十章 · 一行抵达天溪城', kws: ['抵达天溪', '天溪城下', '入天溪城'] },
  { kind: 'ai', name: '孤月定情', desc: '第九章 · **墨山道孤剑崖、出发天溪之前的送别**：她主动封吻、把「冰心泪」亲手戴在他颈上，说「你……一定要平安回来。」（原文无「定情」二字，是卡片给的名）', kws: ['孤月定情', '互诉心意', '彼此说破'] },
  { kind: 'ai', name: '赵无忧坠渊', desc: '第十七—十九章 · 天溪城陷落、赵无忧遭重创坠落（雀奴／孤月失守的硬前置）', kws: ['葬魔渊', '坠渊', '坠入深渊', '金丹被击碎'] },
  { kind: 'ai', name: '封元镇灵环', desc: '第十四章 · 朱樱逢劫：**乳环当众暴露**那一次（残阳老怪扯开衣襟的那一刻）', kws: ['封元镇灵环'] },
  { kind: 'ai', name: '赵无忧看见乳环', desc: '赵无忧**亲眼看见**她乳尖上那对封元镇灵环——**不论何时、何种途径**（剧情八之前玩家操控时提前发现也算）', kws: ['乳环'] },
  { kind: 'ai', name: '灼酒流炎穴成形', desc: '第十五—十六章 · 赤羽堕凡尘', kws: ['灼酒流炎穴', '赤羽堕凡尘'] },
  /* ── 名器「成形」锚点（2026-09-30 主人过：名器类闸门**逐件补齐**，与 `灼酒流炎穴成形` 同一范式）
   *  ⚠️ 依据：`_audit_gates.mjs` 复查发现「名器本体条 ↔ 生成条」的闸门只做了灼酒流炎穴一件，
   *    其余几件启用却没闸门 ⇒ **正文一提到名器名就注入**，与「条目命中才算揭晓」的纪律打架。
   *  ⚠️ 每一条的持有者与 desc 都写明了册内出处；**册内没有章数可依的一律不编章数**（停用条那批已删），
   *    只写持有者＋那件事。逐条出处见 `二2-锚点扩充提案.md`。
   *  ⚠️ `烟霞灵乳` **故意不在这一批**：主人令「柳含烟出场即第二境」⇒ 没有「成形」这一步。 */
  { kind: 'ai', name: '九幽玄阴穴成形', desc: '孤月 · 九幽玄阴脉的伴生异穴，元阴初破、龙气贯体时成形（依据：【名器】九幽玄阴穴／【人物】孤月 秘密所在）', kws: ['九幽玄阴穴', '九幽玄阴脉'] },
  { kind: 'ai', name: '心魔茶璎乳成形', desc: '闻观语 · 蜜汁化乳、双峰泌灵乳三者齐现即彻底觉醒（依据：【设定】剧情发展简表「闻观语『心魔茶璎乳』显」）', kws: ['心魔茶璎乳', '璎珞茶蕊'] },
  { kind: 'ai', name: '般若菩提菊成形', desc: '楚灵夜 · 于积云古寺显现（依据：【剧情】十三）', kws: ['般若菩提菊'] },
  { kind: 'ai', name: '灵犀同心成形', desc: '苏瑶／苏玲 · 姐妹共构的同心异体（依据：【剧情】五 听雪双姝登场）', kws: ['灵犀同心', '灵犀同心穴', '同心异体'] },
  { kind: 'ai', name: '北冥潮生穴成形', desc: '雨霏柔 · 其本源气息可化帝鹏临霄阵与溟鲲吞天阵（依据：【设定】帝鹏临霄阵与溟鲲吞天阵）', kws: ['北冥潮生穴'] },
  { kind: 'ai', name: '玉虎噙香乳成形', desc: '云织梦 · 本源白虎煞气与至纯元阴可化虎啸震岳阵与玉虎镇渊阵（依据：【设定】虎啸震岳阵与玉虎镇渊阵）', kws: ['玉虎噙香乳', '月下蜜桃'] },
  { kind: 'ai', name: '梅蕊穴成形', desc: '花芷凝 · 她所怀的名器，被魂欢殿擒住占有之后（依据：【人物】花芷凝（2））', kws: ['梅蕊穴'] },
  { kind: 'ai', name: '冰魄剑心穴成形', desc: '苏倾寒 · 所怀名器（依据：【人物】苏倾寒）', kws: ['冰魄剑心穴'] },
  { kind: 'ai', name: '清歌弦鸣穴成形', desc: '慕容清歌 · 所怀名器（依据：【人物】慕容清歌）', kws: ['清歌弦鸣穴'] },
  { kind: 'ai', name: '流焰叠薪穴成形', desc: '顾云舒 · 所怀名器（归属由主人 2026-09-30 当面指定；册内尚无其它出处）', kws: ['流焰叠薪穴'] },
  { kind: 'ai', name: '凤凰羽花成形', desc: '陆烬颜 · 名器持有者（依据：【人物】陆烬颜）', kws: ['凤凰羽花'] },
  /* ── 名器**阶段**锚点（2026-09-30 主人令：阶段条要「成形 且 该阶段达成」才放行） ──
   *  ⚠️ 命名＝`<名器><中文数字>阶段`，与 `_build_card.js` 的 `MQ_STAGE_ANCHOR()` **同源**（改一处必须改两处）。
   *  ⚠️ 只写「该名器第几阶段已达成」这一件事，不写剧情细节；阶段名（落红／情动／沉沦／极乐）见「名器三境与第四境」条。 */
  { kind: 'ai', name: '已抵达陨仙原', desc: '北域陨仙原一线：一行人或玩家这条线真的走到了陨仙原（魂欢殿主名下那批资料的统一闸门）', kws: ['陨仙原'] },
  /* ── 主人 2026-09-30 逐条指定的锚点（19 个）──
   *  ⚠️ `kws` 是「正文里出现这些词就打一行旁证日志」的触发词（不写账本）；一律用锚点名或该事件的长词/专名。
   *  ⚠️ `烟霞灵乳成形` 与早先「她出场即二境、没有成形这一步」相冲 —— 按最新指示建，已在报告里标出。 */
  { kind: 'ai', name: '天姝榜建立', desc: '神女殿中颁下《天姝榜》（极乐太子亲手颁）', kws: ["天姝榜"] },
  { kind: 'ai', name: '', desc: '第一章 · 玩家**接到去西北荒漠邪修洞府的命令并出发**（主人定：不再靠模型判断「这一章演完没有」）', kws: ['邪修洞府'] },
  { kind: 'ai', name: '', desc: '第二章 · **孤月与赵无忧回墨山复命**（主人定）', kws: ['复命'] },
  { kind: 'ai', name: '', desc: '第四—五章 · **一行人从幽寂谷秘境离开**（主人定）', kws: ['幽寂谷'] },
  { kind: 'ai', name: '', desc: '**墨山道受仙盟征召、遣弟子南下驰援天溪城——即将出发**（主人定；临行前的送别由此触发）', kws: ['驰援天溪', '天溪城'] },
  { kind: 'ai', name: '', desc: '剧情五（孤剑崖送别 · 孤月赠冰心泪）已经演完', kws: ['冰心泪', '送别'] },
  { kind: 'ai', name: '', desc: '**苏瑶、苏玲登场**（天音阁听雪双姝）', kws: ['听雪双姝'] },
  { kind: 'ai', name: '', desc: '**玄机子已离去**（主人定）', kws: ['下落不明'] },
  { kind: 'ai', name: '', desc: '双姝线收束：**苏瑶、苏玲被种下奴种，以「黑日」「霜月」之身被派回天溪城**（第十—十二章末）', kws: ['黑日', '霜月'] },
  { kind: 'ai', name: '', desc: '**叶红缨夜间失控、赵无忧越界**（第十三章；血染天溪那一场演完）', kws: ['浴血杀敌'] },
  { kind: 'ai', name: '', desc: '**三人同寝**（主人定）', kws: ['姐妹回归'] },
  { kind: 'ai', name: '', desc: '**天溪城破**（主人定）', kws: ['西南门破', '金丹破碎'] },
  { kind: 'ai', name: '', desc: '**最后那道防线被残阳老怪冲垮**（主人定）', kws: [] },
  { kind: 'ai', name: '', desc: '**灼酒流炎穴觉醒**（主人定）', kws: [] },
  { kind: 'ai', name: '', desc: '洞府调教那一场演完（第十五章；她被枷锁与业火困在洞府里）', kws: ['洞府调教'] },
{ kind: 'ai', name: '', desc: '葬魔渊那一场演完（赵无忧坠渊、雨霏柔授阵丹之道）', kws: [] },
  { kind: 'ai', name: '获得任意名器', desc: '玩家这条线上第一次真的接触到／得到一件名器', kws: ["获得任意名器"] },
  { kind: 'ai', name: '南域大劫', desc: '第六—七章 · 南域大劫爆发：神诅降下、粉黑天穹、四殿册封', kws: ["南域大劫","神诅"] },
  { kind: 'ai', name: '残阳老怪得到叶红缨', desc: '残阳老怪（无论玩家还是 NPC）得到叶红缨', kws: ["残阳老怪得到叶红缨"] },
  { kind: 'ai', name: '肉山佛得到楚灵夜', desc: '肉山佛（无论玩家还是 NPC）得到楚灵夜', kws: ["肉山佛得到楚灵夜"] },
  { kind: 'ai', name: '天溪城兽潮', desc: '第十一章 · 第六波大规模兽潮压到天溪城下', kws: ["兽潮"] },
  { kind: 'ai', name: '阎雷子脱困', desc: '阎雷子（夺舍炎雷子的那一位）脱困／破关而出', kws: ["阎雷子脱困"] },
  { kind: 'ai', name: '进入葬魔渊', desc: '玩家这条线真的进到葬魔渊（含赵无忧坠渊那一支）', kws: ["葬魔渊"] },
  { kind: 'ai', name: '神女殿建成', desc: '墨山道原址之上拔起天姝会神女殿', kws: ["神女殿"] },
  { kind: 'ai', name: '百丈天魔神像显形', desc: '神女殿中百丈天魔神像显形', kws: ["天魔神像"] },
  { kind: 'ai', name: '受封殿主', desc: '南域大劫后受封天姝会殿主（事件，不是身份起手值）', kws: ["受封殿主"] },
  { kind: 'ai', name: '云逸尘救人后', desc: '云逸尘前往积云古寺救人之后', kws: ["云逸尘救人"] },
  { kind: 'ai', name: '阎雷子夺舍', desc: '炼欲魔君残魂夺舍炎雷子（他自此自称宫蚀殿殿主阎雷子）', kws: ["阎雷子夺舍"] },
  { kind: 'ai', name: '墨山道覆灭', desc: '墨山道覆灭（终局被炎雷子亲手摧毁）', kws: ["墨山道覆灭"] },
  { kind: 'ai', name: '炎雷子谈及往事', desc: '炎雷子谈及当年欲火峰那一战的旧事', kws: ["炎雷子谈及往事"] },
  { kind: 'ai', name: '赠送冰心泪', desc: '孤月把冰心泪赠予赵无忧', kws: ["冰心泪"] },
  { kind: 'ai', name: '邪修洞府解毒', desc: '第二章 · 邪修洞府解毒那一场（与 `邪修洞府替孤月中毒` 是两支）', kws: ["邪修洞府"] },
  { kind: 'ai', name: '九幽玄阴穴一阶段', desc: '九幽玄阴穴 · 第一阶段「落红」已达成', kws: ['九幽玄阴穴一阶段'] },
  { kind: 'ai', name: '九幽玄阴穴二阶段', desc: '九幽玄阴穴 · 第二阶段「情动」已达成', kws: ['九幽玄阴穴二阶段'] },
  { kind: 'ai', name: '九幽玄阴穴三阶段', desc: '九幽玄阴穴 · 第三阶段「沉沦」已达成', kws: ['九幽玄阴穴三阶段'] },
  { kind: 'ai', name: '九幽玄阴穴四阶段', desc: '九幽玄阴穴 · 第四阶段「极乐」已达成', kws: ['九幽玄阴穴四阶段'] },
  { kind: 'ai', name: '灼酒流炎穴一阶段', desc: '灼酒流炎穴 · 第一阶段「落红」已达成', kws: ['灼酒流炎穴一阶段'] },
  { kind: 'ai', name: '灼酒流炎穴二阶段', desc: '灼酒流炎穴 · 第二阶段「情动」已达成', kws: ['灼酒流炎穴二阶段'] },
  { kind: 'ai', name: '灼酒流炎穴三阶段', desc: '灼酒流炎穴 · 第三阶段「沉沦」已达成', kws: ['灼酒流炎穴三阶段'] },
  { kind: 'ai', name: '灼酒流炎穴四阶段', desc: '灼酒流炎穴 · 第四阶段「极乐」已达成', kws: ['灼酒流炎穴四阶段'] },
  { kind: 'ai', name: '心魔茶璎乳一阶段', desc: '心魔茶璎乳 · 第一阶段「落红」已达成', kws: ['心魔茶璎乳一阶段'] },
  { kind: 'ai', name: '心魔茶璎乳二阶段', desc: '心魔茶璎乳 · 第二阶段「情动」已达成', kws: ['心魔茶璎乳二阶段'] },
  { kind: 'ai', name: '心魔茶璎乳三阶段', desc: '心魔茶璎乳 · 第三阶段「沉沦」已达成', kws: ['心魔茶璎乳三阶段'] },
  { kind: 'ai', name: '心魔茶璎乳四阶段', desc: '心魔茶璎乳 · 第四阶段「极乐」已达成', kws: ['心魔茶璎乳四阶段'] },
  { kind: 'ai', name: '般若菩提菊一阶段', desc: '般若菩提菊 · 第一阶段「落红」已达成', kws: ['般若菩提菊一阶段'] },
  { kind: 'ai', name: '般若菩提菊二阶段', desc: '般若菩提菊 · 第二阶段「情动」已达成', kws: ['般若菩提菊二阶段'] },
  { kind: 'ai', name: '般若菩提菊三阶段', desc: '般若菩提菊 · 第三阶段「沉沦」已达成', kws: ['般若菩提菊三阶段'] },
  { kind: 'ai', name: '般若菩提菊四阶段', desc: '般若菩提菊 · 第四阶段「极乐」已达成', kws: ['般若菩提菊四阶段'] },
  { kind: 'ai', name: '北冥潮生穴一阶段', desc: '北冥潮生穴 · 第一阶段「落红」已达成', kws: ['北冥潮生穴一阶段'] },
  { kind: 'ai', name: '北冥潮生穴二阶段', desc: '北冥潮生穴 · 第二阶段「情动」已达成', kws: ['北冥潮生穴二阶段'] },
  { kind: 'ai', name: '北冥潮生穴三阶段', desc: '北冥潮生穴 · 第三阶段「沉沦」已达成', kws: ['北冥潮生穴三阶段'] },
  { kind: 'ai', name: '北冥潮生穴四阶段', desc: '北冥潮生穴 · 第四阶段「极乐」已达成', kws: ['北冥潮生穴四阶段'] },
  { kind: 'ai', name: '灵犀同心穴一阶段', desc: '灵犀同心穴 · 第一阶段「落红」已达成', kws: ['灵犀同心穴一阶段'] },
  { kind: 'ai', name: '灵犀同心穴二阶段', desc: '灵犀同心穴 · 第二阶段「情动」已达成', kws: ['灵犀同心穴二阶段'] },
  { kind: 'ai', name: '灵犀同心穴三阶段', desc: '灵犀同心穴 · 第三阶段「沉沦」已达成', kws: ['灵犀同心穴三阶段'] },
  { kind: 'ai', name: '灵犀同心穴四阶段', desc: '灵犀同心穴 · 第四阶段「极乐」已达成', kws: ['灵犀同心穴四阶段'] },
  { kind: 'ai', name: '玉虎噙香乳一阶段', desc: '玉虎噙香乳 · 第一阶段「落红」已达成', kws: ['玉虎噙香乳一阶段'] },
  { kind: 'ai', name: '玉虎噙香乳二阶段', desc: '玉虎噙香乳 · 第二阶段「情动」已达成', kws: ['玉虎噙香乳二阶段'] },
  { kind: 'ai', name: '玉虎噙香乳三阶段', desc: '玉虎噙香乳 · 第三阶段「沉沦」已达成', kws: ['玉虎噙香乳三阶段'] },
  { kind: 'ai', name: '玉虎噙香乳四阶段', desc: '玉虎噙香乳 · 第四阶段「极乐」已达成', kws: ['玉虎噙香乳四阶段'] },
  { kind: 'ai', name: '烟霞灵乳一阶段', desc: '烟霞灵乳 · 第一阶段「落红」已达成', kws: ['烟霞灵乳一阶段'] },
  { kind: 'ai', name: '烟霞灵乳二阶段', desc: '烟霞灵乳 · 第二阶段「情动」已达成', kws: ['烟霞灵乳二阶段'] },
  { kind: 'ai', name: '烟霞灵乳三阶段', desc: '烟霞灵乳 · 第三阶段「沉沦」已达成', kws: ['烟霞灵乳三阶段'] },
  { kind: 'ai', name: '烟霞灵乳四阶段', desc: '烟霞灵乳 · 第四阶段「极乐」已达成', kws: ['烟霞灵乳四阶段'] },
  { kind: 'ai', name: '梅蕊穴一阶段', desc: '梅蕊穴 · 第一阶段「落红」已达成', kws: ['梅蕊穴一阶段'] },
  { kind: 'ai', name: '梅蕊穴二阶段', desc: '梅蕊穴 · 第二阶段「情动」已达成', kws: ['梅蕊穴二阶段'] },
  { kind: 'ai', name: '梅蕊穴三阶段', desc: '梅蕊穴 · 第三阶段「沉沦」已达成', kws: ['梅蕊穴三阶段'] },
  { kind: 'ai', name: '梅蕊穴四阶段', desc: '梅蕊穴 · 第四阶段「极乐」已达成', kws: ['梅蕊穴四阶段'] },
  { kind: 'ai', name: '冰魄剑心穴一阶段', desc: '冰魄剑心穴 · 第一阶段「落红」已达成', kws: ['冰魄剑心穴一阶段'] },
  { kind: 'ai', name: '冰魄剑心穴二阶段', desc: '冰魄剑心穴 · 第二阶段「情动」已达成', kws: ['冰魄剑心穴二阶段'] },
  { kind: 'ai', name: '冰魄剑心穴三阶段', desc: '冰魄剑心穴 · 第三阶段「沉沦」已达成', kws: ['冰魄剑心穴三阶段'] },
  { kind: 'ai', name: '冰魄剑心穴四阶段', desc: '冰魄剑心穴 · 第四阶段「极乐」已达成', kws: ['冰魄剑心穴四阶段'] },
  { kind: 'ai', name: '清歌弦鸣穴一阶段', desc: '清歌弦鸣穴 · 第一阶段「落红」已达成', kws: ['清歌弦鸣穴一阶段'] },
  { kind: 'ai', name: '清歌弦鸣穴二阶段', desc: '清歌弦鸣穴 · 第二阶段「情动」已达成', kws: ['清歌弦鸣穴二阶段'] },
  { kind: 'ai', name: '清歌弦鸣穴三阶段', desc: '清歌弦鸣穴 · 第三阶段「沉沦」已达成', kws: ['清歌弦鸣穴三阶段'] },
  { kind: 'ai', name: '清歌弦鸣穴四阶段', desc: '清歌弦鸣穴 · 第四阶段「极乐」已达成', kws: ['清歌弦鸣穴四阶段'] },
  { kind: 'ai', name: '流焰叠薪穴一阶段', desc: '流焰叠薪穴 · 第一阶段「落红」已达成', kws: ['流焰叠薪穴一阶段'] },
  { kind: 'ai', name: '流焰叠薪穴二阶段', desc: '流焰叠薪穴 · 第二阶段「情动」已达成', kws: ['流焰叠薪穴二阶段'] },
  { kind: 'ai', name: '流焰叠薪穴三阶段', desc: '流焰叠薪穴 · 第三阶段「沉沦」已达成', kws: ['流焰叠薪穴三阶段'] },
  { kind: 'ai', name: '流焰叠薪穴四阶段', desc: '流焰叠薪穴 · 第四阶段「极乐」已达成', kws: ['流焰叠薪穴四阶段'] },
  { kind: 'ai', name: '凤凰羽花一阶段', desc: '凤凰羽花 · 第一阶段「落红」已达成', kws: ['凤凰羽花一阶段'] },
  { kind: 'ai', name: '凤凰羽花二阶段', desc: '凤凰羽花 · 第二阶段「情动」已达成', kws: ['凤凰羽花二阶段'] },
  { kind: 'ai', name: '凤凰羽花三阶段', desc: '凤凰羽花 · 第三阶段「沉沦」已达成', kws: ['凤凰羽花三阶段'] },
  { kind: 'ai', name: '凤凰羽花四阶段', desc: '凤凰羽花 · 第四阶段「极乐」已达成', kws: ['凤凰羽花四阶段'] },
  { kind: 'ai', name: '雀奴身份成立', desc: '第二十章 · 肉山佛（硬前置：赵无忧坠渊）', kws: ['雀奴'] },
  { kind: 'ai', name: '孤月失守', desc: '第二十一—二十六章 · 孤月赴中洲（硬前置：赵无忧坠渊）', kws: ['孤月失守', '玄冰初融'] },
  { kind: 'ai', name: '双线并置', desc: '第二十六—二十八章 · 叶红缨名器觉醒 ↔ 孤月失守', kws: ['双线并置'] },
  /* ── 起手公开 ── */
  { kind: 'open', name: '天姝会存在', desc: '起手公开，无需解锁（四殿主身份由脚本自动置 true）', kws: [] },
];
const AI_FIELDS = FIELD_TABLE.filter((f) => f.kind === 'ai' && Boolean(f.name)).map((f) => f.name);
/** 起手公开的 */
const OPEN_FIELDS = FIELD_TABLE.filter((f) => f.kind === 'open' && Boolean(f.name)).map((f) => f.name);
/** 全部锚点字段（读顺序＝表顺序：剧情推进 ＋ 起手公开） */
const ALL_FIELDS = FIELD_TABLE.filter((f) => Boolean(f.name)).map((f) => f.name);

/**
 * ⚠️ v1.5（2026-09-28）：**`天姝会存在` 是按身份决定的起手值**，不是全局常量。
 *
 * 起因（主人真机追问）：「假如我选赵无忧或者自设角色呢？」
 *   · 四殿主本人就是天姝会的人 ⇒ 知道「天姝会存在」＝常识（他/她本就是其中一员），**起手为 true**；
 *   · 赵无忧／自设 ⇒ 「天姝会存在」属于**设定层允许知道、但剧情尚未解锁**（卡里 13 个闸门锚点
 *     的既定口径：锚点只能由玩家 `/解锁` 翻开，AI 不得替它下结论）⇒ **起手为 false**。
 *
 * 于是：初始化与 `/身份` 切换时按当前身份**自动同步**这一个字段；
 * 「进度」栏也只在本字段为 true 时才对得上账（与 `状态字段表` 的纪律同口径）。
 */
const OPEN_FIELD_FOR_OWNER = '天姝会存在';
/** 天姝会自己人（四殿主）—— 与 `_card_greetings.txt` 的 `@@@ <名字>` 段、`IDENTITY_NAMES` 逐字一致 */
const THSH_INSIDERS = ['焚欲殿主', '欢喜殿主', '浊龙殿主', '魂欢殿主'];
/** 该身份是否起手就知道「天姝会存在」 */
function openFieldDefaultFor(name) {
  return THSH_INSIDERS.includes(String(name ?? ''));
}
/* ⚠️ v1.6（2026-09-29 主人定 · 方案 A）：**`极乐引入手` 也按身份给起手值**。
 *   理由（主人口径）：「谁都可以获得极乐引得到这个消息 —— 四殿主开局就得到了，所以开局就可以开；
 *   赵无忧则是和二贼那场（邪修洞府／孤月口含阴津）之后才拿到；自设身份后续另设事件获得。」
 *   ⇒ 四殿主：起手 **true**；赵无忧／自设：保持 false，仍走「AI 提议 → 玩家 `/解锁 极乐引入手`」那条老路。
 *   ⚠️ 只升不降：切回赵无忧不会把它打回 false（那会抹掉玩家已经知道的事实）。 */
const FIELD_FOR_IDENTITY_HOLDER = '极乐引入手';
/** 手里就有《极乐引》的身份（＝四殿主，同上那一组） */
const JILEYIN_HOLDERS = THSH_INSIDERS;
/** 按身份起手该置 true 的字段清单 */
function openFieldsFor(name) {
  const list = [];
  if (openFieldDefaultFor(name)) list.push(OPEN_FIELD_FOR_OWNER);
  if (JILEYIN_HOLDERS.includes(String(name ?? ''))) list.push(FIELD_FOR_IDENTITY_HOLDER);
  return list;
}

/** 字段 → 锚点说明（玩家发 /锚点 时打印）—— ⚠️ 从 `FIELD_TABLE` 派生，别再单独维护一份 */
const FIELD_DESC = Object.fromEntries(FIELD_TABLE.map((f) => [f.name, f.desc]));

/** 身份台账（穿书模式）—— 6 个身份，名字逐字对齐开场白段落名与闸门条件 */
const IDENTITY_DEFAULT = '赵无忧';
const IDENTITIES = [
  { name: '赵无忧', desc: '墨山道六弟子（原著主角）· 默认时点＝启程天溪之前' },
  { name: '自设', desc: '玩家 Persona 自定义身份（穿书者）· 时点同刻，来历与位置由 Persona 决定' },
  { name: '焚欲殿主', desc: '天姝会焚欲殿主 · 残阳老怪 · 蛊火与惑妖迷情瘴' },
  { name: '欢喜殿主', desc: '天姝会欢喜殿主 · 肉山佛 · 佛门皮相、淫邪内核' },
  { name: '浊龙殿主', desc: '天姝会浊龙殿主 · 天龙皇朝第九皇子 · 龙气与龙器' },
  { name: '魂欢殿主', desc: '天姝会魂欢殿主 · 鬼医病相思 · 情丝化灵、辨识名器' },
];
const IDENTITY_NAMES = IDENTITIES.map((x) => x.name);
/** 身份 → 阵营：`@@if` 闸门用它做「成批收放」（天姝会／非天姝会） */
const IDENTITY_FACTION = {
  赵无忧: '墨山道',
  自设: '自设',
  焚欲殿主: '天姝会',
  欢喜殿主: '天姝会',
  浊龙殿主: '天姝会',
  魂欢殿主: '天姝会',
};
/** 身份／阵营的初始值（只在字段缺失时补，幂等） */
const FACTION_DEFAULT = '墨山道';

/** 状态条里会被脚本读进变量的展示型字段（＝面板上那些格子）
 *  ⚠️ 2026-09-27（v1.3）：照抄外卡《大乾风华录 Ver2.0》补 历时／天气／环境／线索／近闻／远闻／危机。
 *  ⚠️ `在场角色`（`<角色N>` 子块聚合成数组）**不在这张表里** —— 它不是标量，
 *     由 parseCastBlocks 单独解析、在 applyStatusToVars 里单独写。
 *  ⚠️ `身份` **也不进这张表**：它是机器字段（只能是 6 个身份名之一），
 *     写进「墨山道六弟子 · 赵无忧」会把世界书闸门搞坏。它只在 FIELD_MAP 里用于「认得出这一行」。 */
const DISPLAY_FIELDS = [
  '时间', '历时', '地点', '天气', '环境', '在场', '暗处',
  '修为', '状态', '目标', '局势',
  '线索', '近闻', '远闻', '危机', '关系刻度',
];
/** 在场角色子块落变量时用的键名（数组：`[{ 序号, 名, 阶段, 情况, 心境, 神态 }, …]`） */
const CAST_FIELD = '在场角色';

/* ══════════════════════════════════════════════════════════════════════════
 * 段位与推进调度（2026-10-04 升级 · 方案 B 非均匀长跑 ＋ 场景驻留等待 ＋ 锚点提前驱动）
 *
 * 核心原则：
 * 1. 楼层为保底步长，大段（日常/战事/调教）25-35 楼，小段（送别/转折）15-20 楼；
 * 2. 玩家推得快时，关键事件锚点达成允许提前跳段（快速推进）；
 * 3. 玩家沉浸做爱或私密互动时（Scene Hold），章节停住等待玩家，绝不强行推剧情打扰；
 * 4. 每隔 15 楼或换段时，自动触发后台阶段总结/存档（给后续写作指明方向）。
 * ══════════════════════════════════════════════════════════════════════════ */
const STAGE_STEPS = [30, 20, 25, 20, 15, 20, 30, 20, 25, 20, 20, 20, 30, 30, 35, 999]; // 方案 B 非均匀步长
const STAGE_BASE = [1, 31, 51, 76, 96, 111, 131, 161, 181, 206, 226, 246, 266, 296, 326, 361];
/* 15 个剧情段 ＋ 1 个无档案段（离山之后）的仙盟历时点；[段号-1] */
const SEG_TIME = [1578.03,1578.04,1578.06,1578.08,1578.11,1578.11,1578.12,1579.01,1579.01,1579.02,1579.03,1579.04,1579.04,1579.05,1579.06,1580.01];
const FLOOR_PIN = '段位基准';            // `设段` 写下的 { floor, shift }；缺省＝不平移

/** 关键剧情锚点触发后允许提前跳段的映射表（索引: 段号 - 1） */
const STAGE_FAST_FORWARD = [
  null,                                                      // 段 1: 墨山道起步
  ['极乐引入手', '邪修洞府替孤月中毒', '邪修洞府解毒'],          // 段 2: 邪修洞府
  ['玄机子胁迫过叶红缨', '进入幽寂谷'],                       // 段 3: 幽寂谷秘境
  ['南域大劫'],                                              // 段 4: 南域大劫
  ['孤月定情', '赠送冰心泪'],                                 // 段 5: 孤剑崖送别
  ['已抵达天溪'],                                            // 段 6: 初入天溪
  ['天溪城兽潮', '兽潮血战'],                                 // 段 7: 兽潮血战
  ['玄机子装伤', '灵犀同心成形'],                             // 段 8: 灵犀同心
  ['赵无忧看见乳环'],                                        // 段 9: 越界失控
  ['双姝回归'],                                              // 段 10: 双姝回归
  ['天溪城破'],                                              // 段 11: 天溪城破
  ['封元镇灵环', '赵无忧坠渊'],                               // 段 12: 朱樱逢劫
  ['灼酒流炎穴成形'],                                         // 段 13: 赤羽堕凡尘
  ['残阳老怪得到叶红缨'],                                     // 段 14: 洞府调教
  ['雀奴身份成立', '灼酒流炎穴二阶段']                         // 段 15: 雀奴
];

/** 检查当前是否处于交合温存/沉浸私密场景中（章节等待玩家） */
function isSceneLocked(text, stat) {
  const t = String(text || '');
  const st = String((stat && (stat.状态 || stat.环境 || stat.目标)) || '');
  const combined = t.slice(-600) + ' ' + st;
  const intimacyPattern = /(?:交合|温存|做爱|双修|缠绵|行房|肉壁|花径|抽送|高潮|承欢|索求|调教|侍寝|赤身|相拥|欢好|春潮|花心|蜜液|贯穿|破身|解毒)/;
  const departurePattern = /(?:启程|离开|走出|告辞|返程|回宗|破门而出|数日后|数月后|半年后|一年后|各自散去)/;
  return intimacyPattern.test(combined) && !departurePattern.test(combined);
}

/** 由楼层算段位（floor ≤0 或不合法 ⇒ 0 ＝ 取不到） */
function stageOfFloor(floor, shift) {
  const f = Number(floor) + (Number(shift) || 0);
  if (!isFinite(f) || f < 1) return 0;
  for (let i = 0; i < STAGE_STEPS.length; i++) if (f < STAGE_BASE[i] + STAGE_STEPS[i]) return i + 1;
  return STAGE_STEPS.length;
}

/** 检查事件驱动的提前推进段位 */
function checkFastForwardStage(known, curStage) {
  if (!known || typeof known !== 'object') return curStage;
  for (let s = STAGE_FAST_FORWARD.length; s >= curStage + 1; s--) {
    const list = STAGE_FAST_FORWARD[s - 1];
    if (list && list.some(k => known[k] === true)) {
      return s;
    }
  }
  return curStage;
}

/* ══════════ ①d 时点加速（2026-10-01 主人令）══════════
 * 楼下限 ＋ 模型 <历时> 加速；**只加不减**（模型乱填 ⇒ 时点不动，退回楼下限 ⇒ 不致命）。
 * 单轮上限＝**半个月（0.5 月）**；总封顶＝**本段终点**。
 * 折算 8 档：一个时辰 0.003｜一夜 0.03｜一日 0.033｜三日 0.1｜半月 0.5｜一月 1｜三月 3｜一年 12（月）
 *   ⚠️ 词表保留「一月／三月／一年」，但**单轮最多认到半月**（超出即钳到 0.5）。
 * 内部单位：仙盟历值 = 年 ＋ 月/100（三月 ⇒ 1578.03）⇒ **1 个月 = 0.01**。
 * ══════════════════════════════════════════════ */
const LISHI_CAP = 0.5;
const LISHI_WORDS = [
  ['一个时辰', 0.003], ['半个时辰', 0.003], ['一炷香', 0.01], ['半炷香', 0.01],
  ['一夜', 0.03], ['一日', 0.033], ['三天', 0.1], ['三日', 0.1],
  ['半月', 0.5], ['一月', 1], ['三月', 3], ['一年', 12],
];
function parseLishi(s) {
  const txt = String(s || '').trim();
  if (!txt || /^[—\-－无]+$/.test(txt)) return 0;
  let best = 0;
  // ① 优先解析带数量词的常规表达（支持复合中文数字与阿拉伯数字，如：十一日、十五天、2日），避免被「一日」「三日」等短词子串截胡
  const parseCnNum = (str) => {
    if (/^\d+$/.test(str)) return Number(str);
    if (str === '半') return 0.5;
    if (str === '两') return 2;
    const CN = { 零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
    if (CN[str] !== undefined) return CN[str];
    if (str.startsWith('十')) return 10 + (CN[str.slice(1)] || 0);
    if (str.includes('十')) {
      const parts = str.split('十');
      return ((CN[parts[0]] || 1) * 10) + (CN[parts[1]] || 0);
    }
    return NaN;
  };
  const n = /([一二三四五六七八九十两半\d]+)\s*(个?时辰|日|天|个?月|年)/.exec(txt);
  if (n) {
    const v = parseCnNum(n[1]);
    const uMap = { 时辰: 0.003, 个时辰: 0.003, 日: 0.033, 天: 0.033, 月: 1, 个月: 1, 年: 12 };
    const u = uMap[n[2]] || 0;
    if (isFinite(v) && v > 0) best = v * u;
  }
  // ② 专有或特定词表兜底（如 一夜、一炷香、半个时辰等）
  if (!best) {
    for (const [w, m] of LISHI_WORDS) if (txt.includes(w) && m > best) best = m;
  }
  return Math.min(best, LISHI_CAP);
}
function fmtXianmeng(v) {
  const y = Math.floor(v + 1e-9);
  const m = Math.max(1, Math.min(12, Math.round((v - y) * 100)));
  return y + ' 年 · ' + ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'][m] + '月';
}

/** 年.月（如 1578.12）转为绝对连续月数标量，彻底杜绝跨年相减 0.89 偏差 */
function ymToMonths(ym) {
  const v = Number(ym) || 0;
  const y = Math.floor(v + 1e-9);
  const m = Math.max(1, Math.min(12, Math.round((v - y) * 100)));
  return y * 12 + (m - 1);
}

/** 连续绝对月数转回 年.月 兼容浮点，格式化为标准仙盟历 */
function monthsToYm(totalMonths) {
  const tm = Number(totalMonths) || 0;
  const y = Math.floor(tm / 12);
  const m = Math.floor(tm % 12) + 1;
  const frac = tm - Math.floor(tm);
  return Math.round((y + (m / 100) + (frac * 0.005)) * 10000) / 10000;
}
/** 标签 → 变量键（**与 `状态栏面板.js` 的 FIELD_MAP 同源**，改一处必须改两处）
 *  ⚠️ `身份` 在这里只用于「认得出这一行」，**不写进变量**：变量里的 `身份` 是机器字段
 *     （只能是 6 个身份名之一，闸门靠它判真假），写进「墨山道六弟子 · 赵无忧」会把闸门搞坏。
 *  ⚠️ 键的**声明顺序＝状态栏里一级标签的固定顺序**（时间→…→关系刻度，共 16 个；另有序
 *     `进度`，它不进这张表也不写变量，只做一致性校验）。 */
const FIELD_MAP = {
  时间: '时间',
  历时: '历时',
  地点: '地点',
  天气: '天气',
  环境: '环境',
  在场: '在场',
  暗处: '暗处',
  身份: '身份',
  修为: '修为',
  状态: '状态',
  目标: '目标',
  局势: '局势',
  线索: '线索',
  近闻: '近闻',
  远闻: '远闻',
  危机: '危机',
  关系刻度: '关系刻度',
  [CAST_FIELD]: CAST_FIELD,
};

/** 锚点关键词表 —— 每轮 AI 正文里出现这些词就提议 `/解锁 <字段>`。
 *  ⚠️ 只提示、不写变量；玩家认可后自己发命令才真的翻开。
 *  ⚠️ 刻意用**长词／专名**，不用「天溪城」「孤月」这种满篇都有的普通词，免得每轮都弹提示。
 *  ⚠️ `天姝会存在` 是起手公开项，故意不列（列表留空）。 */
/** 锚点关键词表 —— ⚠️ 从 `FIELD_TABLE` 派生（每轮 AI 正文里出现这些词就提议 `/解锁 <字段>`；
 *  ⚠️ 只提示、不写变量；玩家认可后自己发命令才真的翻开。
 *  ⚠️ `天姝会存在` 是起手公开项，其 kws 在表里就是空数组 ⇒ 不会提议。 */
const ANCHOR_KEYWORDS = Object.fromEntries(FIELD_TABLE.map((f) => [f.name, f.kws ?? []]));

/**
 * ⚠️ v1.5（2026-09-28）：**单独出现不算数**的词 → 必须再配上「事件动词」才算命中。
 *
 * 起因（主人真机截图）：第 3 楼正文只写了「**自幽寂谷归来**，她练功便常有业火外溢之状」——
 *   更要紧的是：**提示词本身就把锚点全名抖给了玩家**，而这个锚点恰是「未经暗示不得抖出」那一类。
 *
 * 规则（对每个字段）：**先按 `ANCHOR_KEYWORDS` 命中候选**，若候选词**全都只出现在本表**里，
 *   则还必须同时命中 `ANCHOR_SECOND_SIGNALS` 里的任一「事件动词」才算数。
 *   ⇒ 只提地名不再误报；真发生事件时（如「在幽寂谷胁迫她屈从」）照样能命中。
 */
const ANCHOR_LOCATION_ONLY = ['幽寂谷', '葬魔渊', '赤羽堕凡尘'];
/** 事件动词（任一命中即可放行） */
const ANCHOR_SECOND_SIGNALS = ['胁迫', '屈从', '得手', '失守', '被擒', '沦', '坠', '碎', '碎丹', '封元', '镇灵', '奴'];


/* ═══════════════════════════════════════════════════════════
 * 二 · 酒馆助手接口探测（全部 typeof 保护，取不到就降级）
 * ═══════════════════════════════════════════════════════════ */

function msgOf(e) { return (e && e.message) || String(e); }

/** 多层安全探查全局/宿主函数：依次从 window、TavernHelper、parent.TavernHelper、top.TavernHelper、parent、globalThis 探查 */
function getGlobalOrParent(name) {
  try { if (typeof window !== 'undefined' && typeof window[name] === 'function') return window[name]; } catch (e) {}
  try { if (typeof window !== 'undefined' && window.TavernHelper && typeof window.TavernHelper[name] === 'function') return window.TavernHelper[name]; } catch (e) {}
  try { if (typeof window !== 'undefined' && window.parent && window.parent.TavernHelper && typeof window.parent.TavernHelper[name] === 'function') return window.parent.TavernHelper[name]; } catch (e) {}
  try { if (typeof window !== 'undefined' && window.top && window.top.TavernHelper && typeof window.top.TavernHelper[name] === 'function') return window.top.TavernHelper[name]; } catch (e) {}
  try { if (typeof window !== 'undefined' && window.parent && typeof window.parent[name] === 'function') return window.parent[name]; } catch (e) {}
  try { if (typeof globalThis !== 'undefined' && typeof globalThis[name] === 'function') return globalThis[name]; } catch (e) {}
  try { if (typeof globalThis !== 'undefined' && globalThis.TavernHelper && typeof globalThis.TavernHelper[name] === 'function') return globalThis.TavernHelper[name]; } catch (e) {}
  return null;
}

/** 安全取一个全局函数：拿不到返回 null，并（按需）打一条警告。
 *  用 getter 是为了让「标识符根本不存在」也变成可捕获的异常，并在异常时自动尝试从宿主环境深度探测。 */
function grab(name, getter, required) {
  try {
    const v = getter ? getter() : null;
    if (typeof v === 'function') return v;
  } catch (e) {}
  const fallback = getGlobalOrParent(name);
  if (typeof fallback === 'function') return fallback;
  if (required) console.warn(TAG, `⚠️ 酒馆助手接口 ${name} 不是函数或不可用 —— 相关功能降级`);
  return null;
}

const API = {
  // ── 变量层（写状态、写身份）──
  getVariables: grab('getVariables', () => (typeof getVariables === 'function' ? getVariables : null), true),
  replaceVariables: grab('replaceVariables', () => (typeof replaceVariables === 'function' ? replaceVariables : null), true),
  insertOrAssignVariables: grab('insertOrAssignVariables', () => (typeof insertOrAssignVariables === 'function' ? insertOrAssignVariables : null), true),
  deleteVariable: grab('deleteVariable', () => (typeof deleteVariable === 'function' ? deleteVariable : null)),          // 登记备用，本版未调用
  // ── 聊天消息（读正文、切开场白）──
  getChatMessages: grab('getChatMessages', () => (typeof getChatMessages === 'function' ? getChatMessages : null), true),
  setChatMessages: grab('setChatMessages', () => (typeof setChatMessages === 'function' ? setChatMessages : null), true),
  // ── 角色卡与世界书（刷新开场白、拨身份条目开关）──
  getCharacter: grab('getCharacter', () => (typeof getCharacter === 'function' ? getCharacter : null)),
  getCharWorldbookNames: grab('getCharWorldbookNames', () => (typeof getCharWorldbookNames === 'function' ? getCharWorldbookNames : null)),
  getWorldbookNames: grab('getWorldbookNames', () => (typeof getWorldbookNames === 'function' ? getWorldbookNames : null)),
  getWorldbook: grab('getWorldbook', () => (typeof getWorldbook === 'function' ? getWorldbook : null)),
  replaceWorldbook: grab('replaceWorldbook', () => (typeof replaceWorldbook === 'function' ? replaceWorldbook : null)),
  /* ★ 2026-09-29：**没有世界书文件时自动导出一份**用得上这四个（直接从酒馆脚本 import，
   *   与「酒馆助手」那套 API 并存互补：那套管"改"，这四个管"建"）。 */
  loadWorldInfo: grab('loadWorldInfo', () => (typeof loadWorldInfo === 'function' ? loadWorldInfo : null)),
  saveWorldInfo: grab('saveWorldInfo', () => (typeof saveWorldInfo === 'function' ? saveWorldInfo : null)),
  updateWorldInfoList: grab('updateWorldInfoList', () => (typeof updateWorldInfoList === 'function' ? updateWorldInfoList : null)),
  getContext: grab('getContext', () => (typeof getContext === 'function' ? getContext : null)),
  // ── 事件 ──
  eventOn: grab('eventOn', () => (typeof eventOn === 'function' ? eventOn : null), true),
  // ── 只登记不用的（写进 __xsdWho 的「可用 API 清单」，方便排障）──
  injectPrompts: grab('injectPrompts', () => (typeof injectPrompts === 'function' ? injectPrompts : null)),
  getLastMessageId: grab('getLastMessageId', () => (typeof getLastMessageId === 'function' ? getLastMessageId : null)),
};
/** 事件名表（不是函数，单独探） */
const EVENTS = (() => {
  try { return (typeof tavern_events !== 'undefined' && tavern_events) ? tavern_events : null; }
  catch (e) { console.warn(TAG, '⚠️ 取不到 tavern_events —— 事件钩子全部跳过'); return null; }
})();

/** 获取当前活跃聊天会话 ID（用于隔离多聊天状态，防止跨聊天污染） */
function currentChatId() {
  try {
    const ctx = (typeof SillyTavern !== 'undefined' && SillyTavern.getContext)
      ? SillyTavern.getContext()
      : ((typeof API !== 'undefined' && API.getContext) ? API.getContext() : null);
    if (ctx && ctx.chatId) return String(ctx.chatId);
    if (ctx && ctx.chat_id) return String(ctx.chat_id);
    if (typeof window !== 'undefined' && window.chat_id) return String(window.chat_id);
  } catch (e) { /* 忽略 */ }
  return 'default';
}

/** 内容哈希指纹（用于精确消息去重，比正文长度判定更可靠） */
function hashText(str) {
  const s = String(str || '');
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) + s.charCodeAt(i);
    h |= 0;
  }
  return (h >>> 0).toString(36) + '_' + s.length;
}

/** toastr（多层回退：先主窗口，再 iframe 自己的） */
function toast(kind, message, timeOut) {
  try {
    let t = null;
    try { t = (window.parent && window.parent.toastr) || null; } catch (e) { t = null; }
    if (!t) { try { t = (typeof toastr !== 'undefined') ? toastr : null; } catch (e) { t = null; } }
    if (!t) return false;
    const fn = (typeof t[kind] === 'function') ? t[kind] : (typeof t.info === 'function' ? t.info : null);
    if (!fn) return false;
    fn.call(t, message, '仙姝堕', { timeOut: timeOut || 6000 });
    return true;
  } catch (e) { return false; }
}

/* ═══════════════════════════════════════════════════════════
 * 三 · 零依赖路径读写（不引 lodash，免得版本差异）
 * ═══════════════════════════════════════════════════════════ */

/** 递归深度合并对象，保护已有键（如 known 解锁表）不被浅写冲刷覆盖 */
function deepMerge(target, source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return source;
  const out = (target && typeof target === 'object' && !Array.isArray(target)) ? Object.assign({}, target) : {};
  for (const k of Object.keys(source)) {
    const sv = source[k];
    const tv = out[k];
    if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
      out[k] = deepMerge(tv, sv);
    } else {
      out[k] = sv;
    }
  }
  return out;
}

function getPath(obj, path) {
  return String(path).split('.').reduce((o, k) => (o === null || o === undefined ? undefined : o[k]), obj);
}
function setPath(obj, path, value) {
  const ks = String(path).split('.');
  const last = ks.pop();
  let cur = obj;
  for (const k of ks) {
    if (cur[k] === null || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k];
  }
  cur[last] = value;
  return obj;
}
/** 值太长就截断（快照打印用，避免把整段正文糊到 console 里） */
function clip(v, n) {
  const t = String(v === undefined || v === null ? '' : v);
  const cap = n || 24;
  return t.length > cap ? t.slice(0, cap) + '…' : t;
}

/* ─────────── 存储层：消息层 ＋ 聊天层（双写；读时消息层优先）─────────── */
const L_MSG = { type: 'message', message_id: -1 };   // -1 ＝ 最新一楼
const L_CHAT = { type: 'chat' };
const LAYERS = [L_MSG, L_CHAT];
const LAYER_LABEL = { message: '消息层(#-1)', chat: '聊天层' };

/** 读一整层变量表；失败／形状不对返回 null */
function readLayer(opt) {
  if (!API.getVariables) return null;
  try {
    const v = API.getVariables(opt);
    return (v && typeof v === 'object' && !Array.isArray(v)) ? v : null;
  } catch (e) {
    console.warn(TAG, `读 ${LAYER_LABEL[opt.type]} 失败：`, msgOf(e));
    return null;
  }
}

/** 读 stat_data（两层的**合并视图**，消息层优先）。两层都没有 ⇒ null（调用方去初始化） */
function readStatData() {
  const chatV = readLayer(L_CHAT);
  const msgV = readLayer(L_MSG);
  const cs = (chatV && chatV.stat_data && typeof chatV.stat_data === 'object') ? chatV.stat_data : null;
  const ms = (msgV && msgV.stat_data && typeof msgV.stat_data === 'object') ? msgV.stat_data : null;
  if (!cs && !ms) return null;
  const stat = Object.assign({}, cs || {}, ms || {});
  const ck = (cs && cs.known && typeof cs.known === 'object') ? cs.known : null;
  const mk = (ms && ms.known && typeof ms.known === 'object') ? ms.known : null;
  if (ck || mk) stat.known = Object.assign({}, ck || {}, mk || {});
  return stat;
}

function readKnown() {
  const s = readStatData();
  return (s && s.known && typeof s.known === 'object') ? s.known : null;
}
function readIdentity() {
  const s = readStatData();
  return (s && typeof s.身份 === 'string' && s.身份) ? s.身份 : null;
}
function readFaction() {
  const s = readStatData();
  return (s && typeof s.阵营 === 'string' && s.阵营) ? s.阵营 : null;
}

/** 某层里 stat_data 的概况（诊断用，不打印正文） */
function layerProbe(opt) {
  const v = readLayer(opt);
  const sd = (v && v.stat_data && typeof v.stat_data === 'object') ? v.stat_data : null;
  const known = (sd && sd.known && typeof sd.known === 'object') ? sd.known : null;
  return {
    可用: !!v,
    顶层键: v ? Object.keys(v) : null,
    有stat_data: !!sd,
    stat_data键: sd ? Object.keys(sd) : null,
    known字段数: known ? Object.keys(known).length : null,
    身份: sd ? (sd.身份 ?? null) : null,
    阵营: sd ? (sd.阵营 ?? null) : null,
  };
}

/* ═══════════════════════════════════════════════════════════
 * 四 · 写入（双写 ＋ 前后快照）
 * ═══════════════════════════════════════════════════════════ */

/** stat_data 快照（只留判读要用的东西，值截断） */
function snapshot() {
  const s = readStatData();
  if (!s) return null;
  const known = (s.known && typeof s.known === 'object') ? s.known : {};
  const display = {};
  for (const k of DISPLAY_FIELDS) {
    if (s[k] !== undefined && s[k] !== null && s[k] !== '') display[k] = clip(s[k]);
  }
  return {
    身份: s.身份 ?? null,
    阵营: s.阵营 ?? null,
    已解锁: ALL_FIELDS.filter((f) => known[f] === true),
    未设字段: ALL_FIELDS.filter((f) => typeof known[f] !== 'boolean'),
    展示栏: display,
    // ⚠️ 在场角色是数组，clip() 会把它印成 [object Object] —— 单独压成一行摘要
    在场角色: Array.isArray(s[CAST_FIELD])
      ? s[CAST_FIELD].map((c) => `${(c && c.名) || '未具名'}(${(c && c.阶段) || '-'})`).join('｜')
      : null,
  };
}
function dumpStat(where) {
  const snap = snapshot();
  console.log(TAG, `[${where}] stat_data 快照：`, snap);
  return snap;
}

/** 把一个 thenable 收敛成 boolean（有些接口在不同版本里可能返回 Promise） */
function settle(ret, name) {
  if (ret && typeof ret.then === 'function') {
    return ret.then(() => true).catch((e) => { console.warn(TAG, `${name} 异步失败：`, msgOf(e)); return false; });
  }
  return Promise.resolve(true);
}

/**
 * 写 stat_data（**双写**：消息层 ＋ 聊天层，两边保持一致）。
 * @param {object} patch 形如 `{ 身份: '…', known: { 封元镇灵环: true } }`（顶层键会深合并）
 * @param {string} why   写这条的原因（日志用）
 */
async function writeStat(patch, why) {
  const keys = Object.keys(patch || {});
  if (!keys.length) return { ok: false, why: '空写入' };
  dumpStat(`${why} · 改动前`);

  const initialChat = currentChatId();
  const detail = [];
  let okAny = false;
  for (const opt of LAYERS) {
    if (currentChatId() !== initialChat) {
      console.warn(TAG, `[写入] 异步写入中检测到聊天已切换（当前 ${currentChatId()} !== 初始 ${initialChat}），中止跨会话写入`);
      break;
    }
    let layerOk = false;
    let via = '';
    // 主路：insertOrAssignVariables —— 深合并，不必先读整层，天然保住别的键
    if (API.insertOrAssignVariables) {
      try {
        const ret = API.insertOrAssignVariables({ stat_data: patch }, opt);
        layerOk = await settle(ret, `insertOrAssignVariables(${opt.type})`);
        if (layerOk) via = 'insertOrAssignVariables';
      } catch (e) {
        console.warn(TAG, `insertOrAssignVariables(${LAYER_LABEL[opt.type]}) 失败：`, msgOf(e));
      }
    }
    // 回退：读出整层 → 深度合并 stat_data 字段 → 整层replace
    if (!layerOk && API.getVariables && API.replaceVariables) {
      try {
        const v = API.getVariables(opt);
        const base = (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
        const existingSd = (base.stat_data && typeof base.stat_data === 'object' && !Array.isArray(base.stat_data)) ? base.stat_data : {};
        base.stat_data = deepMerge(existingSd, patch);
        const ret = API.replaceVariables(base, opt);
        layerOk = await settle(ret, `replaceVariables(${opt.type})`);
        if (layerOk) via = 'replaceVariables';
      } catch (e) {
        console.warn(TAG, `replaceVariables(${LAYER_LABEL[opt.type]}) 失败：`, msgOf(e));
      }
    }
    if (layerOk) okAny = true;
    detail.push(`${LAYER_LABEL[opt.type]}:${layerOk ? '✔' + via : '✘'}`);
  }

  console.log(TAG, `[写入] ${why} → ${detail.join(' ｜ ')}`);
  if (!okAny) console.error(TAG, `❌ 写入失败：${why} —— 变量接口都用不了，闸门这一轮不会更新`);
  dumpStat(`${why} · 改动后`);

  // ★ 写入成功后联动通知面板刷新名器纹章与状态
  if (okAny) {
    try {
      const refresh = (typeof window !== 'undefined' && typeof window.__xsdRefreshRelics === 'function')
        ? window.__xsdRefreshRelics
        : ((typeof window !== 'undefined' && window.parent && typeof window.parent.__xsdRefreshRelics === 'function')
          ? window.parent.__xsdRefreshRelics : null);
      if (refresh) refresh();
    } catch (e) { /* 忽略 */ }
  }

  return { ok: okAny, via: detail.join(' ｜ ') };
}

/** 写一个 known 字段 */
async function writeKnownField(field, value) {
  if (!ALL_FIELDS.includes(field)) {
    return { ok: false, why: `未知字段「${field}」（可发「锚点」查看清单）` };
  }
  return writeStat({ known: { [field]: !!value } }, `${field} = ${!!value}`);
}

/** 写身份（连阵营一起写），写完顺带把世界书那 6 条【身份】条目拨到选中那条 */
async function writeIdentity(name) {
  if (!IDENTITY_NAMES.includes(name)) {
    return { ok: false, why: `未知身份「${name}」（可用：${IDENTITY_NAMES.join(' / ')}）` };
  }
  const faction = IDENTITY_FACTION[name] ?? FACTION_DEFAULT;
  const r = await writeStat({ 身份: name, 阵营: faction }, `身份 → ${name}／阵营 ${faction}`);
  if (!r.ok) return { ok: false, why: '变量接口不可用，身份没写进去' };
  /* ⚠️ v1.5：换身份后同步「天姝会存在」的起手值（殿主 ⇒ true；赵无忧／自设 ⇒ 保持不动）。
   *   只升不降 —— 切回赵无忧不会把它打回 false（那会抹掉玩家已经知道的事实）。 */
  if (openFieldDefaultFor(name)) {
    try { await ensureInit(`换身份→${name}`); }
    catch (e) { console.warn(TAG, `[初始化·换身份→${name}] 失败（已吞掉）：`, msgOf(e)); }
  }
  const entries = await syncIdentityEntries(name);
  return { ok: true, faction, via: r.via, entries };
}

/* ═══════════════════════════════════════════════════════════
 * 五 · 初始化（幂等：只在字段缺失时补）
 * ═══════════════════════════════════════════════════════════ */

/**
 * 补齐缺失字段：
 *   · 13 个 known 全 false
 *   · 身份 = 赵无忧　·　阵营 = 墨山道
 * 已经有值的**一律不动**（否则玩家用 /解锁 翻开的锚点会被每次换聊天冲掉）。
 */
async function ensureInit(where) {
  const s = readStatData();
  const known = (s && s.known && typeof s.known === 'object') ? s.known : {};
  const patch = {};
  const missingKnown = ALL_FIELDS.filter((f) => typeof known[f] !== 'boolean');
  if (missingKnown.length) {
    patch.known = {};
    for (const f of missingKnown) patch.known[f] = false;
  }
  if (!s || typeof s.身份 !== 'string' || !s.身份) patch.身份 = IDENTITY_DEFAULT;
  if (!s || typeof s.阵营 !== 'string' || !s.阵营) patch.阵营 = FACTION_DEFAULT;

  /* ⚠️ v1.5：按身份校正「天姝会存在」这一格（见 OPEN_FIELD_FOR_OWNER 注释）。
   *   只在**该为 true 却还是 false** 时补 —— 账本是只升不降的：
   *   玩家用 `/解锁` 翻开的、或从殿主身份切走后留下的 true，一律不回退。 */
  const identityNow = (patch.身份 !== undefined) ? patch.身份 : s?.身份;
  for (const f of openFieldsFor(identityNow)) {
    const cur = known[f];
    if (cur === true
/* …（超长截断，需要全文请让主人再导一次）… */
```

## 二、填表／提交处理函数（控制器所在文件的命中行）

### `src/first_floor_rebuild/menu-builder.cjs`：命中 8 行

命中行号：30、31、49、53、54、55、56、57

**第 5–55 行**

```javascript
const MENU_CSS = fs.readFileSync(path.join(__dirname, 'menu.css'), 'utf8');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isImage = value => typeof value === 'string' && (/^data:image\/(?:png|webp|jpeg|gif|avif);base64,/i.test(value) || /^https?:\/\//i.test(value));

function buildMenuHtml({ roster = FLOWER_ROSTER, assets = {}, tokenMap = {}, instanceId = 'xds-opening' } = {}) {
  if (!Array.isArray(roster) || !roster.length) throw new Error('FLOWER_ROSTER 至少需要一位角色');
  if (!/^[a-z][a-z0-9_-]*$/i.test(instanceId)) throw new Error('instanceId 只能使用字母、数字、下划线和连字符，且以字母开头');
  const seen = new Set();
  const attr = escapeHtml;
  function imageAttrs(token, key, kind) {
    const tokenName = String(token).replace(/^\{\{|\}\}$/g, '');
    const direct = isImage(token) ? token : tokenMap[token] || tokenMap[tokenName] || assets.menu?.[tokenName] ||
      (kind === 'portrait' ? assets.lightbox?.[key] || assets.panel?.[key] : assets.relics?.[key]);
    return `data-xds-image="${kind}" data-xds-token="${attr(tokenName)}" data-xds-asset-key="${attr(key)}"${isImage(direct) ? ` src="${attr(direct)}"` : ''}`;
  }
  const cards = roster.map(person => {
    if (!/^[a-z][a-z0-9_-]*$/i.test(person.id) || seen.has(person.id)) throw new Error('角色 id 必须合法且唯一：' + person.id);
    seen.add(person.id);
    return `<article data-xds-flower data-xds-roster-id="${attr(person.id)}" aria-label="${attr(person.name)}">
      <div data-xds-art-state><b>${attr(person.name)}</b><span>仙姿待绘入卷</span></div>
      <img data-xds-art ${imageAttrs(person.image, person.imageKey || person.id, 'portrait')} alt="${attr(person.name)}彩色立绘" loading="lazy" decoding="async">
      <div data-xds-badge title="${attr(person.relicName)} · 图鉴预览" aria-label="${attr(person.relicName)} · 图鉴预览"><span>待</span><img ${imageAttrs(person.relicIcon, person.relicKey || '', 'relic')} alt="${attr(person.relicName)}纹章" loading="lazy" decoding="async"></div>
      <div data-xds-card-info><div data-xds-card-name>${attr(person.name)}</div>${person.title ? `<div data-xds-card-title>${attr(person.title)}</div>` : ''}${person.sect ? `<div data-xds-card-sect>${attr(person.sect)}</div>` : ''}${person.quote ? `<p data-xds-card-quote>${attr(person.quote)}</p>` : ''}</div>
    </article>`;
  }).join('');
  const chips = (field, values) => `<div data-xds-chips>${values.map(value => `<button type="button" data-xds-fill="${field}" data-xds-value="${attr(value)}" aria-pressed="false">${attr(value)}</button>`).join('')}</div>`;
  const field = (name, label, placeholder, max, extra = '') => `<div data-xds-field-box><label data-xds-field-label for="${instanceId}-${name}">${label}</label><input type="text" id="${instanceId}-${name}" name="${name}" data-xds-field="${name}" class="xds-input" placeholder="${attr(placeholder)}" maxlength="${max}" ${extra}></div>`;
  const template = `<style>${MENU_CSS}</style><div class="xds-menu-wrapper" data-xds-menu>
    <input type="radio" class="xds-page-radio" data-xds-page="flower" id="${instanceId}-page-flower" name="${instanceId}-page" checked aria-label="太微百花谱">
    <input type="radio" class="xds-page-radio" data-xds-page="custom" id="${instanceId}-page-custom" name="${instanceId}-page" aria-label="自设问道书卷">
    <div class="xds-view-flower" data-xds-view="flower">
      <header data-xds-heading><div data-xds-eyebrow>揽 芳 卷</div><h2>太微百花谱</h2><p>雾隐仙姿 · 纹章辨器 · 一卷定命途</p></header>
      <div class="xds-flower-carousel" data-xds-carousel tabindex="0" role="region" aria-label="仙姝名录，左右翻阅">${cards}</div>
      <div data-xds-carousel-nav><button type="button" data-xds-carousel-step="-1" aria-label="向左翻阅">‹</button><span>左右翻阅仙姝名录 · 四阶纹章为图鉴预览</span><button type="button" data-xds-carousel-step="1" aria-label="向右翻阅">›</button></div>
      <div data-xds-section-title>择一命途 · 入太微红尘</div>
      <div data-xds-identity-grid>
        <button type="button" class="xds-mbtn" data-xds-entry data-xds-identity="赵无忧"><b>赵无忧</b><small>墨山道六弟子 · 原作主角</small></button>
        <details data-xds-lords><summary data-xds-entry><b>四大殿主 <span aria-hidden="true">⌄</span></b><small>残阳 · 肉山 · 九皇子 · 病相思</small></summary><div data-xds-lord-list><button type="button" data-xds-identity="焚欲殿主">焚欲殿主 · 残阳老怪</button><button type="button" data-xds-identity="欢喜殿主">欢喜殿主 · 肉山佛</button><button type="button" data-xds-identity="浊龙殿主">浊龙殿主 · 九皇子</button><button type="button" data-xds-identity="魂欢殿主">魂欢殿主 · 病相思</button></div></details>
        <label for="${instanceId}-page-custom" class="xds-mbtn" data-xds-entry data-xds-open-custom role="button" tabindex="0"><b>自设命途</b><small>问道问心 · 提笔亲定来历与机缘</small></label>
      </div><p data-xds-status role="status" aria-live="polite"></p>
    </div>
    <div class="xds-view-custom" data-xds-view="custom"><div class="xds-custom-scroll" data-xds-custom-form>
      <label for="${instanceId}-page-flower" data-xds-back role="button" tabindex="0">‹ 返回百花谱</label>
      <header data-xds-heading><div data-xds-eyebrow>自 设 · 问 道 问 心 简</div><h2>提笔定命 · 启卷入世</h2><p>道号、根骨与来处，皆由道友亲书。</p></header>
      <div data-xds-fields>
        ${field('custom_name', '道号尊名', '留空使用当前 Persona 名', 64, 'autocomplete="off"')}
        ${field('custom_gender', '根骨性别', '如：男 / 女 / 自定', 16, 'value="男" autocomplete="off"')}
        ${field('custom_age', '寿数年岁', '如：弱冠之年（20）', 32, 'autocomplete="off"')}
        <div data-xds-field-box><label data-xds-field-label for="${instanceId}-custom_cultivation">境界修为</label><input type="text" class="xds-input" id="${instanceId}-custom_cultivation" name="custom_cultivation" data-xds-field="custom_cultivation" placeholder="如：练气圆满、筑基初期" maxlength="96">${chips('custom_cultivation', ['练气圆满', '筑基初期', '筑基大圆满', '金丹大修'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_sect">入世身份</label><input type="text" class="xds-input" id="${instanceId}-custom_sect" name="custom_sect" data-xds-field="custom_sect" placeholder="宗门、行当或来历，随心填写" maxlength="128">${chips('custom_sect', ['大荒散修', '天枢剑宗弃徒', '墨山道外门散人', '天音阁弄琴客', '欢喜魔门谍客'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_timepoint">当前时点</label><input type="text" class="xds-input" id="${instanceId}-custom_timepoint" name="custom_timepoint" data-xds-field="custom_timepoint" placeholder="留空默认第一章（墨山探幽 · 仙盟历 1578 年 · 三月初三），可自定年月日，如「仙盟历 1579 年 · 六月初七」" maxlength="64">${chips('custom_timepoint', ['正章之前 · 仙盟历 1577 年 · 七月初一', '暗流微澜 · 仙盟历 1577 年 · 十二月初一', '第一章（墨山探幽）· 仙盟历 1578 年 · 三月初三', '南域大劫 · 仙盟历 1578 年 · 八月初一', '天溪兽潮 · 仙盟历 1579 年 · 一月初一', '天溪城破 · 仙盟历 1579 年 · 三月初一', '乱世割据 · 仙盟历 1579 年 · 六月初一', '极乐定局 · 仙盟历 1580 年 · 一月初一'])}</div>
```

**第 6–56 行**

```javascript
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isImage = value => typeof value === 'string' && (/^data:image\/(?:png|webp|jpeg|gif|avif);base64,/i.test(value) || /^https?:\/\//i.test(value));

function buildMenuHtml({ roster = FLOWER_ROSTER, assets = {}, tokenMap = {}, instanceId = 'xds-opening' } = {}) {
  if (!Array.isArray(roster) || !roster.length) throw new Error('FLOWER_ROSTER 至少需要一位角色');
  if (!/^[a-z][a-z0-9_-]*$/i.test(instanceId)) throw new Error('instanceId 只能使用字母、数字、下划线和连字符，且以字母开头');
  const seen = new Set();
  const attr = escapeHtml;
  function imageAttrs(token, key, kind) {
    const tokenName = String(token).replace(/^\{\{|\}\}$/g, '');
    const direct = isImage(token) ? token : tokenMap[token] || tokenMap[tokenName] || assets.menu?.[tokenName] ||
      (kind === 'portrait' ? assets.lightbox?.[key] || assets.panel?.[key] : assets.relics?.[key]);
    return `data-xds-image="${kind}" data-xds-token="${attr(tokenName)}" data-xds-asset-key="${attr(key)}"${isImage(direct) ? ` src="${attr(direct)}"` : ''}`;
  }
  const cards = roster.map(person => {
    if (!/^[a-z][a-z0-9_-]*$/i.test(person.id) || seen.has(person.id)) throw new Error('角色 id 必须合法且唯一：' + person.id);
    seen.add(person.id);
    return `<article data-xds-flower data-xds-roster-id="${attr(person.id)}" aria-label="${attr(person.name)}">
      <div data-xds-art-state><b>${attr(person.name)}</b><span>仙姿待绘入卷</span></div>
      <img data-xds-art ${imageAttrs(person.image, person.imageKey || person.id, 'portrait')} alt="${attr(person.name)}彩色立绘" loading="lazy" decoding="async">
      <div data-xds-badge title="${attr(person.relicName)} · 图鉴预览" aria-label="${attr(person.relicName)} · 图鉴预览"><span>待</span><img ${imageAttrs(person.relicIcon, person.relicKey || '', 'relic')} alt="${attr(person.relicName)}纹章" loading="lazy" decoding="async"></div>
      <div data-xds-card-info><div data-xds-card-name>${attr(person.name)}</div>${person.title ? `<div data-xds-card-title>${attr(person.title)}</div>` : ''}${person.sect ? `<div data-xds-card-sect>${attr(person.sect)}</div>` : ''}${person.quote ? `<p data-xds-card-quote>${attr(person.quote)}</p>` : ''}</div>
    </article>`;
  }).join('');
  const chips = (field, values) => `<div data-xds-chips>${values.map(value => `<button type="button" data-xds-fill="${field}" data-xds-value="${attr(value)}" aria-pressed="false">${attr(value)}</button>`).join('')}</div>`;
  const field = (name, label, placeholder, max, extra = '') => `<div data-xds-field-box><label data-xds-field-label for="${instanceId}-${name}">${label}</label><input type="text" id="${instanceId}-${name}" name="${name}" data-xds-field="${name}" class="xds-input" placeholder="${attr(placeholder)}" maxlength="${max}" ${extra}></div>`;
  const template = `<style>${MENU_CSS}</style><div class="xds-menu-wrapper" data-xds-menu>
    <input type="radio" class="xds-page-radio" data-xds-page="flower" id="${instanceId}-page-flower" name="${instanceId}-page" checked aria-label="太微百花谱">
    <input type="radio" class="xds-page-radio" data-xds-page="custom" id="${instanceId}-page-custom" name="${instanceId}-page" aria-label="自设问道书卷">
    <div class="xds-view-flower" data-xds-view="flower">
      <header data-xds-heading><div data-xds-eyebrow>揽 芳 卷</div><h2>太微百花谱</h2><p>雾隐仙姿 · 纹章辨器 · 一卷定命途</p></header>
      <div class="xds-flower-carousel" data-xds-carousel tabindex="0" role="region" aria-label="仙姝名录，左右翻阅">${cards}</div>
      <div data-xds-carousel-nav><button type="button" data-xds-carousel-step="-1" aria-label="向左翻阅">‹</button><span>左右翻阅仙姝名录 · 四阶纹章为图鉴预览</span><button type="button" data-xds-carousel-step="1" aria-label="向右翻阅">›</button></div>
      <div data-xds-section-title>择一命途 · 入太微红尘</div>
      <div data-xds-identity-grid>
        <button type="button" class="xds-mbtn" data-xds-entry data-xds-identity="赵无忧"><b>赵无忧</b><small>墨山道六弟子 · 原作主角</small></button>
        <details data-xds-lords><summary data-xds-entry><b>四大殿主 <span aria-hidden="true">⌄</span></b><small>残阳 · 肉山 · 九皇子 · 病相思</small></summary><div data-xds-lord-list><button type="button" data-xds-identity="焚欲殿主">焚欲殿主 · 残阳老怪</button><button type="button" data-xds-identity="欢喜殿主">欢喜殿主 · 肉山佛</button><button type="button" data-xds-identity="浊龙殿主">浊龙殿主 · 九皇子</button><button type="button" data-xds-identity="魂欢殿主">魂欢殿主 · 病相思</button></div></details>
        <label for="${instanceId}-page-custom" class="xds-mbtn" data-xds-entry data-xds-open-custom role="button" tabindex="0"><b>自设命途</b><small>问道问心 · 提笔亲定来历与机缘</small></label>
      </div><p data-xds-status role="status" aria-live="polite"></p>
    </div>
    <div class="xds-view-custom" data-xds-view="custom"><div class="xds-custom-scroll" data-xds-custom-form>
      <label for="${instanceId}-page-flower" data-xds-back role="button" tabindex="0">‹ 返回百花谱</label>
      <header data-xds-heading><div data-xds-eyebrow>自 设 · 问 道 问 心 简</div><h2>提笔定命 · 启卷入世</h2><p>道号、根骨与来处，皆由道友亲书。</p></header>
      <div data-xds-fields>
        ${field('custom_name', '道号尊名', '留空使用当前 Persona 名', 64, 'autocomplete="off"')}
        ${field('custom_gender', '根骨性别', '如：男 / 女 / 自定', 16, 'value="男" autocomplete="off"')}
        ${field('custom_age', '寿数年岁', '如：弱冠之年（20）', 32, 'autocomplete="off"')}
        <div data-xds-field-box><label data-xds-field-label for="${instanceId}-custom_cultivation">境界修为</label><input type="text" class="xds-input" id="${instanceId}-custom_cultivation" name="custom_cultivation" data-xds-field="custom_cultivation" placeholder="如：练气圆满、筑基初期" maxlength="96">${chips('custom_cultivation', ['练气圆满', '筑基初期', '筑基大圆满', '金丹大修'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_sect">入世身份</label><input type="text" class="xds-input" id="${instanceId}-custom_sect" name="custom_sect" data-xds-field="custom_sect" placeholder="宗门、行当或来历，随心填写" maxlength="128">${chips('custom_sect', ['大荒散修', '天枢剑宗弃徒', '墨山道外门散人', '天音阁弄琴客', '欢喜魔门谍客'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_timepoint">当前时点</label><input type="text" class="xds-input" id="${instanceId}-custom_timepoint" name="custom_timepoint" data-xds-field="custom_timepoint" placeholder="留空默认第一章（墨山探幽 · 仙盟历 1578 年 · 三月初三），可自定年月日，如「仙盟历 1579 年 · 六月初七」" maxlength="64">${chips('custom_timepoint', ['正章之前 · 仙盟历 1577 年 · 七月初一', '暗流微澜 · 仙盟历 1577 年 · 十二月初一', '第一章（墨山探幽）· 仙盟历 1578 年 · 三月初三', '南域大劫 · 仙盟历 1578 年 · 八月初一', '天溪兽潮 · 仙盟历 1579 年 · 一月初一', '天溪城破 · 仙盟历 1579 年 · 三月初一', '乱世割据 · 仙盟历 1579 年 · 六月初一', '极乐定局 · 仙盟历 1580 年 · 一月初一'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_origin">获取《极乐引》的机缘方式</label><textarea class="xds-textarea" data-xds-field="custom_origin" id="${instanceId}-custom_origin" name="custom_origin" rows="4" maxlength="1800" placeholder="捡得、窃取、夺来、师门密传……写下独属于你的机缘。"></textarea><p data-xds-help>留空采用默认来历；提交会先切换为自设，再将设定发送至当前会话。</p></div>
```

**第 24–68 行**

```javascript
      <div data-xds-art-state><b>${attr(person.name)}</b><span>仙姿待绘入卷</span></div>
      <img data-xds-art ${imageAttrs(person.image, person.imageKey || person.id, 'portrait')} alt="${attr(person.name)}彩色立绘" loading="lazy" decoding="async">
      <div data-xds-badge title="${attr(person.relicName)} · 图鉴预览" aria-label="${attr(person.relicName)} · 图鉴预览"><span>待</span><img ${imageAttrs(person.relicIcon, person.relicKey || '', 'relic')} alt="${attr(person.relicName)}纹章" loading="lazy" decoding="async"></div>
      <div data-xds-card-info><div data-xds-card-name>${attr(person.name)}</div>${person.title ? `<div data-xds-card-title>${attr(person.title)}</div>` : ''}${person.sect ? `<div data-xds-card-sect>${attr(person.sect)}</div>` : ''}${person.quote ? `<p data-xds-card-quote>${attr(person.quote)}</p>` : ''}</div>
    </article>`;
  }).join('');
  const chips = (field, values) => `<div data-xds-chips>${values.map(value => `<button type="button" data-xds-fill="${field}" data-xds-value="${attr(value)}" aria-pressed="false">${attr(value)}</button>`).join('')}</div>`;
  const field = (name, label, placeholder, max, extra = '') => `<div data-xds-field-box><label data-xds-field-label for="${instanceId}-${name}">${label}</label><input type="text" id="${instanceId}-${name}" name="${name}" data-xds-field="${name}" class="xds-input" placeholder="${attr(placeholder)}" maxlength="${max}" ${extra}></div>`;
  const template = `<style>${MENU_CSS}</style><div class="xds-menu-wrapper" data-xds-menu>
    <input type="radio" class="xds-page-radio" data-xds-page="flower" id="${instanceId}-page-flower" name="${instanceId}-page" checked aria-label="太微百花谱">
    <input type="radio" class="xds-page-radio" data-xds-page="custom" id="${instanceId}-page-custom" name="${instanceId}-page" aria-label="自设问道书卷">
    <div class="xds-view-flower" data-xds-view="flower">
      <header data-xds-heading><div data-xds-eyebrow>揽 芳 卷</div><h2>太微百花谱</h2><p>雾隐仙姿 · 纹章辨器 · 一卷定命途</p></header>
      <div class="xds-flower-carousel" data-xds-carousel tabindex="0" role="region" aria-label="仙姝名录，左右翻阅">${cards}</div>
      <div data-xds-carousel-nav><button type="button" data-xds-carousel-step="-1" aria-label="向左翻阅">‹</button><span>左右翻阅仙姝名录 · 四阶纹章为图鉴预览</span><button type="button" data-xds-carousel-step="1" aria-label="向右翻阅">›</button></div>
      <div data-xds-section-title>择一命途 · 入太微红尘</div>
      <div data-xds-identity-grid>
        <button type="button" class="xds-mbtn" data-xds-entry data-xds-identity="赵无忧"><b>赵无忧</b><small>墨山道六弟子 · 原作主角</small></button>
        <details data-xds-lords><summary data-xds-entry><b>四大殿主 <span aria-hidden="true">⌄</span></b><small>残阳 · 肉山 · 九皇子 · 病相思</small></summary><div data-xds-lord-list><button type="button" data-xds-identity="焚欲殿主">焚欲殿主 · 残阳老怪</button><button type="button" data-xds-identity="欢喜殿主">欢喜殿主 · 肉山佛</button><button type="button" data-xds-identity="浊龙殿主">浊龙殿主 · 九皇子</button><button type="button" data-xds-identity="魂欢殿主">魂欢殿主 · 病相思</button></div></details>
        <label for="${instanceId}-page-custom" class="xds-mbtn" data-xds-entry data-xds-open-custom role="button" tabindex="0"><b>自设命途</b><small>问道问心 · 提笔亲定来历与机缘</small></label>
      </div><p data-xds-status role="status" aria-live="polite"></p>
    </div>
    <div class="xds-view-custom" data-xds-view="custom"><div class="xds-custom-scroll" data-xds-custom-form>
      <label for="${instanceId}-page-flower" data-xds-back role="button" tabindex="0">‹ 返回百花谱</label>
      <header data-xds-heading><div data-xds-eyebrow>自 设 · 问 道 问 心 简</div><h2>提笔定命 · 启卷入世</h2><p>道号、根骨与来处，皆由道友亲书。</p></header>
      <div data-xds-fields>
        ${field('custom_name', '道号尊名', '留空使用当前 Persona 名', 64, 'autocomplete="off"')}
        ${field('custom_gender', '根骨性别', '如：男 / 女 / 自定', 16, 'value="男" autocomplete="off"')}
        ${field('custom_age', '寿数年岁', '如：弱冠之年（20）', 32, 'autocomplete="off"')}
        <div data-xds-field-box><label data-xds-field-label for="${instanceId}-custom_cultivation">境界修为</label><input type="text" class="xds-input" id="${instanceId}-custom_cultivation" name="custom_cultivation" data-xds-field="custom_cultivation" placeholder="如：练气圆满、筑基初期" maxlength="96">${chips('custom_cultivation', ['练气圆满', '筑基初期', '筑基大圆满', '金丹大修'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_sect">入世身份</label><input type="text" class="xds-input" id="${instanceId}-custom_sect" name="custom_sect" data-xds-field="custom_sect" placeholder="宗门、行当或来历，随心填写" maxlength="128">${chips('custom_sect', ['大荒散修', '天枢剑宗弃徒', '墨山道外门散人', '天音阁弄琴客', '欢喜魔门谍客'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_timepoint">当前时点</label><input type="text" class="xds-input" id="${instanceId}-custom_timepoint" name="custom_timepoint" data-xds-field="custom_timepoint" placeholder="留空默认第一章（墨山探幽 · 仙盟历 1578 年 · 三月初三），可自定年月日，如「仙盟历 1579 年 · 六月初七」" maxlength="64">${chips('custom_timepoint', ['正章之前 · 仙盟历 1577 年 · 七月初一', '暗流微澜 · 仙盟历 1577 年 · 十二月初一', '第一章（墨山探幽）· 仙盟历 1578 年 · 三月初三', '南域大劫 · 仙盟历 1578 年 · 八月初一', '天溪兽潮 · 仙盟历 1579 年 · 一月初一', '天溪城破 · 仙盟历 1579 年 · 三月初一', '乱世割据 · 仙盟历 1579 年 · 六月初一', '极乐定局 · 仙盟历 1580 年 · 一月初一'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_origin">获取《极乐引》的机缘方式</label><textarea class="xds-textarea" data-xds-field="custom_origin" id="${instanceId}-custom_origin" name="custom_origin" rows="4" maxlength="1800" placeholder="捡得、窃取、夺来、师门密传……写下独属于你的机缘。"></textarea><p data-xds-help>留空采用默认来历；提交会先切换为自设，再将设定发送至当前会话。</p></div>
      </div><button type="button" class="xds-submit-seal" data-xds-action="submit-custom">提笔落款 · 启卷入世</button><p data-xds-status role="status" aria-live="polite"></p>
    </div></div>
  </div>`;
  // 消息 HTML 按一行输出，避免 Showdown 把缩进识别成代码块或插入额外 <br>。
  return template.replace(/\/\*[\s\S]*?\*\//g, '').replace(/>\s+</g, '><').replace(/[\r\n]+\s*/g, ' ').trim();
}

const MENU_HTML = buildMenuHtml();
module.exports = { MENU_HTML, MENU_CSS, FLOWER_ROSTER, buildMenuHtml };

if (require.main === module) fs.writeFileSync(path.join(__dirname, 'MENU_HTML.html'), MENU_HTML, 'utf8');

```

**第 28–68 行**

```javascript
    </article>`;
  }).join('');
  const chips = (field, values) => `<div data-xds-chips>${values.map(value => `<button type="button" data-xds-fill="${field}" data-xds-value="${attr(value)}" aria-pressed="false">${attr(value)}</button>`).join('')}</div>`;
  const field = (name, label, placeholder, max, extra = '') => `<div data-xds-field-box><label data-xds-field-label for="${instanceId}-${name}">${label}</label><input type="text" id="${instanceId}-${name}" name="${name}" data-xds-field="${name}" class="xds-input" placeholder="${attr(placeholder)}" maxlength="${max}" ${extra}></div>`;
  const template = `<style>${MENU_CSS}</style><div class="xds-menu-wrapper" data-xds-menu>
    <input type="radio" class="xds-page-radio" data-xds-page="flower" id="${instanceId}-page-flower" name="${instanceId}-page" checked aria-label="太微百花谱">
    <input type="radio" class="xds-page-radio" data-xds-page="custom" id="${instanceId}-page-custom" name="${instanceId}-page" aria-label="自设问道书卷">
    <div class="xds-view-flower" data-xds-view="flower">
      <header data-xds-heading><div data-xds-eyebrow>揽 芳 卷</div><h2>太微百花谱</h2><p>雾隐仙姿 · 纹章辨器 · 一卷定命途</p></header>
      <div class="xds-flower-carousel" data-xds-carousel tabindex="0" role="region" aria-label="仙姝名录，左右翻阅">${cards}</div>
      <div data-xds-carousel-nav><button type="button" data-xds-carousel-step="-1" aria-label="向左翻阅">‹</button><span>左右翻阅仙姝名录 · 四阶纹章为图鉴预览</span><button type="button" data-xds-carousel-step="1" aria-label="向右翻阅">›</button></div>
      <div data-xds-section-title>择一命途 · 入太微红尘</div>
      <div data-xds-identity-grid>
        <button type="button" class="xds-mbtn" data-xds-entry data-xds-identity="赵无忧"><b>赵无忧</b><small>墨山道六弟子 · 原作主角</small></button>
        <details data-xds-lords><summary data-xds-entry><b>四大殿主 <span aria-hidden="true">⌄</span></b><small>残阳 · 肉山 · 九皇子 · 病相思</small></summary><div data-xds-lord-list><button type="button" data-xds-identity="焚欲殿主">焚欲殿主 · 残阳老怪</button><button type="button" data-xds-identity="欢喜殿主">欢喜殿主 · 肉山佛</button><button type="button" data-xds-identity="浊龙殿主">浊龙殿主 · 九皇子</button><button type="button" data-xds-identity="魂欢殿主">魂欢殿主 · 病相思</button></div></details>
        <label for="${instanceId}-page-custom" class="xds-mbtn" data-xds-entry data-xds-open-custom role="button" tabindex="0"><b>自设命途</b><small>问道问心 · 提笔亲定来历与机缘</small></label>
      </div><p data-xds-status role="status" aria-live="polite"></p>
    </div>
    <div class="xds-view-custom" data-xds-view="custom"><div class="xds-custom-scroll" data-xds-custom-form>
      <label for="${instanceId}-page-flower" data-xds-back role="button" tabindex="0">‹ 返回百花谱</label>
      <header data-xds-heading><div data-xds-eyebrow>自 设 · 问 道 问 心 简</div><h2>提笔定命 · 启卷入世</h2><p>道号、根骨与来处，皆由道友亲书。</p></header>
      <div data-xds-fields>
        ${field('custom_name', '道号尊名', '留空使用当前 Persona 名', 64, 'autocomplete="off"')}
        ${field('custom_gender', '根骨性别', '如：男 / 女 / 自定', 16, 'value="男" autocomplete="off"')}
        ${field('custom_age', '寿数年岁', '如：弱冠之年（20）', 32, 'autocomplete="off"')}
        <div data-xds-field-box><label data-xds-field-label for="${instanceId}-custom_cultivation">境界修为</label><input type="text" class="xds-input" id="${instanceId}-custom_cultivation" name="custom_cultivation" data-xds-field="custom_cultivation" placeholder="如：练气圆满、筑基初期" maxlength="96">${chips('custom_cultivation', ['练气圆满', '筑基初期', '筑基大圆满', '金丹大修'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_sect">入世身份</label><input type="text" class="xds-input" id="${instanceId}-custom_sect" name="custom_sect" data-xds-field="custom_sect" placeholder="宗门、行当或来历，随心填写" maxlength="128">${chips('custom_sect', ['大荒散修', '天枢剑宗弃徒', '墨山道外门散人', '天音阁弄琴客', '欢喜魔门谍客'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_timepoint">当前时点</label><input type="text" class="xds-input" id="${instanceId}-custom_timepoint" name="custom_timepoint" data-xds-field="custom_timepoint" placeholder="留空默认第一章（墨山探幽 · 仙盟历 1578 年 · 三月初三），可自定年月日，如「仙盟历 1579 年 · 六月初七」" maxlength="64">${chips('custom_timepoint', ['正章之前 · 仙盟历 1577 年 · 七月初一', '暗流微澜 · 仙盟历 1577 年 · 十二月初一', '第一章（墨山探幽）· 仙盟历 1578 年 · 三月初三', '南域大劫 · 仙盟历 1578 年 · 八月初一', '天溪兽潮 · 仙盟历 1579 年 · 一月初一', '天溪城破 · 仙盟历 1579 年 · 三月初一', '乱世割据 · 仙盟历 1579 年 · 六月初一', '极乐定局 · 仙盟历 1580 年 · 一月初一'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_origin">获取《极乐引》的机缘方式</label><textarea class="xds-textarea" data-xds-field="custom_origin" id="${instanceId}-custom_origin" name="custom_origin" rows="4" maxlength="1800" placeholder="捡得、窃取、夺来、师门密传……写下独属于你的机缘。"></textarea><p data-xds-help>留空采用默认来历；提交会先切换为自设，再将设定发送至当前会话。</p></div>
      </div><button type="button" class="xds-submit-seal" data-xds-action="submit-custom">提笔落款 · 启卷入世</button><p data-xds-status role="status" aria-live="polite"></p>
    </div></div>
  </div>`;
  // 消息 HTML 按一行输出，避免 Showdown 把缩进识别成代码块或插入额外 <br>。
  return template.replace(/\/\*[\s\S]*?\*\//g, '').replace(/>\s+</g, '><').replace(/[\r\n]+\s*/g, ' ').trim();
}

const MENU_HTML = buildMenuHtml();
module.exports = { MENU_HTML, MENU_CSS, FLOWER_ROSTER, buildMenuHtml };

if (require.main === module) fs.writeFileSync(path.join(__dirname, 'MENU_HTML.html'), MENU_HTML, 'utf8');

```

**第 29–68 行**

```javascript
  }).join('');
  const chips = (field, values) => `<div data-xds-chips>${values.map(value => `<button type="button" data-xds-fill="${field}" data-xds-value="${attr(value)}" aria-pressed="false">${attr(value)}</button>`).join('')}</div>`;
  const field = (name, label, placeholder, max, extra = '') => `<div data-xds-field-box><label data-xds-field-label for="${instanceId}-${name}">${label}</label><input type="text" id="${instanceId}-${name}" name="${name}" data-xds-field="${name}" class="xds-input" placeholder="${attr(placeholder)}" maxlength="${max}" ${extra}></div>`;
  const template = `<style>${MENU_CSS}</style><div class="xds-menu-wrapper" data-xds-menu>
    <input type="radio" class="xds-page-radio" data-xds-page="flower" id="${instanceId}-page-flower" name="${instanceId}-page" checked aria-label="太微百花谱">
    <input type="radio" class="xds-page-radio" data-xds-page="custom" id="${instanceId}-page-custom" name="${instanceId}-page" aria-label="自设问道书卷">
    <div class="xds-view-flower" data-xds-view="flower">
      <header data-xds-heading><div data-xds-eyebrow>揽 芳 卷</div><h2>太微百花谱</h2><p>雾隐仙姿 · 纹章辨器 · 一卷定命途</p></header>
      <div class="xds-flower-carousel" data-xds-carousel tabindex="0" role="region" aria-label="仙姝名录，左右翻阅">${cards}</div>
      <div data-xds-carousel-nav><button type="button" data-xds-carousel-step="-1" aria-label="向左翻阅">‹</button><span>左右翻阅仙姝名录 · 四阶纹章为图鉴预览</span><button type="button" data-xds-carousel-step="1" aria-label="向右翻阅">›</button></div>
      <div data-xds-section-title>择一命途 · 入太微红尘</div>
      <div data-xds-identity-grid>
        <button type="button" class="xds-mbtn" data-xds-entry data-xds-identity="赵无忧"><b>赵无忧</b><small>墨山道六弟子 · 原作主角</small></button>
        <details data-xds-lords><summary data-xds-entry><b>四大殿主 <span aria-hidden="true">⌄</span></b><small>残阳 · 肉山 · 九皇子 · 病相思</small></summary><div data-xds-lord-list><button type="button" data-xds-identity="焚欲殿主">焚欲殿主 · 残阳老怪</button><button type="button" data-xds-identity="欢喜殿主">欢喜殿主 · 肉山佛</button><button type="button" data-xds-identity="浊龙殿主">浊龙殿主 · 九皇子</button><button type="button" data-xds-identity="魂欢殿主">魂欢殿主 · 病相思</button></div></details>
        <label for="${instanceId}-page-custom" class="xds-mbtn" data-xds-entry data-xds-open-custom role="button" tabindex="0"><b>自设命途</b><small>问道问心 · 提笔亲定来历与机缘</small></label>
      </div><p data-xds-status role="status" aria-live="polite"></p>
    </div>
    <div class="xds-view-custom" data-xds-view="custom"><div class="xds-custom-scroll" data-xds-custom-form>
      <label for="${instanceId}-page-flower" data-xds-back role="button" tabindex="0">‹ 返回百花谱</label>
      <header data-xds-heading><div data-xds-eyebrow>自 设 · 问 道 问 心 简</div><h2>提笔定命 · 启卷入世</h2><p>道号、根骨与来处，皆由道友亲书。</p></header>
      <div data-xds-fields>
        ${field('custom_name', '道号尊名', '留空使用当前 Persona 名', 64, 'autocomplete="off"')}
        ${field('custom_gender', '根骨性别', '如：男 / 女 / 自定', 16, 'value="男" autocomplete="off"')}
        ${field('custom_age', '寿数年岁', '如：弱冠之年（20）', 32, 'autocomplete="off"')}
        <div data-xds-field-box><label data-xds-field-label for="${instanceId}-custom_cultivation">境界修为</label><input type="text" class="xds-input" id="${instanceId}-custom_cultivation" name="custom_cultivation" data-xds-field="custom_cultivation" placeholder="如：练气圆满、筑基初期" maxlength="96">${chips('custom_cultivation', ['练气圆满', '筑基初期', '筑基大圆满', '金丹大修'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_sect">入世身份</label><input type="text" class="xds-input" id="${instanceId}-custom_sect" name="custom_sect" data-xds-field="custom_sect" placeholder="宗门、行当或来历，随心填写" maxlength="128">${chips('custom_sect', ['大荒散修', '天枢剑宗弃徒', '墨山道外门散人', '天音阁弄琴客', '欢喜魔门谍客'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_timepoint">当前时点</label><input type="text" class="xds-input" id="${instanceId}-custom_timepoint" name="custom_timepoint" data-xds-field="custom_timepoint" placeholder="留空默认第一章（墨山探幽 · 仙盟历 1578 年 · 三月初三），可自定年月日，如「仙盟历 1579 年 · 六月初七」" maxlength="64">${chips('custom_timepoint', ['正章之前 · 仙盟历 1577 年 · 七月初一', '暗流微澜 · 仙盟历 1577 年 · 十二月初一', '第一章（墨山探幽）· 仙盟历 1578 年 · 三月初三', '南域大劫 · 仙盟历 1578 年 · 八月初一', '天溪兽潮 · 仙盟历 1579 年 · 一月初一', '天溪城破 · 仙盟历 1579 年 · 三月初一', '乱世割据 · 仙盟历 1579 年 · 六月初一', '极乐定局 · 仙盟历 1580 年 · 一月初一'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_origin">获取《极乐引》的机缘方式</label><textarea class="xds-textarea" data-xds-field="custom_origin" id="${instanceId}-custom_origin" name="custom_origin" rows="4" maxlength="1800" placeholder="捡得、窃取、夺来、师门密传……写下独属于你的机缘。"></textarea><p data-xds-help>留空采用默认来历；提交会先切换为自设，再将设定发送至当前会话。</p></div>
      </div><button type="button" class="xds-submit-seal" data-xds-action="submit-custom">提笔落款 · 启卷入世</button><p data-xds-status role="status" aria-live="polite"></p>
    </div></div>
  </div>`;
  // 消息 HTML 按一行输出，避免 Showdown 把缩进识别成代码块或插入额外 <br>。
  return template.replace(/\/\*[\s\S]*?\*\//g, '').replace(/>\s+</g, '><').replace(/[\r\n]+\s*/g, ' ').trim();
}

const MENU_HTML = buildMenuHtml();
module.exports = { MENU_HTML, MENU_CSS, FLOWER_ROSTER, buildMenuHtml };

if (require.main === module) fs.writeFileSync(path.join(__dirname, 'MENU_HTML.html'), MENU_HTML, 'utf8');

```

**第 30–68 行**

```javascript
  const chips = (field, values) => `<div data-xds-chips>${values.map(value => `<button type="button" data-xds-fill="${field}" data-xds-value="${attr(value)}" aria-pressed="false">${attr(value)}</button>`).join('')}</div>`;
  const field = (name, label, placeholder, max, extra = '') => `<div data-xds-field-box><label data-xds-field-label for="${instanceId}-${name}">${label}</label><input type="text" id="${instanceId}-${name}" name="${name}" data-xds-field="${name}" class="xds-input" placeholder="${attr(placeholder)}" maxlength="${max}" ${extra}></div>`;
  const template = `<style>${MENU_CSS}</style><div class="xds-menu-wrapper" data-xds-menu>
    <input type="radio" class="xds-page-radio" data-xds-page="flower" id="${instanceId}-page-flower" name="${instanceId}-page" checked aria-label="太微百花谱">
    <input type="radio" class="xds-page-radio" data-xds-page="custom" id="${instanceId}-page-custom" name="${instanceId}-page" aria-label="自设问道书卷">
    <div class="xds-view-flower" data-xds-view="flower">
      <header data-xds-heading><div data-xds-eyebrow>揽 芳 卷</div><h2>太微百花谱</h2><p>雾隐仙姿 · 纹章辨器 · 一卷定命途</p></header>
      <div class="xds-flower-carousel" data-xds-carousel tabindex="0" role="region" aria-label="仙姝名录，左右翻阅">${cards}</div>
      <div data-xds-carousel-nav><button type="button" data-xds-carousel-step="-1" aria-label="向左翻阅">‹</button><span>左右翻阅仙姝名录 · 四阶纹章为图鉴预览</span><button type="button" data-xds-carousel-step="1" aria-label="向右翻阅">›</button></div>
      <div data-xds-section-title>择一命途 · 入太微红尘</div>
      <div data-xds-identity-grid>
        <button type="button" class="xds-mbtn" data-xds-entry data-xds-identity="赵无忧"><b>赵无忧</b><small>墨山道六弟子 · 原作主角</small></button>
        <details data-xds-lords><summary data-xds-entry><b>四大殿主 <span aria-hidden="true">⌄</span></b><small>残阳 · 肉山 · 九皇子 · 病相思</small></summary><div data-xds-lord-list><button type="button" data-xds-identity="焚欲殿主">焚欲殿主 · 残阳老怪</button><button type="button" data-xds-identity="欢喜殿主">欢喜殿主 · 肉山佛</button><button type="button" data-xds-identity="浊龙殿主">浊龙殿主 · 九皇子</button><button type="button" data-xds-identity="魂欢殿主">魂欢殿主 · 病相思</button></div></details>
        <label for="${instanceId}-page-custom" class="xds-mbtn" data-xds-entry data-xds-open-custom role="button" tabindex="0"><b>自设命途</b><small>问道问心 · 提笔亲定来历与机缘</small></label>
      </div><p data-xds-status role="status" aria-live="polite"></p>
    </div>
    <div class="xds-view-custom" data-xds-view="custom"><div class="xds-custom-scroll" data-xds-custom-form>
      <label for="${instanceId}-page-flower" data-xds-back role="button" tabindex="0">‹ 返回百花谱</label>
      <header data-xds-heading><div data-xds-eyebrow>自 设 · 问 道 问 心 简</div><h2>提笔定命 · 启卷入世</h2><p>道号、根骨与来处，皆由道友亲书。</p></header>
      <div data-xds-fields>
        ${field('custom_name', '道号尊名', '留空使用当前 Persona 名', 64, 'autocomplete="off"')}
        ${field('custom_gender', '根骨性别', '如：男 / 女 / 自定', 16, 'value="男" autocomplete="off"')}
        ${field('custom_age', '寿数年岁', '如：弱冠之年（20）', 32, 'autocomplete="off"')}
        <div data-xds-field-box><label data-xds-field-label for="${instanceId}-custom_cultivation">境界修为</label><input type="text" class="xds-input" id="${instanceId}-custom_cultivation" name="custom_cultivation" data-xds-field="custom_cultivation" placeholder="如：练气圆满、筑基初期" maxlength="96">${chips('custom_cultivation', ['练气圆满', '筑基初期', '筑基大圆满', '金丹大修'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_sect">入世身份</label><input type="text" class="xds-input" id="${instanceId}-custom_sect" name="custom_sect" data-xds-field="custom_sect" placeholder="宗门、行当或来历，随心填写" maxlength="128">${chips('custom_sect', ['大荒散修', '天枢剑宗弃徒', '墨山道外门散人', '天音阁弄琴客', '欢喜魔门谍客'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_timepoint">当前时点</label><input type="text" class="xds-input" id="${instanceId}-custom_timepoint" name="custom_timepoint" data-xds-field="custom_timepoint" placeholder="留空默认第一章（墨山探幽 · 仙盟历 1578 年 · 三月初三），可自定年月日，如「仙盟历 1579 年 · 六月初七」" maxlength="64">${chips('custom_timepoint', ['正章之前 · 仙盟历 1577 年 · 七月初一', '暗流微澜 · 仙盟历 1577 年 · 十二月初一', '第一章（墨山探幽）· 仙盟历 1578 年 · 三月初三', '南域大劫 · 仙盟历 1578 年 · 八月初一', '天溪兽潮 · 仙盟历 1579 年 · 一月初一', '天溪城破 · 仙盟历 1579 年 · 三月初一', '乱世割据 · 仙盟历 1579 年 · 六月初一', '极乐定局 · 仙盟历 1580 年 · 一月初一'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_origin">获取《极乐引》的机缘方式</label><textarea class="xds-textarea" data-xds-field="custom_origin" id="${instanceId}-custom_origin" name="custom_origin" rows="4" maxlength="1800" placeholder="捡得、窃取、夺来、师门密传……写下独属于你的机缘。"></textarea><p data-xds-help>留空采用默认来历；提交会先切换为自设，再将设定发送至当前会话。</p></div>
      </div><button type="button" class="xds-submit-seal" data-xds-action="submit-custom">提笔落款 · 启卷入世</button><p data-xds-status role="status" aria-live="polite"></p>
    </div></div>
  </div>`;
  // 消息 HTML 按一行输出，避免 Showdown 把缩进识别成代码块或插入额外 <br>。
  return template.replace(/\/\*[\s\S]*?\*\//g, '').replace(/>\s+</g, '><').replace(/[\r\n]+\s*/g, ' ').trim();
}

const MENU_HTML = buildMenuHtml();
module.exports = { MENU_HTML, MENU_CSS, FLOWER_ROSTER, buildMenuHtml };

if (require.main === module) fs.writeFileSync(path.join(__dirname, 'MENU_HTML.html'), MENU_HTML, 'utf8');

```

**第 31–68 行**

```javascript
  const field = (name, label, placeholder, max, extra = '') => `<div data-xds-field-box><label data-xds-field-label for="${instanceId}-${name}">${label}</label><input type="text" id="${instanceId}-${name}" name="${name}" data-xds-field="${name}" class="xds-input" placeholder="${attr(placeholder)}" maxlength="${max}" ${extra}></div>`;
  const template = `<style>${MENU_CSS}</style><div class="xds-menu-wrapper" data-xds-menu>
    <input type="radio" class="xds-page-radio" data-xds-page="flower" id="${instanceId}-page-flower" name="${instanceId}-page" checked aria-label="太微百花谱">
    <input type="radio" class="xds-page-radio" data-xds-page="custom" id="${instanceId}-page-custom" name="${instanceId}-page" aria-label="自设问道书卷">
    <div class="xds-view-flower" data-xds-view="flower">
      <header data-xds-heading><div data-xds-eyebrow>揽 芳 卷</div><h2>太微百花谱</h2><p>雾隐仙姿 · 纹章辨器 · 一卷定命途</p></header>
      <div class="xds-flower-carousel" data-xds-carousel tabindex="0" role="region" aria-label="仙姝名录，左右翻阅">${cards}</div>
      <div data-xds-carousel-nav><button type="button" data-xds-carousel-step="-1" aria-label="向左翻阅">‹</button><span>左右翻阅仙姝名录 · 四阶纹章为图鉴预览</span><button type="button" data-xds-carousel-step="1" aria-label="向右翻阅">›</button></div>
      <div data-xds-section-title>择一命途 · 入太微红尘</div>
      <div data-xds-identity-grid>
        <button type="button" class="xds-mbtn" data-xds-entry data-xds-identity="赵无忧"><b>赵无忧</b><small>墨山道六弟子 · 原作主角</small></button>
        <details data-xds-lords><summary data-xds-entry><b>四大殿主 <span aria-hidden="true">⌄</span></b><small>残阳 · 肉山 · 九皇子 · 病相思</small></summary><div data-xds-lord-list><button type="button" data-xds-identity="焚欲殿主">焚欲殿主 · 残阳老怪</button><button type="button" data-xds-identity="欢喜殿主">欢喜殿主 · 肉山佛</button><button type="button" data-xds-identity="浊龙殿主">浊龙殿主 · 九皇子</button><button type="button" data-xds-identity="魂欢殿主">魂欢殿主 · 病相思</button></div></details>
        <label for="${instanceId}-page-custom" class="xds-mbtn" data-xds-entry data-xds-open-custom role="button" tabindex="0"><b>自设命途</b><small>问道问心 · 提笔亲定来历与机缘</small></label>
      </div><p data-xds-status role="status" aria-live="polite"></p>
    </div>
    <div class="xds-view-custom" data-xds-view="custom"><div class="xds-custom-scroll" data-xds-custom-form>
      <label for="${instanceId}-page-flower" data-xds-back role="button" tabindex="0">‹ 返回百花谱</label>
      <header data-xds-heading><div data-xds-eyebrow>自 设 · 问 道 问 心 简</div><h2>提笔定命 · 启卷入世</h2><p>道号、根骨与来处，皆由道友亲书。</p></header>
      <div data-xds-fields>
        ${field('custom_name', '道号尊名', '留空使用当前 Persona 名', 64, 'autocomplete="off"')}
        ${field('custom_gender', '根骨性别', '如：男 / 女 / 自定', 16, 'value="男" autocomplete="off"')}
        ${field('custom_age', '寿数年岁', '如：弱冠之年（20）', 32, 'autocomplete="off"')}
        <div data-xds-field-box><label data-xds-field-label for="${instanceId}-custom_cultivation">境界修为</label><input type="text" class="xds-input" id="${instanceId}-custom_cultivation" name="custom_cultivation" data-xds-field="custom_cultivation" placeholder="如：练气圆满、筑基初期" maxlength="96">${chips('custom_cultivation', ['练气圆满', '筑基初期', '筑基大圆满', '金丹大修'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_sect">入世身份</label><input type="text" class="xds-input" id="${instanceId}-custom_sect" name="custom_sect" data-xds-field="custom_sect" placeholder="宗门、行当或来历，随心填写" maxlength="128">${chips('custom_sect', ['大荒散修', '天枢剑宗弃徒', '墨山道外门散人', '天音阁弄琴客', '欢喜魔门谍客'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_timepoint">当前时点</label><input type="text" class="xds-input" id="${instanceId}-custom_timepoint" name="custom_timepoint" data-xds-field="custom_timepoint" placeholder="留空默认第一章（墨山探幽 · 仙盟历 1578 年 · 三月初三），可自定年月日，如「仙盟历 1579 年 · 六月初七」" maxlength="64">${chips('custom_timepoint', ['正章之前 · 仙盟历 1577 年 · 七月初一', '暗流微澜 · 仙盟历 1577 年 · 十二月初一', '第一章（墨山探幽）· 仙盟历 1578 年 · 三月初三', '南域大劫 · 仙盟历 1578 年 · 八月初一', '天溪兽潮 · 仙盟历 1579 年 · 一月初一', '天溪城破 · 仙盟历 1579 年 · 三月初一', '乱世割据 · 仙盟历 1579 年 · 六月初一', '极乐定局 · 仙盟历 1580 年 · 一月初一'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_origin">获取《极乐引》的机缘方式</label><textarea class="xds-textarea" data-xds-field="custom_origin" id="${instanceId}-custom_origin" name="custom_origin" rows="4" maxlength="1800" placeholder="捡得、窃取、夺来、师门密传……写下独属于你的机缘。"></textarea><p data-xds-help>留空采用默认来历；提交会先切换为自设，再将设定发送至当前会话。</p></div>
      </div><button type="button" class="xds-submit-seal" data-xds-action="submit-custom">提笔落款 · 启卷入世</button><p data-xds-status role="status" aria-live="polite"></p>
    </div></div>
  </div>`;
  // 消息 HTML 按一行输出，避免 Showdown 把缩进识别成代码块或插入额外 <br>。
  return template.replace(/\/\*[\s\S]*?\*\//g, '').replace(/>\s+</g, '><').replace(/[\r\n]+\s*/g, ' ').trim();
}

const MENU_HTML = buildMenuHtml();
module.exports = { MENU_HTML, MENU_CSS, FLOWER_ROSTER, buildMenuHtml };

if (require.main === module) fs.writeFileSync(path.join(__dirname, 'MENU_HTML.html'), MENU_HTML, 'utf8');

```

**第 32–68 行**

```javascript
  const template = `<style>${MENU_CSS}</style><div class="xds-menu-wrapper" data-xds-menu>
    <input type="radio" class="xds-page-radio" data-xds-page="flower" id="${instanceId}-page-flower" name="${instanceId}-page" checked aria-label="太微百花谱">
    <input type="radio" class="xds-page-radio" data-xds-page="custom" id="${instanceId}-page-custom" name="${instanceId}-page" aria-label="自设问道书卷">
    <div class="xds-view-flower" data-xds-view="flower">
      <header data-xds-heading><div data-xds-eyebrow>揽 芳 卷</div><h2>太微百花谱</h2><p>雾隐仙姿 · 纹章辨器 · 一卷定命途</p></header>
      <div class="xds-flower-carousel" data-xds-carousel tabindex="0" role="region" aria-label="仙姝名录，左右翻阅">${cards}</div>
      <div data-xds-carousel-nav><button type="button" data-xds-carousel-step="-1" aria-label="向左翻阅">‹</button><span>左右翻阅仙姝名录 · 四阶纹章为图鉴预览</span><button type="button" data-xds-carousel-step="1" aria-label="向右翻阅">›</button></div>
      <div data-xds-section-title>择一命途 · 入太微红尘</div>
      <div data-xds-identity-grid>
        <button type="button" class="xds-mbtn" data-xds-entry data-xds-identity="赵无忧"><b>赵无忧</b><small>墨山道六弟子 · 原作主角</small></button>
        <details data-xds-lords><summary data-xds-entry><b>四大殿主 <span aria-hidden="true">⌄</span></b><small>残阳 · 肉山 · 九皇子 · 病相思</small></summary><div data-xds-lord-list><button type="button" data-xds-identity="焚欲殿主">焚欲殿主 · 残阳老怪</button><button type="button" data-xds-identity="欢喜殿主">欢喜殿主 · 肉山佛</button><button type="button" data-xds-identity="浊龙殿主">浊龙殿主 · 九皇子</button><button type="button" data-xds-identity="魂欢殿主">魂欢殿主 · 病相思</button></div></details>
        <label for="${instanceId}-page-custom" class="xds-mbtn" data-xds-entry data-xds-open-custom role="button" tabindex="0"><b>自设命途</b><small>问道问心 · 提笔亲定来历与机缘</small></label>
      </div><p data-xds-status role="status" aria-live="polite"></p>
    </div>
    <div class="xds-view-custom" data-xds-view="custom"><div class="xds-custom-scroll" data-xds-custom-form>
      <label for="${instanceId}-page-flower" data-xds-back role="button" tabindex="0">‹ 返回百花谱</label>
      <header data-xds-heading><div data-xds-eyebrow>自 设 · 问 道 问 心 简</div><h2>提笔定命 · 启卷入世</h2><p>道号、根骨与来处，皆由道友亲书。</p></header>
      <div data-xds-fields>
        ${field('custom_name', '道号尊名', '留空使用当前 Persona 名', 64, 'autocomplete="off"')}
        ${field('custom_gender', '根骨性别', '如：男 / 女 / 自定', 16, 'value="男" autocomplete="off"')}
        ${field('custom_age', '寿数年岁', '如：弱冠之年（20）', 32, 'autocomplete="off"')}
        <div data-xds-field-box><label data-xds-field-label for="${instanceId}-custom_cultivation">境界修为</label><input type="text" class="xds-input" id="${instanceId}-custom_cultivation" name="custom_cultivation" data-xds-field="custom_cultivation" placeholder="如：练气圆满、筑基初期" maxlength="96">${chips('custom_cultivation', ['练气圆满', '筑基初期', '筑基大圆满', '金丹大修'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_sect">入世身份</label><input type="text" class="xds-input" id="${instanceId}-custom_sect" name="custom_sect" data-xds-field="custom_sect" placeholder="宗门、行当或来历，随心填写" maxlength="128">${chips('custom_sect', ['大荒散修', '天枢剑宗弃徒', '墨山道外门散人', '天音阁弄琴客', '欢喜魔门谍客'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_timepoint">当前时点</label><input type="text" class="xds-input" id="${instanceId}-custom_timepoint" name="custom_timepoint" data-xds-field="custom_timepoint" placeholder="留空默认第一章（墨山探幽 · 仙盟历 1578 年 · 三月初三），可自定年月日，如「仙盟历 1579 年 · 六月初七」" maxlength="64">${chips('custom_timepoint', ['正章之前 · 仙盟历 1577 年 · 七月初一', '暗流微澜 · 仙盟历 1577 年 · 十二月初一', '第一章（墨山探幽）· 仙盟历 1578 年 · 三月初三', '南域大劫 · 仙盟历 1578 年 · 八月初一', '天溪兽潮 · 仙盟历 1579 年 · 一月初一', '天溪城破 · 仙盟历 1579 年 · 三月初一', '乱世割据 · 仙盟历 1579 年 · 六月初一', '极乐定局 · 仙盟历 1580 年 · 一月初一'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_origin">获取《极乐引》的机缘方式</label><textarea class="xds-textarea" data-xds-field="custom_origin" id="${instanceId}-custom_origin" name="custom_origin" rows="4" maxlength="1800" placeholder="捡得、窃取、夺来、师门密传……写下独属于你的机缘。"></textarea><p data-xds-help>留空采用默认来历；提交会先切换为自设，再将设定发送至当前会话。</p></div>
      </div><button type="button" class="xds-submit-seal" data-xds-action="submit-custom">提笔落款 · 启卷入世</button><p data-xds-status role="status" aria-live="polite"></p>
    </div></div>
  </div>`;
  // 消息 HTML 按一行输出，避免 Showdown 把缩进识别成代码块或插入额外 <br>。
  return template.replace(/\/\*[\s\S]*?\*\//g, '').replace(/>\s+</g, '><').replace(/[\r\n]+\s*/g, ' ').trim();
}

const MENU_HTML = buildMenuHtml();
module.exports = { MENU_HTML, MENU_CSS, FLOWER_ROSTER, buildMenuHtml };

if (require.main === module) fs.writeFileSync(path.join(__dirname, 'MENU_HTML.html'), MENU_HTML, 'utf8');

```

### `src/first_floor_rebuild/state_machine_first_floor.js`：命中 75 行

命中行号：2198、2209、2211、2217、2218、2226、2234、2240、2241、2249、2250、2254、2259、2264、2269、2280、2289、2290、2306、2322、2336、2338、2361、2367、2368、2382、2383、2385、2387、2392、2397、2400、2405、2406、2410、2412、2417、2420、2425、2439、2443、2444、2449、2450、2452、2457、2460、2463、2466、2471、2474、2478、2483、2486、2487、2492、2511、2512、2553、2554 …

**第 2173–2223 行**

```javascript
  try {
    if (API.setChatMessages && API.getChatMessages) {
      const first = API.getChatMessages(0, { include_swipes: true })[0];
      const swipes = (first && first.swipes) || [];
      const re = new RegExp('<IdentityPick\\s+name\\s*=\\s*"' + name + '"');
      idx = swipes.findIndex((s) => re.test(String(s)) && !String(s).includes('<IdentityMenu/>'));
      if (idx >= 0) {
        await API.setChatMessages([{ message_id: 0, swipe_id: idx }], { refresh: 'affected' });
        console.log(TAG, `[身份] 第 0 楼已切到 swipe #${idx}（${name}），共 ${swipes.length} 条`);
      } else {
        console.warn(TAG, `[身份] 第 0 楼的 ${swipes.length} 条开场白里没有「${name}」的标记 —— 只写了变量，请手动滑到那一楼`);
      }
    } else {
      console.warn(TAG, '[身份] 没有 setChatMessages／getChatMessages —— 需要酒馆助手（JS-Slash-Runner）');
    }
  } catch (e) { console.warn(TAG, '[身份] 切开场白失败：', msgOf(e)); }

  if (!options.quiet) {
    const detail = r.entries && r.entries.wb ? `（世界书已同步：开启「${name}」与对应剧情）` : '';
    toast('info', `身份：${name}${detail}${idx >= 0 ? '' : '（请手动滑到对应开场白）'}`, 6000);
  }
  return idx;
}

/* 首楼交互扩展：仅放在酒馆助手状态机，不放入消息 HTML。 */
function xdsMenuHost() {
  let host = window;
  for (;;) {
    try {
      if (!host.parent || host.parent === host || !host.parent.document) break;
      host = host.parent;
    } catch (error) { break; }
  }
  return host;
}

function xdsMenuContext() {
  try {
    const host = xdsMenuHost();
    if (host.SillyTavern && typeof host.SillyTavern.getContext === 'function') return host.SillyTavern.getContext();
  } catch (error) { /* 继续回退 */ }
  try { return API.getContext ? API.getContext() : null; } catch (error) { return null; }
}

function xdsMenuChatKey() {
  const ctx = xdsMenuContext();
  if (!ctx) return null;
  let chatId = ctx.chatId;
  try { if (typeof ctx.getCurrentChatId === 'function') chatId = ctx.getCurrentChatId(); } catch (error) { /* 用 chatId */ }
  if (chatId === null || chatId === undefined) return null;
  return String(ctx.characterId ?? '') + '\u001f' + String(ctx.groupId ?? '') + '\u001f' + String(chatId);
```

**第 2184–2234 行**

```javascript
      }
    } else {
      console.warn(TAG, '[身份] 没有 setChatMessages／getChatMessages —— 需要酒馆助手（JS-Slash-Runner）');
    }
  } catch (e) { console.warn(TAG, '[身份] 切开场白失败：', msgOf(e)); }

  if (!options.quiet) {
    const detail = r.entries && r.entries.wb ? `（世界书已同步：开启「${name}」与对应剧情）` : '';
    toast('info', `身份：${name}${detail}${idx >= 0 ? '' : '（请手动滑到对应开场白）'}`, 6000);
  }
  return idx;
}

/* 首楼交互扩展：仅放在酒馆助手状态机，不放入消息 HTML。 */
function xdsMenuHost() {
  let host = window;
  for (;;) {
    try {
      if (!host.parent || host.parent === host || !host.parent.document) break;
      host = host.parent;
    } catch (error) { break; }
  }
  return host;
}

function xdsMenuContext() {
  try {
    const host = xdsMenuHost();
    if (host.SillyTavern && typeof host.SillyTavern.getContext === 'function') return host.SillyTavern.getContext();
  } catch (error) { /* 继续回退 */ }
  try { return API.getContext ? API.getContext() : null; } catch (error) { return null; }
}

function xdsMenuChatKey() {
  const ctx = xdsMenuContext();
  if (!ctx) return null;
  let chatId = ctx.chatId;
  try { if (typeof ctx.getCurrentChatId === 'function') chatId = ctx.getCurrentChatId(); } catch (error) { /* 用 chatId */ }
  if (chatId === null || chatId === undefined) return null;
  return String(ctx.characterId ?? '') + '\u001f' + String(ctx.groupId ?? '') + '\u001f' + String(chatId);
}

function xdsMenuSetValue(input, value) {
  const view = input.ownerDocument.defaultView;
  const proto = input.tagName === 'TEXTAREA' ? view.HTMLTextAreaElement.prototype : view.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  setter.call(input, value);
  input.dispatchEvent(new view.Event('input', { bubbles: true }));
}

function xdsMenuVisible(el) {
```

**第 2186–2236 行**

```javascript
      console.warn(TAG, '[身份] 没有 setChatMessages／getChatMessages —— 需要酒馆助手（JS-Slash-Runner）');
    }
  } catch (e) { console.warn(TAG, '[身份] 切开场白失败：', msgOf(e)); }

  if (!options.quiet) {
    const detail = r.entries && r.entries.wb ? `（世界书已同步：开启「${name}」与对应剧情）` : '';
    toast('info', `身份：${name}${detail}${idx >= 0 ? '' : '（请手动滑到对应开场白）'}`, 6000);
  }
  return idx;
}

/* 首楼交互扩展：仅放在酒馆助手状态机，不放入消息 HTML。 */
function xdsMenuHost() {
  let host = window;
  for (;;) {
    try {
      if (!host.parent || host.parent === host || !host.parent.document) break;
      host = host.parent;
    } catch (error) { break; }
  }
  return host;
}

function xdsMenuContext() {
  try {
    const host = xdsMenuHost();
    if (host.SillyTavern && typeof host.SillyTavern.getContext === 'function') return host.SillyTavern.getContext();
  } catch (error) { /* 继续回退 */ }
  try { return API.getContext ? API.getContext() : null; } catch (error) { return null; }
}

function xdsMenuChatKey() {
  const ctx = xdsMenuContext();
  if (!ctx) return null;
  let chatId = ctx.chatId;
  try { if (typeof ctx.getCurrentChatId === 'function') chatId = ctx.getCurrentChatId(); } catch (error) { /* 用 chatId */ }
  if (chatId === null || chatId === undefined) return null;
  return String(ctx.characterId ?? '') + '\u001f' + String(ctx.groupId ?? '') + '\u001f' + String(chatId);
}

function xdsMenuSetValue(input, value) {
  const view = input.ownerDocument.defaultView;
  const proto = input.tagName === 'TEXTAREA' ? view.HTMLTextAreaElement.prototype : view.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  setter.call(input, value);
  input.dispatchEvent(new view.Event('input', { bubbles: true }));
}

function xdsMenuVisible(el) {
  if (!el || !el.isConnected || el.hidden) return false;
  const style = el.ownerDocument.defaultView.getComputedStyle(el);
```

**第 2192–2242 行**

```javascript
    toast('info', `身份：${name}${detail}${idx >= 0 ? '' : '（请手动滑到对应开场白）'}`, 6000);
  }
  return idx;
}

/* 首楼交互扩展：仅放在酒馆助手状态机，不放入消息 HTML。 */
function xdsMenuHost() {
  let host = window;
  for (;;) {
    try {
      if (!host.parent || host.parent === host || !host.parent.document) break;
      host = host.parent;
    } catch (error) { break; }
  }
  return host;
}

function xdsMenuContext() {
  try {
    const host = xdsMenuHost();
    if (host.SillyTavern && typeof host.SillyTavern.getContext === 'function') return host.SillyTavern.getContext();
  } catch (error) { /* 继续回退 */ }
  try { return API.getContext ? API.getContext() : null; } catch (error) { return null; }
}

function xdsMenuChatKey() {
  const ctx = xdsMenuContext();
  if (!ctx) return null;
  let chatId = ctx.chatId;
  try { if (typeof ctx.getCurrentChatId === 'function') chatId = ctx.getCurrentChatId(); } catch (error) { /* 用 chatId */ }
  if (chatId === null || chatId === undefined) return null;
  return String(ctx.characterId ?? '') + '\u001f' + String(ctx.groupId ?? '') + '\u001f' + String(chatId);
}

function xdsMenuSetValue(input, value) {
  const view = input.ownerDocument.defaultView;
  const proto = input.tagName === 'TEXTAREA' ? view.HTMLTextAreaElement.prototype : view.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  setter.call(input, value);
  input.dispatchEvent(new view.Event('input', { bubbles: true }));
}

function xdsMenuVisible(el) {
  if (!el || !el.isConnected || el.hidden) return false;
  const style = el.ownerDocument.defaultView.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0;
}

function xdsMenuComposer() {
  const doc = xdsMenuHost().document;
  const input = doc.querySelector('#send_textarea');
```

**第 2193–2243 行**

```javascript
  }
  return idx;
}

/* 首楼交互扩展：仅放在酒馆助手状态机，不放入消息 HTML。 */
function xdsMenuHost() {
  let host = window;
  for (;;) {
    try {
      if (!host.parent || host.parent === host || !host.parent.document) break;
      host = host.parent;
    } catch (error) { break; }
  }
  return host;
}

function xdsMenuContext() {
  try {
    const host = xdsMenuHost();
    if (host.SillyTavern && typeof host.SillyTavern.getContext === 'function') return host.SillyTavern.getContext();
  } catch (error) { /* 继续回退 */ }
  try { return API.getContext ? API.getContext() : null; } catch (error) { return null; }
}

function xdsMenuChatKey() {
  const ctx = xdsMenuContext();
  if (!ctx) return null;
  let chatId = ctx.chatId;
  try { if (typeof ctx.getCurrentChatId === 'function') chatId = ctx.getCurrentChatId(); } catch (error) { /* 用 chatId */ }
  if (chatId === null || chatId === undefined) return null;
  return String(ctx.characterId ?? '') + '\u001f' + String(ctx.groupId ?? '') + '\u001f' + String(chatId);
}

function xdsMenuSetValue(input, value) {
  const view = input.ownerDocument.defaultView;
  const proto = input.tagName === 'TEXTAREA' ? view.HTMLTextAreaElement.prototype : view.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  setter.call(input, value);
  input.dispatchEvent(new view.Event('input', { bubbles: true }));
}

function xdsMenuVisible(el) {
  if (!el || !el.isConnected || el.hidden) return false;
  const style = el.ownerDocument.defaultView.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0;
}

function xdsMenuComposer() {
  const doc = xdsMenuHost().document;
  const input = doc.querySelector('#send_textarea');
  const send = doc.querySelector('#send_but');
```

**第 2201–2251 行**

```javascript
    try {
      if (!host.parent || host.parent === host || !host.parent.document) break;
      host = host.parent;
    } catch (error) { break; }
  }
  return host;
}

function xdsMenuContext() {
  try {
    const host = xdsMenuHost();
    if (host.SillyTavern && typeof host.SillyTavern.getContext === 'function') return host.SillyTavern.getContext();
  } catch (error) { /* 继续回退 */ }
  try { return API.getContext ? API.getContext() : null; } catch (error) { return null; }
}

function xdsMenuChatKey() {
  const ctx = xdsMenuContext();
  if (!ctx) return null;
  let chatId = ctx.chatId;
  try { if (typeof ctx.getCurrentChatId === 'function') chatId = ctx.getCurrentChatId(); } catch (error) { /* 用 chatId */ }
  if (chatId === null || chatId === undefined) return null;
  return String(ctx.characterId ?? '') + '\u001f' + String(ctx.groupId ?? '') + '\u001f' + String(chatId);
}

function xdsMenuSetValue(input, value) {
  const view = input.ownerDocument.defaultView;
  const proto = input.tagName === 'TEXTAREA' ? view.HTMLTextAreaElement.prototype : view.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  setter.call(input, value);
  input.dispatchEvent(new view.Event('input', { bubbles: true }));
}

function xdsMenuVisible(el) {
  if (!el || !el.isConnected || el.hidden) return false;
  const style = el.ownerDocument.defaultView.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0;
}

function xdsMenuComposer() {
  const doc = xdsMenuHost().document;
  const input = doc.querySelector('#send_textarea');
  const send = doc.querySelector('#send_but');
  if (!input || !send) throw new Error('未找到酒馆输入框或发送按钮，请确认已进入聊天页面。');
  if (input.disabled || input.readOnly) throw new Error('酒馆输入框暂不可用，请稍后落款。');
  return { doc, input, send };
}

function xdsMenuCanSend(composer, allowEmpty = false) {
  const ctx = xdsMenuContext();
  if (ctx && ctx.onlineStatus === 'no_connection') return false;
```

**第 2209–2259 行**

```javascript
function xdsMenuContext() {
  try {
    const host = xdsMenuHost();
    if (host.SillyTavern && typeof host.SillyTavern.getContext === 'function') return host.SillyTavern.getContext();
  } catch (error) { /* 继续回退 */ }
  try { return API.getContext ? API.getContext() : null; } catch (error) { return null; }
}

function xdsMenuChatKey() {
  const ctx = xdsMenuContext();
  if (!ctx) return null;
  let chatId = ctx.chatId;
  try { if (typeof ctx.getCurrentChatId === 'function') chatId = ctx.getCurrentChatId(); } catch (error) { /* 用 chatId */ }
  if (chatId === null || chatId === undefined) return null;
  return String(ctx.characterId ?? '') + '\u001f' + String(ctx.groupId ?? '') + '\u001f' + String(chatId);
}

function xdsMenuSetValue(input, value) {
  const view = input.ownerDocument.defaultView;
  const proto = input.tagName === 'TEXTAREA' ? view.HTMLTextAreaElement.prototype : view.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  setter.call(input, value);
  input.dispatchEvent(new view.Event('input', { bubbles: true }));
}

function xdsMenuVisible(el) {
  if (!el || !el.isConnected || el.hidden) return false;
  const style = el.ownerDocument.defaultView.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0;
}

function xdsMenuComposer() {
  const doc = xdsMenuHost().document;
  const input = doc.querySelector('#send_textarea');
  const send = doc.querySelector('#send_but');
  if (!input || !send) throw new Error('未找到酒馆输入框或发送按钮，请确认已进入聊天页面。');
  if (input.disabled || input.readOnly) throw new Error('酒馆输入框暂不可用，请稍后落款。');
  return { doc, input, send };
}

function xdsMenuCanSend(composer, allowEmpty = false) {
  const ctx = xdsMenuContext();
  if (ctx && ctx.onlineStatus === 'no_connection') return false;
  const stop = composer.doc.querySelector('#mes_stop');
  const empty = allowEmpty && !composer.input.value.trim();
  return !xdsMenuVisible(stop) && xdsMenuVisible(composer.send) && (empty || !composer.send.disabled) &&
    (empty || composer.send.getAttribute('aria-disabled') !== 'true') &&
    composer.doc.defaultView.getComputedStyle(composer.send).pointerEvents !== 'none';
}

function xdsMenuIntro(form) {
```

**第 2215–2265 行**

```javascript
}

function xdsMenuChatKey() {
  const ctx = xdsMenuContext();
  if (!ctx) return null;
  let chatId = ctx.chatId;
  try { if (typeof ctx.getCurrentChatId === 'function') chatId = ctx.getCurrentChatId(); } catch (error) { /* 用 chatId */ }
  if (chatId === null || chatId === undefined) return null;
  return String(ctx.characterId ?? '') + '\u001f' + String(ctx.groupId ?? '') + '\u001f' + String(chatId);
}

function xdsMenuSetValue(input, value) {
  const view = input.ownerDocument.defaultView;
  const proto = input.tagName === 'TEXTAREA' ? view.HTMLTextAreaElement.prototype : view.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  setter.call(input, value);
  input.dispatchEvent(new view.Event('input', { bubbles: true }));
}

function xdsMenuVisible(el) {
  if (!el || !el.isConnected || el.hidden) return false;
  const style = el.ownerDocument.defaultView.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0;
}

function xdsMenuComposer() {
  const doc = xdsMenuHost().document;
  const input = doc.querySelector('#send_textarea');
  const send = doc.querySelector('#send_but');
  if (!input || !send) throw new Error('未找到酒馆输入框或发送按钮，请确认已进入聊天页面。');
  if (input.disabled || input.readOnly) throw new Error('酒馆输入框暂不可用，请稍后落款。');
  return { doc, input, send };
}

function xdsMenuCanSend(composer, allowEmpty = false) {
  const ctx = xdsMenuContext();
  if (ctx && ctx.onlineStatus === 'no_connection') return false;
  const stop = composer.doc.querySelector('#mes_stop');
  const empty = allowEmpty && !composer.input.value.trim();
  return !xdsMenuVisible(stop) && xdsMenuVisible(composer.send) && (empty || !composer.send.disabled) &&
    (empty || composer.send.getAttribute('aria-disabled') !== 'true') &&
    composer.doc.defaultView.getComputedStyle(composer.send).pointerEvents !== 'none';
}

function xdsMenuIntro(form) {
  const names = ['custom_name', 'custom_gender', 'custom_age', 'custom_cultivation', 'custom_sect', 'custom_origin'];
  const limits = [64, 16, 32, 96, 128, 1800];
  const values = {};
  names.forEach((name, i) => {
    const input = form.querySelector('[data-xds-field="' + name + '"]');
    const value = input ? String(input.value || '').replace(/\r\n?/g, '\n').trim() : '';
```

**第 2216–2266 行**

```javascript

function xdsMenuChatKey() {
  const ctx = xdsMenuContext();
  if (!ctx) return null;
  let chatId = ctx.chatId;
  try { if (typeof ctx.getCurrentChatId === 'function') chatId = ctx.getCurrentChatId(); } catch (error) { /* 用 chatId */ }
  if (chatId === null || chatId === undefined) return null;
  return String(ctx.characterId ?? '') + '\u001f' + String(ctx.groupId ?? '') + '\u001f' + String(chatId);
}

function xdsMenuSetValue(input, value) {
  const view = input.ownerDocument.defaultView;
  const proto = input.tagName === 'TEXTAREA' ? view.HTMLTextAreaElement.prototype : view.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  setter.call(input, value);
  input.dispatchEvent(new view.Event('input', { bubbles: true }));
}

function xdsMenuVisible(el) {
  if (!el || !el.isConnected || el.hidden) return false;
  const style = el.ownerDocument.defaultView.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0;
}

function xdsMenuComposer() {
  const doc = xdsMenuHost().document;
  const input = doc.querySelector('#send_textarea');
  const send = doc.querySelector('#send_but');
  if (!input || !send) throw new Error('未找到酒馆输入框或发送按钮，请确认已进入聊天页面。');
  if (input.disabled || input.readOnly) throw new Error('酒馆输入框暂不可用，请稍后落款。');
  return { doc, input, send };
}

function xdsMenuCanSend(composer, allowEmpty = false) {
  const ctx = xdsMenuContext();
  if (ctx && ctx.onlineStatus === 'no_connection') return false;
  const stop = composer.doc.querySelector('#mes_stop');
  const empty = allowEmpty && !composer.input.value.trim();
  return !xdsMenuVisible(stop) && xdsMenuVisible(composer.send) && (empty || !composer.send.disabled) &&
    (empty || composer.send.getAttribute('aria-disabled') !== 'true') &&
    composer.doc.defaultView.getComputedStyle(composer.send).pointerEvents !== 'none';
}

function xdsMenuIntro(form) {
  const names = ['custom_name', 'custom_gender', 'custom_age', 'custom_cultivation', 'custom_sect', 'custom_origin'];
  const limits = [64, 16, 32, 96, 128, 1800];
  const values = {};
  names.forEach((name, i) => {
    const input = form.querySelector('[data-xds-field="' + name + '"]');
    const value = input ? String(input.value || '').replace(/\r\n?/g, '\n').trim() : '';
    if (value.length > limits[i]) throw new Error('设定文字超过字段长度限制，请适当精简。');
```

**第 2224–2274 行**

```javascript
}

function xdsMenuSetValue(input, value) {
  const view = input.ownerDocument.defaultView;
  const proto = input.tagName === 'TEXTAREA' ? view.HTMLTextAreaElement.prototype : view.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  setter.call(input, value);
  input.dispatchEvent(new view.Event('input', { bubbles: true }));
}

function xdsMenuVisible(el) {
  if (!el || !el.isConnected || el.hidden) return false;
  const style = el.ownerDocument.defaultView.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0;
}

function xdsMenuComposer() {
  const doc = xdsMenuHost().document;
  const input = doc.querySelector('#send_textarea');
  const send = doc.querySelector('#send_but');
  if (!input || !send) throw new Error('未找到酒馆输入框或发送按钮，请确认已进入聊天页面。');
  if (input.disabled || input.readOnly) throw new Error('酒馆输入框暂不可用，请稍后落款。');
  return { doc, input, send };
}

function xdsMenuCanSend(composer, allowEmpty = false) {
  const ctx = xdsMenuContext();
  if (ctx && ctx.onlineStatus === 'no_connection') return false;
  const stop = composer.doc.querySelector('#mes_stop');
  const empty = allowEmpty && !composer.input.value.trim();
  return !xdsMenuVisible(stop) && xdsMenuVisible(composer.send) && (empty || !composer.send.disabled) &&
    (empty || composer.send.getAttribute('aria-disabled') !== 'true') &&
    composer.doc.defaultView.getComputedStyle(composer.send).pointerEvents !== 'none';
}

function xdsMenuIntro(form) {
  const names = ['custom_name', 'custom_gender', 'custom_age', 'custom_cultivation', 'custom_sect', 'custom_origin'];
  const limits = [64, 16, 32, 96, 128, 1800];
  const values = {};
  names.forEach((name, i) => {
    const input = form.querySelector('[data-xds-field="' + name + '"]');
    const value = input ? String(input.value || '').replace(/\r\n?/g, '\n').trim() : '';
    if (value.length > limits[i]) throw new Error('设定文字超过字段长度限制，请适当精简。');
    values[name] = value;
  });
  const ctx = xdsMenuContext();
  const persona = ctx && typeof ctx.name1 === 'string' ? ctx.name1.trim() : '';
  const name = values.custom_name || persona || '无名散修';
  return '【启卷入世 · 自设命途】\n' +
    '• 道号名讳：' + name + '（' + (values.custom_gender || '男') + '，' + (values.custom_age || '成年') + '）\n' +
    '• 境界修为：' + (values.custom_cultivation || '练气圆满') + '\n' +
```

## 三、`identityMenuScript` 完整配置（生产构建件 `_build_card.js`）

**常量定义**：

```javascript
const identityMenuScript = {
  id: '9b2f47c8-6e13-4a05-b7d9-80c4e1f6a25d',
  scriptName: '仙姝墮·身份菜单',
  findRegex: '<IdentityMenu\\s*\\/>',
  replaceString: MENU_HTML,
  trimStrings: [],
  placement: [2],
  disabled: false,
  markdownOnly: true,
  promptOnly: false,
  runOnEdit: true,
  substituteRegex: 0,
  minDepth: null,
  maxDepth: null
}
```

**在 `regex_scripts` 数组里的登记处**：

```javascript
regex_scripts: [
      filterQuickactScript,
      regexScript, interludeScript, hideVarScript, hidePlaceholderScript, hideIdentityPickScript, identityMenuScript, deEuphemismScript, ...stageNormalizeScripts,
      /* ── 2026-09-27 第十三·二轮：照抄外卡《大乾风华录》的三条（参数按它的原文，护栏一起抄）──
       * ① 历史状态栏提示词剔除：它用 minDepth:3 ⇒ **保留最近两楼**（depth 0 ＝ 最新一楼，见 script.js:4118）
       * ② 流式半截隐藏：补上它有的 maxDepth:3
       * ③ 文风净化试点：7 条里语感最稳的一条（瞬间定语），并抄它那条防止误伤状态栏内部的负向护栏 */
      {
        id: 'b41c7f02-9d5e-4a30-8c17-2f6b9e0d3a51',
        scriptName: '仙姝墮·净化历史状态栏（提示词）',
        /* ★ 双轨制（规范 §4【必须】）：与显示层渲染条**共用同一条 findRegex**（逐字相同）。
         * ⚠️ 剔除条的语义是"删掉历史楼里的整块状态栏"，用渲染条那条容错式也正确：
         *    截断的半截块同样应该从历史上下文里剔掉。 */
        findRegex: '<Status_block>(?:(?!<\\/Status_block>)[\\s\\S]
```

## 四、我还没核到、需要你定位置的两处（不猜）

1. `chips()` 的定义体 —— 你提醒得对：**搜不到 `function chips` 不等于它不在生成器里**（可能是箭头函数或 import）。上面第一节是生成器**全文**，请你在里面指认。
2. `data-xds-fill` 的**绑定时机与宿主文档** —— 控制器文件已在第二节，但"何时绑、绑到哪个 document、刷新后如何清理"仍要你按第二节的现有协议给结论。