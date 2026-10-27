'use strict';
const fs=require('node:fs'),path=require('node:path');
const {findRegex,fields,core}=require('./协议.cjs');
const data=code=>'<script src="data:text/javascript;charset=utf-8;base64,'+Buffer.from(code).toString('base64')+'"></script>';
function build(){const files=['配置.js','../羁押追踪.js','武学回放.js','状态回放.js','../../后台/指纹.js','../后台投影.js','立绘.js','地图.js','交互.js'];
 const scripts=files.map(file=>data(fs.readFileSync(path.resolve(__dirname,file),'utf8'))).join('\n');
 const doc=fs.readFileSync(path.join(__dirname,'模板.html'),'utf8').replace('</body>',scripts+'</body>');
 return {findRegex,replaceString:'```html\n'+doc+'\n```',fields,core};}
module.exports={build};
