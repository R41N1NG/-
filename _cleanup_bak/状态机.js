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
  /* ★ 2026-10-07（主人令：「楼层段位是保底，不是拿来干这个的」）——
   *   这 6 个是 `STAGE_FAST_FORWARD`（段 → 跳段锚点表）里**原本不在台账**的名字：
   *   模型写不出来 ⇒ 那几段（段 3／10／11 尤其，它们只有这一个锚点）永远无法靠里程碑跳段，
   *   只能等楼层排到 —— 等于把「保底」当成了唯一的门。现在把它们补进台账，
   *   把「正门」还给里程碑：剧情条目按「正门锚点已真 **或** 段位到点（保底）」放行。
   *   每条 desc 都写清出处（章数取自卡内【剧情】条自己的「时点」行，不另编）。 */
  { kind: 'ai', name: '进入幽寂谷', desc: '第三章 · 幽寂谷秘境：一行**进入幽寂谷**（第 3 段的正门锚点之一）', kws: ['幽寂谷'] },
  { kind: 'ai', name: '玄机子胁迫过叶红缨', desc: '第三章 · 幽寂谷内：玄机子捏着她乳环的把柄胁迫过她（**秘密线**；进账本只表示「发生过」，旁白不得点破）', kws: ['胁迫', '把柄'] },
  { kind: 'ai', name: '兽潮血战', desc: '第七—十一章 · 天溪城头的兽潮血战（与「天溪城兽潮」同段，任一为真即跳第 7 段）', kws: ['兽潮', '血战'] },
  { kind: 'ai', name: '玄机子装伤', desc: '第十一章 · 玄机子装伤脱身（第 8 段底牌：只记「他受伤退走」这个事实，严禁旁白写出「假的」）', kws: ['装伤', '请返宗门'] },
  { kind: 'ai', name: '双姝回归', desc: '第十二末 · 听雪双姝伪装脱险、潜回据点（第 10 段的正门锚点）', kws: ['双姝回归', '潜回'] },
  { kind: 'ai', name: '血染天溪', desc: '第九章 · 叶红缨夜间失控与赵无忧越界那一段演完（该章的**完成**锚点；与「可提前发现的看见乳环」不是一回事）', kws: ['血染天溪', '夜间失控'] },
  { kind: 'ai', name: '天溪城破', desc: '第十三章 · 兽潮总攻、西南城破（第 11 段的正门锚点）', kws: ['城破', '城陷'] },
  { kind: 'ai', name: '孤月定情', desc: '第九章 · **墨山道孤剑崖、出发天溪之前的送别**：她主动封吻、把「冰心泪」亲手戴在他颈上，说「你……一定要平安回来。」（原文无「定情」二字，是卡片给的名）', kws: ['孤月定情', '互诉心意', '彼此说破'] },
  { kind: 'ai', name: '赵无忧坠渊', desc: '第十七—十九章 · 天溪城陷落、赵无忧遭重创坠落（原著后期两处沦陷节点的硬前置）', kws: ['葬魔渊', '坠渊', '坠入深渊', '金丹被击碎'] },
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
  /* ── 名器持有者「处女丧失」锚点（2026-10-06 主人令）──
   * ⚠️ 主人定案：**所有名器成形的条件就是它的持有者被破身**。这 13 个名字是那件事的唯一正经记录，
   *    名器成形由它们（或 `<破处>` 破处簿）推出，模型再单独报「〇〇成形」而不带这两样，脚本一律丢弃。
   * ⚠️ 别名归一（破处／元阴被夺／元阴失守／元阴初破／初夜）见 `DEFLOWER_SYN`。
   * ⚠️ 持有者出处：`src/card_build/_build_card.js` 的 `CARRIERS`（改一处必须改两处）。 */
  { kind: 'ai', name: '孤月处女丧失', desc: '孤月 · 九幽玄阴穴的持有者被破身（元阴初破、龙气贯体的那一刻）', kws: ['孤月处女丧失'] },
  { kind: 'ai', name: '叶红缨处女丧失', desc: '叶红缨 · 灼酒流炎穴的持有者被破身', kws: ['叶红缨处女丧失'] },
  { kind: 'ai', name: '闻观语处女丧失', desc: '闻观语 · 心魔茶璎乳的持有者被破身', kws: ['闻观语处女丧失'] },
  { kind: 'ai', name: '楚灵夜处女丧失', desc: '楚灵夜 · 般若菩提菊的持有者被破身', kws: ['楚灵夜处女丧失'] },
  /* ★ 2026-10-07（主人令）：般若菩提菊除「处女丧失」外，还要这一条既成事实才成形 */
  { kind: 'ai', name: '楚灵夜后窍开发', desc: '楚灵夜 · **后窍（谷道）被开发过**（被肛交／走后门）。与「楚灵夜处女丧失」**同时为真**，般若菩提菊才成形', kws: ['后窍', '谷道', '后门', '肛'] },
  { kind: 'ai', name: '雨霏柔处女丧失', desc: '雨霏柔 · 北冥潮生穴的持有者被破身', kws: ['雨霏柔处女丧失'] },
  { kind: 'ai', name: '苏瑶处女丧失', desc: '苏瑶 · 灵犀同心（姐姐那一侧）被破身；与苏玲两个都丧失，灵犀同心才成形', kws: ['苏瑶处女丧失'] },
  { kind: 'ai', name: '苏玲处女丧失', desc: '苏玲 · 灵犀同心（妹妹那一侧）被破身；与苏瑶两个都丧失，灵犀同心才成形', kws: ['苏玲处女丧失'] },
  { kind: 'ai', name: '云织梦处女丧失', desc: '云织梦 · 玉虎噙香乳的持有者被破身', kws: ['云织梦处女丧失'] },
  { kind: 'ai', name: '花芷凝处女丧失', desc: '花芷凝 · 梅蕊穴的持有者被破身', kws: ['花芷凝处女丧失'] },
  { kind: 'ai', name: '苏倾寒处女丧失', desc: '苏倾寒 · 冰魄剑心穴的持有者被破身', kws: ['苏倾寒处女丧失'] },
  { kind: 'ai', name: '慕容清歌处女丧失', desc: '慕容清歌 · 清歌弦鸣穴的持有者被破身', kws: ['慕容清歌处女丧失'] },
  { kind: 'ai', name: '顾云舒处女丧失', desc: '顾云舒 · 流焰叠薪穴的持有者被破身', kws: ['顾云舒处女丧失'] },
  { kind: 'ai', name: '陆烬颜处女丧失', desc: '陆烬颜 · 凤凰羽花的持有者被破身', kws: ['陆烬颜处女丧失'] },
  /* ── 名器**阶段**锚点（2026-09-30 主人令：阶段条要「成形 且 该阶段达成」才放行） ──
   *  ⚠️ 命名＝`<名器><中文数字>阶段`，与 `_build_card.js` 的 `MQ_STAGE_ANCHOR()` **同源**（改一处必须改两处）。
   *  ⚠️ 只写「该名器第几阶段已达成」这一件事，不写剧情细节；阶段名（落红／情动／沉沦／极乐）见「名器三境与第四境」条。 */
  { kind: 'ai', name: '已抵达陨仙原', desc: '北域陨仙原一线：一行人或玩家这条线真的走到了陨仙原（魂欢殿主名下那批资料的统一闸门）', kws: ['陨仙原'] },
  /* ── 主人 2026-09-30 逐条指定的锚点（19 个）──
   *  ⚠️ `kws` 是「正文里出现这些词就打一行旁证日志」的触发词（不写账本）；一律用锚点名或该事件的长词/专名。
   *  ⚠️ `烟霞灵乳成形` 与早先「她出场即二境、没有成形这一步」相冲 —— 按最新指示建，已在报告里标出。 */
  { kind: 'ai', name: '天姝榜建立', desc: '神女殿中颁下《天姝榜》（极乐太子亲手颁）', kws: ["天姝榜"] },
  { kind: 'ai', name: '', name: '启程邪修洞府', desc: '第一章 · 玩家**接到去西北荒漠邪修洞府的命令并出发**（主人定：不再靠模型判断「这一章演完没有」）', kws: ['邪修洞府'] },
  { kind: 'ai', name: '', name: '回墨山复命', desc: '第二章 · **孤月与赵无忧回墨山复命**（主人定）', kws: ['复命'] },
  { kind: 'ai', name: '', name: '离开幽寂谷', desc: '第四—五章 · **一行人从幽寂谷秘境离开**（主人定）', kws: ['幽寂谷'] },
  { kind: 'ai', name: '', name: '受征召南下', desc: '**墨山道受仙盟征召、遣弟子南下驰援天溪城——即将出发**（主人定；临行前的送别由此触发）', kws: ['驰援天溪', '天溪城'] },
  { kind: 'ai', name: '', name: '孤剑崖送别已毕', desc: '剧情五（孤剑崖送别 · 孤月赠冰心泪）已经演完', kws: ['冰心泪', '送别'] },
  { kind: 'ai', name: '', name: '听雪双姝登场', desc: '**苏瑶、苏玲登场**（天音阁听雪双姝）', kws: ['听雪双姝'] },
  { kind: 'ai', name: '', name: '玄机子离去', desc: '**玄机子已离去**（主人定）', kws: ['下落不明'] },
  { kind: 'ai', name: '', name: '双姝派回天溪', desc: '双姝线收束：**苏瑶、苏玲被种下奴种，以「黑日」「霜月」之身被派回天溪城**（第十—十二章末）', kws: ['黑日', '霜月'] },
    { kind: 'ai', name: '', name: '三人同寝', desc: '**三人同寝**（主人定）', kws: ['姐妹回归'] },
    { kind: 'ai', name: '', name: '最后防线被冲垮', desc: '**最后那道防线被残阳老怪冲垮**（主人定）', kws: [] },
    { kind: 'ai', name: '', name: '葬魔渊一役已毕', desc: '葬魔渊那一场演完（赵无忧坠渊、雨霏柔授阵丹之道）', kws: [] },
  { kind: 'ai', name: '获得任意名器', desc: '玩家这条线上第一次真的接触到／得到一件名器', kws: ["获得任意名器"] },
  { kind: 'ai', name: '南域大劫', desc: '第六—七章 · 南域大劫爆发：神诅降下、粉黑天穹、四殿册封', kws: ["南域大劫","神诅"] },
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
  /* ── 段 14／15 的跳段锚点（2026-10-06 主人令：替掉被删的夺取类名字）── */
  { kind: 'ai', name: '残阳老怪洞府调教叶红缨', desc: '第十五章 · 残阳老怪深山密窟调教那一场演完（段 14 跳段用）', kws: ['洞府调教'] },
  { kind: 'ai', name: '叶红缨认残阳老怪为主', desc: '第十六章 · 叶红缨认残阳老怪为主（段 15 跳段用）', kws: ['认主'] },
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
  /* ── 起手公开 ── */
  { kind: 'open', name: '天姝会存在', desc: '起手公开，无需解锁（四殿主身份由脚本自动置 true）', kws: [] },
];
const AI_FIELDS = FIELD_TABLE.filter((f) => f.kind === 'ai' && Boolean(f.name)).map((f) => f.name);
/** 起手公开的 */
const OPEN_FIELDS = FIELD_TABLE.filter((f) => f.kind === 'open' && Boolean(f.name)).map((f) => f.name);
/** 全部锚点字段（读顺序＝表顺序：剧情推进 ＋ 起手公开） */
const ALL_FIELDS = FIELD_TABLE.filter((f) => Boolean(f.name)).map((f) => f.name);

/* ══════════════════════════════════════════════════════════════════════════
 * 名器成形 ⇔ 持有者处女丧失（2026-10-06 主人令 · 施工依据见
 *   `docs/名器成形判据与归属判据改造（设计稿）.md`）
 *
 * 主人原话（逐字）：「所有名器成型条件都是 主人被破身」
 *                 「面板归属：xxx破处者是谁，谁就是拥有者」
 *                 「苏瑶苏玲要用且，不是任一」
 *
 * 三条落法：
 *   ① `<破处>` 破处簿（带人）⇒ 写 `stat_data.破处者`，并翻译成 `stat_data.名器归属`（面板第一优先读它）
 *   ② 13 个「〇〇处女丧失」锚点（布尔）⇒ 兜底通道，跨回合累加
 *   ③ 只报「〇〇成形」而两条都没有 ⇒ 先查正文硬词挽救，仍无 ⇒ 丢弃（堵的就是 2026-10-06 那次误报）
 * ══════════════════════════════════════════════════════════════════════════ */

/** 名器成形 ⇔ 持有者。`holders` 里**全组人**都丧失才算成形，目前只有双姝那一件是两个人 */
const FORM_OF_HOLDERS = [
  { form: '九幽玄阴穴成形', holders: ['孤月'] },
  { form: '灼酒流炎穴成形', holders: ['叶红缨'] },
  { form: '心魔茶璎乳成形', holders: ['闻观语'] },
  { form: '般若菩提菊成形', holders: ['楚灵夜'] },
  { form: '北冥潮生穴成形', holders: ['雨霏柔'] },
  { form: '灵犀同心成形', holders: ['苏瑶', '苏玲'] },
  { form: '玉虎噙香乳成形', holders: ['云织梦'] },
  { form: '梅蕊穴成形', holders: ['花芷凝'] },
  { form: '冰魄剑心穴成形', holders: ['苏倾寒'] },
  { form: '清歌弦鸣穴成形', holders: ['慕容清歌'] },
  { form: '流焰叠薪穴成形', holders: ['顾云舒'] },
  { form: '凤凰羽花成形', holders: ['陆烬颜'] },
];
/** 持有者 → 名器名。键一律照 `状态栏面板.js` 的 `XSD_RELICS[].n`（`灵犀同心` **不带「穴」**） */
const HOLDER_TO_RELIC = {
  孤月: '九幽玄阴穴', 叶红缨: '灼酒流炎穴', 闻观语: '心魔茶璎乳', 楚灵夜: '般若菩提菊',
  雨霏柔: '北冥潮生穴', 苏瑶: '灵犀同心', 苏玲: '灵犀同心', 云织梦: '玉虎噙香乳',
  花芷凝: '梅蕊穴', 苏倾寒: '冰魄剑心穴', 慕容清歌: '清歌弦鸣穴', 顾云舒: '流焰叠薪穴',
  陆烬颜: '凤凰羽花',
};
/** 13 个「〇〇处女丧失」锚点（＝上面 holders 展平） */
const DEFLOWER_FIELDS = FORM_OF_HOLDERS.flatMap((g) => g.holders.map((h) => h + '处女丧失'));
/** 别名归一：模型写这些说法都认（主人令「处女丧失（破处、元阴被夺、元阴失守及近似词）都是新增字段」） */
const DEFLOWER_SYN = ['处女丧失', '破处', '元阴被夺', '元阴失守', '元阴初破', '初夜'];
/** 正文硬词兜底（防「真破身被漏标误杀」）：报成形却没带破处簿与锚点时，正文里出现这些词
 *  **且同时出现该持有者的名字**，才认作实锤挽救。单有硬词不算，免得把体质描述当现场。
 *  ⚠️ 用正则而不是死词 —— 真机里写的是「**破了**身」「破了她的身」这种说法，
 *     死词表拿「破身」去 `includes` 是**匹配不到**的（2026-10-06 自测当场抓到）。 */
const DEFLOWER_HARD_RES = [
  [/破(?:了|去|过|掉)?(?:她|他|其)?(?:的)?身/, '破身'],
  [/破(?:了|去|过|掉)?(?:她|他|其)?(?:的)?处/, '破处'],
  [/破瓜/, '破瓜'],
  [/初破/, '初破'],
  [/落红/, '落红'],
  [/处子/, '处子'],
  [/元阴(?:失守|被夺|初破)/, '元阴失守'],
  [/初夜/, '初夜'],
  /* ★ 2026-10-07 补：「失身」是中文里最常见的破身说法之一（「先失了身」），原来不在表里 ⇒ 漏判 */
  [/(?:失了身|失身)/, '失身'],
];
/** 上面那批词的标签（人类可读，日志与文档用；判定走 `DEFLOWER_HARD_RES`） */
const DEFLOWER_HARD_WORDS = ['破身', '破处', '破瓜', '初破', '落红', '处子', '元阴失守', '元阴被夺', '初夜', '失身'];

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
  ['残阳老怪洞府调教叶红缨'],                                 // 段 14: 洞府调教
  ['叶红缨认残阳老怪为主', '灼酒流炎穴二阶段']                 // 段 15: 雀奴
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
/* ★ 2026-10-07（GPT 复核采纳 4a）单楼耗时上限收紧：原来 0.5（半月）太宽，"从正厅走到藏经阁"也能吃掉半个月。
 *   现在：小步 ≤ 0.02 月（≈14 小时）；只有出现**明确过渡词**（闭关/赶路/翌月/数月…）才放宽到 3 月。 */
const LISHI_CAP = 0.02;
const LISHI_CAP_TRANSIT = 3;
const LISHI_TRANSIT_RE = /(闭关|数月|数日|数载|隔日|翌日|次日|翌月|次月|开春|入秋|半月|一月|两月|三月|半年|一年|旅程|远行|渡舟|赶路|回宗|返程|数周|一旬|旬日|半月后|数日后|一月后)/;

