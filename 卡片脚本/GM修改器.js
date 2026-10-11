/* ══════════════════════════════════════════════════════════════════════
 * 《仙姝墮》· 后台 GM 修改器（卡内脚本 · 纯酒馆助手版）   v1.0   2026-09-27
 * ----------------------------------------------------------------------
 * 形态照抄外卡《大乾风华录 Ver2.0》的 `scripts/02_大乾风华录后台GM修改器.js`：
 *   一个可开关的浮动面板，绕过模型直接改「酒馆变量层」里的 stat_data，
 *   给玩家／作者一个「不合心意就手改」的逃生舱。
 *
 * 与参照卡的区别（刻意的，不是抄漏）：
 *   · 参照卡把「已习武功」按 8 字截断、只留 3 门，还硬编码 50 人名册；
 *     我们的 89 个 known 是**逐字对齐世界书闸门**的字段名，不能截断、不能改名，
 *     所以这里是**勾选框**而不是自由文本。
 *   · 参照卡只写 `{type:'chat'}`；我们按 `状态机.js` 的既有约定**双写**
 *     （消息层(#-1) ＋ 聊天层），否则会踩「消息层遮掉聊天层、闸门判 false」那个坑。
 *   · 参照卡不提供入口以外的开关方式；我们额外给 `window.__xsdGM()`。
 *
 * 面板能改什么：
 *   ① 89 个 known 布尔（勾选框；全部同源：模型在状态栏 <实际发生> 里记、脚本自动记账；这里供人工核对与手工修正）
 *   ② 身份（6 选 1 下拉 ＋ 一键写阵营）　③ 阵营（自由文本 ＋ 预设筹码）
 *   ④ 展示型字段 16 个：修为／地点／时间／在场／暗处／状态／名器／目标／局势／关系刻度
 *
 * 入口：
 *   · `window.__xsdGM()` ／ `window.parent.__xsdGM()` —— 开关面板（也在 window.GM 上）
 *   · 面板右上角「×」关闭；标题栏可拖动；面板下方有运行日志
 *
 * ⚠️ 运行环境：本脚本跑在酒馆助手的**脚本 iframe**（about:srcdoc）里。
 *    iframe 自己的 document 里没有主界面 ⇒ 挂面板必须走 `window.parent.document`。
 * ⚠️ 本脚本用到的酒馆助手接口**全部**做 `typeof` 保护，多窗口多路径探测：
 *    取不到就 `console.warn` ＋ 降级，**绝不在加载时抛错**（一个接口缺失不该让整张卡塌掉）。
 * ⚠️ 变量双写：`{type:'message', message_id:-1}`（最新一楼）与 `{type:'chat'}` 同时写。
 *    酒馆读变量表的顺序是 全局 ⊕ 初始 ⊕ 聊天层 ⊕ **消息层**（消息层最后 ⇒ 优先），
 *    只写聊天层会被消息层遮掉（闸门判 false、整条被剔除，实测踩过）。读时消息层优先。
 * ⚠️ 写回后**回读校验**并刷新面板；只有真读到自己刚写的值才算成功。
 * ⚠️ 本脚本**不改**状态机.js／状态栏面板.js／_build_card.js／_card_greetings.txt，
 *    也不依赖它们（只对齐字段名与双写约定）。
 * ⚠️ 本卡已完全拆掉旧版「外挂变量插件」那套结构化更新块：本脚本不认任何更新块标记，
 *    只认 stat_data 这一个变量命名空间 —— 变量表里其它键一律不碰。
 * ══════════════════════════════════════════════════════════════════════ */

