'use strict';
const memory=new Map();
function keyFor(s){return 'xsd2-player-avatar:'+String(s.chatId||'current')+':'+s.identity;}
function read(doc,s){const key=keyFor(s);try{return doc.defaultView.localStorage.getItem(key)||memory.get(key)||'';}catch{return memory.get(key)||'';}}
function save(doc,s,url){const key=keyFor(s);try{doc.defaultView.localStorage.setItem(key,url);}catch(error){throw Error('头像保存失败：'+error.message);}memory.set(key,url);}
function mountPlayerAvatar(doc,slot,s,options={},report){
 const b=doc.createElement('button');b.type='button';b.dataset.playerAvatar='';b.setAttribute('aria-label','上传或替换玩家头像');
 const input=doc.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';input.hidden=true;input.dataset.playerAvatarFile='';
 const image=doc.createElement('img');image.className='xsd2-avatar';image.alt='玩家头像';
 const url=read(doc,s)||options.getPlayerAvatar?.()||'';
 if(url){image.src=url;image.onerror=()=>{b.replaceChildren(doc.createTextNode('上传头像'));};b.append(image);}else b.textContent='上传头像';
 b.onclick=()=>input.click();input.onchange=async()=>{
  const file=input.files?.[0];if(!file)return;
  try{
   if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('请选择PNG、JPEG或WebP图片');
   const win=doc.defaultView,blob=win.URL.createObjectURL(file),loaded=new win.Image();
   try{await new Promise((resolve,reject)=>{loaded.onload=resolve;loaded.onerror=()=>reject(Error('图片无法读取'));loaded.src=blob;});
    const ratio=Math.min(1,1024/Math.max(loaded.naturalWidth,loaded.naturalHeight)),canvas=doc.createElement('canvas');canvas.width=Math.max(1,Math.round(loaded.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(loaded.naturalHeight*ratio));canvas.getContext('2d').drawImage(loaded,0,0,canvas.width,canvas.height);
    const result=canvas.toDataURL('image/webp',.92);save(doc,s,result);image.src=result;b.replaceChildren(image);
   }finally{win.URL.revokeObjectURL(blob);}
  }catch(error){report?.(error);}finally{input.value='';}
 };slot.append(b,input);
 return ()=>{b.remove();input.remove();};
}
module.exports={mountPlayerAvatar,read,keyFor};
