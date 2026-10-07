import { readFileSync, writeFileSync } from 'node:fs';

const TPL_PATH = '卡片脚本/_src/状态栏面板.模板.js';
const DATA_PATH = '卡片脚本/_src/名器图鉴数据.json';

const stagesData = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
const minifiedStagesData = JSON.stringify(stagesData);

let content = readFileSync(TPL_PATH, 'utf8');

// 构造要注入的代码块
const codeToInject = `
  /** 13 件名器 1-4 阶段精炼神韵数据库（用于 Hover 气泡与全景玄鉴画卷） */
  const XSD_RELIC_STAGES = ${minifiedStagesData};

  let activePopover = null;
  let popoverTimer = null;

  function xsdHideRelicPopover() {
    if (popoverTimer) clearTimeout(popoverTimer);
    popoverTimer = setTimeout(() => {
      if (activePopover && activePopover.parentNode) {
        activePopover.parentNode.removeChild(activePopover);
      }
      activePopover = null;
    }, 160);
  }

  function xsdShowRelicPopover(targetBox, rel, st) {
    if (popoverTimer) clearTimeout(popoverTimer);
    const doc = (targetBox && targetBox.ownerDocument) || (typeof DOC === 'function' ? DOC() : document);
    if (!doc || !doc.body) return;
    if (activePopover && activePopover.parentNode) {
      activePopover.parentNode.removeChild(activePopover);
      activePopover = null;
    }

    const data = XSD_RELIC_STAGES[rel.id] || {
      name: rel.n,
      carrier: '仙姝',
      type: '绝品名器',
      stages: {}
    };

    const pop = doc.createElement('div');
    pop.className = 'xh-relic-popover';
    
    // 计算位置（视口左右智能躲避）
    const rect = targetBox.getBoundingClientRect();
    const win = doc.defaultView || window;
    const winW = win.innerWidth || 1000;
    const isLeft = rect.left < winW / 2;
    const scrollX = win.pageXOffset || (doc.documentElement && doc.documentElement.scrollLeft) || 0;
    const scrollY = win.pageYOffset || (doc.documentElement && doc.documentElement.scrollTop) || 0;
    
    pop.style.top = Math.max(10, rect.top + scrollY - 20) + 'px';
    if (isLeft) {
      pop.style.left = (rect.right + scrollX + 12) + 'px';
    } else {
      pop.style.left = Math.max(10, rect.left + scrollX - 355) + 'px';
    }

    let ownerHtml = '';
    if (st.state === 'self') {
      ownerHtml = '<div class="pop-owner">● 目前归属者：' + esc(st.owner || '你') + '（契约认主）</div>';
    } else if (st.state === 'other') {
      ownerHtml = '<div class="pop-owner other">● 目前归属者：' + esc(st.owner) + '（已被占据）</div>';
    } else {
      ownerHtml = '<div class="pop-owner none">○ 未出世 · 无人获得</div>';
    }

    let barsHtml = '';
    for (let i = 1; i <= rel.a; i++) {
      barsHtml += '<div class="stage-bar ' + (i <= st.arcs ? 'reached' : '') + '"></div>';
    }

    // 当前阶段核心神韵
    let cscHtml = '';
    const curStage = data.stages && data.stages[st.arcs || 1];
    if (st.state !== 'none' && curStage) {
      cscHtml = '<div class="current-stage-card">'
        + '<div class="csc-title"><span>【第' + XSD_RELIC_CN[st.arcs] + '阶段 · ' + esc(curStage.name || '境界') + '】</span><span style="color:#4ade80;font-size:10px;">已激活</span></div>'
        + '<div class="csc-text">' + esc(curStage.desc) + '</div>'
        + '</div>';
    } else {
      cscHtml = '<div class="current-stage-card">'
        + '<div class="csc-title"><span style="color:#9ca3af">【尚未成形】</span><span style="color:#9ca3af;font-size:10px;">未觉醒</span></div>'
        + '<div class="csc-text">' + esc(data.brief || '名器天生神秀，待红尘机缘与元阴破除后始现峥嵘。') + '</div>'
        + '</div>';
    }

    // 后续锁闭阶段
    let lockedHtml = '';
    for (let i = (st.state === 'none' ? 1 : st.arcs + 1); i <= rel.a; i++) {
      const sObj = data.stages && data.stages[i];
      const sName = sObj ? sObj.name : ('第' + XSD_RELIC_CN[i] + '阶段');
      lockedHtml += '<div class="locked-item"><span>' + esc(sName) + '</span><span>🔒 锁闭</span></div>';
    }

    const imgUrl = xsdRelicUrl(rel.id) || ('user/images/xsd_relics/' + rel.id + '.jpg');
    let filterStyle = (st.state === 'other') ? 'filter:invert(1) contrast(1.15);' : (st.state === 'none' ? 'filter:grayscale(1) brightness(.5);' : '');

    pop.innerHTML = '<div class="pop-header">'
      + '<div class="pop-avatar" style="background-image:url(\\'' + imgUrl + '\\');' + filterStyle + '"></div>'
      + '<div class="pop-titles">'
      + '<div class="pop-name"><span>' + esc(rel.n) + '</span><span class="pop-badge">' + esc(data.carrier) + ' · ' + esc(data.type) + '</span></div>'
      + ownerHtml
      + '</div>'
      + '</div>'
      + '<div class="pop-stages">' + barsHtml + '</div>'
      + cscHtml
      + (lockedHtml ? '<div class="locked-stages">' + lockedHtml + '</div>' : '')
      + '<div class="pop-footer">✦ 点击纹章展开「全景名器玄鉴」画卷</div>';

    pop.addEventListener('mouseenter', () => { if (popoverTimer) clearTimeout(popoverTimer); });
    pop.addEventListener('mouseleave', () => xsdHideRelicPopover());
    pop.addEventListener('click', (e) => { e.stopPropagation(); xsdHideRelicPopover(); xsdOpenRelicModal(rel.id); });

    doc.body.appendChild(pop);
    activePopover = pop;
  }

  let activeModal = null;

  function xsdCloseRelicModal() {
    if (activeModal && activeModal.parentNode) {
      activeModal.parentNode.removeChild(activeModal);
    }
    activeModal = null;
  }

  function xsdOpenRelicModal(relicId) {
    xsdHideRelicPopover();
    const doc = (typeof DOC === 'function' ? DOC() : null) || document;
    if (!doc || !doc.body) return;
    if (activeModal && activeModal.parentNode) {
      activeModal.parentNode.removeChild(activeModal);
      activeModal = null;
    }

    const curRel = XSD_RELICS.find(r => r.id === relicId) || XSD_RELICS[0];
    const stat = xsdStatData() || {};
    const known = stat.known || xsdKnown() || {};
    const idStr = (stat && stat.身份) || '赵无忧';
    const customOwners = (stat && (stat.名器归属 || stat.relic_owners)) || null;

    const modal = doc.createElement('div');
    modal.id = 'xsd-relic-modal';

    const renderInner = (relObj) => {
      const st = xsdRelicState(relObj, known, idStr, customOwners);
      const data = XSD_RELIC_STAGES[relObj.id] || { name: relObj.n, carrier: '仙姝', type: '绝品名器', stages: {} };
      const imgUrl = xsdRelicUrl(relObj.id) || ('user/images/xsd_relics/' + relObj.id + '.jpg');
      let filterStyle = (st.state === 'other') ? 'filter:invert(1) contrast(1.15);' : (st.state === 'none' ? 'filter:grayscale(1) brightness(.5);' : '');

      let tabsHtml = '';
      XSD_RELICS.forEach(r => {
        const rSt = xsdRelicState(r, known, idStr, customOwners);
        let cls = 'relic-tab';
        if (r.id === relObj.id) cls += ' active';
        else if (rSt.state === 'other') cls += ' other';
        tabsHtml += '<div class="' + cls + '" data-tab-id="' + r.id + '">' + (rSt.state === 'self' ? '● ' : (rSt.state === 'other' ? '▲ ' : '○ ')) + esc(r.n) + '</div>';
      });

      let ownerBadge = '';
      if (st.state === 'self') {
        ownerBadge = '<div class="owner-badge">✦ 目前烙印归属：' + esc(st.owner || '你') + '（契约认主）</div>';
      } else if (st.state === 'other') {
        ownerBadge = '<div class="owner-badge other">▲ 目前烙印归属：' + esc(st.owner) + '（已被占据）</div>';
      } else {
        ownerBadge = '<div class="owner-badge none">○ 尚未成形 · 无人获得</div>';
      }

      let gridHtml = '';
      for (let i = 1; i <= relObj.a; i++) {
        const isReached = (st.state !== 'none') && (i <= st.arcs);
        const sObj = (data.stages && data.stages[i]) || { name: '第' + XSD_RELIC_CN[i] + '境界', desc: '', lock: '' };
        gridHtml += '<div class="stage-card ' + (isReached ? 'unlocked' : 'locked') + '">'
          + '<span class="sc-badge">第' + XSD_RELIC_CN[i] + '境界</span>'
          + '<div class="sc-title">' + esc(sObj.name) + '</div>'
          + '<span class="sc-status-pill">' + (isReached ? '已觉醒' : '🔒 锁闭') + '</span>'
          + '<div class="sc-field-title">【玄妙体征】</div>'
          + '<div class="sc-field-text">' + esc(sObj.desc || data.brief || '体质神秀，深不可测。') + '</div>'
          + (isReached ? '' : ('<div class="sc-lock-hint"><b>解锁机缘：</b>' + esc(sObj.lock || '随天道气运突破') + '</div>'))
          + '</div>';
      }

      return '<div class="modal-wrap">'
        + '<div class="modal-header">'
        + '<div class="header-left">'
        + '<div class="relic-emblem" style="background-image:url(\\'' + imgUrl + '\\');' + filterStyle + '"></div>'
        + '<div class="title-group">'
        + '<h1><span>仙姝墮 · 名器玄鉴</span><span style="font-size:12px;font-weight:400;color:#d4af37;border:1px solid rgba(212,175,55,.3);padding:1px 6px;border-radius:3px;">' + esc(data.type) + '</span></h1>'
        + '<div class="title-sub">载体宿主：' + esc(data.carrier) + ' · ' + esc(relObj.n) + '</div>'
        + '</div>'
        + '</div>'
        + '<div class="header-right">'
        + ownerBadge
        + '<div class="close-btn" data-modal-close="1">✕</div>'
        + '</div>'
        + '</div>'
        + '<div class="relic-tabs">' + tabsHtml + '</div>'
        + '<div class="stages-grid">' + gridHtml + '</div>'
        + '<div class="modal-footer">'
        + '<div>✦ 名器 1-4 阶段已并入玄鉴图鉴 · 点击标签即可自由翻阅</div>'
        + '<div>按 ESC 键或点击遮罩关闭</div>'
        + '</div>'
        + '</div>';
    };

    modal.innerHTML = renderInner(curRel);

    modal.addEventListener('click', (e) => {
      const target = e.target;
      if (target === modal || target.closest('[data-modal-close]')) {
        xsdCloseRelicModal();
        return;
      }
      const tab = target.closest('[data-tab-id]');
      if (tab) {
        const nextId = tab.getAttribute('data-tab-id');
        const nextRel = XSD_RELICS.find(r => r.id === nextId);
        if (nextRel) modal.innerHTML = renderInner(nextRel);
      }
    });

    const onKey = (e) => {
      if (e.key === 'Escape') {
        xsdCloseRelicModal();
        doc.removeEventListener('keydown', onKey);
      }
    };
    doc.addEventListener('keydown', onKey);

    doc.body.appendChild(modal);
    activeModal = modal;
  }
`;

