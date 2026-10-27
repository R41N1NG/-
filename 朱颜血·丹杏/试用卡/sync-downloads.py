"""gpt：同步当前已检查整卡的英文下载副本与ZIP，防止下载旧版。"""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import hashlib, json, argparse, re
base = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description='同步明确指定的已检查成品')
parser.add_argument('--source', type=Path)
parser.add_argument('--release', help='固定下载文件标签，例如zero-fix1；不改变协议版本')
args = parser.parse_args()
if args.release and not re.fullmatch(r'[a-z0-9][a-z0-9-]*', args.release):
    parser.error('release只允许小写字母、数字和连字符')
source = args.source.resolve() if args.source else base / '【朱颜血·丹杏】CCv3-刑狱状态栏试用.json'
data = source.read_bytes()
card = json.loads(data)
assert card['spec'] == 'chara_card_v3'
assert '<zyx_required_status_output>' in card['data']['description']
assert len(card['data']['extensions']['regex_scripts']) == 6
assert card['data']['extensions']['depth_prompt']['depth'] == 0
assert card['data']['extensions']['depth_prompt']['role'] == 'system'
match = re.search(r'ZYX_STATUS_PROTOCOL_V([0-9]+)', card['data']['extensions']['depth_prompt']['prompt'])
assert match
version = match.group(1)
release = args.release or ('v' + version)
out = base.parent.parent / 'downloads'
out.mkdir(exist_ok=True)
(out / 'danxing-trial.json').write_bytes(data)
with ZipFile(out / 'danxing-trial.zip', 'w') as archive:
    info = ZipInfo('danxing-trial.json', date_time=(2026, 1, 1, 0, 0, 0))
    archive.writestr(info, data, compress_type=ZIP_DEFLATED, compresslevel=9)
manifest = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
            'release': release,
            'source': str(source.relative_to(base.parent.parent)) if source.is_relative_to(base.parent.parent) else source.name,
            'worldbook_entries': len(card['data'].get('character_book', {}).get('entries', [])),
            'features': ['identity-menu', 'prison-hud', 'core-output-contract', 'native-depth-prompt-v' + version, 'read-only-map', 'portrait-config-port', 'player-martial-ledger']}
if release in ('hud-fix2', 'start-map-fix3', 'control-fix4', 'backend-v1', 'backend-v3', 'backend-v4'):
    manifest['features'] += ['prison-roster', 'turn-elapsed-log']
if release in ('start-map-fix3', 'control-fix4', 'backend-v1', 'backend-v3', 'backend-v4'):
    manifest['features'].remove('read-only-map')
    manifest['features'] += ['image-map-port', 'identity-opening-selection']
if release in ('control-fix4', 'backend-v1', 'backend-v3', 'backend-v4'):
    manifest['features'] += ['eight-character-custody', 'scoped-runtime-coordinator']
if release in ('backend-v1', 'backend-v3', 'backend-v4'):
    manifest['features'] += ['independent-character-backend', 'authoritative-clock', 'confirmed-clue-progress', 'configurable-node-conditions', 'native-message-snapshots']
if release in ('backend-v3', 'backend-v4'):
    manifest['features'] += ['single-writer', 'protocol-v8', 'evidence-events-intelligence', 'dynamic-custody-roster', 'current-request-npc-profiles', 'v2-art-preserved']
if release == 'backend-v4':
    manifest['features'] += ['invalid-report-recovery', 'committed-opening-ledger', 'atomic-intel-batches', 'negative-custody-portrait', 'prefix-safe-person-swap', 'elapsed-history-dialog', 'custody-permission-revocation']
# 固定版本文件方便区分旧下载；内容与latest一致。
(out / ('danxing-' + release + '.json')).write_bytes(data)
(out / ('danxing-' + release + '.zip')).write_bytes((out / 'danxing-trial.zip').read_bytes())
(out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(manifest, ensure_ascii=False))