(function (root) {
  'use strict';

  if (typeof window === 'undefined') return;

  /* ═══════════════════════════════════════════════════════════
   * 零 · 常量台账
   * ⚠️ 下面所有字段名／身份名都必须与世界书闸门、`_card_greetings.txt`
   *    的 `@@@ <名字>` 段落名、`状态机.js` 的台账**逐字一致**，不得改动。
   * ═══════════════════════════════════════════════════════════ */

  var TAG = '[仙姝堕·GM]';
  var VERSION = 'v1.0';

  /** 脚本标识（防止同一 iframe 里重复注入第二份面板） */
  var SCRIPT_ID = 'xshd-gm-editor';

  /** 锚点字段表（与状态机.js 的 FIELD_TABLE 逐字对齐，共 122 项；本表由 scratch/_sync_gm_table.mjs 生成） */
  var FIELD_TABLE = [
      {
          "name": "极乐引入手",
          "kind": "ai",
          "desc": "邪修洞府之变：拿到《极乐引》残篇"
      },
      {
          "name": "已抵达天溪",
          "kind": "ai",
          "desc": "仙盟南下驰援：一行抵达天溪城"
      },
      {
          "name": "进入幽寂谷",
          "kind": "ai",
          "desc": "幽寂谷秘境异动：一行进入幽寂谷"
      },
      {
          "name": "兽潮血战",
          "kind": "ai",
          "desc": "天溪城头的兽潮血战（与「天溪城兽潮」同段）"
      },
      {
          "name": "天溪城破",
          "kind": "ai",
          "desc": "天溪城破与沦陷：兽潮总攻、西南城破"
      },
      {
          "name": "灼酒流炎穴成形",
          "kind": "ai",
          "desc": "叶红缨 · 灼酒流炎穴成形（元阴初破）"
      },
      {
          "name": "九幽玄阴穴成形",
          "kind": "ai",
          "desc": "孤月 · 九幽玄阴脉的伴生异穴，元阴初破时成形（依据：【名器】九幽玄阴穴／【人物】孤月 秘密所在）"
      },
      {
          "name": "心魔茶璎乳成形",
          "kind": "ai",
          "desc": "闻观语 · 蜜汁化乳、双峰泌灵乳三者齐现即完全觉醒（依据：【设定】剧情发展简表「闻观语『心魔茶璎乳』显」）"
      },
      {
          "name": "般若菩提菊成形",
          "kind": "ai",
          "desc": "楚灵夜 · 于积云古寺显现（依据：【剧情】十三）"
      },
      {
          "name": "灵犀同心成形",
          "kind": "ai",
          "desc": "苏瑶／苏玲 · 姐妹共构的同心异体（依据：【剧情】五 听雪双姝登场）"
      },
      {
          "name": "北冥潮生穴成形",
          "kind": "ai",
          "desc": "雨霏柔 · 其本源气息可化帝鹏临霄阵与溟鲲吞天阵（依据：【设定】帝鹏临霄阵与溟鲲吞天阵）"
      },
      {
          "name": "玉虎噙香乳成形",
          "kind": "ai",
          "desc": "云织梦 · 本源白虎煞气与至纯元阴可化虎啸震岳阵与玉虎镇渊阵（依据：【设定】虎啸震岳阵与玉虎镇渊阵）"
      },
      {
          "name": "梅蕊穴成形",
          "kind": "ai",
          "desc": "花芷凝 · 她所怀的名器，被魂欢殿擒住占有之后（依据：【人物】花芷凝（2））"
      },
      {
          "name": "冰魄剑心穴成形",
          "kind": "ai",
          "desc": "苏倾寒 · 所怀名器（依据：【人物】苏倾寒）"
      },
      {
          "name": "清歌弦鸣穴成形",
          "kind": "ai",
          "desc": "慕容清歌 · 所怀名器（依据：【人物】慕容清歌）"
      },
      {
          "name": "流焰叠薪穴成形",
          "kind": "ai",
          "desc": "顾云舒 · 所怀名器（归属由主人 2026-09-30 当面指定；册内尚无其它出处）"
      },
      {
          "name": "凤凰羽花成形",
          "kind": "ai",
          "desc": "陆烬颜 · 名器持有者（依据：【人物】陆烬颜）"
      },
      {
          "name": "孤月处女丧失",
          "kind": "ai",
          "desc": "孤月 · 九幽玄阴穴的持有者被破身（元阴初破的那一刻）"
      },
      {
          "name": "叶红缨处女丧失",
          "kind": "ai",
          "desc": "叶红缨 · 灼酒流炎穴的持有者被破身"
      },
      {
          "name": "闻观语处女丧失",
          "kind": "ai",
          "desc": "闻观语 · 心魔茶璎乳的持有者被破身"
      },
      {
          "name": "楚灵夜处女丧失",
          "kind": "ai",
          "desc": "楚灵夜 · 般若菩提菊的持有者被破身"
      },
      {
          "name": "楚灵夜后窍开发",
          "kind": "ai",
          "desc": "楚灵夜 · **后窍（谷道）被开发过**（被肛交／走后门）。与「楚灵夜处女丧失」**同时为真**，般若菩提菊才成形"
      },
      {
          "name": "雨霏柔处女丧失",
          "kind": "ai",
          "desc": "雨霏柔 · 北冥潮生穴的持有者被破身"
      },
      {
          "name": "苏瑶处女丧失",
          "kind": "ai",
          "desc": "苏瑶 · 灵犀同心（姐姐那一侧）被破身；与苏玲两个都丧失，灵犀同心才成形"
      },
      {
          "name": "苏玲处女丧失",
          "kind": "ai",
          "desc": "苏玲 · 灵犀同心（妹妹那一侧）被破身；与苏瑶两个都丧失，灵犀同心才成形"
      },
      {
          "name": "云织梦处女丧失",
          "kind": "ai",
          "desc": "云织梦 · 玉虎噙香乳的持有者被破身"
      },
      {
          "name": "花芷凝处女丧失",
          "kind": "ai",
          "desc": "花芷凝 · 梅蕊穴的持有者被破身"
      },
      {
          "name": "苏倾寒处女丧失",
          "kind": "ai",
          "desc": "苏倾寒 · 冰魄剑心穴的持有者被破身"
      },
      {
          "name": "慕容清歌处女丧失",
          "kind": "ai",
          "desc": "慕容清歌 · 清歌弦鸣穴的持有者被破身"
      },
      {
          "name": "顾云舒处女丧失",
          "kind": "ai",
          "desc": "顾云舒 · 流焰叠薪穴的持有者被破身"
      },
      {
          "name": "陆烬颜处女丧失",
          "kind": "ai",
          "desc": "陆烬颜 · 凤凰羽花的持有者被破身"
      },
      {
          "name": "已抵达陨仙原",
          "kind": "ai",
          "desc": "北域陨仙原一线：一行人或玩家这条线真的走到了陨仙原（魂欢殿主名下那批资料的统一闸门）"
      },
      {
          "name": "天姝榜建立",
          "kind": "ai",
          "desc": "神女殿中颁下《天姝榜》（极乐太子亲手颁）"
      },
      {
          "name": "获得任意名器",
          "kind": "ai",
          "desc": "玩家这条线上第一次真的接触到／得到一件名器"
      },
      {
          "name": "南域大劫",
          "kind": "ai",
          "desc": "南域大劫爆发：神诅降下、粉黑天穹、四殿册封"
      },
      {
          "name": "天溪城兽潮",
          "kind": "ai",
          "desc": "大规模兽潮压到天溪城下"
      },
      {
          "name": "阎雷子脱困",
          "kind": "ai",
          "desc": "阎雷子脱困／破关而出"
      },
      {
          "name": "进入葬魔渊",
          "kind": "ai",
          "desc": "玩家这条线进入葬魔渊"
      },
      {
          "name": "神女殿建成",
          "kind": "ai",
          "desc": "墨山道原址之上拔起天姝会神女殿"
      },
      {
          "name": "百丈天魔神像显形",
          "kind": "ai",
          "desc": "神女殿中百丈天魔神像显形"
      },
      {
          "name": "受封殿主",
          "kind": "ai",
          "desc": "南域大劫后受封天姝会殿主"
      },
      {
          "name": "阎雷子夺舍",
          "kind": "ai",
          "desc": "炼欲魔君残魂夺舍炎雷子"
      },
      {
          "name": "墨山道覆灭",
          "kind": "ai",
          "desc": "墨山道覆灭"
      },
      {
          "name": "九幽玄阴穴一阶段",
          "kind": "ai",
          "desc": "九幽玄阴穴 · 第一阶段「落红」已达成"
      },
      {
          "name": "九幽玄阴穴二阶段",
          "kind": "ai",
          "desc": "九幽玄阴穴 · 第二阶段「情动」已达成"
      },
      {
          "name": "九幽玄阴穴三阶段",
          "kind": "ai",
          "desc": "九幽玄阴穴 · 第三阶段「沉沦」已达成"
      },
      {
          "name": "九幽玄阴穴四阶段",
          "kind": "ai",
          "desc": "九幽玄阴穴 · 第四阶段「极乐」已达成"
      },
      {
          "name": "灼酒流炎穴一阶段",
          "kind": "ai",
          "desc": "灼酒流炎穴 · 第一阶段「落红」已达成"
      },
      {
          "name": "灼酒流炎穴二阶段",
          "kind": "ai",
          "desc": "灼酒流炎穴 · 第二阶段「情动」已达成"
      },
      {
          "name": "灼酒流炎穴三阶段",
          "kind": "ai",
          "desc": "灼酒流炎穴 · 第三阶段「沉沦」已达成"
      },
      {
          "name": "灼酒流炎穴四阶段",
          "kind": "ai",
          "desc": "灼酒流炎穴 · 第四阶段「极乐」已达成"
      },
      {
          "name": "心魔茶璎乳一阶段",
          "kind": "ai",
          "desc": "心魔茶璎乳 · 第一阶段「落红」已达成"
      },
      {
          "name": "心魔茶璎乳二阶段",
          "kind": "ai",
          "desc": "心魔茶璎乳 · 第二阶段「情动」已达成"
      },
      {
          "name": "心魔茶璎乳三阶段",
          "kind": "ai",
          "desc": "心魔茶璎乳 · 第三阶段「沉沦」已达成"
      },
      {
          "name": "心魔茶璎乳四阶段",
          "kind": "ai",
          "desc": "心魔茶璎乳 · 第四阶段「极乐」已达成"
      },
      {
          "name": "般若菩提菊一阶段",
          "kind": "ai",
          "desc": "般若菩提菊 · 第一阶段「落红」已达成"
      },
      {
          "name": "般若菩提菊二阶段",
          "kind": "ai",
          "desc": "般若菩提菊 · 第二阶段「情动」已达成"
      },
      {
          "name": "般若菩提菊三阶段",
          "kind": "ai",
          "desc": "般若菩提菊 · 第三阶段「沉沦」已达成"
      },
      {
          "name": "般若菩提菊四阶段",
          "kind": "ai",
          "desc": "般若菩提菊 · 第四阶段「极乐」已达成"
      },
      {
          "name": "北冥潮生穴一阶段",
          "kind": "ai",
          "desc": "北冥潮生穴 · 第一阶段「落红」已达成"
      },
      {
          "name": "北冥潮生穴二阶段",
          "kind": "ai",
          "desc": "北冥潮生穴 · 第二阶段「情动」已达成"
      },
      {
          "name": "北冥潮生穴三阶段",
          "kind": "ai",
          "desc": "北冥潮生穴 · 第三阶段「沉沦」已达成"
      },
      {
          "name": "北冥潮生穴四阶段",
          "kind": "ai",
          "desc": "北冥潮生穴 · 第四阶段「极乐」已达成"
      },
      {
          "name": "灵犀同心穴一阶段",
          "kind": "ai",
          "desc": "灵犀同心穴 · 第一阶段「落红」已达成"
      },
      {
          "name": "灵犀同心穴二阶段",
          "kind": "ai",
          "desc": "灵犀同心穴 · 第二阶段「情动」已达成"
      },
      {
          "name": "灵犀同心穴三阶段",
          "kind": "ai",
          "desc": "灵犀同心穴 · 第三阶段「沉沦」已达成"
      },
      {
          "name": "灵犀同心穴四阶段",
          "kind": "ai",
          "desc": "灵犀同心穴 · 第四阶段「极乐」已达成"
      },
      {
          "name": "玉虎噙香乳一阶段",
          "kind": "ai",
          "desc": "玉虎噙香乳 · 第一阶段「落红」已达成"
      },
      {
          "name": "玉虎噙香乳二阶段",
          "kind": "ai",
          "desc": "玉虎噙香乳 · 第二阶段「情动」已达成"
      },
      {
          "name": "玉虎噙香乳三阶段",
          "kind": "ai",
          "desc": "玉虎噙香乳 · 第三阶段「沉沦」已达成"
      },
      {
          "name": "玉虎噙香乳四阶段",
          "kind": "ai",
          "desc": "玉虎噙香乳 · 第四阶段「极乐」已达成"
      },
      {
          "name": "烟霞灵乳一阶段",
          "kind": "ai",
          "desc": "烟霞灵乳 · 第一阶段「落红」已达成"
      },
      {
          "name": "烟霞灵乳二阶段",
          "kind": "ai",
          "desc": "烟霞灵乳 · 第二阶段「情动」已达成"
      },
      {
          "name": "烟霞灵乳三阶段",
          "kind": "ai",
          "desc": "烟霞灵乳 · 第三阶段「沉沦」已达成"
      },
      {
          "name": "烟霞灵乳四阶段",
          "kind": "ai",
          "desc": "烟霞灵乳 · 第四阶段「极乐」已达成"
      },
      {
          "name": "梅蕊穴一阶段",
          "kind": "ai",
          "desc": "梅蕊穴 · 第一阶段「落红」已达成"
      },
      {
          "name": "梅蕊穴二阶段",
          "kind": "ai",
          "desc": "梅蕊穴 · 第二阶段「情动」已达成"
      },
      {
          "name": "梅蕊穴三阶段",
          "kind": "ai",
          "desc": "梅蕊穴 · 第三阶段「沉沦」已达成"
      },
      {
          "name": "梅蕊穴四阶段",
          "kind": "ai",
          "desc": "梅蕊穴 · 第四阶段「极乐」已达成"
      },
      {
          "name": "冰魄剑心穴一阶段",
          "kind": "ai",
          "desc": "冰魄剑心穴 · 第一阶段「落红」已达成"
      },
      {
          "name": "冰魄剑心穴二阶段",
          "kind": "ai",
          "desc": "冰魄剑心穴 · 第二阶段「情动」已达成"
      },
      {
          "name": "冰魄剑心穴三阶段",
          "kind": "ai",
          "desc": "冰魄剑心穴 · 第三阶段「沉沦」已达成"
      },
      {
          "name": "冰魄剑心穴四阶段",
          "kind": "ai",
          "desc": "冰魄剑心穴 · 第四阶段「极乐」已达成"
      },
      {
          "name": "清歌弦鸣穴一阶段",
          "kind": "ai",
          "desc": "清歌弦鸣穴 · 第一阶段「落红」已达成"
      },
      {
          "name": "清歌弦鸣穴二阶段",
          "kind": "ai",
          "desc": "清歌弦鸣穴 · 第二阶段「情动」已达成"
      },
      {
          "name": "清歌弦鸣穴三阶段",
          "kind": "ai",
          "desc": "清歌弦鸣穴 · 第三阶段「沉沦」已达成"
      },
      {
          "name": "清歌弦鸣穴四阶段",
          "kind": "ai",
          "desc": "清歌弦鸣穴 · 第四阶段「极乐」已达成"
      },
      {
          "name": "流焰叠薪穴一阶段",
          "kind": "ai",
          "desc": "流焰叠薪穴 · 第一阶段「落红」已达成"
      },
      {
          "name": "流焰叠薪穴二阶段",
          "kind": "ai",
          "desc": "流焰叠薪穴 · 第二阶段「情动」已达成"
      },
      {
          "name": "流焰叠薪穴三阶段",
          "kind": "ai",
          "desc": "流焰叠薪穴 · 第三阶段「沉沦」已达成"
      },
      {
          "name": "流焰叠薪穴四阶段",
          "kind": "ai",
          "desc": "流焰叠薪穴 · 第四阶段「极乐」已达成"
      },
      {
          "name": "凤凰羽花一阶段",
          "kind": "ai",
          "desc": "凤凰羽花 · 第一阶段「落红」已达成"
      },
      {
          "name": "凤凰羽花二阶段",
          "kind": "ai",
          "desc": "凤凰羽花 · 第二阶段「情动」已达成"
      },
      {
          "name": "凤凰羽花三阶段",
          "kind": "ai",
          "desc": "凤凰羽花 · 第三阶段「沉沦」已达成"
      },
      {
          "name": "凤凰羽花四阶段",
          "kind": "ai",
          "desc": "凤凰羽花 · 第四阶段「极乐」已达成"
      },
      {
          "name": "天姝会存在",
          "kind": "open",
          "desc": "起手公开，无需解锁（四殿主身份由脚本自动置 true）"
      }
  ];

  var AI_FIELDS = FIELD_TABLE.filter(function (f) { return f.kind === 'ai'; }).map(function (f) { return f.name; });
  var OPEN_FIELDS = FIELD_TABLE.filter(function (f) { return f.kind === 'open'; }).map(function (f) { return f.name; });
  var ALL_FIELDS = FIELD_TABLE.map(function (f) { return f.name; });

  /** 锚点分组（供面板按类渲染与全开全关） */
  var MQ_STAGE_FIELDS = ALL_FIELDS.filter(function (name) { return name.indexOf('阶段') >= 0; });
  var MQ_FORM_FIELDS = ALL_FIELDS.filter(function (name) { return name.slice(-2) === '成形'; });
  var STORY_FIELDS = ALL_FIELDS.filter(function (name) { return name.indexOf('阶段') < 0 && name.slice(-2) !== '成形' && OPEN_FIELDS.indexOf(name) < 0; });

  /** 字段 → 锚点说明（面板上作为勾选框的 title 提示） */
  var FIELD_DESC = {};
  for (var _fi = 0; _fi < FIELD_TABLE.length; _fi++) {
    FIELD_DESC[FIELD_TABLE[_fi].name] = FIELD_TABLE[_fi].desc;
  }

  /** 身份台账（穿书模式）—— 6 个身份，名字逐字对齐开场白段落名与闸门条件 */
  var IDENTITY_DEFAULT = '赵无忧';
  var IDENTITIES = [
    { name: '赵无忧', desc: '墨山道六弟子（原著主角）· 默认时点＝启程天溪之前' },
    { name: '自设', desc: '玩家 Persona 自定义身份（穿书者）· 时点同刻，来历与位置由 Persona 决定' },
    { name: '焚欲殿主', desc: '天姝会焚欲殿主 · 残阳老怪 · 蛊火与惑妖迷情瘴' },
    { name: '欢喜殿主', desc: '天姝会欢喜殿主 · 肉山佛 · 佛门皮相、淫邪内核' },
    { name: '浊龙殿主', desc: '天姝会浊龙殿主 · 天龙皇朝第九皇子 · 龙气与龙器' },
    { name: '魂欢殿主', desc: '天姝会魂欢殿主 · 病相思 · 情丝化灵、辨识名器' },
  ];
  var IDENTITY_NAMES = IDENTITIES.map(function (x) { return x.name; });
  /** 身份 → 阵营（世界书 `@@if` 闸门用它做「成批收放」：天姝会／非天姝会） */
  var IDENTITY_FACTION = {
    赵无忧: '墨山道',
    自设: '自设',
    焚欲殿主: '天姝会',
    欢喜殿主: '天姝会',
    浊龙殿主: '天姝会',
    魂欢殿主: '天姝会',
  };
  var FACTION_DEFAULT = '墨山道';
  /** 阵营预设筹码（点一下填进输入框，仍可手改） */
  var FACTION_PRESETS = ['墨山道', '天姝会', '自设', '散修', '魔道', '无'];

  /** 展示型字段（＝状态栏面板上那些格子；纯文本编辑，原样写回） */
  var DISPLAY_FIELDS = [
    '时间', '历时', '地点', '天气', '环境', '在场', '暗处',
    '修为', '状态', '目标', '局势',
    '线索', '近闻', '远闻', '危机', '关系刻度',
  ];
  /** 需要多行输入的字段（列表型／长文本） */
  var MULTILINE_FIELDS = ['环境', '在场', '暗处', '状态', '目标', '局势', '线索', '近闻', '远闻', '危机', '关系刻度'];

  /** 7条中立大势剧情时期（全身份通用）—— 驱动世界线与各方公开态势 */
  var NEUTRAL_ERAS = [
    { id: 1, name: '【中立】一 · 暗流微澜', title: '极乐密藏天机泄', year: 1577.12, text: '仙盟历 1577 年 · 十二月初一', desc: '大劫前夕，风起青萍之末。极乐密藏封印出现首道裂痕，邪修暗探游弋。', anchors: [] },
    { id: 2, name: '【中立】二 · 承平假象', title: '幽寂秘境风闻动', year: 1578.03, text: '仙盟历 1578 年 · 三月初一', desc: '南域承平表象，岁末正道安泰。幽寂秘境异动，各方势力闻风而动。', anchors: [] },
    { id: 3, name: '【中立】三 · 南域大劫', title: '天地神诅与四殿分疆', year: 1578.08, text: '仙盟历 1578 年 · 八月初一', desc: '全书总转折点！神诅降临南域无元婴，正道大能跌境，极乐太子立四殿。', anchors: ['南域大劫'] },
    { id: 4, name: '【中立】四 · 天溪兽潮', title: '要塞围城与九龙焚天', year: 1579.01, text: '仙盟历 1579 年 · 一月初一', desc: '千万凶兽狂潮合围天溪城，九龙焚天大阵开启，惨烈围城拉锯战。', anchors: ['南域大劫', '天溪城兽潮', '兽潮血战'] },
    { id: 5, name: '【中立】五 · 天溪城破', title: '阵毁城陷与四方溃散', year: 1579.03, text: '仙盟历 1579 年 · 三月初一', desc: '大阵破裂城垣塌陷，天溪城失守沦陷，守军溃散，南域门户洞开。', anchors: ['南域大劫', '天溪城兽潮', '兽潮血战', '天溪城破'] },
    { id: 6, name: '【中立】六 · 乱世割据', title: '鼎炉猎场与名器大争', year: 1579.06, text: '仙盟历 1579 年 · 六月初一', desc: '正道全面失序，魔道四殿与群雄割据，名器猎场大争白热化。', anchors: ['南域大劫', '天溪城兽潮', '兽潮血战', '天溪城破'] },
    { id: 7, name: '【中立】七 · 极乐定局', title: '魔道鼎立与北上暗涌', year: 1580.01, text: '仙盟历 1580 年 · 一月初一', desc: '极乐魔道新秩序稳固，四殿各建魔宫总坛，野心向北域陨仙原延伸。', anchors: ['南域大劫', '天溪城兽潮', '兽潮血战', '天溪城破'] },
  ];
  function eraOf(year) {
    var y = Number(year) || 1578.03;
    if (y < 1578.03) return NEUTRAL_ERAS[0];
    if (y < 1578.08) return NEUTRAL_ERAS[1];
    if (y < 1579.01) return NEUTRAL_ERAS[2];
    if (y < 1579.03) return NEUTRAL_ERAS[3];
    if (y < 1579.06) return NEUTRAL_ERAS[4];
    if (y < 1580.01) return NEUTRAL_ERAS[5];
    return NEUTRAL_ERAS[6];
  }

  /* ═══════════════════════════════════════════════════════════
   * 一 · 酒馆助手接口探测（多窗口多路径，全部 typeof 保护）
   * ═══════════════════════════════════════════════════════════ */

  function msgOf(e) { return (e && e.message) || String(e); }

  /** 安全取某个窗口对象上的属性（跨源会抛，一律吞掉） */
  function safeGet(win, key) {
    try {
      if (!win) return undefined;
      return win[key];
    } catch (e) { return undefined; }
  }

  /** 依次在 本窗口 / window.parent / window.top 上找同名函数；找到第一个就返回，找不到返回 null */
  function probeOrigins(name) {
    var origins = [];
    try { if (window) origins.push(window); } catch (e) { /* 无 window */ }
    try { if (window.parent && origins.indexOf(window.parent) < 0) origins.push(window.parent); } catch (e) { /* 跨源 */ }
    try { if (window.top && origins.indexOf(window.top) < 0) origins.push(window.top); } catch (e) { /* 跨源 */ }
    for (var i = 0; i < origins.length; i++) {
      var fn = safeGet(origins[i], name);
      if (typeof fn === 'function') return fn;
    }
    return null;
  }

  /**
   * 取一个酒馆助手接口函数。三级探测：
   *   ① 裸全局（本窗口 → parent → top）
   *   ② `TavernHelper.<name>` 命名空间
   *   ③ `SillyTavern.getContext().TavernHelper.<name>`（最新正式入口）
   * ⚠️ `required` 只影响打不打警告，取不到一律返回 null 让调用方降级，**绝不抛错**。
   */
  function getTH(name, required) {
    var fn = probeOrigins(name);
    if (fn) return fn;

    // ② TavernHelper 命名空间
    var holders = [];
    try { holders.push(window.TavernHelper); } catch (e) { /* 无 */ }
    try { holders.push(window.parent && window.parent.TavernHelper); } catch (e) { /* 跨源 */ }
    try { holders.push(window.top && window.top.TavernHelper); } catch (e) { /* 跨源 */ }
    for (var i = 0; i < holders.length; i++) {
      var h = holders[i];
      if (h && typeof h[name] === 'function') return h[name];
    }

    // ③ SillyTavern.getContext() 里的 TavernHelper
    var bases = [];
    try { bases.push(window.SillyTavern); } catch (e) { /* 无 */ }
    try { bases.push(window.parent && window.parent.SillyTavern); } catch (e) { /* 跨源 */ }
    try { bases.push(window.top && window.top.SillyTavern); } catch (e) { /* 跨源 */ }
    for (var j = 0; j < bases.length; j++) {
      var p = bases[j];
      if (!p || typeof p.getContext !== 'function') continue;
      try {
        var ctx = p.getContext();
        if (ctx && ctx.TavernHelper && typeof ctx.TavernHelper[name] === 'function') return ctx.TavernHelper[name];
      } catch (e) { /* 吞掉 */ }
    }

    if (required) console.warn(TAG, '⚠️ 取不到酒馆助手接口 ' + name + ' —— 相关功能降级');
    return null;
  }

  /** 实际用到的接口（取不到就是 null；面板照常打开，只是读写会报「不可用」） */
  var API = {
    getVariables: getTH('getVariables', true),
    replaceVariables: getTH('replaceVariables', true),
    insertOrAssignVariables: getTH('insertOrAssignVariables', true),
    getChatMessages: getTH('getChatMessages'),
    setChatMessages: getTH('setChatMessages'),
  };

  /* ═══════════════════════════════════════════════════════════
   * 二 · 日志（console ＋ 面板里那一小块，方便不打开 F12 也能看）
   * ═══════════════════════════════════════════════════════════ */

  var LOGS = [];
  var LOG_MAX = 60;

  function pushLog(level, text) {
    var line = { t: Date.now(), level: level, text: String(text) };
    LOGS.push(line);
    if (LOGS.length > LOG_MAX) LOGS.splice(0, LOGS.length - LOG_MAX);
    var fn = (level === 'err') ? console.error : (level === 'warn' ? console.warn : console.log);
    try { fn.call(console, TAG, text); } catch (e) { /* 无所谓 */ }
    if (UI.mounted) renderLog();
    return text;
  }
  function log(text) { return pushLog('info', text); }
  function warn(text) { return pushLog('warn', '⚠️ ' + text); }
  function err(text) { return pushLog('err', '❌ ' + text); }

  /** toastr（多层回退：先主窗口，再本 iframe 自己的） */
  function toast(kind, message, timeOut) {
    try {
      var t = null;
      try { t = (window.parent && window.parent.toastr) || null; } catch (e) { t = null; }
      if (!t) { try { t = (typeof toastr !== 'undefined') ? toastr : null; } catch (e) { t = null; } }
      if (!t) return false;
      var fn = (typeof t[kind] === 'function') ? t[kind] : (typeof t.info === 'function' ? t.info : null);
      if (!fn) return false;
      fn.call(t, message, '仙姝堕·GM', { timeOut: timeOut || 6000 });
      return true;
    } catch (e) { return false; }
  }

  /* ═══════════════════════════════════════════════════════════
   * 三 · 变量层：读（消息层优先）／写（双写 ＋ 回读校验）
   * ═══════════════════════════════════════════════════════════ */

  var L_MSG = { type: 'message', message_id: -1 };   // -1 ＝ 最新一楼
  var L_CHAT = { type: 'chat' };
  var LAYERS = [L_MSG, L_CHAT];
  var LAYER_LABEL = { message: '消息层(#-1)', chat: '聊天层' };

  /** 值太长就截断（日志／快照用，避免把整段正文糊进来） */
  function clip(v, n) {
    var t = String(v === undefined || v === null ? '' : v);
    var cap = n || 24;
    return t.length > cap ? t.slice(0, cap) + '…' : t;
  }

  /**
   * 读一整层变量表；失败／形状不对返回 null。
   * ⚠️ 带一个 **300ms 的短命缓存**：面板一次渲染/一次保存要读好几遍两层，
   *    真接口在长聊天里是跨 iframe 调用，读太密会卡。任何写入都会先清缓存（见 invalidateCache），
   *    所以「写完回读」永远读到的是写后的新鲜值。
   */
  var CACHE_TTL = 300;
  var layerCache = {};

  function invalidateCache() {
    layerCache = {};
  }

  function readLayer(opt) {
    if (!API.getVariables) return null;
    var key = String(opt.type) + ':' + (opt.message_id === undefined ? '' : opt.message_id);
    var hit = layerCache[key];
    var now = Date.now();
    if (hit && (now - hit.t) < CACHE_TTL) return hit.v;
    var v = null;
    try {
      var raw = API.getVariables(opt);
      v = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw : null;
    } catch (e) {
      warn('读 ' + LAYER_LABEL[opt.type] + ' 失败：' + msgOf(e));
      v = null;
    }
    layerCache[key] = { t: now, v: v };
    return v;
  }

  /** 读 stat_data（两层的**合并视图**，消息层优先）。两层都没有 ⇒ null */
  function readStatData() {
    var chatV = readLayer(L_CHAT);
    var msgV = readLayer(L_MSG);
    var cs = (chatV && chatV.stat_data && typeof chatV.stat_data === 'object') ? chatV.stat_data : null;
    var ms = (msgV && msgV.stat_data && typeof msgV.stat_data === 'object') ? msgV.stat_data : null;
    if (!cs && !ms) return null;
    var stat = Object.assign({}, cs || {}, ms || {});
    var ck = (cs && cs.known && typeof cs.known === 'object') ? cs.known : null;
    var mk = (ms && ms.known && typeof ms.known === 'object') ? ms.known : null;
    if (ck || mk) stat.known = Object.assign({}, ck || {}, mk || {});
    return stat;
  }

  /** 取面板要显示的当前值（读不到就给默认，绝不交出 undefined） */
  function readForm() {
    var s = readStatData();
    var known = (s && s.known && typeof s.known === 'object') ? s.known : {};
    var out = {
      可达: !!s,
      身份: (s && typeof s.身份 === 'string' && s.身份) ? s.身份 : IDENTITY_DEFAULT,
      仙盟历: (s && Number.isFinite(Number(s.仙盟历))) ? Number(s.仙盟历) : 1578.03,
      仙盟历文: (s && typeof s.仙盟历文 === 'string') ? s.仙盟历文 : '',
      阵营: (s && typeof s.阵营 === 'string' && s.阵营) ? s.阵营 : FACTION_DEFAULT,
      known: {},
      展示: {},
    };
    for (var i = 0; i < ALL_FIELDS.length; i++) {
      var f = ALL_FIELDS[i];
      out.known[f] = (known[f] === true);
    }
    for (var j = 0; j < DISPLAY_FIELDS.length; j++) {
      var k = DISPLAY_FIELDS[j];
      var v = s ? s[k] : undefined;
      out.展示[k] = (v === undefined || v === null) ? '' : String(v);
    }
    return out;
  }

  /** stat_data 快照（日志用） */
  function snapshot() {
    var s = readStatData();
    if (!s) return null;
    var known = (s.known && typeof s.known === 'object') ? s.known : {};
    var display = {};
    for (var i = 0; i < DISPLAY_FIELDS.length; i++) {
      var k = DISPLAY_FIELDS[i];
      if (s[k] !== undefined && s[k] !== null && s[k] !== '') display[k] = clip(s[k]);
    }
    return {
      身份: (s.身份 === undefined ? null : s.身份),
      阵营: (s.阵营 === undefined ? null : s.阵营),
      已解锁: ALL_FIELDS.filter(function (f) { return known[f] === true; }),
      未设字段: ALL_FIELDS.filter(function (f) { return typeof known[f] !== 'boolean'; }),
      展示栏: display,
    };
  }
  function dumpStat(where) {
    var snap = snapshot();
    try { console.log(TAG, '[' + where + '] stat_data 快照：', snap); } catch (e) { /* 无 */ }
    return snap;
  }

  /** 零依赖路径写入（回退路 replaceVariables 用；不引 lodash，免得版本差异） */
  function setPath(obj, path, value) {
    var ks = String(path).split('.');
    var last = ks.pop();
    var cur = obj;
    for (var i = 0; i < ks.length; i++) {
      var k = ks[i];
      if (cur[k] === null || typeof cur[k] !== 'object') cur[k] = {};
      cur = cur[k];
    }
    cur[last] = value;
    return obj;
  }

  /** 把一个 thenable 收敛成 boolean（有些接口在不同版本里可能返回 Promise） */
  function settle(ret, name) {
    if (ret && typeof ret.then === 'function') {
      return ret.then(function () { return true; }).catch(function (e) {
        warn(name + ' 异步失败：' + msgOf(e));
        return false;
      });
    }
    return Promise.resolve(true);
  }

  /**
   * 写 stat_data（**双写**：消息层 ＋ 聊天层，两边保持一致）。
   * @param {object} patch 形如 `{ 身份: '…', known: { 封元镇灵环: true } }`（顶层键深合并）
   * @param {string} why   写这条的原因（日志用）
   * @returns {Promise<{ok:boolean, via:string}>}
   */
  function writeStat(patch, why) {
    var keys = Object.keys(patch || {});
    if (!keys.length) return Promise.resolve({ ok: false, via: '空写入' });
    invalidateCache();                       // 「改动前」快照要读真值，不吃缓存
    dumpStat(why + ' · 改动前');

    var budget = 0;
    var detail = [];
    var okAny = false;

    function next() {
      if (budget >= LAYERS.length) {
        invalidateCache();                   // 写完了：把缓存打掉，「改动后」快照与回读都读新鲜值
        log('[写入] ' + why + ' → ' + detail.join(' ｜ '));
        if (!okAny) err('写入失败：' + why + ' —— 变量接口都用不了，闸门这一轮不会更新');
        dumpStat(why + ' · 改动后');
        return { ok: okAny, via: detail.join(' ｜ ') };
      }
      var opt = LAYERS[budget++];
      return writeOneLayer(opt, patch, keys).then(function (layerOk) {
        if (layerOk) okAny = true;
        detail.push(LAYER_LABEL[opt.type] + ':' + (layerOk ? '✔' : '✘'));
        return next();
      });
    }

    return next();
  }

  /** 写单层：主路 insertOrAssignVariables，回退 读出整层 → 逐键改 → 整层 replace */
  function writeOneLayer(opt, patch, keys) {
    var via = '';
    if (API.insertOrAssignVariables) {
      try {
        var ret = API.insertOrAssignVariables({ stat_data: patch }, opt);
        return settle(ret, 'insertOrAssignVariables(' + opt.type + ')').then(function (ok) {
          if (ok) { via = 'insertOrAssignVariables'; return true; }
          return fallbackReplace(opt, patch, keys);
        });
      } catch (e) {
        warn('insertOrAssignVariables(' + LAYER_LABEL[opt.type] + ') 失败：' + msgOf(e));
      }
    }
    return fallbackReplace(opt, patch, keys);
  }

  function fallbackReplace(opt, patch, keys) {
    if (!API.getVariables || !API.replaceVariables) return Promise.resolve(false);
    try {
      var v = API.getVariables(opt);
      var base = (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
      for (var i = 0; i < keys.length; i++) setPath(base, 'stat_data.' + keys[i], patch[keys[i]]);
      var ret = API.replaceVariables(base, opt);
      return settle(ret, 'replaceVariables(' + opt.type + ')');
    } catch (e) {
      warn('replaceVariables(' + LAYER_LABEL[opt.type] + ') 失败：' + msgOf(e));
      return Promise.resolve(false);
    }
  }

  /** 写一处改动 ＋ 回读校验（只有回读到目标值才算真成功；不传 verify 就是「只回读、不判定」） */
  function applyPatch(patch, why, verify) {
    return writeStat(patch, why).then(function (r) {
      var after = readForm();
      var checked = (typeof verify === 'function');
      var verified = checked ? !!verify(after) : true;
      var tail = !checked ? '已回读（未判定）'
        : (verified ? '回读校验通过' : '⚠️ 回读没看到刚写的值（可能被消息层遮住或在别处被改写）');
      log((r.ok ? '✅ ' : '❌ ') + why + '（' + r.via + '）· ' + tail);
      return { ok: r.ok && verified, via: r.via, form: after };
    }).catch(function (e) {
      err(why + ' 写入异常：' + msgOf(e));
      return { ok: false, via: 'ERR', form: readForm() };
    });
  }

  /** 写身份（顺带给一个默认阵营；阵营最终以面板上的输入框为准） */
  function writeIdentity(name, factionOverride) {
    var faction = (typeof factionOverride === 'string' && factionOverride !== '')
      ? factionOverride
      : (IDENTITY_FACTION[name] !== undefined ? IDENTITY_FACTION[name] : FACTION_DEFAULT);
    return applyPatch({ 身份: name, 阵营: faction }, '身份 → ' + name + '／阵营 ' + faction, function (f) {
      return f.身份 === name;
    });
  }

  /* ═══════════════════════════════════════════════════════════
   * 四 · DOM：取宿主 document ＋ 注入样式
   * ═══════════════════════════════════════════════════════════ */

  /** 取宿主的 document（优先 window.parent，对齐参照卡经验） */
  function getDoc() {
    try {
      if (window.parent && window.parent !== window && window.parent.document && window.parent.document.body) {
        return window.parent.document;
      }
    } catch (e) { /* 跨源 */ }
    try {
      if (window.top && window.top !== window && window.top.document && window.top.document.body) {
        return window.top.document;
      }
    } catch (e) { /* 跨源 */ }
    try { if (document && document.body) return document; } catch (e) { /* 无 */ }
    return null;
  }

  var CSS_ID = 'xshd-gm-style';
  var CSS = [
    '#xshd-gm-mask{position:fixed;right:18px;top:64px;z-index:2147483000;width:560px;max-width:96vw;max-height:86vh;',
    'display:flex;flex-direction:column;background:linear-gradient(180deg,#141019 0%,#0d0b11 100%);',
    'border:1px solid #b8933f;border-radius:12px;box-shadow:0 18px 48px rgba(0,0,0,.66),0 0 0 1px rgba(184,147,63,.18) inset;',
    'color:#e9e4d8;font-family:"Microsoft YaHei","PingFang SC","Noto Sans SC",system-ui,sans-serif;font-size:13px;line-height:1.55}',
    '#xshd-gm-mask *{box-sizing:border-box}',
    '.xshd-gm-header{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 12px;cursor:move;',
    'background:linear-gradient(90deg,#241a10 0%,#1a1410 60%,#141019 100%);border-bottom:1px solid #58431c;border-radius:12px 12px 0 0;user-select:none}',
    '.xshd-gm-title{font-size:14px;font-weight:700;color:#f0d79a;letter-spacing:.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.xshd-gm-title small{color:#8d8577;font-weight:400;margin-left:6px;font-size:11px}',
    '.xshd-gm-header-btns{display:flex;gap:6px;flex:0 0 auto}',
    '.xshd-gm-x{width:26px;height:24px;border:1px solid #58431c;border-radius:6px;background:#1d1712;color:#e0c98d;cursor:pointer;font-size:14px;line-height:1}',
    '.xshd-gm-x:hover{background:#3a2a12;color:#fff0c4}',
    '.xshd-gm-body{overflow:auto;padding:10px 12px 4px;flex:1 1 auto;min-height:60px}',
    '.xshd-gm-sec{border:1px solid #332b1f;border-radius:9px;padding:8px 10px 10px;margin-bottom:9px;background:rgba(255,255,255,.017)}',
    '.xshd-gm-sec-title{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;font-weight:700;',
    'color:#d9c489;margin-bottom:7px;padding-bottom:5px;border-bottom:1px dashed #3a3123}',
    '.xshd-gm-sec-title .xshd-gm-hint{font-weight:400;color:#8d8577;font-size:11px}',
    '.xshd-gm-mini{padding:2px 7px;font-size:11px;border:1px solid #58431c;border-radius:6px;background:#1d1712;color:#d9c489;cursor:pointer}',
    '.xshd-gm-mini:hover{background:#3a2a12;color:#fff0c4}',
    '.xshd-gm-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 14px}',
    '.xshd-gm-check{display:flex;align-items:center;gap:6px;padding:3px 4px;border-radius:5px;cursor:pointer;overflow:hidden}',
    '.xshd-gm-check:hover{background:rgba(184,147,63,.1)}',
    '.xshd-gm-check input{margin:0;accent-color:#b8933f;width:14px;height:14px;flex:0 0 auto;cursor:pointer}',
    '.xshd-gm-check span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#ded7c6}',
    '.xshd-gm-check.on span{color:#f3d99b;font-weight:600}',
    '.xshd-gm-field{margin-bottom:6px}',
    '.xshd-gm-label{display:block;font-size:11px;color:#9d9484;margin-bottom:2px}',
    '.xshd-gm-in,.xshd-gm-sel,.xshd-gm-ta{width:100%;background:#0b0910;border:1px solid #3d3427;border-radius:6px;color:#eae4d6;',
    'padding:5px 7px;font-size:12px;font-family:inherit}',
    '.xshd-gm-in:focus,.xshd-gm-sel:focus,.xshd-gm-ta:focus{outline:none;border-color:#b8933f;box-shadow:0 0 0 2px rgba(184,147,63,.18)}',
    '.xshd-gm-ta{resize:vertical;min-height:34px;line-height:1.45}',
    '.xshd-gm-chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}',
    '.xshd-gm-chip{padding:2px 8px;font-size:11px;border:1px solid #3d3427;border-radius:10px;background:#151119;color:#c9c0ac;cursor:pointer}',
    '.xshd-gm-chip:hover{border-color:#b8933f;color:#f3d99b}',
    '.xshd-gm-st{font-size:11px;color:#8d8577;margin-top:3px;word-break:break-all}',
    '.xshd-gm-st b{color:#d9c489;font-weight:600}',
    '.xshd-gm-era-list{display:flex;flex-direction:column;gap:6px;margin-top:6px}',
    '.xshd-gm-era-card{padding:7px 9px;border:1px solid #332b1f;border-radius:7px;background:#120f16;display:flex;flex-direction:column;gap:4px}',
    '.xshd-gm-era-card.active{border-color:#b8933f;background:rgba(184,147,63,.12)}',
    '.xshd-gm-era-header{display:flex;justify-content:space-between;align-items:center;font-size:12px}',
    '.xshd-gm-era-name{color:#f0d79a;font-weight:700}',
    '.xshd-gm-era-year{color:#8d8577;font-size:11px}',
    '.xshd-gm-era-desc{font-size:11px;color:#a89f8e;line-height:1.4}',
    '.xshd-gm-era-act{display:flex;align-items:center;gap:8px;margin-top:2px}',
    '.xshd-gm-era-req{font-size:10px;color:#c97f7f}',
    '.xshd-gm-active-btn{background:#6b4f16!important;color:#fff4d2!important;font-weight:700}',
    '.xshd-gm-footer{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:9px 12px;border-top:1px solid #332b1f;background:#100d14;border-radius:0 0 12px 12px}',
    '.xshd-gm-btn{padding:6px 14px;font-size:12px;border:1px solid #58431c;border-radius:7px;background:#1d1712;color:#e0c98d;cursor:pointer;font-family:inherit}',
    '.xshd-gm-btn:hover{background:#3a2a12;color:#fff0c4}',
    '.xshd-gm-btn.primary{flex:1 1 auto;background:linear-gradient(90deg,#6b4f16,#8a6717);color:#fff4d2;border-color:#b8933f;font-weight:700}',
    '.xshd-gm-btn.primary:hover{background:linear-gradient(90deg,#8a6717,#a87e1c)}',
    '.xshd-gm-log{margin:0 12px 10px;border:1px solid #2c2519;border-radius:8px;background:#08070a;max-height:104px;overflow:auto;padding:5px 8px;',
    'font-family:Consolas,Menlo,monospace;font-size:11px;color:#9a927f}',
    '.xshd-gm-log div{white-space:pre-wrap;word-break:break-all}',
    '.xshd-gm-log .warn{color:#e8c46a}',
    '.xshd-gm-log .err{color:#f08a7a}',
    '.xshd-gm-log .time{color:#5d574c;margin-right:5px}',
    '@media (max-width:620px){#xshd-gm-mask{right:8px;left:8px;top:56px;width:auto}.xshd-gm-grid{grid-template-columns:1fr}}',
  ].join('\n');

  function injectStyle(doc) {
    try {
      if (!doc) return false;
      if (doc.getElementById(CSS_ID)) return true;
      var styleEl = doc.createElement('style');
      styleEl.id = CSS_ID;
      styleEl.textContent = CSS;
      (doc.head || doc.body).appendChild(styleEl);
      return true;
    } catch (e) {
      warn('注入样式失败：' + msgOf(e));
      return false;
    }
  }

  /* ═══════════════════════════════════════════════════════════
   * 五 · 面板：结构 / 渲染 / 事件
   * ═══════════════════════════════════════════════════════════ */

  var UI = { mounted: false, mask: null, doc: null, open: false, idSeq: 0 };

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function q(id) { return 'xshd-gm-' + id; }

  /** 一个文本输入控件（多行字段用 textarea） */
  function fieldHTML(key, value) {
    var id = q('f-' + DISPLAY_FIELDS.indexOf(key));
    var label = '<label class="xshd-gm-label" for="' + id + '">' + esc(key) + '</label>';
    var body = MULTILINE_FIELDS.indexOf(key) >= 0
      ? '<textarea class="xshd-gm-ta" id="' + id + '" data-field="' + esc(key) + '" rows="2">' + esc(value) + '</textarea>'
      : '<input class="xshd-gm-in" type="text" id="' + id + '" data-field="' + esc(key) + '" value="' + esc(value) + '" />';
    return '<div class="xshd-gm-field">' + label + body + '</div>';
  }

  /** 一组 known 勾选框 */
  function checksHTML(fields, form) {
    return fields.map(function (f) {
      var on = form.known[f] ? ' on' : '';
      return '<label class="xshd-gm-check' + on + '" title="' + esc(FIELD_DESC[f] || '') + '">'
        + '<input type="checkbox" data-known="' + esc(f) + '"' + (form.known[f] ? ' checked' : '') + ' />'
        + '<span>' + esc(f) + '</span></label>';
    }).join('');
  }

  /** 面板骨架（只建一次；之后只重填内容） */
  function buildShell(doc) {
    var mask = doc.createElement('div');
    mask.id = 'xshd-gm-mask';
    var identOpts = IDENTITIES.map(function (it) {
      return '<option value="' + esc(it.name) + '">' + esc(it.name) + '</option>';
    }).join('');
    mask.innerHTML = [
      '<div class="xshd-gm-header" id="' + q('header') + '">',
      '  <div class="xshd-gm-title">🎛️ 仙姝堕 · 后台 GM 修改器<small>' + esc(VERSION) + '</small></div>',
      '  <div class="xshd-gm-header-btns">',
      '    <button type="button" class="xshd-gm-x" id="' + q('reload') + '" title="读回当前值">⟳</button>',
      '    <button type="button" class="xshd-gm-x" id="' + q('close') + '" title="关闭面板">&times;</button>',
      '  </div>',
      '</div>',
      '<div class="xshd-gm-body" id="' + q('body') + '"></div>',
      '<div class="xshd-gm-footer" id="' + q('footer') + '">',
      '  <button type="button" class="xshd-gm-btn primary" id="' + q('save') + '">💾 保存并生效</button>',
      '  <button type="button" class="xshd-gm-btn" id="' + q('allon') + '">全部解锁</button>',
      '  <button type="button" class="xshd-gm-btn" id="' + q('alloff') + '">全部回锁</button>',
      '  <button type="button" class="xshd-gm-btn" id="' + q('dump') + '">打印快照</button>',
      '</div>',
      '<div class="xshd-gm-log" id="' + q('log') + '"></div>',
    ].join('\n');
    // 身份下拉的选项在这里一次性拼好，重渲染时只改 value
    mask.__identOpts = identOpts;
    return mask;
  }

  /** 渲染 body（每次打开／保存后重跑，显示的永远是「刚读回来的真值」） */
  function renderBody() {
    if (!UI.mounted || !UI.mask) return;
    var doc = UI.doc;
    var body = UI.mask.querySelector('#' + q('body'));
    if (!body) return;
    var form = readForm();
    var identOpts = UI.mask.__identOpts || '';

    var html = [];

    // ── ① 状态摘要 ──
    if (!form.可达) {
      html.push('<div class="xshd-gm-sec"><div class="xshd-gm-sec-title"><span>⛔ 读不到 stat_data</span></div>'
        + '<div class="xshd-gm-st">变量接口取不到，或这个聊天还没初始化。'
        + '先确认卡内脚本「状态机.js」在跑，再按 ⟳ 读回；保存会尝试双写两层。</div></div>');
    } else {
      var onCount = ALL_FIELDS.filter(function (f) { return form.known[f]; }).length;
      html.push('<div class="xshd-gm-sec"><div class="xshd-gm-sec-title"><span>📋 当前账本</span>'
        + '<span class="xshd-gm-hint">known ' + onCount + '/' + ALL_FIELDS.length + ' 已解锁</span></div>'
        + '<div class="xshd-gm-st">身份 <b>' + esc(form.身份) + '</b>　阵营 <b>' + esc(form.阵营) + '</b>　'
        + '写回 <b>双写</b>（消息层 #-1 ＋ 聊天层）</div></div>');
    }

    // ── ② 中立大势 · 剧情时期（全身份通用） ──
    var curEra = eraOf(form.仙盟历);
    var eraCards = NEUTRAL_ERAS.map(function (era) {
      var isCur = (era.id === curEra.id);
      return '<div class="xshd-gm-era-card' + (isCur ? ' active' : '') + '">'
        + '<div class="xshd-gm-era-header">'
        + '<span class="xshd-gm-era-name">' + esc(era.name) + ' · ' + esc(era.title) + '</span>'
        + '<span class="xshd-gm-era-year">' + era.year + '起</span>'
        + '</div>'
        + '<div class="xshd-gm-era-desc">' + esc(era.desc) + '</div>'
        + '<div class="xshd-gm-era-act">'
        + '<button type="button" class="xshd-gm-mini' + (isCur ? ' xshd-gm-active-btn' : '') + '" data-era-id="' + era.id + '">'
        + (isCur ? '✦ 当前时期' : '切换至该时期') + '</button>'
        + (era.anchors.length ? '<span class="xshd-gm-era-req">关联锚点：' + era.anchors.join('、') + '</span>' : '')
        + '</div></div>';
    }).join('');

    html.push('<div class="xshd-gm-sec">',
      '<div class="xshd-gm-sec-title"><span>📜 中立大势 · 剧情时期（7条）</span>',
      '<span class="xshd-gm-hint">当前所处：<b style="color:#e9d9ac">' + esc(curEra.name) + '</b>（' + form.仙盟历 + '）</span></div>',
      '<div class="xshd-gm-st">面向全身份开放的世界大势主轴。由仙盟历（时间）与客观天地剧变驱动，已剥离所有旧角色专属废弃锚点。</div>',
      '<div class="xshd-gm-grid" style="grid-template-columns:1fr 1fr;margin:8px 0;">',
      '<div class="xshd-gm-field"><label class="xshd-gm-label">仙盟历数值（驱动闸门）</label>',
      '<input class="xshd-gm-in" type="number" step="0.01" id="' + q('xianmengli') + '" value="' + form.仙盟历 + '" /></div>',
      '<div class="xshd-gm-field"><label class="xshd-gm-label">仙盟历文本（展示用）</label>',
      '<input class="xshd-gm-in" type="text" id="' + q('xianmengliwen') + '" value="' + esc(form.仙盟历文 || curEra.text) + '" /></div>',
      '</div>',
      '<div class="xshd-gm-era-list">' + eraCards + '</div>',
      '</div>');

    // ── ③ 剧情与事件锚点 ──
    html.push('<div class="xshd-gm-sec">',
      '<div class="xshd-gm-sec-title"><span>📖 世界事件与处女丧失锚点（' + (STORY_FIELDS.length + OPEN_FIELDS.length) + '）</span>',
      '<span><button type="button" class="xshd-gm-mini" data-group="story" data-val="1">全开</button> ',
      '<button type="button" class="xshd-gm-mini" data-group="story" data-val="0">全关</button></span></div>',
      '<div class="xshd-gm-grid">' + checksHTML(STORY_FIELDS.concat(OPEN_FIELDS), form) + '</div>',
      '<div class="xshd-gm-st">主线剧情进展、关键事件与身份起手公开锚点。</div></div>');

    // ── ③ 名器成形锚点 ──
    html.push('<div class="xshd-gm-sec">',
      '<div class="xshd-gm-sec-title"><span>🌸 名器成形锚点（' + MQ_FORM_FIELDS.length + '）</span>',
      '<span><button type="button" class="xshd-gm-mini" data-group="mq_form" data-val="1">全开</button> ',
      '<button type="button" class="xshd-gm-mini" data-group="mq_form" data-val="0">全关</button></span></div>',
      '<div class="xshd-gm-grid">' + checksHTML(MQ_FORM_FIELDS, form) + '</div>',
      '<div class="xshd-gm-st">名器本体觉醒与成形标记（正向真值闸门前置）。</div></div>');

    // ── ④ 名器阶段锚点 ──
    html.push('<div class="xshd-gm-sec">',
      '<div class="xshd-gm-sec-title"><span>⚡ 名器阶段锚点（' + MQ_STAGE_FIELDS.length + '）</span>',
      '<span><button type="button" class="xshd-gm-mini" data-group="mq_stage" data-val="1">全开</button> ',
      '<button type="button" class="xshd-gm-mini" data-group="mq_stage" data-val="0">全关</button></span></div>',
      '<div class="xshd-gm-grid">' + checksHTML(MQ_STAGE_FIELDS, form) + '</div>',
      '<div class="xshd-gm-st">名器各阶段（落红／情动／沉沦／极乐）达成标记。</div></div>');

    // ── ④ 身份 ＋ 阵营 ──
    var idDesc = '';
    for (var i = 0; i < IDENTITIES.length; i++) {
      if (IDENTITIES[i].name === form.身份) idDesc = IDENTITIES[i].desc;
    }
    var chips = FACTION_PRESETS.map(function (p) {
      return '<button type="button" class="xshd-gm-chip" data-faction="' + esc(p) + '">' + esc(p) + '</button>';
    }).join('');
    html.push('<div class="xshd-gm-sec">',
      '<div class="xshd-gm-sec-title"><span>🎭 身份 ／ 阵营</span>',
      '<span class="xshd-gm-hint">闸门靠这两个值成批收放世界书条目</span></div>',
      '<div class="xshd-gm-grid">',
      '<div class="xshd-gm-field"><label class="xshd-gm-label">身份（6 选 1）</label>',
      '<select class="xshd-gm-sel" id="' + q('identity') + '">' + identOpts + '</select>',
      '<div class="xshd-gm-st">随身份默认：<b>' + esc(IDENTITY_FACTION[form.身份] || FACTION_DEFAULT) + '</b></div></div>',
      '<div class="xshd-gm-field"><label class="xshd-gm-label">阵营（自由文本）</label>',
      '<input class="xshd-gm-in" type="text" id="' + q('faction') + '" value="' + esc(form.阵营) + '" />',
      '<div class="xshd-gm-chips">' + chips + '</div></div>',
      '</div>',
      '<div class="xshd-gm-st">' + esc(idDesc) + '</div>',
      '<div class="xshd-gm-chips"><button type="button" class="xshd-gm-mini" id="' + q('idfaction') + '">按身份写阵营</button></div>',
      '</div>');

    // ── ⑤ 展示型字段 10 ──
    html.push('<div class="xshd-gm-sec">',
      '<div class="xshd-gm-sec-title"><span>📝 展示型字段（10）</span>',
      '<span class="xshd-gm-hint">原样写回 stat_data，不做任何截断</span></div>',
      DISPLAY_FIELDS.map(function (k) { return fieldHTML(k, form.展示[k]); }).join(''),
      '</div>');

    body.innerHTML = html.join('\n');

    // 下拉框与「全开／全关」之后重新对齐选中项
    var sel = body.querySelector('#' + q('identity'));
    if (sel) sel.value = form.身份;
    applyCheckStyles(body);
    bindBodyButtons(body);
    return form;
  }

  /** 勾选框的 .on 高亮跟着状态走 */
  function applyCheckStyles(box) {
    try {
      var list = (box || UI.mask).querySelectorAll('.xshd-gm-check');
      for (var i = 0; i < list.length; i++) {
        var cb = list[i].querySelector('input[type=checkbox]');
        if (cb && cb.checked) list[i].classList.add('on');
        else list[i].classList.remove('on');
      }
    } catch (e) { /* 无 */ }
  }

  function renderLog() {
    if (!UI.mounted || !UI.mask) return;
    var box = UI.mask.querySelector('#' + q('log'));
    if (!box) return;
    var rows = LOGS.slice(-30).map(function (l) {
      var d = new Date(l.t);
      var hh = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);
      var cls = (l.level === 'warn' || l.level === 'err') ? l.level : '';
      return '<div class="' + cls + '"><span class="time">' + hh + '</span>' + esc(l.text) + '</div>';
    });
    box.innerHTML = rows.join('');
    try { box.scrollTop = box.scrollHeight; } catch (e) { /* 无 */ }
  }

  /* ── 面板动作 ── */

  /** 收集面板上的全部输入（勾选框 ＋ 身份 ＋ 阵营 ＋ 10 个文本框） */
  function collect() {
    var mask = UI.mask;
    if (!mask) return null;
    var checkboxAll = mask.querySelectorAll('input[data-known]');
    var known = {};
    for (var i = 0; i < checkboxAll.length; i++) {
      var cb = checkboxAll[i];
      known[cb.getAttribute('data-known')] = !!cb.checked;
    }
    // 面板上没有的 known 字段（不该发生）用当前真值兜住，避免「没显示＝被写成 false」
    var cur = readForm();
    for (var j = 0; j < ALL_FIELDS.length; j++) {
      var f = ALL_FIELDS[j];
      if (known[f] === undefined) known[f] = cur.known[f];
    }
    var sel = mask.querySelector('#' + q('identity'));
    var fac = mask.querySelector('#' + q('faction'));
    var xmlInput = mask.querySelector('#' + q('xianmengli'));
    var xmlWenInput = mask.querySelector('#' + q('xianmengliwen'));
    var patch = {
      仙盟历: (xmlInput && !isNaN(parseFloat(xmlInput.value))) ? parseFloat(xmlInput.value) : cur.仙盟历,
      仙盟历文: xmlWenInput ? String(xmlWenInput.value).trim() : (cur.仙盟历文 || ''),
      身份: (sel && IDENTITY_NAMES.indexOf(sel.value) >= 0) ? sel.value : cur.身份,
      阵营: fac ? String(fac.value).trim() : cur.阵营,
      known: known,
    };
    for (var k = 0; k < DISPLAY_FIELDS.length; k++) {
      var key = DISPLAY_FIELDS[k];
      var el = mask.querySelector('input[data-field="' + key + '"], textarea[data-field="' + key + '"]');
      if (el) patch[key] = String(el.value);
    }
    return patch;
  }

  /** 保存：一次写全（双写两层）＋ 回读校验 ＋ 重渲染 */
  function save() {
    var patch = collect();
    if (!patch) return Promise.resolve(false);
    log('保存：' + ALL_FIELDS.length + ' 个 known ＋ 身份／阵营 ＋ ' + DISPLAY_FIELDS.length + ' 个展示字段 → 双写两层');
    return applyPatch(patch, '面板保存', function (f) {
      if (f.身份 !== patch.身份) return false;
      for (var i = 0; i < ALL_FIELDS.length; i++) {
        if (f.known[ALL_FIELDS[i]] !== patch.known[ALL_FIELDS[i]]) return false;
      }
      return true;
    }).then(function (r) {
      renderBody();
      if (r.ok) {
        var onCount = ALL_FIELDS.filter(function (x) { return r.form.known[x]; }).length;
        toast('success', 'GM 已生效：' + patch.身份 + '／' + patch.阵营 + '，known ' + onCount + '/' + ALL_FIELDS.length + '（双写两层）', 7000);
        log('✅ 已写回并刷新面板（' + r.via + '）');
      } else {
        toast('warning', 'GM 写入未通过回读校验，请按 ⟳ 看当前真值（详情见控制台）', 9000);
        err('写入未通过回读校验：' + r.via);
      }
      return r.ok;
    });
  }

  /** 全开／全关某一组 known（只改 DOM，仍需点「保存并生效」才落盘） */
  function setGroup(group, val) {
    var fields = (group === 'story') ? STORY_FIELDS.concat(OPEN_FIELDS)
      : (group === 'mq_form') ? MQ_FORM_FIELDS
      : (group === 'mq_stage') ? MQ_STAGE_FIELDS
      : ALL_FIELDS;
    var mask = UI.mask;
    if (!mask) return 0;
    var n = 0;
    for (var i = 0; i < fields.length; i++) {
      var cb = mask.querySelector('input[data-known="' + fields[i] + '"]');
      if (cb) { cb.checked = !!val; n++; }
    }
    applyCheckStyles(mask);
    var groupLabel = (group === 'story') ? ('剧情与起手公开（' + (STORY_FIELDS.length + OPEN_FIELDS.length) + '）')
      : (group === 'mq_form') ? ('名器成形（' + MQ_FORM_FIELDS.length + '）')
      : (group === 'mq_stage') ? ('名器阶段（' + MQ_STAGE_FIELDS.length + '）')
      : ('全部锚点（' + ALL_FIELDS.length + '）');
    log((val ? '全开' : '全关') + '：' + groupLabel + '（点「保存并生效」才落盘）');
    toast('info', (val ? '已勾上' : '已取消') + n + ' 项 —— 记得点「保存并生效」', 6000);
    return n;
  }

  /** 点「按身份写阵营」：把当前选中身份的默认阵营填进输入框（不落盘） */
  function fillFactionByIdentity() {
    var mask = UI.mask;
    if (!mask) return;
    var sel = mask.querySelector('#' + q('identity'));
    var fac = mask.querySelector('#' + q('faction'));
    if (!sel || !fac) return;
    var want = IDENTITY_FACTION[sel.value] || FACTION_DEFAULT;
    fac.value = want;
    log('按身份「' + sel.value + '」填入阵营：' + want + '（点「保存并生效」才落盘）');
  }

  /** 只读刷新 */
  function reload(why) {
    renderBody();
    log('读回当前值' + (why ? '（' + why + '）' : '') + '：' + (readStatData() ? 'stat_data 可用' : '读不到 stat_data'));
    return readForm();
  }

  /** 拖动（只挂标题栏，避免和输入框抢事件） */
  function bindDrag(doc, mask) {
    var header = mask.querySelector('#' + q('header'));
    if (!header) return;
    var dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
    header.addEventListener('mousedown', function (ev) {
      if (ev.target && (ev.target.tagName === 'BUTTON' || (ev.target.closest && ev.target.closest('button')))) return;
      dragging = true;
      sx = ev.clientX; sy = ev.clientY;
      var r = mask.getBoundingClientRect();
      ox = r.left; oy = r.top;
      try {
        mask.style.left = ox + 'px'; mask.style.top = oy + 'px';
        mask.style.right = 'auto'; mask.style.bottom = 'auto';
      } catch (e) { /* 无 */ }
      ev.preventDefault();
    });
    doc.addEventListener('mousemove', function (ev) {
      if (!dragging) return;
      try {
        mask.style.left = Math.max(0, ox + (ev.clientX - sx)) + 'px';
        mask.style.top = Math.max(0, oy + (ev.clientY - sy)) + 'px';
      } catch (e) { /* 无 */ }
    });
    doc.addEventListener('mouseup', function () { dragging = false; });
  }


  function switchEra(eid) {
    var mask = UI.mask;
    if (!mask) return;
    var targetEra = NEUTRAL_ERAS.filter(function (e) { return e.id === eid; })[0];
    if (!targetEra) return;
    var yIn = mask.querySelector('#' + q('xianmengli'));
    var wIn = mask.querySelector('#' + q('xianmengliwen'));
    var tDisp = mask.querySelector('input[data-field="时间"]');
    if (yIn) yIn.value = targetEra.year;
    if (wIn) wIn.value = targetEra.text;
    if (tDisp) tDisp.value = targetEra.text;
    targetEra.anchors.forEach(function (anc) {
      var cb = mask.querySelector('input[data-known="' + anc + '"]');
      if (cb) cb.checked = true;
    });
    applyCheckStyles(mask);
    log('已切换至' + targetEra.name + '（仙盟历 ' + targetEra.year + '），并同步前置锚点（点「保存并生效」落盘）');
    toast('info', '已就绪：' + targetEra.name + ' —— 记得点「保存并生效」', 6000);
    var allCards = mask.querySelectorAll('.xshd-gm-era-card');
    for (var ci = 0; ci < allCards.length; ci++) {
      var eb = allCards[ci].querySelector('button[data-era-id]');
      if (eb && eb.getAttribute('data-era-id') === String(eid)) {
        allCards[ci].classList.add('active');
        eb.textContent = '✦ 当前时期';
        eb.classList.add('xshd-gm-active-btn');
      } else if (eb) {
        allCards[ci].classList.remove('active');
        eb.textContent = '切换至该时期';
        eb.classList.remove('xshd-gm-active-btn');
      }
    }
  }

  function bindShellButtons(mask) {
    if (!mask) return;
    var btnClose = mask.querySelector('#' + q('close'));
    if (btnClose) btnClose.onclick = function (e) { if (e) { try { e.stopPropagation(); } catch (err) {} } hide(); };
    var btnReload = mask.querySelector('#' + q('reload'));
    if (btnReload) btnReload.onclick = function (e) { if (e) { try { e.stopPropagation(); } catch (err) {} } reload('手动'); };
    var btnSave = mask.querySelector('#' + q('save'));
    if (btnSave) btnSave.onclick = function (e) { if (e) { try { e.stopPropagation(); } catch (err) {} } save(); };
    var btnAllOn = mask.querySelector('#' + q('allon'));
    if (btnAllOn) btnAllOn.onclick = function (e) { if (e) { try { e.stopPropagation(); } catch (err) {} } setGroup('all', 1); };
    var btnAllOff = mask.querySelector('#' + q('alloff'));
    if (btnAllOff) btnAllOff.onclick = function (e) { if (e) { try { e.stopPropagation(); } catch (err) {} } setGroup('all', 0); };
    var btnDump = mask.querySelector('#' + q('dump'));
    if (btnDump) btnDump.onclick = function (e) {
      if (e) { try { e.stopPropagation(); } catch (err) {} }
      dumpStat('面板手动');
      toast('info', '快照已打到控制台（F12）', 5000);
      log('快照已打到控制台');
    };
  }

  function bindBodyButtons(body) {
    if (!body) return;
    var eraBtns = body.querySelectorAll('button[data-era-id]');
    for (var i = 0; i < eraBtns.length; i++) {
      (function (b) {
        b.onclick = function (e) {
          if (e) { try { e.stopPropagation(); } catch (err) {} }
          var eid = parseInt(b.getAttribute('data-era-id'), 10);
          switchEra(eid);
        };
      })(eraBtns[i]);
    }
    var grpBtns = body.querySelectorAll('button[data-group]');
    for (var j = 0; j < grpBtns.length; j++) {
      (function (b) {
        b.onclick = function (e) {
          if (e) { try { e.stopPropagation(); } catch (err) {} }
          setGroup(b.getAttribute('data-group'), b.getAttribute('data-val') === '1');
        };
      })(grpBtns[j]);
    }
    var chips = body.querySelectorAll('.xshd-gm-chip');
    for (var k = 0; k < chips.length; k++) {
      (function (b) {
        b.onclick = function (e) {
          if (e) { try { e.stopPropagation(); } catch (err) {} }
          var fc = b.getAttribute('data-faction');
          var fac = UI.mask ? UI.mask.querySelector('#' + q('faction')) : null;
          if (fac) { fac.value = fc; log('阵营填入：' + fc + '（点「保存并生效」才落盘）'); }
        };
      })(chips[k]);
    }
    var idfac = body.querySelector('#' + q('idfaction'));
    if (idfac) {
      idfac.onclick = function (e) {
        if (e) { try { e.stopPropagation(); } catch (err) {} }
        fillFactionByIdentity();
      };
    }
  }

  /** 事件接线：委托监听 ＋ 直绑兜底双保险 */
  function bindEvents(doc, mask) {
    bindShellButtons(mask);
    mask.addEventListener('click', function (ev) {
      try { ev.stopPropagation(); } catch (e) { /* 无 */ }
      var t = ev.target;
      if (!t) return;
      var btn = (t.closest && t.closest('button, [data-era-id], [data-group], .xshd-gm-chip')) || t;
      if (btn.id === q('close')) { hide(); return; }
      if (btn.id === q('reload')) { reload('手动'); return; }
      if (btn.id === q('save')) { save(); return; }
      if (btn.id === q('allon')) { setGroup('all', 1); return; }
      if (btn.id === q('alloff')) { setGroup('all', 0); return; }
      if (btn.id === q('dump')) { dumpStat('面板手动'); toast('info', '快照已打到控制台（F12）', 5000); log('快照已打到控制台'); return; }
      if (btn.id === q('idfaction')) { fillFactionByIdentity(); return; }
      var eraId = btn.getAttribute && btn.getAttribute('data-era-id');
      if (eraId) {
        switchEra(parseInt(eraId, 10));
        return;
      }
      var g = btn.getAttribute && btn.getAttribute('data-group');
      if (g) { setGroup(g, btn.getAttribute('data-val') === '1'); return; }
      var fc = btn.getAttribute && btn.getAttribute('data-faction');
      if (fc !== null && fc !== undefined && btn.className && String(btn.className).indexOf('xshd-gm-chip') >= 0) {
        var fac = mask.querySelector('#' + q('faction'));
        if (fac) { fac.value = fc; log('阵营填入：' + fc + '（点「保存并生效」才落盘）'); }
        return;
      }
    });
    mask.addEventListener('change', function (ev) {
      var t = ev.target;
      if (!t) return;
      if (t.type === 'checkbox' && t.getAttribute('data-known')) {
        applyCheckStyles(mask);
        return;
      }
      if (t.id === q('identity')) {
        var want = IDENTITY_FACTION[t.value] || FACTION_DEFAULT;
        log('身份下拉改成「' + t.value + '」（随身份默认阵营：' + want
          + '）—— 想同步阵营就点「按身份写阵营」，再点「保存并生效」');
      }
    });
    bindDrag(doc, mask);
    mask.addEventListener('keydown', function (ev) { try { ev.stopPropagation(); } catch (e) { /* 无 */ } });
  }

  /** 挂载（幂等：清除旧死节点，重新绑定当前环境） */
  function mount() {
    var doc = getDoc();
    if (!doc || !doc.body) { warn('取不到宿主 document（跨源？）—— 面板挂不上'); return false; }
    UI.doc = doc;
    injectStyle(doc);
    var exist = null;
    try { exist = doc.getElementById('xshd-gm-mask'); } catch (e) { exist = null; }
    if (exist && exist.parentNode) {
      try { exist.parentNode.removeChild(exist); } catch (e) { /* 无 */ }
    }
    var mask = buildShell(doc);
    doc.body.appendChild(mask);
    bindShellButtons(mask);
    bindEvents(doc, mask);
    UI.mask = mask;
    UI.mounted = true;
    renderBody();
    renderLog();
    log('面板已挂载到 ' + (doc === document ? '本 iframe 的 document' : '宿主 window.parent 的 document'));
    return true;
  }


  function show() {
    if (!mount()) {
      toast('warning', 'GM 面板挂不上（取不到宿主 document），请看控制台 ' + TAG, 9000);
      return false;
    }
    UI.mask.style.display = 'flex';
    UI.open = true;
    reload('打开');
    return true;
  }
  function hide() {
    if (UI.mask) { try { UI.mask.style.display = 'none'; } catch (e) { /* 无 */ } }
    UI.open = false;
    log('面板已关闭（再调 __xsdGM() 可打开）');
    return true;
  }
  function toggle() {
    if (!UI.mounted || !UI.mask) return show();
    if (UI.open) return hide();
    return show();
  }

  /* ═══════════════════════════════════════════════════════════
   * 六 · 全局入口
   * ═══════════════════════════════════════════════════════════ */

  /** 给控制台用的小门面（不改内部状态，全部走上面的函数） */
  var GM = {
    版本: VERSION,
    打开: show,
    关闭: hide,
    开关: toggle,
    读: function () { return readForm(); },
    写: function (patch, why) { return applyPatch(patch || {}, why || '控制台写入', null); },
    解锁: function (field, val) {
      if (ALL_FIELDS.indexOf(field) < 0) { warn('未知字段「' + field + '」'); return Promise.resolve({ ok: false }); }
      var p = {}; p.known = {}; p.known[field] = (val === undefined ? true : !!val);
      return applyPatch(p, '控制台 ' + field + ' = ' + !!val, null).then(function (r) { reload('控制台写入'); return r; });
    },
    身份: function (name, faction) {
      if (IDENTITY_NAMES.indexOf(name) < 0) { warn('未知身份「' + name + '」（可用：' + IDENTITY_NAMES.join(' / ') + '）'); return Promise.resolve({ ok: false }); }
      return writeIdentity(name, faction).then(function (r) { reload('控制台改身份'); return r; });
    },
    /* ★ 2026-10-06（主人令「归属：破处者是谁，谁就是拥有者」）：
     *   名器归属表由状态机从状态栏 `<破处>` 破处簿翻译而来，这里给作者留一个手改入口。
     *   用法：GM.归属（查看）／GM.归属('九幽玄阴穴', '赵无忧')（改）／GM.归属('九幽玄阴穴', '')（清）。 */
    归属: function (relic, owner) {
      var s = readStatData() || {};
      var cur = (s.名器归属 && typeof s.名器归属 === 'object') ? Object.assign({}, s.名器归属) : {};
      if (relic === undefined) { log('当前名器归属：' + JSON.stringify(cur)); return cur; }
      if (!relic) { warn('用法：GM.归属("九幽玄阴穴", "赵无忧")；第二参传空串即清除'); return Promise.resolve({ ok: false }); }
      if (owner) cur[relic] = owner; else delete cur[relic];
      return applyPatch({ 名器归属: cur }, '控制台改名器归属 ' + relic + ' = ' + (owner || '（清）'), null)
        .then(function (r) { reload('控制台改名器归属'); return r; });
    },
    快照: function () { return dumpStat('控制台'); },
    日志: function () { return LOGS.slice(); },
    // 兼容英文手感
    open: show, close: hide, toggle: toggle, refresh: function () { return reload('控制台'); },
    read: function () { return readForm(); },
    write: function (patch, why) { return applyPatch(patch || {}, why || '控制台写入', null); },
    dump: function () { return dumpStat('控制台'); },
  };

  /** 把 __xsdGM 挂到「本窗口 ＋ parent ＋ top」——三处都挂，谁在哪个 realm 都能开关 */
  function publish(fn) {
    var wins = [];
    try { if (window) wins.push(window); } catch (e) { /* 无 */ }
    try { if (window.parent && wins.indexOf(window.parent) < 0) wins.push(window.parent); } catch (e) { /* 跨源 */ }
    try { if (window.top && wins.indexOf(window.top) < 0) wins.push(window.top); } catch (e) { /* 跨源 */ }
    for (var i = 0; i < wins.length; i++) {
      try {
        wins[i].__xsdGM = fn;
        wins[i].xsdGM = GM;
      } catch (e) { /* 跨源则跳过 */ }
    }
    return wins.length;
  }

  publish(function () { return toggle(); });

  /* ═══════════════════════════════════════════════════════════
   * 七 · 启动（绝不抛错）
   * ═══════════════════════════════════════════════════════════ */

  try {
    if (root && root.__xsdGMLoaded === VERSION) {
      console.log(TAG, VERSION + ' 已经在这台环境里跑过了，本次跳过重复初始化。');
      return;
    }
    if (root) root.__xsdGMLoaded = VERSION;
  } catch (e) { /* 无 */ }

  log(VERSION + ' 已加载。入口：控制台输入 __xsdGM()（或 window.xsdGM.打开()）；'
    + '可用接口：' + Object.keys(API).map(function (k) { return k + (API[k] ? '✔' : '✘'); }).join(' '));

  /** 稍等一拍再挂面板（有些环境里 parent.document.body 还没就绪） */
  try {
    setTimeout(function () {
      try {
        mount();
        hide();                                   // 挂好但默认收着，等玩家叫
        var snap = snapshot();
        console.log(TAG, '启动自检：' + (snap ? 'stat_data 已就绪，known 已解锁 ' + snap.已解锁.length + '/' + ALL_FIELDS.length : '还读不到 stat_data（等状态机初始化）'), snap);
      } catch (e) { warn('启动自检出错（已吞掉，不影响卡）：' + msgOf(e)); }
    }, 1600);
  } catch (e) { warn('setTimeout 不可用？' + msgOf(e)); }

})(typeof window !== 'undefined' ? window : this);
