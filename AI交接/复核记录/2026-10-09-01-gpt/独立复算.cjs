'use strict';
// gpt：只读复算上传条件子集及完整生产函数差异，不是当前整卡/宿主验收。
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../下级更新/2026-10-08-18-gpt17落实/材料');
const file='24b_阶段条子集（metadata＋完整门）.json';
const raw=fs.readFileSync(path.join(root,file));
const subset=JSON.parse(raw), ejs=require(process.argv[2]);
const groups=new Map(), stages=['一','二','三','四'];
for(const entry of subset.明细){
 const m=/^【名器·阶段】([^、]+)、([一二三四])阶段/.exec(entry.comment);
 if(!m)continue;
 if(!groups.has(m[1]))groups.set(m[1],new Map());
 groups.get(m[1]).set(stages.indexOf(m[2]),entry);
}
const byName=[];
for(const [name,group] of groups){
 let structuralFailures=0, semanticFailures=0, overlap=0;
 for(const formed of [false,true])for(let mask=0;mask<16;mask++){
  const known={极乐引入手:true,[name+'成形']:formed};
  stages.forEach((s,i)=>known[name+s+'阶段']=!!(mask&(1<<i)));
  const actual=[];
  for(const [i,entry] of group){
   const m=/^@@if[ \t]+(.+)$/.exec(entry.首行完整门);
   if(!m)throw Error('条件门缺失');
   const out=ejs.render('<%- !!('+m[1]+') %>',{variables:{stat_data:{身份:'赵无忧',段位:7,仙盟历:1577.07,known}}},{});
   if(out!=='false')actual.push(i);
  }
  let want=[];
  if(formed)for(let i=3;i>=0;i--)if(mask&(1<<i)){want=[i];break;}
  if(group.size!==4)structuralFailures++;
  if(JSON.stringify(actual)!==JSON.stringify(want))semanticFailures++;
  if(actual.length>1)overlap++;
 }
 byName.push({name,stages:group.size,structuralFailures,semanticFailures,overlap});
}
const patch=fs.readFileSync(path.join(root,'18i_diff_状态机-本批全部改动（时钟拒绝＋自由字段闸＋派生账本与回退）.patch'),'utf8');
const additions=patch.split('\n').filter(l=>l.startsWith('+')&&!l.startsWith('+++')).map(l=>l.slice(1)).join('\n');
const start=additions.indexOf('function deriveRelicClosure(inp) {'),end=additions.indexOf('\n}\n',start)+2;
if(start<0||end<=start)throw Error('完整函数提取失败');
const source=additions.slice(start,end), context=vm.createContext({});
vm.runInContext(source,context);
const probe=context.deriveRelicClosure({known:{楚灵夜处女丧失:true,楚灵夜后窍开发:true,般若菩提菊成形:false},ledger:{般若菩提菊成形:{来源:[{类型:'人工',键:'人工关闭'}]}}});
console.log(JSON.stringify({scope:'24b旧基线条件子集；18i上传生产函数单测',subsetSHA256:crypto.createHash('sha256').update(raw).digest('hex'),cardReportedSHA256:subset.卡SHA256,cases:groups.size*32,byName,deriveSourceSHA256:crypto.createHash('sha256').update(source).digest('hex'),manualFalseProbe:{autoReasserted:probe.news.includes('般若菩提菊成形'),news:probe.news}},null,2));
