/* 一次性补丁：GM 面板做「玩家易用」三件套（搜索 / 只看已解锁 / 撤销上次解锁）＋命令速查
 *  背景：玩家反馈「/解锁 打错字，激活了别的，怎么关？」⇒ 除卡内 /撤销 命令外，
 *        面板上也要有看得见、点得到的入口，别让玩家去背字段名。
 */
import fs from 'node:fs';

const F = '卡片脚本/GM修改器.js';
let s = fs.readFileSync(F, 'utf8');
const log = [];

/* ① 页脚加控件 */
const OLD_FOOT = [
  "      '  <button type=\"button\" class=\"xshd-gm-btn\" id=\"' + q('dump') + '\">打印快照</button>',",
  "      '</div>',",
].join('\n');
const NEW_FOOT = [
  "      '  <button type=\"button\" class=\"xshd-gm-btn\" id=\"' + q('dump') + '\">打印快照</button>',",
  "      '</div>',",
  "      '<div class=\"xshd-gm-help\" id=\"' + q('helpbar') + '\">',",
  "      '  <input class=\"xshd-gm-in\" type=\"text\" id=\"' + q('search') + '\" placeholder=\"🔍 搜索锚点（打名字片段，如 灼酒）\" style=\"flex:1 1 180px;min-width:140px\" />',",
  "      '  <button type=\"button\" class=\"xshd-gm-btn\" id=\"' + q('onlyon') + '\" title=\"只显示已解锁的锚点\">只看已解锁</button>',",
  "      '  <button type=\"button\" class=\"xshd-gm-btn\" id=\"' + q('undo') + '\" title=\"退掉最近一次解锁（等于聊天里发 /撤销）\">↩ 撤销上次解锁</button>',",
  "      '</div>',",
  "      '<div class=\"xshd-gm-hint\" id=\"' + q('cmdbar') + '\">命令速查：/已知 看已解锁 · /锚点 看全部锚点 · /解锁 &lt;字段&gt; 翻开 · /回锁 &lt;字段&gt; 退回 · /撤销 退掉最近一次 · /物品 看行囊</div>',",
].join('\n');
if (s.includes(OLD_FOOT)) { s = s.replace(OLD_FOOT, NEW_FOOT); log.push('✔ 页脚加：搜索框／只看已解锁／撤销上次解锁／命令速查'); }
else log.push('✘ 页脚锚点未命中');

/* ② 辅助逻辑：过滤 + 撤销（插在 buildShell 定义之前） */
const ANCHOR2 = '  /** 面板骨架（只建一次；之后只重填内容） */';
const HELPERS = [
  '  /** 面板上的辅助：过滤锚点列表（搜索 + 只看已解锁） */',
  '  function applyCheckFilter(mask, onlyOn) {',
  '    try {',
  '      var box = mask.querySelector(\'#\' + q(\'search\'));',
  '      var kw = box && box.value ? String(box.value).trim().toLowerCase() : \'\';',
  '      var labs = mask.querySelectorAll(\'.xshd-gm-check\');',
  '      for (var i = 0; i < labs.length; i++) {',
  '        var txt = (labs[i].textContent || \'\').toLowerCase();',
  '        var inp = labs[i].querySelector(\'input[data-known]\');',
  '        var on = (labs[i].className || \'\').indexOf(\' on\') >= 0 || (inp && inp.checked);',
  '        var hit = (!kw || txt.indexOf(kw) >= 0) && (!onlyOn || on);',
  '        labs[i].style.display = hit ? \'\' : \'none\';',
  '      }',
  '    } catch (e) { /* 过滤失败不影响面板 */ }',
  '  }',
  '  /** 撤销「最近一次解锁」：勾选框取消 + 复用保存路径写回 + 提示 */',
  '  function undoLastUnlock(mask) {',
  '    function say(t) { try { var lg = mask.querySelector(\'#\' + q(\'log\')); if (lg) { lg.textContent = t; } } catch (e) {} try { console.log(TAG, \'[GM]\', t); } catch (e) {} }',
  '    try {',
  '      var gv = (typeof getVariables === \'function\') ? getVariables : null;',
  '      var sd = gv ? ((gv({ type: \'chat\' }) || {}).stat_data || {}) : {};',
  '      var last = String(sd.最近解锁 || \'\').trim();',
  '      if (!last) { say(\'没有可撤销的解锁（最近解锁为空）—— 可用「搜索」找到那条锚点，手动取消勾选后点保存\'); return; }',
  '      var cb = mask.querySelector(\'input[data-known="\' + last.replace(/"/g, \'\\\\"\') + \'"]\');',
  '      if (!cb) { say(\'找不到「\' + last + \'」的勾选框（可能不在本卡字段表里）\'); return; }',
  '      cb.checked = false;',
  '      var lab = cb.parentNode;',
  '      if (lab && lab.className) { lab.className = String(lab.className).replace(/\\s*on\\b/g, \'\'); }',
  '      var sv = mask.querySelector(\'#\' + q(\'save\'));',
  '      if (sv) { sv.click(); }',
  '      say(\'↩ 已把「\' + last + \'」退回未解锁（已点保存并生效，下一回合生效）\');',
  '    } catch (e) { say(\'撤销失败：\' + ((e && e.message) || e)); }',
  '  }',
  '',
].join('\n');
if (s.includes(ANCHOR2) && !s.includes('applyCheckFilter')) { s = s.replace(ANCHOR2, HELPERS + ANCHOR2); log.push('✔ 插入 applyCheckFilter / undoLastUnlock'); }
else log.push(s.includes('applyCheckFilter') ? '– 辅助逻辑已存在' : '✘ 辅助逻辑插入锚点未命中');