// 找到 `/** 把两翼纹章栏装到面板两侧` 之前插入
const mark = '/** 把两翼纹章栏装到面板两侧';
if (!content.includes(mark)) {
  console.error('未找到注入标记:', mark);
  process.exit(1);
}

content = content.replace(mark, codeToInject + '\n  ' + mark);

// 更新 xsdRenderRails 内部每个 box 的事件绑定
const targetBoxRender = `        box.setAttribute('title', tipTitle);

        const img = doc.createElement('div');
        img.className = 'xh-relic-img';
        img.setAttribute('title', tipTitle);
        let filterStyle = '';
        if (st.state === 'self') {
          filterStyle = ''; // 原色点亮
        } else if (st.state === 'other') {
          filterStyle = 'filter:invert(1) contrast(1.15);'; // 从原色改为反色！
        } else {
          filterStyle = 'filter:grayscale(1) brightness(.5);opacity:0.6;'; // 无人获得为灰色
        }
        img.setAttribute('style', 'background-image:url("' + (xsdRelicUrl(rel.id) || ('user/images/xsd_relics/' + rel.id + '.jpg')) + '");' + filterStyle);
        box.appendChild(img);

        const holder = doc.createElement('div');
        holder.setAttribute('style', 'position:absolute;inset:0;pointer-events:none;');
        holder.innerHTML = xsdRelicSvg(rel, st);
        box.appendChild(holder);
        (i < 7 ? l : r).appendChild(box);`;

