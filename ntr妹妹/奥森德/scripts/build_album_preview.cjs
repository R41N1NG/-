'use strict';
const fs=require('node:fs'),path=require('node:path'),{albumPreviewHtml}=require('./album_preview_fixture.cjs');
const dir=path.resolve(__dirname,'../最新角色卡'),card=JSON.parse(fs.readFileSync(path.join(dir,'奥克赫斯.json'),'utf8'));
fs.writeFileSync(path.join(dir,'相册排版预览.html'),albumPreviewHtml(card));
console.log('已生成相册排版预览（独立示意目录，不进入正式卡）');