/** ★ 2026-10-07（主人令「状态栏的时间加上日」）：月内第几日的中文写法，供 `仙盟历文` 用 */
const CN_DAY = ['', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

/** ★ 2026-10-07（主人令）：从文本里解析「仙盟历 XXXX 年 · X月初X」——自设线玩家自选起点靠它锚定 */
function cnNum(t) {
  /* ★ 2026-10-07（gpt 复核 P1）：中文数字解析 —— 原实现只认单个汉字，导致「十五／廿一／二十」被误读。
   *   支持：十／十五／二十／廿一／廿九／三十／卅；阿拉伯数字直通。 */
  const D = '〇一二三四五六七八九';
  const x = String(t || '').trim();
  if (!x) return 0;
  if (/^\d+$/.test(x)) return Number(x);
  if (x === '十') return 10;
  if (x === '正') return 1;      // 正月
  if (x === '冬') return 11;     // 冬月
  if (x === '腊') return 12;     // 腊月
  if (x[0] === '廿') return 20 + Math.max(0, D.indexOf(x[1]));
  if (x[0] === '卅') return 30;
  const m = /^([一二三四五六七八九])?十([一二三四五六七八九])?$/.exec(x);
  if (m) return (m[1] ? D.indexOf(m[1]) : 1) * 10 + (m[2] ? D.indexOf(m[2]) : 0);
  if (x.length === 1) { const n = D.indexOf(x); if (n >= 0) return n; }
  return 0;
}

/** 从文本里解析「仙盟历 XXXX 年 · X月初X / X月X日」。
 *  ⚠️ 2026-10-07（gpt 复核 P1）三条硬规则：① 月 1–12、**日 1–30**（项目按每月 30 日），**31 日明确判无效**；
 *     ② 中文日数支持 十五／廿一／二十／三十；③ 解析不出或不合法 ⇒ 返回 null（由调用侧报错，禁止静默兜底）。 */
/** ★ P1(gpt)：取**唯一一行**「• 当前时点：…」的值；0 行或 ≥2 行都返回空串（禁止拿整段正文/菜单里的首个日期） */
function pickTimepointLine(t) {
  const hits = String(t || '').split('\n').filter((l) => /当前时点/.test(l));
  if (hits.length !== 1) return '';
  const m = /当前时点[：:]\s*(.+)$/.exec(hits[0].trim());
  return m ? m[1].trim() : '';
}

function parseXianmengFromText(t) {
  const m = /仙盟历\s*(\d{3,4})\s*年\s*[·\.、]?\s*([一二三四五六七八九十廿卅正冬腊]{1,3}|\d{1,2})\s*月\s*(?:[·\.、]?\s*(初[一二三四五六七八九十]|[一二三四五六七八九十廿卅]{1,3}|\d{1,2})\s*日?)?/.exec(String(t || ''));
  if (!m) return null;
  const y = Number(m[1]);
  const mo = cnNum(m[2]);
  if (!y || mo < 1 || mo > 12) return null;
  let dayNum = 1;
  const ds = String(m[3] || '');
  if (ds) {
    if (ds.startsWith('初')) dayNum = cnNum(ds.slice(1));
    else dayNum = cnNum(ds);
  }
  if (!(dayNum >= 1 && dayNum <= 30)) return null;      // 31 日及越界一律判无效（不静默改成初一）
  return { ym: y + mo / 100, day: dayNum };
}

/** 带日的完整写法：`仙盟历 1578 年 · 三月初三` */
function fmtXianmengDay(v, day) {
  const d = Math.max(1, Math.min(30, Math.round(Number(day) || 1)));
  return '仙盟历 ' + fmtXianmeng(v) + CN_DAY[d];
}
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
  /* ★★ 2026-10-07（GPT 复核 §2，已按本机源码核实）：ST-Prompt-Template 在读变量时把**聊天层**先铺上、
   *   再用**消息层**做**顶层 `Object.assign`**（`src/function/variables.ts`）——
   *   于是只要「消息层那份 stat_data」里缺某个键，合并结果里那个键就**整个没了**（聊天层的同名字段被盖掉）。
   *   实测复现：同一局第 1 楼快照有 `身份=赵无忧`（3 键），第 3 楼的最快照 27 键里**没有 `身份`**。
   *   ⇒ 保险：每次写盘都把**当前身份与阵营一起带上**，消息层那份就再也不会缺这两个键。 */
  patch = patch || {};
  try {
    const curId = readIdentity();
    const curFaction = readFaction();
    if (curId && patch.身份 === undefined) patch.身份 = curId;
    if (curFaction && patch.阵营 === undefined) patch.阵营 = curFaction;
  } catch (e) { /* 读不到就不带，别因为保险反而写坏 */ }
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
async function writeIdentity(name, guard) {
  /* ★ P1(gpt) E：补上 guard 边界 —— 调用侧传了 guard 却从未执行（旧实现只收 name）。
   *   guard 未通过（例如提交期间切了会话）⇒ 直接中止，不写身份、不同步条目。 */
  if (typeof guard === 'function') {
    let pass = true;
    try { pass = !!guard(); } catch (e) { pass = false; }
    if (!pass) { console.warn(TAG, '[身份] guard 未通过 ⇒ 终止写入（会话或状态已变）'); return { ok: false, why: 'guard 未通过，已中止' }; }
  }
  if (!IDENTITY_NAMES.includes(name)) {
    return { ok: false, why: `未知身份「${name}」（可用：${IDENTITY_NAMES.join(' / ')}）` };
  }
  const faction = IDENTITY_FACTION[name] ?? FACTION_DEFAULT;
  const statPatch = { 身份: name, 阵营: faction };
  // ⚠️ 关键：新聊天（首楼选身份）或切换身份时，自动同步对应身份的专属起手行囊
  const s = readStatData();
  const curInv = Array.isArray(s?.inventory) ? s.inventory : [];
  const STARTER_ITEM_NAMES = new Set([
    '醉春风', '墨山道佩剑', '随身青锋剑', '随身佩剑', '回春散两盅',
    '天姝令（焚欲）', '《燎原蛊火诀》',
    '天姝令（欢喜）', '《旖旎梵音心经》', '积云檀木念珠',
    '天姝令（浊龙）', '《极乐龙体诀》', '真龙暗卫密符',
    '天姝令（魂欢）', '《情丝化灵录》', '百毒百草囊',
    '《极乐引》', '《极乐引》残篇'
  ]);
  const isStartersOnly = curInv.length === 0 || curInv.every(it => STARTER_ITEM_NAMES.has(it.name));
  if (isNewChat() || isStartersOnly) {
    statPatch.inventory = defaultInventoryFor(name);
  } else {
    const acquiredItems = curInv.filter(it => !STARTER_ITEM_NAMES.has(it.name));
    statPatch.inventory = [...defaultInventoryFor(name), ...acquiredItems];
  }
  const r = await writeStat(statPatch, `身份 → ${name}／阵营 ${faction}`);
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

/* ══════════════════════════════════════════════════════════════════════════
 * 纳戒物品账（2026-10-06 · GPT 复核后重做）
 *   · 每件物品四个字段：`id`（稳定标识，由归一化名得来）、`name`、`desc`／`full`、`count`（数量）
 *   · 名称归一 ⇒「两壶灵酒」「灵酒」「灵酒（旧瓶）」认作同一件，不会被当成三种东西
 *   · 扣减有校验：不许扣成负数，扣到 0 才从纳戒移除（不是一写「消耗」就整件消失）
 *   · 幂等与回退：`stat_data.纳戒账本` 记「哪一层楼施加过哪些变动」；同一楼重跑时**先回滚再施加**，
 *     楼被删（`messageText` 读不到）时在对账里回滚 —— 覆盖重生成／切换回复／编辑／删楼四种情形
 * ══════════════════════════════════════════════════════════════════════════ */

/** 物品名归一：去空白与括号注释、去掉开头的「数词＋量词」⇒ 词干（用来判「是不是同一件东西」） */
function normItemName(s) {
  let t = String(s ?? '').trim();
  if (!t) return '';
  t = t.replace(/[（(][^）)]*[）)]/g, '');                 // 括号里的简述不参与判名
  t = t.replace(/[\s·・,，。.、'"「」『』]/g, '');
  const NUM = '[一二三四五六七八九十两双半几数]|\\d+';
  const UNIT = '壶|坛|瓶|罐|颗|枚|粒|丸|件|把|柄|张|袋|个|支|条|缕|滴|块|串|卷|册|本|面|幅|座|只|套|份|盒|匣|枚';
  t = t.replace(new RegExp(`^(?:${NUM})?(?:${UNIT})`, 'g'), '');   // 两壶灵酒 → 灵酒
  t = t.replace(new RegExp(`(?:${NUM})(?:${UNIT})$`, 'g'), '');    // 灵酒两壶 → 灵酒
  return t.trim();
}
/** 稳定 id：同一件东西在任何楼层都得同一个 id */
function itemIdOf(name) { return normItemName(name) || String(name ?? '').trim(); }

/** 老数据补 `id`／`count`，并把 count 规范成 ≥1 的整数 */
function normalizeInventory(inv) {
  const src = Array.isArray(inv) ? inv : [];
  return src.filter((it) => it && it.name).map((it) => {
    let n = parseInt(it.count, 10);
    if (!Number.isFinite(n) || n < 1) n = 1;
    return { ...it, id: it.id || itemIdOf(it.name), name: String(it.name), count: n };
  });
}

/**
 * **准入／跳段锚点的正文实证词表**（2026-10-07 复核发现后补）。
 * 为什么要它：准入锚点现在是「章的开门条件」——模型只要把这个名字写进 `<实际发生>`，
 *   对应那一章的原文照录当场就能进上下文（连段位都不用等）。词表在**脚本里**、模型看不到，
 *   所以模型无法绕过；本楼正文里找不到实证的，一律丢弃并告警（照「破处闸门」的做法）。
 * 实测的放大面（见 `scratch/_probe_review_after_fix.mjs` ③）：
 *   误报 `天溪城破` 会直接打开第 12 章、误报 `封元镇灵环`／`赵无忧坠渊` 打开第 13 章……
 */
const ANCHOR_EVIDENCE = {
  天溪城破: /(城破|城陷|陷落|城池陷|城墙.{0,6}(?:塌|倒)|西南城破)/,
  封元镇灵环: /(暴露|当众|看见|扯开|撕开|剥开|夺走|摘下|坦露|映入眼帘)/,
  双姝回归: /(回归|潜回|现身|回来了|回到)/,
  血染天溪: /(失控|越界|温存|血染|缠绵)/,
  兽潮血战: /(兽潮|血战|围城|攻城)/,
  天溪城兽潮: /(兽潮|血战|围城|攻城)/,
  玄机子装伤: /(装伤|诈伤|受伤.{0,8}(?:退|走|撤|离)|请返宗门)/,
  进入幽寂谷: /幽寂谷/,
  玄机子胁迫过叶红缨: /(胁迫|要挟|逼.{0,6}(?:她|叶红缨)|把柄|威胁)/,
  赵无忧坠渊: /(坠渊|坠落|葬魔渊|金丹.{0,6}(?:击碎|碎|废))/,
  南域大劫: /(神诅|大劫|封印|再无元婴|天穹)/,
  已抵达天溪: /天溪/,
  赠送冰心泪: /冰心泪/,
  孤月定情: /(定情|说破|封吻|平安回来|心意)/,
  极乐引入手: /(极乐引|残卷|残篇)/,
  灵犀同心成形: /(灵犀同心|同心异体|日月同辉)/,
  灼酒流炎穴成形: /(灼酒流炎穴|名器.{0,6}(?:觉醒|成形)|初醒)/,
  残阳老怪洞府调教叶红缨: /(调教|洞府|囚|犬|锁链)/,
  叶红缨认残阳老怪为主: /(认主|为主|臣服|跪|主人)/,
  灼酒流炎穴二阶段: /(二阶段|二境|觉醒)/,
  /* ★ 2026-10-07（同层全查）：新加的成形门槛是「既成事实」，也必须有正文实证，否则随口一报就能开门 */
  楚灵夜后窍开发: /(后窍|谷道|后门|后庭|菊径|肛|撑开|开发)/,
};
/** 本楼正文里有没有这个锚点的实证（不在表里的锚点一律放行） */
function anchorEvidenceIn(prose, field) {
  const re = ANCHOR_EVIDENCE[field];
  if (!re) return { ok: true, why: '（该锚点无实证要求）' };
  if (!prose) return { ok: true, why: '（读不到正文，按放行处理，别误杀）' };
  return re.test(prose) ? { ok: true, why: '' } : { ok: false, why: `正文里没有「${field}」的实证` };
}

/** 去掉状态栏那一段，只留正文 —— 纳戒的「依据」只看正文，不看状态栏自己怎么写 */function stripStatusBlock(text) {
  return String(text || '')
    .replace(/<Status_block>[\s\S]*?<\/Status_block>/gi, ' ')
    .replace(/<StatusBlock>[\s\S]*?<\/StatusBlock>/gi, ' ')
    .replace(/<status>[\s\S]*?<\/status>/gi, ' ');
}

/**
 * 正文里有没有这一笔物品进出的依据。
 * 为什么需要：主人 2026-10-07 报「正文完全没提酒，可 `<纳戒>` 每楼都写消耗：醉春风×1」——
 *   根因是提示词的**写法示例里带了真实物品名**，模型照抄示例 ⇒ 两坛酒被抄光。
 * 认法（宽松但有底线，宁可漏认也不误扣）：
 *   ① 名称原样；② 归一化名（去数词量词与括号）；③ 名字 ≥4 字时另认**尾二字**（「墨山道佩剑」→「佩剑」）；
 *   ④ 去掉书名号等包裹符的裸名（「《极乐引》残篇」→「极乐引」）。
 */
function itemEvidenceIn(prose, name) {
  const p = String(prose || '');
  const full = String(name || '').trim();
  if (!p || !full) return false;
  const norm = normItemName(full) || full;
  const cands = [full, norm];
  if (norm.length >= 4) cands.push(norm.slice(-2));
  const bare = full.replace(/[《》〈〉「」『』【】（）()]/g, '');
  if (bare !== full) cands.push(bare);
  return cands.some((c) => c && c.length >= 2 && p.includes(c));
}

/** 在纳戒里找某件东西：①归一后全等 ②互为包含（词干长度 ≥2）⇒ 返回下标，找不到 -1 */function findItemIndex(inv, key) {
  const k = normItemName(key);
  if (!k) return -1;
  const norm = (it) => normItemName(it.name);
  let loose = -1;
  for (let i = 0; i < inv.length; i += 1) {
    const n = norm(inv[i]);
    if (n === k) return i;
    if (loose < 0 && k.length >= 2 && n.length >= 2 && (n.includes(k) || k.includes(n))) loose = i;
  }
  return loose;
}

/**
 * 施加一次变动（**纯函数**，返回新数组与执行报告）
 * @param {object[]} inv
 * @param {{kind:'gain'|'loss', name:string, count?:number, desc?:string, full?:string}} chg
 * @returns {{inv:object[], ok:boolean, name:string, asked:number, applied:number, note:string}}
 */
function applyItemChange(inv, chg) {
  const list = normalizeInventory(inv);
  const name = String(chg.name ?? '').trim();
  const asked = Math.max(1, parseInt(chg.count, 10) || 1);
  if (!name) return { inv: list, ok: false, name: '', asked, applied: 0, note: '名字为空' };
  const at = findItemIndex(list, name);
  if (chg.kind === 'gain') {
    if (at >= 0) list[at] = { ...list[at], count: list[at].count + asked };
    else list.push({ id: itemIdOf(name), name, desc: chg.desc || '随身所得之物。', full: chg.full || chg.desc || '随身所得之物。', count: asked });
    return { inv: list, ok: true, name: at >= 0 ? list[at].name : name, asked, applied: asked, note: '入账' };
  }
  if (at < 0) return { inv: list, ok: false, name, asked, applied: 0, note: '纳戒里没有这一件' };
  const real = Math.min(list[at].count, asked);          // ⚠️ 不许扣成负数：最多扣到 0
  const left = list[at].count - real;
  const hitName = list[at].name;
  if (left > 0) list[at] = { ...list[at], count: left };
  else list.splice(at, 1);                               // 扣到 0 才移除
  return { inv: list, ok: true, name: hitName, asked, applied: real, note: left > 0 ? `剩 ${left}` : '已用尽，移出纳戒' };
}

/**
 * 纳戒账本对账：**把已经不存在的那几楼的账回滚掉**（覆盖「删楼」这一种情形）。
 *   · 判据：`messageText(楼层)` 读不到内容 ⇒ 那一楼已被删；
 *   · 读消息本身抛错（接口没就绪）时**当作还在**，宁可留账也不误回滚；
 *   · 回滚 = 把该楼消耗过的加回去、该楼获得过的扣回去（与施加同一套，天然对称）。
 * 调用点：`applyStatusToVars`（每楼开始前）与 `boot`（开聊天/换聊天）。命令改纳戒**不进账本**（手动即最终）。
 */
async function reconcileNadeLedger(where) {
  const s = readStatData() || {};
  const log = (s.纳戒账本 && typeof s.纳戒账本 === 'object') ? { ...s.纳戒账本 } : null;
  if (!log) return false;
  const keys = Object.keys(log).filter((k) => /^\d+$/.test(k) && log[k] && typeof log[k] === 'object');
  if (!keys.length) return false;
  let inv = normalizeInventory(s.inventory);
  const gone = [];
  for (const k of keys) {
    let txt = null;
    try { txt = messageText(Number(k)); } catch (e) { txt = '（读不到，按还在算）'; }
    if (txt === null || txt === undefined) txt = '（读不到，按还在算）';
    if (String(txt).trim()) continue;                       // 这一楼还在 ⇒ 不动它
    const e = log[k];
    for (const x of (e.消耗 || [])) inv = applyItemChange(inv, { kind: 'gain', name: x.name, count: x.count }).inv;
    for (const x of (e.获得 || [])) inv = applyItemChange(inv, { kind: 'loss', name: x.name, count: x.count }).inv;
    delete log[k];   /* ⚠️ GPT 复核 §7-③：深合并**删不掉键**，所以下面写回时另置 `null` 墓碑（见 writeStat 调用处） */
    log[k] = null;
    gone.push(k);
  }
  if (!gone.length) return false;
  const r = await writeStat({ inventory: inv, 纳戒账本: log }, `${where}·纳戒对账`);
  console.log(TAG, `🧹 [纳戒对账]${where}：第 ${gone.join('、')} 楼已不存在 ⇒ 回滚它们的纳戒账`
    + `（${r && r.ok ? '已写盘 via ' + r.via : '⚠️ 写盘失败：' + ((r && r.why) || '接口不可用')}）`);
  return true;
}

/** 身份专属初始随身物品 */
function defaultInventoryRaw(identity) {
  const id = String(identity || '').trim();
  if (id === '赵无忧') {
    return [
      { name: '醉春风', desc: '墨山道佳酿两坛，酒香浓醇，可解忧畅怀。', full: '墨山道坊市所出的上等灵酿「醉春风」，甘冽清醇，入口温润，为赵无忧探望红缨师姐特备。' },
      { name: '墨山道佩剑', desc: '墨山道内门弟子制式青锋剑，温润坚韧。', full: '墨山道制式飞剑，通体以青灵寒铁锻打，刻有墨山宗纹，注入金丹灵力可御剑行空。' }
    ];
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
    { name: '醉春风', desc: '南域佳酿两坛，酒香浓醇，可解忧畅怀。', full: '南域仙坊颇具盛名的上等灵酿「醉春风」，甘冽清醇，入口温润，最解行者客愁，为云游修士随身常备佳品。', count: 2 },
    { name: '随身青锋剑', desc: '入世防身佩剑，剑身清寒。', full: '随身淬炼多年的上好青锋剑，寒芒如雪，指使如臂，无论御剑凌风或近身防卫皆得心应手。' },
    { name: '《极乐引》残篇', desc: '记载天下诸般名器与双修造化之无上秘录。', full: '机缘所得的古旧皮质残卷，详载天下至阴名器之玄奥，能辨阴阳造化，推演仙姝命途。' }
  ];
}

/** 对外入口：起手行囊一律补上 `id` 与 `count`（⚠️ 赵无忧那份的「醉春风」是**两坛** ⇒ count 2） */
function defaultInventoryFor(identity) {
  const raw = defaultInventoryRaw(identity);
  if (identity === '赵无忧') {
    const i = raw.findIndex((x) => x.name === '醉春风');
    if (i >= 0) raw[i] = { ...raw[i], count: 2 };
  }
  return normalizeInventory(raw);
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
  const identityNow = (patch.身份 !== undefined) ? patch.身份 : (s?.身份 || IDENTITY_DEFAULT);
  if (!s || !Array.isArray(s.inventory) || !s.inventory.length) {
    patch.inventory = defaultInventoryFor(identityNow);
  } else if (identityNow === '自设') {
    // ⚠️ 自设行囊自动净化：防止历史旧聊或初始赵无忧身份残留的物品污染
    let invDirty = false;
    const cleaned = s.inventory.map(it => {
      if (!it || !it.name) return it;
      if (it.name === '墨山道佩剑') {
        invDirty = true;
        return { name: '随身青锋剑', desc: '入世防身佩剑，剑身清寒。', full: '随身淬炼多年的上好青锋剑，寒芒如雪，指使如臂，无论御剑凌风或近身防卫皆得心应手。' };
      }
      if (it.name === '醉春风' && it.full && (it.full.includes('赵无忧') || it.full.includes('红缨师姐'))) {
        invDirty = true;
        return { name: '醉春风', desc: '南域佳酿两坛，酒香浓醇，可解忧畅怀。', full: '南域仙坊颇具盛名的上等灵酿「醉春风」，甘冽清醇，入口温润，最解行者客愁，为云游修士随身常备佳品。' };
      }
      return it;
    });
    if (invDirty) patch.inventory = cleaned;
  }

  /* ★ 2026-10-06（老档一次性迁移）：旧存档里的物品没有 `count` 字段，一律会被当成 1 件 ——
   *   而设计里赵无忧／自设起手的「醉春风」是**两坛**，若按 1 件算，喝一坛就整个消失。
   *   ⇒ 只在 `count === undefined`（真·老数据）时按下面这张表补数，补过一次之后就不再进来。 */
  {
    const invBase = Array.isArray(patch.inventory) ? patch.inventory
      : (Array.isArray(s && s.inventory) ? s.inventory : null);
    const LEGACY_COUNT = { 醉春风: 2 };
    if (invBase && invBase.some((it) => it && it.name && it.count === undefined)) {
      patch.inventory = normalizeInventory(invBase.map((it) => (
        it && it.name && it.count === undefined && LEGACY_COUNT[it.name]
          ? { ...it, count: LEGACY_COUNT[it.name] } : it
      )));
      console.log(TAG, `[初始化·${where}] 纳戒老数据迁移：补 id 与数量（醉春风按设计的「两坛」记 2）`);
    }
  }

  /* ⚠️ v1.5：按身份校正「天姝会存在」这一格（见 OPEN_FIELD_FOR_OWNER 注释）。
   *   只在**该为 true 却还是 false** 时补 —— 账本是只升不降的：
   *   玩家用 `/解锁` 翻开的、或从殿主身份切走后留下的 true，一律不回退。 */
  for (const f of openFieldsFor(identityNow)) {
    const cur = known[f];
    if (cur === true) continue;
    patch.known = patch.known || {};
    patch.known[f] = true;
    console.log(TAG, `[初始化] 当前身份「${identityNow}」按身份起手 ⇒ 置「${f} = true」`
      + `（原值 ${cur === undefined ? '未设' : cur}）`);
  }

  if (!Object.keys(patch).length) {
    console.log(TAG, `[初始化·${where}] 字段齐全（known ${ALL_FIELDS.length} 个 + 身份 + 阵营 + 纳戒），无需补`);
    return false;
  }
  console.log(TAG, `[初始化·${where}] 补 ${Object.keys(patch).length} 组：`
    + (patch.known ? `known ${missingKnown.length} 个（${missingKnown.join('、')}）` : 'known 齐全')
    + (patch.身份 ? ` ＋ 身份=${IDENTITY_DEFAULT}` : '')
    + (patch.inventory ? ` ＋ 纳戒物品 ${patch.inventory.length} 件` : '')
    + (patch.阵营 ? ` ＋ 阵营=${FACTION_DEFAULT}` : ''));
  const r = await writeStat(patch, `初始化·${where}`);
  /* ⚠️ v1.5：写没写进去必须**明说**。v1.4 时这里不检查返回值，
   *   于是「初始化跑了但那一笔没落地」在 console 里看不出来（只能靠 /已知 反推）。 */
  if (!r || r.ok !== true) {
    console.error(TAG, `❌ [初始化·${where}] 变量没写进去（${(r && r.via) || '接口不可用'}）`
      + ' —— 账本仍是空的，「进度」校验会一直报「状态条多写」。'
      + ' 可发 /身份 或敲 __xsdBoot() 重试；仍失败请看上面的写失败原因。');
  } else {
    console.log(TAG, `✅ [初始化·${where}] 已落地（${r.via}）—— 账本 now = ${ALL_FIELDS.length} 个 known 全 false，`
      + '「进度」校验从此有真账本可对。');
  }
  return true;
}

/* ═══════════════════════════════════════════════════════════
 * 六 · 状态条解析 → 变量
 * ═══════════════════════════════════════════════════════════ */

/* ── 字段名归一：繁简 / 大小写 / 同义 / 分隔符（· ・ - _ /）都收 ── */
/** 繁体 → 简体（只收本卡字段名里会出现的字，够用就好，不引整张转换表）
 *  ⚠️ 两串必须**逐位对齐**（同一个下标是一对）。v1.3 追加的 7 对：
 *     歷→历（历时）· 氣→气（天气）· 環→环（环境）· 線→线（线索）· 遠→远（远闻）· 聞→闻（近闻）· 機→机（危机） */
const TRAD_CHARS = '場處間時點關係態狀為標勢員體們進潛龍與冊歷氣環線遠聞機';
const SIMP_CHARS = '场处间时点关系态状为标势员体们进潜龙与册历气环线远闻机';
function toSimp(s) {
  let out = '';
  for (const ch of String(s)) {
    const i = TRAD_CHARS.indexOf(ch);
    out += i >= 0 ? SIMP_CHARS[i] : ch;
  }
  return out;
}
/** 去掉装饰（【】（）「」<>…）／空白（含全角空格）／分隔符，再转简体小写 —— 归一后的串拿去查表 */
function normalizeLabel(raw) {
  return toSimp(
    String(raw ?? '')
      .replace(/[【】\[\]（）()<>「」『』"'`\s\u3000]/g, '')
      .replace(/[·・•‧．.\-_/]/g, ''),
  ).toLowerCase();
}

/** 规范键 → 别名（含规范键自己）。
 *  ⚠️ `名器·在册`／`名器`／`名器在册` 归一后是同一个串，所以只需写一条。
 *  ⚠️ 这里只管「读得到」，写进 stat_data 的**永远是规范键**。 */
const FIELD_ALIAS = {
  时间: ['时间', '时辰', '时刻'],
  历时: ['历时', '经过时长', '所历', '倒计时'],
  地点: ['地点', '位置', '所在', '地址'],
  天气: ['天气', '天候'],
  环境: ['环境', '氛围', '周遭', '周遭环境'],
  在场: ['在场', '人物', '在场人物', '场上'],
  暗处: ['暗处', '潜伏', '暗中', '暗桩'],
  身份: ['身份', '角色', '当前身份'],
  修为: ['修为', '境界', '修境'],
  状态: ['状态', '身心'],
  目标: ['目标', '目的', '意图'],
  局势: ['局势', '局面', '大势'],
  线索: ['线索', '痕迹', '蛛丝马迹'],
  近闻: ['近闻', '近处风声', '近处传闻'],
  远闻: ['远闻', '远处风声', '远处传闻'],
  危机: ['危机', '危局', '迫近之危'],
  // ⚠️ 刻意**不**把「角色」列成 在场角色 的别名 —— `身份` 已占了那个别名，
  //    同名别名会互相覆盖（ALIAS_LOOKUP 后写者胜）。
  [CAST_FIELD]: [CAST_FIELD, '在场要角', '角色块'],
  关系刻度: ['关系刻度', '关系', '关系·刻度', '关系值'],
};
/** 归一化后的别名 → 规范键 */
const ALIAS_LOOKUP = (() => {
  const m = {};
  for (const key of Object.keys(FIELD_ALIAS)) {
    m[normalizeLabel(key)] = key;
    for (const a of FIELD_ALIAS[key]) m[normalizeLabel(a)] = key;
  }
  return m;
})();

/** 标签 → 规范键。先查别名表（归一后精确匹配），查不到再退回面板口径的「互相包含」。
 *  ⚠️ v1.3 两条护栏：
 *    ① 归一后**只剩一个字的标签一律不认** —— 子块里的 `<名>` 与「名器」互相包含
 *       （`名器`.includes(`名`）），不挡会拿人物名去覆盖名器栏；
 *    ② `在场角色` 不参与「互相包含」兜底 —— 它与 `在场` 互相包含，会把 `<在场>` 拽过去。 */
function matchField(label) {
  const n = normalizeLabel(label);
  if (!n || n.length < 2) return null;
  if (ALIAS_LOOKUP[n]) return ALIAS_LOOKUP[n];
  for (const key of Object.keys(FIELD_MAP)) {
    if (key === CAST_FIELD) continue;
    const want = normalizeLabel(FIELD_MAP[key]);
    if (!want) continue;
    if (n.includes(want) || want.includes(n)) return key;
  }
  return null;
}
/** 这一行／这个标签是不是「进度」（进度不进面板，也不写变量，只做一致性校验） */
function isProgressLabel(label) {
  return normalizeLabel(label).includes('进度');
}
/** ★ 2026-09-29（主人选 B：「由玩家点头很蠢而且很出戏」）：
 *  状态栏里那个**玩家看不见的 `<实际发生>`** 栏 —— 模型把"本回合剧情上确实发生了"的锚点字段名列在这儿，
 *  脚本读它**自动写进账本**（不弹提示、不问玩家）。
 *  ⚠️ 只认 `FIELD_TABLE` 里的字段名（逐字），别的串一律丢弃并打日志。 */
function isMilestoneLabel(label) {
  const n = normalizeLabel(label);
  return n.includes('实际发生') || n.includes('里程碑');
}
/** `<实际发生>` 的值 → 字段名数组（空串／无／破折号 ⇒ []） */
function parseMilestones(value) {
  const v = String(value ?? '').trim().replace(/[（(]\s*无\s*[）)]/g, '无');
  if (!v || v === '无' || v === '-' || v === '—' || /^none$/i.test(v)) return [];
  return v.split(/[、,，/｜|；;\s]+/).map((x) => x.trim()).filter(Boolean);
}
/** 「进度」的值 → 字段名数组（空串／无／破折号 ⇒ []，自动剥除「已达成/已完成」等自然语言后缀） */
function parseProgress(value) {
  const v = String(value ?? '').trim().replace(/[（(]\s*无\s*[）)]/g, '无');
  if (!v || v === '无' || v === '-' || v === '—' || /^none$/i.test(v)) return [];
  return v.split(/[、,，/｜|；;\n]/)
    .map((x) => x.trim().replace(/(?:已达成|已完成|已触发|已解锁|已激活|达成|完成|[（(][^）)]*[）)]|\[[^\]]*\])$/g, '').trim())
    .filter(Boolean);
}

/** ★ 2026-10-06（主人令「处女丧失／破处／元阴被夺／元阴失守及近似词都是新增字段」）：
 *  模型写的别名一律归一到规范名「〇〇处女丧失」；归一不到就原样返回（后面按自造词丢弃）。 */
function normalizeAnchorName(f) {
  const s = String(f ?? '').trim();
  if (!s) return s;
  if (ALL_FIELDS.includes(s)) return s;
  for (const syn of DEFLOWER_SYN) {
    if (syn === '处女丧失' || !s.endsWith(syn)) continue;
    const cand = s.slice(0, s.length - syn.length) + '处女丧失';
    if (ALL_FIELDS.includes(cand)) return cand;
  }
  return s;
}

/** `<破处>` 破处簿那个栏（玩家看不见，与 `<实际发生>`／`<进度>` 同款待遇：不进面板、不渲染） */
function isDeflowerLabel(label) {
  const n = normalizeLabel(label);
  return n.includes('破处') || n.includes('破身簿');
}
/** ★ 2026-10-06（主人报：酒喝了还在物品栏）：`<纳戒>` 那一栏 —— 模型在这里报「获得／消耗」，
 *  脚本据此增删 `stat_data.inventory`。玩家看不见这一栏，但物品栏面板会跟着变。
 *  ⚠️ 面板 `renderInventory()` 只负责显示 `stat_data.inventory`，它自己不会删东西。 */
function isNadeLabel(label) {
  const n = normalizeLabel(label);
  return n.includes('纳戒') || n.includes('行囊') || n.includes('物品栏');
}
/** `<纳戒>` 的值 → `{ 获得: [{name,desc,full,count}], 消耗: [{name,count}] }`
 *  体例：「获得：A×2、B（简述）｜消耗：C×1」（顿号分件，竖线分两类，没有就写「无」）。
 *  ⚠️ 数量写法认 `×n`／`xn`／`*n`／末尾空格数字；**不写数量按 1 计**（喝一壶就写 ×1，别写「两壶」当名字）。 */
function parseNade(value) {
  const v = String(value ?? '').trim().replace(/[（(]\s*无\s*[）)]/g, '无');
  const out = { 获得: [], 消耗: [] };
  if (!v || v === '无' || v === '-' || v === '—' || /^none$/i.test(v)) return out;
  /* 件内的数量后缀：`醉春风×2` / `醉春风x2` / `醉春风*2` / `醉春风 2` */
  const takeCount = (s) => {
    const m = String(s).match(/(?:[×xX*]\s*(\d+))\s*$/) || String(s).match(/\s+(\d+)\s*$/);
    return m ? Math.max(1, parseInt(m[1], 10)) : 1;
  };
  for (const seg of v.split(/[｜|；;\n]+/)) {
    const m = seg.match(/^\s*(获得|拿到|收入|消耗|用掉|喝掉|吃掉|丢掉|失去|使用)\s*[:：]\s*(.*)$/);
    if (!m) continue;
    const isGain = ['获得', '拿到', '收入'].includes(m[1]);
    for (const one of String(m[2]).split(/[、,，]+/)) {
      const raw = one.trim();
      if (!raw) continue;
      const cnt = takeCount(raw);
      const t = raw.replace(/[×xX*]\s*\d+\s*$/, '').replace(/\s+\d+\s*$/, '').trim();
      if (!t) continue;
      if (!isGain) {
        const nm = t.replace(/[（(].*$/, '').trim();
        if (nm) out.消耗.push({ name: nm, count: cnt });
        continue;
      }
      const mm = t.match(/^(.+?)[（(](.+?)[）)]$/);          // 「青锋剑（入世防身）」
      out.获得.push(mm
        ? { name: mm[1].trim(), desc: mm[2].trim(), full: mm[2].trim(), count: cnt }
        : { name: t, desc: '随身所得之物。', full: '随身所得之物。', count: cnt });
    }
  }
  return out;
}
/** `<破处>` 的值 → `[{ 持有者, 破处者 }]`
 *  体例照「关系刻度」：条目之间用「｜」，条目内部用「、」。
 *  ⚠️ 认不出的持有者一律丢弃（不许拿正文外的名字记账）；写不成两个人的条目也丢。 */
function parseDeflowerBook(value) {
  const v = String(value ?? '').trim().replace(/[（(]\s*无\s*[）)]/g, '无');
  if (!v || v === '无' || v === '-' || v === '—' || /^none$/i.test(v)) return [];
  const out = [];
  for (const one of v.split(/[｜|；;\n]+/)) {
    const parts = one.split(/[、,，]+/).map((x) => x.trim()).filter(Boolean);
    if (parts.length < 2) continue;
    const holder = parts[0], who = parts[1];
    if (!HOLDER_TO_RELIC[holder]) continue;
    out.push({ 持有者: holder, 破处者: who });
  }
  return out;
}

/** 正文硬词兜底（防「真破身被漏标误杀」）：这个名字**附近**（前后各 80 字）有没有破身硬词。
 *  返回命中的那个词，没有就返回空串。
 *  ⚠️ 不许全篇搜 —— 别处一句体质描写、图谱批注都可能带「初破」，那不是现场。 */
function nearDeflowerWord(text, name) {
  const t = String(text ?? '');
  if (!t || !name) return '';
  const others = Object.keys(HOLDER_TO_RELIC).filter((h) => h !== name);
  /** 某个名字在正文里离命中点最近的一次距离 */
  const dist = (h, at) => {
    let d = Infinity, i = t.indexOf(h);
    while (i !== -1) { d = Math.min(d, Math.abs(i - at)); i = t.indexOf(h, i + h.length); }
    return d;
  };
  for (const [re, label] of DEFLOWER_HARD_RES) {
    const g = new RegExp(re.source, 'g');
    let m;
    while ((m = g.exec(t))) {
      const at = m.index;
      const dName = dist(name, at);
      /* ⚠️ 命中点离**别的持有者**更近 ⇒ 这不是这个人的现场。
       *    例：「叶红缨那一夜破了身，孤月在门外守着」—— 不许拿它替孤月开成形。 */
      if (dName <= 80 && !others.some((h) => dist(h, at) < dName)) return label;
      if (m.index === g.lastIndex) g.lastIndex += 1;      // 防零宽匹配死循环
    }
  }
  return '';
}

/* ── 状态条外壳：三种写法都认 ──
 *   ① `<Status_block> … </Status_block>`（现在的主格式）
 *   ② `<StatusBlock> … </StatusBlock>`
 *   ③ `<status> … </status>`
 * ⚠️ 一律用**惰性 ＋ `[\s\S]`** 取内容，保证**值里的换行不被吃掉**。
 * ⚠️ 外壳名必须是**非捕获组** —— 否则 `match()` 的第 1 组会变成标签名而不是内容。 */
const STATUS_TAG = '(?:Status_block|StatusBlock|status)';
const STATUS_OPEN_RE = new RegExp('<' + STATUS_TAG + '\\b[^>]*>', 'i');
const STATUS_PAIR_RE = new RegExp('<' + STATUS_TAG + '\\b[^>]*>([\\s\\S]*?)<\\/' + STATUS_TAG + '>', 'i');
const STATUS_STRIP_RE = new RegExp('<\\/?' + STATUS_TAG + '\\b[^>]*>', 'gi');
/** 正文里有没有状态条（三种外壳任一即可）—— 收尾自检用 */
function hasStatusBlock(text) {
  return STATUS_OPEN_RE.test(String(text ?? ''));
}
/** XML 式字段对：`<标签>值</标签>`。
 *  ⚠️ 值用 `[^<]*`：**保留换行**，又绝不可能越过下一个标签把正文吞掉。 */
const XML_PAIR_RE = /<([A-Za-z\u4e00-\u9fff][A-Za-z0-9\u4e00-\u9fff·・_\-]{0,24})>([^<]*)<\/\1>/g;

/* ── 在场角色子块（照抄外卡《大乾风华录 Ver2.0》的 extra_char_N）──────────
 * 外卡那六件套 favor_char／favor_stage／favor_aura／favor_reason／favor_mind／
 * favor_companion 折算成我们的五个中文标签：
 *   对象名＝<名>　关系阶段＝<阶段>　情况＝<情况>　心意缘由 ＋ 对方心中所想＝<心境>　对方此刻姿态＝<神态>
 * ⚠️ 最多 3 个（`<角色1>…<角色3>`）；`<角色1>无</角色1>` 表示这一档没人，不计数。
 * ⚠️ 英文标签（name／stage／aura／mind／demeanor）也认 —— 模型偶尔会回落成外卡写法。
 * ⚠️ 外层用**惰性 `[\s\S]*?` ＋ 反向引用配对的闭合标签**：既不会把外层整体吃掉，
 *    也不会让兄弟子块串味（`<角色1>…</角色1>` 绝不吃到 `<角色2>` 之后）。 */
const CAST_BLOCK_RE = /<角色\s*([0-9０-９一二三四五六七八九]+)\s*>([\s\S]*?)<\/角色\s*\1\s*>/g;
const CAST_FIELD_RE = /<(名|名称|name|对象|阶段|stage|情况|aura|心境|mind|心意缘由|reason|神态|demeanor|姿态|companion)>([^<]*)<\/\1>/g;
const CAST_KEYS = ['名', '阶段', '情况', '心境', '神态'];
/** 子块内的标签别名 → 我们五个规范键 */
const CAST_FIELD_ALIAS = {
  name: '名', 名称: '名', 对象: '名',
  stage: '阶段',
  aura: '情况',
  情况: '情况',
  mind: '心境', reason: '心境', 心意缘由: '心境',
  demeanor: '神态', companion: '神态', 姿态: '神态',
};
const CAST_MAX = 3;
const CAST_EMPTY_RE = /^[无無—\-]+$/;

/**
 * 从状态条内文里摘出全部 `<角色N>` 子块，聚合成数组。
 * @returns {{list:object[], rest:string, 空档:number}}
 *   · `list`：`[{ 序号, 名, 阶段, 情况, 心境, 神态 }, …]`，最多 3 个，全是空标签的档位不算
 *   · `rest`：**摘掉子块之后**的内文（顶层字段正则必须在这上面跑，否则子块里的 `<名>`
 *     会被「名器」栏的互相包含规则吃掉）
 * ⚠️ 用 `String.replace(正则, 函数)` 而不是替换串 —— 替换串里的 `$&`／`$'` 是特殊序列，
 *    传错会把内文写坏（本仓库铁律 26）。
 */
function parseCastBlocks(inner) {
  const list = [];
  let 空档 = 0;
  const rest = String(inner ?? '').replace(CAST_BLOCK_RE, (whole, no, body) => {
    const b = String(body ?? '').trim();
    if (!b || CAST_EMPTY_RE.test(b)) { 空档++; return '\n'; }
    const one = { 序号: String(no ?? '').trim(), 名: '', 阶段: '', 情况: '', 心境: '', 神态: '' };
    for (const mm of b.matchAll(CAST_FIELD_RE)) {
      const k = CAST_FIELD_ALIAS[mm[1]] || mm[1];
      const v = String(mm[2] ?? '').trim();
      if (CAST_KEYS.includes(k) && !one[k]) one[k] = v;
    }
    // 裸文本子块（模型没写内层标签，只丢了个名字）：整段当对象名，别丢信息
    if (!CAST_KEYS.some((k) => one[k]) && !b.includes('<')) one.名 = b;
    if (CAST_KEYS.some((k) => one[k])) list.push(one);
    else 空档++;
    return '\n';
  });
  return { list: list.slice(0, CAST_MAX), rest, 空档 };
}

/**
 * 从 AI 正文里抽状态条，**同时兼容两种写法**：
 *   ① 主格式（YAML 式）：`地点：墨山道·赤焰居` —— 全／半角冒号，标签前后可有空白，值为空记空串
 *   ② 备用格式（XML 式）：`<地点>墨山道·赤焰居</地点>`
 * 口径：**先逐行扫 `标签：值`；同一字段若没被扫到，再用 `<标签>值</标签>` 补**。
 * 两种写法的字段名都先做**别名归一**（见 FIELD_ALIAS），统一落到 stat_data 的规范键。
 * ⚠️ 行匹配正则与 `状态栏面板.js` **逐字同源**，两边口径必须一致：
 *    `^\s*([^：:]{1,14})[：:]\s*(.*)$`
 * @returns {{found:boolean, raw:string, fields:object, 进度:string[]|null, 里程碑:string[]|null, 未识别:string[], YAML行数:number, XML标签数:number, 在场角色:object[]}}
 *   · `fields` 按规范键归并（含 `身份`）
 *   · `在场角色` 是 `<角色N>` 子块聚合出来的数组（最多 3 个；没有子块就是空数组）
 *   · `进度` 为 null 表示**没有这一行／这个标签**；为 `[]` 表示写了「无」
 *   · `里程碑`（`<实际发生>`，玩家看不见的那一栏）同上：模型写出"本回合确实发生了"的锚点字段名，
 *     由 `applyMilestones()` **自动写进账本**（2026-09-29 主人选 B：不弹提示、不问玩家）
 *   · `未识别` 是没归进面板的标签（排障用）
 */
function parseStatusBlock(text) {
  const out = { found: false, raw: '', fields: {}, 进度: null, 里程碑: null, 破处: null, 纳戒: null, 未识别: [], YAML行数: 0, XML标签数: 0, 在场角色: [] };
  const t = String(text ?? '');
  const m = t.match(STATUS_PAIR_RE);
  let inner = null;
  if (m) {
    inner = m[1];
  } else if (STATUS_OPEN_RE.test(t)) {
    // 只开了没闭（多半被截断）—— 取开标签之后的全部内容，尽力解析
    const at = t.search(STATUS_OPEN_RE);
    inner = t.slice(at).replace(/^<[^>]*>/, '');
    console.warn(TAG, '[状态条] 只有开标签没有闭标签（多半是回复被截断），按「尽力解析」处理');
  }
  if (inner === null) return out;
  out.found = true;
  out.raw = inner;
  inner = inner.replace(STATUS_STRIP_RE, '');   // 去掉可能嵌套的 status 外壳

  // ⓪ **先**把 `<角色N>` 子块整块摘走（子块里的 `<名>` 会与「名器」栏互相包含）
  const cast = parseCastBlocks(inner);
  inner = cast.rest;
  out.在场角色 = cast.list;
  if (cast.list.length || cast.空档) {
    console.log(TAG, `[状态条] 在场角色子块：解析出 ${cast.list.length} 个要角`
      + (cast.空档 ? `（另有 ${cast.空档} 档写「无」）` : '')
      + (cast.list.length ? ` —— ${cast.list.map((c) => c.名 || '未具名').join('、')}` : ''));
  }

  // ① 主格式：XML 式 `<标签>值</标签>`
  //   2026-09-27 升为主格式：边界明确（值里换行不会被下一行吃掉），且外卡《大乾风华录》全卡走 XML 已被实践验证。
  for (const mm of inner.matchAll(XML_PAIR_RE)) {
    const label = mm[1];
    const value = String(mm[2] ?? '').trim();
    if (isProgressLabel(label)) {
      if (out.进度 === null) out.进度 = parseProgress(value);
      out.XML标签数++;
      continue;
    }
    if (isMilestoneLabel(label)) {
      if (out.里程碑 === null) out.里程碑 = parseMilestones(value);
      out.XML标签数++;
      continue;
    }
    if (isDeflowerLabel(label)) {
      if (out.破处 === null) out.破处 = parseDeflowerBook(value);
      out.XML标签数++;
      continue;
    }
    if (isNadeLabel(label)) {
      if (out.纳戒 === null) out.纳戒 = parseNade(value);
      out.XML标签数++;
      continue;
    }
    const key = matchField(label);
    if (!key) { if (!out.未识别.includes(label)) out.未识别.push(label); continue; }
    if (out.fields[key] === undefined) out.fields[key] = value;
    out.XML标签数++;
  }

  // ② 兼容格式：YAML 式「标签：值」逐行扫（XML 已写过的字段不覆盖）
  for (const line of inner.split(/\r?\n/)) {
    const mm = line.match(/^\s*([^：:]{1,14})[：:]\s*(.*)$/);
    if (!mm) continue;
    const label = mm[1].trim();
    let value = mm[2].trim();
    if (value === '—' || value === '-') value = '';        // 破折号 ＝「空」，与面板同口径
    if (isProgressLabel(label)) {
      if (out.进度 === null) out.进度 = parseProgress(value);
      out.YAML行数++;
      continue;
    }
    if (isMilestoneLabel(label)) {
      if (out.里程碑 === null) out.里程碑 = parseMilestones(value);
      out.YAML行数++;
      continue;
    }
    if (isDeflowerLabel(label)) {
      if (out.破处 === null) out.破处 = parseDeflowerBook(value);
      out.YAML行数++;
      continue;
    }
    if (isNadeLabel(label)) {
      if (out.纳戒 === null) out.纳戒 = parseNade(value);
      out.YAML行数++;
      continue;
    }
    const key = matchField(label);
    if (key) { if (out.fields[key] === undefined) out.fields[key] = value; out.YAML行数++; }   // XML 已写过就不覆盖
    else out.未识别.push(label);
  }

  return out;
}

/**
 * ★ 2026-09-29（主人选 B）：把状态栏 `<实际发生>` 栏里的锚点**自动写进账本**。
 *   · **不弹提示、不问玩家**（主人原话：「由玩家点头很蠢而且很出戏，不需要这种了」）
 *   · 只认 `FIELD_TABLE` 里的字段名（逐字，别名先归一到规范名）；别的串一律**丢弃并打日志**（防模型自己造词）
 *   · **只升不降**：写了 a 就置 a=true，从不置 false（回锁请手工发 `/回锁 <字段>`）
 *   · 幂等：已经是 true 的跳过，不重复写
 *
 * ★★ 2026-10-06（主人令）新增两件事，同在这一趟里做：
 *   ① `<破处>` 破处簿（`女名、破处者`）⇒ 写 `stat_data.破处者`，并翻译成 `stat_data.名器归属`（面板第一优先读）；
 *   ② **成形判据收紧**：名器成形必须由「破处簿」或「〇〇处女丧失」锚点之一坐实；两条都没有时，
 *      先拿正文硬词在该持有者名附近挽救一次，仍查不到 ⇒ **丢弃这一记成形**并打警告。
 *      （堵的是 2026-10-06 那次真机：正文只写了口含解毒，状态栏却报了「九幽玄阴穴成形」。）
 *
 * @param {object} p 状态条解析结果（要用 `里程碑` 与 `破处` 两栏）
 * @param {number} messageId 楼层
 * @param {string} [text] 本回合的完整正文（正文硬词兜底要用；不传则跳过兜底那一步）
 * @returns {Promise<string[]>} 本回合**新置真**的字段名
 */
async function applyMilestones(p, messageId, text) {
  const list = Array.isArray(p?.里程碑) ? p.里程碑 : null;
  const bookIn = Array.isArray(p?.破处) ? p.破处 : [];
  const nadeIn = (p?.纳戒 && typeof p.纳戒 === 'object') ? p.纳戒 : null;
  const nadeHas = Boolean(nadeIn && ((nadeIn.获得 || []).length || (nadeIn.消耗 || []).length));
  if (!list && !bookIn.length && !nadeHas) return [];      // 三栏都没有 ⇒ 什么都不做
  const known = readKnown() || {};
  /* ★ 2026-10-07（同类问题普查）：`<实际发生>` 直报「X处女丧失」也要过**正文实证闸门**。
   *   起因：成形闸门有两条通道，通道②是 `known[X处女丧失] === true` —— 而这个名字模型可以直接写进
   *   `<实际发生>`，绕过 `<破处>` 那道闸门 ⇒ 仍会凭空成形。这里把它堵上（同一套实证判据：本楼正文里
   *   要有该女主，且正文里有破身硬词）。 */
  const proseForAnchor = stripStatusBlock(text);
  const good = [], bad = [], dropped = [], news = [];
  for (const raw of (list || [])) {
    const f = normalizeAnchorName(String(raw).trim());     // 别名归一（破处／元阴被夺…⇒ 处女丧失）
    if (!f) continue;
    if (!ALL_FIELDS.includes(f)) { bad.push(String(raw).trim()); continue; }
    const lm = /^(.+?)处女丧失$/.exec(f);
    if (lm && proseForAnchor) {
      const holder = lm[1];
      const hasName = proseForAnchor.includes(holder);
      const hasHard = DEFLOWER_HARD_RES.some(([re]) => re.test(proseForAnchor));
      if (!hasName || !hasHard) {
        dropped.push(`${f}（正文里${hasName ? '没有破身实证' : `根本没有「${holder}」`}）`);
        console.warn(TAG, `⛔ [破处闸门] 第 ${messageId} 楼丢弃直报的「${f}」：`
          + `${hasName ? '本楼正文里没有破身实证' : `本楼正文里根本没有「${holder}」`} ⇒ 不成形（要手工补发「/解锁 ${f}」）`);
        continue;
      }
    }
    /* ★ 2026-10-07：准入／跳段锚点也要过**正文实证闸门**（见上面 ANCHOR_EVIDENCE 的说明）。
     *   照抄示例、随口一提都不会再打开后段章节。 */
    const ev = anchorEvidenceIn(proseForAnchor, f);
    if (!ev.ok) {
      dropped.push(`${f}（${ev.why}）`);
      console.warn(TAG, `⛔ [锚点闸门] 第 ${messageId} 楼丢弃「${f}」：${ev.why}`
        + `（这条是准入／跳段锚点，凭一句空话不能算它发生。确实发生了就发「/解锁 ${f}」手工补）`);
      continue;
    }
    good.push(f);
    if (known[f] !== true && !news.includes(f)) news.push(f);
  }
  if (list && !list.length) console.log(TAG, `[实际发生] 第 ${messageId} 楼：写了「无」`);
  if (!list) console.log(TAG, `[实际发生] 第 ${messageId} 楼没有这一栏，本轮只处理 <破处>`);
  if (bad.length) {
    console.warn(TAG, `⚠️ [实际发生] 第 ${messageId} 楼有 ${bad.length} 个**不属于字段台账**的名字，已丢弃：${bad.join('、')}`
      + '（只能用状态字段表里那一串；自造词不会被记账）');
  }
  /* ★ 派生（2026-10-04 主人令优化）：
   *   「获得任意名器」＝玩家这条线上第一次真的得到/双修名器。
   *   ⚠️ 若NPC夺得名器（如残阳老怪夺得叶红缨、肉山佛夺得楚灵夜、九皇子夺得孤月），
   *      这属于原著剧情/NTR事件，绝不可替玩家（如赵无忧）派生「获得任意名器」。
   *   ⇒ 仅当名器成形且真正归属玩家当前身份时，才自动补记「获得任意名器」。 */
  const MINGQI_CHENG = ALL_FIELDS.filter((f) => /成形$/.test(f));
  const willTrue = (f) => news.includes(f) || known[f] === true;
  const curPlayerId = readIdentity() || '赵无忧';
  const isCustomExplicit = curPlayerId.includes('自设') || curPlayerId.includes('玩家') || curPlayerId.includes('{{user}}');
  const isZhao = !isCustomExplicit && curPlayerId.includes('赵无忧');
  const isFenyu = curPlayerId.includes('焚欲殿') || curPlayerId.includes('残阳');
  const isHuanxi = curPlayerId.includes('欢喜殿') || curPlayerId.includes('肉山');
  const isZhuolong = curPlayerId.includes('浊龙殿') || curPlayerId.includes('九皇子');
  const isHunhuan = curPlayerId.includes('魂欢殿') || curPlayerId.includes('病相思');
  const isCustom = isCustomExplicit || (!isZhao && !isFenyu && !isHuanxi && !isZhuolong && !isHunhuan);

  /* ★★ 2026-10-06（主人令：「所有名器成型条件都是主人被破身」「归属：破处者是谁，谁就是拥有者」）：
   *   成形只能由两条通道之一坐实 —— ①`<破处>` 破处簿（带人，管归属）②13 个「〇〇处女丧失」锚点。
   *   两条都没有、只在 `<实际发生>` 里报了成形 ⇒ 先查正文硬词挽救（防真破身被漏标误杀），仍无 ⇒ 丢弃。
   *   ⚠️ 旧的那套「NPC 抢占锚点拦截 + 历史污染自愈」整块删除（2026-10-06 主人令），
   *      它引用的 11 个名字从来没进过台账，属死判断。 */

  // ① 破处簿：与历史累积合并（先记的为准，不许模型来回改口）
  const sd0 = readStatData() || {};
  const proseOuter = stripStatusBlock(text);           // 本楼正文（去掉状态栏），破处依据只看它
  /* ★★ 2026-10-07（GPT 复核 §7「分支回退」）：锚点也按楼记账 ⇒ 同一楼内容变了（重生成／切换回复／编辑）
   *   或被删楼时，**把那一楼置真的锚点回滚掉**（别的楼也记过的除外），否则会出现
   *   「物品回滚了、剧情还沿着被撤销的那条回复走」。账本形状：`锚点账本[楼层] = { 指纹, 新置真: [...] }`。 */
  const anchorLog = (sd0.锚点账本 && typeof sd0.锚点账本 === 'object') ? { ...sd0.锚点账本 } : {};
  const anchorFinger = JSON.stringify((list || []).map((x) => normalizeAnchorName(String(x).trim())).filter(Boolean));
  const prevAnchor = anchorLog[String(messageId)] || null;
  const sameAnchorFinger = Boolean(prevAnchor && prevAnchor.指纹 === anchorFinger);
  let anchorLogChanged = false;
  const rollbackAnchors = (floorKey, entry) => {
    for (const f of (entry.新置真 || [])) {
      const elsewhere = Object.keys(anchorLog).some((k) => k !== floorKey && anchorLog[k] && (anchorLog[k].新置真 || []).includes(f));
      if (elsewhere) continue;                       // 别的楼也记过它 ⇒ 不该回滚
      if (known[f] === true) { delete known[f]; rolledBack.push(f); }   // 就地改，后续判定看到的就是回滚后的状态
    }
  };
  const rolledBack = [];
  if (prevAnchor && !sameAnchorFinger) {
    rollbackAnchors(String(messageId), prevAnchor);
    anchorLog[String(messageId)] = null;             // null 墓碑（深合并不认 delete）
    anchorLogChanged = true;
    if (rolledBack.length) console.log(TAG, `[锚点回退] 第 ${messageId} 楼内容变了 ⇒ 回滚这一楼置真的锚点：${rolledBack.join('、')}`);
  }
  const prevBook = (sd0.破处者 && typeof sd0.破处者 === 'object') ? sd0.破处者 : {};
  const mergedBook = Object.assign({}, prevBook);
  let bookChanged = false;
  for (const it of bookIn) {
    const h = it.持有者, w = it.破处者;
    /* ★★ 2026-10-07（照抄示例的同款坑，但后果重得多）：`<破处>` 的写法示例里原本写着
     *   「孤月、赵无忧｜叶红缨、残阳老怪」这种**真名实姓**的样例 ⇒ 模型若照抄，
     *   会凭空记下两处破身、连带两件名器成形、归属还写错人。
     *   ⇒ 这里加**正文依据闸门**：本楼正文里必须出现那位女主，且正文里要有破身硬词（不限距离）。
     *     没有依据的破处记录**一律丢弃**（照抄示例的情形：那位女主压根不在本楼正文里）。 */
    if (proseOuter && !proseOuter.includes(h)) {
      console.warn(TAG, `⛔ [破处闸门] 第 ${messageId} 楼丢弃「${h}、${w}」：本楼正文里根本没有「${h}」（八成是照抄写法示例）。`
        + `真要手工补，发「/解锁 ${h}处女丧失」。`);
      continue;
    }
    const hard = proseOuter ? DEFLOWER_HARD_RES.find(([re]) => re.test(proseOuter)) : null;
    if (proseOuter && !hard) {
      console.warn(TAG, `⛔ [破处闸门] 第 ${messageId} 楼丢弃「${h}、${w}」：本楼正文里没有破身实证（破身／落红／初夜这类字样一个都没有）。`
        + `若确实是含蓄写法，发「/解锁 ${h}处女丧失」手工补。`);
      continue;
    }
    if (!mergedBook[h]) { mergedBook[h] = w; bookChanged = true; }
    else if (mergedBook[h] !== w) {
      console.warn(TAG, `[破处簿] 第 ${messageId} 楼「${h}」已记作「${mergedBook[h]}」，本次的「${w}」不覆盖（先记的为准）`);
    }
  }
  const lost = (holder) => Boolean(mergedBook[holder])
    || known[holder + '处女丧失'] === true || news.includes(holder + '处女丧失');

  /* ★ 2026-10-07（主人令）：个别名器除了「持有者处女丧失」，还要**额外的既成事实**才算成形。
   *   现行一条：【名器】般若菩提菊（楚灵夜）—— 除了破身／破处／元阴被夺，
   *   **还必须被肛交（走后门／后窍开发）过**；两者都真才成形。 */
  /* ⚠️ 键用**持有者**（FORM_OF_HOLDERS 里的 form 带「成形」后缀，用名器名当键会取不到）。 */
  const FORM_EXTRA = {
    楚灵夜: ['楚灵夜后窍开发'],
  };
  const extraOk = (g) => g.holders.every((h) => (FORM_EXTRA[h] || []).every((f) => willTrue(f)));
  const extraWhy = (g) => g.holders.flatMap((h) => FORM_EXTRA[h] || []).join('／');

  // ② 两条通道 → 补成形（跨回合累加：双姝要两个人都丧失才算，先后在不同回合也算）
  for (const g of FORM_OF_HOLDERS) {
    if (!g.holders.every(lost)) continue;
    if (!extraOk(g)) {
      console.log(TAG, `[成形闸门] 「${g.form}」的持有者已丧失，但额外条件未满足（还差：${extraWhy(g)}）⇒ 暂不成形`);
      continue;
    }
    if (willTrue(g.form)) continue;
    news.push(g.form);
    console.log(TAG, `↳ 派生：${g.holders.map((h) => h + '处女丧失').join(' ＋ ')}${extraWhy(g) ? ' ＋ ' + extraWhy(g) : ''} ⇒ 「${g.form}」`);
  }

  /* ★★ 2026-10-07（主人问「纹章激活后，一阶段描述会注入正文吗」）：
   *   答：**光成形不会**。阶段条的闸门是「成形 且 `X一阶段` 且 非二阶段」，而 `X一阶段` 原先没有任何地方派发
   *   ⇒ 面板会显示「【第一阶段】已激活」（面板在无阶段锚点时默认 arcs = 1），但正文里那条触感神韵**根本不会注入**。
   *   补法：**成形（落红／初度）本来就等于"第一阶段已达成" ⇒ 成形当刻自动派发一阶段锚点**，让 HUD 与提示词一致。
   *   ⚠️ 两处特例：① 灵犀同心的阶段锚点写作「灵犀同心**穴**一阶段」（多一个「穴」字）；
   *               ② 烟霞灵乳没有「成形」锚点（主人令：柳含烟出场即第二境）⇒ 不在 FORM_OF_HOLDERS 里，单独补。 */
  const STAGE_PREFIX_FIX = { 灵犀同心: '灵犀同心穴' };
  for (const g of FORM_OF_HOLDERS) {
    if (!willTrue(g.form)) continue;
    const base = g.form.replace(/成形$/, '');
    const prefix = STAGE_PREFIX_FIX[base] || base;
    const firstAnchor = prefix + '一阶段';
    if (!ALL_FIELDS.includes(firstAnchor)) continue;
    if (known[firstAnchor] === true || news.includes(firstAnchor)) continue;
    news.push(firstAnchor);
    console.log(TAG, `↳ 派生：${g.form} ⇒ 「${firstAnchor}」（落红／初度就是第一阶段，成形当刻一并记上，阶段条才进得了正文）`);
  }
  if ((known['烟霞灵乳二阶段'] === true || news.includes('烟霞灵乳二阶段'))
    && known['烟霞灵乳一阶段'] !== true && !news.includes('烟霞灵乳一阶段')) {
    news.push('烟霞灵乳一阶段');
    console.log(TAG, '↳ 派生：烟霞灵乳出场即第二境 ⇒ 补记「烟霞灵乳一阶段」');
  }

  // ③ 冲突消解：只报成形而两条通道都没坐实的，先查正文，再决定挽救还是丢弃
  const rawText = String(text ?? '');
  for (const g of FORM_OF_HOLDERS) {
    const at = news.indexOf(g.form);
    if (at === -1) continue;
    /* ★ 主人令（2026-10-07）：额外条件不满足 ⇒ 就算报了成形也丢弃（例：楚灵夜只是破身、没走后门） */
    if (!extraOk(g)) {
      news.splice(at, 1);
      console.warn(TAG, `⛔ [成形闸门] 第 ${messageId} 楼丢弃「${g.form}」：额外条件未满足（还差：${extraWhy(g)}）。`
        + `要手工补，先「/解锁 ${(g.holders.flatMap((h) => FORM_EXTRA[h] || [])[0])}」再「/解锁 ${g.form}」。`);
      continue;
    }
    if (g.holders.every((h) => Boolean(mergedBook[h]))) continue;                     // 通道①：破处簿
    if (g.holders.every((h) => known[h + '处女丧失'] === true || news.includes(h + '处女丧失'))) continue;  // 通道②：锚点
    const hits = g.holders.map((h) => nearDeflowerWord(rawText, h));
    if (rawText && hits.every(Boolean)) {
      console.log(TAG, `⚠️ [成形闸门] 第 ${messageId} 楼漏标挽救：「${g.form}」没带破处簿与处女丧失锚点，`
        + `但正文里 ${g.holders.map((h, i) => `「${h}」附近出现「${hits[i]}」`).join('、')} ⇒ 按正文实锤放行（归属按身份兜底）`);
      continue;
    }
    news.splice(at, 1);
    console.warn(TAG, `⛔ [成形闸门] 第 ${messageId} 楼丢弃「${g.form}」：破处簿与「${g.holders.join('／')}处女丧失」都没记，`
      + `本回合正文里也查不到落在这几人身上的破身实证。要手工补，发「/解锁 ${g.form}」。`);
  }

  // ④ 破处者簿 → 名器归属表（面板第一优先读 `stat_data.名器归属`）
  const relicOwners = {};
  for (const h of Object.keys(mergedBook)) {
    const r = HOLDER_TO_RELIC[h];
    if (r && !relicOwners[r]) relicOwners[r] = mergedBook[h];
  }
  const ownersChanged = JSON.stringify(sd0.名器归属 || {}) !== JSON.stringify(relicOwners);

  const playerRelicFormed = (function () {
    if (isFenyu) return willTrue('灼酒流炎穴成形') || willTrue('灵犀同心成形');
    if (isHuanxi) return willTrue('般若菩提菊成形') || willTrue('心魔茶璎乳成形');
    if (isZhuolong) return willTrue('九幽玄阴穴成形') || willTrue('玉虎噙香乳成形');
    if (isHunhuan) return willTrue('梅蕊穴成形') || willTrue('凤凰羽花成形');
    if (isZhao) {
      /* ★ 2026-10-06（主人令）：归属改由「破处者是谁」定，这里不再引用那批从来没进过台账的夺取名字。
       *   只问一件事：玩家这条线上有没有名器成形。 */
      if (willTrue('北冥潮生穴成形')) return true;
      if (FORM_OF_HOLDERS.some((g) => willTrue(g.form))) return true;
      return false;
    }
    // 自设身份：自设玩家攻略任意名器均有效
    return MINGQI_CHENG.some(willTrue) || ALL_FIELDS.filter(f => /阶段$/.test(f)).some(willTrue);
  })();

  if (playerRelicFormed && known['获得任意名器'] !== true && !news.includes('获得任意名器')) {
    news.push('获得任意名器');
    console.log(TAG, `↳ 派生：玩家身份（${curPlayerId}）已有名器成形 ⇒ 记下「获得任意名器」`);
  }
  // 检查随剧情锚点推进获得的物品
  const sd = readStatData() || {};
  let inv = Array.isArray(sd.inventory) ? sd.inventory.slice() : defaultInventoryFor(curPlayerId);
  let invChanged = false;
  if (curPlayerId === '自设') {
    inv = inv.map(it => {
      if (!it || !it.name) return it;
      if (it.name === '墨山道佩剑') {
        invChanged = true;
        return { name: '随身青锋剑', desc: '入世防身佩剑，剑身清寒。', full: '随身淬炼多年的上好青锋剑，寒芒如雪，指使如臂，无论御剑凌风或近身防卫皆得心应手。' };
      }
      if (it.name === '醉春风' && it.full && (it.full.includes('赵无忧') || it.full.includes('红缨师姐'))) {
        invChanged = true;
        return { name: '醉春风', desc: '南域佳酿两坛，酒香浓醇，可解忧畅怀。', full: '南域仙坊颇具盛名的上等灵酿「醉春风」，甘冽清醇，入口温润，最解行者客愁，为云游修士随身常备佳品。' };
      }
      return it;
    });
  }
  const hasItem = (nm) => inv.some((it) => it && (it.name === nm || (it.name && it.name.includes(nm))));
  /* ★ 2026-10-07（同类问题普查）——
   *   ① 删掉「封元镇灵环」那条派发规则：那只环是**叶红缨身上**的东西，锚点（「乳环当众暴露」）
   *      一旦被模型写成真（实战里正文只是私下撩拨也会被记），环就自动进了**赵无忧的**纳戒，
   *      而且它同时是跳段锚点 ⇒ 段位会一路爬到第 12 段。**归属错 + 进度串章，两样都不该有。**
   *       「他知道了这件东西」由【物品】封元镇灵环 条目承担（闸门 `赵无忧看见乳环`，与本规则无关）。
   *   ② 剩下两条派发改成**只派发一次**（`stat_data.派发记录`）：原来只要锚点为真、纳戒里没有就每轮补，
   *      玩家一旦 `/消耗物品 冰心泪`，下一轮它就自己长回来。 */
  const dispatched = (sd.派发记录 && typeof sd.派发记录 === 'object') ? { ...sd.派发记录 } : {};
  let dispatchChanged = false;
  if (willTrue('极乐引入手') && !hasItem('极乐引') && !dispatched['极乐引残篇']) {
    inv.push({ name: '《极乐引》残篇', desc: '记载天下诸般名器与双修造化之无上秘录。', full: '极乐楼不传之秘，封面柔韧若人皮，载有世间至阴至纯名器录与落红、情动、沉沦之境。能辨诸姝体质，演极乐造化。' });
    invChanged = true;
    dispatched['极乐引残篇'] = messageId;
    dispatchChanged = true;
  }
  if ((willTrue('赠送冰心泪') || willTrue('孤月定情')) && !hasItem('冰心泪') && !dispatched['冰心泪']) {
    inv.push({ name: '冰心泪', desc: '孤月亲炼相赠的护神法器项链，清凉温润。', full: '墨山道四弟子孤月以本源寒气与灵髓精炼之成对法器，戴于颈间可清心宁神、抵御诸邪侵袭与心魔扰动。' });
    invChanged = true;
    dispatched['冰心泪'] = messageId;
    dispatchChanged = true;
  }
  /* ★★ 2026-10-06（主人报「我明明写了和人一起喝了，酒还在物品栏」；同日夜按 GPT 复核重做）：
   *   `<纳戒>` 栏 → 增删 `stat_data.inventory`，并且**按「每层楼的账」记进 `stat_data.纳戒账本`**：
   *   ① 同一楼重跑（重生成／切换回复／编辑后重渲染）⇒ **先回滚该楼旧账，再施加新账**，不重复扣；
   *   ② 楼被删 ⇒ 对账（`reconcileNadeLedger`）时回滚；
   *   ③ 扣减有校验：不许扣成负数，扣到 0 才移出纳戒；找不着那一件只告警。
   *   ⚠️ 面板 `renderInventory()` 只显示，不动数据。 */
  const nadeLog = (sd0.纳戒账本 && typeof sd0.纳戒账本 === 'object') ? { ...sd0.纳戒账本 } : {};
  const nadeFinger = nadeIn ? JSON.stringify([(nadeIn.消耗 || []).map((x) => [x.name, x.count]), (nadeIn.获得 || []).map((x) => [x.name, x.count])]) : '';
  const prevEntry = nadeLog[String(messageId)] || null;
  const sameFinger = Boolean(prevEntry && prevEntry.指纹 === nadeFinger);
  let ledgerChanged = false;
  if (prevEntry && !sameFinger) {
    /* ① 这一楼的内容变了（重生成／切换回复／编辑，或这一栏被撤掉）⇒ **先回滚旧账** */
    for (const x of (prevEntry.消耗 || [])) {
      inv = applyItemChange(inv, { kind: 'gain', name: x.name, count: x.count }).inv;   // 消耗过的加回来
    }
    for (const x of (prevEntry.获得 || [])) {
      inv = applyItemChange(inv, { kind: 'loss', name: x.name, count: x.count }).inv;   // 获得过的扣回去
    }
    /* ⚠️ 必须先抹掉这一楼的账，否则下一趟会把同一笔旧账再回滚一次。
     *   GPT 复核 §7-③ 提醒：TavernHelper 的写入是**深合并**，`delete` 掉键再写回整表，
     *   旧键可能仍留在存储里 ⇒ 改成**写 null 墓碑**（深合并会把该键覆盖成 null，
     *   而所有读账本的地方都用 `|| null` / `&& typeof === 'object'` 过滤，null 一律当"没有这笔账"）。 */
    nadeLog[String(messageId)] = null;
    invChanged = true;
    ledgerChanged = true;
    console.log(TAG, `[纳戒] 第 ${messageId} 楼内容变了 ⇒ 先回滚旧账（消耗 ${(prevEntry.消耗 || []).length} 项／获得 ${(prevEntry.获得 || []).length} 项）再重算`);
  } else if (sameFinger) {
    console.log(TAG, `[纳戒] 第 ${messageId} 楼这一栏与上次一致 ⇒ 不重复入账（幂等）`);
  }
  if (nadeIn && !sameFinger) {
    const done消耗 = [], done获得 = [];
    /* ★★ 2026-10-07（主人报：正文完全没提酒，可 `<纳戒>` 每楼都在写「消耗：醉春风×1」，两坛酒被抄例子抄光）：
     *   根因是我给的**写法示例里带了真实物品名**，模型把示例当成模板照抄。
     *   两道防线一起上：① 提示词的示例改成中性占位、并写明「正文里没有这一笔就不许写」；
     *   ② 这里加**正文依据校验** —— 正文（去掉状态栏那一段）里找不到这一笔的，直接丢弃并告警。 */
    const prose = stripStatusBlock(text);
    for (const x of (nadeIn.消耗 || [])) {
      if (!itemEvidenceIn(prose, x.name)) {
        console.warn(TAG, `[纳戒] 第 ${messageId} 楼报的「消耗：${x.name}」在正文里找不到依据 ⇒ **丢弃**（八成是照抄写法示例；真要扣，发 /消耗物品 ${x.name}）`);
        continue;
      }
      const r = applyItemChange(inv, { kind: 'loss', name: x.name, count: x.count });
      inv = r.inv;
      if (r.ok) {
        invChanged = true;
        done消耗.push({ name: r.name, count: r.applied });
        console.log(TAG, `[纳戒] 第 ${messageId} 楼消耗「${r.name}」×${r.applied}（${r.note}）`);
      } else {
        console.warn(TAG, `[纳戒] 第 ${messageId} 楼要消耗「${x.name}」，纳戒里没有这一件（已忽略）`);
      }
    }
    for (const it of (nadeIn.获得 || [])) {
      if (!itemEvidenceIn(prose, it.name)) {
        console.warn(TAG, `[纳戒] 第 ${messageId} 楼报的「获得：${it.name}」在正文里找不到依据 ⇒ **丢弃**（真要加，发 /获得物品 ${it.name}）`);
        continue;
      }
      const r = applyItemChange(inv, { kind: 'gain', name: it.name, count: it.count || 1, desc: it.desc, full: it.full });
      inv = r.inv;
      if (r.ok) {
        invChanged = true;
        done获得.push({ name: r.name, count: r.applied });
        console.log(TAG, `[纳戒] 第 ${messageId} 楼收入「${r.name}」×${r.applied}`);
      }
    }
    if (done消耗.length || done获得.length) {
      nadeLog[String(messageId)] = { 指纹: nadeFinger, 消耗: done消耗, 获得: done获得 };
      ledgerChanged = true;
    }
  }
  inv = normalizeInventory(inv);
  if (ledgerChanged) invChanged = true;

  const needOwnerWrite = ownersChanged && Object.keys(relicOwners).length > 0;
  if (!news.length && !bookChanged && !needOwnerWrite && !invChanged && !dispatchChanged) {
    console.log(TAG, `[实际发生] 第 ${messageId} 楼：${good.join('、') || '（无）'} —— 都已在账本里，无需写盘`);
    return [];
  }
  const patch = { known: {} };
  for (const f of news) patch.known[f] = true;
  if (bookChanged || needOwnerWrite) {
    patch.破处者 = mergedBook;
    patch.名器归属 = relicOwners;
  }
  /* 记录本楼新置真的锚点（供回退用）；指纹一致时跳过（幂等） */
  if (!sameAnchorFinger && news.length) {
    anchorLog[String(messageId)] = { 指纹: anchorFinger, 新置真: news.slice() };
    anchorLogChanged = true;
    patch.锚点账本 = anchorLog;
  }
  if (invChanged) patch.inventory = inv;
  if (dispatchChanged) patch.派发记录 = dispatched;
  if (ledgerChanged) patch.纳戒账本 = nadeLog;
  if (anchorLogChanged) patch.锚点账本 = anchorLog;
  if (rolledBack.length) { patch.known = patch.known || {}; for (const f of rolledBack) patch.known[f] = false; }
  const r = await writeStat(patch, `第 ${messageId} 楼 <实际发生>/<破处> 自动记账${invChanged ? '（含纳戒更新）' : ''}`);
  if (r && r.ok) {
    console.log(TAG, `✅ [实际发生] 第 ${messageId} 楼自动解锁 ${news.length} 个锚点：${news.join('、') || '（无）'}（via ${r.via}）`
      + (bookChanged ? ` 破处簿 +${bookIn.length} 条` : '')
      + (needOwnerWrite ? ` 名器归属 = ${JSON.stringify(relicOwners)}` : '')
      + (invChanged ? ' 纳戒物品已更新' : ''));
    return news;
  }
  console.warn(TAG, `❌ [实际发生] 第 ${messageId} 楼自动解锁失败（${news.join('、')}）：${(r && r.why) || '变量接口不可用'}`);
  return [];
}

/**
 * 把解析结果并入 `stat_data`。
 *   · 展示型字段（时间／历时／地点／天气／环境／在场／暗处／修为／状态／目标／局势／
 *     线索／近闻／远闻／危机／关系刻度）**直接覆盖**
 *   · `在场角色`（`<角色N>` 子块聚合成的数组）**整组覆盖**；空数组不写
 *   · `身份`／`阵营` —— **只告警、绝不覆盖**（由 /身份 写）
 *   · `进度` 只做一致性校验，**不写变量**
 * ⚠️ 只在 `MESSAGE_RECEIVED`（message_id > 0）时调用。
 */
async function applyStatusToVars(text, messageId) {
  // ⓪ 独立提取阶段总结与结算（即使没有状态栏，只要有结算/总结就必须存下来）
  const sumMatch = /<(?:阶段总结|结算)>([\s\S]*?)<\/(?:阶段总结|结算)>/.exec(text);
  const capturedSummary = (sumMatch && sumMatch[1].trim()) ? sumMatch[1].trim() : null;
  if (capturedSummary) {
    console.log(TAG, `[阶段总结] 第 ${messageId} 楼捕获阶段纪事存档（${capturedSummary.length} 字）`);
  }

  const p = parseStatusBlock(text);
  /* ★ 2026-10-06：每楼开始前先对一次纳戒账本（把已被删掉的那几楼的账回滚） */
  try { await reconcileNadeLedger(`第 ${messageId} 楼前`); } catch (e) { console.warn(TAG, '[纳戒对账] 失败（已吞掉）：', msgOf(e)); }
  if (!p.found) {
    console.log(TAG, `[状态条] 第 ${messageId} 楼没有状态条（<Status_block>／<status>／<StatusBlock> 都没找到），启动容错保底时钟推进`);
    try { await ensureInit(`第 ${messageId} 楼前·容错`); } catch (e) {}
    try {
      const sdNow = readStatData() || {};
      const pin = (sdNow[FLOOR_PIN] && typeof sdNow[FLOOR_PIN] === 'object') ? sdNow[FLOOR_PIN] : null;
      const floorStg = stageOfFloor(messageId, pin ? pin.shift : 0);
      // ★ 关键：保持已有高段位，绝不倒退！
      const curStage = Math.max(1, Number(sdNow.段位) || floorStg);
      const segIdx = Math.max(0, Math.min(SEG_TIME.length - 1, curStage - 1));
      const baseT = SEG_TIME[segIdx];
      const patch = {
        段位: curStage,
        仙盟历: baseT,
        仙盟历文: fmtXianmeng(baseT)
      };
      if (capturedSummary) {
        patch.阶段总结 = capturedSummary;
        patch.结算待办 = 0;
        patch.总结待办 = 0;
      }
      await writeStat(patch, `第 ${messageId} 楼容错保底推进${capturedSummary ? '（含阶段总结）' : ''}`);
    } catch (err) {
      console.warn(TAG, `[状态条·容错保底] 异常：`, msgOf(err));
    }
    return null;
  }
  console.log(TAG, `[状态条] 第 ${messageId} 楼：YAML 行 ${p.YAML行数} 条 ｜ XML 标签 ${p.XML标签数} 个 ｜ 归并出 ${Object.keys(p.fields).length} 个字段`);

  /* ⚠️ v1.5（2026-09-28）：**账本自愈**。
   * 起因（真机）：9/27 那局启动自检跑了、身份也写进去了，但 `known` 13 个字段**一个都没落地**
   *   ⇒ 「进度」校验拿空账本做差集，于是每一楼都报「状态条多写：天姝会存在」，提示变成噪音。
   * 根因是 boot 那条路只有「加载后 1500ms 一次」＋「滑开场白」两个入口，跑早／跑空就再也没有补的机会。
   * 现在：**每楼开始前都过一遍 ensureInit**（字段齐全时它只做一次读盘就 return，成本可忽略），
   *   帐本缺就当场补齐，并把「补了什么／补失败」明确打进 console —— 不再静默。 */
  try { await ensureInit(`第 ${messageId} 楼前`); }
  catch (e) { console.warn(TAG, `[初始化·第 ${messageId} 楼前] 失败（已吞掉，不影响本轮记账）：`, msgOf(e)); }

  // ① 展示型字段（解析器把空值记成空串；**空串不写**，免得一行「—」把账本擦掉）
  const patch = {};
  const blanks = [];
  for (const k of DISPLAY_FIELDS) {
    if (p.fields[k] === undefined) continue;
    if (p.fields[k] === '') { blanks.push(k); continue; }
    patch[k] = p.fields[k];
  }
  if (blanks.length) console.log(TAG, `[状态条] 第 ${messageId} 楼这些字段是空值，保留旧值：${blanks.join('、')}`);
  /* ①c 段位：以楼层为保底下限，支持事件提前推进，沉浸场景自动驻留等待，每 15 楼/换段触发总结存档 */
  {
    const sdNow = readStatData() || {};

    // ★ 捕获阶段总结与存档：成功捕获后清除待办，未捕获时不主动清零
    if (capturedSummary) {
      patch.阶段总结 = capturedSummary;
      patch.结算待办 = 0;
      patch.总结待办 = 0;
      console.log(TAG, `[阶段总结] 第 ${messageId} 楼成功捕获阶段纪事存档（${capturedSummary.length} 字），已持久化进账本并清除待办`);
    }

    let pin = (sdNow[FLOOR_PIN] && typeof sdNow[FLOOR_PIN] === 'object') ? sdNow[FLOOR_PIN] : null;
    // 智能继承兜底（针对首几楼直接发大总结但未触发 MESSAGE_SENT 事件的环境）
    if (!pin && Number(messageId) <= 3 && (Number(sdNow.段位) || 1) <= 2) {
      const prevUserText = messageText(messageId - 1);
      if (prevUserText) {
        const inh = detectInheritance(prevUserText, messageId - 1);
        if (inh && inh.isInherited) {
          await applyInheritedArchive(prevUserText, messageId - 1);
          const sdReload = readStatData() || {};
          pin = (sdReload[FLOOR_PIN] && typeof sdReload[FLOOR_PIN] === 'object') ? sdReload[FLOOR_PIN] : null;
          Object.assign(sdNow, sdReload);
        }
      }
    }
    const floorStg = stageOfFloor(messageId, pin ? pin.shift : 0);
    /* ★ 2026-10-07（GPT 复核 §4）：段位要与**本楼的新锚点同批**算 ——
     *   否则下一次生成会同时拿到「新锚点打开的后段剧情」与「旧段位渲染的【阶段驱动】」，两边打架。
     *   做法：把本楼 <实际发生> 里报上来的锚点先并进一份临时 known，再交给跳段判定。 */
    const knownAhead = Object.assign({}, sdNow.known || {});
    for (const raw of (Array.isArray(p && p.里程碑) ? p.里程碑 : [])) {
      const f = normalizeAnchorName(String(raw).trim());
      if (f) knownAhead[f] = true;
    }
    const ffStg = checkFastForwardStage(knownAhead, floorStg);
    const stg = Math.max(floorStg, ffStg);

    if (stg >= 1) {
      /* ★ 2026-10-07（GPT 复核 §6）状态校验三连：
       *   ① 段位必须是 1..16 的整数（旧值可能是 2.5、字符串、越界）；
       *   ② 旧段位**缺失**时不许直接按楼层初始化（第 300 楼会一下变成第 14 段、绕过逐段推进）⇒ 从低处起；
       *   ③ 窗口起点必须是「过去某一楼」，落在未来或非数就复位。 */
      const curRaw = Number(sdNow.段位);
      const curValid = Number.isFinite(curRaw) && curRaw >= 1;
      if (!curValid) {
        console.warn(TAG, `[段位] 第 ${messageId} 楼旧段位无效（${String(sdNow.段位)}）⇒ 按保底重新起步（不超过第 2 段），逐段推进`);
      }
      let cur = curValid ? Math.min(16, Math.max(1, Math.round(curRaw))) : Math.min(stg, 2);
      let want = stg;

      // 使用连续绝对月数判断段位跃升（跨年无缝衔接）
      const accP = Number(sdNow.时点加速);
      const addedMonths = (isFinite(accP) ? Math.max(0, accP) : 0) + parseLishi(patch.历时);
      const curTotalM = ymToMonths(SEG_TIME[Math.max(0, Math.min(SEG_TIME.length - 1, cur - 1))]) + addedMonths;
      for (let i = 0; i < SEG_TIME.length; i++) {
        if (curTotalM >= ymToMonths(SEG_TIME[i]) - 1e-6) want = Math.max(want, i + 1);
      }

      /* 核心机制：章节等待玩家（场景驻留锁）。交合/私密温存进行中，段位暂缓推进，等待戏份收尾。
       * ★ GPT §6 反例：若场景一直被判定为"进行中"，段位可以永久不升 ⇒ 这里加**最长驻留**（6 楼）。 */
      const locked = isSceneLocked(text, p.fields);
      let lockStart = Number(sdNow.锁起点) || 0;
      if (locked) {
        if (!lockStart || lockStart < 1 || lockStart > messageId) { lockStart = messageId; patch.锁起点 = lockStart; }
      } else if (lockStart) { patch.锁起点 = 0; lockStart = 0; }
      const lockTooLong = locked && lockStart > 0 && (messageId - lockStart >= 6);
      if (locked && want > cur && !lockTooLong) {
        console.log(TAG, `[章节等待] 第 ${messageId} 楼检测到私密交合/沉浸互动进行中，段位暂缓推进（保持第 ${cur} 段），等待玩家本场戏份完成`);
        want = cur;
      } else if (lockTooLong && want > cur) {
        console.warn(TAG, `⚠️ [章节等待] 第 ${messageId} 楼：本场戏已连续 ${messageId - lockStart} 楼被判定为"进行中" ⇒ 达最长驻留（6 楼），照常推进段位，避免永久卡段`);
      }
      want = Math.min(want, cur + 1);   // ★ 限制前瞻：一次只前瞻并前进一段

      let wf = Number(sdNow.窗口起点) || 0;
      if (wf && (wf < 1 || wf > messageId)) {
        console.warn(TAG, `[窗口] 第 ${messageId} 楼窗口起点异常（${sdNow.窗口起点}）⇒ 复位`);
        wf = 0;
      }
      if (want > cur) {
        if (!wf) { wf = messageId; }
        else if (messageId - wf >= 3) { cur += 1; wf = (cur < want) ? messageId : 0; }
      } else { wf = 0; }

      patch.窗口起点 = wf;
      patch.段位 = cur;
      if (cur !== stg) { console.log(TAG, `[窗口] 第 ${messageId} 楼：本段收尾窗口（起点 ${wf || '已闭'}）⇒ 段位 ${stg} → ${cur}`); }

      const isStageChanged = cur !== (Number(sdNow.段位) || stg);
      const isSummaryInterval = (Number(messageId) > 0 && Number(messageId) % 15 === 0);
      if (isStageChanged || isSummaryInterval) {
        patch.结算待办 = 1;
        patch.总结待办 = 1;
        console.log(TAG, `[总结/结算] 第 ${messageId} 楼已置待办（${isStageChanged ? `段位跃升至 ${cur}` : '周期到达 15 楼'}）`);
      }

      /* ①d 时点 ＝ 绝对连续月数 ＋ 累计历时加速（按月/天高精度累计，杜绝跨年与小步长舍入归零） */
      const segIdx = Math.max(0, Math.min(SEG_TIME.length - 1, (patch.段位 || stg) - 1));
      /* ★ 2026-10-07（GPT 复核采纳 4a）：日历与段位**脱钩** —— 基准日固定为《设定》正篇起点 1578 年三月，
       *   不再取 `SEG_TIME[段位]`，所以段位跳段/追赶时日历不会再跟着跳月。 */
      /* ★★ 2026-10-07（主人令「四点一起改」）：时钟基准**按身份**，自设线由玩家自选。
       *   赵无忧＝1578 年三月初三（《设定》正篇起点，日取主人给的开局日期）；
       *   四殿主＝1578 年八月初一（大劫降临，殿主线固定，主人确认没问题）；
       *   自设／未登记身份＝**读玩家填的日期**（开场白「当前时点」那一栏／首楼 <时间>），解析不到才兜底 1578 年三月初一。 */
      const CAL_START_BY_ID = {
        赵无忧: { ym: 1578.03, day: 3 },
        焚欲殿主: { ym: 1578.08, day: 1 }, 浊龙殿主: { ym: 1578.08, day: 1 },
        欢喜殿主: { ym: 1578.08, day: 1 }, 魂欢殿主: { ym: 1578.08, day: 1 },
      };
      const idNow = String(sdNow.身份 || '');
      let basis = Number(sdNow.历基准) || 0;      // 存「年.月」＋日的合成月数
      if (!basis) {
        const fixed = CAL_START_BY_ID[idNow];
        if (fixed) {
          basis = ymToMonths(fixed.ym) + (fixed.day - 1) / 30;
        } else {
          /* ★ P1(gpt)：**只认唯一一行**「• 当前时点：<值>」——不再读当前 AI 正文、不再读第 1 楼；
           *   找不到就用共享默认（1578 年三月初三），不做初一静默兜底。 */
          const uni = pickTimepointLine(text);
          const pick = uni ? parseXianmengFromText(uni) : null;
          basis = pick ? (ymToMonths(pick.ym) + (pick.day - 1) / 30) : (ymToMonths(1578.03) + 2 / 30);
          console.log(TAG, `[时间基准] 第 ${messageId} 楼：${idNow || '（未登记身份）'} ⇒ 基准 ${pick ? fmtXianmeng(pick.ym) + CN_DAY[pick.day] : '1578 年 · 初三（共享默认）'}${uni ? '' : '｜未找到唯一「• 当前时点：」行'}`);
        }
        patch.历基准 = basis;
      }
      const curBaseM = basis;
      /* ★ P1(gpt) C：日历**不再**与段位时间表挂钩 —— 原来这里用 `SEG_TIME[segIdx+1]` 算 monthSpan，
       *   缺状态栏/换段时会按段位把日历推走。现在整条 `SEG_TIME → 日历` 的通路已切断（monthSpan 为死代码，删除）。 */

      // 若同楼发生重绘/修改，基于本楼原始基准重新累计，防止重复叠加
      /* ★ P1(gpt) D：日历读**全程累计** `历时累计`（旧档没有该字段时沿用旧 `时点加速`），
       *   换段**不再清空**它；`时点加速` 保留给段位推进的原语义，两者分开。 */
      let acc = (Number(sdNow.历时累计) || Number(sdNow.时点加速) || 0);
      if (Number(sdNow.最后处理楼号) === Number(messageId)) {
        acc = Math.max(0, acc - (Number(sdNow.本楼历时加速) || 0));
      }
      if (isStageChanged || !isFinite(acc) || acc < 0) acc = 0;
      /* ★ P1(gpt) D：换段**不再**清零日历累计量（原来清 `时点加速` ⇒ 已有 0.4 月被清成 0，等于丢 12 日、日期倒退）。 */

      const stepM = parseLishi(patch.历时);
      /* ★ 4a：小步（一段路／一场谈话）最多 ≈14 小时；出现明确过渡词才允许多日/多月。 */
      const hasTransit = LISHI_TRANSIT_RE.test(String(patch.历时 || '') + ' ' + String(rawText || '').slice(0, 400));
      const capM = hasTransit ? LISHI_CAP_TRANSIT : LISHI_CAP;
      let adv = 0;
      if (stepM > 0) {
        adv = Math.min(stepM, capM);
        acc = Math.round((acc + adv) * 10000) / 10000;
        patch.历时累计 = acc;   // ★ P1(gpt) D：全程累计（不因换段清零）
        patch.最后处理楼号 = Number(messageId);
        patch.本楼历时加速 = adv;
      } else {
        patch.最后处理楼号 = Number(messageId);
        patch.本楼历时加速 = 0;
      }
      patch.仙盟历 = monthsToYm(curBaseM + acc);
      /* ★ 4a ＋ 主人令：把「日」算出来一起写进 `仙盟历文`（状态栏《时间》一栏照抄它，含年月日）。 */
      const dayOfMonth = 1 + Math.floor((((curBaseM + acc) % 1) + 1) % 1 * 30 + 1e-9);
      patch.仙盟历文 = fmtXianmengDay(patch.仙盟历, dayOfMonth);
      console.log(TAG, `[段位] 第 ${messageId} 楼 ⇒ 第 ${patch.段位 || stg} 段（楼下限 ${stg}）${pin ? `（时间轴已平移 ${pin.shift} 楼）` : ''}｜历时「${patch.历时 || '—'}」⇒ +${adv}月（累计 ${acc}月／本段跨度 ${monthSpan}月）｜仙盟历 ${patch.仙盟历文}（${patch.仙盟历}）`);
    } else {
      console.warn(TAG, `[段位] 第 ${messageId} 楼算不出段位（楼层号异常），本轮不写 —— 渲染侧会按第 1 段兜底`);
    }
  }
  // ①b 在场角色：子块聚合成的**数组**，整组覆盖写。
  //     ⚠️ 空数组**不写** —— 一楼没写子块（或全是「无」）不该把上一楼的速写擦掉。
  if (Array.isArray(p.在场角色) && p.在场角色.length) {
    patch[CAST_FIELD] = p.在场角色;
  } else {
    console.log(TAG, `[状态条] 第 ${messageId} 楼没有可用的 <角色N> 子块，${CAST_FIELD} 保持旧值`);
  }
  if (Object.keys(patch).length) {
    await writeStat(patch, `第 ${messageId} 楼状态条（展示栏）`);
  } else {
    console.log(TAG, `[状态条] 第 ${messageId} 楼没解析到任何可写的展示栏字段`);
  }
  if (p.未识别.length) console.warn(TAG, `[状态条] 第 ${messageId} 楼有没归进面板的标签：${p.未识别.join('、')}`);

  // ② 身份／阵营：只告警，绝不覆盖
  warnIdentityMismatch(p, messageId);

  // ③ 进度一致性校验（只告警，不写变量）
  checkProgressConsistency(p, messageId);

  // ④ ★ 2026-09-29（主人选 B）：`<实际发生>` → **自动写账本**（不弹提示、不问玩家）
  //    ★ 2026-10-06：同一趟里处理 `<破处>` 破处簿（成形与归属的唯一正经来源），
  //      所以要把正文一起传进去 —— 报成形却漏标时，靠正文硬词兜底挽救。
  try { await applyMilestones(p, messageId, text); }
  catch (e) { console.warn(TAG, `[实际发生] 第 ${messageId} 楼自动记账失败（已吞掉）：`, msgOf(e)); }

  // ⑤ 广播通知面板刷新
  try {
    const fill = (typeof window !== 'undefined' && typeof window.__xsdFillPanel === 'function')
      ? window.__xsdFillPanel
      : ((typeof window !== 'undefined' && window.parent && typeof window.parent.__xsdFillPanel === 'function')
        ? window.parent.__xsdFillPanel : null);
    if (fill) fill(messageId, text);
  } catch (e) { /* 忽略 */ }
  try {
    const refresh = (typeof window !== 'undefined' && typeof window.__xsdRefreshRelics === 'function')
      ? window.__xsdRefreshRelics
      : ((typeof window !== 'undefined' && window.parent && typeof window.parent.__xsdRefreshRelics === 'function')
        ? window.parent.__xsdRefreshRelics : null);
    if (refresh) refresh();
  } catch (e) { /* 忽略 */ }

  return p;
}

/** 正文里写了身份／阵营，且与已设值不同 ⇒ 记一条警告（**不写变量**） */
function warnIdentityMismatch(p, messageId) {
  const shown = p.fields['身份'];
  const cur = readIdentity();
  if (shown) {
    const hit = IDENTITY_NAMES.find((n) => shown.includes(n));
    if (hit && cur && hit !== cur) {
      console.warn(TAG, `⚠️ [身份] 第 ${messageId} 楼的状态条写的是「${hit}」，与已设「${cur}」不一致 —— **不覆盖**。`
        + `要换请发 /身份 ${hit}，或点第 0 楼的菜单。`);
      toast('warning', `状态条里的身份是「${hit}」，但当前是「${cur}」——已保持原值（要换发「身份 ${hit}」）`, 12000);
    } else if (!hit && cur && cur !== '自设' && !shown.includes(cur)) {
      console.warn(TAG, `⚠️ [身份] 第 ${messageId} 楼的状态条写了「${shown}」，认不出是哪个身份（当前「${cur}」）—— 仅记录，不动变量。`);
    }
  }
  // 阵营：状态条一般不写它；真写了（YAML 或 XML 写法）且与已设不同就记一笔，**不写变量**
  const curFaction = readFaction();
  const shownFaction = findDeclaredFaction(p.raw);
  if (shownFaction && curFaction && shownFaction !== curFaction) {
    console.warn(TAG, `⚠️ [阵营] 第 ${messageId} 楼的状态条写着「${shownFaction}」，与已设「${curFaction}」不一致 —— **不覆盖**（随 /身份 一起写）。`);
  }
}

/** 从状态条原文里找「阵营」的声明值（YAML 与 XML 两种写法都认），找不到返回 null */
function findDeclaredFaction(raw) {
  const t = String(raw ?? '');
  const m1 = t.match(/^[^\S\r\n]*阵营[^\S\r\n]*[：:][^\S\r\n]*(.+)$/m);
  if (m1) return m1[1].trim();
  const m2 = t.match(/<阵营>([^<]*)<\/阵营>/);
  if (m2) return String(m2[1]).trim();
  return null;
}

/**
 * 「进度」栏一致性校验：状态条若写了 `进度：X、Y`，与**真值**做差集。
 * ⚠️ 真值 ＝ **账本 ∪ 本回合 `<实际发生>`**（2026-10-01 主人定：「有模型记账才是对的」）。
 *   旧判据只比账本，而 `applyStatusToVars` 里本函数跑在 `applyMilestones()` **之前** ⇒
 *   正常一轮（模型同时写「进度」与 `<实际发生>`）必报「多写」；账本里的老锚点又必报「漏写」
 *   —— 两侧都是误报，玩家每轮被弹一次。现在把本回合实际发生并进真值，「多写」才等于"真·空谈"。
 * ⚠️ 「漏写」**不再提示**：`进度` 栏是接戏线索，**不是全量清单**，没列全是正常的。
 * ⚠️ 不一致**只 console.warn ＋ toastr 提示，绝不写变量**。
 */
function checkProgressConsistency(p, messageId) {
  if (p.进度 === null) return;                       // 没有这一行 ⇒ 不校验
  const known = readKnown() || {};
  const truth = ALL_FIELDS.filter((f) => known[f] === true);
  const thisRound = Array.isArray(p.里程碑)
    ? p.里程碑.map((x) => String(x).trim()).filter((f) => ALL_FIELDS.includes(f))
    : [];
  const merged = Array.from(new Set(truth.concat(thisRound)));
  const claimed = p.进度.filter((f) => ALL_FIELDS.includes(f));
  const bogus = p.进度.filter((f) => !ALL_FIELDS.includes(f));
  const onlyClaimed = claimed.filter((f) => !merged.includes(f));   // 账本没有、本回合也没实际发生 ⇒ 真·空谈
  if (!onlyClaimed.length && !bogus.length) {
    console.log(TAG, `[进度校验] 第 ${messageId} 楼：一致（账本 ${truth.length} 项，本回合实际发生 ${thisRound.length} 项）`);
    return;
  }
  const parts = [];
  if (onlyClaimed.length) parts.push(`状态条写了但账本与本回合 <实际发生> 里都没有：${onlyClaimed.join('、')}`);
  if (bogus.length) parts.push(`不是锚点字段：${bogus.join('、')}`);
  console.warn(TAG, `⚠️ [进度校验] 第 ${messageId} 楼：${parts.join('；')}。`
    + `**只告警，不写变量**（账本由模型在 <实际发生> 里报、脚本自动记账；玩家发「解锁」是手工通道）。`);
  // 仅在控制台记录排障信息，不再弹窗打断玩家沉浸感
}

/* ═══════════════════════════════════════════════════════════
 * 七 · 收尾自检
 * ═══════════════════════════════════════════════════════════ */

/**
 * 每轮 AI 消息的收尾自检：**只查状态条**（本版不再要求任何变量块，模型也不该输出）。
 *   状态条的三种外壳任一存在即算合格：`<Status_block>` ／ `<StatusBlock>` ／ `<status>`。
 * ⚠️ 开场楼（第 0 楼，或正文带 `<IdentityPick>` 的身份楼）本来就没有状态条之外的收尾，
 *    直接跳过 —— 否则每换一次身份都会误报「回复可能被截断」。
 */
function checkOutputContract(text, messageId) {
  const t = String(text ?? '');
  /* ⚠️ 开场楼（0 楼）、身份楼、以及换段结算楼（主人令：换段楼不输出状态栏只输出 <结算>）免检 */
  if (Number(messageId) === 0 || /<IdentityPick/.test(t) || /<结算/.test(t)) return;
  if (hasStatusBlock(t)) return;
  const tail = t.trim().slice(-24);
  console.warn(TAG, `⚠️ 第 ${messageId} 楼缺少状态条（<Status_block>／<StatusBlock>／<status> 都没有）—— 多半是回复被截断了。末尾是「${tail}」`);
  toast('warning', '本轮缺少状态栏，回复可能被截断（可发 /continue 续写）', 12000);
}

/* ═══════════════════════════════════════════════════════════
 * 八 · 世界书身份条目开关（开其一、关其余）
 * ═══════════════════════════════════════════════════════════ */

/**
 * 把世界书里「【身份】…」条目的开关拨到选中那条。
 * ⚠️ 为什么要有这一步：`@@if` 闸门只能保证「内容不进上下文」，世界书面板里 6 条**都显示启用**，
 *    玩家看面板会以为没生效。这里真的翻转 `enabled` 位，做到面板上也「开其一、关其余」。
 * ⚠️ 找不到带「【身份】」条目的世界书时**不报错退出** —— `@@if` 闸门仍然生效，功能不塌。
 */
/**
 * ★ 2026-09-29（修 `[身份] 没找到带「【身份】」条目的世界书`）：
 *   **把卡里内嵌的那本书导出成一份真正的世界书文件**。
 *
 * 为什么需要它：本卡的世界书是**内嵌**在角色卡里的（ST 会注入，无需世界书文件）；
 *   但「按身份只开一条【身份】」这个开关，靠的是**酒馆助手那套 API 去改世界书文件** ——
 *   没有文件，就没有可改的东西，于是每次切身份都只留一行「没找到」。
 *   以前那份独立世界书是**旧版 239 条**、会和卡里那份打架（早先还赖在 `extensions.world` 里），
 *   所以当时**故意删掉**了。现在改成「**按需自动生成**」：没有就建、建完就同步，全程不用玩家动手。
 *
 * 幂等：已存在同名的世界书文件就直接返回，不覆盖（玩家改过的东西不许被擦）。
 * @returns {Promise<string|null>} 可用的世界书名（失败返回 null）
 */
/** 获取当前角色绑定的目标世界书名称列表（严格限定当前角色，避免遍历修改其他角色世界书） */
async function getTargetWorldbookNames() {
  const targets = new Set();
  // 1. 酒馆助手官方接口：getCharWorldbookNames('current')
  // TavernHelper 返回格式为 { primary: '仙姝堕', additional: [] } 或 数组
  try {
    const fn = API.getCharWorldbookNames || getGlobalOrParent('getCharWorldbookNames');
    if (fn) {
      const r = await fn('current');
      if (Array.isArray(r)) {
        r.forEach((n) => n && targets.add(String(n).trim()));
      } else if (r && typeof r === 'object') {
        if (r.primary) targets.add(String(r.primary).trim());
        if (Array.isArray(r.additional)) r.additional.forEach((n) => n && targets.add(String(n).trim()));
        if (typeof r.additional === 'string' && r.additional) targets.add(String(r.additional).trim());
      }
    }
  } catch (e) {
    console.warn(TAG, '[世界书] getCharWorldbookNames 探测异常：', msgOf(e));
  }

  // 2. SillyTavern 上下文中当前角色绑定的 worldbook (extensions.world)
  try {
    let ctx = null;
    if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) ctx = SillyTavern.getContext();
    else if (typeof window !== 'undefined' && window.parent && window.parent.SillyTavern && window.parent.SillyTavern.getContext) ctx = window.parent.SillyTavern.getContext();
    else if (API.getContext) ctx = API.getContext();
    else {
      const gCtx = getGlobalOrParent('getContext');
      if (gCtx) ctx = gCtx();
    }
    if (ctx) {
      const chid = (ctx.this_chid !== undefined) ? ctx.this_chid : 0;
      const ch = Array.isArray(ctx.characters) ? ctx.characters[chid] : null;
      if (ch) {
        const w = ch.data?.extensions?.world ?? ch.extensions?.world;
        if (w) targets.add(String(w).trim());
        const extra = ch.data?.extensions?.world_info ?? ch.extensions?.world_info;
        if (extra) targets.add(String(extra).trim());
      }
    }
  } catch (e) { /* 忽略 */ }

  // 3. 兜底扫描当前已有的世界书列表（匹配仙姝/赵无忧）
  try {
    const getNames = API.getWorldbookNames || getGlobalOrParent('getWorldbookNames');
    if (getNames) {
      const all = await getNames();
      if (Array.isArray(all)) {
        all.filter((n) => typeof n === 'string' && (n.includes('仙姝') || n.includes('赵无忧'))).forEach((n) => targets.add(n));
      }
    }
  } catch (e) { /* 忽略 */ }

  // 4. 硬兜底常见本卡世界书命名
  ['仙姝堕', '仙姝墮 · 一张跑全书', '仙姝墮'].forEach((n) => targets.add(n));

  return Array.from(targets).filter(Boolean);
}

async function ensureWorldbookFile(reason) {
  const { getWorldbookNames, getCharacter, loadWorldInfo, saveWorldInfo, updateWorldInfoList, getContext } = API;
  /* ① 先看有没有现成的（优先看当前角色专属/绑定的世界书） */
  const targetBooks = await getTargetWorldbookNames();
  if (targetBooks.length) {
    for (const wb of targetBooks) {
      try {
        const info = loadWorldInfo ? await loadWorldInfo(wb) : null;
        const es = info ? Object.values?.(info.entries ?? {}) ?? [] : [];
        if (es.some((e) => String(e?.comment ?? e?.name ?? '').startsWith('【身份】'))) {
          console.log(TAG, `[世界书] 当前角色已绑定带【身份】条目的世界书「${wb}」（${es.length} 条）—— 用它`);
          return wb;
        }
      } catch (e) { /* 换下一本 */ }
    }
  }
  // 若未绑定，检查全局中是否已有本卡专属命名的世界书（如 仙姝堕 · 世界书），避免无谓重建
  let allNames = [];
  try { allNames = getWorldbookNames ? getWorldbookNames() : []; } catch (e) { /* 忽略 */ }
  if (Array.isArray(allNames) && allNames.length) {
    const candidate = allNames.find((n) => typeof n === 'string' && (n.includes('仙姝') || n.includes('赵无忧')));
    if (candidate) {
      try {
        const info = loadWorldInfo ? await loadWorldInfo(candidate) : null;
        const es = info ? Object.values?.(info.entries ?? {}) ?? [] : [];
        if (es.some((e) => String(e?.comment ?? e?.name ?? '').startsWith('【身份】'))) {
          console.log(TAG, `[世界书] 找到本卡专属世界书「${candidate}」（${es.length} 条）—— 尝试绑定并使用`);
          try { await linkWorldbookToChar(candidate); } catch (e) { /* 忽略 */ }
          return candidate;
        }
      } catch (e) { /* 忽略 */ }
    }
  }

  /* ② 没有 ⇒ 从角色卡的内嵌书建一份 */
  let book = null, cardName = '';
  const ctxAny = (() => {
    try {
      if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) return SillyTavern.getContext();
      if (getContext) return getContext();
    } catch (err) { /* 忽略 */ }
    return null;
  })();
  const avatar = String((ctxAny && ctxAny.characters && ctxAny.characters[ctxAny.this_chid] && ctxAny.characters[ctxAny.this_chid].avatar) || '');
  const chid = (ctxAny && ctxAny.this_chid !== undefined) ? ctxAny.this_chid : 0;
  const pick = (ch) => {
    if (!ch) return null;
    const bk = ch.data?.character_book ?? ch.character_book ?? null;
    if (bk && Array.isArray(bk.entries) && bk.entries.length) { cardName = String(ch.name ?? '').trim(); return bk; }
    return null;
  };
  const tryCards = [
    ['await getCharacter("current")', async () => (getCharacter ? await getCharacter('current') : null)],
    ['await getCharacter(avatar)', async () => (getCharacter && avatar) ? await getCharacter(avatar) : null],
    ['await getCharacter(chid)', async () => (getCharacter ? await getCharacter(chid) : null)],
    ['window.characters[chid]', () => {
      const w = (typeof window !== 'undefined') ? window : null;
      if (!w || !Array.isArray(w.characters)) return null;
      const id = (w.this_chid !== undefined) ? w.this_chid : chid;
      return w.characters[id] ?? w.characters[chid] ?? null;
    }],
    ['ctx.characters[chid]', () => (ctxAny && Array.isArray(ctxAny.characters)) ? (ctxAny.characters[chid] ?? null) : null],
    ['window.chara_card_v3 / chara_card_v2', () => {
      const w = (typeof window !== 'undefined') ? window : null;
      return (w && (w.chara_card_v3 || w.chara_card_v2)) ? { data: (w.chara_card_v3 || w.chara_card_v2) } : null;
    }],
  ];
  for (const pair of tryCards) {
    const how = pair[0];
    try {
      const ch = await pair[1]();
      if (!ch) { console.log(TAG, '[世界书] 这条路拿不到对象：' + how); continue; }
      const bk = pick(ch);
      if (bk) { book = bk; console.log(TAG, '[世界书] 取到内嵌书（' + how + '）：' + bk.entries.length + ' 条，卡名「' + cardName + '」'); break; }
      console.log(TAG, '[世界书] ' + how + ' 拿到了对象但没有内嵌书，它的键：' + Object.keys(ch || {}).join(','));
    } catch (err) { console.warn(TAG, '[世界书] 取卡失败（' + how + '）：' + msgOf(err)); }
  }
  /* ⚠️ 兜到底：直接拉角色卡 PNG，解析 tEXt 里的 chara / ccv3（base64 的卡 JSON） */
  if (!book && avatar) {
    for (const url of ['/characters/' + encodeURIComponent(avatar), '/thumbnail?type=avatar&file=' + encodeURIComponent(avatar)]) {
      try {
        const r = await fetch(url, { cache: 'no-store' });
        if (!r.ok) { console.log(TAG, '[世界书] 取图失败 ' + url + '（HTTP ' + r.status + '）'); continue; }
        const buf = new Uint8Array(await r.arrayBuffer());
        const bk = readBookFromPng(buf);
        if (bk) { book = bk; console.log(TAG, '✅ [世界书] 直接从卡 PNG 里读到内嵌书：' + bk.entries.length + ' 条（' + url + '）'); break; }
        console.log(TAG, '[世界书] ' + url + ' 拿到了内容，但不是可解析的卡 PNG（' + buf.length + ' 字节）');
      } catch (err) { console.warn(TAG, '[世界书] 取图失败 ' + url + '：' + msgOf(err)); }
    }
  }
  if (!book && !avatar) console.warn(TAG, '[世界书] 连当前角色的 avatar 都取不到（ctx.characters 不可用）—— PNG 兜底这条路走不了');
  if (!book || !Array.isArray(book.entries) || !book.entries.length) {
    console.warn(TAG, '[世界书] 角色卡里没有内嵌世界书（或本版接口取不到）—— 身份条目开关交回 @@if 闸门');
    return null;
  }
  if (!saveWorldInfo) {
    console.warn(TAG, '[世界书] 这一版酒馆没有 saveWorldInfo —— 身份条目开关交回 @@if 闸门');
    return null;
  }
  const name = String(book.name ?? '').trim() || (cardName ? cardName + ' · 世界书' : '仙姝堕 · 世界书');
  /* ③ 字面同名的文件若已存在（哪怕是空的），绝不覆盖 —— 玩家可能改过 */
  try {
    const exists = loadWorldInfo ? await loadWorldInfo(name) : null;
    if (exists) {
      console.log(TAG, `[世界书] 文件「${name}」已存在（${Object.keys(exists.entries ?? {}).length} 条）—— 不覆盖`);
      try { await linkWorldbookToChar(name); } catch (e) { /* 忽略 */ }
      return name;
    }
  } catch (e) { /* 不存在时会抛，正常 */ }
  /* ④ 转格式：character_book.entries（数组）→ 世界书文件格式（entries 映射） */
  let data = null;
  try {
    const ctx = (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) ? SillyTavern.getContext() : (getContext ? getContext() : null);
    if (ctx && typeof ctx.convertCharacterBook === 'function') data = ctx.convertCharacterBook(book);
  } catch (e) { console.warn(TAG, '[世界书] convertCharacterBook 抛错，改用内联转换：', msgOf(e)); }
  if (!data || !data.entries) data = convertBookInline(book);
  try {
    await saveWorldInfo(name, data, true);
    if (updateWorldInfoList) { try { await updateWorldInfoList(); } catch (e) { /* 忽略 */ } }
    console.log(TAG, `✅ [世界书] 已把卡内嵌世界书导出为「${name}」（${Object.keys(data.entries).length} 条）`
      + `—— 起因：${reason}。切身份时就能只开对应的那一条了。`);
    try { await linkWorldbookToChar(name); } catch (e) { /* 绑定失败不影响建书 */ }
    return name;
  } catch (e) {
    console.warn(TAG, '[世界书] 写世界书文件失败：', msgOf(e));
    return null;
  }
}

/** 从一个 PNG 字节流里读出 tEXt 块 chara／ccv3，解出卡 JSON 与其中的内嵌书（只认这两块，别的一概不看） */
function readBookFromPng(bytes) {
  try {
    if (!bytes || bytes.length < 24) return null;
    const sig = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < 8; i++) if (bytes[i] !== sig[i]) return null;
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const dec = (u8) => { let s = ''; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return s; };
    let p = 8;
    while (p + 12 <= bytes.length) {
      const len = dv.getUint32(p);
      const type = dec(bytes.subarray(p + 4, p + 8));
      if (type === 'tEXt') {
        const data = bytes.subarray(p + 8, p + 8 + len);
        let z = -1; for (let i = 0; i < data.length; i++) if (data[i] === 0) { z = i; break; }
        if (z > 0) {
          const key = dec(data.subarray(0, z));
          if (key === 'chara' || key === 'ccv3') {
            const b64 = dec(data.subarray(z + 1));
            const bin = (typeof atob === 'function') ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
            let utf8 = bin;
            try { utf8 = decodeURIComponent(escape(bin)); } catch (err) { /* 原始串也能 parse */ }
            const j = JSON.parse(utf8);
            const bd = j.data ?? j;
            const bk = bd.character_book ?? j.character_book ?? null;
            if (bk && Array.isArray(bk.entries) && bk.entries.length) return bk;
          }
        }
      }
      p += 12 + len;
      if (type === 'IEND') break;
    }
  } catch (err) { console.warn(TAG, '[世界书] 解析卡 PNG 失败：', msgOf(err)); }
  return null;
}

/** 把「当前角色 → 这本世界书」的绑定写进酒馆（extensions.world）—— 建/找到书之后调用一次；幂等 */
async function linkWorldbookToChar(wbName) {
  if (!wbName) return false;
  try {
    const ctx = (typeof SillyTavern !== 'undefined' && SillyTavern.getContext)
      ? SillyTavern.getContext()
      : ((typeof API !== 'undefined' && API.getContext) ? API.getContext() : null);
    if (!ctx || typeof ctx.writeExtensionField !== 'function') return false;
    const chid = (ctx.this_chid !== undefined) ? ctx.this_chid : 0;
    const ch = Array.isArray(ctx.characters) ? ctx.characters[chid] : null;
    if (!ch) return false;
    const now = ch?.data?.extensions?.world;
    if (String(now ?? '') === String(wbName)) return true;
    const r = await ctx.writeExtensionField(chid, 'world', wbName);
    console.log(TAG, '[世界书] 已把「' + ch.name + '」的主世界书绑定为「' + wbName + '」（writeExtensionField 返回：' + JSON.stringify(r) + '）');
    return true;
  } catch (err) { console.warn(TAG, '[世界书] 写 extensions.world 失败：' + msgOf(err)); return false; }
}

/** 内联版的「character_book → 世界书文件」转换（拿不到 `convertCharacterBook` 时兜底） */
function convertBookInline(book) {
  const out = { entries: {}, originalData: book };
  (book.entries || []).forEach((e, i) => {
    out.entries[String(e.id ?? i)] = {
      uid: e.id ?? i,
      key: Array.isArray(e.keys) ? e.keys : [],
      keysecondary: Array.isArray(e.secondary_keys) ? e.secondary_keys : [],
      comment: e.comment ?? e.name ?? '',
      content: e.content ?? '',
      constant: !!e.constant,
      selective: e.selective ?? undefined,
      order: e.insertion_order ?? e.order ?? 100,
      position: e.position ?? 0,
      disable: e.enabled === false,
      depth: e.extensions?.depth ?? 4,
      displayIndex: e.extensions?.display_index ?? i,
    };
  });
  return out;
}

async function syncIdentityEntries(name) {
  const repFn = API.replaceWorldbook || getGlobalOrParent('replaceWorldbook');
  const getFn = API.getWorldbook || getGlobalOrParent('getWorldbook');
  const getNamesFn = API.getWorldbookNames || getGlobalOrParent('getWorldbookNames');
  const loadFn = API.loadWorldInfo || getGlobalOrParent('loadWorldInfo');
  const saveFn = API.saveWorldInfo || getGlobalOrParent('saveWorldInfo');

  if (!repFn && !saveFn) {
    console.warn(TAG, '[身份] 这一版酒馆助手与宿主均未找到 replaceWorldbook 或 saveWorldInfo，条目开关交回 @@if 闸门');
    return null;
  }

  // 1. 优先获取当前角色专门绑定的世界书（绝不随意触碰全局其他角色的世界书）
  let names = await getTargetWorldbookNames();

  // 2. 检查是否有带【身份】条目的世界书
  let hasIdentityBook = false;
  for (const wb of names) {
    try {
      let es = null;
      if (getFn) es = await getFn(wb);
      else if (loadFn) {
        const info = await loadFn(wb);
        es = info ? Object.values(info.entries ?? {}) : [];
      }
      if ((es || []).some((e) => String((e && (e.name ?? e.comment)) || '').startsWith('【身份】'))) {
        hasIdentityBook = true;
        break;
      }
    } catch (e) { /* 换下一本 */ }
  }

  if (!hasIdentityBook) {
    const built = await ensureWorldbookFile('切身份要拨【身份】条目开关，但当前角色没有带【身份】的世界书');
    if (built) {
      names = await getTargetWorldbookNames();
      if (!names.includes(built)) names.push(built);
    }
  }

  // 3. 兜底：若仍未获取到，尝试全局包含「仙姝/赵无忧」的世界书
  if (!names.length && getNamesFn) {
    try {
      const allNames = await getNamesFn();
      if (Array.isArray(allNames)) {
        const matched = allNames.filter((n) => typeof n === 'string' && (n.includes('仙姝') || n.includes('赵无忧')));
        names.push(...matched);
      }
    } catch (e) { /* 忽略 */ }
  }

  if (!Array.isArray(names) || !names.length) {
    console.warn(TAG, '[身份] 未找到当前角色专属的世界书，条目开关未动（@@if 闸门仍然生效）');
    return null;
  }

  const isLord = ['焚欲殿主', '浊龙殿主', '欢喜殿主', '魂欢殿主'].includes(name);

  for (const wb of names) {
    let es = null;
    let usingRawFormat = false;
    let rawInfo = null;

    if (getFn) {
      try { es = await getFn(wb); } catch (e) { es = null; }
    }
    if ((!es || !es.length) && loadFn) {
      try {
        rawInfo = await loadFn(wb);
        if (rawInfo && rawInfo.entries) {
          es = Object.values(rawInfo.entries);
          usingRawFormat = true;
        }
      } catch (e) { es = null; }
    }
    if (!es || !es.length) continue;

    const nameOf = (e) => String((e && (e.name ?? e.comment)) || '');
    const hit = es.filter((e) => nameOf(e).startsWith('【身份】'));
    if (!hit.length) continue;

    let changed = 0, idChanged = 0, plotChanged = 0, unknown = 0;

    // A. 身份条目：开其一，关其余
    for (const e of hit) {
      const nm = nameOf(e);
      const idName = nm.replace('【身份】', '').trim();
      if (!IDENTITY_NAMES.includes(idName)) { unknown += 1; continue; }
      const want = (idName === name);
      const curEnabled = e.enabled !== undefined ? Boolean(e.enabled) : (e.disable !== undefined ? !e.disable : true);
      if (curEnabled !== want) {
        e.enabled = want;
        e.disable = !want;
        changed++;
        idChanged++;
      }
    }
    if (unknown) console.warn(TAG, `[身份] 世界书「${wb}」里有 ${unknown} 条【身份】条目的名字不在身份台账里（跳过）`);

    // B. 剧情条目联动：
    // 选赵无忧：开启 1-15 剧情（非专轨），关闭自设专轨与殿主专轨；
    // 选自设：开启自设专轨 3 条，关闭赵无忧 1-15 剧情与殿主专轨；
    // 选四大殿主：开启殿主专轨 4 条，关闭赵无忧 1-15 剧情与自设专轨！
    const plotEntries = es.filter((e) => nameOf(e).startsWith('【剧情】'));
    for (const e of plotEntries) {
      const nm = nameOf(e);
      let want = false;
      const isCustomTrack = nm.includes('自设专轨');
      const isLordTrack = nm.includes('殿主专轨');
      const isMainTrack = !isCustomTrack && !isLordTrack;

      if (name === '赵无忧') {
        want = isMainTrack;
      } else if (name === '自设') {
        want = isCustomTrack;
      } else if (isLord) {
        want = isLordTrack;
      } else {
        want = false;
      }

      const curEnabled = e.enabled !== undefined ? Boolean(e.enabled) : (e.disable !== undefined ? !e.disable : true);
      if (curEnabled !== want) {
        e.enabled = want;
        e.disable = !want;
        changed++;
        plotChanged++;
      }
    }

    if (changed > 0) {
      let replaced = false;
      // 优先 TavernHelper replaceWorldbook
      if (repFn && !usingRawFormat) {
        try {
          await repFn(wb, es, { render: 'immediate' });
          replaced = true;
        } catch (e) {
          console.warn(TAG, `[身份] replaceWorldbook 写回「${wb}」异常，尝试原生 saveWorldInfo：`, msgOf(e));
        }
      }

      // 原生 saveWorldInfo 兜底
      if (!replaced && saveFn) {
        try {
          if (!rawInfo && loadFn) rawInfo = await loadFn(wb);
          if (rawInfo && rawInfo.entries) {
            for (const key of Object.keys(rawInfo.entries)) {
              const ent = rawInfo.entries[key];
              const entName = String(ent.comment || ent.name || '');
              if (entName.startsWith('【身份】')) {
                const idName = entName.replace('【身份】', '').trim();
                if (IDENTITY_NAMES.includes(idName)) {
                  ent.disable = (idName !== name);
                }
              } else if (entName.startsWith('【剧情】')) {
                const isCustomTrack = entName.includes('自设专轨');
                const isLordTrack = entName.includes('殿主专轨');
                const isMainTrack = !isCustomTrack && !isLordTrack;
                let wantPlot = false;
                if (name === '赵无忧') wantPlot = isMainTrack;
                else if (name === '自设') wantPlot = isCustomTrack;
                else if (isLord) wantPlot = isLordTrack;
                ent.disable = !wantPlot;
              }
            }
            await saveFn(wb, rawInfo);
            replaced = true;
          }
        } catch (e) {
          console.warn(TAG, `[身份] saveWorldInfo 原生写回「${wb}」失败：`, msgOf(e));
        }
      }

      // 主动触发酒馆 UI 刷新（如果当前界面打开了世界书抽屉）
      try {
        const topDoc = (typeof window !== 'undefined' && window.parent && window.parent.document) || (typeof document !== 'undefined' && document);
        if (topDoc) {
          const $ = (typeof window !== 'undefined' && window.parent && window.parent.$) || (typeof window !== 'undefined' && window.$);
          if ($) {
            const sel = $('#world_editor_select');
            if (sel.length) {
              const curText = sel.find('option:selected').text();
              const curVal = sel.val();
              if (String(curText).includes(wb) || String(curVal).includes(wb)) {
                sel.trigger('change');
              }
            }
          }
        }
      } catch (e) { /* 忽略 UI 刷新异常 */ }

      if (!replaced) {
        console.warn(TAG, `[身份] 无法将条目修改写回世界书「${wb}」`);
        return null;
      }
    }

    // 复核：读完立刻回读一次，确认「只开一条身份」与「对应剧情条目」真的落地了
    let verify = '';
    try {
      let again = null;
      if (getFn) again = await getFn(wb);
      else if (loadFn) {
        const info = await loadFn(wb);
        again = info ? Object.values(info.entries ?? {}) : [];
      }
      if (again) {
        const isEntryOn = (e) => (e.enabled !== undefined ? Boolean(e.enabled) : (e.disable !== undefined ? !e.disable : true));
        const onIds = again.filter((e) => nameOf(e).startsWith('【身份】') && isEntryOn(e)).map(nameOf);
        const onPlots = again.filter((e) => nameOf(e).startsWith('【剧情】') && isEntryOn(e)).map(nameOf);
        verify = `｜回读：开着身份 [${onIds.join(',')}]，剧情开着 ${onPlots.length} 条`;
      }
    } catch (e) { verify = '｜回读失败'; }

    console.log(TAG, `[身份] 世界书「${wb}」：身份 ${hit.length} 条（改 ${idChanged}），剧情 ${plotEntries.length} 条（改 ${plotChanged}），目标「【身份】${name}」${verify}`);
    return { wb, total: hit.length, changed, idChanged, plotChanged };
  }

  console.warn(TAG, '[身份] 当前角色的世界书中未找到带「【身份】」的条目，条目开关未动（@@if 闸门仍然生效）');
  return null;
}

/* ═══════════════════════════════════════════════════════════
 * 九 · 身份：首楼解析 / 点击菜单 / 切开场白 / 刷新开场白
 * ═══════════════════════════════════════════════════════════ */

/** 取某条消息的正文（酒馆助手的返回形状不稳定，两种都兜） */
function messageText(messageId, withSwipes) {
  if (!API.getChatMessages) return null;
  try {
    const opt = withSwipes ? { include_swipes: true } : undefined;
    const r = API.getChatMessages(messageId, opt);
    const arr = Array.isArray(r) ? r : (r ? [r] : []);
    for (const m of arr) {
      if (m && (m.message !== undefined || m.mes !== undefined)) return String(m.message ?? m.mes ?? '');
    }
  } catch (e) { console.warn(TAG, `读第 ${messageId} 楼正文失败：`, msgOf(e)); }
  return null;
}

/** 聊天里现在是不是「只有开场楼」＝新聊天 */
function isNewChat() {
  try {
    if (API.getLastMessageId) {
      const n = API.getLastMessageId();
      if (typeof n === 'number') return n <= 0;
    }
    if (API.getChatMessages) {
      const last = API.getChatMessages(-1);
      const m = Array.isArray(last) ? (last[last.length - 1] ?? last[0]) : last;
      if (m && (m.message_id !== undefined || m.mesid !== undefined)) return Number(m.message_id ?? m.mesid) <= 0;
    }
  } catch (e) { /* 取不到就按「不是新聊天」处理，宁可不覆盖 */ }
  return false;
}

/** 最新一楼的消息号；**取不到就返回 null ⇒ 调用方默认放行**。
 *  ⚠️ 绝不能因为「判不出来」就把写入焊死（NaN 比较恒 false 会把整个记账锁死）——
 *     这条教训来自参照卡（它同一处的注释也是这么写的）。 */
function latestMessageId() {
  try {
    if (API.getLastMessageId) {
      const n = Number(API.getLastMessageId());
      if (Number.isFinite(n) && n >= 0) return n;
    }
  } catch (e) { /* 继续回退 */ }
  try {
    if (API.getChatMessages) {
      const last = API.getChatMessages(-1);
      const m = Array.isArray(last) ? (last[last.length - 1] ?? last[0]) : last;
      const id = Number(m?.message_id);
      if (Number.isFinite(id) && id >= 0) return id;
    }
  } catch (e) { /* 取不到 */ }
  return null;
}

/**
 * 首楼开场白里的 `<IdentityPick name="…"/>` → 身份。
 * ⚠️ 只在**新聊天**自动同步（身份缺失，或聊天只有第 0 条）；否则玩家用 /身份 切过之后，
 *    一次刷新就会被首楼覆盖回去。
 * ⚠️ 停在「菜单楼」上时不算身份声明 —— 否则玩家滑回菜单楼看一眼，身份就被重置成赵无忧。
 */
async function syncIdentityFromFirstMes(reason) {
  const first = messageText(0);
  if (first === null) { console.log(TAG, `[身份] 取不到首楼（${reason}），跳过`); return null; }
  if (first.includes('<IdentityMenu/>')) {
    console.log(TAG, `[身份] 当前停在身份菜单楼（${reason}），身份保持 ${readIdentity() ?? '未设'}`);
    return readIdentity();
  }
  const m = first.match(/<IdentityPick\s+name\s*=\s*"([^"]+)"\s*\/?>/);
  if (!m) {
    console.log(TAG, `[身份] 首楼没有 <IdentityPick>（${reason}）—— 身份保持 ${readIdentity() ?? '未设'}`);
    return null;
  }
  const want = m[1].trim();
  const cur = readIdentity();
  const fresh = isNewChat();
  if (!fresh && cur && cur !== want) {
    console.log(TAG, `[身份] 首楼写着「${want}」，当前是「${cur}」且聊天已在推进 ⇒ **不覆盖**（想换发 /身份 ${want}）`);
    return cur;
  }
  if (cur === want) {
    console.log(TAG, `[身份] 与首楼一致：${want}`);
    try { await syncIdentityEntries(want); } catch (e) { /* 忽略 */ }
    return cur;
  }
  const r = await writeIdentity(want);
  console.log(TAG, r.ok ? `[身份] 首楼 → ${want}（via ${r.via}）` : `[身份] ❌ 写入失败：${r.why}`);
  return r.ok ? want : cur;
}

