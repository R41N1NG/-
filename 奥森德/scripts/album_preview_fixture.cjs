'use strict';
const {cardPreviewHtml}=require('./card_preview_fixture.cjs');
function art(name,kind,color,shape){
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="${kind==='portrait'?880:480}" viewBox="0 0 640 ${kind==='portrait'?880:480}"><defs><radialGradient id="p"><stop stop-color="${color}"/><stop offset="1" stop-color="#17110d"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#p)"/><rect x="22" y="22" width="596" height="${kind==='portrait'?836:436}" fill="none" stroke="#baa078" stroke-opacity=".5"/><text x="320" y="${kind==='portrait'?395:185}" text-anchor="middle" fill="#e0c89c" font-family="serif" font-size="76">${shape}</text><text x="320" y="${kind==='portrait'?495:285}" text-anchor="middle" fill="#e0c89c" font-family="serif" font-size="32">${name}</text><text x="320" y="${kind==='portrait'?555:345}" text-anchor="middle" fill="#bca88a" font-family="serif" font-size="22">${kind==='portrait'?'立绘位置':'CG 位置'} · 示意画稿</text></svg>`;
 return'data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64');
}
function sampleCatalog(){return[
 {id:'demo_gulan_portrait',npc:'gulan',title:'古兰 · 肖像',kind:'portrait',src:art('古兰','portrait','#574330','⚔'),unlock:[{type:'metric',key:'affection',min:70}]},
 {id:'demo_nise_portrait',npc:'nise',title:'妮丝 · 肖像',kind:'portrait',src:art('妮丝','portrait','#453b55','✧'),unlock:[{type:'introduced'}]},
 {id:'demo_nise_cg',npc:'nise',title:'旅途一页',kind:'cg',src:art('旅途一页','cg','#3a4a4a','◇'),unlock:[{type:'metric',key:'affection',min:70}]},
 {id:'demo_isna_portrait',npc:'isna',title:'伊丝娜 · 肖像',kind:'portrait',src:art('伊丝娜','portrait','#475039','✦'),unlock:[{type:'introduced'}]},
 {id:'demo_gulan_cg',npc:'gulan',title:'共同的旅途',kind:'cg',src:art('共同的旅途','cg','#55452f','◇'),unlock:[{type:'metric',key:'affection',min:70}]},
 {id:'demo_cecilia_portrait',npc:'cecilia',title:'塞西莉亚 · 肖像',kind:'portrait',src:art('塞西莉亚','portrait','#4d4652','†'),unlock:[{type:'introduced'}]},
 {id:'demo_locked_gulan',npc:'gulan',title:'未收集标题',kind:'cg',src:'https://example.invalid/locked-cg.webp',unlock:[{type:'metric',key:'affection',min:90}]},
 {id:'demo_ed_hidden',npc:'ed',title:'未登场标题',kind:'portrait',src:'https://example.invalid/hidden-ed.webp',unlock:[{type:'introduced'}]}
]}
function albumPreviewHtml(card){
 const data=JSON.stringify(sampleCatalog()).replace(/</g,'\\u003c');
 return cardPreviewHtml(card).replace('<title>','<title>回忆相册 · ').replace('<div class="preview-info">','<div class="preview-info">相册排版示意：画位使用示意素材，不代表已导入正式 CG。<br>').replace('helper.eval(scripts[0].content);',`helper.OKH_ALBUM_CATALOG=${data};helper.eval(scripts[0].content);`).replace("document.getElementById('preview-status').textContent='卡内脚本已启动 · 地图和状态栏可操作';", "document.getElementById('preview-status').textContent='卡内脚本已启动';");
}
module.exports={sampleCatalog,albumPreviewHtml};
