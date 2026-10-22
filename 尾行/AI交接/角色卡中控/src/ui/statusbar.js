"use strict";
const { WX_ICON, ico, stripEmoji } = require("./icons.js");
const { ALERT_TIERS, alertTierOf } = require("./alert-view.js");
const { capsuleGate, getDynamicCapsules } = require("./action-options.js");
const {
  IDENTITY_DATA,
  TARGET_DATA,
  TARGET_NAME_POOL,
  TARGET_PERSONALITY_POOL,
  TARGET_HOBBY_POOL,
  TARGET_SHOE_POOL,
  TARGET_STAT_DELTA_OPTIONS,
  generateTargetPersona,
  PRESETS,
  ATTR_NAMES,
  TIER,
  tierOf,
  POINT_BUDGET,
} = require("./creation-data.js");
const { createZeroFloorHost } = require("./zero-floor/host.js");
const { createStages } = require("./zero-floor/stages.js");
const MOCKS = __WX_PREVIEW__ ? require("./preview-data.js").MOCKS : {};
const {
  SWEET,
  LINES,
  heartToBpm,
  heartFreq,
  DIST_NAMES,
  SLOT_NAMES,
  MODE_NAMES,
  lineOf,
} = require("./display.js");
const { createDetailsRenderer } = require("./renderers/details.js");
const { clearLiveData } = require("./renderers/empty.js");
const { createSnapshotRenderer } = require("./renderers/snapshot.js");
const { createAudio } = require("./audio.js");
const { createSettlement } = require("./settlement/controller.js");

