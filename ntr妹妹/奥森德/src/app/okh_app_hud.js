/**
 * @module okh_app_hud
 * @updated 2026-11-23 20:12
 * @status  active
 * @reason  将对白气泡引擎解耦至专用模块 okh_bubble_side，HUD 聚焦状态栏、手札与相册渲染，保障职责清晰与独立运行
 * @deps    ['OKH_APP_CONFIG', 'OKH_APP_WORLD', 'OKH_APP_ADAPTER']
 * @provides { setWatchVisible, setAssetBase, LOCATION_NAMES, phaseName, locName, buildHudHtml, buildWatchHtml, render, startHud, stopHud }
 */
(function (root) {
  'use strict'

  const W = root.OKH_APP_WORLD
  const A = root.OKH_APP_ADAPTER
  const CFG = root.OKH_APP_CONFIG
  const MAP = root.OKH_APP_MAP
  const ALBUM = root.OKH_APP_ALBUM
  const DOSSIERS = /* __OKH_DOSSIER_PANELS__ */ {}
  // 酒馆助手脚本可能运行在同源 iframe；样式、挂载与输入统一使用聊天文档。
  const document = (() => {
    const own = root.document
    if (own?.querySelector?.('#chat,[data-okh-hud]')) return own
    try {
      const host = root.parent !== root ? root.parent?.document : null
      if (host?.querySelector?.('#chat')) return host
    } catch (_) {}
    return own
  })()
  if (!W || !A || !CFG) {
    console.error('[APP] hud 加载失败：需要 world、adapter 与 config')
    return
  }

  const LOCATION_NAMES = CFG.LOCATIONS
  const PHASE_NAMES = CFG.PHASES.map((p, i) => ({ max: CFG.PHASES[i + 1]?.start ?? 1440, name: p.label || p.id }))

  // 构建期由 build.cjs 注入 Data URI；未构建直跑时回退至本地相对路径
  const ASSET_UI = {
    journalBg: resolveUiAsset('__OKH_UI_JOURNAL_BG__', 'assets/ui/journal_bg_1.webp'),
    darkBg: resolveUiAsset('__OKH_UI_DARK_PARCHMENT__', 'assets/ui/dark_parchment_bg.webp'),
    corner: resolveUiAsset('__OKH_UI_FOOTER_ACCENT__', 'assets/ui/footer_accent.png'),
    seal: resolveUiAsset('__OKH_UI_WAX_SEAL__', 'assets/ui/wax_seal_3d.svg')
  }

  let assetBase = typeof root.OKH_HUD_ASSET_BASE === 'string' ? root.OKH_HUD_ASSET_BASE : 'assets/'
  let watchVisible = false
  let activeTab = 'dispatch'
  let activePresentId = null
  const openRosterIds = new Set()
  let dossier = null
  let albumCharacter = 'gulan'
  let portraitChoices = {}
  let albumLightbox = null
  let lightboxReturnFocus = null
  let autoMount = root.OKH_HUD_AUTO_MOUNT !== false
  let renderedSession = null
  let lastRenderSignature = null
  let renderRevision = 0

  function mapSessionKey() {
    try { return W.chatId() } catch (_) { return 'default' }
  }

  function isLocationHidden(npc) {
    return MAP ? MAP.isLocationHidden(npc) : Boolean(npc.flags?.gulan_departed || npc.flags?.captured_orc || npc.flags?.captured_manor)
  }

  function resolveUiAsset(token, fallback) {
    return token.startsWith('data:') ? token : fallback
  }

  function joinAsset(relPath) {
    const base = String(assetBase || '').replace(/\/+$/, '')
    return base ? `${base}/${relPath}` : relPath
  }

  function phaseName(local) {
    return (PHASE_NAMES.find(p => local < p.max) || PHASE_NAMES[PHASE_NAMES.length - 1]).name
  }

  function locName(key) {
    return LOCATION_NAMES[key] || key || '未知地点'
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function formatClock(timeMin) {
    const safeMin = Math.max(0, Number(timeMin) || 0)
    const day = Math.floor(safeMin / 1440) + 1
    const local = safeMin % 1440
    const hour = String(Math.floor(local / 60)).padStart(2, '0')
    const minute = String(local % 60).padStart(2, '0')
    return { day, local, phase: phaseName(local), weekday: CFG.weekdayLabel(day), clock: `${hour}:${minute}` }
  }

  // ============================================================
  // 一、角色公开档案、通俗事件名与快捷交互映射（严禁剧透）
  // ============================================================

  const CHAR_META = {
    gulan: {
      sigil: '⚔', role: '半龙人剑士',
      bio: '伯里与妮丝的母亲，威严寡言，以武道身教磨砺后辈，从不代劳琐事。',
      actions: [
        { label: '请教剑术或对练', prompt: '向古兰请教剑术并约一场对练', tag: '对练请教' },
        { label: '照料起居或打理剑具', prompt: '帮古兰擦拭打理重剑并照料日常起居', tag: '日常照料' }
      ]
    },
    isna: {
      sigil: '🗡', role: '猫耳斥候',
      bio: '身手灵巧、市井老练，嗜酒贪食，对商道行情与银钱颇为敏锐。',
      actions: [
        { label: '分食小酌或闲聊宽慰', prompt: '邀伊丝娜坐下分些酒肉闲聊宽慰', tag: '同伴闲聊' },
        { label: '并肩探哨留意街面动静', prompt: '与伊丝娜并肩打探附近风声与动向', tag: '斥候探哨' }
      ]
    },
    nise: {
      sigil: '✧', role: '见习法师',
      bio: '伯里之妹，骄傲好胜、好奇心旺，热衷钻研法术与新奇物件。',
      actions: [
        { label: '探讨法术笔记或稳心指点', prompt: '坐下来陪妮丝探讨法术笔记并指点施法细节', tag: '法术研讨' },
        { label: '兄妹闲聊或陪她见识新鲜事', prompt: '顺着妮丝的话题斗嘴闲聊，带她看看附近的新奇事物', tag: '日常陪伴' }
      ]
    },
    aurora: {
      sigil: '†', role: '见习牧师',
      bio: '温顺内敛的随队医护与随侍，身负家族旧债，默默分担着杂务。',
      actions: [
        { label: '分担杂务或致谢照拂', prompt: '上前帮奥萝拉分担手头杂务并轻声宽慰她', tag: '分担照拂' },
        { label: '陪赴圣辉大教堂祈祷', prompt: '陪奥萝拉一同前往圣辉大教堂静心祈祷', tag: '教堂祈祷' }
      ]
    },
    eileen: {
      sigil: '⚜', role: '王国三等巡查使',
      bio: '王都名门出身，奉王国之命巡查奥克赫斯账目与防务，仪态矜持严谨。',
      actions: [
        { label: '复盘局势并筹备反攻', prompt: '与艾琳私下复盘山庄防务，商议下一步反攻筹备', tag: '反攻筹备' },
        { label: '照料起居并打气宽慰', prompt: '替艾琳留意周遭隐蔽并温言宽慰打气', tag: '流亡照料' }
      ]
    },
    cecilia: {
      sigil: '✝', role: '圣辉修女',
      bio: '驻守圣辉大教堂，主持晨昏弥撒并独自支撑镇内孤儿院的生计。',
      actions: [
        { label: '参加弥撒或照看孤儿', prompt: '留在教堂参加祈祷，并搭手协助塞西莉亚照看孤儿院孩童', tag: '教堂协助' },
        { label: '协助采买炮制伤药', prompt: '帮塞西莉亚采购草药并整理医务柜', tag: '草药帮手' }
      ]
    },
    ed: {
      sigil: '🪶', role: '随行后勤',
      bio: '银月珠宝铺遗孤，八岁人类幼童，勤勉机敏，获救后随小队打理杂务。',
      actions: [
        { label: '打听镇上动态', prompt: '向爱德打听今日镇上的市井动态、物价行情与公会放榜风声', tag: '市井情报' },
        { label: '指导求生常识', prompt: '趁着空闲指导爱德野外识路、潜行避险或核对账目的求生常识', tag: '常识教学' },
        { label: '询问姐姐近况', prompt: '轻声询问爱德关于姐姐爱丽丝与银月珠宝铺的近况线索', tag: '安抚询问' }
      ]
    },
    alice: {
      sigil: '💎', role: '银月珠宝铺掌柜之女',
      bio: '爱德的胞姐，端庄娴静，现于银月珠宝铺柜台理货算账。',
      actions: [
        { label: '借选购首饰上前搭话', prompt: '借选购宝石首饰为由走近柜台，低声向爱丽丝试探铺内近况', tag: '柜台试探' },
        { label: '直接提及爱德安好下落', prompt: '压低声音直接告诉爱丽丝，爱德已被小队救下且安然无恙', tag: '传递真相' }
      ]
    },
    sid: {
      sigil: '🪙', role: '银月珠宝铺代掌柜',
      bio: '高夫家远房表舅，举止圆滑，正以借据代管银月珠宝铺账目。',
      actions: [
        { label: '查问铺面借据与账册', prompt: '以公会冒险者身份查问银月珠宝铺的借据与掌柜账目', tag: '账目质询' }
      ]
    }
  }

  const EVENT_TITLES = {
    gulan_final_rescue_prompt: '龙血躁动 · 守夜相伴',
    isna_tavern_rumor_notice: '酒馆流言 · 斥候心绪',
    isna_alley_lockpick_spot: '暗巷微光 · 斥候试探',
    isna_pendant_exchange: '夜谈信物 · 成对吊坠',
    isna_wilds_rescue_real: '荒原急援 · 黑兽人据点',
    eileen_escort_offer: '巡查使请托 · 突围护送',
    aurora_pass_manor_intel: '山庄密信 · 换防情报',
    eileen_reclaim_tube: '反攻夺管 · 潜回山庄',
    cecilia_manor_appeal_1: '修女求助 · 教堂困境',
    cecilia_manor_appeal_2: '修女求助 · 孤儿院告急',
    cecilia_manor_appeal_3: '修女求助 · 最终危机',
    cecilia_reward_1_oral: '夜祷廊下 · 修女心意',
    cecilia_reward_2_thighs: '夜祷廊下 · 亲密回馈',
    cecilia_reward_3_sex: '夜祷廊下 · 倾心相托',
    ed_investigate_truth: '银月珠宝铺 · 探知真相',
    ed_intercept_job_1: '公会急件抢截 · 加急货样',
    ed_intercept_job_2: '公会急件抢截 · 仓栈急工',
    ed_intercept_job_3: '公会急件抢截 · 镇郊寻回',
    ed_intercept_job_4: '公会急件抢截 · 特急送达',
    ed_daily_perk_1: '旅店营生回扣 · 集市砍价',
    ed_daily_perk_2: '旅店营生回扣 · 地窖转运',
    ed_daily_perk_3: '旅店营生回扣 · 后厨分食',
    ed_daily_perk_4: '旅店营生回扣 · 修补桌椅',
    wilds_rescue_trap_mud_high: '荒原伏击 · 破围突脱',
    wilds_rescue_trap_mud_low: '荒原暗算 · 受困要塞',
    gulan_rescue_note_delivered: '爱德的转交 · 师傅的告诫',
    gulan_rescue_player_rush_camp: '戒备森严 · 无功而返',
    gulan_orc_camp_destroyed_resolve_with_note: '天火覆灭 · 古兰归队自述',
    gulan_orc_camp_destroyed_resolve_no_note: '天火覆灭 · 古兰归队自述'
  }

  const CHOICE_MAP = {
    rescue: { title: '留守陪伴调息，稳住她翻涌的龙血', hint: '守护相伴' },
    fail: { title: '一时措手不及，未能及时拉住她', hint: '错失时机' },
    hire_mercenaries: { title: '出资 200 金赴公会雇佣三阶讨伐队声东击西救出古兰', hint: '重金营救' },
    knight_purge_rescue: { title: '请动兰开斯特狮鹫骑士团清剿黑兽人营地救回古兰', hint: '骑士团平推' },
    pay_fine: { title: '取出 40 枚金币交给治安官破财消灾，平息演武场旧案', hint: '赔款平息' },
    expose_poison: { title: '当众揭穿地痞暗燃违禁催情异香伏击在先，据理驳回勒索', hint: '据理反驳' },
    gulan_intimidate: { title: '由古兰按剑压阵外放龙威，冷声逼退登门镇卫', hint: '按剑震慑' },
    soothe: { title: '坐到伊丝娜身旁温言宽慰，陪她消解浮躁', hint: '宽慰安抚' },
    ignore: { title: '暂且不加干涉，各自回房歇息', hint: '暂且搁置' },
    intercept: { title: '及时上前拦住伊丝娜，拉她离开暗巷谈清利害', hint: '及时劝阻' },
    miss: { title: '慢了一步，没能拦下她的举动', hint: '错失阻拦' },
    accept_pendant: { title: '郑重接过她递来的半枚吊坠并贴身收好', hint: '互换信物' },
    decline_pendant: { title: '婉拒这份贵重旧物，只陪她静静饮完余酒', hint: '礼貌婉拒' },
    rescue_now: { title: '即刻随古兰动身赶往黑兽人前哨据点营救伊丝娜', hint: '星夜驰援' },
    accept: { title: '应下眼前的请托与心意', hint: '欣然应允' },
    decline: { title: '婉拒冒险介入，先保小队眼下周全', hint: '审慎婉拒' },
    receive_intel: { title: '私下接过奥萝拉暗中带出的山庄换防情报', hint: '接收情报' },
    strike: { title: '按既定计划潜回领主山庄，夺回王室讯号管', hint: '展开夺管' },
    help: { title: '设法筹款周转，拦下塞西莉亚前往领主山庄', hint: '出手解围' },
    let_go: { title: '一时无力兜底，只能由她自行抉择', hint: '无力阻拦' },
    probe_direct_mention: { title: '直接提及爱德安好下落，开门见山探问内情', hint: '直询真相' },
    probe_inquire_debt: { title: '借选购宝石切入，探问铺面债务与席德内幕', hint: '委婉试探' },
    accept_direct: { title: '当机立断，前去私洽接下急件差事', hint: '现结入账' },
    negotiate_teach: { title: '教爱德甄别雇主信用并协商补贴', hint: '加赏+教学' },
    accept_perk: { title: '收下掌柜折让优惠，肯定爱德的持家付出', hint: '免租/折抵' },
    trade_teach: { title: '将折让换作干粮贴补，并教爱德爱惜力气', hint: '贴补+教学' },
    cancel: { title: '暂缓决定，容后再议', hint: '暂且搁置' }
  }

  // ============================================================
  // 二、数据抽取（只读 world，绝不改写状态）
  // ============================================================

  function getPendingInteractions(world) {
    const events = CFG.EVENTS || []
    const out = []
    for (const st of Object.values(world.bg?.eventStates || {})) {
      if (st?.status !== 'pending') continue
      const def = events.find(e => e.id === st.definitionId)
      if (!def || def.mode !== 'interaction') continue
      const npc = st.npcId ? world.npcs?.[st.npcId] : null
      const text = String(def.text || '').replace(/\{(name|location)\}/g, (_, k) => {
        if (k === 'name') return npc?.name || ''
        return locName(npc?.location || world.playerLocation)
      })
      const choices = Object.keys(def.outcomes || {})
      if (def.allowCancel && !choices.includes('cancel')) choices.push('cancel')
      out.push({
        id: def.id,
        npcId: st.npcId || null,
        title: EVENT_TITLES[def.id] || '当前待决事项',
        text,
        choices
      })
    }
    return out
  }

  function getPresentCharacters(world, pendingList) {
    const map = new Map()
    const npcs = Object.values(world.npcs || {})
    for (const n of npcs) {
      if (n.monitored === true && n.alive !== false && !isLocationHidden(n) && n.location === world.playerLocation) {
        map.set(n.id, buildCharView(world, n))
      }
    }
    // 纳入当前待决事件关联人物，不局限于随行同伴
    for (const ev of pendingList) {
      if (ev.npcId && !map.has(ev.npcId) && world.npcs?.[ev.npcId]) {
        map.set(ev.npcId, buildCharView(world, world.npcs[ev.npcId]))
      }
      if (ev.id === 'ed_investigate_truth') {
        if (!map.has('alice')) map.set('alice', buildSceneNpcView(world, 'alice', '爱丽丝', '柜台算账 · 受胁隐忍'))
        if (!map.has('sid')) map.set('sid', buildSceneNpcView(world, 'sid', '席德', '内堂掌账 · 戒备打量'))
      }
    }
    return Array.from(map.values())
  }

  function buildCharView(world, npc) {
    const meta = CHAR_META[npc.id] || { sigil: '◈', role: '同行人物', bio: '当前与你同处一地。', actions: [] }
    const affVal = npc.hasAffection !== false ? Math.round(npc.values?.affection ?? 0) : null
    const affTier = affVal !== null ? (CFG.AFFECTION_TIERS[CFG.getAffectionTier(affVal)] || '普通') : null
    const isDeparted = isLocationHidden(npc)
    const stance = isDeparted
      ? '暂离'
      : (npc.activity ? npc.activity.label : (npc.location === world.playerLocation ? '同地驻留' : locName(npc.location)))
    const metrics = []
    if (affTier !== null) metrics.push({ label: '关系情谊', val: `${affTier} (${affVal})` })
    metrics.push({ label: '当前位置', val: isDeparted ? '暂离' : locName(npc.location) })
    if (npc.id === 'ed') {
      metrics.push({ label: '随行状态', val: world.flags?.alice_rescued ? '立志历练' : '随队后勤' })
      const teachCnt = npc.flags?.ed_teach_count ?? 0
      metrics.push({
        label: '求生常识',
        val: npc.flags?.ed_stealth_ready ? `已掌握潜行放哨 (${teachCnt}次)` : `${teachCnt} / 3 次`
      })
    }
    if (npc.id === 'eileen' && world.flags?.eileen_fugitive && !world.flags?.baron_purged) {
      metrics.push({ label: '反攻筹备', val: `${Math.round(npc.values?.counterattack ?? 0)} / 100` })
    }
    if (npc.id === 'cecilia' && npc.monitored === true) {
      metrics.push({ label: '孤儿院资金', val: `${Math.round(npc.values?.orphanage_funds ?? 0)}` })
    }
    if (npc.id === 'aurora' && npc.flags?.aurora_debt_disclosed && (npc.values?.debt_pressure ?? 0) > 0) {
      metrics.push({ label: '已知旧债', val: `${Math.round(npc.values.debt_pressure * 10)} 金` })
    }
    if (npc.id === 'nise' && (npc.flags?.nise_debt_known || (npc.stage ?? 0) >= 1) && (npc.values?.gamble_debt ?? 0) > 0) {
      metrics.push({ label: '查明赌债', val: `${Math.round(npc.values.gamble_debt * 10)} 金` })
    }
    let bio = meta.bio
    let actions = (meta.actions || []).slice()
    const arrived = Boolean(world.flags?.arrived_oakhaven)
    if (npc.id === 'ed') {
      if (!world.flags?.ed_awake) {
        bio = '荒原商队遇袭后救下的瘦弱男童，惊魂未定，暂由小队照看。'
      } else if (!world.flags?.ed_permanently_joined) {
        bio = '奥克赫斯商铺的孩子，商队遇袭后获救，暂随小队同行照料。'
      }
      actions = actions.filter(a => {
        if (a.tag === '市井情报' && !arrived) return false
        if (a.tag === '安抚询问' && !world.flags?.ed_permanently_joined) return false
        return true
      })
    } else if (npc.id === 'aurora' && !arrived) {
      actions = actions.map(a => a.tag === '教堂祈祷'
        ? { label: '夜间宽慰或照拂伤药', prompt: '在营地坐到奥萝拉身旁温言宽慰，并替她搭手整理药包', tag: '营地宽慰' }
        : a)
    }
    return {
      id: npc.id,
      name: npc.name,
      sigil: meta.sigil,
      role: meta.role,
      bio,
      stance,
      affLabel: affTier !== null ? `${affTier} ${affVal}` : '随行伙伴',
      affIsLove: affVal !== null && affVal >= 90,
      metrics,
      actions: isDeparted ? [] : actions,
      portraitPath: ALBUM?.portrait(world, npc.id, portraitChoices)?.src || joinAsset(`portraits/${npc.id}.png`)
    }
  }

  function buildSceneNpcView(world, id, name, stance) {
    const meta = CHAR_META[id] || { sigil: '◈', role: '在场人物', bio: '', actions: [] }
    return {
      id,
      name,
      sigil: meta.sigil,
      role: meta.role,
      bio: meta.bio,
      stance,
      affLabel: '场景人物',
      affIsLove: false,
      metrics: [{ label: '当前态势', val: stance }],
      actions: meta.actions || [],
      portraitPath: ALBUM?.portrait(world, id, portraitChoices)?.src || joinAsset(`portraits/${id}.png`)
    }
  }

  function getChronicleItems(world) {
    const items = []
    const seen = new Set()
    const queue = Array.isArray(world.bg?.queue) ? world.bg.queue : []
    for (let i = queue.length - 1; i >= 0; i--) {
      const rec = queue[i]
      if (!rec || rec.status === 'superseded' || !rec.text) continue
      const key = `${rec.definitionId || rec.id}:${rec.at}`
      if (seen.has(key)) continue
      seen.add(key)
      const clk = formatClock(rec.at)
      const snippet = String(rec.text).replace(/\s+/g, ' ').slice(0, 88)
      items.push({
        day: clk.day,
        header: `第 ${clk.day} 天 · ${clk.phase} ${clk.clock}`,
        desc: snippet + (rec.text.length > 88 ? '…' : '')
      })
      if (items.length >= 12) break
    }
    if (!items.length) {
      const now = formatClock(world.timeMin)
      items.push({
        day: now.day,
        header: `第 ${now.day} 天 · ${now.phase} ${now.clock}（行程起点）`,
        desc: world.flags?.arrived_oakhaven
          ? `队伍已抵达奥克赫斯，当前驻足于${locName(world.playerLocation)}。`
          : '队伍正行进于前往奥克赫斯的城外荒原，暮色降临，暂作休整。'
      })
    }
    return items
  }

  // ============================================================
  // 三、HTML 分页构建器
  // ============================================================

  function buildPortraitHtml(charView) {
    return `
      <button type="button" class="okh-portrait-frame" aria-label="${escapeHtml(charView.name)}立绘" data-okh-act="zoom-char" data-okh-id="${escapeHtml(charView.id)}" data-okh-name="${escapeHtml(charView.name)}" data-okh-role="${escapeHtml(charView.role)}" data-okh-sigil="${escapeHtml(charView.sigil)}" data-okh-src="${escapeHtml(charView.portraitPath)}">
        <span class="okh-pt-c okh-pt-tl"></span><span class="okh-pt-c okh-pt-tr"></span>
        <span class="okh-pt-c okh-pt-bl"></span><span class="okh-pt-c okh-pt-br"></span>
        <img class="okh-portrait-img" src="${escapeHtml(charView.portraitPath)}" alt="${escapeHtml(charView.name)}" onload="this.style.display='block';if(this.nextElementSibling)this.nextElementSibling.style.display='none';" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='flex';">
        <span class="okh-portrait-ph">
          <span class="okh-portrait-icon">${escapeHtml(charView.sigil)}</span>
          <span class="okh-portrait-tag">${escapeHtml(charView.name)}<br><small>肖像位</small></span>
        </span>
      </button>
    `
  }

  function buildDispatchPage(world, pendingList, presentList) {
    let eventBlock = ''
    if (pendingList.length) {
      const total = pendingList.length
      eventBlock = pendingList.map((ev, idx) => {
        const kicker = total > 1 ? `待决事件 ${idx + 1}/${total} · 局势请托` : '待决事件 · 局势请托'
        const choicesHtml = ev.choices.map(choiceKey => {
          const info = CHOICE_MAP[choiceKey] || { title: choiceKey, hint: '选择执行' }
          return `
            <button type="button" class="okh-decision-row" data-okh-act="fill" data-okh-text="${escapeHtml(info.title)}">
              <span class="okh-decision-text">✦ ${escapeHtml(info.title)}</span>
              <span class="okh-decision-hint">[${escapeHtml(info.hint)}]</span>
            </button>
          `
        }).join('')
        const sep = idx > 0 ? '<div class="okh-art-hr"></div>' : ''
        return `${sep}
          <div class="okh-dispatch-head">
            <div>
              <div class="okh-kicker">${kicker}</div>
              <div class="okh-h1">${escapeHtml(ev.title)}</div>
            </div>
            ${idx === 0 ? '<div class="okh-seal-badge" aria-hidden="true"></div>' : ''}
          </div>
          <div class="okh-narrative">${escapeHtml(ev.text)}</div>
          <div class="okh-sec-label">🪶 待决行动（点击填入输入框）：</div>
          <div class="okh-decision-list">${choicesHtml}</div>
        `
      }).join('')
    } else {
      const journeyState = world.flags?.arrived_oakhaven
        ? `当前位于${locName(world.playerLocation)}，暂无强制待决事件，可自由与在场人物交流或推进行程。`
        : '前传行旅途中，尚未抵达奥克赫斯。可与同行伙伴交谈休整，或继续赶路进镇。'
      eventBlock = `
        <div class="okh-dispatch-head">
          <div>
            <div class="okh-kicker">旅途近况 · ${escapeHtml(locName(world.playerLocation))}</div>
            <div class="okh-h1">${world.flags?.arrived_oakhaven ? '奥克赫斯驻留手札' : '荒原旅途手札'}</div>
          </div>
          <div class="okh-seal-badge" aria-hidden="true"></div>
        </div>
        <div class="okh-narrative">${escapeHtml(journeyState)}</div>
      `
    }

    const mapBlock = MAP ? MAP.build(world, mapSessionKey()) : '<div class="okh-empty-tip">地图模块未载入。</div>'

    // 在场可交互主要角色（主次联动）
    let selectedId = activePresentId
    if (!presentList.some(c => c.id === selectedId)) {
      selectedId = presentList.find(c => c.id === world.focusNpcId)?.id || presentList[0]?.id || null
    }
    const primary = presentList.find(c => c.id === selectedId) || null
    let presentBody = '<div class="okh-empty-tip">当前地点暂无可交互的主要角色。</div>'
    if (primary) {
      const pills = presentList.map(c => `
        <button type="button" class="okh-p-pill${c.id === primary.id ? ' active' : ''}" data-okh-act="select-present" data-okh-id="${escapeHtml(c.id)}">
          <span>${escapeHtml(c.sigil)}</span><span>${escapeHtml(c.name)}</span>
        </button>
      `).join('')
      const metricsHtml = primary.metrics.map(m =>
        `<span>${escapeHtml(m.label)}：<b>${escapeHtml(m.val)}</b></span>`
      ).join('')
      const actsHtml = primary.actions.map(a => `
        <button type="button" class="okh-char-act-btn" data-okh-act="fill" data-okh-text="${escapeHtml(a.prompt)}">
          <span>✦ ${escapeHtml(a.label)}</span><span class="okh-char-act-tag">[${escapeHtml(a.tag)}]</span>
        </button>
      `).join('')
      presentBody = `
        <div class="okh-present-pills">${pills}</div>
        <div class="okh-primary-box">
          ${buildPortraitHtml(primary)}
          <div class="okh-char-body">
            <div>
              <div class="okh-char-meta">
                <span class="okh-char-name">${escapeHtml(primary.name)} <small>· ${escapeHtml(primary.role)}</small></span>
                <span class="okh-char-stance">${escapeHtml(primary.stance)}</span>
              </div>
              <div class="okh-char-bio">${escapeHtml(primary.bio)}</div>
              <div class="okh-char-metrics">${metricsHtml}</div>
            </div>
            ${actsHtml ? `<div class="okh-char-acts">${actsHtml}</div>` : ''}
          </div>
        </div>
      `
    }

    return `
      <div class="okh-page${activeTab === 'dispatch' ? ' active' : ''}" data-okh-page="dispatch">
        ${eventBlock}
        ${mapBlock}
        <div class="okh-art-hr"></div>
        <div class="okh-present-sec">
          <div class="okh-sub-head">
            <span class="okh-sub-title">👥 在场可交互角色</span>
            <span class="okh-sub-hint">点击名签切换焦点</span>
          </div>
          ${presentBody}
        </div>
      </div>
    `
  }

  function buildRosterPage(world) {
    // 仅展示已开启监控的登场同伴，避免剧透未出场角色。
    const members = Object.values(world.npcs || {})
      .filter(n => n.monitored === true && n.alive !== false && n.id !== 'cecilia')
      .map(n => buildCharView(world, n))

    const rows = members.length ? members.map(m => {
      const isOpen = openRosterIds.has(m.id)
      const metricsHtml = m.metrics.map(it =>
        `<div class="okh-exp-metric"><span>${escapeHtml(it.label)}：</span><b>${escapeHtml(it.val)}</b></div>`
      ).join('')
      return `
        <div class="okh-member-card${isOpen ? ' open' : ''}" data-okh-member="${escapeHtml(m.id)}">
          <button type="button" class="okh-member-sum" data-okh-act="toggle-roster" data-okh-id="${escapeHtml(m.id)}">
            <span class="okh-mem-left">
              <span class="okh-mem-sigil">${escapeHtml(m.sigil)}</span>
              <span class="okh-mem-name">${escapeHtml(m.name)}</span>
              <span class="okh-mem-job">${escapeHtml(m.role)}</span>
            </span>
            <span class="okh-mem-mid">${escapeHtml(m.stance)}</span>
            <span class="okh-mem-right">
              <span class="okh-mem-bond${m.affIsLove ? ' is-love' : ''}">${escapeHtml(m.affLabel)}</span>
              <span class="okh-mem-chev">›</span>
            </span>
          </button>
          <div class="okh-member-exp">
            <div class="okh-exp-flex">
              ${buildPortraitHtml(m)}
              <div class="okh-exp-info">
                <div class="okh-exp-title">📜 人物档案</div>
                <div class="okh-exp-text">${escapeHtml(m.bio)}</div>
                <div class="okh-exp-title">⚖ 当前状态</div>
                <div class="okh-exp-metrics">${metricsHtml}</div>
                ${DOSSIERS.panels?.[m.id] ? `<button type="button" class="okh-char-act-btn" data-okh-act="dossier-open" data-okh-id="${escapeHtml(m.id)}">查看完整档案</button>` : ''}
              </div>
            </div>
          </div>
        </div>
      `
    }).join('') : '<div class="okh-empty-tip">暂无已登记的同行名册。</div>'

    return `<div class="okh-page${activeTab === 'roster' ? ' active' : ''}" data-okh-page="roster">${rows}${buildAlbum(world)}</div>`
  }

  function dossierRoomActions(world, id) {
    const room = MAP?.rooms.find(room => room.npc === id)
    return room ? MAP.roomState(world, room).actions : []
  }

  function closeDossier(restoreFocus = false) {
    if (!dossier) return
    const { id, dialog, controller } = dossier
    dossier = null
    controller.abort()
    dialog.close()
    dialog.remove()
    if (restoreFocus) document.querySelector(`[data-okh-act="dossier-open"][data-okh-id="${id}"]`)?.focus({ preventScroll: true })
  }

  function syncDossier(world) {
    if (!dossier) return
    const { id, shadow } = dossier
    const npc = world?.npcs?.[id]
    if (npc?.monitored !== true || npc.alive === false) { closeDossier(); return }
    const view = buildCharView(world, npc)
    const facts = { location: view.metrics.find(metric => metric.label === '当前位置')?.val, status: view.stance, bond: view.affLabel }
    for (const [field, value] of Object.entries(facts)) {
      const fieldValue = shadow.querySelector(`[data-dossier-fact="${field}"]`)
      if (fieldValue.textContent !== value) fieldValue.textContent = value
    }
    const slider = shadow.getElementById('okh-form-demo-value')
    if (slider) {
      const value = Math.round(npc.values?.blood_density ?? 0)
      if (slider.valueAsNumber !== value) {
        slider.value = value
        slider.dispatchEvent(new document.defaultView.Event('input'))
      }
    }
    const actions = shadow.querySelector('.okh-actions')
    const buttons = dossierRoomActions(world, id)
    actions.hidden = buttons.length === 0
    const markup = buttons.map(({ key, label }, index) =>
      `<button type="button" class="okh-action${index === 0 ? ' okh-action-main' : ''}" data-dossier-action="${escapeHtml(key)}">${escapeHtml(label)}</button>`
    ).join('')
    if (markup !== dossier.actionsMarkup) {
      actions.innerHTML = markup
      dossier.actionsMarkup = markup
    }
  }

  function openDossier(id) {
    const template = DOSSIERS.panels?.[id]
    const world = W.loadWorld()
    const npc = world?.npcs?.[id]
    if (!template || npc?.monitored !== true || npc.alive === false) return
    closeDossier()
    const dialog = document.createElement('dialog')
    dialog.className = 'okh-dossier-dialog'
    dialog.setAttribute('aria-label', npc.name + '的角色档案')
    const host = document.createElement('div')
    const shadow = host.attachShadow({ mode: 'open' })
    shadow.innerHTML = DOSSIERS.style + template.markup
    const panel = shadow.querySelector('[data-character-panel]')
    panel.hidden = false
    shadow.querySelectorAll('[data-dossier-demo], [data-default]').forEach(element => { element.hidden = true })
    const win = document.defaultView
    const controller = new win.AbortController()
    const { signal } = controller
    dossier = { id, dialog, shadow, controller }
    template.mount({
      getElementById: key => shadow.getElementById(key),
      createElement: name => document.createElement(name)
    }, {
      addEventListener: (event, listener) => win.addEventListener(event, listener, { signal })
    })
    shadow.addEventListener('okh:roster', () => closeDossier(true))
    shadow.addEventListener('click', event => {
      const action = event.target.closest?.('[data-dossier-action]')
      if (!action) return
      if (dialog.dataset.session !== mapSessionKey()) { closeDossier(); return }
      const current = W.loadWorld()
      const text = current && dossierRoomActions(current, id).find(item => item.key === action.dataset.dossierAction)?.text
      if (text) { closeDossier(); fillTavernInput(text, { append: true }) }
    })
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeDossier(true) })
    dialog.dataset.session = mapSessionKey()
    dialog.append(host)
    document.body.append(dialog)
    syncDossier(world)
    dialog.showModal()
    panel.dispatchEvent(new win.Event('okh:open'))
  }

  function albumGroups(world) {
    return ALBUM ? ALBUM.groups(world) : []
  }

  function collectedMemories(world) {
    return albumGroups(world).flatMap(group => group.memories)
  }

  function selectedAlbum(world) {
    const groups = albumGroups(world)
    return groups.find(group => group.id === albumCharacter) || groups[0]
  }

  function buildAlbum(world) {
    const groups = albumGroups(world), selected = selectedAlbum(world)
    const memories = selected?.memories || []
    const filters = `<nav class="okh-album-filters" aria-label="按角色浏览回忆">${groups.map(group => `<button type="button" data-okh-act="album-filter" data-okh-character="${escapeHtml(group.id)}" aria-pressed="${selected?.id === group.id}">${escapeHtml(group.name)}<small>${group.memories.length}</small></button>`).join('')}</nav>`
    const current = selected ? ALBUM.portrait(world, selected.id, portraitChoices)?.id : null
    const body = memories.length ? `<div class="okh-album-grid">${memories.map(item => `<button type="button" class="okh-memory" data-okh-act="album-open" data-okh-memory="${escapeHtml(item.id)}" aria-label="查看${escapeHtml(item.name)}的${escapeHtml(item.title)}"><span class="okh-memory-art"><img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="okh-memory-missing" hidden>画稿暂未载入</span><span class="okh-memory-kind">${item.kind === 'portrait' ? '立绘' : 'CG'}</span></span><span class="okh-memory-title">${escapeHtml(item.title)}</span><span class="okh-memory-owner"><span>${item.id === current ? '默认立绘' : item.name}</span><span>第 ${Math.floor(item.collectedAt / 1440) + 1} 天 · 收录</span></span></button>`).join('')}</div>` : `<div class="okh-album-empty"><span aria-hidden="true">◇</span><p>${escapeHtml(selected?.name || '')} · 尚无收录的回忆</p></div>`
    return `<section class="okh-album" aria-label="回忆相册"><header class="okh-album-head"><h3><span aria-hidden="true">◇</span> 回忆相册</h3><span>已珍藏 ${collectedMemories(world).length} 幅</span></header>${filters}${body}</section>`
  }

  function buildSupplyPage(world) {
    const gold = Number.isSafeInteger(world.playerState?.gold) ? world.playerState.gold : 30
    const arrived = Boolean(world.flags?.arrived_oakhaven)
    const arrears = Boolean(world.flags?.inn_arrears)
    const freePass = Boolean(world.flags?.inn_free_pass_today)
    const lodgingText = !arrived
      ? '尚未抵镇（暂免）'
      : (freePass ? '5 金 / 晚（今晚已免）' : (arrears ? '5 金 / 晚（旅店欠账）' : '5 金 / 晚（按日结算）'))

    // 物品栏按 ITEM_CATALOG 查表渲染已注册物品，同时兼容外部（如 MUV）写入的 custom:true 条目
    const catalog = CFG.ITEM_CATALOG || {}
    const rawInv = Array.isArray(world.playerState?.inventory) ? world.playerState.inventory : []
    const resolvedInv = rawInv.filter(Boolean).map(it => {
      if (it.custom === true) {
        return {
          name: it.name || it.id || '未命名物件',
          category: it.category === 'quest' ? 'quest' : 'supply',
          count: Number.isSafeInteger(it.count) ? it.count : 1,
          stackable: true,
          desc: it.desc || ''
        }
      }
      const meta = catalog[it.id] || {}
      return {
        name: meta.name || it.name || String(it.id || it),
        category: meta.category === 'quest' ? 'quest' : 'supply',
        count: Number.isSafeInteger(it.count) ? it.count : 1,
        stackable: meta.stackable !== false,
        desc: meta.desc || it.desc || ''
      }
    })
    const questItems = resolvedInv.filter(it => it.category === 'quest')
    const supplyItems = resolvedInv.filter(it => it.category !== 'quest')
    const shortageTag = world.flags?.supply_shortage ? ' <span class="okh-inv-warn">（补给告罄）</span>' : ''
    const renderList = (list, emptyText) => list.length
      ? list.map(it => {
          const qtyHtml = (it.stackable || it.count > 1)
            ? `<span class="okh-inv-qty">×${it.count}</span>`
            : ''
          const descHtml = it.desc ? `<div class="okh-inv-desc">${escapeHtml(it.desc)}</div>` : ''
          return `<div class="okh-inv-item"><div class="okh-inv-head"><span>✦ ${escapeHtml(it.name)}</span>${qtyHtml}</div>${descHtml}</div>`
        }).join('')
      : `<div class="okh-inv-empty">${emptyText}</div>`

    return `
      <div class="okh-page${activeTab === 'supply' ? ' active' : ''}" data-okh-page="supply">
        <div class="okh-ledger-summary">
          <div class="okh-ledger-box">
            <div class="okh-ledger-label">当前流动资金</div>
            <div class="okh-ledger-val">${gold} 金币</div>
          </div>
          <div class="okh-ledger-box">
            <div class="okh-ledger-label">每日旅店宿费</div>
            <div class="okh-ledger-val okh-dim">${escapeHtml(lodgingText)}</div>
          </div>
        </div>
        <div class="okh-art-hr"></div>
        <div class="okh-inv-cols">
          <div>
            <div class="okh-inv-title">📜 契据与证物</div>
            ${renderList(questItems, '［空置文书格 · 暂无登记物品］')}
          </div>
          <div>
            <div class="okh-inv-title">🧪 随身补给${shortageTag}</div>
            ${renderList(supplyItems, '［空置行囊格 · 暂无登记物品］')}
          </div>
        </div>
      </div>
    `
  }

  function buildChroniclePage(world) {
    const items = getChronicleItems(world)
    const html = items.map(it => `
      <div class="okh-chron-item">
        <div class="okh-chron-node">${it.day}</div>
        <div class="okh-chron-body">
          <div class="okh-chron-day">${escapeHtml(it.header)}</div>
          <div class="okh-chron-desc">${escapeHtml(it.desc)}</div>
        </div>
      </div>
    `).join('')
    return `<div class="okh-page${activeTab === 'chronicle' ? ' active' : ''}" data-okh-page="chronicle"><div class="okh-chron-list">${html}</div></div>`
  }

  /**
   * 生成完整手札 HTML（无 DOM 依赖，Node 沙箱与浏览器均可调用）
   * @param {object} world
   * @returns {string}
   */
  function buildHudHtml(world) {
    if (!world) return ''
    try { portraitChoices = W.presentation().portraits } catch (_) { portraitChoices = {} }
    const clk = formatClock(world.timeMin)
    const gold = Number.isSafeInteger(world.playerState?.gold) ? world.playerState.gold : 30
    const arrearsTag = world.flags?.inn_arrears ? '（旅店欠账）' : ''
    const pendingList = getPendingInteractions(world)
    const presentList = getPresentCharacters(world, pendingList)
    const presentHint = presentList.length
      ? `${presentList[0].name}${presentList.length > 1 ? ` 等 ${presentList.length} 人在场` : ' 在场'}`
      : '暂无同行在场'

    const curDay = clk.day
    const arenaDay = Number.isFinite(world.flags?.bloodyArenaDay) ? world.flags.bloodyArenaDay : 1
    const isMartialLaw = Boolean(
      (world.flags?.martial_law || world.flags?.panic) ||
      (world.flags?.bloody_arena && curDay >= arenaDay && (curDay - arenaDay) < 7)
    )
    const townTags = isMartialLaw ? ' <span class="okh-meta-item okh-badge-warn">［安保戒严 · 人心惶惶］</span>' : ''

    return `
      <div class="okh-hud-canvas">
        <span class="okh-corner okh-corner-tl" aria-hidden="true"></span>
        <span class="okh-corner okh-corner-br" aria-hidden="true"></span>
        <div class="okh-crest">◈ OAKHAVEN CHRONICLES ◈</div>
        <div class="okh-top-meta okh-row-time">
          <div class="okh-meta-left">
            <span class="okh-meta-item">⏱ <span class="okh-value">第 ${clk.day} 天 · ${escapeHtml(clk.phase)}（${escapeHtml(clk.weekday)}）</span> <span class="okh-clock">${clk.clock}</span></span>
            <span class="okh-meta-item okh-meta-loc">⚲ ${escapeHtml(locName(world.playerLocation))}</span>${townTags}
          </div>
          <div class="okh-meta-gold">¤ ${gold} 金${escapeHtml(arrearsTag)}</div>
        </div>
        <div class="okh-tabs-bar">
          <div class="okh-tabs-list">
            <button type="button" class="okh-tab-btn${activeTab === 'dispatch' ? ' active' : ''}" data-okh-act="tab" data-okh-tab="dispatch">📖 旅途手札</button>
            <button type="button" class="okh-tab-btn${activeTab === 'roster' ? ' active' : ''}" data-okh-act="tab" data-okh-tab="roster">👥 同伴名册</button>
            <button type="button" class="okh-tab-btn${activeTab === 'supply' ? ' active' : ''}" data-okh-act="tab" data-okh-tab="supply">🎒 随身行囊</button>
            <button type="button" class="okh-tab-btn${activeTab === 'chronicle' ? ' active' : ''}" data-okh-act="tab" data-okh-tab="chronicle">📅 战役历程</button>
          </div>
          <div class="okh-presence-tag"><span class="okh-presence-dot"></span><span>${escapeHtml(presentHint)}</span></div>
        </div>
        ${buildDispatchPage(world, pendingList, presentList)}
        ${buildRosterPage(world)}
        ${buildSupplyPage(world)}
        ${buildChroniclePage(world)}
      </div>
    `.trim()
  }

  function buildCompactHudHtml(world) {
    if (!world) return ''
    const clk = formatClock(world.timeMin)
    const gold = Number.isSafeInteger(world.playerState?.gold) ? world.playerState.gold : 30
    const arrearsTag = world.flags?.inn_arrears ? '（旅店欠账）' : ''
    const curDay = clk.day
    const arenaDay = Number.isFinite(world.flags?.bloodyArenaDay) ? world.flags.bloodyArenaDay : 1
    const isMartialLaw = Boolean(
      (world.flags?.martial_law || world.flags?.panic) ||
      (world.flags?.bloody_arena && curDay >= arenaDay && (curDay - arenaDay) < 7)
    )
    const townTags = isMartialLaw ? ' <span>［安保戒严 · 人心惶惶］</span>' : ''
    return `
      <div class="okh-hud-compact okh-row-time">
        <span>⏱ 第 ${clk.day} 天 · ${escapeHtml(clk.phase)}（${escapeHtml(clk.weekday)}） ${clk.clock}</span>
        <span>⚲ ${escapeHtml(locName(world.playerLocation))}</span>${townTags}
        <span class="okh-meta-gold">¤ ${gold} 金${escapeHtml(arrearsTag)}</span>
      </div>
    `.trim()
  }

  function buildWatchHtml(world) {
    if (!world) return ''
    const STAGE = CFG.STAGES
    return Object.values(world.npcs || {}).filter(n => n.monitored === true).map(n => {
      const mark = n.location === world.playerLocation ? '●' : '○'
      const stage = n.hasStage === false ? '—' : (STAGE[n.stage] ?? n.stage)
      const busy = n.activity ? `｜${n.activity.label}` : ''
      const vals = Object.entries(n.values || {}).map(([k, v]) => `${k}:${Math.round(v * 100) / 100}`).join(' ')
      return `${mark} ${n.name}｜${locName(n.location)}｜${stage}｜${vals}${busy}`
    }).join('\n')
  }

  // ============================================================
  // 四、样式、热更新事件委托与 Lightbox 大图模态
  // ============================================================

  function buildCss() {
    return `
.okh-hud{--g-lt:#fff5e3;--g-mn:#dfc89a;--g-dm:#9c8a70;--t-mn:#e8dfd3;--t-sb:#b3a594;--t-dm:#8a7c6a;margin:12px 0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;font-size:13px;line-height:1.5;color:var(--t-mn);user-select:none}
.okh-hud *{box-sizing:border-box}
.okh-hud-compact{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;padding:7px 14px;border-radius:4px;background:rgba(18,14,10,.92);border:1px solid rgba(195,162,108,.28);font-size:12px;color:var(--t-sb)}
.okh-hud-canvas{position:relative;max-width:760px;margin:0 auto;padding:16px 22px 24px;border-radius:4px;border:1px solid rgba(195,162,108,.32);background-color:#120e0a;background-image:radial-gradient(ellipse at 50% 15%,rgba(28,22,17,.72) 0%,rgba(14,11,8,.94) 80%,rgba(8,6,4,.98) 100%),url('${ASSET_UI.journalBg}');background-repeat:repeat;background-size:760px auto;background-position:top center;box-shadow:0 14px 40px rgba(0,0,0,.85);overflow:hidden}
.okh-corner{position:absolute;width:42px;height:42px;background:url('${ASSET_UI.corner}') no-repeat center/contain;opacity:.35;pointer-events:none}
.okh-corner-tl{top:6px;left:6px}.okh-corner-br{bottom:6px;right:6px;transform:rotate(180deg)}
.okh-crest{text-align:center;font-family:"Cinzel","Songti SC","SimSun",serif;font-size:10px;letter-spacing:2px;color:var(--g-dm);opacity:.82;margin-bottom:8px}
.okh-top-meta{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;padding-bottom:10px;border-bottom:1px solid rgba(195,162,108,.18)}
.okh-meta-left{display:flex;align-items:center;flex-wrap:wrap;gap:14px}
.okh-meta-item{font-size:12.5px;color:var(--t-sb)}.okh-meta-loc{color:var(--g-mn);font-weight:600}
.okh-clock{font-variant-numeric:tabular-nums;color:var(--g-dm);margin-left:4px}
.okh-meta-gold{font-size:12.5px;font-weight:700;color:#f3db9e}
.okh-tabs-bar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding:10px 0 8px;border-bottom:1px solid rgba(195,162,108,.15);margin-bottom:14px}
.okh-tabs-list{display:flex;gap:14px;flex-wrap:wrap}
.okh-tab-btn{background:transparent;border:none;border-bottom:2px solid transparent;padding:4px 2px;color:var(--t-dm);font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;transition:all .2s}
.okh-tab-btn:hover{color:var(--g-mn)}.okh-tab-btn.active{color:var(--g-lt);border-bottom-color:var(--g-mn)}
.okh-presence-tag{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--g-dm)}
.okh-presence-dot{width:6px;height:6px;border-radius:50%;background:#689975;box-shadow:0 0 6px #689975}
.okh-page{display:none}.okh-page.active{display:block}
.okh-dispatch-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px}
.okh-kicker{font-size:11px;color:var(--g-dm);letter-spacing:1px;margin-bottom:3px}
.okh-h1{font-family:"Cinzel","Songti SC","SimSun",serif;font-size:17px;font-weight:700;color:#fff6e5}
.okh-seal-badge{width:46px;height:46px;flex-shrink:0;background:url('${ASSET_UI.seal}') no-repeat center/contain;filter:drop-shadow(0 3px 6px rgba(0,0,0,.7))}
.okh-narrative{color:#dfd3c3;font-size:13.5px;line-height:1.75;padding:6px 0 12px}
.okh-sec-label{font-size:11.5px;color:var(--g-mn);margin-bottom:6px;font-weight:600}
.okh-decision-list{display:flex;flex-direction:column;gap:5px}
.okh-decision-row{width:100%;text-align:left;background:transparent;border:none;border-left:2px solid rgba(195,162,108,.3);padding:7px 12px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:10px;color:inherit;font:inherit;transition:all .2s}
.okh-decision-row:hover{background:rgba(195,162,108,.1);border-left-color:var(--g-lt);padding-left:16px}
.okh-decision-text{font-size:13px;color:var(--g-lt)}.okh-decision-hint{font-size:11px;color:var(--g-dm);white-space:nowrap}
.okh-art-hr{position:relative;height:1px;margin:16px 0;background:linear-gradient(90deg,transparent 0%,rgba(223,200,154,.45) 50%,transparent 100%)}
.okh-art-hr::after{content:'❖';position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:#130f0b;padding:0 8px;color:rgba(223,200,154,.65);font-size:10px}
.okh-sub-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px}
.okh-sub-title{font-family:"Cinzel","Songti SC","SimSun",serif;font-size:12.5px;font-weight:600;color:var(--g-mn)}
.okh-sub-hint{font-size:11px;color:var(--t-dm)}
.okh-map-slot{position:relative;width:100%;height:152px;border-radius:4px;border:1px solid rgba(195,162,108,.35);background:#110d0a;background-image:radial-gradient(ellipse at 50% 50%,rgba(32,25,19,.6) 0%,rgba(12,9,6,.95) 100%),url('${ASSET_UI.darkBg}');background-size:cover;background-position:center;box-shadow:inset 0 0 20px rgba(0,0,0,.95);overflow:hidden;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:border-color .2s}
.okh-map-slot:hover{border-color:rgba(223,200,154,.75)}
.okh-map-img{width:100%;height:100%;object-fit:cover;display:none}
.okh-map-ph{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center;padding:10px}
.okh-map-compass{font-size:26px;color:var(--g-mn);opacity:.85}
.okh-map-ph-title{font-family:"Cinzel","Songti SC","SimSun",serif;font-size:13px;font-weight:700;color:#fff6e5}
.okh-map-ph-pos{font-size:12px;color:var(--g-mn)}.okh-map-ph-note{font-size:10.5px;color:var(--g-dm)}
.okh-mc{position:absolute;width:10px;height:10px;border-color:rgba(223,200,154,.7);border-style:solid;pointer-events:none}
.okh-mc-tl{top:4px;left:4px;border-width:2px 0 0 2px}.okh-mc-tr{top:4px;right:4px;border-width:2px 2px 0 0}
.okh-mc-bl{bottom:4px;left:4px;border-width:0 0 2px 2px}.okh-mc-br{bottom:4px;right:4px;border-width:0 2px 2px 0}
.okh-present-pills{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.okh-p-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:3px;border:1px solid rgba(195,162,108,.25);background:rgba(20,16,12,.55);color:var(--t-sb);font:inherit;font-size:12px;cursor:pointer;transition:all .2s}
.okh-p-pill:hover{border-color:rgba(223,200,154,.55);color:var(--g-lt)}
.okh-p-pill.active{border-color:var(--g-mn);background:rgba(223,200,154,.15);color:var(--g-lt);font-weight:600}
.okh-primary-box{display:flex;gap:14px;padding:10px 12px;background:rgba(16,12,9,.45);border-left:2px solid rgba(223,200,154,.45)}
.okh-portrait-frame{padding:0;color:inherit;font:inherit;width:100px;height:136px;flex-shrink:0;position:relative;background:#0f0c09;border:1px solid rgba(195,162,108,.4);border-radius:3px;box-shadow:inset 0 0 14px rgba(0,0,0,.9);overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:center;cursor:pointer;transition:border-color .2s}
.okh-portrait-frame:hover{border-color:rgba(223,200,154,.85)}
.okh-portrait-img{width:100%;height:100%;object-fit:cover;object-position:top center;display:none}
.okh-portrait-ph{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;color:var(--g-dm)}
.okh-portrait-icon{font-size:24px;color:var(--g-mn)}.okh-portrait-tag{font-size:10px;line-height:1.3;color:var(--t-sb)}
.okh-pt-c{position:absolute;width:6px;height:6px;border-color:rgba(223,200,154,.6);border-style:solid;pointer-events:none}
.okh-pt-tl{top:2px;left:2px;border-width:1px 0 0 1px}.okh-pt-tr{top:2px;right:2px;border-width:1px 1px 0 0}
.okh-pt-bl{bottom:2px;left:2px;border-width:0 0 1px 1px}.okh-pt-br{bottom:2px;right:2px;border-width:0 1px 1px 0}
.okh-char-body{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:space-between;gap:8px}
.okh-char-meta{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px;margin-bottom:4px}
.okh-char-name{font-family:"Cinzel","Songti SC","SimSun",serif;font-size:14.5px;font-weight:700;color:#fff6e5}
.okh-char-name small{font-size:11.5px;font-weight:400;color:var(--g-dm)}
.okh-char-stance{font-size:11px;color:var(--g-mn)}
.okh-char-bio{font-size:12px;color:var(--t-sb);line-height:1.55;margin-bottom:6px}
.okh-char-metrics{display:flex;flex-wrap:wrap;gap:12px;font-size:11.5px;color:var(--t-dm)}
.okh-char-metrics b{color:var(--g-lt);font-weight:600}
.okh-char-acts{display:flex;flex-direction:column;gap:4px}
.okh-char-act-btn{width:100%;text-align:left;background:transparent;border:none;border-left:2px solid rgba(195,162,108,.28);padding:5px 10px;color:var(--g-lt);font:inherit;font-size:12px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:all .2s}
.okh-char-act-btn:hover{background:rgba(195,162,108,.1);border-left-color:var(--g-lt);padding-left:14px}
.okh-char-act-tag{font-size:10.5px;color:var(--g-dm)}
.okh-member-card{border-bottom:1px solid rgba(195,162,108,.14)}
.okh-member-sum{width:100%;background:transparent;border:none;padding:9px 4px;display:flex;align-items:center;justify-content:space-between;gap:10px;color:inherit;font:inherit;cursor:pointer;text-align:left}
.okh-member-sum:hover{background:rgba(195,162,108,.06)}
.okh-mem-left{display:flex;align-items:center;gap:8px;min-width:150px}
.okh-mem-sigil{color:var(--g-mn)}.okh-mem-name{font-weight:700;color:var(--g-lt)}.okh-mem-job{font-size:11px;color:var(--g-dm)}
.okh-mem-mid{flex:1;font-size:12px;color:var(--t-sb);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.okh-mem-right{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--g-mn)}
.okh-mem-bond.is-love{color:#c76f82}.okh-mem-chev{transition:transform .2s;color:var(--g-dm)}
.okh-member-card.open .okh-mem-chev{transform:rotate(90deg)}
.okh-member-exp{display:none;padding:8px 8px 14px 12px}.okh-member-card.open .okh-member-exp{display:block}
.okh-member-exp [data-okh-act="dossier-open"]{margin-top:8px;min-height:44px}
.okh-dossier-dialog{box-sizing:border-box;width:min(960px,100% - 12px);max-width:none;max-height:calc(100dvh - 12px);padding:0;border:0;background:transparent;overscroll-behavior:contain}
.okh-dossier-dialog::backdrop{background:#080605d9}
.okh-exp-flex{display:flex;gap:14px}.okh-exp-info{flex:1;min-width:0}
.okh-exp-title{font-size:11.5px;font-weight:700;color:var(--g-mn);margin:4px 0}
.okh-exp-text{font-size:12px;color:var(--t-sb);line-height:1.6;margin-bottom:8px}
.okh-exp-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:6px;font-size:12px;color:var(--t-dm)}
.okh-exp-metric b{color:var(--g-lt);font-weight:600}
.okh-ledger-summary{display:flex;justify-content:space-between;gap:16px;padding:10px 14px;background:rgba(20,16,12,.55);border-left:2px solid rgba(195,162,108,.45)}
.okh-ledger-box{flex:1}.okh-ledger-label{font-size:11px;color:var(--t-dm);margin-bottom:2px}
.okh-ledger-val{font-size:14px;font-weight:700;color:#f3db9e}.okh-ledger-val.okh-dim{color:var(--g-dm)}
.okh-inv-cols{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.okh-inv-title{font-size:12px;font-weight:700;color:var(--g-mn);margin-bottom:6px}
.okh-inv-warn,.okh-badge-warn{font-size:11px;font-weight:600;color:#d67b7b}
.okh-inv-item{font-size:12.5px;color:var(--t-mn);padding:5px 0;border-bottom:1px dashed rgba(195,162,108,.15)}
.okh-inv-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.okh-inv-qty{font-size:11.5px;font-weight:700;color:#f3db9e;font-variant-numeric:tabular-nums;white-space:nowrap}
.okh-inv-desc{font-size:11px;color:var(--t-dm);line-height:1.45;margin-top:2px;padding-left:13px}
.okh-inv-empty,.okh-empty-tip{font-size:12px;color:var(--t-dm);font-style:italic;padding:6px 0}
.okh-album{container:okh-album / inline-size;margin-top:26px;padding-top:20px;border-top:1px solid rgba(195,162,108,.3)}
.okh-album [hidden]{display:none!important}
.okh-album-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
.okh-album-head h3{margin:0;font:600 16px/1.8 'Noto Serif CJK SC','Songti SC',serif;color:var(--g-lt);letter-spacing:2px}
.okh-album-head h3>span{font-size:12px;color:var(--g-dm);margin-right:5px}
.okh-album-head>span{font-size:11px;color:var(--t-sb);white-space:nowrap}
.okh-album-filters{display:flex;flex-wrap:wrap;gap:0 18px;margin:2px 0 14px;border-bottom:1px solid rgba(195,162,108,.14)}
.okh-album-filters button{min-height:44px;padding:6px 1px;border:0;background:none;color:var(--t-sb);font:inherit;font-size:12px;cursor:pointer}
.okh-album-filters button[aria-pressed=true]{color:var(--g-lt);box-shadow:inset 0 -1px var(--g-mn)}
.okh-album-filters small{font-size:10px;margin-left:6px;color:var(--g-dm)}
.okh-album-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px 16px}
.okh-memory{display:block;min-width:0;min-height:44px;text-align:left;padding:0;border:0;background:none;color:var(--t-mn);font:inherit;cursor:pointer}
.okh-memory-art{position:relative;display:flex;align-items:center;justify-content:center;aspect-ratio:4/3;overflow:hidden;background:radial-gradient(ellipse at 50% 40%,#302419,#100c08);border:1px solid rgba(195,162,108,.32);box-shadow:0 3px 12px #0005}
.okh-memory-art img{display:block;width:100%;height:100%;object-fit:contain}
.okh-memory-kind{position:absolute;right:6px;bottom:5px;background:#100c08cc;color:#dfc89a;padding:1px 5px;font-size:9px;letter-spacing:1px}
.okh-memory-missing{color:var(--t-sb);font-size:11px;padding:12px}
.okh-memory-title{display:block;margin-top:7px;font-size:13px;line-height:1.6;overflow-wrap:anywhere;color:var(--g-lt)}
.okh-memory-owner{display:flex;flex-wrap:wrap;justify-content:space-between;gap:0 6px;font-size:10px;color:var(--t-sb);line-height:1.8}
.okh-memory-owner>span{color:var(--g-dm)}
.okh-memory:hover .okh-memory-art{border-color:var(--g-lt)}
.okh-album button:focus-visible{outline:1px solid var(--g-lt);outline-offset:4px}
.okh-album-empty{padding:22px 12px 18px;text-align:center;color:var(--t-sb);background:radial-gradient(ellipse at center,rgba(195,162,108,.04),transparent 72%)}
.okh-album-empty>span{font-size:24px;color:var(--g-dm)}.okh-album-empty p{font-size:13px;margin:6px 0}.okh-album-empty small{font-size:11px;line-height:1.8;color:var(--t-dm)}
@container okh-album (max-width:460px){.okh-album-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 10px}.okh-album-head h3{font-size:15px}.okh-album-filters{gap:0 14px}}
@container okh-album (max-width:240px){.okh-album-grid{grid-template-columns:minmax(0,1fr)}}
.okh-lb-album-nav{display:flex;align-items:center;justify-content:center;gap:16px;font-size:11px;color:#b3a594}
.okh-lb-album-nav[hidden]{display:none}.okh-lb-album-nav button{min-width:44px;min-height:44px;padding:5px 8px;border:0;background:none;color:#dfc89a;font:inherit;cursor:pointer}.okh-lb-album-nav button:disabled{opacity:.3;cursor:default}
.okh-lb-preference{display:flex;justify-content:center;gap:8px;align-items:center;flex-wrap:wrap}.okh-lb-preference[hidden]{display:none}.okh-lb-preference button{min-height:44px;padding:5px 12px;border:1px solid #c3a26c55;background:transparent;color:#dfc89a;font:inherit;font-size:12px;cursor:pointer}.okh-lb-preference button:disabled{color:#9c8a70;cursor:default}.okh-lb-preference [role=status]{font-size:11px;color:#c99988}
.okh-lb-overlay.is-album .okh-lb-img{max-height:46vh}.okh-lb-overlay.is-album .okh-lb-box{max-height:48vh}
@media(max-width:480px){.okh-lb-overlay.is-album .okh-lb-frame{padding:16px 12px 12px;gap:6px;max-width:94vw}.okh-lb-overlay.is-album .okh-lb-desc{font-size:11px}}
.okh-chron-list{display:flex;flex-direction:column;gap:10px}
.okh-chron-item{display:flex;gap:12px;align-items:flex-start}
.okh-chron-node{width:26px;height:26px;flex-shrink:0;border-radius:50%;border:1px solid rgba(223,200,154,.45);background:rgba(20,16,12,.8);color:var(--g-mn);font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center}
.okh-chron-day{font-size:12px;font-weight:700;color:var(--g-lt);margin-bottom:2px}
.okh-chron-desc{font-size:12px;color:var(--t-sb);line-height:1.55}
.okh-watch{display:none;white-space:pre-wrap;font-family:ui-monospace,"Cascadia Code",monospace;font-size:12px;color:#8a8175;margin-top:8px}
.okh-lb-overlay{position:fixed;inset:0;z-index:99999;background:rgba(6,4,3,.9);backdrop-filter:blur(5px);display:none;align-items:center;justify-content:center;padding:20px}
.okh-lb-overlay.active{display:flex}
.okh-lb-frame{position:relative;max-width:90vw;max-height:90vh;padding:22px 24px 18px;border-radius:4px;border:1px solid rgba(223,200,154,.55);background-color:#120e0a;background-image:radial-gradient(ellipse at 50% 20%,rgba(28,22,17,.8) 0%,rgba(10,8,5,.98) 100%),url('${ASSET_UI.journalBg}');background-size:cover;display:flex;flex-direction:column;align-items:center;gap:10px;color:#e8dfd3}
.okh-lb-close{position:absolute;top:-12px;right:-12px;width:30px;height:30px;border-radius:50%;background:#1c1510;border:1px solid rgba(223,200,154,.6);color:#fff5e3;cursor:pointer}
.okh-lb-box{max-width:80vw;max-height:68vh;background:#090705;border:1px solid rgba(195,162,108,.3);display:flex;align-items:center;justify-content:center;overflow:hidden}
.okh-lb-img{max-width:100%;max-height:66vh;object-fit:contain;display:none}
.okh-lb-ph{width:300px;height:380px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:20px;color:#9c8a70}
.okh-lb-ph.is-map{width:min(600px,78vw);height:360px}
.okh-lb-ph-icon{font-size:48px;color:#dfc89a}.okh-lb-name{font-size:15px;font-weight:700;color:#fff6e5}.okh-lb-desc{font-size:12px;color:#b3a594}
@media(max-width:560px){.okh-primary-box,.okh-exp-flex{flex-direction:column}.okh-inv-cols{grid-template-columns:1fr}}
.okh-dlg-row{display:flex;align-items:flex-start;margin:16px 0;gap:12px;position:relative}
.okh-dlg-row.side-left{justify-content:flex-start}
.okh-dlg-row.side-right{justify-content:flex-end}
.okh-avatar{flex:0 0 44px;width:44px;height:54px;border-radius:4px;border:1px solid rgba(226,199,146,.35);background:#181d25;background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center;color:#e2c792;font-size:16px;font-weight:bold;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.4);transition:transform .15s ease,border-color .15s ease;user-select:none}
.okh-avatar:hover{transform:translateY(-2px);border-color:rgba(226,199,146,.8)}
.side-right .okh-avatar{order:2;background:#2a2318;border-color:rgba(226,199,146,.5);color:#f7e7c8}
.okh-dlg-col{display:flex;flex-direction:column;max-width:min(82%,640px)}
.side-left .okh-dlg-col{align-items:flex-start}
.side-right .okh-dlg-col{align-items:flex-end}
.okh-speaker-name{font-size:12px;color:#a8977a;margin-bottom:5px;padding:0 3px;letter-spacing:.5px;font-weight:500}
.side-right .okh-speaker-name{color:#cbb184;text-align:right}
.okh-dlg-bubble{padding:11px 16px;font-size:14.5px;line-height:1.68;box-shadow:0 4px 16px rgba(0,0,0,.35);word-break:break-word}
.side-left .okh-dlg-bubble{background:linear-gradient(135deg,rgba(27,32,40,.96),rgba(18,22,28,.94));border-left:2px solid rgba(226,199,146,.55);border-right:1px solid rgba(211,216,222,.12);border-top:1px solid rgba(211,216,222,.12);border-bottom:1px solid rgba(211,216,222,.12);border-radius:2px 12px 12px 12px;color:#f0dfbe;text-align:left}
.side-right .okh-dlg-bubble{background:linear-gradient(135deg,rgba(42,36,27,.96),rgba(26,22,17,.94));border-right:2px solid rgba(226,199,146,.65);border-left:1px solid rgba(226,199,146,.22);border-top:1px solid rgba(226,199,146,.22);border-bottom:1px solid rgba(226,199,146,.22);border-radius:12px 2px 12px 12px;color:#f7ebcf;text-align:left}
.okh-ava-overlay{position:fixed;inset:0;z-index:99999;background:rgba(4,6,9,.94);display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;color:#e2c792}
.okh-ava-overlay.active{display:flex}
.okh-ava-overlay-img{max-width:min(86vw,360px);max-height:55vh;border-radius:6px;border:1px solid rgba(226,199,146,.4);object-fit:contain;background:#181d25;padding:4px}
.okh-ava-overlay-title{font-size:16px;font-weight:bold}
.okh-ava-overlay-tip{font-size:13px;max-width:32em;text-align:center;line-height:1.6;color:#bfa87a}
.okh-ava-overlay-btns{display:flex;gap:12px;margin-top:8px}
.okh-ava-btn{min-height:38px;padding:6px 18px;border:1px solid #9b8764;border-radius:4px;background:#211e19;color:#f0dfbe;cursor:pointer;font-size:14px;transition:all .15s ease}
.okh-ava-btn:hover{background:#332d22;border-color:#e2c792}
    `.trim()
  }

  function ensureHudStyle() {
    if (typeof document === 'undefined' || !document.head) return
    let style = document.getElementById('okh-hud-style')
    if (!style) {
      style = document.createElement('style')
      style.id = 'okh-hud-style'
      document.head.appendChild(style)
    }
    // 总是覆写最新样式，避免热更新时旧节点拦截死锁
    const css = buildCss() + (MAP ? MAP.css() : '')
    if (style.textContent !== css) style.textContent = css
  }

  function ensureLightbox() {
    if (typeof document === 'undefined' || !document.body) return null
    let lb = document.getElementById('okh-hud-lightbox')
    if (lb) lb.remove()
    lb = document.createElement('div')
    lb.id = 'okh-hud-lightbox'
    lb.className = 'okh-lb-overlay'
    lb.setAttribute('role', 'dialog')
    lb.setAttribute('aria-modal', 'true')
    lb.setAttribute('aria-hidden', 'true')
    lb.innerHTML = `
      <div class="okh-lb-frame">
        <button type="button" class="okh-lb-close" data-okh-act="close-lb" title="关闭" aria-label="关闭">✕</button>
        <div class="okh-lb-box">
          <img class="okh-lb-img" alt="大图" onload="this.style.display='block';if(this.nextElementSibling)this.nextElementSibling.style.display='none';" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='flex';">
          <div class="okh-lb-ph">
            <div class="okh-lb-ph-icon"></div>
            <div class="okh-lb-name"></div>
            <div class="okh-lb-desc"></div>
          </div>
        </div>
        <div class="okh-lb-name" data-okh-lb-cap></div>
        <div class="okh-lb-desc" data-okh-lb-sub></div>
        <nav class="okh-lb-album-nav" aria-label="浏览回忆" hidden><button type="button" data-okh-act="album-prev" aria-label="上一幅回忆">‹ 上一幅</button><span data-okh-album-position></span><button type="button" data-okh-act="album-next" aria-label="下一幅回忆">下一幅 ›</button></nav>
        <div class="okh-lb-preference" hidden><button type="button" data-okh-act="album-default">设为默认立绘</button><span data-okh-album-notice role="status"></span></div>
      </div>
    `
    document.body.appendChild(lb)
    return lb
  }

  function openLightbox(opts) {
    if (typeof document === 'undefined') return
    const lb = document.getElementById('okh-hud-lightbox') || ensureLightbox()
    if (!lb) return
    const img = lb.querySelector('.okh-lb-img')
    const ph = lb.querySelector('.okh-lb-ph')
    const icon = lb.querySelector('.okh-lb-ph-icon')
    const phName = ph?.querySelector('.okh-lb-name')
    const phDesc = ph?.querySelector('.okh-lb-desc')
    const cap = lb.querySelector('[data-okh-lb-cap]')
    const sub = lb.querySelector('[data-okh-lb-sub]')
    const wasOpen = lb.classList.contains('active')
    if (!wasOpen) lightboxReturnFocus = document.activeElement
    if (!opts.memory) albumLightbox = null
    lb.querySelector('.okh-lb-album-nav').hidden = !opts.memory
    lb.querySelector('.okh-lb-preference').hidden = !opts.memory
    lb.classList.toggle('is-album', Boolean(opts.memory))
    lb.setAttribute('aria-label', opts.title || '图片详情')
    lb.setAttribute('aria-hidden', 'false')
    if (ph) ph.classList.toggle('is-map', Boolean(opts.isMap))
    if (icon) icon.textContent = opts.sigil || '◈'
    if (phName) phName.textContent = opts.title || ''
    if (phDesc) phDesc.textContent = opts.pathHint || ''
    if (cap) cap.textContent = opts.title || ''
    if (sub) sub.textContent = opts.subtitle || ''
    if (img) {
      img.style.display = 'none'
      if (ph) ph.style.display = 'flex'
      img.src = opts.src || ''
    }
    lb.classList.add('active')
    if (!wasOpen) lb.querySelector('.okh-lb-close')?.focus()
  }

  function openMemory(id) {
    const world = W.loadWorld()
    const memories = world ? selectedAlbum(world)?.memories || [] : []
    const index = memories.findIndex(item => item.id === id)
    if (index < 0) { closeLightbox(); return }
    const item = memories[index]
    openLightbox({ memory: true, title: item.title, subtitle: `${item.name} · ${item.kind === 'portrait' ? '立绘' : 'CG'} · 第 ${Math.floor(item.collectedAt / 1440) + 1} 天收录`, pathHint: '画稿暂未载入', src: item.src })
    albumLightbox = { id, session: mapSessionKey() }
    const lb = document.getElementById('okh-hud-lightbox')
    lb.querySelector('[data-okh-album-position]').textContent = `${index + 1} / ${memories.length}`
    lb.querySelector('[data-okh-act=album-prev]').disabled = index === 0
    lb.querySelector('[data-okh-act=album-next]').disabled = index === memories.length - 1
    const current = ALBUM.portrait(world, item.npc, W.presentation().portraits)?.id === item.id
    const choose = lb.querySelector('[data-okh-act=album-default]')
    choose.disabled = current
    choose.textContent = current ? '当前默认立绘' : '设为默认立绘'
    lb.querySelector('[data-okh-album-notice]').textContent = ''
  }

  function stepMemory(delta) {
    if (!albumLightbox) return
    if (albumLightbox.session !== mapSessionKey()) { closeLightbox(); return }
    const world = W.loadWorld()
    if (!world) { closeLightbox(); return }
    const memories = selectedAlbum(world)?.memories || []
    const index = memories.findIndex(item => item.id === albumLightbox.id)
    if (index < 0) { closeLightbox(); return }
    const item = memories[index + delta]
    if (item) openMemory(item.id)
  }

  function closeLightbox() {
    if (typeof document === 'undefined') return
    const lb = document.getElementById('okh-hud-lightbox')
    const wasOpen = lb?.classList.contains('active')
    if (lb) { lb.classList.remove('active'); lb.setAttribute('aria-hidden', 'true') }
    albumLightbox = null
    if (wasOpen && lightboxReturnFocus?.isConnected) lightboxReturnFocus.focus()
    lightboxReturnFocus = null
  }

  function fillTavernInput(text, { append = false } = {}) {
    if (typeof document === 'undefined' || !text) return false
    const input = document.getElementById('send_textarea') ||
      document.querySelector('#send_form textarea') ||
      document.getElementById('tavern-input')
    if (!input || input.disabled || input.readOnly || typeof input.value !== 'string') return false
    const prior = append ? input.value : ''
    input.value = prior ? prior + (prior.endsWith('\n') ? '' : '\n') + text : text
    const InputEvent = input.ownerDocument.defaultView.Event
    input.dispatchEvent(new InputEvent('input', { bubbles: true }))
    input.dispatchEvent(new InputEvent('change', { bubbles: true }))
    if (typeof input.focus === 'function') input.focus()
    return true
  }

  function bindGlobalEvents() {
    if (typeof document === 'undefined') return
    // 热插拔：先清理旧版本事件与模态节点，再挂新闭包
    const previousCleanups = new Set([root.__OKH_HUD_CLEANUP__, document.__OKH_HUD_CLEANUP__])
    for (const cleanup of previousCleanups) {
      if (typeof cleanup === 'function') try { cleanup() } catch (_) {}
    }
    ensureLightbox()

    const onClick = async event => {
      const overlay = event.target?.id === 'okh-hud-lightbox' ? event.target : null
      if (overlay) { closeLightbox(); return }

      const el = event.target?.closest?.('[data-okh-act]')
      if (!el) return
      const act = el.getAttribute('data-okh-act')
      if (!['close-lb', 'album-prev', 'album-next', 'album-default'].includes(act)) {
        const hud = el.closest('[data-okh-hud]')
        if (!hud) return
        // A chat switch may precede the next timer tick. Never apply old DOM actions to a new save.
        if (hud.getAttribute('data-okh-session') !== mapSessionKey()) {
          render(true)
          return
        }
      }
      if (MAP && act?.startsWith('map-')) {
        const current = W.loadWorld()
        if (!current) return
        const focusHost = act === 'map-toggle' && document.activeElement === el ? el.closest('[data-okh-hud]') : null
        MAP.handle(el, current, mapSessionKey(), text => fillTavernInput(text, { append: true }))
        rerenderCurrent()
        focusHost?.querySelector('[data-okh-act="map-toggle"]')?.focus({ preventScroll: true })
        return
      }
      if (act === 'tab') {
        activeTab = el.getAttribute('data-okh-tab') || 'dispatch'
        rerenderCurrent()
      } else if (act === 'select-present') {
        activePresentId = el.getAttribute('data-okh-id')
        rerenderCurrent()
      } else if (act === 'toggle-roster') {
        const id = el.getAttribute('data-okh-id')
        if (id) {
          if (openRosterIds.has(id)) openRosterIds.delete(id)
          else openRosterIds.add(id)
          rerenderCurrent()
        }
      } else if (act === 'dossier-open') {
        openDossier(el.getAttribute('data-okh-id'))
      } else if (act === 'album-filter') {
        albumCharacter = el.getAttribute('data-okh-character') || 'gulan'
        rerenderCurrent()
      } else if (act === 'album-open') {
        openMemory(el.getAttribute('data-okh-memory'))
      } else if (act === 'album-prev' || act === 'album-next') {
        stepMemory(act === 'album-prev' ? -1 : 1)
      } else if (act === 'album-default') {
        if (!albumLightbox || albumLightbox.session !== mapSessionKey()) { closeLightbox(); return }
        const selection = { ...albumLightbox }
        const world = W.loadWorld()
        const item = world && collectedMemories(world).find(it => it.id === selection.id)
        if (!item) { closeLightbox(); return }
        el.disabled = true
        try {
          await W.setDefaultPortrait(item.npc, item.id)
          if (albumLightbox?.session === selection.session && albumLightbox.id === selection.id) {
            rerenderCurrent()
            openMemory(selection.id)
          }
        } catch (_) {
          if (albumLightbox?.session === selection.session && albumLightbox.id === selection.id) {
            el.disabled = false
            const notice = document.querySelector('[data-okh-album-notice]')
            if (notice) notice.textContent = '未能保存，请重试。'
          }
        }
      } else if (act === 'fill') {
        fillTavernInput(el.getAttribute('data-okh-text') || '')
      } else if (act === 'zoom-char') {
        openLightbox({
          isMap: false,
          sigil: el.getAttribute('data-okh-sigil'),
          title: el.getAttribute('data-okh-name'),
          subtitle: el.getAttribute('data-okh-role'),
          pathHint: `肖像槽位：${el.getAttribute('data-okh-src') || ''}`,
          src: el.getAttribute('data-okh-src')
        })
      } else if (act === 'zoom-map') {
        openLightbox({
          isMap: true,
          sigil: '🗺',
          title: '奥克赫斯疆域 · 全域态势地图',
          subtitle: `当前定位：${el.getAttribute('data-okh-loc') || ''}`,
          pathHint: `地图槽位：${el.getAttribute('data-okh-src') || ''}`,
          src: el.getAttribute('data-okh-src')
        })
      } else if (act === 'close-lb') {
        closeLightbox()
      }
    }

    const onKeyDown = event => {
      if (event.key === 'Escape') closeLightbox()
      const lb = document.getElementById('okh-hud-lightbox')
      if (!lb?.classList.contains('active')) return
      if (albumLightbox && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault()
        stepMemory(event.key === 'ArrowLeft' ? -1 : 1)
      }
      if (event.key === 'Tab') {
        const buttons = [...lb.querySelectorAll('button:not(:disabled)')].filter(el => !el.closest('[hidden]'))
        const first = buttons[0], last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }

    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKeyDown)
    const cleanup = () => {
      stopHud()
      closeDossier()
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKeyDown)
      const oldLb = document.getElementById('okh-hud-lightbox')
      if (oldLb) oldLb.remove()
    }
    root.__OKH_HUD_CLEANUP__ = cleanup
    document.__OKH_HUD_CLEANUP__ = cleanup
  }

  function buildRenderSignature(world) {
    // Include flags and event details as well as visible counters. Privacy can change without time advancing.
    return JSON.stringify([mapSessionKey(), world, W.presentation()])
  }

  function rerenderCurrent() {
    // User navigation must read the current save too, rather than a snapshot from the last timer tick.
    return render(true)
  }

  let eventsBound = false

  function ensureMessageHud() {
    if (!autoMount || !document?.querySelectorAll) return
    const texts = document.querySelectorAll('#chat .mes[is_user="false"] .mes_text')
    const latest = texts[texts.length - 1]
    if (!latest || latest.querySelector('[data-okh-hud]')) return
    const container = document.createElement('div')
    container.className = 'okh-hud'
    container.setAttribute('data-okh-hud', '')
    container.setAttribute('data-okh-mounted', '1')
    latest.appendChild(container)
  }

  /**
   * 渲染所有 HUD 容器（按状态指纹做脏检查，避免定时器覆盖玩家分页/折页交互）
   * @param {boolean} force
   * @returns {boolean}
   */
  function render(force = false) {
    if (typeof document === 'undefined') return false
    ensureHudStyle()
    if (!eventsBound) {
      bindGlobalEvents()
      eventsBound = true
    }

    const sessionKey = mapSessionKey()
    if (renderedSession !== sessionKey) {
      renderedSession = sessionKey
      activeTab = 'dispatch'
      activePresentId = null
      openRosterIds.clear()
      closeDossier()
      albumCharacter = 'gulan'
      closeLightbox()
    }
    const world = W.loadWorld()
    syncDossier(world)
    if (!world) {
      lastRenderSignature = null
      for (const el of document.querySelectorAll('[data-okh-hud]')) {
        el.replaceChildren()
        for (const attr of ['data-okh-sig', 'data-okh-session', 'data-okh-ready']) el.removeAttribute(attr)
      }
      for (const el of document.querySelectorAll('[data-okh-watch]')) { el.hidden = true; el.textContent = '' }
      return false
    }
    ensureMessageHud()
    if (albumLightbox && !collectedMemories(world).some(item => item.id === albumLightbox.id)) closeLightbox()

    const sig = buildRenderSignature(world)
    const changed = sig !== lastRenderSignature
    if (changed) { lastRenderSignature = sig; renderRevision++ }
    const huds = document.querySelectorAll('[data-okh-hud]')
    let found = false

    for (let i = 0; i < huds.length; i++) {
      const el = huds[i]
      el.setAttribute('data-okh-session', sessionKey)
      const isLatest = i === huds.length - 1
      const modeTag = isLatest ? 'full' : 'compact'
      // Keep full state fingerprints in this closure, not duplicated into every historical message.
      const targetSig = `${modeTag}:${renderRevision}`
      if (force || changed || el.getAttribute('data-okh-sig') !== targetSig) {
        el.innerHTML = isLatest ? buildHudHtml(world) : buildCompactHudHtml(world)
        el.setAttribute('data-okh-sig', targetSig)
        el.setAttribute('data-okh-ready', '1')
      }
      found = true
    }

    const watches = document.querySelectorAll('[data-okh-watch]')
    for (const el of watches) {
      el.hidden = !watchVisible
      el.textContent = watchVisible ? buildWatchHtml(world) : ''
      found = true
    }

    try { root.OKH_BUBBLE_SIDE?.apply?.() } catch (_) { /* 协同通知 */ }

    return found
  }

  let _timer = null

  function startHud(intervalMs = 1000) {
    if (_timer) return
    try { render(true) } catch (_) { /* 静默，不打断启动 */ }
    _timer = setInterval(() => {
      try { render(false) } catch (_) { /* 静默，不打断页面 */ }
    }, intervalMs)
    console.log('[APP] HUD 已启动 · 每 ' + intervalMs + 'ms 刷新')
  }

  function stopHud() {
    if (!_timer) return
    clearInterval(_timer)
    _timer = null
    console.log('[APP] HUD 已停止')
  }

  root.OKH_APP_HUD = Object.freeze({
    setAutoMount(value) { autoMount = value !== false; return render(true) },
    setWatchVisible(value) { watchVisible = value === true; return render(true) },
    setAssetBase(base) { assetBase = String(base ?? ''); return render(true) },
    LOCATION_NAMES,
    phaseName,
    locName,
    buildHudHtml,
    buildWatchHtml,
    render,
    startHud,
    stopHud
  })

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.OKH_APP_HUD
  }
})(typeof globalThis !== 'undefined' ? globalThis : this)
;
