"""gpt：只同步PNG的chara/ccv3元数据，保留封面及其他块。"""
from pathlib import Path
import base64,json,struct,sys,zlib
card_path,png_path=map(Path,sys.argv[1:3]);card=json.loads(card_path.read_text());source=png_path.read_bytes()
assert source[:8]==b'\x89PNG\r\n\x1a\n'
def chunks(data):
 offset=8
 while offset<len(data):
  length=struct.unpack('>I',data[offset:offset+4])[0];kind=data[offset+4:offset+8];body=data[offset+8:offset+8+length];raw=data[offset:offset+length+12]
  assert zlib.crc32(kind+body)&0xffffffff==struct.unpack('>I',raw[-4:])[0]
  yield kind,body,raw;offset+=length+12
payload=base64.b64encode(json.dumps(card,ensure_ascii=False,separators=(',',':')).encode());result=[source[:8]];found=set()
for kind,body,raw in chunks(source):
 if kind==b'tEXt' and body.split(b'\0')[0] in [b'chara',b'ccv3']:
  key=body.split(b'\0')[0];found.add(key);body=key+b'\0'+payload;raw=struct.pack('>I',len(body))+kind+body+struct.pack('>I',zlib.crc32(kind+body)&0xffffffff)
 result.append(raw)
assert found=={b'chara',b'ccv3'}
result=b''.join(result)
kept=lambda data:[raw for kind,body,raw in chunks(data) if not(kind==b'tEXt' and body.split(b'\0')[0] in found)]
assert kept(result)==kept(source)
for kind,body,raw in chunks(result):
 if kind==b'tEXt' and body.split(b'\0')[0] in found:assert json.loads(base64.b64decode(body.split(b'\0',1)[1]))==card
png_path.write_bytes(result)
print('PNG双元数据与JSON一致；封面和其他块保持。')