const newBoxRender = `        box.setAttribute('title', tipTitle);
        box.style.cursor = 'pointer';

        // 方案 A 悬停气泡与方案 B 点击弹窗接线
        box.addEventListener('mouseenter', () => xsdShowRelicPopover(box, rel, st));
        box.addEventListener('mouseleave', () => xsdHideRelicPopover());
        box.addEventListener('click', (e) => {
          e.stopPropagation();
          xsdHideRelicPopover();
          xsdOpenRelicModal(rel.id);
        });

        const img = doc.createElement('div');
        img.className = 'xh-relic-img';
        img.setAttribute('title', tipTitle);
        let filterStyle = '';
        if (st.state === 'self') {
          filterStyle = ''; // 原色点亮
        } else if (st.state === 'other') {
          filterStyle = 'filter:invert(1) contrast(1.15);'; // 从原色改为反色！
        } else {
          filterStyle = 'filter:grayscale(1) brightness(.5);opacity:0.6;'; // 无人获得为灰色
        }
        img.setAttribute('style', 'background-image:url("' + (xsdRelicUrl(rel.id) || ('user/images/xsd_relics/' + rel.id + '.jpg')) + '");' + filterStyle);
        box.appendChild(img);

        const holder = doc.createElement('div');
        holder.setAttribute('style', 'position:absolute;inset:0;pointer-events:none;');
        holder.innerHTML = xsdRelicSvg(rel, st);
        box.appendChild(holder);
        (i < 7 ? l : r).appendChild(box);`;

