'use strict';
const fs=require('node:fs'),path=require('node:path'),{cardPreviewHtml}=require('./card_preview_fixture.cjs');
const dir=path.resolve(__dirname,'../最新角色卡'),card=JSON.parse(fs.readFileSync(path.join(dir,'奥克赫斯.json'),'utf8'));
fs.writeFileSync(path.join(dir,'导入预览.html'),cardPreviewHtml(card));
console.log('已生成直接使用卡内脚本的整卡预览');
