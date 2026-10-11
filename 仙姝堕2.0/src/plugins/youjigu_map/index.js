/**
 * 《仙姝堕 2.0》幽寂谷地图插件入口模块
 * ─────────────────────────────────────────────────────────────────────────────
 * 遵循《仙姝堕2.0/分工与接口草案.md》契约：
 * 1. 导出标准装配生命周期：mount(slotElement, runtimeApi) -> unmount()
 * 2. 挂载于 HUD 预留插槽 `data-xsd-slot="map"`
 * 3. 严格经由 runtimeApi.dispatchIntent 提交意图，严禁私自修改全局状态
 * 4. 具备完整的退出确认、TTL 状态显示与漏标防死锁恢复
 */

import {
  EVENT_DEFS,
  OPEN_STAMP,
  CLOSE_STAMP,
  createInitialState,
  getAvailableOptions,
  applyAction,
  advanceToSecondStage,
  stampToDate
} from './event_tree.js';

import { resolveActionResult } from './evidence.js';

export const PLUGIN_ID = 'youjigu_map';
export const PLUGIN_VERSION = '2.0.0';

/**
 * 插件装配函数
 * @param {HTMLElement} slotElement - HUD 提供的挂载宿主容器
 * @param {Object} runtimeApi - 宿主提供的统一运行时接口
 * @returns {Function} unmount - 卸载清理函数
 */
