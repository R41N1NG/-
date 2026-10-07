'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { FLOWER_ROSTER } = require('./flower-roster.cjs');
const MENU_CSS = fs.readFileSync(path.join(__dirname, 'menu.css'), 'utf8');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isImage = value => typeof value === 'string' && (/^data:image\/(?:png|webp|jpeg|gif|avif);base64,/i.test(value) || /^https?:\/\//i.test(value));

function buildMenuHtml({ roster = FLOWER_ROSTER, assets = {}, tokenMap = {}, instanceId = 'xds-opening' } = {}) {
  if (!Array.isArray(roster) || !roster.length) throw new Error('FLOWER_ROSTER 至少需要一位角色');
  if (!/^[a-z][a-z0-9_-]*$/i.test(instanceId)) throw new Error('instanceId 只能使用字母、数字、下划线和连字符，且以字母开头');
  const seen = new Set();
  const attr = escapeHtml;
  function imageAttrs(token, key, kind) {
    const tokenName = String(token).replace(/^\{\{|\}\}$/g, '');
    const direct = isImage(token) ? token : tokenMap[token] || tokenMap[tokenName] || assets.menu?.[tokenName] ||
      (kind === 'portrait' ? assets.lightbox?.[key] || assets.panel?.[key] : assets.relics?.[key]);
    return `data-xds-image="${kind}" data-xds-token="${attr(tokenName)}" data-xds-asset-key="${attr(key)}"${isImage(direct) ? ` src="${attr(direct)}"` : ''}`;
  }
  const cards = roster.map(person => {
    if (!/^[a-z][a-z0-9_-]*$/i.test(person.id) || seen.has(person.id)) throw new Error('角色 id 必须合法且唯一：' + person.id);
    seen.add(person.id);
    return `<article data-xds-flower data-xds-roster-id="${attr(person.id)}" aria-label="${attr(person.name)}">
      <div data-xds-art-state><b>${attr(person.name)}</b><span>仙姿待绘入卷</span></div>
      <img data-xds-art ${imageAttrs(person.image, person.imageKey || person.id, 'portrait')} alt="${attr(person.name)}彩色立绘" loading="lazy" decoding="async">
      <div data-xds-badge title="${attr(person.relicName)} · 图鉴预览" aria-label="${attr(person.relicName)} · 图鉴预览"><span>待</span><img ${imageAttrs(person.relicIcon, person.relicKey || '', 'relic')} alt="${attr(person.relicName)}纹章" loading="lazy" decoding="async"></div>
      <div data-xds-card-info><div data-xds-card-name>${attr(person.name)}</div>${person.title ? `<div data-xds-card-title>${attr(person.title)}</div>` : ''}${person.sect ? `<div data-xds-card-sect>${attr(person.sect)}</div>` : ''}${person.quote ? `<p data-xds-card-quote>${attr(person.quote)}</p>` : ''}</div>
    </article>`;
  }).join('');
  const chips = (field, values) => `<div data-xds-chips>${values.map(value => `<button type="button" data-xds-fill="${field}" data-xds-value="${attr(value)}" aria-pressed="false">${attr(value)}</button>`).join('')}</div>`;
  const field = (name, label, placeholder, max, extra = '') => `<div data-xds-field-box><label data-xds-field-label for="${instanceId}-${name}">${label}</label><input type="text" id="${instanceId}-${name}" name="${name}" data-xds-field="${name}" class="xds-input" placeholder="${attr(placeholder)}" maxlength="${max}" ${extra}></div>`;
  const template = `<style>${MENU_CSS}</style><div class="xds-menu-wrapper" data-xds-menu>
    <input type="radio" class="xds-page-radio" data-xds-page="flower" id="${instanceId}-page-flower" name="${instanceId}-page" checked aria-label="太微百花谱">
    <input type="radio" class="xds-page-radio" data-xds-page="custom" id="${instanceId}-page-custom" name="${instanceId}-page" aria-label="自设问道书卷">
    <div class="xds-view-flower" data-xds-view="flower">
      <header data-xds-heading><div data-xds-eyebrow>揽 芳 卷</div><h2>太微百花谱</h2><p>雾隐仙姿 · 纹章辨器 · 一卷定命途</p></header>
      <div class="xds-flower-carousel" data-xds-carousel tabindex="0" role="region" aria-label="仙姝名录，左右翻阅">${cards}</div>
      <div data-xds-carousel-nav><button type="button" data-xds-carousel-step="-1" aria-label="向左翻阅">‹</button><span>左右翻阅仙姝名录 · 四阶纹章为图鉴预览</span><button type="button" data-xds-carousel-step="1" aria-label="向右翻阅">›</button></div>
      <div data-xds-section-title>择一命途 · 入太微红尘</div>
      <div data-xds-identity-grid>
        <button type="button" class="xds-mbtn" data-xds-entry data-xds-identity="赵无忧"><b>赵无忧</b><small>墨山道六弟子 · 原作主角</small></button>
        <details data-xds-lords><summary data-xds-entry><b>四大殿主 <span aria-hidden="true">⌄</span></b><small>残阳 · 肉山 · 九皇子 · 病相思</small></summary><div data-xds-lord-list><button type="button" data-xds-identity="焚欲殿主">焚欲殿主 · 残阳老怪</button><button type="button" data-xds-identity="欢喜殿主">欢喜殿主 · 肉山佛</button><button type="button" data-xds-identity="浊龙殿主">浊龙殿主 · 九皇子</button><button type="button" data-xds-identity="魂欢殿主">魂欢殿主 · 病相思</button></div></details>
        <label for="${instanceId}-page-custom" class="xds-mbtn" data-xds-entry data-xds-open-custom role="button" tabindex="0"><b>自设命途</b><small>问道问心 · 提笔亲定来历与机缘</small></label>
      </div><p data-xds-status role="status" aria-live="polite"></p>
    </div>
    <div class="xds-view-custom" data-xds-view="custom"><div class="xds-custom-scroll" data-xds-custom-form>
      <label for="${instanceId}-page-flower" data-xds-back role="button" tabindex="0">‹ 返回百花谱</label>
      <header data-xds-heading><div data-xds-eyebrow>自 设 · 问 道 问 心 简</div><h2>提笔定命 · 启卷入世</h2><p>道号、根骨与来处，皆由道友亲书。</p></header>
      <div data-xds-fields>
        ${field('custom_name', '道号尊名', '留空使用当前 Persona 名', 64, 'autocomplete="off"')}
        ${field('custom_gender', '根骨性别', '如：男 / 女 / 自定', 16, 'value="男" autocomplete="off"')}
        ${field('custom_age', '寿数年岁', '如：弱冠之年（20）', 32, 'autocomplete="off"')}
        <div data-xds-field-box><label data-xds-field-label for="${instanceId}-custom_cultivation">境界修为</label><input type="text" class="xds-input" id="${instanceId}-custom_cultivation" name="custom_cultivation" data-xds-field="custom_cultivation" placeholder="如：练气圆满、筑基初期" maxlength="96">${chips('custom_cultivation', ['练气圆满', '筑基初期', '筑基大圆满', '金丹大修'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_sect">入世身份</label><input type="text" class="xds-input" id="${instanceId}-custom_sect" name="custom_sect" data-xds-field="custom_sect" placeholder="宗门、行当或来历，随心填写" maxlength="128">${chips('custom_sect', ['大荒散修', '天枢剑宗弃徒', '墨山道外门散人', '天音阁弄琴客', '欢喜魔门谍客'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_timepoint">当前时点</label><input type="text" class="xds-input" id="${instanceId}-custom_timepoint" name="custom_timepoint" data-xds-field="custom_timepoint" placeholder="留空默认第一章（墨山探幽 · 仙盟历 1578 年 · 三月初三），可自定年月日，如「仙盟历 1579 年 · 六月初七」" maxlength="64">${chips('custom_timepoint', ['正章之前 · 仙盟历 1577 年 · 七月初一', '暗流微澜 · 仙盟历 1577 年 · 十二月初一', '第一章（墨山探幽）· 仙盟历 1578 年 · 三月初三', '南域大劫 · 仙盟历 1578 年 · 八月初一', '天溪兽潮 · 仙盟历 1579 年 · 一月初一', '天溪城破 · 仙盟历 1579 年 · 三月初一', '乱世割据 · 仙盟历 1579 年 · 六月初一', '极乐定局 · 仙盟历 1580 年 · 一月初一'])}</div>
        <div data-xds-field-box="wide"><label data-xds-field-label for="${instanceId}-custom_origin">获取《极乐引》的机缘方式</label><textarea class="xds-textarea" data-xds-field="custom_origin" id="${instanceId}-custom_origin" name="custom_origin" rows="4" maxlength="1800" placeholder="捡得、窃取、夺来、师门密传……写下独属于你的机缘。"></textarea><p data-xds-help>留空采用默认来历；提交会先切换为自设，再将设定发送至当前会话。</p></div>
      </div><button type="button" class="xds-submit-seal" data-xds-action="submit-custom">提笔落款 · 启卷入世</button><p data-xds-status role="status" aria-live="polite"></p>
    </div></div>
  </div>`;
  // 消息 HTML 按一行输出，避免 Showdown 把缩进识别成代码块或插入额外 <br>。
  return template.replace(/\/\*[\s\S]*?\*\//g, '').replace(/>\s+</g, '><').replace(/[\r\n]+\s*/g, ' ').trim();
}

const MENU_HTML = buildMenuHtml();
module.exports = { MENU_HTML, MENU_CSS, FLOWER_ROSTER, buildMenuHtml };

if (require.main === module) fs.writeFileSync(path.join(__dirname, 'MENU_HTML.html'), MENU_HTML, 'utf8');

