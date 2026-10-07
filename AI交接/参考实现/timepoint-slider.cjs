/* Build: require('./timepoint-slider.cjs').
 * Runtime: include this file's function in the existing state-machine script,
 * then call xdsTimepointModule().install({ host, ownerWindow, setValue }).
 * Never insert this script in chat-message HTML.
 */
function xdsTimepointModule() {
  'use strict';

  const POINTS = Object.freeze([
    ['正章之前', 1577, 7, 1, '七月初一', '正篇尚未启幕，可从此前的年月入世。'],
    ['暗流微澜', 1577, 12, 1, '十二月初一', '暗流渐起，局势仍在酝酿。'],
    ['第一章（墨山探幽）', 1578, 3, 3, '三月初三', '墨山探幽，正篇由此启卷。'],
    ['南域大劫', 1578, 8, 1, '八月初一', '南域局势剧变，各方势力重新划分疆域。'],
    ['天溪兽潮', 1579, 1, 1, '一月初一', '兽潮迫近天溪，城中局势渐趋紧张。'],
    ['天溪城破', 1579, 3, 1, '三月初一', '天溪城破，南域局势再度转折。'],
    ['乱世割据', 1579, 6, 1, '六月初一', '各方势力割据，局势仍在变动。'],
    ['极乐定局', 1580, 1, 1, '一月初一', '格局趋于定局，后续走向仍由当前故事决定。'],
  ].map(([label, year, month, day, dateText, summary]) => Object.freeze({
    label, year, month, day, summary,
    // Preserve the original eight button strings, including this title's spacing.
    value: `${label}${label === '第一章（墨山探幽）' ? '·' : ' ·'} 仙盟历 ${year} 年 · ${dateText}`,
    order: year * 10000 + month * 100 + day,
  })));
  const DEFAULT_INDEX = 2;
  const DEFAULT_VALUE = POINTS[DEFAULT_INDEX].value;
  const FIELD_SELECTOR = '[data-xds-field="custom_timepoint"]';
  const BOX_SELECTOR = '[data-xds-timepoint-box]';
  const HOST_KEY = '__xdsTimepointSlider_v1__';
  const TIMEPOINT_CSS = `
[data-xds-menu] [data-xds-timepoint-box] [hidden]{display:none!important}
[data-xds-menu] [data-xds-timepoint-ready="true"]>[data-xds-timepoint-fallback]{display:none!important}
[data-xds-menu] [data-xds-timepoint-enhancer]{margin-top:.5rem}
[data-xds-menu] [data-xds-timepoint-range]{display:block;width:100%;min-height:44px;margin:0;accent-color:#c9a66b;cursor:pointer}
[data-xds-menu] [data-xds-timepoint-range]:focus-visible{outline:2px solid currentColor;outline-offset:2px}
[data-xds-menu] [data-xds-timepoint-out]{display:block;overflow-wrap:anywhere;line-height:1.6}
[data-xds-menu] [data-xds-timepoint-summary]{margin:.25rem 0;line-height:1.6}
[data-xds-menu] [data-xds-timepoint-apply]{min-height:44px;max-width:100%;padding:.35rem .7rem;cursor:pointer;white-space:normal}
@media(pointer:coarse){[data-xds-menu] [data-xds-timepoint-range]{touch-action:pan-y}}
`;

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,
    character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

  function renderTimepoint(instanceId) {
    if (!/^[a-z][a-z0-9_-]*$/i.test(instanceId)) throw new Error('不合法的菜单 instanceId');
    const id = `${instanceId}-custom_timepoint`;
    const buttons = POINTS.map(point => `<button type="button" data-xds-fill="custom_timepoint" data-xds-value="${escapeHtml(point.value)}" aria-pressed="false">${escapeHtml(point.value)}</button>`).join('');
    return `<div data-xds-field-box="wide" data-xds-timepoint-box>
      <label data-xds-field-label for="${id}">当前时点</label>
      <input type="text" class="xds-input" id="${id}" name="custom_timepoint" data-xds-field="custom_timepoint" placeholder="留空默认仙盟历 1578 年 · 三月初三；可手填，如仙盟历 1579 年 · 六月初七" maxlength="64">
      <div data-xds-timepoint-enhancer hidden>
        <input type="range" min="0" max="7" step="1" value="2" data-xds-timepoint-range aria-label="当前时点预设，共八个停靠点" aria-valuetext="${escapeHtml(DEFAULT_VALUE)}">
        <output data-xds-timepoint-out aria-live="polite" aria-atomic="true">${escapeHtml(DEFAULT_VALUE)}</output>
        <p data-xds-timepoint-summary>${escapeHtml(POINTS[DEFAULT_INDEX].summary)}</p>
        <button type="button" data-xds-timepoint-apply hidden>采用滑块参考点</button>
        <p data-xds-help>手填日期会保留原值；拖动滑块将采用预设日期。落款提交后生效。</p>
      </div>
      <div data-xds-chips data-xds-timepoint-fallback>${buttons}</div>
    </div>`;
  }

  function numeral(token) {
    if (/^\d{1,2}$/.test(token)) return Number(token);
    const digits = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
    if (Object.hasOwn(digits, token)) return digits[token];
    if (token === '十') return 10;
    const match = /^([一二三四五六七八九])?十([一二三四五六七八九])?$/.exec(token);
    return match ? (match[1] ? digits[match[1]] : 1) * 10 + (match[2] ? digits[match[2]] : 0) : NaN;
  }

  // This parser reads one submitted field, never a whole menu/message. It does
  // basic fictional-calendar validation; it does not assume Gregorian/leap rules.
  function parseDate(value) {
    const text = String(value ?? '').trim();
    if (!text || text.length > 64 || /[\r\n<>]/.test(text)) return null;
    if ((text.match(/仙盟历/g) || []).length !== 1) return null;
    const match = /^([^\r\n<>]*?)仙盟历\s*(\d{1,6})\s*年\s*[·•]?\s*([\d零〇一二两三四五六七八九十]+)\s*月\s*[·•]?\s*((?:初|廿|卅)?[\d零〇一二三四五六七八九十]*)(?:日|号)?\s*[）)]?$/.exec(text);
    if (!match || !match[4]) return null;
    const year = Number(match[2]);
    const month = numeral(match[3]);
    let token = match[4];
    let day;
    if (token.startsWith('初')) {
      day = numeral(token.slice(1));
      if (!(day >= 1 && day <= 10)) return null;
    } else if (/^[廿卅]/.test(token)) {
      const base = token[0] === '廿' ? 20 : 30;
      token = token.slice(1);
      if (token && !/^[一二三四五六七八九]$/.test(token)) return null;
      day = base + (token ? numeral(token) : 0);
    } else {
      day = numeral(token);
    }
    if (!(year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= 31)) return null;
    return Object.freeze({ year, month, day, order: year * 10000 + month * 100 + day });
  }

  function resolveTimepoint(raw) {
    const value = String(raw ?? '').trim() || DEFAULT_VALUE;
    const date = parseDate(value);
    if (!date) throw new Error('当前时点无法识别，请填写一个明确日期，如「仙盟历 1579 年 · 六月初七」。');
    return Object.freeze({ value, date, ym: date.year + date.month / 100, day: date.day });
  }

  // Fallback for a state machine that restores a custom opening from its
  // submitted message. Call ONLY in the custom-opening branch. A structured
  // submit argument is preferred; arbitrary later narration is not an opening.
  function resolveFromIntro(text) {
    const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
    const selected = lines.filter(line => line.startsWith('• 当前时点：'));
    if (selected.length !== 1) throw new Error('自设开局必须且只能有一行「• 当前时点：」。');
    return resolveTimepoint(selected[0].slice('• 当前时点：'.length));
  }

  function describe(raw) {
    const text = String(raw ?? '').trim();
    if (!text) return { index: DEFAULT_INDEX, mode: 'default', out: `默认：${DEFAULT_VALUE}`, summary: POINTS[DEFAULT_INDEX].summary };
    const date = parseDate(text);
    if (!date) return { index: DEFAULT_INDEX, mode: 'invalid', out: `待确认：${text}`, summary: '请填写一个明确的仙盟历年月日；当前文字保留，尚未采用预设日期。' };
    const exact = POINTS.findIndex(point => point.order === date.order);
    if (exact >= 0) return { index: exact, mode: 'preset', out: text, summary: POINTS[exact].summary };
    let index = 0;
    POINTS.forEach((point, position) => { if (point.order <= date.order) index = position; });
    const beyond = date.order < POINTS[0].order ? '早于首个预设' : date.order > POINTS.at(-1).order ? '晚于末个预设' : `参考点：${POINTS[index].label}`;
    return { index, mode: 'custom', out: `自定义：${text}`, summary: `${beyond}；当前日期保持原值。` };
  }

  function nativeSetValue(input, value) {
    const view = input.ownerDocument.defaultView;
    const setter = Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new view.Event('input', { bubbles: true }));
  }

  function install({ host, ownerWindow = host, setValue = nativeSetValue, onError = error => host.console.warn('[XDS timepoint]', error) }) {
    const doc = host?.document;
    if (!doc || typeof host.MutationObserver !== 'function' || typeof setValue !== 'function') throw new Error('时点滑块缺少宿主 document、MutationObserver 或填值函数');
    const previous = host[HOST_KEY];
    if (previous && typeof previous.dispose === 'function') previous.dispose();
    const boxes = new Map();
    let disposed = false;
    let observer;
    let handle;
    const notifyError = error => { try { onError(error); } catch { /* fallback remains available */ } };
    const setText = (element, value) => { if (element.textContent !== value) element.textContent = value; };

    function restore(parts) {
      parts.enhancer.hidden = true;
      parts.fallback.hidden = false;
      parts.box.removeAttribute('data-xds-timepoint-ready');
      parts.box.removeAttribute('data-xds-timepoint-mode');
    }

    function paint(parts) {
      const state = describe(parts.input.value);
      parts.range.value = String(state.index);
      parts.range.disabled = parts.input.disabled || parts.input.readOnly;
      parts.apply.disabled = parts.range.disabled;
      const reference = POINTS[state.index];
      const custom = state.mode === 'custom' || state.mode === 'invalid';
      parts.range.setAttribute('aria-valuetext', custom ? `参考：${reference.value}；${state.out}` : state.out);
      setText(parts.out, state.out);
      setText(parts.summary, state.summary);
      parts.apply.hidden = !custom;
      setText(parts.apply, `采用参考点：${reference.label}`);
      parts.box.setAttribute('data-xds-timepoint-mode', state.mode);
    }

    function initBox(box) {
      if (disposed || boxes.has(box) || !box.closest('[data-xds-menu]')) return boxes.get(box);
      const input = box.querySelector(FIELD_SELECTOR);
      const enhancer = box.querySelector('[data-xds-timepoint-enhancer]');
      const fallback = box.querySelector('[data-xds-timepoint-fallback]');
      // Old cards have no enhancer: leave their existing controls alone.
      if (!enhancer) return null;
      const range = enhancer.querySelector('[data-xds-timepoint-range]');
      const out = enhancer.querySelector('[data-xds-timepoint-out]');
      const summary = enhancer.querySelector('[data-xds-timepoint-summary]');
      const apply = enhancer.querySelector('[data-xds-timepoint-apply]');
      if (!input || input.tagName !== 'INPUT' || input.type !== 'text' || !fallback || !range || range.type !== 'range' || range.min !== '0' || range.max !== '7' || range.step !== '1' || !out || !summary || !apply) {
        enhancer.hidden = true;
        if (fallback) fallback.hidden = false;
        box.removeAttribute('data-xds-timepoint-ready');
        notifyError(new Error('时点滑块标记不完整，保留原入口'));
        return null;
      }
      const parts = { box, input, enhancer, fallback, range, out, summary, apply };
      try {
        paint(parts); // Reads the field only. No date/state write at startup.
        boxes.set(box, parts);
        enhancer.hidden = false;
        fallback.hidden = true;
        box.setAttribute('data-xds-timepoint-ready', 'true');
        return parts;
      } catch (error) {
        restore(parts);
        notifyError(error);
        return null;
      }
    }

    function scan(root) {
      if (root.nodeType === 1 && root.matches(BOX_SELECTOR)) initBox(root);
      if (typeof root.querySelectorAll === 'function') root.querySelectorAll(BOX_SELECTOR).forEach(initBox);
    }

    function applyPoint(parts) {
      const index = Number(parts.range.value);
      if (!Number.isInteger(index) || !POINTS[index]) throw new Error('不合法的滑块索引');
      const value = POINTS[index].value;
      if (parts.input.value !== value) setValue(parts.input, value);
      paint(parts);
    }

    function eventHandler(event) {
      const target = event.target;
      if (!target || typeof target.matches !== 'function') return;
      const fieldEvent = target.matches(FIELD_SELECTOR) && (event.type === 'input' || event.type === 'change');
      const rangeEvent = target.matches('[data-xds-timepoint-range]') && (event.type === 'input' || event.type === 'change');
      const applyButton = event.type === 'click' ? target.closest('[data-xds-timepoint-apply]') : null;
      if (!fieldEvent && !rangeEvent && !applyButton) return;
      const box = target.closest(BOX_SELECTOR);
      if (!box || !box.closest('[data-xds-menu]')) return;
      const parts = boxes.get(box) || initBox(box);
      if (!parts) return;
      try {
        if (fieldEvent && target === parts.input) paint(parts);
        else if ((rangeEvent && target === parts.range) || applyButton === parts.apply) {
          if (parts.input.disabled || parts.input.readOnly) { paint(parts); return; }
          if (applyButton) event.preventDefault();
          applyPoint(parts);
        }
      } catch (error) {
        restore(parts);
        boxes.delete(box);
        notifyError(error);
      }
    }

    function onMutation(records) {
      if (disposed) return;
      // Output text mutations are ignored; only added/removed element nodes
      // can introduce a menu or replace its controls.
      const structural = records.filter(record => [...record.addedNodes, ...record.removedNodes].some(node => node.nodeType === 1));
      if (!structural.length) return;
      for (const [box, parts] of boxes) {
        if (!box.isConnected || ![parts.input, parts.enhancer, parts.fallback, parts.range, parts.out, parts.summary, parts.apply].every(element => box.contains(element))) {
          restore(parts);
          boxes.delete(box);
        }
      }
      structural.forEach(record => {
        if (record.target.nodeType === 1) {
          const box = record.target.closest(BOX_SELECTOR);
          if (box) initBox(box);
        }
        record.addedNodes.forEach(node => { if (node.nodeType === 1) scan(node); });
      });
    }

    function dispose() {
      if (disposed) return;
      disposed = true;
      if (observer) observer.disconnect();
      ['input', 'change', 'click'].forEach(type => doc.removeEventListener(type, eventHandler));
      ownerWindow.removeEventListener('pagehide', dispose);
      ownerWindow.removeEventListener('unload', dispose);
      boxes.forEach(restore);
      boxes.clear();
      if (host[HOST_KEY] === handle) delete host[HOST_KEY];
    }

    handle = Object.freeze({ dispose, refresh: () => { if (!disposed) scan(doc); } });
    try {
      ['input', 'change', 'click'].forEach(type => doc.addEventListener(type, eventHandler));
      observer = new host.MutationObserver(onMutation);
      observer.observe(doc.documentElement, { childList: true, subtree: true });
      ownerWindow.addEventListener('pagehide', dispose);
      ownerWindow.addEventListener('unload', dispose);
      host[HOST_KEY] = handle;
      scan(doc);
      return handle;
    } catch (error) {
      dispose();
      throw error;
    }
  }

  return Object.freeze({ POINTS, DEFAULT_INDEX, DEFAULT_VALUE, TIMEPOINT_CSS, renderTimepoint, parseDate, resolveTimepoint, resolveFromIntro, describe, install });
}

if (typeof window === 'undefined' && typeof module === 'object' && module.exports) module.exports = xdsTimepointModule();
