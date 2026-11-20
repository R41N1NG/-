/**
 * @module okh_app_map
 * @updated 2026-11-20
 * @status active
 * @reason 正式 HUD 地图浏览与六间客房；读取当前存档，浏览和意图不直接写游戏状态
 */
(function (root) {
  'use strict'
  const CFG = root.OKH_APP_CONFIG
  const ROOMS = Object.freeze([
    { id: 'room1', npc: 'player', name: '伯里', role: '见习战士 · 玩家', job: 0, x: 16.7, y: 61.7 },
    { id: 'room2', npc: 'gulan', name: '古兰', role: '母亲 · 独立住客', job: 0, x: 26.5, y: 55.6 },
    { id: 'room3', npc: 'isna', name: '伊丝娜', role: '猫耳斥候', job: 25, x: 36.3, y: 49.5 },
    { id: 'room4', npc: 'nise', name: '妮丝', role: '妹妹 · 见习法师', job: 50, x: 45.9, y: 43.4 },
    { id: 'room5', npc: 'aurora', name: '奥萝拉', role: '见习牧师', job: 75, x: 55.4, y: 37.3 },
    { id: 'room6', npc: 'ed', name: '爱德', role: '随行后勤', job: 100, x: 64.9, y: 31.5 }
  ])
  const ASSETS = {
    region: ['__OKH_MAP_REGION__', '地图预览/全域图/regional-art.webp'],
    town: ['__OKH_MAP_TOWN__', '地图预览/镇内图/town-art.webp'],
    ground: ['__OKH_MAP_GROUND__', '地图预览/室内图/断剑与麦酒旅店/ground-scene.webp'],
    upper: ['__OKH_MAP_UPPER__', '地图预览/室内图/断剑与麦酒旅店/upper-scene.webp'],
    journal: ['__OKH_MAP_JOURNAL__', '地图预览/手札素材/journal-page.webp'],
    ink: ['__OKH_MAP_INK_FONT__', '地图预览/字体/map-ink.woff']
  }
  const PLACES = {
    town: { name: '奥克赫斯镇', detail: '镇内街区、集市与公共建筑。' },
    inn: { name: '断剑与麦酒旅店', detail: '一层大厅与二层六间客房。' },
    manor: { name: '领主庄园', detail: '镇外西北山上的庄园。' },
    wilds_camp: { name: '黑兽人前哨', detail: '敌对驻地，位于东南荒地。' },
    wilds: { name: '城外荒原', detail: '城外河谷、峡口与险道。' },
    church: { name: '圣辉大教堂', detail: '教堂与相关教会区域。' },
    training_grounds: { name: '露天练武场', detail: '镇内东北侧的训练院落。' },
    casino: { name: '地下赌场', detail: '此图只展示地面入口。' }
  }
  const VIEWS = ['region', 'town', 'ground', 'upper']
  let session = null, ui = null, assetBase = ''
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
  function image(key) {
    const [token, path] = ASSETS[key]
    return token.startsWith('data:') ? token : assetBase + path
  }
  function context(world, key = 'default') {
    if (!ui || session !== key) {
      session = key
      ui = { view: world.playerLocation === 'inn' ? 'ground' : world.flags?.arrived_oakhaven ? 'town' : 'region', room: null, place: null, feedback: '', draft: '' }
    }
    return ui
  }
  function isLocationHidden(npc) {
    const flags = npc?.flags || {}
    return Boolean(flags.gulan_departed || flags.captured_orc || flags.captured_manor || flags.isna_captured_ed ||
      (flags.isna_camp_distress === 'rat' && !flags.isna_help_real))
  }
  function roomState(world, room) {
    const base = { ...room, number: String(ROOMS.indexOf(room) + 1).padStart(2, '0'), known: true, location: null, status: '', actions: [] }
    const arrived = Boolean(world.flags?.arrived_oakhaven)
    const here = arrived && world.playerLocation === 'inn'
    if (room.npc === 'player') {
      base.status = here ? '你的住处 · 已在旅店' : arrived ? '你的住处 · 当前在外' : '你的住处 · 尚未抵镇'
      if (here) base.actions = [
        { key: 'rest', label: '回房休息', text: '我回到断剑与麦酒旅店二层自己的房间，休息片刻。' },
        { key: 'bag', label: '整理行囊', text: '我回到旅店自己的房间，整理随身行囊。' }
      ]
      else if (arrived) base.actions = [{ key: 'return', label: '前往旅店', text: '我前往断剑与麦酒旅店，准备返回自己的房间。' }]
      return base
    }
    const npc = world.npcs?.[room.npc]
    const edKnown = room.npc !== 'ed' || world.flags?.ed_joined || world.flags?.ed_permanently_joined || world.flags?.ed_custody_active
    if (!npc || npc.monitored !== true || npc.alive === false || !edKnown) {
      return { ...base, known: false, name: '客房 ' + base.number, role: '入住信息未登记', status: '暂无已登记住客', job: null }
    }
    if (!arrived) return { ...base, status: '尚未抵镇，房内情况待确认' }
    // 和现有公开 HUD 一致：暂离时不能泄露后台遇险坐标。
    if (isLocationHidden(npc)) {
      base.status = '暂离 · 去向未确认'
      if (here) base.actions = [{ key: 'note', label: '留下口信', text: `我在${room.name}的房门前留下一张约定稍后见面的字条。` }]
      return base
    }
    base.location = npc.location
    if (npc.location !== 'inn') {
      base.status = '外出 · ' + (CFG.LOCATIONS[npc.location] || '去向待确认')
      if (Object.hasOwn(CFG.LOCATIONS, npc.location)) base.actions.push({ key: 'find', label: '前往寻找', text: `我前往${CFG.LOCATIONS[npc.location]}寻找${room.name}。` })
      if (here) base.actions.push({ key: 'note', label: '留下口信', text: `我在${room.name}的房门前留下一张约定稍后见面的字条。` })
      return base
    }
    const local = (world.timeMin || 0) % 1440
    const together = here && room.npc === 'gulan' && world.flags?.playerRoomTarget === 'gulan' &&
      (local >= 1020 || local < 360) && (npc.stage ?? 0) < 3 && ((npc.stage ?? 0) < 2 || (npc.values?.affection ?? 0) >= 90)
    base.status = together ? '当前与你同住' : '在旅店 · 房内待确认'
    if (npc.activity?.label) base.status += ' · ' + npc.activity.label
    if (!here) {
      base.actions = [{ key: 'return', label: '前往旅店', text: `我前往断剑与麦酒旅店，准备拜访${room.name}。` }]
    } else if (together) {
      base.actions = [{ key: 'talk', label: '交谈近况', text: '我与同住的古兰聊聊近况和接下来的安排。' }]
    } else if (!npc.activity || npc.activity.kind === 'ordinary') {
      base.actions = [{ key: 'knock', label: '敲门拜访', text: `我来到断剑与麦酒旅店二层${room.name}的房门前，轻轻敲门，询问是否方便进去交谈。` }]
    }
    if (here) base.actions.push({ key: 'note', label: '留下口信', text: `我在${room.name}的房门前留下一张约定稍后见面的字条。` })
    return base
  }
  function icon(room) {
    const strokes = {
      0: '<path d="m7 20 10-16 1 5-8 12M7 12l7 4M6 21l3-5"/>',
      25: '<path d="m4 4 14 14M20 4 6 18M4 4l1 6 5-5M20 4l-1 6-5-5M13 17l4-4M7 13l4 4M18 18l2 2M6 18l-2 2"/>',
      50: '<path d="m6 22 8-15M13 11c-5-2-1-10 3-7 3 2-1 5-2 3M20 4v4M18 6h4M7 5v3M5.5 6.5h3"/>',
      75: '<circle cx="12" cy="10" r="4"/><path d="M12 1v2M12 17v6M3 10H1M23 10h-2M5.5 3.5 7 5M17 15l1.5 1.5M18.5 3.5 17 5M7 15l-1.5 1.5M8 20h8"/>',
      100: '<path d="M4 10h16v11H4zM8 10V7h8v3M4 13c5 3 11 3 16 0M10 15h4v3h-4zM6 7l3-4h6l3 4"/>'
    }
    return room.job === null ? '<span class="okh-m-room-number" aria-hidden="true">' + room.number + '</span>' : `<svg class="okh-m-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${strokes[room.job] || strokes[0]}</svg>`
  }
  function button(act, label, extra = '') {
    return `<button type="button" data-okh-act="${act}" ${extra}>${label}</button>`
  }
  function point(id, label, x, y, action, extra, world) {
    const current = world.playerLocation === id ? ' aria-current="location"' : ''
    const kind = id === 'town' && label === '奥克赫斯镇' ? 'settlement' : id === 'wilds_camp' ? 'hostile' : 'landmark'
    const ink = `<span class="okh-m-ink" data-ink-kind="${kind}">${esc(label)}</span>`
    return button(action, ink, `class="okh-m-point" style="--x:${x}%;--y:${y}%" ${extra}${current}`) + `<span class="okh-m-place-label" style="--x:${x}%;--y:${y}%" aria-hidden="true">${ink}</span>`
  }
  function placePanel(world, state) {
    const place = PLACES[state.place]
    if (!place) return ''
    const canGo = Boolean(world.flags?.arrived_oakhaven) || ['wilds', 'wilds_camp'].includes(state.place)
    return `<div class="okh-m-detail"><strong>${esc(place.name)}</strong><p>${esc(place.detail)}</p>${canGo ? button('map-travel', '› 前往此处', `data-okh-place="${state.place}"`) : '<p>抵镇后可前往。</p>'}</div>`
  }
  function build(world, key) {
    const state = context(world, key)
    const roomViews = ROOMS.map(room => roomState(world, room))
    const view = state.view
    const floor = view === 'ground' || view === 'upper'
    const title = { region: '奥克赫斯 · 全域图', town: '奥克赫斯 · 镇内图', ground: '断剑与麦酒旅店', upper: '断剑与麦酒旅店' }[view]
    let overlay = '', options = '', detail = ''
    if (view === 'region') {
      overlay = point('town', '奥克赫斯镇', 33.5, 63, 'map-view', 'data-okh-view="town"', world) +
        point('manor', '领主庄园', 20.5, 25, 'map-place', 'data-okh-place="manor"', world) +
        point('wilds_camp', '黑兽人前哨', 80, 66.5, 'map-place', 'data-okh-place="wilds_camp"', world)
      options = button('map-view', '进入镇内图', 'data-okh-view="town"') + button('map-place', '领主庄园', 'data-okh-place="manor"') + button('map-place', '黑兽人前哨', 'data-okh-place="wilds_camp"') + button('map-place', '城外荒原', 'data-okh-place="wilds"')
      detail = placePanel(world, state)
    } else if (view === 'town') {
      for (const [id, label, x, y] of [['church', '教堂', 40, 40], ['training_grounds', '练武场', 71, 40], ['town', '中央集市', 46, 56], ['inn', '断剑与麦酒', 31, 73], ['casino', '赌场入口', 65, 73]]) {
        overlay += point(id, label, x, y, id === 'inn' ? 'map-view' : 'map-place', id === 'inn' ? 'data-okh-view="ground"' : `data-okh-place="${id}"`, world)
      }
      options = button('map-view', '查看旅店', 'data-okh-view="ground"') + ['church', 'training_grounds', 'town', 'casino'].map(id => button('map-place', esc(PLACES[id].name), `data-okh-place="${id}"`)).join('')
      detail = placePanel(world, state)
    } else if (view === 'ground') {
      options = '<span>大厅 · 吧台 · 厨房 · 西侧院落</span>' + button('map-view', '楼梯 ↑ 客房', 'data-okh-view="upper"')
    } else {
      overlay = ''
      for (const room of roomViews) {
        const selected = state.room === room.id
        overlay += button('map-room', icon(room) + `<span>${esc(room.name)}</span>`, `class="okh-m-door" data-okh-room="${room.id}" style="--x:${room.x}%;--y:${room.y}%" aria-label="查看${esc(room.name)}的房间" aria-pressed="${selected}"`)
        overlay += `<span class="okh-m-marker${selected ? ' is-selected' : ''}" style="--x:${room.x}%;--y:${room.y}%" aria-hidden="true">${icon(room)}<span>${esc(room.name)}</span></span>`
        options += button('map-room', icon(room) + esc(room.name), `class="okh-m-name" data-okh-room="${room.id}" aria-pressed="${selected}"`)
      }
      const chosen = roomViews.find(room => room.id === state.room)
      detail = chosen ? `<section class="okh-m-detail" aria-label="房间与角色"><div class="okh-m-room-head">${icon(chosen)}<div><strong>${chosen.npc === 'player' ? '你的房间' : esc(chosen.name) + (chosen.known ? '的房间' : '')}</strong><p>客房 ${chosen.number} · ${esc(chosen.role)}</p></div></div><p class="okh-m-status">${esc(chosen.status)}</p><nav class="okh-m-actions">${chosen.actions.map(a => button('map-intent', '› ' + esc(a.label), `data-okh-room="${chosen.id}" data-okh-intent="${a.key}"`)).join('')}</nav></section>` : '<p class="okh-m-hint">点选一扇房门，查看住客与可用行动。</p>'
    }
    const nav = [['region', '全域'], ['town', '镇内'], ['ground', '旅店']].map(([id, label]) => button('map-view', label, `data-okh-view="${id}" aria-pressed="${state.view === id || (id === 'ground' && floor)}"`)).join('')
    const floors = floor ? `<nav class="okh-m-floors" aria-label="楼层">${[['ground', '一层 · 大厅'], ['upper', '二层 · 客房']].map(([id, label]) => button('map-view', label, `data-okh-view="${id}" aria-pressed="${view === id}"`)).join('')}</nav>` : ''
    return `<section class="okh-map-guide" aria-label="地图导览"><div class="okh-m-nav">${nav}<span>当前：${esc(CFG.LOCATIONS[world.playerLocation] || '未知地点')}</span></div><div class="okh-m-journal" data-map-view="${view}"><div class="okh-m-head"><h3>${title}</h3>${floors}</div><figure class="okh-m-image"><img src="${esc(image(view))}" alt="${view === 'upper' ? '同一侧一排六间客房与楼梯' : title}" onerror="this.hidden=true;this.parentElement.classList.add('image-unavailable')"><span class="okh-m-image-error">图稿暂未载入，仍可使用下方入口。</span>${overlay}</figure><nav class="okh-m-options${view === 'upper' ? ' is-rooms' : ''}" aria-label="${view === 'upper' ? '按姓名选择房间' : '地图入口'}">${options}</nav>${detail}<p class="okh-m-feedback" role="status">${esc(state.feedback)}</p>${state.draft ? `<textarea class="okh-m-draft" aria-label="可复制的行动草稿" readonly>${esc(state.draft)}</textarea>` : ''}</div></section>`
  }
  function handle(el, world, key, fill) {
    const action = el.getAttribute('data-okh-act')
    if (!action?.startsWith('map-')) return false
    const state = context(world, key)
    state.feedback = ''; state.draft = ''
    if (action === 'map-view') {
      const view = el.getAttribute('data-okh-view')
      if (VIEWS.includes(view)) { state.view = view; state.place = null }
    } else if (action === 'map-room') {
      const id = el.getAttribute('data-okh-room')
      if (ROOMS.some(room => room.id === id)) { state.view = 'upper'; state.room = id }
    } else if (action === 'map-place') {
      const id = el.getAttribute('data-okh-place')
      if (Object.hasOwn(PLACES, id)) state.place = id
    } else {
      let text = ''
      if (action === 'map-intent') {
        const room = ROOMS.find(r => r.id === el.getAttribute('data-okh-room'))
        text = room ? roomState(world, room).actions.find(a => a.key === el.getAttribute('data-okh-intent'))?.text || '' : ''
      } else if (action === 'map-travel') {
        const id = el.getAttribute('data-okh-place')
        if (Object.hasOwn(PLACES, id) && (world.flags?.arrived_oakhaven || ['wilds', 'wilds_camp'].includes(id))) text = `我前往${PLACES[id].name}。`
      }
      if (text) {
        const written = fill(text)
        state.feedback = written ? '已填入输入框，可修改后发送。' : '行动已拟好，可复制后发送。'
        if (!written) state.draft = text
      } else state.feedback = '当前情况已变化，请重新选择可用行动。'
    }
    return true
  }
  function signature(world) {
    return JSON.stringify(ROOMS.map(room => roomState(world, room)))
  }
  function css() {
    const smallCss = `
 .okh-m-journal{border-width:14px;border-image-width:14px;padding:7px 6px 10px}
 .okh-map-guide .okh-m-door,.okh-map-guide .okh-m-point{display:none}
 .okh-m-place-label{display:block;position:absolute;left:var(--x);top:var(--y);transform:translate(-50%,-50%);white-space:nowrap;pointer-events:none}
 .okh-m-marker{display:flex;align-items:center;justify-content:center;gap:1px;position:absolute;left:var(--x);top:var(--y);transform:translate(-50%,-50%) rotate(-19.5deg);white-space:nowrap;font-size:clamp(5px,1.65cqw,10px);pointer-events:none;letter-spacing:0;color:#59412b}
 .okh-m-marker .okh-m-icon{width:clamp(6px,2cqw,12px);height:clamp(6px,2cqw,12px)}
 .okh-m-marker.is-selected>span{text-decoration:underline;text-underline-offset:2px}
 .okh-m-options.is-rooms{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 5px;padding:6px 0}
 .okh-m-options .okh-m-name{display:flex;align-items:center;justify-content:center;gap:4px;min-width:44px;min-height:44px}
 .okh-m-name .okh-m-icon{width:13px;height:13px}
 .okh-m-nav{gap:0 15px}.okh-m-nav>span{font-size:9px}
 .okh-map-guide h3{font-size:17px;letter-spacing:1px}.okh-m-floors{font-size:11px;gap:0 14px}
 .okh-m-detail{display:block;padding:10px 2px 0}.okh-m-detail strong{font-size:18px}.okh-m-detail p{font-size:10px}
 .okh-m-room-head{gap:8px}.okh-m-room-head>.okh-m-icon{width:24px;height:32px}
 .okh-m-status{margin-top:5px!important}.okh-m-actions{flex-direction:row;gap:0 14px;border:0;padding:2px 0 0 32px}
 .okh-map-guide .okh-m-actions button{font-size:12px}
`
    return `
@font-face{font-family:'OKHMapInk';src:url('${image('ink')}') format('woff');font-style:normal;font-weight:400;font-display:swap}
/* The texture is sliced as a page frame; scene and live notes remain independent. */
.okh-map-guide{container:okh-map / inline-size;margin:18px 0 10px;font-size:12px;--map-ink:#59412b;--map-faint:#7d674b;color:var(--map-ink)}
.okh-map-guide *{box-sizing:border-box}.okh-map-guide [hidden]{display:none!important}
.okh-map-guide h3,.okh-map-guide p,.okh-map-guide figure{margin:0}
.okh-map-guide button{font:inherit;min-height:44px;border:0;background:transparent;color:inherit;cursor:pointer;padding:7px 0}
.okh-map-guide button:focus-visible{outline:1px solid currentColor;outline-offset:2px}
.okh-m-nav,.okh-m-head,.okh-m-floors,.okh-m-options,.okh-m-actions{display:flex;align-items:center;flex-wrap:wrap;gap:4px 18px}
.okh-m-nav{color:var(--g-dm);margin-bottom:8px}.okh-m-nav>span{margin-left:auto;font-size:10px;color:var(--t-sb)}
.okh-map-guide button[aria-pressed=true]{text-decoration:underline;text-decoration-thickness:.7px;text-underline-offset:5px}
.okh-m-journal{border:24px solid transparent;border-image:url('${image('journal')}') 70 80 fill / 24px / 0 stretch;background:#f3e3c4;padding:8px 16px 12px;font-family:'OKHMapInk','Noto Serif CJK SC','Songti SC',serif;isolation:isolate}
.okh-m-head{justify-content:space-between;gap:0 12px;padding:3px 4px 9px;border-bottom:1px solid #82633d55}
.okh-map-guide h3{font:400 clamp(17px,2.5vw,24px)/1.7 'OKHMapInk','Songti SC',serif;color:#4e351e;letter-spacing:2px}
.okh-m-floors{gap:0 18px;font-size:12px;white-space:nowrap}
.okh-m-image{position:relative;overflow:visible;margin:0!important;container-type:inline-size}
.okh-m-image>img{width:100%;height:auto;display:block;mix-blend-mode:multiply;mask-image:linear-gradient(to right,transparent,#000 3%,#000 97%,transparent),linear-gradient(to bottom,transparent,#000 3%,#000 97%,transparent);mask-composite:intersect}
/* Keep regional and town drawings behind the ink without bleaching the indoor scenes. */
.okh-m-journal[data-map-view=region] .okh-m-image>img,.okh-m-journal[data-map-view=town] .okh-m-image>img{filter:saturate(.78) brightness(1.04)}
.okh-m-image-error{display:none}.okh-m-image.image-unavailable{min-height:100px}.image-unavailable>.okh-m-image-error{display:block;padding:24px;color:var(--map-faint)}
.okh-map-guide .okh-m-point,.okh-map-guide .okh-m-door{position:absolute;left:var(--x);top:var(--y);transform:translate(-50%,-50%);min-width:44px;min-height:44px;padding:3px 6px;border:0;background:transparent;color:var(--map-ink);white-space:nowrap}
.okh-m-ink{position:relative;isolation:isolate;display:inline-block;white-space:nowrap;font:400 clamp(11px,1.5vw,14px)/1.5 'OKHMapInk','Songti SC',serif;letter-spacing:1.2px;color:#232622;text-shadow:-1px 0 1px #f7e8c9,1px 0 1px #f7e8c9,0 -1px 1px #f7e8c9,0 1px 1px #f7e8c9,0 0 4px #f7e8c9}
.okh-m-ink:before{content:'';position:absolute;inset:-3px -10px;z-index:-1;background:radial-gradient(ellipse,#f5e5c6a6,transparent 76%);pointer-events:none}
.okh-m-ink[data-ink-kind=settlement]{font-size:clamp(14px,1.9vw,19px);letter-spacing:2px;color:#1e2420}.okh-m-ink[data-ink-kind=hostile]{color:#51292b}
.okh-map-guide .okh-m-point[aria-current=location] .okh-m-ink,.okh-map-guide .okh-m-point:hover .okh-m-ink{text-decoration:underline;text-decoration-thickness:.7px;text-underline-offset:5px}
.okh-map-guide .okh-m-door{display:flex;align-items:center;justify-content:center;gap:3px;transform:translate(-50%,-50%) rotate(-19.5deg);font-size:clamp(8px,1.4cqw,12px);letter-spacing:.5px;padding:0 2px}
.okh-m-door:after{content:'';position:absolute;left:15%;right:15%;top:65%;height:8cqw;transform:skewX(-19.5deg);transform-origin:top;cursor:pointer}
.okh-map-guide .okh-m-door[aria-pressed=true]{color:#3d2917}.okh-map-guide .okh-m-door:hover>span{text-decoration:underline;text-underline-offset:3px}
.okh-m-icon{display:inline-block;flex-shrink:0;vertical-align:middle;width:16px;height:16px;color:inherit;overflow:visible}
.okh-m-door .okh-m-icon{width:clamp(9px,1.65cqw,14px);height:clamp(9px,1.65cqw,14px)}
.okh-m-room-number{display:inline-block;min-width:14px;text-align:center;font-size:9px}
.okh-m-marker,.okh-m-place-label{display:none}
.okh-m-options{padding:4px 4px;border-top:1px solid #82633d35;color:var(--map-faint);font-size:11px}
.okh-m-options.is-rooms{display:none}
.okh-m-image.image-unavailable~.okh-m-options.is-rooms{display:flex}
.image-unavailable>.okh-m-door,.image-unavailable>.okh-m-point,.image-unavailable>.okh-m-marker,.image-unavailable>.okh-m-place-label{display:none!important}
.okh-m-detail{padding:13px 4px 0;line-height:1.8;border-top:1px solid #82633d55;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 20px}
.okh-m-detail strong{color:#4e351e;font:400 20px/1.8 'OKHMapInk','Songti SC',serif;letter-spacing:1px}
.okh-m-detail p,.okh-m-hint{color:var(--map-faint);font-size:11px}
.okh-m-room-head{display:flex;align-items:center;gap:12px}.okh-m-room-head>.okh-m-icon{width:32px;height:40px}
.okh-m-status{grid-column:1}.okh-m-actions{grid-column:2;grid-row:1 / span 2;align-content:center;flex-direction:column;align-items:flex-start;gap:0;border-left:1px solid #82633d55;padding-left:20px}
.okh-map-guide .okh-m-actions button,.okh-m-detail>button{color:#59412b;font-size:13px;letter-spacing:1px}
.okh-m-detail>p:not(.okh-m-status){grid-column:1 / -1}.okh-m-detail>button{justify-self:start}
.okh-m-feedback{font-size:10px;color:var(--map-faint);padding:0 4px;line-height:1.8}.okh-m-feedback:not(:empty){margin-top:7px!important}
.okh-m-hint{padding:12px 4px 0;border-top:1px solid #82633d55}
.okh-m-draft{width:100%;min-height:65px;padding:8px;background:#f2e4c8;color:var(--map-ink);border:1px solid #82633d55;font:inherit;user-select:text}
@container okh-map (max-width:700px){${smallCss}}
@supports not (container-type:inline-size){@media(max-width:700px){${smallCss}}}

`
  }
  root.OKH_APP_MAP = Object.freeze({ build, handle, signature, css, roomState, isLocationHidden, rooms: ROOMS,
    setAssetBase(base) { assetBase = String(base || '').replace(/\/?$/, '/'); if (assetBase === '/') assetBase = '' }
  })
})(globalThis)
