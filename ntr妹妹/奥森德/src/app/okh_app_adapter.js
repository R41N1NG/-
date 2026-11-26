/**
 * @module okh_app_adapter
 * @updated 2026-11-27 04:22
 * @status  active
 * @reason  纯控制器桥接、台账字符串与监听快照视图；补充古兰一阶高好感血脉达到65门槛时的同房守护体感提示
 * @deps    OKHBackgroundModules.utils, OKH_APP_CONFIG, OKH_APP_TIME, OKH_APP_WORLD, OKH_APP_WORLDBOOK, OKHBackgroundAdapter
 * @provides { createController, runtimeConfig, settleTimeEffects, buildLedger, buildWatch }
 */
(function (root) {
  'use strict';

  const u = root.OKHBackgroundModules?.utils;
  const CFG = root.OKH_APP_CONFIG;
  const DATA = root.OKH_APP_DATA;
  const TIME = root.OKH_APP_TIME;
  const W = root.OKH_APP_WORLD;
  const WB = root.OKH_APP_WORLDBOOK;
  if (!u || !CFG || !TIME || !W || !WB || !root.OKHBackgroundAdapter) throw Error('adapter 依赖缺失');

  function runtimeConfig() {
    return CFG.buildConfig();
  }

  function createController(s = W.session()) {
    return root.OKHBackgroundAdapter.createController({
      config: runtimeConfig(),
      readWorld: async () => W.loadWorld(s) || await W.ensureWorld(false, s),
      commit: data => W.commit(s, data)
    });
  }

  function buildLedger(world) {
    const day = Math.floor(world.timeMin / 1440) + 1;
    const local = world.timeMin % 1440;
    const phase = u.phaseAt(world.timeMin, CFG.buildConfig());
    const label = CFG.PHASES.find(p => p.id === phase.id)?.label || phase.id;
    const clock = String(Math.floor(local / 60)).padStart(2, '0') + ':' + String(local % 60).padStart(2, '0');
    const here = Object.values(world.npcs).filter(n =>
      n.monitored === true && n.alive !== false && n.location === world.playerLocation
    );
    const lines = [
      '【第 ' + day + ' 天 · ' + CFG.weekdayLabel(day) + ' · ' + label + ' · ' + clock + '】',
      '玩家位置：' + (CFG.LOCATIONS[world.playerLocation] || world.playerLocation),
      '同地点：' + (here.map(n => n.name).join('、') || '无'),
      '可用活动解除规则：' + Object.keys(CFG.buildConfig().releaseRules).join('、') +
        '。无匹配业务条件时使用 manualRelease，等待明确 finish/cancel。'
    ];
    if (!world.flags?.arrived_oakhaven) lines.push('行程状态：前传途中（尚未抵达奥克赫斯，镇内地点暂未开放）');
    if (world.flags?.playerRoomTarget && world.npcs?.[world.flags.playerRoomTarget]) {
      lines.push('夜间同房：' + world.npcs[world.flags.playerRoomTarget].name);
    }
    const manualActs = Object.values(world.npcs || {}).filter(n => n.activity?.migratedFromReleaseRule);
    if (manualActs.length) {
      lines.push('迁移改手动结束活动（请用 finish/cancel 释放）：' + manualActs.map(n =>
        n.name + '(' + n.id + '):' + n.activity.label + '[原规则 ' + n.activity.migratedFromReleaseRule + ']'
      ).join('；'));
    }
    // Give the model registered IDs and choices, instead of making it infer
    // event_resolve attributes from narrative text. Also covers old saves.
    for (const pending of Object.values(world.bg?.eventStates || {})) {
      if (pending.status !== 'pending') continue;
      const def = CFG.buildConfig().events.find(e => e.id === pending.definitionId);
      if (!def || def.mode !== 'interaction') continue;
      const choices = Object.keys(def.outcomes || {});
      if (def.allowCancel && !choices.includes('cancel')) choices.push('cancel');
      lines.push('待决事件：id=' + JSON.stringify(def.id) +
        (pending.npcId ? ' npc=' + JSON.stringify(pending.npcId) : '') +
        '；登记选项=' + choices.map(choice => JSON.stringify(choice)).join(' / ') +
        '。仅在玩家已经作出对应选择或行动后使用 event_resolve 申报；条件由后台校验。');
    }
    if (world.focusNpcId && world.npcs[world.focusNpcId]) lines.push('本轮聚焦：' + world.npcs[world.focusNpcId].name);
    const gold = Number.isSafeInteger(world.playerState?.gold) ? world.playerState.gold : 30;
    const goldNote = world.flags?.inn_arrears
      ? '（旅店宿费欠账中：攒够 5 金自动结清；欠账期间暂不可在旅店执行实物赠礼/请酒）'
      : (world.flags?.inn_free_pass_today ? '（今晚旅店宿费已由爱德帮工抵免，免扣 5 金）' : '');
    lines.push('持有金币：' + gold + ' 金' + goldNote);
    const adventure = root.OKH_APP_ADVENTURE;
    const ps = world.playerState;
    const rank = adventure.guilds[adventure.guildRank(world)];
    if (ps && rank) {
      lines.push('小队资质：' + rank.name + '，功绩 ' + ps.guild_merit);
      const profession = root.OKH_APP_SKILLS.CLASSES[ps.currentClass];
      lines.push('主职业：' + (profession?.name ?? '待定') + '，' + ps.tier + ' 阶' +
        (ps.realmCap ? '，实战积淀 ' + ps.realmProgress + '/' + ps.realmCap : ''));
      const skills = root.OKH_APP_SKILLS.getEquipped(world);
      if (skills.length) lines.push('当前可用技能：' + skills.map(skill => skill.name + '（' + skill.desc + '）').join('、'));
    }
    const raid = world.ruinState?.current;
    if (raid) {
      lines.push('正在探索：' + raid.name + '。只有玩家提交【冒险】行动才会推进此处。');
      if (raid.atmosphere && typeof raid.atmosphere === 'object') lines.push('周围环境：' + Object.values(raid.atmosphere).join('；'));
      const room = raid.blocks[raid.currentBlockIndex];
      if (room) lines.push('眼前区域：' + room.name + '。可选行动：' + adventure.roomOptions(world, raid).join('、'));
    }
    const catalog = CFG.ITEM_CATALOG || {};
    const inv = Array.isArray(world.playerState?.inventory) ? world.playerState.inventory : [];
    const supplyEntry = inv.find(it => it && it.id === 'supply' && it.custom !== true);
    const supplyCount = Number.isSafeInteger(supplyEntry?.count) ? supplyEntry.count : 0;
    const otherItems = inv.filter(it => it && !(it.id === 'supply' && it.custom !== true)).map(it => {
      const meta = it.custom === true ? it : catalog[it.id];
      const itemName = meta?.name || it.name || it.id;
      return it.count > 1 ? (itemName + ' ×' + it.count) : itemName;
    });
    const shortageNote = world.flags?.supply_shortage
      ? '（补给不足：非旅店过夜按在场人数每人每晚耗 1 份，可在镇上或旅店按 1 金/份补充）'
      : '';
    lines.push('随身行囊：补给 ×' + supplyCount + shortageNote +
      (otherItems.length ? '｜其余物件：' + otherItems.join('、') : ''));
    const ed = world.npcs?.ed;
    if (ed && ed.monitored === true && ed.alive !== false) {
      const teachCount = ed.flags?.ed_teach_count ?? 0;
      if (teachCount > 0 || ed.flags?.ed_stealth_ready) {
        lines.push('爱德求生常识：已指导 ' + teachCount + ' 次' +
          (ed.flags?.ed_stealth_ready ? '（已解锁潜行放哨与掩护门槛）' : '（累计 3 次解锁潜行放哨）'));
      }
      if (ed.flags?.ed_intel_day === day) {
        const intelPool = [
          '粮行黑麦今早涨了半成，东街卫兵哨卡午后换防较松，城外短工雇主多在上午十点公会放榜前聚在门廊。',
          '南市铁匠铺新到一批精铁矿料，集市客商正急招护送脚夫，断剑与麦酒后厨晚间收鲜肉。',
          '圣辉大教堂清晨弥撒后有商贾布施，西街药铺最近草药紧俏，午后商业街客流相对稀疏。',
          '领主山庄巡逻队在工作日午后加紧盘查，周末镇上集市摊位最多，旅店地窖清晨常需短工帮手。'
        ];
        lines.push('爱德今日市井情报：' + intelPool[day % intelPool.length]);
      }
      if (ed.flags?.ed_asked_sister_day === day) {
        const sisterNote = world.flags?.alice_rescued
          ? '姐姐爱丽丝已重掌银月珠宝铺并驱逐席德，爱德立志留队继续历练。'
          : world.flags?.alice_truth_revealed
            ? '已查明席德借假借据并以爱德安危相胁，并握有爱丽丝暗中递出的账目破绽，待择机堂前对质。'
            : world.flags?.ed_watch_store_done
              ? '已隔街望见爱丽丝在银月珠宝铺柜台算账，神色疲惫，尚待进店近身探知真相。'
              : '已知表舅席德借假借据霸占银月珠宝铺并将爱德逐出街头，姐姐爱丽丝仍在店内受其看管。';
        lines.push('爱丽丝线索摘要：' + sisterNote);
      }
    }
    if (!raid && world.flags?.arrived_oakhaven && ['wilds', 'wilds_camp'].includes(world.playerLocation)) {
      lines.push('玩家在野外实战获胜后，可在 <status_bar> 申报一次 <combat_temper enemy_tier="1到4的单个数字"/>。后台核验位置和时间。');
    }
    if (!raid && world.flags?.arrived_oakhaven && !DATA.isEileenFugitive(world)) {
      const waitText = minutes => '冷却中（约 ' + Math.ceil(minutes / 60) + ' 小时）';
      const guildWait = DATA.workCooldownWait(world, 'lastGuildCommission', world.timeMin, 3);
      const guildStarts = DATA.recentGuildStarts(world, world.timeMin);
      if (DATA.paidWorkSettledToday(world)) lines.push('工作报酬：今天已结算一项，其他报酬须另日结算。');
      lines.push('公会委托：' + (guildStarts.length >= 2 ? '近七天的两单均已用完' : guildWait > 0 ? waitText(guildWait) : rank?.meritReq >= 20 ? '可接单（guild_normal 8 小时 / guild_high 24 小时）' : '可接见习委托（guild_normal 8 小时）'));
      const cec = world.npcs?.cecilia;
      if (cec && cec.alive !== false && (cec.stage ?? 0) < 3) {
        const churchWait = DATA.workCooldownWait(world, 'lastChurchErrand', world.timeMin, 2);
        lines.push('修道院委托：' + (churchWait > 0 ? waitText(churchWait) : '可接取（church_paid / church_volunteer，均需 3 小时）'));
      }
    }
    const edRevealDelivered = WB.isUnlocked(world, 'ed_revealed');
    if (edRevealDelivered && world.flags?.ed_final_good) {
      lines.push('【终局·真血自立】恶龙艾德现身，古兰觉醒超凡真血以命立誓正面逼退恶龙，保全自我意志守护小队。');
    } else if (edRevealDelivered && world.flags?.ed_final_abduction) {
      lines.push('【终局·以命相挟】恶龙艾德现身，古兰以死要挟换取小队众人生路，被迫随龙王回巢繁衍。');
    } else if (edRevealDelivered && world.flags?.ed_final_dark) {
      lines.push('【终局·始祖同化】古兰真血封顶并沉沦于始祖本能，化作金红龙瞳跟随生父回归龙巢。');
    } else if (world.flags?.grand_tier_3) {
      const townOrder = world.flags.baron_purged
        ? '镇内沿用清算后的通行秩序。'
        : world.flags.curfew_active ? '镇内执行雷蒙德下达的夜间宵禁。' : '';
      lines.push('【大势·剪枝封笼】峡谷官道因塌方中断。' + townOrder);
    } else if (world.flags?.grand_tier_2) {
      lines.push('【大势·惊兽乱局】城外野兽受惊向外溃逃，荒原兽人要塞严加戒备，流民涌入大教堂避难。');
    }
    const eileen = world.npcs?.eileen;
    if (eileen?.flags?.eileen_returned_capital) {
      lines.push('艾琳动向：已随兰开斯特狮鹫骑士团启程返回王都（离队）。');
    } else if (world.flags?.baron_purged) {
      lines.push('局势状态：雷蒙德男爵已遭狮鹫骑士团清算伏诛' +
        (world.flags?.player_barony_granted ? '（已定婚约并受封奥克赫斯领地爵位）' : '') + '。');
    } else if (DATA.hasEileenSignal(world)) {
      lines.push('艾琳动向：已激发原装王室魔能讯号管传讯，兰开斯特家族狮鹫骑士团将于明日空降奥克赫斯。');
    } else if (DATA.isEileenFugitive(world)) {
      const disguise = eileen?.flags?.eileen_disguised === false
        ? '未披乔装（高危暴露状态）'
        : '默认兜帽斗篷乔装遮面、收敛王徽与细剑';
      lines.push('艾琳动向：通缉流亡反攻期，全程与你位置同步同行（当前' + disguise + '；反攻值：' + (eileen?.values?.counterattack ?? 0) + '/100，满 100 解锁潜回领主馆夺管事件；入镇与赴旅店时维持低调伪装，切忌在山庄公开露面）。');
    } else if (world.flags?.eileen_arrived && !world.flags?.eileen_departed) {
      lines.push('艾琳动向：在领主山庄巡查核账（期间高傲不与见习冒险者接触）。');
    }
    const aurora = world.npcs?.aurora;
    if (aurora && aurora.alive !== false && aurora.monitored !== false) {
      if (aurora.flags?.aurora_debt_disclosed && !aurora.flags?.aurora_purged_with_baron && (aurora.values?.debt_pressure ?? 0) > 0) {
        lines.push('奥萝拉已知旧债：' + aurora.values.debt_pressure + ' 点（折合 ' + (aurora.values.debt_pressure * 10) + ' 金）');
      }
      if (aurora.flags?.aurora_purged_with_baron) {
        lines.push('奥萝拉动向：男爵倒台清算时作为其山庄情妇一并被骑士团带走处置（离队）。');
      } else if (aurora.stage >= 3 && aurora.flags?.manor_service_active) {
        lines.push('奥萝拉动向：已长留领主山庄成为男爵情妇，周末不再返店。');
      } else if (aurora.flags?.manor_service_active && !aurora.flags?.aurora_left_manor) {
        const auroraBits = [
          CFG.isWeekendDay(day)
            ? '当前周末休假在镇内归队（可于旅店/教堂碰面）'
            : '当前工作日驻守领主山庄（周六、周日返回旅店）'
        ];
        if (aurora.flags?.aurora_lord_punished) auroraBits.push('已遭男爵迁怒责罚（山庄事态提前3个工作日）');
        if (DATA.isEileenFugitive(world) && !world.flags?.baron_purged &&
            (aurora.values?.affection ?? 0) >= 80 && !aurora.flags?.aurora_eileen_intel_given) {
          auroraBits.push('暗藏山庄换防与暗锁情报待私下交接（与她同地碰头可推进反攻）');
        }
        lines.push('奥萝拉动向：在领主山庄任职抵债（' + auroraBits.join('；') + '）。');
      }
    }
    if (world.flags?.bloody_arena) {
      const curDay = day;
      const arenaDay = Number.isFinite(world.flags?.bloodyArenaDay) ? world.flags.bloodyArenaDay : 1;
      const daysPassed = curDay - arenaDay;
      const active = (world.flags?.martial_law || world.flags?.panic) || (daysPassed >= 0 && daysPassed < 7);
      if (active && daysPassed < 7) {
        const remaining = Math.max(1, 7 - daysPassed);
        lines.push('【城镇态势·演武场血案余波】演武场发生十余人暴毙血案（凶手未知）：当前全城处于［安保戒严］与［人心惶惶］状态（还剩 ' + remaining + ' 天）。');
      } else {
        lines.push('【城镇态势】演武场血案（凶手未知）已过去逾一周，戒严解除，市井议论逐渐平息。');
      }
    }
    const novelties = world.npcs?.nise?.flags?.seenNovelties;
    if (Array.isArray(novelties) && novelties.length) {
      const total = world.npcs.nise.flags.totalNovelties ?? novelties.length;
      lines.push('妮丝新奇见闻清单（共 ' + total + ' 项，勿重复记入已见旧物）：' + novelties.slice(-8).join('、'));
    }
    const nise = world.npcs?.nise;
    if (nise && (nise.stage ?? 0) < 3 && !nise.flags?.casino_debt_frozen && !nise.flags?.nise_fled_casino &&
        (nise.flags?.nise_debt_known || (nise.stage ?? 0) >= 1) && (nise.values?.gamble_debt ?? 0) > 0) {
      lines.push('妮丝已查明赌债：' + nise.values.gamble_debt + ' 点（折合 ' + (nise.values.gamble_debt * 10) + ' 金）');
    }
    const isna = world.npcs?.isna;
    if (isna && isna.alive !== false && isna.monitored !== false) {
      if (isna.flags?.isna_help_real && (isna.flags?.isna_camp_distress || isna.flags?.captured_orc) &&
          !isna.flags?.isna_fallen_orc && !isna.flags?.isna_captured_ed) {
        lines.push('伊丝娜动向：已收到她在黑兽人前哨据点（wilds_camp）遇险的求救信号，须尽快携古兰营救。');
      } else if (isna.flags?.captured_orc && !isna.flags?.isna_fallen_orc && !isna.flags?.isna_help_real) {
        lines.push('伊丝娜动向：独自外出后暂未归队，下落未明。');
      }
    }
    const gulan = world.npcs?.gulan;
    if (gulan && gulan.alive !== false && gulan.monitored !== false) {
      if (gulan.flags?.captured_orc && !world.flags?.orc_camp_destroyed) {
        if (world.flags?.gulan_note_delivered) {
          lines.push('古兰动向：留信外出营救同伴未归，特意嘱咐切勿贸然前往。');
        } else {
          lines.push('古兰动向：外出暂离，行踪未明。');
        }
      } else if (gulan.stage === 1 && !gulan.flags?.ed_hypnosis_play_done && !gulan.flags?.gulan_pure_bond_done &&
          (gulan.values?.affection ?? 0) >= 90 && (gulan.values?.blood_density ?? 0) >= 65) {
        lines.push('古兰体征异样：近夜调息时头两侧龙角根部隐隐发烫，似在强压躁动（夜宿同房照看可助其稳住心神，谨防真血反噬）。');
      }
    }
    return lines.join('\n');
  }

  function buildWatch(world) {
    const monitored = root.OKHBackground.watch(world);
    return {
      timeMin: world.timeMin,
      day: Math.floor(world.timeMin / 1440) + 1,
      list: Object.values(monitored.npcs).map(n => ({
        id: n.id,
        name: n.name,
        location: n.location,
        hasStage: n.hasStage !== false,
        stage: n.hasStage === false ? null : (CFG.STAGES[n.stage] ?? n.stage),
        hasAffection: n.hasAffection !== false,
        affectionTier: n.hasAffection === false
          ? null
          : CFG.AFFECTION_TIERS[CFG.getAffectionTier(n.values?.affection)],
        values: u.clone(n.values),
        availability: n.availability,
        activity: n.activity?.label || null,
        sameLocation: n.location === world.playerLocation
      }))
    };
  }

  root.OKH_APP_ADAPTER = Object.freeze({
    createController,
    runtimeConfig,
    settleTimeEffects: TIME.settleTimeEffects,
    buildLedger,
    buildWatch
  });
})(globalThis);

;
