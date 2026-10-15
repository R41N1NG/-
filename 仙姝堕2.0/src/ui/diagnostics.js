"use strict";
function downloadDiagnostics(doc,runtime,view={}){
 const win=doc.defaultView,report={...runtime.getDiagnostics?.(),view,exportedAt:new Date().toISOString()};
 const blob=new win.Blob([JSON.stringify(report,null,2)],{type:"application/json"});
 const url=win.URL.createObjectURL(blob),a=doc.createElement("a");
 a.href=url;a.download="仙姝堕-报错诊断.json";a.hidden=true;doc.body.append(a);
 try{a.click();}finally{a.remove();win.setTimeout(()=>win.URL.revokeObjectURL(url),1000);}
}
module.exports={downloadDiagnostics};
