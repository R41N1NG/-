/* gpt：只读比较两个JSON；输出差异路径及摘要，不输出字段内容。 */
const fs=require('node:fs'),crypto=require('node:crypto');
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
function differences(a,b,p='$',out=[]){
 if(Object.is(a,b))return out;
 const obj=v=>v!==null&&typeof v==='object';
 if(obj(a)&&obj(b)&&Array.isArray(a)===Array.isArray(b)){
  for(const k of new Set([...Object.keys(a),...Object.keys(b)])){
   const q=p+'['+JSON.stringify(k)+']';
   if(!Object.hasOwn(a,k)||!Object.hasOwn(b,k))out.push({path:q,kind:Object.hasOwn(a,k)?'仅前件':'仅后件'});
   else differences(a[k],b[k],q,out);
  }
 }else out.push({path:p,kind:'值不同',beforeSHA256:hash(JSON.stringify(a)),afterSHA256:hash(JSON.stringify(b))});
 return out;
}
function main(){
 if(!process.argv[2]||!process.argv[3])throw Error('用法：node 比较构建JSON.cjs stage.json build.json');
 const [a,b]=process.argv.slice(2,4).map(p=>fs.readFileSync(p)),diff=differences(JSON.parse(a),JSON.parse(b));
 console.log(JSON.stringify({identity:'gpt',files:[a,b].map(v=>({bytes:v.length,SHA256:hash(v)})),structurallyEqual:!diff.length,differenceCount:diff.length,paths:diff.slice(0,100),truncated:diff.length>100},null,2));
}
module.exports={differences};
if(require.main===module){try{main();}catch(e){console.error(e.message);process.exitCode=1;}}
