"use strict";

/**
 * 《仙姝堕 2.0》幽寂谷地图插件入口模块 (CommonJS)
 * ─────────────────────────────────────────────────────────────────────────────
 * 严格遵循 2.0 框架与 GPT 统一调度契约：
 * 1. 导出标准插件规范：id, version, select, settle, getPrompt, mount；
 * 2. 挂载于 HUD 预留插槽 `data-xsd-slot="map"`；
 * 3. 视觉：南疆大地图底图 + 绝对定位呼吸圆点 (Pin Marker) + 短地点名；
 * 4. 交互：点击圆点派发 SELECT_NODE 意图，由统一调度器执行原生强制发送与 pending 托管；
 * 5. 移动/查看以玩家点选为准；固定奖励及互斥在点击时由后台一起提交。
 */

const {
  EVENT_DEFS,
  PINS,
  OPEN_DATE,
  CLOSE_DATE,
  createInitialState,
  checkActionBlock,
  getAvailableOptions,
  applyAction,
  stampToDate,
} = require("./event_tree");


const { MAP_IMAGE_DATA } = require("./map_asset");
const { buildNarrativeScope } = require("../../runtime/narrative_scope");

const PLUGIN_ID = "youjigu_map";
const PLUGIN_VERSION = "2.0.0";

/**
 * 获取当前插件状态（从快照中读取或初始化）
 */
function getPluginState(snapshot) {
  const date = snapshot?.calendarDate || { year: 1578, month: 3, day: 1 };
  const stamp = date.year * 360 + (date.month - 1) * 30 + date.day - 1;
  const state = snapshot?.pluginState?.[PLUGIN_ID]
    ? structuredClone(snapshot.pluginState[PLUGIN_ID])
    : createInitialState(snapshot?.identity || "自设", stamp);
  // Date and known are projections of the kernel, never an independent ledger.
  state.currentStamp = stamp;
  state.identity = snapshot?.identity || state.identity;
  state.known = {
    ...state.known,
    ...(snapshot?.known || snapshot?.stat_data?.known || {}),
  };
  return state;
}

function getDisplayText(nodeId) {
  const def = EVENT_DEFS[nodeId];
  return ({k4m8:"进入洞府", s9a3:"进入山涧"})[nodeId] || def?.label;
}
function scenePlace(step) {
  return {
    first: "幽寂谷·谷口岔路", cave: "幽寂谷·洞府", stream: "幽寂谷·山涧",
    second: "幽寂谷·谷中岔路", valley: "幽寂谷·山谷", secret: "幽寂谷·密室",
    done: "幽寂谷外",
  }[step] || "幽寂谷";
}

function narrativeScope(snapshot, state, storyCount) {
  const options = getAvailableOptions(state, storyCount).filter(x => !x.blocked);
  const descriptions = {
    k4m8:"一条小径通往洞府，尚未选择进入", s9a3:"另一条沿溪深入山涧，尚未选择进入",
    h5w9:"离开洞府，继续深入谷中", j8e1:"离开山涧，继续深入谷中",
  };
  const cast = (snapshot.stat_data?.在场角色 || []).map(x => x.名).filter(Boolean);
  const facts = (state.log || []).slice(-4);
  return buildNarrativeScope({place:scenePlace(state.step), cast, facts,
    options:options.map(x => ({label:getDisplayText(x.id), description:descriptions[x.id]}))});
}

/**
 * 校验并返回受信任节点配置（同步执行）
 */
