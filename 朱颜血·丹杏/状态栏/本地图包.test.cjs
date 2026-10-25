'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const window = { location: { origin: 'https://tavern.example' } };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '本地图包.js'), 'utf8'), { window, URL });
const resolve = (...args) => JSON.parse(JSON.stringify(window.ZYXPortraitLibrary.resolve(...args)));

test('未配置角色不猜文件名或远程地址', () => {
  assert.deepEqual(resolve('丹杏', { baseUrl: 'https://images.example', files: {} }), { urls: [], source: 'missing' });
  assert.deepEqual(resolve('toString', { files: {} }), { urls: [], source: 'missing' });
});
test('显式图包目录与中文文件名正确编码', () => {
  assert.deepEqual(resolve('丹杏', { baseUrl: '/图包', files: { 丹杏: '立绘/丹杏 常态.webp' } }), {
    urls: ['https://tavern.example/%E5%9B%BE%E5%8C%85/%E7%AB%8B%E7%BB%98/%E4%B8%B9%E6%9D%8F%20%E5%B8%B8%E6%80%81.webp'], source: 'configured'
  });
});
test('支持显式 HTTPS 图包与完整 HTTP 图片地址', () => {
  assert.equal(resolve('丹杏', { baseUrl: 'https://images.example/package', files: { 丹杏: 'a.png' } }).urls[0], 'https://images.example/package/a.png');
  assert.equal(resolve('丹杏', { files: { 丹杏: 'http://images.example/a.jpg' } }).urls[0], 'http://images.example/a.jpg');
});
test('根路径固定使用宿主同源，支持显式 origin', () => {
  assert.equal(resolve('丹杏', { baseUrl: 'https://images.example/package', files: { 丹杏: '/img/a.png' } }, 'https://local.example').urls[0], 'https://local.example/img/a.png');
});
test('拒绝非法协议、跨域协议相对地址和路径穿越', () => {
  for (const file of ['javascript:alert(1)', 'file:///E:/a.png', 'data:image/png,x', '//images.example/a.png', '../a.png', '%2e%2e/a.png', '%252e%252e/a.png', 'https://images.example/a/../b.png', 'a\\b.png']) {
    assert.equal(resolve('丹杏', { files: { 丹杏: file } }).source, 'missing', file);
  }
  for (const baseUrl of ['javascript:x', 'file:///E:/images', '//images.example', '../images', '%2e%2e/images']) {
    assert.equal(resolve('丹杏', { baseUrl, files: { 丹杏: 'a.png' } }).source, 'missing', baseUrl);
  }
});
test('仅输出显式一项，无变体扫描或副作用接口', () => {
  assert.equal(resolve('丹杏', { files: { 丹杏: 'a.png' } }).urls.length, 1);
  assert.deepEqual(Object.keys(window.ZYXPortraitLibrary), ['resolve']);
});
