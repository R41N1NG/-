/**
 * @module      okh_data
 * @updated     2026-11-09 03:20
 * @status      demo
 * @reason      数据层模板。当前所有角色、行动、事件均为占位示例，仅用于验证系统能否运转
 * @deps        ['okh_boot', 'okh_core', 'okh_schema']
 * @provides    { ACTION_LIBRARY, ROSTER, WORLD_FLAGS, EVENT_LIBRARY, seed }
 *
 * ============================================================
 * ⚠️ 重要声明
 *
 * 本文件中的一切具体内容都是**占位示例**，不是定稿：
 *   · 5 个角色的驱动力数值 —— 肥鱼按设定粗估的，未经主人确认
 *   · 19 条行动 —— 通用模板，具体叙事由主人决定
 *   · 7 个世界事件 —— 肥鱼编的示例，正式剧情事件必须由主人定
 *
 * 它们的唯一作用：证明系统能跑通。
 * 正式内容需要逐条替换，替换清单见 `待定清单.md`。
 * ============================================================
 */

(function () {
  'use strict'

  const REG = window.__OKH__
  if (!REG) { console.error('[OKH] okh_data 加载失败'); return }

  // 本模块要在加载期构造常量，所以必须显式检查依赖是否已就绪
  const schema = REG.modules.schema
  if (!schema) {
    console.error('[OKH] okh_data 加载失败：需要先加载 okh_schema（检查脚本顺序）')
    return
  }

  /** core 只在运行时用，延迟取 */
  function dep(name) {
    const m = REG.modules[name]
    if (!m) throw new Error(`[OKH] 依赖未加载：${name}`)
    return m
  }

  // ============================================================
  // 一、通用行动库（模板）
  //   ⚠️ 这 19 条是"行为类型"的通用模板，不是剧情内容。
  //      它们描述的是"去打工""去祈祷"这类抽象行为，任何角色都能引用。
  //      label / narration 的措辞可以改，tags 决定系统怎么理解它。
  //
  //   tags 是修正器认的标签，不是角色名：
  //   money 缺钱时更想做 / duty 责任感 / bond 亲近 / risk 冒险
  //   expose 曝光 / taboo 越界 / humiliate 屈辱 / social 社交 / rest 休息 / vice 放纵
  // ============================================================

  const ACTION_LIBRARY = {

    // ── 生计 ──
    work_shift: schema.makeAction('work_shift', {
      label: '去做工',
      base: 28,
      tags: ['money', 'duty'],
      requires: { phase: ['morning', 'afternoon'], drives: { need: '>50' } },
      effects: { drives: { need: -12, fear: +2 }, corruption: 0 },
      narration: '去接了份工，忙到很晚才回来。'
    }),
    work_extra: schema.makeAction('work_extra', {
      label: '接私活',
      base: 20,
      tags: ['money', 'risk', 'expose'],
      requires: { drives: { need: '>60' } },
      effects: { drives: { need: -18, shame: +4 }, corruption: 2, exposure: 2 },
      narration: '接了一份不太方便说出口的私活。'
    }),
    trade: schema.makeAction('trade', {
      label: '做点买卖',
      base: 16,
      tags: ['money', 'social'],
      requires: { phase: ['morning', 'afternoon'] },
      effects: { drives: { need: -8 }, corruption: 0 },
      narration: '在集市上摆了半天的摊。'
    }),

    // ── 日常 ──
    pray: schema.makeAction('pray', {
      label: '去祈祷',
      base: 24,
      tags: ['duty', 'rest'],
      requires: {},
      effects: { drives: { shame: -6, duty: +3, fear: -3 }, sanity: +3 },
      narration: '一个人待了很久，出来时神色平静了些。'
    }),
    rest: schema.makeAction('rest', {
      label: '歇着',
      base: 18,
      tags: ['rest'],
      requires: {},
      effects: { drives: { fear: -4 }, sanity: +2 },
      narration: '哪儿也没去，就待着。'
    }),
    care: schema.makeAction('care', {
      label: '去照顾人',
      base: 22,
      tags: ['duty', 'bond'],
      requires: {},
      effects: { drives: { duty: +5, shame: -4 }, sanity: +4 },
      narration: '去看了看需要照顾的人。'
    }),
    visit_bond: schema.makeAction('visit_bond', {
      label: '去看望亲近的人',
      base: 20,
      tags: ['bond'],
      requires: {},
      effects: { drives: { loyalty: +6, need: -2 } },
      narration: '去找了那个她放在心上的人。'
    }),
    socialize: schema.makeAction('socialize', {
      label: '和人应酬',
      base: 17,
      tags: ['social', 'expose'],
      requires: {},
      effects: { drives: { shame: -5, curiosity: +3 }, exposure: 1 },
      narration: '在一堆人里坐了半晚。'
    }),

    // ── 越界边缘 ──
    serve: schema.makeAction('serve', {
      label: '去侍奉',
      base: 22,
      tags: ['money', 'humiliate', 'taboo'],
      requires: { drives: { need: '>55' } },
      effects: { drives: { need: -20, shame: +10, fear: +5 }, corruption: 6, exposure: 3 },
      blockedBy: ['no_physical_contact'],   // 越界行为，初期被底线挡住
      narration: '陪着坐了一晚上，回来时脸色不太好。'
    }),
    gamble: schema.makeAction('gamble', {
      label: '去赌一把',
      base: 18,
      tags: ['risk', 'vice', 'money'],
      requires: { drives: { curiosity: '>45' } },
      effects: { drives: { curiosity: -5, lust: +4, fear: +5 }, corruption: 3, exposure: 3 },
      narration: '回来时手心里全是汗。'
    }),
    drink: schema.makeAction('drink', {
      label: '去喝一杯',
      base: 16,
      tags: ['vice', 'rest'],
      requires: {},
      effects: { drives: { fear: -6, shame: -5 }, corruption: 1 },
      narration: '喝到很晚，回来时脚步有点飘。'
    }),
    indulge: schema.makeAction('indulge', {
      label: '放纵一次',
      base: 14,
      tags: ['vice', 'taboo'],
      requires: { corruption: '>=30' },
      effects: { drives: { shame: +8, lust: +8 }, corruption: 8, exposure: 4 },
      narration: '做了一件她后来不愿提的事。'
    }),

    // ── 探索 / 危险 ──
    explore: schema.makeAction('explore', {
      label: '去看看',
      base: 17,
      tags: ['risk'],
      requires: { drives: { curiosity: '>50' } },
      effects: { drives: { curiosity: -8, fear: +4 }, exposure: 1 },
      narration: '跑去看了个不该看的地方。'
    }),
    sneak: schema.makeAction('sneak', {
      label: '偷偷出去',
      base: 15,
      tags: ['risk', 'expose'],
      requires: { phase: ['night', 'deep_night'] },
      effects: { drives: { fear: +6, curiosity: -4 }, corruption: 2, exposure: 3 },
      narration: '等所有人都睡了才出门。'
    }),
    resist: schema.makeAction('resist', {
      label: '顶回去',
      base: 20,
      tags: ['risk', 'pride'],
      requires: { drives: { pride: '>60' } },
      effects: { drives: { pride: +4, fear: +4 }, sanity: +2 },
      narration: '没有让步，硬顶了回去。'
    }),
    submit: schema.makeAction('submit', {
      label: '忍下来',
      base: 18,
      tags: ['humiliate'],
      requires: {},
      effects: { drives: { shame: +5, fear: +3 }, corruption: 3 },
      narration: '什么也没说，低下了头。'
    }),

    // ── 掩饰 ──
    conceal: schema.makeAction('conceal', {
      label: '把事瞒下来',
      base: 19,
      tags: ['expose'],
      requires: { corruption: '>=20' },
      effects: { drives: { fear: +3, shame: +4 }, exposure: -8 },
      narration: '把那件事圆了过去，谁也没起疑。'
    }),
    confess: schema.makeAction('confess', {
      label: '说出来',
      base: 12,
      tags: ['bond', 'risk'],
      requires: { drives: { loyalty: '>65' } },
      effects: { drives: { shame: -10, loyalty: +5 }, sanity: +5, exposure: -3 },
      narration: '终于对某个人说了实话。'
    }),
    show_off: schema.makeAction('show_off', {
      label: '显摆一下',
      base: 15,
      tags: ['social', 'pride'],
      requires: {},
      effects: { drives: { pride: +6 }, corruption: 0 },
      narration: '拿着新东西在人前晃了一圈。'
    })
  }

  // ============================================================
  // 二、示例花名册（占位，非定稿）
  //   ⚠️ 这 5 个人的驱动力数值是肥鱼按设定粗估的，仅用于跑通测试。
  //      正式数值需主人逐条确认后替换。
  //
  //   全部是数据，可以随意增删改。代码不认识任何一个人的名字。
  //
  //   关于 monitored 字段：
  //     · 默认 true —— 每轮都会输出她的位置与状态到监听面板
  //     · 主角、反派等不需要监听的角色，加 monitored: false
  //     · 监听数据只写变量和隐藏容器，不进提示词，不占 token
  // ============================================================

  const ROSTER = [
    schema.makeNpc('aurora', {
      name: '奥萝拉',
      archetype: 'gentle',
      drives: { duty: 70, shame: 65, fear: 50, need: 75, loyalty: 60 },
      location: 'church',
      schedule: {
        morning: ['church', 'town'],
        afternoon: ['town', 'manor'],
        night: ['manor', 'inn'],
        deep_night: ['inn']
      },
      actions: ['work_shift', 'work_extra', 'pray', 'care', 'visit_bond', 'serve', 'conceal', 'confess', 'rest'],
      lines: [
        { id: 'no_contact', type: 'no_physical_contact', holdsWhile: { corruption: '<30' } },
        { id: 'no_admit', type: 'no_admit', holdsWhile: { corruption: '<70' } },
        { id: 'keep_orphans', type: 'never_abandon', holdsWhile: { corruption: '<999' } }
      ],
      priority: 2,
      cue: '女仆装',
      baseText: '性情柔顺，说话轻声细语，遇事先道歉。背负家中债务，靠做女仆的微薄薪水撑着。'
    }),

    schema.makeNpc('nise', {
      name: '妮丝',
      archetype: 'brat',
      drives: { pride: 80, curiosity: 75, lust: 40, fear: 30 },
      location: 'inn',
      schedule: {
        morning: ['inn', 'town'],
        afternoon: ['town', 'casino'],
        night: ['casino', 'inn'],
        deep_night: ['inn']
      },
      actions: ['show_off', 'gamble', 'explore', 'sneak', 'socialize', 'drink', 'resist', 'rest', 'indulge'],
      lines: [
        { id: 'no_weak', type: 'no_admit', holdsWhile: { corruption: '<60' } },
        { id: 'keep_mockery', type: 'never_abandon', holdsWhile: { corruption: '<999' } }
      ],
      priority: 1,
      cue: '金发双马尾',
      baseText: '嘴上从不认输，越是被说越要顶回去。好奇心重，越是不让去的地方越想去。'
    }),

    schema.makeNpc('eileen', {
      name: '艾琳',
      archetype: 'proud',
      drives: { pride: 95, duty: 70, fear: 45, shame: 55 },
      location: 'manor',
      schedule: {
        morning: ['manor'],
        afternoon: ['manor', 'town'],
        night: ['manor'],
        deep_night: ['manor']
      },
      actions: ['resist', 'work_shift', 'pray', 'socialize', 'explore', 'conceal', 'submit', 'rest'],
      lines: [
        { id: 'no_bow', type: 'no_public_shame', holdsWhile: { corruption: '<50' } },
        { id: 'fight_back', type: 'resist', holdsWhile: { corruption: '<75' } }
      ],
      priority: 3,
      cue: '白金制服',
      baseText: '王都来的巡查使，仪态端正，坚信自己代表王国主持公道，对边陲的险恶一无所知。'
    }),

    schema.makeNpc('cecilia', {
      name: '塞西莉亚',
      archetype: 'saint',
      drives: { duty: 85, loyalty: 80, shame: 70, need: 60 },
      location: 'church',
      schedule: {
        morning: ['church'],
        afternoon: ['church', 'town'],
        night: ['church'],
        deep_night: ['church']
      },
      actions: ['care', 'pray', 'work_shift', 'serve', 'conceal', 'confess', 'submit', 'rest'],
      lines: [
        { id: 'keep_orphans', type: 'never_abandon', holdsWhile: { corruption: '<999' } },
        { id: 'no_public', type: 'no_public_shame', holdsWhile: { corruption: '<65' } }
      ],
      priority: 2,
      cue: '修女袍',
      baseText: '修女长，待人温和，恪守戒律。为维持修道院的救济与孤儿收容，不得不频频向镇上金主低头。'
    }),

    schema.makeNpc('gulan', {
      name: '古兰',
      archetype: 'stern',
      drives: { pride: 75, duty: 90, fear: 20, loyalty: 85 },
      location: 'inn',
      schedule: {
        morning: ['inn', 'town'],
        afternoon: ['town'],
        night: ['inn'],
        deep_night: ['inn']
      },
      actions: ['work_shift', 'resist', 'care', 'rest', 'socialize', 'explore'],
      lines: [
        { id: 'keep_pride', type: 'no_public_shame', holdsWhile: { corruption: '<999' } }
      ],
      priority: 3,
      cue: '抱臂站着',
      baseText: '小队队长，威严寡言。为磨砺后辈坚持不代劳，凡事只给一句提点。'
    })
  ]

  const WORLD_FLAGS = {
    // ⚠️ 占位标记，正式开局状态待定
    lord_offered_job: true
  }

  // ============================================================
  // 二·补、世界事件库（示例，非定稿）
  //   ⚠️ 下面 7 个事件是肥鱼编的占位示例，只为演示触发机制。
  //      正式剧情事件必须由主人逐条确定——写什么、什么时候发生、
  //      发生之后谁受影响、影响多少。
  //
  //   结构说明（写正式事件时照这个填）：
  //     trigger 决定"什么时候发生"
  //     effects 决定"发生什么"
  //     narration 会写进台账，AI 能看到
  // ============================================================

  const EVENT_LIBRARY = {

    // ── 开局：领主府放话招人 ──
    lord_hiring: {
      id: 'lord_hiring',
      label: '领主府放出招工消息',
      once: true,
      narration: '领主府放出消息，说要招几个手脚勤快的女仆，工钱给得比镇上高出一截。',
      trigger: { dayMin: 1, phase: ['morning', 'afternoon'] },
      effects: {
        target: null,
        setFlags: { lord_hiring: true }
      }
    },

    // ── 第 2 天：赌场开张 ──
    casino_open: {
      id: 'casino_open',
      label: '地下赌场开张',
      once: true,
      narration: '镇子东头那家赌场重新开张了，门口站着两个黑塔一样的保镖。',
      trigger: { dayMin: 2, phase: ['night', 'deep_night'] },
      effects: {
        target: null,
        setFlags: { casino_unlocked: true }
      }
    },

    // ── 第 3 天：讨债上门 ──
    debt_collector: {
      id: 'debt_collector',
      label: '债主找上门',
      once: true,
      narration: '有人在旅店门口堵住了奥萝拉，声音不大，但说得很清楚。',
      trigger: { dayMin: 3, phase: ['afternoon', 'night'] },
      effects: {
        target: 'aurora',
        drives: { need: 15, fear: 12, shame: 8 },
        narration: '奥萝拉被堵在旅店门口，脸色白了好一阵。'
      }
    },

    // ── 第 4 天：巡查使抵达 ──
    eileen_arrive: {
      id: 'eileen_arrive',
      label: '王国巡查使抵达',
      once: true,
      narration: '一队人马从东边官道进了镇，打头的是个穿白金制服的年轻女人。',
      trigger: { dayMin: 4, phase: ['morning', 'afternoon'] },
      effects: {
        target: 'eileen',
        move: 'manor',
        setFlags: { eileen_arrived: true }
      }
    },

    // ── 第 5 天：修道院断粮 ──
    convent_shortage: {
      id: 'convent_shortage',
      label: '修道院断了粮',
      once: true,
      narration: '修道院的存粮见了底，孩子们一天只吃一顿。',
      trigger: { dayMin: 5, phase: ['morning', 'afternoon'] },
      effects: {
        target: 'cecilia',
        drives: { need: 20, duty: 10 },
        narration: '塞西莉亚把最后一点面粉分给了孩子。'
      }
    },

    // ── 条件型：有人堕落过线 ──
    first_crack: {
      id: 'first_crack',
      label: '有人开始变了',
      once: true,
      narration: '镇上开始有人私下议论，说某个人最近看着不太一样了。',
      trigger: {
        anyNpc: { corruption: '>=30' },
        phase: ['night']
      },
      effects: {
        target: null,
        setFlags: { rumor_started: true }
      }
    },

    // ── 条件型：曝光度过高，流言四起 ──
    rumor_spread: {
      id: 'rumor_spread',
      label: '流言传开了',
      once: true,
      narration: '关于某人的闲话在酒馆里传了一圈，说得有鼻子有眼。',
      trigger: {
        anyNpc: { exposure: '>=50' },
        chance: 0.6
      },
      effects: {
        target: null,
        setFlags: { town_gossip: true }
      }
    },

    // ── 条件型：领主动手了 ──
    lord_moves: {
      id: 'lord_moves',
      label: '领主开始收网',
      once: true,
      narration: '领主府的管事开始频繁地派人来镇上走动，说是办事，眼睛却在到处看。',
      trigger: {
        dayMin: 6,
        anyNpc: { corruption: '>=40' }
      },
      effects: {
        target: null,
        setFlags: { lord_aggressive: true }
      }
    }
  }

  // ============================================================
  // 三、装载
  // ============================================================

  /**
   * 把数据写进变量池
   * @param {boolean} force 为 true 时覆盖已有数据
   * @returns {object}
   */
  function seed(force = false) {
    const core = dep('core')
    const has = core.has('npcs') && Object.keys(core.read('npcs', {})).length > 0
    if (has && !force) {
      console.log('[OKH] 数据已存在，跳过装载（要覆盖请传 true）')
      return { seeded: false, count: Object.keys(core.read('npcs', {})).length }
    }

    // 行动库
    const lib = {}
    for (const [k, v] of Object.entries(ACTION_LIBRARY)) lib[k] = v
    core.write('actionLibrary', lib)

    // 事件库
    const evLib = {}
    for (const [k, v] of Object.entries(EVENT_LIBRARY)) evLib[k] = v
    core.write('eventLibrary', evLib)
    core.write('events_fired', [])

    // 角色
    const npcs = {}
    const baseD1 = {}
    for (const npc of ROSTER) {
      npcs[npc.id] = { ...npc }
      baseD1[npc.id] = npc.baseText || ''
    }
    core.write('npcs', npcs)
    core.write('base_d1', baseD1)

    // 世界
    core.write('world.flags', { ...WORLD_FLAGS })
    core.write('player.room_id', schema.DEFAULT_ROOM)

    // 系统
    core.write('sys.total_min', 6 * 60)      // 第 1 天 06:00 开局
    core.write('sys.phase', 'morning')
    core.write('sys.turn_index', 0)
    core.write('sys.last_seen', {})
    core.write('events', [])
    core.write('present', [])

    // 初次渲染 char_d1
    for (const npc of ROSTER) {
      REG.modules.translate.writeCharD1(npc.id, npc, core.read, core.write)
    }

    console.log(`[OKH] 数据已装载 · ${ROSTER.length} 个角色 / ${Object.keys(lib).length} 个行动 / ${Object.keys(evLib).length} 个事件`)
    return { seeded: true, count: ROSTER.length, actions: Object.keys(lib).length, events: Object.keys(evLib).length }
  }

  REG.modules.data = { ACTION_LIBRARY, ROSTER, WORLD_FLAGS, EVENT_LIBRARY, seed }

  console.log('[OKH] data 已就绪 · 行动库 ' + Object.keys(ACTION_LIBRARY).length +
              ' 条 / 事件库 ' + Object.keys(EVENT_LIBRARY).length + ' 条')
})()
