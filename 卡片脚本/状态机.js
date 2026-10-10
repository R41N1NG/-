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

try { console.log('[XDS 状态机] 启动自检：脚本已加载 v' + (typeof VERSION !== 'undefined' ? VERSION : '?'), new Date().toLocaleTimeString()); } catch (e) {}

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
  /* ── 剧情推进（中立大势与世界事实） ── */
  { kind: 'ai', name: '极乐引入手', desc: '邪修洞府之变：拿到《极乐引》残篇', kws: ['极乐引'] },
  { kind: 'ai', name: '已抵达天溪', desc: '仙盟南下驰援：一行抵达天溪城', kws: ['抵达天溪', '天溪城下', '入天溪城'] },
  { kind: 'ai', name: '进入幽寂谷', desc: '幽寂谷秘境异动：一行进入幽寂谷', kws: ['幽寂谷'] },
  { kind: 'ai', name: '兽潮血战', desc: '天溪城头的兽潮血战（与「天溪城兽潮」同段）', kws: ['兽潮', '血战'] },
  { kind: 'ai', name: '天溪城破', desc: '天溪城破与沦陷：兽潮总攻、西南城破', kws: ['城破', '城陷'] },
  { kind: 'ai', name: '灼酒流炎穴成形', desc: '叶红缨 · 灼酒流炎穴成形（元阴初破）', kws: ['灼酒流炎穴', '赤羽堕凡尘'] },
  
  { kind: 'ai', name: '九幽玄阴穴成形', desc: '孤月 · 九幽玄阴脉的伴生异穴，元阴初破时成形（依据：【名器】九幽玄阴穴／【人物】孤月 秘密所在）', kws: ['九幽玄阴穴', '九幽玄阴脉'] },
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
  
  { kind: 'ai', name: '孤月处女丧失', desc: '孤月 · 九幽玄阴穴的持有者被破身（元阴初破的那一刻）', kws: ['孤月处女丧失'] },
  { kind: 'ai', name: '叶红缨处女丧失', desc: '叶红缨 · 灼酒流炎穴的持有者被破身', kws: ['叶红缨处女丧失'] },
  { kind: 'ai', name: '闻观语处女丧失', desc: '闻观语 · 心魔茶璎乳的持有者被破身', kws: ['闻观语处女丧失'] },
  { kind: 'ai', name: '楚灵夜处女丧失', desc: '楚灵夜 · 般若菩提菊的持有者被破身', kws: ['楚灵夜处女丧失'] },
  
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
  
  { kind: 'ai', name: '已抵达陨仙原', desc: '北域陨仙原一线：一行人或玩家这条线真的走到了陨仙原（魂欢殿主名下那批资料的统一闸门）', kws: ['陨仙原'] },
  /* ── 中立世界大势锚点 ── */
  { kind: 'ai', name: '天姝榜建立', desc: '神女殿中颁下《天姝榜》（极乐太子亲手颁）', kws: ["天姝榜"] },
  { kind: 'ai', name: '获得任意名器', desc: '玩家这条线上第一次真的接触到／得到一件名器', kws: ["获得任意名器"] },
  { kind: 'ai', name: '南域大劫', desc: '南域大劫爆发：神诅降下、粉黑天穹、四殿册封', kws: ["南域大劫","神诅"] },
  { kind: 'ai', name: '天溪城兽潮', desc: '大规模兽潮压到天溪城下', kws: ["兽潮"] },
  { kind: 'ai', name: '阎雷子脱困', desc: '阎雷子脱困／破关而出', kws: ["阎雷子脱困"] },
  { kind: 'ai', name: '进入葬魔渊', desc: '玩家这条线进入葬魔渊', kws: ["葬魔渊"] },
  { kind: 'ai', name: '神女殿建成', desc: '墨山道原址之上拔起天姝会神女殿', kws: ["神女殿"] },
  { kind: 'ai', name: '百丈天魔神像显形', desc: '神女殿中百丈天魔神像显形', kws: ["天魔神像"] },
  { kind: 'ai', name: '受封殿主', desc: '南域大劫后受封天姝会殿主', kws: ["受封殿主"] },
  { kind: 'ai', name: '阎雷子夺舍', desc: '炼欲魔君残魂夺舍炎雷子', kws: ["阎雷子夺舍"] },
  { kind: 'ai', name: '墨山道覆灭', desc: '墨山道覆灭', kws: ["墨山道覆灭"] },

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
  { name: '赵无忧', desc: '墨山道六弟子（原著主角）· 默认时点＝第一章 · 仙盟历 1578 年 三月' },
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

/** 身份：gpt。章节计算核；常量与旧计算签名保持，日期资格由应用层显式提供。 */
function createXsdStageRules() {
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
  ['极乐引入手'],                                             // 段 2: 邪修洞府
  ['进入幽寂谷'],                                             // 段 3: 幽寂谷秘境
  ['南域大劫'],                                              // 段 4: 南域大劫
  null,                                                      // 段 5: 仙盟调令
  ['已抵达天溪'],                                            // 段 6: 初入天溪
  ['天溪城兽潮', '兽潮血战'],                                 // 段 7: 兽潮血战
  ['灵犀同心成形'],                                          // 段 8: 灵犀同心
  null,                                                      // 段 9: 战事焦灼
  null,                                                      // 段 10: 守城固守
  ['天溪城破'],                                              // 段 11: 天溪城破
  ['进入葬魔渊'],                                            // 段 12: 葬魔深渊
  ['灼酒流炎穴成形'],                                         // 段 13: 名器觉醒
  null,                                                      // 段 14: 洞府潜伏
  ['灼酒流炎穴二阶段']                                         // 段 15: 二阶沉沦
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


return Object.freeze({STAGE_STEPS, STAGE_BASE, SEG_TIME, FLOOR_PIN, STAGE_FAST_FORWARD,
  isSceneLocked, stageOfFloor, checkFastForwardStage});
}
const XSD_STAGE_RULES = createXsdStageRules();
const { STAGE_STEPS, STAGE_BASE, SEG_TIME, FLOOR_PIN, STAGE_FAST_FORWARD } = XSD_STAGE_RULES;
function isSceneLocked(text, stat) { return XSD_STAGE_RULES.isSceneLocked(text, stat); }
function stageOfFloor(floor, shift) { return XSD_STAGE_RULES.stageOfFloor(floor, shift); }
function checkFastForwardStage(known, curStage) { return XSD_STAGE_RULES.checkFastForwardStage(known, curStage); }
/* XSD_CALENDAR_CORE_BEGIN */
/* 身份：gpt。日期计算独立作用域：无宿主API、DOM、日志、存取或启动副作用。
 * 声明工厂供卡内拼接与Node离线加载共用同一真源，不向window挂载接口。 */
function createXsdCalendar() {
  'use strict';
const LISHI_CAP = 0.1;            // 常规单笔最多三日，超限整笔拒绝。
const LISHI_CAP_TRANSIT = 12;     // 合法转场单笔最多一年。

/** 显式输入，不读取宿主、完整stat_data或共享变量，不产生日志/写入。
 * @returns {{acc:number, adv:number, sameFloor?:boolean, clipped:boolean, rejected:boolean, capM:number, raw:number}}
 * 人工同楼分支保留旧返回形状（没有sameFloor）；兼容旧数值转换与缺失回退。
 */
function calculateAdvance({ accumulated, fallbackOffset, previousFloor, previousAdvance,
  manualLocked, manualFloor, floor, months, transit }) {
  if (manualLocked && Number(manualFloor) === Number(floor)) {
    return { acc: Number(accumulated) || 0, adv: 0, clipped: false, rejected: false, raw: 0, capM: LISHI_CAP };
  }
  const xsdNum = (v) => (v === null || v === undefined || v === '' ? NaN : Number(v));
  const nAcc = xsdNum(accumulated);
  const nPush = xsdNum(fallbackOffset);
  const sameFloor = Number(previousFloor) === Number(floor);
  let acc = isFinite(nAcc) ? nAcc : (isFinite(nPush) ? nPush : 0);
  if (sameFloor) acc = Math.max(0, acc - (Number(previousAdvance) || 0));
  if (!isFinite(acc) || acc < 0) acc = 0;
  const capM = transit ? LISHI_CAP_TRANSIT : LISHI_CAP;
  let adv = 0;
  let clipped = false;
  let rejected = false;
  if (Number(months) > 0) {
    const raw = Number(months);
    clipped = raw > capM;
    if (clipped) {
      adv = 0;
      rejected = true;
    } else {
      adv = raw;
      acc = acc + adv;
    }
  }
  return { acc, adv, sameFloor, clipped, rejected, capM, raw: Number(months) || 0 };
}

const LISHI_TRANSIT_RE = /((闭关|数月|数日|数载|隔日|翌日|次日|翌月|次月|开春|入秋|半月|一月|两月|三月|半年|一年|旅程|远行|渡舟|赶路|回宗|返程|数周|一旬|旬日|半月后|数日后|一月后)|([一二三四五六七八九十两半\d]\s*个月|数个月|几个月|数旬|一季|两季))/;   /* 2026-10-08（gpt 04 号②）：原式只认「一月」不认「一个月」⇒ 解析成 1 月却按常规 0.02 截掉 */

const CN_DAY = ['', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

function cnNum(t) {
  /* gpt P1-8 兜底：允许直接传「初X」 */
  { const raw = String(t ?? '').trim(); if (raw.startsWith('初') && raw.length > 1) t = raw.slice(1); }
  
  const D = '〇一二三四五六七八九';
  const x = String(t || '').trim();
  if (!x) return 0;
  if (/^\d+$/.test(x)) return Number(x);
  if (x === '十') return 10;
  if (x === '正') return 1;      // 正月
  if (x === '冬') return 11;     // 冬月
  if (x === '腊') return 12;     // 腊月
  if (x[0] === '廿') return 20 + Math.max(0, D.indexOf(x[1]));
  if (x[0] === '卅') return 30 + Math.max(0, D.indexOf(x[1]));   /* gpt P1-8：卅一=31（原来一律返回 30，把非法日当成 30 收下）*/
  const m = /^([一二三四五六七八九])?十([一二三四五六七八九])?$/.exec(x);
  if (m) return (m[1] ? D.indexOf(m[1]) : 1) * 10 + (m[2] ? D.indexOf(m[2]) : 0);
  if (x.length === 1) { const n = D.indexOf(x); if (n >= 0) return n; }
  return 0;
}

function pickTimepointLine(t) {
  const hits = String(t || '').split('\n').filter((l) => /当前时点/.test(l));
  if (hits.length !== 1) return '';
  const m = /当前时点[：:]\s*(.+)$/.exec(hits[0].trim());
  return m ? m[1].trim() : '';
}

function parseXianmengFromText(t) {
  const m = /仙盟历\s*(\d{3,4})\s*年\s*[·\.、]?\s*([一二三四五六七八九十廿卅正冬腊]{1,3}|\d{1,2})\s*月\s*(?:[·\.、]?\s*(初[一二三四五六七八九十]{1,2}|[一二三四五六七八九十廿卅]{1,3}|\d{1,2})\s*日?)?/.exec(String(t || ''));
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
  ['一夜', 1 / 30], ['一日', 1 / 30], ['三天', 0.1], ['三日', 0.1],
  ['半月', 0.5], ['一月', 1], ['三月', 3], ['一年', 12],
];
function parseLishi(s) {
  const txt = String(s || '').trim();
  if (!txt || /^[—\-－无]+$/.test(txt)) return 0;
  /* 2026-10-08（gpt 04 号④ ＋ 17 号 §5-4）：倒计时／**未来计划**不计增量。
     『距启程 3 日』『还有两日』『师尊说三日后启程』『定于/拟于/约于 X』一律 0；
     只有明写"已过／已经过／历经"的转场才算（例：『三日已过，我们启程』⇒ 计 3 日）。 */
  const XSD_PASSED = /已过|已经过|过了|历经|这一过/.test(txt);
  if (!XSD_PASSED && /倒计时|距[^，。；]{0,12}?[日天]|还有[^，。；]{0,6}?[日天]|将于|预定于|定于|拟于|约于/.test(txt)) return 0;
  if (!XSD_PASSED && /((说|约定|打算|计划|准备|拟)[^，。；]{0,10}([日天月]|个月)(后|之后))|(([日天月]|个月)后[^，。；]{0,6}(启程|出发|动身|前往|赴))/.test(txt)) return 0;
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
    const uMap = { 时辰: 0.003, 个时辰: 0.003, 日: 1 / 30, 天: 1 / 30, 月: 1, 个月: 1, 年: 12 };   /* 2026-10-08（gpt 04 号①）：统一 30 日/月精确单位，一日 ＝ 1/30 ＝ 0.03333 */
    const u = uMap[n[2]] || 0;
    if (isFinite(v) && v > 0) best = v * u;
  }
  // ② 专有或特定词表兜底（如 一夜、一炷香、半个时辰等）
  if (!best) {
    for (const [w, m] of LISHI_WORDS) if (txt.includes(w) && m > best) best = m;
  }
  return best;   /* gpt P1-7：内层不再提前截断 —— 过渡历时会被 0.02 吃掉；截断统一交外层 capM */
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

function hasTransit(elapsedText, bodyText) {
  return LISHI_TRANSIT_RE.test(String(elapsedText || '') + ' ' + String(bodyText || '').slice(0, 400));
}
function dayOfMonth(totalMonths) {
  return 1 + Math.floor((((totalMonths % 1) + 1) % 1) * 30 + 1e-9);
}
return Object.freeze({
  caps: Object.freeze({ regular: LISHI_CAP, transit: LISHI_CAP_TRANSIT }),
  calculateAdvance, cnNum, pickTimepointLine, parseXianmengFromText, fmtXianmengDay,
  parseLishi, fmtXianmeng, ymToMonths, monthsToYm, hasTransit, dayOfMonth,
});
}
/* XSD_CALENDAR_CORE_END */
/* XSD_CALENDAR_ADAPTER_BEGIN */
/* 身份：gpt。旧调用名兼容层：仅这里读取账本字段、输出拒绝日志。
 * 其它模块继续使用原函数签名，纯核只接受明确的日期/历时输入。 */
const XSD_CALENDAR = createXsdCalendar();

function nextAcc(sdNow, messageId, stepM, hasTransit) {
  const o = sdNow || {};
  const result = XSD_CALENDAR.calculateAdvance({
    accumulated: o.历时累计, fallbackOffset: o.时点加速,
    previousFloor: o.最后处理楼号, previousAdvance: o.本楼历时加速,
    manualLocked: !!o.人工校历, manualFloor: o.人工校历 && o.人工校历.楼,
    floor: messageId, months: stepM, transit: hasTransit,
  });
  if (result.rejected) {
    console.warn('[历时·拒绝] 本楼申报 ' + result.raw + ' 月 超过单笔上限 ' + result.capM + ' 月 ⇒ **整笔不计入**（累计保持 ' +
      result.acc + ' 月）。要推这么多，请走合法转场（明写时间流逝）或由 GM 面板确认；后台已记 [历时待确认]。');
  }
  return result;
}
function cnNum(t) { return XSD_CALENDAR.cnNum(t); }
function pickTimepointLine(t) { return XSD_CALENDAR.pickTimepointLine(t); }
function parseXianmengFromText(t) { return XSD_CALENDAR.parseXianmengFromText(t); }
function fmtXianmengDay(v, day) { return XSD_CALENDAR.fmtXianmengDay(v, day); }
function parseLishi(s) { return XSD_CALENDAR.parseLishi(s); }
function fmtXianmeng(v) { return XSD_CALENDAR.fmtXianmeng(v); }
function ymToMonths(ym) { return XSD_CALENDAR.ymToMonths(ym); }
function monthsToYm(totalMonths) { return XSD_CALENDAR.monthsToYm(totalMonths); }
/* XSD_CALENDAR_ADAPTER_END */
/** 标签 → 变量键（**与 `状态栏面板.js` 的 FIELD_MAP 同源**，改一处必须改两处）
 *  ⚠️ `身份` 在这里只用于「认得出这一行」，**不写进变量**：变量里的 `身份` 是机器字段
 *     （只能是 6 个身份名之一，闸门靠它判真假），写进「墨山道六弟子 · 赵无忧」会把闸门搞坏。
 *  ⚠️ 键的**声明顺序＝状态栏里一级标签的固定顺序**（时间→…→关系刻度，共 16 个；另有序
 *     `进度`，它不进这张表也不写变量，只做一致性校验）。 */
/* XSD_TIME_BASIS_CORE_BEGIN */
/* 身份：gpt。显式选择可信时间基准：不接受当前AI正文、不读取宿主、不写账。
 * 输入openingLine由适配层从首楼唯一“当前时点”行提供；解析不等于事实批准。 */
function createXsdTimeBasis(calendar) {
  'use strict';
  const starts = {
    赵无忧: { ym: 1578.03, day: 3 },
    焚欲殿主: { ym: 1578.08, day: 1 }, 浊龙殿主: { ym: 1578.08, day: 1 },
    欢喜殿主: { ym: 1578.08, day: 1 }, 魂欢殿主: { ym: 1578.08, day: 1 },
  };
  const validInitial = value => isFinite(Number(value)) && Number(value) > 0;
  function needsOpening({ storedBasis, identity, initialTime }) {
    if (Number(storedBasis) || 0) return false;
    if (starts[String(identity || '')]) return false;
    return !validInitial(initialTime);
  }
  function select({ storedBasis, identity, initialTime, openingLine }) {
    const saved = Number(storedBasis) || 0;
    if (saved) return { basis: saved, source: 'stored-basis', saveBasis: false, initialTime: null, logOpening: false };
    const fixed = starts[String(identity || '')];
    if (fixed) return { basis: calendar.ymToMonths(fixed.ym) + (fixed.day - 1) / 30,
      source: 'identity', saveBasis: true, initialTime: null, logOpening: false };
    let start = Number(initialTime);
    let discovered = null;
    if (!validInitial(start)) {
      const picked = openingLine ? calendar.parseXianmengFromText(openingLine) : null;
      if (picked) { start = calendar.ymToMonths(picked.ym) + (picked.day - 1) / 30; discovered = start; }
    }
    const valid = validInitial(start);
    return { basis: valid ? start : calendar.ymToMonths(1578.03) + 2 / 30,
      source: discovered !== null ? 'opening-line' : valid ? 'stored-opening' : 'default',
      saveBasis: true, initialTime: discovered, logOpening: true };
  }
  return Object.freeze({ needsOpening, select });
}
/* XSD_TIME_BASIS_CORE_END */
/* 身份：gpt。首楼读取由这一层承担，纯核只选择，写回仍由原applyStatus统一负责。 */
const XSD_TIME_BASIS = createXsdTimeBasis(XSD_CALENDAR);
function resolveCalendarBasis(sdNow) {
  const input = { storedBasis: sdNow.历基准, identity: sdNow.身份, initialTime: sdNow.初始时点 };
  let openingLine = '';
  if (XSD_TIME_BASIS.needsOpening(input)) {
    try { openingLine = pickTimepointLine(String(messageText(1) || '')); }
    catch (error) { /* 首楼读不到仍走原共享默认，不读当前AI正文。 */ }
  }
  return XSD_TIME_BASIS.select({ ...input, openingLine });
}
/** 身份：gpt。世界事件日期与自由字段策略核，无宿主读写。 */
function createXsdPlotPolicy() {
const FREE_FIELD_WHITELIST = ['局势', '近闻', '远闻', '危机', '目标', '阶段总结'];
const FREE_WORLD_EVENTS = [
  { 名: '南域大劫', 起点: 1578.08, 宣言: /(神诅|大劫|粉黑天穹|再无元婴)[^，。；！？]{0,10}(已|已经|正在|正|降下|降临|爆发|压在|笼罩)/ },
  { 名: '正式兽潮', 起点: 1579.01, 宣言: /(兽潮|妖兽潮|围城|城防|防线)[^，。；！？]{0,12}(已|已经|正在|正|一波接一波|数日|兵临城下|破关|破门|压城|围了|杀到|冲破|溃缩|溃退|崩溃|失守|告急|溃败)/ },
  { 名: '天溪城破', 起点: 1579.03, 宣言: /(城破|城陷|陷落|城门失守|城墙崩|大阵告破|化为焦土|沦为焦土)/ },
];
const FREE_NEGATED_OR_PLAN = /传闻|据说|听说|谣传|或将|将要|即将|可能|恐怕|尚未|还没|未至|未到|计划|打算|预定|约期|若是|万一|倘若|假如|是否/;

/* 2026-10-08（主人令·选 C）：**泛指战事**不拦，只记账待核 —— gpt 原话「歧义不自动写真，待核」。
 *   六个自由字段里若出现「战火／战事／兵灾／战乱／兵锋／战报／血战」这类**没点名的战争话**，
 *   而当时的可信时点又早于世界事件最早的起点（大劫 1578.08），就记进 `stat_data.自由字段待核`：
 *   **照写、不拒**，只在后台留痕（日志 ＋ 待核台账），由主人/GM 决定要不要清。
 *   传闻／计划／否定／疑问／回忆（当年、昔日…）一律不标。 */
const FREE_VAGUE_WAR = /(战火|战事|兵灾|战乱|兵锋|兵戈|战报|军情|血战|恶战|厮杀|烽烟|烽火)/;
const FREE_SUSPECT_EXEMPT = /传闻|据说|听说|谣传|曾经|当年|昔日|从前|彼时|将要|即将|打算|计划|预定|若是|万一|倘若|假如|是否|尚未|还没|未至|未到/;
const FREE_SUSPECT_FLOOR = 1578.08;   /* 世界事件最早起点（大劫）：过了它，泛指战事属正常，不再标待核 */

/** 返回 {suspect:false} 或 {suspect:true, 事件, 因由, 分句}（纯函数，可离线测） */
function freeFieldSuspect(field, val, sd) {
  if (FREE_FIELD_WHITELIST.indexOf(field) === -1) return { suspect: false };
  if (!val || typeof val !== 'string' || val === '—' || val === '无') return { suspect: false };
  const dnum = Number(sd && sd.仙盟历);
  if (isFinite(dnum) && dnum >= FREE_SUSPECT_FLOOR) return { suspect: false };
  const 命中 = String(val).split(/[，。；！？\n]/).filter((c) => FREE_VAGUE_WAR.test(c) && !FREE_SUSPECT_EXEMPT.test(c));
  if (!命中.length) return { suspect: false };
  return {
    suspect: true, 事件: '战事（泛指）',
    因由: (!isFinite(dnum) ? '时点不可信' : ('当前 ' + dnum + ' 早于大劫起点 ' + FREE_SUSPECT_FLOOR)) + '，而这一格在说战事 ⇒ 标待核（**不拦，只记账**）',
    分句: 命中[0].slice(0, 40),
  };
}

/** 返回 {ok:true} 或 {ok:false, 事件, 因由}（纯函数，可离线测）
 *  ⚠️ 豁免是**按分句**判的：只有"含该事件宣言的那个分句"里出现传闻/计划/否定词才豁免。
 *     否则「兽潮已破两处防区，援军未至」会因为末尾一句"未至"被整段放过（实测踩过）。 */
function freeFieldGate(field, val, sd) {
  if (FREE_FIELD_WHITELIST.indexOf(field) === -1) return { ok: true };
  if (!val || typeof val !== 'string' || val === '—' || val === '无') return { ok: true };
  const 分句 = String(val).split(/[，。；！？\n]/);
  const 命中 = [];
  for (const e of FREE_WORLD_EVENTS) {
    for (const c of 分句) {
      if (!e.宣言.test(c)) continue;
      if (FREE_NEGATED_OR_PLAN.test(c)) continue;      /* 该分句是传闻/计划/否定 ⇒ 不算已发生 */
      命中.push(e);
      break;
    }
  }
  if (!命中.length) return { ok: true };
  const dnum = Number(sd && sd.仙盟历);
  for (const e of 命中) {
    if (!isFinite(dnum) || dnum < e.起点) {
      return {
        ok: false, 事件: e.名,
        因由: !isFinite(dnum) ? '当前没有可信时点，无法证明「' + e.名 + '」已到' : ('当前 ' + dnum + ' 未到「' + e.名 + '」起点 ' + e.起点),
      };
    }
  }
  return { ok: true };
}


const EVENT_ANCHOR_START = Object.freeze({ 南域大劫: 1578.08, 天溪城兽潮: 1579.01, 兽潮血战: 1579.01, 天溪城破: 1579.03 });
function autoEventGate(field, state) {
  if (!Object.prototype.hasOwnProperty.call(EVENT_ANCHOR_START, field)) return { ok: true };
  const date = Number(state && state.仙盟历);
  const year = Math.floor(date), month = Math.round((date - year) * 100);
  const valid = Number.isFinite(date) && year > 0 && month >= 1 && month <= 12;
  if (!valid || date < EVENT_ANCHOR_START[field] - 1e-8) return {
    ok: false, 事件: field,
    因由: valid ? '当前 ' + date + ' 未到「' + field + '」起点 ' + EVENT_ANCHOR_START[field] : '当前没有可信年月，不能新增「' + field + '」',
  };
  return { ok: true };
}

function eligibleKnown(known, state) {
 const result = Object.assign({}, known || {});
 const controls = state && state.人工纠错 && state.人工纠错.覆盖 || {};
 for (const field of Object.keys(EVENT_ANCHOR_START)) {
   const control = controls[JSON.stringify(['known', field])];
   if (!autoEventGate(field, state).ok && (!control || control.value !== true)) result[field] = false;
 }
 return result;
}
return Object.freeze({freeFieldGate, freeFieldSuspect, autoEventGate, eligibleKnown,
 FREE_FIELD_WHITELIST, FREE_WORLD_EVENTS, FREE_NEGATED_OR_PLAN, FREE_VAGUE_WAR,
 FREE_SUSPECT_EXEMPT, FREE_SUSPECT_FLOOR, EVENT_ANCHOR_START});
}
const XSD_PLOT_POLICY = createXsdPlotPolicy();
const { FREE_FIELD_WHITELIST, FREE_WORLD_EVENTS, FREE_NEGATED_OR_PLAN, FREE_VAGUE_WAR,
  FREE_SUSPECT_EXEMPT, FREE_SUSPECT_FLOOR, EVENT_ANCHOR_START } = XSD_PLOT_POLICY;
function freeFieldGate(field, val, sd) { return XSD_PLOT_POLICY.freeFieldGate(field, val, sd); }
function freeFieldSuspect(field, val, sd) { return XSD_PLOT_POLICY.freeFieldSuspect(field, val, sd); }
function autoEventGate(field, sd) { return XSD_PLOT_POLICY.autoEventGate(field, sd); }

function eligibleKnown(known, sd) { return XSD_PLOT_POLICY.eligibleKnown(known, sd); }
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
/* 2026-10-08（gpt 03 号：anchor 3 红必须修，旧版原样红不是理由）：补入裸地名「天溪城」
 *   ——「受征召南下」的 kws 里带「天溪城」，于是一句「此去天溪城恶战难免」就误报它。 */
const ANCHOR_LOCATION_ONLY = ['幽寂谷', '葬魔渊', '赤羽堕凡尘', '天溪城'];
/** 事件动词（任一命中即可放行） */
/* ⚠️ 2026-10-08（gpt 03 号）：本表**已退役**——它当年作为「地点名 + 事件动词 ⇒ 提议」的旁路，
 *   正是 3 红的来源。保留声明只为追溯，判定里已不再引用。 */
const ANCHOR_SECOND_SIGNALS = ['胁迫', '屈从', '得手', '失守', '被擒', '沦', '坠', '碎', '碎丹', '封元', '镇灵', '奴'];

/* XSD_HOST_PORTS_CORE_BEGIN */
/** 宿主接口探测核：宿主对象及词法标识符 getter 由适配层显式提供。 */
function createXsdHostPorts(deps) {
  const { window, globalThis, getters, console, TAG } = deps;
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
  getVariables: grab('getVariables', getters.getVariables, true),
  replaceVariables: grab('replaceVariables', getters.replaceVariables, true),
  insertOrAssignVariables: grab('insertOrAssignVariables', getters.insertOrAssignVariables, true),
  updateVariablesWith: grab('updateVariablesWith', getters.updateVariablesWith),
  deleteVariable: grab('deleteVariable', getters.deleteVariable),          // 登记备用，本版未调用
  // ── 聊天消息（读正文、切开场白）──
  getChatMessages: grab('getChatMessages', getters.getChatMessages, true),
  setChatMessages: grab('setChatMessages', getters.setChatMessages, true),
  // ── 角色卡与世界书（刷新开场白、拨身份条目开关）──
  getCharacter: grab('getCharacter', getters.getCharacter),
  getCharWorldbookNames: grab('getCharWorldbookNames', getters.getCharWorldbookNames),
  getWorldbookNames: grab('getWorldbookNames', getters.getWorldbookNames),
  getWorldbook: grab('getWorldbook', getters.getWorldbook),
  replaceWorldbook: grab('replaceWorldbook', getters.replaceWorldbook),
  
  loadWorldInfo: grab('loadWorldInfo', getters.loadWorldInfo),
  saveWorldInfo: grab('saveWorldInfo', getters.saveWorldInfo),
  updateWorldInfoList: grab('updateWorldInfoList', getters.updateWorldInfoList),
  getContext: grab('getContext', getters.getContext),
  // ── 事件 ──
  eventOn: grab('eventOn', getters.eventOn, true),
  eventRemoveListener: grab('eventRemoveListener', getters.eventRemoveListener),
  stopGeneration: grab('stopGeneration', getters.stopGeneration),
  // ── 只登记不用的（写进 __xsdWho 的「可用 API 清单」，方便排障）──
  injectPrompts: grab('injectPrompts', getters.injectPrompts),
  getLastMessageId: grab('getLastMessageId', getters.getLastMessageId),
};
/** 事件名表（不是函数，单独探） */
const EVENTS = (() => {
  try {
    const tavern_events = getters.tavern_events();
    return (typeof tavern_events !== 'undefined' && tavern_events) ? tavern_events : null;
  }
  catch (e) { console.warn(TAG, '⚠️ 取不到 tavern_events —— 事件钩子全部跳过'); return null; }
})();

/** 获取当前活跃聊天会话 ID（用于隔离多聊天状态，防止跨聊天污染） */
function currentChatId() {
  try { if (window.__xsdCorrection) return window.__xsdCorrection.capture(API).chatId; } catch (_) {}
  try {
    const SillyTavern = getters.SillyTavern();
    const ctx = (typeof SillyTavern !== 'undefined' && SillyTavern.getContext)
      ? SillyTavern.getContext()
      : ((typeof API !== 'undefined' && API.getContext) ? API.getContext() : null);
    if (ctx && ctx.chatId) return String(ctx.chatId);
    if (ctx && ctx.chat_id) return String(ctx.chat_id);
    if (typeof window !== 'undefined' && window.chat_id) return String(window.chat_id);
  } catch (e) { /* 忽略 */ }
  return 'default';
}


/** toastr（多层回退：先主窗口，再 iframe 自己的） */
function toast(kind, message, timeOut) {
  try {
    let t = null;
    try { t = (window.parent && window.parent.toastr) || null; } catch (e) { t = null; }
    if (!t) { try { const toastr = getters.toastr(); t = (typeof toastr !== 'undefined') ? toastr : null; } catch (e) { t = null; } }
    if (!t) return false;
    const fn = (typeof t[kind] === 'function') ? t[kind] : (typeof t.info === 'function' ? t.info : null);
    if (!fn) return false;
    fn.call(t, message, '仙姝堕', { timeOut: timeOut || 6000 });
    return true;
  } catch (e) { return false; }
}

  return { API, EVENTS, msgOf, grab, getGlobalOrParent, currentChatId, toast };
}
/* XSD_HOST_PORTS_CORE_END */
/* ═══════════════════════════════════════════════════════════
 * 二 · 酒馆助手接口探测（全部 typeof 保护，取不到就降级）
 * ═══════════════════════════════════════════════════════════ */

