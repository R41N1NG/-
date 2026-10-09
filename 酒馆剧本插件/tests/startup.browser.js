'use strict';
const http = require('node:http');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {fixture} = require('./helpers.js');
const imported = JSON.parse(fs.readFileSync('branch_story_tavern_helper_import.json'));
const loader = fs.readFileSync('src/loader.js', 'utf8');
const browserFixture = fixture.toString().replace('host: new Host(root)', 'host: null');
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  if (u.pathname === '/data') { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(imported)); }
  if (u.pathname === '/old-ready') {res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({...imported,content:imported.content.replace(/Branch Story Engine v\d+\.\d+\.\d+/, 'Branch Story Engine v1.4.5')}));}
  if (u.pathname === '/old') { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({type: 'script', content: '/* old version */'})); }
  if (u.pathname === '/plugin.js') { res.setHeader('Content-Type', 'text/javascript'); return res.end(imported.content); }
  if (u.pathname === '/missing' || u.pathname === '/invalid') {
    res.statusCode = u.pathname === '/missing' ? 404 : 200; return res.end('<html>not a plugin</html>');
  }
  const mode = u.searchParams.get('mode') || 'bind';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (u.pathname === '/frame') {
    if (mode === 'csp') res.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-inline'; connect-src 'self'");
    const proxy = `const docProxy = new Proxy(parent.document, {get(target, key) {const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}}); const parentProxy=new Proxy(parent,{get(target,key){if(key==='document')return docProxy;const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}});Object.defineProperty(window,'parent',{get:()=>parentProxy});`;
    const before = `window.module={exports:{}};window.require=()=>{throw Error('不应进入 CommonJS 分支')};` + proxy;
    const code = mode === 'bind' || mode === 'pending' ? `import '/plugin.js';` : `window.__BSE_LOADER_URLS__=${JSON.stringify(mode === 'failed' ? ['/missing', '/invalid'] : mode === 'fallback' ? ['/missing', '/data'] : mode === 'cached-fallback' ? ['/old-ready','/data'] : mode === 'old-fallback' ? ['/old', '/data'] : ['/data'])};${loader}`;
    // Module imports run before module bodies; put host compatibility setup in a preceding classic script.
    return res.end('<html><body><script>' + before + '</script><script type="module">' + code + '</script></body></html>');
  }
  const setup = `const C={clone:v=>JSON.parse(JSON.stringify(v))};const fixture=${browserFixture};window.testHost=fixture();const source=testHost.root;
    window.TavernHelper={_bind:{}};
    for(const [name,value] of Object.entries(source)) if(typeof value==='function') {
      TavernHelper._bind['_'+name]=function(...args){if(this.name!=='TH-script--分支剧本--test')throw Error('接口绑定了错误的窗口');return source[name].apply(source,args);};
    }
    ${mode === 'no-api' ? 'TavernHelper={};' : ''}
    ${mode === 'pending' ? "testHost.storage.script.branch_story_settings={worldbook:'加载中的库'};source.getWorldbook=()=>new Promise(()=>{});" : ''}`;
  res.end('<html><body><script>' + setup + '</script><iframe style="display:none" name="TH-script--分支剧本--test" src="/frame?mode=' + mode + '"></iframe></body></html>');
});
async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless: true, executablePath: process.env.BSE_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox']});
  try {
    for (const mode of ['bind', 'fallback', 'old-fallback', 'cached-fallback', 'failed', 'no-api', 'pending', 'csp']) {
      const page = await browser.newPage({viewport: {width: 390, height: 844}}); const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + '/?mode=' + mode);
      if (mode === 'failed' || mode === 'csp') {
        await page.waitForFunction(() => document.querySelector('iframe').contentWindow.__branch_story_loader_status__?.status === 'error');
        assert(await page.locator('#bse-loader-status').isVisible()); assert((await page.locator('#bse-loader-status').textContent()).includes('加载失败'));
        const message = await page.evaluate(() => document.querySelector('iframe').contentWindow.__branch_story_loader_status__.error);
        if (mode === 'failed') { assert(message.includes('所有下载线路均失败')); assert(message.includes('404')); console.log('✓ 全部下载失败时显示原因，不静默消失'); }
        else { assert(message.includes('unsafe-eval')); console.log('✓ 浏览器阻止动态执行时显示原因'); }
      } else {
        await page.locator('[aria-label="打开剧情面板"]').waitFor();
        if (mode === 'pending') {
          assert.equal(await page.evaluate(() => document.querySelector('iframe').contentWindow.__branch_story_startup__.status), 'loading');
          console.log('✓ 世界书读取尚未完成时，面板入口已显示');
        } else if (mode === 'no-api') {
          await page.waitForFunction(() => document.querySelector('iframe').contentWindow.__branch_story_loader_status__?.status === 'error');
          await page.locator('#bse-loader-status').click();
          assert((await page.locator('.warn.error').textContent()).includes('getVariables')); console.log('✓ 缺少酒馆助手接口时显示启动错误');
        } else {
          await page.waitForFunction(() => document.querySelector('iframe').contentWindow.__branch_story_startup__?.status === 'ready');
          await page.locator('[aria-label="打开剧情面板"]').click(); await page.locator('[data-action="toggle-enabled"]').click();
          assert(await page.evaluate(() => testHost.root.injection[0].content.includes('停电发生')));
          if (mode === 'fallback' || mode === 'old-fallback' || mode === 'cached-fallback') {
            assert.equal(await page.evaluate(() => document.querySelector('iframe').contentWindow.__branch_story_loader_status__.attempts.length), 2);
            assert.equal(await page.locator('#bse-loader-status').count(), 0); console.log('✓ 主线路失败或旧缓存后通过备用线路加载');
          } else console.log('✓ namespace _bind、隐藏 iframe、父页面代理和 browser module 全局兼容');
        }
        await page.evaluate(() => document.querySelector('iframe').contentWindow.__branch_story_plugin__.destroy());
        assert.equal(await page.locator('#bse-panel-host').count(), 0);
      }
      assert.deepEqual(errors, []); await page.close();
    }
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
