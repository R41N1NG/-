'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function buildCatalog(root){
 const base=path.join(root,'回忆相册'),entries=JSON.parse(fs.readFileSync(path.join(base,'目录.json'),'utf8'));
 if(!Array.isArray(entries))throw Error('回忆相册目录必须是数组');
 const catalog=entries.map(entry=>{
  if(!entry.file)return entry;
  if(entry.src)throw Error('相册图片不能同时指定 file 和 src');
  const full=fs.realpathSync(path.resolve(base,entry.file)),resources=fs.realpathSync(path.join(base,'资源'));
  if(!full.startsWith(resources+path.sep))throw Error('相册本地图片必须放在回忆相册/资源内');
  const mime={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.gif':'image/gif'}[path.extname(full).toLowerCase()];
  if(!mime)throw Error('相册图片格式不支持：'+entry.file);
  const {file,...rest}=entry;return{...rest,src:'data:'+mime+';base64,'+fs.readFileSync(full).toString('base64')};
 });
 const sandbox={OKH_ALBUM_CATALOG:catalog};vm.createContext(sandbox);
 for(const file of ['core/okh_utils.js','app/okh_app_tags.js','app/okh_app_echoes.js','app/okh_app_data.js','app/okh_app_album.js'])vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../src',file),'utf8'),sandbox,{filename:file});
 return catalog;
}
module.exports={buildCatalog};
