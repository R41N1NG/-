"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const vm = require("node:vm");
const { createTutorialPolicy, TUTORIAL_KEY } = require("../src/ui/zero-floor/tutorial-policy");
const { buildUI } = require("../tools/build/ui");
const tick = () => new Promise((r) => setTimeout(r, 0));
test("教程策略：读完只在本次开局略过，全跳过持久保留且覆盖未来章节", () => {
  const dom = new JSDOM("", { url:"https://local.test" });
  try {
    const p = createTutorialPolicy(dom.window);
    assert.equal(p.shouldShow("player"),true);
    p.complete("player");assert.equal(p.shouldShow("player"),false);
    p.resetSession();assert.equal(p.shouldShow("player"),true);
    assert.equal(p.skipAll(),true);
    const loaded = createTutorialPolicy(dom.window);
    assert.equal(loaded.isSkipped(),true);
    loaded.resetSession();
    for (const id of ["player","target","first-training","future-unregistered-lesson"]) assert.equal(loaded.shouldShow(id),false);
    assert.deepEqual(JSON.parse(dom.window.localStorage.getItem(TUTORIAL_KEY)),{version:1,skipAll:true});
  } finally {dom.window.close();}
});
test("教程策略：损坏偏好不误关闭；存储不可用仍能在本页面跳过", () => {
  const dom = new JSDOM("",{url:"https://local.test"});
  try {
    for (const value of ["bad-json",'{"version":99,"skipAll":true}','{"version":1,"skipAll":"true"}']) {
      dom.window.localStorage.setItem(TUTORIAL_KEY,value);assert.equal(createTutorialPolicy(dom.window).isSkipped(),false);
    }
    const blocked=createTutorialPolicy({get localStorage(){throw Error("denied");}});
    assert.equal(blocked.shouldShow("player"),true);assert.equal(blocked.skipAll(),false);assert.equal(blocked.shouldShow("future"),false);
  } finally {dom.window.close();}
});
async function mount({ savedPreference=false, newGame=async()=>{} }={}) {
  const {bodyHtml,script}=buildUI({preview:false,writePreview:false});
  const dom=new JSDOM('<div id="chat"><div class="mes" mesid="0"><div class="mes_text">opening</div></div></div><div class="trpg">'+bodyHtml+'</div>',{url:"https://local.test",runScripts:"dangerously",pretendToBeVisual:true});
  const w=dom.window,d=w.document;
  w.HTMLCanvasElement.prototype.getContext=()=>null;
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event("close"));};
  w.getVariables=async()=>({});w.WxGlue={newGame};
  if(savedPreference)w.localStorage.setItem(TUTORIAL_KEY,JSON.stringify({version:1,skipAll:true}));
  vm.runInContext(script,dom.getInternalVMContext());w.WxStatusbarUI.mountStatusbar(d,w);await tick();
  return {dom,w,d};
}
test("属性课分别挡在创角和选目标之前，阅读不生成目标或建档，未来教程统一受开关约束",async()=>{
  let starts=0;const {dom,w,d}=await mount({newGame:async()=>{starts++;}});
  try {
    const lesson=d.getElementById("zeroAttributeLesson"),next=d.getElementById("attributeLessonContinue");
    assert.equal(lesson.hidden,false);assert.equal(lesson.dataset.attributeCourse,"player");assert.equal(d.getElementById("zeroStep1").hidden,true);
    assert.equal(d.getElementById("targetGrid").children.length,0);
    next.click();assert.equal(d.getElementById("zeroStep1").hidden,false);
    d.querySelector('#quickPane [data-preset="otaku"]').click();d.getElementById("zeroNextStep").click();
    assert.equal(lesson.hidden,false);assert.equal(lesson.dataset.attributeCourse,"target");assert.equal(d.getElementById("zeroStep2").hidden,true);
    assert.equal(d.getElementById("targetGrid").children.length,0);assert.equal(starts,0);
    next.click();assert.equal(d.getElementById("zeroStep2").hidden,false);assert.ok(d.getElementById("tDetailRealName").textContent);
    d.getElementById("zeroPrevStep").click();assert.equal(d.getElementById("zeroStep1").hidden,false);
    d.getElementById("zeroNextStep").click();assert.equal(d.getElementById("zeroStep2").hidden,false,"读完章节返回不重复阻挡");
    const extension=d.createElement("div");extension.id="futureLesson";extension.hidden=true;d.getElementById("wx-zero-floor").append(extension);
    w.WxStatusbar.zeroFloor.registerStep("future",{viewId:"futureLesson",tutorialId:"future"});
    d.getElementById("tutorialSkipAll").click();
    assert.equal(w.WxStatusbar.zeroFloor.go("future"),false);assert.equal(extension.hidden,true);assert.equal(starts,0);
    assert.equal(d.getElementById("zeroStepTab3").hidden,true);assert.equal(w.WxStatusbar.zeroFloor.go(3),false);
  }finally{w.WxStatusbar.dispose();dom.window.close();}
});
test("全跳过后目标确认直接建局；失败保留选择且可重试，等待期间防重复提交，重新挂载继续跳过",async()=>{
  let starts=0,reject;
  const {dom,w,d}=await mount({newGame:()=>{starts++;return starts===1?new Promise((_,r)=>{reject=r;}):Promise.resolve();}});
  try{
    d.getElementById("tutorialSkipAll").click();assert.equal(d.getElementById("zeroStep1").hidden,false);
    assert.equal(d.getElementById("tutorialSkipAll").hidden,true);
    d.querySelector('#quickPane [data-preset="otaku"]').click();d.getElementById("zeroNextStep").click();assert.equal(d.getElementById("zeroStep2").hidden,false);
    const name=d.getElementById("tDetailRealName").textContent,confirm=d.getElementById("createConfirm");
    confirm.click();confirm.click();assert.equal(starts,1);assert.equal(confirm.disabled,true);assert.equal(d.getElementById("tDetailReroll").disabled,true);
    reject(Error("测试失败"));await tick();assert.equal(d.getElementById("zeroCreationError").hidden,false);assert.equal(d.getElementById("zeroStep3").hidden,true);
    assert.equal(d.getElementById("tDetailRealName").textContent,name);confirm.click();await tick();assert.equal(starts,2);assert.equal(d.getElementById("wx-zero-floor").hidden,true);
    w.WxStatusbarUI.mountStatusbar(d,w);await tick();assert.equal(d.getElementById("zeroAttributeLesson").hidden,true);assert.equal(d.getElementById("zeroStep1").hidden,false);
    w.WxStatusbar.reset();assert.equal(d.getElementById("zeroAttributeLesson").hidden,true);assert.equal(d.getElementById("zeroStepTab3").hidden,true);
  }finally{w.WxStatusbar.dispose();dom.window.close();}
});
test("从五页教程中一键跳过会隐藏教程并沿正式开局入口继续",async()=>{
  let starts=0;const {dom,w,d}=await mount({newGame:async()=>{starts++;}});
  try{
    d.getElementById("attributeLessonContinue").click();d.querySelector('#quickPane [data-preset="otaku"]').click();d.getElementById("zeroNextStep").click();d.getElementById("attributeLessonContinue").click();d.getElementById("createConfirm").click();
    assert.equal(d.getElementById("zeroStep3").hidden,false);d.getElementById("trainingBriefSkip").click();await tick();assert.equal(starts,1);assert.equal(d.getElementById("zeroStep3").hidden,true);assert.equal(d.getElementById("wx-zero-floor").hidden,true);
    assert.equal(JSON.parse(w.localStorage.getItem(TUTORIAL_KEY)).skipAll,true);
  }finally{w.WxStatusbar.dispose();dom.window.close();}
});