// 页面与酒馆共用一个入口；document/window 由宿主注入。
const { scopeKey } = require("../contracts/chat-scope.js");
const { createLifecycle } = require("./lifecycle.js");
const { createSyncNotice } = require("./sync-notice.js");
function mountStatusbar(document, window) {
  window.WxStatusbar?.dispose?.();
  const lifecycle = createLifecycle(window);
  const syncNotice = createSyncNotice({
    document,
    lifecycle,
    getGlue: () => window.WxGlue || globalThis.WxGlue,
  });
  for (const id of ["quickPane", "idGrid", "allocRows", "targetGrid"]) {
    const node = document.getElementById(id);
    if (node) delete node.dataset.built;
  }
  clearLiveData(document);
  const details = createDetailsRenderer({ document });
  details.reset();
  const noticeAtMount = document.getElementById("wxSyncNotice");
  if (noticeAtMount) noticeAtMount.hidden = true;
  const root =
    document.getElementById("wx-statusbar-root") ||
    document.querySelector("section.trpg") ||
    document.querySelector(".trpg:not(#wx-zero-floor)");

  /* ---------- C4 · 单色图标集（24×24，stroke 1.6，currentColor；只在结构/脚本里，不引外部资源） ----------
     文字符号（➔ ⬅ ↗ ▾ ★ ✓ ♥）本来就是单色的，保留；这里换的是会带颜色的图形 emoji。 */

  /** 去掉文本里的彩色 emoji（mock 数据与 LLM 文案都可能带），图标由 ico() 统一补。
      只清图形 emoji 与杂符号，箭头（↗ ← ➔）、几何形（▾ ★ ✓）等文字符号保留。 */

  /* 结构里用 data-ico="name" 占位，统一在这里补成 SVG（含首帧未渲染时的兜底态） */
  const fillStaticIcons = () => {
    document.querySelectorAll("[data-ico]").forEach((el) => {
      if (el.dataset.icoFilled) return;
      el.insertAdjacentHTML("beforeend", ico(el.dataset.ico));
      el.dataset.icoFilled = "1";
    });
  };
  fillStaticIcons();

  /* ---------- 规格常量（数值策划 v0.5 直译） ---------- */

  // 操作线全员统一（v0.8 清账：老手/新手双轨废弃）

  // 失控下移变闷

  /* ---------- 演示快照（结构与中控 snapshot() 一致） ---------- */
  /* ---------- 仪表盘绘制（刻度 0-100 = 心跳值；甜区 40-65；操作线 70/90 标记） ---------- */
  const dial = document.getElementById("dial");
  const point = (value, radius = 62) => {
    const angle = ((135 + (value / 100) * 270) * Math.PI) / 180;
    return {
      x: 80 + radius * Math.cos(angle),
      y: 80 + radius * Math.sin(angle),
    };
  };
  function arc(from, to) {
    const a = point(from),
      b = point(to);
    return `M ${a.x} ${a.y} A 62 62 0 ${((to - from) / 100) * 270 > 180 ? 1 : 0} 1 ${b.x} ${b.y}`;
  }
  dial.querySelector(".dial-track").setAttribute("d", arc(0, 100));
  dial.querySelector(".dial-sweet").setAttribute("d", arc(SWEET[0], SWEET[1]));
  const NS = "http://www.w3.org/2000/svg",
    gT = dial.querySelector(".dial-ticks");
  for (let value = 0; value <= 100; value += 5) {
    const a = point(value, 69),
      b = point(value, value % 10 === 0 ? 75 : 72);
    const tick = document.createElementNS(NS, "line");
    for (const [k, v] of Object.entries({ x1: a.x, y1: a.y, x2: b.x, y2: b.y }))
      tick.setAttribute(k, v);
    tick.setAttribute("class", "dial-tick");
    gT.append(tick);
  }
  /* 操作线标记：70 变形（金）、90 崩溃（红） */
  for (const [v, color] of [
    [LINES[0], "#d6b96a"],
    [LINES[1], "#e0566a"],
  ]) {
    const a = point(v, 62),
      b = point(v, 76);
    const l = document.createElementNS(NS, "line");
    for (const [k, v2] of Object.entries({
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
    }))
      l.setAttribute(k, v2);
    l.setAttribute("class", "dial-linemark");
    l.setAttribute("stroke", color);
    gT.append(l);
  }
  /* 心电波（GLM 原样保留） */
  const clipId =
    "ecg-" +
    (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
  dial.querySelector(".ecg-clip").id = clipId;
  dial
    .querySelector(".ecg-window")
    .setAttribute("clip-path", `url(#${clipId})`);
  let ecgPath = "M 0 114";
  for (let start = 0; start < 288; start += 72)
    for (const [x, y] of [
      [14, 114],
      [18, 111],
      [22, 114],
      [27, 114],
      [30, 104],
      [34, 123],
      [38, 110],
      [43, 114],
      [51, 114],
      [55, 111],
      [60, 114],
      [72, 114],
    ])
      ecgPath += ` L ${start + x} ${y}`;
  dial.querySelector(".ecg-line").setAttribute("d", ecgPath);

  /* ---------- 心跳音效引擎（数值直驱 + 耳鸣层 + spike；双音量滑条独立可调） ---------- */
  const view = { heart: 0, mode: "prepare", snapshot: null };
  const audio = createAudio({
    document,
    window,
    lifecycle,
    root,
    heartToBpm,
    heartFreq,
    ico,
    renderSnapshot,
    getHeart: () => view.heart,
    getMode: () => view.mode,
    getSnapshot: () => view.snapshot,
  });
  const {
    getRainState,
    HUNTER_MODES,
    updateAudioStatus,
    stopAudio,
    toggleAudio,
    spike,
    applyVolumes,
    tinnitus,
    updateRainTunnel,
    syncAudioTempo,
    playShutterSound,
    playFootstepSound,
    playEnvAudio,
  } = audio;
  const render = createSnapshotRenderer({
    document,
    lifecycle,
    root,
    dial,
    view,
    audio,
    renderers: {
      renderAlbum,
      showPhotoToast,
      renderInventory,
      renderActionCapsules,
      updateIdBadge,
    },
  });

  /* 战术行囊持有物字典与渲染器 */
  const ITEM_TYPE_NAMES = {
    tool: "潜入工具",
    tech: "科技门票",
    device: "数字设备",
    disguise: "伪装道具",
    consumable: "消耗补给",
    trophy: "纪念物",
    gear: "便携配件",
    misc: "杂项物品",
  };
  const ITEM_TYPE_ICONS = {
    tool: "tool",
    tech: "tech",
    device: "device",
    disguise: "mask",
    consumable: "bolt",
    trophy: "cup",
    gear: "bag",
    misc: "box",
  };

  /* ═══ M4-2 行动胶囊体系（情境自适应 4 胶囊 + 姿态指示 + 二级抽屉展开） ═══ */
  let currentCapsuleActions = [];
  let postureEnabled = true; // 默认姿态：未点选胶囊时以「跟缀·保持当前距离」结算
  let defaultPosture = { id: "follow", name: "跟缀", args: { dist: "same" } };
  let currentDynamicCapsules = [];

  const DRAWER_CATEGORIES = [
    {
      name: "潜行与身法",
      modes: ["stealth", "any"],
      actions: [
        { id: "follow", name: "跟缀", args: { dist: "same" } },
        { id: "follow", name: "贴近", args: { dist: "close" } },
        { id: "withdraw", name: "拉开距离", args: { dist: "far" } },
        { id: "hide", name: "躲藏", args: {} },
        { id: "breath", name: "缓息", args: {} },
        { id: "gait", name: "变换步态", args: {} },
        { id: "hide", name: "贴墙", args: {} },
        { id: "hide", name: "借物掩护", args: {} },
      ],
    },
    {
      name: "侦查与取证",
      modes: ["stealth", "any", "contact"],
      actions: [
        { id: "photo", name: "拍照", args: {} },
        { id: "record", name: "录音", args: {} },
        { id: "door_listen", name: "贴身听", args: {} },
        { id: "timing", name: "读时机", args: {} },
        { id: "scan", name: "打量", args: {} },
        { id: "door_peep", name: "门缝观察", args: {} },
        { id: "scan", name: "橱窗反射", args: {} },
      ],
    },
    {
      name: "破门与入室",
      modes: ["stealth", "any"],
      actions: [
        { id: "try_handle", name: "试门把", args: {} },
        { id: "lockpick", name: "开锁", args: {} },
        { id: "pry", name: "撬门", args: {} },
        { id: "check_door", name: "查门禁", args: {} },
        { id: "climb", name: "翻墙", args: {} },
        { id: "ransack", name: "翻找", args: {} },
        { id: "plan_exit", name: "撤离", args: {} },
      ],
    },
    {
      name: "接触与脱罪",
      modes: ["contact", "any"],
      actions: [
        { id: "chat", name: "搭话", args: {} },
        { id: "greet", name: "寒暄", args: {} },
        { id: "answer_guard", name: "应对盘问", args: {} },
        { id: "misdirection", name: "误导归因", args: {} },
        { id: "bribe", name: "买通", args: {} },
        { id: "shop_enter", name: "佯装进店", args: {} },
        { id: "abort", name: "借故告退", args: {} },
      ],
    },
    {
      name: "终局与冲突",
      modes: ["climax", "any", "stealth"],
      actions: [
        {
          id: "strike",
          name: "下手 (偷袭)",
          args: { style: "ambush" },
          danger: true,
        },
        {
          id: "strike",
          name: "下手 (强攻)",
          args: { style: "assault" },
          danger: true,
        },
        { id: "pin", name: "按制", args: {} },
        { id: "chase", name: "追逐", args: {} },
      ],
    },
  ];

  /* ═══ 胶囊条件门槛（主人 2026-10-19 定） ═══
     场景不相干的动作直接不出现（街上没有门，就别给开锁）；
     场景相干但条件不足的留成灰条并写明缺什么（非贴身不给偷袭、没开锁工具不给开锁）。
     引擎侧有同一套 requires 兜底，UI 只负责别让人误点。 */

  function updateInputPlaceholder() {
    const topDoc =
      typeof window !== "undefined" && window.parent && window.parent !== window
        ? window.parent.document
        : document;
    const inputEl =
      topDoc.querySelector("#send_textarea") ||
      topDoc.querySelector("#send_form textarea");
    if (!inputEl) return;

    if (currentCapsuleActions.length) {
      const act = currentCapsuleActions[0];
      if (["lockpick", "pry", "try_handle"].includes(act.id)) {
        inputEl.placeholder = `描述你的动作与尝试细节（已选：${act.name}，如：拿出工具探入锁孔...）`;
      } else if (act.id === "strike") {
        inputEl.placeholder = `描述你的扑袭与动作举止（已选：${act.name}，如：借转角视线死角...）`;
      } else if (act.id === "misdirection") {
        inputEl.placeholder = `描述你的说辞与借口（已选：${act.name}，如：把动静推给野猫...）`;
      } else {
        inputEl.placeholder = `描述正文（已选定行动：${act.name}）...`;
      }
    } else if (postureEnabled && defaultPosture) {
      inputEl.placeholder = "输入正文（默认姿态：跟缀·保持当前距离）...";
    } else {
      inputEl.placeholder = "输入正文（纯叙事，不掷骰）...";
    }
  }

  function renderActionChipsUI() {
    const wrap = document.getElementById("wxChipsWrap");
    if (!wrap) return;
    const chips = (currentDynamicCapsules || [])
      .map((c) => ({ c, gate: capsuleGate(c, view.snapshot) }))
      .filter((x) => !x.gate.hide);
    wrap.innerHTML = chips
      .map(({ c, gate }) => {
        const isAct = currentCapsuleActions.some(
          (a) =>
            a.id === c.id &&
            JSON.stringify(a.args || {}) === JSON.stringify(c.args || {}),
        );
        const cls = [
          "wx-capsule-chip",
          isAct ? "active" : "",
          c.danger ? "danger" : "",
          gate.lock ? "locked" : "",
        ]
          .filter(Boolean)
          .join(" ");
        const tip = gate.lock ? gate.reason : c.tip || c.name;
        return `<button type="button" class="${cls}" data-action-id="${c.id}" data-action-name="${c.name}" data-action-args='${JSON.stringify(c.args || {})}' data-tip="${tip}"${gate.lock ? ' aria-disabled="true"' : ""}>${isAct ? '<span class="chip-check">✓</span> ' : ""}${c.name}</button>`;
      })
      .join("");

    const badge = document.getElementById("wxPostureBadge");
    if (badge) {
      if (currentCapsuleActions.length) {
        const act = currentCapsuleActions[0];
        badge.className = "wx-posture-badge";
        badge.textContent = `已选: ${act.name}`;
        badge.setAttribute(
          "data-tip",
          `本轮已选动作：${act.name}。点胶囊可更换或取消；取消后回到默认姿态。`,
        );
      } else if (postureEnabled && defaultPosture) {
        badge.className = "wx-posture-badge";
        badge.textContent = "默认: 跟缀 · 保持距离";
        badge.setAttribute(
          "data-tip",
          "未点选胶囊时，本轮以「跟缀·保持当前距离」继续跟踪。点击切换为纯叙事（不掷骰）。",
        );
      } else {
        badge.className = "wx-posture-badge narrative";
        badge.textContent = "未选动作 · 纯叙事";
        badge.setAttribute(
          "data-tip",
          "本轮没有动作：输入框文本只作伴随叙事，不触发任何检定。点击恢复默认跟缀姿态。",
        );
      }
    }
  }

  function renderActionDrawer(snap) {
    const bodyEl = document.getElementById("wxActionDrawerBody");
    if (!bodyEl) return;
    const mode = (snap && snap.mode) || "stealth";
    const validGroups = DRAWER_CATEGORIES.filter(
      (cat) => cat.modes.includes(mode) || cat.modes.includes("any"),
    );

    bodyEl.innerHTML = validGroups
      .map((cat) => {
        const visible = cat.actions
          // 「跟缀」是保持距离，不是换距离：把它绑到当前档，别让它把人往回拽
          .map((act) =>
            act.id === "follow" && /跟缀|保持|维持/.test(act.name)
              ? {
                  ...act,
                  args: {
                    ...(act.args || {}),
                    dist: (snap && snap.dist) || "same",
                  },
                }
              : act,
          )
          .map((act) => ({ act, gate: capsuleGate(act, snap) }))
          .filter((x) => !x.gate.hide);
        if (!visible.length) return "";
        const chipsHtml = visible
          .map(({ act, gate }) => {
            const isAct = currentCapsuleActions.some(
              (a) =>
                a.id === act.id &&
                JSON.stringify(a.args || {}) === JSON.stringify(act.args || {}),
            );
            const cls = [
              "wx-capsule-chip",
              isAct ? "active" : "",
              act.danger ? "danger" : "",
              gate.lock ? "locked" : "",
            ]
              .filter(Boolean)
              .join(" ");
            const tip = gate.lock ? gate.reason : act.name;
            return `<button type="button" class="${cls}" data-action-id="${act.id}" data-action-name="${act.name}" data-action-args='${JSON.stringify(act.args || {})}' data-tip="${tip}"${gate.lock ? ' aria-disabled="true"' : ""}>${isAct ? '<span class="chip-check">✓</span> ' : ""}${act.name}</button>`;
          })
          .join("");
        return `<div class="drawer-group">
        <div class="drawer-group-title">${cat.name}</div>
        <div class="drawer-group-chips">${chipsHtml}</div>
      </div>`;
      })
      .join("");
  }

  function renderActionCapsules(snap) {
    const plan = getDynamicCapsules(snap);
    defaultPosture = plan.default || {
      id: "follow",
      name: "跟缀",
      args: { dist: (snap && snap.dist) || "same" },
    };
    currentDynamicCapsules = plan.chips;
    renderActionChipsUI();
    updateInputPlaceholder();
    renderActionDrawer(snap);
  }

  function renderInventory(snap) {
    const listEl = document.getElementById("wx-items");
    if (!listEl) return;
    const inv = (snap && snap.inventory) || [];
    if (!inv.length) {
      listEl.innerHTML =
        '<li class="wx-item-empty"><span class="label">（战术行囊暂无物品）</span></li>';
      return;
    }
    listEl.innerHTML = inv
      .map((it) => {
        const typeName = ITEM_TYPE_NAMES[it.type] || "道具";
        const typeIcon = ico(ITEM_TYPE_ICONS[it.type] || "box");
        const slotText = it.slot ? ` · 槽位: ${it.slot}` : "";
        const effectText = it.effectsDesc ? `${it.effectsDesc}\n` : "";
        const tip = `【${it.name}】${effectText}· 类型：${typeName}${slotText}\n· 详情：${it.desc || "行囊装备"}`;

        let actionBtn = "";
        if (it.canEquip) {
          if (it.equipped) {
            actionBtn = `<button type="button" class="wx-item-btn btn-unequip" data-item-action="unequip" data-item-id="${it.id}">卸下</button>`;
          } else {
            actionBtn = `<button type="button" class="wx-item-btn btn-equip" data-item-action="equip" data-item-id="${it.id}">装备</button>`;
          }
        } else if (it.canUse) {
          actionBtn = `<button type="button" class="wx-item-btn btn-use" data-item-action="use" data-item-id="${it.id}">使用</button>`;
        } else {
          actionBtn = `<button type="button" class="wx-item-btn" data-wx-item="${it.id}">说明</button>`;
        }

        return `<li class="wx-item-row" data-tip="${tip}">
        <div class="wx-item-left">
          <span class="wx-item-type-badge">${typeIcon} ${typeName}</span>
          <span class="wx-item-name">${it.name}</span>
          ${it.count > 1 ? `<span class="wx-item-count">×${it.count}</span>` : ""}
          ${it.equipped ? '<span class="wx-item-equipped-pill">已装备</span>' : ""}
        </div>
        <div class="wx-item-right">
          ${actionBtn}
        </div>
      </li>`;
      })
      .join("");
  }

  /* ---------- 相册：贴墙渲染 + 拍照即时卡片 ---------- */
  const IMG_BASE = "user/images/wx_wardrobe/";
  const SLOT_CN = {
    head: "头饰",
    top: "上装",
    bottom: "下装",
    socks: "袜子",
    shoes: "鞋子",
  };
  const SLOT_ORDER = ["head", "top", "bottom", "socks", "shoes"];
  const ANGLE_CN = {
    front: "正面",
    side: "侧面",
    back: "背面",
    "three-quarter": "斜侧",
  };
  const DIST_CN_UI = {
    far: "远端",
    same: "同街",
    close: "身后",
    touch: "贴身",
  };
  const imgUrl = (file, thumb) =>
    IMG_BASE + (thumb ? String(file).replace(/\.png$/, ".jpg") : file);

  let albumSnap = null;
  let toastTimer = null,
    lastToastKey = null;

  function renderAlbum(snap) {
    if (!snap || !snap.album) return;
    albumSnap = snap;
    const wall = document.getElementById("albumWall");
    const cnt = document.getElementById("albumCount");
    if (cnt) cnt.textContent = `${snap.album.count} / ${snap.album.total}`;
    if (!wall) return;
    const shots = new Map((snap.album.shots || []).map((s) => [s.key, s]));
    wall.innerHTML = SLOT_ORDER.map((slot) => {
      const cells = (snap.album.catalog || [])
        .filter((c) => c.slot === slot)
        .map((c) => {
          const s = shots.get(c.key);
          if (!s) return '<div class="photo empty"></div>';
          return `<div class="photo" data-key="${c.key}"><img loading="lazy" src="${imgUrl(s.file, true)}" alt="" onerror="this.closest('.photo').classList.add('broken')"><span class="cap">${s.name}</span></div>`;
        })
        .join("");
      return `<div class="wall-sec" data-cn="${SLOT_CN[slot] || slot}">${cells}</div>`;
    }).join("");
  }

  function openAlbum() {
    const d = document.getElementById("wx-album-dialog");
    if (!d) return;
    renderAlbum(albumSnap || view.snapshot);
    if (!d.open) d.showModal();
  }

  function openPhoto(key) {
    const snap = albumSnap || view.snapshot;
    const s =
      snap && snap.album
        ? (snap.album.shots || []).find((x) => x.key === key)
        : null;
    if (!s) return;
    const det = document.getElementById("albumDetail");
    const img = document.getElementById("albumDetailImg");
    const meta = document.getElementById("albumDetailMeta");
    if (img) img.src = imgUrl(s.file, false);
    if (meta)
      meta.textContent = `${s.name} · ${ANGLE_CN[s.angle] || s.angle} · 第 ${s.t} 楼 · ${s.place || ""} · ${DIST_CN_UI[s.dist] || ""}`;
    if (det) det.hidden = false;
  }

  function showPhotoToast(snap) {
    const cap = snap && snap.capture;
    if (!cap || cap.key === lastToastKey) return;
    lastToastKey = cap.key;
    const box = document.getElementById("photoToast");
    if (!box) return;
    const img = document.getElementById("photoToastImg");
    const nm = document.getElementById("photoToastName");
    const mt = document.getElementById("photoToastMeta");
    if (img) img.src = imgUrl(cap.file, true);
    if (nm) nm.textContent = cap.name;
    if (mt)
      mt.textContent = `${ANGLE_CN[cap.angle] || cap.angle} · ${DIST_CN_UI[cap.dist] || ""} · 第 ${cap.t} 楼`;
    box.hidden = false;
    box.onclick = () => {
      box.hidden = true;
      openAlbum();
      openPhoto(cap.key);
    };
    lifecycle.clearTimeout(toastTimer);
    toastTimer = lifecycle.timeout(() => {
      box.hidden = true;
    }, 6000);
  }

  /* 相册交互：入口、翻拍、放大关闭 */
  lifecycle.on(document, "click", (e) => {
    if (e.target.closest("#openAlbumBtn")) {
      openAlbum();
      return;
    }
    const p = e.target.closest("#albumWall .photo[data-key]");
    if (p) {
      openPhoto(p.dataset.key);
      return;
    }
    const det = e.target.closest("#albumDetail");
    if (det) det.hidden = true;
  });

  /* ---------- 渲染：snapshot → 面板（真机唯一入口） ---------- */

  function renderSnapshot(snap) {
    details.render(snap);
    return render(snap);
  }

  /* ---------- 交互：心跳仪表盘向上弹出子菜单 + 方案 A 居中手持战术终端 + 🎵声音子面板 ---------- */
  const heartPillBtn = document.getElementById("heartPillBtn");
  const heartPopoverCard = document.getElementById("heartPopoverCard");
  const heartPopoverClose = document.getElementById("heartPopoverClose");
  const terminalToggleBtn =
    document.getElementById("wx-terminal-toggle-btn") ||
    document.getElementById("terminalToggleBtn");
  const terminalDialog =
    document.getElementById("wx-terminal-dialog") ||
    document.getElementById("wx-terminal-backdrop") ||
    document.getElementById("terminalBackdrop");
  const terminalCloseBtn =
    document.getElementById("wx-terminal-close-btn") ||
    document.getElementById("terminalCloseBtn");
  const audioMenuBtn = document.getElementById("audioMenuBtn");
  const audioPopoverPanel = document.getElementById("audioPopoverPanel");

  let isPopoverOpen = false;
  let isTerminalOpen = false;
  let isAudioPanelOpen = false;

  function reportLayout() {
    if (window.parent === window) return;
    try {
      if (isPopoverOpen) {
        parent.postMessage({ wxH: 340, wxPop: true, wxDrawer: false }, "*");
      } else {
        parent.postMessage({ wxH: 38, wxPop: false, wxDrawer: false }, "*");
      }
    } catch (e) {}
  }

  function updateHeartPopoverPos() {
    // 采用稳定绝对定位：依托 .heart-popover-wrap 向上弹出，免疫祖先 transform 造成的 fixed 坐标错乱飞移
    if (!heartPopoverCard || !isPopoverOpen) return;
    heartPopoverCard.style.position = "";
    heartPopoverCard.style.bottom = "";
    heartPopoverCard.style.right = "";
    heartPopoverCard.style.left = "";
    heartPopoverCard.style.top = "";
  }

  function setPopover(open) {
    isPopoverOpen = open;
    if (heartPopoverCard) {
      heartPopoverCard.classList.toggle("show", isPopoverOpen);
      if (isPopoverOpen) updateHeartPopoverPos();
    }
    if (heartPillBtn) {
      heartPillBtn.classList.toggle("open", isPopoverOpen);
      heartPillBtn.setAttribute("aria-expanded", String(isPopoverOpen));
    }
    // 互斥：打开心跳表盘时自动收拢终端与声音面板
    if (isPopoverOpen) {
      if (terminalDialog && terminalDialog.open) setTerminal(false);
      if (isAudioPanelOpen) setAudioPanel(false);
    }
    reportLayout();
  }

  function syncTerminalBtnState() {
    const isOpen = !!(terminalDialog && terminalDialog.open);
    isTerminalOpen = isOpen;
    if (terminalToggleBtn) {
      terminalToggleBtn.classList.toggle("active", isOpen);
      terminalToggleBtn.setAttribute("aria-expanded", String(isOpen));
      const txt = terminalToggleBtn.querySelector(".term-txt");
      if (txt) txt.textContent = isOpen ? "关闭终端" : "战术终端";
    }
  }

  function setTerminal(open) {
    if (!terminalDialog) return;
    if (open) {
      if (!terminalDialog.open) {
        if (typeof terminalDialog.showModal === "function") {
          terminalDialog.showModal();
        } else {
          terminalDialog.setAttribute("open", "");
        }
      }
    } else {
      if (terminalDialog.open) {
        if (typeof terminalDialog.close === "function") {
          terminalDialog.close();
        } else {
          terminalDialog.removeAttribute("open");
        }
      }
    }
    syncTerminalBtnState();
    // 互斥：打开终端时自动收起心跳表盘与声音面板
    if (terminalDialog.open) {
      if (isPopoverOpen) setPopover(false);
      if (isAudioPanelOpen) setAudioPanel(false);
    }
  }

  if (terminalDialog) {
    lifecycle.on(terminalDialog, "close", syncTerminalBtnState);
  }

  function setAudioPanel(open) {
    isAudioPanelOpen = open;
    if (audioPopoverPanel) {
      audioPopoverPanel.style.display = isAudioPanelOpen ? "flex" : "none";
    }
    if (audioMenuBtn) {
      audioMenuBtn.classList.toggle("active", isAudioPanelOpen);
      audioMenuBtn.setAttribute("aria-expanded", String(isAudioPanelOpen));
    }
  }

  if (heartPillBtn) {
    lifecycle.on(heartPillBtn, "click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setPopover(!isPopoverOpen);
    });
  }

  if (terminalToggleBtn) {
    lifecycle.on(terminalToggleBtn, "click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = !!(terminalDialog && terminalDialog.open);
      setTerminal(!isOpen);
    });
  }

  lifecycle.on(window, "resize", updateHeartPopoverPos);
  lifecycle.on(window, "scroll", updateHeartPopoverPos, true);

  // 全局捕获：关闭按钮、遮罩点击、外部失焦与 ESC 键（严格限定本插件作用域，绝不干扰酒馆与其他扩展）
  lifecycle.on(document, "click", (e) => {
    // 1. 关闭按钮：仅限本插件拥有的关闭触发器
    const closeBtn = e.target.closest(
      "[data-wx-close], [data-close], .wx-modal-close, .close-icon, #wx-terminal-close-btn, #terminalCloseBtn, #heartPopoverClose",
    );
    if (
      closeBtn &&
      closeBtn.closest(
        "#wx-statusbar-root, #wx-modals-root, dialog.wx-dialog, .trpg",
      )
    ) {
      e.preventDefault();
      e.stopPropagation();
      if (closeBtn.id === "heartPopoverClose") {
        setPopover(false);
      } else if (
        closeBtn.id === "wx-terminal-close-btn" ||
        closeBtn.id === "terminalCloseBtn" ||
        closeBtn.closest("#wx-terminal-dialog")
      ) {
        setTerminal(false);
      } else {
        const d = closeBtn.closest("dialog.wx-dialog");
        if (d) d.close();
      }
      return;
    }

    // 2. 点击尾行专属 dialog.wx-dialog 自身背景 (外围空白)
    if (
      e.target.tagName === "DIALOG" &&
      e.target.classList.contains("wx-dialog") &&
      e.target.open
    ) {
      const rect = e.target.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        e.target.close();
        return;
      }
    }

    // 4. 点击心跳仪表盘外部收起
    if (
      isPopoverOpen &&
      heartPopoverCard &&
      !heartPopoverCard.contains(e.target) &&
      !heartPillBtn?.contains(e.target)
    ) {
      setPopover(false);
    }

    // 5. 点击声音设置外部收起
    if (
      isAudioPanelOpen &&
      audioPopoverPanel &&
      !audioPopoverPanel.contains(e.target) &&
      !audioMenuBtn?.contains(e.target)
    ) {
      setAudioPanel(false);
    }
  });

  lifecycle.on(document, "keydown", (e) => {
    if (e.key === "Escape") {
      if (isPopoverOpen) setPopover(false);
      if (isTerminalOpen) setTerminal(false);
      if (isAudioPanelOpen) setAudioPanel(false);
      // 仅关闭尾行自有的 dialog，绝不波及宿主或其他扩展
      document
        .querySelectorAll("dialog.wx-dialog[open]")
        .forEach((d) => d.close());
    }
  });

  const openers = new WeakMap();
  function openDialog(id, button) {
    const dialog = document.getElementById(id);
    if (!dialog || dialog.open) return;
    openers.set(dialog, button);
    dialog.showModal();
    if (id === "wx-profile-dialog" || id === "profile") playShutterSound();
  }

  async function handleItemAction(action, itemId) {
    const glue =
      (typeof window !== "undefined" && window.WxGlue) ||
      (typeof globalThis !== "undefined" && globalThis.WxGlue);
    if (glue?.command) {
      const methods = {
        equip: "equipItem",
        unequip: "unequipItem",
        use: "useItem",
      };
      if (!methods[action]) return;
      try {
        await glue.command(methods[action], itemId);
        playFootstepSound();
      } catch (error) {
        reportSyncError(error);
      }
      return;
    }

    if (!__WX_PREVIEW__) {
      reportSyncError("ENGINE_UNAVAILABLE");
      return;
    }
    // 独立预览只在开发包模拟，不在正式包伪造资源变化
    if (view.snapshot && view.snapshot.inventory) {
      const it = view.snapshot.inventory.find((i) => i.id === itemId);
      if (!it) return;
      if (action === "equip") {
        view.snapshot.inventory.forEach((other) => {
          if (other.slot && other.slot === it.slot) other.equipped = false;
        });
        it.equipped = true;
      } else if (action === "unequip") {
        it.equipped = false;
      } else if (action === "use") {
        if (itemId === "energy_drink") {
          view.snapshot.player.stamina = Math.min(
            100,
            view.snapshot.player.stamina + 20,
          );
          view.snapshot.player.heart = Math.min(
            100,
            view.snapshot.player.heart + 10,
          );
        } else if (itemId === "bento") {
          view.snapshot.player.stamina = Math.min(
            100,
            view.snapshot.player.stamina + 20,
          );
        } else if (itemId === "onigiri") {
          view.snapshot.player.stamina = Math.min(
            100,
            view.snapshot.player.stamina + 8,
          );
        }
        it.count = (it.count || 1) - 1;
        if (it.count <= 0) {
          view.snapshot.inventory = view.snapshot.inventory.filter(
            (i) => i.id !== itemId,
          );
        }
      }
      renderSnapshot(view.snapshot);
      playFootstepSound();
    }
  }

  function handleActionClick(event) {
    const button = event.target.closest("button");
    if (!button) return;
    // 关键门禁：不是尾行组件内部的按钮，直接放行，绝不拦截任何事件！
    if (
      !button.closest(
        "#wx-statusbar-root, #wx-modals-root, .wx-terminal-backdrop, dialog.wx-dialog, .trpg",
      )
    )
      return;

    if (button.id === "heartbeat-sound") {
      event.preventDefault();
      event.stopPropagation();
      void toggleAudio();
    } else if (
      button.id === "audioMenuBtn" ||
      button.id === "wx-audio-menu-btn"
    ) {
      event.preventDefault();
      event.stopPropagation();
      setAudioPanel(!isAudioPanelOpen);
    } else if (button.dataset.itemAction) {
      event.preventDefault();
      event.stopPropagation();
      const action = button.dataset.itemAction;
      const itemId = button.dataset.itemId;
      void handleItemAction(action, itemId);
    } else if (button.dataset.wxItem || button.dataset.item) {
      event.preventDefault();
      event.stopPropagation();
      const itemKey = button.dataset.wxItem || button.dataset.item;
      const item = view.snapshot?.inventory?.find((it) => it.id === itemKey);
      if (!item) return;
      const titleEl = document.getElementById("item-title");
      const descEl = document.getElementById("item-description");
      if (titleEl) titleEl.textContent = item.name;
      if (descEl) descEl.textContent = item.desc || "暂无说明";
      const meta = document.getElementById("itemMeta");
      if (meta) meta.textContent = `持有数量：${item.count ?? 0}`;
      openDialog("wx-item-dialog", button);
    } else if (button.dataset.wxDialog || button.dataset.dialog) {
      event.preventDefault();
      event.stopPropagation();
      const rawDiag = button.dataset.wxDialog || button.dataset.dialog;
      const diagId = rawDiag.startsWith("wx-")
        ? rawDiag
        : `wx-${rawDiag}-dialog`;
      openDialog(diagId, button);
    }
  }
  lifecycle.on(document, "click", handleActionClick);
  document.querySelectorAll("dialog.wx-dialog").forEach((dialog) => {
    lifecycle.on(dialog, "close", () =>
      openers.get(dialog)?.focus({ preventScroll: true }),
    );
  });

  document.querySelectorAll(".preview-tools [data-preset]").forEach((button) =>
    lifecycle.on(button, "click", () => {
      if (typeof REPLAY !== "undefined" && REPLAY.on) exitReplay(); // 演示/回放互斥
      document
        .querySelectorAll(".preview-tools [data-preset]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      playFootstepSound();
      renderSnapshot(MOCKS[button.dataset.preset]);
    }),
  );
  lifecycle.on(document.getElementById("spike"), "click", spike);

  /* ---------- 真机回放（replay.json = tools/drive.mjs 跑出的引擎逐楼真快照） ---------- */
  const REPLAY = { frames: [], idx: 0, on: false };
  const replayToggle = document.getElementById("replayToggle");
  const replayPrev = document.getElementById("replayPrev");
  const replayNext = document.getElementById("replayNext");
  const replayLabel = document.getElementById("replayLabel");

  function exitReplay() {
    REPLAY.on = false;
    if (replayToggle) {
      replayToggle.textContent = "▶ 真机回放";
      replayToggle.setAttribute("aria-pressed", "false");
    }
    if (replayPrev) replayPrev.hidden = true;
    if (replayNext) replayNext.hidden = true;
    if (replayLabel) replayLabel.hidden = true;
  }
  function renderReplayFrame(i) {
    REPLAY.idx = Math.max(0, Math.min(i, REPLAY.frames.length - 1));
    const f = REPLAY.frames[REPLAY.idx];
    renderSnapshot(f.snap);
    if (replayLabel)
      replayLabel.textContent = `帧 ${REPLAY.idx + 1}/${REPLAY.frames.length} · ${f.label}`;
  }
  if (replayToggle) {
    lifecycle.on(replayToggle, "click", async () => {
      if (!REPLAY.on) {
        if (!REPLAY.frames.length) {
          try {
            const res = await fetch("replay.json");
            if (!res.ok) throw new Error(res.status);
            REPLAY.frames = (await res.json()).frames || [];
          } catch (e) {
            replayToggle.textContent = "回放文件缺失";
            return;
          }
        }
        REPLAY.on = true;
        replayToggle.textContent = "⏸ 演示模式";
        replayToggle.setAttribute("aria-pressed", "true");
        if (replayPrev) replayPrev.hidden = false;
        if (replayNext) replayNext.hidden = false;
        if (replayLabel) replayLabel.hidden = false;
        renderReplayFrame(0);
      } else exitReplay();
    });
  }
  if (replayPrev) {
    lifecycle.on(replayPrev, "click", () => {
      if (REPLAY.on) {
        playFootstepSound();
        renderReplayFrame(REPLAY.idx - 1);
      }
    });
  }
  if (replayNext) {
    lifecycle.on(replayNext, "click", () => {
      if (REPLAY.on) {
        playFootstepSound();
        renderReplayFrame(REPLAY.idx + 1);
      }
    });
  }

  lifecycle.on(document.getElementById("volHeart"), "input", (e) => {
    audio.vol.heart = +e.target.value / 100;
    if (audio.context) applyVolumes();
  });
  lifecycle.on(document.getElementById("volRain"), "input", (e) => {
    audio.vol.rain = +e.target.value / 100;
    if (audio.context) applyVolumes();
  });
  lifecycle.on(document.getElementById("volTinn"), "input", (e) => {
    audio.vol.tinnitus = +e.target.value / 100;
    if (audio.audioOn) tinnitus();
  });
  lifecycle.on(document.getElementById("volStep"), "input", (e) => {
    audio.vol.step = +e.target.value / 100;
  });

  lifecycle.on(document, "visibilitychange", () => {
    root.classList.toggle("motion-paused", document.hidden);
    if (document.hidden) stopAudio("页面已暂停，点击可重新开启心跳声");
  });
  function dispose() {
    lifecycle.dispose();
    stopAudio();
    if (audio.context && audio.context.state !== "closed")
      audio.context.close().catch(() => {});
    observer.disconnect();
  }
  const observer = new MutationObserver(() => {
    if (!root.isConnected) dispose();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  lifecycle.on(window, "pagehide", dispose);

  /* ═══ 零楼 · 开局面板（v0.8 开局身份制 UI）：选身份 → 分 20 点 → 写 wx_init → 引擎开局。
     零楼数零 token：全程前端本地完成，LLM 从一楼起照快照 identity 字段演戏。
     数据真源 rules.json → identity；此内嵌一份供两端共用，tests/statusbar-create.test.js 对齐防漂移。 ═══ */

  /* 档位人话（数值策划五维档位表直译：体格男性列＋其余四维） */

  const ZERO = {
    step: 1,
    mode: null,
    identity: null,
    targetId: "college",
    targetPersona: null,
    personas: {},
    points: { str: 4, agi: 4, nrv: 4, int: 4, cha: 4 },
    done: false,
  };
  const sumPts = () => Object.values(ZERO.points).reduce((a, b) => a + b, 0);
  const idDef = () =>
    ZERO.identity ? IDENTITY_DATA.list[ZERO.identity] : null;

  function switchPane(name) {
    document
      .querySelectorAll("#wx-zero-floor .create-tab")
      .forEach((t) => t.classList.toggle("active", t.dataset.ctab === name));
    const quick = document.querySelector('[data-cpane="quick"]'),
      custom = document.querySelector('[data-cpane="custom"]');
    if (quick) quick.hidden = name !== "quick";
    if (custom) custom.hidden = name !== "custom";
  }

  const zeroFloor = createZeroFloorHost({
    document,
    window,
    lifecycle,
    preview: __WX_PREVIEW__,
  });
  const stages = createStages({
    document,
    lifecycle,
    onChange: (step) => {
      ZERO.step = step;
    },
  });
  stages.register(1, { tabId: "zeroStepTab1", viewId: "zeroStep1" });
  stages.register(2, {
    tabId: "zeroStepTab2",
    viewId: "zeroStep2",
    canEnter: () => !!ZERO.identity && sumPts() === POINT_BUDGET,
    enter: () => {
      renderTargetGrid();
      updateTargetDetail(ZERO.targetId || "college");
    },
  });
  function switchZeroStep(step) {
    stages.go(step);
  }

  function renderTargetGrid() {
    const grid = document.getElementById("targetGrid");
    if (!grid) return;
    if (!grid.dataset.built) {
      grid.dataset.built = "1";
      grid.innerHTML = Object.entries(TARGET_DATA.list)
        .map(
          ([id, t]) =>
            `<button type="button" class="target-card" data-tid="${id}">` +
            `<div class="target-head"><span class="target-name">${t.name}</span><span class="target-stars">${t.stars}</span></div>` +
            `<div class="target-meta-row"><span class="target-type-badge">${t.type}</span><span class="target-area">${t.area}</span></div>` +
            `<div class="target-tagline">“${t.tagline}”</div>` +
            `<div class="target-features">${t.features}</div>` +
            `</button>`,
        )
        .join("");
      grid.querySelectorAll("[data-tid]").forEach((btn) => {
        lifecycle.on(btn, "click", () => {
          updateTargetDetail(btn.dataset.tid);
        });
      });
    }
    grid.querySelectorAll("[data-tid]").forEach((btn) => {
      btn.classList.toggle(
        "sel",
        btn.dataset.tid === (ZERO.targetId || "college"),
      );
    });
  }

  function updateTargetDetail(tid, forceReroll = false) {
    const t = TARGET_DATA.list[tid] || TARGET_DATA.list.college;
    ZERO.targetId = t.id;
    if (
      !ZERO.targetPersona ||
      ZERO.targetPersona.targetId !== t.id ||
      forceReroll
    ) {
      try {
        ZERO.targetPersona =
          !forceReroll && ZERO.personas[t.id]
            ? ZERO.personas[t.id]
            : generateTargetPersona(t.id);
        ZERO.personas[t.id] = ZERO.targetPersona;
      } catch (error) {
        ZERO.targetPersona = null;
        const hint = document.getElementById("targetHint");
        if (hint) hint.textContent = "该目标暂时无法生成，请选择其他目标。";
        const confirm = document.getElementById("createConfirm");
        if (confirm) confirm.disabled = true;
        console.warn(
          "[PERSONA:GENERATION_FAILED]",
          error.code || error.message,
        );
        return;
      }
    }

    const persona = ZERO.targetPersona;
    const grid = document.getElementById("targetGrid");
    if (grid) {
      grid
        .querySelectorAll("[data-tid]")
        .forEach((btn) =>
          btn.classList.toggle("sel", btn.dataset.tid === t.id),
        );
    }
    const dName = document.getElementById("tDetailName");
    if (dName) dName.textContent = `${persona.name} · ${t.name}`;
    const dRealName = document.getElementById("tDetailRealName");
    if (dRealName) dRealName.textContent = persona.name;
    const nameSource = document.getElementById("tDetailNameSource");
    if (nameSource)
      nameSource.textContent = `（${TARGET_NAME_POOL.surnames.length} 姓 × ${TARGET_NAME_POOL.givenNames.length} 名）`;
    const dPersonality = document.getElementById("tDetailPersonality");
    if (dPersonality) {
      dPersonality.innerHTML = `<span class="tag personality" data-tip="${persona.personalityDesc || ""}">${persona.personality}</span>`;
    }
    const dHobby = document.getElementById("tDetailHobby");
    if (dHobby) {
      dHobby.innerHTML = `<span class="tag hobby" data-tip="${persona.hobbyDesc || ""}">${persona.hobby}</span>`;
    }
    const dShoe = document.getElementById("tDetailShoe");
    if (dShoe) {
      dShoe.innerHTML = `<span class="tag equipment" data-tip="${persona.shoeDesc || ""}">${persona.shoeName || "默认鞋具"}</span>`;
    }
    const dStars = document.getElementById("tDetailStars");
    if (dStars) dStars.textContent = t.stars;
    const dBadge = document.getElementById("tDetailBadge");
    if (dBadge) dBadge.textContent = t.type;
    const dStatus = document.getElementById("tDetailStatus");
    if (dStatus) {
      dStatus.textContent = TARGET_DATA.content?.[t.id]?.hasPack
        ? "生活包已接入"
        : "生活包未完成";
    }
    const dArea = document.getElementById("tDetailArea");
    if (dArea) dArea.textContent = t.area;
    const dTagline = document.getElementById("tDetailTagline");
    if (dTagline) dTagline.textContent = t.tagline;
    const dFeat = document.getElementById("tDetailFeatures");
    if (dFeat) dFeat.textContent = t.features;
    const dWin = document.getElementById("tDetailWindow");
    if (dWin) dWin.textContent = t.windowNote;
    const dStats = document.getElementById("tDetailStats");
    if (dStats) {
      dStats.innerHTML =
        '体格 <b>？</b> · 敏捷 <b>？</b> · 敏锐 <b>？</b> · 胆量 <b>？</b> · 社交 <b>？</b> <small class="label" style="margin-left:6px">（情报迷雾 · 打量或调查后揭示）</small>';
    }
    const hint = document.getElementById("targetHint");
    if (hint)
      hint.textContent = `已锁定：${persona.name} · ${t.name}（${t.area}）`;
    const btn = document.getElementById("createConfirm");
    if (btn) btn.disabled = false;
  }

  function syncCreate() {
    /* 快捷预设页 */
    const quickPane = document.getElementById("quickPane");
    if (quickPane && !quickPane.dataset.built) {
      quickPane.dataset.built = "1";
      quickPane.innerHTML =
        '<div class="preset-grid">' +
        PRESETS.map(
          (p) =>
            `<button type="button" class="id-card preset" data-preset="${p.id}" data-tip="一键填入身份与推荐点数，落地后仍可微调">` +
            `<span class="id-name">${p.label}</span><span class="id-tagline">${p.note}</span>` +
            `<span class="id-line">体${p.pts.str} 敏${p.pts.agi} 胆${p.pts.nrv} 情${p.pts.int} 口${p.pts.cha} ＋${IDENTITY_DATA.list[p.id].name}身份修正</span></button>`,
        ).join("") +
        "</div>" +
        '<p class="label" style="margin-top:10px">五个老出身模板＝身份＋推荐点数的快捷方式；学生与罪犯在「自定义」页选。</p>';
      quickPane.querySelectorAll("[data-preset]").forEach((b) =>
        lifecycle.on(b, "click", () => {
          const p = PRESETS.find((x) => x.id === b.dataset.preset);
          if (!p) return;
          ZERO.identity = p.id;
          ZERO.points = { ...p.pts };
          switchPane("custom");
          syncCreate();
        }),
      );
    }
    /* 身份七宫格 */
    const grid = document.getElementById("idGrid");
    if (grid && !grid.dataset.built) {
      grid.dataset.built = "1";
      grid.innerHTML = Object.entries(IDENTITY_DATA.list)
        .map(
          ([id, d]) =>
            `<button type="button" class="id-card" data-id="${id}"><span class="id-name">${d.name}</span>` +
            `<span class="id-tagline">${d.tagline}</span>` +
            `<span class="id-line">修正 <b>${Object.entries(d.mods)
              .map(([k, v]) => ATTR_NAMES[k] + "+" + v)
              .join(" ")}</b></span>` +
            `<span class="id-line"><b>特权</b>　${d.perk}</span>` +
            `<span class="id-line${d.flaw === "无" ? "" : " bad"}"><b>${d.flaw === "无" ? "负面" : "负面"}</b>　${d.flaw}</span>` +
            `<span class="id-line"><b>工种</b>　${d.job}</span></button>`,
        )
        .join("");
      grid.querySelectorAll("[data-id]").forEach((b) =>
        lifecycle.on(b, "click", () => {
          ZERO.identity = b.dataset.id;
          syncCreate();
        }),
      );
    }
    grid
      ?.querySelectorAll("[data-id]")
      .forEach((b) =>
        b.classList.toggle("sel", b.dataset.id === ZERO.identity),
      );
    /* 分点行 */
    const rows = document.getElementById("allocRows");
    if (rows && !rows.dataset.built) {
      rows.dataset.built = "1";
      rows.innerHTML = Object.keys(ATTR_NAMES)
        .map(
          (k) =>
            `<div class="alloc-row" data-k="${k}"><span class="alloc-name">${ATTR_NAMES[k]}</span>` +
            `<span class="stepper"><button type="button" data-step="-1" aria-label="${ATTR_NAMES[k]}减一">−</button>` +
            `<span class="alloc-val" data-val>4</span>` +
            `<button type="button" data-step="1" aria-label="${ATTR_NAMES[k]}加一">＋</button></span>` +
            `<span class="alloc-mod" data-mod>—</span><span class="alloc-tier" data-tier></span></div>`,
        )
        .join("");
      rows.querySelectorAll(".alloc-row").forEach((row) => {
        const k = row.dataset.k;
        row.querySelectorAll("[data-step]").forEach((b) =>
          lifecycle.on(b, "click", () => {
            const d = +b.dataset.step;
            const nv = ZERO.points[k] + d;
            if (nv < 1 || nv > 10 || (d > 0 && sumPts() >= POINT_BUDGET))
              return;
            ZERO.points[k] = nv;
            syncCreate();
          }),
        );
      });
    }
    if (rows) {
      let waste = 0;
      const def = idDef();
      rows.querySelectorAll(".alloc-row").forEach((row) => {
        const k = row.dataset.k,
          v = ZERO.points[k],
          mod = def ? def.mods[k] || 0 : 0;
        const eff = Math.min(10, v + mod);
        waste += Math.max(0, v + mod - 10);
        row.querySelector("[data-val]").textContent = v;
        const modEl = row.querySelector("[data-mod]");
        modEl.textContent = mod
          ? `${v}${mod > 0 ? "+" : ""}${mod}=${v + mod}${eff < v + mod ? "→" + eff : ""}`
          : "—";
        modEl.classList.toggle("waste", eff < v + mod);
        row.querySelector("[data-tier]").textContent = tierOf(k, eff);
      });
      const warnEl = document.getElementById("allocWarn");
      if (warnEl)
        warnEl.textContent =
          waste > 0 ? `身份修正溢出 10 封顶，将浪费 ${waste} 点——建议挪开` : "";
      const remain = POINT_BUDGET - sumPts();
      const remEl = document.getElementById("allocRemain");
      if (remEl) {
        remEl.textContent = remain === 0 ? "点数已分完 ✓" : `剩余 ${remain}`;
        remEl.classList.toggle("warn", remain > 0);
      }
    }
    /* 底部按钮与提示 */
    const ok = !!ZERO.identity && sumPts() === POINT_BUDGET;
    const nextBtn = document.getElementById("zeroNextStep");
    if (nextBtn) nextBtn.disabled = !ok;
    const tab2 = document.getElementById("zeroStepTab2");
    if (tab2) {
      tab2.style.cursor = ok ? "pointer" : "not-allowed";
      tab2.title = ok ? "进入步骤二：锁定目标" : "请先选定身份并分完 20 点";
    }
    const tab1 = document.getElementById("zeroStepTab1");
    if (tab1) tab1.classList.toggle("completed", ok);
    const hint = document.getElementById("createHint");
    if (hint)
      hint.textContent = !ZERO.identity
        ? "先选一个身份"
        : sumPts() !== POINT_BUDGET
          ? `还剩 ${POINT_BUDGET - sumPts()} 点没分`
          : `猎手就绪：${idDef().name} · ${Object.entries(ZERO.points)
              .map(([k, v]) => ATTR_NAMES[k] + v)
              .join(" ")}`;
  }

  function openCreate() {
    switchZeroStep(ZERO.step || 1);
    syncCreate();
    zeroFloor.show();
  }

  async function createConfirm() {
    if (
      !ZERO.identity ||
      sumPts() !== POINT_BUDGET ||
      !ZERO.targetPersona ||
      ZERO.targetPersona.targetId !== ZERO.targetId
    )
      return;
    const def = idDef();
    const targetDef =
      TARGET_DATA.list[ZERO.targetId || "college"] || TARGET_DATA.list.college;
    const persona = ZERO.targetPersona;
    const init = {
      identity: ZERO.identity,
      targetId: ZERO.targetId || "college",
      targetPersona: persona,
      player: { ...ZERO.points, staminaMax: 100 + (ZERO.points.str || 4) * 5 },
    };
    if (ZERO.mode === "tavern") {
      const glue = window.WxGlue || globalThis.WxGlue;
      if (!glue || !glue.newGame) {
        const hint =
          document.getElementById("targetHint") ||
          document.getElementById("createHint");
        if (hint) hint.textContent = "引擎未就绪，稍等几秒再试";
        return;
      }
      const button = document.getElementById("createConfirm");
      if (button) button.disabled = true;
      try {
        await glue.newGame(init);
        if (lifecycle.disposed) return;
        ZERO.done = true;
      } catch (error) {
        reportSyncError(error);
        return;
      } finally {
        if (button) button.disabled = false;
      }
    } else {
      ZERO.done = true;
      try {
        localStorage.setItem("wx_zero", JSON.stringify(init));
      } catch (e) {
        /* 隐私模式等：仅本会话生效 */
      }
      renderSnapshot({
        ...view.snapshot,
        target: {
          ...view.snapshot.target,
          id: targetDef.id,
          name: persona
            ? `${persona.name} · ${targetDef.name}`
            : targetDef.name,
          realName: persona ? persona.name : null,
          persona: persona || null,
        },
        identity: { id: init.identity, name: def.name, shift: null, kit: null },
      });
    }
    zeroFloor.hide();
    updateZeroChip();
  }

  function updateIdBadge(snap) {
    const b = document.getElementById("idBadge");
    if (!b) return;
    const id = snap && snap.identity;
    if (id && id.name) {
      b.hidden = false;
      const d = IDENTITY_DATA.list[id.id];
      b.innerHTML =
        ico("person") +
        " " +
        id.name +
        (id.shift === "night"
          ? " · 夜班周"
          : id.shift === "day"
            ? " · 昼班周"
            : "");
      b.dataset.tip = d
        ? `${d.tagline}\n特权：${d.perk}\n负面：${d.flaw}\n工种：${d.job}`
        : "开局身份";
    } else b.hidden = true;
  }

  function updateZeroChip() {
    const c = document.getElementById("zeroChip");
    if (c) c.hidden = !!ZERO.done;
    if (ZERO.done) zeroFloor.hide();
  }

  function openIdDetail() {
    const snapId = (view.snapshot && view.snapshot.identity) || null;
    const d = snapId ? IDENTITY_DATA.list[snapId.id] : null;
    const body = document.getElementById("idDetailBody");
    if (body) {
      body.innerHTML = !snapId
        ? '<p class="label">尚未开局（零楼未完成）。</p>'
        : `<p style="margin:0 0 6px;font-size:16px;font-weight:700">${d.name}</p>` +
          `<p class="label" style="font-style:italic">${d.tagline}</p>` +
          `<p class="id-line" style="font-size:13px"><b>特权</b>　${d.perk}</p>` +
          `<p class="id-line bad" style="font-size:13px"><b>负面</b>　${d.flaw}</p>` +
          `<p class="id-line" style="font-size:13px"><b>工种</b>　${d.job}</p>` +
          (snapId.shift
            ? `<p class="id-line" style="font-size:13px"><b>本周班次</b>　${snapId.shift === "night" ? "夜班——今晚在岗，夜窗被占" : "昼班——白天在岗，夜窗自由"}</p>`
            : "") +
          (snapId.kit
            ? `<p class="id-line" style="font-size:13px"><b>随身</b>　针孔摄像机（存储档）</p>`
            : "");
    }
    const dlg = document.getElementById("wx-id-dialog");
    if (dlg && !dlg.open) {
      if (typeof dlg.showModal === "function") dlg.showModal();
      else dlg.setAttribute("open", "");
    }
  }

  async function resetZero() {
    if (!window.confirm("重开新局？当前进度将清空，回到零楼重新选身份与目标。"))
      return;
    ZERO.done = false;
    ZERO.step = 1;
    ZERO.identity = null;
    ZERO.targetId = "college";
    ZERO.targetPersona = null;
    ZERO.personas = {};
    ZERO.points = { str: 4, agi: 4, nrv: 4, int: 4, cha: 4 };
    try {
      localStorage.removeItem("wx_zero");
    } catch (e) {}
    if (ZERO.mode === "tavern") {
      const glue = window.WxGlue || globalThis.WxGlue;
      if (glue && glue.resetGame) {
        try {
          await glue.resetGame();
        } catch (e) {}
      }
    }
    document.getElementById("wx-id-dialog")?.close();
    updateIdBadge(null); // 徽记随局清空，不留旧身份残影
    if (ZERO.mode === "demo")
      renderSnapshot({ ...view.snapshot, identity: null });
    updateZeroChip();
    openCreate();
  }

  document
    .querySelectorAll("#wx-zero-floor .create-tab")
    .forEach((t) => lifecycle.on(t, "click", () => switchPane(t.dataset.ctab)));
  lifecycle.on(document.getElementById("zeroChip"), "click", openCreate);
  lifecycle.on(document.getElementById("idBadge"), "click", openIdDetail);
  lifecycle.on(document.getElementById("zeroNextStep"), "click", () =>
    switchZeroStep(2),
  );
  lifecycle.on(document.getElementById("zeroPrevStep"), "click", () =>
    switchZeroStep(1),
  );
  lifecycle.on(document.getElementById("tDetailReroll"), "click", () => {
    updateTargetDetail(ZERO.targetId || "college", true);
  });
  lifecycle.on(
    document.getElementById("createConfirm"),
    "click",
    createConfirm,
  );
  lifecycle.on(document.getElementById("idResetBtn"), "click", () => {
    resetZero();
  });

  /* 零楼初始化：真机（有酒馆变量 API）查 wx_save 定新局；本地演示查 localStorage */
  (async function zeroFloorInit() {
    const holder = window.TavernHelper?.getVariables
      ? window.TavernHelper
      : typeof window.getVariables === "function"
        ? window
        : typeof getVariables === "function"
          ? globalThis
          : globalThis.TavernHelper && globalThis.TavernHelper.getVariables
            ? globalThis.TavernHelper
            : null;
    const contextScope = () => {
      const c = window.SillyTavern?.getContext?.();
      return scopeKey(c?.characterId ?? c?.this_chid, c?.chatId ?? c?.chat_id);
    };
    const initialScope = contextScope();
    if (holder) {
      ZERO.mode = "tavern";
      try {
        const v = await holder.getVariables({ type: "chat" });
        if (lifecycle.disposed || initialScope !== contextScope()) return;
        const hasSave = v && v.wx_save && [1, 2].includes(v.wx_save.v);
        ZERO.done = !!hasSave; // 有档＝续局，不弹零楼
        if (!hasSave) openCreate();
      } catch (e) {
        if (!lifecycle.disposed && initialScope === contextScope())
          openCreate();
      }
    } else {
      if (!__WX_PREVIEW__) {
        ZERO.mode = "tavern";
        openCreate();
        updateZeroChip();
        return;
      }
      ZERO.mode = "demo";
      let saved = null;
      try {
        saved = JSON.parse(localStorage.getItem("wx_zero") || "null");
      } catch (e) {}
      if (saved && saved.identity && IDENTITY_DATA.list[saved.identity]) {
        ZERO.done = true;
        ZERO.identity = saved.identity;
        ZERO.targetId = saved.targetId || "college";
        ZERO.targetPersona = saved.targetPersona || null;
        if (saved.player) ZERO.points = { ...saved.player };
        const tDef =
          TARGET_DATA.list[ZERO.targetId] || TARGET_DATA.list.college;
        const p = ZERO.targetPersona;
        renderSnapshot({
          ...view.snapshot,
          target: {
            ...view.snapshot.target,
            id: tDef.id,
            name: p ? `${p.name} · ${tDef.name}` : tDef.name,
            realName: p ? p.name : null,
            persona: p || null,
          },
          identity: {
            id: saved.identity,
            name: IDENTITY_DATA.list[saved.identity].name,
            shift: null,
            kit: null,
          },
        });
      } else openCreate();
    }
    updateZeroChip();
  })();

  /* ═══ M4-2 三翼战术 Canvas 判定台引擎（三翼因果流动 ⇄ 3D物理晶体d20 ⇄ 即时账目与暗账揭秘） ═══ */
  const { SETTLE, showSettle, stopSettleAnimation } = createSettlement({
    document,
    window,
    lifecycle,
    getAudioContext: () => audio.context,
    getHeart: () => view.heart,
    heartToBpm,
  });
  // 胶囊条点击选定/取消（条件不足的灰条不接点击，悬停说明缺什么）
  lifecycle.on(document.getElementById("wxChipsWrap"), "click", (e) => {
    const btn = e.target.closest(".wx-capsule-chip");
    if (!btn || btn.classList.contains("locked")) return;
    const actId = btn.dataset.actionId;
    const actName = btn.dataset.actionName;
    const actArgs = JSON.parse(btn.dataset.actionArgs || "{}");
    const danger = btn.classList.contains("danger");

    const existsIdx = currentCapsuleActions.findIndex(
      (a) =>
        a.id === actId &&
        JSON.stringify(a.args || {}) === JSON.stringify(actArgs),
    );
    if (existsIdx >= 0) {
      currentCapsuleActions.splice(existsIdx, 1);
    } else {
      currentCapsuleActions = [
        { id: actId, name: actName, args: actArgs, danger },
      ];
    }
    renderActionChipsUI();
    updateInputPlaceholder();
  });

  // 二级动作抽屉内点击
  lifecycle.on(document.getElementById("wxActionDrawerBody"), "click", (e) => {
    const btn = e.target.closest(".wx-capsule-chip");
    if (!btn || btn.classList.contains("locked")) return;
    const actId = btn.dataset.actionId;
    const actName = btn.dataset.actionName;
    const actArgs = JSON.parse(btn.dataset.actionArgs || "{}");
    const danger = btn.classList.contains("danger");

    currentCapsuleActions = [
      { id: actId, name: actName, args: actArgs, danger },
    ];
    renderActionChipsUI();
    updateInputPlaceholder();

    const drawerEl = document.getElementById("wxActionDrawer");
    if (drawerEl) drawerEl.style.display = "none";
    document.getElementById("wxMoreActionsBtn")?.classList.remove("active");
    document
      .getElementById("wxMoreActionsBtn")
      ?.setAttribute("aria-expanded", "false");
  });

  // 姿态徽标点击（默认跟缀 ⇄ 纯叙事）
  lifecycle.on(document.getElementById("wxPostureBadge"), "click", () => {
    postureEnabled = !postureEnabled;
    renderActionChipsUI();
    updateInputPlaceholder();
  });

  // 更多按钮开闭抽屉
  const drawerEl = document.getElementById("wxActionDrawer");
  const moreBtn = document.getElementById("wxMoreActionsBtn");
  lifecycle.on(moreBtn, "click", () => {
    if (!drawerEl) return;
    const isHidden = drawerEl.style.display === "none";
    drawerEl.style.display = isHidden ? "flex" : "none";
    moreBtn.classList.toggle("active", isHidden);
    // 标记里声明了 aria-expanded，这里同步（C3 顺手补的可访问性）
    moreBtn.setAttribute("aria-expanded", String(isHidden));
  });
  lifecycle.on(document.getElementById("wxActionDrawerClose"), "click", () => {
    if (drawerEl) drawerEl.style.display = "none";
    moreBtn?.classList.remove("active");
    moreBtn?.setAttribute("aria-expanded", "false");
  });

  // 暴露胶囊动作给胶水与宿主：点选优先；没点选时用默认姿态「跟缀·保持当前距离」
  window.WxStatusbar = Object.assign(window.WxStatusbar || {}, {
    consumeActiveActions: function () {
      if (currentCapsuleActions && currentCapsuleActions.length) {
        const act = currentCapsuleActions.slice();
        currentCapsuleActions = [];
        renderActionChipsUI();
        updateInputPlaceholder();
        return act;
      }
      if (postureEnabled && defaultPosture) return [defaultPosture];
      return [];
    },
    getActiveActions: function () {
      if (currentCapsuleActions.length) return currentCapsuleActions.slice();
      return postureEnabled && defaultPosture ? [defaultPosture] : [];
    },
    setCapsuleAction: function (action) {
      if (!action) currentCapsuleActions = [];
      else currentCapsuleActions = [action];
      renderActionChipsUI();
      updateInputPlaceholder();
    },
  });

  lifecycle.on(document.getElementById("settleAck"), "click", () =>
    document.getElementById("wx-settle-dialog")?.close(),
  );
  lifecycle.on(document.getElementById("settleAuto"), "change", async (e) => {
    SETTLE.auto = e.target.checked;
    const glue = typeof globalThis !== "undefined" && globalThis.WxGlue;
    if (glue && glue.setConf) {
      try {
        await glue.setConf({ autoSettle: SETTLE.auto });
      } catch (err) {
        /* 非真机环境忽略 */
      }
    }
  });
  (async () => {
    const glue = typeof globalThis !== "undefined" && globalThis.WxGlue;
    if (glue && glue.conf) {
      SETTLE.auto = !!glue.conf.autoSettle;
      const cb = document.getElementById("settleAuto");
      if (cb) cb.checked = SETTLE.auto;
    }
  })();

  if (__WX_PREVIEW__) renderSnapshot(MOCKS.sweet);

  /* ---------- 酒馆模式：宿主通过 postMessage 递 wx_snap 快照（主通道）；iframe API 可用时轮询变量（备用通道） ---------- */
  (async function tavernMode() {
    let activated = false;
    const tools = document.querySelector(".preview-tools");
    function isCurrentScope(scope) {
      const ctx = window.SillyTavern?.getContext?.();
      const current = scopeKey(
        ctx?.characterId ?? ctx?.this_chid,
        ctx?.chatId ?? ctx?.chat_id,
      );
      return !scope || !current || scope === current;
    }
    function activate(snap) {
      if (!activated) {
        activated = true;
        if (tools) tools.style.display = "none";
      }
      if (lifecycle.disposed) return;

      ZERO.done = true;
      updateZeroChip();
      zeroFloor.hide();
      renderSnapshot(snap);
    }
    // 暴露全局 API（保留 M4 调试钩子 settle 与胶囊接口，防覆盖）
    window.WxStatusbar = Object.assign(window.WxStatusbar || {}, {
      render: activate,
    });
    // 主通道：壳/引擎 postMessage {wxSnap}
    lifecycle.on(window, "message", (e) => {
      if (!isCurrentScope(e.data?.wxScope)) return;
      if (
        e.data?.wxSyncOk &&
        !(window.WxGlue || globalThis.WxGlue)?.getSyncDiagnostics?.()
          .lastFailure
      )
        syncNotice.clear();
      if (e.data?.wxSyncError) reportSyncError(e.data.wxSyncError);
      if (e.data?.wxReset) resetDisplay();
      else if (e.data?.wxSnap) activate(e.data.wxSnap);
    });
    // 备用通道：本 iframe 若有酒馆助手变量 API（原生渲染场景），轮询 wx_snap
    const holder = window.TavernHelper?.getVariables
      ? window.TavernHelper
      : typeof window.getVariables === "function"
        ? window
        : typeof getVariables === "function"
          ? globalThis
          : globalThis.TavernHelper && globalThis.TavernHelper.getVariables
            ? globalThis.TavernHelper
            : null;
    if (!holder) return; // 本地开发环境：走 mock / 回放
    let lastStr = "",
      polling = false;
    lifecycle.interval(async () => {
      if (polling) return;
      polling = true;
      try {
        const v = await holder.getVariables({ type: "chat" });
        const snap = v && v.wx_snap;
        if (
          !snap ||
          lifecycle.disposed ||
          !isCurrentScope(v.wx_diag?.sync?.scope)
        )
          return;
        const str = JSON.stringify(snap);
        if (str !== lastStr) {
          lastStr = str;
          activate(snap);
        }
      } catch (e) {
        /* 短暂读失败保留当前显示，下一次重试 */
      } finally {
        polling = false;
      }
    }, 1000);
  })();
  /* 高度自适应上报：宿主按内容调高（收起/展开不裁切），被嵌入时启用 */
  if (window.parent !== window) {
    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(() => reportLayout());
      resizeObserver.observe(document.body);
      lifecycle.cleanup(() => resizeObserver.disconnect());
    }
    lifecycle.on(window, "load", reportLayout);
    lifecycle.timeout(reportLayout, 300);
  }

  function reportSyncError(error) {
    if (["STALE_SESSION", "SYNC_DISPOSED"].includes(error?.code)) return;
    syncNotice.report(error);
  }
  function resetDisplay() {
    syncNotice.clear();
    clearLiveData(document);
    details.reset();
    render._hist = [];
    stopAudio();
    ZERO.done = false;
    ZERO.step = 1;
    ZERO.identity = null;
    ZERO.targetId = "college";
    ZERO.targetPersona = null;
    ZERO.personas = {};
    ZERO.points = { str: 4, agi: 4, nrv: 4, int: 4, cha: 4 };
    view.snapshot = null;
    currentCapsuleActions = [];
    currentDynamicCapsules = [];
    document.getElementById("wxChipsWrap")?.replaceChildren();
    document.getElementById("wxActionDrawerBody")?.replaceChildren();
    document
      .querySelectorAll("dialog.wx-dialog[open]")
      .forEach((dialog) => dialog.close());
    updateIdBadge(null);
    updateZeroChip();
    openCreate();
  }
  Object.assign(window.WxStatusbar, {
    dispose,
    reportSyncError,
    reset: resetDisplay,
    zeroFloor: {
      registerExtension: zeroFloor.registerExtension,
      registerStep: stages.register,
      go: stages.go,
    },
  });
  const initialFailure = (
    window.WxGlue || globalThis.WxGlue
  )?.getSyncDiagnostics?.().lastFailure;
  if (initialFailure) reportSyncError(initialFailure);
  return { dispose };
}

module.exports = { mountStatusbar };
