/**
 * @module okh_app_flags
 * @updated 2026-11-25 10:42
 * @status active
 * @reason Flag 字段说明与只读存档检查
 */
(function (root) {
  'use strict'

  const u = root.OKHBackgroundModules.utils
  const once = '成功后保留，随存档回滚'
  const daily = '跨日后按新日期重新判断，下一次结算覆盖旧日期'

  const worldFields = {
    arrived_oakhaven: ['布尔', false, '玩家已抵达奥克赫斯，镇内剧情可用', once],
    arrivedDay: ['游戏日或 null', null, '抵镇日，供剧情和日程计算', once],
    ed_joined: ['布尔', false, '爱德已经加入队伍', once],
    playerRoomTarget: ['角色 ID 或 null', null, '当前同房角色', '分房、同房条件失效或拂晓时清空'],
    lastGulanRoomMin: ['分钟或 undefined', undefined, '上次与古兰同房保护的时间戳，高好感提供 2880 分钟余韵缓冲', '同房或拂晓自然分房时刷新'],
    curfew_active: ['布尔', undefined, '镇内宵禁', '清算或封路后的替代剧情分支可清除'],
    eileen_arrived: ['布尔', false, '艾琳已抵达奥克赫斯', once],
    eileen_departed: ['布尔', false, '艾琳启程离镇，护送或伏击分支由此结算', once],
    player_barony_granted: ['布尔', false, '玩家已获封男爵，供爵位权益与后续分支读取', once],
    eileen_fugitive: ['布尔', false, '艾琳线进入逃亡阶段，影响队伍日程与行动', '兰开斯特清算时清除'],
    eileen_signal_fired: ['布尔', false, '艾琳已发出王室讯号', once],
    baron_purged: ['布尔', false, '男爵已被清算', once],
    lastInnSettledDay: ['游戏日', 0, '上一笔住宿结算的日期，用于防止重复结算', '住宿结算后更新'],
    inn_arrears: ['布尔', false, '旅店住宿欠费', '补缴或相关规则清偿时清除'],
    inn_free_pass_today: ['布尔', undefined, '本晚住宿免金', '本晚住宿结算时消耗'],
    supply_shortage: ['布尔', false, '队伍补给短缺', '补足供给或结算条件恢复时清除'],
    playerOddJobDay: ['游戏日或 null', null, '玩家上次完成零工的日期', daily],
    lastGuildCommissionDay: ['游戏日或 null', null, '玩家上次完成公会委托并结算的日期', '新委托结算时覆盖，冷却仍按原规则计算'],
    lastChurchErrandDay: ['游戏日或 null', null, '玩家上次完成教堂杂务并结算的日期', '新杂务结算时覆盖，冷却仍按原规则计算']
  }

  const sharedNpcFields = {
    dailyAffectionDay: ['游戏日', undefined, '角色好感日额度所对应的日期', daily],
    dailyAffectionGain: ['数值', undefined, '已计入当日上限的好感增加值，缺失时按 0 读取', '更新当日额度时重算，部分时钟结算也会归零']
  }

  const npcFields = {
    gulan: {
      ed_hypnosis_play_done: ['布尔', undefined, '首次水晶球暗线已经触发，用于防止重复触发', once],
      gulan_rescue_count: ['整数', 0, '古兰三段式守护成功次数（0/1/2/3）', once],
      gulan_pure_bond_done: ['布尔', undefined, '已完成第三次身心缔约守护，永久关闭暗线收割', once],
      gulan_final_fall_done: ['布尔', undefined, '古兰终局暗线收割已触发', once]
    },
    isna: {
      orcCaptiveDays: ['整数', 0, '伊丝娜被黑兽人营地关押累计天数', '获救或转入泥足期时清零'],
      isnaMudDays: ['整数', 0, '伊丝娜泥足期反向间谍累计天数（0-10）', '拔除印记或转入沉沦期后停止增长'],
      isnaMudSpyCount: ['整数', 0, '泥足期第 3/6/9 天潜回营地汇报受赏次数', once],
      isnaMudOutTonight: ['布尔', false, '泥足期第 3/6/9 天夜间外出潜回营地标记，不在旅店房内', '次日拂晓后重置为 false'],
      isnaMudProbeCount: ['整数', 0, '泥足期玩家在旅店探查伊丝娜异常的次数（0/1/2）', '拔除印记后保留或随线结束'],
      isnaMudFirstProbeDay: ['整数或 null', null, '低好感首次探查时所处的泥足期天数，用于限制二次探查须跨越下一潜回周期', once],
      isnaMudTruthKnown: ['布尔', false, '玩家已知晓伊丝娜身上的兽人血契真相', once],
      isnaMudTruthDay: ['整数或 null', null, '真相揭露时的泥足期天数，用于次日白天触发同伴拔除印记交互', once],
      isnaMudSealCleared: ['布尔', false, '伊丝娜体内兽人血契印记已被同伴拔除，保住正线', once],
      isna_mud_hopeless_fled: ['布尔', false, '塞西莉亚与古兰均无法相助，伊丝娜绝望逃离旅店等待转入沉沦期', once],
      isnaFallenDay: ['整数或 null', null, '伊丝娜转入阶段 3 沉沦期时的游戏日', once]
    },
    nise: {
      nise_first_debt_done: ['布尔', undefined, '首笔赌场借据已经签下', once],
      nise_debt_known: ['布尔', undefined, '玩家已知悉妮丝的赌债', once]
    },
    aurora: {
      manor_service_active: ['布尔', undefined, '奥萝拉仍在山庄任职，供行动调度使用', '离开山庄或清算相关分支结束任职时清除'],
      aurora_manor_confessed: ['布尔', undefined, '奥萝拉已向玩家坦白山庄经历', once]
    },
    ed: {
      ed_teach_count: ['整数', undefined, '爱德累计传授次数，缺失时按 0 读取', '每次有效传授累加，无每日清零'],
      ed_teach_day: ['游戏日', undefined, '正式传授最近登记的日期，用于当日去重', daily],
      ed_stealth_ready: ['布尔', undefined, '爱德已经解锁潜行放哨', once]
    }
  }

  function rowsFor(scope, character, values, definitions) {
    const fields = new Set([...Object.keys(definitions), ...Object.keys(values)])
    return [...fields].sort().map(key => {
      const present = u.own(values, key)
      const registered = u.own(definitions, key)
      const [type, initial, description, reset] = registered
        ? definitions[key]
        : [present ? (values[key] === null ? 'null' : typeof values[key]) : undefined,
          undefined, '待登记', '待登记']
      const value = present ? values[key] : undefined
      return { scope, character, key, value: value && typeof value === 'object' ? u.clone(value) : value,
        present, registered, type, initial, description, reset }
    })
  }

  function inspect(world, scope) {
    const rows = []
    if (scope === undefined || scope === 'world') {
      rows.push(...rowsFor('world', '世界', world.flags || {}, worldFields))
    }
    for (const [id, npc] of Object.entries(world.npcs || {})) {
      if (scope !== undefined && scope !== id) continue
      const values = npc.flags || {}
      const shared = Object.fromEntries(Object.entries(sharedNpcFields)
        .filter(([key]) => scope === id || u.own(values, key)))
      const definitions = { ...shared, ...(u.own(npcFields, id) ? npcFields[id] : {}) }
      rows.push(...rowsFor(id, npc.name || id, values, definitions))
    }
    return rows
  }

  root.OKH_APP_FLAGS = Object.freeze({ inspect })
})(globalThis)