export function mount(slotElement, runtimeApi) {
  if (!slotElement) {
    console.warn('[YoujiguMap] 未找到挂载容器 slotElement，装配跳过');
    return () => {};
  }

  // 内部轻量状态
  let isMapExpanded = false;
  let activePendingAction = null;
  let pluginState = null;
  let unsubscribeRuntime = null;

  // 初始化或从快照恢复
  function syncFromSnapshot() {
    const snap = runtimeApi?.getSnapshot ? runtimeApi.getSnapshot() : null;
    if (snap && snap.activeEvent && snap.activeEvent.pluginId === PLUGIN_ID) {
      pluginState = snap.activeEvent.state;
      activePendingAction = snap.activeEvent.pendingAction || null;
    } else {
      const startStamp = snap?.calendarStamp || OPEN_STAMP;
      const identity = snap?.identity || '自设';
      pluginState = createInitialState(identity, startStamp);
      activePendingAction = null;
    }
  }

  syncFromSnapshot();

  // 创建 DOM 容器
  const wrapper = document.createElement('div');
  wrapper.className = 'xsd-map-plugin-wrapper';
  wrapper.style.cssText = 'position:relative;display:inline-block;';

  // 渲染触发按钮
  const triggerBtn = document.createElement('button');
  triggerBtn.type = 'button';
  triggerBtn.className = 'xsd-map-trigger-btn';
  triggerBtn.innerHTML = '<span>🗺️ 地图</span>';
  triggerBtn.style.cssText = [
    'padding:4px 10px',
    'background:linear-gradient(180deg, #2b251f 0%, #17130f 100%)',
    'color:#d8c39d',
    'border:1px solid #7a6341',
    'border-radius:3px',
    'cursor:pointer',
    'font-size:12px',
    'letter-spacing:1px',
    'transition:all 0.2s ease'
  ].join(';');

  // 地图主面板容器（默认隐藏）
  const mapPanel = document.createElement('div');
  mapPanel.className = 'xsd-map-modal-panel';
  mapPanel.style.cssText = [
    'display:none',
    'position:absolute',
    'top:100%',
    'left:0',
    'width:320px',
    'max-width:90vw',
    'background:#15120e',
    'border:1px solid #8c734b',
    'box-shadow:0 8px 24px rgba(0,0,0,0.85)',
    'padding:12px',
    'border-radius:4px',
    'z-index:999',
    'margin-top:6px',
    'color:#c9baa2',
    'font-size:12px',
    'line-height:1.6'
  ].join(';');

  wrapper.appendChild(triggerBtn);
  wrapper.appendChild(mapPanel);
  slotElement.appendChild(wrapper);

  // 渲染面板内容
  function renderPanel() {
    if (!isMapExpanded) {
      mapPanel.style.display = 'none';
      return;
    }
    mapPanel.style.display = 'block';

    const snap = runtimeApi?.getSnapshot ? runtimeApi.getSnapshot() : {};
    const currentFloor = snap.floor || 0;
    const dateInfo = stampToDate(pluginState.currentStamp);

    const isWindowOpen = pluginState.currentStamp >= OPEN_STAMP && pluginState.currentStamp <= CLOSE_STAMP;

    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #3d3324;padding-bottom:6px;margin-bottom:8px;">
        <span style="font-weight:bold;color:#f0e3cc;">📍 南疆全域 · 幽寂谷</span>
        <button type="button" class="xsd-map-close-btn" style="background:none;border:none;color:#99876e;cursor:pointer;font-size:14px;">✕</button>
      </div>
      <div style="font-size:11px;color:#8a7a63;margin-bottom:6px;">
        时令：${dateInfo.text} ${isWindowOpen ? '<span style="color:#6ea87a;">(适逢谷开)</span>' : '<span style="color:#a86e6e;">(非开放期)</span>'}
      </div>
    `;

    // 处于 pending 状态时的特殊提示
    if (activePendingAction) {
      html += `
        <div style="background:#261f17;border:1px dashed #a88a4e;padding:8px;border-radius:3px;margin-bottom:8px;">
          <div style="color:#e6c98f;font-weight:bold;">⏳ 待完成行动</div>
          <div style="margin:4px 0;">已选择：「${activePendingAction.label}」</div>
          <div style="font-size:11px;color:#998870;">请发送输入框中的行动文本，等待故事演绎推进。</div>
          <button type="button" class="xsd-map-cancel-pending-btn" style="margin-top:6px;padding:2px 8px;background:#381c1c;border:1px solid #6b2d2d;color:#e89b9b;border-radius:2px;cursor:pointer;font-size:11px;">放弃本次行动</button>
        </div>
      `;
    }

    // 渲染可用行动列表
    const options = getAvailableOptions(pluginState, currentFloor);
    html += '<div style="margin-top:8px;"><div style="font-weight:bold;color:#d4c4aa;margin-bottom:4px;">可探索节点：</div>';

    if (!options.length) {
      html += '<div style="font-size:11px;color:#706352;">当前暂无可选路径或已达阶段终点。</div>';
    } else {
      options.forEach(opt => {
        const isBlocked = !!opt.blocked;
        const ttlLabel = opt.remainingTtl !== null ? ` (剩${opt.remainingTtl}轮)` : '';
        const mutexLabel = opt.group ? ' [二选一]' : '';
        const confirmLabel = opt.needsConfirm ? ' [退出确认]' : '';

        html += `
          <div style="margin-bottom:6px;">
            <button type="button" class="xsd-map-act-btn" data-act-id="${opt.id}" ${isBlocked ? 'disabled' : ''} style="
              width:100%;
              text-align:left;
              padding:5px 8px;
              background:${isBlocked ? '#1e1b17' : '#29221a'};
              color:${isBlocked ? '#594f43' : '#e0cfb6'};
              border:1px solid ${isBlocked ? '#332d24' : '#5c4b33'};
              border-radius:2px;
              cursor:${isBlocked ? 'not-allowed' : 'pointer'};
              font-size:11px;
            ">
              ${opt.label}${ttlLabel}${mutexLabel}${confirmLabel}
            </button>
            ${isBlocked ? `<div style="font-size:10px;color:#804d4d;padding-left:4px;">${opt.blocked}</div>` : ''}
          </div>
        `;
      });
    }

    // 若在第一轮谷口且还有第二轮前置
    if (pluginState.step === 'first' && !activePendingAction) {
      html += `
        <div style="margin-top:8px;border-top:1px dashed #3d3324;padding-top:6px;">
          <button type="button" class="xsd-map-advance-btn" style="width:100%;padding:4px;background:#1e2920;border:1px solid #3d6344;color:#a8d4b0;cursor:pointer;border-radius:2px;font-size:11px;">
            ➔ 确认深入谷中（转入第二轮）
          </button>
        </div>
      `;
    }

    html += '</div>';
    mapPanel.innerHTML = html;

    // 绑定面板内部事件
    bindPanelEvents();
  }

  function bindPanelEvents() {
    const closeBtn = mapPanel.querySelector('.xsd-map-close-btn');
    if (closeBtn) {
      closeBtn.onclick = () => {
        isMapExpanded = false;
        renderPanel();
      };
    }

    const cancelPendingBtn = mapPanel.querySelector('.xsd-map-cancel-pending-btn');
    if (cancelPendingBtn) {
      cancelPendingBtn.onclick = () => {
        activePendingAction = null;
        if (runtimeApi?.dispatchIntent) {
          runtimeApi.dispatchIntent({
            pluginId: PLUGIN_ID,
            type: 'CANCEL_PENDING'
          });
        }
        renderPanel();
      };
    }

    const advanceBtn = mapPanel.querySelector('.xsd-map-advance-btn');
    if (advanceBtn) {
      advanceBtn.onclick = () => {
        const adv = advanceToSecondStage(pluginState);
        if (adv.ok) {
          pluginState = adv.state;
          if (runtimeApi?.dispatchIntent) {
            runtimeApi.dispatchIntent({
              pluginId: PLUGIN_ID,
              type: 'STATE_UPDATE',
              payload: { state: pluginState }
            });
          }
          renderPanel();
        }
      };
    }

    const actBtns = mapPanel.querySelectorAll('.xsd-map-act-btn');
    actBtns.forEach(btn => {
      btn.onclick = () => {
        const actId = btn.getAttribute('data-act-id');
        const def = EVENT_DEFS[actId];
        if (!def) return;

        // 退出节点二次确认
        if (def.needsConfirm) {
          const ok = window.confirm(`确认要${def.label}吗？退出后将推进${def.early ? 1 : 2}日世界日期并结算本次机缘。`);
          if (!ok) return;
        }

        executeSelection(def);
      };
    });
  }

  function executeSelection(def) {
    activePendingAction = def;

    // 1. 通过统一 Dispatcher 派发行动意图
    if (runtimeApi?.dispatchIntent) {
      runtimeApi.dispatchIntent({
        pluginId: PLUGIN_ID,
        type: 'SELECT_ACTION',
        payload: {
          actionId: def.id,
          label: def.label,
          actionText: def.actionText,
          expectedReward: def.reward || null,
          requires: def.requires || null
        }
      });
    }

    // 2. 将动作文本自动填入 SillyTavern 输入框，引导自然语言演绎
    fillChatInput(def.actionText);

    // 3. 关闭面板并刷新提示
    isMapExpanded = false;
    renderPanel();
  }

  function fillChatInput(text) {
    try {
      const parentDoc = (typeof window !== 'undefined' && window.parent?.document) || document;
      const textarea = parentDoc.querySelector('#send_textarea') || parentDoc.querySelector('textarea');
      if (textarea) {
        textarea.value = text;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.focus();
      }
    } catch (e) {
      console.warn('[YoujiguMap] 自动填充输入框异常：', e);
    }
  }

  // 展开/收起按钮点击
  triggerBtn.onclick = () => {
    isMapExpanded = !isMapExpanded;
    renderPanel();
  };

  // 订阅宿主状态变化
  if (runtimeApi?.subscribe) {
    unsubscribeRuntime = runtimeApi.subscribe((event) => {
      if (!event) return;

      // 楼层推进且有待结算行动时，核验正文
      if (event.type === 'ASSISTANT_REPLY' && activePendingAction) {
        const proseText = event.text || '';
        const res = resolveActionResult(proseText, activePendingAction);

        if (res.success) {
          const applied = applyAction(pluginState, activePendingAction.id, event.floor || 0);
          if (applied.ok) {
            pluginState = applied.state;
            activePendingAction = null;
            if (runtimeApi.dispatchIntent) {
              runtimeApi.dispatchIntent({
                pluginId: PLUGIN_ID,
                type: 'ACTION_CONFIRMED',
                payload: {
                  actionId: event.actionId,
                  reward: applied.state.inventory.slice(-1)[0] || null,
                  receipt: applied.state.receipt,
                  state: pluginState
                }
              });
            }
          }
        }
      }

      // 分支切换或回退时重新同步
      if (event.type === 'ROLLBACK' || event.type === 'BRANCH_CHANGE') {
        syncFromSnapshot();
      }

      renderPanel();
    });
  }

  renderPanel();

  // 返回标准卸载清理函数
  return function unmount() {
    if (unsubscribeRuntime) {
      unsubscribeRuntime();
      unsubscribeRuntime = null;
    }
    if (wrapper && wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  };
}
