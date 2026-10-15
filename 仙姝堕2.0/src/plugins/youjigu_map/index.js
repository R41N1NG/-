"use strict";
const {assertPanelSnapshot}=require("../../ui/panel_action");
const {meets} = require("../../runtime/conditions");

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
  isXuanjiDead,
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
  const date = snapshot?.calendarDate || { year: 1578, month: 4, day: 1 };
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
  return ({ k4m8: "进入洞府", s9a3: "进入山涧", c9k2: "合力同行" })[nodeId] || def?.label || nodeId;
}
function scenePlace(step) {
  return {
    first: "幽寂谷·谷口岔路",
    camp: "幽寂谷·驻守营地",
    camp_wait: "幽寂谷·夕照营地",
    camp_return: "幽寂谷·营地相迎",
    valley_deep: "幽寂谷·乱石深涧",
    chamber_gate: "幽寂谷·石室门前",
    chamber_inside: "幽寂谷·粉雾石室",
    chamber_rescue: "幽寂谷·辟幻石室",
    valley_trio: "幽寂谷·合力深谷",
    chamber_trio_gate: "幽寂谷·粉障洞口",
    chamber_trio_cleared: "幽寂谷·勘定石室",
    cave: "幽寂谷·洞府",
    stream: "幽寂谷·山涧",
    second: "幽寂谷·谷中岔路",
    valley: "幽寂谷·山谷",
    secret: "幽寂谷·密室",
    done: "幽寂谷外",
  }[step] || "幽寂谷";
}