function select(snapshot, nodeId) {
  if (!nodeId) return { id: "", allowed: false, reason: "未指定节点代码" };
  const def = EVENT_DEFS[nodeId];
  if (!def) return { id: nodeId, allowed: false, reason: "未知事件代码" };

  const state = getPluginState(snapshot);
  const storyCount = snapshot?.storyCount || 0;
  const blockReason = checkActionBlock(state, nodeId, storyCount);

  if (blockReason) {
    return {
      id: nodeId,
      allowed: false,
      reason: blockReason,
    };
  }

  const settlementMode = def.reward ? "fixed" : "choice";
  const destination = settlementMode === "choice"
    ? scenePlace(def.finish || def.early ? "done" : def.to || state.step) : undefined;
  const confirmed = configuredResult(snapshot, nodeId);
  const scope = narrativeScope(snapshot, confirmed.pluginState || state, storyCount + 1);
  const prompt = settlementMode === "choice"
    ? "【玩家点选已确认】玩家已经完成「" + def.label + "」，当前位置已确定为「" + destination +
      "」。直接从此处继续写故事，不再写成准备进入、尚未到达或移动失败；不要重复询问是否前往。" +
      (def.prompt || "")
    : "【固定节点结果已入账】玩家已经完成「" + def.label + "」，已经取得「" + def.reward +
      "」，已加入背包，同组机关已关闭。直接演绎此结果，不再判断是否取得，不重复发奖。" + (def.prompt || "");
  // Rewards, mutex and confirmed exit costs commit on selection.
  // Pending prevents further clicks; cancellation restores the prior snapshot.
  return {
    id: def.id,
    allowed: true,
    actionText: def.actionText,
    displayText:getDisplayText(nodeId),
    rewardAliases:def.reward === "幽寂谷地图"
      ? {幽寂谷地图:["地图", "残图", "舆图", "残卷"]} : {},
    immediateResult:def.reward || def.exitDays ? confirmed : undefined,
    prompt:prompt + "\n" + scope,
    settlementMode,
    destination,
    open: def.open || undefined,
    close: def.close || undefined,
    requires: def.requires || undefined,
    ttl: def.ttl || undefined,
    openedAt:
      state.createdStoryCount !== undefined
        ? state.createdStoryCount
        : storyCount,
    rewards: def.rewards ? [...def.rewards] : undefined,
    grantsKnown: def.grantsKnown ? [...def.grantsKnown] : undefined,
    exitDays: def.exitDays || undefined,
    confirmText: def.confirmText || undefined,
  };
}

/**
 * 新助手故事楼生成完毕后的统一结果结算
 */
async function settle(snapshot, pending, body) {
  if (!pending || pending.pluginId !== PLUGIN_ID) {
    return { outcome: "failure", reason: "非本插件 pending 行动" };
  }

  const state = getPluginState(snapshot);
  const nodeId = pending.nodeId;
  const selection = EVENT_DEFS[nodeId];
  if (!selection) {
    return { outcome: "failure", reason: "缺少节点配置" };
  }

  if (pending.fixedApplied) return {
    outcome:"success", pluginState:state, activeEvent:snapshot.activeEvent,
    rewards:[], known:[], body, reason:"固定节点结果在点选时已经入账",
    evidenceMode:"FIXED_NODE_CONFIRMED",
  };
  return configuredResult(snapshot, nodeId, body);
}
function configuredResult(snapshot, nodeId, body) {
  const state = getPluginState(snapshot), selection = EVENT_DEFS[nodeId];
  // 达成目标，推进状态机
  const storyCount = snapshot.storyCount || 0;
  const advance = applyAction(state, nodeId, storyCount);
  if (!advance.ok) {
    return {
      outcome: "failure",
      pluginState: state,
      activeEvent: snapshot.activeEvent || null,
      reason: advance.error,
    };
  }

  const nextState = advance.state;
  // Validate against the authorized pre-reply turn, then anchor entry after completion.
  if (selection.from === "map") nextState.createdStoryCount = storyCount + 1;
  const rewards = [];
  if (selection.rewards && selection.rewards.length) {
    selection.rewards.forEach((name) => {
      rewards.push({ name, count: 1 });
    });
  }

  const known = selection.grantsKnown ? [...selection.grantsKnown] : [];
  const elapsedDays = selection.exitDays || undefined;

  let activeEvent = null;
  if (nextState.step !== "done") {

    activeEvent = {
      id: "youjigu",
      pluginId: PLUGIN_ID,
      step: nextState.step,
      place: scenePlace(nextState.step),
    };
  }

  return {
    outcome: "success",
    reason: selection.reward ? "固定节点配置确认" : "玩家点选确认",
    evidenceMode: selection.reward ? "FIXED_NODE_CONFIRMED" : "PLAYER_CHOICE_CONFIRMED",
    pluginState: nextState,
    activeEvent,
    rewards,
    known,
    elapsedDays,
    body,
  };
}

/**
 * 自由行动期间的当前场景约束 Prompt
 */
function getPrompt(snapshot) {
  const state = getPluginState(snapshot);
  if (!state || ["map", "done"].includes(state.step)) return "";
  return narrativeScope(snapshot, state, snapshot.storyCount || 0);
}

/**
 * HUD 插槽挂载接口
 */
