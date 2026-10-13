"use strict";
let serial=0;
const TEMPLATE="<div class=\"xsd2-tj-overlay\" data-tj=\"overlay\">\n          <div class=\"xsd2-tj-fog\"></div>\n          <div class=\"xsd2-tj-disc\">\n            <svg viewBox=\"0 0 400 400\" data-tj=\"discSvg\">\n              <defs>\n                <radialGradient id=\"GLOW_ID\" cx=\"50%\" cy=\"50%\" r=\"50%\">\n                  <stop offset=\"0%\" stop-color=\"rgba(243,223,168,.28)\"/>\n                  <stop offset=\"60%\" stop-color=\"rgba(212,176,106,.10)\"/>\n                  <stop offset=\"100%\" stop-color=\"rgba(212,176,106,0)\"/>\n                </radialGradient>\n              </defs>\n              <circle cx=\"200\" cy=\"200\" r=\"196\" fill=\"url(#GLOW_ID)\"/>\n              <g class=\"xsd2-tj-ring-o\" data-tj=\"ringStars\"></g>\n              <g class=\"xsd2-tj-ring-m\" data-tj=\"ringBagua\"></g>\n              <g class=\"xsd2-tj-ring-i\" data-tj=\"ringZhi\"></g>\n              <g data-tj=\"ticks\"></g>\n              <g class=\"xsd2-tj-taiji\" data-tj=\"taiji\"></g>\n            </svg>\n          </div>\n          <div class=\"xsd2-tj-ripples\"><div class=\"xsd2-tj-ripple xsd2-tj-r1\"></div><div class=\"xsd2-tj-ripple xsd2-tj-r2\"></div><div class=\"xsd2-tj-ripple xsd2-tj-r3\"></div></div>\n          <div class=\"xsd2-tj-motes\" data-tj=\"motes\"></div>\n          <div class=\"xsd2-tj-steps\"><span data-tj=\"stepText\">核时序</span><span class=\"xsd2-tj-dot\" data-tj=\"stepDots\">·</span></div>\n          <div class=\"xsd2-tj-veiltag\">天机演算</div>\n          <div class=\"xsd2-tj-flash\"></div>\n          <div class=\"xsd2-tj-seal\"><span>天</span><span>机</span><span>已</span><span>定</span></div>\n          <div class=\"xsd2-tj-gold-dust\" data-tj=\"goldDust\"></div>\n        </div>";
function makeOverlay(doc){
 const holder=doc.createElement("div"); const id="xsd2-tj-glow-"+(++serial);holder.innerHTML=TEMPLATE.replaceAll("GLOW_ID",id);const overlay=holder.firstElementChild;
  const NS='http://www.w3.org/2000/svg';
  const svg=overlay.querySelector('[data-tj="discSvg"]');
  const CX=200,CY=200;

  function txt(g,s,r,deg,size,fill){
    const t=doc.createElementNS(NS,'text');
    const a=(deg-90)*Math.PI/180;
    t.setAttribute('x',CX+r*Math.cos(a));
    t.setAttribute('y',CY+r*Math.sin(a));
    t.setAttribute('font-size',size);
    t.setAttribute('fill',fill);
    t.setAttribute('text-anchor','middle');
    t.setAttribute('dominant-baseline','middle');
    t.setAttribute('transform',`rotate(${deg} ${CX+r*Math.cos(a)} ${CY+r*Math.sin(a)})`);
    t.textContent=s;
    g.appendChild(t);
  }
  function ring(g,r,col,w,dash){
    const c=doc.createElementNS(NS,'circle');
    c.setAttribute('cx',CX);c.setAttribute('cy',CY);c.setAttribute('r',r);
    c.setAttribute('fill','none');c.setAttribute('stroke',col);
    c.setAttribute('stroke-width',w);
    if(dash)c.setAttribute('stroke-dasharray',dash);
    g.appendChild(c);
  }

  /* 外环：二十八宿 */
  const gStars=overlay.querySelector('[data-tj="ringStars"]');
  ring(gStars,186,'rgba(212,176,106,.55)',1.2);
  ring(gStars,158,'rgba(212,176,106,.30)',1);
  const stars='角亢氐房心尾箕斗牛女虚危室壁奎娄胃昴毕觜参井鬼柳星张翼轸';
  for(let i=0;i<28;i++) txt(gStars,stars[i],172,i*360/28,13,'rgba(212,176,106,.8)');

  /* 中环：八卦 */
  const gBagua=overlay.querySelector('[data-tj="ringBagua"]');
  ring(gBagua,140,'rgba(126,200,180,.28)',1,'3 5');
  const bagua='☰☱☲☳☴☵☶☷';
  for(let i=0;i<8;i++) txt(gBagua,bagua[i],124,i*45+22,17,'rgba(212,176,106,.65)');

  /* 内环：十二地支 */
  const gZhi=overlay.querySelector('[data-tj="ringZhi"]');
  ring(gZhi,102,'rgba(212,176,106,.4)',1);
  const zhi='子丑寅卯辰巳午未申酉戌亥';
  for(let i=0;i<12;i++) txt(gZhi,zhi[i],88,i*30,13,'rgba(232,221,192,.7)');

  /* 刻度 */
  const gT=overlay.querySelector('[data-tj="ticks"]');
  for(let i=0;i<72;i++){
    const a=i*5*Math.PI/180, long=i%6===0;
    const r1=long?58:62, r2=66;
    const l=doc.createElementNS(NS,'line');
    l.setAttribute('x1',CX+r1*Math.cos(a));l.setAttribute('y1',CY+r1*Math.sin(a));
    l.setAttribute('x2',CX+r2*Math.cos(a));l.setAttribute('y2',CY+r2*Math.sin(a));
    l.setAttribute('stroke',long?'rgba(212,176,106,.6)':'rgba(212,176,106,.25)');
    l.setAttribute('stroke-width',long?1.4:1);
    gT.appendChild(l);
  }

  /* 太极 */
  const gTj=overlay.querySelector('[data-tj="taiji"]');
  gTj.innerHTML=`
    <circle cx="200" cy="200" r="34" fill="#0d1119" stroke="rgba(212,176,106,.5)" stroke-width="1"/>
    <path d="M200,166 a34,34 0 0 1 0,68 a17,17 0 0 1 0,-34 a17,17 0 0 0 0,-34 Z" fill="rgba(232,221,192,.85)"/>
    <path d="M200,166 a34,34 0 0 0 0,68 a17,17 0 0 0 0,-34 a17,17 0 0 1 0,-34 Z" fill="rgba(13,17,25,.9)"/>
    <circle cx="200" cy="183" r="4.5" fill="rgba(13,17,25,.9)"/>
    <circle cx="200" cy="217" r="4.5" fill="rgba(232,221,192,.85)"/>`;

  /* 灵尘：从盘缘向心汇聚 */
  const motes=overlay.querySelector('[data-tj="motes"]');
  for(let i=0;i<14;i++){
    const m=doc.createElement('span');m.className='xsd2-tj-mote';
    const ang=Math.random()*Math.PI*2, dist=150+Math.random()*110;
    const x=Math.cos(ang)*dist, y=Math.sin(ang)*dist;
    m.style.left='calc(50% + '+x+'px )';
    m.style.top ='calc(46% + '+y+'px )';
    m.style.setProperty('--dx',(-x*0.92)+'px');
    m.style.setProperty('--dy',(-y*0.92)+'px');
    m.style.animationDelay=(Math.random()*2.2)+'s';
    motes.appendChild(m);
  }

  /* 揭幕金粉 */
  const dust=overlay.querySelector('[data-tj="goldDust"]');
  for(let i=0;i<9;i++){
    const d=doc.createElement('span');d.className='xsd2-tj-dust';
    d.style.left=(12+Math.random()*76)+'%';
    d.style.bottom=(10+Math.random()*40)+'%';
    d.style.setProperty('--wx',((Math.random()*60-30))+'px');
    d.style.animationDelay=(Math.random()*.35)+'s';
    dust.appendChild(d);
  }


 return overlay;
}
module.exports={makeOverlay};