/**
 * 点击身份菜单里的按钮：写身份／阵营 ⇒ 切第 0 楼的 swipe（＝换开场白）。
 * ⚠️ 开场白在酒馆里就是**第 0 楼的 swipes**（first_mes ＝ swipe[0]，alternate_greetings 依次往下）。
 * ⚠️ swipe 序号**不硬编码**：现场按每条 swipe 里的 `<IdentityPick name="…">` 反查，顺序变了也不会错。
 * ⚠️ 必须**排除菜单楼**：菜单楼自己也带 `<IdentityPick name="赵无忧"/>`（默认身份），
 *    不排除的话点「赵无忧」会跳回菜单楼，看起来像没反应。
 */
async function pickIdentity(name, options = {}) {
  if (!IDENTITY_NAMES.includes(name)) { console.warn(TAG, `[身份] 未知身份「${name}」`); return -1; }
  const r = await writeIdentity(name, options.guard);
  if (!r.ok) {
    if (options.strict) throw new Error(r.why || '身份写入失败');
    toast('warning', r.why || '身份写入失败，请检查酒馆助手', 7000);
    return -1;
  }
  console.log(TAG, r.ok ? `[身份] 点击 → ${name}／阵营 ${r.faction}（via ${r.via}）` : `[身份] ❌ 写变量失败：${r.why}`);

  if (options.switchGreeting === false) return -1;
  let idx = -1;
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
  const names = ['custom_name', 'custom_gender', 'custom_age', 'custom_cultivation', 'custom_sect', 'custom_timepoint', 'custom_origin'];
  const limits = [64, 16, 32, 96, 128, 64, 1800];
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
  /* P2-C：提交前校验所选日期（空=初三；非空无效在提交前抛错）。 */
  const startTime = xdsTimepoint.resolveTimepoint(values.custom_timepoint);
  return '【启卷入世 · 自设命途】\n' +
    '• 道号名讳：' + name + '（' + (values.custom_gender || '男') + '，' + (values.custom_age || '成年') + '）\n' +
    '• 境界修为：' + (values.custom_cultivation || '练气圆满') + '\n' +
    '• 入世身份：' + (values.custom_sect || '大荒散修') + '\n' +
    '• 当前时点：' + startTime.value + '\n' +
    '• 极乐机缘：' + (values.custom_origin || '偶得《极乐引》残篇，机缘入道') + '\n\n' +
    '（以此身入太微红尘，且看百花谁主沉浮。）';
}

