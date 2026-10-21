const fs=require("fs");
const rows=fs.readFileSync("work/art/jk-wardrobe-v3.jsonl","utf8").trim().split("\n").map(JSON.parse);
const idx=JSON.parse(fs.readFileSync("work/art/index.json","utf8"));
const byId=new Map();
for(const r of rows){
  if(!byId.has(r.id)) byId.set(r.id,{id:r.id,name:r.name,slot:r.slot,angles:new Set()});
  byId.get(r.id).angles.add(r.angle);
}
const items=[...byId.values()].map(o=>({id:o.id,name:o.name,slot:o.slot,angles:[...o.angles]}));
const out={
  note:"服装图鉴：变体规则 head→发型、top→通用/长发×体型、bottom/socks/shoes→共用",
  variants:{hair:["long","ponytail","twintails","bob"],body:["slim","normal","full"]},
  items,
  outfits:idx.targets.jk.outfits
};
fs.writeFileSync("src/config/wardrobe.json",JSON.stringify(out,null,2),"utf8");
console.log("items",items.length,"outfits",Object.keys(out.outfits).length);
