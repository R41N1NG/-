from pathlib import Path
from urllib.parse import unquote
import hashlib,json,re,struct

PROJECT=Path(__file__).resolve().parents[2]
REPO=PROJECT.parent
PICTURES=PROJECT/'图片'

def validate():
    entries=json.loads((PICTURES/'生成清单.json').read_text())
    for e in entries:
        if e['status']!='generated':
            continue
        path=REPO/e['output']
        if Path(e['output']).is_absolute() or not path.resolve().is_relative_to(PICTURES):
            raise ValueError('目标路径必须在项目图片内且相对仓库根：'+e['output'])
        data=path.read_bytes()
        if data[:8]!=b'\x89PNG\r\n\x1a\n':
            raise ValueError('不是PNG：'+str(path))
        w,h=struct.unpack('>II',data[16:24])
        if e['sha256']!=hashlib.sha256(data).hexdigest() or e['actual_dimensions']!=f'{w}x{h}':
            raise ValueError('尺寸或SHA不符：'+str(path))
    folder=PICTURES/'背景风格样张/藏青西装套装'
    samples=json.loads((folder/'样张清单.json').read_text())
    for e in samples:
        data=(folder/e['path']).read_bytes()
        w,h=struct.unpack('>II',data[16:24])
        if e['sha256']!=hashlib.sha256(data).hexdigest() or e['dimensions']!=f'{w}x{h}':
            raise ValueError('样张尺寸或SHA不符：'+e['path'])
    for md in PROJECT.rglob('README.md'):
        for target in re.findall(r'\]\(([^)]+)\)',md.read_text()):
            if '://' in target or target.startswith('#'):
                continue
            if not (md.parent/unquote(target.split('#')[0])).exists():
                raise ValueError('链接不存在：'+str(md)+' -> '+target)
    return {'正式目标文件':sum('/anchors/' not in e['source_path'] for e in entries),'人物锚点':sum('/anchors/' in e['source_path'] for e in entries),'样张及参考':len(samples),'PNG总数':len(list(PICTURES.rglob('*.png'))),'校验':'尺寸、SHA-256、路径及README链接通过'}

if __name__=='__main__':
    print(json.dumps(validate(),ensure_ascii=False))
