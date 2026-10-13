"use strict";
// 纹章点亮揭幕：名器阶段推进（known 旗标）时在状态栏上层跳出播放一次，播完即移除。
// 不触两翼瓷砖渲染；按聊天/分支/身份记录已播阶段，sessionStorage不可用时使用文档内存。
// 初次挂载只登记存量；已播记录只增不减，刷新/回看/checkpoint恢复不重播；
// 历史楼 readOnly 不播；系统减弱动态效果时只记账不播。
// 形稿由原纹章位图自动描廓提取（模板库/16 号预览件同源管线）；题字为志莽行书七字子集（OFL 可商用）。
const FANFARES = {
  zhuojiuliuyanxue: {
    name: "灼酒流炎穴",
    sub: "觉醒",
    paths: {
      cup: { fill: "#D9A93C", d: "M454 827L468 827L474 833L404 839L374 845L368 850L390 858L431 864L568 872L686 872L793 867L859 859L886 850L883 846L857 840L780 834L785 827L801 827L886 836L906 843L909 852L896 870L882 906L866 934L852 949L830 965L773 987L686 1000L671 1007L669 1021L684 1041L703 1055L739 1074L660 1082L573 1081L515 1072L548 1056L569 1041L584 1021L582 1007L566 1000L479 987L445 976L421 964L400 948L386 932L371 905L355 865L345 853L345 846L349 842L364 837L410 830L454 828Z" },
      flameL: { fill: "#D8402C", d: "M416 294L432 302L448 317L458 333L464 354L464 371L459 390L434 429L423 453L420 469L422 490L431 511L444 528L505 576L527 599L546 630L554 658L554 686L547 709L531 742L530 769L537 787L547 800L590 835L601 854L603 864L583 863L579 853L566 838L534 818L519 803L513 791L510 768L520 733L511 741L499 763L497 784L500 795L517 816L545 834L560 849L567 863L524 862L513 850L471 818L459 802L450 777L450 757L466 708L462 680L442 652L409 633L446 639L464 649L478 662L489 680L493 694L490 728L499 715L505 694L504 670L498 654L481 633L458 619L397 608L366 596L342 574L330 550L326 531L326 506L338 468L358 442L423 387L438 364L442 351L441 331L431 310L416 295ZM416 429L396 442L377 463L368 485L368 502L375 520L392 537L414 548L445 557L406 528L393 504L394 470L404 447L417 429Z" },
      flameR: { fill: "#D8402C", d: "M835 295L837 296L823 310L814 327L814 360L829 385L887 434L914 465L923 484L928 507L924 549L911 575L889 595L864 606L795 619L777 629L758 650L750 670L749 696L756 718L763 727L761 692L770 670L780 657L808 639L844 633L814 650L801 664L790 686L788 711L801 747L804 771L798 795L786 814L767 832L737 853L730 862L686 863L697 845L715 829L737 816L754 794L754 761L744 743L733 733L743 762L742 786L734 804L720 818L692 834L678 848L670 863L651 864L655 848L664 834L710 796L723 772L722 740L704 702L699 679L701 651L710 625L724 602L743 581L798 539L815 522L831 493L831 454L821 431L795 391L790 373L790 353L795 335L804 319L819 304L835 296ZM838 429L860 470L861 503L851 524L836 539L808 557L843 547L859 539L876 524L885 506L886 487L878 465L860 444L839 429Z" },
      dropC: { fill: "#DFAF40", d: "M626 444L637 485L661 531L671 568L671 590L666 611L636 657L628 680L616 654L594 624L583 592L583 564L588 543L616 487L626 445Z" },
      splashL: [
        { fill: "#DFAF40", d: "M299 693L323 695L351 713L377 743L389 765L397 789L380 765L360 748L340 742L306 742L292 736L282 723L281 710L291 696L299 694Z" },
        { fill: "#D8402C", d: "M344 760L366 762L384 771L408 809L424 821L396 812L385 801L376 784L363 773L349 767L330 766L344 761Z" },
      ],
      splashR: [
        { fill: "#DFAF40", d: "M938 693L958 694L969 702L973 716L968 730L952 741L913 742L890 750L874 764L856 789L871 752L892 723L920 700L938 694Z" },
        { fill: "#D8402C", d: "M896 760L915 761L924 766L909 766L894 771L876 786L860 810L848 817L831 820L847 807L855 790L870 771L887 762L896 761Z" },
      ],
    },
  },
};
const STORE_KEY = "xsd2RelicFanfare:v2";
const memory = new WeakMap(), styles = new WeakMap();
let serial=0;
const CSS = `
@font-face{font-family:"xsd2FanBrush";src:url(data:font/woff2;base64,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) format("woff2");font-display:swap}
.xsd2-fan-host[hidden]{display:none}
.xsd2-fan-host{position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(5,8,12,.82);animation:xsd2FanHostIn .35s ease-out both}
.xsd2-fan-host.xsd2-fan-out{animation:xsd2FanHostOut .4s ease-in both}
@keyframes xsd2FanHostIn{from{opacity:0}to{opacity:1}}
@keyframes xsd2FanHostOut{from{opacity:1}to{opacity:0}}
.xsd2-fan-card{--spd:1;position:relative;width:380px;height:508px;border-radius:14px;background:#141B26;border:1px solid #2A3648;box-shadow:inset 0 0 70px rgba(0,0,0,.6),0 6px 30px rgba(0,0,0,.45);overflow:hidden;cursor:pointer;font-family:serif}
.xsd2-fan-card::before{content:"";position:absolute;inset:7px;border:1px solid rgba(217,169,60,.26);border-radius:9px;pointer-events:none;z-index:6}
@media (max-height:720px){.xsd2-fan-card{transform:scale(.8)}}
.xsd2-fan-card svg{width:100%;height:100%;display:block}
.xsd2-fan-mist{position:absolute;inset:-20px;z-index:1;pointer-events:none;filter:blur(2px);background:radial-gradient(240px 200px at 18% 10%,rgba(216,64,44,.11),transparent 70%),radial-gradient(260px 220px at 84% 16%,rgba(217,169,60,.11),transparent 70%),radial-gradient(320px 280px at 50% 86%,rgba(217,169,60,.09),transparent 70%)}
.xsd2-fan-play .xsd2-fan-mist{animation:xsd2FanMist calc(9s/var(--spd)) ease-in-out infinite alternate}
@keyframes xsd2FanMist{from{transform:translate(-8px,4px) scale(1.02)}to{transform:translate(8px,-6px) scale(1.06)}}
.xsd2-fan-title{position:absolute;top:0;left:0;right:0;height:170px;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none}
.xsd2-fan-title::before{content:"";position:absolute;left:50%;top:52%;width:300px;height:120px;transform:translate(-50%,-50%);background:radial-gradient(closest-side,rgba(217,169,60,.14),transparent 75%);opacity:0}
.xsd2-fan-play .xsd2-fan-title::before{animation:xsd2FanTitleHaloIn calc(.9s/var(--spd)) ease-out calc(3.8s/var(--spd)) both,xsd2FanTitleHaloPulse calc(.5s/var(--spd)) ease-out calc(4.5s/var(--spd)) both,xsd2FanTitleHaloBreath calc(3s/var(--spd)) ease-in-out calc(5.3s/var(--spd)) infinite alternate}
@keyframes xsd2FanTitleHaloIn{0%{opacity:0}100%{opacity:.3}}
@keyframes xsd2FanTitleHaloPulse{0%{opacity:.3}30%{opacity:1}100%{opacity:.55}}
@keyframes xsd2FanTitleHaloBreath{from{opacity:.45}to{opacity:.72}}
.xsd2-fan-main{margin:0;font-family:"xsd2FanBrush","STXingkai","华文行楷","KaiTi","楷体",serif;font-size:58px;line-height:1.2;letter-spacing:6px;text-indent:6px;white-space:nowrap}
.xsd2-fan-main span{display:inline-block;opacity:0;background:linear-gradient(180deg,#FFF3C6 0%,#F2CF6D 30%,#C08A1E 62%,#6B4C10 100%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:1.1px rgba(74,50,8,.55);filter:drop-shadow(0 3px 3px rgba(0,0,0,.75)) drop-shadow(0 0 16px rgba(217,169,60,.4))}
.xsd2-fan-play .xsd2-fan-main span{animation:xsd2FanHammerIn calc(.34s/var(--spd)) cubic-bezier(.3,.6,.3,1) both;animation-delay:calc((3.8s + var(--d))/var(--spd))}
@keyframes xsd2FanHammerIn{
  0%{opacity:0;transform:scale(2.35) translateY(-16px);filter:blur(5px) drop-shadow(0 3px 3px rgba(0,0,0,.75)) drop-shadow(0 0 16px rgba(217,169,60,.4))}
  38%{opacity:1}
  55%{transform:scale(.9) translateY(3px);filter:blur(0) drop-shadow(0 3px 3px rgba(0,0,0,.75)) drop-shadow(0 0 16px rgba(217,169,60,.4))}
  75%{transform:scale(1.07)}
  100%{opacity:1;transform:none;filter:drop-shadow(0 3px 3px rgba(0,0,0,.75)) drop-shadow(0 0 16px rgba(217,169,60,.4))}}
.xsd2-fan-rule{display:flex;align-items:center;gap:9px;width:76%;margin:5px auto 9px}
.xsd2-fan-rule i{flex:1;height:1px;opacity:0}
.xsd2-fan-rule i:first-child{background:linear-gradient(90deg,transparent,rgba(217,169,60,.8));transform-origin:100% 50%}
.xsd2-fan-rule i:last-child{background:linear-gradient(90deg,rgba(217,169,60,.8),transparent);transform-origin:0% 50%}
.xsd2-fan-rule b{width:7px;height:7px;background:#E8C363;transform:rotate(45deg);opacity:0;box-shadow:0 0 8px rgba(232,195,99,.7)}
.xsd2-fan-play .xsd2-fan-rule i{animation:xsd2FanLineGrow calc(.55s/var(--spd)) ease-out calc(4.55s/var(--spd)) both}
.xsd2-fan-play .xsd2-fan-rule b{animation:xsd2FanFadeSoft calc(.4s/var(--spd)) ease-out calc(4.9s/var(--spd)) both}
@keyframes xsd2FanLineGrow{0%{opacity:0;transform:scaleX(0)}100%{opacity:1;transform:scaleX(1)}}
@keyframes xsd2FanFadeSoft{0%{opacity:0;transform:rotate(45deg) scale(.3)}100%{opacity:1;transform:rotate(45deg) scale(1)}}
.xsd2-fan-seal{position:relative;margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;width:62px;height:88px;border:2px solid rgba(203,54,42,.92);border-radius:7px;color:#D8402C;font-family:"xsd2FanBrush","STXingkai","华文行楷","KaiTi","楷体",serif;font-size:31px;line-height:1.12;-webkit-text-stroke:.7px rgba(90,16,10,.5);text-shadow:0 0 10px rgba(200,55,42,.55);box-shadow:inset 0 0 9px rgba(200,55,42,.35),0 0 14px rgba(200,55,42,.22);transform:rotate(-4deg);opacity:0}
.xsd2-fan-play .xsd2-fan-seal{animation:xsd2FanStampIn calc(.55s/var(--spd)) cubic-bezier(.2,1.3,.4,1) calc(4.95s/var(--spd)) both,xsd2FanSealGlow calc(2.8s/var(--spd)) ease-in-out calc(5.8s/var(--spd)) infinite alternate}
.xsd2-fan-seal::after{content:"";position:absolute;inset:-5px;border:1px solid rgba(203,54,42,.85);border-radius:9px;opacity:0}
.xsd2-fan-play .xsd2-fan-seal::after{animation:xsd2FanStampRing calc(.6s/var(--spd)) ease-out calc(5.42s/var(--spd)) both}
@keyframes xsd2FanStampIn{0%{opacity:0;transform:rotate(-4deg) scale(1.75)}55%{opacity:1;transform:rotate(-4deg) scale(.93)}78%{transform:rotate(-4deg) scale(1.05)}100%{opacity:1;transform:rotate(-4deg) scale(1)}}
@keyframes xsd2FanStampRing{0%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(1.4)}}
@keyframes xsd2FanSealGlow{from{box-shadow:inset 0 0 9px rgba(200,55,42,.3),0 0 12px rgba(200,55,42,.2)}to{box-shadow:inset 0 0 12px rgba(200,55,42,.5),0 0 22px rgba(200,55,42,.4)}}
.xsd2-fan-burst{position:absolute;left:50%;top:100px;width:0;height:0;z-index:4;pointer-events:none}
.xsd2-fan-burst i{position:absolute;width:5px;height:5px;border-radius:50%;background:#E8C363;opacity:0;box-shadow:0 0 8px rgba(232,195,99,.8)}
.xsd2-fan-play .xsd2-fan-burst i{animation:xsd2FanInkPop calc(.55s/var(--spd)) cubic-bezier(.2,.7,.4,1) calc(4.5s/var(--spd)) both}
@keyframes xsd2FanInkPop{0%{opacity:0;transform:translate(0,0) scale(.6)}18%{opacity:.95}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.35)}}
.xsd2-fan-red{position:absolute;inset:0;z-index:4;pointer-events:none;opacity:0;background:radial-gradient(300px 220px at 50% 30%,rgba(216,64,44,.3),transparent 75%)}
.xsd2-fan-play .xsd2-fan-red{animation:xsd2FanFlash calc(.3s/var(--spd)) ease-out calc(5.5s/var(--spd)) both}
.xsd2-fan-dust{position:absolute;inset:0;z-index:4;pointer-events:none}
.xsd2-fan-dust i{position:absolute;top:-8px;display:block;width:3px;height:3px;border-radius:50%;background:#F0CC6B;opacity:0}
.xsd2-fan-play .xsd2-fan-dust i{animation:xsd2FanDustFall calc(var(--t)*1s/var(--spd)) linear calc((5.2s + var(--d)*1s)/var(--spd)) infinite}
@keyframes xsd2FanDustFall{0%{opacity:0;transform:translate(0,0)}10%{opacity:.85}100%{opacity:0;transform:translate(var(--dx,6px),310px)}}
.xsd2-fan-veil{position:absolute;inset:0;z-index:5;pointer-events:none;background:radial-gradient(430px 430px at 50% 52%,rgba(10,14,20,.88),rgba(8,11,16,.985))}
.xsd2-fan-play .xsd2-fan-veil{animation:xsd2FanVeilOut calc(1s/var(--spd)) ease-out both}
@keyframes xsd2FanVeilOut{0%{opacity:1}55%{opacity:.4}100%{opacity:0}}
.xsd2-fan-emblem{position:absolute;top:170px;left:0;right:0;height:338px;z-index:2}
.xsd2-fan-card .in,.xsd2-fan-card .amb,.xsd2-fan-card .fall,.xsd2-fan-card .rip,.xsd2-fan-card .amb-all,.xsd2-fan-card .endglow,.xsd2-fan-card .halo{transform-box:fill-box}
.xsd2-fan-card .in-cup,.xsd2-fan-card .in-flameL,.xsd2-fan-card .in-flameR,.xsd2-fan-card .sway{transform-origin:50% 100%}
.xsd2-fan-card .in-splashL,.xsd2-fan-card .in-splashR,.xsd2-fan-card .in-dropC{transform-origin:50% 50%}
.xsd2-fan-card .breathC{transform-origin:50% 55%}
.xsd2-fan-card .rip{transform-origin:50% 50%}
.xsd2-fan-card .amb-all{transform-origin:50% 55%}
.xsd2-fan-card .rip,.xsd2-fan-card .flash,.xsd2-fan-card .endglow,.xsd2-fan-card .spark{opacity:0}
.xsd2-fan-play .in-cup{animation:xsd2FanCupIn calc(.5s/var(--spd)) cubic-bezier(.2,.8,.25,1) both}
.xsd2-fan-play .cupDip{animation:xsd2FanCupDip calc(.5s/var(--spd)) ease-out calc(1.3s/var(--spd)) both}
.xsd2-fan-play .fall{animation:xsd2FanFallDrop calc(.6s/var(--spd)) cubic-bezier(.5,0,.9,.45) calc(.8s/var(--spd)) both}
.xsd2-fan-play .flash{animation:xsd2FanFlash calc(.35s/var(--spd)) ease-out calc(1.28s/var(--spd)) both}
.xsd2-fan-play .rip1{animation:xsd2FanRipple calc(1s/var(--spd)) ease-out calc(1.32s/var(--spd)) both}
.xsd2-fan-play .rip2{animation:xsd2FanRipple calc(1s/var(--spd)) ease-out calc(1.5s/var(--spd)) both}
.xsd2-fan-play .in-flameL{animation:xsd2FanBurst calc(.8s/var(--spd)) cubic-bezier(.25,1.15,.35,1) calc(1.6s/var(--spd)) both}
.xsd2-fan-play .in-flameR{animation:xsd2FanBurst calc(.8s/var(--spd)) cubic-bezier(.25,1.15,.35,1) calc(1.6s/var(--spd)) both}
.xsd2-fan-play .in-splashL{animation:xsd2FanFlyL calc(.8s/var(--spd)) cubic-bezier(.3,.6,.3,1) calc(1.9s/var(--spd)) both}
.xsd2-fan-play .in-splashR{animation:xsd2FanFlyR calc(.8s/var(--spd)) cubic-bezier(.3,.6,.3,1) calc(1.9s/var(--spd)) both}
.xsd2-fan-play .in-dropC{animation:xsd2FanJumpUp calc(.75s/var(--spd)) cubic-bezier(.3,.9,.4,1) calc(2.8s/var(--spd)) both}
.xsd2-fan-play .halo{animation:xsd2FanHaloIn calc(.6s/var(--spd)) ease-out calc(2.9s/var(--spd)) both,xsd2FanHaloScale calc(2.6s/var(--spd)) ease-in-out calc(2.9s/var(--spd)) infinite alternate}
.xsd2-fan-play .endglow{animation:xsd2FanEndGlow calc(.9s/var(--spd)) ease-out calc(3.5s/var(--spd)) both}
.xsd2-fan-play .spark{animation:xsd2FanSparkUp calc(3.6s/var(--spd)) ease-out infinite;animation-delay:calc((3.4s + var(--i)*.45s)/var(--spd))}
@keyframes xsd2FanCupIn{0%{opacity:0;transform:translateY(26px) scale(.94)}100%{opacity:1;transform:none}}
@keyframes xsd2FanCupDip{0%{transform:none}30%{transform:translateY(6px)}65%{transform:translateY(-3px)}100%{transform:none}}
@keyframes xsd2FanFallDrop{0%{opacity:0;transform:translateY(-760px)}10%{opacity:1}90%{opacity:1;transform:translateY(-4px)}100%{opacity:0;transform:translateY(0)}}
@keyframes xsd2FanFlash{0%{opacity:0}30%{opacity:.9}100%{opacity:0}}
@keyframes xsd2FanRipple{0%{opacity:0;transform:scale(.22)}8%{opacity:.85}70%{opacity:.35}100%{opacity:0;transform:scale(1.04)}}
@keyframes xsd2FanBurst{0%{opacity:0;transform:scale(1,.03)}28%{opacity:1}68%{transform:scale(1,1.07) skewX(1.2deg)}100%{opacity:1;transform:none}}
@keyframes xsd2FanFlyL{0%{opacity:0;transform:translate(246px,109px) scale(.25)}22%{opacity:1}55%{transform:translate(56px,-2px) scale(.85)}78%{transform:translate(-8px,-14px) scale(1.04)}100%{opacity:1;transform:none}}
@keyframes xsd2FanFlyR{0%{opacity:0;transform:translate(-246px,109px) scale(.25)}22%{opacity:1}55%{transform:translate(-56px,-2px) scale(.85)}78%{transform:translate(8px,-14px) scale(1.04)}100%{opacity:1;transform:none}}
@keyframes xsd2FanJumpUp{0%{opacity:0;transform:translateY(288px) scale(.55,.62)}16%{opacity:1}55%{transform:translateY(-18px) scale(.96,1.08)}78%{transform:translateY(8px) scale(1.03,.97)}100%{opacity:1;transform:none}}
@keyframes xsd2FanHaloIn{0%{opacity:0}100%{opacity:.75}}
@keyframes xsd2FanHaloScale{from{transform:scale(.92)}to{transform:scale(1.08)}}
@keyframes xsd2FanEndGlow{0%{opacity:0;transform:scale(.85)}30%{opacity:.5}100%{opacity:0;transform:scale(1.1)}}
@keyframes xsd2FanSparkUp{0%{opacity:0;transform:translate(0,0)}12%{opacity:.85}55%{opacity:.45}100%{opacity:0;transform:translate(var(--dx,10px),-70px)}}
.xsd2-fan-play .amb-all{animation:xsd2FanBreath 4.4s ease-in-out infinite alternate}
.xsd2-fan-card .swayL{animation:xsd2FanSwayA 2.9s ease-in-out infinite alternate}
.xsd2-fan-card .swayR{animation:xsd2FanSwayB 3.2s ease-in-out infinite alternate}
.xsd2-fan-card .breathC{animation:xsd2FanDropBreath 2.8s ease-in-out infinite alternate}
.xsd2-fan-card .shimL{animation:xsd2FanShimmer 3.4s ease-in-out infinite}
.xsd2-fan-card .shimR{animation:xsd2FanShimmer 3.4s ease-in-out infinite;animation-delay:-1.7s}
@keyframes xsd2FanBreath{from{transform:scale(1)}to{transform:scale(1.008)}}
@keyframes xsd2FanSwayA{from{transform:rotate(-1.6deg) skewX(-1deg)}to{transform:rotate(1.4deg) skewX(1.2deg)}}
@keyframes xsd2FanSwayB{from{transform:rotate(1.4deg) skewX(1deg)}to{transform:rotate(-1.6deg) skewX(-1.2deg)}}
@keyframes xsd2FanDropBreath{from{transform:scale(.97)}to{transform:scale(1.03)}}
@keyframes xsd2FanShimmer{0%,100%{opacity:1}50%{opacity:.72}}
.xsd2-fan-play.xsd2-fan-card{animation:xsd2FanCardShake calc(.85s/var(--spd)) linear calc(3.93s/var(--spd))}
@keyframes xsd2FanCardShake{
  0%,100%{transform:none}
  5%{transform:translate(1.6px,-1px) rotate(.15deg)}
  9%{transform:translate(-1.6px,1px)}
  13%{transform:none}
  19%{transform:translate(-2px,1.4px) rotate(-.2deg)}
  23%{transform:translate(2px,-1.2px)}
  27%{transform:none}
  33%{transform:translate(2.3px,1.4px)}
  37%{transform:translate(-2.3px,-1.4px) rotate(.2deg)}
  41%{transform:none}
  47%{transform:translate(-2.6px,1.6px)}
  51%{transform:translate(2.6px,-1.6px) rotate(-.25deg)}
  55%{transform:none}
  62%{transform:translate(4px,-2.4px) rotate(.4deg)}
  68%{transform:translate(-4px,2.6px) rotate(-.4deg)}
  74%{transform:translate(3px,-1.6px)}
  80%{transform:translate(-1.6px,1px)}
  86%{transform:none}}
`;
function playedMap(doc) {
  try {
    const saved=JSON.parse(doc.defaultView.sessionStorage.getItem(STORE_KEY) || "{}");
    if(saved && typeof saved==="object" && !Array.isArray(saved))return saved;
  } catch {}
  return memory.get(doc) || {};
}
function markPlayed(doc, scope, id, stage) {
  const m=playedMap(doc),ledger=m[scope] && typeof m[scope]==="object" ? m[scope] : {};
  ledger[id]=Math.max(Number.isFinite(ledger[id])?ledger[id]:0,stage);m[scope]=ledger;
  memory.set(doc,m);
  try {doc.defaultView.sessionStorage.setItem(STORE_KEY,JSON.stringify(m));}catch{}
}
function emblemSvg(fan) {
  const p = fan.paths;
  const splash = (side, cls) => '<g class="in in-splash' + side + '"><g class="amb shim' + side + '">'
    + p["splash" + side].map(x => '<path fill="' + x.fill + '" d="' + x.d + '"/>').join("") + "</g></g>";
  return '<svg viewBox="0 0 1254 1254" aria-hidden="true"><defs>'
    + '<radialGradient id="xsd2FanGh" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#F0CC6B" stop-opacity=".45"/><stop offset="55%" stop-color="#D9A93C" stop-opacity=".16"/><stop offset="100%" stop-color="#D9A93C" stop-opacity="0"/></radialGradient>'
    + '<radialGradient id="xsd2FanGe" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#F0CC6B" stop-opacity=".4"/><stop offset="100%" stop-color="#D9A93C" stop-opacity="0"/></radialGradient></defs>'
    + '<circle class="endglow" cx="626" cy="740" r="430" fill="url(#xsd2FanGe)"/>'
    + '<g class="amb-all"><circle class="halo" cx="626" cy="600" r="175" fill="url(#xsd2FanGh)" opacity=".75"/>'
    + '<g transform="translate(626,852) scale(.55)"><g class="fall"><path fill="#DFAF40" fill-rule="evenodd" transform="translate(-627,-562)" d="' + p.dropC.d + '"/></g></g>'
    + '<g class="in in-flameL"><g class="amb swayL"><path fill="' + p.flameL.fill + '" fill-rule="evenodd" d="' + p.flameL.d + '"/></g></g>'
    + '<g class="in in-flameR"><g class="amb swayR"><path fill="' + p.flameR.fill + '" fill-rule="evenodd" d="' + p.flameR.d + '"/></g></g>'
    + '<g class="in in-cup"><g class="cupDip"><path fill="' + p.cup.fill + '" fill-rule="evenodd" d="' + p.cup.d + '"/></g></g>'
    + '<g class="rip rip1"><ellipse cx="626" cy="858" rx="235" ry="24" fill="none" stroke="#E8C363" stroke-width="5" vector-effect="non-scaling-stroke"/></g>'
    + '<g class="rip rip2"><ellipse cx="626" cy="858" rx="235" ry="24" fill="none" stroke="#E8C363" stroke-width="4" vector-effect="non-scaling-stroke"/></g>'
    + '<ellipse class="flash" cx="626" cy="856" rx="70" ry="10" fill="#F0CC6B"/>'
    + splash("L") + splash("R")
    + '<g class="in in-dropC"><g class="amb breathC"><path fill="' + p.dropC.fill + '" d="' + p.dropC.d + '"/></g></g>'
    + '<g><circle class="spark" style="--i:0;--dx:14px" cx="440" cy="470" r="7" fill="#E8C363"/><circle class="spark" style="--i:1;--dx:-12px" cx="810" cy="440" r="6" fill="#E8C363"/><circle class="spark" style="--i:2;--dx:20px" cx="600" cy="330" r="5" fill="#F0CC6B"/><circle class="spark" style="--i:3;--dx:-18px" cx="700" cy="300" r="7" fill="#F0CC6B"/><circle class="spark" style="--i:4;--dx:10px" cx="500" cy="640" r="5" fill="#E8C363"/></g></g></svg>';
}
function mountRelicFanfare(doc, container, data, options = {}) {
  let shared=styles.get(doc);
  if(!shared || !shared.style.isConnected){
    const style=doc.createElement("style");style.dataset.xsd2FanStyle="";style.textContent=CSS;doc.head.append(style);
    shared={style,count:0};styles.set(doc,shared);
  }
  shared.count++;
  const host=doc.createElement("div");host.className="xsd2-fan-host";host.hidden=true;
  host.dataset.xsd2RelicFanfare="";container.append(host);
  const clock=options.clock || doc.defaultView;
  let timer=null,fade=null,active=null,scope=null,disposed=false,restoreFocus=null;
  const instance="xsd2Fan"+(++serial);
  function clear(){
    clock.clearTimeout(timer);clock.clearTimeout(fade);timer=fade=null;
    host.replaceChildren();host.classList.remove("xsd2-fan-out");host.hidden=true;active=null;
    if(restoreFocus?.isConnected)restoreFocus.focus?.({preventScroll:true});restoreFocus=null;
  }
  function close(card){
    if(disposed || host.firstElementChild!==card)return;
    clock.clearTimeout(timer);clock.clearTimeout(fade);host.classList.add("xsd2-fan-out");
    fade=clock.setTimeout(clear,420);
  }
  function play(fan,id,stage) {
    clear();active={id,stage};host.hidden=false;restoreFocus=doc.activeElement;
    const card = doc.createElement("div");
    card.className = "xsd2-fan-card";
    card.title = "点击或按Esc跳过";card.tabIndex=0;card.setAttribute("role","button");card.setAttribute("aria-label",fan.name+"纹章揭幕，点击跳过");
    card.innerHTML = '<div class="xsd2-fan-mist"></div>'
      + '<div class="xsd2-fan-title"><p class="xsd2-fan-main"><span style="--d:0s">灼</span><span style="--d:.14s">酒</span><span style="--d:.28s">流</span><span style="--d:.42s">炎</span><span style="--d:.56s">穴</span></p>'
      + '<div class="xsd2-fan-rule"><i></i><b></b><i></i></div><p class="xsd2-fan-seal"><span>觉</span><span>醒</span></p></div>'
      + '<div class="xsd2-fan-emblem">' + emblemSvg(fan).replaceAll("xsd2FanGh",instance+"Gh").replaceAll("xsd2FanGe",instance+"Ge") + "</div>"
      + '<div class="xsd2-fan-burst"><i style="--dx:-102px;--dy:-30px"></i><i style="--dx:-64px;--dy:14px"></i><i style="--dx:-128px;--dy:18px"></i><i style="--dx:96px;--dy:-34px"></i><i style="--dx:132px;--dy:10px"></i><i style="--dx:58px;--dy:22px"></i></div>'
      + '<div class="xsd2-fan-dust"><i style="left:14%;--d:0;--t:4.6;--dx:8px"></i><i style="left:26%;--d:1.1;--t:5.2;--dx:-6px"></i><i style="left:38%;--d:.5;--t:4.2;--dx:10px"></i><i style="left:52%;--d:1.6;--t:5.6;--dx:-9px"></i><i style="left:64%;--d:.2;--t:4.4;--dx:7px"></i><i style="left:76%;--d:1.3;--t:5;--dx:-7px"></i><i style="left:86%;--d:.8;--t:4.8;--dx:9px"></i><i style="left:47%;--d:2;--t:5.4;--dx:-10px"></i></div>'
      + '<div class="xsd2-fan-red"></div><div class="xsd2-fan-veil"></div>';
    host.append(card);
    host.classList.remove("xsd2-fan-out");
    void card.offsetWidth;
    card.classList.add("xsd2-fan-play");
    card.addEventListener("click", () => close(card), { once: true });
    card.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();close(card);}});card.focus?.({preventScroll:true});
    timer = clock.setTimeout(() => close(card), 7600);
  }
  function check(s, opts = {}) {
    if(disposed)return;
    if(!s || opts.readOnly || s.pending || !data.rules || !host.isConnected){clear();return;}
    const nextScope=JSON.stringify([s.chatId,s.branchId||s.chatId,s.identity||s.stat_data?.身份]);
    if(nextScope!==scope){clear();scope=nextScope;}
    const played=playedMap(doc),ledger=played[scope] || {};
    const R=data.rules(s.stat_data),known=s.stat_data.known || s.known || {};
    const configs=Object.values(R.RELIC_PILOT_CONFIG || {});
    for(const [id,fan] of Object.entries(FANFARES)){
      const cfg=configs.find(c=>c.names.includes(id)||c.names.includes(fan.name));
      const stage=cfg?R.getRelicStage(cfg.id,known):0;
      if(active?.id===id && stage<active.stage)clear();
      if(!Object.hasOwn(ledger,id)){markPlayed(doc,scope,id,stage);continue;} // Cold loads are existing state, not new achievements.
      if(stage>=1 && stage>(Number.isFinite(ledger[id])?ledger[id]:0)){
        markPlayed(doc,scope,id,stage);
        if(doc.defaultView.matchMedia?.("(prefers-reduced-motion: reduce)").matches)return;
        play(fan,id,stage);return;
      }
    }
  }
  const escape=e=>{if(e.key==="Escape" && !host.hidden)close(host.firstElementChild);};
  doc.addEventListener("keydown",escape);
  return {check,destroy(){if(disposed)return;disposed=true;clear();doc.removeEventListener("keydown",escape);host.remove();
    if(--shared.count===0){shared.style.remove();styles.delete(doc);}
  }};
}
module.exports = { mountRelicFanfare };