/* ③ 在骨架末尾接线 */
const ANCHOR3 = '    // 身份下拉的选项在这里一次性拼好，重渲染时只改 value';
const WIRE = [
  '    // 玩家易用三件套接线（搜索／只看已解锁／撤销上次解锁）——失败不影响主面板',
  '    try {',
  '      var _srch = mask.querySelector(\'#\' + q(\'search\'));',
  '      var _only = mask.querySelector(\'#\' + q(\'onlyon\'));',
  '      var _undo = mask.querySelector(\'#\' + q(\'undo\'));',
  '      if (_srch) { _srch.addEventListener(\'input\', function () { applyCheckFilter(mask, _only && _only.getAttribute(\'data-on\') === \'1\'); }); }',
  '      if (_only) { _only.addEventListener(\'click\', function () { var on = _only.getAttribute(\'data-on\') === \'1\'; _only.setAttribute(\'data-on\', on ? \'\' : \'1\'); _only.className = \'xshd-gm-btn\' + (on ? \'\' : \' primary\'); applyCheckFilter(mask, !on); }); }',
  '      if (_undo) { _undo.addEventListener(\'click\', function () { undoLastUnlock(mask); }); }',
  '    } catch (e) { /* 忽略 */ }',
  '    // 身份下拉的选项在这里一次性拼好，重渲染时只改 value',
].join('\n');
if (s.includes(ANCHOR3) && !s.includes('玩家易用三件套接线')) { s = s.replace(ANCHOR3, WIRE); log.push('✔ 骨架末尾接线'); }
else log.push(s.includes('玩家易用三件套接线') ? '– 接线已存在' : '✘ 接线锚点未命中');

/* ④ 补两条 CSS（帮助行 / 提示行） */
const ANCHOR4 = "'.xshd-gm-btn.primary{";
const CSS = [
  "'.xshd-gm-help{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:6px 10px;border-top:1px solid #3a2c1a;background:#15110d}',",
  "'.xshd-gm-hint{padding:4px 10px 8px;font-size:11px;line-height:1.6;color:#a8946c;background:#15110d}',",
  "'.xshd-gm-btn.primary{",
].join('\n');
if (s.includes(ANCHOR4) && !s.includes('.xshd-gm-help{')) { s = s.replace(ANCHOR4, CSS); log.push('✔ 补 .xshd-gm-help / .xshd-gm-hint 样式'); }
else log.push(s.includes('.xshd-gm-help{') ? '– 样式已存在' : '✘ 样式锚点未命中');

fs.writeFileSync(F, s, 'utf8');
console.log(log.join('\n'));
