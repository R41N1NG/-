/* ═══════════════════════════════════════════════════════════
 * 二 · 酒馆助手接口探测（全部 typeof 保护，取不到就降级）
 * ═══════════════════════════════════════════════════════════ */

const XSD_HOST_PORTS = createXsdHostPorts({
  window: typeof window !== 'undefined' ? window : undefined,
  globalThis: typeof globalThis !== 'undefined' ? globalThis : undefined,
  console, TAG,
  getters: {
    getVariables: () => (typeof getVariables === 'function' ? getVariables : null),
    replaceVariables: () => (typeof replaceVariables === 'function' ? replaceVariables : null),
    insertOrAssignVariables: () => (typeof insertOrAssignVariables === 'function' ? insertOrAssignVariables : null),
    updateVariablesWith: () => (typeof updateVariablesWith === 'function' ? updateVariablesWith : null),
    deleteVariable: () => (typeof deleteVariable === 'function' ? deleteVariable : null),
    getChatMessages: () => (typeof getChatMessages === 'function' ? getChatMessages : null),
    setChatMessages: () => (typeof setChatMessages === 'function' ? setChatMessages : null),
    getCharacter: () => (typeof getCharacter === 'function' ? getCharacter : null),
    getCharWorldbookNames: () => (typeof getCharWorldbookNames === 'function' ? getCharWorldbookNames : null),
    getWorldbookNames: () => (typeof getWorldbookNames === 'function' ? getWorldbookNames : null),
    getWorldbook: () => (typeof getWorldbook === 'function' ? getWorldbook : null),
    replaceWorldbook: () => (typeof replaceWorldbook === 'function' ? replaceWorldbook : null),
    loadWorldInfo: () => (typeof loadWorldInfo === 'function' ? loadWorldInfo : null),
    saveWorldInfo: () => (typeof saveWorldInfo === 'function' ? saveWorldInfo : null),
    updateWorldInfoList: () => (typeof updateWorldInfoList === 'function' ? updateWorldInfoList : null),
    getContext: () => (typeof getContext === 'function' ? getContext : null),
    eventOn: () => (typeof eventOn === 'function' ? eventOn : null),
    eventRemoveListener: () => (typeof eventRemoveListener === 'function' ? eventRemoveListener : null),
    stopGeneration: () => (typeof stopGeneration === 'function' ? stopGeneration : null),
    injectPrompts: () => (typeof injectPrompts === 'function' ? injectPrompts : null),
    getLastMessageId: () => (typeof getLastMessageId === 'function' ? getLastMessageId : null),
    tavern_events: () => (typeof tavern_events !== 'undefined' ? tavern_events : undefined),
    SillyTavern: () => (typeof SillyTavern !== 'undefined' ? SillyTavern : undefined),
    toastr: () => (typeof toastr !== 'undefined' ? toastr : undefined),
  },
});
const API = XSD_HOST_PORTS.API;
const EVENTS = XSD_HOST_PORTS.EVENTS;
function msgOf(e) { return XSD_HOST_PORTS.msgOf(e); }
function getGlobalOrParent(name) { return XSD_HOST_PORTS.getGlobalOrParent(name); }
function grab(name, getter, required) { return XSD_HOST_PORTS.grab(name, getter, required); }
function currentChatId() { return XSD_HOST_PORTS.currentChatId(); }
function toast(kind, message, timeOut) { return XSD_HOST_PORTS.toast(kind, message, timeOut); }