const XSD_HOST_PORTS = createXsdHostPorts({
  window: typeof window !== 'undefined' ? window : undefined,
  globalThis: typeof globalThis !== 'undefined' ? globalThis : undefined,
  console, TAG,
  getters: {
    getVariables: () => (typeof getVariables === 'function' ? getVariables : null),
    replaceVariables: () => (typeof replaceVariables === 'function' ? replaceVariables : null),
    insertOrAssignVariables: () => (typeof insertOrAssignVariables === 'function' ? insertOrAssignVariables : null),
    updateVariablesWith: () => (typeof updateVariablesWith === 'function' ? updateVariablesWith : null),
    deleteVariable: () => (typeof deleteVariable === 'function' ? deleteVariable : null),
    getChatMessages: () => (typeof getChatMessages === 'function' ? getChatMessages : null),
    setChatMessages: () => (typeof setChatMessages === 'function' ? setChatMessages : null),
    getCharacter: () => (typeof getCharacter === 'function' ? getCharacter : null),
    getCharWorldbookNames: () => (typeof getCharWorldbookNames === 'function' ? getCharWorldbookNames : null),
    getWorldbookNames: () => (typeof getWorldbookNames === 'function' ? getWorldbookNames : null),
    getWorldbook: () => (typeof getWorldbook === 'function' ? getWorldbook : null),
    replaceWorldbook: () => (typeof replaceWorldbook === 'function' ? replaceWorldbook : null),
    loadWorldInfo: () => (typeof loadWorldInfo === 'function' ? loadWorldInfo : null),
    saveWorldInfo: () => (typeof saveWorldInfo === 'function' ? saveWorldInfo : null),
    updateWorldInfoList: () => (typeof updateWorldInfoList === 'function' ? updateWorldInfoList : null),
    getContext: () => (typeof getContext === 'function' ? getContext : null),
    eventOn: () => (typeof eventOn === 'function' ? eventOn : null),
    eventRemoveListener: () => (typeof eventRemoveListener === 'function' ? eventRemoveListener : null),
    stopGeneration: () => (typeof stopGeneration === 'function' ? stopGeneration : null),
    injectPrompts: () => (typeof injectPrompts === 'function' ? injectPrompts : null),
    getLastMessageId: () => (typeof getLastMessageId === 'function' ? getLastMessageId : null),
    tavern_events: () => (typeof tavern_events !== 'undefined' ? tavern_events : undefined),
    SillyTavern: () => (typeof SillyTavern !== 'undefined' ? SillyTavern : undefined),
    toastr: () => (typeof toastr !== 'undefined' ? toastr : undefined),
  },
});
const API = XSD_HOST_PORTS.API;
const EVENTS = XSD_HOST_PORTS.EVENTS;
function msgOf(e) { return XSD_HOST_PORTS.msgOf(e); }
function getGlobalOrParent(name) { return XSD_HOST_PORTS.getGlobalOrParent(name); }
function grab(name, getter, required) { return XSD_HOST_PORTS.grab(name, getter, required); }
function currentChatId() { return XSD_HOST_PORTS.currentChatId(); }
function toast(kind, message, timeOut) { return XSD_HOST_PORTS.toast(kind, message, timeOut); }
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

/** 身份：gpt。双层账本只读合并与有限恢复；人工覆盖由外部服务最后应用。 */
function createXsdLedgerReader({ getPrerequisites }) {
function mergeStatLayers(chatV, msgV, context = {}) {
  const cs = (chatV && chatV.stat_data && typeof chatV.stat_data === 'object') ? chatV.stat_data : null;
  const ms = (msgV && msgV.stat_data && typeof msgV.stat_data === 'object') ? msgV.stat_data : null;
  if (!cs && !ms) return null;
  const stat = Object.assign({}, cs || {}, ms || {});
  const ck = (cs && cs.known && typeof cs.known === 'object') ? cs.known : null;
  const mk = (ms && ms.known && typeof ms.known === 'object') ? ms.known : null;
  if (ck || mk) stat.known = Object.assign({}, ck || {}, mk || {});
  // ── 账本与事务来源自愈保底（防止因单层空读或初始化时差误置 false）──
  stat.known = stat.known || {};
  const controls = cs && cs.人工纠错 && String(cs.人工纠错.chatId) === String(context.chatId)
    ? cs.人工纠错.覆盖 || {} : {};
  const setKnown = (field, value) => {
    const control = controls[JSON.stringify(['known', field])];
    stat.known[field] = control && typeof control.value === 'boolean' ? control.value : value;
  };
  for (const record of Object.values(controls)) {
    if (record && Array.isArray(record.path) && record.path[0] === 'known' && typeof record.value === 'boolean') setKnown(record.path[1], record.value);
  }
  if (stat.锚点账本 && typeof stat.锚点账本 === 'object') {
    for (const k of Object.keys(stat.锚点账本)) {
      const entry = stat.锚点账本[k];
      if (entry && Array.isArray(entry.新置真)) {
        for (const f of entry.新置真) setKnown(f, true);
      }
    }
  }
  const book = stat.破处者 && typeof stat.破处者 === 'object' ? stat.破处者 : {};
  for (const holder of Object.keys(book)) if (book[holder]) setKnown(holder + '处女丧失', true);
  const prerequisites = getPrerequisites();
  const recovered = [];
  for (const [form, required] of Object.entries(prerequisites)) {
    if (!required.every(field => stat.known[field] === true)) continue;
    setKnown(form, true);
    if (stat.known[form] !== true) continue;
    const relic = form.replace(/成形$/, '');
    setKnown((relic === '灵犀同心' ? '灵犀同心穴' : relic) + '一阶段', true);
    recovered.push(relic);
  }
  const identity = String(stat.身份 || '');
  const owners = stat.名器归属 && typeof stat.名器归属 === 'object' ? stat.名器归属 : {};
  if (recovered.some(relic => owners[relic] && owners[relic] === identity)) setKnown('获得任意名器', true);
  return stat;

}
return Object.freeze({ mergeStatLayers });
}
const XSD_LEDGER_READER = createXsdLedgerReader({ getPrerequisites: () => MINGQI_PREREQ });
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
  const stat = XSD_LEDGER_READER.mergeStatLayers(chatV, msgV, { chatId: currentChatId() });
  if (!stat) return null;
  const cs = chatV && chatV.stat_data;
  const service = window.__xsdCorrection;
  if (service) {
    stat.人工纠错 = cs && cs.人工纠错 && cs.人工纠错.chatId === currentChatId() ? cs.人工纠错 : null;
    return service.effective(stat);
  }
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
async function writeStat(patch, why, manual = false, transactionGuard) {
  const service = window.__xsdCorrection;
  if (!service) return { ok: false, why: '缺少二级纠错运行时，请重新构建卡片' };
  let writeAPI = API;
  if (typeof transactionGuard === 'function') {
    writeAPI = { ...API, context() {
      transactionGuard();
      if (typeof API.context === 'function') return API.context();
      for (const get of [() => window, () => window.parent, () => window.top]) {
        try {
          const root = get();
          if (root && root.SillyTavern && typeof root.SillyTavern.getContext === 'function') return root.SillyTavern.getContext();
        } catch (_) {}
      }
      throw Error('无法定位当前聊天');
    }};
    for (const name of ['getVariables', 'insertOrAssignVariables', 'replaceVariables', 'updateVariablesWith']) {
      if (typeof API[name] === 'function') writeAPI[name] = (...args) => { transactionGuard(); return API[name](...args); };
    }
    transactionGuard();
  }
  const result = await service.write(writeAPI, patch, manual);
  if (!result.ok) console.warn(TAG, '[统一写入] ' + why + '：' + result.why);
  return result;
}

/* 保留旧写入实现用于审查；生产入口已改统一队列，不调用此函数。 */
async function writeStatLegacy(patch, why) {
  
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
  return writeStat({ known: { [field]: !!value } }, `${field} = ${!!value}`, true);
}

