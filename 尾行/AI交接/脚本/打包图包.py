from pathlib import Path
from urllib.parse import quote
import hashlib,json,os,runpy,zipfile

PROJECT=Path(__file__).resolve().parents[2]
REPO=PROJECT.parent
validation=runpy.run_path(str(Path(__file__).with_name('校验图包.py')))['validate']()
folder=REPO/'图包下载'
folder.mkdir(exist_ok=True)
name='服装插画图包-20261020.zip'
dest=folder/name
temp=folder/(name+'.tmp')
try:
    files=sorted(p for p in PROJECT.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc')
    with zipfile.ZipFile(temp,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for path in files:
            z.write(path,path.relative_to(REPO).as_posix())
    with zipfile.ZipFile(temp) as z:
        bad=z.testzip()
        if bad:
            raise ValueError('ZIP校验失败：'+bad)
    size=temp.stat().st_size
    if size>=100*1024*1024:
        raise ValueError('图包达到GitHub单文件100MiB上限；请调整分包方案。')
    os.replace(temp,dest)
finally:
    if temp.exists():temp.unlink()
digest=hashlib.sha256(dest.read_bytes()).hexdigest()
(folder/(name+'.sha256')).write_text(digest+'  '+name+'\n')
url='https://github.com/R41N1NG/-/raw/refs/heads/main/'+quote('图包下载/'+name)
(folder/'README.md').write_text('# 图包下载\n\n[下载 ZIP 图包]('+url+')\n\n大小：'+f'{size/1024/1024:.1f} MiB'+'。包内统一为“尾行”文件夹，包含217张图片、中文索引、最新样张、制作规范和AI交接资料。\n\n[项目目录](../尾行/README.md) · [AI交接](../尾行/AI交接/README.md)\n\n185个正式目标文件与7张最新样张及机位参考分别记录。两项下装上楼动态仍未完成，交接和样张目录均已注明。\n\n[SHA-256校验文件]('+name+'.sha256)\n')
print(json.dumps({**validation,'压缩包':str(dest),'MiB':round(size/1024/1024,1),'SHA256':digest,'下载':url},ensure_ascii=False))
