from pathlib import Path
import json,os
root=Path(__file__).resolve().parents[2]/'图片';formal=root/'正式素材';entries=json.loads((root/'生成清单.json').read_text())
assets=[e for e in entries if '/anchors/' not in e['source_path']];anchors=[e for e in entries if '/anchors/' in e['source_path']]
ready=lambda seq:sum(e['status']=='generated' for e in seq)
category_names=['人物锚点','头饰','上装','下装','袜子','鞋子']
lines=['# 正式素材总目录','','[返回服装插画总目录](../README.md)','','统一为灰调柔和厚涂插画；同一变体固定人物比例；各视角使用对应方向锚点，并对照同款服装细节。','','## 生成进度','',f'- 独立服装素材：{ready(assets)} / 185 张。',f'- 独立人物锚点：{ready(anchors)} / 10 张。','- 参考合图不计入上述数量。生成状态与视觉验收状态分别记录。','- 特写图缩小交付：头饰和鞋子最长边不超过512；上装、下装和袜子不超过512×768。按用户许可纯裁切后的实际尺寸逐张标注，不拉伸凑尺寸。全身锚点1024×1536，上装锚点768×1024，另计。当前仓库以交付文件为准，原始生成源路径仅作历史记录。','','## 分类目录','','| 分类 | 已生成 / 目标 | 索引 |','| --- | --- | --- |']
for category in category_names:
 seq=[e for e in entries if e['relative_path'].split('/')[0]==category]
 done=[e for e in seq if e['status']=='generated'];d=formal/category
 if done:
  d.mkdir(parents=True,exist_ok=True)
  cl=[f'# {category}','','[返回正式素材总目录](../README.md)','',f'已生成 {len(done)} / {len(seq)} 张。','','| 素材 | 图片 | 交付尺寸 | 视觉验收 |','| --- | --- | --- | --- |']
  for e in done:
   rel=Path(e['relative_path']).relative_to(category)
   cl.append(f'| {str(rel.with_suffix("")).replace("/"," · ")} | [查看图片]({rel.as_posix()}) | {e["actual_dimensions"]} | {e.get("review","待核验")} |')
  (d/'README.md').write_text('\n'.join(cl)+'\n')
 lines.append(f'| {category} | {len(done)} / {len(seq)} | '+(f'[查看]({category}/README.md)' if done else '待生成')+' |')
lines+=['','## 制作约定','','服装清单对应原附件的 185 张素材。全身锚点只改变发型；上装按通用版／长发版与三种胸围规格区分；只改变衣服胸围，肩宽、腰线、腰围、臀围及其他部位固定。通用版画面内完全无头发。头饰按发型区分，下装、袜子和鞋子共用。','', '[逐张生成记录](../生成清单.json)']
formal.mkdir(exist_ok=True);(formal/'README.md').write_text('\n'.join(lines)+'\n')
p=root/'README.md';s=p.read_text()
s=s.replace('[上一版写实例图](../wardrobe-samples/)','')
start=s.find('## 正式素材进度')
if start>=0:s=s[:start]
s+='\n## 正式素材进度\n\n'+f'已生成独立服装素材 **{ready(assets)} / 185** 张、独立人物锚点 **{ready(anchors)} / 10** 张。\n\n[打开正式素材总目录](正式素材/README.md) · [逐张清单](生成清单.json)\n'
p.write_text(s)
print(f'索引已更新：素材 {ready(assets)}/185，锚点 {ready(anchors)}/10。')

# Per-garment Chinese indexes; only folders with actual generated images are linked.
for category in category_names[1:]:
    cat_entries=[e for e in assets if e['relative_path'].split('/')[0]==category]
    groups=sorted({e['relative_path'].split('/')[1] for e in cat_entries})
    group_rows=[]
    for garment in groups:
        group=[e for e in cat_entries if e['relative_path'].split('/')[1]==garment]
        done=[e for e in group if e['status']=='generated']
        if not done:continue
        folder=formal/category/garment
        folder.mkdir(parents=True,exist_ok=True)
        text=[f'# {garment}','','[返回分类目录](../README.md) · [返回总目录](../../README.md)','',f'已生成 {len(done)} / {len(group)} 个目标文件。各文件的自检状态单独列出。','','| 版本／规格 | 视角 | 图片 | 尺寸 | 自检 |','| --- | --- | --- | --- | --- |']
        for e in done:
            rel=Path(e['relative_path']).relative_to(Path(category)/garment)
            variant=' · '.join(rel.parts[:-1]) or '共用'
            text.append(f'| {variant} | {rel.stem} | [查看]({rel.as_posix()}) | {e["actual_dimensions"]} | {e.get("review","待自检")} |')
        text+=['','[统一制作规范](../../../制作规范.md)']
        if category=='上装':text+=['','[正／侧／背方向参考](../../../方向锚点/README.md)','', '胸围规格只调整衣料上胸区版型，肩、腰、胯保持不变；不影响可见背部结构的规格复用同款背面，清单注明复用原因。']
        (folder/'README.md').write_text('\n'.join(text)+'\n')
        group_rows.append(f'| [{garment}]({garment}/README.md) | {len(done)} / {len(group)} |')
    index=formal/category/'README.md'
    if group_rows and index.exists():
        index.write_text(index.read_text()+'\n## 按款式查找\n\n| 款式 | 已生成 / 目标 |\n| --- | --- |\n'+'\n'.join(group_rows)+'\n')
p=root/'README.md'
p.write_text(p.read_text()+'\n## 独立方向参考\n\n[查看纯正面／纯侧面／纯背面方向锚点](方向锚点/README.md)\n')