function nodeAllowed(snapshot, def) {
  return (!def.identities || def.identities.includes(snapshot.identity)) && meets(snapshot,def.conditions || []);
}
function narrativeScope(snapshot, state, storyCount) {
  const options = getAvailableOptions(state, storyCount).filter(x => !x.blocked && nodeAllowed(snapshot,EVENT_DEFS[x.id]));
  const descriptions = {
    a7x1: "以大局为重引队回营休整，让玄机子与叶红缨独探深谷（需玄机子存活）",
    b3m8: "察觉二师兄神色有异，假意应允而暗中潜行尾随（需玄机子存活）",
    c9k2: "当面拒绝分兵提议，坚持同门同行深入探查（若玄机子已死则与师姐二人合力探索）",
    z8u5: "不再深入探寻，及早收步折返离谷",
    k8d3: "在营地组织筑基弟子调息驻守，戒备深谷异动",
    r6t2: "入夜后迎候二人归营，察看叶红缨神色境况",
    w2j5: "历练事毕，整饬飞舟队伍启程返回宗门复命",
    q5w4: "循迹摸至深涧石室外，察觉门内粉雾弥漫与异动",
    t7r1: "果断祭起灵力轰开石门，强行杀入撞破暗局",
    x8f2: "面对石榻上受幻力侵扰的师姐，直面当下局势自主应对",
    v4k6: "护持师姐离开深谷，汇合弟子乘飞舟凯旋归宗",
    m7h4: "深入抵临粉雾洞口，察觉异香与禁制暗自提防",
    x3v8: "直面粉雾石室机关，自主决定如何破阵取宝探查",
    p6w1: "平稳收束幽寂谷历练，汇合筑基弟子整队归宗",
    k4m8: "一条小径通往洞府，尚未选择进入",
    s9a3: "另一条沿溪深入山涧，尚未选择进入",
    h5w9: "离开洞府，继续深入谷中",
    j8e1: "离开山涧，继续深入谷中",
  };
  const xuanjiDead = isXuanjiDead(state) || isXuanjiDead(snapshot);
  const inValley = state && !["map", "done"].includes(state.step);
  let cast;
  if (inValley) {
    cast = [
      snapshot?.identity || "赵无忧",
      "叶红缨",
      ...(xuanjiDead ? [] : ["玄机子"]),
      "墨山道众弟子",
    ];
  } else {
    cast = (snapshot.stat_data?.在场角色 || []).map(x => x.名).filter(Boolean);
  }
  const facts = [...(state.log || []).slice(-3)];
  if (inValley) {
    facts.unshift(`【人员隔离铁律】幽寂谷现场人员严格限定为：${cast.join("、")}。此前在场人物（如孤月等）留守宗门据点，绝不随行入谷！`);
    if (xuanjiDead) {
      facts.push("【兼容性铁律】玄机子已身陨不登场，剧情由赵无忧与叶红缨二人携众弟子探索（仅走分支C同行探查）。");
    }
  }
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

  if (blockReason || !nodeAllowed(snapshot,def)) {
    return {
      id: nodeId,
      allowed: false,
      reason: blockReason || "人物数值或阶段条件未满足",
    };
  }

  const settlementMode = def.reward ? "fixed" : "choice";
  const destination = settlementMode === "choice"
    ? scenePlace(def.finish || def.early ? "done" : def.to || state.step) : undefined;
  const confirmed = configuredResult(snapshot, nodeId);
  const scope = narrativeScope(snapshot, confirmed.pluginState || state, storyCount + 1);
  const xuanjiDead = isXuanjiDead(state) || isXuanjiDead(snapshot);
  let extraPrompt = "";
  if (nodeId === "g7p2") {
    extraPrompt = "\n【承接剧情与人员隔离铁律】必须自然承接上文对话交互（交代与侍女孤月等交谈告一段落并嘱其留守宗门据点，绝不入谷）。奉师尊炎雷子法旨严令，由赵无忧、叶红缨、" + (xuanjiDead ? "" : "玄机子（若存活）、") + "众弟子前往幽寂谷历练。" +
      (xuanjiDead ? "特别注意：玄机子已死，玄机子不出现，仅赵无忧与叶红缨率队前往，后续仅走分支C。" : "【兼容性提示词】若玄机子在先前剧情中已死亡，则合理改变后续剧情：玄机子绝不出现，仅由赵无忧与叶红缨率队探索，且仅走分支C。");
  }
  const prompt = (settlementMode === "choice"
    ? "【玩家点选已确认】玩家已经完成「" + def.label + "」，当前位置已确定为「" + destination +
      "」。直接从此处继续写故事，不再写成准备进入、尚未到达或移动失败；不要重复询问是否前往。" +
      (def.prompt || "")
    : "【固定节点结果已入账】玩家已经完成「" + def.label + "」，已经取得「" + def.reward +
      "」，已加入背包，同组机关已关闭。直接演绎此结果，不再判断是否取得，不重复发奖。" + (def.prompt || "")) + extraPrompt;
  // Rewards, mutex and confirmed exit costs commit on selection.
  // Pending prevents further clicks; cancellation restores the prior snapshot.
  return {
    id: def.id,
    allowed: true,
    actionText: def.actionText,
    displayText: getDisplayText(nodeId),
    rewardAliases: def.reward === "幽寂谷地图"
      ? { 幽寂谷地图: ["地图", "残图", "舆图", "残卷"] }
      : def.reward === "清凉玉佩"
        ? { 清凉玉佩: ["玉佩", "清凉佩", "辟幻佩"] }
        : {},
    immediateResult:def.reward || def.exitDays ? confirmed : undefined,
    identities:def.identities || undefined,
    conditions:def.conditions || [],
    metricChanges:def.metricChanges || [],
    settlement:def.settlement || {mode:"none"},
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

  // 1.1 HUD 快捷行动栏（无需打开地图即可直接点选）
  const hudBar = doc.createElement("div");
  hudBar.className = "xsd2-youjigu-hud-bar";
  hudBar.style.cssText =
    "display:none;align-items:center;flex-wrap:wrap;gap:4px;margin-left:6px;vertical-align:middle;";
  slotElement.appendChild(hudBar);

  // A full-width notice remains visible beside the document, rather than a tiny map badge.
  const notice=doc.createElement("div");
  notice.className="xsd2-map-node-notice";
  notice.setAttribute("role","status");notice.setAttribute("aria-live","polite");
  notice.style.cssText="display:none;box-sizing:border-box;width:100%;margin:14px 0;padding:12px 16px;border:2px solid #e6b75b;border-radius:9px;background:linear-gradient(100deg,#493819,#282b20);color:#ffe5a6;font-size:16px;line-height:1.7;box-shadow:0 0 16px #e6b75b33;";
  const hud=slotElement.closest(".xsd2-hud"),who=hud?.querySelector(".xsd2-who");
  if(who)who.after(notice);else slotElement.appendChild(notice);

  // 2. 地图模态浮层
  let modalOverlay = null,modalSnapshot=null,hudSnapshot=runtimeApi.getSnapshot?.(),dispatching=false;
  const feedback=doc.createElement('p');feedback.dataset.mapFeedback='';feedback.setAttribute('role','status');feedback.hidden=true;slotElement.append(feedback);
  function showFeedback(message){
    feedback.textContent=message;feedback.hidden=false;
    const box=modalOverlay?.querySelector('.xsd2-map-modal-box');
    if(box){let note=box.querySelector('[data-map-result]');if(!note){note=doc.createElement('p');note.dataset.mapResult='';note.setAttribute('role','status');box.append(note);}note.textContent=message;}
  }

  function closeMap() {
    if (modalOverlay) {
      modalOverlay.remove();
      modalOverlay = null;
    }
  }

  async function dispatchNode(nodeId) {
    if(dispatching)return;
    dispatching=true;
    const origin=modalOverlay?.isConnected?modalSnapshot:hudSnapshot;
    const buttons=[...hudBar.querySelectorAll('button'),...(modalOverlay?.querySelectorAll('button')||[]),triggerBtn].map(b=>[b,b.disabled]);
    buttons.forEach(([b])=>{b.disabled=true;});
    try {
      const currentSnap = runtimeApi.getSnapshot
        ? runtimeApi.getSnapshot()
        : null;
      assertPanelSnapshot(origin,currentSnap);

      const result=await runtimeApi.dispatchIntent({
        type: "SELECT_NODE",
        pluginId: PLUGIN_ID,
        expected: {
          chatId: currentSnap.chatId,
          branchId: currentSnap.branchId,
          floor: currentSnap.floor,
          revision: currentSnap.revision,
        },
        payload: {
          nodeId,
        },
      });

      if(result?.cancelled){showFeedback('已取消结算，可以继续探索。');return;}
      closeMap();
      feedback.textContent='';feedback.hidden=true;
      updateHUD();
    } catch (err) {
      showFeedback(err.message || String(err));
      console.error("[YoujiguMap] 派发失败:", err);
      win.parent?.toastr?.error?.(err.message || String(err));
    } finally {dispatching=false;buttons.forEach(([b,disabled])=>{if(b.isConnected)b.disabled=disabled;});}
  }

  function updateHUD() {
    const snapshot = runtimeApi.getSnapshot ? runtimeApi.getSnapshot() : null;
    if (!snapshot) return;

    hudSnapshot=snapshot;
    const state = getPluginState(snapshot);
    const storyCount = snapshot.storyCount || 0;
    const availableNodes = getAvailableOptions(state, storyCount).filter((x) =>
      nodeAllowed(snapshot, EVENT_DEFS[x.id]),
    );
    const inValley = state && !["map", "done"].includes(state.step);
    const isPending = Boolean(snapshot.pending);
    const occupied=snapshot.activeEvent && snapshot.activeEvent.pluginId!==PLUGIN_ID;
    const selectable=availableNodes.filter(x=>!x.blocked);
    notice.replaceChildren();
    notice.style.display=!isPending && !occupied && selectable.length ? "block" : "none";
    if(notice.style.display!=="none"){
      const title=doc.createElement("strong");title.textContent="✦ 地图有 "+selectable.length+" 个可进行节点";
      const hint=doc.createElement("div");hint.textContent=inValley?"当前探索有待选行动，可点击下方选项或打开地图继续。":"幽寂谷历练已开放，可直接点击主卷选项开始。";
      const open=doc.createElement("button");open.type="button";open.textContent="打开地图查看";open.dataset.mapNoticeOpen="";open.onclick=renderMapModal;
      notice.append(title,hint,open);
    }

    // 1. 刷新入口按钮文案与视觉状态
    if (isPending) {
      triggerBtn.textContent = "⏳ 行动推进中...";
      triggerBtn.style.border = "1px solid #997843";
      triggerBtn.style.color = "#e8cf9c";
      triggerBtn.style.boxShadow = "none";
    } else if (inValley) {
      const selectableCount = availableNodes.filter((x) => !x.blocked).length;
      triggerBtn.textContent =
        selectableCount > 0
          ? `🗺️ 幽寂谷探索 · 待选 (${selectableCount})`
          : "🗺️ 幽寂谷探索";
      triggerBtn.style.border = "1px solid #2bd980";
      triggerBtn.style.color = "#a5f3cb";
      triggerBtn.style.boxShadow = "0 0 8px rgba(43,217,128,0.4)";
    } else {
      const openInMap = availableNodes.some(
        (x) => x.id === "g7p2" && !x.blocked,
      );
      if (openInMap) {
        triggerBtn.textContent = "🗺️ 南疆地图 · 幽寂谷开放";
        triggerBtn.style.border = "1px solid #e6a832";
        triggerBtn.style.color = "#ffd580";
        triggerBtn.style.boxShadow = "0 0 6px rgba(230,168,50,0.4)";
      } else {
        triggerBtn.textContent = "🗺️ 南疆地图";
        triggerBtn.style.border = "1px solid #785e3b";
        triggerBtn.style.color = "#dfcba5";
        triggerBtn.style.boxShadow = "none";
      }
    }

    // 2. 刷新 HUD 内嵌行动抉择胶囊栏
    hudBar.innerHTML = "";
    if (inValley || availableNodes.some((x) => x.id === "g7p2" && !x.blocked)) {
      hudBar.style.display = "inline-flex";
      if (isPending) {
        const pTag = doc.createElement("span");
        pTag.style.cssText =
          "font-size:11px;color:#d8be91;margin-left:4px;opacity:0.85;";
        pTag.textContent = `⏳「${snapshot.pending.actionText}」进行中`;
        hudBar.appendChild(pTag);
      } else {
        const freeTip=doc.createElement("small");freeTip.className="xsd2-free-action-tip";
        freeTip.textContent="可先自由行动，准备好后再推进节点。";
        freeTip.style.cssText="flex-basis:100%;display:block;margin:0 0 3px;color:#c5c9bd;font-size:12px;line-height:1.6;";
        hudBar.appendChild(freeTip);
        const tipLabel = doc.createElement("span");
        tipLabel.style.cssText =
          "font-size:11px;color:#eedbb5;font-weight:bold;margin-left:6px;margin-right:2px;display:inline-flex;align-items:center;";
        tipLabel.textContent = inValley ? "⚡抉择:" : "✨机缘:";
        hudBar.appendChild(tipLabel);

        availableNodes.forEach((node) => {
          const def = EVENT_DEFS[node.id];
          const isBlocked = !!node.blocked;
          const pill = doc.createElement("button");
          pill.type = "button";
          pill.className = "xsd2-hud-action-pill";
          pill.setAttribute("data-hud-node-id", node.id);
          pill.textContent = node.label;
          pill.title = isBlocked
            ? `${node.label}（${node.blocked}）`
            : def?.actionText || node.label;
          pill.disabled = isBlocked;
          pill.style.cssText = [
            "padding:2px 7px",
            "font-size:11px",
            "border-radius:3px",
            "margin-left:4px",
            "cursor:" + (isBlocked ? "not-allowed" : "pointer"),
            "background:" +
              (isBlocked
                ? "#221c15"
                : "linear-gradient(180deg, #3a2c1a 0%, #20170d 100%)"),
            "color:" + (isBlocked ? "#6f614f" : "#ffe0a0"),
            "border:" +
              (isBlocked ? "1px solid #4a3e30" : "1px solid #a87e47"),
            "box-shadow:" + (isBlocked ? "none" : "0 1px 4px rgba(0,0,0,0.5)"),
            "transition:all 0.15s ease",
            "white-space:nowrap",
          ].join(";");

          if (!isBlocked) {
            pill.onmouseenter = () => {
              pill.style.borderColor = "#ffd074";
              pill.style.background = "#4a3922";
            };
            pill.onmouseleave = () => {
              pill.style.borderColor = "#a87e47";
              pill.style.background =
                "linear-gradient(180deg, #3a2c1a 0%, #20170d 100%)";
            };
            pill.onclick = async () => {
              await dispatchNode(node.id);
            };
          }
          hudBar.appendChild(pill);
        });
      }
    } else {
      hudBar.style.display = "none";
    }
  }

  function renderMapModal() {
    if(dispatching)return;
    closeMap();
    doc.querySelectorAll(".xsd2-map-modal-overlay").forEach(el=>el.remove());

    const snapshot = runtimeApi.getSnapshot ? runtimeApi.getSnapshot() : null;
    if (!snapshot) return;
    modalSnapshot=snapshot;

    const state = getPluginState(snapshot);
    const storyCount = snapshot.storyCount || 0;
    const availableNodes = getAvailableOptions(state, storyCount).filter((x) =>
      nodeAllowed(snapshot, EVENT_DEFS[x.id]),
    );

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
          await dispatchNode(node.id);
        };
      }

      atlas.appendChild(pinBtn);
    });

    modalBox.appendChild(atlas);

    // 路线与行动卡片面板（高显著度选择指引）
    const actionsPanel = doc.createElement("div");
    actionsPanel.className = "yj-actions-panel";
    actionsPanel.style.cssText = [
      "display:flex",
      "flex-direction:column",
      "gap:8px",
      "background:#17130e",
      "border:1px solid #423524",
      "border-radius:4px",
      "padding:10px",
      "max-height:220px",
      "overflow-y:auto",
    ].join(";");

    const panelHeader = doc.createElement("div");
    panelHeader.style.cssText =
      "display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;";
    panelHeader.innerHTML =
      '<span style="font-size:12px;font-weight:bold;color:#f3e6cf;">📜 待选行动与路线指引</span>' +
      '<span style="font-size:11px;color:#9b8769;">（点击下方卡片或上方地图圆点均可派发）</span>';
    actionsPanel.appendChild(panelHeader);

    if (availableNodes.length === 0) {
      const emptyTip = doc.createElement("div");
      emptyTip.style.cssText = "font-size:11px;color:#887766;padding:6px;";
      emptyTip.textContent = "当前场景暂无可推进的探索路线。";
      actionsPanel.appendChild(emptyTip);
    } else {
      availableNodes.forEach((node) => {
        const def = EVENT_DEFS[node.id];
        const isBlocked = !!node.blocked;
        const isPending = !!snapshot.pending;

        const card = doc.createElement("div");
        card.className = "yj-action-card";
        card.style.cssText = [
          "background:" + (isBlocked ? "#1d1711" : "#261d13"),
          "border:" + (isBlocked ? "1px solid #382c1e" : "1px solid #735732"),
          "border-radius:4px",
          "padding:8px 10px",
          "display:flex",
          "justify-content:space-between",
          "align-items:center",
          "gap:10px",
          "transition:all 0.15s ease",
        ].join(";");

        const leftBox = doc.createElement("div");
        leftBox.style.cssText =
          "display:flex;flex-direction:column;gap:3px;flex:1;";

        const titleRow = doc.createElement("div");
        titleRow.style.cssText = "display:flex;align-items:center;gap:6px;";
        const nameSpan = doc.createElement("span");
        nameSpan.style.cssText =
          "font-size:12px;font-weight:bold;color:" +
          (isBlocked ? "#7d6f5c" : "#ffdf96") +
          ";";
        nameSpan.textContent = node.label;
        titleRow.appendChild(nameSpan);

        if (node.remainingTtl !== undefined) {
          const ttlBadge = doc.createElement("span");
          ttlBadge.style.cssText =
            "font-size:10px;color:#e88a5d;background:#381c10;padding:1px 4px;border-radius:2px;";
          ttlBadge.textContent = `⏳ 剩余 ${node.remainingTtl} 轮`;
          titleRow.appendChild(ttlBadge);
        }
        if (def?.exitDays) {
          const dayBadge = doc.createElement("span");
          dayBadge.style.cssText =
            "font-size:10px;color:#85c2ff;background:#102238;padding:1px 4px;border-radius:2px;";
          dayBadge.textContent = `耗时 ${def.exitDays} 日`;
          titleRow.appendChild(dayBadge);
        }
        leftBox.appendChild(titleRow);

        const desc = doc.createElement("div");
        desc.style.cssText =
          "font-size:11px;color:" +
          (isBlocked ? "#665846" : "#b8a68b") +
          ";line-height:1.4;";
        desc.textContent = isBlocked
          ? `[不可选: ${node.blocked}]`
          : def?.summaryNote || def?.actionText || "";
        leftBox.appendChild(desc);

        const actBtn = doc.createElement("button");
        actBtn.type = "button";
        actBtn.className = "yj-card-btn";
        actBtn.textContent = isBlocked
          ? "无法执行"
          : isPending
            ? "进行中"
            : "立即执行 ➔";
        actBtn.disabled = isBlocked || isPending;
        actBtn.style.cssText = [
          "padding:4px 10px",
          "font-size:11px",
          "border-radius:3px",
          "cursor:" + (isBlocked || isPending ? "not-allowed" : "pointer"),
          "background:" +
            (isBlocked || isPending
              ? "#30261b"
              : "linear-gradient(180deg, #4d3a22 0%, #291d10 100%)"),
          "color:" + (isBlocked || isPending ? "#6b5c49" : "#fff1cc"),
          "border:" +
            (isBlocked || isPending ? "1px solid #4a3a29" : "1px solid #b88a4b"),
          "box-shadow:" +
            (isBlocked || isPending ? "none" : "0 2px 6px rgba(0,0,0,0.6)"),
          "white-space:nowrap",
        ].join(";");

        if (!isBlocked && !isPending) {
          actBtn.onclick = async () => {
            await dispatchNode(node.id);
          };
        }

        card.appendChild(leftBox);
        card.appendChild(actBtn);
        actionsPanel.appendChild(card);
      });
    }

    modalBox.appendChild(actionsPanel);
    modalOverlay.appendChild(modalBox);

    // 点击遮罩关闭
    modalOverlay.onclick = (e) => {
      if (e.target === modalOverlay) closeMap();
    };

    doc.body.appendChild(modalOverlay);
  }

  triggerBtn.onclick = renderMapModal;

  // 初始化一次 HUD 状态
  updateHUD();

  // ESC 键关闭
  const onKeydown = (e) => {
    if (e.key === "Escape") closeMap();
  };
  doc.addEventListener("keydown", onKeydown);

  // 订阅统一运行时生命周期变动
  const unsubscribe = runtimeApi.subscribe?.(() => {
    updateHUD();
    if (modalOverlay && !dispatching) {
      renderMapModal();
    }
  });

  // 卸载清理函数
  return function unmount() {
    closeMap();
    notice.remove();
    feedback.remove();
    triggerBtn.remove();
    hudBar.remove();
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