/** 写身份（连阵营一起写），写完顺带把世界书那 6 条【身份】条目拨到选中那条 */
async function writeIdentity(name, guard) {
  
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

/** 物品名归一：去空白与括号注释、去掉开头的「数词＋量词」⇒ 词干（用来判「是不是同一件东西」） */
/* XSD_INVENTORY_RULES_CORE_BEGIN */
/** 机械迁移应用核：业务与宿主依赖由适配层显式提供。 */
function createXsdInventoryRules(deps) {
  const { readStatData, messageText, writeStat, console, TAG, hasRelicPhysiologicalResponse } = deps;
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

const ANCHOR_EVIDENCE = {
  天溪城破: /(城破|城陷|城池陷|城墙.{0,6}(?:塌|倒)|西南城破)/,   /* 2026-10-08（gpt 04 号③）：删去裸的「陷落」，它太泛（别处城池陷落也命中） */
  封元镇灵环: /(暴露|当众|看见|扯开|撕开|剥开|夺走|摘下|坦露|映入眼帘)/,
  双姝回归: /(回归|潜回|现身|回来了|回到)/,
  血染天溪: /(失控|越界|温存|血染|缠绵)/,
  /* 2026-10-08（gpt 04 号③）：原式 /(兽潮|血战|围城|攻城)/ 只要出现「兽潮」二字即放行——
     而「兽潮围城」是全书开篇就摆在那儿的既有局势，前六章满篇都是「兽潮」⇒ 等于没闸。
     现在要求**兽潮与围/攻/压/临城同句共现**，或「血战」明确落在城头/城下。 */
  兽潮血战: /((?:兽潮|妖潮)[^。；]{0,8}(?:围城|攻城|压城|临城|破城|血战)|血战[^。；]{0,8}(?:兽潮|妖潮|城头|城下|城前)|(?:围城|攻城)[^。；]{0,8}(?:兽潮|妖潮))/,
  天溪城兽潮: /((?:兽潮|妖潮)[^。；]{0,8}(?:围城|攻城|压城|临城|破城|血战)|血战[^。；]{0,8}(?:兽潮|妖潮|城头|城下|城前)|(?:围城|攻城)[^。；]{0,8}(?:兽潮|妖潮))/,
  进入幽寂谷: /幽寂谷/,
  进入葬魔渊: /(坠渊|坠入[^。；]{0,6}渊|跌入[^。；]{0,6}渊|坠落[^。；]{0,8}(?:渊|深渊)|踏入[^。；]{0,6}葬魔渊|进入[^。；]{0,6}葬魔渊)/,
  南域大劫: /(神诅|大劫|封印|再无元婴|天穹)/,
  已抵达天溪: /((?:抵达|到达|来到|抵临|进了?城|入城|踏上|上了)[^。；]{0,8}天溪|天溪[^。；]{0,8}(?:已?抵达|城墙下|城门|城中|城内|城头))/,
  极乐引入手: /(极乐引|残卷|残篇)/,
  灵犀同心成形: /(灵犀同心|同心异体|日月同辉)/,
  灼酒流炎穴成形: /(灼酒流炎穴|名器.{0,6}(?:觉醒|成形)|初醒)/,
  灼酒流炎穴二阶段: /(二阶段|二境|觉醒|唤醒|自发迎合|生理自发|迎合|动起来|咬得?好?紧|咬紧|内壁痉挛|抽搐|吮吸|紧紧缠裹|主动缠裹|名器本能|自发蠕动|火热翻涌|情动)/,
  
  楚灵夜后窍开发: /(后窍|谷道|后门|后庭|菊径|肛|撑开|开发)/,
};
/** 2026-10-08（gpt 04 号③）：否定／未发生语境的**窄闸** —— 只在同一个句子里判，不跨句。
 *  为什么需要：玩家写「本次开局不继承旧档，我还没遇到兽潮血战，也没有经历天溪城破」，
 *  旧闸门只看到词就放行。gpt 明确警告过「不要承诺靠追加否定词正则就完全解决」——
 *  所以这里只当**一道窄闸**，不宣称覆盖传闻／假设／反事实语境。 */
const NEG_RE = /(没|没有|未|未曾|不曾|尚未|别|勿|无需|并未|从未|不是|非|并不|谈不上|还没|不打算|不愿)/;
function negatedAround(text, re) {
  const t = String(text || '');
  const m = re.exec(t);
  if (!m) return false;
  const cut = (i) => i >= 0 && i < m.index;
  const cands = [t.lastIndexOf('。', m.index), t.lastIndexOf('；', m.index), t.lastIndexOf('！', m.index), t.lastIndexOf('？', m.index), t.lastIndexOf('\n', m.index)].filter(cut);
  const start = cands.length ? Math.max(...cands) + 1 : 0;
  const ends = [t.indexOf('。', m.index + m[0].length), t.indexOf('；', m.index + m[0].length), t.indexOf('！', m.index + m[0].length), t.indexOf('？', m.index + m[0].length), t.indexOf('\n', m.index + m[0].length)].filter((i) => i >= 0);
  const end = ends.length ? Math.min(...ends) : t.length;
  return NEG_RE.test(t.slice(start, end));
}
/** 本楼正文里有没有这个锚点的实证（不在表里的锚点一律放行）
 *  2026-10-08（gpt 04 号③）：空正文由「放行」改为 **fail-closed**（读不到正文就不予认定）。 */
function anchorEvidenceIn(prose, field) {
  if (field === '灼酒流炎穴二阶段') return { ok: typeof hasRelicPhysiologicalResponse === 'function' && hasRelicPhysiologicalResponse('zhuojiu', prose), why: '正文须有明确落在叶红缨上的已发生生理响应' };
  const re = ANCHOR_EVIDENCE[field];
  if (!re) return { ok: true, why: '（该锚点无实证要求）' };
  if (!prose) return { ok: false, why: '（本楼读不到正文 ⇒ 不予认定；确实发生了就发「/解锁 …」手工补）' };
  const nonFact = /据说|听说|传闻|谣传|若是|倘若|假如|万一|是否|尚未|还没|没有|未曾|不曾|并未|从未|将要|即将|计划|打算|可能/;
  const clauses = String(prose).split(/[，。；！？\n]/);
  if (!clauses.some(clause => new RegExp(re.source, re.flags.replace(/[gy]/g, '')).test(clause) && !nonFact.test(clause))) {
    return { ok: false, why: '正文没有独立肯定的「' + field + '」实证（提及/否定/传闻/计划不计）' };
  }

  return { ok: true, why: '' };
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
    delete log[k];   
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


  return { normItemName, itemIdOf, normalizeInventory, ANCHOR_EVIDENCE, NEG_RE, negatedAround, anchorEvidenceIn, stripStatusBlock, itemEvidenceIn, findItemIndex, applyItemChange, reconcileNadeLedger, defaultInventoryRaw, defaultInventoryFor };
}
/* XSD_INVENTORY_RULES_CORE_END */
/** 原共享作用域名称的兼容适配；函数依赖延迟解析，避免后置模块初始化时序变化。 */
const XSD_INVENTORY_DEPS = {
  hasRelicPhysiologicalResponse: (...args) => hasRelicPhysiologicalResponse(...args),
  readStatData: (...args) => readStatData(...args),
  messageText: (...args) => messageText(...args),
  writeStat: (...args) => writeStat(...args),
  console,
  TAG,
};
const XSD_INVENTORY_RULES = createXsdInventoryRules(XSD_INVENTORY_DEPS);
function normItemName(s) { return XSD_INVENTORY_RULES.normItemName(s); }
function itemIdOf(name) { return XSD_INVENTORY_RULES.itemIdOf(name); }
function normalizeInventory(inv) { return XSD_INVENTORY_RULES.normalizeInventory(inv); }
const ANCHOR_EVIDENCE = XSD_INVENTORY_RULES.ANCHOR_EVIDENCE;
const NEG_RE = XSD_INVENTORY_RULES.NEG_RE;
function negatedAround(text, re) { return XSD_INVENTORY_RULES.negatedAround(text, re); }
function anchorEvidenceIn(prose, field) { return XSD_INVENTORY_RULES.anchorEvidenceIn(prose, field); }
function stripStatusBlock(text) { return XSD_INVENTORY_RULES.stripStatusBlock(text); }
function itemEvidenceIn(prose, name) { return XSD_INVENTORY_RULES.itemEvidenceIn(prose, name); }
function findItemIndex(inv, key) { return XSD_INVENTORY_RULES.findItemIndex(inv, key); }
function applyItemChange(inv, chg) { return XSD_INVENTORY_RULES.applyItemChange(inv, chg); }
async function reconcileNadeLedger(where) { return XSD_INVENTORY_RULES.reconcileNadeLedger(where); }
function defaultInventoryRaw(identity) { return XSD_INVENTORY_RULES.defaultInventoryRaw(identity); }
function defaultInventoryFor(identity) { return XSD_INVENTORY_RULES.defaultInventoryFor(identity); }
/* XSD_INITIALIZER_CORE_BEGIN */
/** 机械迁移应用核：业务与宿主依赖由适配层显式提供。 */
function createXsdInitializer(deps) {
  const { canReadState = () => true, readStatData, ALL_FIELDS, IDENTITY_DEFAULT, FACTION_DEFAULT, defaultInventoryFor, normalizeInventory, console, TAG, openFieldsFor, writeStat } = deps;
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
  if (!canReadState()) throw Error('变量层不可读，停止初始化，避免把读取失败当空档覆盖');
  const s = readStatData();
  const known = (s && s.known && typeof s.known === 'object') ? s.known : {};
  const patch = {};
  const missingKnown = ALL_FIELDS.filter((f) => typeof known[f] !== 'boolean');
  if (missingKnown.length) {
    patch.known = {};
    for (const f of missingKnown) {
      if (known[f] === true) continue;
      patch.known[f] = false;
    }
  }
  if (!s || typeof s.relic_progress !== 'object' || s.relic_progress === null) {
    patch.relic_progress = {};
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
    console.log(TAG, `${r.pending ? '📝 [规划]' : '✅'} [初始化·${where}] ${r.pending ? '待提交' : '已落地'}（${r.via}）—— 账本 now = ${ALL_FIELDS.length} 个 known 全 false，`
      + '「进度」校验从此有真账本可对。');
  }
  return true;
}


  return { ensureInit };
}
/* XSD_INITIALIZER_CORE_END */
/** 原共享作用域名称的兼容适配；函数依赖延迟解析，避免后置模块初始化时序变化。 */
const XSD_INITIALIZER_DEPS = {
  canReadState: () => Boolean(readLayer(L_CHAT) && readLayer(L_MSG)),
  readStatData: (...args) => readStatData(...args),
  ALL_FIELDS,
  IDENTITY_DEFAULT,
  FACTION_DEFAULT,
  defaultInventoryFor: (...args) => defaultInventoryFor(...args),
  normalizeInventory: (...args) => normalizeInventory(...args),
  console,
  TAG,
  openFieldsFor: (...args) => openFieldsFor(...args),
  writeStat: (...args) => writeStat(...args),
};
const XSD_INITIALIZER = createXsdInitializer(XSD_INITIALIZER_DEPS);
async function ensureInit(where) { return XSD_INITIALIZER.ensureInit(where); }
/** 身份：gpt。保守的主体事实核验；不以名词提及或全段距离替代事实归属。 */
function createXsdSubjectEvidence({ holders, hardPatterns }) {
  const names = Array.from(new Set((holders || []).map(String))).sort((a, b) => b.length - a.length);
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const nonFact = /据说|听说|传闻|谣传|若是|倘若|假如|万一|是否|尚未|还没|没有|未曾|不曾|并未|从未|不会|不愿|不打算|打算|计划|将要|即将|可能|希望|想要|谈起|讨论|提及/;
  function deflower(prose, holder) {
    const target = String(holder || '').trim();
    if (!target || !names.includes(target)) return { ok: false, label: '', why: '未知或缺失主体' };
    const clauses = String(prose || '').split(/[，。；！？\n]/);
    for (const clause of clauses) {
      if (nonFact.test(clause)) continue;
      for (const [pattern, label] of hardPatterns) {
        const re = new RegExp(pattern.source, 'g');
        let match;
        while ((match = re.exec(clause))) {
          if (match.index === re.lastIndex) re.lastIndex++;
          if (label === '处子' && !/(?:不再是处子|处子(?:之|的)?身.{0,8}(?:被破|已破|失去)|(?:夺走|破去|失去).{0,8}处子)/.test(clause)) continue;
          if (label === '初夜' && !/(?:(?:夺走|夺去|失去|交付|交出|献出|给了|经历|度过|共度).{0,12}初夜|初夜.{0,12}(?:被夺|已过|已经过去|结束|交付|献出))/.test(clause)) continue;
          const before = clause.slice(0, match.index);
          const mentioned = names.flatMap(name => {
            const found = []; let at = before.indexOf(name);
            while (at !== -1) { found.push({ name, at, end: at + name.length }); at = before.indexOf(name, at + name.length); }
            return found;
          }).sort((a, b) => a.at - b.at);
          const passiveAt = before.lastIndexOf('被');
          const patient = passiveAt >= 0 ? mentioned.filter(m => m.end <= passiveAt).pop() : null;
          const last = patient || mentioned[mentioned.length - 1];
          if (last && match.index - last.end <= 80) {
            const group = [last.name];
            if (patient) { if (patient.name === target) return { ok: true, label, why: '' }; continue; }
            for (let i = mentioned.length - 2; i >= 0; i--) {
              const left = mentioned[i], right = mentioned[i + 1];
              if (!/^[\s和与及、跟]+$/.test(before.slice(left.end, right.at))) break;
              group.push(left.name);
            }
            if (group.includes(target)) return { ok: true, label, why: '' };
          }
          // 明确倒装只接受“破身的是某人”，不把动作后的旁观人名算成主体。
          if (new RegExp('^(?:的是|者是)\\s*' + esc(target)).test(clause.slice(match.index + match[0].length))) return { ok: true, label, why: '' };
        }
      }
    }
    return { ok: false, label: '', why: '正文缺少明确落在该主体上的已发生事实（提及、计划、否定或旁观不计）' };
  }
  return Object.freeze({ deflower });
}
const XSD_SUBJECT_EVIDENCE = createXsdSubjectEvidence({
  holders: Object.keys(HOLDER_TO_RELIC), hardPatterns: DEFLOWER_HARD_RES,
});
function deflowerEvidenceIn(prose, holder) { return XSD_SUBJECT_EVIDENCE.deflower(prose, holder); }
/* 身份：gpt 下级实现。状态解析纯核；算法只在此处保存一份。
 * 依赖通过 createXsdStatusParser 显式注入；不读取酒馆、DOM、TAG 或 console。
 * emit(level, message) 是可选诊断出口，默认空操作。
 * 原解析顺序保持 XML 优先、YAML 补齐、名器互动截断回退；字段/返回结构不变。
 */
function createXsdStatusParser({
  CAST_FIELD, FIELD_MAP, HOLDER_TO_RELIC, ALL_FIELDS, DEFLOWER_SYN,
  DEFLOWER_HARD_RES, isRelicActionLabel, parseRelicAction,
  emit = () => {},
  deflowerEvidence = createXsdSubjectEvidence({ holders: Object.keys(HOLDER_TO_RELIC), hardPatterns: DEFLOWER_HARD_RES }).deflower,
}) {
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
  历时: ['历时', '经过时长', '所历'],   /* 2026-10-08（gpt 04 号④）：删「倒计时」——『距启程 3 日』是计划/倒计时，不是已过历时 */
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

function nearDeflowerWord(prose, holder) {
  const result = deflowerEvidence(prose, holder);
  return result && result.ok ? result.label : '';
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
  const out = { found: false, raw: '', fields: {}, 进度: null, 里程碑: null, 破处: null, 纳戒: null, 名器互动: null, 未识别: [], YAML行数: 0, XML标签数: 0, 在场角色: [] };
  const t = String(text ?? '');
  const m = t.match(STATUS_PAIR_RE);
  let inner = null;
  if (m) {
    inner = m[1];
  } else if (STATUS_OPEN_RE.test(t)) {
    // 只开了没闭（多半被截断）—— 取开标签之后的全部内容，尽力解析
    const at = t.search(STATUS_OPEN_RE);
    inner = t.slice(at).replace(/^<[^>]*>/, '');
    emit('warn', '[状态条] 只有开标签没有闭标签（多半是回复被截断），按「尽力解析」处理');
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
    emit('log', `[状态条] 在场角色子块：解析出 ${cast.list.length} 个要角`
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
    if (isRelicActionLabel(label)) {
      if (out.名器互动 === null) out.名器互动 = [];
      const act = parseRelicAction(value);
      if (act) out.名器互动.push(act);
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
    if (isRelicActionLabel(label)) {
      if (out.名器互动 === null) out.名器互动 = [];
      const act = parseRelicAction(value);
      if (act) out.名器互动.push(act);
      out.YAML行数++;
      continue;
    }
    const key = matchField(label);
    if (key) { if (out.fields[key] === undefined) out.fields[key] = value; out.YAML行数++; }   // XML 已写过就不覆盖
    else out.未识别.push(label);
  }

  // ③ 漏闭合或截断回退：行内单标签防护（防越界吞噬下一 XML 字段）
  if (out.名器互动 === null) {
    const unclosedM = inner.match(/<名器互动>([^<>\r\n]+)(?:<\/名器互动>|(?=<)|$)/i);
    if (unclosedM) {
      const act = parseRelicAction(unclosedM[1]);
      if (act) out.名器互动 = [act];
    }
  }

  return out;
}

  return {
    toSimp, normalizeLabel, matchField, isProgressLabel, isMilestoneLabel, parseMilestones, parseProgress, normalizeAnchorName, isDeflowerLabel, isNadeLabel, parseNade, parseDeflowerBook, nearDeflowerWord, hasStatusBlock, parseCastBlocks, parseStatusBlock,
    TRAD_CHARS, SIMP_CHARS, FIELD_ALIAS, ALIAS_LOOKUP, STATUS_TAG, STATUS_OPEN_RE, STATUS_PAIR_RE, STATUS_STRIP_RE, XML_PAIR_RE, CAST_BLOCK_RE, CAST_FIELD_RE, CAST_KEYS, CAST_FIELD_ALIAS, CAST_MAX, CAST_EMPTY_RE,
  };
}
/* ═══════════════════════════════════════════════════════════
 * 六 · 状态条解析 → 变量
 * ═══════════════════════════════════════════════════════════ */

/* 身份：gpt 下级实现。卡内适配层：只绑定依赖与诊断，不复制解析算法。
 * 名器互动依赖位于后续模块，箭头回调在解析时调用，初始化不读取后定义状态。
 */
const XSD_STATUS_PARSER = createXsdStatusParser({
  CAST_FIELD, FIELD_MAP, HOLDER_TO_RELIC, ALL_FIELDS, DEFLOWER_SYN,
  DEFLOWER_HARD_RES,
  isRelicActionLabel: (label) => isRelicActionLabel(label),
  parseRelicAction: (value) => parseRelicAction(value),
  deflowerEvidence: (prose, holder) => deflowerEvidenceIn(prose, holder),
  emit: (level, message) => console[level](TAG, message),
});
const {
  TRAD_CHARS, SIMP_CHARS, FIELD_ALIAS, ALIAS_LOOKUP, STATUS_TAG, STATUS_OPEN_RE, STATUS_PAIR_RE, STATUS_STRIP_RE, XML_PAIR_RE, CAST_BLOCK_RE, CAST_FIELD_RE, CAST_KEYS, CAST_FIELD_ALIAS, CAST_MAX, CAST_EMPTY_RE,
} = XSD_STATUS_PARSER;
function toSimp(s) { return XSD_STATUS_PARSER.toSimp(s); }
function normalizeLabel(raw) { return XSD_STATUS_PARSER.normalizeLabel(raw); }
function matchField(label) { return XSD_STATUS_PARSER.matchField(label); }
function isProgressLabel(label) { return XSD_STATUS_PARSER.isProgressLabel(label); }
function isMilestoneLabel(label) { return XSD_STATUS_PARSER.isMilestoneLabel(label); }
function parseMilestones(value) { return XSD_STATUS_PARSER.parseMilestones(value); }
function parseProgress(value) { return XSD_STATUS_PARSER.parseProgress(value); }
function normalizeAnchorName(f) { return XSD_STATUS_PARSER.normalizeAnchorName(f); }
function isDeflowerLabel(label) { return XSD_STATUS_PARSER.isDeflowerLabel(label); }
function isNadeLabel(label) { return XSD_STATUS_PARSER.isNadeLabel(label); }
function parseNade(value) { return XSD_STATUS_PARSER.parseNade(value); }
function parseDeflowerBook(value) { return XSD_STATUS_PARSER.parseDeflowerBook(value); }
function nearDeflowerWord(text, name) { return XSD_STATUS_PARSER.nearDeflowerWord(text, name); }
function hasStatusBlock(text) { return XSD_STATUS_PARSER.hasStatusBlock(text); }
function parseCastBlocks(inner) { return XSD_STATUS_PARSER.parseCastBlocks(inner); }
function parseStatusBlock(text) { return XSD_STATUS_PARSER.parseStatusBlock(text); }

/** 2026-10-08（gpt 04 号①）：把「<实际发生> 申报 → 已校验锚点」这一段抽成**纯函数**。
 *  记账（applyMilestones）与推进（checkFastForwardStage 用到的 knownAhead）**共用同一份结果**，
 *  不再各自解读原始申报。纯函数、无副作用，可离线抠出单测。 */
/** 2026-10-08（主人当面指定）：**名器成形的前置** —— 持有者必须先被破身，否则不成形。
 *  依据：字段表里每条 `X处女丧失` 的 desc 原文，例：
 *    · 「叶红缨处女丧失 · 灼酒流炎穴的持有者被破身」
 *    · 「楚灵夜后窍开发 …与『楚灵夜处女丧失』同时为真，般若菩提菊才成形」
 *    · 「苏瑶处女丧失 · …与苏玲两个都丧失，灵犀同心才成形」
 *  ⇒ 写入侧（记账）此前没有这条校验，所以模型在 <实际发生> 里写一句「X成形」就能解锁
 *    （2026-10-08 真机事故：与苏瑶的戏里解锁了**慕容清歌**的「清歌弦鸣穴」）。
 *  **例外**：烟霞灵乳（昨日欢）没有「成形」这一步（持有者出场即二境、反色、占据者阎雷子），
 *    其条目由 `known['阎雷子脱困']` 注入 ⇒ 本表不收它。 */
/** 身份：gpt。锚点资格与指纹核，来源状态必须由调用方显式传入。 */
function createXsdAnchorRules(deps) {
 const { ALL_FIELDS, normalizeAnchorName, anchorEvidenceIn, deflowerEvidenceIn, autoEventGate, console, TAG } = deps;
const MINGQI_PREREQ = {
  灼酒流炎穴成形: ['叶红缨处女丧失'],
  九幽玄阴穴成形: ['孤月处女丧失'],
  心魔茶璎乳成形: ['闻观语处女丧失'],
  般若菩提菊成形: ['楚灵夜处女丧失', '楚灵夜后窍开发'],
  灵犀同心成形: ['苏瑶处女丧失', '苏玲处女丧失'],
  北冥潮生穴成形: ['雨霏柔处女丧失'],
  玉虎噙香乳成形: ['云织梦处女丧失'],
  梅蕊穴成形: ['花芷凝处女丧失'],
  冰魄剑心穴成形: ['苏倾寒处女丧失'],
  清歌弦鸣穴成形: ['慕容清歌处女丧失'],
  流焰叠薪穴成形: ['顾云舒处女丧失'],
  凤凰羽花成形: ['陆烬颜处女丧失'],
};


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

function validateAnchors(listRaw, prose, messageId, knownNow, deflowerNow, sourceState) {
  const list = Array.isArray(listRaw) ? listRaw : [];
  const knownPre = (knownNow && typeof knownNow === 'object') ? knownNow : {};
  /* 2026-10-08（主人确认「肯定算」）：**破身与成形常在同一场戏**（第十五—十六章：破处 → 灼酒流炎穴成形）。
     所以前置不只认已记账的 `X处女丧失`，还认**本轮**的两条证据：
       · 本轮 <破处> 簿里出现该持有者（结构化）；
       · 本轮正文里出现该持有者名 **且** 命中 DEFLOWER_HARD_RES 硬词（沿用既有「防真破身被漏标误杀」兜底）。 */
  const holdersNow = Array.isArray(deflowerNow)
    ? deflowerNow.map((x) => String((x && x.持有者) || x || '').trim()).filter(Boolean)
    : [];
  const 前置满足 = (k) => {
    if (knownPre[k] === true) return true;
    if (!k.endsWith('处女丧失')) return false;
    const holder = k.slice(0, -'处女丧失'.length);
    if (!holder) return false;
    if (deflowerEvidenceIn(prose, holder).ok) return true;
    return false;
  };
  const good = [], bad = [], dropped = [];
  for (const raw of list) {
    const f = normalizeAnchorName(String(raw).trim());
    if (!f) continue;
    if (!ALL_FIELDS.includes(f)) { bad.push(String(raw).trim()); continue; }
    /* 2026-10-08（主人当面指定）：名器成形要先过**前置**（持有者已破身；同轮破身也算）。 */
    const need = MINGQI_PREREQ[f];
    if (need) {
      const missing = need.filter((k) => !前置满足(k));
      if (missing.length) {
        dropped.push(`${f}（前置未满足：${missing.join('、')}）`);
        console.warn(TAG, `⛔ [名器前置] 第 ${messageId} 楼丢弃「${f}」：还差 ${missing.join('、')}（本轮的 <破处> 簿与正文硬词都没给出依据）`
          + `（名器成形的硬前置：持有者必须先破身。确实发生了请先补发「/解锁 ${missing[0]}」）`);
        continue;
      }
    }
    const dateGate = autoEventGate(f, sourceState || {});
    if (!dateGate.ok) {
      dropped.push(f + '（' + dateGate.因由 + '）');
      console.warn(TAG, '[世界事件闸] 第 ' + messageId + ' 楼丢弃「' + f + '」：' + dateGate.因由);
      continue;
    }
    const lm = /^(.+?)处女丧失$/.exec(f);
    if (lm && !deflowerEvidenceIn(prose, lm[1]).ok) {
      dropped.push(f + '（缺少该主体的已发生实证）');
      console.warn(TAG, '[主体实证] 第 ' + messageId + ' 楼丢弃「' + f + '」：未证实该主体的事实');
      continue;
    }
    const ev = anchorEvidenceIn(prose, f);
    if (!ev.ok) {
      dropped.push(`${f}（${ev.why}）`);
      console.warn(TAG, `⛔ [锚点闸门] 第 ${messageId} 楼丢弃「${f}」：${ev.why}` + `（这条是准入／跳段锚点，凭一句空话不能算它发生。确实发生了就发「/解锁 ${f}」手工补）`);
      continue;
    }
    good.push(f);
  }
  return { good, bad, dropped };
}

return Object.freeze({MINGQI_PREREQ, hashText, validateAnchors});
}
const XSD_ANCHOR_RULES = createXsdAnchorRules({ ALL_FIELDS, TAG, console,
 normalizeAnchorName: (...args) => normalizeAnchorName(...args),
 anchorEvidenceIn: (...args) => anchorEvidenceIn(...args),
 deflowerEvidenceIn: (...args) => deflowerEvidenceIn(...args),
 autoEventGate: (...args) => autoEventGate(...args),
});
const { MINGQI_PREREQ } = XSD_ANCHOR_RULES;
if (typeof window !== 'undefined' && window.__xsdCorrection) Object.assign(window.__xsdCorrection.prerequisites, MINGQI_PREREQ);
function hashText(str) { return XSD_ANCHOR_RULES.hashText(str); }
function validateAnchors(listRaw, prose, messageId, knownNow, deflowerNow, sourceState) {
 return XSD_ANCHOR_RULES.validateAnchors(listRaw, prose, messageId, knownNow, deflowerNow, sourceState || readStatData() || {});
}

/** ═════════════════════════════════════════════════════════════════════
 * 名器动作申报、严格事实核验与浸润累进（MVU 状态机数值扩展 · 首期试点）
 * ─────────────────────────────────────────────────────────────────────
 * 遵循 GPT RFC-001 审核与 RFC-002 规范：
 *   1. 封闭动作枚举，模型严禁输出数字或 +1；
 *   2. 严格正文事实核验（持有者在场 + 内射硬词 + 否定句拦截 + 成形硬前置）；
 *   3. 接入统一 writeStat 队列，消息层历史快照与 Swipe 隔离（替换本楼贡献，绝不跨 Swipe 累加）；
 *   4. 首期不自动晋阶（恪守 GEMINI.md 铁律 36：达成 5 次仅标记 ready，真正晋阶须剧情生理自发迎合质变或 GM 解锁）；
 *   5. GM 人工回锁绝对优先。
 * ═════════════════════════════════════════════════════════════════════ */
const RELIC_PILOT_CONFIG = {
  zhuojiu: {
    id: 'zhuojiu',
    names: ['灼酒流炎穴', '灼酒流炎', '灼酒', 'zhuojiu'],
    owner: '叶红缨',
    ownerAliases: ['叶红缨', '红绡', '红缨'],
    formKey: '灼酒流炎穴成形',
    stage1Key: '灼酒流炎穴一阶段',
    stage2Key: '灼酒流炎穴二阶段',
    target: 3,
    validActions: ['内射', '深度交合内射', '精液灌注', '至阳本源浸润', '本源浸润', '破身'],
    evidenceRegex: /(内射|阳精|精液|白浊|尽数灌入|射入|注入|深处射|尽数射|全数灌|至阳本源|本源浸润)/,
    responseRegex: /(自发迎合|生理自发|本能迎合|自发蠕动|名器本能|本能.*唤醒|动起来|咬得?好?紧|咬紧|抽搐|吮吸|紧紧缠裹|主动缠裹|吸附|内壁痉挛|花房痉挛|质变|情动)/,
  }
};

function isRelicActionLabel(label) {
  const n = normalizeLabel(label);
  return n.includes('名器互动') || n.includes('名器动作') || n === '名器' || n === 'relic_action';
}

/** `<名器互动>` 的值 → `{ relicId, relicName, actor, action, raw }`
 *  封闭事实枚举：例如「灼酒流炎穴|赵无忧|内射」或「zhuojiu|player|内射」
 *  严格去除模型自造的 +1、数字或 delta，只取名器、行为者、动作事实。 */
function parseRelicAction(value) {
  const v = String(value ?? '').trim().replace(/[（(]\s*无\s*[）)]/g, '无');
  if (!v || v === '无' || v === '-' || v === '—' || /^none$/i.test(v)) return null;
  // 防跨标签越界（如果带了 < 标签残余，截断到第一个 < 之前）
  const cleanV = v.split('<')[0].trim();
  if (!cleanV) return null;

  const segs = cleanV.split(/[；;\n]+/);
  for (const seg of segs) {
    const rawSeg = seg.trim();
    if (!rawSeg) continue;
    const parts = rawSeg.split(/[|｜、:：]+/).map((x) => x.trim()).filter(Boolean);
    if (!parts.length) continue;

    // 清理模型自加的 +1、数字等
    const cleanedParts = parts.map((p) => p.replace(/\s*\+?\d+.*$/, '').trim()).filter(Boolean);
    if (!cleanedParts.length) continue;

    for (const [id, cfg] of Object.entries(RELIC_PILOT_CONFIG)) {
      const matchRelic = cleanedParts.some((p) => cfg.names.includes(p) || cfg.ownerAliases.includes(p) || p.toLowerCase() === id.toLowerCase());
      if (!matchRelic) continue;

      let matchedAction = '';
      for (const p of cleanedParts) {
        if (cfg.validActions.includes(p)) {
          matchedAction = p;
          break;
        }
      }
      if (!matchedAction) {
        if (cleanedParts.some((p) => p.includes('内射') || p.includes('灌注'))) matchedAction = '内射';
        else if (cleanedParts.some((p) => p.includes('破身') || p.includes('初破'))) matchedAction = '破身';
      }

      if (matchedAction) {
        const actorPart = cleanedParts.find((p) => !cfg.names.includes(p) && !cfg.ownerAliases.includes(p) && p !== matchedAction && p.toLowerCase() !== id.toLowerCase());
        const curId = (typeof readIdentity === 'function' ? readIdentity() : null) || '赵无忧';
        const actor = actorPart || curId;
        return {
          relicId: id,
          relicName: cfg.names[0],
          actor,
          action: matchedAction,
          raw: rawSeg
        };
      }
    }
  }
  return null;
}

/** 核验名器互动申报（纯函数） */
function validateRelicAction(act, prose, known, currentIdentity) {
  if (!act || !act.relicId) return { ok: false, why: '无效或未知的动作申报' };
  const cfg = RELIC_PILOT_CONFIG[act.relicId];
  if (!cfg) return { ok: false, why: '非试点名器（首期仅支持灼酒流炎穴试点）' };

  // 1. 成形检查（前置硬闸门：known 状态 ＋ 账本归属实证兜底）
  const K = known || {};
  let isFormed = K[cfg.formKey] === true;
  if (!isFormed) {
    const sd = typeof readStatData === 'function' ? readStatData() : null;
    if (sd && (sd.名器归属?.[cfg.names[0]] || sd.名器归属?.[act.relicId] || sd.破处者?.[cfg.owner])) {
      isFormed = true;
    }
  }
  if (!isFormed) {
    return { ok: false, why: `名器「${cfg.names[0]}」尚未成形，不可累积互动或晋阶` };
  }

  // 2. 阶段检查（二阶段是否已达成）
  if (K[cfg.stage2Key] === true) {
    return { ok: false, why: `名器「${cfg.names[0]}」已达第二境（情动），一升二浸润计数已闭合` };
  }

  // 3. 动作枚举检查
  if (!cfg.validActions.includes(act.action)) {
    return { ok: false, why: `动作「${act.action}」不在合法枚举表内（支持：${cfg.validActions.join('、')}）` };
  }

  // 动作是破身：属于一阶成形动作，不增加入二阶浸润
  if (act.action === '破身') {
    return { ok: true, delta: 0, why: '破身属于一阶成形动作，不计入二阶浸润' };
  }

  // 4. 正文事实校验（Strict Evidence Check）
  const pText = String(prose || '');
  if (!pText) {
    return { ok: false, why: '本楼读不到正文文本，无法核验动作事实实证（fail-closed）' };
  }

  // 4a. 持有者在场实证
  const ownerPresent = cfg.ownerAliases.some((alias) => pText.includes(alias));
  if (!ownerPresent) {
    return { ok: false, why: `正文中未见持有者「${cfg.owner}」在场参与互动` };
  }

  // 4b. 动作证据词实证
  if (!cfg.evidenceRegex.test(pText)) {
    return { ok: false, why: `正文中未见「${act.action}」事实实证（须出现内射/精液灌注等硬词）` };
  }

  // 4c. 否定句拦截
  if (typeof negatedAround === 'function' && negatedAround(pText, cfg.evidenceRegex)) {
    return { ok: false, why: `正文中「${act.action}」实证落在否定或未发生分句中` };
  }

  return { ok: true, delta: 1, why: `正文事实核验通过（${cfg.owner}在场且有明确${act.action}实证）` };
}

/** 累进/回溯名器浸润进度（纯函数） */
function calcRelicProgress(allProgress, validAction, floor, swipeId, textHash) {
  const next = Object.assign({}, allProgress || {});
  if (!validAction || !validAction.relicId) return next;
  const id = validAction.relicId;
  const cfg = RELIC_PILOT_CONFIG[id];
  if (!cfg) return next;

  const cur = Object.assign({
    id,
    name: cfg.names[0],
    owner: cfg.owner,
    count: 0,
    target: cfg.target,
    ready: false,
    last_floor: 0,
    history: []
  }, next[id] || {});

  // 目标阈值由代码策略决定，严格正整数
  const target = Math.max(1, Math.floor(Number(cfg.target) || 5));
  cur.target = target;
  let count = Math.max(0, Math.min(target, Math.floor(Number(cur.count) || 0)));

  const fNum = Number(floor) || 0;
  const sNum = Number(swipeId) || 0;
  const hash = String(textHash || '');
  const delta = (validAction.ok !== false && Number.isFinite(Number(validAction.delta))) ? Math.floor(Number(validAction.delta)) : 0;

  let history = Array.isArray(cur.history) ? [...cur.history] : [];
  const existingIdx = history.findIndex((h) => Number(h.floor) === fNum);

  if (existingIdx >= 0) {
    const prev = history[existingIdx];
    // 同楼同分支同正文：幂等，不重复增减
    if (Number(prev.swipeId) === sNum && prev.hash === hash) {
      cur.count = count;
      cur.ready = count >= target;
      next[id] = cur;
      return next;
    }
    // 同楼换分支(Swipe)或编辑：撤销旧贡献，加上新贡献
    const prevDelta = Math.floor(Number(prev.delta) || 0);
    count = Math.max(0, Math.min(target, count - prevDelta + delta));
    history[existingIdx] = {
      floor: fNum,
      swipeId: sNum,
      hash,
      actor: validAction.actor || 'player',
      action: validAction.action || '',
      delta,
      timestamp: Date.now()
    };
  } else {
    // 新楼记录
    count = Math.max(0, Math.min(target, count + delta));
    history.push({
      floor: fNum,
      swipeId: sNum,
      hash,
      actor: validAction.actor || 'player',
      action: validAction.action || '',
      delta,
      timestamp: Date.now()
    });
  }

  // 约束审计账本大小，保留最近 20 笔
  if (history.length > 20) history = history.slice(-20);

  cur.count = count;
  cur.ready = count >= target;
  cur.last_floor = fNum;
  cur.history = history;
  next[id] = cur;
  return next;
}

/** 身份：gpt。仅接受同一分句中落在持有者上的已发生生理响应。 */
function hasRelicPhysiologicalResponse(relicId, prose) {
  const cfg = RELIC_PILOT_CONFIG[relicId];
  if (!cfg) return false;
  const nonFact = /据说|听说|传闻|谣传|计划|打算|准备|想要|希望|将要|即将|可能|或将|若是|假如|倘若|万一|是否|未|没有|没能|不曾|并不|不是|不会|不愿|讨论|提及|解释|说明/;
  // 阶段名称、情动或一般抽搐本身不是名器自主响应。
  const response = /自发迎合|生理自发|本能迎合|自发蠕动|紧紧缠裹|主动缠裹|(?:内壁|花房|媚肉|穴肉|甬道|名器|阴道|小穴).{0,12}(?:痉挛|蠕动|抽搐|吮吸|缠裹|吸附|收缩)|(?:本能|自主|自发|不由自主).{0,12}(?:迎合|蠕动|缠裹|吸附|收缩)/g;
  const subjects = Object.keys(HOLDER_TO_RELIC).concat(IDENTITY_NAMES, cfg.ownerAliases);
  for (const clause of String(prose || '').split(/[，。；！？\n]/)) {
    if (nonFact.test(clause) || !/(名器|内壁|花房|媚肉|穴肉|甬道|阴道|小穴|蜜穴|玉穴|肉壁|肉穴|花穴|穴口|子宫)/.test(clause)) continue;
    response.lastIndex = 0;
    let match;
    while ((match = response.exec(clause))) {
      const before = clause.slice(0, match.index);
      const mentions = subjects.flatMap(name => {
        const at = before.lastIndexOf(name);
        return at >= 0 ? [{ name, at, end: at + name.length }] : [];
      }).sort((a, b) => a.at - b.at || b.name.length - a.name.length);
      const last = mentions[mentions.length - 1];
      if (last && cfg.ownerAliases.includes(last.name) && match.index - last.end <= 80) return true;
    }
  }
  return false;
}
/* XSD_MILESTONE_APPLICATION_CORE_BEGIN */
/** 机械迁移应用核：业务与宿主依赖由适配层显式提供。 */
function createXsdMilestoneApplication(deps) {
  const { deflowerEvidenceIn, readStatData, readKnown, stripStatusBlock, validateAnchors, console, TAG, ALL_FIELDS, readIdentity, normalizeAnchorName, DEFLOWER_HARD_RES, FORM_OF_HOLDERS, 出场实证名, deriveRelicClosure, nearDeflowerWord, HOLDER_TO_RELIC, defaultInventoryFor, applyItemChange, itemEvidenceIn, normalizeInventory, structuredClone, hashText, RELIC_PILOT_CONFIG, validateRelicAction, calcRelicProgress, hasRelicPhysiologicalResponse, writeStat } = deps;
async function applyMilestones(p, messageId, text) {
  const list = Array.isArray(p?.里程碑) ? p.里程碑 : null;
  const bookIn = Array.isArray(p?.破处) ? p.破处 : [];
  const nadeIn = (p?.纳戒 && typeof p.纳戒 === 'object') ? p.纳戒 : null;
  const nadeHas = Boolean(nadeIn && ((nadeIn.获得 || []).length || (nadeIn.消耗 || []).length));
  const relicActs = Array.isArray(p?.名器互动) ? p.名器互动 : [];

  const sd0 = readStatData() || {};
  const prevRelicProgress = (sd0.relic_progress && typeof sd0.relic_progress === 'object') ? sd0.relic_progress : {};
  const hasRelicWork = relicActs.length > 0 || Object.values(prevRelicProgress).some((rp) => (rp.history || []).some((h) => Number(h.floor) === Number(messageId)));

  const hasReadyRelic = Object.values(prevRelicProgress).some(rp => rp && rp.ready === true);
  const hasFloorAnchors = Boolean(sd0.锚点账本 && sd0.锚点账本[String(messageId)]);
  if (!list && !bookIn.length && !nadeHas && !hasRelicWork && !hasReadyRelic && !hasFloorAnchors) return [];      // 四栏都没有且无名器回溯 ⇒ 什么都不做
  const known = readKnown() || {};
  
  const proseForAnchor = stripStatusBlock(text);
  /* 2026-10-08（gpt 04 号①）：与段位推进共用同一份已校验集合（本轮在段位那一步已算过一次，
     写在 p.本轮已验证锚点 上；没有就现算）。不再让「原始申报」和「校验结果」两套并行。 */
  const _v = validateAnchors(list || [], proseForAnchor, messageId, known, bookIn, sd0);
  const good = _v.good, bad = _v.bad, dropped = _v.dropped;
  let news = [];
  const correctionRecords = (readStatData() || {}).人工纠错?.覆盖 || {};
  const correctionAllows = f => correctionRecords[JSON.stringify(['known', f])]?.value !== false;
  for (const f of good) if (correctionAllows(f) && known[f] !== true && !news.includes(f)) news.push(f);
  if (list && !list.length) console.log(TAG, `[实际发生] 第 ${messageId} 楼：写了「无」`);
  if (!list) console.log(TAG, `[实际发生] 第 ${messageId} 楼没有这一栏，本轮只处理 <破处>`);
  if (bad.length) {
    console.warn(TAG, `⚠️ [实际发生] 第 ${messageId} 楼有 ${bad.length} 个**不属于字段台账**的名字，已丢弃：${bad.join('、')}`
      + '（只能用状态字段表里那一串；自造词不会被记账）');
  }
  
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

  

  // ① 破处簿：与历史累积合并（先记的为准，不许模型来回改口）
  const proseOuter = stripStatusBlock(text);           // 本楼正文（去掉状态栏），破处依据只看它
  
  const anchorLog = (sd0.锚点账本 && typeof sd0.锚点账本 === 'object') ? { ...sd0.锚点账本 } : {};
  const anchorFinger = JSON.stringify({ anchors: (list || []).map(x => normalizeAnchorName(String(x).trim())).filter(Boolean), prose: hashText(proseOuter), swipe: p?.swipeId ?? 0 });
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
  // 回滚后重新评估：相同申报仍有实证时应重新置真，不能由最后的false墓碑覆盖。
  news = Array.from(new Set(good.filter(f => correctionAllows(f) && known[f] !== true)));
  const prevBook = (sd0.破处者 && typeof sd0.破处者 === 'object') ? sd0.破处者 : {};
  const mergedBook = Object.assign({}, prevBook);
  let bookChanged = false;
  const bookSources = { ...(sd0.破处来源 || {}) };
  let bookSourceChanged = false;
  for (const [holder, source] of Object.entries(bookSources)) {
    if (!source || Number(source.楼) !== Number(messageId) || source.指纹 === anchorFinger) continue;
    if (deflowerEvidenceIn(proseOuter, holder).ok) continue;
    const manualOwner = correctionRecords[JSON.stringify(['名器归属', HOLDER_TO_RELIC[holder]])];
    if (manualOwner) continue;
    mergedBook[holder] = null;
    bookSources[holder] = null;
    bookChanged = true; bookSourceChanged = true;
    const field = holder + '处女丧失';
    const elsewhere = Object.keys(anchorLog).some(k => k !== String(messageId) && (anchorLog[k]?.新置真 || []).includes(field));
    const manualFact = correctionRecords[JSON.stringify(['known', field])];
    if (!elsewhere && (!manualFact || manualFact.value !== true)) {
      delete known[field];
      if (!rolledBack.includes(field)) rolledBack.push(field);
    }
  }
  for (const it of bookIn) {
    const h = it.持有者;
    let w = it.破处者;

    // 防冒名守卫：当前玩家身份若非赵无忧，但模型在破处簿中误将破处者报为「赵无忧」或留空
    // 强制纠偏为当前真实玩家身份，确保战果与名器归属不被赵无忧冒名抢夺
    if (!isZhao && (w === '赵无忧' || !w)) {
      console.warn(TAG, `⛔ [破处守卫] 第 ${messageId} 楼当前玩家身份为「${curPlayerId}」，模型误将破处者报为「${w}」⇒ 强制纠偏为当前玩家身份「${curPlayerId}」`);
      w = curPlayerId;
    }
    
    if (proseOuter && !proseOuter.includes(h)) {
      console.warn(TAG, `⛔ [破处闸门] 第 ${messageId} 楼丢弃「${h}、${w}」：本楼正文里根本没有「${h}」（八成是照抄写法示例）。`
        + `真要手工补，发「/解锁 ${h}处女丧失」。`);
      continue;
    }
    const evidence = deflowerEvidenceIn(proseOuter, h);
    if (!evidence.ok) {
      console.warn(TAG, '[主体实证] 第 ' + messageId + ' 楼丢弃「' + h + '」：' + evidence.why);
      continue;
    }
    if (!mergedBook[h]) {
      mergedBook[h] = w; bookChanged = true;
      bookSources[h] = { 楼: Number(messageId), 指纹: anchorFinger, 来源: '本版正文事实' };
      bookSourceChanged = true;
    }
    else if (mergedBook[h] !== w) {
      console.warn(TAG, `[破处簿] 第 ${messageId} 楼「${h}」已记作「${mergedBook[h]}」，本次的「${w}」不覆盖（先记的为准）`);
    }
  }
  const lost = (holder) => correctionAllows(holder + '处女丧失') && (Boolean(mergedBook[holder])
    || known[holder + '处女丧失'] === true || news.includes(holder + '处女丧失'));

  
  /* ⚠️ 键用**持有者**（FORM_OF_HOLDERS 里的 form 带「成形」后缀，用名器名当键会取不到）。 */
  const FORM_EXTRA = {
    楚灵夜: ['楚灵夜后窍开发'],
  };
  const extraOk = (g) => g.holders.every((h) => (FORM_EXTRA[h] || []).every((f) => willTrue(f)));
  const extraWhy = (g) => g.holders.flatMap((h) => FORM_EXTRA[h] || []).join('／');

  for (const holder of Object.keys(mergedBook)) {
    const field = holder + '处女丧失';
    if (mergedBook[holder] && correctionAllows(field) && known[field] !== true && !news.includes(field)) news.push(field);
  }
  // ② 两条通道 → 补成形（跨回合累加：双姝要两个人都丧失才算，先后在不同回合也算）
  for (const g of FORM_OF_HOLDERS) {
    if (!g.holders.every(lost)) {
      // 已通过正文主体实证的申报交给③挽救；人工否定前置仍禁止。
      if (g.holders.some(h => !correctionAllows(h + '处女丧失'))) news = news.filter(f => f !== g.form);
      continue;
    }
    if (!extraOk(g)) {
      console.log(TAG, `[成形闸门] 「${g.form}」的持有者已丧失，但额外条件未满足（还差：${extraWhy(g)}）⇒ 暂不成形`);
      continue;
    }
    if (willTrue(g.form)) continue;
    news.push(g.form);
    console.log(TAG, `↳ 派生：${g.holders.map((h) => h + '处女丧失').join(' ＋ ')}${extraWhy(g) ? ' ＋ ' + extraWhy(g) : ''} ⇒ 「${g.form}」`);
  }

  
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
  /* 2026-10-08（gpt 17 号 §2 ⑤⑦⑧）：两条"自动派发"改为**带来源账本的事务派生** ——
     触发看正文实际出场实证（不再沿用 known['阎雷子脱困'] 当资格）；派发时补写明确 NPC 归属与来源；
     依赖重算：账本里来源清零的才撤（人工来源不撤）。全过程在纯函数 `deriveRelicClosure` 里可离线测。 */
  news = news.filter(correctionAllows);
  const 出场实证 = { 柳含烟: 出场实证名('柳含烟', proseOuter) };
  const 派生账本旧 = (sd0.派生账本 && typeof sd0.派生账本 === 'object') ? sd0.派生账本 : {};
  const 归属来源旧 = (sd0.名器归属来源 && typeof sd0.名器归属来源 === 'object') ? sd0.名器归属来源 : {};
  const 闭包 = deriveRelicClosure({
    known, news, ledger: 派生账本旧, 名器归属: sd0.名器归属 || {}, 归属来源: 归属来源旧,
    messageId, 指纹: anchorFinger, 出场实证, 人工纠错: sd0.人工纠错,
  });
  news = 闭包.news;
  for (const l of 闭包.日志) console.log(TAG, '↳ 派生：' + l);
  const 派生撤销 = 闭包.撤销 || [];
  const 归属补写 = 闭包.归属补写 || {};
  const 归属来源补写 = 闭包.归属来源补写 || {};
  const 派生账本新 = 闭包.ledger || {};
  const 派生账本变 = JSON.stringify(派生账本新) !== JSON.stringify(派生账本旧);

  // ③ 冲突消解：只报成形而两条通道都没坐实的，先查正文，再决定挽救还是丢弃
  const rawText = proseOuter;
  for (const g of FORM_OF_HOLDERS) {
    const at = news.indexOf(g.form);
    if (at === -1) continue;
    
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
  /* ⑦ 派生事务里写下的明确 NPC 归属（只在没有更强来源时；不覆盖玩家/GM 的写入） */
  const 名器归属来源新 = Object.assign({}, 归属来源旧, 归属来源补写);
  for (const k of Object.keys(归属补写)) relicOwners[k] = 归属补写[k];
  const 归属来源变 = JSON.stringify(名器归属来源新) !== JSON.stringify(归属来源旧);
  const ownersChanged = JSON.stringify(sd0.名器归属 || {}) !== JSON.stringify(relicOwners);

  const playerRelicFormed = (function () {
    if (isFenyu) return willTrue('灼酒流炎穴成形') || willTrue('灵犀同心成形');
    if (isHuanxi) return willTrue('般若菩提菊成形') || willTrue('心魔茶璎乳成形');
    if (isZhuolong) return willTrue('九幽玄阴穴成形') || willTrue('玉虎噙香乳成形');
    if (isHunhuan) return willTrue('梅蕊穴成形') || willTrue('凤凰羽花成形');
    if (isZhao) {
      
      if (willTrue('北冥潮生穴成形')) return true;
      if (FORM_OF_HOLDERS.some((g) => willTrue(g.form))) return true;
      return false;
    }
    // 自设身份：自设玩家攻略任意名器均有效
    return MINGQI_CHENG.some(willTrue) || ALL_FIELDS.filter(f => /阶段$/.test(f)).some(willTrue);
  })();

  const playerOwnership = FORM_OF_HOLDERS.some(g => {
    if (!willTrue(g.form)) return false;
    const relic = g.form.replace(/成形$/, '');
    const owner = relicOwners[relic] || (sd0.名器归属 || {})[relic];
    return owner === curPlayerId || (!owner && news.includes(g.form));
  });
  if (playerRelicFormed && playerOwnership && known['获得任意名器'] !== true && !news.includes('获得任意名器')) {
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
  
  const nadeLog = (sd0.纳戒账本 && typeof sd0.纳戒账本 === 'object') ? { ...sd0.纳戒账本 } : {};
  const nadeFinger = nadeIn ? JSON.stringify({ actions: [(nadeIn.消耗 || []).map(x => [x.name, x.count]), (nadeIn.获得 || []).map(x => [x.name, x.count])], prose: hashText(proseOuter), swipe: p?.swipeId ?? 0 }) : '';
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
    
    nadeLog[String(messageId)] = null;
    invChanged = true;
    ledgerChanged = true;
    console.log(TAG, `[纳戒] 第 ${messageId} 楼内容变了 ⇒ 先回滚旧账（消耗 ${(prevEntry.消耗 || []).length} 项／获得 ${(prevEntry.获得 || []).length} 项）再重算`);
  } else if (sameFinger) {
    console.log(TAG, `[纳戒] 第 ${messageId} 楼这一栏与上次一致 ⇒ 不重复入账（幂等）`);
  }
  if (nadeIn && !sameFinger) {
    const done消耗 = [], done获得 = [];
    
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

  // ── 名器动作申报核验与浸润累进（首期：灼酒流炎穴试点）──
  let relicProgressChanged = false;
  let allRelicProgress = (typeof structuredClone === 'function')
    ? structuredClone(prevRelicProgress)
    : JSON.parse(JSON.stringify(prevRelicProgress));
  const swipeId = p?.swipeId ?? 0;
  const textHash = hashText(text);

  // 聚合本轮新成形与历史成形，防止当轮刚成形的名器被判为「尚未成形」
  const knownNow = Object.assign({}, known);
  for (const f of news) knownNow[f] = true;

  for (const pilotId of Object.keys(RELIC_PILOT_CONFIG)) {
    const act = relicActs.find((a) => a.relicId === pilotId) || null;
    const existingHistory = allRelicProgress[pilotId]?.history || [];
    const hadFloor = existingHistory.some((h) => Number(h.floor) === Number(messageId));

    if (act) {
      const vRes = validateRelicAction(act, proseOuter, knownNow, curPlayerId);
      if (vRes.ok) {
        allRelicProgress = calcRelicProgress(allRelicProgress, { ...act, ok: true, delta: vRes.delta }, messageId, swipeId, textHash);
        relicProgressChanged = true;
        console.log(TAG, `[名器互动] 第 ${messageId} 楼「${act.relicName}」动作「${act.action}」核验通过 ⇒ 浸润计数：${allRelicProgress[pilotId]?.count}/${allRelicProgress[pilotId]?.target}`);
      } else {
        console.warn(TAG, `⛔ [名器互动] 第 ${messageId} 楼丢弃动作「${act.raw}」：${vRes.why}`);
        if (hadFloor) {
          allRelicProgress = calcRelicProgress(allRelicProgress, { relicId: pilotId, ok: true, delta: 0, action: '无' }, messageId, swipeId, textHash);
          relicProgressChanged = true;
        }
      }
    } else if (hadFloor) {
      allRelicProgress = calcRelicProgress(allRelicProgress, { relicId: pilotId, ok: true, delta: 0, action: '无' }, messageId, swipeId, textHash);
      relicProgressChanged = true;
      console.log(TAG, `[名器互动] 第 ${messageId} 楼新分支无互动 ⇒ 撤销本楼旧分支贡献，当前计数：${allRelicProgress[pilotId]?.count}/${allRelicProgress[pilotId]?.target}`);
    } else if (willTrue(RELIC_PILOT_CONFIG[pilotId]?.formKey) && !allRelicProgress[pilotId]) {
      // 破身成形当轮保底建档，确保初始进度 0/5 落地
      allRelicProgress = calcRelicProgress(allRelicProgress, { relicId: pilotId, ok: true, delta: 0, action: '成形建档' }, messageId, swipeId, textHash);
      relicProgressChanged = true;
      console.log(TAG, `[名器互动] 第 ${messageId} 楼「${RELIC_PILOT_CONFIG[pilotId]?.names[0]}」破身成形 ⇒ 建立初始浸润档案 (0/${allRelicProgress[pilotId]?.target})`);
    }
  }

  // 双向兼容：同时在 zhuojiuliuyanxue / zhuojiu / 灼酒流炎穴 下维护镜像，确保前端取值 100% 命中
  for (const pid of Object.keys(RELIC_PILOT_CONFIG)) {
    const curP = allRelicProgress[pid];
    if (curP) {
      allRelicProgress['zhuojiuliuyanxue'] = curP;
      allRelicProgress[curP.name] = curP;
    }
  }

  // ── 名器满额质变自动晋阶派生（RFC-002 铁律 36 闭环：浸润满额 5/5 ＋ 正文出现女方生理自发迎合实证 ⇒ 自动晋阶二阶段）──
  for (const pilotId of Object.keys(RELIC_PILOT_CONFIG)) {
    const cfg = RELIC_PILOT_CONFIG[pilotId];
    const curP = allRelicProgress[pilotId];
    if (!cfg || !curP) continue;
    const s2Key = cfg.stage2Key;
    const count = Number(curP.count), target = Number(curP.target);
    const eligible = curP.ready === true && Number.isFinite(count) && Number.isInteger(count)
      && count === cfg.target && target === cfg.target
      && known[cfg.formKey] === true && known[cfg.stage1Key] === true
      && correctionAllows(cfg.formKey) && correctionAllows(cfg.stage1Key);
    if (eligible && known[s2Key] !== true && !news.includes(s2Key) && correctionAllows(s2Key)) {
      if (typeof hasRelicPhysiologicalResponse === 'function' && hasRelicPhysiologicalResponse(pilotId, proseOuter)) {
        news.push(s2Key);
        console.log(TAG, `↳ [名器质变] 「${cfg.names[0]}」浸润饱满(${curP.count}/${curP.target}) 且正文出现女方生理自发迎合实证 ⇒ 自动晋阶「${s2Key}」`);
      }
    }
  }

  const needOwnerWrite = ownersChanged && Object.keys(relicOwners).length > 0;
  const needDeriveWrite = 派生账本变 || 归属来源变 || 派生撤销.length > 0;
  if (!news.length && !bookChanged && !needOwnerWrite && !needDeriveWrite && !invChanged && !dispatchChanged && !relicProgressChanged && !anchorLogChanged && !rolledBack.length) {
    console.log(TAG, `[实际发生] 第 ${messageId} 楼：${good.join('、') || '（无）'} —— 都已在账本里，无需写盘`);
    return [];
  }
  const patch = { known: {} };
  for (const f of news) patch.known[f] = true;
  if (bookChanged || needOwnerWrite) {
    patch.破处者 = mergedBook;
    patch.名器归属 = relicOwners;
  }
  if (bookSourceChanged) patch.破处来源 = bookSources;
  if (relicProgressChanged) patch.relic_progress = allRelicProgress;
  /* ⑧ 派生账本与归属来源落盘；被撤销的派生写 false（墓碑在账本里是 null） */
  if (派生账本变) patch.派生账本 = 派生账本新;
  if (归属来源变) { patch.名器归属来源 = 名器归属来源新; patch.名器归属 = relicOwners; }
  if (派生撤销.length) {
    patch.known = patch.known || {};
    for (const f of 派生撤销) patch.known[f] = false;
    console.warn(TAG, `↩️ [派生回退] 第 ${messageId} 楼来源清零 ⇒ 撤销派生：${派生撤销.join('、')}`);
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
  if (rolledBack.length) { patch.known = patch.known || {}; for (const f of rolledBack) if (!news.includes(f)) patch.known[f] = false; }
  const r = await writeStat(patch, `第 ${messageId} 楼 <实际发生>/<破处>/<名器互动> 自动记账${invChanged ? '（含纳戒更新）' : ''}`);
  if (r && r.ok) {
    console.log(TAG, `${r.pending ? '📝 [规划]' : '✅'} [实际发生] 第 ${messageId} 楼自动解锁 ${news.length} 个锚点：${news.join('、') || '（无）'}（via ${r.via}）`
      + (bookChanged ? ` 破处簿 +${bookIn.length} 条` : '')
      + (needOwnerWrite ? ` 名器归属 = ${JSON.stringify(relicOwners)}` : '')
      + (relicProgressChanged ? ' 名器浸润进度已更新' : '')
      + (invChanged ? ' 纳戒物品已更新' : ''));
    return news;
  }
  console.warn(TAG, `❌ [实际发生] 第 ${messageId} 楼自动解锁失败（${news.join('、')}）：${(r && r.why) || '变量接口不可用'}`);
  return [];
}

/**
 * 自由字段的一致性闸（2026-10-08 · gpt 17 号 §3 点名的那条"回喂通道"）
 * ─────────────────────────────────────────────────────────────────────
 * gpt 原话要点：「固定世界事件对这些状态的写入和再次渲染都做日期／前置一致性检查；
 *   记录被拒值、来源与诊断，保留最后可信值，不把『传闻／计划』提升为已发生事实；
 *   普通变化保留，按事件语义判断，**不以『有兽潮二字』一律拒绝**。」
 *
 * 判据（只拦"把未到的固定世界事件写成正在发生"这一类）：
 *   · 仅看 局势／近闻／远闻／危机／目标／阶段总结 六个自由文本字段；
 *   · 文本先过一遍**豁免表**（传闻／据说／将要／尚未／计划／若是…）—— 这些不算"已发生"，放行；
 *   · 命中事件宣言句式后，用**可信数值日期**与事件起点比：日期不可信或未到起点 ⇒ 拒绝写入，
 *     保留上一轮的可信值，并落 `自由字段闸` 诊断（后台，不进正文）；
 *   · 日期已到 ⇒ 放行（正文可以演，事实由 `<实际发生>` 建立 —— 与阶段驱动的世界轴同一口径）。
 */

  return { applyMilestones };
}
/* XSD_MILESTONE_APPLICATION_CORE_END */
/** 原共享作用域名称的兼容适配；函数依赖延迟解析，避免后置模块初始化时序变化。 */
const XSD_MILESTONE_DEPS = {
  deflowerEvidenceIn: (...args) => deflowerEvidenceIn(...args),
  readStatData: (...args) => readStatData(...args),
  readKnown: (...args) => readKnown(...args),
  stripStatusBlock: (...args) => stripStatusBlock(...args),
  validateAnchors: (...args) => validateAnchors(...args),
  console,
  TAG,
  ALL_FIELDS,
  readIdentity: (...args) => readIdentity(...args),
  normalizeAnchorName: (...args) => normalizeAnchorName(...args),
  DEFLOWER_HARD_RES,
  FORM_OF_HOLDERS,
  出场实证名: (...args) => 出场实证名(...args),
  deriveRelicClosure: (...args) => deriveRelicClosure(...args),
  nearDeflowerWord: (...args) => nearDeflowerWord(...args),
  HOLDER_TO_RELIC,
  defaultInventoryFor: (...args) => defaultInventoryFor(...args),
  applyItemChange: (...args) => applyItemChange(...args),
  itemEvidenceIn: (...args) => itemEvidenceIn(...args),
  normalizeInventory: (...args) => normalizeInventory(...args),
  structuredClone: typeof structuredClone !== 'undefined' ? structuredClone : undefined,
  hashText: (...args) => hashText(...args),
  RELIC_PILOT_CONFIG,
  validateRelicAction: (...args) => validateRelicAction(...args),
  calcRelicProgress: (...args) => calcRelicProgress(...args),
  hasRelicPhysiologicalResponse: (...args) => hasRelicPhysiologicalResponse(...args),
  writeStat: (...args) => writeStat(...args),
};
const XSD_MILESTONE_APPLICATION = createXsdMilestoneApplication(XSD_MILESTONE_DEPS);
async function applyMilestones(p, messageId, text) { return XSD_MILESTONE_APPLICATION.applyMilestones(p, messageId, text); }
/* ══════════════════════════════════════════════════════════════════════════
 * 派生：来源账本 ＋ 事务撤销（2026-10-08 · gpt 17 号 §2 ⑤⑦⑧ 同批修）
 * ──────────────────────────────────────────────────────────────────────────
 * gpt 原话要点：
 *   ⑤ 「选**实际出场事件**的正文证据触发柳含烟派生，在场/暗处仅辅助；不沿用脱困资格；
 *      名字提及、传闻、回忆、计划不算当前参与；缺证据不补真。」
 *   ⑦ 「该项真实出场派生事务中，若归属尚未有更强的既成来源，写明确 NPC 归属与来源；
 *      已有合法转移／玩家修改不得被每轮默认值覆盖；未出场不因 lord 有值就亮。」
 *   ⑧ 「来源记录＋统一依赖重算／事务撤销；撤一个来源只去掉它的贡献，另有合法来源则保留；
 *      阶段2撤销不能误删独立来源的阶段1；人工来源不静默消失；出场是历史事件，离场不撤二阶段。」
 * ══════════════════════════════════════════════════════════════════════════ */

/** 出场实证：本楼正文里**真的参与了当前场景**才算（提及／传闻／回忆／计划都不算）。
 *  fail-closed：读不到正文一律不算。 */
const APPEAR_VERBS = /(说|道|问|答|笑|叹|看|望|瞧|走|来|去|坐|立|站|行|伸手|抬手|握住|拦住|挡|递|接|点头|摇头|皱眉|转身|出声|开口|走进|出场|露面|现身|化作|扫过|俯|跪下|跪|抱|牵|扶|推|踢|挥|落座|饮|喝|吃)/;
/* gpt ⑤：**传闻／回忆／计划都不算当前参与** —— 窗口里出现这些词就不认定（点名同理）。 */
const APPEAR_EXCLUDE = /传闻|据说|听说|谣传|曾经|当年|昔年|记得|回忆|想起|梦见|将要|即将|打算|计划|预定|若是|万一|倘若|假如|是否|尚未|还没|未至|未到|提到|提起|之名|的名字|画像|名录/;
function 出场实证名(name, prose) {
  const t = String(prose || '');
  const nm = String(name || '');
  if (!nm) return { ok: false, why: '角色名为空' };
  if (!t) return { ok: false, why: '本楼读不到正文 ⇒ 不予认定（fail-closed）' };
  const esc = nm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(.{0,24})' + esc + '(.{0,32})', 'g');
  let m, 试 = 0;
  while ((m = re.exec(t)) && 试 < 40) {
    试++;
    const 窗 = m[1] + nm + m[2];
    if (APPEAR_EXCLUDE.test(窗)) continue;                 /* 传闻／回忆／计划／点名 ⇒ 不算出场 */
    if (negatedAround(t, new RegExp(esc))) continue;       /* 同一句里是否定／未发生 ⇒ 不算 */
    if (APPEAR_VERBS.test(窗)) return { ok: true, 证据: 窗.replace(/\s+/g, ' ').slice(0, 70) };
    if (re.lastIndex <= m.index) re.lastIndex = m.index + 1;
  }
  return { ok: false, why: '正文里没有「' + nm + '」参与当前场景的实证（点名／传闻／回忆／计划不算）' };
}

/** 纯函数：算本轮派生闭包（不写盘）。可离线测。
 *  @param inp { known, news, ledger, 名器归属, 归属来源, messageId, 指纹, 出场实证 }
 *  @returns { news, ledger, 归属补写, 归属来源补写, 撤销, 日志 } */
function deriveRelicClosure(inp) {
  const known = inp.known || {};
  const service = typeof window !== 'undefined' ? window.__xsdCorrection : null;
  const records = inp.人工纠错 && inp.人工纠错.覆盖 || {};
  const manual = f => records[JSON.stringify(['known', f])];
  const allowed = f => !(manual(f) && manual(f).value === false);
  const news = (inp.news || []).filter(allowed);
  const ledger = JSON.parse(JSON.stringify(inp.ledger || {}));
  const 归属来源 = Object.assign({}, inp.归属来源 || {});
  const messageId = inp.messageId;
  const 指纹 = String(inp.指纹 || '');
  const 出场实证 = inp.出场实证 || {};
  const 撤销 = [], 日志 = [], 归属补写 = {}, 归属来源补写 = {};
  let ledgerChanged = false;
  const has = (f) => manual(f) ? manual(f).value === true : known[f] === true || news.includes(f);
  const 来源表 = (f) => (ledger[f] && Array.isArray(ledger[f].来源)) ? ledger[f].来源 : null;
  const 记来源 = (f, 类型, 键, 证据) => {
    if (!ledger[f] || !Array.isArray(ledger[f].来源)) { ledger[f] = { 来源: [] }; ledgerChanged = true; }
    if (!ledger[f].来源.some((s) => s.键 === 键)) {
      ledger[f].来源.push({ 键, 类型, 楼: Number(messageId) || null, 指纹, 证据: String(证据 || '').slice(0, 70) });
      ledgerChanged = true;
    }
  };
  const 有类型 = (f, 类型) => (来源表(f) || []).some((s) => s.类型 === 类型);
  if (!has('烟霞灵乳二阶段') && ledger['烟霞灵乳一阶段']) {
    ledger['烟霞灵乳一阶段'].来源 = (ledger['烟霞灵乳一阶段'].来源 || []).filter(s => s.键 !== '烟霞灵乳二阶段成立');
    ledgerChanged = true;
  }

  /* ⑤① 柳含烟**实际出场** ⇒ 烟霞灵乳二阶段（不再沿用 known['阎雷子脱困'] 当资格） */
  const 场 = 出场实证['柳含烟'];
  if (场 && 场.ok) 记来源('烟霞灵乳二阶段', '出场实证', '柳含烟出场', 场.证据);
  if (场 && 场.ok && allowed('烟霞灵乳二阶段') && !has('烟霞灵乳二阶段')) {
    news.push('烟霞灵乳二阶段');
    日志.push('柳含烟实际出场（正文实证：' + (场.证据 || '') + '）⇒ 烟霞灵乳二阶段');
  }
  /* ⑦ 归属：只在"出场实证"这条来源在场时补写，且不覆盖既有的更强来源 */
  if (has('烟霞灵乳二阶段') && 有类型('烟霞灵乳二阶段', '出场实证')) {
    const 现 = (inp.名器归属 || {})['烟霞灵乳'] || null;
    const 旧来源 = 归属来源['烟霞灵乳'] || null;
    if (!现) {
      归属补写['烟霞灵乳'] = '阎雷子';
      归属来源补写['烟霞灵乳'] = { 归属者: '阎雷子', 来源: '柳含烟实际出场（正文实证）', 由脚本写: true, 楼: Number(messageId) || null };
    } else if (旧来源 && 旧来源.由脚本写 === true) {
      if (现 !== '阎雷子') { 归属补写['烟霞灵乳'] = '阎雷子'; 归属来源补写['烟霞灵乳'] = { 归属者: '阎雷子', 来源: '柳含烟实际出场（正文实证）', 由脚本写: true, 楼: Number(messageId) || null }; }
    } else {
      日志.push('归属保持既有来源「' + 现 + '」—— 脚本不覆盖玩家/GM 的写入');
    }
  }
  /* ⑥ 楚灵夜两项硬前置齐备 ⇒ 般若菩提菊成形（来源＝前置齐备） */
  const 前置齐 = known['楚灵夜处女丧失'] === true && known['楚灵夜后窍开发'] === true;
  if (前置齐) 记来源('般若菩提菊成形', '前置齐备', '楚灵夜双前置', '处女丧失＋后窍开发');
  if (前置齐 && allowed('般若菩提菊成形') && !has('般若菩提菊成形')) {
    news.push('般若菩提菊成形');
    日志.push('楚灵夜两项前置齐备 ⇒ 般若菩提菊成形');
  }
  /* ④ 出场即二境：一阶段随二阶段（依赖来源），但**保留**它自己的独立来源 */
  if (has('烟霞灵乳二阶段')) 记来源('烟霞灵乳一阶段', '依赖', '烟霞灵乳二阶段成立', '出场即二境');
  if (has('烟霞灵乳二阶段') && allowed('烟霞灵乳一阶段') && !has('烟霞灵乳一阶段')) {
    news.push('烟霞灵乳一阶段');
    日志.push('烟霞灵乳出场即第二境 ⇒ 补记一阶段');
  }

  /* ⑧ 依赖重算：账本里"来源清零"的字段才撤 —— 人工来源永不自动撤；别的合法来源在场则保留 */
  for (const f of Object.keys(ledger)) {
    if (!ledger[f]) continue;
    const 剩 = ledger[f].来源 || [];
    const 人工 = 剩.some((s) => s.类型 === '人工');
    if (manual(f)) continue; // 人工true和false都不由来源清零改回
    if (剩.length === 0 && !人工) {
      const i = news.indexOf(f);
      if (i >= 0) news.splice(i, 1);
      else if (known[f] === true) 撤销.push(f);
      ledger[f] = null;                                    /* 墓碑（深合并不认 delete） */
      ledgerChanged = true;
      日志.push('来源清零 ⇒ 撤销派生「' + f + '」（写 null 墓碑）');
    } else if (人工 && has(f) === false && known[f] !== true) {
      /* 有人工来源但字段是 false ⇒ 说明被手工撤过；不自动补回 */
      日志.push('「' + f + '」有人工来源但当前为假 ⇒ 不自动补回');
    }
  }
  return { news, ledger, ledgerChanged, 归属补写, 归属来源补写, 撤销, 日志 };
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
/* XSD_STATUS_APPLICATION_CORE_BEGIN */
/** 机械迁移应用核：业务与宿主依赖由适配层显式提供。 */
function createXsdStatusApplication(deps) {
  const { eligibleKnown, console, TAG, parseStatusBlock, reconcileNadeLedger, msgOf, ensureInit, readStatData, FLOOR_PIN, stageOfFloor, freeFieldGate, freeFieldSuspect, writeStat, DISPLAY_FIELDS, toast, messageText, detectInheritance, applyInheritedArchive, validateAnchors, stripStatusBlock, checkFastForwardStage, parseLishi, ymToMonths, SEG_TIME, isSceneLocked, resolveCalendarBasis, fmtXianmeng, monthsToYm, XSD_CALENDAR, nextAcc, fmtXianmengDay, CAST_FIELD, applyMilestones, window, readIdentity, IDENTITY_NAMES, readFaction, readKnown, ALL_FIELDS } = deps;
async function applyStatusToVars(text, messageId, opt) {
  // ⓪ 独立提取阶段总结与结算（即使没有状态栏，只要有结算/总结就必须存下来）
  const sumMatch = /<(?:阶段总结|结算)>([\s\S]*?)<\/(?:阶段总结|结算)>/.exec(text);
  const capturedSummary = (sumMatch && sumMatch[1].trim()) ? sumMatch[1].trim() : null;
  if (capturedSummary) {
    console.log(TAG, `[阶段总结] 第 ${messageId} 楼捕获阶段纪事存档（${capturedSummary.length} 字）`);
  }

  const p = parseStatusBlock(text);
  p.swipeId = (opt && opt.swipeId) ?? 0;
  
  try { await reconcileNadeLedger(`第 ${messageId} 楼前`); } catch (e) { console.warn(TAG, '[纳戒对账] 失败（已吞掉）：', msgOf(e)); }
  if (!p.found) {
    console.log(TAG, `[状态条] 第 ${messageId} 楼没有状态条（<Status_block>／<status>／<StatusBlock> 都没找到），启动容错保底时钟推进`);
    try { await ensureInit(`第 ${messageId} 楼前·容错`); } catch (e) {}
    try {
      const sdNow = readStatData() || {};
      const pin = (sdNow[FLOOR_PIN] && typeof sdNow[FLOOR_PIN] === 'object') ? sdNow[FLOOR_PIN] : null;
      const floorStg = stageOfFloor(messageId, pin ? pin.shift : 0);

      const storedStage = Number(sdNow.段位);
      const curStage = Number.isFinite(storedStage) && storedStage >= 1 ? Math.min(16, Math.round(storedStage)) : Math.max(1, Math.min(2, floorStg || 1));
      /* 2026-10-08（gpt 04 号④）：这一支**不再回写日期**。
         旧写法 patch.仙盟历 = SEG_TIME[curStage-1] —— 段位变就把日历顶到该段的章节时点，
         等于「楼数／段位决定当前日期」，正是 gpt C6 禁止的。日期由「历基准 ＋ 全程累计」导出，
         本支只落段位与阶段总结 ⇒ **缺状态栏时日期保留不动**（gpt 的验收项之一）。 */
      const patch = {
        段位: curStage
      };
      if (capturedSummary) {
        const gS = freeFieldGate('阶段总结', capturedSummary, sdNow);
        if (gS.ok) {
          patch.阶段总结 = capturedSummary;
          const sS = freeFieldSuspect('阶段总结', capturedSummary, sdNow);
          if (sS.suspect) {
            const 旧项 = ((patch.自由字段待核 || {}).项) || [];
            patch.自由字段待核 = { 楼: Number(messageId), 项: 旧项.concat([{ 字段: '阶段总结', 值摘: String(capturedSummary).slice(0, 60), 因由: sS.因由, 分句: sS.分句 }]) };
            console.warn(TAG, `⚠️ [自由字段·待核] 第 ${messageId} 楼「阶段总结」提到战事、时点尚早 —— 记待核（**不拦**）`);
          }
        } else {
          console.warn(TAG, `⛔ [自由字段闸] 第 ${messageId} 楼「阶段总结」被拒（保留旧值）：${gS.因由}`);
          patch.自由字段闸 = { 楼: Number(messageId), 项: [{ 字段: '阶段总结', 被拒值: String(capturedSummary).slice(0, 60), 事件: gS.事件, 因由: gS.因由 }] };
        }
        patch.结算待办 = 0;
        patch.总结待办 = 0;
      }
      const result = await writeStat(patch, `第 ${messageId} 楼容错保底推进${capturedSummary ? '（含阶段总结）' : ''}`);
      if (!result || result.ok !== true) throw Error((result && result.why) || '容错提交失败');
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
  /* 2026-10-08（gpt 17 号 §3）：自由文本字段过一致性闸 —— 未到的固定世界事件不许被写成"正在发生"，
     被拒的值不写盘（保留上一轮的可信值），只落后台诊断。 */
  const sdGate = readStatData() || {};
  const 自由字段闸 = [];
  const 自由字段待核 = [];
  let 自由字段闸有拒 = false;
  for (const k of DISPLAY_FIELDS) {
    if (p.fields[k] === undefined) continue;
    if (p.fields[k] === '') { blanks.push(k); continue; }
    const g = freeFieldGate(k, p.fields[k], sdGate);
    if (!g.ok) {
      自由字段闸有拒 = true;
      自由字段闸.push({ 字段: k, 被拒值: String(p.fields[k]).slice(0, 60), 事件: g.事件, 因由: g.因由 });
      console.warn(TAG, `⛔ [自由字段闸] 第 ${messageId} 楼「${k}」被拒（保留旧值）：${g.因由}｜原值「${String(p.fields[k]).slice(0, 40)}」`);
      continue;
    }
    /* 主人令·选 C：明确宣告才拦；**泛指战事不拦，只记账待核** */
    const s = freeFieldSuspect(k, p.fields[k], sdGate);
    if (s.suspect) 自由字段待核.push({ 字段: k, 值摘: String(p.fields[k]).slice(0, 60), 因由: s.因由, 分句: s.分句 });
    patch[k] = p.fields[k];
  }
  if (自由字段闸.length) {
    patch.自由字段闸 = { 楼: Number(messageId), 项: 自由字段闸 };
    try { toast('warning', '本楼有 ' + 自由字段闸.length + ' 个自由字段写了"尚未到时的世界事件"，已按未发生处理（保留上一轮值）：' + 自由字段闸.map((x) => x.字段).join('、'), 12000); } catch (e) { /* 忽略 */ }
  } else {
    patch.自由字段闸 = null;
  }
  if (自由字段待核.length) {
    patch.自由字段待核 = { 楼: Number(messageId), 项: 自由字段待核 };
    console.warn(TAG, `⚠️ [自由字段·待核] 第 ${messageId} 楼有 ${自由字段待核.length} 项泛指战事（**不拦，只记账**）：` + 自由字段待核.map((x) => x.字段).join('、'));
    try { toast('info', '本楼有 ' + 自由字段待核.length + ' 个自由字段提到战事、但时点尚早 —— 已记入「待核」台账（未拒写）：' + 自由字段待核.map((x) => x.字段).join('、'), 10000); } catch (e) { /* 忽略 */ }
  } else {
    patch.自由字段待核 = null;
  }
  if (blanks.length) console.log(TAG, `[状态条] 第 ${messageId} 楼这些字段是空值，保留旧值：${blanks.join('、')}`);
  /* ①c 段位：以楼层为保底下限，支持事件提前推进，沉浸场景自动驻留等待，每 15 楼/换段触发总结存档 */
  {
    const sdNow = readStatData() || {};

    if (capturedSummary) {
      const gS2 = freeFieldGate('阶段总结', capturedSummary, sdNow);
      if (gS2.ok) {
        patch.阶段总结 = capturedSummary;
        const sS2 = freeFieldSuspect('阶段总结', capturedSummary, sdNow);
        if (sS2.suspect) {
          const 旧项2 = ((patch.自由字段待核 || {}).项) || [];
          patch.自由字段待核 = { 楼: Number(messageId), 项: 旧项2.concat([{ 字段: '阶段总结', 值摘: String(capturedSummary).slice(0, 60), 因由: sS2.因由, 分句: sS2.分句 }]) };
          console.warn(TAG, `⚠️ [自由字段·待核] 第 ${messageId} 楼「阶段总结」提到战事、时点尚早 —— 记待核（**不拦**）`);
        }
        console.log(TAG, `[阶段总结] 第 ${messageId} 楼成功捕获阶段纪事存档（${capturedSummary.length} 字），已持久化进账本并清除待办`);
      } else {
        console.warn(TAG, `⛔ [自由字段闸] 第 ${messageId} 楼「阶段总结」被拒（保留上一份可信总结）：${gS2.因由}`);
        patch.自由字段闸 = Object.assign({ 楼: Number(messageId) }, patch.自由字段闸 || {}, {
          项: ((patch.自由字段闸 && patch.自由字段闸.项) || []).concat([{ 字段: '阶段总结', 被拒值: String(capturedSummary).slice(0, 60), 事件: gS2.事件, 因由: gS2.因由 }]),
        });
      }
      patch.结算待办 = 0;
      patch.总结待办 = 0;
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
    
    /* 2026-10-08（gpt 04 号①）：**先校验、再参与推进**。
       旧写法把 <实际发生> 的原始申报直接并进 knownAhead 再交给 checkFastForwardStage，
       于是「本楼正文根本没有依据」的申报也能把段位顶上去（gpt 复现：正文只写「庭院平静」、
       状态栏乱报「天溪城兽潮」，闸门丢弃了申报、known 仍 false，段位却 6→7）。
       现在只有**通过同一把尺子（validateAnchors）**的锚点才参与跳段，且结果落在 patch 上供记账复用。 */
    const plannedBasis = resolveCalendarBasis(sdNow);
    const projectedAdvance = nextAcc(sdNow, messageId, parseLishi(patch.历时), XSD_CALENDAR.hasTransit(patch.历时, text));
    const clockState = Object.assign({}, sdNow, { 仙盟历: monthsToYm(plannedBasis.basis + projectedAdvance.acc) });
    const 本轮校验 = validateAnchors(Array.isArray(p && p.里程碑) ? p.里程碑 : [], stripStatusBlock(text), messageId, sdNow.known || {}, Array.isArray(p && p.破处) ? p.破处 : [], clockState);
    p.本轮已验证锚点 = 本轮校验.good;
    const knownAhead = eligibleKnown(sdNow.known || {}, clockState);
    for (const f of 本轮校验.good) knownAhead[f] = true;
    const ffStg = checkFastForwardStage(knownAhead, floorStg);
    const stg = Math.max(floorStg, ffStg);

    if (stg >= 1) {
      
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
      const curTotalM = plannedBasis.basis + projectedAdvance.acc;
      for (let i = 0; i < SEG_TIME.length; i++) {
        if (curTotalM >= ymToMonths(SEG_TIME[i]) - 1e-6) want = Math.max(want, i + 1);
      }

      
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
      want = Math.min(want, cur + 1);
  /* gpt P1-6：**本段楼数**这只计数器以前只读不维护 ⇒ 改成每楼真的加、同楼重绘不重复加、
     满 3 楼升一段并归零；窗口起点与计数器一起落盘。 */
  let wf = Number(sdNow.窗口起点) || 0;
  if (wf && (wf < 1 || wf > messageId)) {
    console.warn(TAG, '[窗口] 第 ' + messageId + ' 楼窗口起点异常（' + sdNow.窗口起点 + '）⇒ 复位');
    wf = 0;
  }
  const sameFloor = Number(sdNow.最后处理楼号) === Number(messageId);
  let segFloors = Number(sdNow.本段楼数);
  if (!isFinite(segFloors) || segFloors < 0) segFloors = 0;
  if (want > cur) {
    if (!wf) { wf = messageId; segFloors = 0; }
    else if (!sameFloor) { segFloors += 1; }
    if (segFloors >= 3) { cur += 1; wf = (cur < want) ? messageId : 0; segFloors = 0; }
  } else { wf = 0; segFloors = 0; }
  patch.本段楼数 = segFloors;
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
      
      
      const basisResult = plannedBasis;
      const basis = basisResult.basis;
      if (basisResult.initialTime !== null) patch.初始时点 = basisResult.initialTime;
      if (basisResult.saveBasis) patch.历基准 = basis;
      if (basisResult.logOpening) {
        const idNow = String(sdNow.身份 || '');
        const basisOk = basisResult.source !== 'default';
        console.log(TAG, '[时间基准] 第 ' + messageId + ' 楼：' + (idNow || '（未登记身份）') + ' ⇒ 基准 ' + (basisOk ? fmtXianmeng(monthsToYm(basis)) : '1578 年 · 初三') + '（来源：账上开场时点，不读正文）');
      }
      const curBaseM = basis;
      

      // 若同楼发生重绘/修改，基于本楼原始基准重新累计，防止重复叠加
      
      /* gpt P1-2/P1-4/P1-5/P1-7：推进逻辑抽成纯函数 nextAcc（见文件上方），此处只落盘 */
      const stepM = parseLishi(patch.历时);
      const hasTransit = XSD_CALENDAR.hasTransit(patch.历时, text);
      const accR = projectedAdvance;
      const acc = accR.acc;
      const adv = accR.adv;
      patch.历时累计 = acc;          /* P1-5：同楼撤销后的值也落盘 */
      patch.最后处理楼号 = Number(messageId);
      patch.本楼历时加速 = adv;
      /* 2026-10-08（gpt 17 号 §5-4）：超限整笔拒绝时，留下一笔"待确认"账 —— 后台可查、玩家可改，
         下一轮不会因为"本轮记 0"就把申报的那段时间当成没发生过。 */
      if (accR.rejected) {
        patch.历时待确认 = { 楼: Number(messageId), 申报月: accR.raw, 上限月: accR.capM, 原因: '单笔超过上限，整笔未计入（走合法转场或 GM 确认）' };
        try { toast('warning', '本楼申报的历时（' + accR.raw + ' 月）超过单笔上限（' + accR.capM + ' 月），已整笔未计入；要推进请用明写的时间流逝或 GM 面板确认。', 12000); } catch (e) { /* 忽略 */ }
      } else {
        patch.历时待确认 = null;     /* 墓碑：本轮没有待确认项就清掉上一笔 */
      }
      patch.仙盟历 = monthsToYm(curBaseM + acc);
      
      const dayOfMonth = XSD_CALENDAR.dayOfMonth(curBaseM + acc);
      patch.仙盟历文 = fmtXianmengDay(patch.仙盟历, dayOfMonth);
      console.log(TAG, `[段位] 第 ${messageId} 楼 ⇒ 第 ${patch.段位 || stg} 段（楼下限 ${stg}）${pin ? `（时间轴已平移 ${pin.shift} 楼）` : ''}｜历时「${patch.历时 || '—'}」⇒ +${adv}月（累计 ${acc}月）｜仙盟历 ${patch.仙盟历文}（${patch.仙盟历}）`);
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
    const result = await writeStat(patch, `第 ${messageId} 楼状态条（展示栏）`);
    if (!result || result.ok !== true) throw Error((result && result.why) || '展示栏提交失败');
  } else {
    console.log(TAG, `[状态条] 第 ${messageId} 楼没解析到任何可写的展示栏字段`);
  }
  if (p.未识别.length) console.warn(TAG, `[状态条] 第 ${messageId} 楼有没归进面板的标签：${p.未识别.join('、')}`);

  // ② 身份／阵营：只告警，绝不覆盖
  warnIdentityMismatch(p, messageId);

  // ③ 进度一致性校验（只告警，不写变量）
  checkProgressConsistency(p, messageId);

  //      所以要把正文一起传进去 —— 报成形却漏标时，靠正文硬词兜底挽救。
  await applyMilestones(p, messageId, text);

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


  return { applyStatusToVars, warnIdentityMismatch, findDeclaredFaction, checkProgressConsistency };
}
/* XSD_STATUS_APPLICATION_CORE_END */
/** 原共享作用域名称的兼容适配；函数依赖延迟解析，避免后置模块初始化时序变化。 */
const XSD_STATUS_DEPS = {
  eligibleKnown: (...args) => eligibleKnown(...args),
  console,
  TAG,
  parseStatusBlock: (...args) => parseStatusBlock(...args),
  reconcileNadeLedger: (...args) => reconcileNadeLedger(...args),
  msgOf: (...args) => msgOf(...args),
  ensureInit: (...args) => ensureInit(...args),
  readStatData: (...args) => readStatData(...args),
  FLOOR_PIN,
  stageOfFloor: (...args) => stageOfFloor(...args),
  freeFieldGate: (...args) => freeFieldGate(...args),
  freeFieldSuspect: (...args) => freeFieldSuspect(...args),
  writeStat: (...args) => writeStat(...args),
  DISPLAY_FIELDS,
  toast: (...args) => toast(...args),
  messageText: (...args) => messageText(...args),
  detectInheritance: (...args) => detectInheritance(...args),
  applyInheritedArchive: (...args) => applyInheritedArchive(...args),
  validateAnchors: (...args) => validateAnchors(...args),
  stripStatusBlock: (...args) => stripStatusBlock(...args),
  checkFastForwardStage: (...args) => checkFastForwardStage(...args),
  parseLishi: (...args) => parseLishi(...args),
  ymToMonths: (...args) => ymToMonths(...args),
  SEG_TIME,
  isSceneLocked: (...args) => isSceneLocked(...args),
  resolveCalendarBasis: (...args) => resolveCalendarBasis(...args),
  fmtXianmeng: (...args) => fmtXianmeng(...args),
  monthsToYm: (...args) => monthsToYm(...args),
  XSD_CALENDAR,
  nextAcc: (...args) => nextAcc(...args),
  fmtXianmengDay: (...args) => fmtXianmengDay(...args),
  CAST_FIELD,
  applyMilestones: (...args) => applyMilestones(...args),
  window: typeof window !== 'undefined' ? window : undefined,
  readIdentity: (...args) => readIdentity(...args),
  IDENTITY_NAMES,
  readFaction: (...args) => readFaction(...args),
  readKnown: (...args) => readKnown(...args),
  ALL_FIELDS,
};
const XSD_STATUS_APPLICATION = createXsdStatusApplication(XSD_STATUS_DEPS);
async function applyStatusToVars(text, messageId, opt) { return XSD_STATUS_APPLICATION.applyStatusToVars(text, messageId, opt); }
function warnIdentityMismatch(p, messageId) { return XSD_STATUS_APPLICATION.warnIdentityMismatch(p, messageId); }
function findDeclaredFaction(raw) { return XSD_STATUS_APPLICATION.findDeclaredFaction(raw); }
function checkProgressConsistency(p, messageId) { return XSD_STATUS_APPLICATION.checkProgressConsistency(p, messageId); }
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

/* XSD_MESSAGE_READER_CORE_BEGIN */
/** 只读消息入口：不写消息、不写身份、不注册事件。 */
function createXsdMessageReader({ API, console, TAG, msgOf }) {
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

  return { messageText, isNewChat, latestMessageId };
}
/* XSD_MESSAGE_READER_CORE_END */
/* ═══════════════════════════════════════════════════════════
 * 九 · 身份：首楼解析 / 点击菜单 / 切开场白 / 刷新开场白
 * ═══════════════════════════════════════════════════════════ */

const XSD_MESSAGE_READER = createXsdMessageReader({ API, console, TAG, msgOf });
function messageText(messageId, withSwipes) { return XSD_MESSAGE_READER.messageText(messageId, withSwipes); }
function isNewChat() { return XSD_MESSAGE_READER.isNewChat(); }
function latestMessageId() { return XSD_MESSAGE_READER.latestMessageId(); }

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
/**
 * 身份菜单控制器：把菜单状态和事件闭包限制在单个实例内。
 * 创建实例不挂监听；实际挂载仍由 bindIdentityMenu / ensureMenuBound 启动。
 * 原提交、回读、去重与卸载逻辑保持原样，宿主依赖由 adapter 显式传入。
 */
function createXsdIdentityMenu(deps) {
  const {
    window, API, EVENTS, IDENTITY_NAMES, toast, msgOf, latestMessageId,
    pickIdentity, readLayer, L_CHAT, L_MSG, TAG, timepointModule,
    console, setTimeout, setInterval, clearInterval,
  } = deps;

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

const xdsTimepoint = (typeof timepointModule === 'function') ? timepointModule() : null;

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
        const listener = API.eventOn(EVENTS.CHAT_CHANGED, () => { runtime.epoch++; if (window.__xsdCorrection) window.__xsdCorrection.onChatChanged(); });
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


  return Object.freeze({
    xdsMenuHost,
    xdsMenuContext,
    xdsMenuChatKey,
    xdsMenuSetValue,
    xdsMenuVisible,
    xdsMenuComposer,
    xdsMenuCanSend,
    xdsMenuIntro,
    xdsMenuStatus,
    xdsMenuAssets,
    xdsMenuImageUrl,
    xdsMenuHydrate,
    xdsMenuSent,
    xdsMenuSubmit,
    bindIdentityMenu,
    ensureMenuBound,
  });
}
/** 菜单依赖接线。仅创建无监听实例，boot 继续调用原入口启动。 */
const xsdIdentityMenuController = createXsdIdentityMenu({
  window, API, EVENTS, IDENTITY_NAMES, toast, msgOf, latestMessageId,
  pickIdentity, readLayer, L_CHAT, L_MSG, TAG,
  timepointModule: typeof xdsTimepointModule === 'function' ? xdsTimepointModule : null,
  console, setTimeout, setInterval, clearInterval,
});

function xdsMenuHost() { return xsdIdentityMenuController.xdsMenuHost(...arguments); }
function xdsMenuContext() { return xsdIdentityMenuController.xdsMenuContext(...arguments); }
function xdsMenuChatKey() { return xsdIdentityMenuController.xdsMenuChatKey(...arguments); }
function xdsMenuSetValue(input, value) { return xsdIdentityMenuController.xdsMenuSetValue(...arguments); }
function xdsMenuVisible(el) { return xsdIdentityMenuController.xdsMenuVisible(...arguments); }
function xdsMenuComposer() { return xsdIdentityMenuController.xdsMenuComposer(...arguments); }
function xdsMenuCanSend(composer, allowEmpty = false) { return xsdIdentityMenuController.xdsMenuCanSend(...arguments); }
function xdsMenuIntro(form) { return xsdIdentityMenuController.xdsMenuIntro(...arguments); }
function xdsMenuStatus(box, message, error) { return xsdIdentityMenuController.xdsMenuStatus(...arguments); }
function xdsMenuAssets() { return xsdIdentityMenuController.xdsMenuAssets(...arguments); }
function xdsMenuImageUrl(img, maps) { return xsdIdentityMenuController.xdsMenuImageUrl(...arguments); }
function xdsMenuHydrate(root, runtime) { return xsdIdentityMenuController.xdsMenuHydrate(...arguments); }
function xdsMenuSent(message, baseline) { return xsdIdentityMenuController.xdsMenuSent(...arguments); }
function xdsMenuSubmit(form, button, runtime) { return xsdIdentityMenuController.xdsMenuSubmit(...arguments); }
function bindIdentityMenu() { return xsdIdentityMenuController.bindIdentityMenu(...arguments); }
function ensureMenuBound() { return xsdIdentityMenuController.ensureMenuBound(...arguments); }

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
const CMD_NAMES = [
  '撤销','已知', '锚点', '帮助', 'help', '解锁', '回锁', '身份', '设段', '继承', '读档', '刷新开场白', '刷新',
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
  /* 2026-10-08（gpt 04 号②）：**隐式检测一律不写盘**。
     旧写法把「低楼层（≤3）＋ 命中 2 个中后期里程碑」判成继承，玩家一句
     「本次开局不继承旧档，我还没遇到兽潮血战，也没有经历天溪城破」就命中 2 个 ⇒ 被判成继承第 11 段，
     写进 5 项 known 并把日期写到 1579 三月。特征检测不识别事实语义，不能据它改档。
     ⇒ 隐式分支降级为**只给建议**（打日志、不动盘）；只有**显式标识／显式命令**才算请求。 */
  const 隐式嫌疑 = !hasExplicitTag && (isEarlyFloor && (explicitStage > 1 || (hitMilestoneCount >= 2 && inferredStage >= 3)));
  if (隐式嫌疑) {
    console.warn(TAG, `⛔ [继承·只建议] 第 ${messageId} 楼疑似继承文案（命中 ${hitMilestoneCount} 个里程碑／显式段位号 ${explicitStage}），` +
      '但**没有显式继承标识** ⇒ 不改档、不写 known、不改日期。要真的继承请发「/继承 <段位>」或加【承接】／【大总结】一类标识。');
  }

  if (!hasExplicitTag) return null;

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
async function applyInheritedArchive(text, messageId, ports = {}) {
  const inh = detectInheritance(text, messageId);
  if (!inh) return { ok: false, why: '未识别到大总结或段位特征' };

  const targetStage = inh.targetStage;
  const summaryText = inh.summaryText;
  const shift = STAGE_BASE[targetStage - 1] - messageId;

  // 自动从总结文本中推导并恢复已解锁的历史锚点
  /* 2026-10-08（gpt 04 号②）：锚点恢复要过**事实语义 + 实证**两道，不能「关键词包含即置真」，
     更不能「按段位补」（旧写法 targetStage>=6 无条件补「已抵达天溪」）。
     ⇒ 关键词命中后仍过 anchorEvidenceIn（含否定窄闸）；落空的一律不写盘并记日志。 */
  const patchKnown = {};
  for (const f of ALL_FIELDS) {
    const kws = ANCHOR_KEYWORDS[f] || [];
    if (!kws.some(k => summaryText.includes(k))) continue;
    const ev = anchorEvidenceIn(summaryText, f);
    if (!ev.ok) {
      console.warn(TAG, `⛔ [继承·锚点] 第 ${messageId} 楼不恢复「${f}」：${ev.why}`);
      continue;
    }
    patchKnown[f] = true;
  }

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

  const r = await (ports.writeStat || writeStat)(patch, `识别大总结：继承至第 ${targetStage} 段`);
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
    const r = await writeStat({ [FLOOR_PIN]: { floor: messageId, shift }, 段位: n, 窗口起点: 0, 时点加速: 0, 结算待办: 0 }, `设段 ${n}`, true);
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
    /* /回锁 <名器名>（不带后缀）＝**整件退回**：把「<名器>成形」与四个阶段条一起退回。
       为什么要它：只退「成形」时面板仍会亮纹章 —— 判据里「任一阶段条为真」也算成形，
       而脚本在成形时会自动派发一阶段条（玩家反馈「这个关不了好像」就是这个）。 */
    if (p.cmd === '/回锁') {
      const baseRelic = String(p.arg).replace(/[「」\s]/g, '');
      if (baseRelic && ALL_FIELDS.includes(baseRelic + '成形')) {
        const targets = [baseRelic + '成形'];
        for (const cn of ['一', '二', '三', '四']) { const fx = baseRelic + cn + '阶段'; if (ALL_FIELDS.includes(fx)) targets.push(fx); }
        const patchKnown = {};
        for (const fx of targets) patchKnown[fx] = false;
        const rr = await writeStat({ known: patchKnown }, `整件退回 ${baseRelic}`, true);
        if (rr && rr.ok) {
          console.log(TAG, `↩ ${baseRelic} 整件已退回（${targets.length} 条）：${targets.join('、')} —— 下一回合生效`);
          toast('info', `${baseRelic} 整件已退回`, 8000);
        } else {
          console.warn(TAG, `整件退回失败：${(rr && rr.why) || '写入接口不可用'}`);
          toast('warning', `整件退回失败：${(rr && rr.why) || '写入接口不可用'}`, 8000);
        }
        setTimeout(() => dumpKnown('整件退回后'), 200);
        return true;
      }
    }

    const val = p.cmd === '/解锁';
    const r = await writeKnownField(p.arg, val);
    if (r.ok) {
      /* 记一笔「最近解锁」——供 /撤销 一键回退（玩家打错字时不必背字段名） */
      if (val) { try { await writeStat({ 最近解锁: p.arg }, '记录最近解锁'); } catch (e) { /* 记账失败不影响解锁 */ } }
      console.log(TAG, `✅ ${p.arg} = ${val}（via ${r.via}）—— 下一回合生效`);
      toast('info', `${p.arg} = ${val}`, 6000);
      setTimeout(() => dumpKnown('写入后'), 200);
    } else {
      console.warn(TAG, `❌ 写入失败：${r.why}`);
      toast('warning', `写入失败：${r.why}`, 8000);
    }
    return true;
  }

  if (p.cmd === '/撤销') {
    const sdU = readStatData() || {};
    const lastU = String(sdU.最近解锁 || '').trim();
    if (!lastU || !ALL_FIELDS.includes(lastU)) {
      console.log(TAG, '没有可撤销的解锁（「最近解锁」是空的）—— 先用 /已知 看已经翻了哪些，再 /回锁 <字段>');
      toast('warning', '没有可撤销的解锁（可用 /已知 查看）', 7000);
      return true;
    }
    const rU = await writeKnownField(lastU, false);
    if (rU.ok) {
      try { await writeStat({ 最近解锁: '' }, '清空最近解锁'); } catch (e) { /* 忽略 */ }
      console.log(TAG, '↩ 已撤销：' + lastU + ' 退回未解锁（下一回合生效）');
      toast('info', '已撤销：' + lastU, 8000);
      setTimeout(() => dumpKnown('撤销后'), 200);
    } else {
      console.warn(TAG, '撤销失败：' + rU.why);
      toast('warning', '撤销失败：' + rU.why, 8000);
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
    /* 2026-10-08（gpt 03 号：anchor 3 红）：**取消 second-signal 旁路**。
       旧写法是「命中词全是地点名 且 正文里有事件动词」就照提议 —— 于是
         · 「在幽寂谷里胁迫叶红缨屈从」把「进入幽寂谷／离开幽寂谷」一起提了出来；
         · 「在葬魔渊边失足坠渊」把「进入葬魔渊」也提了出来；
       地点名 + 任意事件动词，并不证明**这个地点类锚点**本身发生。
       现在：命中词全是地点名 ⇒ 一律不提议；复合词（「进入幽寂谷」「驰援天溪」）不是裸地点名，
       自己能命中就照旧提议。 */
    const onlyLocation = hitWords.every((k) => ANCHOR_LOCATION_ONLY.includes(k));
    if (onlyLocation) {
      skips.push(`${f}（命中词全是地点名 ${hitWords.join('、')} ⇒ 不提议：地点名不等于该事件发生）`);
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
    
    console.log(TAG, `[旁证·关键词] ${f} 的触发词在正文里出现了 —— 若模型没在 <实际发生> 里记它，`
      + `说明漏记了（可手工 /解锁 ${f}）。`);
  }
  return [...hits];
}

/** 身份：gpt。每次消息建立隔离草稿；成功规划后仅一次调用既有统一写入口。 */
function createXsdStatusOperation(ports) {
  const { readStatData, writeStat, readLayer, service, chatId, guard, clone, merge,
    inventoryDeps, initializerDeps, milestoneDeps, statusDeps,
    createInventory, createInitializer, createMilestones, createApplication, L_CHAT } = ports;
  return Object.freeze({ async run(text, messageId, options = {}) {
    guard();
    let draft = clone(readStatData() || {}), patch = {}, writes = 0;
    const notices = [];
    const virtualWrite = async (value, why, manual = false) => {
      guard();
      if (manual) throw Error('自动消息规划不允许创建人工覆盖');
      const protectedValue = service.protect(draft, value, chatId);
      patch = merge(patch, protectedValue);
      draft = service.effective(merge(draft, protectedValue));
      writes++;
      return { ok: true, pending: true, via: '隔离草稿·等待统一提交' };
    };
    const read = () => { guard(); return clone(draft); };
    const planningConsole = Object.fromEntries(['log','warn','error','info'].map(level => [level, (...args) => {
      const logger = statusDeps.console[level] || statusDeps.console.log;
      logger.call(statusDeps.console, '[事务规划]', ...args);
    }]));
    const shared = { readStatData: read, writeStat: virtualWrite, console: planningConsole,
      readKnown: () => read().known || {}, readIdentity: () => read().身份 || null,
      readFaction: () => read().阵营 || null };
    const inventory = createInventory({ ...inventoryDeps, ...shared });
    const initializer = createInitializer({ ...initializerDeps, ...shared });
    const milestones = createMilestones({ ...milestoneDeps, ...shared });
    const application = createApplication({ ...statusDeps, ...shared,
      reconcileNadeLedger: inventory.reconcileNadeLedger,
      ensureInit: initializer.ensureInit,
      applyMilestones: milestones.applyMilestones,
      applyInheritedArchive: (value, id) => statusDeps.applyInheritedArchive(value, id, { writeStat: virtualWrite }),
      window: undefined,
      toast: (...args) => notices.push(args),
    });
    const parsed = await application.applyStatusToVars(text, messageId, options);
    guard();
    if (!writes) return { ok: false, why: '没有可提交的状态规划', retryable: true };
    patch.最后处理楼号 = Number(messageId);
    const mode = parsed && parsed.found ? 'status' : 'fallback';
    if (mode === 'status' && (!Number.isFinite(Number(patch.仙盟历)) || Number(patch.仙盟历) <= 0 || !patch.仙盟历文)) {
      throw Error('规划日历无效，请先校正时间基准');
    }
    guard();
    const result = await writeStat(patch, '第 ' + messageId + ' 楼完整状态事务', false, guard);
    guard();
    if (!result || result.ok !== true) return { ok: false, why: result && result.why || '统一提交失败', retryable: true };
    // service.write 已双层逐路径验；此处再核本次完整规划，并按提交时最新人工控制解释预期。
    const chat = await readLayer(L_CHAT);
    guard();
    const message = await readLayer({ type: 'message', message_id: Number(messageId) });
    guard();
    if (!chat || !message || !chat.stat_data || !message.stat_data) return { ok: false, why: '提交后双层回读不可用', retryable: true };
    const expected = service.protect(chat.stat_data, patch, chatId);
    const matches = (actual, part) => Object.keys(part).every(key => {
      const value = part[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) return actual && actual[key] && matches(actual[key], value);
      return actual && service.eq(actual[key], value);
    });
    if (!matches(chat.stat_data, expected) || !matches(message.stat_data, expected)) {
      return { ok: false, why: '完整状态事务双层回读不一致', retryable: true, partial: true };
    }
    for (const args of notices) { try { statusDeps.toast(...args); } catch (_) {} }
    return { ok: true, mesid: Number(messageId), mode, parsed, plannedWrites: writes, commits: 1 };
  }});
}
/** 身份：gpt。单实例消息调度队列：上下文、正文/分支签名和成功去重统一管理。 */
function createXsdMessageTransactions({ contextKey, latestMessageId, messageSignature }) {
  let epoch = 0, disposed = false;
  const seenMessages = new Set(), pending = new Map(), tails = new Map();
  function capture(messageId, fingerprint) {
    return Object.freeze({ chatKey: String(contextKey()), messageId: Number(messageId),
      signature: messageSignature(Number(messageId)), fingerprint, epoch });
  }
  function current(token) {
    if (disposed || token.epoch !== epoch || token.chatKey !== String(contextKey())) return false;
    const latest = latestMessageId();
    if (latest !== null && Number(latest) !== token.messageId) return false;
    const signature = messageSignature(token.messageId);
    return token.signature === null || signature === token.signature;
  }
  function guard(token) { if (!current(token)) throw Error('聊天、最新楼或消息分支已变化，旧任务已中止'); }
  function run(token, key, task) {
    if (pending.has(key)) return pending.get(key);
    if (seenMessages.has(key)) return Promise.resolve({ ok: true, duplicate: true, mesid: token.messageId });
    const lane = token.chatKey;
    const previous = tails.get(lane) || Promise.resolve();
    const promise = previous.catch(() => {}).then(async () => {
      guard(token);
      const result = await task(() => guard(token));
      guard(token);
      if (result && result.ok === true) {
        seenMessages.add(key);
        if (seenMessages.size > 300) seenMessages.delete(seenMessages.values().next().value);
      }
      return result || { ok: false, why: '处理未返回提交结果', retryable: true };
    }).catch(error => ({ ok: false, why: error && error.message || String(error), retryable: true }))
      .finally(() => { if (pending.get(key) === promise) pending.delete(key); if (tails.get(lane) === promise) tails.delete(lane); });
    pending.set(key, promise); tails.set(lane, promise);
    return promise;
  }
  function reset() { epoch++; seenMessages.clear(); }
  function dispose() { disposed = true; reset(); }
  return Object.freeze({ capture, current, guard, run, reset, dispose, seenMessages, pending,
    get epoch() { return epoch; }, get disposed() { return disposed; } });
}
/** 身份：gpt。总调度实例：依赖接线、前置、事件生命周期和状态事务。 */
function createXsdDispatcher(deps) {
  const { window, API, EVENTS, console, TAG, VERSION, ALL_FIELDS,
    contextKey, latestMessageId, messageText, hashText, createTransactions, runStatus,
    ensureInit, syncIdentityFromFirstMes, reconcileNadeLedger, ensureMenuBound,
    handleUserCommand, swallowCommandMessage, detectInheritance, applyInheritedArchive,
    proposeAnchors, checkOutputContract, readLayer, readStatData, writeStat, L_CHAT, service,
    setTimeout, clearTimeout, requestCancel, toast } = deps;
  const timers = new Set(), cleanups = [];
  let started = false, preflightDone = '', preflightPending = null;
  const messageSignature = id => {
    try {
      if (!API.getChatMessages) return null;
      const raw = API.getChatMessages(id, { include_swipes: true });
      const message = Array.isArray(raw) ? raw[0] : raw;
      if (!message) return null;
      const text = message.message ?? message.mes;
      return JSON.stringify([message.swipe_id ?? 0, text === undefined ? null : hashText(String(text))]);
    } catch (_) { return null; }
  };
  const transactions = createTransactions({ contextKey, latestMessageId, messageSignature });
  const delayed = (fn, delay) => {
    const handle = setTimeout(() => { timers.delete(handle); if (!transactions.disposed) Promise.resolve().then(fn).catch(error => console.warn(TAG, '[延迟调度]', error.message)); }, delay);
    timers.add(handle); return handle;
  };
  async function boot(reason) {
    const key = String(contextKey()), epoch = transactions.epoch;
    const guard = () => { if (transactions.disposed || epoch !== transactions.epoch || key !== String(contextKey())) throw Error('启动期间聊天已变化'); };
    try {
      guard(); await ensureInit(reason); guard();
      await syncIdentityFromFirstMes(reason); guard();
      await reconcileNadeLedger('启动·' + reason); guard();
      ensureMenuBound();
      return { ok: true };
    } catch (error) { console.warn(TAG, '[启动·' + reason + ']', error.message); return { ok: false, why: error.message }; }
  }
  async function onUserMessageSent(id) {
    const token = transactions.capture(id, 'user');
    try {
      transactions.guard(token);
      const text = messageText(id);
      if (text === null) return { ok: false, why: '读不到玩家消息' };
      const handled = await handleUserCommand(text, id);
      transactions.guard(token);
      if (handled) { swallowCommandMessage(id); return { ok: true, command: true }; }
      const inherited = detectInheritance(text, id);
      if (inherited && inherited.isInherited) {
        const result = await applyInheritedArchive(text, id);
        transactions.guard(token); return result;
      }
      return { ok: true, command: false };
    } catch (error) { console.warn(TAG, '[玩家调度]', error.message); return { ok: false, why: error.message }; }
  }
  function onAiMessageReceived(id, options = {}) {
    const n = Number(id), source = options.source || '事件';
    if (!Number.isInteger(n) || n < 0) return Promise.resolve({ ok: false, why: 'bad mesid' });
    if (n === 0) return Promise.resolve({ ok: true, skipped: 'opening', mesid: n });
    const latest = latestMessageId();
    if (latest !== null && Number(latest) !== n) return Promise.resolve({ ok: true, skipped: 'not-latest', mesid: n });
    const text = typeof options.rawText === 'string' && options.rawText ? options.rawText : messageText(n);
    if (!text) return Promise.resolve({ ok: false, why: '读不到正文', retryable: true, mesid: n });
    const token = transactions.capture(n, hashText(text));
    if (typeof options.rawText === 'string' && token.signature) {
      const authoritativeHash = JSON.parse(token.signature)[1];
      if (authoritativeHash !== null && authoritativeHash !== hashText(text)) return Promise.resolve({ ok: false, why: '面板正文已过期，请按当前分支重试', stale: true, retryable: true, mesid: n });
    }
    const key = JSON.stringify([token.chatKey, n, token.signature, token.fingerprint, token.epoch]);
    return transactions.run(token, key, async guard => {
      guard(); proposeAnchors(text, n); checkOutputContract(text, n);
      const result = await runStatus(text, n, { swipeId: (() => {
        try { return token.signature ? JSON.parse(token.signature)[0] : 0; } catch (_) { return 0; }
      })() }, guard);
      guard();
      if (result && result.ok) {
        try { const fill = window.__xsdFillPanel || window.parent && window.parent.__xsdFillPanel; if (typeof fill === 'function') fill(n, text); } catch (_) {}
        try { const refresh = window.__xsdRefreshRelics || window.parent && window.parent.__xsdRefreshRelics; if (typeof refresh === 'function') refresh(); } catch (_) {}
      }
      return { ...result, mesid: n, source };
    });
  }
  function xsdStateTick(id, rawText, source) { return onAiMessageReceived(id, { rawText, source: source || '渲染触发' }); }
  function schema(layer) {
    const state = layer && layer.stat_data;
    return state && typeof state.身份 === 'string' && state.身份 && typeof state.阵营 === 'string' && state.阵营 && state.known
      && ALL_FIELDS.every(field => typeof state.known[field] === 'boolean');
  }
  function preflightFirstGeneration(id) {
    const token = transactions.capture(id, 'preflight'), key = JSON.stringify([token.chatKey, token.epoch]);
    if (preflightDone === key) return Promise.resolve({ ok: true, why: '已初始化' });
    if (preflightPending && preflightPending.key === key) return preflightPending.promise;
    const promise = (async () => {
      try {
        transactions.guard(token);
        await ensureInit('首次生成前置'); transactions.guard(token);
        await syncIdentityFromFirstMes('首次生成前置'); transactions.guard(token);
        let chat = await readLayer(L_CHAT); transactions.guard(token);
        let message = await readLayer({ type: 'message', message_id: Number(id) }); transactions.guard(token);
        if (!schema(chat) || !schema(message)) {
          // 仅缺结构的一层可以从已完整的层恢复；两个完整层冲突交人工处理。
          const valid = schema(chat) ? chat.stat_data : schema(message) ? message.stat_data : null;
          if (!valid) throw Error('首次生成初始化没有完整可恢复层');
          transactions.guard(token);
          const repaired = await writeStat({ ...readStatData(), 身份: valid.身份, 阵营: valid.阵营, known: service.clone(valid.known) },
            '首次生成单层结构恢复', false, () => transactions.guard(token));
          transactions.guard(token);
          if (!repaired || !repaired.ok) throw Error('首次生成单层恢复提交失败');
          chat = await readLayer(L_CHAT); transactions.guard(token);
          message = await readLayer({ type: 'message', message_id: Number(id) }); transactions.guard(token);
        }
        if (!schema(chat) || !schema(message) || !service.eq(chat.stat_data.known, message.stat_data.known)
          || chat.stat_data.身份 !== message.stat_data.身份 || chat.stat_data.阵营 !== message.stat_data.阵营) throw Error('首次生成初始化双层读回不完整或不一致');
        preflightDone = key;
        return { ok: true, readback: true };
      } catch (error) {
        if (!transactions.current(token)) return { ok: false, why: error.message, stale: true, cancelled: false };
        let cancel = { requested: false, confirmed: false };
        try { cancel = await requestCancel(); } catch (_) {}
        console.warn(TAG, '[首次生成前置] ' + error.message + (cancel.requested ? '；已请求停止生成' : '；没有可用取消接口，未确认停止生成'));
        try { toast('warning', '初始化未通过，请修复后重试：' + error.message, 12000); } catch (_) {}
        return { ok: false, why: error.message, cancelRequested: cancel.requested, cancelled: cancel.confirmed, retryable: true };
      }
    })().finally(() => { if (preflightPending && preflightPending.promise === promise) preflightPending = null; });
    preflightPending = { key, promise }; return promise;
  }
  async function preflightThenCommand(id) {
    const result = await preflightFirstGeneration(id);
    if (!result.ok) return result;
    return onUserMessageSent(id);
  }
  function onChatChanged() {
    transactions.reset(); preflightDone = ''; preflightPending = null;
    try { if (service) service.onChatChanged(); } catch (_) {}
    delayed(() => boot('换聊天'), 400);
  }
  function nativeEventSource() {
    for (const root of [window, (() => { try { return window.parent; } catch (_) { return null; } })(), (() => { try { return window.top; } catch (_) { return null; } })()]) {
      try { const ctx = root && root.SillyTavern && root.SillyTavern.getContext(); if (ctx && ctx.eventSource && typeof ctx.eventSource.on === 'function') return ctx.eventSource; } catch (_) {}
    }
    return null;
  }
  function listen(name, handler, native = false) {
    const event = EVENTS && EVENTS[name]; if (!event) return false;
    if (native) {
      const source = nativeEventSource();
      if (source) try {
        source.on(event, handler);
        cleanups.push(() => { if (typeof source.removeListener === 'function') source.removeListener(event, handler); else if (typeof source.off === 'function') source.off(event, handler); });
        return true;
      } catch (_) {}
    }
    if (!API.eventOn) return false;
    try {
      const handle = API.eventOn(event, handler);
      if (typeof handle === 'function') cleanups.push(handle);
      else if (handle && typeof handle.stop === 'function') cleanups.push(() => handle.stop());
      else if (API.eventRemoveListener) cleanups.push(() => API.eventRemoveListener(event, handler));
      return true;
    } catch (error) { console.warn(TAG, '[事件接线] ' + name, error.message); return false; }
  }
  function start() {
    if (started || transactions.disposed) return false;
    started = true;
    for (const root of [window, (() => { try { return window.parent; } catch (_) { return null; } })(), (() => { try { return window.top; } catch (_) { return null; } })()]) {
      try {
        if (!root) continue;
        const previous = root.__xsdDispatcher;
        if (previous && previous !== controller && typeof previous.dispose === 'function') previous.dispose();
        root.__xsdDispatcher = controller; root.__xsdStateTick = xsdStateTick; root.__xsdStateTickVersion = VERSION;
        cleanups.push(() => { if (root.__xsdDispatcher === controller) { delete root.__xsdDispatcher; if (root.__xsdStateTick === xsdStateTick) delete root.__xsdStateTick; } });
      } catch (_) {}
    }
    listen('MESSAGE_SENT', preflightThenCommand, true);
    listen('MESSAGE_RECEIVED', id => onAiMessageReceived(id));
    listen('CHARACTER_MESSAGE_RENDERED', id => onAiMessageReceived(id, { source: '事件·重渲染' }));
    listen('CHAT_CHANGED', onChatChanged);
    listen('CHAT_CREATED', onChatChanged);
    listen('MESSAGE_SWIPED', () => delayed(() => boot('滑开场白'), 400));
    try { ensureMenuBound(); } catch (_) {}
    try { window.addEventListener('pagehide', dispose); cleanups.push(() => window.removeEventListener('pagehide', dispose)); } catch (_) {}
    return true;
  }
  function dispose() {
    if (transactions.disposed) return;
    transactions.dispose(); preflightDone = ''; preflightPending = null;
    for (const timer of timers) clearTimeout(timer); timers.clear();
    for (const cleanup of cleanups.splice(0).reverse()) { try { cleanup(); } catch (_) {} }
  }
  const controller = Object.freeze({ start, dispose, boot, onUserMessageSent, onAiMessageReceived, xsdStateTick,
    preflightFirstGeneration, preflightThenCommand, onChatChanged, nativeEventSource, transactions,
    scheduleStart: check => delayed(() => { check(); return boot('启动'); }, 1500) });
  return controller;
}
/** 身份：gpt。生产装配入口；业务核只接受显式依赖。 */
async function requestXsdGenerationCancel() {
  const candidates = [];
  if (typeof API.stopGeneration === 'function') candidates.push([API, API.stopGeneration]);
  const helper = getGlobalOrParent('stopGeneration');
  if (typeof helper === 'function') candidates.push([window, helper]);
  for (const get of [() => window, () => window.parent, () => window.top]) {
    try {
      const root = get(), tavern = root && root.SillyTavern;
      if (tavern && typeof tavern.stopGeneration === 'function') candidates.push([tavern, tavern.stopGeneration]);
      const context = tavern && typeof tavern.getContext === 'function' && tavern.getContext();
      if (context && typeof context.stopGeneration === 'function') candidates.push([context, context.stopGeneration]);
    } catch (_) {}
  }
  for (const [owner, fn] of candidates) {
    try { const result = await fn.call(owner); if (result !== false) return { requested: true, confirmed: result === true }; } catch (_) {}
  }
  return { requested: false, confirmed: false };
}
function runXsdStatusOperation(text, id, options, guard) {
  const service = window.__xsdCorrection;
  if (!service) return Promise.resolve({ ok: false, why: '缺少二级纠错运行时，请重新构建卡片', retryable: true });
  guard();
  const operation = createXsdStatusOperation({
    readStatData, writeStat, readLayer, service, guard, chatId: service.capture(API).chatId,
    clone: service.clone, merge: service.merge, L_CHAT,
    inventoryDeps: XSD_INVENTORY_DEPS, initializerDeps: XSD_INITIALIZER_DEPS,
    milestoneDeps: XSD_MILESTONE_DEPS, statusDeps: XSD_STATUS_DEPS,
    createInventory: createXsdInventoryRules, createInitializer: createXsdInitializer,
    createMilestones: createXsdMilestoneApplication, createApplication: createXsdStatusApplication,
  });
  return operation.run(text, id, options);
}
const XSD_DISPATCHER = createXsdDispatcher({
  window, API, EVENTS, console, TAG, VERSION, ALL_FIELDS,
  contextKey: xdsMenuChatKey, latestMessageId, messageText, hashText,
  createTransactions: createXsdMessageTransactions, runStatus: runXsdStatusOperation,
  ensureInit, syncIdentityFromFirstMes, reconcileNadeLedger, ensureMenuBound,
  handleUserCommand, swallowCommandMessage, detectInheritance, applyInheritedArchive,
  proposeAnchors, checkOutputContract, readLayer, readStatData, writeStat, L_CHAT, service: window.__xsdCorrection,
  setTimeout, clearTimeout, requestCancel: requestXsdGenerationCancel, toast,
});
function boot(reason) { return XSD_DISPATCHER.boot(reason); }
function onUserMessageSent(id) { return XSD_DISPATCHER.onUserMessageSent(id); }
function onAiMessageReceived(id, options) { return XSD_DISPATCHER.onAiMessageReceived(id, options); }
function xsdStateTick(id, text, source) { return XSD_DISPATCHER.xsdStateTick(id, text, source); }
function preflightFirstGeneration(id) { return XSD_DISPATCHER.preflightFirstGeneration(id); }
XSD_DISPATCHER.start();
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
XSD_DISPATCHER.scheduleStart(() => {
  try {
    console.log(TAG, `── 启动自检 ${VERSION} ──（下面那行「[初始化·启动]」是本版新增的账本心跳：`
      + '看到「字段齐全」或「✅ 已落地」都算正常；看到「❌ 变量没写进去」就是账本没落地）');
  } catch (e) { /* 忽略 */ }
  xsdWho();
});

console.log(TAG, `${VERSION} 已加载。命令：/已知 · /锚点 · /解锁 <字段> · /回锁 <字段> · /身份 [名字] · /刷新开场白；`
  + '第 0 楼的身份菜单可点击；控制台可调 __xsdWho() / __xsdDump() / __xsdBoot()；'
  + '渲染触发入口 window.__xsdStateTick(mesid, rawText)；控制台调试：__xsdStateTick(1, "<Status_block>…</Status_block>")。');
