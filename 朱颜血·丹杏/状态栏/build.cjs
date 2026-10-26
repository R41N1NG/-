'use strict';
// gpt：只消费角色卡已有status_bar字段；不计算/保存剧情状态。
const fs = require('node:fs');
const path = require('node:path');
const dir = __dirname;
const fields = ['time','elapsed','location','weather','environment','favor_char','favor_stage','favor_aura','favor_reason','favor_mind','favor_companion','extra_char_1','extra_char_2','player_realm','player_skills','growth_skill','growth_reason','growth_weight','prison_control','roster_event','bailian_state','shuangling_state','danniang_state','yuniang_state','baiyulian_state','xieyunsu_state','junzhu_state','qingluo_state','clue','clue_obtained','clues_gained','news_near','news_mid','crisis'];
// 按原卡输出契约顺序读取；缺项可留白，未知HTML与跨栏内容不进入模板。
const ws = String.fromCharCode(92) + 's*';
const plain='[^<'+String.fromCharCode(96)+']*';
const capture = (tag,name=tag) => `<${tag}>(?<${name}>${plain})</${tag}>`;
const extra = i => {
 const none = `${ws}<name>(?:无|暂无|无他人|暂无他人|独处)</name>${ws}` + ['stage','aura','mind','demeanor'].map(k=>`(?:<${k}>[^<]*</${k}>${ws})?`).join('');
 const person = ws + ['name','stage','aura','mind','demeanor'].map(k=>capture(k,`e${i}_${k}`)+ws).join('');
 return `<extra_char_${i}>(?:${none}|${person}|[^<]*)</extra_char_${i}>`;
};
const parts = fields.map(key=> `(?:${/^extra_char_/.test(key)?extra(key.endsWith('1')?1:2):capture(key)}${ws})?`);
const findRegex = '<status_bar>'+ws+parts.join('')+'</status_bar>';
const css=['样式.css','地图样式.css','交互样式.css','监牢样式.css'].map(file=>fs.readFileSync(path.join(dir,file),'utf8')).join('\n');
const template=fs.readFileSync(path.join(dir,'模板.html'),'utf8');
const config={portraits:JSON.parse(fs.readFileSync(path.join(dir,'立绘配置.json'),'utf8')),maps:JSON.parse(fs.readFileSync(path.join(dir,'地图配置.json'),'utf8')),roster:JSON.parse(fs.readFileSync(path.join(dir,'羁押名册.json'),'utf8'))};
// 静态项目JS以data脚本嵌入，避免后续正则把JS里的状态标签/$1当成模型回报或替换符。
const script=code=>'<script src="data:text/javascript;charset=utf-8;base64,'+Buffer.from(code,'utf8').toString('base64')+'"></script>';
const configScript=script('window.ZYX_HUD_CONFIG='+JSON.stringify(config)+';');
const fingerprintScript=script(fs.readFileSync(path.join(dir,'../后台/指纹.js'),'utf8'));
const scripts=['后台投影.js','玩家武学回放.js','羁押追踪.js','状态记录回放.js','本地图包.js','地图组件.js','宿主桥.js','后台中控.js','交互控制器.js'].map(file=>script(fs.readFileSync(path.join(dir,file),'utf8'))).join('\n');
const hudDocument='<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:transparent}body{display:flow-root}'+css+'</style></head><body>'+template+configScript+fingerprintScript+scripts+'</body></html>';
const replaceString='```html\n'+hudDocument+'\n```';
const rule = {id:'zyx-hud-ink-v1',scriptName:'ZYX_02_状态栏HUD渲染',findRegex,replaceString,trimStrings:[],placement:[2],disabled:false,markdownOnly:true,promptOnly:false,runOnEdit:true,substituteRegex:0,minDepth:null,maxDepth:null};
const guardRule={...rule,id:'zyx-hud-malformed-v1',scriptName:'ZYX_02B_状态栏异常记录保护',findRegex:'<status_bar>(?:(?!</?status_bar>)[^])*?</status_bar>',replaceString:'<div class="zyx-hud"><p class="zyx-hud-note">本轮状态记录格式未齐，暂不展开。剧情正文不受影响。</p></div>'};
const missingRule={...rule,id:'zyx-hud-missing-v1',scriptName:'ZYX_02C_状态栏缺报提示',findRegex:'^(?![^]*(?:<status_bar>|<zyx_gateway>|zyx-zero-floor|zyx-hud))(?<body>[^]+)$',replaceString:'$<body>\n<style>.zyx-hud-missing{box-sizing:border-box;max-width:1120px;margin:12px auto;padding:12px 15px;background:linear-gradient(110deg,#2d3031,#151e25);border:1px solid #737c7f;border-left:4px solid #ae6548;color:#ddcfb6;font:13px/1.8 system-ui;text-align:left}.zyx-hud-missing strong{display:block;color:#f0c19d;font-size:13px}.zyx-hud-missing span{font-size:12px;color:#c2c8c7}</style><div class="zyx-hud zyx-hud-missing" role="region" aria-label="状态数据缺报"><strong>朱颜血·丹杏 · 刑狱志</strong><span>本轮未收到完整状态数据，暂不显示数值。</span></div>'};
const streamRule={...rule,id:'zyx-hud-stream-v2',scriptName:'ZYX_03_流式传输防闪烁',findRegex:'<status_bar>(?:(?!</?status_bar>)[^])*$',replaceString:''};
const historyRule={...rule,id:'zyx-hud-history-v2',scriptName:'ZYX_04_历史楼层清理 (剔除历史状态栏节约Token)',findRegex:'<status_bar>(?:(?!</?status_bar>)[^])*?</status_bar>',replaceString:'',markdownOnly:false,promptOnly:true,minDepth:3};
fs.writeFileSync(path.join(dir,'状态栏正则.json'),JSON.stringify([rule,guardRule,missingRule,streamRule,historyRule],null,2)+'\n');
const snapshots = JSON.parse(fs.readFileSync(path.join(dir,'演示数据.json'),'utf8'));
function escape(s) { return String(s).replace(/[&<>"'`]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c])); }
function source(snapshot) {
  return '<status_bar>\n'+fields.map(k=> {
    let v=snapshot[k]??'';
    if(v&&typeof v==='object') v=Object.entries(v).map(([tag,text])=>`<${tag}>${escape(text)}</${tag}>`).join('');
    else v=escape(v);
    return `<${k}>${v}</${k}>`;
  }).join('\n')+'\n</status_bar>';
}
function renderRaw(raw) { return raw.replace(new RegExp(findRegex,'g'),replaceString).replace(new RegExp(guardRule.findRegex,'g'),guardRule.replaceString); }
function render(snapshot) { return renderRaw(source(snapshot)); }
if(require.main===module) {
 const output=render(snapshots.同行);
 const preview=output.slice('```html\n'.length,-'\n```'.length).replace('<body>','<body><p style="max-width:1120px;margin:14px auto;color:#b9b29f;font:12px/1.8 system-ui">交互样式演示：地点可展开地图，境界栏查看主角档案。虚构快照，不是实际存档。</p>');
 fs.writeFileSync(path.join(dir,'预览.html'),preview);
 console.log('已生成交互HUD正则、离线预览');
}
module.exports={fields,rule,guardRule,missingRule,streamRule,historyRule,source,render,renderRaw};
