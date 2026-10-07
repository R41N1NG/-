const fs = require('fs');

const tplPath = '卡片脚本/_src/状态栏面板.模板.js';
const dataPath = '卡片脚本/_src/名器图鉴数据.json';

const stagesData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const minified = JSON.stringify(stagesData);

let content = fs.readFileSync(tplPath, 'utf8');

// 1. 同步最新的 XSD_RELIC_STAGES
const stagesRegex = /const XSD_RELIC_STAGES = \{[\s\S]*?\};/;
content = content.replace(stagesRegex, `const XSD_RELIC_STAGES = ${minified};`);

// 2. 彻底修正 xsdOpenRelicModal 逻辑：
// 增加 ensureStyleInjected、内联样式兜底、锁闭阶段严格防剧透
const oldModalFuncRegex = /function xsdOpenRelicModal\(relicId\) \{[\s\S]*?activeModal = modal;\s*\}/;

const newModalFunc = `function xsdOpenRelicModal(relicId) {
    xsdHideRelicPopover();
    const doc = (typeof DOC === 'function' ? DOC() : null) || document;
    if (!doc || !doc.body) return;
    try { if (typeof ensureStyleInjected === 'function') ensureStyleInjected(doc); } catch (e) {}
    try { if (typeof document !== 'undefined' && document !== doc && typeof ensureStyleInjected === 'function') ensureStyleInjected(document); } catch (e) {}

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
    // 行内绝对强保样式：哪怕宿主外部CSS加载延迟或被吞，也绝对居中浮于最顶层
    modal.style.cssText = 'position:fixed!important;inset:0!important;background:rgba(0,0,0,0.85)!important;backdrop-filter:blur(6px)!important;z-index:9999999!important;display:flex!important;justify-content:center!important;align-items:center!important;padding:20px!important;box-sizing:border-box!important;';

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
        ownerBadge = '<div class="owner-badge none">○ 尚未出世 · 无人获得</div>';
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
          + '<div class="sc-field-text">' + esc(isReached ? (sObj.desc || data.brief) : '【天机未启】玄妙道机隐于混沌阴阳之间，待双修火候与天道机缘突破方可显化。') + '</div>'
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
        + '<div>✦ 名器 1-4 阶段已并入玄鉴画卷 · 点击标签即可自由翻阅全器</div>'
        + '<div>按 ESC 键或点击遮罩关闭</div>'
        + '</div>'
        + '</div>';
    };

    modal.innerHTML = renderInner(curRel);

    const handleModalInteraction = (e) => {
      const target = e.target;
      if (target === modal || (target.closest && target.closest('[data-modal-close]'))) {
        e.stopPropagation();
        xsdCloseRelicModal();
        return;
      }
      const tab = target.closest && target.closest('[data-tab-id]');
      if (tab) {
        e.stopPropagation();
        const nextId = tab.getAttribute('data-tab-id');
        const nextRel = XSD_RELICS.find(r => r.id === nextId);
        if (nextRel) modal.innerHTML = renderInner(nextRel);
      }
    };

    modal.addEventListener('click', handleModalInteraction);
    modal.addEventListener('pointerup', handleModalInteraction);

    const onKey = (e) => {
      if (e.key === 'Escape') {
        xsdCloseRelicModal();
        doc.removeEventListener('keydown', onKey);
      }
    };
    doc.addEventListener('keydown', onKey);

    doc.body.appendChild(modal);
    activeModal = modal;
    console.log(TAG, '[玄鉴画卷] 已成功展开名器画卷:', relicId);
  }`;

if (oldModalFuncRegex.test(content)) {
  content = content.replace(oldModalFuncRegex, newModalFunc);
} else {
  console.error('未找到 oldModalFuncRegex！');
  process.exit(1);
}

