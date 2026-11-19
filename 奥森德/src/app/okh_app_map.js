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
    { id: 'room1', npc: 'player', name: '伯里', role: '见习战士 · 玩家', job: 0, x: 19.4, y: 81 },
    { id: 'room2', npc: 'gulan', name: '古兰', role: '母亲 · 独立住客', job: 0, x: 29.8, y: 74.8 },
    { id: 'room3', npc: 'isna', name: '伊丝娜', role: '猫耳斥候', job: 25, x: 39.6, y: 68.7 },
    { id: 'room4', npc: 'nise', name: '妮丝', role: '妹妹 · 见习法师', job: 50, x: 48.8, y: 62.8 },
    { id: 'room5', npc: 'aurora', name: '奥萝拉', role: '见习牧师', job: 75, x: 57.5, y: 57.1 },
    { id: 'room6', npc: 'ed', name: '爱德', role: '随行后勤', job: 100, x: 65.7, y: 51.7 }
  ])
  const ASSETS = {
    region: ['__OKH_MAP_REGION__', '地图预览/全域图/regional-art.webp'],
    town: ['__OKH_MAP_TOWN__', '地图预览/镇内图/town-art.webp'],
    ground: ['__OKH_MAP_GROUND__', '地图预览/室内图/断剑与麦酒旅店/ground-scene.webp'],
    upper: ['__OKH_MAP_UPPER__', '地图预览/室内图/断剑与麦酒旅店/upper-scene.webp'],
    icons: ['__OKH_MAP_ICONS__', '地图预览/职业图标/class-icons.webp']
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
    if (npc.flags?.gulan_departed || npc.flags?.captured_orc || npc.flags?.captured_manor) {
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
    return room.job === null ? '<span class="okh-m-room-number">' + room.number + '</span>' : `<i class="okh-m-icon" style="--icon-x:${room.job}%" aria-hidden="true"></i>`
  }
  function button(act, label, extra = '') {
    return `<button type="button" data-okh-act="${act}" ${extra}>${label}</button>`
  }
  function point(id, label, x, y, action, extra, world) {
    const current = world.playerLocation === id ? ' aria-current="location"' : ''
    return button(action, esc(label), `class="okh-m-point" style="--x:${x}%;--y:${y}%" ${extra}${current}`) + `<span class="okh-m-place-label" style="--x:${x}%;--y:${y}%" aria-hidden="true">${esc(label)}</span>`
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
      overlay = point('town', '奥克赫斯镇', 33.5, 51, 'map-view', 'data-okh-view="town"', world) +
        point('manor', '领主庄园', 20, 24, 'map-place', 'data-okh-place="manor"', world) +
        point('wilds_camp', '黑兽人前哨', 80, 66, 'map-place', 'data-okh-place="wilds_camp"', world)
      options = button('map-view', '进入镇内图', 'data-okh-view="town"') + button('map-place', '领主庄园', 'data-okh-place="manor"') + button('map-place', '黑兽人前哨', 'data-okh-place="wilds_camp"') + button('map-place', '城外荒原', 'data-okh-place="wilds"')
      detail = placePanel(world, state)
    } else if (view === 'town') {
      for (const [id, label, x, y] of [['church', '教堂', 40, 37], ['training_grounds', '练武场', 71, 36], ['town', '中央集市', 46, 54], ['inn', '断剑与麦酒', 31, 69], ['casino', '赌场入口', 65, 69]]) {
        overlay += point(id, label, x, y, id === 'inn' ? 'map-view' : 'map-place', id === 'inn' ? 'data-okh-view="ground"' : `data-okh-place="${id}"`, world)
      }
      options = button('map-view', '查看旅店', 'data-okh-view="ground"') + ['church', 'training_grounds', 'town', 'casino'].map(id => button('map-place', esc(PLACES[id].name), `data-okh-place="${id}"`)).join('')
      detail = placePanel(world, state)
    } else if (view === 'ground') {
      options = '<span>大厅 · 吧台 · 厨房 · 西侧院落</span>' + button('map-view', '楼梯 ↑ 客房', 'data-okh-view="upper"')
    } else {
      overlay = `<div class="okh-m-paper"><b>二层客房</b><br>六间房 · 点选姓名查看</div>`
      for (const room of roomViews) {
        const selected = state.room === room.id
        overlay += button('map-room', icon(room) + `<span>${esc(room.name)}</span>`, `class="okh-m-door" data-okh-room="${room.id}" style="--x:${room.x}%;--y:${room.y}%" aria-label="查看${esc(room.name)}的房间" aria-pressed="${selected}"`)
        overlay += `<span class="okh-m-marker${selected ? ' is-selected' : ''}" style="--x:${room.x}%;--y:${room.y}%" aria-hidden="true">${icon(room)}</span>`
        options += button('map-room', icon(room) + esc(room.name), `class="okh-m-name" data-okh-room="${room.id}" aria-pressed="${selected}"`)
      }
      const chosen = roomViews.find(room => room.id === state.room)
      detail = chosen ? `<section class="okh-m-detail" aria-label="房间与角色"><div class="okh-m-room-head">${icon(chosen)}<div><strong>${chosen.npc === 'player' ? '你的房间' : esc(chosen.name) + (chosen.known ? '的房间' : '')}</strong><p>客房 ${chosen.number} · ${esc(chosen.role)}</p></div></div><p class="okh-m-status">${esc(chosen.status)}</p><nav class="okh-m-actions">${chosen.actions.map(a => button('map-intent', '› ' + esc(a.label), `data-okh-room="${chosen.id}" data-okh-intent="${a.key}"`)).join('')}</nav></section>` : '<p class="okh-m-hint">点选一扇房门，查看住客与可用行动。</p>'
    }
    const nav = [['region', '全域'], ['town', '镇内'], ['ground', '旅店']].map(([id, label]) => button('map-view', label, `data-okh-view="${id}" aria-pressed="${state.view === id || (id === 'ground' && floor)}"`)).join('')
    const floors = floor ? `<nav class="okh-m-floors" aria-label="楼层">${[['ground', '一层 · 大厅'], ['upper', '二层 · 客房']].map(([id, label]) => button('map-view', label, `data-okh-view="${id}" aria-pressed="${view === id}"`)).join('')}</nav>` : ''
    return `<section class="okh-map-guide" aria-label="地图导览"><div class="okh-m-nav">${nav}<span>当前：${esc(CFG.LOCATIONS[world.playerLocation] || '未知地点')}</span></div><div class="okh-m-head"><h3>${title}</h3>${floors}</div><figure class="okh-m-image"><img src="${esc(image(view))}" alt="${view === 'upper' ? '同一侧一排六间客房与楼梯' : title}" onerror="this.hidden=true;this.parentElement.classList.add('image-unavailable')"><span class="okh-m-image-error">图稿暂未载入，仍可使用下方入口。</span>${overlay}</figure><nav class="okh-m-options${view === 'upper' ? ' is-rooms' : ''}" aria-label="${view === 'upper' ? '按姓名选择房间' : '地图入口'}">${options}</nav>${detail}<p class="okh-m-feedback" role="status">${esc(state.feedback)}</p>${state.draft ? `<textarea class="okh-m-draft" aria-label="可复制的行动草稿" readonly>${esc(state.draft)}</textarea>` : ''}</section>`
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
    return `
.okh-map-guide{margin:18px 0 10px;color:var(--t-mn);--map-gold:var(--g-mn);font-size:12px}
.okh-map-guide [hidden]{display:none!important}.okh-map-guide h3,.okh-map-guide p,.okh-map-guide figure{margin:0}
.okh-map-guide button{font:inherit;min-height:44px;border:0;background:transparent;color:var(--g-dm);cursor:pointer;padding:7px 0}
.okh-map-guide button:focus-visible{outline:2px solid var(--g-mn);outline-offset:2px}
.okh-m-nav,.okh-m-head,.okh-m-floors,.okh-m-options,.okh-m-actions{display:flex;align-items:center;flex-wrap:wrap;gap:4px 18px}
.okh-m-nav{border-bottom:1px solid #dfc89a25}.okh-m-nav>span{margin-left:auto;font-size:10px;color:var(--t-sb)}
.okh-map-guide button[aria-pressed=true]{color:var(--g-mn);text-decoration:underline;text-underline-offset:6px}
.okh-m-head{justify-content:space-between;margin:10px 0}.okh-map-guide h3{font:500 18px/1.6 'Songti SC','SimSun',serif;color:var(--g-mn)}
.okh-m-image{position:relative;background:#dfc18e;border:1px solid #dfc89a35;border-radius:2px;overflow:hidden}
.okh-m-image>img{width:100%;height:auto;display:block}.okh-m-image-error{display:none}.okh-m-image.image-unavailable{min-height:100px}.image-unavailable>.okh-m-image-error{display:block;padding:24px;color:#61472d}
.okh-map-guide .okh-m-point,.okh-map-guide .okh-m-door{position:absolute;left:var(--x);top:var(--y);transform:translate(-50%,-50%);min-width:44px;color:#53371e;font:12px 'Songti SC','SimSun',serif;padding:3px 6px;background:#f1d8aee8;border:1px solid #957345;border-radius:2px}
.okh-map-guide .okh-m-point[aria-current=location]{outline:2px solid #624a28;outline-offset:2px}
.okh-map-guide .okh-m-door{display:flex;align-items:center;flex-direction:column;gap:1px;min-height:44px;white-space:nowrap}
.okh-map-guide .okh-m-door[aria-pressed=true]{background:#553b25;color:#fff0cf;text-decoration:none;outline:1px solid #f4d6a0;outline-offset:2px}
.okh-m-icon{display:inline-block;flex-shrink:0;vertical-align:middle;width:18px;height:18px;background-image:url('${image('icons')}');background-size:500% 166.666667%;background-position:var(--icon-x,0%) 50%;background-repeat:no-repeat}
.okh-m-room-number{display:inline-block;min-width:18px;text-align:center;font-size:10px}.okh-m-paper{position:absolute;left:5%;top:7%;max-width:40%;font-size:10px;line-height:1.9;color:#6d4f2e;pointer-events:none}.okh-m-paper b{font:500 15px/1.9 'Songti SC',serif;letter-spacing:2px}
.okh-m-marker,.okh-m-place-label{display:none}.okh-m-options{padding:5px 0;border-bottom:1px solid #dfc89a25;color:var(--t-sb)}.okh-m-options.is-rooms{display:none}
.okh-m-image.image-unavailable~.okh-m-options.is-rooms{display:flex}.image-unavailable>.okh-m-door,.image-unavailable>.okh-m-point,.image-unavailable>.okh-m-marker,.image-unavailable>.okh-m-place-label{display:none!important}
.okh-m-detail{padding:13px 0 0;line-height:1.8}.okh-m-detail strong{color:var(--g-mn);font:500 17px/1.8 'Songti SC','SimSun',serif}.okh-m-detail p,.okh-m-hint{color:var(--t-sb);font-size:11px}.okh-m-room-head{display:flex;align-items:center;gap:12px}.okh-m-room-head>.okh-m-icon{width:32px;height:32px}.okh-m-status{margin-top:8px!important}
.okh-map-guide .okh-m-actions button,.okh-m-detail>button{color:var(--g-mn)}.okh-m-feedback{min-height:18px;font-size:11px;color:var(--t-sb);margin-top:6px!important}.okh-m-hint{padding-top:12px}.okh-m-draft{width:100%;min-height:65px;padding:8px;background:#17110d;color:var(--g-mn);border:1px solid #65513a;font:inherit;user-select:text}
@media(max-width:700px){.okh-map-guide .okh-m-door,.okh-map-guide .okh-m-point{display:none}.okh-m-place-label{display:block;position:absolute;left:var(--x);top:var(--y);transform:translate(-50%,-50%);font:10px serif;color:#53371e;white-space:nowrap;background:#f1d8aec9;padding:1px 3px;pointer-events:none}.okh-m-marker{display:grid;place-items:center;position:absolute;left:var(--x);top:var(--y);transform:translate(-50%,-50%);width:20px;height:20px;background:#efd4a3;border-radius:50%;color:#604423;pointer-events:none}.okh-m-marker .okh-m-icon{width:20px;height:20px}.okh-m-marker.is-selected{background:#553b25;outline:1px solid #553b25;outline-offset:2px}.okh-m-options.is-rooms{display:flex;gap:0 10px}.okh-m-options .okh-m-name{display:flex;align-items:center;gap:4px;min-width:44px}.okh-m-name .okh-m-icon{width:16px;height:16px}.okh-m-paper{font-size:9px}.okh-m-paper b{font-size:13px}.okh-m-nav{gap:0 15px}.okh-m-nav>span{font-size:9px}.okh-map-guide .okh-m-point{font-size:10px;padding:2px 4px}.okh-m-head{gap:0}.okh-map-guide h3{font-size:16px}}
`
  }
  root.OKH_APP_MAP = Object.freeze({ build, handle, signature, css, roomState, rooms: ROOMS,
    setAssetBase(base) { assetBase = String(base || '').replace(/\/?$/, '/'); if (assetBase === '/') assetBase = '' }
  })
})(globalThis)
