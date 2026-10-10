/* ═══════════════════════════════════════════════════════════
 * 十三 · 诊断入口（主控制台或任意控制台可调）
 * ═══════════════════════════════════════════════════════════ */

/** 可用接口清单（都做 typeof 保护，取不到的写「不可用」） */
function apiReport() {
  const out = {};
  for (const k of Object.keys(API)) out[k] = typeof API[k] === 'function' ? '可用' : '不可用';
  out.eventOn = typeof API.eventOn === 'function' ? '可用' : '不可用';
  out.tavern_events = EVENTS ? '可用' : '不可用';
  out.toastr = (() => {
    try { if (window.parent && window.parent.toastr) return '可用（主窗口）'; } catch (e) { /* 跨源 */ }
    try { return (typeof toastr !== 'undefined' && toastr) ? '可用（本 iframe）' : '不可用'; } catch (e) { return '不可用'; }
  })();
  return out;
}

/** 一键诊断：身份 / 阵营 / 已知 / 菜单 / 上下文 / 接口 / 读写层 */
function xsdWho() {
  const known = readKnown() || {};
  const out = {
    版本: VERSION,
    当前身份: readIdentity(),
    当前阵营: readFaction(),
    已解锁字段: ALL_FIELDS.filter((f) => known[f] === true),
    未设字段: ALL_FIELDS.filter((f) => typeof known[f] !== 'boolean'),
    菜单委托已挂: (() => { try { return !!(window.parent && window.parent.document && window.parent.document.__xsdMenuBound); } catch (e) { return '跨源取不到'; } })(),
    跑在iframe里: (() => { try { return window.top !== window.self; } catch (e) { return '跨源取不到'; } })(),
    /* v1.4：渲染触发链的两个入口在不在 —— 排障时一眼看出「主路径」通不通 */
    渲染触发入口: {
      __xsdStateTick: (() => { try { return typeof window.__xsdStateTick === 'function' ? '可用' : '不可用（本层）'; } catch (e) { return 'ERR'; } })(),
      父窗: (() => { try { return window.parent ? (typeof window.parent.__xsdStateTick === 'function' ? '可用' : '不可用') : '无父窗'; } catch (e) { return '跨源取不到'; } })(),
      顶层: (() => { try { return window.top ? (typeof window.top.__xsdStateTick === 'function' ? '可用' : '不可用') : '无顶层'; } catch (e) { return '跨源取不到'; } })(),
      面板入口__xsdFillPanel: (() => {
        try { if (typeof window.__xsdFillPanel === 'function') return '可用（本层）'; } catch (e) { /* 继续 */ }
        try { return (window.parent && typeof window.parent.__xsdFillPanel === 'function') ? '可用（父窗）' : '不可用'; } catch (e) { return '跨源取不到'; }
      })(),
      主路径: '渲染触发（卡内正则产出的 iframe 回调）；eventOn 缺失不影响这一条',
    },
    可用API清单: apiReport(),
    读写层: {
      读: '消息层(#-1)优先 → 聊天层兜底 → 都没有就初始化',
      写: '双写：消息层(#-1) ＋ 聊天层，两次都走同一条路',
      消息层: layerProbe(L_MSG),
      聊天层: layerProbe(L_CHAT),
    },
    第0楼swipe: (() => {
      try {
        const m0 = API.getChatMessages(0, { include_swipes: true })[0];
        return {
          当前: m0 && m0.swipe_id,
          全部: (((m0 && m0.swipes) || []).map((s, i) => {
            const m = /<IdentityPick\s+name="([^"]+)"/.exec(String(s));
            return `${i}:${m ? m[1] : '无标记'}${String(s).includes('<IdentityMenu/>') ? '(菜单楼)' : ''}`;
          })),
        };
      } catch (e) { return 'ERR ' + msgOf(e); }
    })(),
  };
  console.log(TAG, out);
  return out;
}

/** 只打快照，方便一眼看出账本长什么样 */
function xsdDump() { return dumpStat('手动快照'); }

/** 重跑一次初始化 ＋ 首楼身份判定（不覆盖已设身份） */
function xsdBoot() { return boot('手动'); }

window.__xsdWho = xsdWho;
window.__xsdDump = xsdDump;
window.__xsdBoot = xsdBoot;
try {
  window.parent.__xsdWho = xsdWho;
  window.parent.__xsdDump = xsdDump;
  window.parent.__xsdBoot = xsdBoot;
} catch (e) { /* 跨源则跳过 */ }