// 3. 增强 box 与 popover 的事件监听：同时绑定 click, pointerup, mouseup
content = content.replace(
  `        box.addEventListener('click', (e) => {\n          e.stopPropagation();\n          xsdHideRelicPopover();\n          xsdOpenRelicModal(rel.id);\n        });`,
  `        const triggerOpen = (e) => {\n          if (e) { e.stopPropagation(); try { e.preventDefault(); } catch(err){} }\n          xsdHideRelicPopover();\n          xsdOpenRelicModal(rel.id);\n        };\n        box.addEventListener('click', triggerOpen);\n        box.addEventListener('pointerup', triggerOpen);\n        box.addEventListener('mouseup', triggerOpen);`
);

content = content.replace(
  `    pop.addEventListener('click', (e) => { e.stopPropagation(); xsdHideRelicPopover(); xsdOpenRelicModal(rel.id); });`,
  `    const triggerPopOpen = (e) => { if (e) e.stopPropagation(); xsdHideRelicPopover(); xsdOpenRelicModal(rel.id); };\n    pop.addEventListener('click', triggerPopOpen);\n    pop.addEventListener('pointerup', triggerPopOpen);\n    pop.addEventListener('mouseup', triggerPopOpen);`
);

// 4. 增强 wirePortrait 委托：同时监听 click, pointerup, mouseup
const oldWireDelegate = `      D.addEventListener('click', function(e) {\n        const relicEl = e.target && e.target.closest && e.target.closest('[data-xds-relic]');\n        if (relicEl) {\n          const rid = relicEl.getAttribute('data-xds-relic');\n          if (rid) {\n            e.stopPropagation();\n            try {\n              if (typeof window !== 'undefined' && window.XsdHUD && window.XsdHUD.openRelicModal) window.XsdHUD.openRelicModal(rid);\n              else if (typeof window !== 'undefined' && window.xsdOpenRelicModal) window.xsdOpenRelicModal(rid);\n            } catch (err) {}\n          }\n        }\n      }, true);`;

const newWireDelegate = `      const onRelicDelegate = function(e) {\n        const relicEl = e.target && e.target.closest && (e.target.closest('[data-xds-relic]') || e.target.closest('.xh-relic-popover'));\n        if (relicEl) {\n          let rid = relicEl.getAttribute('data-xds-relic');\n          if (!rid && relicEl.querySelector) {\n            const child = relicEl.querySelector('[data-xds-relic]');\n            if (child) rid = child.getAttribute('data-xds-relic');\n          }\n          if (rid) {\n            e.stopPropagation();\n            try {\n              if (typeof xsdOpenRelicModal === 'function') xsdOpenRelicModal(rid);\n              else if (typeof window !== 'undefined' && window.XsdHUD && window.XsdHUD.openRelicModal) window.XsdHUD.openRelicModal(rid);\n              else if (typeof window !== 'undefined' && window.xsdOpenRelicModal) window.xsdOpenRelicModal(rid);\n            } catch (err) {}\n          }\n        }\n      };\n      D.addEventListener('click', onRelicDelegate, true);\n      D.addEventListener('pointerup', onRelicDelegate, true);\n      D.addEventListener('mouseup', onRelicDelegate, true);`;

if (content.includes(oldWireDelegate)) {
  content = content.replace(oldWireDelegate, newWireDelegate);
} else {
  console.log('oldWireDelegate 未完全匹配，采用正则替换');
  content = content.replace(/D\.addEventListener\('click',\s*function\(e\)\s*\{\s*const relicEl = e\.target &&[\s\S]*?\}, true\);/, newWireDelegate);
}

// 5. 挂载到所有全局
content = content.replace(
  `w.xsdOpenRelicModal = (id) => (XsdHUD.openRelicModal && XsdHUD.openRelicModal(id));`,
  `w.xsdOpenRelicModal = (id) => (typeof xsdOpenRelicModal === 'function' ? xsdOpenRelicModal(id) : (XsdHUD.openRelicModal && XsdHUD.openRelicModal(id)));`
);

fs.writeFileSync(tplPath, content, 'utf8');
console.log('✅ 模板逻辑更新成功（多重事件监听 + 样式强保 + 彻底去剧透）！');