function mount(slotElement, runtimeApi) {
  if (!slotElement) return () => {};

  const doc = slotElement.ownerDocument || document;
  const win = doc.defaultView || window;

  // 1. 入口按钮
  const triggerBtn = doc.createElement("button");
  triggerBtn.type = "button";
  triggerBtn.className = "xsd2-map-trigger-btn";
  triggerBtn.textContent = "🗺️ 南疆地图";
  triggerBtn.style.cssText = [
    "padding:2px 8px",
    "background:linear-gradient(180deg, #2a2219 0%, #15100b 100%)",
    "color:#dfcba5",
    "border:1px solid #785e3b",
    "border-radius:3px",
    "cursor:pointer",
    "font-size:11px",
    "letter-spacing:1px",
    "margin-left:6px",
    "transition:all 0.2s ease",
    "vertical-align:middle",
  ].join(";");

  slotElement.appendChild(triggerBtn);

  // 2. 地图模态浮层
  let modalOverlay = null;

  function closeMap() {
    if (modalOverlay) {
      modalOverlay.remove();
      modalOverlay = null;
    }
  }

  function renderMapModal() {
    closeMap();

    const snapshot = runtimeApi.getSnapshot ? runtimeApi.getSnapshot() : null;
    if (!snapshot) return;

    const state = getPluginState(snapshot);
    const storyCount = snapshot.storyCount || 0;
    const availableNodes = getAvailableOptions(state, storyCount);

    modalOverlay = doc.createElement("div");
    modalOverlay.className = "xsd2-map-modal-overlay";
    modalOverlay.style.cssText = [
      "position:fixed",
      "top:0",
      "left:0",
      "width:100vw",
      "height:100vh",
      "background:rgba(0,0,0,0.75)",
      "z-index:99999",
      "display:flex",
      "justify-content:center",
      "align-items:center",
      "padding:16px",
      "box-sizing:border-box",
    ].join(";");

    const modalBox = doc.createElement("div");
    modalBox.className = "xsd2-map-modal-box";
    modalBox.style.cssText = [
      "position:relative",
      "max-width:880px",
      "width:100%",
      "background:#120e0a",
      "border:1px solid #856a43",
      "box-shadow:0 12px 36px rgba(0,0,0,0.9)",
      "border-radius:6px",
      "padding:14px",
      "color:#d4c4a8",
      "display:flex",
      "flex-direction:column",
      "gap:10px",
    ].join(";");

    // 头部栏
    const header = doc.createElement("div");
    header.style.cssText =
      "display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #3d2f1d;padding-bottom:8px;";

    const title = doc.createElement("div");
    const dateText = snapshot.calendarDate
      ? `仙盟历 ${snapshot.calendarDate.year}年 ${snapshot.calendarDate.month}月 ${snapshot.calendarDate.day}日`
      : "";
    title.innerHTML = `<span style="font-weight:bold;color:#f3e6cf;font-size:14px;">📍 南疆全域 · 地图</span> <span style="font-size:11px;color:#9b8769;margin-left:8px;">${dateText}</span>`;

    const closeBtn = doc.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "✕";
    closeBtn.style.cssText =
      "background:none;border:none;color:#a8957b;font-size:16px;cursor:pointer;padding:0 4px;";
    closeBtn.onclick = closeMap;

    header.appendChild(title);
    header.appendChild(closeBtn);
    modalBox.appendChild(header);

    // 提示条
    if (snapshot.pending) {
      const tip = doc.createElement("div");
      tip.style.cssText =
        "background:#241d14;border:1px dashed #997843;color:#e8cf9c;padding:6px 10px;font-size:11px;border-radius:3px;";
      tip.textContent = `⏳ 当前行动「${snapshot.pending.actionText}」进行中，等待助手回复推进故事...`;
      modalBox.appendChild(tip);
    }

    // 地图与圆点容器
    const atlas = doc.createElement("div");
    atlas.className = "yj-atlas";
    atlas.style.cssText = [
      "position:relative",
      "width:100%",
      "border:1px solid #574127",
      "border-radius:4px",
      "overflow:hidden",
      "background:#0c0a07",
      "line-height:0",
    ].join(";");

    const img = doc.createElement("img");
    img.src = MAP_IMAGE_DATA;
    img.alt = "南疆全域地图";
    img.style.cssText = "width:100%;height:auto;display:block;opacity:0.92;";
    atlas.appendChild(img);

    // 渲染发光圆点 Pins
    availableNodes.forEach((node) => {
      const pinCoords = PINS[node.id];
      if (!pinCoords) return;

      const [shortLabel, leftPct, topPct] = pinCoords;
      const isBlocked = !!node.blocked;
      const isPending = !!snapshot.pending;

      const pinBtn = doc.createElement("button");
      pinBtn.type = "button";
      pinBtn.className = "yj-pin";
      pinBtn.setAttribute("data-node-id", node.id);
      pinBtn.setAttribute(
        "title",
        isBlocked ? `${node.label} (${node.blocked})` : node.label,
      );

      pinBtn.style.cssText = [
        "position:absolute",
        `left:${leftPct}%`,
        `top:${topPct}%`,
        "transform:translate(-50%, -50%)",
        "background:" +
          (isPending ? "#e6a832" : isBlocked ? "#473d31" : "#2bd980"),
        "color:#ffffff",
        "border:" + (isBlocked ? "1px solid #665645" : "2px solid #ffffff"),
        "border-radius:50%",
        "width:15px",
        "height:15px",
        "padding:0",
        "font-size:10px",
        "font-weight:bold",
        "cursor:" + (isBlocked || isPending ? "not-allowed" : "pointer"),
        "box-shadow:0 0 8px " +
          (isBlocked ? "rgba(0,0,0,0.5)" : "rgba(43,217,128,0.7)"),
        "white-space:nowrap",
        "z-index:10",
        "line-height:1.4",
        "transition:all 0.2s ease",
        "user-select:none",
      ].join(";");

      const label = doc.createElement("span");
      label.textContent = shortLabel;
      label.style.cssText =
        "position:absolute;top:19px;left:50%;transform:translateX(-50%);color:#302a1f;background:#f2e9cbdd;padding:1px 4px;border-radius:2px;font-size:11px;line-height:1.4;";
      pinBtn.appendChild(label);
      pinBtn.setAttribute("aria-label", node.label);
      pinBtn.disabled = isBlocked || isPending;

      if (!isBlocked && !isPending) {
        pinBtn.onmouseenter = () => {
          pinBtn.style.transform = "translate(-50%, -50%) scale(1.15)";
          pinBtn.style.boxShadow = "0 0 14px rgba(43,217,128,1)";
        };
        pinBtn.onmouseleave = () => {
          pinBtn.style.transform = "translate(-50%, -50%) scale(1)";
          pinBtn.style.boxShadow = "0 0 8px rgba(43,217,128,0.7)";
        };

        // 点击圆点：触发 SELECT_NODE 派发意图！
        pinBtn.onclick = async () => {
          try {
            const currentSnap = runtimeApi.getSnapshot
              ? runtimeApi.getSnapshot()
              : null;
            if (!currentSnap) return;

            // 调用统一调度器派发意图
            await runtimeApi.dispatchIntent({
              type: "SELECT_NODE",
              pluginId: PLUGIN_ID,
              expected: {
                chatId: currentSnap.chatId,
                branchId: currentSnap.branchId,
                floor: currentSnap.floor,
                revision: currentSnap.revision,
              },
              payload: {
                nodeId: node.id,
              },
            });

            // 成功出动后自动关闭地图
            closeMap();
          } catch (err) {
            console.error("[YoujiguMap] 派发失败:", err);
            win.parent?.toastr?.error?.(err.message || String(err));
          }
        };
      }

      atlas.appendChild(pinBtn);
    });

    modalBox.appendChild(atlas);
    modalOverlay.appendChild(modalBox);

    // 点击遮罩关闭
    modalOverlay.onclick = (e) => {
      if (e.target === modalOverlay) closeMap();
    };

    doc.body.appendChild(modalOverlay);
  }

  triggerBtn.onclick = renderMapModal;

  // ESC 键关闭
  const onKeydown = (e) => {
    if (e.key === "Escape") closeMap();
  };
  doc.addEventListener("keydown", onKeydown);

  // 订阅统一运行时生命周期变动
  const unsubscribe = runtimeApi.subscribe?.(() => {
    if (modalOverlay) {
      renderMapModal();
    }
  });

  // 卸载清理函数
  return function unmount() {
    closeMap();
    triggerBtn.remove();
    doc.removeEventListener("keydown", onKeydown);
    if (typeof unsubscribe === "function") unsubscribe();
  };
}

const pluginInstance = {
  id: PLUGIN_ID,
  version: PLUGIN_VERSION,
  select,
  settle,
  getPrompt,
  getDisplayText,
  mount,
};

module.exports = pluginInstance;
