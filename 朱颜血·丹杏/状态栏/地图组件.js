/* gpt下级：地理只读视图；信源仅为原卡 character_book.entries[2]。 */
(() => {
  'use strict';
  const mounted = new WeakMap();
  let serial = 0;
  const macroNodes = [
    { id: 'luoxiao', label: '罗霄山脉', x: 20, y: 8, info: '江西境内的罗霄山脉，罗霄派总坛所在。原图由官道连至长宁县城。' },
    { id: 'changning', label: '长宁县城', x: 20, y: 25, info: '江西赣州府长宁县城。向南由官道转山路通往神仙岭。悦来客栈归入县城节点，不另推定城内街巷。' },
    { id: 'wuping', label: '武平／武平所', x: 80, y: 25, info: '福建汀州府武平县城、武平所。原图向西以偏僻山路连接神仙岭。' },
    { id: 'shenxian', label: '神仙岭', x: 50, y: 42, info: '三省交汇处的群山隘道，连接江西、福建与广东方向的山路。' },
    { id: 'xinghua', label: '杏花村客栈', x: 50, y: 58, info: '神仙岭下的孤栈。往东南翻越山梁可至豺狼坡；另有往广东方向的偏僻山径。' },
    { id: 'pass', label: '险道隘口', x: 20, y: 74, info: '杏花村通往广东方向的偏僻山径、落石隘口。这里只标地形，不列伏击或人物事件。' },
    { id: 'prison', label: '豺狼坡黑狱', x: 80, y: 74, info: '豺狼坡山涧废庙建筑群；原图以东南山道通往平远方向。可切换“豺狼坡分区”查看建筑示意。' },
    { id: 'south', label: '龙源／潮州／韶州', x: 20, y: 91, info: '原宏观图合列的南向官道区域，继续以大路通往广州。此节点不表示三地重合或相互距离。' },
    { id: 'guangzhou', label: '广州省城', x: 50, y: 91, info: '广东省城。原图由龙源、潮州、韶州方向的大路出省相连。' },
    { id: 'pingyuan', label: '平远县城', x: 80, y: 91, info: '原图位于豺狼坡东南山道方向的边陲县城。' },
  ];
  const macroEdges = [
    ['luoxiao', 'changning'], ['changning', 'shenxian'], ['wuping', 'shenxian'],
    ['shenxian', 'xinghua'], ['xinghua', 'prison'], ['xinghua', 'pass'],
    ['pass', 'south'], ['south', 'guangzhou'], ['prison', 'pingyuan'],
  ];
  const localNodes = [
    { id: 'rear', label: '后院生活区', x: 50, y: 10, info: '后院生活区，原平面图列有东西厢房、老杨树与石桌石凳，通过后院门与正殿相连。' },
    { id: 'documents', label: '东厢文牍房', x: 18, y: 32, info: '正殿侧厢的文牍房。位置沿用原图左右排布，不另校定实际朝向。' },
    { id: 'hall', label: '正殿公堂', x: 50, y: 32, info: '原庙大雄宝殿改作公堂，侧有文牍房与耳房；原图上下分别标示后院门及穿堂甬道。' },
    { id: 'side', label: '西厢耳房', x: 82, y: 32, info: '原平面图列于公堂侧面的西厢耳房。这里只展示建筑分区。' },
    { id: 'cells', label: '地上监舍', x: 50, y: 55, info: '地上监舍大通牢，原图列有厚石墙及木栅监牢，位于正殿下方的分区。' },
    { id: 'water', label: '地下水牢', x: 50, y: 73, secret: true, info: '原图所列的地下铁笼水牢，连接狭窄石阶甬道。这里不记录关押者或事件。' },
    { id: 'gate', label: '山门／前院', x: 50, y: 91, info: '山门外院与前院天井分区，原图标有石砌围墙、重木门与门栓。未标出的通行方式不推定。' },
  ];
  const localEdges = [['rear', 'hall'], ['documents', 'hall'], ['hall', 'side'], ['hall', 'cells'], ['cells', 'water'], ['water', 'gate']];

  function locate(location) {
    const explicitPrison = /豺狼坡|废庙|黑狱/.test(location);
    const otherPlace = /杏花村|神仙岭|长宁|悦来客栈|罗霄|武平|平远|广州|潮州|韶州|龙源/.test(location);
    const prisonContext = explicitPrison || (!otherPlace && /公堂|正殿|山门|前院|监舍|牢舍|后院|地下|水牢/.test(location));
    let local = null;
    if (prisonContext) {
      if (/地下|水牢/.test(location)) local = 'water';
      else if (/文牍/.test(location)) local = 'documents';
      else if (/刑讯耳房|西厢耳房/.test(location)) local = 'side';
      else if (/公堂|正殿/.test(location)) local = 'hall';
      else if (/监舍|牢舍|通牢/.test(location)) local = 'cells';
      else if (/后院/.test(location)) local = 'rear';
      else if (/山门|前院/.test(location)) local = 'gate';
    }
    let macro = null;
    if (prisonContext) macro = 'prison';
    else if (/悦来客栈|长宁/.test(location)) macro = 'changning';
    else if (/杏花村/.test(location)) macro = 'xinghua';
    else if (/神仙岭/.test(location)) macro = 'shenxian';
    else if (/罗霄/.test(location)) macro = 'luoxiao';
    else if (/武平/.test(location)) macro = 'wuping';
    else if (/平远/.test(location)) macro = 'pingyuan';
    else if (/广州/.test(location)) macro = 'guangzhou';
    else if (/龙源|潮州|韶州/.test(location)) macro = 'south';
    else if (/隘口|落石/.test(location)) macro = 'pass';
    return { macro, local };
  }

  function mount(dialog, options = {}) {
    if (!dialog || dialog.tagName !== 'DIALOG' || typeof dialog.close !== 'function') throw new TypeError('ZYXMapPanel.mount requires a native dialog');
    mounted.get(dialog)?.dispose();
    const doc = dialog.ownerDocument;
    const location = String(options.location ?? '').trim();
    const identity = String(options.identity ?? '');
    const visibleWater = /地下|水牢/.test(location) || /黑狱恶差|黑狱差役/.test(identity);
    const current = locate(location);
    const id = 'zyx-map-' + (++serial);
    const cleanups = [];
    let disposed = false;
    function node(tag, className, text) {
      const el = doc.createElement(tag);
      if (className) el.className = className;
      if (text !== undefined) el.textContent = text;
      return el;
    }
    function listen(el, type, callback) {
      el.addEventListener(type, callback);
      cleanups.push(() => el.removeEventListener(type, callback));
    }
    function button(label, className) {
      const el = node('button', className, label);
      el.type = 'button';
      return el;
    }
    function close() { if (dialog.open) dialog.close(); }
    dialog.setAttribute('data-map-dialog', '');
    dialog.setAttribute('aria-labelledby', id + '-title');
    const shell = node('div', 'zyx-map-shell');
    const head = node('header', 'zyx-map-head');
    const title = node('h2', '', '山川与狱署舆图');
    title.id = id + '-title';
    const closeButton = button('关闭地图', 'zyx-map-close');
    head.append(title, closeButton);
    shell.append(head, node('p', 'zyx-map-current', '当前地点：' + (location || '未提供地点')));
    const tabs = node('div', 'zyx-map-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', '地图范围');
    shell.append(tabs);
    const pages = [];
    const definitions = [
      { key: 'macro', label: '三省地界', nodes: macroNodes, edges: macroEdges },
      { key: 'local', label: '豺狼坡分区', nodes: localNodes.filter(n => !n.secret || visibleWater), edges: localEdges },
    ];
    for (const definition of definitions) {
      const tab = button(definition.label, 'zyx-map-tab');
      tab.id = id + '-tab-' + definition.key;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', id + '-page-' + definition.key);
      const pane = node('section', 'zyx-map-page');
      pane.id = id + '-page-' + definition.key;
      pane.setAttribute('role', 'tabpanel');
      pane.setAttribute('aria-labelledby', tab.id);
      pane.tabIndex = 0;
      const board = node('div', 'zyx-map-board');
      board.setAttribute('role', 'group');
      board.setAttribute('aria-label', definition.label + '地点');
      const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 1000 1000');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      const lookup = new Map(definition.nodes.map(n => [n.id, n]));
      for (const [from, to] of definition.edges) {
        const a = lookup.get(from), b = lookup.get(to);
        if (!a || !b) continue;
        const path = doc.createElementNS(svg.namespaceURI, 'path');
        path.setAttribute('d', `M ${a.x * 10} ${a.y * 10} L ${b.x * 10} ${b.y * 10}`);
        path.setAttribute('class', to === 'pingyuan' ? 'zyx-map-road zyx-map-road-minor' : 'zyx-map-road');
        svg.append(path);
      }
      board.append(svg);
      const info = node('section', 'zyx-map-info');
      info.setAttribute('aria-live', 'polite');
      const infoTitle = node('h3');
      const infoBody = node('p');
      info.append(infoTitle, infoBody);
      const buttons = new Map();
      function select(place) {
        for (const [key, control] of buttons) control.setAttribute('aria-pressed', String(key === place?.id));
        infoTitle.textContent = place ? place.label : '地点说明';
        infoBody.textContent = place ? place.info : '点击地图地点查看地理说明。';
      }
      for (const place of definition.nodes) {
        const control = button(place.label, 'zyx-map-place');
        control.dataset.mapNode = place.id;
        control.style.setProperty('--map-x', place.x + '%');
        control.style.setProperty('--map-y', place.y + '%');
        if (place.id === current[definition.key]) {
          control.setAttribute('aria-current', 'location');
          control.append(node('small', '', '所在'));
        }
        listen(control, 'click', event => { event.preventDefault(); event.stopPropagation(); select(place); });
        buttons.set(place.id, control);
        board.append(control);
      }
      select(lookup.get(current[definition.key]));
      pane.append(board, info);
      if (definition.key === 'local') pane.append(node('p', 'zyx-map-note', '分区及左右排布沿用卡内平面示意；未列出的门路不推定。'));
      tabs.append(tab);
      shell.append(pane);
      pages.push({ key: definition.key, tab, pane });
    }
    shell.append(node('p', 'zyx-map-note', '路线为拓扑示意，不按比例。点选只查看地点说明。'));
    function activate(key, focus = false) {
      for (const page of pages) {
        const active = page.key === key;
        page.pane.hidden = !active;
        page.tab.setAttribute('aria-selected', String(active));
        page.tab.tabIndex = active ? 0 : -1;
        if (active && focus) page.tab.focus();
      }
    }
    for (const [index, page] of pages.entries()) {
      listen(page.tab, 'click', event => { event.preventDefault(); event.stopPropagation(); activate(page.key); });
      listen(page.tab, 'keydown', event => {
        const target = event.key === 'Home' ? 0 : event.key === 'End' ? pages.length - 1 : event.key === 'ArrowRight' ? (index + 1) % pages.length : event.key === 'ArrowLeft' ? (index + pages.length - 1) % pages.length : null;
        if (target === null) return;
        event.preventDefault();
        event.stopPropagation();
        activate(pages[target].key, true);
      });
    }
    activate(current.local ? 'local' : 'macro');
    dialog.replaceChildren(shell);
    listen(closeButton, 'click', event => { event.preventDefault(); event.stopPropagation(); close(); });
    listen(dialog, 'cancel', event => { event.preventDefault(); close(); });
    listen(dialog, 'click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
    });
    const handle = { dispose() {
      if (disposed) return;
      disposed = true;
      for (const cleanup of cleanups.splice(0)) cleanup();
      if (mounted.get(dialog) === handle) mounted.delete(dialog);
    } };
    mounted.set(dialog, handle);
    return handle;
  }
  window.ZYXMapPanel = Object.freeze({ mount });
})();
