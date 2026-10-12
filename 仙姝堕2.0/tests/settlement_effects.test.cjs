"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),{JSDOM}=require("jsdom");
const {createSettlementEffects}=require("../src/ui/settlement_effects");
const {renderSettlement}=require("../src/ui/settlement_panel");
function clock(){let now=0,n=0;const jobs=new Map();return{setTimeout(fn,ms){const id=++n;jobs.set(id,{fn,time:now+ms});return id;},clearTimeout(id){jobs.delete(id);},advance(ms){const end=now+ms;for(;;){const next=[...jobs].sort((a,b)=>a[1].time-b[1].time).find(x=>x[1].time<=end);if(!next)break;now=next[1].time;jobs.delete(next[0]);next[1].fn();}now=end;},size(){return jobs.size;}};}
function fixture(opts={}){
  const d=new JSDOM('<html><head></head><body><div id="chat"><div class="mes" mesid="0"><div class="mes_text">先前故事</div></div></div><main></main></body></html>'),doc=d.window.document,t=clock();
  const effects=createSettlementEffects(doc,()=>{},{clock:t,...opts});
  const p={id:"r1",nodeId:"exit",floor:0,selection:{settlement:{mode:"separate"}}};
  const s={chatId:"a",branchId:"a",floor:0,pending:p,settlements:{}};
  const c={chat:[{mes:"先前故事"}]};
  const r={id:"r1",floor:2,title:"幽寂谷行程结算",mode:"separate",action:"离谷",exitType:"正常离开",elapsedDays:2,date:{year:1578,month:3,day:5},rewards:["地图"],facts:["开启暗格"]};
  function user(){c.chat.push({is_user:true,mes:"退出"});effects.update(s,c);}
  function assistant(){c.chat.push({mes:"结算正文"});const row=doc.createElement("div");row.className="mes";row.setAttribute("mesid","2");row.innerHTML='<div class="mes_text">机械结算</div>';doc.querySelector("#chat").append(row);effects.update(s,c);return row.querySelector(".mes_text");}
  function result(){s.pending=null;s.floor=2;s.settlements.r1=r;effects.update(s,c);renderSettlement(doc,doc.querySelector("main"),s,effects);}
  return{d,doc,t,effects,s,c,r,user,assistant,result,close(){effects.dispose();d.window.close();}};
}
test("真回执先到：动画未完不揭幕，揭幕卡判词与折叠底账，重复渲染不播放",()=>{
  const h=fixture();try{
    const before=JSON.stringify(h.s);h.effects.update(h.s,h.c);assert.equal(JSON.stringify(h.s),before);h.user();const body=h.assistant();
    assert.ok(body.classList.contains("xsd2-settlement-obscured"));h.result();
    assert.equal(h.doc.querySelector('main section').hidden,true);
    h.t.advance(2959);assert.ok(!h.doc.querySelector('[data-tj="overlay"]').classList.contains('xsd2-tj-sealing'));
    h.t.advance(1);assert.ok(h.doc.querySelector('[data-tj="overlay"]').classList.contains('xsd2-tj-sealing'));
    h.t.advance(1440);assert.equal(h.effects.isMasked("r1"),false);assert.ok(!body.classList.contains("xsd2-settlement-obscured"));
    renderSettlement(h.doc,h.doc.querySelector("main"),h.s,h.effects);
    const card=h.doc.querySelector('main section');assert.equal(card.hidden,false);assert.equal(card.querySelector('details').open,false);
    assert.match(card.querySelector('.xsd2-tj-verdict').textContent,/历时2日/);assert.match(card.querySelector('pre').textContent,/开启暗格/);
    card.querySelector('details').open=true;renderSettlement(h.doc,h.doc.querySelector('main'),h.s,h.effects);assert.equal(card.querySelector('details').open,true);
    h.effects.update(h.s,h.c);assert.equal(h.doc.querySelector('[data-tj="overlay"]'),null);
  }finally{h.close();}
});
test("动画先完：继续等真实回执，不先落印；略过只略动画，不假结算",()=>{
  const h=fixture();try{
    h.effects.update(h.s,h.c);h.user();h.assistant();h.t.advance(6000);
    assert.equal(h.effects.isMasked("r1"),true);assert.ok(!h.doc.querySelector('[data-tj="overlay"]').classList.contains('xsd2-tj-sealing'));
    h.doc.querySelector('[aria-label="略过动画，等待真实结算结果"]').click();assert.equal(h.effects.isMasked("r1"),true);
    assert.equal(Object.keys(h.s.settlements).length,0);
    h.result();h.t.advance(0);assert.equal(h.effects.isMasked("r1"),false);
  }finally{h.close();}
});
test("停止/删楼/换分支/卸载清除遮罩和定时器，历史回执直接显示",()=>{
  for(const kind of ['cancel','branch','dispose']){
    const h=fixture();try{
      h.effects.update(h.s,h.c);h.user();const body=h.assistant();
      if(kind==='cancel'){h.s.pending=null;h.effects.update(h.s,h.c);}else if(kind==='branch'){h.s.branchId='b';h.effects.update(h.s,h.c);}else h.effects.dispose();
      assert.equal(h.doc.querySelector('[data-tj="overlay"]'),null);assert.equal(h.t.size(),0);assert.ok(!body.classList.contains('xsd2-settlement-obscured'));
    }finally{h.close();}
  }
  const h=fixture();try{h.s.pending=null;h.s.floor=2;h.s.settlements.r1=h.r;h.effects.update(h.s,h.c);renderSettlement(h.doc,h.doc.querySelector('main'),h.s,h.effects);assert.equal(h.doc.querySelector('[data-tj="overlay"]'),null);assert.equal(h.doc.querySelector('details').open,false);}finally{h.close();}
});
test("无效晋升回报不落成功印，移除遮罩；减少动态效果仍等待回执",()=>{
  const h=fixture({reducedMotion:true});try{
    h.s.pending.selection={completionQuery:"是否达成"};h.effects.update(h.s,h.c);h.user();const body=h.assistant();h.t.advance(1000);assert.equal(h.effects.isMasked('r1'),true);
    h.s.pending=null;h.s.lastNodeResult={nodeId:'exit',floor:2,outcome:'retry'};h.effects.update(h.s,h.c);h.t.advance(0);
    assert.equal(h.doc.querySelector('[data-tj="overlay"]'),null);assert.ok(!body.classList.contains('xsd2-settlement-obscured'));
  }finally{h.close();}
});
test("狐狸SVG与CSS范围隔离，不导入演示日期/赏赐；多卡无重复SVG标识",()=>{
  const h=fixture();try{
    const {makeOverlay}=require('../src/ui/settlement_art'),style=require('../src/ui/settlement_style');
    const a=makeOverlay(h.doc),b=makeOverlay(h.doc);
    assert.notEqual(a.querySelector('radialGradient').id,b.querySelector('radialGradient').id);
    assert.equal(a.querySelectorAll('[data-tj="ringStars"] text').length,28);assert.equal(a.querySelectorAll('[data-tj="ringBagua"] text').length,8);
    assert.ok(style.includes('.xsd2-tj-overlay.xsd2-tj-sealing .xsd2-tj-flash'));
    assert.ok(!style.includes('.xsd2-tj-xsd2-'));assert.match(style,/\.xsd2-tianji\{[\s\S]*?--gold:/);assert.ok(!style.includes(':root'));
    h.s.pending=null;h.s.floor=2;h.s.settlements.r1=h.r;renderSettlement(h.doc,h.doc.querySelector('main'),h.s);
    assert.ok(!h.doc.querySelector('main').textContent.includes('引灵符'));assert.match(h.doc.querySelector('main').textContent,/3月5日/);
  }finally{h.close();}
});
