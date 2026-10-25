'use strict';
// gpt：只消费角色卡已有status_bar字段；不计算/保存剧情状态。
const fs = require('node:fs');
const path = require('node:path');
const dir = __dirname;
const fields = ['time','elapsed','location','weather','environment','favor_char','favor_stage','favor_aura','favor_reason','favor_mind','favor_companion','extra_char_1','extra_char_2','growth_skill','growth_reason','growth_weight','roster_event','bailian_state','shuangling_state','clue','clue_obtained','news_near','news_mid','crisis'];
// 按原卡输出契约顺序读取；缺项可留白，未知HTML与跨栏内容不进入模板。
const ws = String.fromCharCode(92) + 's*';
const capture = (tag,name=tag) => `<${tag}>(?<${name}>[^<]*)</${tag}>`;
const extra = i => {
 const none = `${ws}<name>(?:无|暂无|无他人|暂无他人|独处)</name>${ws}` + ['stage','aura','mind','demeanor'].map(k=>`(?:<${k}>[^<]*</${k}>${ws})?`).join('');
 const person = ws + ['name','stage','aura','mind','demeanor'].map(k=>capture(k,`e${i}_${k}`)+ws).join('');
 return `<extra_char_${i}>(?:${none}|${person}|[^<]*)</extra_char_${i}>`;
};
const parts = fields.map(key=> `(?:${/^extra_char_/.test(key)?extra(key.endsWith('1')?1:2):capture(key)}${ws})?`);
const findRegex = '<status_bar>'+ws+parts.join('')+'</status_bar>';
const css = fs.readFileSync(path.join(dir, '样式.css'), 'utf8');
const template = fs.readFileSync(path.join(dir, '模板.html'), 'utf8');
const replaceString = `<style>\n${css}\n</style>\n${template}`;
const rule = {id:'zyx-hud-ink-v1',scriptName:'ZYX_02_状态栏HUD渲染',findRegex,replaceString,trimStrings:[],placement:[2],disabled:false,markdownOnly:true,promptOnly:false,runOnEdit:true,substituteRegex:0,minDepth:null,maxDepth:null};
const guardRule={...rule,id:'zyx-hud-malformed-v1',scriptName:'ZYX_02B_状态栏异常记录保护',findRegex:'<status_bar>(?:(?!</?status_bar>)[^])*?</status_bar>',replaceString:'<div class="zyx-hud"><p class="zyx-hud-note">本轮状态记录格式未齐，暂不展开。剧情正文不受影响。</p></div>'};
const streamRule={...rule,id:'zyx-hud-stream-v2',scriptName:'ZYX_03_流式传输防闪烁',findRegex:'<status_bar>(?:(?!</?status_bar>)[^])*$',replaceString:''};
const historyRule={...rule,id:'zyx-hud-history-v2',scriptName:'ZYX_04_历史楼层清理 (剔除历史状态栏节约Token)',findRegex:'<status_bar>(?:(?!</?status_bar>)[^])*?</status_bar>',replaceString:'',markdownOnly:false,promptOnly:true,minDepth:3};
fs.writeFileSync(path.join(dir,'状态栏正则.json'),JSON.stringify([rule,guardRule,streamRule,historyRule],null,2)+'\n');
const snapshots = JSON.parse(fs.readFileSync(path.join(dir,'演示数据.json'),'utf8'));
function escape(s) { return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
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
  // 预览外壳仅用于本地看图；不包含游戏控制或新增结算规则。
  const doc=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>丹杏 · 状态栏</title><style>body{margin:0;padding:30px 14px;background:#101618;color:#e8e1d0}.demo-note{max-width:1120px;margin:0 auto 18px;color:#aaa894;font:12px/1.8 system-ui}.demo-scene{max-width:1120px;margin:0 auto 20px;padding:22px;border-left:2px solid #675f48;color:#c4c2b5;font:15px/2 ui-serif,SimSun,serif} @media(max-width:560px){body{padding:14px 8px}}</style><p class="demo-note">状态栏样式演示 · 以下为虚构测试快照，不是当前存档。点击武学、案簿或在场他人可展开，再点同一入口收起。</p><div class="demo-scene">雨脚打湿了窗棂，客栈内灯火微晃。你收好行囊，尚未动身。</div>${render(snapshots.同行)}</html>`;
  fs.writeFileSync(path.join(dir,'预览.html'),doc);
  console.log('已生成状态栏正则.json、预览.html');
}
module.exports={fields,rule,guardRule,streamRule,historyRule,source,render,renderRaw};
