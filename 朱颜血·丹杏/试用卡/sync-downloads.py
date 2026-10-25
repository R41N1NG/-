"""gpt：同步当前已检查整卡的英文下载副本与ZIP，防止下载旧版。"""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import hashlib, json
base = Path(__file__).resolve().parent
source = base / '【朱颜血·丹杏】CCv3-刑狱状态栏试用.json'
data = source.read_bytes()
card = json.loads(data)
assert card['spec'] == 'chara_card_v3'
assert '<zyx_required_status_output>' in card['data']['description']
assert len(card['data']['extensions']['regex_scripts']) == 6
assert card['data']['extensions']['depth_prompt']['depth'] == 0
assert card['data']['extensions']['depth_prompt']['role'] == 'system'
import re
match = re.search(r'ZYX_STATUS_PROTOCOL_V([0-9]+)', card['data']['extensions']['depth_prompt']['prompt'])
assert match
version = match.group(1)
out = base.parent.parent / 'downloads'
out.mkdir(exist_ok=True)
(out / 'danxing-trial.json').write_bytes(data)
with ZipFile(out / 'danxing-trial.zip', 'w') as archive:
    info = ZipInfo('danxing-trial.json', date_time=(2026, 1, 1, 0, 0, 0))
    archive.writestr(info, data, compress_type=ZIP_DEFLATED, compresslevel=9)
manifest = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
            'features': ['identity-menu', 'prison-hud', 'core-output-contract', 'missing-report-notice', 'native-depth-prompt-v' + version, 'read-only-map', 'portrait-config-port', 'player-martial-ledger']}
# 固定版本文件方便区分旧下载；内容与latest一致。
(out / ('danxing-v' + version + '.json')).write_bytes(data)
(out / ('danxing-v' + version + '.zip')).write_bytes((out / 'danxing-trial.zip').read_bytes())
(out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(manifest, ensure_ascii=False))