if (!content.includes(targetBoxRender)) {
  console.error('未找到 targetBoxRender');
  process.exit(1);
}

content = content.replace(targetBoxRender, newBoxRender);

// 全局 API 暴露
const apiHook = `    put('xsdPortrait', XSD_PORTRAIT_API);`;
const newApiHook = `    put('xsdPortrait', XSD_PORTRAIT_API);
    put('xsdOpenRelicModal', xsdOpenRelicModal);
    put('xsdCloseRelicModal', xsdCloseRelicModal);`;

if (content.includes(apiHook)) {
  content = content.replace(apiHook, newApiHook);
}

// 全局委托监听点击
const clickHook = `      D.addEventListener('click', xsdPortraitClick, true);`;
const newClickHook = `      D.addEventListener('click', xsdPortraitClick, true);
      D.addEventListener('click', function(e) {
        const relicEl = e.target && e.target.closest && e.target.closest('[data-xds-relic]');
        if (relicEl) {
          const rid = relicEl.getAttribute('data-xds-relic');
          if (rid) {
            e.stopPropagation();
            xsdOpenRelicModal(rid);
          }
        }
      }, true);`;

if (content.includes(clickHook)) {
  content = content.replace(clickHook, newClickHook);
}

writeFileSync(TPL_PATH, content, 'utf8');
console.log('✅ 模板已成功打入 A+B 交互逻辑:', TPL_PATH);