function xdsMenuStatus(box, message, error) {
  const status = box && box.querySelector('[data-xds-status]');
  if (status) {
    status.textContent = message;
    status.toggleAttribute('data-xds-error', !!error);
  }
  if ((!status || !status.isConnected) && message) toast(error ? 'warning' : 'info', message, 7000);
}

function xdsMenuAssets() {
  const ctx = xdsMenuContext();
  const ch = ctx && ctx.characters && ctx.characters[ctx.characterId];
  if (!ch) return [];
  const result = [];
  if (ch.data && ch.data.extensions && ch.data.extensions.xsd_assets) result.push(ch.data.extensions.xsd_assets);
  if (ch.extensions && ch.extensions.xsd_assets) result.push(ch.extensions.xsd_assets);
  if (!result.length && typeof ch.json_data === 'string') {
    try {
      const raw = JSON.parse(ch.json_data);
      const assets = raw.data && raw.data.extensions && raw.data.extensions.xsd_assets;
      if (assets) result.push(assets);
    } catch (error) { /* 未内嵌时留占位文字，绝不请求本地路径 */ }
  }
  return result;
}

function xdsMenuImageUrl(img, maps) {
  const kind = img.getAttribute('data-xds-image');
  const key = img.getAttribute('data-xds-asset-key') || '';
  const token = img.getAttribute('data-xds-token') || '';
  for (const assets of maps) {
    const candidates = [assets.menu && assets.menu[token], assets.menu && assets.menu['{{' + token + '}}']];
    if (kind === 'portrait') candidates.push(assets.lightbox && assets.lightbox[key], assets.panel && assets.panel[key]);
    else if (key) candidates.push(assets.relics && assets.relics[key]);
    // 四阶图缺失就留占位，严禁悄悄替换成一阶或者其他角色的纹章。
    const value = candidates.find(value => typeof value === 'string' &&
      (/^data:image\/(?:png|jpeg|webp|gif|avif);base64,/i.test(value) || /^https?:\/\//i.test(value)));
    if (value) return value;
  }
  return '';
}

function xdsMenuHydrate(root, runtime) {
  if (!runtime.roots.has(root)) {
    runtime.roots.add(root);
    // 同一模板被多个消息复制时，原生 radio/label 的 id 与 name 仍须唯一。
    const suffix = '-r' + (++runtime.rootSerial);
    const ids = new Map();
    for (const input of root.querySelectorAll('input[id],textarea[id]')) {
      ids.set(input.id, input.id + suffix);
      input.id += suffix;
      if (input.hasAttribute('data-xds-page')) input.name += suffix;
    }
    for (const label of root.querySelectorAll('label[for]')) {
      if (ids.has(label.htmlFor)) label.htmlFor = ids.get(label.htmlFor);
    }
    runtime.chatKeys.set(root, xdsMenuChatKey());
  }
  const maps = xdsMenuAssets();
  for (const img of root.querySelectorAll('[data-xds-image]')) {
    if (!runtime.images.has(img)) {
      runtime.images.add(img);
      const ready = () => {
        const badge = img.closest('[data-xds-badge]');
        const card = img.closest('[data-xds-flower]');
        img.removeAttribute('data-xds-missing');
        if (badge) badge.setAttribute('data-xds-ready', '');
        else if (card) card.setAttribute('data-xds-art-ready', '');
      };
      const missing = () => {
        img.setAttribute('data-xds-missing', '');
        const badge = img.closest('[data-xds-badge]');
        const card = img.closest('[data-xds-flower]');
        if (badge) badge.removeAttribute('data-xds-ready');
        else if (card) card.removeAttribute('data-xds-art-ready');
      };
      runtime.listen(img, 'load', ready);
      runtime.listen(img, 'error', missing);
      if (img.complete && img.naturalWidth) ready();
    }
    if (!img.hasAttribute('src')) {
      const value = xdsMenuImageUrl(img, maps);
      if (value) img.src = value;
    }
  }
}

function xdsMenuSent(message, baseline) {
  const ctx = xdsMenuContext();
  if (ctx && Array.isArray(ctx.chat)) {
    return ctx.chat.slice(baseline.length).some(row => row && row.is_user === true && String(row.mes || '') === message);
  }
  try {
    if (API.getChatMessages) {
      const value = API.getChatMessages(-1);
      const rows = Array.isArray(value) ? value : [];
      return rows.some(row => row && row.role === 'user' && Number(row.message_id) > baseline.last && String(row.message || row.mes || '') === message);
    }
  } catch (error) { /* 保留未确认状态，不自动重复发送 */ }
  return false;
}

async function xdsMenuSubmit(form, button, runtime) {
  if (runtime.submitting) return;
  const root = form.closest('[data-xds-menu]');
  const chatKey = xdsMenuChatKey();
  if (chatKey === null) {
    xdsMenuStatus(form, '无法确定当前聊天，请重新打开角色会话后再落款。', true);
    return;
  }
  const rootKey = runtime.chatKeys.get(root);
  if (rootKey !== null && rootKey !== undefined && rootKey !== chatKey) {
    xdsMenuStatus(form, '这份书卷属于上一段会话，请在当前会话重新打开首楼。', true);
    return;
  }
  const previous = runtime.submissions.get(root);
  if (previous && previous.clicked) {
    const sent = xdsMenuSent(previous.message, previous.baseline);
    button.textContent = sent ? '墨宝已落 · 入世设定已发送' : '检查发送状态';
    button.disabled = sent;
    xdsMenuStatus(form, sent ? '身份已切换为自设，入世设定已发送。' : '已触发过发送，暂未确认消息入楼；请查看输入框与会话，避免重复发送。', !sent);
    return;
  }
  let message, composer;
  try {
    message = xdsMenuIntro(form);
    composer = xdsMenuComposer();
    if (composer.input.value.trim() && (!previous || composer.input.value !== previous.message)) {
      throw new Error('输入框已有未发送文案，请先发送或清空，再提笔落款。');
    }
    if (!xdsMenuCanSend(composer, true)) throw new Error('酒馆正在生成回复、未连接模型，或发送按钮暂不可用，请稍后落款。');
  } catch (error) {
    xdsMenuStatus(form, msgOf(error), true);
    return;
  }

  const epoch = runtime.epoch;
  const ctx = xdsMenuContext();
  const baseline = { length: ctx && Array.isArray(ctx.chat) ? ctx.chat.length : 0, last: latestMessageId() ?? -1 };
  const record = { message, baseline, clicked: false };
  runtime.submitting = true;
  runtime.submissions.set(root, record);
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  button.textContent = '落款中 · 正在切换身份…';
  const guard = () => !runtime.disposed && runtime.epoch === epoch && xdsMenuChatKey() === chatKey;
  const assertCurrent = () => { if (!guard()) throw new Error('聊天已切换，本次入世提交已中止。'); };
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

  try {
    assertCurrent();
    // 不切换首楼 swipe：保留填写书卷与错误反馈；普通身份按钮仍照旧切开场白。
    await pickIdentity('自设', { switchGreeting: false, quiet: true, strict: true, guard });
    assertCurrent();
    // 写接口存在并不代表落地成功；消息层优先，故两层可读值均要一致。
    const layers = [readLayer(L_CHAT), readLayer(L_MSG)].filter(Boolean);
    if (!layers.length || layers.some(layer => !layer.stat_data || layer.stat_data.身份 !== '自设')) {
      throw new Error('自设身份回读未通过，未发送设定；请检查酒馆助手变量接口。');
    }
    composer = xdsMenuComposer();
    if (composer.input.value.trim() && composer.input.value !== message) {
      throw new Error('落款期间输入框内容已改变，已保留你的文案；请清空后重试。');
    }
    xdsMenuSetValue(composer.input, message);
    xdsMenuStatus(form, '身份已切换为自设，正在发送入世设定…', false);
    button.textContent = '落款中 · 正在启卷…';
    // 等待 input 被宿主接管；不靠固定 150ms 猜测发送按钮状态。
    await pause(32);
    assertCurrent();
    for (let i = 0; !xdsMenuCanSend(composer) && i < 20; i++) {
      await pause(32); assertCurrent(); composer = xdsMenuComposer();
    }
    if (!xdsMenuCanSend(composer)) throw new Error('身份已切换，文案已保留在输入框；发送暂不可用，请稍后手动发送或重新落款。');
    if (composer.input.value !== message) throw new Error('输入框内容已改变，未自动发送；请检查后手动发送。');
    assertCurrent();
    record.clicked = true;
    composer.send.click();
    for (let i = 0; i < 40 && !xdsMenuSent(message, baseline); i++) {
      await pause(50); assertCurrent();
    }
    if (!xdsMenuSent(message, baseline)) {
      button.disabled = false;
      button.textContent = '检查发送状态';
      xdsMenuStatus(form, '已触发发送，暂未确认消息入楼；文案若仍在输入框，可手动发送。请勿重复落款。', true);
    } else {
      button.textContent = '墨宝已落 · 入世设定已发送';
      xdsMenuStatus(form, '身份已切换为自设，入世设定已发送。', false);
    }
  } catch (error) {
    button.disabled = false;
    button.textContent = record.clicked ? '检查发送状态' : '提笔落款 · 启卷入世';
    xdsMenuStatus(form, msgOf(error), true);
  } finally {
    button.removeAttribute('aria-busy');
    runtime.submitting = false;
  }
}

let xdsMenuRuntime = null;

/** 用 data 属性委托，兼容酒馆净化后的类名；重复启动更新监听，不保留旧 iframe 闭包。 */
/* P2-B：共享滑块模块由构建链注入本文件；此处只建实例。 */
const xdsTimepoint = (typeof xdsTimepointModule === 'function') ? xdsTimepointModule() : null;

function bindIdentityMenu() {
  try {
    const host = xdsMenuHost();
    const doc = host.document;
    if (!doc) return false;
    if (xdsMenuRuntime && !xdsMenuRuntime.disposed && doc.__xsdMenuRuntime === xdsMenuRuntime) {
      xdsMenuRuntime.scan(doc);
      return true;
    }
    if (doc.__xsdMenuRuntime && typeof doc.__xsdMenuRuntime.dispose === 'function') doc.__xsdMenuRuntime.dispose();
    const runtime = {
      disposed: false, epoch: 0, rootSerial: 0, submitting: false,
      roots: new WeakSet(), images: new WeakSet(), frames: new WeakSet(),
      chatKeys: new WeakMap(), submissions: new WeakMap(), docs: new Set(), cleanups: [],
      listen(el, type, handler, capture = false) {
        el.addEventListener(type, handler, capture);
        runtime.cleanups.push(() => el.removeEventListener(type, handler, capture));
      },
      dispose() {
        if (runtime.disposed) return;
        runtime.disposed = true;
        runtime.epoch++;
        for (const clean of runtime.cleanups.splice(0)) { try { clean(); } catch (error) { /* 卸载继续 */ } }
        if (doc.__xsdMenuRuntime === runtime) {
          delete doc.__xsdMenuRuntime;
          doc.__xsdMenuBound = false;
        }
      },
      scan(node) {
        if (runtime.disposed || !node || typeof node.querySelectorAll !== 'function') return;
        if (node.matches && node.matches('[data-xds-menu]')) xdsMenuHydrate(node, runtime);
        for (const root of node.querySelectorAll('[data-xds-menu]')) xdsMenuHydrate(root, runtime);
        const frames = [...node.querySelectorAll('.mes_text iframe, [data-xds-menu-frame]')];
        if (node.matches && node.matches('iframe') && node.closest('.mes_text')) frames.push(node);
        for (const frame of frames) {
          const attach = () => {
            try { if (frame.contentDocument) runtime.attach(frame.contentDocument); } catch (error) { /* 跨源无法委托 */ }
          };
          if (!runtime.frames.has(frame)) { runtime.frames.add(frame); runtime.listen(frame, 'load', attach); }
          attach();
        }
      },
      attach(surface) {
        if (runtime.docs.has(surface) || runtime.disposed) return;
        runtime.docs.add(surface);
        runtime.listen(surface, 'click', onClick, true);
        runtime.listen(surface, 'keydown', onKey);
        runtime.listen(surface, 'input', onInput);
        const observer = new surface.defaultView.MutationObserver(rows => {
          for (const row of rows) for (const node of row.addedNodes) runtime.scan(node);
        });
        observer.observe(surface.documentElement, { childList: true, subtree: true });
        runtime.cleanups.push(() => observer.disconnect());
        runtime.scan(surface);
    /* P2-B：scan 之后安装滑块增强；清理并入原 runtime.cleanups。 */
    try {
      if (xdsTimepoint && typeof xdsTimepoint.install === 'function') {
        const timepointHandle = xdsTimepoint.install({
          host: surface.defaultView,
          ownerWindow: window,
          setValue: xdsMenuSetValue,
        });
        runtime.cleanups.push(() => timepointHandle.dispose());
      }
    } catch (error) {
      console.warn('[XDS timepoint] 初始化失败，保留原日期入口', error);
    }
      },
      keyboardSpace() {
        const viewport = host.visualViewport;
        const covered = viewport ? Math.max(0, host.innerHeight - viewport.height - viewport.offsetTop) : 0;
        for (const surface of runtime.docs) {
          for (const root of surface.querySelectorAll('[data-xds-menu]')) {
            root.style.setProperty('--xds-keyboard-space', Math.min(covered, 420) + 'px');
          }
        }
      },
    };
    const stop = ev => { ev.preventDefault(); ev.stopImmediatePropagation(); };
    function onClick(ev) {
      const target = ev.target && ev.target.nodeType === 3 ? ev.target.parentElement : ev.target;
      if (!target || typeof target.closest !== 'function') return;
      const root = target.closest('[data-xds-menu]');
      const legacyIdentity = target.closest('[data-xds-identity]');
      if (!root && !legacyIdentity) return;
      const submit = target.closest('[data-xds-action="submit-custom"]');
      if (submit && root) {
        stop(ev);
        const form = submit.closest('[data-xds-custom-form]');
        if (form) void xdsMenuSubmit(form, submit, runtime);
        return;
      }
      const chip = target.closest('[data-xds-fill]');
      if (chip && root) {
        stop(ev);
        const form = chip.closest('[data-xds-custom-form]');
        const key = chip.getAttribute('data-xds-fill');
        if (!form || !['custom_cultivation', 'custom_sect', 'custom_timepoint'].includes(key)) return;
        const input = form.querySelector('[data-xds-field="' + key + '"]');
        if (input) xdsMenuSetValue(input, chip.getAttribute('data-xds-value') || chip.textContent.trim());
        return;
      }
      const step = target.closest('[data-xds-carousel-step]');
      if (step && root) {
        stop(ev);
        const carousel = root.querySelector('[data-xds-carousel]');
        const card = carousel && carousel.querySelector('[data-xds-flower]');
        if (card) {
          const view = carousel.ownerDocument.defaultView;
          const gap = parseFloat(view.getComputedStyle(carousel).columnGap) || 14;
          carousel.scrollBy({ left: (step.getAttribute('data-xds-carousel-step') === '-1' ? -1 : 1) * (card.getBoundingClientRect().width + gap), behavior: view.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        }
        return;
      }
      if (legacyIdentity) {
        stop(ev);
        if (runtime.submitting) return;
        const name = String(legacyIdentity.getAttribute('data-xds-identity') || '').trim();
        if (!IDENTITY_NAMES.includes(name)) {
          xdsMenuStatus(root || legacyIdentity.parentElement, '请选择具体殿主身份。', true);
          return;
        }
        runtime.submitting = true;
        void pickIdentity(name)
          .catch(error => { xdsMenuStatus(root, msgOf(error), true); })
          .finally(() => { runtime.submitting = false; });
      }
      // label 的原生 radio 激活完全交给浏览器，视口切换只由 CSS 完成。
    }
    function onKey(ev) {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      const label = ev.target && ev.target.closest && ev.target.closest('[data-xds-menu] label[role="button"]');
      if (label) { ev.preventDefault(); label.click(); }
    }
    function onInput(ev) {
      const input = ev.target;
      if (!input || !input.matches || !input.matches('[data-xds-field]')) return;
      const form = input.closest('[data-xds-custom-form]');
      if (!form) return;
      for (const chip of form.querySelectorAll('[data-xds-fill]')) {
        if (chip.getAttribute('data-xds-fill') === input.getAttribute('data-xds-field')) {
          chip.setAttribute('aria-pressed', String(chip.getAttribute('data-xds-value') === input.value));
        }
      }
    }
    xdsMenuRuntime = runtime;
    doc.__xsdMenuRuntime = runtime;
    doc.__xsdMenuBound = true;
    runtime.attach(doc);
    if (host.visualViewport) {
      runtime.listen(host.visualViewport, 'resize', runtime.keyboardSpace);
      runtime.listen(host.visualViewport, 'scroll', runtime.keyboardSpace);
    }
    runtime.keyboardSpace();
    runtime.listen(window, 'pagehide', runtime.dispose);
    try {
      if (API.eventOn && EVENTS && EVENTS.CHAT_CHANGED) {
        const listener = API.eventOn(EVENTS.CHAT_CHANGED, () => { runtime.epoch++; });
        if (listener && typeof listener.stop === 'function') runtime.cleanups.push(() => listener.stop());
      }
    } catch (error) { /* 无事件 API 时仍由 chatKey 阻止跨会话发送 */ }
    console.log(TAG, '[首楼] 百花谱与自设书卷事件委托已挂载');
    return true;
  } catch (error) {
    console.warn(TAG, '[首楼] 挂载失败：', msgOf(error));
    return false;
  }
}

/** 宿主尚未就绪时有限重试；正常加载不轮询。 */
function ensureMenuBound() {
  if (bindIdentityMenu()) return;
  let tries = 0;
  const timer = setInterval(() => {
    if (++tries > 10 || bindIdentityMenu()) clearInterval(timer);
  }, 1000);
  window.addEventListener('pagehide', () => clearInterval(timer), { once: true });
}


/**
 * 把第 0 楼的开场白按**当前角色卡**重刷一遍。
 * 用途：酒馆在开聊天那一刻就把 first_mes 与 alternate_greetings 烧成了第 0 楼的 swipes，
 * 之后换卡不会追改 ⇒ 旧聊天里看到的是旧文案。这条命令用来补这一步。
 */
async function refreshGreetings() {
  if (!API.getCharacter || !API.setChatMessages) {
    console.warn(TAG, '[身份] 没有 getCharacter／setChatMessages，无法刷新开场白');
    return { ok: false };
  }
  let swipes = [];
  try {
    const ch = await API.getCharacter('current');
    swipes = (ch && ch.first_messages ? ch.first_messages : []).filter((s) => typeof s === 'string' && s.trim());
  } catch (e) { console.warn(TAG, '[身份] 读角色卡失败：', msgOf(e)); return { ok: false }; }
  if (swipes.length < 2) { console.warn(TAG, `[身份] 角色卡里只有 ${swipes.length} 条开场白，不刷新`); return { ok: false }; }
  const idn = readIdentity() ?? IDENTITY_DEFAULT;
  const re = new RegExp('<IdentityPick\\s+name\\s*=\\s*"' + idn + '"');
  let idx = swipes.findIndex((s) => re.test(s) && !s.includes('<IdentityMenu/>'));
  if (idx < 0) idx = 0;
  try {
    await API.setChatMessages([{ message_id: 0, swipes, swipe_id: idx, message: swipes[idx] }], { refresh: 'affected' });
    console.log(TAG, `[身份] 第 0 楼已按当前卡刷新：${swipes.length} 条开场白，停在 #${idx}（${idn}）`);
    return { ok: true, count: swipes.length, idx };
  } catch (e) { console.warn(TAG, '[身份] 刷新第 0 楼失败：', msgOf(e)); return { ok: false }; }
}

/* ═══════════════════════════════════════════════════════════
 * 十 · 玩家命令
 * ═══════════════════════════════════════════════════════════ */

const HELP = [
  '已知          —— 打印当前 known 表（以下命令**一律不带斜杠**）',
  '锚点          —— 列出全部锚点字段与说明',
  '解锁 <字段>   —— 手工翻开一个锚点（平时用不到：剧情走到时模型会自己在状态栏里记）',
  '回锁 <字段>   —— 撤销解锁',
  '身份          —— 列出身份清单；身份 <名字> 热切换（穿书模式）',
  '物品          —— 打印纳戒清单（行囊／纳戒同义）',
  '获得物品 <物品名> [简述] [详述] —— 手工把一件东西收进纳戒',
  '消耗物品 <物品名> —— 喝掉／用掉／丢掉一件东西，从纳戒里移除（面板里那条提示指的就是它）',
  '验收          —— 现场体检：物品数量、后台时点与状态栏时间、成形锚点有无破身证据（体检／自检同义）',
  '刷新开场白    —— 把第 0 楼的开场白按当前角色卡重刷（旧聊天看到的是开聊天时烧下的旧文案）',
].join('\n');

/* ⚠️ 2026-10-06：`/物品`／`/获得物品`／`/消耗物品` 三组处理器早就写在 `handleUserCommand` 里，
 *   可这份名单一直没收录它们 ⇒ `parseCommand` 在最后一步 `return null`，玩家照着面板提示
 *   发「消耗物品 醉春风」**一点反应都没有**（面板 line 1803 就是这么教玩家的）。
 *   名单补齐即通；不带斜杠时仍受「只能一个参数」那条从严规则约束。 */
const CMD_NAMES = ['已知', '锚点', '帮助', 'help', '解锁', '回锁', '身份', '设段', '继承', '读档', '刷新开场白', '刷新',
  '物品', '行囊', '纳戒', '获得物品', '添加物品', '消耗物品', '移除物品', '丢弃物品',
  '验收', '体检', '自检'];

/**
 * 剧情里程碑与特征词映射表（按段位从高到低排列，用于大总结智能识别）
 */
const STAGE_MILESTONES = [
  { stage: 15, kws: ['雀奴', '灼酒流炎穴二阶段', '彻底臣服'] },
  { stage: 14, kws: ['洞府调教', '相思豆', '赤羽沉沦', '残阳洞府'] },
  { stage: 13, kws: ['赤羽堕凡尘', '灼酒流炎穴成形', '孕炎乳', '破身'] },
  { stage: 12, kws: ['朱樱逢劫', '封元镇灵环暴露', '乳环暴露', '赵无忧坠渊', '坠入葬魔渊'] },
  { stage: 11, kws: ['天溪城破', '巨猿破城', '西南城破', '城池陷落'] },
  { stage: 10, kws: ['双姝回归', '魅骨生香', '安神香'] },
  { stage: 9, kws: ['血染天溪', '夜间失控', '越界温存', '赵无忧看见乳环'] },
  { stage: 8, kws: ['灵犀同心', '日月同辉', '双姝被困'] },
  { stage: 7, kws: ['兽潮血战', '玄机子装伤', '天溪城血战'] },
  { stage: 6, kws: ['初入天溪', '听雪双姝登场', '天音阁防区'] },
  { stage: 5, kws: ['孤剑崖送别', '赠送冰心泪', '孤月定情'] },
  { stage: 4, kws: ['南域大劫', '神诅', '天姝会成立'] },
  { stage: 3, kws: ['幽寂谷秘境', '幽寂谷历练', '玄机子胁迫过叶红缨'] },
  { stage: 2, kws: ['邪修洞府', '解毒救孤月', '极乐引入手', '口含阴津'] },
  { stage: 1, kws: ['墨山道', '墨山七贤'] }
];

/**
 * 智能检测文本是否包含新开对话的历史大总结
 * @param {string} text 用户输入文本
 * @param {number} messageId 消息楼号
 * @returns {{isInherited: boolean, targetStage: number, summaryText: string}|null}
 */
function detectInheritance(text, messageId) {
  const t = String(text || '').trim();
  if (!t) return null;

  // 0. 优先支持显式纯数字或短段位指令（如 "11"、"第11段"、"/继承 11"、"继承 11"、"/读档 11"）
  const numOnlyMatch = /^[\/／]?(?:继承|读档|恢复)?\s*(?:第)?\s*([一二三四五六七八九十\d]+)\s*(?:段|阶段)?$/i.exec(t);
  const CN_MAP = { 一:1, 二:2, 三:3, 四:4, 五:5, 六:6, 七:7, 八:8, 九:9, 十:10, 十一:11, 十二:12, 十三:13, 十四:14, 十五:15, 十六:16 };
  if (numOnlyMatch) {
    const raw = numOnlyMatch[1];
    let n = parseInt(raw, 10);
    if (isNaN(n) && CN_MAP[raw]) n = CN_MAP[raw];
    if (n >= 1 && n <= STAGE_STEPS.length) {
      return {
        isInherited: true,
        targetStage: n,
        summaryText: `显式继承至第 ${n} 段`
      };
    }
  }

  // 被动文本/总结文本检测：过滤过短文本
  if (t.length < 5) return null;

  // 1. 显式命令或显式前缀标识
  const hasExplicitTag = /(?:^\s*[\/／](?:继承|读档|恢复)|【(?:承接|继承|大总结|前情提要|前情回顾|存档|历史进度|接上把|接上回|转场继承)】|承接上一[把局段回篇]|接上一[把局段回篇]|前情继承|新开承接|重开承接|<阶段总结>|<结算>)/i.test(t);

  // 2. 检查是否包含显式段位号声明 (例: 第11段 / 段位11 / 阶段:11)
  const stageNumMatch = /(?:第\s*([一二三四五六七八九十\d]+)\s*段|段位\s*[:：]?\s*([一二三四五六七八九十\d]+)|阶段\s*[:：]?\s*([一二三四五六七八九十\d]+)|承接第\s*([一二三四五六七八九十\d]+))/i.exec(t);

  let explicitStage = 0;
  if (stageNumMatch) {
    const raw = stageNumMatch[1] || stageNumMatch[2] || stageNumMatch[3] || stageNumMatch[4];
    explicitStage = parseInt(raw, 10);
    if (isNaN(explicitStage) && CN_MAP[raw]) explicitStage = CN_MAP[raw];
  }

  // 3. 统计命中的里程碑
  let inferredStage = 0;
  let hitMilestoneCount = 0;
  for (const item of STAGE_MILESTONES) {
    const hit = item.kws.some(k => t.includes(k));
    if (hit) {
      hitMilestoneCount++;
      if (item.stage > inferredStage) inferredStage = item.stage;
    }
  }

  // 4. 防冲突判定：
  // 必须是：显式标识 或 (低楼层 <= 3 且 (有显式段位号 或 命中至少2个中后期里程碑且段位>=3))
  const isEarlyFloor = (Number(messageId) <= 3);
  const isQualified = hasExplicitTag || (isEarlyFloor && (explicitStage > 1 || (hitMilestoneCount >= 2 && inferredStage >= 3)));

  if (!isQualified) return null;

  const finalStage = Math.max(1, Math.min(STAGE_STEPS.length, explicitStage || inferredStage || 1));
  return {
    isInherited: true,
    targetStage: finalStage,
    summaryText: t.replace(/^[\/／]?(?:继承|读档|恢复)\s*/, '').trim()
  };
}

/**
 * 应用继承存档：设置段位基准、激活历史锚点、持久化阶段总结
 */
async function applyInheritedArchive(text, messageId) {
  const inh = detectInheritance(text, messageId);
  if (!inh) return { ok: false, why: '未识别到大总结或段位特征' };

  const targetStage = inh.targetStage;
  const summaryText = inh.summaryText;
  const shift = STAGE_BASE[targetStage - 1] - messageId;

  // 自动从总结文本中推导并恢复已解锁的历史锚点
  const patchKnown = {};
  for (const f of ALL_FIELDS) {
    const kws = ANCHOR_KEYWORDS[f] || [];
    if (kws.some(k => summaryText.includes(k))) {
      patchKnown[f] = true;
    }
  }

  // 基础前序锚点补齐（若到达高段位，自动推导基础事件）
  if (targetStage >= 2 && summaryText.includes('极乐引')) patchKnown['极乐引入手'] = true;
  if (targetStage >= 6) patchKnown['已抵达天溪'] = true;

  const patch = {
    [FLOOR_PIN]: { floor: messageId, shift },
    段位: targetStage,
    仙盟历: SEG_TIME[targetStage - 1],
    仙盟历文: fmtXianmeng(SEG_TIME[targetStage - 1]),
    窗口起点: 0,
    时点加速: 0,
    结算待办: 0,
    总结待办: 0,
    阶段总结: summaryText
  };
  if (Object.keys(patchKnown).length) {
    patch.known = patchKnown;
  }

  const r = await writeStat(patch, `识别大总结：继承至第 ${targetStage} 段`);
  if (!r || !r.ok) {
    console.warn(TAG, `❌ [继承存档] writeStat 写入失败：${(r && r.why) || '未知原因'}`);
    return { ok: false, why: (r && r.why) || '变量写入失败' };
  }
  console.log(TAG, `🎉 [继承存档] 第 ${messageId} 楼成功识别大总结！已平移至第 ${targetStage} 段（仙盟历 ${patch.仙盟历文}），恢复锚点 ${Object.keys(patchKnown).length} 个`);
  return { ok: true, targetStage, anchorCount: Object.keys(patchKnown).length };
}

/**
 * 解析一条玩家命令（**参数容错**与旧版一致，另加：斜杠可省、中英文空白都认、全角冒号也行）。
 * @returns {{cmd:string, arg:string}|null} 不是命令就返回 null
 */
function parseCommand(text) {
  const raw = String(text ?? '').trim();
  if (!raw) return null;
  const withSlash = raw.startsWith('/') || raw.startsWith('／');
  const body = withSlash ? raw.slice(1).trim() : raw;
  const isInheritCmd = /^(?:继承|读档)(?:[\s\u3000:：]|$)/.test(body);
  if (!isInheritCmd && raw.length > 40) return null;
  const parts = body.split(/[\s\u3000]+/).filter(Boolean);   // 半角空格 / Tab / 全角空格
  if (!parts.length) return null;

  let cmd = parts[0];
  const args = parts.slice(1);
  const colon = cmd.match(/^([^：:]+)[：:](.*)$/);            // /解锁：封元镇灵环
  if (colon) { cmd = colon[1]; if (colon[2]) args.unshift(colon[2]); }
  cmd = cmd.replace(/[「」"']/g, '');
  if (!CMD_NAMES.includes(cmd)) return null;
  // 不带斜杠时从严：整条消息只能是「命令词 [一个参数]」，避免把普通台词当命令（继承命令除外）
  if (!withSlash && !isInheritCmd && args.length > 1) return null;
  const arg = isInheritCmd ? body.slice(cmd.length).trim().replace(/^[:：]\s*/, '') : String(args[0] ?? '').replace(/[「」"']/g, '');
  return { cmd: '/' + cmd, arg };
}

function dumpKnown(where) {
  const k = readKnown();
  if (k === null) {
    console.warn(TAG, `[${where}] 读不到 known —— 变量表里还没有 stat_data（等一拍再试，或看 __xsdWho()）`);
    return null;
  }
  const on = ALL_FIELDS.filter((f) => k[f] === true);
  const missing = ALL_FIELDS.filter((f) => !(f in k));
  console.log(TAG, `[${where}] known ${Object.keys(k).length} 字段，已解锁 ${on.length}：${on.length ? on.join('、') : '（无）'}`);
  if (missing.length) console.warn(TAG, `[${where}] ⚠️ 缺失字段（初始化没跑到？）：${missing.join('、')}`);
  return k;
}

/** 处理玩家命令；返回 true 表示这是一条命令（调用方会把它从上下文里藏掉） */
async function handleUserCommand(text, messageId) {
  const p = parseCommand(text);
  if (!p) return false;
  console.log(TAG, `[命令] ${p.cmd}${p.arg ? ' ' + p.arg.slice(0, 20) : ''}（第 ${messageId} 楼）`);

  if (p.cmd === '/已知') { dumpKnown('命令'); toast('info', '已知表已打到控制台（F12）', 5000); return true; }

  if (p.cmd === '/刷新开场白' || p.cmd === '/刷新') {
    const r = await refreshGreetings();
    console.log(TAG, r.ok ? '✅ 已刷新' : '❌ 未刷新（看上面那行原因）');
    toast(r.ok ? 'info' : 'warning', r.ok ? `开场白已刷新（${r.count} 条，停在第 ${r.idx} 条）` : '开场白未刷新，看控制台原因', 8000);
    return true;
  }

  if (p.cmd === '/身份') {
    console.log(TAG, `当前身份：${readIdentity() ?? '未设'}｜阵营：${readFaction() ?? '未设'}`);
    if (!p.arg) {
      for (const it of IDENTITIES) console.log(`  · ${it.name}  —— ${it.desc}`);
      console.log(TAG, '切身份：不带斜杠发「身份 <名字>」（下一回合的闸门生效）');
      toast('info', `当前身份：${readIdentity() ?? '未设'}`, 6000);
      return true;
    }
    const r = await writeIdentity(p.arg);
    if (r.ok) {
      const e = r.entries
        ? `，身份条目已切到「${p.arg}」（世界书 ${r.entries.wb}，改动 ${r.entries.changed} 条）`
        : '（身份条目未找到，闸门仍生效）';
      console.log(TAG, `✅ 身份已切换为「${p.arg}」／阵营「${r.faction}」（via ${r.via}）${e} —— 下一回合生效`);
      toast('info', `身份：${p.arg}`, 8000);
    } else {
      console.warn(TAG, `❌ 切换失败：${r.why}`);
      toast('warning', `切换失败：${r.why}`, 8000);
    }
    return true;
  }

  if (p.cmd === '/锚点' || p.cmd === '/帮助' || p.cmd === '/help') {
    console.log(TAG, '锚点清单：');
    for (const f of ALL_FIELDS) {
      const kind = AI_FIELDS.includes(f) ? '剧情可推进' : '起手公开';
      console.log(`  · ${f}  [${kind}]  ${FIELD_DESC[f] ?? ''}`);
    }
    console.log(TAG, HELP);
    toast('info', '锚点清单已打到控制台（F12）', 5000);
    return true;
  }

  if (p.cmd === '/设段') {
    const n = parseInt(p.arg, 10);
    if (!(n >= 1 && n <= STAGE_STEPS.length)) {
      console.warn(TAG, `用法：不带斜杠发「设段 <1-${STAGE_STEPS.length}>」——把当前进度拨到第 N 段的起点（之后仍照楼层往下走）`);
      toast('warning', `用法：设段 <1-${STAGE_STEPS.length}>`, 8000);
      return true;
    }
    const shift = STAGE_BASE[n - 1] - messageId;
    const r = await writeStat({ [FLOOR_PIN]: { floor: messageId, shift }, 段位: n, 窗口起点: 0, 时点加速: 0, 结算待办: 0 }, `设段 ${n}`);
    console.log(TAG, `✅ 段位已拨到第 ${n} 段（第 ${messageId} 楼 ⇒ 时间轴平移 ${shift} 楼）via ${(r && r.via) || '?'}`);
    toast('info', `段位 → 第 ${n} 段`, 6000);
    return true;
  }

  if (p.cmd === '/继承' || p.cmd === '/读档') {
    if (!p.arg) {
      console.warn(TAG, '用法：发「/继承 <大总结文本或段位号>」——自动继承历史进度并平移时间轴');
      toast('warning', '用法：/继承 <大总结文本或段位号>', 8000);
      return true;
    }
    const r = await applyInheritedArchive(p.arg, messageId);
    if (r && r.ok) {
      toast('info', `✅ 成功继承至第 ${r.targetStage} 段！大总结已载入记忆`, 8000);
    } else {
      toast('warning', `继承未完成：${(r && r.why) || '未识别到有效段位或剧情'}`, 8000);
    }
    return true;
  }

  if (p.cmd === '/解锁' || p.cmd === '/回锁') {
    if (!p.arg) {
      console.warn(TAG, `用法：不带斜杠发「${p.cmd.replace("/", "")} <字段>」（发「锚点」查清单）`);
      toast('warning', `用法：不带斜杠发「${p.cmd.replace("/", "")} <字段>」（发「锚点」查清单）`, 8000);
      return true;
    }
    // 身份／阵营是特殊项：不走 /解锁，走 /身份
    if (p.arg === '身份') {
      console.warn(TAG, '⚠️ 「身份」不是 /解锁 能开的字段 —— 请发「身份 <名字>」（不带斜杠），或点第 0 楼的菜单');
      toast('warning', '身份请发「身份 <名字>」（或点第 0 楼菜单）', 8000);
      return true;
    }
    if (p.arg === '阵营') {
      console.warn(TAG, '⚠️ 「阵营」随身份自动写，不单独解锁 —— 请发「身份 <名字>」（不带斜杠）');
      toast('warning', '阵营随身份自动写，请发「身份 <名字>」', 8000);
      return true;
    }
    const val = p.cmd === '/解锁';
    const r = await writeKnownField(p.arg, val);
    if (r.ok) {
      console.log(TAG, `✅ ${p.arg} = ${val}（via ${r.via}）—— 下一回合生效`);
      toast('info', `${p.arg} = ${val}`, 6000);
      setTimeout(() => dumpKnown('写入后'), 200);
    } else {
      console.warn(TAG, `❌ 写入失败：${r.why}`);
      toast('warning', `写入失败：${r.why}`, 8000);
    }
    return true;
  }

  if (p.cmd === '/物品' || p.cmd === '/行囊' || p.cmd === '/纳戒') {
    const sd = readStatData() || {};
    const inv = normalizeInventory(Array.isArray(sd.inventory) ? sd.inventory : defaultInventoryFor(sd.身份));
    console.log(TAG, `【纳戒物品清单】共 ${inv.length} 种：`);
    inv.forEach((it, i) => console.log(`  [${i + 1}] ${it.name} ×${it.count} —— ${it.desc || '无描述'}\n      详述：${it.full || it.desc || '无'}`));
    toast('info', `纳戒中共有 ${inv.length} 种随身物品（F12控制台可查详情）`, 6000);
    return true;
  }

  /* ★ 2026-10-07（主人问「console 是什么」）：给一条**不用控制台**的自检通道 ——
   *   发「验收」就把现场体检结果：① 弹窗（toast）② 打进控制台 ③ **写进变量 `验收报告`**。
   *   第③条是关键：变量随聊天存盘，之后可由 `tools/checks/_verify_acceptance.mjs` 直接读出来。 */
  if (p.cmd === '/验收' || p.cmd === '/体检' || p.cmd === '/自检') {
    const sd = readStatData() || {};
    const out = [];
    let bad = 0;
    const put = (ok, msg) => { out.push(`${ok ? '✔' : '✘'} ${msg}`); if (!ok) bad += 1; };

    /* ① 物品：数量与账本自洽 */
    const inv = normalizeInventory(sd.inventory);
    const badCount = inv.filter((it) => !(it.count >= 1) || !Number.isInteger(it.count));
    put(badCount.length === 0, `物品数量都是 ≥1 的整数（共 ${inv.length} 种：${inv.map((x) => x.name + '×' + x.count).join('、') || '空'}）`);
    const log = (sd.纳戒账本 && typeof sd.纳戒账本 === 'object') ? sd.纳戒账本 : {};
    const floors = Object.keys(log).filter((k) => /^\d+$/.test(k));
    out.push(`  纳戒账本记了 ${floors.length} 笔${floors.length ? '（第 ' + floors.slice(-5).join('、') + ' 楼）' : ''}`);

    /* ② 后台时点 vs 最近一楼状态栏里的 <时间> */
    const behind = String(sd.仙盟历文 || sd.仙盟历 || '').trim();
    let lastAi = '';
    for (let i = Math.max(0, messageId - 1); i >= 0 && i > messageId - 6; i -= 1) {
      let t = '';
      try { t = String(messageText(i) || ''); } catch (e) { t = ''; }
      if (t && !t.includes('/验收')) { lastAi = t; break; }
    }
    const wroteTime = (lastAi.match(/<时间>([\s\S]*?)<\/时间>/) || [])[1] || '';
    const same = !behind || !wroteTime
      || ((behind.match(/(\d{3,4})\s*年/) || [])[1] === (wroteTime.match(/(\d{3,4})\s*年/) || [])[1]
        && (behind.match(/(正月|冬月|腊月|闰?[一二三四五六七八九十]{1,2}月)/) || [])[1] === (wroteTime.match(/(正月|冬月|腊月|闰?[一二三四五六七八九十]{1,2}月)/) || [])[1]);
    put(same, `时点照抄：后台「${behind || '（没有）'}」／状态栏「${String(wroteTime).trim() || '（没读到）'}」`);

    /* ③ 成形锚点：翻真的必须带破身证据 */
    const kn = (sd.known && typeof sd.known === 'object') ? sd.known : {};
    const book = (sd.破处者 && typeof sd.破处者 === 'object') ? sd.破处者 : {};
    for (const fo of FORM_OF_HOLDERS) {
      const anchor = fo.form;
      if (kn[anchor] !== true) continue;
      const ok = fo.holders.some((h) => Boolean(book[h]) || kn[h + '处女丧失'] === true);
      put(ok, `${anchor} 已成形，${ok ? '有' : '**没有**'}破身证据（${fo.holders.join('／')}）`);
    }
    out.push(`  段位：${sd.段位 === undefined ? '（没设）' : sd.段位}｜身份：${sd.身份 || '（没设）'}`);

    const title = bad === 0 ? `✅ 体检通过（${out.filter((x) => /^[✔✘]/.test(x)).length} 项）` : `❌ 体检有 ${bad} 项不过`;
    const text = `【仙姝堕·现场体检】${title}\n` + out.join('\n') + `\n（时间：${new Date().toLocaleString()}）`;
    console.log(TAG, text);
    try {
      for (const line of out.slice(0, 6)) console.log('  ' + line);
    } catch (e) { /* 忽略 */ }
    toast(bad === 0 ? 'info' : 'warning', title.replace(/[（(].*$/, '') + '｜详情见变量「验收报告」', 10000);
    const r = await writeStat({ 验收报告: text }, '现场体检');
    if (r && r.ok) console.log(TAG, `✅ 体检报告已写进变量，可在下一条聊天记录里读出（via ${r.via}）`);
    else console.warn(TAG, `⚠️ 体检报告写盘失败：${(r && r.why) || '接口不可用'}（控制台里仍有全量）`);
    return true;
  }

  if (p.cmd === '/获得物品' || p.cmd === '/添加物品') {
    if (!p.arg) {
      toast('warning', '用法：/获得物品 <物品名> [数量] [简述] [详述]', 6000);
      return true;
    }
    const parts = p.arg.split(/\s+/);
    const itName = parts[0];
    const maybeN = /^\d+$/.test(parts[1] || '') ? Math.max(1, parseInt(parts[1], 10)) : 1;
    const rest = /^\d+$/.test(parts[1] || '') ? parts.slice(2) : parts.slice(1);
    const itDesc = rest[0] || '随身所得之物。';
    const itFull = rest.slice(1).join(' ') || itDesc;
    const sd = readStatData() || {};
    let inv = normalizeInventory(Array.isArray(sd.inventory) ? sd.inventory : defaultInventoryFor(sd.身份));
    const r = applyItemChange(inv, { kind: 'gain', name: itName, count: maybeN, desc: itDesc, full: itFull });
    inv = r.inv;
    await writeStat({ inventory: inv }, `获得物品「${itName}」×${r.applied}`);
    toast('info', `已将「${r.name}」×${r.applied} 收入纳戒`, 5000);
    return true;
  }

  if (p.cmd === '/消耗物品' || p.cmd === '/移除物品' || p.cmd === '/丢弃物品') {
    if (!p.arg) {
      toast('warning', '用法：/消耗物品 <物品名> [数量]（不写数量按 1 计）', 6000);
      return true;
    }
    const parts = p.arg.trim().split(/\s+/);
    const itName = parts[0];
    const n = /^\d+$/.test(parts[1] || '') ? Math.max(1, parseInt(parts[1], 10)) : 1;
    const sd = readStatData() || {};
    const inv0 = normalizeInventory(Array.isArray(sd.inventory) ? sd.inventory : defaultInventoryFor(sd.身份));
    const r = applyItemChange(inv0, { kind: 'loss', name: itName, count: n });
    if (!r.ok) {
      toast('warning', `纳戒中未找到「${itName}」`, 5000);
      return true;
    }
    await writeStat({ inventory: r.inv }, `消耗物品「${r.name}」×${r.applied}`);
    const left = r.inv.find((x) => x.name === r.name);
    toast('info', `已消耗「${r.name}」×${r.applied}${left ? `，还剩 ${left.count}` : '，已用尽并移出纳戒'}`, 6000);
    console.log(TAG, `[命令] 消耗「${r.name}」×${r.applied}（${r.note}）`);
    return true;
  }
  return false;
}

/**
 * 命令不该进模型上下文 ⇒ 把这条用户消息**隐藏**掉（酒馆里隐藏的楼层不参与生成）。
 * ⚠️ `MESSAGE_SENT` 是在消息 push 进聊天之后、`addOneMessage` 之前触发的，
 *    所以这里延后一拍再动手，避免和正在进行的渲染打架。
 * ⚠️ 失败了也不致命：只是那条命令文本会跟着进上下文，console 会给一条警告。
 */
function swallowCommandMessage(messageId) {
  if (!API.setChatMessages) {
    console.warn(TAG, '[命令] 没有 setChatMessages，命令楼藏不掉（命令文本会进上下文）');
    return;
  }
  /* ⚠️ v1.5（2026-09-28）：**藏完必须回读验证**。
   *   原实现只管调 `setChatMessages({is_hidden:true})`，成没成只能靠 promise 不抛错；
   *   若那一刻楼层还没写进聊天（或 JSR 还没就绪），它会**静默失败**，而命令文本照旧进上下文
   *   —— 而 `/已知` 这条命令一旦进上下文，等于把 13 个锚点全名每轮喂给模型一遍。 */
  const readHidden = () => {
    try {
      const m = API.getChatMessages(messageId, { include_swipes: false });
      const one = Array.isArray(m) ? m[0] : m;
      return !!(one && one.is_hidden === true);
    } catch (e) { return null; }                                // 回读不了 ⇒ 认不出成败
  };
  const attempt = (n) => {
    try {
      const ret = API.setChatMessages([{ message_id: messageId, is_hidden: true }], { refresh: 'affected' });
      const done = () => {
        const okv = readHidden();
        if (okv === true) {
          console.log(TAG, `✅ [命令] 第 ${messageId} 楼已隐藏并**回读确认**（命令不会进上下文）`
            + `${n > 1 ? `（第 ${n} 次尝试）` : ''}`);
          return;
        }
        if (n < 3) { setTimeout(() => attempt(n + 1), 220); return; }
        console.warn(TAG, `⚠️ [命令] 第 ${messageId} 楼隐藏后**回读仍不是 is_hidden**（尝试 ${n} 次）`
          + ' —— 这条命令文本可能会进上下文。请在聊天里确认该楼是否还在；'
          + '若反复如此，把控制台这几行发我，我改成「不吞楼」的 v0.7 行为。');
      };
      if (ret && typeof ret.then === 'function') ret.then(done).catch((e) => {
        console.warn(TAG, `[命令] 隐藏第 ${messageId} 楼失败（第 ${n} 次）：`, msgOf(e));
        if (n < 3) setTimeout(() => attempt(n + 1), 220);
      });
      else done();
    } catch (e) {
      console.warn(TAG, `[命令] 隐藏第 ${messageId} 楼抛错（第 ${n} 次）：`, msgOf(e));
      if (n < 3) setTimeout(() => attempt(n + 1), 220);
    }
  };
  setTimeout(() => attempt(1), 120);
}

/* ═══════════════════════════════════════════════════════════
 * 十一 · 锚点旁证（关键词对照，只打 console）
 * ═══════════════════════════════════════════════════════════ */

/**
 * 每轮 AI 消息后检查锚点：命中就提示「/解锁 X」。
 *   · 主路：关键词表（`ANCHOR_KEYWORDS`）—— 本版模型不再输出任何标记，只能靠正文认
 *   · 兼容：正文里若还写了 `<AnchorProposal>字段</AnchorProposal>` 也照收
 * ⚠️ **只提示、不写变量**：锚点只有玩家自己发 /解锁 才会翻开。
 */
function proposeAnchors(text, messageId) {
  const t = String(text ?? '');
  if (!t) return [];
  const hits = new Set();
  for (const m of t.matchAll(/<AnchorProposal>\s*([^<\s]+)\s*<\/AnchorProposal>/g)) hits.add(m[1]);
  const known = readKnown() || {};
  const skips = [];
  for (const f of ALL_FIELDS) {
    if (known[f] === true) continue;                          // 已解锁的不再提
    const kws = ANCHOR_KEYWORDS[f] || [];
    if (!kws.length) continue;
    const hitWords = kws.filter((k) => t.includes(k));
    if (!hitWords.length) continue;
    /* ⚠️ v1.5：只提到「地点名」不算发生事件 —— 必须再配上事件动词（见 ANCHOR_LOCATION_ONLY 注释） */
    const onlyLocation = hitWords.every((k) => ANCHOR_LOCATION_ONLY.includes(k));
    if (onlyLocation && !ANCHOR_SECOND_SIGNALS.some((k) => t.includes(k))) {
      skips.push(`${f}（只出现地点词 ${hitWords.join('、')}，未见事件动词 ⇒ 不提议）`);
      continue;
    }
    hits.add(f);
  }
  if (skips.length) console.log(TAG, `🔍 [旁证·已抑制] ${skips.join('；')}`);
  if (!hits.size) return [];
  for (const f of hits) {
    const ok = ALL_FIELDS.includes(f);
    console.log(TAG, `[旁证·关键词] ${f}${ok ? '' : '（⚠️ 不在字段台账里）'} —— 若认可，发送 /解锁 ${f}`
      );
    if (!ok) continue;
    /* ⚠️ 2026-09-29（主人令）：「**弹提示让玩家点头很蠢、而且很出戏**」⇒
     *   这里**不再 toast**，只往 console 打一行（排障用）。
     *   "本回合到底发生了什么"改由模型写在状态栏那个玩家看不见的 `<实际发生>` 栏里，
     *   由 `applyMilestones()` **自动记账**；关键词命中只作**旁证**（可对照排查漏记）。 */
    console.log(TAG, `[旁证·关键词] ${f} 的触发词在正文里出现了 —— 若模型没在 <实际发生> 里记它，`
      + `说明漏记了（可手工 /解锁 ${f}）。`);
  }
  return [...hits];
}

/* ═══════════════════════════════════════════════════════════
 * 十二 · 事件接线
 * ═══════════════════════════════════════════════════════════ */

/** 同一条消息可能被两个事件（收到／渲染完）各叫一次，去个重 */
const seenMessages = new Set();
function firstTime(key) {
  if (seenMessages.has(key)) return false;
  seenMessages.add(key);
  if (seenMessages.size > 300) seenMessages.clear();
  return true;
}

/** 启动 / 换聊天时的整体判定 */
async function boot(reason) {
  console.log(TAG, `[启动·${reason}] 开始（${VERSION}）—— 先补账本、再按开场白判定身份、最后绑菜单`);
  try {
    await ensureInit(reason);
    await syncIdentityFromFirstMes(reason);
    try { await reconcileNadeLedger(`启动·${reason}`); } catch (e) { /* 对账失败不影响启动 */ }
    ensureMenuBound();
    console.log(TAG, `[启动·${reason}] 完成`);
  } catch (e) {
    /* ⚠️ v1.5：不再静默吞。启动自检是账本的唯一入口之一，
     *   把失败原因打出来才能在真机上定位（v1.4 这里只打一行「已吞掉」，看不出账本没落地）。 */
    console.error(TAG, `❌ [启动·${reason}] 出错（卡仍能用，但账本可能没初始化）：`, msgOf(e));
  }
}

/** 玩家发言：先认命令，是命令就处理掉并藏起来；若非命令但在低楼层（<=3楼）或带大总结特征，智能识别继承 */
async function onUserMessageSent(messageId) {
  try {
    const text = messageText(messageId);
    if (text === null) return;
    const handled = await handleUserCommand(text, messageId);
    if (handled) {
      swallowCommandMessage(messageId);
      return;
    }
    // 非命令分支：智能继承识别（长跑重开自动接盘）
    const inh = detectInheritance(text, messageId);
    if (inh && inh.isInherited) {
      const r = await applyInheritedArchive(text, messageId);
      if (r && r.ok) {
        toast('info', `🎉 已智能识别大总结！成功继承至第 ${r.targetStage} 段，恢复锚点 ${r.anchorCount} 项`, 8000);
      }
    }
  } catch (e) { console.warn(TAG, '[命令] 处理失败：', msgOf(e)); }
}

/** AI 发言：解析状态条写变量（含 <实际发生> 自动记账） ＋ 关键词旁证 ＋ 收尾自检
 *  @param messageId 楼号
 *  @param opt.rawText 外部（渲染触发的 iframe）递进来的**原文**；给了就不再回读 getChatMessages
 *  @param opt.source  调用来源标记（只进 console，便于分辨「渲染触发」与「事件触发」）
 *  ⚠️ 两条来源共用这**同一个**函数 ⇒ v1.1 的「只记最新一楼」闸门对两条来源一视同仁，
 *     不存在「渲染触发绕过闸门」这种后门。 */
async function onAiMessageReceived(messageId, opt) {
  const o = opt || {};
  const srcTag = o.source || '事件';
  try {
    const text = (typeof o.rawText === 'string' && o.rawText) ? o.rawText : messageText(messageId);
    if (text === null || text === undefined || text === '') {
      console.log(TAG, `[消息·${srcTag}] #${messageId} 取不到正文，跳过`);
      return;
    }
    const n = Number(messageId);
    const cid = currentChatId();
    let swipeId = 0;
    try {
      if (API.getChatMessages) {
        const ms = API.getChatMessages(n, { include_swipes: true });
        const m = (Array.isArray(ms) ? ms[0] : ms) || {};
        swipeId = m.swipe_id ?? (m.swipes ? m.swipes.length : 0);
      }
    } catch (e) { /* 忽略 */ }
    const dedupeKey = `recv:${cid}:${n}:${swipeId}:${hashText(text)}`;
    if (!firstTime(dedupeKey)) return;
    if (!(n > 0)) {                                   // 第 0 楼是开场楼，没有状态可记
      console.log(TAG, `[消息·${srcTag}] #${n} 是开场楼，跳过状态解析与收尾自检`);
      return;
    }
    // ⚠️ v1.1：CHARACTER_MESSAGE_RENDERED 在**翻历史／重绘任意一楼**时也会触发。
    //   不挡住的话，玩家往回滚两屏，旧楼的状态栏就会被当成「当前状态」写回账本
    //   （而且是消息层＋聊天层双写，污染面很大）。
    //   v1.4 的渲染触发（iframe → __xsdStateTick）走的是**同一个**闸门 —— 翻历史时
    //   正则照样会给旧楼重建 iframe、iframe 照样会回调，所以这块挡板比以前更要紧。
    const latest = latestMessageId();
    if (latest !== null && n !== latest) {
      console.log(TAG, `[消息·${srcTag}] #${n} 不是最新一楼（当前 #${latest}），只重绘不记账`);
      return;
    }
    proposeAnchors(text, n);
    checkOutputContract(text, n);
    await applyStatusToVars(text, n);
  } catch (e) { console.warn(TAG, `[消息·${srcTag}] 处理第 ${messageId} 楼失败：`, msgOf(e)); }
}

/* ═══════════════════════════════════════════════════════════
 * 十二·二 · 渲染触发入口（主路径）—— 照抄外卡《大乾风华录 Ver2.0》
 *   卡内正则把 <Status_block> 换成「面板 HTML ＋ 隐藏原文副本 ＋ 自包含 iframe」，
 *   iframe（独立文档，不被 DOMPurify 清洗）在 load 时读宿主消息、拿到 (mesid, 原文)，
 *   再调本函数 ⇒ 解析／记账／提议全部照跑。
 *   ⚠️ 全程不许抛错：任何一步失败都只是少一份账，不能把渲染链带崩。
 *   ⚠️ 本函数**不写 DOM**（面板重绘交回面板脚本），只做「解析 → 写变量」。
 * ═══════════════════════════════════════════════════════════ */
async function xsdStateTick(mesid, rawText, source) {
  const n = Number(mesid);
  const src = source || '渲染触发';
  if (!Number.isFinite(n) || n < 0) {
    console.log(TAG, `[tick·${src}] 楼号无效（${mesid}），跳过`);
    return { ok: false, why: 'bad mesid' };
  }
  console.log(TAG, `[tick·${src}] #${n} 收到渲染触发${rawText ? `（随带原文 ${String(rawText).length} 字）` : '（无原文，回读消息）'}`);
  await onAiMessageReceived(n, { rawText, source: src });
  // 顺带把面板也重绘一次（面板脚本在场时才有；不在场就跳过，互不依赖）
  try {
    const fill = (typeof window !== 'undefined' && typeof window.__xsdFillPanel === 'function')
      ? window.__xsdFillPanel
      : ((typeof window !== 'undefined' && window.parent && typeof window.parent.__xsdFillPanel === 'function')
        ? window.parent.__xsdFillPanel : null);
    if (fill) fill(n, rawText);
  } catch (e) { /* 面板脚本不在场属正常，静默 */ }
  return { ok: true, mesid: n, source: src };
}

/* 把入口挂到 window / window.parent / window.top 三处（哪一层都抠得到就认） */
(function registerTickEntry() {
  const targets = [];
  const push = (name, get) => {
    try { const w = get(); if (w && !targets.includes(w)) targets.push(w); } catch (e) { /* 跨源跳过 */ }
  };
  push('self', () => window);
  push('parent', () => window.parent);
  push('top', () => window.top);
  let ok = 0;
  for (const w of targets) {
    try { w.__xsdStateTick = xsdStateTick; w.__xsdStateTickVersion = VERSION; ok++; } catch (e) { /* 跨源跳过 */ }
  }
  console.log(TAG, `[接线] __xsdStateTick 已挂到 ${ok} 个全局（${VERSION}）—— 渲染触发＝主路径`);
})();

if (API.eventOn && EVENTS) {
  const on = (name, fn, why) => {
    const ev = EVENTS[name];
    if (!ev) { console.warn(TAG, `⚠️ tavern_events 里没有 ${name}，这个钩子跳过（${why}）`); return; }
    try { API.eventOn(ev, fn); }
    catch (e) { console.warn(TAG, `⚠️ 监听 ${name} 失败：`, msgOf(e)); }
  };

  // ⚠️ 主路径 ＝ 渲染触发（见上方 xsdStateTick）。下面这两条**只是冗余加速**：
  //    能拿到就早一拍、少一次回读；拿不到（eventOn 缺失／事件改名）也必须一切正常。
  on('MESSAGE_SENT', (id) => onUserMessageSent(id), '玩家命令（事件驱动，不可拔）');
  on('MESSAGE_RECEIVED', (id) => onAiMessageReceived(id, { source: '事件·冗余加速' }), '状态条解析的**冗余加速**（主路径是渲染触发）');
  on('CHARACTER_MESSAGE_RENDERED', (id) => onAiMessageReceived(id, { source: '事件·冗余加速' }), '同一楼重渲染的**冗余加速**（已去重；闸门仍生效）');
  on('CHAT_CHANGED', () => setTimeout(() => boot('换聊天'), 400), '换聊天时重新判定身份（事件驱动，不可拔）');
  on('CHAT_CREATED', () => setTimeout(() => boot('新聊天'), 400), '新聊天初始化（事件驱动，不可拔）');
  on('MESSAGE_SWIPED', () => setTimeout(() => { ensureInit('滑开场白'); syncIdentityFromFirstMes('滑开场白'); }, 400), '滑开场白时重新判定身份（事件驱动，不可拔）');
  console.log(TAG, `${VERSION} 已接线：命令 / 换聊天 / 开场白（事件）＋ 冗余加速（收到／渲染）；主路径＝渲染触发 ${'__xsdStateTick'}`);
} else {
  console.warn(TAG, '⚠️ eventOn 或 tavern_events 不可用 —— **命令 / 换聊天 / 开场白**这三块会退步（要手打 /已知 才看得到账本）；'
    + '状态记账与面板填充不受影响，它们走渲染触发（__xsdStateTick / __xsdFillPanel）。');
}

/* 身份菜单的点击委托：**无条件**挂（不依赖 eventOn），并重试几次 */
try { ensureMenuBound(); } catch (e) { console.warn(TAG, '[身份] 挂菜单出错：', msgOf(e)); }

/* ═══════════════════════════════════════════════════════════
 * 十三 · 诊断入口（主控制台或任意控制台可调）
 * ═══════════════════════════════════════════════════════════ */

/** 可用接口清单（都做 typeof 保护，取不到的写「不可用」） */
function apiReport() {
  const out = {};
  for (const k of Object.keys(API)) out[k] = typeof API[k] === 'function' ? '可用' : '不可用';
  out.eventOn = typeof API.eventOn === 'function' ? '可用' : '不可用';
  out.tavern_events = EVENTS ? '可用' : '不可用';
  out.toastr = (() => {
    try { if (window.parent && window.parent.toastr) return '可用（主窗口）'; } catch (e) { /* 跨源 */ }
    try { return (typeof toastr !== 'undefined' && toastr) ? '可用（本 iframe）' : '不可用'; } catch (e) { return '不可用'; }
  })();
  return out;
}

/** 一键诊断：身份 / 阵营 / 已知 / 菜单 / 上下文 / 接口 / 读写层 */
function xsdWho() {
  const known = readKnown() || {};
  const out = {
    版本: VERSION,
    当前身份: readIdentity(),
    当前阵营: readFaction(),
    已解锁字段: ALL_FIELDS.filter((f) => known[f] === true),
    未设字段: ALL_FIELDS.filter((f) => typeof known[f] !== 'boolean'),
    菜单委托已挂: (() => { try { return !!(window.parent && window.parent.document && window.parent.document.__xsdMenuBound); } catch (e) { return '跨源取不到'; } })(),
    跑在iframe里: (() => { try { return window.top !== window.self; } catch (e) { return '跨源取不到'; } })(),
    /* v1.4：渲染触发链的两个入口在不在 —— 排障时一眼看出「主路径」通不通 */
    渲染触发入口: {
      __xsdStateTick: (() => { try { return typeof window.__xsdStateTick === 'function' ? '可用' : '不可用（本层）'; } catch (e) { return 'ERR'; } })(),
      父窗: (() => { try { return window.parent ? (typeof window.parent.__xsdStateTick === 'function' ? '可用' : '不可用') : '无父窗'; } catch (e) { return '跨源取不到'; } })(),
      顶层: (() => { try { return window.top ? (typeof window.top.__xsdStateTick === 'function' ? '可用' : '不可用') : '无顶层'; } catch (e) { return '跨源取不到'; } })(),
      面板入口__xsdFillPanel: (() => {
        try { if (typeof window.__xsdFillPanel === 'function') return '可用（本层）'; } catch (e) { /* 继续 */ }
        try { return (window.parent && typeof window.parent.__xsdFillPanel === 'function') ? '可用（父窗）' : '不可用'; } catch (e) { return '跨源取不到'; }
      })(),
      主路径: '渲染触发（卡内正则产出的 iframe 回调）；eventOn 缺失不影响这一条',
    },
    可用API清单: apiReport(),
    读写层: {
      读: '消息层(#-1)优先 → 聊天层兜底 → 都没有就初始化',
      写: '双写：消息层(#-1) ＋ 聊天层，两次都走同一条路',
      消息层: layerProbe(L_MSG),
      聊天层: layerProbe(L_CHAT),
    },
    第0楼swipe: (() => {
      try {
        const m0 = API.getChatMessages(0, { include_swipes: true })[0];
        return {
          当前: m0 && m0.swipe_id,
          全部: (((m0 && m0.swipes) || []).map((s, i) => {
            const m = /<IdentityPick\s+name="([^"]+)"/.exec(String(s));
            return `${i}:${m ? m[1] : '无标记'}${String(s).includes('<IdentityMenu/>') ? '(菜单楼)' : ''}`;
          })),
        };
      } catch (e) { return 'ERR ' + msgOf(e); }
    })(),
  };
  console.log(TAG, out);
  return out;
}

/** 只打快照，方便一眼看出账本长什么样 */
function xsdDump() { return dumpStat('手动快照'); }

/** 重跑一次初始化 ＋ 首楼身份判定（不覆盖已设身份） */
function xsdBoot() { return boot('手动'); }

window.__xsdWho = xsdWho;
window.__xsdDump = xsdDump;
window.__xsdBoot = xsdBoot;
try {
  window.parent.__xsdWho = xsdWho;
  window.parent.__xsdDump = xsdDump;
  window.parent.__xsdBoot = xsdBoot;
} catch (e) { /* 跨源则跳过 */ }

/* ═══════════════════════════════════════════════════════════
 * 十四 · 启动自检
 * ═══════════════════════════════════════════════════════════ */
setTimeout(() => {
  try {
    console.log(TAG, `── 启动自检 ${VERSION} ──（下面那行「[初始化·启动]」是本版新增的账本心跳：`
      + '看到「字段齐全」或「✅ 已落地」都算正常；看到「❌ 变量没写进去」就是账本没落地）');
  } catch (e) { /* 忽略 */ }
  xsdWho();
  boot('启动');
}, 1500);

console.log(TAG, `${VERSION} 已加载。命令：/已知 · /锚点 · /解锁 <字段> · /回锁 <字段> · /身份 [名字] · /刷新开场白；`
  + '第 0 楼的身份菜单可点击；控制台可调 __xsdWho() / __xsdDump() / __xsdBoot()；'
  + '渲染触发入口 window.__xsdStateTick(mesid, rawText)；控制台调试：__xsdStateTick(1, "<Status_block>…</Status_block>")。');
