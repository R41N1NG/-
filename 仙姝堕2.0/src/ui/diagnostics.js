"use strict";
const {modal}=require('./dom');
function downloadDiagnostics(doc,runtime,view={}){
 const win=doc.defaultView,report={...runtime.getDiagnostics?.(),view,exportedAt:new Date().toISOString()},text=JSON.stringify(report,null,2);
 doc.querySelector('[data-xsd2-diagnostic]')?.remove();
 const el=modal(doc,'报错诊断');el.dataset.xsd2Diagnostic='';
 const body=el.querySelector('.xsd2-dialog-body'),status=doc.createElement('p'),area=doc.createElement('textarea'),copy=doc.createElement('button'),save=doc.createElement('button');
 status.setAttribute('role','status');area.value=text;area.readOnly=true;area.setAttribute('aria-label','诊断全文');area.style.cssText='box-sizing:border-box;width:100%;height:35vh';
 copy.type=save.type='button';copy.textContent='复制诊断全文';save.textContent='再次下载JSON';copy.dataset.diagnosticCopy='';save.dataset.diagnosticSave='';
 const select=()=>{area.focus();area.select();};
 copy.onclick=async()=>{try{if(win.navigator.clipboard?.writeText)await win.navigator.clipboard.writeText(text);else{select();if(!doc.execCommand?.('copy'))throw Error('copy unavailable');}status.textContent='诊断已复制，可粘贴发送。';}catch{select();status.textContent='自动复制未获允许，诊断全文已选中，请使用系统复制。';}};
 const download=()=>{let url;try{
  const blob=new win.Blob([text],{type:'application/json'});url=win.URL.createObjectURL(blob);
  const a=doc.createElement('a');a.href=url;a.download='仙姝堕-报错诊断.json';a.textContent='保存诊断JSON';body.append(a);a.click();a.remove();
  status.textContent='已请求浏览器下载。若未出现文件，请点击“复制诊断全文”。';
 }catch{status.textContent='浏览器未能启动下载，请复制诊断全文。';}finally{if(url)win.setTimeout(()=>win.URL.revokeObjectURL(url),30000);}};
 save.onclick=download;body.append(status,copy,save,area);download();return ()=>el.remove();
}
module.exports={downloadDiagnostics};
