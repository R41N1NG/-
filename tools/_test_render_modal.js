const fs = require('fs');
const content = fs.readFileSync('卡片脚本/状态栏面板.js', 'utf8');

const vm = require('vm');
const domElements = [];
function createMockEl(tag) {
  const el = {
    tagName: tag,
    style: {},
    className: '',
    children: [],
    attributes: {},
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k]; },
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; },
    removeChild(c) {
      const idx = this.children.indexOf(c);
      if (idx >= 0) this.children.splice(idx, 1);
      c.parentNode = null;
    },
    addEventListener(evt, fn) { this['on_' + evt] = fn; },
    removeEventListener() {},
    querySelectorAll() { return []; },
    querySelector() { return null; },
    closest() { return null; }
  };
  domElements.push(el);
  return el;
}

const mockDoc = {
  body: createMockEl('body'),
  head: createMockEl('head'),
  createElement: (t) => createMockEl(t),
  getElementById: () => null,
  querySelectorAll: () => [],
  querySelector: () => null,
  addEventListener: () => {},
  removeEventListener: () => {}
};

const sandbox = {
  console: console,
  document: mockDoc,
  window: {
    addEventListener: () => {},
    innerWidth: 1200,
    innerHeight: 800
  },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  DOC: () => mockDoc
};
sandbox.window.document = mockDoc;
sandbox.window.parent = sandbox.window;
sandbox.window.top = sandbox.window;

vm.createContext(sandbox);

try {
  vm.runInContext(content, sandbox);
  console.log('Script loaded successfully');
  if (sandbox.window.XsdHUD && sandbox.window.XsdHUD.openRelicModal) {
    const relics = ['jiuyouxuanyinxue', 'beimingchaoshengxue', 'lingxitongxin', 'zhuojiuliuyanxue'];
    for (const r of relics) {
      try {
        sandbox.window.XsdHUD.openRelicModal(r);
        console.log('Successfully opened relic modal for:', r);
        // 检查 modal 内容
        const modal = mockDoc.body.children.find(c => c.attributes && c.attributes.id === 'xsd-relic-modal' || c.id === 'xsd-relic-modal');
        if (modal) {
          console.log(`  Modal innerHTML length for ${r}:`, (modal.innerHTML || '').length);
        } else {
          console.error(`  Modal NOT found in doc.body for ${r}!`);
        }
      } catch (err) {
        console.error('FAILED to open:', r, err);
      }
    }
  }
} catch (e) {
  console.error('Error in script:', e);
}
