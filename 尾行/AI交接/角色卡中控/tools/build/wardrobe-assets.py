"""将现有正式侧面素材压缩内嵌，避免角色卡依赖另装 user/images 图包。"""
from pathlib import Path
import json,hashlib,base64,io
from PIL import Image
root=Path(__file__).resolve().parents[5]
project=Path(__file__).resolve().parents[2]
items=json.loads((root/'尾行/图片/生成清单.json').read_text(encoding='utf-8'))
images={};sources=[]
for item in items:
    key=item.get('source_path','').removeprefix('assets/wardrobe/')
    if not key.endswith('/side.png'):continue
    src=root/item['output']
    if not src.is_file():raise FileNotFoundError(src)
    im=Image.open(src).convert('RGB');im.thumbnail((384,552))
    out=io.BytesIO();im.save(out,format='JPEG',quality=82,optimize=True)
    images[key]='data:image/jpeg;base64,'+base64.b64encode(out.getvalue()).decode()
    sources.append({'file':item['output'],'key':key,'sha256':hashlib.sha256(src.read_bytes()).hexdigest()})
(project/'src/ui/generated/wardrobe-images.json').write_text(json.dumps({'images':images,'sources':sources},ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
print('embedded side images:',len(images))
