/* gpt：绑定原始正文和当前候选的短指纹；不把自身后台快照算入输入。 */
(function(global){
 'use strict';
 function fingerprint(message){const text=JSON.stringify([message?.mes??message?.message??'',message?.swipe_id??0,message?.extra?.zyx_opening??null]);let a=2166136261,b=5381;for(let i=0;i<text.length;i++){const code=text.charCodeAt(i);a=Math.imul(a^code,16777619)>>>0;b=(Math.imul(b,33)^code)>>>0;}return text.length+':'+a.toString(16)+':'+b.toString(16);}
 const api={fingerprint};global.ZYXFingerprint=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);
