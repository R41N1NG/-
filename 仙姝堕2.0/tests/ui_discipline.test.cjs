'use strict';
// 前端纪律：html 转义模板助手行为 ＋ innerHTML 模板串必须经 html` 的静态把关
const { test } = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { html } = require('../src/ui/dom');

test('html 助手插值自动转义，html.raw 显式放行', () => {
  assert.equal(html`<i>${"<b>&x"}</i>`, '<i>&lt;b&gt;&amp;x</i>');
  assert.equal(html`<i>${html.raw("<b>已核</b>")}</i>`, '<i><b>已核</b></i>');
  assert.equal(html`<dd>${undefined || "无"}</dd>`, '<dd>无</dd>');
  assert.equal(html`<a>${0}</a>`, '<a>0</a>');
});

test('innerHTML 模板串带插值必须经 html` 助手（静态串不拦）', () => {
  const dir = path.join(__dirname, '../src/ui');
  const bad = [];
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    let m; const re = /\.innerHTML\s*=\s*`/g;
    while ((m = re.exec(src))) {
      const body = src.slice(m.index, src.indexOf('`', m.index + m[0].length - 1) + 1);
      if (body.includes('${')) bad.push(f + ' 行 ' + src.slice(0, m.index).split('\n').length);
    }
  }
  assert.deepEqual(bad, [], '以下 innerHTML 模板串带插值却未走 html` 助手，请改为 html` 或字符串拼接＋esc：' + bad.join('；'));
});

test('空raw正确渲染，色板实际注入，透明色不拼接到var函数后',()=>{
 assert.equal(html`<a>${html.raw("")}</a>`,'<a></a>');
 const {CSS}=require('../src/ui/status_panel');
 const definitions=new Set([...CSS.matchAll(/(--xsd2-[\w-]+):/g)].map(x=>x[1]));
 for(const m of CSS.matchAll(/var\((--xsd2-[\w-]+)\)/g))assert.ok(definitions.has(m[1]),m[1]);
 assert.doesNotMatch(CSS,/var\([^)]*\)[0-9a-f]{2}/i);assert.match(CSS,/--xsd2-gold-a55:#d5b97b55/);
});
